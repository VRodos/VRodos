<?php

require_once __DIR__ . '/admin/class-vrodos-admin-dashboard-page.php';

class VRodos_Core_Manager {

	public function __construct() {
		add_filter( 'login_redirect', $this->vrodos_default_page(...) );

		// Custom hooks
		add_filter( 'upload_mimes', $this->vrodos_mime_types(...) );
		add_filter( 'wp_check_filetype_and_ext', $this->vrodos_bypass_upload_restriction(...), 10, 5 );
		add_action( 'plugins_loaded', $this->vrodos_admin_hooks(...) );
		add_action( 'login_headerurl', $this->vrodos_lost_password_redirect(...) );
		add_action( 'after_setup_theme', $this->disable_widgets_block_editor(...) );
		remove_filter( 'the_content', 'wpautop' );
	}

	public function vrodos_admin_hooks(): void {
		if ( $GLOBALS['pagenow'] == 'post.php' ) {
			add_action( 'admin_print_scripts', $this->my_admin_scripts(...) );
			add_action( 'admin_print_styles', $this->my_admin_styles(...) );
		}
	}

	public function my_admin_scripts(): void {
		wp_enqueue_script( 'jquery' );
		wp_enqueue_script( 'media-upload' );
		wp_enqueue_script( 'thickbox' );
	}


	public function my_admin_styles(): void {
		wp_enqueue_style( 'thickbox' );
	}

	public function vrodos_lost_password_redirect(): void {
		// Check if have submitted
		$confirm = $_GET['checkemail'] ?? '';

		if ( $confirm ) {
			wp_redirect( get_site_url() );
			exit;
		}
	}

	public function disable_widgets_block_editor(): void {
		remove_theme_support( 'widgets-block-editor' );
	}

	public function vrodos_mime_types( $mime_types ): array {
		$mime_types['json'] = 'text/json';
		$mime_types['mp4']  = 'video/mp4';
		$mime_types['ogv']  = 'application/ogg';
		$mime_types['ogg']  = 'audio/ogg';
		$mime_types['mp3']  = 'audio/mpeg';
		$mime_types['m4a']  = 'audio/mp4';
		$mime_types['wav']  = 'audio/wav';
		$mime_types['oga']  = 'audio/ogg';
		$mime_types['glb']  = 'model/gltf-binary';
		$mime_types['zip']  = 'application/zip';
		$mime_types['blend'] = 'application/octet-stream';
		$mime_types['fbx']  = 'application/octet-stream';
		$mime_types['obj']  = 'text/plain';
		$mime_types['dae']  = 'model/vnd.collada+xml';
		$mime_types['gltf'] = 'model/gltf+json';
		$mime_types['txt']  = 'text/plain';
		$mime_types['rtf']  = 'application/rtf';
		return $mime_types;
	}

	public function vrodos_bypass_upload_restriction( $data, $file, $filename, $mimes, $real_mime = '' ) {
		if ( empty( $data['ext'] ) || empty( $data['type'] ) ) {
			$ext = pathinfo( $filename, PATHINFO_EXTENSION );
			$ext = strtolower( (string) $ext );
			if ( 'glb' === $ext ) {
				$data['ext']  = $ext;
				$data['type'] = 'model/gltf-binary';
			} elseif ( 'zip' === $ext ) {
				$data['ext']  = $ext;
				$data['type'] = 'application/zip';
			} elseif ( in_array( $ext, [ 'blend', 'fbx' ], true ) ) {
				$data['ext']  = $ext;
				$data['type'] = 'application/octet-stream';
			} elseif ( 'obj' === $ext ) {
				$data['ext']  = $ext;
				$data['type'] = 'text/plain';
			} elseif ( 'dae' === $ext ) {
				$data['ext']  = $ext;
				$data['type'] = 'model/vnd.collada+xml';
			} elseif ( 'gltf' === $ext ) {
				$data['ext']  = $ext;
				$data['type'] = 'model/gltf+json';
			} elseif ( 'txt' === $ext ) {
				$data['ext']  = 'txt';
				$data['type'] = 'text/plain';
			} elseif ( 'rtf' === $ext ) {
				$data['ext']  = 'rtf';
				$data['type'] = 'application/rtf';
			}
		}
		return $data;
	}

	public static function resolve_media_meta_url( $meta_value ): string {
		if ( empty( $meta_value ) ) {
			return '';
		}

		if ( is_numeric( $meta_value ) ) {
			return self::normalize_media_url( wp_get_attachment_url( (int) $meta_value ) ?: '' );
		}

		return self::normalize_media_url( esc_url_raw( (string) $meta_value ) );
	}

