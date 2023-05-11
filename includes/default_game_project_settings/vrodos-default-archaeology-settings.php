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



// Create the default asset types for all types of projects
function vrodos_create_asset_categories(){

    $categories = [
        'artifact' => [
            'name' => 'Artifact',
            'slug' => 'artifact',
            'description' => 'Artifacts are 3D models that serve as decorations in the 3D space. They are not interactable.',
            'ic' => 'grid_view'
        ],
        'door' => [
            'name' => 'Door',
            'slug' => 'door',
            'description' => 'Doors are 3D objects that serve as entry points to other scenes.',
            'ic' => 'door'
        ],
        'video' => [
            'name' => 'Video',
            'slug' => 'video',
            'description' => 'A video canvas that can be placed inside the 3D space. The user can maximize it to full screen.',
            'ic' => 'movie'

        ],
        'poi-imagetext' => [
            'name' => 'POI - Image / Text',
            'slug' => 'poi-imagetext',
            'description' => 'An interactable 3D object. Launches a popup window on click that features an image and a description.',
            'ic' => 'image'
        ],
        'poi-help' => [
            'name' => 'POI - Help',
            'slug' => 'poi-help',
            'description' => 'An interactable 3D object. Launches a popup window on click that features a contact form.',
            'ic' => 'help'
        ],
        'chat' => [
            'name' => 'Chat',
            'slug' => 'chat',
            'description' => 'A chatbox component.',
            'ic' => 'chat'
        ],
        'poi-link' => [
            'name' => 'POI - Link',
            'slug' => 'poi-link',
            'description' => 'An interactable 3D object. Launches an external url, for example a website or a document file.',
            'ic' => 'open_in_new'
        ]
    ];

    foreach ($categories as $cat) {
        $inserted_cat = wp_insert_term(
            $cat['name'], // the term
            'vrodos_asset3d_cat', // the taxonomy
            array(
                'description'=> $cat['description'],
                'slug' => $cat['slug'],
            )
        );
        if ( !is_wp_error($inserted_cat) ) {
            update_term_meta($inserted_cat['term_id'], 'vrodos_assetcat_gamecat', 1 , true);
            update_term_meta($inserted_cat['term_id'], 'vrodos_assetcat_icon', $cat['ic'] );
        } else {
            //var_dump($inserted_cat->get_error_messages());
        }

    }

    //$inserted_term1 = get_term_by('slug', 'artifact', 'vrodos_asset3d_cat');

    // Backup of previous slugs
    /*  'slug' => 'artifact',
        'slug' => 'decoration_arch',
        'slug' => 'door',
        'slug' => 'site',
        'slug' => 'pois_video',
        'slug' => 'pois_imagetext',*/

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
