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
if ( ! function_exists( 'sanitize_hex_color' ) ) {
	function sanitize_hex_color( string $value ): string {
		return preg_match( '/^#[0-9a-f]{6}$/i', $value ) ? strtolower( $value ) : '';
	}
}
if ( ! function_exists( 'absint' ) ) {
	function absint( $value ): int {
		return abs( (int) $value );
	}
}
if ( ! function_exists( 'wp_parse_url' ) ) {
	function wp_parse_url( string $url, int $component = -1 ) {
		return -1 === $component ? parse_url( $url ) : parse_url( $url, $component );
	}
}
if ( ! function_exists( 'trailingslashit' ) ) {
	function trailingslashit( string $value ): string {
		return rtrim( $value, '/\\' ) . '/';
	}
}
if ( ! function_exists( 'wp_normalize_path' ) ) {
	function wp_normalize_path( string $value ): string {
		return str_replace( '\\', '/', $value );
	}
}
if ( ! function_exists( 'home_url' ) ) {
	function home_url( string $path = '' ): string {
		return 'https://example.test/' . ltrim( $path, '/' );
	}
}
if ( ! function_exists( 'wp_strip_all_tags' ) ) {
	function wp_strip_all_tags( string $value ): string {
		return strip_tags( $value );
	}
}
if ( ! function_exists( 'get_post_meta' ) ) {
	function get_post_meta( int $post_id, string $key, bool $single = false ) {
		if ( 'vrodos_asset3d_glb' === $key && $post_id > 0 ) {
			return '/uploads/source-' . $post_id . '.glb';
		}
		return $single ? '' : [];
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
require_once __DIR__ . '/../includes/asset-optimization/trait-vrodos-asset-optimization-desktop-profiles.php';

final class VRodos_Test_Desktop_Profile_Asset_Collector {
	use VRodos_Asset_Optimization_Desktop_Profiles;

	public static function collect( $scene_json ): array {
		$assets = [];
		self::collect_desktop_profile_assets( $scene_json, $assets );
		return $assets;
	}
}

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
vrodos_foundation_assert( $first === $source, 'compile-plan entity normalization avoids a redundant JSON clone' );
vrodos_foundation_assert( ! property_exists( $source, 'follow_camera' ), 'compile-plan entity drops compatibility-only fields' );

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
foreach ( [ 'walkableSurface' => 'walkable-surface', 'collisionProxy' => 'collision-proxy', 'poiLink' => 'poi-link', 'poiChat' => 'poi-chat', 'poiImageText' => 'poi-imagetext', '3dText' => '3d-text', 'primitivePlane' => 'primitive-plane' ] as $alias => $expected ) {
	vrodos_foundation_assert( $expected === $normalizer->canonical_category( $alias ), 'canonical entity category: ' . $alias );
}
vrodos_foundation_assert( 'primitive' === $registry->family_for( 'primitive-plane' ), 'plane uses the primitive renderer family' );

vrodos_foundation_assert(
	'walkable-surface' === $normalizer->effective_category( (object) [ 'category_slug' => 'decoration', 'sceneAssetRole' => 'walkable-surface' ] ),
	'decoration placement can resolve as walkable'
);
vrodos_foundation_assert(
	'decoration' === $normalizer->effective_category( (object) [ 'category_slug' => 'walkable-surface', 'sceneAssetRole' => 'decoration' ] ),
	'walkable placement can resolve as decoration'
);
vrodos_foundation_assert(
	'decoration' === $normalizer->effective_category( (object) [ 'category_slug' => 'decoration', 'sceneAssetRole' => 'invalid' ] ),
	'invalid placement role is ignored'
);
vrodos_foundation_assert(
	'door' === $normalizer->effective_category( (object) [ 'category_slug' => 'door', 'sceneAssetRole' => 'walkable-surface' ] ),
	'placement role on an ineligible category is ignored'
);

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
			'convertedWalkable' => (object) [
				'category_slug' => 'decoration',
				'sceneAssetRole' => 'walkable-surface',
				'vrodosAssetOriginMode' => 'bounds-center',
				'asset_id' => 701,
				'glb_path' => '/converted-walkable.glb',
				'walkableBehavior' => 'auto',
				'position' => [ 100, 0, 0 ],
				'rotation' => [ 0, 0, 0 ],
				'scale' => [ 1, 1, 1 ],
			],
			'convertedDecoration' => (object) [
				'category_slug' => 'walkable-surface',
				'sceneAssetRole' => 'decoration',
				'asset_id' => 702,
				'glb_path' => '/converted-decoration.glb',
				'compiledCollisionEnabled' => true,
				'walkableBehavior' => 'precise',
				'position' => [ 100, 0, 0 ],
				'rotation' => [ 0, 0, 0 ],
				'scale' => [ 1, 1, 1 ],
			],
			'defaultCollidableDecoration' => (object) [
				'category_slug' => 'decoration',
				'asset_id' => 703,
				'glb_path' => '/default-collidable-decoration.glb',
				'position' => [ 100, 0, 0 ],
				'rotation' => [ 0, 0, 0 ],
				'scale' => [ 1, 1, 1 ],
			],
			'disabledCollisionDecoration' => (object) [
				'category_slug' => 'decoration',
				'asset_id' => 704,
				'glb_path' => '/disabled-collision-decoration.glb',
				'compiledCollisionEnabled' => false,
				'position' => [ 100, 0, 0 ],
				'rotation' => [ 0, 0, 0 ],
				'scale' => [ 1, 1, 1 ],
			],
			'proceduralGround' => (object) [
				'category_slug' => 'primitive-plane',
				'planeWidth' => 30,
				'planeDepth' => 12,
				'surfaceColor' => '#d0d0d0',
				'surfaceRoughness' => 0.8,
				'surfaceMetalness' => 0.1,
				'surfaceTileSizeMeters' => 3,
				'surfaceNormalScale' => 0.75,
				'surfaceAoIntensity' => 0.6,
				'surfaceAlbedoUrl' => '/published/ground-albedo.jpg',
				'surfaceNormalUrl' => '/published/ground-normal.jpg',
				'surfaceRoughnessUrl' => '/published/ground-roughness.jpg',
				'surfaceAoUrl' => '/published/ground-ao.jpg',
				'surfaceMetalnessUrl' => '/published/ground-metalness.jpg',
				'surfaceDisplacementUrl' => '/private/ground-displacement.jpg',
				'surfaceNormalYSign' => -1,
				'surfaceAntiTilingEnabled' => true,
				'surfaceAntiTilingPatchTiles' => 1.25,
				'surfaceAntiTilingBlendSharpness' => 4,
				'position' => [ 0, 0, 0 ],
				'rotation' => [ -pi() / 2, 0, 0 ],
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
	$role_xpath = new DOMXPath( $dom );
	$converted_walkable = $role_xpath->query( '//*[@data-vrodos-asset-id="701"]' )->item( 0 );
	$converted_decoration = $role_xpath->query( '//*[@data-vrodos-asset-id="702"]' )->item( 0 );
	$default_collidable_decoration = $role_xpath->query( '//*[@data-vrodos-asset-id="703"]' )->item( 0 );
	$disabled_collision_decoration = $role_xpath->query( '//*[@data-vrodos-asset-id="704"]' )->item( 0 );
	vrodos_foundation_assert( $converted_walkable instanceof DOMElement, 'converted walkable is rendered' );
	vrodos_foundation_assert( 'bounds-center' === $converted_walkable->getAttribute( 'vrodos-model-origin' ), 'marked GLBs emit the bounds-center runtime component' );
	vrodos_foundation_assert( 'true' === $converted_walkable->getAttribute( 'data-vrodos-navmesh' ), 'converted walkable emits navmesh attributes' );
	vrodos_foundation_assert( 'auto' === $converted_walkable->getAttribute( 'data-vrodos-walk-behavior' ), 'converted walkable keeps Auto behavior' );
	vrodos_foundation_assert( 'critical' === $converted_walkable->getAttribute( 'data-vrodos-load-phase' ), 'converted walkable loads critically' );
	vrodos_foundation_assert( 'navmesh' === $converted_walkable->getAttribute( 'data-vrodos-collision-role' ), 'converted walkable collision resolves as navmesh' );
	vrodos_foundation_assert( $converted_decoration instanceof DOMElement, 'converted decoration is rendered' );
	vrodos_foundation_assert( ! $converted_decoration->hasAttribute( 'vrodos-model-origin' ), 'unmarked legacy GLBs preserve their authored origin' );
	vrodos_foundation_assert( ! $converted_decoration->hasAttribute( 'data-vrodos-navmesh' ), 'converted decoration omits navmesh attributes' );
	vrodos_foundation_assert( 'lazy' === $converted_decoration->getAttribute( 'data-vrodos-load-phase' ), 'converted decoration uses normal deferred loading' );
	vrodos_foundation_assert( 'solid' === $converted_decoration->getAttribute( 'data-vrodos-collision-role' ), 'converted decoration preserves explicitly enabled solid collision' );
	vrodos_foundation_assert( 'solid' === $default_collidable_decoration->getAttribute( 'data-vrodos-collision-role' ), 'decoration collision defaults to enabled when no value is persisted' );
	vrodos_foundation_assert( ! $disabled_collision_decoration->hasAttribute( 'data-vrodos-collider' ), 'explicitly disabled decoration collision remains disabled' );
	$procedural_ground = $dom->getElementsByTagName( 'a-plane' )->item( 0 );
	vrodos_foundation_assert( $procedural_ground instanceof DOMElement, 'primitive plane emits an A-Frame plane' );
	vrodos_foundation_assert( '30' === $procedural_ground->getAttribute( 'width' ) && '12' === $procedural_ground->getAttribute( 'height' ), 'primitive plane keeps authored dimensions' );
	vrodos_foundation_assert( '-90 0 0' === $procedural_ground->getAttribute( 'rotation' ), 'primitive plane keeps its horizontal editor rotation' );
	vrodos_foundation_assert( 'true' === $procedural_ground->getAttribute( 'data-vrodos-navmesh' ), 'primitive plane defaults to a walkable navmesh' );
	vrodos_foundation_assert( 'navmesh' === $procedural_ground->getAttribute( 'data-vrodos-collision-role' ), 'primitive plane collision is a navigation surface' );
	vrodos_foundation_assert( 'walkable-surface' === $procedural_ground->getAttribute( 'data-vrodos-collision-category' ), 'primitive plane exposes its semantic collision category' );
	$plane_material = VRodos_Compiler_AFrame_DOM_Helper::parse_component_attribute( $procedural_ground->getAttribute( 'material' ) );
	vrodos_foundation_assert( '10 4' === $plane_material['repeat'], 'plane albedo repeats by metres per tile' );
	vrodos_foundation_assert( '10 4' === $plane_material['normalTextureRepeat'], 'plane normal map repeat stays aligned' );
	vrodos_foundation_assert( '10 4' === $plane_material['roughnessTextureRepeat'], 'plane roughness map repeat stays aligned' );
	vrodos_foundation_assert( '10 4' === $plane_material['ambientOcclusionTextureRepeat'], 'plane AO map repeat stays aligned' );
	vrodos_foundation_assert( '10 4' === $plane_material['metalnessTextureRepeat'], 'plane metalness map repeat stays aligned' );
	vrodos_foundation_assert( '0.75 -0.75' === $plane_material['normalScale'], 'DirectX normal packages invert the compiled normal Y scale' );
	vrodos_foundation_assert( $procedural_ground->hasAttribute( 'vrodos-stochastic-tiling' ), 'textured planes emit the stochastic PBR tiling component' );
	$variation = VRodos_Compiler_AFrame_DOM_Helper::parse_component_attribute( $procedural_ground->getAttribute( 'vrodos-stochastic-tiling' ) );
	vrodos_foundation_assert( '1.25' === ( $variation['patchTiles'] ?? '' ) && '4' === ( $variation['blendSharpness'] ?? '' ), 'compiled stochastic tiling preserves authored patch controls' );
	vrodos_foundation_assert( ! str_contains( $procedural_ground->getAttribute( 'material' ), 'displacement' ), 'stored displacement remains authoring-only' );
	vrodos_foundation_assert( 5 === $assets->getElementsByTagName( 'img' )->length, 'active plane PBR maps are emitted as A-Frame image assets' );
	$render_diagnostics = $renderer->build_compile_diagnostics( $dom );
	vrodos_foundation_assert( 1 === count( $render_diagnostics['warnings'] ?? [] ), 'unknown categories emit one diagnostic' );

	$profile_object = (object) [
		'category_slug' => 'decoration',
		'vrodosAssetOriginMode' => 'bounds-center',
		'asset_id' => 77,
		'glb_path' => '/published/low.glb',
		'desktop_profile_glb_urls' => (object) [
			'low' => '/published/low.glb',
			'medium' => '/published/medium.glb',
			'high' => '/published/high.glb',
		],
		'position' => [ 0, 0, 0 ],
		'rotation' => [ 0, 0, 0 ],
		'scale' => [ 1, 1, 1 ],
	];
	$adaptive_dom = new DOMDocument( '1.0', 'UTF-8' );
	$adaptive_scene = $adaptive_dom->createElement( 'a-scene' );
	$adaptive_assets = $adaptive_dom->createElement( 'a-assets' );
	$adaptive_dom->appendChild( $adaptive_scene );
	$adaptive_scene->appendChild( $adaptive_assets );
	$adaptive_renderer = new VRodos_Compiler_AFrame_Entity_Renderer( new VRodos_Compiler_Runtime_Assets(), new VRodos_Compiler_Scene_Repository(), static fn ( $url ) => $url );
	$adaptive_renderer->configure( '/plugin/', true, true, 'high' );
	$adaptive_renderer->render_scene_objects( $adaptive_dom, $adaptive_scene, $adaptive_assets, [ 'profiled' => $profile_object ], 1, 42, [ 'scene_settings' => [ 'vrRuntimeProfile' => 'desktop' ], 'container' => $adaptive_scene ] );
	$adaptive_xpath = new DOMXPath( $adaptive_dom );
	$adaptive_asset = $adaptive_xpath->query( '//*[@data-vrodos-profile-asset="true"]' )->item( 0 );
	$adaptive_entity = $adaptive_xpath->query( '//*[@vrodos-model-origin="bounds-center"]' )->item( 0 );
	vrodos_foundation_assert( $adaptive_asset instanceof DOMElement, 'Master client emits adaptive critical-asset attributes' );
	vrodos_foundation_assert( $adaptive_entity instanceof DOMElement, 'Master client renders the adaptive GLB entity' );
	vrodos_foundation_assert( 'bounds-center' === $adaptive_entity->getAttribute( 'vrodos-model-origin' ), 'adaptive GLBs keep the centered-origin component before profile selection' );
	vrodos_foundation_assert( '#' . $adaptive_asset->getAttribute( 'id' ) === $adaptive_entity->getAttribute( 'gltf-model' ), 'Master client points the entity at its selected critical asset' );
	vrodos_foundation_assert( '/published/medium.glb' === $adaptive_asset->getAttribute( 'data-vrodos-profile-src-medium' ), 'Master client carries the Medium derivative URL before download' );

	$fixed_dom = new DOMDocument( '1.0', 'UTF-8' );
	$fixed_scene_element = $fixed_dom->createElement( 'a-scene' );
	$fixed_assets = $fixed_dom->createElement( 'a-assets' );
	$fixed_dom->appendChild( $fixed_scene_element );
	$fixed_scene_element->appendChild( $fixed_assets );
	$fixed_renderer = new VRodos_Compiler_AFrame_Entity_Renderer( new VRodos_Compiler_Runtime_Assets(), new VRodos_Compiler_Scene_Repository(), static fn ( $url ) => $url );
	$fixed_renderer->configure( '/plugin/', true, false, 'medium' );
	$fixed_renderer->render_scene_objects( $fixed_dom, $fixed_scene_element, $fixed_assets, [ 'profiled' => $profile_object ], 1, 42, [ 'scene_settings' => [ 'vrRuntimeProfile' => 'desktop' ], 'container' => $fixed_scene_element ] );
	$fixed_markup = $fixed_dom->saveHTML();
	vrodos_foundation_assert( str_contains( $fixed_markup, 'vrodos-model-origin="bounds-center"' ), 'fixed-profile GLBs keep the centered-origin component' );
	vrodos_foundation_assert( str_contains( $fixed_markup, '/published/medium.glb' ), 'Simple/fixed renderer uses the selected Medium derivative' );
	vrodos_foundation_assert( ! str_contains( $fixed_markup, '/published/low.glb' ) && ! str_contains( $fixed_markup, '/published/high.glb' ), 'Simple/fixed renderer omits unselected derivative URLs' );

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
		'file' => $id . '.js',
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
		'schemaVersion' => 2,
		'runtimeRoot' => 'assets/js/runtime/master/lib',
		'chunks' => [
			'scene-components' => vrodos_foundation_chunk( 'scene-components', 10 ),
			'networked-components' => vrodos_foundation_chunk( 'networked-components', 15, [ 'networking' ] ),
			'core-runtime' => vrodos_foundation_chunk( 'core-runtime', 20 ),
			'collision-bvh-vendor' => vrodos_foundation_chunk( 'collision-bvh-vendor', 30, [ 'collision-bvh' ] ),
			'pmndrs-postfx' => vrodos_foundation_chunk( 'pmndrs-postfx', 40, [ 'postfx:pmndrs' ], [ 'core-runtime' ] ),
			'takram-atmosphere' => vrodos_foundation_chunk( 'takram-atmosphere', 50, [ 'atmosphere:takram', 'clouds:takram' ], [ 'pmndrs-postfx' ] ),
			'aframe-components' => vrodos_foundation_chunk( 'aframe-components', 90, [], [ 'core-runtime' ] ),
		],
	]
);
$plan_repository = new VRodos_Test_Plan_Scene_Repository();
$plan_flags      = new VRodos_Compiler_Runtime_Feature_Flags();
$plan_settings   = new VRodos_Compiler_Scene_Settings( $plan_repository, $plan_flags );
$plan_planner    = new VRodos_Compiler_Runtime_Script_Planner( $plan_manifest, $plan_flags );
$plan_resolver   = new VRodos_Compiler_Plan_Resolver( $plan_settings, $plan_planner );
$light_shaft_defaults = VRodos_Runtime_Settings_Contract::wire_settings_from_metadata( (object) [] );
vrodos_foundation_assert( 'true' === $light_shaft_defaults['pmndrsCloudsLightShaftsEnabled'], 'cloud light shafts default to enabled' );
$light_shaft_disabled = $plan_settings->build_settings(
	(object) [ 'aframePmndrsCloudsLightShaftsEnabled' => false ],
	(object) [ 'objects' => (object) [] ],
	9
);
vrodos_foundation_assert( 'false' === $light_shaft_disabled['pmndrsCloudsLightShaftsEnabled'], 'compiler preserves explicit cloud light shafts disable' );
vrodos_foundation_assert(
	str_contains( $plan_settings->serialize_settings( $light_shaft_disabled ), 'pmndrsCloudsLightShaftsEnabled: false' ),
	'compiler serializes cloud light shafts setting'
);
$scene_one = (object) [
	'metadata' => (object) [
		'aframeRuntimeMode' => 'single-player',
		'aframeVrRuntimeProfile' => 'desktop',
		'aframeRenderQuality' => 'high',
		'aframeHoveringInteractables' => true,
	],
	'objects' => (object) [
		'avatarCamera' => (object) [
			'position' => [ 0, 1.6, 0 ],
			'rotation' => [ 0, 0, 0 ],
		],
		'decoration0' => (object) [
			'category_name' => 'decoration',
			'asset_id' => 77,
			'follow_camera' => true,
		],
	],
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
$planned_decoration = $project_plan->scenes[0]->scene_json->objects->decoration0;
vrodos_foundation_assert( ! empty( $planned_decoration->uuid ), 'compile plan normalizes entity identity once' );
vrodos_foundation_assert( true === $planned_decoration->compiledCollisionEnabled, 'compile plan defaults decoration collision to enabled' );
vrodos_foundation_assert( ! property_exists( $planned_decoration, 'follow_camera' ), 'compile plan strips compatibility-only entity fields' );
vrodos_foundation_assert( ! property_exists( $scene_one->objects->decoration0, 'uuid' ), 'compile plan does not mutate source scene entities' );
vrodos_foundation_assert( ! property_exists( $scene_one->objects->decoration0, 'compiledCollisionEnabled' ), 'compile plan leaves source decoration collision metadata untouched' );
vrodos_foundation_assert( property_exists( $scene_one->objects->decoration0, 'follow_camera' ), 'source scene compatibility fields remain intact' );
vrodos_foundation_assert( ! property_exists( $project_plan->scenes[0]->scene_json->objects->avatarCamera, 'uuid' ), 'camera configuration is not normalized as an entity' );

$role_scene_one = (object) [
	'metadata' => (object) [],
	'objects' => (object) [
		'convertedWalkable' => (object) [
			'category_slug' => 'decoration',
			'sceneAssetRole' => 'walkable-surface',
			'asset_id' => 801,
			'compiledCollisionEnabled' => false,
		],
		'siblingDecoration' => (object) [
			'category_slug' => 'decoration',
			'asset_id' => 801,
			'compiledCollisionEnabled' => false,
		],
		'convertedDecoration' => (object) [
			'category_slug' => 'walkable-surface',
			'sceneAssetRole' => 'decoration',
			'asset_id' => 802,
			'compiledCollisionEnabled' => false,
		],
	],
];
$role_scene_two = (object) [
	'metadata' => (object) [],
	'objects' => (object) [
		'otherScenePlacement' => (object) [
			'category_slug' => 'decoration',
			'asset_id' => 801,
			'compiledCollisionEnabled' => false,
		],
	],
];
$role_plan = $plan_resolver->resolve(
	new VRodos_Compile_Request( 9, 201, [ 201, 202 ], 'single-player', 'desktop', true ),
	[
		'project_title' => 'Scene role fixture',
		'project_type_slug' => 'virtualproduction_games',
		'valid_scene_ids' => [ 201, 202 ],
		'scene_title' => [ 'Override', 'Inherited' ],
		'scene_json' => [ $role_scene_one, $role_scene_two ],
	]
);
$role_objects = $role_plan->scenes[0]->scene_json->objects;
vrodos_foundation_assert( 'walkable-surface' === $role_objects->convertedWalkable->category_slug, 'compile plan applies Decoration to Walkable override' );
vrodos_foundation_assert( 'decoration' === $role_objects->siblingDecoration->category_slug, 'two placements of one asset keep independent roles' );
vrodos_foundation_assert( 'decoration' === $role_objects->convertedDecoration->category_slug, 'compile plan applies Walkable to Decoration override' );
vrodos_foundation_assert( 'decoration' === $role_plan->scenes[1]->scene_json->objects->otherScenePlacement->category_slug, 'the same asset in another scene remains unchanged' );
vrodos_foundation_assert( 'decoration' === $role_scene_one->objects->convertedWalkable->category_slug, 'compile plan leaves the persisted source category untouched' );
$role_profile_assets = VRodos_Test_Desktop_Profile_Asset_Collector::collect( $role_plan->scenes[0]->scene_json );
$other_scene_profile_assets = VRodos_Test_Desktop_Profile_Asset_Collector::collect( $role_plan->scenes[1]->scene_json );
vrodos_foundation_assert( ! empty( $role_profile_assets[801]['protectGeometry'] ), 'converted walkable protects desktop-profile geometry' );
vrodos_foundation_assert( empty( $role_profile_assets[802]['protectGeometry'] ), 'converted decoration does not retain walkable geometry protection' );
vrodos_foundation_assert( empty( $other_scene_profile_assets[801]['protectGeometry'] ), 'geometry protection remains scene-specific' );

$link_publisher = new VRodos_Compiler_Link_Publisher(
	static fn ( int $project_id, string $filename, ?string $mode, string $runtime_mode ): string => $project_id . ':' . ( $mode ?: 'primary' ) . ':' . $runtime_mode . ':' . $filename,
	'both',
	'local'
);
$vrexpo_result = $link_publisher->publish( $project_plan, [] );
vrodos_foundation_assert( str_ends_with( $vrexpo_result->links['MasterClient'], 'Master_Client_101.html' ), 'VRExpo master link keeps first-scene convention' );
vrodos_foundation_assert( str_ends_with( $vrexpo_result->links['CurrentSceneMasterClient'], 'Master_Client_102.html' ), 'selected-scene master link is explicit' );
vrodos_foundation_assert( ! isset( $vrexpo_result->links['SimpleClient'] ), 'VRExpo omits Simple client link' );
vrodos_foundation_assert( isset( $vrexpo_result->to_public_payload()['artifacts'] ), 'public result exposes artifact summaries' );

$standard_plan = $plan_resolver->resolve(
	$project_plan->request,
	[
		'project_title' => 'Fixture',
		'project_type_slug' => 'virtualproduction_games',
		'valid_scene_ids' => [ 101, 102 ],
		'scene_title' => [ 'One', 'Two' ],
		'scene_json' => [ $scene_one, $scene_two ],
	]
);
$standard_result = $link_publisher->publish( $standard_plan, [] );
vrodos_foundation_assert( str_ends_with( $standard_result->links['MasterClient'], 'Master_Client_102.html' ), 'standard master link keeps last-scene convention' );
vrodos_foundation_assert( str_ends_with( $standard_result->links['index'], 'index_102.html' ), 'standard index filename remains stable' );
vrodos_foundation_assert( str_ends_with( $standard_result->links['SimpleClient'], 'Simple_Client_102.html' ), 'standard Simple filename remains stable' );
vrodos_foundation_assert( 6 === count( $standard_plan->targets ), 'networked standard plan declares Master/Simple/Index for every scene' );
vrodos_foundation_assert( 2 === count( $project_plan->targets ), 'VRExpo plan declares only Master targets' );
$simple_target = $standard_plan->target( VRodos_Runtime_Target_Plan::SIMPLE, 102 );
vrodos_foundation_assert( $simple_target instanceof VRodos_Runtime_Target_Plan, 'standard plan exposes selected Simple target' );
vrodos_foundation_assert( [ 'scene-components' ] === $simple_target->chunk_ids, 'Simple target preserves its lean dependency plan' );

$single_player_plan = $plan_resolver->resolve(
	new VRodos_Compile_Request( 9, 102, [ 101, 102 ], 'single-player', 'desktop', true ),
	[
		'project_title' => 'Fixture',
		'project_type_slug' => 'virtualproduction_games',
		'valid_scene_ids' => [ 101, 102 ],
		'scene_title' => [ 'One', 'Two' ],
		'scene_json' => [ $scene_one, $scene_two ],
	]
);
vrodos_foundation_assert( 2 === count( $single_player_plan->targets ), 'single-player plan declares one Master target per scene' );
foreach ( $single_player_plan->targets as $target ) {
	vrodos_foundation_assert( VRodos_Runtime_Target_Plan::MASTER === $target->kind, 'single-player target matrix excludes network companion pages' );
	vrodos_foundation_assert( ! in_array( 'networked-components', $target->chunk_ids, true ), 'single-player target excludes network chunk' );
}
$desktop_profiles = $single_player_plan->scenes[0]->desktop_profiles;
vrodos_foundation_assert( 2 === $desktop_profiles['schemaVersion'], 'desktop profiles use schema v2' );
vrodos_foundation_assert( 'custom' === $desktop_profiles['buildMode'], 'desktop profiles default to Custom-only build mode' );
vrodos_foundation_assert( 'custom' === $desktop_profiles['defaultProfile'], 'default desktop builds select the Custom cache identity' );
vrodos_foundation_assert( isset( $desktop_profiles['profiles']['custom'] ), 'desktop profiles include the independently cached Custom build' );
vrodos_foundation_assert( 'performance' === $desktop_profiles['profiles']['low']['settings']['renderQuality'], 'Low preset uses performance render quality' );
vrodos_foundation_assert( 'standard' === $desktop_profiles['profiles']['medium']['settings']['renderQuality'], 'Medium preset uses standard render quality' );
vrodos_foundation_assert( 'high' === $desktop_profiles['profiles']['high']['settings']['renderQuality'], 'High preset remains the visual maximum' );
vrodos_foundation_assert( 'false' === $desktop_profiles['profiles']['low']['settings']['pmndrsCloudsEnabled'], 'Low does not enable clouds absent from High' );
vrodos_foundation_assert( 'false' === $desktop_profiles['profiles']['medium']['settings']['pmndrsCloudsEnabled'], 'Medium does not enable clouds absent from High' );
vrodos_foundation_assert( [] === VRodos_Desktop_Performance_Profiles::validate_monotonic( $desktop_profiles ), 'desktop preset defaults are monotonic' );
$invalid_desktop_profiles = $desktop_profiles;
$invalid_desktop_profiles['buildMode'] = 'adaptive';
$invalid_desktop_profiles['profiles']['low']['settings']['shadowQuality'] = 'high';
vrodos_foundation_assert( [] !== VRodos_Desktop_Performance_Profiles::validate_monotonic( $invalid_desktop_profiles ), 'desktop profile validation rejects a lower slot that exceeds Medium' );

$cloud_scene = json_decode( wp_json_encode( $scene_one ) );
$cloud_scene->metadata->aframePostFXEngine = 'pmndrs';
$cloud_scene->metadata->aframePostFXEnabled = true;
$cloud_scene->metadata->aframePmndrsAtmosphereEnabled = true;
$cloud_scene->metadata->aframePmndrsAtmosphereQuality = 'cinematic';
$cloud_scene->metadata->aframePmndrsCloudsEnabled = true;
$cloud_scene->metadata->aframePmndrsCloudsLightShaftsEnabled = true;
$cloud_scene->metadata->aframePmndrsCloudsQuality = 'ultra';
$cloud_plan = $plan_resolver->resolve(
	new VRodos_Compile_Request( 9, 101, [ 101 ], 'single-player', 'desktop', true ),
	[
		'project_title' => 'Cloud fixture',
		'project_type_slug' => 'virtualproduction_games',
		'valid_scene_ids' => [ 101 ],
		'scene_title' => [ 'Clouds' ],
		'scene_json' => [ $cloud_scene ],
	]
);
$cloud_profiles = $cloud_plan->scenes[0]->desktop_profiles['profiles'];
vrodos_foundation_assert( 'true' === $cloud_profiles['low']['settings']['pmndrsAtmosphereEnabled'], 'Low keeps authored atmosphere enabled' );
vrodos_foundation_assert( 'performance' === $cloud_profiles['low']['settings']['pmndrsAtmosphereQuality'], 'Low caps atmosphere at Performance quality' );
vrodos_foundation_assert( 'true' === $cloud_profiles['medium']['settings']['pmndrsAtmosphereEnabled'], 'Medium keeps authored atmosphere enabled' );
vrodos_foundation_assert( 'balanced' === $cloud_profiles['medium']['settings']['pmndrsAtmosphereQuality'], 'Medium caps atmosphere at Balanced quality' );
vrodos_foundation_assert( 'true' === $cloud_profiles['low']['settings']['pmndrsCloudsEnabled'], 'Low keeps authored clouds enabled' );
vrodos_foundation_assert( 'low' === $cloud_profiles['low']['settings']['pmndrsCloudsQuality'], 'Low caps clouds at Low quality' );
vrodos_foundation_assert( 'false' === $cloud_profiles['low']['settings']['pmndrsCloudsLightShaftsEnabled'], 'Low disables cloud light shafts' );
vrodos_foundation_assert( 'medium' === $cloud_profiles['medium']['settings']['pmndrsCloudsQuality'], 'Medium caps clouds at Medium quality' );
vrodos_foundation_assert( 'false' === $cloud_profiles['medium']['settings']['pmndrsCloudsLightShaftsEnabled'], 'Medium disables cloud light shafts' );
vrodos_foundation_assert( 'true' === $cloud_profiles['high']['settings']['pmndrsCloudsLightShaftsEnabled'], 'High preserves authored cloud light shafts' );

$fixed_scene = json_decode( wp_json_encode( $scene_one ) );
$fixed_scene->metadata->desktopPerformanceProfiles = (object) [
	'schemaVersion' => 1,
	'activeProfile' => 'medium',
	'autoSelect' => false,
	'profiles' => (object) [
		'medium' => (object) [
			'presetSettings' => (object) [ 'renderQuality' => 'standard' ],
			'settings' => (object) [ 'renderQuality' => 'performance' ],
		],
	],
];
$fixed_plan = $plan_resolver->resolve(
	new VRodos_Compile_Request( 9, 101, [ 101 ], 'single-player', 'desktop', true ),
	[
		'project_title' => 'Fixed fixture',
		'project_type_slug' => 'virtualproduction_games',
		'valid_scene_ids' => [ 101 ],
		'scene_title' => [ 'Fixed' ],
		'scene_json' => [ $fixed_scene ],
	]
);
$fixed_profiles = $fixed_plan->scenes[0]->desktop_profiles;
vrodos_foundation_assert( 'custom' === $fixed_profiles['buildMode'], 'v1 fixed build migrates to Custom-only mode' );
vrodos_foundation_assert( 'custom' === $fixed_profiles['defaultProfile'], 'Custom-only build selects the Custom cache identity' );
vrodos_foundation_assert( 'performance' === $fixed_profiles['profiles']['custom']['settings']['renderQuality'], 'v1 selected tier quality migrates into Custom' );
vrodos_foundation_assert( isset( $fixed_profiles['profiles']['custom']['chunkIds'] ), 'Custom-only build plans the Custom chunk set' );
vrodos_foundation_assert( ! isset( $fixed_profiles['profiles']['low']['chunkIds'] ), 'Custom-only build does not plan Low chunks' );
vrodos_foundation_assert( ! isset( $fixed_profiles['profiles']['medium']['chunkIds'] ), 'Custom-only build does not plan Medium chunks' );
vrodos_foundation_assert( ! isset( $fixed_profiles['profiles']['high']['chunkIds'] ), 'Custom-only build does not plan High chunks' );

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
	new VRodos_Compile_Artifact( 'Master_Client_2.html', 'new-scene-master', 'master', 2 ),
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
vrodos_foundation_assert( 'new-scene-master' === file_get_contents( $test_dir . DIRECTORY_SEPARATOR . 'Master_Client_2.html' ), 'second scene transaction commit' );

$stale_rollback_transaction = new VRodos_Compiler_Artifact_Transaction(
	$test_dir,
	static function ( VRodos_Compile_Artifact $artifact, int $committed ): void {
		if ( 0 === $committed ) {
			throw new RuntimeException( 'Injected stale cleanup failure.' );
		}
	}
);
try {
	$stale_rollback_transaction->commit( 99, [ new VRodos_Compile_Artifact( 'Master_Client_1.html', 'latest-master', 'master', 1 ) ] );
	vrodos_foundation_assert( false, 'stale cleanup rollback injection' );
} catch ( RuntimeException $error ) {
	vrodos_foundation_assert( 'new-master' === file_get_contents( $test_dir . DIRECTORY_SEPARATOR . 'Master_Client_1.html' ), 'replacement restored after stale cleanup rollback' );
	vrodos_foundation_assert( 'new-simple' === file_get_contents( $test_dir . DIRECTORY_SEPARATOR . 'Simple_Client_1.html' ), 'stale artifact restored after rollback' );
	vrodos_foundation_assert( 'new-scene-master' === file_get_contents( $test_dir . DIRECTORY_SEPARATOR . 'Master_Client_2.html' ), 'removed scene artifact restored after rollback' );
}

( new VRodos_Compiler_Artifact_Transaction( $test_dir ) )->commit(
	99,
	[ new VRodos_Compile_Artifact( 'Master_Client_1.html', 'latest-master', 'master', 1 ) ]
);
vrodos_foundation_assert( ! is_file( $test_dir . DIRECTORY_SEPARATOR . 'Simple_Client_1.html' ), 'stale Simple client removed from project inventory' );
vrodos_foundation_assert( ! is_file( $test_dir . DIRECTORY_SEPARATOR . 'Master_Client_2.html' ), 'removed scene artifact removed from project inventory' );
$inventory = json_decode( (string) file_get_contents( $test_dir . DIRECTORY_SEPARATOR . '.manifests' . DIRECTORY_SEPARATOR . 'project-99.json' ), true );
vrodos_foundation_assert( [ 'Master_Client_1.html' ] === $inventory['artifacts'], 'project artifact inventory records the complete published set' );

$lock_path = $test_dir . DIRECTORY_SEPARATOR . '.locks' . DIRECTORY_SEPARATOR . 'project-99.lock';
$held_lock = fopen( $lock_path, 'c+' );
vrodos_foundation_assert( is_resource( $held_lock ) && flock( $held_lock, LOCK_EX | LOCK_NB ), 'fixture acquires project compile lock' );
try {
	( new VRodos_Compiler_Artifact_Transaction( $test_dir ) )->commit(
		99,
		[ new VRodos_Compile_Artifact( 'Master_Client_1.html', 'blocked-master', 'master', 1 ) ]
	);
	vrodos_foundation_assert( false, 'concurrent compile rejection' );
} catch ( RuntimeException $error ) {
	vrodos_foundation_assert( 409 === $error->getCode(), 'concurrent compile reports conflict' );
} finally {
	flock( $held_lock, LOCK_UN );
	fclose( $held_lock );
}
vrodos_foundation_remove_tree( $test_dir );

echo "Compiler plan foundation tests passed.\n";
