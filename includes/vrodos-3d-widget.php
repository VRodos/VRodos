<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Creating the widget
class vrodos_3d_widget extends WP_Widget {

    // Note: The constructor has been removed. All hooks are now handled by VRodos_Widget_Manager.

    // Widget Backend
    public function form( $instance ) {

        $title = isset( $instance[ 'title' ] ) ? $instance[ 'title' ] : '';
        $titleshow = isset( $instance[ 'titleshow' ] ) ? $instance[ 'titleshow' ] : 'false';

        $asset_id =  isset( $instance[ 'asset_id' ] ) ? $instance[ 'asset_id' ] : __( 'Insert asset id', 'vrodos_3d_widget_domain' );
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
            <label for="<?php echo $this->get_field_id( 'asset_id' ); ?>">
                <?php _e( 'Asset id:' ); ?>
            </label>


            <select
                    class   ="widefat"
                    onchange="vrodos_fillin_widget_assettrs(this)"
                    id      ="<?php echo $this->get_field_id( 'asset_id');?>"
                    name    ="<?php echo $this->get_field_name( 'asset_id');?>"
                    data-widgetserialno ="<?php echo $this->number;?>"
            >

                <option value="">Select one</option>

                <?php
                // Get all assets
                $assets = get_assets([]);

                // Iterate for the drop down
                for ($i=0;$i<count($assets);$i++){

                    echo '<option value="'.$assets[$i]['assetid'].'" '.(esc_attr( $asset_id )==$assets[$i]['assetid']?'selected':'').'>'.
                            $assets[$i]['assetName'].
                            '</option>';

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
        $asset_id = $instance['asset_id'];    //apply_filters( 'widget_asset_id', $instance['asset_id'] );


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


        // 1. before and after widget arguments are defined by themes
        echo $args['before_widget'];


        // The data
        if ( ! empty( $title ) && $titleshow === 'true')
            echo $args['before_title'] . $title . $args['after_title'];


        // 2. Get  urls from id

        // Get post
        $asset_post    = get_post($asset_id);


        // Get post meta
        $assetpostMeta = get_post_meta($asset_id);

        // Background color in canvas

        $back_3d_color = $assetpostMeta['vrodos_asset3d_back3dcolor'][0];



        $asset_3d_files = get_3D_model_files($assetpostMeta, $asset_id);

        // audio file
        $audioID = get_post_meta($asset_id, 'vrodos_asset3d_audio', true);
        $attachment_audio_file = get_post( $audioID )->guid;

        $styledivcanvas = "position:".$canvasposition.";width:".$canvaswidth.";height:".$canvasheight.
                ";top:".$canvastop.";bottom:".$canvasbottom.";left:".$canvasleft.";right:".$canvasright.";".$customcss;
        ?>

        <div id="" class="" style="<?php echo $styledivcanvas ?>">

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
            <div id="divCanvasLabels<?php echo $title;?>" style="position:absolute; width:100%; height:100%;">

                <!-- 3D Canvas -->
                <canvas id="divCanvas<?php echo $title;?>" style="outline: none;background: <?php $canvasbackgroundcolor; ?>; width:100%; height:100%; position:relative; background: transparent"></canvas>

                <!--suppress HtmlUnknownAnchorTarget -->
                <a href="#/" class="animationButton" style="visibility:hidden" id="animButtonDiv<?php echo $title;?>" onclick="asset_viewer_3d_kernel<?php echo $title;?>.playStopAnimation();">Animation 1</a>

            </div>

        </div>

        <?php
        if(strpos($attachment_audio_file, "mp3" )!==false ||
                strpos($attachment_audio_file, "wav" )!==false) {
            ?>

            <audio loop preload="auto" id ='audioFile<?php echo $title;?>'>
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

            const camerapositionx<?php echo $title;?>= "<?php echo $camerapositionx; ?>";
            const camerapositiony<?php echo $title;?>= "<?php echo $camerapositiony; ?>";
            const camerapositionz<?php echo $title;?>= "<?php echo $camerapositionz; ?>";

            const canvasbackgroundcolor<?php echo $title;?> = "<?php echo $canvasbackgroundcolor;?>";
            const enablezoom<?php echo $title;?> = "<?php echo $enablezoom?>" === 'true';
            const enablepan<?php echo $title;?> = "<?php echo $enablepan?>" === 'true';

            const textures_fbx_string_connected_widget<?php echo $title;?> = "<?php echo $asset_3d_files['texturesFbx']; ?>";
            const back_3d_color<?php echo $title;?> = "<?php echo $back_3d_color; ?>";



            const audio_file<?php echo $title;?> = document.getElementById( 'audioFile<?php echo $title;?>' );

            const assettrs<?php echo $title;?> = "0,0,0,0,0,0," + camerapositionx<?php echo $title;?> + "," +
                camerapositiony<?php echo $title;?> + "," +
                camerapositionz<?php echo $title;?>;


            const asset_viewer_3d_kernel<?php echo $title;?> = new VRodos_AssetViewer_3D_kernel(
                document.getElementById( 'divCanvas<?php echo $title;?>' ),
                document.getElementById( 'divCanvasLabels<?php echo $title;?>' ),
                document.getElementById( 'animButtonDiv<?php echo $title;?>' ),
                document.getElementById('previewProgressLabelDiv<?php echo $title;?>'),
                document.getElementById('previewProgressSliderLineDiv<?php echo $title;?>'),
                canvasbackgroundcolor<?php echo $title;?>,
                audio_file<?php echo $title;?>,
                path_url<?php echo $title;?>, // OBJ textures path
                null,
                null,
                null,
                null,
                glb_file_name_widget<?php echo $title;?>,
                null,
                false,
                canvasbackgroundcolor<?php echo $title;?> === 'transparent',
                enablepan<?php echo $title;?>, // lock
                enablezoom<?php echo $title;?>, // enablezoom
                assettrs<?php echo $title;?>);

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

        $instance['asset_id'] = ( ! empty( $new_instance['asset_id'] ) ) ? strip_tags( $new_instance['asset_id'] ) : '';

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