	private static function normalize_media_url( string $url ): string {
		if ( $url === '' ) {
			return '';
		}

		$url = (string) preg_replace( '#(?<!:)/{2,}#', '/', $url );
		$parsed_url = parse_url( $url );
		$path = isset( $parsed_url['path'] ) ? (string) $parsed_url['path'] : '';

		if ( preg_match( '#/wp-content/plugins/[^/]+/images/(.+)$#', $path, $matches ) ) {
			$legacy_relative = ltrim( str_replace( '\\', '/', $matches[1] ), '/' );
			$mapped_relative = self::map_legacy_image_relative_path( $legacy_relative );

			if ( $mapped_relative !== '' ) {
				return VRodos_Path_Manager::image_url( $mapped_relative );
			}
		}

		return $url;
	}

	private static function map_legacy_image_relative_path( string $legacy_relative ): string {
		if ( $legacy_relative === '' ) {
			return '';
		}

		if (
			str_starts_with( $legacy_relative, 'hdr/' ) ||
			str_starts_with( $legacy_relative, 'lights/' ) ||
			str_starts_with( $legacy_relative, 'screenshots/' ) ||
			str_starts_with( $legacy_relative, 'textures/' ) ||
			str_starts_with( $legacy_relative, 'ui/' ) ||
			str_starts_with( $legacy_relative, 'runtime/' )
		) {
			return $legacy_relative;
		}

		return 'ui/' . basename( $legacy_relative );
	}

	private static function normalize_cefr_levels_meta( $meta_value ): array {
		$levels = maybe_unserialize( $meta_value );
		if ( ! is_array( $levels ) ) {
			return [];
		}

		$allowed    = [ 'A1', 'A2', 'B1', 'B2', 'ALL', 'ALL LEVELS' ];
		$normalized = [];

		foreach ( $levels as $level ) {
			if ( is_array( $level ) || is_object( $level ) ) {
				continue;
			}

			$level = strtoupper( trim( (string) $level ) );
			if ( $level === '' || ! in_array( $level, $allowed, true ) || in_array( $level, $normalized, true ) ) {
				continue;
			}

			$normalized[] = $level;
		}

		return $normalized;
	}

	private static function encode_cefr_levels_meta( $meta_value ): string {
		$levels = self::normalize_cefr_levels_meta( $meta_value );
		if ( empty( $levels ) ) {
			return '';
		}

		$json = wp_json_encode( $levels );
		return is_string( $json ) && $json !== '' ? base64_encode( $json ) : '';
	}

	public static function get_builtin_audio_marker_url(): string {
		return VRodos_Path_Manager::model_url( 'runtime/speaker.glb' );
	}

	public static function get_builtin_audio_thumbnail_url(): string {
		return VRodos_Path_Manager::image_url( 'ui/audio.png' );
	}

	public static function vrodos_plugin_main_page(): void {
		VRodos_Admin_Dashboard_Page::render();
	}


	public static function vrodos_getVideoAttachmentsFromMediaLibrary(): array {

		$query_images_args = ['post_type'      => 'attachment', 'post_mime_type' => 'video', 'post_status'    => 'inherit', 'posts_per_page' => - 1];

		$query_images = new WP_Query( $query_images_args );

		$videos = [];
		foreach ( $query_images->posts as $image ) {
			$videos[] = wp_get_attachment_url( $image->ID );
		}

		return $videos;
	}

	public static function vrodos_getFirstSceneID_byProjectID( $project_id, $project_type ): array {
		$gamePost = get_post( $project_id );
		$gameSlug = $gamePost->post_name;

		$scene_type_slug = 'wonderaround-yaml';

		// First try: filter by yaml scene type
		$custom_query_args = ['post_type' => 'vrodos_scene', 'posts_per_page' => 1, 'tax_query' => ['relation' => 'AND', ['taxonomy' => 'vrodos_scene_pgame', 'field' => 'slug', 'terms' => $gameSlug], ['taxonomy' => 'vrodos_scene_yaml', 'field' => 'slug', 'terms' => $scene_type_slug]], 'orderby' => 'menu_order', 'order' => 'ASC'];
		$scene_data        = [];
		$custom_query      = new WP_Query( $custom_query_args );

		if ( $custom_query->have_posts() ) {
			$custom_query->the_post();
			$scene_data['id']   = get_the_ID();
			$scene_data['type'] = get_post_meta( get_the_ID(), 'vrodos_scene_metatype', true );
			wp_reset_postdata();
			return $scene_data;
		}

		// Fallback: any scene for this project (no yaml filter)
		$scene_pgame_term = get_term_by( 'slug', $gameSlug, 'vrodos_scene_pgame' );
		if ( $scene_pgame_term ) {
			$fallback_query = new WP_Query( ['post_type' => 'vrodos_scene', 'posts_per_page' => 1, 'tax_query' => [['taxonomy' => 'vrodos_scene_pgame', 'field' => 'term_id', 'terms' => $scene_pgame_term->term_id]], 'orderby' => 'menu_order', 'order' => 'ASC'] );
			if ( $fallback_query->have_posts() ) {
				$fallback_query->the_post();
				$scene_data['id']   = get_the_ID();
				$scene_data['type'] = get_post_meta( get_the_ID(), 'vrodos_scene_metatype', true );
				wp_reset_postdata();
				return $scene_data;
			}
		}

		wp_reset_postdata();
		return $scene_data;
	}

