<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Canonicalizes objects from the compile plan's already-isolated scene copy. */
final class VRodos_Compiler_Entity_Policy {
	private const CATEGORY_ALIASES = [
		'lightsun' => 'light-sun', 'lightspot' => 'light-spot', 'lightlamp' => 'light-lamp', 'lightambient' => 'light-ambient',
		'walkablesurface' => 'walkable-surface', 'collisionproxy' => 'collision-proxy', 'poilink' => 'poi-link', 'poichat' => 'poi-chat',
		'poiimagetext' => 'poi-imagetext', 'poi-image-text' => 'poi-imagetext', '3dtext' => '3d-text',
	];

	private const CATEGORY_FAMILIES = [
		'light-sun' => 'light', 'light-spot' => 'light', 'light-lamp' => 'light', 'light-ambient' => 'light',
		'decoration' => 'gltf', 'walkable-surface' => 'gltf', 'collision-proxy' => 'gltf', 'door' => 'gltf', 'poi-link' => 'gltf',
		'chat' => 'gltf', 'poi-chat' => 'gltf', 'audio' => 'audio', 'image' => 'media', 'video' => 'media', '3d-text' => 'text',
		'poi-imagetext' => 'poi-imagetext', 'pawn' => 'pawn', 'assessment' => 'assessment',
	];

	public function normalize( object $source, int $scene_id, string $object_key ): object {
		unset( $source->follow_camera, $source->follow_camera_x, $source->follow_camera_z );
		$source->category_slug = $this->canonical_category( (string) ( $source->category_slug ?? $source->category_name ?? '' ) );
		$source->name          = empty( $source->name ) ? $object_key : $source->name;
		if ( empty( $source->uuid ) ) {
			$identity    = implode( '|', [ max( 0, $scene_id ), $object_key, $source->category_slug, $source->asset_id ?? '', $source->asset_slug ?? '', $source->immerse_attachment_id ?? '' ] );
			$source->uuid = 'object_' . substr( hash( 'sha256', $identity ), 0, 16 );
		}
		return $source;
	}

	public function canonical_category( string $category ): string {
		$category = trim( preg_replace( '/[^a-z0-9]+/', '-', strtolower( trim( $category ) ) ) ?? '', '-' );
		return self::CATEGORY_ALIASES[ $category ] ?? $category;
	}

	public function is_normalized( object $entity ): bool {
		$category = (string) ( $entity->category_slug ?? '' );
		return '' !== $category &&
			$category === $this->canonical_category( $category ) &&
			! empty( $entity->name ) &&
			! empty( $entity->uuid ) &&
			! property_exists( $entity, 'follow_camera' ) &&
			! property_exists( $entity, 'follow_camera_x' ) &&
			! property_exists( $entity, 'follow_camera_z' );
	}

	public function family_for( string $category ): ?string {
		return self::CATEGORY_FAMILIES[ $category ] ?? null;
	}

	public function categories(): array {
		return array_keys( self::CATEGORY_FAMILIES );
	}
}
