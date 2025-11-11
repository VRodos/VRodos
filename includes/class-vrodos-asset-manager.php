<?php

if (!defined('ABSPATH')) {
    exit;
}

class VRodos_Asset_Manager {

    public function __construct() {
        add_action('wp_enqueue_scripts', array($this, 'register_scripts'));
        add_action('admin_enqueue_scripts', array($this, 'register_scripts'));
        add_action('wp_enqueue_scripts', array($this, 'register_styles'));
        add_action('admin_enqueue_scripts', array($this, 'register_styles'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_asset_editor_scripts'));
    }

    public function enqueue_asset_editor_scripts() {

        $asset_editor_page = VRodos_Core_Manager::vrodos_getEditpage('asset');
        if (!$asset_editor_page || !is_page($asset_editor_page[0]->ID)) {
            return;
        }

        // Stylesheet
        wp_enqueue_style('vrodos_asseteditor_stylesheet');

        // Three js : for simple rendering
        wp_enqueue_script('vrodos_scripts');

        // 1. Three js library
        wp_enqueue_script( 'vrodos_load141_threejs' );
        wp_enqueue_script( 'vrodos_load141_OrbitControls' );
        wp_enqueue_script( 'vrodos_load141_GLTFLoader' );
        wp_enqueue_script( 'vrodos_load141_CSS2DRenderer' );
        wp_enqueue_script( 'vrodos_load141_DRACOLoader' );

        // Load single asset: Load existing asset
        wp_enqueue_script('vrodos_AssetViewer_3D_kernel');

        // Load scripts for asset editor
        wp_enqueue_script('vrodos_asset_editor_scripts');

        // Select colors
        wp_enqueue_script('vrodos_jscolorpick');

        // to capture screenshot of the 3D molecule and its tags
        wp_enqueue_script('vrodos_html2canvas');

        // Content Interlinking
        wp_enqueue_script( 'ajax-vrodos_content_interlinking_request',
            plugin_dir_url(VRODOS_PLUGIN_FILE).'js_libs/content_interlinking_commands/content_interlinking.js', array('jquery') );

        // ajax php admin url
        wp_localize_script( 'ajax-vrodos_content_interlinking_request', 'my_ajax_object_fetch_content',
            array( 'ajax_url' => admin_url( 'admin-ajax.php' ), null )
        );
    }

    public function register_scripts() {
        $pluginDirJS = plugin_dir_url( __FILE__ ).'../js_libs/';

        $scriptsA = array(
            array('vrodos_asset_editor_scripts', $pluginDirJS.'vrodos_asset_editor_scripts.js'),
            array('vrodos_scripts', $pluginDirJS.'vrodos_scripts.js'),
            array('vrodos_jscolorpick', $pluginDirJS.'external_js_libraries/jscolor.js'),
            array('vrodos_html2canvas', $pluginDirJS.'external_js_libraries/html2canvas.min.js'),
            array('vrodos_request_compile', $pluginDirJS.'ajaxes/vrodos_request_compile.js'),
            array('vrodos_savescene_request', $pluginDirJS.'ajaxes/vrodos_save_scene_ajax.js'),
            array('vrodos_content_interlinking_request', $pluginDirJS.'content_interlinking_commands/content_interlinking.js'),
            array('vrodos_segmentation_request', $pluginDirJS.'semantics_commands/segmentation.js'),
            array('vrodos_classification_request', $pluginDirJS.'semantics_commands/classification.js'),
            array('vrodos_inflate', $pluginDirJS.'external_js_libraries/inflate.min.js'),
            array('vrodos_AssetViewer_3D_kernel', $pluginDirJS.'vrodos_AssetViewer_3D_kernel.js'),
            array('vrodos_3d_editor_buttons_drags', $pluginDirJS.'vrodos_3d_editor_buttons_drags.js'),
            array('vrodos_vr_editor_analytics', $pluginDirJS.'vrodos_3d_editor_analytics.js'),
            array( 'vrodos_ScenePersistence', $pluginDirJS.'vrodos_ScenePersistence.js'),
        );

        for ( $i = 0 ; $i < count($scriptsA); $i ++){
            wp_register_script($scriptsA[$i][0] , $scriptsA[$i][1], null, null, false );
        }

        $scriptsC = array(
            array( 'vrodos_load141_threejs', $pluginDirJS.'threejs141/three.js'),
            array( 'vrodos_load141_FontLoader', $pluginDirJS.'threejs141/FontLoader.js'),
            array( 'vrodos_load141_TextGeometry', $pluginDirJS.'threejs141/TextGeometry.js'),
            array( 'vrodos_load141_statjs', $pluginDirJS.'threejs141/stats.js'),
            array( 'vrodos_load141_FBXloader', $pluginDirJS.'threejs141/FBXLoader.js'),
            array( 'vrodos_load141_GLTFLoader', $pluginDirJS.'threejs141/GLTFLoader.js'),
            array( 'vrodos_load141_DRACOLoader', $pluginDirJS.'threejs141/DRACOLoader.js'),
            array( 'vrodos_load141_DDSLoader', $pluginDirJS.'threejs141/DDSLoader.js'),
            array( 'vrodos_load141_KTXLoader', $pluginDirJS.'threejs141/KTXLoader.js'),
            array( 'vrodos_load141_OrbitControls', $pluginDirJS.'threejs141/OrbitControls.js'),
            array( 'vrodos_load141_TransformControls', $pluginDirJS.'threejs141/TransformControls.js'),
            array( 'vrodos_load141_TrackballControls', $pluginDirJS.'threejs141/TrackballControls.js'),
            array( 'vrodos_load141_PointerLockControls', $pluginDirJS.'threejs141/PointerLockControls.js'),
            array( 'vrodos_load141_CSS2DRenderer', $pluginDirJS.'threejs141/CSS2DRenderer.js'),
            array( 'vrodos_load141_CopyShader', $pluginDirJS.'threejs141/CopyShader.js'),
            array( 'vrodos_load141_FXAAShader', $pluginDirJS.'threejs141/FXAAShader.js'),
            array( 'vrodos_load141_EffectComposer', $pluginDirJS.'threejs141/EffectComposer.js'),
            array( 'vrodos_load141_RenderPass', $pluginDirJS.'threejs141/RenderPass.js'),
            array( 'vrodos_load141_OutlinePass', $pluginDirJS.'threejs141/OutlinePass.js'),
            array( 'vrodos_load141_ShaderPass', $pluginDirJS.'threejs141/ShaderPass.js'),
            array( 'vrodos_load141_FontLoader', $pluginDirJS.'threejs141/FontLoader.js'),
            array( 'vrodos_load141_RGBELoader', $pluginDirJS.'threejs141/RGBELoader.js'),
            array( 'vrodos_load141_OBJLoader', $pluginDirJS.'threejs141/OBJLoader.js'),
            array( 'vrodos_load141_MTLLoader', $pluginDirJS.'threejs141/MTLLoader.js'),
        );

        for ( $i = 0 ; $i < count($scriptsC); $i ++){
            wp_register_script($scriptsC[$i][0] , $scriptsC[$i][1], null, null, false );
        }

        $scriptsD = array(
            array( 'vrodos_3d_editor_environmentals', $pluginDirJS.'vrodos_3d_editor_environmentals.js'),
            array( 'vrodos_keyButtons', $pluginDirJS.'vrodos_keyButtons.js'),
            array( 'vrodos_rayCasters', $pluginDirJS.'vrodos_rayCasters.js'),
            array( 'vrodos_auxControlers', $pluginDirJS.'vrodos_auxControlers.js'),
            array( 'vrodos_BordersFinder', $pluginDirJS.'vrodos_BordersFinder.js'),
            array( 'vrodos_LoaderMulti', $pluginDirJS.'vrodos_LoaderMulti.js'),
            array( 'vrodos_LightsPawn_Loader', $pluginDirJS.'vrodos_LightsPawn_Loader.js'),
            array( 'vrodos_movePointerLocker', $pluginDirJS.'vrodos_movePointerLocker.js'),
            array( 'vrodos_addRemoveOne', $pluginDirJS.'vrodos_addRemoveOne.js'),
            array( 'vrodos_HierarchyViewer', $pluginDirJS.'vrodos_HierarchyViewer.js')
        );

        for ( $i = 0 ; $i < count($scriptsD); $i ++){
            wp_register_script($scriptsD[$i][0] , $scriptsD[$i][1], null, null, false );
        }

        wp_register_script('vrodos_load_datgui', $pluginDirJS.'datgui/0.7.9/dat.gui.min.js', null, null, false );
    }

    public function register_styles() {
        wp_register_style( 'vrodos_backend', plugin_dir_url( __FILE__ ) . '../css/vrodos_backend.css' );
        wp_register_style( 'vrodos_3D_editor', plugin_dir_url( __FILE__ ) . '../css/vrodos_3D_editor.css' );
        wp_register_style( 'vrodos_datgui', plugin_dir_url( __FILE__ ) . '../js_libs/datgui/0.7.9/dat.gui.css' );
        wp_register_style( 'vrodos_dashboard_table', plugin_dir_url( __FILE__ ) . '../css/vrodos_dashboard_table_style.css' );
        wp_register_style( 'vrodos_3D_editor_browser', plugin_dir_url( __FILE__ ).'../css/vrodos_3D_editor_browser.css' );
        wp_register_style( 'vrodos_material_stylesheet',  plugin_dir_url( __FILE__ ).'../node_modules/material-components-web/dist/material-components-web.css' );
        wp_register_script( 'vrodos_material_scripts', plugin_dir_url( __FILE__ ).'../node_modules/material-components-web/dist/material-components-web.js');
        wp_register_style( 'vrodos_frontend_stylesheet',  plugin_dir_url( __FILE__ ) . '../css/vrodos_frontend.css' );
        wp_register_style( 'vrodos_asseteditor_stylesheet',  plugin_dir_url( __FILE__ ) . '../css/vrodos_asseteditor.css' );
        wp_register_style( 'vrodos_widgets_stylesheet',  plugin_dir_url( __FILE__ ) . '../css/vrodos_widgets.css' );

        wp_enqueue_script('vrodos_material_scripts');
        wp_enqueue_style( 'vrodos_material_icons', plugin_dir_url( __FILE__ ) . '../css/material-icons/material-icons.css' );
        wp_enqueue_style('vrodos_backend');
        wp_enqueue_style('vrodos_dashboard_table');
    }
}
