<?php

function vrodos_getDefaultJSONscene($mygameType){

    $p = plugin_dir_path( __DIR__ );

    switch ($mygameType) {
        case 'archaeology':
        case 'virtualproduction':
        case 'vrexpo':
        default:
            $def_json = file_get_contents($p . "/assets/standard_scene.json");
            break;
    }
    return $def_json;
}


//==========================================================================================================================================

/* Get all game projects of the user */
function vrodos_get_user_game_projects($user_id, $isUserAdmin){

    $games_slugs = ['archaeology-joker'];

    // user is not logged in return only joker game
    if($user_id==0)
        return $games_slugs;

    $custom_query_args = array(
//        'author' => $user_id,
        'post_type' => 'vrodos_game',
        'posts_per_page' => -1,
    );

    // if user is not admin then add as filter the author (else the admin can see all authors)
    if (!$isUserAdmin)
        $custom_query_args['author'] = $user_id;

    $custom_query = new WP_Query($custom_query_args);

    if ($custom_query->have_posts()) :
        while ($custom_query->have_posts()) :
            $custom_query->the_post();
            $game_slug = get_post()->post_name;
            $games_slugs[] = $game_slug;
        endwhile;
    endif;

    wp_reset_postdata();
    $wp_query = NULL;

    return array_unique ($games_slugs);
}


function get_scenes_wonder_around() {
    $allScenes = [];

    $custom_query_args = array(
        'post_type'      => 'vrodos_scene',
        'posts_per_page' => - 1,
        'tax_query'      => array(
            array(
                'taxonomy' => 'vrodos_scene_yaml',
                'field'    => 'slug',
                'terms'    => 'wonderaround-yaml',
            ),
        ),
        'orderby'        => 'ID',
        'order'          => 'DESC',
        /*'paged' => $paged,*/
    );

    $custom_query = new WP_Query( $custom_query_args );

    if ( $custom_query->have_posts() ) :
        while ( $custom_query->have_posts() ) :

            $custom_query->the_post();
            $scene_id = get_the_ID();
            $scene_name = get_the_title();

            $scenePGame = get_the_terms($scene_id, 'vrodos_scene_pgame');

            $allAssets[] = [
                'sceneName'=>$scene_name,
                'sceneSlug'=>get_post()->post_name,
                'sceneid'=>$scene_id,
                'scene_parent_project'=>$scenePGame
            ];

        endwhile;
    endif;

    return $allAssets;
}



