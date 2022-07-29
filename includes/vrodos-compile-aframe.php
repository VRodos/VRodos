<html>

<body>

<form action = "<?php $_PHP_SELF ?>" method = "GET">

    scene id: <input type = "text" name = "scene_id" />
    filename: <input type = "text" name = "filename" />

    <input type = "submit" />

</form>

</body>

</html>

<?php
//global $scene_id;
//echo "Step 0 <br/>";
if(isset($_GET["scene_id"]) || isset($_GET["filename"])) {

    echo "Your scene id: ". $_GET['scene_id'] ."<br>";
    $scene_id = $_GET['scene_id'];

    echo "Your filename: ". $_GET['filename'] ."<br>";
    $filename = $_GET['filename'];

}

require_once($_SERVER['DOCUMENT_ROOT'].'/wp-config.php');
//$scene_id = $GET['vrodos_scene'];

$wp->init();
$wp->parse_request();
$wp->query_posts();
$wp->register_globals();
$wp->send_headers();

//echo "Step 1 <br/>";

//echo $_SERVER["PHP_SELF"];

//
//if(isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on')
//    $url = "https://";
//else
//    $url = "http://";
//// Append the host(domain name, ip) to the URL.
//$url.= $_SERVER['HTTP_HOST'];
//
//// Append the requested resource location to the URL
//$url.= $_SERVER['REQUEST_URI'];

//echo $url;

$scene_post = get_post($id=$scene_id);


$scene_content =  $scene_post->post_content;
echo $scene_content;

echo "<br/>";


//print_r($scene_post);

$perma_structure = get_option('permalink_structure')?true:false;

//$parameter_assetpass = $perma_structure ? '?vrodos_scene=' : '&vrodos_scene=';
//$parameter_filename = $perma_structure ? '?vrodos_filename=' : '&vrodos_filename=';

if ( get_option('permalink_structure') ) { $perma_structure = true; } else {$perma_structure = false;}
if( $perma_structure){$parameter_pass = '?vrodos_game=';} else{$parameter_pass = '&vrodos_game=';}
if( $perma_structure){$parameter_Scenepass = '?vrodos_scene=';} else {$parameter_Scenepass = '&vrodos_scene=';}
$parameter_assetpass = $perma_structure ? '?vrodos_asset=' : '&vrodos_asset=';


//$urlforAssetEdit = esc_url( get_permalink($newAssetPage[0]->ID) . $parameter_pass . $project_id .
//    '&vrodos_scene=' .$current_scene_id . '&vrodos_asset=' );


//echo "Step 2 <br/>";

//$_GET['?vrodos_scene='];
//$_GET['vrodos_generated_experience_filename']

// Apache
// vrodos/
// https://vrodos.iti.gr/wp-content/plugins/vrodos/includes/vrodos-compile-aframe.php

// Node.js
// net-aframe/networked-aframe/examples/
// https://vrodos-multiplaying.iti.gr/generated_experience.html


function callback($buffer)
{

    $multiplayingDirector = '/var/www/html/net-aframe/networked-aframe/examples/';

    $scene_id = $_GET["scene_id"];
    echo $scene_id;
    $filename = $_GET["filename"];
    echo $filename;
    $filepath = $multiplayingDirector.'generated_experience'.$scene_id.".html";

    $f = fopen($filepath, "w");
    fwrite($f, print_r($buffer, true));
    fclose($f);

    $initial_path = "https://vrodos-multiplaying.iti.gr/";
    $final_path = $initial_path.'generated_experience'.$scene_id.".html";

    if (file_exists($filepath)){
        return '<a href="'.$final_path.'">Generated html</a>';
    }
    else{
        return "An error has occurred";
    }

    // @Sofia Todo : Check if $f is generated and display the below link if ok. Else say an error.

    // @Sofia Todo : put generated_experience to be a variable name (Make a GET)
    // @Sofia Todo : Get the scene json from post content by using scene id with a GET
    // .php?filename=generated_experience&sceneid=125

    //   wp_get_post_content ( 125)


}

ob_start("callback");

?>
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

//else {
//	$scene_json = $_GET["scene_json"];
//}

$scene_json = trim(preg_replace('/\s+/S', ' ', $scene_content)); //   test_input($sceneInput);
//echo "THE SCENE CONTENT: ".$scene_content;
?>


