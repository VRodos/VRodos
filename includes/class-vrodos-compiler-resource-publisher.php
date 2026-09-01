<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-vrodos-text-asset-helper.php';

/** Publishes immutable, content-addressed copies required by one build. */
final class VRodos_Compiler_Resource_Publisher {
	private const INVENTORY_META = '_vrodos_published_inventory';
	private int $project_id = 0;
	private array $media = [];
	private array $created_files = [];
	private string $runtime_mode = '';
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
		$this->acquire_lock();
		try {
			foreach ( $plan->scenes as $scene ) {
				$this->hydrate_value( $scene->scene_json );
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

	private function hydrate_asset_object( object $object, int $asset_id ): void {
		$field_map = [
			'glb_path'        => 'vrodos_asset3d_glb',
			'screenshot_path' => 'vrodos_asset3d_screenimage',
			'audio_path'      => 'vrodos_asset3d_audio',
			'video_path'      => 'vrodos_asset3d_video',
			'image_path'      => 'vrodos_asset3d_image',
			'poi_img_path'    => 'vrodos_asset3d_poi_imgtxt_image',
		];
		foreach ( $field_map as $property => $meta_key ) {
			$meta = get_post_meta( $asset_id, $meta_key, true );
			if ( 'screenshot_path' === $property && ! absint( $meta ) ) {
				$meta = get_post_thumbnail_id( $asset_id );
			}
			if ( 'glb_path' === $property ) {
				$derivative = $this->selected_derivative_path( $asset_id );
				if ( '' !== $derivative ) {
					$object->{$property} = $this->publish_file( $derivative, 'asset-' . $asset_id . '-derivative' );
					continue;
				}
			}
			if ( is_numeric( $meta ) && absint( $meta ) ) {
				if ( ! VRodos_Storage_Manager::attachment_is_owned_by( absint( $meta ), 'asset', $asset_id ) ) {
					throw new RuntimeException( sprintf( '[VRodos] Asset attachment #%d must be migrated to private asset storage before compilation.', absint( $meta ) ) );
				}
				$object->{$property} = $this->publish_attachment( absint( $meta ), 'asset-' . $asset_id . '-' . $property );
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

	private function selected_derivative_path( int $asset_id ): string {
		$meta = get_post_meta( $asset_id, '_vrodos_asset3d_glb_derivatives', true );
		if ( ! is_array( $meta ) || empty( $meta['compileEnabled'] ) ) {
			return '';
		}
		$profile = sanitize_key( (string) ( $meta['activeProfile'] ?? '' ) );
		$record  = $profile && is_array( $meta['derivatives'][ $profile ] ?? null ) ? $meta['derivatives'][ $profile ] : [];
		$attachment_id = absint( $record['attachmentId'] ?? 0 );
		$source_id     = absint( get_post_meta( $asset_id, 'vrodos_asset3d_glb', true ) );
		$source_path   = $source_id ? get_attached_file( $source_id, true ) : '';
		$path          = $attachment_id ? get_attached_file( $attachment_id, true ) : '';
		$path          = is_string( $path ) ? wp_normalize_path( $path ) : '';
		$root    = VRodos_Storage_Manager::private_site_root( false );
		$source_hash = is_string( $source_path ) && is_file( $source_path ) ? hash_file( 'sha256', $source_path ) : '';
		return
			'ready' === ( $record['status'] ?? '' )
			&& $attachment_id > 0
			&& VRodos_Storage_Manager::attachment_is_owned_by( $attachment_id, 'asset', $asset_id )
			&& $source_id > 0
			&& absint( $record['sourceAttachmentId'] ?? 0 ) === $source_id
			&& is_string( $source_hash )
			&& '' !== $source_hash
			&& hash_equals( (string) ( $record['sourceSha256'] ?? '' ), $source_hash )
			&& is_string( $root )
			&& is_file( $path )
			&& VRodos_Storage_Manager::path_is_within( $path, $root )
			? $path
			: '';
	}

	private function publish_attachment( int $attachment_id, string $context ): string {
		$path = get_attached_file( $attachment_id, true );
		if ( ! is_string( $path ) || ! is_file( $path ) || ! is_readable( $path ) ) {
			throw new RuntimeException( sprintf( '[VRodos] Missing attachment #%d required by %s.', $attachment_id, $context ) );
		}
		return $this->publish_file( $path, $context, $attachment_id );
	}

	private function publish_file( string $source, string $context, int $attachment_id = 0 ): string {
		$hash = hash_file( 'sha256', $source );
		if ( ! is_string( $hash ) || '' === $hash ) {
			throw new RuntimeException( '[VRodos] Could not hash ' . $context . '.' );
		}
		$extension = strtolower( pathinfo( $source, PATHINFO_EXTENSION ) );
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
