<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once plugin_dir_path( __FILE__ ) . '../class-vrodos-url-normalizer.php';

class VRodos_Asset_AJAX {

	public function __construct() {
		add_action( 'wp_ajax_vrodos_update_text_asset_action', [ $this, 'update_text_asset' ] );
		add_action( 'wp_ajax_vrodos_delete_asset_action', [ $this, 'delete_asset3d_frontend_callback' ] );
		add_action( 'wp_ajax_vrodos_fetch_assetmeta_action', [ $this, 'fetch_asset3d_meta_backend_callback' ] );
		add_action( 'wp_ajax_vrodos_fetch_game_assets_action', [ $this, 'vrodos_fetch_game_assets_action_callback' ] );
		add_action( 'wp_ajax_vrodos_fetch_glb_asset_action', [ $this, 'vrodos_fetch_glb_asset3d_frontend_callback' ] );
		add_action( 'wp_ajax_vrodos_retry_editor_preview_action', [ $this, 'vrodos_retry_editor_preview_callback' ] );
		add_action( 'wp_ajax_vrodos_asset_readiness_action', [ $this, 'vrodos_asset_readiness_callback' ] );
	}

	public function update_text_asset(): void {
		if ( ! check_ajax_referer( 'vrodos_scene_mutation', 'nonce', false ) ) {
			wp_send_json_error( 'Invalid security token.', 403 );
		}
		$asset_id = absint( $_POST['asset_id'] ?? 0 );
		if ( 'vrodos_asset3d' !== get_post_type( $asset_id ) || ! has_term( '3d-text', 'vrodos_asset3d_cat', $asset_id ) ) {
			wp_send_json_error( 'Text asset not found.', 404 );
		}
		if ( ! VRodos_Immerse_Access_Manager::can_edit_asset( $asset_id ) ) {
			wp_send_json_error( 'You are not allowed to edit this asset.', 403 );
		}
		if ( ! isset( $_POST['text_content'] ) || ! is_string( $_POST['text_content'] ) ) {
			wp_send_json_error( 'Text content is required.', 400 );
		}
		$result = VRodos_Text_Asset_Helper::normalize_manual_text( wp_unslash( $_POST['text_content'] ) );
		if ( empty( $result['success'] ) || ! empty( $result['truncated'] ) ) {
			wp_send_json_error( 'Enter between 1 and ' . VRodos_Text_Asset_Helper::MAX_TEXT_LENGTH . ' characters.', 400 );
		}
		VRodos_Text_Asset_Helper::persist_extracted_text( $asset_id, $result );
		wp_send_json_success( [
			'asset_id' => $asset_id,
			'text_content' => $result['text'],
			'text_format' => $result['format'],
			'text_truncated' => '0',
		] );
	}

	/**
	 * Delete an asset and its files
	 */
	public function delete_asset3d_frontend_callback() {
		if ( ! VRodos_Storage_Manager::storage_schema_ready() ) {
			wp_send_json_error( 'VRodos storage migration must be verified first.', 503 );
		}
		if ( ! check_ajax_referer( 'post_nonce', 'nonce', false ) ) {
			wp_send_json_error( 'Invalid security token.', 403 );
		}

		$asset_id = isset( $_POST['asset_id'] ) ? absint( $_POST['asset_id'] ) : 0;

		if ( $asset_id <= 0 || 'vrodos_asset3d' !== get_post_type( $asset_id ) ) {
			wp_send_json_error( 'Asset not found.', 404 );
		}

		if ( ! current_user_can( 'delete_post', $asset_id ) ) {
			wp_send_json_error( 'You are not allowed to delete this asset.', 403 );
		}

		$references_removed = VRodos_Core_Manager::vrodos_delete_asset_3d_from_scenes( $asset_id );
		if ( is_wp_error( $references_removed ) ) {
			wp_send_json_error( $references_removed->get_error_message(), 403 );
		}

		VRodos_Storage_Manager::delete_owned_attachments( 'asset', $asset_id );

		// Delete Asset post from SQL database
		wp_delete_post( $asset_id, true );

		// Clear the asset list transients
		global $wpdb;
		$wpdb->query( $wpdb->prepare( "DELETE FROM $wpdb->options WHERE option_name LIKE %s OR option_name LIKE %s", '_transient_vrodos_assets_%', '_transient_timeout_vrodos_assets_%' ) );

		wp_send_json_success(
			[
				'asset_id' => $asset_id,
				'deleted'  => true,
			]
		);
	}

