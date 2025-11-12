<?php

if (!defined('ABSPATH')) {
    exit;
}

require_once(plugin_dir_path(__FILE__) . '../vrodos-scene-model.php');
require_once(plugin_dir_path(__FILE__) . '../class-vrodos-compiler-manager.php');

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
        add_action('wp_ajax_vrodos_compile_action', array($this, 'compile_action_callback'));
        add_action('wp_ajax_image_upload_action', array($this, 'image_upload_action_callback'));

        // Peer conferencing
        add_action( 'wp_ajax_nopriv_vrodos_notify_confpeers_action', array($this, 'vrodos_notify_confpeers_callback'));
        add_action( 'wp_ajax_vrodos_notify_confpeers_action', array($this, 'vrodos_notify_confpeers_callback'));
        add_action( 'wp_ajax_vrodos_update_expert_log_action', array($this, 'vrodos_update_expert_log_callback'));

        // AJAXES for semantics
        add_action( 'wp_ajax_vrodos_segment_obj_action', array($this, 'vrodos_segment_obj_action_callback') );

        add_action('wp_ajax_vrodos_fetch_list_projects_action', array($this, 'vrodos_fetch_list_projects_callback'));

        add_action('wp_ajax_vrodos_fetch_game_assets_action', array($this, 'vrodos_fetch_game_assets_action_callback'));

        add_action('wp_ajax_vrodos_delete_game_action', array($this, 'vrodos_delete_gameproject_frontend_callback'));
        add_action('wp_ajax_vrodos_create_project_action', array($this, 'vrodos_create_project_frontend_callback'));
        add_action('wp_ajax_vrodos_fetch_glb_asset_action', array($this, 'vrodos_fetch_glb_asset3d_frontend_callback'));
        add_action('wp_ajax_nopriv_vrodos_fetch_glb_asset_action', array($this, 'vrodos_fetch_glb_asset3d_frontend_callback'));
    }

    public function vrodos_create_project_frontend_callback() {
        $project_title = strip_tags($_POST['project_title']);
        $project_type_slug = $_POST['project_type_slug'];
        $taxonomy = get_term_by('slug', $project_type_slug, 'vrodos_game_type');
        $project_type_id = $taxonomy->term_id;
        $project_taxonomies = array('vrodos_game_type' => array($project_type_id));
        $project_information = array(
            'post_title' => esc_attr($project_title),
            'post_content' => '',
            'post_type' => 'vrodos_game',
            'post_status' => 'publish',
            'tax_input' => $project_taxonomies,
        );
        $project_id = wp_insert_post($project_information);
        $post = get_post($project_id);
        wp_set_object_terms($post->ID, $project_type_slug, 'vrodos_game_type');
        wp_insert_term($post->post_title, 'vrodos_scene_pgame', array('description' => '-', 'slug' => $post->post_name));
        wp_insert_term($post->post_title, 'vrodos_asset3d_pgame', array('description' => '-', 'slug' => $post->post_name));
        VRodos_Default_Scene_Manager::create_default_scenes_for_game($post->post_name, $project_type_id);
        echo $project_id;
        wp_die();
    }

    public function vrodos_delete_gameproject_frontend_callback() {
        $game_id = $_POST['game_id'];
        $game_post = get_post($game_id);
        $gameSlug = $game_post->post_name;
        $gameTitle = get_the_title($game_id);
        $assetPGame = get_term_by('slug', $gameSlug, 'vrodos_asset3d_pgame');
        $assetPGameID = $assetPGame->term_id;
        $custom_query_args1 = array(
            'post_type' => 'vrodos_asset3d',
            'posts_per_page' => -1,
            'tax_query' => array(array('taxonomy' => 'vrodos_asset3d_pgame', 'field' => 'term_id', 'terms' => $assetPGameID)),
        );
        $custom_query = new WP_Query($custom_query_args1);
        if ($custom_query->have_posts()) :
            while ($custom_query->have_posts()) :
                $custom_query->the_post();
                $asset_id = get_the_ID();
                $this->vrodos_delete_asset3d_noscenes_frontend($asset_id);
            endwhile;
        endif;
        wp_reset_postdata();
        $scenePGame = get_term_by('slug', $gameSlug, 'vrodos_scene_pgame');
        $scenePGameID = $scenePGame->term_id;
        $custom_query_args2 = array(
            'post_type' => 'vrodos_scene',
            'posts_per_page' => -1,
            'tax_query' => array(array('taxonomy' => 'vrodos_scene_pgame', 'field' => 'term_id', 'terms' => $scenePGameID)),
        );
        $custom_query2 = new WP_Query($custom_query_args2);
        if ($custom_query2->have_posts()) :
            while ($custom_query2->have_posts()) :
                $custom_query2->the_post();
                wp_delete_post(get_the_ID(), true);
            endwhile;
        endif;
        wp_reset_postdata();
        wp_delete_term($assetPGameID, 'vrodos_asset3d_pgame');
        wp_delete_term($scenePGameID, 'vrodos_scene_pgame');
        wp_delete_post($game_id, false);
        echo $gameTitle;
        wp_die();
    }

    public function vrodos_fetch_glb_asset3d_frontend_callback() {
        wp_reset_postdata();
        $asset_id = $_POST['asset_id'];
        $glbID = get_post_meta($asset_id, 'vrodos_asset3d_glb', true);
        $glbURL = wp_get_attachment_url($glbID);
        $output = new StdClass();
        $output->glbIDs = $glbID;
        $output->glbURL = $glbURL;
        print_r(json_encode($output, JSON_UNESCAPED_SLASHES));
        wp_die();
    }

    private function vrodos_delete_asset3d_noscenes_frontend($asset_id) {
        $mtlID = get_post_meta($asset_id, 'vrodos_asset3d_mtl', true);
        wp_delete_attachment($mtlID, true);
        $objID = get_post_meta($asset_id, 'vrodos_asset3d_obj', true);
        wp_delete_attachment($objID, true);
        $difID = get_post_meta($asset_id, 'vrodos_asset3d_diffimage', true);
        wp_delete_attachment($difID, true);
        $screenID = get_post_meta($asset_id, 'vrodos_asset3d_screenimage', true);
        wp_delete_attachment($screenID, true);
        wp_delete_post($asset_id, true);
    }

    //=============================== SEMANTICS ON 3D ============================================================

    // ---- AJAX SEMANTICS 1: run segmentation ----------
    public function vrodos_segment_obj_action_callback() {

        $DS = DIRECTORY_SEPARATOR;
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {

            $curr_folder = wp_upload_dir()['basedir'].$DS.$_POST['path'];
            $curr_folder = str_replace('/','\\',$curr_folder); // full path

            $batfile = wp_upload_dir()['basedir'].$DS.$_POST['path']."segment.bat";


            $batfile = str_replace('/','\\',$batfile); // full path

            $fnameobj = basename($_POST['obj']);

            $fnameobj = $curr_folder.$fnameobj;

            // 1 : Generate bat
            $myfile = fopen($batfile, "w") or die("Unable to open file!");

            $outputpath = wp_upload_dir()['basedir'].$DS.$_POST['path'];
            $outputpath = str_replace('/','\\',$outputpath); // full path

            $exefile = untrailingslashit(plugin_dir_path(__FILE__)).'\..\semantics\segment3D\pclTesting.exe';
            $exefile = str_replace("/", "\\", $exefile);

            $iter = $_POST['iter'];
            $minDist = $_POST['minDist'];
            $maxDist = $_POST['maxDist'];
            $minPoints = $_POST['minPoints'];
            $maxPoints = $_POST['maxPoints'];
            //$exefile.' '.$fnameobj.' '.$iter.' 0.01 0.2 100 25000 1 '.$outputpath.PHP_EOL.

            $txt = '@echo off'.PHP_EOL.
                $exefile.' '.$fnameobj.' '.$iter.' '.$minDist.' '.$maxDist.' '.$minPoints.' '.$maxPoints.' 1 '.$outputpath.PHP_EOL.
                'del "*.pcd"'.PHP_EOL.
                'del "barycenters.txt"';

            fwrite($myfile, $txt);
            fclose($myfile);

            shell_exec('del "'.$outputpath.'log.txt"');
            shell_exec('del "'.$outputpath.'cloud_cluster*.obj"');
            shell_exec('del "'.$outputpath.'cloud_plane*.obj"');

            // 2: run bat
            $output = shell_exec($batfile);
            echo $output;

        } else { // LINUX SERVER // TODO

    //        $game_dirpath = realpath(dirname(__FILE__).'/..').$DS.'test_compiler'.$DS.'game_linux'; //$_GET['game_dirpath'];
    //
    //        // 1 : Generate sh
    //        $myfile = fopen($game_dirpath.$DS."starter_artificial.sh", "w") or print("Unable to open file!");
    //        $txt = "#/bin/bash"."\n".
    //            "projectPath=`pwd`"."\n".
    //            "xvfb-run --auto-servernum --server-args='-screen 0 1024x768x24:32' /opt/Unity/Editor/Unity -batchmode -nographics -logfile stdout.log -force-opengl -quit -projectPath ${projectPath} -buildWindowsPlayer 'builds/myg3.exe'";
    //        fwrite($myfile, $txt);
    //        fclose($myfile);
    //
    //        // 2: run sh (nohup     '/dev ...' ensures that it is asynchronous called)
    //        $output = shell_exec('nohup sh starter_artificial.sh'.'> /dev/null 2>/dev/null &');
        }

        wp_die();
    }

    //======================= CONTENT INTERLINKING =========================================================================


    public function vrodos_notify_confpeers_callback(){

        $ff = fopen("confroom_log.txt","a");

        fwrite($ff,chr(10));

        date_default_timezone_set("Europe/Sofia");

        $strDate = "<tr><td> +1 user</td><td>".$_POST['confroom']."</td><td>".date('d-m-y')."</td><td>".date('h:i:s')."</td></tr>:::".time().":::".$_POST['confroom'];
        fwrite($ff, $strDate);
        fclose($ff);

    //    if (document.getElementById("ConfRoomReport"))
    //        document.getElementById("ConfRoomReport").innerHTML = "1 user in room:".$_POST['confroom'];

        echo $strDate;


        wp_die();
    }

    // Read log content from conferences
    public function vrodos_update_expert_log_callback()
    {
        // reset
        //unlink("wp-admin/confroom_log.txt");
        if (!file_exists("confroom_log.txt"))
            return;

        $file = file("confroom_log.txt");

        $file = str_replace("\n", " ", $file);
        $file = array_reverse($file);

        $content = '';

        $alerting = [];
        $rooming = [];

        //    $ff = fopen("output_rooming.txt","w");
        //    fwrite($ff, chr(10));

        $index_max_recs=0;
        foreach ($file as $f) {

            if ($index_max_recs < 12) {

                $f = str_replace("\n", " ", $f);

                list($f, $timestamp, $room) = explode(":::", $f);

                //            fwrite($ff, time() . " " . $timestamp . " " . (time() - $timestamp));
                //            fwrite($ff, chr(10));


                if (time() - $timestamp < 20) {
                    $alerting[] = $timestamp;
                    $rooming[] = $room;
                }

                $content = $content . $f;

                $index_max_recs += 1;
            }
        }
        //    fclose($ff);

        $total_content = json_encode([$content, $alerting, $rooming]);

        echo $total_content;

        wp_die();
    }

    /**
     * Saves the scene via AJAX.
     */
    public function save_scene_async_action_callback()
    {
        // Save screenshot
        if (isset($_POST['scene_screenshot'])) {
            $attachment_id = VRodos_Upload_Manager::upload_scene_screenshot(
                $_POST['scene_screenshot'],
                'scene_'.$_POST['scene_id'].'_featimg',
                $_POST['scene_id'],
                'jpg');

            // Set thumbnail of post
            set_post_thumbnail( $_POST['scene_id'], $attachment_id );
        }

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
        if ( ! isset( $_POST['post_revision_no'] ) ) {
            wp_send_json_error( 'Missing revision number.' );
        }

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
        if ( ! isset( $_POST['post_revision_no'] ) ) {
            wp_send_json_error( 'Missing revision number.' );
        }

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

    // DELETE specific SCENE
    public function delete_scene_frontend_callback(){

        $scene_id = $_POST['scene_id'];
        $postTitle = get_the_title($scene_id);

        //1. Delete screenshot of scene
        $postmeta = get_post_meta($scene_id);

        if (isset($postmeta['_thumbnail_id'])) {
            $thumb_id = $postmeta['_thumbnail_id'][0];
            $attached_file = get_post_meta($thumb_id, '_wp_attached_file', true);

            if (file_exists($attached_file)) {
                unlink($attached_file);
            }

            //2. Delete meta
            delete_post_meta( $thumb_id, '_wp_attached_file' );
            delete_post_meta( $thumb_id, '_wp_attachment_metadata' );
        }

        //3. Delete Scene CUSTOM POST
        wp_delete_post( $scene_id, true );

        //4. Delete Thumbnail post
        if (isset($postmeta['_thumbnail_id'])) {
            wp_delete_post($thumb_id, true);
        }

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
            // This part handles all attachments: textures, GLB, screenshot.
            $args = array(
                'post_parent'    => $asset_id,
                'post_type'      => 'attachment',
                'posts_per_page' => -1,
            );
            $attachments = get_children($args);

            if ($attachments) {
                $site_url = get_site_url();

                foreach ($attachments as $attachment) {
                    $file_url = wp_get_attachment_url($attachment->ID);

                    // The path stored is a URL. We need to convert it to a server path.
                    // We do this by replacing the site's URL with the site's absolute path.
                    $file_path = str_replace($site_url, ABSPATH, $file_url);

                    // Normalize slashes to be safe across operating systems.
                    $file_path = wp_normalize_path($file_path);

                    if (file_exists($file_path)) {
                        wp_delete_file($file_path);
                    }

                    // This will handle the database entry and any thumbnails.
                    wp_delete_attachment($attachment->ID, true);
                }
            }
        }

        // Delete all uses of Asset from Scenes (json)
        VRodos_Core_Manager::vrodos_delete_asset_3d_from_scenes($asset_id, $gameSlug);

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

    public function image_upload_action_callback(){

        $DS = DIRECTORY_SEPARATOR;

        $project_id = $_POST["projectid"];
        $scene_id = $_POST["sceneid"];

        add_filter( 'intermediate_image_sizes_advanced', 'vrodos_remove_allthumbs_sizes', 10, 2 );
        require_once( ABSPATH . 'wp-admin/includes/admin.php' );

        // DELETE EXISTING FILE: See if has already a thumbnail and delete the file in the filesystem
        $scene_background_ids = get_post_meta($scene_id,'vrodos_scene_bg_image');
        if (!empty($scene_background_ids) && !empty($scene_background_ids[0])) {
            // Remove previous file from file system

            $prevMeta = get_post_meta($scene_background_ids[0], '_wp_attachment_metadata', false);

            if (count($prevMeta)>0) {
                if (file_exists($prevMeta[0]['file'])) {
                    unlink($prevMeta[0]['file']);
                }
            }
        }

        $upload_dir = wp_upload_dir();
        $upload_path = str_replace('/',$DS,$upload_dir['basedir']) . $DS . 'scenes' . $DS . $scene_id . $DS;

        // Make Scene folder
        if (!is_dir($upload_path)) {
            mkdir( $upload_path, 0777, true );
        }

        $image = $_POST["image"];
        $fn = $_POST["filename"];
        $ext = $_POST["imagetype"];

        $hashed_filename = $project_id .'_'. time() . '_' . $scene_id.'_bg.'. $ext;

        // Write file string to a file in server
        file_put_contents($upload_path . $hashed_filename,
            base64_decode(substr($image, strpos($image, ",") + 1)));

        $new_filename = str_replace("\\","/", $upload_path .$hashed_filename);

        //--- End of upload ---

        // DATABASE UPDATE
        // If post meta already exists
        if (!empty($scene_background_ids) && !empty($scene_background_ids[0])) {

            $scene_bg_id = $scene_background_ids[0];

            // Update the post title into the database
            wp_update_post( array('ID' => $scene_bg_id, 'post_title' => $new_filename));

            // Update meta _wp_attached_file
            update_post_meta($scene_bg_id, '_wp_attached_file', $new_filename);

            // update also _attachment_meta
            $data = wp_get_attachment_metadata( $scene_bg_id);

            $data['file'] = $new_filename;

            wp_update_attachment_metadata( $scene_bg_id, $data );

            update_post_meta($scene_id, 'vrodos_scene_bg_image', $scene_bg_id);

        } else { // If post does not exist

            $attachment = array(
                'post_mime_type' => 'image/' .$ext,
                'post_title' => preg_replace('/\.[^.]+$/', '', basename($new_filename)),
                'post_content' => '',
                'post_status' => 'inherit',
                'guid' => $upload_path.$hashed_filename
            );

            // Attach to
            $attachment_id = wp_insert_attachment($attachment, $new_filename, $scene_id);

            require_once(ABSPATH . 'wp-admin/includes/image.php');

            $attachment_data = wp_generate_attachment_metadata($attachment_id, $new_filename);

            wp_update_attachment_metadata($attachment_id, $attachment_data);

            update_post_meta($scene_id, 'vrodos_scene_bg_image', $attachment_id);

            remove_filter('intermediate_image_sizes_advanced',
                'vrodos_remove_allthumbs_sizes', 10);

            // if (0 < intval($attachment_id, 10)) {
            // 	return $attachment_id;
            // }

        }

        $final_path = $attachment_id ? wp_get_attachment_url( $attachment_id ) : wp_get_attachment_url( $scene_bg_id );

        $content = json_encode(array( 'url' => $final_path ));

        echo $content;

        wp_die();

    }

    public function compile_action_callback(){

        //$projectId = $_REQUEST['vrodos_game'];
        $sceneId = $_REQUEST['vrodos_scene'];
        $projectId = $_REQUEST['projectId'];
        $showPawnPositions = isset($_REQUEST['showPawnPositions']) ? $_REQUEST['showPawnPositions'] : 'false';
        //$projectSlug = $_REQUEST['projectSlug'];

        //$asset_id_temp = get_the_ID();
        $parent_id = wp_get_post_terms($sceneId, 'vrodos_scene_pgame');
        $parent_id = reset($parent_id)->term_id;

        $sceneIdList = VRodos_Core_Manager::vrodos_get_all_sceneids_of_game($parent_id);

        $compiler = new VRodos_Compiler_Manager();
        $scene_json = $compiler->compile_aframe($projectId, $sceneIdList, $showPawnPositions);
        echo $scene_json;
        wp_die();

    }



    // Fetch list of project through ajax
    public function vrodos_fetch_list_projects_callback() {

    $f = fopen("output_ajax_delay.txt", "w");

    $user_id = $_POST['current_user_id'];

    $perma_structure = (bool)get_option('permalink_structure');
    $parameter_Scenepass = $perma_structure ? '?vrodos_scene=' : '&vrodos_scene=';

    // Define custom query parameters
    $custom_query_args = array(
        'post_type' => 'vrodos_game',
        'posts_per_page' => -1,
    );

//    if (current_user_can('administrator')){
//
//    } elseif (current_user_can('adv_project_master')) {
//        //$custom_query_args['author'] = $user_id;
//
//    }elseif (current_user_can('game_master')) {
//        //$custom_query_args['author'] = $user_id;
//    }


    // Get current page and append to custom query parameters array
    //$custom_query_args['paged'] = get_query_var( 'paged' ) ? get_query_var( 'paged' ) : 1;

    // Instantiate custom query
    $custom_query = new WP_Query($custom_query_args);

    //$fp = fopen("output_ccq.txt","w");

    // Pagination fix
    //$temp_query = $wp_query;
    //$wp_query = NULL;
    //$wp_query = $custom_query;

    // Output custom query loop
    if ($custom_query->have_posts()){

        $mt3 = explode(' ', microtime());
        $t3 = ((int)$mt3[1]) * 1000 + ((int)round($mt3[0] * 1000));

        fwrite($f, "Step 3:".$t3.chr(13));

        echo '<ul class="mdc-list mdc-list--two-line mdc-list--avatar-list" style="max-height: 460px; overflow-y: auto">';
        while ($custom_query->have_posts()) :

            $mt4 = explode(' ', microtime());
            $t4 = ((int)$mt4[1]) * 1000 + ((int)round($mt4[0] * 1000));

            fwrite($f, "Step 4:".$t4.chr(13));

            $custom_query->the_post();



//           elseif (current_user_can('game_master')) {
//                //$custom_query_args['author'] = $user_id;
//            }



            $game_id = get_the_ID();
            $game_title = get_the_title();
            $game_date = get_the_date();
            //$game_link = get_permalink();


            // Do not show Joker projects
            if (strpos($game_title, ' Joker') !== false)
                continue;

            $game_type_obj = VRodos_Core_Manager::vrodos_return_project_type($game_id);

            $all_game_category = get_the_terms( $game_id, 'vrodos_game_type' );
            $game_category     = $all_game_category[0]->slug;
            $scene_data = VRodos_Core_Manager::vrodos_getFirstSceneID_byProjectID($game_id,$game_category);//first 3D scene id

            $editscenePage = VRodos_Core_Manager::vrodos_getEditpage('scene');

            $edit_scene_page_id = $editscenePage[0]->ID;

            $loadMainSceneLink = esc_url( (get_permalink($edit_scene_page_id) . $parameter_Scenepass . $scene_data['id'] . '&vrodos_game=' . $game_id . '&scene_type=' . $scene_data['type']));


            $assets_list_page =  VRodos_Core_Manager::vrodos_getEditpage('assetslist');
            $assets_list_page_id = $assets_list_page[0]->ID;
            $loadProjectAssets = esc_url( get_permalink($assets_list_page_id) . '?vrodos_project_id=' . $game_id );


            echo '<li class="mdc-list-item" style="" id="'. $game_id.'">';

            // Href when press on title
            echo '<span class="mdc-list-item" style="float:left" data-mdc-auto-init="MDCRipple" title="Open '.$game_title.'">';
            echo '<i class="material-icons mdc-list-item__start-detail" aria-hidden="true" title="'.$game_type_obj->string.'">'.$game_type_obj->icon.'</i>';
            echo '<span id="'.$game_id.'-title" class="mdc-list-item__text">'.$game_title.'<span id="'.$game_id.'-date" class="mdc-list-item__text__secondary">'.$game_date.'</span>'.
                '</span>';
            echo '</span>';



            // VR button: Go to 3D Editor

            echo '<div style="margin-left:auto; margin-right:0">';

            // ----- Assets button ------------------
            echo '<a href="'.$loadProjectAssets.'" class="" style="" data-mdc-auto-init="MDCRipple" '.
                'title="Manage assets of '.$game_title.'">';
            echo '<span id="'.$game_id.'-assets-button" class="mdc-button" >Assets</span>';
            echo '</a>';

            // --------- 3D editor button -----------
            echo '<a id="3d-editor-bt-'.$game_id.'" href="'.$loadMainSceneLink.'" class="" style="" data-mdc-auto-init="MDCRipple" '.
                'title="Open 3D Editor for '.$game_title.'">';
            echo '<span id="'.$game_id.'-vr-button" class="mdc-button" >3D_Editor</span>';
            echo '</a>';

            // -------- Delete button ----------------
            echo '<a href="javascript:void(0)" class="" style="" aria-label="Delete game" title="Delete project" '.
                'onclick="deleteProject('.$game_id.')">';
            echo '<i class="material-icons mdc-button mdc-list-item__end-detail" style="color: crimson" '
                .'aria-hidden="true" title="Delete project">delete</i>';
            echo '</a>';

            echo '<div>';
            echo '</li>';
        endwhile;

        echo '</ul>';



        wp_reset_postdata();
        //$wp_query = NULL;
        //$wp_query = $temp_query;


    } else {

        echo '<hr class="WhiteSpaceSeparator">';
        echo '<div class="CenterContents">' .
            '<i class="material-icons mdc-theme--text-icon-on-light" style="font-size: 96px;" aria-hidden="true"' .
            ' title="No projects available">' .
            'games' .
            '</i>'.
            '<h3 class="mdc-typography--headline"> projects available</h3>' .
            '<hr class="WhiteSpaceSeparator">'.
            '<h4 class="mdc-typography--title mdc-theme--text-secondary-on-light">'.
            'You can try creating a new one</h4>';
        echo '</div>';
    }

    wp_die();
}

    public function vrodos_fetch_game_assets_action_callback() {


        // Output the directory listing as JSON
        header('Content-type: application/json');

        $response = VRodos_Core_Manager::vrodos_get_assets_by_game($_POST['gameProjectSlug'], $_POST['gameProjectID']);

        for ($i=0; $i<count($response); $i++) {
            if (isset($response[$i]['assetName'])) {
                $response[$i]['name'] = $response[$i]['assetName'];
                $response[$i]['type'] = 'file';
            }
        }

        $jsonResp =  json_encode(
            array(
                "items" => $response
            )
        );

        echo $jsonResp;
        wp_die();
    }
}