<script type="text/javascript">

    var data='<?php echo $scene_json; ?>';
    console.log(data);
    var data_object = JSON.parse(data);

    // Add node elements to scene
    const ascene = document.createElement("a-scene");
    document.body.appendChild(ascene);

    // iterate through the json_from_scene json (for the time we only need the objects item)

    // array of glbs to load temporally
    array_of_glbs = ["url(https://vrodos.iti.gr/wp-content/plugins/vrodos/assets/cube.glb)"]
    //"url(https://vrodos.iti.gr/wp-content/plugins/vrodos/assets/pawn.glb)"
    idx_of_glb = 0

    function setAttributes(entity, data_object) {

        entity.setAttribute("position", {x: Object.values( data_object.objects)[i].position[0],
            y: Object.values( data_object.objects)[i].position[1],
            z: Object.values( data_object.objects)[i].position[2]});
        entity.setAttribute("rotation",{x: Object.values( data_object.objects)[i].rotation[0],
            y: Object.values( data_object.objects)[i].rotation[1],
            z: Object.values( data_object.objects)[i].rotation[2]});
        entity.setAttribute("scale", {x: Object.values( data_object.objects)[i].scale[0],
            y: Object.values( data_object.objects)[i].scale[1],
            z: Object.values( data_object.objects)[i].scale[2]});
    }


    // iterate through the dataobject json (for the time we only need the objects item)
    for (var i=0; i<Object.keys(data_object.objects).length; i++) {
        // get the values of objects
        // check the type of asset in the scene

        if (Object.values( data_object.objects)[i].categoryName==='Artifact'){
            // console.log(Object.values( json_from_scene.objects)[i].color)
            var glbs_fromJson = document.createElement("a-entity");
            glbs_fromJson.setAttribute("gltf-model", array_of_glbs[idx_of_glb]);

            setAttributes(glbs_fromJson, data_object)

            ascene.appendChild(glbs_fromJson);
            idx_of_glb+=1;
        }

        else if (Object.values( data_object.objects)[i].categoryName==='lightSun'){
            // console.log(Object.values( json_from_scene.objects)[i].lightcolor)

            var light = document.createElement('a-entity');
            light.setAttribute('light', {
                type: 'directional',
                color: Object.values( data_object.objects)[i].lightcolor,
                intensity: Object.values( data_object.objects)[i].lightintensity
            });
            setAttributes(light, data_object)

            ascene.appendChild(light);

        }
        else if (Object.values( data_object.objects)[i].categoryName==='lightSpot'){
            // console.log(Object.values( json_from_scene.objects)[i].lightcolor)

            var light = document.createElement('a-entity');
            light.setAttribute('light', {
                type: 'directional',
                color: Object.values( data_object.objects)[i].lightcolor,
                intensity: Object.values( data_object.objects)[i].lightintensity
            });

            setAttributes(light, data_object)

            ascene.appendChild(light);

        }
        else if (Object.values( data_object.objects)[i].categoryName==='lightLamp'){
            // console.log(Object.values( json_from_scene.objects)[i].lightcolor)

            var light = document.createElement('a-entity');
            light.setAttribute('light', {
                type: 'point',
                color: Object.values( data_object.objects)[i].lightcolor,
                intensity: Object.values( data_object.objects)[i].lightintensity
            });
            setAttributes(light, data_object)

            ascene.appendChild(light);

        }
        else if (Object.values( data_object.objects)[i].categoryName==='lightAmbient'){

            var light = document.createElement('a-entity');
            light.setAttribute('light', {
                type: 'point',
                color: Object.values( data_object.objects)[i].lightcolor,
                intensity: Object.values( data_object.objects)[i].lightintensity
            });

            setAttributes(light, data_object)

            ascene.appendChild(light);

        }
        else if (Object.values( data_object.objects)[i].categoryName==='pawn'){
            var pawn_fromJson =  document.createElement("a-entity");
            pawn_fromJson.setAttribute("gltf-model", "url(https://vrodos.iti.gr/wp-content/plugins/vrodos/assets/pawn.glb)");

            setAttributes(pawn_fromJson, data_object)


            ascene.appendChild(pawn_fromJson);

        }

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
<?php

ob_end_flush();

//echo "Step Completed <br/>";
//echo '<a href="https://vrodos-multiplaying.iti.gr/generated_experience.html">Generated html</a>';
?>
