<?php
if ( get_option('permalink_structure') ) { $perma_structure = true; } else {$perma_structure = false;}
if( $perma_structure){$parameter_pass = '?vrodos_game=';} else{$parameter_pass = '&vrodos_game=';}
if( $perma_structure){$parameter_Scenepass = '?vrodos_scene=';} else {$parameter_Scenepass = '&vrodos_scene=';}
$parameter_assetpass = $perma_structure ? '?vrodos_asset=' : '&vrodos_asset=';

// Load VR_Editor Scripts
function vrodos_load_vreditor_scripts()
{
	wp_enqueue_script('jquery-ui-draggable');
	
	wp_enqueue_script('vrodos_load119_threejs');
	wp_enqueue_script('vrodos_load119_CSS2DRenderer');
	wp_enqueue_script('vrodos_load119_CopyShader');
	wp_enqueue_script('vrodos_load119_FXAAShader');
	wp_enqueue_script('vrodos_load119_EffectComposer');
	wp_enqueue_script('vrodos_load119_RenderPass');
	wp_enqueue_script('vrodos_load119_OutlinePass');
	wp_enqueue_script('vrodos_load119_ShaderPass');
	wp_enqueue_script('vrodos_load119_FBXloader');
	wp_enqueue_script('vrodos_load119_RGBELoader');
	wp_enqueue_script('vrodos_load119_GLTFLoader');
	wp_enqueue_script('vrodos_load119_DRACOLoader');
	wp_enqueue_script('vrodos_load119_DDSLoader');
	wp_enqueue_script('vrodos_load119_KTXLoader');
	wp_enqueue_script('vrodos_inflate');
	
	// Timestamp script
	wp_enqueue_script('vrodos_scripts');
	
	// Hierarchy Viewer
	wp_enqueue_script('vrodos_HierarchyViewer');
	
	// Fixed at 87 (forked of original 87)
	wp_enqueue_script('vrodos_load87_OBJloader');
	wp_enqueue_script('vrodos_load87_MTLloader');
	wp_enqueue_script('vrodos_load87_OrbitControls');
	wp_enqueue_script('vrodos_load87_TransformControls');
	wp_enqueue_script('vrodos_load87_PointerLockControls');
	
	wp_enqueue_script('vrodos_load87_scene_importer_utils');
	
	wp_enqueue_script( 'vrodos_load119_Font');
	wp_enqueue_script( 'vrodos_load119_Cache');
	wp_enqueue_script( 'vrodos_load119_Loader');
	wp_enqueue_script( 'vrodos_load119_FileLoader');
	wp_enqueue_script( 'vrodos_load119_LoadingManager');
	wp_enqueue_script( 'vrodos_load119_FontLoader');
	wp_enqueue_script( 'vrodos_load119_FileLoader');
	
	// Style
	wp_enqueue_style('vrodos_3D_viewer');
}

add_action('wp_enqueue_scripts', 'vrodos_load_vreditor_scripts' );


function vrodos_load_custom_functions_vreditor(){
	wp_enqueue_script('vrodos_3d_editor_environmentals');
	wp_enqueue_script('vrodos_keyButtons');
	wp_enqueue_script('vrodos_rayCasters');
	wp_enqueue_script('vrodos_BordersFinder');
	wp_enqueue_script('vrodos_LightsLoader');
	wp_enqueue_script('vrodos_LoaderMulti');
	wp_enqueue_script('vrodos_movePointerLocker');
	wp_enqueue_script('vrodos_3d_editor_buttons');
}
add_action('wp_enqueue_scripts', 'vrodos_load_custom_functions_vreditor' );

?>

<script type="text/javascript">
    // keep track for the undo-redo function
    post_revision_no = 1;

    // is rendering paused
    isPaused = false;

    // Use lighting or basic materials (basic does not employ light, no shadows)
    window.isAnyLight = true;

    // This holds all the 3D resources to load. Generated in Parse JSON.
    var resources3D  = [];

    // For autosave after each action
    var mapActions = {}; // You could also use an array
</script>


