<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-vrodos-compiler-types.php';
require_once __DIR__ . '/class-vrodos-compiler-runtime-feature-flags.php';
require_once __DIR__ . '/class-vrodos-compiler-runtime-assets.php';
require_once __DIR__ . '/class-vrodos-compiler-template-renderer.php';
require_once __DIR__ . '/class-vrodos-compiler-scene-repository.php';
require_once __DIR__ . '/class-vrodos-compiler-scene-settings.php';
require_once __DIR__ . '/class-vrodos-compiler-aframe-entity-renderer.php';
require_once __DIR__ . '/class-vrodos-compiler-runtime-page-builder.php';
require_once __DIR__ . '/class-vrodos-compiler-runtime-script-planner.php';
require_once __DIR__ . '/class-vrodos-compiler-target-renderer.php';
require_once __DIR__ . '/class-vrodos-url-normalizer.php';
require_once __DIR__ . '/class-vrodos-render-runtime-manager.php';
require_once __DIR__ . '/class-vrodos-asset-optimization-manager.php';

/** Renders one immutable runtime target plan; the manager only orchestrates. */
final class VRodos_Compiler_Target_Assembler {
	private VRodos_Compiler_Runtime_Assets $runtime_assets;
	private VRodos_Compiler_Template_Renderer $template_renderer;
	private VRodos_Compiler_Scene_Repository $scene_repository;
	private VRodos_Compiler_Runtime_Script_Planner $runtime_script_planner;
	private VRodos_Compiler_AFrame_Entity_Renderer $entity_renderer;
	private VRodos_Compiler_Runtime_Page_Builder $runtime_page_builder;
	private VRodos_Compiler_Target_Renderer $target_renderer;
	private VRodos_URL_Normalizer $url_normalizer;
	private string $plugin_path_url;
	private string $website_root_host;

	public function __construct(
		VRodos_Compiler_Runtime_Assets $runtime_assets,
		VRodos_Compiler_Template_Renderer $template_renderer,
		VRodos_Compiler_Scene_Repository $scene_repository,
		VRodos_Compiler_Scene_Settings $scene_settings,
		VRodos_Compiler_Runtime_Script_Planner $runtime_script_planner,
		VRodos_URL_Normalizer $url_normalizer
	) {
		$this->runtime_assets          = $runtime_assets;
		$this->template_renderer       = $template_renderer;
		$this->scene_repository        = $scene_repository;
		$this->runtime_script_planner  = $runtime_script_planner;
		$this->url_normalizer          = $url_normalizer;
		$this->plugin_path_url         = $url_normalizer->normalize( VRodos_Path_Manager::plugin_url() );
		$this->website_root_host       = $url_normalizer->website_root_host();
		$this->target_renderer         = new VRodos_Compiler_Target_Renderer();
		$this->entity_renderer         = new VRodos_Compiler_AFrame_Entity_Renderer(
			$runtime_assets,
			$scene_repository,
			[ $url_normalizer, 'normalize' ]
		);
		$this->runtime_page_builder = new VRodos_Compiler_Runtime_Page_Builder(
			$runtime_assets,
			$template_renderer,
			$scene_settings,
			$this->entity_renderer,
			[ $url_normalizer, 'normalize' ],
			fn (): string => $this->build_gltf_decoder_config()
		);
	}

