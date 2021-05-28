<?php



// Create metabox with Custom Fields for Asset3D ($vrodos_databox1)
$table_of_asset_fields = array(
    
    // Short , full, id, type, default, single, show_in_rest
    array('MTL File', 'MTL File', 'vrodos_asset3d_mtl', 'string',  '', true, true),
    array('Obj File', 'Obj File', 'vrodos_asset3d_obj', 'string',  '', true, true),
    array('Fbx File', 'Fbx File', 'vrodos_asset3d_fbx', 'string',  '', true, true),
    array('PDB File', 'PDB File', 'vrodos_asset3d_pdb', 'string',  '', true, true),
    array('GLB File', 'GLB File', 'vrodos_asset3d_glb', 'string',  '', true, true),
    
    array('Audio File'                 , 'Audio File for the 3D model', 'vrodos_asset3d_audio', 'string', '', true, true),
    
    array('Diffusion Image'            , 'Diffusion Image'            , 'vrodos_asset3d_diffimage', 'string', '', false, true),
    array('Screenshot Image'           ,'Screenshot Image'            , 'vrodos_asset3d_screenimage','string', '', true, true),
    array('Next Scene (Only for Doors)', 'Next Scene'                 , 'vrodos_asset3d_next_scene','string', '', true, true),
    array('Video'                      , 'Video'                      , 'vrodos_asset3d_video', 'string', '', true, true),
    array('isreward'                   , 'isreward'                   , 'vrodos_asset3d_isreward', 'string', '0', true, true),
    
    array('Image 1', 'Image 1', 'vrodos_asset3d_image1', 'string', '', true, true),
    array('Image 2', 'Image 2', 'vrodos_asset3d_image2', 'string', '', true, true),
    array('Image 3', 'Image 3', 'vrodos_asset3d_image3', 'string', '', true, true),
    array('Image 4', 'Image 4', 'vrodos_asset3d_image4', 'string', '', true, true),
    
    array('isCloned', 'isCloned', 'vrodos_asset3d_isCloned', 'string', 'false', true, true),
    array('isJoker', 'isJoker', 'vrodos_asset3d_isJoker', 'string', 'false', true, true),
    
    array('fonts', 'fonts', 'vrodos_asset3d_fonts', 'string', '', true, true),
    array('back_3d_color', '3D viewer background color', 'vrodos_asset3d_back3dcolor', 'string', "rgb(221, 185, 155)", true, true),
    
    array('Asset TRS', 'Initial asset translation, rotation, scale for the asset editor', 'vrodos_asset3d_assettrs', 'string', '0,0,0,0,0,0,0,0,0', true, true),
    
    array('KidsDescription', 'Description in English for kids', 'vrodos_asset3d_description_kids', 'string', '', true, true),
    array('ExpertsDescription', 'Description in English for experts', 'vrodos_asset3d_description_experts','string', '', true, true),
    array('PerceptionDescription', 'Description in English for people with perception disabilities', 'vrodos_asset3d_description_perception', 'string', '', true, true)

);

// Add the fields that are related to language procedurally
$languages = ['Greek', 'Spanish', 'French', 'German', 'Russian'];

