# Compiled Scene Platform Audit And VR Parity Plan

Date: 2026-06-15

## Goal

Audit the current compiled A-Frame runtime state across Desktop, Mobile, VR, AR, and MR, then define a practical continuation path for enabling as much Desktop-mode functionality as possible in the VR headset runtime.

The immediate strategy is conservative: first make the current runtime state measurable in headset sessions, then move Desktop features into VR one step at a time according to WebXR safety, performance, and interaction risk.

## Current Runtime Baseline

- Compiled clients are A-Frame-hosted scenes using the current root runtime stack.
- Three.js is supplied through the locked `super-three@0.184.0` vendor stack.
- PMNDRS `postprocessing` is exported as `window.POSTPROCESSING` and loaded lazily.
- Takram atmosphere/cloud bundles are loaded lazily when scene metadata requests them.
- Collision BVH support is loaded lazily when compiled navigation resolves to a walkable mode.
- Spatial UI is loaded lazily for immersive CEFR and assessment flows; plain VR video clicks toggle playback directly and do not need a modal UI chunk.
- A-Frame owns the WebXR session, camera, controllers, scene graph, media objects, navigation, collision, and render loop.
- Desktop and inline modes can use screen-space post-processing when enabled by metadata and quality gates.
- Real immersive WebXR intentionally bypasses screen-space composer ownership and renders direct stereo. Composer experiments require explicit lab flags and real headset validation.

## Clean Thread Handoff

Use this section as the starting point when continuing VR work in a fresh thread.

Accepted current state:

- The user-facing compile selector is `Runtime Target`: `Desktop` or `VR Headset`.
- `Desktop` maps to internal `desktop` and preserves the authored Desktop rendering pipeline.
- `VR Headset` maps to internal `headset`.
- Accepted public `headset` features on Quest 2: A-Frame scene host, authored 3D objects/media, HMD tracking without camera freeze, controller input, thumbstick navigation, walkable collision/BVH, static shadows, native renderer antialiasing, readable midday lighting, authored Takram visible sky/light sources, and authored HDR env-map reflections.
- Minor far-edge shimmer is acceptable for the current baseline and should be treated as solved unless it regresses.
- Hidden `baseline` remains the strict A-Frame-horizon regression profile and compiles without PMNDRS/Takram chunks even when Desktop settings use PMNDRS/Takram.

Rejected or blocked paths:

- PMNDRS composer/cloud ownership produced tiled stereo/compositor instability on Quest 2 and remains disabled by default.
- Legacy post-FX/FXAA produced black-screen/tiled-framebuffer artifacts in immersive XR and must not be promoted.
- TAA, SSAO/SAO, SSR, bloom, lens flare, and cloud rendering should not be enabled in VR through either existing composer path until a new XR-safe path is validated.

Next work:

1. Keep Desktop and accepted public `headset` behavior unchanged.
2. Treat public headset HMD tracking, controller input, thumbstick locomotion, walkable navigation, and collision as accepted unless a future runtime change touches those paths.
3. Start immersive interaction parity:
   - plain VR video clicks toggle playback directly with no play/pause dialog;
   - CEFR prompts use `window.VRODOSSpatialUI`;
   - assessment panels use `window.VRODOSSpatialUI` anchored beside the clicked object;
   - if spatial UI is unavailable in immersive XR, log diagnostics and fail closed.
4. Retest controller rays, HMD tracking, locomotion, and collision after opening and closing CEFR/assessment panels.
5. Reflections beyond HDR env maps, PMNDRS composer effects, clouds, scene probes, Takram sky PMREM, WebXR layers, AR, and MR remain later stages.

## Platform Capability Matrix

Legend:

- Yes: supported and expected to work in that platform mode.
- Partial: available with important limits, quality gates, or scene/runtime conditions.
- No: not currently a first-class supported path.
- Planned: logical candidate for later work, but not current state.

