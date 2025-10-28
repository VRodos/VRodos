<?php

/**
 * Plugin Name: VRodos
 * Plugin URI: https://vrodos.iti.gr
 * Description: Make your wordpress website a VR site
 * Author: Anastasios Papazoglou Chalikias, Elias Kouslis, Dimitrios Ververidis
 * Author URI: https://vrodos.iti.gr
 * Version: 2.2
 */


// Only these variables can change with php
// @ini_set( 'memory_limit', '512M');
@ini_set( 'max_execution_time', '2400' );

// Set scope for the 3D editor (under construction feature):
// Default    : 1
// Virtual Exhibition (VRExpo)    : 2
// VirtualProduction (MediaVerse) : 3
$project_scope = 2;

// Asset Manager Class
require_once(plugin_dir_path(__FILE__) . 'includes/class-vrodos-asset-manager.php');
new VRodos_Asset_Manager();

// Post Type Manager Class
require_once(plugin_dir_path(__FILE__) . 'includes/class-vrodos-post-type-manager.php');
new VRodos_Post_Type_Manager();

// Game CPT Manager Class
require_once(plugin_dir_path(__FILE__) . 'includes/class-vrodos-game-cpt-manager.php');
new VRodos_Game_CPT_Manager();

// Scene CPT Manager Class
require_once(plugin_dir_path(__FILE__) . 'includes/class-vrodos-scene-cpt-manager.php');
new VRodos_Scene_CPT_Manager();

// Roles Manager Class
require_once(plugin_dir_path(__FILE__) . 'includes/class-vrodos-roles-manager.php');
new VRodos_Roles_Manager();

// Menu Manager Class
require_once(plugin_dir_path(__FILE__) . 'includes/class-vrodos-menu-manager.php');
new VRodos_Menu_Manager();

// Asset CPT Manager Class
require_once(plugin_dir_path(__FILE__) . 'includes/class-vrodos-asset-cpt-manager.php');
new VRodos_Asset_CPT_Manager();


//add_filter( 'wp_nav_menu_items', 'add_loginout_link', 10, 2 );
//function add_loginout_link( $items, $args ) {
//	if (is_user_logged_in() && $args->theme_location == 'top_navigation') {
//		$items .= wp_nav_menu( array('menu' => 'menu-logged-in', 'container' => '', 'echo' => false, 'items_wrap' => '%3$s') );
//	}
//    elseif (!is_user_logged_in() && $args->theme_location == 'top_navigation') {
//		$items .= wp_nav_menu( array('menu' => 'menu-logged-out', 'container' => '', 'echo' => false, 'items_wrap' => '%3$s') );
//	}
//	return $items;
//}

////===================================== Assets ============================================

include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-create-default-scenes.php' );





//===================================== Other ============================================

include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-core-upload-functions.php' );

add_filter( 'upload_dir', 'vrodos_upload_dir_forScenesOrAssets' );
add_filter( 'intermediate_image_sizes', 'vrodos_disable_imgthumbs_assets', 999 );
add_filter( 'sanitize_file_name', 'vrodos_overwrite_uploads', 10, 1 );

include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-core-functions.php' );

// Set to the lowest priority in order to have game taxes available when joker games are created
add_action( 'init', 'vrodos_create_joker_projects', 100, 2 );

// Remove Admin bar for non admins
// add_action('after_setup_theme', 'vrodos_remove_admin_bar');

include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-core-setget-functions.php' );

//Create Initial Asset Categories
include_once( plugin_dir_path( __FILE__ ) . 'includes/default_game_project_settings/vrodos-default-settings.php' );
// 22
add_action( 'init', 'vrodos_create_asset_categories');

include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-page-settings.php' );



if( is_admin() ){


    $vrodos_settings_page = new vrodos_settingsPage();

    //19
    add_action( 'init', array( $vrodos_settings_page, 'load_settings' ) );

    //29
    add_action( 'admin_init', array( $vrodos_settings_page, 'register_general_settings' ) );

    // 43
    //add_action( 'admin_menu', array( $vrodos_settings_page, 'render_setting') );
}



include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-page-templates.php' );

// 27
// Create class tha manipulates templates
add_action( 'plugins_loaded', array( 'vrodosTemplate', 'get_instance' ) );

// Order 1: Filters inside vrodos-page-templates
include_once( plugin_dir_path( __FILE__ ) . 'includes/templates/vrodos-asset-editor-saveData.php' );


