"use strict";

VRODOS.utils.loaderJoinUrl = function(base, path) {
    return `${String(base || '').replace(/\/+$/, '')  }/${  String(path || '').replace(/^\/+/, '')}`;
};

VRODOS.utils.loaderResolveBaseUrl = function(pluginPath, localizedKey, fallbackRelative) {
    const paths = VRODOS.data.paths || {};

    if (paths[localizedKey]) {
        return paths[localizedKey];
    }

    const pluginBaseUrl = paths.pluginBaseUrl || (typeof VRODOS.data.pluginPath === 'string' ? VRODOS.data.pluginPath : '');
    if (pluginBaseUrl) {
        return VRODOS.utils.loaderJoinUrl(pluginBaseUrl, fallbackRelative);
    }

    return String(fallbackRelative || '').replace(/^\/+/, '');
};

VRODOS.utils.loaderSafeNumber = function(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

VRODOS.utils.loaderSafeVector = function(values, fallback) {
    const safeFallback = Array.isArray(fallback) ? fallback : [0, 0, 0];
    const source = Array.isArray(values) ? values : safeFallback;

    return [
        VRODOS.utils.loaderSafeNumber(source[0], safeFallback[0]),
        VRODOS.utils.loaderSafeNumber(source[1], safeFallback[1]),
        VRODOS.utils.loaderSafeNumber(source[2], safeFallback[2])
    ];
};

VRODOS.utils.loaderSafeScale = function(values) {
    return VRODOS.utils.loaderSafeVector(values, [1, 1, 1]);
};

VRODOS.utils.loaderSafeObjectName = function(name, resource, object) {
    const currentName = typeof name === 'string' ? name.trim() : '';
    if (currentName !== '') {
        return currentName;
    }

    const objectName = object && typeof object.name === 'string' ? object.name.trim() : '';
    if (objectName !== '') {
        return objectName;
    }

    const slugPart = resource && resource.asset_slug ? String(resource.asset_slug).trim() : '';
    const idPart = resource && resource.asset_id ? String(resource.asset_id).trim() : '';
    const uuidPart = resource && resource.uuid ? String(resource.uuid).split('-')[0] : String(Date.now());

    return `${(slugPart || 'scene_object') + (idPart ? `_${  idPart}` : '')  }_${  uuidPart}`;
};

VRODOS.loader.createAssessmentObject = function(name, resource) {
    if (typeof VRODOS.ui.createAssessmentPlaceholder === 'function') {
        return VRODOS.ui.createAssessmentPlaceholder(name, resource);
    }

    const fallback = new THREE.Group();
    fallback.name = name;
    fallback.asset_name = typeof VRODOS.utils.decodeDisplayText === 'function'
        ? VRODOS.utils.decodeDisplayText(resource.asset_name || resource.assessment_title || 'Assessment')
        : (resource.asset_name || resource.assessment_title || 'Assessment');
    fallback.category_name = resource.category_name || 'Assessment';
    fallback.category_slug = 'assessment';
    fallback.assessment_title = typeof VRODOS.utils.decodeDisplayText === 'function'
        ? VRODOS.utils.decodeDisplayText(resource.assessment_title || resource.asset_name || 'Assessment')
        : (resource.assessment_title || resource.asset_name || 'Assessment');
    fallback.assessment_type = typeof VRODOS.utils.decodeDisplayText === 'function'
        ? VRODOS.utils.decodeDisplayText(resource.assessment_type || '')
        : (resource.assessment_type || '');
    fallback.assessment_group = typeof VRODOS.utils.decodeDisplayText === 'function'
        ? VRODOS.utils.decodeDisplayText(resource.assessment_group || '')
        : (resource.assessment_group || '');
    fallback.assessment_content = resource.assessment_content || '';
    fallback.assessment_levels = resource.assessment_levels || '';
    fallback.assessment_supported = resource.assessment_supported || 'false';
    fallback.isSelectableMesh = true;
    fallback.isLight = false;

    const box = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.72, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85, metalness: 0.1 })
    );
    box.isSelectableMesh = false;
    fallback.add(box);

    return fallback;
};

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

    // 2. Apply to VRODOS.editor.envir.scene
    VRODOS.editor.envir.scene[envirKey] = parsedValue;

    // 3. Sync common UI elements (Checkboxes)
    const checkboxMap = {
        'enableGeneralChat': 'enableGeneralChatCheckbox',
        'enableAvatar': 'enableAvatarCheckbox',
        'disableMovement': 'moveDisableCheckbox',
        'aframeCollisionMode': 'aframeCollisionModeCheckbox'
    };

    if (checkboxMap[key]) {
        const el = document.getElementById(checkboxMap[key]);
        if (el) {
            if (key === 'aframeCollisionMode') {
                el.checked = parsedValue !== 'off';
            } else {
                el.checked = parsedValue;
            }
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
        const modelBaseUrl = VRODOS.utils.loaderResolveBaseUrl(VRODOS.data.pluginPath, 'modelBaseUrl', 'assets/models/');

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
                                const object = objectMain.scene.children[0];
                                object.name = "Camera3Dmodel";
                                object.vrodos_internal_helper = true;
                                object.isSelectableMesh = true;
                                object.renderOrder = 1;
                                object.traverse((child) => {
                                    child.vrodos_internal_helper = true;
                                    if (child !== object) {
                                        child.isSelectableMesh = Boolean(child.isMesh);
                                    }
                                });

                                if (object.children[0]) {
                                    object.children[0].name = "Camera3DmodelMesh";
                                }

                                const translation = resource?.trs?.translation ?? resource?.position ?? [0, 0.2, 0];
                                const rotation = resource?.trs?.rotation ?? resource?.rotation ?? [0, 0, 0];
                                if (typeof VRODOS.editor.envir.installDirectorHelpers === 'function') {
                                    VRODOS.editor.envir.installDirectorHelpers(object, null);
                                } else {
                                    const director = VRODOS.editor.envir.getDirectorObject ? VRODOS.editor.envir.getDirectorObject() : VRODOS.editor.envir.scene.getObjectByName("avatarCamera");
                                    if (director) {
                                        director.add(object);
                                    }
                                }
                                VRODOS.editor.envir.applyDirectorTransform(translation, rotation);
                                if (VRODOS.editor.envir.selectableMeshes) VRODOS.editor.envir.selectableMeshes.add(object);
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
                        VRODOS.editor.envir.scene.add(object);
                        if (VRODOS.editor.envir.selectableMeshes) VRODOS.editor.envir.selectableMeshes.add(object);
                        VRODOS.editor.envir.loadedObjectsCount++;
                        if (typeof VRODOS.ui.addInHierarchyViewer === 'function') {
                            VRODOS.ui.addInHierarchyViewer(object);
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
                        const pos = VRODOS.utils.loaderSafeVector(resource.position || (trs && trs.translation), [0, 0, 0]);
                        const rot = VRODOS.utils.loaderSafeVector(resource.rotation || (trs && trs.rotation), [0, 0, 0]);
                        const scl = VRODOS.utils.loaderSafeScale(resource.scale || (trs && trs.scale));

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
                            VRODOS.editor.envir.scene.add(object);
                            if (VRODOS.editor.envir.selectableMeshes) VRODOS.editor.envir.selectableMeshes.add(object);
                            VRODOS.editor.envir.loadedObjectsCount++;

                            // When dragged onto canvas (manager.onLoad won't fire — no GLTF items),
                            // manually attach controls, update hierarchy, and save.
                            if (trs && !(VRODOS.editor.envir && VRODOS.editor.envir.isSceneLoading)) {
                                if (typeof VRODOS.ui.attachTransformTarget === 'function') {
                                    VRODOS.ui.attachTransformTarget(object);
                                } else {
                                    VRODOS.editor.currentSelectedRealObject = object;
                                    VRODOS.editor.transform_controls.detach();
                                    VRODOS.editor.transform_controls.attach(object);
                                }
                                if (typeof VRODOS.ui.removeAllCelOutlines === 'function') VRODOS.ui.removeAllCelOutlines();
                                if (typeof VRODOS.ui.addCelOutline === 'function') VRODOS.ui.addCelOutline(object);
                                VRODOS.editor.selected_object_name = object.name;
                                if (typeof VRODOS.ui.transform.setSize === 'function') VRODOS.ui.transform.setSize();
                                if (typeof VRODOS.ui.addInHierarchyViewer === 'function') VRODOS.ui.addInHierarchyViewer(object);
                                if (typeof triggerAutoSave === 'function') VRODOS.api.triggerAutoSave();
                                if (typeof VRODOS.ui.setDatGuiInitialVales === 'function') VRODOS.ui.setDatGuiInitialVales(object);
                                document.getElementById("progressWrapper").style.visibility = "hidden";
                            }
                        }));
                    }

                } else { // GLB 3D models
                    if ((resource.glb_id !== "" && resource.glb_id !== undefined) || resource.category_slug === "video") {
                        if (manager) manager.itemStart(name);
                        pendingLoads.push(new Promise((resolve) => {
                            const fetchAndLoadGLB = async () => {
                                try {
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

                                    document.getElementById("progressWrapper").style.visibility = "visible";
                                    document.getElementById("result_download").innerHTML = "Loading ...";

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

                                            // Apply max anisotropy to all loaded textures for sharper oblique surfaces
                                            const maxAniso = VRODOS.editor.envir.renderer.capabilities.getMaxAnisotropy();
                                            if (maxAniso > 1) {
                                                finalObject.traverse((node) => {
                                                    if (!node.isMesh) return;
                                                    const mats = Array.isArray(node.material) ? node.material : [node.material];
                                                    for (const mat of mats) {
                                                        if (!mat) continue;
                                                        for (const slot of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap']) {
                                                            if (mat[slot] && mat[slot].isTexture) {
                                                                mat[slot].anisotropy = maxAniso;
                                                                mat[slot].needsUpdate = true;
                                                            }
                                                        }
                                                    }
                                                });
                                            }

                                            if (finalObject.children === '') {
                                                finalObject.children = [];
                                            }

                                            VRODOS.editor.envir.scene.add(finalObject);
                                            VRODOS.editor.envir.selectableMeshes.add(finalObject);
                                            finalObject.glb_path = glbURL;
                                            if (manager) manager.itemEnd(name);
                                            resolve();
                                        },
                                        (xhr) => {
                                            const mbLoaded = Math.floor(xhr.loaded / 104857.6) / 10;
                                            document.getElementById("result_download").innerHTML = `'${resource.asset_name}' downloaded ${mbLoaded} Mb`;
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

        return Promise.allSettled(pendingLoads);
    }
};

// Set loaded Object or Scene (for GLBs) properties
VRODOS.loader.setObjectProperties = function(object, name, resources3D) {
    const resource = resources3D[name] || {};

    // Automatically load values that are available
    const excludeKeys = new Set(['id', 'translation', 'position', 'rotation', 'scale', 'quaternion', 'children', 'trs']);
    for (const [key, value] of Object.entries(resource)) {
        if (!excludeKeys.has(key)) {
            object[key] = value;
        }
    }

    object.name = VRODOS.utils.loaderSafeObjectName(name, resource, object);
    resource.name = object.name;
    object.isSelectableMesh = true;
    object.isLight = resource.isLight;
    object.fnPath = resource.path || object.fnPath || '';

    // avoid revealing the full path. Use the relative in the saving format.
    if (typeof object.fnPath === 'string') {
        // Recursive cleaning: while it looks like a URL followed by another URL
        while (/https?:\/\//i.test(object.fnPath) && object.fnPath.lastIndexOf('http') > 0) {
            object.fnPath = object.fnPath.substring(object.fnPath.lastIndexOf('http'));
        }

        // Strip the upload directory prefix to get the relative path
        const uploadsTags = ['wp-content/uploads', 'uploads/'];
        for (const tag of uploadsTags) {
            const idx = object.fnPath.indexOf(tag);
            if (idx !== -1) {
                object.fnPath = object.fnPath.substring(idx + tag.length);
                break;
            }
        }

        // Final cleanup of leading slashes
        while (object.fnPath.startsWith('/')) {
            object.fnPath = object.fnPath.substring(1);
        }
    }
    object.glb_id = resource.glb_id;

    if (String(object.category_slug || '').toLowerCase() === 'walkable-surface') {
        object.walkableBehavior = (String(resource.walkableBehavior || object.walkableBehavior || '').toLowerCase() === 'auto')
            ? 'auto'
            : 'precise';
    }

    //============== Video thumbnail texture ==========
    if (resource.category_slug === 'video') {
        const screenshotPath = resource.screenshot_path || resource.poi_img_path || resource.poi_image_path;
        if (screenshotPath) {
            const texLoader = new THREE.TextureLoader();
            texLoader.setCrossOrigin('anonymous');
            texLoader.load(screenshotPath, 
                (texture) => {
                    let screenFound = false;
                    const nodeList = [];
                    object.traverse((node) => { nodeList.push(node); });

                    // 1st pass: Look for specific screen-like names
                    nodeList.forEach((node) => {
                        if (node.isMesh) {
                            const nodeName = (node.name || "").toLowerCase();
                            if (nodeName.includes('screen') || nodeName.includes('display') || nodeName.includes('plane')) {
                                 node.material = new THREE.MeshBasicMaterial({ 
                                     map: texture, 
                                     transparent: true,
                                     side: THREE.DoubleSide
                                 });
                                 node.material.needsUpdate = true;
                                 screenFound = true;
                            }
                        }
                    });

                    // 2nd pass: Fallback if no specific screen found
                    if (!screenFound) {
                        nodeList.forEach((node) => {
                            if (node.isMesh) {
                                node.material = new THREE.MeshBasicMaterial({ 
                                    map: texture, 
                                    transparent: true,
                                    side: THREE.DoubleSide
                                });
                                node.material.needsUpdate = true;
                            }
                        });
                    }
                },
                undefined,
                (err) => {
                    console.error("Error loading video thumbnail texture:", screenshotPath, err);
                }
            );
        }
    }


    const trs = resource.trs || {};
    const translation = VRODOS.utils.loaderSafeVector(trs.translation || resource.position, [0, 0, 0]);
    const rotation = VRODOS.utils.loaderSafeVector(trs.rotation || resource.rotation, [0, 0, 0]);
    const scale = VRODOS.utils.loaderSafeScale(trs.scale || resource.scale);

    object.position.set(
        translation[0],
        translation[1],
        translation[2]);

    object.rotation.set(
        rotation[0],
        rotation[1],
        rotation[2]);

    object.scale.set(
        scale[0],
        scale[1],
        scale[2]);


    return object;
}





