"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.api = VRODOS.api || {};
VRODOS.config = VRODOS.config || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.loader = VRODOS.loader || {};
VRODOS.ui = VRODOS.ui || {};

const VRODOS_LOADER_DENSE_RESOURCE_THRESHOLD = 75;
const VRODOS_LOADER_DENSE_CONCURRENCY_CAP = 2;

function vrodosLoaderGetSceneSettingsSchema() {
    return (VRODOS.config && VRODOS.config.SCENE_SETTINGS_SCHEMA)
        ? VRODOS.config.SCENE_SETTINGS_SCHEMA
        : {};
}

VRODOS.loader.getSceneResourceCount = function(resources3D) {
    return resources3D ? Object.keys(resources3D).length : 0;
};

VRODOS.loader.isSceneResourceMetadataName = function(name) {
    const schema = vrodosLoaderGetSceneSettingsSchema();
    return Object.prototype.hasOwnProperty.call(schema, name) ||
        name === 'SceneSettings' ||
        name === 'cameraCoords' ||
        name === 'enableEnvironmentTexture';
};

VRODOS.loader.isGlbSceneResource = function(name, resource, categorySlug) {
    if (VRODOS.loader.isSceneResourceMetadataName(name)) {
        return false;
    }

    const normalizedCategory = categorySlug || VRODOS.utils.normalizeSceneAssetCategory(resource && resource.category_slug);
    if (normalizedCategory === 'video') {
        return true;
    }

    return Boolean(resource && resource.glb_id !== '' && resource.glb_id !== undefined);
};

VRODOS.loader.getSceneResourceStats = function(resources3D) {
    const stats = {
        resourceCount: 0,
        glbCount: 0
    };

    if (!resources3D) {
        return stats;
    }

    for (const name in resources3D) {
        if (!Object.prototype.hasOwnProperty.call(resources3D, name)) continue;
        const resource = resources3D[name];

        if (VRODOS.loader.isSceneResourceMetadataName(name)) {
            continue;
        }

        stats.resourceCount++;
        if (VRODOS.loader.isGlbSceneResource(name, resource)) {
            stats.glbCount++;
        }
    }

    return stats;
};

VRODOS.loader.applyResourceLoadProfile = function(resources3D) {
    const resourceStats = VRODOS.loader.getSceneResourceStats(resources3D);
    const resourceCount = resourceStats.resourceCount;
    const loop = VRODOS.editor && VRODOS.editor.renderLoop ? VRODOS.editor.renderLoop : {};
    const isDenseScene = resourceCount >= VRODOS_LOADER_DENSE_RESOURCE_THRESHOLD;
    const baseConcurrency = Math.max(1, Number(loop.loaderConcurrency || 3));

    if (isDenseScene && VRODOS.editor && VRODOS.editor.renderLoop) {
        VRODOS.editor.renderLoop.targetFps = 30;
        VRODOS.editor.renderLoop.pixelRatioCap = 1;
        VRODOS.editor.renderLoop.labelFrameStride = 3;
    }

    return {
        resourceCount,
        isDenseScene,
        loadConcurrency: isDenseScene
            ? Math.min(VRODOS_LOADER_DENSE_CONCURRENCY_CAP, baseConcurrency)
            : baseConcurrency
    };
};

VRODOS.loader.syncSceneSettingsResource = function(settings) {
    const schema = vrodosLoaderGetSceneSettingsSchema();
    if (!settings) return;

    for (const key in settings) {
        if (!Object.prototype.hasOwnProperty.call(settings, key)) continue;
        if (!Object.prototype.hasOwnProperty.call(schema, key)) continue;
        VRODOS.api.syncSceneSetting(key, settings[key], { "SceneSettings": settings });
    }

    if (typeof VRODOS.ui.syncCompileDialogFromSceneSettings === 'function') {
        VRODOS.ui.syncCompileDialogFromSceneSettings();
    }
};

VRODOS.loader.applyCameraCoordsResource = function(resource) {
    const envir = VRODOS.editor && VRODOS.editor.envir ? VRODOS.editor.envir : null;
    if (!resource || !envir || typeof envir.applyDirectorTransform !== 'function') return;

    envir.applyDirectorTransform(resource.position, resource.rotation);
};

VRODOS.loader.isLightOrPawnResource = function(resource) {
    const categoryName = resource && resource.category_name;
    return VRODOS.utils.isSceneLightOrPawnCategory(categoryName);
};

VRODOS.loader.handleResourceMetadata = function(name, resource, resources3D) {
    const schema = vrodosLoaderGetSceneSettingsSchema();

    if (Object.prototype.hasOwnProperty.call(schema, name)) {
        VRODOS.api.syncSceneSetting(name, resource, resources3D);
        return true;
    }

    if (name === "SceneSettings") {
        VRODOS.loader.syncSceneSettingsResource(resource);
        return true;
    }

    if (name === 'cameraCoords') {
        VRODOS.loader.applyCameraCoordsResource(resource);
        return true;
    }

    if (name === 'enableEnvironmentTexture') {
        return true;
    }

    return false;
};
