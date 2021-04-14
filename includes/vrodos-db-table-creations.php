<?php

global $wpunity_db_version;
$wpunity_db_version = '1.0';

/**
 *     Create the table of games versions
 */
function wpunity_db_create_games_versions_table () {
	global $wpdb;
	global $wpunity_db_version;

	$table_name = $wpdb->prefix . "_games_versions";

	$charset_collate = $wpdb->get_charset_collate();

	$sql = "CREATE TABLE $table_name (
  id mediumint(9) NOT NULL AUTO_INCREMENT,
  game_project_id int NOT NULL,
  version_number int NOT NULL,
  date_generated DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY  (id)
) $charset_collate;";

	require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
	dbDelta( $sql );

	add_option( 'wpunity_db_version', $wpunity_db_version );
 
 
}

/**
 *
 * Append game version number
 *
 * @param $game_project_id
 * @param $new_version_number
 */
function wpunity_append_version_game($game_project_id, $new_version_number) {
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

/**
 * Get the last version of the game
 *
 * @param $game_project_id
 * @return array|int|null|object
 */
function wpunity_get_last_version_of_game($game_project_id){

	global $wpdb;
	$table_name = $wpdb->prefix . "_games_versions";

	$lastverion = $wpdb->get_results(
        'SELECT max(version_number) FROM '.$table_name.' WHERE game_project_id='.$game_project_id,
        ARRAY_N );


	return $lastverion[0][0];
}

/**
 * Get all versions of a game
 *
 * @param $game_project_id
 * @return array|null|object
 */
function wpunity_get_all_versions_of_game($game_project_id){
    global $wpdb;
    $table_name = $wpdb->prefix . "_games_versions";

    return $wpdb->get_results( 'SELECT * FROM '.$table_name.' WHERE game_project_id='.$game_project_id, OBJECT );
}
