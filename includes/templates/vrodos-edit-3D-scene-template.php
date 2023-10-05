<?php

$perma_structure = (bool)get_option('permalink_structure');
$parameter_pass = $perma_structure ? '?vrodos_game=' : '&vrodos_game=';
$parameter_Scenepass = $perma_structure ? '?vrodos_scene=' : '&vrodos_scene=';
$parameter_assetpass = $perma_structure ? '?vrodos_asset=' : '&vrodos_asset=';

// Load VR_Editor Scripts
function vrodos_load_vreditor_scripts()
{
    wp_enqueue_script('jquery-ui-draggable');
    wp_enqueue_script( 'vrodos_scripts' );

    wp_enqueue_script( 'vrodos_load141_threejs' );
    wp_enqueue_script( 'vrodos_load141_FontLoader' );
    wp_enqueue_script( 'vrodos_load141_TextGeometry' );

    wp_enqueue_script( 'vrodos_load141_CSS2DRenderer' );
    wp_enqueue_script( 'vrodos_load141_CopyShader' );
    wp_enqueue_script( 'vrodos_load141_FXAAShader' );
    wp_enqueue_script( 'vrodos_load141_EffectComposer' );
    wp_enqueue_script( 'vrodos_load141_RenderPass' );
    wp_enqueue_script( 'vrodos_load141_OutlinePass' );
    wp_enqueue_script( 'vrodos_load141_ShaderPass' );

    wp_enqueue_script( 'vrodos_load141_RGBELoader' );
    wp_enqueue_script( 'vrodos_load141_GLTFLoader' );
    wp_enqueue_script( 'vrodos_inflate' );

    // Timestamp script
    wp_enqueue_script( 'vrodos_scripts' );

    // Hierarchy Viewer
    wp_enqueue_script( 'vrodos_HierarchyViewer' );

    wp_enqueue_script( 'vrodos_load87_datgui' );
    wp_enqueue_script( 'vrodos_load141_OrbitControls' );
    wp_enqueue_script( 'vrodos_load141_TransformControls' );
    wp_enqueue_script( 'vrodos_load141_PointerLockControls' );

    wp_enqueue_script( 'vrodos_load87_sceneexporterutils' );
    wp_enqueue_script( 'vrodos_load87_scene_importer_utils' );
    wp_enqueue_script( 'vrodos_load87_sceneexporter' );

    // Colorpicker for the lights
    wp_enqueue_script('vrodos_jscolorpick');

    wp_enqueue_style('vrodos_datgui');
    wp_enqueue_style('vrodos_3D_editor');
    wp_enqueue_style('vrodos_3D_editor_browser');

    wp_enqueue_script('vrodos_html2canvas');
}
add_action('wp_enqueue_scripts', 'vrodos_load_vreditor_scripts' );


