<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Reads and validates the generated runtime/version contract. */
final class VRodos_Render_Runtime_Manager {
	private const MANIFEST_RELATIVE_PATH     = 'assets/runtime-version-manifest.json';
	private const LOCAL_AFRAME_RUNTIME_PATH = 'assets/vendor/aframe/aframe-master.min.js';

	private static ?array $manifest = null;
	private static ?array $validation_errors = null;

	public static function get_config(): array {
		$manifest          = self::get_manifest();
		$aframe            = $manifest['aframe'];
		$three             = $manifest['three'];
		$three_decoders    = $three['decoders'];
		$postfx            = $manifest['postprocessing'];
		$takram            = $manifest['takram'];
		$takram_assets     = $takram['assets'];
		$browser_libraries = $manifest['browserLibraries'];

		return [
			'aframe_runtime_label'                 => $aframe['label'],
			'aframe_runtime_source'                => $aframe['source'],
			'aframe_runtime_version'               => $aframe['version'],
			'aframe_runtime_url'                   => $aframe['url'],
			'aframe_master_commit'                 => $aframe['commit'],
			'aframe_source_commit'                 => $aframe['sourceCommit'],
			'aframe_artifact_commit'               => $aframe['artifactCommit'],
			'aframe_bundle_sha256'                 => $aframe['sha256'],
			'aframe_requested_power_preference'    => $aframe['requestedPowerPreference'],
			'three_vendor_version'                 => $three['version'],
			'three_vendor_dir'                     => $three['vendorDir'],
			'three_vendor_bundle'                  => $three['bundleFile'],
			'three_draco_decoder_path'             => $three_decoders['dracoDecoderPath'],
			'three_draco_decoder_url'              => VRodos_Path_Manager::plugin_url( $three_decoders['dracoDecoderPath'] ),
			'three_basis_transcoder_path'          => $three_decoders['basisTranscoderPath'],
			'three_basis_transcoder_url'           => VRodos_Path_Manager::plugin_url( $three_decoders['basisTranscoderPath'] ),
			'three_meshopt_decoder_path'           => $three_decoders['meshoptDecoderPath'],
			'three_meshopt_decoder_url'            => VRodos_Path_Manager::plugin_url( $three_decoders['meshoptDecoderPath'] ),
			'postprocessing_version'               => $postfx['version'],
			'takram_atmosphere_version'            => $takram['atmosphereVersion'],
			'takram_clouds_version'                => $takram['cloudsVersion'],
			'takram_bundle'                        => $takram['bundleFile'],
			'takram_clouds_bundle'                 => $takram['cloudsBundleFile'],
			'takram_stars_data_path'               => $takram_assets['starsDataPath'],
			'takram_stars_data_url'                => VRodos_Path_Manager::plugin_url( $takram_assets['starsDataPath'] ),
			'takram_clouds_assets_base_path'       => $takram_assets['cloudsBasePath'],
			'takram_clouds_assets_base_url'        => VRodos_Path_Manager::plugin_url( $takram_assets['cloudsBasePath'] ),
			'takram_clouds_local_weather_url'      => VRodos_Path_Manager::plugin_url( $takram_assets['cloudsLocalWeatherPath'] ),
			'takram_clouds_shape_url'              => VRodos_Path_Manager::plugin_url( $takram_assets['cloudsShapePath'] ),
			'takram_clouds_shape_detail_url'       => VRodos_Path_Manager::plugin_url( $takram_assets['cloudsShapeDetailPath'] ),
			'takram_clouds_turbulence_url'         => VRodos_Path_Manager::plugin_url( $takram_assets['cloudsTurbulencePath'] ),
			'takram_clouds_stbn_url'               => VRodos_Path_Manager::plugin_url( $takram_assets['cloudsStbnPath'] ),
			'browser_library_versions'              => $browser_libraries['versions'],
		];
	}

	public static function get_aframe_runtime_url(): string {
		$manifest        = self::get_manifest();
		$aframe          = $manifest['aframe'];
		$bundle_relative = (string) $aframe['bundlePath'];
		if ( self::LOCAL_AFRAME_RUNTIME_PATH !== $bundle_relative ) {
			throw new RuntimeException( '[VRodos] Runtime manifest does not point to the canonical local A-Frame bundle.' );
		}
		$path = VRodos_Path_Manager::plugin_path( $bundle_relative );
		if ( ! is_readable( $path ) ) {
			throw new RuntimeException( '[VRodos] Local A-Frame runtime is missing: ' . $path );
		}
		$expected = strtolower( (string) $aframe['sha256'] );
		$actual   = hash_file( 'sha256', $path );
		if ( ! is_string( $actual ) || ! hash_equals( $expected, strtolower( $actual ) ) ) {
			throw new RuntimeException( '[VRodos] Local A-Frame runtime hash does not match the version manifest.' );
		}

		$url      = VRodos_Path_Manager::plugin_url( $bundle_relative );
		$url_path = wp_parse_url( $url, PHP_URL_PATH );
		$query    = wp_parse_url( $url, PHP_URL_QUERY );
		return $url_path ? $url_path . ( $query ? '?' . $query : '' ) : $url;
	}

