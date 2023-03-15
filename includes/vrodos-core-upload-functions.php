<?php
// All functions related to uploading files

// Get the directory for media uploading of a scene or an asset
function vrodos_upload_dir_forScenesOrAssets( $args ) {
    
    if (!isset( $_REQUEST['post_id'] ))
        return $args;
    
    // Get the current post_id
    $post_id =  $_REQUEST['post_id'];
    $args['path'] = str_replace($args['subdir'], '', $args['path']);
    $args['url'] = str_replace($args['subdir'], '', $args['url']);
    
    $newdir = get_post_type($post_id) === 'vrodos_scene' ?
         '/' . get_the_terms($post_id, 'vrodos_scene_pgame')[0]->slug . '/Scenes'  // 'vrodos_scene'
      :  '/' . get_post_meta($post_id, 'vrodos_asset3d_pathData', true) . '/Models'; // 'vrodos_asset3d'
    
    $args['subdir'] = $newdir;
    $args['path'] .= $newdir;
    $args['url'] .= $newdir;
    
    return $args;
}




// Disable all auto created thumbnails for Assets3D
function vrodos_disable_imgthumbs_assets( $image_sizes ){
    
    // extra sizes
    $slider_image_sizes = array(  );
    // for ex: $slider_image_sizes = array( 'thumbnail', 'medium' );
    
    // instead of unset sizes, return your custom size (nothing)
    if( isset($_REQUEST['post_id']) && 'vrodos_asset3d' === get_post_type( $_REQUEST['post_id'] ) )
        return $slider_image_sizes;
    
    return $image_sizes;
}




// Overwrite attachments
function vrodos_overwrite_uploads( $name ){
    
    // Parent id
    $post_parent_id = isset($_REQUEST['post_id']) ? (int)$_REQUEST['post_id'] : 0;

    // Attachment posts that have as file similar to $name
    $attachments_to_remove = get_posts(
            array(
                'numberposts'   => -1,
                'post_type'     => 'attachment',
                'meta_query' => array(
                    array(
                        'key' => '_wp_attached_file',
                        'value' => $name,
                        'compare' => 'LIKE'
                    )
                )
            )
    );
    
    // Delete attachments if they have the same parent
    foreach( $attachments_to_remove as $attachment ){
        
        if($attachment->post_parent == $post_parent_id) {
        
            // Permanently delete attachment
            wp_delete_attachment($attachment->ID, true);
        
        }
    }
    
    return $name;
}




function vrodos_remove_allthumbs_sizes( $sizes, $metadata ) {
    return [];
}


// Change directory for images and videos to uploads/Models
function vrodos_upload_img_vid_aud_directory( $dir ) {
    return array(
                'path'   => $dir['basedir'] . '/Models',
                'url'    => $dir['baseurl'] . '/Models',
                'subdir' => '/Models',
                ) + $dir;
}


// Change general upload directory to Models
function vrodos_upload_filter( $args  ) {
    
    $newdir =  '/Models';
    
    $args['path']    = str_replace( $args['subdir'], '', $args['path'] ); //remove default subdir
    $args['url']     = str_replace( $args['subdir'], '', $args['url'] );
    $args['subdir']  = $newdir;
    $args['path']   .= $newdir;
    $args['url']    .= $newdir;
    
    return $args;
}


// Upload image(s) or video or audio for a certain post_id (asset or scene3D)
function vrodos_upload_img_vid_aud($file, $parent_post_id) {

    // For Images (Sprites in Unity)
    if($file['type'] === 'image/jpeg' || $file['type'] === 'image/png') {
        if (strpos($file['name'], 'sprite') == false) {
    
            $hashed_prefix = md5($parent_post_id . microtime());
            
            $file['name'] = str_replace(".jpg", $hashed_prefix."_sprite.jpg", $file['name']);
            $file['name'] = str_replace(".png", $hashed_prefix."_sprite.png", $file['name']);
        }
    }

    // Remove thumbs generating all sizes
    add_filter( 'intermediate_image_sizes_advanced', 'vrodos_remove_allthumbs_sizes', 10, 2 );
    
    // We need admin power
    require_once( ABSPATH . 'wp-admin/includes/admin.php' );

    // Add all models to "uploads/Models/" folder
    add_filter( 'upload_dir', 'vrodos_upload_img_vid_aud_directory' );

    // Upload
    $file_return = wp_handle_upload( $file, array('test_form' => false ) );
    
    // Remove upload filter to "Models" folder
    remove_filter( 'upload_dir', 'vrodos_upload_img_vid_aud_directory' );
    
    // if file has been uploaded succesfully
    if( !isset( $file_return['error'] ) && !isset( $file_return['upload_error_handler'] ) ) {
    
        // Id of attachment post
        $attachment_id = vrodos_insert_attachment_post($file_return, $parent_post_id );
        
        // Remove filter for not generating various thumbnails sizes
        remove_filter( 'intermediate_image_sizes_advanced', 'vrodos_remove_allthumbs_sizes', 10, 2 );
        
        // Return the attachment id
        if( 0 < intval( $attachment_id, 10 ) ) {
            return $attachment_id;
        }
    }
    
    return false;
}


