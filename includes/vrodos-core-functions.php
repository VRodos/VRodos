<?php

// Remove margin-top from page
function vrodos_remove_admin_login_header() {
    remove_action('wp_head', '_admin_bar_bump_cb');
}


function vrodos_getVideoAttachmentsFromMediaLibrary(){

    $query_images_args = array(
        'post_type'      => 'attachment',
        'post_mime_type' => 'video',
        'post_status'    => 'inherit',
        'posts_per_page' => - 1,
    );

    $query_images = new WP_Query( $query_images_args );
	
	$videos = array();
    foreach ( $query_images->posts as $image ) {
        $videos[] = wp_get_attachment_url( $image->ID );
    }
    
    return $videos;
}



function vrodos_getFirstSceneID_byProjectID($project_id,$project_type){
	$gamePost = get_post($project_id);
	$gameSlug = $gamePost->post_name;

	$scene_type_slug = 'wonderaround-yaml';

	$custom_query_args = array(
		'post_type' => 'vrodos_scene',
		'posts_per_page' => -1,
		'tax_query' => array(
			'relation' => 'AND',
			array(
				'taxonomy' => 'vrodos_scene_pgame',
				'field'    => 'slug',
				'terms'    => $gameSlug
			),
			array(
				'taxonomy' => 'vrodos_scene_yaml',
				'field'    => 'slug',
				'terms'    => $scene_type_slug,
			),
		),
		'orderby' => 'ID',
		'order' => 'DESC',
	);
	$scene_data = array();
	$custom_query = new WP_Query( $custom_query_args );

	if ( $custom_query->have_posts() ) {
		while ($custom_query->have_posts()) {
			$custom_query->the_post();

			$scene_data['id'] = get_the_ID();
			$scene_data['type'] = get_post_meta( get_the_ID(), 'vrodos_scene_metatype', true );
		}
	}

	return $scene_data;
}





//==========================================================================================================================================
//==========================================================================================================================================

function vrodos_the_slug_exists($post_name) {
	
    global $wpdb;
	if($wpdb->get_row("SELECT post_name FROM wp_posts WHERE post_name = '" . $post_name . "'", 'ARRAY_A')) {
		return true;
	} else {
		return false;
	}
}


function vrodos_create_joker_projects() {
	
    $userID = get_current_user_id();
	//$virtualplace_tax = get_term_by('slug', 'virtual_place', 'vrodos_game_cat');
	//$realplace_tax = get_term_by('slug', 'real_place', 'vrodos_game_cat');
	
	
	if (!vrodos_the_slug_exists('archaeology-joker')) {
		
		$tax_slug = 'archaeology_games';
		$post_title = 'Archaeology Joker';
		$post_name = 'archaeology-joker';
		
		create_post_project_joker($tax_slug, $post_title, $post_name, $userID);
	}

	if (!vrodos_the_slug_exists('vrexpo-joker')) {

        $tax_slug = 'vrexpo_games';
        $post_title = 'VRExpo Joker';
        $post_name = 'vrexpo-joker';

        create_post_project_joker($tax_slug, $post_title, $post_name, $userID);
	}
	
	if (!vrodos_the_slug_exists('virtualproduction-joker')) {
		
		$tax_slug = 'virtualproduction_games';
		$post_title = 'Virtual Production Joker';
		$post_name = 'virtualproduction-joker';
		
		create_post_project_joker($tax_slug, $post_title, $post_name, $userID);
	}
}

function create_post_project_joker($tax_slug, $post_title, $post_name, $userID){
	
	$tax = get_term_by('slug', $tax_slug, 'vrodos_game_type');
	$tax_id = $tax->term_id;
	$project_taxonomies_arch = array(
		'vrodos_game_type' => array(
			$tax_id,
		)
	);
	
	$project_information_arch = array(
		'post_title' => $post_title,
		'post_name' => $post_name,
		'post_content' => '',
		'post_type' => 'vrodos_game',
		'post_status' => 'publish',
		'tax_input' => $project_taxonomies_arch,
		'post_author'   => $userID,
	);
	
	wp_insert_post($project_information_arch);
 
}



function vrodos_getNonRegionalScenes($project_id) {
	$game_post = get_post($project_id);
	$gameSlug = $game_post->post_name;
	$scenePGame = get_term_by('slug', $gameSlug, 'vrodos_scene_pgame');
	$scenePGameID = $scenePGame->term_id;

	$nonRegionalScenes = array();

	// Define custom query parameters
	$custom_query_args = array(
		'post_type' => 'vrodos_scene',
		'posts_per_page' => -1,
		'tax_query' => array(
			array(
				'taxonomy' => 'vrodos_scene_pgame',
				'field'    => 'term_id',
				'terms'    => $scenePGameID,
			)
		),
		'meta_key'   => 'vrodos_isRegional',
		'meta_value' => '0',
		'orderby' => 'ID',
		'order' => 'DESC',
	);

	$custom_query = new WP_Query( $custom_query_args );

	// Output custom query loop
	if ( $custom_query->have_posts() ) {
		while ($custom_query->have_posts()) {
			$custom_query->the_post();
			$scene_id = get_the_ID();
			$scene_slug = get_post_field( 'post_name', $scene_id );

			$nonRegionalScenes[] = ['sceneID'=>$scene_id, 'sceneSlug'=>$scene_slug ];
		}
	}

	wp_reset_postdata();
	$wp_query = NULL;

	return $nonRegionalScenes;
}

//==========================================================================================================================================
//==========================================================================================================================================



function vrodos_remove_admin_bar() {
    if (!current_user_can('administrator') && !is_admin()) {
        show_admin_bar(false);
    }
}

// Redirect to home page after login (not go to profile)
function vrodos_default_page() {
    
    return home_url();
}

add_filter('login_redirect', 'vrodos_default_page');


//GUIDs & FIDs

// 32 chars Hex (identifier for the resource)
function vrodos_create_guids($objTypeSTR, $objID, $extra_id_material=null){

	switch ($objTypeSTR) {
		case 'unity':  $objType = "1"; break;
		case 'folder': $objType = "2"; break;
		case 'obj': $objType = "3"; break;
		case 'mat': $objType = "4".$extra_id_material; break; // an obj can have two or more mat
		case 'jpg': $objType = "5".$extra_id_material; break; // an obj can have multiple textures jpg
		//case 'tile': $objType = "6".$extra_id_material; break; // an obj can have multiple textures jpg
	}

	return str_pad($objType, 4, "0", STR_PAD_LEFT) . str_pad($objID, 28, "0", STR_PAD_LEFT);
}

// 10 chars Decimal (identifier for the GameObject) (e.g. dino1, dino2 have different fid but share the same guid)
function vrodos_create_fids($id){
	return str_pad($id, 10, "0", STR_PAD_LEFT);
}

