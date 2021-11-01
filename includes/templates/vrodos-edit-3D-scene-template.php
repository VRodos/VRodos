<?php
if ( get_option('permalink_structure') ) { $perma_structure = true; } else {$perma_structure = false;}
if( $perma_structure){$parameter_pass = '?vrodos_game=';} else{$parameter_pass = '&vrodos_game=';}
if( $perma_structure){$parameter_Scenepass = '?vrodos_scene=';} else {$parameter_Scenepass = '&vrodos_scene=';}
$parameter_assetpass = $perma_structure ? '?vrodos_asset=' : '&vrodos_asset=';

// Load VR_Editor Scripts
function vrodos_load_vreditor_scripts()
{
    wp_enqueue_script('jquery-ui-draggable');
    
    wp_enqueue_script('vrodos_load119_threejs');
    wp_enqueue_script('vrodos_load119_CSS2DRenderer');
    wp_enqueue_script('vrodos_load119_CopyShader');
    wp_enqueue_script('vrodos_load119_FXAAShader');
    wp_enqueue_script('vrodos_load119_EffectComposer');
    wp_enqueue_script('vrodos_load119_RenderPass');
    wp_enqueue_script('vrodos_load119_OutlinePass');
    wp_enqueue_script('vrodos_load119_ShaderPass');
    wp_enqueue_script('vrodos_load119_FBXloader');
    wp_enqueue_script('vrodos_load119_GLTFLoader');
    wp_enqueue_script('vrodos_load119_DRACOLoader');
    wp_enqueue_script('vrodos_load119_DDSLoader');
    wp_enqueue_script('vrodos_load119_KTXLoader');
    wp_enqueue_script('vrodos_inflate');
    
    // Fixed at 87 (forked of original 87)
    wp_enqueue_script('vrodos_load87_datgui');
    wp_enqueue_script('vrodos_load87_OBJloader');
    wp_enqueue_script('vrodos_load87_MTLloader');
    wp_enqueue_script('vrodos_load87_OrbitControls');
    wp_enqueue_script('vrodos_load87_TransformControls');
    wp_enqueue_script('vrodos_load87_PointerLockControls');
    
    wp_enqueue_script('vrodos_load87_sceneexporterutils');
    wp_enqueue_script('vrodos_load87_scene_importer_utils');
    wp_enqueue_script('vrodos_load87_sceneexporter');
    
    // Colorpicker for the lights
    wp_enqueue_script('vrodos_jscolorpick');
    
    wp_enqueue_style('vrodos_datgui');
    wp_enqueue_style('vrodos_3D_editor');
    wp_enqueue_style('vrodos_3D_editor_browser');
    
}
add_action('wp_enqueue_scripts', 'vrodos_load_vreditor_scripts' );


function vrodos_load_custom_functions_vreditor(){
    wp_enqueue_script('vrodos_3d_editor_environmentals');
    wp_enqueue_script('vrodos_keyButtons');
    wp_enqueue_script('vrodos_rayCasters');
    wp_enqueue_script('vrodos_auxControlers');
    wp_enqueue_script('vrodos_LoaderMulti');
    wp_enqueue_script('vrodos_movePointerLocker');
    wp_enqueue_script('vrodos_addRemoveOne');
    wp_enqueue_script('vrodos_3d_editor_buttons');
    wp_enqueue_script('vrodos_vr_editor_analytics');
    wp_enqueue_script('vrodos_fetch_asset_scenes_request');
}
add_action('wp_enqueue_scripts', 'vrodos_load_custom_functions_vreditor' );

?>

<script type="text/javascript">
    // keep track for the undo-redo function
    post_revision_no = 1;

    // is rendering paused
    isPaused = false;

    // Use lighting or basic materials (basic does not employ light, no shadows)
    window.isAnyLight = true;
</script>


<?php
// Define current path of plugin
$pluginpath = str_replace('\\','/', dirname(plugin_dir_url( __DIR__  )) );

// wpcontent/uploads/
$upload_url = wp_upload_dir()['baseurl'];
$upload_dir = str_replace('\\','/',wp_upload_dir()['basedir']);

// Scene
$current_scene_id = sanitize_text_field( intval( $_GET['vrodos_scene'] ));

// Project
$project_id    = sanitize_text_field( intval( $_GET['vrodos_game'] ) );
$project_post  = get_post($project_id);
$projectSlug   = $project_post->post_name;

// Get if project is : 'Archaeology' or 'Energy' or 'Chemistry'
$project_type = vrodos_return_project_type($project_id)->string;

// Get project type icon
$project_type_icon = vrodos_return_project_type($project_id)->icon;

// Get Joker project id
$joker_project_id = get_page_by_path( strtolower($project_type).'-joker', OBJECT, 'vrodos_game' )->ID;

// Wind Energy Only
if ($project_type === 'Energy') {
    $scenesNonRegional = vrodos_getNonRegionalScenes($_REQUEST['vrodos_game']);
    $scenesMarkerAllInfo = vrodos_get_all_scenesMarker_of_project_fastversion($project_id);
}

// Archaeology only
if ($project_type === 'Archaeology') {
    $doorsAllInfo = vrodos_get_all_doors_of_project_fastversion($project_id);
}

// Get scene content from post
$scene_post = get_post($current_scene_id);

// If empty load default scenes if no content. Do not put esc_attr, crashes the universe in 3D.
$sceneToLoad = $scene_post->post_content ? $scene_post->post_content :
                        vrodos_getDefaultJSONscene(strtolower($project_type));

$sceneTitle = $scene_post->post_name;

// Front End or Back end
$isAdmin = is_admin() ? 'back' : 'front';


$allProjectsPage = vrodos_getEditpage('allgames');
$newAssetPage = vrodos_getEditpage('asset');
$editscenePage = vrodos_getEditpage('scene');
$editscene2DPage = vrodos_getEditpage('scene2D');
$editsceneExamPage = vrodos_getEditpage('sceneExam');



// for vr_editor
$urlforAssetEdit = esc_url( get_permalink($newAssetPage[0]->ID) . $parameter_pass . $project_id .
                                '&vrodos_scene=' .$current_scene_id . '&vrodos_asset=' );

// User data
$user_data = get_userdata( get_current_user_id() );
$user_email = $user_data->user_email;


