<?php

class VRodos_Core_Manager {

    public function __construct() {
        add_filter('login_redirect', array($this, 'vrodos_default_page'));
        // The following hook is commented out in VRodos.php, so I will keep it commented here as well to preserve behavior.
        // add_action('after_setup_theme', array($this, 'vrodos_remove_admin_bar'));

        // This function is not hooked in VRodos.php, but it is a core function that should be available.
        // I will add it as a public method that can be called from other classes.
        // add_action('wp_head', array($this, 'vrodos_remove_admin_login_header'));
    }

    public function vrodos_remove_admin_login_header() {
        remove_action('wp_head', '_admin_bar_bump_cb');
    }

    public static function vrodos_getVideoAttachmentsFromMediaLibrary(){

        $query_images_args = array(
            'post_type'      => 'attachment',
            'post_mime_type' => 'video',
            'post_status'    => 'inherit',
            'posts_per_page' => - 1,
        );

        $query_images = new WP_Query( $query_images_args );

        $videos = array();
        foreach ( $query_images->posts as $image ) {
            $videos[] = wp_get_attachment_url( $image->ID );
        }

        return $videos;
    }

    public static function vrodos_getFirstSceneID_byProjectID($project_id,$project_type){
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

    public static function vrodos_the_slug_exists($post_name) {
        global $wpdb;
        if($wpdb->get_row("SELECT post_name FROM wp_posts WHERE post_name = '" . $post_name . "'", 'ARRAY_A')) {
            return true;
        } else {
            return false;
        }
    }

    public function vrodos_remove_admin_bar() {
        if (!current_user_can('administrator') && !is_admin()) {
            show_admin_bar(false);
        }
    }

    public function vrodos_default_page() {
        return home_url();
    }

    public static function vrodos_get_all_doors_of_project_fastversion($parent_project_id_as_term_id){

        $sceneIds = [];

        // Define custom query parameters
        $custom_query_args = array(
            'post_type' => 'vrodos_scene',
            'posts_per_page' => -1,
            'tax_query' => array(
                array(
                    'taxonomy' => 'vrodos_scene_pgame',
                    'field'    => 'term_id',
                    'terms'    => $parent_project_id_as_term_id,
                ),
            ),
            'orderby' => 'ID',
            'order' => 'DESC',
        );

        $custom_query = new WP_Query( $custom_query_args );

        $doorInfoGathered = [];

        // Output custom query loop
        if ( $custom_query->have_posts() ) {
            while ($custom_query->have_posts()) {
                $custom_query->the_post();

                $scene_id = get_the_ID();
                $sceneTitle = get_the_title();  // get_post($scene_id)->post_title;
                $sceneSlug = get_post()->post_name;

                $scene_json = get_post()->post_content;

                //$scene_json = get_post_meta($scene_id, 'vrodos_scene_json_input', true);
                $jsonScene = htmlspecialchars_decode($scene_json);
                $sceneJsonARR = json_decode($jsonScene, TRUE);

                if (trim($jsonScene) === '')
                    continue;


                if ( $sceneJsonARR['objects'] != NULL)
                    if (count($sceneJsonARR['objects']) > 0)
                        foreach ($sceneJsonARR['objects'] as $key => $value) {
                            if ($key !== 'avatarCamera') {
                                if ($value['category_name'] === 'Decoration') {
                                    $doorInfoGathered[] = ['door' => $value['doorName_source'],
                                        'scene' => $sceneTitle,
                                        'sceneSlug'=> $sceneSlug];
                                }
                            }
                        }
            }
        }

        wp_reset_postdata();
        $wp_query = NULL;

        return $doorInfoGathered;
    }


    public static function vrodos_get_all_sceneids_of_game($parent_project_id_as_term_id){

        $sceneIds = [];

        // Define custom query parameters
        $custom_query_args = array(
            'post_type' => 'vrodos_scene',
            'posts_per_page' => -1,
            'tax_query' => array(
                array(
                    'taxonomy' => 'vrodos_scene_pgame',
                    'field'    => 'term_id',
                    'terms'    => $parent_project_id_as_term_id,
                ),
            ),
            'orderby' => 'ID',
            'order' => 'DESC',
        );

        $custom_query = new WP_Query( $custom_query_args );

        // Output custom query loop
        if ( $custom_query->have_posts() )
            while ( $custom_query->have_posts() ) {
                $custom_query->the_post();
                $scene_id = get_the_ID();
                $sceneIds[] = $scene_id;
            }

        return $sceneIds;
    }

    public static function vrodos_project_type_icon($project_category){

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

    public static function vrodos_return_project_type($id) {

        if (!$id) {
            return null;
        }

        $all_project_category = get_the_terms( $id, 'vrodos_game_type' );

        $project_category = $all_project_category ? $all_project_category[0]->name : null;

        $project_type_icon = self::vrodos_project_type_icon($project_category);

        $obj = new stdClass();
        $obj->string = $project_category;
        $obj->icon = $project_type_icon;

        return $obj;
    }

    public static function vrodos_getEditpage($type){

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

    public static function vrEditorBreadcrumpDisplay($scene_post, $goBackTo_AllProjects_link,
                                   $project_type, $project_type_icon, $project_post){


        $scene_title = $scene_post ? $scene_post->post_title : ' ';

        echo '<div id="sceneInfoBreadcrump" '.
            ' class="mdc-textfield mdc-theme--text-primary-on-dark mdc-form-field"'.
            ' data-mdc-auto-init="MDCTextfield">'.

            // Project Scene path at breadcrump
            ' <div id="projectNameBreadcrump" >'.
            '<a title="Back" style="margin-left:10px; margin-right:10px"'.
            ' href="'.$goBackTo_AllProjects_link.'">'.
            '<i class="material-icons mdc-theme--text-primary-on-dark sceneArrowBack">arrow_back</i>'.
            '</a>'.

            '<i class="material-icons mdc-theme--text-icon-on-dark sceneProjectTypeLabel"'.
            ' title="'.$project_type.'">'.$project_type_icon.
            '</i> '.
            '<span title="Project Title">'. $project_post->post_title.'</span>'.
            '<i class="material-icons mdc-theme--text-icon-on-dark chevronRight">chevron_right</i>'.
            '</div>'.

            // Title Name at breadcrumps
            '<input id="sceneTitleInput" name="sceneTitleInput"'.
            ' title="Scene Title" placeholder="Scene Title"'.
            ' value="'.$scene_title.'" type="text"'.
            ' class="mdc-textfield__input mdc-theme--text-primary-on-dark"'.
            ' aria-controls="title-validation-msg" minlength="3" required>'.
            '<p id="title-validation-msg"'.
            ' class="mdc-textfield-helptext mdc-textfield-helptext--validation-msg titleLengthSuggest">'.
            ' Must be at least 3 characters long'.
            '</p>'.

            // bottom line below title input
            '<div class="mdc-textfield__bottom-line"></div>'.
            '</div>';
    }

    /**
     * Get the Assets of a game plus its respective joker game assets
     *
     * @param $gameProjectSlug
     * @param $gameProjectID
     * @return array
     */
    public static function vrodos_get_assets_by_game($gameProjectSlug, $gameProjectID){

        $allAssets = [];
//	// find the joker game slug e.g. "Archaeology-joker"
//	$joker_game_slug = wp_get_post_terms( $gameProjectID, 'vrodos_game_type')[0]->name."-joker";
//
//	// Slugs are low case "Archaeology-joker" -> "archaeology-joker"
//	$joker_game_slug = strtolower($joker_game_slug);

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
                    /*    case 'chat':
                            $data_arr['chat_type'] = get_post_meta($asset_id, 'vrodos_asset3d_chat_type', true);
                            break;*/
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

    public static function vrodos_getDefaultJSONscene($mygameType){

        $p = plugin_dir_path( __DIR__ );

        switch ($mygameType) {
            case 'archaeology':
            case 'virtualproduction':
            case 'vrexpo':
            default:
                $def_json = file_get_contents($p . "/assets/standard_scene.json");
                break;
        }
        return $def_json;
    }

    /* Get all game projects of the user */
    public static function vrodos_get_user_game_projects($user_id, $isUserAdmin){

        $games_slugs = ['archaeology-joker'];

        // user is not logged in return only joker game
        if($user_id==0)
            return $games_slugs;

        $custom_query_args = array(
    //        'author' => $user_id,
            'post_type' => 'vrodos_game',
            'posts_per_page' => -1,
        );

        // if user is not admin then add as filter the author (else the admin can see all authors)
        if (!$isUserAdmin)
            $custom_query_args['author'] = $user_id;

        $custom_query = new WP_Query($custom_query_args);

        if ($custom_query->have_posts()) :
            while ($custom_query->have_posts()) :
                $custom_query->the_post();
                $game_slug = get_post()->post_name;
                $games_slugs[] = $game_slug;
            endwhile;
        endif;

        wp_reset_postdata();
        $wp_query = NULL;

        return array_unique ($games_slugs);
    }

    public static function get_scenes_wonder_around() {
        $allScenes = [];

        $custom_query_args = array(
            'post_type'      => 'vrodos_scene',
            'posts_per_page' => - 1,
            'tax_query'      => array(
                array(
                    'taxonomy' => 'vrodos_scene_yaml',
                    'field'    => 'slug',
                    'terms'    => 'wonderaround-yaml',
                ),
            ),
            'orderby'        => 'ID',
            'order'          => 'DESC',
            /*'paged' => $paged,*/
        );

        $custom_query = new WP_Query( $custom_query_args );

        if ( $custom_query->have_posts() ) :
            while ( $custom_query->have_posts() ) :

                $custom_query->the_post();
                $scene_id = get_the_ID();
                $scene_name = get_the_title();

                $scenePGame = get_the_terms($scene_id, 'vrodos_scene_pgame');

                $allAssets[] = [
                    'sceneName'=>$scene_name,
                    'sceneSlug'=>get_post()->post_name,
                    'sceneid'=>$scene_id,
                    'scene_parent_project'=>$scenePGame
                ];

            endwhile;
        endif;

        return $allAssets;
    }

    public static function get_assets($games_slugs){
        $allAssets = [];
        $queryargs = array(
            'post_type' => 'vrodos_asset3d',
            'posts_per_page' => -1
        );

        if ($games_slugs){
            $queryargs['tax_query'] = array(
                array(
                    'taxonomy' => 'vrodos_asset3d_pgame',
                    'field' => 'slug',
                    'terms' => $games_slugs
                ));
        }

        $custom_query = new WP_Query( $queryargs );

        if ( $custom_query->have_posts() ) :
            while ( $custom_query->have_posts() ) :

                $custom_query->the_post();

                $asset_id = get_the_ID();
                $asset_name = get_the_title();
                $asset_pgame = wp_get_post_terms($asset_id, 'vrodos_asset3d_pgame');
                $asset_cat_arr = wp_get_post_terms($asset_id, 'vrodos_asset3d_cat');

                $glbID = get_post_meta($asset_id, 'vrodos_asset3d_glb', true); // GLB ID
                $glbPath = $glbID ? wp_get_attachment_url( $glbID ) : '';                   // GLB PATH

                $sshotID = get_post_meta($asset_id, 'vrodos_asset3d_screenimage', true); // Screenshot Image ID
                $sshotPath = $sshotID ? wp_get_attachment_url( $sshotID ) : '';           // Screenshot Image PATH

                $author_id = get_post_field ('post_author', $asset_id);
                $author_displayname = get_the_author_meta( 'display_name' , $author_id );
                $author_username = get_the_author_meta( 'nickname' , $author_id );

                $assettrs = get_post_meta($asset_id,'vrodos_asset3d_assettrs', true);

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
                    'is_joker'=> get_post_meta($asset_id, 'vrodos_asset3d_isJoker', true),
                    'assettrs' => $assettrs,
                    'asset_parent_game'=>$asset_pgame[0]->name,
                    'asset_parent_game_slug'=>$asset_pgame[0]->slug,
                    'author_id'=> $author_id,
                    'author_displayname'=> $author_displayname,
                    'author_username'=> $author_username
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
                   /* case 'chat':
                        $data_arr['chat_type'] = get_post_meta($asset_id, 'vrodos_asset3d_chat_type', true);
                        break;*/
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

    /**
     * Get the Assets of a game plus its respective joker game assets
     *
     * @param $gameType
     * @return array
     */
    public static function vrodos_get_assetids_joker($gameType){

        $assetIds = [];

        // find the joker game slug e.g. "Archaeology-joker"
        $joker_game_slug = $gameType."-joker";

        // Slugs are low case "Archaeology-joker" -> "archaeology-joker"
        $joker_game_slug = strtolower($joker_game_slug);

        $queryargs = array(
            'post_type' => 'vrodos_asset3d',
            'posts_per_page' => -1,
            'tax_query' => array(
                array(
                    'taxonomy' => 'vrodos_asset3d_pgame',
                    'field' => 'slug',
                    'terms' => $joker_game_slug
                )
            )
        );

        $custom_query = new WP_Query( $queryargs );

        if ( $custom_query->have_posts() ) :
            while ( $custom_query->have_posts() ) :
                $custom_query->the_post();
                $assetIds[] = get_the_ID();
            endwhile;
        endif;

        // Reset postdata
        wp_reset_postdata();

        return $assetIds;
    }

    public static function getProjectScenes($parent_project_id_as_term_id){

        $custom_query_args = array(
            'post_type' => 'vrodos_scene',
            'posts_per_page' => -1,
            'tax_query' => array(
                array(
                    'taxonomy' => 'vrodos_scene_pgame',
                    'field'    => 'term_id',
                    'terms'    => $parent_project_id_as_term_id,
                ),
            ),
            'orderby' => 'ID',
            'order' => 'DESC',
            /*'paged' => $paged,*/
        );

        $custom_query = new WP_Query( $custom_query_args );

        return $custom_query;
    }

    public static function get_3D_model_files($assetpostMeta, $asset_id){

        $mtl_file_name = $obj_file_name = $pdb_file_name = $glb_file_name = $fbx_file_name =
        $textures_fbx_string_connected = $path_url = null;

        //OBJ
        if (array_key_exists('vrodos_asset3d_obj', $assetpostMeta)) {

            $mtlpost = get_post($assetpostMeta['vrodos_asset3d_mtl'][0]);

            $mtl_file_name = basename($mtlpost->guid);
            $obj_file_name = basename(get_post($assetpostMeta['vrodos_asset3d_obj'][0])->guid);
            $path_url = pathinfo($mtlpost->guid)['dirname'];

            // PDB
        } else if (array_key_exists('vrodos_asset3d_pdb', $assetpostMeta)){
            $pdb_file_name = get_post($assetpostMeta['vrodos_asset3d_pdb'][0])->guid;

            // GLB
        } else if (array_key_exists('vrodos_asset3d_glb', $assetpostMeta)) {

            $glb_file_name = get_post($assetpostMeta['vrodos_asset3d_glb'][0]) ? get_post($assetpostMeta['vrodos_asset3d_glb'][0])->guid : null;


            // FBX
        } else if (array_key_exists('vrodos_asset3d_fbx', $assetpostMeta)) {

            // Get texture attachments of post
            $args = array(
                'posts_per_page' => 100,
                'order'          => 'DESC',
                'post_mime_type' => 'image',
                'post_parent'    => $asset_id,
                'post_type'      => 'attachment'
            );

            $attachments_array =  get_children( $args,OBJECT );  //returns Array ( [$image_ID].

            // Add texture urls to a string separated by |
            $textures_fbx_string_connected = '';

            foreach ($attachments_array as $k){
                $url = $k->guid;

                // ignore screenshot attachment
                if (strpos($url, 'texture') === false) {
                    continue;
                }

                $textures_fbx_string_connected .= $url.'|';
            }

            // remove the last separator
            $textures_fbx_string_connected = trim($textures_fbx_string_connected, "|");

            $fbxpost = get_post($assetpostMeta['vrodos_asset3d_fbx'][0]);

            if ($fbxpost) {
                $fbx_file_name = basename($fbxpost->guid);
                $path_url = pathinfo($fbxpost->guid)['dirname'];
            }
        }



        return array('mtl'=>$mtl_file_name,
            'obj'=>$obj_file_name,
            'pdb'=>$pdb_file_name,
            'glb'=>$glb_file_name,
            'fbx'=>$fbx_file_name,
            'texturesFbx'=>$textures_fbx_string_connected,
            'path'=>$path_url);
    }


    // Upload image(s) or video or audio for a certain post_id (asset or scene3D)
    public static function upload_img_vid_aud($file, $parent_post_id) {

        self::load_wp_admin_files();

        // For Images (Sprites in Unity)
        if($file['type'] === 'image/jpeg' || $file['type'] === 'image/png') {
            if (strpos($file['name'], 'sprite') == false) {
                $hashed_prefix = md_5($parent_post_id . microtime());
                $file['name'] = str_replace(".jpg", $hashed_prefix."_sprite.jpg", $file['name']);
                $file['name'] = str_replace(".png", $hashed_prefix."_sprite.png", $file['name']);
            }
        }

        // Set post_id for the upload directory filter.
        $_REQUEST['post_id'] = $parent_post_id;
        add_filter('upload_dir', array('VRodos_Upload_Manager', 'upload_dir_for_scenes_or_assets'));
        add_filter('intermediate_image_sizes_advanced', array('VRodos_Upload_Manager', 'remove_allthumbs_sizes'), 10, 2);

        $file_return = self::handle_asset_upload($file, $parent_post_id);

        remove_filter('upload_dir', array('VRodos_Upload_Manager', 'upload_dir_for_scenes_or_assets'));
        unset($_REQUEST['post_id']);

        // if file has been uploaded successfully
        if($file_return && empty($file_return['error'])) {
            $attachment_id = self::insert_attachment_post($file_return, $parent_post_id);
            remove_filter('intermediate_image_sizes_advanced', array('VRodos_Upload_Manager', 'remove_allthumbs_sizes'), 10, 2);
            if ($attachment_id) {
                return $attachment_id;
            }
        } else {
            // If the upload failed, we should still remove the filter to not affect other uploads.
            remove_filter('intermediate_image_sizes_advanced', array('VRodos_Upload_Manager', 'remove_allthumbs_sizes'), 10, 2);
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

        // The 'vrodos_upload_dir_forScenesOrAssets' filter will be applied by the calling function
        // to ensure the correct directory is used.
        $upload_overrides = array( 'test_form' => false );
        $movefile = wp_handle_upload( $file_array, $upload_overrides );

        return $movefile;
    }

    // Insert attachment post
    public static function insert_attachment_post($file_return, $parent_post_id ){

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
    public static function upload_scene_screenshot($imagefile, $imgTitle, $scene_id, $type) {

        self::load_wp_admin_files();

        // DELETE EXISTING FILE: See if has already a thumbnail and delete it safely
        $thumbnail_id = get_post_thumbnail_id($scene_id);
        if ($thumbnail_id) {
            wp_delete_attachment($thumbnail_id, true);
        }

        // Set post_id for the upload directory filter.
        $_REQUEST['post_id'] = $scene_id;
        add_filter('upload_dir', array('VRodos_Upload_Manager', 'upload_dir_for_scenes_or_assets'));
        add_filter('intermediate_image_sizes_advanced', array('VRodos_Upload_Manager', 'remove_allthumbs_sizes'), 10, 2);
        add_filter('big_image_size_threshold', '__return_false');

        // The wp_upload_bits function is now mocked in the isolated test script.
        // if (!function_exists('wp_upload_bits')) {
        //     require_once(ABSPATH . 'wp-admin/includes/file.php');
        // }

        // Generate a unique filename
        $filename = 'scene_' . $scene_id . '_sshot.' . $type;
        $decoded_image = base64_decode(substr($imagefile, strpos($imagefile, ",") + 1));

        $file_return = wp_upload_bits($filename, null, $decoded_image);

        remove_filter('upload_dir', array('VRodos_Upload_Manager', 'upload_dir_for_scenes_or_assets'));
        unset($_REQUEST['post_id']);

        if ($file_return && empty($file_return['error'])) {
            $attachment_id = self::insert_attachment_post($file_return, $scene_id);
            remove_filter('intermediate_image_sizes_advanced', array('VRodos_Upload_Manager', 'remove_allthumbs_sizes'), 10, 2);
            remove_filter('big_image_size_threshold', '__return_false');
            if ($attachment_id) {
                set_post_thumbnail($scene_id, $attachment_id);
                return $attachment_id;
            }
        } else {
            // If the upload failed, we should still remove the filter to not affect other uploads.
            remove_filter('intermediate_image_sizes_advanced', array('VRodos_Upload_Manager', 'remove_allthumbs_sizes'), 10, 2);
            remove_filter('big_image_size_threshold', '__return_false');
        }

        return false;
    }



    // Asset: Used to save screenshot
    public static function upload_asset_screenshot($image, $parentPostId, $projectId) {

        self::load_wp_admin_files();

        // DELETE EXISTING FILE
        $asset3d_screenimage_id = get_post_meta($parentPostId, 'vrodos_asset3d_screenimage', true);
        if ($asset3d_screenimage_id) {
            // Use wp_delete_attachment to safely remove the old file and database entries.
            wp_delete_attachment($asset3d_screenimage_id, true);
        }

        // Set post_id for the upload directory filter.
        $_REQUEST['post_id'] = $parentPostId;
        add_filter('upload_dir', array('VRodos_Upload_Manager', 'upload_dir_for_scenes_or_assets'));
        add_filter('intermediate_image_sizes_advanced', array('VRodos_Upload_Manager', 'remove_allthumbs_sizes'), 10, 2);
        add_filter('big_image_size_threshold', '__return_false');

        // The wp_upload_bits function is now mocked in the isolated test script.
        // if (!function_exists('wp_upload_bits')) {
        //     require_once(ABSPATH . 'wp-admin/includes/file.php');
        // }

        // Generate a unique filename
        $filename = $parentPostId .'_'. time() .'_asset_screenshot.png';
        $decoded_image = base64_decode(substr($image, strpos($image, ",") + 1));

        $file_return = wp_upload_bits($filename, null, $decoded_image);

        remove_filter('upload_dir', array('VRodos_Upload_Manager', 'upload_dir_for_scenes_or_assets'));
        unset($_REQUEST['post_id']);

        if ($file_return && empty($file_return['error'])) {
            $attachment_id = self::insert_attachment_post($file_return, $parentPostId);
            remove_filter('intermediate_image_sizes_advanced', array('VRodos_Upload_Manager', 'remove_allthumbs_sizes'), 10, 2);
            remove_filter('big_image_size_threshold', '__return_false');
            if ($attachment_id) {
                update_post_meta($parentPostId, 'vrodos_asset3d_screenimage', $attachment_id);
                return $attachment_id;
            }
        } else {
            // If the upload failed, we should still remove the filter to not affect other uploads.
            remove_filter('intermediate_image_sizes_advanced', array('VRodos_Upload_Manager', 'remove_allthumbs_sizes'), 10, 2);
            remove_filter('big_image_size_threshold', '__return_false');
        }

        return false;
    }



    // Immitation of $_FILE through $_POST . This is for objs, fbx and mtls
    public static function upload_asset_text($textContent, $textTitle, $parent_post_id, $TheFiles, $index_file, $project_id) {

        self::load_wp_admin_files();

        // Set post_id for the upload directory filter.
        $_REQUEST['post_id'] = $parent_post_id;

        // Add filter to use our custom directory structure.
        add_filter('upload_dir', array('VRodos_Upload_Manager', 'upload_dir_for_scenes_or_assets'));
        add_filter('intermediate_image_sizes_advanced', array('VRodos_Upload_Manager', 'remove_allthumbs_sizes'), 10, 2);

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
            $file_return = self::handle_asset_upload($file_array, $parent_post_id);
        }

        // Remove the filters so they don't affect other uploads.
        remove_filter('upload_dir', array('VRodos_Upload_Manager', 'upload_dir_for_scenes_or_assets'));
        remove_filter('intermediate_image_sizes_advanced', array('VRodos_Upload_Manager', 'remove_allthumbs_sizes'), 10, 2);
        unset($_REQUEST['post_id']);

        // If the file was uploaded successfully, create an attachment post.
        if ($file_return && empty($file_return['error'])) {
            $attachment_id = self::insert_attachment_post($file_return, $parent_post_id);
            if ($attachment_id) {
                return $attachment_id;
            }
        }

        return false;
    }
}