	/**
	 * Fetch asset metadata for the backend
	 */
	public function fetch_asset3d_meta_backend_callback() {
		if ( ! check_ajax_referer( 'vrodos_scene_mutation', 'nonce', false ) ) {
			wp_send_json_error( 'Invalid security token.', 403 );
		}
		$asset_id = absint( $_POST['asset_id'] ?? 0 );
		if ( ! $this->can_read_asset( $asset_id ) ) {
			wp_send_json_error( 'Insufficient permissions.', 403 );
		}
		$output                 = new StdClass();
		$output->assettrs_saved = get_post_meta( $asset_id, 'vrodos_asset3d_assettrs', true );

		print_r( json_encode( $output, JSON_UNESCAPED_SLASHES ) );
		wp_die();
	}

	/**
	 * Fetch list of assets for a game/project
	 */
	public function vrodos_fetch_game_assets_action_callback() {
		if ( ! check_ajax_referer( 'vrodos_scene_mutation', 'nonce', false ) ) {
			wp_send_json_error( 'Invalid security token.', 403 );
		}
		$project_id = absint( $_POST['gameProjectID'] ?? 0 );
		if ( 'vrodos_game' !== get_post_type( $project_id ) || ! current_user_can( 'edit_post', $project_id ) ) {
			wp_send_json_error( 'Insufficient permissions.', 403 );
		}
		header( 'Content-type: application/json' );

		$response = VRodos_Core_Manager::vrodos_get_assets_by_game( get_post_field( 'post_name', $project_id ), $project_id );

		$url_normalizer = new VRodos_URL_Normalizer();
		for ( $i = 0; $i < count( $response ); $i++ ) {
			$asset_id = absint( $response[ $i ]['asset_id'] ?? 0 );
			if ( ! empty( $response[ $i ]['glb_path'] ) && $this->can_read_asset( $asset_id ) ) {
				$response[ $i ]['editorReadiness'] = VRodos_Asset_Optimization_Manager::resolve_editor_glb_load( $asset_id )['readiness'];
			}
			if ( isset( $response[ $i ]['assetName'] ) ) {
				$response[ $i ]['name'] = $response[ $i ]['assetName'];
				$response[ $i ]['type'] = 'file';
			}
			// Normalize all paths
			foreach ( ['glb_path', 'path', 'screenshot_path', 'video_path', 'poi_img_path'] as $key ) {
				if ( isset( $response[ $i ][ $key ] ) ) {
					$response[ $i ][ $key ] = $url_normalizer->normalize( $response[ $i ][ $key ] );
				}
			}
		}

		echo json_encode( ['items' => $response], JSON_UNESCAPED_SLASHES );
		wp_die();
	}