for ($i = 0; $i < count($languages); $i++){
    
    // Title per language
    $table_of_asset_fields[] = array( $languages[$i].'Title', 'Title in '.$languages[$i],
        'vrodos_asset3d_title_'.strtolower($languages[$i]), 'string', '', true, true);
    
    // Description per language
    $table_of_asset_fields[] = array($languages[$i], 'Description in '.$languages[$i],
        'vrodos_asset3d_description_'.strtolower($languages[$i]), 'string', '', true, true);
    
    // Description for kids per language
    $table_of_asset_fields[] = array('GreekKidsDescription', 'Description in '.$languages[$i].' for kids',
        'vrodos_asset3d_description_'.strtolower($languages[$i]).'_kids', 'string', '', true, true);
    
    // Description for experts per language
    $table_of_asset_fields[] = array($languages[$i].'ExpertsDescription', 'Description in '.$languages[$i].' for experts',
        'vrodos_asset3d_description_'.strtolower($languages[$i]).'_experts', 'string', '', true, true);
    
    // Description for disabilities per language
    $table_of_asset_fields[] = array($languages[$i].'PerceptionDescription',
        'Description in '.$languages[$i].' for people with perception disabilities',
        'vrodos_asset3d_description_'.strtolower($languages[$i]).'_perception', 'string', '', true, true);
}

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
//All information about our meta box
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
    if($post->post_status == 'publish'){$hideshow = 'none';}else{$hideshow = 'block';}
    ?>
    <div id="vrodos_assets_box_wrapper" style="display:<?php echo $hideshow; ?>;">
        <span class="dashicons dashicons-lock">You must create the Asset in order to fill data</span>
    </div>
    <input type="hidden" name="vrodos_assets_databox_nonce" value="<?php echo wp_create_nonce(basename(__FILE__)); ?>" />
    <table class="form-table" id="vrodos-custom-fields-table">
        <tbody>
        
        <?php
        //Hide-Show custom fields purpose
        $categoryAsset = wp_get_post_terms($post->ID, 'vrodos_asset3d_cat');
        $categoryAssetSlug = $categoryAsset[0]->name;
        $doorhideshow = 'none';$mediahideshow = 'none';
        if ($categoryAssetSlug == 'Doors') {$doorhideshow = 'block';$mediahideshow = 'none';}
        if ($categoryAssetSlug != 'Doors') {$doorhideshow = 'none';$mediahideshow = 'block';}
        
        foreach ($vrodos_databox1['fields'] as $field) {
            if ($field['id']=='vrodos_asset3d_mtl'){
                ?>
                <tr>
                    <th style="width:20%"><label for="<?php echo esc_attr($field['id']); ?>"> <?php echo esc_html($field['name']); ?> </label></th>
                    <td>
                        <?php $meta_mtl_id = get_post_meta($post->ID, $field['id'], true); ?>

                        <input type="text" name="<?php echo esc_attr($field['id']); ?>"
                               id="<?php echo esc_attr($field['id']); ?>" value="<?php echo esc_attr($meta_mtl_id ? $meta_mtl_id : $field['std']); ?>" size="30" style="width:65%"/>

                        <input id="<?php echo esc_attr($field['id']); ?>_btn" type="button" value="Upload <?php echo esc_html($field['name']); ?>"/>


                        <br /><br />
                        Pathfile: <?php echo wp_get_attachment_url($meta_mtl_id); ?><br />
                        Preview mtl:<br />
                        <textarea id="vrodos_asset3d_mtl_preview" readonly style="width:100%;height:200px;"><?php
                            
                            if(!$meta_mtl_id){
                                echo "mtl is not defined";
                            }else{
                                readfile(wp_get_attachment_url($meta_mtl_id));
                            }
                            ?>
                            </textarea>
                    </td>
                </tr>
                
                
                
                
                <?php
            }elseif ($field['id'] == 'vrodos_asset3d_obj') {
                
                ?>
                <tr>
                    <th style="width:20%"><label for="<?php echo esc_attr($field['id']); ?>"> <?php echo esc_html($field['name']); ?> </label></th>
                    <td>
                        <?php
                        $valMaxUpload = intval(ini_get('upload_max_filesize'));
                        if ($valMaxUpload < 100){
                            echo "Files bigger than ".$valMaxUpload. " MB can not be uploaded <br />";
                            echo "Add to .htaccess the following two lines<br/>";
                            echo "php_value upload_max_filesize 256M <br />";
                            echo "php_value post_max_size 512M";
                        }
                        $meta_obj_id = get_post_meta($post->ID, $field['id'], true); ?>

                        <input type="text" name="<?php echo esc_attr($field['id']); ?>" id="<?php echo esc_attr($field['id']); ?>"
                               value="<?php echo esc_attr($meta_obj_id ? $meta_obj_id : $field['std']); ?>" size="30" style="width:65%"/>

                        <input id="<?php echo esc_attr($field['id']); ?>_btn" type="button" value="Upload <?php echo esc_html($field['name']); ?>"/>

                        <br /><br />
                        Pathfile: <?php echo wp_get_attachment_url($meta_obj_id); ?><br />
                        Preview obj:<br />
                        <textarea id="vrodos_asset3d_obj_preview" readonly style="width:100%;height:200px;"><?php
                            if(!$meta_obj_id){
                                echo "obj is not defined";
                            }else{
                                echo "obj text is too big to state here.";
                                //readfile(wp_get_attachment_url($meta_obj_id), "100");
                            }
                            ?>
                            </textarea>
                    </td>
                </tr>
                
                <?php
            }elseif ($field['id'] == 'vrodos_asset3d_fbx') {?>

                <tr>
                    <th style="width:20%"><label for="<?php echo esc_attr($field['id']); ?>"> <?php echo esc_html($field['name']); ?> </label></th>
                    <td>
                        <?php
                        $valMaxUpload = intval(ini_get('upload_max_filesize'));
                        if ($valMaxUpload < 100){
                            echo "Files bigger than ".$valMaxUpload. " MB can not be uploaded <br />";
                            echo "Add to .htaccess the following two lines<br/>";
                            echo "php_value upload_max_filesize 256M <br />";
                            echo "php_value post_max_size 512M";
                        }
                        $meta_fbx_id = get_post_meta($post->ID, $field['id'], true); ?>

                        <input type="text" name="<?php echo esc_attr($field['id']); ?>" id="<?php echo esc_attr($field['id']); ?>"
                               value="<?php echo esc_attr($meta_fbx_id ? $meta_fbx_id : $field['std']); ?>" size="30" style="width:65%"/>

                        <input id="<?php echo esc_attr($field['id']); ?>_btn" type="button" value="Upload <?php echo esc_html($field['name']); ?>"/>

                        <br /><br />
                        Pathfile: <?php echo wp_get_attachment_url($meta_fbx_id); ?><br />
                        Preview fbx:<br />
                        <textarea id="vrodos_asset3d_fbx_preview" readonly style="width:100%;height:200px;"><?php
                            if(!$meta_fbx_id){
                                echo "fbx is not defined";
                            }else{
                                echo "fbx text is too big to state here.";
                                //readfile(wp_get_attachment_url($meta_fbx_id), "100");
                            }
                            ?>
                            </textarea>
                    </td>
                </tr>
                
                
                <?php
            }elseif ($field['id'] == 'vrodos_asset3d_pdb') {?>

                <tr>
                    <th style="width:20%"><label for="<?php echo esc_attr($field['id']); ?>"> <?php echo esc_html($field['name']); ?> </label></th>
                    <td>
                        <?php
                        $valMaxUpload = intval(ini_get('upload_max_filesize'));
                        if ($valMaxUpload < 100){
                            echo "Files bigger than ".$valMaxUpload. " MB can not be uploaded <br />";
                            echo "Add to .htaccess the following two lines<br/>";
                            echo "php_value upload_max_filesize 256M <br />";
                            echo "php_value post_max_size 512M";
                        }
                        $meta_pdb_id = get_post_meta($post->ID, $field['id'], true); ?>

                        <input type="text" name="<?php echo esc_attr($field['id']); ?>" id="<?php echo esc_attr($field['id']); ?>"
                               value="<?php echo esc_attr($meta_pdb_id ? $meta_pdb_id : $field['std']); ?>" size="30" style="width:65%"/>

                        <input id="<?php echo esc_attr($field['id']); ?>_btn" type="button" value="Upload <?php echo esc_html($field['name']); ?>"/>

                        <br /><br />
                        Pathfile: <?php echo wp_get_attachment_url($meta_pdb_id); ?><br />
                        Preview Pdb:<br />
                        <textarea id="vrodos_asset3d_pdb_preview" readonly style="width:100%;height:200px;"><?php
                            if(!$meta_pdb_id){
                                echo "pdb is not defined";
                            }else{
                                echo "pdb text is too big to state here.";
                                //readfile(wp_get_attachment_url($meta_fbx_id), "100");
                            }
                            ?>
                                </textarea>
                    </td>
                </tr>
                
                
                <?php
            }elseif ($field['id'] == 'vrodos_asset3d_glb') {?>

                <tr>
                    <th style="width:20%"><label for="<?php echo esc_attr($field['id']); ?>"> <?php echo esc_html($field['name']); ?> </label></th>
                    <td>
                        <?php
                        $valMaxUpload = intval(ini_get('upload_max_filesize'));
                        if ($valMaxUpload < 100){
                            echo "Files bigger than ".$valMaxUpload. " MB can not be uploaded <br />";
                            echo "Add to .htaccess the following two lines<br/>";
                            echo "php_value upload_max_filesize 256M <br />";
                            echo "php_value post_max_size 512M";
                        }
                        $meta_glb_id = get_post_meta($post->ID, $field['id'], true); ?>

                        <input type="text" name="<?php echo esc_attr($field['id']); ?>" id="<?php echo esc_attr($field['id']); ?>"
                               value="<?php echo esc_attr($meta_glb_id ? $meta_glb_id : $field['std']); ?>" size="30" style="width:65%"/>

                        <input id="<?php echo esc_attr($field['id']); ?>_btn" type="button" value="Upload <?php echo esc_html($field['name']); ?>"/>

                        <br /><br />
                        Pathfile: <?php echo wp_get_attachment_url($meta_glb_id); ?><br />
                        Preview glb:<br />
                        <textarea id="vrodos_asset3d_glb_preview" readonly style="width:100%;height:200px;"><?php
                            if(!$meta_glb_id){
                                echo "glb is not defined";
                            }else{
                                echo "glb text is too big to state here.";
                                //readfile(wp_get_attachment_url($meta_fbx_id), "100");
                            }
                            ?>
                                </textarea>
                    </td>
                </tr>
                
                
                <?php
            }elseif ($field['id'] == 'vrodos_asset3d_audio') {?>

                <tr>
                    <th style="width:20%"><label for="<?php echo esc_attr($field['id']); ?>"> <?php echo esc_html($field['name']); ?> </label></th>
                    <td>
                        <?php
                        $valMaxUpload = intval(ini_get('upload_max_filesize'));
                        if ($valMaxUpload < 100){
                            echo "Files bigger than ".$valMaxUpload. " MB can not be uploaded <br />";
                            echo "Add to .htaccess the following two lines<br/>";
                            echo "php_value upload_max_filesize 256M <br />";
                            echo "php_value post_max_size 512M";
                        }
                        $meta_audio_id = get_post_meta($post->ID, $field['id'], true); ?>

                        <input type="text" name="<?php echo esc_attr($field['id']); ?>" id="<?php echo esc_attr($field['id']); ?>"
                               value="<?php echo esc_attr($meta_audio_id ? $meta_audio_id : $field['std']); ?>" size="30" style="width:65%"/>

                        <input id="<?php echo esc_attr($field['id']); ?>_btn" type="button" value="Upload <?php echo esc_html($field['name']); ?>"/>

                        <br /><br />
                        Pathfile: <?php echo wp_get_attachment_url($meta_audio_id); ?><br />
                        Preview Audio:<br />
                        <textarea id="vrodos_asset3d_audio_preview" readonly style="width:100%;height:200px;"><?php
                            if(!$meta_audio_id){
                                echo "Audio is not defined";
                            }else{
                                echo "Audio text is too big to state here.";
                                //readfile(wp_get_attachment_url($meta_audio_id), "100");
                            }
                            ?>
                            </textarea>
                    </td>
                </tr>
                
                
                
                <?php
            }elseif ($field['id'] == 'vrodos_asset3d_diffimage') {
                ?>
                <tr>
                    <th style="width:20%"><label for="<?php echo esc_attr($field['id']); ?>"> <?php echo esc_html($field['name']); ?> </label></th>
                    <td>
                        <?php $meta_diff_id = get_post_meta($post->ID, $field['id'], true); ?>
                        <input type="text" name="<?php echo esc_attr($field['id']); ?>" id="<?php echo esc_attr($field['id']); ?>"
                               value="<?php
                               echo esc_attr($meta_diff_id ? $meta_diff_id : $field['std']);
                               ?>" size="30" style="width:65%"/>

                        <input id="<?php echo esc_attr($field['id']); ?>_btn" type="button" value="Upload <?php echo esc_html($field['name']); ?>"/>
                        <br />
                        Pathfile: <?php echo wp_get_attachment_url($meta_diff_id); ?><br />
                        <img id="vrodos_asset3d_diffimage_preview" style="width:50%;height:auto" src="<?php echo wp_get_attachment_url($meta_diff_id); ?>"/>
                    </td>
                </tr>
                <?php
            }elseif ($field['id'] == 'vrodos_asset3d_screenimage') {
                ?>
                <tr>
                    <th style="width:20%"><label for="<?php echo esc_attr($field['id']); ?>"> <?php echo esc_html($field['name']); ?> </label></th>
                    <td>
                        <?php $meta_scr_id = get_post_meta($post->ID, $field['id'], true); ?>

                        <input type="text" name="<?php echo esc_attr($field['id']); ?>" id="<?php echo esc_attr($field['id']); ?>"
                               value="<?php echo esc_attr($meta_scr_id ? $meta_scr_id : $field['std']); ?>" size="30" style="width:65%"/>

                        <input id="<?php echo esc_attr($field['id']); ?>_btn" type="button" value="Upload <?php echo esc_html($field['name']); ?>"/>
                        <br />
                        Pathfile: <?php echo wp_get_attachment_url($meta_scr_id); ?><br />
                        <img id="vrodos_asset3d_screenimage_preview" style="width:50%;height:auto" src="<?php echo wp_get_attachment_url($meta_scr_id); ?>"/>
                    </td>
                </tr>
                <?php
            }elseif ($field['id'] == 'vrodos_asset3d_next_scene') {
                ?>
                <tr>
                    <th style="width:20%"><label for="<?php echo esc_attr($field['id']); ?>"> <?php echo esc_html($field['name']); ?> </label></th>
                    <td id="vrodos_asset3d_next_scene_field" style="display:<?php echo $doorhideshow; ?>;margin-bottom:0;">
                        <?php $meta = get_post_meta($post->ID, $field['id'], true); ?>
                        <input type="text" name="<?php echo esc_attr($field['id']); ?>" id="<?php echo esc_attr($field['id']); ?>" value="<?php echo esc_attr($meta ? $meta : $field['std']); ?>" size="30" style="width:65%"/>
                    </td>
                </tr>
                <?php
            }elseif ($field['id'] == 'vrodos_asset3d_image1') {
                ?>
                <tr>
                    <th style="width:20%"><label for="<?php echo esc_attr($field['id']); ?>"> <?php echo esc_html($field['name']); ?> </label></th>
                    <td>
                        <?php $meta_image1_id = get_post_meta($post->ID, $field['id'], true); ?>
                        <input type="text" name="<?php echo esc_attr($field['id']); ?>" id="<?php echo esc_attr($field['id']); ?>" value="<?php echo esc_attr($meta_image1_id ? $meta_image1_id : $field['std']); ?>" size="30" style="width:65%;float:left;display:<?php echo $mediahideshow; ?>;"/>
                        <input id="<?php echo esc_attr($field['id']); ?>_btn" type="button" value="Upload <?php echo esc_html($field['name']); ?>" style="display:<?php echo $mediahideshow; ?>;" />

                        Pathfile: <?php echo wp_get_attachment_url($meta_image1_id); ?><br />
                        <img id="vrodos_asset3d_image1_preview" style="width:50%;height:auto;display:<?php echo $mediahideshow; ?>;"
                             src="<?php echo wp_get_attachment_url($meta_image1_id); ?>"/>
                    </td>
                </tr>
                <?php
            }elseif ($field['id'] == 'vrodos_asset3d_video') {
                ?>
                <tr>
                    <th style="width:20%"><label for="<?php echo esc_attr($field['id']); ?>"> <?php echo esc_html($field['name']); ?> </label></th>
                    <td>
                        <?php $meta = get_post_meta($post->ID, $field['id'], true); ?>
                        <input type="text" name="<?php echo esc_attr($field['id']); ?>" id="<?php echo esc_attr($field['id']); ?>" value="<?php echo esc_attr($meta ? $meta : $field['std']); ?>" size="30" style="width:65%;float:left;display:<?php echo $mediahideshow; ?>;"/>
                        <input id="<?php echo esc_attr($field['id']); ?>_btn" type="button" value="Upload <?php echo esc_html($field['name']); ?>"  style="display:<?php echo $mediahideshow; ?>;" />
                        <?php //TODO preview of the video ?>
                    </td>
                </tr>
                <?php
            }elseif (in_array($field['id'],[
                'vrodos_asset3d_description_kids','vrodos_asset3d_description_experts','vrodos_asset3d_description_perception',  // English
                'vrodos_asset3d_title_greek','vrodos_asset3d_description_greek','vrodos_asset3d_description_greek_kids','vrodos_asset3d_description_greek_experts', 'vrodos_asset3d_description_greek_perception',   // Greek
                'vrodos_asset3d_title_spanish','vrodos_asset3d_description_spanish','vrodos_asset3d_description_spanish_kids','vrodos_asset3d_description_spanish_experts','vrodos_asset3d_description_spanish_perception', // Spanish
                'vrodos_asset3d_title_french','vrodos_asset3d_description_french','vrodos_asset3d_description_french_kids','vrodos_asset3d_description_french_experts','vrodos_asset3d_description_french_perception', // French
                'vrodos_asset3d_title_german', 'vrodos_asset3d_description_german','vrodos_asset3d_description_german_kids','vrodos_asset3d_description_german_experts','vrodos_asset3d_description_german_perception', // German
                'vrodos_asset3d_title_russian','vrodos_asset3d_description_russian','vrodos_asset3d_description_russian_kids','vrodos_asset3d_description_russian_experts','vrodos_asset3d_description_russian_perception' // Russion
            ]  )) {
                ?>
                <tr>
                    <th style="width:20%"><label for="<?php echo esc_attr($field['id']); ?>"> <?php echo esc_html($field['name']); ?> </label></th>
                    <td id="<?php echo $field['id'] ?>" style="margin-bottom:0;">
                        <?php $meta = get_post_meta($post->ID, $field['id'], true); ?>
                        <textarea name="<?php echo esc_attr($field['id']); ?>" id="<?php echo esc_attr($field['id']); ?>"
                                  value="" style="width:100%;height:auto"><?php echo esc_attr($meta ? $meta : $field['std']); ?></textarea>
                    </td>
                </tr>
                <?php
            }elseif (in_array($field['id'],['vrodos_asset3d_fonts'])) {
                ?>
                <tr>
                    <th style="width:20%"><label for="<?php echo esc_attr($field['id']); ?>"> <?php echo esc_html($field['name']); ?> </label></th>
                    <td id="<?php echo $field['id'] ?>" style="margin-bottom:0;">
                        <?php $meta = get_post_meta($post->ID, $field['id'], true); ?>
                        <input type="text" name="<?php echo esc_attr($field['id']); ?>" id="<?php echo esc_attr($field['id']); ?>" value="<?php echo esc_attr($meta ? $meta : $field['std']); ?>" size="30" style="width:65%"/>
                    </td>
                </tr>
                <?php
            }elseif (in_array($field['id'],['vrodos_asset3d_back3dcolor'])) {
                ?>
                <tr>
                    <th style="width:20%"><label for="<?php echo esc_attr($field['id']); ?>"> <?php echo esc_html($field['name']); ?> </label></th>
                    <td id="<?php echo $field['id'] ?>" style="margin-bottom:0;">
                        <?php $meta = get_post_meta($post->ID, $field['id'], true); ?>
                        <input type="text" name="<?php echo esc_attr($field['id']); ?>" id="<?php echo esc_attr($field['id']); ?>" value="<?php echo esc_attr($meta ? $meta : $field['std']); ?>" size="30" style="width:65%"/>
                    </td>
                </tr>
                <?php
            }
        }
        ?>
        </tbody>
    </table>

    <script>
        function vrodos_hidecfields_asset3d() {
            var e = document.getElementById("vrodos-select-asset3d-cat-dropdown");
            var value = e.options[e.selectedIndex].value;
            var text = e.options[e.selectedIndex].text;

            if(text == 'Doors'){
                //SHOW Next Scene Custom field - Hide others
                document.getElementById('vrodos_asset3d_next_scene_field').style.display = 'block';
                document.getElementById('vrodos_asset3d_image1').style.display = 'none';
                document.getElementById('vrodos_asset3d_image1_btn').style.display = 'none';
                document.getElementById('vrodos_asset3d_image1_preview').style.display = 'none';
                document.getElementById('vrodos_asset3d_video').style.display = 'none';
                document.getElementById('vrodos_asset3d_video_btn').style.display = 'none';
                document.getElementById('vrodos-assets-infobox').style.display = 'none';
                document.getElementById('vrodos_asset3d_description_greek').style.display = 'none';
            }else{
                var link = document.getElementById('vrodos_asset3d_next_scene_field');
                link.style.display = 'none';
                if(text == 'Points of Interest (Video)'){
                    document.getElementById('vrodos_asset3d_image1').style.display = 'none';
                    document.getElementById('vrodos_asset3d_image1_btn').style.display = 'none';
                    document.getElementById('vrodos_asset3d_image1_preview').style.display = 'none';
                    document.getElementById('vrodos_asset3d_video').style.display = 'block';
                    document.getElementById('vrodos_asset3d_video_btn').style.display = 'block';
                    document.getElementById('vrodos-assets-infobox').style.display = 'none';
                    document.getElementById('vrodos_asset3d_description_greek').style.display = 'block';
                }else if(text == 'Points of Interest (Image-Text)'){
                    document.getElementById('vrodos_asset3d_image1').style.display = 'block';
                    document.getElementById('vrodos_asset3d_image1_btn').style.display = 'block';
                    document.getElementById('vrodos_asset3d_image1_preview').style.display = 'block';
                    document.getElementById('vrodos_asset3d_video').style.display = 'none';
                    document.getElementById('vrodos_asset3d_video_btn').style.display = 'none';
                    document.getElementById('vrodos-assets-infobox').style.display = 'block';
                    document.getElementById('vrodos_asset3d_description_greek').style.display = 'block';
                }else if(text == 'Points of Interest'){
                    document.getElementById('vrodos_asset3d_image1').style.display = 'block';
                    document.getElementById('vrodos_asset3d_image1_btn').style.display = 'block';
                    document.getElementById('vrodos_asset3d_image1_preview').style.display = 'block';
                    document.getElementById('vrodos_asset3d_video').style.display = 'block';
                    document.getElementById('vrodos_asset3d_video_btn').style.display = 'block';
                    document.getElementById('vrodos-assets-infobox').style.display = 'none';
                    document.getElementById('vrodos_asset3d_description_greek').style.display = 'block';
                }else{
                    document.getElementById('vrodos_asset3d_image1').style.display = 'none';
                    document.getElementById('vrodos_asset3d_image1_btn').style.display = 'none';
                    document.getElementById('vrodos_asset3d_image1_preview').style.display = 'none';
                    document.getElementById('vrodos_asset3d_video').style.display = 'block';
                    document.getElementById('vrodos_asset3d_video_btn').style.display = 'block';
                    document.getElementById('vrodos-assets-infobox').style.display = 'none';
                    document.getElementById('vrodos_asset3d_description_greek').style.display = 'none';
                }
            }
        }

        jQuery(document).ready(function ($) {

            // Uploading files
            var file_frame;
            var wp_media_post_id = wp.media.model.settings.post.id; // Store the old id
            var set_to_post_id = <?php echo $post->ID; ?>; // Set this

            jQuery('#vrodos_asset3d_mtl_btn').on('click', function( event ){

                event.preventDefault();

                wp.media.model.settings.post.id = set_to_post_id;

                // Create the media frame.
                file_frame = wp.media.frames.file_frame = wp.media({
                    title: 'Select MTL file to upload',
                    button: {
                        text: 'Use this file',
                    },
                    multiple: false	// Set to true to allow multiple files to be selected
                });

                // When an image is selected, run a callback.
                file_frame.on( 'select', function(html) {
                    // We set multiple to false so only get one image from the uploader
                    attachment = file_frame.state().get('selection').first().toJSON();

                    // Do something with attachment.id and/or attachment.url here
                    jQuery('#vrodos_asset3d_mtl').val(attachment.id);
                    //jQuery('#vrodos_asset3d_mtl_preview').

                    // Restore the main post ID
                    wp.media.model.settings.post.id = wp_media_post_id;
                });

                // Finally, open the modal
                file_frame.open();
            });

            jQuery('#vrodos_asset3d_obj_btn').on('click', function( event ){

                event.preventDefault();

                // Set the wp.media post id so the uploader grabs the ID we want when initialised
                wp.media.model.settings.post.id = set_to_post_id;

                // Create the media frame.
                file_frame = wp.media.frames.file_frame = wp.media({
                    title: 'Select OBJ file to upload',
                    button: {
                        text: 'Use this file',
                    },
                    multiple: false	// Set to true to allow multiple files to be selected
                });

                // When an image is selected, run a callback.
                file_frame.on( 'select', function(html) {
                    // We set multiple to false so only get one image from the uploader
                    attachment = file_frame.state().get('selection').first().toJSON();

                    // Do something with attachment.id and/or attachment.url here
                    jQuery('#vrodos_asset3d_obj').val(attachment.id);
                    //jQuery('#vrodos_asset3d_mtl_preview').

                    // Restore the main post ID
                    wp.media.model.settings.post.id = wp_media_post_id;
                });

                // Finally, open the modal
                file_frame.open();
            });

            jQuery('#vrodos_asset3d_fbx_btn').on('click', function( event ){

                event.preventDefault();

                // Set the wp.media post id so the uploader grabs the ID we want when initialised
                wp.media.model.settings.post.id = set_to_post_id;

                // Create the media frame.
                file_frame = wp.media.frames.file_frame = wp.media({
                    title: 'Select FBX file to upload',
                    button: {
                        text: 'Use this file',
                    },
                    multiple: false	// Set to true to allow multiple files to be selected
                });

                // When an image is selected, run a callback.
                file_frame.on( 'select', function(html) {
                    // We set multiple to false so only get one image from the uploader
                    attachment = file_frame.state().get('selection').first().toJSON();

                    // Do something with attachment.id and/or attachment.url here
                    jQuery('#vrodos_asset3d_fbx').val(attachment.id);


                    // Restore the main post ID
                    wp.media.model.settings.post.id = wp_media_post_id;
                });

                // Finally, open the modal
                file_frame.open();
            });


            jQuery('#vrodos_asset3d_diffimage_btn').on('click', function( event ){

                event.preventDefault();

                // Set the wp.media post id so the uploader grabs the ID we want when initialised
                wp.media.model.settings.post.id = set_to_post_id;

                // Create the media frame.
                file_frame = wp.media.frames.file_frame = wp.media({
                    title: 'Select photo to upload',
                    button: {
                        text: 'Use this photo',
                    },
                    multiple: false	// Set to true to allow multiple files to be selected
                });

                // When an image is selected, run a callback.
                file_frame.on( 'select', function(html) {
                    // We set multiple to false so only get one image from the uploader
                    attachment = file_frame.state().get('selection').first().toJSON();

                    // Do something with attachment.id and/or attachment.url here
                    jQuery('#vrodos_asset3d_diffimage').val(attachment.id);
                    jQuery('#vrodos_asset3d_diffimage_preview').attr( 'src', attachment.url );

                    // Restore the main post ID
                    wp.media.model.settings.post.id = wp_media_post_id;
                });

                // Finally, open the modal
                file_frame.open();
            });

            jQuery('#vrodos_asset3d_screenimage_btn').on('click', function( event ){

                event.preventDefault();

                // Set the wp.media post id so the uploader grabs the ID we want when initialised
                wp.media.model.settings.post.id = set_to_post_id;

                // Create the media frame.
                file_frame = wp.media.frames.file_frame = wp.media({
                    title: 'Select photo to upload',
                    button: {
                        text: 'Use this photo',
                    },
                    multiple: false	// Set to true to allow multiple files to be selected
                });

                // When an image is selected, run a callback.
                file_frame.on( 'select', function(html) {
                    // We set multiple to false so only get one image from the uploader
                    attachment = file_frame.state().get('selection').first().toJSON();

                    // Do something with attachment.id and/or attachment.url here
                    jQuery('#vrodos_asset3d_screenimage').val(attachment.id);
                    jQuery('#vrodos_asset3d_screenimage_preview').attr( 'src', attachment.url );

                    // Restore the main post ID
                    wp.media.model.settings.post.id = wp_media_post_id;
                });

                // Finally, open the modal
                file_frame.open();
            });

            jQuery('#vrodos_asset3d_image1_btn').on('click', function( event ){

                event.preventDefault();

                // Set the wp.media post id so the uploader grabs the ID we want when initialised
                wp.media.model.settings.post.id = set_to_post_id;

                // Create the media frame.
                file_frame = wp.media.frames.file_frame = wp.media({
                    title: 'Select photo to upload',
                    button: {
                        text: 'Use this photo',
                    },
                    multiple: false	// Set to true to allow multiple files to be selected
                });

                // When an image is selected, run a callback.
                file_frame.on( 'select', function(html) {
                    // We set multiple to false so only get one image from the uploader
                    attachment = file_frame.state().get('selection').first().toJSON();

                    // Do something with attachment.id and/or attachment.url here
                    jQuery('#vrodos_asset3d_image1').val(attachment.id);
                    jQuery('#vrodos_asset3d_image1_preview').attr( 'src', attachment.url );

                    // Restore the main post ID
                    wp.media.model.settings.post.id = wp_media_post_id;
                });

                // Finally, open the modal
                file_frame.open();
            });

            jQuery('#vrodos_asset3d_video_btn').on('click', function( event ){

                event.preventDefault();

                // Set the wp.media post id so the uploader grabs the ID we want when initialised
                wp.media.model.settings.post.id = set_to_post_id;

                // Create the media frame.
                file_frame = wp.media.frames.file_frame = wp.media({
                    title: 'Select video to upload',
                    button: {
                        text: 'Use this video',
                    },
                    multiple: false	// Set to true to allow multiple files to be selected
                });

                // When an image is selected, run a callback.
                file_frame.on( 'select', function(html) {
                    // We set multiple to false so only get one image from the uploader
                    attachment = file_frame.state().get('selection').first().toJSON();

                    // Do something with attachment.id and/or attachment.url here
                    jQuery('#vrodos_asset3d_video').val(attachment.id);
                    //jQuery('#vrodos_asset3d_image3_preview').attr( 'src', attachment.url );

                    // Restore the main post ID
                    wp.media.model.settings.post.id = wp_media_post_id;
                });

                // Finally, open the modal
                file_frame.open();
            });


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
        $new = $_POST[$field['id']];
        
        update_post_meta($post_id, $field['id'], $new);
        
        if ($new && $new != $old) {
            update_post_meta($post_id, $field['id'], $new);
        } elseif ('' == $new && $old) {
            delete_post_meta($post_id, $field['id'], $old);
        }
        
    }
}





