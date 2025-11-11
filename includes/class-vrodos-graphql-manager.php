<?php

if (!defined('ABSPATH')) {
    exit;
}

class VRodos_GraphQL_Manager {

    public function __construct() {
        add_action( 'graphql_register_types', array($this, 'register_graphql_fields'));
    }

    public function register_graphql_fields() {
        register_graphql_field( 'vrodosAsset3d', 'glb', [
            'type' => 'String',
            'description' => __( 'The glb 3D file of the asset3d', 'wp-graphql' ),
            'resolve' => function( $post ) {
                $glb = get_post_meta( $post->ID, 'vrodos_asset3d_glb', true );
                return ! empty( $glb ) ? $glb : 'blue';
            }
        ] );
    }
}
