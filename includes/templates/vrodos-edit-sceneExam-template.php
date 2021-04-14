<?php

$pluginpath = dirname (plugin_dir_url( __DIR__  ));
$pluginpath = str_replace('\\','/',$pluginpath);

function wpunity_load2DSceneEditorScripts_exams() {
	wp_enqueue_script('vrodos_scripts');
}
add_action('wp_enqueue_scripts', 'wpunity_load2DSceneEditorScripts_exams' );

// DELETE ASSET AJAX
wp_enqueue_script( 'ajax-script_deleteasset', $pluginpath.'/js_libs/ajaxes/delete_asset.js', array('jquery') );
wp_localize_script( 'ajax-script_deleteasset', 'my_ajax_object_deleteasset',
	array( 'ajax_url' => admin_url( 'admin-ajax.php' ) )
);

if ( get_option('permalink_structure') ) { $perma_structure = true; } else {$perma_structure = false;}

if( $perma_structure){$parameter_pass = '?wpunity_game=';} else{$parameter_pass = '&wpunity_game=';}
if( $perma_structure){$parameter_Scenepass = '?wpunity_scene=';} else{$parameter_Scenepass = '&wpunity_scene=';}
if( $perma_structure){$parameter_assetpass = '?vrodos_asset=';} else{$parameter_assetpass = '&vrodos_asset=';}


$scene_id = intval( $_GET['wpunity_scene'] );
$scene_id = sanitize_text_field( $scene_id );

$scene_type = sanitize_text_field( $_GET['scene_type'] );

$project_id = intval( $_GET['wpunity_game'] );
$project_id = sanitize_text_field( $project_id );

$game_post = get_post($project_id);
$game_type_obj = wpunity_return_project_type($project_id);
$gameSlug = $game_post->post_name;

$scene_post = get_post($scene_id);

$sceneSlug = $scene_post->post_title;
$naming = stripos($sceneSlug, 'naming') ? true : false;


$editgamePage = wpunity_getEditpage('game');
$allGamesPage = wpunity_getEditpage('allgames');
$newAssetPage = wpunity_getEditpage('asset');
$editscenePage = wpunity_getEditpage('scene');
$editscene2DPage = wpunity_getEditpage('scene2D');
$editsceneExamPage = wpunity_getEditpage('sceneExam');

$userid = get_current_user_id();
$user_data = get_userdata( $userid );
$user_email = $user_data->user_email;

wp_enqueue_media($scene_post->ID);
require_once(ABSPATH . "wp-admin" . '/includes/media.php');

$scene_title = 'Exam';
$molecules = wpunity_get_all_molecules_of_game($project_id);//ALL available Molecules of a GAME
$savedMoleculesVal = get_post_meta($project_id, 'wpunity_exam_enabled_molecules',true);//The enabled molecules for Exams
$savedMoleculesVal = json_decode($savedMoleculesVal) ? json_decode($savedMoleculesVal) : array();

if ($project_scope == 0) {
	$single_first = "Tour";
} else if ($project_scope == 1){
	$single_first = "Lab";
} else {
	$single_first = "Project";
}

$scene_data = wpunity_getFirstSceneID_byProjectID($project_id,'chemistry_games'); //first 3D scene id
$edit_scene_page_id = $editscenePage[0]->ID;
$goBackTo_MainLab_link = get_permalink($edit_scene_page_id) . $parameter_Scenepass . $scene_data['id'] . '&wpunity_game=' . $project_id . '&scene_type=' . $scene_data['type'];
$goBackTo_AllProjects_link = esc_url( get_permalink($allGamesPage[0]->ID));
$refresh_to_examPage =  get_permalink($editsceneExamPage[0]->ID) . $parameter_Scenepass . $scene_id . '&wpunity_game=' . $project_id . '&scene_type=' . $scene_type;
$gotoAdd_newAsset_page = get_permalink($newAssetPage[0]->ID) . $parameter_Scenepass . $scene_id . '&wpunity_game=' . $project_id ;

