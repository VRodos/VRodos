<?php

$test_root = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'vrodos-storage-test-' . bin2hex( random_bytes( 6 ) );
define( 'ABSPATH', $test_root . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR );
define( 'VRODOS_PRIVATE_STORAGE_DIR', $test_root . DIRECTORY_SEPARATOR . 'private' );

final class WP_Error {
	public function __construct( public string $code = '', public string $message = '' ) {}
	public function get_error_message(): string { return $this->message; }
}

function wp_normalize_path( string $path ): string { return str_replace( '\\', '/', $path ); }
function trailingslashit( string $path ): string { return rtrim( $path, '/\\' ) . '/'; }
function untrailingslashit( string $path ): string { return rtrim( $path, '/\\' ); }
function wp_mkdir_p( string $path ): bool { return is_dir( $path ) || mkdir( $path, 0777, true ); }
function wp_upload_dir( $time = null, bool $create = true ): array {
	global $test_root;
	$directory = $test_root . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'wp-content' . DIRECTORY_SEPARATOR . 'uploads';
	if ( $create ) { wp_mkdir_p( $directory ); }
	return [ 'basedir' => $directory, 'baseurl' => 'https://example.test/wp-content/uploads', 'error' => false ];
}
function get_current_blog_id(): int { return 7; }
function sanitize_key( string $value ): string { return preg_replace( '/[^a-z0-9_-]/', '', strtolower( $value ) ); }
function is_wp_error( $value ): bool { return $value instanceof WP_Error; }
function wp_generate_password(): string { return 'random-token'; }
function absint( $value ): int { return abs( (int) $value ); }
function wp_slash( string $value ): string { return addslashes( $value ); }
function admin_url( string $path = '' ): string { return 'https://example.test/wp-admin/' . ltrim( $path, '/' ); }
function add_query_arg( array $args, string $url ): string { return $url . '?' . http_build_query( $args ); }
function wp_parse_url( string $url, int $component = -1 ) { return parse_url( $url, $component ); }
function wp_get_attachment_url( int $attachment_id ) { return 'https://example.test/uploads/' . $attachment_id; }
function wp_get_attachment_image_url( int $attachment_id, string $size ) { return 'https://example.test/uploads/' . $attachment_id . '-' . $size; }

$test_meta = [];
$test_attached_files = [];
$test_deleted_attachments = [];
$test_failed_meta_key = '';
function get_post_meta( int $post_id, string $key, bool $single = false ) {
	global $test_meta;
	return $test_meta[ $post_id ][ $key ] ?? '';
}
function update_post_meta( int $post_id, string $key, $value ) {
	global $test_meta, $test_failed_meta_key;
	if ( $key === $test_failed_meta_key ) { return false; }
	if ( ( $test_meta[ $post_id ][ $key ] ?? null ) === $value ) { return false; }
	$test_meta[ $post_id ][ $key ] = $value;
	return 1;
}
function delete_post_meta( int $post_id, string $key ): bool {
	global $test_meta;
	unset( $test_meta[ $post_id ][ $key ] );
	return true;
}
function wp_delete_attachment( int $attachment_id, bool $force_delete = false ): bool {
	global $test_deleted_attachments;
	$test_deleted_attachments[] = $attachment_id;
	return true;
}
function update_attached_file( int $attachment_id, string $file ) {
	global $test_attached_files;
	$test_attached_files[ $attachment_id ] = stripslashes( $file );
	return 1;
}
function get_attached_file( int $attachment_id, bool $unfiltered = false ) {
	global $test_attached_files;
	return $test_attached_files[ $attachment_id ] ?? false;
}

require_once dirname( __DIR__ ) . '/includes/class-vrodos-storage-manager.php';

function vrodos_storage_assert( bool $condition, string $message ): void {
	if ( ! $condition ) {
		throw new RuntimeException( 'Storage rule failed: ' . $message );
	}
}

