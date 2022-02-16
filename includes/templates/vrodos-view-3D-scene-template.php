<?php
if ( get_option('permalink_structure') ) { $perma_structure = true; } else {$perma_structure = false;}
if( $perma_structure){$parameter_Scenepass = '?vrodos_scene=';} else {$parameter_Scenepass = '&vrodos_scene=';}


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
	
	wp_enqueue_script( 'vrodos_load119_Font');
	wp_enqueue_script( 'vrodos_load119_Cache');
	wp_enqueue_script( 'vrodos_load119_Loader');
	wp_enqueue_script( 'vrodos_load119_FileLoader');
	wp_enqueue_script( 'vrodos_load119_LoadingManager');
	
	wp_enqueue_script( 'vrodos_load119_FontLoader');
	
	wp_enqueue_script( 'vrodos_load119_FileLoader');
	
 
	
}
add_action('wp_enqueue_scripts', 'vrodos_load_vrviewer_scripts' );


// Define current path of plugin
$pluginpath = str_replace('\\','/', dirname(plugin_dir_url( __DIR__  )) );

// Fetch Asset
wp_enqueue_script( 'ajax-script_fetchasset', $pluginpath.
                                             '/js_libs/ajaxes/fetch_asset.js', array('jquery') );
wp_localize_script( 'ajax-script_fetchasset', 'my_ajax_object_fetchasset',
	array( 'ajax_url' => admin_url( 'admin-ajax.php' ) )
);



// wpcontent/uploads/
$upload_url = wp_upload_dir()['baseurl'];
$upload_dir = str_replace('\\','/',wp_upload_dir()['basedir']);

// Scene
$current_scene_id = sanitize_text_field( intval( $_GET['vrodos_scene'] ));

// Project
//$project_id    = sanitize_text_field( intval( $_GET['vrodos_game'] ) );
//$project_post  = get_post($project_id);
//$projectSlug   = $project_post->post_name;
//
//// Get if project is : 'Archaeology' or 'Energy' or 'Chemistry'
//$project_type = vrodos_return_project_type($project_id)->string;

// Get scene content from post
$scene_post = get_post($current_scene_id);

// If empty load default scenes if no content. Do not put esc_attr, crashes the universe in 3D.
$sceneJSON = $scene_post->post_content;

$sceneTitle = $scene_post->post_name;

// Shift vars to Javascript side
echo '<script>';
echo 'var pluginPath="'.$pluginpath.'";';
echo 'let uploadDir="'.wp_upload_dir()['baseurl'].'";';
echo 'var siteurl="'.site_url().'";';
echo '</script>';



// Make the header of the page
get_header(); ?>

    <!-- PANELS -->
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

    <!--  Part 3: Start 3D with Javascript   -->
    <script>
        // all 3d dom
        let container_3D_all = document.getElementById( 'vr_editor_main_div' );

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
        envir.orbitControls.enableRotate = true;
        envir.orbitControls.enable = true;


        
        // ================== Text ============
        const loader = new FontLoader();

        loader.load( siteurl + '/wp-content/plugins/VRodos/js_libs/threejs87/helvetiker_regular.typeface.json', function ( font ) {

            const geometry = new THREE.TextGeometry( 'Hello!', {
                font: font,
                size:1,
                height: 0.1,
                curveSegments: 6,
                bevelEnabled: false,
                bevelThickness: 0.5,
                bevelSize: 0.5,
                bevelOffset: 0,
                bevelSegments: 1
            } );

            var texture = THREE.ImageUtils.loadTexture( siteurl + '/wp-content/plugins/VRodos/images/dots.png');
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set( 2, 2);

            var localPlanes = [
                new THREE.Plane( new THREE.Vector3( 0, 0, 0 ), 1 ),
                new THREE.Plane( new THREE.Vector3( 15, 5, 15 ), 1 )
            ];

            var material = new THREE.MeshPhongMaterial( { map: texture, opacity:1, transparent:true,             emissiveIntensity: 1,
                emissive: new THREE.Color(1, 0, 0) ,
                clippingPlanes: localPlanes,
                clipIntersection: true}
            );
            material.color.set(0xff0000);
            textMesh1 = new THREE.Mesh( geometry, material );
            textMesh1.position.y += 3;
            envir.scene.add(textMesh1);

            // ==============================


            
            
        } );
        
    </script>

