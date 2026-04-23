<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once plugin_dir_path( __FILE__ ) . 'class-vrodos-project-ajax.php';
require_once plugin_dir_path( __FILE__ ) . 'class-vrodos-scene-ajax.php';
require_once plugin_dir_path( __FILE__ ) . 'class-vrodos-asset-ajax.php';

/**
 * VRodos_AJAX_Handler
 * 
 * Main entry point for AJAX operations. This class now acts as a bootstrapper 
 * for domain-specific AJAX handlers.
 */
class VRodos_AJAX_Handler {

	public function __construct() {
		// Initialize domain-specific AJAX handlers
		new VRodos_Project_AJAX();
		new VRodos_Scene_AJAX();
		new VRodos_Asset_AJAX();
	}
}
