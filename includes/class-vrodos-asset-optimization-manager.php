<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/asset-optimization/trait-vrodos-asset-optimization-admin-actions.php';
require_once __DIR__ . '/asset-optimization/trait-vrodos-asset-optimization-settings.php';
require_once __DIR__ . '/asset-optimization/trait-vrodos-asset-optimization-dashboard.php';
require_once __DIR__ . '/asset-optimization/trait-vrodos-asset-optimization-scanner.php';
require_once __DIR__ . '/asset-optimization/trait-vrodos-asset-optimization-analysis.php';
require_once __DIR__ . '/asset-optimization/trait-vrodos-asset-optimization-derivatives.php';
require_once __DIR__ . '/asset-optimization/trait-vrodos-asset-optimization-editor-preview.php';
require_once __DIR__ . '/asset-optimization/class-vrodos-asset-optimization-admin-controller.php';

class VRodos_Asset_Optimization_Manager {
	private VRodos_Asset_Optimization_Admin_Controller $controller;

	public function __construct() {
		$this->controller = new VRodos_Asset_Optimization_Admin_Controller();

		add_action( 'add_meta_boxes', [ $this->controller, 'add_meta_boxes' ] );
		add_action( 'save_post_vrodos_asset3d', [ $this->controller, 'save_derivative_compile_settings' ], 20, 2 );
		add_action( 'admin_post_vrodos_optimize_asset_glb', [ $this->controller, 'handle_optimize_asset_glb' ] );
		add_action( 'admin_post_vrodos_optimize_missing_glbs', [ $this->controller, 'handle_optimize_missing_glbs' ] );
		add_action( 'admin_post_vrodos_refresh_asset_glb_analysis', [ $this->controller, 'handle_refresh_asset_glb_analysis' ] );
		add_action( 'admin_post_vrodos_dashboard_refresh_asset_glb_analysis', [ $this->controller, 'handle_dashboard_refresh_asset_glb_analysis' ] );
		add_action( 'admin_post_vrodos_dashboard_optimize_asset_glb', [ $this->controller, 'handle_dashboard_optimize_asset_glb' ] );
		add_action( 'admin_post_vrodos_dashboard_toggle_asset_compile_use', [ $this->controller, 'handle_dashboard_toggle_asset_compile_use' ] );
		add_action( 'wp_ajax_vrodos_dashboard_refresh_asset_glb_analysis', [ $this->controller, 'ajax_dashboard_refresh_asset_glb_analysis' ] );
		add_action( 'wp_ajax_vrodos_dashboard_toggle_asset_compile_use', [ $this->controller, 'ajax_dashboard_toggle_asset_compile_use' ] );
		add_action( 'added_post_meta', [ $this->controller, 'handle_asset_glb_meta_change' ], 10, 4 );
		add_action( 'updated_post_meta', [ $this->controller, 'handle_asset_glb_meta_change' ], 10, 4 );
		add_action( 'deleted_post_meta', [ $this->controller, 'handle_asset_glb_meta_delete' ], 10, 4 );
		add_action( 'before_delete_post', [ $this->controller, 'handle_asset_delete' ], 10, 2 );
		add_action( VRodos_Asset_Optimization_Admin_Controller::EDITOR_PREVIEW_CRON_HOOK, [ $this->controller, 'process_editor_preview_job' ], 10, 1 );
		add_filter( 'vrodos_settings_tabs', [ $this->controller, 'register_settings_tab' ] );
		add_action( 'vrodos_render_settings_tab_' . VRodos_Asset_Optimization_Admin_Controller::SETTINGS_TAB_KEY, [ $this->controller, 'render_asset_optimization_settings' ] );
	}

	public static function resolve_compiled_glb_asset( int $asset_id, string $source_url ): array {
		return VRodos_Asset_Optimization_Admin_Controller::resolve_compiled_glb_asset( $asset_id, $source_url );
	}

	public static function dashboard_actionable_assets( int $limit = 10 ): array {
		return VRodos_Asset_Optimization_Admin_Controller::dashboard_actionable_assets( $limit );
	}

	public static function render_dashboard_actionable_assets_table( int $limit = 10 ): void {
		VRodos_Asset_Optimization_Admin_Controller::render_dashboard_actionable_assets_table( $limit );
	}

	public static function get_editor_preview_asset_state( int $asset_id ): array {
		return VRodos_Asset_Optimization_Admin_Controller::get_editor_preview_asset_state( $asset_id );
	}
}
