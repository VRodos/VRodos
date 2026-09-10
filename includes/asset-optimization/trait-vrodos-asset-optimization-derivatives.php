<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

trait VRodos_Asset_Optimization_Derivative_Service {
	private static function supported_profiles(): array {
		return [
			'safe-draco'    => 'Safe Draco',
			'safe-meshopt'  => 'Safe Meshopt',
			'web-high'      => 'Web High (4096px KTX2)',
			'web-medium'    => 'Web Medium (2048px KTX2)',
			'web-low'       => 'Web Low (1024px KTX2)',
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
				'schemaVersion' => 2,
				'derivatives'   => [],
				'webVariants'   => [],
				'webProfileDefaults' => [],
				'lastError'     => '',
			]
		);
	}

	private static function ensure_current_derivative_schema( int $asset_id ): void {
		$raw = get_post_meta( $asset_id, self::META_KEY, true );
		if ( is_array( $raw ) && ! empty( $raw ) && 2 !== absint( $raw['schemaVersion'] ?? 0 ) ) {
			self::cancel_asset_optimization_jobs( $asset_id );
			self::delete_asset_derivative_cache( $asset_id );
		}
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

		if ( ! VRodos_Storage_Manager::is_glb_file( $source_path ) ) {
			return new WP_Error( 'vrodos_glb_source_invalid_type', 'The source asset is not a GLB file.' );
		}

		if ( is_numeric( $source_meta ) && VRodos_Storage_Manager::attachment_is_owned_by( (int) $source_meta, 'asset', $asset_id ) ) {
			$normalized_path = VRodos_Storage_Manager::normalize_glb_attachment( (int) $source_meta, $asset_id );
			if ( ! is_wp_error( $normalized_path ) ) {
				$source_path = $normalized_path;
			}
		}

		$size = filesize( $source_path );

		$source = [
			'meta'      => $source_meta,
			'attachmentId' => is_numeric( $source_meta ) ? (int) $source_meta : 0,
			'url'       => $source_url,
			'path'      => $source_path,
			'sizeBytes' => false === $size ? 0 : (int) $size,
		];
		$snapshot = self::refresh_source_snapshot( $asset_id, $source );
		if ( ! is_wp_error( $snapshot ) ) {
			$source['sha256'] = (string) $snapshot['sha256'];
			$source['generation'] = absint( $snapshot['generation'] );
			$source['modifiedAt'] = absint( $snapshot['modifiedAt'] );
		}
		return $source;
	}

	private static function read_source_snapshot( int $asset_id ): array {
		$snapshot = get_post_meta( $asset_id, self::SOURCE_META_KEY, true );
		return is_array( $snapshot ) ? $snapshot : [];
	}

	private static function refresh_source_snapshot( int $asset_id, array $source ) {
		$path = wp_normalize_path( (string) ( $source['path'] ?? '' ) );
		if ( '' === $path || ! is_file( $path ) || ! is_readable( $path ) ) {
			return new WP_Error( 'vrodos_glb_source_hash_failed', 'The active GLB source cannot be hashed.' );
		}

		$size = (int) ( filesize( $path ) ?: 0 );
		$modified_at = (int) ( filemtime( $path ) ?: 0 );
		$attachment_id = absint( $source['attachmentId'] ?? 0 );
		$existing = self::read_source_snapshot( $asset_id );
		$same_file = (string) ( $existing['path'] ?? '' ) === $path
			&& absint( $existing['attachmentId'] ?? 0 ) === $attachment_id
			&& absint( $existing['sizeBytes'] ?? 0 ) === $size
			&& absint( $existing['modifiedAt'] ?? 0 ) === $modified_at
			&& preg_match( '/^[a-f0-9]{64}$/', (string) ( $existing['sha256'] ?? '' ) );
		if ( $same_file ) {
			return $existing;
		}

		$sha256 = hash_file( 'sha256', $path );
		if ( ! is_string( $sha256 ) || '' === $sha256 ) {
			return new WP_Error( 'vrodos_glb_source_hash_failed', 'The active GLB source could not be hashed.' );
		}

		$identity_changed = '' !== (string) ( $existing['sha256'] ?? '' )
			&& ( (string) $existing['sha256'] !== $sha256 || absint( $existing['attachmentId'] ?? 0 ) !== $attachment_id );
		$snapshot = [
			'schemaVersion' => 1,
			'attachmentId' => $attachment_id,
			'path'         => $path,
			'sizeBytes'    => $size,
			'modifiedAt'   => $modified_at,
			'sha256'       => $sha256,
			'generation'   => max( 1, absint( $existing['generation'] ?? 0 ) + ( $identity_changed ? 1 : 0 ) ),
			'updatedAt'    => current_time( 'mysql', true ),
		];
		update_post_meta( $asset_id, self::SOURCE_META_KEY, $snapshot );
		return $snapshot;
	}

	private static function source_identity_matches( int $asset_id, string $sha256, int $generation ): bool {
		$snapshot = self::read_source_snapshot( $asset_id );
		$active_source = get_post_meta( $asset_id, 'vrodos_asset3d_glb', true );
		$active_attachment_id = is_numeric( $active_source ) ? absint( $active_source ) : 0;
		return '' !== $sha256
			&& hash_equals( (string) ( $snapshot['sha256'] ?? '' ), $sha256 )
			&& absint( $snapshot['generation'] ?? 0 ) === $generation
			&& absint( $snapshot['attachmentId'] ?? 0 ) === $active_attachment_id
			&& 'vrodos_asset3d' === get_post_type( $asset_id );
	}

	private static function acquire_optimizer_lease( string $owner, int $ttl_seconds ): string {
		$token = wp_generate_uuid4();
		$lease = [
			'owner'     => sanitize_text_field( $owner ),
			'token'     => $token,
			'expiresAt' => time() + max( 60, $ttl_seconds ),
		];
		if ( add_option( self::OPTIMIZER_LEASE_OPTION, $lease, '', false ) ) {
			return $token;
		}
		$current = get_option( self::OPTIMIZER_LEASE_OPTION, [] );
		if ( is_array( $current ) && absint( $current['expiresAt'] ?? 0 ) < time() ) {
			delete_option( self::OPTIMIZER_LEASE_OPTION );
			return add_option( self::OPTIMIZER_LEASE_OPTION, $lease, '', false ) ? $token : '';
		}
		return '';
	}

	private static function release_optimizer_lease( string $token ): void {
		$current = get_option( self::OPTIMIZER_LEASE_OPTION, [] );
		if ( is_array( $current ) && '' !== $token && hash_equals( (string) ( $current['token'] ?? '' ), $token ) ) {
			delete_option( self::OPTIMIZER_LEASE_OPTION );
		}
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

	private function generate_derivative( int $asset_id, array $source, string $profile, array $options = [] ) {
		$is_web_profile = str_starts_with( $profile, 'web-' );
		$is_editor_family_profile = $is_web_profile || 'editor-preview' === $profile;
		if ( $is_web_profile ) {
			$options = array_merge(
				[
					'protectGeometry' => true,
					'textureMaxSize'  => match ( $profile ) {
						'web-low' => 1024,
						'web-medium' => 2048,
						default => 4096,
					},
					'pipelineVersion' => self::DESKTOP_PROFILE_PIPELINE_VERSION,
					'recipe'          => $profile,
				],
				$options
			);
		}
		$paths = self::build_derivative_paths( $asset_id, $source, $profile, (string) ( $options['jobKey'] ?? '' ) );

		if ( ! wp_mkdir_p( $paths['dir'] ) ) {
			return new WP_Error( 'vrodos_derivative_dir_failed', 'Could not create derivative output directory.' );
		}

		wp_raise_memory_limit( 'admin' );
		@set_time_limit( 1800 );

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
		if ( $is_web_profile ) {
			$args[] = '--progress-file';
			$args[] = $paths['progress'];
			$args[] = '--job-key';
			$args[] = (string) ( $options['jobKey'] ?? '' );
			$args[] = '--queued-at';
			$args[] = (string) ( $options['queuedAt'] ?? '' );
		}
		if ( $is_editor_family_profile ) {
			$args[] = '--source-sha256';
			$args[] = (string) ( $source['sha256'] ?? '' );
			if ( ! empty( $paths['preparedBaseline'] ) && ! empty( $paths['preparedAnalysis'] ) ) {
				$args[] = '--prepared-baseline';
				$args[] = $paths['preparedBaseline'];
				$args[] = '--prepared-analysis';
				$args[] = $paths['preparedAnalysis'];
				if ( $is_web_profile && ! empty( $options['writePreparedBaseline'] ) ) {
					$args[] = '--write-prepared-baseline';
				}
			}
		}
		if ( ! empty( $options['protectGeometry'] ) ) {
			$args[] = '--protect-geometry';
		}
		if ( ! empty( $options['textureMaxSize'] ) ) {
			$args[] = '--texture-max-size';
			$args[] = (string) absint( $options['textureMaxSize'] );
		}

		$command = implode( ' ', array_map( 'escapeshellarg', $args ) ) . ' 2>&1';
		$output = [];
		$code   = 0;
		exec( $command, $output, $code );

		if ( 0 !== $code ) {
			$message = trim( implode( "\n", array_slice( $output, -12 ) ) );
			if ( preg_match( '/(?:node:\s*not found|node.*not recognized)/i', $message ) ) {
				$message = 'Node.js is not available to the WordPress PHP process. Configure the vrodos_asset_optimizer_node_command filter with the Node executable path.';
			}
			return new WP_Error(
				'vrodos_optimizer_failed',
				'glTF optimization failed: ' . $message
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
			$message = trim( (string) ( $record['error'] ?? '' ) );
			return new WP_Error( 'vrodos_optimizer_derivative_missing', $message ?: 'Optimizer did not produce a ready derivative file.' );
		}
		if (
			str_starts_with( $profile, 'web-' )
			&& (
				$profile !== sanitize_key( (string) ( $record['profile'] ?? '' ) )
				|| ! hash_equals( (string) ( $options['jobKey'] ?? '' ), (string) ( $record['jobKey'] ?? '' ) )
				|| ! hash_equals( (string) ( $source['sha256'] ?? '' ), (string) ( $record['sourceSha256'] ?? '' ) )
				|| wp_normalize_path( (string) ( $record['derivativePath'] ?? '' ) ) !== wp_normalize_path( (string) $paths['file'] )
			)
		) {
			self::delete_generated_derivative_files( $paths );
			return new WP_Error( 'vrodos_optimizer_identity_mismatch', 'Optimizer output did not match the queued immutable job.' );
		}

		return [
			'profile'  => $profile,
			'paths'    => $paths,
			'manifest' => $manifest,
			'record'   => $record,
			'options'  => $options,
		];
	}

	private static function build_derivative_paths( int $asset_id, array $source, string $profile, string $job_key = '' ): array {
		$dir = VRodos_Storage_Manager::private_entity_directory( 'asset', $asset_id, 'derivatives', $profile );
		if ( is_wp_error( $dir ) ) {
			throw new RuntimeException( $dir->get_error_message() );
		}
		$dir     = untrailingslashit( $dir );
		$job_suffix = str_starts_with( $profile, 'web-' ) && '' !== $job_key ? '.' . substr( sanitize_key( $job_key ), 0, 24 ) : '';
		$base    = sanitize_file_name( pathinfo( (string) $source['path'], PATHINFO_FILENAME ) . '.' . $profile . $job_suffix );
		$source_hash = preg_replace( '/[^a-f0-9]/', '', strtolower( (string) ( $source['sha256'] ?? '' ) ) );
		$prepared_dir = dirname( $dir ) . '/_prepared';
		$prepared_base = $prepared_dir . '/' . substr( $source_hash, 0, 24 ) . '.v' . self::DESKTOP_PROFILE_PIPELINE_VERSION;

		return [
			'dir'      => $dir,
			'file'     => $dir . '/' . $base . '.glb',
			'manifest' => $dir . '/' . $base . '.manifest.json',
			'markdown' => $dir . '/' . $base . '.manifest.md',
			'progress' => $dir . '/' . $base . '.progress.json',
			'preparedBaseline' => ( str_starts_with( $profile, 'web-' ) || 'editor-preview' === $profile ) && '' !== $source_hash ? $prepared_base . '.glb' : '',
			'preparedAnalysis' => ( str_starts_with( $profile, 'web-' ) || 'editor-preview' === $profile ) && '' !== $source_hash ? $prepared_base . '.json' : '',
		];
	}

	private static function derivative_cache_dir( int $asset_id ): string {
		$root = VRodos_Storage_Manager::private_site_root( false );
		return is_string( $root ) ? wp_normalize_path( trailingslashit( $root ) . 'assets/' . $asset_id . '/derivatives' ) : '';
	}

	private static function optimized_assets_base_dir(): string {
		$root = VRodos_Storage_Manager::private_site_root( false );
		return is_string( $root ) ? wp_normalize_path( trailingslashit( $root ) . 'assets' ) : '';
	}

	private static function delete_asset_derivative_cache( int $asset_id ): void {
		if ( $asset_id <= 0 ) {
			return;
		}

		$meta = self::get_derivative_meta( $asset_id );
		$records = array_merge(
			(array) ( $meta['derivatives'] ?? [] ),
			(array) ( $meta['webVariants'] ?? [] )
		);
		$deleted_attachment_ids = [];
		foreach ( $records as $derivative ) {
			$attachment_id = is_array( $derivative ) ? absint( $derivative['attachmentId'] ?? 0 ) : 0;
			if ( $attachment_id && empty( $deleted_attachment_ids[ $attachment_id ] ) ) {
				VRodos_Storage_Manager::delete_attachment_if_owned_by( $attachment_id, 'asset', $asset_id );
				$deleted_attachment_ids[ $attachment_id ] = true;
			}
		}

		$dir = self::derivative_cache_dir( $asset_id );
		if ( self::is_safe_derivative_cache_dir( $dir, $asset_id ) && is_dir( $dir ) ) {
			self::delete_directory_tree( $dir );
		}

		delete_post_meta( $asset_id, self::META_KEY );
		delete_post_meta( $asset_id, self::ANALYSIS_META_KEY );
	}

	private static function cancel_asset_optimization_jobs( int $asset_id ): void {
		if ( $asset_id <= 0 ) {
			return;
		}
		$meta = self::get_derivative_meta( $asset_id );
		foreach ( (array) ( $meta['webVariants'] ?? [] ) as $record ) {
			$args = is_array( $record ) ? (array) ( $record['cronArgs'] ?? [] ) : [];
			if ( $args && function_exists( 'wp_clear_scheduled_hook' ) ) {
				wp_clear_scheduled_hook( self::DESKTOP_PROFILE_CRON_HOOK, $args );
			}
			$progress_path = is_array( $record ) ? (string) ( $record['progressPath'] ?? '' ) : '';
			if ( '' !== $progress_path && is_file( $progress_path ) ) {
				wp_delete_file( $progress_path );
			}
		}
		if ( function_exists( 'wp_clear_scheduled_hook' ) ) {
			wp_clear_scheduled_hook( self::EDITOR_PREVIEW_CRON_HOOK, [ $asset_id ] );
		}
	}

	private static function is_safe_derivative_cache_dir( string $dir, int $asset_id ): bool {
		$base = self::optimized_assets_base_dir();
		$expected = wp_normalize_path( trailingslashit( $base ) . $asset_id . '/derivatives' );

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
		$source = self::get_source_glb( $asset_id );
		$options = is_array( $result['options'] ?? null ) ? $result['options'] : [];
		$is_web_profile = str_starts_with( $profile, 'web-' );
		$job_key = sanitize_key( (string) ( $options['jobKey'] ?? $record['jobKey'] ?? '' ) );
		$source_hash = (string) ( $options['sourceSha256'] ?? $record['sourceSha256'] ?? '' );
		$source_generation = absint( $options['sourceGeneration'] ?? 0 );

		if ( $is_web_profile && ( '' === $job_key || is_wp_error( $source ) || ! self::source_identity_matches( $asset_id, $source_hash, $source_generation ) ) ) {
			self::delete_generated_derivative_files( $paths );
			throw new RuntimeException( 'The source asset changed while its derivative was being generated; the obsolete result was discarded.' );
		}

		$attachment_id = VRodos_Storage_Manager::register_existing_private_attachment( $paths['file'], 'model/gltf-binary', $asset_id, 'asset', 'derivatives', $profile );
		if ( is_wp_error( $attachment_id ) ) {
			throw new RuntimeException( $attachment_id->get_error_message() );
		}
		$previous_record = $is_web_profile
			? (array) ( $meta['webVariants'][ $job_key ] ?? [] )
			: (array) ( $meta['derivatives'][ $profile ] ?? [] );
		$previous_attachment_id = absint( $previous_record['attachmentId'] ?? 0 );
		if ( $is_web_profile && ! self::source_identity_matches( $asset_id, $source_hash, $source_generation ) ) {
			VRodos_Storage_Manager::delete_attachment_if_owned_by( (int) $attachment_id, 'asset', $asset_id );
			self::delete_generated_derivative_files( $paths );
			throw new RuntimeException( 'The source asset changed before its derivative could be registered; the obsolete result was discarded.' );
		}
		$source_path = is_wp_error( $source ) ? (string) ( $record['sourcePath'] ?? '' ) : (string) ( $source['path'] ?? '' );
		$profile_options = array_merge(
			is_array( $record['profileOptions'] ?? null ) ? $record['profileOptions'] : [],
			$options
		);
		$profile_options['effectiveProtectGeometry'] = ! empty( $record['profileOptions']['protectGeometry'] );
		$stored_record = [
			'profile'             => $profile,
			'jobKey'              => $job_key,
			'status'              => 'ready',
			'attachmentId'        => (int) $attachment_id,
			'url'                 => VRodos_Storage_Manager::authoring_url_for_attachment( (int) $attachment_id ),
			'path'                => wp_normalize_path( $paths['file'] ),
			'manifestPath'        => wp_normalize_path( $paths['manifest'] ),
			'sourceUrl'           => esc_url_raw( (string) ( $record['sourceUrl'] ?? '' ) ),
			'sourcePath'          => wp_normalize_path( $source_path ),
			'sourceAttachmentId'  => is_wp_error( $source ) ? 0 : absint( $source['attachmentId'] ?? 0 ),
			'sourceSha256'        => $source_hash,
			'sourceGeneration'    => $source_generation,
			'sourceSizeBytes'     => (int) ( $record['sourceSizeBytes'] ?? 0 ),
			'derivativeSizeBytes' => (int) ( $record['derivativeSizeBytes'] ?? 0 ),
			'reductionBytes'      => (int) ( $record['reductionBytes'] ?? 0 ),
			'reductionPercent'    => is_numeric( $record['reductionPercent'] ?? null ) ? (float) $record['reductionPercent'] : 0.0,
			'extensions'          => $record['derivative']['extensions']['used'] ?? [],
			'profileOptions'      => $profile_options,
			'estimatedTextureMemoryBytes' => (int) ( $record['derivative']['textureMemory']['estimatedMipmappedBytes'] ?? 0 ),
			'unaccountedTextureImages' => (int) ( $record['derivative']['textureMemory']['unaccountedImages'] ?? 0 ),
			'textureImageCount'    => (int) ( $record['derivative']['counts']['images'] ?? 0 ),
			'runtimeSubstitutionReady' => ! empty( $record['runtimeSubstitutionReady'] ),
			'performance'         => is_array( $record['performance'] ?? null ) ? $record['performance'] : [],
			'stageTimings'        => is_array( $record['stageTimings'] ?? null ) ? $record['stageTimings'] : [],
			'generatedAt'         => current_time( 'mysql', true ),
		];
		if ( $is_web_profile ) {
			$meta['webVariants'][ $job_key ] = $stored_record;
			if ( absint( $profile_options['textureMaxSize'] ?? 0 ) === self::runtime_derivative_texture_cap( $profile ) ) {
				$meta['webProfileDefaults'][ $profile ] = $job_key;
				$meta['derivatives'][ $profile ] = $stored_record;
			}
		} else {
			$meta['derivatives'][ $profile ] = $stored_record;
		}

		$meta['lastError'] = '';

		$updated = update_post_meta( $asset_id, self::META_KEY, $meta );
		if ( false === $updated && get_post_meta( $asset_id, self::META_KEY, true ) !== $meta ) {
			VRodos_Storage_Manager::delete_attachment_if_owned_by( (int) $attachment_id, 'asset', $asset_id );
			if ( is_file( $paths['manifest'] ) ) {
				wp_delete_file( $paths['manifest'] );
			}
			throw new RuntimeException( 'WordPress rejected the derivative metadata update.' );
		}
		if ( $is_web_profile && ! self::source_identity_matches( $asset_id, $source_hash, $source_generation ) ) {
			$current_meta = self::get_derivative_meta( $asset_id );
			unset( $current_meta['webVariants'][ $job_key ] );
			if ( (string) ( $current_meta['webProfileDefaults'][ $profile ] ?? '' ) === $job_key ) {
				unset( $current_meta['webProfileDefaults'][ $profile ], $current_meta['derivatives'][ $profile ] );
			}
			update_post_meta( $asset_id, self::META_KEY, $current_meta );
			VRodos_Storage_Manager::delete_attachment_if_owned_by( (int) $attachment_id, 'asset', $asset_id );
			self::delete_generated_derivative_files( $paths );
			throw new RuntimeException( 'The source asset changed while the derivative record was being published; the obsolete result was discarded.' );
		}
		if ( $previous_attachment_id && $previous_attachment_id !== (int) $attachment_id ) {
			VRodos_Storage_Manager::delete_attachment_if_owned_by( $previous_attachment_id, 'asset', $asset_id );
		}
	}

	private static function delete_generated_derivative_files( array $paths ): void {
		foreach ( [ 'file', 'manifest', 'markdown', 'progress', 'preparedBaseline', 'preparedAnalysis' ] as $key ) {
			$path = (string) ( $paths[ $key ] ?? '' );
			if ( '' !== $path && is_file( $path ) ) {
				wp_delete_file( $path );
			}
		}
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

		$source_path = (string) ( $derivative['sourcePath'] ?? '' );
		$source_hash = (string) ( $derivative['sourceSha256'] ?? '' );
		if ( '' !== $source_hash && ! is_file( $source_path ) ) {
			return 'Source GLB file is missing.';
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
