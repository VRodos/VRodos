/**
 * VRodos Editor Initializer (Phase 2)
 *
 * This module extracts and consolidates the editor's startup logic,
 * mapping localized PHP data to JavaScript state.
 */

// 1. Map localized data to the unified namespace
window.VRODOS = window.VRODOS || { editor: {}, ui: { transform: {} }, utils: {}, api: {}, data: {} };
if (typeof VRODOS.syncLocalizedData === 'function') {
    VRODOS.syncLocalizedData();
}
VRODOS.data = Object.assign({}, window.VRODOS.data || {}, VRODOS.data || {});
VRODOS.data.paths = VRODOS.data.paths || {};

// Map essential config to top level for convenience in AJAX handlers
VRODOS.config = Object.assign(VRODOS.config || {}, {
    ajax_url: VRODOS.data.ajax_url || '',
    isAdmin: VRODOS.data.isAdmin || 'front',
    plugin_url: VRODOS.data.pluginPath || '',
    current_user_id: VRODOS.data.current_user_id || -1,
    projectId: VRODOS.data.projectId || '',
    sceneId: VRODOS.data.sceneId || VRODOS.data.scene_id || '',
    slug: VRODOS.data.projectSlug || ''
});

VRODOS.editor.isPaused = VRODOS.data.isPaused || false;
VRODOS.editor.showPawnPositions = VRODOS.data.showPawnPositions || 'false';


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
            if (this._root) {
                this._root.visible = false;
            }
            return this;
        }

        const result = originalAttach(object);
        if (this._root) {
            this._root.visible = true;
            this._root.updateMatrixWorld(true);
        }
        return result;
    };

    controls._vrodosAttachPatched = true;
}

function vrodosPrepareTransformControlsHelper(helper) {
    if (!helper || typeof helper.traverse !== 'function') {
        return;
    }

    helper.frustumCulled = false;
    helper.renderOrder = Math.max(helper.renderOrder || 0, 10000);
    helper.traverse((child) => {
        child.frustumCulled = false;
        child.renderOrder = Math.max(child.renderOrder || 0, 10000);
    });
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
    VRODOS.editor.envir = new VRODOS.editor.Environmentals(mainDiv);
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
    VRODOS.editor.transform_controls_helper.vrodos_internal_helper = true;
    vrodosPrepareTransformControlsHelper(VRODOS.editor.transform_controls_helper);
    vrodosPatchTransformControlsAttach(VRODOS.editor.transform_controls, VRODOS.editor.envir.scene);
    VRODOS.editor.transforms.bindControls();
    VRODOS.editor.firstPersonBlockerBtn = document.getElementById('firstPersonBlockerBtn');
    window.firstPersonBlockerBtn = VRODOS.editor.firstPersonBlockerBtn;

    // Block saves before any loader runs
    VRODOS.editor.envir.isSceneLoading = true;
    VRODOS.editor.envir.sceneLoadFinalized = false;

    // Prepare Load VRODOS.editor.Manager
    VRODOS.api.prepareSceneLoadManager();

    // UI & GUI Setup
    const guiContainer = document.getElementById('numerical_gui-container');
    if (guiContainer && VRODOS.ui.controlInterface) {
        guiContainer.appendChild(VRODOS.ui.controlInterface.domElement);
    }

    VRODOS.ui.hideObjectPropertiesPanels();
    VRODOS.ui.controllerDatGuiOnChange();

    // 2. Initialize Scene State using the Schema (Phase 1 Refactoring Win)
    // We merge all possible sources to handle legacy transitions correctly
    const sceneSettings = Object.assign({},
        VRODOS.data.scene_data,
        VRODOS.data.scene_data.SceneSettings || {},
        VRODOS.data.scene_data.metadata || {}
    );

    if (!['walk', 'walkable', 'fly'].includes(sceneSettings.aframeNavigationMode)) {
        sceneSettings.aframeNavigationMode = sceneSettings.aframeCollisionMode === 'off' ? 'walk' : 'walkable';
    }

    // First pass: General sync using the schema
    for (const [key, schemaInfo] of Object.entries(VRODOS.config.SCENE_SETTINGS_SCHEMA)) {
        if (sceneSettings[key] !== undefined) {
             VRODOS.api.syncSceneSetting(key, sceneSettings[key]);
        } else {
             // Apply defaults if missing
             VRODOS.api.syncSceneSetting(key, schemaInfo.default);
        }
    }

    // Secondary pass: Background specific legacy logic
    syncBackgroundInitialState(sceneSettings);

    // 3. Load 3D Objects
    const lightsPawnLoader = new VRODOS.loader.LightsPawnLoader();
    const lightsLoadPromise = lightsPawnLoader.load(VRODOS.data.scene_data, VRODOS.data.pluginPath, VRODOS.editor.manager);

    const loaderMulti = new VRODOS.loader.LoaderMulti();
    const assetsLoadPromise = loaderMulti.load(VRODOS.editor.manager, VRODOS.data.scene_data.objects, VRODOS.data.pluginPath);

    // Initial hierarchy
    VRODOS.ui.setHierarchyViewer();

    // Fetch available assets
    if (typeof VRODOS.api.fetchListAvailableAssets === 'function') {
        VRODOS.api.fetchListAvailableAssets(VRODOS.config.isAdmin, VRODOS.data.projectSlug, VRODOS.data.urlforAssetEdit, VRODOS.data.projectId);
    }
    if (typeof VRODOS.ui.initHierarchyViewerEvents === 'function') {
        VRODOS.ui.initHierarchyViewerEvents();
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
        VRODOS.api.finalizeSceneLoad();
    });

    VRODOS.api.initPointerLock();
    VRODOS.editor.requestRender('initial-load');
    VRODOS.ui.loadButtonActions();

    // Prevent body scroll
    document.getElementsByTagName("html")[0].style.overflow = "hidden";

    // Bind event listeners for background settings
    bindBackgroundUIEvents();

    // Initial compile dialog sync (Phase 2 fix)
    if (typeof VRODOS.ui.syncCompileDialogFromSceneSettings === 'function') {
        VRODOS.ui.syncCompileDialogFromSceneSettings();
    }

    // Scene Type
    if (VRODOS.data.sceneType) {
        VRODOS.editor.envir.sceneType = VRODOS.data.sceneType;
    }
}

