<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Default_Scene_Manager {

	public static function create_default_scenes_for_game( $projectSlug, $gameTypeId ): void {
		if ( $gameTypeId ) {
			$project_type      = get_term( $gameTypeId, 'vrodos_game_type' );
			$project_type_slug = $project_type->slug;

			match ( $project_type_slug ) {
				'vrexpo_games' => self::vrodos_create_vrexpo_default_scenes( $projectSlug ),
				'virtualproduction_games' => self::vrodos_create_virtualproduction_default_scenes( $projectSlug ),
				default => self::vrodos_create_archaeology_default_scenes( $projectSlug ),
			};
		}
	}

	private static function vrodos_create_vrexpo_default_scenes( $projectSlug ): void {
		$firstSceneData = self::vrodos_create_default_scene_kernel(
			'Scene 1',
			VRodos_Core_Manager::vrodos_getDefaultJSONscene( 'vrexpo' ),
			$projectSlug . '-scene-1',
			$projectSlug,
			'wonderaround-yaml',
			1,
			'scene',
			0,
			0,
			0,
			'Auto-created scene',
			0,
			''
		);

		wp_insert_post( $firstSceneData );
	}

	private static function vrodos_create_virtualproduction_default_scenes( $projectSlug ): void {
		$firstSceneData = self::vrodos_create_default_scene_kernel(
			'Scene 1',
			VRodos_Core_Manager::vrodos_getDefaultJSONscene( 'virtualproduction' ),
			$projectSlug . '-scene-1',
			$projectSlug,
			'wonderaround-yaml',
			1,
			'scene',
			0,
			0,
			0,
			'Auto-created scene',
			0,
			''
		);

		wp_insert_post( $firstSceneData );
	}

	private static function vrodos_create_archaeology_default_scenes( $projectSlug ): void {
		$firstSceneData = self::vrodos_create_default_scene_kernel(
			'Scene 1',
			VRodos_Core_Manager::vrodos_getDefaultJSONscene( 'archaeology' ),
			$projectSlug . '-scene-1',
			$projectSlug,
			'wonderaround-yaml',
			1,
			'scene',
			0,
			0,
			1,
			'Auto-created scene',
			0,
			''
		);

		wp_insert_post( $firstSceneData );
	}

	private static function vrodos_create_default_scene_kernel(
		$title,
		$content,
		$sceneSlug,
		$projectSlug,
		$sceneYAMLslug,
		$isUndeletable,
		$metaType,
		$hasHelp,
		$hasLogin,
		$hasOptions,
		$caption,
		$isRegional,
		$sceneEnvironment
	): array {
		$tax_parent_project = get_term_by( 'slug', $projectSlug, 'vrodos_scene_pgame' );
		$taxParentProjectId = $tax_parent_project->term_id;

		$sceneYAML   = get_term_by( 'slug', $sceneYAMLslug, 'vrodos_scene_yaml' );
		$sceneYAMLID = $sceneYAML->term_id;

		return ['post_title'   => $title, 'post_content' => $content, 'post_name'    => $sceneSlug, 'post_type'    => 'vrodos_scene', 'post_status'  => 'publish', 'tax_input'    => ['vrodos_scene_pgame' => [$taxParentProjectId], 'vrodos_scene_yaml'  => [$sceneYAMLID]], 'meta_input'   => ['vrodos_scene_default'     => $isUndeletable, 'vrodos_scene_metatype'    => $metaType, 'vrodos_menu_has_help'     => $hasHelp, 'vrodos_menu_has_login'    => $hasLogin, 'vrodos_menu_has_options'  => $hasOptions, 'vrodos_scene_caption'     => $caption, 'vrodos_scene_isRegional'  => $isRegional, 'vrodos_scene_environment' => $sceneEnvironment]];
	}
}