	public static function vrodos_the_slug_exists( $post_name ): bool {
		global $wpdb;
		if ( $wpdb->get_row( "SELECT post_name FROM wp_posts WHERE post_name = '" . $post_name . "'", 'ARRAY_A' ) ) {
			return true;
		} else {
			return false;
		}
	}

	public function vrodos_default_page(): string {
		return home_url();
	}

	public static function vrodos_get_all_doors_of_project_fastversion( $parent_project_id_as_term_id ): array {

		// Define custom query parameters
		$custom_query_args = ['post_type'      => 'vrodos_scene', 'posts_per_page' => -1, 'tax_query'      => [['taxonomy' => 'vrodos_scene_pgame', 'field'    => 'term_id', 'terms'    => $parent_project_id_as_term_id]], 'orderby'        => 'menu_order', 'order'          => 'ASC'];

		$custom_query = new WP_Query( $custom_query_args );

		$doorInfoGathered = [];

		// Output custom query loop
		if ( $custom_query->have_posts() ) {
			while ( $custom_query->have_posts() ) {
				$custom_query->the_post();

				$scene_id   = get_the_ID();
				$sceneTitle = get_the_title();  // get_post($scene_id)->post_title;
				$sceneSlug  = get_post()->post_name;

				$scene_json = get_post()->post_content;

				// $scene_json = get_post_meta($scene_id, 'vrodos_scene_json_input', true);
				$jsonScene    = htmlspecialchars_decode( $scene_json );
				$sceneJsonARR = json_decode( $jsonScene, true );

				if ( trim( $jsonScene ) === '' ) {
					continue;
				}

				if ( $sceneJsonARR['objects'] != null ) {
					if ( count( $sceneJsonARR['objects'] ) > 0 ) {
						foreach ( $sceneJsonARR['objects'] as $key => $value ) {
							if ( $key !== 'avatarCamera' ) {
								if ( $value['category_name'] === 'Decoration' ) {
									$doorInfoGathered[] = ['door'      => $value['doorName_source'], 'scene'     => $sceneTitle, 'sceneSlug' => $sceneSlug];
								}
							}
						}
					}
				}
			}
		}

		wp_reset_postdata();

		return $doorInfoGathered;
	}


	public static function vrodos_get_all_sceneids_of_game( $parent_project_id_as_term_id ): array {

		$sceneIds = [];

		// Define custom query parameters
		$custom_query_args = ['post_type'      => 'vrodos_scene', 'posts_per_page' => -1, 'tax_query'      => [['taxonomy' => 'vrodos_scene_pgame', 'field'    => 'term_id', 'terms'    => $parent_project_id_as_term_id]], 'orderby'        => 'menu_order', 'order'          => 'ASC'];

		$custom_query = new WP_Query( $custom_query_args );

		if ( $custom_query->have_posts() ) {
			while ( $custom_query->have_posts() ) {
				$custom_query->the_post();
				$scene_id   = get_the_ID();
				$sceneIds[] = $scene_id;
			}
		}

		return $sceneIds;
	}

	public static function vrodos_project_type_icon( $project_category ): string {

		// Set game type icon
		$project_type_icon = match ( $project_category ) {
			'vrexpo' => 'globe',
			'virtualproduction' => 'clapperboard',
			default => 'landmark',
		};
		return $project_type_icon;
	}

	public static function vrodos_return_project_type( $id ): ?stdClass {

		if ( ! $id ) {
			return null;
		}

		$all_project_category = get_the_terms( $id, 'vrodos_game_type' );

		$project_category = $all_project_category ? $all_project_category[0]->name : null;

		$project_type_icon = self::vrodos_project_type_icon( $project_category );

		$obj         = new stdClass();
		$obj->slug   = $all_project_category ? $all_project_category[0]->slug : null;
		$obj->string = $project_category;
		$obj->icon   = $project_type_icon;

		return $obj;
	}

	public static function vrodos_getEditpage( $type ) {

		$templateURL = match ( $type ) {
			'allgames', 'game' => VRodos_Path_Manager::canonical_page_template_meta( 'vrodos-project-manager-template.php' ),
			'assetslist' => VRodos_Path_Manager::canonical_page_template_meta( 'vrodos-assets-list-template.php' ),
			'scene' => VRodos_Path_Manager::canonical_page_template_meta( 'vrodos-edit-3D-scene-template.php' ),
			'asset' => VRodos_Path_Manager::canonical_page_template_meta( 'vrodos-asset-editor-template.php' ),
			default => null,
		};

		if ( $templateURL ) {
			$pages = get_pages(
				['hierarchical' => 0, 'parent'       => -1, 'meta_key'     => '_wp_page_template', 'meta_value'   => $templateURL]
			);

			if ( empty( $pages ) ) {
				$legacy_template_url = VRodos_Path_Manager::legacy_page_template_meta( $templateURL );
				$pages               = get_pages(
					['hierarchical' => 0, 'parent'       => -1, 'meta_key'     => '_wp_page_template', 'meta_value'   => $legacy_template_url]
				);
			}

			return $pages;
		} else {
			return false;
		}
	}

