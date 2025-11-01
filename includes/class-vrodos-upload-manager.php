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
}
