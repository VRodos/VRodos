<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once plugin_dir_path( __FILE__ ) . '../vrodos-scene-model.php';
require_once plugin_dir_path( __FILE__ ) . '../class-vrodos-compiler-manager.php';

class VRodos_Scene_AJAX {

	public function __construct() {
		add_action( 'wp_ajax_vrodos_save_scene_async_action', [ $this, 'save_scene_async_action_callback' ] );
		add_action( 'wp_ajax_vrodos_delete_scene_action', [ $this, 'delete_scene_frontend_callback' ] );
		add_action( 'wp_ajax_vrodos_reorder_scenes_action', [ $this, 'reorder_scenes_callback' ] );
		add_action( 'wp_ajax_image_upload_action', [ $this, 'image_upload_action_callback' ] );
		add_action( 'wp_ajax_vrodos_compile_action', [ $this, 'compile_action_callback' ] );
	}

	/**
	 * Saves the scene via AJAX.
	 */
	public function save_scene_async_action_callback() {
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_send_json_error( 'Insufficient permissions.', 403 );
		}

		$scene_id = intval( $_POST['scene_id'] );
		if ( $scene_id <= 0 ) {
			wp_send_json_error( 'Invalid scene id.', 400 );
		}

		$scene_json = isset( $_POST['scene_json'] ) ? wp_unslash( $_POST['scene_json'] ) : '';
		if ( ! is_string( $scene_json ) || trim( $scene_json ) === '' ) {
			wp_send_json_error( 'Missing scene JSON.', 400 );
		}

		// Save screenshot
		if ( isset( $_POST['scene_screenshot'] ) ) {
			$attachment_id = VRodos_Upload_Manager::upload_scene_screenshot(
				$_POST['scene_screenshot'],
				'scene_' . $scene_id . '_featimg',
				$scene_id,
				'jpg'
			);

			// Set thumbnail of post
			set_post_thumbnail( $scene_id, $attachment_id );
		}

		// Create a new scene model and populate it from the posted JSON.
		$scene_model = new Vrodos_Scene_Model( $scene_json );
		if ( ! $scene_model->is_valid() ) {
			wp_send_json_error( 'Invalid scene JSON: ' . $scene_model->get_error_message(), 400 );
		}

		// Save json of scene
		$scene_new_info = [
			'ID'           => $scene_id,
			'post_title'   => sanitize_text_field( wp_unslash( $_POST['scene_title'] ?? '' ) ),
			'post_content' => $scene_model->to_json()
		];

		$res = wp_update_post( $scene_new_info, true );
		if ( is_wp_error( $res ) ) {
			wp_send_json_error( 'Scene save failed: ' . $res->get_error_message(), 500 );
		}
		if ( ! $res ) {
			wp_send_json_error( 'Scene save failed.', 500 );
		}

		update_post_meta( $scene_id, 'vrodos_scene_caption', sanitize_textarea_field( wp_unslash( $_POST['scene_caption'] ?? '' ) ) );

