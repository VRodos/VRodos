<?php

// Load Scripts
function wpunity_widget_functions() {
    
    // Stylesheet
    wp_enqueue_style('wpunity_widgets_stylesheet');
    
    // Load single asset kernel
    // Three js : for simple rendering
    wp_enqueue_script('vrodos_scripts');
    
    // For fbx binary
    wp_enqueue_script('vrodos_inflate'); // for binary fbx
    
    // 1. Three js library
    wp_enqueue_script('wpunity_load119_threejs');
    wp_enqueue_script('wpunity_load124_statjs');
    
    // 2. Obj loader simple; For loading an uploaded obj
    wp_enqueue_script('wpunity_load87_OBJloader');
    
    // 3. Obj loader 2: For preview loading
    wp_enqueue_script('wpunity_load87_OBJloader2');
    wp_enqueue_script('wpunity_load87_WWOBJloader2');
    
    // 4. Mtl loader
    wp_enqueue_script('wpunity_load87_MTLloader');
    
    // 5. Pdb loader for molecules
    wp_enqueue_script('wpunity_load87_PDBloader');
    
    // 6. Fbx loader
    wp_enqueue_script('wpunity_load119_FBXloader');
    
    // 7. Trackball controls
    wp_enqueue_script('wpunity_load124_TrackballControls');
    wp_enqueue_script('wpunity_load119_OrbitControls');
    
    // 8. GLTF Loader
    wp_enqueue_script('wpunity_load119_GLTFLoader');
    wp_enqueue_script('wpunity_load119_DRACOLoader');
    wp_enqueue_script('wpunity_load119_DDSLoader');
    wp_enqueue_script('wpunity_load119_KTXLoader');
    
    // For the PDB files to annotate molecules in 3D
    wp_enqueue_script('wpunity_load119_CSS2DRenderer');
    
    // Load single asset
    wp_enqueue_script('Asset_viewer_3d_kernel');
}



// Creating the widget
class wpunity_3d_widget extends WP_Widget {
    
