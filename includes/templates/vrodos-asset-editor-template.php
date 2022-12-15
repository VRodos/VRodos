<!--<script type="module" src="/wordpress/wp-content/plugins/wordpressunity3deditor/js_libs/threejs124/stats.module.js">-->
<!--    import Stats from "./stats,module.js";-->
<!--    var stats = new Stats();-->
<!--    console.log("stats", stats);-->
<!--    console.log("aaaa");-->
<!--</script>-->


<?php
// Remove the admin bar
add_action('get_header', 'vrodos_remove_admin_login_header');

//Create asset interfaces

//ini_set('disp lay_errors', 1);
//ini_set('display_startup_errors', 1);
//error_reporting(E_ALL);

// For auto-translation by Google
$hasTranslator = false;
//if ($hasTranslator) {
//    putenv("GOOGLE_APPLICATION_CREDENTIALS=".get_option( 'general_settings' )['vrodos_google_application_credentials']);
//    if (file_exists(plugin_dir_path(__DIR__) . '/translate/vendor/autoload.php')) {
//        // Include Google Cloud dependendencies using Composer
//        require(plugin_dir_path(__DIR__) . '/translate/vendor/autoload.php');
//        $hasTranslator = true;
//    }
//}
//// [START translate_translate_text]
//use Google\Cloud\Translate\TranslateClient;



// Is on back or front end ?
$isAdmin = is_admin() ? 'back' : 'front';
?>

<script>
    var isAdmin="<?php echo $isAdmin; ?>";
</script>

<?php

// Load Scripts
function vrodos_loadAsset3DManagerScriptsAndStyles() {

    // Stylesheet
    wp_enqueue_style('vrodos_asseteditor_stylesheet');

    // QR code generator
    wp_enqueue_script('vrodos_qrcode_generator');

    // Three js : for simple rendering
    wp_enqueue_script('vrodos_scripts');

    // For fbx binary
    wp_enqueue_script('vrodos_inflate'); // for binary fbx

    $versionThreeJS = "119";

    if ($versionThreeJS === "119") {

        // 1. Three js library
        wp_enqueue_script( 'vrodos_load119_threejs' );
        wp_enqueue_script( 'vrodos_load124_statjs' );

        // 2. Obj loader simple; For loading an uploaded obj
        wp_enqueue_script( 'vrodos_load87_OBJloader' );

        // 3. Obj loader 2: For preview loading
        wp_enqueue_script( 'vrodos_load87_OBJloader2' );
        wp_enqueue_script( 'vrodos_load87_WWOBJloader2' );

        wp_enqueue_script( 'vrodos_load87_MTLloader' );
        wp_enqueue_script( 'vrodos_load87_PDBloader' );
        wp_enqueue_script( 'vrodos_load119_FBXloader' );
        //wp_enqueue_script('vrodos_load119_TrackballControls');

        wp_enqueue_script( 'vrodos_load119_OrbitControls' );
        wp_enqueue_script( 'vrodos_load119_GLTFLoader' );
        wp_enqueue_script( 'vrodos_load119_DRACOLoader' );
        wp_enqueue_script( 'vrodos_load119_DDSLoader' );
        wp_enqueue_script( 'vrodos_load119_KTXLoader' );
        wp_enqueue_script( 'vrodos_load119_CSS2DRenderer' );

    } else if ($versionThreeJS === "141"){
        // 1. Three js library
        wp_enqueue_script( 'vrodos_load141_threejs' );
        //wp_enqueue_script( 'vrodos_load124_statjs' );

        // 2. Obj loader simple; For loading an uploaded obj
        //wp_enqueue_script( 'vrodos_load87_OBJloader' );

        // 3. Obj loader 2: For preview loading
        //wp_enqueue_script( 'vrodos_load87_OBJloader2' );
        //wp_enqueue_script( 'vrodos_load87_WWOBJloader2' );

        //wp_enqueue_script( 'vrodos_load87_MTLloader' );
        //wp_enqueue_script( 'vrodos_load87_PDBloader' );
        //wp_enqueue_script( 'vrodos_load119_FBXloader' );


        wp_enqueue_script( 'vrodos_load141_OrbitControls' );
        wp_enqueue_script( 'vrodos_load141_GLTFLoader' );
//	    wp_enqueue_script( 'vrodos_load119_DRACOLoader' );
//	    wp_enqueue_script( 'vrodos_load119_DDSLoader' );
//	    wp_enqueue_script( 'vrodos_load119_KTXLoader' );
        wp_enqueue_script( 'vrodos_load141_CSS2DRenderer' );
    }


    // Load single asset: Load existing asset
    wp_enqueue_script('vrodos_AssetViewer_3D_kernel');

    // Load scripts for asset editor
    wp_enqueue_script('vrodos_asset_editor_scripts');

    // scroll for images thumnbnails (in clone)
    wp_enqueue_script('vrodos_lightslider');

    // Select colors
    wp_enqueue_script('vrodos_jscolorpick');
//    wp_enqueue_script('vrodos_jsfontselect');

    // to capture screenshot of the 3D molecule and its tags
    wp_enqueue_script('vrodos_html2canvas');


    // Content Interlinking
//    $pluginpath = dirname (plugin_dir_url( __DIR__  ));

//    // content interlinking ajax
//    wp_enqueue_script( 'ajax-vrodos_content_interlinking_request',
//        $pluginpath.'/js_libs/content_interlinking_commands/content_interlinking.js', array('jquery') );
//
//    // ajax php admin url
//    wp_localize_script( 'ajax-vrodos_content_interlinking_request', 'my_ajax_object_fetch_content',
//        array( 'ajax_url' => admin_url( 'admin-ajax.php' ), null )
//    );

}
add_action('wp_enqueue_scripts', 'vrodos_loadAsset3DManagerScriptsAndStyles' );

// End Of Scripts Loading

$perma_structure = get_option('permalink_structure') ? true : false;
if( $perma_structure){$parameter_Scenepass = '?vrodos_scene=';} else{$parameter_Scenepass = '&vrodos_scene=';}
if( $perma_structure){$parameter_pass = '?vrodos_game=';} else{$parameter_pass = '&vrodos_game=';}

$project_id = isset($_GET['vrodos_game']) ? sanitize_text_field( intval( $_GET['vrodos_game'] )) : null ;
$asset_id = isset($_GET['vrodos_asset']) ? sanitize_text_field( intval( $_GET['vrodos_asset'] )) : null ;
$scene_id = isset($_GET['vrodos_scene']) ? sanitize_text_field( intval( $_GET['vrodos_scene'] )) : null ;
//$previous_page = isset($_GET['previous_page']) ? sanitize_text_field( intval( $_GET['previous_page'] )) : null ;


// Game project variables
$game_post = get_post($project_id);
$gameSlug = $game_post->post_name;
$game_type_obj = vrodos_return_project_type($project_id);


//Get 'parent-game' taxonomy with the same slug as Game
$assetPGame = get_term_by('slug', $gameSlug, 'vrodos_asset3d_pgame');

//echo $assetPGame;
$assetPGameID = $assetPGame ? $assetPGame->term_id : null;
$assetPGameSlug = $assetPGame ? $assetPGame->slug : null;

