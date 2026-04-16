"use strict";

function vrodosLoaderSafeNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function vrodosLoaderSafeVector(values, fallback) {
    const safeFallback = Array.isArray(fallback) ? fallback : [0, 0, 0];
    const source = Array.isArray(values) ? values : safeFallback;

    return [
        vrodosLoaderSafeNumber(source[0], safeFallback[0]),
        vrodosLoaderSafeNumber(source[1], safeFallback[1]),
        vrodosLoaderSafeNumber(source[2], safeFallback[2])
    ];
}

function vrodosLoaderSafeScale(values) {
    return vrodosLoaderSafeVector(values, [1, 1, 1]);
}

function vrodosLoaderSafeObjectName(name, resource, object) {
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

    return (slugPart || 'scene_object') + (idPart ? '_' + idPart : '') + '_' + uuidPart;
}

function vrodosLoaderCreateAssessmentObject(name, resource) {
    if (typeof vrodosCreateAssessmentPlaceholder === 'function') {
        return vrodosCreateAssessmentPlaceholder(name, resource);
    }

    const fallback = new THREE.Group();
    fallback.name = name;
    fallback['asset_name'] = typeof vrodosDecodeDisplayText === 'function'
        ? vrodosDecodeDisplayText(resource.asset_name || resource.assessment_title || 'Assessment')
        : (resource.asset_name || resource.assessment_title || 'Assessment');
    fallback['category_name'] = resource.category_name || 'Assessment';
    fallback['category_slug'] = 'assessment';
    fallback['assessment_title'] = typeof vrodosDecodeDisplayText === 'function'
        ? vrodosDecodeDisplayText(resource.assessment_title || resource.asset_name || 'Assessment')
        : (resource.assessment_title || resource.asset_name || 'Assessment');
    fallback['assessment_type'] = typeof vrodosDecodeDisplayText === 'function'
        ? vrodosDecodeDisplayText(resource.assessment_type || '')
        : (resource.assessment_type || '');
    fallback['assessment_group'] = typeof vrodosDecodeDisplayText === 'function'
        ? vrodosDecodeDisplayText(resource.assessment_group || '')
        : (resource.assessment_group || '');
    fallback['assessment_content'] = resource.assessment_content || '';
    fallback['assessment_levels'] = resource.assessment_levels || '';
    fallback['assessment_supported'] = resource.assessment_supported || 'false';
    fallback.isSelectableMesh = true;
    fallback.isLight = false;

    const box = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.72, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85, metalness: 0.1 })
    );
    box.isSelectableMesh = false;
    fallback.add(box);

    return fallback;
}
/**
 * Synchronize a scene setting using the schema
 * @param {string} key
 * @param {any} value
 * @param {object} resources3D - needed for context in side effects
 */
function vrodosSyncSceneSetting(key, value, resources3D) {
    if (!VRODOS_SCENE_SETTINGS_SCHEMA[key]) return;

    const config = VRODOS_SCENE_SETTINGS_SCHEMA[key];
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

    // 2. Apply to envir.scene
    envir.scene[envirKey] = parsedValue;

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
        envir.scene.bcg_selection = envir.scene.backgroundStyleOption;

        let color_sel = document.getElementById('jscolorpick');
        let custom_img_sel = document.getElementById('img_upload_bcg');
        let preset_sel = document.getElementById('presetsBcg');
        let preset_ground_toggle = document.getElementById('presetGroundToggle');

        let img_thumb = document.getElementById('uploadImgThumb');
        let horizon_sky_preset = document.getElementById('horizonSkyPreset');

        let horizonSkyRow = document.getElementById('bcgHorizonSkyRow');
        let colorRow = document.getElementById('bcgColorRow');
        let presetsRow = document.getElementById('bcgPresetsRow');
        let presetGroundRow = document.getElementById('bcgPresetGroundRow');
        let imageRow = document.getElementById('bcgImageRow');
        let horizonDescription = document.getElementById('sceneHorizonDescription');
        let presetGroundEnabled = (resources3D && resources3D["backgroundPresetGroundEnabled"] !== false);

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
            horizon_sky_preset.value = (resources3D && resources3D["aframeHorizonSkyPreset"]) || 'natural';
        }
        if (custom_img_sel) custom_img_sel.disabled = true;
        if (typeof setBackgroundPresetGroundEnabled === 'function') {
            setBackgroundPresetGroundEnabled(presetGroundEnabled);
        }

        switch (envir.scene.bcg_selection) {
            case 4:
                envir.scene.background = null;
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
                    const opt = resources3D ? (resources3D["backgroundPresetOption"] || resources3D["SceneSettings"]?.backgroundPresetOption) : null;
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
                const path = resources3D ? (resources3D["backgroundImagePath"] || resources3D["SceneSettings"]?.backgroundImagePath) : null;
                if (path && path != 0 && img_thumb) {
                    img_thumb.src = path;
                    img_thumb.hidden = false;
                }
                break;
        }
        envir.scene.img_bcg_path = resources3D ? (resources3D["backgroundImagePath"] || resources3D["SceneSettings"]?.backgroundImagePath) : envir.scene.img_bcg_path;
        envir.scene.backgroundStyleOption = parsedValue;
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
}