// ----------------- Obsolete ------------------------------
// Functions for segmentation and classfication of 3D models
function vrodos_assets_create_right_metaboxes() {
    
    // These function should be passed to front-end

//    add_meta_box( 'autofnc-vrodos_asset3d_fetch_description','Fetch description','vrodos_assets_fetch_description_box_content', 'vrodos_asset3d', 'side' , 'low');
//	add_meta_box( 'autofnc-vrodos_asset3d_fetch_image','Fetch image','vrodos_assets_fetch_image_box_content', 'vrodos_asset3d', 'side' , 'low');
//	add_meta_box( 'autofnc-vrodos_asset3d_fetch_video','Fetch video','vrodos_assets_fetch_video_box_content', 'vrodos_asset3d', 'side' , 'low');
//	add_meta_box( 'autofnc-vrodos_asset3d_segment_obj','Segment obj','vrodos_assets_segment_obj_box_content', 'vrodos_asset3d', 'side' , 'low');
//	add_meta_box( 'autofnc-vrodos_asset3d_classify_obj','Classify obj','vrodos_assets_classify_obj_box_content', 'vrodos_asset3d', 'side' , 'low');
}

function vrodos_assets_fetch_description_box_content($post){
    
    echo '<div id="vrodos_fetchDescription_bt" class="vrodos_fetchContentButton"
     onclick="vrodos_fetchDescriptionAjax()">Fetch Description</div>';
    ?>

    <br /><br />

    Source:<br />
    <select name="fetch_source" id="fetch_source">
        <option value="Wikipedia">Wikipedia</option>
        <option value="Europeana">Europeana</option>
    </select>

    <br />
    <br />

    Language<br />
    <select name="fetch_lang" id="fetch_lang">
        <option value="en">English</option>
        <option value="el">Greek</option>
        <option value="fr">French</option>
        <option value="de">German</option>
    </select>

    <br />
    <br />
    Terms to search:<input type="text" size="30" name="vrodos_titles_search" id="vrodos_titles_search" value="<?php echo $post->post_title?>">

    <br />
    <br />

    Full text:<input type="checkbox" name="vrodos_fulltext_chkbox" id="vrodos_fulltext_chkbox" value="">
    
    
    <?php
}

