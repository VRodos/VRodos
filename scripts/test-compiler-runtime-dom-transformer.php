<?php

define( 'ABSPATH', __DIR__ );

require_once __DIR__ . '/../includes/class-vrodos-compiler-runtime-dom-transformer.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-template-renderer.php';

function vrodos_dom_transformer_assert( bool $condition, string $message ): void {
	if ( $condition ) {
		return;
	}

	fwrite( STDERR, $message . "\n" );
	exit( 1 );
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

$renderer = new VRodos_Compiler_Template_Renderer();
$threw   = false;
try {
	$renderer->read_file( __DIR__ . '/missing-runtime-template.fixture.html' );
} catch ( RuntimeException $error ) {
	$threw = str_contains( $error->getMessage(), 'Compiler template read failed' );
}
vrodos_dom_transformer_assert( $threw, 'missing runtime templates should fail explicitly' );

echo "Runtime DOM transformer fixtures passed.\n";