// ---------  Create dedicated pages on plugin activation -------------------------
// 68

// 1. Project Manager
// 2. Assets List Page
// 3. 3D Editor
// 4. Asset Editor
register_activation_hook(__FILE__,'vrodos_create_pages');

// Add Project Manager and Assets List pages to menu automatically;
// Some messages also
//register_activation_hook( __FILE__, 'vrodos_fx_admin_notice_activation_hook' );

// -------------  Games versions table -------------------------------------
include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-db-table-creations.php' );

// 69
register_activation_hook( __FILE__, 'vrodos_db_create_games_versions_table' );

// ------------------- Add helper functions file ------------------------------------------
include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-core-helper.php' );

//------------------- For Compile ---------------------------------
include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-compile-aframe.php' );
include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-core-project-assemble-replace.php' );
include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-core-project-assemble-handler.php' );



// ---- Content interlinking ----------
//add_action( 'wp_ajax_vrodos_fetch_description_action', 'vrodos_fetch_description_action_callback' );

// Translate
//add_action( 'wp_ajax_vrodos_translate_action', 'vrodos_translate_action_callback' );


// ===================== Mime type to allow Upload ===================================
/**
 * Allow various file types to be uploaded.
 *
 * @param $mime_types
 *
 * @return mixed
 */
function vrodos_mime_types($mime_types){
    $mime_types['json'] = 'text/json';
    $mime_types['obj'] = 'text/plain';
    $mime_types['mp4'] = 'video/mp4';
    $mime_types['ogv'] = 'application/ogg';
    $mime_types['ogg'] = 'application/ogg';
    $mime_types['mtl'] = 'text/plain';
    $mime_types['mat'] = 'text/plain';
    $mime_types['pdb'] = 'text/plain';
    $mime_types['fbx'] = 'application/octet-stream';
    $mime_types['glb'] = 'application/octet-stream';
    return $mime_types;
}

// 70
add_filter('upload_mimes', 'vrodos_mime_types', 1, 1);



//---------- Admin site: Scripts about Upload button in Metaboxes ------
add_action('plugins_loaded', function() {
    if($GLOBALS['pagenow']=='post.php') {
        add_action('admin_print_scripts', 'my_admin_scripts');
        add_action('admin_print_styles',  'my_admin_styles');
    }
});

function my_admin_scripts() {
    wp_enqueue_script('jquery');
    wp_enqueue_script('media-upload');
    wp_enqueue_script('thickbox');
}

//wp_register_script('my-upload', WP_PLUGIN_URL.'/my-script.js', array('jquery','media-upload','thickbox'));
//  wp_enqueue_script('my-upload');
function my_admin_styles()  {
    wp_enqueue_style('thickbox');
}


// ---------- Shortcodes -------------

// shortcode to show content inside page with [visitor] Some content for the people just browsing your site. [/visitor]
add_shortcode( 'VRodos_3D_widget_shortcode', 'vrodos_3D_widget_shortcode' );

function vrodos_3D_widget_shortcode( $atts, $content = null ) {

    $a = shortcode_atts( array(
        'id' => '',
        'title' => 'NoGapsTitle',
        'titleshow' => 'false',
        'asset_id' => '',
        'camerapositionx' => 0,
        'camerapositiony' => 0,
        'camerapositionz' => -1,
        'canvaswidth' => '600px',
        'canvasheight' => '400px',
        'canvasbackgroundcolor' => 'transparent',
        'enablepan' => 'true',
        'enablezoom' => 'true',
        'canvasposition' => 'relative',
        'canvastop' => '',
        'canvasbottom' => '',
        'canvasleft' => '',
        'canvasright' => '',
        'customcss' => ''
    ), $atts );

    ob_start();
    the_widget('vrodos_3d_widget', $a, array(
        'widget_id'=>'arbitrary-instance-'.$a['id'],
        'before_widget' => '',
        'after_widget' => '',
        'before_title' => '',
        'after_title' => ''
    ));


    $output = ob_get_contents();
    ob_end_clean();
    return $output;
}




// shortcode to show content inside page with [visitor] Some content for the people just browsing your site. [/visitor]
add_shortcode( 'visitor', 'vrodos_visitor_check_shortcode' );

function vrodos_visitor_check_shortcode( $atts, $content = null ) {
    if ( ( !is_user_logged_in() && !is_null( $content ) ) || is_feed() )
        return $content;
    return '';
}



