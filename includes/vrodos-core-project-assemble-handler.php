<?php

// CREATE PROJECT
function vrodos_create_project_frontend_callback() {

    // Project title
    $project_title =  strip_tags($_POST['project_title']);
    $project_type_slug = $_POST['project_type_slug'];

    $taxonomy = get_term_by('slug', $project_type_slug, 'vrodos_game_type');
    $project_type_id = $taxonomy->term_id;
    $project_taxonomies = array(
        'vrodos_game_type' => array(
            $project_type_id,
        )
    );

    $project_information = array(
        'post_title' => esc_attr($project_title),
        'post_content' => '',
        'post_type' => 'vrodos_game',
        'post_status' => 'publish',
        'tax_input' => $project_taxonomies,
    );

    $project_id = wp_insert_post($project_information);

    $post = get_post($project_id);

    // Link project to game type
    wp_set_object_terms(  $post->ID, $project_type_slug, 'vrodos_game_type' );

    // Create a parent game tax category for the scenes
    wp_insert_term($post->post_title,'vrodos_scene_pgame', array(
            'description'=> '-',
            'slug' => $post->post_name,
        )
    );

    // Create a parent game tax category for the assets
    wp_insert_term($post->post_title,'vrodos_asset3d_pgame',array(
            'description'=> '-',
            'slug' => $post->post_name,
        )
    );

    vrodos_create_default_scenes_for_game($post->post_name, $project_type_id);

    echo $project_id;
    wp_die();
}




