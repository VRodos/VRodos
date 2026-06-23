# Rendering Migration Implementation Log

## Goal

Track the staged rendering migration work so each phase stays small, reviewable, and reversible.

This log is consolidated for current and future agents. It replaces the older granular Phase 1-17 history with the current architecture, recent landed work, and next verification targets.

## Scope

This file is a historical migration log. Current compiled runtime architecture lives in [`../../../RENDERING_PIPELINE.md`](../../../RENDERING_PIPELINE.md); performance decisions live in [`PERFORMANCE_OPTIMIZATION_PLAN.md`](PERFORMANCE_OPTIMIZATION_PLAN.md); Takram follow-up work lives in [`TAKRAM_REALISTIC_LIGHTING_PLAN.md`](TAKRAM_REALISTIC_LIGHTING_PLAN.md).

The earlier migration from legacy Three.js r173 to the pinned A-Frame master + Three.js r181 stack is superseded by `THREE_R184_MIGRATION_PLAN.md` and the current r184 runtime. Root `package.json` and `package-lock.json` remain the source of truth, `npm run build:three` generates the runtime manifest and vendor bundles, and obsolete versioned vendor paths are removed when they are no longer referenced.

## Current Focus and Next Steps

1. Maintain the r184 baseline before adding a new lighting mode.
2. Keep one Horizon PMNDRS scene and one non-Horizon PMNDRS scene in manual smoke coverage.
3. Keep compiler/runtime chunk golden checks current when runtime bundles move.
4. Add an author-visible explicit Horizon lighting mode control for `helper`, `light-source`, and `post-process-albedo`.
5. Prototype desktop-only Takram-vanilla `post-process-albedo` lighting.
6. Preserve the immersive XR composer bypass and direct stereo fallback.
7. Defer Three latest testing to a separate A-Frame module/import-map runtime spike.
8. Treat Takram volumetric clouds v1 as shipped for desktop/inline PMNDRS scenes only; keep immersive XR clouds as a separate validation spike.

## Recent Landed Work

### Takram volumetric clouds v1

- Added an opt-in PMNDRS/Takram cloud path for desktop inline and desktop fullscreen compiled scenes.
- Added `assets/js/runtime/master/lib/vrodos-takram-clouds.bundle.js`, exported as `window.VRODOS_TAKRAM_CLOUDS`.
- Kept cloud loading lazy: `takram-clouds` is planned only when PMNDRS post-FX, Takram atmosphere, high render quality, and clouds are enabled.
- Vendored cloud assets locally under `assets/vendor/takram-clouds/`: `local_weather.png`, `shape.bin`, `shape_detail.bin`, `turbulence.png`, and `stbn.bin`.
- Reworked the cloud vendor build to consume Takram's compiled package output instead of TypeScript source so legacy decorators evaluate correctly in the browser bundle.
- Sanitized Takram's bundled default asset URL constants to local asset paths so the generated cloud bundle contains no `media.githubusercontent.com` runtime dependency.
- Added scene metadata and compiled `scene-settings` keys:
  - `aframePmndrsCloudsEnabled` / `pmndrsCloudsEnabled`
  - `aframePmndrsCloudsQuality` / `pmndrsCloudsQuality`
  - `aframePmndrsCloudsCoverage` / `pmndrsCloudsCoverage`
- Expanded cloud quality to the four Takram performance profiles: `low`, `medium`, `high`, and `ultra`.
- Applied VRodos profile overlays per quality: temporal upscaling stays enabled, `shadow.farScale` matches Takram's London Storybook demo at `0.25`, high/ultra render clouds at full resolution, and light shafts remain off in v1.
- Created `CloudsEffect` before `AerialPerspectiveEffect`, kept `skipRendering = true`, and routed cloud overlay/shadow/shadow-length buffers into Takram aerial perspective composition.
- Added per-frame cloud sync with active Takram atmosphere state, camera, sun direction, world-to-ECEF matrix, correct-altitude mode, precomputed atmosphere textures, quality, coverage, and local cloud textures.
- Added skip diagnostics for disabled settings, missing PMNDRS composer, missing WebGL2/Data3DTexture support, mobile, immersive XR, missing cloud assets, and missing/crashed cloud bundle.
- Real immersive WebXR explicitly skips clouds in v1 because VRodos bypasses the PMNDRS composer while `renderer.xr.isPresenting`.
- Verification passed for `npm.cmd run build:three`, `npm.cmd run build:runtime`, targeted JS checks, PHP syntax checks, planner fixtures, URL/decorator absence scans, `npm.cmd run lint` with existing warnings only, and `git diff --check`.

### Compiled runtime pipeline refactor

