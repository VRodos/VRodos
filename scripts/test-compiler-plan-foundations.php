<?php

define( 'ABSPATH', __DIR__ );

if ( ! class_exists( 'VRodos_Path_Manager' ) ) {
	class VRodos_Path_Manager {
		public static function plugin_path( string $relative = '' ): string {
			return dirname( __DIR__ ) . '/' . ltrim( str_replace( '\\', '/', $relative ), '/' );
		}
	}
}

if ( ! function_exists( 'wp_json_encode' ) ) {
	function wp_json_encode( $value, $flags = 0 ) {
		return json_encode( $value, $flags );
	}
}
if ( ! function_exists( 'wp_mkdir_p' ) ) {
	function wp_mkdir_p( string $directory ): bool {
		return is_dir( $directory ) || mkdir( $directory, 0777, true );
	}
}
if ( ! function_exists( 'wp_generate_uuid4' ) ) {
	function wp_generate_uuid4(): string {
		return sprintf( '%08x-%04x-4%03x-a%03x-%012x', random_int( 0, 0xffffffff ), random_int( 0, 0xffff ), random_int( 0, 0xfff ), random_int( 0, 0xfff ), random_int( 0, 0xffffffffffff ) );
	}
}
if ( ! function_exists( 'sanitize_title' ) ) {
	function sanitize_title( string $value ): string {
		$value = strtolower( trim( $value ) );
		$value = preg_replace( '/[^a-z0-9]+/', '-', $value ) ?? $value;
		return trim( $value, '-' );
	}
}
if ( ! function_exists( 'sanitize_text_field' ) ) {
	function sanitize_text_field( string $value ): string {
		return trim( strip_tags( $value ) );
	}
}
if ( ! function_exists( 'sanitize_key' ) ) {
	function sanitize_key( string $value ): string {
		return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( $value ) ) ?? '';
	}
}
if ( ! function_exists( 'absint' ) ) {
	function absint( $value ): int {
		return abs( (int) $value );
	}
}

require_once __DIR__ . '/../includes/class-vrodos-compiler-runtime-assets.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-scene-repository.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-aframe-entity-renderer.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-artifact-transaction.php';
require_once __DIR__ . '/../includes/class-vrodos-runtime-settings-contract.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-runtime-feature-flags.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-runtime-manifest.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-runtime-script-planner.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-scene-settings.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-plan-resolver.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-target-renderer.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-link-publisher.php';

function vrodos_foundation_assert( bool $condition, string $label ): void {
	if ( $condition ) {
		return;
	}
	fwrite( STDERR, $label . " failed.\n" );
	exit( 1 );
}

function vrodos_foundation_remove_tree( string $directory ): void {
	if ( ! is_dir( $directory ) ) {
		return;
	}
	foreach ( scandir( $directory ) ?: [] as $entry ) {
		if ( '.' === $entry || '..' === $entry ) {
			continue;
		}
		$path = $directory . DIRECTORY_SEPARATOR . $entry;
		if ( is_dir( $path ) ) {
			vrodos_foundation_remove_tree( $path );
		} else {
			unlink( $path );
		}
	}
	rmdir( $directory );
}

function vrodos_foundation_element_by_id( DOMDocument $dom, string $id ): ?DOMElement {
	$matches = ( new DOMXPath( $dom ) )->query( '//*[@id="' . $id . '"]' );
	$element = false !== $matches ? $matches->item( 0 ) : null;
	return $element instanceof DOMElement ? $element : null;
}

$normalizer = new VRodos_Compiler_Entity_Policy();
$source     = (object) [
	'category_name'  => 'lightSun',
	'position'       => [ 1, 2, 3 ],
	'rotation'       => [ 0, 0, 0 ],
	'scale'          => [ 1, 1, 1 ],
	'follow_camera'  => true,
];
$first      = $normalizer->normalize( $source, 42, 'lightSun0' );
$second     = $normalizer->normalize( $source, 42, 'lightSun0' );
vrodos_foundation_assert( 'light-sun' === $first->category_slug, 'camelCase light category normalization' );
vrodos_foundation_assert( $first->uuid === $second->uuid, 'deterministic object id' );
vrodos_foundation_assert( ! property_exists( $source, 'uuid' ), 'source object remains immutable' );
vrodos_foundation_assert( property_exists( $source, 'follow_camera' ), 'source compatibility fields remain untouched' );

