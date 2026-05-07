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

	public const META_KEY = '_vrodos_asset3d_glb_derivatives';
	public const ANALYSIS_META_KEY = '_vrodos_asset3d_glb_analysis';
	public const SETTINGS_PAGE_KEY = 'vrodos_options';
	public const SETTINGS_TAB_KEY = 'vrodos_asset_optimization_settings';
	public const BATCH_TRANSIENT_PREFIX = 'vrodos_asset_glb_opt_batch_';
	public const GLB_MAGIC = 'glTF';
	public const GLB_VERSION = 2;
	public const GLB_JSON_CHUNK = 0x4E4F534A;
	public const GLTF_TRIANGLES_MODE = 4;
	public const GLTF_TRIANGLE_STRIP_MODE = 5;
	public const GLTF_TRIANGLE_FAN_MODE = 6;
}
