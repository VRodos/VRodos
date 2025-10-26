<?php

if (!defined('ABSPATH')) {
    exit;
}

require_once(plugin_dir_path(__FILE__) . '../vrodos-scene-model.php');

class VRodos_AJAX_Handler {

    public function __construct() {
        add_action('wp_ajax_vrodos_save_scene_async_action', array($this, 'save_scene_async_action_callback'));
        add_action('wp_ajax_vrodos_fetch_game_assets_action', array($this, 'fetch_game_assets_action_callback'));
        add_action('wp_ajax_vrodos_delete_game_action', array($this, 'delete_gameproject_frontend_callback'));
        add_action('wp_ajax_vrodos_collaborate_project_action', array($this, 'collaborate_project_frontend_callback'));
        add_action('wp_ajax_vrodos_fetch_collaborators_action', array($this, 'fetch_collaborators_frontend_callback'));
        add_action('wp_ajax_vrodos_create_project_action', array($this, 'create_project_frontend_callback'));
        add_action('wp_ajax_vrodos_fetch_list_projects_action', array($this, 'fetch_list_projects_callback'));
    }

    /**
     * AJAX handler for fetching game assets.
     */
    public function fetch_game_assets_action_callback() {
        // Output the directory listing as JSON
        header('Content-type: application/json');

        $response = $this->get_assets_by_game($_POST['gameProjectSlug'], $_POST['gameProjectID']);

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

    /**
     * Get the Assets of a game plus its respective joker game assets.
     *
     * @param $gameProjectSlug
     * @param $gameProjectID
     * @return array
     */
    private function get_assets_by_game($gameProjectSlug, $gameProjectID){

        $allAssets = [];

        $queryargs = array(
            'post_type' => 'vrodos_asset3d',
            'posts_per_page' => -1,
            'tax_query' => array(
                array(
                    'taxonomy' => 'vrodos_asset3d_pgame',
                    'field' => 'slug',
                    'terms' => array($gameProjectSlug, 'vrexpo-joker', 'archaeology-joker', 'virtualproduction-joker')
                )
            )
        );

        $custom_query = new WP_Query( $queryargs );

        if ( $custom_query->have_posts() ) :
            while ( $custom_query->have_posts() ) :

                $custom_query->the_post();

                $asset_id = get_the_ID();
                $asset_cat_arr = wp_get_post_terms($asset_id, 'vrodos_asset3d_cat');

                $glbID = get_post_meta($asset_id, 'vrodos_asset3d_glb', true); // GLB ID
                $glbPath = $glbID ? wp_get_attachment_url( $glbID ) : '';                   // GLB PATH


                $sshotID = get_post_meta($asset_id, 'vrodos_asset3d_screenimage', true); // Screenshot Image ID
                $sshotPath = $sshotID ? wp_get_attachment_url( $sshotID ) : '';           // Screenshot Image PATH

                $data_arr = [
                    'asset_name'=>get_the_title(),
                    'asset_slug'=>get_post()->post_name,
                    'asset_id'=>$asset_id,
                    'category_name'=>$asset_cat_arr[0]->name,
                    'category_slug'=>$asset_cat_arr[0]->slug,
                    'category_id'=>$asset_cat_arr[0]->term_id,
                    'category_icon'=> get_term_meta($asset_cat_arr[0]->term_id, 'vrodos_assetcat_icon', true),
                    'glb_id'=>$glbID,
                    'glb_path'=>$glbPath,
                    'path'=>$glbPath,
                    'screenshot_id'=>$sshotID,
                    'screenshot_path'=>$sshotPath,
                    'is_cloned'=> get_post_meta($asset_id, 'vrodos_asset3d_isCloned', true),
                    'is_joker'=> get_post_meta($asset_id, 'vrodos_asset3d_isJoker', true)
                ];

                switch ($asset_cat_arr[0]->slug) {
                    case 'video':
                        $data_arr['video_id'] = get_post_meta($asset_id, 'vrodos_asset3d_video', true);
                        $data_arr['video_path'] = wp_get_attachment_url( $data_arr['video_id'] );
                        $data_arr['video_title'] = get_post_meta($asset_id, 'vrodos_asset3d_video_title', true);
                        $data_arr['video_loop'] = get_post_meta($asset_id, 'vrodos_asset3d_video_autoloop', true);
                        break;
                    case 'poi-imagetext':
                        $data_arr['poi_img_id'] = get_post_meta($asset_id, 'vrodos_asset3d_poi_imgtxt_image', true);
                        $data_arr['poi_img_path'] = wp_get_attachment_url( $data_arr['poi_img_id'] );
                        $data_arr['poi_img_title'] = get_post_meta($asset_id, 'vrodos_asset3d_poi_imgtxt_title', true);
                        $data_arr['poi_img_content'] = get_post_meta($asset_id, 'vrodos_asset3d_poi_imgtxt_content', true);
                        break;
                    case 'poi-link':
                        $data_arr['poi_link_url'] = get_post_meta($asset_id, 'vrodos_asset3d_link', true);
                        break;
                    case 'chat':
                        $data_arr['poi_chat_title'] = get_post_meta($asset_id, 'vrodos_asset3d_poi_chattxt_title', true);
                        $data_arr['poi_chat_participants'] = get_post_meta($asset_id, 'vrodos_asset3d_poi_chatnum_people', true);
                        $data_arr['poi_chat_indicators'] = get_post_meta($asset_id, 'vrodos_asset3d_poi_chatbut_indicators', true);
                        break;
                }

                array_push($allAssets, $data_arr);

            endwhile;
        endif;

        // Reset postdata
        wp_reset_postdata();

        return $allAssets;
    }


    //DELETE GAME PROJECT
    public function delete_gameproject_frontend_callback(){

        $game_id = $_POST['game_id'];

        $game_post = get_post($game_id);
        $gameSlug = $game_post->post_name;
        $gameTitle = get_the_title( $game_id );

        //1.Delete Assets
        $assetPGame = get_term_by('slug', $gameSlug, 'vrodos_asset3d_pgame');
        $assetPGameID = $assetPGame->term_id;

        $custom_query_args1 = array(
            'post_type' => 'vrodos_asset3d',
            'posts_per_page' => -1,
            'tax_query' => array(
                array(
                    'taxonomy' => 'vrodos_asset3d_pgame',
                    'field'    => 'term_id',
                    'terms'    => $assetPGameID,
                ),
            ),
        );
        // Instantiate custom query
        $custom_query = new WP_Query( $custom_query_args1 );
        // Output custom query loop
        if ( $custom_query->have_posts() ) :
            while ( $custom_query->have_posts() ) :
                $custom_query->the_post();
                $asset_id = get_the_ID();
                $this->delete_asset3d_noscenes_frontend($asset_id);
            endwhile;
        endif;

        wp_reset_postdata();

        //2.Delete Scenes
        $scenePGame = get_term_by('slug', $gameSlug, 'vrodos_scene_pgame');
        $scenePGameID = $scenePGame->term_id;

        $custom_query_args2 = array(
            'post_type' => 'vrodos_scene',
            'posts_per_page' => -1,
            'tax_query' => array(
                array(
                    'taxonomy' => 'vrodos_scene_pgame',
                    'field'    => 'term_id',
                    'terms'    => $scenePGameID,
                ),
            ),
        );
        // Instantiate custom query
        $custom_query2 = new WP_Query( $custom_query_args2 );
        // Output custom query loop
        if ( $custom_query2->have_posts() ) :
            while ( $custom_query2->have_posts() ) :
                $custom_query2->the_post();
                $scene_id = get_the_ID();

                // Delete scene
                wp_delete_post( $scene_id, true );

            endwhile;
        endif;

        wp_reset_postdata();

        //3. Delete taxonomies from Assets & Scenes
        wp_delete_term( $assetPGameID, 'vrodos_asset3d_pgame' );
        wp_delete_term( $scenePGameID, 'vrodos_scene_pgame' );

        //5. Delete Game CUSTOM POST
        wp_delete_post( $game_id, false );

        echo $gameTitle;

        wp_die();
    }

    private function delete_asset3d_noscenes_frontend($asset_id){
        // No need to delete assets from scenes, cause scene will be deleted at the same event

        //1. Delete all Attachments (mtl/obj/jpg ...)
        $mtlID = get_post_meta($asset_id,'vrodos_asset3d_mtl', true);
        wp_delete_attachment( $mtlID,true );
        $objID = get_post_meta($asset_id,'vrodos_asset3d_obj', true);
        wp_delete_attachment( $objID,true );
        $difID = get_post_meta($asset_id,'vrodos_asset3d_diffimage', true);
        wp_delete_attachment( $difID,true );
        $screenID = get_post_meta($asset_id,'vrodos_asset3d_screenimage', true);
        wp_delete_attachment( $screenID,true );

        //2. Delete Asset3D CUSTOM POST
        wp_delete_post( $asset_id, true );

    }

    //UPDATE LIST OF COLLABORATORS ON PROJECT
    public function collaborate_project_frontend_callback()
    {
        $project_id = $_POST['project_id'];
        $collabs_emails = $_POST['collabs_emails'];
        $collabs_emails = explode(';', $collabs_emails);

        // From email get id
        $collabs_ids = '';
        foreach ($collabs_emails as $collab_email) {
            $collab_id_data = get_user_by('email', $collab_email)->data;
            if (!$collab_id_data)
                echo "ERROR 190520: an email was invalid";
            else
                $collabs_ids .= ';'.$collab_id_data->ID;
        }

        update_post_meta($project_id, 'vrodos_project_collaborators_ids', $collabs_ids);
        wp_die();
    }


    public function fetch_collaborators_frontend_callback()
    {
        $project_id = $_POST['project_id'];
        $collabs_ids = get_post_meta($project_id, 'vrodos_project_collaborators_ids', true);

        $collabs_ids = explode(';',$collabs_ids);

        $collabs_emails = '';
        foreach ($collabs_ids as $collab_id) {
            $collabs_emails =  $collabs_emails . ';' . get_user_by('id', $collab_id)->user_email;
        }

        $collabs_emails = ltrim($collabs_emails, ";");
        $collabs_emails = rtrim($collabs_emails, ";");

        echo $collabs_emails;
        wp_die();
    }


    // CREATE PROJECT
    public function create_project_frontend_callback() {

        // Project title
        $project_title =  strip_tags($_POST['project_title']);
        $project_type_slug = $_POST['project_type_slug'];

        $taxonomy = get_term_by('slug', $project_type_slug, 'vrodos_game_type');
        $project_type_id = $taxonomy->term_id;
        $project_taxonomies = array(
            'vrodos_game_type' => array(
                $project_type_id,
            )
        );

        $project_information = array(
            'post_title' => esc_attr($project_title),
            'post_content' => '',
            'post_type' => 'vrodos_game',
            'post_status' => 'publish',
            'tax_input' => $project_taxonomies,
        );

        $project_id = wp_insert_post($project_information);

        $post = get_post($project_id);

        // Link project to game type
        wp_set_object_terms(  $post->ID, $project_type_slug, 'vrodos_game_type' );

        // Create a parent game tax category for the scenes
        wp_insert_term($post->post_title,'vrodos_scene_pgame', array(
                'description'=> '-',
                'slug' => $post->post_name,
            )
        );

        // Create a parent game tax category for the assets
        wp_insert_term($post->post_title,'vrodos_asset3d_pgame',array(
                'description'=> '-',
                'slug' => $post->post_name,
            )
        );

        $this->create_default_scenes_for_game($post->post_name, $project_type_id);

        echo $project_id;
        wp_die();
    }


    // Fetch list of project through ajax
    public function fetch_list_projects_callback() {

        $f = fopen("output_ajax_delay.txt", "w");

        $user_id = $_POST['current_user_id'];
        $parameter_Scenepass = $_POST['parameter_Scenepass'];

        // Define custom query parameters
        $custom_query_args = array(
            'post_type' => 'vrodos_game',
            'posts_per_page' => -1,
        );

        // Instantiate custom query
        $custom_query = new WP_Query($custom_query_args);

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

                if (current_user_can('administrator')){
                    // ToDo: replace current_user_can with smth like current_user_is

                } elseif (current_user_can('administrator')) {

                    $collaborators = get_post_meta(get_the_ID(),'vrodos_project_collaborators_ids')[0];

                    if ( get_the_author_meta('ID') != $user_id ) {                    // Not the author of the game
                        if (strpos($collaborators, $user_id) === false) {  // and not the collaborator then skip

                            continue;
                        }
                    }
                }

                $game_id = get_the_ID();
                $game_title = get_the_title();
                $game_date = get_the_date();

                // Do not show Joker projects
                if (str_contains($game_title, ' Joker'))
                    continue;

                $game_type_obj = $this->return_project_type($game_id);

                $all_game_category = get_the_terms( $game_id, 'vrodos_game_type' );
                $game_category     = $all_game_category[0]->slug;
                $scene_data = $this->get_first_scene_id_by_project_id($game_id,$game_category);//first 3D scene id

                $editscenePage = $this->get_edit_page('scene');

                $edit_scene_page_id = $editscenePage[0]->ID;

                $loadMainSceneLink = esc_url( (get_permalink($edit_scene_page_id) . $parameter_Scenepass . $scene_data['id'] . '&vrodos_game=' . $game_id . '&scene_type=' . $scene_data['type']));


                $assets_list_page =  $this->get_edit_page('assetslist');
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

                // ------- Collaborators -----------

                // Collaborators button
                echo '<a href="javascript:void(0)" class="mdc-button mdc-list-item__end-detail" '.
                    'data-mdc-auto-init="MDCRipple" title="Add collaborators for '.
                    $game_title . '" onclick="collaborateProject(' . $game_id . ')">';

                $collaborators = get_post_meta($game_id, 'vrodos_project_collaborators_ids');

                // Find number of current collaborators
                if ( count($collaborators)>0) {

                    $collabs_ids_raw = get_post_meta($game_id, 'vrodos_project_collaborators_ids')[0];
                    $collabs_ids = array_values(array_filter(explode(";", $collabs_ids_raw)));
                } else {
                    $collabs_ids = [];
                }

                echo '<i class="material-icons" aria-hidden="true" ' . ' title="Add collaborators">group</i>' .
                    '<sup>' . count($collabs_ids) . '</sup>';

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


    private function get_edit_page($type){

        switch ($type) {
            case 'allgames':
                $templateURL = '/templates/vrodos-project-manager-template.php';
                break;

            case 'game':
            case 'assetslist':
                $templateURL = '/templates/vrodos-assets-list-template.php';
                break;

            case 'scene':
                $templateURL = '/templates/vrodos-edit-3D-scene-template.php';
                break;
            case 'asset':
                $templateURL = '/templates/vrodos-asset-editor-template.php';
                break;

            default:
                $templateURL = null;

        }

        if ($templateURL) {
            return get_pages(array(
                'hierarchical' => 0,
                'parent' => -1,
                'meta_key' => '_wp_page_template',
                'meta_value' => $templateURL
            ));
        } else {
            return false;
        }
    }

    private function get_first_scene_id_by_project_id($project_id,$project_type){
        $gamePost = get_post($project_id);
        $gameSlug = $gamePost->post_name;

        $scene_type_slug = 'wonderaround-yaml';

        $custom_query_args = array(
            'post_type' => 'vrodos_scene',
            'posts_per_page' => -1,
            'tax_query' => array(
                'relation' => 'AND',
                array(
                    'taxonomy' => 'vrodos_scene_pgame',
                    'field'    => 'slug',
                    'terms'    => $gameSlug
                ),
                array(
                    'taxonomy' => 'vrodos_scene_yaml',
                    'field'    => 'slug',
                    'terms'    => $scene_type_slug,
                ),
            ),
            'orderby' => 'ID',
            'order' => 'DESC',
        );
        $scene_data = array();
        $custom_query = new WP_Query( $custom_query_args );

        if ( $custom_query->have_posts() ) {
            while ($custom_query->have_posts()) {
                $custom_query->the_post();

                $scene_data['id'] = get_the_ID();
                $scene_data['type'] = get_post_meta( get_the_ID(), 'vrodos_scene_metatype', true );
            }
        }

        return $scene_data;
    }

    private function return_project_type($id) {

        if (!$id) {
            return null;
        }

        $all_project_category = get_the_terms( $id, 'vrodos_game_type' );

        $project_category = $all_project_category ? $all_project_category[0]->name : null;

        $project_type_icon = $this->project_type_icon($project_category);

        $obj = new stdClass();
        $obj->string = $project_category;
        $obj->icon = $project_type_icon;

        return $obj;
    }

    private function project_type_icon($project_category){

        // Set game type icon
        switch($project_category){
            case 'vrexpo':
                $project_type_icon = "public";
                break;
            case 'virtualproduction':
                $project_type_icon = "theaters";
                break;
            case 'Archaeology':
            default:
                $project_type_icon = "account_balance";
                break;
        }
        return $project_type_icon;
    }

    private function create_default_scenes_for_game($projectSlug, $gameTypeId){

        if ($gameTypeId) {

            $project_type = get_term($gameTypeId, 'vrodos_game_type');
            $project_type_slug  = $project_type->slug;

            switch ($project_type_slug){

                case 'vrexpo_games':
                    $this->create_vrexpo_default_scenes($projectSlug);
                    break;
                case 'virtualproduction_games':
                    $this->create_virtualproduction_default_scenes($projectSlug);
                    break;
                case 'archaeology_games':
                default:
                    $this->create_archaeology_default_scenes($projectSlug);
                    break;
            }
        }
    }

    private function create_vrexpo_default_scenes($projectSlug){

        // Default scene JSON.
        $default_json = vrodos_getDefaultJSONscene( 'vrexpo' );

        // First Scene
        // Create Lobby Scene Data
        $firstSceneData = $this->create_default_scene_kernel(
            'Lobby',
            $default_json,
            $projectSlug . '-lobby-scene',
            $projectSlug,
            'wonderaround-yaml',
            1,
            'scene',
            0,
            0,
            0,
            'Auto-created scene',
            0,
            'lobby');

        // Second Scene : Auditorium
        $secondSceneData = $this->create_default_scene_kernel(
            'Auditorium',
            $default_json,
            $projectSlug . '-auditorium-scene',
            $projectSlug,
            'wonderaround-yaml',
            0,
            'scene',
            0,
            0,
            0,
            'Auto-created scene',
            0,
            'auditorium');

        // Third Scene : Cafe
        $thirdSceneData = $this->create_default_scene_kernel(
            'Cafe',
            $default_json,
            $projectSlug . '-cafe-scene',
            $projectSlug,
            'wonderaround-yaml',
            0,
            'scene',
            0,
            0,
            0,
            'Auto-created scene',
            0,
            'cafe');

        // Fourth Scene : Expo
        $fourthSceneData = $this->create_default_scene_kernel(
            'Expo',
            $default_json,
            $projectSlug . '-expo-scene',
            $projectSlug,
            'wonderaround-yaml',
            0,
            'scene',
            0,
            0,
            0,
            'Auto-created scene',
            0,
            'expo');

        wp_insert_post( $firstSceneData );
        wp_insert_post( $secondSceneData );
        wp_insert_post( $thirdSceneData );
        wp_insert_post( $fourthSceneData );
    }

    private function create_virtualproduction_default_scenes($projectSlug){

        // First Scene
        // Create Lobby Scene Data
        $firstSceneData = $this->create_default_scene_kernel(
            'Chapter 1',
            vrodos_getDefaultJSONscene( 'virtualproduction' ),
            $projectSlug . '-chapter1-scene',
            $projectSlug,
            'wonderaround-yaml',
            1,
            'scene',
            0,
            0,
            0,
            'Auto-created scene',
            0,
            'chapter1');

        wp_insert_post( $firstSceneData );
    }

    private function create_archaeology_default_scenes($projectSlug){

        // First Scene Data
        $firstSceneData = $this->create_default_scene_kernel(
            'Place',
            vrodos_getDefaultJSONscene('archaeology'),
            $projectSlug . '-first-scene',
            $projectSlug,
            'wonderaround-yaml',
            1,
            'scene',
            0,
            0,
            1,
            'Auto-created scene',
            0,
            '');

        // Add the scenes as post to WordPress
        wp_insert_post( $firstSceneData );
    }

    private function create_default_scene_kernel($title,
                                                $content,
                                                $sceneSlug,
                                                $projectSlug,
                                                $sceneYAMLslug,
                                                $isUndeletable,
                                                $metaType,
                                                $hasHelp,
                                                $hasLogin,
                                                $hasOptions,
                                                $caption,
                                                $isRegional,
                                                $sceneEnvironment
    ){

        $tax_parent_project = get_term_by('slug', $projectSlug, 'vrodos_scene_pgame');

        $taxParentProjectId = $tax_parent_project->term_id;

        // Get YAML id
        $sceneYAML = get_term_by('slug', $sceneYAMLslug, 'vrodos_scene_yaml');
        $sceneYAMLID = $sceneYAML->term_id;

        // Create Main Menu Scene Data
        $sceneData = array(
            'post_title'    => $title,
            'post_content' => $content,
            'post_name' => $sceneSlug,
            'post_type' => 'vrodos_scene',
            'post_status'   => 'publish',
            'tax_input'    => array(
                'vrodos_scene_pgame' => array( $taxParentProjectId ),
                'vrodos_scene_yaml' => array( $sceneYAMLID ),
            ),'meta_input'   => array(
                'vrodos_scene_default' => $isUndeletable,
                'vrodos_scene_metatype' => $metaType,
                'vrodos_menu_has_help' => $hasHelp,
                'vrodos_menu_has_login' => $hasLogin,
                'vrodos_menu_has_options' => $hasOptions,
                'vrodos_scene_caption' => $caption,
                'vrodos_scene_isRegional' => $isRegional,
                'vrodos_scene_environment' => $sceneEnvironment,
            ),
        );

        return $sceneData;
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
