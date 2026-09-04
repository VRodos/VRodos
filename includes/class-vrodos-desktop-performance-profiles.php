<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-vrodos-runtime-settings-contract.php';

/**
 * Resolves the desktop Custom build and the three adaptive performance tiers.
 */
final class VRodos_Desktop_Performance_Profiles {
	private const CONTRACT_RELATIVE_PATH = 'assets/desktop-performance-profiles.json';
	private const METADATA_KEY = 'desktopPerformanceProfiles';
	private static ?array $contract = null;

	public static function contract(): array {
		if ( null !== self::$contract ) {
			return self::$contract;
		}

		$path = VRodos_Path_Manager::plugin_path( self::CONTRACT_RELATIVE_PATH );
		$decoded = is_readable( $path ) ? json_decode( (string) file_get_contents( $path ), true ) : null;
		if ( ! is_array( $decoded ) || 2 !== (int) ( $decoded['schemaVersion'] ?? 0 ) || ! is_array( $decoded['profiles'] ?? null ) || ! is_array( $decoded['custom'] ?? null ) ) {
			throw new RuntimeException( '[VRodos] Desktop performance profile contract is invalid.' );
		}

		self::$contract = $decoded;
		return self::$contract;
	}

	/** @return array<string,array<string,mixed>> */
	public static function resolve( $metadata, array $authored_settings ): array {
		$contract = self::contract();
		$stored_state = self::migrate_stored_state( self::stored_state( $metadata ) );
		$stored_validation_errors = self::validate_stored_state( $stored_state );
		$stored = is_array( $stored_state['profiles'] ?? null ) ? $stored_state['profiles'] : [];
		$custom_settings = $authored_settings;
		if ( is_array( $stored_state['migratedCustomSettings'] ?? null ) ) {
			$custom_settings = array_merge( $custom_settings, self::normalize_settings( $stored_state['migratedCustomSettings'] ) );
		}

		$custom_definition = (array) $contract['custom'];
		$profiles = [
			'custom' => [
				'id'          => 'custom',
				'label'       => (string) ( $custom_definition['label'] ?? 'Custom' ),
				'presetState' => 'default',
				'settings'    => $custom_settings,
				'assets'      => self::asset_definition( $custom_definition, 'desktop-custom' ),
				'renderBudget' => [ 'pixelBudget' => null, 'minPixelRatio' => 0.75, 'maxPixelRatio' => 1.5 ],
			],
		];
		$high_preset = array_merge( $custom_settings, self::normalize_settings( (array) ( $contract['profiles']['high']['settings'] ?? [] ) ) );

		foreach ( [ 'high', 'medium', 'low' ] as $profile_id ) {
			$definition = (array) ( $contract['profiles'][ $profile_id ] ?? [] );
			$stored_profile = (array) ( $stored[ $profile_id ] ?? [] );
			$preset = 'high' === $profile_id
				? $high_preset
				: array_merge( $high_preset, self::normalize_settings( (array) ( $definition['settings'] ?? [] ) ) );
			$settings = array_merge( $preset, self::normalize_settings( (array) ( $stored_profile['settings'] ?? [] ) ) );
			$profiles[ $profile_id ] = [
				'id'          => $profile_id,
				'label'       => (string) ( $definition['label'] ?? ucfirst( $profile_id ) ),
				'presetState' => self::preset_state( $stored_profile, $preset ),
				'settings'    => $settings,
				'assets'      => self::asset_definition( $definition, 'desktop-' . $profile_id ),
				'renderBudget' => [
					'pixelBudget'  => $definition['renderPixelBudget'] ?? null,
					'minPixelRatio' => (float) ( $definition['minPixelRatio'] ?? 0.75 ),
					'maxPixelRatio' => (float) ( $definition['maxPixelRatio'] ?? 1.5 ),
				],
			];
		}

		self::apply_shared_feature_caps( $profiles, $custom_settings );
		self::apply_adaptive_tier_caps( $profiles );
		$build_mode = 'custom' === (string) ( $stored_state['buildMode'] ?? '' ) ? 'custom' : 'adaptive';
		return [
			'schemaVersion' => 2,
			'buildMode'     => $build_mode,
			'activeTab'     => in_array( (string) ( $stored_state['activeTab'] ?? '' ), [ 'custom', 'low', 'medium', 'high' ], true ) ? (string) $stored_state['activeTab'] : 'custom',
			'defaultProfile' => 'custom' === $build_mode ? 'custom' : 'high',
			'profiles'      => $profiles,
			'selection'     => (array) ( $contract['selection'] ?? [] ),
			'storageKey'    => (string) ( $contract['storageKey'] ?? 'vrodos.desktopQualityOverride.v1' ),
			'queryParameter' => (string) ( $contract['queryParameter'] ?? 'vrodos_quality' ),
			'sessionDowngradeKey' => (string) ( $contract['sessionDowngradeKey'] ?? 'vrodos.desktopQualityDowngrade.v1' ),
			'validationErrors'    => $stored_validation_errors,
		];
	}

