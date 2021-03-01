<?php
/**
 * Plugin Name: VRodos
 * Plugin URI: https://vrodos.mklab.iti.gr
 * Description: Make your wordpress website a VR site
 * Author: Dimitrios Ververidis, ververid@iti.gr
 * Author URI: https://vrodos.mklab.iti.gr
 * Version: 0.5
 */



//-- ToDo for Scene Editor --
//Feature: Add Rendering on Demand
//Bug: Scene editor does not import GLB and PDB files
//Bug:
//Feature: Add progress bar for each item independently
//Feature: Add VR modality
//---------------------------
//
//-- ToDo for Asset Editor --
//Bug : CSS2D for the labels of atoms does not resize correctly
//---------------------------
//
//-- ToDo Asset List viewer --
//Feature: Add render class per item
//----------------------------
//
//Fixed: Major issue : When installing Joker Games do not get their category (Archaeology_game)


//$ff = fopen("output_order_log.txt","w");
//fwrite($ff,'----- This file displays the order of function execution ---'.chr(13));
//fclose($ff);

/*
 * Change root .htaccess for uploading big data files
 *
 *
php_value upload_max_filesize 256M
php_value post_max_size 512M
php_value max_input_time 2400

// in php you can check their values with

echo ini_get('post_max_size').chr(10);
echo ini_get('max_input_time').chr(10);
--
 */
// Only these variables can change with php
// @ini_set( 'memory_limit', '512M');
@ini_set( 'max_execution_time', '2400' );

// Set scope based on project:
// DigiArt - Virtual Tour: 0
// Envisage - Virtual Lab: 1
// Default - Game Project: any other number
$project_scope = 0;


//function vrodos_plugin_activate() {
//
//	add_option( 'Activated_Plugin', 'WordpressUnity3DEditor' );
//
//	/* activation code here */
//	// Display the alert box
//
//	//echo '<script>alert("Welcome")</script>';
//
//}
//register_activation_hook( __FILE__, 'vrodos_plugin_activate' );
//
//
//
//
//function vrodos_load_plugin() {
//	if(is_admin()&&get_option('Activated_Plugin')=='WordpressUnity3DEditor') {
//		delete_option('Activated_Plugin');
//		/* do some stuff once right after activation */
//
//
//		//echo '<script>alert("Welcome to VRodos")</script>';
//	}
//}
//add_action('admin_init','vrodos_load_plugin');


//===================================== Styles & Scripts ====================================
function vrodos_load_jquery_scripts() {

//	global $wp_scripts;
//	if(is_admin()) return;
//	$wp_scripts->registered['jquery-core']->src = 'https://code.jquery.com/jquery-3.5.1.min.js';
//	$wp_scripts->registered['jquery']->deps = ['jquery-core'];

	wp_enqueue_script('jquery');
	wp_enqueue_script('jquery-ui-core');
	
	wp_enqueue_script('jquery-ui-slider');
	wp_enqueue_script('jquery-ui-draggable');
	wp_enqueue_script('jquery-effects-core');
	wp_enqueue_style( 'jquery-ui-css' , plugin_dir_url( __FILE__ ) . 'css/jquery-ui.min.css' );
	wp_enqueue_style( 'jquery-ui-theme-css' , plugin_dir_url( __FILE__ ) . 'css/jquery-ui.theme.min.css' );
}
// 44
add_action('wp_enqueue_scripts', 'vrodos_load_jquery_scripts' );