$registry = new VRodos_Compiler_Entity_Policy();
$light_aliases = [
	'light-sun'     => [ 'lightSun', 'lightsun', 'light-sun' ],
	'light-spot'    => [ 'lightSpot', 'lightspot', 'light-spot' ],
	'light-lamp'    => [ 'lightLamp', 'lightlamp', 'light-lamp' ],
	'light-ambient' => [ 'lightAmbient', 'lightambient', 'light-ambient' ],
];
foreach ( $light_aliases as $expected => $aliases ) {
	foreach ( $aliases as $alias ) {
		$canonical = $normalizer->canonical_category( $alias );
		vrodos_foundation_assert( $expected === $canonical, 'canonical light category: ' . $alias );
		vrodos_foundation_assert( 'light' === $registry->family_for( $canonical ), 'light alias renderer family: ' . $alias );
	}
}
foreach ( [ 'walkableSurface' => 'walkable-surface', 'collisionProxy' => 'collision-proxy', 'poiLink' => 'poi-link', 'poiChat' => 'poi-chat', 'poiImageText' => 'poi-imagetext', '3dText' => '3d-text' ] as $alias => $expected ) {
	vrodos_foundation_assert( $expected === $normalizer->canonical_category( $alias ), 'canonical entity category: ' . $alias );
}

