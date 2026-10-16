# Ambient occlusion modernization — 2026-10-16

## Outcome

Desktop PMNDRS rendering now uses the locked Three r185 GTAO addon. Existing `off/soft/balanced/strong` controls remain the authoring contract. Composer MSAA remains enabled with AO; SMAA runs only when selected. No N8AO production dependency or algorithm selector was added.

The geometry prepass produces matching full-resolution normals and float depth. GTAO reuses that pass (including cloud-owned normals), computes/denoises AO at the preset's resolution, and composites with depth/normal-aware upsampling and rejection across silhouette depth breaks. The geometry inputs do not come from resolved MSAA beauty depth. Beauty output stays HDR and full resolution; AO precedes atmosphere and tone mapping.

This is screen-space AO: offscreen occluders and hidden geometry remain unavailable. Silhouette rejection deliberately trades a narrow band of AO for stable mixed-coverage edges. Transparent/cutout surfaces remain an approximation and require broader scene review; this is not ray-traced visibility.

## Comparison and evidence

Machine: Windows, NVIDIA RTX 2060 through ANGLE/D3D11; Edge headless; shared A-Frame/Three r185 instance; PMNDRS 6.39.5; temporary N8AO 2.0.1. Ultra requested 16 samples and the composer applied 8. No development server was started: the existing local HTTP server served the publications.

Project 13774 / scene 13775 was loaded to completion. For algorithm isolation, the A-Frame animation loop was paused, dynamic atmospheric composition was removed, and the scene/camera/lighting were held fixed. All candidates used a half-float composer and a separate final AgX pass. Normal/depth and AO-only buffers were inspected alongside combined output. A second fixture used a floor, wall, boxes, sphere, and thin rails. It isolates contact shading and high-contrast silhouettes without authored texture detail.

Each timed configuration used 45 warm-up renders followed by 120 samples. The following are **median GPU milliseconds for the whole isolated composer**, not AO-only cost, FPS, or full-scene timings. GPU queries used `EXT_disjoint_timer_query_webgl2`; disjoint results were discarded.

| Isolated scene configuration, 8x MSAA | 1920x1080 | 2560x1440 |
|---|---:|---:|
| AO off | 3.86 | 6.47 |
| PMNDRS SSAO, half-resolution AO/full-resolution normals | 5.05 | 8.48 |
| Stock Three GTAO, half-resolution geometry/AO | 5.69 | 9.63 |
| N8AO Medium, half-resolution/depth-aware upsampling | 5.32 | 9.07 |
| Selected GTAO, full-resolution geometry/half-resolution AO and protected edges | 5.32 | 9.00 |

A final integrated capture at an actual 2400x1350 buffer produced these median GPU stage timings (99 samples): beauty 4.37 ms; geometry prepass including the preceding MSAA resolve 0.26 ms (p95 1.77 ms); GTAO plus denoise 0.63 ms; AO composite 1.00 ms; shared composer depth copy 0.09 ms. These stages exclude atmospheric processing and do not sum to a complete frame budget. AO-only, normal, and linearized-depth debug captures were inspected; the sky remained unoccluded. A live look-controls yaw change and restoration completed without captured errors.

The selected pass's incremental GPU cost was approximately 1.45 ms at 1080p and 2.54 ms at 1440p. In the simple fixture, selected GTAO measured 2.04/3.67 ms versus N8AO's 2.13/3.78 ms total. GTAO was selected for comparable cost, contact detail, and upstream maintenance without a new runtime dependency. These are directional comparisons, not claims that the algorithms' artistic parameters are numerically equivalent.

The remote/headless session's rAF median remained approximately 32.5 ms even with AO off and sub-millisecond fixture GPU work. An uncapped-rAF trial submitted work faster than GPU query completion and was discarded. **60 FPS across broad desktop hardware is not established.** The original full scene, with clouds, rendered to 2400x1350 from a 1920x1080 viewport; its initial median frame interval was 32.7 ms. Lower-end laptop GPU testing and whole-scene frame-budget acceptance remain outstanding.

