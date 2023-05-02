'use strict';

// Only for Undo-Redo !
function parseJSON_javascript(scene_json, UPLOAD_DIR) {

    //console.error("Not all properties are supported by undo: 115");

    if (scene_json.length == 0)
        return [];

    var resources3D_local = [];

    var scene_json_obj = JSON.parse(scene_json);

    var scene_json_metadata = scene_json_obj['metadata'];

    for (var jo_key in scene_json_metadata) {

        var name = jo_key;
        var value = scene_json_metadata[jo_key];
        if (name == 'ClearColor') {
            resources3D_local["SceneSettings"] = { 'ClearColor': value };
        }

    }

    scene_json_obj = scene_json_obj['objects'];

    for (var jo_key in scene_json_obj) {

        var name = jo_key;
        var value = scene_json_obj[jo_key];

        if (name === 'avatarCamera') {

            // var path = '';
            // var obj = '';
            // var mtl = '';
            // var type_behavior = 'avatar';
            //
            // var r_x = value['rotation'][0];
            // var r_y = value['rotation'][1];
            // var r_z = 0;

            var isLight = "false";

        } else if (name.includes('lightSun')) {

            var path = '';
            var obj = '';
            var mtl = '';

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
                "lightintensity": lightintensity,
                "categoryName": 'lightSun',
                "categoryID": '',
                "image1id": '',
                "doorName_source": '',
                "doorName_target": '',
                "sceneName_target": '', "sceneID_target": '', "archaeology_penalty": '',
                "hv_penalty": '', "natural_penalty": '', "isreward": 0, "follow_camera": 0, "isCloned": 0,
                "isJoker": 0,
                "isLight": "true",
                "trs": selected_object_trs
            };

        } else if (name.includes('lightLamp')) {


            var path = '';
            var obj = '';
            var mtl = '';

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
                "isCloned": 0,
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

            var path = '';
            var obj = '';
            var mtl = '';

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
                "isCloned": 0,
                "isJoker": 0,
                "isLight": "true",
                "trs": selected_object_trs
            };


        } else if (name.includes('lightAmbient')) {

            var path = '';
            var obj = '';
            var mtl = '';

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
                "isCloned": 0,
                "isJoker": 0,
                "isLight": "true",
                "trs": object_trs
            };

        } else if (name.includes('pawn')) {

            var path = '';
            var obj = '';
            var mtl = '';

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
                "isCloned": 0,
                "isJoker": 0,
                "isLight": "true",
                "trs": object_trs
            };

        } else {
            var path = UPLOAD_DIR + value['fnPath'];

            //console.log("value", value);

            var assetid = value['assetid'];
            var assetname = value['assetname'];
            var obj = value['fnObj'];
            var objID = value['fnObjID'];
            var mtl = value['fnMtl'];
            var mtlID = value['fnMtlID'];
            var fbxID = value['fbxID'];
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
            var image1id = value['image1id'];

            var doorName_source = value['doorName_source'];
            var doorName_target = value['doorName_target'];
            var sceneName_target = value['sceneName_target'];
            var sceneID_target = value['sceneID_target'];

            var archaeology_penalty = value['archaeology_penalty'];
            var hv_penalty = value['hv_penalty'];
            var natural_penalty = value['natural_penalty'];

            var isreward = value['isreward'];
            var follow_camera = value['follow_camera'];

            var isCloned = value['isCloned'];
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

            var videoTextureSrc = value['videoTextureSrc'];


            var videoTextureRepeatX = value['videoTextureRepeatX'];
            var videoTextureRepeatY = value['videoTextureRepeatY'];
            var videoTextureCenterX = value['videoTextureCenterX'];
            var videoTextureCenterY = value['videoTextureCenterY'];
            var videoTextureRotation = value['videoTextureRotation'];


            var selected_object_trs = { "translation": [t_x, t_y, t_z], "rotation": [r_x, r_y, r_z], "scale": [s_x, s_y, s_z] };

            resources3D_local[name] = {
                "path": path,
                "assetid": assetid,
                "assetname": assetname,
                "obj": obj,
                "objID": objID,
                "mtl": mtl,
                "mtlID": mtlID,
                "fbxID": fbxID,
                "glbID": glbID,
                "overrideMaterial": overrideMaterial,
                "color": color,
                "emissive": emissive,
                "emissiveIntensity": emissiveIntensity,
                "roughness": roughness,
                "metalness": metalness,
                "videoTextureSrc": videoTextureSrc,
                "videoTextureRepeatX": videoTextureRepeatX,
                "videoTextureRepeatY": videoTextureRepeatY,
                "videoTextureCenterX": videoTextureCenterX,
                "videoTextureCenterY": videoTextureCenterY,
                "videoTextureRotation": videoTextureRotation,
                "audioID": audioID,
                "categoryName": categoryName, "categoryID": categoryID,
                "image1id": image1id, "doorName_source": doorName_source, "doorName_target": doorName_target,
                "sceneName_target": sceneName_target, "sceneID_target": sceneID_target, "archaeology_penalty": archaeology_penalty,
                "hv_penalty": hv_penalty, "natural_penalty": natural_penalty, "isreward": isreward, "isCloned": isCloned,
                "follow_camera": follow_camera,
                "isJoker": isJoker,
                "isLight": "false",
                "trs": selected_object_trs
            };
        }
    }

    return resources3D_local;
}
