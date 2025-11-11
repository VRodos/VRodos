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

// Shortcode Manager Class
require_once(plugin_dir_path(__FILE__) . 'includes/class-vrodos-shortcode-manager.php');
new VRodos_Shortcode_Manager();

// Block Manager Class
require_once(plugin_dir_path(__FILE__) . 'includes/class-vrodos-block-manager.php');
new VRodos_Block_Manager();

// Widget Manager Class
require_once(plugin_dir_path(__FILE__) . 'includes/class-vrodos-widget-manager.php');
new VRodos_Widget_Manager();



// AJAX Handler Class
require_once(plugin_dir_path(__FILE__) . 'includes/ajax/class-vrodos-ajax-handler.php');
new VRodos_AJAX_Handler();


