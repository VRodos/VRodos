<?php

function vrodos_compile_aframe($project_id, $scene_id_list, $showPawnPositions)
{

    // Check if a process is running on linux server
    function processExists($processName) {
        $exists= false;
        exec("ps -A | grep -i $processName | grep -v grep", $pids);
        if (count($pids) > 0) {
            $exists = true;
        }
        return $exists;
    }


    // Start node js server at port 5832
    $strCmd = "node ".plugin_dir_path( __DIR__  )."/networked-aframe/server/easyrtc-server.js";

    if ( PHP_OS == "WINNT"){
        popen("start " . $strCmd, "r");
    } else {
        // if not already running (linux)
        if (!processExists("networked-afr")) {
            shell_exec( $strCmd . " > /dev/null 2>/dev/null &" );
        }
        sleep(2);
    }
    foreach (array_reverse($scene_id_list) as $key => &$value) {
        // Get scene content
        $project_post[$key] = get_post($project_id);
        $project_title = $project_post[$key]->post_title;
        $scene_post[$key] = get_post( $value );
        $scene_content_text[$key] = $scene_post[$key]->post_content;
        $scene_title[$key] = $scene_post[$key]->post_title;

        // Transform JSON text into JSON objects by decode function
        // $scene_content_text[$key] = trim( preg_replace( '/\s+/S', '', $scene_content_text[$key] ) );
        $scene_json[$key] = json_decode( $scene_content_text[$key] );


        //print_r($scene_json[$key]->objects->poi_img_title);   //TODO remove space for desc and title
        $objCount = 0;

        //$scene_content_text[$key] = trim( preg_replace( '/\s+/S', '', $scene_content_text[$key] ) );
        $scene_json[$key] = json_decode( $scene_content_text[$key] );

    }

    class FileOperations {

        public string $server_protocol;
        public string $portNodeJs;

        function __construct(){
            $this->server_protocol = is_ssl() ? "https":"http";

            // Define current url path of plugin including plugin name
            $this->plugin_path_url = plugin_dir_url( __DIR__  );

            // Define current dir path of plugin including plugin name
            $this->plugin_path_dir = plugin_dir_path( __DIR__  );

            $this->website_root_url = parse_url( get_site_url(), PHP_URL_HOST );

            $this->portNodeJs = "5832";

            if ($this->website_root_url == 'vrexpo.iti.gr' ) {
                $this->portNodeJs = "5840";
            }



//			$f = fopen("output_compile.txt", "w");
//			fwrite($f, $plugin_path_url . chr(13));
//			fwrite($f, $plugin_path_dir . chr(13));
//			fwrite($f, $website_root_url . chr(13));
//			fwrite($f, $server_protocol . chr(13));
//			fclose($f);
        }

        function nodeJSpath()
        {

            if (PHP_OS == "WINNT") {
                $site_path = $this->server_protocol . "://" . $this->website_root_url . ":" . $this->portNodeJs . "/";
                return $site_path;
            } else {

                if ($this->website_root_url == 'vrexpo.iti.gr') {
                    $site_path = "https://vrexpo-multi.iti.gr/";
                }
                else {
                    $site_path = "https://vrodos-multiplaying.iti.gr/";
                }
                return $site_path;
            }
        }

        function reader($filename)
        {
            $f = fopen($filename, "r");
            $content = fread($f, filesize($filename));
            fclose($f);
            return $content;
        }

        function writer($filename, $content)
        {
            $f = fopen($filename, "w");
            $res = fwrite($f, $content);
            fclose($f);
            return $res;
        }

        function setAffineTransformations($entity, $contentObject)
        {
            $entity->setAttribute("position", implode(" ", $contentObject->position));
            $entity->setAttribute("rotation", implode(" ", [
                -180 / pi() * $contentObject->rotation[0], 180 / pi() * $contentObject->rotation[1],
                180 / pi() * $contentObject->rotation[2]
            ]));

            $entity->setAttribute("scale", implode(" ", $contentObject->scale));
        }

        function colorRGB2Hex($colorRGB)
        {
            return sprintf("#%02x%02x%02x", 255 * $colorRGB[0], 255 * $colorRGB[1], 255 * $colorRGB[2]);
        }

        function setMaterial(&$material, $contentObject)
        {
            if ($contentObject->color) {
                $material .= "color:#" . $contentObject->color . ";";
            }
            if ($contentObject->emissive) {
                $material .= "emissive:#" . $contentObject->emissive . ";";
            }
            if ($contentObject->emissiveIntensity) {
                $material .= "emissiveIntensity:" . $contentObject->emissiveIntensity . ";";
            }
            if ($contentObject->roughness) {
                $material .= "roughness:" . $contentObject->roughness . ";";
            }
            if ($contentObject->metalness) {
                $material .= "metalness:" . $contentObject->metalness . ";";
            }
            if ($contentObject->videoTextureSrc) {
                $material .= "src:url(" . $contentObject->videoTextureSrc . ");";
            }
            if ($contentObject->videoTextureRepeatX) {
                $material .= "repeat:" . $contentObject->videoTextureRepeatX . " " . $contentObject->videoTextureRepeatY . ";";
            }
        }


        function createBasicDomStructureAframeActor($content, $scene_json)
        {

            // Start Creating Aframe page
            // just some setup
            $dom = new DOMDocument("1.0", "UTF-8");
            $dom->resolveExternals = true;

            $xpath = new DOMXPath($dom);


            //$xpath->registerNamespace("aframe","");

            // Load predefined template for a-scene.
            @$dom->loadHTML($content, LIBXML_HTML_NOIMPLIED | LIBXML_NOBLANKS); //LIBXML_NOERROR , LIBXML_HTML_NODEFDTD


            $html = $dom->documentElement;
            $head = $dom->documentElement->childNodes[0];
            $body = $dom->getElementById('simple-client-body');
            $actionsDiv = $dom->getElementById('actionsDiv');
            $ascene = $dom->getElementById('aframe-scene-container');


            /*$f = fopen("output_compile_actor.txt","w");
            fwrite($f, "----------------".chr(13));
            fwrite($f, "ActionsDiv".chr(13));
            fwrite($f, print_r($dom, true));
            fwrite($f, "ASCENE".chr(13));
            fwrite($f, print_r($ascene, true));
            fwrite($f, "----------------".chr(13));
            fclose($f);*/


            // ============ Scene Iteration kernel ==============
            $metadata = $scene_json->metadata;
            $objects = $scene_json->objects;

            return array("dom" => $dom, "html" => $html, "head" => $head, "body" => $body, "ascene" => $ascene, "metadata" => $metadata, "objects" => $objects, "actionsDiv" => $actionsDiv, "xpath" => $xpath);
        }


        function createBasicDomStructureAframeDirector($content, $scene_json, $project_id, $scene_id, $scene_id_list)
        {

            // Start Creating Aframe page
            // just some setup
            $dom = new DOMDocument("1.0", "utf-8");
            $dom->resolveExternals = true;

            @$dom->loadHTML($content, LIBXML_HTML_NOIMPLIED | LIBXML_NOBLANKS); // LIBXML_HTML_NODEFDTD, LIBXML_NOERROR

            $html = $dom->documentElement;
            $head = $dom->documentElement->childNodes[0];

            $body = $dom->getElementById('master-client-body');
            $actionsDiv = $dom->getElementById('actionsDiv');
            $ascene = $dom->getElementById('aframe-scene-container');
            $ascenePlayer = $dom->getElementById('player');

            // If MediaVerse project, then enable upload to MV Node.
            $media_panel = $dom->getElementById('mediaPanel');
            $recording_controls = $dom->getElementById('upload-recording-btn');
            $project_type = wp_get_post_terms($project_id, 'vrodos_game_type');
            if ($project_type[0]->slug == 'virtualproduction_games') {
                $media_panel->setAttribute( "style", 'visibility: visible;' );
                $recording_controls->setAttribute('style', 'visibility: visible;');


                // If MediaVerse project, get MV node url, in order to upload video and update project
                $user_id = get_current_user_id();
                if ($user_id) {
                    $token = get_the_author_meta( 'mvnode_token', $user_id );
                    $node_token_input = $dom->getElementById('node-token-input');
                    $node_token_input->setAttribute('value', $token);

                    $url = get_the_author_meta( 'mvnode_url', $user_id );
                    $node_url_input = $dom->getElementById('node-url-input');
                    $node_url_input->setAttribute('value', $url);

                }

                // If there is a MV project id, then forward it to client
                $mv_project_id = get_post_meta($project_id, 'mv_project_id');
                if ($mv_project_id) {
                    $mv_project_id_input = $dom->getElementById('mv-project-id-input');
                    $mv_project_id_input->setAttribute('value', $mv_project_id[0]);
                }

                $dom->saveHTML();
            }else {

                $media_panel->setAttribute( "style", 'visibility: hidden;' );
                $recording_controls->setAttribute('style', 'visibility: hidden;');
            }

            // Toggle general chat
            $chat_wrapper = $dom->getElementById('chat-wrapper-el');
            if (filter_var($scene_json->metadata->enableGeneralChat, FILTER_VALIDATE_BOOLEAN)  === true) {
                $chat_wrapper->setAttribute( "data-visible", 'true' );
            } else {
                $chat_wrapper->setAttribute( "data-visible", 'false' );
            }

            // Check if current scene id is Base scene, in order to select avatar once
            $is_base_scene_element = $dom->getElementById('is-base-scene-input');
            if (min($scene_id_list) == $scene_id) {
                $is_base_scene_element->setAttribute('value', 'true');
            } else {
                $is_base_scene_element->setAttribute('value', 'false');
            }




            // ============ Scene Iteration kernel ==============
            $metadata = $scene_json->metadata;
            $objects = $scene_json->objects;
            //print_r($objects);

            return array("dom" => $dom, "html" => $html, "head" => $head, "body" => $body, "ascene" => $ascene, "ascenePlayer" => $ascenePlayer, "metadata" => $metadata, "objects" => $objects, "actionsDiv" => $actionsDiv);
        }

    }

    $fileOperations = new FileOperations();






    // Step 1: Create the index.html file by replacing certain parts only
    function createIndexFile($project_title, $scene_id, $scene_title, $fileOperations)
    {

        $filenameSource = $fileOperations->plugin_path_dir."/js_libs/aframe_libs/index_prototype.html";

        // Read prototype
        $content = $fileOperations->reader($filenameSource);

        // Modify strings
        $content = str_replace("Client.html","Client_".$scene_id.".html",$content);
        //$content = str_replace("ProjectAndSceneId", $project_title.", ".$scene_title[0]." (".$scene_id.")", $content);
        $content = str_replace("project_sceneId", $project_title." - ".$scene_title[0], $content);

        // Write back to root
        return $fileOperations->writer($fileOperations->plugin_path_dir . "/networked-aframe/out/" . "index_" . $scene_id . ".html", $content);
    }


    // STEP 2: Create the director file
    function createMasterClient($project_title, $scene_id, $scene_title, $scene_json, $fileOperations, $showPawnPositions, $index, $project_id, $scene_id_list){


        // Read prototype
        $content = $fileOperations->reader($fileOperations->plugin_path_dir
            ."/js_libs/aframe_libs/Master_Client_prototype.html");

        // Modify strings
        $content = str_replace("roomname", "room".$scene_id, $content);

        $content = str_replace('background="color: #000000"', 'background="color: '.$scene_json->metadata->ClearColor.'"' , $content);

        $fogstring = substr($content, strpos($content, 'fog='), strpos($content, 'renderer=')-9-strpos($content, 'fog='));

        // Replace Fog string
        if ($scene_json->metadata->fogtype != "none") {
            $content = str_replace( $fogstring,

                'fog="type: ' . $scene_json->metadata->fogtype .
                '; color: ' . $scene_json->metadata->fogcolor .
                '; far: ' . $scene_json->metadata->fogfar .
                '; density: ' . ( 1.5 * $scene_json->metadata->fogdensity ) .
                '; near: ' . $scene_json->metadata->fognear . '"',

                $content );
        } else {
            $content = str_replace( $fogstring, " ", $content );
        }


        $basicDomElements = $fileOperations->createBasicDomStructureAframeDirector($content, $scene_json, $project_id, $scene_id, $scene_id_list);

        $dom = $basicDomElements['dom'];
        $objects = $basicDomElements['objects'];
        $ascene = $basicDomElements['ascene'];
        $ascenePlayer = $basicDomElements['ascenePlayer'];
        $sceneColor = $scene_json->metadata->ClearColor;

        //print_r($title);

        $pj_type = wp_get_post_terms($project_id, 'vrodos_game_type');

        $projectType = $pj_type[0]->slug;
        $a_asset = $dom->createElement( "a-assets" );

        $dom->getElementsByTagName("title")->item(0)->nodeValue = $scene_title[$index];
        //$dom->getElementsByTagName("title")->item(0)->nodeValue = $project_title;



        // $ascene->appendChild($a_entity_sky);

        //print_r($objects->avatarCamera->isCamera);



        $bcg_choice = $scene_json->metadata->backgroundStyleOption;
        $preset_choice = $scene_json->metadata->backgroundPresetOption;
        $image_path = $scene_json->metadata->backgroundImagePath;
        //wp_upload_dir( '../uploads/Models/8664/8665_1695106416_scene_bcg.png', dirname(__FILE__))
        //print_r(wp_upload_dir());
        if ($bcg_choice == "3"){

            if ($image_path)
            {
                $a_asset_sky = $dom->createElement( "img" );
                $a_asset_sky->setAttribute("id", "custom_sky");
                $a_asset_sky->setAttribute("src", $image_path );
                $a_asset->appendChild($a_asset_sky);
                $ascene->appendChild($a_asset);
            }else{
                $bcg_choice = "0";
            }
        }


        if (!empty($sceneColor)){
            $ascene->setAttribute("scene-settings", "color: $sceneColor; pr_type: $projectType; selChoice: $bcg_choice; presChoice: $preset_choice");
        }else{
            $ascene->setAttribute("scene-settings", "color: #ffffff; pr_type: $projectType; selChoice: $bcg_choice; presChoice: $preset_choice");
        }

        if ($projectType == 'vrexpo_games') {
            //$a_entity_expo = $dom->createElement( "a-entity" );
            //$ascenePlayer->setAttribute( "id", "camera-rig" );
            $ascenePlayer->setAttribute( "position", "0 0.2 0" );
            $ascenePlayer->setAttribute( "custom-movement", "" );
            $ascenePlayer->setAttribute( "show-position", "" );
            //$ascenePlayer->setAttribute( "networked", "template:#avatar-template-expo;attachTemplateToLocal:false" );

            //OCULUS
            $a_camera = $dom->createElement( "a-camera" );
            $a_camera->setAttribute( "camera", "" );
            $a_camera->setAttribute( "id", "cameraA" );
            $a_camera->setAttribute( "networked", "template:#avatar-template-expo;attachTemplateToLocal:false" );
            $a_camera->setAttribute( "look-controls", "" );
            $a_camera->setAttribute( "wasd-controls", "acceleration:20" );
            $a_camera->setAttribute("entity-movement-emitter","");
            $a_camera->setAttribute("entity-rotation-emitter","");
        

            
           
            // $a_camera->setAttribute( "position-listener", "" );

            $a_cursor = $dom->createElement( "a-entity" );
            $a_cursor->setAttribute( "id", "cursor" );
            $a_cursor->setAttribute( "cursor", "rayOrigin: mouse; fuse: false" );
            $a_cursor->setAttribute( "raycaster", "objects: .raycastable" );

            $a_entity_oc_right = $dom->createElement( "a-entity" );
            $a_entity_oc_right->setAttribute( "id", "oculusRight" );
            $a_entity_oc_right->setAttribute( "oculus-touch-controls", "hand: right" );
            $a_entity_oc_right->setAttribute( "laser-controls", "hand: right" );
            $a_entity_oc_right->setAttribute( "raycaster", "lineColor: red; objects: .raycastable" );

            $a_entity_oc_left = $dom->createElement( "a-entity" );
            $a_entity_oc_left->setAttribute( "id", "oculusLeft" );
            $a_entity_oc_left->setAttribute( "oculus-touch-controls", "hand: left" );
            $a_entity_oc_left->setAttribute( "laser-controls", "hand: left" );
            $a_entity_oc_left->setAttribute( "raycaster", "lineColor: blue; objects: .raycastable" );
            $a_entity_oc_left->setAttribute( "oculus-thumbstick-controls", "moveEnabled: true" );

            $a_camera->appendChild($a_cursor);
            $ascenePlayer->appendChild( $a_camera );
            $ascenePlayer->appendChild( $a_entity_oc_right );
            $ascenePlayer->appendChild( $a_entity_oc_left );
            //$ascenePlayer->appendChild( $a_entity_expo );


        }else{
            $ascenePlayer->setAttribute( "position", "0 0.6 0" );
            $ascenePlayer->setAttribute( "networked", "template:#avatar-template;attachTemplateToLocal:false;" );
            $ascenePlayer->setAttribute( "show-position", "" );
            $ascenePlayer->setAttribute( "wasd-controls", "fly:false; acceleration:20" );
            $ascenePlayer->setAttribute( "look-controls", "pointerLockEnabled: false" );

            $a_entity = $dom->createElement( "a-entity" );
            $a_entity->setAttribute( "id", "cameraA" );
            $a_entity->setAttribute( "active", "true" );
            $a_entity->setAttribute( "camera", "near: 0.1; far: 7000.0;" );
            $a_entity->setAttribute( "position", "0 0.6 0" );

            $ascenePlayer->appendChild( $a_entity );
        }

        //print($scene_id)

        //$i = array_search($scene_id, array_keys($scene_id_list));
        //print_r($i);


        foreach($objects as $nameObject => $contentObject) {

            $uuid = $contentObject->uuid;

            // Switch for lights
            switch ($contentObject->category_name) {

                case 'lightSun':
                    $a_light = $dom->createElement( "a-light" );
                    $a_light->appendChild( $dom->createTextNode( '' ) );
                    $a_light->setAttribute("id", "lighttarget");
                    $fileOperations->setAffineTransformations($a_light, $contentObject);

                    $a_light_target = $dom->createElement( "a-entity" );
                    $a_light_target->appendChild( $dom->createTextNode( '' ) );
                    $a_light_target->setAttribute("position", implode( " ", $contentObject->targetposition ) );
                    $a_light_target->setAttribute("id", $uuid."target");

                    if ($contentObject->castingShadow == "1"){
                        $is_casting_shadow = "true";
                    }else{
                        $is_casting_shadow = "false";
                    }

                    $ascene->appendChild($a_light_target);
                    $a_light->setAttribute("light", "type:directional;".
                        "color:".$fileOperations->colorRGB2Hex($contentObject->lightcolor).";".
                        // "intensity:".($contentObject->lightintensity).";".
                        "castShadow:".($is_casting_shadow).";".
                       
                        "shadowMapHeight:".($contentObject->shadowMapHeight).";".
                        // "shadowCameraFar: 5000;".
                        "shadowMapWidth:".($contentObject->shadowMapWidth).";".
                        "shadowCameraTop:".($contentObject->shadowCameraTop).";".
                        "shadowCameraRight:".($contentObject->shadowCameraRight).";".
                        "shadowCameraLeft:".($contentObject->shadowCameraLeft).";".
                        "shadowCameraBottom:".($contentObject->shadowCameraBottom).";".
                        "shadowBias:".($contentObject->shadowBias).";".
                        // "shadow-camera-automatic: '#41132111-4c3f-4741-9c8a-343e71fc4b46';".
                        "shadowCameraVisible: false;"
                    //#41132111-4c3f-4741-9c8a-343e71fc4b46';
                    );

                    $a_light->setAttribute("target", "#".$uuid."target");
                    //$a_light->setAttribute("shdadow-camera-automatic", "#environmentGround");

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
                    $ascene->appendChild( $a_light );

                    break;

                case 'lightSpot':
                    $a_light = $dom->createElement( "a-light" );
                    $a_light->appendChild( $dom->createTextNode( '' ) );
                    $fileOperations->setAffineTransformations($a_light, $contentObject);

                    $a_light->setAttribute("light", "type:spot;".
                        "color:".$fileOperations->colorRGB2Hex($contentObject->lightcolor).";".
                        "intensity:".$contentObject->lightintensity.";".
                        "distance:".$contentObject->lightdistance.";".
                        "decay:".$contentObject->lightdecay.";".
                        "angle:".($contentObject->lightangle * 180 / 3.141) .";".
                        "penumbra:".$contentObject->lightpenumbra.";".
                        "target:#".$contentObject->lighttargetobjectname
                    );

                    $ascene->appendChild( $a_light );
                    break;

                case 'lightLamp':
                    $a_light = $dom->createElement( "a-light" );
                    $a_light->appendChild( $dom->createTextNode( '' ) );
                    $fileOperations->setAffineTransformations($a_light, $contentObject);

                    if ($contentObject->lampcastingShadow == "1"){
                        $is_casting_shadow = "true";
                    }else{
                        $is_casting_shadow = "false";
                    }

                    $a_light->setAttribute("light", "type:point;".
                        "color:".$fileOperations->colorRGB2Hex($contentObject->lightcolor).";".
                        "intensity:".$contentObject->lightintensity.";".
                        "distance:".$contentObject->lightdistance.";".
                        "castShadow:".($is_casting_shadow).";".
                        "shadowMapHeight:".($contentObject->lampshadowMapHeight).";".
                        "shadowMapWidth:".($contentObject->lampshadowMapWidth).";".
                        "shadowCameraTop:".($contentObject->lampshadowCameraTop).";".
                        "shadowCameraRight:".($contentObject->lampshadowCameraRight).";".
                        "shadowCameraLeft:".($contentObject->lampshadowCameraLeft).";".
                        "shadowCameraBottom:".($contentObject->lampshadowCameraBottom).";".
                        "shadowBias:".($contentObject->lampshadowBias).";".
                        // "shadow-camera-automatic: '#41132111-4c3f-4741-9c8a-343e71fc4b46';".
                        "shadowCameraVisible: false;"
                    //."radius:".$contentObject->shadowRadius
                    );

                    $ascene->appendChild( $a_light );
                    break;

                case 'lightAmbient':
                    $a_light = $dom->createElement( "a-light" );
                    $a_light->appendChild( $dom->createTextNode( '' ) );
                    $fileOperations->setAffineTransformations($a_light, $contentObject);

                    $a_light->setAttribute("light", "type:ambient;".
                        "color:".$fileOperations->colorRGB2Hex($contentObject->lightcolor).";".
                        "intensity:".$contentObject->lightintensity);

                    $ascene->appendChild( $a_light );
                    break;

            }


            // Switch for all objects except lights
            switch ($contentObject->category_slug) {

                case 'pawn':

                    if($showPawnPositions=="true") {
                        $a_entity = $dom->createElement( "a-entity" );
                        $a_entity->appendChild( $dom->createTextNode( '' ) );

                        $f = fopen("output_actor_rot.txt","w");
                        fwrite($f, print_r($contentObject, true));
                        fclose($f);

                        $fileOperations->setAffineTransformations( $a_entity, $contentObject );
                        $a_entity->setAttribute( "gltf-model",
                            "url(" . $fileOperations->plugin_path_url .  "/assets/pawn.glb)" );

                        $ascene->appendChild( $a_entity );
                    }

                    break;

                case 'decoration':

                    $assets = $dom->getElementById('scene-assets');

                    $asset_item = $dom->createElement( "a-asset-item" );
                    $asset_item->setAttribute( "id", $uuid );
                    $asset_item->setAttribute( "src", "" . $contentObject->glb_path . "" );
                    $asset_item->setAttribute( "response-type", "arraybuffer" );

                    $assets->appendChild( $asset_item );


                    $sc_x = $contentObject->scale[0];
                    $sc_y = $contentObject->scale[1];
                    $sc_z = $contentObject->scale[2];

                    $gltf_model = $dom->createElement( "a-entity" );
                    $gltf_model->setAttribute( "gltf-model","#". $uuid );
                    $gltf_model->setAttribute("original-scale", "$sc_x $sc_y $sc_z");
                    $gltf_model->appendChild( $dom->createTextNode( '' ) );
                    $material = "";
                    $fileOperations->setAffineTransformations( $gltf_model, $contentObject );
                    //$fileOperations->setMaterial( $material, $contentObject );
                    $gltf_model->setAttribute( "class", "override-materials hideable" );
                    $gltf_model->setAttribute( "material", $material );
                    $gltf_model->setAttribute( "clear-frustum-culling", "" );
                    $gltf_model->setAttribute( "preload", "auto" );
                    $gltf_model->setAttribute( "shadow", "cast: true; receive: true" );
                    // $gltf_model->setAttribute( "animation-mixer", "" );

                    //$a_entity->setAttribute( "ammo-body", "type: dynamic;" );
                    //$a_entity->setAttribute( "ammo-shape", "type: sphere; fit: manual; sphereRadius:2.5" );
                    //$a_entity->setAttribute( "class", "collidable" );

                    $ascene->appendChild( $gltf_model );

                    //$ascene->appendChild( $a_entity );
                    break;


                case 'door':

                    $assets = $dom->getElementById('scene-assets');

                    $asset_item = $dom->createElement( "a-asset-item" );
                    $asset_item->setAttribute( "id", $uuid );
                    $asset_item->setAttribute( "src", "" . $contentObject->glb_path . "" );
                    $asset_item->setAttribute( "response-type", "arraybuffer" );

                    $assets->appendChild( $asset_item );

                    $sc_x = $contentObject->scale[0];
                    $sc_y = $contentObject->scale[1];
                    $sc_z = $contentObject->scale[2];

                    $gltf_model = $dom->createElement( "a-entity" );
                    $gltf_model->setAttribute( "id", "entity_$uuid" );
                    $gltf_model->setAttribute( "gltf-model","#". "$uuid" );
                    $gltf_model->setAttribute("original-scale", "$sc_x $sc_y $sc_z");
                    $gltf_model->appendChild( $dom->createTextNode( '' ) );
                    $gltf_model->setAttribute( "shadow", "cast: true; receive: true" );

                    $material = "";
                    $fileOperations->setMaterial( $material, $contentObject );
                    $fileOperations->setAffineTransformations( $gltf_model, $contentObject );
                    $gltf_model->setAttribute( "class", "override-materials raycastable hideable" );

                    $gltf_model->setAttribute( "material", $material );
                    $gltf_model->setAttribute( "clear-frustum-culling", "" );
                    //$a_entity->setAttribute("class", "");
                    //$a_entity->setAttribute("highlight", "$uuid");

                    $gltf_model->setAttribute("highlight", "entity_$uuid");

                    if (!empty($contentObject->sceneID_target))
                        includeDoorFunctionality($gltf_model, $contentObject->sceneID_target, $fileOperations);

                    $ascene->appendChild( $gltf_model );

                    break;

                case 'video':

                    $assets = $dom->getElementById('scene-assets');

                    $a_asset_fs = $dom->createElement( "img" );
                    $a_asset_fs->setAttribute("mixin", "vid_panel");
                    $a_asset_fs->setAttribute("id", "video_fullScreen_$uuid");
                    //$a_asset_fs->setAttribute("src",  "http://localhost/wp_vrodos/wp-content/uploads//Models/fullscreen.png");
                    $a_asset_fs->setAttribute("src",  plugins_url( '../VRodos/assets/images/fullscreen.png', dirname(__FILE__)));


                    $a_asset_ex = $dom->createElement( "img" );
                    $a_asset_ex->setAttribute("mixin", "vid_panel");
                    $a_asset_ex->setAttribute("id", "video_exit_$uuid");
                    //$a_asset_ex->setAttribute("src",  "http://localhost/wp_vrodos/wp-content/uploads//Models/exit.png");
                    $a_asset_ex->setAttribute("src",  plugins_url( '../VRodos/assets/images/exit.png', dirname(__FILE__)));

                    $a_asset_pl = $dom->createElement( "img" );
                    $a_asset_pl->setAttribute("mixin", "vid_panel");
                    $a_asset_pl->setAttribute("id", "video_pl_$uuid");
                    //$a_asset_pl->setAttribute("src",  "http://localhost/wp_vrodos/wp-content/uploads//Models/play.png");
                    $a_asset_pl->setAttribute("src",  plugins_url( '../VRodos/assets/images/play.png', dirname(__FILE__)));

                    $a_asset_pas = $dom->createElement( "img" );
                    $a_asset_pas->setAttribute("mixin", "vid_panel");
                    $a_asset_pas->setAttribute("id", "video_pas_$uuid");
                    //$a_asset_pas->setAttribute("src",  "http://localhost/wp_vrodos/wp-content/uploads//Models/pause.png");
                    $a_asset_pas->setAttribute("src",  plugins_url( '../VRodos/assets/images/pause.png', dirname(__FILE__)));


                    $a_video_asset = $dom->createElement( "video" );
                    $a_video_asset->setAttribute("id", "video_$uuid");

                    $contentObject->video_loop == 1 ? $a_video_asset->setAttribute( "loop", "true") : $a_video_asset->setAttribute( "loop", "false");
                    if ( $contentObject->video_loop == 1){
                        $a_video_asset->setAttribute( "autoplay-manual", "true");
                    }
                    else{
                        $a_video_asset->setAttribute( "autoplay-manual", "false");
                    }


                    //$contentObject->video_link = "http://localhost/wp_vrodos/wp-content/uploads//Models/convVR.webm";
                    if ($contentObject->video_path != "false"){
                        $a_video_asset->setAttribute("src", $contentObject->video_path);
                    }


                    //$a_video_asset->setAttribute("src", "http://localhost/wp_vrodos/wp-content/uploads//Models/VR.mp4");

                    $assets->appendChild($a_video_asset);
                    $assets->appendChild($a_asset_fs);
                    $assets->appendChild($a_asset_ex);
                    $assets->appendChild($a_asset_pl);
                    $assets->appendChild($a_asset_pas);

                    //$a_entity = $dom->createElement("a-plane");
                    //$a_entity->setAttribute("id", "video-border_$uuid");

                    $pos_x = $contentObject->position[0];
                    $pos_y = $contentObject->position[1];
                    $pos_z = $contentObject->position[2];

                    $rot_x = $contentObject->rotation[0];
                    $rot_y = $contentObject->rotation[1];
                    $rot_z = $contentObject->rotation[2];

                    //print_r($pos_x);

                    //$a_entity->setAttribute('video-controls', "id: $uuid; orig_pos:$pos_x,$pos_y,$pos_z; orig_rot:$rot_x,$rot_y,$rot_z");
                    $sc_x = $contentObject->scale[0];
                    $sc_y = $contentObject->scale[1];
                    $sc_z = $contentObject->scale[2];
                    //$a_entity->setAttribute("original-scale", "$sc_x $sc_y $sc_z");
                    //$a_entity->setAttribute("camera-listener", "");
                    //$a_entity->setAttribute("class", "clickable hideable raycastable");


                    $a_entity_fs = $dom->createElement("a-plane");
                    $a_entity_fs->setAttribute("id", "ent_fs_$uuid");
                    $a_entity_fs->setAttribute("height", "0.08");
                    $a_entity_fs->setAttribute("width", "0.08");
                    $a_entity_fs->setAttribute("src", "#video_fullScreen_$uuid");
                    $a_entity_fs->setAttribute("renderOrder", "9999999");
                    $a_entity_fs->setAttribute("position", "-0.05 -0.03 0.000001");
                    $a_entity_fs->setAttribute("material", "shader: flat");
                    $a_entity_fs->setAttribute("class", "clickable raycastable non-clickable");

                    $a_entity_pl = $dom->createElement("a-plane");
                    $a_entity_pl->setAttribute("id", "ent_pl_$uuid");
                    $a_entity_pl->setAttribute("height", "0.08");
                    $a_entity_pl->setAttribute("width", "0.08");
                    $a_entity_pl->setAttribute("src", "#video_pl_$uuid");
                    $a_entity_pl->setAttribute("renderOrder", "9999999");
                    $a_entity_pl->setAttribute("position", "0.05 -0.03 0.000001");
                    $a_entity_pl->setAttribute("material", "shader: flat;");
                    $a_entity_pl->setAttribute("class", "clickable raycastable non-clickable");

                    $a_entity_ex = $dom->createElement("a-plane");
                    $a_entity_ex->setAttribute("id", "ent_ex_$uuid");
                    $a_entity_ex->setAttribute("height", "0.08");
                    $a_entity_ex->setAttribute("width", "0.08");
                    $a_entity_ex->setAttribute("src", "#video_exit_$uuid");
                    $a_entity_ex->setAttribute("renderOrder", "9999999");
                    $a_entity_ex->setAttribute("position", "0.15 0.15 0.000001");
                    $a_entity_ex->setAttribute("material", "shader: flat; depthTest: false;");
                    $a_entity_ex->setAttribute("class", "clickable raycastable non-clickable");


                    //Video panel
                    $a_entity_panel = $dom->createElement("a-plane");
                    $a_entity_panel->setAttribute("id", "vid-panel_$uuid");

                    $a_entity_panel->setAttribute("scale", "0.00001 0.00001 0.00001");
                    $a_entity_panel->setAttribute("visible", "false");

                    $a_entity_panel->setAttribute("class", "clickable raycastable");
                    $a_entity_panel->setAttribute("mixin", "vidFrame");


                    $exit_vid_entity_panel = $dom->createElement("a-entity");
                    $exit_vid_entity_panel->setAttribute("id", "exit_vid_panel_$uuid");
                    $exit_vid_entity_panel->setAttribute("mixin", "poiVidEscFrame");
                    $exit_vid_entity_panel->setAttribute("scale", "1 1 1");
                    $exit_vid_entity_panel->setAttribute("original-scale", "1 1 1");
                    $exit_vid_entity_panel->setAttribute("class", "raycastable hideable non-clickable" );


                    //$ascene->appendChild($a_entity_panel);

                    $a_title_vid_entity = $dom->createElement("a-entity");
                    $a_title_vid_entity->setAttribute("id", "ent_tit_$uuid");
                    // $a_title_vid_entity->setAttribute("position", "-0.2 0.11 0.000001");
                    // $a_title_vid_entity->setAttribute("position", "-0.18 0.2 0.000001");
                    $a_title_vid_entity->setAttribute("position", "-0.18 0.05 0.000001");

                    $vid_font_path = plugins_url( '../VRodos/assets/fonts/Roboto-Black-msdf.json', dirname(__FILE__));
                    $a_title_vid_entity->setAttribute("text", "depthTest:false; negate:false;shader: msdf; anchor: left; width: 0.5; font: $vid_font_path; color: #2f3542; value: $contentObject->video_title");
                    $a_title_vid_entity->setAttribute( "class", "clickable raycastable" );

                    $a_vid_entity_panel = $dom->createElement("a-entity");
                    $a_vid_entity_panel->setAttribute("id", "$a_vid_entity_panel_$uuid");

                    $a_vid_entity_panel->setAttribute("scale", "1 1 1");
                    $a_vid_entity_panel->setAttribute("original-scale", "1 1 1");
                    $a_vid_entity_panel->setAttribute("class", "raycastable hideable non-clickable" );

                    $a_vid_title_entity_panel = $dom->createElement("a-entity");
                    $a_vid_title_entity_panel->setAttribute("id", "$a_title_vid_entity_panel_$uuid");
                    $a_vid_title_entity_panel->setAttribute("mixin", "vidTitleFrame");
                    $a_vid_title_entity_panel->setAttribute("scale", "1 1 1");
                    $a_vid_title_entity_panel->setAttribute("original-scale", "1 1 1");
                    $a_vid_title_entity_panel->setAttribute("class", "raycastable hideable non-clickable" );

                    $a_entity_panel->appendChild($a_title_vid_entity);
                    $a_entity_panel->appendChild($a_vid_title_entity_panel);
                    $a_entity_panel->appendChild($exit_vid_entity_panel);
                    $a_entity_panel->appendChild($a_vid_entity_panel);
                    $a_entity_panel->appendChild($a_entity_fs);
                    $a_entity_panel->appendChild($a_entity_pl);
                    $a_entity_panel->appendChild($a_entity_ex);

                    $ascenePlayer->appendChild($a_entity_panel);

                    $a_video = $dom->createElement("a-plane");
                    $a_video->setAttribute("id", "video-display_$uuid");
                    $a_video->setAttribute('video-controls', "id: $uuid; orig_pos:$pos_x,$pos_y,$pos_z; orig_rot:$rot_x,$rot_y,$rot_z");
                    $a_video->setAttribute("height", "3");          ///Has to match size of the three.js asset
                    $a_video->setAttribute("width", "4");
                    //$a_video->setAttribute("position", "0 0 0.1");
                    $a_video->setAttribute("src", "#video_$uuid");
                    $a_video->setAttribute("material", "shader: flat; side: double");
                    $a_video->setAttribute("original-scale", "$sc_x $sc_y $sc_z");
                    $a_video->setAttribute("class", "clickable hideable");
                    //$a_entity->setAttribute("id", "video-border_$uuid");

                    $fileOperations->setAffineTransformations($a_video, $contentObject);

                    // $a_entity->setAttribute("height", "3");                      //TODO reformat without a entity component
                    // $a_entity->setAttribute("width", "4");

                    //$a_entity->appendChild($a_video);

                    //$assets->appendChild($a_video);
                    $ascene->appendChild($a_video);

                    break;

                case 'poi-link':


                    $assets = $dom->getElementById('scene-assets');

                    $asset_item = $dom->createElement( "a-asset-item" );
                    $asset_item->setAttribute( "id", "entity_$uuid" );
                    $asset_item->setAttribute( "src", "" . $contentObject->glb_path . "" );
                    $asset_item->setAttribute( "response-type", "arraybuffer" );
                    $assets->appendChild( $asset_item );

                    $sc_x = $contentObject->scale[0];
                    $sc_y = $contentObject->scale[1];
                    $sc_z = $contentObject->scale[2];
                    $gltf_model = $dom->createElement( "a-entity" );
                    $gltf_model->setAttribute( "gltf-model","#". "entity_$uuid" );
                    $gltf_model->setAttribute("original-scale", "$sc_x $sc_y $sc_z");
                    $gltf_model->appendChild( $dom->createTextNode( '' ) );
                    $material = "";
                    $fileOperations->setMaterial( $material, $contentObject );
                    $fileOperations->setAffineTransformations( $gltf_model, $contentObject );
                    $gltf_model->setAttribute( "class", "override-materials raycastable hideable" );
                    $gltf_model->setAttribute( "material", $material );
                    $gltf_model->setAttribute( "clear-frustum-culling", "" );
                    $gltf_model->setAttribute('original-scale', "$sc_x $sc_y $sc_z");
                    $gltf_model->setAttribute('link-listener', $contentObject->poi_link_url);
                    $gltf_model->setAttribute("highlight", "$uuid");
                    $gltf_model->setAttribute( "shadow", "cast: true; receive: true" );


                    $ascene->appendChild( $gltf_model );

                    break;

                case 'poi-imagetext':

                    $assets = $dom->getElementById('scene-assets');
                    $a_image_asset_exp = $dom->createElement( "img" );
                    $a_image_asset_main = $dom->createElement( "img" );
                    $a_image_asset_esc = $dom->createElement( "img" );
                    $a_image_asset_left = $dom->createElement( "img" );
                    $a_image_asset_right = $dom->createElement( "img" );


                    $a_image_asset_main->setAttribute("id", "main_img_$uuid");
                    if ($contentObject->poi_img_path != "false")
                        $a_image_asset_main->setAttribute("src",$contentObject->poi_img_path);

                    $a_image_asset_esc->setAttribute("id", "esc_img_$uuid");
                    $a_image_asset_esc->setAttribute("src",plugins_url( '../VRodos/assets/images/x_2f3542.png', dirname(__FILE__)));
                    

                    
                    $a_image_asset_left->setAttribute("id", "left_img_$uuid");
                    $a_image_asset_left->setAttribute("src",plugins_url( '../VRodos/assets/images/arrow_left_2f3542.png', dirname(__FILE__)));


                    $a_image_asset_right->setAttribute("id", "right_img_$uuid");
                    $a_image_asset_right->setAttribute("src",plugins_url( '../VRodos/assets/images/arrow_right_2f3542.png', dirname(__FILE__)));


                    $assets->appendChild($a_image_asset_exp);
                    $assets->appendChild($a_image_asset_main);
                    $assets->appendChild($a_image_asset_esc);

                    $assets->appendChild($a_image_asset_left);
                    $assets->appendChild($a_image_asset_right);


                    $sc_x = $contentObject->scale[0];
                    $sc_y = $contentObject->scale[1];
                    $sc_z = $contentObject->scale[2];

                    $a_ui_entity = $dom->createElement("a-entity");
                    $a_ui_entity->setAttribute('original-scale', "$sc_x $sc_y $sc_z");
                    $a_ui_entity->setAttribute("id", "ui");
                    $a_ui_entity->setAttribute( "class", "hideable raycastable" );
                    $a_ui_entity->setAttribute('original-scale', "$sc_x $sc_y $sc_z");

                    $fileOperations->setAffineTransformations($a_ui_entity, $contentObject);


                    $a_menu_entity = $dom->createElement("a-entity");
                    $a_menu_entity->setAttribute("id", "menu");
                    $a_menu_entity->setAttribute("highlight", "$uuid");
                    $a_menu_entity->setAttribute( "class", "hideable raycastable" );
                    $a_menu_entity->setAttribute('original-scale', "1 1 1");


                    $a_button_entity = $dom->createElement("a-entity");
                    $a_button_entity->setAttribute("id", "button_poi_$uuid");
                    $a_button_entity->setAttribute("mixin", "frame");
                    $a_button_entity->setAttribute("class", "raycastable menu-button hideable");
                    $a_button_entity->setAttribute('original-scale', "1 1 1");


                    $a_button_entity->setAttribute( "gltf-model", "url(" . $contentObject->glb_path . ")" );
                    $a_button_entity->setAttribute( "material", $material );
                    $a_button_entity->setAttribute( "shadow", "cast: true; receive: true" );

                    $a_menu_entity->appendChild($a_button_entity);
                    $a_ui_entity->appendChild($a_menu_entity);
                    $ascene->appendChild($a_ui_entity);

                    $a_panel_entity = $dom->createElement("a-entity");
                    $a_panel_entity->setAttribute("id", "infoPanel_$uuid");
                    $a_panel_entity->setAttribute("position", "0 0.2 -2");

                    $a_panel_entity->setAttribute("info-panel", "$uuid");
                    $a_panel_entity->setAttribute("visible", "false");
                    $a_panel_entity->setAttribute("scale", "0.001 0.001 0.001");


                    $a_panel_entity->setAttribute("geometry", "primitive: plane; width: 1.5; height: 1.8");
                    $a_panel_entity->setAttribute("material", "color: #f1f2f6; shader: flat; depthTest: false; transparent: true");
                    $a_panel_entity->setAttribute("class", "raycastable hideable ");
                    $a_panel_entity->setAttribute("original-scale", "0.001 0.001 0.001");


                    $a_main_img_entity = $dom->createElement("a-entity");
                    $a_main_img_entity->setAttribute("id", "top_img_$uuid");
                    $a_main_img_entity->setAttribute("material", "src: #main_img_$uuid");
                    $a_main_img_entity->setAttribute("visible", "false");
                    $a_main_img_entity->setAttribute("original-scale", "1 1 1");

                    $a_title_img_entity = $dom->createElement("a-entity");
                    $a_title_img_entity->setAttribute("id", "title_$uuid");

                    $tit_font_path = plugins_url( '../VRodos/assets/fonts/Roboto-Black-msdf.json', dirname(__FILE__));
                    $a_title_img_entity->setAttribute("text", "shader: msdf; wrapCount: 30; anchor: left; negate:false; width: 1.2; font: $tit_font_path; color: #2f3542;");
                    $a_title_img_entity->setAttribute("title_to_add", "$contentObject->poi_img_title");
                    $a_title_img_entity->setAttribute( "class", "hideable" );
                    $a_title_img_entity->setAttribute("original-scale", "1 1 1");

                    $a_exit_img_entity = $dom->createElement("a-entity");
                    $a_exit_img_entity->setAttribute("id", "exit_$uuid");
                    $a_exit_img_entity->setAttribute("mixin", "poiEsc");
                    $a_exit_img_entity->setAttribute("material", "src: #esc_img_$uuid; depthTest: false; transparent: true");
                    $a_exit_img_entity->setAttribute("class", "raycastable hideable non-clickable" );
                    $a_exit_img_entity->setAttribute("scale", "0.2 0.2 0.2");
                    $a_exit_img_entity->setAttribute("original-scale", "0.2 0.2 0.2");

                    $exit_desc_entity_panel = $dom->createElement("a-entity");
                    $exit_desc_entity_panel->setAttribute("id", "exit_panel_$uuid");
                    $exit_desc_entity_panel->setAttribute("mixin", "poiEscFrame");
                    $exit_desc_entity_panel->setAttribute("scale", "1 1 1");
                    $exit_desc_entity_panel->setAttribute("original-scale", "1 1 1");
                    $exit_desc_entity_panel->setAttribute("class", "raycastable hideable non-clickable" );


                    $a_panel_entity->appendChild($a_exit_img_entity);
                    $a_panel_entity->appendChild($exit_desc_entity_panel);
                    $a_panel_entity->appendChild($a_main_img_entity);
                    $a_panel_entity->appendChild($a_title_img_entity);

                    if($contentObject->poi_img_content)
                    {
                        $a_main_img_entity->setAttribute("mixin", "poiImage");
                        $a_title_img_entity->setAttribute("position", "-0.68 -0.1 0");

                        $a_desc_img_entity = $dom->createElement("a-entity");
                        $a_desc_img_entity->setAttribute("id", "desc_$uuid");
                        $a_desc_img_entity->setAttribute("position", "-0.68 -0.3 0");
                        $desc_font_path = plugins_url( '../VRodos/assets/fonts/Roboto-Regular-msdf.json', dirname(__FILE__));
                        $content_length = 90;

                        if (strlen($contentObject->poi_img_content) > $content_length){

                            $next_desc_entity = $dom->createElement("a-entity");
                            $next_desc_entity->setAttribute("id", "next_$uuid");
                            $next_desc_entity->setAttribute("mixin", "poiImgNext");
                            $next_desc_entity->setAttribute("material", "src: #right_img_$uuid; depthTest: false; transparent: true");
                            $next_desc_entity->setAttribute("class", "raycastable hideable non-clickable" );
                            $next_desc_entity->setAttribute("scale", "0.14 0.14 0.14");
                            $next_desc_entity->setAttribute("original-scale", "0.14 0.14 0.14");

                            $next_desc_entity_panel = $dom->createElement("a-entity");
                            $next_desc_entity_panel->setAttribute("id", "next_panel_$uuid");
                            $next_desc_entity_panel->setAttribute("mixin", "poiImgNextFrame");
                            $next_desc_entity_panel->setAttribute("scale", "1 1 1");
                            $next_desc_entity_panel->setAttribute("original-scale", "1 1 1");
                            $next_desc_entity_panel->setAttribute("class", "raycastable hideable non-clickable" );

                            $a_panel_entity->appendChild( $next_desc_entity);
                            $a_panel_entity->appendChild( $next_desc_entity_panel);

                            $prev_desc_entity = $dom->createElement("a-entity");
                            $prev_desc_entity->setAttribute("id", "prev_$uuid");
                            $prev_desc_entity->setAttribute("mixin", "poiImgPrev");
                            
                            $prev_desc_entity->setAttribute("material", "src: #left_img_$uuid; depthTest: false; transparent: true");
                            $prev_desc_entity->setAttribute("class", "raycastable hideable non-clickable" );
                            $prev_desc_entity->setAttribute("scale", "0.14 0.14 0.14");
                            $prev_desc_entity->setAttribute("original-scale", "0.14 0.14 0.14");

                            $prev_desc_entity_panel = $dom->createElement("a-entity");
                            $prev_desc_entity_panel->setAttribute("id", "prev_panel_$uuid");
                            $prev_desc_entity_panel->setAttribute("mixin", "poiImgPrevFrame");
                            $prev_desc_entity_panel->setAttribute("scale", "1 1 1");
                            $prev_desc_entity_panel->setAttribute("original-scale", "1 1 1");
                            $prev_desc_entity_panel->setAttribute("class", "raycastable hideable non-clickable" );


                            $a_panel_entity->appendChild( $prev_desc_entity);
                            $a_panel_entity->appendChild( $prev_desc_entity_panel);

                            $a_count_page_entity = $dom->createElement("a-entity");
                            $a_count_page_entity->setAttribute("id", "page_$uuid");
                            $a_count_page_entity->setAttribute("position", "0.35 -0.8 -0.1");


                            $a_count_page_entity->setAttribute("text", "baseline: top; wrapCount: 30; width: 0.8; shader: msdf; negate:false; anchor: left; font: $desc_font_path; color: #2f3542; value:");
                            $a_panel_entity->appendChild($a_count_page_entity);
                        }



                        $a_desc_img_entity = $dom->createElement("a-entity");
                        $a_desc_img_entity->setAttribute("id", "desc_$uuid");
                        $a_desc_img_entity->setAttribute("position", "-0.68 -0.4 0");


                        $a_desc_img_entity->setAttribute("text", "baseline: top; wrapCount: 30; width: 1.2; shader: msdf; negate:false; anchor: left; font: $desc_font_path; color: #2f3542; value:");
                        $a_desc_img_entity->setAttribute("text_to_add", "$contentObject->poi_img_content");
                        $a_panel_entity->appendChild($a_desc_img_entity);


                    }
                    else{
                        $a_main_img_entity->setAttribute("mixin", "poiImageFull");
                        $a_title_img_entity->setAttribute("position", "-0.68 -0.8 0");
                    }

                    $ascenePlayer->appendChild($a_panel_entity);

                    break;

            }
        }
        $contentNew = $dom->saveHTML();

        // Write back to root
        return $fileOperations->writer($fileOperations->plugin_path_dir.'/networked-aframe/out/Master_Client_'.$scene_id.".html", $contentNew);
    }


    function includeDoorFunctionality($a_entity, $door_link, $fileOperations) {
        $a_entity->setAttribute('door-listener', $fileOperations->nodeJSpath()."Master_Client_{$door_link}.html");

    }


// Step 3: Create the Simple client file
    function createSimpleClient($project_title, $scene_id, $scene_title, $scene_json, $fileOperations){

        // Read prototype
        $content = $fileOperations->reader($fileOperations->plugin_path_dir
            ."/js_libs/aframe_libs/Simple_Client_prototype.html");

        // Modify strings
        $content = str_replace("roomname", "room".$scene_id, $content);

        // Create Basic dom structure for an aframe page
        $basicDomElements = $fileOperations->createBasicDomStructureAframeActor($content, $scene_json);

        $dom = $basicDomElements['dom'];
        $objects = $basicDomElements['objects'];
        $ascene = $basicDomElements['ascene'];
        $xpath = $basicDomElements['xpath'];



        $f = fopen("output_scene_compile_debug.txt", "w");
        fwrite($f, print_r($ascene,true));
        fwrite($f, " --- start ----". chr(13));

        fwrite($f, print_r($scene_json, true));

        fwrite($f, chr(13));
        fwrite($f, "--- end ---- ". chr(13));
        fclose($f);


        $actionsDiv = $basicDomElements['actionsDiv'];

        $fileOperations->writer("output_simple_client.html", print_r($basicDomElements, true));

        $i = 0;
        foreach($objects as $nameObject => $contentObject) {

            /*$f = fopen("output_simple_client.txt", "w");
            fwrite($f, print_r($basicDomElements['actionsDiv'], true));
            fclose($f);*/

            if ( $contentObject->category_name == 'pawn' ) {
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

        $contentNew = $dom->saveHTML($dom->documentElement);

        // Write back to root
        return $fileOperations->writer($fileOperations->plugin_path_dir.'/networked-aframe/out/Simple_Client_'.$scene_id.".html", $contentNew);
    }


// Step 1: Create the index file
//createIndexFile($project_title, $scene_id, $scene_title, $fileOperations);
//createMasterClient($project_title, 926, $scene_title, $scene_json0, $fileOperations, $showPawnPositions, $key);

// Step 2: Create the Master client file
    foreach (array_reverse($scene_id_list) as $key => &$value){
        createIndexFile($project_title, $value, $scene_title, $fileOperations);
        createMasterClient($project_title, $value, $scene_title, $scene_json[$key], $fileOperations, $showPawnPositions, $key, $project_id, $scene_id_list);
        createSimpleClient($project_title, $value, $scene_title, $scene_json[$key], $fileOperations);
    }

// Step 3; Create Simple Client


    return json_encode(
        array("index" => $fileOperations->nodeJSpath()."index_".end($scene_id_list).".html",
            "MasterClient" => $fileOperations->nodeJSpath()."Master_Client_".end($scene_id_list).".html",
            "SimpleClient" => $fileOperations->nodeJSpath()."Simple_Client_".end($scene_id_list).".html",
        )
    );
}