// Shift vars to Javascript side
echo '<script>';
echo 'var pluginPath="'.$pluginpath.'";';
echo 'let uploadDir="'.wp_upload_dir()['baseurl'].'";';
echo 'let projectId="'.$project_id.'";';
echo 'let projectSlug="'.$projectSlug.'";';
echo 'var isAdmin="'.$isAdmin.'";';
echo 'let isUserAdmin="'.current_user_can('administrator').'";';
echo 'let urlforAssetEdit="'.$urlforAssetEdit.'";';
echo 'let scene_id ="'.$current_scene_id.'";';
echo 'let game_type ="'.strtolower($project_type).'";';
echo 'let project_keys ="'.json_encode(vrodos_getProjectKeys($project_id, $project_type)).'";';
echo 'user_email = "'.$user_email.'";';
echo 'current_user_id = "'.get_current_user_id().'";';
echo 'energy_stats = '.json_encode(vrodos_windEnergy_scene_stats($current_scene_id)).';';


if ($project_type === 'Archaeology') {
    echo "var doorsAll=" . json_encode($doorsAllInfo) . ";";
}
if ($project_type === 'Energy') {
    echo "var scenesMarkerAll=" . json_encode($scenesMarkerAllInfo) . ";";
    echo "var scenesNonRegional=".json_encode($scenesNonRegional).";";
}

if ($project_type === 'Chemistry') {
    echo "var scenesTargetChemistry=" . json_encode(vrodos_getAllexams_byGame($joker_project_id, true)) . ";";
}
echo '</script>';


// For analytics
$project_saved_keys = vrodos_getProjectKeys($project_id, $project_type);

// if Virtual Lab
if($project_type === 'Energy' || $project_type === 'Chemistry') {
    if (!array_key_exists('gioID', $project_saved_keys)) {
        echo "<script type='text/javascript'>alert(\"APP KEY not found." .
            " Please make sure that your user account has been registered correctly, " .
            "and you have loaded the correct page\");</script>";
    }
}

// Get 'parent-game' taxonomy with the same slug as Game (in order to show scenes that belong here)
$allScenePGame = get_term_by('slug', $projectSlug, 'vrodos_scene_pgame');

//$ff = fopen('output_merger.txt',"w");
//fwrite($ff, "1:".print_r($project_post)         .chr(13));
//fwrite($ff, "2:".print_r($projectSlug,true));
//fclose($ff);

$allScenePGameID = $allScenePGame->term_id;

if ($project_type === "Chemistry") {
    $analytics_molecule_checklist = vrodos_derive_molecules_checklist();
}

// Ajax for fetching game's assets within asset browser widget at vr_editor // user must be logged in to work, otherwise ajax has no privileges

// COMPILE Ajax
if(vrodos_getUnity_local_or_remote() != 'remote') {

    // Local compile
	$gameUnityProject_dirpath = $upload_dir . '\\' . $projectSlug . 'Unity';
	$gameUnityProject_urlpath = $pluginpath . '/../../uploads/' . $projectSlug . 'Unity/';

} else {

    // Remote compile
	$ftp_cre = vrodos_get_ftpCredentials();
	$ftp_host = $ftp_cre['address'];

	$gamesFolder = 'COMPILE_UNITY3D_GAMES';

	$gameUnityProject_dirpath = $gamesFolder."/".$projectSlug."Unity";
	$gameUnityProject_urlpath = "http://".$ftp_host."/".$gamesFolder."/".$projectSlug."Unity";
}


$thepath = $pluginpath . '/js_libs/assemble_compile_commands/request_game_assepile.js';
wp_enqueue_script( 'ajax-script_assepile', $thepath, array('jquery') );
wp_localize_script( 'ajax-script_assepile', 'my_ajax_object_assepile',
	array( 'ajax_url' => admin_url( 'admin-ajax.php'),
	       'id' => $project_id,
	       'slug' => $projectSlug,
	       'gameUnityProject_dirpath' => $gameUnityProject_dirpath,
	       'gameUnityProject_urlpath' => $gameUnityProject_urlpath
	)
);

// DELETE SCENE AJAX
wp_enqueue_script( 'ajax-script_deletescene', $pluginpath . '/js_libs/ajaxes/delete_scene.js', array('jquery') );
wp_localize_script( 'ajax-script_deletescene', 'my_ajax_object_deletescene',
	array( 'ajax_url' => admin_url( 'admin-ajax.php'))
);

//FOR SAVING extra keys
wp_enqueue_script( 'ajax-script_savegio', $pluginpath.'/js_libs/ajaxes/vrodos_save_scene_ajax.js', array('jquery') );
wp_localize_script( 'ajax-script_savegio', 'my_ajax_object_savegio',
	array( 'ajax_url' => admin_url( 'admin-ajax.php' ), 'project_id' => $project_id )
);

// Asset Browser
wp_enqueue_script( 'ajax-script_filebrowse', $pluginpath.'/js_libs/vrodos_assetBrowserToolbar.js', array('jquery') );
wp_localize_script( 'ajax-script_filebrowse', 'my_ajax_object_fbrowse', array( 'ajax_url' => admin_url( 'admin-ajax.php' ) ) );

// Save scene
wp_enqueue_script( 'ajax-script_savescene', $pluginpath.'/js_libs/ajaxes/vrodos_save_scene_ajax.js', array('jquery') );
wp_localize_script( 'ajax-script_savescene', 'my_ajax_object_savescene',
	array( 'ajax_url' => admin_url( 'admin-ajax.php' ), 'scene_id' => $current_scene_id )
);

// Delete Asset
wp_enqueue_script( 'ajax-script_deleteasset', $pluginpath.
    '/js_libs/ajaxes/delete_asset.js', array('jquery') );
wp_localize_script( 'ajax-script_deleteasset', 'my_ajax_object_deleteasset',
	array( 'ajax_url' => admin_url( 'admin-ajax.php' ) )
);

// Fetch Asset
wp_enqueue_script( 'ajax-script_fetchasset', $pluginpath.
    '/js_libs/ajaxes/fetch_asset.js', array('jquery') );
wp_localize_script( 'ajax-script_fetchasset', 'my_ajax_object_fetchasset',
    array( 'ajax_url' => admin_url( 'admin-ajax.php' ) )
);



wp_enqueue_media($scene_post->ID);
require_once(ABSPATH . "wp-admin" . '/includes/media.php');

