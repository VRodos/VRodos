<?php

class VRodos_Post_Type_Manager {

    public function __construct() {
        add_action('init', array($this, 'vrodos_project_cpt_construct'), 1);
        add_action('init', array($this, 'vrodos_project_taxtype_create'), 2);
        add_action('init', array($this, 'vrodos_projects_taxtypes_define'), 3);
        add_action('init', array($this, 'vrodos_scenes_construct'));
        add_action('init', array($this, 'vrodos_scenes_parent_project_tax_define'));
        add_action('init', array($this, 'vrodos_scenes_taxyaml'));
        add_action('init', array($this, 'vrodos_assets_construct'));
        add_action('init', array($this, 'vrodos_assets_taxcategory'));
        add_action('init', array($this, 'vrodos_assets_taxpgame'));
        add_action('init', array($this, 'vrodos_assets_taxcategory_ipr'));
    }

    // Create custom post type 'vrodos_game'
    public function vrodos_project_cpt_construct(){

        $labels = array(
            'name'               => _x( 'Projects', 'post type general name'),
            'singular_name'      => _x( 'Project', 'post type singular name'),
            'menu_name'          => _x( 'Projects', 'admin menu'),
            'name_admin_bar'     => _x( 'Project', 'add new on admin bar'),
            'add_new'            => _x( 'Add New', 'add new on menu'),
            'add_new_item'       => __( 'Add New Project'),
            'new_item'           => __( 'New Project'),
            'edit'               => __( 'Edit'),
            'edit_item'          => __( 'Edit Project'),
            'view'               => __( 'View'),
            'view_item'          => __( 'View Project'),
            'all_items'          => __( 'All Projects'),
            'search_items'       => __( 'Search Projects'),
            'parent_item_colon'  => __( 'Parent Projects:'),
            'parent'             => __( 'Parent Project'),
            'not_found'          => __( 'No Projects found.'),
            'not_found_in_trash' => __( 'No Projects found in Trash.')
        );

        $args = array(
            'labels'                => $labels,
            'description'           => 'A Project is the entity that defines a solid work item',
            'public'                => true,
            'exclude_from_search'   => true,
            'publicly_queryable'    => false,
            'show_in_nav_menus'     => false,
            'show_ui'               => true,
            'show_in_menu'          => false,
            'menu_position'     => 26,
            'menu_icon'         =>'dashicons-media-interactive',
            'taxonomies'        => array('vrodos_game_type'),
            //'supports'          => array('title','author','editor','custom-fields','revisions'),
            'supports'          => array('title','author','editor','revisions'),
            'hierarchical'      => false,
            'has_archive'       => false,
            'capabilities' => array(
                'publish_posts' => 'publish_vrodos_project',
                'edit_posts' => 'edit_vrodos_project',
                'edit_others_posts' => 'edit_others_vrodos_project',
                'delete_posts' => 'delete_vrodos_project',
                'delete_others_posts' => 'delete_others_vrodos_project',
                'read_private_posts' => 'read_private_vrodos_project',
                'edit_post' => 'edit_vrodos_project',
                'delete_post' => 'delete_vrodos_project',
                'read_post' => 'read_vrodos_project'
            )
        );

        register_post_type('vrodos_game', $args);
    }


    // Create Project Type as custom taxonomy 'vrodos_game_type'
    public function vrodos_project_taxtype_create(){

        $labels = array(
            'name'              => _x( 'Project Type', 'taxonomy general name'),
            'singular_name'     => _x( 'Project Type', 'taxonomy singular name'),
            'menu_name'         => _x( 'Project Types', 'admin menu'),
            'search_items'      => __( 'Search Project Types'),
            'all_items'         => __( 'All Project Types'),
            'parent_item'       => __( 'Parent Project Type'),
            'parent_item_colon' => __( 'Parent Project Type:'),
            'edit_item'         => __( 'Edit Project Type'),
            'update_item'       => __( 'Update Project Type'),
            'add_new_item'      => __( 'Add New Project Type'),
            'new_item_name'     => __( 'New Project Type')
        );

        $args = array(
            'description' => 'Type of Game Project',
            'labels'    => $labels,
            'public'    => false,
            'show_ui'   => true,
            'hierarchical' => true,
            'show_admin_column' => true,
            'capabilities' => array (
                'manage_terms' => 'manage_vrodos_project_type',
                'edit_terms' => 'manage_vrodos_project_type',
                'delete_terms' => 'manage_vrodos_project_type',
                'assign_terms' => 'edit_vrodos_project_type'
            ),
        );

        register_taxonomy('vrodos_game_type', 'vrodos_game', $args);
    }

