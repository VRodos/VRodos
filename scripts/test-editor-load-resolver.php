<?php

declare(strict_types=1);

define( 'ABSPATH', __DIR__ . DIRECTORY_SEPARATOR );

$GLOBALS['vrodos_editor_load_source'] = [];
$GLOBALS['vrodos_editor_load_preview'] = [];
$GLOBALS['vrodos_editor_load_preview_record'] = [];
$GLOBALS['vrodos_editor_load_web'] = [];
$GLOBALS['vrodos_editor_load_allowed'] = true;
$GLOBALS['vrodos_editor_load_post_type'] = 'vrodos_asset3d';
$GLOBALS['vrodos_editor_load_protected'] = false;
$GLOBALS['vrodos_editor_load_editable'] = true;

class WP_Error {
	public function __construct( private string $code, private string $message ) {}
	public function get_error_message(): string {
		return $this->message;
	}
}

class VRodos_Immerse_Access_Manager {
	public static function can_read_asset( int $asset_id ): bool {
		return $asset_id > 0 && $GLOBALS['vrodos_editor_load_allowed'];
	}
}

class VRodos_Storage_Manager {
	public static function attachment_is_owned_by( int $attachment_id, string $owner_type, int $owner_id ): bool {
		return $attachment_id > 0 && 'asset' === $owner_type && $owner_id > 0;
	}
	public static function authoring_url_for_attachment( int $attachment_id, string $image_size = '' ): string {
		return '/private/' . $attachment_id . '.glb';
	}
}

function absint( $value ): int {
	return abs( (int) $value );
}

function sanitize_key( string $value ): string {
	return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( $value ) ) ?? '';
}

function get_post_type( int $post_id ): string {
	return $post_id > 0 ? $GLOBALS['vrodos_editor_load_post_type'] : '';
}

function is_wp_error( $value ): bool {
	return $value instanceof WP_Error;
}

function current_user_can( string $capability, int $post_id ): bool {
	return 'edit_post' === $capability && $post_id > 0 && $GLOBALS['vrodos_editor_load_editable'];
}

function vrodos_editor_load_assert( bool $condition, string $message ): void {
	if ( ! $condition ) {
		fwrite( STDERR, "Editor load resolver test failed: {$message}\n" );
		exit( 1 );
	}
}

require_once dirname( __DIR__ ) . '/includes/asset-optimization/trait-vrodos-asset-optimization-editor-load.php';

final class VRodos_Editor_Load_Test_Harness {
	use VRodos_Asset_Optimization_Editor_Load;

	private const EDITOR_PREVIEW_PROFILE = 'editor-preview';
	private const WEB_FAMILY_PROFILES = [ 'web-high', 'web-medium', 'web-low' ];

	private static function get_source_glb( int $asset_id ) {
		return $asset_id > 0 ? $GLOBALS['vrodos_editor_load_source'] : new WP_Error( 'missing', 'Missing source.' );
	}

	private static function get_editor_preview_asset_state( int $asset_id ): array {
		return $GLOBALS['vrodos_editor_load_preview'];
	}

	private static function get_editor_preview_record( int $asset_id ): array {
		return $GLOBALS['vrodos_editor_load_preview_record'];
	}

	private static function editor_preview_protects_geometry( int $asset_id ): bool {
		return $GLOBALS['vrodos_editor_load_protected'];
	}

	private static function desktop_profile_record( int $asset_id, string $profile, array $source = [], array $options = [] ): array {
		return $GLOBALS['vrodos_editor_load_web'][ $profile ] ?? [];
	}

	private static function desktop_profile_record_is_ready( array $record, array $source, string $profile, array $options ): bool {
		return 'ready' === ( $record['status'] ?? '' ) && ! empty( $record['path'] ) && is_file( (string) $record['path'] );
	}
}

$test_dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'vrodos-editor-load-' . bin2hex( random_bytes( 5 ) );
mkdir( $test_dir, 0777, true );
$source_path = $test_dir . DIRECTORY_SEPARATOR . 'source.glb';
$preview_path = $test_dir . DIRECTORY_SEPARATOR . 'preview.glb';
$medium_path = $test_dir . DIRECTORY_SEPARATOR . 'medium.glb';
$low_path = $test_dir . DIRECTORY_SEPARATOR . 'low.glb';
file_put_contents( $source_path, 'source' );
file_put_contents( $preview_path, 'preview' );
file_put_contents( $medium_path, 'medium' );
file_put_contents( $low_path, 'low' );

$GLOBALS['vrodos_editor_load_source'] = [
	'url' => '/private/source.glb',
	'path' => $source_path,
	'sizeBytes' => 200 * 1024 * 1024,
];
$GLOBALS['vrodos_editor_load_preview'] = [
	'status' => 'ready',
	'url' => '/private/preview.glb',
	'shouldPreview' => true,
];
$GLOBALS['vrodos_editor_load_preview_record'] = [
	'status' => 'ready',
	'path' => $preview_path,
	'derivativeSizeBytes' => 8 * 1024 * 1024,
];
$state = VRodos_Editor_Load_Test_Harness::resolve_editor_glb_load( 7 );
vrodos_editor_load_assert( 'editor-preview' === $state['loadVariant'] && '/private/preview.glb' === $state['loadUrl'], 'a ready editor preview must be selected first' );
vrodos_editor_load_assert( $state['reductionPercent'] >= 95, 'the resolver must report preview byte reduction' );

