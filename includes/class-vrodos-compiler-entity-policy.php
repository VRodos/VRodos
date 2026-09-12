<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Canonicalizes objects from the compile plan's already-isolated scene copy. */
final class VRodos_Compiler_Entity_Policy {
	public function collision_shape( object $source ): string {
		$category = $this->effective_category( $source );
		$enabled = VRodos_Runtime_Settings_Contract::normalize_bool( $source->compiledCollisionEnabled ?? ( 'decoration' === $category || 'primitive-plane' === $category ), false );
		return $enabled ? ( 'decoration' === $category ? 'box' : 'mesh' ) : 'none';
	}

	public function requires_protected_geometry( object $source ): bool {
		return in_array( $this->effective_category( $source ), [ 'walkable-surface', 'collision-proxy' ], true )
			|| 'mesh' === $this->collision_shape( $source );
	}

	private const SCENE_ASSET_ROLES = [ 'decoration', 'walkable-surface' ];

	private const CATEGORY_ALIASES = [
		'lightsun' => 'light-sun', 'lightspot' => 'light-spot', 'lightlamp' => 'light-lamp', 'lightambient' => 'light-ambient',
		'walkablesurface' => 'walkable-surface', 'collisionproxy' => 'collision-proxy', 'poilink' => 'poi-link', 'poichat' => 'poi-chat',
		'poiimagetext' => 'poi-imagetext', 'poi-image-text' => 'poi-imagetext', '3dtext' => '3d-text', 'primitiveplane' => 'primitive-plane',
	];

	private const CATEGORY_FAMILIES = [
		'light-sun' => 'light', 'light-spot' => 'light', 'light-lamp' => 'light', 'light-ambient' => 'light',
		'decoration' => 'gltf', 'walkable-surface' => 'gltf', 'collision-proxy' => 'gltf', 'door' => 'gltf', 'poi-link' => 'gltf',
		'chat' => 'gltf', 'poi-chat' => 'gltf', 'audio' => 'audio', 'image' => 'media', 'video' => 'media', '3d-text' => 'text',
		'poi-imagetext' => 'poi-imagetext', 'pawn' => 'pawn', 'assessment' => 'assessment', 'primitive-plane' => 'primitive',
	];

	public function normalize( object $source, int $scene_id, string $object_key ): object {
		unset( $source->follow_camera, $source->follow_camera_x, $source->follow_camera_z );
		$source_category = $this->canonical_category( (string) ( $source->category_slug ?? $source->category_name ?? '' ) );
		$collision_value_missing = ! property_exists( $source, 'compiledCollisionEnabled' ) ||
			null === $source->compiledCollisionEnabled ||
			( ! is_bool( $source->compiledCollisionEnabled ) && '' === trim( (string) $source->compiledCollisionEnabled ) );
		if ( $collision_value_missing ) {
			$source->compiledCollisionEnabled = 'decoration' === $this->effective_category( $source ) || in_array( $source_category, [ 'decoration', 'primitive-plane' ], true );
		}
		$source->category_slug = $this->effective_category( $source );
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

	public function effective_category( object $source ): string {
		$source_category = $this->canonical_category( (string) ( $source->category_slug ?? $source->category_name ?? '' ) );
		if ( ! in_array( $source_category, self::SCENE_ASSET_ROLES, true ) ) {
			return $source_category;
		}

		$scene_role = strtolower( trim( (string) ( $source->sceneAssetRole ?? '' ) ) );
		return in_array( $scene_role, self::SCENE_ASSET_ROLES, true ) ? $scene_role : $source_category;
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
