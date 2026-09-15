<?php

define( 'ABSPATH', __DIR__ );
define( 'MINUTE_IN_SECONDS', 60 );

class VRodos_Asset_Import_Execution {
	public const IMPORT_CRON_HOOK = 'vrodos_asset_import_process_job';
}
class VRodos_Asset_Optimization_Service {
	public const EDITOR_PREVIEW_CRON_HOOK = 'vrodos_asset_editor_preview_process_job';
	public const DESKTOP_PROFILE_CRON_HOOK = 'vrodos_asset_desktop_profile_process_job';
	public const OPTIMIZER_LEASE_OPTION = 'vrodos_asset_optimizer_worker_lease';
}
class VRodos_Deployment_Health {
	public const STATE_OPTION = 'vrodos_deployment_health_state';
	public const TICK_HOOK = 'vrodos_deployment_health_tick';
}
class VRodos_Storage_Manager {
	public static string $root;
	public static function private_site_root( bool $create = false ): string { return self::$root; }
}
class WP_Post {
	public function __construct( public string $post_type, public int $ID ) {}
}

function absint( $value ): int { return max( 0, (int) $value ); }
function sanitize_key( string $value ): string { return preg_replace( '/[^a-z0-9_-]/', '', strtolower( $value ) ); }
function wp_strip_all_tags( string $value ): string { return strip_tags( $value ); }
function wp_normalize_path( string $value ): string { return str_replace( '\\', '/', $value ); }
function trailingslashit( string $value ): string { return rtrim( $value, '/\\' ) . '/'; }
function get_posts( array $query ): array { return [ 1, 2, 3, 4, 5 ]; }
function get_the_title( int $id ): string { return [ 1 => 'Import', 2 => 'Preview', 3 => 'Running Web', 4 => 'Build Assets', 5 => 'Past Import' ][ $id ]; }
function get_edit_post_link( int $id, string $context = 'display' ): string { return '/edit/' . $id; }
function get_post_meta( int $id, string $key, bool $single = true ) { return $GLOBALS['meta'][ $id ][ $key ] ?? ''; }
function get_option( string $key, $default = false ) { return $GLOBALS['options'][ $key ] ?? $default; }
function wp_date( string $format, int $timestamp ): string { return "WP locale: $format @ $timestamp"; }
function get_post_timestamp( WP_Post $post ): int { return $GLOBALS['post_timestamps'][ $post->ID ] ?? 0; }
function wp_next_scheduled( string $hook, array $args = [] ) { return $GLOBALS['events'][ $hook . ':' . json_encode( $args ) ] ?? false; }
function __( string $message, string $domain = '' ): string { return $message; }
function add_filter() {}
function add_action() {}
function current_user_can( string $capability ): bool { return $GLOBALS['can_manage']; }
function wp_send_json_error( array $error, int $code ): never { throw new RuntimeException( 'HTTP ' . $code ); }
function check_ajax_referer(): void { throw new RuntimeException( 'Bad nonce' ); }

require_once __DIR__ . '/../includes/class-vrodos-admin-date-formatter.php';
require_once __DIR__ . '/../includes/class-vrodos-background-jobs.php';

function check_jobs( bool $ok, string $message ): void {
	if ( ! $ok ) {
		throw new RuntimeException( $message );
	}
}

