<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Explicit, entity-owned authoring uploads. No global WordPress upload filters. */
final class VRodos_Upload_Manager {
	public static function register_hooks(): void {}

	public static function create_asset_3dfiles_extra_frontend( $asset_new_id, $project_id, $asset_cat_id ): array {
		$asset_id   = absint( $asset_new_id );
		$project_id = absint( $project_id );
		$token      = isset( $_POST['assetImportUploadToken'] ) ? sanitize_key( (string) wp_unslash( $_POST['assetImportUploadToken'] ) ) : '';
		if ( '' !== $token && class_exists( 'VRodos_Asset_Import_Manager' ) ) {
			return VRodos_Asset_Import_Manager::consume_staged_upload( $token, $asset_id, $project_id, absint( $asset_cat_id ) );
		}
		$file = self::first_model_file();
		if ( null === $file ) {
			return [ 'success' => true, 'status' => 'none' ];
		}
		$extension = strtolower( pathinfo( (string) ( $file['name'] ?? '' ), PATHINFO_EXTENSION ) );
		if ( 'glb' !== $extension && class_exists( 'VRodos_Asset_Import_Manager' ) ) {
			return VRodos_Asset_Import_Manager::consume_uploaded_file_array( $file, $asset_id, $project_id, absint( $asset_cat_id ) );
		}
		$new_id = VRodos_Storage_Manager::store_uploaded_attachment( $file, $asset_id, 'asset', 'source' );
		if ( is_wp_error( $new_id ) ) {
			return [ 'success' => false, 'status' => 'failed', 'error' => $new_id->get_error_message() ];
		}
		$switched = VRodos_Storage_Manager::replace_attachment_references( $asset_id, 'asset', [ 'vrodos_asset3d_glb' ], (int) $new_id );
		if ( is_wp_error( $switched ) ) {
			return [ 'success' => false, 'status' => 'failed', 'error' => $switched->get_error_message() ];
		}
		return [ 'success' => true, 'status' => 'ready', 'attachment_id' => (int) $new_id ];
	}

	public static function create_asset_add_images_frontend( $asset_id, $file ): void {
		if ( ! self::file_extension_allowed( (array) $file, [ 'jpg', 'jpeg', 'png', 'webp', 'gif' ] ) ) {
			return;
		}
		$asset_id = absint( $asset_id );
		$id = self::upload_img_vid_aud( $file, $asset_id );
		if ( $id ) {
			VRodos_Storage_Manager::replace_attachment_references( $asset_id, 'asset', [ 'vrodos_asset3d_poi_imgtxt_image' ], $id );
		}
	}

	public static function create_asset_add_audio_frontend( $asset_id ): void {
		if ( isset( $_FILES['audioFileInput'] ) && self::file_extension_allowed( (array) $_FILES['audioFileInput'], [ 'mp3', 'm4a', 'wav', 'ogg', 'oga' ] ) ) {
			self::replace_asset_attachment( absint( $asset_id ), 'vrodos_asset3d_audio', $_FILES['audioFileInput'] );
		}
	}

	public static function create_asset_add_video_frontend( $asset_id ): void {
		if ( isset( $_FILES['videoFileInput'] ) && self::file_extension_allowed( (array) $_FILES['videoFileInput'], [ 'mp4', 'webm', 'ogv' ] ) ) {
			self::replace_asset_attachment( absint( $asset_id ), 'vrodos_asset3d_video', $_FILES['videoFileInput'] );
		}
	}