// Upload images for only for 2D scenes
function vrodos_upload_img($parent_post_id, $file = array()) {
    
    // Require admin power
    require_once( ABSPATH . 'wp-admin/includes/admin.php' );
    
    // Upload file
    $file_return = wp_handle_upload( $file, array('test_form' => false ) );
    
    if( !isset( $file_return['error'] ) && !isset( $file_return['upload_error_handler'] ) ) {
        
        // Id of attachment post
        $attachment_id = vrodos_insert_attachment_post($file_return, $parent_post_id );
        
        if( 0 < intval( $attachment_id, 10 ) ) {
            return $attachment_id;
        }
        
    }
    return false;
}

// Insert attachment post
function vrodos_insert_attachment_post($file_return, $parent_post_id ){
    
    // Get the filename
    $filename = $file_return['file'];
    
    // Create an attachement post for main post (scene or asset)
    $attachment = array(
        'post_mime_type' => $file_return['type'],
        'post_title' => preg_replace( '/\.[^.]+$/', '', basename( $filename ) ),
        'post_content' => '',
        'post_status' => 'inherit',
        'guid' => $file_return['url']
    );
    
    // Insert the attachment post to database
    $attachment_id = wp_insert_attachment( $attachment, $file_return['url'], $parent_post_id );
    
    // Image library needed to create thumbnail
    require_once(ABSPATH . 'wp-admin/includes/image.php');
    
    // Generate thumbnail for media library
    $attachment_data = wp_generate_attachment_metadata( $attachment_id, $filename );
    
    // Update attachment post with the thumbnail
    wp_update_attachment_metadata( $attachment_id, $attachment_data );
    
    return $attachment_id;
}


