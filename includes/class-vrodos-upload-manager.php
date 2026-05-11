<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Upload_Manager {
	/**
	 * Create extra 3D files for the asset.
	 */
	/**
	 * Create extra 3D files for the asset.
	 */
	public static function create_asset_3dfiles_extra_frontend( $asset_new_id, $project_id, $asset_cat_id ): void {
		// Upload and update DB
		$chunk_upload_token = isset( $_POST['glbChunkUploadToken'] ) ? sanitize_key( (string) wp_unslash( $_POST['glbChunkUploadToken'] ) ) : '';
		if ( $chunk_upload_token || ( isset( $_POST['glbFileInput'] ) && $_POST['glbFileInput'] ) || ( isset( $_FILES['multipleFilesInput'] ) && isset( $_FILES['multipleFilesInput']['error'][0] ) && $_FILES['multipleFilesInput']['error'][0] !== UPLOAD_ERR_NO_FILE ) ) {
			wp_raise_memory_limit( 'admin' );
			@set_time_limit( 300 );

			// Clear out all previous attachments only if we have a new upload
			$attachments = get_children(
				['post_parent' => $asset_new_id, 'post_type'   => 'attachment']
			);
			foreach ( $attachments as $attachment ) {
				if ( ! str_contains( $attachment->post_title, 'screenshot' ) ) {
					wp_delete_attachment( $attachment->ID, true );
				}
			}

			if ( $chunk_upload_token ) {
				$glb_file_id = self::import_chunked_glb_upload(
					$chunk_upload_token,
					'glb_' . $asset_new_id . '_' . $asset_cat_id . '.glb',
					$asset_new_id,
					$project_id
				);
			} else {
				$glb_file_id = self::upload_asset_text(
					$_POST['glbFileInput'] ?? null,
					'glb_' . $asset_new_id . '_' . $asset_cat_id . '.glb',
					$asset_new_id,
					$_FILES,
					0,
					$project_id
				);
			}

			if ( $glb_file_id ) {
				update_post_meta( $asset_new_id, 'vrodos_asset3d_glb', $glb_file_id );
			}
		}
	}

	/**
	 * Add images to the asset.
	 */
	/**
	 * Add images to the asset.
	 */
	public static function create_asset_add_images_frontend( $asset_id, $file ): void {
		$attachment_id = self::upload_img_vid_aud( $file, $asset_id );
		update_post_meta( $asset_id, 'vrodos_asset3d_poi_imgtxt_image', $attachment_id );
	}

	/**
	 * Add audio to the asset.
	 */
	/**
	 * Add audio to the asset.
	 */
	public static function create_asset_add_audio_frontend( $asset_new_id ): void {
		if ( isset( $_FILES['audioFileInput'] ) && $_FILES['audioFileInput']['error'] !== UPLOAD_ERR_NO_FILE ) {
			$attachment_audio_id = self::upload_img_vid_aud( $_FILES['audioFileInput'], $asset_new_id );
			update_post_meta( $asset_new_id, 'vrodos_asset3d_audio', $attachment_audio_id );
		}
	}

	/**
	 * Add video to the asset.
	 */
	/**
	 * Add video to the asset.
	 */
	public static function create_asset_add_video_frontend( $asset_new_id ): void {
		if ( isset( $_FILES['videoFileInput'] ) && $_FILES['videoFileInput']['error'] !== UPLOAD_ERR_NO_FILE ) {
			$attachment_video_id = self::upload_img_vid_aud( $_FILES['videoFileInput'], $asset_new_id );
			update_post_meta( $asset_new_id, 'vrodos_asset3d_video', $attachment_video_id );
		}
	}

	public static function create_asset_add_text_frontend( int $asset_id ): array {
		if ( ! isset( $_FILES['textAssetFileInput'] ) || (int) ( $_FILES['textAssetFileInput']['error'] ?? UPLOAD_ERR_NO_FILE ) === UPLOAD_ERR_NO_FILE ) {
			return [
				'success' => false,
				'error'   => 'No text file was uploaded.',
			];
		}

		$file = $_FILES['textAssetFileInput'];
		$format = class_exists( 'VRodos_Text_Asset_Helper' )
			? VRodos_Text_Asset_Helper::detect_format( (string) ( $file['name'] ?? '' ), (string) ( $file['type'] ?? '' ) )
			: '';
		if ( ! in_array( $format, [ 'txt', 'rtf' ], true ) ) {
			return [
				'success' => false,
				'error'   => 'Only TXT and RTF files are supported for 3D Text assets.',
			];
		}

		$attachment_id = self::upload_img_vid_aud( $file, $asset_id );
		if ( ! $attachment_id ) {
			return [
				'success' => false,
				'error'   => 'Text file upload failed.',
			];
		}

		update_post_meta( $asset_id, 'vrodos_asset3d_text_file', (int) $attachment_id );
		$path = get_attached_file( (int) $attachment_id );
		$result = class_exists( 'VRodos_Text_Asset_Helper' )
			? VRodos_Text_Asset_Helper::extract_from_file( is_string( $path ) ? $path : '', $format )
			: [
				'success' => false,
				'error'   => 'Text extraction helper is unavailable.',
			];

		if ( class_exists( 'VRodos_Text_Asset_Helper' ) ) {
			VRodos_Text_Asset_Helper::persist_extracted_text( $asset_id, $result, (int) $attachment_id );
		}

		return $result;
	}
	public static function register_hooks(): void {
		// All hooks related to file uploads
		add_filter( 'upload_dir', self::upload_dir_for_scenes_or_assets(...) );
		add_filter( 'intermediate_image_sizes', self::disable_imgthumbs_assets(...), 999 );
		add_filter( 'sanitize_file_name', self::overwrite_uploads(...), 10, 1 );
	}

	// Get the directory for media uploading of a scene or an asset
	// Get the directory for media uploading of a scene or an asset
	public static function upload_dir_for_scenes_or_assets( $args ) {

		if ( ! isset( $_REQUEST['post_id'] ) ) {
			return $args;
		}

		// Get the current post_id
		$post_id      = $_REQUEST['post_id'];
		$args['path'] = str_replace( $args['subdir'], '', $args['path'] );
		$args['url']  = str_replace( $args['subdir'], '', $args['url'] );

		$newdir = '/models';
		if ( get_post_type( $post_id ) === 'vrodos_scene' ) {
			$terms = get_the_terms( $post_id, 'vrodos_scene_pgame' );
			$slug   = ( ! is_wp_error( $terms ) && ! empty( $terms ) ) ? $terms[0]->slug : 'unknown';
			$newdir = '/' . $slug . '/scenes';
		} else {
			$pathData = get_post_meta( $post_id, 'vrodos_asset3d_pathData', true );
			$slug     = ! empty( $pathData ) ? $pathData : 'unknown';
			$newdir   = '/' . $slug . '/models';
		}

		$args['subdir'] = $newdir;
		$args['path']  .= $newdir;
		$args['url']   .= $newdir;

		return $args;
	}

	// Disable all auto created thumbnails for Assets3D
	// Disable all auto created thumbnails for Assets3D
	public static function disable_imgthumbs_assets( $image_sizes ) {

		// extra sizes
		$slider_image_sizes = [];
		// for ex: $slider_image_sizes = array( 'thumbnail', 'medium' );

		// instead of unset sizes, return your custom size (nothing)
		if ( isset( $_REQUEST['post_id'] ) && 'vrodos_asset3d' === get_post_type( $_REQUEST['post_id'] ) ) {
			return $slider_image_sizes;
		}

		return $image_sizes;
	}

	// Overwrite attachments
	// Overwrite attachments
	public static function overwrite_uploads( $name ) {

		// Parent id
		$post_parent_id = isset( $_REQUEST['post_id'] ) ? (int) $_REQUEST['post_id'] : 0;

		// Attachment posts that have as file similar to $name
		$attachments_to_remove = get_posts(
			['numberposts' => -1, 'post_type'   => 'attachment', 'meta_query'  => [['key'     => '_wp_attached_file', 'value'   => $name, 'compare' => 'LIKE']]]
		);

		// Delete attachments if they have the same parent
		foreach ( $attachments_to_remove as $attachment ) {

			if ( $attachment->post_parent == $post_parent_id ) {

				// Permanently delete attachment
				wp_delete_attachment( $attachment->ID, true );

			}
		}

		return $name;
	}

	public static function remove_allthumbs_sizes( $sizes, $metadata ): array {
		return [];
	}

	// Change directory for images and videos to uploads/Models
	public static function upload_img_vid_aud_directory( $dir ) {
		return ['path'   => $dir['basedir'] . '/models', 'url'    => $dir['baseurl'] . '/models', 'subdir' => '/models'] + $dir;
	}

	public static function upload_video_dir( $dir ) {
		return ['path'   => $dir['basedir'] . '/models/videos', 'url'    => $dir['baseurl'] . '/models/videos', 'subdir' => '/models/videos'] + $dir;
	}

	public static function upload_image_dir( $dir ) {
		return ['path'   => $dir['basedir'] . '/models/images', 'url'    => $dir['baseurl'] . '/models/images', 'subdir' => '/models/videos'] + $dir;
	}

	// Change general upload directory to /models
	public static function upload_filter( $args ) {

		$newdir = '/models';

		$args['path']   = str_replace( $args['subdir'], '', $args['path'] ); // remove default subdir
		$args['url']    = str_replace( $args['subdir'], '', $args['url'] );
		$args['subdir'] = $newdir;
		$args['path']  .= $newdir;
		$args['url']   .= $newdir;

		return $args;
	}

	// Upload image(s) or video or audio for a certain post_id (asset or scene3D)
	// Upload image(s) or video or audio for a certain post_id (asset or scene3D)
	public static function upload_img_vid_aud( $file, $parent_post_id ) {
		self::load_wp_admin_files();
		// For Images (Sprites in Unity)
		if ( $file['type'] === 'image/jpeg' || $file['type'] === 'image/png' ) {
			if ( ! str_contains( (string) $file['name'], 'sprite' ) ) {
				$hashed_prefix = md5( $parent_post_id . microtime() );
				$file['name']  = str_replace( '.jpg', $hashed_prefix . '_sprite.jpg', $file['name'] );
				$file['name']  = str_replace( '.png', $hashed_prefix . '_sprite.png', $file['name'] );
			}
		}
		// Set post_id for the upload directory filter.
		$_REQUEST['post_id'] = $parent_post_id;
		add_filter( 'upload_dir', self::upload_dir_for_scenes_or_assets(...) );
		add_filter( 'intermediate_image_sizes_advanced', self::remove_allthumbs_sizes(...), 10, 2 );
		$file_return = self::handle_asset_upload( $file );
		remove_filter( 'upload_dir', self::upload_dir_for_scenes_or_assets(...) );
		unset( $_REQUEST['post_id'] );
		// if file has been uploaded successfully
		if ( $file_return && empty( $file_return['error'] ) ) {
			$attachment_id = self::insert_attachment_post( $file_return, $parent_post_id );
			remove_filter( 'intermediate_image_sizes_advanced', self::remove_allthumbs_sizes(...), 10, 2 );
			if ( $attachment_id ) {
				return $attachment_id;
			}
		} else {
			// If the upload failed, we should still remove the filter to not affect other uploads.
			remove_filter( 'intermediate_image_sizes_advanced', self::remove_allthumbs_sizes(...), 10, 2 );
		}
		return false;
	}

	private static function load_wp_admin_files(): void {
		if ( ! function_exists( 'wp_generate_attachment_metadata' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
			require_once ABSPATH . 'wp-admin/includes/media.php';
			require_once ABSPATH . 'wp-admin/includes/image.php';
		}
	}

	private static function handle_asset_upload( $file_array ) {
		self::load_wp_admin_files();
		$upload_overrides = ['test_form' => false];
		$result = wp_handle_upload( $file_array, $upload_overrides );
		if ( isset( $result['error'] ) ) {
			error_log(
				sprintf(
					'VRodos Upload Error (handle_asset_upload): %s | file=%s | type=%s | size=%s | php_error=%s',
					$result['error'],
					(string) ( $file_array['name'] ?? '' ),
					(string) ( $file_array['type'] ?? '' ),
					(string) ( $file_array['size'] ?? '' ),
					(string) ( $file_array['error'] ?? '' )
				)
			);
		}
		return $result;
	}

	public static function import_chunked_glb_upload( string $token, string $target_name, int $parent_post_id, int $project_id ) {
		self::load_wp_admin_files();
		$token      = sanitize_key( $token );
		$upload_dir = wp_upload_dir();
		if ( $token === '' || ! empty( $upload_dir['error'] ) ) {
			return false;
		}

		$user_id     = get_current_user_id();
		$session_dir = trailingslashit( $upload_dir['basedir'] ) . 'vrodos-chunked-uploads/user-' . $user_id . '/' . $token;
		$source      = trailingslashit( $session_dir ) . 'upload.glb';
		$manifest    = trailingslashit( $session_dir ) . 'manifest.json';

		if ( ! is_file( $source ) || ! is_file( $manifest ) ) {
			error_log( 'VRodos Upload Error (import_chunked_glb_upload): missing completed chunk upload for token ' . $token );
			return false;
		}

		$manifest_data = json_decode( (string) file_get_contents( $manifest ), true );
		if ( ! is_array( $manifest_data ) || (int) ( $manifest_data['user_id'] ?? 0 ) !== $user_id ) {
			error_log( 'VRodos Upload Error (import_chunked_glb_upload): invalid chunk upload manifest for token ' . $token );
			return false;
		}

		$_REQUEST['post_id'] = $parent_post_id;
		add_filter( 'upload_dir', self::upload_dir_for_scenes_or_assets(...) );
		add_filter( 'intermediate_image_sizes_advanced', self::remove_allthumbs_sizes(...), 10, 2 );
		$target_upload_dir = wp_upload_dir();
		remove_filter( 'upload_dir', self::upload_dir_for_scenes_or_assets(...) );
		remove_filter( 'intermediate_image_sizes_advanced', self::remove_allthumbs_sizes(...), 10, 2 );
		unset( $_REQUEST['post_id'] );

		if ( ! empty( $target_upload_dir['error'] ) || ! wp_mkdir_p( $target_upload_dir['path'] ) ) {
			error_log( 'VRodos Upload Error (import_chunked_glb_upload): could not prepare final upload directory.' );
			return false;
		}

		$filename    = wp_unique_filename( $target_upload_dir['path'], sanitize_file_name( $target_name ) );
		$destination = trailingslashit( $target_upload_dir['path'] ) . $filename;
		if ( ! @rename( $source, $destination ) ) {
			if ( ! @copy( $source, $destination ) ) {
				error_log( 'VRodos Upload Error (import_chunked_glb_upload): could not move assembled GLB.' );
				return false;
			}
			wp_delete_file( $source );
		}

		$file_return = [
			'file' => $destination,
			'url'  => trailingslashit( $target_upload_dir['url'] ) . $filename,
			'type' => 'model/gltf-binary',
		];

		$attachment_id = self::insert_attachment_post( $file_return, $parent_post_id );
		self::delete_chunked_upload_session_dir( $session_dir, trailingslashit( $upload_dir['basedir'] ) . 'vrodos-chunked-uploads/user-' . $user_id );

		return $attachment_id;
	}

	private static function delete_chunked_upload_session_dir( string $dir, string $allowed_root ): void {
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

	public static function insert_attachment_post( $file_return, $parent_post_id ) {
		$filename        = $file_return['file'];
		$attachment      = ['post_mime_type' => $file_return['type'], 'post_title'     => preg_replace( '/\.[^.]+$/', '', basename( (string) $filename ) ), 'post_content'   => '', 'post_status'    => 'inherit', 'guid'           => $file_return['url']];
		$attachment_id   = wp_insert_attachment( $attachment, $file_return['file'], $parent_post_id, true );
		if ( is_wp_error( $attachment_id ) || ! $attachment_id ) {
			error_log(
				sprintf(
					'VRodos Upload Error (insert_attachment_post): failed to create attachment for %s | parent=%d | error=%s',
					(string) $filename,
					(int) $parent_post_id,
					is_wp_error( $attachment_id ) ? $attachment_id->get_error_message() : 'unknown'
				)
			);
			return false;
		}

		$is_media_metadata_target = wp_attachment_is_image( $attachment_id )
			|| str_starts_with( (string) $attachment['post_mime_type'], 'video/' )
			|| str_starts_with( (string) $attachment['post_mime_type'], 'audio/' );

		if ( $is_media_metadata_target ) {
			$attachment_data = wp_generate_attachment_metadata( $attachment_id, $filename );
			if ( is_wp_error( $attachment_data ) ) {
				error_log(
					sprintf(
						'VRodos Upload Error (attachment_metadata): %s | file=%s | parent=%d',
						$attachment_data->get_error_message(),
						(string) $filename,
						(int) $parent_post_id
					)
				);
			} else {
				wp_update_attachment_metadata( $attachment_id, $attachment_data );
			}
		}

		return $attachment_id;
	}

	public static function upload_scene_screenshot( $imagefile, $imgTitle, $scene_id, $type ) {
		self::load_wp_admin_files();

		// Set post_id for the upload directory filter. This ensures that both the deletion of the old file
		// and the upload of the new one happen in the correct scene-specific directory.
		$_REQUEST['post_id'] = $scene_id;
		add_filter( 'upload_dir', self::upload_dir_for_scenes_or_assets(...) );

		// First, delete the existing thumbnail if it exists.
		// wp_delete_attachment (with $force_delete = true) handles deleting the file from the filesystem.
		$thumbnail_id = get_post_thumbnail_id( $scene_id );
		if ( $thumbnail_id ) {
			wp_delete_attachment( $thumbnail_id, true );
		}

		// Now, proceed with uploading the new screenshot.
		add_filter( 'intermediate_image_sizes_advanced', self::remove_allthumbs_sizes(...), 10, 2 );
		add_filter( 'big_image_size_threshold', '__return_false' );

		$filename      = 'scene_' . $scene_id . '_sshot.' . $type;
		$decoded_image = base64_decode( substr( (string) $imagefile, strpos( (string) $imagefile, ',' ) + 1 ) );
		$file_return   = wp_upload_bits( $filename, null, $decoded_image );

		// Always remove filters after the operation.
		remove_filter( 'upload_dir', self::upload_dir_for_scenes_or_assets(...) );
		unset( $_REQUEST['post_id'] );

		if ( $file_return && empty( $file_return['error'] ) ) {
			$attachment_id = self::insert_attachment_post( $file_return, $scene_id );

			// Filters must be removed *after* the attachment is created.
			remove_filter( 'intermediate_image_sizes_advanced', self::remove_allthumbs_sizes(...), 10, 2 );
			remove_filter( 'big_image_size_threshold', '__return_false' );

			if ( $attachment_id ) {
				set_post_thumbnail( $scene_id, $attachment_id );
				return $attachment_id;
			}
		} else {
			// Ensure filters are removed even if the upload fails.
			remove_filter( 'intermediate_image_sizes_advanced', self::remove_allthumbs_sizes(...), 10, 2 );
			remove_filter( 'big_image_size_threshold', '__return_false' );
		}

		return false;
	}

	public static function upload_asset_screenshot( $image, $parentPostId, $projectId, $existing_screenshot_id = null ) {
		self::load_wp_admin_files();

		$image_data = (string) $image;
		$mime_type  = 'image/png';
		if ( preg_match( '/^data:(image\/(?:png|jpe?g|webp));base64,/', $image_data, $matches ) ) {
			$mime_type = strtolower( $matches[1] );
		}

		$extensions = [
			'image/jpeg' => 'jpg',
			'image/jpg'  => 'jpg',
			'image/png'  => 'png',
			'image/webp' => 'webp',
		];
		$extension  = $extensions[ $mime_type ] ?? 'png';
		$comma_pos  = strpos( $image_data, ',' );
		if ( $comma_pos === false ) {
			return false;
		}

		// Define a unique filename using a timestamp to prevent orphaned files
		// with identical names and naturally bust browser caching.
		$filename      = $parentPostId . '_sshot_' . time() . '.' . $extension;
		$decoded_image = base64_decode( substr( $image_data, $comma_pos + 1 ), true );
		if ( $decoded_image === false ) {
			return false;
		}

		// Set post_id for the upload directory filter.
		$_REQUEST['post_id'] = $parentPostId;
		add_filter( 'upload_dir', self::upload_dir_for_scenes_or_assets(...) );

		// If an old screenshot exists, delete it completely from the database and disk.
		if ( $existing_screenshot_id ) {
			wp_delete_attachment( $existing_screenshot_id, true );
		}

		// Prevent thumbnails from being generated for the new screenshot.
		add_filter( 'intermediate_image_sizes_advanced', self::remove_allthumbs_sizes(...), 10, 2 );
		add_filter( 'big_image_size_threshold', '__return_false' );

		// Upload the new screenshot file.
		$file_return = wp_upload_bits( $filename, null, $decoded_image );

		// Always remove filters after the operation.
		remove_filter( 'upload_dir', self::upload_dir_for_scenes_or_assets(...) );
		unset( $_REQUEST['post_id'] );

		if ( $file_return && empty( $file_return['error'] ) ) {
			$attachment_id = self::insert_attachment_post( $file_return, $parentPostId );

			remove_filter( 'intermediate_image_sizes_advanced', self::remove_allthumbs_sizes(...), 10, 2 );
			remove_filter( 'big_image_size_threshold', '__return_false' );

			if ( $attachment_id ) {
				update_post_meta( $parentPostId, 'vrodos_asset3d_screenimage', $attachment_id );
				return $attachment_id;
			}
		} else {
			remove_filter( 'intermediate_image_sizes_advanced', self::remove_allthumbs_sizes(...), 10, 2 );
			remove_filter( 'big_image_size_threshold', '__return_false' );
		}

		return false;
	}

	public static function upload_asset_text( $textContent, $textTitle, $parent_post_id, $TheFiles, $index_file, $project_id ) {
		self::load_wp_admin_files();
		wp_raise_memory_limit( 'admin' );
		@set_time_limit( 300 );
		$_REQUEST['post_id'] = $parent_post_id;
		add_filter( 'upload_dir', self::upload_dir_for_scenes_or_assets(...) );
		add_filter( 'intermediate_image_sizes_advanced', self::remove_allthumbs_sizes(...), 10, 2 );
		$file_return = false;
		if ( $textContent && $textContent !== '[object File]' ) {
			$filename    = sanitize_file_name( $textTitle );
			$file_return = wp_upload_bits( $filename, null, $textContent );
			if ( $file_return && ! isset( $file_return['error'] ) ) {
				$file_return['type'] = 'text/plain';
			} elseif ( isset( $file_return['error'] ) ) {
				error_log( "VRodos Upload Error (wp_upload_bits): " . $file_return['error'] );
			}
		} elseif ( isset( $TheFiles['multipleFilesInput']['tmp_name'][ $index_file ] ) ) {
			$file_array  = ['name'     => $TheFiles['multipleFilesInput']['name'][ $index_file ], 'type'     => $TheFiles['multipleFilesInput']['type'][ $index_file ], 'tmp_name' => $TheFiles['multipleFilesInput']['tmp_name'][ $index_file ], 'error'    => $TheFiles['multipleFilesInput']['error'][ $index_file ], 'size'     => $TheFiles['multipleFilesInput']['size'][ $index_file ]];
			$file_return = self::handle_asset_upload( $file_array );
		}
		remove_filter( 'upload_dir', self::upload_dir_for_scenes_or_assets(...) );
		remove_filter( 'intermediate_image_sizes_advanced', self::remove_allthumbs_sizes(...), 10, 2 );
		unset( $_REQUEST['post_id'] );
		if ( $file_return && empty( $file_return['error'] ) ) {
			$attachment_id = self::insert_attachment_post( $file_return, $parent_post_id );
			if ( $attachment_id ) {
				return $attachment_id;
			}
			error_log(
				sprintf(
					'VRodos Upload Error (upload_asset_text): attachment creation failed | parent=%d | title=%s | source=%s',
					(int) $parent_post_id,
					(string) $textTitle,
					isset( $TheFiles['multipleFilesInput']['name'][ $index_file ] ) ? (string) $TheFiles['multipleFilesInput']['name'][ $index_file ] : 'inline-text'
				)
			);
		} else {
			error_log(
				sprintf(
					'VRodos Upload Error (upload_asset_text): upload returned no attachment | parent=%d | title=%s | source=%s',
					(int) $parent_post_id,
					(string) $textTitle,
					isset( $TheFiles['multipleFilesInput']['name'][ $index_file ] ) ? (string) $TheFiles['multipleFilesInput']['name'][ $index_file ] : 'inline-text'
				)
			);
		}
		return false;
	}
}