function vrodos_register_scripts() {
 
	$pluginDirJS = plugin_dir_url( __FILE__ ).'js_libs/';
	
	$scriptsA = array(
		array('vrodos_asset_editor_scripts', $pluginDirJS.'vrodos_asset_editor_scripts.js'),
		array('vrodos_scripts', $pluginDirJS.'vrodos_scripts.js'),
		array('vrodos_lightslider', $pluginDirJS.'standalone_js_libraries/lightslider.min.js'),
		array('vrodos_jscolorpick', $pluginDirJS.'standalone_js_libraries/jscolor.js'),
		array('vrodos_jsfontselect', $pluginDirJS.'standalone_js_libraries/jquery.fontselect.js'),
		array('vrodos_html2canvas', $pluginDirJS.'standalone_js_libraries/html2canvas.min.js'),
		array('vrodos_assepile_request', $pluginDirJS.'assemble_compile_commands/request_game_assepile.js'),
		array('vrodos_savescene_request', $pluginDirJS.'save_scene_ajax/vrodos_save_scene_ajax.js'),
		array('vrodos_content_interlinking_request', $pluginDirJS.'content_interlinking_commands/content_interlinking.js'),
		array('vrodos_segmentation_request', $pluginDirJS.'semantics_commands/segmentation.js'),
		
		array('vrodos_classification_request', $pluginDirJS.'semantics_commands/classification.js'),
		array('vrodos_fetch_asset_scenes_request', $pluginDirJS.'assetBrowserToolbar.js'),
		array('vrodos_qrcode_generator', $pluginDirJS.'standalone_js_libraries/qrcode.js'),
		array('vrodos_inflate', $pluginDirJS.'standalone_js_libraries/inflate.min.js'),
		array('vrodos_materialize_jslib', $pluginDirJS.'standalone_js_libraries/materialize.js'),
		array('Asset_viewer_3d_kernel', $pluginDirJS.'Asset_viewer_3d_kernel.js'),
		array('vrodos_vr_editor_buttons', $pluginDirJS.'vr_editor_buttons.js'),
		array('vrodos_vr_editor_analytics', $pluginDirJS.'vr_editor_analytics.js'),
	);
	
	for ( $i = 0 ; $i < count($scriptsA); $i ++){
		wp_register_script($scriptsA[$i][0] , $scriptsA[$i][1], null, null, false );
	}

	//=========================== THREE js 87 scripts ============================================
	
	$scriptsB = array(
			array( 'wpunity_load87_threejs', $pluginDirJS.'threejs87/three.js'),
			array( 'wpunity_load87_OBJloader', $pluginDirJS.'threejs87/OBJLoader.js'),
			array( 'wpunity_load87_OBJloader2', $pluginDirJS.'threejs87/OBJLoader2.js'),
			array( 'wpunity_load87_WWOBJloader2', $pluginDirJS. 'threejs87/WWOBJLoader2.js'),
			array( 'wpunity_load87_MTLloader', $pluginDirJS.'threejs87/MTLLoader.js'),
			array( 'wpunity_load87_FBXloader', $pluginDirJS.'threejs87/FBXLoader.js'),
			array( 'wpunity_load87_OrbitControls', $pluginDirJS.'threejs87/OrbitControls.js'),
            array( 'wpunity_load87_TransformControls', $pluginDirJS.'threejs87/TransformControls.js'),
			array( 'wpunity_load87_PointerLockControls', $pluginDirJS.'threejs87/PointerLockControls.js'),
			array( 'wpunity_load87_datgui', $pluginDirJS.'threejs87/dat.gui.js'),
			
			array( 'wpunity_load87_CopyShader', $pluginDirJS.'threejs87/CopyShader.js'),
			array( 'wpunity_load87_FXAAShader', $pluginDirJS.'threejs87/FXAAShader.js'),
			array( 'wpunity_load87_EffectComposer', $pluginDirJS.'threejs87/EffectComposer.js'),
			array( 'wpunity_load87_RenderPass', $pluginDirJS.'threejs87/RenderPass.js'),
			array( 'wpunity_load87_OutlinePass', $pluginDirJS.'threejs87/OutlinePass.js'),
			array( 'wpunity_load87_ShaderPass', $pluginDirJS.'threejs87/ShaderPass.js'),
			array( 'wpunity_load87_PDBloader', $pluginDirJS.'threejs87/PDBLoader.js'),
			array( 'wpunity_load87_CSS2DRenderer', $pluginDirJS.'threejs87/CSS2DRenderer.js'),
			array( 'wpunity_load87_sceneexporterutils', $pluginDirJS.'threejs87/SceneExporterUtils.js'),
			array( 'wpunity_load87_scene_importer_utils', $pluginDirJS.'threejs87/SceneImporter.js'),
			array( 'wpunity_load87_sceneexporter', $pluginDirJS.'threejs87/SceneExporter.js'),
		);
	
	for ( $i = 0 ; $i < count($scriptsB); $i ++){
		wp_register_script($scriptsB[$i][0] , $scriptsB[$i][1], null, null, false );
	}
	
	//=========================== THREE js 119 scripts ============================================
	
	$scriptsC = array(
		array( 'wpunity_load119_threejs', $pluginDirJS.'threejs119/three.js'),
		array( 'wpunity_load124_threejs', $pluginDirJS.'threejs124/three.js'),
		array( 'wpunity_load125_threejs', $pluginDirJS.'threejs125/three.js'),
		array( 'wpunity_load124_statjs', $pluginDirJS.'threejs124/stats.js'),
		
		array( 'wpunity_load119_FBXloader', $pluginDirJS.'threejs119/FBXLoader.js'),
//		array( 'wpunity_load119_pdbloader', $pluginDirJS.'threejs119/PDBLoader.js'),
		array( 'wpunity_load119_GLTFLoader', $pluginDirJS.'threejs119/GLTFLoader.js'),
		array( 'wpunity_load119_DRACOLoader', $pluginDirJS.'threejs119/DRACOLoader.js'),
		array( 'wpunity_load119_DDSLoader', $pluginDirJS.'threejs119/DDSLoader.js'),
		array( 'wpunity_load119_KTXLoader', $pluginDirJS.'threejs119/KTXLoader.js'),
		
		array( 'wpunity_load119_OrbitControls', $pluginDirJS.'threejs119/OrbitControls.js'),
		array( 'wpunity_load125_OrbitControls', $pluginDirJS.'threejs125/OrbitControls.js'),
		array( 'wpunity_load119_TransformControls', $pluginDirJS.'threejs119/TransformControls.js'),
		array( 'wpunity_load124_TrackballControls', $pluginDirJS.'threejs124/TrackballControls.js'),
		array( 'wpunity_load119_PointerLockControls', $pluginDirJS.'threejs119/PointerLockControls.js'),
		
		array( 'wpunity_load125_TrackballControls', $pluginDirJS.'threejs125/TrackballControls.js'),
		array( 'wpunity_load125_CSS2DRenderer', $pluginDirJS.'threejs125/CSS2DRenderer.js'),

//		array( 'wpunity_load_sceneexporterutils', $pluginDirJS.'threejs87/SceneExporterUtils.js'),
//		array( 'wpunity_load_scene_importer_utils', $pluginDirJS.'threejs87/SceneImporter.js'),
//		array( 'wpunity_load_sceneexporter', $pluginDirJS.'threejs87/SceneExporter.js'),
		
		
		array( 'wpunity_load119_CSS2DRenderer', $pluginDirJS.'threejs119/CSS2DRenderer.js'),
		
		array( 'wpunity_load119_CopyShader', $pluginDirJS.'threejs119/CopyShader.js'),
		array( 'wpunity_load119_FXAAShader', $pluginDirJS.'threejs119/FXAAShader.js'),
		array( 'wpunity_load119_EffectComposer', $pluginDirJS.'threejs119/EffectComposer.js'),
		array( 'wpunity_load119_RenderPass', $pluginDirJS.'threejs119/RenderPass.js'),
		array( 'wpunity_load119_OutlinePass', $pluginDirJS.'threejs119/OutlinePass.js'),
		array( 'wpunity_load119_ShaderPass', $pluginDirJS.'threejs119/ShaderPass.js'),
	);
	
	for ( $i = 0 ; $i < count($scriptsC); $i ++){
		wp_register_script($scriptsC[$i][0] , $scriptsC[$i][1], null, null, false );
	}
	
	
	//------------------------------------------------------------------
	
	$scriptsD = array(
			array( 'wpunity_vr_editor_environmentals', $pluginDirJS.'vr_editor_environmentals.js'),
			array( 'wpunity_keyButtons', $pluginDirJS.'standalone_js_libraries/keyButtons.js'),
			array( 'wpunity_rayCasters', $pluginDirJS.'rayCasters.js'),
			array( 'wpunity_auxControlers', $pluginDirJS.'auxControlers.js'),
			array( 'wpunity_LoaderMulti', $pluginDirJS.'LoaderMulti.js'),
			array( 'wpunity_movePointerLocker', $pluginDirJS.'movePointerLocker.js'),
			array( 'wpunity_addRemoveOne', $pluginDirJS.'addRemoveOne.js'),
		);
	
	for ( $i = 0 ; $i < count($scriptsD); $i ++){
		wp_register_script($scriptsD[$i][0] , $scriptsD[$i][1], null, null, false );
	}
}
// 45
add_action('wp_enqueue_scripts', 'vrodos_register_scripts' );



