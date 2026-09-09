<?php

declare(strict_types=1);

define( 'ABSPATH', __DIR__ . DIRECTORY_SEPARATOR );

$GLOBALS['vrodos_glb_normalizer_meta'] = [];

class WP_Error {
	public function __construct( private string $code, private string $message ) {}
	public function get_error_message(): string {
		return $this->message;
	}
}

class VRodos_Path_Manager {
	public static function plugin_path( string $relative = '' ): string {
		return dirname( __DIR__ ) . DIRECTORY_SEPARATOR . str_replace( '/', DIRECTORY_SEPARATOR, $relative );
	}
}

function vrodos_glb_normalizer_assert( bool $condition, string $message ): void {
	if ( ! $condition ) {
		fwrite( STDERR, "GLB legacy material normalizer test failed: {$message}\n" );
		exit( 1 );
	}
}

function is_wp_error( $value ): bool {
	return $value instanceof WP_Error;
}

function wp_normalize_path( string $path ): string {
	return str_replace( '\\', '/', $path );
}

function sanitize_text_field( string $value ): string {
	return trim( $value );
}

function apply_filters( string $hook, $value ) {
	return $value;
}

function wp_delete_file( string $path ): void {
	if ( is_file( $path ) ) {
		unlink( $path );
	}
}

function update_post_meta( int $post_id, string $key, $value ): bool {
	$GLOBALS['vrodos_glb_normalizer_meta'][ $post_id ][ $key ] = $value;
	return true;
}

function delete_post_meta( int $post_id, string $key ): bool {
	unset( $GLOBALS['vrodos_glb_normalizer_meta'][ $post_id ][ $key ] );
	return true;
}

function write_test_glb( string $path, array $json, string $binary = '' ): void {
	$json_bytes = json_encode( $json, JSON_UNESCAPED_SLASHES );
	vrodos_glb_normalizer_assert( is_string( $json_bytes ), 'test GLB JSON must encode' );
	$json_bytes .= str_repeat( ' ', ( 4 - strlen( $json_bytes ) % 4 ) % 4 );
	$binary       .= str_repeat( "\0", ( 4 - strlen( $binary ) % 4 ) % 4 );
	$binary_chunk = '' !== $binary ? pack( 'VV', strlen( $binary ), 0x004E4942 ) . $binary : '';
	$total_length = 12 + 8 + strlen( $json_bytes ) + strlen( $binary_chunk );
	$bytes = pack( 'a4VV', 'glTF', 2, $total_length )
		. pack( 'VV', strlen( $json_bytes ), 0x4E4F534A )
		. $json_bytes
		. $binary_chunk;
	file_put_contents( $path, $bytes );
}

require_once dirname( __DIR__ ) . '/includes/asset-import/class-vrodos-asset-import-glb-normalizer.php';

$test_dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'vrodos-glb-normalizer-' . bin2hex( random_bytes( 6 ) );
vrodos_glb_normalizer_assert( mkdir( $test_dir ), 'temporary test directory must be created' );

$modern_path = $test_dir . DIRECTORY_SEPARATOR . 'modern.glb';
$legacy_path = $test_dir . DIRECTORY_SEPARATOR . 'legacy.glb';
$output_path = $test_dir . DIRECTORY_SEPARATOR . 'converted.glb';
$invalid_path = $test_dir . DIRECTORY_SEPARATOR . 'invalid.glb';