    public function vrodos_projects_taxtypes_define(){
        wp_insert_term('archaeology','vrodos_game_type',       array('description'=> 'Default Projects', 'slug' => 'archaeology_games'));
        wp_insert_term('vrexpo',     'vrodos_game_type',       array('description'=> 'Exhibition Projects', 'slug' => 'vrexpo_games'));
        wp_insert_term('virtualproduction','vrodos_game_type', array('description'=> 'Virtual Production Projects', 'slug' => 'virtualproduction_games'));
    }

    // Create Scene - Scene as custom type 'vrodos_scene'
    public function vrodos_scenes_construct() {

        $labels = array(
            'name' => _x('Scenes', 'post type general name'),
            'singular_name' => _x('Scene', 'post type singular name'),
            'menu_name' => _x('Scenes', 'admin menu'),
            'name_admin_bar' => _x('Scene', 'add new on admin bar'),
            'add_new' => _x('Add New', 'add new on menu'),
            'add_new_item' => __('Add New Scene'),
            'new_item' => __('New Scene'),
            'edit' => __('Edit'),
            'edit_item' => __('Edit Scene'),
            'view' => __('View'),
            'view_item' => __('View Scene'),
            'all_items' => __('All Scenes'),
            'search_items' => __('Search Scenes'),
            'parent_item_colon' => __('Parent Scenes:'),
            'parent' => __('Parent Scene'),
            'not_found' => __('No Scenes found.'),
            'not_found_in_trash' => __('No Scenes found in Trash.')
        );
        $args = array(
            'labels' => $labels,
            'description' => 'Displays all the Scenes of a Project',
            'public' => true,
            'exclude_from_search' => true,
            'publicly_queryable' => false,
            'show_in_nav_menus' => false,
            'show_ui'           => true,
            'show_in_menu'      => false,
            'menu_position' => 25,
            'menu_icon' => 'dashicons-media-default',
            'taxonomies' => array('vrodos_scene_pgame','vrodos_scene_yaml'),
            'supports' => array('title', 'author', 'editor', 'thumbnail','revisions'),
            'hierarchical' => false,
            'has_archive' => false,
            'capabilities' => array(
                'publish_posts' => 'publish_vrodos_scene',
                'edit_posts' => 'edit_vrodos_scene',
                'edit_others_posts' => 'edit_others_vrodos_scene',
                'delete_posts' => 'delete_vrodos_scene',
                'delete_others_posts' => 'delete_others_vrodos_scene',
                'read_private_posts' => 'read_private_vrodos_scene',
                'edit_post' => 'edit_vrodos_scene',
                'delete_post' => 'delete_vrodos_scene',
                'read_post' => 'read_vrodos_scene',
            ),
        );
        register_post_type('vrodos_scene', $args);
    }

    // Create Scene Taxonomy, namely the game that the scene belongs
    public function vrodos_scenes_parent_project_tax_define() {
        $labels = array(
            'name' => _x('Scene Parent Taxonomy', 'taxonomy general name'),
            'singular_name' => _x('Parent Taxonomy', 'taxonomy singular name'),
            'menu_name' => _x('Parent Taxonomies', 'admin menu'),
            'search_items' => __('Search Parent Taxonomies'),
            'all_items' => __('All Scene Parent Taxonomies'),
            'parent_item' => __('Scene Parent Taxonomy'),
            'parent_item_colon' => __('Scene Parent Taxonomy:'),
            'edit_item' => __('Edit Parent Taxonomy'),
            'update_item' => __('Update Parent Taxonomy'),
            'add_new_item' => __('Add New Parent Taxonomy'),
            'new_item_name' => __('New Parent Taxonomy')
        );

        $args = array(
            'description' => 'Parent Taxonomy that the Scene belongs to',
            'labels' => $labels,
            'public' => true,
            'show_ui' => true,
            'show_in_menu' => true,
            'hierarchical' => false,
            'show_admin_column' => true,
            'capabilities' => array (
                'manage_terms' => 'manage_vrodos_taxpgame',
                'edit_terms' => 'manage_vrodos_taxpgame',
                'delete_terms' => 'manage_vrodos_taxpgame',
                'assign_terms' => 'edit_vrodos_taxpgame'
            ),
        );

        register_taxonomy('vrodos_scene_pgame', 'vrodos_scene', $args);
    }

