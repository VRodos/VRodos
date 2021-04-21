<?php

/***************************************************************************************************************/
// CREATE ASSETS' TYPES with default values (ENERGY GAMES)
/***************************************************************************************************************/



function vrodos_assets_taxcategory_energy_fill(){

  wp_insert_term(
      'Terrain', // the term
      'vrodos_asset3d_cat', // the taxonomy
      array(
          'description'=> 'A Terrain is the ground where turbines can be placed.',
          'slug' => 'terrain',
      )
  );
  $inserted_term6 = get_term_by('slug', 'terrain', 'vrodos_asset3d_cat');
  update_term_meta($inserted_term6->term_id, 'vrodos_yamlmeta_assetcat_pat', vrodos_default_value_terrain_get(), true);
  update_term_meta($inserted_term6->term_id, 'vrodos_assetcat_gamecat', 2 , true);

  wp_insert_term(
      'Decoration', // the term
      'vrodos_asset3d_cat', // the taxonomy
      array(
          'description'=> 'A Decoration is a game object that can improve the immersiveness such as Archaeological site, Power lines, Trees, etc.',
          'slug' => 'decoration',
      )
  );
  $inserted_term7 = get_term_by('slug', 'decoration', 'vrodos_asset3d_cat');
  update_term_meta($inserted_term7->term_id, 'vrodos_yamlmeta_assetcat_pat', vrodos_default_value_decoration_energy_get(), true);
  update_term_meta($inserted_term7->term_id, 'vrodos_assetcat_gamecat', 2 , true);

//  wp_insert_term(
//      'Consumer', // the term
//      'vrodos_asset3d_cat', // the taxonomy
//      array(
//          'description'=> 'A Consumer is a game object that consumes energy (e.g. a building).',
//          'slug' => 'consumer',
//      )
//  );
//  $inserted_term8 = get_term_by('slug', 'consumer', 'vrodos_asset3d_cat');
//  update_term_meta($inserted_term8->term_id, 'vrodos_yamlmeta_assetcat_pat', vrodos_default_value_consumer_get(), true);
//  update_term_meta($inserted_term8->term_id, 'vrodos_assetcat_gamecat', 2 , true);

//  wp_insert_term(
//      'Producer', // the term
//      'vrodos_asset3d_cat', // the taxonomy
//      array(
//          'description'=> 'A Producer is a game object that generates energy (e.g. a Wind Turbine or a Solar Panel).',
//          'slug' => 'producer',
//      )
//  );
//  $inserted_term9 = get_term_by('slug', 'producer', 'vrodos_asset3d_cat');
//  update_term_meta($inserted_term9->term_id, 'vrodos_yamlmeta_assetcat_pat', vrodos_default_value_producer_get(), true);
//  update_term_meta($inserted_term9->term_id, 'vrodos_assetcat_gamecat', 2 , true);

  wp_insert_term(
      'Marker', // the term
      'vrodos_asset3d_cat', // the taxonomy
      array(
          'description'=> 'Markers are 3D model where user clicks and thus going from one Scene to another Scene.',
          'slug' => 'marker',
      )
  );
  $inserted_term10 = get_term_by('slug', 'marker', 'vrodos_asset3d_cat');
  update_term_meta($inserted_term10->term_id, 'vrodos_yamlmeta_assetcat_pat', vrodos_default_value_marker_get(), true);
  update_term_meta($inserted_term10->term_id, 'vrodos_assetcat_gamecat', 2 , true);

}

/***************************************************************************************************************/
// CREATE PROJECT SETTINGS with default values (ENERGY GAMES)
/***************************************************************************************************************/



/***************************************************************************************************************/
// CREATE SCENE TYPES (ENERGY GAMES)
/***************************************************************************************************************/



function vrodos_scenes_types_energy_standard_cre(){

  if (!term_exists('Main Menu Energy Template', 'vrodos_scene_yaml')) {
    wp_insert_term(
        'Main Menu Energy Template', // the term
        'vrodos_scene_yaml', // the taxonomy
        array(
            'description' => 'YAML Template for Main Menu (Energy) scenes',
            'slug' => 'mainmenu-yaml',
        )
    );
  }

  if (!term_exists('Credits Energy Template', 'vrodos_scene_yaml')) {
    wp_insert_term(
        'Credits Energy Template', // the term
        'vrodos_scene_yaml', // the taxonomy
        array(
            'description' => 'YAML Template for Credits (Energy) scenes',
            'slug' => 'credentials-yaml',
        )
    );
  }

  if (!term_exists('Educational Energy Template', 'vrodos_scene_yaml')) {
    wp_insert_term(
        'Educational Energy Template', // the term
        'vrodos_scene_yaml', // the taxonomy
        array(
            'description' => 'YAML Template for Educational Energy scenes',
            'slug' => 'educational-energy',
        )
    );
  }
}

/***************************************************************************************************************/
//
/***************************************************************************************************************/


?>
