<?php

wp_enqueue_style('vrodos_frontend_stylesheet');
wp_enqueue_style('vrodos_material_stylesheet');

$perma_structure = (bool)get_option('permalink_structure');
$parameter_pass = $perma_structure ? '?vrodos_game=' : '&vrodos_game=';
$parameter_Scenepass = $perma_structure ? '?vrodos_scene=' : '&vrodos_scene=';
$parameter_assetpass = $perma_structure ? '?vrodos_asset=' : '&vrodos_asset=';

global $project_scope;

$editgamePage = VRodos_Core_Manager::vrodos_getEditpage('game');
$pluginpath = dirname(plugin_dir_url(__DIR__));
$pluginpath = str_replace('\\', '/', $pluginpath);

// Define Ajax for the delete Game functionality
$thepath = $pluginpath . '/js_libs/ajaxes/delete_game_scene_asset.js';
wp_enqueue_script('ajax-script_delete_game', $thepath, array('jquery'));
wp_localize_script(
	'ajax-script_delete_game',
	'my_ajax_object_deletegame',
	array('ajax_url' => admin_url('admin-ajax.php'))
);

// Define Ajax for the delete Game functionality
$thepath = $pluginpath . '/js_libs/ajaxes/collaborate_project.js';
wp_enqueue_script('ajax-script_collaborate_project', $thepath, array('jquery'));
wp_localize_script(
	'ajax-script_collaborate_project',
	'my_ajax_object_collaborate_project',
	array('ajax_url' => admin_url('admin-ajax.php'))
);

// Define Ajax for the create Game functionality
$thepath2 = $pluginpath . '/js_libs/ajaxes/create_project.js';
wp_enqueue_script('ajax-script_create_game', $thepath2, array('jquery'));
wp_localize_script(
	'ajax-script_create_game',
	'my_ajax_object_creategame',
	array('ajax_url' => admin_url('admin-ajax.php'))
);

$isAdmin = is_admin() ? 'back' : 'front';

$current_user_id = get_current_user_id();

echo '<script>';
echo 'isAdmin="' . $isAdmin . '";'; // This variable is used in the request_game_assemble.js
echo 'let current_user_id="' . $current_user_id . '";';
echo 'let parameter_Scenepass="' . $parameter_Scenepass . '";';
echo '</script>';

$full_title = 'Projects';
$full_title_lowercase = 'projects';
$single = 'project';
$multiple = 'projects';
?>
<!DOCTYPE html>
<html lang="en" class="sl-theme-light" data-theme="emerald">
<head>
	<meta charset="UTF-8">
	<title>VRodos Project Manager</title>
    <script src="https://unpkg.com/lucide@latest"></script>
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>

