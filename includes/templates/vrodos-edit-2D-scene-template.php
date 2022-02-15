<?php

function vrodos_load_2DSceneEditorScripts() {
	wp_enqueue_script('vrodos_scripts');
	/*wp_enqueue_script( 'tinymce_js', includes_url( 'js/tinymce/' ) . 'wp-tinymce.php', array( 'jquery' ), false, true );*/
}
add_action('wp_enqueue_scripts', 'vrodos_load_2DSceneEditorScripts' );



if ( get_option('permalink_structure') ) { $perma_structure = true; } else {$perma_structure = false;}
if( $perma_structure){$parameter_Scenepass = '?vrodos_scene=';} else{$parameter_Scenepass = '&vrodos_scene=';}
if( $perma_structure){$parameter_pass = '?vrodos_game=';} else{$parameter_pass = '&vrodos_game=';}

$scene_id = intval( $_GET['vrodos_scene'] );
$scene_id = sanitize_text_field( $scene_id );

$scene_type = sanitize_text_field( $_GET['scene_type'] );

$project_id = intval( $_GET['vrodos_game'] );
$project_id = sanitize_text_field( $project_id );

$game_post = get_post($project_id);
$game_type_obj = vrodos_return_project_type($project_id);

$scene_post = get_post($scene_id);
$sceneSlug = $scene_post->post_title;

$editgamePage = vrodos_getEditpage('game');
$allGamesPage = vrodos_getEditpage('allgames');
$newAssetPage = vrodos_getEditpage('asset');
$editscenePage = vrodos_getEditpage('scene');
$editscene2DPage = vrodos_getEditpage('scene2D');
$editsceneExamPage = vrodos_getEditpage('sceneExam');


if(isset($_POST['submitted']) && isset($_POST['post_nonce_field']) && wp_verify_nonce($_POST['post_nonce_field'], 'post_nonce')) {
    $scene_data='';
    if($game_type_obj->string == 'Energy'){
        $scene_data = vrodos_getFirstSceneID_byProjectID($project_id,'energy_games');//first 3D scene id
    }elseif($game_type_obj->string == 'Chemistry'){
        $scene_data = vrodos_getFirstSceneID_byProjectID($project_id,'chemistry_games');//first 3D scene id
    }else{
        $scene_data = vrodos_getFirstSceneID_byProjectID($project_id,'archaeology_games');//first 3D scene id
    }
    $edit_scene_page_id = $editscenePage[0]->ID;
    $goBackTo_MainLab_link = get_permalink($edit_scene_page_id) . $parameter_Scenepass . $scene_data['id'] . '&vrodos_game=' . $project_id . '&scene_type=' . $scene_data['type'];


    if($scene_type == 'credits'){
		$post_content = esc_attr(strip_tags($_POST['scene-caption']));
		$post_image =  $_FILES['scene-featured-image'];

		$scene_information = array(
			'ID' => $scene_id,
			'post_content' => $post_content,
		);

		$post_id = wp_update_post( $scene_information, true );

		if (is_wp_error($post_id)) {
			$errors = $post_id->get_error_messages();
			foreach ($errors as $error) {
				echo $error;
			}
		}

		$attachment_id = vrodos_upload_img( $scene_id, $post_image );
		set_post_thumbnail( $scene_id, $attachment_id );

		if($post_id){
			//wp_redirect(esc_url( get_permalink($editgamePage[0]->ID) . $parameter_pass . $project_id ));
            wp_redirect( $goBackTo_MainLab_link );
            exit;
		}

	}elseif($scene_type == 'menu'){

		$post_image =  $_FILES['scene-featured-image'];

		$post_options_choice =  esc_attr(strip_tags($_POST['options']));
		$post_login_choice =  esc_attr(strip_tags($_POST['login']));
		$post_help_choice =  esc_attr(strip_tags($_POST['help']));

		if($post_options_choice){update_post_meta($scene_id, 'vrodos_menu_has_options', 1);}else{update_post_meta($scene_id, 'vrodos_menu_has_options', 0);}
		if($post_login_choice){update_post_meta($scene_id, 'vrodos_menu_has_login', 1);}else{update_post_meta($scene_id, 'vrodos_menu_has_login', 0);}
		if($post_help_choice){update_post_meta($scene_id, 'vrodos_menu_has_help', 1);}else{update_post_meta($scene_id, 'vrodos_menu_has_help', 0);}

		if($post_help_choice){
			$help_desc = esc_attr(strip_tags($_POST['help-description']));
			update_post_meta($scene_id, 'vrodos_scene_help_text', $help_desc);
			$help_image =  $_FILES['help-image'];
			if($help_image['size']!=0){
				$attachment_help_id = vrodos_upload_img( $scene_id, $help_image );
				update_post_meta($scene_id, 'vrodos_scene_helpimg', $attachment_help_id);
			}
		}

		$attachment_id = vrodos_upload_img( $scene_id, $post_image );
		set_post_thumbnail( $scene_id, $attachment_id );

		//wp_redirect(esc_url( get_permalink($editgamePage[0]->ID) . $parameter_pass . $project_id ));

        wp_redirect( $goBackTo_MainLab_link );
        exit;
	}

}

