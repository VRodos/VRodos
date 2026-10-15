<?php
/** Image asset saves and editor hydration without a WordPress database. */
define( 'ABSPATH', __DIR__ . '/' );
$GLOBALS['image_meta'] = [];
class WP_Post {
	public string $post_type = 'vrodos_game';
	public string $post_name = 'project';
}
class WP_Term {
	public int $term_id = 1;
	public string $slug = 'image';
}
class Image_Saved extends RuntimeException {}
function image_check( bool $condition, string $message ): void { if ( ! $condition ) throw new RuntimeException( $message ); }
function get_post_meta( int $id, string $key, bool $single = true ) { return $GLOBALS['image_meta'][$id][$key] ?? ''; }
function update_post_meta( int $id, string $key, $value ): void { $GLOBALS['image_meta'][$id][$key] = stripslashes( (string) $value ); }
function absint( $value ): int { return abs( (int) $value ); }
function wp_unslash( $value ): string { return stripslashes( (string) $value ); }
function wp_slash( $value ): string { return addslashes( (string) $value ); }
function sanitize_text_field( $value ): string { return trim( preg_replace( '/[\r\n\t ]+/', ' ', strip_tags( (string) $value ) ) ); }
function sanitize_textarea_field( $value ): string { return trim( strip_tags( (string) $value ) ); }
function wp_verify_nonce(): bool { return true; }
function is_user_logged_in(): bool { return true; }
function current_user_can(): bool { return true; }
function get_post( int $id ): WP_Post { $post = new WP_Post(); $post->post_type = $id === 10 ? 'vrodos_game' : 'vrodos_asset3d'; return $post; }
function get_term_by(): WP_Term { return new WP_Term(); }
function wp_get_post_terms(): array { return [ new WP_Term() ]; }
function get_post_thumbnail_id(): int { return 0; }
function is_wp_error(): bool { return false; }
class VRodos_Storage_Manager { public static function storage_schema_ready(): bool { return true; } }
class VRodos_Shared_Repository_Manager {
	public static function is_shared_asset(): bool { return false; }
	public static function all_slugs(): array { return []; }
}
class VRodos_Immerse_Access_Manager {
	public static function is_restricted_user(): bool { return false; }
	public static function is_immerse_project(): bool { return false; }
}
class VRodos_Asset_Origin { public static function mode_for_asset(): string { return ''; } }
class VRodos_Core_Manager {
	public static function resolve_media_meta_url( $value ): string { return (string) $value; }
	public static function is_vr_environment_asset(): bool { return false; }
}
require_once __DIR__ . '/../includes/class-vrodos-scene-cpt-manager.php';
require_once __DIR__ . '/../includes/asset-cpt/trait-vrodos-asset-cpt-submission.php';
class Image_Controller {
	use VRodos_Asset_CPT_Submission_Controller;
	private static function begin_frontend_submission_buffer(): int { return 0; }
	private static function update_frontend_asset_save_progress( ...$args ): void {}
	private static function ensure_asset_project_term(): WP_Term { return new WP_Term(); }
	private static function sanitize_asset_title( $value ): string { return sanitize_text_field( $value ); }
	private static function build_frontend_redirect_url(): string { return '/fixture'; }
	private static function is_assessment_asset(): bool { return false; }
	private static function get_frontend_model_upload_error(): string { return ''; }
	private static function get_immerse_original_image_url(): string { return ''; }
	public static function update_asset_frontend( ...$args ): int { return 1; }
	private static function perform_frontend_redirect( ...$args ): void { throw new Image_Saved(); }
}
$GLOBALS['wpdb'] = new class { public string $options = 'fixture_options'; public function query(): void {} };
$_GET = [ 'vrodos_asset' => 800, 'vrodos_game' => 10 ];
$_FILES = [];
$_POST = [ 'submitted' => '1', 'post_nonce_field' => 'valid', 'assetTitle' => 'Image', 'term_id' => '1', 'term_id_ipr' => '2' ];
$controller = new Image_Controller();
function save_image( string $title, string $description ): void {
	global $controller;
	$_POST['poiImgTitle'] = wp_slash( $title );
	$_POST['poiImgDescription'] = wp_slash( $description );
	try { $controller->handle_asset_frontend_submission(); }
	catch ( Image_Saved $saved ) { return; }
	throw new RuntimeException( 'Image did not save.' );
}
$title = 'Έκθεμα; "εικόνα"';
$description = "Πρώτη γραμμή;\nΔεύτερη γραμμή & 'quotes' \\path";
save_image( $title, $description );
image_check( VRodos_Image_Dialog::asset_defaults(800) === [ 'poi_img_title' => $title, 'poi_img_content' => $description ], 'Image save preserves Unicode, punctuation, line breaks and slashes.' );

$enrich = new ReflectionMethod( VRodos_Scene_CPT_Manager::class, 'enrich_editor_scene_object_asset_metadata' );
$base = [ 'asset_id' => 800, 'category_slug' => 'image' ];
$first = $enrich->invoke( null, $base );
image_check( $first['poi_img_title'] === $title && $first['poi_img_content'] === $description, 'Editor initializes absent text from asset defaults.' );
$second = $enrich->invoke( null, $base + [ 'poi_img_title' => 'Placement two', 'poi_img_content' => '' ] );
image_check( $second['poi_img_title'] === 'Placement two' && $second['poi_img_content'] === '', 'Editor preserves placement overrides and explicit empty descriptions.' );
save_image( 'New default', 'New description' );
$first = $enrich->invoke( null, $first );
image_check( $first['poi_img_title'] === $title && $first['poi_img_content'] === $description, 'Asset edits do not overwrite initialized placement text.' );
$empty = $enrich->invoke( null, $base + [ 'poi_img_title' => '', 'poi_img_content' => '' ] );
image_check( ! VRodos_Image_Dialog::has_content( (object) $empty ), 'Cleared placement stays noninteractive despite asset defaults.' );
image_check( VRodos_Image_Dialog::asset_defaults(800)['poi_img_title'] === 'New default', 'Placement hydration does not edit the asset.' );
save_image( str_repeat('Έ', 101), str_repeat('Κ', 2001) );
image_check( mb_strlen( VRodos_Image_Dialog::asset_defaults(800)['poi_img_title'] ) === 100 && mb_strlen( VRodos_Image_Dialog::asset_defaults(800)['poi_img_content'] ) === 2000, 'Asset text limits preserve complete Unicode characters.' );
save_image( '<b>Title</b>', "<script>unsafe()</script>\nPlain text" );
image_check( ! str_contains( VRodos_Image_Dialog::asset_defaults(800)['poi_img_content'], '<' ), 'Asset text is sanitized as plain text.' );
save_image( '', '' );
image_check( VRodos_Image_Dialog::asset_defaults(800) === [ 'poi_img_title' => '', 'poi_img_content' => '' ], 'Asset defaults can also be cleared.' );
echo "Image dialog asset saves and placement hydration passed.\n";
