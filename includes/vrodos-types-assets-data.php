<?php

// Create metabox with Custom Fields for Asset3D ($vrodos_databox1)
$table_of_asset_fields = array(

    // Short , full, id, type, default, single, show_in_rest
    array('GLB File', 'GLB File', 'vrodos_asset3d_glb', 'string',  '', true, true),

    array('Audio File'                 , 'Audio File for the 3D model', 'vrodos_asset3d_audio', 'string', '', true, true),

    array('Diffusion Image'            , 'Diffusion Image'            , 'vrodos_asset3d_diffimage', 'string', '', false, true),
    array('Screenshot Image'           , 'Screenshot Image'           , 'vrodos_asset3d_screenimage','string', '', true, true),
    array('Next Scene (Only for Doors)', 'Next Scene'                 , 'vrodos_asset3d_scene','string', '', true, true),
    array('Video'                      , 'Video'                      , 'vrodos_asset3d_video', 'string', '', true, true),
    array('isreward'                   , 'isreward'                   , 'vrodos_asset3d_isreward', 'string', '0', true, true),

    array('isCloned', 'isCloned', 'vrodos_asset3d_isCloned', 'string', 'false', true, true),
    array('isJoker', 'isJoker', 'vrodos_asset3d_isJoker', 'string', 'false', true, true),

    array('fonts', 'fonts', 'vrodos_asset3d_fonts', 'string', '', true, true),
    array('back_3d_color', '3D viewer background color', 'vrodos_asset3d_back3dcolor', 'string', "rgb(221, 185, 155)", true, true),

    array('Asset TRS', 'Initial asset translation, rotation, scale for the asset editor', 'vrodos_asset3d_assettrs', 'string', '0,0,0,0,0,0,0,0,0', true, true),

);


$asset_fields = [];
for ($i = 0; $i < count($table_of_asset_fields); $i++){

    $asset_fields[] = array(
        'name'     => $table_of_asset_fields[$i][0],
        'desc'     => $table_of_asset_fields[$i][1],
        'id'       => $table_of_asset_fields[$i][2],
        'type'     => $table_of_asset_fields[$i][3],
        'std'      => $table_of_asset_fields[$i][4],
        'single'      => $table_of_asset_fields[$i][5],
        'show_in_rest'      => $table_of_asset_fields[$i][6],
    );
}

global $vrodos_databox1;
// All information about our meta box
$vrodos_databox1 = array('id' => 'vrodos-assets-databox',
    'page' => 'vrodos_asset3d',
    'context' => 'normal',
    'priority' => 'high',
    'fields' => $asset_fields
);

function vrodos_asset3d_metas_description() {
    global $vrodos_databox1;

    foreach ($vrodos_databox1['fields'] as $meta_entry) {

        $meta_id = $meta_entry['id'];
        $meta_properties = array(
            'type'      => $meta_entry['type'], // Validate and sanitize the meta value as a string.
            // Default: 'string'.
            // In 4.7 one of 'string', 'boolean', 'integer', 'number' must be used as 'type'.
            'default' => $meta_entry['std'],
            'description'    => $meta_entry['desc'], // Shown in the schema for the meta key.
            'single'        => $meta_entry['single'], // Return a single value of the type. Default: false.
            'show_in_rest'    => $meta_entry['show_in_rest'], // Show in the WP REST API response. Default: false.
        );
        register_post_meta( 'vrodos_asset3d', $meta_id, $meta_properties );
    }
}


//=========================================================
// Add and Show the metabox with Custom Field for Project ($vrodos_databox1)
function vrodos_assets_databox_add() {
    global $vrodos_databox1;

    add_meta_box('vrodos-assets-infobox', 'Description Tips for Image-Text', 'vrodos_assets_infobox_show', 'vrodos_asset3d','normal','high' );

    add_meta_box($vrodos_databox1['id'], 'Asset Data', 'vrodos_assets_databox_show', $vrodos_databox1['page'], $vrodos_databox1['context'], $vrodos_databox1['priority']);
}

function vrodos_assets_infobox_show(){
    ?>
    <style>#vrodos-assets-infobox{display:none;}</style>

    &lt;b&gt;&lt;size=40&gt;MyTitle&lt;/size&gt;&lt;/b&gt; <br/>

    &lt;size=32&gt;&lt;color=green>My description goes here.&lt;/color&gt;&lt;/size&gt; <br/><br/>

    Supported tags<br/>

    &lt;b&gt;Renders the text in boldface.&lt;/b&gt;<br/>
    &lt;i&gt;Renders the text in italics.&lt;/i&gt;<br/>
    &lt;size=20&gt;Sets the size of the text according to the parameter value, given in pixels.&lt;/size&gt;<br/>
    &lt;color=blue&gt;Sets the color of the text according to the parameter value.&lt;/color&gt;<br/>

    <?php
}