// ------- lost passwords redirect ---------
function vrodos_lost_password_redirect() {
    // Check if have submitted
    $confirm = ( isset($_GET['checkemail'] ) ? $_GET['checkemail'] : '' );

    if( $confirm ) {
        wp_redirect( get_site_url( ));
        exit;
    }
}
// 71
add_action('login_headerurl', 'vrodos_lost_password_redirect');


// Remove <p>  </p> from content to be used for saving json scenes in description
remove_filter ('the_content', 'wpautop');

// -------------------- Register new block type ----------------------------------
function vrodos_3d_register_block() {

    wp_register_script('vrodos-3d-block', plugin_dir_url( __FILE__ ).'build/index.js',
        array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-editor' )
    );

    wp_register_style('vrodos-blocks-style', plugins_url( 'css/vrodos_blocks.css', __FILE__ ),
        array( 'wp-edit-blocks' )
    );

    register_block_type( 'vrodos/vrodos-3d-block',
        array(
            'api_version' => 2,
            'editor_script' => 'vrodos-3d-block',
            'style' => 'vrodos-blocks-style',
            'editor_style' => 'vrodos-blocks-style',
        )
    );

}
add_action( 'init', 'vrodos_3d_register_block' );




//add_action('rest_api_init', function() {
//    register_rest_route('vrodosReactRest/v1', '/project/slug=(?P<slug>[a-zA-Z0-9-]+)',
//        [
//        'method' => 'GET',
//        'callback' => 'getAssetsRest',
//        'permission_callback' => '__return_true'
//    ]);
//});


//function getAssetsRest($data) {
//
//    $assets = get_assets($data['slug']);
//    $responseObject = [];
//
//    for ($i=0;$i<count($assets);$i++){
//        $responseObject[$assets[$i]['assetName']] = (Object) [$assets[$i]['assetid'], $assets[$i]['assettrs']];
//    }
//
//    $f = fopen("output_max.txt","a");
//    fwrite($f, print_r($responseObject,true));
//    fclose($f);
//
//
//    $response_json = json_encode($responseObject);
//
//    $f = fopen("output_max.txt","a");
//    fwrite($f, print_r($assets['assettrs'],true));
//    fclose($f);
//
//    return rest_ensure_response($response_json);
//}




//----------------------- WIDGETS ---------------------------------------------

require_once ( plugin_dir_path( __FILE__ ) . 'includes/vrodos-widgets.php');

// 47
// Register and load the widget
function vrodos_load_widget() {
    register_widget( 'vrodos_3d_widget' );
}
add_action( 'widgets_init', 'vrodos_load_widget');


//----------------------- WIDGET SCENE ---------------------------------------------

//require_once ( plugin_dir_path( __FILE__ ) . 'includes/vrodos-widget-scene.php');
//
//// 47
//add_action('wp_enqueue_scripts', 'vrodos_widget_scene_preamp_scripts'); // Front-end
//add_action('admin_enqueue_scripts', 'vrodos_widget_scene_preamp_scripts'); // Back-end
//
//// Register and load the widget
//function vrodos_load_widget_scene() {
//	register_widget( 'vrodos_3d_widget_scene' );
//}
//add_action( 'widgets_init', 'vrodos_load_widget_scene');



// 54
// For classification
//add_action('add_meta_boxes','vrodos_assets_create_right_metetaboxes');

// Add the fields to the taxonomy, using our callback function
// 59
//add_action( 'vrodos_asset3d_cat_edit_form_fields', 'vrodos_assets_category_yamlFields', 10, 2 );

// Save the changes made on the taxonomy, using our callback function
// 60
//add_action( 'edited_ vrodos_asset3d_cat', 'vrodos_assets_category_yamlFields_save', 10, 2 );

/* ------------------------------ API ---------------------------------------- */

//------------ 1. GraphQL
add_action( 'graphql_register_types', function() {
    register_graphql_field( 'vrodosAsset3d', 'glb', [
        'type' => 'String',
        'description' => __( 'The glb 3D file of the asset3d', 'wp-graphql' ),
        'resolve' => function( $post ) {
            $glb = get_post_meta( $post->ID, 'vrodos_asset3d_glb', true );
            return ! empty( $glb ) ? $glb : 'blue';
        }
    ] );
} );


