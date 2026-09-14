<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Resolves the Director camera's current Three.js pose for every compiled client. */
final class VRodos_Compiler_Camera_Pose {
	public static function resolve( object $scene_json ): array {
		$camera   = $scene_json->objects->avatarCamera ?? null;
		$position = self::vector( $camera->position ?? [], [ 0.0, 1.6, 0.0 ] );
		$rotation = self::vector( $camera->rotation ?? [], [ 0.0, 0.0, 0.0 ] );
		return [
			'cam_position'   => implode( ' ', $position ),
			'cam_rotation_x' => rad2deg( $rotation[0] ),
			'cam_rotation_y' => rad2deg( $rotation[1] ),
		];
	}

	private static function vector( $value, array $defaults ): array {
		$values = array_values( (array) $value );
		foreach ( $defaults as $index => $default ) {
			$value = $values[ $index ] ?? $default;
			$defaults[ $index ] = is_numeric( $value ) && is_finite( (float) $value ) ? (float) $value : $default;
		}
		return $defaults;
	}
}
