<?php

function vrodos_compile_aframe($scene_id) {
	
        $scene_post         = get_post( $scene_id );
        $scene_content_text      = $scene_post->post_content;
		$scene_content_text = trim( preg_replace( '/\s+/S', '', $scene_content_text ) );
	    $scene_json = json_decode( $scene_content_text );
		
        // Add glbURLs from glbID
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
		
		//$html=$dom->documentElement;
		$head = $dom->documentElement->childNodes[0];
		$body=$dom->documentElement->childNodes[1];
		$ascene = $dom->documentElement->childNodes[1]->childNodes[0];
	
		// Head scripts
		function addScript($dom, $head, $src_url){
			$scriptLib = $dom->createElement("script");
			$scriptLib->appendChild($dom->createTextNode(''));
			$scriptLib->setAttribute("src", $src_url);
			$head->appendChild($scriptLib);
		}

		addScript($dom, $head, "https://aframe.io/releases/1.3.0/aframe.min.js");
		

		
		// Scene Iteration kernel
		$metadata = $scene_json->metadata;
		$objects = $scene_json->objects;
		
		function setAffineTransformations($entity, $contentObject){
			
			$entity->setAttribute( "position", implode( " ", $contentObject->position ) );
			$entity->setAttribute( "rotation", implode( " ", $contentObject->rotation ) );
			$entity->setAttribute( "scale", implode( " ", $contentObject->scale ) );
		}
		
		function colorRGB2Hex($colorRGB){
			return sprintf("#%02x%02x%02x", 255*$colorRGB[0], 255*$colorRGB[1], 255*$colorRGB[2]);
		}
		
		function setMaterial(&$material, $contentObject){
			if ( $contentObject->color ) {
				$material .= "color:#" . $contentObject->color.";";
			}
			if ( $contentObject->emissive ) {
				$material .= "emissive:#" . $contentObject->emissive.";";
			}
			if ( $contentObject->emissiveIntensity ) {
				$material .= "emissiveIntensity:" . $contentObject->emissiveIntensity . ";";
			}
			if ( $contentObject->roughness ) {
				$material .= "roughness:" . $contentObject->roughness . ";";
			}
			if ( $contentObject->metalness ) {
				$material .= "metalness:" . $contentObject->metalness . ";";
			}
			if ( $contentObject->videoTextureSrc ) {
				$material .= "src:url(" . $contentObject->videoTextureSrc . ");";
			}
			if ( $contentObject->videoTextureRepeatX ) {
				$material .= "repeat:".$contentObject->videoTextureRepeatX." ".$contentObject->videoTextureRepeatY.";";
			}
		}
		
		foreach($objects as $nameObject => $contentObject) {

			// ===========  Artifact==============
			if ( $contentObject->categoryName == 'Artifact' ) {
				
				$a_entity = $dom->createElement( "a-entity" );
				$a_entity->appendChild( $dom->createTextNode( '' ) );
				
				// Affine transformations
				setAffineTransformations($a_entity, $contentObject);
				
				// This overrides and updates glb materials according to material attribute
				$a_entity->setAttribute("class", "override-materials");
				
				$a_entity->setAttribute("id", $nameObject);

				// 3D Model
				$a_entity->setAttribute("gltf-model", "url(".$contentObject->glbURL.")");
				
				// Material
				$material = "";
				setMaterial($material, $contentObject);
				
				$a_entity->setAttribute( "material", $material );
				
				$ascene->appendChild( $a_entity );
				
				//==================== Pawn =================
			} else if ( $contentObject->categoryName == 'pawn' ) {
				
				$a_entity = $dom->createElement( "a-entity" );
				$a_entity->appendChild( $dom->createTextNode( '' ) );
				
				// Affine transformations
				setAffineTransformations($a_entity, $contentObject);
				
				// 3D Model
				$a_entity->setAttribute("gltf-model", "url(http://127.0.0.1/wordpress/wp-content/plugins/VRodos/assets/pawn.glb)");
				
				// Add to scene
				$ascene->appendChild( $a_entity );

			} else if ( $contentObject->categoryName == 'lightSun' ) {
				
				$a_light = $dom->createElement( "a-light" );
				$a_light->appendChild( $dom->createTextNode( '' ) );
				
				// Affine transformations
				setAffineTransformations($a_light, $contentObject);
				
				$a_light->setAttribute("light", "type:directional;".
				                                   "color:".colorRGB2Hex($contentObject->lightcolor).";".
				                                   "intensity:".$contentObject->lightintensity.";"
				                                 );
				
				$a_light->setAttribute("target", "#".$nameObject."target");
				
				
				$a_light_target = $dom->createElement( "a-entity" );
				$a_light_target->appendChild( $dom->createTextNode( '' ) );
				
				$a_light_target->setAttribute( "position", implode( " ", $contentObject->targetposition ) );
				$a_light_target->setAttribute("id", $nameObject."target");
				
				$a_light->appendChild($a_light_target);
				
				//$a_light->setAttribute("target", "#".$contentObject->targetposition);
				
				// Add to scene
				$ascene->appendChild( $a_light );
				
			} else if ( $contentObject->categoryName == 'lightSpot' ) {
				
				$a_light = $dom->createElement( "a-light" );
				$a_light->appendChild( $dom->createTextNode(''));
				
				setAffineTransformations($a_light, $contentObject);
				
				$a_light->setAttribute("light", "type:spot;".
				                                 "color:".colorRGB2Hex($contentObject->lightcolor).";".
				                                 "intensity:".$contentObject->lightintensity.";".
				                                 "distance:".$contentObject->lightdistance.";".
				                                 "decay:".$contentObject->lightdecay.";".
				                                 "angle:".$contentObject->lightangle.";".
				                                 "penumbra:".$contentObject->lightpenumbra.";".
				                                 "target:".$contentObject->lighttargetobjectname
                                      );
				
				// Add to scene
				$ascene->appendChild( $a_light );
			
			} else if ( $contentObject->categoryName == 'lightLamp' ) {
				
				$a_light = $dom->createElement( "a-light" );
				$a_light->appendChild( $dom->createTextNode(''));
				
				setAffineTransformations($a_light, $contentObject);
				
				$a_light->setAttribute("light", "type:point;".
				                                 "color:".colorRGB2Hex($contentObject->lightcolor).";".
				                                 "intensity:".$contentObject->lightintensity.";".
				                                 "distance:".$contentObject->lightdistance.";".
				                                 "decay:".$contentObject->lightdecay.";"
				                                 //."radius:".$contentObject->shadowRadius
				                       );
				
				// Add to scene
				$ascene->appendChild( $a_light );
			
			} else if ( $contentObject->categoryName == 'lightAmbient' ) {
				
				$a_light = $dom->createElement( "a-light" );
				$a_light->appendChild( $dom->createTextNode(''));
				setAffineTransformations($a_light, $contentObject);
				
				$a_light->setAttribute("light", "type:ambient;".
				                                 "color:".colorRGB2Hex($contentObject->lightcolor).";".
				                                 "intensity:".$contentObject->lightintensity);
				
				// Add to scene
				$ascene->appendChild( $a_light );
			}
			
			
		}
	
	
	
	
		// Add script to body
		addScript($dom, $body, "http://127.0.0.1/wordpress/wp-content/plugins/VRodos/js_libs/aframe_libs/glb_material_changer.js");
		
		
		
		// ----- print to output ----
		echo $outXML = $dom->saveXML();
		
        $debug_compile = true;
        
        // Save to html
        $pathToAframe = $debug_compile ? 'C:\xampp8\htdocs\wordpress\\' :
            '/var/www/html/net-aframe/networked-aframe/examples/';
        
        $filepath = $pathToAframe.'generated_experience'.$scene_id.".html";
        
        $f = fopen($filepath, "w");
        fwrite($f, print_r($outXML, true));
        fclose($f);


        
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
