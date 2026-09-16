# Quest 2 Acropolis performance audit

Date: 2026-09-16. Status: initial measured audit; no production optimization or device acceptance claimed.

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
