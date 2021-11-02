<?php
/**
 * Plugin Name: VRodos
 * Plugin URI: https://vrodos.iti.gr
 * Description: Make your wordpress website a VR site
 * Author: Dimitrios Ververidis, ververid@iti.gr
 * Author URI: https://vrodos.iti.gr
 * Version: 0.6
 */


/*
 * Please change root .htaccess for uploading big 3D model files
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

// Set scope for the 3D editor (under construction feature):
// Virtual Tour: 0
// Virtual Lab: 1
$project_scope = 0;



// VRodos js register
function vrodos_register_scripts() {
 
	$pluginDirJS = plugin_dir_url( __FILE__ ).'js_libs/';
	
	
	
	$scriptsA = array(
		array('vrodos_asset_editor_scripts', $pluginDirJS.'vrodos_asset_editor_scripts.js'),
		array('vrodos_scripts', $pluginDirJS.'vrodos_scripts.js'),
		array('vrodos_lightslider', $pluginDirJS.'external_js_libraries/lightslider.min.js'),
		array('vrodos_jscolorpick', $pluginDirJS.'external_js_libraries/jscolor.js'),
		array('vrodos_jsfontselect', $pluginDirJS.'external_js_libraries/jquery.fontselect.js'),
		array('vrodos_html2canvas', $pluginDirJS.'external_js_libraries/html2canvas.min.js'),
		array('vrodos_assepile_request', $pluginDirJS.'assemble_compile_commands/request_game_assepile.js'),
		array('vrodos_savescene_request', $pluginDirJS.'ajaxes/vrodos_save_scene_ajax.js'),
		array('vrodos_content_interlinking_request', $pluginDirJS.'content_interlinking_commands/content_interlinking.js'),
		array('vrodos_segmentation_request', $pluginDirJS.'semantics_commands/segmentation.js'),
		
		array('vrodos_classification_request', $pluginDirJS.'semantics_commands/classification.js'),
		array('vrodos_qrcode_generator', $pluginDirJS.'external_js_libraries/qrcode.js'),
		array('vrodos_inflate', $pluginDirJS.'external_js_libraries/inflate.min.js'),
		array('vrodos_AssetViewer_3D_kernel', $pluginDirJS.'vrodos_AssetViewer_3D_kernel.js'),
		array('vrodos_3d_editor_buttons', $pluginDirJS.'vrodos_3d_editor_buttons.js'),
		array('vrodos_vr_editor_analytics', $pluginDirJS.'vrodos_3d_editor_analytics.js'),
	);
	
	for ( $i = 0 ; $i < count($scriptsA); $i ++){
		wp_register_script($scriptsA[$i][0] , $scriptsA[$i][1], null, null, false );
	}

	//=========================== THREE js 87 scripts ============================================
	
	$scriptsB = array(
			array( 'vrodos_load87_OBJloader', $pluginDirJS.'threejs87/OBJLoader.js'),
			array( 'vrodos_load87_OBJloader2', $pluginDirJS.'threejs87/OBJLoader2.js'),
			array( 'vrodos_load87_WWOBJloader2', $pluginDirJS. 'threejs87/WWOBJLoader2.js'),
			array( 'vrodos_load87_MTLloader', $pluginDirJS.'threejs87/MTLLoader.js'),
			array( 'vrodos_load87_OrbitControls', $pluginDirJS.'threejs87/OrbitControls.js'),
            array( 'vrodos_load87_TransformControls', $pluginDirJS.'threejs87/TransformControls.js'),
			array( 'vrodos_load87_PointerLockControls', $pluginDirJS.'threejs87/PointerLockControls.js'),
			array( 'vrodos_load87_datgui', $pluginDirJS.'threejs87/dat.gui.js'),
			
			array( 'vrodos_load87_PDBloader', $pluginDirJS.'threejs87/PDBLoader.js'),
			array( 'vrodos_load87_sceneexporterutils', $pluginDirJS.'threejs87/SceneExporterUtils.js'),
			array( 'vrodos_load87_scene_importer_utils', $pluginDirJS.'threejs87/SceneImporter.js'),
			array( 'vrodos_load87_sceneexporter', $pluginDirJS.'threejs87/SceneExporter.js'),
		);
	
	for ( $i = 0 ; $i < count($scriptsB); $i ++){
		wp_register_script($scriptsB[$i][0] , $scriptsB[$i][1], null, null, false );
	}
	
	//=========================== THREE js 119 scripts ============================================
	
	$scriptsC = array(
		array( 'vrodos_load119_threejs', $pluginDirJS.'threejs119/three.js'),
		array( 'vrodos_load124_threejs', $pluginDirJS.'threejs124/three.js'),
		array( 'vrodos_load125_threejs', $pluginDirJS.'threejs125/three.js'),
		array( 'vrodos_load124_statjs', $pluginDirJS.'threejs124/stats.js'),
		
		array( 'vrodos_load119_FBXloader', $pluginDirJS.'threejs119/FBXLoader.js'),
		array( 'vrodos_load119_GLTFLoader', $pluginDirJS.'threejs119/GLTFLoader.js'),
		array( 'vrodos_load119_DRACOLoader', $pluginDirJS.'threejs119/DRACOLoader.js'),
		array( 'vrodos_load119_DDSLoader', $pluginDirJS.'threejs119/DDSLoader.js'),
		array( 'vrodos_load119_KTXLoader', $pluginDirJS.'threejs119/KTXLoader.js'),
		
		array( 'vrodos_load119_OrbitControls', $pluginDirJS.'threejs119/OrbitControls.js'),
		array( 'vrodos_load125_OrbitControls', $pluginDirJS.'threejs125/OrbitControls.js'),
		array( 'vrodos_load119_TransformControls', $pluginDirJS.'threejs119/TransformControls.js'),
		array( 'vrodos_load124_TrackballControls', $pluginDirJS.'threejs124/TrackballControls.js'),
		array( 'vrodos_load119_PointerLockControls', $pluginDirJS.'threejs119/PointerLockControls.js'),
		
		array( 'vrodos_load125_TrackballControls', $pluginDirJS.'threejs125/TrackballControls.js'),
		array( 'vrodos_load125_CSS2DRenderer', $pluginDirJS.'threejs125/CSS2DRenderer.js'),

		array( 'vrodos_load119_CSS2DRenderer', $pluginDirJS.'threejs119/CSS2DRenderer.js'),
		
		array( 'vrodos_load119_CopyShader', $pluginDirJS.'threejs119/CopyShader.js'),
		array( 'vrodos_load119_FXAAShader', $pluginDirJS.'threejs119/FXAAShader.js'),
		array( 'vrodos_load119_EffectComposer', $pluginDirJS.'threejs119/EffectComposer.js'),
		array( 'vrodos_load119_RenderPass', $pluginDirJS.'threejs119/RenderPass.js'),
		array( 'vrodos_load119_OutlinePass', $pluginDirJS.'threejs119/OutlinePass.js'),
		array( 'vrodos_load119_ShaderPass', $pluginDirJS.'threejs119/ShaderPass.js'),
	);
	
	for ( $i = 0 ; $i < count($scriptsC); $i ++){
		wp_register_script($scriptsC[$i][0] , $scriptsC[$i][1], null, null, false );
	}
	
	
	//----Various for scene editor
	
	$scriptsD = array(
			array( 'vrodos_3d_editor_environmentals', $pluginDirJS.'vrodos_3d_editor_environmentals.js'),
			array( 'vrodos_keyButtons', $pluginDirJS.'vrodos_keyButtons.js'),
			array( 'vrodos_rayCasters', $pluginDirJS.'vrodos_rayCasters.js'),
			array( 'vrodos_auxControlers', $pluginDirJS.'vrodos_auxControlers.js'),
			array( 'vrodos_LoaderMulti', $pluginDirJS.'vrodos_LoaderMulti.js'),
			array( 'vrodos_movePointerLocker', $pluginDirJS.'vrodos_movePointerLocker.js'),
			array( 'vrodos_addRemoveOne', $pluginDirJS.'vrodos_addRemoveOne.js'),
		);
	
	for ( $i = 0 ; $i < count($scriptsD); $i ++){
		wp_register_script($scriptsD[$i][0] , $scriptsD[$i][1], null, null, false );
	}
}
// 45

// Register in front-end
add_action('wp_enqueue_scripts', 'vrodos_register_scripts' );

// Register also in back-end
add_action('admin_enqueue_scripts', 'vrodos_register_scripts' );

function vrodos_register_styles() {
 
	wp_register_style( 'vrodos_backend', plugin_dir_url( __FILE__ ) . 'css/vrodos_backend.css' );
	wp_register_style( 'vrodos_3D_editor', plugin_dir_url( __FILE__ ) . 'css/vrodos_3D_editor.css' );
	wp_register_style( 'vrodos_datgui', plugin_dir_url( __FILE__ ) . 'css/dat-gui.css' );

	
	wp_register_style( 'vrodos_3D_editor_browser', plugin_dir_url( __FILE__ ).'css/vrodos_3D_editor_browser.css' );
	wp_register_style( 'vrodos_material_stylesheet',  plugin_dir_url( __FILE__ ).'node_modules/material-components-web/dist/material-components-web.css' );
	wp_register_script( 'vrodos_material_scripts', plugin_dir_url( __FILE__ ).'node_modules/material-components-web/dist/material-components-web.js');
	
	wp_register_style( 'vrodos_frontend_stylesheet',  plugin_dir_url( __FILE__ ) . 'css/vrodos_frontend.css' );
	
	wp_register_style( 'vrodos_lightslider_stylesheet',  plugin_dir_url( __FILE__ ) . 'css/lightslider.min.css' );
    
    //wp_register_style( 'vrodos_materialize_stylesheet',  plugin_dir_url( __FILE__ ) . 'css/materialize.css' );
	
	wp_register_style( 'vrodos_asseteditor_stylesheet',  plugin_dir_url( __FILE__ ) . 'css/vrodos_asseteditor.css' );
	
	wp_register_style( 'vrodos_widgets_stylesheet',  plugin_dir_url( __FILE__ ) . 'css/vrodos_widgets.css' );
 
	
	// TODO: When ready for production, ignore  node_modules folder and move the 2 material css & js files to another folder.
	// Material & Frontend CSS & Scripts
	wp_enqueue_style('vrodos_material_stylesheet');
	wp_enqueue_script('vrodos_material_scripts');
	wp_enqueue_style( 'vrodos_material_icons', plugin_dir_url( __FILE__ ) . 'css/material-icons/material-icons.css' );
//    wp_enqueue_style( 'vrodos_glyphter_icons', plugin_dir_url( __FILE__ ) . 'css/glyphter-font/Glyphter.css' );
	wp_enqueue_style('vrodos_frontend_stylesheet');
	
	wp_enqueue_style( 'vrodos_lightslider_stylesheet');
	
	wp_enqueue_style('vrodos_backend');
}
// 46
add_action('wp_enqueue_scripts', 'vrodos_register_styles' );

// Register also in back-end
add_action('admin_enqueue_scripts', 'vrodos_register_styles' );


//----------------------- USER ROLES -------------------------------------------

require_once ( plugin_dir_path( __FILE__ ) . 'includes/vrodos-users-roles.php');

// Order : 4
add_action( 'init', 'vrodos_add_customroles');

// Order: 6
add_action( 'init', 'vrodos_add_capabilities_to_admin');

//---------------------- Game Projects -------------------------------------------------
require_once ( plugin_dir_path( __FILE__ ) . 'includes/vrodos-types-games.php');


// Order: 7
add_action('init', 'vrodos_project_cpt_construct', 1);

// Order: 9
add_action('init', 'vrodos_project_taxtype_create', 2);

// Order : 2
add_action( 'init', 'vrodos_projects_taxtypes_define', 3 );



// 28
add_action('transition_post_status','vrodos_create_folder_game', 9 , 3);


// 50
add_filter( 'manage_vrodos_game_posts_columns', 'vrodos_set_custom_vrodos_game_columns' );

//Create Game Category Box @ Game's backend
// 51
add_action('add_meta_boxes','vrodos_games_taxcategory_box');


/* Do something with the data entered */
// 31
add_action( 'save_post', 'vrodos_games_taxtype_box_content_save' );

