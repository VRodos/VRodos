"use strict";

/**
 * Synchronize a scene setting using the schema
 * @param {string} key
 * @param {any} value
 * @param {object} resources3D - needed for context in side effects
 */
VRODOS.api.syncSceneSetting = function(key, value, resources3D) {
    if (!VRODOS.config.SCENE_SETTINGS_SCHEMA[key]) return;

    const config = VRODOS.config.SCENE_SETTINGS_SCHEMA[key];
    const envirKey = config.envirKey;

    // 1. Parse value based on schema type
    let parsedValue = value;
    if (config.type === 'boolean') {
        parsedValue = (value === true || value === 'true');
        // Handle "false" strings and explicit flags
        if (value === false || value === 'false') parsedValue = false;
    } else if (config.type === 'number') {
        parsedValue = parseFloat(value);
        if (isNaN(parsedValue)) parsedValue = config.default;
    } else if (config.type === 'color') {
        parsedValue = value || config.default;
    }

    if (key === 'aframeNavigationMode') {
        parsedValue = ['walk', 'walkable', 'fly'].includes(parsedValue)
            ? parsedValue
            : (VRODOS.editor.envir.scene.aframeCollisionMode === 'off' ? 'walk' : 'walkable');
    }

    // 2. Apply to VRODOS.editor.envir.scene
    VRODOS.editor.envir.scene[envirKey] = parsedValue;
    if (key === 'aframeNavigationMode') {
        VRODOS.editor.envir.scene.aframeCollisionMode = parsedValue === 'walkable' ? 'auto' : 'off';
    } else if (key === 'aframeCollisionMode' && ['walk', 'walkable', 'fly'].includes(VRODOS.editor.envir.scene.aframeNavigationMode)) {
        VRODOS.editor.envir.scene.aframeCollisionMode = VRODOS.editor.envir.scene.aframeNavigationMode === 'walkable' ? 'auto' : 'off';
    }

    // 3. Sync common UI elements (Checkboxes)
    const checkboxMap = {
        'enableGeneralChat': 'enableGeneralChatCheckbox',
        'enableAvatar': 'enableAvatarCheckbox',
        'disableMovement': 'moveDisableCheckbox'
    };

    if (checkboxMap[key]) {
        const el = document.getElementById(checkboxMap[key]);
        if (el) {
            el.checked = parsedValue;
        }
    }

    const selectMap = {
        'aframeNavigationMode': 'aframeNavigationModeSelect'
    };

    if (selectMap[key]) {
        const el = document.getElementById(selectMap[key]);
        if (el) {
            el.value = parsedValue;
        }
    }

    // 4. Handle Side Effects (Background, Fog, etc.)
    if (key === 'backgroundStyleOption') {
        VRODOS.editor.envir.scene.bcg_selection = VRODOS.editor.envir.scene.backgroundStyleOption;

        const color_sel = document.getElementById('jscolorpick');
        const custom_img_sel = document.getElementById('img_upload_bcg');
        const preset_sel = document.getElementById('presetsBcg');
        const preset_ground_toggle = document.getElementById('presetGroundToggle');

        const img_thumb = document.getElementById('uploadImgThumb');
        const horizon_sky_preset = document.getElementById('horizonSkyPreset');

        const horizonSkyRow = document.getElementById('bcgHorizonSkyRow');
        const colorRow = document.getElementById('bcgColorRow');
        const presetsRow = document.getElementById('bcgPresetsRow');
        const presetGroundRow = document.getElementById('bcgPresetGroundRow');
        const imageRow = document.getElementById('bcgImageRow');
        const horizonDescription = document.getElementById('sceneHorizonDescription');
        const presetGroundEnabled = (resources3D && resources3D.backgroundPresetGroundEnabled !== false);

        // Hide all rows first
        if (horizonSkyRow) horizonSkyRow.style.display = 'none';
        if (colorRow) colorRow.style.display = 'none';
        if (presetsRow) presetsRow.style.display = 'none';
        if (presetGroundRow) presetGroundRow.style.display = 'none';
        if (imageRow) imageRow.style.display = 'none';
        if (horizonDescription) {
            horizonDescription.style.display = 'none';
            horizonDescription.classList.add('tw-hidden');
        }
        if (color_sel) color_sel.disabled = true;
        if (preset_sel) preset_sel.disabled = true;
        if (preset_ground_toggle) {
            preset_ground_toggle.disabled = true;
            preset_ground_toggle.checked = presetGroundEnabled;
        }
        if (horizon_sky_preset) {
            horizon_sky_preset.disabled = true;
            horizon_sky_preset.value = (resources3D && resources3D.aframeHorizonSkyPreset) || 'natural';
        }
        if (custom_img_sel) custom_img_sel.disabled = true;
        if (typeof VRODOS.ui.setBackgroundPresetGroundEnabled === 'function') {
            VRODOS.ui.setBackgroundPresetGroundEnabled(presetGroundEnabled);
        }

        switch (VRODOS.editor.envir.scene.bcg_selection) {
            case 4:
                VRODOS.editor.envir.scene.background = null;
                const noBcg = document.getElementById("sceneNoBackground");
                if (noBcg) noBcg.checked = true;
                break;
            case 0:
                const horizonRadio = document.getElementById("sceneHorizon");
                if (horizonRadio) horizonRadio.checked = true;
                if (horizonDescription) {
                    horizonDescription.style.display = 'block';
                    horizonDescription.classList.remove('tw-hidden');
                }
                if (horizon_sky_preset) horizon_sky_preset.disabled = false;
                if (horizonSkyRow) horizonSkyRow.style.display = 'flex';
                break;
            case 1:
                const colorRadio = document.getElementById("sceneColorRadio");
                if (colorRadio) colorRadio.checked = true;
                if (color_sel) color_sel.disabled = false;
                if (colorRow) colorRow.style.display = 'flex';
                break;
            case 2:
                const skyRadio = document.getElementById("sceneSky");
                if (skyRadio) skyRadio.checked = true;
                if (preset_sel) {
                    preset_sel.disabled = false;
                    const opt = resources3D ? (resources3D.backgroundPresetOption || resources3D.SceneSettings?.backgroundPresetOption) : null;
                    for (let i = 0; i < preset_sel.options.length; i++) {
                        if (preset_sel.options[i].value == opt) {
                            preset_sel.options[i].selected = true;
                        }
                    }
                }
                if (presetsRow) presetsRow.style.display = 'flex';
                if (preset_ground_toggle) preset_ground_toggle.disabled = false;
                if (presetGroundRow) presetGroundRow.style.display = 'flex';
                break;
            case 3:
                const customRadio = document.getElementById("sceneCustomImage");
                if (customRadio) customRadio.checked = true;
                if (custom_img_sel) custom_img_sel.disabled = false;
                if (imageRow) imageRow.style.display = 'flex';
                const path = resources3D ? (resources3D.backgroundImagePath || resources3D.SceneSettings?.backgroundImagePath) : null;
                if (path && path != 0 && img_thumb) {
                    img_thumb.src = path;
                    img_thumb.hidden = false;
                }
                break;
        }
        VRODOS.editor.envir.scene.img_bcg_path = resources3D ? (resources3D.backgroundImagePath || resources3D.SceneSettings?.backgroundImagePath) : VRODOS.editor.envir.scene.img_bcg_path;
        VRODOS.editor.envir.scene.backgroundStyleOption = parsedValue;
    }

    if (key === 'fogCategory') {
        const linear_elems = document.getElementsByClassName('linearElement');
        const expo_elems = document.getElementsByClassName('exponentialElement');
        const color_elems = document.getElementsByClassName('colorElement');
        const fogValEl = document.getElementById("FogValues");
        const fogTypeEl = document.getElementById('FogType');

        if (parsedValue === 0) {
            const radioNoFog = document.getElementById('RadioNoFog');
            if (radioNoFog) radioNoFog.checked = true;
            for (let i = 0; i < linear_elems.length; ++i) linear_elems[i].style.display = "none";
            for (let i = 0; i < expo_elems.length; ++i) expo_elems[i].style.display = "none";
            for (let i = 0; i < color_elems.length; ++i) color_elems[i].style.display = "none";
            if (fogValEl) fogValEl.style.display = "none";
            if (fogTypeEl) fogTypeEl.value = "none";
        } else if (parsedValue === 1) {
            const radioLinFog = document.getElementById('RadioLinearFog');
            if (radioLinFog) radioLinFog.checked = true;
            if (fogValEl) fogValEl.style.display = "flex";
            for (let i = 0; i < linear_elems.length; ++i) linear_elems[i].style.display = "flex";
            for (let i = 0; i < expo_elems.length; ++i) expo_elems[i].style.display = "none";
            for (let i = 0; i < color_elems.length; ++i) color_elems[i].style.display = "flex";
            if (fogTypeEl) fogTypeEl.value = "linear";
        } else if (parsedValue === 2) {
            if (fogTypeEl) fogTypeEl.value = "exponential";
            for (let i = 0; i < linear_elems.length; ++i) linear_elems[i].style.display = "none";
            for (let i = 0; i < expo_elems.length; ++i) expo_elems[i].style.display = "flex";
            for (let i = 0; i < color_elems.length; ++i) color_elems[i].style.display = "flex";
            if (fogValEl) fogValEl.style.display = "flex";
            const radioExpFog = document.getElementById('RadioExponentialFog');
            if (radioExpFog) radioExpFog.checked = true;
        }
    }
};

VRODOS.loader.LoaderMulti = class {

    constructor(who) { };

    async load(manager, resources3D, pluginPath) {

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
                    else if (name == 'cameraCoords'){
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
