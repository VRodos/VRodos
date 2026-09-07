"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.loader = VRODOS.loader || {};

VRODOS.loader.LoaderMulti = class {

    async load(manager, resources3D, _pluginPath) {

        let loader = null;
        const getLoader = () => {
            if (!loader) {
                loader = typeof VRODOS.loader.createGltfLoader === 'function'
                    ? VRODOS.loader.createGltfLoader(manager, { renderer: VRODOS.editor.envir && VRODOS.editor.envir.renderer })
                    : new THREE.GLTFLoader(manager);
            }
            return loader;
        };
        const pendingLoads = [];
        const glbLoadEntries = [];
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

                pendingLoads.push(VRODOS.loader.loadDirectorCameraAsset(manager, getLoader(), name, resource, {
                    modelBaseUrl
                }));

            } else if (VRODOS.utils.isSceneAssessmentCategory(categorySlug)) {

                pendingLoads.push(VRODOS.loader.loadAssessmentAsset(name, resource, resources3D));

            } else if (VRODOS.utils.isSceneTextCategory(categorySlug)) {

                pendingLoads.push(VRODOS.loader.loadTextAsset(name, resource, resources3D));

            } else if (categorySlug === 'video') {

                pendingLoads.push(VRODOS.loader.loadVideoAsset(name, resource, resources3D));

            } else if (VRODOS.utils.isSceneImageCategory(categorySlug)) { // Flat image plane

                pendingLoads.push(VRODOS.loader.loadImageAsset(manager, name, resource, resources3D));

            } else { // GLB 3D models
                if (VRODOS.loader.isGlbSceneResource(name, resource, categorySlug)) {
                    glbLoadEntries.push({ name, resource });
                }
            }
        }

        let uniqueGlbCount = 0;
        let reusedGlbPlacementCount = 0;
        if (glbLoadEntries.length > 0) {
            const gltfLoader = getLoader();
            const resolvedRequests = await Promise.all(glbLoadEntries.map(async (entry) => {
                try {
                    return await VRODOS.loader.resolveGlbAssetRequest(entry.name, entry.resource);
                } catch (error) {
                    alert(`Could not fetch GLB asset. Probably deleted? ${entry.name}`);
                    console.error(`Ajax Fetch Asset ERROR: ${error}`);
                    return {
                        name: entry.name,
                        resource: entry.resource,
                        loadInfo: { loadUrl: '' }
                    };
                }
            }));
            const groupedRequests = new Map();
            let validPlacementCount = 0;

            resolvedRequests.forEach((request) => {
                const loadUrl = request.loadInfo && request.loadInfo.loadUrl;
                const key = loadUrl
                    ? VRODOS.loader.glbAssetCache.getKey(loadUrl)
                    : `missing:${request.name}`;
                if (loadUrl) validPlacementCount++;
                if (!groupedRequests.has(key)) {
                    groupedRequests.set(key, []);
                }
                groupedRequests.get(key).push(request);
            });

            uniqueGlbCount = Array.from(groupedRequests.entries())
                .filter(([key]) => !key.startsWith('missing:'))
                .length;
            reusedGlbPlacementCount = Math.max(0, validPlacementCount - uniqueGlbCount);

            const orderedRequestGroups = Array.from(groupedRequests.values())
                .map((group, originalIndex) => ({
                    group,
                    originalIndex,
                    sourceSizeBytes: group.reduce((largest, request) => (
                        Math.max(largest, Number(request.resource && request.resource.sourceSizeBytes) || 0)
                    ), 0)
                }))
                .sort((left, right) => (
                    right.sourceSizeBytes - left.sourceSizeBytes || left.originalIndex - right.originalIndex
                ));
            const glbLoadTasks = orderedRequestGroups.map(({ group }) => (
                () => VRODOS.loader.loadResolvedGlbAssetGroup(manager, gltfLoader, group, resources3D)
            ));
            pendingLoads.push(VRODOS.utils.runLimitedTasks(glbLoadTasks, loadProfile.loadConcurrency));
        }

        if (
            VRODOS.editor &&
            VRODOS.editor.diagnostics &&
            typeof VRODOS.editor.diagnostics.updateCurrentLoad === 'function'
        ) {
            VRODOS.editor.diagnostics.updateCurrentLoad({
                glbCount: glbLoadEntries.length,
                glbPlacementCount: glbLoadEntries.length,
                uniqueGlbCount,
                reusedGlbPlacementCount,
                generatedVideoCount: loadProfile.generatedVideoCount,
                loadConcurrency: uniqueGlbCount > 0 ? loadProfile.loadConcurrency : 0,
                isDenseScene: Boolean(loadProfile.isDenseScene)
            });
        }

        return Promise.allSettled(pendingLoads);
    }
};
