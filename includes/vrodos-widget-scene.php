<?php

// Load Scripts
function vrodos_widget_scene_preamp_scripts() {
	
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
	
	wp_enqueue_script('vrodos_scripts');
 
	// Fixed at 87 (forked of original 87)
	wp_enqueue_script('vrodos_load_datgui');
	wp_enqueue_script('vrodos_load87_OBJloader');
	wp_enqueue_script('vrodos_load87_MTLloader');
	wp_enqueue_script('vrodos_load141_OrbitControls');
	wp_enqueue_script('vrodos_load141_TransformControls');
	wp_enqueue_script('vrodos_load141_PointerLockControls');
	
	wp_enqueue_script('vrodos_ScenePersistence');
 
	// Colorpicker for the lights
	wp_enqueue_script('vrodos_jscolorpick');
	
	
	
	wp_enqueue_script('vrodos_3d_editor_environmentals');
	wp_enqueue_script('vrodos_keyButtons');
	wp_enqueue_script('vrodos_rayCasters');
	wp_enqueue_script('vrodos_auxControlers');
    wp_enqueue_script('vrodos_BordersFinder');
	wp_enqueue_script('vrodos_LoaderMulti');
	wp_enqueue_script('VRodos_LightsPawn_Loader');
	wp_enqueue_script('vrodos_movePointerLocker');
	wp_enqueue_script('vrodos_addRemoveOne');
	wp_enqueue_script('vrodos_3d_editor_buttons');
	wp_enqueue_script('vrodos_vr_editor_analytics');
	wp_enqueue_script('vrodos_fetch_asset_scenes_request');
 
	// Define current path of plugin
	$pluginpath = str_replace('\\','/', plugin_dir_url( __DIR__  ));
    
    // Fetch Asset
	wp_enqueue_script( 'ajax-script_fetchasset', $pluginpath.
	                                             '/js_libs/ajaxes/fetch_asset.js', array('jquery') );
    
    //$glb_file_name = get_post($assetpostMeta['vrodos_asset3d_glb'][0])->guid;
    
	wp_localize_script( 'ajax-script_fetchasset', 'my_ajax_object_fetchasset',
		array( 'ajax_url' => admin_url( 'admin-ajax.php' ) )
	);
}



// Creating the widget
class vrodos_3d_widget_scene extends WP_Widget {
    