	public function render( VRodos_Runtime_Target_Plan $target, VRodos_Project_Compile_Plan $project ): void {
		$scene = $target->scene;
		$default_desktop_profile = (string) ( $scene->desktop_profiles['defaultProfile'] ?? 'high' );
		$adaptive_desktop = 'desktop' === $project->request->vr_runtime_profile
			&& 'adaptive' === (string) ( $scene->desktop_profiles['buildMode'] ?? 'adaptive' );
		$this->entity_renderer->configure(
			$this->plugin_path_url,
			$scene->hover_enabled,
			VRodos_Runtime_Target_Plan::MASTER === $target->kind && $adaptive_desktop,
			$default_desktop_profile
		);

		if ( VRodos_Runtime_Target_Plan::INDEX === $target->kind ) {
			// Preserve the established index heading contract: every index uses the first scene title.
			$this->create_index( $target, $project->project_title, $project->scenes[0]->title );
			return;
		}

		if ( VRodos_Runtime_Target_Plan::MASTER === $target->kind ) {
			$this->create_master(
				$target,
				$scene->title,
				$scene->scene_json,
				$project->request->show_pawn_positions_attr(),
				$project->request->project_id,
				$project->scene_ids(),
				$scene->settings,
				$scene->diagnostics
			);
			return;
		}

		$simple_settings = $scene->settings;
		if ( 'desktop' === $project->request->vr_runtime_profile ) {
			$simple_settings = (array) ( $scene->desktop_profiles['profiles'][ $default_desktop_profile ]['settings'] ?? $simple_settings );
		}
		$this->create_simple(
			$target,
			$scene->scene_json,
			$project->request->project_id,
			$project->request->show_pawn_positions_attr(),
			$simple_settings,
			$scene->diagnostics
		);
	}

	public function last_compile_diagnostics(): array {
		return $this->runtime_page_builder->last_compile_diagnostics();
	}

	private function is_networked( string $runtime_mode ): bool {
		return VRodos_Compiler_Runtime_Feature_Flags::RUNTIME_MODE_NETWORKED === $runtime_mode;
	}

	private function is_single_player( string $runtime_mode ): bool {
		return VRodos_Compiler_Runtime_Feature_Flags::RUNTIME_MODE_SINGLE_PLAYER === $runtime_mode;
	}

	private function avatar_camera_position( object $scene_json ): string {
		$position = $scene_json->objects->avatarCamera->position ?? [ 0, 1.6, 0 ];
		$position = array_values( is_array( $position ) ? $position : (array) $position );
		$values   = [];
		for ( $i = 0; $i < 3; $i++ ) {
			$value    = $position[ $i ] ?? ( 1 === $i ? 1.6 : 0 );
			$values[] = is_numeric( $value ) ? (string) (float) $value : (string) ( 1 === $i ? 1.6 : 0 );
		}
		return implode( ' ', $values );
	}

	private function create_master_dom( string $content, object $scene_json, int $project_id, int $scene_id, array $scene_ids ): array {
		$elements      = $this->runtime_page_builder->create_dom_structure( $content, $scene_json, 'master-client-body' );
		$dom           = $elements['dom'];
		$media_panel   = $dom->getElementById( 'mediaPanel' );
		$upload_button = $dom->getElementById( 'upload-recording-btn' );
		$is_virtual_production = 'virtualproduction_games' === $this->scene_repository->get_project_type_slug( $project_id );
		if ( $media_panel instanceof DOMElement ) {
			$media_panel->setAttribute( 'style', $is_virtual_production ? 'visibility: visible;' : 'visibility: hidden;' );
			if ( $is_virtual_production ) {
				$media_panel->setAttribute( 'data-vrodos-mediaverse-proxy', 'true' );
			}
		}
		if ( $upload_button instanceof DOMElement ) {
			$upload_button->setAttribute( 'style', $is_virtual_production ? 'visibility: visible;' : 'visibility: hidden;' );
		}

		$chat_wrapper = $dom->getElementById( 'chat-wrapper-el' );
		$chat_enabled = isset( $scene_json->metadata->enableGeneralChat ) && true === filter_var( $scene_json->metadata->enableGeneralChat, FILTER_VALIDATE_BOOLEAN );
		if ( $chat_wrapper instanceof DOMElement ) {
			$chat_wrapper->setAttribute( 'data-visible', $chat_enabled ? 'true' : 'false' );
			if ( isset( $scene_json->metadata->enableGeneralChat ) ) {
				$chat_wrapper->setAttribute( 'style', $chat_enabled ? 'visibility: visible' : 'display: none; visibility: hidden' );
			}
		}

		$is_base_scene = $dom->getElementById( 'is-base-scene-input' );
		if ( $is_base_scene instanceof DOMElement ) {
			$is_base_scene->setAttribute( 'value', min( $scene_ids ) === $scene_id ? 'true' : 'false' );
		}
		$elements['ascenePlayer'] = $dom->getElementById( 'player' );
		return $elements;
	}

