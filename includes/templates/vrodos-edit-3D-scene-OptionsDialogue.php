<?php
	global $current_scene_id;
?>

<!-- Scene Options Dialog -->
<dialog id="options-dialog" class="tw-modal" style="z-index: 1000;">
	<div class="tw-modal-box tw-p-0 tw-overflow-hidden" style="max-width: 800px; width: 90vw;">

		<!-- Header -->
		<div class="tw-p-6 tw-pb-3 tw-flex tw-items-center tw-gap-3 tw-border-b tw-border-slate-200">
			<div class="tw-w-10 tw-h-10 tw-bg-blue-50 tw-text-blue-600 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
				<i data-lucide="settings" class="tw-w-5 tw-h-5"></i>
			</div>
			<div>
				<h3 class="tw-text-lg tw-font-bold tw-text-slate-800">Scene options</h3>
				<p class="tw-text-xs tw-text-slate-400">Description and screenshot settings</p>
			</div>
			<button type="button"
					class="tw-ml-auto tw-p-1.5 tw-text-slate-400 hover:tw-text-slate-700 tw-rounded-lg hover:tw-bg-slate-100 tw-transition-colors"
					title="Close"
					onclick="document.getElementById('options-dialog').close()">
				<i data-lucide="x" class="tw-w-4 tw-h-4"></i>
			</button>
		</div>

		<!-- Body -->
		<div class="tw-p-6">
			<div class="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">

				<!-- Description column -->
				<div class="tw-flex tw-flex-col tw-gap-2">
					<h4 class="tw-text-sm tw-font-semibold tw-text-slate-700 tw-flex tw-items-center tw-gap-2">
						<i data-lucide="file-text" class="tw-w-4 tw-h-4 tw-text-slate-400"></i>
						Description
					</h4>
					<textarea id="sceneCaptionInput" name="sceneCaptionInput"
							  class="tw-textarea tw-textarea-bordered tw-w-full tw-h-48 tw-text-sm"
							  rows="10" form="3dAssetForm"
							  placeholder="Add a description for this scene..."><?php
						echo get_post_meta(
							$current_scene_id,
							'vrodos_scene_caption',
							true
						);
					?></textarea>
				</div>

				<!-- Screenshot column -->
				<div class="tw-flex tw-flex-col tw-gap-3">
					<h4 class="tw-text-sm tw-font-semibold tw-text-slate-700 tw-flex tw-items-center tw-gap-2">
						<i data-lucide="camera" class="tw-w-4 tw-h-4 tw-text-slate-400"></i>
						Screenshot
					</h4>

					<?php
					$screenshotImgUrl = get_the_post_thumbnail_url( $current_scene_id );
					if ( $screenshotImgUrl == '' ) {
						echo '<script type="application/javascript">'
							. 'is_scene_icon_manually_selected=false</script>';
					} else {
						echo '<script type="application/javascript">'
							. 'is_scene_icon_manually_selected=true</script>';
					}

					?>

					<div class="tw-rounded-lg tw-border tw-border-slate-200 tw-overflow-hidden tw-bg-slate-50 tw-flex tw-items-center tw-justify-center tw-p-2">
						<?php if ( $screenshotImgUrl ) : ?>
							<img width="300" id="vrodos_scene_sshot" alt="VRodos scene screenshot"
								 class="tw-rounded tw-max-w-full tw-h-auto"
								 src="<?php echo esc_url( $screenshotImgUrl ); ?>">
						<?php else : ?>
							<div id="vrodos_scene_sshot_placeholder" class="tw-w-full tw-min-h-[180px] tw-flex tw-items-center tw-justify-center tw-text-slate-300">
								<i data-lucide="image-off" class="tw-w-16 tw-h-16"></i>
							</div>
							<img width="300" id="vrodos_scene_sshot" alt="VRodos scene screenshot"
								 class="tw-rounded tw-max-w-full tw-h-auto tw-hidden"
								 src="">
						<?php endif; ?>
					</div>

					<input type="file"
						   class="tw-file-input tw-file-input-bordered tw-file-input-sm tw-w-full"
						   name="vrodos_scene_sshot_manual_select"
						   title="Featured image"
						   value=""
						   id="vrodos_scene_sshot_manual_select"
						   accept="image/x-png,image/gif,image/jpeg">

					<div class="tw-flex tw-items-center tw-gap-3">
						<span class="tw-text-xs tw-text-slate-400 tw-font-semibold">or</span>
						<button type="button" title="Capture screenshot from 3D editor"
								id="takeScreenshotBtn" class="tw-btn tw-btn-sm tw-btn-primary tw-btn-outline">
							<i data-lucide="camera" class="tw-w-4 tw-h-4 tw-mr-1"></i>
							Take a screenshot
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Footer -->
		<div class="tw-modal-action tw-bg-slate-50 tw-p-4 tw-flex tw-justify-end tw-gap-3 tw-border-t tw-border-slate-200">
			<button id="sceneDialogOKBtn" class="tw-btn tw-btn-primary tw-px-8"
					onclick="document.getElementById('options-dialog').close()">OK</button>
		</div>
	</div>
	<form method="dialog" class="tw-modal-backdrop">
		<button class="tw-cursor-default tw-outline-none tw-bg-slate-900/40 tw-backdrop-blur-sm tw-appearance-none tw-border-none tw-text-transparent">close</button>
	</form>
</dialog>