$GLOBALS['vrodos_editor_load_preview'] = [ 'status' => 'running', 'message' => 'Working.', 'shouldPreview' => true ];
$GLOBALS['vrodos_editor_load_preview_record'] = [];
$GLOBALS['vrodos_editor_load_web'] = [];
$state = VRodos_Editor_Load_Test_Harness::resolve_editor_glb_load( 7 );
vrodos_editor_load_assert( 'pending' === $state['status'] && '' === $state['loadUrl'], 'a qualifying large source must not load automatically while optimization is pending' );
vrodos_editor_load_assert( true === $state['canLoadSource'], 'the original source must remain an explicit action' );

$GLOBALS['vrodos_editor_load_web'] = [
	'web-medium' => [
		'status' => 'ready', 'path' => $medium_path, 'attachmentId' => 21,
		'derivativeSizeBytes' => 30 * 1024 * 1024, 'profileOptions' => [ 'protectGeometry' => false ],
	],
	'web-low' => [
		'status' => 'ready', 'path' => $low_path, 'attachmentId' => 22,
		'derivativeSizeBytes' => 35 * 1024 * 1024, 'profileOptions' => [ 'protectGeometry' => false ],
	],
];
$state = VRodos_Editor_Load_Test_Harness::resolve_editor_glb_load( 7 );
vrodos_editor_load_assert( 'web-medium' === $state['loadVariant'] && '/private/21.glb' === $state['loadUrl'], 'the smallest validated ready Web derivative must be selected' );

$source_state = VRodos_Editor_Load_Test_Harness::resolve_editor_glb_load( 7, true );
vrodos_editor_load_assert( 'source' === $source_state['loadVariant'] && '/private/source.glb' === $source_state['loadUrl'], 'Full Source Quality must remain explicit and exact' );

$GLOBALS['vrodos_editor_load_web'] = [];
$GLOBALS['vrodos_editor_load_preview'] = [ 'status' => 'failed', 'message' => 'Encoder failed.', 'shouldPreview' => true ];
$state = VRodos_Editor_Load_Test_Harness::resolve_editor_glb_load( 7 );
vrodos_editor_load_assert( 'failed' === $state['status'] && true === $state['canRetry'] && '' === $state['loadUrl'], 'preview failures must be actionable without silently loading a large source' );
$GLOBALS['vrodos_editor_load_editable'] = false;
$state = VRodos_Editor_Load_Test_Harness::resolve_editor_glb_load( 7 );
vrodos_editor_load_assert( false === $state['canRetry'] && true === $state['canLoadSource'], 'read-only asset users may load the source but must not be offered a retry they cannot authorize' );
$GLOBALS['vrodos_editor_load_editable'] = true;

$GLOBALS['vrodos_editor_load_preview'] = [ 'status' => 'none', 'shouldPreview' => false ];
$GLOBALS['vrodos_editor_load_source']['sizeBytes'] = 1024;
$state = VRodos_Editor_Load_Test_Harness::resolve_editor_glb_load( 7 );
vrodos_editor_load_assert( 'source' === $state['loadVariant'], 'small sources may load directly' );

$GLOBALS['vrodos_editor_load_source']['sizeBytes'] = 200 * 1024 * 1024;
$GLOBALS['vrodos_editor_load_preview'] = [ 'status' => 'stale', 'message' => 'Source changed.', 'shouldPreview' => true ];
$state = VRodos_Editor_Load_Test_Harness::resolve_editor_glb_load( 7 );
vrodos_editor_load_assert( 'pending' === $state['status'] && 'stale' === $state['previewStatus'] && '' === $state['loadUrl'], 'stale previews must not expose a replaced large source' );

$GLOBALS['vrodos_editor_load_protected'] = true;
$GLOBALS['vrodos_editor_load_preview'] = [ 'status' => 'ready', 'url' => '/private/preview.glb', 'shouldPreview' => true ];
$GLOBALS['vrodos_editor_load_preview_record'] = [
	'status' => 'ready', 'path' => $preview_path, 'derivativeSizeBytes' => 8 * 1024 * 1024,
];
$state = VRodos_Editor_Load_Test_Harness::resolve_editor_glb_load( 7 );
vrodos_editor_load_assert( true === $state['protectsGeometry'], 'walkable and collision previews must report exact protected geometry' );

$GLOBALS['vrodos_editor_load_post_type'] = '';
$state = VRodos_Editor_Load_Test_Harness::resolve_editor_glb_load( 7 );
vrodos_editor_load_assert( 'missing' === $state['status'] && '' === $state['canonicalUrl'], 'deleted assets must expose no stale authoring URL' );
$GLOBALS['vrodos_editor_load_post_type'] = 'vrodos_asset3d';

$GLOBALS['vrodos_editor_load_allowed'] = false;
$state = VRodos_Editor_Load_Test_Harness::resolve_editor_glb_load( 7 );
vrodos_editor_load_assert( 'forbidden' === $state['status'] && false === $state['canLoadSource'], 'authorization must run before any URL is returned' );

foreach ( [ $source_path, $preview_path, $medium_path, $low_path ] as $path ) {
	unlink( $path );
}
rmdir( $test_dir );

echo "Editor load resolver tests passed.\n";
