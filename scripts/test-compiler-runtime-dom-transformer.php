<?php

define( 'ABSPATH', __DIR__ );

if ( ! function_exists( 'absint' ) ) {
	function absint( $value ): int {
		return abs( (int) $value );
	}
}

if ( ! function_exists( 'apply_filters' ) ) {
	function apply_filters( $hook_name, $value ) {
		return $value;
	}
}

require_once __DIR__ . '/../includes/class-vrodos-compiler-runtime-dom-transformer.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-template-renderer.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-runtime-assets.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-aframe-dom-helper.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-runtime-page-builder.php';

class VRodos_Test_Template_Renderer extends VRodos_Compiler_Template_Renderer {
	public function read_runtime_template( string $filename ): string {
		return $this->read_file( __DIR__ . '/../templates/runtime/aframe/' . ltrim( $filename, '/\\' ) );
	}
}

class VRodos_Test_Runtime_Assets extends VRodos_Compiler_Runtime_Assets {
	public function redirect_runtime_template_urls( string $content ): string {
		return $content;
	}
}

function vrodos_dom_transformer_assert( bool $condition, string $message ): void {
	if ( $condition ) {
		return;
	}

	fwrite( STDERR, $message . "\n" );
	exit( 1 );
}

function vrodos_runtime_page_builder_fixture(): VRodos_Compiler_Runtime_Page_Builder {
	$reflection = new ReflectionClass( VRodos_Compiler_Runtime_Page_Builder::class );
	$builder    = $reflection->newInstanceWithoutConstructor();

	foreach (
		[
			'runtime_assets'    => new VRodos_Test_Runtime_Assets(),
			'template_renderer' => new VRodos_Test_Template_Renderer(),
		] as $property_name => $value
	) {
		$property = $reflection->getProperty( $property_name );
		$property->setAccessible( true );
		$property->setValue( $builder, $value );
	}

	return $builder;
}

$dom = new DOMDocument( '1.0', 'UTF-8' );
@$dom->loadHTML(
	'<!doctype html><html><body>' .
	'<a-scene id="aframe-scene-container" networked-scene="room: room42">' .
	'<script src="socket.io.js"></script>' .
	'<script src="easyrtc.js"></script>' .
	'<script src="networked-aframe.min.js"></script>' .
	'<script src="js/master/lib/vrodos-runtime-networked-components.bundle.js"></script>' .
	'<script src="js/master/lib/vrodos-runtime-scene-components.bundle.js"></script>' .
	'<a-entity id="player" networked="template:#avatar" networked-audio-source="true">' .
	'<a-entity id="cameraA" networked-video-source="true" chat-poi="true" indicator-availability="true"></a-entity>' .
	'</a-entity>' .
	'<div id="chat-wrapper-el"></div>' .
	'<button id="obtainStatusAndSetSizeControls"></button>' .
	'<button id="screen-btn-sendscreen"></button>' .
	'<div id="avatar-selection-dialog"></div>' .
	'<div id="occupants-wrapper"><span id="occupantsNumberShow">3</span></div>' .
	'<span id="roomNameShow">room42</span>' .
	'</a-scene>' .
	'</body></html>',
	LIBXML_HTML_NOIMPLIED | LIBXML_NOBLANKS | LIBXML_NOERROR
);

$ascene = $dom->getElementById( 'aframe-scene-container' );
vrodos_dom_transformer_assert( $ascene instanceof DOMElement, 'fixture scene missing' );

$transformer = new VRodos_Compiler_Runtime_DOM_Transformer();
$transformer->apply_single_player_mode( $dom, $ascene );