// Immitation of $_FILE through $_POST . This works only for jpgs and pngs
function vrodos_upload_scene_screenshot($imagefile, $imgTitle, $parent_post_id, $type) {
    
    $DS = DIRECTORY_SEPARATOR;
    
    // DELETE EXISTING FILE: See  if has already a thumbnail and delete the file in the filesystem
    $thumbnails_ids = get_post_meta($parent_post_id,'_thumbnail_id');
    
    if (count($thumbnails_ids) > 0) {
    
        // Remove previous file from file system
        $prevfMeta = get_post_meta($thumbnails_ids[0], '_wp_attachment_metadata', false);
        
        if (file_exists($prevfMeta[0]['file'])) {
            unlink($prevfMeta[0]['file']);
        }
    }

    // UPLOAD NEW FILE:
    
    // Generate a hashed filename in order to avoid overwrites for the same names
    $hashed_filename = md5($imgTitle . microtime()) . '_' . $imgTitle . '.' . $type;

    // Remove all sizes of thumbnails creation procedure
    add_filter('intermediate_image_sizes_advanced', 'vrodos_remove_allthumbs_sizes', 10, 2);
    
    // Get admin power
    require_once(ABSPATH . 'wp-admin/includes/admin.php');

    // Get upload directory and do some sanitization
    $upload_path = str_replace('/', $DS, wp_upload_dir()['basedir']) . $DS .'Models'.$DS;
    
    
    // Write file string to a file in server
    $image_upload = file_put_contents($upload_path . $hashed_filename,
        base64_decode(substr($imagefile, strpos($imagefile, ",") + 1)));
    
    // HANDLE UPLOADED FILE
    if (!function_exists('wp_handle_sideload')) {
        require_once(ABSPATH . 'wp-admin/includes/file.php');
    }

    // Without that I'm getting a debug error!?
    if (!function_exists('wp_get_current_user')) {
        require_once(ABSPATH . 'wp-includes/pluggable.php');
    }
    
    $file = array(
        'name' => $hashed_filename,
        'type' => 'image/png',
        'tmp_name' => $upload_path . $hashed_filename,
        'error' => 0,
        'size' => filesize($upload_path . $hashed_filename),
    );
    
    // Change directory to models
    add_filter('upload_dir', 'vrodos_upload_filter');
    
    // upload file to server
    // @new use $file instead of $image_upload
    $file_return = wp_handle_sideload($file, array('test_form' => false));
    
    // Remove filter for /Models folder upload
    remove_filter('upload_dir', 'vrodos_upload_filter');
    
    $new_filename = $file_return['file'];
    $new_filename = str_replace("\\","/", $new_filename);
    //--- End of upload ---

    

    // If post meta already exists
    if (count($thumbnails_ids) > 0){
    
        $thumbnail_post_id = $thumbnails_ids[0];

        // Update the thumbnail post title into the database
        $my_post = array(
            'ID' => $thumbnail_post_id,
            'post_title' => $new_filename
        );
        wp_update_post( $my_post );
        
        // Update thumbnail meta _wp_attached_file
        update_post_meta($thumbnail_post_id, '_wp_attached_file', $new_filename);
        
        // update also _attachment_meta
        $data = wp_get_attachment_metadata( $thumbnail_post_id);

        $data['file'] = $new_filename;
        
        wp_update_attachment_metadata( $thumbnail_post_id, $data );
        
    } else {

        $attachment = array(
            'post_mime_type' => $file_return['type'],
            'post_title' => preg_replace('/\.[^.]+$/', '', basename($new_filename)),
            'post_content' => '',
            'post_status' => 'inherit',
            'guid' => $file_return['url']
        );

        // Attach to
        $attachment_id = wp_insert_attachment($attachment, $new_filename, $parent_post_id);
        
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        
        $attachment_data = wp_generate_attachment_metadata($attachment_id, $new_filename);
        
        wp_update_attachment_metadata($attachment_id, $attachment_data);
        
        remove_filter('intermediate_image_sizes_advanced',
            'vrodos_remove_allthumbs_sizes', 10);
        
        if (0 < intval($attachment_id, 10)) {
            return $attachment_id;
        }
        
    }
    return false;
}



// Asset: Used to save textures
function vrodos_upload_asset_texture($imagefile, $imgTitle, $parent_post_id, $type) {
    
    $DS = DIRECTORY_SEPARATOR;
    
    // UPLOAD NEW FILE:
    $hashed_filename = $parent_post_id.'_'.$imgTitle . '.' . $type;

    // Remove all sizes of thumbnails creation procedure
    add_filter('intermediate_image_sizes_advanced', 'vrodos_remove_allthumbs_sizes', 10, 2);
    
    // Get admin power
    require_once(ABSPATH . 'wp-admin/includes/admin.php');
    
    // Get upload directory and do some sanitization
    $upload_path = str_replace('/', $DS, wp_upload_dir()['basedir']) . $DS .'Models'.$DS;
    
    // Write file string to a file in server
    file_put_contents($upload_path . $hashed_filename,
        base64_decode(substr($imagefile, strpos($imagefile, ",") + 1)));
    
    $new_filename_path = str_replace("\\","/", $upload_path . $hashed_filename);

    //--- End of upload ---
   

    // Add post of texture (type: attachment)
    $attachment = array(
        'post_mime_type' => 'image/'.($type==='png'?'png':'jpeg'),
        'post_title' => preg_replace('/\.[^.]+$/', '', $hashed_filename),
        'post_content' => '',
        'post_status' => 'inherit',
        'guid' => wp_upload_dir()['baseurl'].'/Models/'.$hashed_filename
    );
    
    // Attach to
    $attachment_id = wp_insert_attachment($attachment, $new_filename_path, $parent_post_id);
    
    require_once(ABSPATH . 'wp-admin/includes/image.php');
    
    $attachment_data = wp_generate_attachment_metadata($attachment_id, $new_filename_path);
    
    wp_update_attachment_metadata($attachment_id, $attachment_data);
    
    // store each texture in a post meta that receives multiple files
    add_post_meta($parent_post_id, 'vrodos_asset3d_diffimage', $attachment_id);
    
    remove_filter('intermediate_image_sizes_advanced',
        'vrodos_remove_allthumbs_sizes', 10);
    
    if (0 < intval($attachment_id, 10)) {
        return $attachment_id;
    }
    

    return false;
}


