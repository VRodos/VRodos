<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Compiler_AFrame_Entity_Renderer {
	private VRodos_Compiler_Runtime_Assets $runtime_assets;
	private VRodos_Compiler_Scene_Repository $scene_repository;
	private $normalize_url;
	private string $plugin_path_url = '';
	private bool $isHoverEnabled = true;
	private array $diagnostic_asset_refs = [];
	private array $diagnostic_asset_entries = [];
	private array $diagnostic_warning_keys = [];
	private array $diagnostic_warnings = [];
	private array $diagnostic_notes = [];
	private array $diagnostic_category_counts = [];
	private int $diagnostic_object_count = 0;
	private int $diagnostic_collider_count = 0;

	public function __construct( VRodos_Compiler_Runtime_Assets $runtime_assets, VRodos_Compiler_Scene_Repository $scene_repository, callable $normalize_url ) {
		$this->runtime_assets   = $runtime_assets;
		$this->scene_repository = $scene_repository;
		$this->normalize_url    = $normalize_url;
	}

	public function configure( string $plugin_path_url, bool $is_hover_enabled ): void {
		$this->plugin_path_url = $plugin_path_url;
		$this->isHoverEnabled = $is_hover_enabled;
	}

	public function reset_compile_diagnostics(): void {
		$this->diagnostic_asset_refs      = [];
		$this->diagnostic_asset_entries   = [];
		$this->diagnostic_warning_keys    = [];
		$this->diagnostic_warnings        = [];
		$this->diagnostic_notes           = [];
		$this->diagnostic_category_counts = [];
		$this->diagnostic_object_count    = 0;
		$this->diagnostic_collider_count  = 0;
	}

	private function normalize_url( $url ) {
		return call_user_func( $this->normalize_url, $url );
	}

	private function runtime_image_url( string $relative ): string {
		return $this->runtime_assets->runtime_image_url( $relative );
	}

	private function track_runtime_asset( string $type, string $url, string $context ): void {
		$url = trim( $url );
		if ( '' === $url ) {
			return;
		}

		$key = $type . '|' . $url;
		if ( ! isset( $this->diagnostic_asset_refs[ $key ] ) ) {
			$this->diagnostic_asset_refs[ $key ] = [
				'type'     => $type,
				'url'      => $url,
				'contexts' => [],
			];
		}
		$this->diagnostic_asset_refs[ $key ]['contexts'][] = $context;

		if ( isset( $this->diagnostic_asset_entries[ $key ] ) ) {
			return;
		}

		$size = $this->resolve_local_asset_size( $url );
		$this->diagnostic_asset_entries[ $key ] = [
			'type'      => $type,
			'url'       => $url,
			'sizeBytes' => $size,
			'sizeLabel' => null !== $size ? $this->format_bytes( $size ) : null,
		];

		$this->maybe_add_asset_size_warning( $type, $url, $size, $context );
	}

	private function resolve_local_asset_size( string $url ): ?int {
		$path = wp_parse_url( $url, PHP_URL_PATH );
		if ( ! is_string( $path ) || '' === $path ) {
			return null;
		}

		$path       = rawurldecode( $path );
		$candidates = [];
		if ( defined( 'ABSPATH' ) ) {
			$candidates[] = trailingslashit( ABSPATH ) . ltrim( $path, '/\\' );
			$home_path    = wp_parse_url( home_url( '/' ), PHP_URL_PATH );
			if ( is_string( $home_path ) && '' !== $home_path && 0 === strpos( $path, $home_path ) ) {
				$candidates[] = trailingslashit( ABSPATH ) . ltrim( substr( $path, strlen( $home_path ) ), '/\\' );
			}
		}

		foreach ( array_unique( $candidates ) as $candidate ) {
			if ( is_file( $candidate ) && is_readable( $candidate ) ) {
				$size = filesize( $candidate );
				return false === $size ? null : (int) $size;
			}
		}

		return null;
	}

	private function maybe_add_asset_size_warning( string $type, string $url, ?int $size, string $context ): void {
		if ( null === $size ) {
			return;
		}

		$is_model = in_array( $type, [ 'gltf', 'gltf-inline', 'audio-model' ], true );
		$is_image = in_array( $type, [ 'image', 'video-poster', 'poi-image' ], true );
		$limit = $is_model ? 20 * 1024 * 1024 : ( $is_image ? 2 * 1024 * 1024 : 0 );
		if ( $limit <= 0 || $size <= $limit ) {
			return;
		}

		$this->add_diagnostic_warning(
			'large-asset|' . $type . '|' . $url,
			sprintf(
				'Large %s asset (%s) in %s: %s. Consider mesh/texture optimization, Meshopt/Draco where appropriate, and KTX2 texture compression.',
				$type,
				$this->format_bytes( $size ),
				$context,
				$url
			)
		);
	}

	private function is_image_texture_url( string $url ): bool {
		$url = trim( $url );
		if ( '' === $url ) {
			return false;
		}

		$lower_url = strtolower( $url );
		if ( str_starts_with( $lower_url, 'data:image/' ) ) {
			return true;
		}
		if ( str_starts_with( $lower_url, 'data:' ) ) {
			return false;
		}

		$path = wp_parse_url( $url, PHP_URL_PATH );
		if ( ! is_string( $path ) || '' === $path ) {
			$path = $url;
		}

		$path = rawurldecode( $path );
		$type = wp_check_filetype( $path );
		$mime = (string) ( $type['type'] ?? '' );
		if ( str_starts_with( strtolower( $mime ), 'image/' ) ) {
			return true;
		}

		return in_array(
			strtolower( pathinfo( $path, PATHINFO_EXTENSION ) ),
			[ 'jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp', 'svg' ],
			true
		);
	}

	private function resolve_video_poster_url( $obj, string $uuid ): string {
		$context    = 'video:' . ( '' !== $uuid ? $uuid : 'unnamed' );
		$poster_url = $this->normalize_url( (string) ( $obj->screenshot_path ?? '' ) );

		if ( '' !== $poster_url && ! $this->is_image_texture_url( $poster_url ) ) {
			$this->add_diagnostic_warning(
				'invalid-video-poster|' . $context . '|' . $poster_url,
				sprintf(
					'Skipped video poster for %s because the URL is not an image texture: %s.',
					$context,
					$poster_url
				)
			);
			$poster_url = '';
		}

		if ( '' !== $poster_url || empty( $obj->asset_id ) ) {
			return $poster_url;
		}

		$wp_thumb = get_the_post_thumbnail_url( (int) $obj->asset_id, 'full' );
		if ( $wp_thumb ) {
			$thumbnail_url = $this->normalize_url( $wp_thumb );
			if ( $this->is_image_texture_url( $thumbnail_url ) ) {
				return $thumbnail_url;
			}
		}

		$immerse_url = (string) get_post_meta( (int) $obj->asset_id, '_immerse_original_url', true );
		if ( '' !== trim( $immerse_url ) ) {
			$immerse_url = $this->normalize_url( $immerse_url );
			if ( $this->is_image_texture_url( $immerse_url ) ) {
				return $immerse_url;
			}
		}

		return '';
	}

	private function add_diagnostic_warning( string $key, string $message ): void {
		if ( isset( $this->diagnostic_warning_keys[ $key ] ) ) {
			return;
		}

		$this->diagnostic_warning_keys[ $key ] = true;
		$this->diagnostic_warnings[]          = $message;
	}

	private function format_bytes( int $bytes ): string {
		if ( $bytes >= 1024 * 1024 ) {
			return round( $bytes / ( 1024 * 1024 ), 1 ) . ' MB';
		}

		if ( $bytes >= 1024 ) {
			return round( $bytes / 1024, 1 ) . ' KB';
		}

		return $bytes . ' B';
	}

	public function build_compile_diagnostics( DOMDocument $dom ): array {
		foreach ( $this->diagnostic_asset_refs as $asset ) {
			$type = $asset['type'];
			if ( ! in_array( $type, [ 'gltf', 'gltf-inline', 'audio-model', 'image', 'poi-image', 'video-poster' ], true ) ) {
				continue;
			}

			$contexts = array_values( array_unique( $asset['contexts'] ) );
			if ( count( $contexts ) > 1 ) {
				$this->add_diagnostic_warning(
					'duplicate-asset|' . $type . '|' . $asset['url'],
					sprintf(
						'Duplicate %s asset URL is referenced %d times: %s.',
						$type,
						count( $contexts ),
						$asset['url']
					)
				);
			}
		}

		$xpath = new DOMXPath( $dom );
		$metrics = [
			'objects'              => $this->diagnostic_object_count,
			'categories'           => $this->diagnostic_category_counts,
			'gltfModelElements'    => $xpath->query( '//*[@gltf-model]' )->length,
			'assetItems'           => $dom->getElementsByTagName( 'a-asset-item' )->length,
			'images'               => $dom->getElementsByTagName( 'img' )->length,
			'videos'               => $dom->getElementsByTagName( 'video' )->length,
			'raycastableElements'  => $xpath->query( '//*[contains(concat(" ", normalize-space(@class), " "), " raycastable ")]' )->length,
			'shadowAttributes'     => $xpath->query( '//*[@shadow]' )->length,
			'shadowRoleAttributes' => $xpath->query( '//*[@data-vrodos-shadow-role]' )->length,
			'clearFrustumElements' => $xpath->query( '//*[@clear-frustum-culling]' )->length,
			'playerColliders'      => $this->diagnostic_collider_count,
		];

		if ( $metrics['clearFrustumElements'] > 0 ) {
			$this->diagnostic_notes[] = sprintf(
				'%d entities use clear-frustum-culling. It no longer forces shadow participation; runtime lighting profiles decide cast/receive shadows.',
				$metrics['clearFrustumElements']
			);
		}

		if ( $metrics['gltfModelElements'] > 8 || $metrics['assetItems'] > 8 ) {
			$this->diagnostic_notes[] = 'Scene has many GLTF/model entries. Compare profiler draw calls and consider asset merging or instancing for repeated static props.';
		}

		return [
			'schemaVersion' => 1,
			'metrics'       => $metrics,
			'assets'        => array_values( $this->diagnostic_asset_entries ),
			'warnings'      => $this->diagnostic_warnings,
			'notes'         => array_values( array_unique( $this->diagnostic_notes ) ),
		];
	}

	private function is_immerse_project( int $project_id ): bool {
		return $this->scene_repository->is_immerse_project( $project_id );
	}
	private function sanitize_text_attr( $value ): string {
		$value = (string) ( $value ?? '' );
		$value = $this->decode_display_text( $value );
		$value = wp_strip_all_tags( $value );
		$value = str_replace( [ "\r", "\n", ';' ], [ ' ', ' ', ',' ], $value );
		return trim( $value );
	}

	private function sanitize_multiline_text_attr( $value ): string {
		$value = (string) ( $value ?? '' );
		$value = $this->decode_display_text( $value );
		$value = wp_strip_all_tags( $value );
		$value = str_replace( [ "\r\n", "\r" ], "\n", $value );
		$value = preg_replace( "/[ \t]+/", ' ', $value ) ?? $value;
		$value = preg_replace( "/\n{3,}/", "\n\n", $value ) ?? $value;
		$value = str_replace( ';', ',', $value );
		$value = trim( $value );

		if ( function_exists( 'mb_substr' ) ) {
			return mb_substr( $value, 0, 2000 );
		}

		return substr( $value, 0, 2000 );
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
			'url(' . $this->normalize_url( VRodos_Path_Manager::model_url( 'runtime/assessment.glb' ) ) . ')'
		);
		$model->setAttribute( 'rotation', '-90 0 0' );
		$model->setAttribute( 'class', 'raycastable hideable non-vr' );
		$this->apply_compiled_collision_attributes( $model, $contentObject, 'assessment-model' );
		if ( $this->isHoverEnabled ) {
			$model->setAttribute( 'vrodos-hypnotic-hover', '' );
		}
		$model->setAttribute( 'immerse-assessment-launcher', '' );
		$this->set_world_lighting_attributes( $model );
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

	public function markDelayedRevealEntities( DOMDocument $dom ) {
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

	private function setAffineTransformations( $entity, $contentObject, bool $preserve_editor_rotation = false ) {
		$entity->setAttribute( 'position', implode( ' ', $contentObject->position ) );
		$rotation = $preserve_editor_rotation
			? [ 180 / pi() * $contentObject->rotation[0], 180 / pi() * $contentObject->rotation[1], 180 / pi() * $contentObject->rotation[2] ]
			: [ - 180 / pi() * $contentObject->rotation[0], 180 / pi() * $contentObject->rotation[1], 180 / pi() * $contentObject->rotation[2] ];
		$entity->setAttribute(
			'rotation',
			implode( ' ', $rotation )
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

	private function normalize_shadow_role( string $role ): string {
		return in_array( $role, [ 'caster-receiver', 'receiver', 'none' ], true ) ? $role : 'caster-receiver';
	}

	private function shadow_attribute_for_role( string $role ): string {
		switch ( $this->normalize_shadow_role( $role ) ) {
			case 'receiver':
				return 'cast: false; receive: true';
			case 'none':
				return 'cast: false; receive: false';
			default:
				return 'cast: true; receive: true';
		}
	}

	private function set_world_lighting_attributes( DOMElement $entity, string $shadow_role = 'caster-receiver' ): void {
		$shadow_role = $this->normalize_shadow_role( $shadow_role );
		$entity->setAttribute( 'data-vrodos-world-lighting', 'true' );
		$entity->setAttribute( 'data-vrodos-shadow-role', $shadow_role );
		$entity->setAttribute( 'shadow', $this->shadow_attribute_for_role( $shadow_role ) );
	}

	private function set_overlay_ui_attributes( DOMElement $entity ): void {
		$entity->setAttribute( 'data-vrodos-overlay-ui', 'true' );
	}

	private function world_media_material( string $src, string $side = 'double', bool $transparent = true ): string {
		$material = "src: $src; side: $side; roughness: 0.85; metalness: 0; depthTest: true; depthWrite: true";
		if ( $transparent ) {
			$material .= '; transparent: true; alphaTest: 0.5';
		}
		return $material;
	}

	private function is_compiled_collision_enabled( $obj ): bool {
		if ( is_object( $obj ) && property_exists( $obj, 'compiledCollisionEnabled' ) ) {
			$value = $obj->compiledCollisionEnabled;
			if ( is_bool( $value ) ) {
				return $value;
			}

			$normalized = strtolower( trim( (string) $value ) );
			return ! in_array( $normalized, [ '0', 'false', 'no', 'off' ], true );
		}

		return true;
	}

	private function append_class( DOMElement $entity, string $class_name ): void {
		$class_name = trim( $class_name );
		if ( '' === $class_name ) {
			return;
		}

		$current = preg_split( '/\s+/', trim( $entity->getAttribute( 'class' ) ) ) ?: [];
		if ( ! in_array( $class_name, $current, true ) ) {
			$current[] = $class_name;
		}

		$entity->setAttribute( 'class', trim( implode( ' ', array_filter( $current ) ) ) );
	}

	private function apply_compiled_collision_attributes( DOMElement $entity, $obj, string $source = 'mesh' ): void {
		if ( ! $this->is_compiled_collision_enabled( $obj ) ) {
			return;
		}

		$category = sanitize_title( (string) ( $obj->category_slug ?? $obj->category_name ?? '' ) );
		$uuid     = $this->sanitize_text_attr( (string) ( $obj->uuid ?? $obj->name ?? '' ) );
		$role     = 'walkable-surface' === $category ? 'navmesh' : 'solid';

		$this->append_class( $entity, 'vrodos-collider' );
		$entity->setAttribute( 'data-vrodos-collider', 'true' );
		$entity->setAttribute( 'data-vrodos-collision-source', $source );
		$entity->setAttribute( 'data-vrodos-collision-role', $role );
		if ( '' !== $category ) {
			$entity->setAttribute( 'data-vrodos-collision-category', $category );
		}
		if ( '' !== $uuid ) {
			$entity->setAttribute( 'data-vrodos-collision-object', $uuid );
		}

		if ( in_array( $category, [ 'collision-proxy', 'blocking-obstacles' ], true ) ) {
			$entity->setAttribute( 'data-vrodos-collision-hidden', 'true' );
			$entity->setAttribute( 'data-vrodos-shadow-role', 'none' );
			$entity->setAttribute( 'shadow', $this->shadow_attribute_for_role( 'none' ) );
			$entity->setAttribute( 'vrodos-collider-helper', '' );
		}

		$this->diagnostic_collider_count++;
	}


	private function includeDoorFunctionality( $a_entity, $door_link ) {
		// Use a relative path for the baked HTML door link so it works across IPs/localhost without CORS.
		$a_entity->setAttribute( 'door-listener', "Master_Client_{$door_link}.html" );
	}


	/**
	 * Asset Registry Helper
	 */
	public function get_or_create_assets_container( $dom, $ascene ) {
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
	public function render_scene_objects( $dom, $ascene, $assets, $objects, $project_id, $scene_id, $config = [] ) {
		$this->reset_compile_diagnostics();
		foreach ( $objects as $object_key => $obj ) {
			if ( is_object( $obj ) ) {
				unset( $obj->follow_camera, $obj->follow_camera_x, $obj->follow_camera_z );

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
		$this->diagnostic_object_count++;
		$this->diagnostic_category_counts[ $cat ] = ( $this->diagnostic_category_counts[ $cat ] ?? 0 ) + 1;

		switch ( $cat ) {
			case 'lightSun':
			case 'lightSpot':
			case 'lightLamp':
			case 'lightAmbient':
				$this->render_light_entity( $dom, $ascene, $obj );
				break;
			case 'decoration':
			case 'walkable-surface':
			case 'collision-proxy':
			case 'blocking-obstacles':
			case 'door':
			case 'poi-link':
			case 'chat':
			case 'poi-chat':
				$this->render_gltf_entity( $dom, $ascene, $assets, $obj, (int) ($config['scene_id'] ?? 0) );
				break;
			case 'audio':
				$this->render_audio_entity( $dom, $ascene, $assets, $obj );
				break;
			case 'image':
			case 'video':
				$this->render_media_entity( $dom, $ascene, $assets, $obj );
				break;
			case '3d-text':
				$this->render_3d_text_entity( $dom, $ascene, $obj );
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
			$pawn->setAttribute( 'gltf-model', 'url(' . $this->normalize_url( VRodos_Path_Manager::model_url( 'editor/pawn.glb' ) ) . ')' );
			$this->setAffineTransformations( $pawn, $obj );
			$ascene->appendChild( $pawn );
		}
	}

	private function render_3d_text_entity( DOMDocument $dom, DOMElement $ascene, $obj ): void {
		$uuid = $obj->uuid ?? wp_generate_uuid4();
		$text = $this->sanitize_multiline_text_attr( $obj->text_content ?? $obj->asset_name ?? 'Text asset' );
		if ( $text === '' ) {
			return;
		}

		$panel_width  = '1.25';
		$panel_height = '1.77';
		$panel_depth  = '0.035';

		$entity = $dom->createElement( 'a-entity' );
		$entity->setAttribute( 'id', 'text-panel_' . $uuid );
		$entity->setAttribute( 'class', 'hideable' );
		$this->apply_compiled_collision_attributes( $entity, $obj, 'text-panel' );
		$entity->setAttribute( 'clear-frustum-culling', '' );
		$this->set_world_lighting_attributes( $entity );
		$this->setAffineTransformations( $entity, $obj );
		$this->apply_immerse_cefr_gating_attributes( $entity, $obj );

		$backing = $dom->createElement( 'a-box' );
		$backing->setAttribute( 'width', $panel_width );
		$backing->setAttribute( 'height', $panel_height );
		$backing->setAttribute( 'depth', $panel_depth );
		$backing->setAttribute( 'material', 'color: #faf7ef; roughness: 0.78; metalness: 0' );
		$backing->setAttribute( 'position', '0 0 0' );
		$this->set_world_lighting_attributes( $backing );

		$border_material = 'color: #1f2937; opacity: 0.45; transparent: true; roughness: 0.9; metalness: 0';
		$border_specs    = [
			[ '1.18', '0.008', '0.006', '0 0.84 0.021' ],
			[ '1.18', '0.008', '0.006', '0 -0.84 0.021' ],
			[ '0.008', '1.68', '0.006', '-0.59 0 0.021' ],
			[ '0.008', '1.68', '0.006', '0.59 0 0.021' ],
		];
		$border_elements  = [];
		foreach ( $border_specs as $border_spec ) {
			$border = $dom->createElement( 'a-box' );
			$border->setAttribute( 'width', $border_spec[0] );
			$border->setAttribute( 'height', $border_spec[1] );
			$border->setAttribute( 'depth', $border_spec[2] );
			$border->setAttribute( 'position', $border_spec[3] );
			$border->setAttribute( 'material', $border_material );
			$border_elements[] = $border;
		}

		$label = $dom->createElement( 'a-text' );
		$label->setAttribute( 'value', $text );
		$label->setAttribute( 'color', '#111827' );
		$label->setAttribute( 'align', 'left' );
		$label->setAttribute( 'anchor', 'left' );
		$label->setAttribute( 'baseline', 'top' );
		$label->setAttribute( 'wrap-count', '28' );
		$label->setAttribute( 'width', '1.08' );
		$label->setAttribute( 'position', '-0.54 0.71 0.026' );
		$label->setAttribute( 'material', 'side: double; transparent: true' );

		$entity->appendChild( $backing );
		foreach ( $border_elements as $border ) {
			$entity->appendChild( $border );
		}
		$entity->appendChild( $label );
		$ascene->appendChild( $entity );
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

	private function render_gltf_entity( $dom, $ascene, $assets, $obj, $scene_id = 0 ) {
		$uuid = $obj->uuid ?? '';
		$cat  = $obj->category_slug ?? '';
		$context = $cat . ':' . ( $uuid !== '' ? $uuid : (string) ( $obj->name ?? 'unnamed' ) );

		$glb_resolution = $this->resolve_compiled_gltf_asset_url( $obj, (string) ( $obj->glb_path ?? '' ) );
		$glb_url        = $this->normalize_url( $glb_resolution['url'] );

		if ( $uuid === '' || $glb_url === '' ) {
			$this->add_diagnostic_warning(
				'missing-gltf|' . $context,
				sprintf(
					'Skipped %s because it has no compiled GLB source. Re-select or remove the asset in the scene editor.',
					$context
				)
			);
			return;
		}

		// Add to assets
		$asset_item = $dom->createElement( 'a-asset-item' );
		$asset_item->setAttribute( 'id', $uuid );
		$asset_item->setAttribute( 'src', $glb_url );
		$asset_item->setAttribute( 'response-type', 'arraybuffer' );
		$asset_item->setAttribute( 'crossorigin', 'anonymous' );
		$assets->appendChild( $asset_item );
		$this->track_runtime_asset( 'gltf', $glb_url, $context );
		$this->track_gltf_derivative_usage( $glb_resolution, $obj, $context );

		// Create entity
		$entity = $dom->createElement( 'a-entity' );
		$entity->setAttribute( 'gltf-model', '#' . $uuid );

		$sc_x = $obj->scale[0] ?? 1;
		$sc_y = $obj->scale[1] ?? 1;
		$sc_z = $obj->scale[2] ?? 1;
		$entity->setAttribute( 'original-scale', "$sc_x $sc_y $sc_z" );

		$this->setAffineTransformations( $entity, $obj, true );

		$is_collision_proxy = in_array( $cat, [ 'collision-proxy', 'blocking-obstacles' ], true );
		$class = $is_collision_proxy ? 'override-materials' : 'override-materials hideable';
		$shadow_role = $is_collision_proxy ? 'none' : 'caster-receiver';

		if ( $cat === 'walkable-surface' ) {
			$shadow_role = 'receiver';
			$class .= ' vrodos-navmesh';
			$walk_behavior = ( isset( $obj->walkableBehavior ) && 'auto' === strtolower( (string) $obj->walkableBehavior ) ) ? 'auto' : 'precise';
			$entity->setAttribute( 'data-vrodos-navmesh', 'true' );
			$entity->setAttribute( 'data-vrodos-shadow-receiver-only', 'true' );
			$entity->setAttribute( 'data-vrodos-walk-behavior', $walk_behavior );
		} elseif ( $cat === 'door' ) {
			$class .= ' raycastable';
			$entity->setAttribute( 'id', "entity_$uuid" );
			$entity->setAttribute( 'highlight', "entity_$uuid" );
			if ( $this->isHoverEnabled ) {
				$entity->setAttribute( 'vrodos-door-indicator', '' );
			}
			if ( ! empty( $obj->sceneID_target ) ) {
				$this->includeDoorFunctionality( $entity, $obj->sceneID_target );
			}
		} elseif ( $cat === 'poi-link' ) {
			$class .= ' raycastable';
			$entity->setAttribute( 'link-listener', (string) ($obj->poi_link_url ?? '') );
			$entity->setAttribute( 'highlight', $uuid );
			if ( $this->isHoverEnabled ) {
				$entity->setAttribute( 'vrodos-hypnotic-hover', '' );
			}
		} elseif ( $cat === 'chat' || $cat === 'poi-chat' ) {
			// Help Chat POI
			$class .= ' raycastable';
			$entity->setAttribute( 'id', "entity_$uuid" );
			$entity->setAttribute( 'highlight', "entity_$uuid" );

			// Unify properties using fallback chain
			$chat_title = $this->sanitize_text_attr( $obj->poi_chat_title ?? $obj->poi_help_title ?? 'Help' );
			$chat_participants = $obj->poi_chat_participants ?? $obj->poi_help_max_participants ?? '2';
			$chat_indicators = $obj->poi_chat_indicators ?? 'false';

			$entity->setAttribute( 'title', $chat_title );
			$entity->setAttribute( 'chat-poi', "scene_id: " . ($obj->sceneID_target ?? $scene_id) . "; num_participants: " . $chat_participants );

			// Add availability indicator logic if enabled
			if ( filter_var( $chat_indicators, FILTER_VALIDATE_BOOLEAN ) ) {
				$entity->setAttribute( 'indicator-availability', "num_participants: " . $chat_participants );
				$entity->setAttribute( 'poi_chat_indicators', 'true' );
			}

			if ( $this->isHoverEnabled ) {
				$entity->setAttribute( 'vrodos-hypnotic-hover', '' );
			}
		}

		$material = '';
		$this->setMaterial( $material, $obj );
		$entity->setAttribute( 'material', $material );
		$entity->setAttribute( 'class', $class );
		$this->apply_compiled_collision_attributes( $entity, $obj, 'gltf' );
		$entity->setAttribute( 'clear-frustum-culling', '' );
		$this->set_world_lighting_attributes( $entity, $shadow_role );
		$this->apply_immerse_cefr_gating_attributes( $entity, $obj );

		$ascene->appendChild( $entity );
	}

	private function resolve_compiled_gltf_asset_url( $obj, string $source_url ): array {
		$result = [
			'url'        => $source_url,
			'derivative' => null,
		];

		if ( empty( $obj->asset_id ) || ! class_exists( 'VRodos_Asset_Optimization_Manager' ) ) {
			return $result;
		}

		$resolved = VRodos_Asset_Optimization_Manager::resolve_compiled_glb_asset( absint( $obj->asset_id ), $source_url );
		if ( is_array( $resolved ) && ! empty( $resolved['url'] ) ) {
			return $resolved;
		}

		return $result;
	}

	private function track_gltf_derivative_usage( array $resolution, $obj, string $context ): void {
		if ( empty( $resolution['derivative'] ) || ! is_array( $resolution['derivative'] ) ) {
			return;
		}

		$derivative = $resolution['derivative'];
		$asset_id   = ! empty( $obj->asset_id ) ? absint( $obj->asset_id ) : 0;
		$profile    = (string) ( $derivative['profile'] ?? 'optimized' );
		$saved      = ! empty( $derivative['reductionBytes'] ) ? $this->format_bytes( (int) $derivative['reductionBytes'] ) : 'unknown size';

		$this->diagnostic_notes[] = sprintf(
			'Using %s GLB derivative for asset %d in %s (%s saved).',
			$profile,
			$asset_id,
			$context,
			$saved
		);
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
		$this->track_runtime_asset( 'audio-model', $glb_path, 'audio:' . $uuid );

		$audio_asset_id = 'audio_src_' . $uuid;
		$audio_asset = $dom->createElement( 'audio' );
		$audio_asset->setAttribute( 'id', $audio_asset_id );
		$audio_asset->setAttribute( 'src', $audio_path );
		$audio_asset->setAttribute( 'preload', 'auto' );
		$audio_asset->setAttribute( 'crossorigin', 'anonymous' );
		$assets->appendChild( $audio_asset );
		$this->track_runtime_asset( 'audio', $audio_path, 'audio:' . $uuid );

		$entity = $dom->createElement( 'a-entity' );
		$entity->setAttribute( 'id', 'audio_entity_' . $uuid );
		$entity->setAttribute( 'gltf-model', '#' . $uuid );
		$entity->setAttribute( 'clear-frustum-culling', '' );
		$this->set_world_lighting_attributes( $entity );
		$entity->setAttribute( 'material', '' );
		$entity->setAttribute( 'original-scale', implode( ' ', [
			(float) ( $obj->scale[0] ?? 1 ),
			(float) ( $obj->scale[1] ?? 1 ),
			(float) ( $obj->scale[2] ?? 1 ),
		] ) );
		$this->setAffineTransformations( $entity, $obj, true );

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
			if ( $this->isHoverEnabled ) {
				$entity->setAttribute( 'vrodos-hypnotic-hover', '' );
			}
		}

		$entity->setAttribute( 'class', $entity_class );
		$this->apply_compiled_collision_attributes( $entity, $obj, 'audio-marker' );

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
			$image_url = $this->normalize_url( $obj->image_path ?? '' );
			$a_img->setAttribute( 'src', $image_url );
			$a_img->setAttribute( 'crossorigin', 'anonymous' );
			$assets->appendChild( $a_img );
			$this->track_runtime_asset( 'image', $image_url, 'image:' . $uuid );

			// Parent entity keeps transform/collision metadata; the visible media is one double-sided plane.
			$parent = $dom->createElement( 'a-entity' );
			$parent->setAttribute( 'id', 'image-display_' . $uuid );
			$this->setAffineTransformations( $parent, $obj );
			$parent->setAttribute( 'class', 'override-materials hideable' );
			$this->apply_compiled_collision_attributes( $parent, $obj, 'image-plane' );
			$this->set_world_lighting_attributes( $parent );
			$this->apply_immerse_cefr_gating_attributes( $parent, $obj );

			// Determine if transparent (usually yes for PNG POIs)
			$is_transparent = isset($obj->transparent) ? ($obj->transparent ? 'true' : 'false') : 'true';
			$is_transparent_bool = $is_transparent === 'true';

			$plane = $dom->createElement( 'a-plane' );
			$plane->setAttribute( 'height', '2' );
			$plane->setAttribute( 'width', '2' );
			$plane->setAttribute( 'position', '0 0 0' );
			$plane->setAttribute( 'material', $this->world_media_material( "#image_$uuid", 'double', $is_transparent_bool ) );
			$this->set_world_lighting_attributes( $plane );

			$parent->appendChild( $plane );
			$ascene->appendChild( $parent );

		} elseif ( $cat === 'video' ) {
			$poster_id  = '';
			$poster_url = $this->resolve_video_poster_url( $obj, (string) $uuid );

			if ( $poster_url ) {
				$poster_id = 'video_poster_' . $uuid;
				$poster = $dom->createElement( 'img' );
				$poster->setAttribute( 'id', $poster_id );
				$poster->setAttribute( 'src', $poster_url );
				$this->track_runtime_asset( 'video-poster', $poster_url, 'video:' . $uuid );

				// Only apply crossorigin if the URL is external
				if ( strpos( $poster_url, $this->plugin_path_url ) === false &&
				     strpos( $poster_url, 'wp-content/uploads' ) === false ) {
					$poster->setAttribute( 'crossorigin', 'anonymous' );
				}

				$assets->appendChild( $poster );
			}

			// Video Assets (Controls)
			$v_pl = $dom->createElement( 'img' );
			$v_pl->setAttribute( 'id', 'video_pl_' . $uuid );
			$play_icon_url = $this->runtime_image_url( 'ui/play_2f3542.png' );
			$v_pl->setAttribute( 'src', $play_icon_url );
			$v_pl->setAttribute( 'crossorigin', 'anonymous' );
			$assets->appendChild( $v_pl );
			$this->track_runtime_asset( 'runtime-ui-image', $play_icon_url, 'video-controls:' . $uuid );

			$v_pas = $dom->createElement( 'img' );
			$v_pas->setAttribute( 'id', 'video_pas_' . $uuid );
			$pause_icon_url = $this->runtime_image_url( 'ui/pause_2f3542.png' );
			$v_pas->setAttribute( 'src', $pause_icon_url );
			$v_pas->setAttribute( 'crossorigin', 'anonymous' );
			$assets->appendChild( $v_pas );
			$this->track_runtime_asset( 'runtime-ui-image', $pause_icon_url, 'video-controls:' . $uuid );

			$v_fs = $dom->createElement( 'img' );
			$v_fs->setAttribute( 'id', 'video_fs_' . $uuid );
			$fullscreen_icon_url = $this->runtime_image_url( 'ui/fullscreen_2f3542.png' );
			$v_fs->setAttribute( 'src', $fullscreen_icon_url );
			$v_fs->setAttribute( 'crossorigin', 'anonymous' );
			$assets->appendChild( $v_fs );
			$this->track_runtime_asset( 'runtime-ui-image', $fullscreen_icon_url, 'video-controls:' . $uuid );

			$v_ex = $dom->createElement( 'img' );
			$v_ex->setAttribute( 'id', 'video_ex_' . $uuid );
			$exit_icon_url = $this->runtime_image_url( 'ui/exit_2f3542.png' );
			$v_ex->setAttribute( 'src', $exit_icon_url );
			$v_ex->setAttribute( 'crossorigin', 'anonymous' );
			$assets->appendChild( $v_ex );
			$this->track_runtime_asset( 'runtime-ui-image', $exit_icon_url, 'video-controls:' . $uuid );

			// Video Display
			$display = $dom->createElement( 'a-plane' );
			$display->setAttribute( 'id', 'video-display_' . $uuid );
			$display->setAttribute( 'width', '4' );
			$display->setAttribute( 'height', '3' );
			if ( $poster_id ) {
				$display->setAttribute( 'data-vrodos-video-poster', '#' . $poster_id );
			}
			$material_attr = 'side: double; transparent: true; alphaTest: 0.5; roughness: 0.85; metalness: 0; depthTest: true; depthWrite: true';
			if ( $poster_id ) {
				$material_attr .= "; src: #$poster_id";
			}
			$display->setAttribute( 'material', $material_attr );
			$display->setAttribute( 'class', 'override-materials clickable raycastable hideable' );
			$this->apply_compiled_collision_attributes( $display, $obj, 'video-plane' );
			$display->setAttribute( 'original-scale', '1 1 1' );
			$video_url = $this->normalize_url( $obj->video_path ?? '' );
			$display->setAttribute( 'data-vrodos-video-src', $video_url );
			$display->setAttribute( 'data-vrodos-video-loop', ($obj->video_loop ?? 0) == 1 ? 'true' : 'false' );
			$this->track_runtime_asset( 'video', $video_url, 'video:' . $uuid );
			$this->set_world_lighting_attributes( $display );
			$display->setAttribute( 'video-controls', "id: $uuid" );
			$this->setAffineTransformations( $display, $obj );
			$this->apply_immerse_cefr_gating_attributes( $display, $obj );

			$play_hint = $dom->createElement( 'a-entity' );
			$play_hint->setAttribute( 'id', 'video-playhint_' . $uuid );
			$play_hint->setAttribute( 'vrodos-3d-play-icon', '' );
			$play_hint->setAttribute( 'class', 'raycastable' );
			$play_hint->setAttribute( 'highlight', 'video-playhint_' . $uuid );
			if ( $this->isHoverEnabled ) {
				$play_hint->setAttribute( 'vrodos-hypnotic-hover', '' );
			}
			$play_hint->setAttribute( 'position', '0 0 0.1' );
			$play_hint->setAttribute( 'scale', '0.28 0.28 0.28' );
			$display->appendChild( $play_hint );

			$ascene->appendChild( $display );

			// Video Panel (Hidden by default, attached to camera by JS)
			$panel = $dom->createElement( 'a-entity' );
			$panel->setAttribute( 'id', 'vid-panel_' . $uuid );
			$panel->setAttribute( 'mixin', 'vid_panel' );
			$panel->setAttribute( 'visible', 'false' );
			$panel->setAttribute( 'scale', '0.0001 0.0001 0.0001' );
			$this->set_overlay_ui_attributes( $panel );

			// Exit Frame & Button
			$exit_frame = $dom->createElement( 'a-entity' );
			$exit_frame->setAttribute( 'id', 'exit_vid_panel_' . $uuid );
			$exit_frame->setAttribute( 'mixin', 'poiVidEscFrame' );
			$exit_frame->setAttribute( 'class', 'raycastable' );
			$this->set_overlay_ui_attributes( $exit_frame );
			$panel->appendChild( $exit_frame );

			$exit_btn = $dom->createElement( 'a-plane' );
			$exit_btn->setAttribute( 'id', 'ent_ex_' . $uuid );
			$exit_btn->setAttribute( 'src', '#video_ex_' . $uuid );
			$exit_btn->setAttribute( 'mixin', 'poiVidEscFrame' );
			$exit_btn->setAttribute( 'material', 'transparent: true' );
			$exit_btn->setAttribute( 'class', 'raycastable' );
			$this->set_overlay_ui_attributes( $exit_btn );
			$panel->appendChild( $exit_btn );

			// Play Button (Switches between 3D Play and 2D Pause)
			$play_btn = $dom->createElement( 'a-entity' );
			$play_btn->setAttribute( 'id', 'ent_pl_' . $uuid );
			$play_btn->setAttribute( 'position', '0 -0.2 0.001' );
			$play_btn->setAttribute( 'geometry', 'primitive: plane; width: 0.1; height: 0.1' );
			$play_btn->setAttribute( 'material', 'transparent: true; visible: false' );
			$play_btn->setAttribute( 'class', 'raycastable' );
			$play_btn->setAttribute( 'highlight', 'ent_pl_' . $uuid );
			$this->set_overlay_ui_attributes( $play_btn );
			if ( $this->isHoverEnabled ) {
				$play_btn->setAttribute( 'vrodos-hypnotic-hover', '' );
			}

			$play_btn_3d = $dom->createElement( 'a-entity' );
			$play_btn_3d->setAttribute( 'vrodos-3d-play-icon', '' );
			$play_btn_3d->setAttribute( 'scale', '0.04 0.04 0.04' );
			$this->set_overlay_ui_attributes( $play_btn_3d );
			$play_btn->appendChild( $play_btn_3d );

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
			$this->set_overlay_ui_attributes( $fs_btn );
			$panel->appendChild( $fs_btn );

			// Title
			$title = $dom->createElement( 'a-text' );
			$title->setAttribute( 'id', 'ent_tit_' . $uuid );
			$title->setAttribute( 'value', $this->sanitize_text_attr( $obj->video_title ?? 'Video' ) );
			$title->setAttribute( 'position', '0 0.3 0.001' );
			$title->setAttribute( 'align', 'center' );
			$title->setAttribute( 'width', '0.5' );
			$this->set_overlay_ui_attributes( $title );
			$panel->appendChild( $title );

			$ascene->appendChild( $panel );
		}
	}

	private function render_poi_imagetext_entity( $dom, $ascene, $assets, $obj ) {
		$uuid = $obj->uuid ?? '';

		// 1. Assets
		$main_img = $dom->createElement( 'img' );
		$main_img->setAttribute( 'id', 'main_img_' . $uuid );
		$main_img_url = $this->normalize_url( $obj->poi_img_path ?? $obj->poi_image_path ?? '' );
		if ( '' !== $main_img_url ) {
			$main_img->setAttribute( 'src', $main_img_url );
			$main_img->setAttribute( 'crossorigin', 'anonymous' );
		}
		$assets->appendChild( $main_img );
		$this->track_runtime_asset( 'poi-image', $main_img_url, 'poi-imagetext:' . $uuid );

		$esc_img = $dom->createElement( 'img' );
		$esc_img->setAttribute( 'id', 'esc_img_' . $uuid );
		$esc_icon_url = $this->runtime_image_url( 'ui/x_2f3542.png' );
		$esc_img->setAttribute( 'src', $esc_icon_url );
		$esc_img->setAttribute( 'crossorigin', 'anonymous' );
		$assets->appendChild( $esc_img );
		$this->track_runtime_asset( 'runtime-ui-image', $esc_icon_url, 'poi-imagetext:' . $uuid );

		// 2. UI Container (attached to scene, moved by JS)
		$ui = $dom->createElement( 'a-entity' );
		$ui->setAttribute( 'id', $uuid );
		$ui->setAttribute( 'class', 'hideable raycastable' );
		$ui->setAttribute( 'visible', 'false' );
		$ui->setAttribute( 'scale', '0.001 0.001 0.001' );
		$this->set_overlay_ui_attributes( $ui );
		// Add invisible geometry to satisfy this.el.components.material access in legacy JS
		$ui->setAttribute( 'geometry', 'primitive: plane; width: 0.001; height: 0.001' );
		$ui->setAttribute( 'material', 'visible: false; depthTest: true' );
		$ui->setAttribute( 'info-panel', $uuid );
		$this->setAffineTransformations( $ui, $obj );

		// 3. The Button (Trigger GLTF)
		$button = $dom->createElement( 'a-entity' );
		$button->setAttribute( 'id', 'button_poi_' . $uuid );
		$button_glb_url = $this->normalize_url( $obj->glb_path ?? '' );
		$button->setAttribute( 'gltf-model', 'url(' . $button_glb_url . ')' );
		$this->track_runtime_asset( 'gltf-inline', $button_glb_url, 'poi-imagetext-button:' . $uuid );
		$button->setAttribute( 'highlight', 'button_poi_' . $uuid );
		$button->setAttribute( 'class', 'override-materials raycastable menu-button hideable' );
		$this->apply_compiled_collision_attributes( $button, $obj, 'poi-button' );
		if ( $this->isHoverEnabled ) {
			$button->setAttribute( 'vrodos-hypnotic-hover', '' );
		}
		$this->set_world_lighting_attributes( $button );
		$this->setAffineTransformations( $button, $obj ); // Trigger stays in 3D world
		$ascene->appendChild( $button );

		// 4. The Info Panel (Inside UI Container)
		// Geometric Background
		$infoPanel = $dom->createElement( 'a-entity' );
		$infoPanel->setAttribute( 'id', 'infoPanel_' . $uuid );
		$infoPanel->setAttribute( 'geometry', 'primitive: plane; width: 1.5; height: 1.8' );
		$infoPanel->setAttribute( 'material', 'color: #333333; shader: flat; transparent: true; opacity: 0.9' );
		$infoPanel->setAttribute( 'position', '0 0 0.005' );
		$this->set_overlay_ui_attributes( $infoPanel );
		$ui->appendChild( $infoPanel );

		// Image Display Plane
		$top_img = $dom->createElement( 'a-entity' );
		$top_img->setAttribute( 'id', 'top_img_' . $uuid );
		$top_img->setAttribute( 'geometry', 'primitive: plane; width: 1.4; height: 0.8' );
		$top_img->setAttribute( 'material', 'shader: flat; transparent: true' );
		$top_img->setAttribute( 'position', '0 0.35 0.01' );
		$this->set_overlay_ui_attributes( $top_img );
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
		$this->set_overlay_ui_attributes( $title );
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
		$this->set_overlay_ui_attributes( $desc );
		$ui->appendChild( $desc );

		// Page Indicator
		$page = $dom->createElement( 'a-entity' );
		$page->setAttribute( 'id', 'page_' . $uuid );
		$page->setAttribute( 'position', '0 -0.7 0.01' );
		$page->setAttribute( 'text', 'value: page 1; color: #aaaaaa; align: center; font: https://cdn.aframe.io/fonts/DejaVu-sdf.fnt; width: 1' );
		$this->set_overlay_ui_attributes( $page );
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
		$this->set_overlay_ui_attributes( $next_panel );
		$ui->appendChild( $next_panel );

		$next_btn = $dom->createElement( 'a-entity' );
		$next_btn->setAttribute( 'id', 'next_' . $uuid );
		$next_btn->setAttribute( 'position', '0.5 -0.7 0.02' );
		$next_btn->setAttribute( 'text', 'value: NEXT; color: #ffffff; align: center; width: 1' );
		$next_btn->setAttribute( 'class', 'raycastable' );
		$this->set_overlay_ui_attributes( $next_btn );
		$ui->appendChild( $next_btn );

		// Prev
		$prev_panel = $dom->createElement( 'a-plane' );
		$prev_panel->setAttribute( 'id', 'prev_panel_' . $uuid );
		$prev_panel->setAttribute( 'position', '-0.5 -0.7 0.01' );
		$prev_panel->setAttribute( 'width', '0.2' );
		$prev_panel->setAttribute( 'height', '0.1' );
		$prev_panel->setAttribute( 'color', '#444444' );
		$prev_panel->setAttribute( 'class', 'raycastable' );
		$this->set_overlay_ui_attributes( $prev_panel );
		$ui->appendChild( $prev_panel );

		$prev_btn = $dom->createElement( 'a-entity' );
		$prev_btn->setAttribute( 'id', 'prev_' . $uuid );
		$prev_btn->setAttribute( 'position', '-0.5 -0.7 0.02' );
		$prev_btn->setAttribute( 'text', 'value: PREV; color: #ffffff; align: center; width: 1' );
		$prev_btn->setAttribute( 'class', 'raycastable' );
		$this->set_overlay_ui_attributes( $prev_btn );
		$ui->appendChild( $prev_btn );

		// Exit Button
		$exit_panel = $dom->createElement( 'a-plane' );
		$exit_panel->setAttribute( 'id', 'exit_panel_' . $uuid );
		$exit_panel->setAttribute( 'position', '0.65 0.8 0.01' );
		$exit_panel->setAttribute( 'width', '0.12' );
		$exit_panel->setAttribute( 'height', '0.12' );
		$exit_panel->setAttribute( 'color', '#cc0000' );
		$exit_panel->setAttribute( 'class', 'raycastable' );
		$this->set_overlay_ui_attributes( $exit_panel );
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
		$this->set_overlay_ui_attributes( $exit_btn );
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
