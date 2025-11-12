<?php

<?php
// Prepare data for the template
$data = VRodos_Game_CPT_Manager::prepare_project_manager_data();
extract($data);

wp_enqueue_style('vrodos_frontend_stylesheet');
wp_enqueue_style('vrodos_material_stylesheet');


// Pass data to JavaScript
echo '<script>';
echo 'var isAdmin="' . esc_js($isAdmin) . '";';
echo 'var current_user_id="' . esc_js($current_user_id) . '";';
echo 'var parameter_Scenepass="' . esc_js($parameter_Scenepass) . '";';
echo '</script>';

get_header();
?>

<span class="mdc-typography--display1 mdc-theme--text-primary-on-background" style="display:inline-table;margin-left:10px;margin-top:20px"><?php echo esc_html($full_title); ?> Manager</span>

<!-- if user not logged in then show a hint to login -->
<?php if ( !is_user_logged_in() || !current_user_can('administrator') ) {
    $pluginpath_var = str_replace('\\','/', dirname(plugin_dir_url( __DIR__  )) );
    ?>

    <div class="DisplayBlock CenterContents">

        <img style="margin-top:10px;" src="<?php echo esc_url($pluginpath_var);?>/images/screenshots/authtoolimage.jpg"
             width="960px;" alt="editor screenshot" />
        <br />
        <i style="font-size: 64px; padding-top: 10px;" class="material-icons mdc-theme--text-icon-on-background">account_circle</i>
        <p class="mdc-typography--title"> Please <a class="mdc-theme--secondary" href="<?php echo wp_login_url( get_permalink() ); ?>">login</a> to use platform
            Or <a class="mdc-theme--secondary" href="<?php echo wp_registration_url(); ?>">register</a> if you don't have an account</p>
    </div>

    <hr class="WhiteSpaceSeparator">

<?php } else { ?>

<!-- HELP button -->
<br/>
    <span class="mdc-typography--subheading2 mdc-theme--text-primary-on-light"> <i>Create a new <?php echo esc_html($single); ?> or edit an existing one</i></span>

<div class="mdc-layout-grid FrontPageStyle">
    <div class="mdc-layout-grid__inner">
        <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-7">
            <span>
            <span class="mdc-typography--title mdc-theme--text-primary-on-background">Existing <?php echo esc_html($multiple); ?></span>
            <?php
            echo '<a href="'.esc_url(get_site_url()).'/vrodos-assets-list-page/" class="" style="float:right" data-mdc-auto-init="MDCRipple" title="View or add shared assets">';
            echo '<span id="shared-assets-button" class="mdc-button" >All Assets</span>';
            echo '</a>';
            ?>
            </span>
            <hr class="mdc-list-divider" style="width:100%; float:left">
            <div id="ExistingProjectsDivDOM" style="width:100%; float: left"></div>
        </div>

        <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-1"></div>
        <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-4">
            <span class="mdc-typography--title mdc-theme--text-primary-on-background">Create new <?php echo esc_html($single); ?></span>
            <hr class="mdc-list-divider">
            <div class="mdc-layout-grid">
                <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12 ">
                    <form name="newProjectForm" action="" id="newProjectForm" method="POST" enctype="multipart/form-data">
                        <div class="mdc-textfield FullWidth mdc-form-field" data-mdc-auto-init="MDCTextfield">
                            <input id="title" name="title" type="text" class="mdc-textfield__input mdc-theme--text-primary-on-light" aria-controls="title-validation-msg"
                                   required minlength="3" style="border: none; border-bottom: 1px solid rgba(0, 0, 0, 0.3); box-shadow: none; border-radius: 0;">
                            <label for="title" class="mdc-textfield__label">Enter a title for your <?php echo esc_html($single); ?></label>
                            <div class="mdc-textfield__bottom-line"></div>
                        </div>
                        <p class="mdc-textfield-helptext mdc-textfield-helptext--validation-msg"
                           id="title-validation-msg" aria-hidden="true">
                            Must be at least 3 characters long
                        </p>

                        <!-- Radio buttons for Selecting Project type -->
                        <label class="mdc-typography--title mdc-theme--text-primary-on-light NewGameLabel">Choose <?php echo esc_html($single);?> type</label>

                        <ul class="RadioButtonList" onclick="loadProjectTypeDescription();">

                            <!-- Virtual Tour -->
                            <li class="mdc-form-field">
                                <div class="mdc-radio">
                                    <input class="mdc-radio__native-control" type="radio" id="gameTypeArchRadio"
                                           name="projectTypeRadio" value="archaeology_games">
                                    <div class="mdc-radio__background">
                                        <div class="mdc-radio__outer-circle"></div>
                                        <div class="mdc-radio__inner-circle"></div>
                                    </div>
                                </div>
                                <label id="gameTypeArchRadio-label" for="gameTypeArchRadio">
                                    <i class="material-icons">
                                        <?php echo VRodos_Core_Manager::vrodos_project_type_icon('archaeology') ?>
                                    </i>
                                    <span style="vertical-align: super">Default</span>
                                </label>
                            </li>


                            <!-- VR Expo -->
                            <li class="mdc-form-field">
                                <div class="mdc-radio">
                                    <input class="mdc-radio__native-control" type="radio" id="gameTypeVRExpoRadio"
                                           checked name="projectTypeRadio" value="vrexpo_games">
                                    <div class="mdc-radio__background">
                                        <div class="mdc-radio__outer-circle"></div>
                                        <div class="mdc-radio__inner-circle"></div>
                                    </div>
                                </div>
                                <label id="gameTypeVRExpoRadio-label" for="gameTypeVRExpoRadio">
                                    <i class="material-icons">
                                        <?php echo VRodos_Core_Manager::vrodos_project_type_icon('vrexpo') ?>
                                    </i>
                                    <span style="vertical-align: super">VR Exposition</span>
                                </label>
                            </li>


                            <!-- Virtual Production -->
                            <li class="mdc-form-field">
                                <div class="mdc-radio">
                                    <input class="mdc-radio__native-control" type="radio" id="gameTypeVirtualProductionRadio"
                                           name="projectTypeRadio" value="virtualproduction_games">
                                    <div class="mdc-radio__background">
                                        <div class="mdc-radio__outer-circle"></div>
                                        <div class="mdc-radio__inner-circle"></div>
                                    </div>
                                </div>
                                <label id="gameTypeVirtualProductionRadio-label" for="gameTypeVirtualProductionRadio">
                                    <i class="material-icons">
                                        <?php echo VRodos_Core_Manager::vrodos_project_type_icon('virtualproduction') ?>
                                    </i>
                                    <span style="vertical-align: super">Virtual Production</span>
                                </label>
                            </li>
                        </ul>

                        <!-- Description for project : Initialized with Javascript below -->
                        <span id="project-description-label"
                              class="mdc-typography--subheading1 mdc-theme--text-secondary-on-background">
                        </span>

                        <hr class="WhiteSpaceSeparator">

                        <!-- Create project button -->
                        <?php wp_nonce_field('post_nonce', 'post_nonce_field'); ?>

                        <input type="hidden" name="submitted" id="submitted" value="true" />
                        <button id="createNewProjectBtn"  type="button"
                                class="ButtonFullWidth mdc-button mdc-elevation--z2 mdc-button--raised"
                                data-mdc-auto-init="MDCRipple">CREATE</button>

                        <section id="create-game-progress-bar" class="CenterContents" style="display: none;">
                            <h3 class="mdc-typography--title">Creating <?php echo $single; ?>...</h3>

                            <div class="progressSlider">
                                <div class="progressSliderLine"></div>
                                <div class="progressSliderSubLine progressIncrease"></div>
                                <div class="progressSliderSubLine progressDecrease"></div>
                            </div>
                        </section>

                    </form>
                </div>
            </div>
        </div>
        <!--        <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-1"></div>-->

        <?php } ?>


        <!--Delete Project Dialog-->
        <aside id="delete-dialog"
               class="mdc-dialog"
               role="alertdialog"
               aria-labelledby="Delete project dialog"
               aria-describedby="Delete project dialog" data-mdc-auto-init="MDCDialog">

            <div class="mdc-dialog__surface">

                <header class="mdc-dialog__header">
                    <h2 id="delete-dialog-title" class="mdc-dialog__header__title">
                        Delete project?
                    </h2>
                </header>

                <section id="delete-dialog-description" class="mdc-dialog__body mdc-typography--body1">
                    Are you sure you want to delete your <?php echo $full_title_lowercase; ?>? There is no Undo functionality once you delete it.
                </section>

                <section id="delete-dialog-progress-bar" class="CenterContents mdc-dialog__body" style="display: none;">
                    <h3 class="mdc-typography--title">Deleting...</h3>

                    <div class="progressSlider">
                        <div class="progressSliderLine"></div>
                        <div class="progressSliderSubLine progressIncrease"></div>
                        <div class="progressSliderSubLine progressDecrease"></div>
                    </div>
                </section>

                <footer class="mdc-dialog__footer">
                    <a class="mdc-button mdc-dialog__footer__button--cancel mdc-dialog__footer__button" id="canceldeleteProjectBtn">Cancel</a>
                    <a class="mdc-button mdc-button--primary mdc-dialog__footer__button mdc-button--raised" id="deleteProjectBtn">Delete</a>
                </footer>
            </div>
            <div class="mdc-dialog__backdrop"></div>
        </aside>

        <!-- Project Collaborators Dialog-->
        <aside id="collaborate-dialog"
               class="mdc-dialog"
               role="alertdialog"
               aria-labelledby="Collaborate project dialog"
               aria-describedby="Collaborate project dialog" data-mdc-auto-init="MDCDialog">
            <div class="mdc-dialog__surface">
                <header class="mdc-dialog__header">
                    <h2 id="collaborate-dialog-title" class="mdc-dialog__header__title">
                        Collaborators on project
                    </h2>
                </header>

                <section id="collaborate-dialog-description" class="mdc-dialog__body mdc-typography--body1">
                    Current collaborators for <?php echo $full_title_lowercase; ?>?
                </section>

                <div class="mdc-text-field mdc-chip-set--input mdc-text-field--textarea" style="width:80%;margin:auto" role="grid">
                    <!--  Input for collaborators as chips -->
                    <div id="textarea-collaborators" class="chips"></div>
                    <div class="mdc-notched-outline">
                        <div class="mdc-notched-outline__leading"></div>
                        <div class="mdc-notched-outline__notch">
                            <label for="textarea-collaborators" class="mdc-floating-label mdc-dialog__body mdc-typography--body1">Current collaborators</label>
                        </div>
                        <div class="mdc-notched-outline__trailing"></div>
                    </div>
                </div>

                <!--                <section id="delete-dialog-progress-bar" class="CenterContents mdc-dialog__body" style="display: none;">-->
                <!--                    <h3 class="mdc-typography--title">Deleting...</h3>-->
                <!---->
                <!--                    <div class="progressSlider">-->
                <!--                        <div class="progressSliderLine"></div>-->
                <!--                        <div class="progressSliderSubLine progressIncrease"></div>-->
                <!--                        <div class="progressSliderSubLine progressDecrease"></div>-->
                <!--                    </div>-->
                <!--                </section>-->

                <footer class="mdc-dialog__footer">
                    <a class="mdc-button mdc-dialog__footer__button--cancel mdc-dialog__footer__button" id="cancelCollabsBtn">Cancel</a>
                    <a class="mdc-button mdc-button--primary mdc-dialog__footer__button mdc-button--raised" id="updateCollabsBtn">Update</a>
                </footer>
            </div>
            <div class="mdc-dialog__backdrop"></div>
        </aside>

    </div>
</div>

<?php get_footer();?>
