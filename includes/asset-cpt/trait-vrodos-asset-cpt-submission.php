<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

trait VRodos_Asset_CPT_Submission_Controller {
	public function handle_asset_frontend_submission(): void {

		if ( ! isset( $_POST['submitted'] ) || ! isset( $_POST['post_nonce_field'] ) || ! wp_verify_nonce( $_POST['post_nonce_field'], 'post_nonce' ) ) {
			return;
		}

		// Permission check: must be logged in, and must be asset owner or admin
		if ( ! is_user_logged_in() ) {
			return;
		}
		$current_user_id = get_current_user_id();
		$editing_asset_id = isset( $_GET['vrodos_asset'] ) ? absint( $_GET['vrodos_asset'] ) : 0;
		if ( $editing_asset_id > 0 ) {
			$asset_author = get_post_field( 'post_author', $editing_asset_id );
			if ( $current_user_id != $asset_author && ! current_user_can( 'administrator' ) ) {
				return; // Not owner and not admin — reject
			}
		}

		$submission_buffer_level = self::begin_frontend_submission_buffer();

		$asset_id       = isset( $_GET['vrodos_asset'] ) ? sanitize_text_field( intval( $_GET['vrodos_asset'] ) ) : null;
		$project_id     = isset( $_GET['vrodos_game'] ) ? sanitize_text_field( intval( $_GET['vrodos_game'] ) ) : null;
		$game_post      = get_post( $project_id );
		$gameSlug       = $game_post ? $game_post->post_name : '';
		$assetPGame     = self::ensure_asset_project_term( $game_post );
		$assetPGameID   = $assetPGame ? $assetPGame->term_id : null;
		$assetPGameSlug = $assetPGame ? $assetPGame->slug : '';
		$isShared       = ( $assetPGameSlug && str_contains( $assetPGameSlug, 'joker' ) ) ? 'true' : 'false';

		$assetTitle   = self::sanitize_asset_title( $_POST['assetTitle'] ?? '' );
		$assetCatID   = isset( $_POST['term_id'] ) ? intval( $_POST['term_id'] ) : 0; // Legacy hidden input.
		if ( $assetCatID <= 0 && ! empty( $_POST['term_id_native'] ) ) {
			$asset_cat_term = get_term_by( 'slug', sanitize_text_field( (string) $_POST['term_id_native'] ), 'vrodos_asset3d_cat' );
			$assetCatID     = $asset_cat_term ? (int) $asset_cat_term->term_id : 0;
		}
		$assetCatTerm = get_term_by( 'id', $assetCatID, 'vrodos_asset3d_cat' );

		$assetback3dcolor = isset( $_POST['assetback3dcolor'] ) ? esc_attr( strip_tags( (string) $_POST['assetback3dcolor'] ) ) : '';
		$assettrs         = isset( $_POST['assettrs'] ) ? esc_attr( strip_tags( (string) $_POST['assettrs'] ) ) : '0,0,0,0,0,0,0,0,-100';
		$redirect_url     = self::build_frontend_redirect_url();

		$is_existing_assessment_asset = $editing_asset_id > 0 && self::is_assessment_asset( (int) $editing_asset_id );
		if ( $is_existing_assessment_asset ) {
			$assessment_term = get_term_by( 'slug', 'assessment', 'vrodos_asset3d_cat' );
			if ( $assessment_term ) {
				$assetCatID   = (int) $assessment_term->term_id;
				$assetCatTerm = $assessment_term;
			}
		} elseif ( $assetCatTerm && ( $assetCatTerm->slug ?? '' ) === 'assessment' ) {
			self::redirect_with_frontend_notice( $redirect_url, 'assessment-create-disabled', $submission_buffer_level );
		}

		$model_upload_error = self::get_frontend_model_upload_error();
		if ( $model_upload_error ) {
			self::redirect_with_frontend_notice( $redirect_url, $model_upload_error, $submission_buffer_level );
		}

		$assetCatIPRID = isset( $_POST['term_id_ipr'] ) ? intval( $_POST['term_id_ipr'] ) : 0; // Legacy hidden input.
		if ( $assetCatIPRID <= 0 && ! empty( $_POST['term_id_ipr_native'] ) ) {
			$asset_ipr_term = get_term_by( 'slug', sanitize_text_field( (string) $_POST['term_id_ipr_native'] ), 'vrodos_asset3d_ipr_cat' );
			$assetCatIPRID  = $asset_ipr_term ? (int) $asset_ipr_term->term_id : 0;
		}
		if ( $assetCatIPRID <= 0 ) {
			$default_ipr_term = get_terms(
				'vrodos_asset3d_ipr_cat',
				[
					'hide_empty' => false,
					'number'     => 1,
					'orderby'    => 'term_id',
					'order'      => 'ASC',
				]
			);
			if ( ! is_wp_error( $default_ipr_term ) && ! empty( $default_ipr_term ) ) {
				$assetCatIPRID = (int) $default_ipr_term[0]->term_id;
			}
		}

		// If the frontend bridge inputs fail to sync, abort safely instead of hard-failing the request.
		if ( ! $project_id || ! $assetPGameID || ! $assetCatID || ! $assetCatIPRID || ! $assetTitle ) {
			self::cleanup_frontend_submission_buffer( $submission_buffer_level );
			return;
		}

		$asset_updatedConf = 0;
		$has_new_model_upload = ( isset( $_FILES['multipleFilesInput'] ) && isset( $_FILES['multipleFilesInput']['error'][0] ) && (int) $_FILES['multipleFilesInput']['error'][0] !== UPLOAD_ERR_NO_FILE )
			|| ( isset( $_POST['glbFileInput'] ) && ! empty( $_POST['glbFileInput'] ) )
			|| ( isset( $_POST['glbChunkUploadToken'] ) && ! empty( $_POST['glbChunkUploadToken'] ) )
			|| ( isset( $_POST['assetImportUploadToken'] ) && ! empty( $_POST['assetImportUploadToken'] ) );
		// NEW Asset: submit info to backend

		if ( $asset_id == null ) {
			// It's a new Asset, let's create it (returns newly created ID, or 0 if nothing happened)
			$asset_id = self::create_asset_frontend( $assetPGameID, $assetCatID, $gameSlug, $assetCatIPRID, $assetTitle, $assetback3dcolor, $assettrs, '' );
		} else {
			// Edit an existing asset: Return true if updated, false if failed
			$asset_updatedConf = self::update_asset_frontend( $assetPGameID, $assetCatID, $asset_id, $assetCatIPRID, $assetTitle, $assetback3dcolor, $assettrs, '' );
		}

		// Upload 3D files
		if ( $asset_id != 0 || $asset_updatedConf == 1 ) {

			// NoCloning: Upload files from POST but check first
			// if any 3D files have been selected for upload or glb blob is present
			if ( $has_new_model_upload ) {
				$model_upload_result = VRodos_Upload_Manager::create_asset_3dfiles_extra_frontend( $asset_id, $project_id, $assetCatID );
				if ( empty( $model_upload_result['success'] ) ) {
					self::redirect_with_frontend_notice( $redirect_url, 'model-upload-failed', $submission_buffer_level );
				}

				$model_import_status = (string) ( $model_upload_result['status'] ?? '' );
				if ( ! in_array( $model_import_status, [ 'pending', 'running' ], true ) && ! get_post_meta( $asset_id, 'vrodos_asset3d_glb', true ) ) {
					self::redirect_with_frontend_notice( $redirect_url, 'model-upload-failed', $submission_buffer_level );
				}
			}

			update_post_meta( $asset_id, 'vrodos_asset3d_isJoker', $isShared );

			// Invalidate all Assets List transients
			global $wpdb;
			$wpdb->query( "DELETE FROM $wpdb->options WHERE option_name LIKE '_transient_vrodos_assets_%'" );
			$wpdb->query( "DELETE FROM $wpdb->options WHERE option_name LIKE '_transient_timeout_vrodos_assets_%'" );
		}

		if ( isset( $_POST['sshotFileInput'] ) && ! empty( $_POST['sshotFileInput'] ) ) {
			// Check if a screenshot already exists to perform an in-place update.
			$existing_screenshot_id = get_post_meta( $asset_id, 'vrodos_asset3d_screenimage', true );
			VRodos_Upload_Manager::upload_asset_screenshot( $_POST['sshotFileInput'], $asset_id, $project_id, $existing_screenshot_id );
		}

		// Save custom parameters according to asset type.
		if ( $assetCatTerm ) {
			switch ( $assetCatTerm->slug ) {
			case 'audio':
				VRodos_Upload_Manager::create_asset_add_audio_frontend( $asset_id );
				self::ensure_audio_asset_defaults( (int) $asset_id );
				$audio_defaults = self::get_audio_settings_defaults();
				$audio_playback_mode = isset( $_POST['audio_playback_mode'] ) ? sanitize_key( (string) $_POST['audio_playback_mode'] ) : $audio_defaults['playback_mode'];
				if ( ! in_array( $audio_playback_mode, [ 'autoplay', 'interact' ], true ) ) {
					$audio_playback_mode = $audio_defaults['playback_mode'];
				}
				update_post_meta( $asset_id, 'vrodos_asset3d_audio_playback_mode', $audio_playback_mode );
				update_post_meta( $asset_id, 'vrodos_asset3d_audio_loop', isset( $_POST['audio_loop_checkbox'] ) );
				update_post_meta( $asset_id, 'vrodos_asset3d_audio_volume', self::sanitize_audio_float_setting( $_POST['audio_volume'] ?? $audio_defaults['volume'], 0.0, 1.0, (float) $audio_defaults['volume'] ) );
				update_post_meta( $asset_id, 'vrodos_asset3d_audio_ref_distance', self::sanitize_audio_float_setting( $_POST['audio_ref_distance'] ?? $audio_defaults['ref_distance'], 0.1, 1000.0, (float) $audio_defaults['ref_distance'] ) );
				update_post_meta( $asset_id, 'vrodos_asset3d_audio_max_distance', self::sanitize_audio_float_setting( $_POST['audio_max_distance'] ?? $audio_defaults['max_distance'], 0.1, 10000.0, (float) $audio_defaults['max_distance'] ) );
				update_post_meta( $asset_id, 'vrodos_asset3d_audio_rolloff_factor', self::sanitize_audio_float_setting( $_POST['audio_rolloff_factor'] ?? $audio_defaults['rolloff_factor'], 0.0, 10.0, (float) $audio_defaults['rolloff_factor'] ) );
				break;

			case 'video':
				if ( isset( $_FILES['videoFileInput'] ) ) {
					VRodos_Upload_Manager::create_asset_add_video_frontend( $asset_id );
				}
				if ( isset( $_POST['videoSshotFileInput'] ) ) {
					VRodos_Upload_Manager::upload_asset_screenshot( $_POST['videoSshotFileInput'], $asset_id, $project_id );
				}
				update_post_meta( $asset_id, 'vrodos_asset3d_video_title', sanitize_text_field( $_POST['videoTitle'] ?? '' ) );
				update_post_meta( $asset_id, 'vrodos_asset3d_video_autoloop', isset( $_POST['video_autoloop_checkbox'] ) );
				break;

			case 'poi-imagetext':
				if ( isset( $_FILES['imageFileInput'] ) && $_FILES['imageFileInput']['error'] != 4 ) {
					VRodos_Upload_Manager::create_asset_add_images_frontend( $asset_id, $_FILES['imageFileInput'] );
				}

				update_post_meta( $asset_id, 'vrodos_asset3d_poi_imgtxt_title', sanitize_text_field( $_POST['poiImgTitle'] ?? '' ) );
				update_post_meta( $asset_id, 'vrodos_asset3d_poi_imgtxt_content', sanitize_text_field( $_POST['poiImgDescription'] ?? '' ) );

				break;

			case 'image':
				$image_file = $_FILES['imageFlatFileInput'] ?? [];
				$restore_original_image = ! empty( $_POST['restoreImageOriginalUrl'] );
				$original_image_url     = self::get_immerse_original_image_url( $asset_id );
				if ( $restore_original_image && $original_image_url !== '' ) {
					update_post_meta( $asset_id, 'vrodos_asset3d_image', $original_image_url );
					update_post_meta( $asset_id, 'vrodos_asset3d_screenimage', $original_image_url );
					delete_post_thumbnail( $asset_id );
				} elseif ( ! empty( $image_file ) && ( $image_file['error'] ?? 4 ) != 4 ) {
					$attachment_id = VRodos_Upload_Manager::upload_img_vid_aud( $image_file, $asset_id );
					if ( $attachment_id ) {
						update_post_meta( $asset_id, 'vrodos_asset3d_image', $attachment_id );
						update_post_meta( $asset_id, 'vrodos_asset3d_screenimage', $attachment_id );
						set_post_thumbnail( $asset_id, $attachment_id );
					}
				}
				break;

			case '3d-text':
				$has_text_upload = isset( $_FILES['textAssetFileInput'] ) && (int) ( $_FILES['textAssetFileInput']['error'] ?? UPLOAD_ERR_NO_FILE ) !== UPLOAD_ERR_NO_FILE;
				if ( $has_text_upload ) {
					$result = VRodos_Upload_Manager::create_asset_add_text_frontend( (int) $asset_id );
					if ( empty( $result['success'] ) ) {
						update_post_meta( $asset_id, 'vrodos_asset3d_text_extract_error', (string) ( $result['error'] ?? 'Text extraction failed.' ) );
					}
				} elseif ( isset( $_POST['textAssetContent'] ) && class_exists( 'VRodos_Text_Asset_Helper' ) ) {
					$text_result = VRodos_Text_Asset_Helper::normalize_manual_text( (string) wp_unslash( $_POST['textAssetContent'] ) );
					VRodos_Text_Asset_Helper::persist_extracted_text( (int) $asset_id, $text_result );
					if ( empty( $text_result['success'] ) ) {
						delete_post_meta( $asset_id, 'vrodos_asset3d_text_content' );
					}
				}
				break;

			case 'poi-link':
				update_post_meta( $asset_id, 'vrodos_asset3d_link', $_POST['assetLinkInput'] ?? '' );
				break;

			case 'chat':
				update_post_meta( $asset_id, 'vrodos_asset3d_poi_chattxt_title', $_POST['poiChatTitle'] ?? '' );
				update_post_meta( $asset_id, 'vrodos_asset3d_poi_chatnum_people', $_POST['poiChatNumPeople'] ?? '' );
				update_post_meta( $asset_id, 'vrodos_asset3d_poi_chatbut_indicators', isset( $_POST['poiChatIndicators'] ) );
				break;

			default:
				break;
			}
		}

		// Audio: To add
		if ( ! isset( $_GET['vrodos_asset'] ) ) {
			$redirect_url = add_query_arg( 'vrodos_asset', $asset_id, $redirect_url );
		}
		self::perform_frontend_redirect( $redirect_url, $submission_buffer_level );
	}

