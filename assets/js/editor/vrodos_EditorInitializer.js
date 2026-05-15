/**
 * VRodos Editor Initializer (Phase 2)
 *
 * This module extracts and consolidates the editor's startup logic,
 * mapping localized PHP data to JavaScript state.
 */

// 1. Map localized data to the unified namespace
window.VRODOS = window.VRODOS || { editor: {}, ui: { transform: {} }, utils: {}, api: {}, data: {} };
VRODOS.editorApp = VRODOS.editorApp || {};
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

VRODOS.api.deferEditorStartupTask = function(callback) {
    if (typeof callback !== 'function') {
        return;
    }

    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(callback, { timeout: 120 });
        return;
    }

    window.requestAnimationFrame(() => {
        window.setTimeout(callback, 0);
    });
};

VRODOS.api.setSceneLoadingProgressText = function(text, options) {
    const opts = options || {};
    const progressEl = document.getElementById("result_download");
    if (!progressEl) {
        return;
    }

    const progressWrapper = document.getElementById("progressWrapper");
    if (progressWrapper && opts.visible !== false) {
        progressWrapper.style.visibility = "visible";
    }

    const loop = VRODOS.editor.renderLoop || {};
    const now = window.performance && typeof window.performance.now === 'function'
        ? window.performance.now()
        : Date.now();
    const throttleMs = Math.max(0, Number(loop.loadingProgressThrottleMs || 0));
    const isSceneLoading = VRODOS.editor.envir && VRODOS.editor.envir.isSceneLoading;

    const applyProgressText = (value) => {
        progressEl.textContent = String(value || '');
        loop.lastLoadingProgressAt = window.performance && typeof window.performance.now === 'function'
            ? window.performance.now()
            : Date.now();
    };

    if (opts.immediate || !isSceneLoading || throttleMs <= 0) {
        if (loop.loadingProgressTimer) {
            window.clearTimeout(loop.loadingProgressTimer);
            loop.loadingProgressTimer = null;
        }
        loop.pendingLoadingProgressText = '';
        applyProgressText(text);
        return;
    }

    const elapsed = now - Number(loop.lastLoadingProgressAt || 0);
    loop.pendingLoadingProgressText = String(text || '');

    if (elapsed >= throttleMs) {
        const pendingText = loop.pendingLoadingProgressText;
        loop.pendingLoadingProgressText = '';
        applyProgressText(pendingText);
        return;
    }

    if (!loop.loadingProgressTimer) {
        loop.loadingProgressTimer = window.setTimeout(() => {
            loop.loadingProgressTimer = null;
            const pendingText = loop.pendingLoadingProgressText;
            loop.pendingLoadingProgressText = '';
            applyProgressText(pendingText);
        }, Math.max(16, throttleMs - elapsed));
    }
};

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
    if (VRODOS.editor.transforms && typeof VRODOS.editor.transforms.prepareHelper === 'function') {
        VRODOS.editor.transforms.prepareHelper(VRODOS.editor.transform_controls_helper);
    }
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

    // Add controls to scene
    VRODOS.editor.envir.scene.add(VRODOS.editor.transform_controls_helper);
    document.getElementById("compileGameBtn").disabled = true;

    // Progress UI
    document.getElementById("progress").style.display = "block";
    VRODOS.api.setSceneLoadingProgressText("Loading", { immediate: true });

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

    VRODOS.api.deferEditorStartupTask(() => {
        // Initial hierarchy
        VRODOS.ui.setHierarchyViewer();

        // Fetch available assets
        if (typeof VRODOS.api.fetchListAvailableAssets === 'function') {
            VRODOS.api.fetchListAvailableAssets(VRODOS.config.isAdmin, VRODOS.data.projectSlug, VRODOS.data.urlforAssetEdit, VRODOS.data.projectId);
        }
        if (typeof VRODOS.ui.initHierarchyViewerEvents === 'function') {
            VRODOS.ui.initHierarchyViewerEvents();
        }

        // 3. Load 3D Objects
        VRODOS.api.loadEditorSceneResources(VRODOS.data.scene_data, {
            assetResources: VRODOS.data.scene_data.objects,
            reason: 'initial-scene-load'
        });
    });
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

VRODOS.editorApp.start = function() {
    if (VRODOS.editorApp.isStarted) {
        return true;
    }

    if (!document.getElementById('vr_editor_main_div')) {
        return false;
    }

    VRODOS.editorApp.isStarted = true;
    try {
        initVrodosEditor();
        return true;
    } catch (error) {
        VRODOS.editorApp.isStarted = false;
        throw error;
    }
};

// INITIALIZE ON DOM CONTENT LOADED
document.addEventListener('DOMContentLoaded', () => {
    VRODOS.editorApp.start();
});