Integrated QA exercised projects 13774/13775 and 12596/12597: all AO presets, MSAA Ultra, repeated on/off cycles, and resizing. Both reported applied MSAA 8, inactive SMAA, correct full-resolution geometry/reduced-resolution AO dimensions, and no captured page/console errors or WebGL errors. AO-off/on texture counts were stable across repeat cycles (61/66 and 55/60 respectively with the scenes' other effects present). Both projects were recompiled through the compiler API using their existing owner permissions and saved settings. No authoring settings were saved by browser trials.

Raw JSON, screenshots, and temporary candidate harnesses were captured outside the repository under the task's `vrodos-ao-lab` output directory. Production profiling can be repeated with `scripts/profile-master-client.mjs --url URL --viewport 1920x1080 --dpr 1 --disable-fps-meter --output PATH --screenshot PATH`; inspect the reported actual drawing buffer rather than assuming viewport size equals render resolution.

## Standalone headset assessment

| Method | Current standalone recommendation |
|---|---|
| Baked material AO | Production path. Native MSAA remains intact; no extra screen-space passes. Asset crevices are baked; contacts between independently placed assets are not generated. |
| PMNDRS SSAO | Developer research only; needs correct per-eye depth/projection and stereo composition. |
| GTAO | Developer research only. Independent per-eye geometry/AO targets and asymmetric sizes/camera changes have CPU resource tests; immersive rendering and timing are unvalidated. |
| N8AO | Developer research only. Its desktop adapter does not establish correct WebXR integration; temporal accumulation must not mix eyes. |
| RTAO | No production implementation planned for this standalone WebGL stack. Scene tracing, acceleration structure updates, and denoising would be a separate rendering project. |

No headset was attached (`adb devices` returned none). No headset GPU timing, refresh-rate, both-eye visual, tracking/controller, or XR-handoff acceptance is claimed. Production immersive AO stays disabled; native headset AA, framebuffer scale, foveation, and spatial UI policies are unchanged. A headset trial must first establish a no-effect stereo-composer baseline, then test one AO backend with independent per-eye inputs/targets, matching viewports, and restoration on exit. Use the existing Quest diagnostic workflow; budget approximately 13.9 ms at 72 Hz or 11.1 ms at 90 Hz. Quest 2 is the conservative baseline; add Quest 3-class coverage when hardware is available.

Baked AO audit found that quality enhancement previously increased authored `aoMapIntensity`, including turning zero into one. That coupling was removed. Regression fixtures preserve zero/fractional/full AO strength, linear data treatment, UV-channel selection, and a shared packed ORM texture through preparation/pruning and a GLB round trip. The optimizer already classifies `occlusionTexture` as data for compression. No automatic baking, derivative-recipe change, or regeneration is needed for this runtime correction.

## Verification

- All 67 runtime regressions passed, including new AO resource, sizing, camera, and MSAA tests; targeted compiler script-planner and desktop-profile checks passed.
- The new pass has independent cleanup tests, including exception restoration and protection of cloud-shared textures and Three's shared fullscreen geometry.
- Full repository lint has pre-existing undefined `vrodosAssetSharing` globals in `assets/js/editor/ajax/share_asset.js`; changed runtime sources pass targeted lint.
- Running all compiler checks independently yielded 45 passes and one pre-existing failure: the `test-image-door-edit.php` stub lacking `VRodos_Shared_Repository_Manager::is_shared_asset()`. This is separate from AO; it is not a successful full-suite result.

## Upstream references

- [Three.js GTAOPass](https://threejs.org/docs/pages/GTAOPass.html)
- [PMNDRS antialiasing guidance](https://github.com/pmndrs/postprocessing/wiki/Antialiasing)
- [N8AO integration, quality modes, and limitations](https://github.com/N8python/n8ao)
- [Three.js material AO](https://threejs.org/docs/pages/MeshStandardMaterial.html)
- [Meta WebXR performance workflow](https://developers.meta.com/vr/documentation/web/webxr-perf-workflow/)
- [Meta mobile WebXR case study](https://developers.meta.com/vr/blog/project-flowerbed-a-webxr-case-study/)