	public static function get_three_vendor_dir(): string {
		return self::get_config()['three_vendor_dir'];
	}

	public static function get_three_vendor_bundle(): string {
		return self::get_config()['three_vendor_bundle'];
	}

	public static function get_three_vendor_bundle_url(): string {
		return VRodos_Path_Manager::vendor_url( self::get_three_vendor_dir() . '/' . self::get_three_vendor_bundle() );
	}

	public static function validation_error(): ?string {
		try {
			self::get_config();
			self::get_aframe_runtime_url();
			return null;
		} catch ( Throwable $error ) {
			return $error->getMessage();
		}
	}

	public static function render_admin_notice(): void {
		if ( ! is_admin() || ! current_user_can( 'manage_options' ) ) {
			return;
		}

		foreach ( self::validation_errors() as $error ) {
			echo '<div class="notice notice-error"><p>' . esc_html( $error ) . '</p></div>';
		}
	}

	/** @return string[] */
	public static function validation_errors(): array {
		if ( null !== self::$validation_errors ) {
			return self::$validation_errors;
		}

		$errors = [];
		$version_error = self::validation_error();
		if ( null !== $version_error ) {
			$errors[] = $version_error;
		}

		try {
			require_once __DIR__ . '/class-vrodos-compiler-runtime-manifest.php';
			new VRodos_Compiler_Runtime_Manifest();
		} catch ( Throwable $error ) {
			$errors[] = $error->getMessage();
		}

		try {
			require_once __DIR__ . '/class-vrodos-runtime-settings-contract.php';
			VRodos_Runtime_Settings_Contract::all();
		} catch ( Throwable $error ) {
			$errors[] = $error->getMessage();
		}

		self::$validation_errors = array_values( array_unique( $errors ) );
		return self::$validation_errors;
	}

	private static function get_manifest(): array {
		if ( null !== self::$manifest ) {
			return self::$manifest;
		}
		$manifest_path = VRodos_Path_Manager::plugin_path( self::MANIFEST_RELATIVE_PATH );
		if ( ! is_readable( $manifest_path ) ) {
			throw new RuntimeException( '[VRodos] Runtime version manifest is missing: ' . $manifest_path );
		}
		$decoded = json_decode( (string) file_get_contents( $manifest_path ), true );
		if ( ! is_array( $decoded ) ) {
			throw new RuntimeException( '[VRodos] Runtime version manifest contains invalid JSON.' );
		}
		self::validate_manifest( $decoded );
		self::$manifest = $decoded;
		return self::$manifest;
	}

	private static function validate_manifest( array $manifest ): void {
		if ( 2 !== (int) ( $manifest['schemaVersion'] ?? 0 ) ) {
			throw new RuntimeException( '[VRodos] Unsupported runtime version manifest schema.' );
		}
		foreach ( [ 'aframe', 'three', 'threeAddons', 'postprocessing', 'takram', 'collisionBvh', 'browserLibraries' ] as $section ) {
			if ( ! is_array( $manifest[ $section ] ?? null ) ) {
				throw new RuntimeException( '[VRodos] Runtime version manifest is missing section: ' . $section );
			}
		}

		self::require_keys( $manifest['aframe'], [ 'label', 'source', 'version', 'commit', 'sourceCommit', 'artifactCommit', 'url', 'bundlePath', 'sha256', 'requestedPowerPreference' ], 'aframe' );
		self::require_keys( $manifest['three'], [ 'version', 'revision', 'vendorDir', 'bundleFile', 'bundlePath', 'decoders' ], 'three' );
		self::require_keys( $manifest['three']['decoders'], [ 'dracoDecoderPath', 'basisTranscoderPath', 'meshoptDecoderPath' ], 'three.decoders' );
		self::require_keys( $manifest['threeAddons'], [ 'global', 'bundleFile', 'bundlePath' ], 'threeAddons' );
		self::require_keys( $manifest['postprocessing'], [ 'version', 'bundlePath' ], 'postprocessing' );
		self::require_keys( $manifest['takram'], [ 'atmosphereVersion', 'cloudsVersion', 'effectsVersion', 'bundleFile', 'bundlePath', 'cloudsBundleFile', 'cloudsBundlePath', 'assets' ], 'takram' );
		self::require_keys( $manifest['takram']['assets'], [ 'starsDataPath', 'cloudsBasePath', 'cloudsLocalWeatherPath', 'cloudsShapePath', 'cloudsShapeDetailPath', 'cloudsTurbulencePath', 'cloudsStbnPath' ], 'takram.assets' );
		self::require_keys( $manifest['collisionBvh'], [ 'version', 'bundlePath' ], 'collisionBvh' );
		if ( ! is_array( $manifest['browserLibraries']['versions'] ?? null ) || empty( $manifest['browserLibraries']['versions'] ) || ! is_array( $manifest['browserLibraries']['files'] ?? null ) || empty( $manifest['browserLibraries']['files'] ) ) {
			throw new RuntimeException( '[VRodos] Runtime version manifest browser library provenance is incomplete.' );
		}
		self::require_keys( $manifest['browserLibraries']['versions'], [ 'aframe-extras', 'aframe-environment-component', 'stats-gl', 'lil-gui', 'lucide' ], 'browserLibraries.versions' );

		if ( 1 !== preg_match( '/^[a-f0-9]{64}$/', strtolower( (string) $manifest['aframe']['sha256'] ) ) ) {
			throw new RuntimeException( '[VRodos] Runtime version manifest has an invalid A-Frame hash.' );
		}
		foreach ( self::artifact_paths( $manifest ) as $relative_path ) {
			self::assert_safe_relative_path( $relative_path );
			if ( ! is_readable( VRodos_Path_Manager::plugin_path( $relative_path ) ) ) {
				throw new RuntimeException( '[VRodos] Runtime manifest artifact is missing: ' . $relative_path );
			}
		}
		self::validate_lockfile_versions( $manifest );
	}