//--------- 2. REST
///*
// * Get scene data by title
// */
//function prefix_get_endpoint_phrase($request) { //
//    // rest_ensure_response() wraps the data we want to return into a WP_REST_Response, and ensures it will be properly returned.
//
//    $title = (string) $request['title'];
//
//    $args = array (
//        'title'=>$title,
//        'post_status' => 'publish',
//        'post_type' => 'vrodos_scene'
//    );
//
//    $post = get_posts( $args );
//    $content = json_decode($post[0]->post_content, true);
//
//    return rest_ensure_response($content);
//}
//
///**
// * This function is where we register our routes for our example endpoint.
// */
//function prefix_register_example_routes() {
//
//    register_rest_route( 'vrodos/v1', '/scene/(?P<title>\S+)',
//		array(
//        'methods'  => WP_REST_Server::READABLE,   // By using this constant we ensure that when the WP_REST_Server changes our readable endpoints will work as intended.
//        'callback' => 'prefix_get_endpoint_phrase',  // Here we register our callback. The callback is fired when this endpoint is matched by the WP_REST_Server class.
//    ) );
//}
//
//add_action( 'rest_api_init', 'prefix_register_example_routes' );


//--------------------------------------------------------------------------

//// Back-end restrict by author filtering
//function vrodos_filter_by_the_author() {
//
//	$params = array(
//		'name' => 'author', // this is the "name" attribute for filter <select>
//		'show_option_all' => 'All authors' // label for all authors (display posts without filter)
//	);
//
//	if ( isset($_GET['user']) )
//		$params['selected'] = $_GET['user']; // choose selected user by $_GET variable
//
//	wp_dropdown_users( $params ); // print the ready author list
//}
//
//// 72
//add_action('restrict_manage_posts', 'vrodos_filter_by_the_author');

//---------------------- Content Interlinking ------------------------
//////SIDEBAR of Asset3D with fetch-segmentation etc...
////// Probably it should be merged with the above
//function vrodos_assets_scripts_and_styles() {
//
//    // load script from js_libs
//    wp_enqueue_script( 'vrodos_content_interlinking_request');
//
//    // load script from js_libs
//    wp_enqueue_script( 'vrodos_classification_request');
//
//    wp_enqueue_script('vrodos_segmentation_request');
//
//    // Some parameters to pass in the content_interlinking.js  ajax
//    wp_localize_script('vrodos_content_interlinking_request', 'phpvars',
//        array('lang' => 'en',
//            'externalSource' => 'Wikipedia',
//            'titles' => 'Scladina'  //'Albert%20Einstein'
//        )
//    );
//
//    // Some parameters to pass in the segmentation.js  ajax
//    //    if( isset($_GET['post']) ){
//    //        wp_localize_script('vrodos_segmentation_request', 'phpvars',
//    //            array('path' => get_post_meta($_GET['post'], 'vrodos_asset3d_pathData', true).'/',
//    //                'obj'  => get_post_meta($_GET['post'], 'vrodos_asset3d_obj', true)
//    //            )
//    //        );
//    //
//    //    }
//
//    // Some parameters to pass in the classification.js  ajax
//    //	wp_localize_script('vrodos_classification_request', 'phpvars',
//    //		array('path' => get_post_meta($_GET['post'], 'vrodos_asset3d_pathData', true).'/',
//    //		      'obj' => get_post_meta($_GET['post'], 'vrodos_asset3d_obj', true)
//    //		)
//    //	);
//}





//
//                AJAXes   registration
//

// AJAX Handler Class
require_once(plugin_dir_path(__FILE__) . 'includes/ajax/class-vrodos-ajax-handler.php');
new VRodos_AJAX_Handler();

// -------- Ajax for game projects ------
// Ajax for fetching game's assets within asset browser widget at vr_editor
add_action( 'wp_ajax_vrodos_fetch_game_assets_action', 'vrodos_fetch_game_assets_action_callback' );

// Callback for Ajax for delete game
add_action('wp_ajax_vrodos_delete_game_action','vrodos_delete_gameproject_frontend_callback');

// Callback for add collaborators
add_action('wp_ajax_vrodos_collaborate_project_action','vrodos_collaborate_project_frontend_callback');

// Callback for fetching collaborators from db
add_action('wp_ajax_vrodos_fetch_collaborators_action','vrodos_fetch_collaborators_frontend_callback');

add_action('wp_ajax_vrodos_create_project_action','vrodos_create_project_frontend_callback');

add_action('wp_ajax_vrodos_fetch_list_projects_action','vrodos_fetch_list_projects_callback');