	public static function create_asset_frontend( $asset_pgame_id, $asset_cat_id, $game_slug, $asset_cat_ipr_id, $asset_title, $asset_back_3d_color, $asset_trs, $asset_description ) {
		$asset_taxonomies = ['vrodos_asset3d_pgame'   => [$asset_pgame_id], 'vrodos_asset3d_cat'     => [$asset_cat_id], 'vrodos_asset3d_ipr_cat' => [$asset_cat_ipr_id]];

		$asset_information = ['post_title'   => $asset_title, 'post_content' => $asset_description, 'post_type'    => 'vrodos_asset3d', 'post_status'  => 'publish', 'tax_input'    => $asset_taxonomies];

		$asset_id = wp_insert_post( $asset_information );
		update_post_meta( $asset_id, 'vrodos_asset3d_pathData', $game_slug );
		self::update_asset_meta( $asset_id, $asset_back_3d_color, $asset_trs );

		return $asset_id ?: 0;
	}

	public static function update_asset_frontend( $asset_pgame_id, $asset_cat_id, $asset_id, $asset_cat_ipr_id, $asset_title, $asset_back_3d_color, $asset_trs, $asset_description ) {
		$asset_taxonomies = ['vrodos_asset3d_pgame'   => [$asset_pgame_id], 'vrodos_asset3d_cat'     => [$asset_cat_id], 'vrodos_asset3d_ipr_cat' => [$asset_cat_ipr_id]];

		$data = ['ID'           => $asset_id, 'post_title'   => $asset_title, 'post_content' => $asset_description, 'tax_input'    => $asset_taxonomies];

		wp_update_post( $data );
		self::update_asset_meta( $asset_id, $asset_back_3d_color, $asset_trs );

		return 1;
	}

