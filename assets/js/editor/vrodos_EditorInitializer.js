/**
 * VRodos Editor Initializer (Phase 2)
 *
 * This module extracts and consolidates the editor's startup logic,
 * mapping localized PHP data to JavaScript state.
 */

// 1. Map localized data to the unified namespace
window.VRODOS = window.VRODOS || { ui: { transform: {} }, utils: {}, api: {}, data: {} };
VRODOS.data = Object.assign({}, typeof vrodos_data !== 'undefined' ? vrodos_data : {});
VRODOS.data.paths = vrodos_data.paths || {};

// Map to window for backward compatibility (legacy scripts)
window.pluginPath = VRODOS.data.pluginPath;
window.vrodos_paths = VRODOS.data.paths;
window.uploadDir = VRODOS.data.uploadDir;
window.urlforAssetEdit = VRODOS.data.urlforAssetEdit;
window.isAdmin = VRODOS.data.isAdmin;
window.projectSlug = VRODOS.data.projectSlug;
window.projectId = VRODOS.data.projectId;
window.vrodos_scene_data = VRODOS.data.scene_data;
window.scene_id = VRODOS.data.scene_id;
window.vrodos_scene_upload_image_nonce = VRODOS.data.upload_image_nonce;

VRODOS.editor.isPaused = VRODOS.data.isPaused || false;
window.isAnyLight = VRODOS.data.isAnyLight;
window.mapActions = VRODOS.data.mapActions;
window.showPawnPositions = VRODOS.data.showPawnPositions;

// 2. Core Editor State Bridge (Ensures legacy globals stay in sync with VRODOS namespace)
const coreState = {
    envir: () => VRODOS.editor.envir,
    transform_controls: () => VRODOS.editor.transform_controls,
    transform_controls_helper: () => VRODOS.editor.transform_controls_helper,
    manager: () => VRODOS.editor.manager,
    selected_object_name: () => VRODOS.editor.selected_object_name,
    firstPersonBlockerBtn: () => VRODOS.editor.firstPersonBlockerBtn,
    id_animation_frame: () => VRODOS.editor.id_animation_frame
};

Object.entries(coreState).forEach(([key, getter]) => {
    Object.defineProperty(window, key, {
        get: getter,
        set: (v) => { 
            const parts = key.split('_');
            const targetKey = parts.length > 1 ? key : key; // Keep original key for simplicity in namespace
            VRODOS.editor[key] = v; 
        },
        enumerable: true,
        configurable: true
    });
});

// 3. Initialize core objects
VRODOS.editor.manager = new THREE.LoadingManager();

function vrodosIsSceneGraphObject(object, sceneRoot) {
    let current = object || null;

    while (current) {
        if (current === sceneRoot) {
            return true;
        }
        current = current.parent || null;
    }

    return false;
}

function vrodosPatchTransformControlsAttach(controls, sceneRoot) {
    if (!controls || typeof controls.attach !== 'function' || controls._vrodosAttachPatched) {
        return;
    }

    const originalAttach = controls.attach.bind(controls);

    controls.attach = function (object) {
        if (!object || !sceneRoot || !vrodosIsSceneGraphObject(object, sceneRoot)) {
            this.visible = false;
            return this;
        }

        this.visible = true;
        return originalAttach(object);
    };

    controls._vrodosAttachPatched = true;
}

/**
 * Initialize the 3D environment and UI
 */
