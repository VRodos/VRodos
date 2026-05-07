<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

trait VRodos_Asset_Optimization_Derivative_Service {
	public static function resolve_compiled_glb_asset( int $asset_id, string $source_url ): array {
		$result = [
			'url'        => $source_url,
			'derivative' => null,
		];

		if ( $asset_id <= 0 || '' === trim( $source_url ) ) {
			return $result;
		}

		$meta = self::get_derivative_meta( $asset_id );
		if ( empty( $meta['compileEnabled'] ) ) {
			return $result;
		}

		$profile = (string) ( $meta['activeProfile'] ?? '' );
		if ( '' === $profile || empty( $meta['derivatives'][ $profile ] ) || ! is_array( $meta['derivatives'][ $profile ] ) ) {
			return $result;
		}

		$derivative = $meta['derivatives'][ $profile ];
		if ( ! self::is_derivative_usable( $derivative, $source_url ) ) {
			return $result;
		}

		$result['url']        = (string) $derivative['url'];
		$result['derivative'] = $derivative;
		return $result;
	}

	private static function set_asset_compile_use( int $asset_id, string $profile, bool $enabled ) {
		if ( ! isset( self::supported_profiles()[ $profile ] ) ) {
			return new WP_Error( 'vrodos_invalid_derivative_profile', __( 'Unsupported derivative profile.', 'vrodos' ) );
		}

		$meta = self::get_derivative_meta( $asset_id );
		if ( $enabled ) {
			$source = self::get_source_glb( $asset_id );
			$derivative = $meta['derivatives'][ $profile ] ?? null;
			if ( is_wp_error( $source ) || ! is_array( $derivative ) || ! self::is_derivative_usable( $derivative, (string) $source['url'] ) ) {
				return new WP_Error( 'vrodos_derivative_not_ready', __( 'The derivative is not ready for compiled-scene use.', 'vrodos' ) );
			}

			$meta['activeProfile'] = $profile;
			$meta['compileEnabled'] = true;
			update_post_meta( $asset_id, self::META_KEY, $meta );
			return true;
		}

		$meta['compileEnabled'] = false;
		update_post_meta( $asset_id, self::META_KEY, $meta );
		return true;
	}

	private static function supported_profiles(): array {
		return [
			'safe-draco'   => 'Safe Draco',
			'safe-meshopt' => 'Safe Meshopt',
		];
	}

	private static function get_derivative_meta( int $asset_id ): array {
		$raw = get_post_meta( $asset_id, self::META_KEY, true );
		if ( ! is_array( $raw ) ) {
			$raw = [];
		}

		return wp_parse_args(
			$raw,
			[
				'schemaVersion'  => 1,
				'compileEnabled' => false,
				'activeProfile'  => '',
				'derivatives'    => [],
				'lastError'      => '',
			]
		);
	}

	private static function get_source_glb( int $asset_id ) {
		$source_meta = get_post_meta( $asset_id, 'vrodos_asset3d_glb', true );
		$source_url  = VRodos_Core_Manager::resolve_media_meta_url( $source_meta );

		if ( '' === $source_url ) {
			return new WP_Error( 'vrodos_no_glb_source', 'Asset has no GLB source URL.' );
		}

		$source_path = is_numeric( $source_meta )
			? get_attached_file( (int) $source_meta )
			: self::local_path_from_url( $source_url );

		if ( ! is_string( $source_path ) || '' === $source_path || ! is_file( $source_path ) || ! is_readable( $source_path ) ) {
			return new WP_Error( 'vrodos_glb_source_not_local', 'Only local uploaded GLB files can be optimized.' );
		}

		if ( strtolower( pathinfo( $source_path, PATHINFO_EXTENSION ) ) !== 'glb' ) {
			return new WP_Error( 'vrodos_glb_source_invalid_type', 'The source asset is not a GLB file.' );
		}

		$size = filesize( $source_path );

		return [
			'meta'      => $source_meta,
			'url'       => $source_url,
			'path'      => $source_path,
			'sizeBytes' => false === $size ? 0 : (int) $size,
		];
	}

	private static function local_path_from_url( string $url ): string {
		$uploads = wp_upload_dir();
		$clean_url = self::strip_url_query_fragment( $url );
		$path      = wp_parse_url( $clean_url, PHP_URL_PATH );

		if ( ! is_string( $path ) || '' === $path ) {
			return '';
		}

		$upload_base_url = untrailingslashit( (string) $uploads['baseurl'] );
		if ( str_starts_with( $clean_url, $upload_base_url ) ) {
			$relative = substr( $clean_url, strlen( $upload_base_url ) );
			return wp_normalize_path( trailingslashit( $uploads['basedir'] ) . ltrim( rawurldecode( $relative ), '/\\' ) );
		}

		if ( str_starts_with( $path, '/wp-content/uploads/' ) && defined( 'ABSPATH' ) ) {
			return wp_normalize_path( trailingslashit( ABSPATH ) . ltrim( rawurldecode( $path ), '/\\' ) );
		}

		return '';
	}

