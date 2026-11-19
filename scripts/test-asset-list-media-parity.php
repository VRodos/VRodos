<?php

define( 'ABSPATH', __DIR__ );
define( 'OBJECT', 'OBJECT' );
define( 'HOUR_IN_SECONDS', 3600 );

final class WP_User {
	public function __construct( public array $allcaps ) {}
	public function exists(): bool { return true; }
}

final class WP_Post {
	public function __construct( public int $ID, public string $post_name, public string $post_type = 'vrodos_asset3d' ) {}
}

$projects = [ 'native' => new WP_Post( 1, 'native', 'vrodos_game' ), 'immerse' => new WP_Post( 2, 'immerse', 'vrodos_game' ) ];
$categories = [ 'audio', 'video', 'poi-imagetext', 'image', '3d-text', 'assessment', 'poi-link', 'chat', 'door', 'decoration' ];
$assets = [];
foreach ( $categories as $index => $category ) {
	$id = 10 + $index;
	$assets[ $id ] = [ 'post' => new WP_Post( $id, $category ), 'project' => in_array( $category, [ 'audio', 'assessment' ], true ) ? 'immerse' : 'native' ];
}
$meta = [
	2  => [ '_immerse_source' => 'immerse' ],
	10 => [ '_vrodos_asset_is_shared' => '1', 'vrodos_asset3d_audio' => '41' ],
	11 => [ 'vrodos_asset3d_video' => 'https://example.test/film.mp4', 'vrodos_asset3d_screenimage' => '42', 'vrodos_asset3d_video_autoloop' => '1' ],
	12 => [ 'vrodos_asset3d_poi_imgtxt_image' => '43', 'vrodos_asset3d_poi_imgtxt_content' => 'Ancient city' ],
	13 => [ 'vrodos_asset3d_image' => '44', 'vrodos_asset3d_poi_imgtxt_title' => 'Image caption', 'vrodos_asset3d_screenimage' => 'https://example.test/thumb.jpg' ],
	14 => [ 'vrodos_asset3d_text_content' => 'Αθήνα', 'vrodos_asset3d_text_format' => 'docx', 'vrodos_asset3d_text_truncated' => '1' ],
	15 => [ '_vrodos_asset_is_shared' => '1', '_immerse_source' => 'immerse', 'vrodos_asset3d_assessment_group' => 'Text', 'vrodos_asset3d_assessment_content' => '{"text":"Greek"}', 'vrodos_asset3d_assessment_levels' => '["A2"]' ],
	16 => [ 'vrodos_asset3d_link' => 'https://example.test/wiki' ],
	17 => [ 'vrodos_asset3d_poi_chattxt_title' => 'Meet here', 'vrodos_asset3d_poi_chatnum_people' => '4', 'vrodos_asset3d_poi_chatbut_indicators' => 'yes' ],
	18 => [ 'vrodos_asset3d_scene' => '93' ],
];
$transients = [];
$query_count = 0;
$restricted_user = false;
$current_post = 0;
$assessment_contexts = [];