function get_assets($games_slugs){
    $allAssets = [];
    $queryargs = array(
        'post_type' => 'vrodos_asset3d',
        'posts_per_page' => -1
    );

    if ($games_slugs){
        $queryargs['tax_query'] = array(
            array(
                'taxonomy' => 'vrodos_asset3d_pgame',
                'field' => 'slug',
                'terms' => $games_slugs
            ));
    }

    $custom_query = new WP_Query( $queryargs );

    if ( $custom_query->have_posts() ) :
        while ( $custom_query->have_posts() ) :

            $custom_query->the_post();

            $asset_id = get_the_ID();
            $asset_name = get_the_title();
            $asset_pgame = wp_get_post_terms($asset_id, 'vrodos_asset3d_pgame');
            $asset_cat_arr = wp_get_post_terms($asset_id, 'vrodos_asset3d_cat');

            $glbID = get_post_meta($asset_id, 'vrodos_asset3d_glb', true); // GLB ID
            $glbPath = $glbID ? wp_get_attachment_url( $glbID ) : '';                   // GLB PATH

            $sshotID = get_post_meta($asset_id, 'vrodos_asset3d_screenimage', true); // Screenshot Image ID
            $sshotPath = $sshotID ? wp_get_attachment_url( $sshotID ) : '';           // Screenshot Image PATH

            $author_id = get_post_field ('post_author', $asset_id);
            $author_displayname = get_the_author_meta( 'display_name' , $author_id );
            $author_username = get_the_author_meta( 'nickname' , $author_id );

            $assettrs = get_post_meta($asset_id,'vrodos_asset3d_assettrs', true);

            $data_arr = [
                'asset_name'=>get_the_title(),
                'asset_slug'=>get_post()->post_name,
                'asset_id'=>$asset_id,
                'category_name'=>$asset_cat_arr[0]->name,
                'category_slug'=>$asset_cat_arr[0]->slug,
                'category_id'=>$asset_cat_arr[0]->term_id,
                'category_icon'=> get_term_meta($asset_cat_arr[0]->term_id, 'vrodos_assetcat_icon', true),
                'glb_id'=>$glbID,
                'glb_path'=>$glbPath,
                'path'=>$glbPath,
                'screenshot_id'=>$sshotID,
                'screenshot_path'=>$sshotPath,
                'is_cloned'=> get_post_meta($asset_id, 'vrodos_asset3d_isCloned', true),
                'is_joker'=> get_post_meta($asset_id, 'vrodos_asset3d_isJoker', true),
                'assettrs' => $assettrs,
                'asset_parent_game'=>$asset_pgame[0]->name,
                'asset_parent_game_slug'=>$asset_pgame[0]->slug,
                'author_id'=> $author_id,
                'author_displayname'=> $author_displayname,
                'author_username'=> $author_username
            ];

            switch ($asset_cat_arr[0]->slug) {
                case 'video':
                    $data_arr['video_id'] = get_post_meta($asset_id, 'vrodos_asset3d_video', true);
                    $data_arr['video_path'] = wp_get_attachment_url( $data_arr['video_id'] );
                    $data_arr['video_title'] = get_post_meta($asset_id, 'vrodos_asset3d_video_title', true);
                    $data_arr['video_loop'] = get_post_meta($asset_id, 'vrodos_asset3d_video_autoloop', true);
                    break;
                case 'poi-imagetext':
                    $data_arr['poi_img_id'] = get_post_meta($asset_id, 'vrodos_asset3d_poi_imgtxt_image', true);
                    $data_arr['poi_img_path'] = wp_get_attachment_url( $data_arr['poi_img_id'] );
                    $data_arr['poi_img_title'] = get_post_meta($asset_id, 'vrodos_asset3d_poi_imgtxt_title', true);
                    $data_arr['poi_img_content'] = get_post_meta($asset_id, 'vrodos_asset3d_poi_imgtxt_content', true);
                    break;
                case 'chat':
                    $data_arr['chat_type'] = get_post_meta($asset_id, 'vrodos_asset3d_chat_type', true);
                    break;
                case 'poi-link':
                    $data_arr['poi_link_url'] = get_post_meta($asset_id, 'vrodos_asset3d_link', true);
                    break;
                case 'poi-help':
                    $data_arr['poi_chat_title'] = get_post_meta($asset_id, 'vrodos_asset3d_poi_chattxt_title', true);
                    $data_arr['poi_chat_indicators'] = get_post_meta($asset_id, 'vrodos_asset3d_poi_chatbut_indicators', true);
                    break;
            }
            array_push($allAssets, $data_arr);

        endwhile;
    endif;

    // Reset postdata
    wp_reset_postdata();

    return $allAssets;
}



//==========================================================================================================================================

//TODO check them

function vrodos_fetch_game_assets_action_callback() {


    // Output the directory listing as JSON
    header('Content-type: application/json');

    $response = vrodos_get_assets_by_game($_POST['gameProjectSlug'], $_POST['gameProjectID']);

    for ($i=0; $i<count($response); $i++) {
        if (array_key_exists('assetName', $response[$i])) {
            $response[$i]['name'] = $response[$i]['assetName'];
            $response[$i]['type'] = 'file';
        }
    }

    $jsonResp =  json_encode(
        array(
            "items" => $response
        )
    );

    echo $jsonResp;
    wp_die();
}

/**
 * Get the Assets of a game plus its respective joker game assets
 *
 * @param $gameProjectSlug
 * @param $gameProjectID
 * @return array
 */
