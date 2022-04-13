<?php

function vrodos_create_archaeology_default_scenes($projectSlug){

	$tax_parent_project = get_term_by('slug', $projectSlug, 'vrodos_scene_pgame');

	$parent_project_id_as_term_id = $tax_parent_project->term_id;

	// Main Menu
	$mainmenuSceneTitle = 'Main Menu';
	$mainmenuSceneSlug = $projectSlug . '-main-menu' ;

	// First Scene
	$firstSceneTitle = 'Place'; //Title for First Menu
	$firstSceneSlug = $projectSlug . '-first-scene'; //Slug for First Menu

	// Credits
	$credentialsSceneTitle = 'Credits'; //Title for Credentials Menu
	$credentialsSceneSlug = $projectSlug . '-credits-scene'; //Slug for Credentials Menu

	// YAMLs

	// First Scene YAML
	$firstSceneYAML = get_term_by('slug', 'wonderaround-yaml', 'vrodos_scene_yaml'); //Yaml Tax for First Scene
	$firstSceneYAMLID = $firstSceneYAML->term_id;

	// Main Menu YAMLs
	$mainmenuSceneYAML = get_term_by('slug', 'mainmenu-arch-yaml', 'vrodos_scene_yaml'); //Yaml Tax for Main Menu
	$mainmenuSceneYAMLID = $mainmenuSceneYAML->term_id;

	// Credentials Scene YAMLs
	$credentialsSceneYAML = get_term_by('slug', 'credentials-arch-yaml', 'vrodos_scene_yaml'); //Yaml Tax for Credentials Scene
	$credentialsSceneYAMLID = $credentialsSceneYAML->term_id;

	// Get default first scene json
	$default_json = vrodos_getDefaultJSONscene('archaeology');


	// Create Main Menu Scene Data
	$mainmenuSceneData = array(
		'post_title'    => $mainmenuSceneTitle,
		'post_content' => 'Main Menu of the Game',
		'post_name' => $mainmenuSceneSlug,
		'post_type' => 'vrodos_scene',
		'post_status'   => 'publish',
		'tax_input'    => array(
			'vrodos_scene_pgame'     => array( $parent_project_id_as_term_id ),
			'vrodos_scene_yaml'     => array( $mainmenuSceneYAMLID ),
		),'meta_input'   => array(
			'vrodos_scene_default' => 1,
			'vrodos_scene_metatype' => 'menu',
			'vrodos_menu_has_help' => 1,
			'vrodos_menu_has_login' => 1,
			'vrodos_menu_has_options' => 1,
		),
	);
	
	wp_insert_post( $mainmenuSceneData );
	
	// Create Credentials Scene Data
	$credentialsSceneData = array(
		'post_title'    => $credentialsSceneTitle,
		'post_content' => 'Credits of the Game',
		'post_name' => $credentialsSceneSlug,
		'post_type' => 'vrodos_scene',
		'post_status'   => 'publish',
		'tax_input'    => array(
			'vrodos_scene_pgame'     => array( $parent_project_id_as_term_id ),
			'vrodos_scene_yaml'     => array( $credentialsSceneYAMLID ),
		),'meta_input'   => array(
			'vrodos_scene_default' => 1,
			'vrodos_scene_metatype' => 'credits',
		),
	);
	
	wp_insert_post( $credentialsSceneData );
	
	
	// Create First Scene Data
	$firstSceneData = array(
		'post_title' => $firstSceneTitle,
		'post_content' => $default_json,
		'post_name' => $firstSceneSlug,
		'post_type' => 'vrodos_scene',
		'post_status' => 'publish',
		'tax_input' => array(
			'vrodos_scene_pgame' => array($parent_project_id_as_term_id),
			'vrodos_scene_yaml' => array($firstSceneYAMLID),
		), 'meta_input' => array(
			'vrodos_scene_default' => 1,
			'vrodos_scene_metatype' => 'scene',
			'vrodos_scene_caption' => 'Auto-created scene',
			'vrodos_isRegional' => 0,
		),
	);
	$scene1_id = wp_insert_post( $firstSceneData );
}