// Asset: Used to save screenshot
function vrodos_upload_asset_screenshot($imagefile, $imgTitle, $parent_post_id, $project_id) {

    $DS = DIRECTORY_SEPARATOR;

    // DELETE EXISTING FILE: See if has already a thumbnail and delete the file in the filesystem
    $asset3d_screenimage_ids = get_post_meta($parent_post_id,'vrodos_asset3d_screenimage');
    
    if (!empty($asset3d_screenimage_ids) && !empty($asset3d_screenimage_ids[0])) {
            // Remove previous file from file system
            
            $prevfMeta = get_post_meta($asset3d_screenimage_ids[0], '_wp_attachment_metadata', false);
            
            $f = fopen("output_screenshot.txt", "w");
            fwrite($f, print_r($asset3d_screenimage_ids, true));
            fwrite($f, chr(13));
            fwrite($f, chr(13));
            fwrite($f, print_r($prevfMeta, true));
            fclose($f);
            
            if (count($prevfMeta)>0) {
                if (file_exists($prevfMeta[0]['file'])) {
                    unlink($prevfMeta[0]['file']);
                }
            }
    }
    
    // UPLOAD NEW FILE:
   
    // Generate a hashed filename in order to avoid overwrites for the same names
    $hashed_filename = $parent_post_id .'_'. $imgTitle.'_asset_screenshot.png';
    
    // Remove all sizes of thumbnails creation procedure
    add_filter('intermediate_image_sizes_advanced', 'vrodos_remove_allthumbs_sizes', 10, 2);
    
//    // Get admin power
//    require_once(ABSPATH . 'wp-admin/includes/admin.php');
    
    // Get upload directory and do some sanitization
    $upload_path = str_replace('/', $DS, wp_upload_dir()['basedir']) . $DS . 'models' . $DS . $project_id . $DS;
    
    // Write file string to a file in server
    file_put_contents($upload_path . $hashed_filename,
        base64_decode(substr($imagefile, strpos($imagefile, ",") + 1)));
    
    $new_filename = str_replace("\\","/", $upload_path .$hashed_filename);
    
    //--- End of upload ---
    
    // DATABASE UPDATE
    
    $f2 = fopen("output_screenshot_create.txt","w");
    fwrite($f2, print_r($asset3d_screenimage_ids, true));
    fclose($f2);
    
    // If post meta already exists
    if (!empty($asset3d_screenimage_ids) && !empty($asset3d_screenimage_ids[0])) {
    
        $asset3d_screenimage_id = $asset3d_screenimage_ids[0];
        
        // Update the post title into the database
        wp_update_post( array('ID' => $asset3d_screenimage_id, 'post_title' => $new_filename));
        
        // Update meta _wp_attached_file
        update_post_meta($asset3d_screenimage_id, '_wp_attached_file', $new_filename);
        
        // update also _attachment_meta
        $data = wp_get_attachment_metadata( $asset3d_screenimage_id);
        
        $data['file'] = $new_filename;
        
        wp_update_attachment_metadata( $asset3d_screenimage_id, $data );
    
        update_post_meta($parent_post_id, 'vrodos_asset3d_screenimage', $asset3d_screenimage_id);

    } else { // If post does not exist
        
        $attachment = array(
            'post_mime_type' => 'image/png', //$file_return['type'],
            'post_title' => preg_replace('/\.[^.]+$/', '', basename($new_filename)),
            'post_content' => '',
            'post_status' => 'inherit',
            'guid' => wp_upload_dir()['baseurl'].'/Models/'.$hashed_filename
        );
        
        // Attach to
        $attachment_id = wp_insert_attachment($attachment, $new_filename, $parent_post_id);
        
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        
        $attachment_data = wp_generate_attachment_metadata($attachment_id, $new_filename);
        
        wp_update_attachment_metadata($attachment_id, $attachment_data);
    
        update_post_meta($parent_post_id, 'vrodos_asset3d_screenimage', $attachment_id);

        remove_filter('intermediate_image_sizes_advanced',
            'vrodos_remove_allthumbs_sizes', 10);
        
        if (0 < intval($attachment_id, 10)) {
            return $attachment_id;
        }
    }

    return false;
}