$html = $dom->saveHTML();
vrodos_dom_transformer_assert( ! $ascene->hasAttribute( 'networked-scene' ), 'single-player scene should not keep networked-scene' );
foreach ( [ 'socket.io', 'easyrtc.js', 'networked-aframe', 'vrodos-runtime-networked-components' ] as $needle ) {
	vrodos_dom_transformer_assert( ! str_contains( $html, $needle ), 'single-player scene should remove script containing ' . $needle );
}
foreach ( [ 'networked', 'networked-audio-source', 'networked-video-source', 'chat-poi', 'indicator-availability' ] as $attribute ) {
	vrodos_dom_transformer_assert( ! str_contains( $html, $attribute . '=' ), 'single-player scene should remove ' . $attribute . ' attributes' );
}
foreach ( [ 'chat-wrapper-el', 'obtainStatusAndSetSizeControls', 'screen-btn-sendscreen' ] as $element_id ) {
	$element = $dom->getElementById( $element_id );
	vrodos_dom_transformer_assert( $element instanceof DOMElement, $element_id . ' should remain for layout compatibility' );
	vrodos_dom_transformer_assert( 'false' === $element->getAttribute( 'data-visible' ), $element_id . ' should be hidden' );
	vrodos_dom_transformer_assert( str_contains( $element->getAttribute( 'style' ), 'display: none' ), $element_id . ' hidden style missing' );
}
vrodos_dom_transformer_assert( null === $dom->getElementById( 'avatar-selection-dialog' ), 'avatar selection dialog should be removed' );
vrodos_dom_transformer_assert( 'single-player' === $dom->getElementById( 'roomNameShow' )->nodeValue, 'room name should become single-player' );
vrodos_dom_transformer_assert( 'false' === $dom->getElementById( 'occupants-wrapper' )->getAttribute( 'data-visible' ), 'occupants wrapper should be hidden' );
vrodos_dom_transformer_assert( str_contains( $html, 'vrodos-runtime-scene-components.bundle.js' ), 'non-networked runtime scripts should remain' );

$helper_dom = new DOMDocument( '1.0', 'UTF-8' );
@$helper_dom->loadHTML( '<a-scene id="scene"><a-entity id="existing"></a-entity></a-scene>', LIBXML_HTML_NOIMPLIED | LIBXML_NOBLANKS | LIBXML_NOERROR );
$helper_scene = $helper_dom->getElementById( 'scene' );
vrodos_dom_transformer_assert( $helper_scene instanceof DOMElement, 'helper fixture scene missing' );
$assets = VRodos_Compiler_AFrame_DOM_Helper::get_or_create_assets_container( $helper_dom, $helper_scene );
vrodos_dom_transformer_assert( $assets instanceof DOMElement && 'a-assets' === $assets->tagName, 'helper should create a-assets' );
vrodos_dom_transformer_assert( $helper_scene->firstChild === $assets, 'helper should insert a-assets before scene children' );
vrodos_dom_transformer_assert( (string) VRodos_Compiler_Runtime_Assets::aframe_asset_timeout_ms() === $assets->getAttribute( 'timeout' ), 'helper should set a-assets timeout' );
vrodos_dom_transformer_assert( $assets === VRodos_Compiler_AFrame_DOM_Helper::get_or_create_assets_container( $helper_dom, $helper_scene ), 'helper should reuse existing a-assets' );

$component_attr = VRodos_Compiler_AFrame_DOM_Helper::parse_component_attribute( 'antialias: true; stencil: false; logarithmicDepthBuffer' );
vrodos_dom_transformer_assert( 'true' === $component_attr['antialias'], 'helper should parse component key/value attrs' );
vrodos_dom_transformer_assert( 'false' === $component_attr['stencil'], 'helper should parse component false attrs' );
vrodos_dom_transformer_assert( 'true' === $component_attr['logarithmicDepthBuffer'], 'helper should parse bare component flags' );
vrodos_dom_transformer_assert(
	'antialias: true; stencil: false;' === VRodos_Compiler_AFrame_DOM_Helper::serialize_component_attribute( [
		'antialias' => 'true',
		'stencil'   => 'false',
	] ),
	'helper should serialize component attrs'
);