function vrodos_create_fids_rect($id){
	return '1' . str_pad($id, 9, "0", STR_PAD_LEFT);
}

function vrodos_replace_objmeta($file_content,$objID){
	$unix_time = time();
	$guid_id = vrodos_create_guids('obj',$objID);

	$file_content_return = str_replace("___[obj_guid]___",$guid_id,$file_content);
	$file_content_return = str_replace("___[unx_time_created]___",$unix_time,$file_content_return);

	return $file_content_return;
}

function vrodos_replace_foldermeta($file_content,$folderID){
	$unix_time = time();
	$guid_id = vrodos_create_guids('folder',$folderID);

	$file_content_return = str_replace("___[folder_guid]___",$guid_id,$file_content);
	$file_content_return = str_replace("___[unx_time_created]___",$unix_time,$file_content_return);

	return $file_content_return;
}

function vrodos_replace_jpgmeta($file_content,$objID){
	$unix_time = time();
	$guid_id = vrodos_create_guids('jpg',$objID);

	$file_content_return = str_replace("___[jpg_guid]___",$guid_id,$file_content);
	$file_content_return = str_replace("___[unx_time_created]___",$unix_time,$file_content_return);

	return $file_content_return;
}

//==========================================================================================================================================
//==========================================================================================================================================
//Create sample data when a user is registered (changed it to "when a game is created")

//add_action( 'user_register', 'vrodos_registrationhook_createGame', 10, 1 );

function vrodos_registrationhook_createGame( $user_id ) {

	$user_info = get_userdata($user_id);
	$username = $user_info->user_login;

	$archaeology_tax = get_term_by('slug', 'archaeology_games', 'vrodos_game_type');
	$game_type_chosen_id = $archaeology_tax->term_id;

	$game_taxonomies = array(
		'vrodos_game_type' => array(
			$game_type_chosen_id,
		)
	);

	$game_title = $username . ' Sample Game';

	$game_information = array(
		'post_title' => $game_title,
		'post_content' => '',
		'post_type' => 'vrodos_game',
		'post_status' => 'publish',
		'tax_input' => $game_taxonomies,
		'post_author' => $user_id,
	);

	$game_id = wp_insert_post($game_information);

	vrodos_registrationhook_createAssets($user_id,$username,$game_id);

}

function vrodos_registrationhook_createAssets($user_id,$username,$game_id){
	$game_post = get_post($game_id);
	$game_slug = $game_post->post_name;

	$parentGame_tax = get_term_by('slug', $game_slug, 'vrodos_asset3d_pgame');
	$parentGame_tax_id = $parentGame_tax->term_id;

	$artifact_tax = get_term_by('slug', 'artifact', 'vrodos_asset3d_cat');
	$artifact_tax_id = $artifact_tax->term_id;
    $artifact_text_obj = (object) [
        'assetTitleForm' => $username . ' Sample Artifact',
        'assetDescForm' => 'Artifact item created as sample'
    ];

	$door_tax = get_term_by('slug', 'door', 'vrodos_asset3d_cat');
	$door_tax_id = $door_tax->term_id;
	$doorTitle = $username . ' Sample Door';
	$doorDesc = 'Door item created as sample';

	$poiImage_tax = get_term_by('slug', 'pois_imagetext', 'vrodos_asset3d_cat');
	$poiImage_tax_id = $poiImage_tax->term_id;
	$poiImageTitle = $username . ' Sample POI Image';
	$poiImageDesc = 'POI Image item created as sample';

	$poiVideo_tax = get_term_by('slug', 'pois_video', 'vrodos_asset3d_cat');
	$poiVideo_tax_id = $poiVideo_tax->term_id;
	$poiVideoTitle = $username . ' Sample POI Video';
	$poiVideoDesc = 'POI Video item created as sample';

	$site_tax = get_term_by('slug', 'site', 'vrodos_asset3d_cat');
	$site_tax_id = $site_tax->term_id;
	$siteTitle = $username . ' Sample Site';
	$siteDesc = 'Site item created as sample';

	$newArtifact_ID = vrodos_create_asset_frontend($parentGame_tax_id, $artifact_tax_id, $game_slug, null, $artifact_text_obj, null, null, null );
	$newDoor_ID = vrodos_create_asset_frontend($parentGame_tax_id, $door_tax_id, $game_slug);
	$newPOIimage_ID = vrodos_create_asset_frontend($parentGame_tax_id, $poiImage_tax_id, $game_slug);
	$newPOIvideo_ID = vrodos_create_asset_frontend($parentGame_tax_id, $poiVideo_tax_id, $game_slug);
	$newSite_ID = vrodos_create_asset_frontend($parentGame_tax_id, $site_tax_id, $game_slug);

	vrodos_registrationhook_uploadAssets_noTexture($artifact_text_obj['assetTitleForm'],$newArtifact_ID,$game_slug,'artifact');
	vrodos_registrationhook_uploadAssets_noTexture($doorTitle,$newDoor_ID,$game_slug,'door');
	vrodos_registrationhook_uploadAssets_noTexture($poiImageTitle,$newPOIimage_ID,$game_slug,'poi_image');
	vrodos_registrationhook_uploadAssets_noTexture($poiVideoTitle,$newPOIvideo_ID,$game_slug,'poi_video');
	vrodos_registrationhook_uploadAssets_noTexture($siteTitle,$newSite_ID,$game_slug,'site');
}

