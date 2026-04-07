// Custom Scene Exporter and Importer for VRodos
// This module keeps the legacy VRodos scene JSON contract while using the
// current active Three.js runtime and editor object model.

function vrodosSceneSafeNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function vrodosSceneSafeVector(values, fallback) {
    const safeFallback = Array.isArray(fallback) ? fallback : [0, 0, 0];
    const source = Array.isArray(values) ? values : safeFallback;

    return [
        vrodosSceneSafeNumber(source[0], safeFallback[0]),
        vrodosSceneSafeNumber(source[1], safeFallback[1]),
        vrodosSceneSafeNumber(source[2], safeFallback[2])
    ];
}

function vrodosSceneSafeScale(values) {
    return vrodosSceneSafeVector(values, [1, 1, 1]);
}

function vrodosSceneResolveObjectPath(value, UPLOAD_DIR) {
    const explicitPath = value && typeof value.path === 'string' ? value.path.trim() : '';
    if (explicitPath !== '') {
        return explicitPath;
    }

    const fnPath = value && typeof value.fnPath === 'string' ? value.fnPath.trim() : '';
    if (fnPath === '') {
        return '';
    }

    if (/^https?:\/\//i.test(fnPath) || fnPath.startsWith('uploads/')) {
        return fnPath;
    }

    return UPLOAD_DIR + fnPath;
}

function vrodosSceneSafeObjectName(node, fallbackIndex) {
    const currentName = node && typeof node.name === 'string' ? node.name.trim() : '';
    if (currentName !== '') {
        return currentName;
    }

    const slugPart = node && node.asset_slug ? String(node.asset_slug).trim() : '';
    const idPart = node && node.asset_id ? String(node.asset_id).trim() : '';
    const uuidPart = node && node.uuid ? String(node.uuid).split('-')[0] : String(fallbackIndex || Date.now());
    const fallbackName = (slugPart || 'scene_object') + (idPart ? '_' + idPart : '') + '_' + uuidPart;

    if (node) {
        node.name = fallbackName;
    }

    return fallbackName;
}

function vrodosSceneUniqueObjectName(name, existingObjects) {
    let uniqueName = name;
    let suffix = 2;

    while (Object.prototype.hasOwnProperty.call(existingObjects, uniqueName)) {
        uniqueName = name + '_' + suffix;
        suffix++;
    }

    return uniqueName;
}