	/**
	 * Fetch GLB asset info for the frontend editor
	 */
	public function vrodos_fetch_glb_asset3d_frontend_callback(): void {
		if ( ! check_ajax_referer( 'vrodos_scene_mutation', 'nonce', false ) ) {
			wp_send_json_error( 'Invalid security token.', 403 );
		}
		wp_reset_postdata();
		$asset_id = absint( $_POST['asset_id'] ?? 0 );
		if ( ! $this->can_read_asset( $asset_id ) ) {
			wp_send_json_error( 'Insufficient permissions.', 403 );
		}
		
		$glbID = get_post_meta( $asset_id, 'vrodos_asset3d_glb', true );
		$glbURL = VRodos_Core_Manager::resolve_media_meta_url( $glbID );

		$url_normalizer = new VRodos_URL_Normalizer();
		$output = new stdClass();
		$output->glbIDs = $glbID;
		$output->glbURL = $url_normalizer->normalize( $glbURL );
		$output->vrodosAssetOriginMode = VRodos_Asset_Origin::mode_for_asset( $asset_id );
		$output->vrodos_environment_asset = VRodos_Core_Manager::is_vr_environment_asset( $asset_id );
		$bounds = VRodos_Asset_Optimization_Manager::collision_bounds_for_asset( $asset_id );
		$output->vrodosCollisionBounds = is_wp_error( $bounds ) ? null : $bounds;
		$output->editorLoad = [];

		if ( class_exists( 'VRodos_Asset_Optimization_Manager' ) && '' !== $glbURL ) {
			$editor_load = VRodos_Asset_Optimization_Manager::resolve_editor_glb_load( $asset_id );
			foreach ( [ 'loadUrl', 'canonicalUrl' ] as $url_key ) {
				$editor_load[ $url_key ] = $url_normalizer->normalize( (string) ( $editor_load[ $url_key ] ?? '' ) );
			}
			$output->editorLoad = $editor_load;
		}

		// Fetch category slug
		$terms = wp_get_post_terms( $asset_id, 'vrodos_asset3d_cat' );
		if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
			$output->category_slug = $terms[0]->slug;
		} else {
			$output->category_slug = '';
		}

		// Resolve screenshot_path
		$sshotID = get_post_meta( $asset_id, 'vrodos_asset3d_screenimage', true );
		if ( ! $sshotID ) {
			$sshotID = get_post_thumbnail_id( $asset_id );
		}
		
		if ( ! $sshotID && $output->category_slug === 'image' ) {
			$sshotID = get_post_meta( $asset_id, '_immerse_original_url', true );
		}
		
		if ( $sshotID ) {
			$sshotUrl = VRodos_Core_Manager::resolve_media_meta_url( $sshotID );
			if ( $sshotUrl ) {
				$output->screenshot_path = $url_normalizer->normalize( $sshotUrl );
			}
		}

		echo json_encode( $output, JSON_UNESCAPED_SLASHES );
		wp_die();
	}

	public function vrodos_retry_editor_preview_callback(): void {
		if ( ! check_ajax_referer( 'vrodos_scene_mutation', 'nonce', false ) ) {
			wp_send_json_error( 'Invalid security token.', 403 );
		}
		$asset_id = absint( $_POST['asset_id'] ?? 0 );
		if ( ! $this->can_read_asset( $asset_id ) || ! current_user_can( 'edit_post', $asset_id ) ) {
			wp_send_json_error( 'Insufficient permissions.', 403 );
		}
		if ( ! class_exists( 'VRodos_Asset_Optimization_Manager' ) ) {
			wp_send_json_error( 'Asset optimization is unavailable.', 503 );
		}

		VRodos_Asset_Optimization_Manager::retry_editor_preview( $asset_id );
		wp_send_json_success( VRodos_Asset_Optimization_Manager::resolve_editor_glb_load( $asset_id ) );
	}

	public function vrodos_asset_readiness_callback(): void {
		if ( ! check_ajax_referer( 'vrodos_scene_mutation', 'nonce', false ) ) {
			wp_send_json_error( 'Invalid security token.', 403 );
		}
		$ids = $_POST['asset_ids'] ?? [];
		if ( ! is_array( $ids ) || count( $ids ) > 100 ) {
			wp_send_json_error( 'Provide at most 100 asset IDs.', 400 );
		}
		$items = [];
		foreach ( array_unique( array_map( 'absint', $ids ) ) as $asset_id ) {
			if ( 'vrodos_asset3d' !== get_post_type( $asset_id ) || ! $this->can_read_asset( $asset_id ) ) {
				$items[ $asset_id ] = [ 'status' => 'forbidden', 'label' => 'Access unavailable', 'message' => 'This asset is unavailable.' ];
				continue;
			}
			$items[ $asset_id ] = VRodos_Asset_Optimization_Manager::resolve_editor_glb_load( $asset_id )['readiness'];
		}
		wp_send_json_success( [ 'items' => $items ] );
	}

	private function can_read_asset( int $asset_id ): bool {
		return VRodos_Immerse_Access_Manager::can_read_asset( $asset_id );
	}
}
