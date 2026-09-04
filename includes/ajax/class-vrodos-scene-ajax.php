<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once plugin_dir_path( __FILE__ ) . '../vrodos-scene-model.php';
require_once plugin_dir_path( __FILE__ ) . '../class-vrodos-compiler-manager.php';
require_once plugin_dir_path( __FILE__ ) . '../class-vrodos-scene-standalone-exporter.php';
require_once plugin_dir_path( __FILE__ ) . '../class-vrodos-url-normalizer.php';

class VRodos_Scene_AJAX {

	public function __construct() {
		add_action( 'wp_ajax_vrodos_save_scene_async_action', [ $this, 'save_scene_async_action_callback' ] );
		add_action( 'wp_ajax_vrodos_delete_scene_action', [ $this, 'delete_scene_frontend_callback' ] );
		add_action( 'wp_ajax_vrodos_reorder_scenes_action', [ $this, 'reorder_scenes_callback' ] );
		add_action( 'wp_ajax_image_upload_action', [ $this, 'image_upload_action_callback' ] );
		add_action( 'wp_ajax_vrodos_compile_action', [ $this, 'compile_action_callback' ] );
		add_action( 'wp_ajax_vrodos_export_scene_zip_action', [ $this, 'export_scene_zip_action_callback' ] );
	}

