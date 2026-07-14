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
		$master_file    = 'Master_Client_' . $master_scene . '.html';
		$selected_scene = $plan->request->selected_scene_id > 0 ? $plan->request->selected_scene_id : $master_scene;

		$links = [
			'DefaultLinkMode' => $this->default_link_mode,
			'PrimaryLinkMode' => $plan->is_networked() ? $this->primary_runtime_mode : 'static',
			'RuntimeMode'     => $runtime_mode,
			'VrRuntimeProfile' => $plan->request->vr_runtime_profile,
			'MasterClient'    => $this->url( $master_file, null, $runtime_mode ),
			'CurrentSceneMasterClient' => $this->url( 'Master_Client_' . $selected_scene . '.html', null, $runtime_mode ),
		];

		if ( $plan->is_networked() ) {
			$this->append_variants( $links, 'MasterClient', $master_file, $runtime_mode );
			$this->append_variants( $links, 'CurrentSceneMasterClient', 'Master_Client_' . $selected_scene . '.html', $runtime_mode );
		}

		if ( $plan->is_networked() && ! $plan->is_vrexpo() ) {
			$index_file = 'index_' . $plan->last_scene_id . '.html';
			$simple_file = 'Simple_Client_' . $plan->last_scene_id . '.html';
			$current_simple_file = 'Simple_Client_' . $selected_scene . '.html';

			$links['index']                    = $this->url( $index_file, null, $runtime_mode );
			$links['SimpleClient']             = $this->url( $simple_file, null, $runtime_mode );
			$links['CurrentSceneSimpleClient'] = $this->url( $current_simple_file, null, $runtime_mode );
			$this->append_variants( $links, 'Index', $index_file, $runtime_mode );
			$this->append_variants( $links, 'SimpleClient', $simple_file, $runtime_mode );
			$this->append_variants( $links, 'CurrentSceneSimpleClient', $current_simple_file, $runtime_mode );
		}

		return new VRodos_Compile_Result( $links, $artifacts, $warnings, $network_runtime_ready );
	}

	private function append_variants( array &$links, string $field, string $filename, string $runtime_mode ): void {
		$local = $this->url( $filename, 'local', $runtime_mode );
		$links[ 'Local' . $field ] = $local;
		$public = $this->url( $filename, 'public', $runtime_mode );
		if ( $public !== $local ) {
			$links[ 'Public' . $field ] = $public;
		}
	}

	private function url( string $filename, ?string $mode, string $runtime_mode ): string {
		return (string) call_user_func( $this->url_for_file, $filename, $mode, $runtime_mode );
	}
}