$transform = $helper_dom->createElement( 'a-entity' );
VRodos_Compiler_AFrame_DOM_Helper::apply_transform(
	$transform,
	(object) [
		'position' => [ 1, 2, 3 ],
		'rotation' => [ pi() / 2, pi(), -pi() / 4 ],
		'scale'    => [ 2, 3, 4 ],
	]
);
vrodos_dom_transformer_assert( '1 2 3' === $transform->getAttribute( 'position' ), 'helper should write position attributes' );
vrodos_dom_transformer_assert( '-90 180 -45' === $transform->getAttribute( 'rotation' ), 'helper should write compiled rotation attributes' );
vrodos_dom_transformer_assert( '2 3 4' === $transform->getAttribute( 'scale' ), 'helper should write scale attributes' );
VRodos_Compiler_AFrame_DOM_Helper::append_class( $transform, 'raycastable' );
VRodos_Compiler_AFrame_DOM_Helper::append_class( $transform, 'raycastable' );
vrodos_dom_transformer_assert( 'raycastable' === $transform->getAttribute( 'class' ), 'helper should append classes once' );
VRodos_Compiler_AFrame_DOM_Helper::apply_collision_attributes( $transform, 'mesh', 'solid', 'collision-proxy', 'object-1', true, 'cast: false; receive: false' );
vrodos_dom_transformer_assert( 'raycastable vrodos-collider' === $transform->getAttribute( 'class' ), 'helper should append collider class' );
vrodos_dom_transformer_assert( 'collision-proxy' === $transform->getAttribute( 'data-vrodos-collision-category' ), 'helper should write collision category' );
vrodos_dom_transformer_assert( 'true' === $transform->getAttribute( 'data-vrodos-collision-hidden' ), 'helper should write hidden collision marker' );
vrodos_dom_transformer_assert( 'cast: false; receive: false' === $transform->getAttribute( 'shadow' ), 'helper should write hidden collision shadow attr' );
VRodos_Compiler_AFrame_DOM_Helper::apply_world_lighting_attributes( $transform, 'receiver', 'cast: false; receive: true' );
vrodos_dom_transformer_assert( 'receiver' === $transform->getAttribute( 'data-vrodos-shadow-role' ), 'helper should write world lighting shadow role' );
VRodos_Compiler_AFrame_DOM_Helper::apply_overlay_ui_attributes( $transform );
vrodos_dom_transformer_assert( 'true' === $transform->getAttribute( 'data-vrodos-overlay-ui' ), 'helper should write overlay UI marker' );
vrodos_dom_transformer_assert(
	'src: #image; side: double; roughness: 0.85; metalness: 0; depthTest: true; depthWrite: true; transparent: true; alphaTest: 0.5' === VRodos_Compiler_AFrame_DOM_Helper::world_media_material( '#image' ),
	'helper should build media material attrs'
);

$renderer = new VRodos_Compiler_Template_Renderer();
$threw   = false;
try {
	$renderer->read_file( __DIR__ . '/missing-runtime-template.fixture.html' );
} catch ( RuntimeException $error ) {
	$threw = str_contains( $error->getMessage(), 'Compiler template read failed' );
}
vrodos_dom_transformer_assert( $threw, 'missing runtime templates should fail explicitly' );

$runtime_page_build = vrodos_runtime_page_builder_fixture();

foreach ( [ 'Master_Client_prototype.html', 'Simple_Client_prototype.html' ] as $template_name ) {
	$prepared_template = $runtime_page_build->prepare_template(
		$template_name,
		[
			'AFRAME_RUNTIME_URL_PLACEHOLDER'    => 'aframe-test.js',
			'VRODOS_RUNTIME_SCRIPTS_PLACEHOLDER' => '',
			'VRODOS_RUNTIME_MODE_PLACEHOLDER'   => 'single-player',
			'VRODOS_PLUGIN_URL_PLACEHOLDER'     => '/wp-content/plugins/VRodos/',
		]
	);

	vrodos_dom_transformer_assert( ! str_contains( $prepared_template, 'VRODOS_WEBXR_LAYER_SHIM_PLACEHOLDER' ), $template_name . ' should replace the WebXR shim placeholder' );
	vrodos_dom_transformer_assert( str_contains( $prepared_template, 'window.__VRODOS_WEBXR_LAYER_SHIM_ACTIVE' ), $template_name . ' should include the shared WebXR shim' );
	vrodos_dom_transformer_assert( str_contains( $prepared_template, 'XRWebGLBinding' ), $template_name . ' should include the WebXR layer compatibility guard' );

	$shim_position   = strpos( $prepared_template, 'window.__VRODOS_WEBXR_LAYER_SHIM_ACTIVE' );
	$aframe_position = strpos( $prepared_template, 'aframe-test.js' );
	vrodos_dom_transformer_assert( false !== $shim_position && false !== $aframe_position && $shim_position < $aframe_position, $template_name . ' should install the WebXR shim before A-Frame' );
}

echo "Runtime DOM transformer fixtures passed.\n";