class VRodos_LoaderMulti {

    constructor(who) { };

    async load(manager, resources3D, pluginPath) {

        const loader = new THREE.GLTFLoader(manager);
        const pendingLoads = [];

        for (const name in resources3D) {
            const resource = resources3D[name];

            // Use schema for scene settings
            if (VRODOS_SCENE_SETTINGS_SCHEMA[name]) {
                vrodosSyncSceneSetting(name, resource, resources3D);
                continue;
            }

            if (name === 'ClearColor' || name === 'enableEnvironmentTexture' || name === 'fogCategory' || name === 'fogtype')
                continue;

                // Fog is not parsed here but in LightsPawn_Loader
                if (name === 'fogCategory') {
                    if (resource){
                        //document.getElementById('FogType').value = resource.fogtype;
                        let linear_elems = document.getElementsByClassName('linearElement');
                        let expo_elems = document.getElementsByClassName('exponentialElement');
                        let color_elems = document.getElementsByClassName('colorElement');

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
                    // if (resources3D["fogcolor"]){
                    //     document.getElementById('jscolorpickFog').jscolor.fromString("#" + resources3D["fogcolor"]);
                    // }
                    // if (resources3D["fogfar"]){
                    //     document.getElementById('FogFar').value = JSON.parse(resources3D["fogfar"]);
                    // }
                    // if (resources3D["fognear"]){
                    //     document.getElementById('FogNear').value = JSON.parse(resources3D["fognear"]);
                    // }
                    // if (resources3D["fogdensity"]){
                    //     document.getElementById('FogDensity').value = JSON.parse(resources3D["fogdensity"]);
                    // }
                    //updateFog("undo");
                }

                // Lights are in a different loop
                if (resource['category_name']) {
                    if (resource['category_name'].startsWith("light") || resource['category_name'].startsWith("pawn"))
                        continue;
                }
                // Load Camera object
                if (name === 'avatarCamera') {

                    pendingLoads.push(new Promise((resolve) => {
                        if (manager) manager.itemStart(name);
                        loader.load(`${pluginPath}/assets/Director/camera.glb`,
                            (objectMain) => {
                                const object = objectMain.scene.children[0];
                                object.name = "Camera3Dmodel";
                                object.vrodos_internal_helper = true;
                                object.isSelectableMesh = true;
                                object.renderOrder = 1;
                                object.traverse((child) => {
                                    child.vrodos_internal_helper = true;
                                    if (child !== object) {
                                        child.isSelectableMesh = !!child.isMesh;
                                    }
                                });

                                if (object.children[0]) {
                                    object.children[0].name = "Camera3DmodelMesh";
                                }

                                const translation = resource?.trs?.translation ?? resource?.position ?? [0, 0.2, 0];
                                const rotation = resource?.trs?.rotation ?? resource?.rotation ?? [0, 0, 0];
                                if (typeof envir.installDirectorHelpers === 'function') {
                                    envir.installDirectorHelpers(object, null);
                                } else {
                                    const director = envir.getDirectorObject ? envir.getDirectorObject() : envir.scene.getObjectByName("avatarCamera");
                                    if (director) {
                                        director.add(object);
                                    }
                                }
                                envir.applyDirectorTransform(translation, rotation);
                                if (envir.selectableMeshes) envir.selectableMeshes.add(object);
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

                } else if (resource['category_slug'] === 'assessment') {

                    pendingLoads.push(new Promise((resolve) => {
                        const object = vrodosLoaderCreateAssessmentObject(name, resource);
                        setObjectProperties(object, name, resources3D);
                        envir.scene.add(object);
                        if (envir.selectableMeshes) envir.selectableMeshes.add(object);
                        envir.loadedObjectsCount++;
                        if (typeof addInHierarchyViewer === 'function') {
                            addInHierarchyViewer(object);
                        }
                        resolve();
                    }));

                } else if (resource['category_slug'] === 'image') { // Flat image plane

                    const imageUrl = resource['image_path'];
                    if (!imageUrl) {
                        envir.loadedObjectsCount++;
                    } else {
                        // Support both scene-load format (pos/rot/scale flat arrays)
                        // and drag-and-drop format (trs.translation/rotation/scale)
                        const trs = resource.trs;
                        const pos = vrodosLoaderSafeVector(resource.position || (trs && trs.translation), [0, 0, 0]);
                        const rot = vrodosLoaderSafeVector(resource.rotation || (trs && trs.rotation), [0, 0, 0]);
                        const scl = vrodosLoaderSafeScale(resource.scale || (trs && trs.scale));

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
                            object = setObjectProperties(object, name, resources3D);
                            object.isSelectableMesh = true;
                            object.position.set(pos[0], pos[1], pos[2]);
                            object.rotation.set(rot[0], rot[1], rot[2]);
                            object.scale.set(scl[0], scl[1], scl[2]);
                            envir.scene.add(object);
                            if (envir.selectableMeshes) envir.selectableMeshes.add(object);
                            envir.loadedObjectsCount++;

                            // When dragged onto canvas (manager.onLoad won't fire — no GLTF items),
                            // manually attach controls, update hierarchy, and save.
                            if (trs && !(envir && envir.isSceneLoading)) {
                                transform_controls.attach(object);
                                removeAllCelOutlines();
                                addCelOutline(object);
                                selected_object_name = object.name;
                                setTransformControlsSize();
                                if (typeof addInHierarchyViewer === 'function') addInHierarchyViewer(object);
                                if (typeof triggerAutoSave === 'function') triggerAutoSave();
                                if (typeof setDatGuiInitialVales === 'function') setDatGuiInitialVales(object);
                                document.getElementById("progressWrapper").style.visibility = "hidden";
                            }
                        }));
                    }

                } else { // GLB 3D models
                    if ((resource['glb_id'] !== "" && resource['glb_id'] !== undefined) || resource['category_slug'] === "video") {
                        if (manager) manager.itemStart(name);
                        pendingLoads.push(new Promise((resolve) => {
                            const fetchAndLoadGLB = async () => {
                                try {
                                    const response = await fetch(my_ajax_object_fetchasset.ajax_url, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                        body: new URLSearchParams({
                                            'action': 'vrodos_fetch_glb_asset_action',
                                            'asset_id': resource['asset_id']
                                        })
                                    });

                                    const resText = await response.text();
                                    const resourcesGLB = JSON.parse(resText);

                                    let glbURL = resourcesGLB['glbURL'];
                                    if (resource['category_slug'] === "video") {
                                        glbURL = `${pluginPath}/assets/objects/tv_flat_scaled_rotated.glb`;
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
                                                envir.animationMixers.push(object.mixer);
                                                const action = object.mixer.clipAction(object.animations[0]);
                                                action.play();
                                            }

                                            let finalObject = setObjectProperties(object.scene, name, resources3D);
                                            finalObject.isSelectableMesh = true;

                                            // Apply max anisotropy to all loaded textures for sharper oblique surfaces
                                            const maxAniso = envir.renderer.capabilities.getMaxAnisotropy();
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

                                            envir.scene.add(finalObject);
                                            envir.selectableMeshes.add(finalObject);
                                            finalObject.glb_path = glbURL;
                                            if (manager) manager.itemEnd(name);
                                            resolve();
                                        },
                                        (xhr) => {
                                            const mbLoaded = Math.floor(xhr.loaded / 104857.6) / 10;
                                            document.getElementById("result_download").innerHTML = `'${resource['asset_name']}' downloaded ${mbLoaded} Mb`;
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
                            if (Object.prototype.hasOwnProperty.call(VRODOS_SCENE_SETTINGS_SCHEMA, key)) {
                                vrodosSyncSceneSetting(key, resource[key], { "SceneSettings": resource });
                            }
                        }
                        if (typeof syncCompileDialogFromSceneSettings === 'function') {
                            syncCompileDialogFromSceneSettings();
                        }
                    }
                    else if (name == 'cameraCoords'){
                        // if (resources3D["SceneSettings"].enableGeneralChat) {
                        //     document.getElementById("enableGeneralChatCheckbox").checked = JSON.parse(resources3D[SceneSettings].enableGeneralChat);
                        //     envir.scene.enableGeneralChat = JSON.parse(resources3D[Settings].enableGeneralChat);
                        // // }
                        // console.log("Unsupported 3D model format. Error 118.");
                        envir.applyDirectorTransform(resource.position, resource.rotation);
                        // console.log("glbID", resource['glbID']);
                        // console.log("Unsupported 3D model format: ERROR: 118");
                    }
                }
        }

        return Promise.allSettled(pendingLoads);
    }
}

// Set loaded Object or Scene (for GLBs) properties
function setObjectProperties(object, name, resources3D) {
    const resource = resources3D[name] || {};

    // Automatically load values that are available
    const excludeKeys = new Set(['id', 'translation', 'position', 'rotation', 'scale', 'quaternion', 'children', 'trs']);
    for (const [key, value] of Object.entries(resource)) {
        if (!excludeKeys.has(key)) {
            object[key] = value;
        }
    }

    object.name = vrodosLoaderSafeObjectName(name, resource, object);
    resource.name = object.name;
    object.isSelectableMesh = true;
    object.isLight = resource['isLight'];
    object.fnPath = resource['path'] || object.fnPath || '';

    // avoid revealing the full path. Use the relative in the saving format.
    if (typeof object.fnPath === 'string' && object.fnPath.indexOf('uploads/') !== -1) {
        object.fnPath = object.fnPath.substring(object.fnPath.indexOf('uploads/') + 7);
    }
    object['glb_id'] = resource['glb_id'];

    if (String(object.category_slug || '').toLowerCase() === 'walkable-surface') {
        object.walkableBehavior = (String(resource.walkableBehavior || object.walkableBehavior || '').toLowerCase() === 'auto')
            ? 'auto'
            : 'precise';
    }

    // Not needed anymore, we dont override textures anymore
    /*if (resource['overrideMaterial'] === "true") {
        if (object.children[0].isMesh) {
            object.children[0].material.color.setHex("0x" + resource['color']);
            object.children[0].material.emissive.setHex("0x" + resource['emissive']);
            object.children[0].material.roughness = parseFloat(resource['roughness']);
            object.children[0].material.metalness = parseFloat(resource['metalness']);
            object.children[0].material.emissiveIntensity = parseFloat(resource['emissiveIntensity']);
            object.children[0].receiveShadow = true;
            object.children[0].castShadow = true;
        }
    }*/
    //============== Video texture ==========


    const trs = resource['trs'] || {};
    const translation = vrodosLoaderSafeVector(trs['translation'] || resource['position'], [0, 0, 0]);
    const rotation = vrodosLoaderSafeVector(trs['rotation'] || resource['rotation'], [0, 0, 0]);
    const scale = vrodosLoaderSafeScale(trs['scale'] || resource['scale']);

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