// Add the data to the custom columns for the game post type:
// 55
add_action( 'manage_vrodos_game_posts_custom_column' , 'vrodos_set_custom_vrodos_game_columns_fill', 10, 2 );

// 40
add_action('admin_menu', 'vrodos_games_databox_add');

// 32
add_action('save_post', 'vrodos_games_databox_save');

//---------------------- Scenes ----------------------------------------------------

include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-types-scenes.php');

// Order : 11
add_action('init', 'vrodos_scenes_construct'); //vrodos_scene 'SCENES'

// Order: 12
add_action('init', 'vrodos_scenes_parent_project_tax_define'); //vrodos_scene_pgame  'SCENE GAMES'

// Order: 13
add_action('init', 'vrodos_scenes_taxyaml'); //vrodos_scene_yaml 'SCENE TYPES'

// Create Scene's Game Box @ scene's backend
// 52
add_action('add_meta_boxes','vrodos_scenes_taxgame_box');

//When the post is saved, also saves vrodos_game_cat
//33
add_action( 'save_post', 'vrodos_scenes_taxgame_box_content_save' );

//34
add_action( 'save_post', 'vrodos_scenes_taxyaml_box_content_save' );

// 56
add_filter( 'manage_vrodos_scene_posts_columns', 'vrodos_set_custom_vrodos_scene_columns' );