function vrodos_registrationhook_uploadAssets_noTexture($assetTitleForm,$asset_newID,$gameSlug,$assetTypeNumber){
 
	$has_image = false; $has_video = false;
	if($assetTypeNumber == 'artifact'){
		$mtl_content = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/files/samples/artifact/star.mtl");
		$obj_content = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/files/samples/artifact/star_yellow.obj");
	}elseif($assetTypeNumber == 'door') {
		$mtl_content = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/files/samples/door/door_green.mtl");
		$obj_content = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/files/samples/door/door_green.obj");
	}elseif($assetTypeNumber == 'poi_image') {
		$mtl_content = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/files/samples/poi_image_text/star.mtl");
		$obj_content = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/files/samples/poi_image_text/star_blue.obj");
		$has_image = true;
		$image_content = WP_PLUGIN_DIR . "/vrodos/includes/files/samples/poi_image_text/image.jpg";
	}elseif($assetTypeNumber == 'poi_video') {
		$mtl_content = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/files/samples/poi_video/star.mtl");
		$obj_content = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/files/samples/poi_video/star_red.obj");
		$has_video = true;
		$video_content = WP_PLUGIN_DIR . "/vrodos/includes/files/samples/poi_video/bunny.mp4";
	}elseif($assetTypeNumber == 'site') {
		$mtl_content = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/files/samples/Site1/site1.mtl");
		$obj_content = file_get_contents(WP_PLUGIN_DIR . "/vrodos/includes/files/samples/Site1/site1.obj");
	}

	$mtlFile_id = vrodos_upload_AssetText($mtl_content, 'material'.$assetTitleForm, $asset_newID, null, null);
	$mtlFile_filename = basename(get_attached_file($mtlFile_id));

	// OBJ
	$mtlFile_filename_notxt = substr( $mtlFile_filename, 0, -4 );
	$mtlFile_filename_withMTLext = $mtlFile_filename_notxt . '.mtl';
	$obj_content = preg_replace("/.*\b" . 'mtllib' . "\b.*\n/ui", "mtllib " . $mtlFile_filename_withMTLext . "\n", $obj_content);
	$objFile_id = vrodos_upload_AssetText($obj_content, 'obj'.$assetTitleForm, $asset_newID, null, null);

	if($has_image){
		$attachment_id = vrodos_upload_img_vid_aud( $image_content, $asset_newID);
		set_post_thumbnail( $asset_newID, $attachment_id );
	}

	if($has_video){
		$attachment_video_id = vrodos_upload_img_vid_aud( $video_content, $asset_newID);
		update_post_meta( $asset_newID, 'vrodos_asset3d_video', $attachment_video_id );
	}

	// Set value of attachment IDs at custom fields
	update_post_meta($asset_newID, 'vrodos_asset3d_mtl', $mtlFile_id);
	update_post_meta($asset_newID, 'vrodos_asset3d_obj', $objFile_id);

}

//function vrodos_registrationhook_uploadAssets_withTexture($assetTitleForm,$asset_newID,$gameSlug,$assetTypeNumber){
//
//	$texture_content = WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/files/samples/Site1/site1.jpg";
//	$mtl_content = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/files/samples/Site1/site1.mtl");
//	$obj_content = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/files/samples/Site1/site1.obj");
//
//	$textureFile_id = vrodos_upload_Assetimg64($texture_content, 'texture_'.$assetTitleForm, $asset_newID, $gameSlug);
//	$textureFile_filename = basename(get_attached_file($textureFile_id));
//
//	$mtl_content = preg_replace("/.*\b" . 'map_Kd' . "\b.*/ui", "map_Kd " . $textureFile_filename, $mtl_content);
//	$mtlFile_id = vrodos_upload_AssetText($mtl_content, 'material'.$assetTitleForm, $asset_newID, $gameSlug);
//	$mtlFile_filename = basename(get_attached_file($mtlFile_id));
//
//	// OBJ
//	$mtlFile_filename_notxt = substr( $mtlFile_filename, 0, -4 );
//	$mtlFile_filename_withMTLext = $mtlFile_filename_notxt . '.mtl';
//	$obj_content = preg_replace("/.*\b" . 'mtllib' . "\b.*\n/ui", "mtllib " . $mtlFile_filename_withMTLext . "\n", $obj_content);
//	$objFile_id = vrodos_upload_AssetText($obj_content, 'obj'.$assetTitleForm, $asset_newID, $gameSlug);
//
//	// Set value of attachment IDs at custom fields
//	update_post_meta($asset_newID, 'vrodos_asset3d_mtl', $mtlFile_id);
//	update_post_meta($asset_newID, 'vrodos_asset3d_obj', $objFile_id);
//	update_post_meta( $asset_newID, 'vrodos_asset3d_diffimage', $textureFile_id );
//}

//==========================================================================================================================================


//Important GET functions



// Get All DOORS of specific game (from all scenes) by given project ID (parent game ID)
function vrodos_get_all_doors_of_project_fastversion($parent_project_id_as_term_id){

	$sceneIds = [];

	// Define custom query parameters
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
	);

	$custom_query = new WP_Query( $custom_query_args );

	$doorInfoGathered = [];

	// Output custom query loop
	if ( $custom_query->have_posts() ) {
		while ($custom_query->have_posts()) {
			$custom_query->the_post();

			$scene_id = get_the_ID();
			$sceneTitle = get_the_title();  // get_post($scene_id)->post_title;
			$sceneSlug = get_post()->post_name;
            
            $scene_json = get_post()->post_content;
            
			//$scene_json = get_post_meta($scene_id, 'vrodos_scene_json_input', true);
			$jsonScene = htmlspecialchars_decode($scene_json);
			$sceneJsonARR = json_decode($jsonScene, TRUE);

			if (trim($jsonScene) === '')
				continue;

			
            if ( $sceneJsonARR['objects'] != NULL)
                if (count($sceneJsonARR['objects']) > 0)
                    foreach ($sceneJsonARR['objects'] as $key => $value) {
                        if ($key !== 'avatarCamera') {
                            if ($value['categoryName'] === 'Door') {
                                $doorInfoGathered[] = ['door' => $value['doorName_source'],
                                                       'scene' => $sceneTitle,
                                                       'sceneSlug'=> $sceneSlug];
                            }
                        }
                    }
		}
	}

	wp_reset_postdata();
	$wp_query = NULL;

	return $doorInfoGathered;
}

function vrodos_get_all_scenesMarker_of_project_fastversion($parent_project_id_as_term_id){

	$sceneIds = [];

	// Define custom query parameters
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
	);

	$custom_query = new WP_Query( $custom_query_args );

	$doorInfoGathered = [];

	// Output custom query loop
	if ( $custom_query->have_posts() ) {
		while ($custom_query->have_posts()) {
			$custom_query->the_post();

			$scene_id = get_the_ID();
			$sceneTitle = get_the_title();  // get_post($scene_id)->post_title;
			$sceneSlug = get_post()->post_name;
            
            $scene_json = get_post()->post_content;
			
			//$scene_json = get_post_meta($scene_id, 'vrodos_scene_json_input', true);
			$jsonScene = htmlspecialchars_decode($scene_json);

			if (trim($jsonScene)==='')
				continue;

			$sceneJsonARR = json_decode($jsonScene, TRUE);
            
            if ( $sceneJsonARR['objects'] != NULL)
                if (count($sceneJsonARR['objects']) > 0)
                    foreach ($sceneJsonARR['objects'] as $key => $value) {
                        if ($key !== 'avatarCamera') {
                            if ($value['categoryName'] === 'Door') {
                                $doorInfoGathered[] = ['door' => $value['doorName_source'],
                                                       'scene' => $sceneTitle,
                                                       'sceneSlug'=> $sceneSlug];
                            }
                        }
                    }
		}
	}

	wp_reset_postdata();
	$wp_query = NULL;

	return $doorInfoGathered;
}