	public static function create_asset_add_text_frontend( int $asset_id ): array {
		$file = $_FILES['textAssetFileInput'] ?? null;
		if ( ! is_array( $file ) || UPLOAD_ERR_NO_FILE === (int) ( $file['error'] ?? UPLOAD_ERR_NO_FILE ) ) {
			return [ 'success' => false, 'error' => 'No text file was uploaded.' ];
		}
		$format = class_exists( 'VRodos_Text_Asset_Helper' )
			? VRodos_Text_Asset_Helper::detect_format( (string) ( $file['name'] ?? '' ), (string) ( $file['type'] ?? '' ) )
			: '';
		if ( ! in_array( $format, [ 'txt', 'rtf' ], true ) ) {
			return [ 'success' => false, 'error' => 'Only TXT and RTF files are supported for 3D Text assets.' ];
		}
		$new_id = VRodos_Storage_Manager::store_uploaded_attachment( $file, $asset_id, 'asset', 'source' );
		if ( is_wp_error( $new_id ) ) {
			return [ 'success' => false, 'error' => $new_id->get_error_message() ];
		}
		$switched = VRodos_Storage_Manager::replace_attachment_references( $asset_id, 'asset', [ 'vrodos_asset3d_text_file' ], (int) $new_id );
		if ( is_wp_error( $switched ) ) {
			return [ 'success' => false, 'error' => $switched->get_error_message() ];
		}
		$path   = get_attached_file( (int) $new_id );
		$result = VRodos_Text_Asset_Helper::extract_from_file( is_string( $path ) ? $path : '', $format );
		VRodos_Text_Asset_Helper::persist_extracted_text( $asset_id, $result, (int) $new_id );
		return $result;
	}

	public static function upload_img_vid_aud( $file, $parent_post_id ) {
		if ( ! self::file_extension_allowed( (array) $file, [ 'jpg', 'jpeg', 'png', 'webp', 'gif' ] ) ) {
			return false;
		}
		$result = VRodos_Storage_Manager::store_uploaded_attachment( (array) $file, absint( $parent_post_id ), 'asset', 'source' );
		return is_wp_error( $result ) ? false : (int) $result;
	}

	/** Imports a file produced by a trusted VRodos converter or staging action. */
	public static function insert_attachment_post( $file_return, $parent_post_id, string $role = '' ) {
		$owner_id   = absint( $parent_post_id );
		$owner_type = 'vrodos_scene' === get_post_type( $owner_id ) ? 'scene' : 'asset';
		$role       = '' !== $role ? $role : ( 'scene' === $owner_type ? 'backgrounds' : 'source' );
		$path       = (string) ( $file_return['file'] ?? '' );
		if ( '' === $path || ! is_file( $path ) ) {
			return false;
		}
		$mime = (string) ( $file_return['type'] ?? '' );
		if ( '' === $mime ) {
			$checked = wp_check_filetype( basename( $path ) );
			$mime    = (string) ( $checked['type'] ?? 'application/octet-stream' );
		}
		$result = VRodos_Storage_Manager::import_existing_file( $path, basename( $path ), $mime, $owner_id, $owner_type, $role );
		if ( is_wp_error( $result ) ) {
			return false;
		}
		wp_delete_file( $path );
		return (int) $result;
	}

	public static function upload_scene_screenshot( $imagefile, $img_title, $scene_id, $type ) {
		$scene_id = absint( $scene_id );
		$bytes    = self::decode_data_url( (string) $imagefile );
		if ( false === $bytes ) {
			return false;
		}
		$extension = in_array( strtolower( (string) $type ), [ 'jpg', 'jpeg', 'png', 'webp' ], true ) ? strtolower( (string) $type ) : 'png';
		$mime      = in_array( $extension, [ 'jpg', 'jpeg' ], true ) ? 'image/jpeg' : 'image/' . $extension;
		$new_id    = VRodos_Storage_Manager::store_attachment_bytes( $bytes, 'scene_' . $scene_id . '_sshot.' . $extension, $mime, $scene_id, 'scene', 'previews' );
		if ( is_wp_error( $new_id ) ) {
			return false;
		}
		return (int) $new_id;
	}