function vrodos_get_assets_by_game($gameProjectSlug, $gameProjectID){

    $allAssets = [];

//	// find the joker game slug e.g. "Archaeology-joker"
//	$joker_game_slug = wp_get_post_terms( $gameProjectID, 'vrodos_game_type')[0]->name."-joker";
//
//	// Slugs are low case "Archaeology-joker" -> "archaeology-joker"
//	$joker_game_slug = strtolower($joker_game_slug);

    $queryargs = array(
        'post_type' => 'vrodos_asset3d',
        'posts_per_page' => -1,
        'tax_query' => array(
            array(
                'taxonomy' => 'vrodos_asset3d_pgame',
                'field' => 'slug',
                'terms' => array($gameProjectSlug, 'vrexpo-joker', 'archaeology-joker', 'virtualproduction-joker')
            )
        )
    );

    $custom_query = new WP_Query( $queryargs );

    if ( $custom_query->have_posts() ) :
        while ( $custom_query->have_posts() ) :

            $custom_query->the_post();

            $asset_id = get_the_ID();
            $asset_cat_arr = wp_get_post_terms($asset_id, 'vrodos_asset3d_cat');

            $glbID = get_post_meta($asset_id, 'vrodos_asset3d_glb', true); // GLB ID
            $glbPath = $glbID ? wp_get_attachment_url( $glbID ) : '';                   // GLB PATH
           

            $sshotID = get_post_meta($asset_id, 'vrodos_asset3d_screenimage', true); // Screenshot Image ID
            $sshotPath = $sshotID ? wp_get_attachment_url( $sshotID ) : '';           // Screenshot Image PATH

            $data_arr = [
                'asset_name'=>get_the_title(),
                'asset_slug'=>get_post()->post_name,
                'asset_id'=>$asset_id,
                'category_name'=>$asset_cat_arr[0]->name,
                'category_slug'=>$asset_cat_arr[0]->slug,
                'category_id'=>$asset_cat_arr[0]->term_id,
                'category_icon'=> get_term_meta($asset_cat_arr[0]->term_id, 'vrodos_assetcat_icon', true),
                'glb_id'=>$glbID,
                'glb_path'=>$glbPath,
                'path'=>$glbPath,
                'screenshot_id'=>$sshotID,
                'screenshot_path'=>$sshotPath,
                'is_cloned'=> get_post_meta($asset_id, 'vrodos_asset3d_isCloned', true),
                'is_joker'=> get_post_meta($asset_id, 'vrodos_asset3d_isJoker', true)
            ];

            switch ($asset_cat_arr[0]->slug) {
                case 'video':
                    $data_arr['video_id'] = get_post_meta($asset_id, 'vrodos_asset3d_video', true);
                    $data_arr['video_path'] = wp_get_attachment_url( $data_arr['video_id'] );
                    $data_arr['video_title'] = get_post_meta($asset_id, 'vrodos_asset3d_video_title', true);
                    $data_arr['video_loop'] = get_post_meta($asset_id, 'vrodos_asset3d_video_autoloop', true);
                    break;
                case 'poi-imagetext':
                    $data_arr['poi_img_id'] = get_post_meta($asset_id, 'vrodos_asset3d_poi_imgtxt_image', true);
                    $data_arr['poi_img_path'] = wp_get_attachment_url( $data_arr['poi_img_id'] );
                    $data_arr['poi_img_title'] = get_post_meta($asset_id, 'vrodos_asset3d_poi_imgtxt_title', true);
                    $data_arr['poi_img_content'] = get_post_meta($asset_id, 'vrodos_asset3d_poi_imgtxt_content', true);
                    break;
                case 'chat':
                    $data_arr['chat_type'] = get_post_meta($asset_id, 'vrodos_asset3d_chat_type', true);
                    break;
                case 'poi-link':
                    $data_arr['poi_link_url'] = get_post_meta($asset_id, 'vrodos_asset3d_link', true);
                    break;
                case 'poi-help':
                    $data_arr['poi_chat_title'] = get_post_meta($asset_id, 'vrodos_asset3d_poi_chattxt_title', true);
                    $data_arr['poi_chat_indicators'] = get_post_meta($asset_id, 'vrodos_asset3d_poi_chatbut_indicators', true);
                    break;
            }
           
            array_push($allAssets, $data_arr);

        endwhile;
    endif;

    // Reset postdata
    wp_reset_postdata();

    return $allAssets;
}


/**
 * Get the Assets of a game plus its respective joker game assets
 *
 * @param $gameProjectSlug
 * @param $gameProjectID
 * @return array
 */
