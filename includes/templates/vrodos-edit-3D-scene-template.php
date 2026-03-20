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
                        <a id="toggleViewSceneContentBtn" data-toggle='off' type="button"
                           class="tw-flex tw-items-center tw-gap-1 tw-px-2 tw-py-1 tw-text-xs tw-font-bold tw-opacity-40 hover:tw-opacity-100 tw-transition-all tw-cursor-pointer"
                           title="View JSON">
                            <i data-lucide="eye-off" class="tw-w-3.5 tw-h-3.5"></i> JSON
                        </a>

                        <a id="save-scene-button" title="Save changes" class="tw-px-3 tw-py-1 tw-text-xs tw-font-bold tw-uppercase tw-tracking-wider hover:tw-bg-white/10 tw-rounded tw-transition-colors">
                            Save Scene
                        </a>

						<button id="compileGameBtn"
							class="d-btn d-btn-primary tw-text-white tw-font-bold"
							title="Build Project">
							<i data-lucide="hammer" class="tw-w-4 tw-h-4"></i>&nbsp;Build Project
						</button>
					</div>

				</div>
				<!--Compile Dialogue html-->
				<?php require plugin_dir_path( __DIR__ ) . '/templates/vrodos-edit-3D-scene-CompileDialogue.php'; ?>

				<!-- Scene JSON content TextArea display and set input field -->
				<div id="sceneJsonContent" >
						<textarea id="vrodos_scene_json_input"
								name="vrodos_scene_json_input"
								title="vrodos_scene_json_input"
						></textarea>
				</div>



				<!-- Lights -->
				<div class="environmentBar hidable tw-flex tw-items-center tw-gap-2">

					<div title="An entry point for Actors, they can choose one of multiple points when logging in" class="lightpawnbutton" data-lightPawn="Pawn" draggable="true">
						<header draggable="false" class="notdraggable">Actor</header>
						<img draggable="false" class="lighticon notdraggable" style="padding:2px; margin-top:0"
							src="<?php echo $pluginpath; ?>/images/lights/pawn.png"/>
					</div>

					<div class="tw-w-px tw-h-[45px] tw-bg-white/30 tw-mx-0.5"></div>

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
							class="EditorToolbarBtnStyle d-btn d-btn-sm toggle-btn toggle-active">3D</a>
					</div>

					<!-- The button to start walking in the 3d environment -->
					<div class="environmentButton">
						<div id="firstPersonBlocker">
							<a type="button" id="firstPersonBlockerBtn" data-toggle='on'
								class="EditorToolbarBtnStyle d-btn d-btn-xs toggle-btn"
								title="Change camera to First Person View - Move: W,A,S,D,Q,E,R,F keys">
								<i data-lucide="user" class="tw-w-4 tw-h-4"></i>
							</a>
						</div>
					</div>

					<!--  Toggle Around Tour -->
					<div class="environmentButton">
						<a type="button" id="toggle-tour-around-btn" data-toggle='off'
							title="Auto-rotate 3D tour"
							class="EditorToolbarBtnStyle d-btn d-btn-xs toggle-btn">
							<i data-lucide="rotate-ccw" class="tw-w-4 tw-h-4"></i>
						</a>
					</div>


					<div class="environmentButton">
						<input style="display: none" type="checkbox" id="sceneEnvironmentTexture" name="sceneEnvTexture" checked />
						<a id="env_texture-change-btn"
							title="Toggle textures" onclick="toggleEnvTexture(document.getElementById('sceneEnvironmentTexture'))"
							class="EditorToolbarBtnStyle d-btn d-btn-xs toggle-btn toggle-active">
							<i data-lucide="layers" class="tw-w-4 tw-h-4"></i>
						</a>
					</div>

					<!-- Cogwheel options -->
					<div class="environmentButton">
						<div id="row_cogwheel" class="row-right-panel">
							<a type="button" id="optionsPopupBtn"
								class="EditorToolbarBtnStyle d-btn d-btn-xs d-btn-primary"
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
						<span id="object-controls-title" class="tw-text-xs tw-font-semibold tw-text-slate-300 tw-uppercase tw-tracking-wider">Object Controls</span>
						<button id="object-controls-close" class="tw-p-0.5 tw-text-slate-400 hover:tw-text-white tw-transition-colors" title="Close panel">
							<i data-lucide="x" class="tw-w-3.5 tw-h-3.5"></i>
						</button>
					</div>

					<!-- Axes controls row -->
					<div class="tw-flex tw-flex-nowrap tw-items-center tw-gap-1 tw-px-3 tw-py-1.5 tw-bg-slate-700/40">
						<span class="tw-text-[8pt] tw-font-semibold tw-text-slate-400 tw-leading-tight tw-shrink-0">Axes:</span>

						<div id="object-manipulation-toggle"
							 class="ObjectManipulationToggle d-join tw-flex tw-items-center tw-gap-0" style="display: none;">
							<input type="radio" id="translate-switch" name="object-manipulation-switch" value="translate" class="tw-peer tw-hidden" checked/>
							<label for="translate-switch" id="translate-switch-label" class="d-join-item d-btn d-btn-xs affineSwitch">Move</label>
							<input type="radio" id="rotate-switch" name="object-manipulation-switch" value="rotate" class="tw-peer tw-hidden" />
							<label for="rotate-switch" id="rotate-switch-label" class="d-join-item d-btn d-btn-xs affineSwitch">Rotate</label>
							<input type="radio" id="scale-switch" name="object-manipulation-switch" value="scale" class="tw-peer tw-hidden" />
							<label for="scale-switch" id="scale-switch-label" class="d-join-item d-btn d-btn-xs affineSwitch">Scale</label>
						</div>

						<div id="axis-manipulation-buttons" class="tw-flex tw-items-center tw-gap-0.5 tw-ml-auto" style="display: none;">
							<a id="axis-size-increase-btn" title="Increase axes size" class="d-btn d-btn-xs d-btn-primary tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center tw-p-0">+</a>
							<a id="axis-size-decrease-btn" title="Decrease axes size" class="d-btn d-btn-xs d-btn-primary tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center tw-p-0">-</a>
						</div>
					</div>

					<!-- lil-gui container -->
					<div id="numerical_gui-container" class="VrGuiContainerStyle"></div>

					<!-- Constrain scale -->
					<div class="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1.5 tw-border-t tw-border-white/5">
						<input type="checkbox" title="Constrain Scale dims to one value"
							   id="scaleLockCheckbox" name="scaleLockCheckbox" form="3dAssetForm"
							   class="d-checkbox d-checkbox-sm d-checkbox-primary"
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
					<a id="pauseRendering" class="d-btn d-btn-sm d-btn-primary"
						title="Pause rendering">
						<i data-lucide="play" style="width:18px; height:18px;"></i>
					</a>
				</div>


				<!--  Make form to submit user changes -->
				<div id="progressWrapper" class="VrInfoPhpStyle" style="visibility: visible">
					<div id="progress" class="ProgressContainerStyle tw-text-slate-700 tw-text-base">
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
						<button id="allAssetsViewBt" class="tablinks d-btn d-btn-xs d-btn-ghost active">All</button>
					</div>

					<!-- Search bar -->
					<div class="search tw-relative tw-p-2 tw-bg-slate-900/40 tw-mx-2 tw-mb-2 tw-rounded-lg tw-border tw-border-white/5">
						<i data-lucide="search" class="tw-absolute tw-left-4 tw-top-1/2 tw-transform tw--translate-y-1/2 tw-w-3.5 tw-h-3.5 tw-opacity-40"></i>
						<input type="search" placeholder="Find assets..." class="tw-w-full tw-bg-transparent tw-border-none tw-pl-8 tw-pr-4 tw-py-1 tw-text-[11px] tw-text-slate-200 focus:tw-ring-0 placeholder:tw-text-slate-500" />
					</div>

					<ul id="filesList" class="data"></ul>

					<!-- ADD NEW ASSET FROM ASSETS LIST -->
					<a id="addNewAssetBtnAssetsList"
					   class="tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 d-btn-secondary tw-bg-secondary tw-text-white tw-rounded-full tw-shadow-lg hover:tw-bg-secondary-focus tw-transition-all tw-absolute tw-bottom-4 tw-right-4 tw-z-[1001]"
					   title="Add new private asset"
					   href="<?php echo esc_url( get_permalink( $newAssetPage[0]->ID ) . $parameter_pass . $project_id . '&vrodos_scene=' . $current_scene_id . '&scene_type=scene&preview=0&singleproject=true' ); ?>">
						<i data-lucide="plus" class="tw-w-5 tw-h-5"></i>
					</a>

				</div>

				<!-- Popups are now inside the floating Object Controls panel -->

				<!--  Open/Close Scene list panel-->
				<a id="scenesList-toggle-btn" data-toggle='on' type="button" class="scenesListToggleStyle scenesListToggleOn hidable d-btn d-btn-sm d-btn-primary" title="Toggle scenes list">
					<i data-lucide="panel-bottom" style="width:18px; height:18px; margin:auto"></i>
				</a>

				<!-- Scenes Credits and Main menu List -->
				<?php require plugin_dir_path( __DIR__ ) . '/templates/vrodos-edit-3D-scene-OtherScenes.php'; ?>

			</div>   <!--   VR DIV   -->

			<!--Options dialogue-->
			<?php require plugin_dir_path( __DIR__ ) . '/templates/vrodos-edit-3D-scene-OptionsDialogue.php'; ?>

		</div>

	</div>

	<dialog id="confirm-deletion-dialog" class="d-modal" style="z-index: 1000;">
		<div class="d-modal-box">
			<h3 id="confirm-asset-deletion-title" class="tw-font-bold tw-text-lg">Delete Asset</h3>
			<p id="confirm-asset-deletion-description" class="tw-py-4">Do you really want to delete the selected asset?</p>
			<p class="tw-text-sm tw-text-warning tw-font-semibold">WARNING: This action cannot be undone!</p>
			<div class="d-modal-action">
				<button class="d-btn" onclick="document.getElementById('confirm-deletion-dialog').close()">Cancel</button>
				<button id="delete-asset-btn-confirmation" class="d-btn d-btn-error">DELETE</button>
			</div>
		</div>
		<form method="dialog" class="d-modal-backdrop"><button>close</button></form>
	</dialog>

	<!-- Scripts part 1: The GUIs -->
	<script type="text/javascript">

		let mdc = window.mdc;
		mdc.autoInit();

		// Delete scene dialogue
		let deleteDialog = new mdc.dialog.MDCDialog(document.querySelector('#delete-dialog'));
		deleteDialog.focusTrap_.deactivate();

		// Compile dialogue
		let compileDialog = new mdc.dialog.MDCDialog(document.querySelector('#compile-dialog'));
		compileDialog.focusTrap_.deactivate();

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

		// load asset browser with data
		jQuery(document).ready( function() {

			vrodos_fetchListAvailableAssetsAjax(isAdmin, projectSlug, urlforAssetEdit, projectId);
			// make asset browser draggable: not working without get_footer
			// jQuery('#assetBrowserToolbar').draggable({cancel : 'ul'});

			// Populate the JSON viewer textarea
			document.getElementById('vrodos_scene_json_input').value = JSON.stringify(vrodos_scene_data, null, 2);

			// Set initial background color and UI from scene data
			if (vrodos_scene_data.backgroundStyleOption === 1 && vrodos_scene_data.ClearColor) {
				envir.scene.background = new THREE.Color(vrodos_scene_data.ClearColor);
				document.getElementById('sceneColorRadio').checked = true;
				document.getElementById('jscolorpick').value = vrodos_scene_data.ClearColor.substring(1);
			} else {
				// Default to white if no color is set
				envir.scene.background = new THREE.Color(0xffffff);
				document.getElementById('sceneColorRadio').checked = true;
				document.getElementById('jscolorpick').value = 'ffffff';
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

			// Add lights on scene
			let lightsPawnLoader = new VRodos_LightsPawn_Loader();
			lightsPawnLoader.load(vrodos_scene_data.objects);

			// Add all in hierarchy viewer
			setHierarchyViewer();

			// Add transform controls to scene
			envir.scene.add(transform_controls);
			document.getElementById("compileGameBtn").disabled = true;

			// Load Manager
			// Make progress bar visible
			jQuery("#progress").get(0).style.display = "block";
			jQuery("#progressWrapper").get(0).style.visibility = "visible";
			document.getElementById("result_download").innerHTML = "Loading";



			// On progress messages (loading)
			manager.onProgress = function ( url, loaded, total ) {
				document.getElementById("result_download").innerHTML = "Loading " + loaded + " / " + total;
			};

			// When all are finished loading place them in the correct position
			manager.onLoad = function () {

				// Don't auto-select any object on load — user clicks to select
				transform_controls.detach();
				removeAllCelOutlines();
				hideObjectControlsPanel();

				// Find scene dimension in order to configure camera in 2D view (Y axis distance)
				findSceneDimensions();
				envir.updateCameraGivenSceneLimits();

				setHierarchyViewer();
				removeHierarchySkeleton();

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

				jQuery("#progressWrapper").get(0).style.visibility = "hidden";

				document.getElementById("compileGameBtn").disabled = false;
			}; // End of manager

			// Loader of assets
			let loaderMulti = new VRodos_LoaderMulti();
			loaderMulti.load(manager, vrodos_scene_data.objects, pluginPath);

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
			if (vrodos_scene_data["fogCategory"]) {
				envir.scene.fogCategory = vrodos_scene_data["fogCategory"];
				envir.scene.fognear = vrodos_scene_data["fognear"];
				envir.scene.fogfar = vrodos_scene_data["fogfar"];
				envir.scene.fogdensity = vrodos_scene_data["fogdensity"];
			}
			if (vrodos_scene_data["disableMovement"]) {
				document.getElementById("moveDisableCheckbox").checked = vrodos_scene_data["disableMovement"];
				envir.scene.disableMovement = vrodos_scene_data["disableMovement"];
			}
			if (vrodos_scene_data["backgroundStyleOption"]) {
				let  selOption = vrodos_scene_data["backgroundStyleOption"];

				switch (selOption){
					case 0:
						document.getElementById("sceneNone").checked = true;
						custom_img_sel.disabled = true;
						preset_sel.disabled = true;
						color_sel.disabled = true;

						color_sel.hidden = true;
						preset_sel.hidden = true;
						custom_img_sel.hidden = true;
						img_thumb.hidden = true;
						break;
					case 1:
						document.getElementById("sceneColorRadio").checked = true;
						color_sel.disabled = false;
						preset_sel.disabled = true;
						custom_img_sel.disabled = true;

						color_sel.hidden = false;
						preset_sel.hidden = true;
						custom_img_sel.hidden = true;
						img_thumb.hidden = true;
						break;
					case 2:
						document.getElementById("sceneSky").checked = true;
						custom_img_sel.disabled = true;
						preset_sel.disabled = false;
						color_sel.disabled = true;

						color_sel.hidden = true;
						preset_sel.hidden = false;
						custom_img_sel.hidden = true;
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
						color_sel.disabled = true;

						color_sel.hidden = true;
						preset_sel.hidden = true;
						custom_img_sel.hidden = false;

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

			// CLEAR SCENE
			let preserveElements = ['myAxisHelper', 'myGridHelper', 'avatarCamera', 'myTransformControls'];

			for (let i = envir.scene.children.length - 1; i >=0 ; i--) {
				if (!preserveElements.includes(envir.scene.children[i].name))
					envir.scene.remove(envir.scene.children[i]);
			}
			var lightsLoader = new VRodos_LightsPawn_Loader();
			lightsLoader.load(resources3D);

			setHierarchyViewer();
			//setHierarchyViewerLight();

			transform_controls = envir.scene.getObjectByName('myTransformControls');
			transform_controls.attach(envir.scene.getObjectByName("avatarCamera"));

			
			loaderMulti = new VRodos_LoaderMulti("2");
			loaderMulti.load(manager, resources3D,pluginPath);

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
			jQuery('#double-sided-switch').show();

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
			jQuery("#env_texture-change-btn").toggleClass('toggle-active');
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
