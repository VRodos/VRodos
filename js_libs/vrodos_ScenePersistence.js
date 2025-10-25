// Custom Scene Exporter and Importer for VRodos
// This module replicates the logic of the old THREE.SceneExporter (r87)
// and THREE.SceneImporter (r87) using modern JavaScript and Three.js (r147) methods.

class VrodosSceneExporter {
    parse(scene) {
        const output = {
            metadata: {
                formatVersion: 4.0,
                type: 'scene',
                generatedBy: 'VrodosSceneExporter.js',
                timestamp: Date.now(),
                ClearColor: scene.background ? '#' + scene.background.getHexString() : '#000000',
                toneMappingExposure: envir.renderer.toneMappingExposure,
                enableGeneralChat: !!envir.scene.enableGeneralChat,
                fogCategory: envir.scene.fogCategory || 0,
                fogcolor: envir.scene.fogcolor || '#FFFFFF',
                fogfar: envir.scene.fogfar || '1000',
                fognear: envir.scene.fognear || '0',
                fogdensity: envir.scene.fogdensity || '0.00000001',
                enableAvatar: !!envir.scene.enableAvatar,
                disableMovement: !!envir.scene.disableMovement,
                backgroundPresetOption: envir.scene.preset_selection || 'None',
                backgroundStyleOption: envir.scene.bcg_selection || '0',
                backgroundImagePath: envir.scene.img_bcg_path || '0',
                objects: 0,
            },
            urlBaseType: 'relativeToScene',
            objects: {},
        };

        scene.traverse(node => {
            if ((node.name === 'rayLine' ||
                node.name === 'mylightAvatar' ||
                node.name === 'mylightOrbit' ||
                node.name === 'SteveShieldMesh' ||
                node.name === 'Steve' ||
                node.name === 'SteveMesh' || node.name === 'avatarPitchObject' ||
                node.name === 'orbitCamera' || node.name === 'myAxisHelper' ||
                node.name === 'myGridHelper' || node.name === 'myTransformControls' ||
                node.category_name === 'lightHelper' ||
                node.category_name === 'lightTargetSpot' ||
                node.name === 'Camera3Dmodel' ||
                node.name === 'Camera3DmodelMesh' ||
                typeof node.category_name === 'undefined') && node.name !== 'avatarCamera') {
                return;
            }

            if (node instanceof THREE.Mesh && node.category_name !== "pawn") {
                return;
            }

            if (node.name === "bbox" || node.name === "xline" || node.name === "yline" ||
                node.name === "zline" || node.name === 'SteveOld') {
                return;
            }

            const objectData = this.processObject(node);
            if (objectData) {
                output.objects[node.name] = objectData;
                output.metadata.objects++;
            }
        });

        return JSON.stringify(output);
    }

    processObject(o) {
        const ignoredKeys = ['matrixAutoUpdate', 'matrixWorldNeedsUpdate', 'visible', 'castShadow', 'receiveShadow', 'frustumCulled', 'renderOrder', 'draggable', 'class', 'isGroup'];

        const entryObject = {};

        for (const key in o) {
            if (typeof o[key] !== 'object' && !ignoredKeys.includes(key)) {
                entryObject[key] = o[key];
            }
        }

        entryObject.fnPath = o.fnPath ? o.fnPath : '';

        entryObject.position = [o.position.x, o.position.y, o.position.z];
        entryObject.rotation = [o.rotation.x, o.rotation.y, o.rotation.z];
        entryObject.scale = [o.scale.x, o.scale.y, o.scale.z];

        if (o.quaternion) {
            let quatR = new THREE.Quaternion();
            let eulerR = new THREE.Euler(o.rotation.x, -o.rotation.y, -o.rotation.z, 'XYZ');
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
        let camEulerCombined = new THREE.Euler(-o.children[0].rotation.x, (Math.PI - o.rotation.y) % (2 * Math.PI), 0, 'YXZ');
        quatCombined.setFromEuler(camEulerCombined);

        let quatR_player = new THREE.Quaternion();
        let eulerR_player = new THREE.Euler(0, (Math.PI - o.rotation.y) % (2 * Math.PI), 0, 'YXZ');
        quatR_player.setFromEuler(eulerR_player);

        let quatR_camera = new THREE.Quaternion();
        let eulerR_camera = new THREE.Euler(-o.children[0].rotation.x, 0, 0, 'YXZ');
        quatR_camera.setFromEuler(eulerR_camera);

        entryObject.rotation = [o.children[0].rotation.x, o.rotation.y, 0];
        entryObject.quaternion = [quatCombined.x, quatCombined.y, quatCombined.z, quatCombined.w];
        entryObject.quaternion_player = [quatR_player.x, quatR_player.y, quatR_player.z, quatR_player.w];
        entryObject.quaternion_camera = [quatR_camera.x, quatR_camera.y, quatR_camera.z, quatR_camera.w];
        entryObject.category_name = 'avatarYawObject';
    }
}


class VrodosSceneImporter {
    parse(scene_json, UPLOAD_DIR) {
        if (scene_json.length === 0) {
            return [];
        }

        const resources3D_new = [];
        const scene_json_obj = JSON.parse(scene_json);
        const scene_json_metadata = scene_json_obj['metadata'];

        resources3D_new["SceneSettings"] = {};
        resources3D_new["cameraCoords"] = {};

        for (const key in scene_json_metadata) {
            const value = scene_json_metadata[key];
            if (['ClearColor', 'disableMovement', 'enableGeneralChat', 'enableAvatar', 'backgroundPresetOption', 'backgroundStyleOption', 'backgroundImagePath', 'fogtype', 'fogCategory', 'fogcolor', 'fogfar', 'fognear', 'fogdensity'].includes(key)) {
                resources3D_new["SceneSettings"][key] = value;
            }
        }

        const scene_objects = scene_json_obj['objects'];

        for (const asset_key in scene_objects) {
            const name = asset_key;
            const value = scene_objects[asset_key];

            if (name === 'avatarCamera') {
                resources3D_new["cameraCoords"] = {
                    position: value.position,
                    rotation: value.rotation,
                };
                continue;
            }

            resources3D_new[name] = value;

            resources3D_new[name].trs = {
                translation: [value['position'][0], value['position'][1], value['position'][2]],
                rotation: [value['rotation'][0], value['rotation'][1], value['rotation'][2]],
                scale: value['scale'][0],
            };

            if (!['lightsun', 'lightSpot', 'lightAmbient', 'Pawn', 'lightLamp'].some(el => name.includes(el))) {
                resources3D_new[name].path = UPLOAD_DIR + value['fnPath'];
                resources3D_new[name].trs.scale = [value['scale'][0], value['scale'][1], value['scale'][2]];
            }
        }

        return resources3D_new;
    }
}
