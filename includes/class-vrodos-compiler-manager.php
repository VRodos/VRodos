<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-vrodos-runtime-settings-contract.php';
require_once __DIR__ . '/class-vrodos-compiler-runtime-feature-flags.php';
require_once __DIR__ . '/class-vrodos-compiler-runtime-assets.php';
require_once __DIR__ . '/class-vrodos-compiler-template-renderer.php';
require_once __DIR__ . '/class-vrodos-compiler-scene-repository.php';
require_once __DIR__ . '/class-vrodos-compiler-scene-settings.php';
require_once __DIR__ . '/class-vrodos-compiler-aframe-entity-renderer.php';
require_once __DIR__ . '/class-vrodos-compiler-runtime-manifest.php';
require_once __DIR__ . '/class-vrodos-compiler-runtime-script-planner.php';
require_once __DIR__ . '/class-vrodos-compiler-runtime-page-builder.php';
require_once __DIR__ . '/class-vrodos-compiler-types.php';
require_once __DIR__ . '/class-vrodos-compiler-plan-resolver.php';
require_once __DIR__ . '/class-vrodos-compiler-artifact-transaction.php';
require_once __DIR__ . '/class-vrodos-compiler-link-publisher.php';
require_once __DIR__ . '/class-vrodos-compiler-network-runtime-service.php';
require_once __DIR__ . '/class-vrodos-compiler-target-renderer.php';

class VRodos_Compiler_Manager {
	public const RUNTIME_MODE_NETWORKED     = 'networked';
	public const RUNTIME_MODE_SINGLE_PLAYER = 'single-player';

	private string $plugin_path_url;
	private string $website_root_url;
	private array $runtime_link_settings = [];
	private string $runtime_mode = self::RUNTIME_MODE_NETWORKED;
	private VRodos_Compiler_Runtime_Feature_Flags $runtime_feature_flags;
	private VRodos_Compiler_Runtime_Assets $runtime_assets;
	private VRodos_Compiler_Template_Renderer $template_renderer;
	private VRodos_Compiler_Scene_Repository $scene_repository;
	private VRodos_Compiler_Scene_Settings $scene_settings;
	private VRodos_Compiler_AFrame_Entity_Renderer $entity_renderer;
	private VRodos_Compiler_Runtime_Page_Builder $runtime_page_builder;
	private VRodos_Compiler_Runtime_Script_Planner $runtime_script_planner;
	private VRodos_Compiler_Plan_Resolver $plan_resolver;
	private VRodos_Compiler_Artifact_Transaction $artifact_transaction;
	private VRodos_Compiler_Link_Publisher $link_publisher;
	private VRodos_Compiler_Network_Runtime_Service $network_runtime_service;
	private VRodos_Compiler_Target_Renderer $target_renderer;

	public function __construct() {
		$this->plugin_path_url       = VRodos_Path_Manager::plugin_url();
		$this->runtime_feature_flags = new VRodos_Compiler_Runtime_Feature_Flags();
		$this->runtime_assets        = new VRodos_Compiler_Runtime_Assets();
		$this->template_renderer = new VRodos_Compiler_Template_Renderer();
		$this->scene_repository = new VRodos_Compiler_Scene_Repository();
		$this->scene_settings   = new VRodos_Compiler_Scene_Settings( $this->scene_repository, $this->runtime_feature_flags );
		$this->runtime_script_planner = new VRodos_Compiler_Runtime_Script_Planner( new VRodos_Compiler_Runtime_Manifest(), $this->runtime_feature_flags );
		$this->entity_renderer  = new VRodos_Compiler_AFrame_Entity_Renderer(
			$this->runtime_assets,
			$this->scene_repository,
			[ $this, 'normalize_url' ]
		);
		$this->runtime_page_builder = new VRodos_Compiler_Runtime_Page_Builder(
			$this->runtime_assets,
			$this->template_renderer,
			$this->scene_settings,
			$this->entity_renderer,
			[ $this, 'normalize_url' ],
			function (): string {
				return $this->build_gltf_decoder_config();
			}
		);

		$this->website_root_url = $this->detect_request_host();

		// Fallback for terminal/cron etc if everything else fails
		if ( ! $this->website_root_url ) {
			$this->website_root_url = 'localhost';
		}

		$this->plugin_path_url = $this->normalize_url( $this->plugin_path_url );

		$this->runtime_link_settings = $this->load_runtime_link_settings();
		$this->plan_resolver           = new VRodos_Compiler_Plan_Resolver( $this->scene_settings, $this->runtime_script_planner );
		$this->artifact_transaction    = new VRodos_Compiler_Artifact_Transaction();
		$this->network_runtime_service = new VRodos_Compiler_Network_Runtime_Service();
		$this->target_renderer          = new VRodos_Compiler_Target_Renderer();
		$this->link_publisher          = new VRodos_Compiler_Link_Publisher(
			[ $this, 'runtime_url_for_file' ],
			(string) $this->runtime_link_settings['default_link_mode'],
			$this->primary_runtime_mode()
		);
	}

