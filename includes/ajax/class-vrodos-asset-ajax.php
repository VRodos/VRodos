<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once plugin_dir_path( __FILE__ ) . '../class-vrodos-url-normalizer.php';

class VRodos_Asset_AJAX {

	public function __construct() {
		add_action( 'wp_ajax_vrodos_delete_asset_action', [ $this, 'delete_asset3d_frontend_callback' ] );
		add_action( 'wp_ajax_vrodos_fetch_assetmeta_action', [ $this, 'fetch_asset3d_meta_backend_callback' ] );
		add_action( 'wp_ajax_vrodos_fetch_game_assets_action', [ $this, 'vrodos_fetch_game_assets_action_callback' ] );
		add_action( 'wp_ajax_vrodos_fetch_glb_asset_action', [ $this, 'vrodos_fetch_glb_asset3d_frontend_callback' ] );
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
		$output->sourceSizeBytes = 0;
		$output->editorPreviewGlbURL = '';
		$output->editorPreviewStatus = 'none';
		$output->editorPreviewMessage = '';
		$output->editorPreviewUsed = false;
		$output->editorPreviewShouldUse = false;
		$output->editorPreviewReasons = [];
		$output->glbAnalysis = [];

		if ( class_exists( 'VRodos_Asset_Optimization_Manager' ) && '' !== $glbURL ) {
			$preview_state = VRodos_Asset_Optimization_Manager::get_editor_preview_asset_state( $asset_id );
			$output->sourceSizeBytes = (int) ( $preview_state['sourceSizeBytes'] ?? 0 );
			$output->editorPreviewGlbURL = $url_normalizer->normalize( (string) ( $preview_state['url'] ?? '' ) );
			$output->editorPreviewStatus = (string) ( $preview_state['status'] ?? 'none' );
			$output->editorPreviewMessage = (string) ( $preview_state['message'] ?? '' );
			$output->editorPreviewUsed = ! empty( $preview_state['used'] );
			$output->editorPreviewShouldUse = ! empty( $preview_state['shouldPreview'] );
			$output->editorPreviewReasons = is_array( $preview_state['reasons'] ?? null ) ? $preview_state['reasons'] : [];
			$output->glbAnalysis = is_array( $preview_state['analysis'] ?? null ) ? $preview_state['analysis'] : [];
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

	private function can_read_asset( int $asset_id ): bool {
		return VRodos_Immerse_Access_Manager::can_read_asset( $asset_id );
	}
}
