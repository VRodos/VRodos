<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Owns every mutable VRodos filesystem path.
 *
 * Callers provide immutable WordPress entity IDs and a storage role. Slugs,
 * request globals, and user supplied path fragments are never accepted.
 */
final class VRodos_Storage_Manager {
	public const STORAGE_SCHEMA_OPTION = 'vrodos_storage_schema_version';
	private const PRIVATE_MARKER_META = '_vrodos_private_storage';
	private const OWNER_TYPE_META     = '_vrodos_storage_owner_type';
	private const OWNER_ID_META       = '_vrodos_storage_owner_id';
	private const ROLE_META           = '_vrodos_storage_role';

	private static ?WP_Error $private_root_error = null;

	public static function register_hooks(): void {
		add_action( 'wp_ajax_vrodos_private_media', [ self::class, 'serve_private_media' ] );
		add_action( 'delete_attachment', [ self::class, 'delete_private_attachment_file' ], 5 );
		add_action( 'admin_notices', [ self::class, 'render_storage_diagnostic' ] );
		add_filter( 'wp_get_attachment_url', [ self::class, 'filter_private_attachment_url' ], 10, 2 );
	}

	public static function storage_schema_ready(): bool {
		return 1 === (int) get_option( self::STORAGE_SCHEMA_OPTION, 0 );
	}

	public static function private_site_root( bool $create = true ) {
		$base = defined( 'VRODOS_PRIVATE_STORAGE_DIR' )
			? (string) VRODOS_PRIVATE_STORAGE_DIR
			: dirname( untrailingslashit( ABSPATH ) ) . DIRECTORY_SEPARATOR . 'vrodos-private';
		$base = self::normalize_absolute_path( $base );

		if ( ! self::is_absolute_path( $base ) ) {
			return self::private_root_error( 'The VRodos private storage path must be absolute.' );
		}

		$public_roots = [ self::resolved_path( ABSPATH ) ];
		$uploads      = wp_upload_dir( null, false );
		if ( empty( $uploads['error'] ) ) {
			$public_roots[] = self::resolved_path( (string) $uploads['basedir'] );
		}
		foreach ( $public_roots as $public_root ) {
			if ( self::path_is_within( $base, $public_root ) ) {
				return self::private_root_error( 'The VRodos private storage directory is inside a public web root.' );
			}
		}

		$site_root = self::join( $base, 'site-' . get_current_blog_id() );
		if ( $create && ! is_dir( $site_root ) && ! wp_mkdir_p( $site_root ) ) {
			return self::private_root_error( 'VRodos could not create its private storage directory.' );
		}
		if ( $create && ! is_writable( $site_root ) ) {
			return self::private_root_error( 'The VRodos private storage directory is not writable.' );
		}
		if ( is_dir( $site_root ) ) {
			$site_root = self::resolved_path( $site_root );
			foreach ( $public_roots as $public_root ) {
				if ( self::path_is_within( $site_root, $public_root ) ) {
					return self::private_root_error( 'The VRodos private storage directory resolves inside a public web root.' );
				}
			}
		}

		self::$private_root_error = null;
		return trailingslashit( $site_root );
	}

	public static function private_entity_directory( string $entity_type, int $entity_id, string $role, string $profile = '' ) {
		$root = self::private_site_root();
		if ( is_wp_error( $root ) ) {
			return $root;
		}
		if ( $entity_id < 1 ) {
			return new WP_Error( 'vrodos_invalid_storage_owner', 'A positive entity ID is required.' );
		}

		$parts = [];
		if ( 'asset' === $entity_type && in_array( $role, [ 'source', 'previews', 'derivatives' ], true ) ) {
			$parts = [ 'assets', (string) $entity_id, $role ];
			if ( 'derivatives' === $role ) {
				$profile = sanitize_key( $profile );
				if ( '' === $profile ) {
					return new WP_Error( 'vrodos_invalid_storage_profile', 'A derivative profile is required.' );
				}
				$parts[] = $profile;
			}
		} elseif ( 'scene' === $entity_type && in_array( $role, [ 'previews', 'backgrounds' ], true ) ) {
			$parts = [ 'scenes', (string) $entity_id, $role ];
		} else {
			return new WP_Error( 'vrodos_invalid_storage_role', 'The requested VRodos storage role is invalid.' );
		}

		$directory = self::join( $root, ...$parts );
		if ( ! wp_mkdir_p( $directory ) || self::path_contains_link( $directory, $root ) ) {
			return new WP_Error( 'vrodos_storage_unavailable', 'VRodos could not prepare the private storage directory.' );
		}
		$directory = self::resolved_path( $directory );
		return self::path_is_within( $directory, $root )
			? trailingslashit( $directory )
			: new WP_Error( 'vrodos_storage_unavailable', 'The private storage role resolves outside its site root.' );
	}

