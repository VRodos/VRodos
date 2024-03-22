<?php
// Remove the admin bar
//add_action('get_header', 'vrodos_remove_admin_login_header');

wp_enqueue_style('vrodos_frontend_stylesheet');
wp_enqueue_style('vrodos_material_stylesheet');

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
        let poi_image_filename = null;
        let no_img_path = '<?php echo plugins_url( '../images/ic_sshot.png', dirname(__FILE__)); ?>';
    </script>

<?php

// ============================================
// Submit Handler
//=============================================
if(isset($_POST['submitted']) && isset($_POST['post_nonce_field']) && wp_verify_nonce($_POST['post_nonce_field'],
        'post_nonce')) {

    $assetTitle = isset($_POST['assetTitle']) ? esc_attr(strip_tags($_POST['assetTitle'])) : '';
    $assetCatID = intval($_POST['term_id']); //ID of Asset Category (hidden input)
    $assetCatTerm = get_term_by('id', $assetCatID, 'vrodos_asset3d_cat');

    $assetFonts = isset($_POST['assetFonts']) ? esc_attr(strip_tags($_POST['assetFonts'])) : '';

    $assetback3dcolor = esc_attr(strip_tags($_POST['assetback3dcolor']));
    $assettrs = esc_attr(strip_tags($_POST['assettrs']));

    $assetCatIPRID = intval($_POST['term_id_ipr']); //ID of Asset Category IPR (hidden input)
    $assetCatIPRTerm = get_term_by('id', $assetCatIPRID, 'vrodos_asset3d_ipr_cat');

    $asset_updatedConf = 0;
    // NEW Asset: submit info to backend

    if($asset_id == null) { ?>
        <!-- css ref is not recognized in the following, therefore CSS should be written inline -->
        <div style="position: absolute; top: 50%; left: 50%; margin-right: -50%; transform: translate(-50%, -50%);font-size: x-large">Creating asset...</div>
        <?php
        // It's a new Asset, let's create it (returns newly created ID, or 0 if nothing happened)
        $asset_id = vrodos_create_asset_frontend($assetPGameID, $assetCatID, $gameSlug, $assetCatIPRID, $assetTitle, $assetFonts, $assetback3dcolor, $assettrs, '');
    }
    else { ?>
        <div class='centerMessageAssetSubmit'>Updating asset...</div>
        <?php
        // Edit an existing asset: Return true if updated, false if failed
        $asset_updatedConf = vrodos_update_asset_frontend($assetPGameID, $assetCatID, $asset_id, $assetCatIPRID, $assetTitle, $assetFonts, $assetback3dcolor, $assettrs, '');
    }


    // Upload 3D files
    if($asset_id != 0 || $asset_updatedConf == 1) {

        // NoCloning: Upload files from POST but check first
        // if any 3D files have been selected for upload
        if (count($_FILES['multipleFilesInput']['name']) > 0 && $_FILES['multipleFilesInput']['error'][0] != 4 ){
            vrodos_create_asset_3DFilesExtra_frontend($asset_id, $project_id, $assetCatID);
        }

        update_post_meta($asset_id, 'vrodos_asset3d_isCloned', 'false');
        update_post_meta($asset_id, 'vrodos_asset3d_isJoker', $isJoker);
    }

    if (isset($_POST['sshotFileInput']) && !empty($_POST['sshotFileInput']) ) {
        vrodos_upload_asset_screenshot($_POST['sshotFileInput'], $asset_id, $project_id);
    }

    // Save custom parameters according to asset type.
    switch ($assetCatTerm->slug) {

        case 'video':
            if (isset($_FILES['videoFileInput'])) {
                vrodos_create_asset_addVideo_frontend($asset_id);
            }
            if (isset($_POST['videoSshotFileInput'])) {
                vrodos_upload_asset_screenshot($_POST['videoSshotFileInput'], $asset_id, $project_id);
            }
            update_post_meta($asset_id, 'vrodos_asset3d_video_title', sanitize_text_field($_POST['videoTitle']));
            update_post_meta($asset_id, 'vrodos_asset3d_video_autoloop', isset($_POST['video_autoloop_checkbox']));
            break;

        case 'poi-imagetext':

            $existing_img = $_FILES['imageFileInput'];
            if ( $existing_img['error'] != 4  ) {
                vrodos_create_asset_addImages_frontend($asset_id, $_FILES['imageFileInput']);
            }

            update_post_meta($asset_id, 'vrodos_asset3d_poi_imgtxt_title', sanitize_text_field($_POST['poiImgTitle']));
            update_post_meta($asset_id, 'vrodos_asset3d_poi_imgtxt_content', sanitize_text_field($_POST['poiImgDescription']));

            break;

        case 'poi-link':
            update_post_meta($asset_id, 'vrodos_asset3d_link', $_POST['assetLinkInput']);
            break;

        case 'chat':
            update_post_meta($asset_id, 'vrodos_asset3d_poi_chattxt_title', $_POST['poiChatTitle']);
            update_post_meta($asset_id, 'vrodos_asset3d_poi_chatnum_people', $_POST['poiChatNumPeople']);
            update_post_meta($asset_id, 'vrodos_asset3d_poi_chatbut_indicators', isset($_POST['poiChatIndicators']));
            break;

        default:
            break;
    }

    // Audio: To add
    // vrodos_create_asset_addAudio_frontend($asset_id);

    if (isset($_GET['vrodos_asset'])) {
        echo '<script>window.location.href = "'.$_SERVER['HTTP_REFERER'].'"</script>';
    } else {
        echo '<script>window.location.href = "'.$_SERVER['HTTP_REFERER'].'&vrodos_asset='.$asset_id.'";</script>';
    }
    return ;
}