<?php
// resources3D class
require( plugin_dir_path( __DIR__ ).'/templates/vrodos-edit-3D-scene-ParseJSON.php' );

// Define current path of plugin
$pluginpath = str_replace('\\','/', dirname(plugin_dir_url( __DIR__  )) );

// wpcontent/uploads/
$upload_url = wp_upload_dir()['baseurl'];



$upload_dir = str_replace('\\','/',wp_upload_dir()['basedir']);

// Scene
$current_scene_id = sanitize_text_field( intval( $_GET['vrodos_scene'] ));

// Project
$project_id    = sanitize_text_field( intval( $_GET['vrodos_game'] ) );
$project_post  = get_post($project_id);
$projectSlug   = $project_post->post_name;

// Get if project is : 'Archaeology' or 'Energy' or 'Chemistry'
$project_type = vrodos_return_project_type($project_id)->string;

// Get project type icon
$project_type_icon = vrodos_return_project_type($project_id)->icon;

// Get Joker project id
$joker_project_id = get_page_by_path( strtolower($project_type).'-joker', OBJECT, 'vrodos_game' )->ID;

// Wind Energy Only
if ($project_type === 'Energy') {
	$scenesNonRegional = vrodos_getNonRegionalScenes($_REQUEST['vrodos_game']);
	$scenesMarkerAllInfo = vrodos_get_all_scenesMarker_of_project_fastversion($project_id);
}

// Archaeology only
if ($project_type === 'Archaeology') {
	$doorsAllInfo = vrodos_get_all_doors_of_project_fastversion($project_id);
}

// Get scene content from post
$scene_post = get_post($current_scene_id);

// If empty load default scenes if no content. Do not put esc_attr, crashes the universe in 3D.
$sceneJSON = $scene_post->post_content ? $scene_post->post_content :
	vrodos_getDefaultJSONscene(strtolower($project_type));

// Load resources 3D
$SceneParserPHP = new ParseJSON($upload_url);
$SceneParserPHP->init($sceneJSON);

$sceneTitle = $scene_post->post_name;

// Front End or Back end
$isAdmin = is_admin() ? 'back' : 'front';


$allProjectsPage = vrodos_getEditpage('allgames');
$newAssetPage = vrodos_getEditpage('asset');
$editscenePage = vrodos_getEditpage('scene');
$editscene2DPage = vrodos_getEditpage('scene2D');
$editsceneExamPage = vrodos_getEditpage('sceneExam');


$videos = vrodos_getVideoAttachmentsFromMediaLibrary();

// for vr_editor
$urlforAssetEdit = esc_url( get_permalink($newAssetPage[0]->ID) . $parameter_pass . $project_id .
                            '&vrodos_scene=' .$current_scene_id . '&vrodos_asset=' );

// User data
$user_data = get_userdata( get_current_user_id() );
$user_email = $user_data->user_email;


// Shift vars to Javascript side
echo '<script>';
echo 'var pluginPath="'.$pluginpath.'";';
echo 'let uploadDir="'.wp_upload_dir()['baseurl'].'";';
echo 'let projectId="'.$project_id.'";';
echo 'let projectSlug="'.$projectSlug.'";';
echo 'var isAdmin="'.$isAdmin.'";';
echo 'let isUserAdmin="'.current_user_can('administrator').'";';
echo 'let urlforAssetEdit="'.$urlforAssetEdit.'";';
echo 'let scene_id ="'.$current_scene_id.'";';
echo 'let game_type ="'.strtolower($project_type).'";';
echo 'let project_keys ="'.json_encode(vrodos_getProjectKeys($project_id, $project_type)).'";';
echo 'user_email = "'.$user_email.'";';
echo 'current_user_id = "'.get_current_user_id().'";';
echo 'energy_stats = '.json_encode(vrodos_windEnergy_scene_stats($current_scene_id)).';';
echo 'var siteurl="'.site_url().'";';