function vrodos_assets_fetch_image_box_content($post){
    
    echo '<div id="vrodos_fetchImage_bt" class="vrodos_fetchContentButton" onclick="vrodos_fetchImageAjax()">Fetch Image</div>';
    ?>

    <br /><br />

    Source:<br />
    <select name="fetch_source_image" id="fetch_source_image">
        <option value="Wikipedia">Wikipedia</option>
        <option value="Europeana">Europeana</option>
    </select>

    <br />
    <br />

    Language<br />
    <select name="fetch_lang_image" id="fetch_lang_image">
        <option value="en">English</option>
        <option value="el">Greek</option>
        <option value="fr">French</option>
        <option value="de">German</option>
    </select>

    <br />
    <br />
    Terms to search:<input type="text" size="30" name="vrodos_titles_image_search_image" id="vrodos_titles_image_search_image" value="<?php echo $post->post_title?>">

    <br />
    <br />



    <div id="image_find_results">
        <?php
        
        echo '<div id="display_img_res" class="imageresbin" style="display:none">';
        for ($i=0;$i<10;$i++) {
            echo '<img id = "image_res_'.$i.'" class="image_fetch_img" />';
            echo '<div id = "image_res_'.$i.'_url" class="image_fetch_div_url" style="margin-bottom:5px"></div >';
            echo '<a href="" id = "image_res_'.$i.'_title" class="img_res_title_f" target = "_blank" style="margin-bottom:10px"></a >';
        }
        
        echo '</div>';
        ?>
    </div>
    
    
    <?php
}

