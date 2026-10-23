<?php
declare(strict_types=1);

define( 'ABSPATH', __DIR__ . '/' );
require_once dirname( __DIR__ ) . '/includes/asset-optimization/trait-vrodos-asset-optimization-derivatives.php';
require_once dirname( __DIR__ ) . '/includes/asset-optimization/trait-vrodos-asset-optimization-queue.php';

class WP_Error {
	public function __construct( public string $code, public string $message ) {}
}
class VRodos_Path_Manager {
	public static function plugin_path( string $path ): string { return $GLOBALS['optimizer_fixture']; }
}
function wp_mkdir_p( string $path ): bool { return is_dir( $path ); }
function wp_raise_memory_limit( string $context ): void {}
function apply_filters( string $hook, $value ) { return PHP_BINARY; }
function wp_cache_delete( string $key, string $group ): bool {
	unset( $GLOBALS['optimizer_option_cache'][ $key ] );
	return true;
}

final class VRodos_Optimizer_Failure_Harness {
	use VRodos_Asset_Optimization_Derivative_Service;
	use VRodos_Asset_Optimization_Queue;
	public static function message( string $path, array $output ): string {
		return self::optimizer_failure_message( $path, $output );
	}
	protected static function build_derivative_paths( int $id, array $source, string $profile, string $key = '' ): array {
		return [ 'dir' => dirname( $source['path'] ), 'file' => '', 'manifest' => $source['path'] . '.manifest', 'markdown' => '' ];
	}
	public function run_worker( string $path ) {
		return $this->generate_derivative( 1, [ 'path' => $path, 'url' => '' ], 'safe-draco' );
	}
}

$path = tempnam( sys_get_temp_dir(), 'vrodos-optimizer-error-' );
try {
	$manifest = [ 'assets' => [ [
		'status' => 'error',
		'error' => 'Draco encoder aborted while writing optimized geometry.',
		'geometrySimplification' => [ 'before' => 8491017, 'after' => 8490971, 'targetReached' => false ],
	] ] ];
	$json = json_encode( $manifest, JSON_PRETTY_PRINT );
	file_put_contents( $path, $json );
	$message = VRodos_Optimizer_Failure_Harness::message( $path, explode( "\n", $json ) );
	if ( $message !== $manifest['assets'][0]['error'] ) throw new RuntimeException( 'Build failures must show the actual optimizer error instead of the JSON tail.' );
	file_put_contents( $path, '' );
	$message = VRodos_Optimizer_Failure_Harness::message( $path, [ 'FATAL ERROR: JavaScript heap out of memory' ] );
	if ( $message !== 'FATAL ERROR: JavaScript heap out of memory' ) throw new RuntimeException( 'Worker crashes without a report must retain the process error.' );
} finally {
	unlink( $path );
}

// A real child changes persisted state while its parent holds an old option cache.
$GLOBALS['optimizer_fixture'] = tempnam( sys_get_temp_dir(), 'vrodos-fake-worker-' );
$cron_state = tempnam( sys_get_temp_dir(), 'vrodos-external-cron-' );
try {
	file_put_contents( $GLOBALS['optimizer_fixture'], '<?php file_put_contents($argv[2], "external-event"); echo "Encoder interrupted"; exit(1);' );
	$GLOBALS['optimizer_option_cache'] = [ 'cron' => 'stale', 'alloptions' => [ 'cron' => 'stale' ] ];
	$result = ( new VRodos_Optimizer_Failure_Harness() )->run_worker( $cron_state );
	if ( ! $result instanceof WP_Error || ! str_contains( $result->message, 'Encoder interrupted' ) ) throw new RuntimeException( 'The child failure must still be reported.' );
	if ( 'external-event' !== file_get_contents( $cron_state ) || [] !== $GLOBALS['optimizer_option_cache'] ) throw new RuntimeException( 'A blocking optimizer must discard the stale cron caches before its caller resumes scheduling, including on failure.' );
} finally {
	unlink( $GLOBALS['optimizer_fixture'] );
	unlink( $cron_state );
}
echo "Optimizer failure reporting acceptance tests passed.\n";
