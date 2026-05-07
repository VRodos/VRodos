<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Compiler_Scene_Settings {
	private VRodos_Compiler_Scene_Repository $scene_repository;

	public function __construct( VRodos_Compiler_Scene_Repository $scene_repository ) {
		$this->scene_repository = $scene_repository;
	}

	public function apply( DOMDocument $dom, DOMElement $ascene, $scene_json, int $project_id, callable $normalize_url ): void {
		$metadata = is_object( $scene_json->metadata ?? null ) ? $scene_json->metadata : new stdClass();
		$settings = $this->build_settings( $metadata, $scene_json, $project_id );

		$ascene->setAttribute( 'scene-settings', $this->serialize_settings( $settings, $metadata ) );

		if ( '3' === (string) $settings['selChoice'] && ! empty( $metadata->backgroundImagePath ) ) {
			$a_asset     = $this->get_or_create_assets_container( $dom, $ascene );
			$a_asset_sky = $dom->createElement( 'img' );
			$a_asset_sky->setAttribute( 'id', 'custom_sky' );
			$a_asset_sky->setAttribute( 'src', (string) call_user_func( $normalize_url, $metadata->backgroundImagePath ) );
			$a_asset_sky->setAttribute( 'crossorigin', 'anonymous' );
			$a_asset->appendChild( $a_asset_sky );
		}

		$ascene->setAttribute( 'background', 'color: ' . $settings['color'] );

		if ( (string) $settings['fogCategory'] !== '0' ) {
			$fog_type  = ( (string) $settings['fogCategory'] === '1' ) ? 'linear' : 'exponential';
			$fog_color = '#' . ltrim( (string) $settings['fogcolor'], '#' );
			$ascene->setAttribute(
				'fog',
				'type: ' . $fog_type . '; color: ' . $fog_color . '; far: ' . $settings['fogfar'] . '; density: ' . ( 1.5 * (float) $settings['fogdensity'] ) . '; near: ' . $settings['fognear']
			);
		} else {
			$ascene->removeAttribute( 'fog' );
		}
	}

	public function build_settings( $metadata, $scene_json, int $project_id ): array {
		$project_type_slug    = $this->scene_repository->get_project_type_slug( $project_id );
		$post_fx_enabled_bool = VRodos_Runtime_Settings_Contract::normalize_bool( $metadata->aframePostFXEnabled ?? false );
		$post_fx_engine       = ( $post_fx_enabled_bool && ( $metadata->aframePostFXEngine ?? 'legacy' ) === 'pmndrs' ) ? 'pmndrs' : 'legacy';
		$horizon_preset       = $this->enum_value( $metadata->aframeHorizonSkyPreset ?? 'natural', [ 'natural', 'clear', 'crisp' ], 'natural' );
		$horizon_defaults     = VRodos_Runtime_Settings_Contract::horizon_helper_defaults( $horizon_preset );
		$atmosphere_preset    = VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsAtmospherePreset' );
		$celestial_mode       = VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsCelestialMode' );
		$celestial_time       = VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsCelestialTimePreset' );
		if ( 'datetime' !== $celestial_mode && 'custom' !== $atmosphere_preset ) {
			$celestial_mode = 'preset-time';
			$celestial_time = $atmosphere_preset;
		}
		$moon_explicit        = property_exists( $metadata, VRodos_Runtime_Settings_Contract::metadata_key( 'pmndrsMoonEnabled' ) );
		$moon_enabled         = $moon_explicit
			? VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsMoonEnabled' )
			: ( 'preset-time' === $celestial_mode && 'night' === $celestial_time );

		$camera_position = isset( $scene_json->objects->avatarCamera )
			? implode( ' ', (array) $scene_json->objects->avatarCamera->position )
			: '0 1.6 0';
		$camera_rotation_y = isset( $scene_json->objects->avatarCamera )
			? ( 180 / pi() * $scene_json->objects->avatarCamera->rotation[1] )
			: '0';

		return [
			'color'                              => $metadata->ClearColor ?? '#ffffff',
			'pr_type'                            => $project_type_slug,
			'selChoice'                          => $metadata->backgroundStyleOption ?? '0',
			'presChoice'                         => $metadata->backgroundPresetOption ?? 'None',
			'presetGroundEnabled'                => VRodos_Runtime_Settings_Contract::bool_string( $metadata->backgroundPresetGroundEnabled ?? false, false, '1', '0' ),
			'movement_disabled'                  => VRodos_Runtime_Settings_Contract::bool_string( $metadata->disableMovement ?? false ),
			'avatar_enabled'                     => VRodos_Runtime_Settings_Contract::bool_string( $metadata->enableAvatar ?? false ),
			'collisionMode'                      => $metadata->aframeCollisionMode ?? 'auto',
			'renderQuality'                      => $metadata->aframeRenderQuality ?? 'standard',
			'shadowQuality'                      => $metadata->aframeShadowQuality ?? 'medium',
			'aaQuality'                          => $metadata->aframeAAQuality ?? 'balanced',
			'fpsMeterEnabled'                    => $this->fps_meter_enabled( $metadata ),
			'legacyHorizonStageSize'             => max( 500, min( 8000, (int) ( $metadata->aframeLegacyHorizonStageSize ?? 5000 ) ) ),
			'ambientOcclusionPreset'             => $this->enum_value( $metadata->aframeAmbientOcclusionPreset ?? 'balanced', [ 'off', 'soft', 'balanced', 'strong' ], 'balanced' ),
			'contactShadowPreset'                => $this->enum_value( $metadata->aframeContactShadowPreset ?? 'soft', [ 'off', 'soft', 'balanced', 'strong' ], 'soft' ),
			'postFXEnabled'                      => $post_fx_enabled_bool ? '1' : '0',
			'postFXEngine'                       => $post_fx_engine,
			'postFXColorEnabled'                 => VRodos_Runtime_Settings_Contract::bool_string( $metadata->aframePostFXColorEnabled ?? true, true, '1', '0' ),
			'postFXBloomEnabled'                 => VRodos_Runtime_Settings_Contract::bool_string( $metadata->aframePostFXBloomEnabled ?? false, false, '1', '0' ),
			'postFXEdgeAAEnabled'                => VRodos_Runtime_Settings_Contract::bool_string( $metadata->aframePostFXEdgeAAEnabled ?? true, true, '1', '0' ),
			'postFXEdgeAAStrength'               => max( 0, min( 5, (int) ( $metadata->aframePostFXEdgeAAStrength ?? 3 ) ) ),
			'postFXTAAEnabled'                   => VRodos_Runtime_Settings_Contract::bool_string( $metadata->aframePostFXTAAEnabled ?? false, false, '1', '0' ),
			'postFXSSREnabled'                   => VRodos_Runtime_Settings_Contract::bool_string( $metadata->aframePostFXSSREnabled ?? false, false, '1', '0' ),
			'postFXSSRStrength'                  => $this->enum_value( $metadata->aframePostFXSSRStrength ?? 'off', [ 'off', 'subtle', 'balanced', 'strong' ], 'off' ),
			'bloomStrength'                      => $this->enum_value( $metadata->aframeBloomStrength ?? 'off', [ 'off', 'soft', 'medium' ], 'off' ),
			'exposurePreset'                     => $this->enum_value( $metadata->aframeExposurePreset ?? 'neutral', [ 'neutral', 'bright', 'cinematic' ], 'neutral' ),
			'contrastPreset'                     => $this->enum_value( $metadata->aframeContrastPreset ?? 'balanced', [ 'soft', 'balanced', 'punchy' ], 'balanced' ),
			'reflectionProfile'                  => $metadata->aframeReflectionProfile ?? 'balanced',
			'reflectionSource'                   => $metadata->aframeReflectionSource ?? 'hdr',
			'horizonSkyPreset'                   => $horizon_preset,
			'envMapPreset'                       => $metadata->aframeEnvMapPreset ?? 'none',
			'cam_position'                       => $camera_position,
			'cam_rotation_y'                     => $camera_rotation_y,
			'public_chat'                        => VRodos_Runtime_Settings_Contract::bool_string( $metadata->enableGeneralChat ?? false ),
			'fogCategory'                        => $metadata->fogCategory ?? 0,
			'fogcolor'                           => $metadata->fogcolor ?? '#FFFFFF',
			'fogfar'                             => $metadata->fogfar ?? 1000,
			'fognear'                            => $metadata->fognear ?? 0,
			'fogdensity'                         => $metadata->fogdensity ?? 0.00000001,
			'pmndrsAAMode'                       => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsAAMode' ),
			'pmndrsAAPreset'                     => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsAAPreset' ),
			'pmndrsBloomIntensity'               => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsBloomIntensity' ),
			'pmndrsBloomThreshold'               => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsBloomThreshold' ),
			'pmndrsVignetteEnabled'              => $this->pmndrs_bool_attr( $metadata, 'pmndrsVignetteEnabled' ),
			'pmndrsVignetteDarkness'             => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsVignetteDarkness' ),
			'pmndrsToneMappingExposure'          => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsToneMappingExposure' ),
			'pmndrsToneMappingMode'              => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsToneMappingMode' ),
			'pmndrsLensFlareEnabled'             => $this->pmndrs_bool_attr( $metadata, 'pmndrsLensFlareEnabled' ),
			'pmndrsLutEnabled'                   => $this->pmndrs_bool_attr( $metadata, 'pmndrsLutEnabled' ),
			'pmndrsLutLook'                      => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsLutLook' ),
			'pmndrsLutStrength'                  => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsLutStrength' ),
			'pmndrsNoiseEnabled'                 => $this->pmndrs_bool_attr( $metadata, 'pmndrsNoiseEnabled' ),
			'pmndrsNoiseOpacity'                 => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsNoiseOpacity' ),
			'pmndrsChromaticAberrationEnabled'   => $this->pmndrs_bool_attr( $metadata, 'pmndrsChromaticAberrationEnabled' ),
			'pmndrsChromaticAberrationOffset'    => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsChromaticAberrationOffset' ),
			'pmndrsAtmosphereEnabled'            => ( $post_fx_enabled_bool && 'pmndrs' === $post_fx_engine && VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsAtmosphereEnabled' ) ) ? 'true' : 'false',
			'pmndrsAtmospherePreset'             => $atmosphere_preset,
			'pmndrsAtmospherePresetIntensity'    => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsAtmospherePresetIntensity' ),
			'pmndrsAtmosphereQuality'            => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsAtmosphereQuality' ),
			'pmndrsAerialPerspectiveEnabled'     => $this->pmndrs_bool_attr( $metadata, 'pmndrsAerialPerspectiveEnabled' ),
			'pmndrsCorrectAltitudeEnabled'       => $this->pmndrs_bool_attr( $metadata, 'pmndrsCorrectAltitudeEnabled', true ),
			'pmndrsGeospatialEnabled'            => $this->pmndrs_bool_attr( $metadata, 'pmndrsGeospatialEnabled' ),
			'pmndrsGeospatialLatitudeDeg'        => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsGeospatialLatitudeDeg' ),
			'pmndrsGeospatialLongitudeDeg'       => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsGeospatialLongitudeDeg' ),
			'pmndrsGeospatialAltitudeMeters'     => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsGeospatialAltitudeMeters' ),
			'pmndrsCelestialMode'                => $celestial_mode,
			'pmndrsCelestialTimePreset'          => $celestial_time,
			'pmndrsCelestialDate'                => $this->date_attr( $metadata, 'pmndrsCelestialDate' ),
			'pmndrsCelestialUtcTime'             => $this->time_attr( $metadata, 'pmndrsCelestialUtcTime' ),
			'pmndrsSunElevationDeg'              => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsSunElevationDeg' ),
			'pmndrsSunAzimuthDeg'                => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsSunAzimuthDeg' ),
			'pmndrsSunDistance'                  => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsSunDistance' ),
			'pmndrsSunAngularRadius'             => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsSunAngularRadius' ),
			'pmndrsAerialStrength'               => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsAerialStrength' ),
			'pmndrsAlbedoScale'                  => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsAlbedoScale' ),
			'pmndrsTransmittanceEnabled'         => $this->pmndrs_bool_attr( $metadata, 'pmndrsTransmittanceEnabled', true ),
			'pmndrsInscatterEnabled'             => $this->pmndrs_bool_attr( $metadata, 'pmndrsInscatterEnabled', true ),
			'pmndrsGroundEnabled'                => $this->pmndrs_bool_attr( $metadata, 'pmndrsGroundEnabled', true ),
			'pmndrsGroundAlbedo'                 => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsGroundAlbedo' ),
			'pmndrsRayleighScale'                => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsRayleighScale' ),
			'pmndrsMieScatteringScale'           => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsMieScatteringScale' ),
			'pmndrsMieExtinctionScale'           => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsMieExtinctionScale' ),
			'pmndrsMiePhaseG'                    => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsMiePhaseG' ),
			'pmndrsAbsorptionScale'              => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsAbsorptionScale' ),
			'pmndrsMoonEnabled'                  => $moon_enabled ? 'true' : 'false',
			'pmndrsHorizonKeyLightIntensity'     => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsHorizonKeyLightIntensity', $horizon_defaults['keyLightIntensity'] ),
			'pmndrsHorizonFillLightIntensity'    => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsHorizonFillLightIntensity', $horizon_defaults['fillLightIntensity'] ),
		];
	}

	private function serialize_settings( array $settings, $metadata ): string {
		$parts = [];
		foreach ( $settings as $key => $value ) {
			$parts[] = $key . ': ' . $value;
		}

		if ( ! empty( $metadata->composite_params ) ) {
			$parts[] = (string) $metadata->composite_params;
		}

		return implode( '; ', $parts );
	}

	private function enum_value( $value, array $allowed, string $fallback ): string {
		return in_array( $value, $allowed, true ) ? (string) $value : $fallback;
	}

	private function fps_meter_enabled( $metadata ): string {
		$legacy_enabled = VRodos_Runtime_Settings_Contract::normalize_bool( $metadata->enableFPSMeter ?? false );
		$modern_enabled = VRodos_Runtime_Settings_Contract::normalize_bool( $metadata->aframeFPSMeterEnabled ?? false );

		return ( $legacy_enabled || $modern_enabled ) ? '1' : '0';
	}

	private function pmndrs_bool_attr( $metadata, string $scene_setting_key, bool $fallback = false ): string {
		$value = VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, $scene_setting_key, $fallback );
		return $value ? 'true' : 'false';
	}

	private function date_attr( $metadata, string $scene_setting_key ): string {
		$value = (string) VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, $scene_setting_key );
		return preg_match( '/^\d{4}-\d{2}-\d{2}$/', $value ) ? $value : (string) VRodos_Runtime_Settings_Contract::default( $scene_setting_key );
	}

	private function time_attr( $metadata, string $scene_setting_key ): string {
		$value = (string) VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, $scene_setting_key );
		if ( preg_match( '/^([01]\d|2[0-3]):([0-5]\d)$/', $value ) ) {
			return $value;
		}

		return (string) VRodos_Runtime_Settings_Contract::default( $scene_setting_key );
	}

	private function get_or_create_assets_container( DOMDocument $dom, DOMElement $ascene ): DOMElement {
		$a_asset = $dom->getElementsByTagName( 'a-assets' )->item( 0 );
		if ( $a_asset instanceof DOMElement ) {
			$a_asset->setAttribute( 'timeout', '5000' );
			return $a_asset;
		}

		$a_asset = $dom->createElement( 'a-assets' );
		if ( $ascene->firstChild ) {
			$ascene->insertBefore( $a_asset, $ascene->firstChild );
		} else {
			$ascene->appendChild( $a_asset );
		}
		$a_asset->setAttribute( 'timeout', '5000' );

		return $a_asset;
	}
}
