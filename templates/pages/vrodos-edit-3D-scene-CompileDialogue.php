
<dialog id="compile-dialog"
	class="tw-modal"
	style="z-index: 1000;"
	data-game-slug="<?php echo esc_attr( $projectSlug ); ?>"
	data-project-id="<?php echo esc_attr( $project_id ); ?>">

	<div class="tw-modal-box tw-p-0 tw-overflow-hidden tw-max-w-3xl tw-w-full tw-max-h-[90vh] tw-flex tw-flex-col">

		<!-- Header -->
		<div class="tw-p-4 tw-px-6 tw-flex tw-items-center tw-gap-3 tw-border-b tw-border-slate-200 tw-flex-shrink-0">
			<div class="tw-w-10 tw-h-10 tw-bg-emerald-50 tw-text-emerald-600 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
				<i data-lucide="hammer" class="tw-w-5 tw-h-5"></i>
			</div>
			<div class="tw-flex-1">
				<h3 class="tw-text-lg tw-font-bold tw-text-slate-800">Build <?php echo esc_html( $single_lowercase ); ?></h3>
				<p class="tw-text-xs tw-text-slate-400">Compile your scene into a deployable experience</p>
			</div>
			<div class="tw-flex tw-items-center tw-gap-2 tw-flex-shrink-0">
				<button id="compileCancelBtn" class="tw-btn tw-btn-ghost tw-text-slate-500 tw-btn-sm">Cancel</button>
				<a id="compileProceedBtn" type="button" class="tw-btn tw-btn-primary tw-btn-sm tw-px-6">
					<i data-lucide="hammer" class="tw-w-4 tw-h-4"></i>
					Build Project
				</a>
				<button type="button"
						class="tw-p-1.5 tw-text-slate-400 hover:tw-text-slate-700 tw-rounded-lg hover:tw-bg-slate-100 tw-transition-colors"
						title="Close"
						onclick="document.getElementById('compile-dialog').close()">
					<i data-lucide="x" class="tw-w-4 tw-h-4"></i>
				</button>
			</div>
		</div>

		<!-- Body -->
		<div class="tw-p-6 tw-overflow-y-auto tw-flex-1">

			<!--Values are important. Dont delete these hidden inputs (yet)-->
			<input id="platformInput" type="hidden" value="platform-Aframe">
			<input id="project-type" type="hidden" value="<?php echo esc_attr( strtolower( $project_type ) ); ?>">

			<div class="tw-mb-4">
				<div id="compileStatusRow" class="tw-flex tw-items-start tw-justify-between tw-gap-3 tw-flex-wrap">
					<div id="constantUpdateUser" class="tw-flex tw-items-start tw-gap-2 tw-text-sm tw-text-slate-600">
						<i data-lucide="info" class="tw-w-4 tw-h-4 tw-text-slate-400 tw-flex-shrink-0 tw-mt-0.5"></i>
						Configure your scene quality settings and click "Build" to construct the virtual world.
					</div>
					<a id="compileTopResultLink" href="#" target="_blank" class="tw-btn tw-btn-sm tw-btn-outline tw-btn-primary tw-hidden">
						<i data-lucide="external-link" class="tw-w-4 tw-h-4"></i>
						Open Compiled Scene
					</a>
				</div>

				<div id="appResultDiv" class="tw-rounded-xl tw-bg-emerald-50 tw-border tw-border-emerald-100 tw-p-4 tw-flex tw-items-center tw-justify-between tw-gap-3 tw-flex-wrap" style="display:none">
					<div class="tw-flex tw-items-center tw-gap-3">
						<div class="tw-w-8 tw-h-8 tw-bg-emerald-100 tw-text-emerald-600 tw-rounded-lg tw-flex tw-items-center tw-justify-center">
							<i data-lucide="check-circle" class="tw-w-4 tw-h-4"></i>
						</div>
						<div>
							<p class="tw-text-sm tw-font-bold tw-text-emerald-900">Build Successful</p>
							<p id="compileResultMeta" class="tw-text-xs tw-text-emerald-700">The experience is ready to be shared</p>
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

			<div class="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6 tw-mb-5 tw-items-start">
				<!-- Left Column: Global Settings -->
				<div class="tw-flex tw-flex-col tw-gap-4">
					
					<!-- Card: Base Render Quality -->
					<div class="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4">
						<div class="tw-flex tw-items-center tw-gap-2 tw-mb-4">
							<i data-lucide="monitor" class="tw-w-4 tw-h-4 tw-text-emerald-500"></i>
							<h4 class="tw-text-sm tw-font-bold tw-text-slate-800">Base Render Quality</h4>
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

							<label id="compileAAQualityWrapper" class="tw-form-control">
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
									<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Screen-space ambient occlusion darkens crevices and corners dynamically, plus boosts baked AO maps">Ambient Occlusion (SSAO)</span>
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
						</div>
					</div>

					<!-- Card: Environment & Tools -->
					<div class="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4">
						<div class="tw-flex tw-items-center tw-gap-2 tw-mb-4">
							<i data-lucide="globe" class="tw-w-4 tw-h-4 tw-text-sky-500"></i>
							<h4 class="tw-text-sm tw-font-bold tw-text-slate-800">Environment &amp; Tools</h4>
						</div>

						<div class="tw-space-y-4">
							<div class="tw-grid tw-grid-cols-2 tw-gap-3">
								<label class="tw-form-control">
									<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Choose between HDR reflections or a live scene-based reflection probe">Reflection Source</span>
									<select id="compileReflectionSourceSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
										<option value="hdr">HDR</option>
										<option value="scene-probe">Scene Probe</option>
									</select>
								</label>
								<label id="compileEnvMapPresetWrapper" class="tw-form-control">
									<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="HDR environment map for PBR reflections and lighting">Env Lighting</span>
									<select id="compileEnvMapPresetSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
										<option value="none">None</option>
										<option value="studio">Studio</option>
										<option value="quarry">Quarry</option>
										<option value="venice">Venice Sunset</option>
									</select>
								</label>
							</div>

							<div id="compileLegacyHorizonStageSizeRow" class="tw-pt-2 tw-border-t tw-border-slate-200">
								<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
									<div>
										<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Legacy Horizon Size</span>
										<p class="tw-text-[10px] tw-text-slate-400 tw-mt-0.5">Expands the A-Frame environment dome for Legacy + HORIZON scenes.</p>
									</div>
									<span id="compileLegacyHorizonStageSizeValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px]">5000</span>
								</div>
								<input id="compileLegacyHorizonStageSizeSlider" type="range" min="500" max="8000" step="100" value="5000" class="tw-range tw-range-primary tw-range-xs">
							</div>

							<label class="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-pt-2 tw-border-t tw-border-slate-200">
								<div>
									<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">FPS Meter</span>
									<p class="tw-text-[10px] tw-text-slate-400 tw-mt-0.5">Shows a live FPS counter in compiled scenes for quality testing.</p>
								</div>
								<input id="compileFPSMeterToggle" type="checkbox" class="tw-toggle tw-toggle-primary tw-toggle-xs">
							</label>
							<label class="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-pt-2 tw-border-t tw-border-slate-200">
								<div>
									<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Hovering Interactables</span>
									<p class="tw-text-[10px] tw-text-slate-400 tw-mt-0.5">Enables a subtle floating animation on interactive markers.</p>
								</div>
								<input id="compileHoveringInteractablesToggle" type="checkbox" class="tw-toggle tw-toggle-primary tw-toggle-xs">
							</label>
						</div>
					</div>

					<!-- Card: Universal Cinematic Effects -->
					<div class="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4">
						<div class="tw-flex tw-items-center tw-justify-between tw-mb-4">
							<div class="tw-flex tw-items-center tw-gap-2">
								<i data-lucide="sparkles" class="tw-w-4 tw-h-4 tw-text-amber-500"></i>
								<h4 class="tw-text-sm tw-font-bold tw-text-slate-800">Universal Cinematic FX</h4>
							</div>
							<input id="compilePostFxToggle" type="checkbox" class="tw-toggle tw-toggle-primary tw-toggle-xs">
						</div>

						<div id="compileUniversalPostFxGroup" class="tw-space-y-4">
							<div class="tw-grid tw-grid-cols-2 tw-gap-3">
								<label class="tw-form-control">
									<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Bloom Preset</span>
									<select id="compileBloomStrengthSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
										<option value="off">Off</option>
										<option value="soft">Soft</option>
										<option value="medium">Medium</option>
									</select>
								</label>
								<label class="tw-form-control">
									<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Reflection Profile</span>
									<select id="compileReflectionProfileSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
										<option value="soft">Soft</option>
										<option value="balanced">Balanced</option>
										<option value="enhanced">Enhanced</option>
									</select>
								</label>
							</div>

							<div class="tw-pt-2 tw-border-t tw-border-slate-200">
								<label class="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer tw-mb-2">
									<input id="compilePostFxColorToggle" type="checkbox" class="tw-checkbox tw-checkbox-primary tw-checkbox-xs">
									<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Color Grading</span>
								</label>
								<div id="compileColorGradingWrapper" class="tw-grid tw-grid-cols-2 tw-gap-3">
									<label class="tw-form-control">
										<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-400">Exposure Preset</span>
										<select id="compileExposurePresetSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
											<option value="neutral">Neutral</option>
											<option value="bright">Bright</option>
											<option value="cinematic">Cinematic</option>
										</select>
									</label>
									<label class="tw-form-control">
										<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-400">Contrast Preset</span>
										<select id="compileContrastPresetSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
											<option value="soft">Soft</option>
											<option value="balanced">Balanced</option>
											<option value="punchy">Punchy</option>
										</select>
									</label>
								</div>
							</div>

							<div id="compileEdgeAAWrapper" class="tw-pt-2 tw-border-t tw-border-slate-200">
								<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
									<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Edge Smoothing (FXAA 3.1)</span>
									<span id="compileEdgeAAStrengthValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px] tw-font-bold tw-uppercase">Balanced</span>
								</div>
								<input id="compileEdgeAAStrengthSlider" type="range" min="0" max="5" step="1" value="3" class="tw-range tw-range-primary tw-range-xs tw-mt-1">
							</div>
						</div>
					</div>
				</div>

				<!-- Right Column: Contextual Engine Controls -->
				<div id="compileEngineControlsColumn" class="tw-flex tw-flex-col tw-gap-4">
					
					<!-- Engine selection tabs -->
					<div class="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4">
						<div class="tw-mb-3">
							<div class="tw-flex tw-items-center tw-justify-between">
								<h4 class="tw-text-sm tw-font-bold tw-text-slate-800">Advanced Engine Controls</h4>
								<span id="compilePostFxEngineHintBadge" class="tw-badge tw-badge-ghost tw-badge-xs tw-text-[9px] tw-uppercase" style="display:none;">PostFX Must Be On</span>
							</div>
							<p id="compilePostFxEngineHint" class="tw-text-[10px] tw-text-slate-400 tw-mt-1"></p>
						</div>
						<div role="tablist" class="tw-tabs tw-tabs-boxed tw-bg-slate-100">
							<button type="button" id="compilePostFxEngineTabLegacy" role="tab" data-engine="legacy" class="tw-tab tw-tab-active tw-text-[11px] tw-font-bold">
								<i data-lucide="cpu" class="tw-w-3 tw-h-3 tw-mr-1"></i>
								Legacy
							</button>
							<button type="button" id="compilePostFxEngineTabPmndrs" role="tab" data-engine="pmndrs" class="tw-tab tw-text-[11px] tw-font-bold">
								<i data-lucide="sparkles" class="tw-w-3 tw-h-3 tw-mr-1"></i>
								Pmndrs
							</button>
						</div>
						<input type="hidden" id="compilePostFxEngineSelect" value="legacy">
					</div>

					<!-- LEGACY Engine Panes -->
					<div id="compileLegacyPane" class="tw-flex tw-flex-col tw-gap-4">
						<!-- Card: Legacy Enhancements -->
						<div class="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4">
							<div class="tw-flex tw-items-center tw-gap-2 tw-mb-4">
								<i data-lucide="layers" class="tw-w-4 tw-h-4 tw-text-indigo-500"></i>
								<h4 class="tw-text-sm tw-font-bold tw-text-slate-800">Legacy Enhancements</h4>
							</div>
							<div class="tw-space-y-4">
								<label class="tw-form-control">
									<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Screen-space reflections for floors, glass, and polished surfaces">Reflections (SSR)</span>
									<select id="compileSSRStrengthSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
										<option value="off">Off</option>
										<option value="subtle">Subtle</option>
										<option value="balanced">Balanced</option>
										<option value="strong">Strong</option>
									</select>
								</label>

								<div class="tw-pt-2 tw-border-t tw-border-slate-200">
									<label class="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer">
										<input id="compilePostFxTAAToggle" type="checkbox" class="tw-checkbox tw-checkbox-primary tw-checkbox-xs">
										<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Temporal anti-aliasing for smoother edges and reduced specular shimmer. Supplements FXAA.">Temporal AA (TAA)</span>
									</label>
								</div>
							</div>
						</div>
					</div>

					<!-- PMNDRS Engine Panes -->
					<div id="compilePmndrsPane" class="tw-flex tw-flex-col tw-gap-4" style="display:none;">
						<!-- Card: PMNDRS Anti-Aliasing -->
						<div class="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4">
							<div class="tw-flex tw-items-center tw-justify-between tw-mb-4">
								<div class="tw-flex tw-items-center tw-gap-2">
									<i data-lucide="scan" class="tw-w-4 tw-h-4 tw-text-fuchsia-500"></i>
									<h4 class="tw-text-sm tw-font-bold tw-text-slate-800">PMNDRS Anti-Aliasing</h4>
								</div>
								<button type="button" id="compilePmndrsResetBtn" class="tw-btn tw-btn-ghost tw-btn-xs tw-text-[10px] tw-text-slate-500 hover:tw-text-emerald-600" title="Reset all Pmndrs tweaks to their default values">
									<i data-lucide="rotate-ccw" class="tw-w-3 tw-h-3"></i> Reset
								</button>
							</div>
							
							<div id="compilePmndrsAAWrapper" class="tw-grid tw-grid-cols-2 tw-gap-3">
								<label class="tw-form-control tw-w-full">
									<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Choose the PMNDRS anti-aliasing strategy. MSAA is the preferred default when supported; SMAA is the post-process fallback.">AA Method</span>
									<select id="compilePmndrsAAModeSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
										<option value="none">None</option>
										<option value="smaa">SMAA</option>
										<option value="msaa">MSAA</option>
									</select>
								</label>
								<label id="compilePmndrsAAPresetWrapper" class="tw-form-control tw-w-full">
									<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-400" title="Quality preset for the selected PMNDRS anti-aliasing method.">AA Preset</span>
									<select id="compilePmndrsAAPresetSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
										<option value="low">Low</option>
										<option value="medium">Medium</option>
										<option value="high">High</option>
										<option value="ultra">Ultra</option>
									</select>
								</label>
							</div>
						</div>

						<!-- Card: PMNDRS Exposure & Color -->
						<div class="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4">
							<div class="tw-flex tw-items-center tw-gap-2 tw-mb-4">
								<i data-lucide="sliders-horizontal" class="tw-w-4 tw-h-4 tw-text-rose-500"></i>
								<h4 class="tw-text-sm tw-font-bold tw-text-slate-800">PMNDRS Exposure &amp; Color</h4>
							</div>

							<div class="tw-space-y-4">
								<div>
									<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
										<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Tone-mapping exposure multiplier applied before ACES Filmic.">Tone Map Exposure</span>
										<span id="compilePmndrsExposureValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px]">1.00</span>
									</div>
									<input id="compilePmndrsExposureSlider" type="range" min="0.3" max="2.5" step="0.05" value="1.0" class="tw-range tw-range-primary tw-range-xs">
								</div>

								<div class="tw-pt-2 tw-border-t tw-border-slate-200">
									<label class="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer tw-mb-2">
										<input id="compilePmndrsLutToggle" type="checkbox" class="tw-checkbox tw-checkbox-primary tw-checkbox-xs">
										<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Apply a built-in PMNDRS 3D lookup-table color look.">Built-In LUT Look</span>
									</label>
									<div id="compilePmndrsLutWrapper" class="tw-space-y-3">
										<label class="tw-form-control">
											<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-400">Look</span>
											<select id="compilePmndrsLutLookSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
												<option value="neutral">Neutral</option>
												<option value="warm-film">Warm Film</option>
												<option value="cool-clarity">Cool Clarity</option>
												<option value="cinematic-contrast">Cinematic Contrast</option>
												<option value="soft-fade">Soft Fade</option>
											</select>
										</label>
										<div>
											<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
												<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-400">Look Strength</span>
												<span id="compilePmndrsLutStrengthValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px]">1.00</span>
											</div>
											<input id="compilePmndrsLutStrengthSlider" type="range" min="0" max="1" step="0.02" value="1.0" class="tw-range tw-range-primary tw-range-xs">
										</div>
									</div>
								</div>
							</div>
						</div>

						<!-- Card: PMNDRS Bloom & Lens -->
						<div class="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4">
							<div class="tw-flex tw-items-center tw-gap-2 tw-mb-4">
								<i data-lucide="camera" class="tw-w-4 tw-h-4 tw-text-violet-500"></i>
								<h4 class="tw-text-sm tw-font-bold tw-text-slate-800">PMNDRS Bloom &amp; Lens</h4>
							</div>

							<div class="tw-space-y-4">
								<div id="compilePmndrsBloomWrapper" class="tw-space-y-4">
									<div>
										<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
											<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Multiplier on the shared Bloom preset when the Pmndrs engine is active.">Bloom Multiplier</span>
											<span id="compilePmndrsBloomIntensityValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px]">1.00</span>
										</div>
										<input id="compilePmndrsBloomIntensitySlider" type="range" min="0" max="3" step="0.05" value="1.0" class="tw-range tw-range-primary tw-range-xs">
									</div>

									<div>
										<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
											<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Luminance threshold for the Pmndrs bloom pass.">Bloom Threshold</span>
											<span id="compilePmndrsBloomThresholdValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px]">0.62</span>
										</div>
										<input id="compilePmndrsBloomThresholdSlider" type="range" min="0" max="1" step="0.01" value="0.62" class="tw-range tw-range-primary tw-range-xs">
									</div>
								</div>

								<div class="tw-pt-2 tw-border-t tw-border-slate-200">
									<label class="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer tw-mb-2">
										<input id="compilePmndrsVignetteToggle" type="checkbox" class="tw-checkbox tw-checkbox-primary tw-checkbox-xs">
										<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Darken the corners of the rendered frame for a cinematic feel.">Vignette</span>
									</label>
									<div id="compilePmndrsVignetteWrapper">
										<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
											<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-400">Vignette Darkness</span>
											<span id="compilePmndrsVignetteDarknessValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px]">0.50</span>
										</div>
										<input id="compilePmndrsVignetteDarknessSlider" type="range" min="0" max="1" step="0.02" value="0.5" class="tw-range tw-range-primary tw-range-xs">
									</div>
								</div>

								<div class="tw-pt-2 tw-border-t tw-border-slate-200 tw-space-y-4">
									<div>
										<label class="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer tw-mb-2">
											<input id="compilePmndrsNoiseToggle" type="checkbox" class="tw-checkbox tw-checkbox-primary tw-checkbox-xs">
											<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Subtle PMNDRS film-grain style noise.">Noise</span>
										</label>
										<div id="compilePmndrsNoiseWrapper">
											<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
												<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-400">Noise Opacity</span>
												<span id="compilePmndrsNoiseOpacityValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px]">0.04</span>
											</div>
											<input id="compilePmndrsNoiseOpacitySlider" type="range" min="0" max="0.2" step="0.005" value="0.04" class="tw-range tw-range-primary tw-range-xs">
										</div>
									</div>

									<div>
										<label class="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer tw-mb-2">
											<input id="compilePmndrsChromaticAberrationToggle" type="checkbox" class="tw-checkbox tw-checkbox-primary tw-checkbox-xs">
											<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Subtle radial color separation near the frame edges.">Chromatic Aberration</span>
										</label>
										<div id="compilePmndrsChromaticAberrationWrapper">
											<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
												<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-400">Aberration Offset</span>
												<span id="compilePmndrsChromaticAberrationOffsetValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px]">0.0015</span>
											</div>
											<input id="compilePmndrsChromaticAberrationOffsetSlider" type="range" min="0" max="0.006" step="0.0001" value="0.0015" class="tw-range tw-range-primary tw-range-xs">
										</div>
									</div>
								</div>
							</div>
						</div>

						<!-- Card: Takram Atmosphere -->
						<div class="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4">
							<div class="tw-flex tw-items-center tw-gap-2 tw-mb-4">
								<i data-lucide="sun" class="tw-w-4 tw-h-4 tw-text-orange-500"></i>
								<h4 class="tw-text-sm tw-font-bold tw-text-slate-800">Takram Atmosphere</h4>
							</div>

							<div class="tw-space-y-4">
								<div class="tw-flex tw-items-center tw-justify-between tw-gap-3">
									<label class="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer">
										<input id="compilePmndrsAtmosphereToggle" type="checkbox" class="tw-checkbox tw-checkbox-primary tw-checkbox-xs">
										<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Enable Takram atmosphere and aerial perspective in the PMNDRS pipeline.">Atmosphere</span>
									</label>
								</div>

								<div id="compilePmndrsAtmosphereWrapper" class="tw-space-y-4">
									<div class="tw-grid tw-grid-cols-2 tw-gap-3">
										<label class="tw-form-control tw-w-full">
											<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-400">Atmosphere Look</span>
											<select id="compilePmndrsAtmospherePresetSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
												<option value="sunrise">Sunrise</option>
												<option value="midday">Midday</option>
												<option value="sunset">Sunset</option>
												<option value="night">Night</option>
												<option value="custom">Custom</option>
											</select>
										</label>
										<label class="tw-form-control tw-w-full">
											<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-400">Takram Quality</span>
											<select id="compilePmndrsAtmosphereQualitySelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
												<option value="performance">Performance</option>
												<option value="balanced">Balanced</option>
												<option value="quality">Quality</option>
												<option value="cinematic">Cinematic</option>
											</select>
										</label>
									</div>

									<div>
										<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
											<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Preset Intensity</span>
											<span id="compilePmndrsAtmospherePresetIntensityValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px]">1.00</span>
										</div>
										<input id="compilePmndrsAtmospherePresetIntensitySlider" type="range" min="0" max="1" step="0.05" value="1.0" class="tw-range tw-range-primary tw-range-xs">
									</div>

									<div id="compilePmndrsAtmosphereAdvanced" class="tw-space-y-3 tw-pt-3 tw-border-t tw-border-slate-200">
										<div class="tw-grid tw-grid-cols-2 tw-gap-3">
											<div>
												<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
													<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Sun Elevation</span>
													<span id="compilePmndrsSunElevationValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px]">10°</span>
												</div>
												<input id="compilePmndrsSunElevationSlider" type="range" min="-10" max="85" step="1" value="62" class="tw-range tw-range-primary tw-range-xs">
											</div>
											<div>
												<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
													<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Sun Azimuth</span>
													<span id="compilePmndrsSunAzimuthValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px]">38°</span>
												</div>
												<input id="compilePmndrsSunAzimuthSlider" type="range" min="-180" max="180" step="1" value="20" class="tw-range tw-range-primary tw-range-xs">
											</div>
											<div>
												<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
													<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Sun Radius</span>
													<span id="compilePmndrsSunAngularRadiusValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px]">0.0047</span>
												</div>
												<input id="compilePmndrsSunAngularRadiusSlider" type="range" min="0.002" max="0.03" step="0.0001" value="0.0047" class="tw-range tw-range-primary tw-range-xs">
											</div>
											<div>
												<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
													<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Sun Distance</span>
													<span id="compilePmndrsSunDistanceValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px]">5200</span>
												</div>
												<input id="compilePmndrsSunDistanceSlider" type="range" min="1500" max="20000" step="100" value="5200" class="tw-range tw-range-primary tw-range-xs">
											</div>
											<div>
												<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
													<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Aerial Strength</span>
													<span id="compilePmndrsAerialStrengthValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px]">0.85</span>
												</div>
												<input id="compilePmndrsAerialStrengthSlider" type="range" min="0" max="2" step="0.01" value="0.55" class="tw-range tw-range-primary tw-range-xs">
											</div>
											<div>
												<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
													<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Albedo Scale</span>
													<span id="compilePmndrsAlbedoScaleValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px]">0.96</span>
												</div>
												<input id="compilePmndrsAlbedoScaleSlider" type="range" min="0" max="2" step="0.01" value="1.0" class="tw-range tw-range-primary tw-range-xs">
											</div>
										</div>

										<div class="tw-grid tw-grid-cols-2 tw-gap-3">
											<label class="tw-form-control tw-w-full">
												<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-400">Horizon Lighting Preset</span>
												<select id="compilePmndrsHorizonLightingPresetSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
													<option value="natural">Natural</option>
													<option value="clear">Clear</option>
													<option value="crisp">Crisp</option>
													<option value="custom">Custom</option>
												</select>
											</label>
											<div class="tw-flex tw-items-end tw-text-[10px] tw-leading-relaxed tw-text-slate-400">
												Visible helper-light presets for the Takram Horizon path. Manual slider edits switch this to Custom.
											</div>
										</div>

										<div class="tw-grid tw-grid-cols-2 tw-gap-3">
											<div>
												<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
													<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Horizon Key Light</span>
													<span id="compilePmndrsHorizonKeyLightIntensityValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px]">1.15</span>
												</div>
												<input id="compilePmndrsHorizonKeyLightIntensitySlider" type="range" min="0" max="3" step="0.01" value="1.15" class="tw-range tw-range-primary tw-range-xs">
											</div>
											<div>
												<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
													<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Horizon Fill Light</span>
													<span id="compilePmndrsHorizonFillLightIntensityValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px]">0.45</span>
												</div>
												<input id="compilePmndrsHorizonFillLightIntensitySlider" type="range" min="0" max="3" step="0.01" value="0.45" class="tw-range tw-range-primary tw-range-xs">
											</div>
										</div>

										<div class="tw-grid tw-grid-cols-2 tw-gap-3">
											<label class="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer">
												<input id="compilePmndrsTransmittanceToggle" type="checkbox" class="tw-checkbox tw-checkbox-primary tw-checkbox-xs">
												<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Transmittance</span>
											</label>
											<label class="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer">
												<input id="compilePmndrsInscatterToggle" type="checkbox" class="tw-checkbox tw-checkbox-primary tw-checkbox-xs">
												<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Inscatter</span>
											</label>
											<label class="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer">
												<input id="compilePmndrsGroundToggle" type="checkbox" class="tw-checkbox tw-checkbox-primary tw-checkbox-xs">
												<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Ground</span>
											</label>
											<label class="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer">
												<input id="compilePmndrsMoonToggle" type="checkbox" class="tw-checkbox tw-checkbox-primary tw-checkbox-xs">
												<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Moon</span>
											</label>
										</div>

										<div class="tw-grid tw-grid-cols-2 tw-gap-3">
											<div>
												<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
													<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Rayleigh</span>
													<span id="compilePmndrsRayleighScaleValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px]">1.00</span>
												</div>
												<input id="compilePmndrsRayleighScaleSlider" type="range" min="0.2" max="2.5" step="0.01" value="1.0" class="tw-range tw-range-primary tw-range-xs">
											</div>
											<div>
												<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
													<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Mie Scatter</span>
													<span id="compilePmndrsMieScatteringScaleValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px]">0.90</span>
												</div>
												<input id="compilePmndrsMieScatteringScaleSlider" type="range" min="0.1" max="2.5" step="0.01" value="0.9" class="tw-range tw-range-primary tw-range-xs">
											</div>
											<div>
												<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
													<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Mie Extinction</span>
													<span id="compilePmndrsMieExtinctionScaleValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px]">1.00</span>
												</div>
												<input id="compilePmndrsMieExtinctionScaleSlider" type="range" min="0.1" max="2.5" step="0.01" value="1.0" class="tw-range tw-range-primary tw-range-xs">
											</div>
											<div>
												<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
													<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Mie Phase G</span>
													<span id="compilePmndrsMiePhaseGValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px]">0.80</span>
												</div>
												<input id="compilePmndrsMiePhaseGSlider" type="range" min="0" max="0.95" step="0.01" value="0.8" class="tw-range tw-range-primary tw-range-xs">
											</div>
											<div>
												<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
													<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Absorption</span>
													<span id="compilePmndrsAbsorptionScaleValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px]">1.00</span>
												</div>
												<input id="compilePmndrsAbsorptionScaleSlider" type="range" min="0.2" max="2.5" step="0.01" value="1.0" class="tw-range tw-range-primary tw-range-xs">
											</div>
											<label class="tw-form-control">
												<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Ground Albedo</span>
												<input id="compilePmndrsGroundAlbedoInput" type="color" value="#f0e6d6" class="tw-input tw-input-bordered tw-input-xs tw-w-full tw-mt-1 tw-h-8 tw-p-1">
											</label>
										</div>
									</div>
								</div>
							</div>
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

		</div>

	</div>
	<form method="dialog" class="tw-modal-backdrop">
		<button class="tw-cursor-default tw-outline-none tw-bg-slate-900/40 tw-backdrop-blur-sm tw-appearance-none tw-border-none tw-text-transparent">close</button>
	</form>
</dialog>