	private static function migrate_stored_state( array $state ): array {
		if ( 2 === (int) ( $state['schemaVersion'] ?? 0 ) ) {
			return $state;
		}

		$active = in_array( (string) ( $state['activeProfile'] ?? '' ), [ 'low', 'medium', 'high' ], true ) ? (string) $state['activeProfile'] : 'high';
		$adaptive = false !== ( $state['autoSelect'] ?? true );
		$raw_profiles = is_array( $state['profiles'] ?? null ) ? $state['profiles'] : [];
		$profiles = $raw_profiles;
		foreach ( [ 'low', 'medium', 'high' ] as $profile_id ) {
			$editable = array_fill_keys( (array) ( self::contract()['profiles'][ $profile_id ]['editableSettings'] ?? [] ), true );
			$profile = (array) ( $profiles[ $profile_id ] ?? [] );
			foreach ( [ 'settings', 'presetSettings' ] as $field ) {
				$profile[ $field ] = array_intersect_key( (array) ( $profile[ $field ] ?? [] ), $editable );
			}
			$profiles[ $profile_id ] = $profile;
		}
		$migrated = [
			'schemaVersion' => 2,
			'buildMode'     => $adaptive ? 'adaptive' : 'custom',
			'activeTab'     => $adaptive ? $active : 'custom',
			'profiles'      => $profiles,
		];
		if ( ! $adaptive ) {
			$migrated['migratedCustomSettings'] = (array) ( $raw_profiles[ $active ]['settings'] ?? [] );
		}
		return $migrated;
	}

	private static function asset_definition( array $definition, string $fallback ): array {
		return [
			'profile'          => (string) ( $definition['assetProfile'] ?? $fallback ),
			'textureMaxSize'   => $definition['textureMaxSize'] ?? null,
			'textureMemoryMiB' => $definition['textureMemoryBudgetMiB'] ?? null,
			'geometryRatio'    => (float) ( $definition['geometryRatio'] ?? 1 ),
		];
	}

