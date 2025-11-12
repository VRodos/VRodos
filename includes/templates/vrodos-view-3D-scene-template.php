<?php

$perma_structure = (bool)get_option('permalink_structure');
$parameter_pass = $perma_structure ? '?vrodos_game=' : '&vrodos_game=';
$parameter_Scenepass = $perma_structure ? '?vrodos_scene=' : '&vrodos_scene=';
$parameter_assetpass = $perma_structure ? '?vrodos_asset=' : '&vrodos_asset=';

// Load VR_Editor Scripts
function vrodos_load_vreditor_scripts()
{
    wp_enqueue_script('jquery-ui-draggable');
    wp_enqueue_script('vrodos_load141_threejs');
    wp_enqueue_script('vrodos_load141_CSS2DRenderer');
    wp_enqueue_script('vrodos_load141_CopyShader');
    wp_enqueue_script('vrodos_load141_FXAAShader');
    wp_enqueue_script('vrodos_load141_EffectComposer');
    wp_enqueue_script('vrodos_load141_RenderPass');
    wp_enqueue_script('vrodos_load141_OutlinePass');
    wp_enqueue_script('vrodos_load141_ShaderPass');
    wp_enqueue_script('vrodos_load141_FBXloader');
    wp_enqueue_script('vrodos_load141_RGBELoader');
    wp_enqueue_script('vrodos_load141_GLTFLoader');
    wp_enqueue_script('vrodos_load141_DRACOLoader');
    wp_enqueue_script('vrodos_load141_DDSLoader');
    wp_enqueue_script('vrodos_load141_KTXLoader');
    wp_enqueue_script('vrodos_inflate');

    // Timestamp script
    wp_enqueue_script('vrodos_scripts');

    // Hierarchy Viewer
    wp_enqueue_script('vrodos_HierarchyViewer');

    // Fixed at 87 (forked of original 87)
    wp_enqueue_script('vrodos_load141_OBJLoader');
    wp_enqueue_script('vrodos_load141_MTLLoader');
    wp_enqueue_script('vrodos_load141_OrbitControls');
    wp_enqueue_script('vrodos_load141_TransformControls');
    wp_enqueue_script('vrodos_load141_PointerLockControls');

    wp_enqueue_script( 'vrodos_load141_FontLoader');

    // Style
    wp_enqueue_style('vrodos_3D_viewer');
}

add_action('wp_enqueue_scripts', 'vrodos_load_vreditor_scripts' );


