<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-vrodos-asset-origin.php';

require_once __DIR__ . '/class-vrodos-text-asset-helper.php';

/** Publishes immutable, content-addressed copies required by one build. */
final class VRodos_Compiler_Resource_Publisher {
	private const INVENTORY_META = '_vrodos_published_inventory';
	private const LARGE_SOURCE_PUBLISH_GATE_BYTES = 104857600;
	private const SURFACE_TEXTURE_ROLE = 'surface-textures';
	private const SURFACE_TEXTURE_URL_FIELDS = [
		'surfaceAlbedoAttachmentId'    => 'surfaceAlbedoUrl',
		'surfaceNormalAttachmentId'    => 'surfaceNormalUrl',
		'surfaceRoughnessAttachmentId' => 'surfaceRoughnessUrl',
		'surfaceAoAttachmentId'        => 'surfaceAoUrl',
		'surfaceMetalnessAttachmentId' => 'surfaceMetalnessUrl',
	];
	private int $project_id = 0;
	private array $media = [];
	private array $created_files = [];
	private string $runtime_mode = '';
	private string $runtime_profile = 'desktop';
	private bool $desktop_profiles_enabled = false;
	private array $desktop_profile_slots = [];
	private array $desktop_profile_recipes = [];
	private array $desktop_profile_definitions = [];
	private array $warnings = [];
	private VRodos_Runtime_URL_Resolver $url_resolver;
	/** @var resource|null */
	private $lock_handle = null;

	public function __construct( ?VRodos_Runtime_URL_Resolver $url_resolver = null ) {
		$this->url_resolver = $url_resolver ?? new VRodos_Runtime_URL_Resolver();
	}

	public function prepare_plan( VRodos_Project_Compile_Plan $plan ): array {
		$this->project_id = $plan->request->project_id;
		$this->media      = [];
		$this->created_files = [];
		$this->runtime_mode = $plan->request->runtime_mode;
		$this->runtime_profile = $plan->request->vr_runtime_profile;
		$this->desktop_profiles_enabled = 'desktop' === $plan->request->vr_runtime_profile;
		$this->warnings = [];
		$cache_policy = VRodos_Storage_Manager::ensure_published_cache_policy();
		if ( is_wp_error( $cache_policy ) ) {
			$this->warnings[] = $cache_policy->get_error_message();
			error_log( '[VRodos] Published cache policy warning: ' . $cache_policy->get_error_message() );
		}
		$this->acquire_lock();
		try {
			foreach ( $plan->scenes as $scene ) {
				$this->desktop_profile_slots = 'adaptive' === (string) ( $scene->desktop_profiles['buildMode'] ?? 'custom' )
					? [ 'low', 'medium', 'high' ]
					: [ 'custom' ];
				$this->desktop_profile_recipes = [];
				$this->desktop_profile_definitions = [];
				foreach ( $this->desktop_profile_slots as $slot ) {
					$definition = (array) ( $scene->desktop_profiles['profiles'][ $slot ]['assets'] ?? [] );
					$this->desktop_profile_recipes[ $slot ] = sanitize_key( (string) ( $definition['profile'] ?? ( 'custom' === $slot ? 'web-high' : 'web-' . $slot ) ) );
					$this->desktop_profile_definitions[ $slot ] = $definition;
				}
				$this->hydrate_value( $scene->scene_json );
				$this->hydrate_scene_surface_textures( $scene->scene_json, $scene->scene_id );
				$background_id = absint( get_post_meta( $scene->scene_id, 'vrodos_scene_bg_image', true ) );
				if ( $background_id && isset( $scene->scene_json->metadata ) && is_object( $scene->scene_json->metadata ) ) {
					if ( ! VRodos_Storage_Manager::attachment_is_owned_by( $background_id, 'scene', $scene->scene_id ) ) {
						throw new RuntimeException( '[VRodos] Scene background must be migrated to private scene storage before compilation.' );
					}
					$scene->scene_json->metadata->backgroundImagePath = $this->publish_attachment( $background_id, 'scene-' . $scene->scene_id . '-background' );
				}
			}
		} catch ( Throwable $error ) {
			$this->abort();
			throw $error;
		}
		ksort( $this->media, SORT_STRING );
		return array_values( $this->media );
	}

