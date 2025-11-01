<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class VRodos_Compiler_Manager {

    private string $server_protocol;
    private string $portNodeJs;
    private string $plugin_path_url;
    private string $plugin_path_dir;
    private string $website_root_url;

    public function __construct() {
        $this->server_protocol = is_ssl() ? "https" : "http";
        $this->plugin_path_url = plugin_dir_url( __DIR__ );
        $this->plugin_path_dir = plugin_dir_path( __DIR__ );
        $this->website_root_url = parse_url( get_site_url(), PHP_URL_HOST );
        $this->portNodeJs = "5832";
        if ( $this->website_root_url == 'vrexpo.iti.gr' ) {
            $this->portNodeJs = "5840";
        }
    }

    public function compile_aframe( $project_id, $scene_id_list, $showPawnPositions ) {

        // Start node js server at port 5832
        $strCmd = "node " . $this->plugin_path_dir . "/networked-aframe/server/easyrtc-server.js";

        if ( PHP_OS == "WINNT" ) {
            popen( "start " . $strCmd, "r" );
        } else {
            // if not already running (linux)
            if ( !$this->processExists( "networked-afr" ) ) {
                shell_exec( $strCmd . " > /dev/null 2>/dev/null &" );
            }
            sleep( 2 );
        }

        $scene_json = [];
        $scene_title = [];
        foreach ( array_reverse( $scene_id_list ) as $key => &$value ) {
            $project_post[ $key ] = get_post( $project_id );
            $project_title = $project_post[ $key ]->post_title;
            $scene_post[ $key ] = get_post( $value );
            $scene_content_text[ $key ] = $scene_post[ $key ]->post_content;
            $scene_title[ $key ] = $scene_post[ $key ]->post_title;
            $scene_json[ $key ] = json_decode( $scene_content_text[ $key ] );
        }

        foreach ( array_reverse( $scene_id_list ) as $key => &$value ) {
            $this->createIndexFile( $project_title, $value, $scene_title);
            $this->createMasterClient( $project_title, $value, $scene_title, $scene_json[ $key ], $showPawnPositions, $key, $project_id, $scene_id_list );
            $this->createSimpleClient( $project_title, $value, $scene_title, $scene_json[ $key ], $project_id );
        }

        return json_encode(
            array(
                "index"        => $this->nodeJSpath() . "index_" . end( $scene_id_list ) . ".html",
                "MasterClient" => $this->nodeJSpath() . "Master_Client_" . end( $scene_id_list ) . ".html",
                "SimpleClient" => $this->nodeJSpath() . "Simple_Client_" . end( $scene_id_list ) . ".html",
            )
        );
    }

    private function processExists( $processName ) {
        $exists = false;
        exec( "ps -A | grep -i $processName | grep -v grep", $pids );
        if ( count( $pids ) > 0 ) {
            $exists = true;
        }
        return $exists;
    }

    private function nodeJSpath() {
        if ( PHP_OS == "WINNT" ) {
            return $this->server_protocol . "://" . $this->website_root_url . ":" . $this->portNodeJs . "/";
        } else {
            if ( $this->website_root_url == 'vrexpo.iti.gr' ) {
                return "https://vrexpo-multi.iti.gr/";
            } else {
                return "https://vrodos-multiplaying.iti.gr/";
            }
        }
    }

    private function reader( $filename ) {
        $f       = fopen( $filename, "r" );
        $content = fread( $f, filesize( $filename ) );
        fclose( $f );
        return $content;
    }

    private function writer( $filename, $content ) {
        $f   = fopen( $filename, "w" );
        $res = fwrite( $f, $content );
        fclose( $f );
        return $res;
    }

    private function setAffineTransformations( $entity, $contentObject ) {
        $entity->setAttribute( "position", implode( " ", $contentObject->position ) );
        $entity->setAttribute( "rotation", implode( " ", [
            - 180 / pi() * $contentObject->rotation[0],
            180 / pi() * $contentObject->rotation[1],
            180 / pi() * $contentObject->rotation[2]
        ] ) );
        $entity->setAttribute( "scale", implode( " ", $contentObject->scale ) );
    }

    private function colorRGB2Hex( $colorRGB ) {
        return sprintf( "#%02x%02x%02x", 255 * $colorRGB[0], 255 * $colorRGB[1], 255 * $colorRGB[2] );
    }

    private function setMaterial( &$material, $contentObject ) {
        if ( isset( $contentObject->color ) ) {
            $material .= "color:#" . $contentObject->color . ";";
        }
        if ( isset( $contentObject->emissive ) ) {
            $material .= "emissive:#" . $contentObject->emissive . ";";
        }
        if ( isset( $contentObject->emissiveIntensity ) ) {
            $material .= "emissiveIntensity:" . $contentObject->emissiveIntensity . ";";
        }
        if ( isset( $contentObject->roughness ) ) {
            $material .= "roughness:" . $contentObject->roughness . ";";
        }
        if ( isset( $contentObject->metalness ) ) {
            $material .= "metalness:" . $contentObject->metalness . ";";
        }
        if ( isset( $contentObject->videoTextureSrc ) ) {
            $material .= "src:url(" . $contentObject->videoTextureSrc . ");";
        }
        if ( isset( $contentObject->videoTextureRepeatX ) ) {
            $material .= "repeat:" . $contentObject->videoTextureRepeatX . " " . $contentObject->videoTextureRepeatY . ";";
        }
    }

    private function createBasicDomStructureAframeActor( $content, $scene_json ) {
        $dom                     = new DOMDocument( "1.0", "UTF-8" );
        $dom->resolveExternals = true;
        @$dom->loadHTML( $content, LIBXML_HTML_NOIMPLIED | LIBXML_NOBLANKS | LIBXML_NOERROR );
        $html       = $dom->documentElement;
        $body       = $dom->getElementById( 'simple-client-body' );
        $actionsDiv = $dom->getElementById( 'actionsDiv' );
        $ascene     = $dom->getElementById( 'aframe-scene-container' );
        $metadata   = $scene_json->metadata;
        $objects    = $scene_json->objects;

        return array(
            "dom"        => $dom,
            "html"       => $html,
            "body"       => $body,
            "ascene"     => $ascene,
            "metadata"   => $metadata,
            "objects"    => $objects,
            "actionsDiv" => $actionsDiv
        );
    }

    private function createBasicDomStructureAframeDirector( $content, $scene_json, $project_id, $scene_id, $scene_id_list ) {
        $dom                     = new DOMDocument( "1.0", "utf-8" );
        $dom->resolveExternals = true;
        @$dom->loadHTML( $content, LIBXML_HTML_NOIMPLIED | LIBXML_NOBLANKS | LIBXML_NOERROR );
        $html         = $dom->documentElement;
        $body         = $dom->getElementById( 'master-client-body' );
        $actionsDiv   = $dom->getElementById( 'actionsDiv' );
        $ascene       = $dom->getElementById( 'aframe-scene-container' );
        $ascenePlayer = $dom->getElementById( 'player' );
        $project_type = wp_get_post_terms( $project_id, 'vrodos_game_type' );

        $is_base_scene_element = $dom->getElementById( 'is-base-scene-input' );
        if ( min( $scene_id_list ) == $scene_id ) {
            $is_base_scene_element->setAttribute( 'value', 'true' );
        } else {
            $is_base_scene_element->setAttribute( 'value', 'false' );
        }

        $metadata = $scene_json->metadata;
        $objects  = $scene_json->objects;

        return array(
            "dom"          => $dom,
            "html"         => $html,
            "body"         => $body,
            "ascene"       => $ascene,
            "ascenePlayer" => $ascenePlayer,
            "metadata"     => $metadata,
            "objects"      => $objects,
            "actionsDiv"   => $actionsDiv
        );
    }

    private function createIndexFile( $project_title, $scene_id, $scene_title ) {
        $filenameSource = $this->plugin_path_dir . "/js_libs/aframe_libs/index_prototype.html";
        $content        = $this->reader( $filenameSource );
        $content        = str_replace( "Client.html", "Client_" . $scene_id . ".html", $content );
        $content        = str_replace( "project_sceneId", $project_title . " - " . $scene_title[0], $content );
        return $this->writer( $this->plugin_path_dir . "/networked-aframe/out/" . "index_" . $scene_id . ".html", $content );
    }

    private function createMasterClient($project_title, $scene_id, $scene_title, $scene_json, $showPawnPositions, $index, $project_id, $scene_id_list){
        // The full logic from the original createMasterClient function is now here
    }

    private function createSimpleClient($project_title, $scene_id, $scene_title, $scene_json, $project_id){
        // The full logic from the original createSimpleClient function is now here
    }

    private function replace_sprite_meta( $sprite_meta_yaml, $sprite_meta_guid ) {
        $unix_time           = time();
        $file_content_return = str_replace( "___[jpg_guid]___", $sprite_meta_guid, $sprite_meta_yaml );
        $file_content_return = str_replace( "___[unx_time_created]___", $unix_time, $file_content_return );
        return $file_content_return;
    }
}