// ENERGY
function vrodos_create_energy_default_scenes($projectSlug){
	
	$tax_parent_project = get_term_by('slug', $projectSlug, 'vrodos_scene_pgame');
	
	$parent_project_id_as_term_id = $tax_parent_project->term_id;
	
	// Main Menu
	$mainmenuSceneTitle = 'Main Menu';
	
	$mainmenuSceneSlug = $projectSlug . '-main-menu';

	// Credits
	$credentialsSceneTitle = 'Credits'; //Title for Credentials Menu
	$credentialsSceneSlug  = $projectSlug . '-credits-scene'; //Slug for Credentials Menu

	// First Scene
	$firstSceneYAML   = get_term_by( 'slug', 'educational-energy', 'vrodos_scene_yaml' ); //Yaml Tax for First Scene
	$firstSceneYAMLID = $firstSceneYAML->term_id;
	
	// Main Menu Scene
	$mainmenuSceneYAML   = get_term_by( 'slug', 'mainmenu-yaml', 'vrodos_scene_yaml' ); //Yaml Tax for Main Menu
	$mainmenuSceneYAMLID = $mainmenuSceneYAML->term_id;
	
	// Credentials Scene
	$credentialsSceneYAML   = get_term_by( 'slug', 'credentials-yaml', 'vrodos_scene_yaml' ); //Yaml Tax for Credentials Scene
	$credentialsSceneYAMLID = $credentialsSceneYAML->term_id;
	
	$default_json = vrodos_getDefaultJSONscene( 'energy' );

	// Create Main Menu Scene Data
	$mainmenuSceneData = array(
		'post_title'   => $mainmenuSceneTitle,
		'post_content' => 'Main Menu of the Game',
		'post_name'    => $mainmenuSceneSlug,
		'post_type'    => 'vrodos_scene',
		'post_status'  => 'publish',
		'tax_input'    => array(
			'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
			'vrodos_scene_yaml'  => array( $mainmenuSceneYAMLID ),
		),
		'meta_input'   => array(
			'vrodos_scene_default'    => 1,
			'vrodos_scene_metatype'   => 'menu',
			'vrodos_menu_has_help'    => 1,
			'vrodos_menu_has_login'   => 1,
			'vrodos_menu_has_options' => 1,
		),
	);
	
	wp_insert_post( $mainmenuSceneData );
	
	// Create Credentials Scene Data
	$credentialsSceneData = array(
		'post_title'   => $credentialsSceneTitle,
		'post_content' => 'Credits of the Game',
		'post_name'    => $credentialsSceneSlug,
		'post_type'    => 'vrodos_scene',
		'post_status'  => 'publish',
		'tax_input'    => array(
			'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
			'vrodos_scene_yaml'  => array( $credentialsSceneYAMLID ),
		),
		'meta_input'   => array(
			'vrodos_scene_default'  => 1,
			'vrodos_scene_metatype' => 'credits',
		),
	);
	
	wp_insert_post( $credentialsSceneData );
	
	
	
	$firstSceneTitle = 'Mountains'; //Title for First Menu
	$firstSceneSlug  = $projectSlug . '-mountains'; //Slug for First Menu
	
	$secondSceneTitle = 'Fields'; //Title for First Menu
	$secondSceneSlug  = $projectSlug . '-fields'; //Slug for First Menu
	
	$thirdSceneTitle = 'Seashore'; //Title for First Menu
	$thirdSceneSlug  = $projectSlug . '-seashore'; //Slug for First Menu
	
	$content1 = 'Area-1 is near mountains.It has difficult access. Its windclass is High (10 m/s).
Here you have 5 places to explore.Characteristics :
	- Average Wind speed = 10 m/s
	- Access cost = 3 $';
	
	$content2 = 'Area-2 is near plain land. It has not difficult access. Its windclass is Medium (windspeeds 8.5 m/s).
Here you have 5 places to explore.
Characteristics :
	- Average Wind speed = 8.5 m/s
	- Access cost = 2 $';
	
	$content3 = 'Area-3 is near seashore. It has easy access due to port. Its windclass is Low (windspeeds 7.5 m/s).
Here you have 8 places to explore.
Characteristics :
	- Average Wind speed = 7.5 m/s
	- Access cost = 1 $';
	
	
	$image_content2 = WP_PLUGIN_DIR . "/vrodos/includes/files/samples/regions/img2.png";
	$image_content3 = WP_PLUGIN_DIR . "/vrodos/includes/files/samples/regions/img3.png";
	
	// Create First Scene Data
	$firstSceneData = array(
		'post_title'   => $firstSceneTitle,
		'post_content' => $content1,
		'post_name'    => $firstSceneSlug,
		'post_type'    => 'vrodos_scene',
		'post_status'  => 'publish',
		'tax_input'    => array(
			'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
			'vrodos_scene_yaml'  => array( $firstSceneYAMLID ),
		),
		'meta_input'   => array(
			'vrodos_scene_default'     => 1,
			'vrodos_scene_metatype'    => 'scene',
			'vrodos_scene_json_input'  => $default_json,
			'vrodos_isRegional'        => 1,
			'vrodos_scene_environment' => 'mountain',
		),
	);
	
	$secondSceneData = array(
		'post_title'   => $secondSceneTitle,
		'post_content' => $content2,
		'post_name'    => $secondSceneSlug,
		'post_type'    => 'vrodos_scene',
		'post_status'  => 'publish',
		'tax_input'    => array(
			'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
			'vrodos_scene_yaml'  => array( $firstSceneYAMLID ),
		),
		'meta_input'   => array(
			'vrodos_scene_default'     => 1,
			'vrodos_scene_metatype'    => 'scene',
			'vrodos_scene_json_input'  => $default_json,
			'vrodos_isRegional'        => 1,
			'vrodos_scene_environment' => 'fields',
		),
	);
	
	$thirdSceneData = array(
		'post_title'   => $thirdSceneTitle,
		'post_content' => $content3,
		'post_name'    => $thirdSceneSlug,
		'post_type'    => 'vrodos_scene',
		'post_status'  => 'publish',
		'tax_input'    => array(
			'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
			'vrodos_scene_yaml'  => array( $firstSceneYAMLID ),
		),
		'meta_input'   => array(
			'vrodos_scene_default'     => 1,
			'vrodos_scene_metatype'    => 'scene',
			'vrodos_scene_json_input'  => $default_json,
			'vrodos_isRegional'        => 1,
			'vrodos_scene_environment' => 'seashore',
		),
	);
	
	$scene2_id = wp_insert_post( $secondSceneData );
	$scene3_id = wp_insert_post( $thirdSceneData );
	
	$attachment2_id = vrodos_upload_img_vid_aud( $image_content2, $scene2_id );
	$attachment3_id = vrodos_upload_img_vid_aud( $image_content3, $scene3_id );
	set_post_thumbnail( $scene2_id, $attachment2_id );
	set_post_thumbnail( $scene3_id, $attachment3_id );
	
	// Insert posts 1-1 into the database
	
	$scene1_id = wp_insert_post( $firstSceneData );

	$image_content1 = WP_PLUGIN_DIR . "/vrodos/includes/files/samples/regions/img1.png";
	$attachment1_id = vrodos_upload_img_vid_aud( $image_content1, $scene1_id );
	set_post_thumbnail( $scene1_id, $attachment1_id );
}


