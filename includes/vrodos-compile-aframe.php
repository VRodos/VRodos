<?php

function vrodos_compile_aframe($scene_id){

    //require_once($_SERVER['DOCUMENT_ROOT'].'/wp-config.php');
    ////$scene_id = $GET['vrodos_scene'];
    //
    //$wp->init();
    //$wp->parse_request();
    //$wp->query_posts();
    //$wp->register_globals();
    //$wp->send_headers();


    $scene_post = get_post($scene_id);

    $scene_content =  $scene_post->post_content;

    //echo $scene_content;
    
    //echo "<br/>";
    
    
    //print_r($scene_post);
    
    //    $perma_structure = get_option('permalink_structure')?true:false;
    //
    //    if ( get_option('permalink_structure') ) { $perma_structure = true; } else {$perma_structure = false;}
    //    if( $perma_structure){$parameter_pass = '?vrodos_game=';} else{$parameter_pass = '&vrodos_game=';}
    //    if( $perma_structure){$parameter_Scenepass = '?vrodos_scene=';} else {$parameter_Scenepass = '&vrodos_scene=';}
    //    $parameter_assetpass = $perma_structure ? '?vrodos_asset=' : '&vrodos_asset=';
    
    
    // Apache
    // vrodos/
    // https://vrodos.iti.gr/wp-content/plugins/vrodos/includes/vrodos-compile-aframe.php
    
    // Node.js
    // net-aframe/networked-aframe/examples/
    // https://vrodos-multiplaying.iti.gr/generated_experience.html

    
    function main_convertToAframe($buffer)
    {
        $scene_id = $_GET["scene_id"];
    
        
        // Step 1. Open a file in file system for making the Aframe html file
        $pathToAframe = '/var/www/html/net-aframe/networked-aframe/examples/';
    
        $filepath = $pathToAframe.'generated_experience'.$scene_id.".html";
    
        $f = fopen($filepath, "w");
        fwrite($f, print_r($buffer, true));
        fclose($f);
    
        // Step 2. Define the URL for calling the generated experience html aframe
        $baseURL = "https://vrodos-multiplaying.iti.gr/";
        $final_path = $baseURL.'generated_experience'.$scene_id.".html";
    
        // Return the link
        if (file_exists($filepath)){
            return '<a href="'.$final_path.'">Generated html</a>';
        }
        else{
            return "An error has occurred";
        }
    }
    
    
    
    ob_start( "main_convertToAframe" );
    ?>
    
    <html>
    <head>
        <script src="https://aframe.io/aframe/dist/aframe-master.min.js">
        </script>
    </head>
    <body>
    
    <?php
    // Remove any line changes and multiple spaces from scene json
    $scene_json = trim(preg_replace('/\s+/S', ' ', $scene_content));
    ?>
    
    
    <script type="text/javascript">
    
        // Convert scene json from php to javascript
        var scene_json_as_text='<?php echo $scene_json; ?>';
        
        // Parse text as JSON object
        var scene_json = JSON.parse(scene_json_as_text);
    
        // Add node elements to scene
        
        // Create the A-Scene entity
        const ascene = document.createElement("a-scene");
        document.body.appendChild(ascene);
    
        // iterate through the json_from_scene json
    
        // array of glbs to load temporally (mockup a cube)
        array_of_glbs = ["url(https://vrodos.iti.gr/wp-content/plugins/vrodos/assets/cube.glb)"];
    
        idx_of_glb = 0;
        
        function setAttributes(entity, scene_json_in, i_in) {
    
            var objvals = Object.values( scene_json_in.objects)[i_in];
            
            entity.setAttribute("position", {x: objvals.position[0], y: objvals.position[1], z: objvals.position[2]});
            entity.setAttribute("rotation", {x: objvals.rotation[0], y: objvals.rotation[1], z: objvals.rotation[2]});
            entity.setAttribute("scale"   , {x: objvals.scale[0]   , y: objvals.scale[1]   , z: objvals.scale[2]});
        }
    
    
        // iterate through the scene_json objects
        for (var i=0; i<Object.keys(scene_json.objects).length; i++) {
    
            // For Artifacts
            if (Object.values( scene_json.objects)[i].categoryName==='Artifact'){
                
                var glbs_fromJson = document.createElement("a-entity");
                glbs_fromJson.setAttribute("gltf-model", array_of_glbs[idx_of_glb]);
    
                setAttributes(glbs_fromJson, scene_json, i);
    
                ascene.appendChild(glbs_fromJson);
                
            }
    
            // For lightSun
            else if (Object.values( scene_json.objects)[i].categoryName==='lightSun'){
    
                var light = document.createElement('a-entity');
                light.setAttribute('light', {
                    type: 'directional',
                    color: Object.values( scene_json.objects)[i].lightcolor,
                    intensity: Object.values( scene_json.objects)[i].lightintensity
                });
                setAttributes(light, scene_json, i);
    
                ascene.appendChild(light);
    
            }
            
            // For lightSpot
            else if (Object.values( scene_json.objects)[i].categoryName==='lightSpot')
            {
                // console.log(Object.values( json_from_scene.objects)[i].lightcolor)
    
                var light = document.createElement('a-entity');
                light.setAttribute('light', {
                    type: 'directional',
                    color: Object.values( scene_json.objects)[i].lightcolor,
                    intensity: Object.values( scene_json.objects)[i].lightintensity
                });
    
                setAttributes(light, scene_json)
    
                ascene.appendChild(light);
    
            }
            
            // For lightLamp
            else if (Object.values( scene_json.objects)[i].categoryName==='lightLamp'){
                // console.log(Object.values( json_from_scene.objects)[i].lightcolor)
    
                var light = document.createElement('a-entity');
                light.setAttribute('light', {
                    type: 'point',
                    color: Object.values( scene_json.objects)[i].lightcolor,
                    intensity: Object.values( scene_json.objects)[i].lightintensity
                });
                setAttributes(light, scene_json)
    
                ascene.appendChild(light);
    
            }
            
            // For lightAmbient
            else if (Object.values( scene_json.objects)[i].categoryName==='lightAmbient'){
    
                var light = document.createElement('a-entity');
                light.setAttribute('light', {
                    type: 'point',
                    color: Object.values( scene_json.objects)[i].lightcolor,
                    intensity: Object.values( scene_json.objects)[i].lightintensity
                });
    
                setAttributes(light, scene_json)
    
                ascene.appendChild(light);
    
            }
            
            // For pawn
            else if (Object.values( scene_json.objects)[i].categoryName==='pawn'){
                var pawn_fromJson =  document.createElement("a-entity");
                pawn_fromJson.setAttribute("gltf-model", "url(https://vrodos.iti.gr/wp-content/plugins/vrodos/assets/pawn.glb)");
    
                setAttributes(pawn_fromJson, scene_json)
    
    
                ascene.appendChild(pawn_fromJson);
    
            }
    
            // ascene.appendChild(glbs_fromJson);
            // console.log("glbs", glbs_fromJson)
    
        }
    
        // // load separate objects in scene
        // const abox = document.createElement("a-box");
        // const acylinder = document.createElement("a-entity");
        // const entityEl = document.createElement('a-entity');
        //
        // // lights
        // var ambientLight;
        // var directionalLight;
        //
        // ambientLight = document.createElement('a-entity');
        //
        // ambientLight.setAttribute('light', {
        //     type: 'ambient',
        //     color: 'rgb(100%,0%,0%)',
        //     intensity: 0.1
        //
        // });
    
        // load separate entities
        // const ass_entity = document.createElement("a-entity");
        // const ass_entity_sky = document.createElement("a-entity");
        //
        // ass_entity_sky.setAttribute("gltf-model", "url(https://cdn.aframe.io/test-models/models/glTF-2.0/virtualcity/VC.gltf)");
        // ass_entity.setAttribute("gltf-model", "url(https://raw.githubusercontent.com/aframevr/assets/master/examples/ar/models/triceratops/scene.gltf)");
        //
        // ass_entity.setAttribute("position", "-5 -30 -150");
        // ass_entity.setAttribute("shader", "standard");
        //
        // abox.setAttribute("position", "-1 0.5 -3");
        // abox.setAttribute("color", "red");
        // abox.setAttribute("castShadow", "true");
        //
        // acylinder.setAttribute("position", "1 3 -3");
        // // acylinder.setAttribute("color", "cyan");
        //
        // // the color should be in 'material' component, not 'geometry'
        // acylinder.setAttribute('geometry',{
        //     primitive: "cylinder",
        //     radius: '0.5'
        // }, 'material',{color: "cyan"});
        //
        // ascene.setAttribute("colorManagement", "true");
    
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
	
	return 'hallo there';
}

?>
