"use strict";

VRODOS.loader.LoaderMulti = class {

    async load(manager, resources3D, _pluginPath) {

        const loader = new THREE.GLTFLoader(manager);
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

            const categorySlug = resource && resource.category_slug;

            // Load Camera object
            if (name === 'avatarCamera') {

                pendingLoads.push(VRODOS.loader.loadDirectorCameraAsset(manager, loader, name, resource, {
                    modelBaseUrl
                }));

            } else if (categorySlug === 'assessment') {

                pendingLoads.push(VRODOS.loader.loadAssessmentAsset(name, resource, resources3D));

            } else if (categorySlug === '3d-text') {

                pendingLoads.push(VRODOS.loader.loadTextAsset(name, resource, resources3D));

            } else if (categorySlug === 'image') { // Flat image plane

                pendingLoads.push(VRODOS.loader.loadImageAsset(manager, name, resource, resources3D));

            } else { // GLB 3D models
                if ((resource && resource.glb_id !== "" && resource.glb_id !== undefined) || categorySlug === "video") {
                    glbLoadTasks.push(() => VRODOS.loader.loadGlbAsset(manager, loader, name, resource, resources3D, {
                        modelBaseUrl
                    }));
                }
            }
        }

        if (glbLoadTasks.length > 0) {
            pendingLoads.push(VRODOS.utils.runLimitedTasks(glbLoadTasks, loadProfile.loadConcurrency));
        }

        return Promise.allSettled(pendingLoads);
    }
};
