<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Applies target-specific DOM fragments to the neutral runtime template. */
final class VRodos_Compiler_Target_Renderer {
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

	public function apply_player_rig( DOMDocument $dom, DOMElement $player, string $project_type, string $camera_position, bool $networked, bool $lean_headset ): void {
		$player->setAttribute( 'custom-movement', '' );
		if ( ! $lean_headset ) {
			$player->setAttribute( 'show-position', '' );
		}
		if ( 'vrexpo_games' === $project_type ) {
			$this->apply_vrexpo_rig( $dom, $player, $camera_position, $networked, $lean_headset );
			return;
		}
		$this->apply_standard_rig( $dom, $player, $camera_position, $networked );
	}

	public function apply_networking( DOMDocument $dom ): void {
		$avatar_template = $dom->getElementById( 'avatar-template' );
		$avatar = $avatar_template instanceof DOMElement ? $avatar_template->getElementsByTagName( 'a-entity' )->item( 0 ) : null;
		if ( $avatar instanceof DOMElement ) {
			$avatar->setAttribute( 'networked-audio-source', '' );
		}
		$targets = [
			'videoPlaneGreen' => 'useGreenScreen: true; greenThreshold: 0.04; streamName: video',
			'screenPlane'     => 'streamName:screen',
		];
		foreach ( $targets as $id => $value ) {
			$element = $dom->getElementById( $id );
			if ( $element instanceof DOMElement ) $element->setAttribute( 'networked-video-source', $value );
		}
	}

	public function apply_single_player_mode( DOMDocument $dom, DOMElement $ascene ): void {
		$ascene->removeAttribute( 'networked-scene' );
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

	public function apply_lean_headset_mode( DOMElement $ascene, array $scene_settings ): void {
		if ( ! $this->uses_legacy_environment_background( $scene_settings ) ) {
			$ascene->removeAttribute( 'environment' );
		}
	}

	public function uses_legacy_environment_background( array $scene_settings ): bool {
		$background_choice = (string) ( $scene_settings['selChoice'] ?? '0' );
		if ( '2' === $background_choice ) {
			return 'ocean' !== strtolower( trim( (string) ( $scene_settings['presChoice'] ?? '' ) ) );
		}
		if ( '0' === $background_choice ) {
			return ! (
				'pmndrs' === strtolower( trim( (string) ( $scene_settings['postFXEngine'] ?? '' ) ) ) &&
				$this->setting_bool( $scene_settings, 'pmndrsAtmosphereEnabled' )
			);
		}

		return false;
	}

	private function apply_vrexpo_rig( DOMDocument $dom, DOMElement $player, string $camera_position, bool $networked, bool $lean_headset ): void {
		$camera = $dom->createElement( 'a-camera' );
		$camera->setAttribute( 'camera', 'active: true; near: 0.1; far: 7000; fov: 60' );
		$camera->setAttribute( 'id', 'cameraA' );
		$camera->setAttribute( 'position', $camera_position );
		if ( $networked ) $camera->setAttribute( 'networked', 'template:#avatar-template-expo;attachTemplateToLocal:false' );
		$camera->setAttribute( 'player-info', '' );
		$camera->setAttribute( 'avatar-movement-info', '' );
		$camera->setAttribute( 'look-controls', '' );
		if ( ! $lean_headset ) $camera->setAttribute( 'entity-movement-emitter', '' );
		$camera->appendChild( $this->create_cursor( $dom ) );
		$player->appendChild( $camera );
		$player->appendChild( $this->create_controller( $dom, 'oculusRight', 'right' ) );
		$player->appendChild( $this->create_controller( $dom, 'oculusLeft', 'left' ) );
	}

	private function apply_standard_rig( DOMDocument $dom, DOMElement $player, string $camera_position, bool $networked ): void {
		$player->setAttribute( 'position', $camera_position );
		if ( $networked ) $player->setAttribute( 'networked', 'template:#avatar-template;attachTemplateToLocal:false;' );
		$player->setAttribute( 'wasd-controls', 'fly:false; acceleration:20' );
		$player->setAttribute( 'look-controls', 'pointerLockEnabled: false' );
		$camera = $dom->createElement( 'a-entity' );
		$camera->setAttribute( 'id', 'cameraA' );
		$camera->setAttribute( 'active', 'true' );
		$camera->setAttribute( 'camera', 'near: 0.1; far: 7000.0;' );
		$camera->setAttribute( 'position', '0 0 0' );
		if ( $networked ) $camera->setAttribute( 'networked', 'template:#avatar-template-expo;attachTemplateToLocal:false' );
		$camera->setAttribute( 'player-info', '' );
		$camera->setAttribute( 'avatar-movement-info', '' );
		$camera->appendChild( $this->create_cursor( $dom ) );
		$player->appendChild( $camera );
	}

	private function create_cursor( DOMDocument $dom ): DOMElement {
		$cursor = $dom->createElement( 'a-entity' );
		$cursor->setAttribute( 'id', 'cursor' );
		$cursor->setAttribute( 'cursor', 'rayOrigin: mouse; fuse: false' );
		$cursor->setAttribute( 'raycaster', 'objects: .raycastable' );
		return $cursor;
	}

	private function create_controller( DOMDocument $dom, string $id, string $hand ): DOMElement {
		$controller = $dom->createElement( 'a-entity' );
		$controller->setAttribute( 'id', $id );
		$controller->setAttribute( 'laser-controls', 'hand: ' . $hand );
		$controller->setAttribute( 'raycaster', 'objects: .raycastable' );
		return $controller;
	}

	private function setting_bool( array $settings, string $key ): bool {
		$value = $settings[ $key ] ?? false;
		return is_bool( $value )
			? $value
			: ! in_array( strtolower( trim( (string) $value ) ), [ '', '0', 'false', 'no', 'off' ], true );
	}

	private function remove_dom_element( ?DOMElement $element ): void {
		if ( $element instanceof DOMElement && $element->parentNode ) {
			$element->parentNode->removeChild( $element );
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
