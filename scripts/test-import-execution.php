<?php
define( 'ABSPATH', __DIR__ );
define( 'DAY_IN_SECONDS', 86400 );
class WP_Error {
	public function __construct( public string $code, private string $message ) {}
	public function get_error_message(): string { return $this->message; }
}
class Import_Response extends RuntimeException {
	public function __construct( public bool $success, public mixed $data, public int $status ) { parent::__construct(); }
}
function is_wp_error( $value ): bool { return $value instanceof WP_Error; }
function absint( $value ): int { return abs( (int) $value ); }
function is_user_logged_in(): bool { return $GLOBALS['logged_in']; }
function current_user_can( ...$args ): bool { return $GLOBALS['can_edit']; }
function get_post_field( ...$args ): int { return 99; }
function get_current_user_id(): int { return 5; }
function check_ajax_referer( ...$args ): void { $GLOBALS['nonce_checks']++; }
function get_post_meta( $id, $key, $single = true ): mixed { return $GLOBALS['meta'][$id][$key] ?? ''; }
function update_post_meta( $id, $key, $value ): void { $GLOBALS['meta'][$id][$key] = $value; }
function delete_post_meta( $id, $key ): void { unset( $GLOBALS['meta'][$id][$key] ); }
function wp_next_scheduled( $hook, $args ): bool { return isset( $GLOBALS['jobs'][$hook . ':' . $args[0]] ); }
function wp_schedule_single_event( $time, $hook, $args ): void {
	$GLOBALS['schedule_calls']++;
	$GLOBALS['jobs'][$hook . ':' . $args[0]] = $time;
}
function wp_send_json_error( $data, $status = 200 ): never { throw new Import_Response( false, $data, $status ); }
function wp_send_json_success( $data, $status = 200 ): never { throw new Import_Response( true, $data, $status ); }
require_once __DIR__ . '/../includes/asset-import/class-vrodos-asset-import-manager.php';
function verify_import( bool $condition, string $message ): void {
	if ( ! $condition ) throw new RuntimeException( $message );
}
function retry_request( $controller ): Import_Response {
	try { $controller->retry_callback(); } catch ( Import_Response $response ) { return $response; }
	throw new RuntimeException( 'The callback must send a response.' );
}
$meta = $jobs = [];
$schedule_calls = $nonce_checks = 0;
$logged_in = $can_edit = true;
$controller = ( new ReflectionClass( VRodos_Asset_Import_Manager::class ) )->newInstanceWithoutConstructor();
$source = tempnam( sys_get_temp_dir(), 'vrodos-import-' );
if ( false === $source ) throw new RuntimeException( 'Temporary fixture unavailable.' );
try {
	$_POST = [ 'asset_id' => 42 ];
	$meta[42] = [ '_vrodos_asset_import_source_path' => $source, '_vrodos_asset_import_error' => 'Previous failure' ];
	$response = retry_request( $controller );
	verify_import( $response->success && 200 === $response->status, 'Retry must retain its HTTP success envelope.' );
	verify_import( 'pending' === $response->data['status'] && '' === $response->data['error'], 'Retry must queue the import and clear its previous error.' );
	verify_import( $response->data === VRodos_Asset_Import_Manager::status_for_asset( 42 ), 'The public facade must return the same status payload.' );
	retry_request( $controller );
	verify_import( 1 === $schedule_calls, 'Repeated retries must join the scheduled job.' );
	$before = $meta;
	$can_edit = false;
	verify_import( 403 === retry_request( $controller )->status && $before === $meta, 'Unauthorized retries must not mutate metadata.' );
	$logged_in = false;
	$checks_before = $nonce_checks;
	verify_import( 403 === retry_request( $controller )->status && $checks_before === $nonce_checks, 'Logged-out requests must stop before nonce handling.' );
	$logged_in = $can_edit = true;
	unlink( $source );
	$response = retry_request( $controller );
	verify_import( ! $response->success && 410 === $response->status && is_string( $response->data ), 'Expired sources must retain the HTTP 410 string error.' );
	$status = VRodos_Asset_Import_Manager::status_for_asset( 42 );
	verify_import( 'failed' === $status['status'] && $response->data === $status['error'] && ! $status['can_retry'], 'Missing sources must fail and disable retry.' );
	verify_import( $meta[42]['_vrodos_asset_import_cleanup_after'] >= time() && 1 === $schedule_calls, 'Failure must schedule cleanup without queuing another conversion.' );
} finally {
	if ( is_file( $source ) ) unlink( $source );
}
echo "Import execution and HTTP retry tests passed.\n";