	public function compile_aframe( $project_id, $scene_id_list, $showPawnPositions, $runtime_mode = null ) {
		$context = $this->scene_repository->load_compile_context( (int) $project_id, (array) $scene_id_list );
		if ( ! empty( $context['error'] ) ) {
			return wp_json_encode( [ 'error' => (string) $context['error'] ] );
		}

		$first_scene_json = $context['first_scene_json'];
		$metadata         = is_object( $first_scene_json->metadata ?? null ) ? $first_scene_json->metadata : new stdClass();
		$request          = new VRodos_Compile_Request(
			(int) $project_id,
			(int) ( $context['last_scene_id'] ?? 0 ),
			(array) $context['valid_scene_ids'],
			$this->runtime_feature_flags->runtime_mode_for_scene( $first_scene_json, $runtime_mode ),
			(string) VRodos_Runtime_Settings_Contract::normalize_metadata_value( $metadata, 'vrRuntimeProfile', 'desktop' ),
			VRodos_Runtime_Settings_Contract::normalize_bool( $showPawnPositions, false )
		);
		$result = $this->compile( $request );
		if ( is_wp_error( $result ) ) {
			return wp_json_encode( [ 'error' => $result->get_error_message(), 'code' => $result->get_error_code() ] );
		}

		return wp_json_encode( $result->to_legacy_payload() );
	}

	public function compile( VRodos_Compile_Request $request ): VRodos_Compile_Result|WP_Error {
		if ( $request->project_id <= 0 || empty( $request->scene_ids ) ) {
			return new WP_Error( 'vrodos_compile_invalid_request', 'A project and at least one scene are required.', [ 'status' => 400 ] );
		}

		$context = $this->scene_repository->load_compile_context( $request->project_id, $request->scene_ids, $request->selected_scene_id );
		if ( ! empty( $context['error'] ) ) {
			return new WP_Error( 'vrodos_compile_invalid_context', (string) $context['error'], [ 'status' => 400 ] );
		}

		try {
			$plan               = $this->plan_resolver->resolve( $request, $context );
			$this->runtime_mode = $request->runtime_mode;
			$this->template_renderer->begin_capture();
			$render_warnings = [];

			foreach ( $plan->scenes as $scene_plan ) {
				$this->entity_renderer->configure( $this->plugin_path_url, $scene_plan->hover_enabled );
				if ( $plan->is_networked() && ! $plan->is_vrexpo() ) {
					// Preserve the established index heading contract: every index uses the first scene title.
					$this->createIndexFile( $plan->project_title, $scene_plan->scene_id, $plan->scenes[0]->title );
				}
				$this->createMasterClient(
					$scene_plan->scene_id,
					$scene_plan->title,
					$scene_plan->scene_json,
					$request->show_pawn_positions_attr(),
					$request->project_id,
					$plan->scene_ids(),
					$scene_plan->settings,
					$scene_plan->chunk_ids,
					$scene_plan->diagnostics
				);
				$render_warnings = array_merge( $render_warnings, (array) ( $this->runtime_page_builder->last_compile_diagnostics()['warnings'] ?? [] ) );
				if ( $plan->is_networked() && ! $plan->is_vrexpo() ) {
					$this->createSimpleClient(
						$scene_plan->scene_id,
						$scene_plan->scene_json,
						$request->project_id,
						$request->show_pawn_positions_attr(),
						$scene_plan->settings,
						$scene_plan->diagnostics
					);
					$render_warnings = array_merge( $render_warnings, (array) ( $this->runtime_page_builder->last_compile_diagnostics()['warnings'] ?? [] ) );
				}
			}

			$artifacts = $this->template_renderer->finish_capture();
			$this->artifact_transaction->commit( $request->project_id, $artifacts );

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
			error_log( '[VRodos] Compile failed for project #' . $request->project_id . ': ' . $error->getMessage() );
			$status  = 409 === (int) $error->getCode() ? 409 : 500;
			$message = 409 === $status ? $error->getMessage() : 'Scene compilation failed. Check the server log for details.';
			return new WP_Error( 'vrodos_compile_failed', $message, [ 'status' => $status ] );
		}
	}

