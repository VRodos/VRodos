<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-vrodos-runtime-settings-contract.php';

class VRodos_Compiler_Runtime_Feature_Flags {
	public const RUNTIME_MODE_NETWORKED     = 'networked';
	public const RUNTIME_MODE_SINGLE_PLAYER = 'single-player';
	public const POST_FX_ENGINE_LEGACY      = 'legacy';
	public const POST_FX_ENGINE_PMNDRS      = 'pmndrs';

	public static function normalize_runtime_mode_value( $runtime_mode ): string {
		if ( ! is_string( $runtime_mode ) ) {
			$runtime_mode = '';
		} else {
			if ( function_exists( 'wp_unslash' ) ) {
				$runtime_mode = wp_unslash( $runtime_mode );
			}
			$runtime_mode = function_exists( 'sanitize_text_field' )
				? sanitize_text_field( $runtime_mode )
				: trim( $runtime_mode );
		}

		return self::RUNTIME_MODE_SINGLE_PLAYER === $runtime_mode ? self::RUNTIME_MODE_SINGLE_PLAYER : self::RUNTIME_MODE_NETWORKED;
	}

	public function metadata( $scene_json ): object {
		return is_object( $scene_json->metadata ?? null ) ? $scene_json->metadata : new stdClass();
	}

	public function runtime_mode_for_scene( $scene_json, $requested_runtime_mode = null ): string {
		if ( null === $requested_runtime_mode || '' === $requested_runtime_mode ) {
			$metadata               = $this->metadata( $scene_json );
			$requested_runtime_mode = $metadata->aframeRuntimeMode ?? self::RUNTIME_MODE_SINGLE_PLAYER;
		}

		return self::normalize_runtime_mode_value( $requested_runtime_mode );
	}

	public function runtime_mode_from_metadata( $metadata ): string {
		return self::normalize_runtime_mode_value( is_object( $metadata ) ? ( $metadata->aframeRuntimeMode ?? self::RUNTIME_MODE_SINGLE_PLAYER ) : null );
	}

	public function is_networked_runtime( string $runtime_mode ): bool {
		return self::RUNTIME_MODE_SINGLE_PLAYER !== $runtime_mode;
	}

	public function is_single_player_runtime( string $runtime_mode ): bool {
		return self::RUNTIME_MODE_SINGLE_PLAYER === $runtime_mode;
	}

	public function is_post_fx_enabled( $metadata ): bool {
		return VRodos_Runtime_Settings_Contract::normalize_bool( $metadata->aframePostFXEnabled ?? false );
	}

	public function post_fx_engine( $metadata ): string {
		if ( ! $this->is_post_fx_enabled( $metadata ) ) {
			return self::POST_FX_ENGINE_LEGACY;
		}

		return ( $metadata->aframePostFXEngine ?? self::POST_FX_ENGINE_LEGACY ) === self::POST_FX_ENGINE_PMNDRS
			? self::POST_FX_ENGINE_PMNDRS
			: self::POST_FX_ENGINE_LEGACY;
	}

	public function is_pmndrs_atmosphere_enabled( $metadata ): bool {
		return $this->is_post_fx_enabled( $metadata )
			&& self::POST_FX_ENGINE_PMNDRS === $this->post_fx_engine( $metadata )
			&& VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'pmndrsAtmosphereEnabled', true );
	}

	public function is_fps_meter_enabled( $metadata ): bool {
		return VRodos_Runtime_Settings_Contract::normalize_bool( $metadata->enableFPSMeter ?? false )
			|| VRodos_Runtime_Settings_Contract::normalize_bool( $metadata->aframeFPSMeterEnabled ?? false );
	}

	public function fps_meter_attr( $metadata ): string {
		return $this->is_fps_meter_enabled( $metadata ) ? '1' : '0';
	}

	public function navigation_mode( $metadata ): string {
		$value = is_object( $metadata ) && isset( $metadata->aframeNavigationMode )
			? trim( (string) $metadata->aframeNavigationMode )
			: '';

		if ( in_array( $value, [ 'walk', 'walkable', 'fly' ], true ) ) {
			return $value;
		}

		return 'off' === (string) ( is_object( $metadata ) ? ( $metadata->aframeCollisionMode ?? 'auto' ) : 'auto' )
			? 'walk'
			: 'walkable';
	}

	public function collision_mode_attr( $metadata ): string {
		return 'walkable' === $this->navigation_mode( $metadata ) ? 'auto' : 'off';
	}

	public function is_static_collision_enabled( $metadata ): bool {
		return 'walkable' === $this->navigation_mode( $metadata );
	}
}
