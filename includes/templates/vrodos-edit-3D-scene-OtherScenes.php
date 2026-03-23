<?php
// 1. Get all scenes that belong to this parent project
// 2. Create tabs
// 3. Create scenes dialogue
// 4. Delete dialogue

global $project_id;
global $project_type;
global $parent_project_id_as_term_id;
global $current_scene_id;
global $editscenePage;
global $parameter_Scenepass;
?>

<div id="scenesInsideVREditor">

	<?php

	// Get all scenes that have as parent this project
	$custom_query = VRodos_Core_Manager::getProjectScenes( $parent_project_id_as_term_id );

	if ( $custom_query->have_posts() ) :
		while ( $custom_query->have_posts() ) :

			$custom_query->the_post();
			$scene_id    = get_the_ID();
			$scene_title = get_the_title();
			$scene_desc  = get_the_content();

			// Is this the currently edited scene?
			$is_current = ( $current_scene_id == $scene_id );

			// Get scene type
			$scene_type = get_post_meta( $scene_id, 'vrodos_scene_metatype', true );

			// 0 or 1: depending if this scene is the default one
			$default_scene = get_post_meta( $scene_id, 'vrodos_scene_default', true );

			// Create the link when scene is clicked to be edited
			$edit_scene_page_id = $editscenePage ? $editscenePage[0]->ID : '';

			// Url when the scene is deleted
			$url_redirect_delete_scene = get_permalink( $edit_scene_page_id ) . $parameter_Scenepass .
				$scene_id . '&vrodos_game=' . $project_id . '&scene_type=' . $scene_type;

			// Create redirect javascript
			if ( $default_scene ) {
				echo '<script>';
				echo 'var url_scene_redirect="' . $url_redirect_delete_scene . '";';
				echo '</script>';
			}

			$edit_page_link = esc_url( $url_redirect_delete_scene );

			?>

			<!-- Scene Card -->
			<div id="scene-<?php echo $scene_id; ?>" class="SceneCardContainer">
				<div class="tw-rounded-lg tw-overflow-hidden tw-shadow-md tw-bg-white tw-border <?php echo $is_current ? 'tw-border-emerald-400 tw-ring-2 tw-ring-emerald-200' : 'tw-border-slate-200'; ?> tw-transition-all hover:tw-shadow-lg">

					<!-- Thumbnail -->
					<div class="SceneThumbnail">
						<a href="<?php echo $edit_page_link; ?>" class="tw-block tw-w-full tw-h-full">
							<?php if ( has_post_thumbnail( $scene_id ) ) : ?>
								<?php echo get_the_post_thumbnail( $scene_id, 'thumbnail', ['class' => 'tw-w-full tw-h-full tw-object-cover'] ); ?>
							<?php else : ?>
								<div class="tw-w-full tw-h-full tw-bg-slate-100 tw-flex tw-items-center tw-justify-center">
									<i data-lucide="image" class="tw-w-8 tw-h-8 tw-text-slate-300"></i>
								</div>
							<?php endif; ?>
						</a>
					</div>

					<!-- Title + Delete -->
					<div class="tw-flex tw-items-center tw-px-1.5 tw-py-1 tw-gap-1 <?php echo $is_current ? 'tw-bg-emerald-50' : 'tw-bg-white'; ?>">
						<span id="<?php echo $scene_id; ?>-title"
							  class="tw-flex-1 tw-min-w-0 tw-truncate tw-text-xs tw-font-semibold"
							  title="<?php echo esc_attr( $scene_title ); ?>">
							<a href="<?php echo $edit_page_link; ?>"
							   class="tw-text-slate-700 tw-no-underline hover:tw-text-emerald-600 tw-transition-colors">
								<?php echo esc_html( $scene_title ); ?>
							</a>
						</span>

						<?php if ( ! $default_scene ) : ?>
							<button type="button" title="Delete scene"
									data-sceneid="<?php echo $scene_id; ?>"
									class="cardDeleteIcon tw-p-0.5 tw-text-slate-400 hover:tw-text-rose-500 tw-transition-colors tw-flex-shrink-0 tw-cursor-pointer tw-bg-transparent tw-border-none">
								<i data-lucide="trash-2" class="tw-w-3.5 tw-h-3.5"></i>
							</button>
						<?php endif; ?>
					</div>
				</div>
			</div>
			<?php
		endwhile;
	endif;
	?>


	<!-- Add New Scene Card -->
	<div id="add-new-scene-card" class="SceneCardContainer">
		<form name="create_new_scene_form" action="" id="create_new_scene_form"
			  method="POST" enctype="multipart/form-data" class="tw-m-0">

			<?php wp_nonce_field( 'post_nonce', 'post_nonce_field' ); ?>

			<input type="hidden" name="submitted" id="submitted" value="true" />
			<input type="hidden" name="project_id" value="<?php echo esc_attr( $project_id ); ?>">

			<div class="tw-rounded-lg tw-border-2 tw-border-dashed tw-border-slate-300 tw-bg-slate-50/80 tw-overflow-hidden tw-flex tw-flex-col tw-h-full hover:tw-border-emerald-400 tw-transition-colors">
				<div class="tw-flex-1 tw-flex tw-flex-col tw-items-center tw-justify-center tw-px-2 tw-py-2 tw-gap-1">
					<i data-lucide="plus-circle" class="tw-w-6 tw-h-6 tw-text-slate-400"></i>
					<input id="title" name="scene-title" type="text"
						   class="tw-input tw-input-xs tw-input-bordered tw-w-full tw-text-center tw-text-xs"
						   placeholder="Scene title" required minlength="3" maxlength="25">
				</div>
				<button type="submit" class="tw-btn tw-btn-xs tw-btn-primary tw-w-full tw-rounded-none tw-rounded-b-lg">
					<i data-lucide="plus" class="tw-w-3 tw-h-3 tw-mr-1"></i>
					ADD NEW
				</button>
			</div>
		</form>
	</div>


	<!--Delete Scene Dialog-->
	<dialog id="delete-dialog" class="tw-modal" style="z-index: 1000;">
		<div class="tw-modal-box tw-p-0 tw-overflow-hidden">
			<!-- Header -->
			<div class="tw-p-8 tw-pb-4 tw-flex tw-flex-col tw-items-center tw-text-center">
				<div class="tw-w-16 tw-h-16 tw-bg-rose-50 tw-text-rose-500 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-mb-4">
					<i data-lucide="alert-circle" class="tw-w-8 tw-h-8"></i>
				</div>
				<h3 id="delete-dialog-title" class="tw-text-xl tw-font-bold tw-text-slate-800 tw-mb-1">Delete scene?</h3>
				<p class="tw-text-[10px] tw-font-black tw-text-slate-400 tw-uppercase tw-tracking-widest">Permanent Action</p>
			</div>
			<!-- Body -->
			<div class="tw-px-8 tw-pb-6 tw-text-center">
				<p id="delete-dialog-description" class="tw-text-slate-500 tw-text-sm tw-leading-relaxed">
					Are you sure you want to delete this scene? There is no Undo functionality once you delete it.
				</p>
				<div id="delete-scene-dialog-progress-bar" class="tw-mt-6" style="display: none;">
					<p class="tw-text-[10px] tw-font-bold tw-text-error tw-mb-2 tw-uppercase tw-tracking-widest">Deleting...</p>
					<div class="vrodos-progress-track">
						<div class="vrodos-progress-bar vrodos-progress-error vrodos-indeterminate"></div>
					</div>
				</div>
			</div>
			<!-- Actions -->
			<div class="tw-modal-action tw-bg-white tw-p-6 tw-pt-2 tw-flex tw-justify-center tw-gap-3">
				<button class="tw-btn tw-btn-ghost tw-text-slate-400 hover:tw-text-slate-600 tw-px-8"
					id="deleteSceneDialogCancelBtn"
					onclick="document.getElementById('delete-dialog').close()">CANCEL</button>
				<button class="tw-btn vrodos-btn-premium-error tw-px-10"
					id="deleteSceneDialogDeleteBtn">DELETE</button>
			</div>
		</div>
		<form method="dialog" class="tw-modal-backdrop">
			<button class="tw-cursor-default tw-outline-none tw-bg-slate-900/40 tw-backdrop-blur-sm tw-appearance-none tw-border-none tw-text-transparent">close</button>
		</form>
	</dialog>
</div><!-- Scenes List Div -->