	public static function normalize_runtime_mode( $runtime_mode ): string {
		return VRodos_Compiler_Runtime_Feature_Flags::normalize_runtime_mode_value( $runtime_mode );
	}

	private function is_networked_runtime(): bool {
		return $this->runtime_feature_flags->is_networked_runtime( $this->runtime_mode );
	}

	private function is_single_player_runtime(): bool {
		return $this->runtime_feature_flags->is_single_player_runtime( $this->runtime_mode );
	}

	public function nodeJSpath() {
		return $this->primary_runtime_base_url();
	}

	public function runtime_url_for_file( string $filename, ?string $mode = null, ?string $runtime_mode = null ): string {
		$runtime_mode = null === $runtime_mode ? $this->runtime_mode : self::normalize_runtime_mode( $runtime_mode );
		if ( self::RUNTIME_MODE_SINGLE_PLAYER === $runtime_mode ) {
			return VRodos_Path_Manager::runtime_build_url( ltrim( $filename, '/' ) );
		}

		$base_urls = $this->runtime_base_urls();
		$mode      = $mode ?: $this->primary_runtime_mode();

		if ( 'public' === $mode && ! empty( $base_urls['public'] ) ) {
			return $base_urls['public'] . ltrim( $filename, '/' );
		}

		return $base_urls['local'] . ltrim( $filename, '/' );
	}

	private function detect_request_host(): string {
		$host = '';
		if ( isset( $_SERVER['HTTP_HOST'] ) ) {
			$host = (string) wp_unslash( $_SERVER['HTTP_HOST'] );
		}

		if ( '' === $host ) {
			$host = (string) wp_parse_url( get_site_url(), PHP_URL_HOST );
		}

		if ( str_contains( $host, '://' ) ) {
			$host = (string) wp_parse_url( $host, PHP_URL_HOST );
		}

		$host = preg_replace( '#:\d+$#', '', $host );
		return sanitize_text_field( (string) $host );
	}

	private function load_runtime_link_settings(): array {
		$options = (array) get_option( 'vrodos_general_settings', [] );
		$port    = absint( $options['vrodos_runtime_local_port'] ?? 5832 );
		$mode    = (string) ( $options['vrodos_runtime_default_link_mode'] ?? 'both' );

		if ( ! in_array( $mode, [ 'local', 'public', 'both' ], true ) ) {
			$mode = 'both';
		}

		return [
			'public_base_url'   => $this->normalize_runtime_base_url( (string) ( $options['vrodos_runtime_public_base_url'] ?? '' ) ),
			'local_host'        => $this->normalize_runtime_host( (string) ( $options['vrodos_runtime_local_host'] ?? '' ) ),
			'local_port'        => $port > 0 ? (string) $port : '5832',
			'default_link_mode' => $mode,
		];
	}

	private function normalize_runtime_base_url( string $url ): string {
		$url = trim( $url );
		if ( '' === $url ) {
			return '';
		}

		if ( ! preg_match( '#^https?://#i', $url ) ) {
			$url = 'https://' . $url;
		}

		$url = esc_url_raw( $url, [ 'http', 'https' ] );
		return $url ? trailingslashit( $url ) : '';
	}

