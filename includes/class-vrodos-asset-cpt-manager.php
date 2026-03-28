<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * VRodos_Asset_CPT_Manager Class.
 *
 * Manages the Custom Post Type for VRodos Assets, including meta boxes,
 * custom fields, and admin columns.
 */
class VRodos_Asset_CPT_Manager {

	/**
	 * The meta box definition for asset data.
	 */
	private array $vrodos_databox1;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->define_asset_fields();
		$this->register_hooks();
	}

	/**
	 * Define the custom fields for the Asset CPT.
	 */
	/**
	 * Define the custom fields for the Asset CPT.
	 */
	private function define_asset_fields(): void {
		$table_of_asset_fields = [
      // Short , full, id, type, default, single, show_in_rest
      ['GLB File', 'GLB File', 'vrodos_asset3d_glb', 'string', '', true, true],
      ['Audio File', 'Audio File for the 3D model', 'vrodos_asset3d_audio', 'string', '', true, true],
      ['Diffusion Image', 'Diffusion Image', 'vrodos_asset3d_diffimage', 'string', '', false, true],
      ['Screenshot Image', 'Screenshot Image', 'vrodos_asset3d_screenimage', 'string', '', true, true],
      ['Next Scene (Only for Doors)', 'Next Scene', 'vrodos_asset3d_scene', 'string', '', true, true],
      ['Video', 'Video', 'vrodos_asset3d_video', 'string', '', true, true],
      ['isreward', 'isreward', 'vrodos_asset3d_isreward', 'string', '0', true, true],
      ['isCloned', 'isCloned', 'vrodos_asset3d_isCloned', 'string', 'false', true, true],
      ['isJoker', 'isJoker', 'vrodos_asset3d_isJoker', 'string', 'false', true, true],
      ['fonts', 'fonts', 'vrodos_asset3d_fonts', 'string', '', true, true],
      ['back_3d_color', '3D viewer background color', 'vrodos_asset3d_back3dcolor', 'string', 'rgb(221, 185, 155)', true, true],
      ['Asset TRS', 'Initial asset translation, rotation, scale for the asset editor', 'vrodos_asset3d_assettrs', 'string', '0,0,0,0,0,0,0,0,0', true, true],
  ];

		$asset_fields = [];
		foreach ( $table_of_asset_fields as $field_data ) {
			$asset_fields[] = ['name'         => $field_data[0], 'desc'         => $field_data[1], 'id'           => $field_data[2], 'type'         => $field_data[3], 'std'          => $field_data[4], 'single'       => $field_data[5], 'show_in_rest' => $field_data[6]];
		}

		$this->vrodos_databox1 = ['id'       => 'vrodos-assets-databox', 'page'     => 'vrodos_asset3d', 'context'  => 'normal', 'priority' => 'high', 'fields'   => $asset_fields];
	}

	/**
	 * Register all the hooks for the Asset CPT.
	 */
	/**
	 * Register all the hooks for the Asset CPT.
	 */
	private function register_hooks(): void {
		// Meta and data handling
		add_action( 'init', $this->vrodos_asset3d_metas_description(...), 1 );
		add_action( 'save_post', $this->vrodos_create_pathdata_asset(...), 10, 3 );
		add_action( 'save_post', $this->vrodos_assets_databox_save(...) );
		add_action( 'save_post', $this->vrodos_asset_tax_category_box_content_save(...) );
		add_action( 'save_post', $this->vrodos_assets_taxcategory_ipr_box_content_save(...) );
		add_action( 'save_post', $this->vrodos_asset_project_box_content_save(...) );

		// Admin UI and meta boxes
		add_action( 'init', $this->vrodos_allowAuthorEditing(...) );
		add_filter( 'wp_dropdown_users_args', $this->change_user_dropdown(...), 10, 2 );
		add_action( 'add_meta_boxes', $this->vrodos_assets_taxcategory_box(...) );
		add_action( 'add_meta_boxes', $this->vrodos_assets_databox_add(...) );

		// Admin columns
		add_filter( 'manage_vrodos_asset3d_posts_columns', $this->vrodos_set_custom_vrodos_asset3d_columns(...) );
		add_action( 'manage_vrodos_asset3d_posts_custom_column', $this->vrodos_set_custom_vrodos_asset3d_columns_fill(...), 10, 2 );

		add_action( 'init', $this->handle_asset_frontend_submission(...) );
	}

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
		$isJoker        = ( str_contains( $assetPGameSlug, 'joker' ) ) ? 'true' : 'false';

		$assetTitle   = isset( $_POST['assetTitle'] ) ? esc_attr( strip_tags( (string) $_POST['assetTitle'] ) ) : '';
		$assetCatID   = isset( $_POST['term_id'] ) ? intval( $_POST['term_id'] ) : 0; // Legacy hidden input.
		if ( $assetCatID <= 0 && ! empty( $_POST['term_id_native'] ) ) {
			$asset_cat_term = get_term_by( 'slug', sanitize_text_field( (string) $_POST['term_id_native'] ), 'vrodos_asset3d_cat' );
			$assetCatID     = $asset_cat_term ? (int) $asset_cat_term->term_id : 0;
		}
		$assetCatTerm = get_term_by( 'id', $assetCatID, 'vrodos_asset3d_cat' );

		$assetFonts = isset( $_POST['assetFonts'] ) ? esc_attr( strip_tags( (string) $_POST['assetFonts'] ) ) : '';

		$assetback3dcolor = esc_attr( strip_tags( (string) $_POST['assetback3dcolor'] ) );
		$assettrs         = esc_attr( strip_tags( (string) $_POST['assettrs'] ) );
		$redirect_url     = self::build_frontend_redirect_url();

		$glb_upload_error = self::get_frontend_glb_upload_error();
		if ( $glb_upload_error ) {
			self::redirect_with_frontend_notice( $redirect_url, $glb_upload_error, $submission_buffer_level );
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
		$has_new_glb_upload = ( isset( $_FILES['multipleFilesInput'] ) && isset( $_FILES['multipleFilesInput']['error'][0] ) && (int) $_FILES['multipleFilesInput']['error'][0] !== UPLOAD_ERR_NO_FILE )
			|| ( isset( $_POST['glbFileInput'] ) && ! empty( $_POST['glbFileInput'] ) );
		// NEW Asset: submit info to backend

		if ( $asset_id == null ) {
			// It's a new Asset, let's create it (returns newly created ID, or 0 if nothing happened)
			$asset_id = self::create_asset_frontend( $assetPGameID, $assetCatID, $gameSlug, $assetCatIPRID, $assetTitle, $assetFonts, $assetback3dcolor, $assettrs, '' );
		} else {
			// Edit an existing asset: Return true if updated, false if failed
			$asset_updatedConf = self::update_asset_frontend( $assetPGameID, $assetCatID, $asset_id, $assetCatIPRID, $assetTitle, $assetFonts, $assetback3dcolor, $assettrs, '' );
		}

		// Upload 3D files
		if ( $asset_id != 0 || $asset_updatedConf == 1 ) {

			// NoCloning: Upload files from POST but check first
			// if any 3D files have been selected for upload or glb blob is present
			if ( $has_new_glb_upload ) {
				VRodos_Upload_Manager::create_asset_3dfiles_extra_frontend( $asset_id, $project_id, $assetCatID );
				if ( ! get_post_meta( $asset_id, 'vrodos_asset3d_glb', true ) ) {
					self::redirect_with_frontend_notice( $redirect_url, 'glb-upload-failed', $submission_buffer_level );
				}
			}

			update_post_meta( $asset_id, 'vrodos_asset3d_isCloned', 'false' );
			update_post_meta( $asset_id, 'vrodos_asset3d_isJoker', $isJoker );

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

			case 'video':
				if ( isset( $_FILES['videoFileInput'] ) ) {
					VRodos_Upload_Manager::create_asset_add_video_frontend( $asset_id );
				}
				if ( isset( $_POST['videoSshotFileInput'] ) ) {
					VRodos_Upload_Manager::upload_asset_screenshot( $_POST['videoSshotFileInput'], $asset_id, $project_id );
				}
				update_post_meta( $asset_id, 'vrodos_asset3d_video_title', sanitize_text_field( $_POST['videoTitle'] ) );
				update_post_meta( $asset_id, 'vrodos_asset3d_video_autoloop', isset( $_POST['video_autoloop_checkbox'] ) );
				break;

			case 'poi-imagetext':
				$existing_img = $_FILES['imageFileInput'];
				if ( $existing_img['error'] != 4 ) {
					VRodos_Upload_Manager::create_asset_add_images_frontend( $asset_id, $_FILES['imageFileInput'] );
				}

				update_post_meta( $asset_id, 'vrodos_asset3d_poi_imgtxt_title', sanitize_text_field( $_POST['poiImgTitle'] ) );
				update_post_meta( $asset_id, 'vrodos_asset3d_poi_imgtxt_content', sanitize_text_field( $_POST['poiImgDescription'] ) );

				break;

			case 'image':
				$image_file = $_FILES['imageFlatFileInput'] ?? [];
				if ( ! empty( $image_file ) && ( $image_file['error'] ?? 4 ) != 4 ) {
					$attachment_id = VRodos_Upload_Manager::upload_img_vid_aud( $image_file, $asset_id );
					if ( $attachment_id ) {
						update_post_meta( $asset_id, 'vrodos_asset3d_image', $attachment_id );
						update_post_meta( $asset_id, 'vrodos_asset3d_screenimage', $attachment_id );
						set_post_thumbnail( $asset_id, $attachment_id );
					}
				}
				break;

			case 'poi-link':
				update_post_meta( $asset_id, 'vrodos_asset3d_link', $_POST['assetLinkInput'] );
				break;

			case 'chat':
				update_post_meta( $asset_id, 'vrodos_asset3d_poi_chattxt_title', $_POST['poiChatTitle'] );
				update_post_meta( $asset_id, 'vrodos_asset3d_poi_chatnum_people', $_POST['poiChatNumPeople'] );
				update_post_meta( $asset_id, 'vrodos_asset3d_poi_chatbut_indicators', isset( $_POST['poiChatIndicators'] ) );
				break;

			default:
				break;
			}
		}

		// Audio: To add
		// VRodos_Upload_Manager::create_asset_add_audio_frontend($asset_id);

		if ( ! isset( $_GET['vrodos_asset'] ) ) {
			$redirect_url = add_query_arg( 'vrodos_asset', $asset_id, $redirect_url );
		}
		self::perform_frontend_redirect( $redirect_url, $submission_buffer_level );
	}

	/**
	 * Create PathData for each asset as custom field.
	 */
	/**
	 * Create PathData for each asset as custom field.
	 */
	public function vrodos_create_pathdata_asset( $post_ID, $post, $update ): void {
		if ( get_post_type( $post_ID ) === 'vrodos_asset3d' ) {
			$parentGameID = $_GET['vrodos_game'] ?? null;
			if ( ! is_numeric( $parentGameID ) ) {
				return;
			}
			$parentGameID   = intval( $parentGameID );
			$parentGameSlug = ( $parentGameID > 0 ) ? get_post( $parentGameID )->post_name : null;
			update_post_meta( $post_ID, 'vrodos_asset3d_pathData', $parentGameSlug );
		}
	}

	/**
	 * Add author support to assets.
	 */
	/**
	 * Add author support to assets.
	 */
	public function vrodos_allowAuthorEditing(): void {
		add_post_type_support( 'vrodos_asset3d', 'author' );
	}

	/**
	 * Customize the user dropdown in the author meta box.
	 */
	/**
	 * Customize the user dropdown in the author meta box.
	 */
	public function change_user_dropdown( $query_args, $r ) {
		$screen = get_current_screen();
		if ( $screen->post_type == 'vrodos_asset3d' ) {
			if ( isset( $query_args['who'] ) ) {
				unset( $query_args['who'] );
			}
			$query_args['role__in'] = ['administrator'];
		}
		return $query_args;
	}

	/**
	 * Remove standard taxonomy boxes and add custom ones.
	 */
	/**
	 * Remove standard taxonomy boxes and add custom ones.
	 */
	public function vrodos_assets_taxcategory_box(): void {
		remove_meta_box( 'tagsdiv-vrodos_asset3d_pgame', 'vrodos_asset3d', 'side' );
		remove_meta_box( 'tagsdiv-vrodos_asset3d_cat', 'vrodos_asset3d', 'side' );
		remove_meta_box( 'tagsdiv-vrodos_asset3d_ipr_cat', 'vrodos_asset3d', 'side' );
		add_meta_box( 'vrodos_asset_project_selectbox', 'Project', $this->vrodos_assets_tax_select_project_box_content(...), 'vrodos_asset3d', 'side', 'high' );
		add_meta_box( 'vrodos_asset3d_category_selectbox', 'Asset Category', $this->vrodos_assets_tax_select_category_box_content(...), 'vrodos_asset3d', 'side', 'high' );
		add_meta_box( 'vrodos_asset3d_ipr_cat_selectbox', 'Asset IPR Category', $this->vrodos_assets_tax_select_iprcategory_box_content(...), 'vrodos_asset3d', 'side', 'high' );
	}

	/**
	 * Content for the project selection meta box.
	 */
	/**
	 * Content for the project selection meta box.
	 */
	public function vrodos_assets_tax_select_project_box_content( $post ): void {
		$tax_name = 'vrodos_asset3d_pgame';
		?>
		<div class="tagsdiv" id="<?php echo $tax_name; ?>">
			<p class="howto">Select project that this asset belongs to</p>
			<?php
			$nonce_field = wp_nonce_field( basename( __FILE__ ), 'vrodos_asset3d_pgame_noncename', true, false );
			echo str_replace( ' id="_ajax_nonce"', '', $nonce_field );
			$type_IDs   = wp_get_object_terms( $post->ID, 'vrodos_asset3d_pgame', ['fields' => 'ids'] );
			$type_ID    = $type_IDs ? $type_IDs[0] : 0;
			$args       = ['show_option_none'  => 'Select Category', 'orderby'           => 'name', 'hide_empty'        => 0, 'selected'          => $type_ID, 'name'              => 'vrodos_asset3d_pgame', 'taxonomy'          => 'vrodos_asset3d_pgame', 'echo'              => 0, 'option_none_value' => '-1', 'id'                => 'vrodos-select-category-dropdown'];
			$select     = wp_dropdown_categories( $args );
			$replace    = '<select$1 required>';
			$select     = preg_replace( '#<select([^>]*)>#', $replace, $select );
			$old_option = "<option value='-1'>";
			$new_option = "<option disabled selected value=''>" . 'Select Game' . '</option>';
			$select     = str_replace( $old_option, $new_option, $select );
			echo $select;
			?>
		</div>
		<?php
	}

	/**
	 * Save the asset category taxonomy data.
	 */
	/**
	 * Save the asset category taxonomy data.
	 */
	public function vrodos_asset_tax_category_box_content_save( $post_id ): void {
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) || ! isset( $_POST['vrodos_asset3d_cat_noncename'] ) || ! wp_verify_nonce( $_POST['vrodos_asset3d_cat_noncename'], basename( __FILE__ ) ) || ! current_user_can( 'edit_vrodos_asset3d_cat', $post_id ) ) {
			return;
		}
		$type_ID = intval( $_POST['vrodos_asset3d_cat'], 10 );
		$type    = ( $type_ID > 0 ) ? get_term( $type_ID, 'vrodos_asset3d_cat' )->slug : null;
		wp_set_object_terms( $post_id, $type, 'vrodos_asset3d_cat' );
	}

	/**
	 * Content for the asset category selection meta box.
	 */
	/**
	 * Content for the asset category selection meta box.
	 */
	public function vrodos_assets_tax_select_category_box_content( $post ): void {
		$tax_name = 'vrodos_asset3d_cat';
		?>
		<div class="tagsdiv" id="<?php echo $tax_name; ?>">
			<p class="howto">Select category for current Asset</p>
			<?php
			$nonce_field = wp_nonce_field( basename( __FILE__ ), 'vrodos_asset3d_cat_noncename', true, false );
			echo str_replace( ' id="_ajax_nonce"', '', $nonce_field );
			$type_IDs   = wp_get_object_terms( $post->ID, 'vrodos_asset3d_cat', ['fields' => 'ids'] );
			$type_ID    = $type_IDs ? $type_IDs[0] : 0;
			$args       = ['show_option_none'  => 'Select Category', 'orderby'           => 'name', 'hide_empty'        => 0, 'selected'          => $type_ID, 'name'              => 'vrodos_asset3d_cat', 'taxonomy'          => 'vrodos_asset3d_cat', 'echo'              => 0, 'option_none_value' => '-1', 'id'                => 'vrodos-select-asset3d-cat-dropdown'];
			$select     = wp_dropdown_categories( $args );
			$replace    = "<select$1 onchange='vrodos_hidecfields_asset3d();' required>";
			$select     = preg_replace( '#<select([^>]*)>#', $replace, $select );
			$old_option = "<option value='-1'>";
			$new_option = "<option disabled selected value=''>" . 'Select Category' . '</option>';
			$select     = str_replace( $old_option, $new_option, $select );
			echo $select;
			?>
		</div>
		<?php
	}

	/**
	 * Content for the IPR category selection meta box.
	 */
	/**
	 * Content for the IPR category selection meta box.
	 */
	public function vrodos_assets_tax_select_iprcategory_box_content( $post ): void {
		$tax_name = 'vrodos_asset3d_ipr_cat';
		?>
		<div class="tagsdiv" id="<?php echo $tax_name; ?>">
			<p class="howto">Select IPR category for current Asset</p>
			<?php
			$nonce_field = wp_nonce_field( basename( __FILE__ ), 'vrodos_asset3d_ipr_cat_noncename', true, false );
			echo str_replace( ' id="_ajax_nonce"', '', $nonce_field );
			$type_ids      = wp_get_object_terms( $post->ID, 'vrodos_asset3d_ipr_cat', ['fields' => 'ids'] );
			$selected_type = empty( $type_ids ) ? '' : $type_ids[0];
			$args          = ['show_option_none'  => 'Select IPR Category', 'orderby'           => 'name', 'hide_empty'        => 0, 'selected'          => $selected_type, 'name'              => 'vrodos_asset3d_ipr_cat', 'taxonomy'          => 'vrodos_asset3d_ipr_cat', 'echo'              => 0, 'option_none_value' => '-1', 'id'                => 'vrodos-select-asset3d-ipr-cat-dropdown'];
			$select        = wp_dropdown_categories( $args );
			$replace       = '<select$1 required>';
			$select        = preg_replace( '#<select([^>]*)>#', $replace, $select );
			$old_option    = "<option value='-1'>";
			$new_option    = "<option disabled selected value=''>" . 'Select IPR category' . '</option>';
			$select        = str_replace( $old_option, $new_option, $select );
			echo $select;
			?>
		</div>
		<?php
	}

	/**
	 * Save the IPR category taxonomy data.
	 */
	/**
	 * Save the IPR category taxonomy data.
	 */
	public function vrodos_assets_taxcategory_ipr_box_content_save( $post_id ): void {
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) || ! isset( $_POST['vrodos_asset3d_ipr_cat_noncename'] ) || ! wp_verify_nonce( $_POST['vrodos_asset3d_ipr_cat_noncename'], basename( __FILE__ ) ) || ! current_user_can( 'edit_vrodos_asset3d_iprcat', $post_id ) ) {
			return;
		}
		$type_ID = intval( $_POST['vrodos_asset3d_ipr_cat'], 10 );
		$type    = ( $type_ID > 0 ) ? get_term( $type_ID, 'vrodos_asset3d_ipr_cat' )->slug : null;
		wp_set_object_terms( $post_id, $type, 'vrodos_asset3d_ipr_cat' );
	}

	/**
	 * Save the project taxonomy data.
	 */
	/**
	 * Save the project taxonomy data.
	 */
	public function vrodos_asset_project_box_content_save( $post_id ): void {
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) || ! isset( $_POST['vrodos_asset3d_pgame_noncename'] ) || ! wp_verify_nonce( $_POST['vrodos_asset3d_pgame_noncename'], basename( __FILE__ ) ) || ! current_user_can( 'edit_vrodos_asset3d_pgame', $post_id ) ) {
			return;
		}
		$type_ID = intval( $_POST['vrodos_asset3d_pgame'], 10 );
		$type    = ( $type_ID > 0 ) ? get_term( $type_ID, 'vrodos_asset3d_pgame' )->slug : null;
		wp_set_object_terms( $post_id, $type, 'vrodos_asset3d_pgame' );
	}

	/**
	 * Add custom columns to the asset list table.
	 */
	/**
	 * Add custom columns to the asset list table.
	 */
	public function vrodos_set_custom_vrodos_asset3d_columns( $columns ): array {
		$columns['asset_slug'] = 'Asset Slug';
		return $columns;
	}

	/**
	 * Fill the content of the custom columns.
	 */
	/**
	 * Fill the content of the custom columns.
	 */
	public function vrodos_set_custom_vrodos_asset3d_columns_fill( $column, $post_id ): void {
		switch ( $column ) {
			case 'asset_slug':
				$mypost  = get_post( $post_id );
				$theSlug = $mypost->post_name;
				if ( is_string( $theSlug ) ) {
					echo $theSlug;
				} else {
					echo 'no slug found';
				}
				break;
		}
	}

	/**
	 * Register meta fields for the asset CPT.
	 */
	/**
	 * Register meta fields for the asset CPT.
	 */
	public function vrodos_asset3d_metas_description(): void {
		foreach ( $this->vrodos_databox1['fields'] as $meta_entry ) {
			register_post_meta(
				'vrodos_asset3d',
				$meta_entry['id'],
				['type'         => $meta_entry['type'], 'default'      => $meta_entry['std'], 'description'  => $meta_entry['desc'], 'single'       => $meta_entry['single'], 'show_in_rest' => $meta_entry['show_in_rest']]
			);
		}
	}

	/**
	 * Add the main data meta box.
	 */
	/**
	 * Add the main data meta box.
	 */
	public function vrodos_assets_databox_add(): void {
		add_meta_box( 'vrodos-assets-infobox', 'Description Tips for Image-Text', $this->vrodos_assets_infobox_show(...), 'vrodos_asset3d', 'normal', 'high' );
		add_meta_box( $this->vrodos_databox1['id'], 'Asset Data', $this->vrodos_assets_databox_show(...), $this->vrodos_databox1['page'], $this->vrodos_databox1['context'], $this->vrodos_databox1['priority'] );
	}

	/**
	 * Show the info box content.
	 */
	/**
	 * Show the info box content.
	 */
	public function vrodos_assets_infobox_show(): void {
		?>
		<style>#vrodos-assets-infobox{display:none;}</style>
		&lt;b&gt;&lt;size=40&gt;MyTitle&lt;/size&gt;&lt;/b&gt; <br/>
		&lt;size=32&gt;&lt;color=green>My description goes here.&lt;/color&gt;&lt;/size&gt; <br/><br/>
		Supported tags<br/>
		&lt;b&gt;Renders the text in boldface.&lt;/b&gt;<br/>
		&lt;i&gt;Renders the text in italics.&lt;/i&gt;<br/>
		&lt;size=20&gt;Sets the size of the text according to the parameter value, given in pixels.&lt;/size&gt;<br/>
		&lt;color=blue&gt;Sets the color of the text according to the parameter value.&lt;/color&gt;<br/>
		<?php
	}

	/**
	 * Show the main data meta box content.
	 */
	/**
	 * Show the main data meta box content.
	 */
	public function vrodos_assets_databox_show(): void {
		global $post;
		$hideshow = $post->post_status == 'publish' ? 'none' : 'block';
		?>
		<div id="vrodos_assets_box_wrapper" style="display:<?php echo $hideshow; ?>;">
			<span class="dashicons dashicons-lock">You must publish the Asset first, in order to fill its data</span>
		</div>
		<input type="hidden" name="vrodos_assets_databox_nonce" value="<?php echo wp_create_nonce( basename( __FILE__ ) ); ?>" />
		<table class="form-table" id="vrodos-custom-fields-table">
			<tbody>
			<?php foreach ( $this->vrodos_databox1['fields'] as $field ) : ?>
				<?php $post_meta_id = get_post_meta( $post->ID, $field['id'], true ); ?>
				<?php
				$valMaxUpload         = intval( ini_get( 'upload_max_filesize' ) );
				$attacmentSizeMessage = $valMaxUpload < 100 ? 'Files bigger than ' . $valMaxUpload . ' MB can not be uploaded <br/> Add to .htaccess the following two lines <br/> php_value upload_max_filesize 256M<br>php_value post_max_size 512M' : '';
				$extension            = substr( (string) $field['id'], strrpos( (string) $field['id'], '_' ) + 1 );
				$showSection          = 'table-row';
				switch ( $extension ) {
					case 'audio':
					case 'diffimage':
					case 'scene':
					case 'video':
					case 'fonts':
					case 'isreward':
					case 'back3dcolor':
						$showSection = 'none';
						break;
				}
				?>
				<tr id="<?php echo esc_attr( $field['id'] ); ?>_field" style="display: <?php echo $showSection; ?>">
					<th style="width:15%">
						<label for="<?php echo esc_attr( $field['id'] ); ?>"><?php echo esc_html( $field['name'] ); ?></label>
						<p><?php echo $attacmentSizeMessage; ?></p>
					</th>
					<td>
						<?php
						$attachment_url  = $post_meta_id ? wp_get_attachment_url( $post_meta_id ) : 'No ' . $field['name'];
						$preview_id      = 'vrodos_asset3d_' . $extension . '_preview';
						$preview_content = $post_meta_id ? '3D object too big to show here' : $extension . ' is not defined.';
						switch ( $extension ) {
							case 'glb':
							case 'audio':
								?>
								<input type="text" name="<?php echo esc_attr( $field['id'] ); ?>" readonly
										id="<?php echo esc_attr( $field['id'] ); ?>"
										value="<?php echo esc_attr( $post_meta_id ?: $field['std'] ); ?>"
										size="30" style="width:65%"/>
								<input id="<?php echo esc_attr( $field['id'] ); ?>_btn" type="button"
										value="Upload <?php echo esc_html( $field['name'] ); ?>"/>
								<p>Pathfile: <?php echo $attachment_url; ?></p>
								<label for="<?php echo $preview_id; ?>">Preview <?php echo $extension; ?>: </label>
								<textarea id="<?php echo $preview_id; ?>" readonly
											style=" width:100%; height:200px;"><?php echo $preview_content; ?></textarea>
								<?php
								break;
							case 'diffimage':
							case 'screenimage':
								?>
								<input type="text" name="<?php echo esc_attr( $field['id'] ); ?>" readonly
										id="<?php echo esc_attr( $field['id'] ); ?>"
										value="<?php echo esc_attr( $post_meta_id ?: $field['std'] ); ?>"
										size="30" style="width:65%"/>
								<input id="<?php echo esc_attr( $field['id'] ); ?>_btn" type="button"
										value="Upload <?php echo esc_html( $field['name'] ); ?>"/>
								<p>Pathfile: <?php echo $attachment_url; ?></p>
								<img id="<?php echo $preview_id; ?>" style="width:50%; height:auto"
									src="<?php echo wp_get_attachment_url( $post_meta_id ); ?>"
									alt="<?php echo $extension; ?> preview image"/>
								<?php
								break;
							case 'isCloned':
							case 'isJoker':
							case 'assettrs':
								?>
								<input type="text" name="<?php echo esc_attr( $field['id'] ); ?>" readonly
										id="<?php echo esc_attr( $field['id'] ); ?>"
										value="<?php echo esc_attr( $post_meta_id ?: $field['std'] ); ?>"
										size="30" style="width:65%"/>
								<?php
								break;
							case 'scene':
							case 'video':
							case 'fonts':
								// TODO: Add mechanisms for these.
								break;
						}
						?>
					</td>
				</tr>
			<?php endforeach; ?>
			</tbody>
		</table>
		<script>
			// JavaScript for meta box interactions
			function vrodos_hidecfields_asset3d() {
				let e = document.getElementById("vrodos-select-asset3d-cat-dropdown");
				let text = e.options[e.selectedIndex].text;
				let sceneField = document.getElementById('vrodos_asset3d_scene_field');
				let infoBox = document.getElementById('vrodos-assets-infobox');

				if (text === 'Doors') {
					sceneField.style.display = 'block';
					infoBox.style.display = 'none';
				} else {
					sceneField.style.display = 'none';
					if (text === 'Points of Interest (Image-Text)') {
						infoBox.style.display = 'block';
					} else {
						infoBox.style.display = 'none';
					}
				}
			}
			document.addEventListener('DOMContentLoaded', function() {
				let file_frame;
				let wp_media_post_id = wp.media.model.settings.post.id;
				let set_to_post_id = <?php echo $post->ID; ?>;

				document.getElementById('vrodos_asset3d_glb_btn').addEventListener('click', function() { uploadAssetToPage('vrodos_asset3d_glb', 'model/gltf-binary', 'GLB'); });
				document.getElementById('vrodos_asset3d_screenimage_btn').addEventListener('click', function() { uploadAssetToPage('vrodos_asset3d_screenimage', 'image', 'Screenshot Image'); });

				function uploadAssetToPage(id, mime_type, type_string) {
					wp.media.model.settings.post.id = set_to_post_id;
					file_frame = wp.media({
						title: 'Select ' + type_string + ' file to upload',
						button: { text: 'Use this ' + type_string + ' file' },
						multiple: false,
						library: { type: mime_type }
					});
					file_frame.on('select', function() {
						let attachment = file_frame.state().get('selection').first().toJSON();
						document.getElementById(id).value = attachment.id;
						if (mime_type === 'image') {
							var preview = document.getElementById(id + '_preview');
							if (preview) preview.src = attachment.url;
						}
						wp.media.model.settings.post.id = wp_media_post_id;
					});
					file_frame.open();
				}
				document.querySelectorAll('a.add_media').forEach(function(el) {
					el.addEventListener('click', function() {
						wp.media.model.settings.post.id = wp_media_post_id;
					});
				});
			});
		</script>
		<?php
	}

	/**
	 * Save the data from the main asset data meta box.
	 */
	/**
	 * Save the data from the main asset data meta box.
	 */
	public function vrodos_assets_databox_save( $post_id ): void {
		if ( ! isset( $_POST['vrodos_assets_databox_nonce'] ) || ! wp_verify_nonce( $_POST['vrodos_assets_databox_nonce'], basename( __FILE__ ) ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		foreach ( $this->vrodos_databox1['fields'] as $field ) {
			if ( isset( $_POST[ $field['id'] ] ) ) {
				$new = $_POST[ $field['id'] ];
				$old = get_post_meta( $post_id, $field['id'], true );
				if ( $new && $new != $old ) {
					update_post_meta( $post_id, $field['id'], $new );
				} elseif ( '' == $new && $old ) {
					delete_post_meta( $post_id, $field['id'], $old );
				}
			}
		}
	}


	// --- Asset saving and updating logic ---

	/**
	 * Create a new asset from the frontend.
	 */
	/**
	 * Create a new asset from the frontend.
	 */
	public static function create_asset_frontend( $asset_pgame_id, $asset_cat_id, $game_slug, $asset_cat_ipr_id, $asset_title, $asset_fonts, $asset_back_3d_color, $asset_trs, $asset_description ) {
		$asset_taxonomies = ['vrodos_asset3d_pgame'   => [$asset_pgame_id], 'vrodos_asset3d_cat'     => [$asset_cat_id], 'vrodos_asset3d_ipr_cat' => [$asset_cat_ipr_id]];

		$asset_information = ['post_title'   => $asset_title, 'post_content' => $asset_description, 'post_type'    => 'vrodos_asset3d', 'post_status'  => 'publish', 'tax_input'    => $asset_taxonomies];

		$asset_id = wp_insert_post( $asset_information );
		update_post_meta( $asset_id, 'vrodos_asset3d_pathData', $game_slug );
		self::update_asset_meta( $asset_id, $asset_fonts, $asset_back_3d_color, $asset_trs );

		return $asset_id ?: 0;
	}

	/**
	 * Update an existing asset from the frontend.
	 */
	/**
	 * Update an existing asset from the frontend.
	 */
	public static function update_asset_frontend( $asset_pgame_id, $asset_cat_id, $asset_id, $asset_cat_ipr_id, $asset_title, $asset_fonts, $asset_back_3d_color, $asset_trs, $asset_description ) {
		$asset_taxonomies = ['vrodos_asset3d_pgame'   => [$asset_pgame_id], 'vrodos_asset3d_cat'     => [$asset_cat_id], 'vrodos_asset3d_ipr_cat' => [$asset_cat_ipr_id]];

		$data = ['ID'           => $asset_id, 'post_title'   => $asset_title, 'post_content' => $asset_description, 'tax_input'    => $asset_taxonomies];

		wp_update_post( $data );
		self::update_asset_meta( $asset_id, $asset_fonts, $asset_back_3d_color, $asset_trs );

		return 1;
	}

	/**
	 * Update the asset's meta data.
	 */
	/**
	 * Update the asset's meta data.
	 */
	public static function update_asset_meta( $asset_id, $asset_fonts, $asset_back_3d_color, $asset_trs ): void {
		update_post_meta( $asset_id, 'vrodos_asset3d_fonts', $asset_fonts );
		update_post_meta( $asset_id, 'vrodos_asset3d_back3dcolor', $asset_back_3d_color );
		update_post_meta( $asset_id, 'vrodos_asset3d_assettrs', $asset_trs );
	}

	public static function prepare_asset_editor_template_data(): array {
		$data = [];

		$data['asset_id']   = isset( $_GET['vrodos_asset'] ) ? sanitize_text_field( intval( $_GET['vrodos_asset'] ) ) : null;
		$data['project_id'] = isset( $_GET['vrodos_game'] ) ? sanitize_text_field( intval( $_GET['vrodos_game'] ) ) : null;

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
		$data['max_upload_bytes'] = wp_max_upload_size();
		$data['max_upload_label'] = size_format( $data['max_upload_bytes'], 0 );
		$data['asset_notice_code'] = isset( $_GET['vrodos_notice'] ) ? sanitize_key( (string) $_GET['vrodos_notice'] ) : '';
		$data['asset_notice_type'] = 'error';
		$data['asset_notice_message'] = self::map_frontend_notice_message( $data['asset_notice_code'], $data['max_upload_label'] );

		$game_post            = get_post( $data['project_id'] );
		$data['game_post']    = $game_post;
		$gameSlug             = $game_post ? $game_post->post_name : '';
		$assetPGame           = self::ensure_asset_project_term( $game_post );
		$data['assetPGameID'] = $assetPGame ? $assetPGame->term_id : null;

		// Fix for PHP 8 deprecation warning
		$assetPGameSlug  = $assetPGame ? $assetPGame->slug : '';
		$data['isJoker'] = ( str_contains( $assetPGameSlug, 'joker' ) ) ? 'true' : 'false';

		$all_game_category     = get_the_terms( $data['project_id'], 'vrodos_game_type' );
		$data['game_category'] = $all_game_category ? $all_game_category[0]->slug : null;

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
		$data['asset_fonts_saved']         = '';
		$data['asset_back_3d_color_saved'] = '#000000';
		$data['assettrs_saved']            = '0,0,0,0,0,0,0,0,-100';
		$data['dropdownHeading']           = 'Select a category';

		// Prepare image URLs for the template
		$data['no_img_path_url'] = plugin_dir_url( VRODOS_PLUGIN_FILE ) . 'images/ic_sshot.png';
		$data['login_promo_url'] = plugin_dir_url( VRODOS_PLUGIN_FILE ) . 'images/screenshots/authtoolimage.jpg';
		$data['glb_icon_url']    = plugin_dir_url( VRODOS_PLUGIN_FILE ) . 'images/cube.png';
		$data['audio_icon_url']  = plugin_dir_url( VRODOS_PLUGIN_FILE ) . 'images/audio.png';

		if ( $data['asset_id'] != null ) {
			$assetpostMeta                     = get_post_meta( $data['asset_id'] );
			$data['back_3d_color']             = isset( $assetpostMeta['vrodos_asset3d_back3dcolor'] ) ? $assetpostMeta['vrodos_asset3d_back3dcolor'][0] : '#ffffff';
			$asset_3d_files                    = VRodos_Core_Manager::get_3D_model_files( $assetpostMeta, $data['asset_id'] );
			$data['glb_file_name']             = $asset_3d_files['glb'];
			$data['dropdownHeading']           = 'Category';
			$data['asset_title_value']         = get_the_title( $data['asset_id'] );
			$data['asset_description_value']   = get_post_field( 'post_content', $data['asset_id'] );
			$data['asset_fonts_saved']         = get_post_meta( $data['asset_id'], 'vrodos_asset3d_fonts', true );
			$data['asset_back_3d_color_saved'] = get_post_meta( $data['asset_id'], 'vrodos_asset3d_back3dcolor', true ) ?: '#000000';
			$data['assettrs_saved']            = get_post_meta( $data['asset_id'], 'vrodos_asset3d_assettrs', true ) ?: '0,0,0,0,0,0,0,0,-100';
		}

		return $data;
	}

	private static function prepare_taxonomy_data( &$data ): void {
		$ids_to_exclude = [];
		if ( $data['game_category'] === 'virtualproduction_games' ) {
			$get_terms_to_exclude = get_terms(
				['fields'   => 'ids', 'slug'     => ['chat'], 'taxonomy' => 'vrodos_asset3d_cat']
			);
			if ( ! is_wp_error( $get_terms_to_exclude ) && count( $get_terms_to_exclude ) > 0 ) {
				$ids_to_exclude = $get_terms_to_exclude;
			}
		}

		$data['cat_terms']      = get_terms(
			'vrodos_asset3d_cat',
			['hide_empty' => false, 'exclude'    => $ids_to_exclude]
		);
		$data['saved_term']     = wp_get_post_terms( $data['asset_id'], 'vrodos_asset3d_cat' );
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
		$video_attachment_post         = get_post( $videoID );
		$data['video_attachment_file'] = $videoID ? wp_get_attachment_url( $videoID ) : null;
		$data['video_title']           = get_post_meta( $asset_id, 'vrodos_asset3d_video_title', true );
		$data['video_autoloop']        = get_post_meta( $asset_id, 'vrodos_asset3d_video_autoloop', true ) ? 'checked' : '';

		// Screenshot
		$data['scrnImageURL'] = plugin_dir_url( VRODOS_PLUGIN_FILE ) . 'images/ic_sshot.png';
		if ( $asset_id ) {
			$screenshot_id = get_post_meta( $asset_id, 'vrodos_asset3d_screenimage', true );
			$scrnImageURL  = wp_get_attachment_url( $screenshot_id );
			if ( $scrnImageURL ) {
				$file_path            = get_attached_file( $screenshot_id );
				$cache_buster         = file_exists( $file_path ) ? filemtime( $file_path ) : time();
				$data['scrnImageURL'] = add_query_arg( 't', $cache_buster, $scrnImageURL );
			}
		}

		// POI Image Text
		$data['poi_img_title']   = get_post_meta( $asset_id, 'vrodos_asset3d_poi_imgtxt_title', true );
		$data['poi_img_content'] = get_post_meta( $asset_id, 'vrodos_asset3d_poi_imgtxt_content', true );

		// POI Image File
		$data['imagePoiImageURL'] = plugin_dir_url( VRODOS_PLUGIN_FILE ) . 'images/ic_sshot.png';
		if ( $asset_id ) {
			$imagePoiImageURL = wp_get_attachment_url( get_post_meta( $asset_id, 'vrodos_asset3d_poi_imgtxt_image', true ) );
			if ( $imagePoiImageURL ) {
				$data['imagePoiImageURL'] = $imagePoiImageURL;
			}
		}

		// Image (flat plane)
		$data['imageFlatImageURL'] = '';
		if ( $asset_id ) {
			$imageFlatImageURL = wp_get_attachment_url( get_post_meta( $asset_id, 'vrodos_asset3d_image', true ) );
			if ( $imageFlatImageURL ) {
				$data['imageFlatImageURL'] = $imageFlatImageURL;
			}
		}

		// POI Chat
		$data['poi_chat_title']      = get_post_meta( $asset_id, 'vrodos_asset3d_poi_chattxt_title', true );
		$data['poi_chat_indicators'] = get_post_meta( $asset_id, 'vrodos_asset3d_poi_chatbut_indicators', true ) ? 'checked' : '';
		$data['poi_chat_num_people'] = get_post_meta( $asset_id, 'vrodos_asset3d_poi_chatnum_people', true );

		// POI Link
		$data['asset_link'] = get_post_meta( $asset_id, 'vrodos_asset3d_link', true );

		// Audio
		$audioID                       = get_post_meta( $asset_id, 'vrodos_asset3d_audio', true );
		$attachment_post               = get_post( $audioID );
		$data['audio_attachment_file'] = $audioID ? wp_get_attachment_url( $audioID ) : null;

		if ( $data['audio_attachment_file'] ) {
			$data['audio_file_type'] = ( str_contains( (string) $data['audio_attachment_file'], 'mp3' ) ) ? 'mp3' : 'wav';
		} else {
			$data['audio_file_type'] = null;
		}
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

	private static function get_frontend_glb_upload_error(): string {
		if ( empty( $_FILES['multipleFilesInput'] ) || ! isset( $_FILES['multipleFilesInput']['error'][0] ) ) {
			return '';
		}

		$upload_error = (int) $_FILES['multipleFilesInput']['error'][0];
		if ( $upload_error === UPLOAD_ERR_OK || $upload_error === UPLOAD_ERR_NO_FILE ) {
			return '';
		}

		if ( $upload_error === UPLOAD_ERR_INI_SIZE || $upload_error === UPLOAD_ERR_FORM_SIZE ) {
			return 'glb-too-large';
		}

		return 'glb-upload-failed';
	}

	private static function map_frontend_notice_message( string $notice_code, string $max_upload_label ): string {
		switch ( $notice_code ) {
			case 'glb-too-large':
				return 'The selected GLB is larger than the current upload limit (' . $max_upload_label . '). Please upload a smaller file or increase PHP upload_max_filesize/post_max_size.';
			case 'glb-upload-failed':
				return 'The GLB upload failed before the asset could be saved. Please try again, or reduce the file size if this model is especially large.';
			default:
				return '';
		}
	}
}
