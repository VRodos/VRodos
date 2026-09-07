<?php

declare(strict_types=1);

define( 'ABSPATH', __DIR__ . DIRECTORY_SEPARATOR );

$GLOBALS['vrodos_test_meta'] = [];
$GLOBALS['vrodos_test_events'] = [];
$GLOBALS['vrodos_test_terms'] = [];
$GLOBALS['vrodos_test_attached_files'] = [];

class WP_Error {
	public function __construct( private string $code, private string $message ) {}
	public function get_error_message(): string {
		return $this->message;
	}
}

function vrodos_preview_assert( bool $condition, string $message ): void {
	if ( ! $condition ) {
		fwrite( STDERR, "Editor preview pipeline test failed: {$message}\n" );
		exit( 1 );
	}
}

function absint( $value ): int {
	return abs( (int) $value );
}

function current_time( string $type, bool $gmt = false ): string {
	return gmdate( 'Y-m-d H:i:s' );
}

function get_post_meta( int $post_id, string $key, bool $single = false ) {
	return $GLOBALS['vrodos_test_meta'][ $post_id ][ $key ] ?? '';
}

function update_post_meta( int $post_id, string $key, $value ) {
	$GLOBALS['vrodos_test_meta'][ $post_id ][ $key ] = $value;
	return true;
}

function wp_parse_args( $args, $defaults = [] ): array {
	return array_merge( (array) $defaults, (array) $args );
}

function wp_next_scheduled( string $hook, array $args = [] ) {
	$key = $hook . ':' . implode( ',', $args );
	return $GLOBALS['vrodos_test_events'][ $key ] ?? false;
}

function wp_schedule_single_event( int $timestamp, string $hook, array $args = [] ): bool {
	$key = $hook . ':' . implode( ',', $args );
	$GLOBALS['vrodos_test_events'][ $key ] = $timestamp;
	return true;
}

function is_wp_error( $value ): bool {
	return $value instanceof WP_Error;
}

function wp_normalize_path( string $path ): string {
	return str_replace( '\\', '/', $path );
}

function esc_url_raw( string $url ): string {
	return $url;
}

function wp_get_post_terms( int $post_id, string $taxonomy, array $args = [] ) {
	return $GLOBALS['vrodos_test_terms'][ $post_id ] ?? [];
}

function sanitize_title( string $value ): string {
	return strtolower( trim( preg_replace( '/[^a-z0-9-]+/i', '-', $value ), '-' ) );
}

function get_attached_file( int $attachment_id, bool $unfiltered = false ) {
	return $GLOBALS['vrodos_test_attached_files'][ $attachment_id ] ?? false;
}

class VRodos_Storage_Manager {
	public static int $next_attachment_id = 501;
	public static array $registered = [];
	public static array $deleted = [];

	public static function register_existing_private_attachment( string $path, string $mime, int $owner_id, string $owner_type, string $role, string $profile = '' ) {
		$id = self::$next_attachment_id++;
		self::$registered[] = compact( 'id', 'path', 'mime', 'owner_id', 'owner_type', 'role', 'profile' );
		$GLOBALS['vrodos_test_attached_files'][ $id ] = $path;
		return $id;
	}

	public static function authoring_url_for_attachment( int $attachment_id, string $image_size = '' ): string {
		return '/wp-admin/admin-ajax.php?action=vrodos_private_media&id=' . $attachment_id;
	}

	public static function attachment_is_owned_by( int $attachment_id, string $owner_type, int $owner_id ): bool {
		return isset( $GLOBALS['vrodos_test_attached_files'][ $attachment_id ] );
	}

	public static function delete_attachment_if_owned_by( int $attachment_id, string $owner_type, int $owner_id ): bool {
		self::$deleted[] = $attachment_id;
		unset( $GLOBALS['vrodos_test_attached_files'][ $attachment_id ] );
		return true;
	}
}

require_once dirname( __DIR__ ) . '/includes/asset-optimization/trait-vrodos-asset-optimization-editor-preview.php';

class VRodos_Editor_Preview_Test_Harness {
	use VRodos_Asset_Optimization_Editor_Preview;

	public const META_KEY = '_vrodos_asset3d_glb_derivatives';
	private const EDITOR_PREVIEW_PROFILE = 'editor-preview';
	private const EDITOR_PREVIEW_CRON_HOOK = 'vrodos_asset_editor_preview_process_job';
	private const EDITOR_PREVIEW_QUEUE_DELAY_SECONDS = 10;
	private const EDITOR_PREVIEW_JOB_TIMEOUT_SECONDS = 900;
	private const EDITOR_PREVIEW_FILE_THRESHOLD_BYTES = 10485760;
	private const EDITOR_PREVIEW_TRIANGLE_THRESHOLD = 500000;
	private const EDITOR_PREVIEW_PRIMITIVE_THRESHOLD = 200;
	private const EDITOR_PREVIEW_MATERIAL_THRESHOLD = 80;
	private const EDITOR_PREVIEW_IMAGE_BYTE_THRESHOLD = 50331648;

	private static function get_derivative_meta( int $asset_id ): array {
		$meta = get_post_meta( $asset_id, self::META_KEY, true );
		return is_array( $meta ) ? $meta : [ 'derivatives' => [] ];
	}

	private static function source_fingerprint( array $source ): string {
		return sha1( (string) ( $source['path'] ?? '' ) . ':' . (string) ( $source['sizeBytes'] ?? 0 ) );
	}
}