// Fetch list of project through ajax
function vrodos_fetch_list_projects_callback() {

    $f = fopen("output_ajax_delay.txt", "w");

    $user_id = $_POST['current_user_id'];
    $parameter_Scenepass = $_POST['parameter_Scenepass'];

    // Define custom query parameters
    $custom_query_args = array(
        'post_type' => 'vrodos_game',
        'posts_per_page' => -1,
    );

//    if (current_user_can('administrator')){
//
//    } elseif (current_user_can('adv_project_master')) {
//        //$custom_query_args['author'] = $user_id;
//
//    }elseif (current_user_can('game_master')) {
//        //$custom_query_args['author'] = $user_id;
//    }


    // Get current page and append to custom query parameters array
    //$custom_query_args['paged'] = get_query_var( 'paged' ) ? get_query_var( 'paged' ) : 1;

    // Instantiate custom query
    $custom_query = new WP_Query($custom_query_args);

    //$fp = fopen("output_ccq.txt","w");

    // Pagination fix
    //$temp_query = $wp_query;
    //$wp_query = NULL;
    //$wp_query = $custom_query;

    // Output custom query loop
    if ($custom_query->have_posts()){

        $mt3 = explode(' ', microtime());
        $t3 = ((int)$mt3[1]) * 1000 + ((int)round($mt3[0] * 1000));

        fwrite($f, "Step 3:".$t3.chr(13));

        echo '<ul class="mdc-list mdc-list--two-line mdc-list--avatar-list" style="max-height: 460px; overflow-y: auto">';
        while ($custom_query->have_posts()) :

            $mt4 = explode(' ', microtime());
            $t4 = ((int)$mt4[1]) * 1000 + ((int)round($mt4[0] * 1000));

            fwrite($f, "Step 4:".$t4.chr(13));

            $custom_query->the_post();

            if (current_user_can('administrator')){
                // ToDo: replace current_user_can with smth like current_user_is

            } elseif (current_user_can('project_master')) {

                $collaborators = get_post_meta(get_the_ID(),'vrodos_project_collaborators_ids')[0];

//               fwrite($fp, 'Author:' . print_r(get_the_author_meta('ID'), true));
//               fwrite($fp, 'UserId:' . print_r($user_id, true));
//               fclose($fp);

                if ( get_the_author_meta('ID') != $user_id ) {                    // Not the author of the game
                    if (strpos($collaborators, $user_id) === false) {  // and not the collaborator then skip

                        continue;
                    }
                }
            }


//           elseif (current_user_can('game_master')) {
//                //$custom_query_args['author'] = $user_id;
//            }



            $game_id = get_the_ID();
            $game_title = get_the_title();
            $game_date = get_the_date();
            //$game_link = get_permalink();


            // Do not show Joker projects
            if (str_contains($game_title, ' Joker'))
                continue;

            $game_type_obj = vrodos_return_project_type($game_id);

            $all_game_category = get_the_terms( $game_id, 'vrodos_game_type' );
            $game_category     = $all_game_category[0]->slug;
            $scene_data = vrodos_getFirstSceneID_byProjectID($game_id,$game_category);//first 3D scene id

            $editscenePage = vrodos_getEditpage('scene');

            $edit_scene_page_id = $editscenePage[0]->ID;

            $loadMainSceneLink = esc_url( (get_permalink($edit_scene_page_id) . $parameter_Scenepass . $scene_data['id'] . '&vrodos_game=' . $game_id . '&scene_type=' . $scene_data['type']));


            $assets_list_page =  vrodos_getEditpage('assetslist');
            $assets_list_page_id = $assets_list_page[0]->ID;
            $loadProjectAssets = esc_url( get_permalink($assets_list_page_id) . '?vrodos_project_id=' . $game_id );


            echo '<li class="mdc-list-item" style="" id="'. $game_id.'">';

            // Href when press on title
            echo '<span class="mdc-list-item" style="float:left" data-mdc-auto-init="MDCRipple" title="Open '.$game_title.'">';
            echo '<i class="material-icons mdc-list-item__start-detail" aria-hidden="true" title="'.$game_type_obj->string.'">'.$game_type_obj->icon.'</i>';
            echo '<span id="'.$game_id.'-title" class="mdc-list-item__text">'.$game_title.'<span id="'.$game_id.'-date" class="mdc-list-item__text__secondary">'.$game_date.'</span>'.
                '</span>';
            echo '</span>';



            // VR button: Go to 3D Editor

            echo '<div style="margin-left:auto; margin-right:0">';

            // ----- Assets button ------------------
            echo '<a href="'.$loadProjectAssets.'" class="" style="" data-mdc-auto-init="MDCRipple" '.
                'title="Manage assets of '.$game_title.'">';
            echo '<span id="'.$game_id.'-assets-button" class="mdc-button" >Assets</span>';
            echo '</a>';

            // ------- Collaborators -----------

            // Collaborators button
            echo '<a href="javascript:void(0)" class="mdc-button mdc-list-item__end-detail" '.
                'data-mdc-auto-init="MDCRipple" title="Add collaborators for '.
                $game_title . '" onclick="collaborateProject(' . $game_id . ')">';

            $collaborators = get_post_meta($game_id, 'vrodos_project_collaborators_ids');

            // Find number of current collaborators
            if ( count($collaborators)>0) {

                $collabs_ids_raw = get_post_meta($game_id, 'vrodos_project_collaborators_ids')[0];
                $collabs_ids = array_values(array_filter(explode(";", $collabs_ids_raw)));
            } else {
                $collabs_ids = [];
            }

            echo '<i class="material-icons" aria-hidden="true" ' . ' title="Add collaborators">group</i>' .
                '<sup>' . count($collabs_ids) . '</sup>';

            //echo get_user_by('id', $collabs_ids[0])->display_name;
            echo '</a>';


            // --------- 3D editor button -----------
            echo '<a id="3d-editor-bt-'.$game_id.'" href="'.$loadMainSceneLink.'" class="" style="" data-mdc-auto-init="MDCRipple" '.
                'title="Open 3D Editor for '.$game_title.'">';
            echo '<span id="'.$game_id.'-vr-button" class="mdc-button" >3D_Editor</span>';
            echo '</a>';

            // -------- Delete button ----------------
            echo '<a href="javascript:void(0)" class="" style="" aria-label="Delete game" title="Delete project" '.
                'onclick="deleteProject('.$game_id.')">';
            echo '<i class="material-icons mdc-button mdc-list-item__end-detail" style="color: crimson" '
                .'aria-hidden="true" title="Delete project">delete</i>';
            echo '</a>';

            echo '<div>';
            echo '</li>';
        endwhile;

        echo '</ul>';



        wp_reset_postdata();
        //$wp_query = NULL;
        //$wp_query = $temp_query;


    } else {

        echo '<hr class="WhiteSpaceSeparator">';
        echo '<div class="CenterContents">' .
            '<i class="material-icons mdc-theme--text-icon-on-light" style="font-size: 96px;" aria-hidden="true"' .
            ' title="No projects available">' .
            'games' .
            '</i>'.
            '<h3 class="mdc-typography--headline"> projects available</h3>' .
            '<hr class="WhiteSpaceSeparator">'.
            '<h4 class="mdc-typography--title mdc-theme--text-secondary-on-light">'.
            'You can try creating a new one</h4>';
        echo '</div>';
    }

    wp_die();
}


