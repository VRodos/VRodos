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
			throw new RuntimeException( '[VRodos] Runtime settings contract is missing: ' . $path );
		}

		$decoded = json_decode( (string) file_get_contents( $path ), true );
		if ( ! is_array( $decoded ) || 2 !== (int) ( $decoded['schemaVersion'] ?? 0 ) || ! is_array( $decoded['sceneSettings'] ?? null ) ) {
			throw new RuntimeException( '[VRodos] Runtime settings contract is invalid or uses an unsupported schema.' );
		}
		$wire_keys = [];
		foreach ( $decoded['sceneSettings'] as $setting_key => $setting ) {
			$wire_key = is_array( $setting ) ? (string) ( $setting['wireKey'] ?? '' ) : '';
			if ( '' === $wire_key || ! preg_match( '/^[A-Za-z][A-Za-z0-9_]*$/', $wire_key ) ) {
				throw new RuntimeException( '[VRodos] Runtime setting has an invalid wire key: ' . $setting_key );
			}
			if ( isset( $wire_keys[ $wire_key ] ) ) {
				throw new RuntimeException( '[VRodos] Runtime settings share a wire key: ' . $wire_key );
			}
			$wire_keys[ $wire_key ] = true;
			if ( array_key_exists( 'wireEnabled', $setting ) && ! is_bool( $setting['wireEnabled'] ) ) {
				throw new RuntimeException( '[VRodos] Runtime setting has an invalid wire-enabled declaration: ' . $setting_key );
			}
			if ( 'boolean' === (string) ( $setting['type'] ?? '' ) && ! in_array( (string) ( $setting['wireFormat'] ?? '' ), [ 'true-false', 'one-zero', 'native-boolean' ], true ) ) {
				throw new RuntimeException( '[VRodos] Runtime boolean setting has no supported wire format: ' . $setting_key );
			}
		}
		self::$contract = $decoded;

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

	public static function wire_key( string $scene_setting_key ): string {
		$setting = self::setting( $scene_setting_key );
		return (string) ( $setting['wireKey'] ?? $scene_setting_key );
	}

	/** Builds the ordinary scene-settings wire values from the contract. */
	public static function wire_settings_from_metadata( $metadata ): array {
		$settings = [];
		foreach ( self::settings() as $setting_key => $definition ) {
			if ( ! is_array( $definition ) || false === ( $definition['wireEnabled'] ?? true ) ) {
				continue;
			}
			$value = self::normalize_metadata_value( $metadata, (string) $setting_key );
			if ( 'boolean' === (string) ( $definition['type'] ?? '' ) ) {
				$value = self::format_boolean_wire_value( $value, (string) $definition['wireFormat'] );
			}
			$settings[ (string) $definition['wireKey'] ] = $value;
		}
		return $settings;
	}

	private static function format_boolean_wire_value( $value, string $format ) {
		$normalized = self::normalize_bool( $value, false );
		if ( 'one-zero' === $format ) {
			return $normalized ? '1' : '0';
		}
		if ( 'native-boolean' === $format ) {
			return $normalized;
		}
		return $normalized ? 'true' : 'false';
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

		if ( 'vrRuntimeProfile' === $scene_setting_key ) {
			$profile = strtolower( trim( (string) $value ) );
			$allowed = is_array( $setting['allowed'] ?? null ) ? $setting['allowed'] : [];
			if ( in_array( $profile, $allowed, true ) ) {
				return $profile;
			}
			if ( in_array( $profile, [ 'baseline', 'safe', 'takram-lights', 'takram-sky', 'hdr-reflections', 'balanced', 'max' ], true ) ) {
				return 'headset';
			}
		}

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
			if ( isset( $setting['step'] ) && is_numeric( $setting['step'] ) && (float) $setting['step'] > 0 ) {
				$step = (float) $setting['step'];
				$base = isset( $setting['min'] ) ? (float) $setting['min'] : 0.0;
				$number = $base + round( ( $number - $base ) / $step ) * $step;
				$number = round( $number, 6 );
				if ( isset( $setting['min'] ) ) {
					$number = max( (float) $setting['min'], $number );
				}
				if ( isset( $setting['max'] ) ) {
					$number = min( (float) $setting['max'], $number );
				}
			}
			return $number;
		}

		if ( 'boolean' === $type ) {
			return self::normalize_bool( $value, (bool) $default );
		}

		if ( 'color' === $type ) {
			return self::normalize_color( $value, (string) $default );
		}

		if ( isset( $setting['pattern'] ) && ! preg_match( '/' . str_replace( '/', '\\/', (string) $setting['pattern'] ) . '/', (string) $value ) ) {
			return $default;
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

	/**
	 * Builds editor hydration values from the same metadata keys and defaults used
	 * by compilation. Compatibility/derived editor rules may refine this result.
	 */
	public static function hydrate_editor_metadata( $metadata ): array {
		$hydrated = [];
		foreach ( self::settings() as $setting_key => $setting ) {
			if ( ! is_array( $setting ) || empty( $setting['metadataKey'] ) ) {
				continue;
			}
			$hydrated[ (string) $setting['metadataKey'] ] = self::normalize_metadata_value( $metadata, (string) $setting_key );
		}

		return $hydrated;
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
