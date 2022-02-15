<?php
if ( get_option('permalink_structure') ) { $perma_structure = true; } else {$perma_structure = false;}
if( $perma_structure){$parameter_pass = '?vrodos_game=';} else{$parameter_pass = '&vrodos_game=';}
if( $perma_structure){$parameter_Scenepass = '?vrodos_scene=';} else {$parameter_Scenepass = '&vrodos_scene=';}
$parameter_assetpass = $perma_structure ? '?vrodos_asset=' : '&vrodos_asset=';

// Load VR_Editor Scripts
function vrodos_load_vrviewer_scripts()
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
    wp_enqueue_script('vrodos_load119_GLTFLoader');
    wp_enqueue_script('vrodos_load119_DRACOLoader');
    wp_enqueue_script('vrodos_load119_DDSLoader');
    wp_enqueue_script('vrodos_load119_KTXLoader');
    wp_enqueue_script('vrodos_inflate');
    
    // Fixed at 87 (forked of original 87)
    wp_enqueue_script('vrodos_load87_datgui');
    wp_enqueue_script('vrodos_load87_OBJloader');
    wp_enqueue_script('vrodos_load87_MTLloader');
    wp_enqueue_script('vrodos_load87_OrbitControls');
    wp_enqueue_script('vrodos_load87_TransformControls');
    wp_enqueue_script('vrodos_load87_PointerLockControls');
    
    wp_enqueue_script('vrodos_load87_sceneexporterutils');
    wp_enqueue_script('vrodos_load87_scene_importer_utils');
    wp_enqueue_script('vrodos_load87_sceneexporter');
    
    // Colorpicker for the lights
    wp_enqueue_script('vrodos_jscolorpick');
    
    wp_enqueue_style('vrodos_datgui');
    wp_enqueue_style('vrodos_3D_editor');
    wp_enqueue_style('vrodos_3D_editor_browser');
    
}
add_action('wp_enqueue_scripts', 'vrodos_load_vrviewer_scripts' );


function vrodos_load_custom_functions_vrviewer(){
    wp_enqueue_script('vrodos_3d_editor_environmentals');
    wp_enqueue_script('vrodos_keyButtons');
    wp_enqueue_script('vrodos_rayCasters');
    wp_enqueue_script('vrodos_auxControlers');
    wp_enqueue_script('vrodos_LoaderMulti');
    wp_enqueue_script('vrodos_movePointerLocker');
    wp_enqueue_script('vrodos_addRemoveOne');
    wp_enqueue_script('vrodos_3d_editor_buttons');
    wp_enqueue_script('vrodos_vr_editor_analytics');
    wp_enqueue_script('vrodos_fetch_asset_scenes_request');
}
add_action('wp_enqueue_scripts', 'vrodos_load_custom_functions_vrviewer' );

?>

<script type="text/javascript">
    // keep track for the undo-redo function
    post_revision_no = 1;

    // is rendering paused
    isPaused = false;

    // Use lighting or basic materials (basic does not employ light, no shadows)
    window.isAnyLight = true;
</script>


<?php
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

$sceneTitle = $scene_post->post_name;

// Front End or Back end
$isAdmin = is_admin() ? 'back' : 'front';


$allProjectsPage = vrodos_getEditpage('allgames');
$newAssetPage = vrodos_getEditpage('asset');
$editscenePage = vrodos_getEditpage('scene');
$editscene2DPage = vrodos_getEditpage('scene2D');
$editsceneExamPage = vrodos_getEditpage('sceneExam');

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


if ($project_type === 'Archaeology') {
    echo "var doorsAll=" . json_encode($doorsAllInfo) . ";";
}
if ($project_type === 'Energy') {
    echo "var scenesMarkerAll=" . json_encode($scenesMarkerAllInfo) . ";";
    echo "var scenesNonRegional=".json_encode($scenesNonRegional).";";
}
echo '</script>';



// Get 'parent-game' taxonomy with the same slug as Game (in order to show scenes that belong here)
$allScenePGame = get_term_by('slug', $projectSlug, 'vrodos_scene_pgame');

$allScenePGameID = $allScenePGame->term_id;


// Fetch Asset
wp_enqueue_script( 'ajax-script_fetchasset', $pluginpath.
    '/js_libs/ajaxes/fetch_asset.js', array('jquery') );