    // Create Scene YAML Template - YAML Template that the Scene belongs as custom taxonomy 'vrodos_scene_yaml'
    public function vrodos_scenes_taxyaml() {
        $labels = array(
            'name' => _x('Scene Type', 'taxonomy general name'),
            'singular_name' => _x('Scene Type', 'taxonomy singular name'),
            'menu_name' => _x('Scene Types', 'admin menu'),
            'search_items' => __('Search Scene Types'),
            'all_items' => __('All Scene Types'),
            'parent_item' => __('Parent Scene Type'),
            'parent_item_colon' => __('Parent Scene Type:'),
            'edit_item' => __('Edit Scene Type'),
            'update_item' => __('Update Scene Type'),
            'add_new_item' => __('Add New Scene Type'),
            'new_item_name' => __('New Scene Type')
        );
        $args = array(
            'description' => 'Scene Type (YAML Template) that the Scene belongs',
            'labels' => $labels,
            'public' => false,
            'show_ui' => true,
            'show_in_menu' => true,
            'hierarchical' => true,
            'show_admin_column' => true,
            'capabilities' => array (
                'manage_terms' => 'manage_vrodos_scene_yaml',
                'edit_terms' => 'manage_vrodos_scene_yaml',
                'delete_terms' => 'manage_vrodos_scene_yaml',
                'assign_terms' => 'edit_vrodos_scene_yaml'
            ),
        );
        register_taxonomy('vrodos_scene_yaml', 'vrodos_scene', $args);
    }


    // Create Asset3D as custom type 'vrodos_asset3d'
    public function vrodos_assets_construct(){

        $labels = array(
            'name' => _x('Assets 3D', 'post type general name'),
            'singular_name' => _x('Asset 3D', 'post type singular name'),
            'menu_name' => _x('Assets 3D', 'admin menu'),
            'name_admin_bar' => _x('Asset 3D', 'add new on admin bar'),
            'add_new' => _x('Add New', 'add new on menu'),
            'add_new_item' => __('Add New Asset 3D'),
            'new_item' => __('New Asset 3D'),
            'edit' => __('Edit'),
            'edit_item' => __('Edit Asset 3D'),
            'view' => __('View'),
            'view_item' => __('View Asset 3D'),
            'all_items' => __('All Assets 3D'),
            'search_items' => __('Search Assets 3D'),
            'parent_item_colon' => __('Parent Assets 3D:'),
            'parent' => __('Parent Asset 3D'),
            'not_found' => __('No Assets 3D found.'),
            'not_found_in_trash' => __('No Assets 3D found in Trash.')
        );

        $args = array(
            'labels' => $labels,
            'description' => 'Displays Assets 3D',
            'public' => true,
            'exclude_from_search' => true,
            'publicly_queryable' => false,
            'show_in_nav_menus' => false,
            'show_ui'               => true,
            'show_in_menu'          => false,
            'menu_position' => 25,
            'menu_icon' => 'dashicons-editor-textcolor',
            'taxonomies' => array('vrodos_asset3d_cat', 'vrodos_asset3d_pgame', 'vrodos_asset3d_ipr_cat'),
            'supports' => array('title', 'editor', 'custom-fields', 'thumbnail','revisions','author'),
            'hierarchical' => false,
            'show_in_graphql' => true,
            'graphql_single_name' => 'vrodosAsset3d',
            'graphql_plural_name' => 'vrodosAssets3d',
            'has_archive' => false,
            'capabilities' => array(
                'publish_posts' => 'publish_vrodos_asset3d',
                'edit_posts' => 'edit_vrodos_asset3d',
                'edit_others_posts' => 'edit_others_vrodos_asset3d',
                'delete_posts' => 'delete_vrodos_asset3d',
                'delete_others_posts' => 'delete_others_vrodos_asset3d',
                'read_private_posts' => 'read_private_vrodos_asset3d',
                'edit_post' => 'edit_vrodos_asset3d',
                'delete_post' => 'delete_vrodos_asset3d',
                'read_post' => 'read_vrodos_asset3d',
            ),
        );
        register_post_type('vrodos_asset3d', $args);
    }

    // Create custom taxonomy "Asset Type"
    public function vrodos_assets_taxcategory(){

        $labels = array(
            'name' => _x('Asset Type', 'taxonomy general name'),
            'singular_name' => _x('Asset Type', 'taxonomy singular name'),
            'menu_name' => _x('Asset Types', 'admin menu'),
            'search_items' => __('Search Asset Types'),
            'all_items' => __('All Asset Types'),
            'parent_item' => __('Parent Asset Type'),
            'parent_item_colon' => __('Parent Asset Type:'),
            'edit_item' => __('Edit Asset Type'),
            'update_item' => __('Update Asset Type'),
            'add_new_item' => __('Add New Asset Type'),
            'new_item_name' => __('New Asset Type')
        );

        $args = array(
            'description' => 'Type of 3D asset',
            'labels' => $labels,
            'public' => false,
            'show_ui' => true,
            'hierarchical' => false,
            'show_admin_column' => true,
            'capabilities' => array (
                'manage_terms' => 'manage_vrodos_asset3d_cat',
                'edit_terms' => 'manage_vrodos_asset3d_cat',
                'delete_terms' => 'manage_vrodos_asset3d_cat',
                'assign_terms' => 'edit_vrodos_asset3d_cat'
            ),
            'show_in_graphql' => true,
            'graphql_single_name' => 'VrodosAsset3DCategory',
            'graphql_plural_name' => 'VrodosAsset3DCategories',
        );
        register_taxonomy('vrodos_asset3d_cat', 'vrodos_asset3d', $args);
    }

