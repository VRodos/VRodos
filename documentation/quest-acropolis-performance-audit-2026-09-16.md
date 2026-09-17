# Quest 2 Acropolis performance audit

Date: 2026-09-16. Status: initial measured audit; no production optimization or device acceptance claimed.

Current baseline: see **Verified deployed-code baseline** at the end. Earlier experiments and proposed work orders below are historical evidence, not the current live state or accepted production changes.

Scene: [Athens – The Acropolis, project 1098 / scene 1099](https://vrodos.iti.gr/wp-content/uploads/vrodos/published/projects/1098/clients/Master_Client_1099.html).

## Findings

The scene needs both asset and rendering work. Increasing eye resolution resolved the user's reported distant shimmer at scale 1.5; scale 1.25 was reported better than the original. Neither constitutes performance acceptance. Disabling shadow reception removed a separate rectangular artifact, but did not remove the shimmer.

The best first work packages are reducing oversized decoration geometry, removing repeated settings parsing, and sharing/compressing repeated assessment textures. Keep the improved eye resolution as a visual comparison reference instead of obtaining a faster result by silently restoring the original aliasing.

## Measurement conditions and limits

- Connected Quest 2, real immersive Quest Browser session, requested refresh 90 Hz.
- Verified scale 1.25: 3600 × 1980 XR framebuffer; 1800 × 1980 composer buffer per eye. Scale 1.5 was 4320 × 2376 / 2160 × 2376 per eye; original scale 1 was 2880 × 1584 / 1440 × 1584 per eye.
- PMNDRS stereo rendering, tone mapping and SMAA Medium; composer MSAA zero; foveation 0.5; FPS meter disabled; clouds and day/night cycle off.
- All audit captures retained the preceding temporary shadow-reception test: 146 meshes had `receiveShadow=false`. Shadow-map generation itself was not disabled. These are **not measurements of the untouched published scene**.
- Frame intervals came from XR animation callbacks. Renderer submission duration was wall time around the outer scene render. Draw calls/triangles accumulated across both eyes and post-processing passes with automatic counter resets temporarily disabled, following [Three.js guidance](https://threejs.org/docs/pages/WebGLRenderer.html).
- Six-second initial capture at scale 1.25: mean frame interval **65.56 ms (~15.3 FPS)**, p95 **68.23 ms**, mean renderer submission **12.33 ms**, approximately **191 draw calls and 3.96 million submitted triangles per stereo frame**.
- Later captures varied with viewpoint, approximately 150–190 calls and 2.7–4.0 million triangles. Loaded scene totals below are not the same as frustum-visible submitted triangles.
- Model/sky/post-processing/cache trials restored each change afterward. One trial lost XR visibility and was rejected. Later trials recorded 7–89 degrees of head movement, so their apparent FPS differences are **not causal optimization gains**. Do not use them to promise savings.
- No GPU timer-query extension was exposed. A six-second CPU profile had 56% sampled idle time; combined with the resolution sensitivity, this suggests substantial GPU/rendering pressure, but does not measure GPU milliseconds or distinguish vertex, fragment, bandwidth, driver, and compositor costs.
- Thermal service reported status 0 at inspection; this single reading does not exclude frequency changes during the longer session.

## 1. Oversized geometry: highest-priority asset investigation

Downloaded the ten unique published/runtime GLBs into an external audit folder and ran `scripts/audit-master-client-assets.mjs` against that local mirror. Total transfer size is 34.8 MiB and unique GLB mesh definitions contain about 2.83 million triangles. Published model placements expand to about 3.39 million triangles before stereo rendering and culling.

| Asset | GLB triangles | Live placed triangles | Transfer | Notes |
| --- | ---: | ---: | ---: | --- |
| Ionic and Doric Columns | 1,241,316 | 1,241,316 | 2.2 MiB | Decoration `21e999a4-edeb-4887-b7dc-6372e4ef4ed0`; 12 meshes, one material, Draco |
| Temple | 259,924 | 822,128 | 1.6 MiB | Walkable surface `e78b6863-4300-462c-970d-5bb50f52c8a2`; repeated mesh placements, 73 live meshes |
| Athena #3DST8 | 360,268 | 360,268 | 1.9 MiB | Decoration `3355f7c0-73e4-41ee-829b-19d750b74223`; Draco/KTX2 |
| Portal / arch | 336,330 | 336,330 | 0.7 MiB | Door `a9a7cfab-92c6-48e7-a3d1-1547da7ae2a4`; one primitive alone has 315,926 triangles |
| Parthenon East Frieze | 232,149 | 232,149 | 16.5 MiB | Decoration `4a732b61-7762-4961-83b9-b0da7738abbd`; Draco/KTX2, large texture payload |
| Parthenon Sculptures East Pediment | 210,706 | 210,706 | 3.3 MiB | Draco/KTX2, unlit material |
| Acropolis Museum Caryatids | 128,861 | 128,861 | 1.8 MiB | Draco/KTX2, unlit material |

Draco reduces transfer size, not decoded triangle count. The small column and portal files still contain expensive geometry. The runtime's loader classifies several of these as a “small deferred asset” from bytes; supplement diagnostics with triangle/primitive/decoded-memory cost rather than treating small downloads as cheap renders.

Recommended work:

1. Produce offline reduced-detail candidates for Ionic/Doric Columns, Athena, and the portal. Preserve recognizable silhouettes, object origins, interaction roots and door behavior. Start with one asset and measure at matching viewpoints; do not remove assets as a production optimization.
2. Verify which headset derivative family was selected. The live assets include 4096px textures, but the capture does not independently establish the saved project quality choice. Existing Web High deliberately preserves geometry; Web Medium/Low simplify eligible decorations at ratios 0.8/0.5 subject to error limits. Even those ratios may leave a million-triangle source too expensive. Do not silently redefine High.
3. Introduce distance LOD only as an explicit derivative/runtime feature, with stable selection and collision behavior, transition checks, and device validation.
4. Treat the temple separately: it is a protected walkable surface. Do not run a blanket visual simplifier over its current collision/navigation geometry. A separate navigation proxy and visual asset architecture needs explicit design and validation.

The temple also has nine repeated geometry/material groups with counts 7, 7, 7, 6, 5, 5, 5, 2, 2. Spatially bounded instancing could reduce submission overhead; it will not reduce triangle count and must preserve bounds, ray selection, collision and per-object interaction. It is not the first fix for all assets.

## 2. Avoid repeated settings work in the frame loop

`assets/js/runtime/master/vrodos_runtime_settings_helpers.js:30` constructs a fresh `URLSearchParams` on every `queryValue()` call. A separate three-second counter observed **35,440 calls** while XR was visible. The CPU profile attributed 193.94 ms self time to `H.queryValue` and another 37.73 ms to `URLSearchParams` over 6.30 seconds of samples (approximately 3.1% and 0.6% respectively).

Cache parsed query parameters until `location.search` changes. Preserve live `VRODOS_DEBUG` overrides. This is a concrete, small CPU cleanup; it is not a claim of a large FPS gain.

The composer also reconstructs a long signature and repeatedly resolves cloud, atmosphere and debug policy in its render wrapper (`vrodos_postprocessing_pmndrs.js`, `getPmndrsComposerSignature`, around lines 3147 and 5059). After profiling the parsing fix, move stable configuration derivation to settings/feature changes with explicit invalidation. Preserve live debug changes and time-varying atmosphere behavior. Avoid introducing a new lifecycle owner.

## 3. Eye-buffer and post-processing cost

Scale 1.25 costs 1.5625× the original pixel count; scale 1.5 costs 2.25×. The visual improvement has a real workload cost. The active composer renders the scene separately for each eye into half-float buffers, then tone maps and runs SMAA.

Investigate reducing full-resolution passes and render-target traffic while preserving authored tone mapping and antialiasing. Direct rendering at high resolution was not sufficient in the exploratory captures; removing the composer alone is not an established solution.

Foveation is not a free remedy for this path: [Meta documents that fixed foveation applies to the final framebuffer and provides little benefit to intermediate-buffer rendering](https://developers.meta.com/horizon/documentation/web/webxr-ffr/). This is consistent with the lack of an observed visual change when foveation was disabled earlier. Do not infer that the foveation API was broken.

Takram sky draws before opaque geometry (`vrodos_atmosphere_visuals.js:1901`, render order -1000). Investigate its pixel cost with vendor GPU tooling and a valid same-view comparison before changing ordering; previous sky-order acceptance remains unresolved. Preserve dynamic Takram lighting/sky requirements. Do not substitute a static sky or upgrade Three beside A-Frame as a shortcut.

## 4. Repeated textures and non-GLB media

- Four instances of the same Notebook and Pen assessment GLB each held six distinct texture objects: **24 texture objects** for one repeated prop. The asset is 4.6 MiB, 738 triangles, and has no KTX2 compression. Investigate shared decoded texture resources and a compressed first-party asset, with reference-counted disposal and independent placement/material state. Distinct objects alone are not a measurement of exact GPU allocation.
- Four primitive-plane JPEG maps total approximately **19.9 MiB** of transfer payload. Improve preparation/compression of these non-GLB maps; a GLB-only optimizer will not handle them. Retain map color spaces, repeats and mipmaps.
- Most material textures are at 16× anisotropy. Profile a lower headset-specific cap only as a separate visual experiment; reducing filtering can worsen the distance shimmer just investigated.
- The captured videos were all paused and unready. There is no evidence that active video decoding caused this baseline's frame cost.

## 5. Shadow artifact is a separate correctness task

The sun's 1024² shadow map covered approximately 204 × 228 world units: roughly 0.20 × 0.22 units per texel. Shadow reception off removed the user's rectangular “snow” region; it did not remove distance shimmer. This isolates shadow participation, not the precise shader/root cause.

Inspect frustum fitting, coordinate consistency during head pitch/authored-world movement, and precision/self-shadowing. Keep fixes in the existing shadow owner/helpers and use profile-based bias policy. Do not ship the diagnostic removal of shadow reception or simply hardcode a new bias. Re-enable shadows for performance and visual acceptance after a candidate fix.

## Validation and next work order

1. Cache query parsing; verify query/debug updates and measure CPU profiles again.
2. Create and visually compare lower-cost column/Athena/portal candidates through the existing derivative pipeline. Preserve navigation-protected geometry.
3. Share/compress repeated assessment textures and prepare the plane maps; measure transfer and resource counts separately from FPS.
4. Obtain GPU timing using [Meta's WebXR performance tools](https://developers.meta.com/horizon/documentation/web/webxr-perf-tools/) and isolate geometry, sky, shader and render-target costs. Use [Meta's workflow](https://developers.meta.com/horizon/documentation/web/webxr-perf-workflow/) and [best practices](https://developers.meta.com/horizon/documentation/web/webxr-perf-bp/) for the next device pass.
5. Fix and restore shadows; retain the higher-resolution visual reference when evaluating final settings.

For each candidate, keep headset visibility, viewpoint, loaded assets, resolution, shadows and effects matched. Record head movement and reject unsuitable comparisons. Measure normal frames separately from shader warmup/loading. Require both-eye visual checks, controls, walking/collision, POI/assessment/video interactions, and exit/re-entry. A 90 Hz application frame budget is 11.11 ms; the current ~65 ms baseline needs substantial improvement, not just a small settings change.

No runtime code, asset, or published scene was changed by this audit. Temporary model/sky hiding, direct rendering, query caching and instrumentation were restored. At handoff, the earlier session trials intentionally remain: scale 1.25, post-processing on, foveation 0.5, MSAA zero, and shadow reception disabled on 146 meshes. Reload restores the published settings.

Evidence files were saved in the session's external `quest-audit` folder: `scene.json`, `baseline-125.json`, `baseline-cpu.json`, `trials.json`, `final-inspection.json`, `asset-audit.json`, `asset-audit.md`, and downloaded GLBs. The asset audit counts unique GLB mesh definitions; the live snapshot counts placements. Both counts are retained to avoid confusing transfer geometry with rendered scene complexity.

## Implemented follow-up: repeated props and plane textures

The earlier findings above describe the initial audit. The following changes are implemented locally and require recompilation/deployment for headset acceptance:

- Compiled assessment props use `assets/models/runtime/assessment-web.glb`, generated by `node scripts/build-builtin-runtime-assets.mjs` through the existing protected-geometry Web encoder. The editable source remains unchanged. Transfer decreased from 4,806,512 bytes to approximately 3.3 MiB (28.4%); the prop retains 738 triangles. KTX2 decoder wiring already belongs to the compiled runtime.
- `vrodos-shared-model-textures` shares immutable image sources and compressed mip arrays across assessment placements of the same GLB within one scene. Texture/material objects stay independent, preserving per-placement repeats, colors, and sampler settings. The cache drops references after its final component releases them. Three r185 owns GPU texture reference counting by source and sampler configuration.
- A local headless Chrome check loaded four copies through the actual GLTF/KTX2/Draco loaders. Image sources decreased from 24 to 6; renderer texture allocations decreased from 25 to 7, including one non-prop allocation. Removing and disposing one prop retained the remaining shared allocations. These are resource counts, not Quest FPS measurements.
- Scene-owned primitive-plane maps are resized during publication using the existing WordPress image editor. The cap is 1024/2048/4096px according to headset object quality; desktop and PC-rendered VR retain a 4096px cap. Maps already below the cap pass through unchanged. Data maps use lossless PNG after resizing, while albedo retains its source encoding. Source attachments, aspect ratio, tiling, color-space assignment, normal orientation, and filtering policy are not changed. Staging is deleted on success or publication failure; output size and data encoding are checked before publication. This reduces oversized map dimensions but does not add GPU texture compression to plane materials.

Validation: 51 runtime tests and 36 compiler tests passed. The compiler suite used the installed PHP ZIP/GD extensions for its test process; server configuration was not modified. The browser validation server and browser were closed afterward.

Still pending device investigation: stable composer configuration invalidation, reduction of full-resolution passes, sky pixel cost, the shadow rectangle root cause, temple instancing/separate navigation geometry, and explicit distance LOD. No eye-resolution, anisotropy, shadow-reception, or sky-order reduction was shipped as a shortcut. Fresh matched-view headset captures are needed to establish FPS improvements and visual acceptance.

## Stationary native GPU investigation (later live build, 2026-09-16)

The optimized Acropolis remains fragment-bound. Native `ovrgpuprofiler` counters showed approximately 93% fragment versus 7% vertex shading time, 80% shader busy, 66% texture-pipe busy and 23% texture-fetch stalls. VrApi showed near-full GPU utilization. These are device-wide counters rather than application-exclusive attribution. Detailed profiling was already enabled; render-stage traces returned no stages, so no isolated GPU pass times are claimed.

Accepted trials used a stationary Quest 2, visible immersive session, disabled FPS meter, three-second samples after one-second settling, and restored baselines. Rotation within each sample was below 0.04 degrees. Current framebuffer was 2880 x 1584, with 1440 x 1584 half-float intermediate buffers per eye, scale 1.0, foveation 0.5, SMAA Medium and composer MSAA zero. Shadows were enabled without continuous map updates; clouds/day-night were off. This is not the earlier higher-resolution shimmer acceptance configuration.

| Temporary intervention | Approximate FPS | Frame interval |
| --- | ---: | ---: |
| Normal scene, repeated baselines | 19.4-20.1 | 49.8-51.5 ms |
| Disable world shadow reception | 21.3 | 47.0 ms |
| Hide sky with enforced visibility | 23.1 | 43.3 ms |
| Disable SMAA | 22.6 | 44.3 ms |
| Hide sky and disable SMAA | 27.4 | 36.5 ms |
| Plain untextured Basic world materials | 32.1 | 31.2 ms |
| Hide world, retain sky/post-processing | 40.3 | 24.8 ms |
| Hide world and sky, retain post-processing | 87.4 | 11.4 ms |
| Hide world, direct rendering | 89.7 | 11.1 ms |
| Full world, direct rendering | 16.7 | 59.7 ms |
| Full world, direct rendering/max foveation | 17.5 | 57.2 ms |
| Disable normal/bump maps | 20.4 | 49.1 ms |
| Disable environment maps/environment | 22.5 | 44.5 ms |
| Remove common texture maps | 22.0 | 45.5 ms |
| Force front-side world materials | 20.9 | 47.9 ms |
| Packed HDR intermediate buffers | 20.5 | 48.9 ms |
| Byte RGBA intermediate buffers | 21.0 | 47.5 ms |
| Composer, foveation zero / maximum | 20.4 / 19.9 | 49.1 / 50.1 ms |

These are end-to-end frame intervals, not additive pass costs or shippable quality presets. Appearance-changing interventions were diagnostic only. Rendering the sky after opaque geometry and hiding/replacing the ground made no meaningful difference in this view. An initial plain `sky.visible=false` trial was invalid because runtime policy re-enabled it; only the enforced-visibility trial is accepted. Buffer-format changes were not visually validated or adopted.

### Architectural constraint

`renderPmndrsComposerForXrStereo()` disables Three's XR rendering while running a complete composer per eye. Expensive scene/sky drawing happens in ordinary intermediate targets. [Meta's FFR documentation](https://developers.meta.com/horizon/documentation/web/webxr-ffr/) explains that native foveation does not benefit intermediate scene buffers, matching the observed lack of improvement from maximum foveation. Meta also warns about switching away from and back to the eye framebuffer. Our interleaved intermediate/final eye work deserves validation, but this investigation did not isolate that cost or prove native MSAA was disabled.

The next major optimization target is the headset render path: reduce scene/sky fragment work and full-resolution passes while preserving tone mapping and accepted distant-edge quality. Further decimation alone is insufficient. A native/foveated path must be tested as a complete pipeline: simply bypassing the composer was slower. Separate-resolution sky evaluation or a dynamically updated sky representation are candidates requiring visual validation; a static sky replacement is not an accepted fix.

All temporary rendering changes were restored, including materials, visibility, shadow reception, half-float RGBA targets, SMAA, XR state and foveation 0.5. No visual runtime change was shipped. The requested developer proximity override kept the headset awake; disable it after device testing with `adb shell am broadcast -a com.oculus.vrpowermanager.automation_disable`. USB stay-awake was also requested during testing and can be restored with `adb shell svc power stayon false`. No dev server was started; the diagnostic port 9222 forward was removed.

Local raw captures and experiment scripts: `C:/Users/tasos/.codex/visualizations/2026/09/16/01a0aa68-f9e6-7343-94fc-2992f94e65e6/quest-audit/`, files `bottleneck-isolation*`, `bottleneck-buffers`, `bottleneck-shading`, `bottleneck-foveation` and `bottleneck-restored`. Preserve scripts alongside captures for reproducibility.

## Rendering prototype follow-up

The first native-path prototypes did not beat the composer. In stationary, visible captures (`prototype-native.json`), baseline was 19.9 FPS; native AgX was 16.1, native without tone mapping 16.8, explicit per-eye AgX 18.0, and explicit per-eye without tone mapping 19.1. Restored baseline was 19.6. Removing tone mapping is diagnostic only. These results reject a simple native bypass as an optimization; they do not isolate native MSAA costs. Takram's raw sky shader also requires separate output-transform treatment before a native path can claim visual parity.

An opt-in half-resolution sky prototype now lives in the existing PMNDRS stereo helper. Enable `window.VRODOS_DEBUG.xrHalfResolutionSky = true` (initializing `VRODOS_DEBUG` if needed), or the query parameter `vrodos_xr_half_resolution_sky=1`, on a client loading the rebuilt PMNDRS runtime bundle. With the query absent, set the flag to false to return to the original path. `_pmndrsXrSky` on scene-settings exposes the active target and source for diagnostics.

It evaluates the current Takram sky independently for each eye every frame into a half-width/half-height HDR target, then composites at the original far depth before normal tone mapping/SMAA. Geometry resolution, scene materials, lighting and AA settings remain intact. The original sky geometry/material are shared, never disposed by the prototype; only its target and composite material are owned. Disabled/default clients allocate nothing. Composer teardown and disabling the flag release owned resources. Sun/moon disk softness, horizon quality, both-eye correctness, movement and exit/re-entry need headset acceptance before considering a default change.

The initial sky validation attempt was blocked when the immersive session reported `hidden`. Tests cover default opt-out, independent eye evaluation, restoration after sky/composer exceptions and preservation of source resources. The runtime bundle was regenerated; existing 51 runtime suites plus the new targeted acceptance test passed, as did build configuration and whitespace checks. The device reports AC power, so stay-awake was changed from USB-only to all powered states during this follow-up; restore with `adb shell svc power stayon false` after testing.

### Resumed live validation and recovery

With the scene visible again, the actual half-resolution helper was exercised through a temporary composer wrapper (`prototype-sky-integrated-verified.json`). At the new stationary viewpoint and original 2880 x 1584 framebuffer, baseline was 19.17 FPS / 52.15 ms; half-resolution sky was 19.54-19.58 FPS / 51.08-51.18 ms; restored baseline was 19.16 FPS / 52.18 ms. P95 frame intervals overlapped (53.35-55.20 ms for half sky versus 54.18-55.78 ms for baselines). This is a modest gain, not enough evidence to increase resolution while maintaining FPS. An exploratory quarter-resolution sky reached approximately 20.7 FPS but has not passed visual acceptance.

Reject `prototype-sky-integrated.json`: its temporary wrapper read PMNDRS's setter-only `mainCamera`, causing the runtime error path to render directly. The corrected wrapper selects the actual XR eye by viewport; only the `-verified` capture above is accepted.

A 1.1 framebuffer-scale override was prepared for a new session but was never measured or accepted. A subsequent MSAA trial lost immersive visibility during its baseline, then had no valid XR frame samples. The user reported that the browser was stuck and had not intentionally exited VR. Discard all `prototype-msaa2.json` timing results; the sequence does not establish MSAA as the cause of the session loss. Pending resolution listeners/overrides were removed and the published page reloaded. Recovery checks confirmed a responsive animation loop, no lost WebGL context, MSAA zero, no resolution-trial state and models loading again. Original rendering settings were retained pending user confirmation of VR recovery. Do not promote the resolution override or MSAA experiment into defaults.

### Resolution and legacy environment comparison

The user subsequently restarted Quest Browser, then resumed testing. At scale 1.0 a stationary matte-material diagnostic preserved textures but replaced eligible rough, nonmetallic Standard materials with Lambert materials. Baseline was 18.3-18.8 FPS, matte materials 21.1, matte plus half-resolution sky 22.4, and matte without sky 25.6. These changes alter lighting/appearance and are not production defaults. Disabling shadow reception alone had little benefit; removing environment reflection maps had a small benefit with variable slow frames.

The user then entered fresh XR sessions at scale 1.1 (3168 x 1742 framebuffer) and scale 1.5 (4320 x 2376). The scale 1.1 and 1.5 effect comparisons contained substantial head movement and must not be treated as matched-view optimization gains. The user rejected 1.1 as too small; 1.5 is the historical shimmer-fixing reference (2.25 times the original total pixels). A temporary direct-render bypass at 1.5 measured roughly 11 FPS but restored the composer on XR exit; it did not disable Takram. That distinction was explained when the user reported post-processing had returned.

At the user's request, the live scene was then switched through its settings to `postFXEngine=legacy`, `postFXEnabled=0`, `pmndrsAtmosphereEnabled=false`, with the existing A-Frame environment atmosphere sky and distant lighting. This PMNDRS-compiled page had not loaded the environment component, so the existing vendored `assets/vendor/aframe-environment/aframe-environment-component.min.js` was loaded for the experiment. Explicit horizon synchronization removed the previous Takram lights. Verification showed no composer, neither post-processing engine active, no Takram sky, and only A-Frame hemisphere/directional lights. The framebuffer remained 4320 x 2376. A six-second live sample measured about 10.1 FPS; it did not establish a performance improvement.

This final experiment uses live scene attributes rather than an exit-restored render wrapper, so it is intended to persist across XR exit/re-entry on that page. It has not been saved to WordPress or published; reloading the page restores the published configuration and clears the debug resolution override. Visual acceptance and same-view profiling of the full legacy path remain pending. No 2.25-per-axis setting was applied: the user clarified the total-pixel calculation.

The user confirmed that shimmering was **much better** with the A-Frame sky/sun and both post-processing/Takram off at scale 1.5. A first subsequent effect sweep had 5-55 degrees of head movement and cannot establish causal gains. A requested steady-view follow-up (`legacy-matte-steady.json`) retained 172 draw calls and 3,220,600 rendered triangles throughout. Original materials measured 15.53 FPS / 64.37 ms (p95 70.03 ms), selective matte Lambert materials 21.39 FPS / 46.76 ms (p95 49.67 ms), and restored originals 15.87 FPS / 63.03 ms (p95 65.61 ms). Head rotation was 2.74 degrees in the first baseline, 0.61 in the matte sample and 0.86 in the restored baseline, so this is materially steadier but not a perfectly identical pose. It supports a useful material-shading benefit, not a claim of comfortable headset performance.

The matte diagnostic was then left active for visual review on 93 authored meshes. It retains geometry/textures and substitutes only Standard materials with roughness at least 0.8 and metalness at most 0.1. This scene-specific experiment is not a production eligibility policy for arbitrary Physical/transparent assets. The user initially accepted its appearance, then rejected the visual loss as insufficiently compensated by roughly 5 FPS. Original materials were restored and temporary materials disposed; the matte trial was removed. Verification retained the 4320 x 2376 framebuffer, A-Frame environment and both post-processing engines off. Do not ship the rejected matte-material change. No material-shading default or published project setting was changed.

### Final requested direction: Takram without post-processing

The user subsequently preferred the natural Takram atmosphere/sun again, explicitly without any post-processing. After reopening Acropolis, the live page was set to `postFXEngine=pmndrs`, `pmndrsAtmosphereEnabled=true`, `postFXEnabled=0`, and `vrHeadsetStereoPostFxEnabled=0`. Clouds/aerial post-effects remain off, original materials are retained, and scale 1.5 is prepared for the next XR entry. Verification outside XR found the Takram sky and named Takram sun/sky/fill lights, no A-Frame environment, neither post-processing engine active and no composer. This supersedes the earlier A-Frame environment trial; it is a live-page setting, not a published project change.

A code defect discovered during this switch allowed the high headset stereo branch of `hasPmndrsComposerEffectRequest()` to override the master `postFXEnabled=0` setting. The master off switch now wins. Takram's stereo-composer parity check likewise respects master off, allowing its direct-sky calibration when no compositor should run. A targeted feature-state acceptance case verifies that master off prevents the composer request while retaining authored Takram atmosphere/visible sky. Runtime bundles were regenerated; all 52 runtime tests and build-configuration checks passed. Deploy the changed bundles to make that policy fix permanent; the live page uses a temporary matching guard until reload.

## Verified deployed-code baseline

The user reverted runtime code and tests to `71710567` (`perf: share assessment textures and optimize compiled scene media`), retaining this audit document. The half-resolution sky prototype, master-off guard, calibration-policy guard and their tests are therefore **not current code**. The preceding deployment recommendation is superseded. No runtime changes were made during this baseline investigation.

### Provenance and device state

- Quest 2 serial `1WMHHA68H91516`, Quest Browser `150.1.0.24.52.1046134268`, Acropolis page target `151`, published client 1099.
- Retrieved actual loaded JavaScript through CDP `Debugger.getScriptSource`, rather than assuming URL/cache-busting metadata proved deployment. All 12 VRodos script sources matched the reverted local files exactly, including A-Frame, Three addons, Takram, PMNDRS and runtime bundles. Debugger was disabled immediately afterward, outside timing capture.
- The initial page inspection was inline, with no XR session. After the user entered VR, inspection confirmed a visible immersive session, requested 90 Hz, no lost context, authored PMNDRS stereo enabled, original Standard/Physical/Basic materials, 144 shadow receivers, clouds/day-night off and FPS meter off. No previous experiment flags were found.
- Existing forwards were `tcp:50649 -> tcp:36147` and `tcp:9222 -> localabstract:chrome_devtools_remote`. Neither was changed.
- Existing `stay_on_while_plugged_in=15`, `screen_off_timeout=86400000`, AC power, awake and stay-on state were retained. No device setting was changed. Thermal status was 0 at inspection; this does not establish constant clocks throughout capture.

### Actual rendering architecture

| Stage | Verified live state |
| --- | --- |
| XR layer | Classic `XRWebGLLayer`, 2880 x 1584 total, antialias true, foveation 0.5, multiview false |
| Eye viewports | Left `(0,0,1440,1584)`, right `(1440,0,1440,1584)` |
| Scene rendering | Complete Takram sky and authored scene rendered separately per eye into 1440 x 1584 half-float intermediate buffers |
| Scene-target AA | Zero samples, verified both on render-target metadata and the bound GL framebuffer |
| Post-processing | ToneMappingEffect, then SMAA Medium: edge detection, weights, final neighborhood blend |
| Final XR AA | Bound XR framebuffer reported `SAMPLES=4`, `SAMPLE_BUFFERS=1`; Three's XR target wrapper reports `samples=0`, which must not be mistaken for the native layer sample count |

Native MSAA samples the final fullscreen composite; it cannot reconstruct geometric coverage already lost in the single-sample scene image. SMAA is the active scene-image antialiasing here. Increasing scale to 1.5 means 2160 x 2376 per eye and 2.25 times total pixels; it is a historical visual reference, not an accepted performance setting.

One instrumented stereo frame, collected separately from performance timings, contained 161 scene draws and about 2,297,327 submitted triangles per eye, followed by four fullscreen draws per eye. This is approximately 330 draws and 4.59 million submitted triangles total. These are one-frame submission counts, not loaded asset totals or isolated GPU timings.

The observed sequence per eye was scene target -> stable-depth copy target -> final framebuffer binding -> tone-map target -> SMAA edges -> SMAA weights -> final XR draw. The right eye then starts intermediate work again after the left eye has already written the XR framebuffer. Source inspection identifies the intermediate depth copy as `EffectComposer.blitDepthBuffer()`; a framebuffer binding alone is not an additional visible draw.

[Meta's FFR documentation](https://developers.meta.com/horizon/documentation/web/webxr-ffr/) explains that intermediate scene buffers do not receive native foveation savings and warns about leaving/re-entering the final eye framebuffer. Our sequence warrants investigation. The API reports four samples and foveation 0.5; this is **not proof of effective hardware foveation or tile behavior** across that sequence. No native MSAA setting was changed.

### Stationary timing baseline

Five seconds of warmup followed by three consecutive ten-second windows in the same visible XR session, without rendering-setting changes. XR callback intervals were recorded with viewer position/quaternion, authored-world matrix, program count, geometry count and visibility. No per-frame CDP polling, GPU readback, renderer wrapping or debugger capture was used during these timings. The light in-page recorder still has some overhead; intervals are application callback pacing, not isolated GPU duration.

| Window | Frames | Mean interval | Approx. FPS | p95 | p99 | Maximum |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| A | 163 | 61.23 ms | 16.33 | 66.53 ms | 71.01 ms | 72.95 ms |
| B | 162 | 61.91 ms | 16.15 | 66.21 ms | 77.99 ms | 78.72 ms |
| C | 165 | 60.56 ms | 16.51 | 62.89 ms | 64.24 ms | 64.29 ms |

All recorded frames were visible; each window had less than 0.032 degrees maximum rotation and 0.61 mm maximum translation from its first pose. Authored-world transform stayed fixed, with 53 programs and 104 geometries throughout. Every interval exceeded 50 ms. These are repeated windows of one viewpoint/session, not independent sessions or an optimization comparison. At 90 Hz the application budget is 11.11 ms.

The user reports further slowdown when entering dense GLB areas. This requires a second stationary viewpoint, with its own pose and visible workload recorded. Do not infer a dense-versus-sparse delta from this single viewpoint or from earlier moving captures. No second-view readiness confirmation or capture has been obtained yet.

### Direct Takram correctness review

- Live composer path: sky material callback received the appropriate eye camera; both inverse projection and inverse view uniforms matched that eye. Direct calibration was not installed. This verifies matrix wiring for this path, not both-eye visual acceptance of the direct path.
- Upstream `SkyMaterial` is a raw shader with `toneMapped=false`. Its shader returns atmospheric radiance, and the installed material updates camera uniforms in `onBeforeRender`. The current Three non-multiview renderer invokes material callbacks for each eye, so source review alone does not support blaming an ArrayCamera/single-eye update error.
- The custom direct calibration applies exposure, a Reinhard-like `x/(x+1)` curve, approximate gamma and a preset lower-horizon color blend. It is not the same output transform as this scene's authored ACES-filmic composer. Its elevation calculation uses ECEF camera position and ray direction in the upstream fragment shader, so the expression is not obviously a local-world/ECEF mismatch.
- Direct-calibration policy also selects half-float/basic atmosphere lookup resources instead of this baseline's quality/float/higher-order resources. Composer bypass, policy-driven direct mode and A-Frame environment replacement therefore compare different pipelines.
- The calibration hook is installed once on the sky material. Its early return when calibration becomes ineligible changes diagnostic state but does not itself restore the prior shader hook/cache key. Whether a transition recreates the material must be verified before live off/on switching is considered a clean comparison.
- The reverted master-off and parity guards addressed policy selection, not direct-path stereo/color/lifecycle correctness. Their previous feature-state test did not establish visual stability. The earlier unstable direct-Takram symptom remains unresolved.

The simpler A-Frame environment path draws its sky and scene through the direct renderer rather than the per-eye HDR/SMAA chain, but also changes sky shading and lighting. A valid historical comparison requires a known earlier build and matched assets, pose, resolution, materials, shadows and refresh rate. The earlier improvised environment substitution is not that comparison.

### Specific next hypothesis and acceptance

**First candidate: eliminate an unused stereo depth copy while preserving the current Takram, PBR, resolution, tone mapping and SMAA output.** Live SMAA uses `EdgeDetectionMode.COLOR=2` and `PredicationMode.DISABLED=0`, yet the installed upstream SMAAEffect unconditionally declares `CONVOLUTION | DEPTH`. Its EffectPass consequently requests a stable depth texture and RenderPass triggers a full-resolution depth blit each eye. The other active effect is tone mapping and does not request depth.

This is a source-backed candidate for avoiding bandwidth and target traffic, not a measured optimization or a proposed AA downgrade. Before implementation, verify every enabled consumer and the shader defines; retain depth support for depth-edge detection, depth predication or any other depth consumer. A controlled candidate must leave visible output unchanged and remove the observed copy from a frame capture. Do not promise that this alone will close the roughly 60 ms versus 11 ms frame-budget gap, and do not mix it with direct-render, material, MSAA, sky-resolution or foveation changes.

Benchmark baseline/candidate/restored baseline at each agreed stationary viewpoint, with five-second warmup and three ten-second windows per condition. Record visibility, session identity, resolution, pose/motion, world transform, programs, geometry, submission counts in separate captures, mean/p95/p99/max and intervals over 50/100 ms. Reject session/visibility/pose/workload changes. Perform controlled slow-head-motion shimmer and both-eye appearance review separately from timing; do not change the scene during visual inspection.

New evidence and reproducible diagnostic scripts are outside the repository at `C:\Users\tasos\.codex\visualizations\2026\09\16\01a0ab2b-8be9-7920-beb8-5f940695445b\quest-baseline\`: `loaded-source-provenance.json`, `clean-snapshot.json`, `state.json`, `baseline-timing.json`, `frame-anatomy.json`, and `depth-policy.json`. The frame-anatomy wrappers restored their original functions. No scene settings, device settings, forwards, materials, published files or runtime sources were changed. No dev server was started.

### Controlled depth-copy follow-up

After the user confirmed readiness at the requested dense-area viewpoint, two baseline/bypass/restored-baseline sequences tested only `RenderPass.needsDepthBlit`. The temporary bypass skips copying the scene depth into the stable depth texture; it does **not** disable the scene depth buffer or depth testing. The active SMAA shader declares/reads depth only for depth-edge detection or depth predication; neither is selected here. Scene targets, shaders, materials, resolution, sky, tone mapping and SMAA remained unchanged. Each condition used three seconds of settling and eight seconds of sampling, a shorter diagnostic protocol than the acceptance protocol above. A `finally` block restored the original flag and the temporary depth-blit counter wrapper.

| Run | Condition | Mean interval | p95 | p99 | Maximum |
| --- | --- | ---: | ---: | ---: | ---: |
| First | Baseline | 48.62 ms | 52.24 ms | 55.03 ms | 55.06 ms |
| First | Skip depth copy | 47.82 ms | 51.04 ms | 52.39 ms | 53.47 ms |
| First | Restored | 48.86 ms | 53.03 ms | 60.16 ms | 61.06 ms |
| Repeat | Baseline | 48.16 ms | 51.27 ms | 53.35 ms | 54.24 ms |
| Repeat | Skip depth copy | 47.28 ms | 50.15 ms | 51.16 ms | 51.26 ms |
| Repeat | Restored | 48.79 ms | 52.30 ms | 55.77 ms | 56.22 ms |

All conditions remained visible with very small head motion and fixed authored-world transforms. The first restored window changed renderer geometry count from 115 to 117, so it is not accepted as a fully matched workload comparison. The repeat retained 121 geometries and 54 programs throughout; within-window rotation stayed below 0.033 degrees and translation below 0.38 mm. The repeat counted 458/0/452 depth blits across its baseline/bypass/restored conditions including settling. The repeat suggests roughly 0.9–1.5 ms improvement (about 2–3%), not a transformation of VR performance. It is one short repeated sequence, with no separate both-eye visual acceptance or pixel-equivalence capture. No runtime patch was retained or promoted to a default.

Separate restored-baseline submission capture: 211 draws and 3,128,664 triangles per stereo frame, mean CPU-side render submission 14.93 ms (p95 17.30 ms), mean XR interval 48.70 ms (p95 51.53 ms). The one-frame anatomy independently counted 103 left-eye and 100 right-eye scene draws, plus eight fullscreen draws. Submission wall time can include driver waits and is not pure CPU work or GPU duration. A six-second CPU profile contained 2.865 seconds of sampled idle time out of 6.169 seconds of recorded sample deltas (46.4%); renderer program selection, draw submission and uniform uploads appeared among active samples. This supports investigating rendering/driver/GPU work, without assigning the remaining frame time to an isolated pass.

This requested dense-area view actually submitted fewer draws/triangles than the earlier baseline view (330 draws / 4.59 million triangles). The faster ~49 ms versus ~61 ms results must not be described as a dense-area regression or a code improvement. Proximity to assets does not establish the visible workload; benchmark positions and directions must be retained explicitly.

Native detailed profiling was already enabled and was left unchanged. A 0.1-second render-stage query returned no data; no per-pass GPU timings are available. Thermal status remained 0 at inspection. Original depth-copy behavior was verified restored afterward. Evidence: `depth-copy-aba.json`, `depth-copy-aba-repeat.json`, `dense-frame-anatomy.json`, `dense-submission.json`, and `dense-cpu.json` in the same external artifact folder.

Conclusion: the unused depth copy is a small, appearance-preserving optimization candidate, but it is not the primary explanation for the current frame budget. The next larger investigation should validate a complete native-target Takram/PBR path with correct per-eye sky output and matching color transforms in an isolated test client before any live switch. Do not repeat the previous composer bypass or alter the production scene's materials/MSAA in pursuit of this result. Both the ~15 ms submission cost and the much longer end-to-end frame interval need attention; native foveation alone is not evidence that either budget will be met.

### Isolated native-path preparation and local validation

An external lab now exists at `C:\Users\tasos\.codex\visualizations\2026\09\16\01a0ab2b-8be9-7920-beb8-5f940695445b\quest-native-lab\`. It uses a downloaded copy of the published HTML, current local runtime bundles, and read-only public media retrieval. The local server rejects non-GET requests; it does not publish or save scene changes. No native-path code was added to the plugin.

The native candidate preserves the authored `quality:float:higher:combined` Takram lookup resources, sky camera callback, lights and PBR materials. It bypasses the stereo composer at the outer scene-render boundary and applies Three's ACES-filmic transform at exposure 1.4 directly in the raw sky fragment shader, followed by the standard sRGB output transfer. Standard/Physical materials use renderer ACES. Eight unlit materials in the local smoke scene required `toneMapped=true` because the reference composer applies tone mapping to their pixels too. This is a material output-policy change, not a Lambert/material-class substitution. Transparency can still differ because per-material tone mapping precedes blending, whereas composer tone mapping follows blending.

Local color fixture: two asymmetric perspective cameras, sky alone and sky plus a PBR sphere, 256 x 256 pixels. Reference uses a half-float composer with ACES and no SMAA; candidate renders directly with the canvas's existing antialiasing enabled. This deliberately isolates color mapping rather than asserting AA equivalence. The first fixture run captured before atmospheric precompute completed and produced black sky; it was rejected. The corrected gate waits for atmosphere readiness and reuses the owning renderer/GPU textures.

- Corrected sky-only comparisons: mean RGB byte error approximately 0.024, maximum 1/255 for either camera, with no channels differing by more than 2/255. Saved images were inspected and contain visible sky.
- Sky plus PBR: mean error 0.065–0.091 byte levels; approximately 0.16–0.26% of RGB channels differ by more than 2 levels, maximum 72. Native-canvas AA and single-sample composer edges differ; this is not a pixel-identical full-scene acceptance claim.
- Inverse projection and inverse view uniforms matched each synthetic eye camera. These are sequential asymmetric-camera checks, **not real WebXR stereo validation**.
- Full copied-scene native smoke reached ready state with patched sky output, ACES mode, exposure 1.4, no captured runtime exceptions, no failed served resources, no lost context and `gl.getError()=0`. It ran outside XR; no Quest FPS claim is made.

Evidence: `result.json`, the paired PNGs, `native-smoke-result.json`, `lab.js`, `native-client.js`, `run-lab.mjs`, and `run-native-smoke.mjs`. The bounded test runners close their own Chrome process and HTTP server. `serve-lab.mjs` prepares separate `?labMode=reference` and `?labMode=native` clients on localhost port 5837 for the subsequent headset check; it has not been started for Quest. Inspect existing ADB reverse mappings before adding one, then remove only the mapping created for this test and stop the server afterward.

The published Quest tab remains unchanged. Pending: enter the separate client, verify native target/pass behavior and both-eye camera uniforms, inspect sky/color/transparency/head-motion stability, then measure matched stationary reference/native/reference runs. Keep this experimental until both visual and timing evidence exist; the local color check does not prove that native foveation or MSAA produces usable performance or acceptable shimmering.

### Quest native-client attempt: rejected, browser recovery required

The isolated server was started on port 5837 and a new ADB reverse mapping was added after verifying none existed. The localhost native client was opened separately from published tab 151. Initial XR entry failed while the device reported Asleep and the tab was hidden. A reversible reference/native switch was prepared and passed a local native/reference/native smoke check, preserving atmosphere resources with no captured WebGL error.

Meta documents unattended testing with `com.oculus.vrpowermanager.prox_close` and restoration with `com.oculus.vrpowermanager.automation_disable` in its [Quest testing guidance](https://developers.meta.com/horizon/documentation/unity/meta-xr-operator/quest/). The temporary override woke the device. However, the user then reported that Quest Browser was frozen and could not open or close tabs. No valid native-path XR benchmark or visual acceptance was obtained. Reject this attempt; neither the cause of the browser trouble nor any native-path performance benefit is established.

Recovery closed the localhost test tab through CDP, terminated the pending entry attempt, stopped the local server and removed only the newly created reverse mapping. Both pre-existing forwards were retained. The original page responded to JavaScript but a short animation-loop check returned no frames; because the device also returned to sleep when the override was removed, that check does not independently prove a GPU hang. Quest Browser was force-stopped and the published scene reopened without clearing browser data. This experiment must not be resumed until browser recovery and resource/session stability have been verified. No plugin runtime changes were retained.

Recovery verification was subsequently blocked by a foreground `com.oculus.guardian/...GuardianDialogActivity`; no DevTools socket was exposed after the restart. Opening the published URL was requested, but successful page recovery is **not yet verified**. The temporary proximity override was released with `automation_disable`, and the user was asked to dismiss the Guardian prompt. No boundary settings were disabled or changed.

### Recovered Quest session: native-path diagnostics, not production acceptance

Browser responsiveness was subsequently verified. A Guardian prompt reported that the headset could not detect positional movement; its observed **Continue without tracking** button was selected. No boundary-disable setting or travel mode was enabled. All successful XR samples below reported `XRViewerPose.emulatedPosition=true`: these are stationary rendering diagnostics, not normal 6DoF locomotion or head-motion acceptance.

The isolated client replaced the published scene in the existing scene tab to avoid two heavy scenes running together. Entry instrumentation identified an unresolved browser permission prompt for localhost immersive experiences. Selecting **Allow** through the observed browser UI completed entry. The earlier generic A-Frame request error and pending request do not establish a renderer/MSAA defect. Failed CDP permission-descriptor attempts changed no permission; the actual browser UI grant is specific to the temporary localhost origin.

Verified native frame anatomy: 2880 x 1584 XR framebuffer, 1440 x 1584 per eye, 4 actual GL samples and one sample buffer. All 292 recorded draws (4,585,266 submitted triangles across stereo) targeted the XR framebuffer, with no intermediate render-target changes inside the scene render. Both sky inverse-projection and inverse-view matrices matched their respective eye camera. No legacy direct calibration hook was active. The candidate preserves quality float Takram lookup resources, PBR material classes, exposure and resolution; the existing native AA configuration was never changed.

Each condition below uses 3 seconds settling and 8 seconds sampling in a reference/change/restored sequence. Raw records retain per-frame pose, visibility, authored-world matrix, program/geometry counts, and slow frames. Intervals are application XR callback timings, not isolated GPU durations. Runs stayed visible and stationary; within-window angular motion stayed below 0.07 degrees. Thermal status was 0 when inspected.

| Diagnostic | Before mean | Changed mean | Restored mean | Changed p95 |
| --- | ---: | ---: | ---: | ---: |
| Composer vs native, sky first | 59.80 ms | 55.80 ms | 59.72 ms | 59.06 ms |
| Native sky first vs after opaque geometry | 55.66 ms | 52.51 ms | 55.45 ms | 56.23 ms |
| Composer sky first vs after opaque geometry | 59.98 ms | 60.25 ms | 60.15 ms | 65.36 ms |
| Composer vs native with sky after opaque geometry | 60.30 ms | 52.28 ms | 59.79 ms | 55.44 ms |
| Native foveation 0.5 vs 1.0 | 55.44 ms | 54.31 ms | 56.35 ms | 57.74 ms |

Foveation was restored to 0.5. Its small gain does not justify a peripheral-quality change; no foveation default is proposed. Late sky ordering uses the existing far-plane depth-tested, non-depth-writing sky shader. Its apparent native-path saving did **not** reproduce under the composer, so changing production sky order alone is unsupported.

Screenshot review revealed that these first sequences retained the copied scene's CEFR welcome panel. It was present in all conditions, making them matched but unrepresentative of normal exploration. The local welcome flow was then completed using the test name `Performance audit` and A1; the lab server rejects non-GET requests and no production profile/scene write was performed. The first unobstructed sequence was 59.04 / 52.18 / 59.77 ms, but shader program count rose from 62 to 65 during the candidate. A further warm repeat was required and is reported below.

Captured reference/native screenshots show consistent broad sky/temple colors and stereo presentation. They do not prove transparency equivalence, fine-edge stability during motion, or subjective visual acceptance. Welcome-panel captures obscure much of the scene. No candidate is approved for production and no runtime source/bundle changes were made.

Evidence in `quest-native-lab`: `trace-entry.json`, `entry-status.json`, `native-anatomy.json`, `native-aba.json`, `sky-order-aba.json`, `reference-sky-order-aba.json`, `combined-aba.json`, `foveation-aba.json`, `unobstructed-aba.json`, `unobstructed-repeat.json`, `quest-reference.png`, and `quest-native.png`. These scripts are external, reversible diagnostic harnesses, not plugin implementations.

The fully warmed unobstructed repeat retained 65 shader programs and 95 geometries throughout:

| Condition | Mean | p95 | p99 | Maximum |
| --- | ---: | ---: | ---: | ---: |
| Original composer | 58.97 ms | 62.36 ms | 66.28 ms | 66.50 ms |
| Native target, sky after opaque geometry | 52.17 ms | 57.97 ms | 64.86 ms | 65.26 ms |
| Restored composer | 59.82 ms | 65.22 ms | 66.65 ms | 67.24 ms |

This supports roughly 6.8–7.6 ms lower mean interval (13–15% greater reciprocal-mean FPS), around 19.2 FPS rather than 16.7–17.0 FPS. It remains far from usable VR, with substantial slow frames. The remaining ~52 ms cannot be assigned to specific GPU passes from these data. Do not describe the result as a solved bottleneck, verified shimmer reduction, or a production-ready optimization. A full motion/6DoF and transparent-material visual review is still missing, as is a matched earlier-runtime comparison. Next prioritize attributing visible GLB/PBR/transparent draw costs and redundant work at recorded dense viewpoints, rather than increasing resolution or sacrificing material quality.

Cleanup: exited the isolated XR session and navigated the same tab back to the published URL; the local server ended via its watchdog. Removed only the new port-5837 reverse mapping and released the proximity override with `automation_disable`. Existing forwards were preserved. `stay_on_while_plugged_in=15` and `screen_off_timeout=86400000` were inspected and never changed. Positional tracking recovery was not established; the diagnostic's emulated tracking must remain explicit. No plugin runtime changes, commits or pushes were made.

### User-accepted baseline implementation — 2026-09-17

The user inspected the isolated native/later-sky version on the headset, reported that it looked the same and felt more fluid, and explicitly requested it become the baseline. This is visual acceptance of that scene/view, not a claim of 72 Hz, elimination of shimmer in every view, or universal night/transparency validation.

The repository now routes eligible immersive headset scene draws directly through the host renderer. It preserves the existing native layer AA rather than requesting a different sample count, applies ACES/sRGB to raw Takram output, draws sky after opaque geometry, and places Takram opaque stars after that sky with matching output conversion. Late-loaded unlit mesh opt-ins, exit/removal restoration, exception cleanup, and native/composer output switching are covered by acceptance tests. Atmosphere quality/LUT policy is unchanged from the accepted scene. Desktop and PCVR retain their rendering paths. Reference force-stereo debug flags remain available for developer diagnostics.

VR Headset Full compilation now enforces High renderer quality, quality Takram resources, ACES Filmic, PMNDRS AA `none`, scale 1.0 and foveation 0.5 for every scene, including conflicting saved metadata. Native renderer AA cannot be disabled by saved renderer metadata. The headset Stereo Post-FX checkbox and tone-mapping dropdown were removed; renderer quality is locked. Object quality, sky time and exposure remain authoring choices. The retained stereo contract flag initializes the full integration and must not be interpreted as proof that a composer actually executes; use `postProcessing.nativeHeadset` and owner `native-headset`.

Device integration check with repository bundles and no experimental override: visible XR, quality float atmosphere, patched output, no lost context, and all captured scene draws directly to the 2880 x 1584 native 4-sample target. Both eye sky matrices matched. A moving-view sample ranged substantially in submitted geometry; its ~28 ms mean interval is **not** accepted as an improvement over the earlier fixed-view ~52 ms result. The device disconnected again before the final star-hook refinement could receive a fresh Quest check.

The final isolated Chrome smoke exercised repository native/composer/native transitions and actual Takram sky/star shaders: no captured runtime errors, no resource failures, GL error 0, no lost context, and the expected native diagnostics changing true/false/true. This caught and fixed an intermediate hook that incorrectly expected an unresolved MRT include. These local checks simulate presentation eligibility; they are not headset timing or motion validation. Artifacts: `baseline-entry.json`, `repository-anatomy.json`, `repository-submission.json`, `repository-smoke-result.json`, `repository-stars-smoke-result.json` in the external lab directory.

Validation: 52 runtime tests passed; native presentation acceptance, compiler plan/locked-AA acceptance, syntax, generated build configuration, catalog, and diff checks passed. Lint has 0 errors and 253 existing warnings. One full run hit a timing-sensitive assessment test that passed independently and on subsequent complete runtime runs. The PHP ZIP extension was enabled only through a temporary test-process configuration; related compiler tests then passed. The full compiler suite subsequently stopped at optimizer-progress because the external KTX executable is unavailable. No optimizer code was changed to work around that prerequisite.

Runtime bundles were regenerated. Local test servers ended and isolated Chrome runners closed their own processes. The disconnected headset left no ADB forwards listed at final inspection; no persistent wake/timeout setting was changed during implementation. Deployment and recompilation of published scenes remain necessary. No commits or pushes were made.

### Walking frame pacing follow-up — 2026-09-17

The deployed native-headset build was measured in a visible Quest 2 XR session at the published project 1098 / scene 1099 URL. A 20-second walking capture collected 669 frames with the runtime's bounded per-frame probe. Mean frame interval was 29.9 ms, p50 30.1 ms, p95 45.5 ms. The viewpoint moved through workloads from 0.45 to 4.59 million submitted stereo triangles and roughly 100 to 300 draw calls. Frame interval and submitted triangle count correlated strongly across this path (Pearson r = 0.924). Sparse one-second windows averaged about 16–24 ms; dense windows averaged about 38–45 ms. This is a path-level association, not a GPU pass timing or a claim that triangle count alone causes every slow frame.

Walking work remained small relative to the interval: movement apply mean 1.21 ms (p95 2.2 ms), authored-world transform mean 0.56 ms (p95 1.0 ms), and collision refresh mean 0.024 ms (p95 0.1 ms). A separate 20-second held-view capture recorded 476 frames at the dense viewpoint, with a mean interval of 42.1 ms (about 23.8 FPS), p95 47.0 ms, near-constant 252 draw calls and 3.96 million submitted triangles. Its one-second means stayed mostly within 41–43 ms. Neither capture showed a recurring one-second render task. The FPS swing while walking follows changing visible scene cost; the held dense view is consistently slow.

The shadow diagnostic update count stayed at 29 during both runs. Walking raised some `immersive-input-settle` dirty requests without refreshing a map. A follow-up runtime guard prevents standalone headset thumbstick release from requesting those redundant refreshes; entry and scene/model changes retain their refresh paths. This enforces the fixed-sun locomotion policy but is not presented as a material FPS improvement. At one dense stationary view, read-only stereo frustum inspection attributed about 0.97 million submitted triangles to the protected walkable temple GLB and 0.67 million to the arch/door GLB. These are the strongest local candidates for separate visual geometry and collision work; their silhouette and navigation behavior need validation before replacing assets.

An initial unattended mesh A/B trial aborted before hiding any asset when XR frames stopped. The Quest was asleep; the documented temporary proximity override woke it, but a foreground Guardian “Finding position in room” prompt kept the XR session hidden. Android tap and Enter input did not dismiss that VR dialog. The override was released. After the user cleared Guardian, a second, visible XR baseline/change/restored-baseline trial completed at a held view with no virtual navigation movement and under 3.1 degrees of head rotation per window:

| Condition | Mean interval | p95 | Draw calls | Submitted stereo triangles |
| --- | ---: | ---: | ---: | ---: |
| Baseline 1 | 36.07 ms | 38.7 ms | 149 | 2.35 M |
| Arch hidden | 36.47 ms | 39.9 ms | 151 | 2.36 M |
| Baseline 2 | 35.88 ms | 38.8 ms | 150 | 2.36 M |
| Walkable temple hidden | 28.58 ms | 31.5 ms | 84 | 1.74 M |
| Baseline 3 | 36.07 ms | 38.2 ms | 150 | 2.36 M |

The arch was outside this view, so its hide trial does not assess views where it is visible. The temple removal saved roughly 7.3–7.5 ms here, but removing a walkable landmark is only a diagnostic, not a production option. Its collision/navigation geometry must remain intact while any cheaper visual representation is developed and checked in both eyes. All entity visibility values were restored, and a headset screenshot confirmed the temple visible again. The shadow update count remained 29 throughout. No published asset changed. Raw captures are under `C:\Users\tasos\.codex\visualizations\2026\09\17\01a0ae0b-6d95-71c3-8203-feb16e67cc30\` (`quest-walking-frames.json`, `quest-still-frames.json`, `quest-mesh-aba.json`, `quest-restored.png`, and sampled state files).