	public static function temporary_directory( string $operation, string $token = '' ) {
		$root = self::private_site_root();
		if ( is_wp_error( $root ) ) {
			return $root;
		}
		$operation = sanitize_key( $operation );
		$token     = '' !== $token ? sanitize_key( $token ) : strtolower( wp_generate_password( 32, false, false ) );
		if ( '' === $operation || '' === $token ) {
			return new WP_Error( 'vrodos_invalid_temporary_path', 'A valid operation and random token are required.' );
		}
		$directory = self::join( $root, 'tmp', $operation, $token );
		if ( ! wp_mkdir_p( $directory ) || self::path_contains_link( $directory, $root ) ) {
			return new WP_Error( 'vrodos_storage_unavailable', 'VRodos could not prepare temporary storage.' );
		}
		$directory = self::resolved_path( $directory );
		return self::path_is_within( $directory, $root )
			? trailingslashit( $directory )
			: new WP_Error( 'vrodos_storage_unavailable', 'The temporary directory resolves outside the private site root.' );
	}

	public static function published_project_directory( int $project_id, string $role = '' ) {
		if ( $project_id < 1 || ( '' !== $role && ! in_array( $role, [ 'clients', 'media' ], true ) ) ) {
			return new WP_Error( 'vrodos_invalid_publication_path', 'The requested publication path is invalid.' );
		}
		$uploads = wp_upload_dir( null, true );
		if ( ! empty( $uploads['error'] ) ) {
			return new WP_Error( 'vrodos_uploads_unavailable', (string) $uploads['error'] );
		}
		$parts = [ (string) $uploads['basedir'], 'vrodos', 'published', 'projects', (string) $project_id ];
		if ( '' !== $role ) {
			$parts[] = $role;
		}
		$directory = self::join( ...$parts );
		$uploads_root = self::resolved_path( (string) $uploads['basedir'] );
		if ( ! wp_mkdir_p( $directory ) || self::path_contains_link( $directory, $uploads_root ) ) {
			return new WP_Error( 'vrodos_publication_unavailable', 'VRodos could not prepare the project publication directory.' );
		}
		$directory = self::resolved_path( $directory );
		return self::path_is_within( $directory, $uploads_root )
			? trailingslashit( $directory )
			: new WP_Error( 'vrodos_publication_unavailable', 'The publication directory resolves outside WordPress uploads.' );
	}

	public static function published_project_url( int $project_id, string $role = '', string $relative = '' ) {
		if ( $project_id < 1 || ( '' !== $role && ! in_array( $role, [ 'clients', 'media' ], true ) ) ) {
			return new WP_Error( 'vrodos_invalid_publication_url', 'The requested publication URL is invalid.' );
		}
		$uploads = wp_upload_dir( null, false );
		if ( ! empty( $uploads['error'] ) ) {
			return new WP_Error( 'vrodos_uploads_unavailable', (string) $uploads['error'] );
		}
		$url = trailingslashit( (string) $uploads['baseurl'] ) . 'vrodos/published/projects/' . $project_id . '/';
		if ( '' !== $role ) {
			$url .= $role . '/';
		}
		return $url . ltrim( str_replace( '\\', '/', $relative ), '/' );
	}

	public static function store_uploaded_attachment( array $file, int $owner_id, string $owner_type, string $role, string $profile = '' ) {
		$error = (int) ( $file['error'] ?? UPLOAD_ERR_NO_FILE );
		if ( UPLOAD_ERR_OK !== $error || empty( $file['tmp_name'] ) || ! is_file( (string) $file['tmp_name'] ) ) {
			return new WP_Error( 'vrodos_upload_invalid', 'The uploaded file is incomplete or invalid.' );
		}
		$name = sanitize_file_name( (string) ( $file['name'] ?? 'upload.bin' ) );
		if ( '' === $name ) {
			return new WP_Error( 'vrodos_upload_invalid_name', 'The uploaded filename is invalid.' );
		}
		$checked = wp_check_filetype_and_ext( (string) $file['tmp_name'], $name );
		$mime    = (string) ( $checked['type'] ?? '' );
		if ( '' === $mime || strtolower( (string) ( $checked['ext'] ?? '' ) ) !== strtolower( pathinfo( $name, PATHINFO_EXTENSION ) ) ) {
			return new WP_Error( 'vrodos_upload_invalid_type', 'WordPress rejected the uploaded file type.' );
		}
		return self::store_attachment_file( (string) $file['tmp_name'], $name, $mime, $owner_id, $owner_type, $role, $profile, true );
	}