function vrodos_load_custom_functions_vreditor(){
    wp_enqueue_script('vrodos_3d_editor_environmentals');
    wp_enqueue_script('vrodos_keyButtons');
    wp_enqueue_script('vrodos_rayCasters');
    wp_enqueue_script('vrodos_BordersFinder');
    wp_enqueue_script('VRodos_LightsPawn_Loader');
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

    // For autosave after each action
    var mapActions = {}; // You could also use an array
</script>


<?php
// Define current path of plugin
$pluginpath = str_replace('\\','/', dirname(plugin_dir_url( __DIR__  )) );

// wpcontent/uploads/
$upload_url = wp_upload_dir()['baseurl'];

$upload_dir = str_replace('\\','/',wp_upload_dir()['basedir']);

// Scene
$current_scene_id = sanitize_text_field( intval( $_GET['vrodos_scene'] ));

// Get scene content from post
$scene_post = get_post($current_scene_id);

// Get project type
$project_obj = VRodos_Core_Manager::vrodos_return_project_type(intval( $_GET['vrodos_game'] ));
$project_type_str = substr($project_obj->string, strpos($project_obj->string, "_") - 1);

// If empty load default scenes if no content. Do not put esc_attr, crashes the universe in 3D.
$sceneJSON = $scene_post->post_content ? $scene_post->post_content :
    VRodos_Core_Manager::vrodos_getDefaultJSONscene(strtolower($project_type_str));

// Parse the scene JSON and prepare data for the script.
$scene_data = VRodos_Scene_CPT_Manager::parse_scene_json_and_prepare_script_data($sceneJSON, $upload_url);
wp_localize_script('vrodos_scripts', 'vrodos_scene_data', $scene_data);

$sceneTitle = $scene_post->post_name;

// Front End or Back end
$isAdmin = is_admin() ? 'back' : 'front';

$allProjectsPage = VRodos_Core_Manager::vrodos_getEditpage('allgames');
$newAssetPage = VRodos_Core_Manager::vrodos_getEditpage('asset');
$editscenePage = VRodos_Core_Manager::vrodos_getEditpage('scene');


$videos = VRodos_Core_Manager::vrodos_getVideoAttachmentsFromMediaLibrary();

// Shift vars to Javascript side
echo '<script>';
echo 'var pluginPath="'.$pluginpath.'";';
echo 'var uploadDir="'.wp_upload_dir()['baseurl'].'";';
echo 'var isAdmin="'.$isAdmin.'";';
echo 'let isUserAdmin="'.current_user_can('administrator').'";';
echo 'let scene_id ="'.$current_scene_id.'";';
echo 'let game_type ="'.strtolower('archaeology').'";';
echo 'current_user_id = "'.get_current_user_id().'";';
echo 'var siteurl="'.site_url().'";';
echo '</script>';



// Fetch Asset
wp_enqueue_script( 'ajax-script_fetchasset', $pluginpath.
    '/js_libs/ajaxes/fetch_asset.js', array('jquery') );
wp_localize_script( 'ajax-script_fetchasset', 'my_ajax_object_fetchasset',
    array( 'ajax_url' => admin_url( 'admin-ajax.php' ) )
);



wp_enqueue_media($scene_post->ID);
require_once(ABSPATH . "wp-admin" . '/includes/media.php');

if(is_user_logged_in() ) {
    wp_nav_menu( array(
            'theme_location'  => '3d-menu',
            'container_class' => 'menu-3d-class'
        )
    );

    wp_head();

} else {

//	wp_nav_menu( array(
//			'theme_location'  => 'top-menu',
//            'menu' => 'menu-adventure-flyout-menu'
//    ));

    get_header();
}
?>

<?php if ( !is_user_logged_in() ) {

    ?>

    <!-- if user not logged in, then prompt to log in -->
    <div class="DisplayBlock CenterContents">
        <i style="font-size: 64px; padding-top: 0px;" class="material-icons mdc-theme--text-icon-on-background">account_circle</i>
        <p class="mdc-typography--title mdc-theme--text-primary-on-light"> Please <a class="mdc-theme--secondary"
                                                                                     href="<?php echo wp_login_url( get_permalink() ); ?>">login</a> to use platform</p>
        <p class="mdc-typography--title mdc-theme--text-primary-on-light"> Or
            <a class="mdc-theme--secondary" href="<?php echo wp_registration_url(); ?>">register</a>
            if you don't have an account</p>


        <p class="mdc-typography--title mdc-theme--text-primary-on-light"> Or
            <a class="mdc-theme--secondary" href="<?php echo site_url(); ?>">return to home page</a>
        </p>

    </div>

    <hr class="WhiteSpaceSeparator">

<?php } else {


    ?>

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
        var lightsLoader = new VRodos_LightsPawn_Loader();
        lightsLoader.load(vrodos_scene_data.objects);

        // ================== Text ============
        const loader = new THREE.FontLoader();
        var textGeometry;
        loader.load( siteurl + '/wp-content/plugins/VRodos/js_libs/threejs141/fonts/helvetiker_regular.typeface.json', function ( font ) {

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
            let l = Object.keys(vrodos_scene_data.objects).length;
            let name = Object.keys(vrodos_scene_data.objects)[l - 1];

            let objItem = envir.scene.getObjectByName(name);

            if (objItem === undefined){
                return;
            }

            // Find scene dimension in order to configure camera in 2D view (Y axis distance)
            findSceneDimensions();
            envir.updateCameraGivenSceneLimits();

            // Set Target light for Spots
            // for (let n in resources3D) {
            //     // (function (name) {
            //     //     if (resources3D[name]['category_name'] === 'lightSpot') {
            //     //         let lightSpot = envir.scene.getObjectByName(name);
            //     //         lightSpot.target = envir.scene.getObjectByName(resources3D[name]['lighttargetobjectname']);
            //     //     }
            //     // })(n);
            // }
        }; // End of manager

        // Loader of assets
        var loaderMulti = new VRodos_LoaderMulti();

        loaderMulti.load(manager, vrodos_scene_data.objects, pluginPath);

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

            //envir.cubeCamera.update( envir.renderer, envir.scene );
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
    </script>
<?php } ?>

<?php // get_footer(); ?>

