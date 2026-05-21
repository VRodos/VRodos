<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Asset_Optimization_Admin_Controller {
	use VRodos_Asset_Optimization_Admin_Actions;
	use VRodos_Asset_Optimization_Settings_View;
	use VRodos_Asset_Optimization_Dashboard_View;
	use VRodos_Asset_Optimization_Scanner;
	use VRodos_Asset_Optimization_Analysis_Service;
	use VRodos_Asset_Optimization_Derivative_Service;
	use VRodos_Asset_Optimization_Editor_Preview;

	public const META_KEY = '_vrodos_asset3d_glb_derivatives';
	public const ANALYSIS_META_KEY = '_vrodos_asset3d_glb_analysis';
	public const SETTINGS_PAGE_KEY = 'vrodos_options';
	public const SETTINGS_TAB_KEY = 'vrodos_asset_optimization_settings';
	public const EDITOR_PREVIEW_CRON_HOOK = 'vrodos_asset_editor_preview_process_job';
	public const BATCH_TRANSIENT_PREFIX = 'vrodos_asset_glb_opt_batch_';
	public const GLB_MAGIC = 'glTF';
	public const GLB_VERSION = 2;
	public const GLB_JSON_CHUNK = 0x4E4F534A;
	public const GLTF_TRIANGLES_MODE = 4;
	public const GLTF_TRIANGLE_STRIP_MODE = 5;
	public const GLTF_TRIANGLE_FAN_MODE = 6;
	private const EDITOR_PREVIEW_PROFILE = 'editor-preview';
	private const EDITOR_PREVIEW_LOCK_KEY = 'vrodos_asset_editor_preview_global_lock';
	private const EDITOR_PREVIEW_QUEUE_DELAY_SECONDS = 10;
	private const EDITOR_PREVIEW_JOB_TIMEOUT_SECONDS = 900;
	private const EDITOR_PREVIEW_FILE_THRESHOLD_BYTES = 157286400;
	private const EDITOR_PREVIEW_HUGE_FILE_THRESHOLD_BYTES = 786432000;
	private const EDITOR_PREVIEW_TRIANGLE_THRESHOLD = 500000;
	private const EDITOR_PREVIEW_HUGE_TRIANGLE_THRESHOLD = 1000000;
	private const EDITOR_PREVIEW_PRIMITIVE_THRESHOLD = 200;
	private const EDITOR_PREVIEW_MATERIAL_THRESHOLD = 80;
	private const EDITOR_PREVIEW_IMAGE_BYTE_THRESHOLD = 50331648;
}
