<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Authenticated server-side proxy for virtual-production recording uploads.
 */
final class VRodos_MediaVerse_AJAX {
	private const SESSION_ACTION = 'vrodos_mediaverse_upload_session';
	private const UPLOAD_ACTION  = 'vrodos_mediaverse_upload_recording';

	public function __construct() {
		add_action( 'wp_ajax_' . self::SESSION_ACTION, [ $this, 'session_callback' ] );
		add_action( 'wp_ajax_' . self::UPLOAD_ACTION, [ $this, 'upload_callback' ] );
	}

	public function session_callback(): void {
		$project_id = absint( $_POST['projectId'] ?? 0 );
		$access     = $this->validate_access( $project_id );
		if ( is_wp_error( $access ) ) {
			$this->send_error( $access );
		}

		wp_send_json_success(
			[
				'nonce'       => wp_create_nonce( $this->nonce_action( $project_id ) ),
				'maxFileSize' => wp_max_upload_size(),
			]
		);
	}

	public function upload_callback(): void {
		$project_id = absint( $_POST['projectId'] ?? 0 );
		$access     = $this->validate_access( $project_id );
		if ( is_wp_error( $access ) ) {
			$this->send_error( $access );
		}
		if ( ! check_ajax_referer( $this->nonce_action( $project_id ), 'nonce', false ) ) {
			wp_send_json_error( [ 'code' => 'invalid_nonce', 'message' => 'Recording upload authorization expired.' ], 403 );
		}

		$file = $_FILES['recording'] ?? null;
		if ( ! is_array( $file ) || UPLOAD_ERR_OK !== (int) ( $file['error'] ?? UPLOAD_ERR_NO_FILE ) ) {
			wp_send_json_error( [ 'code' => 'invalid_recording', 'message' => 'No valid recording was received.' ], 400 );
		}

		$size = (int) ( $file['size'] ?? 0 );
		if ( $size <= 0 || $size > wp_max_upload_size() ) {
			wp_send_json_error( [ 'code' => 'recording_too_large', 'message' => 'The recording exceeds the WordPress upload limit.' ], 413 );
		}

		$filename = sanitize_file_name( (string) ( $file['name'] ?? 'vrodos-recording.webm' ) );
		$mime     = strtolower( trim( explode( ';', (string) ( $file['type'] ?? '' ), 2 )[0] ) );
		$allowed  = [ 'webm' => 'video/webm', 'mp4' => 'video/mp4' ];
		$checked  = wp_check_filetype( $filename, $allowed );
		if ( empty( $checked['type'] ) || ! in_array( $mime, array_values( $allowed ), true ) ) {
			wp_send_json_error( [ 'code' => 'invalid_recording_type', 'message' => 'Only WebM and MP4 recordings can be uploaded.' ], 415 );
		}

		$tmp_name = (string) ( $file['tmp_name'] ?? '' );
		if ( '' === $tmp_name || ! is_uploaded_file( $tmp_name ) || ! is_readable( $tmp_name ) ) {
			wp_send_json_error( [ 'code' => 'invalid_recording_file', 'message' => 'The uploaded recording could not be read.' ], 400 );
		}
		$detected_mime = function_exists( 'mime_content_type' ) ? strtolower( (string) mime_content_type( $tmp_name ) ) : '';
		if ( '' !== $detected_mime && 'application/octet-stream' !== $detected_mime && ! in_array( $detected_mime, array_values( $allowed ), true ) ) {
			wp_send_json_error( [ 'code' => 'invalid_recording_content', 'message' => 'The uploaded file is not a supported video recording.' ], 415 );
		}

		$user_id       = get_current_user_id();
		$node_url      = untrailingslashit( esc_url_raw( (string) get_user_meta( $user_id, 'mvnode_url', true ), [ 'http', 'https' ] ) );
		$node_token    = trim( (string) get_user_meta( $user_id, 'mvnode_token', true ) );
		$mv_project_id = sanitize_text_field( (string) get_post_meta( $project_id, 'mv_project_id', true ) );
		if ( '' === $node_url || '' === $node_token || '' === $mv_project_id || ! wp_http_validate_url( $node_url ) ) {
			wp_send_json_error( [ 'code' => 'mediaverse_not_configured', 'message' => 'MediaVerse upload is not configured for this user or project.' ], 400 );
		}

		$file_contents = file_get_contents( $tmp_name );
		if ( ! is_string( $file_contents ) ) {
			wp_send_json_error( [ 'code' => 'recording_read_failed', 'message' => 'The recording could not be read.' ], 500 );
		}
		wp_delete_file( $tmp_name );

		$boundary = '--------------------------' . wp_generate_password( 24, false, false );
		$body     = '--' . $boundary . "\r\n"
			. 'Content-Disposition: form-data; name="file"; filename="' . str_replace( '"', '', $filename ) . '"' . "\r\n"
			. 'Content-Type: ' . $mime . "\r\n\r\n"
			. $file_contents . "\r\n--" . $boundary . "--\r\n";

		$asset_url = add_query_arg(
			[
				'description'  => 'Recorded video from VRodos',
				'externalTool' => 'VRodos',
			],
			$node_url . '/dam/assets'
		);
		$asset_response = wp_safe_remote_post(
			$asset_url,
			[
				'timeout' => 180,
				'headers' => [
					'Authorization' => 'Bearer ' . $node_token,
					'Content-Type'  => 'multipart/form-data; boundary=' . $boundary,
				],
				'body'    => $body,
			]
		);
		if ( is_wp_error( $asset_response ) || ! in_array( wp_remote_retrieve_response_code( $asset_response ), [ 200, 201 ], true ) ) {
			wp_send_json_error( [ 'code' => 'mediaverse_asset_failed', 'message' => 'MediaVerse rejected the recording upload.' ], 502 );
		}

		$asset_payload = json_decode( (string) wp_remote_retrieve_body( $asset_response ), true );
		$asset_key     = sanitize_text_field( (string) ( $asset_payload['key'] ?? '' ) );
		if ( '' === $asset_key ) {
			wp_send_json_error( [ 'code' => 'mediaverse_asset_response', 'message' => 'MediaVerse returned no asset key.' ], 502 );
		}

		$project_response = wp_safe_remote_request(
			$node_url . '/dam/project/' . rawurlencode( $mv_project_id ) . '/projectOutput',
			[
				'method'  => 'PUT',
				'timeout' => 60,
				'headers' => [
					'Authorization' => 'Bearer ' . $node_token,
					'Content-Type'  => 'application/json',
				],
				'body'    => wp_json_encode( [ 'projectOutput' => [ $asset_key ] ] ),
			]
		);
		if ( is_wp_error( $project_response ) || ! in_array( wp_remote_retrieve_response_code( $project_response ), [ 200, 201, 204 ], true ) ) {
			wp_send_json_error( [ 'code' => 'mediaverse_project_failed', 'message' => 'The recording uploaded, but MediaVerse could not update the project output.' ], 502 );
		}

		wp_send_json_success( [ 'assetKey' => $asset_key ] );
	}