function vrodos_get_assetids_joker($gameType){

    $assetIds = [];

    // find the joker game slug e.g. "Archaeology-joker"
    $joker_game_slug = $gameType."-joker";

    // Slugs are low case "Archaeology-joker" -> "archaeology-joker"
    $joker_game_slug = strtolower($joker_game_slug);

    $queryargs = array(
        'post_type' => 'vrodos_asset3d',
        'posts_per_page' => -1,
        'tax_query' => array(
            array(
                'taxonomy' => 'vrodos_asset3d_pgame',
                'field' => 'slug',
                'terms' => $joker_game_slug
            )
        )
    );

    $custom_query = new WP_Query( $queryargs );

    if ( $custom_query->have_posts() ) :
        while ( $custom_query->have_posts() ) :
            $custom_query->the_post();
            $assetIds[] = get_the_ID();
        endwhile;
    endif;

    // Reset postdata
    wp_reset_postdata();

    return $assetIds;
}


function getProjectScenes($parent_project_id_as_term_id){

    $custom_query_args = array(
        'post_type' => 'vrodos_scene',
        'posts_per_page' => -1,
        'tax_query' => array(
            array(
                'taxonomy' => 'vrodos_scene_pgame',
                'field'    => 'term_id',
                'terms'    => $parent_project_id_as_term_id,
            ),
        ),
        'orderby' => 'ID',
        'order' => 'DESC',
        /*'paged' => $paged,*/
    );

    $custom_query = new WP_Query( $custom_query_args );

    return $custom_query;
}

function get_3D_model_files($assetpostMeta, $asset_id){

    $mtl_file_name = $obj_file_name = $pdb_file_name = $glb_file_name = $fbx_file_name =
    $textures_fbx_string_connected = $path_url = null;

    //OBJ
    if (array_key_exists('vrodos_asset3d_obj', $assetpostMeta)) {

        $mtlpost = get_post($assetpostMeta['vrodos_asset3d_mtl'][0]);

        $mtl_file_name = basename($mtlpost->guid);
        $obj_file_name = basename(get_post($assetpostMeta['vrodos_asset3d_obj'][0])->guid);
        $path_url = pathinfo($mtlpost->guid)['dirname'];

        // PDB
    } else if (array_key_exists('vrodos_asset3d_pdb', $assetpostMeta)){
        $pdb_file_name = get_post($assetpostMeta['vrodos_asset3d_pdb'][0])->guid;

        // GLB
    } else if (array_key_exists('vrodos_asset3d_glb', $assetpostMeta)) {

        $glb_file_name = get_post($assetpostMeta['vrodos_asset3d_glb'][0]) ? get_post($assetpostMeta['vrodos_asset3d_glb'][0])->guid : null;


        // FBX
    } else if (array_key_exists('vrodos_asset3d_fbx', $assetpostMeta)) {

        // Get texture attachments of post
        $args = array(
            'posts_per_page' => 100,
            'order'          => 'DESC',
            'post_mime_type' => 'image',
            'post_parent'    => $asset_id,
            'post_type'      => 'attachment'
        );

        $attachments_array =  get_children( $args,OBJECT );  //returns Array ( [$image_ID].

        // Add texture urls to a string separated by |
        $textures_fbx_string_connected = '';

        foreach ($attachments_array as $k){
            $url = $k->guid;

            // ignore screenshot attachment
            if (!strpos($url, 'texture')) {
                continue;
            }

            $textures_fbx_string_connected .= $url.'|';
        }

        // remove the last separator
        $textures_fbx_string_connected = trim($textures_fbx_string_connected, "|");

        $fbxpost = get_post($assetpostMeta['vrodos_asset3d_fbx'][0]);

        if ($fbxpost) {
            $fbx_file_name = basename($fbxpost->guid);
            $path_url = pathinfo($fbxpost->guid)['dirname'];
        }
    }



    return array('mtl'=>$mtl_file_name,
        'obj'=>$obj_file_name,
        'pdb'=>$pdb_file_name,
        'glb'=>$glb_file_name,
        'fbx'=>$fbx_file_name,
        'texturesFbx'=>$textures_fbx_string_connected,
        'path'=>$path_url);
}
