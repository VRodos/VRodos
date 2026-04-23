<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Path_Manager {
	public const PAGE_TEMPLATES_DIR   = 'templates/pages/';
	public const LEGACY_PAGE_TEMPLATES_DIR = 'templates/';
	public const RUNTIME_TEMPLATES_DIR = 'templates/runtime/aframe/';
	public const RUNTIME_BUILD_DIR    = 'runtime/build/';
	public const SERVICES_DIR         = 'services/';

	public const ASSETS_DIR             = 'assets/';
	public const CSS_DIR                = 'assets/css/';
	public const EDITOR_JS_DIR          = 'assets/js/editor/';
	public const EDITOR_AJAX_JS_DIR     = 'assets/js/editor/ajax/';
	public const RUNTIME_JS_DIR         = 'assets/js/runtime/';
	public const RUNTIME_COMPONENTS_DIR = 'assets/js/runtime/components/';
	public const RUNTIME_MASTER_DIR     = 'assets/js/runtime/master/';
	public const IMAGES_DIR             = 'assets/images/';
	public const MEDIA_DIR              = 'assets/media/';
	public const MODELS_DIR             = 'assets/models/';
	public const VENDOR_DIR             = 'assets/vendor/';

	public static function plugin_path( string $relative = '' ): string {
		return self::join_path( plugin_dir_path( VRODOS_PLUGIN_FILE ), $relative );
	}

	public static function plugin_url( string $relative = '' ): string {
		return self::join_url( plugin_dir_url( VRODOS_PLUGIN_FILE ), $relative );
	}

	public static function asset_url( string $relative = '' ): string {
		return self::plugin_url( self::ASSETS_DIR . $relative );
	}

	public static function asset_path( string $relative = '' ): string {
		return self::plugin_path( self::ASSETS_DIR . $relative );
	}

	public static function css_url( string $relative = '' ): string {
		return self::plugin_url( self::CSS_DIR . $relative );
	}

	public static function editor_js_url( string $relative = '' ): string {
		return self::plugin_url( self::EDITOR_JS_DIR . $relative );
	}

	public static function editor_ajax_js_url( string $relative = '' ): string {
		return self::plugin_url( self::EDITOR_AJAX_JS_DIR . $relative );
	}

	public static function runtime_js_url( string $relative = '' ): string {
		return self::plugin_url( self::RUNTIME_JS_DIR . $relative );
	}

	public static function runtime_component_url( string $relative = '' ): string {
		return self::plugin_url( self::RUNTIME_COMPONENTS_DIR . $relative );
	}

	public static function runtime_master_url( string $relative = '' ): string {
		return self::plugin_url( self::RUNTIME_MASTER_DIR . $relative );
	}

	public static function image_url( string $relative = '' ): string {
		return self::plugin_url( self::IMAGES_DIR . $relative );
	}

	public static function media_url( string $relative = '' ): string {
		return self::plugin_url( self::MEDIA_DIR . $relative );
	}

	public static function media_path( string $relative = '' ): string {
		return self::plugin_path( self::MEDIA_DIR . $relative );
	}

	public static function model_url( string $relative = '' ): string {
		return self::plugin_url( self::MODELS_DIR . $relative );
	}

	public static function vendor_url( string $relative = '' ): string {
		return self::plugin_url( self::VENDOR_DIR . $relative );
	}

	public static function vendor_path( string $relative = '' ): string {
		return self::plugin_path( self::VENDOR_DIR . $relative );
	}

	public static function runtime_template_path( string $filename ): string {
		return self::plugin_path( self::RUNTIME_TEMPLATES_DIR . ltrim( $filename, '/\\' ) );
	}

	public static function page_template_path( string $template ): string {
		$template = ltrim( $template, '/\\' );

		if ( str_starts_with( $template, self::PAGE_TEMPLATES_DIR ) ) {
			return self::plugin_path( $template );
		}

		return self::plugin_path( self::PAGE_TEMPLATES_DIR . basename( $template ) );
	}

	public static function canonical_page_template_meta( string $template ): string {
		return '/' . self::PAGE_TEMPLATES_DIR . basename( $template );
	}

	public static function legacy_page_template_meta( string $template ): string {
		return '/' . self::LEGACY_PAGE_TEMPLATES_DIR . basename( $template );
	}

	public static function page_template_meta_values( string $template ): array {
		return [
			self::canonical_page_template_meta( $template ),
			self::legacy_page_template_meta( $template ),
		];
	}

	public static function runtime_build_path( string $relative = '' ): string {
		return self::plugin_path( self::RUNTIME_BUILD_DIR . $relative );
	}

	public static function networked_aframe_server_path(): string {
		return self::plugin_path( self::SERVICES_DIR . 'networked-aframe/server/easyrtc-server.js' );
	}

	public static function standard_scene_path(): string {
		return self::asset_path( 'scenes/standard_scene.json' );
	}

	public static function frontend_paths(): array {
		return [
			'pluginBaseUrl'   => self::plugin_url(),
			'assetsBaseUrl'   => self::asset_url(),
			'editorJsBaseUrl' => self::editor_js_url(),
			'runtimeJsBaseUrl' => self::runtime_js_url(),
			'vendorBaseUrl'   => self::vendor_url(),
			'modelBaseUrl'    => self::model_url(),
			'imageBaseUrl'    => self::image_url(),
			'mediaBaseUrl'    => self::media_url(),
			'cssBaseUrl'      => self::css_url(),
		];
	}

	private static function join_url( string $base, string $relative = '' ): string {
		if ( '' === $relative ) {
			return trailingslashit( $base );
		}

		return trailingslashit( $base ) . ltrim( str_replace( '\\', '/', $relative ), '/' );
	}

	private static function join_path( string $base, string $relative = '' ): string {
		if ( '' === $relative ) {
			return trailingslashit( $base );
		}

		return trailingslashit( $base ) . ltrim( str_replace( '\\', '/', $relative ), '/' );
	}
}
