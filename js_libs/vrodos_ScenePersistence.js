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
                objects: 0,
            },
            urlBaseType: 'relativeToScene',
            objects: {},
        };

        // Populate metadata using the centralized schema
        for (const [key, config] of Object.entries(VRODOS_SCENE_SETTINGS_SCHEMA)) {
            const envirKey = config.envirKey;
            let value = envir.scene[envirKey];

            // Special handling for legacy keys or specific logic
            if (key === 'ClearColor') {
                value = scene.background ? '#' + scene.background.getHexString() : '#000000';
            } else if (key === 'fogtype') {
                value = (envir.scene.fogCategory === 1) ? 'linear' : (envir.scene.fogCategory === 2 ? 'exponential' : 'none');
            } else if (key === 'backgroundImagePath') {
                value = envir.scene.img_bcg_path || '0';
            }

            // Type-safe assignment with sensible fallbacks
            if (config.type === 'boolean') {
                // Use explicit boolean check or fallback to default
                let boolValue = value;
                if (typeof boolValue !== 'boolean') {
                    boolValue = config.default;
                }
                output.metadata[key] = boolValue;
            } else if (config.type === 'number') {
                output.metadata[key] = (typeof value === 'number') ? value : config.default;
            } else {
                output.metadata[key] = value || config.default;
            }
        }

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

        if (o.isLight && o.category_name && o.category_name.includes('light')) {
            this.processLight(o, entryObject);
        } else if (o.name === 'avatarCamera') {
            this.processAvatar(o, entryObject);
        }

        return entryObject;
    }

    processLight(o, entryObject) {
        if (o.color) {
            entryObject.lightcolor = [o.color.r, o.color.g, o.color.b];
        } else {
            entryObject.lightcolor = [1, 1, 1];
        }
        entryObject.lightintensity = o.intensity;

        if (o.category_name === 'lightSun' || o.category_name === 'lightSpot') {
            if (o.target && o.target.position) {
                entryObject.targetposition = [o.target.position.x, o.target.position.y, o.target.position.z];
            } else {
                entryObject.targetposition = [0, 0, 0];
            }
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
            if (Object.prototype.hasOwnProperty.call(VRODOS_SCENE_SETTINGS_SCHEMA, key)) {
                resources3D_new["SceneSettings"][key] = scene_json_metadata[key];
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
