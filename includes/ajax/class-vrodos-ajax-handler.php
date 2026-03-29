<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once plugin_dir_path( __FILE__ ) . '../vrodos-scene-model.php';
require_once plugin_dir_path( __FILE__ ) . '../class-vrodos-compiler-manager.php';

class VRodos_AJAX_Handler {

	public function __construct() {
		add_action( 'wp_ajax_vrodos_save_scene_async_action', $this->save_scene_async_action_callback(...) );
		add_action( 'wp_ajax_vrodos_undo_scene_async_action', $this->undo_scene_async_action_callback(...) );
		add_action( 'wp_ajax_vrodos_redo_scene_async_action', $this->redo_scene_async_action_callback(...) );
		add_action( 'wp_ajax_vrodos_delete_scene_action', $this->delete_scene_frontend_callback(...) );
		add_action( 'wp_ajax_vrodos_delete_asset_action', $this->delete_asset3d_frontend_callback(...) );
		add_action( 'wp_ajax_vrodos_fetch_assetmeta_action', $this->fetch_asset3d_meta_backend_callback(...) );
		add_action( 'wp_ajax_vrodos_compile_action', $this->compile_action_callback(...) );
		add_action( 'wp_ajax_image_upload_action', $this->image_upload_action_callback(...) );

		// Peer conferencing
		add_action( 'wp_ajax_nopriv_vrodos_notify_confpeers_action', $this->vrodos_notify_confpeers_callback(...) );
		add_action( 'wp_ajax_vrodos_notify_confpeers_action', $this->vrodos_notify_confpeers_callback(...) );
		add_action( 'wp_ajax_vrodos_update_expert_log_action', $this->vrodos_update_expert_log_callback(...) );

		add_action( 'wp_ajax_vrodos_reorder_scenes_action', $this->reorder_scenes_callback(...) );
		add_action( 'wp_ajax_vrodos_fetch_list_projects_action', $this->vrodos_fetch_list_projects_callback(...) );

		add_action( 'wp_ajax_vrodos_fetch_game_assets_action', $this->vrodos_fetch_game_assets_action_callback(...) );

		add_action( 'wp_ajax_vrodos_delete_game_action', $this->vrodos_delete_gameproject_frontend_callback(...) );
		add_action( 'wp_ajax_vrodos_create_project_action', $this->vrodos_create_project_frontend_callback(...) );
		add_action( 'wp_ajax_vrodos_fetch_glb_asset_action', $this->vrodos_fetch_glb_asset3d_frontend_callback(...) );
		add_action( 'wp_ajax_nopriv_vrodos_fetch_glb_asset_action', $this->vrodos_fetch_glb_asset3d_frontend_callback(...) );
	}

	public function vrodos_create_project_frontend_callback(): void {
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_send_json_error( 'Insufficient permissions.', 403 );
		}

		$project_title       = sanitize_text_field( (string) $_POST['project_title'] );
		$project_type_slug   = sanitize_key( $_POST['project_type_slug'] );
		$taxonomy            = get_term_by( 'slug', $project_type_slug, 'vrodos_game_type' );

		if ( ! $taxonomy ) {
			wp_send_json_error( 'Invalid project type.' );
		}