try {
	$root = VRodos_Storage_Manager::private_site_root();
	vrodos_storage_assert( is_string( $root ) && str_ends_with( wp_normalize_path( $root ), '/private/site-7/' ), 'multisite private root' );
	$source = VRodos_Storage_Manager::private_entity_directory( 'asset', 42, 'source' );
	vrodos_storage_assert( str_ends_with( wp_normalize_path( $source ), '/site-7/assets/42/source/' ), 'ID-owned asset source path' );
	$private_file = $source . 'windows-path.glb';
	file_put_contents( $private_file, 'private attachment' );
	$test_meta[501] = [ '_vrodos_private_storage' => '1' ];
	vrodos_storage_assert( VRodos_Storage_Manager::repair_private_attachment_path( 501, $private_file ), 'private attachment path repair' );
	vrodos_storage_assert( wp_normalize_path( $test_attached_files[501] ) === wp_normalize_path( $private_file ), 'absolute private path survives metadata unslashing' );
	$test_meta[502] = [ '_vrodos_private_storage' => '1' ];
	$thumbnail_url = VRodos_Storage_Manager::authoring_url_for_attachment( 502, 'thumbnail' );
	vrodos_storage_assert( $thumbnail_url === 'https://example.test/wp-admin/admin-ajax.php?action=vrodos_private_media&id=502&size=thumbnail', 'private image size uses authenticated delivery' );
	vrodos_storage_assert( ! str_contains( $source, 'project-slug' ), 'no slug-derived path' );
	$derivative = VRodos_Storage_Manager::private_entity_directory( 'asset', 42, 'derivatives', 'safe-draco' );
	vrodos_storage_assert( str_ends_with( wp_normalize_path( $derivative ), '/site-7/assets/42/derivatives/safe-draco/' ), 'profile derivative path' );
	$background = VRodos_Storage_Manager::private_entity_directory( 'scene', 91, 'backgrounds' );
	vrodos_storage_assert( str_ends_with( wp_normalize_path( $background ), '/site-7/scenes/91/backgrounds/' ), 'scene background path' );
	vrodos_storage_assert( is_wp_error( VRodos_Storage_Manager::private_entity_directory( 'asset', 42, 'unknown' ) ), 'unsafe role rejection' );
	$client = VRodos_Storage_Manager::published_project_directory( 13, 'clients' );
	vrodos_storage_assert( str_ends_with( wp_normalize_path( $client ), '/uploads/vrodos/published/projects/13/clients/' ), 'project-scoped public clients' );
	$media_url = VRodos_Storage_Manager::published_project_url( 13, 'media', 'abc123.glb' );
	vrodos_storage_assert( $media_url === 'https://example.test/wp-content/uploads/vrodos/published/projects/13/media/abc123.glb', 'project-scoped public media URL' );
	vrodos_storage_assert( VRodos_Storage_Manager::path_is_within( $source, $root ), 'contained path accepted' );
	vrodos_storage_assert( ! VRodos_Storage_Manager::path_is_within( $root . '../site-70/file', $root ), 'sibling traversal rejected' );
	vrodos_storage_assert( VRodos_Storage_Manager::path_is_within( '//server/share/site-7/assets/42', '//server/share/site-7' ), 'UNC containment' );

	$uploads_root = wp_upload_dir( null, true )['basedir'];
	$legacy_url_file = trailingslashit( $uploads_root ) . 'legacy/url-source.glb';
	wp_mkdir_p( dirname( $legacy_url_file ) );
	file_put_contents( $legacy_url_file, 'legacy URL source' );
	$test_meta[601] = [ '_wp_attached_file' => 'https://old.example.test/wp-content/uploads/legacy/url-source.glb' ];
	$test_attached_files[601] = trailingslashit( $uploads_root ) . $test_meta[601]['_wp_attached_file'];
	$resolved_legacy_url = VRodos_Storage_Manager::resolve_migration_attachment_source( 601 );
	vrodos_storage_assert(
		is_string( $resolved_legacy_url ) && realpath( $resolved_legacy_url ) === realpath( $legacy_url_file ),
		'legacy upload URL resolves to the existing local file'
	);
	vrodos_storage_assert(
		realpath( VRodos_Storage_Manager::resolve_migration_upload_source( '/wp-content/uploads/legacy/url-source.glb' ) ) === realpath( $legacy_url_file ),
		'root-relative legacy upload URL resolves to the existing local file'
	);

	$legacy_absolute_file = trailingslashit( $uploads_root ) . 'legacy/windows-source.glb';
	file_put_contents( $legacy_absolute_file, 'legacy Windows source' );
	$test_meta[602] = [ '_wp_attached_file' => wp_normalize_path( $legacy_absolute_file ) ];
	$test_attached_files[602] = trailingslashit( $uploads_root ) . $test_meta[602]['_wp_attached_file'];
	$resolved_legacy_absolute = VRodos_Storage_Manager::resolve_migration_attachment_source( 602 );
	vrodos_storage_assert(
		is_string( $resolved_legacy_absolute ) && realpath( $resolved_legacy_absolute ) === realpath( $legacy_absolute_file ),
		'legacy Windows absolute path resolves without an uploads prefix'
	);

	$outside_file = trailingslashit( VRODOS_PRIVATE_STORAGE_DIR ) . 'outside-source.glb';
	file_put_contents( $outside_file, 'outside source' );
	$test_meta[603] = [ '_wp_attached_file' => wp_normalize_path( $outside_file ) ];
	$test_attached_files[603] = $outside_file;
	vrodos_storage_assert( is_wp_error( VRodos_Storage_Manager::resolve_migration_attachment_source( 603 ) ), 'out-of-uploads absolute source is rejected' );
	$test_meta[604] = [ '_wp_attached_file' => 'https://external.example.test/media/source.glb' ];
	$test_attached_files[604] = false;
	vrodos_storage_assert( is_wp_error( VRodos_Storage_Manager::resolve_migration_attachment_source( 604 ) ), 'external non-upload URL is rejected' );

	foreach ( [ 101, 102, 200 ] as $attachment_id ) {
		$test_meta[ $attachment_id ] = [ '_vrodos_private_storage' => '1', '_vrodos_storage_owner_type' => 'asset', '_vrodos_storage_owner_id' => 42 ];
	}
	$test_meta[42] = [ 'source' => 101, 'preview' => 102 ];
	$result = VRodos_Storage_Manager::replace_attachment_references( 42, 'asset', [ 'source', 'preview' ], 200 );
	vrodos_storage_assert( true === $result && $test_meta[42]['source'] === 200 && $test_meta[42]['preview'] === 200, 'atomic reference switch' );
	vrodos_storage_assert( in_array( 101, $test_deleted_attachments, true ) && in_array( 102, $test_deleted_attachments, true ), 'owned predecessors retired after switch' );

	$test_deleted_attachments = [];
	foreach ( [ 103, 104, 201 ] as $attachment_id ) {
		$test_meta[ $attachment_id ] = [ '_vrodos_private_storage' => '1', '_vrodos_storage_owner_type' => 'asset', '_vrodos_storage_owner_id' => 42 ];
	}
	$test_meta[42] = [ 'source' => 103, 'preview' => 104 ];
	$test_failed_meta_key = 'preview';
	$result = VRodos_Storage_Manager::replace_attachment_references( 42, 'asset', [ 'source', 'preview' ], 201 );
	vrodos_storage_assert( is_wp_error( $result ) && $test_meta[42]['source'] === 103 && $test_meta[42]['preview'] === 104, 'database failure rolls references back' );
	vrodos_storage_assert( $test_deleted_attachments === [ 201 ], 'failed replacement deletes only the uncommitted copy' );
	echo "Storage business rule tests passed.\n";
} finally {
	if ( is_dir( $test_root ) ) {
		$iterator = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $test_root, FilesystemIterator::SKIP_DOTS ), RecursiveIteratorIterator::CHILD_FIRST );
		foreach ( $iterator as $item ) { $item->isDir() ? rmdir( $item->getPathname() ) : unlink( $item->getPathname() ); }
		rmdir( $test_root );
	}
}