/**
 * Update the translation and rotation input texts from transform controls
 * (Restored from legacy template logic)
 */
VRODOS.editor.updatePositionsAndControls = function() {
    const selectedObject = VRODOS.editor.transforms.getRealObject();

    if (!selectedObject || !VRODOS.ui.controlInterface) return;
    if ((window.vrodosGuiKeyboardEditing || 0) > 0) return;

    if (VRODOS.editor.transforms.isDragging() &&
        typeof VRODOS.editor.transforms.syncFromControls === 'function') {
        VRODOS.editor.transforms.syncFromControls();
    }

    VRODOS.editor.transforms.syncGui(selectedObject);
};

/**
 * Handle background UI initialization that requires specific logic
 */
function syncBackgroundInitialState(settings) {
    const selOption = parseInt(settings.backgroundStyleOption, 10);
    if (isNaN(selOption)) return;

    if (typeof VRODOS.ui.syncBackgroundStyleDescription === 'function') {
        VRODOS.ui.syncBackgroundStyleDescription(selOption);
    }

    // Call bcgRadioSelect (from vrodos_scripts.js) to fix UI rows and states
    const radioIdMap = { 0: 'sceneHorizon', 1: 'sceneColorRadio', 2: 'sceneSky', 3: 'sceneCustomImage', 4: 'sceneNoBackground' };
    const radioEl = document.getElementById(radioIdMap[selOption]);
    if (radioEl) {
        radioEl.checked = true;
        if (VRODOS.ui && typeof VRODOS.ui.bcgRadioSelect === 'function') {
            // We pass the radio element to trigger the logic but we DON'T want to VRODOS.api.saveChanges on init
            // bcgRadioSelect calls VRODOS.api.saveChanges internally, so we might need to block it briefly or refactor
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
            VRODOS.ui.handleBackgroundPresetChange(this);
        });
        preset_sel.dataset.vrodosChangeBound = 'true';
    }
    if (preset_ground_toggle && !preset_ground_toggle.dataset.vrodosChangeBound) {
        preset_ground_toggle.addEventListener('change', function () {
            VRODOS.ui.handleBackgroundPresetGroundToggle(this);
        });
        preset_ground_toggle.dataset.vrodosChangeBound = 'true';
    }
}

/**
 * Preparation logic before assets start loading
 */
VRODOS.api.prepareSceneLoadManager = function() {
    VRODOS.editor.envir.sceneLoadFinalized = false;
    VRODOS.editor.manager.onProgress = function (url, loaded, total) {
        document.getElementById("result_download").innerHTML = `Loading ${  loaded  } / ${  total}`;
    };
}

