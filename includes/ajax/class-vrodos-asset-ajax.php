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
		add_action( 'wp_ajax_vrodos_upload_glb_chunk_action', [ $this, 'upload_glb_chunk_callback' ] );
	}

	public function upload_glb_chunk_callback(): void {
		if ( ! is_user_logged_in() ) {
			wp_send_json_error( 'You must be logged in to upload GLB assets.', 403 );
		}

		check_ajax_referer( 'post_nonce', 'nonce' );

		$upload_id   = isset( $_POST['upload_id'] ) ? sanitize_key( (string) wp_unslash( $_POST['upload_id'] ) ) : '';
		$chunk_index = isset( $_POST['chunk_index'] ) ? absint( $_POST['chunk_index'] ) : 0;
		$total       = isset( $_POST['total_chunks'] ) ? absint( $_POST['total_chunks'] ) : 0;
		$file_name   = isset( $_POST['file_name'] ) ? sanitize_file_name( (string) wp_unslash( $_POST['file_name'] ) ) : '';
		$project_id  = isset( $_POST['project_id'] ) ? absint( $_POST['project_id'] ) : 0;

		if ( $upload_id === '' || $total <= 0 || $chunk_index >= $total || $file_name === '' ) {
			wp_send_json_error( 'Invalid GLB chunk upload metadata.', 400 );
		}

		if ( strtolower( pathinfo( $file_name, PATHINFO_EXTENSION ) ) !== 'glb' ) {
			wp_send_json_error( 'Only GLB files can be uploaded here.', 400 );
		}

		if ( empty( $_FILES['chunk'] ) || (int) ( $_FILES['chunk']['error'] ?? UPLOAD_ERR_NO_FILE ) !== UPLOAD_ERR_OK ) {
			wp_send_json_error( 'The GLB upload chunk was not received.', 400 );
		}

		$upload_dir = wp_upload_dir();
		if ( ! empty( $upload_dir['error'] ) ) {
			wp_send_json_error( $upload_dir['error'], 500 );
		}

		$user_id     = get_current_user_id();
		$session_dir = trailingslashit( $upload_dir['basedir'] ) . 'vrodos-chunked-uploads/user-' . $user_id . '/' . $upload_id;
		if ( $chunk_index === 0 && is_dir( $session_dir ) ) {
			$this->delete_chunk_upload_dir( $session_dir, trailingslashit( $upload_dir['basedir'] ) . 'vrodos-chunked-uploads/user-' . $user_id );
		}

		if ( ! wp_mkdir_p( $session_dir ) ) {
			wp_send_json_error( 'Could not create the GLB chunk upload directory.', 500 );
		}

		$part_path = trailingslashit( $session_dir ) . 'chunk-' . $chunk_index . '.part';
		if ( ! move_uploaded_file( (string) $_FILES['chunk']['tmp_name'], $part_path ) ) {
			wp_send_json_error( 'Could not store the GLB upload chunk.', 500 );
		}

		$complete = true;
		for ( $i = 0; $i < $total; $i++ ) {
			if ( ! is_file( trailingslashit( $session_dir ) . 'chunk-' . $i . '.part' ) ) {
				$complete = false;
				break;
			}
		}

		if ( $complete ) {
			$final_path = trailingslashit( $session_dir ) . 'upload.glb';
			$out        = fopen( $final_path, 'wb' );
			if ( ! $out ) {
				wp_send_json_error( 'Could not assemble the GLB upload.', 500 );
			}

			for ( $i = 0; $i < $total; $i++ ) {
				$part = trailingslashit( $session_dir ) . 'chunk-' . $i . '.part';
				$in   = fopen( $part, 'rb' );
				if ( ! $in ) {
					fclose( $out );
					wp_send_json_error( 'Could not read a GLB upload chunk.', 500 );
				}
				stream_copy_to_stream( $in, $out );
				fclose( $in );
				wp_delete_file( $part );
			}
			fclose( $out );

			file_put_contents(
				trailingslashit( $session_dir ) . 'manifest.json',
				wp_json_encode(
					[
						'file_name'  => $file_name,
						'project_id' => $project_id,
						'user_id'    => $user_id,
						'created'    => time(),
					]
				)
			);
		}

		wp_send_json_success(
			[
				'complete' => $complete,
				'token'    => $upload_id,
				'received' => $chunk_index + 1,
				'total'    => $total,
			]
		);
	}

	private function delete_chunk_upload_dir( string $dir, string $allowed_root ): void {
		$dir          = wp_normalize_path( $dir );
		$allowed_root = trailingslashit( wp_normalize_path( $allowed_root ) );
		if ( ! str_starts_with( trailingslashit( $dir ), $allowed_root ) || ! is_dir( $dir ) ) {
			return;
		}

		$iterator = new RecursiveIteratorIterator(
			new RecursiveDirectoryIterator( $dir, FilesystemIterator::SKIP_DOTS ),
			RecursiveIteratorIterator::CHILD_FIRST
		);
		foreach ( $iterator as $item ) {
			$item->isDir() ? rmdir( $item->getPathname() ) : wp_delete_file( $item->getPathname() );
		}
		rmdir( $dir );
	}

	/**
	 * Delete an asset and its files
	 */
	public function delete_asset3d_frontend_callback() {
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_send_json_error( 'Insufficient permissions.', 403 );
		}

		$asset_id = isset( $_POST['asset_id'] ) ? absint( $_POST['asset_id'] ) : 0;
		$gameSlug = isset( $_POST['game_slug'] ) ? sanitize_key( wp_unslash( (string) $_POST['game_slug'] ) ) : '';

		if ( $asset_id <= 0 || 'vrodos_asset3d' !== get_post_type( $asset_id ) ) {
			wp_send_json_error( 'Asset not found.', 404 );
		}

		if ( ! current_user_can( 'delete_post', $asset_id ) && (int) get_post_field( 'post_author', $asset_id ) !== get_current_user_id() && ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( 'You are not allowed to delete this asset.', 403 );
		}

		$args        = ['post_parent'    => $asset_id, 'post_type'      => 'attachment', 'posts_per_page' => -1];
		$attachments = get_children( $args );

		if ( $attachments ) {
			foreach ( $attachments as $attachment ) {
				wp_delete_attachment( $attachment->ID, true );
			}
		}

		// Delete all uses of Asset from Scenes (json)
		VRodos_Core_Manager::vrodos_delete_asset_3d_from_scenes( $asset_id, $gameSlug );

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