- Extracted shared compiled-client assembly into `VRodos_Compiler_Runtime_Page_Builder` so Master/Simple clients use one path for template loading, DOM setup, scene settings, root glTF decoder config, object rendering, compile diagnostics, and output writing.
- Kept Master/Simple differences as small strategies around player/network UI and action buttons.
- Hardened `assets/runtime-build-manifest.json` as the runtime chunk source of truth with validation for missing script files, missing script `src`, undeclared dependencies, duplicate order conflicts, and missing feature coverage.
- Preserved lazy runtime loading: PMNDRS vendor/runtime loads only for PMNDRS post-FX, Takram loads only for PMNDRS atmosphere, networked components are omitted from single-player output, and the FPS meter remains optional.
- Split the large `scene-settings` runtime into focused A-Frame components while preserving the compiled `scene-settings` attribute as the compatibility data contract:
  - `vrodos-render-profile`
  - `vrodos-postfx-router`
  - `vrodos-atmosphere`
  - `vrodos-reflections`
- Generated runtime schema defaults from `assets/runtime-settings-contract.json` into `window.VRODOS_RUNTIME_SETTINGS_SCHEMA_DEFAULTS`, removing duplicated PMNDRS defaults from source JS.
- Added `window.VRODOSMaster.RuntimeResources` for shared disposal of Three resources, PMNDRS composers/passes/effects, PMREM/render targets, and event listeners.
- Rebuilt runtime bundles with `npm.cmd run build:runtime`.
- Verification passed for PHP syntax checks, `scripts/test-compiler-runtime-script-planner.php`, targeted `node --check`, `npm.cmd run lint` with existing warnings only, `npm.cmd run build:runtime`, and `git diff --check`.
- Browser smoke profiling was attempted against a reachable local compiled scene, but the CDP profiler timed out during `Page.enable`, so no profile JSON was produced for this pass.

### Smooth scene-probe defaults

- Added persisted scene metadata and compiled `scene-settings` keys:
  - `aframeSceneProbeUpdateMode` / `sceneProbeUpdateMode`
  - `aframeSceneProbeResolution` / `sceneProbeResolution`
- Added compile-dialog controls that appear only when reflection source is `scene-probe`.
- Changed scene-probe defaults from frequent dynamic captures to `static` capture after scene/model settle.
- Lowered the default scene-probe cubemap size to `128`, with `64` and `256` as author-selectable quality choices.
- Kept `slow-dynamic` available for rare refreshes after larger movement/yaw changes and a longer cooldown.

### Shadow-aware lighting and reflection controls

- Added compiled-scene lighting participation for visible world meshes, decoration objects, image/video display planes, POI link objects, and POI image/text world surfaces.
- Excluded hidden navmesh helpers, camera UI, skies, avatars, helper lights, and debug objects from shadow casting.
- Made walkable/navmesh world surfaces receiver-only to reduce low-angle road/floor shadow banding.
- Added adaptive directional sun/helper shadow fitting around nearby world bounds and the active camera region.
- Added `reflectionOcclusionMode` / `aframeReflectionOcclusionMode` for `auto`, `off`, and `strong` direct-sun glint attenuation.
- Added `reflectionsEnabled` / `aframeReflectionsEnabled` as a global compiled-scene reflections switch.
- Patched compiled-scene PBR/Phong material shaders so shadowed pixels suppress direct sun specular, indirect specular, clearcoat, sheen, and bright glint output.
- Reduced PMNDRS Horizon console noise to one default startup state line, with expanded diagnostics behind `?vrodos_debug_pmndrs_horizon=1` and `?vrodos_debug_pmndrs_horizon_verbose=1`.

### PMNDRS/Takram day-night terrain shadow stabilization

- Stabilized compiled-scene day/night shadows for large terrain by focusing adaptive directional shadow bounds around the active camera instead of expanding the shadow camera to the full terrain GLB.
- Replaced hardcoded Takram sun shadow bias tuning with the shared contact-shadow preset so Takram and VRodos-managed directional lights use the same negative bias and small `normalBias`.
- Added day/night directional shadow radius defaults for softer PCF edges: high `2.4`, medium `1.8`, with `?vrodos_debug_day_night_shadow_radius=VALUE` for visual tuning.
- Kept runtime-forced PCF for day/night cycle shadows.
- Added `terrain-matte` self-shadow stabilization for large authored terrain: front-side terrain shadow casting, terrain custom depth-material polygon offset, reduced terrain normal-map scale, matte reflection caps, and a terrain shader lift that suppresses near-depth soft self-shadow triangle/band artifacts without removing real hard mountain-cast shadows.
- Added horizon gating for direct sun and moon scene lights. When the local sun or moon direction is below its horizon threshold, direct light intensity and shadow casting go to zero so hidden celestial bodies do not create moving white peak highlights.
- Preserved authored emissive material support while documenting that emissive output and media readability boosts are material output only, not light sources.