	private function normalize_runtime_host( string $host ): string {
		$host = trim( $host );
		if ( '' === $host ) {
			return '';
		}

		if ( str_contains( $host, '://' ) ) {
			$parsed_host = wp_parse_url( $host, PHP_URL_HOST );
			$host        = $parsed_host ? (string) $parsed_host : $host;
		}

		$host = preg_replace( '#[:/\\\\].*$#', '', $host );
		return sanitize_text_field( (string) $host );
	}

	private function runtime_base_urls(): array {
		$local_host = $this->runtime_link_settings['local_host'] ?: $this->website_root_url;
		$local_port = $this->runtime_link_settings['local_port'] ?: '5832';
		$base_urls  = [
			'local' => 'http://' . $local_host . ':' . $local_port . '/',
		];

		if ( '' !== $this->runtime_link_settings['public_base_url'] ) {
			$base_urls['public'] = $this->runtime_link_settings['public_base_url'];
		}

		return $base_urls;
	}

	private function primary_runtime_base_url(): string {
		$base_urls = $this->runtime_base_urls();
		$mode      = $this->primary_runtime_mode();

		return $base_urls[ $mode ] ?? $base_urls['local'];
	}

	private function primary_runtime_mode(): string {
		if ( 'public' === $this->runtime_link_settings['default_link_mode'] && '' !== $this->runtime_link_settings['public_base_url'] ) {
			return 'public';
		}

		return 'local';
	}

	/**
	 * Normalize URLs by stripping the 'localhost' domain and converting to relative paths.
	 * This fixes CORS and PNA issues when accessed via IP, because Node.js serves them as relative to itself.
	 */
	public function normalize_url( $url ) {
		$url = trim( (string) $url );
		if ( '' === $url || in_array( strtolower( $url ), [ 'false', 'null', 'undefined', '0' ], true ) ) {
			return '';
		}

		$parsed = wp_parse_url( $url );
		if ( ! is_array( $parsed ) ) {
			return $url;
		}
		$host = isset($parsed['host']) ? $parsed['host'] : '';
		$path = isset($parsed['path']) ? $parsed['path'] : '';

		// If it's a local URL, make it relative (path absolute)
		if ( $host === 'localhost' || $host === '127.0.0.1' || $host === $this->website_root_url || empty($host) || str_contains( $path, '/wp-content/' ) ) {
			$query = isset($parsed['query']) ? '?' . $parsed['query'] : '';
			return $path . $query;
		}

		return $url;
	}

	private function get_avatar_camera_position_attribute( $scene_json ): string {
		$position = $scene_json->objects->avatarCamera->position ?? [0, 1.6, 0];
		$position = is_array( $position ) ? $position : (array) $position;
		$position = array_values( $position );
		$values   = [];

		for ( $i = 0; $i < 3; $i++ ) {
			$value    = $position[ $i ] ?? ( 1 === $i ? 1.6 : 0 );
			$values[] = is_numeric( $value ) ? (string) (float) $value : (string) ( 1 === $i ? 1.6 : 0 );
		}

		return implode( ' ', $values );
	}