//UPDATE LIST OF COLLABORATORS ON PROJECT
function vrodos_collaborate_project_frontend_callback()
{
    $project_id = $_POST['project_id'];
    $collabs_emails = $_POST['collabs_emails'];
    $collabs_emails = explode(';', $collabs_emails);

    // From email get id
    $collabs_ids = '';
    foreach ($collabs_emails as $collab_email) {
        $collab_id_data = get_user_by('email', $collab_email)->data;
        if (!$collab_id_data)
            echo "ERROR 190520: an email was invalid";
        else
            $collabs_ids .= ';'.$collab_id_data->ID;
    }

    update_post_meta($project_id, 'vrodos_project_collaborators_ids', $collabs_ids);
    wp_die();
}



function vrodos_fetch_collaborators_frontend_callback()
{
    $project_id = $_POST['project_id'];
    $collabs_ids = get_post_meta($project_id, 'vrodos_project_collaborators_ids', true);

    $collabs_ids = explode(';',$collabs_ids);

    $collabs_emails = '';
    foreach ($collabs_ids as $collab_id) {
        $collabs_emails =  $collabs_emails . ';' . get_user_by('id', $collab_id)->user_email;
    }

    $collabs_emails = ltrim($collabs_emails, ";");
    $collabs_emails = rtrim($collabs_emails, ";");

    echo $collabs_emails;
    wp_die();
}



//DELETE GAME PROJECT
function vrodos_delete_gameproject_frontend_callback(){

    $game_id = $_POST['game_id'];

    $game_post = get_post($game_id);
    $gameSlug = $game_post->post_name;
    $gameTitle = get_the_title( $game_id );

    //1.Delete Assets
    $assetPGame = get_term_by('slug', $gameSlug, 'vrodos_asset3d_pgame');
    $assetPGameID = $assetPGame->term_id;

    $custom_query_args1 = array(
        'post_type' => 'vrodos_asset3d',
        'posts_per_page' => -1,
        'tax_query' => array(
            array(
                'taxonomy' => 'vrodos_asset3d_pgame',
                'field'    => 'term_id',
                'terms'    => $assetPGameID,
            ),
        ),
    );
    // Instantiate custom query
    $custom_query = new WP_Query( $custom_query_args1 );
    // Output custom query loop
    if ( $custom_query->have_posts() ) :
        while ( $custom_query->have_posts() ) :
            $custom_query->the_post();
            $asset_id = get_the_ID();
            vrodos_delete_asset3d_noscenes_frontend($asset_id);
        endwhile;
    endif;

    wp_reset_postdata();

    //2.Delete Scenes
    $scenePGame = get_term_by('slug', $gameSlug, 'vrodos_scene_pgame');
    $scenePGameID = $scenePGame->term_id;

    $custom_query_args2 = array(
        'post_type' => 'vrodos_scene',
        'posts_per_page' => -1,
        'tax_query' => array(
            array(
                'taxonomy' => 'vrodos_scene_pgame',
                'field'    => 'term_id',
                'terms'    => $scenePGameID,
            ),
        ),
    );
    // Instantiate custom query
    $custom_query2 = new WP_Query( $custom_query_args2 );
    // Output custom query loop
    if ( $custom_query2->have_posts() ) :
        while ( $custom_query2->have_posts() ) :
            $custom_query2->the_post();
            $scene_id = get_the_ID();

            // Delete scene
            wp_delete_post( $scene_id, true );

        endwhile;
    endif;

    wp_reset_postdata();

    //3. Delete taxonomies from Assets & Scenes
    wp_delete_term( $assetPGameID, 'vrodos_asset3d_pgame' );
    wp_delete_term( $scenePGameID, 'vrodos_scene_pgame' );

    //5. Delete Game CUSTOM POST
    wp_delete_post( $game_id, false );

    echo $gameTitle;

    wp_die();
}

