<?php

/** Staged import manifests, ownership validation, and storage locations. */
class VRodos_Asset_Import_Session {
	public static function read_owned_manifest( string $session_dir ): array|WP_Error {
		$manifest = self::read_staged_manifest( $session_dir );
		if ( is_wp_error( $manifest ) ) {
			return $manifest;
		}
		if ( ! self::can_access_staged_manifest( $manifest ) ) {
			return new WP_Error( 'manifest_owner', 'The staged model upload belongs to a different user.' );
		}
		return $manifest;
	}

	public static function read_staged_manifest( string $session_dir ): array|WP_Error {
		$manifest_path = trailingslashit( $session_dir ) . 'manifest.json';
		if ( ! is_file( $manifest_path ) ) {
			return new WP_Error( 'manifest_missing', 'The staged model upload manifest is missing.' );
		}

		$manifest = json_decode( (string) file_get_contents( $manifest_path ), true );
		if ( ! is_array( $manifest ) ) {
			return new WP_Error( 'manifest_invalid', 'The staged model upload manifest is invalid.' );
		}

		return $manifest;
	}


	public static function write_staged_manifest( string $session_dir, array $manifest ): void {
		file_put_contents(
			trailingslashit( $session_dir ) . 'manifest.json',
			wp_json_encode( $manifest )
		);
	}


	public static function update_staged_prepare_progress( string $session_dir, array $fallback_manifest, int $percent, string $message, string $status ): array {
		$current_manifest = self::read_staged_manifest( $session_dir );
		$manifest         = is_wp_error( $current_manifest ) ? $fallback_manifest : $current_manifest;
		$manifest['prepare_status']     = sanitize_key( $status );
		$manifest['prepare_percent']    = max( 0, min( 100, $percent ) );
		$manifest['prepare_message']    = sanitize_text_field( $message );
		$manifest['prepare_updated_at'] = time();
		self::write_staged_manifest( $session_dir, $manifest );

		return $manifest;
	}


	public static function prepared_glb_path_from_manifest( string $session_dir, array $manifest ): string {
		$prepared_glb = isset( $manifest['prepared_glb'] ) ? sanitize_file_name( (string) $manifest['prepared_glb'] ) : '';
		if ( '' === $prepared_glb ) {
			return '';
		}

		$path = trailingslashit( $session_dir ) . $prepared_glb;
		return is_file( $path ) ? $path : '';
	}


	public static function prepared_glb_url_from_manifest( string $session_url, array $manifest ): string {
		$prepared_glb = isset( $manifest['prepared_glb'] ) ? sanitize_file_name( (string) $manifest['prepared_glb'] ) : '';
		if ( '' === $prepared_glb ) {
			return '';
		}

		return esc_url_raw( add_query_arg( [ 'file' => basename( $prepared_glb ), 'v' => (string) ( $manifest['prepared_at'] ?? time() ) ], $session_url ) );
	}


	public static function can_access_staged_manifest( array $manifest ): bool {
		$project_id = absint( $manifest['project_id'] ?? 0 );

		return (int) ( $manifest['user_id'] ?? 0 ) === get_current_user_id()
			&& $project_id > 0
			&& 'vrodos_game' === get_post_type( $project_id )
			&& current_user_can( 'edit_post', $project_id );
	}


	public static function user_staged_root( string $upload_basedir, int $user_id ): string {
		$root = VRodos_Storage_Manager::private_site_root();
		return is_string( $root ) ? trailingslashit( $root ) . 'tmp/import' : '';
	}


	public static function staged_session_dir( string $upload_basedir, int $user_id, string $token ): string {
		return trailingslashit( self::user_staged_root( $upload_basedir, $user_id ) ) . sanitize_key( $token );
	}


	public static function staged_session_url( string $upload_baseurl, int $user_id, string $token ): string {
		return add_query_arg( [ 'action' => 'vrodos_private_media', 'staging_token' => sanitize_key( $token ) ], admin_url( 'admin-ajax.php' ) );
	}

}
