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
	
	$post_id = wp_insert_post($project_information_arch);
	$post = get_post($post_id);

	wp_insert_term($post->post_title,'vrodos_asset3d_pgame',array(
			'description'=> '-',
			'slug' => $post->post_name,
		)
	);
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
                            if ($value['category_name'] === 'Decoration') {
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

function image_upload_action_callback(){
	/// TODO upload image 
	
	$data = $_POST["image"]; 
	$project_id = $_POST["projectid"];
	$scene_id = $_POST["sceneid"];
	//$filename=$_FILES['image']['tmp_name'];
	//$projectId = $_REQUEST['projectId'];

	// echo $data;
	var_dump($data);
	//require_once(ABSPATH . 'wp-admin/includes/admin.php');
	
	$DS = DIRECTORY_SEPARATOR;

	//$hashed_filename = '_'.'_temp_bcg.png';
	$hashed_filename = $scene_id .'_'. time() .'_scene_bcg.png';

	$temp_filename = '_'.'_temp3_bcg.png';

	wp_handle_upload($data);

	$upload_path = str_replace('/', $DS, wp_upload_dir()['basedir']) . $DS . 'models' . $DS . $project_id . $DS;
    if (!is_dir($upload_path)) {
        mkdir( $upload_path, 0777, true );
    }

	if ( $_FILES['image']['error'] > 0 ){
        echo 'Error: ' . $_FILES['image']['error'] . '<br>';
    }
    else {
        if($file_return = move_uploaded_file($_FILES['image']['tmp_name'], $upload_path . $hashed_filename))
		{
			echo "File Uploaded Successfully";
		}
    }
	// $attachment_id = vrodos_insert_attachment_post($file_return, $scene_id );
    // if( !isset( $file_return['error'] ) && !isset( $file_return['upload_error_handler'] ) ) {

    //     // Id of attachment post
    //     //$attachment_id = vrodos_insert_attachment_post($file_return, $scene_id );

    //     // if( 0 < intval( $attachment_id, 10 ) ) {
    //     //     return $attachment_id;
    //     // }

    // }

	$new_filename = str_replace("\\","/", $upload_path .$hashed_filename);

	//$background_id = update_post_meta(5,'_wp_scene_background_id');
	update_post_meta($scene_id, '_wp_scene_bcg_file', $new_filename);

    // if (count($background_ids) > 0) {

    //     // Remove previous file from file system
    //     $prevfMeta = get_post_meta($background_ids[0], '_wp_attachment_metadata', false);

    //     if (file_exists($prevfMeta[0]['file'])) {
    //         unlink($prevfMeta[0]['file']);
    //     }
    // }

	// $hashed_filename =  md5($_FILES['image']['name'] . microtime()) . '_' . $_FILES['image']['name'] . '.' . "png";
	// add_post_meta(5, '_wp_scene_bcg_file', "new_filename");



	// update_post_meta(5, '_wp_scene_bcg_file', "new_filename");
    // // Get admin power
    // require_once(ABSPATH . 'wp-admin/includes/admin.php');

    // // // Get upload directory and do some sanitization
    // // $upload_path = str_replace('/', $DS, wp_upload_dir()['basedir']) . $DS .'models'.$DS;


	// if (!function_exists('wp_handle_sideload')) {
    //     require_once(ABSPATH . 'wp-admin/includes/file.php');
    // }

    // // // Without that I'm getting a debug error!?
    // // if (!function_exists('wp_get_current_user')) {
    // //     require_once(ABSPATH . 'wp-includes/pluggable.php');
    // // }

    // $file = array(
    //     'name' => $hashed_filename,
    //     'type' => '',
    //     'tmp_name' => $upload_path . $hashed_filename,
    //     'error' => 0,
    //     'size' => filesize($upload_path . $hashed_filename),
    // );

    // // If post meta already exists
    // if (count($background_ids) > 0){

    //     $background_post_id = $background_ids[0];

    //     // Update the thumbnail post title into the database
    //     $my_post = array(
    //         'ID' => $background_post_id,
    //         'post_title' => "new_filename"
    //     );
    //     wp_update_post( $my_post );

    //     // Update thumbnail meta _wp_attached_file
    //     update_post_meta($background_post_id, '_wp_scene_bcg_file', "new_filename");

    //     // update also _attachment_meta
    //     $data_meta = wp_get_attachment_metadata( $background_post_id);

    //     $data_meta['file'] = "new_filename";

    //     wp_update_attachment_metadata( $background_post_id, $data_meta );

    // } else {
	// 	$background_id = update_post_meta($scene_id,'_background_id');
    //     $attachment = array(
    //         'post_mime_type' => "",
    //         'post_title' => preg_replace('/\.[^.]+$/', '', basename("new_filename")),
    //         'post_content' => '',
    //         'post_status' => 'inherit',
    //         'guid' => ""
    //     );

    //     $attachment_id = wp_insert_attachment($attachment, "new_filename", $scene_id);

	// 	add_post_meta("5", '_wp_scene_bcg_file', "new_filename");

	// 	update_post_meta("5", '_wp_scene_bcg_file', "new_filename");

    //     require_once(ABSPATH . 'wp-admin/includes/image.php');

    //     $attachment_data = wp_generate_attachment_metadata($attachment_id, "new_filename");

    //     wp_update_attachment_metadata($attachment_id, $attachment_data);

    // }
    
    wp_send_json($data);

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
