<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Render_Runtime_Manager {
	private const MANIFEST_RELATIVE_PATH = 'assets/runtime-version-manifest.json';

	private const FALLBACK_AFRAME_RUNTIME_LABEL   = 'A-Frame master';
	private const FALLBACK_AFRAME_RUNTIME_SOURCE  = 'cdn-master';
	private const FALLBACK_AFRAME_RUNTIME_VERSION = '1.7.1';
	private const FALLBACK_AFRAME_RUNTIME_URL     = 'https://cdn.jsdelivr.net/gh/aframevr/aframe@adf8f4e02b0499223b2c4fa93165e49b50384564/dist/aframe-master.min.js';
	private const FALLBACK_AFRAME_RUNTIME_COMMIT  = 'adf8f4e02b0499223b2c4fa93165e49b50384564';
	private const LOCAL_AFRAME_RUNTIME_PATH       = 'assets/vendor/aframe/aframe-master.min.js';

	private const FALLBACK_THREE_VENDOR_VERSION = '0.184.0';
	private const FALLBACK_THREE_VENDOR_DIR     = 'three-r184';
	private const FALLBACK_THREE_VENDOR_BUNDLE  = 'vrodos-three-r184.bundle.js';
	private const FALLBACK_TAKRAM_STARS_DATA_PATH = 'assets/vendor/takram-atmosphere/stars.bin';
	private const FALLBACK_TAKRAM_CLOUDS_BASE_PATH = 'assets/vendor/takram-clouds/';
	private const FALLBACK_TAKRAM_CLOUDS_LOCAL_WEATHER_PATH = 'assets/vendor/takram-clouds/local_weather.png';
	private const FALLBACK_TAKRAM_CLOUDS_SHAPE_PATH = 'assets/vendor/takram-clouds/shape.bin';
	private const FALLBACK_TAKRAM_CLOUDS_SHAPE_DETAIL_PATH = 'assets/vendor/takram-clouds/shape_detail.bin';
	private const FALLBACK_TAKRAM_CLOUDS_TURBULENCE_PATH = 'assets/vendor/takram-clouds/turbulence.png';
	private const FALLBACK_TAKRAM_CLOUDS_STBN_PATH = 'assets/vendor/takram-clouds/stbn.bin';

	private static ?array $manifest = null;

	public static function get_config(): array {
		$manifest = self::get_manifest();
		$aframe   = is_array( $manifest['aframe'] ?? null ) ? $manifest['aframe'] : [];
		$three    = is_array( $manifest['three'] ?? null ) ? $manifest['three'] : [];
		$postfx   = is_array( $manifest['postprocessing'] ?? null ) ? $manifest['postprocessing'] : [];
		$takram   = is_array( $manifest['takram'] ?? null ) ? $manifest['takram'] : [];
		$takram_assets = is_array( $takram['assets'] ?? null ) ? $takram['assets'] : [];
		$takram_stars_data_path = self::string_value(
			$takram_assets,
			'starsDataPath',
			self::string_value( $takram, 'starsDataPath', self::FALLBACK_TAKRAM_STARS_DATA_PATH )
		);
		$takram_clouds_base_path = self::string_value( $takram_assets, 'cloudsBasePath', self::FALLBACK_TAKRAM_CLOUDS_BASE_PATH );
		$takram_clouds_local_weather_path = self::string_value( $takram_assets, 'cloudsLocalWeatherPath', self::FALLBACK_TAKRAM_CLOUDS_LOCAL_WEATHER_PATH );
		$takram_clouds_shape_path = self::string_value( $takram_assets, 'cloudsShapePath', self::FALLBACK_TAKRAM_CLOUDS_SHAPE_PATH );
		$takram_clouds_shape_detail_path = self::string_value( $takram_assets, 'cloudsShapeDetailPath', self::FALLBACK_TAKRAM_CLOUDS_SHAPE_DETAIL_PATH );
		$takram_clouds_turbulence_path = self::string_value( $takram_assets, 'cloudsTurbulencePath', self::FALLBACK_TAKRAM_CLOUDS_TURBULENCE_PATH );
		$takram_clouds_stbn_path = self::string_value( $takram_assets, 'cloudsStbnPath', self::FALLBACK_TAKRAM_CLOUDS_STBN_PATH );

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
			'takram_atmosphere_version' => self::string_value( $takram, 'atmosphereVersion', '' ),
			'takram_clouds_version' => self::string_value( $takram, 'cloudsVersion', '' ),
			'takram_bundle' => self::string_value( $takram, 'bundleFile', 'vrodos-takram-atmosphere.bundle.js' ),
			'takram_clouds_bundle' => self::string_value( $takram, 'cloudsBundleFile', 'vrodos-takram-clouds.bundle.js' ),
			'takram_stars_data_path' => $takram_stars_data_path,
			'takram_stars_data_url' => VRodos_Path_Manager::plugin_url( $takram_stars_data_path ),
			'takram_clouds_assets_base_path' => $takram_clouds_base_path,
			'takram_clouds_assets_base_url' => VRodos_Path_Manager::plugin_url( $takram_clouds_base_path ),
			'takram_clouds_local_weather_url' => VRodos_Path_Manager::plugin_url( $takram_clouds_local_weather_path ),
			'takram_clouds_shape_url' => VRodos_Path_Manager::plugin_url( $takram_clouds_shape_path ),
			'takram_clouds_shape_detail_url' => VRodos_Path_Manager::plugin_url( $takram_clouds_shape_detail_path ),
			'takram_clouds_turbulence_url' => VRodos_Path_Manager::plugin_url( $takram_clouds_turbulence_path ),
			'takram_clouds_stbn_url' => VRodos_Path_Manager::plugin_url( $takram_clouds_stbn_path ),
		];
	}

	public static function get_aframe_runtime_url(): string {
		$local_runtime_url = self::get_local_aframe_runtime_url();
		if ( '' !== $local_runtime_url ) {
			return $local_runtime_url;
		}

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

	private static function get_local_aframe_runtime_url(): string {
		if ( ! class_exists( 'VRodos_Path_Manager' ) ) {
			return '';
		}

		$path = VRodos_Path_Manager::plugin_path( self::LOCAL_AFRAME_RUNTIME_PATH );
		if ( ! is_readable( $path ) ) {
			return '';
		}

		$url  = VRodos_Path_Manager::plugin_url( self::LOCAL_AFRAME_RUNTIME_PATH );
		$path = wp_parse_url( $url, PHP_URL_PATH );
		if ( ! $path ) {
			return $url;
		}

		$query = wp_parse_url( $url, PHP_URL_QUERY );
		return $path . ( $query ? '?' . $query : '' );
	}

	private static function string_value( array $source, string $key, string $fallback ): string {
		$value = $source[ $key ] ?? null;
		return is_string( $value ) && '' !== $value ? $value : $fallback;
	}
}
