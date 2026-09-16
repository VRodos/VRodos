<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Scene-owned photos override the asset photo, including an explicit empty choice. */
final class VRodos_Scene_POI_Images {
	public const ROLE = 'poi-images';
	public const FIELD = 'poiImageAttachmentId';

	public static function ids( ?object $objects ): array {
		$ids = [];
		foreach ( get_object_vars( $objects ?? new stdClass() ) as $object ) {
			if ( is_object( $object ) && ! empty( $object->{self::FIELD} ) ) {
				$ids[] = absint( $object->{self::FIELD} );
			}
		}
		return array_values( array_unique( $ids ) );
	}

	public static function validate( int $id, int $scene_id ): void {
		if ( ! VRodos_Storage_Manager::attachment_is_owned_by( $id, 'scene', $scene_id )
			|| ! VRodos_Storage_Manager::attachment_has_role( $id, self::ROLE )
			|| ! wp_attachment_is_image( $id ) ) {
			throw new RuntimeException( 'The POI photo does not belong to this scene.' );
		}
	}

	public static function hydrate( object $scene, int $scene_id, callable $url_for_attachment ): void {
		foreach ( get_object_vars( $scene->objects ?? new stdClass() ) as $object ) {
			if ( ! is_object( $object ) || ! property_exists( $object, self::FIELD ) ) {
				continue;
			}
			unset( $object->poi_image_path );
			$object->poi_img_path = '';
			$id = absint( $object->{self::FIELD} );
			if ( $id ) {
				self::validate( $id, $scene_id );
				$object->poi_img_path = $url_for_attachment( $id );
			}
		}
	}

	public static function cleanup( int $scene_id, array $retained ): void {
		foreach ( VRodos_Storage_Manager::owned_attachment_ids( 'scene', $scene_id, self::ROLE ) as $id ) {
			// A save may overlap an upload whose response has not yet reached the editor.
			if ( ! in_array( $id, $retained, true ) && get_post_time( 'U', true, $id ) < time() - HOUR_IN_SECONDS ) {
				VRodos_Storage_Manager::delete_attachment_if_owned_by( $id, 'scene', $scene_id );
			}
		}
	}
}
