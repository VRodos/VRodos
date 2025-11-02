<?php

/**
 * Plugin Name: VRodos
 * Plugin URI: https://vrodos.iti.gr
 * Description: Make your wordpress website a VR site
 * Author: Anastasios Papazoglou Chalikias, Elias Kouslis, Dimitrios Ververidis
 * Author URI: https://vrodos.iti.gr
 * Version: 2.2
 */

if ( ! defined( 'VRODOS_PLUGIN_FILE' ) ) {
    define( 'VRODOS_PLUGIN_FILE', __FILE__ );
}

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

// Install Manager Class
require_once(plugin_dir_path(__FILE__) . 'includes/class-vrodos-install-manager.php');
new VRodos_Install_Manager();

// Pages Manager Class
require_once(plugin_dir_path(__FILE__) . 'includes/class-vrodos-pages-manager.php');
new VRodos_Pages_Manager();

// Core Manager Class
require_once(plugin_dir_path(__FILE__) . 'includes/class-vrodos-core-manager.php');
new VRodos_Core_Manager();

// Default Scene Manager Class
require_once(plugin_dir_path(__FILE__) . 'includes/class-vrodos-default-scene-manager.php');


// Upload Manager Class
require_once(plugin_dir_path(__FILE__) . 'includes/class-vrodos-upload-manager.php');
VRodos_Upload_Manager::register_hooks();

// Default Data Manager Class
require_once(plugin_dir_path(__FILE__) . 'includes/class-vrodos-default-data-manager.php');
new VRodos_Default_Data_Manager();

// Settings Manager Class
require_once(plugin_dir_path(__FILE__) . 'includes/class-vrodos-settings-manager.php');
new VRodos_Settings_Manager();


// Order 1: Filters inside vrodos-page-templates
include_once( plugin_dir_path( __FILE__ ) . 'includes/templates/vrodos-asset-editor-saveData.php' );


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


// Widget Manager Class
require_once(plugin_dir_path(__FILE__) . 'includes/class-vrodos-widget-manager.php');
new VRodos_Widget_Manager();


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

// AJAX Handler Class
require_once(plugin_dir_path(__FILE__) . 'includes/ajax/class-vrodos-ajax-handler.php');
new VRodos_AJAX_Handler();


// Front-end GLB Logged in
add_action('wp_ajax_vrodos_fetch_glb_asset_action', 'vrodos_fetch_glb_asset3d_frontend_callback');

// Front-end GLB not Logged in
add_action('wp_ajax_nopriv_vrodos_fetch_glb_asset_action', 'vrodos_fetch_glb_asset3d_frontend_callback');


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


// Main backend info page
function vrodos_plugin_main_page() {
    $allProjectsPage = VRodos_Core_Manager::vrodos_getEditpage('allgames');

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