function get_post_meta( $id, $key, $single ) { return $GLOBALS['meta'][ $id ][ $key ] ?? ''; }
function wp_json_encode( $value ) { return json_encode( $value ); }
function maybe_unserialize( $value ) { return $value; }
function esc_url_raw( $url ) { return $url; }
function is_wp_error( $value ): bool { return false; }
function get_post( $id = null ) { return $GLOBALS['assets'][ $id ?: $GLOBALS['current_post'] ]['post']; }
function get_the_ID() { return $GLOBALS['current_post']; }
function get_the_title( $id = null ) { return get_post( $id )->post_name; }
function get_post_field( $field, $id ) { return '7'; }
function get_the_author_meta( $field, $id ) { return 'Author'; }
function get_term_meta( $id, $key, $single ) { return ''; }
function get_post_type( $id ) { return $id <= 2 ? 'vrodos_game' : 'vrodos_asset3d'; }
function get_page_by_path( $slug, $output, $type ) { return $GLOBALS['projects'][ $slug ] ?? null; }
function get_post_modified_time( $format, $gmt, $id ) { return 1234; }
function add_query_arg( $key, $value, $url ) { return $url . '?' . $key . '=' . $value; }
function wp_reset_postdata(): void { $GLOBALS['current_post'] = 0; }
function _prime_post_caches( $ids, $terms, $meta ): void {}
function get_current_user_id(): int { return $GLOBALS['restricted_user'] ? 32 : 31; }
function wp_get_current_user(): WP_User {
	return new WP_User( [ $GLOBALS['restricted_user'] ? 'vrodos_immerse_restricted' : 'manage_options' => true ] );
}
function current_user_can( $cap, ...$args ): bool { return ! $GLOBALS['restricted_user']; }
function get_transient( $key ) { return $GLOBALS['transients'][ $key ] ?? false; }
function set_transient( $key, $value, $expiration ): void { $GLOBALS['transients'][ $key ] = $value; }
function wp_get_post_terms( $id, $taxonomy ): array {
	$slug = 'vrodos_asset3d_cat' === $taxonomy ? get_post( $id )->post_name : $GLOBALS['assets'][ $id ]['project'];
	return [ (object) [ 'slug' => $slug, 'name' => ucfirst( $slug ), 'term_id' => $id + 100 ] ];
}

function apply_filters( $hook, $item, $asset_id, $project_id, $project_slug ) {
	if ( 'vrodos_asset_browser_item_data' !== $hook || 'assessment' !== $item['category_slug'] ) {
		return $item;
	}
	$GLOBALS['assessment_contexts'][] = [ $asset_id, $project_id, $project_slug ];
	if ( 2 !== $project_id ) {
		return null;
	}
	$item['connector_project_id'] = $project_id;
	return $item;
}

function get_posts( $args ): array {
	++$GLOBALS['query_count'];
	$ids = array_keys( $GLOBALS['assets'] );
	if ( isset( $args['tax_query'] ) ) {
		$ids = array_filter( $ids, static fn( $id ) => in_array( $GLOBALS['assets'][ $id ]['project'], $args['tax_query'][0]['terms'], true ) );
	}
	if ( isset( $args['meta_key'] ) ) {
		$ids = array_filter( $ids, static fn( $id ) => get_post_meta( $id, $args['meta_key'], true ) === $args['meta_value'] );
	}
	if ( isset( $args['meta_query'] ) ) {
		$ids = array_filter( $ids, static fn( $id ) => '1' === get_post_meta( $id, '_vrodos_asset_is_shared', true )
			|| ( 'OR' === ( $args['meta_query']['relation'] ?? '' ) && 'immerse' === get_post_meta( $id, '_immerse_source', true ) ) );
	}
	return array_values( array_reverse( $ids ) );
}

final class WP_Query {
	private array $ids;
	public function __construct( array $args ) {
		++$GLOBALS['query_count'];
		$this->ids = array_reverse( array_intersect( array_keys( $GLOBALS['assets'] ), $args['post__in'] ) );
	}
	public function have_posts(): bool { return [] !== $this->ids; }
	public function the_post(): void { $GLOBALS['current_post'] = array_shift( $this->ids ); }
}

final class VRodos_Asset_Origin {
	public static function mode_for_asset( int $id ): string { return ''; }
}
final class VRodos_Storage_Manager {
	public static function authoring_url_for_attachment( int $id ): string { return "https://example.test/media/$id"; }
}
final class VRodos_Path_Manager {
	public static function image_url( string $path ): string { return "https://example.test/images/$path"; }
}

foreach ( [ 'cefr-levels', 'image-dialog', 'shared-repository-manager', 'immerse-access-manager', 'core-manager' ] as $class ) {
	require_once __DIR__ . "/../includes/class-vrodos-$class.php";
}

function expect_asset_list( bool $condition, string $message ): void {
	if ( ! $condition ) {
		throw new RuntimeException( $message );
	}
}

