/**
 * VRodos Editor Initializer (Phase 2)
 *
 * This module extracts and consolidates the editor's startup logic,
 * mapping localized PHP data to JavaScript state.
 */

// 1. Map localized data to global variables for backward compatibility
// These are used by legacy scripts (keyButtons, rayCasters, etc.)
window.pluginPath = vrodos_data.pluginPath;
window.uploadDir = vrodos_data.uploadDir;
window.urlforAssetEdit = vrodos_data.urlforAssetEdit;
window.isAdmin = vrodos_data.isAdmin;
window.projectSlug = vrodos_data.projectSlug;
window.projectId = vrodos_data.projectId;
window.vrodos_scene_data = vrodos_data.scene_data;
window.scene_id = vrodos_data.scene_id;
window.vrodos_scene_upload_image_nonce = vrodos_data.upload_image_nonce;

window.isPaused = vrodos_data.isPaused;
window.isAnyLight = vrodos_data.isAnyLight;
window.mapActions = vrodos_data.mapActions;
window.showPawnPositions = vrodos_data.showPawnPositions;

// Global Three.js / Editor state
window.envir = null;
window.transform_controls = null;
window.transform_controls_helper = null;
window.manager = new THREE.LoadingManager();
window.selected_object_name = '';
window.firstPersonBlockerBtn = null;
window.id_animation_frame = null;

/**
 * Initialize the 3D environment and UI
 */
function initVrodosEditor() {
    // Lucide icons
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const mainDiv = document.getElementById('vr_editor_main_div');
    if (!mainDiv) return;

    // Environmentals
    window.envir = new vrodos_3d_editor_environmentals(mainDiv);
    envir.is2d = false;

    // Initialize scale constraint to true (Uniform Scaling) by default
    if (envir.scene) {
        envir.scene.keepScaleAspectRatio = true;
    }

    // Transform Controls
    window.transform_controls = new THREE.TransformControls(envir.cameraOrbit, envir.renderer.domElement);
    window.transform_controls_helper = (typeof transform_controls.getHelper === 'function') ?
        transform_controls.getHelper() :
        transform_controls;
    transform_controls_helper.name = 'myTransformControls';

    window.firstPersonBlockerBtn = document.getElementById('firstPersonBlockerBtn');

    // Block saves before any loader runs
    envir.isSceneLoading = true;
    envir.sceneLoadFinalized = false;

    // Prepare Load Manager
    prepareSceneLoadManager();

    // UI & GUI Setup
    let guiContainer = document.getElementById('numerical_gui-container');
    if (guiContainer && typeof controlInterface !== 'undefined') {
        guiContainer.appendChild(controlInterface.domElement);
    }

    hideObjectPropertiesPanels();
    controllerDatGuiOnChange();

    // 2. Initialize Scene State using the Schema (Phase 1 Refactoring Win)
    // We merge all possible sources to handle legacy transitions correctly
    const sceneSettings = Object.assign({},
        vrodos_scene_data,
        vrodos_scene_data.SceneSettings || {},
        vrodos_scene_data.metadata || {}
    );

    // First pass: General sync using the schema
    for (const [key, schemaInfo] of Object.entries(VRODOS_SCENE_SETTINGS_SCHEMA)) {
        if (sceneSettings[key] !== undefined) {
             vrodosSyncSceneSetting(key, sceneSettings[key]);
        } else {
             // Apply defaults if missing
             vrodosSyncSceneSetting(key, schemaInfo.default);
        }
    }

    // Secondary pass: Background specific legacy logic
    syncBackgroundInitialState(sceneSettings);

    // 3. Load 3D Objects
    const lightsPawnLoader = new VRodos_LightsPawn_Loader();
    const lightsLoadPromise = lightsPawnLoader.load(vrodos_scene_data, pluginPath, manager);

    const loaderMulti = new VRodos_LoaderMulti();
    const assetsLoadPromise = loaderMulti.load(manager, vrodos_scene_data.objects, pluginPath);

    // Initial hierarchy
    setHierarchyViewer();

    // Fetch available assets
    if (typeof vrodos_fetchListAvailableAssetsAjax === 'function') {
        vrodos_fetchListAvailableAssetsAjax(isAdmin, projectSlug, urlforAssetEdit, projectId);
    }
    if (typeof initHierarchyViewerEvents === 'function') {
        initHierarchyViewerEvents();
    }

    // Add controls to scene
    envir.scene.add(transform_controls_helper);
    document.getElementById("compileGameBtn").disabled = true;

    // Progress UI
    document.getElementById("progress").style.display = "block";
    document.getElementById("progressWrapper").style.visibility = "visible";
    document.getElementById("result_download").innerHTML = "Loading";

    // Start everything when assets load
    Promise.allSettled([lightsLoadPromise, assetsLoadPromise]).then(function () {
        finalizeSceneLoad();
    });

    initPointerLock();
    animate();
    loadButtonActions();

    // Prevent body scroll
    document.getElementsByTagName("html")[0].style.overflow = "hidden";

    // Bind event listeners for background settings
    bindBackgroundUIEvents();

    // Initial compile dialog sync (Phase 2 fix)
    if (typeof syncCompileDialogFromSceneSettings === 'function') {
        syncCompileDialogFromSceneSettings();
    }

    // Scene Type
    if (vrodos_data.sceneType) {
        envir.sceneType = vrodos_data.sceneType;
    }
}

/**
 * Update the translation and rotation input texts from transform controls
 * (Restored from legacy template logic)
 */
