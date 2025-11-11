<?php

if (!defined('ABSPATH')) {
    exit;
}

class VRodos_Block_Manager {

    public function __construct() {
        add_action( 'init', array($this, 'vrodos_3d_register_block') );
    }

    public function vrodos_3d_register_block() {

        wp_register_script('vrodos-3d-block', plugin_dir_url( VRODOS_PLUGIN_FILE ).'build/index.js',
            array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-editor' )
        );

        wp_register_style('vrodos-blocks-style', plugins_url( '../css/vrodos_blocks.css', __FILE__ ),
            array( 'wp-edit-blocks' )
        );

        register_block_type( 'vrodos/vrodos-3d-block',
            array(
                'api_version' => 2,
                'editor_script' => 'vrodos-3d-block',
                'style' => 'vrodos-blocks-style',
                'editor_style' => 'vrodos-blocks-style',
            )
        );

    }
}
