<?php

/***************************************************************************************************************/
// YAMLS for ASSETS' TYPES default values (CHEMISTRY GAMES)
/***************************************************************************************************************/

function vrodos_getAssetYAML_chemistry($myasset_type){
    $def_json = '';

    if($myasset_type == 'room') {
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/default_game_project_data/chemistry/assets/chemistry-room.txt");
    }elseif($myasset_type == 'gate'){
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/default_game_project_data/chemistry/assets/chemistry-gate.txt");
    }

    return $def_json;
}

/***************************************************************************************************************/
// YAMLS for SCENES default values (CHEMISTRY GAMES)
/***************************************************************************************************************/

function vrodos_getSceneYAML_chemistry($myscene_type){
    $def_json = '';

    if($myscene_type == 'menu') {
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/default_game_project_data/chemistry/scenes/chemistry-menu.txt");
    }elseif($myscene_type == 'credits'){
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/default_game_project_data/chemistry/scenes/chemistry-credits.txt");
    }elseif($myscene_type == 'help'){
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/default_game_project_data/chemistry/scenes/chemistry-help.txt");
    }elseif($myscene_type == 'login'){
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/default_game_project_data/chemistry/scenes/chemistry-login.txt");
    }elseif($myscene_type == 'lab'){
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/default_game_project_data/chemistry/scenes/chemistry-lab.txt");
    }elseif($myscene_type == 'exam2d'){
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/default_game_project_data/chemistry/scenes/chemistry-exam2d.txt");
    }elseif($myscene_type == 'exam3d'){
        $def_json = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/default_game_project_data/chemistry/scenes/chemistry-exam3d.txt");
    }elseif($myscene_type == 'reward'){
        $def_json = '';
    }elseif($myscene_type == 'selector'){
        $def_json = '';
    }

    return $def_json;
}

/***************************************************************************************************************/
// CREATE ASSETS' TYPES with default values (CHEMISTRY GAMES)
/***************************************************************************************************************/



function vrodos_assets_taxcategory_chemistry_fill(){

    wp_insert_term(
        'Room', // the term
        'vrodos_asset3d_cat', // the taxonomy
        array(
            'description'=> 'Chemistry Asset Type (Room)',
            'slug' => 'room',
        )
    );
    $inserted_term1 = get_term_by('slug', 'room', 'vrodos_asset3d_cat');
    //update_term_meta($inserted_term1->term_id, 'vrodos_yamlmeta_assetcat_pat', vrodos_default_value_room_get(), true);
    update_term_meta($inserted_term1->term_id, 'vrodos_assetcat_gamecat', 3 , true);

    wp_insert_term(
        'Gate', // the term
        'vrodos_asset3d_cat', // the taxonomy
        array(
            'description'=> 'Chemistry Asset Type (Gate)',
            'slug' => 'gate',
        )
    );
    $inserted_term2 = get_term_by('slug', 'gate', 'vrodos_asset3d_cat');
    //update_term_meta($inserted_term2->term_id, 'vrodos_yamlmeta_assetcat_pat', vrodos_default_value_gate_get(), true);
    update_term_meta($inserted_term2->term_id, 'vrodos_assetcat_gamecat', 3 , true);

    wp_insert_term(
        'Molecule', // the term
        'vrodos_asset3d_cat', // the taxonomy
        array(
            'description'=> 'Chemistry Asset Type (Molecule)',
            'slug' => 'molecule',
        )
    );
    $inserted_term5 = get_term_by('slug', 'molecule', 'vrodos_asset3d_cat');
    //update_term_meta($inserted_term5->term_id, 'vrodos_yamlmeta_assetcat_pat', vrodos_default_value_molecule_get(), true);
    update_term_meta($inserted_term5->term_id, 'vrodos_assetcat_gamecat', 3 , true);

}


/***************************************************************************************************************/
// CREATE SCENE TYPES (CHEMISTRY GAMES)
/***************************************************************************************************************/



function vrodos_scenes_types_chemistry_standard_cre(){

    if (!term_exists('Main Menu Chemistry Template', 'vrodos_scene_yaml')) {
        wp_insert_term(
            'Main Menu Chemistry Template', // the term
            'vrodos_scene_yaml', // the taxonomy
            array(
                'description' => 'YAML Template for Main Menu (Chemistry) scenes',
                'slug' => 'mainmenu-chem-yaml',
            )
        );
    }

    if (!term_exists('Credits Chemistry Template', 'vrodos_scene_yaml')) {
        wp_insert_term(
            'Credits Chemistry Template', // the term
            'vrodos_scene_yaml', // the taxonomy
            array(
                'description' => 'YAML Template for Credits (Chemistry) scenes',
                'slug' => 'credentials-chem-yaml',
            )
        );
    }

    if (!term_exists('Lab', 'vrodos_scene_yaml')) {
        wp_insert_term(
            'Lab', // the term
            'vrodos_scene_yaml', // the taxonomy
            array(
                'description' => 'YAML Template for Chemistry scenes (WonderAround style)',
                'slug' => 'wonderaround-lab-yaml',
            )
        );
    }

    if (!term_exists('2D naming puzzle', 'vrodos_scene_yaml')) {
        wp_insert_term(
            '2D naming puzzle', // the term
            'vrodos_scene_yaml', // the taxonomy
            array(
                'description' => 'YAML Template for Chemistry 2D naming puzzle',
                'slug' => 'exam2d-chem-yaml',
            )
        );
    }

    if (!term_exists('3D construction puzzle', 'vrodos_scene_yaml')) {
        wp_insert_term(
            '3D construction puzzle', // the term
            'vrodos_scene_yaml', // the taxonomy
            array(
                'description' => 'YAML Template for Chemistry 3D construction puzzle',
                'slug' => 'exam3d-chem-yaml',
            )
        );
    }

}

/***************************************************************************************************************/
//
/***************************************************************************************************************/

 ?>