	public function warnings(): array {
		return $this->warnings;
	}

	public function finalize( array $artifacts ): void {
		$clients = [];
		foreach ( $artifacts as $artifact ) {
			if ( $artifact instanceof VRodos_Compile_Artifact ) {
				$clients[] = $artifact->filename;
			}
		}
		sort( $clients, SORT_STRING );
		$previous = get_post_meta( $this->project_id, self::INVENTORY_META, true );
		$previous_media = is_array( $previous ) && is_array( $previous['media'] ?? null ) ? $previous['media'] : [];
		$inventory = [
			'schemaVersion' => 1,
			'projectId'     => $this->project_id,
			'publishedAt'   => current_time( 'mysql', true ),
			'clients'       => $clients,
			'media'         => array_values( $this->media ),
		];
		try {
			$updated = update_post_meta( $this->project_id, self::INVENTORY_META, $inventory );
			if ( false === $updated && $previous !== $inventory ) {
				throw new RuntimeException( '[VRodos] Could not store the project publication inventory.' );
			}
			$this->remove_stale_media( $previous_media, $inventory['media'] );
			$this->created_files = [];
		} finally {
			$this->release_lock();
		}
	}

	public function abort(): void {
		$media_dir = $this->project_id > 0 ? VRodos_Storage_Manager::published_project_directory( $this->project_id, 'media' ) : null;
		if ( is_wp_error( $media_dir ) || ! is_string( $media_dir ) ) {
			$this->release_lock();
			return;
		}
		foreach ( $this->created_files as $path ) {
			if ( is_file( $path ) && VRodos_Storage_Manager::path_is_within( $path, $media_dir ) ) {
				wp_delete_file( $path );
			}
		}
		$this->created_files = [];
		$this->release_lock();
	}

	public function __destruct() {
		$this->release_lock();
	}

	private function acquire_lock(): void {
		$lock_dir = VRodos_Storage_Manager::temporary_directory( 'compiler-locks', 'shared' );
		if ( is_wp_error( $lock_dir ) ) {
			throw new RuntimeException( $lock_dir->get_error_message() );
		}
		$this->lock_handle = fopen( $lock_dir . 'project-' . $this->project_id . '-publication.lock', 'c+' );
		if ( ! is_resource( $this->lock_handle ) || ! flock( $this->lock_handle, LOCK_EX | LOCK_NB ) ) {
			$this->release_lock();
			throw new RuntimeException( '[VRodos] This project is already being compiled.', 409 );
		}
	}

	private function release_lock(): void {
		if ( is_resource( $this->lock_handle ) ) {
			flock( $this->lock_handle, LOCK_UN );
			fclose( $this->lock_handle );
		}
		$this->lock_handle = null;
	}

	private function hydrate_value( &$value ): void {
		if ( is_array( $value ) ) {
			foreach ( $value as &$child ) {
				$this->hydrate_value( $child );
			}
			return;
		}
		if ( ! is_object( $value ) ) {
			return;
		}
		$asset_id = absint( $value->asset_id ?? 0 );
		if ( $asset_id ) {
			$this->hydrate_asset_object( $value, $asset_id );
		}
		foreach ( get_object_vars( $value ) as $property => $child ) {
			if ( 'asset_id' !== $property ) {
				$this->hydrate_value( $value->{$property} );
			}
		}
	}