### VR/XR visual parity

- Added presentation-mode detection to separate inline desktop, desktop fullscreen/A-Frame fullscreen, and real immersive WebXR.
- Desktop fullscreen now preserves the same post-FX eligibility as inline desktop.
- Real immersive WebXR uses a direct stereo fallback for unsupported screen-space composer passes while keeping scene-owned visuals active.
- Presentation transitions re-sync visual state on fullscreen changes, `enter-vr`, `exit-vr`, and delayed resize settling.

### PMNDRS Horizon helper lighting exposure

- Exposed PMNDRS Horizon helper-light intensity controls in the compile dialog.
- Added persisted scene metadata and compiled `scene-settings` fields for Horizon key/fill light intensities.
- Replaced hardcoded PMNDRS Horizon helper-light intensities with scene-configured values while keeping preset-driven colors.
- Expanded Horizon diagnostics to include helper-light intensity and sun-scale data.

### PMNDRS low-risk effects

- Added PMNDRS-only controls for noise and chromatic aberration.
- Persisted and serialized the new scene metadata.
- Added runtime construction through PMNDRS `NoiseEffect` and `ChromaticAberrationEffect`.
- Kept `ChromaticAberrationEffect` in a late standalone pass and `SMAAEffect` in the final standalone pass so convolution effects do not break the PMNDRS composer or run before Takram/tone/color processing.

### PMNDRS built-in LUT looks

- Added v1 built-in generated LUT looks without uploaded LUT asset support.
- Added metadata and compiled `scene-settings` keys:
  - `aframePmndrsLutEnabled` / `pmndrsLutEnabled`
  - `aframePmndrsLutLook` / `pmndrsLutLook`
  - `aframePmndrsLutStrength` / `pmndrsLutStrength`
- Added built-in looks:
  - `neutral`
  - `warm-film`
  - `cool-clarity`
  - `cinematic-contrast`
  - `soft-fade`
- Regrouped PMNDRS compile-dialog controls into anti-aliasing, exposure/color, bloom/lens, and Takram atmosphere cards.
- Manual compiled-scene smoke on 2026-05-06 confirmed the LUT compile options and `scene-settings` serialization are working, so no automated browser smoke was added for this pass.

### Takram celestial controls v1

- Added author-facing celestial mode controls for PMNDRS/Takram compiled scenes:
  - `manual`
  - `preset-time`
- Added time presets:
  - `sunrise`
  - `midday`
  - `golden-hour`
  - `sunset`
  - `night`
- Added metadata and compiled `scene-settings` keys:
  - `aframePmndrsCelestialMode` / `pmndrsCelestialMode`
  - `aframePmndrsCelestialTimePreset` / `pmndrsCelestialTimePreset`
- Runtime `preset-time` resolves through the existing Takram sun-direction helper path; `manual` preserves existing sun slider behavior.
- Night preset moon behavior is controlled through `pmndrsMoonEnabled`, so authors can override it without adding stars, probes, geospatial UI, or clouds in this phase.

### PMNDRS Horizon night lighting fix

- `preset-time/night` no longer reuses daytime Horizon helper-light intensity.
- Night helper lighting uses dim cool moonlight when `pmndrsMoonEnabled` is true, and a near-black fallback when it is false.
- The Horizon helper key direction follows the local moon vector for night moonlight.
- Runtime env-map reflection intensity is reduced for night HDR/scene-probe reflections without changing authored road/material roughness.
- PMNDRS Horizon diagnostics now include helper direction and night reflection scale.

### Native PMNDRS SSAO promotion

- Promoted PMNDRS native AO to the default backend using `POSTPROCESSING.NormalPass` and `POSTPROCESSING.SSAOEffect`.
- Removed the alternate AO fallback after native SSAO visual smoke passed.
- Added composer-signature and PMNDRS debug-overlay reporting so AO backend changes are visible during smoke tests.
- Retuned native SSAO presets around the upstream PMNDRS SSAO demo values and the current high-quality screenshot. The `soft` preset uses the demo defaults, `balanced` interpolates between demo and high, and `strong` uses full-resolution SSAO, `32` samples, radius `0.045`, and intensity `2.01`.

### Takram Horizon stabilization and realism findings

