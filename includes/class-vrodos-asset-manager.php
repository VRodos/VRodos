<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Asset_Manager {

	public function __construct() {
		add_action( 'wp_enqueue_scripts', $this->register_scripts(...) );
		add_action( 'admin_enqueue_scripts', $this->register_scripts(...) );
		add_action( 'wp_enqueue_scripts', $this->register_styles(...) );
		add_action( 'admin_enqueue_scripts', $this->register_styles(...) );
		add_action( 'admin_enqueue_scripts', $this->enqueue_dashboard_scripts(...) );
		add_action( 'wp_enqueue_scripts', $this->enqueue_asset_editor_scripts(...) );
		add_action( 'wp_enqueue_scripts', $this->enqueue_scene_editor_scripts(...), 999 );
		add_action( 'wp_enqueue_scripts', $this->enqueue_project_manager_scripts(...), 999 );
		add_action( 'wp_enqueue_scripts', $this->enqueue_assets_list_scripts(...) );

        // Modern stats-gl module loader
		add_filter( 'script_loader_tag', $this->filter_stats_gl_tag(...), 10, 3 );
	}

	private function is_matching_page_template( string $template ): bool {
		foreach ( VRodos_Path_Manager::page_template_meta_values( $template ) as $meta_value ) {
			if ( is_page_template( $meta_value ) || is_page_template( ltrim( $meta_value, '/' ) ) ) {
				return true;
			}
		}

		return false;
	}
	
	public function enqueue_dashboard_scripts( $hook ) {
		if ( 'toplevel_page_vrodos-plugin' !== $hook ) {
			return;
		}

		wp_enqueue_style( 'vrodos_modern_compiled' );
		wp_enqueue_script( 'lucide-icons' );
		
		// Initialize Lucide icons
		wp_add_inline_script( 'lucide-icons', 'window.addEventListener("DOMContentLoaded", function() { lucide.createIcons(); });' );
	}

	public function enqueue_assets_list_scripts() {
		if ( ! $this->is_matching_page_template( 'vrodos-assets-list-template.php' ) &&
             ! is_page( VRodos_Core_Manager::vrodos_getEditpage( 'assetslist' )[0]->ID ?? -1 ) ) {
			return;
		}

		wp_enqueue_style( 'vrodos_frontend_stylesheet' );
		wp_enqueue_style( 'vrodos_modern_compiled' );
        wp_enqueue_script( 'lucide-icons' );

		$isAdmin = is_admin() ? 'back' : 'front';
		wp_add_inline_script( 'vrodos_scripts', 'var isAdmin="' . $isAdmin . '";' );

		wp_enqueue_script( 'ajax-script_deleteasset' );
		wp_localize_script(
			'ajax-script_deleteasset',
			'my_ajax_object_deleteasset',
			['ajax_url' => admin_url( 'admin-ajax.php' )]
		);

	}

	public function enqueue_project_manager_scripts() {
		if ( ! $this->is_matching_page_template( 'vrodos-project-manager-template.php' ) &&
             ! is_page( VRodos_Core_Manager::vrodos_getEditpage( 'game' )[0]->ID ?? -1 ) ) {
			return;
		}
		wp_enqueue_script( 'ajax-script_delete_game' );
		wp_localize_script(
			'ajax-script_delete_game',
			'my_ajax_object_deletegame',
			['ajax_url' => admin_url( 'admin-ajax.php' )]
		);

		wp_enqueue_script( 'ajax-script_create_game' );
		wp_localize_script(
			'ajax-script_create_game',
			'my_ajax_object_creategame',
			['ajax_url' => admin_url( 'admin-ajax.php' )]
		);

		wp_enqueue_script( 'ajax-script_rename_game' );

		wp_enqueue_script( 'vrodos_project_manager' );

		wp_enqueue_style( 'vrodos_frontend_stylesheet' );
		wp_enqueue_style( 'vrodos_modern_compiled' );
        wp_enqueue_script( 'lucide-icons' );

		$user                = wp_get_current_user();
		$perma_structure     = (bool) get_option( 'permalink_structure' );
		$parameter_Scenepass = $perma_structure ? '?vrodos_scene=' : '&vrodos_scene=';
		$isAdmin             = is_admin() ? 'back' : 'front';
		wp_localize_script(
			'vrodos_project_manager',
			'vrodos_project_manager_data',
			['current_user_id'     => $user->ID, 'parameter_Scenepass' => $parameter_Scenepass, 'isAdmin'             => $isAdmin]
		);
	}

	public function enqueue_scene_editor_scripts() {
		$edit_scene_page = VRodos_Core_Manager::vrodos_getEditpage( 'scene' );
		if ( ! $edit_scene_page || ! is_page( $edit_scene_page[0]->ID ) ) {
			return;
		}

		// Styles
		wp_enqueue_style( 'vrodos_frontend_stylesheet' );
		wp_enqueue_style( 'vrodos_modern_compiled' );
		wp_enqueue_script( 'lucide-icons' );
		wp_enqueue_style( 'vrodos_lilgui' );
		wp_enqueue_style( 'vrodos_3D_editor' );
		wp_enqueue_style( 'vrodos_3D_editor_browser' );

		// Scripts from original enqueue_scene_editor_scripts
		wp_enqueue_script( 'vrodos_namespace' );
		wp_enqueue_script( 'vrodos_scripts' );
		wp_enqueue_script( 'vrodos_UndoEngine' );
		wp_enqueue_script( 'stats-gl' );
		$this->enqueue_three_vendor_bundle();
		wp_enqueue_script( 'vrodos_icons' );
		wp_enqueue_script( 'vrodos_HierarchyViewer' );
		wp_enqueue_script( 'vrodos_load_lilgui' );
		wp_enqueue_script( 'vrodos_scene_settings_schema' );
		wp_enqueue_script( 'vrodos_ScenePersistence' );
		wp_enqueue_script( 'vrodos_3d_editor_environmentals' );
		wp_enqueue_script( 'vrodos_keyButtons' );
		wp_enqueue_script( 'vrodos_rayCasters' );
		wp_enqueue_script( 'vrodos_auxControlers' );
		wp_enqueue_script( 'vrodos_BordersFinder' );
		wp_enqueue_script( 'vrodos_LightsPawn_Loader' );
		wp_enqueue_script( 'vrodos_LoaderMulti' );
		wp_enqueue_script( 'vrodos_movePointerLocker' );
		wp_enqueue_script( 'vrodos_addRemoveOne' );
		wp_enqueue_script( 'vrodos_3d_editor_buttons_drags' );
		wp_enqueue_script( 'vrodos_fetch_asset_scenes_request' );
		wp_enqueue_script( 'vrodos_compile_dialogue' );

		// Prepare all data for localization
		$template_data = VRodos_Scene_CPT_Manager::prepare_scene_editor_data();
		$scene_data    = VRodos_Scene_CPT_Manager::get_scene_dat_for_script();

		// Scripts & Localization from template
		wp_enqueue_script( 'ajax-script_compile' );
		wp_localize_script(
			'ajax-script_compile',
			'my_ajax_object_compile',
			['ajax_url'  => admin_url( 'admin-ajax.php' ), 'projectId' => $template_data['project_id'], 'slug'      => $template_data['projectSlug'], 'sceneId'   => $template_data['current_scene_id']]
		);

		wp_enqueue_script( 'ajax-script_deletescene' );
		wp_localize_script(
			'ajax-script_deletescene',
			'my_ajax_object_deletescene',
			['ajax_url' => admin_url( 'admin-ajax.php' )]
		);

		wp_enqueue_script( 'ajax-script_filebrowse' );
		wp_localize_script( 'ajax-script_filebrowse', 'my_ajax_object_fbrowse', ['ajax_url' => admin_url( 'admin-ajax.php' )] );

		wp_enqueue_script( 'ajax-script_savescene' );
		wp_localize_script(
			'ajax-script_savescene',
			'my_ajax_object_savescene',
			['ajax_url' => admin_url( 'admin-ajax.php' ), 'scene_id' => $template_data['current_scene_id']]
		);

		wp_enqueue_script( 'ajax-script_uploadimage' );
		wp_localize_script(
			'ajax-script_uploadimage',
			'my_ajax_object_uploadimage',
			['ajax_url' => admin_url( 'admin-ajax.php' ), 'scene_id' => $template_data['current_scene_id']]
		);

		wp_enqueue_script( 'ajax-script_deleteasset' );
		wp_localize_script(
			'ajax-script_deleteasset',
			'my_ajax_object_deleteasset',
			['ajax_url' => admin_url( 'admin-ajax.php' )]
		);

		wp_enqueue_script( 'ajax-script_fetchasset' );
		wp_localize_script(
			'ajax-script_fetchasset',
			'my_ajax_object_fetchasset',
			['ajax_url' => admin_url( 'admin-ajax.php' )]
		);

		$localized_data = [
			'scene_data'          => $scene_data,
			'pluginPath'          => $template_data['pluginpath'],
			'paths'               => VRodos_Path_Manager::frontend_paths(),
			'uploadDir'           => $template_data['upload_url'],
			'projectId'           => $template_data['project_id'],
			'projectSlug'         => $template_data['projectSlug'],
			'isAdmin'             => $template_data['isAdmin'],
			'isUserAdmin'         => $template_data['is_user_admin'],
			'urlforAssetEdit'     => $template_data['urlforAssetEdit'],
			'scene_id'            => $template_data['current_scene_id'],
			'game_type'           => strtolower( (string) $template_data['project_type'] ),
			'is_immerse_project' => ! empty( $template_data['is_immerse_project'] ),
			'user_email'          => $template_data['user_email'],
			'current_user_id'     => $template_data['current_user_id'],
			'siteurl'             => site_url(),
			// Phase 2 localization
			'upload_image_nonce'  => wp_create_nonce( 'vrodos_scene_upload_image_nonce' ),
			'isPaused'            => false,
			'isAnyLight'          => true,
			'mapActions'          => new stdClass(),
			'showPawnPositions'   => "false",
			'sceneType'           => get_post_meta( $template_data['current_scene_id'], 'vrodos_scene_environment', true ) ?: ''
		];

		wp_localize_script( 'vrodos_scripts', 'vrodos_data', $localized_data );

		// Editor Initialization module (Phase 2)
		wp_enqueue_script( 'vrodos_EditorInitializer' );

		// Media
		if ( $template_data['current_scene_id'] ) {
			wp_enqueue_media( ['post' => $template_data['current_scene_id']] );
		}
	}

	public function enqueue_asset_editor_scripts() {

		$asset_editor_page = VRodos_Core_Manager::vrodos_getEditpage( 'asset' );
		if ( ! $asset_editor_page || ! is_page( $asset_editor_page[0]->ID ) ) {
			return;
		}

		// Styles
		wp_enqueue_style( 'vrodos_frontend_stylesheet' );
		wp_enqueue_style( 'vrodos_asseteditor_stylesheet' );
		wp_enqueue_style( 'vrodos_modern_compiled' );
		wp_enqueue_script( 'lucide-icons' );

		// Three js : for simple rendering
		wp_enqueue_script( 'vrodos_scripts' );

		// 1. Three js library
		$this->enqueue_three_vendor_bundle();

		// Load single asset: Load existing asset
		wp_enqueue_script( 'vrodos_AssetViewer_3D_kernel' );
		wp_enqueue_script( 'stats-gl' );

		// Load scripts for asset editor
		wp_enqueue_script( 'vrodos_asset_editor_scripts' );
	}

	public function register_scripts() {
		$three_vendor_dir    = VRodos_Render_Runtime_Manager::get_three_vendor_dir();
		$three_vendor_bundle = VRodos_Render_Runtime_Manager::get_three_vendor_bundle();

		$scripts = [
      // Foundation
      ['vrodos_namespace', VRodos_Path_Manager::editor_js_url( 'vrodos_namespace.js' )],
      // General Scripts
      ['vrodos_asset_editor_scripts', VRodos_Path_Manager::editor_js_url( 'vrodos_asset_editor_scripts.js' )],
      ['vrodos_scripts', VRodos_Path_Manager::editor_js_url( 'vrodos_scripts.js' )],
      ['vrodos_UndoEngine', VRodos_Path_Manager::editor_js_url( 'vrodos_UndoEngine.js' )],
      ['vrodos_scene_settings_schema', VRodos_Path_Manager::editor_js_url( 'vrodos_scene_settings_schema.js' )],
      ['vrodos_ScenePersistence', VRodos_Path_Manager::editor_js_url( 'vrodos_ScenePersistence.js' ), ['vrodos_scene_settings_schema']],
      ['stats-gl', 'https://cdn.jsdelivr.net/npm/stats-gl@2.2.8/dist/main.js'],
      // AJAX Scripts
      ['ajax-script_compile', VRodos_Path_Manager::editor_ajax_js_url( 'vrodos_request_compile.js' ), ['vrodos_namespace']],
      ['ajax-script_deletescene', VRodos_Path_Manager::editor_ajax_js_url( 'delete_scene.js' ), ['vrodos_namespace']],
      ['ajax-script_filebrowse', VRodos_Path_Manager::editor_js_url( 'vrodos_assetBrowserToolbar.js' ), ['vrodos_namespace']],
      ['ajax-script_savescene', VRodos_Path_Manager::editor_ajax_js_url( 'vrodos_save_scene_ajax.js' ), ['vrodos_namespace']],
      ['ajax-script_uploadimage', VRodos_Path_Manager::editor_ajax_js_url( 'uploadimage.js' ), ['vrodos_namespace']],
      ['ajax-script_fetchasset', VRodos_Path_Manager::editor_ajax_js_url( 'fetch_asset.js' ), ['vrodos_namespace']],
      ['ajax-script_delete_game', VRodos_Path_Manager::editor_ajax_js_url( 'delete_game_scene_asset.js' ), ['vrodos_namespace']],
      ['ajax-script_deleteasset', VRodos_Path_Manager::editor_ajax_js_url( 'delete_asset.js' ), ['vrodos_namespace']],
      ['ajax-script_create_game', VRodos_Path_Manager::editor_ajax_js_url( 'create_project.js' ), ['vrodos_namespace']],
      ['ajax-script_rename_game', VRodos_Path_Manager::editor_ajax_js_url( 'rename_project.js' ), ['vrodos_namespace']],
      // 3D Editor & Viewer Scripts
      ['vrodos_AssetViewer_3D_kernel', VRodos_Path_Manager::editor_js_url( 'vrodos_AssetViewer_3D_kernel.js' )],
      ['vrodos_3d_editor_buttons_drags', VRodos_Path_Manager::editor_js_url( 'vrodos_3d_editor_buttons_drags.js' ), ['vrodos_addRemoveOne']],
      ['vrodos_3d_editor_environmentals', VRodos_Path_Manager::editor_js_url( 'vrodos_3d_editor_environmentals.js' )],
      ['vrodos_keyButtons', VRodos_Path_Manager::editor_js_url( 'vrodos_keyButtons.js' )],
      ['vrodos_rayCasters', VRodos_Path_Manager::editor_js_url( 'vrodos_rayCasters.js' )],
      ['vrodos_auxControlers', VRodos_Path_Manager::editor_js_url( 'vrodos_auxControlers.js' )],
      ['vrodos_BordersFinder', VRodos_Path_Manager::editor_js_url( 'vrodos_BordersFinder.js' )],
      ['vrodos_LoaderMulti', VRodos_Path_Manager::editor_js_url( 'vrodos_LoaderMulti.js' ), ['vrodos_scene_settings_schema']],
      ['vrodos_LightsPawn_Loader', VRodos_Path_Manager::editor_js_url( 'vrodos_LightsPawn_Loader.js' )],
      ['vrodos_movePointerLocker', VRodos_Path_Manager::editor_js_url( 'vrodos_movePointerLocker.js' )],
      ['vrodos_addRemoveOne', VRodos_Path_Manager::editor_js_url( 'vrodos_addRemoveOne.js' )],
      ['vrodos_icons', VRodos_Path_Manager::editor_js_url( 'vrodos_icons.js' )],
      ['vrodos_HierarchyViewer', VRodos_Path_Manager::editor_js_url( 'vrodos_HierarchyViewer.js' )],
      ['vrodos_CompileUI_Shared', VRodos_Path_Manager::editor_js_url( 'vrodos_CompileUI_Shared.js' )],
      ['vrodos_CompileUI_General', VRodos_Path_Manager::editor_js_url( 'vrodos_CompileUI_General.js' ), ['vrodos_CompileUI_Shared']],
      ['vrodos_CompileUI_PostFX', VRodos_Path_Manager::editor_js_url( 'vrodos_CompileUI_PostFX.js' ), ['vrodos_CompileUI_Shared']],
      ['vrodos_CompileUI_Atmosphere', VRodos_Path_Manager::editor_js_url( 'vrodos_CompileUI_Atmosphere.js' ), ['vrodos_CompileUI_Shared']],
      ['vrodos_compile_dialogue', VRodos_Path_Manager::editor_js_url( 'vrodos_compile_dialogue.js' ), ['vrodos_CompileUI_Shared', 'vrodos_CompileUI_General', 'vrodos_CompileUI_PostFX', 'vrodos_CompileUI_Atmosphere']],
      ['vrodos_project_manager', VRodos_Path_Manager::editor_js_url( 'vrodos_project_manager.js' ), ['vrodos_namespace', 'ajax-script_create_game', 'ajax-script_rename_game']],
      ['vrodos_EditorInitializer', VRodos_Path_Manager::editor_js_url( 'vrodos_EditorInitializer.js' ), ['vrodos_scripts', 'vrodos_scene_settings_schema', 'vrodos_ScenePersistence', 'vrodos_LoaderMulti', 'vrodos_3d_editor_environmentals', 'vrodos_addRemoveOne', 'vrodos_3d_editor_buttons_drags']],
      // Active Three vendor bundle paired with the pinned A-Frame runtime.
      ['vrodos_three_vendor_bundle', VRodos_Path_Manager::vendor_url( $three_vendor_dir . '/' . $three_vendor_bundle )],
      // Other Libraries
      ['vrodos_load_lilgui', 'https://unpkg.com/lil-gui@0.19.2/dist/lil-gui.umd.js'],
      ['lucide-icons', 'https://unpkg.com/lucide@0.469.0'],
  ];

		foreach ( $scripts as $script ) {
			$dependencies = $script[2] ?? [];
			wp_register_script( $script[0], $script[1], $dependencies, null, false );
		}
	}

	public function register_styles() {
		wp_register_style( 'vrodos_backend', VRodos_Path_Manager::css_url( 'admin/vrodos_backend.css' ) );
		wp_register_style( 'vrodos_3D_editor', VRodos_Path_Manager::css_url( 'editor/vrodos_3D_editor.css' ) );
		wp_register_style( 'vrodos_lilgui', 'https://unpkg.com/lil-gui@0.19.2/dist/lil-gui.esm.css' );
		wp_register_style( 'vrodos_dashboard_table', VRodos_Path_Manager::css_url( 'admin/vrodos_dashboard_table_style.css' ) );
		wp_register_style( 'vrodos_3D_editor_browser', VRodos_Path_Manager::css_url( 'editor/vrodos_3D_editor_browser.css' ) );
		wp_register_style( 'vrodos_frontend_stylesheet', VRodos_Path_Manager::css_url( 'frontend/vrodos_frontend.css' ) );
		wp_register_style( 'vrodos_asseteditor_stylesheet', VRodos_Path_Manager::css_url( 'editor/vrodos_asseteditor.css' ) );
		wp_register_style( 'vrodos_modern_compiled', VRodos_Path_Manager::css_url( 'vrodos_modern_compiled.css' ) );
		wp_register_style( 'vrodos_runtime', VRodos_Path_Manager::css_url( 'runtime/vrodos_runtime.css' ) );
	}

	private function enqueue_three_vendor_bundle(): void {
		wp_enqueue_script( 'vrodos_three_vendor_bundle' );

		$runtime_config = VRodos_Render_Runtime_Manager::get_config();
		$three_vendor_dir = (string) ( $runtime_config['three_vendor_dir'] ?? VRodos_Render_Runtime_Manager::get_three_vendor_dir() );
		$three_vendor_base = VRodos_Path_Manager::vendor_url( $three_vendor_dir . '/' );
		$inline_script = 'window.vrodos_three_vendor_dir = ' . wp_json_encode( $three_vendor_dir ) . ';'
			. 'window.vrodos_three_vendor_base = ' . wp_json_encode( $three_vendor_base ) . ';'
			. 'window.vrodos_three_decoder_path = ' . wp_json_encode( $three_vendor_base . 'draco/' ) . ';'
			. 'window.vrodos_three_font_path = ' . wp_json_encode( $three_vendor_base . 'fonts/helvetiker_bold.typeface.json' ) . ';'
			. 'window.vrodos_render_runtime = ' . wp_json_encode( $runtime_config ) . ';';
		wp_add_inline_script( 'vrodos_three_vendor_bundle', $inline_script, 'before' );
	}

	/**
	 * Filters the script tag for stats-gl to load it as a module and assign to window.Stats.
	 */
	public function filter_stats_gl_tag( $tag, $handle, $src ) {
		if ( 'stats-gl' !== $handle ) {
			return $tag;
		}

		// Use a module loader to safely import and assign to window.Stats with fallback
		return sprintf(
			'<script type="module">
                import("%1$s")
                    .then(m => { window.Stats = m.default; })
                    .catch(e => { console.warn("VRodos Error: stats-gl failed to load from CDN. Scene will continue without performance overlay.", e); });
            </script>',
			esc_url( $src )
		);
	}
}
