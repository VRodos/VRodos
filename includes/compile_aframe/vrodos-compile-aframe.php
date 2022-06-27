<!DOCTYPE HTML>
<html>
<!--  This is a php that can be used in combination with a json scene to produce a VR experience  -->
<head>
	<script src="https://aframe.io/aframe/dist/aframe-master.min.js">
	</script>
</head>
<body>

<!--simple json for test-->

<!--{"box":[{"position":"-3 0.5 -3", "color":"red", "scale":"1 1 1", "rotation":"30 50 60"},
{"position":"-5 0.5 -3", "color":"blue", "scale":"1 1 1", "rotation":"30 50 60"},
{"position":"3 0.5 -2", "color":"cyan", "scale":"1 1 1", "rotation":"60 50 60"},
{"position":"-5 0.5 2","color":"green", "scale":"1 1 1", "rotation":"36 50 60"},
{"position":"1 0.5 -3","color":"yellow", "scale":"1 1 1", "rotation":"30 50 60"}]}
-->
<?php

$debug = 1;

if ($debug) {
            $sceneInput = '{
  "metadata": {
    "formatVersion" : 4.0,
    "type"		: "scene",
    "generatedBy"	: "SceneExporter.js",
    "ClearColor" : "#eeeeee",
    "toneMappingExposure" : "1",
    "enableEnvironmentTexture" : "true",
    "objects"       : 4	},

  "urlBaseType": "relativeToScene",

  "objects" :
          {
            "avatarYawObject" : {
              "position" : [-1.5073529542515,1.3,3.7404941859495],
              "rotation" : [0,-0.911,0],
              "quaternion" : [0.0000,0.8980,0.0000,-0.4399],
              "quaternion_player" : [0.0000,0.8980,0.0000,-0.4399],
              "quaternion_camera" : [0.0000,0.0000,0.0000,1.0000],
              "scale"	   : [1,1,1],
              "categoryName" : "avatarYawObject",
              "visible"  : true,
              "children" : {
              }
            },

            "torus-smooth_1655803767" : {
              "position" : [-6.237191481778497,0,-5.212510024060256],
              "rotation" : [0,0,0],
              "quaternion" : [0,0,0,1],
              "scale"	   : [1,1,1],
              "fnPath" : "",
              "assetid" : "995",
              "assetname" : "Torus Smooth",
              "fnObj" : "",
              "fnObjID" : "",
              "categoryName" : "Artifact",
              "categoryDescription" : "undefined",
              "categoryIcon" : "undefined",
              "categoryID" : "41",
              "fbxID" : "",
              "glbID" : "996",
              "color" : "2bffef",
              "emissive" : "000000",
              "roughness" : "0.12",
              "metalness" : "0.86",
              "emissiveIntensity" : "0",
              "videoTextureSrc" : "",
              "videoTextureRepeatX" : "",
              "videoTextureRepeatY" : "",
              "videoTextureCenterX" : "",
              "videoTextureCenterY" : "",
              "videoTextureRotation" : "",
              "audioID" : "",
              "image1id" : "",
              "doorName_source" : "",
              "doorName_target" : "",
              "sceneName_target" : "",
              "sceneID_target" : "",
              "archaeology_penalty" : "0",
              "hv_penalty" : "0",
              "natural_penalty" : "0",
              "isreward" : "0",
              "isCloned" : "false",
              "isLight" : "false",
              "fnMtl" : "",
              "fnMtlID" : "",
              "children" : {
              }
            },

            "sphere_1655803772" : {
              "position" : [6.549051055867418,0,-5.791677804511449],
              "rotation" : [0,0,0],
              "quaternion" : [0,0,0,1],
              "scale"	   : [1,1,1],
              "fnPath" : "",
              "assetid" : "449",
              "assetname" : "Sphere",
              "fnObj" : "",
              "fnObjID" : "",
              "categoryName" : "Artifact",
              "categoryDescription" : "undefined",
              "categoryIcon" : "undefined",
              "categoryID" : "41",
              "fbxID" : "",
              "glbID" : "450",
              "color" : "7f7f7f",
              "emissive" : "000000",
              "roughness" : "0.5",
              "metalness" : "0",
              "emissiveIntensity" : "0",
              "videoTextureSrc" : "",
              "videoTextureRepeatX" : "",
              "videoTextureRepeatY" : "",
              "videoTextureCenterX" : "",
              "videoTextureCenterY" : "",
              "videoTextureRotation" : "",
              "audioID" : "",
              "image1id" : "",
              "doorName_source" : "",
              "doorName_target" : "",
              "sceneName_target" : "",
              "sceneID_target" : "",
              "archaeology_penalty" : "0",
              "hv_penalty" : "0",
              "natural_penalty" : "0",
              "isreward" : "0",
              "isCloned" : "false",
              "isLight" : "false",
              "fnMtl" : "",
              "fnMtlID" : "",
              "children" : {
              }
            },

            "mylightSun_1655803780" : {
              "position" : [0,13.453206671125372,16.799161901784828],
              "rotation" : [0,0,0],
              "quaternion" : [0,0,0,1],
              "scale"	    : [1,1,1],
              "lightintensity"	: "1",
              "lightcolor"	: [1.000,1.000,1.000],
              "targetposition" : [0,0,0],
              "categoryName" : "lightSun",
              "isLight"   : "true",
              "children" : {
              }
            }

          }

}';
} else {
        $scene_json = test_input($_GET["scene_json"]);
}

