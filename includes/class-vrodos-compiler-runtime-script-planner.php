<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-vrodos-compiler-runtime-feature-flags.php';

class VRodos_Compiler_Runtime_Script_Planner {
	private VRodos_Compiler_Runtime_Manifest $manifest;
	private VRodos_Compiler_Runtime_Feature_Flags $feature_flags;

	public function __construct( VRodos_Compiler_Runtime_Manifest $manifest, ?VRodos_Compiler_Runtime_Feature_Flags $feature_flags = null ) {
		$this->manifest      = $manifest;
		$this->feature_flags = $feature_flags ?: new VRodos_Compiler_Runtime_Feature_Flags();
	}

	public function script_ids_for_scene( $scene_json, string $runtime_mode = 'networked' ): array {
		$metadata  = $this->feature_flags->metadata( $scene_json );
		$requested = [
			'scene-components',
		];

		if ( $this->feature_flags->is_networked_runtime( $runtime_mode ) ) {
			$requested[] = 'networked-components';
		}

		$requested[] = 'core-runtime';

		if ( $this->feature_flags->is_fps_meter_enabled( $metadata ) ) {
			$requested[] = 'fps-meter';
		}

		if ( $this->feature_flags->is_static_collision_enabled( $metadata ) ) {
			$requested[] = 'collision-bvh-vendor';
		}

		if ( $this->feature_flags->is_post_fx_enabled( $metadata ) ) {
			if ( $this->feature_flags->post_fx_engine( $metadata ) === VRodos_Compiler_Runtime_Feature_Flags::POST_FX_ENGINE_PMNDRS ) {
				$requested[] = 'pmndrs-postfx';
				if ( $this->feature_flags->is_pmndrs_atmosphere_enabled( $metadata ) ) {
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

	private function safe_global_name( string $name ): string {
		return preg_match( '/^[A-Za-z_$][A-Za-z0-9_$]*$/', $name ) ? $name : '';
	}

	private function escape_attr( string $value ): string {
		return htmlspecialchars( $value, ENT_QUOTES, 'UTF-8' );
	}
}
