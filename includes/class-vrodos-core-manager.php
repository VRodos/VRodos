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
}