		$project_type_id     = $taxonomy->term_id;
		$project_taxonomies  = ['vrodos_game_type' => [$project_type_id]];
		$project_information = ['post_title'   => $project_title, 'post_content' => '', 'post_type'    => 'vrodos_game', 'post_status'  => 'publish', 'tax_input'    => $project_taxonomies];
		$project_id          = wp_insert_post( $project_information );
		echo $project_id;
		wp_die();
	}

	public function vrodos_delete_gameproject_frontend_callback(): void {
		if ( ! current_user_can( 'administrator' ) ) {
			wp_send_json_error( 'Insufficient permissions.', 403 );
		}

		$game_id   = absint( $_POST['game_id'] );
		$game_post = get_post( $game_id );

		if ( ! $game_post || $game_post->post_type !== 'vrodos_game' ) {
			wp_send_json_error( 'Invalid project.' );
		}

		$gameSlug  = $game_post->post_name;
		$gameTitle = get_the_title( $game_id );

		// Delete all assets (batch: get IDs first, warm meta cache, then loop)
		$assetPGame = get_term_by( 'slug', $gameSlug, 'vrodos_asset3d_pgame' );
		if ( $assetPGame ) {
			$asset_ids = get_posts( [
				'post_type'      => 'vrodos_asset3d',
				'posts_per_page' => -1,
				'fields'         => 'ids',
				'tax_query'      => [ [ 'taxonomy' => 'vrodos_asset3d_pgame', 'field' => 'term_id', 'terms' => $assetPGame->term_id ] ],
			] );

			if ( ! empty( $asset_ids ) ) {
				update_meta_cache( 'post', $asset_ids );
				foreach ( $asset_ids as $asset_id ) {
					$this->vrodos_delete_asset3d_noscenes_frontend( $asset_id );
				}
			}

			wp_delete_term( $assetPGame->term_id, 'vrodos_asset3d_pgame' );
		}

		// Delete all scenes (batch: get IDs first, then loop)
		$scenePGame = get_term_by( 'slug', $gameSlug, 'vrodos_scene_pgame' );
		if ( $scenePGame ) {
			$scene_ids = get_posts( [
				'post_type'      => 'vrodos_scene',
				'posts_per_page' => -1,
				'fields'         => 'ids',
				'tax_query'      => [ [ 'taxonomy' => 'vrodos_scene_pgame', 'field' => 'term_id', 'terms' => $scenePGame->term_id ] ],
			] );

			foreach ( $scene_ids as $scene_id ) {
				wp_delete_post( $scene_id, true );
			}

			wp_delete_term( $scenePGame->term_id, 'vrodos_scene_pgame' );
		}

		wp_delete_post( $game_id, false );

		// Clear asset list transients
		global $wpdb;
		$wpdb->query( $wpdb->prepare( "DELETE FROM $wpdb->options WHERE option_name LIKE %s OR option_name LIKE %s", '_transient_vrodos_assets_%', '_transient_timeout_vrodos_assets_%' ) );

		echo $gameTitle;
		wp_die();
	}

	public function vrodos_fetch_glb_asset3d_frontend_callback(): void {
		wp_reset_postdata();
		$asset_id       = $_POST['asset_id'];
		$glbID          = get_post_meta( $asset_id, 'vrodos_asset3d_glb', true );
		$glbURL         = wp_get_attachment_url( $glbID );

		$compiler = new VRodos_Compiler_Manager();
		$glbURL = $compiler->normalize_url( $glbURL );

		$output         = new StdClass();
		$output->glbIDs = $glbID;
		$output->glbURL = $glbURL;
		print_r( json_encode( $output, JSON_UNESCAPED_SLASHES ) );
		wp_die();
	}

	private function vrodos_delete_asset3d_noscenes_frontend( $asset_id ): void {
		$mtlID = get_post_meta( $asset_id, 'vrodos_asset3d_mtl', true );
		wp_delete_attachment( $mtlID, true );
		$objID = get_post_meta( $asset_id, 'vrodos_asset3d_obj', true );
		wp_delete_attachment( $objID, true );
		$difID = get_post_meta( $asset_id, 'vrodos_asset3d_diffimage', true );
		wp_delete_attachment( $difID, true );
		$screenID = get_post_meta( $asset_id, 'vrodos_asset3d_screenimage', true );
		wp_delete_attachment( $screenID, true );
		wp_delete_post( $asset_id, true );
	}

	// ======================= PEER CONFERENCING =========================================================================


	public function vrodos_notify_confpeers_callback() {

		$ff = fopen( 'confroom_log.txt', 'a' );

		fwrite( $ff, chr( 10 ) );

		date_default_timezone_set( 'Europe/Sofia' );

		$strDate = '<tr><td> +1 user</td><td>' . $_POST['confroom'] . '</td><td>' . date( 'd-m-y' ) . '</td><td>' . date( 'h:i:s' ) . '</td></tr>:::' . time() . ':::' . $_POST['confroom'];
		fwrite( $ff, $strDate );
		fclose( $ff );

		// if (document.getElementById("ConfRoomReport"))
		// document.getElementById("ConfRoomReport").innerHTML = "1 user in room:".$_POST['confroom'];

		echo $strDate;

		wp_die();
	}

	// Read log content from conferences
	public function vrodos_update_expert_log_callback() {
		// reset
		// unlink("wp-admin/confroom_log.txt");
		if ( ! file_exists( 'confroom_log.txt' ) ) {
			return;
		}

		$file = file( 'confroom_log.txt' );

		$file = str_replace( "\n", ' ', $file );
		$file = array_reverse( $file );

		$content = '';

		$alerting = [];
		$rooming  = [];

		// $ff = fopen("output_rooming.txt","w");
		// fwrite($ff, chr(10));

		$index_max_recs = 0;
		foreach ( $file as $f ) {

			if ( $index_max_recs < 12 ) {

				$f = str_replace( "\n", ' ', $f );

				[$f, $timestamp, $room] = explode( ':::', $f );

				// fwrite($ff, time() . " " . $timestamp . " " . (time() - $timestamp));
				// fwrite($ff, chr(10));

				if ( time() - $timestamp < 20 ) {
					$alerting[] = $timestamp;
					$rooming[]  = $room;
				}

				$content = $content . $f;

				$index_max_recs += 1;
			}
		}
		// fclose($ff);

		$total_content = json_encode( [$content, $alerting, $rooming] );

		echo $total_content;

		wp_die();
	}

	/**
	 * Saves the scene via AJAX.
	 */
	public function save_scene_async_action_callback() {
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_send_json_error( 'Insufficient permissions.', 403 );
		}

		// Save screenshot
		if ( isset( $_POST['scene_screenshot'] ) ) {
			$attachment_id = VRodos_Upload_Manager::upload_scene_screenshot(
				$_POST['scene_screenshot'],
				'scene_' . $_POST['scene_id'] . '_featimg',
				$_POST['scene_id'],
				'jpg'
			);

			// Set thumbnail of post
			set_post_thumbnail( $_POST['scene_id'], $attachment_id );
		}

		// Create a new scene model and populate it from the posted JSON.
		$scene_model = new Vrodos_Scene_Model( wp_unslash( $_POST['scene_json'] ) );

		// Save json of scene
		$scene_new_info = ['ID'           => $_POST['scene_id'], 'post_title'   => $_POST['scene_title'], 'post_content' => $scene_model->to_json()];

		$res = wp_update_post( $scene_new_info );
		update_post_meta( $_POST['scene_id'], 'vrodos_scene_caption', $_POST['scene_caption'] );

		echo $res != 0 ? 'true' : 'false';
		wp_die();
	}

	// Undo button for scenes
	public function undo_scene_async_action_callback() {
		if ( ! isset( $_POST['post_revision_no'] ) ) {
			wp_send_json_error( 'Missing revision number.' );
		}

		$revision_number  = $_POST['post_revision_no'];
		$current_scene_id = $_POST['scene_id'];

		$rev         = wp_get_post_revisions(
			$current_scene_id,
			[
       'offset'         => $revision_number,
       // Start from the previous change
       'posts_per_page' => 1,
       // Only a single revision
       'post_name__in'  => ["{$current_scene_id}-revision-v1"],
       'check_enabled'  => false,
   ]
		);
		$sceneToLoad = reset( $rev )->post_content;

		echo $sceneToLoad;
		wp_die();
	}



	// Redo button for scenes
	public function redo_scene_async_action_callback() {
		if ( ! isset( $_POST['post_revision_no'] ) ) {
			wp_send_json_error( 'Missing revision number.' );
		}

		$revision_number  = $_POST['post_revision_no'];
		$current_scene_id = $_POST['scene_id'];

		$rev         = wp_get_post_revisions(
			$current_scene_id,
			[
       'offset'         => $revision_number,
       // Start from the previous change
       'posts_per_page' => 1,
       // Only a single revision
       'post_name__in'  => ["{$current_scene_id}-revision-v1"],
       'check_enabled'  => false,
   ]
		);
		$sceneToLoad = reset( $rev )->post_content;

		echo $sceneToLoad;
		wp_die();
	}

	// REORDER SCENES
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

	// DELETE specific SCENE
	public function delete_scene_frontend_callback() {

		$scene_id  = $_POST['scene_id'];
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

	public function delete_asset3d_frontend_callback() {
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_send_json_error( 'Insufficient permissions.', 403 );
		}

		$asset_id = absint( $_POST['asset_id'] );
		$gameSlug = sanitize_key( $_POST['game_slug'] );
		$isCloned = sanitize_text_field( $_POST['isCloned'] );

		// If it is not cloned then it is safe to delete the meta files.
		if ( $isCloned === 'false' ) {
			// This part handles all attachments: textures, GLB, screenshot.
			$args        = ['post_parent'    => $asset_id, 'post_type'      => 'attachment', 'posts_per_page' => -1];
			$attachments = get_children( $args );

			if ( $attachments ) {
				$site_url = get_site_url();

				foreach ( $attachments as $attachment ) {
					$file_url = wp_get_attachment_url( $attachment->ID );

					// The path stored is a URL. We need to convert it to a server path.
					// We do this by replacing the site's URL with the site's absolute path.
					$file_path = str_replace( $site_url, ABSPATH, $file_url );

					// Normalize slashes to be safe across operating systems.
					$file_path = wp_normalize_path( $file_path );

					if ( file_exists( $file_path ) ) {
						wp_delete_file( $file_path );
					}

					// This will handle the database entry and any thumbnails.
					wp_delete_attachment( $attachment->ID, true );
				}
			}
		}

		// Delete all uses of Asset from Scenes (json)
		VRodos_Core_Manager::vrodos_delete_asset_3d_from_scenes( $asset_id, $gameSlug );

		// Delete Asset post from SQL database
		wp_delete_post( $asset_id, true );

		// Clear the asset list transients to ensure the list is updated on refresh
		global $wpdb;
		$wpdb->query( $wpdb->prepare( "DELETE FROM $wpdb->options WHERE option_name LIKE %s OR option_name LIKE %s", '_transient_vrodos_assets_%', '_transient_timeout_vrodos_assets_%' ) );

		echo $asset_id;

		wp_die();
	}

	public function fetch_asset3d_meta_backend_callback() {

		$asset_id = $_POST['asset_id'];

		$output                 = new StdClass();
		$output->assettrs_saved = get_post_meta( $asset_id, 'vrodos_asset3d_assettrs', true );

		print_r( json_encode( $output, JSON_UNESCAPED_SLASHES ) );
		wp_die();
	}

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
			// wp_delete_attachment handles file deletion and meta cleanup safely
			wp_delete_attachment( $old_attachment_id, true );
		}

		$image_data = $_POST['image'] ?? '';
		$filename   = sanitize_file_name( $_POST['filename'] ?? 'bg_image.jpg' );
		$ext        = sanitize_key( $_POST['imagetype'] ?? 'jpg' );

		// Ensure we have a unique filename to avoid collisions and cache issues
		$hashed_filename = $project_id . '_' . time() . '_' . $scene_id . '_bg.' . $ext;
		
		// Decode base64 image
		$decoded_image = base64_decode( substr( (string) $image_data, strpos( (string) $image_data, ',' ) + 1 ) );
		
		// Upload the background image file using WordPress standard bits
		// This handles the directory creation and file writing safely
		$_REQUEST['post_id'] = $scene_id; // Set for our upload_dir filter in Upload Manager
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

	public function compile_action_callback() {

		// $projectId = $_REQUEST['vrodos_game'];
		$sceneId           = $_REQUEST['vrodos_scene'];
		$projectId         = $_REQUEST['projectId'];
		$showPawnPositions = $_REQUEST['showPawnPositions'] ?? 'false';
		// $projectSlug = $_REQUEST['projectSlug'];

		$terms = wp_get_post_terms( $sceneId, 'vrodos_scene_pgame' );
		if ( is_wp_error( $terms ) || empty( $terms ) ) {
			wp_send_json_error( 'Scene has no project term assigned.', 400 );
			return;
		}
		$parent_id = $terms[0]->term_id;

		$sceneIdList = VRodos_Core_Manager::vrodos_get_all_sceneids_of_game( $parent_id );

		$compiler   = new VRodos_Compiler_Manager();
		$scene_json = $compiler->compile_aframe( $projectId, $sceneIdList, $showPawnPositions );
		echo $scene_json;
		wp_die();
	}



	// Fetch list of project through ajax
	public function vrodos_fetch_list_projects_callback() {

		$perma_structure     = (bool) get_option( 'permalink_structure' );
		$parameter_Scenepass = $perma_structure ? '?vrodos_scene=' : '&vrodos_scene=';

		// Exclude Joker projects (internal shared-asset repositories) from the listing
		$joker_slugs = ['archaeology-joker', 'vrexpo-joker', 'virtualproduction-joker'];
		$joker_ids = [];
		foreach ($joker_slugs as $slug) {
			$post = get_page_by_path($slug, OBJECT, 'vrodos_game');
			if ($post) $joker_ids[] = $post->ID;
		}

		// Define custom query parameters
		$custom_query_args = ['post_type' => 'vrodos_game', 'posts_per_page' => -1];
		if (!empty($joker_ids)) {
			$custom_query_args['post__not_in'] = $joker_ids;
		}

		// if (current_user_can('administrator')){
		//
		// } elseif (current_user_can('adv_project_master')) {
		// $custom_query_args['author'] = $user_id;
		//
		// }elseif (current_user_can('game_master')) {
		// $custom_query_args['author'] = $user_id;
		// }

		// Get current page and append to custom query parameters array
		// $custom_query_args['paged'] = get_query_var( 'paged' ) ? get_query_var( 'paged' ) : 1;

		// Instantiate custom query
		$custom_query = new WP_Query( $custom_query_args );

		$parameter_Scenepass = $_POST['parameter_Scenepass'];
		
		// Pre-instantiate managers for performance
		$compiler = new VRodos_Compiler_Manager();
		$nodeJSpath = $compiler->nodeJSpath();

		// Output custom query loop
		if ( $custom_query->have_posts() ) {

			echo '<div id="vrodos-list-projects-container" class="tw-flex tw-flex-col tw-gap-6 tw-mt-4" data-project-count="' . $custom_query->found_posts . '">';
			$i = 1;
			while ( $custom_query->have_posts() ) :

				$custom_query->the_post();

				$game_id    = get_the_ID();
				$game_title = get_the_title();
				$game_date  = get_the_date();

				// Stagger limit to 4
				$stagger = ( $i % 4 ) == 0 ? 4 : ( $i % 4 );
				$i++;

				$game_type_obj = VRodos_Core_Manager::vrodos_return_project_type( $game_id );

				$all_game_category = get_the_terms( $game_id, 'vrodos_game_type' );
				$game_category     = $all_game_category[0]->slug;
				$scene_data        = VRodos_Core_Manager::vrodos_getFirstSceneID_byProjectID( $game_id, $game_category );// first 3D scene id

				// Count scenes and assets-in-scenes for this project
				$scene_pgame_term = get_term_by( 'slug', get_post( $game_id )->post_name, 'vrodos_scene_pgame' );
				$scene_count      = 0;
				$asset_count      = 0;
				if ( $scene_pgame_term ) {
					$scene_ids  = VRodos_Core_Manager::vrodos_get_all_sceneids_of_game( $scene_pgame_term->term_id );
					$scene_count = count( $scene_ids );
					foreach ( $scene_ids as $sid ) {
						$scene_json = json_decode( get_post_field( 'post_content', $sid ), true );
						if ( ! empty( $scene_json['objects'] ) && is_array( $scene_json['objects'] ) ) {
							$asset_count += count( $scene_json['objects'] );
						}
					}
				}

				$editscenePage = VRodos_Core_Manager::vrodos_getEditpage( 'scene' );

				$edit_scene_page_id = $editscenePage[0]->ID;

				$loadMainSceneLink = esc_url( ( get_permalink( $edit_scene_page_id ) . $parameter_Scenepass . $scene_data['id'] . '&vrodos_game=' . $game_id . '&scene_type=' . $scene_data['type'] ) );
				$loadMasterClientLink = $nodeJSpath . 'Master_Client_' . $scene_data['id'] . '.html';

				$assets_list_page    = VRodos_Core_Manager::vrodos_getEditpage( 'assetslist' );
				$assets_list_page_id = $assets_list_page[0]->ID;
				$loadProjectAssets   = esc_url( get_permalink( $assets_list_page_id ) . '?vrodos_project_id=' . $game_id );

				$is_initial_load = isset($_POST['is_initial_load']) && $_POST['is_initial_load'] === 'true';
				$stagger_classes = $is_initial_load ? '' : 'tw-animate-fade-in-up tw-stagger-' . $stagger;

					// Get scene thumbnail
				$scene_thumb_url = '';
				if ( ! empty( $scene_data['id'] ) && has_post_thumbnail( $scene_data['id'] ) ) {
					$scene_thumb_url = get_the_post_thumbnail_url( $scene_data['id'], 'medium' );
				}
				$is_expo = str_contains( strtolower( $game_type_obj->slug ?? '' ), 'vrexpo' ) || str_contains( strtolower( $game_type_obj->string ?? '' ), 'expo' );

				echo '<div class="tw-bg-base-100 tw-border tw-border-base-300 tw-rounded-lg tw-overflow-hidden hover:tw-border-primary/30 tw-transition-all tw-group ' . $stagger_classes . '">';
				echo '<div class="tw-flex tw-items-stretch">';

				// 1. Thumbnail
				echo '<a href="' . $loadMainSceneLink . '" class="tw-block tw-w-36 tw-min-h-[90px] tw-flex-shrink-0 tw-overflow-hidden tw-bg-base-200">';
				if ( $scene_thumb_url ) {
					echo '<img src="' . esc_url( $scene_thumb_url ) . '" alt="" class="tw-w-full tw-h-full tw-object-cover group-hover:tw-scale-105 tw-transition-transform tw-duration-500" />';
				} else {
					echo '<div class="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-text-base-content/20">';
					echo '<i data-lucide="' . ( $is_expo ? 'globe' : 'clapperboard' ) . '" class="tw-w-8 tw-h-8"></i>';
					echo '</div>';
				}
				echo '</a>';

				// 2. Content
				echo '<div class="tw-flex tw-flex-1 tw-items-center tw-justify-between tw-px-4 tw-py-3 tw-gap-4 tw-min-w-0">';

				// 2a. Info
				echo '<div class="tw-min-w-0 tw-flex tw-flex-col tw-gap-1">';
				echo '<div id="' . $game_id . '-title" class="tw-text-sm tw-font-bold tw-text-base-content tw-truncate">' . esc_html( $game_title ) . '</div>';
				echo '<div class="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">';
				echo '<span class="tw-text-[9px] tw-font-bold tw-text-primary tw-bg-primary/10 tw-px-1.5 tw-py-0.5 tw-rounded tw-uppercase">' . esc_html( $game_type_obj->string ) . '</span>';
				echo '<span class="tw-text-[10px] tw-text-base-content/40">' . esc_html( $game_date ) . '</span>';
				echo '<span class="tw-text-[9px] tw-font-medium tw-text-base-content/30 tw-flex tw-items-center tw-gap-0.5" title="Scenes"><i data-lucide="layers" class="tw-w-3 tw-h-3"></i>' . $scene_count . '</span>';
				echo '<span class="tw-text-[9px] tw-font-medium tw-text-base-content/30 tw-flex tw-items-center tw-gap-0.5" title="Assets"><i data-lucide="box" class="tw-w-3 tw-h-3"></i>' . $asset_count . '</span>';
				echo '</div>';
				echo '</div>';

				// 2b. Actions
				echo '<div class="tw-flex tw-items-center tw-gap-2 tw-flex-shrink-0">';
				echo '<a href="' . $loadProjectAssets . '" class="tw-btn tw-btn-outline tw-btn-sm tw-text-[10px] tw-font-bold tw-rounded-md" title="Manage assets">ASSETS</a>';
				echo '<a id="3d-editor-bt-' . $game_id . '" href="' . $loadMainSceneLink . '" class="tw-btn tw-btn-primary tw-btn-sm tw-text-white tw-px-4 tw-rounded-md tw-text-[10px] tw-font-bold" title="Open 3D Editor">3D EDITOR</a>';
				echo '<button type="button" class="tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-text-base-content/20 hover:tw-text-error hover:tw-bg-error/10 tw-rounded tw-transition-all vrodos-delete-project-btn" data-game-id="' . $game_id . '" data-game-title="' . esc_attr( $game_title ) . '" title="Delete project">';
				echo '<i data-lucide="trash-2" class="tw-w-4 tw-h-4"></i>';
				echo '</button>';
				echo '</div>';

				echo '</div>'; // content
				echo '</div>'; // flex row
				echo '</div>'; // card
			endwhile;

			echo '</div>';

			wp_reset_postdata();
			// $wp_query = NULL;
			// $wp_query = $temp_query;

		} else {

			echo '<div class="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-20 tw-text-center">';
			echo '<div class="tw-w-20 tw-h-20 tw-rounded-full tw-bg-base-200 tw-flex tw-items-center tw-justify-center tw-mb-4">';
			echo '<i data-lucide="folder-open" class="tw-w-10 tw-h-10 tw-text-base-content/30"></i>';
			echo '</div>';
			echo '<h3 class="tw-text-lg tw-font-semibold tw-text-base-content/70 tw-mb-1">No projects yet</h3>';
			echo '<p class="tw-text-sm tw-text-base-content/40">Create your first project to get started</p>';
			echo '</div>';
		}

		wp_die();
	}

	public function vrodos_fetch_game_assets_action_callback() {

		// Output the directory listing as JSON
		header( 'Content-type: application/json' );

		$response = VRodos_Core_Manager::vrodos_get_assets_by_game( $_POST['gameProjectSlug'], $_POST['gameProjectID'] );

		$compiler = new VRodos_Compiler_Manager();
		for ( $i = 0; $i < count( $response ); $i++ ) {
			if ( isset( $response[ $i ]['assetName'] ) ) {
				$response[ $i ]['name'] = $response[ $i ]['assetName'];
				$response[ $i ]['type'] = 'file';
			}
			// Normalize all paths in the asset data
			foreach ( ['glb_path', 'path', 'screenshot_path', 'video_path', 'poi_img_path'] as $key ) {
				if ( isset( $response[ $i ][ $key ] ) ) {
					$response[ $i ][ $key ] = $compiler->normalize_url( $response[ $i ][ $key ] );
				}
			}
		}

		$jsonResp = json_encode(
			['items' => $response],
			JSON_UNESCAPED_SLASHES
		);

		echo $jsonResp;
		wp_die();
	}
}