	/**
	 * Saves the scene via AJAX.
	 */
	public function save_scene_async_action_callback() {
		$this->require_storage_schema();
		if ( ! check_ajax_referer( 'vrodos_scene_mutation', 'nonce', false ) ) {
			wp_send_json_error( 'Invalid security token.', 403 );
		}
		$scene_id = absint( $_POST['scene_id'] ?? 0 );
		if ( $scene_id <= 0 ) {
			wp_send_json_error( 'Invalid scene id.', 400 );
		}
		if ( 'vrodos_scene' !== get_post_type( $scene_id ) || ! current_user_can( 'edit_post', $scene_id ) ) {
			wp_send_json_error( 'Insufficient permissions.', 403 );
		}

		$scene_json = isset( $_POST['scene_json'] ) ? wp_unslash( $_POST['scene_json'] ) : '';
		if ( ! is_string( $scene_json ) || trim( $scene_json ) === '' ) {
			wp_send_json_error( 'Missing scene JSON.', 400 );
		}
		$scene_model = new Vrodos_Scene_Model( $scene_json );
		if ( ! $scene_model->is_valid() ) {
			wp_send_json_error( 'Invalid scene JSON: ' . $scene_model->get_error_message(), 400 );
		}

		$pending_screenshot_id = 0;
		// Stage the screenshot; its canonical reference switches only after the scene update succeeds.
		if ( isset( $_POST['scene_screenshot'] ) ) {
			$pending_screenshot_id = (int) VRodos_Upload_Manager::upload_scene_screenshot(
				$_POST['scene_screenshot'],
				'scene_' . $scene_id . '_featimg',
				$scene_id,
				'jpg'
			);

			if ( ! $pending_screenshot_id ) {
				wp_send_json_error( 'Scene screenshot upload failed.', 500 );
			}
		}

		// Save json of scene
		$scene_new_info = [
			'ID'           => $scene_id,
			'post_title'   => sanitize_text_field( wp_unslash( $_POST['scene_title'] ?? '' ) ),
			'post_content' => $scene_model->to_json()
		];

		$previous_scene = [ 'ID' => $scene_id, 'post_title' => (string) get_post_field( 'post_title', $scene_id ), 'post_content' => (string) get_post_field( 'post_content', $scene_id ) ];
		$res = wp_update_post( $scene_new_info, true );
		if ( is_wp_error( $res ) ) {
			if ( $pending_screenshot_id ) { VRodos_Storage_Manager::delete_attachment_if_owned_by( $pending_screenshot_id, 'scene', $scene_id ); }
			wp_send_json_error( 'Scene save failed: ' . $res->get_error_message(), 500 );
		}
		if ( ! $res ) {
			if ( $pending_screenshot_id ) { VRodos_Storage_Manager::delete_attachment_if_owned_by( $pending_screenshot_id, 'scene', $scene_id ); }
			wp_send_json_error( 'Scene save failed.', 500 );
		}
		if ( $pending_screenshot_id ) {
			$switched = VRodos_Storage_Manager::replace_attachment_references( $scene_id, 'scene', [ '_thumbnail_id' ], $pending_screenshot_id );
			if ( is_wp_error( $switched ) ) {
				wp_update_post( $previous_scene );
				wp_send_json_error( 'Scene screenshot switch failed: ' . $switched->get_error_message(), 500 );
			}
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
		$this->require_storage_schema();
		check_ajax_referer( 'post_nonce', 'nonce' );

		$scene_ids = array_map( 'absint', $_POST['scene_ids'] ?? [] );
		foreach ( $scene_ids as $order => $scene_id ) {
			if ( $scene_id > 0 && 'vrodos_scene' === get_post_type( $scene_id ) && current_user_can( 'edit_post', $scene_id ) ) {
				wp_update_post( [ 'ID' => $scene_id, 'menu_order' => $order ] );
			} else {
				wp_send_json_error( 'Insufficient permissions.', 403 );
			}
		}
		wp_send_json_success();
	}

	/**
	 * DELETE specific SCENE
	 */
	public function delete_scene_frontend_callback() {
		$this->require_storage_schema();
		if ( ! check_ajax_referer( 'vrodos_scene_mutation', 'nonce', false ) ) {
			wp_send_json_error( 'Invalid security token.', 403 );
		}
		$scene_id = absint( $_POST['scene_id'] ?? 0 );
		if ( ! $scene_id || 'vrodos_scene' !== get_post_type( $scene_id ) || ! current_user_can( 'delete_post', $scene_id ) ) {
			wp_send_json_error( 'Insufficient permissions.', 403 );
		}
		$title = get_the_title( $scene_id );
		VRodos_Storage_Manager::delete_owned_attachments( 'scene', $scene_id );
		wp_delete_post( $scene_id, true );
		wp_send_json_success( [ 'title' => $title ] );
	}

	/**
	 * Upload background image for a scene
	 */
	public function image_upload_action_callback() {
		$this->require_storage_schema();
		check_ajax_referer( 'vrodos_scene_upload_image_nonce' ) || wp_die( 'Security check failed.' );

		$project_id = absint( $_POST['projectid'] ?? 0 );
		$scene_id   = absint( $_POST['sceneid'] ?? 0 );

		if ( ! $project_id || ! $scene_id ) {
			wp_send_json_error( 'Invalid project or scene ID.', 400 );
		}
		if ( 'vrodos_game' !== get_post_type( $project_id ) || 'vrodos_scene' !== get_post_type( $scene_id ) || ! current_user_can( 'edit_post', $project_id ) || ! current_user_can( 'edit_post', $scene_id ) ) {
			wp_send_json_error( 'Insufficient permissions.', 403 );
		}

		$image_data = $_POST['image'] ?? '';
		$ext        = sanitize_key( $_POST['imagetype'] ?? 'jpg' );
		if ( ! in_array( $ext, [ 'jpg', 'jpeg', 'png', 'webp' ], true ) ) {
			wp_send_json_error( 'Unsupported scene background type.', 415 );
		}
		if ( ! is_string( $image_data ) || ! preg_match( '#^data:image/(?:jpeg|jpg|png|webp);base64,#i', $image_data ) ) {
			wp_send_json_error( 'Invalid scene background data.', 400 );
		}

		// Ensure we have a unique filename
		$hashed_filename = $project_id . '_' . time() . '_' . $scene_id . '_bg.' . $ext;

		// Decode base64 image
		$decoded_image = base64_decode( substr( $image_data, strpos( $image_data, ',' ) + 1 ), true );
		if ( ! is_string( $decoded_image ) || '' === $decoded_image ) {
			wp_send_json_error( 'Invalid scene background data.', 400 );
		}

		$mime          = in_array( $ext, [ 'jpg', 'jpeg' ], true ) ? 'image/jpeg' : 'image/' . $ext;
		$attachment_id = VRodos_Storage_Manager::store_attachment_bytes( (string) $decoded_image, $hashed_filename, $mime, $scene_id, 'scene', 'backgrounds' );
		if ( is_wp_error( $attachment_id ) ) {
			wp_send_json_error( $attachment_id->get_error_message(), 500 );
		}

		// Update the scene's background image meta
		$switched = VRodos_Storage_Manager::replace_attachment_references( $scene_id, 'scene', [ 'vrodos_scene_bg_image' ], (int) $attachment_id );
		if ( is_wp_error( $switched ) ) {
			wp_send_json_error( $switched->get_error_message(), 500 );
		}

		// Prepare the final normalized URL for the editor
		$final_path = VRodos_Storage_Manager::authoring_url_for_attachment( (int) $attachment_id );
		$final_path = ( new VRodos_URL_Normalizer() )->normalize( $final_path );

		wp_send_json( [ 'url' => $final_path ] );
	}

	/**
	 * Compile scene to A-Frame
	 */
	public function compile_action_callback() {
		$this->require_storage_schema();
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
		try {
			$result = ( new VRodos_Compiler_Manager() )->compile( $request );
		} catch ( Throwable $error ) {
			error_log( '[VRodos] Compiler initialization failed: ' . $error->getMessage() );
			wp_send_json_error(
				[ 'code' => 'runtime_contract_invalid', 'message' => 'Scene compilation is unavailable because the runtime contract is invalid.' ],
				500
			);
		}
		if ( is_wp_error( $result ) ) {
			$data   = $result->get_error_data();
			$status = is_array( $data ) ? absint( $data['status'] ?? 500 ) : 500;
			$error_payload = [ 'code' => $result->get_error_code(), 'message' => $result->get_error_message() ];
			if ( is_array( $data ) ) {
				$error_payload = array_merge( $error_payload, array_intersect_key( $data, array_flip( [ 'pending', 'ready', 'total', 'retryAfterMs' ] ) ) );
			}
			wp_send_json_error(
				$error_payload,
				$status > 0 ? $status : 500
			);
		}

		wp_send_json( $result->to_public_payload() );
	}

	/**
	 * Streams a static ZIP package for the selected compiled scene.
	 */
	public function export_scene_zip_action_callback(): void {
		$this->require_storage_schema();
		if ( ! check_ajax_referer( 'vrodos_export_scene_zip', 'nonce', false ) ) {
			wp_send_json_error( [ 'code' => 'invalid_nonce', 'message' => 'Export security check failed.' ], 403 );
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
			wp_send_json_error( [ 'code' => 'forbidden', 'message' => 'You are not allowed to export this scene.' ], 403 );
		}

		$project_term = get_term_by( 'slug', (string) $project->post_name, 'vrodos_scene_pgame' );
		if ( ! $project_term || is_wp_error( $project_term ) ) {
			wp_send_json_error( [ 'code' => 'missing_project_term', 'message' => 'Project has no scene taxonomy term.' ], 400 );
		}
		$scene_ids = array_map( 'absint', VRodos_Core_Manager::vrodos_get_all_sceneids_of_game( (int) $project_term->term_id ) );
		if ( ! in_array( $scene_id, $scene_ids, true ) ) {
			wp_send_json_error( [ 'code' => 'scene_project_mismatch', 'message' => 'Selected scene does not belong to this project.' ], 400 );
		}

		$package = ( new VRodos_Scene_Standalone_Exporter() )->build( $project_id, $scene_id );
		if ( is_wp_error( $package ) ) {
			$data   = $package->get_error_data();
			$status = is_array( $data ) ? absint( $data['status'] ?? 500 ) : 500;
			wp_send_json_error(
				[ 'code' => $package->get_error_code(), 'message' => $package->get_error_message() ],
				$status > 0 ? $status : 500
			);
		}

		$zip_path = $package['path'];
		$temp_dir = $package['temp_dir'];
		register_shutdown_function(
			static function () use ( $zip_path, $temp_dir ): void {
				if ( is_file( $zip_path ) ) {
					wp_delete_file( $zip_path );
				}
				if ( is_dir( $temp_dir ) ) {
					@rmdir( $temp_dir );
				}
			}
		);

		while ( ob_get_level() > 0 ) {
			ob_end_clean();
		}
		nocache_headers();
		header( 'Content-Type: application/zip' );
		header( 'Content-Disposition: attachment; filename="' . sanitize_file_name( $package['filename'] ) . '"' );
		header( 'Content-Length: ' . (string) filesize( $zip_path ) );
		header( 'X-Content-Type-Options: nosniff' );
		readfile( $zip_path );
		exit;
	}

	private function require_storage_schema(): void {
		if ( ! VRodos_Storage_Manager::storage_schema_ready() ) {
			wp_send_json_error( 'VRodos storage migration must be verified first.', 503 );
		}
	}
}
