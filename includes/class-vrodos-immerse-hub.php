<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-vrodos-compiler-aframe-dom-helper.php';
require_once __DIR__ . '/class-vrodos-compiler-scene-repository.php';
require_once __DIR__ . '/class-vrodos-runtime-url-resolver.php';

/** Public catalog of the latest published Immerse project builds. */
final class VRodos_Immerse_Hub {
	public const SETTING = 'vrodos_immerse_hub_enabled';
	private const INVENTORY_META = '_vrodos_published_inventory';

	public static function enabled(): bool {
		$settings = (array) get_option( 'vrodos_general_settings', [] );
		return '1' === (string) ( $settings[ self::SETTING ] ?? '0' );
	}

	public static function url(): string {
		return home_url( '/immerse/' );
	}

	public static function robots( array $robots ): array {
		if ( is_page( 'immerse' ) ) {
			unset( $robots['index'] );
			$robots['noindex'] = true;
		}
		return $robots;
	}

	public static function send_page_headers(): void {
		if ( is_page( 'immerse' ) ) {
			header( 'X-Robots-Tag: noindex', true );
			nocache_headers();
		}
	}

	/** @return array<int, array{title:string, id:int, publishedAt:string, scenes:array}> */
	public static function catalog(): array {
		$projects = get_posts( [
			'post_type' => 'vrodos_game',
			'post_status' => 'publish',
			'posts_per_page' => -1,
			'meta_key' => '_immerse_source',
			'meta_value' => 'immerse',
		] );
		$groups = [];
		$resolver = new VRodos_Runtime_URL_Resolver();
		$public_runtime_ready = '' !== $resolver->public_runtime_base_url();
		$scene_repository = new VRodos_Compiler_Scene_Repository();

		foreach ( $projects as $project ) {
			$project_id = absint( $project->ID );
			$inventory = get_post_meta( $project_id, self::INVENTORY_META, true );
			if ( ! is_array( $inventory ) || absint( $inventory['projectId'] ?? 0 ) !== $project_id || ! is_array( $inventory['clients'] ?? null ) ) {
				continue;
			}
			$mode = (string) ( $inventory['runtimeMode'] ?? '' );
			$profile = (string) ( $inventory['vrRuntimeProfile'] ?? '' );
			if ( ! in_array( $mode, [ 'single-player', 'networked' ], true ) || ! in_array( $profile, [ 'desktop', 'headset', 'pc-rendered-vr' ], true ) ) {
				continue;
			}
			$scenes = [];
			foreach ( $inventory['clients'] as $filename ) {
				if ( ! is_string( $filename ) || ! preg_match( '/^Master_Client_([1-9][0-9]*)\.html$/', $filename, $matches ) ) {
					continue;
				}
				$scene_id = absint( $matches[1] );
				$scene = get_post( $scene_id );
				if ( ! ( $scene instanceof WP_Post ) || 'vrodos_scene' !== $scene->post_type || 'publish' !== $scene->post_status || ! $scene_repository->scene_belongs_to_project( $scene_id, (string) $project->post_name ) || ! self::published_file_exists( $project_id, 'clients', $filename ) ) {
					continue;
				}
				$link = 'single-player' === $mode
					? VRodos_Storage_Manager::published_project_url( $project_id, 'clients', $filename )
					: ( $public_runtime_ready ? $resolver->runtime_url_for_file( $project_id, $filename, 'public', 'networked' ) : '' );
				$preview_file = (string) ( $inventory['scenePreviews'][ $scene_id ] ?? '' );
				$preview = '';
				if ( preg_match( '/^[a-f0-9]{64}\.(?:jpg|jpeg|png|webp|gif)$/i', $preview_file ) && self::published_file_exists( $project_id, 'media', $preview_file ) ) {
					$preview_url = VRodos_Storage_Manager::published_project_url( $project_id, 'media', $preview_file );
					$preview = is_wp_error( $preview_url ) ? '' : $preview_url;
				}
				$scenes[] = [
					'id' => $scene_id,
					'title' => get_the_title( $scene_id ),
					'url' => is_wp_error( $link ) ? '' : (string) $link,
					'preview' => $preview,
					'builtAt' => self::published_file_mtime( $project_id, 'clients', $filename ),
					'profile' => $profile,
					'mode' => $mode,
				];
			}
			if ( $scenes ) {
				usort( $scenes, static fn ( array $a, array $b ): int => strcasecmp( $a['title'], $b['title'] ) );
				$groups[] = [
					'id' => $project_id,
					'title' => get_the_title( $project_id ),
					'publishedAt' => (string) ( $inventory['publishedAt'] ?? '' ),
					'scenes' => $scenes,
				];
			}
		}
		usort( $groups, static fn ( array $a, array $b ): int => strcmp( $b['publishedAt'], $a['publishedAt'] ) );
		return $groups;
	}

