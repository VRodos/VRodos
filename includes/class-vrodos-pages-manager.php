<?php

if (!defined('ABSPATH')) {
    exit;
}

class VRodos_Pages_Manager {

    protected $templates;

    public function __construct() {
        $this->templates = [];

        // Add a filter to the attributes metabox to inject template into the cache.
        if (version_compare(floatval(get_bloginfo('version')), '4.7', '<')) {
            // 4.6 and older
            add_filter('page_attributes_dropdown_pages_args', [$this, 'register_project_templates']);
        } else {
            // Add a filter to the wp 4.7 version attributes metabox
            add_filter('theme_page_templates', [$this, 'add_new_template']);
        }

        // Add a filter to the save post to inject out template into the page cache
        add_filter('wp_insert_post_data', [$this, 'register_project_templates']);

        // Add a filter to the template include to determine if the page has our
        // template assigned and return it's path
        add_filter('template_include', [$this, 'view_project_template']);

        // Add your templates to this array.
        $this->templates = [
            '/templates/vrodos-project-manager-template.php' => 'Project Manager Template',
            '/templates/vrodos-assets-list-template.php'   => 'Assets List Template',
            '/templates/vrodos-edit-3D-scene-template.php'   => 'Scene 3D Editor Template',
            '/templates/vrodos-view-3D-scene-template.php'   => 'Scene 3D Viewer Template',
            '/templates/vrodos-asset-editor-template.php'    => 'Asset Editor Template',
        ];

        add_action( 'admin_notices', [$this, 'vrodos_fx_admin_notice_notice'] );
    }

    public function add_new_template($posts_templates) {
        $posts_templates = array_merge($posts_templates, $this->templates);
        return $posts_templates;
    }

    public function register_project_templates($atts) {
        $cache_key = 'page_templates-' . md5(get_theme_root() . '/' . get_stylesheet());
        $templates = wp_get_theme()->get_page_templates();
        if (empty($templates)) {
            $templates = array();
        }
        wp_cache_delete($cache_key, 'themes');
        $templates = array_merge($templates, $this->templates);
        wp_cache_add($cache_key, $templates, 'themes', 1800);
        return $atts;
    }

    public function view_project_template($template) {
        global $post;
        if (!$post) {
            return $template;
        }
        if (!isset($this->templates[get_post_meta($post->ID, '_wp_page_template', true)])) {
            return $template;
        }
        $file = plugin_dir_path(__FILE__) . ltrim(get_post_meta($post->ID, '_wp_page_template', true), '/');
        if (file_exists($file)) {
            return $file;
        } else {
            echo $file;
        }
        return $template;
    }

	public static function vrodos_create_pages() {
		ob_start();

		$pages = array(
			'vrodos-project-manager-page' => array(
				'title'    => 'VROdos - Project Manager',
				'template' => '/templates/vrodos-project-manager-template.php',
			),
			'vrodos-assets-list-page'     => array(
				'title'    => 'VROdos - Assets List',
				'template' => '/templates/vrodos-assets-list-template.php',
			),
			'vrodos-edit-3d-scene-page'   => array(
				'title'    => 'VROdos - Scene 3D Editor',
				'template' => '/templates/vrodos-edit-3D-scene-template.php',
			),
			'vrodos-asset-editor-page'    => array(
				'title'    => 'VROdos - Asset Editor',
				'template' => '/templates/vrodos-asset-editor-template.php',
			),
		);

		foreach ( $pages as $slug => $page ) {
			if ( ! self::vrodos_get_page_by_slug( $slug ) ) {
				$new_page_id = wp_insert_post(
					array(
						'post_title'     => $page['title'],
						'post_type'      => 'page',
						'post_name'      => $slug,
						'comment_status' => 'closed',
						'ping_status'    => 'closed',
						'post_content'   => '',
						'post_status'    => 'publish',
						'post_author'    => 1,
						'menu_order'     => 0,
					)
				);

				if ( $new_page_id && ! is_wp_error( $new_page_id ) ) {
					update_post_meta( $new_page_id, '_wp_page_template', $page['template'] );
				}
			}
		}
		ob_end_clean();
	}

    public static function vrodos_fx_admin_notice_activation_hook() {
        set_transient('vrodos_fx-admin-notice', true, 5);
    }

