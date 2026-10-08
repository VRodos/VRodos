<?php
/** Exercise image-door edits without WordPress or its database. */
define( 'ABSPATH', __DIR__ . '/' );
define( 'MINUTE_IN_SECONDS', 60 );
$GLOBALS['door_meta'] = [];
$GLOBALS['door_files'] = [];
$GLOBALS['door_deleted'] = [];
$GLOBALS['door_can_edit'] = true;
$GLOBALS['door_nonce'] = true;
$GLOBALS['door_logged_in'] = true;
$GLOBALS['door_failure'] = '';
$fixture_root = sys_get_temp_dir() . '/vrodos-door-edit-' . bin2hex( random_bytes( 6 ) );
mkdir( $fixture_root );
class WP_Error {
	public function __construct( public string $code, public string $message ) {}
	public function get_error_message(): string { return $this->message; }
}
class WP_Post {
	public string $post_type = 'vrodos_game';
	public string $post_name = 'project';
}
class WP_Term {
	public int $term_id = 1;
	public string $slug = 'door';
}
class DoorRedirect extends RuntimeException {}
function door_assert( bool $condition, string $message ): void { if ( ! $condition ) throw new RuntimeException( $message ); }
function is_wp_error( $value ): bool { return $value instanceof WP_Error; }
function get_post_meta( int $id, string $key, bool $single = true ) { return $GLOBALS['door_meta'][ $id ][ $key ] ?? ''; }
function update_post_meta( int $id, string $key, $value ): bool {
	$GLOBALS['door_meta'][ $id ][ $key ] = $value;
	if ( $key === 'vrodos_asset3d_glb' ) VRodos_Image_Door::model_changed( 1, $id, $key, $value );
	return true;
}
function delete_post_meta( int $id, string $key ): void { unset( $GLOBALS['door_meta'][ $id ][ $key ] ); }
function get_attached_file( int $id, bool $unfiltered = false ) { return $GLOBALS['door_files'][ $id ] ?? false; }
function wp_json_encode( $value, int $flags = 0 ): string|false { return json_encode( $value, $flags ); }
function sanitize_text_field( $value ): string { return trim( (string) $value ); }
function sanitize_key( string $value ): string { return preg_replace( '/[^a-z0-9_-]/', '', strtolower( $value ) ); }
function absint( $value ): int { return abs( (int) $value ); }
function wp_unslash( $value ) { return $value; }
function trailingslashit( string $path ): string { return rtrim( $path, '/\\' ) . '/'; }
function wp_delete_file( string $path ): void { if ( is_file( $path ) ) unlink( $path ); }
function has_term( string $slug, string $taxonomy, int $id ): bool { return $id === 42 && $slug === 'door'; }
function wp_verify_nonce(): bool { return $GLOBALS['door_nonce']; }
function current_user_can(): bool { return $GLOBALS['door_can_edit']; }
function is_user_logged_in(): bool { return $GLOBALS['door_logged_in']; }
function get_post(): WP_Post { return new WP_Post(); }
function get_term_by( string $field, $value, string $taxonomy ): WP_Term { return new WP_Term(); }
function wp_get_post_terms(): array { return [ new WP_Term() ]; }
function esc_attr( string $value ): string { return $value; }
function get_current_user_id(): int { return 7; }
function set_transient( string $key, $value, int $ttl ): void { $GLOBALS['door_notice'] = $value; }
class VRodos_Shared_Repository_Manager { public static function all_slugs(): array { return []; } }
class VRodos_Immerse_Access_Manager {
	public static function is_restricted_user(): bool { return false; }
	public static function is_immerse_project(): bool { return false; }
}
class VRodos_Asset_Optimization_Manager {
	public static function resolve_editor_glb_load(): array { return [ 'readiness' => [ 'label' => 'Ready', 'uploadMessage' => 'Ready' ] ]; }
}
class VRodos_Asset_Origin {
	public static function mark_bounds_centered( int $id ): void { update_post_meta( $id, '_vrodos_asset_origin_mode', 'bounds-center' ); }
}
class VRodos_Storage_Manager {
	public static int $next_id = 100;
	public static int $uploads = 0;
	public static function storage_schema_ready(): bool { return true; }
	public static function temporary_directory( string $operation ): string {
		$path = $GLOBALS['fixture_root'] . '/temp-' . self::$next_id;
		mkdir( $path ); return $path;
	}
	public static function import_existing_file( string $path, string $filename, string $mime, int $owner, string $type, string $role ): int|WP_Error {
		if ( $GLOBALS['door_failure'] === 'model' && $mime === 'model/gltf-binary' ) return new WP_Error( 'model_failed', 'Model storage failed.' );
		$id = self::$next_id++;
		$output = $GLOBALS['fixture_root'] . '/' . $id;
		copy( $path, $output ); $GLOBALS['door_files'][ $id ] = $output; return $id;
	}
	public static function store_uploaded_attachment( array $file, int $owner, string $type, string $role ): int|WP_Error {
		self::$uploads++;
		if ( (int) ( $file['error'] ?? 0 ) !== 0 ) return new WP_Error( 'upload_failed', 'Upload failed.' );
		return self::import_existing_file( $file['tmp_name'], $file['name'], 'image/png', $owner, $type, $role );
	}
	public static function replace_attachment_reference_map( int $owner, string $type, array $references ): bool|WP_Error {
		if ( $GLOBALS['door_failure'] === 'switch' ) return new WP_Error( 'switch_failed', 'Metadata switch failed.' );
		$old = $GLOBALS['door_meta'][ $owner ] ?? [];
		foreach ( $references as $key => $id ) update_post_meta( $owner, $key, $id );
		foreach ( $references as $key => $id ) {
			$previous = (int) ( $old[ $key ] ?? 0 );
			if ( $previous > 0 && ! in_array( $previous, $GLOBALS['door_meta'][ $owner ], true ) ) self::delete_attachment_if_owned_by( $previous, $type, $owner );
		}
		return true;
	}
	public static function delete_unreferenced_attachment_if_owned_by( int $id, string $type, int $owner ): bool {
		return ! in_array( $id, $GLOBALS['door_meta'][ $owner ], true ) && self::delete_attachment_if_owned_by( $id, $type, $owner );
	}
	public static function delete_attachment_if_owned_by( int $id, string $type, int $owner ): bool {
		$GLOBALS['door_deleted'][] = $id;
		wp_delete_file( $GLOBALS['door_files'][ $id ] ?? '' ); unset( $GLOBALS['door_files'][ $id ] ); return true;
	}
}
require_once dirname( __DIR__ ) . '/includes/asset-import/class-vrodos-image-door.php';
require_once dirname( __DIR__ ) . '/includes/asset-import/class-vrodos-asset-import-glb-normalizer.php';
require_once dirname( __DIR__ ) . '/includes/asset-cpt/trait-vrodos-asset-cpt-shared.php';
require_once dirname( __DIR__ ) . '/includes/asset-cpt/trait-vrodos-asset-cpt-submission.php';
require_once dirname( __DIR__ ) . '/includes/asset-cpt/trait-vrodos-asset-cpt-metabox-admin.php';
class DoorController {
	use VRodos_Asset_CPT_Shared;
	use VRodos_Asset_CPT_Submission_Controller;
	use VRodos_Asset_CPT_Metabox_Admin;
	private const NONCE_BASENAME = 'fixture';
	private const ASSET_TITLE_MAX_LENGTH = 50;
	private array $vrodos_databox1 = [ 'fields' => [ [ 'id' => 'vrodos_asset3d_door_image' ], [ 'id' => 'vrodos_asset3d_glb' ] ] ];
	private static function ensure_asset_project_term(): WP_Term { return new WP_Term(); }
	private static function begin_frontend_submission_buffer(): int { return 0; }
	private static function cleanup_frontend_submission_buffer( int $level ): void {}
	private static function build_frontend_redirect_url(): string { return '/fixture'; }
	private static function update_frontend_asset_save_progress( ...$args ): void {}
	private static function redirect_with_frontend_notice( string $url, string $code, int $level = -1 ): void { throw new DoorRedirect( $code ); }
	private static function perform_frontend_redirect( string $url, int $level = -1 ): void { throw new DoorRedirect( 'saved' ); }
	public static function update_asset_frontend( ...$args ): int { return 1; }
}
$GLOBALS['wpdb'] = new class { public string $options = 'fixture_options'; public function query(): int { return 0; } };
function run_door_save( DoorController $controller, string $expected ): void {
	try { $controller->handle_asset_frontend_submission(); throw new RuntimeException( 'Expected a redirect' ); }
	catch ( DoorRedirect $redirect ) { door_assert( $redirect->getMessage() === $expected, 'unexpected frontend save result: ' . $redirect->getMessage() ); }
}
try {
	$png_a = base64_decode( 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF6kAAAAASUVORK5CYII=' );
	$path_a = $fixture_root . '/source-a.png'; file_put_contents( $path_a, $png_a );
	$prepared = VRodos_Image_Door::prepare_source( $path_a, 'picture.png', 42 );
	door_assert( is_array( $prepared ) && true === VRodos_Image_Door::activate( 42, $prepared ), 'initial pair must activate' );
	$controller = new DoorController();
	$_GET = [ 'vrodos_asset' => 42, 'vrodos_game' => 10 ];
	$_POST = [ 'submitted' => '1', 'post_nonce_field' => 'valid', 'assetTitle' => 'Image door', 'term_id_native' => 'door', 'term_id_ipr_native' => 'license' ];
	$_FILES = [];
	$before = $GLOBALS['door_meta'][42];
	run_door_save( $controller, 'saved' );
	door_assert( $before[VRodos_Image_Door::IMAGE_META] === get_post_meta( 42, VRodos_Image_Door::IMAGE_META ) && $before['vrodos_asset3d_glb'] === get_post_meta( 42, 'vrodos_asset3d_glb' ), 'ordinary save must not rebuild the image/model pair' );
	$before = $GLOBALS['door_meta'][42];

	$path_b = $fixture_root . '/source-b.png'; file_put_contents( $path_b, $png_a . 'replacement' );
	$_FILES['doorImageFileInput'] = [ 'tmp_name' => $path_b, 'name' => 'replacement.png', 'error' => 0 ];
	foreach ( [ 'door_nonce', 'door_can_edit', 'door_logged_in' ] as $flag ) {
		$GLOBALS[$flag] = false;
		$uploads = VRodos_Storage_Manager::$uploads;
		$controller->handle_asset_frontend_submission();
		door_assert( $uploads === VRodos_Storage_Manager::$uploads && $before === $GLOBALS['door_meta'][42], 'unauthorized request must not read/store an upload' );
		$GLOBALS[$flag] = true;
	}
	$_POST['glbFileInput'] = 'new-model';
	run_door_save( $controller, 'door-image-conflict' ); unset( $_POST['glbFileInput'] );
	door_assert( $before === $GLOBALS['door_meta'][42], 'competing uploads must not replace either source' );
	run_door_save( $controller, 'saved' );
	door_assert( $before[VRodos_Image_Door::IMAGE_META] !== get_post_meta( 42, VRodos_Image_Door::IMAGE_META ) && $before['vrodos_asset3d_glb'] !== get_post_meta( 42, 'vrodos_asset3d_glb' ), 'image replacement must update both owned IDs' );
	$active = $GLOBALS['door_meta'][42];
	$model = file_get_contents( get_attached_file( $active['vrodos_asset3d_glb'] ) );
	door_assert( str_contains( $model, $png_a . 'replacement' ), 'new GLB must embed the replacement picture bytes' );
	door_assert( in_array( $before[VRodos_Image_Door::IMAGE_META], $GLOBALS['door_deleted'], true ) && in_array( $before['vrodos_asset3d_glb'], $GLOBALS['door_deleted'], true ), 'successful replacement must retire both previous owned files' );
	foreach ( [ 'model', 'switch' ] as $failure ) {
		$GLOBALS['door_failure'] = $failure;
		run_door_save( $controller, 'door-image-failed' );
		door_assert( $active === $GLOBALS['door_meta'][42] && is_file( get_attached_file( $active['vrodos_asset3d_glb'] ) ), 'failure must retain previous working pair' );
		$GLOBALS['door_failure'] = '';
	}
	$_FILES['doorImageFileInput']['error'] = UPLOAD_ERR_PARTIAL;
	run_door_save( $controller, 'door-image-failed' );
	$_FILES['doorImageFileInput'] = [ 'tmp_name' => $path_b, 'name' => 'replacement.png', 'error' => 0 ];
	$_POST = [ 'vrodos_assets_databox_nonce' => 'valid', 'vrodos_asset3d_glb' => $active['vrodos_asset3d_glb'], VRodos_Image_Door::IMAGE_META => 999 ];
	$controller->vrodos_assets_databox_save( 42 );
	door_assert( get_post_meta( 42, VRodos_Image_Door::IMAGE_META ) !== 999 && get_post_meta( 42, 'vrodos_asset3d_glb' ) !== $active['vrodos_asset3d_glb'], 'admin file edit must regenerate model and reject raw source-ID changes' );
	$active = $GLOBALS['door_meta'][42];
	$_POST['vrodos_asset3d_glb'] = 999;
	$controller->vrodos_assets_databox_save( 42 );
	door_assert( $active === $GLOBALS['door_meta'][42] && isset( $GLOBALS['door_notice'] ), 'admin competing replacements must keep prior pair and report error' );
	update_post_meta( 42, 'vrodos_asset3d_screenimage', $active[VRodos_Image_Door::IMAGE_META] );
	$_FILES = [];
	$controller->vrodos_assets_databox_save( 42 );
	door_assert( ! VRodos_Image_Door::is_image_door( 42 ) && get_post_meta( 42, 'vrodos_asset3d_glb' ) === 999, 'explicit model replacement must leave image mode' );
	door_assert( ! VRodos_Image_Door::needs_source_import( 42 ), 'unchanged-URL reimport must preserve explicit model override' );
	door_assert( is_file( get_attached_file( $active[VRodos_Image_Door::IMAGE_META] ) ), 'switching to model mode must preserve an image still used as screenshot' );
	door_assert( is_wp_error( VRodos_Image_Door::replace_upload( 43, [ 'tmp_name' => $path_a, 'error' => 0 ] ) ), 'ordinary model doors must not accept image-mode uploads' );
	door_assert( ! glob( $fixture_root . '/temp-*' ), 'all conversion staging directories must be removed' );
	echo "Image door edit, authorization, conflict, failure and model replacement checks passed.\n";
} finally {
	$iterator = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $fixture_root, FilesystemIterator::SKIP_DOTS ), RecursiveIteratorIterator::CHILD_FIRST );
	foreach ( $iterator as $item ) { $item->isDir() ? rmdir( $item->getPathname() ) : unlink( $item->getPathname() ); }
	rmdir( $fixture_root );
}