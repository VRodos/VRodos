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
			sleep( 2 );
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

	private function sanitize_text_attr( string $value ): string {
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
			} else {
				$chat_wrapper->setAttribute( 'data-visible', 'false' );
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
		return $this->writer( $this->plugin_path_dir . '/runtime/build/' . 'index_' . $scene_id . '.html', $content );
	}

	private function createMasterClient( $scene_id, $scene_title, $scene_json, $showPawnPositions, $index, $project_id, $scene_id_list ) {

		// Read prototype
		$content = $this->reader(
			$this->plugin_path_dir
			. '/js_libs/aframe_libs/Master_Client_prototype.html'
		);

		// Fog Metadata for scene-settings component
		$fog_category = $scene_json->metadata->fogCategory ?? 0;
		$fog_color    = $scene_json->metadata->fogcolor ?? '#FFFFFF';
		$fog_far      = $scene_json->metadata->fogfar ?? 1000;
		$fog_near     = $scene_json->metadata->fognear ?? 0;
		$fog_density  = $scene_json->metadata->fogdensity ?? 0.00000001;

		// Modify strings
		$content = str_replace( 'roomname', 'room' . $scene_id, $content );
		$content = str_replace(
			'js/components/immerse-assessment_component.js',
			$this->normalize_url( $this->plugin_path_url . 'js_libs/aframe_libs/js/components/immerse-assessment_component.js' ),
			$content
		);

		$content = str_replace( 'AFRAME_CLEARCOLOR_PLACEHOLDER', $scene_json->metadata->ClearColor, $content );

		// Inject plugin base URL so runtime can load HDR environment maps.
		$content = str_replace(
			'VRODOS_PLUGIN_URL_PLACEHOLDER',
			esc_js( $this->plugin_path_url ),
			$content
		);

		// Replace Fog string
		if ( isset( $scene_json->metadata->fogCategory ) && (int)$scene_json->metadata->fogCategory !== 0 ) {
			if ( (int)$scene_json->metadata->fogCategory === 1 ) {
				$fogtype = 'linear';
			} else {
				$fogtype = 'exponential';
			}

			// Sanitize color (remove leading hash if present, then add exactly one)
			$fogcolor = ltrim( $scene_json->metadata->fogcolor, '#' );

			$fog_attr = 'type: ' . $fogtype .
			            '; color: #' . $fogcolor .
			            '; far: ' . ( $scene_json->metadata->fogfar ?? '1000' ) .
			            '; density: ' . ( 1.5 * ( $scene_json->metadata->fogdensity ?? '0.00000001' ) ) .
			            '; near: ' . ( $scene_json->metadata->fognear ?? '0' );

			$content = str_replace( 'AFRAME_FOG_PLACEHOLDER', $fog_attr, $content );
		} else {
			$content = str_replace( 'AFRAME_FOG_PLACEHOLDER', ' ', $content );
		}

		$basicDomElements = $this->createBasicDomStructureAframeDirector( $content, $scene_json, $project_id, $scene_id, $scene_id_list );

		$dom          = $basicDomElements['dom'];
		$objects      = $basicDomElements['objects'];
		$ascene       = $basicDomElements['ascene'];
		$ascenePlayer = $basicDomElements['ascenePlayer'];
		$sceneColor   = $scene_json->metadata->ClearColor;
		$is_immerse_project = $this->is_immerse_project( (int) $project_id );

		$projectType = $this->get_project_type_slug( (int) $project_id );
		$a_asset     = $dom->createElement( 'a-assets' );

		$dom->getElementsByTagName( 'title' )->item( 0 )->nodeValue = $scene_title[ $index ];

		$bcg_choice    = $scene_json->metadata->backgroundStyleOption ?? '';
		$preset_choice = $scene_json->metadata->backgroundPresetOption ?? '';
		$preset_ground_enabled = ! isset( $scene_json->metadata->backgroundPresetGroundEnabled ) || filter_var( $scene_json->metadata->backgroundPresetGroundEnabled, FILTER_VALIDATE_BOOLEAN ) ? '1' : '0';
		$image_path    = $scene_json->metadata->backgroundImagePath ?? '';
		if ( $bcg_choice == '3' ) {

			if ( $image_path ) {
				$a_asset_sky = $dom->createElement( 'img' );
				$a_asset_sky->setAttribute( 'id', 'custom_sky' );
				$a_asset_sky->setAttribute( 'src', $this->normalize_url( $image_path ) );
				$a_asset_sky->setAttribute( 'crossorigin', 'anonymous' );
				$a_asset->appendChild( $a_asset_sky );
				$ascene->appendChild( $a_asset );
			} else {
				$bcg_choice = '0';
			}
		}

		$movement_disabled = isset( $scene_json->metadata->disableMovement ) && filter_var( $scene_json->metadata->disableMovement, FILTER_VALIDATE_BOOLEAN );
		$avatar_enabled    = isset( $scene_json->metadata->enableAvatar ) && filter_var( $scene_json->metadata->enableAvatar, FILTER_VALIDATE_BOOLEAN );
		$collision_mode    = $scene_json->metadata->aframeCollisionMode ?? 'auto';
		$render_quality    = $scene_json->metadata->aframeRenderQuality ?? 'standard';
		$shadow_quality    = $scene_json->metadata->aframeShadowQuality ?? 'medium';
		$aa_quality        = $scene_json->metadata->aframeAAQuality ?? 'balanced';
		$fps_meter_enabled = isset( $scene_json->metadata->aframeFPSMeterEnabled ) && filter_var( $scene_json->metadata->aframeFPSMeterEnabled, FILTER_VALIDATE_BOOLEAN ) ? '1' : '0';
		$ambient_occlusion_preset = $scene_json->metadata->aframeAmbientOcclusionPreset ?? 'balanced';
		$contact_shadow_preset = $scene_json->metadata->aframeContactShadowPreset ?? 'soft';
		$post_fx_enabled   = isset( $scene_json->metadata->aframePostFXEnabled ) && filter_var( $scene_json->metadata->aframePostFXEnabled, FILTER_VALIDATE_BOOLEAN ) ? '1' : '0';
		$post_fx_color_enabled = ! isset( $scene_json->metadata->aframePostFXColorEnabled ) || filter_var( $scene_json->metadata->aframePostFXColorEnabled, FILTER_VALIDATE_BOOLEAN ) ? '1' : '0';
		$post_fx_edge_aa_enabled = ! isset( $scene_json->metadata->aframePostFXEdgeAAEnabled ) || filter_var( $scene_json->metadata->aframePostFXEdgeAAEnabled, FILTER_VALIDATE_BOOLEAN ) ? '1' : '0';
		$post_fx_edge_aa_strength = $scene_json->metadata->aframePostFXEdgeAAStrength ?? '3';
		$bloom_strength    = $scene_json->metadata->aframeBloomStrength ?? 'off';
		if ( isset( $scene_json->metadata->aframePostFXBloomEnabled ) && ! filter_var( $scene_json->metadata->aframePostFXBloomEnabled, FILTER_VALIDATE_BOOLEAN ) ) {
			$bloom_strength = 'off';
		}
		$post_fx_bloom_enabled = 'off' !== $bloom_strength ? '1' : '0';
		$post_fx_vignette_enabled = '0';
		$exposure_preset  = $scene_json->metadata->aframeExposurePreset ?? 'neutral';
		$contrast_preset  = $scene_json->metadata->aframeContrastPreset ?? 'balanced';
		$reflection_profile = $scene_json->metadata->aframeReflectionProfile ?? 'balanced';
		$reflection_source = $scene_json->metadata->aframeReflectionSource ?? 'hdr';
		$horizon_sky_preset = $scene_json->metadata->aframeHorizonSkyPreset ?? 'natural';
		$env_map_preset    = $scene_json->metadata->aframeEnvMapPreset ?? 'none';
		$post_fx_taa_enabled = isset( $scene_json->metadata->aframePostFXTAAEnabled ) && filter_var( $scene_json->metadata->aframePostFXTAAEnabled, FILTER_VALIDATE_BOOLEAN ) ? '1' : '0';
		$post_fx_ssr_enabled = isset( $scene_json->metadata->aframePostFXSSREnabled ) && filter_var( $scene_json->metadata->aframePostFXSSREnabled, FILTER_VALIDATE_BOOLEAN ) ? '1' : '0';
		$post_fx_ssr_strength = $scene_json->metadata->aframePostFXSSRStrength ?? 'off';
		// Post-processing engine selector: 'legacy' (vrodos_postprocessing.js custom
		// SAO/SSR/TAA composite) or 'pmndrs' (vrodos_postprocessing_pmndrs.js, fused
		// EffectPass, supports clouds in Phase 5 but no SSR/TRAA). Default is 'legacy'
		// so all existing scenes and all newly compiled scenes keep current behaviour
		// until Phase 3 confirms visual parity. See POSTPROCESSING_MIGRATION_PLAN.md §11.
		$post_fx_engine_raw = $scene_json->metadata->aframePostFXEngine ?? 'legacy';
		$post_fx_engine     = ( 'pmndrs' === $post_fx_engine_raw ) ? 'pmndrs' : 'legacy';
		$cam_position      = implode( ' ', $scene_json->objects->avatarCamera->position );
		$public_chat       = isset( $scene_json->metadata->enableGeneralChat ) && filter_var( $scene_json->metadata->enableGeneralChat, FILTER_VALIDATE_BOOLEAN );

		$cam_rotation_y = 180 / pi() * $scene_json->objects->avatarCamera->rotation[1];
		if ( ! empty( $sceneColor ) ) {
			$ascene->setAttribute( 'scene-settings', "color: $sceneColor; pr_type: $projectType; selChoice: $bcg_choice; presChoice: $preset_choice; presetGroundEnabled: $preset_ground_enabled; movement_disabled: $movement_disabled; avatar_enabled: $avatar_enabled; collisionMode: $collision_mode; renderQuality: $render_quality; shadowQuality: $shadow_quality; aaQuality: $aa_quality; fpsMeterEnabled: $fps_meter_enabled; ambientOcclusionPreset: $ambient_occlusion_preset; contactShadowPreset: $contact_shadow_preset; postFXEnabled: $post_fx_enabled; postFXBloomEnabled: $post_fx_bloom_enabled; postFXColorEnabled: $post_fx_color_enabled; postFXVignetteEnabled: $post_fx_vignette_enabled; postFXEdgeAAEnabled: $post_fx_edge_aa_enabled; postFXEdgeAAStrength: $post_fx_edge_aa_strength; bloomStrength: $bloom_strength; exposurePreset: $exposure_preset; contrastPreset: $contrast_preset; reflectionProfile: $reflection_profile; reflectionSource: $reflection_source; horizonSkyPreset: $horizon_sky_preset; envMapPreset: $env_map_preset; postFXTAAEnabled: $post_fx_taa_enabled; postFXSSREnabled: $post_fx_ssr_enabled; postFXSSRStrength: $post_fx_ssr_strength; postFXEngine: $post_fx_engine; cam_position: $cam_position; cam_rotation_y: $cam_rotation_y; public_chat: $public_chat; fogCategory: $fog_category; fogcolor: $fog_color; fogfar: $fog_far; fognear: $fog_near; fogdensity: $fog_density" );
		} else {
			$ascene->setAttribute( 'scene-settings', "color: #ffffff; pr_type: $projectType; selChoice: $bcg_choice; presChoice: $preset_choice; presetGroundEnabled: $preset_ground_enabled; movement_disabled: $movement_disabled; avatar_enabled: $avatar_enabled; collisionMode: $collision_mode; renderQuality: $render_quality; shadowQuality: $shadow_quality; aaQuality: $aa_quality; fpsMeterEnabled: $fps_meter_enabled; ambientOcclusionPreset: $ambient_occlusion_preset; contactShadowPreset: $contact_shadow_preset; postFXEnabled: $post_fx_enabled; postFXBloomEnabled: $post_fx_bloom_enabled; postFXColorEnabled: $post_fx_color_enabled; postFXVignetteEnabled: $post_fx_vignette_enabled; postFXEdgeAAEnabled: $post_fx_edge_aa_enabled; postFXEdgeAAStrength: $post_fx_edge_aa_strength; bloomStrength: $bloom_strength; exposurePreset: $exposure_preset; contrastPreset: $contrast_preset; reflectionProfile: $reflection_profile; reflectionSource: $reflection_source; horizonSkyPreset: $horizon_sky_preset; envMapPreset: $env_map_preset; postFXTAAEnabled: $post_fx_taa_enabled; postFXSSREnabled: $post_fx_ssr_enabled; postFXSSRStrength: $post_fx_ssr_strength; postFXEngine: $post_fx_engine; cam_position: $cam_position; cam_rotation_y: $cam_rotation_y; public_chat: $public_chat; fogCategory: $fog_category; fogcolor: $fog_color; fogfar: $fog_far; fognear: $fog_near; fogdensity: $fog_density" );
		}
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

		foreach ( $objects as $contentObject ) {

			$uuid = $contentObject->uuid ?? '';

			if ( isset( $contentObject->category_name ) ) {
				// Switch for lights
				switch ( $contentObject->category_name ) {

					case 'lightSun':
						$a_light = $dom->createElement( 'a-light' );
						$a_light->appendChild( $dom->createTextNode( '' ) );
						$a_light->setAttribute( 'id', 'lighttarget' );
						$this->setAffineTransformations( $a_light, $contentObject );

						$a_light_target = $dom->createElement( 'a-entity' );
						$a_light_target->appendChild( $dom->createTextNode( '' ) );
						$a_light_target->setAttribute( 'position', implode( ' ', $contentObject->targetposition ) );
						$a_light_target->setAttribute( 'id', $uuid . 'target' );

						$is_casting_shadow = isset( $contentObject->castingShadow ) ? ( $contentObject->castingShadow == '1' ? 'true' : 'false' ) : 'false';

						$ascene->appendChild( $a_light_target );
						$a_light->setAttribute(
							'light',
							'type:directional;' .
							'color:' . $this->colorRGB2Hex( $contentObject->lightcolor ) . ';' .
							// "intensity:".($contentObject->lightintensity).";".
							'castShadow:' . ( $is_casting_shadow ) . ';' .

							'shadowMapHeight:' . ( $contentObject->shadowMapHeight ?? '512' ) . ';' .
							// "shadowCameraFar: 5000;".
							'shadowMapWidth:' . ( $contentObject->shadowMapWidth ?? '512' ) . ';' .
							'shadowCameraTop:' . ( $contentObject->shadowCameraTop ?? '5' ) . ';' .
							'shadowCameraRight:' . ( $contentObject->shadowCameraRight ?? '5' ) . ';' .
							'shadowCameraLeft:' . ( $contentObject->shadowCameraLeft ?? '-5' ) . ';' .
							'shadowCameraBottom:' . ( $contentObject->shadowCameraBottom ?? '-5' ) . ';' .
							'shadowBias:' . ( $contentObject->shadowBias ?? '0' ) . ';' .
							// "shadow-camera-automatic: '#41132111-4c3f-4741-9c8a-343e71fc4b46';".
							'shadowCameraVisible: false;'
							// #41132111-4c3f-4741-9c8a-343e71fc4b46';
						);

						$a_light->setAttribute( 'target', '#' . $uuid . 'target' );

						$a_sun_sky = $dom->createElement( 'a-sun-sky' );
						$a_sun_sky->appendChild( $dom->createTextNode( '' ) );

						$SunPosVec = $contentObject->position;
						$TargetVec = $contentObject->targetposition;

						$SkySun = [$SunPosVec[0] - $TargetVec[0], $SunPosVec[1] - $TargetVec[1], $SunPosVec[2] - $TargetVec[2]];

						$materialSunSky = 'side:back; sunPosition: ';
						$materialSunSky = $materialSunSky . $SkySun[0] . ' ' . $SkySun[1] . ' ' . $SkySun[2];
						$a_sun_sky->setAttribute( 'material', $materialSunSky );

						if ( isset( $contentObject->sunSky ) && $contentObject->sunSky == '1' ) {
							$ascene->appendChild( $a_sun_sky );
						}

						$ascene->appendChild( $a_light );

						break;

					case 'lightSpot':
						$a_light = $dom->createElement( 'a-light' );
						$a_light->appendChild( $dom->createTextNode( '' ) );
						$this->setAffineTransformations( $a_light, $contentObject );

						$a_light_target = $dom->createElement( 'a-entity' );
						$a_light_target->appendChild( $dom->createTextNode( '' ) );
						$a_light_target->setAttribute( 'position', implode( ' ', $contentObject->targetposition ) );
						$a_light_target->setAttribute( 'id', $uuid . 'target' );

						$a_light->setAttribute(
							'light',
							'type:spot;' .
							'color:' . $this->colorRGB2Hex( $contentObject->lightcolor ) . ';' .
							'intensity: 2' .
							'distance:' . $contentObject->lightdistance . ';' .
							'decay:' . $contentObject->lightdecay . ';' .
							'angle:' . ( $contentObject->lightangle * 180 / 3.141 ) . ';' .
							'penumbra:' . $contentObject->lightpenumbra . ';'
						);

						$a_light->setAttribute( 'target', '#' . $uuid . 'target' );
						$ascene->appendChild( $a_light_target );

						$ascene->appendChild( $a_light );
						break;

					case 'lightLamp':
						$a_light = $dom->createElement( 'a-light' );
						$a_light->appendChild( $dom->createTextNode( '' ) );
						$this->setAffineTransformations( $a_light, $contentObject );

						if ( isset( $contentObject->lampcastingShadow ) ) {
							if ( $contentObject->lampcastingShadow == '1' ) {
								$is_casting_shadow = 'true';
							} else {
								$is_casting_shadow = 'false';
							}
						}

						$a_light->setAttribute(
							'light',
							'type:point;' .
							'color:' . $this->colorRGB2Hex( $contentObject->lightcolor ) . ';' .
							'intensity:' . $contentObject->lightintensity . ';' .
							'distance:' . $contentObject->lightdistance . ';' .
							'castShadow:' . ( $is_casting_shadow ?? '' ) . ';' .
							'shadowMapHeight:' . ( $contentObject->lampshadowMapHeight ?? '' ) . ';' .
							'shadowMapWidth:' . ( $contentObject->lampshadowMapWidth ?? '' ) . ';' .
							'shadowCameraTop:' . ( $contentObject->lampshadowCameraTop ?? '' ) . ';' .
							'shadowCameraRight:' . ( $contentObject->lampshadowCameraRight ?? '' ) . ';' .
							'shadowCameraLeft:' . ( $contentObject->lampshadowCameraLeft ?? '' ) . ';' .
							'shadowCameraBottom:' . ( $contentObject->lampshadowCameraBottom ?? '' ) . ';' .
							'shadowBias:' . ( $contentObject->lampshadowBias ?? '' ) . ';' .
							// "shadow-camera-automatic: '#41132111-4c3f-4741-9c8a-343e71fc4b46';".
							'shadowCameraVisible: false;'
							// ."radius:".$contentObject->shadowRadius
						);

						$ascene->appendChild( $a_light );
						break;

					case 'lightAmbient':
						$a_light = $dom->createElement( 'a-light' );
						$a_light->appendChild( $dom->createTextNode( '' ) );
						$this->setAffineTransformations( $a_light, $contentObject );

						$a_light->setAttribute(
							'light',
							'type:ambient;' .
							'color:' . $this->colorRGB2Hex( $contentObject->lightcolor ) . ';' .
							'intensity:' . $contentObject->lightintensity
						);

						$ascene->appendChild( $a_light );
						break;
				}
			}

			if ( isset( $contentObject->category_slug ) ) {
				// Switch for all objects except lights
				switch ( $contentObject->category_slug ) {

					case 'pawn':
						if ( $showPawnPositions == 'true' ) {
							$a_entity = $dom->createElement( 'a-entity' );
							$a_entity->appendChild( $dom->createTextNode( '' ) );

							$this->setAffineTransformations( $a_entity, $contentObject );
							$a_entity->setAttribute(
								'gltf-model',
								'url(' . $this->normalize_url( $this->plugin_path_url . 'assets/pawn.glb' ) . ')'
							);

							$ascene->appendChild( $a_entity );
						}

						break;

					case 'decoration':
						$assets = $dom->getElementById( 'scene-assets' );

						$asset_item = $dom->createElement( 'a-asset-item' );
						$asset_item->setAttribute( 'id', $uuid );
						$asset_item->setAttribute( 'src', '' . $this->normalize_url( $contentObject->glb_path ) . '' );
						$asset_item->setAttribute( 'response-type', 'arraybuffer' );
						$asset_item->setAttribute( 'crossorigin', 'anonymous' );

						$assets->appendChild( $asset_item );

						$sc_x = $contentObject->scale[0];
						$sc_y = $contentObject->scale[1];
						$sc_z = $contentObject->scale[2];

						$gltf_model = $dom->createElement( 'a-entity' );
						$gltf_model->setAttribute( 'gltf-model', '#' . $uuid );
						$gltf_model->setAttribute( 'original-scale', "$sc_x $sc_y $sc_z" );
						$gltf_model->appendChild( $dom->createTextNode( '' ) );
						$material = '';
						$this->setAffineTransformations( $gltf_model, $contentObject );
						$this->setMaterial( $material, $contentObject );
						$gltf_model->setAttribute( 'class', 'override-materials hideable' );
						$gltf_model->setAttribute( 'material', $material );
						$gltf_model->setAttribute( 'clear-frustum-culling', '' );
						$gltf_model->setAttribute( 'preload', 'auto' );
						$gltf_model->setAttribute( 'shadow', 'cast: true; receive: true' );

						$ascene->appendChild( $gltf_model );
						break;

					case 'walkable-surface':
						$assets = $dom->getElementById( 'scene-assets' );

						$asset_item = $dom->createElement( 'a-asset-item' );
						$asset_item->setAttribute( 'id', $uuid );
						$asset_item->setAttribute( 'src', '' . $this->normalize_url( $contentObject->glb_path ) . '' );
						$asset_item->setAttribute( 'response-type', 'arraybuffer' );
						$asset_item->setAttribute( 'crossorigin', 'anonymous' );

						$assets->appendChild( $asset_item );

						$sc_x = $contentObject->scale[0];
						$sc_y = $contentObject->scale[1];
						$sc_z = $contentObject->scale[2];

						$gltf_model = $dom->createElement( 'a-entity' );
						$gltf_model->setAttribute( 'gltf-model', '#' . $uuid );
						$gltf_model->setAttribute( 'original-scale', "$sc_x $sc_y $sc_z" );
						$gltf_model->appendChild( $dom->createTextNode( '' ) );
						$material = '';
						$this->setAffineTransformations( $gltf_model, $contentObject );
						$this->setMaterial( $material, $contentObject );
						$gltf_model->setAttribute( 'class', 'override-materials hideable vrodos-navmesh' );
						$gltf_model->setAttribute( 'material', $material );
						$gltf_model->setAttribute( 'data-vrodos-navmesh', 'true' );
						$gltf_model->setAttribute( 'clear-frustum-culling', '' );
						$gltf_model->setAttribute( 'preload', 'auto' );
						$gltf_model->setAttribute( 'shadow', 'cast: true; receive: true' );

						$ascene->appendChild( $gltf_model );
						break;

					case 'door':
						$assets = $dom->getElementById( 'scene-assets' );

						$asset_item = $dom->createElement( 'a-asset-item' );
						$asset_item->setAttribute( 'id', $uuid );
						$asset_item->setAttribute( 'src', '' . $this->normalize_url( $contentObject->glb_path ) . '' );
						$asset_item->setAttribute( 'response-type', 'arraybuffer' );
						$asset_item->setAttribute( 'crossorigin', 'anonymous' );

						$assets->appendChild( $asset_item );

						$sc_x = $contentObject->scale[0];
						$sc_y = $contentObject->scale[1];
						$sc_z = $contentObject->scale[2];

						$gltf_model = $dom->createElement( 'a-entity' );
						$gltf_model->setAttribute( 'id', "entity_$uuid" );
						$gltf_model->setAttribute( 'gltf-model', '#' . "$uuid" );
						$gltf_model->setAttribute( 'original-scale', "$sc_x $sc_y $sc_z" );
						$gltf_model->appendChild( $dom->createTextNode( '' ) );
						$gltf_model->setAttribute( 'shadow', 'cast: true; receive: true' );

						$material = '';
						$this->setMaterial( $material, $contentObject );
						$this->setAffineTransformations( $gltf_model, $contentObject );
						$gltf_model->setAttribute( 'class', 'override-materials raycastable hideable' );

						$gltf_model->setAttribute( 'material', $material );
						$gltf_model->setAttribute( 'clear-frustum-culling', '' );
						$gltf_model->setAttribute( 'highlight', "entity_$uuid" );

						if ( ! empty( $contentObject->sceneID_target ) ) {
							$this->includeDoorFunctionality( $gltf_model, $contentObject->sceneID_target );
						}

						$ascene->appendChild( $gltf_model );

						break;

					case 'image':
						$assets = $dom->getElementById( 'scene-assets' );

						$sc_x = $contentObject->scale[0];
						$sc_y = $contentObject->scale[1];
						$sc_z = $contentObject->scale[2];

						$a_img = $dom->createElement( 'img' );
						$a_img->setAttribute( 'id', "image_$uuid" );
						$a_img->setAttribute( 'src', $this->normalize_url( $contentObject->image_path ) );
						$a_img->setAttribute( 'crossorigin', 'anonymous' );
						$assets->appendChild( $a_img );

						$a_plane_parent = $dom->createElement( 'a-entity' );
						$a_plane_parent->setAttribute( 'id', "image-display_$uuid" );
						$a_plane_parent->setAttribute( 'original-scale', "$sc_x $sc_y $sc_z" );
						$a_plane_parent->setAttribute( 'class', 'hideable' );
						$a_plane_parent->appendChild( $dom->createTextNode( '' ) );
						$this->setAffineTransformations( $a_plane_parent, $contentObject );

						$a_plane_front = $dom->createElement( 'a-plane' );
						$a_plane_front->setAttribute( 'id', "image-display-front_$uuid" );
						$a_plane_front->setAttribute( 'height', '2' );
						$a_plane_front->setAttribute( 'width', '2' );
						$a_plane_front->setAttribute( 'position', '0 0 0.001' );
						$a_plane_front->setAttribute( 'material', "src: #image_$uuid; shader: flat; side: front; transparent: false; alphaTest: 0.01; depthWrite: true; depthTest: true" );
						$a_plane_front->setAttribute( 'class', 'image-display-surface' );

						$a_plane_back = $dom->createElement( 'a-plane' );
						$a_plane_back->setAttribute( 'id', "image-display-back_$uuid" );
						$a_plane_back->setAttribute( 'height', '2' );
						$a_plane_back->setAttribute( 'width', '2' );
						$a_plane_back->setAttribute( 'position', '0 0 -0.001' );
						$a_plane_back->setAttribute( 'rotation', '0 180 0' );
						$a_plane_back->setAttribute( 'material', "src: #image_$uuid; shader: flat; side: front; transparent: false; alphaTest: 0.01; depthWrite: true; depthTest: true" );
						$a_plane_back->setAttribute( 'class', 'image-display-surface' );

						$a_plane_parent->appendChild( $a_plane_front );
						$a_plane_parent->appendChild( $a_plane_back );
						$ascene->appendChild( $a_plane_parent );
						break;

					case 'video':
						$assets = $dom->getElementById( 'scene-assets' );

						$a_asset_fs = $dom->createElement( 'img' );
						$a_asset_fs->setAttribute( 'mixin', 'vid_panel' );
						$a_asset_fs->setAttribute( 'id', "video_fullScreen_$uuid" );
						$a_asset_fs->setAttribute( 'src', $this->plugin_path_url . 'assets/images/fullscreen.png' );
						$a_asset_fs->setAttribute( 'crossorigin', 'anonymous' );

						$a_asset_ex = $dom->createElement( 'img' );
						$a_asset_ex->setAttribute( 'mixin', 'vid_panel' );
						$a_asset_ex->setAttribute( 'id', "video_exit_$uuid" );
						$a_asset_ex->setAttribute( 'src', $this->plugin_path_url . 'assets/images/exit.png' );
						$a_asset_ex->setAttribute( 'crossorigin', 'anonymous' );

						$a_asset_pl = $dom->createElement( 'img' );
						$a_asset_pl->setAttribute( 'mixin', 'vid_panel' );
						$a_asset_pl->setAttribute( 'id', "video_pl_$uuid" );
						$a_asset_pl->setAttribute( 'src', $this->plugin_path_url . 'assets/images/play.png' );
						$a_asset_pl->setAttribute( 'crossorigin', 'anonymous' );

						$a_asset_pas = $dom->createElement( 'img' );
						$a_asset_pas->setAttribute( 'mixin', 'vid_panel' );
						$a_asset_pas->setAttribute( 'id', "video_pas_$uuid" );
						$a_asset_pas->setAttribute( 'src', $this->plugin_path_url . 'assets/images/pause.png' );
						$a_asset_pas->setAttribute( 'crossorigin', 'anonymous' );

						$a_video_asset = $dom->createElement( 'video' );
						$a_video_asset->setAttribute( 'id', "video_$uuid" );
						$a_video_asset->setAttribute( 'crossorigin', 'anonymous' );
						$a_video_asset->setAttribute( 'preload', 'metadata' );

						$contentObject->video_loop == 1 ? $a_video_asset->setAttribute( 'loop', 'true' ) : $a_video_asset->setAttribute( 'loop', 'false' );
						if ( $contentObject->video_loop == 1 ) {
							$a_video_asset->setAttribute( 'autoplay-manual', 'true' );
						} else {
							$a_video_asset->setAttribute( 'autoplay-manual', 'false' );
						}

						if ( $contentObject->video_path != 'false' ) {
							$a_video_asset->setAttribute( 'src', $this->normalize_url( $contentObject->video_path ) );
						}

						$assets->appendChild( $a_video_asset );
						$assets->appendChild( $a_asset_fs );
						$assets->appendChild( $a_asset_ex );
						$assets->appendChild( $a_asset_pl );
						$assets->appendChild( $a_asset_pas );

						$pos_x = $contentObject->position[0];
						$pos_y = $contentObject->position[1];
						$pos_z = $contentObject->position[2];

						$rot_x = $contentObject->rotation[0];
						$rot_y = $contentObject->rotation[1];
						$rot_z = $contentObject->rotation[2];

						$sc_x = $contentObject->scale[0];
						$sc_y = $contentObject->scale[1];
						$sc_z = $contentObject->scale[2];

						$a_entity_fs = $dom->createElement( 'a-plane' );
						$a_entity_fs->setAttribute( 'id', "ent_fs_$uuid" );
						$a_entity_fs->setAttribute( 'height', '0.08' );
						$a_entity_fs->setAttribute( 'width', '0.08' );
						$a_entity_fs->setAttribute( 'src', "#video_fullScreen_$uuid" );
						$a_entity_fs->setAttribute( 'renderOrder', '9999999' );
						$a_entity_fs->setAttribute( 'position', '-0.05 -0.03 0.000001' );
						$a_entity_fs->setAttribute( 'material', 'shader: flat' );
						$a_entity_fs->setAttribute( 'class', 'clickable raycastable non-clickable' );

						$a_entity_pl = $dom->createElement( 'a-plane' );
						$a_entity_pl->setAttribute( 'id', "ent_pl_$uuid" );
						$a_entity_pl->setAttribute( 'height', '0.08' );
						$a_entity_pl->setAttribute( 'width', '0.08' );
						$a_entity_pl->setAttribute( 'src', "#video_pl_$uuid" );
						$a_entity_pl->setAttribute( 'renderOrder', '9999999' );
						$a_entity_pl->setAttribute( 'position', '0.05 -0.03 0.000001' );
						$a_entity_pl->setAttribute( 'material', 'shader: flat;' );
						$a_entity_pl->setAttribute( 'class', 'clickable raycastable non-clickable' );

						$a_entity_ex = $dom->createElement( 'a-plane' );
						$a_entity_ex->setAttribute( 'id', "ent_ex_$uuid" );
						$a_entity_ex->setAttribute( 'height', '0.08' );
						$a_entity_ex->setAttribute( 'width', '0.08' );
						$a_entity_ex->setAttribute( 'src', "#video_exit_$uuid" );
						$a_entity_ex->setAttribute( 'renderOrder', '9999999' );
						$a_entity_ex->setAttribute( 'position', '0.15 0.15 0.000001' );
						$a_entity_ex->setAttribute( 'material', 'shader: flat; depthTest: false;' );
						$a_entity_ex->setAttribute( 'class', 'clickable raycastable non-clickable' );

						// Video panel
						$a_entity_panel = $dom->createElement( 'a-plane' );
						$a_entity_panel->setAttribute( 'id', "vid-panel_$uuid" );

						$a_entity_panel->setAttribute( 'scale', '0.00001 0.00001 0.00001' );
						$a_entity_panel->setAttribute( 'visible', 'false' );

						$a_entity_panel->setAttribute( 'class', 'clickable raycastable' );
						$a_entity_panel->setAttribute( 'mixin', 'vidFrame' );

						$exit_vid_entity_panel = $dom->createElement( 'a-entity' );
						$exit_vid_entity_panel->setAttribute( 'id', "exit_vid_panel_$uuid" );
						$exit_vid_entity_panel->setAttribute( 'mixin', 'poiVidEscFrame' );
						$exit_vid_entity_panel->setAttribute( 'scale', '1 1 1' );
						$exit_vid_entity_panel->setAttribute( 'original-scale', '1 1 1' );
						$exit_vid_entity_panel->setAttribute( 'class', 'raycastable hideable non-clickable' );

						$a_title_vid_entity = $dom->createElement( 'a-entity' );
						$a_title_vid_entity->setAttribute( 'id', "ent_tit_$uuid" );
						$a_title_vid_entity->setAttribute( 'position', '-0.18 0.05 0.000001' );

						$vid_font_path = $this->plugin_path_url . 'assets/fonts/Roboto-Black-msdf.json';
						$a_title_vid_entity->setAttribute( 'text', "depthTest:false; negate:false;shader: msdf; anchor: left; width: 0.5; font: $vid_font_path; color: #2f3542; value: $contentObject->video_title" );
						$a_title_vid_entity->setAttribute( 'class', 'clickable raycastable' );

						$a_vid_entity_panel = $dom->createElement( 'a-entity' );
						$a_vid_entity_panel->setAttribute( 'id', "a_vid_entity_panel_$uuid" );

						$a_vid_entity_panel->setAttribute( 'scale', '1 1 1' );
						$a_vid_entity_panel->setAttribute( 'original-scale', '1 1 1' );
						$a_vid_entity_panel->setAttribute( 'class', 'raycastable hideable non-clickable' );

						$a_vid_title_entity_panel = $dom->createElement( 'a-entity' );
						$a_vid_title_entity_panel->setAttribute( 'id', "a_title_vid_entity_panel_$uuid" );
						$a_vid_title_entity_panel->setAttribute( 'mixin', 'vidTitleFrame' );
						$a_vid_title_entity_panel->setAttribute( 'scale', '1 1 1' );
						$a_vid_title_entity_panel->setAttribute( 'original-scale', '1 1 1' );
						$a_vid_title_entity_panel->setAttribute( 'class', 'raycastable hideable non-clickable' );

						$a_entity_panel->appendChild( $a_title_vid_entity );
						$a_entity_panel->appendChild( $a_vid_title_entity_panel );
						$a_entity_panel->appendChild( $exit_vid_entity_panel );
						$a_entity_panel->appendChild( $a_vid_entity_panel );
						$a_entity_panel->appendChild( $a_entity_fs );
						$a_entity_panel->appendChild( $a_entity_pl );
						$a_entity_panel->appendChild( $a_entity_ex );

						$ascenePlayer->appendChild( $a_entity_panel );

						$a_video = $dom->createElement( 'a-plane' );
						$a_video->setAttribute( 'id', "video-display_$uuid" );
						$a_video->setAttribute( 'video-controls', "id: $uuid; orig_pos:$pos_x,$pos_y,$pos_z; orig_rot:$rot_x,$rot_y,$rot_z" );
						$a_video->setAttribute( 'height', '3' );          // Has to match size of the three.js asset
						$a_video->setAttribute( 'width', '4' );
						$a_video->setAttribute( 'src', "#video_$uuid" );
						$a_video->setAttribute( 'material', 'shader: flat; side: double' );
						$a_video->setAttribute( 'original-scale', "$sc_x $sc_y $sc_z" );
						$a_video->setAttribute( 'class', 'clickable hideable' );

						$this->setAffineTransformations( $a_video, $contentObject );

						$ascene->appendChild( $a_video );

						break;

					case 'poi-link':
						$assets = $dom->getElementById( 'scene-assets' );

						$asset_item = $dom->createElement( 'a-asset-item' );
						$asset_item->setAttribute( 'id', "entity_$uuid" );
						$asset_item->setAttribute( 'src', '' . $this->normalize_url( $contentObject->glb_path ) . '' );
						$asset_item->setAttribute( 'response-type', 'arraybuffer' );
						$asset_item->setAttribute( 'crossorigin', 'anonymous' );
						$assets->appendChild( $asset_item );

						$sc_x       = $contentObject->scale[0];
						$sc_y       = $contentObject->scale[1];
						$sc_z       = $contentObject->scale[2];
						$gltf_model = $dom->createElement( 'a-entity' );
						$gltf_model->setAttribute( 'gltf-model', '#' . "entity_$uuid" );
						$gltf_model->setAttribute( 'original-scale', "$sc_x $sc_y $sc_z" );
						$gltf_model->appendChild( $dom->createTextNode( '' ) );
						$material = '';
						$this->setMaterial( $material, $contentObject );
						$this->setAffineTransformations( $gltf_model, $contentObject );
						$gltf_model->setAttribute( 'class', 'override-materials raycastable hideable' );
						$gltf_model->setAttribute( 'material', $material );
						$gltf_model->setAttribute( 'clear-frustum-culling', '' );
						$gltf_model->setAttribute( 'original-scale', "$sc_x $sc_y $sc_z" );
						$gltf_model->setAttribute( 'link-listener', $contentObject->poi_link_url );
						$gltf_model->setAttribute( 'highlight', "$uuid" );
						$gltf_model->setAttribute( 'shadow', 'cast: true; receive: true' );

						$ascene->appendChild( $gltf_model );

						break;
					case 'chat':
						$assets = $dom->getElementById( 'scene-assets' );

						$asset_item = $dom->createElement( 'a-asset-item' );
						$asset_item->setAttribute( 'id', $uuid );
						$asset_item->setAttribute( 'src', '' . $this->normalize_url( $contentObject->glb_path ) . '' );
						$asset_item->setAttribute( 'response-type', 'arraybuffer' );
						$asset_item->setAttribute( 'crossorigin', 'anonymous' );

						$assets->appendChild( $asset_item );

						$asset_indicator_item = $dom->createElement( 'a-asset-item' );
						$asset_indicator_item->setAttribute( 'id', 'check_indicator_id' );
						$asset_indicator_item->setAttribute( 'src', '' . $this->plugin_path_url . 'assets/checkmark.glb' . '' );
						$asset_indicator_item->setAttribute( 'response-type', 'arraybuffer' );
						$asset_indicator_item->setAttribute( 'crossorigin', 'anonymous' );

						$assets->appendChild( $asset_indicator_item );

						$asset_indicator_item = $dom->createElement( 'a-asset-item' );
						$asset_indicator_item->setAttribute( 'id', 'x_indicator_id' );
						$asset_indicator_item->setAttribute( 'src', '' . $this->plugin_path_url . 'assets/xmark.glb' . '' );
						$asset_indicator_item->setAttribute( 'response-type', 'arraybuffer' );
						$asset_indicator_item->setAttribute( 'crossorigin', 'anonymous' );

						$assets->appendChild( $asset_indicator_item );

						$sc_x                = $contentObject->scale[0];
						$sc_y                = $contentObject->scale[1];
						$sc_z                = $contentObject->scale[2];
						$chat_indicator_full = false;

						$gltf_model = $dom->createElement( 'a-entity' );
						$gltf_model->setAttribute( 'gltf-model', '#' . $uuid );
						$gltf_model->setAttribute( 'id', $uuid );
						$gltf_model->setAttribute( 'original-scale', "$sc_x $sc_y $sc_z" );
						$num_participants = $contentObject->poi_chat_participants;
						if ( filter_var( $contentObject->poi_chat_indicators, FILTER_VALIDATE_BOOLEAN ) === true ) {
							$gltf_model->setAttribute( 'indicator-availability', "isfull: $chat_indicator_full; num_participants: $num_participants" );
						}

						$gltf_model->appendChild( $dom->createTextNode( '' ) );
						$material = '';

						$this->setAffineTransformations( $gltf_model, $contentObject );
						$this->setMaterial( $material, $contentObject );
						$gltf_model->setAttribute( 'class', 'override-materials raycastable hideable non-vr' );
						$gltf_model->setAttribute( 'material', $material );
						$gltf_model->setAttribute( 'help-chat', "scene_id: $scene_id; num_participants: $num_participants" );
						$gltf_model->setAttribute( 'clear-frustum-culling', '' );
						$gltf_model->setAttribute( 'preload', 'auto' );
						$gltf_model->setAttribute( 'shadow', 'cast: true; receive: true' );
						$gltf_model->setAttribute( 'title', $contentObject->poi_chat_title );

						$ascene->appendChild( $gltf_model );
						break;

					case 'poi-imagetext':
						$assets            = $dom->getElementById( 'scene-assets' );
						$a_image_asset_exp = $dom->createElement( 'img' );
						$a_image_asset_exp->setAttribute( 'crossorigin', 'anonymous' );
						$a_image_asset_main = $dom->createElement( 'img' );
						$a_image_asset_main->setAttribute( 'crossorigin', 'anonymous' );
						$a_image_asset_esc = $dom->createElement( 'img' );
						$a_image_asset_esc->setAttribute( 'crossorigin', 'anonymous' );
						$a_image_asset_left = $dom->createElement( 'img' );
						$a_image_asset_left->setAttribute( 'crossorigin', 'anonymous' );
						$a_image_asset_right = $dom->createElement( 'img' );
						$a_image_asset_right->setAttribute( 'crossorigin', 'anonymous' );

						$a_image_asset_main->setAttribute( 'id', "main_img_$uuid" );
						if ( $contentObject->poi_img_path != 'false' ) {
							$a_image_asset_main->setAttribute( 'src', $this->normalize_url( $contentObject->poi_img_path ) );
						}

						$a_image_asset_esc->setAttribute( 'id', "esc_img_$uuid" );
						$a_image_asset_esc->setAttribute( 'src', $this->plugin_path_url . 'assets/images/x_2f3542.png' );

						$a_image_asset_left->setAttribute( 'id', "left_img_$uuid" );
						$a_image_asset_left->setAttribute( 'src', $this->plugin_path_url . 'assets/images/arrow_left_2f3542.png' );

						$a_image_asset_right->setAttribute( 'id', "right_img_$uuid" );
						$a_image_asset_right->setAttribute( 'src', $this->plugin_path_url . 'assets/images/arrow_right_2f3542.png' );

						$assets->appendChild( $a_image_asset_exp );
						$assets->appendChild( $a_image_asset_main );
						$assets->appendChild( $a_image_asset_esc );

						$assets->appendChild( $a_image_asset_left );
						$assets->appendChild( $a_image_asset_right );

						$sc_x = $contentObject->scale[0];
						$sc_y = $contentObject->scale[1];
						$sc_z = $contentObject->scale[2];

						$a_ui_entity = $dom->createElement( 'a-entity' );
						$a_ui_entity->setAttribute( 'original-scale', "$sc_x $sc_y $sc_z" );
						$a_ui_entity->setAttribute( 'id', 'ui' );
						$a_ui_entity->setAttribute( 'class', 'hideable raycastable' );

						$this->setAffineTransformations( $a_ui_entity, $contentObject );

						$a_menu_entity = $dom->createElement( 'a-entity' );
						$a_menu_entity->setAttribute( 'id', 'menu' );
						$a_menu_entity->setAttribute( 'highlight', "$uuid" );
						$a_menu_entity->setAttribute( 'class', 'hideable raycastable' );
						$a_menu_entity->setAttribute( 'original-scale', '1 1 1' );

						$a_button_entity = $dom->createElement( 'a-entity' );
						$a_button_entity->setAttribute( 'id', "button_poi_$uuid" );
						$a_button_entity->setAttribute( 'mixin', 'frame' );
						$a_button_entity->setAttribute( 'class', 'raycastable menu-button hideable' );
						$a_button_entity->setAttribute( 'original-scale', '1 1 1' );

						$material = '';
						$this->setMaterial( $material, $contentObject );
						$a_button_entity->setAttribute( 'gltf-model', 'url(' . $this->normalize_url( $contentObject->glb_path ) . ')' );
						$a_button_entity->setAttribute( 'material', $material );
						$a_button_entity->setAttribute( 'shadow', 'cast: true; receive: true' );

						$a_menu_entity->appendChild( $a_button_entity );
						$a_ui_entity->appendChild( $a_menu_entity );
						$ascene->appendChild( $a_ui_entity );

						$a_panel_entity = $dom->createElement( 'a-entity' );
						$a_panel_entity->setAttribute( 'id', "infoPanel_$uuid" );
						$a_panel_entity->setAttribute( 'position', '0 0.2 -2' );

						$a_panel_entity->setAttribute( 'info-panel', "$uuid" );
						$a_panel_entity->setAttribute( 'visible', 'false' );
						$a_panel_entity->setAttribute( 'scale', '0.001 0.001 0.001' );

						$a_panel_entity->setAttribute( 'geometry', 'primitive: plane; width: 1.5; height: 1.8' );
						$a_panel_entity->setAttribute( 'material', 'color: #f1f2f6; shader: flat; depthTest: false; transparent: true' );
						$a_panel_entity->setAttribute( 'class', 'raycastable hideable ' );
						$a_panel_entity->setAttribute( 'original-scale', '0.001 0.001 0.001' );

						$a_main_img_entity = $dom->createElement( 'a-entity' );
						$a_main_img_entity->setAttribute( 'id', "top_img_$uuid" );
						$a_main_img_entity->setAttribute( 'material', "src: #main_img_$uuid" );
						$a_main_img_entity->setAttribute( 'visible', 'false' );
						$a_main_img_entity->setAttribute( 'original-scale', '1 1 1' );

						$a_title_img_entity = $dom->createElement( 'a-entity' );
						$a_title_img_entity->setAttribute( 'id', "title_$uuid" );

						$tit_font_path = $this->plugin_path_url . 'assets/fonts/Roboto-Black-msdf.json';
						$a_title_img_entity->setAttribute( 'text', "shader: msdf; wrapCount: 30; anchor: left; negate:false; width: 1.2; font: $tit_font_path; color: #2f3542;" );
						$a_title_img_entity->setAttribute( 'title_to_add', "$contentObject->poi_img_title" );
						$a_title_img_entity->setAttribute( 'class', 'hideable' );
						$a_title_img_entity->setAttribute( 'original-scale', '1 1 1' );

						$a_exit_img_entity = $dom->createElement( 'a-entity' );
						$a_exit_img_entity->setAttribute( 'id', "exit_$uuid" );
						$a_exit_img_entity->setAttribute( 'mixin', 'poiEsc' );
						$a_exit_img_entity->setAttribute( 'material', "src: #esc_img_$uuid; depthTest: false; transparent: true" );
						$a_exit_img_entity->setAttribute( 'class', 'raycastable hideable non-clickable' );
						$a_exit_img_entity->setAttribute( 'scale', '0.2 0.2 0.2' );
						$a_exit_img_entity->setAttribute( 'original-scale', '0.2 0.2 0.2' );

						$exit_desc_entity_panel = $dom->createElement( 'a-entity' );
						$exit_desc_entity_panel->setAttribute( 'id', "exit_panel_$uuid" );
						$exit_desc_entity_panel->setAttribute( 'mixin', 'poiEscFrame' );
						$exit_desc_entity_panel->setAttribute( 'scale', '1 1 1' );
						$exit_desc_entity_panel->setAttribute( 'original-scale', '1 1 1' );
						$exit_desc_entity_panel->setAttribute( 'class', 'raycastable hideable non-clickable' );

						$a_panel_entity->appendChild( $a_exit_img_entity );
						$a_panel_entity->appendChild( $exit_desc_entity_panel );
						$a_panel_entity->appendChild( $a_main_img_entity );
						$a_panel_entity->appendChild( $a_title_img_entity );

						if ( $contentObject->poi_img_content ) {
							$a_main_img_entity->setAttribute( 'mixin', 'poiImage' );
							$a_title_img_entity->setAttribute( 'position', '-0.68 -0.1 0' );

							$a_desc_img_entity = $dom->createElement( 'a-entity' );
							$a_desc_img_entity->setAttribute( 'id', "desc_$uuid" );
							$a_desc_img_entity->setAttribute( 'position', '-0.68 -0.3 0' );
							$desc_font_path = $this->plugin_path_url . 'assets/fonts/Roboto-Regular-msdf.json';
							$content_length = 90;

							if ( strlen( $contentObject->poi_img_content ) > $content_length ) {

								$next_desc_entity = $dom->createElement( 'a-entity' );
								$next_desc_entity->setAttribute( 'id', "next_$uuid" );
								$next_desc_entity->setAttribute( 'mixin', 'poiImgNext' );
								$next_desc_entity->setAttribute( 'material', "src: #right_img_$uuid; depthTest: false; transparent: true" );
								$next_desc_entity->setAttribute( 'class', 'raycastable hideable non-clickable' );
								$next_desc_entity->setAttribute( 'scale', '0.14 0.14 0.14' );
								$next_desc_entity->setAttribute( 'original-scale', '0.14 0.14 0.14' );

								$next_desc_entity_panel = $dom->createElement( 'a-entity' );
								$next_desc_entity_panel->setAttribute( 'id', "next_panel_$uuid" );
								$next_desc_entity_panel->setAttribute( 'mixin', 'poiImgNextFrame' );
								$next_desc_entity_panel->setAttribute( 'scale', '1 1 1' );
								$next_desc_entity_panel->setAttribute( 'original-scale', '1 1 1' );
								$next_desc_entity_panel->setAttribute( 'class', 'raycastable hideable non-clickable' );

								$a_panel_entity->appendChild( $next_desc_entity );
								$a_panel_entity->appendChild( $next_desc_entity_panel );

								$prev_desc_entity = $dom->createElement( 'a-entity' );
								$prev_desc_entity->setAttribute( 'id', "prev_$uuid" );
								$prev_desc_entity->setAttribute( 'mixin', 'poiImgPrev' );

								$prev_desc_entity->setAttribute( 'material', "src: #left_img_$uuid; depthTest: false; transparent: true" );
								$prev_desc_entity->setAttribute( 'class', 'raycastable hideable non-clickable' );
								$prev_desc_entity->setAttribute( 'scale', '0.14 0.14 0.14' );
								$prev_desc_entity->setAttribute( 'original-scale', '0.14 0.14 0.14' );

								$prev_desc_entity_panel = $dom->createElement( 'a-entity' );
								$prev_desc_entity_panel->setAttribute( 'id', "prev_panel_$uuid" );
								$prev_desc_entity_panel->setAttribute( 'mixin', 'poiImgPrevFrame' );
								$prev_desc_entity_panel->setAttribute( 'scale', '1 1 1' );
								$prev_desc_entity_panel->setAttribute( 'original-scale', '1 1 1' );
								$prev_desc_entity_panel->setAttribute( 'class', 'raycastable hideable non-clickable' );

								$a_panel_entity->appendChild( $prev_desc_entity );
								$a_panel_entity->appendChild( $prev_desc_entity_panel );

								$a_count_page_entity = $dom->createElement( 'a-entity' );
								$a_count_page_entity->setAttribute( 'id', "page_$uuid" );
								$a_count_page_entity->setAttribute( 'position', '0.35 -0.8 -0.1' );

								$a_count_page_entity->setAttribute( 'text', "baseline: top; wrapCount: 30; width: 0.8; shader: msdf; negate:false; anchor: left; font: $desc_font_path; color: #2f3542; value:" );
								$a_panel_entity->appendChild( $a_count_page_entity );
							}

							$a_desc_img_entity = $dom->createElement( 'a-entity' );
							$a_desc_img_entity->setAttribute( 'id', "desc_$uuid" );
							$a_desc_img_entity->setAttribute( 'position', '-0.68 -0.4 0' );

							$a_desc_img_entity->setAttribute( 'text', "baseline: top; wrapCount: 30; width: 1.2; shader: msdf; negate:false; anchor: left; font: $desc_font_path; color: #2f3542; value:" );
							$a_desc_img_entity->setAttribute( 'text_to_add', "$contentObject->poi_img_content" );
							$a_panel_entity->appendChild( $a_desc_img_entity );

						} else {
							$a_main_img_entity->setAttribute( 'mixin', 'poiImageFull' );
							$a_title_img_entity->setAttribute( 'position', '-0.68 -0.8 0' );
						}

						$ascenePlayer->appendChild( $a_panel_entity );

						break;

					case 'assessment':
						// Immerse connector integration: assessment anchors only compile inside
						// Immerse projects and render via a dedicated HTML overlay component.
						if ( $is_immerse_project ) {
							$this->append_immerse_assessment_entity( $dom, $ascene, $contentObject );
						}
						break;
				}
			}
		}

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

		$content = str_replace( 'AFRAME_CLEARCOLOR_PLACEHOLDER', $scene_json->metadata->ClearColor, $content );

		// Replace Fog string
		if ( isset( $scene_json->metadata->fogCategory ) && $scene_json->metadata->fogCategory !== '0' ) {
			if ( $scene_json->metadata->fogCategory === '1' ) {
				$fogtype = 'linear';
			} else {
				$fogtype = 'exponential';
			}

			$fogcolor = ltrim( $scene_json->metadata->fogcolor, '#' );

			$fog_attr = 'type: ' . $fogtype .
			            '; color: #' . $fogcolor .
			            '; far: ' . ( $scene_json->metadata->fogfar ?? '1000' ) .
			            '; density: ' . ( 1.5 * ( $scene_json->metadata->fogdensity ?? '0.00000001' ) ) .
			            '; near: ' . ( $scene_json->metadata->fognear ?? '0' );

			$content = str_replace( 'AFRAME_FOG_PLACEHOLDER', $fog_attr, $content );
		} else {
			$content = str_replace( 'AFRAME_FOG_PLACEHOLDER', ' ', $content );
		}

		// Create Basic dom structure for an aframe page
		$basicDomElements = $this->createBasicDomStructureAframeActor( $content, $scene_json );

		$dom     = $basicDomElements['dom'];
		$objects = $basicDomElements['objects'];

		$actionsDiv = $basicDomElements['actionsDiv'];

		$i = 0;
		foreach ( $objects as $contentObject ) {

			$cat_name = $contentObject->category_name ?? '';

			if ( $cat_name == 'pawn' ) {
				++$i;
				$buttonDiv = $dom->createElement( 'button' );

				$buttonDiv->setAttribute( 'id', 'screen-btn-' . $i );
				$buttonDiv->setAttribute( 'type', 'button' );
				$buttonDiv->setAttribute( 'class', 'positionalButtons' );

				$pos_x = $contentObject->position[0];
				$pos_y = $contentObject->position[1];
				$pos_z = $contentObject->position[2];

				$rot_x = $contentObject->rotation[0];
				$rot_y = $contentObject->rotation[1];
				$rot_z = $contentObject->rotation[2];

				$buttonDiv->setAttribute( 'data-position', '{"x":' . $pos_x . ',"y":' . $pos_y . ',"z":' . $pos_z . '}' );
				$buttonDiv->setAttribute( 'data-rotation', '{"x":' . $rot_x . ',"y":' . $rot_y . ',"z":' . $rot_z . '}' );

				$iconSpan = $dom->createElement( 'span' );
				$iconSpan->appendChild( $dom->createTextNode( 'room' ) );
				$iconSpan->setAttribute( 'class', 'material-icons' );

				$buttonDiv->appendChild( $iconSpan );

				$buttonDiv->appendChild( $dom->createTextNode( $i ) );
				$actionsDiv->appendChild( $buttonDiv );
			}
		}

		$contentNew = $dom->saveHTML( $dom->documentElement );

		// Write back to root
		return $this->writer( $this->plugin_path_dir . '/runtime/build/Simple_Client_' . $scene_id . '.html', $contentNew );
	}
}