	public static function update_asset_meta( $asset_id, $asset_back_3d_color, $asset_trs ): void {
		update_post_meta( $asset_id, 'vrodos_asset3d_back3dcolor', $asset_back_3d_color );
		update_post_meta( $asset_id, 'vrodos_asset3d_assettrs', $asset_trs );
	}

	private static function sanitize_asset_title( $value ): string {
		if ( is_array( $value ) ) {
			return '';
		}

		$title = trim( sanitize_text_field( wp_unslash( (string) $value ) ) );

		if ( function_exists( 'mb_strlen' ) && function_exists( 'mb_substr' ) ) {
			if ( mb_strlen( $title ) > self::ASSET_TITLE_MAX_LENGTH ) {
				return mb_substr( $title, 0, self::ASSET_TITLE_MAX_LENGTH );
			}

			return $title;
		}

		return strlen( $title ) > self::ASSET_TITLE_MAX_LENGTH ? substr( $title, 0, self::ASSET_TITLE_MAX_LENGTH ) : $title;
	}

	public static function prepare_asset_editor_template_data(): array {
		$data = [];

		$data['asset_id']   = isset( $_GET['vrodos_asset'] ) ? sanitize_text_field( intval( $_GET['vrodos_asset'] ) ) : null;
		$data['project_id'] = isset( $_GET['vrodos_game'] ) ? sanitize_text_field( intval( $_GET['vrodos_game'] ) ) : null;
		$data['asset_title_max_length'] = self::ASSET_TITLE_MAX_LENGTH;

		$data['isUserloggedIn'] = is_user_logged_in();
		$data['current_user']   = wp_get_current_user();
		$data['isUserAdmin']    = current_user_can( 'administrator' );
		$data['isOwner']        = $data['current_user']->ID == get_post_field( 'post_author', $data['asset_id'] );

		if ( ! $data['asset_id'] ) {
			$data['isOwner'] = true;
		}

		$data['isEditable'] = false;
		$data['author_id']  = null;
		if ( $data['isUserloggedIn'] ) {
			if ( ! isset( $_GET['vrodos_asset'] ) ) {
				$data['isEditable'] = true;
				$data['author_id']  = $data['current_user']->ID;
			} elseif ( $data['isUserAdmin'] || $data['isOwner'] ) {
				$data['isEditable'] = true;
				$data['author_id']  = get_post_field( 'post_author', $data['asset_id'] );
			}
		}

		$data['isEditMode'] = ! isset( $_GET['preview'] ) || $_GET['preview'] !== '1';

		$request_size_limits              = self::get_frontend_request_size_limits();
		$data['request_max_bytes']        = $request_size_limits['budget_bytes'];
		$data['request_max_label']        = size_format( $data['request_max_bytes'], 0 );
		$data['request_limit_bytes']      = $request_size_limits['limit_bytes'];
		$data['request_limit_label']      = size_format( $data['request_limit_bytes'], 0 );
		$data['request_margin_bytes']     = $request_size_limits['margin_bytes'];
		$data['request_margin_label']     = size_format( $data['request_margin_bytes'], 0 );
		$data['php_max_upload_bytes']     = wp_max_upload_size();
		$data['max_upload_bytes']         = $data['request_max_bytes'] > 0
			? min( $data['php_max_upload_bytes'], $data['request_max_bytes'] )
			: $data['php_max_upload_bytes'];
		$data['max_upload_label']         = size_format( $data['max_upload_bytes'], 0 );
		$data['asset_notice_code'] = isset( $_GET['vrodos_notice'] ) ? sanitize_key( (string) $_GET['vrodos_notice'] ) : '';
		$data['asset_notice_type'] = 'error';
		$data['asset_notice_message'] = self::map_frontend_notice_message( $data['asset_notice_code'], $data['max_upload_label'] );
		$data['asset_import_status'] = [];

		$game_post            = get_post( $data['project_id'] );
		$data['game_post']    = $game_post;
		$gameSlug             = $game_post ? $game_post->post_name : '';
		$assetPGame           = self::ensure_asset_project_term( $game_post );
		$data['assetPGameID'] = $assetPGame ? $assetPGame->term_id : null;

		// Terminology update: isJoker -> isShared
		$assetPGameSlug   = $assetPGame ? $assetPGame->slug : '';
		$data['isShared'] = ( str_contains( $assetPGameSlug, 'joker' ) ) ? 'true' : 'false';

		$all_game_category     = get_the_terms( $data['project_id'], 'vrodos_game_type' );
		$data['game_category'] = ( ! is_wp_error( $all_game_category ) && ! empty( $all_game_category ) ) ? $all_game_category[0]->slug : null;

		$scene_id           = isset( $_GET['vrodos_scene'] ) ? sanitize_text_field( intval( $_GET['vrodos_scene'] ) ) : null;
		$editscenePage      = VRodos_Core_Manager::vrodos_getEditpage( 'scene' );
		$edit_scene_page_id = $editscenePage ? $editscenePage[0]->ID : null;

		$perma_structure     = get_option( 'permalink_structure' );
		$parameter_Scenepass = $perma_structure ? '?vrodos_scene=' : '&vrodos_scene=';

		$data['goBackToLink'] = $scene_id && $edit_scene_page_id
			? get_permalink( $edit_scene_page_id ) . $parameter_Scenepass . $scene_id . '&vrodos_game=' . $data['project_id'] . '&scene_type=' . ( $_GET['scene_type'] ?? '' )
			: home_url( '/vrodos-assets-list-page/?' ) . ( ! isset( $_GET['singleproject'] ) ? 'vrodos_game=' : 'vrodos_project_id=' ) . $data['project_id'];

		// Prepare taxonomy and meta data for the template
		self::prepare_taxonomy_data( $data );
		self::prepare_meta_data( $data );

		// Set default values for new assets
		$data['glb_file_name']             = null;
		$data['back_3d_color']             = '#ffffff';
		$data['asset_title_value']         = '';
		$data['asset_description_value']   = '';
		$data['asset_back_3d_color_saved'] = '#FFFFFF';
		$data['assettrs_saved']            = '0,0,0,0,0,0,0,0,-100';
		$data['dropdownHeading']           = 'Select a category';

		// Prepare image URLs for the template
		$data['no_img_path_url'] = VRodos_Path_Manager::image_url( 'ui/ic_sshot.png' );
		$data['login_promo_url'] = VRodos_Path_Manager::image_url( 'screenshots/authtoolimage.jpg' );
		$data['glb_icon_url']    = VRodos_Path_Manager::image_url( 'ui/cube.png' );
		$data['audio_icon_url']  = VRodos_Path_Manager::image_url( 'ui/audio.png' );

		if ( $data['asset_id'] != null ) {
			$saved_category_terms = wp_get_post_terms( $data['asset_id'], 'vrodos_asset3d_cat' );
			if ( ! is_wp_error( $saved_category_terms ) && ! empty( $saved_category_terms ) && ( $saved_category_terms[0]->slug ?? '' ) === 'audio' ) {
				self::ensure_audio_asset_defaults( (int) $data['asset_id'] );
			}

			$assetpostMeta                     = get_post_meta( $data['asset_id'] );
			$data['back_3d_color']             = isset( $assetpostMeta['vrodos_asset3d_back3dcolor'] ) ? $assetpostMeta['vrodos_asset3d_back3dcolor'][0] : '#ffffff';
			$asset_3d_files                    = VRodos_Core_Manager::get_3D_model_files( $assetpostMeta, $data['asset_id'] );
			$data['glb_file_name']             = $asset_3d_files['glb'];
			$data['dropdownHeading']           = 'Category';
			$data['asset_title_value']         = get_the_title( $data['asset_id'] );
			$data['asset_description_value']   = get_post_field( 'post_content', $data['asset_id'] );
			$data['asset_back_3d_color_saved'] = get_post_meta( $data['asset_id'], 'vrodos_asset3d_back3dcolor', true ) ?: '#FFFFFF';
			$data['assettrs_saved']            = get_post_meta( $data['asset_id'], 'vrodos_asset3d_assettrs', true ) ?: '0,0,0,0,0,0,0,0,-100';

			if ( empty( $data['glb_file_name'] ) && self::asset_uses_legacy_non_glb_model( (int) $data['asset_id'] ) ) {
				$data['asset_notice_type'] = 'error';
				$data['asset_notice_message'] = 'This asset still uses a legacy non-GLB 3D format. Preview and placement now require a GLB upload.';
			}

			if ( class_exists( 'VRodos_Asset_Import_Manager' ) ) {
				$data['asset_import_status'] = VRodos_Asset_Import_Manager::status_for_asset( (int) $data['asset_id'] );
			}
		}

		return $data;
	}

