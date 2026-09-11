<?php
define( 'ABSPATH', __DIR__ );
class WP_Error {}
function is_wp_error( $value ): bool { return $value instanceof WP_Error; }
function get_the_title( $id ): string { return $GLOBALS['title']; }
require_once __DIR__ . '/../includes/asset-optimization/trait-vrodos-asset-optimization-dashboard.php';

// Exercise row assembly; replace HTML presentation and storage boundaries only.
class DashboardRowFixture {
	use VRodos_Asset_Optimization_Dashboard_View;
	public static array $reads = [];
	public static array $meta = [];
	public static array $analysis = [];
	public static array|WP_Error $source = [ 'url' => '/source.glb' ];
	public static bool $stale_analysis = false;
	public static function row( int $id ): array { return self::dashboard_asset_row_state( $id ); }
	private static function scan_glb_derivatives( $profile ): never { throw new RuntimeException( 'A row refresh must not scan the collection.' ); }
	private static function get_derivative_meta( $id ): array { self::$reads[] = $id; return self::$meta; }
	private static function get_analysis_meta( $id ): array { self::$reads[] = $id; return self::$analysis; }
	private static function inspect_source_glb( $id ): array|WP_Error { self::$reads[] = $id; return self::$source; }
	private static function analysis_needs_refresh( $analysis, $source ): bool { return self::$stale_analysis; }
	private static function derivative_unusable_reason( $derivative, $url ): string { return $derivative['sourceUrl'] === $url ? '' : 'Source changed'; }
	private static function dashboard_row_cells_html( $id, $meta, $analysis, $flags, $ready, $reason ): array {
		return compact( 'flags', 'ready', 'reason' );
	}
	private static function dashboard_row_actions_html( $id, $flags, $ready ): string { return $ready ? 'ready' : 'generate'; }
}
function verify_row( bool $condition, string $message ): void { if ( ! $condition ) throw new RuntimeException( $message ); }
$title = 'Asset title';
for ( $i = 0; $i < 20; $i++ ) {
	$row = DashboardRowFixture::row( 42 );
	verify_row( $row['rowVisible'] && $row['cells']['flags']['analysis-missing'], 'Missing analysis must remain actionable on repeated reads.' );
}
verify_row( count( DashboardRowFixture::$reads ) === 60 && array_unique( DashboardRowFixture::$reads ) === [ 42 ], 'Each refresh must read only the requested asset.' );
verify_row( array_keys( $row ) === [ 'assetId', 'rowVisible', 'cells', 'actionsHtml', 'title' ], 'The AJAX row payload shape must remain stable.' );
DashboardRowFixture::$analysis = [ 'recommendations' => [] ];
DashboardRowFixture::$meta = [ 'derivatives' => [ 'web-high' => [ 'sourceUrl' => '/source.glb' ] ] ];
$row = DashboardRowFixture::row( 42 );
verify_row( ! $row['rowVisible'] && $row['cells']['ready'], 'Completed low-benefit rows must leave the actionable list.' );
DashboardRowFixture::$source = [ 'url' => '/replacement.glb' ];
DashboardRowFixture::$stale_analysis = true;
$title = 'Renamed asset';
$row = DashboardRowFixture::row( 42 );
verify_row( $row['rowVisible'] && $row['cells']['flags']['analysis-stale'] && $row['cells']['flags']['stale-derivative'], 'Replacement must immediately expose stale analysis and derivative state.' );
verify_row( 'Renamed asset' === $row['title'], 'Row refreshes must read the current title.' );
DashboardRowFixture::$source = new WP_Error();
$row = DashboardRowFixture::row( 42 );
verify_row( $row['rowVisible'] && $row['cells']['flags']['unsupported'], 'A missing source must remain visible for diagnosis.' );
$title = '';
verify_row( 'Asset #42' === DashboardRowFixture::row( 42 )['title'], 'Untitled assets retain the ID label.' );
echo "Targeted optimizer dashboard row tests passed.\n";
