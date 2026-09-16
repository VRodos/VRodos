<?php
define( 'ABSPATH', __DIR__ . '/' );
require_once dirname( __DIR__ ) . '/includes/class-vrodos-surface-texture-optimizer.php';
function is_wp_error( $value ): bool { return false; }
function wp_tempnam( $name ) { return tempnam( sys_get_temp_dir(), $name ); }
function wp_delete_file( $path ): void { if ( is_file( $path ) ) unlink( $path ); }
function check_surface( bool $condition, string $message ): void { if ( ! $condition ) throw new RuntimeException( $message ); }
function fixture_png( int $width, int $height ): string {
	$chunk = 'IHDR' . pack( 'NNCCCCC', $width, $height, 8, 2, 0, 0, 0 );
	return "\x89PNG\r\n\x1a\n" . pack( 'N', 13 ) . $chunk . pack( 'N', crc32( $chunk ) );
}
function wp_get_image_editor( $source ) {
	++$GLOBALS['surface_editor_calls'];
	return new class {
		public function resize( $width, $height, $crop ) { $GLOBALS['surface_resize'] = [ $width, $height, $crop ]; return true; }
		public function set_quality( $quality ) { return true; }
		public function save( $path, $mime ) {
			$GLOBALS['surface_mime'] = $mime;
			$GLOBALS['surface_saved'] = $path . '.png';
			file_put_contents( $path . '.png', fixture_png( 16, 8 ) );
			return [ 'path' => $path . '.png' ];
		}
	};
}
$source = tempnam( sys_get_temp_dir(), 'vrodos-surface-source' );
file_put_contents( $source, fixture_png( 32, 16 ) );
$hash = hash_file( 'sha256', $source );
$GLOBALS['surface_editor_calls'] = 0;
try {
	$result = VRodos_Surface_Texture_Optimizer::publish( $source, 64, true, fn( $path ) => $path );
	check_surface( $result === $source && 0 === $GLOBALS['surface_editor_calls'], 'Small textures must not be resized or recompressed.' );
	$result = VRodos_Surface_Texture_Optimizer::publish( $source, 16, true, function ( $path ) use ( $source ) {
		check_surface( is_file( $path ) && $path !== $source, 'Publication must read a staged derivative.' );
		return '/published/map.png';
	} );
	check_surface( '/published/map.png' === $result, 'Use the derivative publication URL.' );
	check_surface( [ 16, 16, false ] === $GLOBALS['surface_resize'], 'Respect the build cap without cropping.' );
	check_surface( 'image/png' === $GLOBALS['surface_mime'], 'Data maps must use lossless encoding after resize.' );
	check_surface( ! is_file( $GLOBALS['surface_saved'] ), 'Successful publication releases staging.' );
	try {
		VRodos_Surface_Texture_Optimizer::publish( $source, 16, true, function () { throw new RuntimeException( 'publication failed' ); } );
		throw new LogicException( 'Expected publication failure.' );
	} catch ( RuntimeException $error ) {
		check_surface( 'publication failed' === $error->getMessage(), 'Publication errors must propagate.' );
	}
	check_surface( ! is_file( $GLOBALS['surface_saved'] ), 'Failed publication releases staging.' );
	check_surface( $hash === hash_file( 'sha256', $source ), 'Source texture bytes remain unchanged.' );
} finally { unlink( $source ); }
echo "Surface texture size, data encoding, and publication safety tests passed.\n";
