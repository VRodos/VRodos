<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once plugin_dir_path( __FILE__ ) . '../class-vrodos-compiler-manager.php';

class VRodos_Project_AJAX {

	public function __construct() {
		add_action( 'wp_ajax_vrodos_fetch_list_projects_action', [ $this, 'vrodos_fetch_list_projects_callback' ] );
		add_action( 'wp_ajax_vrodos_delete_game_action', [ $this, 'vrodos_delete_gameproject_frontend_callback' ] );
		add_action( 'wp_ajax_vrodos_rename_project_action', [ $this, 'vrodos_rename_project_frontend_callback' ] );
		add_action( 'wp_ajax_vrodos_create_project_action', [ $this, 'vrodos_create_project_frontend_callback' ] );
	}

	/**
	 * Rename project
	 */
	public function vrodos_rename_project_frontend_callback(): void {
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_send_json_error( 'Insufficient permissions.', 403 );
		}

		$project_id    = absint( $_POST['project_id'] );
		$project_title = sanitize_text_field( (string) $_POST['project_title'] );

		if ( ! $project_id || ! $project_title ) {
			wp_send_json_error( 'Invalid data.' );
		}

		$project_post = get_post( $project_id );
		if ( ! $project_post || $project_post->post_type !== 'vrodos_game' ) {
			wp_send_json_error( 'Invalid project.' );
		}

		$res = wp_update_post( [
			'ID'         => $project_id,
			'post_title' => $project_title
		] );

		if ( is_wp_error( $res ) ) {
			wp_send_json_error( $res->get_error_message() );
		}

		echo $project_title;
		wp_die();
	}

	/**
	 * Create new project
	 */
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
		$project_information = [
			'post_title'   => $project_title, 
			'post_content' => '', 
			'post_type'    => 'vrodos_game', 
			'post_status'  => 'publish', 
			'tax_input'    => $project_taxonomies
		];
		$project_id          = wp_insert_post( $project_information );
		
		if ( is_wp_error( $project_id ) ) {
			wp_send_json_error( $project_id->get_error_message() );
		}
		
		echo $project_id;
		wp_die();
	}

	/**
	 * Delete project and all its associated data (scenes, assets)
	 */
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

		// Delete all assets
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

		// Delete all scenes
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

	/**
	 * Internal helper to delete an asset and its meta
	 */
	private function vrodos_delete_asset3d_noscenes_frontend( $asset_id ): void {
		$glbID = get_post_meta( $asset_id, 'vrodos_asset3d_glb', true );
		wp_delete_attachment( $glbID, true );
		$difID = get_post_meta( $asset_id, 'vrodos_asset3d_diffimage', true );
		wp_delete_attachment( $difID, true );
		$screenID = get_post_meta( $asset_id, 'vrodos_asset3d_screenimage', true );
		wp_delete_attachment( $screenID, true );
		wp_delete_post( $asset_id, true );
	}

	/**
	 * Fetch list of projects and render HTML
	 */
	public function vrodos_fetch_list_projects_callback() {

		$perma_structure     = (bool) get_option( 'permalink_structure' );
		$parameter_Scenepass = $perma_structure ? '?vrodos_scene=' : '&vrodos_scene=';

		// Exclude internal shared-asset repositories from the listing
		$shared_slugs = ['archaeology-joker', 'vrexpo-joker', 'virtualproduction-joker'];
		$shared_ids = [];
		foreach ($shared_slugs as $slug) {
			$post = get_page_by_path($slug, OBJECT, 'vrodos_game');
			if ($post) $shared_ids[] = $post->ID;
		}

		// Define custom query parameters
		$custom_query_args = ['post_type' => 'vrodos_game', 'posts_per_page' => -1];
		if (!empty($shared_ids)) {
			$custom_query_args['post__not_in'] = $shared_ids;
		}

		// Instantiate custom query
		$custom_query = new WP_Query( $custom_query_args );

		$parameter_Scenepass = $_POST['parameter_Scenepass'] ?? $parameter_Scenepass;
		
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
					echo '<div class="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-bg-gradient-to-br tw-from-slate-50 tw-to-slate-100 tw-text-slate-300">';
					echo '<i data-lucide="' . ( $is_expo ? 'globe' : 'clapperboard' ) . '" class="tw-w-14 tw-h-14" stroke-width="1.5"></i>';
					echo '</div>';
				}
				echo '</a>';

				// 2. Content
				echo '<div class="tw-flex tw-flex-1 tw-items-center tw-justify-between tw-px-4 tw-py-3 tw-gap-4 tw-min-w-0">';

				// 2a. Info
				echo '<div class="tw-min-w-0 tw-flex tw-flex-col tw-gap-1">';
				echo '<div class="tw-flex tw-items-center tw-gap-2 tw-group/title tw-min-w-0">';
				echo '<div id="' . $game_id . '-title" class="tw-text-sm tw-font-bold tw-text-base-content tw-truncate">' . esc_html( $game_title ) . '</div>';
				echo '<input id="' . $game_id . '-title-input" type="text" class="tw-input tw-input-xs tw-input-bordered tw-w-full tw-hidden" value="' . esc_attr( $game_title ) . '" />';
				echo '<button type="button" class="tw-p-1 tw-text-base-content/20 hover:tw-text-primary tw-opacity-0 group-hover/title:tw-opacity-100 tw-transition-all vrodos-rename-project-btn" data-game-id="' . $game_id . '" title="Rename project">';
				echo '<i data-lucide="pencil" class="tw-w-3 tw-h-3"></i>';
				echo '</button>';
				echo '<div id="' . $game_id . '-rename-actions" class="tw-flex tw-items-center tw-gap-1 tw-hidden">';
				echo '<button type="button" class="tw-p-1 tw-text-success hover:tw-bg-success/10 tw-rounded vrodos-save-rename-btn" data-game-id="' . $game_id . '" title="Save">';
				echo '<i data-lucide="check" class="tw-w-3 tw-h-3"></i>';
				echo '</button>';
				echo '<button type="button" class="tw-p-1 tw-text-error hover:tw-bg-error/10 tw-rounded vrodos-cancel-rename-btn" data-game-id="' . $game_id . '" title="Cancel">';
				echo '<i data-lucide="x" class="tw-w-3 tw-h-3"></i>';
				echo '</button>';
				echo '</div>';
				echo '</div>';
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
}
