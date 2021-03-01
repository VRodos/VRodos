<?php

// Add openGame templates to every theme

class wpUnityTemplate {

    //A reference to an instance of this class.
    private static $instance;

    //The array of templates that IMC plugin tracks.
    protected $templates;

    //Returns an instance of this class.
    public static function get_instance() {
        if ( null == self::$instance ) { self::$instance = new wpUnityTemplate();}
        return self::$instance;
    }

    //Initializes the ImcTemplate by setting filters and administration functions.
    private function __construct() {

        $this->templates = array();

        // Add a filter to the attributes metabox to inject template into the cache.
        if ( version_compare( floatval( get_bloginfo( 'version' ) ), '4.7', '<' ) ) {
            // 4.6 and older
            add_filter('page_attributes_dropdown_pages_args', array( $this, 'register_project_templates' ));
        } else {
            // Add a filter to the wp 4.7 version attributes metabox
            // 73
            add_filter('theme_page_templates', array( $this,'add_new_template' ));
        }

        // Add a filter to the save post to inject out template into the page cache
        add_filter('wp_insert_post_data', array( $this, 'register_project_templates'));

        // Add a filter to the template include to determine if the page has our
        // template assigned and return it's path
        // 74
        add_filter('template_include', array( $this, 'view_project_template'));

        // Add your templates to this array.
        $this->templates = array(
            '/templates/vrodos-project-manager-template.php'     => 'Project Manager Template',
            '/templates/vrodos-assets-list-template.php'     => 'Assets List Template',
            '/templates/vrodos-edit-3D-scene-template.php'     => 'Scene 3D Editor Template',
            '/templates/vrodos-asset-editor-template.php'     => 'Asset Editor Template',
            '/templates/edit-wpunity_scene2D.php'     => 'WPUnity-Edit 2D Scene',
            '/templates/edit-wpunity_sceneExam.php'     => 'WPUnity-Edit Exam Scene',
        );

    }

    //Adds our templates to the page dropdown for v4.7+
    public function add_new_template( $posts_templates ) {
        $posts_templates = array_merge( $posts_templates, $this->templates );
        return $posts_templates;
    }

    //Adds our templates to the pages cache in order to trick WordPress into thinking the template file exists where it doens't really exist.
    public function register_project_templates( $atts ) {

        // Create the key used for the themes cache
        $cache_key = 'page_templates-' . md5( get_theme_root() . '/' . get_stylesheet() );

        // Retrieve the cache list.
        // If it doesn't exist, or it's empty prepare an array
        $templates = wp_get_theme()->get_page_templates();
        if ( empty( $templates ) ) {
            $templates = array();
        }

        // New cache, therefore remove the old one
        wp_cache_delete( $cache_key , 'themes');

        // Now add our template to the list of templates by merging our templates
        // with the existing templates array from the cache.
        $templates = array_merge( $templates, $this->templates );

        // Add the modified cache to allow WordPress to pick it up for listing
        // available templates
        wp_cache_add( $cache_key, $templates, 'themes', 1800 );

        return $atts;

    }

    //Checks if the templates is assigned to the page
    public function view_project_template( $template ) {

        // Get global post
        global $post;

        // Return template if post is empty
        if ( ! $post ) {
            return $template;
        }

        // Return default template if we don't have a custom one defined
        if ( ! isset( $this->templates[get_post_meta(
                $post->ID, '_wp_page_template', true
            )] ) ) {
            return $template;
        }

        $file = plugin_dir_path( __FILE__ ). get_post_meta(
                $post->ID, '_wp_page_template', true
            );

        // Just to be safe, we check if the file exist first
        if ( file_exists( $file ) ) {
            return $file;
        } else {
            echo $file;
        }

        // Return template
        return $template;
    }
}


// Create "Project Manager Page" and assign its template
function vrodos_create_ProjectManagerPage() {
    
    $ff = fopen("output_order_log.txt","a");
    fwrite($ff, 'register_activation_hook'.chr(13));
    fclose($ff);
    
    if (! wpunity_get_page_by_slug('vrodos-project-manager-page')) {
        $new_page_id = wp_insert_post(array(
            'post_title' => 'Project Manager Page',
            'post_type' => 'page',
            'post_name' => 'vrodos-project-manager-page', //wpunity-main
            'comment_status' => 'closed',
            'ping_status' => 'closed',
            'post_content' => '',
            'post_status' => 'publish',
            'post_author' => get_user_by('id', 1)->user_id,
            'menu_order' => 0,
        ));
        
        // Change the template of the page
        if ($new_page_id && !is_wp_error($new_page_id)) {
            update_post_meta($new_page_id, '_wp_page_template',
                                '/templates/vrodos-project-manager-template.php');
        }

        update_option('hclpage', $new_page_id);
    }
}