	private static function require_keys( array $section, array $keys, string $label ): void {
		foreach ( $keys as $key ) {
			if ( ! array_key_exists( $key, $section ) ) {
				throw new RuntimeException( '[VRodos] Runtime version manifest is missing ' . $label . '.' . $key );
			}
			$value = $section[ $key ];
			if ( ( is_array( $value ) && empty( $value ) ) || ( ! is_array( $value ) && '' === trim( (string) $value ) ) ) {
				throw new RuntimeException( '[VRodos] Runtime version manifest is missing ' . $label . '.' . $key );
			}
		}
	}

	/** @return string[] */
	private static function artifact_paths( array $manifest ): array {
		$paths = [
			$manifest['aframe']['bundlePath'],
			$manifest['three']['bundlePath'],
			$manifest['threeAddons']['bundlePath'] ?? '',
			$manifest['postprocessing']['bundlePath'],
			$manifest['takram']['bundlePath'],
			$manifest['takram']['cloudsBundlePath'],
			$manifest['collisionBvh']['bundlePath'],
			$manifest['three']['decoders']['dracoDecoderPath'],
			$manifest['three']['decoders']['basisTranscoderPath'],
			$manifest['three']['decoders']['meshoptDecoderPath'],
			$manifest['takram']['assets']['starsDataPath'],
			$manifest['takram']['assets']['cloudsBasePath'],
			$manifest['takram']['assets']['cloudsLocalWeatherPath'],
			$manifest['takram']['assets']['cloudsShapePath'],
			$manifest['takram']['assets']['cloudsShapeDetailPath'],
			$manifest['takram']['assets']['cloudsTurbulencePath'],
			$manifest['takram']['assets']['cloudsStbnPath'],
		];
		$paths = array_merge( $paths, array_values( (array) $manifest['browserLibraries']['files'] ) );
		return array_values( array_filter( array_map( 'strval', $paths ) ) );
	}

	private static function assert_safe_relative_path( string $path ): void {
		$path = str_replace( '\\', '/', trim( $path ) );
		if (
			'' === $path ||
			str_starts_with( $path, '/' ) ||
			preg_match( '#^[a-z][a-z0-9+.-]*:#i', $path ) ||
			preg_match( '/%[0-9a-f]{2}/i', $path ) ||
			str_contains( $path, '?' ) ||
			str_contains( $path, '#' ) ||
			preg_match( '/[\x00-\x1f\x7f]/', $path ) ||
			in_array( '..', explode( '/', $path ), true )
		) {
			throw new RuntimeException( '[VRodos] Runtime version manifest contains an invalid path: ' . $path );
		}
	}

	private static function validate_lockfile_versions( array $manifest ): void {
		$lock_path = VRodos_Path_Manager::plugin_path( 'package-lock.json' );
		$lock      = is_readable( $lock_path ) ? json_decode( (string) file_get_contents( $lock_path ), true ) : null;
		if ( ! is_array( $lock['packages'] ?? null ) ) {
			throw new RuntimeException( '[VRodos] package-lock.json is required to validate runtime provenance.' );
		}
		$versions = [
			'three'                            => $manifest['three']['version'],
			'postprocessing'                   => $manifest['postprocessing']['version'],
			'@takram/three-atmosphere'         => $manifest['takram']['atmosphereVersion'],
			'@takram/three-clouds'             => $manifest['takram']['cloudsVersion'],
			'@takram/three-geospatial-effects' => $manifest['takram']['effectsVersion'],
			'three-mesh-bvh'                   => $manifest['collisionBvh']['version'],
		];
		foreach ( (array) ( $manifest['browserLibraries']['versions'] ?? [] ) as $package_name => $version ) {
			$versions[ (string) $package_name ] = (string) $version;
		}
		foreach ( $versions as $package_name => $manifest_version ) {
			$locked = (string) ( $lock['packages'][ 'node_modules/' . $package_name ]['version'] ?? '' );
			if ( '' === $locked || $locked !== (string) $manifest_version ) {
				throw new RuntimeException( '[VRodos] Runtime version drift for ' . $package_name . ': manifest=' . $manifest_version . ', lock=' . ( $locked ?: 'missing' ) );
			}
		}
	}
}