	/** @return string[] */
	public static function validate_monotonic( array $resolved ): array {
		if ( 'adaptive' !== (string) ( $resolved['buildMode'] ?? 'adaptive' ) ) {
			return [];
		}
		$profiles = (array) ( $resolved['profiles'] ?? [] );
		$low = (array) ( $profiles['low']['settings'] ?? [] );
		$medium = (array) ( $profiles['medium']['settings'] ?? [] );
		$high = (array) ( $profiles['high']['settings'] ?? [] );
		$errors = array_merge( (array) ( $resolved['validationErrors'] ?? [] ), self::validate_allowed_values( $profiles ) );
		$orders = [
			'renderQuality'            => [ 'performance', 'standard', 'high' ],
			'shadowQuality'            => [ 'off', 'medium', 'high' ],
			'shadowUpdateMode'         => [ 'static', 'dynamic' ],
			'aaQuality'                => [ 'off', 'balanced', 'high', 'ultra' ],
			'ambientOcclusionPreset'   => [ 'off', 'soft', 'balanced', 'strong' ],
			'contactShadowPreset'      => [ 'off', 'soft', 'balanced', 'strong' ],
			'postFXSSRStrength'        => [ 'off', 'subtle', 'balanced', 'strong' ],
			'bloomStrength'            => [ 'off', 'soft', 'medium' ],
			'reflectionProfile'        => [ 'soft', 'balanced', 'enhanced' ],
			'reflectionSource'         => [ 'hdr', 'scene-probe' ],
			'sceneProbeResolution'     => [ '64', '128', '256' ],
			'sceneProbeUpdateMode'     => [ 'static', 'slow-dynamic' ],
			'pmndrsAAMode'             => [ 'none', 'smaa', 'msaa' ],
			'pmndrsAAPreset'           => [ 'low', 'medium', 'high', 'ultra' ],
			'pmndrsAtmosphereQuality'  => [ 'performance', 'balanced', 'quality', 'cinematic' ],
			'pmndrsCloudsQuality'      => [ 'low', 'medium', 'high', 'ultra' ],
		];

		foreach ( $orders as $key => $order ) {
			$low_cost = self::ordered_cost( $key, $low, $order );
			$medium_cost = self::ordered_cost( $key, $medium, $order );
			$high_cost = self::ordered_cost( $key, $high, $order );
			if ( false === $low_cost || false === $medium_cost || false === $high_cost || $low_cost > $medium_cost || $medium_cost > $high_cost ) {
				$errors[] = sprintf( 'Desktop profile setting "%s" must not increase from High to Medium to Low.', $key );
			}
		}

		foreach ( [
			'flatMediaShadowCasting', 'postFXEnabled', 'postFXBloomEnabled', 'postFXEdgeAAEnabled', 'postFXTAAEnabled',
			'postFXSSREnabled', 'pmndrsLensFlareEnabled', 'pmndrsLutEnabled', 'pmndrsVignetteEnabled', 'pmndrsNoiseEnabled',
			'pmndrsChromaticAberrationEnabled', 'pmndrsAerialPerspectiveEnabled',
			'pmndrsAtmosphereEnabled',
			'pmndrsCloudsEnabled', 'pmndrsCloudsLightShaftsEnabled', 'reflectionsEnabled',
		] as $key ) {
			$low_cost = self::truthy( $low[ $key ] ?? false ) ? 1 : 0;
			$medium_cost = self::truthy( $medium[ $key ] ?? false ) ? 1 : 0;
			$high_cost = self::truthy( $high[ $key ] ?? false ) ? 1 : 0;
			if ( $low_cost > $medium_cost || $medium_cost > $high_cost ) {
				$errors[] = sprintf( 'Desktop profile setting "%s" must not be enabled below a tier where it is disabled.', $key );
			}
		}

		return array_values( array_unique( $errors ) );
	}

	private static function validate_allowed_values( array $profiles ): array {
		$errors = [];
		foreach ( [ 'low', 'medium' ] as $profile_id ) {
			$definition = (array) ( self::contract()['profiles'][ $profile_id ] ?? [] );
			$settings = (array) ( $profiles[ $profile_id ]['settings'] ?? [] );
			foreach ( (array) ( $definition['allowedValues'] ?? [] ) as $key => $allowed ) {
				$value = $settings[ $key ] ?? null;
				$matches = false;
				foreach ( (array) $allowed as $candidate ) {
					if ( is_bool( $candidate ) ? self::truthy( $value ) === $candidate : (string) $value === (string) $candidate ) {
						$matches = true;
						break;
					}
				}
				if ( ! $matches ) {
					$errors[] = sprintf( 'Desktop %s setting "%s" is outside its allowed quality range.', ucfirst( $profile_id ), $key );
				}
			}
		}
		return $errors;
	}

	private static function validate_stored_state( array $state ): array {
		$errors = [];
		foreach ( [ 'low', 'medium', 'high' ] as $profile_id ) {
			$definition = (array) ( self::contract()['profiles'][ $profile_id ] ?? [] );
			$editable = array_fill_keys( (array) ( $definition['editableSettings'] ?? [] ), true );
			$settings = (array) ( $state['profiles'][ $profile_id ]['settings'] ?? [] );
			foreach ( $settings as $key => $value ) {
				if ( empty( $editable[ $key ] ) ) {
					$errors[] = sprintf( 'Desktop %s setting "%s" is fixed by its tier.', ucfirst( $profile_id ), $key );
					continue;
				}
				$runtime_definition = VRodos_Runtime_Settings_Contract::setting( (string) $key );
				$allowed = (array) ( $definition['allowedValues'][ $key ] ?? ( is_array( $runtime_definition ) ? ( $runtime_definition['allowed'] ?? [] ) : [] ) );
				if ( ! $allowed ) {
					continue;
				}
				$matches = false;
				foreach ( $allowed as $candidate ) {
					if ( is_bool( $candidate ) ? self::truthy( $value ) === $candidate : (string) $value === (string) $candidate ) {
						$matches = true;
						break;
					}
				}
				if ( ! $matches ) {
					$errors[] = sprintf( 'Desktop %s setting "%s" is outside its allowed quality range.', ucfirst( $profile_id ), $key );
				}
			}
		}
		return array_values( array_unique( $errors ) );
	}