function vrodos_create_chemistry_default_scenes($projectSlug){
	
	// Tax Parent Project
	$tax_parent_project = get_term_by('slug', $projectSlug, 'vrodos_scene_pgame');
	
	$parent_project_id_as_term_id = $tax_parent_project->term_id;
	
	// Main Menu
	$mainmenuSceneTitle = 'Main Menu';
	$mainmenuSceneSlug = $projectSlug . '-main-menu';
	
	// First Scene
	$firstSceneTitle = 'Lab'; //Title for First Menu
	$firstSceneSlug  = $projectSlug . '-first-scene'; //Slug for First Menu

	// Credits
	$credentialsSceneTitle = 'Credits'; //Title for Credentials Menu
	$credentialsSceneSlug  = $projectSlug . '-credits-scene'; //Slug for Credentials Menu
	
	// Exams
	
	// 2D
	$exam2dSceneTitle = 'Molecule Naming';
	$exam2dSceneSlug  = $projectSlug . '-exam2d';
	
	// 3D
	$exam3dSceneTitle = 'Molecule Construction';
	$exam3dSceneSlug  = $projectSlug . '-exam3d';
	
	// First Scene
	$firstSceneYAML   = get_term_by( 'slug', 'wonderaround-lab-yaml', 'vrodos_scene_yaml' ); //Yaml Tax for First Scene (Chemistry)
	$firstSceneYAMLID = $firstSceneYAML->term_id;
	
	// Main Menu Scene
	$mainmenuSceneYAML   = get_term_by( 'slug', 'mainmenu-chem-yaml', 'vrodos_scene_yaml' ); //Yaml Tax for Main Menu (Chemistry)
	$mainmenuSceneYAMLID = $mainmenuSceneYAML->term_id;
	
	// Credentials Scene
	$credentialsSceneYAML   = get_term_by( 'slug', 'credentials-chem-yaml', 'vrodos_scene_yaml' ); //Yaml Tax for Credentials Scene (Chemistry)
	$credentialsSceneYAMLID = $credentialsSceneYAML->term_id;
	
	// Exam 2D Scene
	$exam2dSceneYAML   = get_term_by( 'slug', 'exam2d-chem-yaml', 'vrodos_scene_yaml' ); //Yaml Tax for Exam 2d Scene (Chemistry)
	$exam2dSceneYAMLID = $exam2dSceneYAML->term_id;
	
	// Exam 3D Scene
	$exam3dSceneYAML   = get_term_by( 'slug', 'exam3d-chem-yaml', 'vrodos_scene_yaml' ); //Yaml Tax for Exam 3d Scene (Chemistry)
	$exam3dSceneYAMLID = $exam3dSceneYAML->term_id;
	
	$default_json = vrodos_getDefaultJSONscene( 'chemistry' );

	// Create Main Menu Scene Data
	$mainmenuSceneData = array(
		'post_title'   => $mainmenuSceneTitle,
		'post_content' => 'Main Menu of the Game',
		'post_name'    => $mainmenuSceneSlug,
		'post_type'    => 'vrodos_scene',
		'post_status'  => 'publish',
		'tax_input'    => array(
			'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
			'vrodos_scene_yaml'  => array( $mainmenuSceneYAMLID ),
		),
		'meta_input'   => array(
			'vrodos_scene_default'    => 1,
			'vrodos_scene_metatype'   => 'menu',
			'vrodos_menu_has_help'    => 1,
			'vrodos_menu_has_login'   => 1,
			'vrodos_menu_has_options' => 1,
		),
	);

	wp_insert_post( $mainmenuSceneData );

	// Create Credentials Scene Data
	$credentialsSceneData = array(
		'post_title'   => $credentialsSceneTitle,
		'post_content' => 'Credits of the Game',
		'post_name'    => $credentialsSceneSlug,
		'post_type'    => 'vrodos_scene',
		'post_status'  => 'publish',
		'tax_input'    => array(
			'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
			'vrodos_scene_yaml'  => array( $credentialsSceneYAMLID ),
		),
		'meta_input'   => array(
			'vrodos_scene_default'  => 1,
			'vrodos_scene_metatype' => 'credits',
		),
	);
	
	wp_insert_post( $credentialsSceneData );
	
	
	// Create First Scene Data
	$firstSceneData = array(
		'post_title'   => $firstSceneTitle,
		'post_content' => $default_json,
		'post_name'    => $firstSceneSlug,
		'post_type'    => 'vrodos_scene',
		'post_status'  => 'publish',
		'tax_input'    => array(
			'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
			'vrodos_scene_yaml'  => array( $firstSceneYAMLID ),
		),
		'meta_input'   => array(
			'vrodos_scene_default'  => 1,
			'vrodos_scene_metatype' => 'scene',
			'vrodos_scene_caption'  => 'Auto-created scene',
			'vrodos_isRegional'     => 0,
		),
	);
	
	
	
	
	// Create Exam Scene Data
	$exam2dSceneData = array(
		'post_title'   => $exam2dSceneTitle,
		'post_content' => 'Create Molecule Naming puzzle game',
		'post_name'    => $exam2dSceneSlug,
		'post_type'    => 'vrodos_scene',
		'post_status'  => 'publish',
		'tax_input'    => array(
			'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
			'vrodos_scene_yaml'  => array( $exam2dSceneYAMLID ),
		),
		'meta_input'   => array(
			'vrodos_scene_default'    => 1,
			'vrodos_scene_metatype'   => 'sceneExam2d',
			'vrodos_scene_json_input' => $default_json,
		),
	);
	
	wp_insert_post( $exam2dSceneData );
	
	$exam3dSceneData = array(
		'post_title'   => $exam3dSceneTitle,
		'post_content' => 'Create Molecule Construction puzzle game',
		'post_name'    => $exam3dSceneSlug,
		'post_type'    => 'vrodos_scene',
		'post_status'  => 'publish',
		'tax_input'    => array(
			'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
			'vrodos_scene_yaml'  => array( $exam3dSceneYAMLID ),
		),
		'meta_input'   => array(
			'vrodos_scene_default'    => 1,
			'vrodos_scene_metatype'   => 'sceneExam3d',
			'vrodos_scene_json_input' => $default_json,
		),
	);
	
	wp_insert_post( $exam3dSceneData );
	// Insert posts 1-1 into the database
	
	$scene1_id = wp_insert_post( $firstSceneData );
}

