<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Admin_Dashboard_Page {
	public static function render(): void {
		$allProjectsPage = VRodos_Core_Manager::vrodos_getEditpage( 'allgames' );

		$projects_total = (int) wp_count_posts( 'vrodos_game' )->publish;
		
		// Subtract hidden technical repositories (joker projects) from the count
		$shared_slugs = ['archaeology-joker', 'vrexpo-joker', 'virtualproduction-joker'];
		$hidden_projects_count = 0;
		foreach ( $shared_slugs as $slug ) {
			if ( get_page_by_path( $slug, OBJECT, 'vrodos_game' ) ) {
				$hidden_projects_count++;
			}
		}
		
		$projects_count = max( 0, $projects_total - $hidden_projects_count );
		$scenes_count   = wp_count_posts( 'vrodos_scene' )->publish;
		$assets_count   = wp_count_posts( 'vrodos_asset3d' )->publish;

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
			.vrodos-dashboard-tabs > input[type="radio"] {
				position: absolute;
				opacity: 0;
				pointer-events: none;
			}
			.vrodos-dashboard-tab-label {
				border: 1px solid transparent;
				border-radius: 8px;
				cursor: pointer;
				transition: background-color .15s ease, color .15s ease, border-color .15s ease;
			}
			.vrodos-dashboard-tab-panel {
				display: none;
			}
			#vrodos-dashboard-tab-projects:checked ~ .tw-card-body .vrodos-dashboard-tab-header label[for="vrodos-dashboard-tab-projects"],
			#vrodos-dashboard-tab-assets:checked ~ .tw-card-body .vrodos-dashboard-tab-header label[for="vrodos-dashboard-tab-assets"] {
				background: #ffffff;
				border-color: #d1fae5;
				color: #047857;
				box-shadow: 0 1px 2px rgba(15, 23, 42, .06);
			}
			#vrodos-dashboard-tab-projects:checked ~ .tw-card-body .vrodos-dashboard-tab-panels #vrodos-dashboard-panel-projects,
			#vrodos-dashboard-tab-assets:checked ~ .tw-card-body .vrodos-dashboard-tab-panels #vrodos-dashboard-panel-assets {
				display: block;
			}
		</style>
		<div class="vrodos-manager-wrapper tw-px-4 md:tw-px-8 tw-py-12 lg:tw-py-16 tw-bg-transparent">
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
							<img src="<?php echo esc_url( VRodos_Path_Manager::image_url( 'ui/VRodos_icon_512.png' ) ); ?>"
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
					<div class="tw-stat tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100 tw-p-6" data-theme="emerald">
						<div class="tw-stat-figure tw-text-primary">
							<i data-lucide="folder-kanban" class="tw-w-8 tw-h-8"></i>
						</div>
						<div class="tw-stat-title tw-text-slate-400 tw-font-bold tw-uppercase tw-tracking-wider tw-text-[10px]">Total Projects</div>
						<div class="tw-stat-value tw-text-slate-900 tw-text-4xl tw-font-black"><?php echo $projects_count; ?></div>
					</div>
					
					<div class="tw-stat tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100 tw-p-6" data-theme="emerald">
						<div class="tw-stat-figure tw-text-secondary">
							<i data-lucide="layers" class="tw-w-8 tw-h-8"></i>
						</div>
						<div class="tw-stat-title tw-text-slate-400 tw-font-bold tw-uppercase tw-tracking-wider tw-text-[10px]">Total Scenes</div>
						<div class="tw-stat-value tw-text-slate-900 tw-text-4xl tw-font-black"><?php echo $scenes_count; ?></div>
					</div>
					
					<div class="tw-stat tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100 tw-p-6" data-theme="emerald">
						<div class="tw-stat-figure tw-text-emerald-500">
							<i data-lucide="box" class="tw-w-8 tw-h-8"></i>
						</div>
						<div class="tw-stat-title tw-text-slate-400 tw-font-bold tw-uppercase tw-tracking-wider tw-text-[10px]">Total Assets</div>
						<div class="tw-stat-value tw-text-slate-900 tw-text-4xl tw-font-black"><?php echo $assets_count; ?></div>
					</div>
				</div>

				<?php
				$asset_opt_notice = isset( $_GET['vrodos_asset_opt_notice'] ) ? sanitize_key( (string) wp_unslash( $_GET['vrodos_asset_opt_notice'] ) ) : '';
				$asset_opt_notice_message = self::asset_opt_notice_message( $asset_opt_notice );
				$asset_opt_notice_is_error = self::is_asset_opt_notice_error( $asset_opt_notice );
				?>

				<!-- Dashboard Tables -->
				<?php $dashboard_tab = isset( $_GET['vrodos_dashboard_tab'] ) && 'assets' === sanitize_key( (string) wp_unslash( $_GET['vrodos_dashboard_tab'] ) ) ? 'assets' : 'projects'; ?>
				<div class="tw-card tw-bg-white tw-shadow-sm tw-border tw-border-slate-100 tw-rounded-2xl tw-overflow-hidden vrodos-dashboard-tabs" data-theme="emerald">
					<input type="radio" name="vrodos-dashboard-tab" id="vrodos-dashboard-tab-projects" <?php checked( $dashboard_tab, 'projects' ); ?>>
					<input type="radio" name="vrodos-dashboard-tab" id="vrodos-dashboard-tab-assets" <?php checked( $dashboard_tab, 'assets' ); ?>>
					<div class="tw-card-body tw-p-0">
						<div class="vrodos-dashboard-tab-header tw-p-4 md:tw-p-6 tw-border-b tw-border-slate-100 tw-flex tw-flex-wrap tw-justify-between tw-items-center tw-gap-4 tw-bg-slate-50/50">
							<h3 class="tw-text-lg tw-font-black tw-text-slate-800 tw-flex tw-items-center tw-gap-2 tw-uppercase tw-tracking-tight">
								<i data-lucide="clock" class="tw-w-5 tw-h-5 tw-text-slate-400"></i>
								Dashboard Overview
							</h3>
							<div class="tw-flex tw-flex-wrap tw-gap-2">
								<label for="vrodos-dashboard-tab-projects" class="vrodos-dashboard-tab-label tw-px-4 tw-py-2 tw-text-xs tw-font-black tw-uppercase tw-tracking-widest tw-text-slate-500">
									Active Projects
								</label>
								<label for="vrodos-dashboard-tab-assets" class="vrodos-dashboard-tab-label tw-px-4 tw-py-2 tw-text-xs tw-font-black tw-uppercase tw-tracking-widest tw-text-slate-500">
									Actionable Assets
								</label>
							</div>
						</div>
						<div class="vrodos-dashboard-tab-panels">
							<div id="vrodos-dashboard-panel-projects" class="vrodos-dashboard-tab-panel">
								<div class="tw-overflow-x-auto">
									<table class="tw-table tw-w-full">
										<thead>
											<tr class="tw-bg-slate-50/30">
												<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest">ID</th>
												<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest">Project Title</th>
												<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest">Type</th>
												<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest">Source</th>
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
													$project_id   = get_the_ID();
													$project_type = VRodos_Core_Manager::vrodos_return_project_type( $project_id );
													$is_immerse_project = 'immerse' === get_post_meta( $project_id, '_immerse_source', true );
													?>
													<tr class="tw-hover hover:tw-bg-slate-50/80 tw-transition-colors">
														<td class="tw-opacity-40 tw-font-mono tw-text-[10px]">#<?php the_ID(); ?></td>
														<td>
															<div class="tw-font-black tw-text-slate-700"><?php the_title(); ?></div>
														</td>
														<td>
															<div class="tw-badge tw-badge-ghost tw-rounded-lg tw-gap-1.5 tw-font-bold tw-text-[10px] tw-uppercase">
																<i data-lucide="<?php echo esc_attr( $project_type->icon ); ?>" class="tw-w-3 tw-h-3"></i>
																<?php echo esc_html( (string) $project_type->string ); ?>
															</div>
														</td>
														<td>
															<div class="tw-badge tw-badge-ghost tw-rounded-lg tw-gap-1.5 tw-font-bold tw-text-[10px] tw-uppercase <?php echo $is_immerse_project ? 'tw-text-sky-600' : 'tw-text-slate-500'; ?>" title="<?php echo esc_attr( $is_immerse_project ? 'Imported from Immerse' : 'Native VRodos project' ); ?>">
																<i data-lucide="<?php echo esc_attr( $is_immerse_project ? 'cloud' : 'hard-drive' ); ?>" class="tw-w-3 tw-h-3"></i>
																<?php echo esc_html( $is_immerse_project ? 'Immerse' : 'Native' ); ?>
															</div>
														</td>
														<td class="tw-text-right">
															<a href="<?php echo esc_url( get_edit_post_link() ); ?>" class="tw-btn tw-btn-ghost tw-btn-xs tw-text-primary tw-font-black tw-uppercase tw-tracking-wider tw-px-2">
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
													<td colspan="5" class="tw-text-center tw-py-12 tw-text-slate-400 tw-font-bold">
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
							<div id="vrodos-dashboard-panel-assets" class="vrodos-dashboard-tab-panel">
								<?php if ( '' !== $asset_opt_notice_message ) : ?>
									<div class="tw-m-6 tw-mb-0 tw-flex tw-items-center tw-gap-3 tw-rounded-xl tw-border tw-px-4 tw-py-3 tw-text-sm tw-font-bold <?php echo $asset_opt_notice_is_error ? 'tw-border-amber-200 tw-bg-amber-50 tw-text-amber-900' : 'tw-border-emerald-200 tw-bg-emerald-50 tw-text-emerald-900'; ?>" data-vrodos-dashboard-notice>
										<i data-lucide="<?php echo $asset_opt_notice_is_error ? 'triangle-alert' : 'check-circle'; ?>" class="tw-w-5 tw-h-5 tw-shrink-0"></i>
										<span class="tw-flex-1"><?php echo esc_html( $asset_opt_notice_message ); ?></span>
										<button type="button" class="tw-btn tw-btn-ghost tw-btn-xs tw-min-h-0 tw-h-7 tw-w-7 tw-p-0" data-vrodos-dashboard-notice-close aria-label="Dismiss notice">
											<i data-lucide="x" class="tw-w-4 tw-h-4"></i>
										</button>
									</div>
								<?php endif; ?>
								<?php
								if ( class_exists( 'VRodos_Asset_Optimization_Manager' ) ) {
									VRodos_Asset_Optimization_Manager::render_dashboard_actionable_assets_table( 10 );
								} else {
									?>
									<div class="tw-text-center tw-py-12 tw-text-slate-400 tw-font-bold">
										Asset optimization tooling is not available.
									</div>
									<?php
								}
								?>
								<div class="tw-p-4 tw-bg-slate-50/50 tw-text-center tw-border-t tw-border-slate-100">
									<span class="tw-text-xs tw-font-black tw-text-slate-400 tw-uppercase tw-tracking-widest">
										Use row actions here to refresh GLB analysis or generate derivatives.
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>


		<hr class="wp-block-separator"/>
		<?php
		}

	private static function asset_opt_notice_message( string $notice ): string {
		return match ( $notice ) {
			'analysis-refreshed'    => 'Asset analysis refreshed.',
			'optimized'             => 'Safe Draco derivative generated.',
			'compile-enabled'       => 'Compiled scenes will use the active derivative for this asset.',
			'compile-disabled'      => 'Compiled scenes will use the original GLB for this asset.',
			'analysis-failed'       => 'Asset analysis failed. Open the asset or Settings > Assets for details.',
			'optimize-failed'       => 'Derivative generation failed. Open the asset or Settings > Assets for details.',
			'compile-enable-failed' => 'Compile use was not enabled because the derivative is not ready.',
			'invalid-profile'       => 'Unsupported derivative profile.',
			default                 => '',
		};
	}

	private static function is_asset_opt_notice_error( string $notice ): bool {
		return str_contains( $notice, 'failed' ) || 'invalid-profile' === $notice;
	}
}