// Add the data to the custom columns for the scene post type
// 57
add_action( 'manage_vrodos_scene_posts_custom_column' , 'vrodos_set_custom_vrodos_scene_columns_fill', 10, 2 );

// 41
add_action('admin_menu', 'vrodos_scenes_meta_definitions_add');

// Save metas
add_action('save_post', 'vrodos_scenes_metas_save');

////===================================== Assets ============================================

include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-types-assets.php' );

// 14
add_action('init', 'vrodos_assets_construct'); // vrodos_asset3d 'ASSETS 3D'


// 15
add_action('init', 'vrodos_assets_taxcategory'); // vrodos_asset3d_cat 'ASSET TYPES'

// 16
add_action('init', 'vrodos_assets_taxpgame'); // vrodos_asset3d_pgame 'ASSET GAMES'

// 17
add_action('init', 'vrodos_assets_taxcategory_ipr'); // vrodos_asset3d_ipr_cat 'ASSET IPR CATEG'

// Register asset metas
add_action( 'init', 'vrodos_asset3d_metas_description', 1);

// 35
add_action('save_post','vrodos_create_pathdata_asset',10,3);

// 18
add_action('init','vrodos_allowAuthorEditing');

// 58
add_filter( 'wp_dropdown_users_args', 'change_user_dropdown', 10, 2 );