if ($project_type === 'Archaeology') {
	echo "var doorsAll=" . json_encode($doorsAllInfo) . ";";
}
if ($project_type === 'Energy') {
	echo "var scenesMarkerAll=" . json_encode($scenesMarkerAllInfo) . ";";
	echo "var scenesNonRegional=".json_encode($scenesNonRegional).";";
}

if ($project_type === 'Chemistry') {
	echo "var scenesTargetChemistry=" . json_encode(vrodos_getAllexams_byGame($joker_project_id, true)) . ";";
}
echo '</script>';


// For analytics
$project_saved_keys = vrodos_getProjectKeys($project_id, $project_type);

// if Virtual Lab
if($project_type === 'Energy' || $project_type === 'Chemistry') {
	if (!array_key_exists('gioID', $project_saved_keys)) {
		echo "<script type='text/javascript'>alert(\"APP KEY not found." .
		     " Please make sure that your user account has been registered correctly, " .
		     "and you have loaded the correct page\");</script>";
	}
}

// Get 'parent-game' taxonomy with the same slug as Game (in order to show scenes that belong here)
$allScenePGame = get_term_by('slug', $projectSlug, 'vrodos_scene_pgame');

//$ff = fopen('output_merger.txt',"w");
//fwrite($ff, "1:".print_r($project_post)         .chr(13));
//fwrite($ff, "2:".print_r($projectSlug,true));
//fclose($ff);

$allScenePGameID = $allScenePGame->term_id;

if ($project_type === "Chemistry") {
	$analytics_molecule_checklist = vrodos_derive_molecules_checklist();
}

// Ajax for fetching game's assets within asset browser widget at vr_editor // user must be logged in to work, otherwise ajax has no privileges

// COMPILE Ajax
if(vrodos_getUnity_local_or_remote() != 'remote') {
	
	// Local compile
	$gameUnityProject_dirpath = $upload_dir . '\\' . $projectSlug . 'Unity';
	$gameUnityProject_urlpath = $pluginpath . '/../../uploads/' . $projectSlug . 'Unity/';
	
} else {
	
	// Remote compile
	$ftp_cre = vrodos_get_ftpCredentials();
	$ftp_host = $ftp_cre['address'];
	
	$gamesFolder = 'COMPILE_UNITY3D_GAMES';
	
	$gameUnityProject_dirpath = $gamesFolder."/".$projectSlug."Unity";
	$gameUnityProject_urlpath = "http://".$ftp_host."/".$gamesFolder."/".$projectSlug."Unity";
}


$thepath = $pluginpath . '/js_libs/assemble_compile_commands/request_game_assepile.js';
wp_enqueue_script( 'ajax-script_assepile', $thepath, array('jquery') );
wp_localize_script( 'ajax-script_assepile', 'my_ajax_object_assepile',
	array( 'ajax_url' => admin_url( 'admin-ajax.php'),
	       'id' => $project_id,
	       'slug' => $projectSlug,
	       'gameUnityProject_dirpath' => $gameUnityProject_dirpath,
	       'gameUnityProject_urlpath' => $gameUnityProject_urlpath
	)
);

// DELETE SCENE AJAX
wp_enqueue_script( 'ajax-script_deletescene', $pluginpath . '/js_libs/ajaxes/delete_scene.js', array('jquery') );
wp_localize_script( 'ajax-script_deletescene', 'my_ajax_object_deletescene',
	array( 'ajax_url' => admin_url( 'admin-ajax.php'))
);

//FOR SAVING extra keys
wp_enqueue_script( 'ajax-script_savegio', $pluginpath.'/js_libs/ajaxes/vrodos_save_scene_ajax.js', array('jquery') );
wp_localize_script( 'ajax-script_savegio', 'my_ajax_object_savegio',
	array( 'ajax_url' => admin_url( 'admin-ajax.php' ), 'project_id' => $project_id )
);

// Asset Browser
wp_enqueue_script( 'ajax-script_filebrowse', $pluginpath.'/js_libs/vrodos_assetBrowserToolbar.js', array('jquery') );
wp_localize_script( 'ajax-script_filebrowse', 'my_ajax_object_fbrowse', array( 'ajax_url' => admin_url( 'admin-ajax.php' ) ) );

