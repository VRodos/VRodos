<?php
declare(strict_types=1);

define( 'ABSPATH', __DIR__ . DIRECTORY_SEPARATOR );

final class Scene_Text_Save_Response extends RuntimeException {
	public function __construct( public bool $success, public $data ) {
		parent::__construct( 'AJAX response' );
	}
}

final class VRodos_Path_Manager {
	public static function plugin_path( string $relative_path = '' ): string {
		return dirname( __DIR__ ) . DIRECTORY_SEPARATOR . str_replace( [ '/', '\\' ], DIRECTORY_SEPARATOR, $relative_path );
	}
}

$GLOBALS['saved_scene'] = [ 'post_title' => 'Before', 'post_content' => '{"metadata":{},"objects":{}}' ];

function plugin_dir_path( string $file ): string { return dirname( $file ) . DIRECTORY_SEPARATOR; }
function add_action( string $hook, $callback ): void {}
function check_ajax_referer( string $action, string $query, bool $die ): bool { return true; }
function absint( $value ): int { return abs( (int) $value ); }
function get_post_type( int $id ): string { return 'vrodos_scene'; }
function current_user_can( string $capability, int $id ): bool { return true; }
function get_post_field( string $field, int $id ): string { return (string) ( $GLOBALS['saved_scene'][ $field ] ?? '' ); }
function get_posts( array $args ): array { return [ (object) [ 'ID' => 7, 'post_content' => $GLOBALS['saved_scene']['post_content'] ] ]; }
function sanitize_text_field( $value ): string { return (string) $value; }
function sanitize_textarea_field( $value ): string { return (string) $value; }
function sanitize_title( string $value ): string { return $value; }
function update_post_meta( int $id, string $key, $value ): void {}
function is_wp_error( $value ): bool { return false; }
function wp_json_encode( $value, int $flags = 0 ): string { return (string) json_encode( $value, $flags ); }
function maybe_unserialize( $value ) { return $value; }
function wp_send_json_error( $data, int $status = 200 ): void { throw new Scene_Text_Save_Response( false, $data ); }
function wp_send_json_success( $data ): void { throw new Scene_Text_Save_Response( true, $data ); }
function wp_slash( $value ) { return is_array( $value ) ? array_map( 'wp_slash', $value ) : addslashes( (string) $value ); }
function wp_unslash( $value ) { return is_array( $value ) ? array_map( 'wp_unslash', $value ) : stripslashes( (string) $value ); }
function wp_update_post( array $post, bool $wp_error = false ): int {
	$post = wp_unslash( $post ); // WordPress unslashes the post array before storing it.
	foreach ( [ 'post_title', 'post_content' ] as $field ) {
		if ( isset( $post[ $field ] ) ) {
			$GLOBALS['saved_scene'][ $field ] = $post[ $field ];
		}
	}
	return (int) $post['ID'];
}

class VRodos_Storage_Manager {
	public static function storage_schema_ready(): bool { return true; }
	public static function owned_attachment_ids( ...$args ): array { return []; }
}

require_once __DIR__ . '/../includes/ajax/class-vrodos-scene-ajax.php';
require_once __DIR__ . '/../includes/class-vrodos-core-manager.php';

function scene_text_save_request( callable $callback ): void {
	try {
		$callback();
	} catch ( Scene_Text_Save_Response $response ) {
		if ( $response->success ) {
			return;
		}
		throw new RuntimeException( 'Scene save failed: ' . var_export( $response->data, true ) );
	}
	throw new RuntimeException( 'Expected a scene save response.' );
}

function assert_saved_text( string $description, string $assessment ): void {
	$scene = json_decode( $GLOBALS['saved_scene']['post_content'] );
	if ( ! is_object( $scene ) || json_last_error() !== JSON_ERROR_NONE ) {
		throw new RuntimeException( 'Saved scene JSON is invalid.' );
	}
	if ( $scene->objects->poi->poi_img_content !== $description ) {
		throw new RuntimeException( 'POI description changed during save.' );
	}
	if ( $scene->objects->assessment->assessment_content !== $assessment ) {
		throw new RuntimeException( 'Assessment line breaks changed during save.' );
	}
}

$description = 'Asegúrate de que encaja con la sartén. ¿Puedes continuar?';
$assessment = "Primera pregunta\nSegunda pregunta\nTercera pregunta";
$scene = (object) [
	'metadata' => (object) [],
	'objects' => (object) [
		'poi' => (object) [ 'category_slug' => 'poi-imagetext', 'poi_img_content' => $description ],
		'assessment' => (object) [
			'category_slug' => 'assessment',
			'assessment_type' => 'quiz',
			'assessment_levels' => 'A1',
			'assessment_content' => $assessment,
		],
		'removable' => (object) [ 'asset_id' => 99 ],
	],
];
$ajax = new VRodos_Scene_AJAX();
$_POST = [
	'scene_id' => '7',
	'scene_title' => wp_slash( 'Escena española' ),
	'scene_json' => wp_slash( (string) json_encode( $scene ) ),
];
scene_text_save_request( [ $ajax, 'save_scene_async_action_callback' ] );
assert_saved_text( $description, $assessment );

$_POST = [
	'scene_id' => '7',
	'scene_metadata' => wp_slash( '{"aframeVrRuntimeProfile":"desktop"}' ),
];
scene_text_save_request( [ $ajax, 'save_scene_settings_action_callback' ] );
assert_saved_text( $description, $assessment );

if ( true !== VRodos_Core_Manager::vrodos_delete_asset_3d_from_scenes( 99 ) ) {
	throw new RuntimeException( 'Removing an asset from the scene failed.' );
}
assert_saved_text( $description, $assessment );
if ( isset( json_decode( $GLOBALS['saved_scene']['post_content'] )->objects->removable ) ) {
	throw new RuntimeException( 'The removed asset remains in the scene.' );
}

echo "Scene text save tests passed.\n";