write_test_glb(
	$modern_path,
	[
		'asset'     => [ 'version' => '2.0', 'generator' => 'VRodos test' ],
		'materials' => [ [ 'pbrMetallicRoughness' => [ 'metallicFactor' => 0, 'roughnessFactor' => 0.4 ] ] ],
	]
);
write_test_glb(
	$legacy_path,
	[
		'asset'              => [ 'version' => '2.0', 'generator' => 'Legacy exporter' ],
		'extensionsUsed'     => [ VRodos_Asset_Import_Glb_Normalizer::LEGACY_EXTENSION ],
		'extensionsRequired' => [ VRodos_Asset_Import_Glb_Normalizer::LEGACY_EXTENSION ],
		'materials'          => [
			[
				'name'       => 'Glossy',
				'extensions' => [
					VRodos_Asset_Import_Glb_Normalizer::LEGACY_EXTENSION => [
						'diffuseFactor'    => [ 0.25, 0.5, 0.75, 1 ],
						'specularFactor'   => [ 0.9, 0.9, 0.9 ],
						'glossinessFactor' => 0.8,
					],
				],
			],
		],
		'buffers'            => [ [ 'byteLength' => 36 ] ],
		'bufferViews'        => [ [ 'buffer' => 0, 'byteOffset' => 0, 'byteLength' => 36, 'target' => 34962 ] ],
		'accessors'          => [ [ 'bufferView' => 0, 'componentType' => 5126, 'count' => 3, 'type' => 'VEC3', 'min' => [ 0, 0, 0 ], 'max' => [ 1, 1, 0 ] ] ],
		'meshes'             => [ [ 'primitives' => [ [ 'attributes' => [ 'POSITION' => 0 ], 'material' => 0 ] ] ] ],
		'nodes'              => [ [ 'mesh' => 0 ] ],
		'scenes'             => [ [ 'nodes' => [ 0 ] ] ],
		'scene'              => 0,
	],
	pack( 'g*', 0, 0, 0, 1, 0, 0, 0, 1, 0 )
);
file_put_contents( $invalid_path, 'not a glb' );

$modern = VRodos_Asset_Import_Glb_Normalizer::inspect_file( $modern_path );
vrodos_glb_normalizer_assert( ! is_wp_error( $modern ) && empty( $modern['hasLegacySpecularGlossiness'] ), 'modern metallic/roughness GLBs must pass without conversion' );

$legacy = VRodos_Asset_Import_Glb_Normalizer::inspect_file( $legacy_path );
vrodos_glb_normalizer_assert( ! is_wp_error( $legacy ) && ! empty( $legacy['hasLegacySpecularGlossiness'] ), 'legacy specular/glossiness GLBs must be detected' );
vrodos_glb_normalizer_assert( is_wp_error( VRodos_Asset_Import_Glb_Normalizer::inspect_file( $invalid_path ) ), 'invalid GLB headers must be rejected' );

$unchanged = VRodos_Asset_Import_Glb_Normalizer::normalize( $modern_path, $test_dir . DIRECTORY_SEPARATOR . 'unused.glb' );
vrodos_glb_normalizer_assert( ! is_wp_error( $unchanged ) && empty( $unchanged['converted'] ) && $unchanged['path'] === $modern_path, 'modern GLBs must not invoke the converter' );

$converted = VRodos_Asset_Import_Glb_Normalizer::normalize( $legacy_path, $output_path );
vrodos_glb_normalizer_assert( ! is_wp_error( $converted ), is_wp_error( $converted ) ? $converted->get_error_message() : 'legacy conversion must succeed' );
vrodos_glb_normalizer_assert( ! empty( $converted['converted'] ) && is_file( $output_path ), 'legacy conversion must create a GLB' );
$converted_inspection = VRodos_Asset_Import_Glb_Normalizer::inspect_file( $output_path );
vrodos_glb_normalizer_assert( ! is_wp_error( $converted_inspection ) && empty( $converted_inspection['hasLegacySpecularGlossiness'] ), 'converted GLBs must not retain the archived extension' );
vrodos_glb_normalizer_assert( ! empty( $converted_inspection['hasMetallicRoughness'] ), 'converted GLBs must contain the modern metallic/roughness material workflow' );

VRodos_Asset_Import_Glb_Normalizer::record_asset_result( 41, $converted );
vrodos_glb_normalizer_assert( VRodos_Asset_Import_Glb_Normalizer::CONVERSION_TOOL === $GLOBALS['vrodos_glb_normalizer_meta'][41][VRodos_Asset_Import_Glb_Normalizer::CONVERSION_TOOL_META], 'converted assets must record their conversion tool' );
VRodos_Asset_Import_Glb_Normalizer::record_asset_result( 41, $unchanged );
vrodos_glb_normalizer_assert( empty( $GLOBALS['vrodos_glb_normalizer_meta'][41] ), 'a modern replacement must clear stale conversion metadata' );

foreach ( [ $modern_path, $legacy_path, $output_path, $invalid_path ] as $path ) {
	wp_delete_file( $path );
}
rmdir( $test_dir );

echo "GLB legacy material normalizer tests passed.\n";
