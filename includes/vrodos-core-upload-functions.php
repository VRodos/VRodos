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
        '/' . get_the_terms($post_id, 'vrodos_scene_pgame')[0]->slug . '/scenes'  // 'vrodos_scene'
        :  '/' . get_post_meta($post_id, 'vrodos_asset3d_pathData', true) . '/models'; // 'vrodos_asset3d'

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
            'path'   => $dir['basedir'] . '/models',
            'url'    => $dir['baseurl'] . '/models',
            'subdir' => '/models',
        ) + $dir;
}

function vrodos_upload_video_dir( $dir ) {
    return array(
            'path'   => $dir['basedir'] . '/models/videos',
            'url'    => $dir['baseurl'] . '/models/videos',
            'subdir' => '/models/videos',
        ) + $dir;
}

function vrodos_upload_image_dir( $dir ) {
    return array(
            'path'   => $dir['basedir'] . '/models/images',
            'url'    => $dir['baseurl'] . '/models/images',
            'subdir' => '/models/videos',
        ) + $dir;
}

// Change general upload directory to /models
function vrodos_upload_filter( $args  ) {

    $newdir =  '/models';

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

    // Add all models to respective folders
    switch ($file['type']) {
        case 'video/mp4':
        case 'video/webm':
            add_filter( 'upload_dir', 'vrodos_upload_video_dir' );
            break;

        case 'image/png':
        case 'image/jpg':
        case 'image/jpeg':
            add_filter( 'upload_dir', 'vrodos_upload_image_dir' );
            break;

        default:
            add_filter( 'upload_dir', 'vrodos_upload_img_vid_aud_directory' );
            break;
    }

    // Upload
    $file_return = wp_handle_upload( $file, array('test_form' => false ) );

    // Remove upload filter to "Models" folder
    switch ($file['type']) {
        case 'video/mp4':
        case 'video/webm':
            remove_filter( 'upload_dir', 'vrodos_upload_video_dir' );
            break;

        case 'image/png':
        case 'image/jpg':
        case 'image/jpeg':
            remove_filter( 'upload_dir', 'vrodos_upload_image_dir' );
            break;

        default:
            remove_filter( 'upload_dir', 'vrodos_upload_img_vid_aud_directory' );
            break;
    }


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
function vrodos_upload_scene_screenshot($imagefile, $imgTitle, $scene_id, $type) {

    $DS = DIRECTORY_SEPARATOR;

    // DELETE EXISTING FILE: See  if has already a thumbnail and delete the file in the filesystem
    $thumbnails_ids = get_post_meta($scene_id,'_thumbnail_id');

    if (count($thumbnails_ids) > 0) {

        // Remove previous file from file system
        $prevfMeta = get_post_meta($thumbnails_ids[0], '_wp_attachment_metadata', false);

        if (file_exists($prevfMeta[0]['file'])) {
            unlink($prevfMeta[0]['file']);
        }
    }

    // UPLOAD NEW FILE:

    // Generate a hashed filename in order to avoid overwrites for the same names
    $hashed_filename = 'scene_' . $scene_id . '_sshot.' . $type;

    // Remove all sizes of thumbnails creation procedure
    add_filter('intermediate_image_sizes_advanced', 'vrodos_remove_allthumbs_sizes', 10, 2);

    // Get admin power
    require_once(ABSPATH . 'wp-admin/includes/admin.php');

    // Get upload directory and do some sanitization
    $upload_path = str_replace('/', $DS, wp_upload_dir()['basedir']) . $DS .'scenes' . $DS . $scene_id . $DS;
    if (!is_dir($upload_path)) {
        mkdir( $upload_path, 0777, true );
    }

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

    $new_filename = str_replace("\\","/", $upload_path .$hashed_filename);
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
            'post_mime_type' => $image_upload['type'],
            'post_title' => preg_replace('/\.[^.]+$/', '', basename($new_filename)),
            'post_content' => '',
            'post_status' => 'inherit',
            'guid' => $image_upload['url']
        );

        // Attach to
        $attachment_id = wp_insert_attachment($attachment, $new_filename, $scene_id);

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



// Asset: Used to save screenshot
function vrodos_upload_asset_screenshot($image, $parentPostId, $projectId) {

    $DS = DIRECTORY_SEPARATOR;

    // DELETE EXISTING FILE: See if has already a thumbnail and delete the file in the filesystem
    $asset3d_screenimage_ids = get_post_meta($parentPostId,'vrodos_asset3d_screenimage');

    if (!empty($asset3d_screenimage_ids) && !empty($asset3d_screenimage_ids[0])) {
        // Remove previous file from file system

        $prevfMeta = get_post_meta($asset3d_screenimage_ids[0], '_wp_attachment_metadata', false);

        if (count($prevfMeta)>0) {
            if (file_exists($prevfMeta[0]['file'])) {
                unlink($prevfMeta[0]['file']);
            }
        }
    }

    // UPLOAD NEW FILE:

    // Generate a hashed filename in order to avoid overwrites for the same names
    $hashed_filename = $parentPostId .'_'. time() .'_asset_screenshot.png';

    // Remove all sizes of thumbnails creation procedure
    add_filter('intermediate_image_sizes_advanced', 'vrodos_remove_allthumbs_sizes', 10, 2);

    // Get admin rights
    // require_once(ABSPATH . 'wp-admin/includes/admin.php');

    // Get upload directory and do some sanitization
    $upload_path = str_replace('/', $DS, wp_upload_dir()['basedir']) . $DS . 'models' . $DS . $projectId . $DS;
    if (!is_dir($upload_path)) {
        mkdir( $upload_path, 0777, true );
    }

    // Write file string to a file in server
    file_put_contents($upload_path . $hashed_filename,
        base64_decode(substr($image, strpos($image, ",") + 1)));

    $new_filename = str_replace("\\","/", $upload_path .$hashed_filename);

    //--- End of upload ---

    // DATABASE UPDATE

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

        update_post_meta($parentPostId, 'vrodos_asset3d_screenimage', $asset3d_screenimage_id);

    } else { // If post does not exist

        $attachment = array(
            'post_mime_type' => 'image/png', //$file_return['type'],
            'post_title' => preg_replace('/\.[^.]+$/', '', basename($new_filename)),
            'post_content' => '',
            'post_status' => 'inherit',
            'guid' => wp_upload_dir()['baseurl'].'/models/'.$hashed_filename
        );

        // Attach to
        $attachment_id = wp_insert_attachment($attachment, $new_filename, $parentPostId);

        require_once(ABSPATH . 'wp-admin/includes/image.php');

        $attachment_data = wp_generate_attachment_metadata($attachment_id, $new_filename);

        wp_update_attachment_metadata($attachment_id, $attachment_data);

        update_post_meta($parentPostId, 'vrodos_asset3d_screenimage', $attachment_id);

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
        mkdir( $upload_path, 0777, true );
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
