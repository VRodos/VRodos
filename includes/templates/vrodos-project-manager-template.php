
<?php

if ( get_option('permalink_structure') ) { $perma_structure = true; } else {$perma_structure = false;}
if( $perma_structure){$parameter_Scenepass = '?wpunity_scene=';} else{$parameter_Scenepass = '&wpunity_scene=';}
if( $perma_structure){$parameter_pass = '?wpunity_game=';} else{$parameter_pass = '&wpunity_game=';}
$parameter_assetpass = $perma_structure ? '?wpunity_asset=' : '&wpunity_asset=';

$editgamePage = wpunity_getEditpage('game');


$pluginpath = dirname (plugin_dir_url( __DIR__  ));
$pluginpath = str_replace('\\','/',$pluginpath);


// Define Ajax for the delete Game functionality
$thepath = $pluginpath . '/js_libs/delete_ajaxes/delete_game_scene_asset.js';
wp_enqueue_script( 'ajax-script_delete_game', $thepath, array('jquery') );
wp_localize_script( 'ajax-script_delete_game', 'my_ajax_object_deletegame',
	array( 'ajax_url' => admin_url( 'admin-ajax.php'))
);

// Define Ajax for the delete Game functionality
$thepath = $pluginpath . '/js_libs/collaborate_ajaxes/collaborate_project.js';
wp_enqueue_script( 'ajax-script_collaborate_project', $thepath, array('jquery') );
wp_localize_script( 'ajax-script_collaborate_project', 'my_ajax_object_collaborate_project',
    array( 'ajax_url' => admin_url( 'admin-ajax.php'))
);



// Define Ajax for the create Game functionality
$thepath2 = $pluginpath . '/js_libs/create_ajaxes/create_game_scene_asset.js';
wp_enqueue_script( 'ajax-script_create_game', $thepath2, array('jquery') );
wp_localize_script( 'ajax-script_create_game', 'my_ajax_object_creategame',
    array( 'ajax_url' => admin_url( 'admin-ajax.php'))
);



$isAdmin = is_admin() ? 'back' : 'front';

$current_user_id = get_current_user_id();

echo '<script>';
    echo 'isAdmin="'.$isAdmin.'";'; // This variable is used in the request_game_assemble.js
    echo 'current_user_id="'.$current_user_id.'";';
    echo 'parameter_Scenepass="'.$parameter_Scenepass.'";';
echo '</script>';

$full_title = "Projects";
$full_title_lowercase = "projects";
$single = "project";
$multiple = "projects";

//if ($project_scope == 0) {
//	$full_title = "Virtual Tour";
//	$full_title_lowercase = "virtual tour";
//	$single = "tour";
//	$multiple = "tours";
//} else if ($project_scope == 1){
//	$full_title = "Virtual Lab";
//	$full_title_lowercase = "virtual lab";
//	$single = "lab";
//	$multiple = "labs";
//} else {
//	$full_title = "Game Project";
//	$full_title_lowercase = "game project";
//	$single = "project";
//	$multiple = "projects";
//}


wp_enqueue_style('wpunity_materialize_stylesheet', $pluginpath . '/css/materialize.css');

wp_enqueue_script('vrodos_materialize_jslib', $pluginpath . '/js_libs/materialize.js');

get_header();
?>

<span class="mdc-typography--display1 mdc-theme--text-primary-on-background" style="display:inline-table;margin-left:10px;margin-top:20px"><?php echo $full_title; ?> Manager</span>


<!--<p class="mdc-typography--subheading1 mdc-theme--text-secondary-on-light"> Not sure what to do?-->
<!--    <a target="_blank" href="--><?php //echo plugin_dir_url( __DIR__ ); ?><!--files/usage-scenario.pdf" class="mdc-button mdc-button--primary" data-mdc-auto-init="MDCRipple">Read the Usage Scenario</a>-->
<!--</p>-->

