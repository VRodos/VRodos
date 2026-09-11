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

function wp_json_encode( $value ): string {
	return json_encode( $value, JSON_UNESCAPED_SLASHES );
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

function wp_unschedule_event( int $timestamp, string $hook, array $args = [], bool $wp_error = false ) {
	$key = $hook . ':' . serialize( $args );
	if ( ( $GLOBALS['vrodos_desktop_test_events'][ $key ] ?? false ) !== $timestamp ) {
		return false;
	}
	unset( $GLOBALS['vrodos_desktop_test_events'][ $key ] );
	return true;
}

function wp_strip_all_tags( string $value ): string {
	return strip_tags( $value );
}

function wp_get_post_terms( int $post_id, string $taxonomy, array $args = [] ): array {
	unset( $post_id, $taxonomy, $args );
	return [ 'walkable-surface' ];
}

require_once dirname( __DIR__ ) . '/includes/asset-optimization/trait-vrodos-asset-optimization-queue.php';
require_once dirname( __DIR__ ) . '/includes/asset-optimization/trait-vrodos-asset-optimization-desktop-profiles.php';

final class VRodos_Desktop_Profile_Test_Harness {
	use VRodos_Asset_Optimization_Queue;
	use VRodos_Asset_Optimization_Desktop_Profiles;

	public const DESKTOP_PROFILE_CRON_HOOK = 'vrodos_asset_desktop_profile_process_job';
	public const EDITOR_PREVIEW_CRON_HOOK = 'vrodos_asset_editor_preview_process_job';
	public const EDITOR_PREVIEW_PROFILE = 'editor-preview';
	public const META_KEY = '_vrodos_asset3d_glb_derivatives';
	public const SOURCE_META_KEY = '_vrodos_asset3d_glb_source_snapshot';
	public const ANALYSIS_META_KEY = '_vrodos_asset3d_glb_analysis';

	private static function build_derivative_paths( int $asset_id, array $source, string $profile, string $job_key = '' ): array {
		unset( $asset_id, $source, $profile, $job_key );
		return [ 'progress' => $GLOBALS['vrodos_desktop_test_progress_path'] ];
	}

	private static function get_derivative_meta( int $asset_id ): array {
		$meta = get_post_meta( $asset_id, self::META_KEY, true );
		return is_array( $meta ) ? $meta : [ 'schemaVersion' => 2, 'derivatives' => [], 'webVariants' => [], 'webProfileDefaults' => [] ];
	}

	private static function ensure_current_derivative_schema( int $asset_id ): void {
		unset( $asset_id );
	}

	private static function source_identity_matches( int $asset_id, string $sha256, int $generation ): bool {
		unset( $asset_id );
		return $sha256 === (string) ( $GLOBALS['vrodos_desktop_test_source']['sha256'] ?? '' )
			&& $generation === (int) ( $GLOBALS['vrodos_desktop_test_source']['generation'] ?? 0 );
	}

	private static function get_source_glb( int $asset_id ) {
		return $GLOBALS['vrodos_desktop_test_source'];
	}

	private static function is_derivative_usable( array $record, string $source_url ): bool {
		return false;
	}

	private static function get_analysis_meta( int $asset_id ): array {
		return [ 'payload' => [ 'estimatedImageBytes' => 64 * 1024 * 1024 ] ];
	}

	private static function analysis_needs_refresh( $analysis, array $source ): bool {
		return false;
	}

	private static function refresh_asset_analysis( int $asset_id ): array {
		return self::get_analysis_meta( $asset_id );
	}

	private static function editor_preview_decision( int $source_size_bytes, array $analysis ): array {
		return [ 'shouldPreview' => $source_size_bytes >= 10 * 1024 * 1024, 'reasons' => [ 'source-size' ] ];
	}

	private static function get_editor_preview_record( int $asset_id ): array {
		$meta = self::get_derivative_meta( $asset_id );
		return is_array( $meta['derivatives']['editor-preview'] ?? null ) ? $meta['derivatives']['editor-preview'] : [];
	}

	private static function editor_preview_record_is_ready( array $record, array $source ): bool {
		return 'ready' === ( $record['status'] ?? '' );
	}

	private static function maybe_queue_editor_preview( int $asset_id, array $source, array $analysis, array $decision, string $queue_priority = 'normal' ): void {
		self::schedule_optimizer_event( self::EDITOR_PREVIEW_CRON_HOOK, [ $asset_id ], 10, $queue_priority );
	}
}

function invoke_desktop_profile_method( string $name, array $arguments = [] ) {
	$method = new ReflectionMethod( VRodos_Desktop_Profile_Test_Harness::class, $name );
	$method->setAccessible( true );
	return $method->invokeArgs( null, $arguments );
}

function seed_desktop_profile_record( int $asset_id, string $profile, string $status, array $source, array $options, string $updated_at ): string {
	$job_key = invoke_desktop_profile_method( 'desktop_profile_job_key', [ $source, $profile, $options ] );
	$record = [
		'profile'        => $profile,
		'jobKey'         => $job_key,
		'status'         => $status,
		'message'        => 'Test state.',
		'sourceUrl'      => $source['url'],
		'sourcePath'     => $source['path'],
		'sourceSha256'   => $source['sha256'],
		'sourceGeneration' => $source['generation'],
		'profileOptions' => array_merge( $options, [ 'jobKey' => $job_key, 'sourceSha256' => $source['sha256'], 'sourceGeneration' => $source['generation'] ] ),
		'updatedAt'      => $updated_at,
	];
	if ( 'ready' === $status ) {
		$record = array_merge(
			$record,
			[
				'path' => $source['path'],
				'url' => '/private/derivative.glb',
				'runtimeSubstitutionReady' => true,
				'extensions' => [ 'KHR_draco_mesh_compression' ],
				'textureImageCount' => 0,
			]
		);
	}
	$GLOBALS['vrodos_desktop_test_meta'][ $asset_id ][ VRodos_Desktop_Profile_Test_Harness::META_KEY ] = [
		'schemaVersion' => 2,
		'derivatives' => [ $profile => $record ],
		'webVariants' => [ $job_key => $record ],
		'webProfileDefaults' => [ $profile => $job_key ],
	];
	return $job_key;
}

$test_dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'vrodos-desktop-profile-' . bin2hex( random_bytes( 6 ) );
mkdir( $test_dir, 0777, true );
$source_path = $test_dir . DIRECTORY_SEPARATOR . 'source.glb';
$progress_path = $test_dir . DIRECTORY_SEPARATOR . 'source.web-high.progress.json';
$log_path = $test_dir . DIRECTORY_SEPARATOR . 'test.log';
file_put_contents( $source_path, 'desktop-profile-source' );
ini_set( 'log_errors', '1' );
ini_set( 'error_log', $log_path );

$asset_id = 44;
$profile = 'web-high';
$source = [
	'url'  => '/private/source.glb',
	'path' => $source_path,
	'sizeBytes' => 101 * 1024 * 1024,
	'sha256' => hash_file( 'sha256', $source_path ),
	'generation' => 1,
];
$options = [
	'protectGeometry' => true,
	'textureMaxSize'  => 4096,
	'pipelineVersion' => 4,
	'recipe'          => 'web-high',
];
$GLOBALS['vrodos_desktop_test_source'] = $source;
$GLOBALS['vrodos_desktop_test_progress_path'] = $progress_path;

$job_key = seed_desktop_profile_record( $asset_id, $profile, 'queued', $source, $options, gmdate( 'Y-m-d H:i:s', time() - 60 ) );
$result = VRodos_Desktop_Profile_Test_Harness::ensure_derivative( $asset_id, $profile, $source, $options );
vrodos_desktop_assert( true === $result, 'a matching queued record should remain recoverable' );
vrodos_desktop_assert( 1 === count( $GLOBALS['vrodos_desktop_test_events'] ), 'a matching queued record must recreate its missing cron event' );

VRodos_Desktop_Profile_Test_Harness::ensure_derivative( $asset_id, $profile, $source, $options );
vrodos_desktop_assert( 1 === count( $GLOBALS['vrodos_desktop_test_events'] ), 'an existing cron event must not be duplicated' );
vrodos_desktop_assert( 1 === substr_count( (string) file_get_contents( $log_path ), 'Recovered missing desktop profile cron job' ), 'lost-job recovery should be logged once' );

$GLOBALS['vrodos_desktop_test_events'] = [];
$job_key = seed_desktop_profile_record( $asset_id, $profile, 'queued', $source, $options, gmdate( 'Y-m-d H:i:s', time() - 60 ) );
$queued_record = invoke_desktop_profile_method( 'desktop_profile_record_by_job_key', [ $asset_id, $job_key ] );
$queued_args = invoke_desktop_profile_method( 'desktop_profile_cron_args', [ $asset_id, $profile, $queued_record['profileOptions'] ] );
wp_schedule_single_event( time() + 600, VRodos_Desktop_Profile_Test_Harness::DESKTOP_PROFILE_CRON_HOOK, $queued_args );
VRodos_Desktop_Profile_Test_Harness::ensure_derivative( $asset_id, $profile, $source, array_merge( $options, [ 'queuePriority' => 'build' ] ) );
$prioritized_record = invoke_desktop_profile_method( 'desktop_profile_record_by_job_key', [ $asset_id, $job_key ] );
vrodos_desktop_assert( 1 === (int) array_values( $GLOBALS['vrodos_desktop_test_events'] )[0], 'an active build must promote its matching queued derivative ahead of background cron work' );
vrodos_desktop_assert( 'build' === (string) ( $prioritized_record['profileOptions']['queuePriority'] ?? '' ), 'build priority must remain attached to the queued derivative family' );

$GLOBALS['vrodos_desktop_test_events'] = [];
seed_desktop_profile_record( $asset_id, $profile, 'running', $source, $options, gmdate( 'Y-m-d H:i:s', time() - 60 ) );
VRodos_Desktop_Profile_Test_Harness::ensure_derivative( $asset_id, $profile, $source, $options );
vrodos_desktop_assert( 0 === count( $GLOBALS['vrodos_desktop_test_events'] ), 'a recently updated running job must not be requeued' );

$GLOBALS['vrodos_desktop_test_events'] = [];
seed_desktop_profile_record( $asset_id, $profile, 'running', $source, $options, gmdate( 'Y-m-d H:i:s' ) );
$replacement_source = array_merge( $source, [ 'generation' => 2 ] );
$GLOBALS['vrodos_desktop_test_source'] = $replacement_source;
VRodos_Desktop_Profile_Test_Harness::ensure_derivative( $asset_id, $profile, $replacement_source, $options );
$replacement_record = $GLOBALS['vrodos_desktop_test_meta'][ $asset_id ][ VRodos_Desktop_Profile_Test_Harness::META_KEY ]['webVariants'][ $job_key ];
vrodos_desktop_assert( 'queued' === $replacement_record['status'], 'same-content attachment replacement must not join work owned by the obsolete source generation' );
vrodos_desktop_assert( 2 === $replacement_record['sourceGeneration'] && 2 === (int) ( $replacement_record['cronArgs'][5] ?? 0 ), 'replacement work must persist and schedule the active source generation' );
vrodos_desktop_assert( 1 === count( $GLOBALS['vrodos_desktop_test_events'] ), 'same-content attachment replacement must schedule one current-generation job' );
$GLOBALS['vrodos_desktop_test_source'] = $source;
$GLOBALS['vrodos_desktop_test_events'] = [];

seed_desktop_profile_record( $asset_id, $profile, 'running', $source, $options, gmdate( 'Y-m-d H:i:s', time() - 900 ) );
file_put_contents(
	$progress_path,
	json_encode(
		[
			'schemaVersion' => 1,
			'profile'       => $profile,
			'jobKey'        => $job_key,
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
VRodos_Desktop_Profile_Test_Harness::ensure_derivative( $asset_id, $profile, $source, $options );
vrodos_desktop_assert( 0 === count( $GLOBALS['vrodos_desktop_test_events'] ), 'recent progress-file activity must keep a running job active' );

unlink( $progress_path );
VRodos_Desktop_Profile_Test_Harness::ensure_derivative( $asset_id, $profile, $source, $options );
$recovered = $GLOBALS['vrodos_desktop_test_meta'][ $asset_id ][ VRodos_Desktop_Profile_Test_Harness::META_KEY ]['webVariants'][ $job_key ];
vrodos_desktop_assert( 'queued' === $recovered['status'], 'a stale running job must return to the queue' );
vrodos_desktop_assert( 1 === count( $GLOBALS['vrodos_desktop_test_events'] ), 'a stale running job must schedule a replacement event' );
vrodos_desktop_assert( str_contains( (string) file_get_contents( $log_path ), 'Requeued stale desktop profile job' ), 'stale-job recovery should be logged' );

$GLOBALS['vrodos_desktop_test_events'] = [];
$GLOBALS['vrodos_desktop_test_schedule_failure'] = true;
seed_desktop_profile_record( $asset_id, $profile, 'queued', $source, $options, gmdate( 'Y-m-d H:i:s' ) );
$failed = VRodos_Desktop_Profile_Test_Harness::ensure_derivative( $asset_id, $profile, $source, $options );
$failed_record = $GLOBALS['vrodos_desktop_test_meta'][ $asset_id ][ VRodos_Desktop_Profile_Test_Harness::META_KEY ]['webVariants'][ $job_key ];
vrodos_desktop_assert( is_wp_error( $failed ), 'scheduler rejection must be returned to the compiler' );
vrodos_desktop_assert( 'failed' === $failed_record['status'] && ! empty( $failed_record['failedAt'] ), 'scheduler rejection must persist a failed profile state' );
vrodos_desktop_assert( str_contains( (string) file_get_contents( $log_path ), 'Failed to schedule desktop profile job' ), 'scheduler rejection should be logged' );
$GLOBALS['vrodos_desktop_test_schedule_failure'] = false;
$GLOBALS['vrodos_desktop_test_events'] = [];
$failed_repeat = VRodos_Desktop_Profile_Test_Harness::ensure_derivative( $asset_id, $profile, $source, $options );
vrodos_desktop_assert( is_wp_error( $failed_repeat ), 'a failed immutable job must require an explicit regeneration attempt' );
vrodos_desktop_assert( 0 === count( $GLOBALS['vrodos_desktop_test_events'] ), 'Build and status checks must not silently retry a failed job' );

vrodos_desktop_assert( 'web-low' === invoke_desktop_profile_method( 'runtime_derivative_profile_for_slot', [ 'headset', 'headset', [] ] ), 'standalone headset must select Web Low' );
vrodos_desktop_assert( 'web-high' === invoke_desktop_profile_method( 'runtime_derivative_profile_for_slot', [ 'pc-rendered-vr', 'pc-rendered-vr', [] ] ), 'PC-rendered VR must select Web High' );
vrodos_desktop_assert( 'web-medium' === invoke_desktop_profile_method( 'runtime_derivative_profile_for_slot', [ 'medium', 'desktop', [ 'profiles' => [ 'medium' => [ 'assets' => [ 'profile' => 'web-medium' ] ] ] ] ] ), 'desktop Medium must select Web Medium' );

$GLOBALS['vrodos_desktop_test_schedule_failure'] = false;
$GLOBALS['vrodos_desktop_test_events'] = [];
$small_source = array_merge( $source, [ 'sizeBytes' => 19 * 1024 * 1024 ] );
$small_analysis = [ 'counts' => [ 'images' => 1 ], 'payload' => [ 'estimatedImageBytes' => 7 * 1024 * 1024 ], 'extensions' => [ 'hasTextureCompression' => false ] ];
vrodos_desktop_assert( false === VRodos_Desktop_Profile_Test_Harness::maybe_queue_web_high( 55, $small_source, $small_analysis ), 'assets below both automatic thresholds must not queue' );
$large_analysis = array_merge( $small_analysis, [ 'payload' => [ 'estimatedImageBytes' => 8 * 1024 * 1024 ] ] );
vrodos_desktop_assert( true === VRodos_Desktop_Profile_Test_Harness::maybe_queue_web_high( 55, $small_source, $large_analysis ), '8 MiB of embedded uncompressed textures must queue Web High' );
VRodos_Desktop_Profile_Test_Harness::maybe_queue_web_high( 55, $small_source, $large_analysis );
vrodos_desktop_assert( 1 === count( $GLOBALS['vrodos_desktop_test_events'] ), 'automatic optimization queueing must be idempotent' );
$auto_record = invoke_desktop_profile_method( 'desktop_profile_record', [ 55, 'web-high' ] );
vrodos_desktop_assert( 1 === $auto_record['attempts'] && ! empty( $auto_record['queuedAt'] ), 'an idempotent queued job must retain one attempt and its original queue timestamp' );

$medium_options = [
	'protectGeometry' => true,
	'textureMaxSize'  => 2048,
	'pipelineVersion' => 4,
	'recipe'          => 'web-medium',
];
$low_options = array_merge( $medium_options, [ 'textureMaxSize' => 1024, 'recipe' => 'web-low' ] );
$medium_key = invoke_desktop_profile_method( 'desktop_profile_job_key', [ $source, 'web-medium', $medium_options ] );
$low_key = invoke_desktop_profile_method( 'desktop_profile_job_key', [ $source, 'web-low', $low_options ] );
vrodos_desktop_assert( $medium_key !== $low_key, 'profile identity must distinguish recipe and texture cap' );
vrodos_desktop_assert(
	$job_key === invoke_desktop_profile_method( 'desktop_profile_job_key', [ $source, 'web-high', array_merge( $options, [ 'protectGeometry' => false ] ) ] ),
	'Web High must canonicalize geometry protection so upload and Build join the same job'
);
vrodos_desktop_assert(
	$medium_key !== invoke_desktop_profile_method( 'desktop_profile_job_key', [ $source, 'web-medium', array_merge( $medium_options, [ 'protectGeometry' => false ] ) ] ),
	'profile identity must distinguish geometry protection'
);

$standard_key = seed_desktop_profile_record( 77, 'web-medium', 'ready', $source, $medium_options, gmdate( 'Y-m-d H:i:s' ) );
$custom_path = $test_dir . DIRECTORY_SEPARATOR . 'custom-medium.glb';
file_put_contents( $custom_path, 'custom-medium' );
$custom_options = array_merge( $medium_options, [ 'textureMaxSize' => 1536 ] );
$custom_key = invoke_desktop_profile_method( 'desktop_profile_job_key', [ $source, 'web-medium', $custom_options ] );
$custom_record = $GLOBALS['vrodos_desktop_test_meta'][77][ VRodos_Desktop_Profile_Test_Harness::META_KEY ]['webVariants'][ $standard_key ];
$custom_record['jobKey'] = $custom_key;
$custom_record['path'] = $custom_path;
$custom_record['profileOptions'] = array_merge( $custom_options, [ 'jobKey' => $custom_key, 'sourceSha256' => $source['sha256'], 'sourceGeneration' => $source['generation'] ] );
$GLOBALS['vrodos_desktop_test_meta'][77][ VRodos_Desktop_Profile_Test_Harness::META_KEY ]['webVariants'][ $custom_key ] = $custom_record;
invoke_desktop_profile_method( 'activate_desktop_profile_variant', [ 77, 'web-medium', $custom_key ] );
vrodos_desktop_assert(
	$standard_key === $GLOBALS['vrodos_desktop_test_meta'][77][ VRodos_Desktop_Profile_Test_Harness::META_KEY ]['webProfileDefaults']['web-medium'],
	'a scene-specific texture cap must not overwrite the standard profile derivative'
);
vrodos_desktop_assert(
	$custom_path === VRodos_Desktop_Profile_Test_Harness::runtime_profile_derivative_path( 77, 'web-medium', $custom_options ),
	'the compiler must resolve the immutable scene-specific profile variant directly'
);

$GLOBALS['vrodos_desktop_test_events'] = [];
$family_high_options = array_merge( $options, [ 'familySequence' => true ] );
seed_desktop_profile_record( $asset_id, 'web-high', 'ready', $source, $family_high_options, gmdate( 'Y-m-d H:i:s' ) );
VRodos_Desktop_Profile_Test_Harness::ensure_derivative( $asset_id, 'web-high', $source, $family_high_options );
vrodos_desktop_assert( 1 === count( $GLOBALS['vrodos_desktop_test_events'] ), 'a ready High derivative must queue only the editor preview next' );
$family_event_key = (string) array_key_first( $GLOBALS['vrodos_desktop_test_events'] );
vrodos_desktop_assert( str_contains( $family_event_key, 'vrodos_asset_editor_preview_process_job' ) && ! str_contains( $family_event_key, 'web-medium' ), 'family ordering must remain High, then editor preview' );
$GLOBALS['vrodos_desktop_test_events'] = [];
$GLOBALS['vrodos_desktop_test_meta'][ $asset_id ][ VRodos_Desktop_Profile_Test_Harness::META_KEY ]['derivatives']['editor-preview'] = [ 'status' => 'ready' ];
invoke_desktop_profile_method( 'continue_web_family_after_editor_preview', [ $asset_id, $source ] );
vrodos_desktop_assert( 1 === count( $GLOBALS['vrodos_desktop_test_events'] ), 'a terminal editor preview must queue only Medium next' );
$family_event_key = (string) array_key_first( $GLOBALS['vrodos_desktop_test_events'] );
vrodos_desktop_assert( str_contains( $family_event_key, 'web-medium' ) && ! str_contains( $family_event_key, 'web-low' ), 'family ordering must continue Preview, then Medium, then Low' );

$GLOBALS['vrodos_desktop_test_meta'][ $asset_id ][ VRodos_Desktop_Profile_Test_Harness::META_KEY ]['derivatives']['editor-preview'] = [
	'status'  => 'queued',
	'message' => 'Editor preview is queued for generation.',
];
$family_state = VRodos_Desktop_Profile_Test_Harness::get_web_optimization_state( $asset_id );
vrodos_desktop_assert( 'queued' === $family_state['familyStatus'], 'family status must remain active while the editor preview stage is queued' );
vrodos_desktop_assert( 'editor-preview' === $family_state['activeProfile'], 'family progress must identify editor preview as the active stage after High' );
vrodos_desktop_assert( 'queued' === $family_state['editorPreview']['status'], 'the import-status payload must expose editor preview state' );
vrodos_desktop_assert( 25 === $family_state['familyPercent'], 'family progress must include the editor preview stage between High and Medium' );

$GLOBALS['vrodos_desktop_test_events'] = [];
$regenerate_key = seed_desktop_profile_record( 66, 'web-high', 'ready', $source, $options, gmdate( 'Y-m-d H:i:s' ) );
$GLOBALS['vrodos_desktop_test_meta'][ 66 ][ VRodos_Desktop_Profile_Test_Harness::META_KEY ]['webVariants'][ $regenerate_key ]['attempts'] = 1;
VRodos_Desktop_Profile_Test_Harness::ensure_derivative( 66, 'web-high', $source, $options, true );
$regenerated = $GLOBALS['vrodos_desktop_test_meta'][ 66 ][ VRodos_Desktop_Profile_Test_Harness::META_KEY ]['webVariants'][ $regenerate_key ];
vrodos_desktop_assert( 'queued' === $regenerated['status'] && 2 === $regenerated['attempts'], 'only explicit regeneration of a ready job must create its next attempt' );

$GLOBALS['vrodos_desktop_test_events'] = [];
$ordered_plan = new VRodos_Project_Compile_Plan();
$ordered_plan->request = (object) [ 'vr_runtime_profile' => 'headset' ];
$ordered_plan->scenes = [
	(object) [
		'scene_id' => 46,
		'scene_json' => (object) [ 'asset_id' => 89 ],
		'desktop_profiles' => [],
	],
];
$ordered_compile_state = VRodos_Desktop_Profile_Test_Harness::prepare_runtime_profile_derivatives( $ordered_plan );
vrodos_desktop_assert( 'pending' === $ordered_compile_state['status'], 'a Low build must wait for the ordered derivative family' );
vrodos_desktop_assert( 1 === count( $GLOBALS['vrodos_desktop_test_events'] ), 'Build must schedule only one family job for an unoptimized qualifying asset' );
$ordered_event_key = (string) array_key_first( $GLOBALS['vrodos_desktop_test_events'] );
vrodos_desktop_assert( str_contains( $ordered_event_key, 'web-high' ) && ! str_contains( $ordered_event_key, 'web-low' ), 'Build must not bypass High and queue Low directly' );
vrodos_desktop_assert( 1 === (int) array_values( $GLOBALS['vrodos_desktop_test_events'] )[0], 'the first derivative required by a build must enter the priority cron lane' );

$family_progress_asset_id = 90;
$family_progress_options = array_merge( $family_high_options, [ 'queuePriority' => 'build' ] );
seed_desktop_profile_record( $family_progress_asset_id, 'web-high', 'ready', $source, $family_progress_options, gmdate( 'Y-m-d H:i:s' ) );
$GLOBALS['vrodos_desktop_test_meta'][ $family_progress_asset_id ][ VRodos_Desktop_Profile_Test_Harness::META_KEY ]['derivatives']['editor-preview'] = [
	'status'            => 'queued',
	'message'           => 'Editor preview is queued for generation.',
	'sourceFingerprint' => sha1( $source['path'] . ':' . $source['sizeBytes'] ),
	'queuePriority'     => 'build',
];
$family_progress_plan = new VRodos_Project_Compile_Plan();
$family_progress_plan->request = (object) [ 'vr_runtime_profile' => 'headset' ];
$family_progress_plan->scenes = [
	(object) [
		'scene_id' => 47,
		'scene_json' => (object) [ 'asset_id' => $family_progress_asset_id ],
		'desktop_profiles' => [],
	],
];
$family_progress_state = VRodos_Desktop_Profile_Test_Harness::prepare_runtime_profile_derivatives( $family_progress_plan );
vrodos_desktop_assert( 25 === $family_progress_state['profiles'][0]['percent'], 'headset build progress must include completed intermediate family stages' );
vrodos_desktop_assert( '' === $family_progress_state['profiles'][0]['message'], 'family progress rows must stay compact instead of repeating internal stage descriptions' );
vrodos_desktop_assert( 25 === $family_progress_state['percent'], 'overall build progress must advance before Web Low becomes ready' );

$GLOBALS['vrodos_desktop_test_events'] = [];
$GLOBALS['vrodos_desktop_test_schedule_failure'] = true;

$plan = new VRodos_Project_Compile_Plan();
$plan->request = (object) [ 'vr_runtime_profile' => 'desktop' ];
$plan->scenes = [
	(object) [
		'scene_id'        => 45,
		'scene_json'      => (object) [ 'asset_id' => 88 ],
		'desktop_profiles' => [
			'buildMode' => 'custom',
			'profiles'  => [ 'custom' => [ 'assets' => array_merge( $options, [ 'profile' => 'web-high' ] ) ] ],
		],
	],
];
$compile_state = VRodos_Desktop_Profile_Test_Harness::prepare_runtime_profile_derivatives( $plan );
vrodos_desktop_assert( 'failed' === $compile_state['status'], 'scheduler rejection must propagate as a failed compiler preflight' );
vrodos_desktop_assert( str_contains( $compile_state['message'], 'test scheduler rejected' ), 'compiler failure should retain the scheduler error' );

wp_delete_file( $source_path );
wp_delete_file( $log_path );
wp_delete_file( $custom_path );
rmdir( $test_dir );

echo "Desktop profile pipeline tests passed.\n";