	private function generate_derivative( int $asset_id, array $source, string $profile ) {
		$paths = $this->build_derivative_paths( $asset_id, $source, $profile );

		if ( ! wp_mkdir_p( $paths['dir'] ) ) {
			return new WP_Error( 'vrodos_derivative_dir_failed', 'Could not create derivative output directory.' );
		}

		wp_raise_memory_limit( 'admin' );
		@set_time_limit( 600 );

		$node = (string) apply_filters( 'vrodos_asset_optimizer_node_command', 'node' );
		$script = VRodos_Path_Manager::plugin_path( 'scripts/prototype-optimize-master-client-assets.mjs' );
		$args = [
			$node,
			$script,
			'--source',
			$source['path'],
			'--source-url',
			$source['url'],
			'--output-dir',
			$paths['dir'],
			'--output-file',
			$paths['file'],
			'--manifest',
			$paths['manifest'],
			'--markdown',
			$paths['markdown'],
			'--profile',
			$profile,
			'--json',
		];

		$command = implode( ' ', array_map( 'escapeshellarg', $args ) ) . ' 2>&1';
		$output = [];
		$code   = 0;
		exec( $command, $output, $code );

		if ( 0 !== $code ) {
			return new WP_Error(
				'vrodos_optimizer_failed',
				'glTF optimization failed: ' . trim( implode( "\n", array_slice( $output, -12 ) ) )
			);
		}

		if ( ! is_file( $paths['manifest'] ) ) {
			return new WP_Error( 'vrodos_optimizer_manifest_missing', 'Optimizer finished without writing a manifest.' );
		}

		$manifest = json_decode( (string) file_get_contents( $paths['manifest'] ), true );
		if ( ! is_array( $manifest ) || empty( $manifest['assets'][0] ) || ! is_array( $manifest['assets'][0] ) ) {
			return new WP_Error( 'vrodos_optimizer_manifest_invalid', 'Optimizer manifest is invalid.' );
		}

		$record = $manifest['assets'][0];
		if ( ( $record['status'] ?? '' ) !== 'done' || ! is_file( $paths['file'] ) ) {
			return new WP_Error( 'vrodos_optimizer_derivative_missing', 'Optimizer did not produce a ready derivative file.' );
		}

		return [
			'profile'  => $profile,
			'paths'    => $paths,
			'manifest' => $manifest,
			'record'   => $record,
		];
	}

	private function build_derivative_paths( int $asset_id, array $source, string $profile ): array {
		$uploads = wp_upload_dir();
		$dir     = self::derivative_cache_dir( $asset_id );
		$url     = trailingslashit( $uploads['baseurl'] ) . 'vrodos-optimized-assets/asset-' . $asset_id;
		$base    = sanitize_file_name( pathinfo( (string) $source['path'], PATHINFO_FILENAME ) . '.' . $profile );

		return [
			'dir'      => $dir,
			'urlBase'  => $url,
			'file'     => $dir . '/' . $base . '.glb',
			'url'      => $url . '/' . $base . '.glb',
			'manifest' => $dir . '/' . $base . '.manifest.json',
			'markdown' => $dir . '/' . $base . '.manifest.md',
		];
	}

	private static function derivative_cache_dir( int $asset_id ): string {
		$uploads = wp_upload_dir();
		return wp_normalize_path( trailingslashit( $uploads['basedir'] ) . 'vrodos-optimized-assets/asset-' . $asset_id );
	}

	private static function optimized_assets_base_dir(): string {
		$uploads = wp_upload_dir();
		return wp_normalize_path( trailingslashit( $uploads['basedir'] ) . 'vrodos-optimized-assets' );
	}

	private static function delete_asset_derivative_cache( int $asset_id ): void {
		if ( $asset_id <= 0 ) {
			return;
		}

		$dir = self::derivative_cache_dir( $asset_id );
		if ( self::is_safe_derivative_cache_dir( $dir, $asset_id ) && is_dir( $dir ) ) {
			self::delete_directory_tree( $dir );
		}

		delete_post_meta( $asset_id, self::META_KEY );
		delete_post_meta( $asset_id, self::ANALYSIS_META_KEY );
	}