// Immitation of $_FILE through $_POST . This is for objs, fbx and mtls
function vrodos_upload_AssetText($textContent, $textTitle, $parent_post_id, $TheFiles, $index_file, $project_id) {
    
    $DS = DIRECTORY_SEPARATOR;
    
    //$fp = fopen("output_fbx_upload.txt","w");
    
    // --------------  1. Upload file ---------------
    // ?? Filters the image sizes automatically generated when uploading an image.
    add_filter( 'intermediate_image_sizes_advanced', 'vrodos_remove_allthumbs_sizes', 10, 2 );
    
    require_once( ABSPATH . 'wp-admin/includes/admin.php' );
    
    $upload_dir = wp_upload_dir();

    $upload_path = str_replace('/',$DS,$upload_dir['basedir']) . $DS . 'models' . $DS . $project_id . $DS;
	
	// Make Models folder
	if (!is_dir($upload_path)) {
		mkdir( $upload_path );
	}
	
    //$hashed_filename = md5( $textTitle . microtime() ) . '_' . $textTitle.'.txt';
    
    $hashed_filename = $parent_post_id . '_' . $textTitle.'.txt';

    if ($textContent) {
        file_put_contents($upload_path . $hashed_filename, $textContent);
        $type = 'text/plain';
    } else {
        move_uploaded_file(
            $TheFiles['multipleFilesInput']['tmp_name'][$index_file],
                    $upload_path . $hashed_filename);
        $type = 'application/octet-stream';
    }

    //------------------- 2 Add post to DB as 'attachment' ----------------------------
    $file_url = $upload_dir['baseurl'].'/models/'. $project_id . '/'.$hashed_filename;
    
    $attachment = array(
        'post_mime_type' => $type,
        'post_title' => preg_replace( '/\.[^.]+$/', '', $hashed_filename) ,
        'post_content' => '',
        'post_status' => 'inherit',
        'guid' => $file_url      //$file_return['url']
    );
    
    $attachment_id = wp_insert_attachment( $attachment, $file_url, $parent_post_id );
    
    // ----------------- 3. Add Attachment metadata to SQL --------------------------
    $attachment_data = wp_generate_attachment_metadata( $attachment_id,
                            $upload_path . $hashed_filename );
   
    wp_update_attachment_metadata( $attachment_id, $attachment_data );
    
    $fbxpath = str_replace('\\','/', $upload_path . $hashed_filename);
    
    update_post_meta($attachment_id, '_wp_attached_file', $fbxpath);
    
    remove_filter( 'intermediate_image_sizes_advanced', 'vrodos_remove_allthumbs_sizes', 10, 2 );
   
    if( 0 < intval( $attachment_id, 10 ) ) {
        return $attachment_id;
    }
   
    return false;
}

function escstr($in, $what){
    return esc_attr(strip_tags($in, $what));
}

function vrodos_asset3d_languages_support1($allPOSTval){
    
	
    $output = [];
    
    $titLang = ['', 'Greek', 'Spanish', 'French', 'German', 'Russian'];
    $access = ['','Kids','Experts','Perception'];
    
    foreach ($titLang as $tl){
        
        $output['assetTitleForm'.$tl] = escstr($allPOSTval['assetTit'.($tl === ''? 'le' : $tl)],"<b><i>");
        
        foreach ($access as $a){
            $output['assetDescForm'.$tl.$a] = escstr($allPOSTval['assetDesc'.$tl.$a],"<b><i>");
        }
        
    }
    
    // Auto Translation by Google
//    if($assetDescFormGreek=='' && $assetDescForm !='' && $hasTranslator){
//        $translate = new TranslateClient();
//        $result = $translate->translate($assetDescForm, ['target' => 'el']);
//        $assetDescFormGreek = $result[text];
//    }
    
    return $output;
}

