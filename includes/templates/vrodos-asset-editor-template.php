<?php
// Is on back or front end ?
$isAdmin = is_admin() ? 'back' : 'front';

$data = VRodos_Asset_CPT_Manager::prepare_asset_editor_template_data();
extract($data);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>VRodos</title>
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php if ( !is_user_logged_in() || !current_user_can('administrator') ) { ?>

    <div class="DisplayBlock CenterContents">

        <img style="margin-top:10px;" src="<?php echo esc_url($login_promo_url); ?>"
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
                            <?php if (empty($saved_term)) { ?>
                                <span id="currently-selected-category" class="mdc-select__selected-text mdc-typography--subheading2">
                                    No category selected
                                </span>
                            <?php } else { ?>
                                <span data-cat-desc="<?php echo esc_attr($saved_term[0]->description); ?>"
                                      data-cat-slug="<?php echo esc_attr($saved_term[0]->slug); ?>"
                                      data-cat-id="<?php echo esc_attr($saved_term[0]->term_id); ?>"
                                      id="currently-selected-category" class="mdc-select__selected-text mdc-typography--subheading2">
                                    <?php echo esc_html($saved_term[0]->name); ?>
                                </span>
                            <?php } ?>

                            <div class="mdc-simple-menu mdc-select__menu">
                                <ul class="mdc-list mdc-simple-menu__items">

                                    <li class="mdc-list-item mdc-theme--text-hint-on-light" role="option" aria-disabled="true"
                                        tabindex="-1" style="pointer-events: none;">
                                        <span class="mdc-list-item__text">No category selected</span>
                                    </li>

                                    <?php foreach ($cat_terms as $term) { ?>
                                        <li class="mdc-list-item mdc-theme--text-primary-on-background" role="option"
                                            data-cat-desc="<?php echo esc_attr($term->description); ?>"
                                            data-value="<?php echo esc_attr($term->slug); ?>"
                                            id="<?php echo esc_attr($term->term_id); ?>"
                                            tabindex="0">
                                            <span class="mdc-list-item__text"><?php echo esc_html($term->name); ?></span>
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
                             src="<?php echo esc_url($glb_icon_url); ?>">
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
                            <label for="videoFileInput">Select a video</label>
                            <br />
                            <video width="320" height="240" id="assetVideoTag" style="width:60%" preload="auto" controls>
                                <source id="assetVideoSource" src="<?php echo esc_url($video_attachment_file); ?>" type="video/mp4">
                            </video>
                            <input class="FullWidth" type="file" name="videoFileInput" id="videoFileInput" accept="video/mp4,video/webm"/>
                            <br />
                            <span id="video-description-label" class="mdc-typography--subheading1 mdc-theme--text-secondary-on-background">mp4 &amp; webm files are supported.</span>
                        </div>
                    </div>

                    <div id="screenshot_section" class="assetEditorColumn" style="float: right; display: <?php echo ($asset_id == null) ? 'none' : 'block' ?>;">
                        <h3 class="mdc-typography--title">Screenshot</h3>
                        <div style="float: left; width: 65%">
                            <img id="sshotPreviewImg" src="<?php echo esc_url($scrnImageURL); ?>" alt="Asset Screenshot image">
                            <input type="hidden" name="sshotFileInput" value="" id="sshotFileInput" accept="image/png"/>
                        </div>
                        <div style="float:right; width: 30%;">
                            <div id="assetback3dcolordiv" class="mdc-textfield mdc-textfield--textarea" data-mdc-auto-init="MDCTextfield">
                                <label for="jscolorpick" style="display:none">Color pick</label>
                                <input id="jscolorpick" style="width: 80%; float:right;" class="jscolor {onFineChange:'updateColorPicker(this, asset_viewer_3d_kernel)'}" value="000000">
                                <label for="assetback3dcolor" class="mdc-textfield__label" style="padding: 0;text-align: center">BG color</label>
                                <input type="text" id="assetback3dcolor" class="mdc-textfield__input" name="assetback3dcolor" form="3dAssetForm" value="<?php echo esc_attr(trim($asset_back_3d_color_saved)); ?>" />
                            </div>
                        </div>
                        <a id="createModelScreenshotBtn" type="button" style="margin-top:16px;" class="mdc-button mdc-button--primary mdc-theme--primary FullWidth" data-mdc-auto-init="MDCRipple">
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
                            <input type="hidden" name="videoSshotFileInput" id="videoSshotFileInput" accept="image/png"/>
                        </div>
                    </div>
                </div>

                <div style="display:flex; width: 100%;">
                    <div class="assetEditorColumn" id="poi_image_text_section" style="display: none;">
                        <h3 class="mdc-typography--title">POI Details</h3>
                        <div class="mdc-textfield mdc-form-field" data-mdc-auto-init="MDCTextfield" style="margin-top: 0; width: 100%;">
                            <input id="poiImgTitle" type="text" class="mdc-textfield__input mdc-theme--text-primary-on-light" name="poiImgTitle" aria-controls="title-validation-msg" minlength="3" maxlength="50" value="<?php echo esc_attr($poi_img_title); ?>">
                            <label for="poiImgTitle" class="mdc-textfield__label">Title</label>
                            <div class="mdc-textfield__bottom-line"></div>
                        </div>
                        <p class="mdc-textfield-helptext mdc-textfield-helptext--validation-msg" id="title-validation-msg">
                            Between 3 - 25 characters
                        </p>
                        <div class="mdc-textfield mdc-textfield--textarea" data-mdc-auto-init="MDCTextfield" style="border: 1px solid rgba(0, 0, 0, 0.3); width: 100%;">
                            <label for="poiImgDescription" class="mdc-textfield__label" style="background: none;">Add the text content</label>
                            <textarea id="poiImgDescription" name="poiImgDescription" class="mdc-textfield__input" style="box-shadow: none;" rows="10" type="text"><?php echo esc_textarea($poi_img_content); ?></textarea>
                        </div>
                    </div>

                    <div id="poi_help_section" class="assetEditorColumn" style="display: none;">
                        <h3 class="mdc-typography--title" style="margin-bottom: 5px;">Chat Options</h3>
                        <div class="mdc-textfield mdc-form-field" data-mdc-auto-init="MDCTextfield" style="margin-top: 0; width: 100%;">
                            <input id="poiChatTitle" type="text" class="mdc-textfield__input mdc-theme--text-primary-on-light" name="poiChatTitle" aria-controls="title-chat-validation-msg" minlength="3" maxlength="50" value="<?php echo esc_attr($poi_chat_title); ?>">
                            <label for="poiChatTitle" class="mdc-textfield__label">
                                Chat Title (appears on entering chat)
                            </label>
                            <div class="mdc-textfield__bottom-line"></div>
                        </div>
                        <p class="mdc-textfield-helptext mdc-textfield-helptext--validation-msg" id="title-chat-validation-msg">
                            Between 3 - 25 characters
                        </p>
                        <input type="checkbox" title="Select if you want the video to automatically play. It will also autoloop" id="poiChatIndicators" name="poiChatIndicators" class="mdc-checkbox mdc-form-field mdc-theme--text-primary-on-light" <?php echo $poi_chat_indicators; ?>/>
                        <label for="poiChatIndicators" class="mdc-typography--subheading2 mdc-theme--text-primary-on-light" style="vertical-align: middle; cursor: pointer;">Chat Indicator</label>
                        <h3 class="mdc-typography--title" style="margin-bottom: 5px;">Chat max participants</h3>
                        <div class="mdc-textfield mdc-form-field" data-mdc-auto-init="MDCTextfield" style="margin-top: 0; width: 100%;">
                            <label for="poiChatNumPeople" class="mdc-textfield__label">Max: 8</label>
                            <input id="poiChatNumPeople" type="number" title="Number of participants" class="mdc-textfield__input mdc-theme--text-primary-on-light" name="poiChatNumPeople" min="2" max="8" value="<?php echo esc_attr($poi_chat_num_people); ?>">
                            <div class="mdc-textfield__bottom-line"></div>
                        </div>
                    </div>

                    <div id="poi_link_section" class="assetEditorColumn" style="display: none;">
                        <h3 class="mdc-typography--title">Link</h3>
                        <div class="mdc-textfield mdc-textfield--textarea" data-mdc-auto-init="MDCTextfield" style="border: 1px solid rgba(0, 0, 0, 0.3); margin-top:0;">
                            <textarea id="assetLinkInput" name="assetLinkInput" class="mdc-textfield__input" style="box-shadow: none;" rows="5" type="text"><?php echo esc_textarea($asset_link); ?></textarea>
                            <label for="assetLinkInput" class="mdc-textfield__label" style="background: none;">Link to external target</label>
                        </div>
                    </div>

                    <div class="assetEditorColumn" id="video_options_section" style="display: none;">
                        <h3 class="mdc-typography--title">Video options</h3>
                        <div class="mdc-textfield mdc-form-field" data-mdc-auto-init="MDCTextfield" style="margin-top: 0; width: 100%;">
                            <input id="videoTitle" type="text" class="mdc-textfield__input mdc-theme--text-primary-on-light" name="videoTitle" aria-controls="title-validation-msg" minlength="3" maxlength="25" value="<?php echo esc_attr($video_title); ?>">
                            <label for="videoTitle" class="mdc-textfield__label">Video title (optional)</label>
                            <div class="mdc-textfield__bottom-line"></div>
                        </div>
                        <p class="mdc-textfield-helptext mdc-textfield-helptext--validation-msg" id="title-validation-msg">
                            Between 3 - 25 characters
                        </p>
                        <input type="checkbox" title="Select if you want the video to automatically play. It will also autoloop" id="video_autoloop_checkbox" name="video_autoloop_checkbox" class="mdc-checkbox mdc-form-field mdc-theme--text-primary-on-light" <?php echo $video_autoloop; ?>/>
                        <label for="video_autoloop_checkbox" class="mdc-typography--subheading2 mdc-theme--text-primary-on-light" style="vertical-align: middle; cursor: pointer;">Autoplay</label>
                    </div>

                    <div class="assetEditorColumn" id="poi_image_file_section" style="display: none;">
                        <h3 class="mdc-typography--title">Image file</h3>
                        <img style=" width: auto; height: 100px; " id="imagePoiPreviewImg" src="<?php echo esc_url($imagePoiImageURL); ?>" alt="Asset Image Text POI image">
                        <input type="file" name="imageFileInput" value="" id="imageFileInput" accept="image/png, image/jpg, image/jpeg"/>
                    </div>
                </div>

                <div id="ipr_section" class="assetEditorColumn" style="display: none; padding-bottom: 24px;">
                    <h3 class="mdc-typography--title">Select an IPR plan</h3>
                    <div id="category-ipr-select" class="mdc-select" role="listbox" tabindex="0" style="min-width: 80%;">
                        <i class="material-icons mdc-theme--text-hint-on-light">label</i>&nbsp;
                        <?php if (empty($saved_ipr_term)) { ?>
                            <span id="currently-ipr-selected" class="mdc-select__selected-text mdc-typography--subheading2">
                                No IPR category selected
                            </span>
                        <?php } else { ?>
                            <span data-cat-ipr-desc="<?php echo esc_attr($saved_ipr_term[0]->description); ?>"
                                  data-cat-ipr-slug="<?php echo esc_attr($saved_ipr_term[0]->slug); ?>"
                                  data-cat-ipr-id="<?php echo esc_attr($saved_ipr_term[0]->term_ipr_id); ?>"
                                  id="currently-ipr-selected"
                                  class="mdc-select__selected-text mdc-typography--subheading2">
                                <?php echo esc_html($saved_ipr_term[0]->name); ?>
                            </span>
                        <?php } ?>

                        <div class="mdc-simple-menu mdc-select__menu">
                            <ul class="mdc-list mdc-simple-menu__items">
                                <li class="mdc-list-item mdc-theme--text-hint-on-light" role="option" aria-disabled="true" tabindex="-1" style="pointer-events: none;">
                                    No IPR category selected
                                </li>
                                <?php foreach ($cat_ipr_terms as $term_ipr) { ?>
                                    <li class="mdc-list-item mdc-theme--text-primary-on-background" role="option"
                                        title="<?php echo esc_attr($term_ipr->description); ?>"
                                        data-cat-ipr-desc="<?php echo esc_attr($term_ipr->description); ?>"
                                        data-cat-ipr-slug="<?php echo esc_attr($term_ipr->slug); ?>"
                                        id="<?php echo esc_attr($term_ipr->term_id); ?>"
                                        tabindex="0">
                                        <?php echo esc_html($term_ipr->name); ?>
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

        <div id="audioDetailsPanel" style="display: none">
            <h4 class="mdc-typography--title">3D audio file</h4>
            <img alt="Audio Section" src="<?php echo esc_url($audio_icon_url); ?>">
            <div id="audioFileInputContainer">
                <?php if ($audio_attachment_file) { ?>
                    <audio controls loop preload="auto" id='audioFile'>
                        <source src="<?php echo esc_url($audio_attachment_file); ?>" type="audio/<?php echo esc_attr($audio_file_type); ?>">
                        Your browser does not support the audio tag.
                    </audio>
                <?php } ?>
                <label for="audioFileInput"> Select a new audio</label>
                <input class="FullWidth" type="file" name="audioFileInput" value="" id="audioFileInput" accept="audio/mp3,audio/wav"/>
                <br />
                <span id="audio-description-label" class="mdc-typography--subheading1 mdc-theme--text-secondary-on-background">mp3 or wav</span>
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

<?php wp_footer(); ?>
</body>
</html>
<?php }
?>