//DELETE spesific SCENE
function vrodos_delete_scene_frontend_callback(){

    $scene_id = $_POST['scene_id'];
    $postTitle = get_the_title($scene_id);

    //1. Delete screenshot of scene
    $postmeta = get_post_meta($scene_id);

    $thumb_id = $postmeta['_thumbnail_id'][0];

    $attached_file = get_post_meta($thumb_id, '_wp_attached_file',true);

    if (file_exists($attached_file)) {
        unlink($attached_file);
    }

    //2. Delete meta
    delete_post_meta( $thumb_id, '_wp_attached_file' );
    delete_post_meta( $thumb_id, '_wp_attachment_metadata' );

    //3. Delete Scene CUSTOM POST
    wp_delete_post( $scene_id, true );

    //4. Delete Thumbnail post
    wp_delete_post( $thumb_id, true );

    echo $postTitle;

    wp_die();
}

//DELETE Asset with files
function vrodos_delete_asset3d_frontend_callback(){

    $asset_id = $_POST['asset_id'];
    $gameSlug = $_POST['game_slug'];
    $isCloned = $_POST['isCloned'];

    // If it is not cloned then it is safe to delete the meta files.
    if ($isCloned==='false') {

        $containerFolder = wp_upload_dir()['basedir'].'/models/';

        // ------- MTL --------
        $mtlID = get_post_meta($asset_id, 'vrodos_asset3d_mtl', true); // True : single value

        // Delete the file from the system
        wp_delete_file($containerFolder.basename(get_attached_file($mtlID)));

        // Delete attachment
        wp_delete_attachment($mtlID, true); // True : Not go to trash

        // ------- FBX --------

        // Get texture attachments of post
        $args = array(
            'posts_per_page' => 100,
            'order'          => 'DESC',
            'post_parent'    => $asset_id
        );

        $attachments_array =  get_children( $args,OBJECT );  //returns Array ( [$image_ID].

        // Add texture urls to a string separated by |

        foreach ($attachments_array as $k){
            $child_post_id = $k->ID;

            //$fbxID = get_post_meta($asset_id, 'vrodos_asset3d_fbx', true); // True : single value

            // Delete the file from the system
            wp_delete_file($containerFolder.basename(get_attached_file($child_post_id)));

            // Delete attachment
            wp_delete_attachment($child_post_id, true); // True : Not go to trash
        }


        // ---------- OBJ -------
        $objID = get_post_meta($asset_id, 'vrodos_asset3d_obj', true);

        // Delete the file from the system
        wp_delete_file($containerFolder.basename(get_attached_file($objID)));

        // Delete attachment
        wp_delete_attachment($objID, true);

        // ---------- Diffusion image ----------
        $difID = get_post_meta($asset_id, 'vrodos_asset3d_diffimage', true);

        // Delete the file from the system
        wp_delete_file($containerFolder.basename(get_attached_file($difID)));

        // Delete attachment
        wp_delete_attachment($difID, true);

        // ---------- Screenshot ---------------
        $screenID = get_post_meta($asset_id, 'vrodos_asset3d_screenimage', true);

        // Delete the file from the system
        wp_delete_file($containerFolder.basename(get_attached_file($screenID)));

        // Delete attachment
        wp_delete_attachment($screenID, true);
    }

    // Delete all uses of Asset from Scenes (json)
    vrodos_delete_asset3d_from_games_and_scenes($asset_id, $gameSlug);

    // Delete Asset post from SQL database
    wp_delete_post( $asset_id, true );

    echo $asset_id;

    wp_die();
}

//Fetch FBX Asset with files
function vrodos_fetch_fbx_asset3d_frontend_callback(){

    $asset_id = $_POST['asset_id'];

    $fbxID = get_post_meta($asset_id, 'vrodos_asset3d_fbx');
    $fbxURL= get_the_guid($fbxID[0]);

    $audioID = get_post_meta($asset_id, 'vrodos_asset3d_audio');
    $audioURL= get_the_guid($audioID[0]);

    $texturesIDs = get_post_meta($asset_id, 'vrodos_asset3d_diffimage');
    $texturesURLs = [];

    foreach ($texturesIDs as $textureID){
        $texturesURLs[]= get_the_guid($textureID);
    }

    $output = new StdClass();
    $output->texturesIDs = $texturesIDs;
    $output->fbxIDs = $fbxID;
    $output->fbxURL = $fbxURL;
    $output->texturesURLs = $texturesURLs;
    $output->audioID = $audioID;
    $output->audioURL = $audioURL;

    print_r(json_encode($output, JSON_UNESCAPED_SLASHES));
    wp_die();
}


