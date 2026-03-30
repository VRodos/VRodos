
<dialog id="compile-dialog"
	class="tw-modal"
	style="z-index: 1000;"
	data-game-slug="<?php echo esc_attr( $projectSlug ); ?>"
	data-project-id="<?php echo esc_attr( $project_id ); ?>">

	<div class="tw-modal-box tw-p-0 tw-overflow-hidden tw-max-w-3xl tw-w-full">

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

			<div class="tw-flex tw-items-start tw-justify-between tw-gap-3 tw-flex-wrap tw-mb-4">
				<div id="constantUpdateUser" class="tw-flex tw-items-start tw-gap-2 tw-text-sm tw-text-slate-600">
					<i data-lucide="info" class="tw-w-4 tw-h-4 tw-text-slate-400 tw-flex-shrink-0 tw-mt-0.5"></i>
					Configure your scene quality settings and click "Build" to construct the virtual world.
				</div>
				<a id="compileTopResultLink" href="#" target="_blank" class="tw-btn tw-btn-sm tw-btn-outline tw-btn-primary tw-hidden">
					<i data-lucide="external-link" class="tw-w-4 tw-h-4"></i>
					Open Compiled Scene
				</a>
			</div>

			<div class="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6 tw-mb-5">
				<!-- Left Column: Quality -->
				<div class="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4">
					<div class="tw-flex tw-items-center tw-gap-2 tw-mb-4">
						<i data-lucide="monitor" class="tw-w-4 tw-h-4 tw-text-emerald-500"></i>
						<h4 class="tw-text-sm tw-font-bold tw-text-slate-800">Quality</h4>
					</div>

					<div class="tw-space-y-4">
						<div class="tw-grid tw-grid-cols-2 tw-gap-3">
							<label class="tw-form-control">
								<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Render</span>
								<select id="compileRenderQualitySelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
									<option value="standard">Standard</option>
									<option value="high">High</option>
								</select>
							</label>
							<label class="tw-form-control">
								<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Shadows</span>
								<select id="compileShadowQualitySelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
									<option value="off">Off</option>
									<option value="medium">Medium</option>
									<option value="high">High</option>
								</select>
							</label>
						</div>

						<label class="tw-form-control">
							<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Anti-Aliasing</span>
							<select id="compileAAQualitySelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
								<option value="off">Off</option>
								<option value="balanced">Balanced</option>
								<option value="high">High</option>
								<option value="ultra">Ultra</option>
							</select>
						</label>

						<div class="tw-grid tw-grid-cols-2 tw-gap-3 tw-pt-2 tw-border-t tw-border-slate-200">
							<label class="tw-form-control">
								<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Boosts baked AO map intensity on models that include occlusion textures">AO Map Boost</span>
								<select id="compileAmbientOcclusionPresetSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
									<option value="off">Off</option>
									<option value="soft">Soft</option>
									<option value="balanced">Balanced</option>
									<option value="strong">Strong</option>
								</select>
							</label>
							<label class="tw-form-control">
								<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Adjusts shadow bias to reduce artifacts and improve shadow precision">Shadow Precision</span>
								<select id="compileContactShadowPresetSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
									<option value="off">Off</option>
									<option value="soft">Soft</option>
									<option value="strong">Strong</option>
								</select>
							</label>
						</div>

						<label class="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-pt-2 tw-border-t tw-border-slate-200">
							<div>
								<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">FPS Meter</span>
								<p class="tw-text-[10px] tw-text-slate-400 tw-mt-0.5">Shows a live FPS counter in compiled scenes for quality testing.</p>
							</div>
							<input id="compileFPSMeterToggle" type="checkbox" class="tw-toggle tw-toggle-primary tw-toggle-xs">
						</label>
					</div>
				</div>

				<!-- Right Column: Cinematic Effects -->
				<div class="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4">
					<div class="tw-flex tw-items-center tw-justify-between tw-mb-4">
						<div class="tw-flex tw-items-center tw-gap-2">
							<i data-lucide="sparkles" class="tw-w-4 tw-h-4 tw-text-amber-500"></i>
							<h4 class="tw-text-sm tw-font-bold tw-text-slate-800">Cinematic FX</h4>
						</div>
						<input id="compilePostFxToggle" type="checkbox" class="tw-toggle tw-toggle-primary tw-toggle-xs">
					</div>

					<div id="compilePostFxGroup" class="tw-space-y-4 tw-transition-opacity tw-duration-200 tw-opacity-50 tw-pointer-events-none">
						<div class="tw-grid tw-grid-cols-2 tw-gap-3">
							<label class="tw-form-control">
								<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Bloom</span>
								<select id="compileBloomStrengthSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1" disabled>
									<option value="off">Off</option>
									<option value="soft">Soft</option>
									<option value="medium">Medium</option>
								</select>
							</label>
							<label class="tw-form-control">
								<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Reflection</span>
								<select id="compileReflectionProfileSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1" disabled>
									<option value="soft">Soft</option>
									<option value="balanced">Balanced</option>
									<option value="enhanced">Enhanced</option>
								</select>
							</label>
						</div>

						<div class="tw-pt-2 tw-border-t tw-border-slate-200">
							<label class="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer tw-mb-2">
								<input id="compilePostFxColorToggle" type="checkbox" class="tw-checkbox tw-checkbox-primary tw-checkbox-xs" disabled>
								<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Color Grading</span>
							</label>
							<div class="tw-grid tw-grid-cols-2 tw-gap-3">
								<label class="tw-form-control">
									<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-400">Exposure</span>
									<select id="compileExposurePresetSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1" disabled>
										<option value="neutral">Neutral</option>
										<option value="bright">Bright</option>
										<option value="cinematic">Cinematic</option>
									</select>
								</label>
								<label class="tw-form-control">
									<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-400">Contrast</span>
									<select id="compileContrastPresetSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1" disabled>
										<option value="soft">Soft</option>
										<option value="balanced">Balanced</option>
										<option value="punchy">Punchy</option>
									</select>
								</label>
							</div>
						</div>

						<div class="tw-pt-2 tw-border-t tw-border-slate-200">
							<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
								<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Edge Smoothing</span>
								<span id="compileEdgeAAStrengthValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px] tw-font-bold tw-uppercase">Balanced</span>
							</div>
							<input id="compileEdgeAAStrengthSlider" type="range" min="0" max="5" step="1" value="3" class="tw-range tw-range-primary tw-range-xs tw-mt-1" disabled>
						</div>
					</div>
				</div>
			</div>

			<!-- Build Progress Area -->
			<div id="compilationProgressContainer" class="tw-mb-4" style="display: none;">
				<h2 id="compileProgressTitle" class="tw-text-center tw-text-lg tw-font-bold tw-text-slate-700 tw-mb-2">Developing Virtual World...</h2>

				<div class="progressSlider" id="compileProgressDeterminate" style="display: none;">
					<div class="progressSliderLine"></div>
					<div class="progressSliderSubLineDeterminate" id="progressSliderSubLineDeterminateValue"></div>
				</div>

				<div class="progressSlider" id="compileProgressSlider" style="display: none;">
					<div class="progressSliderLine"></div>
					<div class="progressSliderSubLine progressIncrease"></div>
					<div class="progressSliderSubLine progressDecrease"></div>
				</div>

				<div id="compilationProgressText" class="tw-text-center tw-text-xs tw-font-semibold tw-text-slate-500 tw-mt-2"></div>
			</div>

			<div id="previewApp" class="previewApp" style="display:none"></div>

			<div id="appResultDiv" class="tw-rounded-xl tw-bg-emerald-50 tw-border tw-border-emerald-100 tw-p-4 tw-flex tw-items-center tw-justify-between tw-gap-3 tw-flex-wrap" style="display:none">
				<div class="tw-flex tw-items-center tw-gap-3">
					<div class="tw-w-8 tw-h-8 tw-bg-emerald-100 tw-text-emerald-600 tw-rounded-lg tw-flex tw-items-center tw-justify-center">
						<i data-lucide="check-circle" class="tw-w-4 tw-h-4"></i>
					</div>
					<div>
						<p class="tw-text-sm tw-font-bold tw-text-emerald-900">Build Successful</p>
						<p class="tw-text-xs tw-text-emerald-700">The experience is ready to be shared</p>
					</div>
				</div>
				<div class="tw-flex tw-items-center tw-gap-2">
					<a class="tw-btn tw-btn-ghost tw-btn-sm tw-text-emerald-700" href="" id="vrodos-weblink" target="_blank">
						<i data-lucide="external-link" class="tw-w-4 tw-h-4"></i>
						Copy Link
					</a>
					<button id="buttonCopyWebLink" class="tw-btn tw-btn-ghost tw-btn-sm tw-text-emerald-700">
						<i data-lucide="copy" class="tw-w-4 tw-h-4"></i>
					</button>
					<a id="openWebLinkhref" href="#" target="_blank" class="tw-btn tw-btn-primary tw-btn-sm"
					   onclick="document.getElementById('compileCancelBtn').click();">
						<i data-lucide="rocket" class="tw-w-4 tw-h-4"></i>
						Launch
					</a>
				</div>
			</div>
		</div>

		<!-- Footer -->
		<div class="tw-modal-action tw-bg-slate-50 tw-p-4 tw-m-0 tw-flex tw-justify-end tw-gap-3 tw-border-t tw-border-slate-200">
			<button id="compileCancelBtn" class="tw-btn tw-btn-ghost tw-text-slate-500 tw-btn-sm">Cancel</button>
			<a id="compileProceedBtn" type="button" class="tw-btn tw-btn-primary tw-btn-sm tw-px-6">
				<i data-lucide="hammer" class="tw-w-4 tw-h-4"></i>
				Build Project
			</a>
		</div>
	</div>
	<form method="dialog" class="tw-modal-backdrop">
		<button class="tw-cursor-default tw-outline-none tw-bg-slate-900/40 tw-backdrop-blur-sm tw-appearance-none tw-border-none tw-text-transparent">close</button>
	</form>
</dialog>