//Get All SCENES (ids) of specific game by given project ID (parent game ID)
function vrodos_get_all_sceneids_of_game($parent_project_id_as_term_id){

	$sceneIds = [];

	// Define custom query parameters
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
	);

	$custom_query = new WP_Query( $custom_query_args );



	// Output custom query loop
	if ( $custom_query->have_posts() )
		while ( $custom_query->have_posts() ) {
			$custom_query->the_post();
			$scene_id = get_the_ID();
			$sceneIds[] = $scene_id;
		}

	return $sceneIds;
}


//=============================== SEMANTICS ON 3D ============================================================

// ---- AJAX SEMANTICS 1: run segmentation ----------
function vrodos_segment_obj_action_callback() {

	$DS = DIRECTORY_SEPARATOR;
	if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {

		$curr_folder = wp_upload_dir()['basedir'].$DS.$_POST['path'];
		$curr_folder = str_replace('/','\\',$curr_folder); // full path

		$batfile = wp_upload_dir()['basedir'].$DS.$_POST['path']."segment.bat";


		$batfile = str_replace('/','\\',$batfile); // full path

		$fnameobj = basename($_POST['obj']);

		$fnameobj = $curr_folder.$fnameobj;

		// 1 : Generate bat
		$myfile = fopen($batfile, "w") or die("Unable to open file!");

		$outputpath = wp_upload_dir()['basedir'].$DS.$_POST['path'];
		$outputpath = str_replace('/','\\',$outputpath); // full path

		$exefile = untrailingslashit(plugin_dir_path(__FILE__)).'\..\semantics\segment3D\pclTesting.exe';
		$exefile = str_replace("/", "\\", $exefile);

		$iter = $_POST['iter'];
		$minDist = $_POST['minDist'];
		$maxDist = $_POST['maxDist'];
		$minPoints = $_POST['minPoints'];
		$maxPoints = $_POST['maxPoints'];
		//$exefile.' '.$fnameobj.' '.$iter.' 0.01 0.2 100 25000 1 '.$outputpath.PHP_EOL.

		$txt = '@echo off'.PHP_EOL.
		       $exefile.' '.$fnameobj.' '.$iter.' '.$minDist.' '.$maxDist.' '.$minPoints.' '.$maxPoints.' 1 '.$outputpath.PHP_EOL.
		       'del "*.pcd"'.PHP_EOL.
		       'del "barycenters.txt"';

		fwrite($myfile, $txt);
		fclose($myfile);

		shell_exec('del "'.$outputpath.'log.txt"');
		shell_exec('del "'.$outputpath.'cloud_cluster*.obj"');
		shell_exec('del "'.$outputpath.'cloud_plane*.obj"');

		// 2: run bat
		$output = shell_exec($batfile);
		echo $output;

	} else { // LINUX SERVER // TODO

//        $game_dirpath = realpath(dirname(__FILE__).'/..').$DS.'test_compiler'.$DS.'game_linux'; //$_GET['game_dirpath'];
//
//        // 1 : Generate sh
//        $myfile = fopen($game_dirpath.$DS."starter_artificial.sh", "w") or print("Unable to open file!");
//        $txt = "#/bin/bash"."\n".
//            "projectPath=`pwd`"."\n".
//            "xvfb-run --auto-servernum --server-args='-screen 0 1024x768x24:32' /opt/Unity/Editor/Unity -batchmode -nographics -logfile stdout.log -force-opengl -quit -projectPath ${projectPath} -buildWindowsPlayer 'builds/myg3.exe'";
//        fwrite($myfile, $txt);
//        fclose($myfile);
//
//        // 2: run sh (nohup     '/dev ...' ensures that it is asynchronous called)
//        $output = shell_exec('nohup sh starter_artificial.sh'.'> /dev/null 2>/dev/null &');
	}

	wp_die();
}

//---- AJAX COMPILE 2: read compile stdout.log file and return content.
function vrodos_monitor_segment_obj_action_callback(){

	echo file_get_contents(pathinfo($_POST['obj'], PATHINFO_DIRNAME ).'/log.txt');

	wp_die();
}

//---- AJAX COMPILE 3: Enlist the split objs -------------
function vrodos_enlist_splitted_objs_action_callback(){

	$DS = DIRECTORY_SEPARATOR;
	$path = wp_upload_dir()['basedir'].$DS.$_POST['path'];

	$files = new RecursiveIteratorIterator(
		new RecursiveDirectoryIterator($path),
		RecursiveIteratorIterator::LEAVES_ONLY
	);

	foreach ($files as $name => $file) {
		// Skip directories (they would be added automatically)
		if (!$file->isDir() and pathinfo($file,PATHINFO_EXTENSION)=='obj')
		{
			echo "<a href='".wp_upload_dir()['baseurl']."/".$_POST['path'].basename($file)."' >".basename($file)."</a><br />";
		}
	}

	wp_die();
}



//======================= CONTENT INTERLINKING =========================================================================

function vrodos_fetch_description_action_callback(){

//	$fff = fopen("output_wiki.txt","w");
//	fwrite($fff, $_POST['externalSource']);


	if ($_POST['externalSource']=='Wikipedia')
		$url = 'https://'.$_POST['lang'].'.wikipedia.org/w/api.php?action=query&format=json&exlimit=3&prop=extracts&'.$_POST['fulltext'].'titles='.$_POST['titles'];
	else
		$url = 'https://www.europeana.eu/api/v2/search.json?wskey=8mfU6ZgfW&query='.$_POST['titles'];//.'&qf=LANGUAGE:'.$_POST['lang'];

	echo  strip_tags(file_get_contents($url));

//	fwrite($fff, $_POST['titles']);
//	fwrite($fff, htmlspecialchars($_POST['titles']));
//	fclose($fff);

	wp_die();
}

function vrodos_fetch_image_action_callback(){

	if ($_POST['externalSource_image']=='Wikipedia')
		$url = 'https://'.$_POST['lang_image'].'.wikipedia.org/w/api.php?action=query&prop=imageinfo&format=json&iiprop=url&generator=images&titles='.$_POST['titles_image'];
	else
		$url = 'https://www.europeana.eu/api/v2/search.json?wskey=8mfU6ZgfW&query='.$_POST['titles_image'];//.'&qf=LANGUAGE:'.$_POST['lang_image'];

	echo file_get_contents($url);

	wp_die();
}

function vrodos_fetch_video_action_callback(){

	if ($_POST['externalSource_video']=='Wikipedia'){
		$url = 'https://'.$_POST['lang_video'].'.wikipedia.org/w/api.php?action=query&format=json&prop=videoinfo&viprop=derivatives&titles=File:'.$_POST['titles_video'].'.ogv';
	} else {
		$url = 'https://www.europeana.eu/api/v2/search.json?wskey=8mfU6ZgfW&query='.$_POST['titles_image'];//.'&qf=LANGUAGE:'.$_POST['lang_image'];
	}

	$content = file_get_contents($url);
	echo $content;

	wp_die();
}