| Feature | Desktop Inline / Fullscreen | Mobile Inline | VR Headset Runtime | AR | MR |
| --- | --- | --- | --- | --- | --- |
| A-Frame compiled scene host | Yes | Yes | Yes | Partial | Partial |
| WebXR VR entry | No, except emulator/dev tools | No | Yes | No | No |
| WebXR layers | Disabled by default | Disabled by default | Disabled by default | No | No |
| Classic XRWebGLLayer path | N/A | N/A | Yes | N/A | N/A |
| GLB/media/POI rendering | Yes | Yes | Yes | Partial | Partial |
| DOM overlay dialogs | Yes | Yes | No for immersive assessment/video | No | No |
| PMNDRS/Horizon spatial UI | No, not needed | No, not needed | Yes for supported immersive flows | No | No |
| Video trigger direct playback in VR | N/A | N/A | Yes | No | No |
| Keyboard/mouse navigation | Yes | Partial | No | No | No |
| Controller thumbstick navigation | No | No | Yes | No | No |
| Walkable navigation | Yes | Partial | Yes | No | No |
| Fly navigation | Yes | Partial | Yes, but intentionally non-colliding | No | No |
| Static collision BVH | Yes | Partial | Yes | No | No |
| Dynamic rigid-body physics | No | No | No | No | No |
| Static shadows | Yes | Partial, performance-dependent | Yes, with headset budget risk | Partial | Partial |
| Adaptive directional shadow fitting | Yes | Partial | Yes if same runtime light path is active | Partial | Partial |
| Terrain self-shadow stabilization | Yes | Partial | Yes if same runtime light path is active | Partial | Partial |
| Takram sky / sun / moon / day-night | Yes | Partial | Partial: scene-owned sky and lights can remain, composer-owned effects are limited | No | No |
| PMNDRS composer post-FX | Yes | Partial/high-risk | No by default in real immersive XR | No | No |
| Legacy post-FX composer | Yes | Partial/high-risk | No by default in real immersive XR | No | No |
| Bloom / SSAO / vignette / color effects | Yes when composer active | Partial | No by default; candidate for staged experiments | No | No |
| Lens flare | Yes when composer active | Partial | Partial fallback only for safe scene-owned sun visibility; composer flare disabled | No | No |
| Takram volumetric clouds | Yes in desktop high-quality conditions | No | No by default; skipped in immersive XR | No | No |
| HDR environment reflections | Yes | Partial | Partial: HDR PMREM path can work, but budget must be measured | Partial | Partial |
| Scene probe reflections | Yes in high quality | No | No by current gate | No | No |
| Takram-sky PMREM reflections | Debug/experimental | No | No by current gate | No | No |
| Reflection/glint shader attenuation | Yes | Partial | Disabled in immersive XR | No | No |
| Desktop FPS/diagnostics overlays | Yes | Partial | Partial, visibility and input constraints apply | No | No |
| Networked scene runtime | Yes when scene selects it | Partial | Partial, depends on compiled scene and headset network conditions | No | No |
| AR hit-test, anchors, planes | No | No | No | No | No |
| MR passthrough/occlusion/meshing | No | No | No | No | No |

## Current Feature Notes

### Collision And Navigation

- Static collision is currently a CPU-side Three.js geometry path that is independent of PMNDRS, Takram, scene probes, shadows, and post-processing.
- Walkable navigation enables collision when compiled scene metadata resolves to walkable navigation and collision targets/navmesh data are present.
- The runtime patches `THREE.BufferGeometry.computeBoundsTree`, `disposeBoundsTree`, and `THREE.Mesh.raycast` when the BVH chunk is available.
- Collision falls back to standard raycasts if BVH installation or traversal fails.
- VR thumbstick movement is already wired through controller entities such as `#oculusLeft`, `#oculusRight`, `#leftHand`, and `#rightHand`.
- Fly mode remains intentionally non-colliding, so Desktop fly parity should not be treated as a headset collision feature.

### Lighting, Shadows, And Atmosphere

- Desktop currently has the strongest visual stack: scene lights, Takram atmosphere, day-night updates, static shadows, adaptive shadow fitting, terrain shadow stabilization, HDR reflections, and optional post-FX.
- VR can use scene-owned lights, fog, tone mapping, material profiles, HDR environment maps, and some Takram/Horizon sky behavior because these do not require screen-space composer ownership.
- Direct sun and moon lights are horizon-gated and should remain horizon-gated in VR.
- Emissive material boosts and flat-media readability boosts are not lighting substitutes.
- Shadow quality and terrain self-shadow behavior must be validated on headset because the same code path can be correct but too expensive for Quest-class GPUs.

### PMNDRS And Post-Processing