	private function hydrate_scene_surface_textures( object $scene, int $scene_id ): void {
		if ( ! is_object( $scene->objects ?? null ) ) {
			return;
		}

		foreach ( get_object_vars( $scene->objects ) as $object_key => $object ) {
			if ( ! is_object( $object ) || 'primitive-plane' !== sanitize_title( (string) ( $object->category_slug ?? $object->category_name ?? '' ) ) ) {
				continue;
			}
			foreach ( self::SURFACE_TEXTURE_URL_FIELDS as $attachment_field => $url_field ) {
				unset( $object->{$url_field} );
				$attachment_id = absint( $object->{$attachment_field} ?? 0 );
				if ( $attachment_id <= 0 ) {
					continue;
				}
				if (
					! VRodos_Storage_Manager::attachment_is_owned_by( $attachment_id, 'scene', $scene_id )
					|| ! VRodos_Storage_Manager::attachment_has_role( $attachment_id, self::SURFACE_TEXTURE_ROLE )
				) {
					throw new RuntimeException( sprintf( '[VRodos] Plane surface attachment #%d is not owned by scene #%d.', $attachment_id, $scene_id ) );
				}
				$context = sprintf( 'scene-%d-plane-%s-%s', $scene_id, sanitize_key( (string) $object_key ), sanitize_key( $attachment_field ) );
				$object->{$url_field} = $this->publish_attachment( $attachment_id, $context );
			}
		}
	}

