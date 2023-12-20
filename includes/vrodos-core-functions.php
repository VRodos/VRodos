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

	$DS = DIRECTORY_SEPARATOR;

	$project_id = $_POST["projectid"];
	$scene_id = $_POST["sceneid"];

	add_filter( 'intermediate_image_sizes_advanced', 'vrodos_remove_allthumbs_sizes', 10, 2 );
	require_once( ABSPATH . 'wp-admin/includes/admin.php' );

	// DELETE EXISTING FILE: See if has already a thumbnail and delete the file in the filesystem
	$scene_background_ids = get_post_meta($scene_id,'vrodos_scene_bg_image');
	if (!empty($scene_background_ids) && !empty($scene_background_ids[0])) {
		// Remove previous file from file system

		$prevMeta = get_post_meta($scene_background_ids[0], '_wp_attachment_metadata', false);

		if (count($prevMeta)>0) {
			if (file_exists($prevMeta[0]['file'])) {
				unlink($prevMeta[0]['file']);
			}
		}
	}

	$upload_dir = wp_upload_dir();
	$upload_path = str_replace('/',$DS,$upload_dir['basedir']) . $DS . 'scenes' . $DS . $scene_id . $DS;

	// Make Scene folder
	if (!is_dir($upload_path)) {
		mkdir( $upload_path, 0777, true );
	}

	$image = $_POST["image"];
	$fn = $_POST["filename"];
	$ext = $_POST["imagetype"];

	$hashed_filename = $project_id .'_'. time() . '_' . $scene_id.'_bg.'. $ext;

	// Write file string to a file in server
	file_put_contents($upload_path . $hashed_filename,
		base64_decode(substr($image, strpos($image, ",") + 1)));

	$new_filename = str_replace("\\","/", $upload_path .$hashed_filename);

	//--- End of upload ---

	// DATABASE UPDATE
	// If post meta already exists
	if (!empty($scene_background_ids) && !empty($scene_background_ids[0])) {

		$scene_bg_id = $scene_background_ids[0];

		// Update the post title into the database
		wp_update_post( array('ID' => $scene_bg_id, 'post_title' => $new_filename));

		// Update meta _wp_attached_file
		update_post_meta($scene_bg_id, '_wp_attached_file', $new_filename);

		// update also _attachment_meta
		$data = wp_get_attachment_metadata( $scene_bg_id);

		$data['file'] = $new_filename;

		wp_update_attachment_metadata( $scene_bg_id, $data );

		update_post_meta($scene_id, 'vrodos_scene_bg_image', $scene_bg_id);

	} else { // If post does not exist

		$attachment = array(
			'post_mime_type' => 'image/' .$ext,
			'post_title' => preg_replace('/\.[^.]+$/', '', basename($new_filename)),
			'post_content' => '',
			'post_status' => 'inherit',
			'guid' => $upload_path.$hashed_filename
		);

		// Attach to
		$attachment_id = wp_insert_attachment($attachment, $new_filename, $scene_id);

		require_once(ABSPATH . 'wp-admin/includes/image.php');

		$attachment_data = wp_generate_attachment_metadata($attachment_id, $new_filename);

		wp_update_attachment_metadata($attachment_id, $attachment_data);

		update_post_meta($scene_id, 'vrodos_scene_bg_image', $attachment_id);

		remove_filter('intermediate_image_sizes_advanced',
			'vrodos_remove_allthumbs_sizes', 10);

		// if (0 < intval($attachment_id, 10)) {
		// 	return $attachment_id;
		// }

	}

	$final_path = $attachment_id ? wp_get_attachment_url( $attachment_id ) : wp_get_attachment_url( $scene_bg_id );

	$content = json_encode(array( 'url' => $final_path ));

	echo $content;

	wp_die();

}


//====================== PROJECT ASSEMBLY AND COMPILATION =================================================================

function vrodos_compile_action_callback(){

	//$projectId = $_REQUEST['vrodos_game'];
	$sceneId = $_REQUEST['vrodos_scene'];
	$projectId = $_REQUEST['projectId'];
	$showPawnPositions = $_REQUEST['showPawnPositions'];
	//$projectSlug = $_REQUEST['projectSlug'];

	//$asset_id_temp = get_the_ID();
	$parent_id = wp_get_post_terms($sceneId, 'vrodos_scene_pgame');
	$parent_id = reset($parent_id)->term_id;

	$sceneIdList = vrodos_get_all_sceneids_of_game($parent_id);

	$scene_json = vrodos_compile_aframe($projectId, $sceneIdList, $showPawnPositions);
	echo $scene_json;
	wp_die();

}



function vrodos_save_scene_async_action_callback()
{

	// Save screenshot
	if (isset($_POST['scene_screenshot']))
		$attachment_id = vrodos_upload_scene_screenshot(
			$_POST['scene_screenshot'],
			'scene_'.$_POST['scene_id'].'_featimg',
			$_POST['scene_id'],
			'jpg',
			true);

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

	$rev = wp_get_post_revisions( $current_scene_id,
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
			'jpg' ,
			true);

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

?>
