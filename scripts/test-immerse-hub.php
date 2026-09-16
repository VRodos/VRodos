<?php

define( 'ABSPATH', __DIR__ );
define( 'OBJECT', 'OBJECT' );

class WP_Post {
	public function __construct( public int $ID, public string $post_type, public string $post_status, public string $post_name, public string $post_title ) {}
}
class WP_Error {
	public function __construct( public string $code, public string $message ) {}
	public function get_error_message(): string { return $this->message; }
}

$test_root = sys_get_temp_dir() . '/vrodos-immerse-hub-' . bin2hex( random_bytes( 6 ) );
$test_projects = [ new WP_Post( 11, 'vrodos_game', 'publish', 'immerse-a', 'Immerse A' ) ];
$test_scenes = [
	21 => new WP_Post( 21, 'vrodos_scene', 'publish', 'scene-a', 'Scene A' ),
	22 => new WP_Post( 22, 'vrodos_scene', 'publish', 'scene-b', 'Scene B' ),
	23 => new WP_Post( 23, 'vrodos_scene', 'publish', 'scene-c', 'Detached scene' ),
];
$test_terms = [ 21 => [ (object) [ 'slug' => 'immerse-a' ] ], 22 => [ (object) [ 'slug' => 'immerse-a' ] ], 23 => [ (object) [ 'slug' => 'other-project' ] ] ];
$test_options = [ 'vrodos_general_settings' => [ 'vrodos_runtime_public_base_url' => '', 'vrodos_immerse_hub_enabled' => '0' ] ];
$test_hub_page = new WP_Post( 99, 'page', 'publish', 'immerse', 'Conflicting page' );
$test_page_template = '';
$test_menu_hook_removed = false;
$test_inventory = [ 11 => [ 'schemaVersion' => 1, 'projectId' => 11, 'publishedAt' => '2026-01-01', 'clients' => [ 'Master_Client_21.html', 'Master_Client_22.html', 'Master_Client_23.html' ], 'media' => [] ] ];
$test_preview = $test_root . '/private-preview.png';
$test_new_preview = $test_root . '/new-private-preview.png';
$test_thumbnail_id = 101;