function vrodos_assets_fetch_video_box_content($post){
    
    echo '<div id="vrodos_fetchVideo_bt" class="vrodos_fetchContentButton" onclick="vrodos_fetchVideoAjax()">Fetch Video</div>';
    ?>

    <br /><br />

    Source:<br />
    <select name="fetch_source_video" id="fetch_source_video">
        <option value="Wikipedia">Wikipedia</option>
        <option value="Europeana">Europeana</option>
    </select>

    <br />
    <br />

    Language<br />
    <select name="fetch_lang_video" id="fetch_lang_video">
        <option value="en">English</option>
        <option value="el">Greek</option>
        <option value="fr">French</option>
        <option value="de">German</option>
    </select>

    <br />
    <br />
    Terms to search:<input type="text" size="30" name="vrodos_titles_video_search_video" id="vrodos_titles_video_search_video" value="<?php echo $post->post_title?>">
    Wikipedia example:<br /> "Sarmientosaurus 3D skull"
    <br />
    <br />

    <div id="video_find_results">

        <video id="videoplayer1" width="240" height="160" autoplay controls>
            <source id="video_res_1" src="" type="video/mp4">
            <source id="video_res_1" src="" type="video/ogg">
            <source id="video_res_1" src="" type="video/ogv">
        </video>
        <div id="video_res_1_url" class="video_fetch_div_url"></div><br />
        <div id="video_res_1_title" class="video_res_title_f"></div><br />

    </div>
    
    <?php
}