function updatePositionsAndControls() {
    if (!transform_controls.object || !controlInterface) return;
    if ((window.vrodosGuiKeyboardEditing || 0) > 0) return;

    const affines = ['position', 'rotation', 'scale'];
    for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 3; i++) {
            if (controlInterface.controllers[j * 3 + i].getValue() !== transform_controls.object[affines[j]].toArray()[i]) {
                controlInterface.controllers[j * 3 + i].updateDisplay();
            }
        }
    }

    if (typeof updatePositionsPhpAndJavsFromControlsAxes === 'function') {
        updatePositionsPhpAndJavsFromControlsAxes();
    }
}
window.updatePositionsAndControls = updatePositionsAndControls;
window.animate = animate;

/**
 * Handle background UI initialization that requires specific logic
 */
function syncBackgroundInitialState(settings) {
    const selOption = parseInt(settings.backgroundStyleOption);
    if (isNaN(selOption)) return;

    if (typeof syncBackgroundStyleDescription === 'function') {
        syncBackgroundStyleDescription(selOption);
    }

    // Call bcgRadioSelect (from vrodos_scripts.js) to fix UI rows and states
    const radioIdMap = { 0: 'sceneHorizon', 1: 'sceneColorRadio', 2: 'sceneSky', 3: 'sceneCustomImage', 4: 'sceneNoBackground' };
    const radioEl = document.getElementById(radioIdMap[selOption]);
    if (radioEl) {
        radioEl.checked = true;
        if (typeof bcgRadioSelect === 'function') {
            // We pass the radio element to trigger the logic but we DON'T want to saveChanges on init
            // bcgRadioSelect calls saveChanges internally, so we might need to block it briefly or refactor
            // For now, let's just use the direct logic if we can
        }
    }
}

/**
 * Bind event listeners for background settings
 */
function bindBackgroundUIEvents() {
    const preset_sel = document.getElementById('presetsBcg');
    const preset_ground_toggle = document.getElementById('presetGroundToggle');

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
}

/**
 * Preparation logic before assets start loading
 */
function prepareSceneLoadManager() {
    envir.sceneLoadFinalized = false;
    manager.onProgress = function (url, loaded, total) {
        document.getElementById("result_download").innerHTML = "Loading " + loaded + " / " + total;
    };
}

/**
 * Finalize scene load: camera focus, hierarchy setup, etc.
 */
function finalizeSceneLoad() {
    if (!envir || envir.sceneLoadFinalized) return;

    envir.sceneLoadFinalized = true;
    envir.isSceneLoading = false;

    // Detach controls on load
    transform_controls.detach();
    if (typeof removeAllCelOutlines === 'function') removeAllCelOutlines();
    if (typeof hideObjectControlsPanel === 'function') hideObjectControlsPanel();

    if (typeof findSceneDimensions === 'function') {
        findSceneDimensions();
        envir.updateCameraGivenSceneLimits();
    }

    // Focus on Actor/Player
    (function focusOnPlayer() {
        let playerObject = null;
        envir.scene.traverse(obj => {
            if (!playerObject && (obj.category_name === 'pawn' || obj.name?.includes('Pawn'))) {
                playerObject = obj;
            }
        });
        if (!playerObject) {
            playerObject = envir.scene.getObjectByName('avatarCamera') || envir.scene.getObjectByName('Camera3Dmodel');
        }

        if (playerObject) {
            envir.orbitControls.target.copy(playerObject.position);
            envir.cameraOrbit.zoom = 800;
            envir.cameraOrbit.updateProjectionMatrix();
            envir.orbitControls.update();
        }
    })();

    if (typeof removeHierarchySkeleton === 'function') removeHierarchySkeleton();
    setHierarchyViewer();

    // Avoid culling and update lights
    envir.scene.traverse(function (obj) {
        obj.frustumCulled = false;
        if (obj.light != undefined && typeof obj.update === 'function') {
            obj.update();
        }
    });

    document.getElementById("progressWrapper").style.visibility = "hidden";
    document.getElementById("compileGameBtn").disabled = false;
}

/**
 * The main animation loop
 */
function animate() {
    if (isPaused) return;

    id_animation_frame = requestAnimationFrame(animate);

    let curr_camera = (typeof avatarControlsEnabled !== 'undefined' && avatarControlsEnabled) ?
        (envir.thirdPersonView ? envir.cameraThirdPerson : envir.cameraAvatar) : envir.cameraOrbit;

    if (envir.labelRenderer) {
        envir.labelRenderer.render(envir.scene, curr_camera);
    }

    if (envir.flagPlayAnimation && envir.animationMixers.length > 0) {
        let new_time = envir.clock.getDelta();
        for (let i = 0; i < envir.animationMixers.length; i++) {
            envir.animationMixers[i].update(new_time);
        }
    }

    if (envir.isComposerOn && envir.composer) {
        envir.composer.render();
    }

    envir.orbitControls.update();
    if (typeof updatePointerLockControls === 'function') {
        updatePointerLockControls();
    }
    if (typeof envir.updateCompassUI === 'function') {
        envir.updateCompassUI();
    }
}

/**
 * Interface toggle for environment textures
 */
window.toggleEnvTexture = (el) => {
    const btn = document.getElementById("env_texture-change-btn");
    if (btn) btn.classList.toggle('toggle-active');
    el.checked = !el.checked;
    envir.scene.environment = !el.checked ? null : envir.maintexture;
};

// INITIALIZE ON DOM CONTENT LOADED
document.addEventListener('DOMContentLoaded', initVrodosEditor);
