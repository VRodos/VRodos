# Quest 2 selection stalls — 16 September 2026

The position-dependent stalls were caused by unaccelerated selection raycasts against detailed GLB meshes. Both the desktop mouse cursor and the Quest controller raycasters were implicated. Navigation already used source-bounds box colliders for decorations; those boxes do not accelerate selection of the visible model.

The fix adds `vrodos-selection-bvh`, a scene system that prepares the existing three-mesh-bvh library's acceleration trees for static selectable GLB meshes with at least 2,000 triangles. It preserves exact surface hits, geometry index order, face IDs, material groups, and visual quality. Trees are prepared on model load, shared by geometry, and released by their owner. Skinned, morphed, and instanced meshes are excluded from static-tree preparation. CEFR-hidden models retain eligibility. The compiler includes the BVH vendor for interactive content even when walking collision is disabled.

No asset-quality, collider, renderer, stereo-composer, shadow, reflection, atmosphere, or controller-ray changes are part of the fix. The mouse cursor remains configured as before; its detailed-model queries benefit from the same acceleration.

## Device and measurement method

- Connected through the existing ADB installation; discovered the actual device, `/proc/net/unix` DevTools socket, and browser targets. Allocated a new ADB forward, without replacing the two existing forwards.
- Attached to Quest Browser's `Scene 2` tab at `https://vrodos.iti.gr/wp-content/uploads/vrodos/published/projects/2311/clients/Master_Client_2327.html`. No desktop browser was used as headset evidence.
- Quest 2; OculusBrowser 150.1.0.24.52; active immersive session requested 90 Hz. XR framebuffer: 2880 × 1584, two 1440 × 1584 viewports; foveation 0.5.
- FPS meter disabled. Active stereo composer passes were RenderPass, ToneMappingEffect, and SMAAEffect. Authored bloom was not active in the immersive stereo chain. Clouds were disabled; atmosphere sky and lights remained active.
- Eight-second XR-session `requestAnimationFrame` captures recorded frame timestamps, callback times, head/world transforms, viewports, and render calls/triangles accumulated across renderer-info resets. Separate CDP CPU/timeline traces and bounded mesh-raycast timing probes identified CPU work. Traced and instrumented captures include measurement overhead.
- Native browser-process VrApi logs supplied submitted FPS, stale-frame counts, and device GPU utilization. There was no WebGL disjoint timer-query extension; JavaScript durations are **not GPU timings**. Native GPU utilization is not per-pass timing.

## Findings

During the worn-headset head-turn capture, mean XR frame interval was 48.84 ms, p95 143.33 ms, and maximum 214.80 ms. The scene also moved during that capture. CPU samples prominently identified `checkIntersections → intersectObjects → acceleratedRaycast → native Mesh.raycast → triangle intersections`: the global accelerated entry point was installed for collision, but the selectable geometry had no trees and therefore used the native triangle scan.

The desktop `#cursor` ray remained fixed at origin `[12.7123, -5.0747, -11.4080]` and direction `[-0.6604, 0.3692, -0.6539]`. It did not follow head orientation. The immersive navigation transform moved authored geometry relative to this ray, explaining a position-dependent cost without deliberate controller pointing.

In an eight-second diagnostic, that cursor spent approximately 6.5 seconds across four Pandero meshes. `Cylinder003` alone has 92,160 triangles and consumed 4,430.7 ms over 99 calls, with a 71 ms maximum. With only the cursor disabled, both controllers independently produced roughly 46 ms single-mesh spikes on `Cylinder003`. The sun-occlusion probe was inexpensive in the same capture (1.9 ms total across 24 calls on the room mesh). Neighboring instrument meshes were included in the probe; this was not a Pandero-only search.

The user then reproduced stalls while pointing controllers at the guitar. The first subsequent live guitar probe missed the slow moment. A later controlled same-ray test on the loaded guitar confirmed a large improvement from the fix, and the user reported **“NOW ITS SMOOTH”** with temporary selection acceleration active and the original rays/effects retained.

| Capture | Mean XR interval | p95 | Mean calls / triangles per sampled interval |
| --- | ---: | ---: | ---: |
| Worn headset, initial bad view | 27.34 ms | 42.05 ms | 124 / 669,063 |
| Worn headset, head turns and navigation, CPU tracing | 48.84 ms | 143.33 ms | 132 / 678,107 |
| Controller held toward model, original selection | 79.98 ms | 87.98 ms | 48 / 366,148 |
| Same virtual position, selection rays disabled | 19.19 ms | 22.03 ms | 44 / 345,737 |
| Selectable BVHs active, original rays/effects | 18.98 ms | 22.84 ms | 94 / 279,741 |

