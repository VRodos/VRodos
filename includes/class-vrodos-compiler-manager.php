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
require_once __DIR__ . '/class-vrodos-compiler-runtime-dom-transformer.php';
require_once __DIR__ . '/class-vrodos-compiler-runtime-page-builder.php';

class VRodos_Compiler_Manager {
	public const RUNTIME_MODE_NETWORKED     = 'networked';
	public const RUNTIME_MODE_SINGLE_PLAYER = 'single-player';

	private string $plugin_path_url;
	private string $website_root_url;
	private array $runtime_link_settings = [];
	private string $runtime_mode = self::RUNTIME_MODE_NETWORKED;
	private bool $isHoverEnabled = true;
	private VRodos_Compiler_Runtime_Feature_Flags $runtime_feature_flags;
	private VRodos_Compiler_Runtime_Assets $runtime_assets;
	private VRodos_Compiler_Template_Renderer $template_renderer;
	private VRodos_Compiler_Scene_Repository $scene_repository;
	private VRodos_Compiler_Scene_Settings $scene_settings;
	private VRodos_Compiler_AFrame_Entity_Renderer $entity_renderer;
	private VRodos_Compiler_Runtime_DOM_Transformer $runtime_dom_transformer;
	private VRodos_Compiler_Runtime_Page_Builder $runtime_page_builder;
	private ?VRodos_Compiler_Runtime_Script_Planner $runtime_script_planner = null;

	public function __construct() {
		$this->plugin_path_url       = VRodos_Path_Manager::plugin_url();
		$this->runtime_feature_flags = new VRodos_Compiler_Runtime_Feature_Flags();
		$this->runtime_assets        = new VRodos_Compiler_Runtime_Assets();
		$this->template_renderer = new VRodos_Compiler_Template_Renderer();
		$this->scene_repository = new VRodos_Compiler_Scene_Repository();
		$this->scene_settings   = new VRodos_Compiler_Scene_Settings( $this->scene_repository, $this->runtime_feature_flags );
		$this->runtime_dom_transformer = new VRodos_Compiler_Runtime_DOM_Transformer();
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
	}

	public function compile_aframe( $project_id, $scene_id_list, $showPawnPositions, $runtime_mode = null ) {

		// Ensure output directory exists before writing compiled files
		$build_dir = VRodos_Path_Manager::runtime_build_path();
		if ( ! is_dir( $build_dir ) ) {
			wp_mkdir_p( $build_dir );
		}

		$context = $this->scene_repository->load_compile_context( (int) $project_id, (array) $scene_id_list );
		if ( ! empty( $context['error'] ) ) {
			return wp_json_encode( [ 'error' => $context['error'] ] );
		}

		$project_title   = $context['project_title'];
		$scene_json      = $context['scene_json'];
		$scene_title     = $context['scene_title'];
		$valid_scene_ids = $context['valid_scene_ids'];
		$is_vrexpo       = $context['is_vrexpo'];
		$first_scene_id  = $context['first_scene_id'];
		$last_scene_id   = $context['last_scene_id'];
		$first_scene_json = $context['first_scene_json'];

		$this->runtime_mode = $this->resolve_runtime_mode( $runtime_mode, $first_scene_json );
		if ( $this->is_networked_runtime() ) {
			$this->start_networked_aframe_server();
		}

		$this->isHoverEnabled = $first_scene_json->metadata->aframeHoveringInteractables ?? true;
		$this->entity_renderer->configure( $this->plugin_path_url, (bool) $this->isHoverEnabled );

		foreach ( $valid_scene_ids as $key => $value ) {
			if ( $this->is_networked_runtime() && ! $is_vrexpo ) {
				$this->createIndexFile( $project_title, $value, $scene_title );
			}
			$this->createMasterClient( $value, $scene_title, $scene_json[ $key ], $showPawnPositions, $key, $project_id, $valid_scene_ids );
			if ( $this->is_networked_runtime() && ! $is_vrexpo ) {
				$this->createSimpleClient( $value, $scene_json[ $key ], $project_id );
			}
		}

		$master_scene_id  = ( $is_vrexpo ? $first_scene_id : $last_scene_id );
		$master_filename  = 'Master_Client_' . $master_scene_id . '.html';
		$result           = [
			'DefaultLinkMode' => $this->runtime_link_settings['default_link_mode'],
			'PrimaryLinkMode' => $this->is_single_player_runtime() ? 'static' : $this->primary_runtime_mode(),
			'RuntimeMode'     => $this->runtime_mode,
			'MasterClient'    => $this->runtime_url_for_file( $master_filename ),
		];
		if ( $this->is_networked_runtime() ) {
			$this->append_runtime_link_variants( $result, 'MasterClient', $master_filename );
		}

		if ( $this->is_networked_runtime() && ! $is_vrexpo ) {
			$index_filename         = 'index_' . $last_scene_id . '.html';
			$simple_client_filename = 'Simple_Client_' . $last_scene_id . '.html';

			$result['index']        = $this->runtime_url_for_file( $index_filename );
			$result['SimpleClient'] = $this->runtime_url_for_file( $simple_client_filename );
			$this->append_runtime_link_variants( $result, 'Index', $index_filename );
			$this->append_runtime_link_variants( $result, 'SimpleClient', $simple_client_filename );
		}

		return json_encode( $result );
	}

