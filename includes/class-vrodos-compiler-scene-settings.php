<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-vrodos-compiler-runtime-feature-flags.php';
require_once __DIR__ . '/class-vrodos-compiler-aframe-dom-helper.php';

class VRodos_Compiler_Scene_Settings {
	private VRodos_Compiler_Scene_Repository $scene_repository;
	private VRodos_Compiler_Runtime_Feature_Flags $feature_flags;

	public function __construct( VRodos_Compiler_Scene_Repository $scene_repository, ?VRodos_Compiler_Runtime_Feature_Flags $feature_flags = null ) {
		$this->scene_repository = $scene_repository;
		$this->feature_flags    = $feature_flags ?: new VRodos_Compiler_Runtime_Feature_Flags();
	}

	public function apply( DOMDocument $dom, DOMElement $ascene, $scene_json, int $project_id, callable $normalize_url ): array {
		$metadata = is_object( $scene_json->metadata ?? null ) ? $scene_json->metadata : new stdClass();
		$settings = $this->build_settings( $metadata, $scene_json, $project_id );
		$effective_shadow_quality = $this->get_effective_shadow_quality( $settings, $metadata );
		$settings['rootShadowType'] = 'off' === $effective_shadow_quality ? 'pcf' : $this->get_shadow_map_type_attr( $effective_shadow_quality, $metadata );

		$ascene->setAttribute( 'scene-settings', $this->serialize_settings( $settings, $metadata ) );
		if ( $ascene->hasAttribute( 'renderer' ) ) {
			$this->apply_renderer_profile( $ascene, $settings, $metadata, $scene_json );
		}
		if ( $ascene->hasAttribute( 'shadow' ) ) {
			$this->apply_shadow_profile( $ascene, $settings, $metadata );
		}

		if ( '3' === (string) $settings['selChoice'] && ! empty( $metadata->backgroundImagePath ) ) {
			$a_asset     = VRodos_Compiler_AFrame_DOM_Helper::get_or_create_assets_container( $dom, $ascene );
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

		return $settings;
	}

	public function build_settings( $metadata, $scene_json, int $project_id ): array {
		$project_type_slug    = $this->scene_repository->get_project_type_slug( $project_id );
		$post_fx_enabled_bool = $this->feature_flags->is_post_fx_enabled( $metadata );
		$post_fx_engine       = $this->feature_flags->post_fx_engine( $metadata );
		$horizon_preset       = $this->enum_value( $metadata->aframeHorizonSkyPreset ?? 'natural', [ 'natural', 'clear', 'crisp' ], 'natural' );
		$horizon_lighting_preset = VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsHorizonLightingPreset', $horizon_preset );
		$horizon_defaults     = VRodos_Runtime_Settings_Contract::horizon_helper_defaults( 'custom' === $horizon_lighting_preset ? $horizon_preset : $horizon_lighting_preset );
		$atmosphere_preset    = VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsAtmospherePreset' );
		$celestial_mode       = VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsCelestialMode' );
		$celestial_time       = VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsCelestialTimePreset' );
		$tone_mapping_exposure = VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsToneMappingExposure' );
		$tone_mapping_exposure_authored = $this->is_pmndrs_tone_mapping_exposure_authored( $metadata );
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
		$navigation_mode = $this->feature_flags->navigation_mode( $metadata );

		return [
			'color'                              => $metadata->ClearColor ?? '#ffffff',
			'pr_type'                            => $project_type_slug,
			'selChoice'                          => $metadata->backgroundStyleOption ?? '0',
			'presChoice'                         => $metadata->backgroundPresetOption ?? 'None',
			'presetGroundEnabled'                => VRodos_Runtime_Settings_Contract::bool_string( $metadata->backgroundPresetGroundEnabled ?? false, false, '1', '0' ),
			'movement_disabled'                  => VRodos_Runtime_Settings_Contract::bool_string( $metadata->disableMovement ?? false ),
			'avatar_enabled'                     => VRodos_Runtime_Settings_Contract::bool_string( $metadata->enableAvatar ?? false, false, '1', '0' ),
			'runtimeMode'                        => $this->feature_flags->runtime_mode_from_metadata( $metadata ),
			'collisionMode'                      => $this->feature_flags->collision_mode_attr( $metadata ),
			'navigationMode'                     => $navigation_mode,
			'renderQuality'                      => $metadata->aframeRenderQuality ?? 'standard',
			'shadowQuality'                      => $metadata->aframeShadowQuality ?? 'medium',
			'shadowUpdateMode'                   => $this->normalize_shadow_update_mode( $metadata ),
			'flatMediaShadowCasting'             => $this->get_flat_media_shadow_casting_attr( $metadata ),
			'aaQuality'                          => $metadata->aframeAAQuality ?? 'balanced',
			'fpsMeterEnabled'                    => $this->feature_flags->fps_meter_attr( $metadata ),
			'vrRuntimeProfile'                   => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'vrRuntimeProfile' ),
			'vrFramebufferScale'                 => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'vrFramebufferScale' ),
			'vrFoveationStrength'                => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'vrFoveationStrength' ),
			'legacyHorizonStageSize'             => max( 500, min( 8000, (int) ( $metadata->aframeLegacyHorizonStageSize ?? 5000 ) ) ),
			'ambientOcclusionPreset'             => $this->enum_value( $metadata->aframeAmbientOcclusionPreset ?? 'balanced', [ 'off', 'soft', 'balanced', 'strong' ], 'balanced' ),
			'contactShadowPreset'                => $this->enum_value( $metadata->aframeContactShadowPreset ?? 'soft', [ 'off', 'soft', 'balanced', 'strong' ], 'soft' ),
			'postFXEnabled'                      => $post_fx_enabled_bool ? '1' : '0',
			'postFXEngine'                       => $post_fx_engine,
			'postFXColorEnabled'                 => VRodos_Runtime_Settings_Contract::bool_string( $metadata->aframePostFXColorEnabled ?? false, false, '1', '0' ),
			'postFXBloomEnabled'                 => VRodos_Runtime_Settings_Contract::bool_string( $metadata->aframePostFXBloomEnabled ?? false, false, '1', '0' ),
			'postFXEdgeAAEnabled'                => VRodos_Runtime_Settings_Contract::bool_string( $metadata->aframePostFXEdgeAAEnabled ?? true, true, '1', '0' ),
			'postFXEdgeAAStrength'               => max( 0, min( 5, (int) ( $metadata->aframePostFXEdgeAAStrength ?? 3 ) ) ),
			'postFXTAAEnabled'                   => VRodos_Runtime_Settings_Contract::bool_string( $metadata->aframePostFXTAAEnabled ?? false, false, '1', '0' ),
			'postFXSSREnabled'                   => VRodos_Runtime_Settings_Contract::bool_string( $metadata->aframePostFXSSREnabled ?? false, false, '1', '0' ),
			'postFXSSRStrength'                  => $this->enum_value( $metadata->aframePostFXSSRStrength ?? 'off', [ 'off', 'subtle', 'balanced', 'strong' ], 'off' ),
			'bloomStrength'                      => $this->enum_value( $metadata->aframeBloomStrength ?? 'off', [ 'off', 'soft', 'medium' ], 'off' ),
			'exposurePreset'                     => $this->enum_value( $metadata->aframeExposurePreset ?? 'neutral', [ 'neutral', 'bright', 'cinematic' ], 'neutral' ),
			'contrastPreset'                     => $this->enum_value( $metadata->aframeContrastPreset ?? 'balanced', [ 'soft', 'balanced', 'punchy' ], 'balanced' ),
			'reflectionsEnabled'                 => VRodos_Runtime_Settings_Contract::bool_string( $metadata->aframeReflectionsEnabled ?? true, true, '1', '0' ),
			'reflectionProfile'                  => $metadata->aframeReflectionProfile ?? 'balanced',
			'reflectionSource'                   => $metadata->aframeReflectionSource ?? 'hdr',
			'sceneProbeUpdateMode'               => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'sceneProbeUpdateMode', 'static' ),
			'sceneProbeResolution'               => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'sceneProbeResolution', '128' ),
			'reflectionOcclusionMode'            => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'reflectionOcclusionMode' ),
			'horizonSkyPreset'                   => $horizon_preset,
			'envMapPreset'                       => $metadata->aframeEnvMapPreset ?? 'none',
			'cam_position'                       => $camera_position,
			'cam_rotation_y'                     => $camera_rotation_y,
			'public_chat'                        => VRodos_Runtime_Settings_Contract::bool_string( $metadata->enableGeneralChat ?? false, false, '1', '0' ),
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
			'pmndrsToneMappingExposure'          => $tone_mapping_exposure,
			'pmndrsLowLightAutoExposureEnabled'  => $this->pmndrs_bool_attr( $metadata, 'pmndrsLowLightAutoExposureEnabled', true ),
			'pmndrsToneMappingExposureAuthored'  => $tone_mapping_exposure_authored ? 'true' : 'false',
			'pmndrsToneMappingMode'              => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsToneMappingMode' ),
			'pmndrsLensFlareEnabled'             => $this->pmndrs_bool_attr( $metadata, 'pmndrsLensFlareEnabled' ),
			'pmndrsLutEnabled'                   => $this->pmndrs_bool_attr( $metadata, 'pmndrsLutEnabled' ),
			'pmndrsLutLook'                      => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsLutLook' ),
			'pmndrsLutStrength'                  => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsLutStrength' ),
			'pmndrsNoiseEnabled'                 => $this->pmndrs_bool_attr( $metadata, 'pmndrsNoiseEnabled' ),
			'pmndrsNoiseOpacity'                 => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsNoiseOpacity' ),
			'pmndrsChromaticAberrationEnabled'   => $this->pmndrs_bool_attr( $metadata, 'pmndrsChromaticAberrationEnabled' ),
			'pmndrsChromaticAberrationOffset'    => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsChromaticAberrationOffset' ),
			'pmndrsAtmosphereEnabled'            => $this->feature_flags->is_pmndrs_atmosphere_enabled( $metadata ) ? 'true' : 'false',
			'pmndrsAtmospherePreset'             => $atmosphere_preset,
			'pmndrsAtmospherePresetIntensity'    => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsAtmospherePresetIntensity' ),
			'pmndrsAtmosphereQuality'            => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsAtmosphereQuality' ),
			'pmndrsAerialPerspectiveEnabled'     => $this->pmndrs_bool_attr( $metadata, 'pmndrsAerialPerspectiveEnabled' ),
			'pmndrsCloudsEnabled'                => $this->feature_flags->is_pmndrs_clouds_enabled( $metadata ) ? 'true' : 'false',
			'pmndrsCloudsQuality'                => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsCloudsQuality' ),
			'pmndrsCloudsCoverage'               => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsCloudsCoverage' ),
			'pmndrsCorrectAltitudeEnabled'       => $this->pmndrs_bool_attr( $metadata, 'pmndrsCorrectAltitudeEnabled', true ),
			'pmndrsGeospatialEnabled'            => $this->pmndrs_bool_attr( $metadata, 'pmndrsGeospatialEnabled' ),
			'pmndrsGeospatialLatitudeDeg'        => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsGeospatialLatitudeDeg' ),
			'pmndrsGeospatialLongitudeDeg'       => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsGeospatialLongitudeDeg' ),
			'pmndrsGeospatialAltitudeMeters'     => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsGeospatialAltitudeMeters' ),
			'pmndrsCelestialMode'                => $celestial_mode,
			'pmndrsCelestialTimePreset'          => $celestial_time,
			'pmndrsCelestialDate'                => $this->date_attr( $metadata, 'pmndrsCelestialDate' ),
			'pmndrsCelestialUtcTime'             => $this->time_attr( $metadata, 'pmndrsCelestialUtcTime' ),
			'pmndrsDayNightCycleEnabled'         => $this->pmndrs_bool_attr( $metadata, 'pmndrsDayNightCycleEnabled' ),
			'pmndrsDayNightCycleDurationMinutes' => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsDayNightCycleDurationMinutes' ),
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
			'pmndrsStarsEnabled'                 => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsStarsEnabled' ),
			'pmndrsHorizonLightingPreset'        => $horizon_lighting_preset,
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

	private function apply_renderer_profile( DOMElement $ascene, array $settings, $metadata, $scene_json ): void {
		$renderer = VRodos_Compiler_AFrame_DOM_Helper::parse_component_attribute( $ascene->getAttribute( 'renderer' ) );

		$renderer['antialias']              = $this->bool_attr( $this->should_enable_renderer_antialias( $settings, $metadata ) );
		$renderer['colorManagement']        = $this->bool_attr( $this->should_enable_color_management( $metadata ) );
		$renderer['sortTransparentObjects'] = $this->bool_attr( $this->should_sort_transparent_objects( $metadata, $scene_json ) );
		$renderer['toneMapping']            = $this->get_initial_renderer_tone_mapping( $settings, $metadata );
		$renderer['exposure']               = $this->format_renderer_number( $this->get_initial_renderer_exposure( $settings, $metadata ) );
		$renderer['precision']              = $this->get_renderer_precision( $metadata );
		$renderer['logarithmicDepthBuffer'] = $this->bool_attr( $this->should_enable_logarithmic_depth_buffer( $metadata, $scene_json ) );
		$renderer['alpha']                  = $this->bool_attr( $this->should_enable_renderer_alpha( $metadata ) );
		$renderer['stencil']                = $this->bool_attr( $this->should_enable_renderer_stencil( $metadata ) );

		$ascene->setAttribute( 'renderer', VRodos_Compiler_AFrame_DOM_Helper::serialize_component_attribute( $renderer ) );
	}

	private function apply_shadow_profile( DOMElement $ascene, array $settings, $metadata ): void {
		$shadow_quality = $this->get_effective_shadow_quality( $settings, $metadata );
		$shadows_enabled = 'off' !== $shadow_quality;
		$shadow_update_mode = (string) ( $settings['shadowUpdateMode'] ?? $this->normalize_shadow_update_mode( $metadata ) );

		$shadow = VRodos_Compiler_AFrame_DOM_Helper::parse_component_attribute( $ascene->getAttribute( 'shadow' ) );
		$shadow['enabled']    = $this->bool_attr( $shadows_enabled );
		$shadow['type']       = $this->get_aframe_shadow_type_attr( (string) ( $settings['rootShadowType'] ?? $this->get_shadow_map_type_attr( $shadow_quality, $metadata ) ) );
		$shadow['autoUpdate'] = $this->bool_attr( 'dynamic' === $shadow_update_mode && $this->should_enable_shadow_auto_update( $metadata ) );

		$ascene->setAttribute( 'shadow', VRodos_Compiler_AFrame_DOM_Helper::serialize_component_attribute( $shadow ) );
	}

	private function bool_attr( bool $value ): string {
		return $value ? 'true' : 'false';
	}

	private function format_renderer_number( float $value ): string {
		$formatted = rtrim( rtrim( sprintf( '%.4f', $value ), '0' ), '.' );
		return '' === $formatted ? '0' : $formatted;
	}

	private function should_enable_renderer_antialias( array $settings, $metadata ): bool {
		if ( property_exists( $metadata, 'aframeRendererAntialias' ) ) {
			return VRodos_Runtime_Settings_Contract::normalize_bool( $metadata->aframeRendererAntialias, true );
		}

		$render_quality = (string) ( $settings['renderQuality'] ?? 'standard' );
		$aa_quality     = (string) ( $settings['aaQuality'] ?? 'balanced' );
		if ( 'performance' === $render_quality || 'off' === $aa_quality ) {
			return false;
		}

		if ( $this->should_preserve_native_antialiasing_for_vr( $settings ) ) {
			return true;
		}

		return ! $this->should_pmndrs_own_antialiasing( $settings );
	}

	private function should_preserve_native_antialiasing_for_vr( array $settings ): bool {
		$profile = (string) ( $settings['vrRuntimeProfile'] ?? 'desktop' );

		return 'desktop' !== $profile;
	}

	private function should_enable_color_management( $metadata ): bool {
		if ( property_exists( $metadata, 'aframeRendererColorManagement' ) ) {
			return VRodos_Runtime_Settings_Contract::normalize_bool( $metadata->aframeRendererColorManagement, true );
		}

		return true;
	}

	private function should_enable_renderer_alpha( $metadata ): bool {
		foreach ( [ 'aframeRendererAlpha', 'aframeTransparentCanvas', 'aframeEmbeddedTransparentCanvas' ] as $key ) {
			if ( property_exists( $metadata, $key ) ) {
				return VRodos_Runtime_Settings_Contract::normalize_bool( $metadata->{$key}, false );
			}
		}

		return false;
	}

	private function should_enable_renderer_stencil( $metadata ): bool {
		if ( property_exists( $metadata, 'aframeRendererStencil' ) ) {
			return VRodos_Runtime_Settings_Contract::normalize_bool( $metadata->aframeRendererStencil, false );
		}

		return false;
	}

	private function should_sort_transparent_objects( $metadata, $scene_json ): bool {
		foreach ( [ 'aframeRendererSortTransparentObjects', 'aframeSortTransparentObjects' ] as $key ) {
			if ( property_exists( $metadata, $key ) ) {
				return VRodos_Runtime_Settings_Contract::normalize_bool( $metadata->{$key}, false );
			}
		}

		$objects = is_object( $scene_json->objects ?? null ) ? (array) $scene_json->objects : [];
		foreach ( $objects as $object ) {
			if ( ! is_object( $object ) ) {
				continue;
			}

			$category = $this->normalize_category_key( (string) ( $object->category_slug ?? $object->category_name ?? '' ) );
			if ( in_array( $category, [ 'image', 'video', '3d-text', 'poi-imagetext', 'poi-image-text', 'poi-link', 'chat', 'assessment' ], true ) ) {
				return true;
			}
		}

		return false;
	}

	private function normalize_category_key( string $category ): string {
		$category = strtolower( trim( $category ) );
		if ( '' === $category ) {
			return '';
		}

		if ( function_exists( 'sanitize_title' ) ) {
			return sanitize_title( $category );
		}

		$category = preg_replace( '/[^a-z0-9]+/', '-', $category );
		return trim( (string) $category, '-' );
	}

	private function get_renderer_precision( $metadata ): string {
		$value = property_exists( $metadata, 'aframeRendererPrecision' )
			? (string) $metadata->aframeRendererPrecision
			: 'high';

		return in_array( $value, [ 'low', 'medium', 'high' ], true ) ? $value : 'high';
	}

	private function get_initial_renderer_tone_mapping( array $settings, $metadata ): string {
		if ( property_exists( $metadata, 'aframeRendererToneMapping' ) ) {
			return $this->normalize_aframe_tone_mapping( (string) $metadata->aframeRendererToneMapping, 'ACESFilmic' );
		}

		if ( 'pmndrs' === (string) ( $settings['postFXEngine'] ?? 'legacy' ) ) {
			return $this->should_use_pmndrs_composer( $settings )
				? 'no'
				: $this->aframe_tone_mapping_for_pmndrs_mode( (string) ( $settings['pmndrsToneMappingMode'] ?? 'agx' ) );
		}

		return 'ACESFilmic';
	}

	private function normalize_aframe_tone_mapping( string $value, string $fallback ): string {
		$normalized = strtolower( trim( $value ) );
		switch ( $normalized ) {
			case 'no':
			case 'none':
				return 'no';
			case 'linear':
				return 'linear';
			case 'reinhard':
				return 'reinhard';
			case 'cineon':
				return 'cineon';
			case 'aces':
			case 'acesfilmic':
			case 'aces-filmic':
				return 'ACESFilmic';
			case 'agx':
				return 'AgX';
			case 'neutral':
				return 'neutral';
			default:
				return $fallback;
		}
	}

	private function aframe_tone_mapping_for_pmndrs_mode( string $mode ): string {
		switch ( $mode ) {
			case 'reinhard':
				return 'reinhard';
			case 'cineon':
				return 'cineon';
			case 'aces-filmic':
				return 'ACESFilmic';
			case 'linear':
				return 'linear';
			case 'agx':
			default:
				return 'AgX';
		}
	}

	private function get_initial_renderer_exposure( array $settings, $metadata ): float {
		if ( property_exists( $metadata, 'aframeRendererExposure' ) && is_numeric( $metadata->aframeRendererExposure ) ) {
			return max( 0.0, min( 20.0, (float) $metadata->aframeRendererExposure ) );
		}

		if ( 'pmndrs' === (string) ( $settings['postFXEngine'] ?? 'legacy' ) ) {
			return $this->get_effective_pmndrs_initial_exposure( $settings );
		}

		return 'high' === (string) ( $settings['renderQuality'] ?? 'standard' ) ? 1.06 : 1.0;
	}

	private function get_effective_pmndrs_initial_exposure( array $settings ): float {
		$exposure = max( 0.1, min( 5.0, (float) ( $settings['pmndrsToneMappingExposure'] ?? 1.0 ) ) );
		if (
			! $this->setting_bool( $settings, 'pmndrsAtmosphereEnabled' ) ||
			! $this->setting_bool( $settings, 'pmndrsLowLightAutoExposureEnabled' )
		) {
			return $exposure;
		}

		if ( $this->is_pmndrs_night_settings( $settings ) ) {
			return max( $exposure, 3.0 );
		}
		if ( $this->is_pmndrs_dawn_settings( $settings ) ) {
			return max( $exposure, 2.2 );
		}

		return $exposure;
	}

	private function is_pmndrs_night_settings( array $settings ): bool {
		if ( 'night' === (string) ( $settings['pmndrsCelestialTimePreset'] ?? '' ) ) {
			return true;
		}

		return 'datetime' === (string) ( $settings['pmndrsCelestialMode'] ?? '' ) &&
			isset( $settings['pmndrsSunElevationDeg'] ) &&
			(float) $settings['pmndrsSunElevationDeg'] <= -12.0;
	}

	private function is_pmndrs_dawn_settings( array $settings ): bool {
		if ( 'dawn' === (string) ( $settings['pmndrsCelestialTimePreset'] ?? '' ) ) {
			return true;
		}

		$sun_elevation = isset( $settings['pmndrsSunElevationDeg'] ) ? (float) $settings['pmndrsSunElevationDeg'] : null;
		return 'datetime' === (string) ( $settings['pmndrsCelestialMode'] ?? '' ) &&
			null !== $sun_elevation &&
			$sun_elevation > -12.0 &&
			$sun_elevation < 0.0;
	}

	private function should_pmndrs_own_antialiasing( array $settings ): bool {
		if (
			'high' !== (string) ( $settings['renderQuality'] ?? 'standard' ) ||
			'0' === (string) ( $settings['postFXEnabled'] ?? '0' ) ||
			'pmndrs' !== (string) ( $settings['postFXEngine'] ?? 'legacy' )
		) {
			return false;
		}

		return 'none' !== $this->effective_pmndrs_aa_mode( $settings );
	}

	private function should_use_pmndrs_composer( array $settings ): bool {
		if (
			'high' !== (string) ( $settings['renderQuality'] ?? 'standard' ) ||
			'0' === (string) ( $settings['postFXEnabled'] ?? '0' ) ||
			'pmndrs' !== (string) ( $settings['postFXEngine'] ?? 'legacy' )
		) {
			return false;
		}

		return 'off' !== (string) ( $settings['ambientOcclusionPreset'] ?? 'balanced' ) ||
			'none' !== $this->effective_pmndrs_aa_mode( $settings ) ||
			'off' !== (string) ( $settings['bloomStrength'] ?? 'off' ) ||
			$this->should_apply_color_grading( $settings ) ||
			$this->setting_bool( $settings, 'pmndrsLensFlareEnabled' ) ||
			$this->setting_bool( $settings, 'pmndrsLutEnabled' ) ||
			$this->setting_bool( $settings, 'pmndrsVignetteEnabled' ) ||
			$this->setting_bool( $settings, 'pmndrsNoiseEnabled' ) ||
			$this->setting_bool( $settings, 'pmndrsChromaticAberrationEnabled' ) ||
			$this->setting_bool( $settings, 'pmndrsAerialPerspectiveEnabled' ) ||
			$this->setting_bool( $settings, 'pmndrsCloudsEnabled' );
	}

	private function should_apply_color_grading( array $settings ): bool {
		return in_array( (string) ( $settings['contrastPreset'] ?? 'balanced' ), [ 'soft', 'punchy' ], true );
	}

	private function setting_bool( array $settings, string $key ): bool {
		return VRodos_Runtime_Settings_Contract::normalize_bool( $settings[ $key ] ?? false );
	}

	private function effective_pmndrs_aa_mode( array $settings ): string {
		if ( 'performance' === (string) ( $settings['renderQuality'] ?? 'standard' ) ) {
			return 'none';
		}

		$mode = (string) ( $settings['pmndrsAAMode'] ?? 'inherit' );
		if ( in_array( $mode, [ 'none', 'smaa', 'msaa' ], true ) ) {
			return $mode;
		}

		return 'off' === (string) ( $settings['aaQuality'] ?? 'balanced' ) ? 'none' : 'msaa';
	}

	private function should_enable_logarithmic_depth_buffer( $metadata, $scene_json ): bool {
		foreach ( [ 'aframeLogarithmicDepthBuffer', 'aframeRendererLogarithmicDepthBuffer' ] as $key ) {
			if ( property_exists( $metadata, $key ) ) {
				return VRodos_Runtime_Settings_Contract::normalize_bool( $metadata->{$key}, false );
			}
		}

		return $this->scene_extent_suggests_logarithmic_depth_buffer( $scene_json );
	}

	private function scene_extent_suggests_logarithmic_depth_buffer( $scene_json ): bool {
		$objects = is_object( $scene_json->objects ?? null ) ? (array) $scene_json->objects : [];
		$max_abs = 0.0;

		foreach ( $objects as $object ) {
			if ( ! is_object( $object ) ) {
				continue;
			}

			foreach ( [ 'position', 'scale' ] as $property ) {
				if ( ! isset( $object->{$property} ) || ! is_iterable( $object->{$property} ) ) {
					continue;
				}

				foreach ( $object->{$property} as $value ) {
					if ( is_numeric( $value ) ) {
						$max_abs = max( $max_abs, abs( (float) $value ) );
					}
				}
			}
		}

		return $max_abs > 4000.0;
	}

	private function get_effective_shadow_quality( array $settings, $metadata ): string {
		if ( property_exists( $metadata, 'aframeShadowEnabled' ) && ! VRodos_Runtime_Settings_Contract::normalize_bool( $metadata->aframeShadowEnabled, true ) ) {
			return 'off';
		}

		if ( 'performance' === (string) ( $settings['renderQuality'] ?? 'standard' ) ) {
			return 'off';
		}

		$shadow_quality = (string) ( $settings['shadowQuality'] ?? 'medium' );
		return in_array( $shadow_quality, [ 'off', 'high' ], true ) ? $shadow_quality : 'medium';
	}

	private function get_shadow_map_type_attr( string $shadow_quality, $metadata ): string {
		foreach ( [ 'aframeRootShadowType', 'aframeShadowType' ] as $key ) {
			if ( property_exists( $metadata, $key ) ) {
				$value = strtolower( trim( (string) $metadata->{$key} ) );
				if ( in_array( $value, [ 'basic', 'pcf' ], true ) ) {
					return $value;
				}
			}
		}

		return 'pcf';
	}

	private function get_aframe_shadow_type_attr( string $shadow_type ): string {
		$shadow_type = strtolower( trim( $shadow_type ) );
		if ( 'basic' === $shadow_type ) {
			return 'basic';
		}

		return 'pcf';
	}

	private function get_flat_media_shadow_casting_attr( $metadata ): string {
		$profile = VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'vrRuntimeProfile', 'desktop' );
		if ( ! in_array( (string) $profile, [ 'desktop', 'pc-rendered-vr' ], true ) ) {
			return '0';
		}

		return VRodos_Runtime_Settings_Contract::bool_string( $metadata->aframeFlatMediaShadowCasting ?? true, true, '1', '0' );
	}

	private function should_enable_shadow_auto_update( $metadata ): bool {
		if ( property_exists( $metadata, 'aframeShadowAutoUpdate' ) ) {
			return VRodos_Runtime_Settings_Contract::normalize_bool( $metadata->aframeShadowAutoUpdate, true );
		}

		return true;
	}

	private function normalize_shadow_update_mode( $metadata ): string {
		foreach ( [ 'shadowUpdateMode', 'aframeShadowUpdateMode' ] as $key ) {
			if ( property_exists( $metadata, $key ) ) {
				$value = strtolower( trim( (string) $metadata->{$key} ) );
				if ( in_array( $value, [ 'static', 'dynamic' ], true ) ) {
					return $value;
				}
			}
		}

		if ( property_exists( $metadata, 'aframeShadowAutoUpdate' ) && VRodos_Runtime_Settings_Contract::normalize_bool( $metadata->aframeShadowAutoUpdate, true ) ) {
			return 'dynamic';
		}

		return 'static';
	}

	private function enum_value( $value, array $allowed, string $fallback ): string {
		return in_array( $value, $allowed, true ) ? (string) $value : $fallback;
	}

	private function is_pmndrs_tone_mapping_exposure_authored( $metadata ): bool {
		$authored_key = VRodos_Runtime_Settings_Contract::metadata_key( 'pmndrsToneMappingExposureAuthored' );
		if ( property_exists( $metadata, $authored_key ) ) {
			return VRodos_Runtime_Settings_Contract::normalize_bool( $metadata->{$authored_key}, false );
		}

		return false;
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
			$a_asset->setAttribute( 'timeout', VRodos_Compiler_Runtime_Assets::aframe_asset_timeout_ms() );
			return $a_asset;
		}

		$a_asset = $dom->createElement( 'a-assets' );
		if ( $ascene->firstChild ) {
			$ascene->insertBefore( $a_asset, $ascene->firstChild );
		} else {
			$ascene->appendChild( $a_asset );
		}
		$a_asset->setAttribute( 'timeout', VRodos_Compiler_Runtime_Assets::aframe_asset_timeout_ms() );

		return $a_asset;
	}
}