<!-- if user not logged in then show a hint to login -->
<?php if ( !is_user_logged_in() ) { ?>

    <div class="DisplayBlock CenterContents">

        <img style="margin-top:10px;" src="/wp-content/plugins/vrodos/images/screenshots/authtoolimage.jpg" width="50%;" alt="editor screenshot" />
        <br />
        <i style="font-size: 64px; padding-top: 10px;" class="material-icons mdc-theme--text-icon-on-background">account_circle</i>
        <p class="mdc-typography--title"> Please <a class="mdc-theme--secondary" href="<?php echo wp_login_url( get_permalink() ); ?>">login</a> to use platform
         Or <a class="mdc-theme--secondary" href="<?php echo wp_registration_url(); ?>">register</a> if you don't have an account</p>
    </div>

    <hr class="WhiteSpaceSeparator">

<?php } else {
    
    $current_user = wp_get_current_user();
    $login_username = $current_user->user_login;
    
    ?>

    <!-- HELP button -->
    <a href="#" class="helpButton" onclick="alert('Create a new <?php echo $full_title_lowercase; ?> or edit an existing one')">
        ?
    </a>

    
    <span style="float:right; right:0px; font-family: 'Comic Sans MS'; display:inline-table;margin-top:10px; margin-right:10px;">Welcome,
        <a href="<?php echo get_site_url() ?>/account/" style="color:dodgerblue">
              <?php echo $login_username;?>
        </a>
    </span>



<div class="mdc-layout-grid FrontPageStyle">

    <div class="mdc-layout-grid__inner">
        
        <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-7">
            
            <span>
            <span class="mdc-typography--title mdc-theme--text-primary-on-background">Existing <?php echo $multiple; ?></span>
            
            
            <?php
                echo '<a href="'.get_site_url().'/vrodos-assets-list-page/" class="" style="float:right" data-mdc-auto-init="MDCRipple" title="View or add shared assets">';
                echo '<span id="shared-assets-button" class="mdc-button" >All Assets</span>';
                echo '</a>';
            ?>
            </span>
            
            <hr class="mdc-list-divider" style="width:100%; float:right">

            <div id="ExistingProjectsDivDOM" style="width:100%; float:right">


            </div>
            
        </div>

        <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-1"></div>
        
        
        <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-4">

            <span class="mdc-typography--title mdc-theme--text-primary-on-background">Create new <?php echo $single; ?></span>

            <hr class="mdc-list-divider">

            <div class="mdc-layout-grid">

                <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12 ">


                    <form name="newProjectForm" action="" id="newProjectForm" method="POST" enctype="multipart/form-data">

                        <div class="mdc-textfield FullWidth mdc-form-field" data-mdc-auto-init="MDCTextfield">
                            <input id="title" name="title" type="text" class="mdc-textfield__input mdc-theme--text-primary-on-light" aria-controls="title-validation-msg"
                                   required="" minlength="3" style="border: none; border-bottom: 1px solid rgba(0, 0, 0, 0.3); box-shadow: none; border-radius: 0;">
                            <label for="title" class="mdc-textfield__label">Enter a title for your <?php echo $single; ?></label>
                            <div class="mdc-textfield__bottom-line"></div>
                        </div>
                        <p class="mdc-textfield-helptext mdc-textfield-helptext--validation-msg"
                           id="title-validation-msg" aria-hidden="true">
                            Must be at least 3 characters long
                        </p>

                        <label class="mdc-typography--title NewGameLabel">Choose <?php echo $single; ?> type</label>
                        <ul class="RadioButtonList" onclick="loadGameDescription();">

                            <?php if ($project_scope===1){?>
                                <li class="mdc-form-field">
                                    <div class="mdc-radio">
                                        <input class="mdc-radio__native-control" type="radio" id="gameTypeChemistryRadio" name="gameTypeRadio" value="3">
                                        <div class="mdc-radio__background">
                                            <div class="mdc-radio__outer-circle"></div>
                                            <div class="mdc-radio__inner-circle"></div>
                                        </div>
                                    </div>
                                    <label id="gameTypeChemistryRadio-label" for="gameTypeChemistryRadio">Chemistry</label>
                                </li>
    
    
                                <li class="mdc-form-field">
                                    <div class="mdc-radio">
                                        <input class="mdc-radio__native-control" type="radio" id="gameTypeEnergyRadio" checked="" name="gameTypeRadio" value="2">
                                        <div class="mdc-radio__background">
                                            <div class="mdc-radio__outer-circle"></div>
                                            <div class="mdc-radio__inner-circle"></div>
                                        </div>
                                    </div>
                                    <label id="gameTypeEnergyRadio-label" for="gameTypeEnergyRadio">Energy</label>
                                </li>
                           <?php }?>
    
                            <?php if ($project_scope===0){?>
                            <li class="mdc-form-field">
                                <div class="mdc-radio">
                                    <input class="mdc-radio__native-control" type="radio" id="gameTypeArchRadio" checked="" name="gameTypeRadio" value="1">
                                    <div class="mdc-radio__background">
                                        <div class="mdc-radio__outer-circle"></div>
                                        <div class="mdc-radio__inner-circle"></div>
                                    </div>
                                </div>
                                <label id="gameTypeArchRadio-label" for="gameTypeArchRadio">
                                    <i class="material-icons"></i>Archaeology</label>
                            </li>
                            <?php }?>

                        </ul>

                        
                        <?php if ($project_scope == 1) { ?>
                            <span id="game-description-label" class="mdc-typography--subheading1 mdc-theme--text-secondary-on-background">A Wind Energy park simulation with many areas and parameters</span>
                            <?php } else { ?>
                        <span id="game-description-label" class="mdc-typography--subheading1 mdc-theme--text-secondary-on-background">
                            Design a virtual tour of your own archaeological place
                            <?php } ?>
                            

                        <hr class="WhiteSpaceSeparator">

						<?php wp_nonce_field('post_nonce', 'post_nonce_field'); ?>
                        <input type="hidden" name="submitted" id="submitted" value="true" />
                            <!-- instead of type="submit" -->
                            <button id="createNewGameBtn"  type="button"
                                class="ButtonFullWidth mdc-button mdc-elevation--z2 mdc-button--raised"
                                    data-mdc-auto-init="MDCRipple"> CREATE</button>
                            
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

        
        <!--Delete Game Dialog-->
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
                    <a class="mdc-button mdc-dialog__footer__button--cancel mdc-dialog__footer__button" id="cancelDeleteGameBtn">Cancel</a>
                    <a class="mdc-button mdc-button--primary mdc-dialog__footer__button mdc-button--raised" id="deleteGameBtn">Delete</a>
                </footer>
            </div>
            <div class="mdc-dialog__backdrop"></div>
        </aside>



        <!--Project Collaborators Dialog-->
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
<!---->
                <footer class="mdc-dialog__footer">
                    <a class="mdc-button mdc-dialog__footer__button--cancel mdc-dialog__footer__button" id="cancelCollabsBtn">Cancel</a>
                    <a class="mdc-button mdc-button--primary mdc-dialog__footer__button mdc-button--raised" id="updateCollabsBtn">Update</a>
                </footer>
            </div>
            <div class="mdc-dialog__backdrop"></div>
        </aside>
        
        
        
        
        

    </div>
</div>
<script type="text/javascript">
    window.mdc.autoInit();

   
    
    var dialog = new mdc.dialog.MDCDialog(document.querySelector('#delete-dialog'));
    dialog.focusTrap_.deactivate();


    var dialogCollaborators = new mdc.dialog.MDCDialog(document.querySelector('#collaborate-dialog'));
    dialogCollaborators.focusTrap_.deactivate();
    
    
    

    function loadGameDescription() {
        var checked = parseInt(jQuery( ":checked" ).val(), 10);
        if (checked === 2) {
            jQuery("#game-description-label").html("A Wind Energy park simulation with many areas and parameters");
        } else if (checked === 3) {
            jQuery("#game-description-label").html("A Chemistry lab with 2D and 3D puzzles about molecules");
        } else {
            jQuery("#game-description-label").html("Design a virtual tour of your own archaeological place");
        }
    }

    function collaborateProject(project_id) {
        
        
        var dialogTitle = document.getElementById("collaborate-dialog-title");
        var dialogDescription = document.getElementById("collaborate-dialog-description");
        var gameTitle = document.getElementById(project_id+"-title").innerHTML;
        gameTitle = gameTitle.substring(0, gameTitle.indexOf('<'));
        gameTitle = gameTitle.trim();
        
        dialogTitle.innerHTML = "<b>Collaborators on " + gameTitle+"?</b>";
        
        dialogDescription.innerHTML = "Make your selection for  '" +gameTitle + "'. For example 'mail1@gmail.com'";

        dialogCollaborators.project_id = project_id;

        //jQuery('.chips-initial').material_chip({data: [], placeholder: 'Your collaborator email'});
        
        // Fetch collaborators and insert to "textarea-collaborators"
        wpunity_fetchCollabsAjax(project_id);

        
    }
    
    
    function deleteGame(id) {

        var dialogTitle = document.getElementById("delete-dialog-title");
        var dialogDescription = document.getElementById("delete-dialog-description");
        var gameTitle = document.getElementById(id+"-title").innerHTML;
        gameTitle = gameTitle.substring(0, gameTitle.indexOf('<'));
        gameTitle = gameTitle.trim();

        dialogTitle.innerHTML = "<b>Delete " + gameTitle+"?</b>";
        dialogDescription.innerHTML = "Are you sure you want to delete your project '" +gameTitle + "'? There is no Undo functionality once you delete it.";
        dialog.id = id;
        dialog.show();
    }

    
    
    
    

    jQuery('#deleteGameBtn').click( function (e) {

        jQuery('#delete-dialog-progress-bar').show();

        jQuery( "#deleteGameBtn" ).addClass( "LinkDisabled" );
        jQuery( "#cancelDeleteGameBtn" ).addClass( "LinkDisabled" );

        //console.log("ID:", dialog.id);
        wpunity_deleteGameAjax(dialog.id, dialog, current_user_id, parameter_Scenepass);

    });

    jQuery('#cancelDeleteGameBtn').click( function (e) {

        jQuery('#delete-dialog-progress-bar').hide();
        dialog.close();

    });

    jQuery('#updateCollabsBtn').click( function (e) {


        var allChipsContainers = document.querySelectorAll('.chips');
        var singleChipContainer = M.Chips.getInstance(allChipsContainers[0]);
        
        
        // Get collabs emails
        var currCollabsEmails = singleChipContainer.getData();

        console.log("currCollabsEmails1", currCollabsEmails);

        
        currCollabsEmails = currCollabsEmails.map(function(elem){return elem.tag}).join(";");

        console.log("currCollabsEmails2", currCollabsEmails);
        
        // 2. Update ids of collaborators ;15;5;4;
        wpunity_updateCollabsAjax(dialogCollaborators.project_id, dialogCollaborators, currCollabsEmails);

    });
    
    
    jQuery('#cancelCollabsBtn').click( function (e) {
        dialogCollaborators.close();
        
    });
    

    jQuery('#createNewGameBtn').click( function (e) {
        
        // Title of game project
        var title_game_project = document.getElementById('title').value;

        if (title_game_project.length > 2) {
            var  game_type_radio_button = document.getElementsByName("gameTypeRadio")[0].value;
            wpunity_createGameAjax(title_game_project, game_type_radio_button, current_user_id, parameter_Scenepass);
            jQuery('#createNewGameBtn').hide();
            jQuery('#create-game-progress-bar').show();
        }
    });

    
    
    fetchAllProjectsAndAddToDOM(current_user_id, parameter_Scenepass);
</script>
<?php get_footer(); ?>