	private static function stored_state( $metadata ): array {
		$metadata_key = self::METADATA_KEY;
		$raw = is_object( $metadata ) && property_exists( $metadata, $metadata_key )
			? $metadata->{$metadata_key}
			: [];
		if ( is_object( $raw ) ) {
			$raw = json_decode( wp_json_encode( $raw ), true );
		}
		return is_array( $raw ) ? $raw : [];
	}

	private static function normalize_settings( array $settings ): array {
		$managed = array_fill_keys( (array) ( self::contract()['managedSettings'] ?? [] ), true );
		$normalized = [];
		foreach ( $settings as $key => $value ) {
			$key = (string) $key;
			if ( empty( $managed[ $key ] ) ) {
				continue;
			}
			$definition = VRodos_Runtime_Settings_Contract::setting( $key );
			if ( ! $definition ) {
				continue;
			}
			$value = VRodos_Runtime_Settings_Contract::normalize( $key, $value );
			if ( 'boolean' === (string) ( $definition['type'] ?? '' ) ) {
				$value = self::format_bool( $value, (string) ( $definition['wireFormat'] ?? 'true-false' ) );
			}
			$normalized[ VRodos_Runtime_Settings_Contract::wire_key( $key ) ] = $value;
		}
		return $normalized;
	}

	private static function apply_shared_feature_caps( array &$profiles, array $custom ): void {
		foreach ( [
			'postFXEnabled', 'postFXBloomEnabled', 'postFXEdgeAAEnabled', 'postFXTAAEnabled', 'postFXSSREnabled',
			'pmndrsLensFlareEnabled', 'pmndrsLutEnabled', 'pmndrsVignetteEnabled', 'pmndrsNoiseEnabled',
			'pmndrsChromaticAberrationEnabled', 'pmndrsAtmosphereEnabled', 'pmndrsAerialPerspectiveEnabled',
			'pmndrsCloudsEnabled', 'pmndrsCloudsLightShaftsEnabled', 'reflectionsEnabled',
		] as $key ) {
			if ( self::truthy( $custom[ $key ] ?? false ) ) {
				continue;
			}
			foreach ( [ 'low', 'medium', 'high' ] as $profile_id ) {
				$definition = VRodos_Runtime_Settings_Contract::setting( $key );
				$profiles[ $profile_id ]['settings'][ VRodos_Runtime_Settings_Contract::wire_key( $key ) ] = self::format_bool( false, (string) ( $definition['wireFormat'] ?? 'true-false' ) );
			}
		}
	}

