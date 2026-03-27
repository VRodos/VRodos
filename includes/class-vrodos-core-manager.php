<?php

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
		$mime_types['obj']  = 'text/plain';
		$mime_types['mp4']  = 'video/mp4';
		$mime_types['ogv']  = 'application/ogg';
		$mime_types['ogg']  = 'application/ogg';
		$mime_types['mtl']  = 'text/plain';
		$mime_types['mat']  = 'text/plain';
		$mime_types['pdb']  = 'text/plain';
		$mime_types['fbx']  = 'application/octet-stream';
		$mime_types['glb']  = 'model/gltf-binary';
		return $mime_types;
	}

	public function vrodos_bypass_upload_restriction( $data, $file, $filename, $mimes, $real_mime = '' ) {
		if ( empty( $data['ext'] ) || empty( $data['type'] ) ) {
			$ext = pathinfo( $filename, PATHINFO_EXTENSION );
			if ( 'glb' === strtolower( $ext ) ) {
				$data['ext']  = 'glb';
				$data['type'] = 'model/gltf-binary';
			}
		}
		return $data;
	}

	public static function vrodos_plugin_main_page(): void {
		$allProjectsPage = self::vrodos_getEditpage( 'allgames' );

		if ( is_admin() ) {
			if ( ! function_exists( 'get_plugin_data' ) ) {
				require_once ABSPATH . 'wp-admin/includes/plugin.php';
			}
			$plugin_data = get_plugin_data( VRODOS_PLUGIN_FILE );
		}
		?>


		<style>
			/* Prevent Tailwind/DaisyUI from overriding WordPress core backgrounds */
			html, body { background-color: #f0f0f1 !important; }
			#wpwrap { background-color: #f0f0f1 !important; }
			#adminmenuback, #adminmenuwrap { background-color: #1d2327 !important; }
			#wpcontent, #wpbody-content { background: transparent !important; }
			.vrodos-manager-wrapper { 
				background: transparent !important; 
				margin-top: 40px !important;
				margin-bottom: 80px !important;
			}
		</style>
		<div class="vrodos-manager-wrapper tw-px-8 tw-py-12 lg:tw-py-16 tw-bg-transparent">
			<div class="tw-max-w-7xl tw-mx-auto">
				<!-- Header Section -->
				<div class="tw-flex tw-justify-between tw-items-center tw-mb-8">
					<h1 class="tw-text-3xl tw-font-bold tw-text-slate-800">VRodos Dashboard <span class="tw-text-sm tw-font-normal tw-opacity-60">(v<?php echo $plugin_data['Version']; ?>)</span></h1>
				</div>

				<!-- Hero Section -->
				<div class="tw-hero tw-bg-primary tw-text-primary-content tw-rounded-3xl tw-shadow-xl tw-overflow-hidden tw-mb-8" data-theme="emerald">
					<div class="tw-hero-content tw-flex-col lg:tw-flex-row-reverse tw-p-8 lg:tw-p-12 tw-gap-8">
						<div class="tw-relative">
							<div class="tw-absolute -tw-inset-4 tw-bg-white/20 tw-rounded-full tw-blur-3xl"></div>
							<img src="<?php echo plugin_dir_url( VRODOS_PLUGIN_FILE ); ?>images/VRodos_icon_512.png" 
								 alt="VRodos Icon" 
								 class="tw-relative tw-w-40 tw-h-40 lg:tw-w-56 lg:tw-h-56 tw-drop-shadow-2xl">
						</div>
						<div class="tw-max-w-2xl">
							<h1 class="tw-text-5xl tw-font-black tw-mb-6 tw-tracking-tight">Welcome to VRodos!</h1>
							<p class="tw-text-xl tw-opacity-95 tw-mb-10 tw-leading-relaxed">Create immersive 3D, VR and AR experiences directly within WordPress using our powerful WebGL editor.</p>
							<div class="tw-flex tw-flex-wrap tw-gap-4">
								<a href="<?php echo esc_url( get_permalink( $allProjectsPage[0]->ID ) ); ?>" 
								   class="tw-btn tw-btn-secondary tw-btn-lg tw-shadow-lg tw-px-8">
									<i data-lucide="layout-grid" class="tw-w-5 tw-h-5"></i>
									Access Project Manager
								</a>
								<a href="https://vrodos.iti.gr" target="_blank"
								   class="tw-btn tw-btn-ghost tw-btn-lg tw-border-white/20 hover:tw-bg-white/10 tw-text-white">
									Learn more
									<i data-lucide="external-link" class="tw-w-4 tw-h-4"></i>
								</a>
							</div>
						</div>
					</div>
				</div>

				<!-- Stats Overview -->
				<div class="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6 tw-mb-10">
					<?php
					// Get all projects and filter out jokers for the count
					$all_projects = new WP_Query(['post_type' => 'vrodos_game', 'posts_per_page' => -1]);
					$projects_count = 0;
					if ($all_projects->have_posts()) {
						foreach ($all_projects->posts as $p) {
							if (!str_contains($p->post_name, 'joker')) {
								$projects_count++;
							}
						}
					}
					
					$scenes_query = new WP_Query(['post_type' => 'vrodos_scene', 'posts_per_page' => -1]);
					$scenes_count = $scenes_query->found_posts;
					
					$assets_query = new WP_Query(['post_type' => 'vrodos_asset3d', 'posts_per_page' => -1]);
					$assets_count = $assets_query->found_posts;
					?>
					
					<div class="tw-stat tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100 tw-p-6" data-theme="emerald">
						<div class="tw-stat-figure tw-text-primary">
							<i data-lucide="folder-kanban" class="tw-w-8 tw-h-8"></i>
						</div>
						<div class="tw-stat-title tw-text-slate-400 tw-font-bold tw-uppercase tw-tracking-wider tw-text-[10px]">Total Projects</div>
						<div class="tw-stat-value tw-text-slate-900 tw-text-4xl tw-font-black"><?php echo $projects_count; ?></div>
						<div class="tw-stat-desc tw-text-slate-400 tw-mt-1">Manage your 3D worlds</div>
					</div>
					
					<div class="tw-stat tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100 tw-p-6" data-theme="emerald">
						<div class="tw-stat-figure tw-text-secondary">
							<i data-lucide="layers" class="tw-w-8 tw-h-8"></i>
						</div>
						<div class="tw-stat-title tw-text-slate-400 tw-font-bold tw-uppercase tw-tracking-wider tw-text-[10px]">Total Scenes</div>
						<div class="tw-stat-value tw-text-slate-900 tw-text-4xl tw-font-black"><?php echo $scenes_count; ?></div>
						<div class="tw-stat-desc tw-text-slate-400 tw-mt-1">Environment compositions</div>
					</div>
					
					<div class="tw-stat tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100 tw-p-6" data-theme="emerald">
						<div class="tw-stat-figure tw-text-emerald-500">
							<i data-lucide="box" class="tw-w-8 tw-h-8"></i>
						</div>
						<div class="tw-stat-title tw-text-slate-400 tw-font-bold tw-uppercase tw-tracking-wider tw-text-[10px]">Total Assets</div>
						<div class="tw-stat-value tw-text-slate-900 tw-text-4xl tw-font-black"><?php echo $assets_count; ?></div>
						<div class="tw-stat-desc tw-text-slate-400 tw-mt-1">3D models & Media</div>
					</div>
				</div>

				<!-- Recent Projects Table -->
				<div class="tw-card tw-bg-white tw-shadow-sm tw-border tw-border-slate-100 tw-rounded-2xl tw-overflow-hidden" data-theme="emerald">
					<div class="tw-card-body tw-p-0">
						<div class="tw-p-6 tw-border-b tw-border-slate-100 tw-flex tw-justify-between tw-items-center tw-bg-slate-50/50">
							<h3 class="tw-text-lg tw-font-black tw-text-slate-800 tw-flex tw-items-center tw-gap-2 tw-uppercase tw-tracking-tight">
								<i data-lucide="clock" class="tw-w-5 tw-h-5 tw-text-slate-400"></i>
								Active Projects
							</h3>
						</div>
						<div class="tw-overflow-x-auto">
							<table class="tw-table tw-w-full">
								<thead>
									<tr class="tw-bg-slate-50/30">
										<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest">ID</th>
										<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest">Project Title</th>
										<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest">Type</th>
										<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest tw-text-right">Actions</th>
									</tr>
								</thead>
								<tbody>
									<?php
									$recent_projects = new WP_Query([
										'post_type' => 'vrodos_game',
										'posts_per_page' => 5,
										'orderby' => 'modified',
										'order' => 'DESC',
										'post_status' => 'publish',
										// Exclude projects that have 'joker' in their slug
										'post_name__not_in' => [], // We'll handle this in the loop or with a better query if we knew the IDs
										// Better: use a meta query if possible, but let's use a simpler way:
										// Most joker projects have a specific category or are identified by slug
									]);

									$display_count = 0;
									if ( $recent_projects->have_posts() ) :
										while ( $recent_projects->have_posts() && $display_count < 5 ) : $recent_projects->the_post();
											if ( str_contains( get_post()->post_name, 'joker' ) ) {
												continue;
											}
											$display_count++;
											$project_type = self::vrodos_return_project_type( get_the_ID() );
											?>
											<tr class="tw-hover hover:tw-bg-slate-50/80 tw-transition-colors">
												<td class="tw-opacity-40 tw-font-mono tw-text-[10px]">#<?php the_ID(); ?></td>
												<td>
													<div class="tw-font-black tw-text-slate-700"><?php the_title(); ?></div>
												</td>
												<td>
													<div class="tw-badge tw-badge-ghost tw-rounded-lg tw-gap-1.5 tw-font-bold tw-text-[10px] tw-uppercase">
														<i data-lucide="<?php echo $project_type->icon; ?>" class="tw-w-3 tw-h-3"></i>
														<?php echo $project_type->string; ?>
													</div>
												</td>
												<td class="tw-text-right">
													<a href="<?php echo get_edit_post_link(); ?>" class="tw-btn tw-btn-ghost tw-btn-xs tw-text-primary tw-font-black tw-uppercase tw-tracking-wider">
														Edit
													</a>
												</td>
											</tr>
											<?php
										endwhile;
										wp_reset_postdata();
									else :
										?>
										<tr>
											<td colspan="4" class="tw-text-center tw-py-12 tw-text-slate-400 tw-font-bold">
												No projects found. Start by creating your first project!
											</td>
										</tr>
										<?php
									endif;
									?>
								</tbody>
							</table>
						</div>
						<div class="tw-p-4 tw-bg-slate-50/50 tw-text-center tw-border-t tw-border-slate-100">
							<a href="edit.php?post_type=vrodos_game" class="tw-text-xs tw-font-black tw-text-primary hover:tw-underline tw-uppercase tw-tracking-widest">
								View all projects
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>


		<hr class="wp-block-separator"/>
		<?php
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
			'allgames', 'game' => '/templates/vrodos-project-manager-template.php',
			'assetslist' => '/templates/vrodos-assets-list-template.php',
			'scene' => '/templates/vrodos-edit-3D-scene-template.php',
			'asset' => '/templates/vrodos-asset-editor-template.php',
			default => null,
		};

		if ( $templateURL ) {
			return get_pages(
				['hierarchical' => 0, 'parent'       => -1, 'meta_key'     => '_wp_page_template', 'meta_value'   => $templateURL]
			);
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
		// find the joker game slug e.g. "Archaeology-joker"
		// $joker_game_slug = wp_get_post_terms( $gameProjectID, 'vrodos_game_type')[0]->name."-joker";
		//
		// Slugs are low case "Archaeology-joker" -> "archaeology-joker"
		// $joker_game_slug = strtolower($joker_game_slug);

		// Dynamically collect all joker pgame slugs so new shared-asset project types are included automatically
		$all_pgame_terms = get_terms( [ 'taxonomy' => 'vrodos_asset3d_pgame', 'hide_empty' => false ] );
		$joker_slugs     = [];
		if ( ! is_wp_error( $all_pgame_terms ) ) {
			foreach ( $all_pgame_terms as $t ) {
				if ( str_contains( $t->slug, 'joker' ) ) {
					$joker_slugs[] = $t->slug;
				}
			}
		}

		$queryargs = [ 'post_type' => 'vrodos_asset3d', 'posts_per_page' => -1, 'tax_query' => [ [ 'taxonomy' => 'vrodos_asset3d_pgame', 'field' => 'slug', 'terms' => array_merge( [ $gameProjectSlug ], $joker_slugs ) ] ] ];

		$custom_query = new WP_Query( $queryargs );

		if ( $custom_query->have_posts() ) :
			while ( $custom_query->have_posts() ) :

				$custom_query->the_post();

				$asset_id      = get_the_ID();
				$asset_cat_arr = wp_get_post_terms( $asset_id, 'vrodos_asset3d_cat' );

				$glbID   = get_post_meta( $asset_id, 'vrodos_asset3d_glb', true ); // GLB ID
				$glbPath = $glbID ? wp_get_attachment_url( $glbID ) : '';                   // GLB PATH

				$sshotID   = get_post_meta( $asset_id, 'vrodos_asset3d_screenimage', true ); // Screenshot Image ID
				$sshotPath = '';
				if ( $sshotID ) {
					$sshotUrl = wp_get_attachment_url( $sshotID );
					if ( $sshotUrl ) {
						$cache     = get_post_modified_time( 'U', false, $sshotID );
						$sshotPath = add_query_arg( 't', $cache ?: time(), $sshotUrl );
					}
				}

				$data_arr = ['asset_name'      => get_the_title(), 'asset_slug'      => get_post()->post_name, 'asset_id'        => $asset_id, 'category_name'   => $asset_cat_arr[0]->name, 'category_slug'   => $asset_cat_arr[0]->slug, 'category_id'     => $asset_cat_arr[0]->term_id, 'category_icon'   => get_term_meta( $asset_cat_arr[0]->term_id, 'vrodos_assetcat_icon', true ), 'glb_id'          => $glbID, 'glb_path'        => $glbPath, 'path'            => $glbPath, 'screenshot_id'   => $sshotID, 'screenshot_path' => $sshotPath, 'is_cloned'       => get_post_meta( $asset_id, 'vrodos_asset3d_isCloned', true ), 'is_joker'        => get_post_meta( $asset_id, 'vrodos_asset3d_isJoker', true )];

				switch ( $asset_cat_arr[0]->slug ) {
					case 'video':
						$data_arr['video_id']    = get_post_meta( $asset_id, 'vrodos_asset3d_video', true );
						$data_arr['video_path']  = wp_get_attachment_url( $data_arr['video_id'] );
						$data_arr['video_title'] = get_post_meta( $asset_id, 'vrodos_asset3d_video_title', true );
						$data_arr['video_loop']  = get_post_meta( $asset_id, 'vrodos_asset3d_video_autoloop', true );
						break;
					case 'poi-imagetext':
						$data_arr['poi_img_id']      = get_post_meta( $asset_id, 'vrodos_asset3d_poi_imgtxt_image', true );
						$data_arr['poi_img_path']    = wp_get_attachment_url( $data_arr['poi_img_id'] );
						$data_arr['poi_img_title']   = get_post_meta( $asset_id, 'vrodos_asset3d_poi_imgtxt_title', true );
						$data_arr['poi_img_content'] = get_post_meta( $asset_id, 'vrodos_asset3d_poi_imgtxt_content', true );
						break;
					/*
						case 'chat':
							$data_arr['chat_type'] = get_post_meta($asset_id, 'vrodos_asset3d_chat_type', true);
							break;*/
					case 'image':
						$data_arr['image_id']   = get_post_meta( $asset_id, 'vrodos_asset3d_image', true );
						$data_arr['image_path'] = wp_get_attachment_url( $data_arr['image_id'] ) ?: '';
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

				array_push( $allAssets, $data_arr );

			endwhile;
		endif;

		// Reset postdata
		wp_reset_postdata();

		return $allAssets;
	}

	public static function vrodos_getDefaultJSONscene( $mygameType ): string {

		$p = plugin_dir_path( __DIR__ );
		return match ( $mygameType ) {
			default => file_get_contents( $p . '/assets/standard_scene.json' ),
		};
	}

	/* Get all game projects of the user */
	public static function vrodos_get_user_game_projects( $user_id, $isUserAdmin ): array {

		$games_slugs = ['archaeology-joker'];

		// user is not logged in return only joker game
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
		$cache_key = 'vrodos_assets_' . md5( json_encode( $games_slugs ) . get_current_user_id() );
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
				$glbPath = $glbID ? wp_get_attachment_url( $glbID ) : '';

				$sshotID   = get_post_meta( $asset_id, 'vrodos_asset3d_screenimage', true );
				$sshotPath = '';
				if ( $sshotID ) {
					$sshotUrl = wp_get_attachment_url( $sshotID );
					if ( $sshotUrl ) {
						$cache     = get_post_modified_time( 'U', false, $sshotID );
						$sshotPath = add_query_arg( 't', $cache ?: time(), $sshotUrl );
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
					'is_cloned'              => get_post_meta( $asset_id, 'vrodos_asset3d_isCloned', true ),
					'is_joker'               => get_post_meta( $asset_id, 'vrodos_asset3d_isJoker', true ),
					'assettrs'               => $assettrs,
					'asset_parent_game'      => ( get_post_meta( $asset_id, 'vrodos_asset3d_isJoker', true ) === 'true' ) ? 'Public Assets' : ( ! empty( $asset_pgame ) ? $asset_pgame[0]->name : '' ),
					'asset_parent_game_slug' => ! empty( $asset_pgame ) ? $asset_pgame[0]->slug : '',
					'author_id'              => $author_id,
					'author_displayname'     => $author_displayname,
					'author_username'        => $author_username
				];

				switch ( $asset_cat_arr[0]->slug ) {
					case 'video':
						$data_arr['video_id']    = get_post_meta( $asset_id, 'vrodos_asset3d_video', true );
						$data_arr['video_path']  = wp_get_attachment_url( $data_arr['video_id'] );
						$data_arr['video_title'] = get_post_meta( $asset_id, 'vrodos_asset3d_video_title', true );
						$data_arr['video_loop']  = get_post_meta( $asset_id, 'vrodos_asset3d_video_autoloop', true );
						break;
					case 'poi-imagetext':
						$data_arr['poi_img_id']      = get_post_meta( $asset_id, 'vrodos_asset3d_poi_imgtxt_image', true );
						$data_arr['poi_img_path']    = wp_get_attachment_url( $data_arr['poi_img_id'] );
						$data_arr['poi_img_title']   = get_post_meta( $asset_id, 'vrodos_asset3d_poi_imgtxt_title', true );
						$data_arr['poi_img_content'] = get_post_meta( $asset_id, 'vrodos_asset3d_poi_imgtxt_content', true );
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
	 * Get the Assets of a game plus its respective joker game assets
	 *
	 * @param $gameType
	 */
	public static function vrodos_get_assetids_joker( $gameType ): array {

		$assetIds = [];

		// find the joker game slug e.g. "Archaeology-joker"
		$joker_game_slug = $gameType . '-joker';

		// Slugs are low case "Archaeology-joker" -> "archaeology-joker"
		$joker_game_slug = strtolower( $joker_game_slug );

		$queryargs = ['post_type'      => 'vrodos_asset3d', 'posts_per_page' => -1, 'tax_query'      => [['taxonomy' => 'vrodos_asset3d_pgame', 'field'    => 'slug', 'terms'    => $joker_game_slug]]];

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

		$mtl_file_name                 = $obj_file_name = $pdb_file_name = $glb_file_name = $fbx_file_name =
		$textures_fbx_string_connected = $path_url = null;

		// OBJ
		if ( array_key_exists( 'vrodos_asset3d_obj', $assetpostMeta ) ) {

			$mtl_url = wp_get_attachment_url( $assetpostMeta['vrodos_asset3d_mtl'][0] );
			$obj_url = wp_get_attachment_url( $assetpostMeta['vrodos_asset3d_obj'][0] );

			$mtl_file_name = basename( $mtl_url );
			$obj_file_name = basename( $obj_url );
			$path_url      = pathinfo( $mtl_url )['dirname'];

			// PDB
		} elseif ( array_key_exists( 'vrodos_asset3d_pdb', $assetpostMeta ) ) {
			$pdb_file_name = wp_get_attachment_url( $assetpostMeta['vrodos_asset3d_pdb'][0] );

			// GLB
		} elseif ( array_key_exists( 'vrodos_asset3d_glb', $assetpostMeta ) ) {

			$glb_file_name = wp_get_attachment_url( $assetpostMeta['vrodos_asset3d_glb'][0] );

			// FBX
		} elseif ( array_key_exists( 'vrodos_asset3d_fbx', $assetpostMeta ) ) {

			// Get texture attachments of post
			$args = ['posts_per_page' => 100, 'order'          => 'DESC', 'post_mime_type' => 'image', 'post_parent'    => $asset_id, 'post_type'      => 'attachment'];

			$attachments_array = get_children( $args, OBJECT );  // returns Array ( [$image_ID].

			// Add texture urls to a string separated by |
			$textures_fbx_string_connected = '';

			foreach ( $attachments_array as $k ) {
				$url = wp_get_attachment_url( $k->ID );

				// ignore screenshot attachment
				if ( ! str_contains( $url, 'texture' ) ) {
					continue;
				}

				$textures_fbx_string_connected .= $url . '|';
			}

			// remove the last separator
			$textures_fbx_string_connected = trim( $textures_fbx_string_connected, '|' );

			$fbx_url = wp_get_attachment_url( $assetpostMeta['vrodos_asset3d_fbx'][0] );

			if ( $fbx_url ) {
				$fbx_file_name = basename( $fbx_url );
				$path_url      = pathinfo( $fbx_url )['dirname'];
			}
		}

		return ['mtl'         => $mtl_file_name, 'obj'         => $obj_file_name, 'pdb'         => $pdb_file_name, 'glb'         => $glb_file_name, 'fbx'         => $fbx_file_name, 'texturesFbx' => $textures_fbx_string_connected, 'path'        => $path_url];
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
