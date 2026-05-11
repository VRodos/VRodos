<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

trait VRodos_Asset_CPT_Shared {
	private static function resolve_media_meta_url( $meta_value ): string {
		if ( empty( $meta_value ) ) {
			return '';
		}

		if ( is_numeric( $meta_value ) ) {
			return wp_get_attachment_url( (int) $meta_value ) ?: '';
		}

		return esc_url_raw( (string) $meta_value );
	}

	private static function describe_media_source_type( $meta_value ): string {
		if ( empty( $meta_value ) ) {
			return 'none';
		}

		return is_numeric( $meta_value ) ? 'local' : 'external';
	}

	private static function get_immerse_original_image_url( int $asset_id ): string {
		$original_url = (string) get_post_meta( $asset_id, '_immerse_original_url', true );
		return wp_http_validate_url( $original_url ) ? esc_url_raw( $original_url ) : '';
	}

	private static function get_audio_settings_defaults(): array {
		return [
			'playback_mode'  => 'interact',
			'loop'           => false,
			'volume'         => '1',
			'ref_distance'   => '2',
			'max_distance'   => '20',
			'rolloff_factor' => '1',
		];
	}

	private static function ensure_audio_asset_defaults( int $asset_id ): void {
		if ( $asset_id <= 0 ) {
			return;
		}

		update_post_meta( $asset_id, 'vrodos_asset3d_glb', VRodos_Core_Manager::get_builtin_audio_marker_url() );
		update_post_meta( $asset_id, 'vrodos_asset3d_screenimage', VRodos_Core_Manager::get_builtin_audio_thumbnail_url() );

		$defaults = self::get_audio_settings_defaults();
		if ( get_post_meta( $asset_id, 'vrodos_asset3d_audio_playback_mode', true ) === '' ) {
			update_post_meta( $asset_id, 'vrodos_asset3d_audio_playback_mode', $defaults['playback_mode'] );
		}
		if ( get_post_meta( $asset_id, 'vrodos_asset3d_audio_volume', true ) === '' ) {
			update_post_meta( $asset_id, 'vrodos_asset3d_audio_volume', $defaults['volume'] );
		}
		if ( get_post_meta( $asset_id, 'vrodos_asset3d_audio_ref_distance', true ) === '' ) {
			update_post_meta( $asset_id, 'vrodos_asset3d_audio_ref_distance', $defaults['ref_distance'] );
		}
		if ( get_post_meta( $asset_id, 'vrodos_asset3d_audio_max_distance', true ) === '' ) {
			update_post_meta( $asset_id, 'vrodos_asset3d_audio_max_distance', $defaults['max_distance'] );
		}
		if ( get_post_meta( $asset_id, 'vrodos_asset3d_audio_rolloff_factor', true ) === '' ) {
			update_post_meta( $asset_id, 'vrodos_asset3d_audio_rolloff_factor', $defaults['rolloff_factor'] );
		}
	}

	private static function sanitize_audio_float_setting( $value, float $min, float $max, float $default ): string {
		$float_value = is_numeric( $value ) ? (float) $value : $default;
		$float_value = max( $min, min( $max, $float_value ) );

		return rtrim( rtrim( number_format( $float_value, 3, '.', '' ), '0' ), '.' );
	}

	private static function get_ini_bytes( string $key ): int {
		$value = ini_get( $key );
		if ( $value === false || $value === '' ) {
			return 0;
		}

		return max( 0, (int) wp_convert_hr_to_bytes( $value ) );
	}

	private static function get_frontend_request_size_limits(): array {
		// By default, inherit PHP/WordPress upload limits instead of imposing a
		// plugin-specific request ceiling. Sites that sit behind a lower web
		// server/proxy limit can still set this filter explicitly.
		$server_request_limit = max(
			0,
			(int) apply_filters( 'vrodos_asset_editor_request_limit_bytes', 0 )
		);
		$post_max_limit       = self::get_ini_bytes( 'post_max_size' );
		$request_limit        = $server_request_limit;

		if ( $post_max_limit > 0 ) {
			$request_limit = $request_limit > 0 ? min( $request_limit, $post_max_limit ) : $post_max_limit;
		}

		$request_margin = max(
			0,
			(int) apply_filters( 'vrodos_asset_editor_request_margin_bytes', 0 )
		);
		$request_budget = $request_limit > 0 ? max( 0, $request_limit - $request_margin ) : 0;

		return [
			'limit_bytes'  => $request_limit,
			'budget_bytes' => $request_budget,
			'margin_bytes' => $request_margin,
		];
	}

