<?php

class VRodos_Core_Manager {

    public function __construct() {
        add_filter('login_redirect', array($this, 'vrodos_default_page'));

        // Custom hooks
        add_filter('upload_mimes', array($this, 'vrodos_mime_types'), 1, 1);
        add_action('plugins_loaded', array($this, 'vrodos_admin_hooks'));
        add_action('login_headerurl', array($this, 'vrodos_lost_password_redirect'));
        add_action('after_setup_theme', array($this, 'disable_widgets_block_editor'));
        remove_filter ('the_content', 'wpautop');
    }

    public function vrodos_admin_hooks(){
        if($GLOBALS['pagenow']=='post.php') {
            add_action('admin_print_scripts', array($this, 'my_admin_scripts'));
            add_action('admin_print_styles',  array($this, 'my_admin_styles'));
        }
    }

    public function my_admin_scripts() {
        wp_enqueue_script('jquery');
        wp_enqueue_script('media-upload');
        wp_enqueue_script('thickbox');
    }


    public function my_admin_styles()  {
        wp_enqueue_style('thickbox');
    }

    public function vrodos_lost_password_redirect() {
        // Check if have submitted
        $confirm = ( isset($_GET['checkemail'] ) ? $_GET['checkemail'] : '' );

        if( $confirm ) {
            wp_redirect( get_site_url( ));
            exit;
        }
    }

    public function disable_widgets_block_editor() {
        remove_theme_support( 'widgets-block-editor' );
    }

    public function vrodos_mime_types($mime_types){
        $mime_types['json'] = 'text/json';
        $mime_types['obj'] = 'text/plain';
        $mime_types['mp4'] = 'video/mp4';
        $mime_types['ogv'] = 'application/ogg';
        $mime_types['ogg'] = 'application/ogg';
        $mime_types['mtl'] = 'text/plain';
        $mime_types['mat'] = 'text/plain';
        $mime_types['pdb'] = 'text/plain';
        $mime_types['fbx'] = 'application/octet-stream';
        $mime_types['glb'] = 'application/octet-stream';
        return $mime_types;
    }

