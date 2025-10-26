<?php

if (!defined('ABSPATH')) {
    exit;
}

require_once(plugin_dir_path(__FILE__) . '../vrodos-scene-model.php');

class VRodos_AJAX_Handler {

    public function __construct() {
        add_action('wp_ajax_vrodos_save_scene_async_action', array($this, 'save_scene_async_action_callback'));
        add_action('wp_ajax_vrodos_undo_scene_async_action', array($this, 'undo_scene_async_action_callback'));
        add_action('wp_ajax_vrodos_redo_scene_async_action', array($this, 'redo_scene_async_action_callback'));
    }

    /**
     * Saves the scene via AJAX.
     */
    public function save_scene_async_action_callback()
    {
        // Save screenshot
        if (isset($_POST['scene_screenshot']))
            $attachment_id = vrodos_upload_scene_screenshot(
                $_POST['scene_screenshot'],
                'scene_'.$_POST['scene_id'].'_featimg',
                $_POST['scene_id'],
                'jpg',
                true);

        // Set thumbnail of post
        set_post_thumbnail( $_POST['scene_id'], $attachment_id );

        // Create a new scene model and populate it from the posted JSON.
        $scene_model = new Vrodos_Scene_Model(wp_unslash($_POST['scene_json']));

        // Save json of scene
        $scene_new_info = array(
            'ID' => $_POST['scene_id'],
            'post_title' => $_POST['scene_title'],
            'post_content' => $scene_model->to_json()
        );

        $res = wp_update_post($scene_new_info);
        update_post_meta($_POST['scene_id'], 'vrodos_scene_caption', $_POST['scene_caption']);

        echo $res!=0 ? 'true' : 'false';
        wp_die();
    }

    // Undo button for scenes
    public function undo_scene_async_action_callback()
    {
        //$ff = fopen("undo.log","w");

        $revision_number = $_POST['post_revision_no'];
        $current_scene_id = $_POST['scene_id'];

//    fwrite($ff, $current_scene_id);
//    fwrite($ff, $revision_number);
//

        $rev = wp_get_post_revisions( $current_scene_id,
            [
                'offset'           => $revision_number,    // Start from the previous change
                'posts_per_page'  => 1,    // Only a single revision
                'post_name__in'   => [ "{$current_scene_id}-revision-v1" ],
                'check_enabled'   => false,
            ]
        );
        $sceneToLoad = reset($rev)->post_content;

//    fwrite($ff, $sceneToLoad);
//    fclose($ff);


        echo $sceneToLoad;
        wp_die();
    }



    // Redo button for scenes
    public function redo_scene_async_action_callback()
    {
        if (isset($_POST['scene_screenshot'])){
            $attachment_id = vrodos_upload_scene_screenshot(
                $_POST['scene_screenshot'],
                'scene_'.$_POST['scene_id'].'_featimg',
                $_POST['scene_id'],
                'jpg' ,
                true);

            set_post_thumbnail( $_POST['scene_id'], $attachment_id );
        }

        $scene_new_info = array(
            'ID' => $_POST['scene_id'],
            'post_title' => $_POST['scene_title'],
            'post_content' => wp_unslash($_POST['scene_json'])
        );

        $res = wp_update_post($scene_new_info);
        update_post_meta($_POST['scene_id'], 'vrodos_scene_caption', $_POST['scene_caption']);

        echo $res!=0 ? 'true' : 'false';
        wp_die();
    }
}
