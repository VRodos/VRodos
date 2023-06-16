'use strict';

// Only for Undo-Redo !
function parseJSON_javascript(scene_json, UPLOAD_DIR) {

    //console.error("Not all properties are supported by undo: 115");

    if (scene_json.length===0)
        return [];

    let resources3D_local = [];

    let scene_json_obj = JSON.parse(scene_json);

    let scene_json_metadata = scene_json_obj['metadata'];

    for (let key in scene_json_metadata) {
        let value = scene_json_metadata[key];
        if (key === 'ClearColor') {
            resources3D_local["SceneSettings"] = { 'ClearColor': value };
        }
    }

    scene_json_obj = scene_json_obj['objects'];

    for (let jo_key in scene_json_obj) {

        var name = jo_key;
        var value = scene_json_obj[jo_key];

        if (name === 'avatarCamera') {


        } else if (name.includes('lightSun')) {


            var t_x = value['position'][0];
            var t_y = value['position'][1];
            var t_z = value['position'][2];


            var r_x = value['rotation'][0];
            var r_y = value['rotation'][1];
            var r_z = value['rotation'][2];

            var scale = value['scale'][0];

            var selected_object_trs = { "translation": [t_x, t_y, t_z], "rotation": [r_x, r_y, r_z], "scale": scale };

            var lightintensity = value['lightintensity'];

            resources3D_local[name] = {
                "path": '',
                "assetid": '',
                "glbID": '',
                "lightintensity": lightintensity,
                "categoryName": 'lightSun',
                "categoryID": '',
                "image1id": '',
                "doorName_source": '',
                "doorName_target": '',
                "sceneName_target": '', "sceneID_target": '', "archaeology_penalty": '',
                "hv_penalty": '', "natural_penalty": '', "isreward": 0, "follow_camera": 0, "image_link": '', "video_link": '',
                "follow_camera_x": '', "follow_camera_y": '', "follow_camera_z": '', "isCloned": 0,
                "poi_img_title": '', "poi_img_desc": '', "poi_img_link": '', "poi_onlyimg": 0,
                "isJoker": 0,
                "isLight": "true",
                "trs": selected_object_trs
            };


        } else if (name.includes('lightLamp')) {

            var t_x = value['position'][0];
            var t_y = value['position'][1];
            var t_z = value['position'][2];


            var r_x = 0;
            var r_y = 0;
            var r_z = 0;

            var scale = 1;


            var color = value['color'];
            var lightintensity = value['lightintensity'];
            var lightdecay = value['lightdecay'];
            var lightdistance = value['lightdistance'];
            var shadowRadius = value['shadowRadius'];

            var isLight = "true";
            var selected_object_trs = { "translation": [t_x, t_y, t_z], "rotation": [r_x, r_y, r_z], "scale": scale };

            resources3D_local[name] = {
                "path": '',
                "assetid": '',
                "obj": '',
                "objID": '',
                "mtl": '',
                "mtlID": '',
                "fbxID": '',
                "glbID": '',
                "audioID": '',
                "categoryName": 'lightLamp',
                "lightintensity": lightintensity,
                "categoryID": '',
                "image1id": '',
                "doorName_source": '',
                "doorName_target": '',
                "sceneName_target": '',
                "sceneID_target": '',
                "archaeology_penalty": '',
                "hv_penalty": '',
                "natural_penalty": '',
                "isreward": 0,
                "follow_camera": 0,
                "image_link": '',
                "video_link": '',
                "follow_camera_x": '',
                "follow_camera_y": '',
                "follow_camera_z": '',
                "isCloned": 0,
                "poi_img_title": '',
                "poi_img_desc": '',
                "poi_img_link": '',
                "poi_onlyimg": 0,
                "isJoker": 0,
                "isLight": "true",
                "trs": selected_object_trs
            };


            // '	"type"      : "PointLight",',
            // '	"color"     : ' + o.color.getHex() + ',',
            // '	"shadowRadius" : ' + o.shadow.radius + ',',
            // '	"intensity" : ' + o.intensity + ',',
            // '	"position"  : ' + Vector3String( o.position ) + ',',
            // '	"distance"  : ' + o.distance + ( o.children.length ? ',' : '' )


        } else if (name.includes('lightSpot')) {


            var t_x = value['position'][0];
            var t_y = value['position'][1];
            var t_z = value['position'][2];


            var r_x = value['rotation'][0];
            var r_y = value['rotation'][1];
            var r_z = value['rotation'][2];

            var scale = value['scale'][0];

            var isLight = "true";
            var selected_object_trs = { "translation": [t_x, t_y, t_z], "rotation": [r_x, r_y, r_z], "scale": scale };

            var lightintensity = value['lightintensity'];

            resources3D_local[name] = {
                "path": '',
                "assetid": '',
                "obj": '',
                "objID": '',
                "mtl": '',
                "mtlID": '',
                "fbxID": '',
                "glbID": '',
                "audioID": '',
                "categoryName": 'lightSpot',
                "lightintensity": lightintensity,
                "categoryID": '',
                "image1id": '',
                "doorName_source": '',
                "doorName_target": '',
                "sceneName_target": '',
                "sceneID_target": '',
                "archaeology_penalty": '',
                "hv_penalty": '',
                "natural_penalty": '',
                "isreward": 0,
                "follow_camera": 0,
                "image_link": '',
                "video_link": '',
                "follow_camera_x": '',
                "follow_camera_y": '',
                "follow_camera_z": '',
                "isCloned": 0,
                "poi_img_title": '',
                "poi_img_desc": '',
                "poi_img_link": '',
                "poi_onlyimg": 0,
                "isJoker": 0,
                "isLight": "true",
                "trs": selected_object_trs
            };


        } else if (name.includes('lightAmbient')) {

            var t_x = value['position'][0];
            var t_y = value['position'][1];
            var t_z = value['position'][2];


            var r_x = value['rotation'][0];
            var r_y = value['rotation'][1];
            var r_z = value['rotation'][2];

            var scale = value['scale'][0];

            var isLight = "true";
            var object_trs = { "translation": [t_x, t_y, t_z], "rotation": [r_x, r_y, r_z], "scale": scale };

            var lightintensity = value['lightintensity'];

            resources3D_local[name] = {
                "path": '',
                "assetid": '',
                "obj": '',
                "objID": '',
                "mtl": '',
                "mtlID": '',
                "fbxID": '',
                "glbID": '',
                "audioID": '',
                "categoryName": 'lightAmbient',
                "lightintensity": lightintensity,
                "categoryID": '',
                "image1id": '',
                "doorName_source": '',
                "doorName_target": '',
                "sceneName_target": '',
                "sceneID_target": '',
                "archaeology_penalty": '',
                "hv_penalty": '',
                "natural_penalty": '',
                "isreward": 0,
                "follow_camera": 0,
                "image_link": '',
                "video_link": '',
                "follow_camera_x": '',
                "follow_camera_y": '',
                "follow_camera_z": '',
                "isCloned": 0,
                "poi_img_title": '',
                "poi_img_desc": '',
                "poi_img_link": '',
                "poi_onlyimg": 0,
                "isJoker": 0,
                "isLight": "true",
                "trs": object_trs
            };

        } else if (name.includes('pawn')) {

            var t_x = value['position'][0];
            var t_y = value['position'][1];
            var t_z = value['position'][2];


            var r_x = value['rotation'][0];
            var r_y = value['rotation'][1];
            var r_z = value['rotation'][2];

            var scale = value['scale'][0];

            var isLight = "false";
            var object_trs = { "translation": [t_x, t_y, t_z], "rotation": [r_x, r_y, r_z], "scale": scale };

            var lightintensity = '0';

            resources3D_local[name] = {
                "path": '',
                "assetid": '',
                "obj": '',
                "objID": '',
                "mtl": '',
                "mtlID": '',
                "fbxID": '',
                "glbID": '',
                "audioID": '',
                "categoryName": 'lightAmbient',
                "lightintensity": lightintensity,
                "categoryID": '',
                "image1id": '',
                "doorName_source": '',
                "doorName_target": '',
                "sceneName_target": '',
                "sceneID_target": '',
                "archaeology_penalty": '',
                "hv_penalty": '',
                "natural_penalty": '',
                "isreward": 0,
                "follow_camera": 0,
                "image_link": '',
                "video_link": '',
                "follow_camera_x": '',
                "follow_camera_y": '',
                "follow_camera_z": '',
                "isCloned": 0,
                "poi_img_title": '',
                "poi_img_desc": '',
                "poi_img_link": '',
                "poi_onlyimg": 0,
                "isJoker": 0,
                "isLight": "true",
                "trs": object_trs
            };

        } else {

            var path = UPLOAD_DIR + value['fnPath'];

            //console.log("value", value);

            var assetid = value['asset_id'];
            var assetname = value['asset_name'];

            var glbID = value['glbID'];
            var overrideMaterial = value['overrideMaterial'];
            var color = value['color'];
            var emissive = value['emissive'];
            var emissiveIntensity = value['emissiveIntensity'];
            var roughness = value['roughness'];
            var metalness = value['metalness'];


            var audioID = value['audioID'];
            var categoryName = value['categoryName'];
            var categoryID = value['categoryID'];


            var follow_camera = value['follow_camera'];

            var image_link = value['image_link'];
            var video_link = value['video_link'];
            var follow_camera_x = value['follow_camera_x'];
            var follow_camera_y = value['follow_camera_y'];
            var follow_camera_z = value['follow_camera_z'];

            var isCloned = value['isCloned'];

            var poi_img_title = value['poi_img_title'];
            var poi_img_desc = value['poi_img_desc'];
            var poi_img_link = value['poi_img_link'];


            var poi_onlyimg = value['poi_onlyimg'];

            var isJoker = value['isJoker'];

            var r_x = value['rotation'][0];
            var r_y = value['rotation'][1];
            var r_z = value['rotation'][2];

            var t_x = value['position'][0];
            var t_y = value['position'][1];
            var t_z = value['position'][2];

            var s_x = value['scale'][0];
            var s_y = value['scale'][1];
            var s_z = value['scale'][2];


            var selected_object_trs = { "translation": [t_x, t_y, t_z], "rotation": [r_x, r_y, r_z], "scale": [s_x, s_y, s_z] };

            resources3D_local[name] = {
                "path": path,
                "assetid": assetid,
                "assetname": assetname,
                "glbID": glbID,
                "overrideMaterial": overrideMaterial,
                "color": color,
                "emissive": emissive,
                "emissiveIntensity": emissiveIntensity,
                "roughness": roughness,
                "metalness": metalness,
                "audioID": audioID,
                "categoryName": categoryName, "categoryID": categoryID,
                "isCloned": isCloned,
                "follow_camera": follow_camera,
                "image_link": image_link,
                "video_link": video_link,
                "follow_camera_x": follow_camera_x,
                "follow_camera_y": follow_camera_y,
                "follow_camera_z": follow_camera_z,
                "poi_img_title": poi_img_title,
                "poi_img_desc": poi_img_desc,
                "poi_img_link": poi_img_link,
                "poi_onlyimg": poi_onlyimg,
                "isJoker": isJoker,
                "isLight": "false",
                "trs": selected_object_trs
            };
        }
    }

    return resources3D_local;
}
