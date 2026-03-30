<?php
// Prepare data for the template
// Scripts & styles are enqueued by VRodos_Asset_Manager::enqueue_scene_editor_scripts()
$data = VRodos_Scene_CPT_Manager::prepare_scene_editor_data();
extract( $data );
?>
<!DOCTYPE html>
<html lang="en" data-theme="emerald">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Scene Editor | VRodos</title>
	<?php wp_head(); ?>
	<script type="text/javascript">
		// Keep track for the undo-redo function
		var post_revision_no = 1;

		// is rendering paused
		isPaused = false;

		// Use lighting or basic materials (basic does not employ light, no shadows)
		window.isAnyLight = true;

		// For autosave after each action
		var mapActions = {}; // You could also use an array

		var showPawnPositions = "false";
		var vrodos_scene_upload_image_nonce = "<?php echo wp_create_nonce( 'vrodos_scene_upload_image_nonce' ); ?>";
	</script>
</head>
<body id="vrodos-scene-editor" <?php body_class( 'vrodos-manager-wrapper tw-overflow-hidden' ); ?>>
<?php if ( ! is_user_logged_in() || ! current_user_can( 'administrator' ) ) { ?>

	<!-- if user not logged in, then prompt to log in -->
	<div class="tw-flex tw-flex-col tw-items-center tw-justify-center tw-min-h-screen tw-bg-slate-50">
		<i data-lucide="user-circle" class="tw-w-16 tw-h-16 tw-text-slate-400 tw-mb-4"></i>
		<p class="tw-text-lg tw-text-slate-700"> Please <a class="tw-text-primary tw-font-bold hover:tw-underline"
													href="<?php echo wp_login_url( get_permalink() ); ?>">login</a> to use platform</p>
		<p class="tw-text-lg tw-text-slate-700"> Or
			<a class="tw-text-primary tw-font-bold hover:tw-underline" href="<?php echo wp_registration_url(); ?>">register</a>
			if you don't have an account</p>
	</div>



<?php } else { ?>

	<!-- PANELS -->
	<div class="panels">

		<!-- Panel 1 is the vr environment -->
		<div class="panel active" id="panel-1" role="tabpanel" aria-hidden="false">

			<!-- 3D editor  -->
			<div id="vr_editor_main_div">

				<!-- Upper Toolbar -->
				<div class="scene_editor_upper_toolbar tw-flex tw-items-center tw-gap-4 tw-px-4 tw-bg-slate-800 tw-text-white tw-w-full tw-left-0 tw-h-11">

					<!-- Display Breadcrump about projectType>project>scene -->
					<?php
					VRodos_Core_Manager::vrEditorBreadcrumpDisplay(
						$scene_post,
						$goBackTo_AllProjects_link,
						$project_type,
						$project_type_icon,
						$project_post
					);
					?>

					<!-- Undo - Save - Redo -->
					<div id="save-scene-elements" class="tw-flex tw-items-center tw-gap-4">
						<div class="tw-flex tw-items-center tw-gap-2">
							<a id="undo-scene-button" title="Undo last change" class="tw-p-1 hover:tw-bg-white/10 tw-rounded tw-transition-colors">
								<i data-lucide="undo-2" class="tw-w-4 tw-h-4"></i>
							</a>

							<a id="redo-scene-button" title="Redo last change" class="tw-p-1 hover:tw-bg-white/10 tw-rounded tw-transition-colors">
								<i data-lucide="redo-2" class="tw-w-4 tw-h-4"></i>
							</a>
						</div>




					</div>


					<div class="tw-ml-auto tw-flex tw-items-center tw-gap-2">

                        <a id="toggleUIBtn" data-toggle='on' type="button"
                           class="tw-p-1.5 hover:tw-bg-white/10 tw-rounded tw-transition-colors tw-cursor-pointer tw-text-white"
                           title="Toggle interface">
                            <i data-lucide="eye" class="tw-w-4 tw-h-4"></i>
                        </a>

                        <!-- View Json code UI -->
                        <a id="toggleViewSceneContentBtn" type="button"
                           class="tw-flex tw-items-center tw-gap-1 tw-px-2 tw-py-1 tw-text-xs tw-font-bold tw-opacity-60 hover:tw-opacity-100 tw-transition-all tw-cursor-pointer"
                           title="View scene JSON data">
                            <i data-lucide="braces" class="tw-w-3.5 tw-h-3.5"></i> JSON
                        </a>

                        <a id="save-scene-button" title="Save changes" class="tw-px-3 tw-py-1 tw-text-xs tw-font-bold tw-uppercase tw-tracking-wider hover:tw-bg-white/10 tw-rounded tw-transition-colors">
                            Save Scene
                        </a>

						<button id="compileGameBtn"
							class="tw-btn tw-btn-primary tw-text-white tw-font-bold"
							title="Build Project">
							<i data-lucide="hammer" class="tw-w-4 tw-h-4"></i>&nbsp;Build Project
						</button>
					</div>

				</div>
				<!--Compile Dialogue html-->
				<?php require plugin_dir_path( __DIR__ ) . '/templates/vrodos-edit-3D-scene-CompileDialogue.php'; ?>

				<!-- Scene JSON content viewer (dialog) -->
				<dialog id="sceneJsonContent" class="tw-modal">
					<style>
						#sceneJsonContent {
							overflow: hidden !important;
						}
						#sceneJsonContent .tw-modal-box {
							width: min(95vw, 900px) !important;
							max-height: 90vh !important;
							padding: 0 !important;
							border-radius: 0.75rem !important;
							overflow: hidden !important;
						}
						#sceneJsonContent textarea {
							scrollbar-width: thin;
							scrollbar-color: #475569 transparent;
						}
						#sceneJsonContent textarea::-webkit-scrollbar { width: 8px; }
						#sceneJsonContent textarea::-webkit-scrollbar-track { background: transparent; }
						#sceneJsonContent textarea::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
						#sceneJsonContent textarea::-webkit-scrollbar-thumb:hover { background: #64748b; }

						/* Ensure no scrollbars on the main window */
						html, body {
							overflow: hidden !important;
							scrollbar-width: none !important;
							-ms-overflow-style: none !important;
						}
						html::-webkit-scrollbar, body::-webkit-scrollbar {
							display: none !important;
						}
					</style>
					<div class="tw-modal-box tw-bg-slate-900 tw-shadow-2xl tw-border tw-border-white/10 tw-flex tw-flex-col">
						<!-- Header -->
						<div class="tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-1.5 tw-bg-slate-800 tw-border-b tw-border-white/10 tw-rounded-t-lg tw-flex-shrink-0">
							<div class="tw-flex tw-items-center tw-gap-2">
								<i data-lucide="braces" class="tw-w-3.5 tw-h-3.5 tw-text-emerald-400"></i>
								<span class="tw-text-xs tw-font-bold tw-text-white tw-tracking-wide">Scene JSON</span>
							</div>
							<div class="tw-flex tw-items-center tw-gap-2">
								<button id="copyJsonBtn" type="button" class="tw-px-2.5 tw-py-0.5 tw-text-[10px] tw-font-semibold tw-text-slate-400 hover:tw-text-white tw-bg-slate-700 hover:tw-bg-slate-600 tw-rounded tw-transition-colors tw-flex tw-items-center tw-gap-1" title="Copy to clipboard">
									<i data-lucide="clipboard-copy" class="tw-w-3 tw-h-3"></i> Copy
								</button>
								<button id="closeJsonBtn" type="button" class="tw-p-0.5 tw-text-slate-500 hover:tw-text-white tw-transition-colors tw-rounded" title="Close">
									<i data-lucide="x" class="tw-w-3.5 tw-h-3.5"></i>
								</button>
							</div>
						</div>
						<!-- JSON content -->
						<textarea id="vrodos_scene_json_input"
								  name="vrodos_scene_json_input"
								  title="Scene JSON data"
								  class="tw-flex-1 tw-w-full tw-bg-slate-950 tw-text-emerald-300 tw-font-mono tw-text-[11px] tw-leading-relaxed tw-p-4 tw-border-0 tw-resize-none focus:tw-outline-none"
								  style="min-height: 75vh;"
								  spellcheck="false"
						></textarea>
					</div>
					<form method="dialog" class="tw-modal-backdrop"><button>close</button></form>
				</dialog>



				<!-- Lights -->
				<div class="environmentBar hidable tw-flex tw-items-center tw-gap-2">

					<?php if ( ! isset( $project_type_slug ) || $project_type_slug !== 'vrexpo_games' ) : ?>
					<div title="An entry point for Actors, they can choose one of multiple points when logging in" class="lightpawnbutton" data-lightPawn="Pawn" draggable="true">
						<header draggable="false" class="notdraggable">Actor</header>
						<img draggable="false" class="lighticon notdraggable" style="padding:2px; margin-top:0"
							src="<?php echo $pluginpath; ?>/images/lights/pawn.png"/>
					</div>

					<div class="tw-w-px tw-h-[45px] tw-bg-white/30 tw-mx-0.5"></div>
					<?php endif; ?>

					<div class="lightpawnbutton" data-lightPawn="Sun" draggable="true" title="When adding a Sun, an automatic horizon is added to the scene, negating any Background color you have selected.">
						<header draggable="false" class="notdraggable">Sun</header>
						<img draggable="false" class="lighticon notdraggable"
							src="<?php echo $pluginpath; ?>/images/lights/sun.png"/>
					</div>

					<div class="lightpawnbutton" data-lightPawn="Lamp" draggable="true" title="The lamp emits lighting close to objects.">
						<header draggable="false" class="notdraggable">Lamp</header>
						<img draggable="false" class="lighticon notdraggable"
							src="<?php echo $pluginpath; ?>/images/lights/lamp.png"/>
					</div>

					<div class="lightpawnbutton" data-lightPawn="Spot" draggable="true" title="The Spot light is a directional light to a specific target.">
						<header draggable="false" class="notdraggable">Spot</header>
						<img draggable="false" class="lighticon notdraggable"
							src="<?php echo $pluginpath; ?>/images/lights/spot.png"/>
					</div>

					<div class="lightpawnbutton" data-lightPawn="Ambient" draggable="true" title="Ambient light emits a strong light to illuminate areas.">
						<header draggable="false" class="notdraggable" style="font-size: 7pt">Ambient</header>
						<img draggable="false" class="lighticon notdraggable"
							src="<?php echo $pluginpath; ?>/images/lights/ambient_light.png"/>
					</div>

					<div class="tw-w-px tw-h-[45px] tw-bg-white/30 tw-mx-0.5"></div>

					<div class="environmentButton">
						<!--  Dimensionality 2D 3D toggle -->
						<a id="dim-change-btn"
							title="Toggle between 2D mode (top view) and 3D mode (view with angle)."
							class="EditorToolbarBtnStyle tw-btn tw-btn-sm toggle-btn toggle-active">3D</a>
					</div>

					<!-- The button to start walking in the 3d environment -->
					<div class="environmentButton">
						<div id="firstPersonBlocker">
							<a type="button" id="firstPersonBlockerBtn" data-toggle='on'
								class="EditorToolbarBtnStyle tw-btn tw-btn-sm toggle-btn"
								title="Change camera to First Person View - Move: W,A,S,D,Q,E,R,F keys">
								<i data-lucide="user" class="tw-w-4 tw-h-4"></i>
							</a>
						</div>
					</div>

					<!--  Toggle Around Tour -->
					<div class="environmentButton">
						<a type="button" id="toggle-tour-around-btn" data-toggle='off'
							title="Auto-rotate 3D tour"
							class="EditorToolbarBtnStyle tw-btn tw-btn-sm toggle-btn">
							<i data-lucide="rotate-ccw" class="tw-w-4 tw-h-4"></i>
						</a>
					</div>


					<div class="environmentButton">
						<input style="display: none" type="checkbox" id="sceneEnvironmentTexture" name="sceneEnvTexture" checked />
						<a id="env_texture-change-btn"
							title="Toggle textures" onclick="toggleEnvTexture(document.getElementById('sceneEnvironmentTexture'))"
							class="EditorToolbarBtnStyle tw-btn tw-btn-sm toggle-btn toggle-active">
							<i data-lucide="layers" class="tw-w-4 tw-h-4"></i>
						</a>
					</div>

					<!-- Cogwheel options -->
					<div class="environmentButton">
						<div id="row_cogwheel" class="row-right-panel">
							<a type="button" id="optionsPopupBtn"
								class="EditorToolbarBtnStyle tw-btn tw-btn-sm tw-btn-primary"
								title="Edit scene options">
								<i data-lucide="settings" ></i>
							</a>
						</div>
					</div>

				</div>

				<!-- toggleUIBtn moved into upper toolbar -->

				<!-- Hierachy Viewer -->
				<?php
				require plugin_dir_path( __DIR__ ) . '/templates/vrodos-edit-3D-scene-HierarchyViewer.php';
				?>

				<!-- Floating Object Controls Panel -->
				<div id="object-controls-panel" class="tw-fixed tw-z-[9999] tw-hidden tw-flex tw-flex-col tw-w-[280px] tw-bg-slate-800/90 tw-backdrop-blur-sm tw-rounded-xl tw-shadow-2xl tw-border tw-border-white/10 tw-text-white tw-overflow-hidden" style="top: 140px; right: 340px;">

					<!-- Draggable header -->
					<div id="object-controls-header" class="tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-1.5 tw-bg-slate-700/80 tw-cursor-move tw-select-none tw-border-b tw-border-white/10">
						<div class="tw-flex tw-items-center tw-gap-2 tw-min-w-0">
							<span id="object-controls-title" class="tw-text-xs tw-font-semibold tw-text-slate-300 tw-uppercase tw-tracking-wider tw-truncate">Object Controls</span>
							<span id="object-controls-badge" class="tw-hidden tw-text-[9px] tw-font-black tw-uppercase tw-tracking-widest tw-bg-slate-500/15 tw-text-slate-200 tw-border tw-border-white/10 tw-rounded-full tw-px-2 tw-py-0.5">Object Type</span>
						</div>
						<button id="object-controls-close" class="tw-p-0.5 tw-text-slate-400 hover:tw-text-white tw-transition-colors" title="Close panel">
							<i data-lucide="x" class="tw-w-3.5 tw-h-3.5"></i>
						</button>
					</div>

					<!-- Axes controls row -->
					<div class="tw-flex tw-flex-nowrap tw-items-center tw-gap-1 tw-px-3 tw-py-1.5 tw-bg-slate-700/40">
						<span class="tw-text-[8pt] tw-font-semibold tw-text-slate-400 tw-leading-tight tw-shrink-0">Axes:</span>

						<div id="object-manipulation-toggle"
							 class="ObjectManipulationToggle tw-join tw-flex tw-items-center tw-gap-0" style="display: none;">
							<input type="radio" id="translate-switch" name="object-manipulation-switch" value="translate" class="tw-peer tw-hidden" checked/>
							<label for="translate-switch" id="translate-switch-label" class="tw-join-item tw-btn tw-btn-xs affineSwitch">Move</label>
							<input type="radio" id="rotate-switch" name="object-manipulation-switch" value="rotate" class="tw-peer tw-hidden" />
							<label for="rotate-switch" id="rotate-switch-label" class="tw-join-item tw-btn tw-btn-xs affineSwitch">Rotate</label>
							<input type="radio" id="scale-switch" name="object-manipulation-switch" value="scale" class="tw-peer tw-hidden" />
							<label for="scale-switch" id="scale-switch-label" class="tw-join-item tw-btn tw-btn-xs affineSwitch">Scale</label>
						</div>

						<div id="axis-manipulation-buttons" class="tw-flex tw-items-center tw-gap-0.5 tw-ml-auto" style="display: none;">
							<a id="axis-size-increase-btn" title="Increase axes size" class="tw-btn tw-btn-xs tw-btn-primary tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center tw-p-0">+</a>
							<a id="axis-size-decrease-btn" title="Decrease axes size" class="tw-btn tw-btn-xs tw-btn-primary tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center tw-p-0">-</a>
						</div>
					</div>

					<!-- lil-gui container -->
					<div id="numerical_gui-container" class="VrGuiContainerStyle"></div>

					<!-- Constrain scale -->
					<div class="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1.5 tw-border-t tw-border-white/5">
						<input type="checkbox" title="Constrain Scale dims to one value"
							   id="scaleLockCheckbox" name="scaleLockCheckbox" form="3dAssetForm"
							   class="tw-checkbox tw-checkbox-sm tw-checkbox-primary"
							   onchange="keepScaleAspectRatio(this.checked)">
						<label for="scaleLockCheckbox" class="tw-text-xs tw-text-slate-300 tw-cursor-pointer">Constrain Scale</label>
					</div>

					<!-- Object Properties (auto-shown on selection based on category) -->
					<div id="object-properties-container" class="tw-border-t tw-border-white/10 tw-overflow-y-auto tw-max-h-[300px]" style="display:none;">
						<?php require plugin_dir_path( __DIR__ ) . '/templates/vrodos-edit-3D-scene-Popups.php'; ?>
					</div>
				</div>

				<!-- Pause rendering-->
				<div id="divPauseRendering" class="pauseRenderingDivStyle">
					<a id="pauseRendering" class="tw-btn tw-btn-sm tw-btn-primary"
						title="Pause rendering">
						<i data-lucide="play" style="width:18px; height:18px;"></i>
					</a>
				</div>


				<!--  Make form to submit user changes -->
				<div id="progressWrapper" class="VrInfoPhpStyle" style="visibility: visible">
					<div id="progress" class="ProgressContainerStyle tw-text-slate-300 tw-text-base">
					</div>

					<div id="result_download" class="result"></div>
				</div>


				<!--  Asset browse Left panel  -->
				
				<!-- The panel -->
				<div class="filemanager" id="assetBrowserToolbar">

					<!-- Open/Close button (Nested for seamless extension) -->
					<a id="bt_close_file_toolbar" data-toggle="on" type="button"
					   class="AssetsToggleStyle AssetsToggleOn hidable"
					   title="Toggle asset viewer">
						<div class="tw-flex tw-items-center tw-justify-center">
							<i data-lucide="chevron-left" class="tw-w-3 tw-h-3"></i>
						</div>
					</a>

					<!-- Categories of assets -->
					<div id="assetCategTab" class="AssetCategoryTabStyle">
						<button id="allAssetsViewBt" class="tablinks tw-btn tw-btn-xs tw-btn-ghost active">All</button>
					</div>

					<!-- Search bar -->
					<div class="search tw-relative tw-p-2 tw-bg-slate-900/40 tw-mx-2 tw-mb-2 tw-rounded-lg tw-border tw-border-white/5">
						<i data-lucide="search" class="tw-absolute tw-left-4 tw-top-1/2 tw-transform tw--translate-y-1/2 tw-w-3.5 tw-h-3.5 tw-opacity-40"></i>
						<input type="search" placeholder="Find assets..." class="tw-w-full tw-bg-transparent tw-border-none tw-pl-8 tw-pr-4 tw-py-1 tw-text-[11px] tw-text-slate-200 focus:tw-ring-0 placeholder:tw-text-slate-500" />
					</div>

					<ul id="filesList" class="data">
						<?php /* Skeleton placeholders — removed by JS when real assets arrive */ ?>
						<?php for ( $i = 0; $i < 6; $i++ ) : ?>
						<li class="asset-skeleton tw-relative tw-bg-slate-800 tw-rounded-lg tw-overflow-hidden tw-animate-pulse">
							<div class="tw-w-full tw-aspect-square tw-bg-slate-700"></div>
							<div class="tw-absolute tw-top-1.5 tw-left-1.5 tw-bg-slate-700 tw-rounded-md tw-h-3 tw-w-16"></div>
							<div class="tw-absolute tw-top-1.5 tw-right-1.5 tw-bg-slate-700 tw-rounded-md tw-h-5 tw-w-5"></div>
						</li>
						<?php endfor; ?>
					</ul>

					<!-- ADD NEW ASSET FROM ASSETS LIST -->
					<a id="addNewAssetBtnAssetsList"
					   class="tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-btn-secondary tw-bg-secondary tw-text-white tw-rounded-full tw-shadow-lg hover:tw-bg-secondary-focus tw-transition-all tw-absolute tw-bottom-4 tw-right-4 tw-z-[1001]"
					   title="Add new private asset"
					   href="<?php echo esc_url( get_permalink( $newAssetPage[0]->ID ) . $parameter_pass . $project_id . '&vrodos_scene=' . $current_scene_id . '&scene_type=scene&preview=0&singleproject=true' ); ?>">
						<i data-lucide="plus" class="tw-w-5 tw-h-5"></i>
					</a>

				</div>

				<!-- Popups are now inside the floating Object Controls panel -->

				<!-- Scenes Drawer Wrapper for dynamic centering -->
				<div id="scenesDrawerWrapper" class="tw-absolute tw-bottom-0 tw-left-[320px] tw-z-[1000] tw-flex tw-flex-col tw-items-center">
					<!--  Open/Close Scene list panel-->
					<a id="scenesList-toggle-btn" data-toggle='on' type="button" class="scenesListToggleStyle scenesListToggleOn hidable" title="Toggle scenes list">
						<div class="tw-flex tw-items-center tw-justify-center">
							<i data-lucide="chevron-down" class="tw-w-3 tw-h-3"></i>
						</div>
					</a>

					<!-- Scenes Credits and Main menu List -->
					<?php require plugin_dir_path( __DIR__ ) . '/templates/vrodos-edit-3D-scene-OtherScenes.php'; ?>
				</div>

			</div>   <!--   VR DIV   -->

			<!--Options dialogue-->
			<?php require plugin_dir_path( __DIR__ ) . '/templates/vrodos-edit-3D-scene-OptionsDialogue.php'; ?>

		</div>

	</div>

	<dialog id="confirm-deletion-dialog" class="tw-modal" style="z-index: 1000;">
		<div class="tw-modal-box tw-p-0 tw-overflow-hidden">
			<!-- Header -->
			<div class="tw-p-8 tw-pb-4 tw-flex tw-flex-col tw-items-center tw-text-center">
				<div class="tw-w-16 tw-h-16 tw-bg-rose-50 tw-text-rose-500 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-mb-4">
					<i data-lucide="alert-circle" class="tw-w-8 tw-h-8"></i>
				</div>
				<h3 id="confirm-asset-deletion-title" class="tw-text-xl tw-font-bold tw-text-slate-800 tw-mb-1">Delete Asset</h3>
				<p class="tw-text-[10px] tw-font-black tw-text-slate-400 tw-uppercase tw-tracking-widest">Permanent Action</p>
			</div>
			<!-- Body -->
			<div class="tw-px-8 tw-pb-8 tw-text-center">
				<p id="confirm-asset-deletion-description" class="tw-text-slate-500 tw-text-sm tw-leading-relaxed">
					Do you really want to delete the selected asset?
				</p>
			</div>
			<!-- Actions -->
			<div class="tw-modal-action tw-bg-white tw-p-6 tw-pt-2 tw-flex tw-justify-center tw-gap-3">
				<button class="tw-btn tw-btn-ghost tw-text-slate-400 hover:tw-text-slate-600 tw-px-8"
						onclick="document.getElementById('confirm-deletion-dialog').close()">CANCEL</button>
				<button id="delete-asset-btn-confirmation" class="tw-btn vrodos-btn-premium-error tw-px-10">DELETE</button>
			</div>
		</div>
		<form method="dialog" class="tw-modal-backdrop">
			<button class="tw-cursor-default tw-outline-none tw-bg-slate-900/40 tw-backdrop-blur-sm tw-appearance-none tw-border-none tw-text-transparent">close</button>
		</form>
	</dialog>

	<!-- Scripts part 1: The GUIs -->
	<script type="text/javascript">

		// Render Lucide icons after DOM is ready
		if (typeof lucide !== 'undefined') lucide.createIcons();

		let vr_editor_main_div = document.getElementById( 'vr_editor_main_div' );
		var envir = new vrodos_3d_editor_environmentals(vr_editor_main_div);
		envir.is2d = false;

		var transform_controls = new THREE.TransformControls(envir.cameraOrbit, envir.renderer.domElement );
		transform_controls.name = 'myTransformControls';

		// id of animation frame is used for canceling animation when dat-gui changes
		let id_animation_frame;

		// Selected object name
		var selected_object_name = '';

		//var firstPersonBlocker = document.getElementById('firstPersonBlocker');
		let firstPersonBlockerBtn = document.getElementById('firstPersonBlockerBtn');

		// Make a Loading Manager
		var manager = new THREE.LoadingManager();
		envir.sceneLoadFinalized = false;

		function finalizeSceneLoad() {
			if (!envir || envir.sceneLoadFinalized) {
				return;
			}

			envir.sceneLoadFinalized = true;
			envir.isSceneLoading = false;

			// Don't auto-select any object on load — user clicks to select
			transform_controls.detach();
			removeAllCelOutlines();
			hideObjectControlsPanel();

			// Find scene dimension in order to configure camera in 2D view (Y axis distance)
			findSceneDimensions();
			envir.updateCameraGivenSceneLimits();

			// FOCUS ON PLAYER/ACTOR ON LOAD
			(function focusOnPlayer() {
				let playerObject = null;
				// Priority 1: Search for Actor/Pawn
				envir.scene.traverse(obj => {
					if (!playerObject && (obj.category_name === 'pawn' || obj.name?.includes('Pawn'))) {
						playerObject = obj;
					}
				});
				// Priority 2: Fallback to Avatar Camera
				if (!playerObject) {
					playerObject = envir.scene.getObjectByName('avatarCamera') || envir.scene.getObjectByName('Camera3Dmodel');
				}

				if (playerObject) {
					// Center orbit controls on player
					envir.orbitControls.target.copy(playerObject.position);
					// Set a good close-up zoom level for Orthographic Camera
					envir.cameraOrbit.zoom = 800; 
					envir.cameraOrbit.updateProjectionMatrix();
					envir.orbitControls.update();
				}
			})();

			removeHierarchySkeleton();
			setHierarchyViewer();

			for (let n in vrodos_scene_data.objects) {
				// (function (name) {

				//     // Set Target light for Spots
				//     if (vrodos_scene_data.objects[name]['category_name'] === 'lightSpot') {
				//         let lightSpot = envir.scene.getObjectByName(name);
				//         lightSpot.target = envir.scene.getObjectByName(vrodos_scene_data.objects[name]['lighttargetobjectname']);
				//     }
				// })(n);
			}

			// Avoid culling by frustum
			envir.scene.traverse(function (obj) {
				obj.frustumCulled = false;
			});

			// Remote shadows. Recheck in v141
			// envir.scene.children.forEach(function(item,index){
			// 	if(item.type ==="DirectionalLight" || item.type==="SpotLight" || item.type==="PointLight"){
			// 		item.shadow.mapSize.width = 0;
			// 		item.shadow.mapSize.height = 0;
			// 	}
			// });

			// Update Light Helpers to point to each object (spot light)
			envir.scene.traverse(function(child) {
					if (child.light != undefined)
						child.update();
				}
			);

			document.getElementById("progressWrapper").style.visibility = "hidden";

			document.getElementById("compileGameBtn").disabled = false;
		}

		function prepareSceneLoadManager() {
			envir.sceneLoadFinalized = false;

			manager.onProgress = function ( url, loaded, total ) {
				document.getElementById("result_download").innerHTML = "Loading " + loaded + " / " + total;
			};

			manager.onLoad = function () {};
		}

		// load asset browser with data
		document.addEventListener('DOMContentLoaded', function() {

			initHierarchyViewerEvents();
			vrodos_fetchListAvailableAssetsAjax(isAdmin, projectSlug, urlforAssetEdit, projectId);
			// make asset browser draggable: not working without get_footer
			// jQuery('#assetBrowserToolbar').draggable({cancel : 'ul'});

			// Populate the JSON viewer textarea with the actual exported scene payload
			if (typeof refreshSceneJsonTextarea === 'function') {
				refreshSceneJsonTextarea();
			}

			// Set initial background color and UI from scene data
			if (vrodos_scene_data.backgroundStyleOption === 4) {
				envir.scene.background = null;
				document.getElementById('sceneNoBackground').checked = true;
				document.getElementById('jscolorpick').value = 'ffffff';
			} else if (vrodos_scene_data.backgroundStyleOption === 1 && vrodos_scene_data.ClearColor) {
				envir.scene.background = new THREE.Color(vrodos_scene_data.ClearColor);
				document.getElementById('sceneColorRadio').checked = true;
				document.getElementById('jscolorpick').value = vrodos_scene_data.ClearColor.substring(1);
			} else {
				// Default to white if no color is set
				envir.scene.background = new THREE.Color(0xffffff);
				document.getElementById('sceneColorRadio').checked = true;
				document.getElementById('jscolorpick').value = 'ffffff';
			}

			if (typeof syncBackgroundStyleDescription === 'function') {
				syncBackgroundStyleDescription(vrodos_scene_data.backgroundStyleOption);
			}


			// Add 3D gui widgets to gui vr_editor_main_div
			let guiContainer = document.getElementById('numerical_gui-container');
			guiContainer.appendChild(controlInterface.domElement);
			// guiContainer.appendChild(controlInterface.rotate.domElement);
			// guiContainer.appendChild(controlInterface.scale.domElement);


			// Hide (right click) panel
			hideObjectPropertiesPanels();

			// Add Listeners for: When Dat.Gui changes update php, javascript vars and transform_controls
			controllerDatGuiOnChange();

			// Block saves before any loader runs — prevents partial-scene autosaves
			// (e.g. initSpot firing triggerAutoSave before GLB objects have loaded).
			envir.isSceneLoading = true;
			prepareSceneLoadManager();

			// Add lights and assets on scene
			let lightsPawnLoader = new VRodos_LightsPawn_Loader();
			let lightsLoadPromise = lightsPawnLoader.load(vrodos_scene_data, pluginPath, manager);

			// Loader of assets (GLB models, Videos, Images)
			let loaderMulti = new VRodos_LoaderMulti();
			let assetsLoadPromise = loaderMulti.load(manager, vrodos_scene_data.objects, pluginPath);


			// Add all in hierarchy viewer
			setHierarchyViewer();

			// Add transform controls to scene
			envir.scene.add(transform_controls);
			document.getElementById("compileGameBtn").disabled = true;

			// Load Manager UI
			// Make progress bar visible
			document.getElementById("progress").style.display = "block";
			document.getElementById("progressWrapper").style.visibility = "visible";
			document.getElementById("result_download").innerHTML = "Loading";
			Promise.allSettled([lightsLoadPromise, assetsLoadPromise]).then(function () {
				finalizeSceneLoad();
			});

			//--- initiate PointerLockControls ---------------
			initPointerLock();

			// DELETE LOBBY OBJ
			animate();

			// Set all buttons actions
			loadButtonActions();

			document.getElementsByTagName("html")[0].style.overflow="hidden";
			let color_sel = document.getElementById('jscolorpick');
			let custom_img_sel = document.getElementById('img_upload_bcg');
			let preset_sel = document.getElementById('presetsBcg');
			let preset_ground_toggle = document.getElementById('presetGroundToggle');

			if (preset_sel && !preset_sel.dataset.vrodosChangeBound) {
				preset_sel.addEventListener('change', function () {
					handleBackgroundPresetChange(this);
				});
				preset_sel.dataset.vrodosChangeBound = 'true';
			}
			if (preset_ground_toggle && !preset_ground_toggle.dataset.vrodosChangeBound) {
				preset_ground_toggle.addEventListener('change', function () {
					handleBackgroundPresetGroundToggle(this);
				});
				preset_ground_toggle.dataset.vrodosChangeBound = 'true';
			}

			// Init UI values

			let img_thumb = document.getElementById('uploadImgThumb');

			if (vrodos_scene_data["enableGeneralChat"]) {
				document.getElementById("enableGeneralChatCheckbox").checked = vrodos_scene_data["enableGeneralChat"];
				envir.scene.enableGeneralChat = vrodos_scene_data["enableGeneralChat"];
			}
			if (vrodos_scene_data["enableAvatar"]) {
				document.getElementById("enableAvatarCheckbox").checked = vrodos_scene_data["enableAvatar"];
				envir.scene.enableAvatar = vrodos_scene_data["enableAvatar"];
			}
			if (vrodos_scene_data["SceneSettings"] || vrodos_scene_data["fogCategory"]) {
				const settings = vrodos_scene_data["SceneSettings"] || vrodos_scene_data;
				envir.scene.fogCategory = settings.fogCategory;
				envir.scene.fogtype = settings.fogtype || 'none';
				envir.scene.fogcolor = settings.fogcolor || '#ffffff';
				envir.scene.fognear = settings.fognear || 0.1;
				envir.scene.fogfar = settings.fogfar || 1000;
				envir.scene.fogdensity = (settings.fogdensity !== undefined) ? settings.fogdensity : 0.01;

				// Sync Fog UI
				const fogTypeRadios = { 0: 'RadioNoFog', 1: 'RadioLinearFog', 2: 'RadioExponentialFog' };
				let radioId = fogTypeRadios[envir.scene.fogCategory];
				if (radioId) {
					let radioEl = document.getElementById(radioId);
					if (radioEl) radioEl.checked = true;
				}
			if (typeof loadFogType === 'function') loadFogType();
			}
			if (vrodos_scene_data["disableMovement"]) {
				document.getElementById("moveDisableCheckbox").checked = vrodos_scene_data["disableMovement"];
				envir.scene.disableMovement = vrodos_scene_data["disableMovement"];
			}
			envir.scene.aframeCollisionMode = vrodos_scene_data["aframeCollisionMode"] || 'auto';
			let aframeCollisionModeCheckbox = document.getElementById("aframeCollisionModeCheckbox");
			if (aframeCollisionModeCheckbox) {
				aframeCollisionModeCheckbox.checked = envir.scene.aframeCollisionMode !== 'off';
			}
			envir.scene.aframeRenderQuality = vrodos_scene_data["aframeRenderQuality"] || 'standard';
			envir.scene.aframeShadowQuality = vrodos_scene_data["aframeShadowQuality"] || 'medium';
			envir.scene.aframeAAQuality = vrodos_scene_data["aframeAAQuality"] || 'balanced';
			envir.scene.aframeFPSMeterEnabled = vrodos_scene_data["aframeFPSMeterEnabled"] === true || vrodos_scene_data["aframeFPSMeterEnabled"] === 'true';
			envir.scene.aframeAmbientOcclusionPreset = vrodos_scene_data["aframeAmbientOcclusionPreset"] || 'balanced';
			envir.scene.aframeContactShadowPreset = vrodos_scene_data["aframeContactShadowPreset"] || 'soft';
			envir.scene.aframePostFXEnabled = vrodos_scene_data["aframePostFXEnabled"] === true || vrodos_scene_data["aframePostFXEnabled"] === 'true';
			envir.scene.aframePostFXBloomEnabled = !(vrodos_scene_data["aframePostFXBloomEnabled"] === false || vrodos_scene_data["aframePostFXBloomEnabled"] === 'false');
			envir.scene.aframePostFXColorEnabled = !(vrodos_scene_data["aframePostFXColorEnabled"] === false || vrodos_scene_data["aframePostFXColorEnabled"] === 'false');
			envir.scene.aframePostFXVignetteEnabled = false;
			envir.scene.aframePostFXEdgeAAEnabled = !(vrodos_scene_data["aframePostFXEdgeAAEnabled"] === false || vrodos_scene_data["aframePostFXEdgeAAEnabled"] === 'false');
			envir.scene.aframePostFXEdgeAAStrength = vrodos_scene_data["aframePostFXEdgeAAStrength"] || 3;
			envir.scene.aframeBloomStrength = vrodos_scene_data["aframeBloomStrength"] || 'off';
			envir.scene.aframeExposurePreset = vrodos_scene_data["aframeExposurePreset"] || 'neutral';
			envir.scene.aframeContrastPreset = vrodos_scene_data["aframeContrastPreset"] || 'balanced';
			if (envir.scene.aframePostFXBloomEnabled === false) {
				envir.scene.aframeBloomStrength = 'off';
			}
			envir.scene.aframePostFXBloomEnabled = envir.scene.aframeBloomStrength !== 'off';
			envir.scene.aframeReflectionProfile = vrodos_scene_data["aframeReflectionProfile"] || 'balanced';
			envir.scene.aframeHorizonSkyPreset = vrodos_scene_data["aframeHorizonSkyPreset"] || 'natural';
			envir.scene.aframeEnvMapPreset = vrodos_scene_data["aframeEnvMapPreset"] || 'none';
			if (typeof syncCompileDialogFromSceneSettings === 'function') {
				syncCompileDialogFromSceneSettings();
			}
			if (vrodos_scene_data["backgroundStyleOption"] !== undefined) {
				let  selOption = parseInt(vrodos_scene_data["backgroundStyleOption"]);
				let presetGroundEnabled = vrodos_scene_data["backgroundPresetGroundEnabled"] !== false;
				let horizonSkyPresetSelect = document.getElementById("horizonSkyPreset");
				let horizonSkyRow = document.getElementById("bcgHorizonSkyRow");
				if (preset_ground_toggle) {
					preset_ground_toggle.checked = presetGroundEnabled;
					preset_ground_toggle.disabled = true;
				}
				if (typeof setBackgroundPresetGroundEnabled === 'function') {
					setBackgroundPresetGroundEnabled(presetGroundEnabled);
				}

				switch (selOption){
					case 4:
						envir.scene.background = null;
						document.getElementById("sceneNoBackground").checked = true;
						custom_img_sel.disabled = true;
						preset_sel.disabled = true;
						if (preset_ground_toggle) preset_ground_toggle.disabled = true;
						color_sel.disabled = true;
						if (horizonSkyPresetSelect) horizonSkyPresetSelect.disabled = true;

						if (horizonSkyRow) horizonSkyRow.style.display = 'none';
						document.getElementById("bcgColorRow").style.display = 'none';
						document.getElementById("bcgPresetsRow").style.display = 'none';
						document.getElementById("bcgPresetGroundRow").style.display = 'none';
						document.getElementById("bcgImageRow").style.display = 'none';
						img_thumb.hidden = true;
						break;
					case 0:
						document.getElementById("sceneHorizon").checked = true;
						custom_img_sel.disabled = true;
						preset_sel.disabled = true;
						if (preset_ground_toggle) preset_ground_toggle.disabled = true;
						color_sel.disabled = true;
						if (horizonSkyPresetSelect) {
							horizonSkyPresetSelect.value = envir.scene.aframeHorizonSkyPreset;
							horizonSkyPresetSelect.disabled = false;
						}

						if (horizonSkyRow) horizonSkyRow.style.display = 'flex';
						document.getElementById("bcgColorRow").style.display = 'none';
						document.getElementById("bcgPresetsRow").style.display = 'none';
						document.getElementById("bcgPresetGroundRow").style.display = 'none';
						document.getElementById("bcgImageRow").style.display = 'none';
						img_thumb.hidden = true;
						break;
					case 1:
						document.getElementById("sceneColorRadio").checked = true;
						color_sel.disabled = false;
						preset_sel.disabled = true;
						if (preset_ground_toggle) preset_ground_toggle.disabled = true;
						custom_img_sel.disabled = true;
						if (horizonSkyPresetSelect) horizonSkyPresetSelect.disabled = true;

						if (horizonSkyRow) horizonSkyRow.style.display = 'none';
						document.getElementById("bcgColorRow").style.display = 'flex';
						document.getElementById("bcgPresetsRow").style.display = 'none';
						document.getElementById("bcgPresetGroundRow").style.display = 'none';
						document.getElementById("bcgImageRow").style.display = 'none';
						img_thumb.hidden = true;
						break;
					case 2:
						document.getElementById("sceneSky").checked = true;
						custom_img_sel.disabled = true;
						preset_sel.disabled = false;
						if (preset_ground_toggle) preset_ground_toggle.disabled = false;
						color_sel.disabled = true;
						if (horizonSkyPresetSelect) horizonSkyPresetSelect.disabled = true;

						if (horizonSkyRow) horizonSkyRow.style.display = 'none';
						document.getElementById("bcgColorRow").style.display = 'none';
						document.getElementById("bcgPresetsRow").style.display = 'flex';
						document.getElementById("bcgPresetGroundRow").style.display = 'flex';
						document.getElementById("bcgImageRow").style.display = 'none';
						img_thumb.hidden = true;
						envir.scene.backgroundPresetOption = vrodos_scene_data["backgroundPresetOption"];

						for(let index = 0; index < preset_sel.options.length;index++){
							if(preset_sel.options[index].value == vrodos_scene_data["backgroundPresetOption"] ){
								preset_sel.options[index].selected = true;
							}
						}
						break;
					case 3:
						document.getElementById("sceneCustomImage").checked = true;
						custom_img_sel.disabled = false;
						preset_sel.disabled = true;
						if (preset_ground_toggle) preset_ground_toggle.disabled = true;
						color_sel.disabled = true;
						if (horizonSkyPresetSelect) horizonSkyPresetSelect.disabled = true;

						if (horizonSkyRow) horizonSkyRow.style.display = 'none';
						document.getElementById("bcgColorRow").style.display = 'none';
						document.getElementById("bcgPresetsRow").style.display = 'none';
						document.getElementById("bcgPresetGroundRow").style.display = 'none';
						document.getElementById("bcgImageRow").style.display = 'flex';

						if (vrodos_scene_data["backgroundImagePath"]  && vrodos_scene_data["backgroundImagePath"] !=0 ){
							img_thumb.src = vrodos_scene_data["backgroundImagePath"];
							img_thumb.hidden = false;
						}
						break;
				}
				envir.scene.img_bcg_path = vrodos_scene_data["backgroundImagePath"];
				envir.scene.backgroundStyleOption = vrodos_scene_data["backgroundStyleOption"];
			}


		}); // End of document ready

		// Only in Undo redo as javascript not php!
		function parseJSON_LoadScene(scene_json) {

			let resources3D = new VrodosSceneImporter().parse(scene_json, uploadDir);
			envir.isSceneLoading = true;
			prepareSceneLoadManager();

			// CLEAR SCENE
			let preserveElements = ['myAxisHelper', 'myGridHelper', 'avatarCamera', 'myTransformControls'];

			for (let i = envir.scene.children.length - 1; i >=0 ; i--) {
				if (!preserveElements.includes(envir.scene.children[i].name))
					envir.scene.remove(envir.scene.children[i]);
			}
			var lightsLoader = new VRodos_LightsPawn_Loader();
			let lightsLoadPromise = lightsLoader.load(resources3D, pluginPath, manager);

			setHierarchyViewer();
			//setHierarchyViewerLight();

			transform_controls = envir.scene.getObjectByName('myTransformControls');
			transform_controls.attach(envir.scene.getObjectByName("avatarCamera"));

			
			loaderMulti = new VRodos_LoaderMulti("2");
			let assetsLoadPromise = loaderMulti.load(manager, resources3D, pluginPath);
			Promise.allSettled([lightsLoadPromise, assetsLoadPromise]).then(function () {
				finalizeSceneLoad();
			});

		}
		<!--  Part 3: Start 3D with Javascript   -->

		function updatePositionsAndControls()
		{
			// envir.orbitControls.update();
			// updatePointerLockControls();

			// Now update the translation and rotation input texts from transform controls
			if (transform_controls.object) {
				const affines = ['position', 'rotation', 'scale'];
				for (let j=0; j<3; j++ ) {
					for (let i = 0; i < 3; i++) {
						if (controlInterface.controllers[j*3+i].getValue() !== transform_controls.object[affines[j]].toArray()[i]) {
							controlInterface.controllers[j*3+i].updateDisplay();
						}
					}
				}
				updatePositionsPhpAndJavsFromControlsAxes();
			}
		}



		function attachToControls(name, objItem){

			let trs_tmp = vrodos_scene_data.objects[name]['trs'];
			transform_controls.attach(objItem);
			console.log("attached");
			console.log(objItem);

			if (objItem.category_name == "avatarYawObject"){
				document.getElementById('rotate-switch').disabled = true;
				document.getElementById('rotate-switch-label').style.color = "grey";

				document.getElementById('scale-switch').disabled = true;
				document.getElementById('scale-switch-label').style.color = "grey";
			}
				
			else{
				document.getElementById('rotate-switch').disabled = false;
				document.getElementById('rotate-switch-label').style = "inherit";

				document.getElementById('scale-switch').disabled = false;
				document.getElementById('scale-switch-label').style = "inherit";
			}

			// highlight — cel outline (no panel on load)
			removeAllCelOutlines();
			addCelOutline(objItem);

			transform_controls.object.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1],
				trs_tmp['translation'][2]);
			transform_controls.object.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1],
				trs_tmp['rotation'][2]);
			transform_controls.object.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);


			console.log(objItem);

			// Don't show the floating panel on initial scene load — only on user interaction
			// showObjectControlsPanel();
			var dblSidedSwitch = document.getElementById('double-sided-switch');
			if (dblSidedSwitch) dblSidedSwitch.style.display = '';

			showObjectPropertiesPanel(transform_controls.getMode());

			selected_object_name = name;
			transform_controls.setMode("translate");

			// Resize controls based on object size
			setTransformControlsSize();
		}

		function animate()
		{

			if(isPaused) {
				return;
			}

			id_animation_frame = requestAnimationFrame( animate );

			// Select the proper camera (orbit, or avatar, or thirdPersonView)
			let curr_camera = avatarControlsEnabled ?
				(envir.thirdPersonView ? envir.cameraThirdPerson : envir.cameraAvatar) : envir.cameraOrbit;

			// Render it
			// envir.renderer.render( envir.scene, curr_camera);
			// Label is for setting labels to objects

			envir.labelRenderer.render(envir.scene, curr_camera);


			// Animation
			if (envir.flagPlayAnimation) {
				if (envir.animationMixers.length > 0) {
					let new_time = envir.clock.getDelta();
					for (let i = 0; i < envir.animationMixers.length; i++) {
						envir.animationMixers[i].update(new_time);
					}
				}
			}

			if (envir.isComposerOn)
				envir.composer.render();


			// Update it
			envir.orbitControls.update();
			updatePointerLockControls();

			//updatePositionsAndControls();

			//envir.cubeCamera.update( envir.renderer, envir.scene );
		}

		let toggleEnvTexture = (el) => {
			document.getElementById("env_texture-change-btn").classList.toggle('toggle-active');
			el.checked = !el.checked;
			envir.scene.environment = !el.checked ? null : envir.maintexture;
		}

	</script>
	<?php
}

// Add sceneType variable in js envir
$sceneType = isset( $_GET['vrodos_scene'] ) ? get_post_meta( $_GET['vrodos_scene'], 'vrodos_scene_environment' ) : null;

if ( $sceneType ) {
	if ( count( $sceneType ) > 0 ) {
		echo '<script>';
		echo 'envir.sceneType="' . $sceneType[0] . '";';
		echo '</script>';
	}
}
?>
<script>lucide.createIcons();</script>
<?php wp_footer(); ?>
</body>
</html>