// Create Assets List Page and assign its template
function vrodos_create_AssetsListPage() {

    if (! wpunity_get_page_by_slug('vrodos-assets-list-page')) {
        $new_page_id = wp_insert_post(array(
            'post_title' => 'Assets List Page',
            'post_type' => 'page',
            'post_name' => 'vrodos-assets-list-page',
            'comment_status' => 'closed',
            'ping_status' => 'closed',
            'post_content' => '',
            'post_status' => 'publish',
            'post_author' => get_user_by('id', 1)->user_id,
            'menu_order' => 0,
        ));
        if ($new_page_id && !is_wp_error($new_page_id)) {
            update_post_meta($new_page_id, '_wp_page_template', '/templates/vrodos-assets-list-template.php');
        }

        update_option('hclpage', $new_page_id);
    }
}


// Scene 3D editor
function vrodos_create_scene3DeditorPage() {

    if (! wpunity_get_page_by_slug('vrodos-edit-3d-scene-page')) {
        $new_page_id = wp_insert_post(array(
            'post_title' => 'Scene 3D Editor',
            'post_type' => 'page',
            'post_name' => 'vrodos-edit-3d-scene-page',
            'comment_status' => 'closed',
            'ping_status' => 'closed',
            'post_content' => '',
            'post_status' => 'publish',
            'post_author' => get_user_by('id', 1)->user_id,
            'menu_order' => 0,
        ));
        if ($new_page_id && !is_wp_error($new_page_id)) {
            update_post_meta($new_page_id, '_wp_page_template', '/templates/vrodos-edit-3D-scene-template.php');
        }

        update_option('hclpage', $new_page_id);
    }
}

// Edit 2D Scene
function wpunity_create_editScene2DPage() {

    if (! wpunity_get_page_by_slug('wpunity-edit-2d-scene')) {
        $new_page_id = wp_insert_post(array(
            'post_title' => 'WPUnity-Edit 2D Scene',
            'post_type' => 'page',
            'post_name' => 'wpunity-edit-2d-scene',
            'comment_status' => 'closed',
            'ping_status' => 'closed',
            'post_content' => '',
            'post_status' => 'publish',
            'post_author' => get_user_by('id', 1)->user_id,
            'menu_order' => 0,
        ));
        if ($new_page_id && !is_wp_error($new_page_id)) {
            update_post_meta($new_page_id, '_wp_page_template', '/templates/edit-wpunity_scene2D.php');
        }

        update_option('hclpage', $new_page_id);
    }
}

//==========================================================================================================================================

function wpunity_create_editSceneExamPage() {

    if (! wpunity_get_page_by_slug('wpunity-edit-exam-scene')) {
        $new_page_id = wp_insert_post(array(
            'post_title' => 'WPUnity-Edit Exam Scene',
            'post_type' => 'page',
            'post_name' => 'wpunity-edit-exam-scene',
            'comment_status' => 'closed',
            'ping_status' => 'closed',
            'post_content' => '',
            'post_status' => 'publish',
            'post_author' => get_user_by('id', 1)->user_id,
            'menu_order' => 0,
        ));
        if ($new_page_id && !is_wp_error($new_page_id)) {
            update_post_meta($new_page_id, '_wp_page_template', '/templates/edit-wpunity_sceneExam.php');
        }

        update_option('hclpage', $new_page_id);
    }
}


// --- Page to edit an Asset ----
function vrodos_create_assetEditorPage() {
    
    if (! wpunity_get_page_by_slug('vrodos-asset-editor-page')) {
        $new_page_id = wp_insert_post(array(
            'post_title' => 'Asset Editor',
            'post_type' => 'page',
            'post_name' => 'vrodos-asset-editor-page',
            'comment_status' => 'closed',
            'ping_status' => 'closed',
            'post_content' => '',
            'post_status' => 'publish',
            'post_author' => get_user_by('id', 1)->user_id,
            'menu_order' => 0,
        ));
        
        if ($new_page_id && !is_wp_error($new_page_id)) {
            update_post_meta($new_page_id, '_wp_page_template', '/templates/vrodos-asset-editor-template.php');
        }

        update_option('hclpage', $new_page_id);
    }
}

// Get page by slug
function wpunity_get_page_by_slug($slug) {
    if ($pages = get_pages())
        foreach ($pages as $page)
            if ($slug === $page->post_name) return $page;
    return false;
}
?>
