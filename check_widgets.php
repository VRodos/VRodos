<?php
require_once dirname( dirname( dirname( __DIR__ ) ) ) . '/wp-load.php';

$widget_model = get_option( 'widget_vrodos_3d_widget' );
$widget_scene = get_option( 'widget_vrodos_3d_widget_scene' );

$active_model = false;
if ( is_array( $widget_model ) ) {
	foreach ( $widget_model as $key => $val ) {
		if ( is_numeric( $key ) ) {
			$active_model = true;
			break;
		}
	}
}

$active_scene = false;
if ( is_array( $widget_scene ) ) {
	foreach ( $widget_scene as $key => $val ) {
		if ( is_numeric( $key ) ) {
			$active_scene = true;
			break;
		}
	}
}

echo 'Model Widget Active: ' . ( $active_model ? 'YES' : 'NO' ) . "\n";
echo 'Scene Widget Active: ' . ( $active_scene ? 'YES' : 'NO' ) . "\n";