	private static function prepare_taxonomy_data( &$data ): void {
		$ids_to_exclude = [];
		$terms_to_exclude = [ 'assessment' ];
		if ( $data['game_category'] === 'virtualproduction_games' ) {
			$terms_to_exclude[] = 'chat';
		}

		$get_terms_to_exclude = get_terms(
			[
				'fields'   => 'ids',
				'slug'     => $terms_to_exclude,
				'taxonomy' => 'vrodos_asset3d_cat',
			]
		);
		if ( ! is_wp_error( $get_terms_to_exclude ) && count( $get_terms_to_exclude ) > 0 ) {
			$ids_to_exclude = $get_terms_to_exclude;
		}

		$data['cat_terms']      = get_terms(
			'vrodos_asset3d_cat',
			['hide_empty' => false, 'exclude'    => $ids_to_exclude]
		);
		$data['saved_term']     = wp_get_post_terms( $data['asset_id'], 'vrodos_asset3d_cat' );
		$data['is_assessment_asset'] = ! is_wp_error( $data['saved_term'] ) && ! empty( $data['saved_term'] ) && ( $data['saved_term'][0]->slug ?? '' ) === 'assessment';
		$data['saved_ipr_term'] = wp_get_post_terms( $data['asset_id'], 'vrodos_asset3d_ipr_cat' );
		$data['cat_ipr_terms']  = get_terms( 'vrodos_asset3d_ipr_cat', ['get' => 'all'] );
		if ( empty( $data['saved_ipr_term'] ) && ! empty( $data['cat_ipr_terms'] ) && ! is_wp_error( $data['cat_ipr_terms'] ) ) {
			$data['saved_ipr_term'] = [ $data['cat_ipr_terms'][0] ];
		}
	}