function vrodos_notify_confpeers_callback(){
    
    $ff = fopen("confroom_log.txt","a");
    
    fwrite($ff,chr(10));
    
    date_default_timezone_set("Europe/Sofia");
    
    $strDate = "<tr><td> +1 user</td><td>".$_POST['confroom']."</td><td>".date('d-m-y')."</td><td>".date('h:i:s')."</td></tr>:::".time().":::".$_POST['confroom'];
    fwrite($ff, $strDate);
    fclose($ff);
    
//    if (document.getElementById("ConfRoomReport"))
//        document.getElementById("ConfRoomReport").innerHTML = "1 user in room:".$_POST['confroom'];
    
    echo $strDate;
    
    
    wp_die();
}



// Read log content from conferences
function vrodos_update_expert_log_callback()
{
    // reset
    //unlink("wp-admin/confroom_log.txt");
    if (!file_exists("confroom_log.txt"))
        return;
    
    $file = file("confroom_log.txt");
    
    $file = str_replace("\n", " ", $file);
    $file = array_reverse($file);
    
    $content = '';
    
    $alerting = [];
    $rooming = [];
    
    

//    $ff = fopen("output_rooming.txt","w");
//    fwrite($ff, chr(10));
    
    $index_max_recs=0;
    foreach ($file as $f) {
    
        if ($index_max_recs < 12) {
    
            $f = str_replace("\n", " ", $f);
    
            list($f, $timestamp, $room) = explode(":::", $f);
    
//            fwrite($ff, time() . " " . $timestamp . " " . (time() - $timestamp));
//            fwrite($ff, chr(10));
    
    
            if (time() - $timestamp < 20) {
                $alerting[] = $timestamp;
                $rooming[] = $room;
            }
    
            $content = $content . $f;
    
            $index_max_recs += 1;
        }
    }
//    fclose($ff);
    
    $total_content = json_encode([$content, $alerting, $rooming]);
    
    echo $total_content;
    
    wp_die();
}


//====================== PROJECT ASSEMBLY AND COMPILATION =================================================================