if ( class_exists( 'DOMDocument' ) ) {
	$dom     = new DOMDocument( '1.0', 'UTF-8' );
	$scene   = $dom->createElement( 'a-scene' );
	$assets  = $dom->createElement( 'a-assets' );
	$dom->appendChild( $scene );
	$scene->appendChild( $assets );
	$renderer = new VRodos_Compiler_AFrame_Entity_Renderer(
		new VRodos_Compiler_Runtime_Assets(),
		new VRodos_Compiler_Scene_Repository(),
		static fn ( $url ) => $url
	);
	$renderer->configure( '/plugin/', true );
	$renderer->render_scene_objects(
		$dom,
		$scene,
		$assets,
		[
			'sun' => (object) [
				'category_name' => 'lightSun',
				'position' => [ 0, 3, 0 ],
				'rotation' => [ 0, 0, 0 ],
				'scale' => [ 1, 1, 1 ],
				'lightcolor' => [ 1, 1, 1 ],
				'lightintensity' => 1,
			],
			'unknown' => (object) [
				'category_name' => 'futureEntity',
				'position' => [ 0, 0, 0 ],
				'rotation' => [ 0, 0, 0 ],
				'scale' => [ 1, 1, 1 ],
			],
		],
		1,
		42,
		[ 'scene_settings' => [ 'vrRuntimeProfile' => 'desktop' ], 'container' => $scene ]
	);
	$lights = $dom->getElementsByTagName( 'a-light' );
	vrodos_foundation_assert( 1 === $lights->length, 'light renderer emits a-light' );
	vrodos_foundation_assert( str_contains( $lights->item( 0 )->getAttribute( 'light' ), 'type: directional' ), 'sun renderer emits directional light' );
	$render_diagnostics = $renderer->build_compile_diagnostics( $dom );
	vrodos_foundation_assert( 1 === count( $render_diagnostics['warnings'] ?? [] ), 'unknown categories emit one diagnostic' );

	$rig_builder = new VRodos_Compiler_Target_Renderer();
	$vrexpo_dom  = new DOMDocument( '1.0', 'UTF-8' );
	$vrexpo_scene = $vrexpo_dom->createElement( 'a-scene' );
	$vrexpo_player = $vrexpo_dom->createElement( 'a-entity' );
	$vrexpo_player->setAttribute( 'id', 'player' );
	$vrexpo_dom->appendChild( $vrexpo_scene );
	$vrexpo_scene->appendChild( $vrexpo_player );
	$rig_builder->apply_player_rig( $vrexpo_dom, $vrexpo_player, 'vrexpo_games', '1 2 3', true, false );
	vrodos_foundation_assert( ! $vrexpo_player->hasAttribute( 'position' ), 'VRExpo tracking rig stays unpositioned' );
	$vrexpo_camera = vrodos_foundation_element_by_id( $vrexpo_dom, 'cameraA' );
	$vrexpo_right_controller = vrodos_foundation_element_by_id( $vrexpo_dom, 'oculusRight' );
	vrodos_foundation_assert( $vrexpo_camera instanceof DOMElement && '1 2 3' === $vrexpo_camera->getAttribute( 'position' ), 'VRExpo camera keeps authored position' );
	vrodos_foundation_assert( $vrexpo_right_controller instanceof DOMElement && $vrexpo_right_controller->parentNode === $vrexpo_player, 'VRExpo controller stays under player rig' );

	$standard_dom  = new DOMDocument( '1.0', 'UTF-8' );
	$standard_scene = $standard_dom->createElement( 'a-scene' );
	$standard_player = $standard_dom->createElement( 'a-entity' );
	$standard_player->setAttribute( 'id', 'player' );
	$standard_dom->appendChild( $standard_scene );
	$standard_scene->appendChild( $standard_player );
	$rig_builder->apply_player_rig( $standard_dom, $standard_player, 'virtualproduction_games', '4 5 6', false, true );
	vrodos_foundation_assert( '4 5 6' === $standard_player->getAttribute( 'position' ), 'standard rig keeps authored position on player' );
	$standard_camera = vrodos_foundation_element_by_id( $standard_dom, 'cameraA' );
	vrodos_foundation_assert( $standard_camera instanceof DOMElement && '0 0 0' === $standard_camera->getAttribute( 'position' ), 'standard camera remains local to player' );
	vrodos_foundation_assert( ! $standard_player->hasAttribute( 'show-position' ), 'lean headset omits position UI component' );

	$fragment_dom = new DOMDocument( '1.0', 'UTF-8' );
	@$fragment_dom->loadHTML(
		'<a-scene id="aframe-scene-container"><a-assets><template id="avatar-template"><a-entity class="avatar"></a-entity></template></a-assets><a-plane id="videoPlaneGreen"></a-plane><a-plane id="screenPlane"></a-plane></a-scene>',
		LIBXML_HTML_NOIMPLIED | LIBXML_NOBLANKS | LIBXML_NOERROR
	);
	( new VRodos_Compiler_Target_Renderer() )->apply_networking( $fragment_dom );
	$fragment_avatar = ( new DOMXPath( $fragment_dom ) )->query( '//*[@id="avatar-template"]//a-entity' )->item( 0 );
	$fragment_video  = vrodos_foundation_element_by_id( $fragment_dom, 'videoPlaneGreen' );
	vrodos_foundation_assert( $fragment_avatar instanceof DOMElement && $fragment_avatar->hasAttribute( 'networked-audio-source' ), 'network target adapter adds avatar audio fragment' );
	vrodos_foundation_assert( $fragment_video instanceof DOMElement && $fragment_video->hasAttribute( 'networked-video-source' ), 'network target adapter adds video fragment' );
}

class VRodos_Test_Plan_Scene_Repository extends VRodos_Compiler_Scene_Repository {
	public function get_project_type_slug( int $project_id ): string {
		return 'vrexpo_games';
	}
}

function vrodos_foundation_chunk( string $id, int $order, array $activation = [], array $dependencies = [] ): array {
	$chunk = [
		'id' => $id,
		'type' => 'script',
		'src' => $id . '.js',
		'order' => $order,
		'dependencies' => $dependencies,
		'features' => [ $id ],
	];
	if ( ! empty( $activation ) ) {
		$chunk['activationCapabilities'] = $activation;
	}
	return $chunk;
}

