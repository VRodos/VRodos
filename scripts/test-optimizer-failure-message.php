<?php
declare(strict_types=1);

define( 'ABSPATH', __DIR__ . '/' );
require_once dirname( __DIR__ ) . '/includes/asset-optimization/trait-vrodos-asset-optimization-derivatives.php';

final class VRodos_Optimizer_Failure_Harness {
	use VRodos_Asset_Optimization_Derivative_Service;
	public static function message( string $path, array $output ): string {
		return self::optimizer_failure_message( $path, $output );
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
echo "Optimizer failure reporting acceptance tests passed.\n";