function vrodos_compile_action_callback(){

	//$fa = fopen("output_COMPILE.txt","w");

	$DS = DIRECTORY_SEPARATOR;
	
    //$os = 'win';  // Linux Unity3D is crappy  //strtoupper(substr(PHP_OS, 0, 3)) === 'WIN'? 'win':'lin';

	$outputFormat = $_REQUEST['outputFormat'];

	switch($outputFormat){
		case 'platform-windows':
			$targetPlatform =  'StandaloneWindows'; //' -buildWindowsPlayer "builds'.$DS.'windows'.$DS.'mygame.exe"';
			break;
		case 'platform-mac':
			$targetPlatform = 'StandaloneOSXUniversal'; //' -buildOSXUniversalPlayer "builds'.$DS.'mac'.$DS.'mygame.app"';
			break;
		case 'platform-linux':
			$targetPlatform = 'StandaloneLinux'; // ' -buildOSXUniversalPlayer "builds'.$DS.'linux"';
			break;
		case 'platform-web':
			$targetPlatform =  'WebGL'; //' -executeMethod WebGLBuilder.build';
			break;
		case 'platform-Aframe':
			$targetPlatform = 'Aframe'; //' -executeMethod WebGLBuilder.build';
			break;
		default:
			echo "you must select an output format";
			wp_die();
			break;
	}

	//$projectId = $_REQUEST['vrodos_game'];
	$sceneId = $_REQUEST['vrodos_scene'];
    $projectId = $_REQUEST['projectId'];
	$showPawnPositions = $_REQUEST['showPawnPositions'];
	//$projectSlug = $_REQUEST['projectSlug'];
 

//	$projectType = wp_get_post_terms( $projectId, 'vrodos_game_type' );
//
//	$projectTypeName = $projectType[0]->name;
    
    // Phase 1 get JSON of the scene
	
//    fwrite($fa, $sceneId);
//    fclose($fa);
    
    
    //$scene_json = vrodos_compile_aframe($projectId, $sceneId, $showPawnPositions);
        
        
        // Unity
//        vrodos_assemble_the_project($projectId,
//                                                    $projectSlug,
//                                                    $sceneId,
//	                                                $targetPlatform,
//	                                                $projectTypeName);

	// Wait 2 seconds to erase previous project before starting compiling the new one
	// to avoiding erroneously take previous files. This is not safe with sleep however.
	// Do not delete library folder if it takes too long
	
//	fwrite($fa, $assemply_result);
//	fclose($fa);

	

    
	//
	//$asset_id_temp = get_the_ID();
	$parent_id = wp_get_post_terms($sceneId, 'vrodos_scene_pgame');
	$parent_id = reset($parent_id)->term_id;

	$sceneIdList = vrodos_get_all_sceneids_of_game($parent_id);
	//
	//foreach (array_reverse($sceneIdList) as &$value) {
	//print_r ();
	//}	
	//var_dump($sceneIdList);
	//echo $scene_json;
    
    
    
    //wp_die();
	$scene_json = vrodos_compile_aframe($projectId, $sceneIdList, $showPawnPositions);
    echo $scene_json;
    wp_die();

	
	
	//$scene_json3 = vrodos_compile_aframe($projectId, 935, $showPawnPositions);
    //echo $scene_json3;
    //wp_die();
    // ================================= UNITY ========================================
    
	// sleep(2);
    // Phase 2
//	if ($assemply_success == 'true') {
//
//		$init_gcwd = getcwd(); // get cwd (wp-admin probably)
//		//-----------------------------
//
////        fwrite($fa, "ccccc");
////        fclose($fa);
//		//--Uploads/myGameProjectUnity--
//
//		// Todo: Add more option
//		$upload_dir = wp_upload_dir()['basedir']; //
//
//		$upload_dir = str_replace('\\','/',$upload_dir);
//		$game_dirpath = $upload_dir . '/' . $_REQUEST['gameSlug'] . 'Unity';
//
////		$ff = fopen("outputFF.txt","w");
////        fwrite($ff, print_r(vrodos_getUnity_local_or_remote(),true));
////        fwrite($ff, print_r(vrodos_get_ftpCredentials(),true));
////        fwrite($ff, print_r(vrodos_getUnity_exe_folder(),true)."\n");
////        fwrite($ff, print_r(vrodos_getRemote_api_folder(),true)."\n");
////        fwrite($ff, print_r(vrodos_getRemote_server_path(),true)."\n");
//
//
////		fwrite($ff, print_r(vrodos_getUnity_local_or_remote(),true));
//
//		$remote_game_server_folder_dir = vrodos_getUnity_local_or_remote() =='local' ?
//			$game_dirpath : (vrodos_getRemote_server_path().$_REQUEST['gameSlug'] . 'Unity');
//
//
////		fwrite($ff, $remote_game_server_folder_dir);
////
////        fwrite($ff, "\n");
////        fwrite($ff, $os);
////        fwrite($ff, "\n");
//
//
//		//'C:\xampp\htdocs\COMPILE_UNITY3D_GAMES\\'. $_REQUEST['gameSlug'] . 'Unity' ;
//
//		if ($os === 'win') {
//			$os_bin = 'bat';
//			$txt = '@echo off'."\n"; // change line always with double quote
//			$txt .= 'call :spawn "C:\Program Files\Unity\Editor\Unity.exe" -quit -batchmode -logFile "'.
//			        $remote_game_server_folder_dir.'\stdout.log" -projectPath "'. $remote_game_server_folder_dir . '" -executeMethod HandyBuilder.build';
//
//			$txt .= "\n";
//			$txt .= "ECHO %PID%";
//			$txt .= "\n";
//			$txt .= "exit"; // exit command useful for not showing again the command prompt
//			$txt .= "\n";
//			$txt .= '
//:spawn command args
//:: sets %PID% on completion
//@echo off
//setlocal
//set "PID="
//set "return="
//set "args=%*"
//set "args=%args:\=\\%"
//
//for /f "tokens=2 delims==;" %%I in (
//    \'wmic process call create "%args:"=\"%" ^| find "ProcessId"\'
//) do set "return=%%I"
//
//endlocal & set "PID=%return: =%"
//goto :EOF
//@echo on';
//
//			$compile_command = 'start /b '.$game_dirpath.$DS.'starter_artificial.bat /c';
//
//		} else {
//
////		    // LINUX SERVER
////			$os_bin = 'sh';
////			$txt = "#/bin/bash"."\n".
////			       "projectPath=`pwd`"."\n".
////			       "xvfb-run --auto-servernum --server-args='-screen 0 1024x768x24:32' /opt/Unity/Editor/Unity ".
////			       "-batchmode -nographics -logfile stdout.log -force-opengl -quit -projectPath \${projectPath} -executeMethod HandyBuilder.build";// " -executeMethod HandyBuilder.build";  //;  //. ; "-buildWindowsPlayer ' build/mygame.exe'"; //
////
////			// 2: run sh (nohup     '/dev ...' ensures that it is asynchronous called)
////			$compile_command = 'nohup sh starter_artificial.sh> /dev/null 2>/dev/null & echo $! >>pid.txt';
//		}
//
//		// 1 : Generate bat or sh
//
////        fwrite($ff, $game_dirpath.$DS."starter_artificial.".$os_bin);
//
//
//
//		$myfile = fopen($game_dirpath.$DS."starter_artificial.".$os_bin, "w") or die("Unable to open file!");
//		fwrite($myfile, $txt);
//		fclose($myfile);
//		chmod($game_dirpath.$DS."starter_artificial.".$os_bin, 0755);
//
//		chdir($game_dirpath);
//
//		if ($os === 'win') {
//			if(vrodos_getUnity_local_or_remote() != 'remote') {
//
//				// local compile
//				$unity_pid = shell_exec($compile_command);
//				$fga = fopen("execution_hint.txt", "w");
//				fwrite($fga, $compile_command);
//				fclose($fga);
//			} else {
//
//				// remote
//				$ftp_cre = vrodos_get_ftpCredentials();
//
//				$ftp_host = $ftp_cre['address'];
//				$ftp_user_name = $ftp_cre['username'];
//				$ftp_user_pass = $ftp_cre['password'];
//
//				$gameProject = $_REQUEST['gameSlug'] . 'Unity';
//
//				$zipFile = $gameProject.'.zip';
//
//				$gamesFolder = 'COMPILE_UNITY3D_GAMES';
//				$remote_file = $gamesFolder.'/'.$zipFile;
//
//				$unzip_url = "http://".$ftp_host."/".$gamesFolder.'/unzipper.php?game='.$gameProject."&action=unzip";
//				$startCompile_url = "http://".$ftp_host."/".$gamesFolder.'/unzipper.php?game='.$gameProject."&action=start";
//
//				// -------------- Zip the project to send it for remote compile -------------------
//
//				/* Exclude Files */
//				$exclude_files = array();
//				//$exclude_files[] = realpath($zip_file_name);
//				//$exclude_files[] = realpath('zip.php');
//
//				/* Path of current folder, need empty or null param for current folder */
//				$root_path = realpath($game_dirpath);
//
//				/* Initialize archive object */
//				$zip = new ZipArchive();
//				$zip_open = $zip->open($zipFile, ZipArchive::CREATE | ZipArchive::OVERWRITE);
//
//				/* Create recursive files list */
//				$files = new RecursiveIteratorIterator(
//					new RecursiveDirectoryIterator($root_path),
//					RecursiveIteratorIterator::LEAVES_ONLY
//				);
//
//				/* For each files, get each path and add it in zip */
//				if (!empty($files)) {
//
//					foreach ($files as $name => $file) {
//
//						/* get path of the file */
//						$file_path = $file->getRealPath();
//
//						/* only if it's a file and not directory, and not excluded. */
//						if (!is_dir($file_path) && !in_array($file_path, $exclude_files)) {
//
//							/* get relative path */
//							//                $file_relative_path = str_replace($root_path, '', $file_path);
//
//							$file_relative_path = substr($file_path, strlen($root_path) + 1);
//
//							/* Add file to zip archive */
//							$zip_addfile = $zip->addFile($file_path, $file_relative_path);
//						}
//					}
//				} else {
//					return "ERROR 767: the folder was empty!";
//					wp_die();
//				}
//
//				/* Create ZIP after closing the object. */
//				$zip_close = $zip->close();
//
//				//--------------- FTP TRANSFER ------------------------------------------------
//
//				/* Connect using basic FTP */
//				$connect_it = ftp_connect($ftp_host);
//
//				/* Login to FTP */
//				$login_result = ftp_login($connect_it, $ftp_user_name, $ftp_user_pass);
//
//				$fileHandle = fopen($zipFile, "r");
//
//				if ($login_result === true) {
//					$ret = ftp_nb_fput($connect_it, $remote_file, $fileHandle, FTP_BINARY);
//
//					while ($ret == FTP_MOREDATA) {
//						// Do whatever you want
//						// Call some javascript
//						// Continue uploading...
//						$ret = ftp_nb_continue($connect_it);
//					}
//
//					/* Close the connection */
//					ftp_close($connect_it);
//
//					if ($ret == FTP_FAILED) {
//						echo "There was an error uploading the file...";
//						wp_die();
//					} else if ($ret == FTP_FINISHED) {
//						//return true;
//					}
//				}
//
//				//------------------ UNZIP AND COMPILE --------------------------
//				if (file_get_contents($unzip_url)) //, array("timeout"=>1), $info) )
//				{
//					// Start the compiling
//					$unity_pid = file_get_contents($startCompile_url);
//				} else {
//					echo "<br />Error 798: UNZIPing problem";
//					wp_die();
//				}
//
//			}
//		} else {
//			// LINUX
////			$res = putenv("HOME=/home/jimver04");
////			shell_exec($compile_command);
////			$fpid = fopen("pid.txt","r");
////			$unity_pid = fgets($fpid);
////			fclose($fpid);
//		}
//		//---------------------------------------
//		chdir($init_gcwd);
//
//		echo $unity_pid;
//	}
//	wp_die();
}

