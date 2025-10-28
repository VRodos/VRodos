<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * VRodos_Menu_Manager Class.
 *
 * Manages the WordPress admin and frontend menus for the VRodos plugin.
 */
class VRodos_Menu_Manager {

	/**
	 * Constructor.
	 *
	 * Registers all the necessary hooks for menu management.
	 */
	public function __construct() {
		// Frontend Menu Hooks
		add_filter( 'wp_nav_menu_items', array( $this, 'vrodos_loginout_menu_link' ), 5, 2 );
		add_action( 'wp_nav_menu_item_custom_fields', array( $this, 'vrodos_add_scene_id_to_scene_as_menu_item' ), 100, 2 );
		add_action( 'wp_update_nav_menu_item', array( $this, 'save_menu_item_desc' ), 10, 2 );
		add_filter( 'wp_get_nav_menu_items', array( $this, 'nav_items' ), 11, 3 );
        add_action( 'init', array( $this, 'wpb_custom_new_menu' ) );

		// Backend Menu Hooks
		add_action( 'admin_menu', array( $this, 'vrodos_plugin_menu' ) );
		add_filter( 'parent_file', array( $this, 'vrodos_correct_admin_menu_highlight' ) );
	}

	/**
	 * Display Login/Logout in menu.
	 */
	public function vrodos_loginout_menu_link( $menu, $args ) {
		$menu .= '<li class="nav-menu" class="menu-item">' . wp_loginout( $_SERVER['REQUEST_URI'], false ) . '</li>';
		return $menu;
	}

	/**
	 * Add Scene-3d-view with parameters to nav menu.
	 */
	public function vrodos_add_scene_id_to_scene_as_menu_item( $item_id ) {
		$scene_id = get_post_meta( $item_id, '_scene_id', true );
		?>
		<div style="clear: both;">
			<span class="description" style="font-style: oblique">VRodos 3D scene menu</span><br />
			<span class="description">Scene to load</span><br />
			<input type="hidden" class="nav-menu-id" value="<?php echo $item_id; ?>" />
			<div class="logged-input-holder">
				<select name="scene_id[<?php echo $item_id; ?>]" id="scene-id-<?php echo $item_id; ?>" class="widefat">
					<option value=""></option>
					<?php
					$scenes = get_scenes_wonder_around();
					foreach ( $scenes as $scene ) {
						echo '<option value="' . esc_attr( $scene['sceneid'] ) . '" ' . selected( esc_attr( $scene_id ), $scene['sceneid'], false ) . '>' . esc_html( $scene['sceneName'] ) . ' of ' . esc_html( $scene['scene_parent_project'][0]->name ) . '</option>';
					}
					?>
				</select>
			</div>
		</div>
		<?php
	}

	/**
	 * Save the custom scene ID field for a menu item.
	 */
	public function save_menu_item_desc( $menu_id, $menu_item_db_id ) {
		if ( isset( $_POST['scene_id'][ $menu_item_db_id ] ) ) {
			$sanitized_data = sanitize_text_field( $_POST['scene_id'][ $menu_item_db_id ] );
			update_post_meta( $menu_item_db_id, '_scene_id', $sanitized_data );
		} else {
			delete_post_meta( $menu_item_db_id, '_scene_id' );
		}
	}

	/**
	 * Append the scene ID to the URL of the menu item.
	 */
	public function nav_items( $items, $menu, $args ) {
		if ( is_admin() ) {
			return $items;
		}

		foreach ( $items as $item ) {
			$scene_id = get_post_meta( $item->ID, '_scene_id', true );
			if ( ! empty( $scene_id ) ) {
				$item->url .= '?vrodos_scene=' . $scene_id;
			}
		}
		return $items;
	}

    /**
	 * Register a custom 3D menu location.
	 */
    public function wpb_custom_new_menu() {
        register_nav_menu('3d-menu',__( '3D Menu' ));
    }

	/**
	 * Create the main VRodos admin menu and submenus.
	 */
	public function vrodos_plugin_menu() {
		add_menu_page(
			'VRodos Plugin Page',
			'VRodos',
			'manage_options',
			'vrodos-plugin',
			'vrodos_plugin_main_page',
			plugin_dir_url( __FILE__ ) . '../images/vrodos_icon_20_w.png',
			25
		);

		add_submenu_page( 'vrodos-plugin', 'Projects', 'Projects', 'manage_options', 'edit.php?post_type=vrodos_game' );
		add_submenu_page( 'vrodos-plugin', 'Project Types', 'Project Types', 'manage_options', 'edit-tags.php?post_type=vrodos_game&taxonomy=vrodos_game_type' );
		add_submenu_page( 'vrodos-plugin', 'Scenes', 'Scenes', 'manage_options', 'edit.php?post_type=vrodos_scene' );
		add_submenu_page( 'vrodos-plugin', 'Scene Types', 'Scene Types', 'manage_options', 'edit-tags.php?post_type=vrodos_scene&taxonomy=vrodos_scene_yaml' );
		add_submenu_page( 'vrodos-plugin', 'Scenes Grouped by Project', 'Scenes Grouped by Project', 'manage_options', 'edit-tags.php?post_type=vrodos_scene&taxonomy=vrodos_scene_pgame' );
		add_submenu_page( 'vrodos-plugin', 'Assets', 'Assets', 'manage_options', 'edit.php?post_type=vrodos_asset3d' );
		add_submenu_page( 'vrodos-plugin', 'Asset Types', 'Asset Types', 'manage_options', 'edit-tags.php?post_type=vrodos_asset3d&taxonomy=vrodos_asset3d_cat' );
		add_submenu_page( 'vrodos-plugin', 'Assets Grouped by Project', 'Assets Grouped by Project', 'manage_options', 'edit-tags.php?post_type=vrodos_asset3d&taxonomy=vrodos_asset3d_pgame' );
		add_submenu_page( 'vrodos-plugin', 'Asset IPR Categories', 'Asset IPR Categories', 'manage_options', 'edit-tags.php?post_type=vrodos_asset3d&taxonomy=vrodos_asset3d_ipr_cat' );
	}

	/**
	 * Correct the admin menu highlighting for VRodos custom post types.
	 */
	public function vrodos_correct_admin_menu_highlight( $parent_file ) {
		global $pagenow, $current_screen, $submenu_file;

		$vrodos_post_types = [ 'vrodos_game', 'vrodos_scene', 'vrodos_asset3d' ];

		if ( in_array( $current_screen->post_type, $vrodos_post_types ) ) {
			$parent_file = 'vrodos-plugin'; // Set the main menu slug

			if ( $pagenow === 'post.php' || $pagenow === 'post-new.php' ) {
				$submenu_file = 'edit.php?post_type=' . $current_screen->post_type;
			}

			if ( $pagenow === 'edit-tags.php' ) {
				$submenu_file = 'edit-tags.php?taxonomy=' . $current_screen->taxonomy . '&post_type=' . $current_screen->post_type;
			}
		}

		return $parent_file;
	}
}