// 36
add_action( 'save_post', 'vrodos_asset_tax_category_box_content_save');

// 37
add_action( 'save_post', 'vrodos_assets_taxcategory_ipr_box_content_save' );

// 38
add_action( 'save_post', 'vrodos_asset_project_box_content_save');


// Create Asset Taxonomy Boxes (Category & Scene) @ asset's backend
// 53
add_action('add_meta_boxes','vrodos_assets_taxcategory_box');

include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-types-assets-data.php' );

// Save data from infobox
// 39
add_action('save_post', 'vrodos_assets_databox_save');

// 42
add_action('admin_menu', 'vrodos_assets_databox_add');

// 48
//add_action('wp_enqueue_scripts', 'vrodos_assets_scripts_and_styles' );

//
//// 61
add_filter( 'manage_vrodos_asset3d_posts_columns', 'vrodos_set_custom_vrodos_asset3d_columns' );
//
//// Add the data to the custom columns for the book post type:
//// 62
add_action( 'manage_vrodos_asset3d_posts_custom_column' , 'vrodos_set_custom_vrodos_asset3d_columns_fill', 10, 2 );





//===================================== Other ============================================

include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-core-upload-functions.php' );

add_filter( 'upload_dir', 'vrodos_upload_dir_forScenesOrAssets' );
add_filter( 'intermediate_image_sizes', 'vrodos_disable_imgthumbs_assets', 999 );
add_filter( 'sanitize_file_name', 'vrodos_overwrite_uploads', 10, 1 );

include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-core-functions.php' );

// Set to the lowest priority in order to have game taxes available when joker games are created
add_action( 'init', 'vrodos_createJoker_activation', 100, 2 );
add_filter( 'wp_nav_menu_items','vrodos_loginout_menu_link', 5, 2 );
// Remove Admin bar for non admins
add_action('after_setup_theme', 'vrodos_remove_admin_bar');

