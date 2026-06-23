<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Compiler_Runtime_Page_Builder {
	private VRodos_Compiler_Runtime_Assets $runtime_assets;
	private VRodos_Compiler_Template_Renderer $template_renderer;
	private VRodos_Compiler_Scene_Settings $scene_settings;
	private VRodos_Compiler_AFrame_Entity_Renderer $entity_renderer;
	private $normalize_url;
	private $decoder_config;

	public function __construct(
		VRodos_Compiler_Runtime_Assets $runtime_assets,
		VRodos_Compiler_Template_Renderer $template_renderer,
		VRodos_Compiler_Scene_Settings $scene_settings,
		VRodos_Compiler_AFrame_Entity_Renderer $entity_renderer,
		callable $normalize_url,
		callable $decoder_config
	) {
		$this->runtime_assets    = $runtime_assets;
		$this->template_renderer = $template_renderer;
		$this->scene_settings    = $scene_settings;
		$this->entity_renderer   = $entity_renderer;
		$this->normalize_url     = $normalize_url;
		$this->decoder_config    = $decoder_config;
	}

	public function prepare_template( string $template, array $replacements ): string {
		$content = $this->template_renderer->read_runtime_template( $template );
		$replacements = array_merge(
			[
				'VRODOS_WEBXR_LAYER_SHIM_PLACEHOLDER' => $this->template_renderer->read_runtime_template( 'WebXR_Layer_Shim.html' ),
			],
			$replacements
		);
		foreach ( $replacements as $search => $replace ) {
			$content = str_replace( (string) $search, (string) $replace, $content );
		}

		return $this->runtime_assets->redirect_runtime_template_urls( $content );
	}

	public function create_dom_structure( string $content, $scene_json, string $body_id ): array {
		$dom                   = new DOMDocument( '1.0', 'UTF-8' );
		$dom->resolveExternals = true;
		@$dom->loadHTML( $content, LIBXML_HTML_NOIMPLIED | LIBXML_NOBLANKS | LIBXML_NOERROR );

		return [
			'dom'        => $dom,
			'html'       => $dom->documentElement,
			'body'       => $dom->getElementById( $body_id ),
			'ascene'     => $dom->getElementById( 'aframe-scene-container' ),
			'metadata'   => is_object( $scene_json->metadata ?? null ) ? $scene_json->metadata : new stdClass(),
			'objects'    => $scene_json->objects ?? [],
			'actionsDiv' => $dom->getElementById( 'actionsDiv' ),
		];
	}

	public function apply_scene_core( DOMDocument $dom, DOMElement $ascene, $scene_json, int $project_id, int $scene_id, array $options = [] ): DOMElement {
		$scene_settings = $this->scene_settings->apply( $dom, $ascene, $scene_json, $project_id, $this->normalize_url );
		$ascene->setAttribute( 'gltf-model', (string) call_user_func( $this->decoder_config ) );
		$this->apply_runtime_pipeline_components( $ascene, $scene_settings );

		if ( ! empty( $options['scene_loader'] ) ) {
			$ascene->setAttribute( 'vrodos-scene-loader', '' );
		}

		$a_asset        = $this->entity_renderer->get_or_create_assets_container( $dom, $ascene );
		$authored_world = $this->entity_renderer->get_or_create_authored_world_container( $dom, $ascene );
		$this->entity_renderer->render_scene_objects(
			$dom,
			$ascene,
			$a_asset,
			$scene_json->objects ?? [],
			$project_id,
			$scene_id,
			array_merge( (array) ( $options['render_options'] ?? [] ), [
				'scene_settings' => $scene_settings,
				'container'      => $authored_world,
			] )
		);

		$this->entity_renderer->markDelayedRevealEntities( $dom );
		$this->append_runtime_context_script( $dom, $project_id, $scene_id, $scene_json, $scene_settings );
		$this->append_compile_diagnostics_script( $dom, $this->entity_renderer->build_compile_diagnostics( $dom ) );

		return $a_asset;
	}

	private function apply_runtime_pipeline_components( DOMElement $ascene, array $scene_settings ): void {
		$managed_attributes = [ 'vrodos-render-profile', 'vrodos-postfx-router', 'vrodos-atmosphere', 'vrodos-reflections' ];
		$active_attributes  = $this->runtime_pipeline_components_for_settings( $scene_settings );

		foreach ( $managed_attributes as $attribute ) {
			if ( ! in_array( $attribute, $active_attributes, true ) && $ascene->hasAttribute( $attribute ) ) {
				$ascene->removeAttribute( $attribute );
			}
		}

		foreach ( $active_attributes as $attribute ) {
			if ( ! $ascene->hasAttribute( $attribute ) ) {
				$ascene->setAttribute( $attribute, '' );
			}
		}
	}

	private function runtime_pipeline_components_for_settings( array $scene_settings ): array {
		$profile = (string) ( $scene_settings['vrRuntimeProfile'] ?? 'desktop' );
		if ( 'headset' !== $profile ) {
			return [ 'vrodos-render-profile', 'vrodos-postfx-router', 'vrodos-atmosphere', 'vrodos-reflections' ];
		}

		$components = [ 'vrodos-render-profile' ];

		if (
			'pmndrs' === (string) ( $scene_settings['postFXEngine'] ?? 'legacy' ) &&
			$this->setting_bool( $scene_settings, 'pmndrsAtmosphereEnabled' )
		) {
			$components[] = 'vrodos-atmosphere';
		}

		$reflection_source = (string) ( $scene_settings['reflectionSource'] ?? 'hdr' );
		$env_map_preset    = (string) ( $scene_settings['envMapPreset'] ?? 'none' );
		if (
			$this->setting_bool( $scene_settings, 'reflectionsEnabled', true ) &&
			( 'hdr' === $reflection_source || 'none' !== $env_map_preset )
		) {
			$components[] = 'vrodos-reflections';
		}

		return $components;
	}

	private function setting_bool( array $settings, string $key, bool $default = false ): bool {
		if ( ! array_key_exists( $key, $settings ) ) {
			return $default;
		}

		$value = $settings[ $key ];
		if ( is_bool( $value ) ) {
			return $value;
		}

		$normalized = strtolower( trim( (string) $value ) );
		if ( '' === $normalized ) {
			return $default;
		}

		return ! in_array( $normalized, [ '0', 'false', 'no', 'off' ], true );
	}

	public function write_dom( DOMDocument $dom, string $filename, bool $document_element_only = false, string $prefix = '' ): string {
		$content = $document_element_only ? $dom->saveHTML( $dom->documentElement ) : $dom->saveHTML();
		return $this->template_renderer->write_runtime_build( $filename, $prefix . $content );
	}

	private function append_runtime_context_script( DOMDocument $dom, int $project_id, int $scene_id, $scene_json, array $scene_settings ): void {
		$context = [
			'projectId'  => absint( $project_id ),
			'sceneId'    => absint( $scene_id ),
			'sceneTitle' => (string) get_the_title( absint( $scene_id ) ),
		];

		$context = apply_filters( 'vrodos_compiled_runtime_context', $context, absint( $project_id ), absint( $scene_id ), $scene_json, $scene_settings );
		if ( ! is_array( $context ) || empty( $context ) ) {
			return;
		}

		$head = $dom->getElementsByTagName( 'head' )->item( 0 );
		if ( ! $head ) {
			return;
		}

		$json = wp_json_encode(
			$context,
			JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES
		);
		if ( ! is_string( $json ) || '' === $json ) {
			return;
		}

		$script = $dom->createElement( 'script' );
		$script->setAttribute( 'id', 'vrodos-runtime-context' );
		$script->appendChild(
			$dom->createTextNode(
				"(function () {\n" .
				"    var context = {$json};\n" .
				"    window.VRODOS_RUNTIME_CONTEXT = Object.assign({}, window.VRODOS_RUNTIME_CONTEXT || {}, context);\n" .
				"    if (context.immerseResults) {\n" .
				"        window.VRODOS_IMMERSE_RESULTS_CONFIG = context.immerseResults;\n" .
				"    }\n" .
				"}());"
			)
		);
		$runtime_script = null;
		foreach ( $head->getElementsByTagName( 'script' ) as $candidate ) {
			if ( ! $candidate instanceof DOMElement ) {
				continue;
			}
			$src = (string) $candidate->getAttribute( 'src' );
			if ( str_contains( $src, 'vrodos-runtime-' ) || str_contains( $src, '/assets/js/runtime/master/lib/' ) ) {
				$runtime_script = $candidate;
				break;
			}
		}

		if ( $runtime_script && $runtime_script->parentNode ) {
			$runtime_script->parentNode->insertBefore( $script, $runtime_script );
			return;
		}

		$head->appendChild( $script );
	}

	private function append_compile_diagnostics_script( DOMDocument $dom, array $diagnostics ): void {
		$body = $dom->getElementsByTagName( 'body' )->item( 0 );
		if ( ! $body ) {
			return;
		}

		$json = wp_json_encode(
			$diagnostics,
			JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES
		);
		if ( ! is_string( $json ) || '' === $json ) {
			return;
		}

		$script = $dom->createElement( 'script' );
		$script->setAttribute( 'id', 'vrodos-compile-diagnostics' );
		$script->appendChild(
			$dom->createTextNode(
				"(function () {\n" .
				"    var diagnostics = {$json};\n" .
				"    window.VRODOS_COMPILE_DIAGNOSTICS = diagnostics;\n" .
				"    if (diagnostics.warnings && diagnostics.warnings.length) {\n" .
				"        console.warn('[VRodos] Compile performance diagnostics', diagnostics);\n" .
				"    } else if (window.VRODOS_DEBUG && window.VRODOS_DEBUG.compileDiagnostics) {\n" .
				"        console.info('[VRodos] Compile performance diagnostics', diagnostics);\n" .
				"    }\n" .
				"}());"
			)
		);
		$body->appendChild( $script );
	}
}
