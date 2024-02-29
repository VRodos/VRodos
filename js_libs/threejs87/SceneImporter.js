'use strict';

// Only for Undo-Redo !
function parseJSON_javascript(scene_json, UPLOAD_DIR) {

    //console.error("Not all properties are supported by undo: 115");

    if (scene_json.length===0)
        return [];

    let resources3D_new = [];

    let scene_json_obj = JSON.parse(scene_json);

    let scene_json_metadata = scene_json_obj['metadata'];

    resources3D_new["SceneSettings"] = {};
    resources3D_new["cameraCoords"] = {};
    
    for (let key in scene_json_metadata) {
        let value = scene_json_metadata[key];
        if (key === 'ClearColor') {
            // resources3D_new["SceneSettings"] = { 'ClearColor': value };
            Object.assign(resources3D_new["SceneSettings"], { 'ClearColor': value });
        }
        if (key === 'disableMovement') {
            Object.assign(resources3D_new["SceneSettings"], { 'disableMovement': value });
        }
        if (key === 'enableGeneralChat') {
            Object.assign(resources3D_new["SceneSettings"], { 'enableGeneralChat': value });
        }
        if (key === 'enableAvatar') {
            Object.assign(resources3D_new["SceneSettings"], { 'enableAvatar': value });
        }
        if (key === 'backgroundPresetOption') {
            Object.assign(resources3D_new["SceneSettings"], { 'backgroundPresetOption': value });
        }
        if (key === 'backgroundStyleOption') {
            Object.assign(resources3D_new["SceneSettings"], { 'backgroundStyleOption': value });
        }
        if (key === 'backgroundImagePath' ) {
            Object.assign(resources3D_new["SceneSettings"], { 'backgroundImagePath': value });
        }
        if (key === 'fogtype' ) {
            Object.assign(resources3D_new["SceneSettings"], { 'fogtype': value });
        }
        if (key === 'fogcolor' ) {
            Object.assign(resources3D_new["SceneSettings"], { 'fogcolor': value });
        }
        if (key === 'fogfar' ) {
            Object.assign(resources3D_new["SceneSettings"], { 'fogfar': value });
        }
        if (key === 'fognear' ) {
            Object.assign(resources3D_new["SceneSettings"], { 'fognear': value });
        }
        if (key === 'fogdensity' ) {
            Object.assign(resources3D_new["SceneSettings"], { 'fogdensity': value });
        }
    }

    scene_json_obj = scene_json_obj['objects'];


    for (let asset_key in scene_json_obj) {

        let name = asset_key;
        let value = scene_json_obj[asset_key];

        if (name === 'avatarCamera') {
            let camera_pos = value.position;
            let camera_rot = value.rotation;
            Object.assign(resources3D_new["cameraCoords"], { 'position': camera_pos});
            Object.assign(resources3D_new["cameraCoords"], { 'rotation': camera_rot});
            continue;
        }

        // Inherit all saved properties for each asset
        resources3D_new[name] = value;

        // TRS are the same for each asset
        resources3D_new[name].trs = {
            "translation": [
                value['position'][0],
                value['position'][1],
                value['position'][2]
            ],
            "rotation": [
                value['rotation'][0],
                value['rotation'][1],
                value['rotation'][2]
            ],
            "scale": value['scale'][0]
        };

        // Lamp has 0 rotation
        // if (name.includes('lightLamp')) {
        //     resources3D_new[name].trs.rotation = [0,0,0];
        //     resources3D_new[name].trs.scale = 1;
        // }

        // If 3d asset
        // let conditions = ['lightsun', 'lightSpot', 'lightAmbient', 'Pawn', 'lightLamp'];
        let conditions = [];
        if (!conditions.some(el => name.includes(el))) {

            resources3D_new[name].path = UPLOAD_DIR + value['fnPath'];

            resources3D_new[name].trs.scale = [
                value['scale'][0],
                value['scale'][1],
                value['scale'][2]
            ];

        }
    }
    return resources3D_new;
}
