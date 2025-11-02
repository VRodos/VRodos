<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * VRodos_Install_Manager Class.
 *
 * Manages the activation and deactivation procedures for the VRodos plugin,
 * including database table creation, page creation, and cleanup on uninstall.
 */
class VRodos_Install_Manager {

	/**
	 * Constructor.
	 *
	 * Registers the activation and uninstall hooks.
	 */
	public function __construct() {
		register_activation_hook( VRODOS_PLUGIN_FILE, array( $this, 'activate' ) );
		register_uninstall_hook( VRODOS_PLUGIN_FILE, array( __CLASS__, 'uninstall' ) );
	}

	/**
	 * Plugin activation callback.
	 *
	 * Creates database tables and necessary pages.
	 */
	public function activate() {
		$this->vrodos_db_create_games_versions_table();
		VRodos_Pages_Manager::vrodos_create_pages();
		VRodos_Pages_Manager::vrodos_fx_admin_notice_activation_hook();
	}

	/**
	 * Plugin uninstall callback.
	 *
	 * Removes all plugin data from the database.
	 */
	public static function uninstall() {
		global $wpdb;
		$del_prefix = $wpdb->prefix;

		// 1. Options
		delete_option( 'vrodos_scene_yaml_children' );
		delete_option( 'vrodos_game_type_children' );
		delete_option( 'widget_vrodos_3d_widget' );
		delete_option( 'vrodos_db_version' );

		// 2. Postmeta
		$wpdb->query( "DELETE FROM {$del_prefix}postmeta WHERE meta_value LIKE '%vrodos%'" );

		// 3. Posts
		$wpdb->query( "DELETE FROM {$del_prefix}posts WHERE post_name LIKE '%vrodos%' OR post_name LIKE '%joker%'" );

		// 4. Termmeta
		$wpdb->query( "DELETE FROM {$del_prefix}termmeta WHERE meta_key LIKE '%vrodos%'" );

		// 5. Terms
		$wpdb->query( "DELETE FROM {$del_prefix}terms WHERE slug LIKE '%-yaml%'" );
		$wpdb->query( "DELETE FROM {$del_prefix}terms WHERE slug LIKE '%-joker%'" );
		$wpdb->query( "DELETE FROM {$del_prefix}terms WHERE slug LIKE '%_games%'" );
		$wpdb->query( "DELETE FROM {$del_prefix}terms WHERE slug LIKE '%pois_%'" );
		$wpdb->query( "DELETE FROM {$del_prefix}terms WHERE slug LIKE '%decoration%'" );
		$wpdb->query( "DELETE FROM {$del_prefix}terms WHERE slug LIKE '%door%'" );
		$wpdb->query( "DELETE FROM {$del_prefix}terms WHERE slug LIKE '%video%'" );
		$wpdb->query( "DELETE FROM {$del_prefix}terms WHERE slug LIKE '%chat%'" );

		// 6. Term taxonomy
		$wpdb->query( "DELETE FROM {$del_prefix}term_taxonomy WHERE taxonomy LIKE '%vrodos%'" );

		// 7. Games versions table
		$wpdb->query( "DROP TABLE IF EXISTS {$del_prefix}_games_versions" );
	}

	/**
	 * Create the table for games versions.
	 */
	public function vrodos_db_create_games_versions_table() {
		global $wpdb;
		$vrodos_db_version = '1.0';
		$table_name        = $wpdb->prefix . '_games_versions';
		$charset_collate   = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE $table_name (
			id mediumint(9) NOT NULL AUTO_INCREMENT,
			game_project_id int NOT NULL,
			version_number int NOT NULL,
			date_generated DATETIME DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY  (id)
		) $charset_collate;";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );

		add_option( 'vrodos_db_version', $vrodos_db_version );
	}

}

// Keep these functions globally accessible as they are used by other parts of the plugin.
function vrodos_append_version_game($game_project_id, $new_version_number) {
	global $wpdb;
	$table_name = $wpdb->prefix . "_games_versions";
	return $wpdb->insert(
		$table_name,
		array(
			'game_project_id' => $game_project_id,
			'version_number' => $new_version_number
		)
	);
}

function vrodos_get_last_version_of_game($game_project_id){
	global $wpdb;
	$table_name = $wpdb->prefix . "_games_versions";
	$lastverion = $wpdb->get_results(
		'SELECT max(version_number) FROM '.$table_name.' WHERE game_project_id='.$game_project_id,
		ARRAY_N );
	return $lastverion[0][0];
}

function vrodos_get_all_versions_of_game($game_project_id){
    global $wpdb;
    $table_name = $wpdb->prefix . "_games_versions";
    return $wpdb->get_results( 'SELECT * FROM '.$table_name.' WHERE game_project_id='.$game_project_id, OBJECT );
}