The last three captures are **not an exact matched-pose FPS comparison**: virtual position was unchanged for the original/no-rays pair, but head orientation changed; the accelerated capture used another location/view. Native logs during the severe held-model stall showed about 7–15 submitted FPS and frequent stale frames. Once the accelerated capture settled, native logs showed approximately 50–55 FPS. These observations establish missed whole frames; they do not independently rule out every possible stereo-image defect.

For deterministic selection validation, fixed synthetic rays were evaluated against unchanged live model transforms, alternating the same geometry between original and accelerated queries within one synchronous evaluation. Four surface-hit samples per configuration produced:

| Model | Original query samples | Accelerated query samples | Hit equivalence |
| --- | --- | --- | --- |
| Guitar | 104.4, 97.5, 20.6, 57.0 ms | 0.3, 0.3, 0.2, 0.3 ms | Same six mesh/face hits and distances |
| Frame drum / Pandero | 103.8, 188.1, 39.1, 121.2 ms | 0.2, 0.0, 0.1, 0.1 ms | Same six mesh/face hits and distances |

These are browser CPU microbenchmarks on the Quest, not immersive-frame or GPU benchmarks. Zero denotes below the exposed timer resolution. The headset was no longer actively visible in XR by the final verification attempt; no late full-frame capture was accepted in that state.

## A/B controls and limitations

Selection-ray disabling, Pandero visual-only hiding, stereo-composer bypass, and an additional SMAA-only experiment were each restored before the next variable. Pandero's collider stayed present when its visual root was hidden. The stereo bypass used `vrHeadsetStereoPostFxEnabled=0` and verified composer ineligibility, rather than replacing the renderer manually.

Early captures were subsequently identified as headset-down measurements and are excluded from the worn-headset result table. They showed sustained stereo-composer cost: roughly 27–28 ms mean intervals versus 11.15 ms with the supported bypass, returning to 26.66 ms when restored. Turning the virtual view 180 degrees did not establish a clean good/bad pair. These observations cannot be presented as validation of the user's original visual symptom.

The investigation changed course after the worn-headset trace established selection stalls. Separate shadow, reflection, and atmosphere disabling was not needed to justify this fix and was not performed. The full same-head-pose, different-position, stationary/moving acceptance matrix remains incomplete because the user needed to remove the headset to read/respond. No locked-90-FPS claim is made. Stereo processing and scene rendering still consume a substantial frame budget independently of the fixed raycasting spikes.

Temporary tree preparation built 24 trees covering 325,913 triangles in about 318 ms. Production preparation happens on model load; very large newly loaded models can still incur a one-time build cost. Animated/deformed geometry is intentionally not covered by this static optimization.

## Verification and rollout

- Runtime bundle regenerated from source; only the intended A-Frame bundle and manifest changed among generated outputs.
- All 49 runtime regression scripts passed, including new real-geometry selection fixtures for exact hits, empty-space misses, unchanged indices, shared trees, deformation exclusions, and ownership cleanup.
- Relevant compiler planner, DOM-transformer, and compile-policy tests passed. Planner fixtures cover interactive scenes with collision disabled and keep the BVH vendor lazy for noninteractive fly scenes.
- All 34 other compiler scripts passed. The existing `test-optimizer-progress.mjs:97` fails because it expects prepared metadata schema 2 while the unchanged optimizer produces 4. The full `check:runtime` command therefore does not pass end-to-end.
- PHP syntax, JavaScript syntax, build configuration, and diff whitespace checks passed. ESLint reported no errors and 252 existing warnings. Local PHP ZIP loading and access to installed KTX executables were needed to run the broader suite; no host configuration was persisted.
- The source system was injected only into the live browser session for validation. Production files and published HTML were not edited. The session-only fix lasts until that page is reloaded; it is not deployment.

Deploy the changed plugin source, `assets/runtime-build-manifest.json`, and `assets/js/runtime/master/lib/vrodos-runtime-aframe-components.bundle.js`. Recompile project 2311 / scene 2327, then reload the Quest page so it receives the versioned runtime and current chunk plan. No asset regeneration is necessary. Repeat controller pointing and head-turn checks at the guitar and frame drum after deployment.

Raw local evidence and temporary capture helpers are in `.cache/quest-profile/` (git-ignored), including `worn-head-turns.json`, `worn-ray-targets.json`, `worn-cursor-off-ray-targets.json`, `selectable-bvh-live.json`, `fixed-surface-ray-benchmark.json`, and the corresponding native `.log` files. No commit or push was made.