// ------ Ajaxes for scenes -----------


// Ajax for deleting scene


//------ Ajaxes for Assets----
// AJAXES for content interlinking
//add_action( 'wp_ajax_vrodos_translate_action', 'vrodos_translate_action_callback' );


// Peer conferencing
//add_action( 'wp_ajax_nopriv_vrodos_notify_confpeers_action', 'vrodos_notify_confpeers_callback');
//add_action( 'wp_ajax_vrodos_notify_confpeers_action', 'vrodos_notify_confpeers_callback');
//add_action( 'wp_ajax_vrodos_update_expert_log_action', 'vrodos_update_expert_log_callback');


// AJAXES for semantics
//add_action( 'wp_ajax_vrodos_segment_obj_action', 'vrodos_segment_obj_action_callback' );
//add_action( 'wp_ajax_vrodos_monitor_segment_obj_action', 'vrodos_monitor_segment_obj_action_callback' );
//add_action( 'wp_ajax_vrodos_enlist_splitted_objs_action', 'vrodos_enlist_splitted_objs_action_callback' );
//add_action( 'wp_ajax_vrodos_classify_obj_action', 'vrodos_classify_obj_action_callback' );

// AJAX for delete asset

// AJAX for fetching assets


// Front-end GLB Logged in
add_action('wp_ajax_vrodos_fetch_glb_asset_action', 'vrodos_fetch_glb_asset3d_frontend_callback');

// Front-end GLB not Logged in
add_action('wp_ajax_nopriv_vrodos_fetch_glb_asset_action', 'vrodos_fetch_glb_asset3d_frontend_callback');


// Backend

// ------- Ajaxes for compiling ---------

// Assemble php from ajax call
//add_action( 'wp_ajax_vrodos_assemble_action', 'vrodos_assemble_action_callback' );
// Add the assepile php



//-------- Remove Gutenberg for Widgets ---------

// deactivate new block editor
function disable_widgets_block_editor() {
    remove_theme_support( 'widgets-block-editor' );
}
add_action( 'after_setup_theme', 'disable_widgets_block_editor' );


// Limit Scene revisions to N
function ns_limit_revisions($num, $post){

    $N = 50; // Keep only the latest N revisions
    $target_types = array('vrodos_scene');
    $is_target_type = in_array($post->post_type, $target_types);
    return $is_target_type ? $N : $num;
}
add_filter('wp_revisions_to_keep', 'ns_limit_revisions', 10, 2);


//-------- Uninstall -------------------
register_uninstall_hook(__FILE__, 'vrodos_remove_db_residues');


function vrodos_remove_db_residues(){

    global $wpdb;
    $del_prefix = $wpdb->prefix;

    // 1. Options
    delete_option('vrodos_scene_yaml_children');
    delete_option('vrodos_game_type_children');
    delete_option('widget_vrodos_3d_widget');
    delete_option('vrodos_db_version');

    // 2. Postmeta
    $wpdb->query("DELETE FROM ".$del_prefix."postmeta WHERE meta_value LIKE '%vrodos%'");

    // 2. Posts
    $wpdb->query("DELETE FROM ".$del_prefix."posts WHERE post_name LIKE '%vrodos%' OR post_name LIKE '%joker%'");

    // 3. Termmeta
    $wpdb->query("DELETE FROM ".$del_prefix."termmeta WHERE meta_key LIKE '%vrodos%'");

    // 4. Term
    $wpdb->query("DELETE FROM ".$del_prefix."terms WHERE slug LIKE '%-yaml%'");
    $wpdb->query("DELETE FROM ".$del_prefix."terms WHERE slug LIKE '%-joker%'");
    $wpdb->query("DELETE FROM ".$del_prefix."terms WHERE slug LIKE '%_games%'");
    $wpdb->query("DELETE FROM ".$del_prefix."terms WHERE slug LIKE '%pois_%'");
    $wpdb->query("DELETE FROM ".$del_prefix."terms WHERE slug LIKE '%decoration%'");
    $wpdb->query("DELETE FROM ".$del_prefix."terms WHERE slug LIKE '%door%'");
    $wpdb->query("DELETE FROM ".$del_prefix."terms WHERE slug LIKE '%video%'");
    $wpdb->query("DELETE FROM ".$del_prefix."terms WHERE slug LIKE '%chat%'");

    // 5. Term relationships
    // +++

    // 6. Term taxonomy
    $wpdb->query("DELETE FROM ".$del_prefix."term_taxonomy WHERE taxonomy LIKE '%vrodos%'");


    // 7. wp__games_versions table
    $wpdb->query("DROP TABLE ".$del_prefix."_games_versions");
}




