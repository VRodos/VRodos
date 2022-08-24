<?php

function vrodos_compile_aframe($project_id, $scene_id, $showPawnPositions) {
	
	// Start node js server at 5832
	$strCmd = "node ".WP_PLUGIN_DIR."/VRodos/networked-aframe/server/easyrtc-server.js";
	
	if ( PHP_OS == "WINNT"){
		popen("start " . $strCmd, "r");
	} else {
		shell_exec($strCmd . " &");
	}
	
	// Get scene content
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
	
	class FileOperations {
	
		public bool $debug_compile = true;
//		public array $pathsDir = array("c:/xampp8/htdocs/wordpress/", "/var/www/html/vrodos/networked-aframe/examples/");
//		public array $pathsURL = array("http://127.0.0.1/wordpress", "https://vrodos.iti.gr/");
		
		function uriSelector(){
			
			return $this->debug_compile ? "http://127.0.0.1:5832/" :
										  "https://vrodos-multiplaying.iti.gr/";
				
		}
		
//		function pathToResources(){
//
//			return $this->debug_compile ?
//				"http://127.0.0.1/wordpress/wp-content/plugins/VRodos/images/aframe/" :
//									    	"https://vrodos-multiplaying.iti.gr/img/";
//
//		}
		
		function pathSelector(){
			
			// Save to file (Windows vs Linux)
			return $this->debug_compile ?
				'C:/xampp8/htdocs/wordpress/wp-content/plugins/VRodos/networked-aframe/examples/' :
										     	 '/var/www/html/net-aframe/networked-aframe/examples/';
		}
		
		function reader($filename){
			$f = fopen( $filename, "r");
			$content = fread($f, filesize($filename));
			fclose($f);
			return $content;
		}
		
		function writer($filename, $content){
			$f = fopen( $filename, "w");
			$res = fwrite($f, $content);
			fclose($f);
			return $res;
		}
		
		
		function copier($filename){
		
		}
		
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
		
		
		function createBasicDomStructureAframe($content, $scene_json){
			
			// Start Creating Aframe page
			// just some setup
			$dom = new DOMDocument("1.0", "utf-8");
			$dom->resolveExternals = true;
			
			@$dom->loadHTML($content, LIBXML_HTML_NODEFDTD | LIBXML_HTML_NOIMPLIED | LIBXML_NOBLANKS);  //LIBXML_NOERROR

			$html = $dom->documentElement;
			$head = $dom->documentElement->childNodes[0];
			$body = $dom->documentElement->childNodes[1];
			$actionsDiv = $dom->documentElement->childNodes[1]->childNodes[0];
			$ascene = $dom->documentElement->childNodes[1]->childNodes[1];
			
			// ============ Scene Iteration kernel ==============
			$metadata = $scene_json->metadata;
			$objects = $scene_json->objects;
			
			return array("dom"=>$dom, "html"=>$html, "head"=>$head, "body"=>$body, "ascene"=>$ascene, "metadata"=>$metadata, "objects"=>$objects, "actionsDiv"=>$actionsDiv);
		}
		
	}
	
	$fileOperations = new FileOperations();
	
	// Step 1: Create the index.html file by replacing certain parts only
	/**
	 * Read the index prototype, replace html links of Master and Simple client with scene_id and write back the result to another file
	 * @param $scene_id
	 *
	 * @return false|int
	 */
	function createIndexFile($project_title, $scene_id, $scene_title, $fileOperations){
		
		$filenameSource = WP_PLUGIN_DIR."/VRodos/js_libs/aframe_libs/index_prototype.html";
		
		// Read prototype
		$content = $fileOperations->reader($filenameSource);
		
		// Modify strings
		$content = str_replace("Client.html","Client_".$scene_id.".html",$content);
		
		$content = str_replace("ProjectAndSceneId",
			                   $project_title.", ".$scene_title." (".$scene_id.")",
			                          $content);
		
		// Write back to root
		return $fileOperations->writer($fileOperations->pathSelector()."index_".$scene_id.".html", $content);
    }

	
	// STEP 2: Create the director file
	function createMasterClient($project_title, $scene_id, $scene_title, $scene_json, $fileOperations, $showPawnPositions){

		// Read prototype
		$content = $fileOperations->reader(WP_PLUGIN_DIR."/VRodos/js_libs/aframe_libs/Master_Client_prototype.html");

		// Modify strings
		$content = str_replace("roomname", "room".$scene_id, $content);
		
		$basicDomElements = $fileOperations->createBasicDomStructureAframe($content, $scene_json);
		
		$dom = $basicDomElements['dom'];
		$objects = $basicDomElements['objects'];
		$ascene = $basicDomElements['ascene'];
		
		foreach($objects as $nameObject => $contentObject) {
			
			// ===========  Artifact==============
			if ( $contentObject->categoryName == 'Artifact' ) {
				
				$fileOperations->writer("output_master.txt", $contentObject->assetname);
				
				if ($contentObject->assetname != 'Water') {
					
					$a_entity = $dom->createElement( "a-entity" );
					$a_entity->appendChild( $dom->createTextNode( '' ) );
					
					$material = "";
					$fileOperations->setMaterial( $material, $contentObject );
					$fileOperations->setAffineTransformations( $a_entity, $contentObject );
					
					$a_entity->setAttribute( "class", "override-materials" );
					$a_entity->setAttribute( "id", $nameObject );
					$a_entity->setAttribute( "gltf-model", "url(" . $contentObject->glbURL . ")" );
					$a_entity->setAttribute( "material", $material );
					$a_entity->setAttribute( "clear-frustum-culling", "" );
					
					
					$ascene->appendChild( $a_entity );
					
				} else {
				
//					<a-ocean ocean-state="wind_velocity: 0.25 0.25;" shadow="receive: true" ocean-depth></a-ocean>
					
					$a_entity = $dom->createElement( "a-ocean" );
					$a_entity->appendChild( $dom->createTextNode( '' ) );
					
					$a_entity->setAttribute( "ocean-state", "wind_velocity: 0.25 0.25; height_offset:0;" );
					$a_entity->setAttribute( "shadow", "receive: true" );
					$a_entity->setAttribute( "ocean-depth", "" );
					
					$ascene->appendChild( $a_entity );
				}
				
				//==================== Pawn =================
			} else if ( $contentObject->categoryName == 'pawn' ) {

				if($showPawnPositions=="true") {
					$a_entity = $dom->createElement( "a-entity" );
					$a_entity->appendChild( $dom->createTextNode( '' ) );
					$fileOperations->setAffineTransformations( $a_entity, $contentObject );
					$a_entity->setAttribute( "gltf-model", "url(http://127.0.0.1/wordpress/wp-content/plugins/VRodos/assets/pawn.glb)" );
					$ascene->appendChild( $a_entity );
				}
				
			} else if ( $contentObject->categoryName == 'lightSun' ||
			            $contentObject->categoryName == 'lightSpot' ||
			            $contentObject->categoryName == 'lightLamp' ||
			            $contentObject->categoryName == 'lightAmbient'
			) {
				
				$a_light = $dom->createElement( "a-light" );
				$a_light->appendChild( $dom->createTextNode( '' ) );
				
				// Affine transformations
				$fileOperations->setAffineTransformations($a_light, $contentObject);
				
				switch ($contentObject->categoryName){
					case 'lightSun':
						
						$a_light_target = $dom->createElement( "a-entity" );
						$a_light_target->appendChild( $dom->createTextNode( '' ) );
						$a_light_target->setAttribute("position", implode( " ", $contentObject->targetposition ) );
						$a_light_target->setAttribute("id", $nameObject."target");
						
						$ascene->appendChild($a_light_target);
						
						$a_light->setAttribute("light", "type:directional;".
						                                "color:".$fileOperations->colorRGB2Hex($contentObject->lightcolor).";".
						                                "intensity:".($contentObject->lightintensity).";"
						);
						
						$a_light->setAttribute("target", "#".$nameObject."target");
						
					
						
						
						// Define the sun at the sky and add it to scene
						// <a-sun-sky material="side:back; sunPosition: 1.0 1.0 0.0"></a-sun-sky>
					
						$a_sun_sky = $dom->createElement( "a-sun-sky" );
						$a_sun_sky->appendChild( $dom->createTextNode( '' ) );
						
						$SunPosVec = $contentObject->position;
						$TargetVec = $contentObject->targetposition;
						
						$SkySun = array( $SunPosVec[0] - $TargetVec[0], $SunPosVec[1] - $TargetVec[1],
							$SunPosVec[2] - $TargetVec[2]);
						
						$materialSunSky = 'side:back; sunPosition: ';
						$materialSunSky = $materialSunSky . $SkySun[0] . ' ' . $SkySun[1] . ' ' . $SkySun[2];
						$a_sun_sky->setAttribute("material", $materialSunSky);
						
						$ascene->appendChild( $a_sun_sky );
						
						break;
					case 'lightSpot':
						$a_light->setAttribute("light", "type:spot;".
						                                "color:".$fileOperations->colorRGB2Hex($contentObject->lightcolor).";".
						                                "intensity:".$contentObject->lightintensity.";".
						                                "distance:".$contentObject->lightdistance.";".
						                                "decay:".$contentObject->lightdecay.";".
						                                "angle:".$contentObject->lightangle.";".
						                                "penumbra:".$contentObject->lightpenumbra.";".
						                                "target:".$contentObject->lighttargetobjectname
						);
						break;
					case 'lightLamp':
						$a_light->setAttribute("light", "type:point;".
						                                "color:".$fileOperations->colorRGB2Hex($contentObject->lightcolor).";".
						                                "intensity:".$contentObject->lightintensity.";".
						                                "distance:".$contentObject->lightdistance.";".
						                                "decay:".$contentObject->lightdecay.";"
						//."radius:".$contentObject->shadowRadius
						);
						break;
					case 'lightAmbient':
						$a_light->setAttribute("light", "type:ambient;".
						                                "color:".$fileOperations->colorRGB2Hex($contentObject->lightcolor).";".
						                                "intensity:".$contentObject->lightintensity);
						break;
				}
				
				// Add to scene
				$ascene->appendChild( $a_light );
			}
		}
		
		$contentNew = $dom->saveHTML();
	
		// Write back to root
        return $fileOperations->writer($fileOperations->pathSelector().'Master_Client_'.$scene_id.".html", $contentNew);
	}
	
	
	
	
	
	// Step 3: Create the Simple client file
	function createSimpleClient($project_title, $scene_id, $scene_title, $scene_json, $fileOperations){

		// Read prototype
		$content = $fileOperations->reader(WP_PLUGIN_DIR."/VRodos/js_libs/aframe_libs/Simple_Client_prototype.html");

		// Modify strings
		$content = str_replace("roomname", "room".$scene_id, $content);
		
		// Create Basic dom structure for an aframe page
		$basicDomElements = $fileOperations->createBasicDomStructureAframe($content, $scene_json);
		
		$dom = $basicDomElements['dom'];
		$objects = $basicDomElements['objects'];
		$ascene = $basicDomElements['ascene'];
		$actionsDiv = $basicDomElements['actionsDiv'];
		
		$fileOperations->writer("output_simple_client.html", print_r($basicDomElements, true));
		
		$i = 0;
		foreach($objects as $nameObject => $contentObject) {
		
//			$f = fopen("output_simple_client.txt", "w");
//			fwrite($f, print_r($basicDomElements['actionsDiv'], true));
//			fclose($f);
			
			if ( $contentObject->categoryName == 'pawn' ) {
				$i++;
				$buttonDiv = $dom->createElement( "button" );
				
				$buttonDiv->setAttribute("id", "screen-btn-".$i);
				$buttonDiv->setAttribute("type", "button");
				$buttonDiv->setAttribute("class", "positionalButtons");
				
				$pos_x = $contentObject->position[0];
				$pos_y = $contentObject->position[1];
				$pos_z = $contentObject->position[2];
				
				$rot_x = $contentObject->rotation[0];
				$rot_y = $contentObject->rotation[1];
				$rot_z = $contentObject->rotation[2];
				
				$buttonDiv->setAttribute("data-position", '{"x":'.$pos_x.',"y":'.$pos_y.',"z":'.$pos_z.'}');
				$buttonDiv->setAttribute("data-rotation", '{"x":'.$rot_x.',"y":'.$rot_y.',"z":'.$rot_z.'}');
				
				$iconSpan = $dom->createElement( "span" );
				$iconSpan->appendChild( $dom->createTextNode( 'room' ) );
				$iconSpan->setAttribute("class", "material-icons");
				
				$buttonDiv->appendChild($iconSpan);
				
				$buttonDiv->appendChild( $dom->createTextNode( $i ) );
				$actionsDiv->appendChild( $buttonDiv );
			}
		}
		
		$contentNew = $dom->saveHTML();
		
		// Write back to root
		return $fileOperations->writer($fileOperations->pathSelector().'Simple_Client_'.$scene_id.".html", $contentNew);
	}
	
	
	// Step 1: Create the index file
	createIndexFile($project_title, $scene_id, $scene_title, $fileOperations );
	
	// Step 2: Create the Master client file
	createMasterClient($project_title, $scene_id, $scene_title, $scene_json, $fileOperations, $showPawnPositions);
	
	// Step 3; Create Simple Client
	createSimpleClient($project_title, $scene_id, $scene_title, $scene_json, $fileOperations);

	return json_encode(
		                array("index" => $fileOperations->uriSelector()."index_".$scene_id.".html",
		                     "MasterClient" => $fileOperations->uriSelector()."Master_Client_".$scene_id.".html",
		                     "SimpleClient" => $fileOperations->uriSelector()."Simple_Client_".$scene_id.".html",
			                )
					  );
}


// -------- Obsolete ---------

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

// Add script to body (Already in template)
//	addScript($dom, $body, "http://127.0.0.1/wordpress/wp-content/plugins/VRodos/js_libs/aframe_libs/glb_material_changer.js");