function vrodos_register_styles() {
	wp_register_style( 'wpunity_backend', plugin_dir_url( __FILE__ ) . 'css/wpunity_backend.css' );
	wp_register_style( 'wpunity_vr_editor', plugin_dir_url( __FILE__ ) . 'css/vr_editor_style.css' );
	wp_register_style( 'wpunity_datgui', plugin_dir_url( __FILE__ ) . 'css/dat-gui.css' );

	
	wp_register_style( 'wpunity_vr_editor_filebrowser', plugin_dir_url( __FILE__ ).'css/vr_editor_fileBrowserStyle.css' );
	wp_register_style( 'wpunity_material_stylesheet',  plugin_dir_url( __FILE__ ).'node_modules/material-components-web/dist/material-components-web.css' );
	wp_register_script( 'wpunity_material_scripts', plugin_dir_url( __FILE__ ).'node_modules/material-components-web/dist/material-components-web.js');
	
	wp_register_style( 'wpunity_frontend_stylesheet',  plugin_dir_url( __FILE__ ) . 'css/wpunity_frontend.css' );
	
	
	wp_register_style( 'vrodos_lightslider_stylesheet',  plugin_dir_url( __FILE__ ) . 'css/lightslider.min.css' );
    
    wp_register_style( 'wpunity_materialize_stylesheet',  plugin_dir_url( __FILE__ ) . 'css/materialize.css' );
	
	wp_register_style( 'wpunity_asseteditor_stylesheet',  plugin_dir_url( __FILE__ ) . 'css/wpunity_asseteditor.css' );
	
	wp_register_style( 'wpunity_widgets_stylesheet',  plugin_dir_url( __FILE__ ) . 'css/wpunity_widgets.css' );
 
	
	// TODO: When ready for production, ignore  node_modules folder and move the 2 material css & js files to another folder.
	// Material & Frontend CSS & Scripts
	wp_enqueue_style('wpunity_material_stylesheet');
	wp_enqueue_script('wpunity_material_scripts');
	wp_enqueue_style( 'wpunity_material_icons', plugin_dir_url( __FILE__ ) . 'css/material-icons/material-icons.css' );
//    wp_enqueue_style( 'wpunity_glyphter_icons', plugin_dir_url( __FILE__ ) . 'css/glyphter-font/Glyphter.css' );
	wp_enqueue_style('wpunity_frontend_stylesheet');
	
	wp_enqueue_style( 'vrodos_lightslider_stylesheet');
	
	wp_enqueue_style('wpunity_backend');
}
// 46
add_action('wp_enqueue_scripts', 'vrodos_register_styles' );


