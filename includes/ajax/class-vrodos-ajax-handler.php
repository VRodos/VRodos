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
        add_action('wp_ajax_vrodos_delete_scene_action', array($this, 'delete_scene_frontend_callback'));
        add_action('wp_ajax_vrodos_fetch_description_action', array($this, 'fetch_description_action_callback'));
        add_action('wp_ajax_vrodos_fetch_image_action', array($this, 'fetch_image_action_callback'));
        add_action('wp_ajax_vrodos_fetch_video_action', array($this, 'fetch_video_action_callback'));
        add_action('wp_ajax_vrodos_delete_asset_action', array($this, 'delete_asset3d_frontend_callback'));
        add_action('wp_ajax_vrodos_fetch_assetmeta_action', array($this, 'fetch_asset3d_meta_backend_callback'));
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
        $revision_number = $_POST['post_revision_no'];
        $current_scene_id = $_POST['scene_id'];

        $rev = wp_get_post_revisions( $current_scene_id,
            [
                'offset'           => $revision_number,    // Start from the previous change
                'posts_per_page'  => 1,    // Only a single revision
                'post_name__in'   => [ "{$current_scene_id}-revision-v1" ],
                'check_enabled'   => false,
            ]
        );
        $sceneToLoad = reset($rev)->post_content;

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

    //DELETE spesific SCENE
    public function delete_scene_frontend_callback(){

        $scene_id = $_POST['scene_id'];
        $postTitle = get_the_title($scene_id);

        //1. Delete screenshot of scene
        $postmeta = get_post_meta($scene_id);

        $thumb_id = $postmeta['_thumbnail_id'][0];

        $attached_file = get_post_meta($thumb_id, '_wp_attached_file',true);

        if (file_exists($attached_file)) {
            unlink($attached_file);
        }

        //2. Delete meta
        delete_post_meta( $thumb_id, '_wp_attached_file' );
        delete_post_meta( $thumb_id, '_wp_attachment_metadata' );

        //3. Delete Scene CUSTOM POST
        wp_delete_post( $scene_id, true );

        //4. Delete Thumbnail post
        wp_delete_post( $thumb_id, true );

        echo $postTitle;

        wp_die();
    }

    public function fetch_description_action_callback(){

        if ($_POST['externalSource']=='Wikipedia')
            $url = 'https://'.$_POST['lang'].'.wikipedia.org/w/api.php?action=query&format=json&exlimit=3&prop=extracts&'.$_POST['fulltext'].'titles='.$_POST['titles'];
        else
            $url = 'https://www.europeana.eu/api/v2/search.json?wskey=8mfU6ZgfW&query='.$_POST['titles'];//.'&qf=LANGUAGE:'.$_POST['lang'];

        echo  strip_tags(file_get_contents($url));

        wp_die();
    }

    public function fetch_image_action_callback(){

        if ($_POST['externalSource_image']=='Wikipedia')
            $url = 'https://'.$_POST['lang_image'].'.wikipedia.org/w/api.php?action=query&prop=imageinfo&format=json&iiprop=url&generator=images&titles='.$_POST['titles_image'];
        else
            $url = 'https://www.europeana.eu/api/v2/search.json?wskey=8mfU6ZgfW&query='.$_POST['titles_image'];//.'&qf=LANGUAGE:'.$_POST['lang_image'];

        echo file_get_contents($url);

        wp_die();
    }

    public function fetch_video_action_callback(){

        if ($_POST['externalSource_video']=='Wikipedia'){
            $url = 'https://'.$_POST['lang_video'].'.wikipedia.org/w/api.php?action=query&format=json&prop=videoinfo&viprop=derivatives&titles=File:'.$_POST['titles_video'].'.ogv';
        } else {
            $url = 'https://www.europeana.eu/api/v2/search.json?wskey=8mfU6ZgfW&query='.$_POST['titles_image'];//.'&qf=LANGUAGE:'.$_POST['lang_image'];
        }

        $content = file_get_contents($url);
        echo $content;

        wp_die();
    }

    public function delete_asset3d_frontend_callback(){

        $asset_id = $_POST['asset_id'];
        $gameSlug = $_POST['game_slug'];
        $isCloned = $_POST['isCloned'];

        // If it is not cloned then it is safe to delete the meta files.
        if ($isCloned==='false') {

            $containerFolder = wp_upload_dir()['basedir'].'/models/';

            // Get texture attachments of post
            $args = array(
                'posts_per_page' => 100,
                'order'          => 'DESC',
                'post_parent'    => $asset_id
            );

            $attachments_array =  get_children( $args,OBJECT );  //returns Array ( [$image_ID].

            // Add texture urls to a string separated by |

            foreach ($attachments_array as $k){
                $child_post_id = $k->ID;

                // Delete the file from the system
                wp_delete_file($containerFolder.basename(get_attached_file($child_post_id)));

                // Delete attachment
                wp_delete_attachment($child_post_id, true); // True : Not go to trash
            }


            // ---------- GLB -------
            $glbID = get_post_meta($asset_id, 'vrodos_asset3d_glb', true);

            // Delete the file from the system
            wp_delete_file($containerFolder.basename(get_attached_file($glbID)));

            // Delete attachment
            wp_delete_attachment($glbID, true);



            // ---------- Screenshot ---------------
            $screenID = get_post_meta($asset_id, 'vrodos_asset3d_screenimage', true);

            // Delete the file from the system
            wp_delete_file($containerFolder.basename(get_attached_file($screenID)));

            // Delete attachment
            wp_delete_attachment($screenID, true);
        }

        // Delete all uses of Asset from Scenes (json)
        vrodos_delete_asset3d_from_games_and_scenes($asset_id, $gameSlug);

        // Delete Asset post from SQL database
        wp_delete_post( $asset_id, true );

        echo $asset_id;

        wp_die();
    }

    public function fetch_asset3d_meta_backend_callback(){

        $asset_id = $_POST['asset_id'];

        $output = new StdClass();
        $output -> assettrs_saved = get_post_meta($asset_id,'vrodos_asset3d_assettrs', true);

        print_r(json_encode($output, JSON_UNESCAPED_SLASHES));
        wp_die();
    }
}
