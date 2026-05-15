"use strict";

VRODOS.loader.LoaderMulti = class {

    async load(manager, resources3D, _pluginPath) {

        const loader = new THREE.GLTFLoader(manager);
        const pendingLoads = [];
        const glbLoadTasks = [];
        const modelBaseUrl = VRODOS.utils.loaderResolveBaseUrl(VRODOS.data.pluginPath, 'modelBaseUrl', 'assets/models/');
        const resourceCount = resources3D ? Object.keys(resources3D).length : 0;
        const loop = VRODOS.editor && VRODOS.editor.renderLoop ? VRODOS.editor.renderLoop : {};
        const loadConcurrency = resourceCount >= 75 ? 1 : Math.max(1, Number(loop.loaderConcurrency || 2));
        if (resourceCount >= 75 && VRODOS.editor && VRODOS.editor.renderLoop) {
            VRODOS.editor.renderLoop.targetFps = 30;
            VRODOS.editor.renderLoop.pixelRatioCap = 1;
            VRODOS.editor.renderLoop.labelFrameStride = 3;
        }

        for (const name in resources3D) {
            if (!Object.prototype.hasOwnProperty.call(resources3D, name)) continue;
            const resource = resources3D[name];

            // Use schema for scene settings
            if (VRODOS.config.SCENE_SETTINGS_SCHEMA[name]) {
                VRODOS.api.syncSceneSetting(name, resource, resources3D);
                continue;
            }

            if (name === 'ClearColor' || name === 'enableEnvironmentTexture' || name === 'fogCategory' || name === 'fogtype')
                {continue;}

                // Fog is not parsed here but in LightsPawn_Loader
                if (name === 'fogCategory') {
                    if (resource){
                        //document.getElementById('FogType').value = resource.fogtype;
                        const linear_elems = document.getElementsByClassName('linearElement');
                        const expo_elems = document.getElementsByClassName('exponentialElement');
                        const color_elems = document.getElementsByClassName('colorElement');

                        if (resource === "0") {
                            document.getElementById('RadioNoFog').checked = true;
                            for (let i = 0; i < linear_elems.length; ++i) {
                                linear_elems[i].style.display="none";
                            }
                            for (let i = 0; i < expo_elems.length; ++i) {
                                expo_elems[i].style.display="none";
                            }
                            for (let i = 0; i < color_elems.length; ++i) {
                                color_elems[i].style.display="none";
                            }
                            document.getElementById("FogValues").style.display="none";
                            document.getElementById('FogType').value = "none";
                        } else if ( resource === "1") {
                            document.getElementById('RadioLinearFog').checked = true;
                            document.getElementById("FogValues").style.display="flex";
                            for (let i = 0; i < linear_elems.length; ++i) {
                                linear_elems[i].style.display="flex";
                            }
                            for (let i = 0; i < expo_elems.length; ++i) {
                                expo_elems[i].style.display="none";
                            }
                            for (let i = 0; i < color_elems.length; ++i) {
                                color_elems[i].style.display="flex";
                            }
                            document.getElementById('FogType').value = "linear";
                        } else if ( resource === "2") {
                            document.getElementById('FogType').value = "exponential";
                            for (let i = 0; i < linear_elems.length; ++i) {
                                linear_elems[i].style.display="none";
                            }
                            for (let i = 0; i < expo_elems.length; ++i) {
                                expo_elems[i].style.display="flex";
                            }
                            for (let i = 0; i < color_elems.length; ++i) {
                                color_elems[i].style.display="flex";
                            }
                            document.getElementById("FogValues").style.display="flex";
                            document.getElementById('RadioExponentialFog').checked =true;
                        }
                    }
                    else{
                        document.getElementById('RadioNoFog').checked = true;
                    }
                }

                // Lights are in a different loop
                if (resource.category_name) {
                    if (resource.category_name.startsWith("light") || resource.category_name.startsWith("pawn"))
                        {continue;}
                }
                // Load Camera object
                if (name === 'avatarCamera') {

                    pendingLoads.push(VRODOS.loader.loadDirectorCameraAsset(manager, loader, name, resource, {
                        modelBaseUrl
                    }));

                } else if (resource.category_slug === 'assessment') {

                    pendingLoads.push(VRODOS.loader.loadAssessmentAsset(name, resource, resources3D));

                } else if (resource.category_slug === '3d-text') {

                    pendingLoads.push(VRODOS.loader.loadTextAsset(name, resource, resources3D));

                } else if (resource.category_slug === 'image') { // Flat image plane

                    pendingLoads.push(VRODOS.loader.loadImageAsset(manager, name, resource, resources3D));

                } else { // GLB 3D models
                    if ((resource.glb_id !== "" && resource.glb_id !== undefined) || resource.category_slug === "video") {
                        glbLoadTasks.push(() => VRODOS.loader.loadGlbAsset(manager, loader, name, resource, resources3D, {
                            modelBaseUrl
                        }));
                    } 
                    else if (name === "SceneSettings") {
                        for (const key in resource) {
                            if (Object.prototype.hasOwnProperty.call(VRODOS.config.SCENE_SETTINGS_SCHEMA, key)) {
                                VRODOS.api.syncSceneSetting(key, resource[key], { "SceneSettings": resource });
                            }
                        }
                        if (typeof VRODOS.ui.syncCompileDialogFromSceneSettings === 'function') {
                            VRODOS.ui.syncCompileDialogFromSceneSettings();
                        }
                    }
                    else if (name === 'cameraCoords'){
                        VRODOS.editor.envir.applyDirectorTransform(resource.position, resource.rotation);
                    }
                }
        }

        if (glbLoadTasks.length > 0) {
            pendingLoads.push(VRODOS.utils.runLimitedTasks(glbLoadTasks, loadConcurrency));
        }

        return Promise.allSettled(pendingLoads);
    }
};