//----------------------- WIDGETS ---------------------------------------------

require_once ( plugin_dir_path( __FILE__ ) . 'includes/wpunity-widgets.php');

// 47
add_action('wp_enqueue_scripts', 'wpunity_widget_functions' );

// 49
add_action( 'widgets_init', 'wpunity_load_widget' );

//----------------------- USER ROLES -------------------------------------------

require_once ( plugin_dir_path( __FILE__ ) . 'includes/wpunity-users-roles.php');

// Order : 4
add_action( 'init', 'wpunity_add_customroles');

// Order: 6
add_action( 'init', 'wpunity_add_capabilities_to_admin');

//---------------------- Game Projects -------------------------------------------------
require_once ( plugin_dir_path( __FILE__ ) . 'includes/wpunity-types-games.php');


// Order: 7
add_action('init', 'wpunity_project_cpt_construct', 1); //wpunity_game 'GAMES'

// Order: 9
add_action('init', 'wpunity_project_taxtype_create', 2); //wpunity_game_type 'GAME TYPES'

// Order : 2
add_action( 'init', 'wpunity_projects_taxtypes_define', 3 );



// 28
add_action('transition_post_status','wpunity_create_folder_game', 9 , 3);


// 50
add_filter( 'manage_wpunity_game_posts_columns', 'wpunity_set_custom_wpunity_game_columns' );

//Create Game Category Box @ Game's backend
// 51
add_action('add_meta_boxes','wpunity_games_taxcategory_box');


/* Do something with the data entered */
// 31
add_action( 'save_post', 'wpunity_games_taxtype_box_content_save' );

// Add the data to the custom columns for the game post type:
// 55
add_action( 'manage_wpunity_game_posts_custom_column' , 'wpunity_set_custom_wpunity_game_columns_fill', 10, 2 );

// 40
add_action('admin_menu', 'wpunity_games_databox_add');

// 32
add_action('save_post', 'wpunity_games_databox_save');

//---------------------- Scenes ----------------------------------------------------

include_once( plugin_dir_path( __FILE__ ) . 'includes/wpunity-types-scenes.php');

// Order : 11
add_action('init', 'wpunity_scenes_construct'); //wpunity_scene 'SCENES'

// Order: 12
add_action('init', 'wpunity_scenes_parent_project_tax_define'); //wpunity_scene_pgame  'SCENE GAMES'

// Order: 13
add_action('init', 'wpunity_scenes_taxyaml'); //wpunity_scene_yaml 'SCENE TYPES'

// Create Scene's Game Box @ scene's backend
// 52
add_action('add_meta_boxes','wpunity_scenes_taxgame_box');

//When the post is saved, also saves wpunity_game_cat
//33
add_action( 'save_post', 'wpunity_scenes_taxgame_box_content_save' );

