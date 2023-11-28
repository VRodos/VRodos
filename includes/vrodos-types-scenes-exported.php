<?php

// Create Scene - Scene as custom type 'vrodos_scene_exported'
function vrodos_scenes_exported_construct() {

    $labels = array(
        'name' => _x('Exported Scenes', 'post type general name'),
        'singular_name' => _x('Exported Scene', 'post type singular name'),
        'menu_name' => _x('Exported Scenes', 'admin menu'),
        'name_admin_bar' => _x('Exported Scene', 'add new on admin bar'),
        'add_new' => _x('Add New', 'add new on menu'),
        'add_new_item' => __('Add New Exported Scene'),
        'new_item' => __('New Exported Scene'),
        'edit' => __('Edit'),
        'edit_item' => __('Edit Exported Scene'),
        'view' => __('View'),
        'view_item' => __('View Exported Scene'),
        'all_items' => __('All Exported Scenes'),
        'search_items' => __('Search Exported Scenes'),
        'parent_item_colon' => __('Parent Scenes:'),
        'parent' => __('Parent Scene'),
        'not_found' => __('No Exported Scenes found.'),
        'not_found_in_trash' => __('No Exported Scenes found in Trash.')
    );
    $args = array(
        'labels' => $labels,
        'description' => 'Displays all the Exported Scenes of a Project',
        'public' => true,
        'exclude_from_search' => true,
        'publicly_queryable' => false,
        'show_in_nav_menus' => false,
        'show_ui'           => true,
        'show_in_menu'      => false,
        /*'menu_position' => 26,*/
        'taxonomies' => array('vrodos_scene_parent'),
        //'supports' => array('title', 'author', 'editor', 'custom-fields', 'thumbnail','revisions'),
        'supports' => array('title', 'author', 'editor','revisions'),
        'hierarchical' => false,
        'has_archive' => false,
        'rewrite' => array( 'slug' => 'vrodos_scene_exp' ),
        'capability_type'    => 'post',
        //'map_meta_cap' => true,
        'capabilities' => array(
            'publish_posts' => 'publish_vrodos_scene_exported',
            'edit_posts' => 'edit_vrodos_scene_exported',
            'edit_others_posts' => 'edit_others_vrodos_scene_exported',
            'delete_posts' => 'delete_vrodos_scene_exported',
            'delete_others_posts' => 'delete_others_vrodos_scene_exported',
            'read_private_posts' => 'read_private_vrodos_scene_exported',
            'edit_post' => 'edit_vrodos_scene_exported',
            'delete_post' => 'delete_vrodos_scene_exported',
            'read_post' => 'read_vrodos_scene_exported',
        ),
    );

    register_post_type('vrodos_scene_exp', $args);
}

// Create Scene Taxonomy, namely the game that the scene belongs
function vrodos_scenes_exported_parent_scene_tax_define() {
    $labels = array(
        'name' => _x('Exported Scene Parent Scene Taxonomy', 'taxonomy general name'),
        'singular_name' => _x('Parent Taxonomy', 'taxonomy singular name'),
        'menu_name' => _x('Parent Taxonomies', 'admin menu'),
        'search_items' => __('Search Parent Taxonomies'),
        'all_items' => __('All Exported Scene Parent Taxonomies'),
        'parent_item' => __('Exported Scene Parent Taxonomy'),
        'parent_item_colon' => __('Exported Scene Parent Taxonomy:'),
        'edit_item' => __('Edit Parent Taxonomy'),
        'update_item' => __('Update Parent Taxonomy'),
        'add_new_item' => __('Add New Parent Taxonomy'),
        'new_item_name' => __('New Parent Taxonomy')
    );

    $args = array(
        'description' => 'Parent Scene that the Scene belongs to',
        'labels' => $labels,
        'public' => true,
        'show_ui' => true,
        'show_in_menu' => true,
        'hierarchical' => false,
        'show_admin_column' => true,
        'capabilities' => array (
            'manage_terms' => 'manage_vrodos_exported_scene_parent_tax',
            'edit_terms' => 'manage_vrodos_exported_scene_parent_tax',
            'delete_terms' => 'manage_vrodos_exported_scene_parent_tax',
            'assign_terms' => 'edit_vrodos_exported_scene_parent_tax'
        ),
    );

    register_taxonomy('vrodos_scene_parent', 'vrodos_scene_exp', $args);
}

?>
