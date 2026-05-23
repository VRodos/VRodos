
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
				<button id="compileDialogCloseBtn"
				        type="button"
				        class="tw-p-1.5 tw-text-slate-400 hover:tw-text-slate-700 tw-rounded-lg hover:tw-bg-slate-100 tw-transition-colors"
				        title="Close">
					<i data-lucide="x" class="tw-w-4 tw-h-4"></i>
				</button>
			</div>
		</div>

		<!-- Body -->
		<div class="tw-p-6 tw-overflow-y-auto tw-flex-1">

			<div class="tw-mb-3 tw-rounded-lg tw-border tw-border-emerald-200 tw-bg-emerald-50/80 tw-px-3 tw-py-2">
				<div class="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
					<div class="tw-flex tw-items-center tw-gap-2 tw-min-w-0">
						<div class="tw-w-7 tw-h-7 tw-bg-emerald-100 tw-text-emerald-700 tw-rounded-md tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
							<i data-lucide="radio-tower" class="tw-w-3.5 tw-h-3.5"></i>
						</div>
						<div class="tw-min-w-0">
							<p class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-emerald-700">Runtime Mode</p>
							<p class="tw-text-[10px] tw-leading-tight tw-text-emerald-700/70">Networked service or static single-player output.</p>
						</div>
					</div>
					<select id="compileRuntimeModeSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full sm:tw-w-64 tw-bg-white">
						<option value="single-player">Single-player static</option>
						<option value="networked">Networked collaboration</option>
					</select>
				</div>
			</div>

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
						<button id="buttonCopyWebLink" type="button" class="tw-btn tw-btn-ghost tw-btn-sm tw-text-emerald-700" title="Copy compiled scene URL">
							<i data-lucide="copy" class="tw-w-4 tw-h-4"></i>
						</button>
						<a id="openWebLinkhref" href="#" target="_blank" class="tw-btn tw-btn-primary tw-btn-sm">
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
										<option value="performance">Performance</option>
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
							<label class="tw-flex tw-items-start tw-gap-2 tw-cursor-pointer">
								<input id="compileReflectionsEnabledToggle" type="checkbox" class="tw-toggle tw-toggle-primary tw-toggle-xs tw-mt-0.5 tw-flex-shrink-0">
								<div class="tw-min-w-0">
									<span class="tw-block tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Global Reflections</span>
									<p class="tw-text-[10px] tw-leading-relaxed tw-text-slate-400 tw-mt-0.5">Enables reflections.</p>
								</div>
							</label>

							<div class="tw-space-y-3">
								<div id="compileReflectionControlsWrapper" class="tw-grid tw-grid-cols-2 tw-gap-3">
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
								<div id="compileSceneProbeControlsWrapper" class="tw-grid tw-grid-cols-2 tw-gap-3">
									<label class="tw-form-control">
										<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Controls when scene-probe reflections are recaptured. Static captures once after load for smooth playback.">Scene Probe Update</span>
										<select id="compileSceneProbeUpdateModeSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
											<option value="static">Static on load</option>
											<option value="slow-dynamic">Slow dynamic</option>
										</select>
									</label>
									<label class="tw-form-control">
										<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Resolution of the cubemap used for scene-probe reflections. Lower values are smoother.">Probe Quality</span>
										<select id="compileSceneProbeResolutionSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
											<option value="64">Performance 64</option>
											<option value="128">Balanced 128</option>
											<option value="256">Sharp 256</option>
										</select>
									</label>
								</div>
							</div>

							<div class="tw-space-y-3 tw-pt-3 tw-border-t tw-border-slate-200">
								<p class="tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-wide tw-text-slate-400">Runtime Helpers</p>
								<div class="tw-grid tw-grid-cols-2 tw-gap-3">
									<label class="tw-flex tw-items-start tw-gap-2 tw-cursor-pointer">
										<input id="compileHoveringInteractablesToggle" type="checkbox" class="tw-toggle tw-toggle-primary tw-toggle-xs tw-mt-0.5 tw-flex-shrink-0">
										<div class="tw-min-w-0">
											<span class="tw-block tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Hovering Interactables</span>
											<p class="tw-text-[10px] tw-leading-relaxed tw-text-slate-400 tw-mt-0.5">Enables a subtle floating animation on interactive markers.</p>
										</div>
									</label>

									<label class="tw-flex tw-items-start tw-gap-2 tw-cursor-pointer">
										<input id="compileFPSMeterToggle" type="checkbox" class="tw-toggle tw-toggle-primary tw-toggle-xs tw-mt-0.5 tw-flex-shrink-0">
										<div class="tw-min-w-0">
											<span class="tw-block tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">FPS Meter</span>
											<p class="tw-text-[10px] tw-leading-relaxed tw-text-slate-400 tw-mt-0.5">Shows a live FPS counter in compiled scenes for quality testing.</p>
										</div>
									</label>
								</div>

								<div id="compileLegacyHorizonStageSizeRow">
									<div class="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-mb-1">
										<div class="tw-min-w-0">
											<span class="tw-block tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Legacy Horizon Size</span>
											<p class="tw-text-[10px] tw-leading-relaxed tw-text-slate-400 tw-mt-0.5">Expands the A-Frame environment dome for Legacy + HORIZON scenes.</p>
										</div>
										<span id="compileLegacyHorizonStageSizeValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px] tw-flex-shrink-0">5000</span>
									</div>
									<input id="compileLegacyHorizonStageSizeSlider" type="range" min="500" max="8000" step="100" value="5000" class="tw-range tw-range-primary tw-range-xs">
								</div>
							</div>
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
						<!-- Card: Legacy Anti-Aliasing -->
						<div class="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4">
							<div class="tw-flex tw-items-center tw-gap-2 tw-mb-4">
								<i data-lucide="scan" class="tw-w-4 tw-h-4 tw-text-indigo-500"></i>
								<h4 class="tw-text-sm tw-font-bold tw-text-slate-800">Legacy Anti-Aliasing</h4>
							</div>
							<label id="compileAAQualityWrapper" class="tw-form-control">
								<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">AA Quality</span>
								<select id="compileAAQualitySelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
									<option value="off">Off</option>
									<option value="balanced">Balanced</option>
									<option value="high">High</option>
									<option value="ultra">Ultra</option>
								</select>
							</label>
						</div>

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

								<div class="tw-grid tw-grid-cols-2 tw-gap-3">
									<label class="tw-form-control tw-w-full">
										<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Final PMNDRS tone mapping operator. AgX matches the Takram vanilla atmosphere story.">Tone Mapping</span>
										<select id="compilePmndrsToneMappingSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
											<option value="agx">AgX</option>
											<option value="reinhard">Reinhard</option>
											<option value="cineon">Cineon</option>
											<option value="aces-filmic">ACES Filmic</option>
											<option value="linear">Linear</option>
										</select>
									</label>

									<div>
										<div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
											<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Tone-mapping exposure multiplier applied before the selected PMNDRS tone mapping operator.">Tone Map Exposure</span>
											<span id="compilePmndrsExposureValue" class="tw-badge tw-badge-ghost tw-badge-sm tw-text-[9px]">1.00</span>
										</div>
										<input id="compilePmndrsExposureSlider" type="range" min="0.1" max="5" step="0.1" value="1.0" class="tw-range tw-range-primary tw-range-xs">
									</div>
								</div>

								<div class="tw-pt-2 tw-border-t tw-border-slate-200">
									<label class="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer tw-mb-2">
										<input id="compilePmndrsLutToggle" type="checkbox" class="tw-checkbox tw-checkbox-primary tw-checkbox-xs">
										<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Apply a built-in PMNDRS 3D lookup-table color look.">Built-In LUT Look</span>
									</label>
									<div id="compilePmndrsLutWrapper" class="tw-space-y-3">

										<div class="tw-grid tw-grid-cols-2 tw-gap-3">

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
						</div>

						<!-- Card: PMNDRS Bloom & Lens -->
						<div class="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4">
							<div class="tw-flex tw-items-center tw-gap-2 tw-mb-4">
								<i data-lucide="camera" class="tw-w-4 tw-h-4 tw-text-violet-500"></i>
								<h4 class="tw-text-sm tw-font-bold tw-text-slate-800">PMNDRS Bloom &amp; Lens</h4>
							</div>

							<div class="tw-space-y-4">
								<div class="tw-pt-2">
									<label class="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer">
										<input id="compilePmndrsLensFlareToggle" type="checkbox" class="tw-checkbox tw-checkbox-primary tw-checkbox-xs">
										<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Enable the Takram Horizon sun LensFlareEffect in the PMNDRS composer.">Sun Lens Flare</span>
									</label>
								</div>

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
										<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Enable Takram atmosphere in the PMNDRS pipeline.">Atmosphere</span>
									</label>
								</div>

								<div id="compilePmndrsAtmosphereWrapper" class="tw-space-y-4">
									<div class="tw-grid tw-grid-cols-2 tw-gap-3">
										<label class="tw-form-control tw-w-full">
											<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-400">Sky Time</span>
											<select id="compilePmndrsAtmospherePresetSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
												<option value="night">Night</option>
												<option value="dawn">Dawn</option>
												<option value="sunrise">Sunrise</option>
												<option value="early-morning">Early Morning</option>
												<option value="midday">Midday</option>
												<option value="golden-hour">Golden Hour</option>
												<option value="sunset">Sunset</option>
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

									<div class="tw-grid tw-grid-cols-2 tw-gap-3">
										<label class="tw-form-control tw-w-full">
											<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-400">Advanced Time Source</span>
											<select id="compilePmndrsCelestialModeSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
												<option value="preset-time">Sky Time Preset</option>
												<option value="datetime">Date/Time</option>
												<option value="manual">Manual Custom</option>
											</select>
										</label>
										<label id="compilePmndrsCelestialTimePresetWrapper" class="tw-form-control tw-w-full" style="display: none;">
											<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-400">Time Preset</span>
											<select id="compilePmndrsCelestialTimePresetSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
												<option value="night">Night</option>
												<option value="dawn">Dawn</option>
												<option value="sunrise">Sunrise</option>
												<option value="early-morning">Early Morning</option>
												<option value="midday">Midday</option>
												<option value="golden-hour">Golden Hour</option>
												<option value="sunset">Sunset</option>
											</select>
										</label>
									</div>

									<div id="compilePmndrsCelestialDateTimeWrapper" class="tw-grid tw-grid-cols-2 tw-gap-3">
										<label class="tw-form-control tw-w-full">
											<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-400">UTC Date</span>
											<input id="compilePmndrsCelestialDateInput" type="date" value="2026-06-21" class="tw-input tw-input-bordered tw-input-xs tw-w-full tw-mt-1">
										</label>
										<label class="tw-form-control tw-w-full">
											<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-400">UTC Time</span>
											<input id="compilePmndrsCelestialUtcTimeInput" type="time" value="12:00" class="tw-input tw-input-bordered tw-input-xs tw-w-full tw-mt-1">
										</label>
									</div>

									<div class="tw-grid tw-grid-cols-2 tw-gap-3 tw-items-end">
										<label class="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer tw-pb-1">
											<input id="compilePmndrsDayNightCycleToggle" type="checkbox" class="tw-checkbox tw-checkbox-primary tw-checkbox-xs">
											<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Autoplay a looping Takram sun, moon, stars, and sky cycle from the authored UTC date/time.">Day / Night Cycle</span>
										</label>
										<label class="tw-form-control tw-w-full">
											<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-400">Cycle Minutes</span>
											<input id="compilePmndrsDayNightCycleDurationInput" type="number" min="0.25" max="1440" step="0.25" value="1" class="tw-input tw-input-bordered tw-input-xs tw-w-full tw-mt-1">
										</label>
									</div>

									<div class="tw-grid tw-grid-cols-2 tw-gap-3">
										<label class="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer">
											<input id="compilePmndrsGeospatialToggle" type="checkbox" class="tw-checkbox tw-checkbox-primary tw-checkbox-xs">
											<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Use latitude, longitude, and altitude to anchor the Takram world-to-ECEF frame.">Geospatial Frame</span>
										</label>
										<label class="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer">
											<input id="compilePmndrsAerialPerspectiveToggle" type="checkbox" class="tw-checkbox tw-checkbox-primary tw-checkbox-xs">
											<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Takram AerialPerspectiveEffect distance haze. Sky and PBR lighting stay owned by Takram SkyMaterial, SunDirectionalLight, and SkyLightProbe.">Aerial Haze</span>
										</label>
										<label class="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer">
											<input id="compilePmndrsCorrectAltitudeToggle" type="checkbox" class="tw-checkbox tw-checkbox-primary tw-checkbox-xs">
											<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500" title="Takram correctAltitude compensation for the atmospheric ellipsoid.">Correct Altitude</span>
										</label>
									</div>

									<div class="tw-grid tw-grid-cols-3 tw-gap-3">
										<label class="tw-form-control tw-w-full">
											<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-400">Latitude</span>
											<input id="compilePmndrsGeospatialLatitudeInput" type="number" min="-90" max="90" step="0.0001" value="0" class="tw-input tw-input-bordered tw-input-xs tw-w-full tw-mt-1">
										</label>
										<label class="tw-form-control tw-w-full">
											<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-400">Longitude</span>
											<input id="compilePmndrsGeospatialLongitudeInput" type="number" min="-180" max="180" step="0.0001" value="0" class="tw-input tw-input-bordered tw-input-xs tw-w-full tw-mt-1">
										</label>
										<label class="tw-form-control tw-w-full">
											<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-400">Altitude M</span>
											<input id="compilePmndrsGeospatialAltitudeInput" type="number" min="-500" max="20000" step="1" value="0" class="tw-input tw-input-bordered tw-input-xs tw-w-full tw-mt-1">
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
												<input id="compilePmndrsSunElevationSlider" type="range" min="-18" max="85" step="1" value="62" class="tw-range tw-range-primary tw-range-xs">
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

										<div class="tw-grid tw-grid-cols-1 tw-gap-3">
											<label class="tw-form-control tw-w-full">
												<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-400">Horizon Lighting Preset</span>
												<select id="compilePmndrsHorizonLightingPresetSelect" class="tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1">
													<option value="natural">Natural</option>
													<option value="clear">Clear</option>
													<option value="crisp">Crisp</option>
													<option value="custom">Custom</option>
												</select>
											</label>
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
												<span class="tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Atmosphere Ground</span>
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
												<span class="tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500">Atmosphere Ground Albedo</span>
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

		</div>

	</div>
	<form method="dialog" class="tw-modal-backdrop">
		<button class="tw-cursor-default tw-outline-none tw-bg-slate-900/40 tw-backdrop-blur-sm tw-appearance-none tw-border-none tw-text-transparent">close</button>
	</form>
</dialog>