$isJoker = (strpos($assetPGameSlug, 'joker') !== false) ? "true":"false";

$asset_id_avail_joker = $game_type_obj ? vrodos_get_assetids_joker($game_type_obj->string) : null;

$isUserloggedIn = is_user_logged_in();
$current_user = wp_get_current_user();

$login_username = $current_user->user_login;
$isUserAdmin = current_user_can('administrator');

$isEditMode = null;
if (isset($_GET['preview'])) {
    $isEditMode = !($_GET['preview'] == '1');
}


// Default image to show when there are no images for the asset
$defaultImage = plugins_url( '../images/ic_sshot.png', dirname(__FILE__)  );

$curr_font = "Arial";
$isOwner = $current_user->ID == get_post_field ('post_author', $asset_id);

// New asset
if (!$asset_id) {
    $isOwner = true;
}

$isEditable = false;

// Old asset
if(isset($_GET['vrodos_asset'])) {
    $author_id = get_post_field('post_author', $asset_id);
}

$author_id = null;
if ($isUserloggedIn) {
    $user_id = get_current_user_id();

    if (!isset($_GET['vrodos_asset'])) {
        // NEW ASSET
        $isEditable = true;
        $author_id = $user_id;

    } else if ($isUserAdmin || $isOwner){
        // OLD ASSET
        $isEditable = true;
        $author_id = get_post_field ('post_author', $asset_id);
    }
}

$author_displayname = get_the_author_meta( 'display_name' , $author_id );
$author_username = get_the_author_meta( 'nickname' , $author_id );
$author_country = get_the_author_meta( 'country' , $author_id );


$editgamePage = vrodos_getEditpage('game');
$allGamesPage = vrodos_getEditpage('allgames');
$editscenePage = vrodos_getEditpage('scene');
$newAssetPage = vrodos_getEditpage('asset');
$editscene2DPage = vrodos_getEditpage('scene2D');
$editsceneExamPage = vrodos_getEditpage('sceneExam');


$archaeology_tax = get_term_by('slug', 'archaeology_games', 'vrodos_game_type');

$all_game_category = get_the_terms( $project_id, 'vrodos_game_type' );

$game_category = $all_game_category ? $all_game_category[0]->slug : null;

$scene_data = vrodos_getFirstSceneID_byProjectID($project_id,$game_category);//first 3D scene id

$edit_scene_page_id = $editscenePage[0]->ID;

$path_url = wp_upload_dir()['baseurl'].'/Models/';

// Asset preview 3D background color
$back_3d_color = 'rgb(0,0,0)';


// GoBack link
$goBackToLink = '';

// If coming from scene then go to scene editor
if($scene_id != 0 ) {

    $goBackToLink = get_permalink($edit_scene_page_id) . $parameter_Scenepass . $scene_id . '&vrodos_game=' .
        $project_id . '&scene_type=' . $_GET['scene_type'];

}else {

    // Goto shared assets
    $goBackToLink = home_url()."/vrodos-assets-list-page/?".
        (!isset($_GET['singleproject'])?"vrodos_game=":"vrodos_project_id=").$project_id;
}


?>

<script>
    let path_url = mtl_file_name = obj_file_name = pdb_file_name = glb_file_name = fbx_file_name = textures_fbx_string_connected = null;

</script>

<?php

// ============================================
// Submit Handler
//=============================================
if(isset($_POST['submitted']) && isset($_POST['post_nonce_field']) && wp_verify_nonce($_POST['post_nonce_field'],
        'post_nonce')) {

//    $fp = fopen("output_check_files.txt","w");
//    fwrite($fp, print_r($_FILES, true));
//    fclose($fp);

    $asset_language_pack = vrodos_asset3d_languages_support1($_POST);
    //include 'edit-vrodos_asset3d_languages_support1.php';

    // Fonts Selected
    $assetFonts = esc_attr(strip_tags($_POST['assetFonts']));

    // 3D background color
    $assetback3dcolor=  esc_attr(strip_tags($_POST['assetback3dcolor']));

    // Asset trs
    $assettrs=  esc_attr(strip_tags($_POST['assettrs']));

    //fwrite($fp, print_r($_POST,true));

    // Asset category
    $assetCatID = intval($_POST['term_id']);//ID of Asset Category (hidden input)

    // Term
    $assetCatTerm = get_term_by('id', $assetCatID, 'vrodos_asset3d_cat');

    // IPR Term id
    $assetCatIPRID = intval($_POST['term_id_ipr']); //ID of Asset Category IPR (hidden input)

    // IPR Term id cat
    $assetCatIPRTerm = get_term_by('id', $assetCatIPRID, 'vrodos_asset3d_ipr_cat');

    // show an icon while waiting

    $asset_updatedConf = 0;
    // NEW Asset: submit info to backend
    if($asset_id == null){
        ?>

        <!-- css ref is not recognized in the following, therefore CSS should be written inline -->
        <div style="position: absolute; top: 50%; left: 50%; margin-right: -50%; transform: translate(-50%, -50%);font-size: x-large">Creating asset...</div>

        <?php

        //It's a new Asset, let's create it (returns newly created ID, or 0 if nothing happened)
        $asset_id = vrodos_create_asset_frontend($assetPGameID, $assetCatID, $gameSlug, $assetCatIPRID,
            $asset_language_pack, $assetFonts, $assetback3dcolor, $assettrs);
    }else {
        ?>
        <div class='centerMessageAssetSubmit'>Updating asset...</div>
        <?php

        // Edit an existing asset: Return true if updated, false if failed
        $asset_updatedConf = vrodos_update_asset_frontend($assetPGameID, $assetCatID, $asset_id, $assetCatIPRID,
            $asset_language_pack, $assetFonts, $assetback3dcolor, $assettrs);
    }

    // Upload 3D files
    if($asset_id != 0 || $asset_updatedConf == 1) {

        // NoCloning: Upload files from POST but check first
        // if any 3D files have been selected for upload
        if (count($_FILES['multipleFilesInput']['name']) > 0 && $_FILES['multipleFilesInput']['error'][0] != 4 ){
            vrodos_create_asset_3DFilesExtra_frontend($asset_id, $asset_language_pack['assetTitleForm'],
                $gameSlug);
        }

        update_post_meta($asset_id, 'vrodos_asset3d_isCloned', 'false');
        update_post_meta($asset_id, 'vrodos_asset3d_isJoker', $isJoker);
    }

    // SCREENSHOT: upload and add id of uploaded file to postmeta vrodos_asset3d_screenimage of asset
//    $f = fopen("output_fscr.txt","w");
//    fwrite($f, $_POST['sshotFileInput']);
//    fclose($f);
//

    if (isset($_POST['sshotFileInput']) && !empty($_POST['sshotFileInput']) ) {
        vrodos_upload_asset_screenshot($_POST['sshotFileInput'], $asset_language_pack['assetTitleForm'], $asset_id);
    }

    // Save parameters
    switch ($assetCatTerm->slug){
        case 'consumer':
            vrodos_create_asset_consumerExtra_frontend($asset_id);
            break;
        case 'terrain':
            vrodos_create_asset_terrainExtra_frontend($asset_id);
            break;
        case 'producer':
            vrodos_create_asset_producerExtra_frontend($asset_id);
            break;
        case 'molecule':
            vrodos_create_asset_moleculeExtra_frontend($asset_id);
            break;
        case 'artifact':
        default:
            vrodos_create_asset_addImages_frontend($asset_id);
            vrodos_create_asset_addAudio_frontend($asset_id);
            vrodos_create_asset_addVideo_frontend($asset_id);
            break;
    }

    if($scene_id == 0) {
        // Redirect to central otherwise the form is not loaded with the new data
        echo '<script>window.location.href = "'.$_SERVER['HTTP_REFERER'].'&vrodos_asset='.$asset_id.'#English'.'";</script>';
    }
    // Avoid loading the old page
    return;
}