	private function create_index( VRodos_Runtime_Target_Plan $target, string $project_title, string $scene_title ): void {
		$scene_id = $target->scene->scene_id;
		$content  = $this->template_renderer->read_runtime_template( $target->template );
		$content  = str_replace( 'Client.html', 'Client_' . $scene_id . '.html', $content );
		$content  = str_replace( 'project_sceneId', $project_title . ' - ' . $scene_title, $content );
		$content  = $this->runtime_assets->replace_placeholders( $content );
		$content  = str_replace( 'VRODOS_PLUGIN_URL_PLACEHOLDER', esc_url( $this->plugin_path_url ), $content );
		$this->template_renderer->write_runtime_artifact( $target->filename, $content );
	}

	private function create_master(
		VRodos_Runtime_Target_Plan $target,
		string $scene_title,
		object $scene_json,
		string $show_pawn_positions,
		int $project_id,
		array $scene_ids,
		array $settings,
		array $diagnostics
	): void {
		$scene_id        = $target->scene->scene_id;
		$runtime_mode    = $target->runtime_mode;
		$runtime_profile = (string) ( $settings['vrRuntimeProfile'] ?? 'desktop' );
		$adaptive_desktop = 'desktop' === $runtime_profile
			&& 'adaptive' === (string) ( $target->scene->desktop_profiles['buildMode'] ?? 'adaptive' );
		$lean_headset    = $this->is_single_player( $runtime_mode ) && 'headset' === $runtime_profile;
		$network_scripts = $this->is_networked( $runtime_mode )
			? '<script src="/socket.io/socket.io.js"></script>' . "\n    "
				. '<script src="/easyrtc/easyrtc.js"></script>' . "\n    "
				. '<script src="/dist/networked-aframe.js"></script>'
			: '';
		$extras_script = $lean_headset ? '' : '<script src="' . esc_url( $this->plugin_path_url . 'assets/vendor/aframe-extras/aframe-extras.min.js' ) . '"></script>';
		$environment_script = ! $lean_headset || $this->target_renderer->uses_legacy_environment_background( $settings )
			? '<script src="' . esc_url( $this->plugin_path_url . 'assets/vendor/aframe-environment/aframe-environment-component.min.js' ) . '"></script>'
			: '';

		$direct_runtime_loader = '<script src="' . esc_url( VRodos_Render_Runtime_Manager::get_aframe_runtime_url() ) . '"></script>' . "\n    " . $network_scripts . "\n    " . $extras_script . "\n    " . $environment_script;
		if ( 'desktop' === $runtime_profile && ! $adaptive_desktop ) {
			$custom_profile = (array) ( $target->scene->desktop_profiles['profiles']['custom'] ?? [] );
			$active_profile = wp_json_encode( array_merge( $custom_profile, [ 'id' => 'custom', 'source' => 'build-profile', 'reason' => 'custom-build' ] ), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES );
			if ( ! is_string( $active_profile ) ) {
				throw new RuntimeException( '[VRodos] Custom desktop profile diagnostics could not be encoded.' );
			}
			$direct_runtime_loader = '<script>window.VRODOS_ACTIVE_DESKTOP_PROFILE=' . $active_profile . ';</script>' . "\n    " . $direct_runtime_loader;
		}

		$content = $this->runtime_page_builder->prepare_template(
			$target->template,
			[
				'roomname'                                  => 'room' . $scene_id,
				'VRODOS_AFRAME_RUNTIME_SCRIPT_PLACEHOLDER'  => $adaptive_desktop
					? $this->render_desktop_adaptive_loader( $target, $network_scripts, $extras_script, $environment_script )
					: $direct_runtime_loader,
				'VRODOS_RUNTIME_MODE_PLACEHOLDER'           => esc_js( $runtime_mode ),
				'VRODOS_RUNTIME_SCRIPTS_PLACEHOLDER'        => $adaptive_desktop ? '' : $this->runtime_script_planner->render_scripts_for_chunk_ids( $target->chunk_ids ),
				'VRODOS_PLUGIN_URL_PLACEHOLDER'             => esc_js( $this->plugin_path_url ),
			]
		);
		$elements = $this->create_master_dom( $content, $scene_json, $project_id, $scene_id, $scene_ids );
		$dom      = $elements['dom'];
		$scene    = $elements['ascene'];
		$player   = $elements['ascenePlayer'];
		$project_type = $this->scene_repository->get_project_type_slug( $project_id );
		$title = $dom->getElementsByTagName( 'title' )->item( 0 );
		if ( $title ) {
			$title->nodeValue = $scene_title;
		}

		if ( $this->is_networked( $runtime_mode ) ) {
			$audio = 'vrexpo_games' === $project_type ? 'false' : 'true';
			$app   = 'vrexpo_games' === $project_type ? 'vrexpo' : 'vrodos';
			$scene->setAttribute( 'networked-scene', "app: $app; room: room$scene_id; debug: false; audio: $audio; adapter: easyrtc; serverURL: /; connectOnLoad: true; onConnect: connectionResolve;" );
			$this->target_renderer->apply_networking( $dom );
		} else {
			$scene->removeAttribute( 'networked-scene' );
		}

		$this->target_renderer->apply_player_rig( $dom, $player, $project_type, $this->avatar_camera_position( $scene_json ), $this->is_networked( $runtime_mode ), $lean_headset );
		$this->runtime_page_builder->apply_scene_core(
			$dom,
			$scene,
			$scene_json,
			$project_id,
			$scene_id,
			[
				'scene_loader'            => true,
				'resolved_scene_settings' => $settings,
				'compile_diagnostics'     => $diagnostics,
				'render_options'          => [ 'showPawnPositions' => $show_pawn_positions ],
			]
		);
		if ( $lean_headset ) {
			$compiled_settings = VRodos_Compiler_AFrame_DOM_Helper::parse_component_attribute( $scene->getAttribute( 'scene-settings' ) );
			$this->target_renderer->apply_lean_headset_mode( $scene, $compiled_settings );
		}
		if ( $this->is_single_player( $runtime_mode ) ) {
			$this->target_renderer->apply_single_player_mode( $dom, $scene );
		}
		$this->runtime_page_builder->write_dom( $dom, $target->filename, false, "<!-- Detected Hostname: {$this->website_root_host} -->\n" );
	}

