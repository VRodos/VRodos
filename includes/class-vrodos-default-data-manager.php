<?php

if (!defined('ABSPATH')) {
    exit;
}

class VRodos_Default_Data_Manager {

    public function __construct() {
        add_action('init', array($this, 'create_asset_categories'));
    }

    public function create_asset_categories() {
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
            if (!term_exists($cat['slug'], 'vrodos_asset3d_cat')) {
                $inserted_cat = wp_insert_term(
                    $cat['name'],
                    'vrodos_asset3d_cat',
                    array(
                        'description'=> $cat['description'],
                        'slug' => $cat['slug'],
                    )
                );

                if (!is_wp_error($inserted_cat)) {
                    update_term_meta($inserted_cat['term_id'], 'vrodos_assetcat_icon', $cat['ic']);
                }
            }
        }
    }
}