	public static function upload_asset_screenshot( $image, $parent_post_id, $project_id, $existing_screenshot_id = null ) {
		$asset_id = absint( $parent_post_id );
		$image    = (string) $image;
		$bytes    = self::decode_data_url( $image );
		if ( false === $bytes ) {
			return false;
		}
		$mime   = preg_match( '/^data:(image\/(?:png|jpe?g|webp));base64,/', $image, $match ) ? strtolower( $match[1] ) : 'image/png';
		$ext    = [ 'image/jpeg' => 'jpg', 'image/jpg' => 'jpg', 'image/webp' => 'webp' ][ $mime ] ?? 'png';
		$new_id = VRodos_Storage_Manager::store_attachment_bytes( $bytes, $asset_id . '_sshot_' . time() . '.' . $ext, $mime, $asset_id, 'asset', 'previews' );
		if ( is_wp_error( $new_id ) ) {
			return false;
		}
		$switched = VRodos_Storage_Manager::replace_attachment_references( $asset_id, 'asset', [ 'vrodos_asset3d_screenimage' ], (int) $new_id );
		if ( is_wp_error( $switched ) ) {
			return false;
		}
		return (int) $new_id;
	}

	public static function upload_asset_text( $text_content, $text_title, $parent_post_id, $files, $index_file, $project_id ) {
		$asset_id = absint( $parent_post_id );
		if ( $text_content && '[object File]' !== $text_content ) {
			$filename = sanitize_file_name( (string) $text_title );
			if ( 'txt' !== strtolower( pathinfo( $filename, PATHINFO_EXTENSION ) ) ) {
				$filename .= '.txt';
			}
			$result = VRodos_Storage_Manager::store_attachment_bytes( (string) $text_content, $filename, 'text/plain', $asset_id, 'asset', 'source' );
		} elseif ( isset( $files['multipleFilesInput']['tmp_name'][ $index_file ] ) ) {
			$result = VRodos_Storage_Manager::store_uploaded_attachment(
				[
					'name' => $files['multipleFilesInput']['name'][ $index_file ], 'type' => $files['multipleFilesInput']['type'][ $index_file ],
					'tmp_name' => $files['multipleFilesInput']['tmp_name'][ $index_file ], 'error' => $files['multipleFilesInput']['error'][ $index_file ],
					'size' => $files['multipleFilesInput']['size'][ $index_file ],
				],
				$asset_id,
				'asset',
				'source'
			);
		} else {
			return false;
		}
		return is_wp_error( $result ) ? false : (int) $result;
	}

	private static function first_model_file(): ?array {
		if ( ! isset( $_FILES['multipleFilesInput']['tmp_name'][0] ) || UPLOAD_ERR_NO_FILE === (int) ( $_FILES['multipleFilesInput']['error'][0] ?? UPLOAD_ERR_NO_FILE ) ) {
			return null;
		}
		return [
			'name' => $_FILES['multipleFilesInput']['name'][0], 'type' => $_FILES['multipleFilesInput']['type'][0],
			'tmp_name' => $_FILES['multipleFilesInput']['tmp_name'][0], 'error' => $_FILES['multipleFilesInput']['error'][0],
			'size' => $_FILES['multipleFilesInput']['size'][0],
		];
	}

	private static function replace_asset_attachment( int $asset_id, string $meta_key, array $file ): void {
		$new_id = VRodos_Storage_Manager::store_uploaded_attachment( $file, $asset_id, 'asset', 'source' );
		if ( is_wp_error( $new_id ) ) {
			return;
		}
		VRodos_Storage_Manager::replace_attachment_references( $asset_id, 'asset', [ $meta_key ], (int) $new_id );
	}

	private static function file_extension_allowed( array $file, array $extensions ): bool {
		return UPLOAD_ERR_OK === (int) ( $file['error'] ?? UPLOAD_ERR_NO_FILE )
			&& in_array( strtolower( pathinfo( (string) ( $file['name'] ?? '' ), PATHINFO_EXTENSION ) ), $extensions, true );
	}

	private static function decode_data_url( string $value ) {
		$comma = strpos( $value, ',' );
		return false === $comma ? false : base64_decode( substr( $value, $comma + 1 ), true );
	}
}
