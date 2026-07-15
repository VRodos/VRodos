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

	public function apply(
		DOMDocument $dom,
		DOMElement $ascene,
		$scene_json,
		int $project_id,
		callable $normalize_url,
		?array $resolved_settings = null,
		?array &$diagnostics = null
	): array {
		$metadata = is_object( $scene_json->metadata ?? null ) ? $scene_json->metadata : new stdClass();
		$settings = is_array( $resolved_settings )
			? $resolved_settings
			: $this->build_settings( $metadata, $scene_json, $project_id, $diagnostics );
		$effective_shadow_quality = $this->get_effective_shadow_quality( $settings, $metadata );
		$settings['rootShadowType'] = 'off' === $effective_shadow_quality ? 'pcf' : $this->get_shadow_map_type_attr( $effective_shadow_quality, $metadata );

		$ascene->setAttribute( 'scene-settings', $this->serialize_settings( $settings ) );
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

	public function build_settings( $metadata, $scene_json, int $project_id, ?array &$diagnostics = null ): array {
		$project_type_slug    = $this->scene_repository->get_project_type_slug( $project_id );
		$post_fx_enabled_bool = $this->feature_flags->is_post_fx_enabled( $metadata );
		$post_fx_engine       = $this->feature_flags->post_fx_engine( $metadata );
		$horizon_preset       = VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'horizonSkyPreset' );
		$horizon_lighting_preset = VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsHorizonLightingPreset', $horizon_preset );
		$horizon_defaults     = VRodos_Runtime_Settings_Contract::horizon_helper_defaults( 'custom' === $horizon_lighting_preset ? $horizon_preset : $horizon_lighting_preset );
		$atmosphere_preset    = VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsAtmospherePreset' );
		$celestial_mode       = VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsCelestialMode' );
		$celestial_time       = VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsCelestialTimePreset' );
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

		// The contract owns every ordinary wire value. Only values whose meaning
		// depends on project, camera, renderer, or effective runtime policy are
		// overlaid here.
		$settings = VRodos_Runtime_Settings_Contract::wire_settings_from_metadata( $metadata );
		$settings = array_merge(
			$settings,
			[
				'pr_type'                           => $project_type_slug,
				'runtimeMode'                       => $this->feature_flags->runtime_mode_from_metadata( $metadata ),
				'collisionMode'                     => $this->feature_flags->collision_mode_attr( $metadata ),
				'navigationMode'                    => $navigation_mode,
				'shadowUpdateMode'                  => $this->normalize_shadow_update_mode( $metadata ),
				'flatMediaShadowCasting'            => $this->get_flat_media_shadow_casting_attr( $metadata ),
				'fpsMeterEnabled'                   => $this->feature_flags->fps_meter_attr( $metadata ),
				'postFXEnabled'                     => $post_fx_enabled_bool ? '1' : '0',
				'postFXEngine'                      => $post_fx_engine,
				'cam_position'                      => $camera_position,
				'cam_rotation_y'                    => $camera_rotation_y,
				'pmndrsToneMappingExposureAuthored' => $tone_mapping_exposure_authored ? 'true' : 'false',
				'pmndrsAtmosphereEnabled'           => $this->feature_flags->is_pmndrs_atmosphere_enabled( $metadata ) ? 'true' : 'false',
				'pmndrsCloudsEnabled'               => $this->feature_flags->is_pmndrs_clouds_enabled( $metadata ) ? 'true' : 'false',
				'pmndrsCelestialMode'               => $celestial_mode,
				'pmndrsCelestialTimePreset'         => $celestial_time,
				'pmndrsMoonEnabled'                 => $moon_enabled ? 'true' : 'false',
				'pmndrsHorizonLightingPreset'       => $horizon_lighting_preset,
				'pmndrsHorizonKeyLightIntensity'    => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsHorizonKeyLightIntensity', $horizon_defaults['keyLightIntensity'] ),
				'pmndrsHorizonFillLightIntensity'   => VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsHorizonFillLightIntensity', $horizon_defaults['fillLightIntensity'] ),
			]
		);

		return $this->apply_legacy_composite_overlay( $settings, $metadata, $diagnostics );
	}

	public function serialize_settings( array $settings ): string {
		$parts = [];
		foreach ( $settings as $key => $value ) {
			$parts[] = $key . ': ' . $value;
		}

		return implode( '; ', $parts );
	}

	/**
	 * Preserve known legacy composite overrides without retaining a raw attribute escape hatch.
	 */
	public function apply_legacy_composite_overlay( array $settings, $metadata, ?array &$diagnostics = null ): array {
		if ( class_exists( 'VRodos_Legacy_Metadata_Migration' ) && VRodos_Legacy_Metadata_Migration::is_complete() ) {
			return $settings;
		}
		$raw = is_object( $metadata ) ? trim( (string) ( $metadata->composite_params ?? '' ) ) : '';
		if ( '' === $raw ) {
			return $settings;
		}

		$blocked = [ 'runtimeMode', 'vrRuntimeProfile', 'pr_type', 'cam_position', 'cam_rotation_y', 'rootShadowType' ];
		$allowed = array_fill_keys( array_keys( $settings ), true );
		foreach ( explode( ';', $raw ) as $part ) {
			$part = trim( $part );
			if ( '' === $part || ! str_contains( $part, ':' ) ) {
				$this->append_legacy_diagnostic( $diagnostics, 'Ignored malformed legacy scene-setting override.' );
				continue;
			}

			[ $key, $value ] = array_map( 'trim', explode( ':', $part, 2 ) );
			if (
				! preg_match( '/^[A-Za-z][A-Za-z0-9_]*$/', $key ) ||
				empty( $allowed[ $key ] ) ||
				in_array( $key, $blocked, true )
			) {
				$this->append_legacy_diagnostic( $diagnostics, 'Ignored unsupported legacy scene-setting override: ' . $key );
				continue;
			}

			$value = str_replace( [ "\r", "\n", "\0" ], '', $value );
			if ( function_exists( 'wp_strip_all_tags' ) ) {
				$value = wp_strip_all_tags( $value );
			}
			$normalized_value = $this->normalize_legacy_overlay_value( $key, $value, $settings[ $key ] );
			if ( null === $normalized_value ) {
				$this->append_legacy_diagnostic( $diagnostics, 'Ignored legacy scene-setting override without a contract definition: ' . $key );
				continue;
			}
			$settings[ $key ] = $normalized_value;
			$this->append_legacy_diagnostic( $diagnostics, 'Applied deprecated legacy scene-setting override: ' . $key );
		}

		return $settings;
	}

	private function normalize_legacy_overlay_value( string $setting_key, string $value, $current_value ) {
		$aliases = [
			'color'               => 'clearColor',
			'selChoice'           => 'backgroundStyleOption',
			'presChoice'          => 'backgroundPresetOption',
			'presetGroundEnabled' => 'backgroundPresetGroundEnabled',
			'movement_disabled'   => 'movementDisabled',
			'avatar_enabled'      => 'avatarEnabled',
			'public_chat'         => 'generalChatEnabled',
			'fogcolor'            => 'fogColor',
			'fogfar'              => 'fogFar',
			'fognear'             => 'fogNear',
			'fogdensity'          => 'fogDensity',
		];
		$contract_key = $aliases[ $setting_key ] ?? $setting_key;
		$definition   = VRodos_Runtime_Settings_Contract::setting( $contract_key );
		if ( empty( $definition ) ) {
			return null;
		}

		$normalized = VRodos_Runtime_Settings_Contract::normalize( $contract_key, $value );
		if ( 'boolean' !== (string) ( $definition['type'] ?? '' ) ) {
			return $normalized;
		}

		return in_array( (string) $current_value, [ '0', '1' ], true )
			? VRodos_Runtime_Settings_Contract::bool_string( $normalized, false, '1', '0' )
			: VRodos_Runtime_Settings_Contract::bool_string( $normalized );
	}

	private function append_legacy_diagnostic( ?array &$diagnostics, string $message ): void {
		if ( null === $diagnostics ) {
			return;
		}
		$diagnostics[] = $message;
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

		return VRodos_Runtime_Settings_Contract::bool_string( VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'flatMediaShadowCasting' ), true, '1', '0' );
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

	private function is_pmndrs_tone_mapping_exposure_authored( $metadata ): bool {
		$authored_key = VRodos_Runtime_Settings_Contract::metadata_key( 'pmndrsToneMappingExposureAuthored' );
		if ( property_exists( $metadata, $authored_key ) ) {
			return VRodos_Runtime_Settings_Contract::normalize_bool( $metadata->{$authored_key}, false );
		}

		return false;
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
