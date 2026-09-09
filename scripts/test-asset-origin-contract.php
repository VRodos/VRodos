<?php

declare(strict_types=1);

define( 'ABSPATH', __DIR__ . DIRECTORY_SEPARATOR );
define( 'DAY_IN_SECONDS', 86400 );

$GLOBALS['vrodos_asset_origin_meta'] = [];

class WP_Error {
	public function __construct( private string $message ) {}

	public function get_error_message(): string {
		return $this->message;
	}
}

class VRodos_Storage_Manager {
	public static $store_result  = 101;
	public static $switch_result = true;

	public static function store_uploaded_attachment() {
		return self::$store_result;
	}

	public static function replace_attachment_references() {
		return self::$switch_result;
	}
}

function vrodos_asset_origin_assert( bool $condition, string $message ): void {
	if ( ! $condition ) {
		fwrite( STDERR, "Asset origin contract test failed: {$message}\n" );
		exit( 1 );
	}
}

function get_post_meta( int $post_id, string $key, bool $single = false ) {
	return $GLOBALS['vrodos_asset_origin_meta'][ $post_id ][ $key ] ?? '';
}

function update_post_meta( int $post_id, string $key, $value ) {
	$GLOBALS['vrodos_asset_origin_meta'][ $post_id ][ $key ] = $value;
	return true;
}

function delete_post_meta( int $post_id, string $key ): bool {
	unset( $GLOBALS['vrodos_asset_origin_meta'][ $post_id ][ $key ] );
	return true;
}

function absint( $value ): int {
	return abs( (int) $value );
}

function sanitize_key( string $value ): string {
	return strtolower( preg_replace( '/[^a-z0-9_\-]/', '', $value ) ?? '' );
}

function sanitize_file_name( string $value ): string {
	return basename( $value );
}

function sanitize_text_field( string $value ): string {
	return trim( $value );
}

function trailingslashit( string $value ): string {
	return rtrim( $value, '/\\' ) . DIRECTORY_SEPARATOR;
}

function wp_generate_uuid4(): string {
	return '12345678-1234-4234-8234-123456789abc';
}

function wp_normalize_path( string $path ): string {
	return str_replace( '\\', '/', $path );
}

function wp_delete_file( string $path ): void {
	if ( is_file( $path ) ) {
		unlink( $path );
	}
}

function wp_unslash( $value ) {
	return $value;
}

function is_wp_error( $value ): bool {
	return $value instanceof WP_Error;
}

require_once dirname( __DIR__ ) . '/includes/class-vrodos-asset-origin.php';
require_once dirname( __DIR__ ) . '/includes/class-vrodos-upload-manager.php';
require_once dirname( __DIR__ ) . '/includes/asset-import/class-vrodos-asset-import-manager.php';

$direct_glb_json = json_encode( [ 'asset' => [ 'version' => '2.0' ] ] );
$direct_glb_json .= str_repeat( ' ', ( 4 - strlen( $direct_glb_json ) % 4 ) % 4 );
$direct_glb_path = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'vrodos-origin-direct.glb';
file_put_contents(
	$direct_glb_path,
	pack( 'a4VV', 'glTF', 2, 20 + strlen( $direct_glb_json ) )
		. pack( 'VV', strlen( $direct_glb_json ), 0x4E4F534A )
		. $direct_glb_json
);

vrodos_asset_origin_assert( '' === VRodos_Asset_Origin::mode_for_asset( 41 ), 'legacy assets must remain unmarked' );
vrodos_asset_origin_assert( '' === VRodos_Asset_Origin::normalize_mode( 'bottom-center' ), 'unsupported origin modes must be rejected' );
VRodos_Asset_Origin::mark_bounds_centered( 41 );
vrodos_asset_origin_assert( 'bounds-center' === VRodos_Asset_Origin::mode_for_asset( 41 ), 'successful model uploads must opt into bounds centering' );