	private function hydrate_asset_object( object $object, int $asset_id ): void {
		$origin_mode = VRodos_Asset_Origin::mode_for_asset( $asset_id );
		if ( '' !== $origin_mode ) {
			$object->vrodosAssetOriginMode = $origin_mode;
		} else {
			unset( $object->vrodosAssetOriginMode );
		}

		$field_map = [
			'glb_path'        => 'vrodos_asset3d_glb',
			'screenshot_path' => 'vrodos_asset3d_screenimage',
			'audio_path'      => 'vrodos_asset3d_audio',
			'video_path'      => 'vrodos_asset3d_video',
			'image_path'      => 'vrodos_asset3d_image',
			'poi_img_path'    => 'vrodos_asset3d_poi_imgtxt_image',
		];
		$protect_geometry = $this->asset_requires_protected_geometry( $object );
		foreach ( $field_map as $property => $meta_key ) {
			$meta = get_post_meta( $asset_id, $meta_key, true );
			if ( 'screenshot_path' === $property && ! absint( $meta ) ) {
				$meta = get_post_thumbnail_id( $asset_id );
			}
			if ( 'glb_path' === $property ) {
				if ( $this->desktop_profiles_enabled && absint( $meta ) > 0 ) {
					$profile_urls = [];
					foreach ( $this->desktop_profile_slots as $slot ) {
						$profile = $this->desktop_profile_recipes[ $slot ] ?? ( 'custom' === $slot ? 'web-high' : 'web-' . $slot );
						$definition = (array) ( $this->desktop_profile_definitions[ $slot ] ?? [] );
						$path = VRodos_Asset_Optimization_Manager::runtime_profile_derivative_path(
							$asset_id,
							$profile,
							[
								'protectGeometry' => $protect_geometry,
								'textureMaxSize'  => absint( $definition['textureMaxSize'] ?? $this->runtime_profile_texture_cap( $profile ) ),
								'recipe'          => $profile,
							]
						);
						if ( '' === $path ) {
							$this->ensure_source_fallback_allowed( $asset_id, $meta, $profile );
							$path = get_attached_file( absint( $meta ), true );
							if ( ! is_string( $path ) || ! is_file( $path ) ) {
								throw new RuntimeException( sprintf( '[VRodos] Asset #%d has neither a ready %s derivative nor a readable source.', $asset_id, $profile ) );
							}
						}
						$profile_urls[ $slot ] = $this->publish_file( $path, 'asset-' . $asset_id . '-' . $profile );
					}
					if ( count( $profile_urls ) === count( $this->desktop_profile_slots ) && count( $profile_urls ) > 1 ) {
						$object->desktop_profile_glb_urls = (object) $profile_urls;
					}
					if ( $profile_urls ) {
						$object->{$property} = (string) reset( $profile_urls );
						continue;
					}
				}
				$profile = 'headset' === $this->runtime_profile ? 'web-low' : 'web-high';
				$derivative = VRodos_Asset_Optimization_Manager::runtime_profile_derivative_path(
					$asset_id,
					$profile,
					[
						'protectGeometry' => $protect_geometry,
						'textureMaxSize'  => $this->runtime_profile_texture_cap( $profile ),
						'recipe'          => $profile,
					]
				);
				if ( '' !== $derivative ) {
					$object->{$property} = $this->publish_file( $derivative, 'asset-' . $asset_id . '-' . $profile );
					continue;
				}
				$this->ensure_source_fallback_allowed( $asset_id, $meta, $profile );
			}
			if ( is_numeric( $meta ) && absint( $meta ) ) {
				if ( ! VRodos_Storage_Manager::attachment_is_owned_by( absint( $meta ), 'asset', $asset_id ) ) {
					throw new RuntimeException( sprintf( '[VRodos] Asset attachment #%d must be migrated to private asset storage before compilation.', absint( $meta ) ) );
				}
				$object->{$property} = $this->publish_attachment(
					absint( $meta ),
					'asset-' . $asset_id . '-' . $property,
					'glb_path' === $property ? 'glb' : ''
				);
			} elseif ( is_string( $meta ) && wp_http_validate_url( $meta ) ) {
				$object->{$property} = esc_url_raw( $meta );
			}
		}

		$text_attachment_id = absint( get_post_meta( $asset_id, 'vrodos_asset3d_text_file', true ) );
		$text_result = null;
		if ( $text_attachment_id ) {
			if ( ! VRodos_Storage_Manager::attachment_is_owned_by( $text_attachment_id, 'asset', $asset_id ) ) {
				throw new RuntimeException( sprintf( '[VRodos] Text attachment #%d must be migrated to private asset storage before compilation.', $text_attachment_id ) );
			}
			$text_path = get_attached_file( $text_attachment_id, true );
			$format    = is_string( $text_path ) ? VRodos_Text_Asset_Helper::detect_format( $text_path, get_post_mime_type( $text_attachment_id ) ?: '' ) : '';
			$text_result = VRodos_Text_Asset_Helper::extract_from_file( is_string( $text_path ) ? $text_path : '', $format );
			if ( empty( $text_result['success'] ) ) {
				throw new RuntimeException( sprintf( '[VRodos] Text attachment #%d for asset #%d could not be read.', $text_attachment_id, $asset_id ) );
			}
		}
		$text_content = is_array( $text_result ) ? (string) $text_result['text'] : get_post_meta( $asset_id, 'vrodos_asset3d_text_content', true );
		if ( is_string( $text_content ) && '' !== $text_content ) {
			$object->text_content   = $text_content;
			$object->text_format    = is_array( $text_result ) ? (string) $text_result['format'] : sanitize_key( (string) get_post_meta( $asset_id, 'vrodos_asset3d_text_format', true ) );
			$object->text_truncated = is_array( $text_result ) ? ! empty( $text_result['truncated'] ) : '1' === (string) get_post_meta( $asset_id, 'vrodos_asset3d_text_truncated', true );
		}
		if ( isset( $object->poi_image_path ) && isset( $object->poi_img_path ) ) {
			$object->poi_image_path = $object->poi_img_path;
		}
	}

	private function asset_requires_protected_geometry( object $object ): bool {
		$category = sanitize_title( (string) ( $object->category_slug ?? $object->category_name ?? '' ) );
		return in_array( $category, [ 'walkable-surface', 'collision-proxy' ], true )
			|| VRodos_Runtime_Settings_Contract::normalize_bool( $object->compiledCollisionEnabled ?? false, false );
	}

	private function runtime_profile_texture_cap( string $profile ): int {
		return match ( $profile ) {
			'web-low'    => 1024,
			'web-medium' => 2048,
			default      => 4096,
		};
	}

