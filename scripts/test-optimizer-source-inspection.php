<?php
define( 'ABSPATH', __DIR__ );
class WP_Error {
	public function __construct( public string $code, public string $message ) {}
	public function get_error_message(): string { return $this->message; }
}
function is_wp_error( $value ): bool { return $value instanceof WP_Error; }
function absint( $value ): int { return abs( (int) $value ); }
function wp_normalize_path( $value ): string { return str_replace( '\\', '/', $value ); }
function current_time( ...$args ): string { return '2026-09-11 00:00:00'; }
function get_post_meta( $id, $key, $single = true ) { return $GLOBALS['metadata'][$id][$key] ?? ''; }
function update_post_meta( $id, $key, $value ): void { $GLOBALS['writes']++; $GLOBALS['metadata'][$id][$key] = $value; }
function get_attached_file( $id ) { return $GLOBALS['source_path']; }
function get_posts( $args ): array { return [ 1, 2 ]; }
function get_the_title( $id ): string { return 'Asset ' . $id; }
function _prime_post_caches( $ids, $terms, $meta ): void { $GLOBALS['primed'][] = $ids; }
function wp_parse_url( $url, $component = -1 ) { return parse_url( $url, $component ); }
class VRodos_Core_Manager {
	public static function resolve_media_meta_url( $value ): string { return $value ? '/source.glb' : ''; }
}
class VRodos_Storage_Manager {
	public static function is_glb_file( $path ): bool { return 'glTF' === file_get_contents( $path, false, null, 0, 4 ); }
	public static function attachment_is_owned_by( ...$args ): bool { return true; }
	public static function normalize_glb_attachment( ...$args ): string { $GLOBALS['normalizations']++; return $GLOBALS['source_path']; }
}
require_once __DIR__ . '/../includes/asset-optimization/class-vrodos-asset-optimization-source.php';
require_once __DIR__ . '/../includes/asset-optimization/class-vrodos-asset-optimization-dashboard-read-model.php';
require_once __DIR__ . '/../includes/asset-optimization/trait-vrodos-asset-optimization-scanner.php';
class ScannerFixture {
	use VRodos_Asset_Optimization_Scanner;
	public static function scan(): array { return self::scan_glb_derivatives( 'web-high' ); }
	protected static function inspect_source_glb( int $id ) { return VRodos_Asset_Optimization_Source::inspect( $id, static fn() => $GLOBALS['source_path'] ); }
	protected static function get_derivative_meta( int $id ): array { return []; }
	protected static function get_analysis_meta( int $id ): array { return []; }
	protected static function strip_url_query_fragment( string $url ): string { return preg_split( '/[?#]/', $url )[0]; }
}
function verify( bool $condition, string $message ): void { if ( ! $condition ) throw new RuntimeException( $message ); }
$source_path = tempnam( sys_get_temp_dir(), 'vrodos-inspection-' );
if ( ! is_string( $source_path ) ) throw new RuntimeException( 'Temporary fixture directory is unavailable.' );
$writes = 0;
$normalizations = 0;
$primed = [];
$metadata = [ 1 => [ 'vrodos_asset3d_glb' => 7 ] ];
try {
	file_put_contents( $source_path, 'glTFfixture' );
	$resolve = static fn() => $source_path;
	$source = VRodos_Asset_Optimization_Source::inspect( 1, $resolve );
	verify( ! is_wp_error( $source ) && ! isset( $source['sha256'] ), 'Inspection must not generate a missing fingerprint.' );
	verify( 0 === $writes && 0 === $normalizations, 'Inspection must not write or normalize.' );
	$prepared = VRodos_Asset_Optimization_Source::prepare( 1, $resolve );
	verify( 1 === $writes && 1 === $normalizations && isset( $prepared['sha256'] ), 'Preparation explicitly creates source identity.' );
	$scan = ScannerFixture::scan();
	verify( 1 === $scan['totalAssets'] && count( $scan['analysisMissing'] ) === 1, 'Scan must filter non-GLB media and preserve missing-analysis rows.' );
	verify( $primed === [ [ 1, 2 ] ], 'Scanner must prime metadata in batches.' );
	verify( 1 === $writes && 1 === $normalizations, 'Dashboard scanning must remain read-only.' );
	$rows = VRodos_Asset_Optimization_Dashboard_Read_Model::collect( $scan );
	verify( count( $rows ) === 1 && ! empty( $rows[0]['dashboardFlags']['analysis-missing'] ), 'Dashboard rows preserve missing-analysis priority flags.' );
	$rows = [
		[ 'assetId' => 1, 'recommendationScore' => 100, 'title' => 'Beta' ],
		[ 'assetId' => 2, 'recommendationScore' => 200, 'title' => 'Alpha' ],
		[ 'assetId' => 3, 'recommendationScore' => 200, 'title' => 'Gamma' ],
	];
	$ordered = VRodos_Asset_Optimization_Dashboard_Read_Model::sort( $rows, 'priority', 'desc' );
	verify( array_column( $ordered, 'assetId' ) === [ 3, 2, 1 ], 'Global priority sorting retains the ID tie-break before pagination.' );
	verify( array_column( array_slice( $ordered, 1, 1 ), 'assetId' ) === [ 2 ], 'Pagination selects from globally sorted rows.' );
	verify( array_column( VRodos_Asset_Optimization_Dashboard_Read_Model::sort( $rows, 'title', 'asc' ), 'assetId' ) === [ 2, 1, 3 ], 'Title ordering is preserved.' );
	file_put_contents( $source_path, 'glTFchanged fixture' );
	clearstatcache( true, $source_path );
	$stale = VRodos_Asset_Optimization_Source::inspect( 1, $resolve );
	verify( ! isset( $stale['sha256'] ) && 1 === $writes, 'Inspection must not advertise or refresh stale source identity.' );
	for ( $i = 0; $i < 10; $i++ ) {
		verify( ! isset( VRodos_Asset_Optimization_Source::inspect( 1, $resolve )['sha256'] ), 'Repeated reads must not repair stale identity.' );
	}
	verify( 1 === $writes && 1 === $normalizations, 'Repeated stale status reads must remain read-only.' );
	$replacement = VRodos_Asset_Optimization_Source::prepare( 1, $resolve );
	verify( 2 === $replacement['generation'] && $prepared['sha256'] !== $replacement['sha256'], 'Explicit processing must advance generation for changed content.' );
	$metadata[1]['vrodos_asset3d_glb'] = 8;
	verify( ! isset( VRodos_Asset_Optimization_Source::inspect( 1, $resolve )['sha256'] ), 'An attachment replacement must not reuse the previous attachment identity.' );
	$same_content = VRodos_Asset_Optimization_Source::prepare( 1, $resolve );
	verify( 3 === $same_content['generation'] && $same_content['sha256'] === $replacement['sha256'], 'Same-content attachment replacement must still advance generation.' );
	$before_reads = [ $writes, $normalizations ];
	unlink( $source_path );
	clearstatcache( true, $source_path );
	verify( is_wp_error( VRodos_Asset_Optimization_Source::inspect( 1, $resolve ) ), 'Deleted source files must immediately fail inspection.' );
	verify( $before_reads === [ $writes, $normalizations ], 'Missing-source inspection must not write or normalize.' );
} finally {
	if ( is_file( $source_path ) ) unlink( $source_path );
}
echo "Read-only optimizer source and dashboard scan tests passed.\n";