	/** Publish a newly saved screenshot for an already built Immerse scene. */
	public static function refresh_scene_preview( int $scene_id ): true|WP_Error {
		$scene = get_post( $scene_id );
		if ( ! $scene instanceof WP_Post || 'vrodos_scene' !== $scene->post_type ) {
			return true;
		}
		$projects = get_posts( [
			'post_type' => 'vrodos_game', 'post_status' => 'publish', 'posts_per_page' => -1,
			'meta_key' => '_immerse_source', 'meta_value' => 'immerse',
		] );
		$repository = new VRodos_Compiler_Scene_Repository();
		foreach ( $projects as $project ) {
			$project_id = absint( $project->ID );
			if ( ! $repository->scene_belongs_to_project( $scene_id, (string) $project->post_name ) ) {
				continue;
			}
			$filename = 'Master_Client_' . $scene_id . '.html';
			$lock_dir = VRodos_Storage_Manager::temporary_directory( 'compiler-locks', 'shared' );
			if ( is_wp_error( $lock_dir ) ) {
				return $lock_dir;
			}
			$lock = @fopen( $lock_dir . 'project-' . $project_id . '-publication.lock', 'c+' );
			if ( false === $lock || ! flock( $lock, LOCK_EX | LOCK_NB ) ) {
				if ( is_resource( $lock ) ) {
					fclose( $lock );
				}
				return new WP_Error( 'vrodos_immerse_preview_busy', 'The project is being built. Save the scene again after the build finishes.' );
			}
			try {
				$inventory = get_post_meta( $project_id, self::INVENTORY_META, true );
				if ( ! is_array( $inventory ) || absint( $inventory['projectId'] ?? 0 ) !== $project_id || ! in_array( $filename, (array) ( $inventory['clients'] ?? [] ), true ) || ! self::published_file_exists( $project_id, 'clients', $filename ) ) {
					return true;
				}
				$preview = self::copy_scene_preview( $project_id, $scene_id );
				if ( ! $preview ) {
					return new WP_Error( 'vrodos_immerse_preview_failed', 'The scene screenshot could not be published to the Immerse page.' );
				}
				$inventory['scenePreviews'] = (array) ( $inventory['scenePreviews'] ?? [] );
				$inventory['scenePreviews'][ $scene_id ] = $preview['file'];
				$inventory['media'] = (array) ( $inventory['media'] ?? [] );
				if ( ! in_array( $preview['file'], array_column( $inventory['media'], 'file' ), true ) ) {
					$inventory['media'][] = $preview;
				}
				$updated = update_post_meta( $project_id, self::INVENTORY_META, $inventory );
				if ( false === $updated && get_post_meta( $project_id, self::INVENTORY_META, true ) !== $inventory ) {
					return new WP_Error( 'vrodos_immerse_preview_failed', 'The Immerse page preview could not be updated.' );
				}
				return true;
			} finally {
				flock( $lock, LOCK_UN );
				fclose( $lock );
			}
		}
		return true;
	}

	/** Upgrade published inventories when the hub is first enabled. */
	public static function backfill_existing(): true|WP_Error {
		$projects = get_posts( [
			'post_type' => 'vrodos_game', 'post_status' => 'publish', 'posts_per_page' => -1,
			'meta_key' => '_immerse_source', 'meta_value' => 'immerse',
		] );
		foreach ( $projects as $project ) {
			$project_id = absint( $project->ID );
			$inventory = get_post_meta( $project_id, self::INVENTORY_META, true );
			if ( ! is_array( $inventory ) || absint( $inventory['projectId'] ?? 0 ) !== $project_id || ! is_array( $inventory['clients'] ?? null ) ) {
				continue;
			}
			$master_clients = [];
			foreach ( $inventory['clients'] as $filename ) {
				if ( is_string( $filename ) && preg_match( '/^Master_Client_([1-9][0-9]*)\.html$/', $filename, $matches ) && self::published_file_exists( $project_id, 'clients', $filename ) ) {
					$master_clients[ absint( $matches[1] ) ] = $filename;
				}
			}
			if ( ! $master_clients ) {
				continue;
			}
			if ( ! in_array( (string) ( $inventory['runtimeMode'] ?? '' ), [ 'single-player', 'networked' ], true ) || ! in_array( (string) ( $inventory['vrRuntimeProfile'] ?? '' ), [ 'desktop', 'headset', 'pc-rendered-vr' ], true ) ) {
				$first_file = reset( $master_clients );
				$settings = self::settings_from_client( $project_id, $first_file );
				if ( is_wp_error( $settings ) ) {
					return $settings;
				}
				$inventory['runtimeMode'] = $settings['runtimeMode'];
				$inventory['vrRuntimeProfile'] = $settings['vrRuntimeProfile'];
			}
			$previews = is_array( $inventory['scenePreviews'] ?? null ) ? $inventory['scenePreviews'] : [];
			$media = is_array( $inventory['media'] ?? null ) ? $inventory['media'] : [];
			foreach ( $master_clients as $scene_id => $filename ) {
				if ( isset( $previews[ $scene_id ] ) && self::published_file_exists( $project_id, 'media', (string) $previews[ $scene_id ] ) ) {
					continue;
				}
				$preview = self::copy_scene_preview( $project_id, $scene_id );
				if ( ! $preview ) {
					continue;
				}
				$previews[ $scene_id ] = $preview['file'];
				if ( ! in_array( $preview['file'], array_column( $media, 'file' ), true ) ) {
					$media[] = $preview;
				}
			}
			$inventory['scenePreviews'] = $previews;
			$inventory['media'] = $media;
			$updated = update_post_meta( $project_id, self::INVENTORY_META, $inventory );
			if ( false === $updated && get_post_meta( $project_id, self::INVENTORY_META, true ) !== $inventory ) {
				return new WP_Error( 'vrodos_immerse_hub_backfill', 'Could not save published build details for project #' . $project_id . '.' );
			}
		}
		return true;
	}

