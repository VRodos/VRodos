/**
 * Created by DIMITRIOS on 7/3/2016.
 */

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

class VRodos_LoaderMulti {

    constructor(who) { };

    async load(manager, resources3D, pluginPath) {

        const loader = new THREE.GLTFLoader(manager);
        const pendingLoads = [];
        

        for (const name in resources3D) {
            const resource = resources3D[name];
                
                if (name === 'enableGeneralChat'){
                    document.getElementById("enableGeneralChatCheckbox").checked = resource;
                    envir.scene.enableGeneralChat = resource;
                }

                
                if (name === 'enableAvatar'){
                    document.getElementById("enableAvatarCheckbox").checked = resource;
                    envir.scene.enableAvatar = resource;
                }

                if (name === 'disableMovement'){
                    document.getElementById("moveDisableCheckbox").checked = resource;
                    envir.scene.disableMovement = resource;
                }

                if (name === 'aframeCollisionMode') {
                    envir.scene.aframeCollisionMode = resource || 'auto';
                    let collisionToggle = document.getElementById('aframeCollisionModeCheckbox');
                    if (collisionToggle) {
                        collisionToggle.checked = envir.scene.aframeCollisionMode !== 'off';
                    }
                }

                if (name === 'aframeRenderQuality') {
                    envir.scene.aframeRenderQuality = resource || 'standard';
                }

                if (name === 'aframeShadowQuality') {
                    envir.scene.aframeShadowQuality = resource || 'medium';
                }

                if (name === 'aframeAAQuality') {
                    envir.scene.aframeAAQuality = resource || 'balanced';
                }

                if (name === 'aframeFPSMeterEnabled') {
                    envir.scene.aframeFPSMeterEnabled = resource === true || resource === 'true';
                }

                if (name === 'aframeAmbientOcclusionPreset') {
                    envir.scene.aframeAmbientOcclusionPreset = resource || 'balanced';
                }

                if (name === 'aframeContactShadowPreset') {
                    envir.scene.aframeContactShadowPreset = resource || 'soft';
                }

                if (name === 'aframePostFXEnabled') {
                    envir.scene.aframePostFXEnabled = resource === true || resource === 'true';
                }

                if (name === 'aframePostFXBloomEnabled') {
                    envir.scene.aframePostFXBloomEnabled = !(resource === false || resource === 'false');
                }

                if (name === 'aframePostFXColorEnabled') {
                    envir.scene.aframePostFXColorEnabled = !(resource === false || resource === 'false');
                }

                if (name === 'aframePostFXVignetteEnabled') {
                    envir.scene.aframePostFXVignetteEnabled = false;
                }

                if (name === 'aframePostFXEdgeAAEnabled') {
                    envir.scene.aframePostFXEdgeAAEnabled = !(resource === false || resource === 'false');
                }

                if (name === 'aframePostFXEdgeAAStrength') {
                    envir.scene.aframePostFXEdgeAAStrength = resource || 3;
                }

                if (name === 'aframePostFXTAAEnabled') {
                    envir.scene.aframePostFXTAAEnabled = resource === true || resource === 'true';
                }

                if (name === 'aframePostFXSSREnabled') {
                    envir.scene.aframePostFXSSREnabled = resource === true || resource === 'true';
                }

                if (name === 'aframePostFXSSRStrength') {
                    envir.scene.aframePostFXSSRStrength = resource || 'off';
                }

                if (name === 'aframePostFXEngine') {
                    envir.scene.aframePostFXEngine = (resource === 'pmndrs') ? 'pmndrs' : 'legacy';
                }

                if (name === 'aframePmndrsAAMode') {
                    envir.scene.aframePmndrsAAMode = (resource === 'none' || resource === 'smaa' || resource === 'msaa')
                        ? resource
                        : 'inherit';
                }

                if (name === 'aframePmndrsAAPreset') {
                    envir.scene.aframePmndrsAAPreset = (resource === 'low' || resource === 'medium' || resource === 'high' || resource === 'ultra')
                        ? resource
                        : 'inherit';
                }

                if (name === 'aframeLegacyHorizonStageSize') {
                    var _lhs = parseFloat(resource);
                    envir.scene.aframeLegacyHorizonStageSize = isNaN(_lhs) ? 5000 : Math.max(500, Math.min(8000, _lhs));
                }

                if (name === 'aframePmndrsBloomIntensity') {
                    var _pbI = parseFloat(resource);
                    envir.scene.aframePmndrsBloomIntensity = isNaN(_pbI) ? 1.0 : _pbI;
                }

                if (name === 'aframePmndrsBloomThreshold') {
                    var _pbT = parseFloat(resource);
                    envir.scene.aframePmndrsBloomThreshold = isNaN(_pbT) ? 0.62 : _pbT;
                }

                if (name === 'aframePmndrsVignetteEnabled') {
                    envir.scene.aframePmndrsVignetteEnabled = resource === true || resource === 'true';
                }

                if (name === 'aframePmndrsVignetteDarkness') {
                    var _pvD = parseFloat(resource);
                    envir.scene.aframePmndrsVignetteDarkness = isNaN(_pvD) ? 0.5 : _pvD;
                }

                if (name === 'aframePmndrsToneMappingExposure') {
                    var _ptE = parseFloat(resource);
                    envir.scene.aframePmndrsToneMappingExposure = isNaN(_ptE) ? 1.0 : _ptE;
                }

                if (name === 'aframePmndrsAtmosphereEnabled') {
                    envir.scene.aframePmndrsAtmosphereEnabled = !(resource === false || resource === 'false');
                }

                if (name === 'aframePmndrsAtmosphereQuality') {
                    envir.scene.aframePmndrsAtmosphereQuality = resource || 'balanced';
                }

                if (name === 'aframePmndrsSunElevationDeg') {
                    var _pmSunEl = parseFloat(resource);
                    envir.scene.aframePmndrsSunElevationDeg = isNaN(_pmSunEl) ? 10 : _pmSunEl;
                }

                if (name === 'aframePmndrsSunAzimuthDeg') {
                    var _pmSunAz = parseFloat(resource);
                    envir.scene.aframePmndrsSunAzimuthDeg = isNaN(_pmSunAz) ? 38 : _pmSunAz;
                }

                if (name === 'aframePmndrsSunDistance') {
                    var _pmSunDist = parseFloat(resource);
                    envir.scene.aframePmndrsSunDistance = isNaN(_pmSunDist) ? 5200 : _pmSunDist;
                }

                if (name === 'aframePmndrsSunAngularRadius') {
                    var _pmSunRadius = parseFloat(resource);
                    envir.scene.aframePmndrsSunAngularRadius = isNaN(_pmSunRadius) ? 0.0068 : _pmSunRadius;
                }

                if (name === 'aframePmndrsAerialStrength') {
                    var _pmAerial = parseFloat(resource);
                    envir.scene.aframePmndrsAerialStrength = isNaN(_pmAerial) ? 0.85 : _pmAerial;
                }

                if (name === 'aframePmndrsAlbedoScale') {
                    var _pmAlbedo = parseFloat(resource);
                    envir.scene.aframePmndrsAlbedoScale = isNaN(_pmAlbedo) ? 0.96 : _pmAlbedo;
                }

                if (name === 'aframePmndrsTransmittanceEnabled') {
                    envir.scene.aframePmndrsTransmittanceEnabled = !(resource === false || resource === 'false');
                }

                if (name === 'aframePmndrsInscatterEnabled') {
                    envir.scene.aframePmndrsInscatterEnabled = !(resource === false || resource === 'false');
                }

                if (name === 'aframePmndrsGroundEnabled') {
                    envir.scene.aframePmndrsGroundEnabled = !(resource === false || resource === 'false');
                }

                if (name === 'aframePmndrsGroundAlbedo') {
                    envir.scene.aframePmndrsGroundAlbedo = resource || '#f0e6d6';
                }

                if (name === 'aframePmndrsRayleighScale') {
                    var _pmRayleigh = parseFloat(resource);
                    envir.scene.aframePmndrsRayleighScale = isNaN(_pmRayleigh) ? 1.0 : _pmRayleigh;
                }

                if (name === 'aframePmndrsMieScatteringScale') {
                    var _pmMieScat = parseFloat(resource);
                    envir.scene.aframePmndrsMieScatteringScale = isNaN(_pmMieScat) ? 0.9 : _pmMieScat;
                }

                if (name === 'aframePmndrsMieExtinctionScale') {
                    var _pmMieExt = parseFloat(resource);
                    envir.scene.aframePmndrsMieExtinctionScale = isNaN(_pmMieExt) ? 1.0 : _pmMieExt;
                }

                if (name === 'aframePmndrsMiePhaseG') {
                    var _pmMieG = parseFloat(resource);
                    envir.scene.aframePmndrsMiePhaseG = isNaN(_pmMieG) ? 0.8 : _pmMieG;
                }

                if (name === 'aframePmndrsAbsorptionScale') {
                    var _pmAbsorb = parseFloat(resource);
                    envir.scene.aframePmndrsAbsorptionScale = isNaN(_pmAbsorb) ? 1.0 : _pmAbsorb;
                }

                if (name === 'aframePmndrsMoonEnabled') {
                    envir.scene.aframePmndrsMoonEnabled = resource === true || resource === 'true';
                }

                if (name === 'aframeBloomStrength') {
                    envir.scene.aframeBloomStrength = resource || 'off';
                    if (envir.scene.aframePostFXBloomEnabled === false) {
                        envir.scene.aframeBloomStrength = 'off';
                    }
                    envir.scene.aframePostFXBloomEnabled = envir.scene.aframeBloomStrength !== 'off';
                }

                if (name === 'aframeExposurePreset') {
                    envir.scene.aframeExposurePreset = resource || 'neutral';
                }

                if (name === 'aframeContrastPreset') {
                    envir.scene.aframeContrastPreset = resource || 'balanced';
                }

                if (name === 'aframeReflectionProfile') {
                    envir.scene.aframeReflectionProfile = resource || 'balanced';
                }

                if (name === 'aframeReflectionSource') {
                    envir.scene.aframeReflectionSource = resource || 'hdr';
                }

                if (name === 'aframeHorizonSkyPreset') {
                    envir.scene.aframeHorizonSkyPreset = resource || 'natural';
                }

                if (name === 'aframeEnvMapPreset') {
                    envir.scene.aframeEnvMapPreset = resource || 'none';
                }

                if (name === 'backgroundStyleOption'){
                    envir.scene.backgroundStyleOption = parseInt(resource) || 0;
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
                    let presetGroundEnabled = resources3D["backgroundPresetGroundEnabled"] !== false;

                    // Hide all rows first
                    if (horizonSkyRow) horizonSkyRow.style.display = 'none';
                    colorRow.style.display = 'none';
                    presetsRow.style.display = 'none';
                    if (presetGroundRow) presetGroundRow.style.display = 'none';
                    imageRow.style.display = 'none';
                    if (horizonDescription) {
                        horizonDescription.style.display = 'none';
                        horizonDescription.classList.add('tw-hidden');
                    }
                    color_sel.disabled = true;
                    preset_sel.disabled = true;
                    if (preset_ground_toggle) {
                        preset_ground_toggle.disabled = true;
                        preset_ground_toggle.checked = presetGroundEnabled;
                    }
                    if (horizon_sky_preset) {
                        horizon_sky_preset.disabled = true;
                        horizon_sky_preset.value = resources3D["aframeHorizonSkyPreset"] || 'natural';
                    }
                    custom_img_sel.disabled = true;
                    if (typeof setBackgroundPresetGroundEnabled === 'function') {
                        setBackgroundPresetGroundEnabled(presetGroundEnabled);
                    }

                    switch (envir.scene.bcg_selection){
                        case 4:
                            envir.scene.background = null;
                            document.getElementById("sceneNoBackground").checked = true;
                            break;
                        case 0:
                            document.getElementById("sceneHorizon").checked = true;
                            if (horizonDescription) {
                                horizonDescription.style.display = 'block';
                                horizonDescription.classList.remove('tw-hidden');
                            }
                            if (horizon_sky_preset) {
                                horizon_sky_preset.disabled = false;
                            }
                            if (horizonSkyRow) {
                                horizonSkyRow.style.display = 'flex';
                            }
                            break;
                        case 1:
                            document.getElementById("sceneColorRadio").checked = true;
                            color_sel.disabled = false;
                            colorRow.style.display = 'flex';
                            break;
                        case 2:
                            document.getElementById("sceneSky").checked = true;
                            preset_sel.disabled = false;
                            presetsRow.style.display = 'flex';
                            if (preset_ground_toggle) preset_ground_toggle.disabled = false;
                            if (presetGroundRow) presetGroundRow.style.display = 'flex';
                            envir.scene.backgroundPresetOption = resources3D["backgroundPresetOption"];
                            for(let index = 0; index < preset_sel.options.length;index++){
                                if(preset_sel.options[index].value == resources3D["backgroundPresetOption"] ){
                                    preset_sel.options[index].selected = true;
                                }
                            }
                            break;
                        case 3:
                            document.getElementById("sceneCustomImage").checked = true;
                            custom_img_sel.disabled = false;
                            imageRow.style.display = 'flex';
                            if (resources3D["backgroundImagePath"]  && resources3D["backgroundImagePath"] !=0 ){
                                img_thumb.src = resources3D["backgroundImagePath"];
                                img_thumb.hidden = false;
                            }
                            break;
                    }
                    envir.scene.img_bcg_path = resources3D["backgroundImagePath"];
                    envir.scene.backgroundStyleOption = resources3D["backgroundStyleOption"];
                }
                   
                if (name === 'ClearColor' || name === 'enableEnvironmentTexture')
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
                                object.isSelectableMesh = false;
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

                                            if (finalObject.children === '') {
                                                finalObject.children = [];
                                            }

                                            envir.scene.add(finalObject);
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
                    else if (name =="SceneSettings") {

                      
                       if (resource.enableGeneralChat) {
                            document.getElementById("enableGeneralChatCheckbox").checked = resource.enableGeneralChat;
                            envir.scene.enableGeneralChat = resource.enableGeneralChat;
                        }

                        if (resource.enableAvatar) {
                            document.getElementById("enableAvatarCheckbox").checked = resource.enableAvatar;
                            envir.scene.enableAvatar = resource.enableAvatar;
                        }

                        if (resource.disableMovement){
                            document.getElementById("moveDisableCheckbox").checked = resource.disableMovement;
                            envir.scene.disableMovement = resource.disableMovement;
                        }

                        envir.scene.aframeCollisionMode = resource.aframeCollisionMode || 'auto';
                        let collisionToggle = document.getElementById('aframeCollisionModeCheckbox');
                        if (collisionToggle) {
                            collisionToggle.checked = envir.scene.aframeCollisionMode !== 'off';
                        }

                        envir.scene.aframeRenderQuality = resource.aframeRenderQuality || 'standard';
                        envir.scene.aframeShadowQuality = resource.aframeShadowQuality || 'medium';
                        envir.scene.aframeAAQuality = resource.aframeAAQuality || 'balanced';
                        envir.scene.aframeFPSMeterEnabled = resource.aframeFPSMeterEnabled === true || resource.aframeFPSMeterEnabled === 'true';
                        envir.scene.aframeAmbientOcclusionPreset = resource.aframeAmbientOcclusionPreset || 'balanced';
                        envir.scene.aframeContactShadowPreset = resource.aframeContactShadowPreset || 'soft';
                        envir.scene.aframePostFXEnabled = resource.aframePostFXEnabled === true || resource.aframePostFXEnabled === 'true';
                        envir.scene.aframePostFXBloomEnabled = !(resource.aframePostFXBloomEnabled === false || resource.aframePostFXBloomEnabled === 'false');
                        envir.scene.aframePostFXColorEnabled = !(resource.aframePostFXColorEnabled === false || resource.aframePostFXColorEnabled === 'false');
                        envir.scene.aframePostFXVignetteEnabled = false;
                        envir.scene.aframePostFXEdgeAAEnabled = !(resource.aframePostFXEdgeAAEnabled === false || resource.aframePostFXEdgeAAEnabled === 'false');
                        envir.scene.aframePostFXEdgeAAStrength = resource.aframePostFXEdgeAAStrength || 3;
                        envir.scene.aframePostFXTAAEnabled = resource.aframePostFXTAAEnabled === true || resource.aframePostFXTAAEnabled === 'true';
                        envir.scene.aframePostFXSSREnabled = resource.aframePostFXSSREnabled === true || resource.aframePostFXSSREnabled === 'true';
                        envir.scene.aframePostFXSSRStrength = resource.aframePostFXSSRStrength || 'off';
                        envir.scene.aframePostFXEngine = (resource.aframePostFXEngine === 'pmndrs') ? 'pmndrs' : 'legacy';
                        envir.scene.aframePmndrsAAMode = (resource.aframePmndrsAAMode === 'none' || resource.aframePmndrsAAMode === 'smaa' || resource.aframePmndrsAAMode === 'msaa')
                            ? resource.aframePmndrsAAMode
                            : 'inherit';
                        envir.scene.aframePmndrsAAPreset = (resource.aframePmndrsAAPreset === 'low' || resource.aframePmndrsAAPreset === 'medium' || resource.aframePmndrsAAPreset === 'high' || resource.aframePmndrsAAPreset === 'ultra')
                            ? resource.aframePmndrsAAPreset
                            : 'inherit';
                        var _resLhs = parseFloat(resource.aframeLegacyHorizonStageSize);
                        envir.scene.aframeLegacyHorizonStageSize = isNaN(_resLhs) ? 5000 : Math.max(500, Math.min(8000, _resLhs));
                        var _resPmBI = parseFloat(resource.aframePmndrsBloomIntensity);
                        envir.scene.aframePmndrsBloomIntensity = isNaN(_resPmBI) ? 1.0 : _resPmBI;
                        var _resPmBT = parseFloat(resource.aframePmndrsBloomThreshold);
                        envir.scene.aframePmndrsBloomThreshold = isNaN(_resPmBT) ? 0.62 : _resPmBT;
                        envir.scene.aframePmndrsVignetteEnabled = resource.aframePmndrsVignetteEnabled === true || resource.aframePmndrsVignetteEnabled === 'true';
                        var _resPmVD = parseFloat(resource.aframePmndrsVignetteDarkness);
                        envir.scene.aframePmndrsVignetteDarkness = isNaN(_resPmVD) ? 0.5 : _resPmVD;
                        var _resPmTE = parseFloat(resource.aframePmndrsToneMappingExposure);
                        envir.scene.aframePmndrsToneMappingExposure = isNaN(_resPmTE) ? 1.0 : _resPmTE;
                        envir.scene.aframePmndrsAtmosphereEnabled = !(resource.aframePmndrsAtmosphereEnabled === false || resource.aframePmndrsAtmosphereEnabled === 'false');
                        envir.scene.aframePmndrsAtmosphereQuality = resource.aframePmndrsAtmosphereQuality || 'balanced';
                        var _resPmSunEl = parseFloat(resource.aframePmndrsSunElevationDeg);
                        envir.scene.aframePmndrsSunElevationDeg = isNaN(_resPmSunEl) ? 10 : _resPmSunEl;
                        var _resPmSunAz = parseFloat(resource.aframePmndrsSunAzimuthDeg);
                        envir.scene.aframePmndrsSunAzimuthDeg = isNaN(_resPmSunAz) ? 38 : _resPmSunAz;
                        var _resPmSunDistance = parseFloat(resource.aframePmndrsSunDistance);
                        envir.scene.aframePmndrsSunDistance = isNaN(_resPmSunDistance) ? 5200 : _resPmSunDistance;
                        var _resPmSunRadius = parseFloat(resource.aframePmndrsSunAngularRadius);
                        envir.scene.aframePmndrsSunAngularRadius = isNaN(_resPmSunRadius) ? 0.0068 : _resPmSunRadius;
                        var _resPmAerial = parseFloat(resource.aframePmndrsAerialStrength);
                        envir.scene.aframePmndrsAerialStrength = isNaN(_resPmAerial) ? 0.85 : _resPmAerial;
                        var _resPmAlbedo = parseFloat(resource.aframePmndrsAlbedoScale);
                        envir.scene.aframePmndrsAlbedoScale = isNaN(_resPmAlbedo) ? 0.96 : _resPmAlbedo;
                        envir.scene.aframePmndrsTransmittanceEnabled = !(resource.aframePmndrsTransmittanceEnabled === false || resource.aframePmndrsTransmittanceEnabled === 'false');
                        envir.scene.aframePmndrsInscatterEnabled = !(resource.aframePmndrsInscatterEnabled === false || resource.aframePmndrsInscatterEnabled === 'false');
                        envir.scene.aframePmndrsGroundEnabled = !(resource.aframePmndrsGroundEnabled === false || resource.aframePmndrsGroundEnabled === 'false');
                        envir.scene.aframePmndrsGroundAlbedo = resource.aframePmndrsGroundAlbedo || '#f0e6d6';
                        var _resPmRayleigh = parseFloat(resource.aframePmndrsRayleighScale);
                        envir.scene.aframePmndrsRayleighScale = isNaN(_resPmRayleigh) ? 1.0 : _resPmRayleigh;
                        var _resPmMieScat = parseFloat(resource.aframePmndrsMieScatteringScale);
                        envir.scene.aframePmndrsMieScatteringScale = isNaN(_resPmMieScat) ? 0.9 : _resPmMieScat;
                        var _resPmMieExt = parseFloat(resource.aframePmndrsMieExtinctionScale);
                        envir.scene.aframePmndrsMieExtinctionScale = isNaN(_resPmMieExt) ? 1.0 : _resPmMieExt;
                        var _resPmMieG = parseFloat(resource.aframePmndrsMiePhaseG);
                        envir.scene.aframePmndrsMiePhaseG = isNaN(_resPmMieG) ? 0.8 : _resPmMieG;
                        var _resPmAbsorb = parseFloat(resource.aframePmndrsAbsorptionScale);
                        envir.scene.aframePmndrsAbsorptionScale = isNaN(_resPmAbsorb) ? 1.0 : _resPmAbsorb;
                        envir.scene.aframePmndrsMoonEnabled = resource.aframePmndrsMoonEnabled === true || resource.aframePmndrsMoonEnabled === 'true';
                        envir.scene.aframeBloomStrength = resource.aframeBloomStrength || 'off';
                        if (envir.scene.aframePostFXBloomEnabled === false) {
                            envir.scene.aframeBloomStrength = 'off';
                        }
                        envir.scene.aframePostFXBloomEnabled = envir.scene.aframeBloomStrength !== 'off';
                        envir.scene.aframeExposurePreset = resource.aframeExposurePreset || 'neutral';
                        envir.scene.aframeContrastPreset = resource.aframeContrastPreset || 'balanced';
                        envir.scene.aframeReflectionProfile = resource.aframeReflectionProfile || 'balanced';
                        envir.scene.aframeReflectionSource = resource.aframeReflectionSource || 'hdr';
                        envir.scene.aframeHorizonSkyPreset = resource.aframeHorizonSkyPreset || 'natural';
                        envir.scene.aframeEnvMapPreset = resource.aframeEnvMapPreset || 'none';

                        if (typeof syncCompileDialogFromSceneSettings === 'function') {
                            syncCompileDialogFromSceneSettings();
                        }
                       

                        if (resource.fogCategory){
                            //document.getElementById('FogType').value = resource.fogtype;

                            let linear_elems = document.getElementsByClassName('linearElement');
                            let expo_elems = document.getElementsByClassName('exponentialElement');
                            let color_elems = document.getElementsByClassName('colorElement');
                            
                            

                            if (resource.fogCategory === "0") {
                                document.getElementById('RadioNoFog').checked = true;
                                document.getElementById('FogType').value = "none";
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
                            } else if ( resource.fogCategory === "1") {
                                document.getElementById('RadioLinearFog').checked = true;
                                document.getElementById('FogType').value = "linear";
                                document.getElementById('jscolorpickFog').jscolor.fromString("#" + resource.fogcolor);
                                document.getElementById('FogNear').value = JSON.parse(resource.fognear);
                                document.getElementById('FogFar').value = JSON.parse(resource.fogfar);
                                for (let i = 0; i < linear_elems.length; ++i) {
                                    linear_elems[i].style.display="flex";
                                }
                                for (let i = 0; i < expo_elems.length; ++i) {
                                    expo_elems[i].style.display="none";
                                }
                                for (let i = 0; i < color_elems.length; ++i) {
                                    color_elems[i].style.display="flex";
                                }
                                document.getElementById("FogValues").style.display="flex";
                            } else if ( resource.fogCategory === "2") {
                                document.getElementById('FogType').value = "exponential";
                                document.getElementById('RadioExponentialFog').checked =true;
                                document.getElementById('FogDensity').value = JSON.parse(resource.fogdensity);
                                document.getElementById('jscolorpickFog').jscolor.fromString("#" + resource.fogcolor);
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
                            }
                        }
                        else{
                            document.getElementById('RadioNoFog').checked = true;
                        }
                        if (resource.fogcolor){
                            document.getElementById('jscolorpickFog').jscolor.fromString("#" + resource.fogcolor);
                        }
                        if (resource.fogfar){
                            document.getElementById('FogFar').value = resource.fogfar;
                        }
                        if (resource.fognear){
                            document.getElementById('FogNear').value = resource.fognear;
                        }
                        if (resource.fogdensity){
                            document.getElementById('FogDensity').value = resource.fogdensity;
                        }

                        //updateFog("undo");

                        {
                            envir.scene.backgroundStyleOption = (resource.backgroundStyleOption !== undefined) ? parseInt(resource.backgroundStyleOption) || 0 : 0;
                         
                              
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
                            let presetGroundEnabled = resource.backgroundPresetGroundEnabled !== false;

                            // Hide all rows first
                            if (horizonSkyRow) horizonSkyRow.style.display = 'none';
                            colorRow.style.display = 'none';
                            presetsRow.style.display = 'none';
                            if (presetGroundRow) presetGroundRow.style.display = 'none';
                            imageRow.style.display = 'none';
                            if (horizonDescription) {
                                horizonDescription.style.display = 'none';
                                horizonDescription.classList.add('tw-hidden');
                            }
                            color_sel.disabled = true;
                            preset_sel.disabled = true;
                            if (preset_ground_toggle) {
                                preset_ground_toggle.disabled = true;
                                preset_ground_toggle.checked = presetGroundEnabled;
                            }
                            if (horizon_sky_preset) {
                                horizon_sky_preset.disabled = true;
                                horizon_sky_preset.value = resource.aframeHorizonSkyPreset || 'natural';
                            }
                            custom_img_sel.disabled = true;
                            if (typeof setBackgroundPresetGroundEnabled === 'function') {
                                setBackgroundPresetGroundEnabled(presetGroundEnabled);
                            }

                    switch (envir.scene.backgroundStyleOption){
                        case 4:
                            envir.scene.background = null;
                            document.getElementById("sceneNoBackground").checked = true;
                            break;
                        case 0:
                            document.getElementById("sceneHorizon").checked = true;
                            if (horizonDescription) {
                                horizonDescription.style.display = 'block';
                                horizonDescription.classList.remove('tw-hidden');
                            }
                            if (horizon_sky_preset) {
                                        horizon_sky_preset.disabled = false;
                                    }
                                    if (horizonSkyRow) {
                                        horizonSkyRow.style.display = 'flex';
                                    }
                                    let hex = rgbToHex(255, 255, 255);
                                    envir.scene.background = new THREE.Color(hex);
                                    break;
                                case 1:
                                    document.getElementById("sceneColorRadio").checked = true;
                                    color_sel.disabled = false;
                                    colorRow.style.display = 'flex';
                                    break;
                                case 2:
                                    document.getElementById("sceneSky").checked = true;
                                    preset_sel.disabled = false;
                                    presetsRow.style.display = 'flex';
                                    if (preset_ground_toggle) preset_ground_toggle.disabled = false;
                                    if (presetGroundRow) presetGroundRow.style.display = 'flex';
                                    envir.scene.backgroundPresetOption = resource.backgroundPresetOption;
                                    envir.scene.preset_selection = resource.backgroundPresetOption;
                                    for(let index = 0; index < preset_sel.options.length;index++){
                                        if(preset_sel.options[index].value == resource.backgroundPresetOption){
                                            preset_sel.options[index].selected = true;
                                        }
                                    }
                                    break;
                                case 3:
                                    document.getElementById("sceneCustomImage").checked = true;
                                    custom_img_sel.disabled = false;
                                    imageRow.style.display = 'flex';
                                    if (resource.backgroundImagePath  && resource.backgroundImagePath !=0 ){
                                        img_thumb.src = resource.backgroundImagePath;
                                        img_thumb.hidden = false;
                                    }
                                    break;
                            }
                            envir.scene.img_bcg_path = resource.backgroundImagePath;
                            envir.scene.bcg_selection = parseInt(resource.backgroundStyleOption) || 0;
                            envir.scene.backgroundStyleOption = envir.scene.bcg_selection;
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