	private function createBasicDomStructureAframeDirector( $content, $scene_json, $project_id, $scene_id, $scene_id_list ) {
		$dom_elements = $this->runtime_page_builder->create_dom_structure( (string) $content, $scene_json, 'master-client-body' );
		$dom          = $dom_elements['dom'];
		$ascene       = $dom_elements['ascene'];
		$ascenePlayer = $dom->getElementById( 'player' );

		// Virtual-production recording uploads use the authenticated WordPress proxy.
		$media_panel        = $dom->getElementById( 'mediaPanel' );
		$recording_controls = $dom->getElementById( 'upload-recording-btn' );
		$project_type       = $this->scene_repository->get_project_type_slug( (int) $project_id );
		if ( 'virtualproduction_games' === $project_type ) {
			if ( $media_panel instanceof DOMElement ) {
				$media_panel->setAttribute( 'style', 'visibility: visible;' );
				$media_panel->setAttribute( 'data-vrodos-mediaverse-proxy', 'true' );
			}
			if ( $recording_controls instanceof DOMElement ) {
				$recording_controls->setAttribute( 'style', 'visibility: visible;' );
			}
		} else {
			if ( $media_panel instanceof DOMElement ) {
				$media_panel->setAttribute( 'style', 'visibility: hidden;' );
			}
			if ( $recording_controls instanceof DOMElement ) {
				$recording_controls->setAttribute( 'style', 'visibility: hidden;' );
			}
		}

		// Toggle general chat
		$chat_wrapper = $dom->getElementById( 'chat-wrapper-el' );
		if ( isset( $scene_json->metadata->enableGeneralChat ) ) {
			if ( filter_var( $scene_json->metadata->enableGeneralChat, FILTER_VALIDATE_BOOLEAN ) === true ) {
				$chat_wrapper->setAttribute( 'data-visible', 'true' );
				$chat_wrapper->setAttribute( 'style', 'visibility: visible' );
			} else {
				$chat_wrapper->setAttribute( 'data-visible', 'false' );
				$chat_wrapper->setAttribute( 'style', 'display: none; visibility: hidden' );
			}
		} else {
			$chat_wrapper->setAttribute( 'data-visible', 'false' );
		}

		$is_base_scene_element = $dom->getElementById( 'is-base-scene-input' );
		if ( min( $scene_id_list ) == $scene_id ) {
			$is_base_scene_element->setAttribute( 'value', 'true' );
		} else {
			$is_base_scene_element->setAttribute( 'value', 'false' );
		}

		$dom_elements['ascenePlayer'] = $ascenePlayer;
		return $dom_elements;
	}

	private function createIndexFile( $project_title, $scene_id, string $scene_title ) {
		$content        = $this->template_renderer->read_runtime_template( 'index_prototype.html' );
		$content        = str_replace( 'Client.html', 'Client_' . $scene_id . '.html', $content );
		$content        = str_replace( 'project_sceneId', $project_title . ' - ' . $scene_title, $content );
		$content        = $this->runtime_assets->replace_placeholders( $content );
		$content        = str_replace(
			'VRODOS_PLUGIN_URL_PLACEHOLDER',
			esc_url( $this->plugin_path_url ),
			$content
		);
		return $this->template_renderer->write_runtime_build( 'index_' . $scene_id . '.html', $content );
	}