	public static function store_attachment_bytes( string $bytes, string $filename, string $mime, int $owner_id, string $owner_type, string $role ) {
		$directory = self::private_entity_directory( $owner_type, $owner_id, $role );
		if ( is_wp_error( $directory ) ) {
			return $directory;
		}
		$filename    = wp_unique_filename( $directory, sanitize_file_name( $filename ) );
		$temporary   = $directory . '.' . wp_generate_password( 20, false, false ) . '.partial';
		$destination = $directory . $filename;
		if ( false === file_put_contents( $temporary, $bytes, LOCK_EX ) || ! @rename( $temporary, $destination ) ) {
			wp_delete_file( $temporary );
			return new WP_Error( 'vrodos_storage_write_failed', 'VRodos could not store the uploaded content.' );
		}
		return self::insert_private_attachment( $destination, $filename, $mime, $owner_id, $owner_type, $role );
	}

	public static function import_existing_file( string $source, string $filename, string $mime, int $owner_id, string $owner_type, string $role, string $profile = '' ) {
		return self::store_attachment_file( $source, $filename, $mime, $owner_id, $owner_type, $role, $profile, false );
	}

	public static function register_existing_private_attachment( string $path, string $mime, int $owner_id, string $owner_type, string $role, string $profile = '' ) {
		$directory = self::private_entity_directory( $owner_type, $owner_id, $role, $profile );
		if ( is_wp_error( $directory ) ) {
			return $directory;
		}
		if ( ! is_file( $path ) || ! self::path_is_within( $path, $directory ) ) {
			return new WP_Error( 'vrodos_unowned_private_file', 'The file is outside the requested private storage role.' );
		}
		return self::insert_private_attachment( $path, basename( $path ), $mime, $owner_id, $owner_type, $role );
	}

	public static function authoring_url_for_attachment( int $attachment_id, string $image_size = '' ): string {
		if ( '1' !== (string) get_post_meta( $attachment_id, self::PRIVATE_MARKER_META, true ) ) {
			$url = '' !== $image_size
				? wp_get_attachment_image_url( $attachment_id, $image_size )
				: wp_get_attachment_url( $attachment_id );
			return is_string( $url ) ? $url : '';
		}
		$args = [
			'action' => 'vrodos_private_media',
			'id'     => $attachment_id,
		];
		if ( '' !== $image_size ) {
			$args['size'] = sanitize_key( $image_size );
		}
		return add_query_arg( $args, admin_url( 'admin-ajax.php' ) );
	}

	public static function filter_private_attachment_url( string $url, int $attachment_id ): string {
		return self::is_private_attachment( $attachment_id )
			? add_query_arg( [ 'action' => 'vrodos_private_media', 'id' => $attachment_id ], admin_url( 'admin-ajax.php' ) )
			: $url;
	}

	public static function is_private_attachment( int $attachment_id ): bool {
		return '1' === (string) get_post_meta( $attachment_id, self::PRIVATE_MARKER_META, true );
	}

	public static function attachment_is_owned_by( int $attachment_id, string $owner_type, int $owner_id ): bool {
		return
			$attachment_id > 0
			&& self::is_private_attachment( $attachment_id )
			&& (string) get_post_meta( $attachment_id, self::OWNER_TYPE_META, true ) === $owner_type
			&& absint( get_post_meta( $attachment_id, self::OWNER_ID_META, true ) ) === $owner_id;
	}

	public static function mark_attachment_private( int $attachment_id, int $owner_id, string $owner_type, string $role ): bool {
		$values = [
			self::PRIVATE_MARKER_META => '1',
			self::OWNER_ID_META       => $owner_id,
			self::OWNER_TYPE_META     => $owner_type,
			self::ROLE_META           => $role,
		];
		foreach ( $values as $key => $value ) {
			$updated = update_post_meta( $attachment_id, $key, $value );
			if ( false === $updated && (string) get_post_meta( $attachment_id, $key, true ) !== (string) $value ) {
				return false;
			}
		}
		return true;
	}

