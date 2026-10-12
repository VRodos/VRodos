<?php

define( 'ABSPATH', __DIR__ );
define( 'MINUTE_IN_SECONDS', 60 );

class WP_Error {
	public function __construct( private string $code, private string $message ) {}
	public function get_error_message(): string { return $this->message; }
}
class WP_Post {
	public function __construct( public int $ID ) {}
}
class AdminActionDenied extends RuntimeException {}
class AdminActionRedirect extends RuntimeException {}

function absint( $value ): int { return abs( (int) $value ); }
function is_wp_error( $value ): bool { return $value instanceof WP_Error; }
function __( string $value, string $domain = '' ): string { return $value; }
function esc_html( string $value ): string { return htmlspecialchars( $value, ENT_QUOTES, 'UTF-8' ); }
function esc_html__( string $value, string $domain = '' ): string { return esc_html( $value ); }
function esc_attr( string $value ): string { return esc_html( $value ); }
function esc_url( string $value ): string { return esc_html( $value ); }
function esc_url_raw( string $value ): string { return $value; }
function wp_strip_all_tags( string $value ): string { return strip_tags( $value ); }
function wp_unslash( $value ) { return $value; }
function wp_parse_args( array $args, array $defaults ): array { return array_merge( $defaults, $args ); }
function sanitize_key( string $value ): string { return preg_replace( '/[^a-z0-9_-]/', '', strtolower( $value ) ); }
function sanitize_text_field( string $value ): string { return trim( strip_tags( $value ) ); }
function wp_normalize_path( string $value ): string { return str_replace( '\\', '/', $value ); }
function wp_parse_url( string $value, int $component = -1 ) { return parse_url( $value, $component ); }
function current_time( string $type, bool $gmt = false ): string { return '2026-10-06 00:00:00'; }
function size_format( int $bytes, int $decimals = 0 ): string { return $bytes . ' B'; }
function get_post_type( int $id ) { return [ 42 => 'vrodos_asset3d', 43 => 'vrodos_asset3d', 44 => 'post' ][ $id ] ?? false; }
function current_user_can( string $capability, int $id = 0 ): bool {
	return 'manage_options' === $capability ? ( $GLOBALS['can_manage_assets'] ?? true ) : ( 'edit_post' === $capability && in_array( $id, $GLOBALS['editable_assets'], true ) );
}
function get_current_user_id(): int { return 7; }
function set_transient( string $key, $value, int $expiration ): void { $GLOBALS['notices'][ $key ] = $value; }
function get_post_meta( int $id, string $key, bool $single = true ) { return $GLOBALS['metadata'][ $id ][ $key ] ?? ''; }
function update_post_meta( int $id, string $key, $value ): void {
	$GLOBALS['writes'][] = [ $id, $key ];
	$GLOBALS['metadata'][ $id ][ $key ] = $value;
}
function wp_die( string $message, string $title, array $args ): never {
	throw new AdminActionDenied( $message, $args['response'] );
}
function check_admin_referer( string $action ): void {
	$nonce = 'vrodos_prepare_assets' === $action ? ( $_POST['_wpnonce'] ?? '' ) : ( $_GET['_wpnonce'] ?? '' );
	if ( $nonce !== 'nonce-' . $action ) {
		throw new AdminActionDenied( 'Bad nonce', 403 );
	}
}
function admin_url( string $path ): string { return '/wp-admin/' . $path; }
function get_edit_post_link( int $id, string $context = 'display' ): string { return '/wp-admin/post.php?post=' . $id . '&action=edit'; }
function add_query_arg( $args, $value, ?string $url = null ): string {
	if ( is_array( $args ) ) {
		$url = $value;
	} else {
		$args = [ $args => $value ];
	}
	$parts = parse_url( $url );
	parse_str( $parts['query'] ?? '', $query );
	return $parts['path'] . '?' . http_build_query( array_merge( $query, $args ) );
}
function wp_nonce_url( string $url, string $action ): string { return add_query_arg( '_wpnonce', 'nonce-' . $action, $url ); }
function wp_safe_redirect( string $url ): never { throw new AdminActionRedirect( $url ); }
function wp_schedule_single_event( ...$args ): never { throw new RuntimeException( 'Analysis refresh must not schedule derivatives.' ); }