    function __construct() {
        parent::__construct(
            // Base ID of your widget
            'vrodos_3d_widget_scene',

            // Widget name will appear in UI
            __('VRodos 3D Scene Widget', 'vrodos_3d_widget_scene_domain'),

            // Widget description
            array( 'description' => __( 'A widget to place 3D scenes', 'vrodos_widget_scene_domain' ), )
        );
    }
    
    
    // Widget Backend
    public function form( $instance ) {

	    $title = isset( $instance[ 'title' ] ) ? $instance[ 'title' ] : '';
	    $titleshow = isset( $instance[ 'titleshow' ] ) ? $instance[ 'titleshow' ] : 'false';
	
	    //$asset_id =  isset( $instance[ 'asset_id' ] ) ? $instance[ 'asset_id' ] : __( 'Insert asset id', 'vrodos_3d_widget_domain' );
	    $scene_id =  isset( $instance[ 'scene_id' ] ) ? $instance[ 'scene_id' ] : __( 'Insert scene id', 'vrodos_3d_widget_scene_domain' );

	    $camerapositionx = isset( $instance[ 'camerapositionx' ] ) ?  $instance[ 'camerapositionx' ] : 0;
	    $camerapositiony = isset( $instance[ 'camerapositiony' ] ) ?  $instance[ 'camerapositiony' ] : 0;
	    $camerapositionz = isset( $instance[ 'camerapositionz' ] ) ?  $instance[ 'camerapositionz' ] : -1;
	
	    $canvaswidth = isset( $instance[ 'canvaswidth' ] )? $instance[ 'canvaswidth' ] : '600px';
	    $canvasheight = isset( $instance[ 'canvasheight' ] )? $instance[ 'canvasheight' ] : '400px';
	
	    $canvasbackgroundcolor = isset( $instance[ 'canvasbackgroundcolor' ] )? $instance[ 'canvasbackgroundcolor' ] : 'transparent';
	
	    $enablezoom = isset( $instance[ 'enablezoom' ] )? $instance[ 'enablezoom' ] : 'true';
	
	    $enablepan = isset( $instance[ 'enablepan' ] )? $instance[ 'enablepan' ] : 'false';
	
	    $canvasposition = isset( $instance[ 'canvasposition' ] )? $instance[ 'canvasposition' ] : 'relative';
	
	    $canvastop = isset( $instance[ 'canvastop' ] )? $instance[ 'canvastop' ] : '';
	    $canvasbottom = isset( $instance[ 'canvasbottom' ] )? $instance[ 'canvasbottom' ] : '';
	    $canvasleft = isset( $instance[ 'canvasleft' ] )? $instance[ 'canvasleft' ] : '';
	    $canvasright = isset( $instance[ 'canvasright' ] )? $instance[ 'canvasright' ] : '';
	
	    $customcss = isset( $instance[ 'customcss' ] )? $instance[ 'customcss' ] : '';
	
	    // Widget admin form
	    ?>
        <p>
            <label for="<?php echo $this->get_field_id( 'title' ); ?>">
			    <?php _e( 'Title (No Gaps):' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'title' ); ?>"
                   name="<?php echo $this->get_field_name( 'title' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $title ); ?>"
            />
        </p>

        <p>
            <label for="<?php echo $this->get_field_id( 'titleshow' ); ?>">
			    <?php _e( 'Title Show ?' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'titleshow' ); ?>"
                   name="<?php echo $this->get_field_name( 'titleshow' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $titleshow ); ?>"
            />
        </p>

        <p>
            <label for="<?php echo $this->get_field_id( 'scene_id' ); ?>">
			    <?php _e( 'Scene id:' ); ?>
            </label>
            
            <select
                    class   ="widefat"
                    id   = "<?php echo $this->get_field_id( 'scene_id');?>"
                    name = "<?php echo $this->get_field_name( 'scene_id');?>"
                    data-widgetserialno ="<?php echo $this->number;?>"
                >
                <option value="">Select one</option>
			    <?php
	    		    // Get all assets
    			    $scenes = get_scenes_wonder_around();
                    
                    // Iterate for the drop down
                    for ($i=0;$i<count($scenes);$i++){
                        echo '<option value="'.$scenes[$i]['sceneid'].'" '.
                                               (esc_attr( $scene_id ) == $scenes[$i]['sceneid']?'selected':'').'>'.
                                              $scenes[$i]['sceneName'].
                             ' of '.$scenes[$i]['scene_parent_project'][0]->name.'</option>';
                    }
			    ?>
            </select>
        </p>

        <p>
            <label for="<?php echo $this->get_field_id( 'camerapositionx' ); ?>">
			    <?php _e( 'camera Position X:' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'camerapositionx' ); ?>"
                   name="<?php echo $this->get_field_name( 'camerapositionx' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $camerapositionx ); ?>"
            />
        </p>

        <p>
            <label for="<?php echo $this->get_field_id( 'camerapositiony' ); ?>">
			    <?php _e( 'Camera Position Y:' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'camerapositiony' ); ?>"
                   name="<?php echo $this->get_field_name( 'camerapositiony' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $camerapositiony ); ?>"
            />
        </p>

        <p>
            <label for="<?php echo $this->get_field_id( 'camerapositionz' ); ?>">
			    <?php _e( 'Camera Position Z:' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'camerapositionz' ); ?>"
                   name="<?php echo $this->get_field_name( 'camerapositionz' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $camerapositionz ); ?>"
            />
        </p>


        <p>
            <label for="<?php echo $this->get_field_id( 'canvaswidth' ); ?>">
			    <?php _e( 'Canvas width, e.g. 600px:' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'canvaswidth' ); ?>"
                   name="<?php echo $this->get_field_name( 'canvaswidth' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $canvaswidth ); ?>"
            />
        </p>


        <p>
            <label for="<?php echo $this->get_field_id( 'canvasheight' ); ?>">
			    <?php _e( 'Canvas height, e.g. 400px::' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'canvasheight' ); ?>"
                   name="<?php echo $this->get_field_name( 'canvasheight' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $canvasheight ); ?>"
            />
        </p>





        <p>
            <label for="<?php echo $this->get_field_id( 'canvasbackgroundcolor' ); ?>">
			    <?php _e( 'Canvas Background Color. Examples: basic names (yellow), transparent, or rbg(0,10,100):' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'canvasbackgroundcolor' ); ?>"
                   name="<?php echo $this->get_field_name( 'canvasbackgroundcolor' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $canvasbackgroundcolor ); ?>"
            />
        </p>


        <p>
            <label for="<?php echo $this->get_field_id( 'enablezoom' ); ?>">
			    <?php _e( 'Enable Zoom:' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'enablezoom' ); ?>"
                   name="<?php echo $this->get_field_name( 'enablezoom' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $enablezoom ); ?>"
            />
        </p>


        <p>
            <label for="<?php echo $this->get_field_id( 'enablepan' ); ?>">
			    <?php _e( 'Enable pan:' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'enablepan' ); ?>"
                   name="<?php echo $this->get_field_name( 'enablepan' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $enablepan ); ?>"
            />
        </p>


        <p>
            <label for="<?php echo $this->get_field_id( 'canvasposition' ); ?>">
			    <?php _e( 'Canvas position (relative, absolute, etc.):' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'canvasposition' ); ?>"
                   name="<?php echo $this->get_field_name( 'canvasposition' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $canvasposition ); ?>"
            />
        </p>

        <p>
            <label for="<?php echo $this->get_field_id( 'canvastop' ); ?>">
			    <?php _e( 'Canvas top, e.g. 5px:' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'canvastop' ); ?>"
                   name="<?php echo $this->get_field_name( 'canvastop' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $canvastop ); ?>"
            />
        </p>

        <p>
            <label for="<?php echo $this->get_field_id( 'canvasbottom' ); ?>">
			    <?php _e( 'Canvas bottom, e.g. 5px:' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'canvasbottom' ); ?>"
                   name="<?php echo $this->get_field_name( 'canvasbottom' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $canvasbottom ); ?>"
            />
        </p>

        <p>
            <label for="<?php echo $this->get_field_id( 'canvasleft' ); ?>">
			    <?php _e( 'Canvas left, e.g. 5px:' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'canvasleft' ); ?>"
                   name="<?php echo $this->get_field_name( 'canvasleft' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $canvasleft ); ?>"
            />
        </p>

        <p>
            <label for="<?php echo $this->get_field_id( 'canvasright' ); ?>">
			    <?php _e( 'Canvas right, e.g. 5px:' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'canvasright' ); ?>"
                   name="<?php echo $this->get_field_name( 'canvasright' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $canvasright ); ?>"
            />
        </p>


        <p>
            <label for="<?php echo $this->get_field_id( 'customcss' ); ?>">
			    <?php _e( 'Any css you like, e.g. "margin-top:50px;margin-left:30px;" :' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'customcss' ); ?>"
                   name="<?php echo $this->get_field_name( 'customcss' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $customcss ); ?>"
            />
        </p>
	
	    <?php
    
    
    }
    
    
    // Creating widget front-end
    public function widget( $args, $instance ) {
	
	
	    $title = $instance['title']; //apply_filters( 'widget_title', $instance['title'] );
	    $titleshow = $instance['titleshow'] ; //apply_filters( 'widget_titleshow', $instance['titleshow'] );
	    $scene_id = $instance['scene_id'];    //apply_filters( 'widget_asset_id', $instance['asset_id'] );
	
	
	    $camerapositionx = $instance['camerapositionx'];
	    // apply_filters( 'widget_camerapositionx', $instance['camerapositionx'] );
	    $camerapositiony = $instance['camerapositiony'] ;//apply_filters( 'widget_camerapositiony', $instance['camerapositiony'] );
	    $camerapositionz = $instance['camerapositionz']; //apply_filters( 'widget_camerapositionz', $instance['camerapositionz'] );
	
	    $canvaswidth = $instance['canvaswidth']; //apply_filters( 'widget_canvaswidth', $instance['canvaswidth'] );
	    $canvasheight = $instance['canvasheight']; //apply_filters( 'widget_canvasheight', $instance['canvasheight'] );
	
	    $canvasbackgroundcolor = $instance['canvasbackgroundcolor']; //apply_filters( 'widget_canvasbackgroundcolor', $instance['canvasbackgroundcolor'] );
	    $enablepan = $instance['enablepan']; //apply_filters( 'widget_enablepan', $instance['enablepan'] );
	    $enablezoom = $instance['enablezoom']; //apply_filters( 'widget_enablezoom', $instance['enablezoom'] );
	
	    $canvasposition = $instance['canvasposition']; //apply_filters( 'widget_canvasposition', $instance['canvasposition'] );
	
	    $canvastop = $instance['canvastop']; //apply_filters( 'widget_canvastop', $instance['canvastop'] );
	    $canvasbottom = $instance['canvasbottom']; //apply_filters( 'widget_canvastop', $instance['canvasbottom'] );
	    $canvasleft = $instance['canvasleft']; //apply_filters( 'widget_canvastop', $instance['canvasleft'] );
	    $canvasright = $instance['canvasright']; //apply_filters( 'widget_canvastop', $instance['canvasright'] );
	
	    $customcss = $instance['customcss'];
        
        
        
        //----------------------------------------
        
        // wpcontent/uploads/
	    $upload_url = wp_upload_dir()['baseurl'];
	    $upload_dir = str_replace('\\','/',wp_upload_dir()['basedir']);

        // Scene
	    $current_scene_id = $scene_id; // sanitize_text_field( intval( $_GET['vrodos_scene'] ));

        // Get scene content from post
	    $scene_post = get_post($current_scene_id);

        // If empty load default scenes if no content. Do not put esc_attr, crashes the universe in 3D.
	    $sceneJSON = $scene_post->post_content;

        
        //                <!-- Load Scene - javascript var resources3D[] -->
        ?>
            
            <script>
                var resources3D  = [];// This holds all the resources to load. Generated in Parse JSON
            </script>
        
        <?php
        require( plugin_dir_path( __DIR__ ).'includes/templates/vrodos-edit-3D-scene-ParseJSON.php' );
        
        /* Initial load as php */
        $SceneParserPHP = new ParseJSON($upload_url);
        $SceneParserPHP->init($sceneJSON);
        
        
	    $sceneTitle = $scene_post->post_name;
	
	    $pluginpath = str_replace('\\','/', plugin_dir_url( __DIR__  ) );
        
        // Shift vars to Javascript side
	    echo '<script>';
	    echo 'var pluginPath="'.$pluginpath.'";';
	    echo 'var uploadDir="'.wp_upload_dir()['baseurl'].'";';
        echo 'var siteurl="'.site_url().'";';
	    echo '</script>';
	
	    get_header();
     
	    // 1. before and after widget arguments are defined by themes
	    echo $args['before_widget'];
	
	    $styledivcanvas = "position:".$canvasposition.";width:".$canvaswidth.";height:".$canvasheight.
	                      ";top:".$canvastop.";bottom:".$canvasbottom.";left:".$canvasleft.";right:".$canvasright.";".$customcss;
        
        ?>

        <!-- PANELS -->
        <!-- 3D editor  -->
        <div id="vr_editor_main_div" style="<?php echo $styledivcanvas; ?> ; position:relative">
            <!--  Make form to submit user changes -->
            <div id="progressWrapper" class="VrInfoPhpStyle" style="visibility: visible">
                <div id="progress" class="ProgressContainerStyle mdc-theme--text-primary-on-light mdc-typography--subheading1">
                </div>
        
                <div id="result_download" class="result"></div>
            </div>
        </div>   <!--   VR DIV   -->
        
        <!--  Part 3: Start 3D with Javascript   -->
        <script>
            // all 3d dom
            let vr_editor_main_div = document.getElementById( 'vr_editor_main_div' );
        
            // camera, scene, renderer, lights, stats, floor, browse_controls are all children of Environmentals instance
            var envir = new vrodos_3d_editor_environmentals(vr_editor_main_div);
            envir.is2d = false;
        
            firstPersonBlockerBtn = null;
        
            // Load all 3D including Steve
            let loaderMulti;
        
            // id of animation frame is used for canceling animation when dat-gui changes
            var id_animation_frame;
        
            

            // Add lights on scene
            var lightsLoader = new VRodos_LightsPawn_Loader();
            lightsLoader.load(resources3D);
            
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
                    // (function (name) {
                    //     if (resources3D[name]['categoryName'] === 'lightSpot') {
                    //         let lightSpot = envir.scene.getObjectByName(name);
                    //         lightSpot.target = envir.scene.getObjectByName(resources3D[name]['lighttargetobjectname']);
                    //     }
                    // })(n);
                }
        
            }; // End of manager
        </script>
        

        
        <script>

            
            loaderMulti = new VRodos_LoaderMulti("1");
        
            loaderMulti.load(manager, resources3D, pluginPath);
            //vrodos_fetchAndLoadMultipleAssetsAjax(manager, resources3D, pluginPath);
        
            // Only in Undo redo as javascript not php!
            function parseJSON_LoadScene(scene_json){
        
                resources3D = new VrodosSceneImporter().parse(scene_json, uploadDir);
        
                // CLEAR SCENE
                let preserveElements = ['myAxisHelper', 'myGridHelper', 'avatarCamera', 'myTransformControls'];
        
                for (let i = envir.scene.children.length - 1; i >=0 ; i--){
                    if (!preserveElements.includes(envir.scene.children[i].name))
                        envir.scene.remove(envir.scene.children[i]);
                }
        
                setHierarchyViewer();
        
                // transform_controls = envir.scene.getObjectByName('myTransformControls');
                // transform_controls.attach(envir.scene.getObjectByName("avatarYawObject"));
        
                
        
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

                //envir.cubeCamera.update( envir.renderer, envir.scene );
            }
        
            animate();
        
            setVisiblityLightHelpingElements(false);
            envir.isComposerOn = true;
            //transform_controls.visible  = false;
            envir.getSteveFrustum().visible = false;
            envir.orbitControls.enableRotate = true;
            envir.orbitControls.enable = true;
        </script>


        <?php

        // This is where you run the code and display the output
        echo $args['after_widget'];
    }



    // Updating widget replacing old instances with new
    public function update( $new_instance, $old_instance ) {
	
	    $instance = array();
	
	    $instance['title'] = ( ! empty( $new_instance['title'] ) ) ? strip_tags( $new_instance['title'] ) : '';
	    $instance['titleshow'] = ( ! empty( $new_instance['titleshow'] ) ) ?
		    strip_tags( $new_instance['titleshow'] ) : 'false';
	
	    $instance['scene_id'] = ( ! empty( $new_instance['scene_id'] ) ) ? strip_tags( $new_instance['scene_id'] ) : '';
	
	    $instance['camerapositionx'] =  !empty($new_instance['camerapositionx']) ?
		    strip_tags($new_instance['camerapositionx']) : '0';
	
	    $instance['camerapositiony'] = ( ! empty( $new_instance['camerapositiony'] ) ) ?
		    strip_tags( $new_instance['camerapositiony'] ) : '0';
	
	    $instance['camerapositionz'] = ( ! empty( $new_instance['camerapositionz'] ) ) ?
		    strip_tags( $new_instance['camerapositionz'] ) : '0';
	
	    $instance['canvaswidth'] = ( ! empty( $new_instance['canvaswidth'] ) ) ?
		    strip_tags( $new_instance['canvaswidth'] ) : '100%';
	
	    $instance['canvasheight'] = ( ! empty( $new_instance['canvasheight'] ) ) ?
		    strip_tags( $new_instance['canvasheight'] ) : '100%';
	
	    $instance['canvasbackgroundcolor'] = ( ! empty( $new_instance['canvasbackgroundcolor'] ) ) ?
		    strip_tags( $new_instance['canvasbackgroundcolor'] ) : 'transparent';
	
	    $instance['enablezoom'] = ( ! empty( $new_instance['enablezoom'] ) ) ?
		    strip_tags( $new_instance['enablezoom'] ) : 'true';
	
	    $instance['enablepan'] = ( ! empty( $new_instance['enablepan'] ) ) ?
		    strip_tags( $new_instance['enablepan'] ) : 'false';
	
	    $instance['canvasposition'] = ( ! empty( $new_instance['canvasposition'] ) ) ?
		    strip_tags( $new_instance['canvasposition'] ) : 'relative';
	
	    $varNames = ['canvastop','canvasbottom','canvasleft','canvasright'];
	
	    for ($i=0; $i<count($varNames); $i++){
		    $instance[$varNames[$i]] = ( ! empty( $new_instance[$varNames[$i]] ) ) ?
			    strip_tags( $new_instance[$varNames[$i]] ) : '0';
	    }
	
	    $instance['customcss'] = ( ! empty( $new_instance['customcss'] ) ) ?
		    strip_tags( $new_instance['customcss'] ) : '';
        
        return $instance;
    }
}