// Save scene
wp_enqueue_script( 'ajax-script_savescene', $pluginpath.'/js_libs/ajaxes/vrodos_save_scene_ajax.js', array('jquery') );
wp_localize_script( 'ajax-script_savescene', 'my_ajax_object_savescene',
	array( 'ajax_url' => admin_url( 'admin-ajax.php' ), 'scene_id' => $current_scene_id )
);

// Delete Asset
wp_enqueue_script( 'ajax-script_deleteasset', $pluginpath.
                                              '/js_libs/ajaxes/delete_asset.js', array('jquery') );
wp_localize_script( 'ajax-script_deleteasset', 'my_ajax_object_deleteasset',
	array( 'ajax_url' => admin_url( 'admin-ajax.php' ) )
);

// Fetch Asset
wp_enqueue_script( 'ajax-script_fetchasset', $pluginpath.
                                             '/js_libs/ajaxes/fetch_asset.js', array('jquery') );
wp_localize_script( 'ajax-script_fetchasset', 'my_ajax_object_fetchasset',
	array( 'ajax_url' => admin_url( 'admin-ajax.php' ) )
);



wp_enqueue_media($scene_post->ID);
require_once(ABSPATH . "wp-admin" . '/includes/media.php');

if ($project_type === 'Archaeology') {
	$single_lowercase = "tour";
	$single_first = "Tour";
} else if ($project_type === 'Energy' || $project_type === 'Chemistry'){
	$single_lowercase = "lab";
	$single_first = "Lab";
} else {
	$single_lowercase = "project";
	$single_first = "Project";
}

// For Chemistry only
if(isset($_POST['submitted2']) && isset($_POST['post_nonce_field2']) && wp_verify_nonce($_POST['post_nonce_field2'], 'post_nonce')) {
	$expID = $_POST['exp-id'];
	update_post_meta( $project_id, 'vrodos_project_expID', $expID);
	
	$loadMainSceneLink = get_permalink($editscenePage[0]->ID) . $parameter_Scenepass . $current_scene_id . '&vrodos_game=' . $project_id . '&scene_type=scene';
	wp_redirect( $loadMainSceneLink );
	exit;
}