$plan_manifest = new VRodos_Compiler_Runtime_Manifest(
	null,
	[
		'schemaVersion' => 1,
		'chunks' => [
			'scene-components' => vrodos_foundation_chunk( 'scene-components', 10 ),
			'networked-components' => vrodos_foundation_chunk( 'networked-components', 15, [ 'networking' ] ),
			'core-runtime' => vrodos_foundation_chunk( 'core-runtime', 20 ),
			'collision-bvh-vendor' => vrodos_foundation_chunk( 'collision-bvh-vendor', 30, [ 'collision-bvh' ] ),
			'aframe-components' => vrodos_foundation_chunk( 'aframe-components', 90, [], [ 'core-runtime' ] ),
		],
	]
);
$plan_repository = new VRodos_Test_Plan_Scene_Repository();
$plan_flags      = new VRodos_Compiler_Runtime_Feature_Flags();
$plan_settings   = new VRodos_Compiler_Scene_Settings( $plan_repository, $plan_flags );
$plan_planner    = new VRodos_Compiler_Runtime_Script_Planner( $plan_manifest, $plan_flags );
$plan_resolver   = new VRodos_Compiler_Plan_Resolver( $plan_settings, $plan_planner );
$scene_one = (object) [
	'metadata' => (object) [
		'aframeRuntimeMode' => 'single-player',
		'aframeVrRuntimeProfile' => 'desktop',
		'aframeRenderQuality' => 'high',
		'aframeHoveringInteractables' => true,
	],
	'objects' => (object) [],
];
$scene_two = (object) [
	'metadata' => (object) [
		'aframeRuntimeMode' => 'single-player',
		'aframeVrRuntimeProfile' => 'pc-rendered-vr',
		'aframeRenderQuality' => 'performance',
		'aframeHoveringInteractables' => false,
	],
	'objects' => (object) [],
];
$project_plan = $plan_resolver->resolve(
	new VRodos_Compile_Request( 9, 102, [ 101, 102 ], 'networked', 'headset', true ),
	[
		'project_title' => 'Fixture',
		'project_type_slug' => 'vrexpo_games',
		'valid_scene_ids' => [ 101, 102 ],
		'scene_title' => [ 'One', 'Two' ],
		'scene_json' => [ $scene_one, $scene_two ],
	]
);
vrodos_foundation_assert( 'networked' === $project_plan->scenes[0]->settings['runtimeMode'], 'project runtime mode overrides first scene metadata' );
vrodos_foundation_assert( 'networked' === $project_plan->scenes[1]->settings['runtimeMode'], 'project runtime mode overrides every scene metadata' );
vrodos_foundation_assert( 'headset' === $project_plan->scenes[0]->settings['vrRuntimeProfile'], 'project VR target overrides every scene' );
vrodos_foundation_assert( 'high' === $project_plan->scenes[0]->settings['renderQuality'], 'first scene artistic settings remain local' );
vrodos_foundation_assert( 'performance' === $project_plan->scenes[1]->settings['renderQuality'], 'second scene artistic settings remain local' );
vrodos_foundation_assert( $project_plan->scenes[0]->hover_enabled && ! $project_plan->scenes[1]->hover_enabled, 'hover remains scene-specific' );
vrodos_foundation_assert( in_array( 'networked-components', $project_plan->scenes[0]->chunk_ids, true ), 'project capability plan activates networking' );

$link_publisher = new VRodos_Compiler_Link_Publisher(
	static fn ( string $filename, ?string $mode, string $runtime_mode ): string => ( $mode ?: 'primary' ) . ':' . $runtime_mode . ':' . $filename,
	'both',
	'local'
);
$vrexpo_result = $link_publisher->publish( $project_plan, [] );
vrodos_foundation_assert( str_ends_with( $vrexpo_result->links['MasterClient'], 'Master_Client_101.html' ), 'VRExpo master link keeps first-scene convention' );
vrodos_foundation_assert( str_ends_with( $vrexpo_result->links['CurrentSceneMasterClient'], 'Master_Client_102.html' ), 'selected-scene master link is explicit' );
vrodos_foundation_assert( ! isset( $vrexpo_result->links['SimpleClient'] ), 'VRExpo omits Simple client link' );
vrodos_foundation_assert( isset( $vrexpo_result->to_public_payload()['artifacts'] ), 'public result exposes artifact summaries' );

$standard_plan = new VRodos_Project_Compile_Plan(
	$project_plan->request,
	$project_plan->project_title,
	'virtualproduction_games',
	$project_plan->scenes
);
$standard_result = $link_publisher->publish( $standard_plan, [] );
vrodos_foundation_assert( str_ends_with( $standard_result->links['MasterClient'], 'Master_Client_102.html' ), 'standard master link keeps last-scene convention' );
vrodos_foundation_assert( str_ends_with( $standard_result->links['index'], 'index_102.html' ), 'standard index filename remains stable' );
vrodos_foundation_assert( str_ends_with( $standard_result->links['SimpleClient'], 'Simple_Client_102.html' ), 'standard Simple filename remains stable' );