//34
add_action( 'save_post', 'wpunity_scenes_taxyaml_box_content_save' );

// 56
add_filter( 'manage_wpunity_scene_posts_columns', 'wpunity_set_custom_wpunity_scene_columns' );

// Add the data to the custom columns for the scene post type
// 57
add_action( 'manage_wpunity_scene_posts_custom_column' , 'wpunity_set_custom_wpunity_scene_columns_fill', 10, 2 );

// 41
add_action('admin_menu', 'wpunity_scenes_meta_definitions_add');

// Save metas
add_action('save_post', 'wpunity_scenes_metas_save');

//===================================== Assets ============================================

include_once( plugin_dir_path( __FILE__ ) . 'includes/wpunity-types-assets.php' );

// 14
add_action('init', 'wpunity_assets_construct'); //wpunity_asset3d 'ASSETS 3D'

// 15
add_action('init', 'wpunity_assets_taxcategory'); //wpunity_asset3d_cat 'ASSET TYPES'

// 16
add_action('init', 'wpunity_assets_taxpgame'); //wpunity_asset3d_pgame 'ASSET GAMES'

// 17
add_action('init', 'wpunity_assets_taxcategory_ipr'); //wpunity_asset3d_ipr_cat 'ASSET IPR CATEG'

// 35
add_action('save_post','wpunity_create_pathdata_asset',10,3);

// 18
add_action('init','wpunity_allowAuthorEditing');

// 58
add_filter( 'wp_dropdown_users_args', 'change_user_dropdown', 10, 2 );


// 36
add_action( 'save_post', 'wpunity_asset_tax_category_box_content_save');

// 37
add_action( 'save_post', 'wpunity_assets_taxcategory_ipr_box_content_save' );

// 38
add_action( 'save_post', 'wpunity_asset_project_box_content_save');


// Create Asset Taxonomy Boxes (Category & Scene) @ asset's backend
// 53
add_action('add_meta_boxes','wpunity_assets_taxcategory_box');

include_once( plugin_dir_path( __FILE__ ) . 'includes/wpunity-types-assets-data.php' );

// Save data from infobox
// 39
add_action('save_post', 'wpunity_assets_databox_save');

// 42
add_action('admin_menu', 'wpunity_assets_databox_add');

// 48
add_action('wp_enqueue_scripts', 'wpunity_assets_scripts_and_styles' );

// 54
add_action('add_meta_boxes','wpunity_assets_create_right_metaboxes');

// Add the fields to the taxonomy, using our callback function
// 59
//add_action( 'wpunity_asset3d_cat_edit_form_fields', 'wpunity_assets_category_yamlFields', 10, 2 );

// Save the changes made on the taxonomy, using our callback function
// 60
//add_action( 'edited_wpunity_asset3d_cat', 'wpunity_assets_category_yamlFields_save', 10, 2 );

// 61
add_filter( 'manage_wpunity_asset3d_posts_columns', 'wpunity_set_custom_wpunity_asset3d_columns' );

// Add the data to the custom columns for the book post type:
// 62
add_action( 'manage_wpunity_asset3d_posts_custom_column' , 'wpunity_set_custom_wpunity_asset3d_columns_fill', 10, 2 );


//===================================== Other ============================================

include_once( plugin_dir_path( __FILE__ ) . 'includes/wpunity-core-upload-functions.php' );

// 63
add_filter( 'upload_dir', 'wpunity_upload_dir_forScenesOrAssets' );

// 64
add_filter( 'intermediate_image_sizes', 'wpunity_disable_imgthumbs_assets', 999 );

// 65
add_filter( 'sanitize_file_name', 'wpunity_overwrite_uploads', 10, 1 );

include_once( plugin_dir_path( __FILE__ ) . 'includes/wpunity-core-functions.php' );

// Set to the lowest priority in order to have game taxes available when joker games are created
// 26
add_action( 'init', 'wpunity_createJoker_activation', 100, 2 );
//add_action( 'activated_plugin', 'wpunity_createJoker_activation', 10, 2 );
//register_activation_hook( __FILE__ , 'wpunity_createJoker_activation' );


// 66
add_filter( 'wp_nav_menu_items','wpunity_loginout_menu_link', 5, 2 );

// Remove Admin bar for non admins
// 67
add_action('after_setup_theme', 'wpunity_remove_admin_bar');


include_once( plugin_dir_path( __FILE__ ) . 'includes/wpunity-core-setget-functions.php' );

//Create Initial Asset Categories

include_once( plugin_dir_path( __FILE__ ) . 'includes/wpunity-page-settings.php' );



