<?php
class WP_Error {
	public function __construct( public string $code, public string $message ) {}
}
function is_wp_error( $value ): bool { return $value instanceof WP_Error; }
function trailingslashit( string $path ): string { return rtrim( $path, '/\\' ) . '/'; }
function absint( $value ): int { return abs( (int) $value ); }
function get_current_user_id(): int { return 5; }
function get_post_type( int $id ): string { return 9 === $id ? 'vrodos_game' : 'post'; }
function current_user_can( string $capability, int $id ): bool { return $GLOBALS['can_edit']; }
require_once __DIR__ . '/../includes/asset-import/class-vrodos-asset-import-session.php';
function verify_session( bool $value, string $message ): void {
	if ( ! $value ) throw new RuntimeException( $message );
}
$path = sys_get_temp_dir() . '/vrodos-session-' . bin2hex( random_bytes( 8 ) );
if ( ! mkdir( $path ) ) throw new RuntimeException( 'Temporary fixtures unavailable.' );
$can_edit = true;
try {
	verify_session( VRodos_Asset_Import_Session::read_owned_manifest( $path )->code === 'manifest_missing', 'Missing manifests must fail.' );
	file_put_contents( $path . '/manifest.json', '{bad json' );
	verify_session( VRodos_Asset_Import_Session::read_owned_manifest( $path )->code === 'manifest_invalid', 'Invalid manifests must fail.' );
	foreach ( [ [ 5, 9, true ], [ 6, 9, false ], [ 5, 0, false ], [ 5, 8, false ] ] as [ $owner, $project, $allowed ] ) {
		file_put_contents( $path . '/manifest.json', json_encode( [ 'user_id' => $owner, 'project_id' => $project ] ) );
		$result = VRodos_Asset_Import_Session::read_owned_manifest( $path );
		verify_session( is_array( $result ) === $allowed, 'Ownership and project checks must agree for every session consumer.' );
	}
	file_put_contents( $path . '/manifest.json', json_encode( [ 'user_id' => 5, 'project_id' => 9 ] ) );
	$can_edit = false;
	verify_session( VRodos_Asset_Import_Session::read_owned_manifest( $path )->code === 'manifest_owner', 'Revoked project access must fail.' );
} finally {
	if ( is_file( $path . '/manifest.json' ) ) unlink( $path . '/manifest.json' );
	rmdir( $path );
}
echo "Shared staged-session ownership tests passed.\n";