//---- AJAX MONITOR: read compile stdout.log file and return content.
function vrodos_monitor_compiling_action_callback(){

	$DS = DIRECTORY_SEPARATOR;

	$os = 'win'; // strtoupper(substr(PHP_OS, 0, 3)) === 'WIN'? 'win':'lin';

	// Monitor stdout.log
	if ($os === 'lin') {
		// LINUX

//		//pid is the sh process id. First get the xvfbrun process ID
//		$phpcomd1  = exec ("ps -ef | grep Unity | awk ' $3 == \"".$_POST['pid']."\" {print $2;}';");
//
//		// from the xvfbrun process ID get the Unity process ID
//		$phpcomd2 = exec("ps -ef | grep Unity | awk -v myvar=".$phpcomd1." '$3==myvar {print $2;}';");
//
//		$processUnityCSV = exec('ps --no-headers -p ' . $phpcomd2 . ' -o size'); // ,%cpu
//
//		// Write to wp-admin dir the shell_exec cmd result
////        $hf = fopen('output.txt', 'w');
////        fwrite($hf, $phpcomd1);
////        fwrite($hf, $phpcomd2);
////        fclose($hf);
//
//		$processUnityCSV = round(((float)($processUnityCSV))/1000,0);
//
//		if ($processUnityCSV==0)
//			$processUnityCSV = "";
//		else
//			$processUnityCSV = "".$processUnityCSV."";

	} else {
		// WINDOWS
		if(vrodos_getUnity_local_or_remote() == 'local') {
			// LOCAL
			//$phpcomd = 'TASKLIST /FI "imagename eq Unity.exe" /v /fo CSV';
			$phpcomd = 'TASKLIST /FI "pid eq ' . $_POST['pid'] . '" /v /fo CSV';
			$processUnityCSV = shell_exec($phpcomd);

			$pathStdOut = $_POST['dirpath']."\stdout.log";

			$stdoutSTR = file_get_contents( $pathStdOut );
			
			echo json_encode(array('os'=> $os, 'CSV' => $processUnityCSV , "LOGFILE"=>$stdoutSTR));
		}else{
			// REMOTE
			$ftp_cre = vrodos_get_ftpCredentials();

			$ftp_host = $ftp_cre['address'];

			$gamesFolder = 'COMPILE_UNITY3D_GAMES';

			$fo = fopen("outputMonitor.txt","w");

			$dirpath = $_POST['dirpath'];

			$dirpath = str_replace('\\\\', '\\', $dirpath);
			$dirpath = str_replace('//', '/', $dirpath);

			$gameProject = basename($dirpath);

			$monitorCompile_url = "http://".$ftp_host."/".$gamesFolder."/unzipper.php?action=monitor&game=".$gameProject."&pid=".$_POST['pid'];

			fwrite($fo, $monitorCompile_url);

			$res = file_get_contents($monitorCompile_url);

			echo $res; // json_encode(array('os'=> $os, 'CSV' => $processUnityCSV , "LOGFILE"=>$stdoutSTR));
		}
	}

	wp_die();
}

//---- AJAX KILL TASK: KILL COMPILE PROCESS ------
function vrodos_killtask_compiling_action_callback(){
	$DS = DIRECTORY_SEPARATOR;

	$os = 'win'; //strtoupper(substr(PHP_OS, 0, 3)) === 'WIN'? 'win':'lin';

	if ($os === 'lin') {

//		//pid is the sh process id. First get the xvfbrun process ID
//		$phpcomd  = "xvfbrun_ID=$(ps -ef | grep Unity | awk ' $3 == \"".$_POST['pid']."\" {print $2;}');";
//
//		// from the xvfbrun process ID get the Unity process ID
//		$phpcomd .= "unity_pid=$(ps -ef | grep Unity | awk -v myvar=\"\$xvfbrun_ID\" '$3==myvar {print $2;}');";
//
//		// kill Unity
//		$phpcomd .= "kill `echo \"\$unity_pid\"`";
//		$killres = exec($phpcomd);

	}else {

		if(vrodos_getUnity_local_or_remote() != 'remote') {
			$phpcomd = 'Taskkill /PID ' . $_POST['pid'] . ' /F';
			$killres = shell_exec($phpcomd);
		} else{

			$ftp_cre = vrodos_get_ftpCredentials();

			$ftp_host = $ftp_cre['address'];

			$gamesFolder = 'COMPILE_UNITY3D_GAMES';



			$stopCompile_url = "http://".$ftp_host."/".$gamesFolder."/unzipper.php?action=stop&pid=".$_POST['pid'];

			$fi = fopen("outputSTOP.txt","w");
			fwrite($fi, "stopCompile_url:". $stopCompile_url);



			$killres = file_get_contents($stopCompile_url);

			fwrite($fi, "killres:" . $killres);
			fclose($fi);
		}
	}

	echo $killres;
	wp_die();
}

//---- AJAX COMPILE 3: Zip the builds folder ---
function vrodos_game_zip_action_callback()
{

	if(vrodos_getUnity_local_or_remote() != 'remote') {
		$DS = DIRECTORY_SEPARATOR;

		// TEST
		//$game_dirpath = realpath(dirname(__FILE__).'/..').$DS.'test_compiler'.$DS.'game_windows';

		// Real
		$game_dirpath = $_POST['dirpath']; //realpath(dirname(__FILE__).'/..').$DS.'games_assemble'.$DS.'dune';

		$rootPath = realpath($game_dirpath) . '/builds';
		$zip_file = realpath($game_dirpath) . '/game.zip';

		$fa = fopen("outputZIP.txt","w");
		fwrite($fa,"ROOTPATH:".$rootPath);
		fwrite($fa, "\n");
		fwrite($fa,"zip_file:".$zip_file);
		fclose($fa);


		// Initialize archive object
		$zip = new ZipArchive();
		$resZip = $zip->open($zip_file, ZipArchive::CREATE | ZipArchive::OVERWRITE);

		if ($resZip === TRUE) {

			// Create recursive directory iterator
			/** @var SplFileInfo[] $files */
			$files = new RecursiveIteratorIterator(
				new RecursiveDirectoryIterator($rootPath),
				RecursiveIteratorIterator::LEAVES_ONLY
			);

			foreach ($files as $name => $file) {
				// Skip directories (they would be added automatically)
				if (!$file->isDir()) {
					// Get real and relative path for current file
					$filePath = $file->getRealPath();

					$relativePath = substr($filePath, strlen($rootPath) + 1);

					// Add current file to archive
					$zip->addFile($filePath, $relativePath);
				}
			}

			// Zip archive will be created only after closing object
			$zip->close();
			echo 'Zip successfully finished [2]';
			wp_die();
		} else {
			echo 'Failed to zip, code:' . $resZip;
			wp_die();
		}
	} else{

		$ftp_cre = vrodos_get_ftpCredentials();

		$ftp_host = $ftp_cre['address'];

		$gamesFolder = 'COMPILE_UNITY3D_GAMES';

		$gameProject = basename($_POST['dirpath']);

		$zipBuild_url = "http://".$ftp_host."/".$gamesFolder."/unzipper.php?game=".$gameProject."&action=zipbuild";

		echo file_get_contents($zipBuild_url);

		wp_die();

	}
}


