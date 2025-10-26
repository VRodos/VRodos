<?php

if (!defined('ABSPATH')) {
    exit;
}

require_once(plugin_dir_path(__FILE__) . '../vrodos-scene-model.php');

class VRodos_AJAX_Handler {

    public function __construct() {
        add_action('wp_ajax_vrodos_save_scene_async_action', array($this, 'save_scene_async_action_callback'));
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
}
