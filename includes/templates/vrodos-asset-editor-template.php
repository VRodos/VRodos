<?php
// Remove the admin bar
//add_action('get_header', 'vrodos_remove_admin_login_header');

// Is on back or front end ?
$isAdmin = is_admin() ? 'back' : 'front';
?>

<script>
    let isAdmin="<?php echo $isAdmin; ?>";
</script>

<!--Load external library to create QR code-->
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.1/qrcode.min.js"></script>

<?php

// Load Scripts
function vrodos_loadAsset3DManagerScriptsAndStyles() {

    // Stylesheet
    wp_enqueue_style('vrodos_asseteditor_stylesheet');

    // Three js : for simple rendering
    wp_enqueue_script('vrodos_scripts');

    // 1. Three js library
    wp_enqueue_script( 'vrodos_load141_threejs' );
    wp_enqueue_script( 'vrodos_load141_OrbitControls' );
    wp_enqueue_script( 'vrodos_load141_GLTFLoader' );
    wp_enqueue_script( 'vrodos_load141_CSS2DRenderer' );
    wp_enqueue_script( 'vrodos_load141_DRACOLoader' );

    // Load single asset: Load existing asset
    wp_enqueue_script('vrodos_AssetViewer_3D_kernel');

    // Load scripts for asset editor
    wp_enqueue_script('vrodos_asset_editor_scripts');

    // Select colors
    wp_enqueue_script('vrodos_jscolorpick');
//    wp_enqueue_script('vrodos_jsfontselect');

    // to capture screenshot of the 3D molecule and its tags
    wp_enqueue_script('vrodos_html2canvas');

    // Content Interlinking
    $pluginpath = dirname (plugin_dir_url( __DIR__  ));

    // Content interlinking ajax
    wp_enqueue_script( 'ajax-vrodos_content_interlinking_request',
        $pluginpath.'/js_libs/content_interlinking_commands/content_interlinking.js', array('jquery') );

    // ajax php admin url
    wp_localize_script( 'ajax-vrodos_content_interlinking_request', 'my_ajax_object_fetch_content',
        array( 'ajax_url' => admin_url( 'admin-ajax.php' ), null )
    );

}
add_action('wp_enqueue_scripts', 'vrodos_loadAsset3DManagerScriptsAndStyles' );

// End Of Scripts Loading

$perma_structure = get_option('permalink_structure');
if( $perma_structure){$parameter_Scenepass = '?vrodos_scene=';} else{$parameter_Scenepass = '&vrodos_scene=';}
if( $perma_structure){$parameter_pass = '?vrodos_game=';} else{$parameter_pass = '&vrodos_game=';}

$project_id = isset($_GET['vrodos_game']) ? sanitize_text_field( intval( $_GET['vrodos_game'] )) : null ;
$asset_id = isset($_GET['vrodos_asset']) ? sanitize_text_field( intval( $_GET['vrodos_asset'] )) : null ;
$scene_id = isset($_GET['vrodos_scene']) ? sanitize_text_field( intval( $_GET['vrodos_scene'] )) : null ;

// Game project variables
$game_post = get_post($project_id);
$gameSlug = $game_post->post_name;
$game_type_obj = vrodos_return_project_type($project_id);

// Get 'parent-game' taxonomy with the same slug as Game
$assetPGame = get_term_by('slug', $gameSlug, 'vrodos_asset3d_pgame');

$assetPGameID = $assetPGame ? $assetPGame->term_id : null;
$assetPGameSlug = $assetPGame ? $assetPGame->slug : null;

$isJoker = (strpos($assetPGameSlug, 'joker') !== false) ? "true":"false";

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

$editgamePage = vrodos_getEditpage('game');
$allGamesPage = vrodos_getEditpage('allgames');
$editscenePage = vrodos_getEditpage('scene');
$newAssetPage = vrodos_getEditpage('asset');


$all_game_category = get_the_terms( $project_id, 'vrodos_game_type' );

$game_category = $all_game_category ? $all_game_category[0]->slug : null;

$scene_data = vrodos_getFirstSceneID_byProjectID($project_id, $game_category);//first 3D scene id

$edit_scene_page_id = $editscenePage[0]->ID;