	public static function vrEditorBreadcrumpDisplay(
		$scene_post,
		$goBackTo_AllProjects_link,
		$project_type,
		$project_type_icon,
		$project_post
	): void {

		$scene_title = $scene_post ? $scene_post->post_title : ' ';

		echo '<div class="vrodos-scene-breadcrumb tw-flex tw-items-center tw-gap-1 tw-text-white tw-h-full">' .
			// Project Scene path at breadcrump
			' <div class="projectNameBreadcrump tw-flex tw-items-center">' .
			'<a title="Back" class="tw-ml-2 tw-mr-3 hover:tw-opacity-80 tw-transition-opacity"' .
			' href="' . $goBackTo_AllProjects_link . '">' .
			'<i data-lucide="arrow-left" class="tw-text-white" style="width:18px; height:18px;"></i>' .
			'</a>' .
			'<i data-lucide="' . $project_type_icon . '" class="tw-text-white/60 tw-mr-2"' .
			' title="' . $project_type . '" style="width:18px; height:18px;">' .
			'</i> ' .
			'<span title="Project Title" class="tw-font-medium tw-text-sm">' . ( $project_post ? esc_html( $project_post->post_title ) : '' ) . '</span>' .
			'<i data-lucide="chevron-right" class="tw-text-white/40 tw-mx-1" style="width:16px; height:16px;"></i>' .
			'</div>' .
			// Title Name at breadcrumps
			'<input id="sceneTitleInput" name="sceneTitleInput"' .
			' title="Scene Title" placeholder="Scene Title"' .
			' value="' . $scene_title . '" type="text"' .
			' class="tw-text-white tw-bg-slate-700 tw-font-bold tw-text-sm tw-w-48 focus:tw-bg-white/10 tw-px-2 tw-rounded tw-transition-colors"' .
			' aria-controls="title-validation-msg" minlength="3" required>' .
			'<p id="title-validation-msg"' .
			' class="tw-text-xs tw-text-warning tw-hidden titleLengthSuggest">' .
			' Must be at least 3 characters long' .
			'</p>' .
			'</div>';
	}