class VrodosSceneExporter {
    parse(scene) {
        const output = {
            metadata: {
                formatVersion: 4.0,
                type: 'scene',
                generatedBy: 'VrodosSceneExporter.js',
                timestamp: Date.now(),
                ClearColor: scene.background ? '#' + scene.background.getHexString() : '#000000',
                enableGeneralChat: envir.scene.enableGeneralChat === true,
                fogCategory: envir.scene.fogCategory || 0,
                fogtype: (envir.scene.fogCategory === 1) ? 'linear' : (envir.scene.fogCategory === 2 ? 'exponential' : 'none'),
                fogcolor: envir.scene.fogcolor || '#FFFFFF',
                fogfar: envir.scene.fogfar || '1000',
                fognear: envir.scene.fognear || '0',
                fogdensity: envir.scene.fogdensity || '0.00000001',
                enableAvatar: envir.scene.enableAvatar === true,
                disableMovement: envir.scene.disableMovement === true,
                aframeCollisionMode: envir.scene.aframeCollisionMode || 'auto',
                aframeRenderQuality: envir.scene.aframeRenderQuality || 'standard',
                aframeShadowQuality: envir.scene.aframeShadowQuality || 'medium',
                aframeAAQuality: envir.scene.aframeAAQuality || 'balanced',
                aframeFPSMeterEnabled: envir.scene.aframeFPSMeterEnabled === true,
                aframeAmbientOcclusionPreset: envir.scene.aframeAmbientOcclusionPreset || 'balanced',
                aframeContactShadowPreset: envir.scene.aframeContactShadowPreset || 'soft',
                aframePostFXEnabled: envir.scene.aframePostFXEnabled === true,
                aframePostFXBloomEnabled: (envir.scene.aframeBloomStrength || 'off') !== 'off',
                aframePostFXColorEnabled: envir.scene.aframePostFXColorEnabled !== false,
                aframePostFXVignetteEnabled: false,
                aframePostFXEdgeAAEnabled: envir.scene.aframePostFXEdgeAAEnabled !== false,
                aframePostFXEdgeAAStrength: envir.scene.aframePostFXEdgeAAStrength || 3,
                aframePostFXTAAEnabled: envir.scene.aframePostFXTAAEnabled === true,
                aframePostFXSSREnabled: envir.scene.aframePostFXSSREnabled === true,
                aframePostFXSSRStrength: envir.scene.aframePostFXSSRStrength || 'off',
                aframeBloomStrength: envir.scene.aframeBloomStrength || 'off',
                aframeExposurePreset: envir.scene.aframeExposurePreset || 'neutral',
                aframeContrastPreset: envir.scene.aframeContrastPreset || 'balanced',
                aframeReflectionProfile: envir.scene.aframeReflectionProfile || 'balanced',
                aframeReflectionSource: envir.scene.aframeReflectionSource || 'hdr',
                aframeHorizonSkyPreset: envir.scene.aframeHorizonSkyPreset || 'natural',
                aframeEnvMapPreset: envir.scene.aframeEnvMapPreset || 'none',
                // Post-processing engine selector ('legacy' or 'pmndrs')
                aframePostFXEngine: (envir.scene.aframePostFXEngine === 'pmndrs') ? 'pmndrs' : 'legacy',
                // Pmndrs-only tweakable knobs (ignored when aframePostFXEngine === 'legacy')
                aframePmndrsBloomIntensity: (typeof envir.scene.aframePmndrsBloomIntensity === 'number') ? envir.scene.aframePmndrsBloomIntensity : 1.0,
                aframePmndrsBloomThreshold: (typeof envir.scene.aframePmndrsBloomThreshold === 'number') ? envir.scene.aframePmndrsBloomThreshold : 0.62,
                aframePmndrsVignetteEnabled: envir.scene.aframePmndrsVignetteEnabled === true,
                aframePmndrsVignetteDarkness: (typeof envir.scene.aframePmndrsVignetteDarkness === 'number') ? envir.scene.aframePmndrsVignetteDarkness : 0.5,
                aframePmndrsToneMappingExposure: (typeof envir.scene.aframePmndrsToneMappingExposure === 'number') ? envir.scene.aframePmndrsToneMappingExposure : 1.0,
                backgroundPresetOption: envir.scene.backgroundPresetOption || 'None',
                backgroundPresetGroundEnabled: envir.scene.backgroundPresetGroundEnabled !== false,
                backgroundStyleOption: (envir.scene.backgroundStyleOption !== undefined) ? envir.scene.backgroundStyleOption : 0,
                backgroundImagePath: envir.scene.img_bcg_path || '0',
                objects: 0,
            },
            urlBaseType: 'relativeToScene',
            objects: {},
        };

        scene.traverse(node => {
            if (node.vrodos_internal_helper === true) {
                return;
            }

            if ((node.name === 'rayLine' ||
                node.name === 'mylightAvatar' ||
                node.name === 'mylightOrbit' ||
                node.name === 'avatarPitchObject' ||
                node.name === 'orbitCamera' || node.name === 'myAxisHelper' ||
                node.name === 'myGridHelper' || node.name === 'myTransformControls' ||
                node.category_name === 'lightHelper' ||
                node.category_name === 'lightTargetSpot' ||
                node.name === 'Camera3Dmodel' ||
                node.name === 'Camera3DmodelMesh' ||
                typeof node.category_name === 'undefined') && node.name !== 'avatarCamera') {
                return;
            }

            if (node instanceof THREE.Mesh && node.category_name !== "pawn" && node.category_slug !== "image") {
                return;
            }

            if (node.name === "bbox" || node.name === "xline" || node.name === "yline" ||
                node.name === "zline") {
                return;
            }

            const objectData = this.processObject(node);
            if (objectData) {
                const baseName = vrodosSceneSafeObjectName(node, output.metadata.objects);
                const safeName = vrodosSceneUniqueObjectName(baseName, output.objects);
                node.name = safeName;
                output.objects[safeName] = objectData;
                output.metadata.objects++;
            }
        });

        return JSON.stringify(output);
    }

    processObject(o) {
        const ignoredKeys = [
            'matrixAutoUpdate',
            'matrixWorldNeedsUpdate',
            'visible',
            'castShadow',
            'receiveShadow',
            'frustumCulled',
            'renderOrder',
            'draggable',
            'class',
            'id',
            'title',
            'name',
            'isGroup'
        ];

        const entryObject = {};

        for (const key in o) {
            const valueType = typeof o[key];
            if (/^\d+$/.test(key)) {
                continue;
            }

            if (!['string', 'number', 'boolean'].includes(valueType)) {
                continue;
            }

            if (!ignoredKeys.includes(key)) {
                entryObject[key] = o[key];
            }
        }

        entryObject.fnPath = o.fnPath ? o.fnPath : '';

        entryObject.position = vrodosSceneSafeVector([o.position.x, o.position.y, o.position.z], [0, 0, 0]);
        entryObject.rotation = vrodosSceneSafeVector([o.rotation.x, o.rotation.y, o.rotation.z], [0, 0, 0]);
        entryObject.scale = vrodosSceneSafeScale([o.scale.x, o.scale.y, o.scale.z]);

        if (o.quaternion) {
            let quatR = new THREE.Quaternion();
            let eulerR = new THREE.Euler(entryObject.rotation[0], -entryObject.rotation[1], -entryObject.rotation[2], 'XYZ');
            quatR.setFromEuler(eulerR);
            entryObject.quaternion = [quatR.x, quatR.y, quatR.z, quatR.w];
        }

        if (o.category_name && o.category_name.includes('light')) {
            this.processLight(o, entryObject);
        } else if (o.name === 'avatarCamera') {
            this.processAvatar(o, entryObject);
        }

        return entryObject;
    }

