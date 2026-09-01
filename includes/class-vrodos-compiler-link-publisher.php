<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-vrodos-compiler-types.php';

/**
 * Builds the stable public response contract independently of HTML generation.
 */
final class VRodos_Compiler_Link_Publisher {
	private $url_for_file;
	private string $default_link_mode;
	private string $primary_runtime_mode;

	public function __construct( callable $url_for_file, string $default_link_mode, string $primary_runtime_mode ) {
		$this->url_for_file        = $url_for_file;
		$this->default_link_mode   = $default_link_mode;
		$this->primary_runtime_mode = $primary_runtime_mode;
	}

	/** @param VRodos_Compile_Artifact[] $artifacts */
	public function publish(
		VRodos_Project_Compile_Plan $plan,
		array $artifacts,
		array $warnings = [],
		?bool $network_runtime_ready = null
	): VRodos_Compile_Result {
		$runtime_mode   = $plan->request->runtime_mode;
		$master_scene   = $plan->is_vrexpo() ? $plan->first_scene_id : $plan->last_scene_id;
		$master_file    = $this->target_filename( $plan, VRodos_Runtime_Target_Plan::MASTER, $master_scene );
		$selected_scene = $plan->request->selected_scene_id > 0 ? $plan->request->selected_scene_id : $master_scene;
		$selected_master_file = $this->target_filename( $plan, VRodos_Runtime_Target_Plan::MASTER, $selected_scene );

		$links = [
			'DefaultLinkMode' => $this->default_link_mode,
			'PrimaryLinkMode' => $plan->is_networked() ? $this->primary_runtime_mode : 'static',
			'RuntimeMode'     => $runtime_mode,
			'VrRuntimeProfile' => $plan->request->vr_runtime_profile,
			'MasterClient'    => $this->url( $plan->request->project_id, $master_file, null, $runtime_mode ),
			'CurrentSceneMasterClient' => $this->url( $plan->request->project_id, $selected_master_file, null, $runtime_mode ),
		];

		if ( $plan->is_networked() ) {
			$this->append_variants( $links, 'MasterClient', $plan->request->project_id, $master_file, $runtime_mode );
			$this->append_variants( $links, 'CurrentSceneMasterClient', $plan->request->project_id, $selected_master_file, $runtime_mode );
		}

		if ( $plan->is_networked() && ! $plan->is_vrexpo() ) {
			$index_file          = $this->target_filename( $plan, VRodos_Runtime_Target_Plan::INDEX, $plan->last_scene_id );
			$simple_file         = $this->target_filename( $plan, VRodos_Runtime_Target_Plan::SIMPLE, $plan->last_scene_id );
			$current_simple_file = $this->target_filename( $plan, VRodos_Runtime_Target_Plan::SIMPLE, $selected_scene );

			$links['index']                    = $this->url( $plan->request->project_id, $index_file, null, $runtime_mode );
			$links['SimpleClient']             = $this->url( $plan->request->project_id, $simple_file, null, $runtime_mode );
			$links['CurrentSceneSimpleClient'] = $this->url( $plan->request->project_id, $current_simple_file, null, $runtime_mode );
			$this->append_variants( $links, 'Index', $plan->request->project_id, $index_file, $runtime_mode );
			$this->append_variants( $links, 'SimpleClient', $plan->request->project_id, $simple_file, $runtime_mode );
			$this->append_variants( $links, 'CurrentSceneSimpleClient', $plan->request->project_id, $current_simple_file, $runtime_mode );
		}

		return new VRodos_Compile_Result( $links, $artifacts, $warnings, $network_runtime_ready );
	}

	private function target_filename( VRodos_Project_Compile_Plan $plan, string $kind, int $scene_id ): string {
		$target = $plan->target( $kind, $scene_id );
		if ( ! $target instanceof VRodos_Runtime_Target_Plan ) {
			throw new RuntimeException( '[VRodos] Compile plan is missing target ' . $kind . ' for scene #' . $scene_id );
		}
		return $target->filename;
	}

	private function append_variants( array &$links, string $field, int $project_id, string $filename, string $runtime_mode ): void {
		$local = $this->url( $project_id, $filename, 'local', $runtime_mode );
		$links[ 'Local' . $field ] = $local;
		$public = $this->url( $project_id, $filename, 'public', $runtime_mode );
		if ( $public !== $local ) {
			$links[ 'Public' . $field ] = $public;
		}
	}

	private function url( int $project_id, string $filename, ?string $mode, string $runtime_mode ): string {
		return (string) call_user_func( $this->url_for_file, $project_id, $filename, $mode, $runtime_mode );
	}
}