function absint( $value ): int { return abs( (int) $value ); }
function trailingslashit( string $value ): string { return rtrim( $value, '/\\' ) . '/'; }
function sanitize_key( string $value ): string { return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( $value ) ); }
function sanitize_text_field( string $value ): string { return trim( $value ); }
function esc_url_raw( string $value, array $schemes = [] ): string { return $value; }
function wp_parse_url( string $value, int $component = -1 ) { return -1 === $component ? parse_url( $value ) : parse_url( $value, $component ); }
function wp_unslash( string $value ): string { return $value; }
function get_site_url(): string { return 'https://wp.test'; }
function home_url( string $path = '' ): string { return 'https://wp.test' . $path; }
function get_option( string $key, $default = false ) { global $test_options; return $test_options[ $key ] ?? $default; }
function get_posts( array $args ): array { global $test_projects; return $test_projects; }
function get_post( int $id ): ?WP_Post { global $test_projects, $test_scenes, $test_hub_page; if ( 99 === $id ) { return $test_hub_page; } foreach ( $test_projects as $project ) { if ( $project->ID === $id ) { return $project; } } return $test_scenes[ $id ] ?? null; }
function get_post_field( string $field, int $id ): string { return get_post( $id )->post_name; }
function get_the_title( int $id ): string { return get_post( $id )->post_title; }
function wp_get_post_terms( int $id, string $taxonomy ): array { global $test_terms; return $test_terms[ $id ] ?? []; }
function get_post_meta( int $id, string $key, bool $single = false ) { global $test_inventory, $test_page_template; if ( '_wp_page_template' === $key && 99 === $id ) { return $test_page_template; } return '_vrodos_published_inventory' === $key ? ( $test_inventory[ $id ] ?? '' ) : ''; }
function update_post_meta( int $id, string $key, $value ): bool { global $test_inventory, $test_page_template; if ( '_wp_page_template' === $key && 99 === $id ) { $test_page_template = $value; } else { $test_inventory[ $id ] = $value; } return true; }
function wp_upload_dir( $time = null, bool $create = false ): array { global $test_root; return [ 'basedir' => $test_root, 'baseurl' => 'https://wp.test/uploads', 'error' => '' ]; }
function is_wp_error( $value ): bool { return $value instanceof WP_Error; }
function get_post_thumbnail_id( int $id ): int { global $test_thumbnail_id; return 21 === $id ? $test_thumbnail_id : 0; }
function wp_attachment_is_image( int $id ): bool { return in_array( $id, [ 101, 102 ], true ); }
function get_attached_file( int $id, bool $unfiltered = false ): string { global $test_preview, $test_new_preview; return 102 === $id ? $test_new_preview : $test_preview; }
function wp_generate_password( int $length, bool $special = true, bool $extra = false ): string { return str_repeat( 'x', $length ); }
function wp_delete_file( string $path ): void { if ( is_file( $path ) ) { unlink( $path ); } }
function is_page( string $slug ): bool { return 'immerse' === $slug; }
function is_admin(): bool { return false; }
function get_bloginfo( string $key ): string { return '6.8'; }
function add_filter( string $hook, $callback ): void {}
function add_action( string $hook, $callback, int $priority = 10, int $accepted_args = 1 ): void { global $test_menu_hook_removed; if ( 'transition_post_status' === $hook ) { $test_menu_hook_removed = false; } }
function remove_action( string $hook, $callback, int $priority = 10 ): bool { global $test_menu_hook_removed; if ( 'transition_post_status' === $hook ) { $test_menu_hook_removed = true; return true; } return false; }
function get_page_by_path( string $slug, $output = null, string $post_type = 'page' ): ?WP_Post { global $test_hub_page; return $test_hub_page; }
function wp_insert_post( array $args, bool $wp_error = false ): int { global $test_hub_page, $test_menu_hook_removed; check( $test_menu_hook_removed, 'Hub page creation left WordPress menu auto-add active.' ); $test_hub_page = new WP_Post( 99, 'page', 'publish', 'immerse', 'Immerse Scenes' ); return 99; }
function wp_update_post( array $args ): int { global $test_hub_page, $test_menu_hook_removed; check( $test_menu_hook_removed, 'Hub page republication left WordPress menu auto-add active.' ); $test_hub_page->post_status = 'publish'; return $test_hub_page->ID; }
function add_settings_error( string $setting, string $code, string $message ): void {}
function __( string $value ): string { return $value; }
function get_404_template(): string { return 'theme-404.php'; }
function get_index_template(): string { return 'theme-index.php'; }
function status_header( int $status ): void {}
function nocache_headers(): void {}

class VRodos_Path_Manager {
	public static function canonical_page_template_meta( string $file ): string { return '/templates/pages/' . $file; }
	public static function legacy_page_template_meta( string $file ): string { return '/includes/templates/' . $file; }
	public static function page_template_path( string $template ): string { return dirname( __DIR__ ) . '/templates/pages/' . basename( $template ); }
}

class VRodos_Storage_Manager {
	public static function attachment_is_owned_by( int $id, string $type, int $owner ): bool { return in_array( $id, [ 101, 102 ], true ) && 'scene' === $type && 21 === $owner; }
	public static function published_project_url( int $project_id, string $role, string $file ): string { return 'https://wp.test/uploads/vrodos/published/projects/' . $project_id . '/' . $role . '/' . $file; }
	public static function published_project_directory( int $project_id, string $role ): string { global $test_root; $path = $test_root . '/vrodos/published/projects/' . $project_id . '/' . $role; if ( ! is_dir( $path ) ) { mkdir( $path, 0777, true ); } return trailingslashit( $path ); }
	public static function temporary_directory( string $operation, string $token ): string { global $test_root; $path = $test_root . '/private/' . $operation . '/' . $token; if ( ! is_dir( $path ) ) { mkdir( $path, 0777, true ); } return trailingslashit( $path ); }
}

