<!DOCTYPE HTML>
<html>
<!--  This is a php that can be used in combination with a json scene to produce a VR experience  -->
<head>
	<script src="https://aframe.io/aframe/dist/aframe-master.min.js">
	</script>
</head>
<body>

<!--{"box":[{"position":"-3 0.5 -3", "color":"red", "scale":"1 1 1", "rotation":"30 50 60"},
{"position":"-5 0.5 -3", "color":"blue", "scale":"1 1 1", "rotation":"30 50 60"},
{"position":"3 0.5 -2", "color":"cyan", "scale":"1 1 1", "rotation":"60 50 60"},
{"position":"-5 0.5 2","color":"green", "scale":"1 1 1", "rotation":"36 50 60"},
{"position":"1 0.5 -3","color":"yellow", "scale":"1 1 1", "rotation":"30 50 60"}]}
-->
<?php
// define variables and set to empty values
$scene_json = test_input($_GET["scene_json"]);

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

    // objects in scene
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

    directionalLight = document.createElement('a-entity');
    directionalLight.setAttribute('light', {
        color: '#FFF',
        intensity: "0.5",
        castShadow: true,
    });

    directionalLight.setAttribute('position', {x: -0.5, y: 1, z: 1});
    // how to get the first item in the object (think it as we had multiple items, not only box)
    console.log("check box: ", Object.keys(data_object)[0]);
    // for loop to add all cubes
    var first_item_box = Object.keys(data_object)[0]
    for (var i=0; i<data_object.box.length; i++) {
        // console.log(cubes_object.cubes[i]);
        var abox2 = document.createElement("a-entity");

        // abox2.setAttribute('geometry','primitive','box');
        // abox2.setAttribute(('geometry', {primitive: 'box',
        //     height: 3})
        //     'material',{color: data_object.box[i].color});

        abox2.setAttribute('geometry', 'primitive: box');
        abox2.setAttribute('material', `color: ${data_object.box[i].color}`);
        abox2.setAttribute("position", data_object.box[i].position)
        abox2.setAttribute("scale", data_object.box[i].scale)
        abox2.setAttribute("rotation", data_object.box[i].rotation)

        ascene.appendChild(abox2);

    }


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

    // ascene.appendChild(abox);
    // ascene.appendChild(acylinder);
    // ascene.appendChild(ass_entity);
    //ascene.appendChild(ass_entity_sky);


    // add lights to scene

    ascene.appendChild(ambientLight);
    ascene.appendChild(directionalLight);
</script>


</body>
</html>

