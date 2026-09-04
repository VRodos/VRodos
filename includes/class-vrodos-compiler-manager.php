<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-vrodos-runtime-settings-contract.php';
require_once __DIR__ . '/class-vrodos-desktop-performance-profiles.php';
require_once __DIR__ . '/class-vrodos-compiler-runtime-feature-flags.php';
require_once __DIR__ . '/class-vrodos-compiler-runtime-assets.php';
require_once __DIR__ . '/class-vrodos-compiler-template-renderer.php';
require_once __DIR__ . '/class-vrodos-compiler-scene-repository.php';
require_once __DIR__ . '/class-vrodos-compiler-scene-settings.php';
require_once __DIR__ . '/class-vrodos-compiler-runtime-manifest.php';
require_once __DIR__ . '/class-vrodos-compiler-runtime-script-planner.php';
require_once __DIR__ . '/class-vrodos-compiler-types.php';
require_once __DIR__ . '/class-vrodos-compiler-plan-resolver.php';
require_once __DIR__ . '/class-vrodos-compiler-artifact-transaction.php';
require_once __DIR__ . '/class-vrodos-compiler-resource-publisher.php';
require_once __DIR__ . '/class-vrodos-compiler-link-publisher.php';
require_once __DIR__ . '/class-vrodos-compiler-network-runtime-service.php';
require_once __DIR__ . '/class-vrodos-compiler-target-assembler.php';
require_once __DIR__ . '/class-vrodos-url-normalizer.php';
require_once __DIR__ . '/class-vrodos-runtime-url-resolver.php';
require_once __DIR__ . '/class-vrodos-asset-optimization-manager.php';

class VRodos_Compiler_Manager {
	private VRodos_URL_Normalizer $url_normalizer;
	private VRodos_Runtime_URL_Resolver $runtime_url_resolver;
	private VRodos_Compiler_Runtime_Feature_Flags $runtime_feature_flags;
	private VRodos_Compiler_Runtime_Assets $runtime_assets;
	private VRodos_Compiler_Template_Renderer $template_renderer;
	private VRodos_Compiler_Scene_Repository $scene_repository;
	private VRodos_Compiler_Scene_Settings $scene_settings;
	private VRodos_Compiler_Runtime_Script_Planner $runtime_script_planner;
	private VRodos_Compiler_Plan_Resolver $plan_resolver;
	private VRodos_Compiler_Artifact_Transaction $artifact_transaction;
	private VRodos_Compiler_Resource_Publisher $resource_publisher;
	private VRodos_Compiler_Link_Publisher $link_publisher;
	private VRodos_Compiler_Network_Runtime_Service $network_runtime_service;
	private VRodos_Compiler_Target_Assembler $target_assembler;

	public function __construct() {
		$this->url_normalizer        = new VRodos_URL_Normalizer();
		$this->runtime_url_resolver  = new VRodos_Runtime_URL_Resolver( null, $this->url_normalizer->website_root_host() );
		$this->runtime_feature_flags = new VRodos_Compiler_Runtime_Feature_Flags();
		$this->runtime_assets         = new VRodos_Compiler_Runtime_Assets();
		$this->template_renderer      = new VRodos_Compiler_Template_Renderer();
		$this->scene_repository       = new VRodos_Compiler_Scene_Repository();
		$this->scene_settings         = new VRodos_Compiler_Scene_Settings( $this->scene_repository, $this->runtime_feature_flags );
		$this->runtime_script_planner = new VRodos_Compiler_Runtime_Script_Planner( new VRodos_Compiler_Runtime_Manifest(), $this->runtime_feature_flags );
		$this->target_assembler = new VRodos_Compiler_Target_Assembler(
			$this->runtime_assets,
			$this->template_renderer,
			$this->scene_repository,
			$this->scene_settings,
			$this->runtime_script_planner,
			$this->url_normalizer
		);

		$this->plan_resolver           = new VRodos_Compiler_Plan_Resolver( $this->scene_settings, $this->runtime_script_planner );
		$this->artifact_transaction    = new VRodos_Compiler_Artifact_Transaction();
		$this->resource_publisher      = new VRodos_Compiler_Resource_Publisher( $this->runtime_url_resolver );
		$this->network_runtime_service = new VRodos_Compiler_Network_Runtime_Service( $this->runtime_url_resolver->local_runtime_base_url() );
		$this->link_publisher          = new VRodos_Compiler_Link_Publisher(
			[ $this->runtime_url_resolver, 'runtime_url_for_file' ],
			$this->runtime_url_resolver->default_link_mode(),
			$this->runtime_url_resolver->primary_runtime_mode()
		);
	}