	private static function published_file_exists( int $project_id, string $role, string $filename ): bool {
		$uploads = wp_upload_dir( null, false );
		if ( ! empty( $uploads['error'] ) ) {
			return false;
		}
		return is_file( self::published_file_path( (string) $uploads['basedir'], $project_id, $role, $filename ) );
	}

	private static function published_file_mtime( int $project_id, string $role, string $filename ): int {
		$uploads = wp_upload_dir( null, false );
		if ( ! empty( $uploads['error'] ) ) {
			return 0;
		}
		return (int) filemtime( self::published_file_path( (string) $uploads['basedir'], $project_id, $role, $filename ) );
	}

	private static function published_file_path( string $uploads_dir, int $project_id, string $role, string $filename ): string {
		return trailingslashit( $uploads_dir ) . 'vrodos/published/projects/' . $project_id . '/' . $role . '/' . $filename;
	}

	private static function settings_from_client( int $project_id, string $filename ): array|WP_Error {
		$uploads = wp_upload_dir( null, false );
		$path = self::published_file_path( (string) ( $uploads['basedir'] ?? '' ), $project_id, 'clients', $filename );
		$dom = new DOMDocument();
		$previous = libxml_use_internal_errors( true );
		$loaded = $dom->loadHTMLFile( $path );
		libxml_clear_errors();
		libxml_use_internal_errors( $previous );
		$scene = $loaded ? $dom->getElementsByTagName( 'a-scene' )->item( 0 ) : null;
		if ( ! ( $scene instanceof DOMElement ) ) {
			return new WP_Error( 'vrodos_immerse_hub_backfill', 'Could not read build settings from ' . $filename . '. Rebuild this scene before enabling the hub.' );
		}
		$settings = VRodos_Compiler_AFrame_DOM_Helper::parse_component_attribute( $scene->getAttribute( 'scene-settings' ) );
		$mode = (string) ( $settings['runtimeMode'] ?? '' );
		$profile = (string) ( $settings['vrRuntimeProfile'] ?? '' );
		if ( ! in_array( $mode, [ 'single-player', 'networked' ], true ) || ! in_array( $profile, [ 'desktop', 'headset', 'pc-rendered-vr' ], true ) ) {
			return new WP_Error( 'vrodos_immerse_hub_backfill', 'Build type is missing from ' . $filename . '. Rebuild this scene before enabling the hub.' );
		}
		return [ 'runtimeMode' => $mode, 'vrRuntimeProfile' => $profile ];
	}

	/** @return array<string, mixed>|null */
	private static function copy_scene_preview( int $project_id, int $scene_id ): ?array {
		$scene = get_post( $scene_id );
		if ( ! ( $scene instanceof WP_Post ) || 'vrodos_scene' !== $scene->post_type || ! ( new VRodos_Compiler_Scene_Repository() )->scene_belongs_to_project( $scene_id, (string) get_post_field( 'post_name', $project_id ) ) ) {
			return null;
		}
		$attachment_id = absint( get_post_thumbnail_id( $scene_id ) );
		if ( ! $attachment_id || ! wp_attachment_is_image( $attachment_id ) || ! VRodos_Storage_Manager::attachment_is_owned_by( $attachment_id, 'scene', $scene_id ) ) {
			return null;
		}
		$source = get_attached_file( $attachment_id, true );
		if ( ! is_string( $source ) || ! is_file( $source ) || ! is_readable( $source ) ) {
			return null;
		}
		$extension = sanitize_key( strtolower( pathinfo( $source, PATHINFO_EXTENSION ) ) );
		if ( ! in_array( $extension, [ 'jpg', 'jpeg', 'png', 'webp', 'gif' ], true ) ) {
			return null;
		}
		$hash = hash_file( 'sha256', $source );
		if ( ! is_string( $hash ) ) {
			return null;
		}
		$filename = $hash . '.' . $extension;
		$directory = VRodos_Storage_Manager::published_project_directory( $project_id, 'media' );
		if ( is_wp_error( $directory ) ) {
			return null;
		}
		$destination = $directory . $filename;
		if ( ! is_file( $destination ) ) {
			$partial = $destination . '.' . wp_generate_password( 20, false, false ) . '.partial';
			if ( ! @copy( $source, $partial ) || hash_file( 'sha256', $partial ) !== $hash || ! @rename( $partial, $destination ) ) {
				wp_delete_file( $partial );
				return null;
			}
		}
		return [ 'file' => $filename, 'sha256' => $hash, 'sizeBytes' => (int) filesize( $source ), 'attachmentId' => $attachment_id, 'context' => 'scene-' . $scene_id . '-preview' ];
	}
}