	private static function build_frontend_redirect_url(): string {
		$redirect_url = wp_get_referer();
		if ( ! $redirect_url ) {
			$request_uri  = isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( (string) $_SERVER['REQUEST_URI'] ) : '/';
			$redirect_url = home_url( $request_uri );
		}

		return remove_query_arg( 'vrodos_notice', $redirect_url );
	}

	private static function redirect_with_frontend_notice( string $redirect_url, string $notice_code, int $submission_buffer_level = -1 ): void {
		self::perform_frontend_redirect( add_query_arg( 'vrodos_notice', sanitize_key( $notice_code ), $redirect_url ), $submission_buffer_level );
	}

	private static function begin_frontend_submission_buffer(): int {
		$buffer_level = ob_get_level();
		ob_start();
		return $buffer_level;
	}

	private static function cleanup_frontend_submission_buffer( int $buffer_level ): string {
		$buffer_output = '';
		while ( ob_get_level() > $buffer_level ) {
			$current_output = ob_get_contents();
			if ( is_string( $current_output ) && $current_output !== '' ) {
				$buffer_output = $current_output . $buffer_output;
			}
			ob_end_clean();
		}

		return trim( wp_strip_all_tags( $buffer_output ) );
	}

	private static function perform_frontend_redirect( string $redirect_url, int $submission_buffer_level = -1 ): void {
		$buffer_output = '';
		if ( $submission_buffer_level >= 0 ) {
			$buffer_output = self::cleanup_frontend_submission_buffer( $submission_buffer_level );
		}

		if ( $buffer_output !== '' ) {
			error_log( 'VRodos frontend asset submission emitted output before redirect: ' . substr( $buffer_output, 0, 500 ) );
		}

		if ( ! headers_sent( $sent_file, $sent_line ) ) {
			wp_safe_redirect( $redirect_url );
			exit;
		}

		error_log(
			sprintf(
				'VRodos frontend asset redirect fallback used because headers were already sent by %s:%d',
				(string) $sent_file,
				(int) $sent_line
			)
		);

		$redirect_url = esc_url_raw( $redirect_url );
		echo '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=' . esc_attr( $redirect_url ) . '"></head><body><script>window.location.replace(' . wp_json_encode( $redirect_url ) . ');</script></body></html>';
		exit;
	}

	private static function get_frontend_model_upload_error(): string {
		if ( empty( $_FILES['multipleFilesInput'] ) || ! isset( $_FILES['multipleFilesInput']['error'][0] ) ) {
			return '';
		}

		$upload_error = (int) $_FILES['multipleFilesInput']['error'][0];
		if ( $upload_error === UPLOAD_ERR_OK || $upload_error === UPLOAD_ERR_NO_FILE ) {
			return '';
		}

		if ( $upload_error === UPLOAD_ERR_INI_SIZE || $upload_error === UPLOAD_ERR_FORM_SIZE ) {
			return 'model-too-large';
		}

		return 'model-upload-failed';
	}

	private static function map_frontend_notice_message( string $notice_code, string $max_upload_label ): string {
		switch ( $notice_code ) {
			case 'glb-too-large':
			case 'model-too-large':
				return 'The selected model package is larger than the current upload limit (' . $max_upload_label . '). Please upload a smaller file or increase PHP upload_max_filesize/post_max_size.';
			case 'glb-upload-failed':
			case 'model-upload-failed':
				return 'The model upload failed before the asset could be saved. Please try again, or reduce the file size if this package is especially large.';
			default:
				return '';
		}
	}

	private static function asset_uses_legacy_non_glb_model( int $asset_id ): bool {
		foreach ( [ 'vrodos_asset3d_fbx', 'vrodos_asset3d_obj', 'vrodos_asset3d_mtl', 'vrodos_asset3d_pdb' ] as $meta_key ) {
			if ( get_post_meta( $asset_id, $meta_key, true ) ) {
				return true;
			}
		}

		return false;
	}
}
