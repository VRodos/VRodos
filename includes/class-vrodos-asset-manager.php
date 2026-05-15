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
		add_action( 'admin_enqueue_scripts', $this->enqueue_asset_admin_scripts(...) );

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

	private function enqueue_script_handles( array $handles ): void {
		foreach ( $handles as $handle ) {
			wp_enqueue_script( $handle );
		}
	}
	
	public function enqueue_dashboard_scripts( $hook ) {
		if ( 'toplevel_page_vrodos-plugin' !== $hook ) {
			return;
		}

		wp_enqueue_style( 'vrodos_modern_compiled' );
		wp_enqueue_script( 'lucide-icons' );
		wp_enqueue_script( 'vrodos_dashboard_assets' );
		wp_localize_script(
			'vrodos_dashboard_assets',
			'vrodosDashboardAssets',
			[
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'nonce'   => wp_create_nonce( 'vrodos_dashboard_asset_actions' ),
			]
		);
		
		// Initialize Lucide icons
		wp_add_inline_script( 'lucide-icons', 'window.addEventListener("DOMContentLoaded", function() { lucide.createIcons(); });' );
	}

	public function enqueue_asset_admin_scripts( $hook ): void {
		if ( ! in_array( $hook, [ 'post.php', 'post-new.php' ], true ) ) {
			return;
		}

		$screen = get_current_screen();
		if ( ! $screen || $screen->post_type !== 'vrodos_asset3d' ) {
			return;
		}

		wp_enqueue_style( 'vrodos_backend' );
		$this->enqueue_three_vendor_bundle();
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
		wp_enqueue_script( 'vrodos_namespace' );
		wp_add_inline_script( 'vrodos_namespace', 'var isAdmin="' . $isAdmin . '";', 'before' );

		wp_enqueue_script( 'ajax-script_deleteasset' );
		wp_localize_script(
			'vrodos_namespace',
			'vrodos_api_config',
			[
                'ajax_url' => admin_url( 'admin-ajax.php' ),
                'isAdmin'  => $isAdmin
            ]
		);

	}

	public function enqueue_project_manager_scripts() {
		if ( ! $this->is_matching_page_template( 'vrodos-project-manager-template.php' ) &&
             ! is_page( VRodos_Core_Manager::vrodos_getEditpage( 'game' )[0]->ID ?? -1 ) ) {
			return;
		}
		wp_enqueue_script( 'ajax-script_delete_game' );
		wp_enqueue_script( 'ajax-script_create_game' );
		wp_enqueue_script( 'ajax-script_rename_game' );
		wp_enqueue_script( 'vrodos_project_manager' );

		wp_enqueue_style( 'vrodos_frontend_stylesheet' );
		wp_enqueue_style( 'vrodos_modern_compiled' );
        wp_enqueue_script( 'lucide-icons' );

		$user                = wp_get_current_user();
		$perma_structure     = (bool) get_option( 'permalink_structure' );
		$parameter_Scenepass = $perma_structure ? '?vrodos_scene=' : '&vrodos_scene=';
		$isAdmin             = is_admin() ? 'back' : 'front';
		wp_enqueue_script( 'vrodos_namespace' );
		wp_localize_script(
			'vrodos_namespace',
			'vrodos_api_config',
			[
                'ajax_url'            => admin_url( 'admin-ajax.php' ),
                'current_user_id'     => $user->ID,
                'parameter_Scenepass' => $parameter_Scenepass,
                'isAdmin'             => $isAdmin
            ]
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

		$scene_editor_foundation_handles = [
			'vrodos_namespace',
			'vrodos_scene_light_artifacts',
			'vrodos_editor_core_utils',
			'vrodos_editor_diagnostics',
			'vrodos_scripts',
			'vrodos_UndoEngine',
			'stats-gl',
		];
		$this->enqueue_script_handles( $scene_editor_foundation_handles );

		$this->enqueue_three_vendor_bundle();

		$scene_editor_runtime_handles = [
			'vrodos_icons',
			'vrodos_cefr_badges',
			'vrodos_HierarchyViewer',
			'vrodos_load_lilgui',
			'vrodos_scene_settings_schema',
			'vrodos_scene_settings_sync',
			'vrodos_ScenePersistence',
			'vrodos_editor_environment_helpers',
			'vrodos_editor_performance_profile',
			'vrodos_editor_renderer_lifecycle',
			'vrodos_editor_cameras',
			'vrodos_editor_director_helpers',
			'vrodos_editor_scene_environment',
			'vrodos_editor_environment_bootstrap',
			'vrodos_3d_editor_environmentals',
			'vrodos_scene_registry',
			'vrodos_scene_transforms',
			'vrodos_scene_selection',
			'vrodos_scene_object_factory',
			'vrodos_editor_services',
			'vrodos_editor_render_loop',
			'vrodos_keyButtons',
			'vrodos_rayCasters',
			'vrodos_auxControlers',
			'vrodos_BordersFinder',
			'vrodos_loader_object_factories',
			'vrodos_loader_resource_metadata',
			'vrodos_loader_scene_asset_helpers',
			'vrodos_loader_light_assets',
			'vrodos_loader_pawn_assets',
			'vrodos_LightsPawn_Loader',
			'vrodos_loader_director_camera',
			'vrodos_loader_generated_assets',
			'vrodos_loader_glb_assets',
			'vrodos_LoaderMulti',
			'vrodos_loader_scene_lifecycle',
			'vrodos_movePointerLocker',
			'vrodos_scene_disposal',
			'vrodos_addRemoveOne',
			'vrodos_ui_helpers',
			'vrodos_scene_snapshot_ui',
			'vrodos_scene_canvas_drop_ui',
			'vrodos_scene_canvas_events_ui',
			'vrodos_scene_list_ui',
			'vrodos_floating_panels',
			'vrodos_editor_shell_ui',
			'vrodos_editor_toolbar_ui',
			'vrodos_compile_dialog_ui',
			'vrodos_3d_editor_buttons_drags',
			'vrodos_scene_editor_ui_controller',
			'vrodos_fetch_asset_scenes_request',
			'vrodos_compile_dialogue',
		];
		$this->enqueue_script_handles( $scene_editor_runtime_handles );

		// Prepare all data for localization
		$template_data = VRodos_Scene_CPT_Manager::prepare_scene_editor_data();
		$scene_data    = VRodos_Scene_CPT_Manager::get_scene_dat_for_script();

		// Scripts & Localization from template
		$this->enqueue_script_handles(
			[
				'ajax-script_compile',
				'ajax-script_deletescene',
				'ajax-script_filebrowse',
				'ajax-script_savescene',
				'ajax-script_uploadimage',
				'ajax-script_deleteasset',
				'ajax-script_fetchasset',
			]
		);

        wp_localize_script(
            'vrodos_namespace',
            'vrodos_api_config',
            [
                'ajax_url'  => admin_url( 'admin-ajax.php' ),
                'projectId' => $template_data['project_id'],
                'slug'      => $template_data['projectSlug'],
                'sceneId'   => $template_data['current_scene_id'],
                'isAdmin'   => $template_data['isAdmin']
            ]
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
		wp_enqueue_script( 'vrodos_namespace' );
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
      ['vrodos_scene_light_artifacts', VRodos_Path_Manager::editor_js_url( 'scene/vrodos_scene_light_artifacts.js' ), ['vrodos_namespace', 'vrodos_three_vendor_bundle']],
      ['vrodos_editor_core_utils', VRodos_Path_Manager::editor_js_url( 'core/vrodos_editor_core_utils.js' ), ['vrodos_namespace']],
      ['vrodos_editor_diagnostics', VRodos_Path_Manager::editor_js_url( 'core/vrodos_editor_diagnostics.js' ), ['vrodos_namespace', 'vrodos_editor_core_utils']],
      ['vrodos_runtime_settings_contract', VRodos_Path_Manager::runtime_master_url( 'lib/vrodos-runtime-settings-contract.generated.js' ), ['vrodos_namespace']],
      // General Scripts
      ['vrodos_asset_editor_scripts', VRodos_Path_Manager::editor_js_url( 'vrodos_asset_editor_scripts.js' ), ['vrodos_namespace']],
      ['vrodos_scripts', VRodos_Path_Manager::editor_js_url( 'core/vrodos_editor_legacy_helpers.js' ), ['vrodos_namespace', 'vrodos_editor_core_utils']],
      ['vrodos_UndoEngine', VRodos_Path_Manager::editor_js_url( 'scene/vrodos_undo_engine.js' ), ['vrodos_namespace', 'vrodos_ScenePersistence', 'vrodos_scene_light_artifacts', 'vrodos_scene_disposal']],
      ['vrodos_scene_settings_schema', VRodos_Path_Manager::editor_js_url( 'scene/vrodos_scene_settings_schema.js' ), ['vrodos_namespace', 'vrodos_runtime_settings_contract']],
      ['vrodos_scene_settings_sync', VRodos_Path_Manager::editor_js_url( 'scene/vrodos_scene_settings_sync.js' ), ['vrodos_namespace', 'vrodos_scene_settings_schema']],
      ['vrodos_ScenePersistence', VRodos_Path_Manager::editor_js_url( 'scene/vrodos_scene_persistence.js' ), ['vrodos_namespace', 'vrodos_editor_core_utils', 'vrodos_scene_settings_schema']],
      ['stats-gl', 'https://cdn.jsdelivr.net/npm/stats-gl@2.2.8/dist/main.js'],
      // AJAX Scripts
      ['ajax-script_compile', VRodos_Path_Manager::editor_ajax_js_url( 'vrodos_request_compile.js' ), ['vrodos_namespace']],
      ['ajax-script_deletescene', VRodos_Path_Manager::editor_ajax_js_url( 'delete_scene.js' ), ['vrodos_namespace']],
      ['ajax-script_filebrowse', VRodos_Path_Manager::editor_js_url( 'ui/vrodos_asset_browser_toolbar.js' ), ['vrodos_namespace', 'vrodos_editor_core_utils', 'vrodos_cefr_badges']],
      ['ajax-script_savescene', VRodos_Path_Manager::editor_ajax_js_url( 'vrodos_save_scene_ajax.js' ), ['vrodos_namespace', 'vrodos_ScenePersistence']],
      ['ajax-script_uploadimage', VRodos_Path_Manager::editor_ajax_js_url( 'uploadimage.js' ), ['vrodos_namespace', 'ajax-script_savescene']],
      ['ajax-script_fetchasset', VRodos_Path_Manager::editor_ajax_js_url( 'fetch_asset.js' ), ['vrodos_namespace']],
      ['ajax-script_delete_game', VRodos_Path_Manager::editor_ajax_js_url( 'delete_game_scene_asset.js' ), ['vrodos_namespace']],
      ['ajax-script_deleteasset', VRodos_Path_Manager::editor_ajax_js_url( 'delete_asset.js' ), ['vrodos_namespace']],
      ['ajax-script_create_game', VRodos_Path_Manager::editor_ajax_js_url( 'create_project.js' ), ['vrodos_namespace']],
      ['ajax-script_rename_game', VRodos_Path_Manager::editor_ajax_js_url( 'rename_project.js' ), ['vrodos_namespace']],
      // 3D Editor & Viewer Scripts
      ['vrodos_AssetViewer_3D_kernel', VRodos_Path_Manager::editor_js_url( 'vrodos_AssetViewer_3D_kernel.js' ), ['vrodos_namespace']],
      ['vrodos_3d_editor_buttons_drags', VRodos_Path_Manager::editor_js_url( 'ui/vrodos_editor_buttons_drags_compat.js' ), ['vrodos_namespace', 'vrodos_scene_editor_ui_controller']],
      ['vrodos_scene_editor_ui_controller', VRodos_Path_Manager::editor_js_url( 'ui/vrodos_scene_editor_ui_controller.js' ), ['vrodos_namespace', 'vrodos_compile_dialog_ui', 'vrodos_editor_shell_ui', 'vrodos_scene_list_ui', 'vrodos_scene_snapshot_ui', 'vrodos_floating_panels', 'vrodos_editor_toolbar_ui', 'vrodos_scene_canvas_events_ui']],
      ['vrodos_editor_environment_helpers', VRodos_Path_Manager::editor_js_url( 'render/vrodos_editor_environment_helpers.js' ), ['vrodos_namespace', 'vrodos_editor_core_utils']],
      ['vrodos_editor_performance_profile', VRodos_Path_Manager::editor_js_url( 'render/vrodos_editor_performance_profile.js' ), ['vrodos_namespace', 'vrodos_editor_environment_helpers']],
      ['vrodos_editor_renderer_lifecycle', VRodos_Path_Manager::editor_js_url( 'render/vrodos_editor_renderer_lifecycle.js' ), ['vrodos_namespace', 'vrodos_editor_environment_helpers', 'vrodos_editor_performance_profile']],
      ['vrodos_editor_cameras', VRodos_Path_Manager::editor_js_url( 'render/vrodos_editor_cameras.js' ), ['vrodos_namespace', 'vrodos_editor_environment_helpers', 'vrodos_editor_renderer_lifecycle', 'vrodos_three_vendor_bundle']],
      ['vrodos_editor_director_helpers', VRodos_Path_Manager::editor_js_url( 'render/vrodos_editor_director_helpers.js' ), ['vrodos_namespace', 'vrodos_editor_environment_helpers', 'vrodos_three_vendor_bundle']],
      ['vrodos_editor_scene_environment', VRodos_Path_Manager::editor_js_url( 'render/vrodos_editor_scene_environment.js' ), ['vrodos_namespace', 'vrodos_editor_environment_helpers', 'vrodos_editor_director_helpers', 'vrodos_three_vendor_bundle']],
      ['vrodos_editor_environment_bootstrap', VRodos_Path_Manager::editor_js_url( 'render/vrodos_editor_environment_bootstrap.js' ), ['vrodos_namespace', 'vrodos_editor_environment_helpers', 'vrodos_editor_performance_profile', 'vrodos_editor_renderer_lifecycle', 'vrodos_editor_cameras', 'vrodos_editor_director_helpers', 'vrodos_editor_scene_environment', 'vrodos_three_vendor_bundle']],
      ['vrodos_3d_editor_environmentals', VRodos_Path_Manager::editor_js_url( 'render/vrodos_editor_environmentals.js' ), ['vrodos_namespace', 'vrodos_editor_environment_bootstrap']],
      ['vrodos_scene_registry', VRodos_Path_Manager::editor_js_url( 'scene/vrodos_scene_registry.js' ), ['vrodos_namespace', 'vrodos_editor_core_utils', 'vrodos_three_vendor_bundle']],
      ['vrodos_scene_transforms', VRodos_Path_Manager::editor_js_url( 'scene/vrodos_scene_transforms.js' ), ['vrodos_namespace', 'vrodos_scene_light_artifacts', 'vrodos_scene_registry', 'vrodos_three_vendor_bundle']],
      ['vrodos_scene_selection', VRodos_Path_Manager::editor_js_url( 'scene/vrodos_scene_selection.js' ), ['vrodos_namespace', 'vrodos_editor_core_utils', 'vrodos_scene_light_artifacts', 'vrodos_scene_registry', 'vrodos_scene_transforms', 'vrodos_three_vendor_bundle']],
      ['vrodos_scene_object_factory', VRodos_Path_Manager::editor_js_url( 'scene/vrodos_scene_object_factory.js' ), ['vrodos_namespace', 'vrodos_scene_registry', 'vrodos_scene_selection']],
      ['vrodos_editor_services', VRodos_Path_Manager::editor_js_url( 'scene/vrodos_editor_services_compat.js' ), ['vrodos_namespace', 'vrodos_scene_registry', 'vrodos_scene_transforms', 'vrodos_scene_selection', 'vrodos_scene_object_factory', 'vrodos_three_vendor_bundle']],
      ['vrodos_editor_render_loop', VRodos_Path_Manager::editor_js_url( 'render/vrodos_editor_render_loop.js' ), ['vrodos_namespace', 'vrodos_editor_services']],
      ['vrodos_keyButtons', VRodos_Path_Manager::editor_js_url( 'ui/vrodos_keyboard_controls.js' ), ['vrodos_namespace', 'vrodos_editor_environment_helpers', 'vrodos_three_vendor_bundle']],
      ['vrodos_rayCasters', VRodos_Path_Manager::editor_js_url( 'scene/vrodos_scene_raycasting.js' ), ['vrodos_namespace', 'vrodos_scene_light_artifacts', 'vrodos_editor_services']],
      ['vrodos_auxControlers', VRodos_Path_Manager::editor_js_url( 'ui/vrodos_property_controls.js' ), ['vrodos_namespace', 'vrodos_editor_core_utils', 'vrodos_scene_light_artifacts', 'vrodos_editor_services']],
      ['vrodos_BordersFinder', VRodos_Path_Manager::editor_js_url( 'scene/vrodos_scene_bounds.js' ), ['vrodos_namespace', 'vrodos_scene_registry', 'vrodos_three_vendor_bundle']],
      ['vrodos_loader_object_factories', VRodos_Path_Manager::editor_js_url( 'loaders/vrodos_loader_object_factories.js' ), ['vrodos_namespace', 'vrodos_editor_core_utils', 'vrodos_three_vendor_bundle']],
      ['vrodos_loader_scene_asset_helpers', VRodos_Path_Manager::editor_js_url( 'loaders/vrodos_loader_scene_asset_helpers.js' ), ['vrodos_namespace', 'vrodos_editor_core_utils', 'vrodos_loader_object_factories', 'vrodos_editor_services']],
      ['vrodos_loader_light_assets', VRodos_Path_Manager::editor_js_url( 'loaders/vrodos_loader_light_assets.js' ), ['vrodos_namespace', 'vrodos_loader_scene_asset_helpers', 'vrodos_scene_light_artifacts', 'vrodos_editor_services', 'vrodos_three_vendor_bundle']],
      ['vrodos_loader_pawn_assets', VRodos_Path_Manager::editor_js_url( 'loaders/vrodos_loader_pawn_assets.js' ), ['vrodos_namespace', 'vrodos_loader_scene_asset_helpers', 'vrodos_three_vendor_bundle']],
      ['vrodos_loader_resource_metadata', VRodos_Path_Manager::editor_js_url( 'loaders/vrodos_loader_resource_metadata.js' ), ['vrodos_namespace', 'vrodos_editor_core_utils', 'vrodos_scene_settings_sync', 'vrodos_editor_services']],
      ['vrodos_loader_director_camera', VRodos_Path_Manager::editor_js_url( 'loaders/vrodos_loader_director_camera.js' ), ['vrodos_namespace', 'vrodos_loader_object_factories', 'vrodos_editor_services', 'vrodos_three_vendor_bundle']],
      ['vrodos_loader_generated_assets', VRodos_Path_Manager::editor_js_url( 'loaders/vrodos_loader_generated_assets.js' ), ['vrodos_namespace', 'vrodos_editor_core_utils', 'vrodos_loader_object_factories', 'vrodos_editor_services', 'vrodos_three_vendor_bundle']],
      ['vrodos_loader_glb_assets', VRodos_Path_Manager::editor_js_url( 'loaders/vrodos_loader_glb_assets.js' ), ['vrodos_namespace', 'vrodos_editor_core_utils', 'vrodos_loader_object_factories', 'vrodos_editor_services', 'vrodos_three_vendor_bundle']],
      ['vrodos_LoaderMulti', VRodos_Path_Manager::editor_js_url( 'loaders/vrodos_loader_multi.js' ), ['vrodos_namespace', 'vrodos_editor_core_utils', 'vrodos_loader_object_factories', 'vrodos_loader_resource_metadata', 'vrodos_loader_director_camera', 'vrodos_loader_generated_assets', 'vrodos_loader_glb_assets', 'vrodos_scene_settings_sync', 'vrodos_editor_services']],
      ['vrodos_LightsPawn_Loader', VRodos_Path_Manager::editor_js_url( 'loaders/vrodos_loader_lights_pawn.js' ), ['vrodos_namespace', 'vrodos_editor_core_utils', 'vrodos_loader_resource_metadata', 'vrodos_loader_light_assets', 'vrodos_loader_pawn_assets', 'vrodos_editor_services', 'vrodos_three_vendor_bundle']],
      ['vrodos_loader_scene_lifecycle', VRodos_Path_Manager::editor_js_url( 'loaders/vrodos_loader_scene_lifecycle.js' ), ['vrodos_namespace', 'vrodos_editor_diagnostics', 'vrodos_editor_services', 'vrodos_editor_render_loop', 'vrodos_ScenePersistence', 'vrodos_BordersFinder', 'vrodos_HierarchyViewer', 'vrodos_auxControlers', 'vrodos_scene_disposal', 'vrodos_LoaderMulti', 'vrodos_LightsPawn_Loader']],
      ['vrodos_movePointerLocker', VRodos_Path_Manager::editor_js_url( 'ui/vrodos_pointer_lock_controls.js' ), ['vrodos_namespace', 'vrodos_editor_services', 'vrodos_3d_editor_environmentals', 'vrodos_BordersFinder', 'vrodos_keyButtons']],
      ['vrodos_scene_disposal', VRodos_Path_Manager::editor_js_url( 'scene/vrodos_scene_disposal.js' ), ['vrodos_namespace', 'vrodos_editor_core_utils']],
      ['vrodos_addRemoveOne', VRodos_Path_Manager::editor_js_url( 'scene/vrodos_scene_object_actions.js' ), ['vrodos_namespace', 'vrodos_scene_light_artifacts', 'vrodos_editor_core_utils', 'vrodos_ScenePersistence', 'vrodos_editor_services', 'vrodos_scene_disposal', 'vrodos_loader_object_factories', 'vrodos_loader_light_assets', 'vrodos_loader_pawn_assets', 'vrodos_loader_scene_lifecycle']],
      ['vrodos_ui_helpers', VRodos_Path_Manager::editor_js_url( 'ui/vrodos_ui_helpers.js' ), ['vrodos_namespace']],
      ['vrodos_scene_snapshot_ui', VRodos_Path_Manager::editor_js_url( 'ui/vrodos_scene_snapshot_ui.js' ), ['vrodos_namespace', 'vrodos_ui_helpers', 'vrodos_ScenePersistence', 'vrodos_three_vendor_bundle']],
      ['vrodos_scene_canvas_drop_ui', VRodos_Path_Manager::editor_js_url( 'ui/vrodos_scene_canvas_drop_ui.js' ), ['vrodos_namespace', 'vrodos_editor_core_utils', 'vrodos_editor_services', 'vrodos_rayCasters', 'vrodos_addRemoveOne']],
      ['vrodos_scene_canvas_events_ui', VRodos_Path_Manager::editor_js_url( 'ui/vrodos_scene_canvas_events_ui.js' ), ['vrodos_namespace', 'vrodos_scene_canvas_drop_ui', 'vrodos_rayCasters', 'ajax-script_savescene']],
      ['vrodos_scene_list_ui', VRodos_Path_Manager::editor_js_url( 'ui/vrodos_scene_list_ui.js' ), ['vrodos_namespace', 'vrodos_ui_helpers', 'ajax-script_deletescene']],
      ['vrodos_floating_panels', VRodos_Path_Manager::editor_js_url( 'ui/vrodos_floating_panels.js' ), ['vrodos_namespace', 'vrodos_ui_helpers']],
      ['vrodos_editor_shell_ui', VRodos_Path_Manager::editor_js_url( 'ui/vrodos_editor_shell_ui.js' ), ['vrodos_namespace', 'vrodos_ui_helpers', 'vrodos_editor_services', 'vrodos_auxControlers']],
      ['vrodos_editor_toolbar_ui', VRodos_Path_Manager::editor_js_url( 'ui/vrodos_editor_toolbar_ui.js' ), ['vrodos_namespace', 'vrodos_ui_helpers', 'vrodos_editor_services', 'vrodos_3d_editor_environmentals', 'vrodos_BordersFinder', 'vrodos_movePointerLocker', 'ajax-script_savescene']],
      ['vrodos_compile_dialog_ui', VRodos_Path_Manager::editor_js_url( 'ui/vrodos_compile_dialog_ui.js' ), ['vrodos_namespace', 'vrodos_ui_helpers', 'vrodos_compile_dialogue', 'ajax-script_compile', 'ajax-script_savescene']],
      ['vrodos_icons', VRodos_Path_Manager::editor_js_url( 'vrodos_icons.js' ), ['vrodos_namespace']],
      ['vrodos_cefr_badges', VRodos_Path_Manager::editor_js_url( 'ui/vrodos_cefr_badges.js' ), ['vrodos_namespace', 'vrodos_editor_core_utils']],
      ['vrodos_HierarchyViewer', VRodos_Path_Manager::editor_js_url( 'ui/vrodos_hierarchy_viewer.js' ), ['vrodos_namespace', 'vrodos_editor_core_utils', 'vrodos_ScenePersistence', 'vrodos_cefr_badges']],
      ['vrodos_CompileUI_Shared', VRodos_Path_Manager::editor_js_url( 'ui/compile/vrodos_compile_ui_shared.js' ), ['vrodos_namespace', 'vrodos_editor_core_utils', 'vrodos_runtime_settings_contract']],
      ['vrodos_CompileUI_General', VRodos_Path_Manager::editor_js_url( 'ui/compile/vrodos_compile_ui_general.js' ), ['vrodos_namespace', 'vrodos_CompileUI_Shared']],
      ['vrodos_CompileUI_PostFX', VRodos_Path_Manager::editor_js_url( 'ui/compile/vrodos_compile_ui_postfx.js' ), ['vrodos_namespace', 'vrodos_CompileUI_Shared']],
      ['vrodos_CompileUI_Atmosphere', VRodos_Path_Manager::editor_js_url( 'ui/compile/vrodos_compile_ui_atmosphere.js' ), ['vrodos_namespace', 'vrodos_CompileUI_Shared']],
      ['vrodos_compile_dialogue', VRodos_Path_Manager::editor_js_url( 'ui/compile/vrodos_compile_dialogue.js' ), ['vrodos_namespace', 'vrodos_CompileUI_Shared', 'vrodos_CompileUI_General', 'vrodos_CompileUI_PostFX', 'vrodos_CompileUI_Atmosphere']],
      ['vrodos_project_manager', VRodos_Path_Manager::editor_js_url( 'vrodos_project_manager.js' ), ['vrodos_namespace', 'ajax-script_create_game', 'ajax-script_rename_game']],
      ['vrodos_dashboard_assets', VRodos_Path_Manager::editor_js_url( 'vrodos_dashboard_assets.js' ), ['lucide-icons']],
      ['vrodos_EditorInitializer', VRodos_Path_Manager::editor_js_url( 'core/vrodos_editor_initializer.js' ), ['vrodos_namespace', 'vrodos_editor_core_utils', 'vrodos_ScenePersistence', 'vrodos_editor_diagnostics', 'vrodos_editor_services', 'vrodos_editor_render_loop', 'vrodos_scripts', 'vrodos_scene_settings_sync', 'ajax-script_savescene', 'vrodos_loader_scene_lifecycle', 'vrodos_3d_editor_environmentals', 'vrodos_addRemoveOne', 'vrodos_3d_editor_buttons_drags', 'vrodos_scene_editor_ui_controller']],
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
			. 'window.vrodos_three_draco_decoder_path = ' . wp_json_encode( $three_vendor_base . 'draco/gltf/' ) . ';'
			. 'window.vrodos_three_basis_transcoder_path = ' . wp_json_encode( $three_vendor_base . 'basis/' ) . ';'
			. 'window.vrodos_three_meshopt_decoder_path = ' . wp_json_encode( $three_vendor_base . 'meshopt/meshopt_decoder.js' ) . ';'
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
