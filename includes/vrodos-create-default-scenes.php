<?php

function vrodos_create_default_scene_kernel($title,
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
									){
	
	$tax_parent_project = get_term_by('slug', $projectSlug, 'vrodos_scene_pgame');
	
	$taxParentProjectId = $tax_parent_project->term_id;
	
	// Get YAML id
	$sceneYAML = get_term_by('slug', $sceneYAMLslug, 'vrodos_scene_yaml');
	$sceneYAMLID = $sceneYAML->term_id;
	
	// Create Main Menu Scene Data
	$sceneData = array(
		'post_title'    => $title,
		'post_content' => $content,
		'post_name' => $sceneSlug,
		'post_type' => 'vrodos_scene',
		'post_status'   => 'publish',
		'tax_input'    => array(
			'vrodos_scene_pgame' => array( $taxParentProjectId ),
			'vrodos_scene_yaml' => array( $sceneYAMLID ),
		),'meta_input'   => array(
			'vrodos_scene_default' => $isUndeletable,
			'vrodos_scene_metatype' => $metaType,
			'vrodos_menu_has_help' => $hasHelp,
			'vrodos_menu_has_login' => $hasLogin,
			'vrodos_menu_has_options' => $hasOptions,
			'vrodos_scene_caption' => $caption,
			'vrodos_scene_isRegional' => $isRegional,
			'vrodos_scene_environment' => $sceneEnvironment,
		),
	);
	
	return $sceneData;
}

// Create scenes as posts in WordPress
function vrodos_create_archaeology_default_scenes($projectSlug){

	// First Scene Data
	$firstSceneData = vrodos_create_default_scene_kernel(
		'Place',
		vrodos_getDefaultJSONscene('archaeology'),
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
		'');

	// Add the scenes as post to WordPress
	wp_insert_post( $firstSceneData );
}


// VRExpo scenes
function vrodos_create_vrexpo_default_scenes($projectSlug){

	// Default scene JSON.
	$default_json = vrodos_getDefaultJSONscene( 'vrexpo' );
	
	// First Scene
	// Create Lobby Scene Data
	$firstSceneData = vrodos_create_default_scene_kernel(
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
		'lobby');

	// Second Scene : Auditorium
	$secondSceneData = vrodos_create_default_scene_kernel(
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
		'auditorium');
	
	// Third Scene : Cafe
	$thirdSceneData = vrodos_create_default_scene_kernel(
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
		'cafe');
	
	// Fourth Scene : Expo
	$fourthSceneData = vrodos_create_default_scene_kernel(
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
		'expo');

	wp_insert_post( $firstSceneData );
	wp_insert_post( $secondSceneData );
	wp_insert_post( $thirdSceneData );
	wp_insert_post( $fourthSceneData );
}

// Virtual Production Scenes
function vrodos_create_virtualproduction_default_scenes($projectSlug){

	// First Scene
	// Create Lobby Scene Data
	$firstSceneData = vrodos_create_default_scene_kernel(
		'Chapter 1',
		vrodos_getDefaultJSONscene( 'virtualproduction' ),
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
		'chapter1');
	
	wp_insert_post( $firstSceneData );
}

// Main
function vrodos_create_default_scenes_for_game($projectSlug, $gameTypeId){

    if ($gameTypeId) {

        $project_type = get_term($gameTypeId, 'vrodos_game_type');
        $project_type_slug  = $project_type->slug;

        switch ($project_type_slug){

            case 'vrexpo_games':
                vrodos_create_vrexpo_default_scenes($projectSlug);
                break;
            case 'virtualproduction_games':
                vrodos_create_virtualproduction_default_scenes($projectSlug);
                break;
            case 'archaeology_games':
            default:
                vrodos_create_archaeology_default_scenes($projectSlug);
                break;
        }
    }
}