// NEW ASSEMBLY FUNCTIONS OF JULY 2017

// -- Append scene paths in EditorBuildSettings.asset file --
// $filepath : The path of the already written EditorBuildSettings.asset file
// $scenepath : The scene to add as path : "Assets/scenes/S_Settings.unity"
function vrodos_append_scenes_in_EditorBuildSettings_dot_asset($filepath, $scenepath){

	//a. open file for append
	$fhandle = fopen($filepath, "a");

	//b. create what to append
	$newcontent = "  - enabled: 1".chr(10)."    path: ".$scenepath.chr(10);

	//c. append and close
	fwrite($fhandle, $newcontent);
	fclose($fhandle);

	//d. read test
	//    $fhandle = fopen($filepath, "r");
	//    echo fread($fhandle, filesize($filepath));
}

function vrodos_save_scene_async_action_callback()
{

	// Save screenshot
	if (isset($_POST['scene_screenshot']))
		$attachment_id = vrodos_upload_scene_screenshot(
		             $_POST['scene_screenshot'],
            'scene_'.$_POST['scene_id'].'_featimg',
			          $_POST['scene_id'],
            'jpg', true);

	// Set thumbnail of post
	set_post_thumbnail( $_POST['scene_id'], $attachment_id );
	
	// Save json of scene
	$scene_new_info = array(
		'ID' => $_POST['scene_id'],
		'post_title' => $_POST['scene_title'],
		'post_content' => wp_strip_all_tags(wp_unslash($_POST['scene_json']), true)
	);

	$res = wp_update_post($scene_new_info);
	update_post_meta($_POST['scene_id'], 'vrodos_scene_caption', $_POST['scene_caption']);

	echo $res!=0 ? 'true' : 'false';
	wp_die();
}





// Undo button for scenes
function vrodos_undo_scene_async_action_callback()
{
    //$ff = fopen("undo.log","w");
    
    $revision_number = $_POST['post_revision_no'];
    $current_scene_id = $_POST['scene_id'];
    
//    fwrite($ff, $current_scene_id);
//    fwrite($ff, $revision_number);
//
    
    $rev=wp_get_post_revisions( $current_scene_id,
        [
            'offset'           => $revision_number,    // Start from the previous change
            'posts_per_page'  => 1,    // Only a single revision
            'post_name__in'   => [ "{$current_scene_id}-revision-v1" ],
            'check_enabled'   => false,
        ]
    );
    $sceneToLoad = reset($rev)->post_content;

//    fwrite($ff, $sceneToLoad);
//    fclose($ff);
   
    
    echo $sceneToLoad;
    wp_die();
}


//function vrodos_translate_action_callback()
//{
//
//    $text = $_POST['text'];
//    $target_lang = $_POST['lang'];
//
//    //$translate = new TranslateClient();
////    $result = $translate->translate($text, [
////    'target' => $target_lang,
////    ]);
//    echo $result[text];
//    wp_die();
//}


// Redo button for scenes
function vrodos_redo_scene_async_action_callback()
{
    if (isset($_POST['scene_screenshot'])){
        $attachment_id = vrodos_upload_scene_screenshot(
            $_POST['scene_screenshot'],
            'scene_'.$_POST['scene_id'].'_featimg',
            $_POST['scene_id'],
            'jpg' , true);
    
        set_post_thumbnail( $_POST['scene_id'], $attachment_id );
    }
    
    $scene_new_info = array(
        'ID' => $_POST['scene_id'],
        'post_title' => $_POST['scene_title'],
        'post_content' => wp_unslash($_POST['scene_json'])
    );
    
    $res = wp_update_post($scene_new_info);
    update_post_meta($_POST['scene_id'], 'vrodos_scene_caption', $_POST['scene_caption']);
    
    echo $res!=0 ? 'true' : 'false';
    wp_die();
}




// Save analytics keys
function vrodos_save_gio_async_action_callback()
{
	// put meta in scene. True, false, or id of meta if does not exist
	$res = update_post_meta( $_POST['project_id'], 'vrodos_project_gioApKey', wp_unslash($_POST['project_gioApKey']) );

//	$attachment_id = vrodos_upload_Assetimg64($_POST['scene_screenshot'], 'scene_'.$_POST['scene_id'].'_featimg',
//		$_POST['scene_id'], get_post($_POST['scene_id'])->post_name );
//
//	set_post_thumbnail( $_POST['scene_id'], $attachment_id );
//
//
//	$scene_new_info = array(
//		'ID' => $_POST['scene_id'],
//		'post_title' => $_POST['scene_title'],
//		'post_content' => $_POST['scene_description']
//	);
//
//	wp_update_post($scene_new_info);

	echo $res ? 'true' : 'false';
	wp_die();
}

function vrodos_save_expid_async_action_callback()
{
	// put meta in scene. True, false, or id of meta if does not exist
	$res = update_post_meta( $_POST['project_id'], 'vrodos_project_expID', wp_unslash($_POST['project_expID']) );

	echo $res ? 'true' : 'false';
	wp_die();
}


/**
 *   This function is for compiling the \test_compiler\game_windows  project
 */
function fake_compile_for_a_test_project()
{
	// 1. Start the compile
	$gcwd = getcwd(); // get cwd (wp-admin probably)

	chdir("../wp-content/plugins/vrodos/test_compiler/game_windows/");

	// Windows
	$output = shell_exec('start /b starter.bat /c');

	// WebGL
	//$output = shell_exec('start /b starterWebGL.bat /c');

	// go back to previous directory (wp-admin probably)
	chdir($gcwd);

	// Write to wp-admin dir the shell_exec cmd result
	$h = fopen('output.txt', 'w');
	fwrite($h, $output);
	fclose($h);
}

?>