if( is_admin() ){
	$my_settings_page = new Wpunity_settingsPage();
	//19
	add_action( 'init', array( $my_settings_page, 'load_settings' ) );
	
	//29
	add_action( 'admin_init', array( $my_settings_page, 'register_general_settings' ) );
	
	// 43
	add_action( 'admin_menu', array( $my_settings_page, 'render_setting') );
}



include_once( plugin_dir_path( __FILE__ ) . 'includes/wpunity-page-templates.php' );

// 27
add_action( 'plugins_loaded', array( 'wpUnityTemplate', 'get_instance' ) );

// Order 1: Filters inside wpunity-page-templates

include_once( plugin_dir_path( __FILE__ ) . 'includes/templates/edit-wpunity_asset3D-saveData.php' );


// ---------  Create dedicated pages on plugin activation -------------------------
// 68
register_activation_hook(__FILE__,'wpunity_create_openGamePage');
register_activation_hook(__FILE__,'wpunity_create_editGamePage');
register_activation_hook(__FILE__,'wpunity_create_editScenePage');
register_activation_hook(__FILE__,'wpunity_create_editScene2DPage');
register_activation_hook(__FILE__,'wpunity_create_editSceneExamPage');
register_activation_hook(__FILE__,'wpunity_create_editAsset3D');



// -------------  Games versions table -------------------------------------
include_once( plugin_dir_path( __FILE__ ) . 'includes/wpunity-db-table-creations.php' );

// 69
register_activation_hook( __FILE__, 'wpunity_db_create_games_versions_table' );

// ------------------- Add helper functions file ------------------------------------------
include_once( plugin_dir_path( __FILE__ ) . 'includes/wpunity-core-helper.php' );

//------------------- For Compile ---------------------------------
include_once( plugin_dir_path( __FILE__ ) . 'includes/wpunity-core-project-assemble.php' );
include_once( plugin_dir_path( __FILE__ ) . 'includes/wpunity-core-project-assemble-replace.php' );
include_once( plugin_dir_path( __FILE__ ) . 'includes/wpunity-core-project-assemble-handler.php' );

//-------------------- Energy related ----------------------------
include_once( plugin_dir_path( __FILE__ ) . 'includes/default_game_project_settings/wpunity-default-energy-settings.php' );



// 20
add_action( 'init', 'wpunity_assets_taxcategory_energy_fill' );

// 21
add_action( 'init', 'wpunity_scenes_types_energy_standard_cre' );



include_once( plugin_dir_path( __FILE__ ) . 'includes/default_game_project_settings/wpunity-default-energy-yamls.php' );


include_once( plugin_dir_path( __FILE__ ) . 'includes/default_game_project_settings/wpunity-default-energy-compile.php' );



//------------------- Archaeology related -----------------------
include_once( plugin_dir_path( __FILE__ ) . 'includes/default_game_project_settings/wpunity-default-archaeology-yamls.php' );
include_once( plugin_dir_path( __FILE__ ) . 'includes/default_game_project_settings/wpunity-default-archaeology-settings.php' );

// 22
add_action( 'init', 'wpunity_assets_taxcategory_archaeology_fill' );

// 23
add_action( 'init', 'wpunity_scenes_types_archaeology_standard_cre' );

include_once( plugin_dir_path( __FILE__ ) . 'includes/default_game_project_settings/wpunity-default-archaeology-compile.php' );

//-------------------- Chemistry related ------------------------
include_once( plugin_dir_path( __FILE__ ) . 'includes/default_game_project_settings/wpunity-default-chemistry-settings.php' );

// 24
add_action( 'init', 'wpunity_assets_taxcategory_chemistry_fill' );

// 25
add_action( 'init', 'wpunity_scenes_types_chemistry_standard_cre' );


//include_once( plugin_dir_path( __FILE__ ) . 'includes/default_game_project_settings/wpunity-default-chemistry-yamls.php' );
include_once( plugin_dir_path( __FILE__ ) . 'includes/default_game_project_settings/wpunity-default-chemistry-compile.php' );

include_once( plugin_dir_path( __FILE__ ) . 'includes/PDBLoader.php' );



// For Envisage only
if ($project_scope === 1) {
	// Add a new form element...
	add_action('register_form', 'wpunity_extrapass_register_form');
	// Finally, save our extra registration user meta.
	add_action('user_register', 'wpunity_extrapass_user_register', 10, 1);
	
	add_action('show_user_profile', 'wpunity_extrapass_profile_fields');
	add_action('edit_user_profile', 'wpunity_extrapass_profile_fields');
	
	add_action( 'user_register', 'wpunity_registrationUser_save', 10, 2 );
}