	/** Copy, verify, and switch one existing attachment without changing its ID or GUID. */
	public static function migrate_attachment( int $attachment_id, int $owner_id, string $owner_type, string $role, string $profile = '' ) {
		$source = get_attached_file( $attachment_id, true );
		if ( ! is_string( $source ) || ! is_file( $source ) ) {
			return new WP_Error( 'vrodos_migration_source_missing', 'The attachment source file is missing.' );
		}
		$old_metadata = wp_get_attachment_metadata( $attachment_id );
		$legacy_files = self::attachment_file_inventory( $source, is_array( $old_metadata ) ? $old_metadata : [] );
		$directory = self::private_entity_directory( $owner_type, $owner_id, $role, $profile );
		if ( is_wp_error( $directory ) ) {
			return $directory;
		}
		$destination = $directory . wp_unique_filename( $directory, basename( $source ) );
		$temporary   = $destination . '.' . wp_generate_password( 20, false, false ) . '.partial';
		$hash        = hash_file( 'sha256', $source );
		if ( ! @copy( $source, $temporary ) || filesize( $source ) !== filesize( $temporary ) || hash_file( 'sha256', $temporary ) !== $hash || ! @rename( $temporary, $destination ) ) {
			wp_delete_file( $temporary );
			return new WP_Error( 'vrodos_migration_copy_failed', 'The attachment copy could not be verified and finalized.' );
		}
		if ( ! self::ensure_attached_file( $attachment_id, $destination ) ) {
			wp_delete_file( $destination );
			return new WP_Error( 'vrodos_migration_database_failed', 'WordPress rejected the migrated attachment path.' );
		}
		if ( ! self::mark_attachment_private( $attachment_id, $owner_id, $owner_type, $role ) ) {
			self::ensure_attached_file( $attachment_id, $source );
			self::clear_private_marker( $attachment_id );
			wp_delete_file( $destination );
			return new WP_Error( 'vrodos_migration_database_failed', 'WordPress rejected the migrated attachment ownership.' );
		}
		if ( wp_attachment_is_image( $attachment_id ) ) {
			if ( ! function_exists( 'wp_generate_attachment_metadata' ) ) {
				require_once ABSPATH . 'wp-admin/includes/image.php';
			}
			$metadata = wp_generate_attachment_metadata( $attachment_id, $destination );
			if ( ! is_array( $metadata ) || ! self::ensure_attachment_metadata( $attachment_id, $metadata ) ) {
				self::delete_generated_image_files( $destination, is_array( $metadata ) ? $metadata : [] );
				self::ensure_attached_file( $attachment_id, $source );
				if ( is_array( $old_metadata ) ) {
					wp_update_attachment_metadata( $attachment_id, $old_metadata );
				}
				self::clear_private_marker( $attachment_id );
				wp_delete_file( $destination );
				return new WP_Error( 'vrodos_migration_metadata_failed', 'WordPress rejected the migrated image metadata.' );
			}
		}
		return [ 'attachmentId' => $attachment_id, 'source' => wp_normalize_path( $source ), 'legacyFiles' => $legacy_files, 'destination' => wp_normalize_path( $destination ), 'sha256' => $hash, 'sizeBytes' => (int) filesize( $destination ) ];
	}

	/** Repair an interrupted migration's attachment path after validating private ownership and containment. */
	public static function repair_private_attachment_path( int $attachment_id, string $path ): bool {
		$root = self::private_site_root( false );
		return
			self::is_private_attachment( $attachment_id )
			&& is_string( $root )
			&& is_file( $path )
			&& self::path_is_within( $path, $root )
			&& self::ensure_attached_file( $attachment_id, $path );
	}

	private static function attachment_file_inventory( string $source, array $metadata ): array {
		$paths = [ wp_normalize_path( $source ) ];
		$directory = dirname( $source );
		foreach ( (array) ( $metadata['sizes'] ?? [] ) as $size ) {
			$file = is_array( $size ) ? basename( (string) ( $size['file'] ?? '' ) ) : '';
			if ( '' !== $file ) {
				$paths[] = wp_normalize_path( $directory . DIRECTORY_SEPARATOR . $file );
			}
		}
		$inventory = [];
		foreach ( array_unique( $paths ) as $path ) {
			if ( is_file( $path ) && ! is_link( $path ) ) {
				$inventory[] = [ 'path' => $path, 'sha256' => hash_file( 'sha256', $path ), 'sizeBytes' => (int) filesize( $path ) ];
			}
		}
		return $inventory;
	}

	public static function serve_private_media(): void {
		$method = strtoupper( (string) ( $_SERVER['REQUEST_METHOD'] ?? 'GET' ) );
		if ( ! in_array( $method, [ 'GET', 'HEAD' ], true ) ) {
			status_header( 405 );
			header( 'Allow: GET, HEAD' );
			exit;
		}
		if ( isset( $_GET['staging_token'] ) ) {
			self::serve_private_staging_file();
		}
		$attachment_id = absint( $_GET['id'] ?? 0 );
		if ( ! $attachment_id || ! self::is_private_attachment( $attachment_id ) || ! is_user_logged_in() ) {
			status_header( 404 );
			exit;
		}
		$owner_id   = absint( get_post_meta( $attachment_id, self::OWNER_ID_META, true ) );
		$owner_type = (string) get_post_meta( $attachment_id, self::OWNER_TYPE_META, true );
		if ( ! self::current_user_can_access_owner( $owner_type, $owner_id ) ) {
			status_header( 403 );
			exit;
		}
		$path = get_attached_file( $attachment_id, true );
		$root = self::private_site_root( false );
		$mime               = get_post_mime_type( $attachment_id ) ?: 'application/octet-stream';
		$requested_size_raw = (string) wp_unslash( $_GET['size'] ?? '' );
		$requested_size     = sanitize_key( $requested_size_raw );
		if ( $requested_size_raw !== $requested_size ) {
			status_header( 404 );
			exit;
		}
		if ( '' !== $requested_size && is_string( $path ) ) {
			$metadata = wp_get_attachment_metadata( $attachment_id );
			$filename = basename( (string) ( is_array( $metadata ) ? ( $metadata['sizes'][ $requested_size ]['file'] ?? '' ) : '' ) );
			$path     = '' !== $filename ? dirname( $path ) . DIRECTORY_SEPARATOR . $filename : '';
			$checked  = wp_check_filetype( $filename );
			if ( ! empty( $checked['type'] ) ) {
				$mime = (string) $checked['type'];
			}
		}
		if ( ! is_string( $path ) || ! is_string( $root ) || ! is_file( $path ) || ! self::path_is_within( $path, $root ) ) {
			status_header( 404 );
			exit;
		}

		self::stream_private_path( $path, $mime );
	}

