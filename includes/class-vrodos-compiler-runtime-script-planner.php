<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Compiler_Runtime_Script_Planner {
	private VRodos_Compiler_Runtime_Manifest $manifest;

	public function __construct( VRodos_Compiler_Runtime_Manifest $manifest ) {
		$this->manifest = $manifest;
	}

	public function script_ids_for_scene( $scene_json, string $runtime_mode = 'networked' ): array {
		$metadata  = is_object( $scene_json->metadata ?? null ) ? $scene_json->metadata : new stdClass();
		$requested = [
			'scene-components',
		];

		if ( $this->is_networked_runtime( $runtime_mode ) ) {
			$requested[] = 'networked-components';
		}

		$requested[] = 'core-runtime';

		if ( $this->is_fps_meter_enabled( $metadata ) ) {
			$requested[] = 'fps-meter';
		}

		if ( $this->is_static_collision_enabled( $metadata ) ) {
			$requested[] = 'collision-bvh-vendor';
		}

		if ( $this->is_post_fx_enabled( $metadata ) ) {
			if ( $this->post_fx_engine( $metadata ) === 'pmndrs' ) {
				$requested[] = 'pmndrs-postfx';
				if ( $this->is_pmndrs_atmosphere_enabled( $metadata ) ) {
					$requested[] = 'takram-atmosphere';
				}
			} else {
				$requested[] = 'legacy-postfx';
			}
		}

		$requested[] = 'aframe-components';

		return $this->manifest->resolve_chunk_ids( $requested );
	}

	public function render_scripts_for_scene( $scene_json, string $runtime_mode = 'networked' ): string {
		return $this->render_scripts_for_chunk_ids( $this->script_ids_for_scene( $scene_json, $runtime_mode ) );
	}

	public function render_scripts_for_chunk_ids( array $chunk_ids ): string {
		$chunks = $this->manifest->chunks_for_ids( $this->manifest->resolve_chunk_ids( $chunk_ids ) );
		$tags   = [];

		foreach ( $chunks as $chunk ) {
			$tags[] = $this->render_chunk( $chunk );
		}

		return implode( "\n    ", array_filter( $tags ) );
	}

	private function render_chunk( array $chunk ): string {
		if ( 'script' === (string) $chunk['type'] ) {
			return '<script src="' . $this->escape_attr( (string) $chunk['src'] ) . '"></script>';
		}

		if ( 'inline-module' === (string) $chunk['type'] ) {
			return $this->render_inline_module_chunk( $chunk );
		}

		throw new RuntimeException( '[VRodos] Unsupported runtime chunk type: ' . (string) $chunk['type'] );
	}

	private function render_inline_module_chunk( array $chunk ): string {
		$ready_global = $this->safe_global_name( (string) ( $chunk['readyGlobal'] ?? '' ) );
		$global       = $this->safe_global_name( (string) ( $chunk['global'] ?? '' ) );
		$export       = (string) ( $chunk['export'] ?? 'default' );
		$module_url   = (string) $chunk['moduleImport'];

		if ( '' === $ready_global || '' === $global || '' === $module_url ) {
			throw new RuntimeException( '[VRodos] Runtime inline module chunk is incomplete: ' . (string) $chunk['id'] );
		}

		$export_expression = 'default' === $export ? 'm.default' : 'm[' . json_encode( $export, JSON_UNESCAPED_SLASHES ) . ']';
		$module_json       = json_encode( $module_url, JSON_UNESCAPED_SLASHES );

		return '<script type="module">
        window.' . $ready_global . ' = import(' . $module_json . ')
            .then((m) => { window.' . $global . ' = ' . $export_expression . '; return window.' . $global . '; })
            .catch((e) => { console.warn("VRodos Error: runtime module failed to load.", e); return null; });
    </script>';
	}

	private function is_post_fx_enabled( $metadata ): bool {
		return VRodos_Runtime_Settings_Contract::normalize_bool( $metadata->aframePostFXEnabled ?? false );
	}

	private function post_fx_engine( $metadata ): string {
		return ( ( $metadata->aframePostFXEngine ?? 'legacy' ) === 'pmndrs' ) ? 'pmndrs' : 'legacy';
	}

	private function is_pmndrs_atmosphere_enabled( $metadata ): bool {
		return VRodos_Runtime_Settings_Contract::normalize_bool( $metadata->aframePmndrsAtmosphereEnabled ?? true, true );
	}

	private function is_fps_meter_enabled( $metadata ): bool {
		return VRodos_Runtime_Settings_Contract::normalize_bool( $metadata->enableFPSMeter ?? false )
			|| VRodos_Runtime_Settings_Contract::normalize_bool( $metadata->aframeFPSMeterEnabled ?? false );
	}

	private function is_static_collision_enabled( $metadata ): bool {
		$collision_mode = (string) ( $metadata->aframeCollisionMode ?? 'auto' );
		if ( 'off' === $collision_mode ) {
			return false;
		}

		$navigation_mode = (string) ( $metadata->aframeNavigationMode ?? '' );
		return ! in_array( $navigation_mode, [ 'walk', 'fly' ], true );
	}

	private function is_networked_runtime( string $runtime_mode ): bool {
		return 'single-player' !== $runtime_mode;
	}

	private function safe_global_name( string $name ): string {
		return preg_match( '/^[A-Za-z_$][A-Za-z0-9_$]*$/', $name ) ? $name : '';
	}

	private function escape_attr( string $value ): string {
		return htmlspecialchars( $value, ENT_QUOTES, 'UTF-8' );
	}
}