/**
 * Finalize scene load: camera focus, hierarchy setup, etc.
 */
VRODOS.api.finalizeSceneLoad = function() {
    if (!VRODOS.editor.envir || VRODOS.editor.envir.sceneLoadFinalized) return;

    VRODOS.editor.envir.sceneLoadFinalized = true;
    VRODOS.editor.envir.isSceneLoading = false;

    VRODOS.editor.sceneRegistry.rebuild(VRODOS.editor.envir.scene);

    // Detach controls on load
    VRODOS.editor.selection.clear({ source: 'scene-load-finalized' });
    if (typeof VRODOS.ui.removeAllCelOutlines === 'function') VRODOS.ui.removeAllCelOutlines();
    if (typeof VRODOS.ui.hideObjectControlsPanel === 'function') VRODOS.ui.hideObjectControlsPanel();

    if (typeof VRODOS.utils.findSceneDimensions === 'function') {
        VRODOS.utils.findSceneDimensions();
        VRODOS.editor.envir.fitCameraToSceneLimits();
    }

    // Focus on Actor/Player
    (function focusOnPlayer() {
        let playerObject = null;
        const registry = VRODOS.editor.sceneRegistry;
        const roots = registry.getSelectableRoots();

        if (roots.length > 0) {
            for (let i = 0; i < roots.length; i++) {
                const obj = roots[i];
                if (obj.category_name === 'pawn' || obj.name?.includes('Pawn')) {
                    playerObject = obj;
                    break;
                }
            }
        } else {
            VRODOS.editor.envir.scene.traverse(obj => {
                if (!playerObject && (obj.category_name === 'pawn' || obj.name?.includes('Pawn'))) {
                    playerObject = obj;
                }
            });
        }
        if (!playerObject) {
            playerObject = registry.getByName('avatarCamera') || registry.getByName('Camera3Dmodel');
        }
        if (!playerObject) {
            playerObject = (typeof VRODOS.editor.envir.getDirectorObject === 'function' ? VRODOS.editor.envir.getDirectorObject() : null) ||
                (typeof VRODOS.editor.envir.getDirectorVisualObject === 'function' ? VRODOS.editor.envir.getDirectorVisualObject() : null);
        }

        if (playerObject) {
            VRODOS.editor.envir.orbitControls.target.copy(playerObject.position);
            VRODOS.editor.envir.cameraOrbit.zoom = 800;
            VRODOS.editor.envir.cameraOrbit.updateProjectionMatrix();
            VRODOS.editor.envir.orbitControls.update();
        }
    })();

    if (typeof VRODOS.ui.removeHierarchySkeleton === 'function') VRODOS.ui.removeHierarchySkeleton();
    VRODOS.ui.setHierarchyViewer();

    if (typeof VRODOS.editor.envir.applyEditorPerformanceProfile === 'function') {
        VRODOS.editor.envir.applyEditorPerformanceProfile(true);
    }

    // Update light helpers without disabling Three.js frustum culling on every mesh.
    VRODOS.editor.envir.scene.traverse((obj) => {
        if (obj.light != undefined && typeof obj.update === 'function') {
            obj.update();
        }
    });

    document.getElementById("progressWrapper").style.visibility = "hidden";
    document.getElementById("compileGameBtn").disabled = false;
    VRODOS.editor.requestRender('scene-load-finalized');
}

/**
 * Guarded editor render loop. Existing callers still use animate(), but it now
 * requests work from a single loop instead of opening duplicate RAF loops.
 */
VRODOS.editor.getActiveCamera = function() {
    const curr_camera = (typeof VRODOS.editor.avatarControlsEnabled !== 'undefined' && VRODOS.editor.avatarControlsEnabled) ?
        (VRODOS.editor.envir.thirdPersonView ? VRODOS.editor.envir.cameraThirdPerson : VRODOS.editor.envir.cameraAvatar) : VRODOS.editor.envir.cameraOrbit;

    return curr_camera;
};

VRODOS.editor.shouldRenderContinuously = function() {
    const envir = VRODOS.editor.envir;
    if (!envir) return false;

    if (envir.isSceneLoading) return true;
    if (VRODOS.editor.avatarControlsEnabled) return true;
    if (VRODOS.editor.transforms && VRODOS.editor.transforms.isDragging()) return true;
    if (envir.orbitControls && envir.orbitControls.autoRotate) return true;
    if (envir.flagPlayAnimation && envir.animationMixers && envir.animationMixers.length > 0) return true;

    return false;
};

