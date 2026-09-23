<?php
define( 'ABSPATH', __DIR__ );
define( 'HOUR_IN_SECONDS', 3600 );

class Cancel_Test_Response extends RuntimeException {
	public function __construct( public bool $success, public int $http_status, public $data ) {
		parent::__construct( is_string( $data ) ? $data : '' );
	}
}
class VRodos_Storage_Manager {
	public static function private_site_root(): string { return $GLOBALS['test_root']; }
}
function is_user_logged_in(): bool { return true; }
function check_ajax_referer(): bool { return true; }
function sanitize_key( $value ): string { return preg_replace( '/[^a-z0-9_-]/', '', strtolower( $value ) ); }
function sanitize_file_name( $value ): string { return basename( $value ); }
function apply_filters( string $name, $value ) { return $value; }
function wp_unslash( $value ) { return $value; }
function absint( $value ): int { return abs( (int) $value ); }
function get_post_type( $id ): string { return 9 === $id ? 'vrodos_game' : 'post'; }
function current_user_can(): bool { return true; }
function get_current_user_id(): int { return 5; }
function wp_upload_dir(): array { return [ 'basedir' => $GLOBALS['test_root'], 'error' => '' ]; }
function trailingslashit( string $value ): string { return rtrim( $value, '/\\' ) . '/'; }
function wp_normalize_path( string $value ): string { return str_replace( '\\', '/', $value ); }
function wp_delete_file( string $path ): void { unlink( $path ); }
function set_transient( string $key, $value ): void { $GLOBALS['transients'][ $key ] = $value; }
function get_transient( string $key ) { return $GLOBALS['transients'][ $key ] ?? false; }
function wp_send_json_error( $data, int $status = 200 ): never { throw new Cancel_Test_Response( false, $status, $data ); }
function wp_send_json_success( $data, int $status = 200 ): never { throw new Cancel_Test_Response( true, $status, $data ); }

require_once __DIR__ . '/../includes/asset-import/class-vrodos-asset-import-manager.php';

$GLOBALS['test_root'] = sys_get_temp_dir() . '/vrodos-upload-cancel-' . bin2hex( random_bytes( 8 ) );
$GLOBALS['transients'] = [];
$session_dir = VRodos_Asset_Import_Session::staged_session_dir( '', 5, 'upload-test' );
if ( ! mkdir( $session_dir, 0777, true ) ) throw new RuntimeException( 'Could not create upload fixture.' );
file_put_contents( $session_dir . '/upload-state.json', json_encode( [ 'user_id' => 5, 'project_id' => 9 ] ) );
file_put_contents( $session_dir . '/chunk-0.part', 'partial model' );
$_POST = [ 'nonce' => 'valid', 'upload_id' => 'upload-test', 'project_id' => '9' ];
$manager = ( new ReflectionClass( VRodos_Asset_Import_Manager::class ) )->newInstanceWithoutConstructor();

try {
	try {
		$manager->cancel_model_upload_callback();
	} catch ( Cancel_Test_Response $response ) {
		if ( ! $response->success || is_dir( $session_dir ) ) throw new RuntimeException( 'Cancellation must delete owned staged chunks.' );
	}
	$_POST += [ 'chunk_index' => '1', 'total_chunks' => '3', 'file_name' => 'building.glb' ];
	try {
		$manager->upload_model_chunk_callback();
	} catch ( Cancel_Test_Response $response ) {
		if ( $response->success || 409 !== $response->http_status ) throw new RuntimeException( 'Late chunks must be rejected after cancellation.' );
	}

	if ( ! mkdir( $session_dir, 0777, true ) ) throw new RuntimeException( 'Could not recreate upload fixture.' );
	file_put_contents( $session_dir . '/upload-state.json', json_encode( [ 'user_id' => 6, 'project_id' => 9 ] ) );
	try {
		$manager->cancel_model_upload_callback();
	} catch ( Cancel_Test_Response $response ) {
		if ( $response->success || 403 !== $response->http_status || ! is_dir( $session_dir ) ) {
			throw new RuntimeException( 'Cancellation must preserve another user\'s staged upload.' );
		}
	}
} finally {
	VRodos_Asset_Import_Execution::delete_directory_inside_root( $session_dir, $GLOBALS['test_root'] . '/tmp/import' );
	@rmdir( $GLOBALS['test_root'] . '/tmp/import' );
	@rmdir( $GLOBALS['test_root'] . '/tmp' );
	@rmdir( $GLOBALS['test_root'] );
}
echo "Asset upload cancellation server test passed.\n";
