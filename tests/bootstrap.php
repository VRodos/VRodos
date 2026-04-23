<?php

// Minimal WordPress mocks to allow unit testing without a full database
if (!defined('ABSPATH')) {
    define('ABSPATH', dirname(__DIR__) . '/');
}

if (!defined('VRODOS_PLUGIN_FILE')) {
    define('VRODOS_PLUGIN_FILE', dirname(__DIR__) . '/VRodos.php');
}

// Load Composer's autoloader when available, but allow lightweight path/helper
// tests to run in local environments that don't have vendor/ installed.
$composerAutoload = dirname(__DIR__) . '/vendor/autoload.php';
if ( file_exists( $composerAutoload ) ) {
    require_once $composerAutoload;
}

// Mock common WordPress functions
function add_action($tag, $callback, $priority = 10, $accepted_args = 1) {}
function add_filter($tag, $callback, $priority = 10, $accepted_args = 1) {}
function remove_filter($tag, $callback, $priority = 10) {}
function plugin_dir_path($file) { return dirname($file) . '/'; }
function plugin_dir_url($file) { return 'https://example.com/wp-content/plugins/vrodos/'; }
function get_site_url() { return 'https://example.com'; }
function home_url() { return 'https://example.com'; }
function __($text, $domain = 'default') { return $text; }
function esc_url($url) { return $url; }
function esc_attr($text) { return $text; }
function trailingslashit($value) { return rtrim($value, "/\\") . '/'; }

// Load the classes we want to test
require_once dirname(__DIR__) . '/includes/class-vrodos-path-manager.php';
require_once dirname(__DIR__) . '/includes/class-vrodos-core-manager.php';
require_once dirname(__DIR__) . '/includes/ajax/class-vrodos-ajax-handler.php';
// Add other managers as needed for testing
