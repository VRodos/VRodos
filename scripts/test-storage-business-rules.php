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

$test_meta = [];
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
