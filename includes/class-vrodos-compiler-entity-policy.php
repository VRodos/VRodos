<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Canonicalizes immutable scene-object copies and selects their renderer family. */
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
		$json = function_exists( 'wp_json_encode' ) ? wp_json_encode( $source ) : json_encode( $source );
		$copy = is_string( $json ) ? json_decode( $json ) : null;
		if ( ! is_object( $copy ) ) {
			throw new RuntimeException( '[VRodos] Scene object could not be normalized.' );
		}

		unset( $copy->follow_camera, $copy->follow_camera_x, $copy->follow_camera_z );
		$copy->category_slug = $this->canonical_category( (string) ( $copy->category_slug ?? $copy->category_name ?? '' ) );
		$copy->name          = empty( $copy->name ) ? $object_key : $copy->name;
		if ( empty( $copy->uuid ) ) {
			$identity   = implode( '|', [ max( 0, $scene_id ), $object_key, $copy->category_slug, $copy->asset_id ?? '', $copy->asset_slug ?? '', $copy->immerse_attachment_id ?? '' ] );
			$copy->uuid = 'object_' . substr( hash( 'sha256', $identity ), 0, 16 );
		}
		return $copy;
	}

	public function canonical_category( string $category ): string {
		$category = trim( preg_replace( '/[^a-z0-9]+/', '-', strtolower( trim( $category ) ) ) ?? '', '-' );
		return self::CATEGORY_ALIASES[ $category ] ?? $category;
	}

	public function family_for( string $category ): ?string {
		return self::CATEGORY_FAMILIES[ $category ] ?? null;
	}

	public function categories(): array {
		return array_keys( self::CATEGORY_FAMILIES );
	}
}
