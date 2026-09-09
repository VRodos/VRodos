<?php

declare(strict_types=1);

define( 'ABSPATH', __DIR__ . DIRECTORY_SEPARATOR );

$GLOBALS['vrodos_desktop_test_meta'] = [];
$GLOBALS['vrodos_desktop_test_events'] = [];
$GLOBALS['vrodos_desktop_test_schedule_failure'] = false;
$GLOBALS['vrodos_desktop_test_source'] = [];
$GLOBALS['vrodos_desktop_test_progress_path'] = '';

class WP_Error {
	public function __construct( private string $code, private string $message ) {}
	public function get_error_message(): string {
		return $this->message;
	}
}

final class VRodos_Project_Compile_Plan {
	public object $request;
	public array $scenes;
}

final class VRodos_Runtime_Settings_Contract {
	public static function normalize_bool( $value, bool $default = false ): bool {
		return is_bool( $value ) ? $value : $default;
	}
}

function vrodos_desktop_assert( bool $condition, string $message ): void {
	if ( ! $condition ) {
		fwrite( STDERR, "Desktop profile pipeline test failed: {$message}\n" );
		exit( 1 );
	}
}

function absint( $value ): int {
	return abs( (int) $value );
}

function current_time( string $type, bool $gmt = false ): string {
	return gmdate( 'Y-m-d H:i:s' );
}

function esc_url_raw( string $url ): string {
	return $url;
}

function get_post_meta( int $post_id, string $key, bool $single = false ) {
	if ( 'vrodos_asset3d_glb' === $key ) {
		return $GLOBALS['vrodos_desktop_test_source']['path'] ?? '';
	}
	return $GLOBALS['vrodos_desktop_test_meta'][ $post_id ][ $key ] ?? '';
}

function get_the_title( int $post_id ): string {
	return 'Test asset';
}

function is_wp_error( $value ): bool {
	return $value instanceof WP_Error;
}

function sanitize_key( string $value ): string {
	return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( $value ) ) ?? '';
}

function sanitize_title( string $value ): string {
	return strtolower( trim( preg_replace( '/[^a-z0-9-]+/i', '-', $value ), '-' ) );
}

function sanitize_text_field( string $value ): string {
	return trim( strip_tags( $value ) );
}

function update_post_meta( int $post_id, string $key, $value ): bool {
	$GLOBALS['vrodos_desktop_test_meta'][ $post_id ][ $key ] = $value;
	return true;
}

function wp_delete_file( string $path ): void {
	if ( is_file( $path ) ) {
		unlink( $path );
	}
}

function wp_next_scheduled( string $hook, array $args = [] ) {
	$key = $hook . ':' . serialize( $args );
	return $GLOBALS['vrodos_desktop_test_events'][ $key ] ?? false;
}

function wp_normalize_path( string $path ): string {
	return str_replace( '\\', '/', $path );
}

function wp_schedule_single_event( int $timestamp, string $hook, array $args = [], bool $wp_error = false ) {
	if ( $GLOBALS['vrodos_desktop_test_schedule_failure'] ) {
		return $wp_error
			? new WP_Error( 'schedule_failed', 'The test scheduler rejected the event.' )
			: false;
	}

	$key = $hook . ':' . serialize( $args );
	$GLOBALS['vrodos_desktop_test_events'][ $key ] = $timestamp;
	return true;
}

function wp_strip_all_tags( string $value ): string {
	return strip_tags( $value );
}

require_once dirname( __DIR__ ) . '/includes/asset-optimization/trait-vrodos-asset-optimization-desktop-profiles.php';

final class VRodos_Desktop_Profile_Test_Harness {
	use VRodos_Asset_Optimization_Desktop_Profiles;

	public const DESKTOP_PROFILE_CRON_HOOK = 'vrodos_asset_desktop_profile_process_job';
	public const META_KEY = '_vrodos_asset3d_glb_derivatives';

