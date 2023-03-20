<?php

/***************************************************************************************************************/
// YAMLS for ASSETS' TYPES default values (ARCHAEOLOGY GAMES)
/***************************************************************************************************************/

function vrodos_getAssetYAML_archaeology($myasset_type){
    $def_json = '';

    if($myasset_type == 'artifact') {
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/default_game_project_data/archaeology/assets/archaeology-artifact.txt");
    }elseif($myasset_type == 'pois_imagetext'){
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/default_game_project_data/archaeology/assets/archaeology-pois_imagetext.txt");
    }elseif($myasset_type == 'pois_video'){
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/default_game_project_data/archaeology/assets/archaeology-pois_video.txt");
    }elseif($myasset_type == 'site'){
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/default_game_project_data/archaeology/assets/archaeology-site.txt");
    }elseif($myasset_type == 'door'){
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/default_game_project_data/archaeology/assets/archaeology-door.txt");
    }elseif($myasset_type == 'decoration_arch'){
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/default_game_project_data/archaeology/assets/archaeology-decoration_arch.txt");
    }

    return $def_json;
}


/***************************************************************************************************************/
// YAMLS for SCENES default values (ARCHAEOLOGY GAMES)
/***************************************************************************************************************/

function vrodos_getSceneYAML_archaeology($myscene_type){
    $def_json = '';

    if($myscene_type == 'menu') {
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/default_game_project_data/archaeology/scenes/archaeology-menu.txt");
    }elseif($myscene_type == 'credits'){
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/default_game_project_data/archaeology/scenes/archaeology-credits.txt");
    }elseif($myscene_type == 'help'){
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/default_game_project_data/archaeology/scenes/archaeology-help.txt");
    }elseif($myscene_type == 'options'){
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/default_game_project_data/archaeology/scenes/archaeology-options.txt");
    }elseif($myscene_type == 'login'){
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/default_game_project_data/archaeology/scenes/archaeology-login.txt");
    }elseif($myscene_type == 'reward'){
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/default_game_project_data/archaeology/scenes/archaeology-reward.txt");
    }elseif($myscene_type == 'wanderaround'){
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/default_game_project_data/archaeology/scenes/archaeology-wanderaround.txt");
    }elseif($myscene_type == 'selector'){
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/default_game_project_data/archaeology/scenes/archaeology-selector.txt");
    }elseif($myscene_type == 'selector2'){
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/default_game_project_data/archaeology/scenes/archaeology-selector2.txt");
    }

    return $def_json;
}



/***************************************************************************************************************/
// CREATE ASSETS' TYPES with default values (ARCHAEOLOGY GAMES)
/***************************************************************************************************************/