	public function compile( VRodos_Compile_Request $request ): VRodos_Compile_Result|WP_Error {
		if ( $request->project_id <= 0 || empty( $request->scene_ids ) ) {
			return new WP_Error( 'vrodos_compile_invalid_request', 'A project and at least one scene are required.', [ 'status' => 400 ] );
		}

		$context = $this->scene_repository->load_compile_context( $request->project_id, $request->scene_ids, $request->selected_scene_id );
		if ( ! empty( $context['error'] ) ) {
			return new WP_Error( 'vrodos_compile_invalid_context', (string) $context['error'], [ 'status' => 400 ] );
		}

		$clients_published = false;
		try {
			$plan = $this->plan_resolver->resolve( $request, $context );
			$profile_assets = VRodos_Asset_Optimization_Manager::prepare_desktop_profile_derivatives( $plan );
			if ( 'pending' === (string) ( $profile_assets['status'] ?? '' ) ) {
				return new WP_Error(
					'vrodos_desktop_profiles_pending',
					(string) ( $profile_assets['message'] ?? 'Preparing desktop performance profile assets.' ),
					[
						'status'  => 409,
						'pending' => true,
						'ready'   => absint( $profile_assets['ready'] ?? 0 ),
						'total'   => absint( $profile_assets['total'] ?? 0 ),
						'retryAfterMs' => 3000,
					]
				);
			}
			if ( 'failed' === (string) ( $profile_assets['status'] ?? '' ) ) {
				return new WP_Error(
					'vrodos_desktop_profiles_failed',
					(string) ( $profile_assets['message'] ?? 'Desktop performance profile asset preparation failed.' ),
					[ 'status' => 409 ]
				);
			}
			$this->resource_publisher->prepare_plan( $plan );
			$this->template_renderer->begin_capture();
			$render_warnings = [];

			foreach ( $plan->targets as $target_plan ) {
				$this->target_assembler->render( $target_plan, $plan );
				if ( VRodos_Runtime_Target_Plan::INDEX !== $target_plan->kind ) {
					$render_warnings = array_merge( $render_warnings, (array) ( $this->target_assembler->last_compile_diagnostics()['warnings'] ?? [] ) );
				}
			}

			$artifacts = $this->template_renderer->finish_capture();
			$this->artifact_transaction->commit( $request->project_id, $artifacts );
			$clients_published = true;
			$this->resource_publisher->finalize( $artifacts );

			$warnings = $render_warnings;
			foreach ( $plan->scenes as $scene_plan ) {
				$warnings = array_merge( $warnings, $scene_plan->diagnostics );
			}

			$network_ready = null;
			if ( $plan->is_networked() ) {
				try {
					$network_ready = $this->network_runtime_service->ensure_started();
				} catch ( Throwable $startup_error ) {
					$network_ready = false;
					error_log( '[VRodos] Network runtime startup failed after compile: ' . $startup_error->getMessage() );
				}
				if ( ! $network_ready ) {
					$warnings[] = 'Compiled files were published, but the network runtime could not be started automatically.';
				}
			}

			return $this->link_publisher->publish( $plan, $artifacts, $warnings, $network_ready );
		} catch ( Throwable $error ) {
			$this->template_renderer->abort_capture();
			if ( ! $clients_published ) {
				$this->resource_publisher->abort();
			}
			error_log( '[VRodos] Compile failed for project #' . $request->project_id . ': ' . $error->getMessage() );
			$status  = 409 === (int) $error->getCode() ? 409 : 500;
			$message = 409 === $status ? $error->getMessage() : 'Scene compilation failed. Check the server log for details.';
			return new WP_Error( 'vrodos_compile_failed', $message, [ 'status' => $status ] );
		}
	}

}