	private static function is_safe_derivative_cache_dir( string $dir, int $asset_id ): bool {
		$base = self::optimized_assets_base_dir();
		$expected = wp_normalize_path( trailingslashit( $base ) . 'asset-' . $asset_id );

		if ( $dir !== $expected ) {
			return false;
		}

		$real_base = realpath( $base );
		$real_dir  = realpath( $dir );
		if ( ! is_string( $real_base ) || ! is_string( $real_dir ) ) {
			return false;
		}

		$real_base = wp_normalize_path( $real_base );
		$real_dir  = wp_normalize_path( $real_dir );

		return str_starts_with( $real_dir, trailingslashit( $real_base ) );
	}

	private static function delete_directory_tree( string $dir ): void {
		$entries = scandir( $dir );
		if ( false === $entries ) {
			return;
		}

		foreach ( $entries as $entry ) {
			if ( '.' === $entry || '..' === $entry ) {
				continue;
			}

			$path = $dir . DIRECTORY_SEPARATOR . $entry;
			if ( is_link( $path ) || is_file( $path ) ) {
				wp_delete_file( $path );
				continue;
			}

			if ( is_dir( $path ) ) {
				self::delete_directory_tree( $path );
			}
		}

		@rmdir( $dir );
	}

	private function store_derivative_record( int $asset_id, array $result ): void {
		$record = $result['record'];
		$paths  = $result['paths'];
		$profile = $result['profile'];
		$meta   = self::get_derivative_meta( $asset_id );

		$meta['derivatives'][ $profile ] = [
			'profile'             => $profile,
			'status'              => 'ready',
			'url'                 => esc_url_raw( $paths['url'] ),
			'path'                => wp_normalize_path( $paths['file'] ),
			'manifestPath'        => wp_normalize_path( $paths['manifest'] ),
			'sourceUrl'           => esc_url_raw( (string) ( $record['sourceUrl'] ?? '' ) ),
			'sourcePath'          => wp_normalize_path( (string) ( $record['sourcePath'] ?? '' ) ),
			'sourceSizeBytes'     => (int) ( $record['sourceSizeBytes'] ?? 0 ),
			'derivativeSizeBytes' => (int) ( $record['derivativeSizeBytes'] ?? 0 ),
			'reductionBytes'      => (int) ( $record['reductionBytes'] ?? 0 ),
			'reductionPercent'    => is_numeric( $record['reductionPercent'] ?? null ) ? (float) $record['reductionPercent'] : 0.0,
			'extensions'          => $record['derivative']['extensions']['used'] ?? [],
			'generatedAt'         => current_time( 'mysql', true ),
		];

		if ( empty( $meta['activeProfile'] ) ) {
			$meta['activeProfile'] = $profile;
		}
		$meta['lastError'] = '';

		update_post_meta( $asset_id, self::META_KEY, $meta );
	}

	private function record_error( int $asset_id, string $message ): void {
		$meta              = self::get_derivative_meta( $asset_id );
		$meta['lastError'] = wp_strip_all_tags( $message );
		update_post_meta( $asset_id, self::META_KEY, $meta );
	}

	private function redirect_to_asset( int $asset_id, string $notice ): void {
		$url = add_query_arg(
			'vrodos_optimize_notice',
			sanitize_key( $notice ),
			get_edit_post_link( $asset_id, 'raw' ) ?: admin_url( 'edit.php?post_type=vrodos_asset3d' )
		);
		wp_safe_redirect( $url );
		exit;
	}

	private static function is_derivative_usable( array $derivative, string $source_url ): bool {
		return '' === self::derivative_unusable_reason( $derivative, $source_url );
	}

	private static function derivative_unusable_reason( array $derivative, string $source_url ): string {
		if ( ( $derivative['status'] ?? '' ) !== 'ready' || empty( $derivative['url'] ) ) {
			return 'Derivative is not marked ready.';
		}

		if ( ! empty( $derivative['path'] ) && ! is_file( (string) $derivative['path'] ) ) {
			return 'Derivative file is missing.';
		}

		$derivative_source = (string) ( $derivative['sourceUrl'] ?? '' );
		if ( '' !== $derivative_source && self::normalize_url_path( $derivative_source ) !== self::normalize_url_path( $source_url ) ) {
			return 'Source GLB URL has changed since the derivative was generated.';
		}

		return '';
	}

	private static function normalize_url_path( string $url ): string {
		$path = wp_parse_url( self::strip_url_query_fragment( $url ), PHP_URL_PATH );
		if ( ! is_string( $path ) ) {
			return '';
		}
		return '/' . ltrim( rawurldecode( str_replace( '\\', '/', $path ) ), '/' );
	}

	private static function strip_url_query_fragment( string $url ): string {
		$without_fragment = explode( '#', $url, 2 )[0];
		return explode( '?', $without_fragment, 2 )[0];
	}
}