	private function render_desktop_adaptive_loader( VRodos_Runtime_Target_Plan $target, string $network_scripts, string $extras_script, string $environment_script ): string {
		$profiles = (array) ( $target->scene->desktop_profiles['profiles'] ?? [] );
		$manifest = [
			'schemaVersion'        => 2,
			'buildMode'            => 'adaptive',
			'storageKey'           => (string) ( $target->scene->desktop_profiles['storageKey'] ?? 'vrodos.desktopQualityOverride.v1' ),
			'queryParameter'       => (string) ( $target->scene->desktop_profiles['queryParameter'] ?? 'vrodos_quality' ),
			'sessionDowngradeKey'  => (string) ( $target->scene->desktop_profiles['sessionDowngradeKey'] ?? 'vrodos.desktopQualityDowngrade.v1' ),
			'selection'            => (array) ( $target->scene->desktop_profiles['selection'] ?? [] ),
			'profiles'             => [],
			'loaders'              => [],
		];
		$aframe = '<script src="' . esc_url( VRodos_Render_Runtime_Manager::get_aframe_runtime_url() ) . '"></script>';
		$shared = implode( "\n", array_filter( [ $aframe, $network_scripts, $extras_script, $environment_script ] ) );

		$profile_ids = [ 'low', 'medium', 'high' ];
		foreach ( $profile_ids as $profile_id ) {
			$profile = (array) ( $profiles[ $profile_id ] ?? [] );
			$chunk_ids = (array) ( $profile['chunkIds'] ?? $target->chunk_ids );
			$runtime_scripts = $this->runtime_script_planner->render_scripts_for_chunk_ids( $chunk_ids );
			$runtime_scripts = $this->runtime_assets->redirect_runtime_template_urls( $runtime_scripts );
			$runtime_scripts = str_replace( 'VRODOS_PLUGIN_URL_PLACEHOLDER', $this->plugin_path_url, $runtime_scripts );
			$asset_summary = $this->desktop_profile_asset_summary( $target->scene->scene_json, $profile_id );
			$manifest['profiles'][ $profile_id ] = [
				'label'        => (string) ( $profile['label'] ?? ucfirst( $profile_id ) ),
				'presetState'  => (string) ( $profile['presetState'] ?? 'default' ),
				'settings'     => (array) ( $profile['settings'] ?? [] ),
				'assets'       => array_merge( (array) ( $profile['assets'] ?? [] ), $asset_summary ),
				'renderBudget' => (array) ( $profile['renderBudget'] ?? [] ),
				'chunkIds'     => $chunk_ids,
			];
			$manifest['loaders'][ $profile_id ] = $shared . "\n" . $runtime_scripts;
		}

		$capability_path = VRodos_Path_Manager::asset_path( 'js/runtime/master/vrodos_hardware_capabilities.js' );
		$capability_url = $this->runtime_assets->runtime_asset_url( 'js/runtime/master/vrodos_hardware_capabilities.js' );
		$version = is_file( $capability_path ) ? (string) filemtime( $capability_path ) : '1';
		$json = wp_json_encode( $manifest, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES );
		if ( ! is_string( $json ) ) {
			throw new RuntimeException( '[VRodos] Desktop performance profile manifest could not be encoded.' );
		}

		return '<script src="' . esc_url( $capability_url ) . '?ver=' . rawurlencode( $version ) . '"></script>' . "\n    "
			. '<script>window.VRODOSHardwareCapabilities.bootstrap(' . $json . ');</script>';
	}

