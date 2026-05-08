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
	private const LEGACY_ASSET_CLONE_META_CLEANUP_OPTION = 'vrodos_removed_legacy_asset_clone_meta';
	private const LEGACY_ASSET_REMOVED_FIELDS_CLEANUP_OPTION = 'vrodos_removed_legacy_asset_removed_fields_meta';

	/**
	 * Constructor.
	 *
	 * Registers the activation and uninstall hooks.
	 */
	public function __construct() {
		register_activation_hook( VRODOS_PLUGIN_FILE, [$this, 'activate'] );
		register_uninstall_hook( VRODOS_PLUGIN_FILE, [self::class, 'uninstall'] );
		add_action( 'init', [$this, 'run_legacy_cleanup_migrations'], 20 );
	}

	/**
	 * Plugin activation callback.
	 *
	 * Creates database tables and necessary pages.
	 */
	public function activate(): void {
		$this->vrodos_db_create_games_versions_table();
		$this->create_required_directories();
		VRodos_Pages_Manager::vrodos_create_pages();
	}

	/**
	 * Create directories required by the plugin at runtime.
	 * Safe to call on every activation — wp_mkdir_p() is idempotent.
	 */
	private function create_required_directories(): void {
		$dirs = [
			VRodos_Path_Manager::runtime_build_path(),
		];
		foreach ( $dirs as $dir ) {
			wp_mkdir_p( $dir );
		}
	}

	public function run_legacy_cleanup_migrations(): void {
		$this->run_legacy_asset_clone_meta_cleanup();
		$this->run_legacy_asset_removed_fields_cleanup();
	}

	private function run_legacy_asset_clone_meta_cleanup(): void {
		if ( get_option( self::LEGACY_ASSET_CLONE_META_CLEANUP_OPTION ) === '1' ) {
			return;
		}

		global $wpdb;
		$deleted = $wpdb->delete(
			$wpdb->postmeta,
			['meta_key' => 'vrodos_asset3d_is' . 'Cloned'],
			['%s']
		);

		if ( $deleted !== false ) {
			$this->clear_asset_list_transients();
			update_option( self::LEGACY_ASSET_CLONE_META_CLEANUP_OPTION, '1', false );
		}
	}

	private function run_legacy_asset_removed_fields_cleanup(): void {
		if ( get_option( self::LEGACY_ASSET_REMOVED_FIELDS_CLEANUP_OPTION ) === '1' ) {
			return;
		}

		global $wpdb;
		$legacy_reward_key = 'vrodos_asset3d_is' . 'reward';
		$legacy_font_key   = 'vrodos_asset3d_fo' . 'nts';
		$legacy_image_key  = 'vrodos_asset3d_diff' . 'image';

		$image_meta_rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT post_id, meta_value FROM $wpdb->postmeta WHERE meta_key = %s",
				$legacy_image_key
			)
		);

		if ( is_array( $image_meta_rows ) ) {
			foreach ( $image_meta_rows as $image_meta_row ) {
				$asset_id      = absint( $image_meta_row->post_id ?? 0 );
				$attachment_id = absint( $image_meta_row->meta_value ?? 0 );

				if ( $asset_id <= 0 || $attachment_id <= 0 ) {
					continue;
				}

				$attachment = get_post( $attachment_id );
				if ( $attachment && $attachment->post_type === 'attachment' && (int) $attachment->post_parent === $asset_id ) {
					wp_delete_attachment( $attachment_id, true );
				}
			}
		}

		$deleted = $wpdb->query(
			$wpdb->prepare(
				"DELETE FROM $wpdb->postmeta WHERE meta_key IN (%s, %s, %s)",
				$legacy_reward_key,
				$legacy_font_key,
				$legacy_image_key
			)
		);

		if ( $deleted !== false ) {
			$this->clear_asset_list_transients();
			update_option( self::LEGACY_ASSET_REMOVED_FIELDS_CLEANUP_OPTION, '1', false );
		}
	}

	private function clear_asset_list_transients(): void {
		global $wpdb;
		$wpdb->query( $wpdb->prepare( "DELETE FROM $wpdb->options WHERE option_name LIKE %s OR option_name LIKE %s", '_transient_vrodos_assets_%', '_transient_timeout_vrodos_assets_%' ) );
	}

	/**
	 * Plugin uninstall callback.
	 *
	 * Removes all plugin data from the database.
	 */
	public static function uninstall(): void {
		global $wpdb;
		$del_prefix = $wpdb->prefix;

		// 1. Options
		delete_option( 'vrodos_scene_yaml_children' );
		delete_option( 'vrodos_game_type_children' );
		delete_option( 'widget_vrodos_3d_widget' );
		delete_option( 'vrodos_db_version' );
		delete_option( self::LEGACY_ASSET_CLONE_META_CLEANUP_OPTION );
		delete_option( self::LEGACY_ASSET_REMOVED_FIELDS_CLEANUP_OPTION );

		// 2. Postmeta
		$wpdb->query( $wpdb->prepare( "DELETE FROM {$del_prefix}postmeta WHERE meta_value LIKE %s", '%vrodos%' ) );

		// 3. Posts
		$wpdb->query( $wpdb->prepare( "DELETE FROM {$del_prefix}posts WHERE post_name LIKE %s OR post_name LIKE %s", '%vrodos%', '%joker%' ) );

		// 4. Termmeta
		$wpdb->query( $wpdb->prepare( "DELETE FROM {$del_prefix}termmeta WHERE meta_key LIKE %s", '%vrodos%' ) );

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
	public function vrodos_db_create_games_versions_table(): void {
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
function vrodos_append_version_game( $game_project_id, $new_version_number ) {
	global $wpdb;
	$table_name = $wpdb->prefix . '_games_versions';
	return $wpdb->insert(
		$table_name,
		['game_project_id' => $game_project_id, 'version_number'  => $new_version_number]
	);
}

function vrodos_get_last_version_of_game( $game_project_id ) {
	global $wpdb;
	$table_name = $wpdb->prefix . '_games_versions';
	$lastverion = $wpdb->get_results(
		'SELECT max(version_number) FROM ' . $table_name . ' WHERE game_project_id=' . $game_project_id,
		ARRAY_N
	);
	return $lastverion[0][0];
}

function vrodos_get_all_versions_of_game( $game_project_id ) {
	global $wpdb;
	$table_name = $wpdb->prefix . '_games_versions';
	return $wpdb->get_results( 'SELECT * FROM ' . $table_name . ' WHERE game_project_id=' . $game_project_id, OBJECT );
}
