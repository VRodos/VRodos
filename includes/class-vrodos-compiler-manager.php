<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Compiler_Manager {
	private string $server_protocol;
	private string $portNodeJs;
	private string $plugin_path_url;
	private string $plugin_path_dir;
	private string $website_root_url;

	public function __construct() {
		$this->server_protocol  = is_ssl() ? 'https' : 'http';
		$this->plugin_path_url  = plugin_dir_url( dirname( __FILE__, 2 ) . '/VRodos.php' );
		$this->plugin_path_dir  = plugin_dir_path( dirname( __FILE__, 2 ) . '/VRodos.php' );

		// Use the current request host if available (e.g. when accessing via IP)
		// otherwise fallback to the site's configured URL.
		if ( isset( $_SERVER['HTTP_HOST'] ) ) {
			$this->website_root_url = $_SERVER['HTTP_HOST'];
		} else {
			$this->website_root_url = parse_url( get_site_url(), PHP_URL_HOST );
		}

		// Fallback for terminal/cron etc if everything else fails
		if ( ! $this->website_root_url ) {
			$this->website_root_url = 'localhost';
		}

		$this->plugin_path_url = $this->normalize_url( $this->plugin_path_url );

		$this->portNodeJs = '5832';
		if ( $this->website_root_url == 'vrexpo.iti.gr' ) {
			$this->portNodeJs = '5840';
		}
	}

	public function compile_aframe( $project_id, $scene_id_list, $showPawnPositions ) {

		// Start node js server at port 5832
		$strCmd = 'node ' . $this->plugin_path_dir . '/networked-aframe/server/easyrtc-server.js';

		if ( PHP_OS == 'WINNT' ) {
			popen( 'start ' . $strCmd, 'r' );
		} else {
			// if not already running (linux)
			if ( ! $this->processExists( 'networked-afr' ) ) {
				shell_exec( $strCmd . ' > /dev/null 2>/dev/null &' );
			}
		}

		// Ensure output directory exists before writing compiled files
		$build_dir = $this->plugin_path_dir . '/runtime/build/';
		if ( ! is_dir( $build_dir ) ) {
			wp_mkdir_p( $build_dir );
		}

		$project_post = get_post( $project_id );
		if ( ! ( $project_post instanceof WP_Post ) ) {
			error_log( '[VRodos] compile_aframe() aborted: invalid project #' . (int) $project_id );
			return wp_json_encode( [ 'error' => 'Invalid project.' ] );
		}

		$project_title   = $project_post->post_title;
		$scene_json      = [];
		$scene_title     = [];
		$valid_scene_ids = [];
		foreach ( (array) $scene_id_list as $scene_id ) {
			$scene_id = (int) $scene_id;
			if ( $scene_id <= 0 ) {
				continue;
			}

			$scene_post = get_post( $scene_id );
			if ( ! ( $scene_post instanceof WP_Post ) ) {
				error_log( '[VRodos] compile_aframe() skipped invalid scene #' . $scene_id . ' for project #' . (int) $project_id );
				continue;
			}

			$decoded_scene = json_decode( (string) $scene_post->post_content );
			if ( ! is_object( $decoded_scene ) ) {
				error_log( '[VRodos] compile_aframe() skipped scene #' . $scene_id . ' due to invalid JSON content.' );
				continue;
			}

			$valid_scene_ids[] = $scene_id;
			$scene_title[]     = $scene_post->post_title;
			$scene_json[]      = $decoded_scene;
		}

		if ( empty( $valid_scene_ids ) ) {
			error_log( '[VRodos] compile_aframe() aborted: no valid scenes for project #' . (int) $project_id );
			return wp_json_encode( [ 'error' => 'No valid scenes to compile.' ] );
		}

		$project_type_slug = $this->get_project_type_slug( (int) $project_id );
		$is_vrexpo         = ( $project_type_slug === 'vrexpo_games' );
		$first_scene_id    = (int) reset( $valid_scene_ids );
		$last_scene_id     = (int) end( $valid_scene_ids );

		foreach ( $valid_scene_ids as $key => $value ) {
			if ( ! $is_vrexpo ) {
				$this->createIndexFile( $project_title, $value, $scene_title );
			}
			$this->createMasterClient( $value, $scene_title, $scene_json[ $key ], $showPawnPositions, $key, $project_id, $valid_scene_ids );
			if ( ! $is_vrexpo ) {
				$this->createSimpleClient( $value, $scene_json[ $key ], $project_id );
			}
		}

		$result = [
			'MasterClient' => $this->nodeJSpath() . 'Master_Client_' . ( $is_vrexpo ? $first_scene_id : $last_scene_id ) . '.html',
		];

		if ( ! $is_vrexpo ) {
			$result['index']        = $this->nodeJSpath() . 'index_' . $last_scene_id . '.html';
			$result['SimpleClient'] = $this->nodeJSpath() . 'Simple_Client_' . $last_scene_id . '.html';
		}

		return json_encode( $result );
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
		if ( PHP_OS == 'WINNT' ) {
			return $this->server_protocol . '://' . $this->website_root_url . ':' . $this->portNodeJs . '/';
		} elseif ( $this->website_root_url == 'vrexpo.iti.gr' ) {
				return 'https://vrexpo-multi.iti.gr/';
		} else {
			return 'https://vrodos-multiplaying.iti.gr/';
		}
	}

	private function reader( $filename ) {
		$f       = fopen( $filename, 'r' );
		$content = fread( $f, filesize( $filename ) );
		fclose( $f );
		return $content;
	}

	private function writer( $filename, $content ) {
		$dir = dirname( $filename );
		if ( ! is_dir( $dir ) ) {
			wp_mkdir_p( $dir );
		}
		$f = fopen( $filename, 'w' );
		if ( ! $f ) {
			error_log( '[VRodos] writer() failed to open: ' . $filename );
			return false;
		}
		$res = fwrite( $f, (string) $content );
		fclose( $f );
		return $res;
	}

	/**
	 * Normalize URLs by stripping the 'localhost' domain and converting to relative paths.
	 * This fixes CORS and PNA issues when accessed via IP, because Node.js serves them as relative to itself.
	 */
	public function normalize_url( $url ) {
		if ( ! $url || $url === 'false' ) {
			return $url;
		}

		$parsed = parse_url($url);
		$host = isset($parsed['host']) ? $parsed['host'] : '';

		// If it's a local URL, make it relative (path absolute)
		if ( $host === 'localhost' || $host === '127.0.0.1' || $host === $this->website_root_url || empty($host) ) {
			$path = isset($parsed['path']) ? $parsed['path'] : '';
			$query = isset($parsed['query']) ? '?' . $parsed['query'] : '';
			return $path . $query;
		}

		return $url;
	}

	private function is_immerse_project( int $project_id ): bool {
		return $project_id > 0 && get_post_meta( $project_id, '_immerse_source', true ) === 'immerse';
	}

	private function get_project_type_slug( int $project_id ): string {
		$project_type_terms = wp_get_post_terms( $project_id, 'vrodos_game_type' );
		if ( ! empty( $project_type_terms ) && ! is_wp_error( $project_type_terms ) && ! empty( $project_type_terms[0]->slug ) ) {
			return (string) $project_type_terms[0]->slug;
		}

		if ( $this->is_immerse_project( $project_id ) ) {
			return 'vrexpo_games';
		}

		return '';
	}

	private function sanitize_text_attr( $value ): string {
		$value = (string) ( $value ?? '' );
		$value = $this->decode_display_text( $value );
		$value = wp_strip_all_tags( $value );
		$value = str_replace( [ "\r", "\n", ';' ], [ ' ', ' ', ',' ], $value );
		return trim( $value );
	}

	private function decode_display_text( string $value ): string {
		$text = trim( $value );
		if ( $text === '' ) {
			return '';
		}

		for ( $i = 0; $i < 2 && preg_match( '/%[0-9a-fA-F]{2}/', $text ); $i++ ) {
			$decoded = rawurldecode( $text );
			if ( ! is_string( $decoded ) || $decoded === '' || $decoded === $text ) {
				break;
			}

			$text = $decoded;
		}

		$text = html_entity_decode( $text, ENT_QUOTES | ENT_HTML5, 'UTF-8' );

		for ( $i = 0; $i < 3 && preg_match( '/(?:\\\\+u|u)[0-9a-fA-F]{4}/', $text ); $i++ ) {
			$decoded = preg_replace_callback(
				'/(?:\\\\+u|u)([0-9a-fA-F]{4})/',
				static function ( array $matches ): string {
					return mb_convert_encoding( pack( 'H*', strtolower( $matches[1] ) ), 'UTF-8', 'UCS-2BE' );
				},
				$text
			);

			if ( ! is_string( $decoded ) || $decoded === '' || $decoded === $text ) {
				break;
			}

			$text = $decoded;
		}

		return $text;
	}

	private function append_immerse_assessment_entity( DOMDocument $dom, DOMElement $ascene, $contentObject ): void {
		$assessment_title   = $this->sanitize_text_attr( (string) ( $contentObject->assessment_title ?? 'Assessment' ) );
		$assessment_type    = $this->sanitize_text_attr( (string) ( $contentObject->assessment_type ?? '' ) );
		$assessment_group   = $this->sanitize_text_attr( (string) ( $contentObject->assessment_group ?? '' ) );
		$assessment_content = (string) ( $contentObject->assessment_content ?? '' );
		$assessment_levels  = (string) ( $contentObject->assessment_levels ?? '' );
		$is_supported       = (string) ( $contentObject->assessment_supported ?? 'false' );

		$anchor = $dom->createElement( 'a-entity' );
		$this->setAffineTransformations( $anchor, $contentObject );

		$model = $dom->createElement( 'a-entity' );
		$model->setAttribute(
			'gltf-model',
			'url(' . $this->normalize_url( $this->plugin_path_url . 'runtime/assets/media/assessment.glb' ) . ')'
		);
		$model->setAttribute( 'rotation', '-90 0 0' );
		$model->setAttribute( 'class', 'raycastable hideable non-vr' );
		$model->setAttribute( 'immerse-assessment-launcher', '' );
		$model->setAttribute( 'shadow', 'cast: true; receive: true' );
		$model->setAttribute( 'data-assessment-title', $assessment_title );
		$model->setAttribute( 'data-assessment-type', $assessment_type );
		$model->setAttribute( 'data-assessment-group', $assessment_group );
		$model->setAttribute( 'data-assessment-content', $assessment_content );
		$model->setAttribute( 'data-assessment-levels', $assessment_levels );
		$model->setAttribute( 'data-assessment-supported', $is_supported );

		$anchor->appendChild( $model );
		$ascene->appendChild( $anchor );
	}

	private function apply_immerse_cefr_gating_attributes( DOMElement $element, $contentObject ): void {
		$is_attachment = strtolower( trim( (string) ( $contentObject->immerse_object_type ?? '' ) ) ) === 'attachment';
		$cefr_levels   = trim( (string) ( $contentObject->immerse_cefr_levels ?? '' ) );

		if ( ! $is_attachment || $cefr_levels === '' ) {
			return;
		}

		$element->setAttribute( 'data-immerse-cefr-levels', $cefr_levels );
		$element->setAttribute( 'immerse-cefr-asset', '' );
	}

	private function markDelayedRevealEntities( DOMDocument $dom ) {
		$xpath          = new DOMXPath( $dom );
		$hideable_nodes = $xpath->query( "//*[contains(concat(' ', normalize-space(@class), ' '), ' hideable ')]" );

		if ( ! $hideable_nodes ) {
			return;
		}

		foreach ( $hideable_nodes as $node ) {
			if ( ! $node instanceof DOMElement ) {
				continue;
			}

			$visible_attr = strtolower( trim( $node->getAttribute( 'visible' ) ) );
			if ( $node->hasAttribute( 'visible' ) && $visible_attr === 'false' ) {
				continue;
			}

			$node->setAttribute( 'visible', 'false' );
			$node->setAttribute( 'data-vrodos-delayed-reveal', 'true' );
		}
	}

	private function setAffineTransformations( $entity, $contentObject ) {
		$entity->setAttribute( 'position', implode( ' ', $contentObject->position ) );
		$entity->setAttribute(
			'rotation',
			implode(
				' ',
				[- 180 / pi() * $contentObject->rotation[0], 180 / pi() * $contentObject->rotation[1], 180 / pi() * $contentObject->rotation[2]]
			)
		);
		$entity->setAttribute( 'scale', implode( ' ', $contentObject->scale ) );
	}

	private function colorRGB2Hex( $colorRGB ) {
		if ( ! is_array( $colorRGB ) || count( $colorRGB ) < 3 ) {
			return '#ffffff';
		}
		return sprintf( '#%02x%02x%02x', 255 * $colorRGB[0], 255 * $colorRGB[1], 255 * $colorRGB[2] );
	}

	private function setMaterial( &$material, $contentObject ) {
		if ( isset( $contentObject->color ) ) {
			$color     = ltrim( $contentObject->color, '#' );
			$material .= 'color:#' . $color . ';';
		}
		if ( isset( $contentObject->emissive ) ) {
			$emissive  = ltrim( $contentObject->emissive, '#' );
			$material .= 'emissive:#' . $emissive . ';';
		}
		if ( isset( $contentObject->emissiveIntensity ) ) {
			$material .= 'emissiveIntensity:' . $contentObject->emissiveIntensity . ';';
		}
		if ( isset( $contentObject->roughness ) ) {
			$material .= 'roughness:' . $contentObject->roughness . ';';
		}
		if ( isset( $contentObject->metalness ) ) {
			$material .= 'metalness:' . $contentObject->metalness . ';';
		}
		if ( isset( $contentObject->videoTextureSrc ) ) {
			$material .= 'src:url(' . $this->normalize_url( $contentObject->videoTextureSrc ) . ');';
		}
		if ( isset( $contentObject->videoTextureRepeatX ) ) {
			$material .= 'repeat:' . $contentObject->videoTextureRepeatX . ' ' . $contentObject->videoTextureRepeatY . ';';
		}
	}

	private function createBasicDomStructureAframeActor( $content, $scene_json ) {
		$dom                   = new DOMDocument( '1.0', 'UTF-8' );
		$dom->resolveExternals = true;
		@$dom->loadHTML( $content, LIBXML_HTML_NOIMPLIED | LIBXML_NOBLANKS | LIBXML_NOERROR );
		$html       = $dom->documentElement;
		$body       = $dom->getElementById( 'simple-client-body' );
		$actionsDiv = $dom->getElementById( 'actionsDiv' );
		$ascene     = $dom->getElementById( 'aframe-scene-container' );
		$metadata   = $scene_json->metadata;
		$objects    = $scene_json->objects;

		return ['dom'        => $dom, 'html'       => $html, 'body'       => $body, 'ascene'     => $ascene, 'metadata'   => $metadata, 'objects'    => $objects, 'actionsDiv' => $actionsDiv];
	}

	private function createBasicDomStructureAframeDirector( $content, $scene_json, $project_id, $scene_id, $scene_id_list ) {
		$dom                   = new DOMDocument( '1.0', 'utf-8' );
		$dom->resolveExternals = true;
		@$dom->loadHTML( $content, LIBXML_HTML_NOIMPLIED | LIBXML_NOBLANKS | LIBXML_NOERROR );
		$html         = $dom->documentElement;
		$body         = $dom->getElementById( 'master-client-body' );
		$actionsDiv   = $dom->getElementById( 'actionsDiv' );
		$ascene       = $dom->getElementById( 'aframe-scene-container' );
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

		$is_base_scene_element = $dom->getElementById( 'is-base-scene-input' );
		if ( min( $scene_id_list ) == $scene_id ) {
			$is_base_scene_element->setAttribute( 'value', 'true' );
		} else {
			$is_base_scene_element->setAttribute( 'value', 'false' );
		}

		$metadata = $scene_json->metadata;
		$objects  = $scene_json->objects;

		return ['dom'          => $dom, 'html'         => $html, 'body'         => $body, 'ascene'       => $ascene, 'ascenePlayer' => $ascenePlayer, 'metadata'     => $metadata, 'objects'      => $objects, 'actionsDiv'   => $actionsDiv];
	}

	private function createIndexFile( $project_title, $scene_id, $scene_title ) {
		$filenameSource = $this->plugin_path_dir . '/js_libs/aframe_libs/index_prototype.html';
		$content        = $this->reader( $filenameSource );
		$content        = str_replace( 'Client.html', 'Client_' . $scene_id . '.html', $content );
		$content        = str_replace( 'project_sceneId', $project_title . ' - ' . $scene_title[0], $content );
		$content        = str_replace(
			'VRODOS_PLUGIN_URL_PLACEHOLDER',
			esc_url( $this->plugin_path_url ),
			$content
		);
		return $this->writer( $this->plugin_path_dir . '/runtime/build/' . 'index_' . $scene_id . '.html', $content );
	}

	private function createMasterClient( $scene_id, $scene_title, $scene_json, $showPawnPositions, $index, $project_id, $scene_id_list ) {

		// Read prototype
		$content = $this->reader(
			$this->plugin_path_dir
			. '/js_libs/aframe_libs/Master_Client_prototype.html'
		);


		// Modify strings
		$content = str_replace( 'roomname', 'room' . $scene_id, $content );
		$content = str_replace( 'AFRAME_RUNTIME_URL_PLACEHOLDER', esc_url( VRodos_Render_Runtime_Manager::get_aframe_runtime_url() ), $content );
		
		// specific path for Immerse Assessment (different location)
		$content = str_replace( 'src="js/components/immerse-assessment_component.js"', 'src="' . $this->plugin_path_url . 'js_libs/aframe_libs/js/components/immerse-assessment_component.js"', $content );

		// Bulk path redirection for all local assets to plugin absolute URLs
		// We use context-aware patterns (src="js/ and href="css/) to avoid double-prefixing paths that already have placeholders
		$content = str_replace( 'src="js/components/', 'src="' . $this->plugin_path_url . 'runtime/assets/js/components/', $content );
		$content = str_replace( 'src="js/master/', 'src="' . $this->plugin_path_url . 'runtime/assets/js/master/', $content );
		$content = str_replace( 'src="js/', 'src="' . $this->plugin_path_url . 'runtime/assets/js/', $content );
		$content = str_replace( 'href="css/', 'href="' . $this->plugin_path_url . 'runtime/assets/css/', $content );

		// Inject plugin base URL so runtime can load assets properly.
		$content = str_replace(
			'VRODOS_PLUGIN_URL_PLACEHOLDER',
			esc_js( $this->plugin_path_url ),
			$content
		);


		$basicDomElements = $this->createBasicDomStructureAframeDirector( $content, $scene_json, $project_id, $scene_id, $scene_id_list );

		$dom          = $basicDomElements['dom'];
		$objects      = $basicDomElements['objects'];
		$ascene       = $basicDomElements['ascene'];
		$ascenePlayer = $basicDomElements['ascenePlayer'];
		$sceneColor   = $scene_json->metadata->ClearColor;
		$is_immerse_project = $this->is_immerse_project( (int) $project_id );

		$projectType = $this->get_project_type_slug( (int) $project_id );
		
		// Use helper to ensure a-assets exists and is attached
		$a_asset = $this->get_or_create_assets_container( $dom, $ascene );

		$dom->getElementsByTagName( 'title' )->item( 0 )->nodeValue = $scene_title[ $index ];

		$this->apply_scene_environment( $content, $dom, $ascene, $scene_json, $project_id );
		$ascene->setAttribute( 'vrodos-scene-loader', '' );

		// Set networked properties
		$enable_director_audio = ( $projectType == 'vrexpo_games' ) ? 'false' : 'true';
		$app_name              = ( $projectType == 'vrexpo_games' ) ? 'vrexpo' : 'vrodos';
		$ascene->setAttribute( 'networked-scene', "app: $app_name; room: room$scene_id; debug: false; audio: $enable_director_audio; adapter: easyrtc; serverURL: /; connectOnLoad: true; onConnect: connectionResolve;" );

		if ( $projectType == 'vrexpo_games' ) {

			$ascenePlayer->setAttribute( 'custom-movement', '' );
			$ascenePlayer->setAttribute( 'show-position', '' );

			// OCULUS
			$a_camera = $dom->createElement( 'a-camera' );
			$a_camera->setAttribute( 'camera', '' );
			$a_camera->setAttribute( 'id', 'cameraA' );
			$a_camera->setAttribute( 'networked', 'template:#avatar-template-expo;attachTemplateToLocal:false' );
			$a_camera->setAttribute( 'player-info', '' );
			$a_camera->setAttribute( 'avatar-movement-info', '' );
			$a_camera->setAttribute( 'look-controls', '' );
			$a_camera->setAttribute( 'entity-movement-emitter', '' );

			$a_cursor = $dom->createElement( 'a-entity' );
			$a_cursor->setAttribute( 'id', 'cursor' );
			$a_cursor->setAttribute( 'cursor', 'rayOrigin: mouse; fuse: false' );
			$a_cursor->setAttribute( 'raycaster', 'objects: .raycastable' );

			$a_entity_oc_right = $dom->createElement( 'a-entity' );
			$a_entity_oc_right->setAttribute( 'id', 'oculusRight' );
			$a_entity_oc_right->setAttribute( 'oculus-touch-controls', 'hand: right' );
			$a_entity_oc_right->setAttribute( 'laser-controls', 'hand: right' );
			$a_entity_oc_right->setAttribute( 'raycaster', 'lineColor: black; objects: .raycastable' );
			$a_entity_oc_right->setAttribute( 'transparent', 'true' );
			$a_entity_oc_right->setAttribute( 'render-order', '9999999' );

			$a_entity_oc_left = $dom->createElement( 'a-entity' );
			$a_entity_oc_left->setAttribute( 'id', 'oculusLeft' );
			$a_entity_oc_left->setAttribute( 'oculus-touch-controls', 'hand: left' );
			$a_entity_oc_left->setAttribute( 'laser-controls', 'hand: left' );
			$a_entity_oc_left->setAttribute( 'raycaster', 'lineColor: black; objects: .raycastable' );
			$a_entity_oc_left->setAttribute( 'transparent', 'true' ); // Ensure transparency is set to true
			$a_entity_oc_left->setAttribute( 'blink-controls', '' );
			$a_entity_oc_left->setAttribute( 'visible', 'false' );
			$a_entity_oc_left->setAttribute( 'render-order', '9999999' );

			$a_camera->appendChild( $a_cursor );
			$ascenePlayer->appendChild( $a_camera );
			$ascenePlayer->appendChild( $a_entity_oc_right );
			$ascenePlayer->appendChild( $a_entity_oc_left );

		} else {
			$ascenePlayer->setAttribute( 'position', '0 0.6 0' );
			$ascenePlayer->setAttribute( 'networked', 'template:#avatar-template;attachTemplateToLocal:false;' );
			$ascenePlayer->setAttribute( 'custom-movement', '' );
			$ascenePlayer->setAttribute( 'show-position', '' );
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
			$a_entity->setAttribute( 'position', '0 0.6 0' );
			$a_entity->setAttribute( 'networked', 'template:#avatar-template-expo;attachTemplateToLocal:false' );
			$a_entity->setAttribute( 'player-info', '' );
			$a_entity->setAttribute( 'avatar-movement-info', '' );

			$a_entity->appendChild( $a_cursor );
			$ascenePlayer->appendChild( $a_entity );
		}

		// print($scene_id)


		// 3. Render Objects using the new modular pipeline (Phase 3 Refactoring Win)
		$this->render_scene_objects( $dom, $ascene, $a_asset, $objects, $project_id, $scene_id, [
			'showPawnPositions' => $showPawnPositions
		] );

		$this->markDelayedRevealEntities( $dom );

		$contentNew = $dom->saveHTML();
		$contentNew = "<!-- Detected Hostname: {$this->website_root_url} -->\n" . $contentNew;

		// Write back to root
		return $this->writer( $this->plugin_path_dir . '/runtime/build/Master_Client_' . $scene_id . '.html', $contentNew );
	}

	private function includeDoorFunctionality( $a_entity, $door_link ) {
		// Use a relative path for the baked HTML door link so it works across IPs/localhost without CORS.
		$a_entity->setAttribute( 'door-listener', "Master_Client_{$door_link}.html" );
	}

	private function createSimpleClient( $scene_id, $scene_json, $project_id ) {

		// Read prototype
		$content = $this->reader(
			$this->plugin_path_dir
			. '/js_libs/aframe_libs/Simple_Client_prototype.html'
		);

		// Modify strings
		$projectType = $this->get_project_type_slug( (int) $project_id );
		$app_name    = ( $projectType == 'vrexpo_games' ) ? 'vrexpo' : 'vrodos';

		$content = str_replace( 'appname', $app_name, $content );
		$content = str_replace( 'roomname', 'room' . $scene_id, $content );
		$content = str_replace( 'AFRAME_RUNTIME_URL_PLACEHOLDER', esc_url( VRodos_Render_Runtime_Manager::get_aframe_runtime_url() ), $content );
		
		// specific path for Immerse Assessment (different location)
		$content = str_replace( 'src="js/components/immerse-assessment_component.js"', 'src="' . $this->plugin_path_url . 'js_libs/aframe_libs/js/components/immerse-assessment_component.js"', $content );

		// Bulk path redirection for all local assets to plugin absolute URLs
		$content = str_replace( 'src="js/components/', 'src="' . $this->plugin_path_url . 'runtime/assets/js/components/', $content );
		$content = str_replace( 'src="js/master/', 'src="' . $this->plugin_path_url . 'runtime/assets/js/master/', $content );
		$content = str_replace( 'src="js/', 'src="' . $this->plugin_path_url . 'runtime/assets/js/', $content );
		$content = str_replace( 'href="css/', 'href="' . $this->plugin_path_url . 'runtime/assets/css/', $content );

		$content = str_replace(
			'VRODOS_PLUGIN_URL_PLACEHOLDER',
			$this->normalize_url( $this->plugin_path_url ),
			$content
		);

		// Placeholder replacements moved to apply_scene_environment for consistency

		// Create Basic dom structure for an aframe page
		$basicDomElements = $this->createBasicDomStructureAframeActor( $content, $scene_json );

		$dom        = $basicDomElements['dom'];
		$objects    = $basicDomElements['objects'];
		$actionsDiv = $basicDomElements['actionsDiv'];
		$ascene     = $basicDomElements['ascene'];

		$this->apply_scene_environment( $content, $dom, $ascene, $scene_json, $project_id );

		// Use helper to ensure a-assets exists and is attached
		$a_asset = $this->get_or_create_assets_container( $dom, $ascene );

		// Render scene objects modularly
		$this->render_scene_objects( $dom, $ascene, $a_asset, $objects, $project_id, $scene_id );

		$this->markDelayedRevealEntities( $dom );
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

		$contentNew = $dom->saveHTML( $dom->documentElement );

		// Write back to root
		return $this->writer( $this->plugin_path_dir . '/runtime/build/Simple_Client_' . $scene_id . '.html', $contentNew );
	}

	/**
	 * Modularized Environment Settings
	 */
	private function apply_scene_environment( &$content, $dom, $ascene, $scene_json, $project_id ) {
		$metadata = $scene_json->metadata;

		// 1. Core Metadata Extraction
		$project_type_slug = $this->get_project_type_slug( (int) $project_id );
		$bcg_choice        = $metadata->backgroundStyleOption ?? '0';
		$preset_choice     = $metadata->backgroundPresetOption ?? 'None';
		$clear_color       = $metadata->ClearColor ?? '#ffffff';
		$image_path        = $metadata->backgroundImagePath ?? '';

		// 2. Map all metadata for scene-settings component (Boolean normalization)
		$movement_disabled = isset( $metadata->disableMovement ) && filter_var( $metadata->disableMovement, FILTER_VALIDATE_BOOLEAN );
		$avatar_enabled    = isset( $metadata->enableAvatar ) && filter_var( $metadata->enableAvatar, FILTER_VALIDATE_BOOLEAN );
		$public_chat       = isset( $metadata->enableGeneralChat ) && filter_var( $metadata->enableGeneralChat, FILTER_VALIDATE_BOOLEAN );
		$ground_enabled    = isset( $metadata->backgroundPresetGroundEnabled ) && filter_var( $metadata->backgroundPresetGroundEnabled, FILTER_VALIDATE_BOOLEAN ) ? '1' : '0';
		
		// FPS Meter (Check both legacy and modern keys)
		$fps_meter_enabled = ( ( isset( $metadata->enableFPSMeter ) && filter_var( $metadata->enableFPSMeter, FILTER_VALIDATE_BOOLEAN ) ) || 
							  ( isset( $metadata->aframeFPSMeterEnabled ) && filter_var( $metadata->aframeFPSMeterEnabled, FILTER_VALIDATE_BOOLEAN ) ) ) ? '1' : '0';

		// Camera defaults
		$cam_pos   = isset( $scene_json->objects->avatarCamera ) ? implode( ' ', (array) $scene_json->objects->avatarCamera->position ) : '0 1.6 0';
		$cam_rot_y = isset( $scene_json->objects->avatarCamera ) ? ( 180 / pi() * $scene_json->objects->avatarCamera->rotation[1] ) : '0';

		// Fog Settings
		$fog_cat     = $metadata->fogCategory ?? 0;
		$fog_color   = $metadata->fogcolor ?? '#FFFFFF';
		$fog_far     = $metadata->fogfar ?? 1000;
		$fog_near    = $metadata->fognear ?? 0;
		$fog_density = $metadata->fogdensity ?? 0.00000001;

		// 3. New Advanced Rendering Parameters (Phase 3 Refactoring)
		$collision_mode     = $metadata->aframeCollisionMode ?? 'auto';
		$render_quality     = $metadata->aframeRenderQuality ?? 'standard';
		$shadow_quality     = $metadata->aframeShadowQuality ?? 'medium';
		$aa_quality         = $metadata->aframeAAQuality ?? 'balanced';
		$legacy_horizon_size = max( 500, min( 8000, (int) ( $metadata->aframeLegacyHorizonStageSize ?? 5000 ) ) );
		$ao_preset          = $metadata->aframeAmbientOcclusionPreset ?? 'balanced';
		$cs_preset          = $metadata->aframeContactShadowPreset ?? 'soft';
		$post_fx_enabled    = isset( $metadata->aframePostFXEnabled ) && filter_var( $metadata->aframePostFXEnabled, FILTER_VALIDATE_BOOLEAN ) ? '1' : '0';
		$post_fx_engine     = ( ( $metadata->aframePostFXEngine ?? 'legacy' ) === 'pmndrs' ) ? 'pmndrs' : 'legacy';
		$reflection_profile = $metadata->aframeReflectionProfile ?? 'balanced';
		$reflection_source  = $metadata->aframeReflectionSource ?? 'hdr';
		$horizon_preset     = $metadata->aframeHorizonSkyPreset ?? 'natural';
		$env_map_preset     = $metadata->aframeEnvMapPreset ?? 'none';

		// 4. Assemble scene-settings attribute
		$scene_settings_attr = "color: $clear_color; pr_type: $project_type_slug; selChoice: $bcg_choice; presChoice: $preset_choice; presetGroundEnabled: $ground_enabled" .
			"; movement_disabled: " . ( $movement_disabled ? 'true' : 'false' ) . 
			"; avatar_enabled: " . ( $avatar_enabled ? 'true' : 'false' ) .
			"; collisionMode: $collision_mode; renderQuality: $render_quality; shadowQuality: $shadow_quality; aaQuality: $aa_quality" .
			"; fpsMeterEnabled: $fps_meter_enabled; legacyHorizonStageSize: $legacy_horizon_size; ambientOcclusionPreset: $ao_preset" .
			"; contactShadowPreset: $cs_preset; postFXEnabled: $post_fx_enabled; postFXEngine: $post_fx_engine" .
			"; reflectionProfile: $reflection_profile; reflectionSource: $reflection_source; horizonSkyPreset: $horizon_preset" .
			"; envMapPreset: $env_map_preset; cam_position: $cam_pos; cam_rotation_y: $cam_rot_y; public_chat: " . ( $public_chat ? 'true' : 'false' ) .
			"; fogCategory: $fog_cat; fogcolor: $fog_color; fogfar: $fog_far; fognear: $fog_near; fogdensity: $fog_density";

		// Append composite_params if they exist (allows passing arbitrary component params from metadata)
		if ( ! empty( $metadata->composite_params ) ) {
			$scene_settings_attr .= "; " . $metadata->composite_params;
		}

		$ascene->setAttribute( 'scene-settings', $scene_settings_attr );

		// 5. PMNDRS specific tweaks
		if ( $post_fx_engine === 'pmndrs' ) {
			$aa_mode    = $metadata->aframePmndrsAAMode    ?? ( $aa_quality === 'off' ? 'none' : 'msaa' );
			$aa_preset  = $metadata->aframePmndrsAAPreset  ?? ( $aa_quality === 'ultra' ? 'ultra' : 'high' );
			$bloom_int  = max( 0.0, min( 3.0, (float) ( $metadata->aframePmndrsBloomIntensity ?? 1.0 ) ) );
			$bloom_thr  = max( 0.0, min( 1.0, (float) ( $metadata->aframePmndrsBloomThreshold ?? 0.62 ) ) );
			$vign_en    = isset( $metadata->aframePmndrsVignetteEnabled ) && filter_var( $metadata->aframePmndrsVignetteEnabled, FILTER_VALIDATE_BOOLEAN ) ? 'true' : 'false';
			$vign_dark  = max( 0.0, min( 1.0, (float) ( $metadata->aframePmndrsVignetteDarkness ?? 0.5 ) ) );
			$tm_exp     = max( 0.3, min( 2.5, (float) ( $metadata->aframePmndrsToneMappingExposure ?? 1.0 ) ) );

			$pmndrs_attr = "aaMode: $aa_mode; aaPreset: $aa_preset; bloomIntensity: $bloom_int; bloomThreshold: $bloom_thr" .
				"; vignetteEnabled: $vign_en; vignetteDarkness: $vign_dark; toneMappingExposure: $tm_exp";
			
			$ascene->setAttribute( 'vrodos-postprocessing-pmndrs', $pmndrs_attr );
		}

		// 6. Handle Background (Skybox)
		if ( $bcg_choice == '3' && $image_path ) {
			$a_asset = $this->get_or_create_assets_container( $dom, $ascene );
			
			$a_asset_sky = $dom->createElement( 'img' );
			$a_asset_sky->setAttribute( 'id', 'custom_sky' );
			$a_asset_sky->setAttribute( 'src', $this->normalize_url( $image_path ) );
			$a_asset_sky->setAttribute( 'crossorigin', 'anonymous' );
			$a_asset->appendChild( $a_asset_sky );
		}

		// 7. Update Fog and Background directly in DOM (fixes A-Frame 1.7.0+ parsing issues)
		$ascene->setAttribute( 'background', "color: $clear_color" );

		if ( $fog_cat != 0 ) {
			$fogtype = ( $fog_cat == 1 ) ? 'linear' : 'exponential';
			$fogcolor_hex = '#' . ltrim( $fog_color, '#' );
			$fog_replace = "type: $fogtype; color: $fogcolor_hex; far: $fog_far; density: " . ( 1.5 * $fog_density ) . "; near: $fog_near";
			$ascene->setAttribute( 'fog', $fog_replace );
		} else {
			$ascene->removeAttribute( 'fog' );
		}
	}

	/**
	 * Asset Registry Helper
	 */
	private function get_or_create_assets_container( $dom, $ascene ) {
		$a_asset = $dom->getElementsByTagName( 'a-assets' )->item(0);
		if ( ! $a_asset ) {
			$a_asset = $dom->createElement( 'a-assets' );
			// Insert as the first child of the scene for A-Frame best practices
			if ( $ascene->firstChild ) {
				$ascene->insertBefore( $a_asset, $ascene->firstChild );
			} else {
				$ascene->appendChild( $a_asset );
			}
		}
		$a_asset->setAttribute( 'timeout', '5000' );
		return $a_asset;
	}

	/**
	 * Modularized Object Renderer
	 */
	private function render_scene_objects( $dom, $ascene, $assets, $objects, $project_id, $scene_id, $config = [] ) {
		foreach ( $objects as $object_key => $obj ) {
			if ( is_object( $obj ) ) {
				if ( empty( $obj->uuid ) ) {
					$obj->uuid = $this->build_runtime_object_id( $obj, (string) $object_key );
				}
				if ( empty( $obj->name ) ) {
					$obj->name = (string) $object_key;
				}
			}

			$this->render_scene_object( $dom, $ascene, $assets, $obj, array_merge( $config, [
				'project_id' => $project_id,
				'scene_id'   => $scene_id
			] ) );
		}
	}

	private function build_runtime_object_id( $obj, string $object_key = '' ): string {
		$parts = [];

		if ( $object_key !== '' ) {
			$parts[] = sanitize_title( $object_key );
		}

		if ( ! empty( $obj->asset_slug ) ) {
			$parts[] = sanitize_title( (string) $obj->asset_slug );
		}

		if ( ! empty( $obj->asset_id ) ) {
			$parts[] = 'asset_' . absint( $obj->asset_id );
		}

		if ( ! empty( $obj->immerse_attachment_id ) ) {
			$parts[] = 'immerse_' . sanitize_title( (string) $obj->immerse_attachment_id );
		}

		if ( ! empty( $obj->category_slug ) ) {
			$parts[] = sanitize_title( (string) $obj->category_slug );
		}

		$parts = array_values( array_filter( array_unique( $parts ) ) );
		if ( empty( $parts ) ) {
			return 'object_' . wp_generate_password( 8, false, false );
		}

		return implode( '_', $parts );
	}

	private function render_scene_object( $dom, $ascene, $assets, $obj, $config = [] ) {
		$cat  = $obj->category_slug ?? $obj->category_name ?? '';

		switch ( $cat ) {
			case 'lightSun':
			case 'lightSpot':
			case 'lightLamp':
			case 'lightAmbient':
				$this->render_light_entity( $dom, $ascene, $obj );
				break;
			case 'decoration':
			case 'walkable-surface':
			case 'door':
			case 'poi-link':
			case 'chat':
				$this->render_gltf_entity( $dom, $ascene, $assets, $obj );
				break;
			case 'audio':
				$this->render_audio_entity( $dom, $ascene, $assets, $obj );
				break;
			case 'image':
			case 'video':
				$this->render_media_entity( $dom, $ascene, $assets, $obj );
				break;
			case 'poi-imagetext':
				$this->render_poi_imagetext_entity( $dom, $ascene, $assets, $obj );
				break;
			case 'pawn':
				$this->render_pawn_entity( $dom, $ascene, $obj, $config );
				break;
			case 'assessment':
				if ( $this->is_immerse_project( (int) $config['project_id'] ) ) {
					$this->append_immerse_assessment_entity( $dom, $ascene, $obj );
				}
				break;
		}
	}

	private function render_pawn_entity( $dom, $ascene, $obj, $config ) {
		if ( isset( $config['showPawnPositions'] ) && $config['showPawnPositions'] === 'true' ) {
			$pawn = $dom->createElement( 'a-entity' );
			$pawn->setAttribute( 'gltf-model', 'url(' . $this->normalize_url( $this->plugin_path_url . 'assets/pawn.glb' ) . ')' );
			$this->setAffineTransformations( $pawn, $obj );
			$ascene->appendChild( $pawn );
		}
	}

	private function render_light_entity( $dom, $ascene, $obj ) {
		$uuid = $obj->uuid ?? '';
		$cat  = $obj->category_name ?? $obj->category_slug ?? '';
		$type = $this->map_light_type( $cat );
		
		$a_light = $dom->createElement( 'a-light' );
		$a_light->appendChild( $dom->createTextNode( '' ) );
		$this->setAffineTransformations( $a_light, $obj );

		if ( $cat === 'lightSun' ) {
			$a_light->setAttribute( 'id', 'lighttarget' );
		}

		$color = $this->colorRGB2Hex( $obj->lightcolor ?? null );
		$intensity = $obj->lightintensity ?? '1';
		$light_attr = "type: $type; color: $color; intensity: $intensity";

		if ( in_array( $type, [ 'directional', 'spot' ] ) && ! empty( $obj->targetposition ) ) {
			$target_id = $uuid . 'target';
			$target = $dom->createElement( 'a-entity' );
			$target->setAttribute( 'id', $target_id );
			$target->setAttribute( 'position', implode( ' ', (array) $obj->targetposition ) );
			$ascene->appendChild( $target );
			$a_light->setAttribute( 'target', '#' . $target_id );
			
			if ( $type === 'directional' ) {
				$is_casting_shadow = isset( $obj->castingShadow ) ? ( $obj->castingShadow == '1' ? 'true' : 'false' ) : 'false';
				$light_attr .= '; castShadow: ' . $is_casting_shadow;
				$light_attr .= '; shadowMapHeight: ' . ( $obj->shadowMapHeight ?? '512' );
				$light_attr .= '; shadowMapWidth: ' . ( $obj->shadowMapWidth ?? '512' );
				$light_attr .= '; shadowCameraTop: ' . ( $obj->shadowCameraTop ?? '5' );
				$light_attr .= '; shadowCameraRight: ' . ( $obj->shadowCameraRight ?? '5' );
				$light_attr .= '; shadowCameraLeft: ' . ( $obj->shadowCameraLeft ?? '-5' );
				$light_attr .= '; shadowCameraBottom: ' . ( $obj->shadowCameraBottom ?? '-5' );
				$light_attr .= '; shadowBias: ' . ( $obj->shadowBias ?? '0' );
				$light_attr .= '; shadowCameraVisible: false';

				// a-sun-sky logic
				if ( isset( $obj->sunSky ) && $obj->sunSky == '1' && !empty($obj->position) && !empty($obj->targetposition) ) {
					$a_sun_sky = $dom->createElement( 'a-sun-sky' );
					$sun_pos = (array) $obj->position;
					$targ_pos = (array) $obj->targetposition;
					if (count($sun_pos) >= 3 && count($targ_pos) >= 3) {
						$sky_sun = [$sun_pos[0] - $targ_pos[0], $sun_pos[1] - $targ_pos[1], $sun_pos[2] - $targ_pos[2]];
						$a_sun_sky->setAttribute('material', "side:back; sunPosition: {$sky_sun[0]} {$sky_sun[1]} {$sky_sun[2]}");
						$ascene->appendChild( $a_sun_sky );
					}
				}
			}
		} elseif ( $type === 'point' ) {
			$light_attr .= '; distance: ' . ($obj->lightdistance ?? '0');
			$light_attr .= '; decay: ' . ($obj->lightdecay ?? '1');
		}

		$a_light->setAttribute( 'light', $light_attr );
		$ascene->appendChild( $a_light );
	}

	private function render_gltf_entity( $dom, $ascene, $assets, $obj ) {
		$uuid = $obj->uuid ?? '';
		$cat  = $obj->category_slug ?? '';
		
		// Add to assets
		$asset_item = $dom->createElement( 'a-asset-item' );
		$asset_item->setAttribute( 'id', $uuid );
		$asset_item->setAttribute( 'src', $this->normalize_url( $obj->glb_path ?? '' ) );
		$asset_item->setAttribute( 'response-type', 'arraybuffer' );
		$asset_item->setAttribute( 'crossorigin', 'anonymous' );
		$assets->appendChild( $asset_item );

		// Create entity
		$entity = $dom->createElement( 'a-entity' );
		$entity->setAttribute( 'gltf-model', '#' . $uuid );
		
		$sc_x = $obj->scale[0] ?? 1;
		$sc_y = $obj->scale[1] ?? 1;
		$sc_z = $obj->scale[2] ?? 1;
		$entity->setAttribute( 'original-scale', "$sc_x $sc_y $sc_z" );
		
		$this->setAffineTransformations( $entity, $obj );
		
		$class = 'override-materials hideable';
		
		if ( $cat === 'walkable-surface' ) {
			$class .= ' vrodos-navmesh';
			$walk_behavior = ( isset( $obj->walkableBehavior ) && 'auto' === strtolower( (string) $obj->walkableBehavior ) ) ? 'auto' : 'precise';
			$entity->setAttribute( 'data-vrodos-navmesh', 'true' );
			$entity->setAttribute( 'data-vrodos-walk-behavior', $walk_behavior );
		} elseif ( $cat === 'door' ) {
			$class .= ' raycastable';
			$entity->setAttribute( 'id', "entity_$uuid" );
			$entity->setAttribute( 'highlight', "entity_$uuid" );
			if ( ! empty( $obj->sceneID_target ) ) {
				$this->includeDoorFunctionality( $entity, $obj->sceneID_target );
			}
		} elseif ( $cat === 'poi-link' ) {
			$class .= ' raycastable';
			$entity->setAttribute( 'link-listener', (string) ($obj->poi_link_url ?? '') );
			$entity->setAttribute( 'highlight', $uuid );
		} elseif ( $cat === 'chat' ) {
			// Help Chat POI
			$class .= ' raycastable';
			$entity->setAttribute( 'id', "entity_$uuid" );
			$entity->setAttribute( 'highlight', "entity_$uuid" );
			$entity->setAttribute( 'title', $this->sanitize_text_attr( $obj->poi_help_title ?? 'Help' ) );
			$entity->setAttribute( 'help-chat', "scene_id: " . ($obj->sceneID_target ?? $scene_id) . "; num_participants: " . ($obj->poi_help_max_participants ?? '-1') );
		}

		$material = '';
		$this->setMaterial( $material, $obj );
		$entity->setAttribute( 'material', $material );
		$entity->setAttribute( 'class', $class );
		$entity->setAttribute( 'clear-frustum-culling', '' );
		$entity->setAttribute( 'shadow', 'cast: true; receive: true' );
		$this->apply_immerse_cefr_gating_attributes( $entity, $obj );
		
		$ascene->appendChild( $entity );
	}

	private function render_audio_entity( $dom, $ascene, $assets, $obj ) {
		$uuid       = $obj->uuid ?? '';
		$audio_path = $this->normalize_url( (string) ( $obj->audio_path ?? '' ) );
		$glb_path   = $this->normalize_url( (string) ( $obj->glb_path ?? '' ) );

		if ( $uuid === '' || $audio_path === '' || $glb_path === '' ) {
			return;
		}

		$asset_item = $dom->createElement( 'a-asset-item' );
		$asset_item->setAttribute( 'id', $uuid );
		$asset_item->setAttribute( 'src', $glb_path );
		$asset_item->setAttribute( 'response-type', 'arraybuffer' );
		$asset_item->setAttribute( 'crossorigin', 'anonymous' );
		$assets->appendChild( $asset_item );

		$audio_asset_id = 'audio_src_' . $uuid;
		$audio_asset = $dom->createElement( 'audio' );
		$audio_asset->setAttribute( 'id', $audio_asset_id );
		$audio_asset->setAttribute( 'src', $audio_path );
		$audio_asset->setAttribute( 'preload', 'auto' );
		$audio_asset->setAttribute( 'crossorigin', 'anonymous' );
		$assets->appendChild( $audio_asset );

		$entity = $dom->createElement( 'a-entity' );
		$entity->setAttribute( 'id', 'audio_entity_' . $uuid );
		$entity->setAttribute( 'gltf-model', '#' . $uuid );
		$entity->setAttribute( 'clear-frustum-culling', '' );
		$entity->setAttribute( 'shadow', 'cast: true; receive: true' );
		$entity->setAttribute( 'material', '' );
		$entity->setAttribute( 'original-scale', implode( ' ', [
			(float) ( $obj->scale[0] ?? 1 ),
			(float) ( $obj->scale[1] ?? 1 ),
			(float) ( $obj->scale[2] ?? 1 ),
		] ) );
		$this->setAffineTransformations( $entity, $obj );

		$audio_loop           = filter_var( $obj->audio_loop ?? false, FILTER_VALIDATE_BOOLEAN ) ? 'true' : 'false';
		$audio_volume         = (float) ( $obj->audio_volume ?? 1 );
		$audio_ref_distance   = (float) ( $obj->audio_ref_distance ?? 2 );
		$audio_max_distance   = (float) ( $obj->audio_max_distance ?? 20 );
		$audio_rolloff_factor = (float) ( $obj->audio_rolloff_factor ?? 1 );
		$audio_mode           = in_array( (string) ( $obj->audio_playback_mode ?? 'interact' ), [ 'autoplay', 'interact' ], true )
			? (string) $obj->audio_playback_mode
			: 'interact';
		$distance_model       = (string) ( $obj->audio_distance_model ?? 'inverse' );
		$entity_class         = 'override-materials';

		if ( $audio_mode === 'interact' ) {
			$entity_class .= ' raycastable clickable';
			$entity->setAttribute( 'highlight', 'audio_entity_' . $uuid );
		}

		$entity->setAttribute( 'class', $entity_class );

		$entity->setAttribute(
			'sound',
			sprintf(
				'src: #%1$s; positional: true; autoplay: false; loop: %2$s; volume: %3$s; refDistance: %4$s; maxDistance: %5$s; rolloffFactor: %6$s; distanceModel: %7$s; poolSize: 1',
				$audio_asset_id,
				$audio_loop,
				$audio_volume,
				$audio_ref_distance,
				$audio_max_distance,
				$audio_rolloff_factor,
				$distance_model
			)
		);
		$entity->setAttribute(
			'audio-source-controls',
			sprintf(
				'mode: %1$s; loop: %2$s; volume: %3$s; refDistance: %4$s; maxDistance: %5$s; rolloffFactor: %6$s; distanceModel: %7$s',
				$audio_mode,
				$audio_loop,
				$audio_volume,
				$audio_ref_distance,
				$audio_max_distance,
				$audio_rolloff_factor,
				$distance_model
			)
		);
		$entity->setAttribute( 'data-audio-asset-id', $audio_asset_id );
		$entity->setAttribute( 'data-audio-title', $this->sanitize_text_attr( (string) ( $obj->asset_name ?? $obj->name ?? 'Audio' ) ) );
		$entity->setAttribute( 'data-audio-state', 'idle' );

		$this->apply_immerse_cefr_gating_attributes( $entity, $obj );

		$ascene->appendChild( $entity );
	}

	private function render_media_entity( $dom, $ascene, $assets, $obj ) {
		$uuid = $obj->uuid ?? '';
		$cat  = $obj->category_slug ?? '';

		if ( $cat === 'image' ) {
			// Image Asset
			$a_img = $dom->createElement( 'img' );
			$a_img->setAttribute( 'id', 'image_' . $uuid );
			$a_img->setAttribute( 'src', $this->normalize_url( $obj->image_path ?? '' ) );
			$a_img->setAttribute( 'crossorigin', 'anonymous' );
			$assets->appendChild( $a_img );

			// Parent entity for dual planes
			$parent = $dom->createElement( 'a-entity' );
			$parent->setAttribute( 'id', 'image-display_' . $uuid );
			$this->setAffineTransformations( $parent, $obj );
			$parent->setAttribute( 'class', 'hideable' );
			$this->apply_immerse_cefr_gating_attributes( $parent, $obj );

			// Determine if transparent (usually yes for PNG POIs)
			$is_transparent = isset($obj->transparent) ? ($obj->transparent ? 'true' : 'false') : 'true';

			$front = $dom->createElement( 'a-plane' );
			$front->setAttribute( 'height', '2' );
			$front->setAttribute( 'width', '2' );
			$front->setAttribute( 'position', '0 0 0.001' );
			$front->setAttribute( 'material', "src: #image_$uuid; shader: flat; side: front; transparent: $is_transparent; alphaTest: 0.5; depthWrite: false" );
			
			$back = $dom->createElement( 'a-plane' );
			$back->setAttribute( 'height', '2' );
			$back->setAttribute( 'width', '2' );
			$back->setAttribute( 'position', '0 0 -0.001' );
			$back->setAttribute( 'rotation', '0 180 0' );
			$back->setAttribute( 'material', "src: #image_$uuid; shader: flat; side: front; transparent: $is_transparent; alphaTest: 0.5; depthWrite: false" );

			$parent->appendChild( $front );
			$parent->appendChild( $back );
			$ascene->appendChild( $parent );

		} elseif ( $cat === 'video' ) {
			$poster_id  = '';
			$poster_url = $this->normalize_url( $obj->screenshot_path ?? '' );

			if ( $poster_url ) {
				$poster_id = 'video_poster_' . $uuid;
				$poster = $dom->createElement( 'img' );
				$poster->setAttribute( 'id', $poster_id );
				$poster->setAttribute( 'src', $poster_url );
				$poster->setAttribute( 'crossorigin', 'anonymous' );
				$assets->appendChild( $poster );
			}

			// Video Assets (Controls)
			$v_pl = $dom->createElement( 'img' );
			$v_pl->setAttribute( 'id', 'video_pl_' . $uuid );
			$v_pl->setAttribute( 'src', $this->plugin_path_url . 'assets/images/play_2f3542.png' );
			$assets->appendChild( $v_pl );

			$v_pas = $dom->createElement( 'img' );
			$v_pas->setAttribute( 'id', 'video_pas_' . $uuid );
			$v_pas->setAttribute( 'src', $this->plugin_path_url . 'assets/images/pause_2f3542.png' );
			$assets->appendChild( $v_pas );

			$v_fs = $dom->createElement( 'img' );
			$v_fs->setAttribute( 'id', 'video_fs_' . $uuid );
			$v_fs->setAttribute( 'src', $this->plugin_path_url . 'assets/images/fullscreen_2f3542.png' );
			$assets->appendChild( $v_fs );

			$v_ex = $dom->createElement( 'img' );
			$v_ex->setAttribute( 'id', 'video_ex_' . $uuid );
			$v_ex->setAttribute( 'src', $this->plugin_path_url . 'assets/images/exit_2f3542.png' );
			$assets->appendChild( $v_ex );

			// Video Display
			$display = $dom->createElement( 'a-plane' );
			$display->setAttribute( 'id', 'video-display_' . $uuid );
			$display->setAttribute( 'width', '4' );
			$display->setAttribute( 'height', '3' );
			if ( $poster_id ) {
				$display->setAttribute( 'src', '#' . $poster_id );
				$display->setAttribute( 'data-vrodos-video-poster', '#' . $poster_id );
			}
			$display->setAttribute( 'material', 'shader: flat; side: double' );
			$display->setAttribute( 'class', 'clickable raycastable hideable' );
			$display->setAttribute( 'original-scale', '1 1 1' );
			$display->setAttribute( 'data-vrodos-video-src', $this->normalize_url( $obj->video_path ?? '' ) );
			$display->setAttribute( 'data-vrodos-video-loop', ($obj->video_loop ?? 0) == 1 ? 'true' : 'false' );
			$display->setAttribute( 'video-controls', "id: $uuid" );
			$this->setAffineTransformations( $display, $obj );
			$this->apply_immerse_cefr_gating_attributes( $display, $obj );

			$play_hint = $dom->createElement( 'a-plane' );
			$play_hint->setAttribute( 'id', 'video-playhint_' . $uuid );
			$play_hint->setAttribute( 'src', '#video_pl_' . $uuid );
			$play_hint->setAttribute( 'position', '0 0 0.01' );
			$play_hint->setAttribute( 'width', '0.72' );
			$play_hint->setAttribute( 'height', '0.72' );
			$play_hint->setAttribute( 'material', 'shader: flat; side: double; transparent: true; opacity: 0.96; depthTest: false' );
			$display->appendChild( $play_hint );

			$ascene->appendChild( $display );

			// Video Panel (Hidden by default, attached to camera by JS)
			$panel = $dom->createElement( 'a-entity' );
			$panel->setAttribute( 'id', 'vid-panel_' . $uuid );
			$panel->setAttribute( 'mixin', 'vid_panel' );
			$panel->setAttribute( 'visible', 'false' );
			$panel->setAttribute( 'scale', '0.0001 0.0001 0.0001' );

			// Exit Frame & Button
			$exit_frame = $dom->createElement( 'a-entity' );
			$exit_frame->setAttribute( 'id', 'exit_vid_panel_' . $uuid );
			$exit_frame->setAttribute( 'mixin', 'poiVidEscFrame' );
			$exit_frame->setAttribute( 'class', 'raycastable' );
			$panel->appendChild( $exit_frame );

			$exit_btn = $dom->createElement( 'a-plane' );
			$exit_btn->setAttribute( 'id', 'ent_ex_' . $uuid );
			$exit_btn->setAttribute( 'src', '#video_ex_' . $uuid );
			$exit_btn->setAttribute( 'mixin', 'poiVidEscFrame' );
			$exit_btn->setAttribute( 'material', 'transparent: true' );
			$exit_btn->setAttribute( 'class', 'raycastable' );
			$panel->appendChild( $exit_btn );

			// Play Button
			$play_btn = $dom->createElement( 'a-plane' );
			$play_btn->setAttribute( 'id', 'ent_pl_' . $uuid );
			$play_btn->setAttribute( 'src', '#video_pl_' . $uuid );
			$play_btn->setAttribute( 'position', '0 -0.2 0.001' );
			$play_btn->setAttribute( 'width', '0.1' );
			$play_btn->setAttribute( 'height', '0.1' );
			$play_btn->setAttribute( 'material', 'transparent: true' );
			$play_btn->setAttribute( 'class', 'raycastable' );
			$panel->appendChild( $play_btn );

			// Fullscreen Button
			$fs_btn = $dom->createElement( 'a-plane' );
			$fs_btn->setAttribute( 'id', 'ent_fs_' . $uuid );
			$fs_btn->setAttribute( 'src', '#video_fs_' . $uuid );
			$fs_btn->setAttribute( 'position', '0.2 -0.2 0.001' );
			$fs_btn->setAttribute( 'width', '0.1' );
			$fs_btn->setAttribute( 'height', '0.1' );
			$fs_btn->setAttribute( 'material', 'transparent: true' );
			$fs_btn->setAttribute( 'class', 'raycastable' );
			$panel->appendChild( $fs_btn );

			// Title
			$title = $dom->createElement( 'a-text' );
			$title->setAttribute( 'id', 'ent_tit_' . $uuid );
			$title->setAttribute( 'value', $this->sanitize_text_attr( $obj->video_title ?? 'Video' ) );
			$title->setAttribute( 'position', '0 0.3 0.001' );
			$title->setAttribute( 'align', 'center' );
			$title->setAttribute( 'width', '0.5' );
			$panel->appendChild( $title );

			$ascene->appendChild( $panel );
		}
	}

	private function render_poi_imagetext_entity( $dom, $ascene, $assets, $obj ) {
		$uuid = $obj->uuid ?? '';
		
		// 1. Assets
		$main_img = $dom->createElement( 'img' );
		$main_img->setAttribute( 'id', 'main_img_' . $uuid );
		$main_img->setAttribute( 'src', $this->normalize_url( $obj->poi_img_path ?? $obj->poi_image_path ?? '' ) );
		$main_img->setAttribute( 'crossorigin', 'anonymous' );
		$assets->appendChild( $main_img );

		$esc_img = $dom->createElement( 'img' );
		$esc_img->setAttribute( 'id', 'esc_img_' . $uuid );
		$esc_img->setAttribute( 'src', $this->plugin_path_url . 'assets/images/x_2f3542.png' );
		$assets->appendChild( $esc_img );

		// 2. UI Container (attached to scene, moved by JS)
		$ui = $dom->createElement( 'a-entity' );
		$ui->setAttribute( 'id', $uuid );
		$ui->setAttribute( 'class', 'hideable raycastable' );
		$ui->setAttribute( 'visible', 'false' );
		$ui->setAttribute( 'scale', '0.001 0.001 0.001' );
		// Add invisible geometry to satisfy this.el.components.material access in legacy JS
		$ui->setAttribute( 'geometry', 'primitive: plane; width: 0.001; height: 0.001' );
		$ui->setAttribute( 'material', 'visible: false; depthTest: true' );
		$ui->setAttribute( 'info-panel', $uuid );
		$this->setAffineTransformations( $ui, $obj );
		
		// 3. The Button (Trigger GLTF)
		$button = $dom->createElement( 'a-entity' );
		$button->setAttribute( 'id', 'button_poi_' . $uuid );
		$button->setAttribute( 'gltf-model', 'url(' . $this->normalize_url( $obj->glb_path ?? '' ) . ')' );
		$button->setAttribute( 'highlight', 'button_poi_' . $uuid );
		$button->setAttribute( 'class', 'raycastable menu-button hideable' );
		$button->setAttribute( 'shadow', 'cast: true; receive: true' );
		$this->setAffineTransformations( $button, $obj ); // Trigger stays in 3D world
		$ascene->appendChild( $button );

		// 4. The Info Panel (Inside UI Container)
		// Geometric Background
		$infoPanel = $dom->createElement( 'a-entity' );
		$infoPanel->setAttribute( 'id', 'infoPanel_' . $uuid );
		$infoPanel->setAttribute( 'geometry', 'primitive: plane; width: 1.5; height: 1.8' );
		$infoPanel->setAttribute( 'material', 'color: #333333; shader: flat; transparent: true; opacity: 0.9' );
		$infoPanel->setAttribute( 'position', '0 0 0.005' );
		$ui->appendChild( $infoPanel );

		// Image Display Plane
		$top_img = $dom->createElement( 'a-entity' );
		$top_img->setAttribute( 'id', 'top_img_' . $uuid );
		$top_img->setAttribute( 'geometry', 'primitive: plane; width: 1.4; height: 0.8' );
		$top_img->setAttribute( 'material', 'shader: flat; transparent: true' );
		$top_img->setAttribute( 'position', '0 0.35 0.01' );
		$ui->appendChild( $top_img );

		// Title Text (Using fallbacks for common mismatched keys)
		$title_text = $obj->poi_img_title ?? $obj->poi_title ?? '';
		
		$title = $dom->createElement( 'a-text' );
		$title->setAttribute( 'id', 'title_' . $uuid );
		$title->setAttribute( 'position', '0 0.82 0.01' );
		$title->setAttribute( 'value', $this->sanitize_text_attr( $title_text ) );
		$title->setAttribute( 'color', '#eeeeee' );
		$title->setAttribute( 'align', 'center' );
		$title->setAttribute( 'font', 'https://cdn.aframe.io/fonts/DejaVu-sdf.fnt' );
		$title->setAttribute( 'width', '1.4' );
		$title->setAttribute( 'title_to_add', $this->sanitize_text_attr( $title_text ) );
		$ui->appendChild( $title );
		
		// Description Text (Using fallbacks for common mismatched keys)
		$desc_text = $obj->poi_img_content ?? $obj->poi_description ?? '';
		
		$desc = $dom->createElement( 'a-text' );
		$desc->setAttribute( 'id', 'desc_' . $uuid );
		$desc->setAttribute( 'position', '0 -0.25 0.01' );
		$desc->setAttribute( 'value', $this->sanitize_text_attr( $desc_text ) );
		$desc->setAttribute( 'color', '#cccccc' );
		$desc->setAttribute( 'align', 'left' );
		$desc->setAttribute( 'font', 'https://cdn.aframe.io/fonts/DejaVu-sdf.fnt' );
		$desc->setAttribute( 'width', '1.3' );
		$desc->setAttribute( 'text_to_add', $this->sanitize_text_attr( $desc_text ) );
		$ui->appendChild( $desc );

		// Page Indicator
		$page = $dom->createElement( 'a-entity' );
		$page->setAttribute( 'id', 'page_' . $uuid );
		$page->setAttribute( 'position', '0 -0.7 0.01' );
		$page->setAttribute( 'text', 'value: page 1; color: #aaaaaa; align: center; font: https://cdn.aframe.io/fonts/DejaVu-sdf.fnt; width: 1' );
		$ui->appendChild( $page );

		// Navigation Buttons
		// Next
		$next_panel = $dom->createElement( 'a-plane' );
		$next_panel->setAttribute( 'id', 'next_panel_' . $uuid );
		$next_panel->setAttribute( 'position', '0.5 -0.7 0.01' );
		$next_panel->setAttribute( 'width', '0.2' );
		$next_panel->setAttribute( 'height', '0.1' );
		$next_panel->setAttribute( 'color', '#444444' );
		$next_panel->setAttribute( 'class', 'raycastable' );
		$ui->appendChild( $next_panel );

		$next_btn = $dom->createElement( 'a-entity' );
		$next_btn->setAttribute( 'id', 'next_' . $uuid );
		$next_btn->setAttribute( 'position', '0.5 -0.7 0.02' );
		$next_btn->setAttribute( 'text', 'value: NEXT; color: #ffffff; align: center; width: 1' );
		$next_btn->setAttribute( 'class', 'raycastable' );
		$ui->appendChild( $next_btn );

		// Prev
		$prev_panel = $dom->createElement( 'a-plane' );
		$prev_panel->setAttribute( 'id', 'prev_panel_' . $uuid );
		$prev_panel->setAttribute( 'position', '-0.5 -0.7 0.01' );
		$prev_panel->setAttribute( 'width', '0.2' );
		$prev_panel->setAttribute( 'height', '0.1' );
		$prev_panel->setAttribute( 'color', '#444444' );
		$prev_panel->setAttribute( 'class', 'raycastable' );
		$ui->appendChild( $prev_panel );

		$prev_btn = $dom->createElement( 'a-entity' );
		$prev_btn->setAttribute( 'id', 'prev_' . $uuid );
		$prev_btn->setAttribute( 'position', '-0.5 -0.7 0.02' );
		$prev_btn->setAttribute( 'text', 'value: PREV; color: #ffffff; align: center; width: 1' );
		$prev_btn->setAttribute( 'class', 'raycastable' );
		$ui->appendChild( $prev_btn );

		// Exit Button
		$exit_panel = $dom->createElement( 'a-plane' );
		$exit_panel->setAttribute( 'id', 'exit_panel_' . $uuid );
		$exit_panel->setAttribute( 'position', '0.65 0.8 0.01' );
		$exit_panel->setAttribute( 'width', '0.12' );
		$exit_panel->setAttribute( 'height', '0.12' );
		$exit_panel->setAttribute( 'color', '#cc0000' );
		$exit_panel->setAttribute( 'class', 'raycastable' );
		$ui->appendChild( $exit_panel );

		$exit_btn = $dom->createElement( 'a-plane' );
		$exit_btn->setAttribute( 'id', 'exit_' . $uuid );
		$exit_btn->setAttribute( 'src', '#esc_img_' . $uuid );
		$exit_btn->setAttribute( 'position', '0.65 0.8 0.02' );
		$exit_btn->setAttribute( 'width', '0.1' );
		$exit_btn->setAttribute( 'height', '0.1' );
		$exit_btn->setAttribute( 'material', 'transparent: true' );
		$exit_btn->setAttribute( 'class', 'raycastable' );
		$exit_btn->setAttribute( 'original-scale', '1 1 1' );
		$ui->appendChild( $exit_btn );

		$ascene->appendChild( $ui );
	}

	private function map_light_type( $cat ) {
		$map = [
			'lightSun'     => 'directional',
			'lightSpot'    => 'spot',
			'lightLamp'    => 'point',
			'lightAmbient' => 'ambient'
		];
		return $map[ $cat ] ?? 'point';
	}
}