$upload_dir = wp_upload_dir();
$DS = DIRECTORY_SEPARATOR;
$path_url = str_replace('/', $DS, $upload_dir['basedir']) . $DS . 'models' . $DS . $project_id . $DS;

// Asset preview 3D background color
$back_3d_color = 'rgb(0,0,0)';

$goBackToLink = $scene_id != 0 ?
    get_permalink($edit_scene_page_id) . $parameter_Scenepass . $scene_id . '&vrodos_game=' . $project_id . '&scene_type=' . $_GET['scene_type'] // Scene editor
    :
    home_url()."/vrodos-assets-list-page/?". (!isset($_GET['singleproject'])?"vrodos_game=":"vrodos_project_id=").$project_id; // Shared assets


?>

<script>
    let path_url = null;
    let glb_file_name = null;
</script>

<?php

// ============================================
// Submit Handler
//=============================================
if(isset($_POST['submitted']) && isset($_POST['post_nonce_field']) && wp_verify_nonce($_POST['post_nonce_field'],
        'post_nonce')) {

    $assetTitle = isset($_POST['assetTitle']) ? esc_attr(strip_tags($_POST['assetTitle'])) : '';
    $assetDescription = isset($_POST['assetDescription']) ? esc_attr(strip_tags($_POST['assetDescription'])) : '';

    // Fonts Selected
    $assetFonts = isset($_POST['assetFonts']) ? esc_attr(strip_tags($_POST['assetFonts'])) : '';

    // 3D background color
    $assetback3dcolor = esc_attr(strip_tags($_POST['assetback3dcolor']));

    // Asset trs
    $assettrs = esc_attr(strip_tags($_POST['assettrs']));

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

    if($asset_id == null) {
        ?>

        <!-- css ref is not recognized in the following, therefore CSS should be written inline -->
        <div style="position: absolute; top: 50%; left: 50%; margin-right: -50%; transform: translate(-50%, -50%);font-size: x-large">Creating asset...</div>

        <?php

        // It's a new Asset, let's create it (returns newly created ID, or 0 if nothing happened)
        $asset_id = vrodos_create_asset_frontend($assetPGameID, $assetCatID, $gameSlug, $assetCatIPRID, $assetTitle, $assetFonts, $assetback3dcolor, $assettrs, $assetDescription);

    }else {
        ?>
        <div class='centerMessageAssetSubmit'>Updating asset...</div>
        <?php

        // Edit an existing asset: Return true if updated, false if failed
        $asset_updatedConf = vrodos_update_asset_frontend($assetPGameID, $assetCatID, $asset_id, $assetCatIPRID, $assetTitle, $assetFonts, $assetback3dcolor, $assettrs, $assetDescription);
    }

    // Upload 3D files
    if($asset_id != 0 || $asset_updatedConf == 1) {

        // NoCloning: Upload files from POST but check first
        // if any 3D files have been selected for upload
        if (count($_FILES['multipleFilesInput']['name']) > 0 && $_FILES['multipleFilesInput']['error'][0] != 4 ){
            vrodos_create_asset_3DFilesExtra_frontend($asset_id, $assetTitle, $gameSlug, $project_id);
        }

        update_post_meta($asset_id, 'vrodos_asset3d_isCloned', 'false');
        update_post_meta($asset_id, 'vrodos_asset3d_isJoker', $isJoker);
    }

    if (isset($_POST['sshotFileInput']) && !empty($_POST['sshotFileInput']) ) {
        vrodos_upload_asset_screenshot($_POST['sshotFileInput'], $assetTitle, $asset_id, $project_id);
    }

    // Save custom parameters according to asset type.
    switch ($assetCatTerm->slug){
        case 'decoration':
            break;
        case 'door':
            break;
        case 'video':
            break;
        case 'poi-imagetext':
            break;
        case 'poi-help':
            break;
        case 'chat':
            break;
        case 'poi-link':
            break;

        default:
            // vrodos_create_asset_addImages_frontend($asset_id);
            // vrodos_create_asset_addAudio_frontend($asset_id);
            // vrodos_create_asset_addVideo_frontend($asset_id);
            break;


    }

    if (isset($_GET['vrodos_asset'])) {
        echo '<script>window.location.href = "'.$_SERVER['HTTP_REFERER'].'"</script>';
    } else {
        echo '<script>window.location.href = "'.$_SERVER['HTTP_REFERER'].'&vrodos_asset='.$asset_id.'";</script>';
    }
    return ;
}