if ($project_type === 'Archaeology') {
	$single_lowercase = "tour";
	$single_first = "Tour";
} else if ($project_type === 'Energy' || $project_type === 'Chemistry'){
	$single_lowercase = "lab";
	$single_first = "Lab";
} else {
	$single_lowercase = "project";
	$single_first = "Project";
}

// For Chemistry only
if(isset($_POST['submitted2']) && isset($_POST['post_nonce_field2']) && wp_verify_nonce($_POST['post_nonce_field2'], 'post_nonce')) {
	$expID = $_POST['exp-id'];
	update_post_meta( $project_id, 'vrodos_project_expID', $expID);

	$loadMainSceneLink = get_permalink($editscenePage[0]->ID) . $parameter_Scenepass . $current_scene_id . '&vrodos_game=' . $project_id . '&scene_type=scene';
	wp_redirect( $loadMainSceneLink );
	exit;
}


// ADD NEW SCENE
if(isset($_POST['submitted']) && isset($_POST['post_nonce_field']) && wp_verify_nonce($_POST['post_nonce_field'], 'post_nonce')) {

	$newSceneType = $_POST['sceneTypeRadio'];

	$sceneMetaType = 'scene';//default 'scene' MetaType (3js)
	$game_type_chosen_slug = '';

	$default_json = '';
	$thegameType = wp_get_post_terms($project_id, 'vrodos_game_type');
	if($thegameType[0]->slug == 'archaeology_games'){
	    
	    $newscene_yaml_tax = get_term_by('slug', 'wonderaround-yaml', 'vrodos_scene_yaml');
	    
	    $game_type_chosen_slug = 'archaeology_games';
	    $default_json = vrodos_getDefaultJSONscene('archaeology');
	    
	} elseif($thegameType[0]->slug == 'energy_games'){
	    
	    $newscene_yaml_tax = get_term_by('slug', 'educational-energy', 'vrodos_scene_yaml');
	    $game_type_chosen_slug = 'energy_games';
	    $default_json = vrodos_getDefaultJSONscene('energy');
	
	}elseif($thegameType[0]->slug == 'chemistry_games'){
	 
		$game_type_chosen_slug = 'chemistry_games';
		
		$default_json = vrodos_getDefaultJSONscene('chemistry');
		
		if($newSceneType == 'lab'){
		
		    $newscene_yaml_tax = get_term_by('slug', 'wonderaround-lab-yaml', 'vrodos_scene_yaml');
		
		} elseif($newSceneType == '2d'){
		
		    $newscene_yaml_tax = get_term_by('slug', 'exam2d-chem-yaml', 'vrodos_scene_yaml');
		    $sceneMetaType = 'sceneExam2d';
		
		} elseif($newSceneType == '3d'){
		
		    $newscene_yaml_tax = get_term_by('slug', 'exam3d-chem-yaml', 'vrodos_scene_yaml');
		    $sceneMetaType = 'sceneExam3d';
		}
	}

	$scene_taxonomies = array(
		'vrodos_scene_pgame' => array(
			$allScenePGameID,
		),
		'vrodos_scene_yaml' => array(
			$newscene_yaml_tax->term_id,
		)
	);

	$scene_metas = array(
		'vrodos_scene_default' => 0,
        'vrodos_scene_caption' => esc_attr(strip_tags($_POST['scene-caption']))
	);

	//REGIONAL SCENE EXTRA TYPE FOR ENERGY GAMES
	$isRegional = 0;//default value
	if($thegameType[0]->slug == 'energy_games'){
		if($_POST['regionalSceneCheckbox'] == 'on'){$isRegional = 1;}
		$scene_metas['vrodos_isRegional']= $isRegional;
		$scene_metas['vrodos_scene_environment'] = 'fields';
	}

	//Add the final MetaType of the Scene
	$scene_metas['vrodos_scene_metatype']= $sceneMetaType;

	$scene_information = array(
		'post_title' => esc_attr(strip_tags($_POST['scene-title'])),
		'post_content' => $default_json,
		'post_type' => 'vrodos_scene',
		'post_status' => 'publish',
		'tax_input' => $scene_taxonomies,
		'meta_input' => $scene_metas,
	);

	$scene_id = wp_insert_post($scene_information);

	if($scene_id){
		if($sceneMetaType == 'sceneExam2d' || $sceneMetaType == 'sceneExam3d'){$edit_scene_page_id = $editsceneExamPage[0]->ID;}
		else{$edit_scene_page_id = $editscenePage[0]->ID;}
		$loadMainSceneLink = get_permalink($edit_scene_page_id) . $parameter_Scenepass . $scene_id . '&vrodos_game=' . $project_id . '&scene_type=' . $sceneMetaType;
		wp_redirect( $loadMainSceneLink );
		exit;
	}
}

$goBackTo_AllProjects_link = esc_url( get_permalink($allProjectsPage[0]->ID));

// Make the header of the page
get_header(); ?>

