'use strict';

function parseJSON_javascript(scene_json, UPLOAD_DIR){


    if (scene_json.length==0)
        return [];

    var resources3D_local =[];

    var scene_json_obj = JSON.parse(scene_json);
    scene_json_obj = scene_json_obj['objects'];


    for (var jo_key in scene_json_obj){

        var name = jo_key;
        var value = scene_json_obj[jo_key];


        if (name == 'avatarYawObject') {

            // var path = '';
            // var obj = '';
            // var mtl = '';
            // var type_behavior = 'avatar';
            //
            // var r_x = value['rotation'][0];
            // var r_y = value['rotation'][1];
            // var r_z = 0;

            var isLight = "false";

        } else if (name.includes('lightSun')){

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
            var selected_object_trs={"translation":[t_x,t_y,t_z],"rotation":[r_x,r_y,r_z],"scale":scale};

            resources3D_local[name]= {"path":'',
                "assetid":'',
                "obj":'',
                "objID":'',
                "mtl":'',
                "mtlID":'',
                "fbxID":'',
                "audioID":'',
                "categoryName":'',"categoryID":'',
                "image1id":'',"doorName_source":'',"doorName_target":'',
                "sceneName_target":'',"sceneID_target":'',"archaeology_penalty":'',
                "hv_penalty":'',"natural_penalty":'',"isreward":0,"isCloned":0,
                "isJoker":0,
                "isLight":"true",
                "trs":selected_object_trs};


        } else {
            var path = UPLOAD_DIR + value['fnPath'];


            var assetid = value['assetid'];
            var assetname = value['assetname'];
            var obj = value['fnObj'];
            var objID = value['fnObjID'];
            var mtl = value['fnMtl'];
            var mtlID = value['fnMtlID'];
            var fbxID = value['fbxID'];
            var glbID = value['glbID'];
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
            var isCloned = value['isCloned'];
            var isJoker = value['isJoker'];

            var r_x = value['rotation'][0];
            var r_y = value['rotation'][1];
            var r_z = value['rotation'][2];

            var t_x = value['position'][0];
            var t_y = value['position'][1];
            var t_z = value['position'][2];

            var scale = value['scale'][0];

            var selected_object_trs={"translation":[t_x,t_y,t_z],"rotation":[r_x,r_y,r_z],"scale":scale};

            resources3D_local[name]= {"path":path,
                "assetid":assetid,
                "assetname":assetname,
                "obj":obj,
                "objID":objID,
                "mtl":mtl,
                "mtlID":mtlID,
                "fbxID":fbxID,
                "glbID":glbID,
                "audioID":audioID,
                "categoryName":categoryName,"categoryID":categoryID,
                "image1id":image1id,"doorName_source":doorName_source,"doorName_target":doorName_target,
                "sceneName_target":sceneName_target,"sceneID_target":sceneID_target,"archaeology_penalty":archaeology_penalty,
                "hv_penalty":hv_penalty,"natural_penalty":natural_penalty,"isreward":isreward,"isCloned":isCloned,
                "isJoker":isJoker,
                "isLight":"false",
                "trs":selected_object_trs};
        }
    }

    return resources3D_local;
}
