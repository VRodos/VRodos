<?php

define( 'ABSPATH', __DIR__ );
function __( string $text, string $domain = '' ): string { return $text; }
function esc_html( $text ): string { return htmlspecialchars( (string) $text, ENT_QUOTES, 'UTF-8' ); }
function esc_attr( $text ): string { return esc_html( $text ); }
function esc_url( $text ): string { return esc_html( $text ); }
function esc_html__( string $text, string $domain = '' ): string { return esc_html( $text ); }
function esc_html_e( string $text, string $domain = '' ): void { echo esc_html( $text ); }
function esc_attr_e( string $text, string $domain = '' ): void { echo esc_attr( $text ); }
function sanitize_key( string $text ): string { return preg_replace( '/[^a-z0-9_-]/', '', strtolower( $text ) ); }
function sanitize_text_field( string $text ): string { return trim( strip_tags( $text ) ); }
function wp_unslash( $text ) { return $text; }
function absint( $value ): int { return abs( (int) $value ); }
function current_user_can( string $cap, int $id = 0 ): bool { return 'manage_options' === $cap || 6 !== $id; }
function admin_url( string $path ): string { return '/' . $path; }
function add_query_arg( array $args, string $url ): string { return $url . '?' . http_build_query( $args ); }
function selected( $actual, $expected ): void { if ( (string) $actual === (string) $expected ) echo 'selected'; }
function number_format_i18n( $number, int $decimals = 0 ): string { return number_format( $number, $decimals ); }
function size_format( int $bytes, int $decimals = 0 ): string { return number_format( $bytes / 1048576, $decimals ) . ' MB'; }
function get_edit_post_link( int $id, string $context ): string { return '/post.php?post=' . $id; }
function wp_nonce_field( string $action ): void { echo '<input type="hidden" name="_wpnonce" value="fixture-nonce">'; }
function get_current_user_id(): int { return 1; }
function get_transient( string $key ) { return false; }
function get_the_terms( int $id, string $taxonomy ): array { return [ (object) [ 'term_id' => $id % 2 + 1, 'name' => $id % 2 ? 'Museum' : 'Field project' ] ]; }
class VRodos_Background_Jobs { public const SETTINGS_TAB_KEY = 'vrodos_background_jobs'; }
require_once __DIR__ . '/../includes/asset-optimization/trait-vrodos-asset-optimization-settings.php';

class ReadinessViewFixture {
	use VRodos_Asset_Optimization_Settings_View;
	public const SETTINGS_TAB_KEY = 'vrodos_asset_optimization_settings';
	protected const WEB_FAMILY_PROFILES = [ 'web-high', 'web-medium', 'web-low' ];
	protected static function readiness_profile_label( string $profile ): string { return ucfirst( substr( $profile, 4 ) ); }
	protected static function scan_asset_readiness(): array {
		$items = [];
		foreach ( range( 1, 31 ) as $id ) {
			$status = [ 'failed', 'outdated', 'missing', 'processing', 'unsupported', 'source-ready', 'ready' ][ ( $id - 1 ) % 7 ];
			$profiles = [];
			foreach ( self::WEB_FAMILY_PROFILES as $profile ) {
				$profiles[ $profile ] = [ 'status' => 'source-ready' === $status ? 'missing' : ( 'processing' === $status ? 'queued' : $status ), 'bytes' => 1234567, 'reductionPercent' => 75.0 ];
			}
			$items[] = [ 'assetId' => $id, 'title' => $id === 1 ? 'Field <test>' : 'Asset ' . $id, 'status' => $status, 'sourceSizeBytes' => 6543210, 'profiles' => $profiles, 'reason' => $id === 1 ? 'Optimizer <error> & details' : 'Fixture readiness details.' ];
		}
		return $items;
	}
}
function render_readiness_fixture( array $filters ): string {
	$_GET = $filters;
	ob_start();
	try {
		( new ReadinessViewFixture() )->render_asset_optimization_settings();
		return ob_get_contents();
	} finally {
		ob_end_clean();
	}
}
function verify_readiness_view( bool $condition, string $message ): void { if ( ! $condition ) throw new RuntimeException( $message ); }
function readiness_table_rows( string $html ): int {
	$dom = new DOMDocument();
	@$dom->loadHTML( $html );
	return ( new DOMXPath( $dom ) )->query( '//form[@method="post"]//tbody/tr' )->length;
}
$html = render_readiness_fixture( [] );
verify_readiness_view( 25 === readiness_table_rows( $html ) && str_contains( $html, 'Page 1 of 2' ), 'The library must paginate rather than hide excess assets.' );
verify_readiness_view( str_contains( $html, 'Field &lt;test&gt;' ) && str_contains( $html, 'Optimizer &lt;error&gt; &amp; details' ), 'Asset names and actual error details must be escaped.' );
verify_readiness_view( ! str_contains( $html, 'Future LOD' ) && ! str_contains( $html, 'Action Surface' ) && ! str_contains( $html, 'Recommended for' ), 'Obsolete recommendation report sections must be removed.' );
verify_readiness_view( str_contains( $html, 'Web High file-size reduction' ) && str_contains( $html, 'not reclaimed disk space' ), 'Savings must describe file-size reduction rather than deleted originals.' );
verify_readiness_view( str_contains( $html, 'name="retry_asset_id" value="1"' ) && str_contains( $html, 'name="prepare_asset_id" value="2"' ), 'Actionable rows must expose signed form Retry and Prepare buttons.' );
verify_readiness_view( ! str_contains( $html, 'name="asset_ids[]" value="4"' ) && ! str_contains( $html, 'name="asset_ids[]" value="6"' ), 'Processing and source-only assets must not be bulk actionable.' );
$html = render_readiness_fixture( [ 'asset_status' => 'ready' ] );
verify_readiness_view( 4 === readiness_table_rows( $html ) && ! str_contains( $html, 'name="asset_ids[]"' ), 'Ready filtering must show only ready, non-actionable assets.' );
$html = render_readiness_fixture( [ 'asset_status' => 'needs-attention', 'asset_project' => 2 ] );
verify_readiness_view( 8 === readiness_table_rows( $html ), 'Project and attention filters must compose.' );
$html = render_readiness_fixture( [ 'asset_search' => '#1' ] );
verify_readiness_view( 11 === readiness_table_rows( $html ), 'Search must match asset IDs.' );
$html = render_readiness_fixture( [ 'asset_search' => 'no matches' ] );
verify_readiness_view( str_contains( $html, 'No GLB assets match these filters.' ), 'An empty filter result must show an explicit empty state.' );
$html = render_readiness_fixture( [ 'asset_page' => 2 ] );
verify_readiness_view( 6 === readiness_table_rows( $html ), 'The second page must expose the remaining assets.' );
$html = render_readiness_fixture( [ 'asset_status' => [ 'invalid' ], 'asset_project' => [], 'asset_search' => [], 'asset_page' => [] ] );
verify_readiness_view( 25 === readiness_table_rows( $html ), 'Malformed filter input must not break the page.' );
echo "Asset readiness rendering and filter tests passed.\n";