include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-core-setget-functions.php' );

//Create Initial Asset Categories
include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-page-settings.php' );



if( is_admin() ){
	$my_settings_page = new vrodos_settingsPage();
	//19
	add_action( 'init', array( $my_settings_page, 'load_settings' ) );

	//29
	add_action( 'admin_init', array( $my_settings_page, 'register_general_settings' ) );

	// 43
	add_action( 'admin_menu', array( $my_settings_page, 'render_setting') );
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
// 4. 2D Scene editor
// 5. Exam page
// 6. Asset Editor
register_activation_hook(__FILE__,'vrodos_create_pages');

// Add Project Manager and Assets List pages to menu automatically;
// Some messages also
register_activation_hook( __FILE__, 'vrodos_fx_admin_notice_activation_hook' );

// -------------  Games versions table -------------------------------------
include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-db-table-creations.php' );

// 69
register_activation_hook( __FILE__, 'vrodos_db_create_games_versions_table' );

// ------------------- Add helper functions file ------------------------------------------
include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-core-helper.php' );

//------------------- For Compile ---------------------------------
include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-core-project-assemble.php' );
include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-core-project-assemble-replace.php' );
include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-core-project-assemble-handler.php' );

//-------------------- Energy related ----------------------------
include_once( plugin_dir_path( __FILE__ ) . 'includes/default_game_project_settings/vrodos-default-energy-settings.php' );



// 20
add_action( 'init', 'vrodos_assets_taxcategory_energy_fill' );

// 21
add_action( 'init', 'vrodos_scenes_types_energy_standard_cre' );



include_once( plugin_dir_path( __FILE__ ) . 'includes/default_game_project_settings/vrodos-default-energy-yamls.php' );


include_once( plugin_dir_path( __FILE__ ) . 'includes/default_game_project_settings/vrodos-default-energy-compile.php' );



//------------------- Archaeology related -----------------------
include_once( plugin_dir_path( __FILE__ ) . 'includes/default_game_project_settings/vrodos-default-archaeology-yamls.php' );
include_once( plugin_dir_path( __FILE__ ) . 'includes/default_game_project_settings/vrodos-default-archaeology-settings.php' );

// 22
add_action( 'init', 'vrodos_assets_taxcategory_archaeology_fill' );

// 23
add_action( 'init', 'vrodos_scenes_types_archaeology_standard_cre' );

include_once( plugin_dir_path( __FILE__ ) . 'includes/default_game_project_settings/vrodos-default-archaeology-compile.php' );

//-------------------- Chemistry related ------------------------
include_once( plugin_dir_path( __FILE__ ) . 'includes/default_game_project_settings/vrodos-default-chemistry-settings.php' );

// 24
add_action( 'init', 'vrodos_assets_taxcategory_chemistry_fill' );

// 25
add_action( 'init', 'vrodos_scenes_types_chemistry_standard_cre' );


include_once( plugin_dir_path( __FILE__ ) . 'includes/default_game_project_settings/vrodos-default-chemistry-yamls.php' );
include_once( plugin_dir_path( __FILE__ ) . 'includes/default_game_project_settings/vrodos-default-chemistry-compile.php' );

include_once( plugin_dir_path( __FILE__ ) . 'includes/vrodos-PDBLoader.php' );



// For Envisage only
if ($project_scope === 1) {
	// Add a new form element...
	add_action('register_form', 'vrodos_extrapass_register_form');
	// Finally, save our extra registration user meta.
	add_action('user_register', 'vrodos_extrapass_user_register', 10, 1);

	add_action('show_user_profile', 'vrodos_extrapass_profile_fields');
	add_action('edit_user_profile', 'vrodos_extrapass_profile_fields');

	add_action( 'user_register', 'vrodos_registrationUser_save', 10, 2 );
}


// ---- Content interlinking ----------

add_action( 'wp_ajax_vrodos_fetch_description_action', 'vrodos_fetch_description_action_callback' );

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
//	$mime_types['fbx'] = 'text/plain';
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
        wp_redirect( get_site_url( ).'/vrodos-project-manager-page/' );
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
add_action('wp_enqueue_scripts', 'vrodos_widget_preamp_scripts'); // Front-end
add_action('admin_enqueue_scripts', 'vrodos_widget_preamp_scripts'); // Back-end

// Register and load the widget
function vrodos_load_widget() {
	register_widget( 'vrodos_3d_widget' );
}
add_action( 'widgets_init', 'vrodos_load_widget');



// 54
// For classification
//add_action('add_meta_boxes','vrodos_assets_create_right_metaboxes');

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

// -------- Ajax for game projects ------
// Ajax for fetching game's assets within asset browser widget at vr_editor
add_action( 'wp_ajax_vrodos_fetch_game_assets_action', 'vrodos_fetch_game_assets_action_callback' );

// Callback for Ajax for delete game
add_action('wp_ajax_vrodos_delete_game_action','vrodos_delete_gameproject_frontend_callback');

// Callback for add collaborators
add_action('wp_ajax_vrodos_collaborate_project_action','vrodos_collaborate_project_frontend_callback');

// Callback for fetching collaborators from db
add_action('wp_ajax_vrodos_fetch_collaborators_action','vrodos_fetch_collaborators_frontend_callback');

add_action('wp_ajax_vrodos_create_game_action','vrodos_create_gameproject_frontend_callback');

add_action('wp_ajax_vrodos_fetch_list_projects_action','vrodos_fetch_list_projects_callback');



// ------ Ajaxes for scenes -----------
add_action('wp_ajax_vrodos_save_scene_async_action','vrodos_save_scene_async_action_callback');
add_action('wp_ajax_vrodos_undo_scene_async_action','vrodos_undo_scene_async_action_callback');
add_action('wp_ajax_vrodos_redo_scene_async_action','vrodos_redo_scene_async_action_callback');


add_action('wp_ajax_vrodos_save_expid_async_action','vrodos_save_expid_async_action_callback');

// Ajax for saving gio asynchronoysly
add_action('wp_ajax_vrodos_save_gio_async_action','vrodos_save_gio_async_action_callback');

// Ajax for deleting scene
add_action('wp_ajax_vrodos_delete_scene_action','vrodos_delete_scene_frontend_callback');


//------ Ajaxes for Assets----
// AJAXES for content interlinking
add_action( 'wp_ajax_vrodos_fetch_description_action', 'vrodos_fetch_description_action_callback' );
//add_action( 'wp_ajax_vrodos_translate_action', 'vrodos_translate_action_callback' );
add_action( 'wp_ajax_vrodos_fetch_image_action', 'vrodos_fetch_image_action_callback' );
add_action( 'wp_ajax_vrodos_fetch_video_action', 'vrodos_fetch_video_action_callback' );


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
add_action('wp_ajax_vrodos_delete_asset_action', 'vrodos_delete_asset3d_frontend_callback');

// AJAX for fetch asset
add_action('wp_ajax_vrodos_fetch_fbx_asset_action', 'vrodos_fetch_fbx_asset3d_frontend_callback');
add_action('wp_ajax_vrodos_fetch_glb_asset_action', 'vrodos_fetch_glb_asset3d_frontend_callback');

add_action('wp_ajax_vrodos_fetch_assetmeta_action', 'vrodos_fetch_asset3d_meta_backend_callback');

// ------- Ajaxes for compiling ---------

// the ajax js is in js_lib/request_game.js (see main functions.php for registering js)
// the ajax phps are on vrodos-core-functions.php

//add_action( 'wp_ajax_vrodos_compile_action', 'vrodos_compile_action_callback' );
add_action( 'wp_ajax_vrodos_monitor_compiling_action', 'vrodos_monitor_compiling_action_callback' );
add_action( 'wp_ajax_vrodos_killtask_compiling_action', 'vrodos_killtask_compiling_action_callback' );
add_action( 'wp_ajax_vrodos_game_zip_action', 'vrodos_game_zip_action_callback' );

// Assemble php from ajax call
//add_action( 'wp_ajax_vrodos_assemble_action', 'vrodos_assemble_action_callback' );
// Add the assepile php

add_action( 'wp_ajax_vrodos_assepile_action', 'vrodos_assepile_action_callback' );