	private function createMasterClient(
		$scene_id,
		string $scene_title,
		$scene_json,
		$showPawnPositions,
		$project_id,
		$scene_id_list,
		array $resolved_settings = [],
		array $chunk_ids = [],
		array $compile_diagnostics = []
	) {
		$runtime_profile = (string) ( $resolved_settings['vrRuntimeProfile'] ?? VRodos_Runtime_Settings_Contract::normalize_metadata_value(
			is_object( $scene_json->metadata ?? null ) ? $scene_json->metadata : new stdClass(),
			'vrRuntimeProfile',
			'desktop'
		) );
		$lean_single_player_headset = $this->is_single_player_runtime() && 'headset' === $runtime_profile;
		$network_vendor_scripts = $this->is_networked_runtime()
			? '<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.8.1/socket.io.min.js"></script>' . "\n    "
				. '<script src="../easyrtc/easyrtc.js"></script>' . "\n    "
				. '<script src="../dist/networked-aframe.js"></script>'
			: '';
		$extras_script = $lean_single_player_headset
			? ''
			: '<script src="https://cdn.jsdelivr.net/npm/aframe-extras@7.7.0/dist/aframe-extras.min.js"></script>';
		$environment_script = ! $lean_single_player_headset || $this->target_renderer->uses_legacy_environment_background( $resolved_settings )
			? '<script src="https://cdn.jsdelivr.net/npm/aframe-environment-component@1.5.0/dist/aframe-environment-component.min.js"></script>'
			: '';

		$content = $this->runtime_page_builder->prepare_template(
			'Master_Client_prototype.html',
			[
				'roomname'                           => 'room' . $scene_id,
				'AFRAME_RUNTIME_URL_PLACEHOLDER'     => esc_url( VRodos_Render_Runtime_Manager::get_aframe_runtime_url() ),
				'VRODOS_RUNTIME_MODE_PLACEHOLDER'    => esc_js( $this->runtime_mode ),
				'VRODOS_RUNTIME_SCRIPTS_PLACEHOLDER' => ! empty( $chunk_ids )
					? $this->runtime_script_planner->render_scripts_for_chunk_ids( $chunk_ids )
					: $this->runtime_script_planner->render_scripts_for_scene( $scene_json, $this->runtime_mode ),
				'VRODOS_NETWORK_VENDOR_SCRIPTS_PLACEHOLDER' => $network_vendor_scripts,
				'VRODOS_AFRAME_EXTRAS_SCRIPT_PLACEHOLDER'  => $extras_script,
				'VRODOS_ENVIRONMENT_SCRIPT_PLACEHOLDER'    => $environment_script,
				'VRODOS_PLUGIN_URL_PLACEHOLDER'      => esc_js( $this->plugin_path_url ),
			]
		);
		$basicDomElements = $this->createBasicDomStructureAframeDirector( $content, $scene_json, $project_id, $scene_id, $scene_id_list );

		$dom          = $basicDomElements['dom'];
		$objects      = $basicDomElements['objects'];
		$ascene       = $basicDomElements['ascene'];
		$ascenePlayer = $basicDomElements['ascenePlayer'];
		$camera_position_attr = $this->get_avatar_camera_position_attribute( $scene_json );

		$projectType = $this->scene_repository->get_project_type_slug( (int) $project_id );

		$dom->getElementsByTagName( 'title' )->item( 0 )->nodeValue = $scene_title;

		if ( $this->is_networked_runtime() ) {
			$enable_director_audio = ( $projectType == 'vrexpo_games' ) ? 'false' : 'true';
			$app_name              = ( $projectType == 'vrexpo_games' ) ? 'vrexpo' : 'vrodos';
			$ascene->setAttribute( 'networked-scene', "app: $app_name; room: room$scene_id; debug: false; audio: $enable_director_audio; adapter: easyrtc; serverURL: /; connectOnLoad: true; onConnect: connectionResolve;" );
			$this->target_renderer->apply_networking( $dom );
		} else {
			$ascene->removeAttribute( 'networked-scene' );
		}

		$this->target_renderer->apply_player_rig(
			$dom,
			$ascenePlayer,
			$projectType,
			$camera_position_attr,
			$this->is_networked_runtime(),
			$lean_single_player_headset
		);

		// print($scene_id)


		$this->runtime_page_builder->apply_scene_core(
			$dom,
			$ascene,
			$scene_json,
			(int) $project_id,
			(int) $scene_id,
			[
				'scene_loader'    => true,
				'resolved_scene_settings' => $resolved_settings,
				'compile_diagnostics'     => $compile_diagnostics,
				'render_options'  => [
					'showPawnPositions' => $showPawnPositions,
				],
			]
		);

		if ( $lean_single_player_headset ) {
			$compiled_scene_settings = VRodos_Compiler_AFrame_DOM_Helper::parse_component_attribute( $ascene->getAttribute( 'scene-settings' ) );
			$this->target_renderer->apply_lean_headset_mode( $ascene, $compiled_scene_settings );
		}

		if ( $this->is_single_player_runtime() ) {
			$this->target_renderer->apply_single_player_mode( $dom, $ascene );
		}

		return $this->runtime_page_builder->write_dom(
			$dom,
			'Master_Client_' . $scene_id . '.html',
			false,
			"<!-- Detected Hostname: {$this->website_root_url} -->\n"
		);
	}