	private static function stream_private_path( string $path, string $mime ): void {
		$size  = (int) filesize( $path );
		$start = 0;
		$end   = max( 0, $size - 1 );
		if ( isset( $_SERVER['HTTP_RANGE'] ) && preg_match( '/^bytes=(\d*)-(\d*)$/', (string) $_SERVER['HTTP_RANGE'], $matches ) ) {
			if ( '' === $matches[1] && '' !== $matches[2] ) {
				$length = min( $size, (int) $matches[2] );
				$start  = $size - $length;
			} else {
				$start = (int) $matches[1];
				$end   = '' !== $matches[2] ? min( $end, (int) $matches[2] ) : $end;
			}
			if ( $start > $end || $start >= $size ) {
				status_header( 416 );
				header( 'Content-Range: bytes */' . $size );
				exit;
			}
			status_header( 206 );
			header( sprintf( 'Content-Range: bytes %d-%d/%d', $start, $end, $size ) );
		}

		nocache_headers();
		header( 'Accept-Ranges: bytes' );
		header( 'Content-Type: ' . sanitize_mime_type( $mime ) );
		header( 'X-Content-Type-Options: nosniff' );
		header( 'Content-Length: ' . ( $end - $start + 1 ) );
		header( 'Content-Disposition: inline; filename="' . sanitize_file_name( basename( $path ) ) . '"' );
		if ( 'HEAD' === strtoupper( (string) ( $_SERVER['REQUEST_METHOD'] ?? 'GET' ) ) ) {
			exit;
		}

		$handle = fopen( $path, 'rb' );
		if ( false === $handle ) {
			status_header( 500 );
			exit;
		}
		fseek( $handle, $start );
		$remaining = $end - $start + 1;
		while ( $remaining > 0 && ! feof( $handle ) ) {
			$chunk = fread( $handle, min( 1024 * 1024, $remaining ) );
			if ( false === $chunk ) {
				break;
			}
			echo $chunk;
			$remaining -= strlen( $chunk );
			flush();
		}
		fclose( $handle );
		exit;
	}

	private static function serve_private_staging_file(): void {
		if ( ! is_user_logged_in() ) {
			status_header( 404 );
			exit;
		}
		$token = sanitize_key( (string) wp_unslash( $_GET['staging_token'] ?? '' ) );
		$file  = sanitize_file_name( (string) wp_unslash( $_GET['file'] ?? '' ) );
		$root  = self::private_site_root( false );
		if ( '' === $token || '' === $file || ! is_string( $root ) ) {
			status_header( 404 );
			exit;
		}
		$session  = self::join( $root, 'tmp', 'import', $token );
		$manifest = json_decode( (string) @file_get_contents( self::join( $session, 'manifest.json' ) ), true );
		$path     = self::join( $session, $file );
		if (
			! is_array( $manifest ) ||
			get_current_user_id() !== absint( $manifest['user_id'] ?? 0 ) ||
			! current_user_can( 'edit_post', absint( $manifest['project_id'] ?? 0 ) ) ||
			! is_file( $path ) ||
			! self::path_is_within( $path, $session )
		) {
			status_header( 403 );
			exit;
		}
		$checked = wp_check_filetype( $file );
		self::stream_private_path( $path, (string) ( $checked['type'] ?? 'application/octet-stream' ) );
	}

	public static function delete_private_attachment_file( int $attachment_id ): void {
		if ( ! self::is_private_attachment( $attachment_id ) ) {
			return;
		}
		$path = get_attached_file( $attachment_id, true );
		$root = self::private_site_root( false );
		if ( is_string( $path ) && is_string( $root ) && is_file( $path ) && self::path_is_within( $path, $root ) ) {
			wp_delete_file( $path );
		}
	}