	public static function normalize_runtime_mode( $runtime_mode ): string {
		return VRodos_Compiler_Runtime_Feature_Flags::normalize_runtime_mode_value( $runtime_mode );
	}

	private function resolve_runtime_mode( $runtime_mode, $first_scene_json ): string {
		return $this->runtime_feature_flags->runtime_mode_for_scene( $first_scene_json, $runtime_mode );
	}

	private function is_networked_runtime(): bool {
		return $this->runtime_feature_flags->is_networked_runtime( $this->runtime_mode );
	}

	private function is_single_player_runtime(): bool {
		return $this->runtime_feature_flags->is_single_player_runtime( $this->runtime_mode );
	}

	private function start_networked_aframe_server(): void {
		$server_script = VRodos_Path_Manager::networked_aframe_server_path();

		if ( PHP_OS == 'WINNT' ) {
			$strCmd = 'node "' . str_replace( '"', '\"', $server_script ) . '"';
			popen( 'start "" ' . $strCmd, 'r' );
			return;
		}

		$strCmd = 'node ' . escapeshellarg( $server_script );
		if ( ! $this->processExists( 'vrodos-network-runtime' ) ) {
			shell_exec( $strCmd . ' > /dev/null 2>/dev/null &' );
		}
	}

	private function processExists( $processName ) {
		$exists = false;
		exec( "ps -A | grep -i $processName | grep -v grep", $pids );
		if ( count( $pids ) > 0 ) {
			$exists = true;
		}
		return $exists;
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

	private function append_runtime_link_variants( array &$result, string $field, string $filename ): void {
		$result[ 'Local' . $field ] = $this->runtime_url_for_file( $filename, 'local' );

		if ( '' !== $this->runtime_link_settings['public_base_url'] ) {
			$result[ 'Public' . $field ] = $this->runtime_url_for_file( $filename, 'public' );
		}
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

	private function get_project_type_slug( int $project_id ): string {
		return $this->scene_repository->get_project_type_slug( $project_id );
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

	private function create_runtime_dom_structure( string $content, $scene_json, string $body_id ): array {
		return $this->runtime_page_builder->create_dom_structure( $content, $scene_json, $body_id );
	}

	private function createBasicDomStructureAframeActor( $content, $scene_json ) {
		return $this->create_runtime_dom_structure( (string) $content, $scene_json, 'simple-client-body' );
	}

	private function createBasicDomStructureAframeDirector( $content, $scene_json, $project_id, $scene_id, $scene_id_list ) {
		$dom_elements = $this->create_runtime_dom_structure( (string) $content, $scene_json, 'master-client-body' );
		$dom          = $dom_elements['dom'];
		$ascene       = $dom_elements['ascene'];
		$ascenePlayer = $dom->getElementById( 'player' );

		// If MediaVerse project, then enable upload to MV Node.
		$media_panel        = $dom->getElementById( 'mediaPanel' );
		$recording_controls = $dom->getElementById( 'upload-recording-btn' );
		$project_type       = wp_get_post_terms( $project_id, 'vrodos_game_type' );
		if ( $project_type && $project_type[0]->slug == 'virtualproduction_games' ) {
			$media_panel->setAttribute( 'style', 'visibility: visible;' );
			$recording_controls->setAttribute( 'style', 'visibility: visible;' );

			// If MediaVerse project, get MV node url, in order to upload video and update project
			$user_id = get_current_user_id();
			if ( $user_id ) {
				$token            = get_the_author_meta( 'mvnode_token', $user_id );
				$node_token_input = $dom->getElementById( 'node-token-input' );
				$node_token_input->setAttribute( 'value', $token );

				$url            = get_the_author_meta( 'mvnode_url', $user_id );
				$node_url_input = $dom->getElementById( 'node-url-input' );
				$node_url_input->setAttribute( 'value', $url );

			}

			// If there is a MV project id, then forward it to client
			$mv_project_id = get_post_meta( $project_id, 'mv_project_id' );
			if ( ! empty( $mv_project_id ) ) {
				$mv_project_id_input = $dom->getElementById( 'mv-project-id-input' );
				$mv_project_id_input->setAttribute( 'value', $mv_project_id[0] );
			}

			$dom->saveHTML();
		} else {

			$media_panel->setAttribute( 'style', 'visibility: hidden;' );
			$recording_controls->setAttribute( 'style', 'visibility: hidden;' );
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

	private function prepare_runtime_template( string $template, array $replacements ): string {
		return $this->runtime_page_builder->prepare_template( $template, $replacements );
	}

	private function createIndexFile( $project_title, $scene_id, $scene_title ) {
		$content        = $this->template_renderer->read_runtime_template( 'index_prototype.html' );
		$content        = str_replace( 'Client.html', 'Client_' . $scene_id . '.html', $content );
		$content        = str_replace( 'project_sceneId', $project_title . ' - ' . $scene_title[0], $content );
		$content        = $this->runtime_assets->replace_placeholders( $content );
		$content        = str_replace(
			'VRODOS_PLUGIN_URL_PLACEHOLDER',
			esc_url( $this->plugin_path_url ),
			$content
		);
		return $this->template_renderer->write_runtime_build( 'index_' . $scene_id . '.html', $content );
	}

	private function createMasterClient( $scene_id, $scene_title, $scene_json, $showPawnPositions, $index, $project_id, $scene_id_list ) {

		$content = $this->prepare_runtime_template(
			'Master_Client_prototype.html',
			[
				'roomname'                           => 'room' . $scene_id,
				'AFRAME_RUNTIME_URL_PLACEHOLDER'     => esc_url( VRodos_Render_Runtime_Manager::get_aframe_runtime_url() ),
				'VRODOS_RUNTIME_MODE_PLACEHOLDER'    => esc_js( $this->runtime_mode ),
				'VRODOS_RUNTIME_SCRIPTS_PLACEHOLDER' => $this->runtime_script_planner()->render_scripts_for_scene( $scene_json, $this->runtime_mode ),
				'VRODOS_PLUGIN_URL_PLACEHOLDER'      => esc_js( $this->plugin_path_url ),
			]
		);
		$basicDomElements = $this->createBasicDomStructureAframeDirector( $content, $scene_json, $project_id, $scene_id, $scene_id_list );

		$dom          = $basicDomElements['dom'];
		$objects      = $basicDomElements['objects'];
		$ascene       = $basicDomElements['ascene'];
		$ascenePlayer = $basicDomElements['ascenePlayer'];
		$camera_position_attr = $this->get_avatar_camera_position_attribute( $scene_json );

		$projectType = $this->get_project_type_slug( (int) $project_id );
		$runtime_profile = VRodos_Runtime_Settings_Contract::normalize_metadata_value(
			is_object( $scene_json->metadata ?? null ) ? $scene_json->metadata : new stdClass(),
			'vrRuntimeProfile',
			'desktop'
		);
		$lean_single_player_headset = $this->is_single_player_runtime() && 'headset' === $runtime_profile;
		
		$dom->getElementsByTagName( 'title' )->item( 0 )->nodeValue = $scene_title[ $index ];

		if ( $this->is_networked_runtime() ) {
			$enable_director_audio = ( $projectType == 'vrexpo_games' ) ? 'false' : 'true';
			$app_name              = ( $projectType == 'vrexpo_games' ) ? 'vrexpo' : 'vrodos';
			$ascene->setAttribute( 'networked-scene', "app: $app_name; room: room$scene_id; debug: false; audio: $enable_director_audio; adapter: easyrtc; serverURL: /; connectOnLoad: true; onConnect: connectionResolve;" );
		} else {
			$ascene->removeAttribute( 'networked-scene' );
		}

		if ( $projectType == 'vrexpo_games' ) {
			$ascenePlayer->setAttribute( 'custom-movement', '' );
			if ( ! $lean_single_player_headset ) {
				$ascenePlayer->setAttribute( 'show-position', '' );
			}

			// OCULUS
			$a_camera = $dom->createElement( 'a-camera' );
			$a_camera->setAttribute( 'camera', 'active: true; near: 0.1; far: 7000; fov: 60' );
			$a_camera->setAttribute( 'id', 'cameraA' );
			$a_camera->setAttribute( 'position', $camera_position_attr );
			if ( $this->is_networked_runtime() ) {
				$a_camera->setAttribute( 'networked', 'template:#avatar-template-expo;attachTemplateToLocal:false' );
			}
			$a_camera->setAttribute( 'player-info', '' );
			$a_camera->setAttribute( 'avatar-movement-info', '' );
			$a_camera->setAttribute( 'look-controls', '' );
			if ( ! $lean_single_player_headset ) {
				$a_camera->setAttribute( 'entity-movement-emitter', '' );
			}

			$a_cursor = $dom->createElement( 'a-entity' );
			$a_cursor->setAttribute( 'id', 'cursor' );
			$a_cursor->setAttribute( 'cursor', 'rayOrigin: mouse; fuse: false' );
			$a_cursor->setAttribute( 'raycaster', 'objects: .raycastable' );

			$a_entity_oc_right = $dom->createElement( 'a-entity' );
			$a_entity_oc_right->setAttribute( 'id', 'oculusRight' );
			$a_entity_oc_right->setAttribute( 'laser-controls', 'hand: right' );
			$a_entity_oc_right->setAttribute( 'raycaster', 'objects: .raycastable' );

			$a_entity_oc_left = $dom->createElement( 'a-entity' );
			$a_entity_oc_left->setAttribute( 'id', 'oculusLeft' );
			$a_entity_oc_left->setAttribute( 'laser-controls', 'hand: left' );
			$a_entity_oc_left->setAttribute( 'raycaster', 'objects: .raycastable' );

			$a_camera->appendChild( $a_cursor );
			$ascenePlayer->appendChild( $a_camera );
			$ascenePlayer->appendChild( $a_entity_oc_right );
			$ascenePlayer->appendChild( $a_entity_oc_left );

		} else {
			$ascenePlayer->setAttribute( 'position', $camera_position_attr );
			if ( $this->is_networked_runtime() ) {
				$ascenePlayer->setAttribute( 'networked', 'template:#avatar-template;attachTemplateToLocal:false;' );
			}
			$ascenePlayer->setAttribute( 'custom-movement', '' );
			if ( ! $lean_single_player_headset ) {
				$ascenePlayer->setAttribute( 'show-position', '' );
			}
			$ascenePlayer->setAttribute( 'wasd-controls', 'fly:false; acceleration:20' );
			$ascenePlayer->setAttribute( 'look-controls', 'pointerLockEnabled: false' );

			$a_cursor = $dom->createElement( 'a-entity' );
			$a_cursor->setAttribute( 'id', 'cursor' );
			$a_cursor->setAttribute( 'cursor', 'rayOrigin: mouse; fuse: false' );
			$a_cursor->setAttribute( 'raycaster', 'objects: .raycastable' );

			$a_entity = $dom->createElement( 'a-entity' );
			$a_entity->setAttribute( 'id', 'cameraA' );
			$a_entity->setAttribute( 'active', 'true' );
			$a_entity->setAttribute( 'camera', 'near: 0.1; far: 7000.0;' );
			$a_entity->setAttribute( 'position', '0 0 0' );
			if ( $this->is_networked_runtime() ) {
				$a_entity->setAttribute( 'networked', 'template:#avatar-template-expo;attachTemplateToLocal:false' );
			}
			$a_entity->setAttribute( 'player-info', '' );
			$a_entity->setAttribute( 'avatar-movement-info', '' );

			$a_entity->appendChild( $a_cursor );
			$ascenePlayer->appendChild( $a_entity );
		}

		// print($scene_id)


		$this->runtime_page_builder->apply_scene_core(
			$dom,
			$ascene,
			$scene_json,
			(int) $project_id,
			(int) $scene_id,
			[
				'scene_loader'    => true,
				'render_options'  => [
					'showPawnPositions' => $showPawnPositions,
				],
			]
		);

		if ( $this->is_single_player_runtime() ) {
			$this->runtime_dom_transformer->apply_single_player_mode( $dom, $ascene );
		}

		return $this->runtime_page_builder->write_dom(
			$dom,
			'Master_Client_' . $scene_id . '.html',
			false,
			"<!-- Detected Hostname: {$this->website_root_url} -->\n"
		);
	}

	private function createSimpleClient( $scene_id, $scene_json, $project_id ) {

		$projectType = $this->get_project_type_slug( (int) $project_id );
		$app_name    = ( $projectType == 'vrexpo_games' ) ? 'vrexpo' : 'vrodos';
		$content     = $this->prepare_runtime_template(
			'Simple_Client_prototype.html',
			[
				'appname'                            => $app_name,
				'roomname'                           => 'room' . $scene_id,
				'AFRAME_RUNTIME_URL_PLACEHOLDER'     => esc_url( VRodos_Render_Runtime_Manager::get_aframe_runtime_url() ),
				'VRODOS_RUNTIME_SCRIPTS_PLACEHOLDER' => $this->runtime_script_planner()->render_scripts_for_chunk_ids( [ 'scene-components' ] ),
				'VRODOS_PLUGIN_URL_PLACEHOLDER'      => $this->normalize_url( $this->plugin_path_url ),
			]
		);

		// Create Basic dom structure for an aframe page
		$basicDomElements = $this->createBasicDomStructureAframeActor( $content, $scene_json );

		$dom        = $basicDomElements['dom'];
		$objects    = $basicDomElements['objects'];
		$actionsDiv = $basicDomElements['actionsDiv'];
		$ascene     = $basicDomElements['ascene'];

		$this->runtime_page_builder->apply_scene_core( $dom, $ascene, $scene_json, (int) $project_id, (int) $scene_id );
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
		$runtime_config    = VRodos_Render_Runtime_Manager::get_config();
		$three_vendor_dir  = (string) ( $runtime_config['three_vendor_dir'] ?? VRodos_Render_Runtime_Manager::get_three_vendor_dir() );
		$three_vendor_base = VRodos_Path_Manager::vendor_url( $three_vendor_dir . '/' );

		return implode(
			' ',
			[
				'dracoDecoderPath: ' . $this->normalize_url( $three_vendor_base . 'draco/gltf/' ) . ';',
				'basisTranscoderPath: ' . $this->normalize_url( $three_vendor_base . 'basis/' ) . ';',
				'meshoptDecoderPath: ' . $this->normalize_url( $three_vendor_base . 'meshopt/meshopt_decoder.js' ) . ';',
			]
		);
	}

	private function runtime_script_planner(): VRodos_Compiler_Runtime_Script_Planner {
		if ( null === $this->runtime_script_planner ) {
			$this->runtime_script_planner = new VRodos_Compiler_Runtime_Script_Planner( new VRodos_Compiler_Runtime_Manifest(), $this->runtime_feature_flags );
		}

		return $this->runtime_script_planner;
	}
}