		wp_send_json_success( [
			'scene_id' => $scene_id,
		] );
	}

	/**
	 * REORDER SCENES
	 */
	public function reorder_scenes_callback() {
		check_ajax_referer( 'post_nonce', 'nonce' );
		if ( ! current_user_can( 'edit_vrodos_scene' ) ) {
			wp_die( -1 );
		}

		$scene_ids = array_map( 'absint', $_POST['scene_ids'] ?? [] );
		foreach ( $scene_ids as $order => $scene_id ) {
			if ( $scene_id > 0 ) {
				wp_update_post( [ 'ID' => $scene_id, 'menu_order' => $order ] );
			}
		}
		wp_send_json_success();
	}

	/**
	 * DELETE specific SCENE
	 */
	public function delete_scene_frontend_callback() {

		$scene_id  = intval( $_POST['scene_id'] );
		$postTitle = get_the_title( $scene_id );

		// 1. Delete screenshot of scene
		$postmeta = get_post_meta( $scene_id );

		if ( isset( $postmeta['_thumbnail_id'] ) ) {
			$thumb_id      = $postmeta['_thumbnail_id'][0];
			$attached_file = get_post_meta( $thumb_id, '_wp_attached_file', true );

			if ( file_exists( $attached_file ) ) {
				unlink( $attached_file );
			}

			// 2. Delete meta
			delete_post_meta( $thumb_id, '_wp_attached_file' );
			delete_post_meta( $thumb_id, '_wp_attachment_metadata' );
		}

		// 3. Delete Scene CUSTOM POST
		wp_delete_post( $scene_id, true );

		// 4. Delete Thumbnail post
		if ( isset( $postmeta['_thumbnail_id'] ) ) {
			wp_delete_post( $thumb_id, true );
		}

		echo $postTitle;
		wp_die();
	}

	/**
	 * Upload background image for a scene
	 */
	public function image_upload_action_callback() {
		check_ajax_referer( 'vrodos_scene_upload_image_nonce' ) || wp_die( 'Security check failed.' );

		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_send_json_error( 'Insufficient permissions.', 403 );
		}

		$project_id = intval( $_POST['projectid'] );
		$scene_id   = intval( $_POST['sceneid'] );

		if ( ! $project_id || ! $scene_id ) {
			wp_send_json_error( 'Invalid project or scene ID.', 400 );
		}

		// DELETE EXISTING FILE: See if has already a background image and delete the file in the filesystem
		$scene_background_ids = get_post_meta( $scene_id, 'vrodos_scene_bg_image' );
		if ( ! empty( $scene_background_ids ) && ! empty( $scene_background_ids[0] ) ) {
			$old_attachment_id = intval( $scene_background_ids[0] );
			wp_delete_attachment( $old_attachment_id, true );
		}

		$image_data = $_POST['image'] ?? '';
		$ext        = sanitize_key( $_POST['imagetype'] ?? 'jpg' );

		// Ensure we have a unique filename
		$hashed_filename = $project_id . '_' . time() . '_' . $scene_id . '_bg.' . $ext;
		
		// Decode base64 image
		$decoded_image = base64_decode( substr( (string) $image_data, strpos( (string) $image_data, ',' ) + 1 ) );
		
		// Upload the background image file using WordPress standard bits
		$_REQUEST['post_id'] = $scene_id; 
		add_filter( 'upload_dir', [ 'VRodos_Upload_Manager', 'upload_dir_for_scenes_or_assets' ] );
		
		$file_return = wp_upload_bits( $hashed_filename, null, $decoded_image );
		
		remove_filter( 'upload_dir', [ 'VRodos_Upload_Manager', 'upload_dir_for_scenes_or_assets' ] );
		unset( $_REQUEST['post_id'] );

		if ( ! $file_return || ! empty( $file_return['error'] ) ) {
			wp_send_json_error( 'File upload failed: ' . ( $file_return['error'] ?? 'Unknown error' ), 500 );
		}

		// Insert the attachment into the database
		$attachment_id = VRodos_Upload_Manager::insert_attachment_post( $file_return, $scene_id );
		
		if ( ! $attachment_id ) {
			wp_send_json_error( 'Failed to create database attachment record.', 500 );
		}

		// Update the scene's background image meta
		update_post_meta( $scene_id, 'vrodos_scene_bg_image', $attachment_id );

		// Prepare the final normalized URL for the editor
		$final_path = wp_get_attachment_url( $attachment_id );
		$compiler   = new VRodos_Compiler_Manager();
		$final_path = $compiler->normalize_url( $final_path );

		wp_send_json( [ 'url' => $final_path ] );
	}

	/**
	 * Compile scene to A-Frame
	 */
	public function compile_action_callback() {
		if ( ! check_ajax_referer( 'vrodos_compile_scene', 'nonce', false ) ) {
			wp_send_json_error( [ 'code' => 'invalid_nonce', 'message' => 'Compile security check failed.' ], 403 );
		}

		$scene_id   = absint( $_POST['vrodos_scene'] ?? 0 );
		$project_id = absint( $_POST['projectId'] ?? 0 );
		if ( $scene_id <= 0 || $project_id <= 0 ) {
			wp_send_json_error( [ 'code' => 'invalid_ids', 'message' => 'Invalid project or scene.' ], 400 );
		}

		$project = get_post( $project_id );
		$scene   = get_post( $scene_id );
		if ( ! $project instanceof WP_Post || 'vrodos_game' !== $project->post_type || ! $scene instanceof WP_Post || 'vrodos_scene' !== $scene->post_type ) {
			wp_send_json_error( [ 'code' => 'invalid_posts', 'message' => 'Invalid project or scene.' ], 400 );
		}
		if ( ! current_user_can( 'edit_post', $project_id ) || ! current_user_can( 'edit_post', $scene_id ) ) {
			wp_send_json_error( [ 'code' => 'forbidden', 'message' => 'You are not allowed to compile this project.' ], 403 );
		}

		$project_term = get_term_by( 'slug', (string) $project->post_name, 'vrodos_scene_pgame' );
		if ( ! $project_term || is_wp_error( $project_term ) ) {
			wp_send_json_error( [ 'code' => 'missing_project_term', 'message' => 'Project has no scene taxonomy term.' ], 400 );
		}
		$scene_ids = VRodos_Core_Manager::vrodos_get_all_sceneids_of_game( (int) $project_term->term_id );
		if ( ! in_array( $scene_id, array_map( 'absint', $scene_ids ), true ) ) {
			wp_send_json_error( [ 'code' => 'scene_project_mismatch', 'message' => 'Selected scene does not belong to this project.' ], 400 );
		}
		foreach ( $scene_ids as $candidate_scene_id ) {
			if ( ! current_user_can( 'edit_post', absint( $candidate_scene_id ) ) ) {
				wp_send_json_error( [ 'code' => 'forbidden_scene', 'message' => 'You cannot compile every scene in this project.' ], 403 );
			}
		}

		$runtime_mode = sanitize_text_field( wp_unslash( $_POST['runtimeMode'] ?? '' ) );
		if ( ! in_array( $runtime_mode, [ 'networked', 'single-player' ], true ) ) {
			wp_send_json_error( [ 'code' => 'invalid_runtime_mode', 'message' => 'Invalid compile runtime mode.' ], 400 );
		}
		$vr_runtime_profile = sanitize_text_field( wp_unslash( $_POST['vrRuntimeProfile'] ?? '' ) );
		$profile_setting    = VRodos_Runtime_Settings_Contract::setting( 'vrRuntimeProfile' );
		$allowed_profiles   = is_array( $profile_setting['allowed'] ?? null ) ? $profile_setting['allowed'] : [];
		if ( ! in_array( $vr_runtime_profile, $allowed_profiles, true ) ) {
			wp_send_json_error( [ 'code' => 'invalid_vr_runtime_profile', 'message' => 'Invalid compile VR target.' ], 400 );
		}

		$request = new VRodos_Compile_Request(
			$project_id,
			$scene_id,
			$scene_ids,
			$runtime_mode,
			$vr_runtime_profile,
			VRodos_Runtime_Settings_Contract::normalize_bool( wp_unslash( $_POST['showPawnPositions'] ?? 'false' ), false )
		);
		$result   = ( new VRodos_Compiler_Manager() )->compile( $request );
		if ( is_wp_error( $result ) ) {
			$data   = $result->get_error_data();
			$status = is_array( $data ) ? absint( $data['status'] ?? 500 ) : 500;
			wp_send_json_error(
				[ 'code' => $result->get_error_code(), 'message' => $result->get_error_message() ],
				$status > 0 ? $status : 500
			);
		}

		wp_send_json( $result->to_public_payload() );
	}
}