- Desktop PMNDRS composer ownership is supported when scene metadata requests it and quality gates allow it.
- In real immersive WebXR, `scene-settings.shouldUsePostProcessing()` currently returns false, so the renderer uses direct stereo instead of the PMNDRS or legacy composer.
- This is intentional: screen-space composer passes can break stereo rendering, fight A-Frame's XR render loop, or exceed headset frame budgets.
- PMNDRS effects should be reintroduced only behind an explicit XR experiment flag and with headset validation.
- The lowest-risk VR post-FX candidates are color-only or cheap full-screen effects; the highest-risk candidates are SSAO, lens flare, scene probes, and volumetric clouds.

### Takram Clouds

- Takram clouds require WebGL2/Data3DTexture, the cloud asset bundle, and an active PMNDRS composer path.
- Clouds are skipped on mobile and in real immersive XR today.
- Clouds should not be enabled in VR until a headset-safe composer path exists and a representative scene meets frame budget.

### Reflections And Scene Probes

- HDR environment maps are the best candidate for VR reflection parity because they can be precomputed and do not require a live scene probe.
- Scene probes are currently blocked in mobile and VR presentation modes.
- Takram-sky PMREM reflection capture is currently debug/experimental and blocked in VR/mobile.
- Reflection/glint attenuation is disabled in immersive XR and should be revisited only after headset-specific visual and performance measurements.

### Spatial UI

- Immersive CEFR and assessment UI should use `window.VRODOSSpatialUI`.
- The spatial UI chunk mounts PMNDRS/Horizon UI as a Three group under `a-scene.object3D`.
- A-Frame should continue to host the scene and forward ticks; it should not recreate immersive assessment dialogs with `a-plane`, `a-text`, or DOM overlays.
- If spatial UI is unavailable in immersive XR, the runtime should log diagnostics and fail closed rather than showing a broken fallback.
- Plain VR video objects are not spatial UI modal surfaces. Controller trigger clicks on video objects should toggle inline video playback directly.

### AR And MR

- AR and MR are not first-class current targets.
- The runtime does not currently expose an `immersive-ar` entry flow, hit-test, anchors, plane detection, passthrough, occlusion, or real-world meshing policy.
- AR/MR support should be treated as a separate platform design after VR parity is stable.

## Main Limitations

- Runtime chunk selection is mostly metadata-based, not platform-based. PMNDRS, Takram, cloud, collision, and spatial UI chunks are selected by scene features, while final enablement is decided at runtime.
- Desktop can use composer-owned effects; VR intentionally cannot by default.
- Scene probes and Takram-sky PMREM are currently gated away from VR and mobile.
- Mobile detection may include some headset browsers depending on user agent behavior, so headset diagnostics must explicitly record presentation mode and mobile classification.
- WebXR layers are disabled by default through the compiled-client shim and should stay disabled unless a separate native layer effort validates them.
- There is no current AR/MR capability contract, so AR/MR entries in this audit are limited to inherited A-Frame/WebXR possibilities rather than supported product behavior.
- Diagnostics are spread across runtime components, making it hard to quickly answer which feature owner is active inside a headset session.

## VR Parity Roadmap

### Operating Rule - Desktop Stays Intact

- Desktop is the reference pipeline and must remain unchanged unless a change is explicitly desktop-scoped.
- VR work happens behind named VR runtime profiles and headset/runtime presentation checks.
- A VR profile may disable or replace a desktop feature only for headset/VR execution; it must not silently alter the desktop authored pipeline.
- Move one step at a time. A stage is accepted only after headset testing confirms browser-panel stability, immersive stability, sane midday horizon/lighting, no compositor artifacts, and runtime diagnostics that match the expected feature set.

### VR Profile Ladder

The compile UI exposes this as `Runtime Target`: `Desktop` or `VR Headset`.

- `Desktop` maps to the internal `desktop` profile and leaves the authored desktop rendering pipeline active without headset-specific overrides.
- `VR Headset` maps to the accepted internal `headset` profile and applies that policy immediately in inline/browser-tab mode as well as immersive VR.

Only `desktop`, `baseline`, `safe`, `takram-lights`, `takram-sky`, `hdr-reflections`, `balanced`, and `max` are runtime-recognized today. `safe`, `takram-lights`, `takram-sky`, `hdr-reflections`, `balanced`, and `max` remain internal/debug ladder stages until they are promoted into the UI. The intermediate stage names below are the planned activation order; add them to the runtime contract only when that stage is implemented and tested.

