<?php

function vrodos_compile_aframe($project_id, $scene_id) {
	
	$project_post = get_post($project_id);
	$project_title = $project_post->post_title;
	$scene_post         = get_post( $scene_id );
	$scene_content_text = $scene_post->post_content;
	$scene_title = $scene_post->post_title;
	
	// Transform JSON text into JSON objects by decode function
	$scene_content_text = trim( preg_replace( '/\s+/S', '', $scene_content_text ) );
	$scene_json = json_decode( $scene_content_text );
	
	// Add glbURLs from glbID
	foreach ( $scene_json->objects as &$o ) {
		if ( $o->categoryName == "Artifact" ) {
			$glbURL = get_the_guid( $o->glbID );
			$o->glbURL = $glbURL;
		}
	}
	
	// Step 1: Create the index.html file by replacing certain parts only
	/**
	 * Read the index prototype, replace html links of Master and Simple client with scene_id and write back the result to another file
	 * @param $scene_id
	 *
	 * @return false|int
	 */
	function createIndexFile($project_title, $scene_id, $scene_title){
		
		$filenameSource = WP_PLUGIN_DIR."/VRodos/js_libs/aframe_libs/index_prototype.html";
		$filenameTarget = WP_PLUGIN_DIR."/VRodos/js_libs/aframe_libs/index_".$scene_id.".html";
		
		// Read prototype
		$f_index_src = fopen( $filenameSource, "r");
		$content = fread($f_index_src, filesize($filenameSource));
		fclose($f_index_src);
		
		// Modify strings
		$content = str_replace("Simple_Client.html",
							   "Simple_Client_".$scene_id.".html",
			                          $content);
	
		$content = str_replace("Master_Client.html",
			                   "Master_Client_".$scene_id.".html",
			                          $content);
	
		$content = str_replace("ProjectAndSceneId",
			                   $project_title.", ".$scene_title." (".$scene_id.")",
			                          $content);

		// Write back
		$f_index_trg = fopen( $filenameTarget, "w");
		$res = fwrite($f_index_trg, $content);
		fclose($f_index_trg);

		return $res;
    }
	
	// Step 1: Create the index file
	$resIndexCreate = createIndexFile($project_title, $scene_id, $scene_title );

	
	// STEP 2: Create the director file
	function createMasterClient($project_title, $scene_id, $scene_title, $scene_json){

		$filenameSource = WP_PLUGIN_DIR."/VRodos/js_libs/aframe_libs/Master_Client_prototype.html";
		$filenameTarget = WP_PLUGIN_DIR."/VRodos/js_libs/aframe_libs/Master_Client_".$scene_id."_intermediate.html";

		// Read prototype
		$f_src = fopen( $filenameSource, "r");
		$content = fread($f_src, filesize($filenameSource));
		fclose($f_src);

		// Modify strings
		$content = str_replace("roomname", "room".$scene_id, $content);

		// Write back
		$f_trg = fopen( $filenameTarget, "w");
		$res = fwrite($f_trg, $content);
		fclose($f_trg);
		
		// Start Creating Aframe page
		// just some setup
		$dom = new DOMDocument("1.0", "utf-8");
		$dom->resolveExternals = true;
		
		$content = preg_replace('/\>\s+\</m', '><', $content);
		$content = preg_replace(['(\s+)u', '(^\s|\s$)u'], [' ', ''], $content);
		@$dom->loadHTML($content);  //LIBXML_NOERROR
		
		
		
		$html=$dom->documentElement;
		$head = $dom->documentElement->childNodes[0];
		$body=$dom->documentElement->childNodes[1];
	    $ascene = $dom->documentElement->childNodes[1]->childNodes[1];
		
		// Already Included
		// Head scripts
		//		function addScript($dom, $head, $src_url){
		//			$scriptLib = $dom->createElement("script");
		//			$scriptLib->appendChild($dom->createTextNode(''));
		//			$scriptLib->setAttribute("src", $src_url);
		//			$head->appendChild($scriptLib);
		//		}
		//
		//		addScript($dom, $head, "https://aframe.io/releases/1.3.0/aframe.min.js");
	
	
		// ============ Scene Iteration kernel ==============
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
	
	
	// Add script to body (Already in template)
	//	addScript($dom, $body, "http://127.0.0.1/wordpress/wp-content/plugins/VRodos/js_libs/aframe_libs/glb_material_changer.js");
		
		$contentNew = $dom->saveHTML();
		
		$debug_compile = true;
		
		// Save Master_Client to html
		$pathToAframe = $debug_compile ? 'C:\xampp8\htdocs\wordpress\\' :
			'/var/www/html/net-aframe/networked-aframe/examples/';
		
		$filepath = $pathToAframe.'Master_Client_'.$scene_id.".html";
		
		$f = fopen($filepath, "w");
		fwrite($f, print_r($contentNew, true));
		fclose($f);
		
		 
		 //echo $outHTML = $dom->saveHTML();
		 return $res;
	}
	
	// Step 2: Create the Master client file
	$res = createMasterClient($project_title, $scene_id, $scene_title, $scene_json);
		

  

	
		
		//        // Step 2. Define the URL for calling the generated experience html aframe
		//        $baseURL = $debug_compile ? 'http://127.0.0.1/wordpress/' : "https://vrodos-multiplaying.iti.gr/";
		//        $final_path = $baseURL.'generated_experience'.$scene_id.".html";
		//
		//        // Return the link
		//        return  file_exists($filepath) ? '<a href="'.$final_path.'">Generated html</a>' : "An error has occurred";
	

	return "SuccessMe";
}


