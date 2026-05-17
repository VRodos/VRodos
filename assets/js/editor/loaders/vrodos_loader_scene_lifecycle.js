"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.api = VRODOS.api || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.loader = VRODOS.loader || {};
VRODOS.ui = VRODOS.ui || {};
VRODOS.utils = VRODOS.utils || {};

/**
 * Preparation logic before assets start loading.
 */
VRODOS.api.clearSceneLoadingProgressTimers = function() {
    const loop = VRODOS.editor.renderLoop || {};
    if (loop.loadingRenderTimer) {
        window.clearTimeout(loop.loadingRenderTimer);
        loop.loadingRenderTimer = null;
    }
    if (loop.loadingProgressTimer) {
        window.clearTimeout(loop.loadingProgressTimer);
        loop.loadingProgressTimer = null;
    }
    loop.pendingLoadingProgressText = '';
};

VRODOS.api.showSceneLoadingProgress = function(text, options) {
    const opts = options || {};
    const progress = document.getElementById("progress");
    if (progress) {
        progress.style.display = "block";
    }

    const progressWrapper = document.getElementById("progressWrapper");
    if (progressWrapper && opts.visible !== false) {
        progressWrapper.style.visibility = "visible";
    }

    if (typeof VRODOS.api.setSceneLoadingProgressText === 'function') {
        VRODOS.api.setSceneLoadingProgressText(text || "Loading", opts);
    }
};

VRODOS.api.hideSceneLoadingProgress = function(options) {
    const opts = options || {};
    if (opts.clearTimers !== false) {
        VRODOS.api.clearSceneLoadingProgressTimers();
    }

    const progressWrapper = document.getElementById("progressWrapper");
    if (progressWrapper) {
        progressWrapper.style.visibility = "hidden";
    }
};

VRODOS.api.configureSceneLoadingManager = function(manager, options) {
    if (!manager) {
        return null;
    }

    const opts = options || {};
    manager.onProgress = typeof opts.onProgress === 'function'
        ? opts.onProgress
        : function (_url, loaded, total) {
            VRODOS.api.setSceneLoadingProgressText(`Loading ${loaded} / ${total}`);
        };

    if (typeof opts.onLoad === 'function') {
        manager.onLoad = opts.onLoad;
    }

    return manager;
};

VRODOS.api.prepareSceneLoadManager = function() {
    VRODOS.editor.envir.sceneLoadFinalized = false;
    VRODOS.api.configureSceneLoadingManager(VRODOS.editor.manager);
};

VRODOS.api.getSceneAssetResources = function(resources3D) {
    if (resources3D && resources3D.objects && typeof resources3D.objects === 'object') {
        return resources3D.objects;
    }

    return resources3D || {};
};

VRODOS.api.clearSceneForReload = function() {
    const envir = VRODOS.editor.envir;
    if (!envir || !envir.scene) return;

    if (VRODOS.editor.selection && typeof VRODOS.editor.selection.clear === 'function') {
        VRODOS.editor.selection.clear({ source: 'scene-reload', hidePanel: false });
    }

    const preserveNames = new Set([
        'myAxisHelper',
        'myGridHelper',
        'myTransformControls',
        'vrodosGizmoProxy',
        'avatarCamera',
        'avatarControls',
        'orbitCamera'
    ]);

    for (let i = envir.scene.children.length - 1; i >= 0; i--) {
        const child = envir.scene.children[i];
        if (!child) continue;
        if (preserveNames.has(child.name) || child === VRODOS.editor.transform_controls_helper) {
            continue;
        }

        envir.scene.remove(child);
        if (typeof VRODOS.utils.disposeObject === 'function') {
            VRODOS.utils.disposeObject(child);
        }
    }

    if (typeof envir.clearDirectorInternalHelpers === 'function') {
        envir.clearDirectorInternalHelpers();
    }
    if (VRODOS.editor.sceneRegistry && typeof VRODOS.editor.sceneRegistry.clear === 'function') {
        VRODOS.editor.sceneRegistry.clear();
    }
    if (envir.selectableMeshes) {
        envir.selectableMeshes.clear();
        envir.selectableMeshesArray = [];
        envir.selectableMeshesDirty = true;
    }
};

