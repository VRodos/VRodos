<?php

declare(strict_types=1);
define( 'ABSPATH', __DIR__ . DIRECTORY_SEPARATOR );

final class Readiness_Response extends RuntimeException {
	public function __construct( public bool $success, public $data, public int $status ) { parent::__construct( 'JSON response' ); }
}

$GLOBALS['readiness_nonce_valid'] = true;
$GLOBALS['readiness_hooks'] = [];
$GLOBALS['readiness_resolved_ids'] = [];
function plugin_dir_path( string $file ): string { return dirname( $file ) . DIRECTORY_SEPARATOR; }
function add_action( string $hook, $callback ): void { $GLOBALS['readiness_hooks'][ $hook ] = $callback; }
function check_ajax_referer( string $action, string $query, bool $die ): bool { return $GLOBALS['readiness_nonce_valid']; }
function absint( $value ): int { return abs( (int) $value ); }
function get_post_type( int $id ): string { return $id === 4 ? 'page' : 'vrodos_asset3d'; }
function wp_send_json_error( $data, int $status = 200 ): void { throw new Readiness_Response( false, $data, $status ); }
function wp_send_json_success( $data ): void { throw new Readiness_Response( true, $data, 200 ); }
class VRodos_Immerse_Access_Manager {
	public static function can_read_asset( int $id ): bool { return $id === 1 || $id === 2; }
}
class VRodos_Asset_Optimization_Manager {
	public static function resolve_editor_glb_load( int $id ): array {
		$GLOBALS['readiness_resolved_ids'][] = $id;
		return [ 'readiness' => $id === 1 ? [ 'status' => 'queued', 'label' => 'Queued' ] : [ 'status' => 'ready', 'label' => 'Ready to add' ] ];
	}
}
require_once __DIR__ . '/../includes/ajax/class-vrodos-asset-ajax.php';
$ajax = new VRodos_Asset_AJAX();
function readiness_assert( bool $condition, string $message ): void {
	if ( ! $condition ) { fwrite( STDERR, "Readiness AJAX test failed: $message\n" ); exit( 1 ); }
}
function readiness_request( VRodos_Asset_AJAX $ajax, $ids ): Readiness_Response {
	$_POST = [ 'asset_ids' => $ids ];
	try { $ajax->vrodos_asset_readiness_callback(); } catch ( Readiness_Response $response ) { return $response; }
	throw new RuntimeException( 'Expected a JSON response.' );
}
readiness_assert( isset( $GLOBALS['readiness_hooks']['wp_ajax_vrodos_asset_readiness_action'] ), 'the batch action must be registered' );
readiness_assert( ! isset( $GLOBALS['readiness_hooks']['wp_ajax_nopriv_vrodos_asset_readiness_action'] ), 'the batch action must require authentication' );
$response = readiness_request( $ajax, [ '1', '1', '2', '3', '4' ] );
readiness_assert( $response->success && 'Queued' === $response->data['items'][1]['label'], 'pending assets expose their stage' );
readiness_assert( 'Ready to add' === $response->data['items'][2]['label'], 'usable assets expose readiness' );
readiness_assert( 'forbidden' === $response->data['items'][3]['status'] && 'forbidden' === $response->data['items'][4]['status'], 'unreadable and unrelated posts fail closed' );
readiness_assert( [ 1, 2 ] === $GLOBALS['readiness_resolved_ids'], 'deduplicate IDs and never resolve inaccessible assets' );
readiness_assert( 400 === readiness_request( $ajax, '1' )->status, 'reject scalar IDs' );
readiness_assert( 400 === readiness_request( $ajax, array_fill( 0, 101, 1 ) )->status, 'bound batch size' );
$GLOBALS['readiness_nonce_valid'] = false;
readiness_assert( 403 === readiness_request( $ajax, [1] )->status, 'reject invalid nonces' );
echo "Asset readiness AJAX tests passed.\n";
