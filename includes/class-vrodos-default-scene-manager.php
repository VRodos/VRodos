<?php

if (!defined('ABSPATH')) {
    exit;
}

class VRodos_Default_Scene_Manager {

    public static function create_default_scenes_for_game($projectSlug, $gameTypeId): void {
        if ($gameTypeId) {
            $project_type = get_term($gameTypeId, 'vrodos_game_type');
            $project_type_slug  = $project_type->slug;

            switch ($project_type_slug) {
                case 'vrexpo_games':
                    self::vrodos_create_vrexpo_default_scenes($projectSlug);
                    break;
                case 'virtualproduction_games':
                    self::vrodos_create_virtualproduction_default_scenes($projectSlug);
                    break;
                case 'archaeology_games':
                default:
                    self::vrodos_create_archaeology_default_scenes($projectSlug);
                    break;
            }
        }
    }

    private static function vrodos_create_vrexpo_default_scenes($projectSlug): void {
        $default_json = VRodos_Core_Manager::vrodos_getDefaultJSONscene('vrexpo');

        $firstSceneData = self::vrodos_create_default_scene_kernel(
            'Lobby',
            $default_json,
            $projectSlug . '-lobby-scene',
            $projectSlug,
            'wonderaround-yaml',
            1,
            'scene',
            0,
            0,
            0,
            'Auto-created scene',
            0,
            'lobby'
        );

        $secondSceneData = self::vrodos_create_default_scene_kernel(
            'Auditorium',
            $default_json,
            $projectSlug . '-auditorium-scene',
            $projectSlug,
            'wonderaround-yaml',
            0,
            'scene',
            0,
            0,
            0,
            'Auto-created scene',
            0,
            'auditorium'
        );

        $thirdSceneData = self::vrodos_create_default_scene_kernel(
            'Cafe',
            $default_json,
            $projectSlug . '-cafe-scene',
            $projectSlug,
            'wonderaround-yaml',
            0,
            'scene',
            0,
            0,
            0,
            'Auto-created scene',
            0,
            'cafe'
        );

        $fourthSceneData = self::vrodos_create_default_scene_kernel(
            'Expo',
            $default_json,
            $projectSlug . '-expo-scene',
            $projectSlug,
            'wonderaround-yaml',
            0,
            'scene',
            0,
            0,
            0,
            'Auto-created scene',
            0,
            'expo'
        );

        wp_insert_post($firstSceneData);
        wp_insert_post($secondSceneData);
        wp_insert_post($thirdSceneData);
        wp_insert_post($fourthSceneData);
    }

    private static function vrodos_create_virtualproduction_default_scenes($projectSlug): void {
        $firstSceneData = self::vrodos_create_default_scene_kernel(
            'Chapter 1',
            VRodos_Core_Manager::vrodos_getDefaultJSONscene('virtualproduction'),
            $projectSlug . '-chapter1-scene',
            $projectSlug,
            'wonderaround-yaml',
            1,
            'scene',
            0,
            0,
            0,
            'Auto-created scene',
            0,
            'chapter1'
        );

        wp_insert_post($firstSceneData);
    }

    private static function vrodos_create_archaeology_default_scenes($projectSlug): void {
        $firstSceneData = self::vrodos_create_default_scene_kernel(
            'Place',
            VRodos_Core_Manager::vrodos_getDefaultJSONscene('archaeology'),
            $projectSlug . '-first-scene',
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

        wp_insert_post($firstSceneData);
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
        $tax_parent_project = get_term_by('slug', $projectSlug, 'vrodos_scene_pgame');
        $taxParentProjectId = $tax_parent_project->term_id;

        $sceneYAML = get_term_by('slug', $sceneYAMLslug, 'vrodos_scene_yaml');
        $sceneYAMLID = $sceneYAML->term_id;

        $sceneData = [
            'post_title'    => $title,
            'post_content' => $content,
            'post_name' => $sceneSlug,
            'post_type' => 'vrodos_scene',
            'post_status'   => 'publish',
            'tax_input'    => [
                'vrodos_scene_pgame' => [$taxParentProjectId],
                'vrodos_scene_yaml' => [$sceneYAMLID],
            ],
            'meta_input'   => [
                'vrodos_scene_default' => $isUndeletable,
                'vrodos_scene_metatype' => $metaType,
                'vrodos_menu_has_help' => $hasHelp,
                'vrodos_menu_has_login' => $hasLogin,
                'vrodos_menu_has_options' => $hasOptions,
                'vrodos_scene_caption' => $caption,
                'vrodos_scene_isRegional' => $isRegional,
                'vrodos_scene_environment' => $sceneEnvironment,
            ],
        ];

        return $sceneData;
    }
}