function vrodos_assets_taxcategory_archaeology_fill(){

    $res= wp_insert_term(
        'Artifact', // the term
        'vrodos_asset3d_cat', // the taxonomy
        array(
            'description'=> 'Artifacts are 3D models that can be clicked and inspected. They have also a textual description.',
            'slug' => 'artifact',
        )
    );
    
    $inserted_term1 = get_term_by('slug', 'artifact', 'vrodos_asset3d_cat');
    
    //update_term_meta($inserted_term1->term_id, 'vrodos_yamlmeta_assetcat_pat', vrodos_default_value_artifact_get(), true);
    update_term_meta($inserted_term1->term_id, 'vrodos_assetcat_gamecat', 1 , true);
    update_term_meta($inserted_term1->term_id, 'vrodos_assetcat_icon', "pets" );

    wp_insert_term(
        'Points of Interest (Image-Text)', // the term
        'vrodos_asset3d_cat', // the taxonomy
        array(
            'description'=> 'When clicking on a POI, information pops up as an image with a textual description.',
            'slug' => 'pois_imagetext',
        )
    );
    $inserted_term2 = get_term_by('slug', 'pois_imagetext', 'vrodos_asset3d_cat');
    //update_term_meta($inserted_term2->term_id, 'vrodos_yamlmeta_assetcat_pat', vrodos_default_value_poi_get(), true);
    update_term_meta($inserted_term2->term_id, 'vrodos_assetcat_gamecat', 1 , true);
    update_term_meta($inserted_term2->term_id, 'vrodos_assetcat_icon', 'image');
    
    wp_insert_term(
        'Points of Interest (Video)', // the term
        'vrodos_asset3d_cat', // the taxonomy
        array(
            'description'=> 'Points of interest (POIs) that open up a video',
            'slug' => 'pois_video',
        )
    );
    $inserted_term3 = get_term_by('slug', 'pois_video', 'vrodos_asset3d_cat');
    //update_term_meta($inserted_term3->term_id, 'vrodos_yamlmeta_assetcat_pat', vrodos_default_value_poi_video_get(), true);
    update_term_meta($inserted_term3->term_id, 'vrodos_assetcat_gamecat', 1 , true);
    update_term_meta($inserted_term3->term_id, 'vrodos_assetcat_icon', 'videocam');

    wp_insert_term(
        'Site', // the term
        'vrodos_asset3d_cat', // the taxonomy
        array(
            'description'=> 'Site models are static 3D models that can not be interacted with (e.g. ground, house).',
            'slug' => 'site',
        )
    );
    $inserted_term4 = get_term_by('slug', 'site', 'vrodos_asset3d_cat');
    //update_term_meta($inserted_term4->term_id, 'vrodos_yamlmeta_assetcat_pat', vrodos_default_value_site_get(), true);
    update_term_meta($inserted_term4->term_id, 'vrodos_assetcat_gamecat', 1 , true);
    update_term_meta($inserted_term4->term_id, 'vrodos_assetcat_icon', 'place');
    
    
    wp_insert_term(
        'Door', // the term
        'vrodos_asset3d_cat', // the taxonomy
        array(
            'description'=> 'Doors are gates to other scenes',
            'slug' => 'door',
        )
    );
    $inserted_term5 = get_term_by('slug', 'door', 'vrodos_asset3d_cat');
    //update_term_meta($inserted_term5->term_id, 'vrodos_yamlmeta_assetcat_pat', vrodos_default_value_door_get(), true);
    add_term_meta($inserted_term5->term_id, 'vrodos_assetcat_gamecat', 1 , true);
    update_term_meta($inserted_term5->term_id, 'vrodos_assetcat_icon', 'input');

    wp_insert_term(
        'Decoration (Archaeology)', // the term
        'vrodos_asset3d_cat', // the taxonomy
        array(
            'description'=> 'A Decoration is a 3D object that can improve the immersiveness such as a tree, a furniture, etc.',
            'slug' => 'decoration_arch',
        )
    );
    $inserted_term6 = get_term_by('slug', 'decoration_arch', 'vrodos_asset3d_cat');
    //update_term_meta($inserted_term6->term_id, 'vrodos_yamlmeta_assetcat_pat', vrodos_default_value_decoration_arch_get(), true);
    update_term_meta($inserted_term6->term_id, 'vrodos_assetcat_gamecat', 1 , true);
    update_term_meta($inserted_term6->term_id, 'vrodos_assetcat_icon', 'local_florist');
    
}



/***************************************************************************************************************/
// CREATE SCENE TYPES (ARCHAEOLOGY GAMES)
/***************************************************************************************************************/



function vrodos_scenes_types_archaeology_standard_cre(){

    if (!term_exists('Main Menu Archaeology Template', 'vrodos_scene_yaml')) {
        wp_insert_term(
            'Main Menu Archaeology Template', // the term
            'vrodos_scene_yaml', // the taxonomy
            array(
                'description' => 'YAML Template for Main Menu (Archaeology) scenes',
                'slug' => 'mainmenu-arch-yaml',
            )
        );
    }

    if (!term_exists('Credits Archaeology Template', 'vrodos_scene_yaml')) {
        wp_insert_term(
            'Credits Archaeology Template', // the term
            'vrodos_scene_yaml', // the taxonomy
            array(
                'description' => 'YAML Template for Credits (Archaeology) scenes',
                'slug' => 'credentials-arch-yaml',
            )
        );
    }

    if (!term_exists('Wonder Around Default Template', 'vrodos_scene_yaml')) {
        wp_insert_term(
            'Wonder Around Default Template', // the term
            'vrodos_scene_yaml', // the taxonomy
            array(
                'description' => 'YAML Template for Wonder Around scenes',
                'slug' => 'wonderaround-yaml',
            )
        );
    }
}

/***************************************************************************************************************/
//
/***************************************************************************************************************/
?>