//---------------------------- End of handle Submit  -------------------------

// When asset was created in the past and now we want to edit it. We should get the attachments obj, mtl
if($asset_id != null) {

    // Get post
    $asset_post = get_post($asset_id);

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
        glb_file_name= "<?php echo $asset_3d_files['glb'];?>";
    </script>

    <?php
}
//--------------------------------------------------------
get_header();

$dropdownHeading = ($asset_id == null ? "Select a category" : "Category");

$asset_title_value = ($asset_id == null) ? "" : get_the_title( $asset_id );
$asset_description_value = ($asset_id == null) ? "" : get_post_field('post_content', $asset_id);

echo '<script>';
echo 'var asset_title="'.$asset_title_value.'";';
echo '</script>';


// Retrieve Fonts saved
$asset_fonts_saved = ($asset_id == null ? "" : get_post_meta($asset_id,'vrodos_asset3d_fonts', true));

// Retrieve Background Color saved
$asset_back_3d_color_saved = ($asset_id == null ? "#000000" :
    get_post_meta($asset_id,'vrodos_asset3d_back3dcolor', true));

$assettrs_saved = ($asset_id == null ? "0,0,0,0,0,0,0,0,-100" :
    get_post_meta($asset_id,'vrodos_asset3d_assettrs', true));


?>