function vrodos_load_custom_functions_vreditor(){
    wp_enqueue_script('vrodos_3d_editor_environmentals');
    wp_enqueue_script('vrodos_jscolorpick');
    wp_enqueue_script('vrodos_keyButtons');
    wp_enqueue_script('vrodos_rayCasters');
    wp_enqueue_script('vrodos_auxControlers');
    wp_enqueue_script('vrodos_BordersFinder');
    wp_enqueue_script('vrodos_LightsPawn_Loader');
    wp_enqueue_script('vrodos_LoaderMulti');
    wp_enqueue_script('vrodos_movePointerLocker');
    wp_enqueue_script('vrodos_addRemoveOne');
    wp_enqueue_script('vrodos_3d_editor_buttons_drags');
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

    // This holds all the 3D resources to load. Generated in Parse JSON.
    var resources3D  = [];

    // For autosave after each action
    var mapActions = {}; // You could also use an array

    var showPawnPositions = "false";
</script>


<?php
// resources3D class
require( plugin_dir_path( __DIR__ ).'/templates/vrodos-edit-3D-scene-ParseJSON.php' );

// Define current path of plugin
$pluginpath = str_replace('\\','/', dirname(plugin_dir_url( __DIR__  )) );

// wpcontent/uploads/
$upload_url = wp_upload_dir()['baseurl'];

$upload_dir = str_replace('\\','/',wp_upload_dir()['basedir']);

// Scene
$current_scene_id = isset($_GET['vrodos_scene']) ? sanitize_text_field( intval( $_GET['vrodos_scene'] )) : null;

// Project
$project_id    = isset($_GET['vrodos_game']) ? sanitize_text_field( intval( $_GET['vrodos_game'] ) ) : null;
$project_post  = get_post($project_id);
$projectSlug   = $project_post->post_name;

$project_type = $project_id ? vrodos_return_project_type($project_id)->string : null;

// Get project type icon
$project_type_icon = $project_id ? vrodos_return_project_type($project_id)->icon : null;

// Get Joker project id
$joker_project_id = $project_type ? get_page_by_path( strtolower($project_type).'-joker', OBJECT, 'vrodos_game' )->ID : null;

// Archaeology only
if ($project_type === 'Archaeology') {
    $doorsAllInfo = vrodos_get_all_doors_of_project_fastversion($project_id);
}

// Get scene content from post
$scene_post = get_post($current_scene_id);

// If empty load default scenes if no content. Do not put esc_attr, crashes the universe in 3D.
$sceneJSON = $scene_post->post_content ? $scene_post->post_content :
    vrodos_getDefaultJSONscene(strtolower($project_type));

// Load resources 3D
$SceneParserPHP = new ParseJSON($upload_url);
$SceneParserPHP->init($sceneJSON);

$sceneTitle = $scene_post->post_name;

// Front End or Back end
$isAdmin = is_admin() ? 'back' : 'front';

$allProjectsPage = vrodos_getEditpage('allgames');
$newAssetPage = vrodos_getEditpage('asset');
$editscenePage = vrodos_getEditpage('scene');

$videos = vrodos_getVideoAttachmentsFromMediaLibrary();

// for vr_editor
$urlforAssetEdit = esc_url( get_permalink($newAssetPage[0]->ID) . $parameter_pass . $project_id .
    '&vrodos_scene=' .$current_scene_id . '&vrodos_asset=' );

// User data
$current_user = wp_get_current_user();
if ($current_user->exists()) {
    $user_data = get_userdata( get_current_user_id() );
    $user_email = $user_data->user_email;
}


// Shift vars to Javascript side
echo '<script>';
echo 'var pluginPath="'.$pluginpath.'";';
echo 'var uploadDir="'.wp_upload_dir()['baseurl'].'";';
echo 'let projectId="'.$project_id.'";';
echo 'let projectSlug="'.$projectSlug.'";';
echo 'let isAdmin="'.$isAdmin.'";';
echo 'let isUserAdmin="'.current_user_can('administrator').'";';
echo 'let urlforAssetEdit="'.$urlforAssetEdit.'";';
echo 'let scene_id ="'.$current_scene_id.'";';
echo 'let game_type ="'.strtolower($project_type).'";';
echo 'user_email = "'.$user_email.'";';
echo 'current_user_id = "'.get_current_user_id().'";';
echo 'let siteurl="'.site_url().'";';

echo '</script>';


// Get 'parent-game' taxonomy with the same slug as Game (in order to show scenes that belong here)
$allScenePGame = get_term_by('slug', $projectSlug, 'vrodos_scene_pgame');

$parent_project_id_as_term_id = $allScenePGame ? $allScenePGame->term_id : null;

// COMPILE Ajax
$thepath = $pluginpath . '/js_libs/ajaxes/vrodos_request_compile.js';

wp_enqueue_script( 'ajax-script_compile', $thepath, array('jquery') );

wp_localize_script( 'ajax-script_compile',
    'my_ajax_object_compile',

    array( 'ajax_url' => admin_url( 'admin-ajax.php'),
        'projectId' => $project_id,
        'slug' => $projectSlug,
        'sceneId' => $current_scene_id
    )
);


// DELETE SCENE AJAX
wp_enqueue_script( 'ajax-script_deletescene', $pluginpath . '/js_libs/ajaxes/delete_scene.js', array('jquery') );
wp_localize_script( 'ajax-script_deletescene', 'my_ajax_object_deletescene',
    array( 'ajax_url' => admin_url( 'admin-ajax.php'))
);

// Asset Browser
wp_enqueue_script( 'ajax-script_filebrowse', $pluginpath.'/js_libs/vrodos_assetBrowserToolbar.js', array('jquery') );
wp_localize_script( 'ajax-script_filebrowse', 'my_ajax_object_fbrowse', array( 'ajax_url' => admin_url( 'admin-ajax.php' ) ) );

// Save scene
wp_enqueue_script( 'ajax-script_savescene', $pluginpath.'/js_libs/ajaxes/vrodos_save_scene_ajax.js', array('jquery') );
wp_localize_script( 'ajax-script_savescene', 'my_ajax_object_savescene',
    array( 'ajax_url' => admin_url( 'admin-ajax.php' ), 'scene_id' => $current_scene_id )
);

// Upload Image
wp_enqueue_script( 'ajax-script_uploadimage', $pluginpath.'/js_libs/ajaxes/uploadimage.js', array('jquery') );
wp_localize_script( 'ajax-script_uploadimage', 'my_ajax_object_uploadimage',
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



//==========================================

if ($project_type === 'Archaeology') {
    $single_lowercase = "tour";
    $single_first = "Tour";
}
else {
    $single_lowercase = "project";
    $single_first = "Project";
}

// ADD NEW SCENE
if(isset($_POST['submitted']) && isset($_POST['post_nonce_field']) && wp_verify_nonce($_POST['post_nonce_field'], 'post_nonce')) {

    $newSceneType = $_POST['sceneTypeRadio'] ?? null;

    $sceneMetaType = 'scene'; //default 'scene' MetaType (3js)
    $game_type_chosen_slug = '';

    $default_json = '';
    $thegameType = wp_get_post_terms($project_id, 'vrodos_game_type');


    $newscene_yaml_tax = get_term_by('slug', 'wonderaround-yaml', 'vrodos_scene_yaml');
    switch ($thegameType[0]->slug) {
        case 'archaeology_games':
        case 'virtualproduction_games':
        case 'vrexpo_games':
            $game_type_chosen_slug = $thegameType[0]->slug;
            $default_json = vrodos_getDefaultJSONscene(strtolower($project_type));
            break;

    }

    $scene_taxonomies = array(
        'vrodos_scene_pgame' => array(
            $parent_project_id_as_term_id,
        ),
        'vrodos_scene_yaml' => array(
            $newscene_yaml_tax->term_id,
        )
    );

    $scene_metas = array(
        'vrodos_scene_default' => 0,
        'vrodos_scene_caption' => esc_attr(strip_tags($_POST['scene-caption'] ?? null))
    );

    // REGIONAL SCENE EXTRA TYPE FOR ENERGY GAMES
    $isRegional = 0; //default value

    // Add the final MetaType of the Scene
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

        $edit_scene_page_id = $editscenePage[0]->ID;

        $loadMainSceneLink = get_permalink($edit_scene_page_id) . $parameter_Scenepass . $scene_id . '&vrodos_game=' . $project_id . '&scene_type=' . $sceneMetaType;
        //wp_redirect( $loadMainSceneLink );
        echo("<script>location.href = '".$loadMainSceneLink."'</script>");
        exit;
    }
}

$goBackTo_AllProjects_link = esc_url( get_permalink($allProjectsPage[0]->ID));

// Make the header of the page
wp_head();
//get_header();

?>

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

        <!-- Panel 1 is the vr environment -->
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

                        <!-- View Json code UI -->
                        <a id="toggleViewSceneContentBtn" data-toggle='off' type="button"
                           class="mdc-theme--secondary mdc-theme--text-hint-on-light"
                           title="View json of scene"
                           style="width:70px; left: calc(60% + 112px); position:absolute; bottom: 0; cursor: pointer; text-decoration: none;">
                            <i class="material-icons" style="font-size: 11pt">visibility_off</i> JSON
                        </a>
                    </div>

                    <!-- Compile Button -->
                    <a id="compileGameBtn"
                       class="mdc-button mdc-button--raised mdc-theme--text-primary-on-dark mdc-theme--secondary-bg w3-display-right"
                       data-mdc-auto-init="MDCRipple"
                       title="When you are finished compile the <?php echo $single_lowercase; ?> into a standalone binary">
                        Build Project
                    </a>

                </div>
                <!--Compile Dialogue html-->
                <?php require( plugin_dir_path( __DIR__ ) .  '/templates/vrodos-edit-3D-scene-CompileDialogue.php' ); ?>

                <!-- Scene JSON content TextArea display and set input field -->
                <div id="sceneJsonContent" >
                      <textarea id="vrodos_scene_json_input"
                                name="vrodos_scene_json_input"
                                title="vrodos_scene_json_input"
                      ><?php echo json_encode(json_decode($sceneJSON), JSON_PRETTY_PRINT ); ?>
                  </textarea>
                </div>



                <!-- Lights -->
                <div class="environmentBar hidable">

                    <div class="lightpawnbutton" data-lightPawn="Pawn" draggable="true">
                        <header draggable="false" class="notdraggable">Actor</header>
                        <img draggable="false" class="lighticon notdraggable" style="padding:2px; margin-top:0"
                             src="<?php echo $pluginpath?>/images/lights/pawn.png"/>
                    </div>

                    <div style="width:1px;height:45px;background-color:white;display:inline-block;float:left;margin:0;padding:0;margin-left:2px;margin-right:2px">
                    </div>

                    <div class="lightpawnbutton" data-lightPawn="Sun" draggable="true" title="When adding a Sun, an automatic horizon is added to the scene, negating any Background color you have selected.">
                        <header draggable="false" class="notdraggable">Sun</header>
                        <img draggable="false" class="lighticon notdraggable"
                             src="<?php echo $pluginpath?>/images/lights/sun.png"/>
                    </div>

                    <div class="lightpawnbutton" data-lightPawn="Lamp" draggable="true">
                        <header draggable="false" class="notdraggable">Lamp</header>
                        <img draggable="false" class="lighticon notdraggable"
                             src="<?php echo $pluginpath?>/images/lights/lamp.png"/>
                    </div>

                    <div class="lightpawnbutton" data-lightPawn="Spot" draggable="true">
                        <header draggable="false" class="notdraggable">Spot</header>
                        <img draggable="false" class="lighticon notdraggable"
                             src="<?php echo $pluginpath?>/images/lights/spot.png"/>
                    </div>

                    <div class="lightpawnbutton" data-lightPawn="Ambient" draggable="true">
                        <header draggable="false" class="notdraggable" style="font-size: 7pt">Ambient</header>
                        <img draggable="false" class="lighticon notdraggable"
                             src="<?php echo $pluginpath?>/images/lights/ambient_light.png"/>
                    </div>

                    <!-- Set RendererToneMapping  -->
                    <div id="rendererToneMappingDiv"
                         class="mdc-textfield mdc-textfield--textarea mdc-textfield--upgraded"
                         style="width:60px; margin:0; padding:0; height:42px; background: rgba(255,255,255,0.5);float:left;display:block">

                        <label for="rendererToneMapping"
                               class=""
                               style="font-size: 9pt;padding-left: 5px;margin:0;">Tone</label>

                        <input type="number" id="rendererToneMapping" name="rendererToneMapping"
                               min="0" max="2" step="0.01"
                               style="width:45px;font-size:10px;min-height: 10px;margin-left:5px;height:20px;margin-bottom:4px;padding:0;"
                               onchange="changeRendererToneMapping(this.value);">
                    </div>

                    <div style="width:1px;height:45px;background-color:white;display:inline-block;float:left;padding:0;margin: 0 2px;">
                    </div>


                    <div class="environmentButton">
                        <!--  Dimensionality 2D 3D toggle -->
                        <a id="dim-change-btn" data-mdc-auto-init="MDCRipple"
                           title="Toggle between 2D mode (top view) and 3D mode (view with angle)."
                           class="EditorToolbarBtnStyle mdc-button mdc-button--raised mdc-button--dense mdc-button--primary">
                            2D
                        </a>
                    </div>

                    <!-- The button to start walking in the 3d environment -->
                    <div class="environmentButton">
                        <div id="firstPersonBlocker">
                            <a type="button" id="firstPersonBlockerBtn" data-toggle='on'
                               class="EditorToolbarBtnStyle mdc-button mdc-button--dense mdc-button--raised mdc-button--primary"
                               title="Change camera to First Person View - Move: W,A,S,D,Q,E,R,F keys"
                               data-mdc-auto-init="MDCRipple">
                                <i class="material-icons">person</i>
                            </a>
                        </div>
                    </div>

                    <!--  Toggle Around Tour -->
                    <div class="environmentButton">
                        <a type="button" id="toggle-tour-around-btn" data-toggle='off' data-mdc-auto-init="MDCRipple"
                           title="Auto-rotate 3D tour"
                           class="EditorToolbarBtnStyle mdc-button mdc-button--raised mdc-button--dense mdc-button--primary">
                            <i class="material-icons">rotate_90_degrees_ccw</i>
                        </a>
                    </div>


                    <!-- Cogwheel options -->
                    <div class="environmentButton">
                        <div id="row_cogwheel" class="row-right-panel">
                            <a type="button" id="optionsPopupBtn"
                               class="EditorToolbarBtnStyle mdc-button mdc-button--raised mdc-button--primary mdc-button--dense"
                               title="Edit scene options" data-mdc-auto-init="MDCRipple">
                                <i class="material-icons">settings</i>
                            </a>
                        </div>
                    </div>

                    <div class="environmentButton">
                        <input hidden type="checkbox" id="sceneEnvironmentTexture" name="sceneEnvTexture" checked />
                        <a id="env_texture-change-btn" data-mdc-auto-init="MDCRipple"
                           title="Toggle textures" onclick="toggleEnvTexture(document.getElementById('sceneEnvironmentTexture'))"
                           class="EditorToolbarBtnStyle mdc-button mdc-button--raised mdc-button--dense mdc-button--primary mdc-theme--secondary-bg">
                            <i class="material-icons">texture</i>
                        </a>
                    </div>

                </div>

                <!-- Close all 2D UIs-->
                <div class="environmentButton">
                    <a id="toggleUIBtn" data-toggle='on' type="button"
                       class="ToggleUIButtonStyle mdc-theme--secondary" title="Toggle interface">
                        <i class="material-icons" style="opacity:0.4; z-index: 100000">visibility</i>
                    </a>
                </div>

                <!-- Hierachy Viewer -->
                <?php
                require( plugin_dir_path( __DIR__ ).'/templates/vrodos-edit-3D-scene-HierarchyViewer.php');
                ?>

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
                    <div id="assetCategTab" class="AssetCategoryTabStyle">
                        <button id="allAssetsViewBt" class="tablinks mdc-button active">All</button>
                    </div>

                    <!-- Search bar -->
                    <div class="mdc-textfield search" data-mdc-auto-init="MDCTextfield" style="margin-top:0; height:40px; margin-left:10px;">
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
                        <i class="material-icons">add_circle</i>
                    </a>

                </div>

                <!-- Popups -->
                <?php require( plugin_dir_path( __DIR__ ).'/templates/vrodos-edit-3D-scene-Popups.php'); ?>

                <!--  Open/Close Scene list panel-->
                <a id="scenesList-toggle-btn" data-toggle='on' type="button" class="scenesListToggleStyle scenesListToggleOn hidable mdc-button mdc-button--raised mdc-button--primary mdc-button--dense" title="Toggle scenes list" data-mdc-auto-init="MDCRipple">
                    <i class="material-icons" style="margin:auto">menu</i>
                </a>

                <!-- Scenes Credits and Main menu List -->
                <?php require( plugin_dir_path( __DIR__ ).'/templates/vrodos-edit-3D-scene-OtherScenes.php'); ?>

            </div>   <!--   VR DIV   -->

            <!--Options dialogue-->
            <?php require( plugin_dir_path( __DIR__ ) .  '/templates/vrodos-edit-3D-scene-OptionsDialogue.php' ); ?>

        </div>

    </div>

    <!-- Scripts part 1: The GUIs -->
    <script type="text/javascript">

        let mdc = window.mdc;

        mdc.autoInit();

        // Delete scene dialogue
        let deleteDialog = new mdc.dialog.MDCDialog(document.querySelector('#delete-dialog'));
        deleteDialog.focusTrap_.deactivate();

        // Compile dialogue
        let compileDialog = new mdc.dialog.MDCDialog(document.querySelector('#compile-dialog'));
        compileDialog.focusTrap_.deactivate();


        // load asset browser with data
        jQuery(document).ready(function(){

            vrodos_fetchListAvailableAssetsAjax(isAdmin, projectSlug, urlforAssetEdit, projectId);

            // make asset browser draggable: not working without get_footer
            // jQuery('#assetBrowserToolbar').draggable({cancel : 'ul'});
        });

    </script>


    <!--  Part 3: Start 3D with Javascript   -->
    <script>

        // id of animation frame is used for canceling animation when dat-gui changes
        let id_animation_frame;

        // all 3d dom
        let vr_editor_main_div = document.getElementById( 'vr_editor_main_div' );

        // Selected object name
        var selected_object_name = '';

        // Add 3D gui widgets to gui vr_editor_main_div
        let guiContainer = document.getElementById('numerical_gui-container');
        guiContainer.appendChild(controlInterface.domElement);
        // guiContainer.appendChild(controlInterface.rotate.domElement);
        // guiContainer.appendChild(controlInterface.scale.domElement);

        // camera, scene, renderer, lights, stats, floor, browse_controls are all children of Environmentals instance
        var envir = new vrodos_3d_editor_environmentals(vr_editor_main_div);
        envir.is2d = true;

        // Controls with axes (Transform, Rotate, Scale)

        var transform_controls = new THREE.TransformControls(envir.cameraOrbit, envir.renderer.domElement );
        transform_controls.name = 'myTransformControls';


        // ----------- Extend capabilities of Transform Controls ----------------

        // // lines denoting angle for rotation mode
        // angle_line_geometryX = new THREE.BufferGeometry().setAttribute( 'position', new THREE.Float32BufferAttribute( [0,0,0,0,1.1,0], 3 ) );
        // angle_line_geometryY = new THREE.BufferGeometry().setAttribute( 'position', new THREE.Float32BufferAttribute( [0,0,0,0,0,1.1], 3 ) );
        // angle_line_geometryZ = new THREE.BufferGeometry().setAttribute( 'position', new THREE.Float32BufferAttribute( [0,0,0,0,1.1,0], 3 ) );
        //
        //
        //
        // var angle_lineX = new THREE.Line( angle_line_geometryX, new THREE.GizmoLineMaterial( { color: 0xff0000 } ) );
        // angle_lineX.visible = false;
        // angle_lineX.renderOrder = 1;
        // angle_lineX.name = "red";
        // var angle_lineY = new THREE.Line( angle_line_geometryY, new THREE.GizmoLineMaterial( { color: 0x00ff00 } ) );
        // angle_lineY.visible = false;
        // angle_lineY.renderOrder = 1;
        // angle_lineY.name = "green";
        // var angle_lineZ = new THREE.Line( angle_line_geometryZ, new THREE.GizmoLineMaterial( { color: 0x0000ff } ) );
        // angle_lineZ.visible = false;
        // angle_lineZ.renderOrder = 1;
        // angle_lineZ.name = "blue";
        //
        //
        // transform_controls.children.unshift( angle_lineZ );
        // transform_controls.children.unshift( angle_lineY );
        // transform_controls.children.unshift( angle_lineX );
        //
        // // 2D info label
        // var textInfo = document.createElement('div');
        // textInfo.className = 'label';
        // textInfo.style.color = 'rgb(' + 255 + ',' + 255 + ',' + 255 + ')';
        // textInfo.style.background= 'rgb(' + 210 + ',' + 210 + ',' + 210 + ')';
        // textInfo.style.padding = "5px";
        // textInfo.style.borderRadius="20px";
        // textInfo.textContent = "";
        //
        // var labelInfo = new THREE.CSS2DObject(textInfo);
        //
        // transform_controls.add(labelInfo);

        // ---------------------------------------------------------------------


        //var firstPersonBlocker = document.getElementById('firstPersonBlocker');
        let firstPersonBlockerBtn = document.getElementById('firstPersonBlockerBtn');

        // Hide (right click) panel
        hideObjectPropertiesPanels();

        // Add Listeners for: When Dat.Gui changes update php, javascript vars and transform_controls
        controllerDatGuiOnChange();

        // Add lights on scene
        let lightsPawnLoader = new VRodos_LightsPawn_Loader();
        lightsPawnLoader.load(resources3D);

        // Add all in hierarchy viewer
        setHierarchyViewer();

        // Add transform controls to scene
        envir.scene.add(transform_controls);

        // Load Manager
        // Make progress bar visible
        jQuery("#progress").get(0).style.display = "block";
        jQuery("#progressWrapper").get(0).style.visibility = "visible";
        document.getElementById("result_download").innerHTML = "Loading";

        // Make a Loading Manager
        let manager = new THREE.LoadingManager();

        // On progress messages (loading)
        manager.onProgress = function ( url, loaded, total ) {
            document.getElementById("result_download").innerHTML = "Loading " + loaded + " / " + total;
        };

        let toggleEnvTexture = (el) => {
            jQuery("#env_texture-change-btn").toggleClass('mdc-theme--secondary-bg');
            el.checked = !el.checked;
            envir.scene.environment = !el.checked ? null : envir.maintexture;
        }

        // When all are finished loading place them in the correct position
        manager.onLoad = function () {

            // Get the last inserted object
            let l = Object.keys(resources3D).length;
            let name = Object.keys(resources3D)[l - 1]; //Object.keys(resources3D).pop();

            let objItem = envir.scene.getObjectByName(name);

            if (objItem === undefined){
                return;
            } else {
                console.log(name, objItem);
                attachToControls(name, objItem);
            }

            // Find scene dimension in order to configure camera in 2D view (Y axis distance)
            findSceneDimensions();
            envir.updateCameraGivenSceneLimits();

            setHierarchyViewer();
            setDatGuiInitialVales(objItem);


            for (let n in resources3D) {
                (function (name) {

                    // Set Target light for Spots
                    if (resources3D[name]['category_name'] === 'lightSpot') {
                        let lightSpot = envir.scene.getObjectByName(name);
                        lightSpot.target = envir.scene.getObjectByName(resources3D[name]['lighttargetobjectname']);
                    }
                })(n);
            }

            // Avoid culling by frustum
            envir.scene.traverse(function (obj) {
                obj.frustumCulled = false;
            });

            // Remote shadows. Recheck in v141
            envir.scene.children.forEach(function(item,index){
                if(item.type ==="DirectionalLight" || item.type==="SpotLight" || item.type==="PointLight"){
                    item.shadow.mapSize.width = 0;
                    item.shadow.mapSize.height = 0;
                }
            });

            // Update Light Helpers to point to each object (spot light)
            envir.scene.traverse(function(child) {
                    if (child.light != undefined)
                        child.update();
                }
            );

            jQuery("#progressWrapper").get(0).style.visibility = "hidden";
        }; // End of manager

        // Loader of assets
        let loaderMulti = new VRodos_LoaderMulti();
        loaderMulti.load(manager, resources3D, pluginPath);


        //--- initiate PointerLockControls ---------------
        initPointerLock();

        // ANIMATE
        function animate()
        {
            if(isPaused) {
                return;
            }

            id_animation_frame = requestAnimationFrame( animate );

            // Select the proper camera (orbit, or avatar, or thirdPersonView)
            let curr_camera = avatarControlsEnabled ?
                (envir.thirdPersonView ? envir.cameraThirdPerson : envir.cameraAvatar) : envir.cameraOrbit;

            // Render it
            //envir.renderer.render( envir.scene, curr_camera);

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
            envir.orbitControls.update();
            updatePointerLockControls();

            //updatePositionsAndControls();

            //envir.cubeCamera.update( envir.renderer, envir.scene );
        }

        // UPDATE
        function updatePositionsAndControls()
        {
            // envir.orbitControls.update();
            // updatePointerLockControls();


            // Now update the translation and rotation input texts at datgui from transform controls
            if (transform_controls.object) {
                const affines = ['position', 'rotation', 'scale'];
                for (let j=0; j<3; j++ ) {
                    for (let i = 0; i < 3; i++) {
                        if (controlInterface.__controllers[j*3+i].getValue() !== transform_controls.object[affines[j]].toArray()[i]) {

                            controlInterface.__controllers[j*3+i].updateDisplay();
                        }
                    }
                }
                updatePositionsPhpAndJavsFromControlsAxes();
            }
        }

        animate();

        // Set all buttons actions
        loadButtonActions();

        function attachToControls(name, objItem){

            let trs_tmp = resources3D[name]['trs'];
            transform_controls.attach(objItem);

            // highlight
            envir.outlinePass.selectedObjects = [objItem];

            transform_controls.object.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1],
                trs_tmp['translation'][2]);
            transform_controls.object.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1],
                trs_tmp['rotation'][2]);
            transform_controls.object.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);


            jQuery('#object-manipulation-toggle').show();
            jQuery('#axis-manipulation-buttons').show();
            jQuery('#double-sided-switch').show();

            showObjectPropertiesPanel(transform_controls.getMode());

            selected_object_name = name;
            transform_controls.setMode("translate");

            // Resize controls based on object size
            setTransformControlsSize();
        }

        // Only in Undo redo as javascript not php!
        function parseJSON_LoadScene(scene_json) {

            resources3D = parseJSON_javascript(scene_json, uploadDir);

            // CLEAR SCENE
            let preserveElements = ['myAxisHelper', 'myGridHelper', 'avatarCamera', 'myTransformControls'];

            for (let i = envir.scene.children.length - 1; i >=0 ; i--) {

                if (!preserveElements.includes(envir.scene.children[i].name))
                    envir.scene.remove(envir.scene.children[i]);
            }

            setHierarchyViewer();

            transform_controls = envir.scene.getObjectByName('myTransformControls');
            transform_controls.attach(envir.scene.getObjectByName("avatarCamera"));

            loaderMulti = new VRodos_LoaderMulti("2");
            loaderMulti.load(manager, resources3D);
        }

        document.getElementsByTagName("html")[0].style.overflow="hidden";
        let color_sel = document.getElementById('jscolorpick');
        let custom_img_sel = document.getElementById('img_upload_bcg');
        let preset_sel = document.getElementById('presetsBcg');

        let img_thumb = document.getElementById('uploadImgThumb');

        // Init UI values


        if (resources3D["enableGeneralChat"]) {
            document.getElementById("enableGeneralChatCheckbox").checked = JSON.parse(resources3D["enableGeneralChat"]);
        }
        
        if (resources3D["backgroundStyleOption"]) {
            let  selOption = JSON.parse(resources3D["backgroundStyleOption"]);
           
            switch (selOption){
            case 0:
                document.getElementById("sceneNone").checked = true;
                custom_img_sel.disabled = true;
                preset_sel.disabled = true;
                color_sel.disabled = true;

                color_sel.hidden = true;
                preset_sel.hidden = true;
                custom_img_sel.hidden = true;
                img_thumb.hidden = true;
                break;
            case 1:
                document.getElementById("sceneColorRadio").checked = true;
                color_sel.disabled = false;
                preset_sel.disabled = true;
                custom_img_sel.disabled = true;

                color_sel.hidden = false;
                preset_sel.hidden = true;
                custom_img_sel.hidden = true;
                img_thumb.hidden = true;
                break;
            case 2:
                document.getElementById("sceneSky").checked = true;
                custom_img_sel.disabled = true;
                preset_sel.disabled = false;
                color_sel.disabled = true;

                color_sel.hidden = true;
                preset_sel.hidden = false;
                custom_img_sel.hidden = true;
                img_thumb.hidden = true;
                envir.scene.backgroundPresetOption = resources3D["backgroundPresetOption"];
                envir.scene.preset_selection = resources3D["backgroundPresetOption"];
                // envir.scene.backgroundPresetOption = preset_sel.value;
                //preset_select.value = JSON.parse(resources3D["backgroundPresetOption"]);

                for(let index = 0; index < preset_sel.options.length;index++){
                    if(preset_sel.options[index].value == resources3D["backgroundPresetOption"] ){
                        preset_sel.options[index].selected = true;
                        //envir.scene.backgroundPresetOption = preset_sel.options[index].value;
                    }
                }
                break;
            case 3:
                document.getElementById("sceneCustomImage").checked = true;
                custom_img_sel.disabled = false;
                preset_sel.disabled = true;
                color_sel.disabled = true;

                color_sel.hidden = true;
                preset_sel.hidden = true;
                custom_img_sel.hidden = false;

                if (resources3D["backgroundImagePath"]  && resources3D["backgroundImagePath"] !=0 ){
                    img_thumb.src = resources3D["backgroundImagePath"];
                    img_thumb.hidden = false;
                }
                break;
            }
            envir.scene.img_bcg_path = resources3D["backgroundImagePath"];
          
           
            envir.scene.bcg_selection = JSON.parse(resources3D["backgroundStyleOption"]);
           
            //saveChanges();

        }


    </script>
<?php }

// Add sceneType variable in js envir
$sceneType = isset($_GET['vrodos_scene']) ? get_post_meta($_GET['vrodos_scene'], "vrodos_scene_environment") : null;

if ($sceneType) {
    if (count($sceneType)>0) {
        echo '<script>';
        echo 'envir.sceneType="' . $sceneType[0] . '";';
        echo '</script>';
    }
}
?>
