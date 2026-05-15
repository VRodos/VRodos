'use strict';

VRODOS.utils.sceneResolveObjectPath = function(value, UPLOAD_DIR) {
    let explicitPath = value && typeof value.path === 'string' ? value.path.trim() : '';
    
    // Recursive cleaning of junk from explicitPath
    if (explicitPath !== '') {
        while (/https?:\/\//i.test(explicitPath) && explicitPath.lastIndexOf('http') > 0) {
            explicitPath = explicitPath.substring(explicitPath.lastIndexOf('http'));
        }
    }

    if (explicitPath !== '' && (/^https?:\/\//i.test(explicitPath) || explicitPath.startsWith('//'))) {
        return explicitPath;
    }

    let fnPath = value && typeof value.fnPath === 'string' ? value.fnPath.trim() : '';
    if (fnPath === '') {
        return '';
    }

    // Defensive check: if fnPath already contains multiple URLs, strip to the last one
    while (/https?:\/\//i.test(fnPath) && fnPath.lastIndexOf('http') > 0) {
        fnPath = fnPath.substring(fnPath.lastIndexOf('http'));
    }

    // If it's now a clean full URL or starts with uploads/, return it
    if (/^https?:\/\//i.test(fnPath) || fnPath.startsWith('//') || fnPath.startsWith('uploads/')) {
        return fnPath;
    }

    // One more cleaning: if fnPath starts with UPLOAD_DIR or /wp-content/uploads
    if (UPLOAD_DIR && fnPath.includes(UPLOAD_DIR)) {
        fnPath = fnPath.substring(fnPath.indexOf(UPLOAD_DIR) + UPLOAD_DIR.length);
    } else if (fnPath.includes('wp-content/uploads')) {
        const idx = fnPath.indexOf('wp-content/uploads') + 18;
        fnPath = fnPath.substring(idx);
    }
    
    // Final check for accidental doubling of 'uploads' string without slash
    if (fnPath.startsWith('uploads')) {
        fnPath = fnPath.substring(7);
    }

    // Ensure no leading slashes before we join
    while (fnPath.startsWith('/')) {
        fnPath = fnPath.substring(1);
    }

    if (fnPath === '') return '';

    // Join with UPLOAD_DIR
    const separator = UPLOAD_DIR.endsWith('/') ? '' : '/';
    return UPLOAD_DIR + separator + fnPath;
};
VRODOS.utils.sceneUniqueObjectName = function(name, existingObjects) {
    let uniqueName = name;
    let suffix = 2;

    while (Object.prototype.hasOwnProperty.call(existingObjects, uniqueName)) {
        uniqueName = `${name  }_${  suffix}`;
        suffix++;
    }

    return uniqueName;
};
VRODOS.exporter.SceneExporter = class {
    parse(scene) {
        const output = {
            metadata: {
                formatVersion: 4.0,
                type: 'scene',
                generatedBy: 'VRODOS.exporter.SceneExporter.js',
                timestamp: Date.now(),
                objects: 0,
            },
            urlBaseType: 'relativeToScene',
            objects: {},
        };

        // Populate metadata using the centralized schema
        const schema = VRODOS.config.SCENE_SETTINGS_SCHEMA || {};
        for (const [key, config] of Object.entries(schema)) {
            const envirKey = config.envirKey;
            let value = VRODOS.editor.envir.scene[envirKey];

            // Special handling for legacy keys or specific logic
            if (key === 'ClearColor') {
                value = scene.background ? `#${  scene.background.getHexString()}` : '#000000';
            } else if (key === 'fogtype') {
                value = (VRODOS.editor.envir.scene.fogCategory === 1) ? 'linear' : (VRODOS.editor.envir.scene.fogCategory === 2 ? 'exponential' : 'none');
            } else if (key === 'backgroundImagePath') {
                value = VRODOS.editor.envir.scene.img_bcg_path || '0';
            } else if (key === 'aframeNavigationMode') {
                value = ['walk', 'walkable', 'fly'].includes(value)
                    ? value
                    : (VRODOS.editor.envir.scene.aframeCollisionMode === 'off' ? 'walk' : 'walkable');
            } else if (key === 'aframeCollisionMode') {
                const navigationMode = ['walk', 'walkable', 'fly'].includes(VRODOS.editor.envir.scene.aframeNavigationMode)
                    ? VRODOS.editor.envir.scene.aframeNavigationMode
                    : (value === 'off' ? 'walk' : 'walkable');
                value = navigationMode === 'walkable' ? 'auto' : 'off';
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

        const exportedDuplicateKeys = new Map();
        const skippedDuplicateObjects = [];

        scene.traverse(node => {
            if (
                node.vrodos_internal_helper === true ||
                (typeof VRODOS.utils.isEditorInternalObject === 'function' && VRODOS.utils.isEditorInternalObject(node))
            ) {
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
                const duplicateKey = typeof VRODOS.utils.sceneObjectDuplicateKey === 'function'
                    ? VRODOS.utils.sceneObjectDuplicateKey(objectData)
                    : '';
                if (duplicateKey) {
                    if (exportedDuplicateKeys.has(duplicateKey)) {
                        skippedDuplicateObjects.push({
                            name: node.name,
                            original: exportedDuplicateKeys.get(duplicateKey)
                        });
                        return;
                    }
                    exportedDuplicateKeys.set(duplicateKey, node.name);
                }

                const baseName = VRODOS.utils.sceneSafeObjectName(node, output.metadata.objects);
                const safeName = VRODOS.utils.sceneUniqueObjectName(baseName, output.objects);
                node.name = safeName;
                output.objects[safeName] = objectData;
                output.metadata.objects++;
            }
        });

        if (skippedDuplicateObjects.length > 0) {
            console.warn('VRodos: skipped duplicate scene objects during export', skippedDuplicateObjects);
        }

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
            'isGroup',
            'path',
            'follow_camera',
            'follow_camera_x',
            'follow_camera_z'
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

        entryObject.position = VRODOS.utils.sceneSafeVector([o.position.x, o.position.y, o.position.z], [0, 0, 0]);
        entryObject.rotation = VRODOS.utils.sceneSafeVector([o.rotation.x, o.rotation.y, o.rotation.z], [0, 0, 0]);
        entryObject.scale = VRODOS.utils.sceneSafeScale([o.scale.x, o.scale.y, o.scale.z]);

        if (o.quaternion) {
            const quatR = new THREE.Quaternion();
            const eulerR = new THREE.Euler(entryObject.rotation[0], -entryObject.rotation[1], -entryObject.rotation[2], 'XYZ');
            quatR.setFromEuler(eulerR);
            entryObject.quaternion = [quatR.x, quatR.y, quatR.z, quatR.w];
        }

        if (o.isLight && o.category_name && o.category_name.includes('light')) {
            this.processLight(o, entryObject);
        } else if (o.name === 'avatarCamera') {
            this.processAvatar(o, entryObject);
        } else if (VRODOS.utils.isAssessmentResource(entryObject)) {
            this.processAssessment(o, entryObject);
            if (!VRODOS.utils.hasCompleteAssessmentMetadata(entryObject)) {
                console.warn('VRodos: skipped incomplete assessment object during export', {
                    name: o.name,
                    asset_id: entryObject.asset_id || '',
                    assessment_source_id: entryObject.assessment_source_id || ''
                });
                return null;
            }
        }

        return entryObject;
    }

    processAssessment(o, entryObject) {
        const sourceId = String(o.assessment_source_id || entryObject.assessment_source_id || '').trim();

        entryObject.category_name = 'assessment';
        entryObject.category_slug = 'assessment';
        entryObject.asset_name = VRODOS.utils.decodeDisplayText(o.asset_name || o.assessment_title || entryObject.asset_name || 'Assessment');
        entryObject.assessment_title = VRODOS.utils.decodeDisplayText(o.assessment_title || o.asset_name || entryObject.assessment_title || 'Assessment');
        entryObject.assessment_type = VRODOS.utils.decodeDisplayText(o.assessment_type || entryObject.assessment_type || '');
        entryObject.assessment_group = VRODOS.utils.decodeDisplayText(o.assessment_group || entryObject.assessment_group || '');
        entryObject.assessment_source_id = sourceId;
        entryObject.assessment_content = o.assessment_content || entryObject.assessment_content || '';
        entryObject.assessment_levels = typeof VRODOS.utils.encodeAssessmentLevelsForScene === 'function'
            ? VRODOS.utils.encodeAssessmentLevelsForScene(o.assessment_levels || entryObject.assessment_levels || '')
            : (entryObject.assessment_levels || '');
        entryObject.assessment_supported = String(o.assessment_supported || entryObject.assessment_supported || 'false');

        if (sourceId || o.immerse_managed || entryObject.immerse_managed) {
            entryObject.immerse_managed = String(o.immerse_managed || entryObject.immerse_managed || 'true');
            entryObject.immerse_object_type = String(o.immerse_object_type || entryObject.immerse_object_type || 'assessment');
        }
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
        const quatCombined = new THREE.Quaternion();
        const pitchRotation = VRODOS.utils.sceneSafeNumber(o.rotation.x, 0);
        const yawRotation = VRODOS.utils.sceneSafeNumber(o.rotation.y, 0);
        const camEulerCombined = new THREE.Euler(-pitchRotation, (Math.PI - yawRotation) % (2 * Math.PI), 0, 'YXZ');
        quatCombined.setFromEuler(camEulerCombined);

        const quatR_player = new THREE.Quaternion();
        const eulerR_player = new THREE.Euler(0, (Math.PI - yawRotation) % (2 * Math.PI), 0, 'YXZ');
        quatR_player.setFromEuler(eulerR_player);

        const quatR_camera = new THREE.Quaternion();
        const eulerR_camera = new THREE.Euler(-pitchRotation, 0, 0, 'YXZ');
        quatR_camera.setFromEuler(eulerR_camera);

        entryObject.rotation = [pitchRotation, yawRotation, 0];
        entryObject.quaternion = [quatCombined.x, quatCombined.y, quatCombined.z, quatCombined.w];
        entryObject.quaternion_player = [quatR_player.x, quatR_player.y, quatR_player.z, quatR_player.w];
        entryObject.quaternion_camera = [quatR_camera.x, quatR_camera.y, quatR_camera.z, quatR_camera.w];
        entryObject.category_name = 'avatarYawObject';
    }
};
VRODOS.importer.SceneImporter = class {
    parse(scene_json, UPLOAD_DIR) {
        if (scene_json.length === 0) {
            return {};
        }

        const resources3D_new = {};
        const scene_json_obj = JSON.parse(scene_json);
        const scene_json_metadata = scene_json_obj.metadata;

        resources3D_new.SceneSettings = {};
        resources3D_new.cameraCoords = {};

        const schema = VRODOS.config.SCENE_SETTINGS_SCHEMA || {};
        for (const key in scene_json_metadata) {
            if (Object.prototype.hasOwnProperty.call(schema, key)) {
                resources3D_new.SceneSettings[key] = scene_json_metadata[key];
            }
        }

        const scene_objects = scene_json_obj.objects;
        let objectIndex = 0;

        for (const asset_key in scene_objects) {
            const value = scene_objects[asset_key];
            delete value.follow_camera;
            delete value.follow_camera_x;
            delete value.follow_camera_z;

            const name = VRODOS.utils.sceneSafeObjectName({
                name: asset_key,
                asset_slug: value.asset_slug,
                asset_id: value.asset_id,
                uuid: value.uuid
            }, objectIndex);
            objectIndex++;

            value.position = VRODOS.utils.sceneSafeVector(value.position, [0, 0, 0]);
            value.rotation = VRODOS.utils.sceneSafeVector(value.rotation, [0, 0, 0]);
            value.scale = VRODOS.utils.sceneSafeScale(value.scale);

            if (name === 'avatarCamera') {
                resources3D_new.cameraCoords = {
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
                resources3D_new[name].path = VRODOS.utils.sceneResolveObjectPath(value, UPLOAD_DIR);
            }
        }

        return resources3D_new;
    }
};