	/** Delete only attachments explicitly marked as owned by this entity. */
	public static function delete_owned_attachments( string $owner_type, int $owner_id ): void {
		if ( ! in_array( $owner_type, [ 'asset', 'scene' ], true ) || $owner_id < 1 ) {
			return;
		}
		$ids = get_posts(
			[
				'post_type'      => 'attachment',
				'post_status'    => 'any',
				'fields'         => 'ids',
				'posts_per_page' => -1,
				'meta_query'     => [
					'relation' => 'AND',
					[ 'key' => self::PRIVATE_MARKER_META, 'value' => '1' ],
					[ 'key' => self::OWNER_TYPE_META, 'value' => $owner_type ],
					[ 'key' => self::OWNER_ID_META, 'value' => $owner_id, 'type' => 'NUMERIC' ],
				],
			]
		);
		foreach ( $ids as $attachment_id ) {
			wp_delete_attachment( (int) $attachment_id, true );
		}
	}

	public static function delete_attachment_if_owned_by( int $attachment_id, string $owner_type, int $owner_id ): bool {
		if ( ! self::attachment_is_owned_by( $attachment_id, $owner_type, $owner_id ) ) {
			return false;
		}
		return (bool) wp_delete_attachment( $attachment_id, true );
	}

	/** Atomically switch one or more owner metadata references, then retire only marked old files. */
	public static function replace_attachment_references( int $owner_id, string $owner_type, array $meta_keys, int $new_attachment_id ) {
		$meta_keys = array_values( array_unique( array_filter( array_map( 'sanitize_key', $meta_keys ) ) ) );
		if (
			$owner_id < 1
			|| ! in_array( $owner_type, [ 'asset', 'scene' ], true )
			|| empty( $meta_keys )
			|| ! self::attachment_is_owned_by( $new_attachment_id, $owner_type, $owner_id )
		) {
			return new WP_Error( 'vrodos_invalid_attachment_replacement', 'The replacement attachment is not owned by this entity.' );
		}

		$previous = [];
		$changed  = [];
		foreach ( $meta_keys as $meta_key ) {
			$previous[ $meta_key ] = get_post_meta( $owner_id, $meta_key, true );
			$updated = update_post_meta( $owner_id, $meta_key, $new_attachment_id );
			if ( false === $updated && absint( get_post_meta( $owner_id, $meta_key, true ) ) !== $new_attachment_id ) {
				foreach ( $changed as $changed_key ) {
					if ( '' === $previous[ $changed_key ] ) {
						delete_post_meta( $owner_id, $changed_key );
					} else {
						update_post_meta( $owner_id, $changed_key, $previous[ $changed_key ] );
					}
				}
				self::delete_attachment_if_owned_by( $new_attachment_id, $owner_type, $owner_id );
				return new WP_Error( 'vrodos_attachment_switch_failed', 'WordPress rejected the replacement attachment reference.' );
			}
			$changed[] = $meta_key;
		}

		foreach ( array_unique( array_map( 'absint', $previous ) ) as $old_attachment_id ) {
			if ( $old_attachment_id > 0 && $old_attachment_id !== $new_attachment_id && ! self::owner_references_attachment( $owner_id, $owner_type, $old_attachment_id ) ) {
				self::delete_attachment_if_owned_by( $old_attachment_id, $owner_type, $owner_id );
			}
		}
		return true;
	}

	private static function owner_references_attachment( int $owner_id, string $owner_type, int $attachment_id ): bool {
		$keys = 'scene' === $owner_type
			? [ '_thumbnail_id', 'vrodos_scene_bg_image' ]
			: [
				'_thumbnail_id',
				'vrodos_asset3d_glb',
				'vrodos_asset3d_audio',
				'vrodos_asset3d_video',
				'vrodos_asset3d_image',
				'vrodos_asset3d_poi_imgtxt_image',
				'vrodos_asset3d_text_file',
				'vrodos_asset3d_screenimage',
			];
		foreach ( $keys as $key ) {
			if ( absint( get_post_meta( $owner_id, $key, true ) ) === $attachment_id ) {
				return true;
			}
		}
		return false;
	}

	public static function delete_project_publication( int $project_id ): void {
		$directory = self::published_project_directory( $project_id );
		$uploads   = wp_upload_dir( null, false );
		$root      = self::join( (string) ( $uploads['basedir'] ?? '' ), 'vrodos', 'published', 'projects' );
		if ( is_wp_error( $directory ) || $project_id < 1 || is_link( untrailingslashit( $directory ) ) || ! self::path_is_within( $directory, $root ) ) {
			return;
		}
		self::delete_owned_directory_tree( untrailingslashit( $directory ), $root );
	}

	public static function purge_site_storage(): void {
		$private_root = self::private_site_root( false );
		if ( is_string( $private_root ) && ! is_link( untrailingslashit( $private_root ) ) && basename( untrailingslashit( $private_root ) ) === 'site-' . get_current_blog_id() ) {
			self::delete_owned_directory_tree( untrailingslashit( $private_root ), dirname( untrailingslashit( $private_root ) ) );
		}
		$uploads = wp_upload_dir( null, false );
		$projects_root = self::join( (string) ( $uploads['basedir'] ?? '' ), 'vrodos', 'published', 'projects' );
		$published_root = self::join( (string) ( $uploads['basedir'] ?? '' ), 'vrodos', 'published' );
		if ( is_dir( $projects_root ) && ! is_link( $projects_root ) && self::path_is_within( $projects_root, $published_root ) ) {
			self::delete_owned_directory_tree( $projects_root, $published_root );
		}
	}