function vrodos_asset3d_languages_support2($asset_id){
    
    $a = ($asset_id == null);
    
    $output = [];
    $output['asset_title_saved'] = ($a ? "" : get_the_title( $asset_id ));
    $output['asset_title_label'] = ($a ? "Title for the asset in English" : "Title of the asset in English");
    
    $output['asset_desc_label'] = ($a ? "Add a description for the asset" : "Edit the description of the asset");
    $output['asset_desc_saved'] = ($a ? "" : get_post_field('post_content', $asset_id));
    $output['asset_desc_kids_label'] = ($a ? "Add a description of the asset for kids" : "Edit the description of the asset for kids");
    $output['asset_desc_kids_saved'] = ($a ? "" : get_post_meta($asset_id,'vrodos_asset3d_description_kids', true));
    $output['asset_desc_experts_label'] = ($a ? "Add a description of the asset for experts in archaeology" : "Edit the description of the asset for experts in archaeology");
    $output['asset_desc_experts_saved'] = ($a ? "" : get_post_meta($asset_id,'vrodos_asset3d_description_experts', true));
    $output['asset_desc_perception_label'] = ($a ? "Add a description of the asset for people with perception problems" : "Edit the description of the asset for people with perception problems");
    $output['asset_desc_perception_saved'] = ($a ? "" : get_post_meta($asset_id,'vrodos_asset3d_description_perception', true));
    
    $lang = ['greek','spanish','french','german','russian'];
    
    foreach ($lang as $l){
        $output['asset_title_'.$l.'_saved'] = ($a ? "" : get_post_meta($asset_id,'vrodos_asset3d_title_'.$l, true));
        $output['asset_desc_'.$l.'_saved'] = ($a ? "" : get_post_meta($asset_id,'vrodos_asset3d_description_'.$l, true));
        $output['asset_desc_'.$l.'_kids_saved'] = ($a ? "" : get_post_meta($asset_id,'vrodos_asset3d_description_'.$l.'_kids', true));
        $output['asset_desc_'.$l.'_experts_saved'] = ($a ? "" : get_post_meta($asset_id,'vrodos_asset3d_description_'.$l.'_experts', true));
        $output['asset_desc_'.$l.'_perception_saved'] = ($a ? "" : get_post_meta($asset_id,'vrodos_asset3d_description_'.$l.'_perception', true));
    }
    
    $l = 'greek';
    
    $output['asset_title_'.$l.'_label'] = ($a ? "Ο τίτλος του αντικειμένου" : "Τροποποίηση τίτλου αντικειμένου");
    $output['asset_desc_'.$l.'_label'] = ($a ? "Πρόσθεσε μια περιγραφή για το αντικείμενο" : "Τροποποίηση περιγραφής αντικειμένου");
    $output['asset_desc_'.$l.'_kids_label'] = ($a ? "Η περιγραφή του αντικειμένου για παιδιά" : "Τροποποίηση περιγραφής του αντικειμένου για παιδιά");
    $output['asset_desc_'.$l.'_experts_label'] = ($a ? "Η περιγραφή του αντικειμένου για ειδικούς στην αρχαιολογία" : "Τροποποίηση περιγραφής του αντικειμένου για ειδικούς στην αρχαιολογία");
    $output['asset_desc_'.$l.'_perception_label'] = ($a ? "Η περιγραφή του αντικειμένου για άτομα με προβλήματατα αντίληψης" : "Τροποποίηση περιγραφής του αντικειμένου για άτομα με προβλήματατα αντίληψης");

    
    $l = 'spanish';
    
    $output['asset_title_'.$l.'_label'] = ($a ? "Ingrese un título para su activo" : "Edite el título del activo");
    $output['asset_desc_'.$l.'_label'] = ($a ? "Agregue una pequeña descripción para su activo" : "Edite la descripción de su activo");
    $output['asset_desc_'.$l.'_kids_label']  = ($a ? "Agregue una descripción de su activo para niños" : "Editar la descripción del activo para niños");
    $output['asset_desc_'.$l.'_experts_label'] = ($a ? "Agregar una descripción del activo para expertos en arqueología" : "Edite la descripción del activo para expertos en arqueología.");
    $output['asset_desc_'.$l.'_perception_label'] = ($a ? "Agregue una descripción del activo para personas con problemas de percepción" : "Edite la descripción del activo para personas con problemas de percepción");
    
    $l = 'french';
    
    $output['asset_title_'.$l.'_label'] = ($a ? "Entrez un titre pour votre bien" : "Modifier le titre de l'actif");
    $output['asset_desc_'.$l.'_label'] = ($a ? "Ajouter une description de votre actif" : "Modifier la description de votre bien");
    $output['asset_desc_'.$l.'_kids_label'] = ($a ? "Ajouter une description pour votre bien pour enfants" : "Modifier la description de l'actif pour les enfants");
    $output['asset_desc_'.$l.'_experts_label'] = ($a ? "Ajouter une description de l'actif pour les experts en archéologie" : "Modifier la description de l'actif pour les experts en archéologie");
    $output['asset_desc_'.$l.'_perception_label'] = ($a ? "Ajouter une description de l'actif pour les personnes ayant des problèmes de perception" : "Modifier la description de l'actif pour les personnes ayant des problèmes de perception");
    
    $l = 'german';
    
    $output['asset_title_'.$l.'_label']  = ($a ? "Geben Sie einen Titel für Ihr Asset ein" : "Bearbeiten Sie den Titel des Assets");
    $output['asset_desc_'.$l.'_label'] = ($a ? "Geben Sie eine Beschriebung" : "Ändern Sie die Beschreibung");
    $output['asset_desc_'.$l.'_kids_label'] = ($a ? "Fügen Sie eine Beschreibung für Ihr Asset auf Englisch für Kinder hinzu" : "Bearbeiten Sie die Beschreibung des Assets für Kinder");
    $output['asset_desc_'.$l.'_experts_label'] = ($a ? "Fügen Sie eine Beschreibung des Objekts für Experten der Archäologie hinzu" : "Bearbeiten Sie die Beschreibung des Assets für Experten in Archäologie");
    $output['asset_desc_'.$l.'_perception_label'] = ($a ? "Fügen Sie eine Beschreibung des Assets für Personen mit Wahrnehmungsproblemen hinzu" : "Bearbeiten Sie die Beschreibung des Assets für Personen mit Wahrnehmungsproblemen");
    
    $l = 'russian';
    
    $output['asset_title_'.$l.'_label'] = ($a ? "Введите название для вашего актива" : "Изменить заголовок актива");
    $output['asset_desc_'.$l.'_label'] = ($a ? "Дать описание" : "Изменить описание");
    $output['asset_desc_'.$l.'_kids_label'] = ($a ? "Добавить описание для вашего имущества для детей" : "Редактировать описание актива для детей");
    $output['asset_desc_'.$l.'_experts_label']= ($a ? "Добавить описание актива для специалистов по археологии" : "Редактировать описание актива для специалистов по археологии");
    $output['asset_desc_'.$l.'_perception_label'] = ($a ? "Добавить описание актива для людей с проблемами восприятия" : "Изменить описание актива для людей с проблемами восприятия");
    
    return $output;

}