    // Create Asset Project as custom taxonomy
    public function vrodos_assets_taxpgame(){

        $labels = array(
            'name' => _x('Asset Parent Taxonomy', 'taxonomy general name'),
            'singular_name' => _x('Parent Taxonomy', 'taxonomy singular name'),
            'menu_name' => _x('Parent Taxonomies', 'admin menu'),
            'search_items' => __('Search Parent Taxonomies'),
            'all_items' => __('All Asset Parent Taxonomies'),
            'parent_item' => __('Asset Parent Taxonomy'),
            'parent_item_colon' => __('Asset Parent Taxonomy:'),
            'edit_item' => __('Edit Parent Taxonomy'),
            'update_item' => __('Update Parent Taxonomy'),
            'add_new_item' => __('Add New Parent Taxonomy'),
            'new_item_name' => __('New Parent Taxonomy')
        );

        $args = array(
            'description' => 'Parent Taxonomy assignment of a 3D Asset',
            'labels' => $labels,
            'public' => false,
            'show_ui' => true,
            'hierarchical' => false,
            'show_admin_column' => true,
            'capabilities' => array (
                'manage_terms' => 'manage_vrodos_asset3d_pgame',
                'edit_terms' => 'manage_vrodos_asset3d_pgame',
                'delete_terms' => 'manage_vrodos_asset3d_pgame',
                'assign_terms' => 'edit_vrodos_asset3d_pgame'
            ),
        );
        register_taxonomy('vrodos_asset3d_pgame', 'vrodos_asset3d', $args);
    }

    // Create Asset Category as custom taxonomy
    public function vrodos_assets_taxcategory_ipr(){
        $labels = array(
            'name' => _x('Asset IPR', 'taxonomy general name'),
            'singular_name' => _x('Asset IPR', 'taxonomy singular name'),
            'menu_name' => _x('Asset IPR', 'admin menu'),
            'search_items' => __('Search Asset by IPR'),
            'all_items' => __('All Asset IPRs'),
            'parent_item' => __('Parent Asset IPR'),
            'parent_item_colon' => __('Parent Asset IPR:'),
            'edit_item' => __('Edit Asset IPR'),
            'update_item' => __('Update Asset IPR'),
            'add_new_item' => __('Add New Asset IPR'),
            'new_item_name' => __('New Asset IPR')
        );
        $args = array(
            'description' => 'IPR taxonomy of 3D asset',
            'labels' => $labels,
            'public' => true,
            'show_ui' => true,
            'hierarchical' => false,
            'show_admin_column' => true,
            'capabilities' => array (
                'manage_terms' => 'manage_vrodos_asset3d_iprcat',
                'edit_terms' => 'manage_vrodos_asset3d_iprcat',
                'delete_terms' => 'manage_vrodos_asset3d_iprcat',
                'assign_terms' => 'edit_vrodos_asset3d_iprcat'
            ),
        );
        register_taxonomy('vrodos_asset3d_ipr_cat', 'vrodos_asset3d', $args);

        $terms_ipr = [
            ['Private','Nobody can view or edit the asset','asset_private'],
            ['Shared_A - View','Others can view only', 'asset_shared_type_a'],
            ['Shared_B - (A) & Clone','Others can view, comment, and clone asset with custom descriptions','asset_shared_type_b'],
            ['Shared_C - (A,B) & Use ','Others can view, comment, clone and use in experiences','asset_shared_type_c'],
            ['Shared_D - (A,B,C) & Download','Others can view, comment, clone, use in experiences and download','asset_shared_type_d'],
            ['Shared_E - Free to reuse in any way','Others can reuse in any way they see fit','asset_shared_type_e']
        ];

        foreach ($terms_ipr as $ti) {
            wp_insert_term($ti[0], 'vrodos_asset3d_ipr_cat', array('description' => $ti[1], 'slug' => $ti[2]));
        }
    }
}
