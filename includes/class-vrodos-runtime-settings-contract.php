<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Runtime_Settings_Contract {
	private const CONTRACT_RELATIVE_PATH = 'assets/runtime-settings-contract.json';

	private static ?array $contract = null;

	public static function all(): array {
		if ( null !== self::$contract ) {
			return self::$contract;
		}

		$path = VRodos_Path_Manager::plugin_path( self::CONTRACT_RELATIVE_PATH );
		if ( ! is_readable( $path ) ) {
			self::$contract = [
				'schemaVersion' => 0,
				'sceneSettings' => [],
				'horizonHelperLightPresets' => [],
			];
			return self::$contract;
		}

		$decoded = json_decode( (string) file_get_contents( $path ), true );
		self::$contract = is_array( $decoded ) ? $decoded : [
			'schemaVersion' => 0,
			'sceneSettings' => [],
			'horizonHelperLightPresets' => [],
		];

		return self::$contract;
	}

	public static function settings(): array {
		$contract = self::all();
		return is_array( $contract['sceneSettings'] ?? null ) ? $contract['sceneSettings'] : [];
	}

	public static function setting( string $scene_setting_key ): array {
		$settings = self::settings();
		return is_array( $settings[ $scene_setting_key ] ?? null ) ? $settings[ $scene_setting_key ] : [];
	}

	public static function default( string $scene_setting_key, $fallback = null, string $default_key = 'default' ) {
		$setting = self::setting( $scene_setting_key );
		return array_key_exists( $default_key, $setting ) ? $setting[ $default_key ] : $fallback;
	}

	public static function metadata_key( string $scene_setting_key ): string {
		$setting = self::setting( $scene_setting_key );
		return (string) ( $setting['metadataKey'] ?? $scene_setting_key );
	}

	public static function value_from_metadata( $metadata, string $scene_setting_key, $fallback = null ) {
		$metadata_key = self::metadata_key( $scene_setting_key );
		if ( is_object( $metadata ) && property_exists( $metadata, $metadata_key ) ) {
			return $metadata->{$metadata_key};
		}

		return null !== $fallback ? $fallback : self::default( $scene_setting_key );
	}

	public static function normalize( string $scene_setting_key, $value, $fallback = null ) {
		$setting = self::setting( $scene_setting_key );
		$type    = (string) ( $setting['type'] ?? 'string' );
		$default = null !== $fallback ? $fallback : ( $setting['default'] ?? null );

		if ( 'enum' === $type ) {
			$allowed = is_array( $setting['allowed'] ?? null ) ? $setting['allowed'] : [];
			return in_array( $value, $allowed, true ) ? $value : $default;
		}

		if ( 'number' === $type ) {
			$number = is_numeric( $value ) ? (float) $value : (float) $default;
			if ( isset( $setting['min'] ) ) {
				$number = max( (float) $setting['min'], $number );
			}
			if ( isset( $setting['max'] ) ) {
				$number = min( (float) $setting['max'], $number );
			}
			return $number;
		}

		if ( 'boolean' === $type ) {
			return self::normalize_bool( $value, (bool) $default );
		}

		if ( 'color' === $type ) {
			return self::normalize_color( $value, (string) $default );
		}

		return null === $value ? $default : $value;
	}

	public static function normalize_metadata_value( $metadata, string $scene_setting_key, $fallback = null ) {
		return self::normalize(
			$scene_setting_key,
			self::value_from_metadata( $metadata, $scene_setting_key, $fallback ),
			$fallback
		);
	}

	public static function normalize_bool( $value, bool $fallback = false ): bool {
		if ( is_bool( $value ) ) {
			return $value;
		}

		if ( null === $value ) {
			return $fallback;
		}

		$filtered = filter_var( $value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE );
		return null === $filtered ? $fallback : $filtered;
	}

	public static function normalize_color( $value, string $fallback ): string {
		$raw = trim( (string) $value );
		if ( ! preg_match( '/^#?[0-9a-fA-F]{6}$/', $raw ) ) {
			return $fallback;
		}

		return '#' . strtolower( ltrim( $raw, '#' ) );
	}

	public static function bool_string( $value, bool $fallback = false, string $true = 'true', string $false = 'false' ): string {
		return self::normalize_bool( $value, $fallback ) ? $true : $false;
	}

	public static function horizon_helper_defaults( string $preset ): array {
		$contract = self::all();
		$presets  = is_array( $contract['horizonHelperLightPresets'] ?? null ) ? $contract['horizonHelperLightPresets'] : [];
		$preset   = in_array( $preset, [ 'natural', 'clear', 'crisp' ], true ) ? $preset : 'natural';
		$defaults = is_array( $presets[ $preset ] ?? null ) ? $presets[ $preset ] : [];

		return [
			'keyLightIntensity'  => (float) ( $defaults['keyLightIntensity'] ?? 1.15 ),
			'fillLightIntensity' => (float) ( $defaults['fillLightIntensity'] ?? 0.45 ),
		];
	}
}