    function __construct() {
        parent::__construct(

            // Base ID of your widget
            'wpunity_3d_widget',

            // Widget name will appear in UI
            __('HeliosVR 3D Widget', 'wpunity_3d_widget_domain'),

            // Widget description
            array( 'description' => __( 'A widget to place 3D models', 'wpunity_widget_domain' ), )
        );
    }
    
    
    // Widget Backend
    public function form( $instance ) {
        
        $title = isset( $instance[ 'title' ] ) ? $instance[ 'title' ] : '';
        $titleShow = isset( $instance[ 'titleShow' ] ) ? $instance[ 'titleShow' ] : 'false';
        
        $asset_id =  isset( $instance[ 'asset_id' ] ) ? $instance[ 'asset_id' ] : __( 'Insert asset id', 'wpunity_3d_widget_domain' );
        $cameraPositionX = isset( $instance[ 'cameraPositionX' ] ) ?  $instance[ 'cameraPositionX' ] : 0;
        $cameraPositionY = isset( $instance[ 'cameraPositionY' ] ) ?  $instance[ 'cameraPositionY' ] : 0;
        $cameraPositionZ = isset( $instance[ 'cameraPositionZ' ] ) ?  $instance[ 'cameraPositionZ' ] : -1;
        $canvasWidth = isset( $instance[ 'canvasWidth' ] )? $instance[ 'canvasWidth' ] : '100%';
        $canvasHeight = isset( $instance[ 'canvasHeight' ] )? $instance[ 'canvasHeight' ] : '100%';
    
        $canvasBackgroundColor = isset( $instance[ 'canvasBackgroundColor' ] )? $instance[ 'canvasBackgroundColor' ] : 'transparent';
        
        $enableZoom = isset( $instance[ 'enableZoom' ] )? $instance[ 'enableZoom' ] : 'true';
    
        $enablePan = isset( $instance[ 'enableZoom' ] )? $instance[ 'enablePan' ] : 'false';
    
        $canvasPosition = isset( $instance[ 'canvasPosition' ] )? $instance[ 'canvasPosition' ] : 'relative';
        
        $canvasTop = isset( $instance[ 'canvasTop' ] )? $instance[ 'canvasTop' ] : '';
        $canvasBottom = isset( $instance[ 'canvasBottom' ] )? $instance[ 'canvasBottom' ] : '';
        $canvasLeft = isset( $instance[ 'canvasLeft' ] )? $instance[ 'canvasLeft' ] : '';
        $canvasRight = isset( $instance[ 'canvasRight' ] )? $instance[ 'canvasRight' ] : '';
        
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
            <label for="<?php echo $this->get_field_id( 'titleShow' ); ?>">
                <?php _e( 'Title Show ?' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'titleShow' ); ?>"
                   name="<?php echo $this->get_field_name( 'titleShow' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $titleShow ); ?>"
            />
        </p>
        
        
        <p>
            <label for="<?php echo $this->get_field_id( 'asset_id' ); ?>">
                <?php _e( 'Asset id:' ); ?>
            </label>
            

            <select
                class="widefat"
                name="<?php echo $this->get_field_name( 'asset_id' ); ?>"
                id="<?php echo $this->get_field_id( 'asset_id' ); ?>"
            >
            
            <?php
                // Get all assets
                $assets = get_assets([]);
                
                // Iterate for the drop down
                for ($i=0;$i<count($assets);$i++){
                    
                    echo '<option value="'.
                        $assets[$i]['assetid'].'" '.
                        (esc_attr( $asset_id )==$assets[$i]['assetid']?'selected':'').
                        '>'.
                        $assets[$i]['assetName'].
                        '</option>';
                    
                }
            ?>
            </select>
        </p>

        <p>
            <label for="<?php echo $this->get_field_id( 'cameraPositionX' ); ?>">
                <?php _e( 'camera Position X:' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'cameraPositionX' ); ?>"
                   name="<?php echo $this->get_field_name( 'cameraPositionX' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $cameraPositionX ); ?>"
            />
        </p>

        <p>
            <label for="<?php echo $this->get_field_id( 'cameraPositionY' ); ?>">
                <?php _e( 'Camera Position Y:' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'cameraPositionY' ); ?>"
                   name="<?php echo $this->get_field_name( 'cameraPositionY' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $cameraPositionY ); ?>"
            />
        </p>

        <p>
            <label for="<?php echo $this->get_field_id( 'cameraPositionZ' ); ?>">
                <?php _e( 'Camera Position Z:' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'cameraPositionZ' ); ?>"
                   name="<?php echo $this->get_field_name( 'cameraPositionZ' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $cameraPositionZ ); ?>"
            />
        </p>


        <p>
            <label for="<?php echo $this->get_field_id( 'canvasWidth' ); ?>">
                <?php _e( 'Canvas width, e.g. 200px:' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'canvasWidth' ); ?>"
                   name="<?php echo $this->get_field_name( 'canvasWidth' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $canvasWidth ); ?>"
            />
        </p>


        <p>
            <label for="<?php echo $this->get_field_id( 'canvasHeight' ); ?>">
                <?php _e( 'Canvas height:' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'canvasHeight' ); ?>"
                   name="<?php echo $this->get_field_name( 'canvasHeight' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $canvasHeight ); ?>"
            />
        </p>


        
        

        <p>
            <label for="<?php echo $this->get_field_id( 'canvasBackgroundColor' ); ?>">
                <?php _e( 'Canvas Background Color. Examples: basic names (yellow), transparent, or rbg(0,10,100):' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'canvasBackgroundColor' ); ?>"
                   name="<?php echo $this->get_field_name( 'canvasBackgroundColor' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $canvasBackgroundColor ); ?>"
            />
        </p>

        
        <p>
            <label for="<?php echo $this->get_field_id( 'enableZoom' ); ?>">
                <?php _e( 'Enable Zoom:' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'enableZoom' ); ?>"
                   name="<?php echo $this->get_field_name( 'enableZoom' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $enableZoom ); ?>"
            />
        </p>
        

        <p>
            <label for="<?php echo $this->get_field_id( 'enablePan' ); ?>">
                <?php _e( 'Enable pan:' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'enablePan' ); ?>"
                   name="<?php echo $this->get_field_name( 'enablePan' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $enablePan ); ?>"
            />
        </p>


        <p>
            <label for="<?php echo $this->get_field_id( 'canvasPosition' ); ?>">
                <?php _e( 'Canvas position (relative, absolute, etc.):' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'canvasPosition' ); ?>"
                   name="<?php echo $this->get_field_name( 'canvasPosition' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $canvasPosition ); ?>"
            />
        </p>

        <p>
            <label for="<?php echo $this->get_field_id( 'canvasTop' ); ?>">
                <?php _e( 'Canvas top, e.g. 5px:' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'canvasTop' ); ?>"
                   name="<?php echo $this->get_field_name( 'canvasTop' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $canvasTop ); ?>"
            />
        </p>

        <p>
            <label for="<?php echo $this->get_field_id( 'canvasBottom' ); ?>">
                <?php _e( 'Canvas bottom, e.g. 5px:' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'canvasBottom' ); ?>"
                   name="<?php echo $this->get_field_name( 'canvasBottom' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $canvasBottom ); ?>"
            />
        </p>

        <p>
            <label for="<?php echo $this->get_field_id( 'canvasLeft' ); ?>">
                <?php _e( 'Canvas left, e.g. 5px:' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'canvasLeft' ); ?>"
                   name="<?php echo $this->get_field_name( 'canvasLeft' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $canvasLeft ); ?>"
            />
        </p>

        <p>
            <label for="<?php echo $this->get_field_id( 'canvasRight' ); ?>">
                <?php _e( 'Canvas right, e.g. 5px:' ); ?>
            </label>

            <input class="widefat"
                   id="<?php echo $this->get_field_id( 'canvasRight' ); ?>"
                   name="<?php echo $this->get_field_name( 'canvasRight' ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $canvasRight ); ?>"
            />
        </p>

        <?php
    }
    
    
    // Creating widget front-end
    public function widget( $args, $instance ) {

        $title = apply_filters( 'widget_title', $instance['title'] );
        $titleShow = apply_filters( 'widget_titleShow', $instance['titleShow'] );
        $asset_id = apply_filters( 'widget_asset_id', $instance['asset_id'] );
        $cameraPositionX = apply_filters( 'widget_cameraPositionX', $instance['cameraPositionX'] );
        $cameraPositionY = apply_filters( 'widget_cameraPositionY', $instance['cameraPositionY'] );
        $cameraPositionZ = apply_filters( 'widget_cameraPositionZ', $instance['cameraPositionZ'] );
    
        $canvasWidth = apply_filters( 'widget_canvasWidth', $instance['canvasWidth'] );
        $canvasHeight = apply_filters( 'widget_canvasHeight', $instance['canvasHeight'] );
    
        $canvasBackgroundColor = apply_filters( 'widget_canvasBackgroundColor', $instance['canvasBackgroundColor'] );
        $enablePan = apply_filters( 'widget_enablePan', $instance['enablePan'] );
        $enableZoom = apply_filters( 'widget_enableZoom', $instance['enableZoom'] );
    
        $canvasPosition = apply_filters( 'widget_canvasPosition', $instance['canvasPosition'] );
    
        $canvasTop = apply_filters( 'widget_canvasTop', $instance['canvasTop'] );
        $canvasBottom = apply_filters( 'widget_canvasTop', $instance['canvasBottom'] );
        $canvasLeft = apply_filters( 'widget_canvasTop', $instance['canvasLeft'] );
        $canvasRight = apply_filters( 'widget_canvasTop', $instance['canvasRight'] );
        
        
        // before and after widget arguments are defined by themes
        echo $args['before_widget'];
        
        
        // The data
        if ( ! empty( $title ) && $titleShow === 'true')
            echo $args['before_title'] . $title . $args['after_title'];
    
//        echo $cameraPositionX.' '.$cameraPositionY.' '.$cameraPositionZ;

//        if ( ! empty( $asset_id ) )
//            echo $asset_id;
        
        // -----  Step 2 : Get  urls from id ---------
    
        // Get post
        $asset_post    = get_post($asset_id);
    
        // Get post meta
        $assetpostMeta = get_post_meta($asset_id);
    
        // Background color in canvas
        $back_3d_color = $assetpostMeta['wpunity_asset3d_back_3d_color'][0];
    
        $asset_3d_files = get_3D_model_files($assetpostMeta, $asset_id);
        
        // audio file
        $audioID = get_post_meta($asset_id, 'wpunity_asset3d_audio', true);
        $attachment_audio_file = get_post( $audioID )->guid;
        ?>

        <div id="" class=""
             style="position:<?php
             echo $canvasPosition;?>; width:<?php
             echo $canvasWidth;?>; height:<?php
             echo $canvasHeight;?>; top:<?php
             echo $canvasTop;?>; bottom:<?php
             echo $canvasBottom;?>; left:<?php
             echo $canvasLeft;?>; right:<?php
             echo $canvasRight;?>;">

            <!--   Progress bar -->
            <div id="previewProgressSliderDiv" class="CenterContents"
                 style="display: none; z-index:2; width:100%; top:0"
            >
                <h6 id="previewProgressLabelDiv<?php echo $title;?>" class="mdc-theme--text-primary-on-light mdc-typography--subheading1">
                    Preview of 3D Model</h6>
                <div class="progressSliderDiv<?php echo $title;?>">
                    <div id="previewProgressSliderLineDiv<?php echo $title;?>" class="progressSliderSubLineDiv" style="width: 0;">...</div>
                </div>
            </div>
            
            <!-- LabelRenderer of Canvas -->
            <div id="divCanvasLabels<?php echo $title;?>" style="position:absolute; width:100%;">

                <!-- 3D Canvas -->
                <canvas id="divCanvas<?php echo $title;?>" style="background: <?php $canvasBackgroundColor; ?>; width:100%; position:relative; background: transparent"></canvas>

                <!--suppress HtmlUnknownAnchorTarget -->
                <a href="#/" class="animationButton" style="visibility:hidden" id="animButtonDiv<?php echo $title;?>" onclick="asset_viewer_3d_kernel<?php echo $title;?>.playStopAnimation();">Animation 1</a>

            </div>

        </div>
    
        <?php
            if(strpos($attachment_audio_file, "mp3" )!==false ||
               strpos($attachment_audio_file, "wav" )!==false) {
            ?>
            
            <audio loop preload="auto" id ='audioFile'>
                <source src="<?php echo $attachment_audio_file;?>" type="audio/mp3">
                <source src="<?php echo $attachment_audio_file;?>" type="audio/wav">
                Your browser does not support the audio tag.
            </audio>
        <?php } ?>

        <script>
            const path_url<?php echo $title;?> = "<?php echo $asset_3d_files['path'].'/'; ?>";
            const mtl_file_name_widget<?php echo $title;?>= "<?php echo $asset_3d_files['mtl']; ?>";
            const obj_file_name_widget<?php echo $title;?>= "<?php echo $asset_3d_files['obj']; ?>";
            const pdb_file_name_widget<?php echo $title;?>= "<?php echo $asset_3d_files['pdb']; ?>";
            const glb_file_name_widget<?php echo $title;?>= "<?php echo $asset_3d_files['glb'];?>";
            const fbx_file_name_widget<?php echo $title;?>= "<?php echo $asset_3d_files['fbx'];    ?>";

            const cameraPositionX<?php echo $title;?>= "<?php echo $cameraPositionX; ?>";
            const cameraPositionY<?php echo $title;?>= "<?php echo $cameraPositionY; ?>";
            const cameraPositionZ<?php echo $title;?>= "<?php echo $cameraPositionZ; ?>";

            const canvasBackgroundColor<?php echo $title;?> = "<?php echo $canvasBackgroundColor;?>";
            const enableZoom<?php echo $title;?> = "<?php echo $enableZoom?>" === 'true';
            const enablePan<?php echo $title;?> = "<?php echo $enablePan?>" === 'true';

            const textures_fbx_string_connected_widget<?php echo $title;?> = "<?php echo $asset_3d_files['texturesFbx']; ?>";
            const back_3d_color<?php echo $title;?> = "<?php echo $back_3d_color; ?>";
            const audio_file<?php echo $title;?> = document.getElementById( 'audioFile' );


        
            const asset_viewer_3d_kernel<?php echo $title;?> = new Asset_viewer_3d_kernel(
                document.getElementById( 'divCanvas<?php echo $title;?>' ),
                document.getElementById( 'divCanvasLabels<?php echo $title;?>' ),
                document.getElementById( 'animButtonDiv<?php echo $title;?>' ),
                document.getElementById('previewProgressLabelDiv<?php echo $title;?>'),
                document.getElementById('previewProgressSliderLineDiv<?php echo $title;?>'),
                canvasBackgroundColor<?php echo $title;?>,
                audio_file<?php echo $title;?>,
                path_url<?php echo $title;?>, // OBJ textures path
                mtl_file_name_widget<?php echo $title;?>,
                obj_file_name_widget<?php echo $title;?>,
                pdb_file_name_widget<?php echo $title;?>,
                fbx_file_name_widget<?php echo $title;?>,
                glb_file_name_widget<?php echo $title;?>,
                textures_fbx_string_connected_widget<?php echo $title;?>,
                false,
                canvasBackgroundColor<?php echo $title;?> === 'transparent',
                !enablePan<?php echo $title;?>, // lock
                enableZoom<?php echo $title;?>, // enableZoom
                cameraPositionX<?php echo $title;?>,
                cameraPositionY<?php echo $title;?>,
                cameraPositionZ<?php echo $title;?>);
        
        </script>
        
        <?php
        
        
        
        // This is where you run the code and display the output
        
        echo $args['after_widget'];
    }