VRODOS.editor.renderFrame = function(timestamp, isContinuous) {
    const envir = VRODOS.editor.envir;
    if (!envir) return;

    const curr_camera = VRODOS.editor.getActiveCamera();

    if (!VRODOS.editor.avatarControlsEnabled &&
        envir.orbitControls &&
        (envir.orbitControls.enableDamping || envir.orbitControls.autoRotate)) {
        envir.orbitControls.update();
    }

    if (VRODOS.editor.avatarControlsEnabled && typeof VRODOS.api.updatePointerLockControls === 'function') {
        VRODOS.api.updatePointerLockControls();
    }

    VRODOS.editor.transforms.setCamera(curr_camera);

    if (VRODOS.editor.envir.flagPlayAnimation && VRODOS.editor.envir.animationMixers.length > 0) {
        const new_time = VRODOS.editor.envir.clock.getDelta();
        for (let i = 0; i < VRODOS.editor.envir.animationMixers.length; i++) {
            VRODOS.editor.envir.animationMixers[i].update(new_time);
        }
    }

    if (typeof VRODOS.editor.envir.updateDirectorGroundGuide === 'function') {
        VRODOS.editor.envir.updateDirectorGroundGuide();
    }

    if (typeof envir.renderEditorFrame === 'function') {
        envir.renderEditorFrame(curr_camera);
    } else if (envir.renderer) {
        envir.renderer.render(envir.scene, curr_camera);
    }

    const loop = VRODOS.editor.renderLoop || {};
    const labelStride = Math.max(1, Number(loop.labelFrameStride || 1));
    if (envir.labelRenderer && (!isContinuous || labelStride <= 1 || (loop.frameIndex % labelStride) === 0)) {
        envir.labelRenderer.render(envir.scene, curr_camera);
    }

    if (typeof VRODOS.editor.envir.updateCompassUI === 'function') {
        VRODOS.editor.envir.updateCompassUI();
    }
};

VRODOS.editor.startRenderLoop = function() {
    const loop = VRODOS.editor.renderLoop;
    if (!loop || loop.isRunning || VRODOS.editor.isPaused || !VRODOS.editor.envir) {
        return;
    }

    loop.isRunning = true;

    const step = (timestamp) => {
        if (VRODOS.editor.isPaused || !VRODOS.editor.envir) {
            loop.isRunning = false;
            VRODOS.editor.id_animation_frame = null;
            return;
        }

        const isContinuous = VRODOS.editor.shouldRenderContinuously();
        if (!loop.needsRender && !isContinuous) {
            loop.isRunning = false;
            VRODOS.editor.id_animation_frame = null;
            return;
        }

        const targetFps = Math.max(1, Number(loop.targetFps || 45));
        const minFrameMs = 1000 / targetFps;
        if (isContinuous && loop.lastFrameAt && (timestamp - loop.lastFrameAt) < minFrameMs) {
            VRODOS.editor.id_animation_frame = requestAnimationFrame(step);
            return;
        }

        loop.lastFrameAt = timestamp;
        loop.needsRender = false;
        loop.frameIndex = (loop.frameIndex || 0) + 1;
        VRODOS.editor.renderFrame(timestamp, isContinuous);

        if (isContinuous || loop.needsRender) {
            VRODOS.editor.id_animation_frame = requestAnimationFrame(step);
            return;
        }

        loop.isRunning = false;
        VRODOS.editor.id_animation_frame = null;
    };

    VRODOS.editor.id_animation_frame = requestAnimationFrame(step);
};

VRODOS.editor.stopRenderLoop = function() {
    const loop = VRODOS.editor.renderLoop;
    if (VRODOS.editor.id_animation_frame) {
        cancelAnimationFrame(VRODOS.editor.id_animation_frame);
    }
    VRODOS.editor.id_animation_frame = null;
    if (loop) {
        loop.isRunning = false;
        loop.needsRender = false;
    }
};

VRODOS.editor.requestRender = function() {
    const loop = VRODOS.editor.renderLoop;
    if (!loop || VRODOS.editor.isPaused) {
        return;
    }

    loop.needsRender = true;
    VRODOS.editor.startRenderLoop();
};

VRODOS.editor.animate = function animate() {
    VRODOS.editor.requestRender('legacy-animate');
};

// INITIALIZE ON DOM CONTENT LOADED
document.addEventListener('DOMContentLoaded', initVrodosEditor);