	/**
	 * Get the Assets of a game plus its respective joker game assets
	 *
	 * @param $gameProjectSlug
	 * @param $gameProjectID
	 */
	public static function vrodos_get_assets_by_game( $gameProjectSlug, $gameProjectID ): array {

		$allAssets = [];

		// 1. Project-specific asset IDs via taxonomy
		$project_ids = [];
		if ( ! empty( $gameProjectSlug ) ) {
			$project_ids = get_posts( [
				'post_type'      => 'vrodos_asset3d',
				'posts_per_page' => -1,
				'fields'         => 'ids',
				'tax_query'      => [ [ 'taxonomy' => 'vrodos_asset3d_pgame', 'field' => 'slug', 'terms' => [ $gameProjectSlug ] ] ],
			] );
		}

		// 2. Shared asset IDs via meta flag — more reliable than taxonomy lookup
		$shared_ids = get_posts( [
			'post_type'      => 'vrodos_asset3d',
			'posts_per_page' => -1,
			'fields'         => 'ids',
			'meta_query'     => [ [ 'key' => 'vrodos_asset3d_isJoker', 'value' => 'true', 'compare' => '=' ] ],
		] );

		$all_ids = array_unique( array_merge( $project_ids, $shared_ids ) );

		if ( empty( $all_ids ) ) {
			return $allAssets;
		}

		$queryargs = [ 'post_type' => 'vrodos_asset3d', 'posts_per_page' => -1, 'post__in' => $all_ids, 'orderby' => 'post__in' ];

		$custom_query = new WP_Query( $queryargs );

		if ( $custom_query->have_posts() ) :
			while ( $custom_query->have_posts() ) :

				$custom_query->the_post();

				$asset_id      = get_the_ID();
				$asset_cat_arr = wp_get_post_terms( $asset_id, 'vrodos_asset3d_cat' );

				// Skip assets with no category — accessing $asset_cat_arr[0] would crash
				if ( is_wp_error( $asset_cat_arr ) || empty( $asset_cat_arr ) ) {
					continue;
				}

				$glbID   = get_post_meta( $asset_id, 'vrodos_asset3d_glb', true ); // GLB ID or URL
				$glbPath = self::resolve_media_meta_url( $glbID );                  // GLB PATH

				$sshotID   = get_post_meta( $asset_id, 'vrodos_asset3d_screenimage', true ); // Screenshot Image ID or remote URL
				$sshotPath = '';
				if ( $sshotID ) {
					$sshotUrl = self::resolve_media_meta_url( $sshotID );
					if ( $sshotUrl ) {
						if ( is_numeric( $sshotID ) ) {
							$cache     = get_post_modified_time( 'U', false, (int) $sshotID );
							$sshotPath = add_query_arg( 't', $cache ?: time(), $sshotUrl );
						} else {
							$sshotPath = $sshotUrl;
						}
					}
				}

				$data_arr = ['asset_name'      => get_the_title(), 'asset_slug'      => get_post()->post_name, 'asset_id'        => $asset_id, 'category_name'   => $asset_cat_arr[0]->name, 'category_slug'   => $asset_cat_arr[0]->slug, 'category_id'     => $asset_cat_arr[0]->term_id, 'category_icon'   => get_term_meta( $asset_cat_arr[0]->term_id, 'vrodos_assetcat_icon', true ), 'glb_id'          => $glbID, 'glb_path'        => $glbPath, 'path'            => $glbPath, 'screenshot_id'   => $sshotID, 'screenshot_path' => $sshotPath, 'is_shared'        => get_post_meta( $asset_id, 'vrodos_asset3d_isJoker', true )];

				$immerse_cefr_levels = self::encode_cefr_levels_meta(
					get_post_meta( $asset_id, 'vrodos_asset3d_immerse_cefr_levels', true )
				);
				if ( ! empty( $immerse_cefr_levels ) ) {
					$data_arr['immerse_cefr_levels'] = $immerse_cefr_levels;
				}

				switch ( $asset_cat_arr[0]->slug ) {
					case 'audio':
						$data_arr['audio_id']                = get_post_meta( $asset_id, 'vrodos_asset3d_audio', true );
						$data_arr['audio_path']              = self::resolve_media_meta_url( $data_arr['audio_id'] );
						$data_arr['audio_playback_mode']     = get_post_meta( $asset_id, 'vrodos_asset3d_audio_playback_mode', true ) ?: 'interact';
						$data_arr['audio_loop']              = get_post_meta( $asset_id, 'vrodos_asset3d_audio_loop', true );
						$data_arr['audio_volume']            = get_post_meta( $asset_id, 'vrodos_asset3d_audio_volume', true ) ?: '1';
						$data_arr['audio_ref_distance']      = get_post_meta( $asset_id, 'vrodos_asset3d_audio_ref_distance', true ) ?: '2';
						$data_arr['audio_max_distance']      = get_post_meta( $asset_id, 'vrodos_asset3d_audio_max_distance', true ) ?: '20';
						$data_arr['audio_rolloff_factor']    = get_post_meta( $asset_id, 'vrodos_asset3d_audio_rolloff_factor', true ) ?: '1';
						$data_arr['audio_distance_model']    = 'inverse';
						$data_arr['screenshot_path']         = $data_arr['screenshot_path'] ?: self::get_builtin_audio_thumbnail_url();
						break;
					case 'video':
						$data_arr['video_id']    = get_post_meta( $asset_id, 'vrodos_asset3d_video', true );
						$data_arr['video_path']  = self::resolve_media_meta_url( $data_arr['video_id'] );
						$data_arr['video_title'] = get_post_meta( $asset_id, 'vrodos_asset3d_video_title', true );
						$data_arr['video_loop']  = get_post_meta( $asset_id, 'vrodos_asset3d_video_autoloop', true );
						break;
					case 'poi-imagetext':
						$data_arr['poi_img_id']      = get_post_meta( $asset_id, 'vrodos_asset3d_poi_imgtxt_image', true );
						$data_arr['poi_img_path']    = self::resolve_media_meta_url( $data_arr['poi_img_id'] );
						$data_arr['poi_img_title']   = get_post_meta( $asset_id, 'vrodos_asset3d_poi_imgtxt_title', true );
						$data_arr['poi_img_content'] = get_post_meta( $asset_id, 'vrodos_asset3d_poi_imgtxt_content', true );
						break;
					/*
						case 'chat':
							$data_arr['chat_type'] = get_post_meta($asset_id, 'vrodos_asset3d_chat_type', true);
							break;*/
					case 'image':
						$data_arr['image_id']   = get_post_meta( $asset_id, 'vrodos_asset3d_image', true );
						$data_arr['image_path'] = self::resolve_media_meta_url( $data_arr['image_id'] );
						break;
					case '3d-text':
						$text_content = (string) get_post_meta( $asset_id, 'vrodos_asset3d_text_content', true );
						$data_arr['text_content_b64'] = base64_encode( $text_content );
						$data_arr['text_format']      = get_post_meta( $asset_id, 'vrodos_asset3d_text_format', true );
						$data_arr['text_truncated']   = get_post_meta( $asset_id, 'vrodos_asset3d_text_truncated', true );
						break;
					case 'poi-link':
						$data_arr['poi_link_url'] = get_post_meta( $asset_id, 'vrodos_asset3d_link', true );
						break;
					case 'chat':
						$data_arr['poi_chat_title']        = get_post_meta( $asset_id, 'vrodos_asset3d_poi_chattxt_title', true );
						$data_arr['poi_chat_participants'] = get_post_meta( $asset_id, 'vrodos_asset3d_poi_chatnum_people', true );
						$data_arr['poi_chat_indicators']   = get_post_meta( $asset_id, 'vrodos_asset3d_poi_chatbut_indicators', true );
						break;
				}

				// Immerse connector integration: allow external plugins to enrich or hide
				// asset browser items for a specific project without changing the generic flow.
				$data_arr = apply_filters(
					'vrodos_asset_browser_item_data',
					$data_arr,
					$asset_id,
					(int) $gameProjectID,
					(string) $gameProjectSlug
				);

				if ( ! is_array( $data_arr ) || empty( $data_arr ) ) {
					continue;
				}

				array_push( $allAssets, $data_arr );

			endwhile;
		endif;

		// Reset postdata
		wp_reset_postdata();

		return $allAssets;
	}