	private function desktop_profile_asset_summary( object $scene_json, string $slot ): array {
		$asset_ids = [];
		$collect = function ( $value ) use ( &$collect, &$asset_ids ): void {
			if ( is_array( $value ) ) {
				foreach ( $value as $child ) {
					$collect( $child );
				}
				return;
			}
			if ( ! is_object( $value ) ) {
				return;
			}
			$asset_id = absint( $value->asset_id ?? 0 );
			if ( $asset_id && ( is_object( $value->desktop_profile_glb_urls ?? null ) || ! empty( $value->glb_path ) ) ) {
				$asset_ids[ $asset_id ] = true;
			}
			foreach ( get_object_vars( $value ) as $child ) {
				$collect( $child );
			}
		};
		$collect( $scene_json );
		$texture_bytes = 0;
		$package_bytes = 0;
		$texture_sizes = [];
		$protected_count = 0;
		foreach ( array_keys( $asset_ids ) as $asset_id ) {
			$info = VRodos_Asset_Optimization_Manager::desktop_profile_derivative_info( (int) $asset_id, $slot );
			$texture_bytes += (int) ( $info['estimatedTextureMemoryBytes'] ?? 0 );
			$package_bytes += (int) ( $info['derivativeSizeBytes'] ?? 0 );
			if ( ! empty( $info['textureMaxSize'] ) ) {
				$texture_sizes[] = (int) $info['textureMaxSize'];
			}
			if ( ! empty( $info['geometryProtected'] ) ) {
				++$protected_count;
			}
		}
		return [
			'derivativeCount'             => count( $asset_ids ),
			'estimatedTextureMemoryMiB'   => round( $texture_bytes / 1048576, 2 ),
			'derivativePackageSizeBytes'  => $package_bytes,
			'effectiveTextureMaxSize'     => $texture_sizes ? max( $texture_sizes ) : null,
			'geometryProtectedAssetCount' => $protected_count,
		];
	}