require_once __DIR__ . '/../includes/asset-optimization/trait-vrodos-asset-optimization-admin-actions.php';
require_once __DIR__ . '/../includes/asset-optimization/trait-vrodos-asset-optimization-analysis.php';
require_once __DIR__ . '/../includes/asset-optimization/trait-vrodos-asset-optimization-derivatives.php';
require_once __DIR__ . '/../includes/asset-optimization/trait-vrodos-asset-optimization-settings.php';

class AnalysisAdminFixture {
	use VRodos_Asset_Optimization_Admin_Actions;
	use VRodos_Asset_Optimization_Analysis_Service;
	use VRodos_Asset_Optimization_Derivative_Service;
	use VRodos_Asset_Optimization_Settings_View;

	public const ANALYSIS_META_KEY = '_vrodos_asset3d_glb_analysis';
	public const META_KEY = '_vrodos_asset3d_glb_derivatives';
	public const SETTINGS_TAB_KEY = 'vrodos_asset_optimization_settings';
	public static array|WP_Error $source;
	public static int $prepared = 0;

	protected static function prepare_source_glb( int $id ) {
		++self::$prepared;
		return self::$source;
	}
	protected static function inspect_source_glb( int $id ) { return self::$source; }
	protected static function automatic_profile_protects_geometry( int $id ): bool { return false; }
	public static function ensure_derivative( ...$args ): never { throw new RuntimeException( 'Analysis refresh must not ensure derivatives.' ); }
	public static function maybe_queue_web_high( ...$args ): never { throw new RuntimeException( 'Analysis refresh must not start a family.' ); }
	protected static function prepare_asset_web_family( int $id, bool $retry ) {
		$GLOBALS['preparation_requests'][] = [ $id, $retry ];
		return $GLOBALS['preparation_results'][ $id ] ?? true;
	}
}
function verify_analysis( bool $ok, string $message ): void {
	if ( ! $ok ) {
		throw new RuntimeException( $message );
	}
}
function render_analysis_metabox( AnalysisAdminFixture $controller ): string {
	ob_start();
	try {
		$controller->render_glb_optimization_box( new WP_Post( 42 ) );
		return ob_get_contents();
	} finally {
		ob_end_clean();
	}
}
function expect_analysis_redirect( AnalysisAdminFixture $controller, string $notice ): void {
	try {
		$controller->handle_refresh_asset_analysis();
		throw new RuntimeException( 'The handler must redirect.' );
	} catch ( AdminActionRedirect $redirect ) {
		parse_str( parse_url( $redirect->getMessage(), PHP_URL_QUERY ), $query );
		verify_analysis( $query === [ 'post' => '42', 'action' => 'edit', 'vrodos_optimize_notice' => $notice ], 'Refresh must return to the same asset with the correct notice.' );
	}
}

