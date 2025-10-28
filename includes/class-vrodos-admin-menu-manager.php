<?php

if (!defined('ABSPATH')) {
    exit;
}

class VRodos_Admin_Menu_Manager {

    public function __construct() {
        add_action('admin_head', array($this, 'fix_admin_menu_highlighting'));
    }

    public function fix_admin_menu_highlighting() {
        global $pagenow, $typenow, $taxnow;

        // Condition for the main CPT listing and edit pages
        if ($pagenow === 'edit.php' || $pagenow === 'post.php' || $pagenow === 'post-new.php') {
            if ($typenow === 'vrodos_game' || $typenow === 'vrodos_scene' || $typenow === 'vrodos_asset3d') {
                echo '<script>
                    jQuery(document).ready(function($) {
                        $("#toplevel_page_vrodos-plugin").addClass("wp-has-current-submenu wp-menu-open").removeClass("wp-not-current-submenu");
                        $("#toplevel_page_vrodos-plugin > a").addClass("wp-has-current-submenu wp-menu-open").removeClass("wp-not-current-submenu");
                        $("a[href=\'edit.php?post_type=' . $typenow . '\']").parent().addClass("current");
                    });
                </script>';
            }
        }

        // Condition for the taxonomy pages
        if ($pagenow === 'edit-tags.php') {
            $taxonomies = array(
                'vrodos_game_type',
                'vrodos_scene_yaml',
                'vrodos_scene_pgame',
                'vrodos_asset3d_cat',
                'vrodos_asset3d_pgame',
                'vrodos_asset3d_ipr_cat'
            );
            if (in_array($taxnow, $taxonomies)) {
                $post_type = sanitize_text_field($_GET['post_type']);
                echo '<script>
                    jQuery(document).ready(function($) {
                        $("#toplevel_page_vrodos-plugin").addClass("wp-has-current-submenu wp-menu-open").removeClass("wp-not-current-submenu");
                        $("#toplevel_page_vrodos-plugin > a").addClass("wp-has-current-submenu wp-menu-open").removeClass("wp-not-current-submenu");
                        $("a[href*=\'edit-tags.php?taxonomy=' . $taxnow . '\'][href*=\'post_type=' . $post_type . '\']").parent().addClass("current");
                    });
                </script>';
            }
        }
    }
}