    public function vrodos_fx_admin_notice_notice() {
        if (get_transient('vrodos_fx-admin-notice')) {
            if (count(get_terms('nav_menu')) == 0) {
                wp_create_nav_menu("main");
            }
            $menus = get_terms('nav_menu');
            $assetsList_Page = VRodos_Core_Manager::vrodos_getEditpage('assetslist')[0];
            $projectManager_Page = VRodos_Core_Manager::vrodos_getEditpage('allgames')[0];
            for ($i = 0; $i < count($menus); $i++) {
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
            delete_transient('vrodos_fx-admin-notice');
        }
    }

    public static function vrodos_get_page_by_slug($slug) {
        if ($pages = get_pages())
            foreach ($pages as $page)
                if ($slug === $page->post_name) return $page;
        return false;
    }

    public static function prepare_assets_list_page_data() {
        $perma_structure = (bool)get_option('permalink_structure');
        $parameter_pass = $perma_structure ? '?vrodos_game=' : '&vrodos_game=';
        $joker_project_id = get_page_by_path( 'archaeology-joker', OBJECT, 'vrodos_game' )->ID;

        $joker_project_post = get_post($joker_project_id);
        $joker_project_slug = $joker_project_post->post_name;

        $isUserloggedIn = is_user_logged_in();
        $isUserAdmin = $isUserloggedIn && current_user_can('administrator');
        $user_id = get_current_user_id();

        $single_project_asset_list = false;
        $current_game_project_id = null;
        $current_game_project_post = null;

        if(isset($_GET['vrodos_project_id'])) {
            $single_project_asset_list = true;
            $current_game_project_id = $_GET['vrodos_project_id'];
            $current_game_project_post = get_post($current_game_project_id);
            $current_game_project_slug = $current_game_project_post->post_name;
            $user_games_slugs = [$current_game_project_slug];
        } else {
            $user_games_slugs = VRodos_Core_Manager::vrodos_get_user_game_projects($user_id, $isUserAdmin);
        }

        $assets = VRodos_Core_Manager::get_assets($user_games_slugs);
        $newAssetPage = VRodos_Core_Manager::vrodos_getEditpage('asset');

        if (!$isUserloggedIn)
            $link_to_add = wp_login_url();
        else if ($isUserloggedIn && $single_project_asset_list)
            $link_to_add = esc_url( get_permalink($newAssetPage[0]->ID) . $parameter_pass . $current_game_project_id .'&singleproject=true&preview=0');
        else if ($isUserAdmin && !$single_project_asset_list)
            $link_to_add = esc_url( get_permalink($newAssetPage[0]->ID) . $parameter_pass . $joker_project_id .'&preview=0');
        else if ($isUserloggedIn)
            $link_to_add = esc_url( get_permalink($newAssetPage[0]->ID) . $parameter_pass . $joker_project_id .'&preview=0');

        $link_to_edit = home_url().'/vrodos-asset-editor-page/?';
        if ($single_project_asset_list)
            $link_to_edit = $link_to_edit. "singleproject=true&";

        $allProjectsPage = VRodos_Core_Manager::vrodos_getEditpage('allgames');
        $goBackTo_AllProjects_link = !empty($allProjectsPage) ? esc_url( get_permalink($allProjectsPage[0]->ID)) : home_url();

        if ($isUserloggedIn) {
            if( $single_project_asset_list){
                $helpMessage = 'A list of your private Assets belonging to the project <b>'.$current_game_project_post->post_title.'</b>.';
            } else {
                $helpMessage = 'Add a Shared Asset here. It will be accessible by all projects. If you want it to be private, make a project and add the asset there.';
            }
        } else {
            $helpMessage = 'Login to a) add a Shared Asset or b) to create a Project and add your private Assets there';
        }

        return array(
            'assets' => $assets,
            'is_user_logged_in' => $isUserloggedIn,
            'is_user_admin' => $isUserAdmin,
            'user_id' => $user_id,
            'link_to_add' => $link_to_add,
            'link_to_edit' => $link_to_edit,
            'go_back_to_all_projects_link' => $goBackTo_AllProjects_link,
            'help_message' => $helpMessage,
            'joker_project_slug' => $joker_project_slug,
            'single_project_asset_list' => $single_project_asset_list,
            'current_game_project_post' => $current_game_project_post,
        );
    }
}
