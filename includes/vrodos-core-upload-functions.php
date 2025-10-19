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

    // Set post_id for the upload directory filter.
    $_REQUEST['post_id'] = $parent_post_id;
    add_filter('upload_dir', 'vrodos_upload_dir_forScenesOrAssets');
    add_filter('intermediate_image_sizes_advanced', 'vrodos_remove_allthumbs_sizes', 10, 2);

    $file_return = _vrodos_handle_asset_upload($file, $parent_post_id);

    remove_filter('upload_dir', 'vrodos_upload_dir_forScenesOrAssets');
    unset($_REQUEST['post_id']);

    // if file has been uploaded successfully
    if($file_return && empty($file_return['error'])) {
        $attachment_id = vrodos_insert_attachment_post($file_return, $parent_post_id);
        remove_filter('intermediate_image_sizes_advanced', 'vrodos_remove_allthumbs_sizes', 10, 2);
        if ($attachment_id) {
            return $attachment_id;
        }
    } else {
        // If the upload failed, we should still remove the filter to not affect other uploads.
        remove_filter('intermediate_image_sizes_advanced', 'vrodos_remove_allthumbs_sizes', 10, 2);
    }

    return false;
}

/**
 * Private unified handler for asset file uploads.
 *
 * This function uses wp_handle_upload to securely process file uploads and
 * should be used by other functions in this file to avoid code duplication.
 *
 * @param array $file_array A file array from $_FILES.
 * @param int   $parent_post_id The ID of the post this file is attached to.
 * @return array|false The result of wp_handle_upload or false on failure.
 */
function _vrodos_handle_asset_upload( $file_array, $parent_post_id ) {
    if ( ! function_exists( 'wp_handle_upload' ) ) {
        require_once( ABSPATH . 'wp-admin/includes/file.php' );
    }

    // The 'vrodos_upload_dir_forScenesOrAssets' filter will be applied by the calling function
    // to ensure the correct directory is used.
    $upload_overrides = array( 'test_form' => false );
    $movefile = wp_handle_upload( $file_array, $upload_overrides );

    return $movefile;
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

    // Generate thumbnail for media library
    $attachment_data = wp_generate_attachment_metadata( $attachment_id, $filename );

    // Update attachment post with the thumbnail
    wp_update_attachment_metadata( $attachment_id, $attachment_data );

    return $attachment_id;
}


// Immitation of $_FILE through $_POST . This works only for jpgs and pngs
function vrodos_upload_scene_screenshot($imagefile, $imgTitle, $scene_id, $type) {

    // DELETE EXISTING FILE: See if has already a thumbnail and delete it safely
    $thumbnail_id = get_post_thumbnail_id($scene_id);
    if ($thumbnail_id) {
        wp_delete_attachment($thumbnail_id, true);
    }

    // Set post_id for the upload directory filter.
    $_REQUEST['post_id'] = $scene_id;
    add_filter('upload_dir', 'vrodos_upload_dir_forScenesOrAssets');
    add_filter('intermediate_image_sizes_advanced', 'vrodos_remove_allthumbs_sizes', 10, 2);

    // The wp_upload_bits function is now mocked in the isolated test script.
    // if (!function_exists('wp_upload_bits')) {
    //     require_once(ABSPATH . 'wp-admin/includes/file.php');
    // }

    // Generate a unique filename
    $filename = 'scene_' . $scene_id . '_sshot.' . $type;
    $decoded_image = base64_decode(substr($imagefile, strpos($imagefile, ",") + 1));

    $file_return = wp_upload_bits($filename, null, $decoded_image);

    remove_filter('upload_dir', 'vrodos_upload_dir_forScenesOrAssets');
    unset($_REQUEST['post_id']);

    if ($file_return && empty($file_return['error'])) {
        $attachment_id = vrodos_insert_attachment_post($file_return, $scene_id);
        remove_filter('intermediate_image_sizes_advanced', 'vrodos_remove_allthumbs_sizes', 10, 2);
        if ($attachment_id) {
            set_post_thumbnail($scene_id, $attachment_id);
            return $attachment_id;
        }
    } else {
        // If the upload failed, we should still remove the filter to not affect other uploads.
        remove_filter('intermediate_image_sizes_advanced', 'vrodos_remove_allthumbs_sizes', 10, 2);
    }

    return false;
}