	private function create_simple(
		VRodos_Runtime_Target_Plan $target,
		object $scene_json,
		int $project_id,
		string $show_pawn_positions,
		array $settings,
		array $diagnostics
	): void {
		$scene_id     = $target->scene->scene_id;
		$project_type = $this->scene_repository->get_project_type_slug( $project_id );
		$content      = $this->runtime_page_builder->prepare_template(
			$target->template,
			[
				'appname'                            => 'vrexpo_games' === $project_type ? 'vrexpo' : 'vrodos',
				'roomname'                           => 'room' . $scene_id,
				'AFRAME_RUNTIME_URL_PLACEHOLDER'     => esc_url( VRodos_Render_Runtime_Manager::get_aframe_runtime_url() ),
				'VRODOS_RUNTIME_SCRIPTS_PLACEHOLDER' => $this->runtime_script_planner->render_scripts_for_chunk_ids( $target->chunk_ids ),
				'VRODOS_PLUGIN_URL_PLACEHOLDER'      => $this->plugin_path_url,
			]
		);
		$elements = $this->runtime_page_builder->create_dom_structure( $content, $scene_json, 'simple-client-body' );
		$dom      = $elements['dom'];
		$this->runtime_page_builder->apply_scene_core(
			$dom,
			$elements['ascene'],
			$scene_json,
			$project_id,
			$scene_id,
			[
				'resolved_scene_settings' => $settings,
				'compile_diagnostics'     => $diagnostics,
				'render_options'          => [ 'showPawnPositions' => $show_pawn_positions ],
			]
		);

		$index = 0;
		foreach ( $elements['objects'] as $object ) {
			if ( 'pawn' !== (string) ( $object->category_name ?? '' ) ) {
				continue;
			}
			++$index;
			$button = $dom->createElement( 'button' );
			$button->setAttribute( 'id', 'screen-btn-' . $index );
			$button->setAttribute( 'type', 'button' );
			$button->setAttribute( 'class', 'screen-position-btn tw-btn tw-btn-sm tw-min-h-0 tw-h-auto tw-justify-start tw-gap-2 tw-rounded-2xl tw-border-white/10 tw-bg-white/8 tw-px-3 tw-py-2 tw-font-semibold tw-text-white hover:tw-bg-white/14' );
			$button->setAttribute( 'aria-label', 'Go to position ' . $index );
			$button->setAttribute( 'data-position', '{"x":' . $object->position[0] . ',"y":' . $object->position[1] . ',"z":' . $object->position[2] . '}' );
			$button->setAttribute( 'data-rotation', '{"x":' . $object->rotation[0] . ',"y":' . $object->rotation[1] . ',"z":' . $object->rotation[2] . '}' );
			$icon = $dom->createElement( 'i' );
			$icon->setAttribute( 'data-lucide', 'map-pinned' );
			$icon->setAttribute( 'class', 'tw-h-4 tw-w-4 tw-shrink-0' );
			$icon->setAttribute( 'aria-hidden', 'true' );
			$label = $dom->createElement( 'span' );
			$label->setAttribute( 'class', 'tw-text-xs tw-font-semibold' );
			$label->appendChild( $dom->createTextNode( 'Position ' . $index ) );
			$button->appendChild( $icon );
			$button->appendChild( $label );
			$elements['actionsDiv']->appendChild( $button );
		}
		$this->runtime_page_builder->write_dom( $dom, $target->filename, true );
	}

	private function build_gltf_decoder_config(): string {
		$config = VRodos_Render_Runtime_Manager::get_config();
		return implode(
			' ',
			[
				'dracoDecoderPath: ' . $this->url_normalizer->normalize( (string) $config['three_draco_decoder_url'] ) . ';',
				'basisTranscoderPath: ' . $this->url_normalizer->normalize( (string) $config['three_basis_transcoder_url'] ) . ';',
				'meshoptDecoderPath: ' . $this->url_normalizer->normalize( (string) $config['three_meshopt_decoder_url'] ) . ';',
			]
		);
	}
}
