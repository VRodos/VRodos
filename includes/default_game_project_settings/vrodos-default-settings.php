<?php

// Create the default asset types for all types of projects
function vrodos_create_asset_categories(){

    $categories = [
        'decoration' => [
            'name' => 'Decoration',
            'slug' => 'decoration',
            'description' => 'Decorations are 3D models that serve to build the 3D space. They are not interactable.',
            'ic' => 'grid_on'
        ],
        'door' => [
            'name' => 'Door',
            'slug' => 'door',
            'description' => 'Doors are 3D objects that serve as entry points to other scenes.',
            'ic' => 'exit_to_app'
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
       /* 'poi-help' => [
            'name' => 'POI - Help',
            'slug' => 'poi-help',
            'description' => 'An interactable 3D object. Launches a popup window on click that features a contact form.',
            'ic' => 'help'
        ],*/
        'chat' => [
            'name' => 'Chat',
            'slug' => 'chat',
            'description' => 'A chatbox component. It is a 3D object that when clicked, a user can join a chat session',
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
            // update_term_meta($inserted_cat['term_id'], 'vrodos_assetcat_gamecat', 1 , true);
            update_term_meta($inserted_cat['term_id'], 'vrodos_assetcat_icon', $cat['ic'] );
        }
    }
    //$inserted_term1 = get_term_by('slug', 'artifact', 'vrodos_asset3d_cat');
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
?>