require_once dirname( __DIR__ ) . '/includes/class-vrodos-immerse-hub.php';
require_once dirname( __DIR__ ) . '/includes/class-vrodos-pages-manager.php';
require_once dirname( __DIR__ ) . '/includes/class-vrodos-settings-manager.php';

function check( bool $condition, string $message ): void { if ( ! $condition ) { throw new RuntimeException( $message ); } }

mkdir( $test_root, 0777, true );
$clients = VRodos_Storage_Manager::published_project_directory( 11, 'clients' );
file_put_contents( $clients . 'Master_Client_21.html', '<html><body><a-scene scene-settings="runtimeMode: single-player; vrRuntimeProfile: headset;"></a-scene></body></html>' );
file_put_contents( $clients . 'Master_Client_23.html', '<html><body><a-scene scene-settings="runtimeMode: single-player; vrRuntimeProfile: headset;"></a-scene></body></html>' );
file_put_contents( $test_preview, 'preview image bytes' );

$backfill = VRodos_Immerse_Hub::backfill_existing();
check( true === $backfill, 'Existing build backfill failed.' );
check( 'headset' === $test_inventory[11]['vrRuntimeProfile'] && 'single-player' === $test_inventory[11]['runtimeMode'], 'Backfill did not use the published client build type.' );
check( is_file( VRodos_Storage_Manager::published_project_directory( 11, 'media' ) . $test_inventory[11]['scenePreviews'][21] ), 'Backfill did not publish the scene preview.' );
$groups = VRodos_Immerse_Hub::catalog();
check( 1 === count( $groups ) && 1 === count( $groups[0]['scenes'] ), 'Catalog included a missing or detached scene.' );
check( 'https://wp.test/uploads/vrodos/published/projects/11/clients/Master_Client_21.html' === $groups[0]['scenes'][0]['url'], 'Single-player scene used the wrong public URL.' );
check( '' !== $groups[0]['scenes'][0]['preview'], 'Published preview is missing from the card.' );
$original_preview = $groups[0]['scenes'][0]['preview'];
$original_build_time = $groups[0]['scenes'][0]['builtAt'];
check( filemtime( $clients . 'Master_Client_21.html' ) === $original_build_time, 'Scene build time did not come from its published client.' );
file_put_contents( $test_new_preview, 'new preview image bytes' );
$test_thumbnail_id = 102;
check( true === VRodos_Immerse_Hub::refresh_scene_preview( 21 ), 'Saving a new screenshot did not refresh the published preview.' );
$groups = VRodos_Immerse_Hub::catalog();
check( $original_preview !== $groups[0]['scenes'][0]['preview'], 'Immerse card still uses the old screenshot.' );
check( $original_build_time === $groups[0]['scenes'][0]['builtAt'] && '2026-01-01' === $test_inventory[11]['publishedAt'], 'Screenshot save changed the latest build time.' );
check( true === VRodos_Immerse_Hub::refresh_scene_preview( 22 ), 'Unbuilt scene attempted to publish an Immerse preview.' );
check( true === VRodos_Immerse_Hub::refresh_scene_preview( 23 ), 'Detached scene changed an Immerse preview.' );

$test_inventory[11]['runtimeMode'] = 'networked';
$groups = VRodos_Immerse_Hub::catalog();
check( '' === $groups[0]['scenes'][0]['url'], 'Networked scene exposed a local runtime URL without a public base URL.' );
$test_options['vrodos_general_settings']['vrodos_runtime_public_base_url'] = 'https://runtime.test/';
$groups = VRodos_Immerse_Hub::catalog();
check( 'https://runtime.test/vrodos-published/projects/11/clients/Master_Client_21.html' === $groups[0]['scenes'][0]['url'], 'Networked scene did not use the public runtime URL.' );
check( true === ( VRodos_Immerse_Hub::robots( [] )['noindex'] ?? false ), 'Hub page must be noindex.' );

