<?php
require_once __DIR__ . '/trait-vrodos-asset-optimization-lifecycle.php';
require_once __DIR__ . '/class-vrodos-asset-optimization-dashboard-read-model.php';
require_once __DIR__ . '/trait-vrodos-asset-optimization-scanner.php';
require_once __DIR__ . '/trait-vrodos-asset-optimization-analysis.php';
require_once __DIR__ . '/trait-vrodos-asset-optimization-derivatives.php';
require_once __DIR__ . '/trait-vrodos-asset-optimization-queue.php';
require_once __DIR__ . '/trait-vrodos-asset-optimization-editor-preview.php';
require_once __DIR__ . '/trait-vrodos-asset-optimization-desktop-profiles.php';
require_once __DIR__ . '/trait-vrodos-asset-optimization-editor-load.php';

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Domain orchestration shared by compilation, workers, and admin actions. */
class VRodos_Asset_Optimization_Service {
	use VRodos_Asset_Optimization_Lifecycle;

	public static function dashboard_actionable_assets( int $limit = 10 ): array {
		return array_slice( self::collect_dashboard_actionable_assets(), 0, max( 1, $limit ) );
	}

	protected static function collect_dashboard_actionable_assets(): array {
		return VRodos_Asset_Optimization_Dashboard_Read_Model::collect( self::scan_glb_derivatives( 'web-high' ) );
	}

	protected static function sort_dashboard_actionable_assets( array $items, string $sort, string $order ): array {
		return VRodos_Asset_Optimization_Dashboard_Read_Model::sort( $items, $sort, $order );
	}

	use VRodos_Asset_Optimization_Scanner;
	use VRodos_Asset_Optimization_Analysis_Service;
	use VRodos_Asset_Optimization_Derivative_Service;
	use VRodos_Asset_Optimization_Queue;
	use VRodos_Asset_Optimization_Editor_Preview;
	use VRodos_Asset_Optimization_Desktop_Profiles;
	use VRodos_Asset_Optimization_Editor_Load;

	public const META_KEY = '_vrodos_asset3d_glb_derivatives';
	public const ANALYSIS_META_KEY = '_vrodos_asset3d_glb_analysis';
	public const SOURCE_META_KEY = '_vrodos_asset3d_glb_source_snapshot';
	public const SETTINGS_PAGE_KEY = 'vrodos_options';
	public const SETTINGS_TAB_KEY = 'vrodos_asset_optimization_settings';
	public const EDITOR_PREVIEW_CRON_HOOK = 'vrodos_asset_editor_preview_process_job';
	public const DESKTOP_PROFILE_CRON_HOOK = 'vrodos_asset_desktop_profile_process_job';
	public const OPTIMIZER_LEASE_OPTION = 'vrodos_asset_optimizer_worker_lease';
	public const BATCH_TRANSIENT_PREFIX = 'vrodos_asset_glb_opt_batch_';






	protected const EDITOR_PREVIEW_PROFILE = 'editor-preview';
	protected const EDITOR_PREVIEW_QUEUE_DELAY_SECONDS = 10;
	protected const EDITOR_PREVIEW_JOB_TIMEOUT_SECONDS = 900;
	protected const EDITOR_PREVIEW_FILE_THRESHOLD_BYTES = 10485760;
	protected const EDITOR_PREVIEW_TRIANGLE_THRESHOLD = 500000;
	protected const EDITOR_PREVIEW_PRIMITIVE_THRESHOLD = 200;
	protected const EDITOR_PREVIEW_MATERIAL_THRESHOLD = 80;
	protected const EDITOR_PREVIEW_IMAGE_BYTE_THRESHOLD = 50331648;
}