//---------------------------- End of handle Submit  -------------------------

// When asset was created in the past and now we want to edit it. We should get the attachments glb
if($asset_id != null) {

    // Get post
    $asset_post = get_post($asset_id);

    // Get post meta
    $assetpostMeta = get_post_meta($asset_id);

    // Background color in canvas
    $back_3d_color = $assetpostMeta['vrodos_asset3d_back3dcolor'] ? $assetpostMeta['vrodos_asset3d_back3dcolor'][0] : '#ffffff';

    // Font type for text
    $fonts = $assetpostMeta['vrodos_asset3d_fonts'][0];
    $curr_font = str_replace("+", " ", $fonts);

    $asset_3d_files = get_3D_model_files($assetpostMeta, $asset_id);

    ?>

    <script>
        glb_file_name= "<?php echo $asset_3d_files['glb'];?>";
        poi_image_filename = "<?php wp_get_attachment_url( get_post_meta($asset_id, "vrodos_asset3d_poi_imgtxt_image",true) );?>"
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

<?php if ( !is_user_logged_in() || !current_user_can('administrator') ) {
    $pluginpath = str_replace('\\','/', dirname(plugin_dir_url( __DIR__  )) );
    ?>

    <div class="DisplayBlock CenterContents">

        <img style="margin-top:10px;" src="<?php echo $pluginpath;?>/images/screenshots/authtoolimage.jpg"
             width="960px;" alt="editor screenshot" />
        <br />
        <i style="font-size: 64px; padding-top: 10px;" class="material-icons mdc-theme--text-icon-on-background">account_circle</i>
        <p class="mdc-typography--title"> Please <a class="mdc-theme--secondary" href="<?php echo wp_login_url( get_permalink() ); ?>">login</a> to use platform
            Or <a class="mdc-theme--secondary" href="<?php echo wp_registration_url(); ?>">register</a> if you don't have an account</p>
    </div>


<?php } else { ?>

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
            <canvas id="previewCanvas">3D canvas</canvas>

            <a href="#" class="animationButton" id="animButton1" onclick="asset_viewer_3d_kernel.playStopAnimation();">Animation 1</a>
            <!--Bounds not working...-->
            <!--<a href="#" class="boundingSphereButton" id="boundSphButton" onclick="asset_viewer_3d_kernel.showHideBoundSphere();">Bounds</a>-->

            <!-- QR code -->
            <?php include 'vrodos-QRCodeGenerator.php'; ?>

        </div>


        <div id="text-asset-sidebar" class="asset_editor_textpanel">

            <div style="display: inline-block; width: 100%;">

            </div>

            <div style="text-align: left; width: 100%;">


                <a title="Back" class="vrodos-back-button hideAtLocked mdc-button" style="float:left; min-width: 0;" href="<?php echo $goBackToLink;?>">
                    <em style="font-size:32px;" class="material-icons arrowback">arrow_back</em></a>
                <?php


                // UPPER BUTTONS
                if($asset_id != null ){
                }?>
                <h2 style="display: inline-block; margin: 0  " class="mdc-typography--headline mdc-theme--text-primary-on-light" >Asset editor</h2>
                <!-- Author -->
                <!--<div class="mdc-typography--caption" style="display: inline-block; float: right;" >
                <img alt="Author image" class="AssetEditorAuthorImageStyle"
                     src="<?php /*echo get_avatar_url($author_id);*/?>">
                <a href="#" style="color:black; line-height: 48px; vertical-align: text-bottom">
                    <?php /*echo $author_displayname;*/?>
                </a>
            </div>-->

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
                <?php if(($isOwner || $isUserAdmin) ) { ?>

                <div style="display:flex; width: 100%;">
                    <!-- Title -->
                    <div class="assetEditorColumn">
                        <h3 class="mdc-typography--title" style="margin-bottom: 5px;">Title</h3>
                        <div class="mdc-textfield mdc-form-field" data-mdc-auto-init="MDCTextfield" style="margin-top: 0;">
                            <input id="assetTitle" type="text"
                                   class="mdc-textfield__input mdc-theme--text-primary-on-light"
                                   name="assetTitle"
                                   aria-controls="title-validation-msg" required minlength="3" maxlength="25"
                                   value="<?php echo $asset_title_value; ?>">

                            <label for="assetTitle" class="mdc-textfield__label">
                                Title of the asset
                            </label>

                            <div class="mdc-textfield__bottom-line"></div>
                        </div>

                        <p class="mdc-textfield-helptext mdc-textfield-helptext--validation-msg" id="title-validation-msg">
                            Between 3 - 25 characters
                        </p>
                    </div>
                    <!-- End of Title -->

                    <!-- CATEGORY -->
                    <div class="assetEditorColumn">

                        <h3 class="mdc-typography--title"><?php echo $dropdownHeading; ?></h3>
                        <div id="category-select" class="mdc-select" role="listbox" tabindex="0" style="min-width: 100%;">
                            <em class="material-icons mdc-theme--text-hint-on-light ">label</em>&nbsp;<!--icon-->
                            <?php

                            // Check if project is of MV type then dont show chat component.
                            $ids_to_exclude = array();
                            if ($game_category !== 'vrexpo_games') {
                                $get_terms_to_exclude =  get_terms(
                                    array(
                                        'fields'  => 'ids',
                                        'slug'    => array(
                                            'chat' ),
                                        'taxonomy' => 'vrodos_asset3d_cat',
                                    )
                                );
                                if( !is_wp_error( $get_terms_to_exclude ) && count($get_terms_to_exclude) > 0){
                                    $ids_to_exclude = $get_terms_to_exclude;
                                }
                            }

                            $cat_terms = get_terms(
                                'vrodos_asset3d_cat',
                                array(
                                    'hide_empty' => false,
                                    'exclude'    => $ids_to_exclude,
                                )
                            );

                            $saved_term = wp_get_post_terms( $asset_id, 'vrodos_asset3d_cat' );
                            if($asset_id == null) { ?>
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
                                        <span class="mdc-list-item__text">No category selected</span>
                                    </li>

                                    <?php foreach ( $cat_terms as $term ) {?>

                                        <li class="mdc-list-item mdc-theme--text-primary-on-background" role="option"
                                            data-cat-desc="<?php echo $term->description; ?>"
                                            data-value="<?php echo $term->slug; ?>"
                                            id="<?php echo $term->term_id?>"
                                            tabindex="0">
                                            <span class="mdc-list-item__text"><?php echo $term->name; ?></span>
                                        </li>

                                    <?php } ?>

                                </ul>
                            </div>
                        </div>

                        <span style="font-style: italic; min-width: 100%; line-height: 1rem;"
                              class="mdc-typography--caption mdc-theme--text-secondary-on-light"
                              id="categoryDescription"></span>
                        <input id="termIdInput" type="hidden" name="term_id" value="">
                    </div>

                </div>

                <div style="display:flex; width: 100%;">

                    <div id="glb_file_section" class="assetEditorColumn" style="display: <?php echo ($asset_id == null) ? 'none' : 'block' ?>">

                        <h3 class="mdc-typography--title">3D Model</h3>

                        <!-- Select type of 3D format files -->
                        <!--TODO Create a different 3d type handler-->

                        <img alt="3D model section" style="height: 64px;"
                             src="<?php echo plugins_url( '../images/cube.png', dirname(__FILE__)  );?>">
                        <label id="fileUploadInputLabel" for="multipleFilesInput"> File selection </label>

                        <input id="fileUploadInput"
                               class="FullWidth" type="file"
                               name="multipleFilesInput[]"
                               value="" accept=".glb"
                               onclick="clearList()"/>

                        <!-- For already stored files -->
                        <?php print_r($_FILES, true) ?>
                        <input type="hidden" name="glbFileInput" value="" id="glbFileInput" />
                        <input type="hidden" id="assettrs" class="mdc-textfield__input"
                               name="assettrs" form="3dAssetForm" value="<?php echo trim($assettrs_saved); ?>" />
                    </div>

                    <div class="assetEditorColumn" id="video_section" style="display: none;">
                        <h3 class="mdc-typography--title">Video</h3>

                        <div id="videoFileInputContainer">
                            <?php
                            $videoID = get_post_meta($asset_id, 'vrodos_asset3d_video', true);
                            $video_attachment_post = get_post($videoID);
                            $video_attachment_file = $video_attachment_post->guid; ?>
                            <label for="videoFileInput">Select a video</label>
                            <br />
                            <video width="320" height="240" id="assetVideoTag" style="width:60%" preload="auto" controls>
                                <source id="assetVideoSource" src="<?php echo $video_attachment_file;?>" type="video/mp4">
                            </video>
                            <input class="FullWidth" type="file" name="videoFileInput" id="videoFileInput" accept="video/mp4,video/webm"/>
                            <br />
                            <span id="video-description-label" class="mdc-typography--subheading1 mdc-theme--text-secondary-on-background">mp4 &amp; webm files are supported.</span>
                        </div>
                    </div>

                    <div id="screenshot_section" class="assetEditorColumn" style="float: right; display: <?php echo ($asset_id == null) ? 'none' : 'block' ?>;">

                        <h3 class="mdc-typography--title">Screenshot</h3>
                        <?php
                        if($asset_id==null) {
                            $scrnImageURL = plugins_url( '../images/ic_sshot.png', dirname(__FILE__));
                        } else {
                            $scrnImageURL = wp_get_attachment_url( get_post_meta($asset_id, "vrodos_asset3d_screenimage",true) );

                            if ($scrnImageURL == false) {
                                $scrnImageURL = plugins_url( '../images/ic_sshot.png', dirname(__FILE__));
                            }
                        } ?>
                        <div style="float: left; width: 65%">
                            <img id="sshotPreviewImg" src="<?php echo $scrnImageURL ?>" alt="Asset Screenshot image">
                            <input type="hidden" name="sshotFileInput" value=""
                                   id="sshotFileInput" accept="image/png"/>
                        </div>

                        <div style="float:right; width: 30%;">
                            <div id="assetback3dcolordiv" class="mdc-textfield mdc-textfield--textarea"
                                 data-mdc-auto-init="MDCTextfield">
                                <label for="jscolorpick" style="display:none">Color pick</label>
                                <input id="jscolorpick" style="width: 80%; float:right;"
                                       class="jscolor {onFineChange:'updateColorPicker(this, asset_viewer_3d_kernel)'}" value="000000">

                                <label for="assetback3dcolor" class="mdc-textfield__label" style="padding: 0;text-align: center">BG color</label>
                                <input type="text" id="assetback3dcolor" class="mdc-textfield__input"
                                       name="assetback3dcolor" form="3dAssetForm" value="<?php echo trim($asset_back_3d_color_saved); ?>" />
                            </div>
                        </div>
                        <a id="createModelScreenshotBtn" type="button" style="margin-top:16px;"
                           class="mdc-button mdc-button--primary mdc-theme--primary FullWidth"
                           data-mdc-auto-init="MDCRipple">
                            Create screenshot
                        </a>
                    </div>

                    <div id="video_screenshot_section" class="assetEditorColumn" style="display:none; float: right;">

                        <h3 class="mdc-typography--title">Video Screenshot</h3>
                        <span style="font-style: italic; line-height: 1rem;" class="mdc-typography--caption mdc-theme--text-secondary-on-light">
                          Generated automatically during video seek
                    </span>
                        <div style="float: left; width: 100%">
                            <canvas id="videoSshotPreviewImg" style="overflow:auto"></canvas>
                            <input type="hidden" name="videoSshotFileInput"
                                   id="videoSshotFileInput" accept="image/png"/>
                        </div>

                    </div>
                </div>


                <div style="display:flex; width: 100%;">

                    <div class="assetEditorColumn" id="poi_image_text_section" style="display: none;">
                        <h3 class="mdc-typography--title">POI Details</h3>

                        <div class="mdc-textfield mdc-form-field" data-mdc-auto-init="MDCTextfield" style="margin-top: 0; width: 100%;">
                            <input id="poiImgTitle" type="text"
                                   class="mdc-textfield__input mdc-theme--text-primary-on-light"
                                   name="poiImgTitle"
                                   aria-controls="title-validation-msg" minlength="3" maxlength="50"
                                   value="<?php echo get_post_meta($asset_id,'vrodos_asset3d_poi_imgtxt_title', true);?>">

                            <label for="poiImgTitle" class="mdc-textfield__label">
                                Title
                            </label>

                            <div class="mdc-textfield__bottom-line"></div>
                        </div>
                        <p class="mdc-textfield-helptext mdc-textfield-helptext--validation-msg" id="title-validation-msg">
                            Between 3 - 25 characters
                        </p>

                        <div class="mdc-textfield mdc-textfield--textarea"
                             data-mdc-auto-init="MDCTextfield" style="border: 1px solid rgba(0, 0, 0, 0.3); width: 100%;">
                            <label for="poiImgDescription" class="mdc-textfield__label"
                                   style="background: none;">Add the text content</label>
                            <textarea id="poiImgDescription" name="poiImgDescription"
                                      class="mdc-textfield__input"
                                      style="box-shadow: none;" rows="10"
                                      type="text"><?php echo get_post_meta($asset_id,'vrodos_asset3d_poi_imgtxt_content', true);?></textarea>

                        </div>
                    </div>

                    <div id="poi_help_section" class="assetEditorColumn" style="display: none;">

                        <h3 class="mdc-typography--title" style="margin-bottom: 5px;">Chat Options</h3>

                        <div class="mdc-textfield mdc-form-field" data-mdc-auto-init="MDCTextfield" style="margin-top: 0; width: 100%;">
                            <input id="poiChatTitle" type="text"
                                   class="mdc-textfield__input mdc-theme--text-primary-on-light"
                                   name="poiChatTitle"
                                   aria-controls="title-chat-validation-msg" minlength="3" maxlength="50"
                                   value="<?php echo get_post_meta($asset_id,'vrodos_asset3d_poi_chattxt_title', true);?>">

                            <label for="poiChatTitle" class="mdc-textfield__label">
                                Chat Title (appears on entering chat)
                            </label>

                            <div class="mdc-textfield__bottom-line"></div>
                        </div>
                        <p class="mdc-textfield-helptext mdc-textfield-helptext--validation-msg" id="title-chat-validation-msg">
                            Between 3 - 25 characters
                        </p>


                        <?php $indicator_enabled = get_post_meta($asset_id,'vrodos_asset3d_poi_chatbut_indicators', true) ? 'checked' : ''; ?>

                        <input type="checkbox" title="Select if you want the video to automatically play. It will also autoloop" id="poiChatIndicators"
                               name="poiChatIndicators" class="mdc-checkbox mdc-form-field mdc-theme--text-primary-on-light" <?php echo $indicator_enabled; ?>/>
                        <label for="poiChatIndicators" class="mdc-typography--subheading2 mdc-theme--text-primary-on-light" style="vertical-align: middle; cursor: pointer;">Chat Indicator</label>

                        <h3 class="mdc-typography--title" style="margin-bottom: 5px;">Chat max participants</h3>

                        <div class="mdc-textfield mdc-form-field" data-mdc-auto-init="MDCTextfield" style="margin-top: 0; width: 100%;">
                            <label for="poiChatNumPeople" class="mdc-textfield__label">
                                -1 for unlimited | Max: 8
                            </label>
                            <input id="poiChatNumPeople" type="number"
                                   title="Number of participants"
                                   class="mdc-textfield__input mdc-theme--text-primary-on-light"
                                   name="poiChatNumPeople"
                                   min="-1"
                                   max="8"
                                   value="<?php echo get_post_meta($asset_id,'vrodos_asset3d_poi_chatnum_people', true);?>">
                            <div class="mdc-textfield__bottom-line"></div>

                        </div>


                    </div>

                    <div id="poi_link_section" class="assetEditorColumn" style="display: none;">
                        <h3 class="mdc-typography--title">Link</h3>
                        <div class="mdc-textfield mdc-textfield--textarea"
                             data-mdc-auto-init="MDCTextfield" style="border: 1px solid rgba(0, 0, 0, 0.3); margin-top:0;">
                                     <textarea id="assetLinkInput" name="assetLinkInput"
                                               class="mdc-textfield__input"
                                               style="box-shadow: none;" rows="5"
                                               type="text"><?php echo get_post_meta($asset_id,'vrodos_asset3d_link', true);?></textarea>
                            <label for="assetLinkInput" class="mdc-textfield__label"
                                   style="background: none;">Link to external target</label>
                        </div>
                    </div>

                    <div class="assetEditorColumn" id="video_options_section" style="display: none;">
                        <h3 class="mdc-typography--title">Video options</h3>

                        <div class="mdc-textfield mdc-form-field" data-mdc-auto-init="MDCTextfield" style="margin-top: 0; width: 100%;">
                            <?php
                            $video_title = get_post_meta($asset_id,'vrodos_asset3d_video_title', true);
                            $video_autoloop = get_post_meta($asset_id,'vrodos_asset3d_video_autoloop', true) ? 'checked' : '';

                            ?>
                            <input id="videoTitle" type="text"
                                   class="mdc-textfield__input mdc-theme--text-primary-on-light"
                                   name="videoTitle"
                                   aria-controls="title-validation-msg" minlength="3" maxlength="25"
                                   value="<?php echo $video_title; ?>">

                            <label for="videoTitle" class="mdc-textfield__label">
                                Video title (optional)
                            </label>

                            <div class="mdc-textfield__bottom-line"></div>
                        </div>

                        <p class="mdc-textfield-helptext mdc-textfield-helptext--validation-msg" id="title-validation-msg">
                            Between 3 - 25 characters
                        </p>

                        <input type="checkbox" title="Select if you want the video to automatically play. It will also autoloop" id="video_autoloop_checkbox"
                               name="video_autoloop_checkbox" class="mdc-checkbox mdc-form-field mdc-theme--text-primary-on-light" <?php echo $video_autoloop; ?>/>
                        <label for="video_autoloop_checkbox" class="mdc-typography--subheading2 mdc-theme--text-primary-on-light" style="vertical-align: middle; cursor: pointer;">Autoplay</label>
                    </div>

                    <div class="assetEditorColumn" id="poi_image_file_section" style="display: none;">
                        <h3 class="mdc-typography--title">Image file</h3>

                        <?php
                        if($asset_id==null) {
                            $imagePoiImageURL = plugins_url( '../images/ic_sshot.png', dirname(__FILE__));
                        } else {
                            $imagePoiImageURL = wp_get_attachment_url( get_post_meta($asset_id, "vrodos_asset3d_poi_imgtxt_image",true) );


                            if ($imagePoiImageURL == false) {
                                $imagePoiImageURL = plugins_url( '../images/ic_sshot.png', dirname(__FILE__));
                            }
                        }?>

                        <img style=" width: auto; height: 100px; " id="imagePoiPreviewImg" src="<?php echo $imagePoiImageURL; ?>" alt="Asset Image Text POI image">

                        <input type="file" name="imageFileInput" value=""
                               id="imageFileInput" accept="image/png, image/jpg, image/jpeg"/>

                    </div>


                </div>

                <!-- CATEGORY IPR -->
                <!--<div id="ipr_section" class="assetEditorColumn" style="display:<?php /*echo (($isOwner || $isUserAdmin) && $isEditMode)?'block':'none';*/?> padding-bottom: 24px;">-->
                <div id="ipr_section" class="assetEditorColumn" style="display: none; padding-bottom: 24px;">

                    <h3 class="mdc-typography--title">Select an IPR plan</h3>
                    <div id="category-ipr-select" class="mdc-select" role="listbox" tabindex="0" style="min-width: 80%;">
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

                    <span class="mdc-typography--caption mdc-theme--text-secondary-on-light" id="categoryIPRDescription"></span>
                    <input id="termIdInputIPR" type="hidden" name="term_id_ipr" value="">
                </div>

            </form>

        </div>


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


        <!--  Select font for text -->
        <!--<div id="assetFontsDiv">
                    <h3 id="assetFontsLabel" for="assetFonts" class="mdc-typography--title">Fonts</h3>
                    <input id="assetFonts" class="mdc-textfield__input"
                           name="assetFonts" form="3dAssetForm" value="<?php /*echo trim($asset_fonts_saved); */?>">
                    <script>
                        jQuery('#assetFonts').fontselect().on('change', function() { applyFont(this.value); });
                    </script>
                </div>-->


        <?php } ?>


    </div>


    <script type="text/javascript">
        'use strict';

        const assetVideoSrc = document.getElementById("assetVideoSource");
        const assetVideoTag = document.getElementById("assetVideoTag");

        const videoInputTag = document.getElementById("videoFileInput");
        const videoSshotCanvas = document.getElementById("videoSshotPreviewImg");
        const videoSshotFileInput = document.getElementById("videoSshotFileInput");

        const multipleFilesInputElem = document.getElementById( 'fileUploadInput' );

        let back_3d_color = "<?php echo $back_3d_color; ?>";
        document.getElementById("jscolorpick").value = back_3d_color;

        let isLoggedIn = <?php echo $isUserloggedIn ? 1: 0; ?>;
        let isEditMode = (isLoggedIn === 1) ? 1 : 0 ;
        console.log("isEditModeA:", isEditMode);

        let assettrs = document.getElementById( 'assettrs') ? document.getElementById( 'assettrs' ).value : "<?php echo $assettrs_saved; ?>";

        let mdc = window.mdc;
        mdc.autoInit();

        assetVideoTag.addEventListener('loadeddata', function() {
            generateVideoSshot(videoSshotCanvas, assetVideoTag);
        }, false);
        assetVideoTag.addEventListener('seeked', function(){
            generateVideoSshot(videoSshotCanvas, assetVideoTag);
        });

        generateQRcode();
        setScreenshotHandler();

        // ------- Class to load 3D model ---------
        let asset_viewer_3d_kernel = new VRodos_AssetViewer_3D_kernel(document.getElementById( 'previewCanvas' ),
            document.getElementById( 'previewCanvasLabels' ),
            document.getElementById('animButton1'),
            document.getElementById('previewProgressLabel'),
            document.getElementById('previewProgressSliderLine'),
            back_3d_color,
            null,
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

        addHandlerFor3Dfiles(asset_viewer_3d_kernel, multipleFilesInputElem);

        // Load existing 3D models
        // asset_viewer_3d_kernel.loader_asset_exists( path_url, mtl_file_name, obj_file_name, pdb_file_name, fbx_file_name,
        //                                                      glb_file_name, textures_fbx_string_connected);


        // Select category handler
        if( isEditMode === 1) {
            // clear canvas and divs for fields
            // vrodos_reset_panels(asset_viewer_3d_kernel, "initial script");
            var sshotPreviewDefaultImg = document.getElementById("sshotPreviewImg").src; // Leave this as var, so it can get accessed by external js file. (TODO: REWORK)

            (function() {

                let MDCSelect = mdc.select.MDCSelect;
                const categoryDropdown = new MDCSelect(document.getElementById('category-select'));
                const IPRDropdown = new MDCSelect(document.getElementById('category-ipr-select'));

                let preSelectedCatId = document.getElementById('currently-selected-category').getAttribute("data-cat-id");

                categoryDropdown.listen('MDCSelect:change', () => {
                    let currentSlug = updateSelectComponent(true);
                    resetCategory();
                    loadLayout(currentSlug);
                });

                let resetCategory = () => {
                    // Clear file list
                    clearList();
                    document.getElementById('glb_file_section').style.display = "block";
                    document.getElementById('screenshot_section').style.display = "block";
                    document.getElementById('ipr_section').style.display = "none";
                    document.getElementById('poi_help_section').style.display = "none";
                    document.getElementById('poi_link_section').style.display = "none";
                    document.getElementById('video_section').style.display = "none";
                    document.getElementById('video_options_section').style.display = "none";
                    document.getElementById('video_screenshot_section').style.display = "none";
                    document.getElementById('poi_image_text_section').style.display = "none";
                    document.getElementById('poi_image_file_section').style.display = "none";

                };

                let loadLayout = (slug) => {
                    switch (slug) {

                        case "chat":
                            document.getElementById('ipr_section').style.display = "none";
                            document.getElementById('poi_help_section').style.display = "block";
                            break;

                        case "poi-imagetext":
                            document.getElementById('poi_image_text_section').style.display = "block";
                            document.getElementById('poi_image_file_section').style.display = "block";

                            break;
                        case "poi-link":
                            document.getElementById('poi_link_section').style.display = "block";
                            break;
                        case "video":
                            document.getElementById('glb_file_section').style.display = "none";
                            document.getElementById('screenshot_section').style.display = "none";
                            document.getElementById('video_section').style.display = "block";
                            document.getElementById('video_options_section').style.display = "block";
                            document.getElementById('video_screenshot_section').style.display = "block";

                            break;
                        default:
                            break;

                    }
                };

                let selectedCatIPRId = jQuery('#currently-ipr-selected').attr("data-cat-ipr-id");
                IPRDropdown.listen('MDCSelect:change', () => {
                    // Change the description of the popup
                    jQuery("#categoryIPRDescription")[0].innerHTML =  IPRDropdown.selectedOptions[0].getAttribute("data-cat-ipr-desc");

                    // Change the value of termIdInputIPR
                    jQuery("#termIdInputIPR").attr( "value", IPRDropdown.selectedOptions[0].getAttribute("id") );
                });

                // This fires on start to clear layout if no category is selected
                jQuery( document ).ready(function() {

                    // Load preselected asset cat
                    if (preSelectedCatId) {
                        document.getElementById(preSelectedCatId).setAttribute("aria-selected", true);
                        let catSlug = updateSelectComponent(false);
                        loadLayout(catSlug);
                    }

                    // Load preselected ipr cat cat
                    if (jQuery('#currently-ipr-selected').attr("data-cat-ipr-id")) {
                        jQuery('#'+ selectedCatIPRId).attr("aria-selected", true);
                        jQuery('#category-ipr-select').addClass('mdc-select--disabled').attr( "aria-disabled", true);
                    }

                    // Create listener for video tag
                    videoInputTag.addEventListener('change',  readVideo);

                });

                // Function to initialize layout
                // parameter denotes if new asset or edit asset
                function updateSelectComponent(hasValue) {

                    //vrodos_reset_panels(asset_viewer_3d_kernel, "loadlayout");
                    asset_viewer_3d_kernel.resizeDisplayGL();
                    if (document.getElementById('formSubmitBtn')) {
                        document.getElementById('formSubmitBtn').disabled = false;
                    }

                    let descText = document.getElementById('categoryDescription');

                    let slug = '';

                    if(hasValue) {
                        document.getElementById('termIdInput').setAttribute('value', categoryDropdown.value);
                        descText.innerHTML = document.getElementById(categoryDropdown.value).getAttribute("data-cat-desc");
                        slug = document.getElementById(categoryDropdown.value).getAttribute("data-value");

                    } else {
                        document.getElementById('termIdInput').setAttribute('value', preSelectedCatId);
                        descText.innerHTML = document.getElementById('currently-selected-category').getAttribute("data-cat-desc");
                        slug = document.getElementById('currently-selected-category').getAttribute("data-cat-slug");
                    }
                    return slug;
                }


                document.getElementById('imageFileInput').onchange = function (evt) {

                    let tgt = evt.target || window.event.srcElement,
                        files = tgt.files;

                    // FileReader support
                    if (FileReader && files && files.length) {
                        let fr = new FileReader();
                        fr.onload = function () {
                            document.getElementById('imagePoiPreviewImg').src = fr.result;
                        }
                        fr.readAsDataURL(files[0]);
                    }
                    else {
                        document.getElementById('imagePoiPreviewImg').src = no_img_path;
                    }
                }

            })();
        }

        let readVideo = (event) => {
            if (event.target.files && event.target.files[0]) {
                let reader = new FileReader();

                reader.onload = function(e) {
                    assetVideoSrc.src = e.target.result
                    assetVideoTag.load();
                }.bind(this)
                reader.readAsDataURL(event.target.files[0]);
            }
        };

        let generateVideoSshot = (canvas, video) => {
            let ctx = canvas.getContext('2d');
            ctx.drawImage( video, 0, 0, 320, 240);
            videoSshotFileInput.value = canvas.toDataURL('image/png');
        };

    </script>

<?php } ?>