//Fetch GLB Asset
function vrodos_fetch_glb_asset3d_frontend_callback(){

    $asset_id = $_POST['asset_id'];

    $glbID = get_post_meta($asset_id, 'vrodos_asset3d_glb', true);
    $glbURL= wp_get_attachment_url( $glbID );

    $audioID = get_post_meta($asset_id, 'vrodos_asset3d_audio');
    $audioURL= get_the_guid($audioID[0]);

    $output = new StdClass();
    $output->texturesIDs = [];
    $output->glbIDs = $glbID;
    $output->glbURL = $glbURL;
    $output->texturesURLs = [];
    $output->audioID = $audioID;
    $output->audioURL = $audioURL;

    print_r(json_encode($output, JSON_UNESCAPED_SLASHES));
    wp_die();
}


//Fetch Asset with files
function vrodos_fetch_asset3d_meta_backend_callback(){

    $asset_id = $_POST['asset_id'];

    $output = new StdClass();
    $output -> assettrs_saved = get_post_meta($asset_id,'vrodos_asset3d_assettrs', true);

    print_r(json_encode($output, JSON_UNESCAPED_SLASHES));
    wp_die();
}



function vrodos_delete_asset3d_noscenes_frontend($asset_id){
    // No need to delete assets from scenes, cause scene will be deleted at the same event

    //1. Delete all Attachments (mtl/obj/jpg ...)
    $mtlID = get_post_meta($asset_id,'vrodos_asset3d_mtl', true);
    wp_delete_attachment( $mtlID,true );
    $objID = get_post_meta($asset_id,'vrodos_asset3d_obj', true);
    wp_delete_attachment( $objID,true );
    $difID = get_post_meta($asset_id,'vrodos_asset3d_diffimage', true);
    wp_delete_attachment( $difID,true );
    $screenID = get_post_meta($asset_id,'vrodos_asset3d_screenimage', true);
    wp_delete_attachment( $screenID,true );

    //2. Delete Asset3D CUSTOM POST
    wp_delete_post( $asset_id, true );

}

// Delete asset from json
function vrodos_delete_asset3d_from_games_and_scenes($asset_id, $gameSlug){

    $scenePGame = get_term_by('slug', $gameSlug, 'vrodos_scene_pgame');

    if (!$scenePGame) {
        wp_reset_postdata();
        return;
    }

    $scenePGameID = $scenePGame->term_id;

    $custom_query_args2 = array(
        'post_type' => 'vrodos_scene',
        'posts_per_page' => -1,
        'tax_query' => array(
            array(
                'taxonomy' => 'vrodos_scene_pgame',
                'field'    => 'term_id',
                'terms'    => $scenePGameID,
            ),
        ),
    );

    // Instantiate custom query
    $custom_query2 = new WP_Query( $custom_query_args2 );

    // Output custom query loop
    if ( $custom_query2->have_posts() ) :
        while ( $custom_query2->have_posts() ) :
            $custom_query2->the_post();
            $scene_id = get_the_ID();
            $scene_json = get_post($scene_id)->post_content;

            $jsonScene = htmlspecialchars_decode ( $scene_json );
            $sceneJsonARR = json_decode($jsonScene, TRUE);

            $tempScenearr = $sceneJsonARR;
            foreach ($tempScenearr['objects'] as $key => $value ) {
                if ($key != 'avatarCamera') {
                    if($value['assetid'] == $asset_id) {
                        unset($tempScenearr['objects'][$key]);
                        $tempScenearr['metadata']['objects'] --;
                    }
                }
            }

            $tempScenearr = json_encode($tempScenearr, JSON_PRETTY_PRINT);

            wp_update_post(array('ID' => $scene_id, 'post_content' => $tempScenearr));

        endwhile;
    endif;

    wp_reset_postdata();
}

