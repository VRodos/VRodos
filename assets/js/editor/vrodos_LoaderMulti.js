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

                    pendingLoads.push(new Promise((resolve) => {
                        if (manager) manager.itemStart(name);
                        loader.load(`${modelBaseUrl}director/camera.glb`,
                            (objectMain) => {
                                const object = VRODOS.loader.prepareDirectorCameraObject(objectMain.scene.children[0]);

                                const translation = resource?.trs?.translation ?? resource?.position ?? [0, 0.2, 0];
                                const rotation = resource?.trs?.rotation ?? resource?.rotation ?? [0, 0, 0];
                                if (typeof VRODOS.editor.envir.installDirectorHelpers === 'function') {
                                    VRODOS.editor.envir.installDirectorHelpers(object, null);
                                } else {
                                    const director = typeof VRODOS.editor.envir.getDirectorObject === 'function'
                                        ? VRODOS.editor.envir.getDirectorObject()
                                        : null;
                                    if (director) {
                                        director.add(object);
                                    }
                                }
                                VRODOS.editor.envir.applyDirectorTransform(translation, rotation);
                                VRODOS.editor.sceneRegistry.add(object, { addToScene: false, selectable: true, reason: 'director-camera-loaded' });
                                if (manager) manager.itemEnd(name);
                                resolve();
                            },
                            undefined,
                            (error) => {
                                console.error('Cannot load camera GLB, loading error happened. Error 1595', error);
                                if (manager) {
                                    manager.itemError(name);
                                    manager.itemEnd(name);
                                }
                                resolve();
                            }
                        );
                    }));

                } else if (resource.category_slug === 'assessment') {

                    pendingLoads.push(new Promise((resolve) => {
                        const object = VRODOS.loader.createAssessmentObject(name, resource);
                        VRODOS.loader.setObjectProperties(object, name, resources3D);
                        VRODOS.editor.objectFactory.addSceneObject(object, {
                            selectable: true,
                            updateHierarchy: VRODOS.loader.shouldBuildHierarchyDuringLoad(),
                            renderReason: 'assessment-loaded'
                        });
                        resolve();
                    }));

                } else if (resource.category_slug === '3d-text') {

                    pendingLoads.push(new Promise((resolve) => {
                        const object = VRODOS.loader.createTextPanelObject(name, resource);
                        VRODOS.loader.setObjectProperties(object, name, resources3D);
                        const trs = resource.trs;
                        const shouldSelect = trs && !(VRODOS.editor.envir && VRODOS.editor.envir.isSceneLoading);
                        VRODOS.editor.objectFactory.addSceneObject(object, {
                            selectable: true,
                            updateHierarchy: VRODOS.loader.shouldBuildHierarchyDuringLoad() || shouldSelect,
                            select: shouldSelect,
                            frame: shouldSelect,
                            autosave: shouldSelect,
                            openPanel: false,
                            showProperties: false,
                            source: 'text-loaded',
                            renderReason: 'text-loaded'
                        });

                        if (shouldSelect) {
                            const progressWrapper = document.getElementById("progressWrapper");
                            if (progressWrapper) progressWrapper.style.visibility = "hidden";
                        }

                        resolve();
                    }));

                } else if (resource.category_slug === 'image') { // Flat image plane

                    const imageUrl = resource.image_path;
                    if (!imageUrl) {
                        VRODOS.editor.envir.loadedObjectsCount++;
                    } else {
                        // Support both scene-load format (pos/rot/scale flat arrays)
                        // and drag-and-drop format (trs.translation/rotation/scale)
                        const trs = resource.trs;
                        const pos = VRODOS.utils.loaderSafeVector((trs && trs.translation) || resource.position || resource.translation, [0, 0, 0]);
                        const rot = VRODOS.utils.loaderSafeVector((trs && trs.rotation) || resource.rotation, [0, 0, 0]);
                        const scl = VRODOS.utils.loaderSafeScale((trs && trs.scale) || resource.scale);

                        pendingLoads.push(new Promise((resolve) => {
                            const geometry = new THREE.PlaneGeometry(2, 2);
                            if (manager) manager.itemStart(name);
                            const texture  = new THREE.TextureLoader(manager).load(
                                imageUrl,
                                () => {
                                    if (manager) manager.itemEnd(name);
                                    resolve();
                                },
                                undefined,
                                () => {
                                    if (manager) {
                                        manager.itemError(name);
                                        manager.itemEnd(name);
                                    }
                                    resolve();
                                }
                            );
                            const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true });
                            let object     = new THREE.Mesh(geometry, material);
                            object = VRODOS.loader.setObjectProperties(object, name, resources3D);
                            object.isSelectableMesh = true;
                            object.position.set(pos[0], pos[1], pos[2]);
                            object.rotation.set(rot[0], rot[1], rot[2]);
                            object.scale.set(scl[0], scl[1], scl[2]);
                            const shouldSelect = trs && !(VRODOS.editor.envir && VRODOS.editor.envir.isSceneLoading);
                            VRODOS.editor.objectFactory.addSceneObject(object, {
                                selectable: true,
                                updateHierarchy: VRODOS.loader.shouldBuildHierarchyDuringLoad() || shouldSelect,
                                select: shouldSelect,
                                frame: shouldSelect,
                                autosave: shouldSelect,
                                openPanel: false,
                                showProperties: false,
                                source: 'image-loaded',
                                renderReason: 'image-loaded'
                            });

                            // When dragged onto canvas (manager.onLoad won't fire — no GLTF items),
                            // hide the progress UI immediately after service selection.
                            if (shouldSelect) {
                                const progressWrapper = document.getElementById("progressWrapper");
                                if (progressWrapper) progressWrapper.style.visibility = "hidden";
                            }
                        }));
                    }

                } else { // GLB 3D models
                    if ((resource.glb_id !== "" && resource.glb_id !== undefined) || resource.category_slug === "video") {
                        glbLoadTasks.push(() => new Promise((resolve) => {
                            const fetchAndLoadGLB = async () => {
                                try {
                                    if (manager) manager.itemStart(name);
                                    const ajaxUrl = VRODOS.utils.getAjaxUrl();
                                    const response = await fetch(ajaxUrl, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                        body: new URLSearchParams({
                                            'action': 'vrodos_fetch_glb_asset_action',
                                            'asset_id': resource.asset_id
                                        })
                                    });

                                    let resourcesGLB = {};
                                    try {
                                        const resText = await response.text();
                                        const trimmed = resText.trim();
                                        if (!trimmed || trimmed[0] === '<') {
                                            throw new Error(`GLB metadata endpoint returned HTML from ${ajaxUrl}`);
                                        }

                                        resourcesGLB = JSON.parse(trimmed);
                                    } catch (e) {
                                        console.warn(`Could not parse metadata for asset ${  name}`, e);
                                    }

                                    // Surgical merge: Only take what we need for thumbnails and visuals.
                                    // This prevents overwriting essential properties like category_name.
                                    if (resourcesGLB && resourcesGLB.screenshot_path) resource.screenshot_path = resourcesGLB.screenshot_path;
                                    if (resourcesGLB && resourcesGLB.category_slug) resource.category_slug = resourcesGLB.category_slug;

                                    // Fallback: If the AJAX failed to return a GLB URL, use the one we already have in the resource.
                                    // This prevents assets from being skipped (which would cause them to be deleted on save).
                                    let glbURL = resourcesGLB && resourcesGLB.glbURL ? resourcesGLB.glbURL : (resource.glb_path || resource.path);
                                    if (resource.category_slug === "video") {
                                        glbURL = `${modelBaseUrl  }editor/tv_flat_scaled_rotated.glb`;
                                    }

                                    if (!glbURL) {
                                        if (manager) {
                                            manager.itemError(name);
                                            manager.itemEnd(name);
                                        }
                                        console.warn(`Asset '${name}' has no GLB path and will be skipped.`);
                                        resolve();
                                        return;
                                    }

                                    if (typeof VRODOS.api.setSceneLoadingProgressText === 'function') {
                                        VRODOS.api.setSceneLoadingProgressText("Loading ...");
                                    }

                                    loader.load(
                                        glbURL,
                                        (object) => {
                                            if (object.animations.length > 0) {
                                                object.mixer = new THREE.AnimationMixer(object.scene);
                                                VRODOS.editor.envir.animationMixers.push(object.mixer);
                                                const action = object.mixer.clipAction(object.animations[0]);
                                                action.play();
                                            }

                                            const finalObject = VRODOS.loader.setObjectProperties(object.scene, name, resources3D);
                                            finalObject.isSelectableMesh = true;

                                            VRODOS.loader.applyTextureAnisotropy(finalObject, VRODOS.loader.getEditorTextureAnisotropy());

                                            if (finalObject.children === '') {
                                                finalObject.children = [];
                                            }

                                            finalObject.glb_path = glbURL;
                                            VRODOS.editor.objectFactory.addSceneObject(finalObject, {
                                                selectable: true,
                                                incrementLoaded: false,
                                                renderReason: 'glb-loaded'
                                            });
                                            if (typeof VRODOS.editor.envir.applyEditorPerformanceProfile === 'function') {
                                                VRODOS.editor.envir.applyEditorPerformanceProfile(false);
                                            }
                                            if (manager) manager.itemEnd(name);
                                            resolve();
                                        },
                                        (xhr) => {
                                            const mbLoaded = Math.floor(xhr.loaded / 104857.6) / 10;
                                            const displayName = VRODOS.utils.loaderDisplayText(resource.asset_name || name);
                                            if (typeof VRODOS.api.setSceneLoadingProgressText === 'function') {
                                                VRODOS.api.setSceneLoadingProgressText(`'${displayName}' downloaded ${mbLoaded} Mb`);
                                            }
                                        },
                                        (error) => {
                                            console.error('A GLB loading error happened. Error 1590', error);
                                            if (manager) {
                                                manager.itemError(name);
                                                manager.itemEnd(name);
                                            }
                                            resolve();
                                        }
                                    );
                                } catch (err) {
                                    alert(`Could not fetch GLB asset. Probably deleted? ${name}`);
                                    console.error(`Ajax Fetch Asset ERROR: ${err}`);
                                    if (manager) {
                                        manager.itemError(name);
                                        manager.itemEnd(name);
                                    }
                                    resolve();
                                }
                            };

                            fetchAndLoadGLB();
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