function   vrodos_asset3d_languages_support3($curr_font, $assetLangPack2){
    
    echo '<ul class="langul">'.
                    '<li class="langli"><a href="#EnglishEdit">English</a></li>'.
                    '<li class="langli"><a href="#GreekEdit" >Ελληνικά</a></li>'.
                    '<li class="langli"><a href="#SpanishEdit" >Español</a></li>'.
                    '<li class="langli"><a href="#FrenchEdit" >Français</a></li>'.
                    '<li class="langli"><a href="#GermanEdit" >Deutsch</a></li>'.
                    '<li class="langli"><a href="#RussianEdit" >Pусский</a></li>'.
                '</ul>';
    
    
   echo '<div class="wrapper_lang">';
    
    // English EDIT
    echo '<div id="EnglishEdit" class="tab-container_lang" style="position:relative;">';
    
    echo '<div id="assetDescription" class="changablefont mdc-textfield mdc-textfield--textarea assetDescSt" data-mdc-auto-init="MDCTextfield">';
    echo '<textarea id="assetDesc" class="mdc-textfield__input" rows="3" cols="40" style="box-shadow: none; resize:vertical;font-family:'.$curr_font.';" name="assetDesc" form="3dAssetForm">'.trim($assetLangPack2['asset_desc_saved']).'</textarea>';
    echo '<label for="assetDesc" class="mdc-textfield__label" style="background: none;">'.$assetLangPack2['asset_desc_label'].'</label>';
    echo '</div>';
    
    echo '<div id="assetDescriptionKids" class="mdc-textfield mdc-textfield--textarea assetDescSt" data-mdc-auto-init="MDCTextfield">';
    echo '<textarea id="assetDescKids" class="changablefont mdc-textfield__input" rows="3" cols="40" style="box-shadow: none; resize:vertical;font-family:'.$curr_font.'" name="assetDescKids" form="3dAssetForm">'.trim($assetLangPack2['asset_desc_kids_saved']).'</textarea>';
    echo '<label for="assetDescKids" class="mdc-textfield__label" style="background: none;">'.$assetLangPack2['asset_desc_kids_label'].'</label>';
    echo '</div>';
    
    echo '<div id="assetDescriptionExperts" class="mdc-textfield mdc-textfield--textarea assetDescSt" data-mdc-auto-init="MDCTextfield">';
    echo '<textarea id="assetDescExperts" class="changablefont mdc-textfield__input" rows="3" cols="40" style="box-shadow: none; resize:vertical;font-family:'.$curr_font.'" name="assetDescExperts" form="3dAssetForm">'.trim($assetLangPack2['asset_desc_experts_saved']).'</textarea>';
    echo '<label for="assetDescExperts" class="mdc-textfield__label" style="background: none;">'.$assetLangPack2['asset_desc_experts_label'].'></label>';
    echo '</div>';
    
    echo '<div id="assetDescriptionPerception" class="mdc-textfield mdc-textfield--textarea assetDescSt" data-mdc-auto-init="MDCTextfield">';
    echo '<textarea id="assetDescPerception" class="changablefont mdc-textfield__input" rows="3" cols="40" style="box-shadow: none; resize:vertical;font-family:'.$curr_font.'" name="assetDescPerception" form="3dAssetForm">'.trim($assetLangPack2['asset_desc_perception_saved']).'</textarea>';
    echo '<label for="assetDescPerception" class="mdc-textfield__label" style="background: none;">'.$assetLangPack2['asset_desc_perception_label'].'</label>';
    echo '</div>';
    
    echo '</div>';
    
    $langs = ['Greek', 'Spanish', 'French', 'German', 'Russian'];
    $acces = ['', 'Kids', 'Experts', 'Perception'];

    // GREEK EDIT
    foreach ($langs as $l) {
    
        $llow = strtolower($l);
        
        // Title per language
        echo '<div id="' . $l . 'Edit" class="tab-container_lang" style="position:relative">';
        
        echo '<div id="assetTitle' . $l . '" class="mdc-textfield mdc-textfield--textarea assetDescSt" data-mdc-auto-init="MDCTextfield">';
        echo '<textarea id="assetTit' . $l . '" class="changablefont mdc-textfield__input" rows="1" cols="40" style="box-shadow: none; font-size:24px; padding-bottom:0;font-family:' . $curr_font . '" name="assetTit' . $l . '" form="3dAssetForm">' . trim($assetLangPack2['asset_title_' . $llow . '_saved']) . '</textarea>';
        echo '<label for="assetTit' . $l . '" class="mdc-textfield__label" style="background: none;">' . $assetLangPack2['asset_title_' . $llow . '_label'] . '</label>';
        echo '</div>';

        // Description per lang per acces level
        foreach ($acces as $a) {
    
            $aLow = strtolower($a);
            
            if ($aLow!=''){
                $aLow = '_'.$aLow;
            }
            
            echo '<div id="assetDescription' . $l . $a . '" class="mdc-textfield mdc-textfield--textarea assetDescSt" data-mdc-auto-init="MDCTextfield">';
            echo '<textarea id="assetDesc' . $l . $a . '" class="changablefont mdc-textfield__input" rows="3" cols="40" style="box-shadow: none; font-family:' . $curr_font . '" name="assetDesc' . $l . $a . '" form="3dAssetForm">' . trim($assetLangPack2['asset_desc_' . strtolower($l) . $aLow.'_saved']) . '</textarea>';
            echo '<label for="assetDesc' . $l .$a. '" class="mdc-textfield__label" style="background: none;">' . $assetLangPack2['asset_desc_' . strtolower($l).$aLow. '_label'] . '</label>';
            echo '</div>';
        }
    
        echo '</div>';
    }
    
    echo '</div>';
    
    // <!-- WIKIPEDIA button -->
//    echo '<button type="button" class="FullWidth mdc-button mdc-button--raised mdc-button--primary" data-mdc-auto-init="MDCRipple"'
//             .' onclick="vrodos_fetchDescriptionAjaxFrontEnd('Wikipedia', assetTitle.value, jQuery('#assetDesc')[0])">'.
//                'Fetch description from Wikipedia</button>';
//
//
//                <button type="button" class="FullWidth mdc-button mdc-button--raised mdc-button--primary" data-mdc-auto-init="MDCRipple"
//                            onclick="vrodos_fetchDescriptionAjaxFrontEnd('Europeana', assetTitle.value, jQuery('#assetDesc')[0])"
//                            style="margin-top:30px" >Fetch description from Europeana</button>
}