// Main backend info page
function vrodos_plugin_main_page() {
    $allProjectsPage = vrodos_getEditpage('allgames');

    if ( is_admin() ) {
        if( ! function_exists( 'get_plugin_data' ) ) {
            require_once( ABSPATH . 'wp-admin/includes/plugin.php' );
        }
        $plugin_data = get_plugin_data( __FILE__ );
    }
    ?>

    <div id="wpbody" role="main">
        <div id="wpbody-content">
            <div class="wrap">
                <h1>VRodos Dashboard (<?php echo $plugin_data['Version'] ?>)</h1>
                <div id="welcome-panel" class="welcome-panel" style="background: #1b4d0d url(images/about-texture.png) center repeat ">
                    <div class="welcome-panel-content">
                        <div class="welcome-panel-header">
                            <img src="<?php echo plugin_dir_url( __FILE__ )?>images/VRodos_icon_512.png" alt="VRodos Icon" style="width:128px;height:128px;position: absolute;
right: 0;
margin-right: 20px;">
                            <h2>Welcome to VRodos!</h2>
                            <p>
                                <a href="https://vrodos.iti.gr">
                                    Learn more about VRodos </a>
                            </p>
                        </div>
                        <div class="welcome-panel-column-container">
                            <div class="welcome-panel-column">
                                <div class="welcome-panel-icon-pages"></div>
                                <div class="welcome-panel-column-content">
                                    <a href="<?php echo esc_url( get_permalink($allProjectsPage[0]->ID)); ?>" class="mdc-button mdc-button--raised">Access Project Manager</a>
                                </div>
                            </div>
                            <div class="welcome-panel-column">
                                <div class="welcome-panel-icon-layout"></div>
                                <div class="welcome-panel-column-content">
                                </div>
                            </div>
                            <div class="welcome-panel-column">
                                <div class="welcome-panel-icon-styles"></div>
                                <div class="welcome-panel-column-content">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="table_stuff">
                <table>
                    <caption>Overview</caption>
                    <thead>

                    <tr>
                        <th><!-- Intentionally Blank --></th>
                        <th>Total number</th>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Parent Project</th>
                    <tr>
                    </thead>
                    <tbody>
                    <tr>
                        <th>Projects</th>
                        <td><?php

                            $args = array(
                                'post_type' => 'vrodos_game',
                                'posts_per_page' => -1
                            );

                            $query = new WP_Query($args);

                            echo $query->found_posts;
                            ?></td>
                        <td><?php

                            $args = array(
                                'post_type' => 'vrodos_game',
                                'posts_per_page' => -1
                            );

                            $query = new WP_Query($args);

                            //echo $query->found_posts;

                            //echo "<br />";
                            if ($query->have_posts()) :

                                while ( $query->have_posts() ) : $query->the_post();
                                    echo get_the_ID() . " <br />";
                                endwhile;
                                wp_reset_postdata();
                            endif;
                            ?></td>
                        <td><?php

                            $args = array(
                                'post_type' => 'vrodos_game',
                                'posts_per_page' => -1
                            );

                            $query = new WP_Query($args);

                            //echo $query->found_posts;

                            //echo "<br />";
                            if ($query->have_posts() ) :

                                while ( $query->have_posts() ) : $query->the_post();
                                    echo  get_the_title() . " <br />";
                                endwhile;

                                wp_reset_postdata();
                            endif;

                            ?></td>
                        <td></td>
                    </tr>
                    <tr>
                        <th>Scenes</th>
                        <td> <?php

                            $args = array(
                                'post_type' => 'vrodos_scene',
                                'posts_per_page' => -1
                            );

                            $query = new WP_Query($args);

                            echo $query->found_posts . "</br>";

                            ?></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <th>Assets</th>
                        <td> <?php

                            $args = array(
                                'post_type' => 'vrodos_asset3d',
                                'posts_per_page' => -1
                            );

                            $query = new WP_Query($args);

                            echo $query->found_posts;
                            ?>
                        </td>
                        <td></td>
                        <td></td>
                        <td></td>

                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>


    <hr class="wp-block-separator"/>
    <?php
}