0. `baseline`
   - Goal: known-good Quest starting point.
   - Enabled: A-Frame scene host, A-Frame sun/sky/environment, controllers, navigation, collision, normal authored objects/media.
   - Disabled: PMNDRS composer, PMNDRS effects, Takram visible sky, Takram sky PMREM, Takram clouds, scene probes, experimental post-FX.
   - Quality budget: native renderer antialiasing on, framebuffer scale `1.0`, foveation `0.5`.
   - Acceptance: stable in Quest Browser tab mode and immersive VR, with normal midday horizon brightness.
1. `safe`
   - Goal: restore scene-owned runtime features that do not require PMNDRS composer ownership.
   - Candidate features: shadows, tone mapping/exposure, material profiles, basic lighting budget, and spatial UI diagnostics.
   - Disabled: PMNDRS/legacy composer, Takram visible sky/clouds, scene probes, HDR/reflection sources, and experiment flags.
   - Already accepted in baseline: controller input, thumbstick navigation, walkable navigation, and collision/BVH.
2. `takram-lights`
   - Goal: test Takram-derived light sources only, while keeping the baseline visible A-Frame horizon.
   - Candidate features: Takram sun/moon/sky light probes, no Takram sky material.
   - Fails closed to A-Frame horizon/lighting when the compiled page does not include PMNDRS/Takram atmosphere chunks or when Takram LUT resources are not ready.
3. `takram-sky`
   - Goal: test Takram visible sky/horizon without clouds and without PMNDRS composer effects.
   - Enabled: Takram visible sky/horizon and Takram light-source bridge.
   - Disabled: PMNDRS composer/effects, clouds, reflections, Takram sky PMREM capture, scene probes, WebXR layers.
4. `hdr-reflections`
   - Goal: test HDR/env-map and later scene-probe/Takram-sky PMREM separately from post-FX.
   - Enabled: accepted Takram visible sky plus HDR env-map reflections only.
   - Disabled: scene probes, Takram sky PMREM capture, PMNDRS composer/effects, clouds, WebXR layers.
5. `pmndrs-composer-empty`
   - Goal: validate PMNDRS composer ownership with no visual effects.
6. `pmndrs-effects`
   - Goal: add cheap composer effects one at a time: color, LUT, vignette/noise, bloom, AA, then AO.
7. `clouds`
   - Goal: test Takram volumetric clouds only after composer and sky ownership are stable.
8. `max`
   - Goal: lab-only combined profile after every lower stage is accepted.

### Current Implementation Checkpoint

