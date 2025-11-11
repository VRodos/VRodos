<?php

if (!defined('ABSPATH')) {
    exit;
}

class VRodos_Shortcode_Manager {

    public function __construct() {
        add_shortcode( 'VRodos_3D_widget_shortcode', array($this, 'vrodos_3D_widget_shortcode') );
        add_shortcode( 'visitor', array($this, 'vrodos_visitor_check_shortcode') );
    }

    public function vrodos_3D_widget_shortcode( $atts, $content = null ) {

        $a = shortcode_atts( array(
            'id' => '',
            'title' => 'NoGapsTitle',
            'titleshow' => 'false',
            'asset_id' => '',
            'camerapositionx' => 0,
            'camerapositiony' => 0,
            'camerapositionz' => -1,
            'canvaswidth' => '600px',
            'canvasheight' => '400px',
            'canvasbackgroundcolor' => 'transparent',
            'enablepan' => 'true',
            'enablezoom' => 'true',
            'canvasposition' => 'relative',
            'canvastop' => '',
            'canvasbottom' => '',
            'canvasleft' => '',
            'canvasright' => '',
            'customcss' => ''
        ), $atts );

        ob_start();
        the_widget('vrodos_3d_widget', $a, array(
            'widget_id'=>'arbitrary-instance-'.$a['id'],
            'before_widget' => '',
            'after_widget' => '',
            'before_title' => '',
            'after_title' => ''
        ));


        $output = ob_get_contents();
        ob_end_clean();
        return $output;
    }

    public function vrodos_visitor_check_shortcode( $atts, $content = null ) {
        if ( ( !is_user_logged_in() && !is_null( $content ) ) || is_feed() )
            return $content;
        return '';
    }
}