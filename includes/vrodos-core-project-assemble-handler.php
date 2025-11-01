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


//Fetch GLB Asset
function vrodos_fetch_glb_asset3d_frontend_callback(){
    wp_reset_postdata();

    $asset_id = $_POST['asset_id'];

    $glbID = get_post_meta($asset_id, 'vrodos_asset3d_glb', true);
    $glbURL= wp_get_attachment_url( $glbID );

    $output = new StdClass();
    $output->glbIDs = $glbID;
    $output->glbURL = $glbURL;

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