<?php if ( !is_user_logged_in() ) { ?>

    <!-- if user not logged in, then prompt to log in -->
    <div class="DisplayBlock CenterContents">
        <i style="font-size: 64px; padding-top: 80px;" class="material-icons mdc-theme--text-icon-on-background">account_circle</i>
        <p class="mdc-typography--title"> Please <a class="mdc-theme--secondary"
               href="<?php echo wp_login_url( get_permalink() ); ?>">login</a> to use platform</p>
        <p class="mdc-typography--title"> Or
            <a class="mdc-theme--secondary" href="<?php echo wp_registration_url(); ?>">register</a>
            if you don't have an account</p>
    </div>

    <hr class="WhiteSpaceSeparator">

<?php } else { ?>


    <!-- PANELS -->
    <div class="panels">
        
        <!-- Panel 1 is the vr enivironment -->
        <div class="panel active" id="panel-1" role="tabpanel" aria-hidden="false">
            
            <!-- 3D editor  -->
            <div id="vr_editor_main_div">

                <!-- Upper Toolbar -->
                <div class="mdc-toolbar hidable scene_editor_upper_toolbar">

                    <!-- Display Breadcrump about projectType>project>scene -->
                    <?php vrEditorBreadcrumpDisplay($scene_post, $goBackTo_AllProjects_link,
                        $project_type, $project_type_icon, $project_post); ?>

                    <!-- Undo - Save - Redo -->
                    <div id="save-scene-elements">
                        <a id="undo-scene-button" title="Undo last change"><i class="material-icons">undo</i></a>
                        <a id="save-scene-button" title="Save all changes you made to the current scene">All changes saved</a>
                        <a id="redo-scene-button" title="Redo last change"><i class="material-icons">redo</i></a>
                    </div>

                    <!-- View Json code UI -->
                    <a id="toggleViewSceneContentBtn" data-toggle='off' type="button"
                       class="ToggleUIButtonStyle mdc-theme--secondary mdc-theme--text-hint-on-light"
                       title="View json of scene"
                       style="padding-top:1px;width:70px;left: calc(50% + 112px);">
                        json:
                        <i class="material-icons" style="background: none; opacity:1; font-size:11pt">visibility_off</i>
                    </a>

                    <!-- Compile Button -->
                    <a id="compileGameBtn"
                       class="mdc-button mdc-button--raised mdc-theme--text-primary-on-dark mdc-theme--secondary-bg w3-display-right"
                       data-mdc-auto-init="MDCRipple"
                       title="When you are finished compile the <?php echo $single_lowercase; ?> into a standalone binary">
                        COMPILE
                    </a>
        
                    <?php // Compile Dialogue html
                    require( plugin_dir_path( __DIR__ ) .  '/templates/vrodos-edit-3D-scene-CompileDialogue.php' );
                    ?>
                </div>

                <!-- Scene JSON content TextArea display and set input field -->
                <div id="sceneJsonContent">
                  <textarea id="vrodos_scene_json_input"
                    name="vrodos_scene_json_input"
                    title="vrodos_scene_json_input"
                    rows="50" cols = "100"><?php echo json_encode(json_decode($sceneToLoad), JSON_PRETTY_PRINT ); ?>
                  </textarea>
                </div>









                <!-- Close all 2D UIs-->
                <a id="toggleUIBtn" data-toggle='on' type="button"
                   class="ToggleUIButtonStyle mdc-theme--secondary" title="Toggle interface">
                    <i class="material-icons" style="background: #ffffff; opacity:0.2">visibility</i>
                </a>

                <!-- Lights -->
                <div class="lightcolumns hidable">
                    <div class="lightcolumn" data-light="Sun" draggable="true">
                        <header draggable="false">Sun</header><img draggable="false"
                           src="<?php echo $pluginpath?>/images/lights/sun.png" class="lighticon"/>
                    </div>
                    <div class="lightcolumn" data-light="Lamp" draggable="true">
                        <header draggable="false">Lamp</header><img draggable="false"
                           src="<?php echo $pluginpath?>/images/lights/lamp.png" draggable="false" class="lighticon"/>
                    </div>
                    <div class="lightcolumn" data-light="Spot" draggable="true"><header draggable="false">Spot</header>
                        <img draggable="false" src="<?php echo $pluginpath?>/images/lights/spot.png" draggable="false"
                             class="lighticon"/>
                    </div>
                </div>

                <!-- Remove game object from scene -->
                <a type="button" id="removeAssetBtn"
                   class="RemoveAssetFromSceneBtnStyle hidable mdc-button mdc-button--raised mdc-button--primary mdc-button--dense"
                   title="Remove selected asset from the scene" data-mdc-auto-init="MDCRipple">
                    <i class="material-icons">delete</i>
                </a>

                <!--  Open/Close Right Hierarchy panel-->
                <a id="hierarchy-toggle-btn" data-toggle='on' type="button"
                   class="HierarchyToggleStyle HierarchyToggleOn hidable mdc-button mdc-button--raised mdc-button--primary mdc-button--dense"
                   title="Toggle hierarchy viewer" data-mdc-auto-init="MDCRipple">
                    <i class="material-icons">menu</i>
                </a>

                <!-- Right Panel -->
                <div id="right-elements-panel" class="right-elements-panel-style">

                    <!-- Title -->
                    <div id="vr_editor_right_panel_title" class="row-right-panel">Scene controls</div>

                    <!-- Cogwheel options -->
                    <div id="row_cogwheel" class="row-right-panel">
                        <a type="button" id="optionsPopupBtn"
                           class="VrEditorOptionsBtnStyle mdc-button mdc-button--raised mdc-button--primary mdc-button--dense"
                           title="Edit scene options" data-mdc-auto-init="MDCRipple">
                            <i class="material-icons">settings</i>
                        </a>
                    </div>

                    <!-- 4 Buttons in a row -->
                    <div id="row2" class="row-right-panel">

                        <!--  Toggle Around Tour -->
                        <a type="button" id="toggle-tour-around-btn" data-toggle='off' data-mdc-auto-init="MDCRipple"
                           title="Auto-rotate 3D tour"
                           class="EditorTourToggleBtn mdc-button mdc-button--raised mdc-button--dense mdc-button--primary">
                            <i class="material-icons">rotate_90_degrees_ccw</i>
                        </a>

                        <!--  Dimensionality 2D 3D toggle -->
                        <a id="dim-change-btn" data-mdc-auto-init="MDCRipple"
                           title="Toggle between 2D mode (top view) and 3D mode (view with angle)."
                           class="EditorDimensionToggleBtn mdc-button mdc-button--raised mdc-button--dense mdc-button--primary">
                            2D
                        </a>

                        <!-- The button to start walking in the 3d environment -->
                        <div id="firstPersonBlocker" class="VrWalkInButtonStyle">
                            <a type="button" id="firstPersonBlockerBtn" data-toggle='on'
                               class="mdc-button mdc-button--dense mdc-button--raised mdc-button--primary"
                               title="Change camera to First Person View - Move: W,A,S,D,Q,E,R,F keys"
                               data-mdc-auto-init="MDCRipple">
                                VIEW
                            </a>
                        </div>

                        <!-- Third person button -->
                        <a type="button" id="thirdPersonBlockerBtn"
                           class="ThirdPersonVrWalkInButtonStyle mdc-button mdc-button--dense mdc-button--raised mdc-button--primary"
                           title="Change camera to Third Person View - Move: W,A,S,D,Q,E keys, Orientation: Mouse"
                           data-mdc-auto-init="MDCRipple">
                            <i class="material-icons">person</i>
                        </a>
                    </div>

                    <!--  Object Controls T,R,S -->
                    <div id="row3" class="row-right-panel" style="display:block">

                        <div style="padding-left:5px; padding-top:10px;"> Object controls</div>

                        <!-- Translate, Rotate, Scale Buttons -->
                        <div id="object-manipulation-toggle"
                             class="ObjectManipulationToggle mdc-typography" style="display: none;">
                            <!-- Translate -->
                            <input type="radio" id="translate-switch" name="object-manipulation-switch" value="translate" checked/>
                            <label for="translate-switch">Move</label>
                            <!-- Rotate -->
                            <input type="radio" id="rotate-switch" name="object-manipulation-switch" value="rotate" />
                            <label for="rotate-switch">Rotate</label>
                            <!-- Scale -->
                            <input type="radio" id="scale-switch" name="object-manipulation-switch" value="scale" />
                            <label for="scale-switch">Scale</label>
                        </div>
                    </div>

                    <!-- Numerical input for Move rotate scale -->
                    <div id="row4" class="row-right-panel">
                        <div id="numerical_gui-container" class="VrGuiContainerStyle mdc-typography mdc-elevation--z1"></div>
                    </div>

                    <!--  Axes resize -->
                    <div id="row5" class="row-right-panel" style="padding-top:12px; padding-left:5px; padding-bottom:10px">
                        <span class="mdc-typography--subheading1" style="font-size:12px">Axes controls size:</span>
                        <div id="axis-manipulation-buttons" class="AxisManipulationBtns mdc-typography" style="display: none;">
                            <a id="axis-size-decrease-btn" data-mdc-auto-init="MDCRipple" title="Decrease axes size" class="mdc-button mdc-button--raised mdc-button--dense mdc-button--primary">-</a>
                            <a id="axis-size-increase-btn" data-mdc-auto-init="MDCRipple" title="Increase axes size" class="mdc-button mdc-button--raised mdc-button--dense mdc-button--primary">+</a>
                        </div>
                    </div>

                    <!-- Hierarchy viewer -->
                    <div id="row6" class="row-right-panel">
                        <div class="HierarchyViewerStyle mdc-card" id="hierarchy-viewer-container">
                            <span class="hierarchyViewerTitle mdc-typography--subheading1 mdc-theme--text-primary-on-background" style="">Hierarchy Viewer</span>
                            <hr class="mdc-list-divider">
                            <ul class="mdc-list" id="hierarchy-viewer" style="max-height: 460px; overflow-y: scroll"></ul>
                        </div>
                    </div>

                </div>

                <!-- Pause rendering-->
                <div id="divPauseRendering" class="pauseRenderingDivStyle">
                    <a id="pauseRendering" class="mdc-button mdc-button--dense mdc-button--raised mdc-button--primary"
                       title="Pause rendering" data-mdc-auto-init="MDCRipple">
                        <i class="material-icons">play_arrow</i>
                    </a>
                </div>


                <!--  Make form to submit user changes -->
                <div id="progressWrapper" class="VrInfoPhpStyle" style="visibility: visible">
                    <div id="progress" class="ProgressContainerStyle mdc-theme--text-primary-on-light mdc-typography--subheading1">
                    </div>

                    <div id="result_download" class="result"></div>
                    <div id="result_download2" class="result"></div>
                </div>


                <!--  Asset browse Left panel  -->

                <!-- Open/Close button-->
                <a id="bt_close_file_toolbar" data-toggle='on' type="button"
                   class="AssetsToggleStyle AssetsToggleOn hidable mdc-button mdc-button--raised mdc-button--primary mdc-button--dense mdc-ripple-upgraded"
                   title="Toggle asset viewer" data-mdc-auto-init="MDCRipple">
                    <i class="material-icons">menu</i>
                </a>

                <!-- The panel -->
                <div class="filemanager" id="assetBrowserToolbar">

                    <!-- Categories of assets -->
                    <div id="assetCategTab">
                        <button id="allAssetsViewBt" class="tablinks active">All</button>
                    </div>

                    <!-- Search bar -->
                    <div class="mdc-textfield search" data-mdc-auto-init="MDCTextfield" style="margin-top:0px; height:40px;margin-left:10px;">
                        <input type="search" class="mdc-textfield__input mdc-typography--subheading2" placeholder="Find...">
                        <i class="material-icons mdc-theme--text-primary-on-background">search</i>
                        <div class="mdc-textfield__bottom-line"></div>
                    </div>

                    <ul id="filesList" class="data mdc-list mdc-list--two-line mdc-list--avatar-list"></ul>

                    <!-- ADD NEW ASSET FROM ASSETS LIST -->
                    <a id="addNewAssetBtnAssetsList"
                       style="" class="addNewAsset3DEditor" data-mdc-auto-init="MDCRipple"
                       title="Add new private asset"
                       href="<?php echo esc_url( get_permalink($newAssetPage[0]->ID) .
                           $parameter_pass . $project_id . '&vrodos_scene=' .  $current_scene_id. '&scene_type=scene&preview=false'); ?>">
                        <i class="material-icons" style="cursor: pointer; font-size:54px; color:orangered; ">add_circle</i>
                    </a>

                </div>
        
                <?php
                    require( plugin_dir_path( __DIR__ ).'/templates/vrodos-edit-3D-scene-Popups.php');
                 ?>
                

                <!--  Open/Close Scene list panel-->
                <a id="scenesList-toggle-btn" data-toggle='on' type="button" class="scenesListToggleStyle scenesListToggleOn hidable mdc-button mdc-button--raised mdc-button--primary mdc-button--dense" title="Toggle scenes list" data-mdc-auto-init="MDCRipple">
                    <i class="material-icons" style="margin:auto">menu</i>
                </a>

                <!-- Scenes Credits and Main menu List -->
                <div id="scenesInsideVREditor" class="" style="">
            
                    <?php $custom_query = getProjectScenes($allScenePGameID);?>
            
                    <?php if ( $custom_query->have_posts() ) :
                        while ( $custom_query->have_posts() ) :
                    
                            $custom_query->the_post();
                            $scene_id = get_the_ID();
                            $scene_title = get_the_title();
                            $scene_desc = get_the_content();
                            $is_regional = get_post_meta($scene_id,'vrodos_isRegional', true);
                            $current_card_bg = $current_scene_id == $scene_id ? 'mdc-theme--primary-light-bg' : '';
                            $scene_type = get_post_meta( $scene_id, 'vrodos_scene_metatype', true );
                    
                            $default_scene = get_post_meta( $scene_id, 'vrodos_scene_default', true );
                    
                            //create permalink depending the scene yaml category
                            $edit_scene_page_id = ( $scene_type == 'scene' ? $editscenePage[0]->ID : $editscene2DPage[0]->ID);
                    
                            if($scene_type == 'sceneExam2d' ||  $scene_type == 'sceneExam3d'){
                                $edit_scene_page_id = $editsceneExamPage[0]->ID;
                            }
                    
                            $url_redirect_delete_scene = get_permalink($edit_scene_page_id) . $parameter_Scenepass .
                                $scene_id . '&vrodos_game=' . $project_id . '&scene_type=' . $scene_type;
                    
                            if($scene_type !== 'menu' && $scene_type !== 'credits') {
                                if ($default_scene) {
                                    echo '<script>';
                                    echo 'var url_scene_redirect="' . $url_redirect_delete_scene . '";'; // not possible with escape
                                    echo '</script>';
                                }
                            }
                    
                            $edit_page_link = esc_url( $url_redirect_delete_scene );
                    
                            ?>

                            <div id="scene-<?php echo $scene_id; ?>" class="SceneCardContainer">
                                <div class="sceneTab mdc-card mdc-theme--background <?php echo $current_card_bg;?> ">
                                    <div class="SceneThumbnail">
                                        <div class="sceneDisplayBlock mdc-theme--primary-bg CenterContents">
                                            <a href="<?php echo $edit_page_link; ?>">
                                                <?php if(has_post_thumbnail($scene_id)) {
                                                    echo get_the_post_thumbnail( $scene_id );
                                                } else { ?>
                                                    <i class="landscapeIcon material-icons mdc-theme--text-icon-on-background">landscape</i>
                                                <?php } ?>
                                            </a>

                                        </div>
                                    </div>

                                    <section class="cardTitleDeleteWrapper"
                                             style="background:<?php echo $scene_id == $_GET['vrodos_scene'] ? 'lightgreen':'';?>">
                         <span id="<?php echo $scene_id;?>-title"
                               class="cardTitle mdc-card__title mdc-typography--title"
                               title="<?php echo $scene_title;?>">
                             <a class="mdc-theme--primary"
                                href="<?php echo $edit_page_link; ?>">
                                 <?php echo $scene_title; ?>
                             </a>
                             <?php if ($is_regional) { ?>
                                 <i title="Regional scene"
                                    class="material-icons AlignIconToBottom CursorDefault mdc-theme--primary"
                                    style="float: right;">
                                     public
                                 </i>
                             <?php } ?>
                         </span>

                            <!-- Delete button for non-default scenes -->
                            <?php if (!$default_scene) { ?>
                                <a id="deleteSceneBtn"
                                   data-mdc-auto-init="MDCRipple"
                                   title="Delete scene"
                                   data-sceneid = "<?php echo $scene_id; ?>"
                                   class="cardDeleteIcon mdc-button mdc-button--compact mdc-card__action">
                                    <i class="material-icons deleteIconMaterial">
                                        delete_forever
                                    </i>
                                </a>
                            <?php } ?>

                                    </section>
                                </div>
                            </div>
                        <?php
                        endwhile;
                    endif;
                    ?>

                    <!-- Analytics key input card -->
                    <?php
                    require( plugin_dir_path( __DIR__ ) . '/templates/vrodos-edit-3D-scene-Analytics.php' );
                    ?>

                    <!--ADD NEW SCENE card for all but Energy project that has fixed scenes-->
                    <?php if($project_type !== "Energy") { ?>

                        <div id="add-new-scene-card" class="SceneCardContainer">

                            <form name="create_new_scene_form" action="" id="create_new_scene_form"
                                  method="POST" enctype="multipart/form-data">
                        
                                <?php wp_nonce_field('post_nonce', 'post_nonce_field'); ?>

                                <input type="hidden" name="submitted" id="submitted" value="true" />

                                <div class="mdc-card mdc-theme--secondary-light-bg">

                                    <section class="mdc-card__primary" style="padding:8px;">
                                        <!--Title-->
                                        <div class="mdc-textfield FullWidth" data-mdc-auto-init="MDCTextfield"
                                             style="padding:0px; height:25px;">
                                            <input id="title" name="scene-title" type="text"
                                                   class="mdc-textfield__input mdc-theme--text-primary-on-secondary-light cardNewSceneInput"
                                                   aria-controls="title-validation-msg" required minlength="3" maxlength="25">
                                            <label for="title" class="mdc-textfield__label" style="font-size:12px;">Enter a scene title</label>
                                            <div class="mdc-textfield__bottom-line"></div>
                                        </div>
                                    </section>

                                    <section class="mdc-card__primary" style="display:none">
                                        <!-- Chemistry has 3 new possible new Scene Types -->
                                        <?php
                                        if($project_type === "Chemistry"){
                                    
                                            $chemistryTypes = new stdClass();
                                            $chemistryTypes->label = ['Molecule Naming','Molecule Construction','Lab'];
                                            $chemistryTypes->id = ['sceneType2DRadio','sceneType3DRadio','sceneTypeLabRadio'];
                                            $chemistryTypes->value = ['2d','3d','lab'];
                                    
                                            ?>
                                            <label class="mdc-typography--subheading2 mdc-theme--text-primary">Scene type</label>
                                            <ul>
                                                <?php for ($i=0; $i<3; $i++){?>
                                                    <li class="mdc-form-field">
                                                        <div class="mdc-radio">
                                                            <input class="mdc-radio__native-control" type="radio"
                                                                   id="<?php echo $chemistryTypes->id[$i];?>"
                                                                   name="sceneTypeRadio"
                                                                   value="<?php echo $chemistryTypes->value[$i];?>"
                                                            >
                                                            <div class="mdc-radio__background">
                                                                <div class="mdc-radio__outer-circle"></div>
                                                                <div class="mdc-radio__inner-circle"></div>
                                                            </div>
                                                        </div>
                                                        <label id="<?php echo $chemistryTypes->id[$i];?>-label"
                                                               for="<?php echo $chemistryTypes->id[$i];?>" style="padding: 0; margin: 0;">
                                                            <?php echo $chemistryTypes->label[$i];?>
                                                        </label>
                                                    </li>
                                                    &nbsp;
                                                <?php } ?>

                                            </ul>
                                        <?php } ?>

                                    </section>

                                    <!-- ADD NEW SCENE BUTTON -->
                                    <section class="mdc-card__primary" style="padding:0px;">
                                        <button style="float:right; background-image:none;" class="mdc-button--raised mdc-button mdc-button-primary"
                                                data-mdc-auto-init="MDCRipple" type="submit">
                                            ADD NEW
                                        </button>
                                    </section>

                                </div>
                            </form>
                        </div>
            
                    <?php } ?>

                    <!--Delete Scene Dialog-->
                    <aside id="delete-dialog"
                           class="mdc-dialog"
                           role="alertdialog"
                           style="z-index: 1000;"
                           aria-labelledby="Delete scene dialog"
                           aria-describedby="You can delete the selected from the current game project"
                           data-mdc-auto-init="MDCDialog">
                        <div class="mdc-dialog__surface">
                            <header class="mdc-dialog__header">
                                <h2 id="delete-dialog-title" class="mdc-dialog__header__title">
                                    Delete scene?
                                </h2>
                            </header>
                            <section id="delete-dialog-description" class="mdc-dialog__body">
                                Are you sure you want to delete this scene? There is no Undo functionality once you delete it.
                            </section>

                            <section id="delete-scene-dialog-progress-bar" class="CenterContents mdc-dialog__body" style="display: none;">
                                <h3 class="mdc-typography--title">Deleting...</h3>

                                <div class="progressSlider">
                                    <div class="progressSliderLine"></div>
                                    <div class="progressSliderSubLine progressIncrease"></div>
                                    <div class="progressSliderSubLine progressDecrease"></div>
                                </div>
                            </section>

                            <footer class="mdc-dialog__footer">
                                <a class="mdc-button mdc-dialog__footer__button--cancel mdc-dialog__footer__button"
                                   id="deleteSceneDialogCancelBtn">Cancel</a>
                                <a class="mdc-button mdc-button--primary mdc-dialog__footer__button mdc-button--raised"
                                   id="deleteSceneDialogDeleteBtn">Delete</a>
                            </footer>
                        </div>
                        <div class="mdc-dialog__backdrop"></div>
                    </aside>
                </div>   <!-- Scenes List Div -->

            </div>   <!--   VR DIV   -->



            <?php
                // Add sceneType variable in js envir
                $sceneType = get_post_meta($_GET['vrodos_scene'], "vrodos_scene_environment");
                if (count($sceneType)>0) {
                    echo '<script>';
                    echo 'envir.sceneType="' . $sceneType[0] . '";';
                    echo '</script>';
                }
    
                // Options dialogue
                require( plugin_dir_path( __DIR__ ) .  '/templates/vrodos-edit-3D-scene-OptionsDialogue.php' );
        
                // Information for Wind Energy scenes
                sceneDetailsInfo($project_type);
           ?>
      </div>

       <?php
         // Panels 2,3,4 are Analytics for Chemistry and WindEnergy projects
         panelsAnalytics($project_type, $project_saved_keys);
       ?>
    </div>
    
    
    <!-- Scripts part 1: The GUIs -->
    <script type="text/javascript">
    
        var mdc = window.mdc;
        var MDCSelect = mdc.select.MDCSelect;
        
        mdc.autoInit();
        
        // Delete scene dialogue
        var deleteDialog = new mdc.dialog.MDCDialog(document.querySelector('#delete-dialog'));
        deleteDialog.focusTrap_.deactivate();
        
        // Compile dialogue
        var compileDialog = new mdc.dialog.MDCDialog(document.querySelector('#compile-dialog'));
        compileDialog.focusTrap_.deactivate();
    
        // Project Analytics
        loadAnalyticsTab(projectId, scene_id, project_keys, game_type, user_email, current_user_id, energy_stats);
    
        // Less top margin if not Admin
        if (!isUserAdmin)
            document.getElementById("vr_editor_main_div").style.top = "28px";
    
        // load asset browser with data
        jQuery(document).ready(function(){
            vrodos_fetchSceneAssetsAjax(isAdmin, projectSlug, urlforAssetEdit, projectId);
    
            // make asset browser draggable
            jQuery('#assetBrowserToolbar').draggable({cancel : 'ul'});
        });
        
    </script>


    <!--  Part 3: Start 3D with Javascript   -->
    <script>
        // all 3d dom
        let container_3D_all = document.getElementById( 'vr_editor_main_div' );

        // Selected object name
        var selected_object_name = '';

        // Add 3D gui widgets to gui container_3D_all
        let guiContainer = document.getElementById('numerical_gui-container');
        guiContainer.appendChild(controlInterface.translate.domElement);
        guiContainer.appendChild(controlInterface.rotate.domElement);
        guiContainer.appendChild(controlInterface.scale.domElement);

        // camera, scene, renderer, lights, stats, floor, browse_controls are all children of Environmentals instance
        var envir = new vrodos_3d_editor_environmentals(container_3D_all);
        envir.is2d = true;

        // Controls with axes (Transform, Rotate, Scale)
        var transform_controls = new THREE.TransformControls( envir.renderer.domElement );
        transform_controls.name = 'myTransformControls';

        //var firstPersonBlocker = document.getElementById('firstPersonBlocker');
        var firstPersonBlockerBtn = document.getElementById('firstPersonBlockerBtn');

        // Hide (right click) panel
        hideObjectPropertiesPanels();

        // When Dat.Gui changes update php, javascript vars and transform_controls
        controllerDatGuiOnChange();

        // Load all 3D including Steve
        let loaderMulti;

        // id of animation frame is used for canceling animation when dat-gui changes
        var id_animation_frame;

        var resources3D  = [];// This holds all the resources to load. Generated in Parse JSON

        // Load Manager
        // Make progress bar visible
        jQuery("#progress").get(0).style.display = "block";

        let manager = new THREE.LoadingManager();

        manager.onProgress = function ( item, loaded, total ) {
            //console.log(item, loaded, total);
            if (total >= 2)
                document.getElementById("result_download").innerHTML = "Loading " + (loaded-1) + " out of " + (total-2);
        };

        // When all are finished loading place them in the correct position
        manager.onLoad = function () {

            jQuery("#progressWrapper").get(0).style.visibility= "hidden";

            // Get the last inserted object
            let name = Object.keys(resources3D).pop();
            let trs_tmp = resources3D[name]['trs'];
            let objItem = envir.scene.getObjectByName(name);

            // In the case the last asset is missing then put controls on the camera
            if (typeof objItem === "undefined"){
                name = 'avatarYawObject';
                trs_tmp = resources3D[name]['trs'];
                objItem = envir.scene.getObjectByName(name);
            } else {
                
                transform_controls.attach(objItem);
                // highlight
                envir.outlinePass.selectedObjects = [objItem];
                envir.scene.add(transform_controls);

                if (selected_object_name != 'avatarYawObject') {
                    transform_controls.object.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1],
                                                                        trs_tmp['translation'][2]);
                    transform_controls.object.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1],
                                                                trs_tmp['rotation'][2]);
                    transform_controls.object.scale.set(trs_tmp['scale'], trs_tmp['scale'], trs_tmp['scale']);
                }

                jQuery('#object-manipulation-toggle').show();
                jQuery('#axis-manipulation-buttons').show();
                jQuery('#double-sided-switch').show();
                showObjectPropertiesPanel(transform_controls.getMode());

                selected_object_name = name;

                transform_controls.setMode("rottrans");
                
                let sizeT = 1;
                // Resize controls based on object size
                if (selected_object_name != 'avatarYawObject') {
                    let dims = findDimensions(transform_controls.object);
                    sizeT = Math.max(...dims);
                    jQuery("#removeAssetBtn").show();
                    
                    // 6 is rotation
                    transform_controls.children[6].handleGizmos.XZY[0][0].visible = true;

                    if (selected_object_name.includes("lightSun") || selected_object_name.includes("lightLamp") ||
                        selected_object_name.includes("lightSpot")){
                        // ROTATE GIZMO: Sun and lamp can not be rotated
                        transform_controls.children[6].children[0].children[1].visible = false;
                    }
                } else {
                    transform_controls.children[6].handleGizmos.XZY[0][0].visible = false;
                    jQuery("#removeAssetBtn").hide();
                }
                transform_controls.setSize( sizeT > 1 ? sizeT : 1 );
            }

            // Find scene dimension in order to configure camera in 2D view (Y axis distance)
            findSceneDimensions();
            envir.updateCameraGivenSceneLimits();

            envir.setHierarchyViewer();

            // Set Target light for Spots
            for (let n in resources3D) {
                (function (name) {
                    if (resources3D[name]['categoryName'] === 'lightSpot') {
                        let lightSpot = envir.scene.getObjectByName(name);
                        lightSpot.target = envir.scene.getObjectByName(resources3D[name]['lighttargetobjectname']);
                    }
                })(n);
            }

        }; // End of manager
    </script>

    <!-- Load Scene - javascript var resources3D[] -->
    <?php
        require( plugin_dir_path( __DIR__ ).'/templates/vrodos-edit-3D-scene-ParseJSON.php' );
        /* Initial load as php */
        $formRes = new ParseJSON($upload_url);
        $formRes->init($sceneToLoad);
    ?>

    <script>
        loaderMulti = new VRodos_LoaderMulti();

        loaderMulti.load(manager, resources3D, pluginPath);
        //vrodos_fetchAndLoadMultipleAssetsAjax(manager, resources3D, pluginPath);

        // Only in Undo redo as javascript not php!
        function parseJSON_LoadScene(scene_json){

            resources3D = parseJSON_javascript(scene_json, uploadDir);

            // CLEAR SCENE
            let preserveElements = ['myAxisHelper', 'myGridHelper', 'avatarYawObject', 'myTransformControls'];

            for (let i = envir.scene.children.length - 1; i >=0 ; i--){
                if (!preserveElements.includes(envir.scene.children[i].name))
                    envir.scene.remove(envir.scene.children[i]);
            }

            envir.setHierarchyViewer();

            transform_controls = envir.scene.getObjectByName('myTransformControls');
            transform_controls.attach(envir.scene.getObjectByName("avatarYawObject"));

            jQuery("#removeAssetBtn").hide();

            loaderMulti = new VRodos_LoaderMulti();
            loaderMulti.load(manager, resources3D);
        }

        //--- initiate PointerLockControls ---------------
        initPointerLock();

        // ANIMATE
        function animate()
        {
            if(isPaused) {
                
                return;
            } else  {}

            id_animation_frame = requestAnimationFrame( animate );

            // Select the proper camera (orbit, or avatar, or thirdPersonView)
            let curr_camera = avatarControlsEnabled ?
                (envir.thirdPersonView ? envir.cameraThirdPerson : envir.cameraAvatar) : envir.cameraOrbit;

            // Render it
            envir.renderer.render( envir.scene, curr_camera);
            
            // Label is for setting labels to objects
            envir.labelRenderer.render( envir.scene, curr_camera);

            // Animation
            if (envir.flagPlayAnimation) {
                if (envir.animationMixers.length > 0) {
                    let new_time = envir.clock.getDelta();
                    for (let i = 0; i < envir.animationMixers.length; i++) {
                        envir.animationMixers[i].update(new_time);
                    }
                }
            }

            if (envir.isComposerOn)
                envir.composer.render();
            
            // Update it
            updatePositionsAndControls();
        }

        // UPDATE
        function updatePositionsAndControls()
        {
            envir.orbitControls.update();

            updatePointerLockControls();

            transform_controls.update(); // update the axis controls based on the browse controls
            //envir.stats.update();

            // Now update the translation and rotation input texts
            if (transform_controls.object) {

                for (let i in controlInterface.translate.__controllers)
                    controlInterface.translate.__controllers[i].updateDisplay();

                for (let i in controlInterface.rotate.__controllers)
                    controlInterface.rotate.__controllers[i].updateDisplay();

                for (let i in controlInterface.scale.__controllers)
                    controlInterface.scale.__controllers[i].updateDisplay();

                updatePositionsPhpAndJavsFromControlsAxes();
            }
        }

        // For autosave after each action
        var mapActions = {}; // You could also use an array

        animate();

        // Set all buttons actions
        loadButtonActions();
    </script>
<?php } ?>

<?php get_footer(); ?>