    processLight(o, entryObject) {
        entryObject.lightcolor = [o.color.r, o.color.g, o.color.b];
        entryObject.lightintensity = o.intensity;

        if (o.category_name === 'lightSun' || o.category_name === 'lightSpot') {
            entryObject.targetposition = [o.target.position.x, o.target.position.y, o.target.position.z];
        }

        if (o.category_name === 'lightLamp' || o.category_name === 'lightSpot') {
            entryObject.lightdecay = o.decay;
            entryObject.lightdistance = o.distance;
        }

        if (o.category_name === 'lightSpot') {
            entryObject.lightangle = o.angle;
            entryObject.lightpenumbra = o.penumbra;
        }
    }

    processAvatar(o, entryObject) {
        let quatCombined = new THREE.Quaternion();
        const pitchRotation = vrodosSceneSafeNumber(o.rotation.x, 0);
        const yawRotation = vrodosSceneSafeNumber(o.rotation.y, 0);
        let camEulerCombined = new THREE.Euler(-pitchRotation, (Math.PI - yawRotation) % (2 * Math.PI), 0, 'YXZ');
        quatCombined.setFromEuler(camEulerCombined);

        let quatR_player = new THREE.Quaternion();
        let eulerR_player = new THREE.Euler(0, (Math.PI - yawRotation) % (2 * Math.PI), 0, 'YXZ');
        quatR_player.setFromEuler(eulerR_player);

        let quatR_camera = new THREE.Quaternion();
        let eulerR_camera = new THREE.Euler(-pitchRotation, 0, 0, 'YXZ');
        quatR_camera.setFromEuler(eulerR_camera);

        entryObject.rotation = [pitchRotation, yawRotation, 0];
        entryObject.quaternion = [quatCombined.x, quatCombined.y, quatCombined.z, quatCombined.w];
        entryObject.quaternion_player = [quatR_player.x, quatR_player.y, quatR_player.z, quatR_player.w];
        entryObject.quaternion_camera = [quatR_camera.x, quatR_camera.y, quatR_camera.z, quatR_camera.w];
        entryObject.category_name = 'avatarYawObject';
    }
}


class VrodosSceneImporter {
    parse(scene_json, UPLOAD_DIR) {
        if (scene_json.length === 0) {
            return {};
        }

        const resources3D_new = {};
        const scene_json_obj = JSON.parse(scene_json);
        const scene_json_metadata = scene_json_obj['metadata'];

        resources3D_new["SceneSettings"] = {};
        resources3D_new["cameraCoords"] = {};

        for (const key in scene_json_metadata) {
            const value = scene_json_metadata[key];
            if (['ClearColor', 'disableMovement', 'enableGeneralChat', 'enableAvatar', 'aframeCollisionMode', 'aframeRenderQuality', 'aframeShadowQuality', 'aframeAAQuality', 'aframeFPSMeterEnabled', 'aframeAmbientOcclusionPreset', 'aframeContactShadowPreset', 'aframePostFXEnabled', 'aframePostFXBloomEnabled', 'aframePostFXColorEnabled', 'aframePostFXVignetteEnabled', 'aframePostFXEdgeAAEnabled', 'aframePostFXEdgeAAStrength', 'aframeBloomStrength', 'aframeExposurePreset', 'aframeContrastPreset', 'aframeReflectionProfile', 'aframeReflectionSource', 'aframeHorizonSkyPreset', 'aframeEnvMapPreset', 'backgroundPresetOption', 'backgroundPresetGroundEnabled', 'backgroundStyleOption', 'backgroundImagePath', 'fogtype', 'fogCategory', 'fogcolor', 'fogfar', 'fognear', 'fogdensity'].includes(key)) {
                resources3D_new["SceneSettings"][key] = value;
            }
        }

        const scene_objects = scene_json_obj['objects'];
        let objectIndex = 0;

        for (const asset_key in scene_objects) {
            const value = scene_objects[asset_key];
            const name = vrodosSceneSafeObjectName({
                name: asset_key,
                asset_slug: value.asset_slug,
                asset_id: value.asset_id,
                uuid: value.uuid
            }, objectIndex);
            objectIndex++;

            value.position = vrodosSceneSafeVector(value.position, [0, 0, 0]);
            value.rotation = vrodosSceneSafeVector(value.rotation, [0, 0, 0]);
            value.scale = vrodosSceneSafeScale(value.scale);

            if (name === 'avatarCamera') {
                resources3D_new["cameraCoords"] = {
                    position: value.position,
                    rotation: value.rotation
                };
                continue;
            }

            resources3D_new[name] = value;
            resources3D_new[name].name = name;

            resources3D_new[name].trs = {
                translation: value.position.slice(0, 3),
                rotation: value.rotation.slice(0, 3),
                scale: value.scale.slice(0, 3),
            };

            if (
                resources3D_new[name].category_slug !== 'assessment' &&
                !['lightsun', 'lightSpot', 'lightAmbient', 'Pawn', 'lightLamp'].some(el => name.includes(el))
            ) {
                resources3D_new[name].path = vrodosSceneResolveObjectPath(value, UPLOAD_DIR);
            }
        }

        return resources3D_new;
    }
}
