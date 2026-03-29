
<dialog id="compile-dialog"
	class="tw-modal"
	style="z-index: 1000;"
	data-game-slug="<?php echo esc_attr( $projectSlug ); ?>"
	data-project-id="<?php echo esc_attr( $project_id ); ?>">

	<div class="tw-modal-box tw-p-0 tw-overflow-hidden" style="max-width: 1100px; width: 90vw;">

		<!-- Header -->
		<div class="tw-p-6 tw-pb-3 tw-flex tw-items-center tw-gap-3 tw-border-b tw-border-slate-200">
			<div class="tw-w-10 tw-h-10 tw-bg-emerald-50 tw-text-emerald-600 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
				<i data-lucide="hammer" class="tw-w-5 tw-h-5"></i>
			</div>
			<div>
				<h3 class="tw-text-lg tw-font-bold tw-text-slate-800">Build <?php echo esc_html( $single_lowercase ); ?></h3>
				<p class="tw-text-xs tw-text-slate-400">Compile your scene into a deployable experience</p>
			</div>
		</div>

		<!-- Body -->
		<div class="tw-p-6">

			<!--Values are important. Dont delete these hidden inputs (yet)-->
			<input id="platformInput" type="hidden" value="platform-Aframe">
			<input id="project-type" type="hidden" value="<?php echo esc_attr( strtolower( $project_type ) ); ?>">

			<div id="constantUpdateUser" class="tw-flex tw-items-start tw-gap-2 tw-text-sm tw-text-slate-600 tw-mb-4">
				<i data-lucide="info" class="tw-w-4 tw-h-4 tw-text-slate-400 tw-flex-shrink-0 tw-mt-0.5"></i>
				Click on "Build" in order to construct the virtual world.
			</div>

			<div class="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4 tw-mb-5">
				<div class="tw-flex tw-items-start tw-justify-between tw-gap-4 tw-mb-4">
					<div>
						<h4 class="tw-text-sm tw-font-semibold tw-text-slate-800">Render Quality</h4>
						<p class="tw-text-xs tw-text-slate-500">These settings affect the compiled A-Frame output and are saved with the scene.</p>
					</div>
				</div>

				<div class="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
					<label class="tw-form-control">
						<span class="tw-label-text tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-slate-500">Render Quality</span>
						<select id="compileRenderQualitySelect" class="tw-select tw-select-bordered tw-select-sm tw-w-full tw-mt-1">
							<option value="standard">Standard</option>
							<option value="high">High</option>
						</select>
					</label>

					<label class="tw-form-control">
						<span class="tw-label-text tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-slate-500">Shadow Quality</span>
						<select id="compileShadowQualitySelect" class="tw-select tw-select-bordered tw-select-sm tw-w-full tw-mt-1">
							<option value="off">Off</option>
							<option value="medium">Medium</option>
							<option value="high">High</option>
						</select>
					</label>
				</div>

				<label class="tw-flex tw-items-start tw-gap-3 tw-mt-4">
					<input id="compilePostFxToggle" type="checkbox" class="tw-checkbox tw-checkbox-sm tw-mt-0.5">
					<span>
						<span class="tw-block tw-text-sm tw-font-medium tw-text-slate-700">Enable cinematic post-processing</span>
						<span id="compilePostFxHelp" class="tw-block tw-text-xs tw-text-slate-500">Available in High render quality for a subtle cinematic finish.</span>
					</span>
				</label>
			</div>

			<h2 id="compileProgressTitle" style="display: none" class="tw-text-center tw-text-xl tw-font-bold tw-text-slate-700 tw-my-4"></h2>

			<div class="progressSlider" id="compileProgressDeterminate" style="display: none;">
				<div class="progressSliderLine"></div>
				<div class="progressSliderSubLineDeterminate" id="progressSliderSubLineDeterminateValue"></div>
			</div>

			<div class="progressSlider" id="compileProgressSlider" style="display: none;">
				<div class="progressSliderLine"></div>
				<div class="progressSliderSubLine progressIncrease"></div>
				<div class="progressSliderSubLine progressDecrease"></div>
			</div>

			<div id="compilationProgressText" class="tw-text-sm tw-font-semibold tw-text-slate-700"></div>

			<hr class="tw-my-4 tw-border-slate-200">

			<a id="compileProceedBtn" type="button" class="tw-btn tw-btn-primary tw-px-8">
				<i data-lucide="hammer" class="tw-w-4 tw-h-4"></i>
				Build
			</a>

			<hr class="tw-my-4 tw-border-slate-200">

			<div id="previewApp" class="previewApp" style="display:inline-block"></div>

			<div id="appResultDiv" class="tw-mt-5 tw-flex tw-items-center tw-gap-3 tw-flex-wrap" style="display:none">
				<a class="tw-text-primary tw-font-semibold tw-text-sm" href="" id="vrodos-weblink" target="_blank">
					<i data-lucide="external-link" class="tw-w-4 tw-h-4 tw-inline-block tw-mr-1"></i>Web link
				</a>
				<button title="Copy link to clipboard" id="buttonCopyWebLink" class="tw-btn tw-btn-ghost tw-btn-sm tw-text-slate-500">
					<i data-lucide="copy" class="tw-w-4 tw-h-4"></i>
				</button>
				<a id="openWebLinkhref" href="#" title="Open index.html in new window" target="_blank"
				   class="tw-btn tw-btn-ghost tw-btn-sm tw-text-primary"
				   onclick="document.getElementById('compileCancelBtn').click();">
					<i data-lucide="external-link" class="tw-w-4 tw-h-4 tw-mr-1"></i>Open experience
				</a>
			</div>
		</div>

		<!-- Footer -->
		<div class="tw-modal-action tw-bg-slate-50 tw-p-4 tw-flex tw-justify-end tw-gap-3 tw-border-t tw-border-slate-200">
			<button id="compileCancelBtn" class="tw-btn tw-btn-ghost tw-text-slate-500">Close</button>
		</div>
	</div>
	<form method="dialog" class="tw-modal-backdrop">
		<button class="tw-cursor-default tw-outline-none tw-bg-slate-900/40 tw-backdrop-blur-sm tw-appearance-none tw-border-none tw-text-transparent">close</button>
	</form>
</dialog>