	public static function render_storage_diagnostic(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$root = self::private_site_root();
		if ( is_wp_error( $root ) ) {
			printf( '<div class="notice notice-error"><p><strong>VRodos storage is disabled:</strong> %s</p></div>', esc_html( $root->get_error_message() ) );
			return;
		}
		if ( ! self::storage_schema_ready() ) {
			echo '<div class="notice notice-warning"><p><strong>VRodos storage migration required:</strong> run <code>wp vrodos storage audit --format=json</code>, then the migrate and verify rollout before resuming authoring.</p></div>';
		}
	}

	public static function path_is_within( string $path, string $root ): bool {
		$path = rtrim( self::normalize_absolute_path( $path ), '/' );
		$root = rtrim( self::normalize_absolute_path( $root ), '/' );
		if ( DIRECTORY_SEPARATOR === '\\' ) {
			$path = strtolower( $path );
			$root = strtolower( $root );
		}
		return $path === $root || str_starts_with( $path . '/', $root . '/' );
	}

	private static function store_attachment_file( string $source, string $filename, string $mime, int $owner_id, string $owner_type, string $role, string $profile, bool $move ) {
		$directory = self::private_entity_directory( $owner_type, $owner_id, $role, $profile );
		if ( is_wp_error( $directory ) ) {
			return $directory;
		}
		$filename    = wp_unique_filename( $directory, sanitize_file_name( $filename ) );
		$destination = $directory . $filename;
		$temporary   = $destination . '.' . wp_generate_password( 20, false, false ) . '.partial';
		if ( ! @copy( $source, $temporary ) || filesize( $source ) !== filesize( $temporary ) || hash_file( 'sha256', $source ) !== hash_file( 'sha256', $temporary ) ) {
			wp_delete_file( $temporary );
			return new WP_Error( 'vrodos_storage_copy_failed', 'VRodos could not verify the stored upload.' );
		}
		if ( ! @rename( $temporary, $destination ) ) {
			wp_delete_file( $temporary );
			return new WP_Error( 'vrodos_storage_finalize_failed', 'VRodos could not finalize the stored upload.' );
		}
		$attachment_id = self::insert_private_attachment( $destination, $filename, $mime, $owner_id, $owner_type, $role );
		if ( is_wp_error( $attachment_id ) ) {
			wp_delete_file( $destination );
			return $attachment_id;
		}
		if ( $move ) {
			wp_delete_file( $source );
		}
		return $attachment_id;
	}

	private static function insert_private_attachment( string $path, string $filename, string $mime, int $owner_id, string $owner_type, string $role ) {
		$guid = add_query_arg( 'vrodos-private-guid', wp_generate_uuid4(), home_url( '/' ) );
		$id   = wp_insert_attachment(
			[
				'post_mime_type' => sanitize_mime_type( $mime ),
				'post_title'     => preg_replace( '/\.[^.]+$/', '', $filename ),
				'post_content'   => '',
				'post_status'    => 'inherit',
				'post_parent'    => $owner_id,
				'guid'           => $guid,
			],
			$path,
			$owner_id,
			true
		);
		if ( is_wp_error( $id ) ) {
			return $id;
		}
		if ( ! self::mark_attachment_private( (int) $id, $owner_id, $owner_type, $role ) || ! self::ensure_attached_file( (int) $id, $path ) ) {
			wp_delete_attachment( (int) $id, true );
			return new WP_Error( 'vrodos_attachment_database_failed', 'WordPress rejected the private attachment metadata.' );
		}

		if ( wp_attachment_is_image( (int) $id ) ) {
			if ( ! function_exists( 'wp_generate_attachment_metadata' ) ) {
				require_once ABSPATH . 'wp-admin/includes/image.php';
			}
			$metadata = wp_generate_attachment_metadata( (int) $id, $path );
			if ( ! is_array( $metadata ) || ! self::ensure_attachment_metadata( (int) $id, $metadata ) ) {
				self::delete_generated_image_files( $path, is_array( $metadata ) ? $metadata : [] );
				wp_delete_attachment( (int) $id, true );
				return new WP_Error( 'vrodos_attachment_metadata_failed', 'WordPress could not create image attachment metadata.' );
			}
		}
		return (int) $id;
	}