VRODOS.api.loadEditorSceneResources = function(resources3D, options) {
    const opts = options || {};
    const envir = VRODOS.editor.envir;
    if (!envir) return Promise.resolve([]);

    if (VRODOS.editor.diagnostics && typeof VRODOS.editor.diagnostics.markLoadStart === 'function') {
        VRODOS.editor.diagnostics.markLoadStart(opts.reason || 'scene-load');
    }

    envir.isSceneLoading = true;
    envir.sceneLoadFinalized = false;
    VRODOS.api.prepareSceneLoadManager();

    const assetResources = opts.assetResources || VRODOS.api.getSceneAssetResources(resources3D);
    if (typeof VRODOS.utils.dedupeSceneDataObjects === 'function') {
        VRODOS.utils.dedupeSceneDataObjects(assetResources, { reason: opts.reason || 'scene-load' });
    }

    const lightsPawnLoader = new VRODOS.loader.LightsPawnLoader();
    const lightsLoadPromise = lightsPawnLoader.load(resources3D, VRODOS.data.pluginPath, VRODOS.editor.manager);

    const loaderMulti = new VRODOS.loader.LoaderMulti();
    const assetsLoadPromise = loaderMulti.load(VRODOS.editor.manager, assetResources, VRODOS.data.pluginPath);

    return Promise.allSettled([lightsLoadPromise, assetsLoadPromise]).then((result) => {
        if (VRODOS.editor.diagnostics && typeof VRODOS.editor.diagnostics.markLoadEnd === 'function') {
            VRODOS.editor.diagnostics.markLoadEnd('settled');
        }
        if (opts.finalize !== false) {
            VRODOS.api.finalizeSceneLoad();
        }
        return result;
    });
};

VRODOS.api.reloadSceneFromJson = function(sceneJson) {
    const uploadBase = VRODOS.data.uploadDir || '';
    const resources3D = new VRODOS.importer.SceneImporter().parse(sceneJson, uploadBase);

    VRODOS.api.clearSceneForReload();
    if (typeof VRODOS.ui.setHierarchyViewer === 'function') {
        VRODOS.ui.setHierarchyViewer();
    }

    return VRODOS.api.loadEditorSceneResources(resources3D, {
        assetResources: resources3D,
        reason: 'scene-json-reload'
    });
};

/**
 * Finalize scene load: camera focus, hierarchy setup, etc.
 */
VRODOS.api.finalizeSceneLoad = function() {
    if (!VRODOS.editor.envir || VRODOS.editor.envir.sceneLoadFinalized) return;

    VRODOS.api.clearSceneLoadingProgressTimers();

    VRODOS.editor.envir.sceneLoadFinalized = true;
    VRODOS.editor.envir.isSceneLoading = false;

    VRODOS.editor.sceneRegistry.rebuild(VRODOS.editor.envir.scene);

    // Detach controls on load.
    VRODOS.editor.selection.clear({ source: 'scene-load-finalized' });
    if (typeof VRODOS.ui.removeAllCelOutlines === 'function') VRODOS.ui.removeAllCelOutlines();
    if (typeof VRODOS.ui.hideObjectControlsPanel === 'function') VRODOS.ui.hideObjectControlsPanel();

    if (typeof VRODOS.utils.findSceneDimensions === 'function') {
        VRODOS.utils.findSceneDimensions();
        VRODOS.editor.envir.fitCameraToSceneLimits();
    }

    let playerObject = null;
    const registry = VRODOS.editor.sceneRegistry;
    const roots = typeof VRODOS.utils.getSelectableEditorSceneRoots === 'function'
        ? VRODOS.utils.getSelectableEditorSceneRoots(VRODOS.editor.envir.scene)
        : registry.getSelectableRoots();

    if (roots.length > 0) {
        for (let i = 0; i < roots.length; i++) {
            const obj = roots[i];
            if (obj.category_name === 'pawn' || obj.name?.includes('Pawn')) {
                playerObject = obj;
                break;
            }
        }
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

    if (typeof VRODOS.ui.removeHierarchySkeleton === 'function') VRODOS.ui.removeHierarchySkeleton();
    VRODOS.ui.setHierarchyViewer();

    if (typeof VRODOS.editor.envir.applyEditorPerformanceProfile === 'function') {
        VRODOS.editor.envir.applyEditorPerformanceProfile(true);
    }

    const sceneChildren = VRODOS.editor.envir.scene && Array.isArray(VRODOS.editor.envir.scene.children)
        ? VRODOS.editor.envir.scene.children
        : [];
    sceneChildren.forEach((obj) => {
        if (obj && obj.light !== undefined && typeof obj.update === 'function') {
            obj.update();
        }
    });

    VRODOS.api.hideSceneLoadingProgress({ clearTimers: false });

    const compileButton = document.getElementById("compileGameBtn");
    if (compileButton) compileButton.disabled = false;

    VRODOS.editor.requestRender('scene-load-finalized');
};
