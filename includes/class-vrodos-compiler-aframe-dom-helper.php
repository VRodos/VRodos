<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Compiler_AFrame_DOM_Helper {
	public static function get_or_create_assets_container( DOMDocument $dom, DOMElement $ascene ): DOMElement {
		$a_asset = $dom->getElementsByTagName( 'a-assets' )->item( 0 );
		if ( ! $a_asset instanceof DOMElement ) {
			$a_asset = $dom->createElement( 'a-assets' );
			if ( $ascene->firstChild ) {
				$ascene->insertBefore( $a_asset, $ascene->firstChild );
			} else {
				$ascene->appendChild( $a_asset );
			}
		}

		$a_asset->setAttribute( 'timeout', VRodos_Compiler_Runtime_Assets::aframe_asset_timeout_ms() );
		return $a_asset;
	}

	public static function parse_component_attribute( string $attribute ): array {
		$values = [];
		foreach ( explode( ';', $attribute ) as $entry ) {
			$entry = trim( $entry );
			if ( '' === $entry ) {
				continue;
			}

			$separator = strpos( $entry, ':' );
			if ( false === $separator ) {
				$values[ $entry ] = 'true';
				continue;
			}

			$key = trim( substr( $entry, 0, $separator ) );
			if ( '' !== $key ) {
				$values[ $key ] = trim( substr( $entry, $separator + 1 ) );
			}
		}

		return $values;
	}

	public static function serialize_component_attribute( array $values ): string {
		$parts = [];
		foreach ( $values as $key => $value ) {
			$parts[] = $key . ': ' . $value;
		}

		return implode( '; ', $parts ) . ';';
	}

	public static function apply_transform( DOMElement $entity, $content_object, bool $preserve_editor_rotation = false ): void {
		$entity->setAttribute( 'position', self::vector_attribute( $content_object->position ) );
		$entity->setAttribute( 'rotation', self::rotation_attribute( $content_object->rotation, $preserve_editor_rotation ) );
		$entity->setAttribute( 'scale', self::vector_attribute( $content_object->scale ) );
	}

	public static function append_class( DOMElement $entity, string $class_name ): void {
		$class_name = trim( $class_name );
		if ( '' === $class_name ) {
			return;
		}

		$current = preg_split( '/\s+/', trim( $entity->getAttribute( 'class' ) ) ) ?: [];
		if ( ! in_array( $class_name, $current, true ) ) {
			$current[] = $class_name;
		}

		$entity->setAttribute( 'class', trim( implode( ' ', array_filter( $current ) ) ) );
	}

	public static function apply_collision_attributes(
		DOMElement $entity,
		string $source,
		string $role,
		string $category = '',
		string $object_id = '',
		bool $hidden_collision = false,
		string $hidden_shadow_attribute = ''
	): void {
		self::append_class( $entity, 'vrodos-collider' );
		$entity->setAttribute( 'data-vrodos-collider', 'true' );
		$entity->setAttribute( 'data-vrodos-collision-source', $source );
		$entity->setAttribute( 'data-vrodos-collision-role', $role );
		if ( '' !== $category ) {
			$entity->setAttribute( 'data-vrodos-collision-category', $category );
		}
		if ( '' !== $object_id ) {
			$entity->setAttribute( 'data-vrodos-collision-object', $object_id );
		}

		if ( $hidden_collision ) {
			$entity->setAttribute( 'data-vrodos-collision-hidden', 'true' );
			$entity->setAttribute( 'data-vrodos-shadow-role', 'none' );
			$entity->setAttribute( 'shadow', $hidden_shadow_attribute );
			$entity->setAttribute( 'vrodos-collider-helper', '' );
		}
	}

	public static function apply_world_lighting_attributes( DOMElement $entity, string $shadow_role, string $shadow_attribute ): void {
		$entity->setAttribute( 'data-vrodos-world-lighting', 'true' );
		$entity->setAttribute( 'data-vrodos-shadow-role', $shadow_role );
		$entity->setAttribute( 'shadow', $shadow_attribute );
	}

	public static function apply_overlay_ui_attributes( DOMElement $entity ): void {
		$entity->setAttribute( 'data-vrodos-overlay-ui', 'true' );
	}

	public static function world_media_material( string $src, string $side = 'double', bool $transparent = true ): string {
		$material = "src: $src; side: $side; roughness: 0.85; metalness: 0; depthTest: true; depthWrite: true";
		if ( $transparent ) {
			$material .= '; transparent: true; alphaTest: 0.5';
		}

		return $material;
	}

	private static function vector_attribute( $vector ): string {
		return implode( ' ', $vector );
	}

	private static function rotation_attribute( $rotation, bool $preserve_editor_rotation ): string {
		$rotation = [
			( $preserve_editor_rotation ? 1 : -1 ) * 180 / pi() * $rotation[0],
			180 / pi() * $rotation[1],
			180 / pi() * $rotation[2],
		];

		return implode( ' ', $rotation );
	}
}