- Phase 1 diagnostics expose `window.VRODOS_RUNTIME_FEATURE_STATE` and `window.__vrodosRuntimeFeatureState`.
- VR profile work has user-facing `Runtime Target` values `Desktop` and `VR Headset`; internally these map to `desktop` and the public `headset` policy.
- `desktop` keeps the authored desktop rendering pipeline active and disables the headset-specific override policy.
- `headset` is the public Quest-safe profile: native renderer antialiasing, authored Takram sky/light sources and HDR env-map reflections, no PMNDRS/legacy composer ownership, no clouds, no scene probes, no Takram sky PMREM capture, and no WebXR layers.
- `baseline` is retained as the hidden strict regression profile: A-Frame horizon/environment, no PMNDRS composer, no Takram sky/clouds, no scene probes. Baseline compiles without PMNDRS/Takram runtime chunks even if the authored Desktop settings still use them.
- `safe` is now hardened as a hidden scene-owned parity validation profile: it keeps the A-Frame horizon/direct-stereo policy, disables post-FX/Takram chunks when compiled as `safe`, suppresses experiment flags, and reports `vrProfile.safe=true` in diagnostics.
- `takram-lights` is now wired as a hidden lighting-only validation profile. It keeps the visible A-Frame horizon, blocks PMNDRS/legacy composer ownership, clouds, scene probes, and reflections, and can attach real Takram light sources only when the page was intentionally compiled with PMNDRS/Takram atmosphere resources. Diagnostics report `takram.lightsOnlyRequested`, `takram.lightsOnlyActive`, `takram.lightOwner`, and `takram.lightsOnlyUnavailableReason`.
- `takram-sky` is now wired as a hidden visible-sky validation profile. It allows the Takram visible sky/horizon and Takram light-source bridge while keeping PMNDRS composer/effects, clouds, reflections, Takram sky PMREM capture, scene probes, and WebXR layers disabled. On Quest, this profile uses the cheaper half-float/basic Takram LUT path plus a direct-sky exposure/gamma shader calibration hook because the first headset pass rendered the direct SkyMaterial nearly black without the PMNDRS composer tone step. During startup the scene loader asks `scene-settings.getRuntimeRevealReadinessState()` and keeps the loading overlay visible until Takram resources exist, the patched direct-sky shader is compiled, and the Quest warm-up window has elapsed. Diagnostics report `reveal.ready`, `reveal.pending`, `vrProfile.takramVisibleSky=true`, `takram.visibleSkyActive`, `takram.visibleSkyDirectCalibrated`, `takram.visibleSkyDirectExposure`, `takram.visibleSkyDirectShaderPatched`, `takram.visibleSkyDirectPatchFailed`, `takram.visibleSkyDirectWarmed`, `takram.visibleSkyDirectWarmupRemainingMs`, and `takram.atmosphereProfile`.
- `hdr-reflections` is now wired as a hidden HDR/env-map-only validation profile. It inherits the accepted Takram visible-sky path and loader-gated Takram reveal, defaults authored `envMapPreset=none` to the small `studio` HDR, waits for the HDR env-map load before reveal, and keeps scene probes, Takram sky PMREM capture, PMNDRS composer/effects, clouds, and WebXR layers disabled. Diagnostics report `vrProfile.hdrReflections=true`, `reflections.effectiveSource=hdr`, `reflections.hdrEnvMapOnly=true`, `reflections.effectiveEnvMapPreset`, `reflections.hdrReady`, `reflections.hdrLoading`, `reflections.hdrFailed`, and `reflections.hdrError`. `vrexpo_games` camera-rig diagnostics are exposed under `cameraRig` to compare the active A-Frame camera, `#player`, `#cameraA`, and controller world positions during headset testing.
- `headset`, `baseline`, `safe`, `takram-lights`, `takram-sky`, `hdr-reflections`, `balanced`, and `max` now also apply a VR-only WebXR render budget before session start when supported: framebuffer scale/foveation defaults are `1.0/0.5`, `1.0/0.5`, `1.0/0.5`, `1.0/0.5`, `1.0/0.5`, `1.0/0.5`, `0.9/0.75`, and `1.0/0.5`.
- Quest 2 baseline testing accepted visual quality with only minor far-edge shimmer. Framebuffer scale/foveation changes did not materially affect the shimmer, so it is not an active blocker.
- HMD tracking without camera freeze, controller input, thumbstick navigation, walkable navigation, and collision/BVH are accepted as working VR Headset baseline features.
- Immersive interaction parity is the next active stage. Plain video clicks must use direct inline play/pause without loading spatial UI solely for video controls. CEFR and assessment remain spatial UI surfaces and must suppress DOM/A-Frame fallback panels in immersive XR when spatial UI is unavailable.
- `max` attempts requested PMNDRS composer, scene probe, Takram sky PMREM, and Takram clouds only in immersive VR and only when runtime support checks pass.
- Individual experiments can be enabled with scene metadata or query flags: `vrodos_vr_profile=max`, `vrodos_enable_xr_pmndrs_composer=1`, `vrodos_enable_xr_scene_probe=1`, `vrodos_enable_xr_takram_sky_environment=1`, and `vrodos_enable_xr_clouds=1`.
- Render-budget overrides can be tested with `vrodos_vr_framebuffer_scale=...` and `vrodos_vr_foveation=...`; effective support/application state is published at `window.VRODOS_RUNTIME_FEATURE_STATE.renderer.vrRenderBudget`.
- Real Quest 2 testing found that PMNDRS composer/cloud ownership can tile the stereo framebuffer and destabilize the wider headset UI/compositor. Quest-class browser sessions now fail closed for PMNDRS composer/clouds by default, including inline browser-panel mode; `vrodos_force_headset_pmndrs_composer=1` is reserved for short isolation tests only.
- Quest 2 testing on 2026-06-15 found that the legacy post-FX renderer override is also not safe in immersive XR: an FXAA-only legacy-composer trial produced black-screen/tiled-framebuffer artifacts during head movement. Do not promote legacy FXAA/TAA/SAO/SSR into the VR Headset profile without a new XR-native implementation.

### Phase 1 - Baseline And Diagnostics