$metadata = [ 42 => [ AnalysisAdminFixture::META_KEY => [ 'derivatives' => [], 'lastError' => 'Retained derivative error' ] ] ];
$derivatives_before = $metadata[42][AnalysisAdminFixture::META_KEY];
$writes = [];
$editable_assets = [ 42, 43 ];
$controller = new AnalysisAdminFixture();
$source_path = tempnam( sys_get_temp_dir(), 'vrodos-analysis-admin-' );
if ( false === $source_path ) {
	throw new RuntimeException( 'Temporary fixture directory is unavailable.' );
}
try {
	$json = '{"asset":{"version":"2.0"},"scenes":[{"nodes":[]}],"scene":0}';
	$json .= str_repeat( ' ', ( 4 - strlen( $json ) % 4 ) % 4 );
	file_put_contents( $source_path, 'glTF' . pack( 'VV', 2, 20 + strlen( $json ) ) . pack( 'VV', strlen( $json ), 0x4E4F534A ) . $json );
	AnalysisAdminFixture::$source = [ 'path' => $source_path, 'url' => '/source.glb', 'sizeBytes' => filesize( $source_path ) ];

	foreach ( [
		[],
		[ 'asset_id' => 0 ],
		[ 'asset_id' => [ 42 ] ],
		[ 'asset_id' => 99 ],
		[ 'asset_id' => 44 ],
		[ 'asset_id' => 42 ],
		[ 'asset_id' => 42, '_wpnonce' => 'invalid' ],
		[ 'asset_id' => 43, '_wpnonce' => 'nonce-vrodos_refresh_asset_analysis_42' ],
	] as $request ) {
		$_GET = $request;
		try {
			$controller->handle_refresh_asset_analysis();
			throw new RuntimeException( 'Invalid requests must be rejected.' );
		} catch ( AdminActionDenied $denied ) {
			verify_analysis( 403 === $denied->getCode(), 'Invalid requests must be forbidden.' );
		}
	}
	$editable_assets = [];
	$_GET = [ 'asset_id' => 42, '_wpnonce' => 'nonce-vrodos_refresh_asset_analysis_42' ];
	try {
		$controller->handle_refresh_asset_analysis();
		throw new RuntimeException( 'A nonce cannot replace edit permission.' );
	} catch ( AdminActionDenied $denied ) {
		verify_analysis( 403 === $denied->getCode(), 'Edit permission is required.' );
	}
	verify_analysis( [] === $writes && 0 === AnalysisAdminFixture::$prepared, 'Rejected requests must not prepare sources or write analysis.' );

	$editable_assets = [ 42 ];
	expect_analysis_redirect( $controller, 'analysis-refreshed' );
	verify_analysis( [ [ 42, AnalysisAdminFixture::ANALYSIS_META_KEY ] ] === $writes, 'Refresh must update only the requested asset analysis.' );
	verify_analysis( 'analyzed' === $metadata[42][AnalysisAdminFixture::ANALYSIS_META_KEY]['status'], 'Refresh must use the real GLB analysis service.' );
	$_GET['vrodos_optimize_notice'] = 'analysis-refreshed';
	$html = render_analysis_metabox( $controller );
	verify_analysis( str_contains( $html, 'notice-success' ) && str_contains( $html, 'GLB analysis refreshed.' ), 'Success must appear on the asset edit screen.' );
	preg_match( '/href="([^"]+)">Refresh GLB analysis/', $html, $link );
	parse_str( parse_url( html_entity_decode( $link[1] ?? '' ), PHP_URL_QUERY ) ?? '', $query );
	verify_analysis( $query === [ 'action' => 'vrodos_refresh_asset_analysis', 'asset_id' => '42', '_wpnonce' => 'nonce-vrodos_refresh_asset_analysis_42' ], 'The refresh button must use the signed asset-specific endpoint.' );
	verify_analysis( str_contains( $html, 'Regenerate Web High derivative' ), 'The regeneration control must remain available.' );

	AnalysisAdminFixture::$source = new WP_Error( 'missing-source', 'Missing <source> & unavailable.' );
	expect_analysis_redirect( $controller, 'analysis-failed' );
	verify_analysis( 'unsupported' === $metadata[42][AnalysisAdminFixture::ANALYSIS_META_KEY]['status'], 'Failure must save the analysis error record.' );
	$_GET['vrodos_optimize_notice'] = 'analysis-failed';
	$metadata[42][AnalysisAdminFixture::ANALYSIS_META_KEY]['error'] = 'Missing <source> & unavailable.';
	$html = render_analysis_metabox( $controller );
	verify_analysis( str_contains( $html, 'notice-error' ) && str_contains( $html, 'GLB analysis refresh failed. Missing &lt;source&gt; &amp; unavailable.' ), 'The saved analysis error must be escaped even when no local source is available.' );
	verify_analysis( $derivatives_before === $metadata[42][AnalysisAdminFixture::META_KEY], 'Refresh must leave derivative metadata unchanged.' );
	verify_analysis( count( $writes ) === 2 && 2 === AnalysisAdminFixture::$prepared, 'Success and failure each perform one targeted refresh.' );
} finally {
	unlink( $source_path );
}
echo "Asset analysis admin action tests passed.\n";