// Backend form
function vrodos_assets_databox_show(){

    global $vrodos_databox1, $post;
    $post_title = $post->post_title;
    $hideshow = $post->post_status == 'publish' ? 'none' : 'block';
    ?>

    <div id="vrodos_assets_box_wrapper" style="display:<?php echo $hideshow; ?>;">
        <span class="dashicons dashicons-lock">You must publish the Asset first, in order to fill its data</span>
    </div>
    <input type="hidden" name="vrodos_assets_databox_nonce" value="<?php echo wp_create_nonce(basename(__FILE__)); ?>" />
    <table class="form-table" id="vrodos-custom-fields-table">
        <tbody>

        <?php

        foreach ($vrodos_databox1['fields'] as $field) {

            $post_meta_id = get_post_meta($post->ID , $field['id'],true);

            $valMaxUpload = intval(ini_get('upload_max_filesize'));
            $attacmentSizeMessage = $valMaxUpload < 100 ? "Files bigger than ".$valMaxUpload. " MB can not be uploaded <br/> Add to .htaccess the following two lines <br/> php_value upload_max_filesize 256M<br>php_value post_max_size 512M" : '';
            $extension = substr($field['id'], strrpos($field['id'], "_") + 1);

            $showSection = 'table-row';
            switch ($extension) {
                case 'audio':
                case 'diffimage':
                case 'scene':
                case 'video':
                case 'fonts':
                case 'isreward':
                case 'back3dcolor':
                    $showSection = 'none';
                    break;

            } ?>

            <tr id="<?php echo esc_attr($field['id']); ?>_field" style="display: <?php echo $showSection ?>" >
                <th style="width:15%">
                    <label for="<?php echo esc_attr($field['id']); ?>"> <?php echo esc_html($field['name']); ?> </label>
                    <p> <?php echo $attacmentSizeMessage; ?> </p>
                </th>
                <td>

                    <?php
                    $attachment_url = $post_meta_id ? wp_get_attachment_url($post_meta_id) : 'No '.$field['name'];
                    $preview_id = 'vrodos_asset3d_'.$extension.'_preview';
                    $preview_content = $post_meta_id ? "3D object too big to show here" : $extension." is not defined."; // TODO SHOW CONTENTS BASED ON TYPE
                    switch ($extension) {
                        case 'mtl':
                        case 'obj':
                        case 'fbx':
                        case 'pdb':
                        case 'glb':
                        case 'audio': ?>

                            <input type="text" name="<?php echo esc_attr($field['id']); ?>" readonly
                                   id="<?php echo esc_attr($field['id']); ?>" value="<?php echo esc_attr($post_meta_id ? $post_meta_id : $field['std']); ?>" size="30" style="width:65%"/>

                            <input id="<?php echo esc_attr($field['id']); ?>_btn" type="button" value="Upload <?php echo esc_html($field['name']); ?>"/>
                            <p>Pathfile: <?php echo $attachment_url; ?></p>

                            <label for="<?php echo $preview_id ?>">Preview <?php echo $extension ?>: </label>
                            <textarea id="<?php echo $preview_id ?>" readonly style=" width:100%; height:200px;"><?php echo $preview_content ?></textarea>
                            <?php break;

                        case 'diffimage':
                        case 'screenimage':
                        case 'image1':
                            ?>
                            <input type="text" name="<?php echo esc_attr($field['id']); ?>" readonly
                                   id="<?php echo esc_attr($field['id']); ?>" value="<?php echo esc_attr($post_meta_id ? $post_meta_id : $field['std']); ?>" size="30" style="width:65%"/>

                            <input id="<?php echo esc_attr($field['id']); ?>_btn" type="button" value="Upload <?php echo esc_html($field['name']); ?>"/>
                            <p>Pathfile: <?php echo $attachment_url; ?></p>
                            <img id="<?php echo $preview_id ?>" style="width:50%; height:auto" src="<?php echo wp_get_attachment_url($post_meta_id); ?>" alt="<?php echo $extension ?> preview image"/>

                            <?php break;

                        case 'isCloned':
                        case 'isJoker':
                        case 'assettrs':
                            ?>
                            <input type="text" name="<?php echo esc_attr($field['id']); ?>" readonly
                                   id="<?php echo esc_attr($field['id']); ?>" value="<?php echo esc_attr($post_meta_id ? $post_meta_id : $field['std']); ?>" size="30" style="width:65%"/>

                            <?php break;

                        case 'scene': // TODO Add a mechanism to connect scene to another.
                            break;
                        case 'video': // TODO Add a mechanism to add a video.
                            break;
                        case 'fonts': // TODO Add a component to select custom fonts.
                            break;

                    } ?>
                </td>
            </tr>
            <?php
        }   ?>

        </tbody>
    </table>

    <script>

        function vrodos_hidecfields_asset3d() {
            let e = document.getElementById("vrodos-select-asset3d-cat-dropdown");
            let value = e.options[e.selectedIndex].value;
            let text = e.options[e.selectedIndex].text;

            if(text == 'Doors'){
                // SHOW Next Scene Custom field - Hide others
                document.getElementById('vrodos_asset3d_scene_field').style.display = 'block';
                document.getElementById('vrodos_asset3d_image1').style.display = 'none';
                document.getElementById('vrodos_asset3d_image1_btn').style.display = 'none';
                document.getElementById('vrodos_asset3d_image1_preview').style.display = 'none';
                /*document.getElementById('vrodos_asset3d_video').style.display = 'none';
                document.getElementById('vrodos_asset3d_video_btn').style.display = 'none';*/
                document.getElementById('vrodos-assets-infobox').style.display = 'none';
                /*document.getElementById('vrodos_asset3d_description_greek').style.display = 'none';*/
            }else{
                var link = document.getElementById('vrodos_asset3d_scene_field');
                link.style.display = 'none';
                if(text == 'Points of Interest (Video)'){
                    document.getElementById('vrodos_asset3d_image1').style.display = 'none';
                    document.getElementById('vrodos_asset3d_image1_btn').style.display = 'none';
                    document.getElementById('vrodos_asset3d_image1_preview').style.display = 'none';
                    /*document.getElementById('vrodos_asset3d_video').style.display = 'block';
                    document.getElementById('vrodos_asset3d_video_btn').style.display = 'block';*/
                    document.getElementById('vrodos-assets-infobox').style.display = 'none';
                    /*document.getElementById('vrodos_asset3d_description_greek').style.display = 'block';*/
                }else if(text == 'Points of Interest (Image-Text)'){
                    document.getElementById('vrodos_asset3d_image1').style.display = 'block';
                    document.getElementById('vrodos_asset3d_image1_btn').style.display = 'block';
                    document.getElementById('vrodos_asset3d_image1_preview').style.display = 'block';
                    /*document.getElementById('vrodos_asset3d_video').style.display = 'none';
                    document.getElementById('vrodos_asset3d_video_btn').style.display = 'none';*/
                    document.getElementById('vrodos-assets-infobox').style.display = 'block';
                    document.getElementById('vrodos_asset3d_description_greek').style.display = 'block';
                }else if(text == 'Points of Interest'){
                    document.getElementById('vrodos_asset3d_image1').style.display = 'block';
                    document.getElementById('vrodos_asset3d_image1_btn').style.display = 'block';
                    document.getElementById('vrodos_asset3d_image1_preview').style.display = 'block';
                    /*document.getElementById('vrodos_asset3d_video').style.display = 'block';
                    document.getElementById('vrodos_asset3d_video_btn').style.display = 'block';*/
                    document.getElementById('vrodos-assets-infobox').style.display = 'none';
                    /*document.getElementById('vrodos_asset3d_description_greek').style.display = 'block';*/
                }else{
                    document.getElementById('vrodos_asset3d_image1').style.display = 'none';
                    document.getElementById('vrodos_asset3d_image1_btn').style.display = 'none';
                    document.getElementById('vrodos_asset3d_image1_preview').style.display = 'none';
                    /*document.getElementById('vrodos_asset3d_video').style.display = 'block';
                    document.getElementById('vrodos_asset3d_video_btn').style.display = 'block';*/
                    document.getElementById('vrodos-assets-infobox').style.display = 'none';
                    /*document.getElementById('vrodos_asset3d_description_greek').style.display = 'none';*/
                }
            }
        }

        jQuery(document).ready(function ($) {

            // Uploading files
            let file_frame;
            let wp_media_post_id = wp.media.model.settings.post.id; // Store the old id
            let set_to_post_id = <?php echo $post->ID; ?>; // Set this

            /*document.getElementById("vrodos_asset3d_mtl_btn").onclick = function() {
                uploadAssetToPage('vrodos_asset3d_mtl', 'application/octet-stream', 'MTL');
            }
            document.getElementById("vrodos_asset3d_obj_btn").onclick = function() {
                uploadAssetToPage('vrodos_asset3d_obj', 'application/octet-stream', 'OBJ');
            }
            document.getElementById("vrodos_asset3d_fbx_btn").onclick = function() {
                uploadAssetToPage('vrodos_asset3d_fbx', 'application/octet-stream', 'FBX');
            }
            document.getElementById("vrodos_asset3d_pdb_btn").onclick = function() {
                uploadAssetToPage('vrodos_asset3d_pdb', 'application/octet-stream', 'PDB');
            }*/
            document.getElementById("vrodos_asset3d_glb_btn").onclick = function() {
                uploadAssetToPage('vrodos_asset3d_glb', 'model/gltf-binary', 'GLB');
            }
            document.getElementById("vrodos_asset3d_screenimage_btn").onclick = function() {
                uploadAssetToPage('vrodos_asset3d_screenimage', 'image', 'Screenshot Image');
            }
            /* document.getElementById("vrodos_asset3d_diffimage_btn").onclick = function() {
                 uploadAssetToPage('vrodos_asset3d_diffimage', 'image', 'Diffusion Image');
             }*/
            /*document.getElementById("vrodos_asset3d_image1_btn").onclick = function() {
                uploadAssetToPage('vrodos_asset3d_image1', 'image', 'Image 1');
            }
            document.getElementById("vrodos_asset3d_audio_btn").onclick = function() {
                uploadAssetToPage('vrodos_asset3d_audio', 'audio', 'Audio');
            }
            document.getElementById("vrodos_asset3d_video_btn").onclick = function() {
                uploadAssetToPage('vrodos_asset3d_video', 'video', 'Video');
            }*/

            // TODO filter window by data type
            let uploadAssetToPage = (id, mime_type, type_string) => {

                // Set the wp.media post id so the uploader grabs the ID we want when initialised
                wp.media.model.settings.post.id = set_to_post_id;

                // Create the media frame
                file_frame = wp.media.frames.file_frame = wp.media({
                    title: 'Select ' + type_string + ' file to upload',
                    button: {
                        text: 'Use this ' + type_string + ' file',
                    },
                    multiple: false, // Set to true to allow multiple files to be selected
                    library: { type: mime_type }
                });

                // When a file is selected, run a callback.
                file_frame.on( 'select', function() {
                    // We set multiple to false so only get one file from the uploader
                    let attachment = file_frame.state().get('selection').first().toJSON();

                    document.getElementById(id).value = attachment.id;

                    switch (mime_type) {
                        case 'image':
                            document.getElementById(id + '_preview').setAttribute('src', attachment.url);
                            break;
                    }
                    // Restore the main post ID
                    wp.media.model.settings.post.id = wp_media_post_id;
                });

                // Finally, open the modal
                file_frame.open();
            };

            // Restore the main ID when the add media button is pressed
            jQuery( 'a.add_media' ).on( 'click', function() {
                wp.media.model.settings.post.id = wp_media_post_id;
            });

        });


    </script>
    <?php
}






// Save data from this metabox with Custom Field for Asset3D ($vrodos_databox)
// This should be done with register_meta = https://torquemag.io/2015/03/staying-safe-and-dry-with-register_meta/
function vrodos_assets_databox_save($post_id) {

    global $vrodos_databox1;

    if (!isset($_POST['vrodos_assets_databox_nonce']))
        return;

    // verify nonce
    if (!wp_verify_nonce($_POST['vrodos_assets_databox_nonce'], basename(__FILE__))) {
        return $post_id;
    }
    // check autosave
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return $post_id;
    }
    // check permissions
    if ('page' == $_POST['post_type']) {
        if (!current_user_can('edit_page', $post_id)) {
            return $post_id;
        }
    } elseif (!current_user_can('edit_post', $post_id)) {
        return $post_id;
    }

    foreach ($vrodos_databox1['fields'] as $field) {

        $old = get_post_meta($post_id, $field['id'], true);

        if(isset($_POST[$field['id']])) {
            $new = $_POST[$field['id']];

            if ($new && $new != $old) {
                update_post_meta($post_id, $field['id'], $new);
            } elseif ('' == $new && $old) {
                delete_post_meta($post_id, $field['id'], $old);
            }
        }
    }
}

?>