$preSavedStrategies = get_post_meta($scene_id, 'wpunity_exam_strategy', true) ? get_post_meta($scene_id, 'wpunity_exam_strategy', true) : false;

if ($preSavedStrategies) {

	$preSavedStrategies = json_decode($preSavedStrategies, true);

	$arr = [];
	foreach ($preSavedStrategies as $key => $value){

		if ($value['naming']) {
			array_push ( $arr, $value['naming']);
		} else {
			array_push ( $arr, $value['construction']);
		}
	}

	$preSavedStrategies = $arr;
}

if(isset($_POST['submitted']) && isset($_POST['post_nonce_field']) && wp_verify_nonce($_POST['post_nonce_field'], 'post_nonce')) {

	// TODO: STRATEGY DELETION!
	// 1. Get new strategies array
	$savedStrategies = $_POST['json-strategies-input'];

	// 2. Load WP DB saved array

	// 3. Check if old arr has strategy NOT IN new arr

	// 4. Send GIO request to deactivate the old strategy ids

	// 5. Compare 2 arrs. If new arr has a new id, then send GIO request to create new.

	// 6. Save arrays to WPDB

	// Updating both exams with the same strategy
	$allExams = wpunity_getExamScenes_byProjectID($project_id); //get all scene exams
	foreach ($allExams as $thescene_id) {
		update_post_meta($thescene_id, 'wpunity_exam_strategy', $savedStrategies);
	}

	$savedStrategies = get_post_meta($scene_id, 'wpunity_exam_strategy', true);
	$savedStrategies = json_decode($savedStrategies, true);

	// Update GIO API with strategies
	foreach ($savedStrategies as $strategy){
		wpunity_addStrategy_APIcall($project_id, $strategy);
	}

	//wp_redirect($goBackTo_MainLab_link);
	wp_redirect($refresh_to_examPage);
	exit;
}

if(isset($_POST['submitted2']) && isset($_POST['post_nonce_field2']) && wp_verify_nonce($_POST['post_nonce_field2'], 'post_nonce')) {
	$saveEnabledMolecules = $_POST['availableMoleculesInput'];
	update_post_meta($project_id, 'wpunity_exam_enabled_molecules', $saveEnabledMolecules);
	wp_redirect($refresh_to_examPage);
	exit;
}

get_header();