$editable_assets = [ 42 ];
$preparation_requests = [];
$preparation_results = [];
$notices = [];
function preparation_request( AnalysisAdminFixture $controller, array $post ): array {
	$_POST = $post;
	try {
		$controller->handle_prepare_assets();
		throw new RuntimeException( 'Preparation must redirect.' );
	} catch ( AdminActionRedirect $redirect ) {
		parse_str( parse_url( $redirect->getMessage(), PHP_URL_QUERY ), $query );
		verify_analysis( 'vrodos_options' === $query['page'] && AnalysisAdminFixture::SETTINGS_TAB_KEY === $query['tab'], 'Preparation must redirect to Asset Readiness.' );
		return $query;
	}
}
$post = [ '_wpnonce' => 'nonce-vrodos_prepare_assets', 'operation' => 'prepare', 'asset_ids' => [ '42', '42', '43', '44' ], 'asset_search' => 'Test', 'asset_page' => '2' ];
foreach ( [ [ 'GET', true, $post ], [ 'POST', false, $post ], [ 'POST', true, array_merge( $post, [ '_wpnonce' => 'bad' ] ) ] ] as [ $method, $can_manage, $request ] ) {
	$_SERVER['REQUEST_METHOD'] = $method;
	$can_manage_assets = $can_manage;
	$_POST = $request;
	try {
		$controller->handle_prepare_assets();
		throw new RuntimeException( 'Unsigned or unauthorized preparation must be rejected.' );
	} catch ( AdminActionDenied $denied ) {
		verify_analysis( 403 === $denied->getCode(), 'Preparation requires POST, admin permission, and a valid nonce.' );
	}
}
verify_analysis( [] === $preparation_requests, 'Rejected requests must not start preparation.' );
$_SERVER['REQUEST_METHOD'] = 'POST';
$can_manage_assets = true;
$query = preparation_request( $controller, $post );
verify_analysis( [ [ 42, false ] ] === $preparation_requests, 'Bulk preparation must deduplicate IDs and check each asset type and edit permission.' );
verify_analysis( 'Test' === $query['asset_search'] && '2' === $query['asset_page'], 'Preparation must retain the table filters and page.' );
$notice = $notices['vrodos_asset_readiness_notice_7'];
verify_analysis( 1 === $notice['submitted'] && 2 === count( $notice['errors'] ), 'Bulk results must report submitted and inaccessible assets.' );
$preparation_requests = [];
preparation_request( $controller, array_merge( $post, [ 'retry_asset_id' => '42' ] ) );
verify_analysis( [ [ 42, true ] ] === $preparation_requests, 'A row Retry button must act on that asset alone, regardless of bulk selections.' );
$preparation_results[42] = false;
preparation_request( $controller, $post );
verify_analysis( 1 === $notices['vrodos_asset_readiness_notice_7']['skipped'], 'Ready, processing, or ineligible assets must report skipped work.' );
$preparation_results[42] = new WP_Error( 'optimizer', 'Actual optimizer error' );
preparation_request( $controller, $post );
verify_analysis( str_contains( $notices['vrodos_asset_readiness_notice_7']['errors'][0], 'Actual optimizer error' ), 'Actual preparation failures must be shown to the user.' );
$before = $preparation_requests;
foreach ( [ array_merge( $post, [ 'operation' => 'delete' ] ), array_merge( $post, [ 'asset_ids' => range( 1, 26 ) ] ) ] as $request ) {
	$_POST = $request;
	try {
		$controller->handle_prepare_assets();
		throw new RuntimeException( 'Invalid or oversized preparation must be rejected.' );
	} catch ( AdminActionDenied $denied ) {
		verify_analysis( 400 === $denied->getCode(), 'Invalid actions and batches over 25 must be rejected.' );
	}
}
verify_analysis( $before === $preparation_requests, 'Invalid batches must not queue partial work.' );
echo "Asset readiness admin action tests passed.\n";