	private function ensure_source_fallback_allowed( int $asset_id, $source_attachment_id, string $profile ): void {
		$source_path = is_numeric( $source_attachment_id ) ? get_attached_file( absint( $source_attachment_id ), true ) : '';
		$source_bytes = is_string( $source_path ) && is_file( $source_path ) ? filesize( $source_path ) : 0;
		if ( is_int( $source_bytes ) && $source_bytes > self::LARGE_SOURCE_PUBLISH_GATE_BYTES ) {
			throw new RuntimeException( sprintf( '[VRodos] Asset #%d is larger than 100 MiB and cannot fall back to its source because the required %s derivative is unavailable.', $asset_id, $profile ) );
		}
	}

	private function publish_attachment( int $attachment_id, string $context, string $forced_extension = '' ): string {
		$path = get_attached_file( $attachment_id, true );
		if ( ! is_string( $path ) || ! is_file( $path ) || ! is_readable( $path ) ) {
			throw new RuntimeException( sprintf( '[VRodos] Missing attachment #%d required by %s.', $attachment_id, $context ) );
		}
		return $this->publish_file( $path, $context, $attachment_id, $forced_extension );
	}

	private function publish_file( string $source, string $context, int $attachment_id = 0, string $forced_extension = '' ): string {
		$hash = hash_file( 'sha256', $source );
		if ( ! is_string( $hash ) || '' === $hash ) {
			throw new RuntimeException( '[VRodos] Could not hash ' . $context . '.' );
		}
		$extension = '' !== $forced_extension ? sanitize_key( $forced_extension ) : strtolower( pathinfo( $source, PATHINFO_EXTENSION ) );
		$filename  = $hash . ( '' !== $extension ? '.' . sanitize_key( $extension ) : '' );
		$media_dir = VRodos_Storage_Manager::published_project_directory( $this->project_id, 'media' );
		if ( is_wp_error( $media_dir ) ) {
			throw new RuntimeException( $media_dir->get_error_message() );
		}
		$destination = $media_dir . $filename;
		if ( ! is_file( $destination ) ) {
			$temporary = $destination . '.' . wp_generate_password( 20, false, false ) . '.partial';
			if ( ! @copy( $source, $temporary ) || filesize( $source ) !== filesize( $temporary ) || hash_file( 'sha256', $temporary ) !== $hash || ! @rename( $temporary, $destination ) ) {
				wp_delete_file( $temporary );
				throw new RuntimeException( '[VRodos] Failed to publish ' . $context . '.' );
			}
			$this->created_files[] = $destination;
		}
		$url = $this->url_resolver->runtime_url_for_published_file( $this->project_id, 'media', $filename, null, $this->runtime_mode );
		if ( '' === $url ) {
			throw new RuntimeException( '[VRodos] Could not resolve the published media URL.' );
		}
		$this->media[ $filename ] = [
			'file'         => $filename,
			'sha256'       => $hash,
			'sizeBytes'    => (int) filesize( $source ),
			'attachmentId' => $attachment_id,
			'context'      => $context,
		];
		return $url;
	}

	private function remove_stale_media( array $previous, array $current ): void {
		$current_files = array_column( $current, 'file' );
		$media_dir     = VRodos_Storage_Manager::published_project_directory( $this->project_id, 'media' );
		if ( is_wp_error( $media_dir ) ) {
			return;
		}
		foreach ( $previous as $entry ) {
			$filename = is_array( $entry ) ? basename( (string) ( $entry['file'] ?? '' ) ) : '';
			if ( '' === $filename || in_array( $filename, $current_files, true ) ) {
				continue;
			}
			$path = $media_dir . $filename;
			if ( is_file( $path ) && VRodos_Storage_Manager::path_is_within( $path, $media_dir ) ) {
				wp_delete_file( $path );
			}
		}
	}
}