// VRExpo
function vrodos_create_vrexpo_default_scenes($projectSlug){
	
	// Tax Parent Project
	$tax_parent_project = get_term_by('slug', $projectSlug, 'vrodos_scene_pgame');
	
	$parent_project_id_as_term_id = $tax_parent_project->term_id;
	
	// Main Menu
//	$mainmenuSceneTitle = 'Main Menu';
//	$mainmenuSceneSlug = $projectSlug . '-main-menu';

	// Credits
//	$credentialsSceneTitle = 'Credits'; //Title for Credentials Menu
//	$credentialsSceneSlug  = $projectSlug . '-credits-scene'; //Slug for Credentials Menu

	// YAMLs
	
	// First Scene YAML
	$firstSceneYAML   = get_term_by( 'slug', 'wonderaround-yaml', 'vrodos_scene_yaml' ); //Yaml Tax for First Scene
	$firstSceneYAMLID = $firstSceneYAML->term_id;
	
	// Main Menu YAML
//	$mainmenuSceneYAML   = get_term_by( 'slug', 'mainmenu-arch-yaml', 'vrodos_scene_yaml' ); //Yaml Tax for Main Menu
//	$mainmenuSceneYAMLID = $mainmenuSceneYAML->term_id;
	
	// Credentials Scene YAML
//	$credentialsSceneYAML   = get_term_by( 'slug', 'credentials-arch-yaml', 'vrodos_scene_yaml' ); //Yaml Tax for Credentials Scene
//	$credentialsSceneYAMLID = $credentialsSceneYAML->term_id;
	
	// ToChange
	$default_json = vrodos_getDefaultJSONscene( 'archaeology' );


//	// Create Main Menu Scene Data
//	$mainmenuSceneData = array(
//		'post_title'   => $mainmenuSceneTitle,
//		'post_content' => 'Main Menu of the Game',
//		'post_name'    => $mainmenuSceneSlug,
//		'post_type'    => 'vrodos_scene',
//		'post_status'  => 'publish',
//		'tax_input'    => array(
//			'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
//			'vrodos_scene_yaml'  => array( $mainmenuSceneYAMLID ),
//		),
//		'meta_input'   => array(
//			'vrodos_scene_default'    => 1,
//			'vrodos_scene_metatype'   => 'menu',
//			'vrodos_menu_has_help'    => 1,
//			'vrodos_menu_has_login'   => 1,
//			'vrodos_menu_has_options' => 1,
//		),
//	);
//
//	wp_insert_post( $mainmenuSceneData );
//
//	// Create Credentials Scene Data
//	$credentialsSceneData = array(
//		'post_title'   => $credentialsSceneTitle,
//		'post_content' => 'Credits of the Game',
//		'post_name'    => $credentialsSceneSlug,
//		'post_type'    => 'vrodos_scene',
//		'post_status'  => 'publish',
//		'tax_input'    => array(
//			'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
//			'vrodos_scene_yaml'  => array( $credentialsSceneYAMLID ),
//		),
//		'meta_input'   => array(
//			'vrodos_scene_default'  => 1,
//			'vrodos_scene_metatype' => 'credits',
//		),
//	);
//
//	wp_insert_post( $credentialsSceneData );
	
	// First Scene
	$firstSceneTitle = 'Lobby';
	$firstSceneSlug  = $projectSlug . '-lobby-scene';
	
	$secondSceneTitle = 'Auditorium';
	$secondSceneSlug  = $projectSlug . '-auditorium-scene';
	
	$thirdSceneTitle = 'Cafe';
	$thirdSceneSlug  = $projectSlug . '-cafe-scene';
	
	$fourthSceneTitle = 'Expo';
	$fourthSceneSlug  = $projectSlug . '-expo-scene';
	
	$content1 = '';
	$content2 = '';
	$content3 = '';
	$content4 = '';
	
	// Create Lobby Scene Data
	$firstSceneData = array(
		'post_title'   => $firstSceneTitle,
		'post_content' => $content1,
		'post_name'    => $firstSceneSlug,
		'post_type'    => 'vrodos_scene',
		'post_status'  => 'publish',
		'tax_input'    => array(
			'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
			'vrodos_scene_yaml'  => array( $firstSceneYAMLID ),
		),
		'meta_input'   => array(
			'vrodos_scene_default'     => 1,
			'vrodos_scene_metatype'    => 'scene',
			'vrodos_scene_json_input'  => $default_json,
			'vrodos_isRegional'        => 0,
			'vrodos_scene_environment' => 'lobby',
		),
	);
	
	$secondSceneData = array(
		'post_title'   => $secondSceneTitle,
		'post_content' => $content2,
		'post_name'    => $secondSceneSlug,
		'post_type'    => 'vrodos_scene',
		'post_status'  => 'publish',
		'tax_input'    => array(
			'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
			'vrodos_scene_yaml'  => array( $firstSceneYAMLID ),
		),
		'meta_input'   => array(
			'vrodos_scene_default'     => 1,
			'vrodos_scene_metatype'    => 'scene',
			'vrodos_scene_json_input'  => $default_json,
			'vrodos_isRegional'        => 0,
			'vrodos_scene_environment' => 'Auditorium',
		),
	);
	
	$thirdSceneData = array(
		'post_title'   => $thirdSceneTitle,
		'post_content' => $content3,
		'post_name'    => $thirdSceneSlug,
		'post_type'    => 'vrodos_scene',
		'post_status'  => 'publish',
		'tax_input'    => array(
			'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
			'vrodos_scene_yaml'  => array( $firstSceneYAMLID ),
		),
		'meta_input'   => array(
			'vrodos_scene_default'     => 1,
			'vrodos_scene_metatype'    => 'scene',
			'vrodos_scene_json_input'  => $default_json,
			'vrodos_isRegional'        => 0,
			'vrodos_scene_environment' => 'Cafe',
		),
	);
	
	$fourthSceneData = array(
		'post_title'   => $fourthSceneTitle,
		'post_content' => $content4,
		'post_name'    => $fourthSceneSlug,
		'post_type'    => 'vrodos_scene',
		'post_status'  => 'publish',
		'tax_input'    => array(
			'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
			'vrodos_scene_yaml'  => array( $firstSceneYAMLID ),
		),
		'meta_input'   => array(
			'vrodos_scene_default'     => 1,
			'vrodos_scene_metatype'    => 'scene',
			'vrodos_scene_json_input'  => $default_json,
			'vrodos_isRegional'        => 0,
			'vrodos_scene_environment' => 'Expo',
		),
	);
	
	$scene1_id = wp_insert_post( $firstSceneData );
	$scene2_id = wp_insert_post( $secondSceneData );
	$scene3_id = wp_insert_post( $thirdSceneData );
	$scene4_id = wp_insert_post( $fourthSceneData );
}


