<?php

$scene_content_text = '{ "metadata": { "formatVersion" : 4.0, "type" : "scene", "generatedBy" : "SceneExporter.js", "ClearColor" : "#eeeeee", "toneMappingExposure" : "1", "enableEnvironmentTexture" : "true", "objects" : 4 }, "urlBaseType": "relativeToScene", "objects" : { "avatarCamera" : { "position" : [-1.5073529542515,1.3,3.7404941859495], "rotation" : [0,-0.911,0], "quaternion" : [0.0000,0.8980,0.0000,-0.4399], "quaternion_player" : [0.0000,0.8980,0.0000,-0.4399], "quaternion_camera" : [0.0000,0.0000,0.0000,1.0000], "scale" : [1,1,1], "categoryName" : "avatarYawObject", "visible" : true}, "mylightSun_1659425171" : { "position" : [0,22.75008251523832,0], "rotation" : [0,0,0], "quaternion" : [0,0,0,1], "scale" : [1,1,1], "lightintensity" : "1", "lightcolor" : [1.000,1.000,1.000], "targetposition" : [0,0,0], "categoryName" : "lightSun", "isLight" : "true", "children" : { } }, "cube-2_1659423753" : { "position" : [4.6199684335364,0,-9.0368613315372], "rotation" : [0,0,0], "quaternion" : [0,0,0,1], "scale" : [1,1,1], "fnPath" : "/127.0.0.1/wordpress/wp-content/uploads", "assetid" : "458", "assetname" : "Cube", "fnObj" : "", "fnObjID" : "", "categoryName" : "Artifact", "categoryDescription" : "undefined", "categoryIcon" : "undefined", "categoryID" : "41", "fbxID" : "", "glbID" : "459", "color" : "ff4c82", "emissive" : "000000", "roughness" : "0.5", "metalness" : "0", "emissiveIntensity" : "0", "videoTextureSrc" : "", "videoTextureRepeatX" : "", "videoTextureRepeatY" : "", "videoTextureCenterX" : "", "videoTextureCenterY" : "", "videoTextureRotation" : "", "audioID" : "", "image1id" : "", "doorName_source" : "", "doorName_target" : "", "sceneName_target" : "", "sceneID_target" : "", "archaeology_penalty" : "0", "hv_penalty" : "0", "natural_penalty" : "0", "isreward" : "0", "isCloned" : "false", "isLight" : "false", "fnMtl" : "", "fnMtlID" : "", "children" : { } }, "cube-2_1659423773" : { "position" : [0,0,9.8491634736978], "rotation" : [0,0,0], "quaternion" : [0,0,0,1], "scale" : [1,1,1], "fnPath" : "/127.0.0.1/wordpress/wp-content/uploads", "assetid" : "458", "assetname" : "Cube", "fnObj" : "", "fnObjID" : "", "categoryName" : "Artifact", "categoryDescription" : "undefined", "categoryIcon" : "undefined", "categoryID" : "41", "fbxID" : "", "glbID" : "459", "color" : "ffffff", "emissive" : "000000", "roughness" : "undefined", "metalness" : "undefined", "emissiveIntensity" : "undefined", "videoTextureSrc" : "http://127.0.0.1/wordpress/wp-content/uploads/2022/02/mov_bbb.mp4", "videoTextureRepeatX" : "0", "videoTextureRepeatY" : "0", "videoTextureCenterX" : "0", "videoTextureCenterY" : "0", "videoTextureRotation" : "0", "audioID" : "", "image1id" : "", "doorName_source" : "", "doorName_target" : "", "sceneName_target" : "", "sceneID_target" : "", "archaeology_penalty" : "0", "hv_penalty" : "0", "natural_penalty" : "0", "isreward" : "0", "isCloned" : "false", "isLight" : "false", "fnMtl" : "", "fnMtlID" : "", "children" : { } }, "cube-2_1659423766" : { "position" : [-10.610696731968,0,-7.1076437439056], "rotation" : [0,0,0], "quaternion" : [0,0,0,1], "scale" : [1,1,1], "fnPath" : "/127.0.0.1/wordpress/wp-content/uploads", "assetid" : "458", "assetname" : "Cube", "fnObj" : "", "fnObjID" : "", "categoryName" : "Artifact", "categoryDescription" : "undefined", "categoryIcon" : "undefined", "categoryID" : "41", "fbxID" : "", "glbID" : "459", "color" : "d0b9ff", "emissive" : "000000", "roughness" : "0.5", "metalness" : "0.31", "emissiveIntensity" : "0", "videoTextureSrc" : "", "videoTextureRepeatX" : "", "videoTextureRepeatY" : "", "videoTextureCenterX" : "", "videoTextureCenterY" : "", "videoTextureRotation" : "", "audioID" : "", "image1id" : "", "doorName_source" : "", "doorName_target" : "", "sceneName_target" : "", "sceneID_target" : "", "archaeology_penalty" : "0", "hv_penalty" : "0", "natural_penalty" : "0", "isreward" : "0", "isCloned" : "false", "isLight" : "false", "fnMtl" : "", "fnMtlID" : "", "children" : { } } } }';


