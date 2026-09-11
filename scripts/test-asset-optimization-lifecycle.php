<?php

declare(strict_types=1);

define( 'ABSPATH', __DIR__ . DIRECTORY_SEPARATOR );

$GLOBALS['vrodos_lifecycle_snapshot'] = [];
$GLOBALS['vrodos_lifecycle_meta'] = [];
$GLOBALS['vrodos_lifecycle_post_type'] = 'vrodos_asset3d';

class WP_Error {
	public function __construct( private string $message ) {}
	public function get_error_message(): string {
		return $this->message;
	}
}

class WP_Post {
	public function __construct( public string $post_type ) {}
}

function vrodos_lifecycle_assert( bool $condition, string $message ): void {
	if ( ! $condition ) {
		fwrite( STDERR, "Asset optimization lifecycle test failed: {$message}\n" );
		exit( 1 );
	}
}

function absint( $value ): int {
	return abs( (int) $value );
}

function get_post_type( int $post_id ): string {
	unset( $post_id );
	return $GLOBALS['vrodos_lifecycle_post_type'];
}

function get_post_meta( int $post_id, string $key, bool $single = false ) {
	unset( $single );
	return $GLOBALS['vrodos_lifecycle_meta'][ $post_id ][ $key ] ?? '';
}

function delete_post_meta( int $post_id, string $key ): bool {
	unset( $GLOBALS['vrodos_lifecycle_meta'][ $post_id ][ $key ] );
	return true;
}

function is_wp_error( $value ): bool {
	return $value instanceof WP_Error;
}

require_once dirname( __DIR__ ) . '/includes/asset-optimization/trait-vrodos-asset-optimization-admin-actions.php';

final class VRodos_Asset_Optimization_Lifecycle_Harness {
	use VRodos_Asset_Optimization_Admin_Actions;

	public const META_KEY = '_vrodos_asset3d_glb_derivatives';
	public const SOURCE_META_KEY = '_vrodos_asset3d_glb_source_snapshot';
	public static array $source = [];
	public static int $cancelled = 0;
	public static int $deleted = 0;
	public static int $highQueued = 0;
	public static int $previewQueued = 0;

	private static function read_source_snapshot( int $asset_id ): array {
		unset( $asset_id );
		return $GLOBALS['vrodos_lifecycle_snapshot'];
	}

	private static function prepare_source_glb( int $asset_id ): array {
		unset( $asset_id );
		return self::$source;
	}

	private static function cancel_asset_optimization_jobs( int $asset_id ): void {
		unset( $asset_id );
		++self::$cancelled;
	}

	private static function delete_asset_derivative_cache( int $asset_id ): void {
		unset( $asset_id );
		++self::$deleted;
	}

	private static function refresh_asset_analysis( int $asset_id ): array {
		unset( $asset_id );
		return [ 'counts' => [ 'images' => 1 ] ];
	}

	private static function maybe_queue_web_high( int $asset_id, array $source, array $analysis ): bool {
		unset( $asset_id, $source, $analysis );
		++self::$highQueued;
		return true;
	}

	private static function editor_preview_decision( int $source_size_bytes, array $analysis ): array {
		unset( $source_size_bytes, $analysis );
		return [ 'shouldPreview' => true ];
	}

	private static function maybe_queue_editor_preview( int $asset_id, array $source, array $analysis, array $decision ): void {
		unset( $asset_id, $source, $analysis, $decision );
		++self::$previewQueued;
	}
}

$asset_id = 806;
$GLOBALS['vrodos_lifecycle_meta'][ $asset_id ][ VRodos_Asset_Optimization_Lifecycle_Harness::META_KEY ] = [ 'schemaVersion' => 2 ];
$GLOBALS['vrodos_lifecycle_snapshot'] = [
	'attachmentId' => 10,
	'sha256' => str_repeat( 'a', 64 ),
	'generation' => 1,
];
VRodos_Asset_Optimization_Lifecycle_Harness::$source = [
	'attachmentId' => 11,
	'sha256' => str_repeat( 'b', 64 ),
	'generation' => 2,
	'modifiedAt' => 100,
	'sizeBytes' => 300 * 1024 * 1024,
];
$controller = new VRodos_Asset_Optimization_Lifecycle_Harness();
$controller->handle_asset_glb_meta_change( 1, $asset_id, 'vrodos_asset3d_glb', 11 );
vrodos_lifecycle_assert( 1 === VRodos_Asset_Optimization_Lifecycle_Harness::$cancelled, 'source replacement must cancel queued work' );
vrodos_lifecycle_assert( 1 === VRodos_Asset_Optimization_Lifecycle_Harness::$deleted, 'source content replacement must delete obsolete derivatives and staging data' );
vrodos_lifecycle_assert( 1 === VRodos_Asset_Optimization_Lifecycle_Harness::$highQueued, 'GLB activation must queue High exactly once' );
vrodos_lifecycle_assert( 0 === VRodos_Asset_Optimization_Lifecycle_Harness::$previewQueued, 'GLB activation must not queue preview work until High reaches a terminal state' );

$GLOBALS['vrodos_lifecycle_snapshot'] = [
	'attachmentId' => 11,
	'sha256' => str_repeat( 'b', 64 ),
	'generation' => 2,
];
VRodos_Asset_Optimization_Lifecycle_Harness::$source['attachmentId'] = 12;
VRodos_Asset_Optimization_Lifecycle_Harness::$source['generation'] = 3;
$controller->handle_asset_glb_meta_change( 2, $asset_id, 'vrodos_asset3d_glb', 12 );
vrodos_lifecycle_assert( 2 === VRodos_Asset_Optimization_Lifecycle_Harness::$cancelled, 'same-content attachment replacement must cancel jobs from the old generation' );
vrodos_lifecycle_assert( 1 === VRodos_Asset_Optimization_Lifecycle_Harness::$deleted, 'same-content replacement must retain reusable immutable derivatives' );

$GLOBALS['vrodos_lifecycle_meta'][ $asset_id ][ VRodos_Asset_Optimization_Lifecycle_Harness::SOURCE_META_KEY ] = $GLOBALS['vrodos_lifecycle_snapshot'];
$controller->handle_asset_glb_meta_delete( [], $asset_id, 'vrodos_asset3d_glb', 12 );
vrodos_lifecycle_assert( 3 === VRodos_Asset_Optimization_Lifecycle_Harness::$cancelled && 2 === VRodos_Asset_Optimization_Lifecycle_Harness::$deleted, 'metadata removal must cancel and delete the optimization family' );
vrodos_lifecycle_assert( '' === get_post_meta( $asset_id, VRodos_Asset_Optimization_Lifecycle_Harness::SOURCE_META_KEY, true ), 'metadata removal must delete the source identity snapshot' );

$controller->handle_asset_delete( $asset_id, new WP_Post( 'vrodos_asset3d' ) );
vrodos_lifecycle_assert( 4 === VRodos_Asset_Optimization_Lifecycle_Harness::$cancelled && 3 === VRodos_Asset_Optimization_Lifecycle_Harness::$deleted, 'asset deletion must cancel jobs and remove all derivative data' );

echo "Asset optimization lifecycle tests passed.\n";
