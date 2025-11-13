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
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scene_editor_scripts'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_project_manager_scripts'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets_list_scripts'));
        add_action('wp_enqueue_scripts', array($this, 'localize_edit_scene_scripts'), 11);
    }

    public function enqueue_assets_list_scripts() {
        $assets_list_page = VRodos_Core_Manager::vrodos_getEditpage('assetslist');
        if (!$assets_list_page || !is_page($assets_list_page[0]->ID)) {
            return;
        }

        wp_enqueue_style('vrodos_frontend_stylesheet');
        wp_enqueue_style('vrodos_material_stylesheet');

        $pluginpath = dirname(plugin_dir_url(__DIR__));
        $pluginpath = str_replace('\\', '/', $pluginpath);

        $isAdmin = is_admin() ? 'back' : 'front';
        wp_add_inline_script('vrodos_scripts', 'var isAdmin="' . $isAdmin . '";');

        wp_enqueue_script('ajax-script_deleteasset', $pluginpath . '/js_libs/ajaxes/delete_asset.js', array('jquery'));
        wp_localize_script('ajax-script_deleteasset', 'my_ajax_object_deleteasset',
            array('ajax_url' => admin_url('admin-ajax.php'))
        );

        wp_enqueue_script('ajax-vrodos_content_interlinking_request',
            $pluginpath . '/js_libs/content_interlinking_commands/content_interlinking.js', array('jquery'));

        wp_localize_script('ajax-vrodos_content_interlinking_request', 'my_ajax_object_fetch_content',
            array('ajax_url' => admin_url('admin-ajax.php'), null)
        );
    }

    public function enqueue_project_manager_scripts() {
        $project_manager_page = VRodos_Core_Manager::vrodos_getEditpage('game');
        if (!$project_manager_page || !is_page($project_manager_page[0]->ID)) {
            return;
        }
        wp_enqueue_script('ajax-script_delete_game');
        wp_localize_script('ajax-script_delete_game', 'my_ajax_object_deletegame',
            array('ajax_url' => admin_url('admin-ajax.php'))
        );

        wp_enqueue_script('ajax-script_collaborate_project');
        wp_localize_script('ajax-script_collaborate_project', 'my_ajax_object_collaborate_project',
            array('ajax_url' => admin_url('admin-ajax.php'))
        );

        wp_enqueue_script('ajax-script_create_game');
        wp_localize_script('ajax-script_create_game', 'my_ajax_object_creategame',
            array('ajax_url' => admin_url('admin-ajax.php'))
        );

        wp_enqueue_script('vrodos_project_manager');

        $user = wp_get_current_user();
        $perma_structure = (bool)get_option('permalink_structure');
        $parameter_Scenepass = $perma_structure ? '?vrodos_scene=' : '&vrodos_scene=';
        $isAdmin = is_admin() ? 'back' : 'front';
        wp_localize_script('vrodos_project_manager', 'vrodos_project_manager_data', array(
            'current_user_id' => $user->ID,
            'parameter_Scenepass' => $parameter_Scenepass,
            'isAdmin' => $isAdmin,
        ));
    }

    public function enqueue_scene_editor_scripts() {
        $edit_scene_page = VRodos_Core_Manager::vrodos_getEditpage('scene');
        if (!$edit_scene_page || !is_page($edit_scene_page[0]->ID)) {
            return;
        }

        wp_enqueue_script('jquery-ui-draggable');
        wp_enqueue_script('vrodos_scripts');
        wp_enqueue_script('vrodos_load141_threejs');
        wp_enqueue_script('vrodos_load141_FontLoader');
        wp_enqueue_script('vrodos_load141_TextGeometry');
        wp_enqueue_script('vrodos_load141_CSS2DRenderer');
        wp_enqueue_script('vrodos_load141_CopyShader');
        wp_enqueue_script('vrodos_load141_FXAAShader');
        wp_enqueue_script('vrodos_load141_EffectComposer');
        wp_enqueue_script('vrodos_load141_RenderPass');
        wp_enqueue_script('vrodos_load141_OutlinePass');
        wp_enqueue_script('vrodos_load141_ShaderPass');
        wp_enqueue_script('vrodos_load141_RGBELoader');
        wp_enqueue_script('vrodos_load141_GLTFLoader');
        wp_enqueue_script('vrodos_inflate');
        wp_enqueue_script('vrodos_HierarchyViewer');
        wp_enqueue_script('vrodos_load_datgui');
        wp_enqueue_script('vrodos_load141_OrbitControls');
        wp_enqueue_script('vrodos_load141_TransformControls');
        wp_enqueue_script('vrodos_load141_PointerLockControls');
        wp_enqueue_script('vrodos_ScenePersistence');
        wp_enqueue_script('vrodos_jscolorpick');
        wp_enqueue_style('vrodos_datgui');
        wp_enqueue_style('vrodos_3D_editor');
        wp_enqueue_style('vrodos_3D_editor_browser');
        wp_enqueue_script('vrodos_html2canvas');
        wp_enqueue_script('vrodos_3d_editor_environmentals');
        wp_enqueue_script('vrodos_jscolorpick');
        wp_enqueue_script('vrodos_keyButtons');
        wp_enqueue_script('vrodos_rayCasters');
        wp_enqueue_script('vrodos_auxControlers');
        wp_enqueue_script('vrodos_BordersFinder');
        wp_enqueue_script('vrodos_LightsPawn_Loader');
        wp_enqueue_script('vrodos_LoaderMulti');
        wp_enqueue_script('vrodos_movePointerLocker');
        wp_enqueue_script('vrodos_addRemoveOne');
        wp_enqueue_script('vrodos_3d_editor_buttons_drags');
        wp_enqueue_script('vrodos_vr_editor_analytics');
        wp_enqueue_script('vrodos_fetch_asset_scenes_request');
        wp_enqueue_script('vrodos_compile_dialogue');
    }

    public function localize_edit_scene_scripts() {
        $edit_scene_page = VRodos_Core_Manager::vrodos_getEditpage('scene');
        if (!$edit_scene_page || !is_page($edit_scene_page[0]->ID)) {
            return;
        }

        $scene_data = VRodos_Scene_CPT_Manager::get_scene_dat_for_script();
        wp_localize_script('vrodos_scripts', 'vrodos_scene_data', $scene_data);
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
        $plugin_url_js = plugin_dir_url(VRODOS_PLUGIN_FILE) . 'js_libs/';

        $scripts = array(
            // General Scripts
            array('vrodos_asset_editor_scripts', $plugin_url_js . 'vrodos_asset_editor_scripts.js'),
            array('vrodos_scripts', $plugin_url_js . 'vrodos_scripts.js'),
            array('vrodos_jscolorpick', $plugin_url_js . 'external_js_libraries/jscolor.js'),
            array('vrodos_html2canvas', $plugin_url_js . 'external_js_libraries/html2canvas.min.js'),
            array('vrodos_inflate', $plugin_url_js . 'external_js_libraries/inflate.min.js'),
            array('vrodos_ScenePersistence', $plugin_url_js . 'vrodos_ScenePersistence.js'),
            array('vrodos_vr_editor_analytics', $plugin_url_js . 'vrodos_3d_editor_analytics.js'),

            // AJAX Scripts
            array('vrodos_request_compile', $plugin_url_js . 'ajaxes/vrodos_request_compile.js'),
            array('vrodos_savescene_request', $plugin_url_js . 'ajaxes/vrodos_save_scene_ajax.js'),
            array('ajax-script_delete_game', $plugin_url_js . 'ajaxes/delete_game_scene_asset.js', array('jquery')),
            array('ajax-script_collaborate_project', $plugin_url_js . 'ajaxes/collaborate_project.js', array('jquery')),
            array('ajax-script_create_game', $plugin_url_js . 'ajaxes/create_project.js', array('jquery')),

            // Command Scripts
            array('vrodos_content_interlinking_request', $plugin_url_js . 'content_interlinking_commands/content_interlinking.js'),
            array('vrodos_segmentation_request', $plugin_url_js . 'semantics_commands/segmentation.js'),
            array('vrodos_classification_request', $plugin_url_js . 'semantics_commands/classification.js'),

            // 3D Editor & Viewer Scripts
            array('vrodos_AssetViewer_3D_kernel', $plugin_url_js . 'vrodos_AssetViewer_3D_kernel.js'),
            array('vrodos_3d_editor_buttons_drags', $plugin_url_js . 'vrodos_3d_editor_buttons_drags.js', array('jquery','vrodos_addRemoveOne')),
            array('vrodos_3d_editor_environmentals', $plugin_url_js . 'vrodos_3d_editor_environmentals.js'),
            array('vrodos_keyButtons', $plugin_url_js . 'vrodos_keyButtons.js'),
            array('vrodos_rayCasters', $plugin_url_js . 'vrodos_rayCasters.js'),
            array('vrodos_auxControlers', $plugin_url_js . 'vrodos_auxControlers.js'),
            array('vrodos_BordersFinder', $plugin_url_js . 'vrodos_BordersFinder.js'),
            array('vrodos_LoaderMulti', $plugin_url_js . 'vrodos_LoaderMulti.js'),
            array('vrodos_LightsPawn_Loader', $plugin_url_js . 'vrodos_LightsPawn_Loader.js'),
            array('vrodos_movePointerLocker', $plugin_url_js . 'vrodos_movePointerLocker.js'),
            array('vrodos_addRemoveOne', $plugin_url_js . 'vrodos_addRemoveOne.js'),
            array('vrodos_HierarchyViewer', $plugin_url_js . 'vrodos_HierarchyViewer.js'),
            array('vrodos_compile_dialogue', $plugin_url_js . 'vrodos_compile_dialogue.js'),
            array('vrodos_project_manager', $plugin_url_js . 'vrodos_project_manager.js', array('ajax-script_create_game')),

            // Three.js r141
            array('vrodos_load141_threejs', $plugin_url_js . 'threejs141/three.js'),
            array('vrodos_load141_FontLoader', $plugin_url_js . 'threejs141/FontLoader.js'),
            array('vrodos_load141_TextGeometry', $plugin_url_js . 'threejs141/TextGeometry.js'),
            array('vrodos_load141_statjs', $plugin_url_js . 'threejs141/stats.js'),
            array('vrodos_load141_FBXloader', $plugin_url_js . 'threejs141/FBXLoader.js'),
            array('vrodos_load141_GLTFLoader', $plugin_url_js . 'threejs141/GLTFLoader.js'),
            array('vrodos_load141_DRACOLoader', $plugin_url_js . 'threejs141/DRACOLoader.js'),
            array('vrodos_load141_DDSLoader', $plugin_url_js . 'threejs141/DDSLoader.js'),
            array('vrodos_load141_KTXLoader', $plugin_url_js . 'threejs141/KTXLoader.js'),
            array('vrodos_load141_OrbitControls', $plugin_url_js . 'threejs141/OrbitControls.js'),
            array('vrodos_load141_TransformControls', $plugin_url_js . 'threejs141/TransformControls.js'),
            array('vrodos_load141_TrackballControls', $plugin_url_js . 'threejs141/TrackballControls.js'),
            array('vrodos_load141_PointerLockControls', $plugin_url_js . 'threejs141/PointerLockControls.js'),
            array('vrodos_load141_CSS2DRenderer', $plugin_url_js . 'threejs141/CSS2DRenderer.js'),
            array('vrodos_load141_CopyShader', $plugin_url_js . 'threejs141/CopyShader.js'),
            array('vrodos_load141_FXAAShader', $plugin_url_js . 'threejs141/FXAAShader.js'),
            array('vrodos_load141_EffectComposer', $plugin_url_js . 'threejs141/EffectComposer.js'),
            array('vrodos_load141_RenderPass', $plugin_url_js . 'threejs141/RenderPass.js'),
            array('vrodos_load141_OutlinePass', $plugin_url_js . 'threejs141/OutlinePass.js'),
            array('vrodos_load141_ShaderPass', $plugin_url_js . 'threejs141/ShaderPass.js'),
            array('vrodos_load141_RGBELoader', $plugin_url_js . 'threejs141/RGBELoader.js'),
            array('vrodos_load141_OBJLoader', $plugin_url_js . 'threejs141/OBJLoader.js'),
            array('vrodos_load141_MTLLoader', $plugin_url_js . 'threejs141/MTLLoader.js'),

            // Other Libraries
            array('vrodos_load_datgui', $plugin_url_js . 'datgui/0.7.9/dat.gui.min.js'),
            array('vrodos_material_scripts', plugin_dir_url(VRODOS_PLUGIN_FILE) . 'node_modules/material-components-web/dist/material-components-web.js'),
        );

        foreach ($scripts as $script) {
            $dependencies = isset($script[2]) ? $script[2] : array();
            wp_register_script($script[0], $script[1], $dependencies, null, false);
        }
    }

    public function register_styles() {
        $plugin_url = plugin_dir_url(VRODOS_PLUGIN_FILE);

        wp_register_style( 'vrodos_backend', $plugin_url . 'css/vrodos_backend.css' );
        wp_register_style( 'vrodos_3D_editor', $plugin_url . 'css/vrodos_3D_editor.css' );
        wp_register_style( 'vrodos_datgui', $plugin_url . 'js_libs/datgui/0.7.9/dat.gui.css' );
        wp_register_style( 'vrodos_dashboard_table', $plugin_url . 'css/vrodos_dashboard_table_style.css' );
        wp_register_style( 'vrodos_3D_editor_browser', $plugin_url . 'css/vrodos_3D_editor_browser.css' );
        wp_register_style( 'vrodos_material_stylesheet', $plugin_url . 'node_modules/material-components-web/dist/material-components-web.css' );
        wp_register_style( 'vrodos_frontend_stylesheet', $plugin_url . 'css/vrodos_frontend.css' );
        wp_register_style( 'vrodos_asseteditor_stylesheet', $plugin_url . 'css/vrodos_asseteditor.css' );
        wp_register_style( 'vrodos_widgets_stylesheet', $plugin_url . 'css/vrodos_widgets.css' );
        wp_register_style( 'vrodos_material_icons', $plugin_url . 'css/material-icons/material-icons.css' );

        wp_enqueue_script('vrodos_material_scripts');
        wp_enqueue_style('vrodos_material_icons');
        wp_enqueue_style('vrodos_backend');
        wp_enqueue_style('vrodos_dashboard_table');
    }
}
