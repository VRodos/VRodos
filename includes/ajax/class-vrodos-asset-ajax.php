<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once plugin_dir_path( __FILE__ ) . '../class-vrodos-compiler-manager.php';

class VRodos_Asset_AJAX {

	public function __construct() {
		add_action( 'wp_ajax_vrodos_delete_asset_action', [ $this, 'delete_asset3d_frontend_callback' ] );
		add_action( 'wp_ajax_vrodos_fetch_assetmeta_action', [ $this, 'fetch_asset3d_meta_backend_callback' ] );
		add_action( 'wp_ajax_vrodos_fetch_game_assets_action', [ $this, 'vrodos_fetch_game_assets_action_callback' ] );
		add_action( 'wp_ajax_vrodos_fetch_glb_asset_action', [ $this, 'vrodos_fetch_glb_asset3d_frontend_callback' ] );
		add_action( 'wp_ajax_nopriv_vrodos_fetch_glb_asset_action', [ $this, 'vrodos_fetch_glb_asset3d_frontend_callback' ] );
	}

	/**
	 * Delete an asset and its files
	 */
	public function delete_asset3d_frontend_callback() {
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_send_json_error( 'Insufficient permissions.', 403 );
		}

		$asset_id = absint( $_POST['asset_id'] );
		$gameSlug = sanitize_key( $_POST['game_slug'] );
		$isCloned = sanitize_text_field( $_POST['isCloned'] );

		// If it is not cloned then it is safe to delete the meta files.
		if ( $isCloned === 'false' ) {
			$args        = ['post_parent'    => $asset_id, 'post_type'      => 'attachment', 'posts_per_page' => -1];
			$attachments = get_children( $args );

			if ( $attachments ) {
				$site_url = get_site_url();

				foreach ( $attachments as $attachment ) {
					$file_url = wp_get_attachment_url( $attachment->ID );
					$file_path = str_replace( $site_url, ABSPATH, $file_url );
					$file_path = wp_normalize_path( $file_path );

					if ( file_exists( $file_path ) ) {
						wp_delete_file( $file_path );
					}

					wp_delete_attachment( $attachment->ID, true );
				}
			}
		}

		// Delete all uses of Asset from Scenes (json)
		VRodos_Core_Manager::vrodos_delete_asset_3d_from_scenes( $asset_id, $gameSlug );

		// Delete Asset post from SQL database
		wp_delete_post( $asset_id, true );

		// Clear the asset list transients
		global $wpdb;
		$wpdb->query( $wpdb->prepare( "DELETE FROM $wpdb->options WHERE option_name LIKE %s OR option_name LIKE %s", '_transient_vrodos_assets_%', '_transient_timeout_vrodos_assets_%' ) );

		echo $asset_id;
		wp_die();
	}

	/**
	 * Fetch asset metadata for the backend
	 */
	public function fetch_asset3d_meta_backend_callback() {
		$asset_id = intval( $_POST['asset_id'] );
		$output                 = new StdClass();
		$output->assettrs_saved = get_post_meta( $asset_id, 'vrodos_asset3d_assettrs', true );

		print_r( json_encode( $output, JSON_UNESCAPED_SLASHES ) );
		wp_die();
	}

	/**
	 * Fetch list of assets for a game/project
	 */
	public function vrodos_fetch_game_assets_action_callback() {
		header( 'Content-type: application/json' );

		$response = VRodos_Core_Manager::vrodos_get_assets_by_game( $_POST['gameProjectSlug'], $_POST['gameProjectID'] );

		$compiler = new VRodos_Compiler_Manager();
		for ( $i = 0; $i < count( $response ); $i++ ) {
			if ( isset( $response[ $i ]['assetName'] ) ) {
				$response[ $i ]['name'] = $response[ $i ]['assetName'];
				$response[ $i ]['type'] = 'file';
			}
			// Normalize all paths
			foreach ( ['glb_path', 'path', 'screenshot_path', 'video_path', 'poi_img_path'] as $key ) {
				if ( isset( $response[ $i ][ $key ] ) ) {
					$response[ $i ][ $key ] = $compiler->normalize_url( $response[ $i ][ $key ] );
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
		wp_reset_postdata();
		$asset_id = intval( $_POST['asset_id'] );
		
		$glbID = get_post_meta( $asset_id, 'vrodos_asset3d_glb', true );
		$glbURL = VRodos_Core_Manager::resolve_media_meta_url( $glbID );

		$compiler = new VRodos_Compiler_Manager();
		$output = new stdClass();
		$output->glbIDs = $glbID;
		$output->glbURL = $compiler->normalize_url( $glbURL );

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
				$output->screenshot_path = $compiler->normalize_url( $sshotUrl );
			}
		}

		echo json_encode( $output, JSON_UNESCAPED_SLASHES );
		wp_die();
	}
}
