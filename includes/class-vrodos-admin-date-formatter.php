<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Keep VRodos admin dates aligned with the installation's display settings. */
class VRodos_Admin_Date_Formatter {
	public function __construct() {
		add_filter( 'post_date_column_time', $this->format_post_date(...), 10, 2 );
	}

	public static function format_timestamp( int $timestamp ): string {
		if ( $timestamp <= 0 ) {
			return '';
		}
		return wp_date( (string) get_option( 'date_format' ) . ' ' . (string) get_option( 'time_format' ), $timestamp );
	}

	public function format_post_date( string $display, WP_Post $post ): string {
		if ( ! in_array( $post->post_type, [ 'vrodos_game', 'vrodos_scene', 'vrodos_asset3d' ], true ) ) {
			return $display;
		}
		$timestamp = get_post_timestamp( $post );
		return $timestamp ? self::format_timestamp( $timestamp ) : $display;
	}
}