- Added PMNDRS compile/runtime controls for tone mapping mode, exposure range `1..20`, Takram lens flare, and Takram correct altitude.
- Bundled `@takram/three-geospatial-effects` and merged it into `window.VRODOS_TAKRAM_ATMOSPHERE`.
- Kept Takram LensFlareEffect in a standalone pass because convolution effects cannot be merged into the main PMNDRS EffectPass.
- Removed the synthetic Horizon sun sprite and let Takram SkyMaterial own the real sun disk.
- Disabled A-Frame default lights for Takram Horizon scenes.
- Fixed reflection source `none` so material env maps are removed and env-map intensity becomes zero.
- Promoted local Horizon to Takram light-source lighting by default for compiled desktop scenes: `SunDirectionalLight`, `SkyLightProbe`, and a VRodos hemisphere fill for authored PBR assets.
- Added a sun-elevation-based PBR indirect profile and startup fallback ambient bridge so early-morning, midday, and golden-hour scenes keep readable shadow-side objects without flat ambient fill.
- Stabilized dynamic day-night indirect diffuse lighting by keeping sun/moon directional behavior unchanged and smoothing only sky probe, hemisphere fill, ambient bounce, and ground bounce color. Visual validation used `Master_Client_766.html`.
- Kept Takram procedural ground disabled for local scenes so authored walkable-surface/navmesh GLBs remain the real scene ground.
- Removed the local Horizon helper-light comparison mode from the shipped runtime; only an internal safety fallback remains for missing Takram light-source support.
- Added diagnostic logging for LUT readiness, tone mapping, exposure, lens flare, correct altitude, A-Frame default lights, sun radius, reflection scale, and active light source.
- Confirmed the remaining Takram realism gap is architectural: the vanilla demo uses post-process albedo lighting, while VRodos currently renders A-Frame/GLB PBR content.
- Captured the phased follow-up plan in `TAKRAM_REALISTIC_LIGHTING_PLAN.md`.

## Historical Phases Summary

- Phases 1-4: Consolidated plans, removed hardcoded r173 paths, and prepared version-neutral vendor management.
- Phases 5-10: Upgraded local vendor build to Three r181, migrated A-Frame to a pinned master commit, removed obsolete r173 assets, and introduced `VRodos_Render_Runtime_Manager`. This is historical context; the active runtime is now r184.
- Phases 11-12: Updated HDR loader logic and canonical markdown documentation.
- Phases 13-16: Diagnosed PMNDRS Horizon artifacts, moved from FXAA to PMNDRS-native AA, optimized navigation raycasting, and updated scene-settings persistence.
- Phase 17: Synchronized runtime packages with `package.json`, generated `runtime-version-manifest.json`, and rebuilt PMNDRS/Takram bundles to alias A-Frame's `THREE`.
- Takram atmosphere rollout: upgraded Takram packages, rebuilt the runtime bundle, added atmosphere look presets, fixed compiler serialization, and confirmed preset propagation in compiled PMNDRS scenes.
- Takram realism audit: identified the need for explicit Horizon lighting modes and a desktop-only post-process albedo path before clouds.

## Verification Targets

Static checks:

- `node --check` for edited editor and runtime JS files.
- PHP syntax checks for edited PHP files.
- `scripts/test-compiler-runtime-script-planner.php` for runtime chunk planning, generated manifest validation, and golden script-order checks.
- `npm.cmd run build:runtime` after runtime source or settings-contract changes.
- `git diff --check`.
- `npm.cmd run lint` for runtime master JS when available.

Manual smoke:

- No post-FX compiled scene: no PMNDRS/Takram scripts, successful first render, no console errors.
- PMNDRS compiled scene without Takram: PMNDRS vendor before PMNDRS runtime, no Takram bundle, successful first render, no console errors.
- PMNDRS + Takram compiled scene: PMNDRS vendor before Takram before PMNDRS runtime, successful first render, no console errors.
- PMNDRS scene with LUT off.
- PMNDRS scene with each built-in LUT look at strength `1.0`.
- PMNDRS scene with LUT strength `0.0`.
- Horizon PMNDRS scene with Takram atmosphere plus LUT.
- Non-Horizon PMNDRS scene with LUT, AO, bloom, SMAA/MSAA fallback, noise, and chromatic aberration.
- Horizon and non-Horizon PMNDRS AO scenes with default native SSAO.
- Horizon and non-Horizon PMNDRS scenes with each Takram celestial preset.
- Existing manually tuned PMNDRS/Takram scene remains visually unchanged in `manual` mode.
- Horizon PMNDRS `preset-time/night` with no HDR/scene-probe reflection should have no bright road light streak.
- Horizon PMNDRS `preset-time/night` with HDR or scene-probe reflection should keep reflections subdued.
- Horizon PMNDRS midday and sunset with tone mapping modes and exposure `1`, `5`, and `10`.
- Horizon PMNDRS with Takram sun lens flare on/off.
- Horizon PMNDRS with chromatic aberration on, with and without SMAA.
- Horizon PMNDRS with reflection source `none`.
- Horizon PMNDRS with default Takram light-source lighting.
- Immersive XR entry/exit with PMNDRS enabled should bypass the composer and keep stable direct lighting.