// ADD NEW SCENE
if(isset($_POST['submitted']) && isset($_POST['post_nonce_field']) && wp_verify_nonce($_POST['post_nonce_field'], 'post_nonce')) {
	
	$newSceneType = $_POST['sceneTypeRadio'];
	
	$sceneMetaType = 'scene';//default 'scene' MetaType (3js)
	$game_type_chosen_slug = '';
	
	$default_json = '';
	$thegameType = wp_get_post_terms($project_id, 'vrodos_game_type');
	if($thegameType[0]->slug == 'archaeology_games'){
		
		$newscene_yaml_tax = get_term_by('slug', 'wonderaround-yaml', 'vrodos_scene_yaml');
		
		$game_type_chosen_slug = 'archaeology_games';
		$default_json = vrodos_getDefaultJSONscene('archaeology');
		
	} elseif($thegameType[0]->slug == 'energy_games'){
		
		$newscene_yaml_tax = get_term_by('slug', 'educational-energy', 'vrodos_scene_yaml');
		$game_type_chosen_slug = 'energy_games';
		$default_json = vrodos_getDefaultJSONscene('energy');
		
	}elseif($thegameType[0]->slug == 'chemistry_games'){
		
		$game_type_chosen_slug = 'chemistry_games';
		
		$default_json = vrodos_getDefaultJSONscene('chemistry');
		
		if($newSceneType == 'lab'){
			
			$newscene_yaml_tax = get_term_by('slug', 'wonderaround-lab-yaml', 'vrodos_scene_yaml');
			
		} elseif($newSceneType == '2d'){
			
			$newscene_yaml_tax = get_term_by('slug', 'exam2d-chem-yaml', 'vrodos_scene_yaml');
			$sceneMetaType = 'sceneExam2d';
			
		} elseif($newSceneType == '3d'){
			
			$newscene_yaml_tax = get_term_by('slug', 'exam3d-chem-yaml', 'vrodos_scene_yaml');
			$sceneMetaType = 'sceneExam3d';
		}
	}
	
	$scene_taxonomies = array(
		'vrodos_scene_pgame' => array(
			$allScenePGameID,
		),
		'vrodos_scene_yaml' => array(
			$newscene_yaml_tax->term_id,
		)
	);
	
	$scene_metas = array(
		'vrodos_scene_default' => 0,
		'vrodos_scene_caption' => esc_attr(strip_tags($_POST['scene-caption']))
	);
	
	//REGIONAL SCENE EXTRA TYPE FOR ENERGY GAMES
	$isRegional = 0;//default value
	if($thegameType[0]->slug == 'energy_games'){
		if($_POST['regionalSceneCheckbox'] == 'on'){$isRegional = 1;}
		$scene_metas['vrodos_isRegional']= $isRegional;
		$scene_metas['vrodos_scene_environment'] = 'fields';
	}
	
	//Add the final MetaType of the Scene
	$scene_metas['vrodos_scene_metatype']= $sceneMetaType;
	
	$scene_information = array(
		'post_title' => esc_attr(strip_tags($_POST['scene-title'])),
		'post_content' => $default_json,
		'post_type' => 'vrodos_scene',
		'post_status' => 'publish',
		'tax_input' => $scene_taxonomies,
		'meta_input' => $scene_metas,
	);
	
	$scene_id = wp_insert_post($scene_information);
	
	if($scene_id){
		if($sceneMetaType == 'sceneExam2d' || $sceneMetaType == 'sceneExam3d'){$edit_scene_page_id = $editsceneExamPage[0]->ID;}
		else{$edit_scene_page_id = $editscenePage[0]->ID;}
		$loadMainSceneLink = get_permalink($edit_scene_page_id) . $parameter_Scenepass . $scene_id . '&vrodos_game=' . $project_id . '&scene_type=' . $sceneMetaType;
		wp_redirect( $loadMainSceneLink );
		exit;
	}
}

$goBackTo_AllProjects_link = esc_url( get_permalink($allProjectsPage[0]->ID));

// Make the header of the page
get_header(); ?>