	private static function ensure_asset_project_term( $game_post ) {
		if ( ! $game_post || empty( $game_post->post_name ) ) {
			return null;
		}

		$game_slug  = $game_post->post_name;
		$game_title = $game_post->post_title ?: $game_slug;
		$asset_term = get_term_by( 'slug', $game_slug, 'vrodos_asset3d_pgame' );

		if ( $asset_term ) {
			return $asset_term;
		}

		$inserted_term = wp_insert_term(
			$game_title,
			'vrodos_asset3d_pgame',
			['description' => '-', 'slug' => $game_slug]
		);

		if ( is_wp_error( $inserted_term ) ) {
			$existing_id = $inserted_term->get_error_data( 'term_exists' );
			if ( $existing_id ) {
				return get_term( $existing_id, 'vrodos_asset3d_pgame' );
			}

			return null;
		}

		return get_term( $inserted_term['term_id'], 'vrodos_asset3d_pgame' );
	}

	private static function prepare_meta_data( &$data ): void {
		$asset_id = $data['asset_id'];

		// Video
		$videoID                       = get_post_meta( $asset_id, 'vrodos_asset3d_video', true );
		$video_attachment_post         = is_numeric( $videoID ) ? get_post( (int) $videoID ) : null;
		$data['video_attachment_file'] = self::resolve_media_meta_url( $videoID );
		$data['video_title']           = get_post_meta( $asset_id, 'vrodos_asset3d_video_title', true );
		$data['video_autoloop']        = get_post_meta( $asset_id, 'vrodos_asset3d_video_autoloop', true ) ? 'checked' : '';

		// Audio
		$audio_defaults                = self::get_audio_settings_defaults();
		$audioID                       = get_post_meta( $asset_id, 'vrodos_asset3d_audio', true );
		$data['audio_attachment_file'] = self::resolve_media_meta_url( $audioID );
		$data['audio_playback_mode']   = get_post_meta( $asset_id, 'vrodos_asset3d_audio_playback_mode', true ) ?: $audio_defaults['playback_mode'];
		$data['audio_loop']            = get_post_meta( $asset_id, 'vrodos_asset3d_audio_loop', true ) ? 'checked' : '';
		$data['audio_volume']          = get_post_meta( $asset_id, 'vrodos_asset3d_audio_volume', true ) ?: $audio_defaults['volume'];
		$data['audio_ref_distance']    = get_post_meta( $asset_id, 'vrodos_asset3d_audio_ref_distance', true ) ?: $audio_defaults['ref_distance'];
		$data['audio_max_distance']    = get_post_meta( $asset_id, 'vrodos_asset3d_audio_max_distance', true ) ?: $audio_defaults['max_distance'];
		$data['audio_rolloff_factor']  = get_post_meta( $asset_id, 'vrodos_asset3d_audio_rolloff_factor', true ) ?: $audio_defaults['rolloff_factor'];
		$data['audio_distance_model']  = 'inverse';

		// Screenshot
		$data['scrnImageURL'] = '';
		$data['hasScreenshot'] = false;
		if ( $asset_id ) {
			$screenshot_id = get_post_meta( $asset_id, 'vrodos_asset3d_screenimage', true );
			$scrnImageURL  = self::resolve_media_meta_url( $screenshot_id );
			if ( $scrnImageURL ) {
				if ( is_numeric( $screenshot_id ) ) {
					$file_path            = get_attached_file( (int) $screenshot_id );
					$cache_buster         = file_exists( $file_path ) ? filemtime( $file_path ) : time();
					$data['scrnImageURL'] = add_query_arg( 't', $cache_buster, $scrnImageURL );
				} else {
					$data['scrnImageURL'] = $scrnImageURL;
				}
				$data['hasScreenshot'] = true;
			}
		}

		// POI Image Text
		$data['poi_img_title']   = get_post_meta( $asset_id, 'vrodos_asset3d_poi_imgtxt_title', true );
		$data['poi_img_content'] = get_post_meta( $asset_id, 'vrodos_asset3d_poi_imgtxt_content', true );

		// POI Image File
		$data['imagePoiImageURL'] = VRodos_Path_Manager::image_url( 'ui/ic_sshot.png' );
		if ( $asset_id ) {
			$imagePoiImageURL = self::resolve_media_meta_url( get_post_meta( $asset_id, 'vrodos_asset3d_poi_imgtxt_image', true ) );
			if ( $imagePoiImageURL ) {
				$data['imagePoiImageURL'] = $imagePoiImageURL;
			}
		}

		// Image (flat plane)
		$image_flat_meta_value       = get_post_meta( $asset_id, 'vrodos_asset3d_image', true );
		$data['imageFlatSourceType'] = self::describe_media_source_type( $image_flat_meta_value );
		$data['imageFlatOriginalURL'] = '';
		$data['imageFlatCanRestoreOriginal'] = '';
		$data['imageFlatImageURL'] = '';
		if ( $asset_id ) {
			$imageFlatImageURL = self::resolve_media_meta_url( $image_flat_meta_value );
			if ( $imageFlatImageURL ) {
				$data['imageFlatImageURL'] = $imageFlatImageURL;
			}

			$original_image_url = self::get_immerse_original_image_url( $asset_id );
			if ( $original_image_url !== '' ) {
				$data['imageFlatOriginalURL'] = $original_image_url;
				$data['imageFlatCanRestoreOriginal'] = $imageFlatImageURL !== '' && untrailingslashit( $imageFlatImageURL ) !== untrailingslashit( $original_image_url ) ? '1' : '';
			}
		}

		// POI Chat
		$data['poi_chat_title']      = get_post_meta( $asset_id, 'vrodos_asset3d_poi_chattxt_title', true );
		$data['poi_chat_indicators'] = get_post_meta( $asset_id, 'vrodos_asset3d_poi_chatbut_indicators', true ) ? 'checked' : '';
		$data['poi_chat_num_people'] = get_post_meta( $asset_id, 'vrodos_asset3d_poi_chatnum_people', true );

		// POI Link
		$data['asset_link'] = get_post_meta( $asset_id, 'vrodos_asset3d_link', true );

		// 3D Text
		$data['text_asset_content']   = get_post_meta( $asset_id, 'vrodos_asset3d_text_content', true );
		$data['text_asset_format']    = get_post_meta( $asset_id, 'vrodos_asset3d_text_format', true );
		$data['text_asset_truncated'] = get_post_meta( $asset_id, 'vrodos_asset3d_text_truncated', true ) === '1' ? '1' : '';
		$data['text_asset_file_url']  = self::resolve_media_meta_url( get_post_meta( $asset_id, 'vrodos_asset3d_text_file', true ) );

	}
}