$now = time();
$progress_path = tempnam( sys_get_temp_dir(), 'vrodos-jobs-' );
VRodos_Storage_Manager::$root = dirname( $progress_path );
file_put_contents(
	$progress_path,
	json_encode(
		[
			'schemaVersion' => 1,
			'profile' => 'web-high',
			'jobKey' => 'running-key',
			'sourcePath' => '/source.glb',
			'status' => 'ready',
			'percent' => 100,
			'message' => 'Web derivative is ready',
			'updatedAt' => gmdate( DATE_ATOM, $now - 730 ),
		]
	)
);
$meta = [
	1 => [ '_vrodos_asset_import_status' => 'running', '_vrodos_asset_import_updated_at' => $now - 40 ],
	2 => [ '_vrodos_asset3d_glb_derivatives' => [ 'derivatives' => [ 'editor-preview' => [ 'status' => 'queued', 'updatedAt' => gmdate( DATE_ATOM, $now - 20 ), 'message' => 'Preview queued.' ] ] ] ],
	3 => [ '_vrodos_asset3d_glb_derivatives' => [ 'webVariants' => [ 'running-key' => [
		'profile' => 'web-high', 'jobKey' => 'running-key', 'status' => 'running',
		'sourcePath' => '/source.glb', 'progressPath' => $progress_path,
		'updatedAt' => gmdate( 'Y-m-d H:i:s', $now - 800 ), 'message' => 'Generating.'
	] ] ] ],
	4 => [ '_vrodos_asset3d_glb_derivatives' => [ 'webVariants' => [
		'medium' => [ 'profile' => 'web-medium', 'status' => 'queued', 'cronArgs' => [ 4, 'medium' ], 'profileOptions' => [ 'queuePriority' => 'build' ], 'updatedAt' => gmdate( DATE_ATOM, $now - 10 ) ],
		'low' => [ 'profile' => 'web-low', 'status' => 'queued', 'cronArgs' => [ 4, 'low' ], 'updatedAt' => gmdate( DATE_ATOM, $now - 10 ) ],
		'high' => [ 'profile' => 'web-high', 'status' => 'ready', 'updatedAt' => gmdate( DATE_ATOM, $now - 30 ) ],
		'failed' => [ 'profile' => 'web-low', 'status' => 'failed', 'updatedAt' => gmdate( DATE_ATOM, $now - 90 ), 'message' => 'Could not open D:\\private\\asset.glb' ],
	] ] ],
	5 => [ '_vrodos_asset_import_status' => 'ready', '_vrodos_asset_import_updated_at' => $now - 5 ],
];
$events = [
	VRodos_Asset_Optimization_Service::DESKTOP_PROFILE_CRON_HOOK . ':' . json_encode( [ 4, 'medium' ] ) => 1,
	VRodos_Asset_Optimization_Service::DESKTOP_PROFILE_CRON_HOOK . ':' . json_encode( [ 4, 'low' ] ) => $now + 50,
	VRodos_Deployment_Health::TICK_HOOK . ':[]' => $now + 60,
];
$options = [
	'date_format' => 'd/m/Y',
	'time_format' => 'H:i',
	VRodos_Deployment_Health::STATE_OPTION => [ 'lastTickAt' => $now - 60 ],
	VRodos_Asset_Optimization_Service::OPTIMIZER_LEASE_OPTION => [ 'owner' => 'web:3:running-key', 'token' => 'secret-token', 'expiresAt' => $now + 600 ],
];
$GLOBALS['meta'] = $meta;
$GLOBALS['events'] = $events;
$GLOBALS['options'] = $options;
$GLOBALS['post_timestamps'] = [ 1 => $now - 40 ];