$editor = VRodos_Core_Manager::vrodos_get_assets_by_game( 'native', 1 );
expect_asset_list( [ 19, 18, 17, 16, 14, 13, 12, 11, 10 ] === array_column( $editor, 'asset_id' ), 'The editor includes Shared assets, preserves order, and lets the connector hide assessments.' );
expect_asset_list( $editor === VRodos_Core_Manager::vrodos_get_assets_by_game( 'native', 1 ) && 6 === $query_count, 'Each editor listing uses the same three selection queries.' );
$query_count = 0;
$scopes = [ 'native', 'shared-assets-repository' ];
$library = VRodos_Core_Manager::get_assets( $scopes );
expect_asset_list( 2 === $query_count, 'The cold Assets list uses one selection query and one Shared query.' );
expect_asset_list( $library === VRodos_Core_Manager::get_assets( $scopes ) && 2 === $query_count, 'The warm Assets list serves the payload without querying assets.' );

$editor = array_column( $editor, null, 'asset_id' );
$library = array_column( $library, null, 'asset_id' );
$expected_fields = [
	10 => [ 'audio_path' => 'https://example.test/media/41', 'audio_playback_mode' => 'interact', 'audio_volume' => '1', 'audio_distance_model' => 'inverse', 'screenshot_path' => VRodos_Core_Manager::get_builtin_audio_thumbnail_url() ],
	11 => [ 'video_loop' => '1', 'video_path' => 'https://example.test/film.mp4', 'screenshot_path' => 'https://example.test/media/42?t=1234' ],
	12 => [ 'poi_img_path' => 'https://example.test/media/43', 'poi_img_content' => 'Ancient city' ],
	13 => [ 'image_path' => 'https://example.test/media/44', 'poi_img_title' => 'Image caption', 'poi_img_content' => '', 'screenshot_path' => 'https://example.test/thumb.jpg' ],
	14 => [ 'text_content_b64' => base64_encode( 'Αθήνα' ), 'text_format' => 'docx', 'text_truncated' => '1' ],
	16 => [ 'poi_link_url' => 'https://example.test/wiki' ],
	17 => [ 'poi_chat_title' => 'Meet here', 'poi_chat_participants' => '4', 'poi_chat_indicators' => 'yes' ],
];
foreach ( $expected_fields as $id => $fields ) {
	foreach ( $fields as $key => $value ) {
		expect_asset_list( $value === $editor[ $id ][ $key ] && $value === $library[ $id ][ $key ], "Asset $id field $key preserves its value and type in both lists." );
	}
}
expect_asset_list( '93' === $editor[18]['vrodos_asset3d_scene'] && ! isset( $library[18]['vrodos_asset3d_scene'] ), 'Door destination belongs to the editor payload.' );
expect_asset_list( true === $editor[10]['is_immerse'] && 'false' === $library[10]['is_immerse'], 'The editor classifies by owner project and the library by source metadata.' );

$restricted_user = true;
$immerse_editor = array_column( VRodos_Core_Manager::vrodos_get_assets_by_game( 'immerse', 2 ), null, 'asset_id' );
$immerse_library = array_column( VRodos_Core_Manager::get_assets( $scopes ), null, 'asset_id' );
expect_asset_list( [ 15, 10 ] === array_keys( $immerse_editor ) && [ 15, 10 ] === array_keys( $immerse_library ), 'Restricted users see their Immerse content and Shared assets only.' );
expect_asset_list( true === $immerse_editor[10]['is_shared'] && false === $immerse_editor[10]['can_edit'] && false === $immerse_library[10]['can_edit'], 'Shared assets are read-only for restricted users.' );
expect_asset_list( [ [ 15, 1, 'native' ], [ 15, 1, 'native' ], [ 15, 2, 'immerse' ] ] === $assessment_contexts, 'Only the editor gives the connector the requested project context.' );
expect_asset_list( 2 === $immerse_editor[15]['connector_project_id'] && ! isset( $immerse_library[15]['connector_project_id'] ), 'Connector enrichment applies to the editor only.' );
foreach ( [ $immerse_editor[15], $immerse_library[15] ] as $assessment ) {
	expect_asset_list( 0 === $assessment['glb_id'] && '' === $assessment['path'] && [ 'text' => 'Greek' ] === json_decode( base64_decode( $assessment['assessment_content'] ), true ), 'Assessments keep their encoded content and render without a GLB.' );
}

echo "Asset list media, visibility, connector, and query-count parity passed.\n";