function invoke_preview_method( string $name, array $arguments = [] ) {
	$method = new ReflectionMethod( VRodos_Editor_Preview_Test_Harness::class, $name );
	$method->setAccessible( true );
	return $method->isStatic()
		? $method->invokeArgs( null, $arguments )
		: $method->invokeArgs( new VRodos_Editor_Preview_Test_Harness(), $arguments );
}

$asset_id = 44;
$source = [
	'url'          => '/source.glb',
	'path'         => '/private/source.glb',
	'sizeBytes'    => 80 * 1024 * 1024,
	'attachmentId' => 99,
];
$analysis = [ 'geometry' => [ 'estimatedTriangles' => 700000 ] ];
$result = [
	'record' => [
		'sourceSizeBytes'     => $source['sizeBytes'],
		'derivativeSizeBytes' => 8 * 1024 * 1024,
		'reductionBytes'      => 72 * 1024 * 1024,
		'reductionPercent'    => 90,
	],
	'paths' => [
		'file'     => '/private/editor.glb',
		'manifest' => '/private/editor.manifest.json',
	],
];

invoke_preview_method( 'store_editor_preview_derivative_record', [ $asset_id, $result, $source, $analysis ] );
$stored = $GLOBALS['vrodos_test_meta'][ $asset_id ][ VRodos_Editor_Preview_Test_Harness::META_KEY ]['derivatives']['editor-preview'];
vrodos_preview_assert( 501 === $stored['attachmentId'], 'generated previews must be registered as owned attachments' );
vrodos_preview_assert( str_contains( $stored['url'], 'id=501' ), 'ready previews must use an authenticated authoring URL' );
vrodos_preview_assert( 'ready' === $stored['status'] && false === $stored['compileEnabled'], 'previews must remain editor-only' );
vrodos_preview_assert( ! empty( $stored['sourceFingerprint'] ) && ! empty( $stored['createdAt'] ) && ! empty( $stored['completedAt'] ) && ! empty( $stored['updatedAt'] ), 'ready records must contain fingerprints and lifecycle timestamps' );

invoke_preview_method( 'store_editor_preview_derivative_record', [ $asset_id, $result, $source, $analysis ] );
vrodos_preview_assert( 1 === count( VRodos_Storage_Manager::$registered ), 'regeneration at the same private path must reuse its owned attachment' );
vrodos_preview_assert( [] === VRodos_Storage_Manager::$deleted, 'same-path regeneration must not delete the active GLB' );

$replacement = $result;
$replacement['paths']['file'] = '/private/editor-v2.glb';
invoke_preview_method( 'store_editor_preview_derivative_record', [ $asset_id, $replacement, $source, $analysis ] );
$stored = $GLOBALS['vrodos_test_meta'][ $asset_id ][ VRodos_Editor_Preview_Test_Harness::META_KEY ]['derivatives']['editor-preview'];
vrodos_preview_assert( 502 === $stored['attachmentId'] && [ 501 ] === VRodos_Storage_Manager::$deleted, 'replacement must retire the previous owned attachment after publication' );

$fingerprint = sha1( $source['path'] . ':' . $source['sizeBytes'] );
$GLOBALS['vrodos_test_meta'][ $asset_id ][ VRodos_Editor_Preview_Test_Harness::META_KEY ]['derivatives']['editor-preview'] = [
	'status'            => 'queued',
	'sourceFingerprint' => $fingerprint,
];
$GLOBALS['vrodos_test_events'] = [];
invoke_preview_method( 'maybe_queue_editor_preview', [ $asset_id, $source, $analysis, [ 'shouldPreview' => true, 'reasons' => [ 'source-size' ] ] ] );
vrodos_preview_assert( 1 === count( $GLOBALS['vrodos_test_events'] ), 'a queued record with a missing cron event must repair its schedule' );

$GLOBALS['vrodos_test_meta'][ $asset_id ][ VRodos_Editor_Preview_Test_Harness::META_KEY ]['derivatives']['editor-preview'] = [
	'status'            => 'running',
	'sourceFingerprint' => $fingerprint,
	'updatedAt'         => gmdate( 'Y-m-d H:i:s', time() - 1800 ),
];
$GLOBALS['vrodos_test_events'] = [];
invoke_preview_method( 'maybe_queue_editor_preview', [ $asset_id, $source, $analysis, [ 'shouldPreview' => true, 'reasons' => [ 'source-size' ] ] ] );
$recovered = $GLOBALS['vrodos_test_meta'][ $asset_id ][ VRodos_Editor_Preview_Test_Harness::META_KEY ]['derivatives']['editor-preview'];
vrodos_preview_assert( 'queued' === $recovered['status'] && 1 === $recovered['retryCount'], 'stale running jobs must return to the queue with a retry count' );
vrodos_preview_assert( 1 === count( $GLOBALS['vrodos_test_events'] ), 'stale running jobs must schedule their retry' );

$GLOBALS['vrodos_test_terms'][ $asset_id ] = [ 'walkable-surface' ];
vrodos_preview_assert( true === invoke_preview_method( 'editor_preview_protects_geometry', [ $asset_id ] ), 'walkable assets must protect their geometry' );
$GLOBALS['vrodos_test_terms'][ $asset_id ] = [ 'decoration' ];
vrodos_preview_assert( false === invoke_preview_method( 'editor_preview_protects_geometry', [ $asset_id ] ), 'ordinary decoration assets may use preview simplification' );

$decision = invoke_preview_method( 'editor_preview_decision', [ 10 * 1024 * 1024, [] ] );
vrodos_preview_assert( true === $decision['shouldPreview'] && in_array( 'source-size', $decision['reasons'], true ), 'the preview size threshold must be 10 MiB' );

echo "Editor preview pipeline tests passed.\n";