	public static function vrodos_getDefaultJSONscene( $mygameType ): string {

		return match ( $mygameType ) {
			default => file_get_contents( VRodos_Path_Manager::standard_scene_path() ),
		};
	}

	public static function vrodos_get_user_game_projects( $user_id, $isUserAdmin ): array {

		$games_slugs = ['shared-assets-repository'];

		// user is not logged in return only shared game repository project slug
		if ( $user_id == 0 ) {
			return $games_slugs;
		}

		$custom_query_args = [
      // 'author' => $user_id,
      'post_type'      => 'vrodos_game',
      'posts_per_page' => -1,
  ];

		// if user is not admin then add as filter the author (else the admin can see all authors)
		if ( ! $isUserAdmin ) {
			$custom_query_args['author'] = $user_id;
		}

		$custom_query = new WP_Query( $custom_query_args );

		if ( $custom_query->have_posts() ) :
			while ( $custom_query->have_posts() ) :
				$custom_query->the_post();
				$game_slug     = get_post()->post_name;
				$games_slugs[] = $game_slug;
				endwhile;
			endif;

		wp_reset_postdata();

		return array_unique( $games_slugs );
	}

	public static function get_scenes_wonder_around(): array {
		$allAssets = [];

		$custom_query_args = ['post_type'      => 'vrodos_scene', 'posts_per_page' => - 1, 'tax_query'      => [['taxonomy' => 'vrodos_scene_yaml', 'field'    => 'slug', 'terms'    => 'wonderaround-yaml']], 'orderby'        => 'ID', 'order'          => 'DESC'];

		$custom_query = new WP_Query( $custom_query_args );

		if ( $custom_query->have_posts() ) {
			while ( $custom_query->have_posts() ) {

				$custom_query->the_post();
				$scene_id   = get_the_ID();
				$scene_name = get_the_title();

				$scenePGame = get_the_terms( $scene_id, 'vrodos_scene_pgame' );

				$allAssets[] = ['sceneName'            => $scene_name, 'sceneSlug'            => get_post()->post_name, 'sceneid'              => $scene_id, 'scene_parent_project' => $scenePGame];

			}
		}

		return $allAssets;
	}