//---------------------------- End of handle Submit  -------------------------
if (!empty($project_scope)) {
    if ($project_scope == 0) {
        $single_first = "Tour";
    } else if ($project_scope == 1){
        $single_first = "Lab";
    } else {
        $single_first = "Project";
    }
}

// When asset was created in the past and now we want to edit it. We should get the attachments obj, mtl
if($asset_id != null) {

    // Get post
    $asset_post    = get_post($asset_id);

    // Get post meta
    $assetpostMeta = get_post_meta($asset_id);

    // Background color in canvas
    $back_3d_color = $assetpostMeta['vrodos_asset3d_back3dcolor'][0];

    // Font type for text
    $fonts = $assetpostMeta['vrodos_asset3d_fonts'][0];

    $curr_font = str_replace("+", " ", $fonts);

    $asset_3d_files = get_3D_model_files($assetpostMeta, $asset_id);
    ?>

    <script>
        path_url     = "<?php echo $asset_3d_files['path'].'/'; ?>";
        mtl_file_name= "<?php echo $asset_3d_files['mtl']; ?>";
        obj_file_name= "<?php echo $asset_3d_files['obj']; ?>";
        pdb_file_name= "<?php echo $asset_3d_files['pdb']; ?>";
        glb_file_name= "<?php echo $asset_3d_files['glb'];?>";
        fbx_file_name= "<?php echo $asset_3d_files['fbx'];    ?>";
        textures_fbx_string_connected = "<?php echo $asset_3d_files['texturesFbx']; ?>";
    </script>

    <?php
}
//--------------------------------------------------------
get_header();
//width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no


$dropdownHeading = ($asset_id == null ? "Select a category" : "Category");

// Languages fields show
//include 'edit-vrodos_asset3d_languages_support2.php';
$assetLangPack2 = vrodos_asset3d_languages_support2($asset_id);

echo '<script>';
echo 'var asset_title_english_saved="'.$assetLangPack2['asset_title_saved'].'";';
echo 'var asset_title_greek_saved="'.$assetLangPack2['asset_title_greek_saved'].'";';
echo 'var asset_title_spanish_saved="'.$assetLangPack2['asset_title_spanish_saved'].'";';
echo 'var asset_title_french_saved="'.$assetLangPack2['asset_title_french_saved'].'";';
echo 'var asset_title_german_saved="'.$assetLangPack2['asset_title_german_saved'].'";';
echo 'var asset_title_russian_saved="'.$assetLangPack2['asset_title_russian_saved'].'";';
echo '</script>';


// Retrieve Fonts saved
$asset_fonts_saved = ($asset_id == null ? "" : get_post_meta($asset_id,'vrodos_asset3d_fonts', true));

// Retrieve Background Color saved
$asset_back_3d_color_saved = ($asset_id == null ? "#000000" :
    get_post_meta($asset_id,'vrodos_asset3d_back3dcolor', true));

$assettrs_saved = ($asset_id == null ? "0,0,0,0,0,0,0,0,-100" :
    get_post_meta($asset_id,'vrodos_asset3d_assettrs', true));


// 5 asset images
$images_urls = [null, null, null, null, null];

//Check if its new/saved and get data for artifact and Terrain
if($asset_id != null) {

    $saved_term = wp_get_post_terms( $asset_id, 'vrodos_asset3d_cat' );

//    $fp = fopen("output_savedterm.txt","w");
//    fwrite($fp, print_r($saved_term, true));
//    fclose($fp);

    if($saved_term[0]->slug == 'terrain'){

        // Wind Energy Terrain
        include 'vrodos-asset-editor-WindEnergy.php';

    }elseif (in_array($saved_term[0]->slug , ['artifact'])) {
        // Image 1 : Featured image
        $images_urls[0] = get_the_post_thumbnail_url($asset_id);

        // Image 1,2,3,4
        for ($i=1; $i <= 4; $i++){

            $image_id = get_post_meta($asset_id, "vrodos_asset3d_image".$i);

            if(!empty($image_id[0])) {
                $images_urls[$i] = wp_get_attachment_metadata($image_id[0]);
                $images_urls[$i] = $images_urls[$i]['file'] == '' ? null :
                    wp_get_upload_dir()['baseurl'] . "/" . $images_urls[$i]['file'];
            }
        }

    }
}

?>

<div id="wrapper_3d_inner" class="asset_editor_3dpanel">

    <!--   Progress bar -->
    <div id="previewProgressSlider" class="CenterContents">
        <h6 id="previewProgressLabel" class="mdc-theme--text-primary-on-light mdc-typography--subheading1">
            Preview of 3D Model</h6>
        <div class="progressSlider">
            <div id="previewProgressSliderLine" class="progressSliderSubLine" style="width: 0;">...</div>
        </div>
    </div>

    <!-- LabelRenderer of Canvas -->
    <div id="previewCanvasLabels" style=""></div>

    <!-- 3D Canvas -->
    <canvas id="previewCanvas" >3D canvas</canvas>

    <a href="#" class="animationButton" id="animButton1" onclick="asset_viewer_3d_kernel.playStopAnimation();">Animation 1</a>
    <a href="#" class="boundingSphereButton" id="boundSphButton" onclick="asset_viewer_3d_kernel.showHideBoundSphere();">Bounds</a>

    <!-- QR code -->
    <?php include 'vrodos-QRCodeGenerator.php'; ?>

</div>


