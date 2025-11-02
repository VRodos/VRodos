<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class VRodos_Upload_Manager {
    public static function register_hooks() {
        // All hooks related to file uploads
        add_filter( 'upload_dir', array( __CLASS__, 'upload_dir_for_scenes_or_assets' ) );
        add_filter( 'intermediate_image_sizes', array( __CLASS__, 'disable_imgthumbs_assets' ), 999 );
        add_filter( 'sanitize_file_name', array( __CLASS__, 'overwrite_uploads' ), 10, 1 );
    }

    // Get the directory for media uploading of a scene or an asset
    public static function upload_dir_for_scenes_or_assets( $args ) {

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
    public static function disable_imgthumbs_assets( $image_sizes ){

        // extra sizes
        $slider_image_sizes = array(  );
        // for ex: $slider_image_sizes = array( 'thumbnail', 'medium' );

        // instead of unset sizes, return your custom size (nothing)
        if( isset($_REQUEST['post_id']) && 'vrodos_asset3d' === get_post_type( $_REQUEST['post_id'] ) )
            return $slider_image_sizes;

        return $image_sizes;
    }

    // Overwrite attachments
    public static function overwrite_uploads( $name ){

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

    public static function remove_allthumbs_sizes( $sizes, $metadata ) {
        return [];
    }

    // Change directory for images and videos to uploads/Models
    public static function upload_img_vid_aud_directory( $dir ) {
        return array(
                'path'   => $dir['basedir'] . '/models',
                'url'    => $dir['baseurl'] . '/models',
                'subdir' => '/models',
            ) + $dir;
    }

    public static function upload_video_dir( $dir ) {
        return array(
                'path'   => $dir['basedir'] . '/models/videos',
                'url'    => $dir['baseurl'] . '/models/videos',
                'subdir' => '/models/videos',
            ) + $dir;
    }

    public static function upload_image_dir( $dir ) {
        return array(
                'path'   => $dir['basedir'] . '/models/images',
                'url'    => $dir['baseurl'] . '/models/images',
                'subdir' => '/models/videos',
            ) + $dir;
    }

    // Change general upload directory to /models
    public static function upload_filter( $args  ) {

        $newdir =  '/models';

        $args['path']    = str_replace( $args['subdir'], '', $args['path'] ); //remove default subdir
        $args['url']     = str_replace( $args['subdir'], '', $args['url'] );
        $args['subdir']  = $newdir;
        $args['path']   .= $newdir;
        $args['url']    .= $newdir;

        return $args;
    }

    // Upload image(s) or video or audio for a certain post_id (asset or scene3D)
    public static function upload_img_vid_aud($file, $parent_post_id) {
        self::load_wp_admin_files();
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
        add_filter('upload_dir', array(__CLASS__, 'upload_dir_for_scenes_or_assets'));
        add_filter('intermediate_image_sizes_advanced', array(__CLASS__, 'remove_allthumbs_sizes'), 10, 2);
        $file_return = self::handle_asset_upload($file, $parent_post_id);
        remove_filter('upload_dir', array(__CLASS__, 'upload_dir_for_scenes_or_assets'));
        unset($_REQUEST['post_id']);
        // if file has been uploaded successfully
        if($file_return && empty($file_return['error'])) {
            $attachment_id = self::insert_attachment_post($file_return, $parent_post_id);
            remove_filter('intermediate_image_sizes_advanced', array(__CLASS__, 'remove_allthumbs_sizes'), 10, 2);
            if ($attachment_id) {
                return $attachment_id;
            }
        } else {
            // If the upload failed, we should still remove the filter to not affect other uploads.
            remove_filter('intermediate_image_sizes_advanced', array(__CLASS__, 'remove_allthumbs_sizes'), 10, 2);
        }
        return false;
    }

    private static function load_wp_admin_files() {
        if (!function_exists('wp_generate_attachment_metadata')) {
            require_once(ABSPATH . 'wp-admin/includes/file.php');
            require_once(ABSPATH . 'wp-admin/includes/media.php');
            require_once(ABSPATH . 'wp-admin/includes/image.php');
        }
    }

    private static function handle_asset_upload( $file_array, $parent_post_id ) {
        self::load_wp_admin_files();
        $upload_overrides = array( 'test_form' => false );
        $movefile = wp_handle_upload( $file_array, $upload_overrides );
        return $movefile;
    }

    public static function insert_attachment_post($file_return, $parent_post_id ){
        $filename = $file_return['file'];
        $attachment = array(
            'post_mime_type' => $file_return['type'],
            'post_title' => preg_replace( '/\.[^.]+$/', '', basename( $filename ) ),
            'post_content' => '',
            'post_status' => 'inherit',
            'guid' => $file_return['url']
        );
        $attachment_id = wp_insert_attachment( $attachment, $file_return['url'], $parent_post_id );
        $attachment_data = wp_generate_attachment_metadata( $attachment_id, $filename );
        wp_update_attachment_metadata( $attachment_id, $attachment_data );
        return $attachment_id;
    }

    public static function upload_scene_screenshot($imagefile, $imgTitle, $scene_id, $type) {
        self::load_wp_admin_files();

        // Set post_id for the upload directory filter. This ensures that both the deletion of the old file
        // and the upload of the new one happen in the correct scene-specific directory.
        $_REQUEST['post_id'] = $scene_id;
        add_filter('upload_dir', array(__CLASS__, 'upload_dir_for_scenes_or_assets'));

        // First, delete the existing thumbnail if it exists.
        // wp_delete_attachment (with $force_delete = true) handles deleting the file from the filesystem.
        $thumbnail_id = get_post_thumbnail_id($scene_id);
        if ($thumbnail_id) {
            wp_delete_attachment($thumbnail_id, true);
        }

        // Now, proceed with uploading the new screenshot.
        add_filter('intermediate_image_sizes_advanced', array(__CLASS__, 'remove_allthumbs_sizes'), 10, 2);
        add_filter('big_image_size_threshold', '__return_false');

        $filename = 'scene_' . $scene_id . '_sshot.' . $type;
        $decoded_image = base64_decode(substr($imagefile, strpos($imagefile, ",") + 1));
        $file_return = wp_upload_bits($filename, null, $decoded_image);

        // Always remove filters after the operation.
        remove_filter('upload_dir', array(__CLASS__, 'upload_dir_for_scenes_or_assets'));
        unset($_REQUEST['post_id']);

        if ($file_return && empty($file_return['error'])) {
            $attachment_id = self::insert_attachment_post($file_return, $scene_id);

            // Filters must be removed *after* the attachment is created.
            remove_filter('intermediate_image_sizes_advanced', array(__CLASS__, 'remove_allthumbs_sizes'), 10, 2);
            remove_filter('big_image_size_threshold', '__return_false');

            if ($attachment_id) {
                set_post_thumbnail($scene_id, $attachment_id);
                return $attachment_id;
            }
        } else {
            // Ensure filters are removed even if the upload fails.
            remove_filter('intermediate_image_sizes_advanced', array(__CLASS__, 'remove_allthumbs_sizes'), 10, 2);
            remove_filter('big_image_size_threshold', '__return_false');
        }

        return false;
    }

    public static function upload_asset_screenshot($image, $parentPostId, $projectId, $existing_screenshot_id = null) {
        self::load_wp_admin_files();

        // Set post_id for the upload directory filter.
        $_REQUEST['post_id'] = $parentPostId;
        add_filter('upload_dir', array(__CLASS__, 'upload_dir_for_scenes_or_assets'));

        // Define filename. A consistent filename is important for overwriting.
        $filename = $parentPostId . '_asset_screenshot.png';
        $decoded_image = base64_decode(substr($image, strpos($image, ",") + 1));

        // If an old screenshot exists, we overwrite it.
        if ($existing_screenshot_id) {
            $existing_path = get_attached_file($existing_screenshot_id);

            // Overwrite the file on disk.
            $file_return = file_put_contents($existing_path, $decoded_image);

            // Update metadata to reflect the change (important for cache busting and correct display).
            wp_update_attachment_metadata($existing_screenshot_id, wp_generate_attachment_metadata($existing_screenshot_id, $existing_path));

            // We don't need to do anything else, so we can return.
            remove_filter('upload_dir', array(__CLASS__, 'upload_dir_for_scenes_or_assets'));
            unset($_REQUEST['post_id']);
            return $existing_screenshot_id;
        }

        // If no old screenshot exists, we create a new one.
        add_filter('intermediate_image_sizes_advanced', array(__CLASS__, 'remove_allthumbs_sizes'), 10, 2);
        add_filter('big_image_size_threshold', '__return_false');

        $file_return = wp_upload_bits($filename, null, $decoded_image);

        // Always remove filters after the operation.
        remove_filter('upload_dir', array(__CLASS__, 'upload_dir_for_scenes_or_assets'));
        unset($_REQUEST['post_id']);

        if ($file_return && empty($file_return['error'])) {
            $attachment_id = self::insert_attachment_post($file_return, $parentPostId);

            remove_filter('intermediate_image_sizes_advanced', array(__CLASS__, 'remove_allthumbs_sizes'), 10, 2);
            remove_filter('big_image_size_threshold', '__return_false');

            if ($attachment_id) {
                update_post_meta($parentPostId, 'vrodos_asset3d_screenimage', $attachment_id);
                return $attachment_id;
            }
        } else {
            remove_filter('intermediate_image_sizes_advanced', array(__CLASS__, 'remove_allthumbs_sizes'), 10, 2);
            remove_filter('big_image_size_threshold', '__return_false');
        }

        return false;
    }

    public static function upload_asset_text($textContent, $textTitle, $parent_post_id, $TheFiles, $index_file, $project_id) {
        self::load_wp_admin_files();
        $_REQUEST['post_id'] = $parent_post_id;
        add_filter('upload_dir', array(__CLASS__, 'upload_dir_for_scenes_or_assets'));
        add_filter('intermediate_image_sizes_advanced', array(__CLASS__, 'remove_allthumbs_sizes'), 10, 2);
        $file_return = false;
        if ($textContent) {
            $filename = sanitize_file_name($textTitle);
            $file_return = wp_upload_bits($filename, null, $textContent);
            if ($file_return && !isset($file_return['error'])) {
                $file_return['type'] = 'text/plain';
            }
        } elseif (isset($TheFiles['multipleFilesInput']['tmp_name'][$index_file])) {
            $file_array = array(
                'name'     => $TheFiles['multipleFilesInput']['name'][$index_file],
                'type'     => $TheFiles['multipleFilesInput']['type'][$index_file],
                'tmp_name' => $TheFiles['multipleFilesInput']['tmp_name'][$index_file],
                'error'    => $TheFiles['multipleFilesInput']['error'][$index_file],
                'size'     => $TheFiles['multipleFilesInput']['size'][$index_file],
            );
            $file_return = self::handle_asset_upload($file_array, $parent_post_id);
        }
        remove_filter('upload_dir', array(__CLASS__, 'upload_dir_for_scenes_or_assets'));
        remove_filter('intermediate_image_sizes_advanced', array(__CLASS__, 'remove_allthumbs_sizes'), 10, 2);
        unset($_REQUEST['post_id']);
        if ($file_return && empty($file_return['error'])) {
            $attachment_id = self::insert_attachment_post($file_return, $parent_post_id);
            if ($attachment_id) {
                return $attachment_id;
            }
        }
        return false;
    }
}