	private static function apply_adaptive_tier_caps( array &$profiles ): void {
		$high = &$profiles['high']['settings'];
		$orders = [
			'shadowQuality'           => [ 'off', 'medium', 'high' ],
			'shadowUpdateMode'        => [ 'static', 'dynamic' ],
			'aaQuality'               => [ 'off', 'balanced', 'high', 'ultra' ],
			'ambientOcclusionPreset'  => [ 'off', 'soft', 'balanced', 'strong' ],
			'contactShadowPreset'     => [ 'off', 'soft', 'balanced', 'strong' ],
			'postFXSSRStrength'       => [ 'off', 'subtle', 'balanced', 'strong' ],
			'bloomStrength'           => [ 'off', 'soft', 'medium' ],
			'reflectionProfile'       => [ 'soft', 'balanced', 'enhanced' ],
			'reflectionSource'        => [ 'hdr', 'scene-probe' ],
			'sceneProbeResolution'    => [ '64', '128', '256' ],
			'sceneProbeUpdateMode'    => [ 'static', 'slow-dynamic' ],
			'pmndrsAAMode'            => [ 'none', 'smaa', 'msaa' ],
			'pmndrsAAPreset'          => [ 'low', 'medium', 'high', 'ultra' ],
			'pmndrsAtmosphereQuality' => [ 'performance', 'balanced', 'quality', 'cinematic' ],
			'pmndrsCloudsQuality'     => [ 'low', 'medium', 'high', 'ultra' ],
		];
		$boolean_keys = [
			'flatMediaShadowCasting', 'postFXEnabled', 'postFXBloomEnabled', 'postFXEdgeAAEnabled',
			'postFXTAAEnabled', 'postFXSSREnabled', 'pmndrsLensFlareEnabled', 'pmndrsLutEnabled',
			'pmndrsVignetteEnabled', 'pmndrsNoiseEnabled', 'pmndrsChromaticAberrationEnabled',
			'pmndrsAtmosphereEnabled', 'pmndrsAerialPerspectiveEnabled', 'pmndrsCloudsLightShaftsEnabled', 'reflectionsEnabled',
		];
		foreach ( [ 'low', 'medium' ] as $profile_id ) {
			$settings = &$profiles[ $profile_id ]['settings'];
			foreach ( $orders as $key => $order ) {
				$high_cost = self::ordered_cost( $key, $high, $order );
				$cost = self::ordered_cost( $key, $settings, $order );
				if ( false !== $high_cost && false !== $cost && $cost > $high_cost ) {
					$settings[ $key ] = $high[ $key ];
				}
			}
			foreach ( $boolean_keys as $key ) {
				if ( ! self::truthy( $high[ $key ] ?? false ) ) {
					$definition = VRodos_Runtime_Settings_Contract::setting( $key );
					$settings[ VRodos_Runtime_Settings_Contract::wire_key( $key ) ] = self::format_bool( false, (string) ( $definition['wireFormat'] ?? 'true-false' ) );
				}
			}
		}
		$clouds = self::truthy( $high['pmndrsCloudsEnabled'] ?? false );
		$atmosphere = self::truthy( $high['pmndrsAtmosphereEnabled'] ?? false );
		$reflections = self::truthy( $high['reflectionsEnabled'] ?? true );
		foreach ( [ 'low', 'medium' ] as $profile_id ) {
			$settings = &$profiles[ $profile_id ]['settings'];
			$settings['pmndrsAtmosphereEnabled'] = $atmosphere && self::truthy( $settings['pmndrsAtmosphereEnabled'] ?? false ) ? 'true' : 'false';
			$settings['pmndrsCloudsEnabled'] = $clouds && self::truthy( $settings['pmndrsCloudsEnabled'] ?? false ) ? 'true' : 'false';
			if ( self::truthy( $settings['pmndrsCloudsEnabled'] ) ) {
				// Takram clouds are composited by the PMNDRS adapter. No other Low
				// post effect is enabled by this technical requirement.
				$settings['postFXEnabled'] = '1';
				$settings['postFXEngine'] = 'pmndrs';
			}
			$settings['reflectionsEnabled'] = $reflections && self::truthy( $settings['reflectionsEnabled'] ?? false ) ? '1' : '0';
		}
	}

	private static function preset_state( array $stored_profile, array $template ): string {
		$custom = (array) ( $stored_profile['settings'] ?? [] );
		if ( ! $custom ) {
			return 'default';
		}
		$normalized_custom = self::normalize_settings( $custom );
		$preset = (array) ( $stored_profile['presetSettings'] ?? $template );
		$normalized_template = self::normalize_settings( $preset );
		ksort( $normalized_custom );
		ksort( $normalized_template );
		return $normalized_custom === $normalized_template ? 'default' : 'modified';
	}

	private static function truthy( $value ): bool {
		return VRodos_Runtime_Settings_Contract::normalize_bool( $value, false );
	}

	private static function ordered_cost( string $key, array $settings, array $order ) {
		$value = (string) ( $settings[ $key ] ?? $order[0] );
		if ( 'pmndrsAAMode' === $key && 'inherit' === $value ) {
			$value = 'off' === (string) ( $settings['aaQuality'] ?? 'balanced' ) ? 'none' : 'msaa';
		}
		if ( 'pmndrsAAPreset' === $key && 'inherit' === $value ) {
			$value = [
				'off'      => 'low',
				'balanced' => 'medium',
				'high'     => 'high',
				'ultra'    => 'ultra',
			][ (string) ( $settings['aaQuality'] ?? 'balanced' ) ] ?? 'medium';
		}
		return array_search( $value, $order, true );
	}

	private static function format_bool( $value, string $format ) {
		$bool = self::truthy( $value );
		if ( 'one-zero' === $format ) {
			return $bool ? '1' : '0';
		}
		if ( 'native-boolean' === $format ) {
			return $bool;
		}
		return $bool ? 'true' : 'false';
	}
}