	private static function build_derivative_paths( int $asset_id, array $source, string $profile ): array {
		return [ 'progress' => $GLOBALS['vrodos_desktop_test_progress_path'] ];
	}

	private static function get_derivative_meta( int $asset_id ): array {
		$meta = get_post_meta( $asset_id, self::META_KEY, true );
		return is_array( $meta ) ? $meta : [ 'derivatives' => [] ];
	}

	private static function get_source_glb( int $asset_id ) {
		return $GLOBALS['vrodos_desktop_test_source'];
	}

	private static function is_derivative_usable( array $record, string $source_url ): bool {
		return false;
	}
}

function invoke_desktop_profile_method( string $name, array $arguments = [] ) {
	$method = new ReflectionMethod( VRodos_Desktop_Profile_Test_Harness::class, $name );
	$method->setAccessible( true );
	return $method->invokeArgs( null, $arguments );
}

function seed_desktop_profile_record( int $asset_id, string $profile, string $status, array $source, array $options, string $updated_at ): void {
	$GLOBALS['vrodos_desktop_test_meta'][ $asset_id ][ VRodos_Desktop_Profile_Test_Harness::META_KEY ] = [
		'derivatives' => [
			$profile => [
				'profile'        => $profile,
				'status'         => $status,
				'message'        => 'Test state.',
				'sourceUrl'      => $source['url'],
				'sourcePath'     => $source['path'],
				'sourceSha256'   => hash_file( 'sha256', $source['path'] ),
				'profileOptions' => $options,
				'updatedAt'      => $updated_at,
			],
		],
	];
}

$test_dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'vrodos-desktop-profile-' . bin2hex( random_bytes( 6 ) );
mkdir( $test_dir, 0777, true );
$source_path = $test_dir . DIRECTORY_SEPARATOR . 'source.glb';
$progress_path = $test_dir . DIRECTORY_SEPARATOR . 'source.desktop-custom.progress.json';
$log_path = $test_dir . DIRECTORY_SEPARATOR . 'test.log';
file_put_contents( $source_path, 'desktop-profile-source' );
ini_set( 'log_errors', '1' );
ini_set( 'error_log', $log_path );

$asset_id = 44;
$profile = 'desktop-custom';
$source = [
	'url'  => '/private/source.glb',
	'path' => $source_path,
];
$options = [
	'protectGeometry' => true,
	'textureMaxSize'  => 0,
	'pipelineVersion' => 1,
];
$GLOBALS['vrodos_desktop_test_source'] = $source;
$GLOBALS['vrodos_desktop_test_progress_path'] = $progress_path;

seed_desktop_profile_record( $asset_id, $profile, 'queued', $source, $options, gmdate( 'Y-m-d H:i:s', time() - 60 ) );
$result = invoke_desktop_profile_method( 'queue_desktop_profile_derivative', [ $asset_id, $profile, $source, $options ] );
vrodos_desktop_assert( true === $result, 'a matching queued record should remain recoverable' );
vrodos_desktop_assert( 1 === count( $GLOBALS['vrodos_desktop_test_events'] ), 'a matching queued record must recreate its missing cron event' );

invoke_desktop_profile_method( 'queue_desktop_profile_derivative', [ $asset_id, $profile, $source, $options ] );
vrodos_desktop_assert( 1 === count( $GLOBALS['vrodos_desktop_test_events'] ), 'an existing cron event must not be duplicated' );
vrodos_desktop_assert( 1 === substr_count( (string) file_get_contents( $log_path ), 'Recovered missing desktop profile cron job' ), 'lost-job recovery should be logged once' );

$GLOBALS['vrodos_desktop_test_events'] = [];
seed_desktop_profile_record( $asset_id, $profile, 'running', $source, $options, gmdate( 'Y-m-d H:i:s', time() - 60 ) );
invoke_desktop_profile_method( 'queue_desktop_profile_derivative', [ $asset_id, $profile, $source, $options ] );
vrodos_desktop_assert( 0 === count( $GLOBALS['vrodos_desktop_test_events'] ), 'a recently updated running job must not be requeued' );