1. Keep the current direct-stereo VR rendering path unchanged.
2. Add or validate a consolidated runtime feature-state diagnostic that reports:
   - presentation mode
   - immersive XR status
   - mobile classification
   - render quality
   - post-FX request and active owner
   - PMNDRS/legacy composer active state
   - Takram atmosphere/cloud request and active/skip state
   - effective reflection source
   - scene probe capability
   - shadow quality/effective shadow mode
   - navigation mode
   - collision availability and collision target counts when discoverable
   - spatial UI availability and pointer source when discoverable
3. Ensure diagnostics are available through a stable `window` global and optional console logging, without noisy per-frame logs.
4. Validate at least one representative Master compiled scene on Desktop and VR.

### Phase 2 - Harden Scene-Owned VR Features

1. Confirm VR keeps scene-owned Takram/Horizon sky, sun/moon, day-night lighting, fog, tone mapping, material profiles, and HDR environment maps where safe.
2. Treat walkable collision and controller thumbstick movement as accepted baseline features; retest them only after changes that could affect navigation/collision.
3. Confirm spatial UI only on scenes that actually contain immersive CEFR or assessment flows; plain video assets should not request the spatial UI chunk unless they also carry CEFR/assessment metadata.
4. Fix any VR-only regressions in these existing scene-owned features before enabling composer effects.

### Phase 3 - Add Headset Quality Controls

1. Keep the current accepted baseline budget unless a real quality problem appears: native renderer AA on, framebuffer scale `1.0`, foveation `0.5`.
2. Avoid calling `renderer.setPixelRatio()` while XR is presenting.
3. Prefer asset derivatives, LOD, texture budgets, and shadow budget controls over global visual feature downgrades.
4. Record effective render scale and quality decisions in the Phase 1 diagnostic state.
5. Do not solve shimmer with legacy FXAA/TAA; Quest testing showed that path corrupts immersive XR.

### Phase 4 - XR PMNDRS Composer Experiment

1. Add an explicit opt-in flag for immersive XR PMNDRS composer testing.
2. First validate a no-effect composer path in headset.
3. Then test one cheap effect at a time.
4. Keep automatic fallback to direct stereo when unsupported, too slow, or visually broken.
5. Do not enable this globally until Quest-class headset evidence is acceptable.

### Phase 5 - Reintroduce Desktop Effects By Risk Order

1. Lowest risk:
   - renderer exposure/tone mapping
   - material profiles
   - HDR environment maps
   - scene-owned lighting/fog
2. Medium risk:
   - color correction
   - LUT
   - vignette
   - noise
   - chromatic aberration
   - modest bloom
3. Higher risk:
   - SSAO
   - lens flare
   - reflection/glint attenuation
   - scene probes
4. Highest risk:
   - Takram volumetric clouds
   - native WebXR layers
   - AR/MR passthrough and occlusion integration

### Phase 6 - AR/MR After VR

1. Define a separate AR/MR capability contract.
2. Decide whether compiled scenes should expose AR entry at all.
3. Design AR/MR placement, hit-test, anchors, occlusion, passthrough, and interaction semantics.
4. Avoid mixing AR/MR behavior into the VR parity work until VR has stable diagnostics and validated feature parity.

## Acceptance Criteria

- A root Markdown audit exists and can be used as the current VR parity roadmap.
- A headset session can report the runtime's active feature state from a single diagnostic global.
- Diagnostics distinguish Desktop inline/fullscreen from real immersive XR.
- VR direct-stereo rendering remains the default.
- No Desktop visual features regress while diagnostics are added.
- No AR/MR behavior is implied as supported without explicit implementation.

## Verification Plan

- Run JavaScript syntax checks for edited runtime files.
- Rebuild runtime bundles after source runtime changes.
- Run `git diff --check`.
- Run `npm run lint` when feasible.
- Recompile affected generated scenes before headset validation.
- Validate a representative Master client on:
  - Desktop inline
  - Desktop fullscreen
  - Mobile inline, when available
  - Meta Quest or equivalent WebXR headset

## Current Default Decisions

- Target VR first, with Meta Quest-class devices as the practical runtime budget.
- Keep WebXR layers disabled by default.
- Keep PMNDRS/legacy composer disabled by default in real immersive XR.
- Treat HDR environment maps and scene-owned Takram/Horizon visuals as the first visual parity candidates.
- Treat controller navigation and collision/BVH as accepted VR Headset baseline features.
- Treat minor current far-edge shimmer as acceptable/solved unless it regresses.
- Treat AR and MR as separate future platform work.
- Prefer measurable runtime diagnostics before enabling new headset visual effects.