function initVrodosEditor() {
    // Lucide icons
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const mainDiv = document.getElementById('vr_editor_main_div');
    if (!mainDiv) return;

    // Environmentals
    VRODOS.editor.envir = new vrodos_3d_editor_environmentals(mainDiv);
    VRODOS.editor.envir.is2d = false;

    // Initialize scale constraint to true (Uniform Scaling) by default
    if (VRODOS.editor.envir.scene) {
        VRODOS.editor.envir.scene.keepScaleAspectRatio = true;
    }

    // Transform Controls
    VRODOS.editor.transform_controls = new THREE.TransformControls(VRODOS.editor.envir.cameraOrbit, VRODOS.editor.envir.renderer.domElement);

    VRODOS.editor.transform_controls_helper = (typeof VRODOS.editor.transform_controls.getHelper === 'function') ?
        VRODOS.editor.transform_controls.getHelper() :
        VRODOS.editor.transform_controls;
    VRODOS.editor.transform_controls_helper.name = 'myTransformControls';
    vrodosPatchTransformControlsAttach(VRODOS.editor.transform_controls, VRODOS.editor.envir.scene);

    VRODOS.editor.firstPersonBlockerBtn = document.getElementById('firstPersonBlockerBtn');
    window.firstPersonBlockerBtn = VRODOS.editor.firstPersonBlockerBtn;

    // Block saves before any loader runs
    VRODOS.editor.envir.isSceneLoading = true;
    VRODOS.editor.envir.sceneLoadFinalized = false;

    // Prepare Load VRODOS.editor.Manager
    prepareSceneLoadManager();

    // UI & GUI Setup
    const guiContainer = document.getElementById('numerical_gui-container');
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
    const lightsLoadPromise = lightsPawnLoader.load(vrodos_scene_data, pluginPath, VRODOS.editor.manager);

    const loaderMulti = new VRodos_LoaderMulti();
    const assetsLoadPromise = loaderMulti.load(VRODOS.editor.manager, vrodos_scene_data.objects, pluginPath);

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
    VRODOS.editor.envir.scene.add(VRODOS.editor.transform_controls_helper);
    document.getElementById("compileGameBtn").disabled = true;

    // Progress UI
    document.getElementById("progress").style.display = "block";
    document.getElementById("progressWrapper").style.visibility = "visible";
    document.getElementById("result_download").innerHTML = "Loading";

    // Start everything when assets load
    Promise.allSettled([lightsLoadPromise, assetsLoadPromise]).then(() => {
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
        VRODOS.editor.envir.sceneType = vrodos_data.sceneType;
    }
}

/**
 * Update the translation and rotation input texts from transform controls
 * (Restored from legacy template logic)
 */
function updatePositionsAndControls() {
    if (!VRODOS.editor.transform_controls.object || !controlInterface) return;
    if ((window.vrodosGuiKeyboardEditing || 0) > 0) return;

    const affines = ['position', 'rotation', 'scale'];
    for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 3; i++) {
            if (controlInterface.controllers[j * 3 + i].getValue() !== VRODOS.editor.transform_controls.object[affines[j]].toArray()[i]) {
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
    VRODOS.editor.envir.sceneLoadFinalized = false;
    VRODOS.editor.manager.onProgress = function (url, loaded, total) {
        document.getElementById("result_download").innerHTML = `Loading ${  loaded  } / ${  total}`;
    };
}

/**
 * Finalize scene load: camera focus, hierarchy setup, etc.
 */
function finalizeSceneLoad() {
    if (!VRODOS.editor.envir || VRODOS.editor.envir.sceneLoadFinalized) return;

    VRODOS.editor.envir.sceneLoadFinalized = true;
    VRODOS.editor.envir.isSceneLoading = false;

    // Detach controls on load
    VRODOS.editor.transform_controls.detach();
    if (typeof removeAllCelOutlines === 'function') removeAllCelOutlines();
    if (typeof hideObjectControlsPanel === 'function') hideObjectControlsPanel();

    if (typeof findSceneDimensions === 'function') {
        findSceneDimensions();
        VRODOS.editor.envir.fitCameraToSceneLimits();
    }

    // Focus on Actor/Player
    (function focusOnPlayer() {
        let playerObject = null;
        VRODOS.editor.envir.scene.traverse(obj => {
            if (!playerObject && (obj.category_name === 'pawn' || obj.name?.includes('Pawn'))) {
                playerObject = obj;
            }
        });
        if (!playerObject) {
            playerObject = VRODOS.editor.envir.scene.getObjectByName('avatarCamera') || VRODOS.editor.envir.scene.getObjectByName('Camera3Dmodel');
        }

        if (playerObject) {
            VRODOS.editor.envir.orbitControls.target.copy(playerObject.position);
            VRODOS.editor.envir.cameraOrbit.zoom = 800;
            VRODOS.editor.envir.cameraOrbit.updateProjectionMatrix();
            VRODOS.editor.envir.orbitControls.update();
        }
    })();

    if (typeof removeHierarchySkeleton === 'function') removeHierarchySkeleton();
    setHierarchyViewer();

    // Avoid culling and update lights
    VRODOS.editor.envir.scene.traverse((obj) => {
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
    if (VRODOS.editor.isPaused) return;

    VRODOS.editor.id_animation_frame = requestAnimationFrame(animate);

    const curr_camera = (typeof VRODOS.editor.avatarControlsEnabled !== 'undefined' && VRODOS.editor.avatarControlsEnabled) ?
        (VRODOS.editor.envir.thirdPersonView ? VRODOS.editor.envir.cameraThirdPerson : VRODOS.editor.envir.cameraAvatar) : VRODOS.editor.envir.cameraOrbit;

    if (VRODOS.editor.envir.labelRenderer) {
        VRODOS.editor.envir.labelRenderer.render(VRODOS.editor.envir.scene, curr_camera);
    }

    if (VRODOS.editor.envir.flagPlayAnimation && VRODOS.editor.envir.animationMixers.length > 0) {
        const new_time = VRODOS.editor.envir.clock.getDelta();
        for (let i = 0; i < VRODOS.editor.envir.animationMixers.length; i++) {
            VRODOS.editor.envir.animationMixers[i].update(new_time);
        }
    }

    if (VRODOS.editor.envir.isComposerOn && VRODOS.editor.envir.composer) {
        VRODOS.editor.envir.composer.render();
    }

    VRODOS.editor.envir.orbitControls.update();
    if (typeof window.updatePointerLockControls === 'function') {
        window.updatePointerLockControls();
    }
    if (typeof VRODOS.editor.envir.updateCompassUI === 'function') {
        VRODOS.editor.envir.updateCompassUI();
    }
}

/**
 * Interface toggle for environment textures
 */
window.toggleEnvTexture = (el) => {
    const btn = document.getElementById("env_texture-change-btn");
    if (btn) btn.classList.toggle('toggle-active');
    el.checked = !el.checked;
    VRODOS.editor.envir.scene.environment = !el.checked ? null : VRODOS.editor.envir.maintexture;
};

// INITIALIZE ON DOM CONTENT LOADED
document.addEventListener('DOMContentLoaded', initVrodosEditor);