$settings_manager = new VRodos_Settings_Manager();
$switch_result = $settings_manager->sanitize_general_settings( [ VRodos_Immerse_Hub::SETTING => '1' ] );
check( '0' === $switch_result[ VRodos_Immerse_Hub::SETTING ], 'Hub switch enabled despite a conflicting /immerse/ page.' );
$test_page_template = VRodos_Path_Manager::canonical_page_template_meta( 'vrodos-immerse-hub-template.php' );
$switch_result = $settings_manager->sanitize_general_settings( [ VRodos_Immerse_Hub::SETTING => '1' ] );
check( '1' === $switch_result[ VRodos_Immerse_Hub::SETTING ], 'Hub switch did not enable for its own page.' );
$test_hub_page = null;
$test_page_template = '';
VRodos_Pages_Manager::ensure_immerse_hub_page();
check( null === $test_hub_page, 'Disabled hub created a public page.' );
VRodos_Pages_Manager::ensure_immerse_hub_page( true );
check( $test_hub_page instanceof WP_Post && ! $test_menu_hook_removed, 'Hub page creation did not restore the menu hook afterward.' );
$test_hub_page->post_status = 'draft';
VRodos_Pages_Manager::ensure_immerse_hub_page();
check( 'draft' === $test_hub_page->post_status, 'Disabled hub republished its page.' );
VRodos_Pages_Manager::ensure_immerse_hub_page( true );
check( 'publish' === $test_hub_page->post_status && ! $test_menu_hook_removed, 'Hub page republication did not restore the menu hook afterward.' );
$pages_manager = new VRodos_Pages_Manager();
$post = $test_hub_page;
$wp_query = new class { public bool $is_404 = false; public function set_404(): void { $this->is_404 = true; } };
check( 'theme-404.php' === $pages_manager->view_project_template( 'theme-page.php' ) && $wp_query->is_404, 'Disabled hub did not return a 404.' );
$test_page_template = '';
$wp_query->is_404 = false;
check( 'theme-404.php' === $pages_manager->view_project_template( 'theme-page.php' ) && $wp_query->is_404, 'Disabled untemplated /immerse/ page did not return a 404.' );
$test_page_template = VRodos_Path_Manager::canonical_page_template_meta( 'vrodos-immerse-hub-template.php' );
$test_options['vrodos_general_settings'][ VRodos_Immerse_Hub::SETTING ] = '1';
check( str_ends_with( $pages_manager->view_project_template( 'theme-page.php' ), 'vrodos-immerse-hub-template.php' ), 'Enabled hub did not load its page template.' );

unlink( $clients . 'Master_Client_21.html' );
unlink( $clients . 'Master_Client_23.html' );
unlink( VRodos_Storage_Manager::published_project_directory( 11, 'media' ) . $test_inventory[11]['scenePreviews'][21] );
unlink( VRodos_Storage_Manager::published_project_directory( 11, 'media' ) . basename( $original_preview ) );
unlink( $test_preview );
unlink( $test_new_preview );
unlink( $test_root . '/private/compiler-locks/shared/project-11-publication.lock' );
rmdir( $test_root . '/private/compiler-locks/shared' );
rmdir( $test_root . '/private/compiler-locks' );
rmdir( $test_root . '/private' );
rmdir( $clients );
rmdir( VRodos_Storage_Manager::published_project_directory( 11, 'media' ) );
rmdir( dirname( rtrim( $clients, '/' ) ) );
rmdir( dirname( dirname( rtrim( $clients, '/' ) ) ) );
rmdir( dirname( dirname( dirname( rtrim( $clients, '/' ) ) ) ) );
rmdir( dirname( dirname( dirname( dirname( rtrim( $clients, '/' ) ) ) ) ) );
rmdir( $test_root );

echo "Immerse hub business rules passed.\n";