    public static function vrodos_plugin_main_page() {
        $allProjectsPage = VRodos_Core_Manager::vrodos_getEditpage('allgames');

        if ( is_admin() ) {
            if( ! function_exists( 'get_plugin_data' ) ) {
                require_once( ABSPATH . 'wp-admin/includes/plugin.php' );
            }
            $plugin_data = get_plugin_data( VRODOS_PLUGIN_FILE );
        }
        ?>

        <div id="wpbody" role="main">
            <div id="wpbody-content">
                <div class="wrap">
                    <h1>VRodos Dashboard (<?php echo $plugin_data['Version'] ?>)</h1>
                    <div id="welcome-panel" class="welcome-panel" style="background: #1b4d0d url(images/about-texture.png) center repeat ">
                        <div class="welcome-panel-content">
                            <div class="welcome-panel-header">
                                <img src="<?php echo plugin_dir_url( VRODOS_PLUGIN_FILE )?>images/VRodos_icon_512.png" alt="VRodos Icon" style="width:128px;height:128px;position: absolute;
    right: 0;
    margin-right: 20px;">
                                <h2>Welcome to VRodos!</h2>
                                <p>
                                    <a href="https://vrodos.iti.gr">
                                        Learn more about VRodos </a>
                                </p>
                            </div>
                            <div class="welcome-panel-column-container">
                                <div class="welcome-panel-column">
                                    <div class="welcome-panel-icon-pages"></div>
                                    <div class="welcome-panel-column-content">
                                        <a href="<?php echo esc_url( get_permalink($allProjectsPage[0]->ID)); ?>" class="mdc-button mdc-button--raised">Access Project Manager</a>
                                    </div>
                                </div>
                                <div class="welcome-panel-column">
                                    <div class="welcome-panel-icon-layout"></div>
                                    <div class="welcome-panel-column-content">
                                    </div>
                                </div>
                                <div class="welcome-panel-column">
                                    <div class="welcome-panel-icon-styles"></div>
                                    <div class="welcome-panel-column-content">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="table_stuff">
                    <table>
                        <caption>Overview</caption>
                        <thead>

                        <tr>
                            <th><!-- Intentionally Blank --></th>
                            <th>Total number</th>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Parent Project</th>
                        <tr>
                        </thead>
                        <tbody>
                        <tr>
                            <th>Projects</th>
                            <td><?php

                                $args = array(
                                    'post_type' => 'vrodos_game',
                                    'posts_per_page' => -1
                                );

                                $query = new WP_Query($args);

                                echo $query->found_posts;
                                ?></td>
                            <td><?php

                                $args = array(
                                    'post_type' => 'vrodos_game',
                                    'posts_per_page' => -1
                                );

                                $query = new WP_Query($args);

                                //echo $query->found_posts;

                                //echo "<br />";
                                if ($query->have_posts()) :

                                    while ( $query->have_posts() ) : $query->the_post();
                                        echo get_the_ID() . " <br />";
                                    endwhile;
                                    wp_reset_postdata();
                                endif;
                                ?></td>
                            <td><?php

                                $args = array(
                                    'post_type' => 'vrodos_game',
                                    'posts_per_page' => -1
                                );

                                $query = new WP_Query($args);

                                //echo $query->found_posts;

                                //echo "<br />";
                                if ($query->have_posts() ) :

                                    while ( $query->have_posts() ) : $query->the_post();
                                        echo  get_the_title() . " <br />";
                                    endwhile;

                                    wp_reset_postdata();
                                endif;

                                ?></td>
                            <td></td>
                        </tr>
                        <tr>
                            <th>Scenes</th>
                            <td> <?php

                                $args = array(
                                    'post_type' => 'vrodos_scene',
                                    'posts_per_page' => -1
                                );

                                $query = new WP_Query($args);

                                echo $query->found_posts . "</br>";

                                ?></td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                        <tr>
                            <th>Assets</th>
                            <td> <?php

                                $args = array(
                                    'post_type' => 'vrodos_asset3d',
                                    'posts_per_page' => -1
                                );

                                $query = new WP_Query($args);

                                echo $query->found_posts;
                                ?>
                            </td>
                            <td></td>
                            <td></td>
                            <td></td>

                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>


        <hr class="wp-block-separator"/>
        <?php
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
            case 'game':
                $templateURL = '/templates/vrodos-project-manager-template.php';
                break;

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


    public static function vrodos_delete_asset_3d_from_scenes($asset_id, $game_slug) {
        $scenes_query_args = array(
            'post_type' => 'vrodos_scene',
            'posts_per_page' => -1,
            'tax_query' => array(
                array(
                    'taxonomy' => 'vrodos_scene_pgame',
                    'field' => 'slug',
                    'terms' => $game_slug,
                ),
            ),
        );

        $scenes_query = new WP_Query($scenes_query_args);

        if ($scenes_query->have_posts()) {
            while ($scenes_query->have_posts()) {
                $scenes_query->the_post();
                $scene_id = get_the_ID();
                $scene_content = get_post_field('post_content', $scene_id);
                $scene_data = json_decode($scene_content, true);

                $asset_ids_in_scene = wp_list_pluck($scene_data['objects'], 'asset_id');

                if (in_array($asset_id, $asset_ids_in_scene)) {
                    foreach ($scene_data['objects'] as $key => $scene_object) {
                        if (isset($scene_object['asset_id']) && $scene_object['asset_id'] == $asset_id) {
                            unset($scene_data['objects'][$key]);
                        }
                    }

                    $scene_data['objects'] = array_values($scene_data['objects']);
                    $updated_scene_content = json_encode($scene_data);
                    wp_update_post(array(
                        'ID' => $scene_id,
                        'post_content' => $updated_scene_content,
                    ));
                }
            }
        }
        wp_reset_postdata();
    }
}