<!-- if user not logged in then show a hint to login -->
<?php
if (!is_user_logged_in() || !current_user_can('administrator')) {
	$pluginpath = str_replace('\\', '/', dirname(plugin_dir_url(__DIR__)));
?>
	<div class="tw-flex tw-flex-col tw-h-screen tw-items-center tw-justify-center tw-p-12 tw-text-center tw-bg-base-200">
		<img class="tw-rounded-3xl tw-shadow-2xl tw-mb-10 tw-max-w-4xl tw-w-full tw-border-8 tw-border-white" src="<?php echo $pluginpath; ?>/images/screenshots/authtoolimage.jpg" alt="editor screenshot" />
		<div class="tw-bg-base-100 tw-p-10 tw-rounded-[3rem] tw-shadow-xl tw-border tw-border-base-300 tw-max-w-xl">
            <div class="tw-flex tw-justify-center tw-mb-6">
                <i data-lucide="user-circle" class="tw-w-24 tw-h-24 tw-text-primary"></i>
            </div>
            <h2 class="tw-text-4xl tw-font-black tw-text-base-content tw-mb-4">Members Only</h2>
            <p class="tw-text-base-content/60 tw-text-xl tw-mb-8 tw-font-medium"> Please <a class="tw-link tw-link-primary tw-font-black transition-all" href="<?php echo wp_login_url(get_permalink()); ?>">Login</a> to access the Project Manager.
                <br><span class="tw-text-sm tw-opacity-50">Or register if you don't have an account.</span></p>
            <a href="<?php echo wp_login_url(get_permalink()); ?>" class="d-btn d-btn-primary d-btn-lg tw-px-12 tw-rounded-2xl tw-font-black tw-text-white tw-shadow-2xl tw-shadow-primary/30">LOG IN NOW</a>
        </div>
	</div>

	<?php
}
else {
	$current_user = wp_get_current_user();
	$login_username = $current_user->user_login;
?>

<!-- Core Manager Scope -->
<div id="vrodos-project-manager-wrapper" data-theme="emerald" class="tw-min-h-screen tw-bg-base-100">
    
    <div id="vrodos-project-manager" 
         class="tw-flex tw-flex-col tw-overflow-hidden" 
         style="height: calc(100vh - var(--wp-admin-bar-height, 0px));">
        <!-- Navbar -->
        <nav class="tw-flex-none tw-bg-slate-900 tw-text-white tw-px-8 tw-py-4 tw-z-[60]">
            <div class="tw-max-w-screen-2xl tw-mx-auto tw-flex tw-items-center tw-justify-between">
                <div class="tw-flex tw-items-center tw-gap-4">
                    <span class="tw-text-xl tw-font-bold tw-tracking-tight">VRODOS</span>
                    <div class="tw-h-4 tw-w-px tw-bg-slate-700"></div>
                    <h1 class="tw-text-sm tw-font-medium tw-text-slate-300 uppercase tw-tracking-widest"><?php echo $full_title; ?> Manager</h1>
                </div>
                <div class="tw-flex tw-items-center tw-gap-6">
                    <a href="<?php echo get_site_url(); ?>/vrodos-assets-list-page/" class="tw-text-xs tw-font-medium tw-text-slate-400 hover:tw-text-white transition-colors">Shared Assets</a>
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
                        <div class="tw-flex tw-items-center tw-justify-center tw-py-20 tw-opacity-20 text-slate-400">
                            <span class="d-loading d-loading-spinner d-loading-md text-slate-400"></span>
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
                                   class="d-input d-input-bordered tw-w-full tw-rounded-md tw-bg-base-100" 
                                   required minlength="3" />
                        </div>

                        <div class="tw-space-y-3">
                            <label class="tw-text-xs tw-font-medium tw-text-base-content/70">Template Type</label>
                            <div class="tw-grid tw-grid-cols-1 tw-gap-2">
                                <label class="tw-flex tw-items-center tw-gap-3 tw-p-3 tw-rounded-lg tw-border tw-border-base-300 hover:tw-border-primary/50 tw-cursor-pointer has-[:checked]:tw-border-primary has-[:checked]:tw-bg-primary/5">
                                    <input type="radio" name="projectTypeRadio" value="vrexpo_games" class="d-radio d-radio-primary d-radio-xs" checked />
                                    <i data-lucide="globe" class="tw-w-4 tw-h-4 tw-text-base-content/50"></i>
                                    <span class="tw-text-xs tw-font-medium tw-text-base-content">3D Exposition</span>
                                </label>
                                <label class="tw-flex tw-items-center tw-gap-3 tw-p-3 tw-rounded-lg tw-border tw-border-base-300 hover:tw-border-primary/50 tw-cursor-pointer has-[:checked]:tw-border-primary has-[:checked]:tw-bg-primary/5">
                                    <input type="radio" name="projectTypeRadio" value="virtualproduction_games" class="d-radio d-radio-primary d-radio-xs" />
                                    <i data-lucide="clapperboard" class="tw-w-4 tw-h-4 tw-text-base-content/50"></i>
                                    <span class="tw-text-xs tw-font-medium tw-text-base-content">Virtual Production</span>
                                </label>
                            </div>
                        </div>

                        <p id="project-description-label" class="tw-text-[10px] tw-text-slate-400 tw-italic tw-leading-relaxed"></p>

                        <?php wp_nonce_field('post_nonce', 'post_nonce_field'); ?>
                        <input type="hidden" name="submitted" id="submitted" value="true" />
                        
                        <button id="createNewProjectBtn" type="button" 
                                class="d-btn d-btn-primary tw-w-full tw-text-white tw-font-bold tw-h-10 tw-rounded-lg tw-shadow-md">
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
    <div id="vrodos-modal-wrapper" data-theme="emerald">
        
        <!-- Delete Project Dialog -->
        <dialog id="delete-dialog" class="d-modal">
            <div class="d-modal-box">
                <div class="modal-header">
                    <div class="modal-icon-container">
                        <i data-lucide="trash-2" class="tw-w-7 tw-h-7"></i>
                    </div>
                    <h3 id="delete-dialog-title" class="tw-text-xl tw-font-black tw-text-slate-800">Delete project?</h3>
                </div>
                <div class="modal-body">
                    <div id="delete-dialog-description" class="tw-text-slate-500 tw-text-sm tw-leading-relaxed">
                        Are you sure you want to delete this project? There is no Undo functionality once you delete it.
                    </div>
                    
                    <div id="delete-dialog-progress-bar" class="tw-mt-4" style="display: none;">
                        <p class="tw-text-[10px] tw-font-bold tw-text-rose-500 tw-mb-2 uppercase">Permanently Removing Data...</p>
                        <div class="vrodos-progress-track">
                            <div class="vrodos-progress-bar vrodos-progress-error vrodos-indeterminate"></div>
                        </div>
                    </div>
                </div>

                <div class="d-modal-action">
                    <button class="d-btn d-btn-ghost tw-font-bold tw-text-slate-400 hover:tw-text-slate-600" id="canceldeleteProjectBtn">CANCEL</button>
                    <button class="d-btn d-btn-error tw-text-white tw-font-black tw-shadow-lg tw-px-8" id="deleteProjectBtn">DELETE PROJECT</button>
                </div>
            </div>
            <form method="dialog" class="d-modal-backdrop">
                <button>close</button>
            </form>
        </dialog>

        <!-- Project Collaborators Dialog -->
        <dialog id="collaborate-dialog" class="d-modal">
            <div class="d-modal-box tw-max-w-xl">
                <div class="modal-header">
                    <div class="modal-icon-container">
                        <i data-lucide="users-2" class="tw-w-7 tw-h-7"></i>
                    </div>
                    <h3 id="collaborate-dialog-title" class="tw-text-xl tw-font-black tw-text-slate-800">Collaborators</h3>
                </div>
                
                <div class="modal-body tw-text-left">
                    <div id="collaborate-dialog-description" class="tw-mb-6 tw-text-slate-500 tw-text-sm">
                        Manage who has access to this project.
                    </div>
                    
                    <div class="tw-mb-2">
                        <label class="tw-block tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-widest tw-text-slate-400 tw-mb-2">Emails (separated by semicolon)</label>
                        <textarea id="textarea-collaborators" 
                                class="d-textarea d-textarea-bordered tw-w-full tw-bg-slate-50 tw-h-32 focus:tw-bg-white tw-rounded-xl tw-text-slate-700 tw-p-4 tw-border-slate-200"
                                placeholder="collab1@email.com; collab2@email.com"></textarea>
                    </div>
                </div>

                <div class="d-modal-action">
                    <button class="d-btn d-btn-ghost tw-font-bold tw-text-slate-400 hover:tw-text-slate-600" id="cancelCollabsBtn">CANCEL</button>
                    <button class="d-btn d-btn-primary tw-text-white tw-font-black tw-shadow-lg tw-px-8" id="updateCollabsBtn">UPDATE COLLABORATORS</button>
                </div>
            </div>
            <form method="dialog" class="d-modal-backdrop">
                <button>close</button>
            </form>
        </dialog>
    </div>

    <?php wp_footer(); ?>
</body>
</html>
