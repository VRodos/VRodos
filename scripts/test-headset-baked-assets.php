<?php

define( 'ABSPATH', __DIR__ );
require_once __DIR__ . '/../includes/class-vrodos-headset-baked-asset.php';
class WP_Error {
	public function __construct( private string $code, private string $message ) {}
	public function get_error_message(): string { return $this->message; }
}
function is_wp_error( $value ): bool { return $value instanceof WP_Error; }
function absint( $value ): int { return abs( (int) $value ); }
function get_post_meta( $id, $key, $single ) { return $GLOBALS['baked_meta'][ $id ][ $key ] ?? ''; }
function get_attached_file( $id, $raw ) { return $GLOBALS['baked_files'][ $id ] ?? ''; }
class VRodos_Storage_Manager {
	public static function attachment_is_owned_by( $id, $type, $owner ): bool { return 2 === $id && 7 === $owner; }
}
function check_baked( bool $condition, string $message ): void {
	if ( ! $condition ) { throw new RuntimeException( $message ); }
}
function rejects_baked( callable $operation, string $message ): void {
	try { $operation(); } catch ( RuntimeException $error ) {
		check_baked( str_contains( $error->getMessage(), $message ), $error->getMessage() );
		return;
	}
	throw new RuntimeException( 'Expected rejection: ' . $message );
}
function write_baked_fixture( string $path, array $changes = [], int $image_size = 1 ): void {
	$image = "\xABKTX 20\xBB\r\n\x1A\n" . pack( 'V4', 0, 1, $image_size, $image_size );
	$json = json_encode( array_replace_recursive( [ 'asset' => [ 'version' => '2.0' ], 'meshes' => [ [ 'primitives' => [] ] ], 'buffers' => [ [ 'byteLength' => strlen( $image ) ] ], 'bufferViews' => [ [ 'buffer' => 0, 'byteLength' => strlen( $image ) ] ], 'images' => [ [ 'bufferView' => 0, 'mimeType' => 'image/ktx2' ] ] ], $changes ) );
	$json .= str_repeat( ' ', ( 4 - strlen( $json ) % 4 ) % 4 );
	file_put_contents( $path, 'glTF' . pack( 'V4', 2, 28 + strlen( $json ) + strlen( $image ), strlen( $json ), 0x4E4F534A ) . $json . pack( 'V2', strlen( $image ), 0x004E4942 ) . $image );
}
$source = tempnam( sys_get_temp_dir(), 'vr-source-' );
$baked = tempnam( sys_get_temp_dir(), 'vr-baked-' );
try {
	file_put_contents( $source, 'original geometry and lights' );
	write_baked_fixture( $baked );
	$GLOBALS['baked_files'] = [ 1 => $source, 2 => $baked ];
	$GLOBALS['baked_meta'][7] = [ 'vrodos_asset3d_glb' => 1, VRodos_Headset_Baked_Asset::META => 2, '_vrodos_headset_baked_source_sha256' => hash_file( 'sha256', $source ) ];
	foreach ( [ 'desktop', 'pc-rendered-vr' ] as $profile ) {
		check_baked( '' === VRodos_Headset_Baked_Asset::selected_path( 7, $profile, true, 1024 ), 'Desktop and PCVR must retain originals.' );
	}
	check_baked( '' === VRodos_Headset_Baked_Asset::selected_path( 7, 'headset', false, 1024 ), 'Disabled toggle must retain the original.' );
	check_baked( $baked === VRodos_Headset_Baked_Asset::selected_path( 7, 'headset', true, 1024 ), 'Enabled headset must select its valid prepared bake.' );
	check_baked( '' === VRodos_Headset_Baked_Asset::selected_path( 8, 'headset', true, 1024 ), 'Assets without a bake retain the normal asset policy.' );
	file_put_contents( $source, 'replacement geometry' );
	rejects_baked( fn() => VRodos_Headset_Baked_Asset::selected_path( 7, 'headset', true, 1024 ), 'needs rebaking' );
	write_baked_fixture( $baked, [], 2048 );
	rejects_baked( fn() => VRodos_Headset_Baked_Asset::validate( $baked, 1024 ), '1024px' );
	VRodos_Headset_Baked_Asset::validate( $baked, 2048 );
	write_baked_fixture( $baked, [ 'extensions' => [ 'KHR_lights_punctual' => [ 'lights' => [ [ 'type' => 'point' ] ] ] ] ] );
	rejects_baked( fn() => VRodos_Headset_Baked_Asset::validate( $baked, 4096 ), 'no embedded runtime lights' );
	write_baked_fixture( $baked, [ 'images' => [ [ 'uri' => 'external.png' ] ] ] );
	rejects_baked( fn() => VRodos_Headset_Baked_Asset::validate( $baked, 4096 ), 'embed its buffers and textures' );
	write_baked_fixture( $baked, [ 'bufferViews' => [ [ 'byteLength' => 1000000 ] ] ] );
	rejects_baked( fn() => VRodos_Headset_Baked_Asset::validate( $baked, 4096 ), 'invalid embedded image' );
	echo "Headset baked-asset selection and validation passed.\n";
} finally {
	unlink( $source );
	unlink( $baked );
}
