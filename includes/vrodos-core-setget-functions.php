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

////Get Settings Values
function vrodos_getUnity_local_or_remote(){
	$generaloptions = get_option( 'vrodos_general_settings' );

//	if(!is_null($generaloptions["vrodos_unity_local_or_remote"])) {
//		return $generaloptions["vrodos_unity_local_or_remote"];
//	}else{
//		return 'local';
//	}
	
	return $generaloptions["vrodos_unity_local_or_remote"] ?? 'local';
}

function vrodos_getUnity_exe_folder(){
	$generaloptions = get_option( 'vrodos_general_settings' );
	if($generaloptions["vrodos_unity_exe_folder"]) {
		return $generaloptions["vrodos_unity_exe_folder"];
	}else{
		return 'C:\Program Files\Unity';
	}
}

function vrodos_getRemote_api_folder(){
	$generaloptions = get_option( 'vrodos_general_settings' );
	if($generaloptions["vrodos_remote_api_folder"]) {
		return $generaloptions["vrodos_remote_api_folder"];
	}else{
		return 'http://myurl/';
	}
}

function vrodos_getRemote_server_path(){
	$generaloptions = get_option( 'vrodos_general_settings' );
	if($generaloptions["vrodos_server_path"]) {
		return $generaloptions["vrodos_server_path"];
	}else{
		return 'C:/xampp/htdocs/COMPILE_UNITY3D_GAMES/';
	}
}

function vrodos_get_ftpCredentials(){
	$generaloptions = get_option( 'vrodos_general_settings' );

	$ftp_credentials = array('address'  => $generaloptions["vrodos_ftp_address"],
                             'username' => $generaloptions["vrodos_ftp_username"],
                             'password' => $generaloptions["vrodos_ftp_pass"]);

	return $ftp_credentials;

}

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
            
            // ALL DATA WE NEED
            $objID = get_post_meta($asset_id, 'vrodos_asset3d_obj', true); // OBJ ID
            $objPath = $objID ? wp_get_attachment_url( $objID ) : '';                   // OBJ PATH

            $mtlID = get_post_meta($asset_id, 'vrodos_asset3d_mtl', true); // MTL ID
            $mtlPath = $mtlID ? wp_get_attachment_url( $mtlID ) : '';                   // MTL PATH

            $difImageIDs = get_post_meta($asset_id, 'vrodos_asset3d_diffimage', false);  // Diffusion Image ID

            $difImagePaths = [];

            foreach ($difImageIDs as $diffid)
                $difImagePaths[] = wp_get_attachment_url( $diffid );                // Diffusion Image PATH

            $screenImageID = get_post_meta($asset_id, 'vrodos_asset3d_screenimage', true); // Screenshot Image ID
            $screenImagePath = $screenImageID ? wp_get_attachment_url( $screenImageID ) : '';           // Screenshot Image PATH

            $image1id = get_post_meta($asset_id, 'vrodos_asset3d_image1', true);

            $categoryAsset = wp_get_post_terms($asset_id, 'vrodos_asset3d_cat');

            $categIcon = $categoryAsset ? get_term_meta($categoryAsset[0]->term_id, 'vrodos_assetcat_icon') : 'delete';

            $isCloned = get_post_meta($asset_id, 'vrodos_asset3d_isCloned', true);
            $isJoker = get_post_meta($asset_id, 'vrodos_asset3d_isJoker', true);
            
            $author_id = get_post_field ('post_author', $asset_id);
            $author_displayname = get_the_author_meta( 'display_name' , $author_id );
            $author_username = get_the_author_meta( 'nickname' , $author_id );
    
            $assettrs = get_post_meta($asset_id,'vrodos_asset3d_assettrs', true);
    
            $allAssets[] = [
                'assetName'=>$asset_name,
                'assetSlug'=>get_post()->post_name,
                'assetid'=>$asset_id,
                'categoryName'=> $categoryAsset ? $categoryAsset[0]->name : 'undefined',
                'categoryDescription'=>$categoryAsset ? $categoryAsset[0]->description : 'undefined',
                'categoryIcon'=>$categIcon,
                'categoryID'=>$categoryAsset ? $categoryAsset[0]->term_id: 'undefined',
                'objID'=>$objID,
                'objPath'=>$objPath,
                'mtlID'=>$mtlID,
                'diffImageIDs'=>$difImageIDs,
                'diffImages'=>$difImagePaths,
                'screenImageID'=>$screenImageID,
                'screenImagePath'=>$screenImagePath,
                'mtlPath'=>$mtlPath,
                'image1id'=>$image1id,
                'doorName_source'=>'', //$doorName_source,   the asset does not save door but the json
                'doorName_target'=>'', //$doorName_target,
                'sceneName_target'=>'', //$sceneName_target
                'sceneID_target'=>'', //$sceneName_target
                'archaeology_penalty'=>'0',
                'hv_penalty'=>'0',
                'natural_penalty'=>'0',
                'isreward'=> '0',
				'follow_camera'=> '0',
				'image_link'=>'',
				'video_link'=>'',
				'follow_camera_x'=> '0',
				'follow_camera_y'=> '0',
				'follow_camera_z'=> '0',
                'isJokerAsset'=> $isJoker,
                'isCloned'=> $isCloned,
                'isJoker'=> $isJoker,
                'assetParentGame'=>$asset_pgame[0]->name,
                'assetParentGameSlug'=>$asset_pgame[0]->slug,
                'author_id'=> $author_id,
                'author_displayname'=> $author_displayname,
                'author_username'=> $author_username,
                'assettrs' => $assettrs
            ];
        
        endwhile;
    endif;
    
    // Reset postdata
    wp_reset_postdata();
    
    return $allAssets;
}