	public static function get_assets( $games_slugs ): array {
		// Create a cache key based on the games slugs to ensure per-context caching
		$cache_key = 'vrodos_assets_' . md5( json_encode( $games_slugs ) . get_current_user_id() . '|source-filter-v1' );
		$cached_assets = get_transient( $cache_key );

		if ( false !== $cached_assets ) {
			return $cached_assets;
		}

		$allAssets = [];
		$queryargs = [
			'post_type'      => 'vrodos_asset3d',
			'posts_per_page' => -1,
			'fields'         => 'ids', // Get only IDs first for performance
		];

		if ( $games_slugs ) {
			$queryargs['tax_query'] = [['taxonomy' => 'vrodos_asset3d_pgame', 'field'    => 'slug', 'terms'    => $games_slugs]];
		}

		$asset_ids = get_posts( $queryargs );

		if ( ! empty( $asset_ids ) ) {
			// Warm up caches for all selected posts (meta and terms) in one go
			_prime_post_caches( $asset_ids, true, true );

			foreach ( $asset_ids as $asset_id ) {
				$asset_name    = get_the_title( $asset_id );
				$asset_pgame   = wp_get_post_terms( $asset_id, 'vrodos_asset3d_pgame' );
				$asset_cat_arr = wp_get_post_terms( $asset_id, 'vrodos_asset3d_cat' );

				if ( empty( $asset_cat_arr ) ) {
					continue;
				}

				$glbID   = get_post_meta( $asset_id, 'vrodos_asset3d_glb', true );
				$glbPath = self::resolve_media_meta_url( $glbID );

				$sshotID   = get_post_meta( $asset_id, 'vrodos_asset3d_screenimage', true );
				$sshotPath = '';
				if ( $sshotID ) {
					$sshotUrl = self::resolve_media_meta_url( $sshotID );
					if ( $sshotUrl ) {
						if ( is_numeric( $sshotID ) ) {
							$cache     = get_post_modified_time( 'U', false, (int) $sshotID );
							$sshotPath = add_query_arg( 't', $cache ?: time(), $sshotUrl );
						} else {
							$sshotPath = $sshotUrl;
						}
					}
				}

				$author_id          = get_post_field( 'post_author', $asset_id );
				$author_displayname = get_the_author_meta( 'display_name', $author_id );
				$author_username    = get_the_author_meta( 'nickname', $author_id );
				$assettrs           = get_post_meta( $asset_id, 'vrodos_asset3d_assettrs', true );

				$data_arr = [
					'asset_name'             => $asset_name,
					'asset_slug'             => get_post( $asset_id )->post_name,
					'asset_id'               => $asset_id,
					'category_name'          => $asset_cat_arr[0]->name,
					'category_slug'          => $asset_cat_arr[0]->slug,
					'category_id'            => $asset_cat_arr[0]->term_id,
					'category_icon'          => get_term_meta( $asset_cat_arr[0]->term_id, 'vrodos_assetcat_icon', true ),
					'glb_id'                 => $glbID,
					'glb_path'               => $glbPath,
					'path'                   => $glbPath,
					'screenshot_id'          => $sshotID,
					'screenshot_path'        => $sshotPath,
					'is_shared'              => get_post_meta( $asset_id, 'vrodos_asset3d_isJoker', true ),
					'is_immerse'             => get_post_meta( $asset_id, '_immerse_source', true ) === 'immerse' ? 'true' : 'false',
					'assettrs'               => $assettrs,
					'asset_parent_game'      => ( get_post_meta( $asset_id, 'vrodos_asset3d_isJoker', true ) === 'true' ) ? 'Public Assets' : ( ! empty( $asset_pgame ) ? $asset_pgame[0]->name : '' ),
					'asset_parent_game_slug' => ! empty( $asset_pgame ) ? $asset_pgame[0]->slug : '',
					'author_id'              => $author_id,
					'author_displayname'     => $author_displayname,
					'author_username'        => $author_username
				];

				switch ( $asset_cat_arr[0]->slug ) {
					case 'audio':
						$data_arr['audio_id']             = get_post_meta( $asset_id, 'vrodos_asset3d_audio', true );
						$data_arr['audio_path']           = self::resolve_media_meta_url( $data_arr['audio_id'] );
						$data_arr['audio_playback_mode']  = get_post_meta( $asset_id, 'vrodos_asset3d_audio_playback_mode', true ) ?: 'interact';
						$data_arr['audio_loop']           = get_post_meta( $asset_id, 'vrodos_asset3d_audio_loop', true );
						$data_arr['audio_volume']         = get_post_meta( $asset_id, 'vrodos_asset3d_audio_volume', true ) ?: '1';
						$data_arr['audio_ref_distance']   = get_post_meta( $asset_id, 'vrodos_asset3d_audio_ref_distance', true ) ?: '2';
						$data_arr['audio_max_distance']   = get_post_meta( $asset_id, 'vrodos_asset3d_audio_max_distance', true ) ?: '20';
						$data_arr['audio_rolloff_factor'] = get_post_meta( $asset_id, 'vrodos_asset3d_audio_rolloff_factor', true ) ?: '1';
						$data_arr['audio_distance_model'] = 'inverse';
						$data_arr['screenshot_path']      = $data_arr['screenshot_path'] ?: self::get_builtin_audio_thumbnail_url();
						break;
					case 'video':
						$data_arr['video_id']    = get_post_meta( $asset_id, 'vrodos_asset3d_video', true );
						$data_arr['video_path']  = self::resolve_media_meta_url( $data_arr['video_id'] );
						$data_arr['video_title'] = get_post_meta( $asset_id, 'vrodos_asset3d_video_title', true );
						$data_arr['video_loop']  = get_post_meta( $asset_id, 'vrodos_asset3d_video_autoloop', true );
						break;
					case 'poi-imagetext':
						$data_arr['poi_img_id']      = get_post_meta( $asset_id, 'vrodos_asset3d_poi_imgtxt_image', true );
						$data_arr['poi_img_path']    = self::resolve_media_meta_url( $data_arr['poi_img_id'] );
						$data_arr['poi_img_title']   = get_post_meta( $asset_id, 'vrodos_asset3d_poi_imgtxt_title', true );
						$data_arr['poi_img_content'] = get_post_meta( $asset_id, 'vrodos_asset3d_poi_imgtxt_content', true );
						break;
					case 'image':
						$data_arr['image_id']   = get_post_meta( $asset_id, 'vrodos_asset3d_image', true );
						$data_arr['image_path'] = self::resolve_media_meta_url( $data_arr['image_id'] );
						break;
					case '3d-text':
						$text_content = (string) get_post_meta( $asset_id, 'vrodos_asset3d_text_content', true );
						$data_arr['text_content_b64'] = base64_encode( $text_content );
						$data_arr['text_format']      = get_post_meta( $asset_id, 'vrodos_asset3d_text_format', true );
						$data_arr['text_truncated']   = get_post_meta( $asset_id, 'vrodos_asset3d_text_truncated', true );
						break;
					case 'poi-link':
						$data_arr['poi_link_url'] = get_post_meta( $asset_id, 'vrodos_asset3d_link', true );
						break;
					case 'chat':
						$data_arr['poi_chat_title']        = get_post_meta( $asset_id, 'vrodos_asset3d_poi_chattxt_title', true );
						$data_arr['poi_chat_participants'] = get_post_meta( $asset_id, 'vrodos_asset3d_poi_chatnum_people', true );
						$data_arr['poi_chat_indicators']   = get_post_meta( $asset_id, 'vrodos_asset3d_poi_chatbut_indicators', true );
						break;
				}
				$allAssets[] = $data_arr;
			}
		}

		set_transient( $cache_key, $allAssets, HOUR_IN_SECONDS );

		return $allAssets;
	}

