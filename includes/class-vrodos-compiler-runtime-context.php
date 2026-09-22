<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Resolve extension context once, before selecting the runtime chunks. */
final class VRodos_Compiler_Runtime_Context {
	public static function resolve( int $project_id, int $scene_id, string $scene_title, object $scene_json, array $settings ): array {
		$context = apply_filters( 'vrodos_compiled_runtime_context', [
			'projectId' => $project_id,
			'sceneId' => $scene_id,
			'sceneTitle' => $scene_title,
			'ajaxUrl' => admin_url( 'admin-ajax.php' ),
		], $project_id, $scene_id, $scene_json, $settings );
		return is_array( $context ) ? $context : [];
	}
}
