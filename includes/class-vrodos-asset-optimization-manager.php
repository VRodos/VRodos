<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/asset-optimization/class-vrodos-asset-optimization-admin-controller.php';

class VRodos_Asset_Optimization_Manager {
	private VRodos_Asset_Optimization_Admin_Controller $controller;

	public function __construct() {
		$this->controller = new VRodos_Asset_Optimization_Admin_Controller();
		$service = new VRodos_Asset_Optimization_Service();

		add_action( 'add_meta_boxes', [ $this->controller, 'add_meta_boxes' ] );
		add_action( 'admin_post_vrodos_optimize_asset_glb', [ $this->controller, 'handle_optimize_asset_glb' ] );
		add_action( 'admin_post_vrodos_optimize_missing_glbs', [ $this->controller, 'handle_optimize_missing_glbs' ] );
		add_action( 'admin_post_vrodos_refresh_asset_glb_analysis', [ $this->controller, 'handle_refresh_asset_glb_analysis' ] );
		add_action( 'admin_post_vrodos_dashboard_refresh_asset_glb_analysis', [ $this->controller, 'handle_dashboard_refresh_asset_glb_analysis' ] );
		add_action( 'admin_post_vrodos_dashboard_optimize_asset_glb', [ $this->controller, 'handle_dashboard_optimize_asset_glb' ] );
		add_action( 'wp_ajax_vrodos_dashboard_refresh_asset_glb_analysis', [ $this->controller, 'ajax_dashboard_refresh_asset_glb_analysis' ] );
		add_action( 'added_post_meta', [ $service, 'handle_asset_glb_meta_change' ], 10, 4 );
		add_action( 'updated_post_meta', [ $service, 'handle_asset_glb_meta_change' ], 10, 4 );
		add_action( 'deleted_post_meta', [ $service, 'handle_asset_glb_meta_delete' ], 10, 4 );
		add_action( 'before_delete_post', [ $service, 'handle_asset_delete' ], 10, 2 );
		add_action( VRodos_Asset_Optimization_Service::EDITOR_PREVIEW_CRON_HOOK, [ $service, 'process_editor_preview_job' ], 10, 1 );
		add_action( VRodos_Asset_Optimization_Service::DESKTOP_PROFILE_CRON_HOOK, [ $service, 'process_desktop_profile_job' ], 10, 6 );
		add_filter( 'vrodos_settings_tabs', [ $this->controller, 'register_settings_tab' ] );
		add_action( 'vrodos_render_settings_tab_' . VRodos_Asset_Optimization_Admin_Controller::SETTINGS_TAB_KEY, [ $this->controller, 'render_asset_optimization_settings' ] );
	}

	public static function dashboard_actionable_assets( int $limit = 10 ): array {
		return VRodos_Asset_Optimization_Service::dashboard_actionable_assets( $limit );
	}

	public static function render_dashboard_actionable_assets_table( int $limit = 10 ): void {
		VRodos_Asset_Optimization_Admin_Controller::render_dashboard_actionable_assets_table( $limit );
	}

	public static function get_editor_preview_asset_state( int $asset_id ): array {
		return VRodos_Asset_Optimization_Service::get_editor_preview_asset_state( $asset_id );
	}

	public static function get_web_optimization_state( int $asset_id ): array {
		return VRodos_Asset_Optimization_Service::get_web_optimization_state( $asset_id );
	}

	public static function resolve_editor_glb_load( int $asset_id, bool $force_source = false ): array {
		return VRodos_Asset_Optimization_Service::resolve_editor_glb_load( $asset_id, $force_source );
	}

	public static function collision_bounds_for_asset( int $asset_id ) {
		return VRodos_Asset_Optimization_Service::collision_bounds_for_asset( $asset_id );
	}

	public static function retry_editor_preview( int $asset_id ): array {
		return VRodos_Asset_Optimization_Service::retry_editor_preview( $asset_id );
	}

	public static function prepare_runtime_profile_derivatives( VRodos_Project_Compile_Plan $plan ): array {
		return VRodos_Asset_Optimization_Service::prepare_runtime_profile_derivatives( $plan );
	}

	public static function ensure_derivative( int $asset_id, string $profile, array $source = [], array $options = [], bool $regenerate = false ) {
		return VRodos_Asset_Optimization_Service::ensure_derivative( $asset_id, $profile, $source, $options, $regenerate );
	}

	public static function runtime_profile_derivative_path( int $asset_id, string $profile, array $options = [] ): string {
		return VRodos_Asset_Optimization_Service::runtime_profile_derivative_path( $asset_id, $profile, $options );
	}

	public static function desktop_profile_derivative_info( int $asset_id, string $slot ): array {
		return VRodos_Asset_Optimization_Service::desktop_profile_derivative_info( $asset_id, $slot );
	}
}