	/**
	 * Get the Assets of a game plus its respective shared game assets
	 *
	 * @param $gameType
	 */
	public static function vrodos_get_assetids_shared( $gameType ): array {

		$assetIds = [];

		// find the shared game slug e.g. "archaeology-joker" (preserved for compatibility)
		$shared_game_slug = $gameType . '-joker';

		// Slugs are low case 
		$shared_game_slug = strtolower( $shared_game_slug );

		$queryargs = ['post_type'      => 'vrodos_asset3d', 'posts_per_page' => -1, 'tax_query'      => [['taxonomy' => 'vrodos_asset3d_pgame', 'field'    => 'slug', 'terms'    => $shared_game_slug]]];

		$custom_query = new WP_Query( $queryargs );

		if ( $custom_query->have_posts() ) :
			while ( $custom_query->have_posts() ) :
				$custom_query->the_post();
				$assetIds[] = get_the_ID();
			endwhile;
		endif;

		// Reset postdata
		wp_reset_postdata();

		return $assetIds;
	}

	public static function getProjectScenes( $parent_project_id_as_term_id ): WP_Query {

		$custom_query_args = ['post_type'      => 'vrodos_scene', 'posts_per_page' => -1, 'tax_query'      => [['taxonomy' => 'vrodos_scene_pgame', 'field'    => 'term_id', 'terms'    => $parent_project_id_as_term_id]], 'orderby'        => 'menu_order', 'order'          => 'ASC'];

		return new WP_Query( $custom_query_args );
	}

	public static function get_3D_model_files( $assetpostMeta, $asset_id ): array {
		unset( $asset_id );

		$glb_file_name = null;
		if ( array_key_exists( 'vrodos_asset3d_glb', $assetpostMeta ) && ! empty( $assetpostMeta['vrodos_asset3d_glb'][0] ) ) {
			$glb_file_name = self::resolve_media_meta_url( $assetpostMeta['vrodos_asset3d_glb'][0] );
		}

		// Keep the historical keys for compatibility, but only GLB remains an active model source.
		return [
			'mtl'         => null,
			'obj'         => null,
			'pdb'         => null,
			'glb'         => $glb_file_name,
			'fbx'         => null,
			'texturesFbx' => null,
			'path'        => $glb_file_name,
		];
	}


	public static function vrodos_delete_asset_3d_from_scenes( $asset_id, $game_slug ): void {
		$scenes_query_args = ['post_type'      => 'vrodos_scene', 'posts_per_page' => -1, 'tax_query'      => [['taxonomy' => 'vrodos_scene_pgame', 'field'    => 'slug', 'terms'    => $game_slug]]];

		$scenes_query = new WP_Query( $scenes_query_args );

		if ( $scenes_query->have_posts() ) {
			while ( $scenes_query->have_posts() ) {
				$scenes_query->the_post();
				$scene_id      = get_the_ID();
				$scene_content = get_post_field( 'post_content', $scene_id );
				$scene_data    = json_decode( $scene_content, true );
				if ( ! is_array( $scene_data ) || ! isset( $scene_data['objects'] ) || ! is_array( $scene_data['objects'] ) ) {
					continue;
				}

				$original_count = count( $scene_data['objects'] );
				$scene_data['objects'] = array_values( array_filter( $scene_data['objects'], function ( $obj ) use ( $asset_id ) {
					return ! isset( $obj['asset_id'] ) || $obj['asset_id'] != $asset_id;
				} ) );

				if ( count( $scene_data['objects'] ) < $original_count ) {
					wp_update_post(
						['ID'           => $scene_id, 'post_content' => json_encode( $scene_data )]
					);
				}
			}
		}
		wp_reset_postdata();
	}
}