function vrodos_assets_segment_obj_box_content($post){
    
    ?>

    <div id="vrodos_segmentButton" class="vrodos_fetchContentButton"
         onclick="vrodos_segmentObjAjax(document.getElementById('vrodos_titles_segment_obj_iter').value,
                                         document.getElementById('vrodos_titles_segment_obj_min_dist').value,
                                         document.getElementById('vrodos_titles_segment_obj_max_dist').value,
                                         document.getElementById('vrodos_titles_segment_obj_min_points').value,
                                         document.getElementById('vrodos_titles_segment_obj_max_points').value
                                            )">Segment obj</div>;

    <br />
    Parameters<br />
    <table>
        <tbody>
        <tr><td>Algorithm iterations</td><td><input type="text" size="5" name="vrodos_titles_segment_obj_iter" id="vrodos_titles_segment_obj_iter" value="100"></td></tr>
        <tr><td>Min distance</td><td><input type="text" size="5" name="vrodos_titles_segment_obj_min_dist" id="vrodos_titles_segment_obj_min_dist" value="0.01"></td></tr>
        <tr><td>Max distance</td><td><input type="text" size="5" name="vrodos_titles_segment_obj_max_dist" id="vrodos_titles_segment_obj_max_dist" value="0.2"></td></tr>
        <tr><td>Min points</td><td><input type="text" size="5" name="vrodos_titles_segment_obj_min_points" id="vrodos_titles_segment_obj_min_points" value="100"></td></tr>
        <tr><td>Max points</td><td><input type="text" size="5" name="vrodos_titles_segment_obj_max_points" id="vrodos_titles_segment_obj_max_points" value="25000"></td></tr>
        </tbody>
    </table>

    <br />
    <div id="vrodos-segmentation-report" name="vrodos-segmentation-report">Status</div><br />
    <div id="vrodos-segmentation-status" name="vrodos-segmentation-status">Report</div><br />

    <br />
    Results<br />
    <div id="vrodos-segmentation-results" name="vrodos-segmentation-results">
        <a href="" id="vrodos-segmentation-res1"></a>
        <a href="" id="vrodos-segmentation-res2"></a>
        <a href="" id="vrodos-segmentation-res3"></a>
        <a href="" id="vrodos-segmentation-res4"></a>
        <a href="" id="vrodos-segmentation-res5"></a>
        <a href="" id="vrodos-segmentation-res6"></a>
    </div>

    <br />
    <div id="vrodos-segmentation-log" name="vrodos-segmentation-log">Log file</div>
    
    <?php
}