wp_localize_script( 'ajax-script_fetchasset', 'my_ajax_object_fetchasset',
    array( 'ajax_url' => admin_url( 'admin-ajax.php' ) )
);



wp_enqueue_media($scene_post->ID);
require_once(ABSPATH . "wp-admin" . '/includes/media.php');




// Make the header of the page
get_header(); ?>



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
                
                <?php
                    require( plugin_dir_path( __DIR__ ).'/templates/vrodos-edit-3D-scene-Popups.php');
                 ?>
                
            </div>   <!--   VR DIV   -->
          
      </div>
    </div>



    <!--  Part 3: Start 3D with Javascript   -->
    <script>
        // all 3d dom
        let container_3D_all = document.getElementById( 'vr_editor_main_div' );

        // Selected object name
        var selected_object_name = '';

        // camera, scene, renderer, lights, stats, floor, browse_controls are all children of Environmentals instance
        var envir = new vrodos_3d_editor_environmentals(container_3D_all);
        envir.is2d = false;

        firstPersonBlockerBtn = null;

        // Load all 3D including Steve
        let loaderMulti;

        // id of animation frame is used for canceling animation when dat-gui changes
        var id_animation_frame;

        var resources3D  = [];// This holds all the resources to load. Generated in Parse JSON

        // Load Manager
        // Make progress bar visible
        jQuery("#progress").get(0).style.display = "block";

        let manager = new THREE.LoadingManager();

        manager.onProgress = function ( item, loaded, total ) {
            //console.log(item, loaded, total);
            if (total >= 2)
                document.getElementById("result_download").innerHTML = "Loading " + (loaded-1) + " out of " + (total-2);
        };

        // When all are finished loading place them in the correct position
        manager.onLoad = function () {

            jQuery("#progressWrapper").get(0).style.visibility= "hidden";

            // Get the last inserted object
            let name = Object.keys(resources3D).pop();
            let trs_tmp = resources3D[name]['trs'];
            let objItem = envir.scene.getObjectByName(name);

            // In the case the last asset is missing then put controls on the camera
            if (typeof objItem === "undefined"){
                
                name = 'avatarYawObject';
                trs_tmp = resources3D[name]['trs'];
                objItem = envir.scene.getObjectByName(name);
                
            } else {
                selected_object_name = name;
            }

            // Find scene dimension in order to configure camera in 2D view (Y axis distance)
            findSceneDimensions();
            envir.updateCameraGivenSceneLimits();

            //envir.setHierarchyViewer();

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
    </script>

    <!-- Load Scene - javascript var resources3D[] -->
    <?php
        require( plugin_dir_path( __DIR__ ).'/templates/vrodos-edit-3D-scene-ParseJSON.php' );
        /* Initial load as php */
        $SceneParserPHP = new ParseJSON($upload_url);
        $SceneParserPHP->init($sceneJSON);
    ?>

    <script>
        loaderMulti = new VRodos_LoaderMulti("1");

        loaderMulti.load(manager, resources3D, pluginPath);
        //vrodos_fetchAndLoadMultipleAssetsAjax(manager, resources3D, pluginPath);

        // Only in Undo redo as javascript not php!
        function parseJSON_LoadScene(scene_json){

            resources3D = parseJSON_javascript(scene_json, uploadDir);

            // CLEAR SCENE
            let preserveElements = ['myAxisHelper', 'myGridHelper', 'avatarYawObject', 'myTransformControls'];

            for (let i = envir.scene.children.length - 1; i >=0 ; i--){
                if (!preserveElements.includes(envir.scene.children[i].name))
                    envir.scene.remove(envir.scene.children[i]);
            }

            envir.setHierarchyViewer();

            // transform_controls = envir.scene.getObjectByName('myTransformControls');
            // transform_controls.attach(envir.scene.getObjectByName("avatarYawObject"));

            jQuery("#removeAssetBtn").hide();

            loaderMulti = new VRodos_LoaderMulti("2");
            loaderMulti.load(manager, resources3D);
        }

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
            envir.renderer.render( envir.scene, curr_camera);
            
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

            // Outlines glow
            if (envir.isComposerOn)
                envir.composer.render();
            
            // Update it
            envir.orbitControls.update();
        }

        animate();

        envir.setVisiblityLightHelpingElements(false);
        envir.isComposerOn = true;
        //transform_controls.visible  = false;
        envir.getSteveFrustum().visible = false;
    </script>