	private function validate_access( int $project_id ): true|WP_Error {
		if ( $project_id <= 0 || ! is_user_logged_in() ) {
			return new WP_Error( 'authentication_required', 'Sign in to WordPress to upload this recording.', [ 'status' => 401 ] );
		}
		$project = get_post( $project_id );
		if ( ! $project instanceof WP_Post || 'vrodos_game' !== $project->post_type ) {
			return new WP_Error( 'invalid_project', 'Invalid VRodos project.', [ 'status' => 400 ] );
		}
		if ( ! current_user_can( 'edit_post', $project_id ) ) {
			return new WP_Error( 'forbidden', 'You cannot upload recordings for this project.', [ 'status' => 403 ] );
		}
		$terms = wp_get_post_terms( $project_id, 'vrodos_game_type' );
		$slug  = ! is_wp_error( $terms ) && ! empty( $terms[0]->slug ) ? (string) $terms[0]->slug : '';
		if ( 'virtualproduction_games' !== $slug ) {
			return new WP_Error( 'invalid_project_type', 'Recording upload is only available for virtual-production projects.', [ 'status' => 400 ] );
		}

		return true;
	}

	private function nonce_action( int $project_id ): string {
		return 'vrodos_mediaverse_upload_' . $project_id . '_' . get_current_user_id();
	}

	private function send_error( WP_Error $error ): never {
		$data   = $error->get_error_data();
		$status = is_array( $data ) ? absint( $data['status'] ?? 400 ) : 400;
		wp_send_json_error( [ 'code' => $error->get_error_code(), 'message' => $error->get_error_message() ], $status );
	}
}