?>

    <style>
        .panel { display: none; }
        .panel.active { display: block; }
        .mdc-tab { min-width: 0; }
    </style>

    <div class="PageHeaderStyle">
        <h1 class="mdc-typography--display1 mdc-theme--text-primary-on-light">
            <a title="Back" href="<?php echo $goBackTo_MainLab_link; ?>"> <i class="material-icons" style="font-size: 36px; vertical-align: top;" >arrow_back</i> </a>
			<?php echo $game_post->post_title; ?>
        </h1>

        <a href="<?php echo $gotoAdd_newAsset_page; ?>" id="addNewMoleculeBtn" class="mdc-button mdc-button--raised mdc-theme--text-primary-on-dark mdc-theme--secondary-bg HeaderButtonStyle" data-mdc-auto-init="MDCRipple">
            ADD NEW MOLECULE
        </a>

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



    <div class="mdc-toolbar">
        <div class="mdc-toolbar__row" style="min-height: 0;">
            <div class="mdc-toolbar__section mdc-toolbar__section--shrink-to-fit mdc-toolbar__section--align-start">
                <span class="mdc-toolbar__title"> <?php echo $sceneSlug; ?> </span>
            </div>

            <!--Set tab buttons-->
            <div class="mdc-toolbar__section mdc-toolbar__section--align-start" style="justify-content: flex-end">
                <nav id="dynamic-tab-bar" class="mdc-tab-bar mdc-tab-bar--indicator-secondary" role="tablist">
                    <a role="tab" aria-controls="panel-1" class="mdc-tab mdc-tab-active mdc-tab--active" href="#panel-1" >Build Strategy</a>
                    <a role="tab" aria-controls="panel-2" class="mdc-tab" href="#panel-2">Select Molecules</a>
                    <span class="mdc-tab-bar__indicator"></span>
                </nav>
            </div>

        </div>
    </div>

    <div class="panels">
        <div class="panel active" id="panel-1" role="tabpanel" aria-hidden="false">

            <div class="mdc-layout-grid">

                <form name="edit_exam_scene_form" action="" id="edit_exam_scene_form" method="POST" enctype="multipart/form-data">
                    <div class="mdc-layout-grid__inner">

                        <div class="mdc-layout-grid__cell--span-12">

                            <h2 class="mdc-typography--title">Build strategy</h2>
                            <span style="font-style: italic;" class="mdc-typography--subheading2 mdc-theme--text-secondary-on-light">
                            Select molecules to create a strategy. The active molecules order dictates the sequence of appearance in the Unity game. You can create more than one strategies.
                            </span>

                            <div class="WhiteSpaceSeparator"></div>

                            <div class="mdc-layout-grid__inner">

                                <div class="mdc-layout-grid__cell--span-12">

                                    <h2 class="mdc-typography--title">Available molecules to use in a strategy</h2>

                                    <ul id="sortable2" class="connectedSortable mdc-layout-grid__inner TextUnselectable" style="min-height: 110px; border: 4px solid rgba(63,81,181, .23); background-color: rgba(0,0,0,.23);">
										<?php
										foreach ($molecules as $molecule) {
											if (in_array($molecule['moleculeID'], $savedMoleculesVal)) { ?>

                                                <li class="mdc-layout-grid__cell mdc-layout-grid__cell--span-2">

                                                    <div class="mdc-card mdc-theme--background molecule" id="<?php echo $molecule['moleculeID'];?>" data-molec-type="<?php echo $molecule['moleculeType']; ?>">
                                                        <div style="min-height: 110px; min-width: 100%; max-height: 110px; text-align: center; overflow: hidden; position: relative; ">

															<?php if ($molecule['moleculeImage']){ ?>
                                                                <img width="495" height="330" src="<?php echo $molecule['moleculeImage']; ?>" class="attachment-post-thumbnail size-post-thumbnail wp-post-image">
															<?php } else { ?>
                                                                <div style="min-height: 110px;" class="DisplayBlock mdc-theme--secondary-bg CenterContents">
                                                                    <i style="font-size: 48px; padding-top: 30px;" class="material-icons mdc-theme--text-icon-on-background">insert_photo</i>
                                                                </div>
															<?php } ?>
                                                        </div>

                                                        <div class="mdc-card__primary">
                                                            <p class="mdc-card__title mdc-typography--subheading2" style=" white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
																<?php echo $molecule['moleculeName'];?>
                                                            </p>
                                                        </div>
                                                        <section class="mdc-card__actions">
                                                            <a id="deleteAssetBtn" data-mdc-auto-init="MDCRipple" title="Delete asset" class="mdc-button mdc-button--compact mdc-card__action"
                                                               style="display:<?php echo $shouldHideDELETE_EDIT?'none':'';?>" onclick="deleteMolecule('<?php echo $molecule['moleculeID']?>','<?php echo $gameSlug; ?>')">DELETE</a>
                                                            <a data-mdc-auto-init="MDCRipple" title="Edit asset" class="mdc-button mdc-button--compact mdc-card__action mdc-button--primary" href="<?php echo $gotoAdd_newAsset_page . '&vrodos_asset=' . $molecule['moleculeID']; ?>&<?php echo $shouldHideDELETE_EDIT?'editable=false':'editable=true' ?>">
																<?php
																echo $shouldHideDELETE_EDIT ? 'VIEW':'EDIT';
																?>
                                                            </a>
                                                        </section>

                                                    </div>
                                                </li>
											<?php }?>
										<?php }?>

                                    </ul>
                                </div>

                                <div class="mdc-layout-grid__cell--span-12">
                                    <h2 class="mdc-typography--title">Active molecules</h2>
                                    <ul id="sortable1" class="connectedSortable TextUnselectable mdc-theme--secondary-light-bg mdc-layout-grid__inner" style="min-height: 110px; border: 4px solid rgba(63,81,181, .23);">
                                    </ul>
                                </div>

                                <div class="mdc-layout-grid__cell--span-12">
                                    <a id="add-strategy-btn" class="mdc-button mdc-button--raised mdc-button--primary mdc-theme--secondary-bg" data-mdc-auto-init="MDCRipple">Add strategy</a>
                                </div>

                                <div class="mdc-layout-grid__cell--span-12">
                                    <h2 class="mdc-typography--title">Saved strategies</h2>

									<?php if ($naming) { ?>
                                        <div id="saved-strategies" class="mdc-layout-grid__inner">

											<?php if ($preSavedStrategies) {
												$analytics_molecule_list = array('HCL','H2O','NaF','NaCl','KBr','CH4','CaCl2','CF4');

												foreach ($preSavedStrategies as $key => $val) {
													$mols = array(0,0,0,0,0,0,0,0);
													foreach ($analytics_molecule_list as $idx => $molecule) {
														if (in_array( $molecule, $val)) {
															$mols[$idx] = 1;
														}
													}
													$mols = implode("", $mols); ?>

                                                    <div class="mdc-layout-grid__cell--span-3 CenterContents" id='<?php echo $key;?>'>
                                                        <span style="display:inline-block;"><?php echo json_encode($val);?></span>&nbsp;
                                                        <a style="display:inline-block;" onclick="deleteStrategy('<?php echo $key; ?>')" class="mdc-list-item CursorPointer AlignIconToMiddle " aria-label="Delete game" title="Delete project">
                                                            <i class="material-icons mdc-list-item__end-detail" aria-hidden="true" title="Delete">delete</i>
                                                        </a>
                                                        <div style="width: 100%">
                                                            <iframe style="height: 380px; border:none; width: 70%;" id="frame-<?php echo $key;?>" data-mols="<?php echo $mols; ?>"></iframe>
                                                        </div>
                                                    </div>
												<?php } ?>
											<?php } ?>

                                        </div>
									<?php } else { ?>

                                        <ul id="saved-strategies">
											<?php if ($preSavedStrategies) {
												foreach ($preSavedStrategies as $key => $val) { ?>
                                                    <li class="mdc-list-item" id='<?php echo $key; ?>'>
                                                        <span class="mdc-list-item__text"><?php echo json_encode($val); ?></span>&nbsp;
                                                        <a onclick="deleteStrategy('<?php echo $key; ?>')" class="mdc-list-item CursorPointer" aria-label="Delete game" title="Delete project">
                                                            <i class="material-icons mdc-list-item__end-detail" aria-hidden="true" title="Delete">delete</i>
                                                        </a>
                                                    </li>
												<?php } ?>
											<?php } ?>
                                        </ul>

									<?php } ?>
                                </div>

                            </div>

                        </div>


                        <input type="hidden" name="active-molecules-input" id="active-molecules-input" value="[]" />

                        <input title="strategyJson" id="molecule-json-field" name="molecule-json-field" type="hidden">

                        <input type="hidden" name="json-strategies-input" id="json-strategies-input" value="[]" />

                        <div class="mdc-layout-grid__cell--span-12">

                            <hr class="WhiteSpaceSeparator">

							<?php wp_nonce_field('post_nonce', 'post_nonce_field'); ?>
                            <input type="hidden" name="submitted" id="submitted" value="true" />

                            <button style="margin-bottom: 24px; width: 100%; height: 48px;" class="mdc-button mdc-elevation--z2 mdc-button--raised" data-mdc-auto-init="MDCRipple" type="submit">
                                Save strategies
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <!--Delete molecule Dialog-->
            <aside id="delete-dialog"
                   class="mdc-dialog"
                   role="alertdialog"
                   style="z-index: 1000;"
                   aria-labelledby="Delete molecule dialog"
                   aria-describedby="You can delete the selected from the current game project" data-mdc-auto-init="MDCDialog">
                <div class="mdc-dialog__surface">
                    <header class="mdc-dialog__header">
                        <h2 id="delete-dialog-title" class="mdc-dialog__header__title">
                            Delete molecule?
                        </h2>
                    </header>
                    <section id="delete-dialog-description" class="mdc-dialog__body">
                        Are you sure you want to delete this molecule? There is no Undo functionality once you delete it.
                    </section>

                    <section id="delete-molec-dialog-progress-bar" class="CenterContents mdc-dialog__body" style="display: none;">
                        <h3 class="mdc-typography--title">Deleting...</h3>

                        <div class="progressSlider">
                            <div class="progressSliderLine"></div>
                            <div class="progressSliderSubLine progressIncrease"></div>
                            <div class="progressSliderSubLine progressDecrease"></div>
                        </div>
                    </section>

                    <footer class="mdc-dialog__footer">
                        <a class="mdc-button mdc-dialog__footer__button--cancel mdc-dialog__footer__button" id="deleteMolecDialogCancelBtn">Cancel</a>
                        <a class="mdc-button mdc-button--primary mdc-dialog__footer__button mdc-button--raised" id="deleteMolecDialogDeleteBtn">Delete</a>
                    </footer>
                </div>
                <div class="mdc-dialog__backdrop"></div>
            </aside>

        </div>

        <div class="panel" id="panel-2" role="tabpanel" aria-hidden="true">
            <form name="create_new_strategy_form2" action="" id="create_new_strategy_form2" method="POST" enctype="multipart/form-data">
                <div class="mdc-layout-grid">

                    <h3 class="mdc-typography--subheading2"> Choose the molecules that will be available for use in the exams </h3>

                    <div class="mdc-layout-grid__inner" id="avail-molecules-list">

						<?php
						foreach ($molecules as $molecule) {
							$checked = in_array($molecule['moleculeID'], $savedMoleculesVal) ? 'checked' : '';
							?>

                            <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-3 mdc-form-field">
                                <div class="mdc-form-field">
                                    <div class="mdc-checkbox">
                                        <input name="<?php echo $molecule['moleculeID'];?>Checkbox" type="checkbox" value="<?php echo $molecule['moleculeID'];?>" id="<?php echo $molecule['moleculeID'];?>-checkbox" class="mdc-checkbox__native-control MoleculeCheckbox" <?php echo $checked; ?>>
                                        <div class="mdc-checkbox__background">
                                            <svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24">
                                                <path class="mdc-checkbox__checkmark__path" fill="none" stroke="white" d="M1.73,12.91 8.1,19.28 22.79,4.59"></path>
                                            </svg>
                                            <div class="mdc-checkbox__mixedmark"></div>
                                        </div>
                                    </div>
                                    <label class="CursorPointer" for="<?php echo $molecule['moleculeID'];?>-checkbox" style="padding: 0; margin: 0;"><?php echo $molecule['moleculeName'];?></label>
                                </div>
                            </div>

						<?php } ?>
						<?php wp_nonce_field('post_nonce', 'post_nonce_field2'); ?>
                        <input type="hidden" name="submitted2" id="submitted2" value="true" />
                        <input id="availableMoleculesInput" name="availableMoleculesInput" type="hidden" value="[]">

                    </div>

                </div>

                <div class="mdc-layout-grid">
                    <div class="mdc-layout-grid__inner">
                        <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
                            <button style="margin-bottom: 24px; width: 100%; height: 48px;" class="mdc-button mdc-elevation--z2 mdc-button--raised" data-mdc-auto-init="MDCRipple" type="submit">
                                Submit changes
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>

    </div>





    <script type="text/javascript">

        window.onload = function() {
            addStrategiesToInput();
        };

        var examTitle = "<?php echo $game_post->post_title; ?>";
        var sceneSlug = "<?php echo $sceneSlug; ?>";


        var mdc = window.mdc;
        mdc.autoInit();

        var dynamicTabBar = window.dynamicTabBar = new mdc.tabs.MDCTabBar(document.querySelector('#dynamic-tab-bar'));
        var dots = document.querySelector('.dots');
        var panels = document.querySelector('.panels');

        dynamicTabBar.preventDefaultOnClick = true;

        dynamicTabBar.listen('MDCTabBar:change', function (t) {
            var dynamicTabBar = t.detail;
            var nthChildIndex = dynamicTabBar.activeTabIndex;

            updatePanel(nthChildIndex);
        });

        var deleteDialog = document.querySelector('#delete-dialog');
        if (deleteDialog) {
            deleteDialog = new mdc.dialog.MDCDialog(deleteDialog);
            deleteDialog.focusTrap_.deactivate();
        }

        function deleteMolecule(id, game_slug) {

            deleteDialog.id = id;
            deleteDialog.game_slug = game_slug;
            deleteDialog.show();

        }

        jQuery("#deleteMolecDialogDeleteBtn").click(function () {

            jQuery('#delete-molec-dialog-progress-bar').show();

            jQuery( "#deleteMolecDialogDeleteBtn" ).addClass( "LinkDisabled" );
            jQuery( "#deleteMolecDialogCancelBtn" ).addClass( "LinkDisabled" );

            wpunity_deleteAssetAjax(deleteDialog.id, deleteDialog.game_slug);

        });

        jQuery("#deleteMolecDialogCancelBtn").click(function (e) {

            jQuery('#delete-scene-dialog-progress-bar').hide();
            deleteDialog.close();
        });

        function updatePanel(index) {
            var activePanel = panels.querySelector('.panel.active');
            if (activePanel) {
                activePanel.classList.remove('active');
            }
            var newActivePanel = panels.querySelector('.panel:nth-child(' + (index + 1) + ')');
            if (newActivePanel) {
                newActivePanel.classList.add('active');
            }
        }

        function deleteStrategy(id) {
            jQuery('#'+id).remove();
            addStrategiesToInput();
        }

        jQuery("#add-strategy-btn").click(function() {


            var naming = "<?php echo $naming;?>";
            var savedStrategiesList = jQuery( "#saved-strategies" );

            var new_id1 = makeid();
            var new_id2 = makeid();

            var strategy = jQuery("#molecule-json-field").val();

            if (strategy.length > 2) {

                var strategyId = new_id1+"strat"+new_id2;
                if (naming) {

                    var molecule_list = ['HCL','H2O','NaF','NaCl','KBr','CH4','CaCl2','CF4'];
                    var mols = [0,0,0,0,0,0,0,0];
                    for (var i = 0; i < molecule_list.length; i++) {

                        if (inArray(molecule_list[i], JSON.parse(strategy))) {
                            mols[i] = 1;
                        }
                    }
                    mols = mols.join("");

                    savedStrategiesList.append( '' +
                        '<div class="mdc-layout-grid__cell--span-3 CenterContents" id='+strategyId+'><span style="display:inline-block;">'+ strategy+ '</span>&nbsp;<a style="display:inline-block;" onclick="deleteStrategy('+"'"+strategyId+"'"+')" class="mdc-list-item CursorPointer AlignIconToMiddle" aria-label="Delete game" title="Delete project"><i class="material-icons mdc-list-item__end-detail" aria-hidden="true" title="Delete">delete</i></a><div style="width: 100%"><iframe style="height: 380px; border:none;width: 70%;" id=frame-'+ strategyId +' data-mols="'+ mols +'"></iframe></div></div>' +
                        '');

                    loadPISAClusterIframe('chemistrytool', mols, 'frame-'+strategyId);
                } else {
                    savedStrategiesList.append( '<li class="mdc-list-item" id='+strategyId+'><span class="mdc-list-item__text">'+ strategy+ '</span>&nbsp;<a onclick="deleteStrategy('+"'"+strategyId+"'"+')" class="mdc-list-item CursorPointer" aria-label="Delete game" title="Delete project"><i class="material-icons mdc-list-item__end-detail" aria-hidden="true" title="Delete">delete</i></a></li>');
                }
            }


            addStrategiesToInput();


            function inArray(needle, haystack) {
                var length = haystack.length;
                for(var i = 0; i < length; i++) {
                    if(haystack[i] == needle) return true;
                }
                return false;
            }

        });


        function addStrategiesToInput() {

            var savedStrategiesList = jQuery( "#saved-strategies" );
            var json = [];
            jQuery( savedStrategiesList.children() ).each(function( index ) {

                var val = jQuery( "span", this ).text();
                val = JSON.parse(val);

                json.push({
                    'naming': val,
                    'construction': val
                });

            });

            jQuery("#json-strategies-input").val(JSON.stringify(json));

        }

        jQuery( function() {
            jQuery( "#sortable1, #sortable2" ).sortable({
                connectWith: ".connectedSortable",
                change: function(event, ui) {
                    ui.placeholder.css({visibility: 'visible', background : 'rgba(255, 64, 129, .54)'});

                },
                receive: function(event, ui) {

                    var arr = [];
                    var typeArr = [];
                    jQuery('div','#sortable1').each(function(){

                        if (jQuery(this).attr('id')) {
                            arr.push(jQuery(this).attr('id'));
                            typeArr.push(jQuery(this).attr('data-molec-type'));
                        }
                    });

                    jQuery("#active-molecules-input").val(arr);
                    jQuery('#molecule-json-field').val(JSON.stringify(typeArr));
                },
                create: function(event, ui) {

                    var arr = [];
                    var typeArr = [];
                    jQuery('div','#sortable1').each(function(){

                        if (jQuery(this).attr('id')) {
                            arr.push(jQuery(this).attr('id'));
                            typeArr.push(jQuery(this).attr('data-molec-type'));
                        }
                    });

                    arr.reverse();
                    typeArr.reverse();

                    jQuery("#active-molecules-input").val(arr);
                    jQuery('#molecule-json-field').val(JSON.stringify(typeArr));
                },
                sort: function(event, ui) {

                    var arr = [];
                    var typeArr = [];
                    jQuery('div','#sortable1').each(function(){

                        if (jQuery(this).attr('id')) {
                            arr.push(jQuery(this).attr('id'));
                            typeArr.push(jQuery(this).attr('data-molec-type'));
                        }
                    });

                    arr.reverse();
                    typeArr.reverse();

                    jQuery("#active-molecules-input").val(arr);
                    jQuery('#molecule-json-field').val(JSON.stringify(typeArr));
                }

            }).disableSelection();

        } );


        jQuery("#copy-output-btn").click(function() {
            var copyText = document.getElementById("molecule-json-field");
            copyText.select();
            document.execCommand("Copy");
            alert("Strategy copied: " + copyText.value);
        });

        jQuery( ".MoleculeCheckbox" ).click(function() {
            var molecIds = jQuery("#avail-molecules-list input:checkbox:checked").map(function(){
                return jQuery(this).val();
            }).get();
            jQuery( "#availableMoleculesInput" ).val(JSON.stringify(molecIds));
        });

        function makeid() {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for (var i = 0; i < 5; i++)
                text += possible.charAt(Math.floor(Math.random() * possible.length));

            return text;
        }

        jQuery( "#saved-strategies" ).find( "iframe" ).each(function(){
            var mols = jQuery(this).attr('data-mols');
            var id = jQuery(this).attr('id');
            loadPISAClusterIframe('chemistrytool', mols, id);
        });


        function loadPISAClusterIframe(lab, molecules_arr, id) {

            var ip_addr = "https://analytics.envisage-h2020.eu/?";

            var url = ip_addr +
                "lab=" + lab +
                "&settings=" + molecules_arr;

            var iframe = jQuery('#'+id);
            if (iframe.length) {
                iframe.attr('src', url);
                return false;
            }
            return true;
        }


    </script>

<?php get_footer(); ?>
