<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Render_Runtime_Manager {
	private const MANIFEST_RELATIVE_PATH = 'assets/runtime-version-manifest.json';

	private const FALLBACK_AFRAME_RUNTIME_LABEL   = 'A-Frame master';
	private const FALLBACK_AFRAME_RUNTIME_SOURCE  = 'cdn-master';
	private const FALLBACK_AFRAME_RUNTIME_VERSION = '1.7.1';
	private const FALLBACK_AFRAME_RUNTIME_URL     = 'https://cdn.jsdelivr.net/gh/aframevr/aframe@96cc74fa7a4640f394a78985a637a788daf56186/dist/aframe-master.min.js';
	private const FALLBACK_AFRAME_RUNTIME_COMMIT  = '96cc74fa7a4640f394a78985a637a788daf56186';

	private const FALLBACK_THREE_VENDOR_VERSION = '0.181.0';
	private const FALLBACK_THREE_VENDOR_DIR     = 'three-r181';
	private const FALLBACK_THREE_VENDOR_BUNDLE  = 'vrodos-three-r181.bundle.js';

	private static ?array $manifest = null;

	public static function get_config(): array {
		$manifest = self::get_manifest();
		$aframe   = is_array( $manifest['aframe'] ?? null ) ? $manifest['aframe'] : [];
		$three    = is_array( $manifest['three'] ?? null ) ? $manifest['three'] : [];
		$postfx   = is_array( $manifest['postprocessing'] ?? null ) ? $manifest['postprocessing'] : [];
		$n8ao     = is_array( $manifest['n8ao'] ?? null ) ? $manifest['n8ao'] : [];
		$takram   = is_array( $manifest['takram'] ?? null ) ? $manifest['takram'] : [];

		return [
			'aframe_runtime_label' => self::string_value( $aframe, 'label', self::FALLBACK_AFRAME_RUNTIME_LABEL ),
			'aframe_runtime_source' => self::string_value( $aframe, 'source', self::FALLBACK_AFRAME_RUNTIME_SOURCE ),
			'aframe_runtime_version' => self::string_value( $aframe, 'version', self::FALLBACK_AFRAME_RUNTIME_VERSION ),
			'aframe_runtime_url' => self::string_value( $aframe, 'url', self::FALLBACK_AFRAME_RUNTIME_URL ),
			'aframe_master_commit' => self::string_value( $aframe, 'commit', self::FALLBACK_AFRAME_RUNTIME_COMMIT ),
			'three_vendor_version' => self::string_value( $three, 'version', self::FALLBACK_THREE_VENDOR_VERSION ),
			'three_vendor_dir' => self::string_value( $three, 'vendorDir', self::FALLBACK_THREE_VENDOR_DIR ),
			'three_vendor_bundle' => self::string_value( $three, 'bundleFile', self::FALLBACK_THREE_VENDOR_BUNDLE ),
			'postprocessing_version' => self::string_value( $postfx, 'version', '' ),
			'n8ao_version' => self::string_value( $n8ao, 'version', '' ),
			'takram_atmosphere_version' => self::string_value( $takram, 'atmosphereVersion', '' ),
			'takram_clouds_version' => self::string_value( $takram, 'cloudsVersion', '' ),
			'takram_bundle' => self::string_value( $takram, 'bundleFile', 'vrodos-takram-atmosphere.bundle.js' ),
		];
	}

	public static function get_aframe_runtime_url(): string {
		$config = self::get_config();
		return $config['aframe_runtime_url'];
	}

	public static function get_three_vendor_dir(): string {
		$config = self::get_config();
		return $config['three_vendor_dir'];
	}

	public static function get_three_vendor_bundle(): string {
		$config = self::get_config();
		return $config['three_vendor_bundle'];
	}

	public static function get_three_vendor_bundle_url(): string {
		return VRodos_Path_Manager::vendor_url( self::get_three_vendor_dir() . '/' . self::get_three_vendor_bundle() );
	}

	private static function get_manifest(): array {
		if ( null !== self::$manifest ) {
			return self::$manifest;
		}

		$manifest_path = self::get_manifest_path();
		if ( ! is_readable( $manifest_path ) ) {
			self::$manifest = [];
			return self::$manifest;
		}

		$raw = file_get_contents( $manifest_path );
		if ( false === $raw ) {
			self::$manifest = [];
			return self::$manifest;
		}

		$decoded = json_decode( $raw, true );
		self::$manifest = is_array( $decoded ) ? $decoded : [];

		return self::$manifest;
	}

	private static function get_manifest_path(): string {
		if ( class_exists( 'VRodos_Path_Manager' ) ) {
			return VRodos_Path_Manager::plugin_path( self::MANIFEST_RELATIVE_PATH );
		}

		return plugin_dir_path( __DIR__ ) . self::MANIFEST_RELATIVE_PATH;
	}

	private static function string_value( array $source, string $key, string $fallback ): string {
		$value = $source[ $key ] ?? null;
		return is_string( $value ) && '' !== $value ? $value : $fallback;
	}
}
