<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Compiler_Runtime_DOM_Transformer {
	private const SINGLE_PLAYER_SCRIPT_NEEDLES = [
		'socket.io',
		'easyrtc.js',
		'networked-aframe',
		'chat_component.js',
		'vrodos-runtime-networked-components',
	];

	private const NETWORKED_ATTRIBUTES = [
		'networked',
		'networked-audio-source',
		'networked-video-source',
		'chat-poi',
		'indicator-availability',
	];

	private const HIDDEN_SINGLE_PLAYER_ELEMENT_IDS = [
		'chat-wrapper-el',
		'obtainStatusAndSetSizeControls',
		'screen-btn-sendscreen',
	];

	public function apply_single_player_mode( DOMDocument $dom, DOMElement $ascene ): void {
		$ascene->removeAttribute( 'networked-scene' );

		$this->remove_scripts_containing( $dom, self::SINGLE_PLAYER_SCRIPT_NEEDLES );

		foreach ( self::NETWORKED_ATTRIBUTES as $attribute ) {
			$this->remove_attribute_everywhere( $dom, $attribute );
		}

		foreach ( self::HIDDEN_SINGLE_PLAYER_ELEMENT_IDS as $element_id ) {
			$this->hide_dom_element( $dom->getElementById( $element_id ) );
		}

		$this->remove_dom_element( $dom->getElementById( 'avatar-selection-dialog' ) );

		$occupants = $dom->getElementById( 'occupantsNumberShow' );
		if ( $occupants instanceof DOMElement && $occupants->parentNode instanceof DOMElement ) {
			$this->hide_dom_element( $occupants->parentNode );
		}

		$room = $dom->getElementById( 'roomNameShow' );
		if ( $room instanceof DOMElement ) {
			$room->nodeValue = 'single-player';
		}
	}

	private function remove_dom_element( ?DOMElement $element ): void {
		if ( ! $element instanceof DOMElement || ! $element->parentNode ) {
			return;
		}

		$element->parentNode->removeChild( $element );
	}

	private function remove_scripts_containing( DOMDocument $dom, array $needles ): void {
		$remove = [];
		foreach ( $dom->getElementsByTagName( 'script' ) as $script ) {
			if ( ! $script instanceof DOMElement || ! $script->hasAttribute( 'src' ) ) {
				continue;
			}

			$src = $script->getAttribute( 'src' );
			foreach ( $needles as $needle ) {
				if ( str_contains( $src, (string) $needle ) ) {
					$remove[] = $script;
					break;
				}
			}
		}

		foreach ( $remove as $script ) {
			if ( $script->parentNode ) {
				$script->parentNode->removeChild( $script );
			}
		}
	}

	private function remove_attribute_everywhere( DOMDocument $dom, string $attribute ): void {
		foreach ( $dom->getElementsByTagName( '*' ) as $element ) {
			if ( $element instanceof DOMElement && $element->hasAttribute( $attribute ) ) {
				$element->removeAttribute( $attribute );
			}
		}
	}

	private function hide_dom_element( ?DOMElement $element ): void {
		if ( ! $element instanceof DOMElement ) {
			return;
		}

		$style = trim( $element->getAttribute( 'style' ) );
		$style = '' === $style ? '' : rtrim( $style, ';' ) . '; ';
		$element->setAttribute( 'style', $style . 'display: none; visibility: hidden;' );
		$element->setAttribute( 'data-visible', 'false' );
	}
}