wp_enqueue_media($scene_post->ID);
require_once(ABSPATH . "wp-admin" . '/includes/media.php');

$scene_title = $scene_type === 'credits' ? 'Credits' : 'Main Menu' ;
$image_size_label = $scene_type === 'credits' ? '512x256' : '1920x1080' ;

if ($project_scope == 0) {
	$single_lowercase = "tour";
	$single_first = "Tour";
} else if ($project_scope == 1){
	$single_lowercase = "lab";
	$single_first = "Lab";
} else {
	$single_lowercase = "project";
	$single_first = "Project";
}

$all_game_category = get_the_terms( $project_id, 'vrodos_game_type' );
$game_category  = $all_game_category[0]->slug;

$scene_data = vrodos_getFirstSceneID_byProjectID($project_id,$game_category);//first 3D scene id
$edit_scene_page_id = $editscenePage[0]->ID;
$goBackTo_MainLab_link = get_permalink($edit_scene_page_id) . $parameter_Scenepass . $scene_data['id'] . '&vrodos_game=' . $project_id . '&scene_type=' . $scene_data['type'];
$goBackTo_AllProjects_link = esc_url( get_permalink($allGamesPage[0]->ID));

get_header(); ?>


    <div class="PageHeaderStyle">
        <h1 class="mdc-typography--display1 mdc-theme--text-primary-on-light">
            <a title="Back" href="<?php echo $goBackTo_MainLab_link; ?>"> <i class="material-icons" style="font-size: 36px; vertical-align: top;" >arrow_back</i> </a>
			<?php echo $game_post->post_title; ?>
        </h1>

    </div>

    <span class="mdc-typography--caption">
        <i class="material-icons mdc-theme--text-icon-on-background AlignIconToBottom" title="Add category title & icon"><?php echo $game_type_obj->icon; ?> </i>&nbsp;<?php echo $game_type_obj->string; ?></span>

    <hr class="mdc-list-divider">

    <ul class="EditPageBreadcrumb">
        <li><a class="mdc-typography--caption mdc-theme--primary" href="<?php echo $goBackTo_AllProjects_link; ?>" title="Go back to Project selection">Home</a></li>
        <li><i class="material-icons EditPageBreadcrumbArr mdc-theme--text-hint-on-background">arrow_drop_up</i></li>
        <li><a class="mdc-typography--caption mdc-theme--primary" href="<?php echo $goBackTo_MainLab_link; ?>" title="Go back to Project editor"><?php echo $single_first; ?> Editor</a></li>
        <li><i class="material-icons EditPageBreadcrumbArr mdc-theme--text-hint-on-background">arrow_drop_up</i></li>
        <li class="mdc-typography--caption"><span class="EditPageBreadcrumbSelected"><?php echo $scene_title; ?> Editor</span></li>

    </ul>

    <h2 class="mdc-typography--headline mdc-theme--text-primary-on-light"><?php echo $sceneSlug; ?></h2>

    <form name="edit_scene_form" action="" id="edit_scene_form" method="POST" enctype="multipart/form-data">
        <div class="mdc-layout-grid">

            <div class="mdc-layout-grid__inner">

                <div class="mdc-layout-grid__cell--span-5">

					<?php $featuredImgUrl = get_the_post_thumbnail_url( $scene_id ); ?>

                    <h2 class="mdc-typography--title">Set a background for <?php echo $scene_title; ?></h2>

					<?php if ($featuredImgUrl) { ?>

                        <div id="featureImgContainer" class="ImageContainer">
                            <img id="featuredImgPreview" src="<?php echo $featuredImgUrl; ?>">
                        </div>

					<?php } else { ?>
                        <div id="featureImgContainer">
                            <img id="featuredImgPreview" src="<?php echo plugins_url( '../images/ic_sshot.png', dirname(__FILE__)  ); ?>">
                        </div>
					<?php } ?>

                    <input type="file" name="scene-featured-image" title="Featured image" id="sceneFeaturedImgInput" accept="image/x-png,image/gif,image/jpeg">
                    <label class="mdc-typography--caption">Preferred image size: <?php echo $image_size_label;?> pixels.</label>
                    <hr class="WhiteSpaceSeparator">

					<?php if ($scene_type !== 'credits') { ?>

                        <h2 class="mdc-typography--title">Enable Main Menu entries</h2>
						<?php

						$optionsFlag = get_post_meta($scene_id,'vrodos_menu_has_options',true);
						$optionsEnabled = $optionsFlag ? 'true' : 'false';
						$optionsChecked = $optionsFlag ? 'checked' : '';

						$loginFlag = get_post_meta($scene_id,'vrodos_menu_has_login',true);
						$loginEnabled = $loginFlag ? 'true' : 'false';
						$loginChecked = $loginFlag ? 'checked' : '';

						$helpFlag = get_post_meta($scene_id,'vrodos_menu_has_help',true);
						$helpEnabled = $helpFlag ? 'true' : 'false';
						$helpChecked = $helpFlag ? 'checked' : '';

						?>
                        <div class="SectionSwitchItemStyle">
                            <div class="mdc-switch">
                                <input type="checkbox" name="options" value="<?php echo $optionsEnabled; ?>" id="options-switch" class="mdc-switch__native-control" <?php echo $optionsChecked; ?> />
                                <div class="mdc-switch__background">
                                    <div class="mdc-switch__knob"></div>
                                </div>
                            </div>
                            <label for="options-switch" class="mdc-switch-label">Options</label>
                        </div>

                        <div class="SectionSwitchItemStyle">
                            <div class="mdc-switch">
                                <input type="checkbox" name="login" value="<?php echo $loginEnabled; ?>" id="login-switch" class="mdc-switch__native-control" <?php echo $loginChecked; ?>/>
                                <div class="mdc-switch__background">
                                    <div class="mdc-switch__knob"></div>
                                </div>
                            </div>
                            <label for="login-switch" class="mdc-switch-label">Login</label>
                        </div>

                        <div class="SectionSwitchItemStyle">
                            <div class="mdc-switch">
                                <input type="checkbox" name="help" value="<?php echo $helpEnabled; ?>" id="help-switch" class="mdc-switch__native-control" <?php echo $helpChecked; ?>/>
                                <div class="mdc-switch__background">
                                    <div class="mdc-switch__knob"></div>
                                </div>
                            </div>
                            <label for="help-switch" class="mdc-switch-label">Help</label>
                        </div>

					<?php } ?>

                </div>

                <div class="mdc-layout-grid__cell--span-1"></div>
                <div class="mdc-layout-grid__cell--span-6">

					<?php if ($scene_type === 'credits') { ?>

                        <h2 class="mdc-typography--title">Insert information about the people that created the <?php echo $single_lowercase; ?> or acknowledgements</h2>
                        <div class="mdc-textfield mdc-textfield--textarea" data-mdc-auto-init="MDCTextfield" style="border: 1px solid rgba(0, 0, 0, 0.3);">
                            <textarea id="creditsTextarea" name="scene-caption" class="mdc-textfield__input" rows="6" cols="40" style="box-shadow: none;"><?php echo $scene_post->post_content; ?></textarea>
                            <label for="creditsTextarea" class="mdc-textfield__label" style="background: none;">Edit Credits text</label>
                        </div>

                        <!--<textarea placeholder="Edit Credits text" title="Credits text" rows="6" cols="40"></textarea>-->


					<?php } else { ?>


						<?php if ($helpEnabled === 'true') { ?>
                            <div class="mdc-layout-grid" id="helpDetailsSection">

                                <div class="mdc-layout-grid__cell--span-12">
                                    <h2 class="mdc-typography--title">Help description</h2>
                                    <div class="mdc-textfield mdc-textfield--textarea" data-mdc-auto-init="MDCTextfield" style="border: 1px solid rgba(0, 0, 0, 0.3);">
                                        <textarea id="helpTextarea" name="help-description" class="mdc-textfield__input" rows="6" cols="40" style="box-shadow: none;"><?php echo get_post_meta($scene_id, 'vrodos_scene_help_text', true); ?></textarea>
                                        <label for="helpTextarea" class="mdc-textfield__label" style="background: none;">Edit help description</label>
                                    </div>
                                </div>

                                <div class="mdc-layout-grid__cell--span-12">

                                    <h2 class="mdc-typography--title">Help image</h2>

									<?php
									$helpImgId  = get_post_meta($scene_id, 'vrodos_scene_helpimg', true);
									$helpImgUrl = wp_get_attachment_url( $helpImgId );

									if ($helpImgUrl) { ?>

                                        <div id="helpImgContainer" class="ImageContainer">
                                            <img id="helpImgPreview" src="<?php echo $helpImgUrl; ?>">
                                        </div>

									<?php } else { ?>
                                        <div id="helpImgContainer">
                                            <img id="helpImgPreview" src="<?php echo plugins_url( '../images/ic_sshot.png', dirname(__FILE__)  ); ?>">
                                        </div>
									<?php } ?>

                                    <input type="file" name="help-image" title="Help image" id="sceneHelpImgInput" accept="image/x-png,image/gif,image/jpeg">
                                    <label class="mdc-typography--caption">Preferred image size: 1200x600 pixels.</label>
                                </div>

                            </div>
						<?php } ?>

					<?php } ?>

                    <hr class="WhiteSpaceSeparator">

					<?php wp_nonce_field('post_nonce', 'post_nonce_field'); ?>
                    <input type="hidden" name="submitted" id="submitted" value="true" />
                </div>

                <div class="mdc-layout-grid__cell--span-12">

                    <button style="margin-bottom: 24px; width: 100%; height: 48px;" class="mdc-button mdc-elevation--z2 mdc-button--raised" data-mdc-auto-init="MDCRipple" type="submit">
                        Submit changes
                    </button>
                </div>
            </div>
        </div>
    </form>
    <script type="text/javascript">

        var mdc = window.mdc;
        mdc.autoInit();

        (function() {
            // your page initialization code here
            // the DOM will be available here

            jQuery('#help-switch').click(function() {
                if (jQuery("#help-switch").is(":checked")) {
                    jQuery("#helpDetailsSection").show();
                } else {
                    jQuery("#helpDetailsSection").hide();
                }
            });

            jQuery("#sceneFeaturedImgInput").change(function() {

                if(this.value.length === 0) {
                    jQuery('#featureImgContainer').removeClass('ImageContainer');
                    document.getElementById('featuredImgPreview').src = '<?php echo plugins_url( '../images/ic_sshot.png', dirname(__FILE__)  ); ?>';
                } else {
                    jQuery('#featureImgContainer').addClass('ImageContainer');
                    vrodos_read_url(this, "#featuredImgPreview");
                }
            });

            jQuery("#sceneFeaturedImgInput").click(function() {
                if (this.value.length === 0) {
                    jQuery('#featureImgContainer').removeClass('ImageContainer');
                    document.getElementById('featuredImgPreview').src = '<?php echo plugins_url( '../images/ic_sshot.png', dirname(__FILE__)  ); ?>';
                }
            });


            jQuery("#sceneHelpImgInput").change(function() {
                if(this.value.length === 0) {
                    jQuery('#helpImgContainer').removeClass('ImageContainer');
                    document.getElementById('helpImgPreview').src = '<?php echo plugins_url( '../images/ic_sshot.png', dirname(__FILE__)  ); ?>';
                } else {
                    jQuery('#helpImgContainer').addClass('ImageContainer');
                    vrodos_read_url(this, "#helpImgPreview");
                }
            });

            jQuery("#sceneHelpImgInput").click(function() {
                if (this.value.length === 0) {
                    jQuery('#helpImgContainer').removeClass('ImageContainer');
                    document.getElementById('helpImgPreview').src = '<?php echo plugins_url( '../images/ic_sshot.png', dirname(__FILE__)  ); ?>';
                }
            });

            /*jQuery( document ).ready( function( ) {
                tinymce.init({
                    mode : "textareas",
                    theme : "modern",
                    plugins: "textcolor",
                    resize: false,
                    menu: {},
                    toolbar: 'undo redo | fontsizeselect | forecolor | bold italic',
                    skin: "lightgray"
                });
            });*/
        })();

    </script>

<?php get_footer(); ?>