<?php if ( !is_user_logged_in() ) { ?>

    <!-- if user not logged in, then prompt to log in -->
    <div class="DisplayBlock CenterContents">
        <i style="font-size: 64px; padding-top: 80px;" class="material-icons mdc-theme--text-icon-on-background">account_circle</i>
        <p class="mdc-typography--title"> Please <a class="mdc-theme--secondary"
                                                    href="<?php echo wp_login_url( get_permalink() ); ?>">login</a> to use platform</p>
        <p class="mdc-typography--title"> Or
            <a class="mdc-theme--secondary" href="<?php echo wp_registration_url(); ?>">register</a>
            if you don't have an account</p>
    </div>

    <hr class="WhiteSpaceSeparator">

<?php } else { ?>

    <!-- PANELS -->
    <div class="panels">

        <!-- Panel 1 is the vr enivironment -->
        <div class="panel active" id="panel-1" role="tabpanel" aria-hidden="false">

            <!-- 3D editor  -->
            <div id="vr_editor_main_div">

                <!--  Make form to submit user changes -->
                <div id="progressWrapper" class="VrInfoPhpStyle" style="visibility: visible">
                    <div id="progress" class="ProgressContainerStyle mdc-theme--text-primary-on-light mdc-typography--subheading1">
                    </div>

                    <div id="result_download" class="result"></div>
                    <div id="result_download2" class="result"></div>
                </div>

            </div>   <!--   VR DIV   -->
			
			
			
			<?php
                // Add sceneType variable in js envir
                $sceneType = get_post_meta($_GET['vrodos_scene'], "vrodos_scene_environment");
                if (count($sceneType)>0) {
                    echo '<script>';
                    echo 'envir.sceneType="' . $sceneType[0] . '";';
                    echo '</script>';
                }
			?>
        </div>
		
    </div>


    <!-- Scripts part 1: The GUIs -->
    <script type="text/javascript">

        var mdc = window.mdc;
        var MDCSelect = mdc.select.MDCSelect;

        mdc.autoInit();

      

    </script>


    <!--  Part 3: Start 3D with Javascript   -->
    <script>

        // id of animation frame is used for canceling animation when dat-gui changes
        var id_animation_frame;

        // all 3d dom
        let vr_editor_main_div = document.getElementById( 'vr_editor_main_div' );

        // Selected object name
        var selected_object_name = '';

        // camera, scene, renderer, lights, stats, floor, browse_controls are all children of Environmentals instance
        var envir = new vrodos_3d_editor_environmentals(vr_editor_main_div);
        envir.is2d = false;

        // Controls with axes (Transform, Rotate, Scale)
        var transform_controls = new THREE.TransformControls( envir.renderer.domElement );
        transform_controls.name = 'myTransformControls';

        //var firstPersonBlocker = document.getElementById('firstPersonBlocker');
        var firstPersonBlockerBtn = document.getElementById('firstPersonBlockerBtn');

 

        // Add lights on scene
        var lightsLoader = new VRodos_LightsLoader();
        lightsLoader.load(resources3D);

        // ================== Text ============
        const loader = new FontLoader();
        var textGeometry;
        loader.load( siteurl + '/wp-content/plugins/VRodos/js_libs/threejs87/helvetiker_regular.typeface.json', function ( font ) {

            textGeometry = new THREE.TextGeometry('Hello!', {
                font: font,
                size: 1,
                height: 0.1,
                curveSegments: 6,
                bevelEnabled: false,
                bevelThickness: 0.5,
                bevelSize: 0.5,
                bevelOffset: 0,
                bevelSegments: 1
            });
        });

        let textureLoader = new THREE.TextureLoader();
        let texturePngPath = siteurl + '/wp-content/plugins/VRodos/images/dots.png';

        textureLoader.load( texturePngPath,

            // onLoad callback
            function ( texture ) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set( 2, 2);

                var localPlanes = [
                    new THREE.Plane( new THREE.Vector3( 0, 0, 0 ), 1 ),
                    new THREE.Plane( new THREE.Vector3( 15, 5, 15 ), 1 )
                ];

                var material = new THREE.MeshPhongMaterial( { map: texture, opacity:1, transparent:true, emissiveIntensity: 1,
                    emissive: new THREE.Color(1, 0, 0) ,
                    clippingPlanes: localPlanes,
                    clipIntersection: true}
                );
                material.color.set(0xff0000);
                textMesh1 = new THREE.Mesh( textGeometry, material );
                textMesh1.position.y += 3;
                textMesh1.position.x += 3;


                envir.scene.add(textMesh1);
            },

            // onProgress callback currently not supported
            undefined,

            // onError callback
            function ( err ) {
                console.error( 'An error happened 5112.' );
            }
        );



        envir.scene.add(transform_controls);

        // Load Manager
        // Make progress bar visible
        jQuery("#progress").get(0).style.display = "block";

        let manager = new THREE.LoadingManager();

        manager.onProgress = function ( item, loaded, total ) {
            if (total >= 2)
                document.getElementById("result_download").innerHTML = "Loading " + (loaded-1) + " out of " + (total-2);
        };



        // When all are finished loading place them in the correct position
        manager.onLoad = function () {

            jQuery("#progressWrapper").get(0).style.visibility = "hidden";

            // Get the last inserted object
            let l = Object.keys(resources3D).length;
            let name = Object.keys(resources3D)[l - 1]; //Object.keys(resources3D).pop();

            let objItem = envir.scene.getObjectByName(name);

            if (objItem === undefined){
                return;
            } else {
               // attachToControls(name, objItem);
            }

            // Find scene dimension in order to configure camera in 2D view (Y axis distance)
            findSceneDimensions();
            envir.updateCameraGivenSceneLimits();

            

            // Set Target light for Spots
            for (let n in resources3D) {
                (function (name) {
                    if (resources3D[name]['categoryName'] === 'lightSpot') {
                        let lightSpot = envir.scene.getObjectByName(name);
                        lightSpot.target = envir.scene.getObjectByName(resources3D[name]['lighttargetobjectname']);
                    }
                })(n);
            }
        }; // End of manager

        // Loader of assets
        var loaderMulti = new VRodos_LoaderMulti();

        loaderMulti.load(manager, resources3D, pluginPath);


   

        //--- initiate PointerLockControls ---------------
        initPointerLock();

        // ANIMATE
        function animate()
        {
            if(isPaused) {
                return;
            }

            id_animation_frame = requestAnimationFrame( animate );

            // Select the proper camera (orbit, or avatar, or thirdPersonView)
            let curr_camera = avatarControlsEnabled ?
                (envir.thirdPersonView ? envir.cameraThirdPerson : envir.cameraAvatar) : envir.cameraOrbit;

            // Render it
            //envir.renderer.render( envir.scene, curr_camera);

            // Label is for setting labels to objects
            envir.labelRenderer.render( envir.scene, curr_camera);

            // Animation
            if (envir.flagPlayAnimation) {
                if (envir.animationMixers.length > 0) {
                    let new_time = envir.clock.getDelta();
                    for (let i = 0; i < envir.animationMixers.length; i++) {
                        envir.animationMixers[i].update(new_time);
                    }
                }
            }

            if (envir.isComposerOn)
                envir.composer.render();


            // Update it
            updatePositionsAndControls();

            envir.cubeCamera.update( envir.renderer, envir.scene );
        }

        // UPDATE
        function updatePositionsAndControls()
        {
            envir.orbitControls.update();

            updatePointerLockControls();

            transform_controls.update(); // update the axis controls based on the browse controls
          

            // Now update the translation and rotation input texts
            if (transform_controls.object) {

                for (let i in controlInterface.translate.__controllers)
                    controlInterface.translate.__controllers[i].updateDisplay();

                for (let i in controlInterface.rotate.__controllers)
                    controlInterface.rotate.__controllers[i].updateDisplay();

                for (let i in controlInterface.scale.__controllers)
                    controlInterface.scale.__controllers[i].updateDisplay();

                updatePositionsPhpAndJavsFromControlsAxes();
            }
        }

        animate();

        // Set all buttons actions
        loadButtonActions();


        function attachToControls(name, objItem){

            // let trs_tmp = resources3D[name]['trs'];
            // transform_controls.attach(objItem);
            //
            // // highlight
            // envir.outlinePass.selectedObjects = [objItem];
            //
            // if (selected_object_name != 'avatarYawObject') {
            //     transform_controls.object.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1],
            //         trs_tmp['translation'][2]);
            //     transform_controls.object.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1],
            //         trs_tmp['rotation'][2]);
            //     transform_controls.object.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);
            // }
            //
            // jQuery('#object-manipulation-toggle').show();
            // jQuery('#axis-manipulation-buttons').show();
            // jQuery('#double-sided-switch').show();
            //
            // showObjectPropertiesPanel(transform_controls.getMode());
            //
            // selected_object_name = name;
            // transform_controls.setMode("rottrans");
            //
            // let sizeT = 1;
            //
            // // Resize controls based on object size
            // if (selected_object_name != 'avatarYawObject') {
            //     let dims = findDimensions(transform_controls.object);
            //     sizeT = Math.max(...dims);
            //
            //     // 6 is rotation
            //     transform_controls.children[6].handleGizmos.XZY[0][0].visible = true;
            //
            //     if (selected_object_name.includes("lightSun") || selected_object_name.includes("lightLamp") ||
            //         selected_object_name.includes("lightSpot")){
            //         // ROTATE GIZMO: Sun and lamp can not be rotated
            //         transform_controls.children[6].children[0].children[1].visible = false;
            //     }
            // } else {
            //     transform_controls.children[6].handleGizmos.XZY[0][0].visible = false;
            // }
            //
            // transform_controls.setSize( sizeT > 1 ? sizeT : 1 );
        }

    </script>
<?php } ?>

<?php get_footer(); ?>