$scene_json = $sceneInput;

function test_input($data) {
	$data = trim($data);
	$data = stripslashes($data);
//  $data = htmlspecialchars($data);
	return $data;
}

?>


<script type="text/javascript">

    var data=<?php echo json_encode($scene_json); ?>;
    var data_object = JSON.parse(data);

	// Add node elements to scene
    const ascene = document.createElement("a-scene");
    document.body.appendChild(ascene);

    // iterate through the json_from_scene json (for the time we only need the objects item)

    // array of glbs to load temporally
    array_of_glbs = ["url(../assets/cubi.glb)","url(../assets/pawn.glb)"]
    idx_of_glb = 0

    // iterate through the dataobject json (for the time we only need the objects item)
    for (var i=0; i<Object.keys(data_object.objects).length; i++) {
        // get the values of objects
        // check the type of asset in the scene

        if (Object.values( data_object.objects)[i].categoryName==='Artifact'){
            // console.log(Object.values( json_from_scene.objects)[i].color)
            var glbs_fromJson = document.createElement("a-entity");

            glbs_fromJson.setAttribute("gltf-model", array_of_glbs[idx_of_glb]);
            glbs_fromJson.setAttribute("position", {x: Object.values( data_object.objects)[i].position[0],
                y: Object.values( data_object.objects)[i].position[1],
                z: Object.values( data_object.objects)[i].position[2]});

            glbs_fromJson.setAttribute("rotation",{x: Object.values( data_object.objects)[i].rotation[0],
                y: Object.values( data_object.objects)[i].rotation[1],
                z: Object.values( data_object.objects)[i].rotation[2]});
            glbs_fromJson.setAttribute("scale", {x: Object.values( data_object.objects)[i].scale[0],
                y: Object.values( data_object.objects)[i].scale[1],
                z: Object.values( data_object.objects)[i].scale[2]});
            // glbs_fromJson.setAttribute('material', `color: ${Object.values( json_from_scene.objects)[i].color}`);
            ascene.appendChild(glbs_fromJson);
            idx_of_glb+=1;
        }

        // light seems ok
        else if (Object.values( data_object.objects)[i].categoryName==='lightSun'){
            // console.log(Object.values( json_from_scene.objects)[i].lightcolor)

            sunlight = document.createElement('a-entity');
            sunlight.setAttribute('light', {
                color: Object.values( data_object.objects)[i].lightcolor,
                intensity: Object.values( data_object.objects)[i].lightintensity
            });
            sunlight.setAttribute('position',{x: Object.values( data_object.objects)[i].position[0],
                y: Object.values( data_object.objects)[i].position[1],
                z: Object.values( data_object.objects)[i].position[2]});
            sunlight.setAttribute('rotation',{x: Object.values( data_object.objects)[i].rotation[0],
                y: Object.values( data_object.objects)[i].rotation[1],
                z: Object.values( data_object.objects)[i].rotation[2]});
            sunlight.setAttribute('scale',{x: Object.values( data_object.objects)[i].scale[0],
                y: Object.values( data_object.objects)[i].scale[1],
                z: Object.values( data_object.objects)[i].scale[2]});
            ascene.appendChild(sunlight);

        }
        else if (Object.values( data_object.objects)[i].categoryName==='Pawn'){
            pass;  }

        // ascene.appendChild(glbs_fromJson);
        // console.log("glbs", glbs_fromJson)

    }
	
    // load separate objects in scene
    const abox = document.createElement("a-box");
    const acylinder = document.createElement("a-entity");
    const entityEl = document.createElement('a-entity');

    // lights
    var ambientLight;
    var directionalLight;

    ambientLight = document.createElement('a-entity');

    ambientLight.setAttribute('light', {
        type: 'ambient',
        color: 'rgb(100%,0%,0%)',
        intensity: 0.1

    });
	
    // load separate entities
    const ass_entity = document.createElement("a-entity");
    const ass_entity_sky = document.createElement("a-entity");

    ass_entity_sky.setAttribute("gltf-model", "url(https://cdn.aframe.io/test-models/models/glTF-2.0/virtualcity/VC.gltf)");
    ass_entity.setAttribute("gltf-model", "url(https://raw.githubusercontent.com/aframevr/assets/master/examples/ar/models/triceratops/scene.gltf)");

    ass_entity.setAttribute("position", "-5 -30 -150");
    ass_entity.setAttribute("shader", "standard");

    abox.setAttribute("position", "-1 0.5 -3");
    abox.setAttribute("color", "red");
    abox.setAttribute("castShadow", "true");

    acylinder.setAttribute("position", "1 3 -3");
    // acylinder.setAttribute("color", "cyan");

    // the color should be in 'material' component, not 'geometry'
    acylinder.setAttribute('geometry',{
        primitive: "cylinder",
        radius: '0.5'
    }, 'material',{color: "cyan"});

    ascene.setAttribute("colorManagement", "true");

    //appends to scene

    // ascene.appendChild(ass_entity);
    //ascene.appendChild(ass_entity_sky);


    // add lights to scene

    // ascene.appendChild(ambientLight);
    // ascene.appendChild(directionalLight);
</script>


</body>
</html>

