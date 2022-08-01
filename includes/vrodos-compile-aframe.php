<?php

function vrodos_compile_aframe($scene_id) {
	
	
        $scene_post         = get_post( $scene_id );
        $scene_content_text      = $scene_post->post_content;
	
//	    $scene_json_as_text = trim( preg_replace( '/\s+/S', '', $scene_content ) );
	
	    $scene_json = json_decode( $scene_content_text );
	
        
        // Add glbURLs
        foreach ( $scene_json->objects as &$o ) {
            if ( $o->categoryName == "Artifact" ) {
                $glbURL = get_the_guid( $o->glbID );
                $o->glbURL = $glbURL;
            }
            
        }
        
        
        // Start Creating Aframe page



		// just some setup
		$dom = new DOMDocument('1.0');
		$dom->preserveWhiteSpace = false;
		$dom->formatOutput = true;
		@$dom->loadHTML("<html><head></head><body><a-scene></a-scene></body></html>");
		
		$html=$dom->documentElement;
		$head=$dom->documentElement->childNodes[0];
		$body=$dom->documentElement->childNodes[1];
		$ascene=$dom->documentElement->childNodes[1]->childNodes[0];
	
		// Head script
		$scriptLib = $dom->createElement("script");
		$scriptLib->appendChild($dom->createTextNode(''));
		$scriptLib->setAttribute("src", "https://aframe.io/releases/1.3.0/aframe.min.js");
		$head->appendChild($scriptLib);
	
		// Create a Box
		$aBox = $dom->createElement("a-box");
		$aBox->appendChild($dom->createTextNode(''));
		$aBox->setAttribute("position", "-1 0.5 -3");
		$aBox->setAttribute("rotation", "0 45 0");
		$aBox->setAttribute("color", "#4CC3D9");
		$ascene->appendChild($aBox);
	
		// ----- print to output ----
		echo $outXML = $dom->saveXML();
	
	
        $debug_compile = true;
        
        // Step 1. Open a file in file system for making the Aframe html file
        
        $pathToAframe = $debug_compile ? 'C:\xampp8\htdocs\wordpress\\' :
            '/var/www/html/net-aframe/networked-aframe/examples/';
        
        $filepath = $pathToAframe.'generated_experience'.$scene_id.".html";
        
        $f = fopen($filepath, "w");
        fwrite($f, print_r($outXML, true));
        fclose($f);


        //
        //
        // let doc = document.implementation.createHTMLDocument("aframe_web_page");
        //
        // let header = doc.children[0].children[0];
        // let body = doc.children[0].children[1];
        //
        // // Aframe library
        // const script = document.createElement('script');
        // script.type = 'text/javascript';
        // script.src = "https://aframe.io/aframe/dist/aframe-master.min.js";
        //
        // // Append script lib to header
        // header.appendChild(script);
        //
        // // Append a-scene to body
        // let ascene = document.createElement("a-scene");
        // body.appendChild(ascene);
        //
        // let scene_json_keys = Object.keys(scene_json.objects);
        //
        // for (let i=0; i < scene_json_keys.length; i++) {
        //
        //     let v = Object.values(scene_json.objects)[i];
        //
        //     console.log(v.position[0]);
        //
        //     let a_entity = document.createElement("a-entity");
        //
        //     switch (v.categoryName) {
        //         case 'Artifact':
        //             a_entity.setAttribute("gltf-model", v.glbURL);
        //             break;
        //         case 'lightSun':
        //             a_entity.setAttribute('light', {type: 'directional', color: v.lightcolor, intensity: v.lightintensity});
        //             break;
        //         case 'lightSpot':
        //             a_entity.setAttribute('light', {type: 'directional', color: v.lightcolor, intensity: v.lightintensity});
        //             break;
        //         case 'lightLamp':
        //             a_entity.setAttribute('light', {type: 'point', color: v.lightcolor, intensity: v.lightintensity});
        //             break;
        //         case 'lightAmbient':
        //             a_entity.setAttribute('light', {type: 'point', color: v.lightcolor, intensity: v.lightintensity});
        //             break;
        //         case 'pawn':
        //             a_entity.setAttribute("gltf-model", "url(https://vrodos.iti.gr/wp-content/plugins/vrodos/assets/pawn.glb)");
        //             break;
        //     }
        //
        //     a_entity.setAttribute("position",  v.position[0] + " " + v.position[1] + " " + v.position[2]);
        //
        //     a_entity.setAttribute("rotation",  v.rotation[0] + " " + v.rotation[1] + " " + v.rotation[2]);
        //
        //     a_entity.setAttribute("scale"   ,  v.scale[0]    + " " + v.scale[1]    + " " + v.scale[2]);
        //
        //     ascene.appendChild(a_entity);
        // }
        //
        //
        //





	return "SuccessMe";
}

//	function vrodos_main_convertToAframe($buffer)
//    {
//        $scene_id = $_GET["scene_id"];
//

//        // Step 2. Define the URL for calling the generated experience html aframe
//        $baseURL = $debug_compile ? 'http://127.0.0.1/wordpress/' : "https://vrodos-multiplaying.iti.gr/";
//        $final_path = $baseURL.'generated_experience'.$scene_id.".html";
//
//        // Return the link
//        return  file_exists($filepath) ? '<a href="'.$final_path.'">Generated html</a>' : "An error has occurred";
//    }