$scene_content_text = trim( preg_replace( '/\s+/S', '', $scene_content_text ) );
$scene_json = json_decode( $scene_content_text );

//print_r($scene_json);


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


// Scene Iteration kernel
$metadata = $scene_json->metadata;
$objects = $scene_json->objects;

foreach($objects as $nameObject => $contentObject) {
		//if ($nameObject) { echo 'Object name is: '.$nameObject.chr(13); };
	
	//foreach($contentObject as $property => $val){
	
//		if ($property) { echo 'Property is: '.$property.chr(13); };
//		if ($val) { echo 'Property value is: '.print_r($val, true).chr(13); };
		
		//print_r($contentObject->categoryName == 'Artifact');
	
		if ($contentObject->categoryName == 'Artifact') {
			$aBox = $dom->createElement( "a-box" );
			$aBox->appendChild( $dom->createTextNode( '' ) );
			
			// Attributes
			$aBox->setAttribute( "position", implode( " ", $contentObject->position ) );
			$aBox->setAttribute( "rotation", implode( " ", $contentObject->rotation ) );
			$aBox->setAttribute( "scale", implode( " ", $contentObject->scale ) );
			$aBox->setAttribute( "color", "#".$contentObject->color);
			
			$material = "";
			
			if ($contentObject->color   ){ $material .= "color: #".$contentObject->color.";";}
			if ($contentObject->emissive){ $material .= "emissive: #".$contentObject->emissive.";";}
			if ($contentObject->emissiveIntensity){ $material .= "emissiveIntensity: ".$contentObject->emissiveIntensity.";";}
			if ($contentObject->roughness){$material .= "roughness: ".$contentObject->roughness.";";}
			if ($contentObject->metalness){$material .= "metalness: ".$contentObject->metalness.";";}
			if ($contentObject->videoTextureSrc){$material .= "src: url(".$contentObject->videoTextureSrc.");";}
			if ($contentObject->videoTextureRepeatX){$material .= "repeat: ".$contentObject->videoTextureRepeatX." "
			                                                                .$contentObject->videoTextureRepeatY.";";}
			
			$aBox->setAttribute( "material", $material);
			
			// Add to scene
			$ascene->appendChild( $aBox );
		}
		
		
	//}
}


// Create a Box
//$aBox = $dom->createElement("a-box");
//$aBox->appendChild($dom->createTextNode(''));
//$aBox->setAttribute("position", "-1 0.5 -3");
//$aBox->setAttribute("rotation", "0 45 0");
//$aBox->setAttribute("color", "#4CC3D9");
//$ascene->appendChild($aBox);

// ----- print to output ----
echo $outXML = $dom->saveXML();