<div id="text-asset-sidebar" class="asset_editor_textpanel">

    <?php
    if ($isUserloggedIn && $isEditMode) {
        ?>

        <a title="Back" class="vrodos-back-button hideAtLocked mdc-button" href="<?php echo $goBackToLink;?>">
            <em class="material-icons arrowback" >arrow_back</em>Assets Manager</a>
        <?php
    }

    // UPPER BUTTONS
    if($isUserloggedIn && $asset_id != null ){

        if ( $isEditMode) {
            $previewLink = ( empty( $_SERVER['HTTPS'] ) ? 'http://' : 'https://' ) .
                $_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'];

            // FROM NEW ASSET ONLY
            if ( !strpos($_SERVER['REQUEST_URI'],"vrodos_asset")) {
                $previewLink = $previewLink . '&vrodos_asset=' . $asset_id;
            }

            // IF from single project
            if (isset($_GET['singleproject'])) {
                $previewLink = $previewLink . '&singleproject=true';
            }

            $previewLink = $previewLink . '&preview=1#English';
            ?>

            <a class="mdc-button mdc-button--primary mdc-theme--primary"
               href="<?php echo $previewLink; ?>"
               data-mdc-auto-init="MDCRipple">Preview</a>
        <?php }  else {

            // Display EDIT BUTTON

            $curr_uri = $_SERVER['REQUEST_URI'];
            $targetparams = str_replace("preview=1","preview=0",$curr_uri);
            $editLink2 = ( empty( $_SERVER['HTTPS'] ) ? 'http://' : 'https://' ).
                $_SERVER['HTTP_HOST'].$targetparams.'#English';
            ?>

            <a class="mdc-button mdc-button--primary mdc-theme--primary"
               href="<?php echo $editLink2; ?>" data-mdc-auto-init="MDCRipple">EDIT Asset</a>


            <!-- Prompt 'Edit' or 'Create asset' -->
            <div id="edit-asset-header">
                <span class="mdc-typography--headline mdc-theme--text-primary-on-light">
                    <span>
                        <?php
                        $promptString = $asset_id == null ? "Create a new asset" : "Edit an existing asset";
                        echo ($isEditable && $isEditMode) ? $promptString:"";
                        ?>
                    </span>
                </span>
            </div>

        <?php }
    }?>


    <!-- Form to submit data -->
    <form name="3dAssetForm" id="3dAssetForm" method="POST" enctype="multipart/form-data">

        <!-- CATEGORY -->
        <!-- <div class="" style="display:--><?php //echo ((!$isUserAdmin && !$isOwner) || $isPreviewMode) ? "none":""; ?><!--">-->
        <!-- Hide category selection for simplicity. Use artifact for all. -->
        <div class="" style="display:none">
            <h3 class="mdc-typography--title" style="margin-top:30px;"><?php echo $dropdownHeading; ?></h3>

            <div id="category-select" class="mdc-select" role="listbox" tabindex="0" style="min-width: 100%;">
                <em class="material-icons mdc-theme--text-hint-on-light">label</em>&nbsp;

                <?php

                $myGameType = 0;
                $all_game_types = get_the_terms( $project_id, 'vrodos_game_type' );
                $game_type_slug = $all_game_types[0]->slug;

                switch ($game_type_slug) {
                    default:
                    case 'archaeology_games':
                        $myGameType=1;
                        break;
                    case 'energy_games':
                        $myGameType=2;
                        break;
                    case 'chemistry_games':
                        $myGameType=3;
                        break;
                }

                $args = array(
                    'hide_empty' => false,
                    'meta_query' => array(
                        array(
                            'key'       => 'vrodos_assetcat_gamecat',
                            'value'     => $myGameType,
                            'compare'   => '='
                        )
                    ),
                    'orderby' => 'name',
                    'order' => 'DESC',
                );

                $cat_terms = get_terms('vrodos_asset3d_cat', $args);
                $saved_term = wp_get_post_terms( $asset_id, 'vrodos_asset3d_cat' );
                ?>

                <?php if($asset_id == null) { ?>
                    <span id="currently-selected" class="mdc-select__selected-text mdc-typography--subheading2">
                        No category selected
                    </span>
                <?php } else { ?>
                    <span data-cat-desc="<?php echo $saved_term[0]->description; ?>"
                          data-cat-slug="<?php echo $saved_term[0]->slug; ?>"
                          data-cat-id="<?php echo $saved_term[0]->term_id; ?>"
                          id="currently-selected" class="mdc-select__selected-text mdc-typography--subheading2">
                        <?php echo $saved_term[0]->name; ?>
                    </span>
                <?php } ?>

                <div class="mdc-simple-menu mdc-select__menu">
                    <ul class="mdc-list mdc-simple-menu__items">

                        <li class="mdc-list-item mdc-theme--text-hint-on-light" role="option" aria-disabled="true"
                            tabindex="-1" style="pointer-events: none;">
                            No category selected
                        </li>

                        <?php foreach ( $cat_terms as $term ) {

                            if (  strpos($term->name, "Points") !== false ) {
                                continue;
                            } ?>

                            <li class="mdc-list-item mdc-theme--text-primary-on-background" role="option"
                                data-cat-desc="<?php echo $term->description; ?>"
                                data-cat-slug="<?php echo $term->slug; ?>"
                                id="<?php echo $term->term_id?>"
                                tabindex="0">
                                <?php echo $term->name; ?>
                            </li>

                        <?php } ?>

                    </ul>
                </div>
            </div>

            <span style="font-style: italic;"
                  class="mdc-typography--subheading2 mdc-theme--text-secondary-on-light"
                  id="categoryDescription">
            </span>

            <input id="termIdInput" type="hidden" name="term_id" value="">
        </div>


        <!--   TITLE , DESCRIPTION , 3D files  -->

        <div id="informationPanel">

            <!-- Hidden fields for 3D models -->
            <input type="hidden" name="objFileInput" value="" id="objFileInput" />
            <input type="hidden" name="mtlFileInput" value="" id="mtlFileInput" />
            <input type="hidden" name="pdbFileInput" value="" id="pdbFileInput" />
            <input type="hidden" name="fbxFileInput" value="" id="fbxFileInput" />
            <input type="hidden" name="glbFileInput" value="" id="glbFileInput" />

            <!-- TITLE , DESCRIPTION -->
            <!-- EDIT MODE -->
            <?php if(($isOwner || $isUserAdmin) && $isEditMode) { ?>

            <!-- Title -->
            <div class="mdc-textfield FullWidth mdc-form-field" data-mdc-auto-init="MDCTextfield" >
                <input id="assetTitle" type="text"
                       class="changablefont mdc-textfield__input mdc-theme--text-primary-on-light"
                       name="assetTitle"
                       aria-controls="title-validation-msg" required minlength="3" maxlength="40"
                       style="font-family: <?php echo $curr_font?>;"
                       value="<?php echo trim($assetLangPack2['asset_title_saved']); ?>">

                <label for="assetTitle" class="mdc-textfield__label">
                    <?php echo $assetLangPack2['asset_title_label']; ?>
                </label>

                <div class="mdc-textfield__bottom-line"></div>
            </div>

            <p class="mdc-textfield-helptext  mdc-textfield-helptext--validation-msg" id="title-validation-msg">
                Between 3 - 25 characters
            </p>
            <!-- End of Title -->

            <!-- 3D Models -->
            <div id="object3DPropertiesPanel"">

            <h3 class="mdc-typography--title">3D Model of the Asset</h3>
            <img alt="3D model section"
                 src="<?php echo plugins_url( '../images/cube.png', dirname(__FILE__)  );?>">
            <label id="fileUploadInputLabel" for="multipleFilesInput"> Select files </label>

            <input id="fileUploadInput"
                   class="FullWidth" type="file"
                   name="multipleFilesInput[]"
                   value="" multiple accept=".obj,.mtl,.jpg,.png,.fbx,.pdb,.glb"
                   onclick="clearList()"/>

            <!-- For currently selected -->
            <div id="fileList3D" style="margin-left:5px"></div>

            <!-- For already stored files -->
            <?php print_r($_FILES, true) ?>

            <!-- Select type of 3D format files -->
            <ul class="RadioButtonList" style="display:none">
                <li class="mdc-form-field" id="glbRadioListItem" onclick="loadFileInputLabel('glb')">
                    <div class="mdc-radio">
                        <input class="mdc-radio__native-control" type="radio" id="glbRadio"
                               name="objectTypeRadio" value="glb">
                        <div class="mdc-radio__background">
                            <div class="mdc-radio__outer-circle"></div>
                            <div class="mdc-radio__inner-circle"></div>
                        </div>
                    </div>
                    <label id="glbRadio-label" for="glbRadio" style="margin-bottom: 0;">Khronos GLB file</label>
                </li>

                <!--                <li class="mdc-form-field" id="fbxRadioListItem" onclick="loadFileInputLabel('fbx')">-->
                <!--                    <div class="mdc-radio" >-->
                <!--                        <input class="mdc-radio__native-control" type="radio" id="fbxRadio"-->
                <!--                               name="objectTypeRadio" value="fbx">-->
                <!--                        <div class="mdc-radio__background">-->
                <!--                            <div class="mdc-radio__outer-circle"></div>-->
                <!--                            <div class="mdc-radio__inner-circle"></div>-->
                <!--                        </div>-->
                <!--                    </div>-->
                <!--                    <label id="fbxRadio-label" for="fbxRadio" style="margin-bottom: 0;">FBX file</label>-->
                <!--                </li>-->
                <!---->
                <!--                <li class="mdc-form-field" id="pdbRadioListItem" onclick="loadFileInputLabel('pdb')">-->
                <!--                    <div class="mdc-radio">-->
                <!--                        <input class="mdc-radio__native-control" type="radio" id="pdbRadio"-->
                <!--                               name="objectTypeRadio" value="pdb">-->
                <!--                        <div class="mdc-radio__background">-->
                <!--                            <div class="mdc-radio__outer-circle"></div>-->
                <!--                            <div class="mdc-radio__inner-circle"></div>-->
                <!--                        </div>-->
                <!--                    </div>-->
                <!--                    <label id="pdbRadio-label" for="pdbRadio" style="margin-bottom: 0;">Protein Data Bank (PDB) file</label>-->
                <!--                </li>-->
                <!---->
                <!--                <li class="mdc-form-field" id="mtlRadioListItem" onclick="loadFileInputLabel('obj')">-->
                <!--                    <div class="mdc-radio">-->
                <!--                        <input class="mdc-radio__native-control" type="radio" id="mtlRadio"-->
                <!--                               name="objectTypeRadio" value="mtl">-->
                <!--                        <div class="mdc-radio__background">-->
                <!--                            <div class="mdc-radio__outer-circle"></div>-->
                <!--                            <div class="mdc-radio__inner-circle"></div>-->
                <!--                        </div>-->
                <!--                    </div>-->
                <!--                    <label id="mtlRadio-label" for="mtlRadio" style="margin-bottom: 0;">MTL & OBJ files</label>-->
                <!--                </li>-->
            </ul>



            <div id="sshotFileInputContainer">
                <h4 class="mdc-typography--title">Screenshot</h4>
                <?php

                if($asset_id==null) {

                    // If asset is not created load a predefault image
                    echo '<img id = "sshotPreviewImg" src="'.
                        plugins_url( '../images/ic_sshot.png', dirname(__FILE__)  ).'">';

                } else {

                    // if asset is edited load the existing screenshot url
                    $scrnImageURL = wp_get_attachment_url(
                        get_post_meta($asset_id, "vrodos_asset3d_screenimage",true) );

                    echo '<img id = "sshotPreviewImg" src="'.$scrnImageURL.'">';
                }
                ?>

                <input class="FullWidth" type="hidden" name="sshotFileInput" value=""
                       id="sshotFileInput" accept="image/png"/>

                <a id="createModelScreenshotBtn" type="button"
                   class="mdc-button mdc-button--primary mdc-theme--primary"
                   data-mdc-auto-init="MDCRipple">
                    Create screenshot
                </a>
            </div>

            <div id="assetback3dcolordiv" class="mdc-textfield mdc-textfield--textarea"
                 data-mdc-auto-init="MDCTextfield">
                <label for="jscolorpick" style="display:none">Color pick</label>
                <input id="jscolorpick"
                       class="jscolor {onFineChange:'updateColorPicker(this, asset_viewer_3d_kernel)'}" value="000000">

                <input type="text" id="assetback3dcolor" class="mdc-textfield__input"
                       name="assetback3dcolor" form="3dAssetForm" value="<?php echo trim($asset_back_3d_color_saved); ?>" />

                <label for="assetback3dcolor" class="mdc-textfield__label"
                       style="background: none;">3D viewer background color</label>



            </div>




            <input type="hidden" id="assettrs" class="mdc-textfield__input"
                   name="assettrs" form="3dAssetForm" value="<?php echo trim($assettrs_saved); ?>" />



            <!-- Audio -->
            <div id="audioDetailsPanel">

                <h4 class="mdc-typography--title">3D audio file</h4>
                <img alt="Audio Section" src="<?php echo plugins_url( '../images/audio.png', dirname(__FILE__)  );?>">
                <div id="audioFileInputContainer">
                    <?php
                    $audioID = get_post_meta($asset_id, 'vrodos_asset3d_audio', true);
                    $attachment_post = get_post( $audioID );
                    $attachment_file = $attachment_post->guid;

                    if(strpos($attachment_file, "mp3" )!==false || strpos($attachment_file, "wav" )!==false){
                        ?>
                        <audio controls loop preload="auto" id ='audioFile'>
                            <source src="<?php echo $attachment_file;?>" type="audio/mp3">
                            <source src="<?php echo $attachment_file;?>" type="audio/wav">
                            Your browser does not support the audio tag.
                        </audio>
                    <?php } ?>

                    <label for="audioFileInput"> Select a new audio</label>
                    <input class="FullWidth" type="file" name="audioFileInput" value="" id="audioFileInput" accept="audio/mp3,audio/wav"/>
                    <br />
                    <span id="audio-description-label"
                          class="mdc-typography--subheading1 mdc-theme--text-secondary-on-background">mp3 or wav</span>
                </div>
            </div>

        </div>
        <!-- End of 3D -->

        <!-- Languages -->
        <h3 class="mdc-typography--title">Description</h3>

        <img alt="Languages section" class="sectionIcon"
             src="<?php echo plugins_url( '../images/language_icon.jpg', dirname(__FILE__)  );?>">

        <!-- All language fields are in the following -->
        <?php vrodos_asset3d_languages_support3($curr_font, $assetLangPack2);?>

        <!--  Select font for text -->
        <div id="assetFontsDiv">
            <span id="assetFontsLabel" for="assetFonts" class="mdc-textfield" >Fonts</span>
            <input id="assetFonts" type="hidden" class="mdc-textfield__input"
                   name="assetFonts" form="3dAssetForm" value="<?php echo trim($asset_fonts_saved); ?>">
            <script>
                jQuery('#assetFonts').fontselect().on('change', function() { applyFont(this.value); });
            </script>
        </div>


        <hr class="whiteSpaceSeparatorAssetEditor" />

        <!--   MULTIMEDIA -->
        <h3 class="mdc-typography--title">Multimedia</h3>

        <img alt="Images section" class="sectionIcon"
             src="<?php echo plugins_url( '../images/ic_images_section.png', dirname(__FILE__)  );?>">

        <!-- Images Input Fields-->
        <div id="imgDetailsPanel">
            <?php
            for ($i=0; $i<=4; $i++){
                ?>
                <h3 class="mdc-typography--title">Image <?php echo $i;?></h3>

                <img alt="Image placeholder" id="img<?php echo $i; ?>Preview"
                     src="<?php echo ($asset_id == null || $images_urls[$i] == null) ? $defaultImage : $images_urls[$i] ; ?>">

                <input type="file" name="image<?php echo $i;?>Input" title="Image <?php echo $i;?>" value=""
                       id="img<?php echo $i;?>Input" accept="image/x-png,image/gif,image/jpeg">

                <br />
                <span  class="mdc-typography--subheading1 mdc-theme--text-secondary-on-background">jpg is recommended</span>
            <?php }?>
        </div>

        <script>
            // On select image alter preview thumbnail
            for (let i=0; i<=4; i++){
                jQuery("#img"+i.toString()+"Input").change(function() {
                    vrodos_read_url(this, "#img"+i.toString()+"Preview");
                });
            }
        </script>

        <hr class="WhiteSpaceSeparator">

        <!-- End of Images -->


        <!-- Video -->
        <div id="videoDetailsPanel">
            <h3 class="mdc-typography--title">Video</h3>

            <img alt="Video section"
                 src="<?php echo plugins_url( '../images/ic_video_section.png', dirname(__FILE__)  );?>">
            <div id="videoFileInputContainer" class="">
                <?php
                $videoID = get_post_meta($asset_id, 'vrodos_asset3d_video', true);
                $attachment_post = get_post($videoID);
                $attachment_file = $attachment_post->guid;
                ?>

                <?php if(strpos($attachment_file, "mp4" )!==false || strpos($attachment_file, "ogg" )!==false){?>
                    <?php echo $attachment_file; ?>
                    <video width="320" height="240"
                           poster="<?php echo plugins_url( '../images/', dirname(__FILE__)  ).'/video_img.png'?>" controls preload="auto">

                        <source src="<?php echo $attachment_file;?>" type="video/mp4">
                        <source src="<?php echo $attachment_file;?>" type="video/ogg">
                        Your browser does not support the video tag.
                    </video>
                <?php } ?>

                <label for="videoFileInput"> Select a new video</label>
                <input class="FullWidth" type="file" name="videoFileInput" value="" id="videoFileInput" accept="video/mp4"/>
                <br />
                <span id="video-description-label" class="mdc-typography--subheading1 mdc-theme--text-secondary-on-background">mp4 is recommended </span>
            </div>
        </div>


        <?php } else { ?>  <!-- PREVIEW READ ONLY DATA -->

            <div id="assetTitleView"><?php echo $assetLangPack2['asset_title_saved'];?></div>

            <hr />

            <!--Carousel slideshow slides-->

            <!-- Video -->
            <?php
            $showVid = $saved_term ? in_array( $saved_term[0]->slug, ['artifact'])?'':'none' : null;
            $videoID = get_post_meta($asset_id, 'vrodos_asset3d_video', true);
            ?>
            <!-- Image -->
            <?php
                $showImageFields = $saved_term ? in_array($saved_term[0]->slug,['artifact'])?'':'none' : null;
            ?>

            <div class="slideshow-container">

                <!-- Check if video slide should be shown -->
                <?php if ($showVid=='' && $asset_id != null && $videoID!=null){ ?>
                    <div class="">
                        <!-- Video slide -->
                        <!--<div class="numbertext">1 / 2</div>-->
                        <div id="videoDetailsPanel" style="display:<?php echo ($asset_id == null)?'none':$showVid; ?>;">

                            <div id="videoFileInputContainer" class="">
                                <?php

                                $attachment_post = get_post($videoID);
                                $attachment_file = $attachment_post->guid;
                                ?>

                                <?php if( strpos($attachment_file, "mp4" )!==false || strpos($attachment_file, "ogg" )!==false){?>
                                    <video style="height:auto" controls>
                                        <source src="<?php echo $attachment_file;?>" type="video/mp4">
                                        <source src="<?php echo $attachment_file;?>" type="video/ogg">
                                        Your browser does not support the video tag.
                                    </video>
                                <?php } ?>
                            </div>
                        </div>
                        <!-- Caption -->
                        <div class="text"></div>
                    </div>
                <?php } ?>


                <!--  Image 0,1,2,3,4,5 check if should be shown -->
                <?php
                for ($i=0; $i<=4; $i++){
                    if ($showImageFields=='' && $asset_id != null && $images_urls[$i]!=null){ ?>
                        <div class="">
                            <div id="imgDetailsPanel_preview" style="display: <?php echo ($asset_id == null)?'none':$showImageFields; ?>">
                                <?php if($asset_id != null){ ?>
                                    <img alt="Related images"
                                         id="img<?php echo $i;?>Preview"
                                         style="width:100%" src="<?php echo $images_urls[$i]; ?>">
                                <?php } ?>
                            </div>
                            <div class="text"></div>
                        </div>
                    <?php } ?>
                <?php } ?>


                <!--   Sliders prev next -->
                <?php if ($showVid=='' && $showImageFields=='' && $asset_id != null && $images_urls[0]!=null){ ?>
                    <a class="prev" onclick="plusSlides(-1)">&#10094;</a>
                    <a class="next" onclick="plusSlides(1)">&#10095;</a>
                <?php } ?>
            </div>
            <br>


            <!-- Audio hidden object -->
            <div id="audioFileInputContainer" style="display:none">
                <?php
                $audioID = get_post_meta($asset_id, 'vrodos_asset3d_audio', true);
                $attachment_post = get_post( $audioID );
                $attachment_file = $attachment_post->guid;
                ?>

                <audio loop preload="auto" id ='audioFile'>
                    <?php if(strpos($attachment_file, "mp3" )!==false || strpos($attachment_file, "wav" )!==false){?>
                        <source src="<?php echo $attachment_file;?>" type="audio/mp3">
                        <source src="<?php echo $attachment_file;?>" type="audio/wav">


                    <?php } ?>
                </audio>
            </div>


            <!-- Languages -->
            <ul class="langul" style="margin:5px;text-align:center;display:inline-block;width:100%">
                <button class="tablinks2 mdc-button" type='button' onclick="openLanguage('English')">English</button>
                <button class="tablinks2 mdc-button" type='button' onclick="openLanguage('Greek')" >ΕΛΛΗΝΙΚΑ</button>
                <button class="tablinks2 mdc-button" type='button' onclick="openLanguage('Spanish')">Español</button>
                <button class="tablinks2 mdc-button" type='button' onclick="openLanguage('French')">Français</button>
                <button class="tablinks2 mdc-button" type='button' onclick="openLanguage('German')">Deutsch</button>
                <button class="tablinks2 mdc-button" type='button' onclick="openLanguage('Russian')">Pусский</button>
            </ul>

            <!-- Accessibility -->
            <div style="display:inline-block; margin-left:10px; width:100%; margin-top:10px; margin-bottom:10px" >

                <!-- Background color -->
                <input type="text" id="assetback3dcolor" class="mdc-textfield__input"
                       name="assetback3dcolor" form="3dAssetForm"
                       value="<?php echo trim($asset_back_3d_color_saved); ?>" />

                <button id="jscolorpick"
                        class="jscolor {valueElement:null,value:'<?php echo $back_3d_color; ?>',onFineChange:'updateColorPicker(this, asset_viewer_3d_kernel)'}" value="cccccc"
                        style="padding:10px;width:20px;height:40px;max-height:40px;min-height:40px;left:0;display:inline-block;vertical-align:bottom">
                </button>

                <!-- Font size -->
                <div id="font-size-selector" style="display:inline-block; right: 10%;font-size: 1.5em;">
                    <div id="plustext" title="Increase text size"  onclick="resizeText(1)">A+</div>
                    <div id="minustext" title="Decrease text size" onclick="resizeText(-1)">A-</div>
                </div>

                <?php $images_accessIcons_path = plugins_url( '../images/accessibility_icons/', dirname(__FILE__)  );?>

                <!-- Different texts buttons -->
                <div class="accessBtDiv">
                    <a type='button' class="mdc-button accessButton" onclick="openAccess('')">
                        <img alt="General" src="<?php echo $images_accessIcons_path.'/general_population_icon.png';?>"
                             class="accessIcons"/>
                    </a>

                    <a type='button' class="mdc-button accessButton" onclick="openAccess('Experts')" >
                        <img alt="Experts" src="<?php echo $images_accessIcons_path.'/graduation_icon.png';?>"
                             class="accessIcons"/>
                    </a>

                    <a type='button' class="mdc-button accessButton" onclick="openAccess('Perception')">
                        <img alt="Perception disabilities" src="<?php echo $images_accessIcons_path.'/heart_icon.png';?>"
                             class="accessIcons"/>
                    </a>

                    <a type='button' class="mdc-button accessButton" onclick="openAccess('Kids')">
                        <img alt="Children" src="<?php echo $images_accessIcons_path.'/children_icon.png';?>"
                             class="accessIcons"/>
                    </a>
                </div>
            </div>

            <div class="wrapper_lang">
                <?php
                // Presentation of textual descriptions per language and accessibility level
                $languages = ["English","Greek","Spanish","French","German","Russian"];
                $accessLevel = ["","Kids","Experts","Perception"];

                foreach ($languages as $l){
                    foreach ($accessLevel as $a){

                        $l2 = ($l === 'English') ? '' : '_'.strtolower($l);
                        $a2 = ($a === '')? '' : '_'.strtolower($a);

                        echo '<div id="'.$l.$a.'" class="tabcontent2 active" style="font-family:'.$curr_font.'">'.
                            trim($assetLangPack2['asset_desc'.$l2.$a2.'_saved']).'</div>';
                    }
                }
                ?>
            </div>

            <!-- Peer calls -->
            <div id="confwindow" >
                <iframe id="iframeConf" width="100%" height="350px" src=""
                        allow="camera;microphone"></iframe>
            </div>

            <div id="confwindow_helper">
                <h1><img src="<?php echo plugins_url( '../peer-calls/src/res/', dirname(__FILE__)  ).'/peer-calls.svg';?>" alt="Peer Calls" ></h1>
                <p>Video-conference with the museum expert!</p>
                <button type="button" onclick="startConf()">Call</button>
            </div>


            <?php
            // Peer calls: audiovisual conferencing, answer to calls directly (for museum operators)
            if (isset($_GET['directcall'])) {
                echo '<script>startConf()</script>';
            }
            ?>

        <?php } ?>
        <!--  End of Edit or Show  -->

        <!-- MOLECULES  only-->
        <?php include 'vrodos-asset-editor-ChemistrySupport.php'; ?>

        <?php
        // Obsolete virtual labs code
        //  if ($project_scope == 1) {
        //        require(plugin_dir_path(__DIR__) . '/templates/vrodos-asset-editor-vlabsWidgets.php');
        //  }
        ?>

        <hr class="WhiteSpaceSeparator" />

        <!-- CATEGORY IPR -->
        <div id="ipr-div" style="display:<?php echo (($isOwner || $isUserAdmin) && $isEditMode)?'':'none';?>">

            <h3 class="mdc-typography--title">Select an IPR plan</h3>
            <div id="category-ipr-select" class="mdc-select" role="listbox" tabindex="0">
                <i class="material-icons mdc-theme--text-hint-on-light">label</i>&nbsp;

                <?php
                $saved_ipr_term = wp_get_post_terms( $asset_id, 'vrodos_asset3d_ipr_cat');

                if($asset_id == null || empty($saved_ipr_term) ) { ?>
                    <!-- Empty IPR -->
                    <span id="currently-ipr-selected"
                          class="mdc-select__selected-text mdc-typography--subheading2">
                            No IPR category selected
                            </span>
                <?php } else { ?>
                    <!-- Saved IPR -->
                    <span
                            data-cat-ipr-desc="<?php echo $saved_ipr_term[0]->description; ?>"
                            data-cat-ipr-slug="<?php echo $saved_ipr_term[0]->slug; ?>"
                            data-cat-ipr-id="<?php echo $saved_ipr_term[0]->term_ipr_id; ?>"
                            id="currently-ipr-selected"
                            class="mdc-select__selected-text mdc-typography--subheading2">
                                <?php echo $saved_ipr_term[0]->name; ?>
                             </span>
                <?php } ?>


                <div class="mdc-simple-menu mdc-select__menu">
                    <ul class="mdc-list mdc-simple-menu__items">
                        <!-- First option is none -->
                        <li class="mdc-list-item mdc-theme--text-hint-on-light"
                            role="option" aria-disabled="true" tabindex="-1"
                            style="pointer-events: none;">
                            No IPR category selected
                        </li>

                        <!-- Add other options -->
                        <?php
                        $cat_ipr_terms = get_terms('vrodos_asset3d_ipr_cat', array('get' => 'all'));

                        foreach ( $cat_ipr_terms as $term_ipr ) { ?>
                            <li class="mdc-list-item mdc-theme--text-primary-on-background" role="option"
                                title="<?php echo $term_ipr->description; ?>"
                                data-cat-ipr-desc="<?php echo $term_ipr->description; ?>"
                                data-cat-ipr-slug="<?php echo $term_ipr->slug; ?>" id="<?php echo $term_ipr->term_id?>" tabindex="0">
                                <?php echo $term_ipr->name; ?>
                            </li>
                        <?php } ?>

                    </ul>
                </div>
            </div>

            <span class="mdc-typography--subheading2 mdc-theme--text-secondary-on-light" id="categoryIPRDescription">
                </span>

            <input id="termIdInputIPR" type="hidden" name="term_id_ipr" value="">
        </div>

        <!-- Submit Button -->
        <?php if(($isOwner || $isUserAdmin) && $isEditMode) {

            wp_nonce_field('post_nonce', 'post_nonce_field');
            ?>

            <input type="hidden" name="submitted" id="submitted" value="true"/>

            <button id="formSubmitBtn" style="display:none"
                    class="ButtonFullWidth mdc-button mdc-elevation--z2 mdc-button--raised mdc-button--primary"
                    data-mdc-auto-init="MDCRipple" type="submit" <?php echo $isEditable?'':' disabled' ?> >
                <?php echo $asset_id == null ? "Create asset" : "Update asset"; ?>
            </button>

        <?php } ?>