// ---- Content interlinking ----------

add_action( 'wp_ajax_wpunity_fetch_description_action', 'wpunity_fetch_description_action_callback' );

// Translate
//add_action( 'wp_ajax_wpunity_translate_action', 'wpunity_translate_action_callback' );


// ===================== Mime type to allow Upload ===================================
/**
 * Allow various file types to be uploaded.
 *
 * @param $mime_types
 *
 * @return mixed
 */
function wpunity_mime_types($mime_types){
	$mime_types['json'] = 'text/json';
	$mime_types['obj'] = 'text/plain';
	$mime_types['mp4'] = 'video/mp4';
    $mime_types['ogv'] = 'application/ogg';
    $mime_types['ogg'] = 'application/ogg';
	$mime_types['mtl'] = 'text/plain';
	$mime_types['mat'] = 'text/plain';
	$mime_types['pdb'] = 'text/plain';
//	$mime_types['fbx'] = 'text/plain';
	$mime_types['fbx'] = 'application/octet-stream';
	$mime_types['glb'] = 'application/octet-stream';
	return $mime_types;
}

// 70
add_filter('upload_mimes', 'wpunity_mime_types', 1, 1);



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
/**
 *   shortcode to show content inside page with [visitor] Some content for the people just browsing your site. [/visitor]
 */
add_shortcode( 'visitor', 'visitor_check_shortcode' );

function visitor_check_shortcode( $atts, $content = null ) {
    if ( ( !is_user_logged_in() && !is_null( $content ) ) || is_feed() )
        return $content;
    return '';
}

// ------- lost passwords redirect ---------
function wpunity_lost_password_redirect() {
    // Check if have submitted
    $confirm = ( isset($_GET['checkemail'] ) ? $_GET['checkemail'] : '' );

    if( $confirm ) {
        wp_redirect( get_site_url( ).'/wpunity-main/' );
        exit;
    }
}
// 71
add_action('login_headerurl', 'wpunity_lost_password_redirect');



//$fo = fopen("output_activation.txt","w");
//fwrite($fo, dirname( __FILE__ ) . '/includes/wpunity-core-functions.php');
//fclose($fo);

//include_once dirname( __FILE__ ) . '/includes/wpunity-core-functions.php';

//include_once( plugin_dir_path( __FILE__ ) . 'includes/wpunity-core-functions.php' );




//add_filter('rest_authentication_errors', 'disable_wp_rest_api');
//
//function disable_wp_rest_api($access) {
//
//    //if (!is_user_logged_in()) {
//
//    //    $message = apply_filters('disable_wp_rest_api_error', __('REST API restricted to authenticated users.', 'disable-wp-rest-api'));
//
//    //    return new WP_Error('rest_login_required', $message, array('status' => rest_authorization_required_code()));
//
//  //  }
//
//    return $access;
//}


// Remove <p>  </p> from content to be used for saving json scenes in description
remove_filter ('the_content', 'wpautop');



/* ------------------------------ API ---------------------------------------- */
/*
 * Get scene data by title
 */
function prefix_get_endpoint_phrase($request) { //
    // rest_ensure_response() wraps the data we want to return into a WP_REST_Response, and ensures it will be properly returned.
    
    $title = (string) $request['title'];
    
    $args = array (
        'title'=>$title,
        'post_status' => 'publish',
        'post_type' => 'wpunity_scene'
    );
    
    $post = get_posts( $args );
    $content = json_decode($post[0]->post_content, true);
    
    return rest_ensure_response($content);
}

/**
 * This function is where we register our routes for our example endpoint.
 */
function prefix_register_example_routes() {
    // register_rest_route() handles more arguments but we are going to stick to the basics for now.
    register_rest_route( 'wpunity/v1', '/scene/(?P<title>\S+)', array(
        // By using this constant we ensure that when the WP_REST_Server changes our readable endpoints will work as intended.
        'methods'  => WP_REST_Server::READABLE,
        // Here we register our callback. The callback is fired when this endpoint is matched by the WP_REST_Server class.
        'callback' => 'prefix_get_endpoint_phrase',
    ) );
}

add_action( 'rest_api_init', 'prefix_register_example_routes' );


// Back-end restrict by author filtering
function wpunity_filter_by_the_author() {
	$params = array(
		'name' => 'author', // this is the "name" attribute for filter <select>
		'show_option_all' => 'All authors' // label for all authors (display posts without filter)
	);
	
	if ( isset($_GET['user']) )
		$params['selected'] = $_GET['user']; // choose selected user by $_GET variable
	
	wp_dropdown_users( $params ); // print the ready author list
}