function vrodos_create_default_scenes_for_game($projectSlug, $gameTitle, $projectID){

	// Tax Parent Project
	$tax_parent_project = get_term_by('slug', $projectSlug, 'vrodos_scene_pgame');
	
	$parent_project_id_as_term_id = $tax_parent_project->term_id;
	
	$project_type = get_the_terms( $projectID, 'vrodos_game_type' );
	
	$project_type_slug  = $project_type[0]->slug;
	
	
	if($project_type_slug == 'archaeology_games'){
		vrodos_create_archaeology_default_scenes($projectSlug);
	}elseif($project_type_slug == 'energy_games'){
		vrodos_create_energy_default_scenes($projectSlug);
	}elseif($project_type_slug == 'chemistry_games'){
		vrodos_create_chemistry_default_scenes($projectSlug);
	}elseif($project_type_slug == 'vrexpo_games'){

		vrodos_create_vrexpo_default_scenes($projectSlug);
		
	}elseif($project_type_slug == 'virtualproduction_games'){
	
	
	
	
	
	
	
	} else {

		// Main Menu
		$mainmenuSceneTitle = 'Main Menu';
		
		$mainmenuSceneSlug = $projectSlug . '-main-menu';
		
		// First Scene
		if ( $project_type_slug == 'archaeology_games' ) {
			$firstSceneTitle = 'Place'; //Title for First Menu
			$firstSceneSlug  = $projectSlug . '-first-scene'; //Slug for First Menu
		} else {
			$firstSceneTitle = 'Lab'; //Title for First Menu
			$firstSceneSlug  = $projectSlug . '-first-scene'; //Slug for First Menu
		}
		
		// Credits
		$credentialsSceneTitle = 'Credits'; //Title for Credentials Menu
		$credentialsSceneSlug  = $projectSlug . '-credits-scene'; //Slug for Credentials Menu
		
		// Exams
		if ( $project_type_slug == 'chemistry_games' ) {
			
			// 2D
			$exam2dSceneTitle = 'Molecule Naming';
			$exam2dSceneSlug  = $projectSlug . '-exam2d';
			
			// 3D
			$exam3dSceneTitle = 'Molecule Construction';
			$exam3dSceneSlug  = $projectSlug . '-exam3d';
		}
		
		$default_json = '';
		
		// Energy Games
		if ( $project_type_slug == 'energy_games' ) {
			
			// First Scene
			$firstSceneYAML   = get_term_by( 'slug', 'educational-energy', 'vrodos_scene_yaml' ); //Yaml Tax for First Scene
			$firstSceneYAMLID = $firstSceneYAML->term_id;
			
			// Main Menu Scene
			$mainmenuSceneYAML   = get_term_by( 'slug', 'mainmenu-yaml', 'vrodos_scene_yaml' ); //Yaml Tax for Main Menu
			$mainmenuSceneYAMLID = $mainmenuSceneYAML->term_id;
			
			// Credentials Scene
			$credentialsSceneYAML   = get_term_by( 'slug', 'credentials-yaml', 'vrodos_scene_yaml' ); //Yaml Tax for Credentials Scene
			$credentialsSceneYAMLID = $credentialsSceneYAML->term_id;
			
			$default_json = vrodos_getDefaultJSONscene( 'energy' );
			
			// Archaeology
		} elseif ( $project_type_slug == 'archaeology_games' ) {
			
			// First Scene
			$firstSceneYAML   = get_term_by( 'slug', 'wonderaround-yaml', 'vrodos_scene_yaml' ); //Yaml Tax for First Scene
			$firstSceneYAMLID = $firstSceneYAML->term_id;
			
			// Main Menu
			$mainmenuSceneYAML   = get_term_by( 'slug', 'mainmenu-arch-yaml', 'vrodos_scene_yaml' ); //Yaml Tax for Main Menu
			$mainmenuSceneYAMLID = $mainmenuSceneYAML->term_id;
			
			// Credentials Scene
			$credentialsSceneYAML   = get_term_by( 'slug', 'credentials-arch-yaml', 'vrodos_scene_yaml' ); //Yaml Tax for Credentials Scene
			$credentialsSceneYAMLID = $credentialsSceneYAML->term_id;
			
			$default_json = vrodos_getDefaultJSONscene( 'archaeology' );
			
			// Chemistry
		} elseif ( $project_type_slug == 'chemistry_games' ) {
			
			// First Scene
			$firstSceneYAML   = get_term_by( 'slug', 'wonderaround-lab-yaml', 'vrodos_scene_yaml' ); //Yaml Tax for First Scene (Chemistry)
			$firstSceneYAMLID = $firstSceneYAML->term_id;
			
			// Main Menu Scene
			$mainmenuSceneYAML   = get_term_by( 'slug', 'mainmenu-chem-yaml', 'vrodos_scene_yaml' ); //Yaml Tax for Main Menu (Chemistry)
			$mainmenuSceneYAMLID = $mainmenuSceneYAML->term_id;
			
			// Credentials Scene
			$credentialsSceneYAML   = get_term_by( 'slug', 'credentials-chem-yaml', 'vrodos_scene_yaml' ); //Yaml Tax for Credentials Scene (Chemistry)
			$credentialsSceneYAMLID = $credentialsSceneYAML->term_id;
			
			// Exam 2D Scene
			$exam2dSceneYAML   = get_term_by( 'slug', 'exam2d-chem-yaml', 'vrodos_scene_yaml' ); //Yaml Tax for Exam 2d Scene (Chemistry)
			$exam2dSceneYAMLID = $exam2dSceneYAML->term_id;
			
			// Exam 3D Scene
			$exam3dSceneYAML   = get_term_by( 'slug', 'exam3d-chem-yaml', 'vrodos_scene_yaml' ); //Yaml Tax for Exam 3d Scene (Chemistry)
			$exam3dSceneYAMLID = $exam3dSceneYAML->term_id;
			
			$default_json = vrodos_getDefaultJSONscene( 'chemistry' );
		}
		
		// Create Main Menu Scene Data
		$mainmenuSceneData = array(
			'post_title'   => $mainmenuSceneTitle,
			'post_content' => 'Main Menu of the Game',
			'post_name'    => $mainmenuSceneSlug,
			'post_type'    => 'vrodos_scene',
			'post_status'  => 'publish',
			'tax_input'    => array(
				'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
				'vrodos_scene_yaml'  => array( $mainmenuSceneYAMLID ),
			),
			'meta_input'   => array(
				'vrodos_scene_default'    => 1,
				'vrodos_scene_metatype'   => 'menu',
				'vrodos_menu_has_help'    => 1,
				'vrodos_menu_has_login'   => 1,
				'vrodos_menu_has_options' => 1,
			),
		);
		
		wp_insert_post( $mainmenuSceneData );
		
		// Create Credentials Scene Data
		$credentialsSceneData = array(
			'post_title'   => $credentialsSceneTitle,
			'post_content' => 'Credits of the Game',
			'post_name'    => $credentialsSceneSlug,
			'post_type'    => 'vrodos_scene',
			'post_status'  => 'publish',
			'tax_input'    => array(
				'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
				'vrodos_scene_yaml'  => array( $credentialsSceneYAMLID ),
			),
			'meta_input'   => array(
				'vrodos_scene_default'  => 1,
				'vrodos_scene_metatype' => 'credits',
			),
		);
		
		wp_insert_post( $credentialsSceneData );
		
		// Energy Place selection
		if ( $project_type_slug == 'energy_games' ) {
			
			$firstSceneTitle = 'Mountains'; //Title for First Menu
			$firstSceneSlug  = $projectSlug . '-mountains'; //Slug for First Menu
			
			$secondSceneTitle = 'Fields'; //Title for First Menu
			$secondSceneSlug  = $projectSlug . '-fields'; //Slug for First Menu
			
			$thirdSceneTitle = 'Seashore'; //Title for First Menu
			$thirdSceneSlug  = $projectSlug . '-seashore'; //Slug for First Menu
			
			$content1 = 'Area-1 is near mountains.It has difficult access. Its windclass is High (10 m/s).
Here you have 5 places to explore.Characteristics :
	- Average Wind speed = 10 m/s
	- Access cost = 3 $';
			
			$content2 = 'Area-2 is near plain land. It has not difficult access. Its windclass is Medium (windspeeds 8.5 m/s).
Here you have 5 places to explore.
Characteristics :
	- Average Wind speed = 8.5 m/s
	- Access cost = 2 $';
			
			$content3 = 'Area-3 is near seashore. It has easy access due to port. Its windclass is Low (windspeeds 7.5 m/s).
Here you have 8 places to explore.
Characteristics :
	- Average Wind speed = 7.5 m/s
	- Access cost = 1 $';
			
			
			$image_content2 = WP_PLUGIN_DIR . "/vrodos/includes/files/samples/regions/img2.png";
			$image_content3 = WP_PLUGIN_DIR . "/vrodos/includes/files/samples/regions/img3.png";
			
			// Create First Scene Data
			$firstSceneData = array(
				'post_title'   => $firstSceneTitle,
				'post_content' => $content1,
				'post_name'    => $firstSceneSlug,
				'post_type'    => 'vrodos_scene',
				'post_status'  => 'publish',
				'tax_input'    => array(
					'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
					'vrodos_scene_yaml'  => array( $firstSceneYAMLID ),
				),
				'meta_input'   => array(
					'vrodos_scene_default'     => 1,
					'vrodos_scene_metatype'    => 'scene',
					'vrodos_scene_json_input'  => $default_json,
					'vrodos_isRegional'        => 1,
					'vrodos_scene_environment' => 'mountain',
				),
			);
			
			$secondSceneData = array(
				'post_title'   => $secondSceneTitle,
				'post_content' => $content2,
				'post_name'    => $secondSceneSlug,
				'post_type'    => 'vrodos_scene',
				'post_status'  => 'publish',
				'tax_input'    => array(
					'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
					'vrodos_scene_yaml'  => array( $firstSceneYAMLID ),
				),
				'meta_input'   => array(
					'vrodos_scene_default'     => 1,
					'vrodos_scene_metatype'    => 'scene',
					'vrodos_scene_json_input'  => $default_json,
					'vrodos_isRegional'        => 1,
					'vrodos_scene_environment' => 'fields',
				),
			);
			
			$thirdSceneData = array(
				'post_title'   => $thirdSceneTitle,
				'post_content' => $content3,
				'post_name'    => $thirdSceneSlug,
				'post_type'    => 'vrodos_scene',
				'post_status'  => 'publish',
				'tax_input'    => array(
					'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
					'vrodos_scene_yaml'  => array( $firstSceneYAMLID ),
				),
				'meta_input'   => array(
					'vrodos_scene_default'     => 1,
					'vrodos_scene_metatype'    => 'scene',
					'vrodos_scene_json_input'  => $default_json,
					'vrodos_isRegional'        => 1,
					'vrodos_scene_environment' => 'seashore',
				),
			);
			
			$scene2_id = wp_insert_post( $secondSceneData );
			$scene3_id = wp_insert_post( $thirdSceneData );
			
			$attachment2_id = vrodos_upload_img_vid_aud( $image_content2, $scene2_id );
			$attachment3_id = vrodos_upload_img_vid_aud( $image_content3, $scene3_id );
			set_post_thumbnail( $scene2_id, $attachment2_id );
			set_post_thumbnail( $scene3_id, $attachment3_id );
		} else {
			// Create First Scene Data
			$firstSceneData = array(
				'post_title'   => $firstSceneTitle,
				'post_content' => $default_json,
				'post_name'    => $firstSceneSlug,
				'post_type'    => 'vrodos_scene',
				'post_status'  => 'publish',
				'tax_input'    => array(
					'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
					'vrodos_scene_yaml'  => array( $firstSceneYAMLID ),
				),
				'meta_input'   => array(
					'vrodos_scene_default'  => 1,
					'vrodos_scene_metatype' => 'scene',
					'vrodos_scene_caption'  => 'Auto-created scene',
					'vrodos_isRegional'     => 0,
				),
			);
		}
		
		
		if ( $project_type_slug == 'chemistry_games' ) {
			// Create Exam Scene Data
			$exam2dSceneData = array(
				'post_title'   => $exam2dSceneTitle,
				'post_content' => 'Create Molecule Naming puzzle game',
				'post_name'    => $exam2dSceneSlug,
				'post_type'    => 'vrodos_scene',
				'post_status'  => 'publish',
				'tax_input'    => array(
					'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
					'vrodos_scene_yaml'  => array( $exam2dSceneYAMLID ),
				),
				'meta_input'   => array(
					'vrodos_scene_default'    => 1,
					'vrodos_scene_metatype'   => 'sceneExam2d',
					'vrodos_scene_json_input' => $default_json,
				),
			);
			
			wp_insert_post( $exam2dSceneData );
			
			$exam3dSceneData = array(
				'post_title'   => $exam3dSceneTitle,
				'post_content' => 'Create Molecule Construction puzzle game',
				'post_name'    => $exam3dSceneSlug,
				'post_type'    => 'vrodos_scene',
				'post_status'  => 'publish',
				'tax_input'    => array(
					'vrodos_scene_pgame' => array( $parent_project_id_as_term_id ),
					'vrodos_scene_yaml'  => array( $exam3dSceneYAMLID ),
				),
				'meta_input'   => array(
					'vrodos_scene_default'    => 1,
					'vrodos_scene_metatype'   => 'sceneExam3d',
					'vrodos_scene_json_input' => $default_json,
				),
			);
			
			wp_insert_post( $exam3dSceneData );
		}
		
		// Insert posts 1-1 into the database
		
		$scene1_id = wp_insert_post( $firstSceneData );
		if ( $project_type_slug == 'energy_games' ) {
			
			$image_content1 = WP_PLUGIN_DIR . "/vrodos/includes/files/samples/regions/img1.png";
			$attachment1_id = vrodos_upload_img_vid_aud( $image_content1, $scene1_id );
			set_post_thumbnail( $scene1_id, $attachment1_id );
		}
	}
}