<div class="asset_editor_style">

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
        <div id="previewCanvasLabels"></div>

        <!-- 3D Canvas -->
        <canvas id="previewCanvas" >3D canvas</canvas>

        <a href="#" class="animationButton" id="animButton1" onclick="asset_viewer_3d_kernel.playStopAnimation();">Animation 1</a>
        <!--Bounds not working...-->
        <!--<a href="#" class="boundingSphereButton" id="boundSphButton" onclick="asset_viewer_3d_kernel.showHideBoundSphere();">Bounds</a>-->

        <!-- QR code -->
        <?php include 'vrodos-QRCodeGenerator.php'; ?>

    </div>


    <div id="text-asset-sidebar" class="asset_editor_textpanel">

        <div style="display: inline-block; width: 100%;">
            <h2 class="mdc-typography--headline mdc-theme--text-primary-on-light" >Asset editor</h2>
        </div>

        <div style="display: inline-block; width: 100%;">
            <?php if ($isUserloggedIn && $isEditMode) { ?>

                <a title="Back" class="vrodos-back-button hideAtLocked mdc-button" href="<?php echo $goBackToLink;?>">
                    <em class="material-icons arrowback">arrow_back</em> Back</a>
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

                    <!-- <a class="mdc-button mdc-button--primary mdc-theme--primary"
               href="<?php /*echo $previewLink; */?>"
               data-mdc-auto-init="MDCRipple">Preview</a>-->
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

            <!-- Author -->
            <div class="mdc-typography--caption" style="display: inline-block; float: right;" >
                <img alt="Author image" class="AssetEditorAuthorImageStyle"
                     src="<?php echo get_avatar_url($author_id);?>">
                <a href="#" style="color:black; line-height: 48px; vertical-align: text-bottom">
                    <?php echo $author_displayname;?>
                </a>
            </div>

        </div>

        <hr/>

        <!-- Form to submit data -->
        <form name="3dAssetForm" id="3dAssetForm" method="POST" enctype="multipart/form-data">

            <!-- Submit Button -->
            <?php if(($isOwner || $isUserAdmin) && $isEditMode) {
                wp_nonce_field('post_nonce', 'post_nonce_field'); ?>
                <input type="hidden" name="submitted" id="submitted" value="true"/>
                <button id="formSubmitBtn" style="float: right;" disabled
                        class="mdc-button mdc-elevation--z2 mdc-button--raised mdc-button--primary"
                        data-mdc-auto-init="MDCRipple" type="submit" <?php echo $isEditable?'':' disabled' ?> >
                    <?php echo $asset_id == null ? "Create asset" : "Update asset"; ?>
                </button>
            <?php } ?>

            <br>

            <!-- EDIT MODE -->
            <?php if(($isOwner || $isUserAdmin) && $isEditMode) { ?>

                <!-- Title -->
                <div style="display:inline-block; width: 40%; float: left;">
                    <h3 class="mdc-typography--title" style="margin-bottom: 0;">Title</h3>
                    <div class="mdc-textfield mdc-form-field" data-mdc-auto-init="MDCTextfield" style="margin-top: 0;">
                        <input id="assetTitle" type="text"
                               class="changablefont mdc-textfield__input mdc-theme--text-primary-on-light"
                               name="assetTitle"
                               aria-controls="title-validation-msg" required minlength="3" maxlength="40"
                               style="font-family: <?php echo $curr_font?>;"
                               value="<?php echo $asset_title_value; ?>">

                        <label for="assetTitle" class="mdc-textfield__label">
                            Title of the asset
                        </label>

                        <div class="mdc-textfield__bottom-line"></div>
                    </div>

                    <p class="mdc-textfield-helptext  mdc-textfield-helptext--validation-msg" id="title-validation-msg">
                        Between 3 - 25 characters
                    </p>
                </div>
                <!-- End of Title -->

                <!-- CATEGORY -->
                <div style="display:inline-block; width: 40%;float: right;">
                    <h3 class="mdc-typography--title" style="margin-top:20px;"><?php echo $dropdownHeading; ?></h3>
                    <div id="category-select" class="mdc-select" role="listbox" tabindex="0" style=" display:flex; position: relative; min-width: 100%;">
                        <em class="material-icons mdc-theme--text-hint-on-light ">label</em>&nbsp;<!--icon-->

                        <?php
                        $cat_terms = get_terms('vrodos_asset3d_cat', ['hide_empty' => false]);
                        $saved_term = wp_get_post_terms( $asset_id, 'vrodos_asset3d_cat' );
                        ?>

                        <?php if($asset_id == null) { ?>
                            <span id="currently-selected-category" class="mdc-select__selected-text mdc-typography--subheading2">
                        No category selected
                    </span>
                        <?php } else {  ?>
                            <span data-cat-desc="<?php echo $saved_term[0]->description; ?>"
                                  data-cat-slug="<?php echo $saved_term[0]->slug; ?>"
                                  data-cat-id="<?php echo $saved_term[0]->term_id; ?>"
                                  id="currently-selected-category" class="mdc-select__selected-text mdc-typography--subheading2">
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

                                    /* if (  strpos($term->name, "Points") !== false ) {
                                         continue;
                                     } */?>

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

                    <span style="font-style: italic; display:flex; position: relative; min-width: 100%;"
                          class="mdc-typography--caption mdc-theme--text-secondary-on-light"
                          id="categoryDescription"></span>
                    <input id="termIdInput" type="hidden" name="term_id" value="">
                </div>


                <!-- 3D Models -->
                <!-- Hidden fields for 3D models -->
                <input type="hidden" name="objFileInput" value="" id="objFileInput" />
                <input type="hidden" name="mtlFileInput" value="" id="mtlFileInput" />
                <input type="hidden" name="pdbFileInput" value="" id="pdbFileInput" />
                <input type="hidden" name="fbxFileInput" value="" id="fbxFileInput" />
                <input type="hidden" name="glbFileInput" value="" id="glbFileInput" />

                <div style="display:flex; width: 100%;">

                    <div style="display:inline-block; width: 40%;float: left;">

                        <h3 class="mdc-typography--title">3D Model</h3>

                        <!-- Select type of 3D format files -->
                        <!--TODO Create a different 3d type handler-->

                        <img alt="3D model section"
                             src="<?php echo plugins_url( '../images/cube.png', dirname(__FILE__)  );?>">
                        <label id="fileUploadInputLabel" for="multipleFilesInput"> File selection </label>

                        <!--<input id="fileUploadInput"
                               class="FullWidth" type="file"
                               name="multipleFilesInput[]"
                               value="" multiple accept=".obj,.mtl,.jpg,.png,.fbx,.pdb,.glb"
                               onclick="clearList()"/>-->

                        <input id="fileUploadInput"
                               class="FullWidth" type="file"
                               name="multipleFilesInput[]"
                               value="" accept=".glb"
                               onclick="clearList()"/>

                        <!-- For currently selected -->
                        <div id="fileList3D" style="margin-left:5px"></div>

                        <!-- For already stored files -->
                        <?php print_r($_FILES, true) ?>
                    </div>

                    <div style="display:inline-block; width: 40%;float: right;">

                        <h3 class="mdc-typography--title">Screenshot</h3>
                        <?php
                        if($asset_id==null) {
                            $scrnImageURL = plugins_url( '../images/ic_sshot.png', dirname(__FILE__));
                        } else {
                            $scrnImageURL = wp_get_attachment_url( get_post_meta($asset_id, "vrodos_asset3d_screenimage",true) );

                            if ($scrnImageURL == false) {
                                $scrnImageURL = plugins_url( '../images/ic_sshot.png', dirname(__FILE__));
                            }
                        }
                        ?>
                        <img id = "sshotPreviewImg" src="<?php echo $scrnImageURL ?>" alt="Asset Screenshot image">


                        <input type="hidden" name="sshotFileInput" value=""
                               id="sshotFileInput" accept="image/png"/>

                        <a id="createModelScreenshotBtn" type="button"
                           class="mdc-button mdc-button--primary mdc-theme--primary"
                           data-mdc-auto-init="MDCRipple">
                            Create screenshot
                        </a>

                        <div id="assetback3dcolordiv" class="mdc-textfield mdc-textfield--textarea"
                             data-mdc-auto-init="MDCTextfield">
                            <label for="jscolorpick" style="display:none">Color pick</label>
                            <input id="jscolorpick"
                                   class="jscolor {onFineChange:'updateColorPicker(this, asset_viewer_3d_kernel)'}" value="000000">

                            <label for="assetback3dcolor" class="mdc-textfield__label">BG color</label>
                            <input type="text" id="assetback3dcolor" class="mdc-textfield__input"
                                   name="assetback3dcolor" form="3dAssetForm" value="<?php echo trim($asset_back_3d_color_saved); ?>" />
                        </div>

                    </div>

                </div>


                <input type="hidden" id="assettrs" class="mdc-textfield__input"
                       name="assettrs" form="3dAssetForm" value="<?php echo trim($assettrs_saved); ?>" />


                <!-- Audio -->
                <div id="audioDetailsPanel" style="display: none">

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

                <!-- End of 3D -->

                <h3 class="mdc-typography--title">Description</h3>
                <div class="mdc-textfield mdc-textfield--textarea"
                     data-mdc-auto-init="MDCTextfield" style="border: 1px solid rgba(0, 0, 0, 0.3);">
                    <label for="assetDescription" class="mdc-textfield__label"
                           style="background: none;">Add a description</label>
                    <textarea id="assetDescription" name="assetDescription"
                              class="mdc-textfield__input"
                              rows="4"  style="box-shadow: none;"
                              type="text" form=""><?php echo $asset_description_value; ?></textarea>

                </div>

                <!--  Select font for text -->
                <!--<div id="assetFontsDiv">
                    <h3 id="assetFontsLabel" for="assetFonts" class="mdc-typography--title">Fonts</h3>
                    <input id="assetFonts" class="mdc-textfield__input"
                           name="assetFonts" form="3dAssetForm" value="<?php /*echo trim($asset_fonts_saved); */?>">
                    <script>
                        jQuery('#assetFonts').fontselect().on('change', function() { applyFont(this.value); });
                    </script>
                </div>-->


                <hr class="whiteSpaceSeparatorAssetEditor" />



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

                <div id="assetTitleView"><?php echo $asset_title_value;?></div>

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


            <!-- CATEGORY IPR -->
            <div style="display:<?php echo (($isOwner || $isUserAdmin) && $isEditMode)?'inline-block':'none';?> width: 40%; float: left; padding-bottom: 24px;">
                <div id="ipr-div">

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

                    <span class="mdc-typography--subheading2 mdc-theme--text-secondary-on-light" id="categoryIPRDescription"></span>
                    <input id="termIdInputIPR" type="hidden" name="term_id_ipr" value="">

                </div>
            </div>

        </form>

    </div>

    <script type="text/javascript">
        'use strict';

        hideAdminBar();

        let mdc = window.mdc;
        mdc.autoInit();

        let back_3d_color = "<?php echo $back_3d_color; ?>";

        document.getElementById("jscolorpick").value = back_3d_color;

        generateQRcode();

        let audio_file = document.getElementById( 'audioFile' );

        let isLoggedIn = <?php echo $isUserloggedIn ? 1: 0; ?>;
        let isEditMode = (isLoggedIn === 1) ? <?php echo $_GET['preview'] === '1' ? 0 : 1; ?> : 0 ;

        console.log("isEditModeA:", isEditMode);

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
            null,
            null,
            null,
            null,
            glb_file_name,
            null,
            false,
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
        if( isEditMode === 1) {
            // clear canvas and divs for fields
            // vrodos_reset_panels(asset_viewer_3d_kernel, "initial script");
            var sshotPreviewDefaultImg = document.getElementById("sshotPreviewImg").src; // Leave this as var, so it can get accessed by external js file. (TODO: REWORK)

            (function() {

                let MDCSelect = mdc.select.MDCSelect;
                const categoryDropdown = new MDCSelect(document.getElementById('category-select'));
                const IPRDropdown = new MDCSelect(document.getElementById('category-ipr-select'));

                let selectedCatElement = document.getElementById('currently-selected-category');
                let selectedCatId = selectedCatElement.getAttribute("data-cat-id");

                categoryDropdown.listen('MDCSelect:change', () => {
                    loadLayout(true);
                    console.log(`Selected option at index ${categoryDropdown.selectedIndex} with value "${categoryDropdown.value}"`);
                });

                let selectedCatIPRId = jQuery('#currently-ipr-selected').attr("data-cat-ipr-id");
                IPRDropdown.listen('MDCSelect:change', () => {
                    // Change the description of the popup
                    jQuery("#categoryIPRDescription")[0].innerHTML =  IPRDropdown.selectedOptions[0].getAttribute("data-cat-ipr-desc");

                    // Change the value of termIdInputIPR
                    jQuery("#termIdInputIPR").attr( "value", IPRDropdown.selectedOptions[0].getAttribute("id") );
                });

                // This fires on start to clear layout if no category is selected
                jQuery( document ).ready(function() {

                    if (selectedCatId) {
                        document.getElementById(selectedCatId).setAttribute("aria-selected", true);
                        loadLayout(false);
                    }

                    if (jQuery('#currently-ipr-selected').attr("data-cat-ipr-id")) {
                        jQuery('#'+ selectedCatIPRId).attr("aria-selected", true);
                        jQuery('#category-ipr-select').addClass('mdc-select--disabled').attr( "aria-disabled", true);
                    }

                });

                // Function to initialize layout
                // parameter denotes if new asset or edit asset
                function loadLayout(hasCategory) {

                    //vrodos_reset_panels(asset_viewer_3d_kernel, "loadlayout");
                    asset_viewer_3d_kernel.resizeDisplayGL();

                    document.getElementById('formSubmitBtn').disabled = false;

                    let descText = document.getElementById('categoryDescription');

                    if(hasCategory) {
                        descText.innerHTML = categoryDropdown.selectedOptions[0].getAttribute("data-cat-desc");
                        document.getElementById('termIdInput').setAttribute('value', categoryDropdown.value);

                    } else {
                        descText.innerHTML = document.getElementById('currently-selected-category').getAttribute("data-cat-desc");
                        document.getElementById('termIdInput').setAttribute('value', selectedCatId);
                    }
                }

            })();

        } else {

            console.log("isEditMode:" + isEditMode);

            // View mode: Show only the description mentioned in anchor #
            let url = window.location.href;
            let langcurr = url.substring(url.indexOf("#") + 1);
            jQuery("#" + langcurr + ".tabcontent2")[0].style.display = "block";

            // Show slide 0 of images sequence
            showSlides(slideIndex);
        }

    </script>