// 72
add_action('restrict_manage_posts', 'wpunity_filter_by_the_author');





//
//                AJAXes   registration
//

// -------- Ajax for game projects ------
// Ajax for fetching game's assets within asset browser widget at vr_editor
add_action( 'wp_ajax_wpunity_fetch_game_assets_action', 'wpunity_fetch_game_assets_action_callback' );

// Callback for Ajax for delete game
add_action('wp_ajax_wpunity_delete_game_action','wpunity_delete_gameproject_frontend_callback');

// Callback for add collaborators
add_action('wp_ajax_wpunity_collaborate_project_action','wpunity_collaborate_project_frontend_callback');

// Callback for fetching collaborators from db
add_action('wp_ajax_wpunity_fetch_collaborators_action','wpunity_fetch_collaborators_frontend_callback');

add_action('wp_ajax_wpunity_create_game_action','wpunity_create_gameproject_frontend_callback');

add_action('wp_ajax_wpunity_fetch_list_projects_action','wpunity_fetch_list_projects_callback');



// ------ Ajaxes for scenes -----------
add_action('wp_ajax_wpunity_save_scene_async_action','wpunity_save_scene_async_action_callback');
add_action('wp_ajax_wpunity_undo_scene_async_action','wpunity_undo_scene_async_action_callback');
add_action('wp_ajax_wpunity_redo_scene_async_action','wpunity_redo_scene_async_action_callback');


add_action('wp_ajax_wpunity_save_expid_async_action','wpunity_save_expid_async_action_callback');

// Ajax for saving gio asynchronoysly
add_action('wp_ajax_wpunity_save_gio_async_action','wpunity_save_gio_async_action_callback');

// Ajax for deleting scene
add_action('wp_ajax_wpunity_delete_scene_action','wpunity_delete_scene_frontend_callback');


//------ Ajaxes for Assets----
// AJAXES for content interlinking
add_action( 'wp_ajax_wpunity_fetch_description_action', 'wpunity_fetch_description_action_callback' );
//add_action( 'wp_ajax_wpunity_translate_action', 'wpunity_translate_action_callback' );
add_action( 'wp_ajax_wpunity_fetch_image_action', 'wpunity_fetch_image_action_callback' );
add_action( 'wp_ajax_wpunity_fetch_video_action', 'wpunity_fetch_video_action_callback' );


// Peer conferencing
add_action( 'wp_ajax_nopriv_wpunity_notify_confpeers_action', 'wpunity_notify_confpeers_callback');
add_action( 'wp_ajax_wpunity_notify_confpeers_action', 'wpunity_notify_confpeers_callback');

add_action( 'wp_ajax_wpunity_update_expert_log_action', 'wpunity_update_expert_log_callback');


// AJAXES for semantics
add_action( 'wp_ajax_wpunity_segment_obj_action', 'wpunity_segment_obj_action_callback' );
add_action( 'wp_ajax_wpunity_monitor_segment_obj_action', 'wpunity_monitor_segment_obj_action_callback' );
add_action( 'wp_ajax_wpunity_enlist_splitted_objs_action', 'wpunity_enlist_splitted_objs_action_callback' );

add_action( 'wp_ajax_wpunity_classify_obj_action', 'wpunity_classify_obj_action_callback' );

// AJAX for delete asset
add_action('wp_ajax_wpunity_delete_asset_action', 'wpunity_delete_asset3d_frontend_callback');

// AJAX for fetch asset
add_action('wp_ajax_wpunity_fetch_asset_action', 'wpunity_fetch_asset3d_frontend_callback');

// ------- Ajaxes for compiling ---------

// the ajax js is in js_lib/request_game.js (see main functions.php for registering js)
// the ajax phps are on wpunity-core-functions.php
add_action( 'wp_ajax_wpunity_compile_action', 'wpunity_compile_action_callback' );
add_action( 'wp_ajax_wpunity_monitor_compiling_action', 'wpunity_monitor_compiling_action_callback' );
add_action( 'wp_ajax_wpunity_killtask_compiling_action', 'wpunity_killtask_compiling_action_callback' );
add_action( 'wp_ajax_wpunity_game_zip_action', 'wpunity_game_zip_action_callback' );

// Assemble php from ajax call
add_action( 'wp_ajax_wpunity_assemble_action', 'wpunity_assemble_action_callback' );
// Add the assepile php
add_action( 'wp_ajax_wpunity_assepile_action', 'wpunity_assepile_action_callback' );


?>
