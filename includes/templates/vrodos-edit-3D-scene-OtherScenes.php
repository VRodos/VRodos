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