//==========================================================================================================================================

//TODO check them

function vrodos_fetch_game_assets_action_callback(){

	//$ff = fopen("output_assets_call.txt", "w");
	
	
	
	// Output the directory listing as JSON
	header('Content-type: application/json');

	$response = vrodos_getAllassets_byGameProject($_POST['gameProjectSlug'], $_POST['gameProjectID']);
	
//	fwrite($ff, print_r($response, true));

	
	for ($i=0; $i<count($response); $i++){
		$response[$i]['name'] = $response[$i]['assetName'];
		$response[$i]['type'] = 'file';
		
		if ($response[$i]['objPath']!='')
			$response[$i]['path'] = $response[$i]['objPath'];
		else if ($response[$i]['fbxPath']!='')
			$response[$i]['path'] = $response[$i]['fbxPath'];
        else if ($response[$i]['glbPath']!='')
            $response[$i]['path'] = $response[$i]['glbPath'];

//		// Find kb size: Too expensive
//		$ch = curl_init($response[$i]['objPath']);
//		curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
//		curl_setopt($ch, CURLOPT_HEADER, TRUE);
//		curl_setopt($ch, CURLOPT_NOBODY, TRUE);
//		$dataCurl = curl_exec($ch);
//		$size = curl_getinfo($ch, CURLINFO_CONTENT_LENGTH_DOWNLOAD);
//		curl_close($ch);
		$response[$i]['size'] = '';//$size;
	}

	$jsonResp =  json_encode(
		array(
			"items" => $response
		)
	);
	
	
	
//	fwrite($ff, print_r($jsonResp,true));
//	fclose($ff);
	
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
function vrodos_getAllassets_byGameProject($gameProjectSlug, $gameProjectID){

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
			$asset_name = get_the_title();
			//$asset_pgame = wp_get_post_terms($asset_id, 'vrodos_asset3d_pgame');

			$isJoker = get_post_meta($asset_id, 'vrodos_asset3d_isJoker', true);    //strpos($asset_pgame[0]->slug, 'joker') !== false;

			// ALL DATA WE NEED
			$objID = get_post_meta($asset_id, 'vrodos_asset3d_obj', true); // OBJ ID
			$objPath = $objID ? wp_get_attachment_url( $objID ) : '';                   // OBJ PATH
			
			$fbxID = get_post_meta($asset_id, 'vrodos_asset3d_fbx', true); // FBX ID
			$fbxPath = $fbxID ? wp_get_attachment_url( $fbxID ) : '';                   // FBX PATH
            
            $glbID = get_post_meta($asset_id, 'vrodos_asset3d_glb', true); // GLB ID
            $glbPath = $glbID ? wp_get_attachment_url( $glbID ) : '';                   // GLB PATH
			
			$audioID = get_post_meta($asset_id, 'vrodos_asset3d_audio', true); // audio ID
			$audioPath = $audioID ? wp_get_attachment_url( $audioID ) : '';      // audio PATH

			$mtlID = get_post_meta($asset_id, 'vrodos_asset3d_mtl', true); // MTL ID
			$mtlPath = $mtlID ? wp_get_attachment_url( $mtlID ) : '';                   // MTL PATH

			$difImageIDs = get_post_meta($asset_id, 'vrodos_asset3d_diffimage', false);  // Diffusion Image ID

			$difImagePaths = [];

			foreach ($difImageIDs as $diffid)
				$difImagePaths[] = wp_get_attachment_url( $diffid );                // Diffusion Image PATH

			$screenImageID = get_post_meta($asset_id, 'vrodos_asset3d_screenimage', true); // Screenshot Image ID
			$screenImagePath = $screenImageID ? wp_get_attachment_url( $screenImageID ) : '';           // Screenshot Image PATH

			$image1id = get_post_meta($asset_id, 'vrodos_asset3d_image1', true);

			$categoryAsset = wp_get_post_terms($asset_id, 'vrodos_asset3d_cat');
            
            $categIcon = get_term_meta($categoryAsset[0]->term_id, 'vrodos_assetcat_icon');
			
			$isCloned = get_post_meta($asset_id, 'vrodos_asset3d_isCloned', true);
			$isJoker = get_post_meta($asset_id, 'vrodos_asset3d_isJoker', true);

			$allAssets[] = [
				'assetName'=>$asset_name,
				'assetSlug'=>get_post()->post_name,
				'assetid'=>$asset_id,
				'categoryName'=>$categoryAsset[0]->name,
                'categoryDescription'=>$categoryAsset[0]->description,
                'categoryIcon'=>$categIcon,
				'categoryID'=>$categoryAsset[0]->term_id,
				'objID'=>$objID,
				'objPath'=>$objPath,
				'fbxID'=>$fbxID,
				'fbxPath'=>$fbxPath,
                'glbID'=>$glbID,
                'glbPath'=>$glbPath,
				'audioID'=>$audioID,
				'audioPath'=>$audioPath,
				'mtlID'=>$mtlID,
				'diffImageIDs'=>$difImageIDs,
				'diffImages'=>$difImagePaths,
				'screenImageID'=>$screenImageID,
				'screenImagePath'=>$screenImagePath,
				'mtlPath'=>$mtlPath,
				'image1id'=>$image1id,
				'doorName_source'=>'', //$doorName_source,   the asset does not save door but the json
				'doorName_target'=>'', //$doorName_target,
				'sceneName_target'=>'', //$sceneName_target
				'sceneID_target'=>'', //$sceneName_target
				'archaeology_penalty'=>'0',
				'hv_penalty'=>'0',
				'natural_penalty'=>'0',
				'isreward'=> '0',
				'follow_camera'=> '0',
				'isJokerAsset'=> $isJoker,
				'isCloned'=> $isCloned,
				'isJoker'=> $isJoker
			];

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



// jimver : check this
function vrodos_getAllscenes_unityfiles_byGame($gameID){

	$allUnityScenes = [];

	$originalGame = get_post($gameID);
	$gameSlug = $originalGame->post_name;
	//Get 'Asset's Parent Scene' taxonomy with the same slug
	$gameTaxonomy = get_term_by('slug', $gameSlug, 'vrodos_scene_pgame');
	$gameTaxonomyID = $gameTaxonomy->term_id;

	$queryargs = array(
		'post_type' => 'vrodos_scene',
		'posts_per_page' => -1,
		'orderby'   => 'ID',
		'order' => 'ASC',
		'tax_query' => array(
			array(
				'taxonomy' => 'vrodos_scene_pgame',
				'field' => 'id',
				'terms' => $gameTaxonomyID
			)
		)
	);

	$custom_query = new WP_Query( $queryargs );

	if ( $custom_query->have_posts() ) :
		while ( $custom_query->have_posts() ) :
			$custom_query->the_post();
			$scene_id = get_the_ID();
			$sceneSlug = get_post_field( 'post_name', $scene_id );
			$allUnityScenes[] = ['sceneUnityPath'=>"Assets/".$sceneSlug."/".$sceneSlug.".unity"];
		endwhile;
	endif;

	// Reset postdata
	wp_reset_postdata();

	return $allUnityScenes;

}

//  Get all Exams

function vrodos_getAllexams_byGame($project_id, $addMenu){

	$allExamScenes = [];

	$project_slug = get_post_field( 'post_name', $project_id );
	if($addMenu){$sceneTypes = array('exam2d-chem-yaml','exam3d-chem-yaml','mainmenu-chem-yaml');}
	else{$sceneTypes = array('exam2d-chem-yaml','exam3d-chem-yaml');}

	$queryargs = array(
		'post_type' => 'vrodos_scene',
		'posts_per_page' => -1,
		'orderby'   => 'ID',
		'order' => 'DESC',
		'tax_query' => array(
			'relation' => 'AND',
			array(
				'taxonomy' => 'vrodos_scene_pgame',
				'field' => 'slug',
				'terms' => $project_slug
			),
			array(
				'taxonomy' => 'vrodos_scene_yaml',
				'field' => 'slug',
				'terms' => $sceneTypes,
			)
		)
	);

	$custom_query = new WP_Query( $queryargs );

	if ( $custom_query->have_posts() ) :
		while ( $custom_query->have_posts() ) :
			$custom_query->the_post();
			$examID = get_the_ID();
			$examName = get_the_title($examID);

			$allExamScenes[] = [
				'examID' => $examID,
				'examName' => $examName,
			];

		endwhile;
	endif;

	// Reset postdata
	wp_reset_postdata();

	return $allExamScenes;
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
	} else if (array_key_exists('vrodos_asset3d_glb', $assetpostMeta)){
		$glb_file_name = get_post($assetpostMeta['vrodos_asset3d_glb'][0])->guid;
		
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