	private function createSimpleClient( $scene_id, $scene_json, $project_id, string $show_pawn_positions, array $resolved_settings = [], array $compile_diagnostics = [] ) {

		$projectType = $this->scene_repository->get_project_type_slug( (int) $project_id );
		$app_name    = ( $projectType == 'vrexpo_games' ) ? 'vrexpo' : 'vrodos';
		$content     = $this->runtime_page_builder->prepare_template(
			'Simple_Client_prototype.html',
			[
				'appname'                            => $app_name,
				'roomname'                           => 'room' . $scene_id,
				'AFRAME_RUNTIME_URL_PLACEHOLDER'     => esc_url( VRodos_Render_Runtime_Manager::get_aframe_runtime_url() ),
				'VRODOS_RUNTIME_SCRIPTS_PLACEHOLDER' => $this->runtime_script_planner->render_scripts_for_chunk_ids( [ 'scene-components' ] ),
				'VRODOS_PLUGIN_URL_PLACEHOLDER'      => $this->normalize_url( $this->plugin_path_url ),
			]
		);

		// Create Basic dom structure for an aframe page
		$basicDomElements = $this->runtime_page_builder->create_dom_structure( $content, $scene_json, 'simple-client-body' );

		$dom        = $basicDomElements['dom'];
		$objects    = $basicDomElements['objects'];
		$actionsDiv = $basicDomElements['actionsDiv'];
		$ascene     = $basicDomElements['ascene'];

		$this->runtime_page_builder->apply_scene_core(
			$dom,
			$ascene,
			$scene_json,
			(int) $project_id,
			(int) $scene_id,
			[
				'resolved_scene_settings' => $resolved_settings,
				'compile_diagnostics'     => $compile_diagnostics,
				'render_options'          => [
					'showPawnPositions' => $show_pawn_positions,
				],
			]
		);
		$i = 0;
		foreach ( $objects as $contentObject ) {

			$cat_name = $contentObject->category_name ?? '';

			if ( $cat_name == 'pawn' ) {
				++$i;
				$buttonDiv = $dom->createElement( 'button' );

				$buttonDiv->setAttribute( 'id', 'screen-btn-' . $i );
				$buttonDiv->setAttribute( 'type', 'button' );
				$buttonDiv->setAttribute( 'class', 'screen-position-btn tw-btn tw-btn-sm tw-min-h-0 tw-h-auto tw-justify-start tw-gap-2 tw-rounded-2xl tw-border-white/10 tw-bg-white/8 tw-px-3 tw-py-2 tw-font-semibold tw-text-white hover:tw-bg-white/14' );
				$buttonDiv->setAttribute( 'aria-label', 'Go to position ' . $i );

				$pos_x = $contentObject->position[0];
				$pos_y = $contentObject->position[1];
				$pos_z = $contentObject->position[2];

				$rot_x = $contentObject->rotation[0];
				$rot_y = $contentObject->rotation[1];
				$rot_z = $contentObject->rotation[2];

				$buttonDiv->setAttribute( 'data-position', '{"x":' . $pos_x . ',"y":' . $pos_y . ',"z":' . $pos_z . '}' );
				$buttonDiv->setAttribute( 'data-rotation', '{"x":' . $rot_x . ',"y":' . $rot_y . ',"z":' . $rot_z . '}' );

				$iconSpan = $dom->createElement( 'i' );
				$iconSpan->setAttribute( 'data-lucide', 'map-pinned' );
				$iconSpan->setAttribute( 'class', 'tw-h-4 tw-w-4 tw-shrink-0' );
				$iconSpan->setAttribute( 'aria-hidden', 'true' );

				$labelSpan = $dom->createElement( 'span' );
				$labelSpan->setAttribute( 'class', 'tw-text-xs tw-font-semibold' );
				$labelSpan->appendChild( $dom->createTextNode( 'Position ' . $i ) );

				$buttonDiv->appendChild( $iconSpan );
				$buttonDiv->appendChild( $labelSpan );
				$actionsDiv->appendChild( $buttonDiv );
			}
		}

		return $this->runtime_page_builder->write_dom( $dom, 'Simple_Client_' . $scene_id . '.html', true );
	}

	private function build_gltf_decoder_config(): string {
		$runtime_config = VRodos_Render_Runtime_Manager::get_config();

		return implode(
			' ',
			[
				'dracoDecoderPath: ' . $this->normalize_url( (string) $runtime_config['three_draco_decoder_url'] ) . ';',
				'basisTranscoderPath: ' . $this->normalize_url( (string) $runtime_config['three_basis_transcoder_url'] ) . ';',
				'meshoptDecoderPath: ' . $this->normalize_url( (string) $runtime_config['three_meshopt_decoder_url'] ) . ';',
			]
		);
	}

}
