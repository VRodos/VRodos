<?php

declare(strict_types=1);

define( 'ABSPATH', __DIR__ . DIRECTORY_SEPARATOR );
define( 'MINUTE_IN_SECONDS', 60 );

$GLOBALS['vrodos_health_options'] = [];
$GLOBALS['vrodos_health_transients'] = [];
$GLOBALS['vrodos_health_events'] = [];
$GLOBALS['vrodos_health_cleared'] = [];
$GLOBALS['vrodos_health_filters'] = [
	'vrodos_deployment_health_effective_uid' => 33,
	'vrodos_deployment_health_request_cron_enabled' => false,
	'vrodos_deployment_health_php_function_available' => true,
];
$GLOBALS['vrodos_health_environment'] = 'production';
$GLOBALS['vrodos_health_upload_error'] = '';
$GLOBALS['vrodos_health_upload_basedir'] = sys_get_temp_dir();
$GLOBALS['vrodos_health_private_error'] = '';

class WP_Error {
	public function __construct( private string $code, private string $message ) {}
	public function get_error_message(): string { return $this->message; }
}

class VRodos_Storage_Manager {
	public static function private_site_root() {
		return '' !== $GLOBALS['vrodos_health_private_error']
			? new WP_Error( 'storage', $GLOBALS['vrodos_health_private_error'] )
			: sys_get_temp_dir();
	}
}

function vrodos_health_assert( bool $condition, string $message ): void {
	if ( ! $condition ) {
		fwrite( STDERR, "Deployment health test failed: {$message}\n" );
		exit( 1 );
	}
}

function __( string $value, string $domain = '' ): string { return $value; }
function add_action( ...$args ): void {}
function add_filter( ...$args ): void {}
function apply_filters( string $tag, $value ) { return $GLOBALS['vrodos_health_filters'][ $tag ] ?? $value; }
function is_wp_error( $value ): bool { return $value instanceof WP_Error; }
function sanitize_text_field( string $value ): string { return trim( strip_tags( $value ) ); }
function wp_strip_all_tags( string $value ): string { return strip_tags( $value ); }
function absint( $value ): int { return abs( (int) $value ); }
function human_time_diff( int $from, int $to ): string { return (string) abs( $to - $from ) . ' seconds'; }
function get_bloginfo( string $show ): string { return '6.8'; }
function wp_get_environment_type(): string { return $GLOBALS['vrodos_health_environment']; }
function get_option( string $key, $default = false ) { return $GLOBALS['vrodos_health_options'][ $key ] ?? $default; }
function add_option( string $key, $value, string $deprecated = '', bool $autoload = true ): bool { $GLOBALS['vrodos_health_options'][ $key ] = $value; return true; }
function update_option( string $key, $value, bool $autoload = true ): bool { $GLOBALS['vrodos_health_options'][ $key ] = $value; return true; }
function delete_option( string $key ): bool { unset( $GLOBALS['vrodos_health_options'][ $key ] ); return true; }
function get_transient( string $key ) { return $GLOBALS['vrodos_health_transients'][ $key ] ?? false; }
function set_transient( string $key, $value, int $ttl ): bool { $GLOBALS['vrodos_health_transients'][ $key ] = $value; return true; }
function delete_transient( string $key ): bool { unset( $GLOBALS['vrodos_health_transients'][ $key ] ); return true; }
function wp_next_scheduled( string $hook ) { return $GLOBALS['vrodos_health_events'][ $hook ] ?? false; }
function wp_schedule_event( int $timestamp, string $schedule, string $hook, array $args = [], bool $wp_error = false ) { $GLOBALS['vrodos_health_events'][ $hook ] = $timestamp; return true; }
function wp_clear_scheduled_hook( string $hook, array $args = [] ): int { $GLOBALS['vrodos_health_cleared'][] = [ $hook, $args ]; unset( $GLOBALS['vrodos_health_events'][ $hook ] ); return 1; }
function wp_upload_dir( $time = null, bool $create = true ): array {
	return [
		'basedir' => $GLOBALS['vrodos_health_upload_basedir'],
		'error' => $GLOBALS['vrodos_health_upload_error'],
	];
}
function trailingslashit( string $value ): string { return rtrim( $value, '/\\' ) . DIRECTORY_SEPARATOR; }

require_once dirname( __DIR__ ) . '/includes/class-vrodos-deployment-health.php';

VRodos_Deployment_Health::ensure_tick_scheduled();
VRodos_Deployment_Health::ensure_tick_scheduled();
vrodos_health_assert( 1 === count( $GLOBALS['vrodos_health_events'] ), 'the recurring tick must be scheduled idempotently' );
vrodos_health_assert( 'recommended' === VRodos_Deployment_Health::background_check()['status'], 'a new install must receive a first-tick grace period' );

VRodos_Deployment_Health::record_tick();
$state = get_option( VRodos_Deployment_Health::STATE_OPTION, [] );
vrodos_health_assert( absint( $state['lastTickAt'] ?? 0 ) > 0, 'the recurring tick must record its execution' );
vrodos_health_assert( 33 === (int) ( $state['lastTickUid'] ?? 0 ), 'the recurring tick must record its effective UID' );
vrodos_health_assert( 'good' === VRodos_Deployment_Health::background_check()['status'], 'a fresh externally driven tick must be healthy' );