// Asset: Used to save screenshot
function vrodos_upload_asset_screenshot($image, $parentPostId, $projectId) {

    // DELETE EXISTING FILE
    $asset3d_screenimage_id = get_post_meta($parentPostId, 'vrodos_asset3d_screenimage', true);
    if ($asset3d_screenimage_id) {
        // Use wp_delete_attachment to safely remove the old file and database entries.
        wp_delete_attachment($asset3d_screenimage_id, true);
    }

    // Set post_id for the upload directory filter.
    $_REQUEST['post_id'] = $parentPostId;
    add_filter('upload_dir', 'vrodos_upload_dir_forScenesOrAssets');
    add_filter('intermediate_image_sizes_advanced', 'vrodos_remove_allthumbs_sizes', 10, 2);

    // The wp_upload_bits function is now mocked in the isolated test script.
    // if (!function_exists('wp_upload_bits')) {
    //     require_once(ABSPATH . 'wp-admin/includes/file.php');
    // }

    // Generate a unique filename
    $filename = $parentPostId .'_'. time() .'_asset_screenshot.png';
    $decoded_image = base64_decode(substr($image, strpos($image, ",") + 1));

    $file_return = wp_upload_bits($filename, null, $decoded_image);

    remove_filter('upload_dir', 'vrodos_upload_dir_forScenesOrAssets');
    unset($_REQUEST['post_id']);

    if ($file_return && empty($file_return['error'])) {
        $attachment_id = vrodos_insert_attachment_post($file_return, $parentPostId);
        remove_filter('intermediate_image_sizes_advanced', 'vrodos_remove_allthumbs_sizes', 10, 2);
        if ($attachment_id) {
            update_post_meta($parentPostId, 'vrodos_asset3d_screenimage', $attachment_id);
            return $attachment_id;
        }
    } else {
        // If the upload failed, we should still remove the filter to not affect other uploads.
        remove_filter('intermediate_image_sizes_advanced', 'vrodos_remove_allthumbs_sizes', 10, 2);
    }

    return false;
}



// Immitation of $_FILE through $_POST . This is for objs, fbx and mtls
function vrodos_upload_AssetText($textContent, $textTitle, $parent_post_id, $TheFiles, $index_file, $project_id) {

    // Set post_id for the upload directory filter.
    $_REQUEST['post_id'] = $parent_post_id;

    // Add filter to use our custom directory structure.
    add_filter('upload_dir', 'vrodos_upload_dir_forScenesOrAssets');
    add_filter('intermediate_image_sizes_advanced', 'vrodos_remove_allthumbs_sizes', 10, 2);

    $file_return = false;

    if ($textContent) {
        // Handle raw text content
        // The wp_upload_bits function is now mocked in the isolated test script.
        // if (!function_exists('wp_upload_bits')) {
        //     require_once(ABSPATH . 'wp-admin/includes/file.php');
        // }
        $filename = sanitize_file_name($textTitle);
        $file_return = wp_upload_bits($filename, null, $textContent);
        if ($file_return && !isset($file_return['error'])) {
            $file_return['type'] = 'text/plain'; // wp_upload_bits doesn't set type for raw content
        }


    } elseif (isset($TheFiles['multipleFilesInput']['tmp_name'][$index_file])) {
        // Handle file from $_FILES array
        $file_array = array(
            'name'     => $TheFiles['multipleFilesInput']['name'][$index_file],
            'type'     => $TheFiles['multipleFilesInput']['type'][$index_file],
            'tmp_name' => $TheFiles['multipleFilesInput']['tmp_name'][$index_file],
            'error'    => $TheFiles['multipleFilesInput']['error'][$index_file],
            'size'     => $TheFiles['multipleFilesInput']['size'][$index_file],
        );
        $file_return = _vrodos_handle_asset_upload($file_array, $parent_post_id);
    }

    // Remove the filters so they don't affect other uploads.
    remove_filter('upload_dir', 'vrodos_upload_dir_forScenesOrAssets');
    remove_filter('intermediate_image_sizes_advanced', 'vrodos_remove_allthumbs_sizes', 10, 2);
    unset($_REQUEST['post_id']);

    // If the file was uploaded successfully, create an attachment post.
    if ($file_return && empty($file_return['error'])) {
        $attachment_id = vrodos_insert_attachment_post($file_return, $parent_post_id);
        if ($attachment_id) {
            return $attachment_id;
        }
    }

    return false;
}