    // Updating widget replacing old instances with new
    public function update( $new_instance, $old_instance ) {
        $instance = array();
        
        $instance['title'] = ( ! empty( $new_instance['title'] ) ) ? strip_tags( $new_instance['title'] ) : '';
        $instance['titleShow'] = ( ! empty( $new_instance['titleShow'] ) ) ?
                            strip_tags( $new_instance['titleShow'] ) : 'false';
        
        $instance['asset_id'] = ( ! empty( $new_instance['asset_id'] ) ) ? strip_tags( $new_instance['asset_id'] ) : '';
        
        $instance['cameraPositionX'] =  !empty($new_instance['cameraPositionX']) ?
                                               strip_tags($new_instance['cameraPositionX']) : '0';
        
        $instance['cameraPositionY'] = ( ! empty( $new_instance['cameraPositionY'] ) ) ?
                                               strip_tags( $new_instance['cameraPositionY'] ) : '0';
        
        $instance['cameraPositionZ'] = ( ! empty( $new_instance['cameraPositionZ'] ) ) ?
                                               strip_tags( $new_instance['cameraPositionZ'] ) : '0';
    
        $instance['canvasWidth'] = ( ! empty( $new_instance['canvasWidth'] ) ) ?
            strip_tags( $new_instance['canvasWidth'] ) : '100%';
    
        $instance['canvasHeight'] = ( ! empty( $new_instance['canvasHeight'] ) ) ?
            strip_tags( $new_instance['canvasHeight'] ) : '100%';
    
        $instance['canvasBackgroundColor'] = ( ! empty( $new_instance['canvasBackgroundColor'] ) ) ?
            strip_tags( $new_instance['canvasBackgroundColor'] ) : 'transparent';
    
        $instance['enableZoom'] = ( ! empty( $new_instance['enableZoom'] ) ) ?
            strip_tags( $new_instance['enableZoom'] ) : 'true';
    
        $instance['enablePan'] = ( ! empty( $new_instance['enablePan'] ) ) ?
            strip_tags( $new_instance['enablePan'] ) : 'false';
    
        $instance['canvasPosition'] = ( ! empty( $new_instance['canvasPosition'] ) ) ?
            strip_tags( $new_instance['canvasPosition'] ) : 'relative';
    
    
        
        
        $varNames = ['canvasTop','canvasBottom','canvasLeft','canvasRight'];

        for ($i=0; $i<count($varNames); $i++){
            $instance[$varNames[$i]] = ( ! empty( $new_instance[$varNames[$i]] ) ) ?
                strip_tags( $new_instance[$varNames[$i]] ) : '0';
        }
        
        
        return $instance;
    }
}


// Register and load the widget
function wpunity_load_widget() {
    register_widget( 'wpunity_3d_widget' );
}

