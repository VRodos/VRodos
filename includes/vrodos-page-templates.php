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
            '/templates/vrodos-edit-2D-scene-template.php'     => 'Scene 2D Editor Template ',
            '/templates/vrodos-edit-sceneExam-template.php'     => 'Scene Exam Editor Template',
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

// -------------------------- Pages creation -------------------------------


// Create "Project Manager Page" and assign its template
function vrodos_create_pages() {
    
    // Do not remove
    ob_start();

    // 1. Project Manager
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
 
 
    // 2. Assets List Page
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
   
    
    //  3. 3D Editor
    if (! wpunity_get_page_by_slug('vrodos-edit-3d-scene-page')) {
        $new_page_id = wp_insert_post(array(
            'post_title' => 'Scene 3D Editor Page',
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
    
    // 4.  2D Scene editor
    if (! wpunity_get_page_by_slug('vrodos-edit-2d-scene-page')) {
        $new_page_id = wp_insert_post(array(
            'post_title' => 'Scene 2D Editor Page',
            'post_type' => 'page',
            'post_name' => 'vrodos-edit-2d-scene-page',
            'comment_status' => 'closed',
            'ping_status' => 'closed',
            'post_content' => '',
            'post_status' => 'publish',
            'post_author' => get_user_by('id', 1)->user_id,
            'menu_order' => 0,
        ));
        if ($new_page_id && !is_wp_error($new_page_id)) {
            update_post_meta($new_page_id, '_wp_page_template', '/templates/vrodos-edit-2D-scene-template.php');
        }
        
        update_option('hclpage', $new_page_id);
    }

    
    // 5. Exam page
    if (! wpunity_get_page_by_slug('vrodos-edit-exam-scene-page')) {
        $new_page_id = wp_insert_post(array(
            'post_title' => 'Edit Exam Scene Page',
            'post_type' => 'page',
            'post_name' => 'vrodos-edit-exam-scene-page',
            'comment_status' => 'closed',
            'ping_status' => 'closed',
            'post_content' => '',
            'post_status' => 'publish',
            'post_author' => get_user_by('id', 1)->user_id,
            'menu_order' => 0,
        ));
        if ($new_page_id && !is_wp_error($new_page_id)) {
            update_post_meta($new_page_id, '_wp_page_template', '/templates/vrodos-edit-sceneExam-template.php');
        }
        
        update_option('hclpage', $new_page_id);
    }

    
    // 6. Asset Editor
    if (! wpunity_get_page_by_slug('vrodos-asset-editor-page')) {
        $new_page_id = wp_insert_post(array(
            'post_title' => 'Asset Editor Page',
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
    
    // Remove any unexpected characters that have occured from the above functions, so as not to be included in headers
    ob_get_contents();
//    $f = fopen("output_activation.txt","w");
//    fwrite($f, ob_get_contents());
//    fclose($f);
    //trigger_error(ob_get_contents(),E_USER_ERROR);
}


// Add two page to navigation menu automatically and give a notification of activation
function vrodos_fx_admin_notice_activation_hook() {
    set_transient( 'vrodos_fx-admin-notice', true, 5 );
}

add_action( 'admin_notices', 'vrodos_fx_admin_notice_notice' );

function vrodos_fx_admin_notice_notice(){
    
    


    /* Check transient, if available display notice */
    if( get_transient( 'vrodos_fx-admin-notice' ) ){

       // If you do not have a menu, I will create one for you
        if( count(get_terms('nav_menu')) == 0){
            wp_create_nav_menu("main");
        }
    
        $menus = get_terms('nav_menu');
        
        $assetsList_Page = wpunity_getEditpage('assetslist')[0];
        $projectManager_Page = wpunity_getEditpage('allgames')[0];
    
        for ($i=0; $i < count($menus); $i++) {
        
            $menu_items = wp_get_nav_menu_items($menus[$i]->term_id, array('post_status' => 'publish'));
        
            $assetsList_itemExistsInMenu = false;
            $projectManager_itemExistsInMenu = false;
            foreach ($menu_items as $menu_item) {
                $assetsList_itemExistsInMenu = $menu_item->object_id == $assetsList_Page->ID;
                $projectManager_itemExistsInMenu = $menu_item->object_id == $projectManager_Page->ID;
            }
    
            if (!$assetsList_itemExistsInMenu) {
                wp_update_nav_menu_item($menus[$i]->term_id, 0, array(
                    'menu-item-title' => 'Assets List',
                    'menu-item-object-id' => $assetsList_Page->ID,
                    'menu-item-status' => 'publish',
                    'menu-item-object' => 'page',
                    'menu-item-type' => 'post_type',
                ));
            }
    
            if (!$projectManager_itemExistsInMenu) {
                wp_update_nav_menu_item($menus[$i]->term_id, 0, array(
                    'menu-item-title' => 'Project Manager',
                    'menu-item-object-id' => $projectManager_Page->ID,
                    'menu-item-status' => 'publish',
                    'menu-item-object' => 'page',
                    'menu-item-type' => 'post_type',
                ));
            }
            
        }
        
        echo '<div class="updated notice is-dismissible"><p>Thank you for using VRodos! <strong>Two pages have been added to menu</strong>.</p></div>';
        
        /* Delete transient, only display this notice once. */
        delete_transient( 'vrodos_fx-admin-notice' );
    
    
    }

}


//GET page by given type (depending the template) - breacrumb and links for front-end
function wpunity_getEditpage($type){
    
    if($type=='game' || $type=='assetslist'){
        $edit_pages = get_pages(array(
            'hierarchical' => 0,
            'parent' => -1,
            'meta_key' => '_wp_page_template',
            'meta_value' => '/templates/vrodos-assets-list-template.php'
        ));
        return $edit_pages;
    }elseif($type=='scene'){
        $edit_pages = get_pages(array(
            'hierarchical' => 0,
            'parent' => -1,
            'meta_key' => '_wp_page_template',
            'meta_value' => '/templates/vrodos-edit-3D-scene-template.php'
        ));
        return $edit_pages;
    }elseif($type=='scene2D'){
        $edit_pages = get_pages(array(
            'hierarchical' => 0,
            'parent' => -1,
            'meta_key' => '_wp_page_template',
            'meta_value' => '/templates/vrodos-edit-2D-scene-template.php'
        ));
        return $edit_pages;
    }elseif($type=='allgames'){
        $edit_pages = get_pages(array(
            'hierarchical' => 0,
            'parent' => -1,
            'meta_key' => '_wp_page_template',
            'meta_value' => '/templates/vrodos-project-manager-template.php',
        ));
        return $edit_pages;
    }elseif($type=='sceneExam'){
        $edit_pages = get_pages(array(
            'hierarchical' => 0,
            'parent' => -1,
            'meta_key' => '_wp_page_template',
            'meta_value' => '/templates/vrodos-edit-sceneExam-template.php'
        ));
        return $edit_pages;
    }elseif($type=='asset'){
        $edit_pages = get_pages(array(
            'hierarchical' => 0,
            'parent' => -1,
            'meta_key' => '_wp_page_template',
            'meta_value' => '/templates/vrodos-asset-editor-template.php'
        ));
        return $edit_pages;
    }else{
        return false;
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
