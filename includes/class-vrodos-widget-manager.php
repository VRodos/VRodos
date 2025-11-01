<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Widget_Manager {

	public function __construct() {
		add_action( 'widgets_init', array( $this, 'vrodos_register_widgets' ) );

        // Enqueue scripts for the widget, both on the front-end and in the admin area.
        add_action('wp_enqueue_scripts', array($this, 'vrodos_widget_preamp_scripts'), 10);
		add_action('admin_enqueue_scripts', array($this, 'vrodos_widget_preamp_scripts'), 10);
	}

	public function vrodos_register_widgets() {
		require_once( plugin_dir_path( __FILE__ ) . 'vrodos-3d-widget.php' );
		register_widget( 'vrodos_3d_widget' );

		require_once( plugin_dir_path( __FILE__ ) . 'vrodos-scene-widget.php' );
		register_widget( 'vrodos_3d_widget_scene' );
	}

    public function vrodos_widget_preamp_scripts() {

        // Only enqueue scripts if one of the widgets is active to avoid unnecessary loading.
        if (!is_active_widget(false, false, 'vrodos_3d_widget', true) &&
            !is_active_widget(false, false, 'vrodos_3d_widget_scene', true) &&
            !is_admin()) {
            return;
        }

        // Do not load these scripts when on the main 3D scene editor page.
        global $template;
        if (is_string($template) && basename($template) === "vrodos-edit-3D-scene-template.php") {
            return;
        }

        // Stylesheet
        wp_enqueue_style('vrodos_widgets_stylesheet');

        // Core Three.js and loaders
        wp_enqueue_script('vrodos_load141_threejs');
        wp_enqueue_script('vrodos_load141_statjs');
        wp_enqueue_script('vrodos_load141_OBJLoader');
        wp_enqueue_script('vrodos_load141_MTLLoader');
        wp_enqueue_script('vrodos_load141_FBXloader');
        wp_enqueue_script('vrodos_load141_GLTFLoader');
        wp_enqueue_script('vrodos_load141_DRACOLoader');
        wp_enqueue_script('vrodos_load141_DDSLoader');
        wp_enqueue_script('vrodos_load141_KTXLoader');

        // Controls
        wp_enqueue_script('vrodos_load141_TrackballControls');
        wp_enqueue_script('vrodos_load141_OrbitControls');

        // Supporting scripts
        wp_enqueue_script('vrodos_inflate'); // For binary FBX
        wp_enqueue_script('vrodos_AssetViewer_3D_kernel');
        wp_enqueue_script('vrodos_scripts');

        // AJAX script for fetching asset metadata in the widget form.
        $pluginpath = dirname (plugin_dir_url( __DIR__  ));
        wp_enqueue_script( 'ajax-script_fetchasset_meta', $pluginpath.'/vrodos/js_libs/ajaxes/fetch_asset.js', array('jquery') );
        wp_localize_script( 'ajax-script_fetchasset_meta', 'my_ajax_object_fetchasset_meta',
                array( 'ajax_url' => admin_url( 'admin-ajax.php' ) )
        );

        // Scripts for the scene widget
        wp_enqueue_script('jquery-ui-draggable');
        wp_enqueue_script('vrodos_load141_CSS2DRenderer');
        wp_enqueue_script('vrodos_load141_CopyShader');
        wp_enqueue_script('vrodos_load141_FXAAShader');
        wp_enqueue_script('vrodos_load141_EffectComposer');
        wp_enqueue_script('vrodos_load141_RenderPass');
        wp_enqueue_script('vrodos_load141_OutlinePass');
        wp_enqueue_script('vrodos_load141_ShaderPass');
        wp_enqueue_script('vrodos_load141_RGBELoader');
        wp_enqueue_script('vrodos_load141_TransformControls');
        wp_enqueue_script('vrodos_load141_PointerLockControls');
        wp_enqueue_script('vrodos_ScenePersistence');
        wp_enqueue_script('vrodos_jscolorpick');
        wp_enqueue_script('vrodos_3d_editor_environmentals');
        wp_enqueue_script('vrodos_keyButtons');
        wp_enqueue_script('vrodos_rayCasters');
        wp_enqueue_script('vrodos_auxControlers');
        wp_enqueue_script('vrodos_BordersFinder');
        wp_enqueue_script('vrodos_LoaderMulti');
        wp_enqueue_script('VRodos_LightsPawn_Loader');
        wp_enqueue_script('vrodos_movePointerLocker');
        wp_enqueue_script('vrodos_addRemoveOne');
        wp_enqueue_script('vrodos_3d_editor_buttons');
        wp_enqueue_script('vrodos_vr_editor_analytics');
        wp_enqueue_script('vrodos_fetch_asset_scenes_request');
        wp_enqueue_script( 'ajax-script_fetchasset', $pluginpath.'/js_libs/ajaxes/fetch_asset.js', array('jquery') );
        wp_localize_script( 'ajax-script_fetchasset', 'my_ajax_object_fetchasset',
            array( 'ajax_url' => admin_url( 'admin-ajax.php' ) )
        );
    }
}