function vrodos_assets_classify_obj_box_content($post){
    
    echo '<div id="vrodos_classifyObj_bt" class="vrodos_fetchContentButton"
                                onclick="vrodos_classifyObjAjax()">Classify obj</div>';
    ?>

    <br />
    Results<br />
    <table>
        <tbody>
        <tr>
            <td>#</td>
            <td>Tag</td>
            <td>Probability</td>
        </tr>
        <tr>
            <td>1</td>
            <td><input type="text" size="5" name="vrodos_tag1_classification_obj"
                       id="vrodos_tag1_classification_obj" value=""></td>
            <td><input type="text" size="5" name="vrodos_prob1_classification_obj"
                       id="vrodos_prob1_classification_obj" value=""></td>
            </td>
        </tr>
        <tr>
            <td>2</td>
            <td><input type="text" size="5" name="vrodos_tag2_classification_obj"
                       id="vrodos_tag2_classification_obj" value=""></td>
            <td><input type="text" size="5" name="vrodos_prob2_classification_obj"
                       id="vrodos_prob2_classification_obj" value=""></td>
            </td>
        </tr>
        <tr>
            <td>3</td>
            <td><input type="text" size="5" name="vrodos_tag3_classification_obj"
                       id="vrodos_tag3_classification_obj" value=""></td>
            <td><input type="text" size="5" name="vrodos_prob3_classification_obj"
                       id="vrodos_prob3_classification_obj" value=""></td>
            </td>
        </tr>
        </tbody>
    </table>

    <br />
    <div id="vrodos-classification-report" name="vrodos-classification-report">Status</div><br />
    <div id="vrodos-classification-status" name="vrodos-classification-status">Report</div><br />
    <div id="vrodos-segmentation-log" name="vrodos-segmentation-log">Log file</div>
    
    <?php
}
