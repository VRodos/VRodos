<?php
$perma_structure = (bool)get_option('permalink_structure');
$parameter_pass = $perma_structure ? '?vrodos_game=' : '&vrodos_game=';
$parameter_Scenepass = $perma_structure ? '?vrodos_scene=' : '&vrodos_scene=';
$parameter_assetpass = $perma_structure ? '?vrodos_asset=' : '&vrodos_asset=';

global $project_scope;

$editgamePage = VRodos_Core_Manager::vrodos_getEditpage('game');

// Scripts & styles are enqueued by VRodos_Asset_Manager::enqueue_project_manager_scripts()

$full_title = 'Projects';
$full_title_lowercase = 'projects';
$single = 'project';
$multiple = 'projects';
?>
<!DOCTYPE html>
<html lang="en" data-theme="emerald">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>VRodos Project Manager</title>
	<?php wp_head(); ?>
</head>
<body <?php body_class('vrodos-manager-wrapper tw-overflow-hidden'); ?>>

<!-- if user not logged in then show a hint to login -->
<?php
if (!is_user_logged_in() || !current_user_can('administrator')) {
	$login_url    = wp_login_url( get_permalink() );
	$register_url = wp_registration_url();
	$can_register = (bool) get_option( 'users_can_register' );
?>
	<main class="vrodos-auth-splash vr-mesh-bg">
		<section class="vrodos-auth-shell tw-animate-fade-in-up" aria-labelledby="vrodos-auth-title">
			<div class="vrodos-auth-showcase">
				<div class="vrodos-auth-kicker">
					<span>VRodos</span>
					<span>Project Manager</span>
				</div>
				<h1 id="vrodos-auth-title">Create and manage immersive 3D environments.</h1>
				<div class="vrodos-auth-preview" aria-label="VRodos scene editor preview">
					<div class="vrodos-auth-preview-bar">
						<span></span>
						<span></span>
						<span></span>
						<strong>Scene workspace</strong>
					</div>
					<img src="<?php echo esc_url( VRodos_Path_Manager::image_url( 'screenshots/authtoolimage.jpg' ) ); ?>" alt="VRodos 3D scene editor showing a virtual museum project." />
				</div>
			</div>

			<div class="vrodos-auth-panel vr-glass-panel">
				<div class="vrodos-auth-icon">
					<i data-lucide="shield-check" aria-hidden="true"></i>
				</div>
				<h2>Administrator Access Needed</h2>
				<p>Use your WordPress account to continue to the VRodos Project Manager.</p>
				<a href="<?php echo esc_url( $login_url ); ?>" class="vrodos-auth-primary tw-btn tw-btn-primary">
					<span>Log in</span>
					<i data-lucide="arrow-right" aria-hidden="true"></i>
				</a>
				<div class="vrodos-auth-links">
					<?php if ( $can_register ) : ?>
						<a href="<?php echo esc_url( $register_url ); ?>">Create an account</a>
					<?php endif; ?>
					<a href="<?php echo esc_url( home_url( '/' ) ); ?>">Back</a>
				</div>
			</div>
		</section>
	</main>

	<?php
}
else {
	$current_user = wp_get_current_user();
	$login_username = $current_user->user_login;
?>

<!-- Core Manager Scope -->
<div id="vrodos-project-manager-wrapper" class="vrodos-main-h tw-bg-base-100">

    <div id="vrodos-project-manager"
         class="tw-flex tw-flex-col tw-overflow-hidden"
         style="height: calc(100vh - var(--wp-admin-bar-height, 0px));">
        <!-- Navbar (Unified Light Header) -->
        <nav class="tw-flex-none tw-bg-white tw-border-b tw-border-slate-200 tw-px-8 tw-py-4 tw-z-[60] tw-shadow-sm">
            <div class="tw-max-w-screen-2xl tw-mx-auto tw-flex tw-items-center tw-justify-between">
                <div class="tw-flex tw-items-center tw-gap-4">
                    <span class="tw-text-xl tw-font-black tw-tracking-tight tw-text-primary">VRODOS</span>
                    <div class="tw-h-4 tw-w-px tw-bg-slate-200"></div>
                    <h1 class="tw-text-xs tw-font-bold tw-text-slate-400 uppercase tw-tracking-widest"><?php echo $full_title; ?> Manager</h1>
                </div>
                <div class="tw-flex tw-items-center tw-gap-6">
                    <a href="<?php echo get_site_url(); ?>/vrodos-assets-list-page/" class="tw-text-xs tw-font-bold tw-text-slate-400 hover:tw-text-primary transition-all">Shared Assets</a>
                </div>
            </div>
        </nav>

        <!-- Content -->
        <div class="tw-flex-1 tw-flex tw-overflow-hidden">

            <!-- Sidebar: List -->
            <main class="tw-flex-1 tw-overflow-y-auto tw-bg-slate-50/30 tw-px-8 tw-py-10 tw-z-10">
                <div class="tw-max-w-4xl tw-mx-auto">
                    <div class="tw-flex tw-items-center tw-justify-between tw-mb-8">
                        <h2 class="tw-text-sm tw-font-bold tw-text-slate-500 tw-uppercase tw-tracking-widest">Active <?php echo $multiple; ?></h2>
                        <span id="projects-count-indicator" class="tw-text-[10px] tw-font-bold tw-text-slate-400">0</span>
                    </div>

                    <div id="ExistingProjectsDivDOM" class="tw-space-y-3">
                        <!-- Cards via AJAX -->
                        <!-- Skeleton Loader (Visible while projects are fetching) -->
                        <div id="vrodos-project-skeleton-grid" class="tw-flex tw-flex-col tw-gap-3">
                            <?php for($i=0; $i<6; $i++): ?>
                            <div class="vrodos-skeleton-card vrodos-list-item">
                                <div class="tw-flex tw-items-center tw-gap-4 tw-flex-1">
                                    <div class="vrodos-skeleton-title vrodos-skeleton tw-w-48"></div>
                                    <div class="vrodos-skeleton-meta vrodos-skeleton tw-w-24"></div>
                                </div>
                                <div class="vrodos-skeleton-action vrodos-skeleton tw-w-32"></div>
                            </div>
                            <?php endfor; ?>
                        </div>
                    </div>
                </div>
            </main>

            <!-- Sidebar: Form -->
            <aside class="tw-w-[400px] tw-bg-base-100 tw-border-l tw-border-base-300 tw-p-8 tw-overflow-y-auto tw-z-20">
                <div class="tw-space-y-8">
                    <div>
                        <h2 class="tw-text-lg tw-font-bold tw-text-base-content">Create New Project</h2>
                        <p class="tw-text-xs tw-text-base-content/60 tw-mt-1">Add a new project to your collection.</p>
                    </div>

                    <form name="newProjectForm" id="newProjectForm" method="POST" enctype="multipart/form-data" class="tw-space-y-6">
                        <div class="tw-space-y-2">
                            <label for="title" class="tw-text-xs tw-font-medium tw-text-base-content/70">Project Name</label>
                            <input type="text" id="title" name="title" placeholder="My Awesome Scene"
                                   class="tw-input tw-input-bordered tw-w-full tw-rounded-md tw-bg-base-100"
                                   required minlength="3" />
                        </div>

                        <div class="tw-space-y-3">
                            <label class="tw-text-xs tw-font-medium tw-text-base-content/70">Template Type</label>
                            <div class="tw-grid tw-grid-cols-1 tw-gap-2">
                                <label class="tw-flex tw-items-center tw-gap-3 tw-p-3 tw-rounded-lg tw-border tw-border-base-300 hover:tw-border-primary/50 tw-cursor-pointer has-[:checked]:tw-border-primary has-[:checked]:tw-bg-primary/5 transition-all">
                                    <input type="radio" name="projectTypeRadio" value="vrexpo_games" class="tw-radio tw-radio-primary tw-radio-xs" checked />
                                    <i data-lucide="globe" class="tw-w-4 tw-h-4 tw-text-slate-400"></i>
                                    <span class="tw-text-xs tw-font-medium tw-text-slate-600">3D Exposition</span>
                                </label>
                                <label class="tw-flex tw-items-center tw-gap-3 tw-p-3 tw-rounded-lg tw-border tw-border-base-300 hover:tw-border-primary/50 tw-cursor-pointer has-[:checked]:tw-border-primary has-[:checked]:tw-bg-primary/5 transition-all">
                                    <input type="radio" name="projectTypeRadio" value="virtualproduction_games" class="tw-radio tw-radio-primary tw-radio-xs" />
                                    <i data-lucide="clapperboard" class="tw-w-4 tw-h-4 tw-text-slate-400"></i>
                                    <span class="tw-text-xs tw-font-medium tw-text-slate-600">Virtual Production</span>
                                </label>
                            </div>
                        </div>

                        <p id="project-description-label" class="tw-text-[10px] tw-text-slate-400 tw-italic tw-leading-relaxed"></p>

                        <?php wp_nonce_field('post_nonce', 'post_nonce_field'); ?>
                        <input type="hidden" name="submitted" id="submitted" value="true" />

                        <button id="createNewProjectBtn" type="button"
                                class="tw-btn vrodos-btn-premium tw-w-full tw-rounded-xl tw-shadow-lg">
                            CREATE PROJECT
                        </button>

                        <div id="create-game-progress-bar" class="tw-mt-4" style="display: none;">
                            <div class="vrodos-progress-track">
                                <div class="vrodos-progress-bar vrodos-progress-primary vrodos-indeterminate"></div>
                            </div>
                            <p class="tw-text-[10px] tw-text-center tw-text-slate-400 tw-mt-2 uppercase tw-tracking-widest tw-font-bold">CREATING...</p>
                        </div>
                    </form>
                </div>
            </aside>
        </div>
    </div>

    <?php
}?>

    <!-- Modals Wrapper (Direct child of body to break out of any parent clipping) -->
    <div id="vrodos-modal-wrapper">

        <!-- Reusable Delete Project Dialog -->
        <?php
            $context = 'project';
            include 'vrodos-delete-dialog.php';
        ?>

    </div>

    <?php wp_footer(); ?>
</body>
</html>