	private static function ensure_attached_file( int $attachment_id, string $path ): bool {
		$stored_path = DIRECTORY_SEPARATOR === '\\'
			? wp_slash( str_replace( '/', '\\', wp_normalize_path( $path ) ) )
			: $path;
		$updated = update_attached_file( $attachment_id, $stored_path );
		$current = get_attached_file( $attachment_id, true );
		return false !== $updated || ( is_string( $current ) && wp_normalize_path( $current ) === wp_normalize_path( $path ) );
	}

	private static function ensure_attachment_metadata( int $attachment_id, array $metadata ): bool {
		$updated = wp_update_attachment_metadata( $attachment_id, $metadata );
		return false !== $updated || wp_get_attachment_metadata( $attachment_id ) === $metadata;
	}

	private static function clear_private_marker( int $attachment_id ): void {
		delete_post_meta( $attachment_id, self::PRIVATE_MARKER_META );
		delete_post_meta( $attachment_id, self::OWNER_ID_META );
		delete_post_meta( $attachment_id, self::OWNER_TYPE_META );
		delete_post_meta( $attachment_id, self::ROLE_META );
	}

	private static function delete_generated_image_files( string $source, array $metadata ): void {
		$directory = dirname( $source );
		foreach ( (array) ( $metadata['sizes'] ?? [] ) as $size ) {
			$filename = is_array( $size ) ? basename( (string) ( $size['file'] ?? '' ) ) : '';
			if ( '' !== $filename ) {
				wp_delete_file( $directory . DIRECTORY_SEPARATOR . $filename );
			}
		}
	}

	private static function current_user_can_access_owner( string $owner_type, int $owner_id ): bool {
		if ( $owner_id < 1 || ! in_array( $owner_type, [ 'asset', 'scene' ], true ) ) {
			return false;
		}
		if ( current_user_can( 'edit_post', $owner_id ) ) {
			return true;
		}
		return 'asset' === $owner_type
			&& '1' === (string) get_post_meta( $owner_id, '_vrodos_asset_is_shared', true )
			&& current_user_can( 'edit_posts' );
	}

	private static function delete_owned_directory_tree( string $directory, string $root ): void {
		if ( ! is_dir( $directory ) || is_link( $directory ) || ! self::path_is_within( $directory, $root ) ) {
			return;
		}
		foreach ( scandir( $directory ) ?: [] as $entry ) {
			if ( '.' === $entry || '..' === $entry ) {
				continue;
			}
			$path = $directory . DIRECTORY_SEPARATOR . $entry;
			if ( is_link( $path ) ) {
				continue;
			}
			is_dir( $path ) ? self::delete_owned_directory_tree( $path, $root ) : wp_delete_file( $path );
		}
		@rmdir( $directory );
	}

	private static function private_root_error( string $message ): WP_Error {
		self::$private_root_error = new WP_Error( 'vrodos_private_storage_invalid', $message );
		return self::$private_root_error;
	}

	private static function normalize_absolute_path( string $path ): string {
		$path   = wp_normalize_path( $path );
		$prefix = '';
		if ( str_starts_with( $path, '//' ) ) {
			$prefix = '//';
			$path   = ltrim( $path, '/' );
		} elseif ( preg_match( '#^[A-Za-z]:/#', $path ) ) {
			$prefix = substr( $path, 0, 3 );
			$path   = substr( $path, 3 );
		} elseif ( str_starts_with( $path, '/' ) ) {
			$prefix = '/';
			$path   = ltrim( $path, '/' );
		}
		$segments = [];
		foreach ( explode( '/', $path ) as $segment ) {
			if ( '' === $segment || '.' === $segment ) {
				continue;
			}
			if ( '..' === $segment ) {
				array_pop( $segments );
				continue;
			}
			$segments[] = $segment;
		}
		return rtrim( $prefix . implode( '/', $segments ), '/' );
	}

	private static function resolved_path( string $path ): string {
		$resolved = realpath( $path );
		return self::normalize_absolute_path( false !== $resolved ? $resolved : $path );
	}

	private static function path_contains_link( string $path, string $stop_root ): bool {
		$path      = untrailingslashit( $path );
		$stop_root = untrailingslashit( $stop_root );
		while ( self::path_is_within( $path, $stop_root ) && wp_normalize_path( $path ) !== wp_normalize_path( $stop_root ) ) {
			if ( is_link( $path ) ) {
				return true;
			}
			$parent = dirname( $path );
			if ( $parent === $path ) {
				break;
			}
			$path = $parent;
		}
		return false;
	}

	private static function is_absolute_path( string $path ): bool {
		return 1 === preg_match( '#^(?:[A-Za-z]:/|/)#', wp_normalize_path( $path ) );
	}

	private static function join( string ...$parts ): string {
		$first = array_shift( $parts );
		$path  = rtrim( wp_normalize_path( (string) $first ), '/' );
		foreach ( $parts as $part ) {
			$path .= '/' . trim( wp_normalize_path( $part ), '/' );
		}
		return $path;
	}
}