seed_desktop_profile_record( $asset_id, $profile, 'running', $source, $options, gmdate( 'Y-m-d H:i:s', time() - 900 ) );
file_put_contents(
	$progress_path,
	json_encode(
		[
			'schemaVersion' => 1,
			'profile'       => $profile,
			'sourcePath'    => $source_path,
			'status'        => 'running',
			'step'          => 2,
			'totalSteps'    => 5,
			'percent'       => 40,
			'message'       => 'Recent progress.',
			'updatedAt'     => gmdate( 'Y-m-d H:i:s' ),
		]
	)
);
invoke_desktop_profile_method( 'queue_desktop_profile_derivative', [ $asset_id, $profile, $source, $options ] );
vrodos_desktop_assert( 0 === count( $GLOBALS['vrodos_desktop_test_events'] ), 'recent progress-file activity must keep a running job active' );

unlink( $progress_path );
invoke_desktop_profile_method( 'queue_desktop_profile_derivative', [ $asset_id, $profile, $source, $options ] );
$recovered = $GLOBALS['vrodos_desktop_test_meta'][ $asset_id ][ VRodos_Desktop_Profile_Test_Harness::META_KEY ]['derivatives'][ $profile ];
vrodos_desktop_assert( 'queued' === $recovered['status'], 'a stale running job must return to the queue' );
vrodos_desktop_assert( 1 === count( $GLOBALS['vrodos_desktop_test_events'] ), 'a stale running job must schedule a replacement event' );
vrodos_desktop_assert( str_contains( (string) file_get_contents( $log_path ), 'Requeued stale desktop profile job' ), 'stale-job recovery should be logged' );

$GLOBALS['vrodos_desktop_test_events'] = [];
$GLOBALS['vrodos_desktop_test_schedule_failure'] = true;
seed_desktop_profile_record( $asset_id, $profile, 'queued', $source, $options, gmdate( 'Y-m-d H:i:s' ) );
$failed = invoke_desktop_profile_method( 'queue_desktop_profile_derivative', [ $asset_id, $profile, $source, $options ] );
$failed_record = $GLOBALS['vrodos_desktop_test_meta'][ $asset_id ][ VRodos_Desktop_Profile_Test_Harness::META_KEY ]['derivatives'][ $profile ];
vrodos_desktop_assert( is_wp_error( $failed ), 'scheduler rejection must be returned to the compiler' );
vrodos_desktop_assert( 'failed' === $failed_record['status'] && ! empty( $failed_record['failedAt'] ), 'scheduler rejection must persist a failed profile state' );
vrodos_desktop_assert( str_contains( (string) file_get_contents( $log_path ), 'Failed to schedule desktop profile job' ), 'scheduler rejection should be logged' );

$plan = new VRodos_Project_Compile_Plan();
$plan->request = (object) [ 'vr_runtime_profile' => 'desktop' ];
$plan->scenes = [
	(object) [
		'scene_id'        => 45,
		'scene_json'      => (object) [ 'asset_id' => $asset_id ],
		'desktop_profiles' => [
			'buildMode' => 'custom',
			'profiles'  => [ 'custom' => [ 'assets' => $options ] ],
		],
	],
];
$compile_state = VRodos_Desktop_Profile_Test_Harness::prepare_desktop_profile_derivatives( $plan );
vrodos_desktop_assert( 'failed' === $compile_state['status'], 'scheduler rejection must propagate as a failed compiler preflight' );
vrodos_desktop_assert( str_contains( $compile_state['message'], 'test scheduler rejected' ), 'compiler failure should retain the scheduler error' );

wp_delete_file( $source_path );
wp_delete_file( $log_path );
rmdir( $test_dir );

echo "Desktop profile pipeline tests passed.\n";