$GLOBALS['vrodos_health_filters']['vrodos_deployment_health_request_cron_enabled'] = true;
vrodos_health_assert( 'recommended' === VRodos_Deployment_Health::background_check()['status'], 'production request cron must not be described as a dedicated scheduler' );
$GLOBALS['vrodos_health_filters']['vrodos_deployment_health_request_cron_enabled'] = false;

$state['lastTickAt'] = time() - 20 * MINUTE_IN_SECONDS;
update_option( VRodos_Deployment_Health::STATE_OPTION, $state, false );
vrodos_health_assert( 'recommended' === VRodos_Deployment_Health::background_check()['status'], 'a delayed tick must be recommended' );
$state['lastTickAt'] = time() - 46 * MINUTE_IN_SECONDS;
update_option( VRodos_Deployment_Health::STATE_OPTION, $state, false );
vrodos_health_assert( 'critical' === VRodos_Deployment_Health::background_check()['status'], 'a stale production tick must be critical' );

$GLOBALS['vrodos_health_environment'] = 'development';
$GLOBALS['vrodos_health_filters']['vrodos_deployment_health_request_cron_enabled'] = true;
vrodos_health_assert( 'recommended' === VRodos_Deployment_Health::background_check()['status'], 'a stale development tick with request cron enabled must be recommended' );
$GLOBALS['vrodos_health_filters']['vrodos_deployment_health_request_cron_enabled'] = false;
vrodos_health_assert( 'critical' === VRodos_Deployment_Health::background_check()['status'], 'a stale development tick with request cron disabled must be critical' );
$GLOBALS['vrodos_health_environment'] = 'production';

$state['lastTickAt'] = time();
$state['lastTickUid'] = 34;
update_option( VRodos_Deployment_Health::STATE_OPTION, $state, false );
vrodos_health_assert( 'critical' === VRodos_Deployment_Health::background_check()['status'], 'a scheduler/web UID mismatch must be critical' );

$state['lastTickUid'] = 33;
$state['probe'] = [ 'token' => 'expected-token', 'requestedAt' => time(), 'completedAt' => 0 ];
update_option( VRodos_Deployment_Health::STATE_OPTION, $state, false );
VRodos_Deployment_Health::record_probe( 'wrong-token' );
vrodos_health_assert( 0 === (int) get_option( VRodos_Deployment_Health::STATE_OPTION )['probe']['completedAt'], 'a stale probe token must be ignored' );
VRodos_Deployment_Health::record_probe( 'expected-token' );
vrodos_health_assert( absint( get_option( VRodos_Deployment_Health::STATE_OPTION )['probe']['completedAt'] ) > 0, 'the current manual probe must record completion' );

$GLOBALS['vrodos_health_private_error'] = 'Private storage is unsafe.';
vrodos_health_assert( 'critical' === VRodos_Deployment_Health::storage_check()['status'], 'private storage failures must be critical' );
$GLOBALS['vrodos_health_private_error'] = '';
vrodos_health_assert( 'good' === VRodos_Deployment_Health::storage_check()['status'], 'writable public and private storage must pass' );
$GLOBALS['vrodos_health_upload_error'] = 'Uploads are unavailable.';
vrodos_health_assert( 'critical' === VRodos_Deployment_Health::storage_check()['status'], 'upload failures must be critical' );
$GLOBALS['vrodos_health_upload_error'] = '';

$storage_fixture = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'vrodos-health-' . bin2hex( random_bytes( 6 ) );
mkdir( $storage_fixture );
file_put_contents( $storage_fixture . DIRECTORY_SEPARATOR . 'vrodos', 'blocked' );
$GLOBALS['vrodos_health_upload_basedir'] = $storage_fixture;
vrodos_health_assert( 'critical' === VRodos_Deployment_Health::storage_check()['status'], 'a file blocking the published-output directory must be critical' );
unlink( $storage_fixture . DIRECTORY_SEPARATOR . 'vrodos' );
rmdir( $storage_fixture );
$GLOBALS['vrodos_health_upload_basedir'] = sys_get_temp_dir();

$GLOBALS['vrodos_health_filters']['vrodos_deployment_health_php_function_available'] = false;
$runtime_failure = VRodos_Deployment_Health::runtime_check();
vrodos_health_assert( 'critical' === $runtime_failure['status'] && str_contains( $runtime_failure['message'], 'exec' ), 'disabled command execution must be critical' );
$optimizer_failure = VRodos_Deployment_Health::optimizer_check();
vrodos_health_assert( 'critical' === $optimizer_failure['status'] && str_contains( $optimizer_failure['message'], 'exec' ), 'disabled command execution must prevent optimizer launch' );
$GLOBALS['vrodos_health_filters']['vrodos_deployment_health_php_function_available'] = true;

VRodos_Deployment_Health::deactivate();
$cleared_hooks = array_column( $GLOBALS['vrodos_health_cleared'], 0 );
vrodos_health_assert( in_array( VRodos_Deployment_Health::TICK_HOOK, $cleared_hooks, true ), 'deactivation must clear the recurring tick' );
vrodos_health_assert( in_array( VRodos_Deployment_Health::PROBE_HOOK, $cleared_hooks, true ), 'deactivation must clear pending probes' );

VRodos_Deployment_Health::uninstall();
vrodos_health_assert( false === get_option( VRodos_Deployment_Health::STATE_OPTION, false ), 'uninstall must remove only deployment-health state' );

echo "Deployment health tests passed.\n";