try {
	$formatter = new VRodos_Admin_Date_Formatter();
	check_jobs( "WP locale: d/m/Y H:i @ " . ( $now - 40 ) === $formatter->format_post_date( '2026/09/15', new WP_Post( 'vrodos_scene', 1 ) ), 'VRodos list dates must follow the WordPress settings.' );
	check_jobs( '2026/09/15' === $formatter->format_post_date( '2026/09/15', new WP_Post( 'post', 1 ) ), 'The VRodos date rule must not change other post lists.' );
	$snapshot = VRodos_Background_Jobs_Read_Model::snapshot();
	check_jobs( 'Current' === $snapshot['scheduler']['status'], 'A recent cron tick should show current scheduler health.' );
	check_jobs( "WP locale: d/m/Y H:i @ $now" === $snapshot['generatedAtLabel'], 'Snapshot time must use WordPress date and time settings.' );
	check_jobs( "WP locale: d/m/Y H:i @ " . ( $now - 40 ) === $snapshot['active'][0]['updatedAtLabel'], 'Job update time must use the WordPress formatter.' );
	check_jobs( "WP locale: d/m/Y H:i @ " . ( $now + 600 ) === $snapshot['worker']['expiresAtLabel'], 'Worker lease time must use the WordPress formatter.' );
	check_jobs( "WP locale: d/m/Y H:i @ " . ( $now + 60 ) === $snapshot['scheduler']['nextTickAtLabel'], 'Scheduler time must use the WordPress formatter.' );
	check_jobs( 'Busy' === $snapshot['worker']['status'] && 'Running Web' === $snapshot['worker']['assetLabel'], 'The worker must identify its asset without exposing the lease token.' );
	check_jobs( [ 1, 3, 4, 4, 2 ] === array_column( $snapshot['active'], 'assetId' ), 'Running work must lead, then build-priority events and unscheduled queue records.' );
	check_jobs( 100 === $snapshot['active'][1]['percent'] && str_contains( $snapshot['active'][1]['message'], 'awaiting WordPress finalization' ), 'A ready progress file with a running record must show finalization.' );
	check_jobs( str_contains( $snapshot['active'][1]['note'], '12 minutes' ), 'A running Web job without recent progress must be flagged.' );
	check_jobs( str_contains( $snapshot['active'][4]['note'], 'No cron event' ), 'Queued work with no scheduled event must be visible.' );
	check_jobs( [ 5, 4, 4 ] === array_column( $snapshot['recent'], 'assetId' ), 'Recent outcomes must use status timestamps.' );
	check_jobs( str_contains( $snapshot['recent'][2]['message'], 'private path' ), 'Failure details must not expose private source paths.' );
	check_jobs( ! str_contains( json_encode( $snapshot ), 'secret-token' ) && ! str_contains( json_encode( $snapshot ), $progress_path ), 'Private worker and progress details must stay out of the payload.' );
	$GLOBALS['meta'][3]['_vrodos_asset3d_glb_derivatives']['webVariants']['running-key']['status'] = 'queued';
	$mismatch = VRodos_Background_Jobs_Read_Model::snapshot();
	check_jobs( str_contains( $mismatch['worker']['note'], 'job record is not running' ), 'A held lease with no running record must explain the blocked queue.' );
	$GLOBALS['meta'] = $meta;
	$plain = VRodos_Background_Jobs_Read_Model::arrange( [ [ 'status' => 'failed', 'updatedAt' => 1 ], [ 'status' => 'ready', 'updatedAt' => 2 ] ], 1 );
	check_jobs( 2 === $plain['recent'][0]['updatedAt'] && 1 === count( $plain['recent'] ), 'Recent history must be newest first and bounded.' );

	$GLOBALS['can_manage'] = false;
	try {
		( new VRodos_Background_Jobs() )->ajax_status();
		throw new RuntimeException( 'Unauthorized status access was accepted.' );
	} catch ( RuntimeException $error ) {
		check_jobs( 'HTTP 403' === $error->getMessage(), 'Unauthorized status access must be rejected.' );
	}
	$GLOBALS['can_manage'] = true;
	try {
		( new VRodos_Background_Jobs() )->ajax_status();
		throw new RuntimeException( 'Invalid nonce was accepted.' );
	} catch ( RuntimeException $error ) {
		check_jobs( 'Bad nonce' === $error->getMessage(), 'Invalid nonce must be rejected.' );
	}
	check_jobs( $events === $GLOBALS['events'] && $meta === $GLOBALS['meta'], 'Polling must leave scheduled jobs and metadata unchanged.' );
} finally {
	unlink( $progress_path );
}

echo "Background jobs business-rule tests passed.\n";