$legacy_diagnostics = [];
$legacy_settings = $plan_settings->build_settings(
	(object) [
		'aframeRenderQuality' => 'high',
		'aframeRuntimeMode' => 'networked',
		'composite_params' => 'renderQuality: performance; fogdensity: 9; runtimeMode: single-player; unknownSetting: unsafe',
	],
	(object) [ 'objects' => (object) [] ],
	9,
	$legacy_diagnostics
);
vrodos_foundation_assert( 'performance' === $legacy_settings['renderQuality'], 'allowlisted legacy overlay keeps compatibility' );
vrodos_foundation_assert( 1.0 === $legacy_settings['fogdensity'], 'legacy overlay values use contract normalization' );
vrodos_foundation_assert( 'networked' === $legacy_settings['runtimeMode'], 'legacy build target field cannot override normalized metadata' );
vrodos_foundation_assert( ! str_contains( $plan_settings->serialize_settings( $legacy_settings ), 'unknownSetting' ), 'unknown legacy setting is not serialized' );
vrodos_foundation_assert( count( $legacy_diagnostics ) >= 2, 'legacy overlay emits migration diagnostics' );

$legacy_capability_settings = $plan_settings->build_settings(
	(object) [
		'aframeVrRuntimeProfile' => 'desktop',
		'aframePostFXEnabled' => false,
		'aframePostFXEngine' => 'legacy',
		'composite_params' => 'postFXEnabled: true',
	],
	(object) [ 'objects' => (object) [] ],
	9
);
$legacy_capabilities = $plan_planner->capabilities_for_resolved_scene(
	(object) [
		'metadata' => (object) [
			'aframeVrRuntimeProfile' => 'desktop',
			'aframePostFXEnabled' => false,
			'aframePostFXEngine' => 'legacy',
		],
		'objects' => (object) [],
	],
	$legacy_capability_settings
);
vrodos_foundation_assert( in_array( 'postfx:legacy', $legacy_capabilities, true ), 'capabilities derive after effective legacy settings' );

$test_dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'vrodos-compiler-transaction-' . bin2hex( random_bytes( 6 ) );
wp_mkdir_p( $test_dir );
file_put_contents( $test_dir . DIRECTORY_SEPARATOR . 'Master_Client_1.html', 'old-master' );
file_put_contents( $test_dir . DIRECTORY_SEPARATOR . 'Simple_Client_1.html', 'old-simple' );
$artifacts = [
	new VRodos_Compile_Artifact( 'Master_Client_1.html', 'new-master', 'master', 1 ),
	new VRodos_Compile_Artifact( 'Simple_Client_1.html', 'new-simple', 'simple', 1 ),
];
$failing_transaction = new VRodos_Compiler_Artifact_Transaction(
	$test_dir,
	static function ( VRodos_Compile_Artifact $artifact, int $committed ): void {
		if ( 1 === $committed ) {
			throw new RuntimeException( 'Injected publish failure.' );
		}
	}
);
try {
	$failing_transaction->commit( 99, $artifacts );
	vrodos_foundation_assert( false, 'transaction failure injection' );
} catch ( RuntimeException $error ) {
	vrodos_foundation_assert( 'old-master' === file_get_contents( $test_dir . DIRECTORY_SEPARATOR . 'Master_Client_1.html' ), 'master rollback' );
	vrodos_foundation_assert( 'old-simple' === file_get_contents( $test_dir . DIRECTORY_SEPARATOR . 'Simple_Client_1.html' ), 'simple rollback' );
}

( new VRodos_Compiler_Artifact_Transaction( $test_dir ) )->commit( 99, $artifacts );
vrodos_foundation_assert( 'new-master' === file_get_contents( $test_dir . DIRECTORY_SEPARATOR . 'Master_Client_1.html' ), 'master transaction commit' );
vrodos_foundation_assert( 'new-simple' === file_get_contents( $test_dir . DIRECTORY_SEPARATOR . 'Simple_Client_1.html' ), 'simple transaction commit' );
vrodos_foundation_remove_tree( $test_dir );

echo "Compiler plan foundation tests passed.\n";