</div>


<!-- Author -->
<table id="vrodos-asset-author" description="Author details" class="mdc-typography--caption">
    <caption>Author</caption>
    <tr>

        <th id="authorImageRow" rowspan="2">
            <img alt="Author image" id="vrodos-authorImg"
                 src="<?php echo get_avatar_url($author_id);?>">
        </th>

        <td style="padding: 0;">
            <a href="<?php echo home_url().'/user/'.$author_username; ?>"
               style="color:black">
                <?php  echo $author_displayname;?>
            </a>
        </td>

    </tr>

    <tr>
        <td><span style=""><?php echo $author_country;?></span></td>
    </tr>
</table>


</form>


<!--                     Javascript                             -->
<script type="text/javascript">
    'use strict';

    hideAdminBar();

    var mdc = window.mdc;
    mdc.autoInit();

    let back_3d_color = "<?php echo $back_3d_color; ?>";


    document.getElementById("jscolorpick").value = back_3d_color;


    generateQRcode();


    let audio_file = document.getElementById( 'audioFile' );

    let isEditMode = 0;
    let isLoggedIn= <?php echo $isUserloggedIn ? 1: 0; ?>;

    if (isLoggedIn === 1) {
        isEditMode = <?php echo $_GET['preview'] === '1' ? 0 : 1; ?>;
    } else {
        isEditMode = 0;
    }


    console.log("isEditModeA:", isEditMode);

    // Reset 3D canvas if not preview
    if (isEditMode) {
        // clear canvas and divs for fields
//        vrodos_reset_panels(asset_viewer_3d_kernel, "initial script");

        // Get the Default Screenshot image for reference;


        var sshotPreviewDefaultImg = document.getElementById("sshotPreviewImg").src;

    }

    // Set the functionality of the screenshot button;
    screenshotHandlerSet();


    let multipleFilesInputElem = document.getElementById( 'fileUploadInput' );



    let assettrs = document.getElementById( 'assettrs') ? document.getElementById( 'assettrs' ).value : "<?php echo $assettrs_saved; ?>";



    // ------- Class to load 3D model ---------
    let asset_viewer_3d_kernel = new VRodos_AssetViewer_3D_kernel(document.getElementById( 'previewCanvas' ),
        document.getElementById( 'previewCanvasLabels' ),
        document.getElementById('animButton1'),
        document.getElementById('previewProgressLabel'),
        document.getElementById('previewProgressSliderLine'),
        back_3d_color,
        audio_file,
        path_url, // OBJ textures path
        mtl_file_name,
        obj_file_name,
        pdb_file_name,
        fbx_file_name,
        glb_file_name,
        textures_fbx_string_connected,
        true,
        false,
        false,
        true,
        assettrs,
        document.getElementById('boundSphButton'));




    // Load existing 3D models
    // asset_viewer_3d_kernel.loader_asset_exists( path_url, mtl_file_name, obj_file_name, pdb_file_name, fbx_file_name,
    //                                                      glb_file_name, textures_fbx_string_connected);

    //------------------------------------------

    // For selecting files
    addHandlerFor3Dfiles(asset_viewer_3d_kernel, multipleFilesInputElem);

    // Select category handler
    if( isEditMode === 1){
        (function() {

            let MDCSelect = mdc.select.MDCSelect;

            // Category of asset change

            let categoryDropdown = document.getElementById('category-select');
            let categorySelect = MDCSelect.attachTo(categoryDropdown);
            let selectedCatId = jQuery('#currently-selected').attr("data-cat-id");

            categoryDropdown.addEventListener('MDCSelect:change', function() {
                loadLayout(true);
            });

            // IPR category change
            let categoryIPRDropdown = document.getElementById('category-ipr-select');
            let categoryIPRSelect = MDCSelect.attachTo(categoryIPRDropdown);
            let selectedCatIPRId = jQuery('#currently-ipr-selected').attr("data-cat-ipr-id");

            categoryIPRDropdown.addEventListener('MDCSelect:change', function() {
                // Change the description of the popup
                jQuery("#categoryIPRDescription")[0].innerHTML =  categoryIPRSelect.selectedOptions[0].getAttribute("data-cat-ipr-desc");

                // Change the value of termIdInputIPR
                jQuery("#termIdInputIPR").attr( "value", categoryIPRSelect.selectedOptions[0].getAttribute("id") );
            });

            // This fires on start to clear layout if no category is selected
            jQuery( document ).ready(function() {

                // No asset category selected
                if (jQuery('#currently-selected').attr("data-cat-id")) {
                    jQuery('#'+ selectedCatId).attr("aria-selected", true);
                    jQuery('#category-select').addClass('mdc-select--disabled').attr( "aria-disabled", true);
                    loadLayout(false);
                }

                // IPR category
                if (jQuery('#currently-ipr-selected').attr("data-cat-ipr-id")) {
                    jQuery('#'+ selectedCatIPRId).attr("aria-selected", true);
                    jQuery('#category-ipr-select').addClass('mdc-select--disabled').attr( "aria-disabled", true);
                }

            });

            // Function to initialize layout
            // paramter denotes if new asset or edit asset
            function loadLayout(hasCategory) {

                asset_viewer_3d_kernel.resizeDisplayGL();

                //vrodos_reset_panels(asset_viewer_3d_kernel, "loadlayout");

                let cat;
                let descText = document.getElementById('categoryDescription');

                if(hasCategory) {
                    descText.innerHTML = categorySelect.selectedOptions[0].getAttribute("data-cat-desc");
                    cat = categorySelect.selectedOptions[0].getAttribute("data-cat-slug");
                    jQuery("#termIdInput").attr( "value", categorySelect.selectedOptions[0].getAttribute("id") );
                } else {
                    let jq = jQuery("#currently-selected");
                    descText.innerHTML = jq.attr("data-cat-desc");
                    cat = jq.attr("data-cat-slug");
                    jQuery("#termIdInput").attr( "value", selectedCatId );
                }

                mdc.radio.MDCRadio.attachTo(document.querySelector('.mdc-radio'));
            }

        })();

        // Select artifact, Remove category menu
        setTimeout(function () {
            //jQuery("#category-select").click(); // Expand category
            jQuery('li[data-cat-slug="artifact"]').click();
            //jQuery('#assetTitle')[0].value = 'a12'; // Set title
            //jQuery("#objRadio-label").click(); // Set fbx type
            //jQuery("#fileUploadInput").click(); // Click browse files

            loadFileInputLabel('glb');

        }, 500);

        //jQuery("#glbRadio").prop("checked", true);
        jQuery("#formSubmitBtn").show();

    } else {

        console.log("isEditMode:" + isEditMode);

        // View mode: Show only the description mentioned in anchor #
        let url = window.location.href;
        let langcurr = url.substring(url.indexOf("#") + 1);
        jQuery("#" + langcurr + ".tabcontent2")[0].style.display = "block";

        // Show slide 0 of images sequence
        showSlides(slideIndex);
    }


    // Scroll to top
    window.onload = function () {
        setTimeout(function () {
            document.getElementById("text-asset-sidebar").scrollTo(0,0)
        }, 0);
    };


</script>
