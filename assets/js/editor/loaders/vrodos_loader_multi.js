"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.loader = VRODOS.loader || {};

VRODOS.loader.LoaderMulti = class {

    async load(manager, resources3D, _pluginPath) {

        const loader = typeof VRODOS.loader.createGltfLoader === 'function'
            ? VRODOS.loader.createGltfLoader(manager, { renderer: VRODOS.editor.envir && VRODOS.editor.envir.renderer })
            : new THREE.GLTFLoader(manager);
        const pendingLoads = [];
        const glbLoadTasks = [];
        const modelBaseUrl = VRODOS.utils.loaderResolveBaseUrl(VRODOS.data.pluginPath, 'modelBaseUrl', 'assets/models/');
        const loadProfile = VRODOS.loader.applyResourceLoadProfile(resources3D);
        if (!resources3D) return Promise.allSettled(pendingLoads);

        for (const name in resources3D) {
            if (!Object.prototype.hasOwnProperty.call(resources3D, name)) continue;
            const resource = resources3D[name];

            if (VRODOS.loader.handleResourceMetadata(name, resource, resources3D)) continue;

            if (VRODOS.loader.isLightOrPawnResource(resource)) continue;

            const categorySlug = VRODOS.utils.normalizeSceneAssetCategory(resource && resource.category_slug);

            // Load Camera object
            if (name === 'avatarCamera') {

                pendingLoads.push(VRODOS.loader.loadDirectorCameraAsset(manager, loader, name, resource, {
                    modelBaseUrl
                }));

            } else if (VRODOS.utils.isSceneAssessmentCategory(categorySlug)) {

                pendingLoads.push(VRODOS.loader.loadAssessmentAsset(name, resource, resources3D));

            } else if (VRODOS.utils.isSceneTextCategory(categorySlug)) {

                pendingLoads.push(VRODOS.loader.loadTextAsset(name, resource, resources3D));

            } else if (VRODOS.utils.isSceneImageCategory(categorySlug)) { // Flat image plane

                pendingLoads.push(VRODOS.loader.loadImageAsset(manager, name, resource, resources3D));

            } else { // GLB 3D models
                if (VRODOS.loader.isGlbSceneResource(name, resource, categorySlug)) {
                    glbLoadTasks.push(() => VRODOS.loader.loadGlbAsset(manager, loader, name, resource, resources3D, {
                        modelBaseUrl
                    }));
                }
            }
        }

        if (
            VRODOS.editor &&
            VRODOS.editor.diagnostics &&
            typeof VRODOS.editor.diagnostics.updateCurrentLoad === 'function'
        ) {
            VRODOS.editor.diagnostics.updateCurrentLoad({
                glbCount: glbLoadTasks.length,
                loadConcurrency: glbLoadTasks.length > 0 ? loadProfile.loadConcurrency : 0,
                isDenseScene: Boolean(loadProfile.isDenseScene)
            });
        }

        if (glbLoadTasks.length > 0) {
            pendingLoads.push(VRODOS.utils.runLimitedTasks(glbLoadTasks, loadProfile.loadConcurrency));
        }

        return Promise.allSettled(pendingLoads);
    }
};