$GLOBALS['vrodos_asset_origin_meta'] = [];
$_POST                             = [];
$_FILES                            = [
	'multipleFilesInput' => [
		'name'     => [ 'direct.glb' ],
		'type'     => [ 'model/gltf-binary' ],
		'tmp_name' => [ $direct_glb_path ],
		'error'    => [ UPLOAD_ERR_OK ],
		'size'     => [ 128 ],
	],
];
VRodos_Storage_Manager::$store_result  = 101;
VRodos_Storage_Manager::$switch_result = true;
$direct_success = VRodos_Upload_Manager::create_asset_3dfiles_extra_frontend( 42, 5, 7 );
vrodos_asset_origin_assert( ! empty( $direct_success['success'] ), 'a successful direct GLB upload must complete' );
vrodos_asset_origin_assert( 'bounds-center' === VRodos_Asset_Origin::mode_for_asset( 42 ), 'a successful direct GLB upload must be marked' );

VRodos_Storage_Manager::$store_result = new WP_Error( 'store failed' );
$store_failure = VRodos_Upload_Manager::create_asset_3dfiles_extra_frontend( 43, 5, 7 );
vrodos_asset_origin_assert( empty( $store_failure['success'] ), 'a failed direct GLB store must fail' );
vrodos_asset_origin_assert( '' === VRodos_Asset_Origin::mode_for_asset( 43 ), 'a failed direct GLB store must remain unmarked' );

VRodos_Storage_Manager::$store_result  = 102;
VRodos_Storage_Manager::$switch_result = new WP_Error( 'replace failed' );
$switch_failure = VRodos_Upload_Manager::create_asset_3dfiles_extra_frontend( 44, 5, 7 );
vrodos_asset_origin_assert( empty( $switch_failure['success'] ), 'a failed GLB replacement must fail' );
vrodos_asset_origin_assert( '' === VRodos_Asset_Origin::mode_for_asset( 44 ), 'a failed GLB replacement must remain unmarked' );

$_FILES = [];
$no_model = VRodos_Upload_Manager::create_asset_3dfiles_extra_frontend( 45, 5, 7 );
vrodos_asset_origin_assert( 'none' === $no_model['status'], 'a submission without a model must be ignored' );
vrodos_asset_origin_assert( '' === VRodos_Asset_Origin::mode_for_asset( 45 ), 'a non-model submission must remain unmarked' );

$mark_ready = new ReflectionMethod( VRodos_Asset_Import_Manager::class, 'mark_ready' );
$mark_ready->invoke( null, 46, 103, 'Converted model ready.', 'package.zip' );
vrodos_asset_origin_assert( 'bounds-center' === VRodos_Asset_Origin::mode_for_asset( 46 ), 'successful ZIP and Blender import finalization must be marked' );

$mark_failed = new ReflectionMethod( VRodos_Asset_Import_Manager::class, 'mark_failed' );
$mark_failed->invoke( null, 47, 'Conversion failed.' );
vrodos_asset_origin_assert( '' === VRodos_Asset_Origin::mode_for_asset( 47 ), 'failed ZIP and Blender imports must remain unmarked' );

$import_source = file_get_contents( dirname( __DIR__ ) . '/includes/asset-import/class-vrodos-asset-import-manager.php' );
$upload_source = file_get_contents( dirname( __DIR__ ) . '/includes/class-vrodos-upload-manager.php' );
vrodos_asset_origin_assert( is_string( $import_source ) && str_contains( $import_source, 'VRodos_Asset_Origin::mark_bounds_centered( $asset_id );' ), 'staged and converted imports must mark their finalized GLB' );
vrodos_asset_origin_assert( is_string( $upload_source ) && str_contains( $upload_source, 'VRodos_Asset_Origin::mark_bounds_centered( $asset_id );' ), 'direct GLB uploads must mark their finalized GLB' );

wp_delete_file( $direct_glb_path );

echo "Asset origin contract tests passed.\n";
