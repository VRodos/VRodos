<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-vrodos-compiler-types.php';
require_once __DIR__ . '/class-vrodos-compiler-scene-settings.php';
require_once __DIR__ . '/class-vrodos-compiler-runtime-script-planner.php';

/**
 * Converts repository data plus one project target into an effective compile plan.
 */
final class VRodos_Compiler_Plan_Resolver {
	private VRodos_Compiler_Scene_Settings $scene_settings;
	private VRodos_Compiler_Runtime_Script_Planner $script_planner;

	public function __construct(
		VRodos_Compiler_Scene_Settings $scene_settings,
		VRodos_Compiler_Runtime_Script_Planner $script_planner
	) {
		$this->scene_settings = $scene_settings;
		$this->script_planner = $script_planner;
	}

	public function resolve( VRodos_Compile_Request $request, array $context ): VRodos_Project_Compile_Plan {
		$scene_plans = [];
		$scene_ids   = array_values( (array) ( $context['valid_scene_ids'] ?? [] ) );
		$scene_json  = array_values( (array) ( $context['scene_json'] ?? [] ) );
		$scene_title = array_values( (array) ( $context['scene_title'] ?? [] ) );

		foreach ( $scene_ids as $index => $scene_id ) {
			$source = $scene_json[ $index ] ?? null;
			if ( ! is_object( $source ) ) {
				throw new RuntimeException( '[VRodos] Compile plan received invalid scene JSON for scene #' . (int) $scene_id );
			}

			$normalized_scene = $this->clone_scene( $source );
			$metadata         = is_object( $normalized_scene->metadata ?? null ) ? $normalized_scene->metadata : new stdClass();
			$normalized_scene->metadata = $metadata;

			// These two fields are build-target policy, not per-scene artistic settings.
			$metadata->aframeRuntimeMode = $request->runtime_mode;
			$profile_key                  = VRodos_Runtime_Settings_Contract::metadata_key( 'vrRuntimeProfile' );
			$metadata->{$profile_key}     = $request->vr_runtime_profile;

			$diagnostics = [];
			$settings    = $this->scene_settings->build_settings(
				$metadata,
				$normalized_scene,
				$request->project_id,
				$diagnostics
			);
			$settings['runtimeMode']     = $request->runtime_mode;
			$settings['vrRuntimeProfile'] = $request->vr_runtime_profile;

			$capabilities = $this->script_planner->capabilities_for_resolved_scene( $normalized_scene, $settings );
			$chunk_ids    = $this->script_planner->script_ids_for_capabilities( $capabilities );
			$hover        = VRodos_Runtime_Settings_Contract::normalize_bool( $metadata->aframeHoveringInteractables ?? true, true );

			$scene_plans[] = new VRodos_Scene_Compile_Plan(
				(int) $scene_id,
				(string) ( $scene_title[ $index ] ?? '' ),
				$normalized_scene,
				$settings,
				$capabilities,
				$chunk_ids,
				$diagnostics,
				$hover
			);
		}

		return new VRodos_Project_Compile_Plan(
			$request,
			(string) ( $context['project_title'] ?? '' ),
			(string) ( $context['project_type_slug'] ?? '' ),
			$scene_plans
		);
	}

	private function clone_scene( object $scene ): object {
		$json = function_exists( 'wp_json_encode' ) ? wp_json_encode( $scene ) : json_encode( $scene );
		$copy = is_string( $json ) ? json_decode( $json ) : null;
		if ( ! is_object( $copy ) ) {
			throw new RuntimeException( '[VRodos] Scene could not be normalized into a compile plan.' );
		}

		return $copy;
	}
}
