# Quest 2: Music Store and Barcelona rendering investigation

Measured on 23 October 2026 using the published headset clients from `vrodos.iti.gr`.

## Findings

The two scenes have different dominant costs. Music Store is limited by its 17 embedded point lights shading PBR materials. Barcelona submits substantially more geometry and draw calls than the working control. Neither result indicates a failure to select the headset profile.

No new immersive VR session was used for this investigation. These are **inline Quest Browser measurements**, not demonstrated immersive frame rates or proof that a headset crash is fixed.

## Measurement conditions

- Physical Quest 2, Adreno 650, Quest Browser `149.1.0.10.52.1018773393`.
- Published `Master_Client_{scene_id}_headset.html` clients, `vrRuntimeProfile=headset`.
- Same 1280 × 670 CSS window, 1600 × 837 drawing buffer, pixel ratio 1.25.
- FPS meter disabled. Inline PMNDRS presentation remains active; native immersive presentation was not entered.
- Each temporary isolation stage ran for 2.7 seconds, discarding its first 650 ms before frame sampling. Baseline settings were restored between stages and at completion; the host then force-stopped the browser and removed its ADB forward.
- Measurements wrap the outer renderer call, including nested composer rendering. Renderer counters are reset once per outer call with automatic resets temporarily disabled, so they include the frame's rendering passes.
- FPS comes from observed render callback timestamps. `EXT_disjoint_timer_query_webgl2` was unavailable, so **no direct GPU duration was measured**. Short stages and shader compilation can affect results; baseline/restored-baseline agreement and large changes are more informative than small differences.

## Runtime comparison

| Published scene | Baseline inline FPS | Restored baseline FPS | Calls/frame | Triangles/frame | Embedded punctual lights |
| --- | ---: | ---: | ---: | ---: | ---: |
| Music Store, scene 7707 | 9.8 | 9.8 | 134 | 500,940 | 17 |
| Barcelona, scene 7623 | 13.2 | 16.8 | 703 | 7,411,694 | 0 |
| Catalan Gastronomy, scene 6801, working control | 63.2 | 63.7 | 54 | 1,563,157 | 0 |

All three had HDR reflections, static medium-quality shadows, the atmosphere enabled, and **zero active material transmission**. The control uses the current core bundle version also referenced by Music Store and Barcelona.

## Music Store: lighting cost

| Temporary change | Inline FPS |
| --- | ---: |
| Baseline | 9.8 |
| Hide 17 embedded point/spot lights | 57.9 |
| Remove model/scene environment reflections | 11.6 |
| Disable renderer shadows | 10.8 |
| Hide sky | 10.0 |
| Replace model materials with textured unlit materials | 83.6 |
| Hide models | 89.7 |
| Restore baseline | 9.8 |

The light-only change keeps the same 134 calls and 500,940 triangles. Its approximately sixfold improvement isolates the principal cost to lit-material shading rather than geometry or a transmission render pass.

The GLB contains 17 point lights with no authored finite range. Three's forward PBR fragment shader iterates the active point-light array for each lit surface (`node_modules/three/src/renderers/shaders/ShaderChunk/lights_fragment_begin.glsl.js`). These lights do not need to cast shadows to incur lighting work. The earlier short immersive light test did not produce a reported visible improvement; this new result specifically establishes their cost in inline presentation, not an immersive fix.

The headset glass approximation is applied: transmission is zero. Reflections sample a static HDR environment; live scene-probe and sky-environment captures are inactive. Removing reflections, shadows or sky alone produces no improvement comparable to removing the embedded lights.

**Remediation direction:** preserve the bright authored appearance with baked lighting, plus a small measured headset-only dynamic light budget where necessary. Simply removing the lights would change the appearance. Reducing geometry alone does not address this dominant cost. Desktop lighting can retain the authored setup.

## Barcelona: geometry and submission cost

| Temporary change | Inline FPS |
| --- | ---: |
| Baseline | 13.2 |
| Hide embedded point/spot lights (none present) | 16.4 |
| Remove environment reflections | 19.7 |
| Disable renderer shadows | 18.4 |
| Hide sky | 17.5 |
| Replace model materials with textured unlit materials | 25.0 |
| Hide models | 89.7 |
| Restore baseline | 16.8 |

Small differences must be interpreted against the baseline's warmup drift. The important result is that even unlit materials retain the same 703 calls and 7.41 million submitted triangles, and reach only about 25 FPS. Model removal restores approximately 90 FPS. Lit-material complexity contributes, but there is a major geometry/submission workload even without it.

The measured median CPU time inside the outer render call is about 27 ms at restored baseline, compared with about 3.4 ms for the working control. Consequently Barcelona is not exclusively a GPU problem: CPU draw submission is also over budget.

The two large published assets are:

- Barcelona city, asset **7618**: **5,081,869 triangles**, nine mesh primitives, classified as walkable terrain.
- Park Güell, asset **8353**: **2,328,746 triangles**, **678 mesh primitives**, classified as a walkable building with authored PBR materials.

Together they contain 7,410,615 triangles, accounting for essentially the entire measured 7,411,694-triangle frame. This identifies the responsible asset pair; a successful separate timed isolation of each asset was not obtained. Asset inventory also includes a 652,483-triangle animated asset, but it is not responsible for the measured starting-frame total.

The current compiler deliberately protects walkable/collision mesh geometry (`VRodos_Compiler_Entity_Policy::requires_protected_geometry()`). Therefore Low headset object quality caps these assets' textures at 1024 px but does not simplify their protected navigation geometry. Recompiling with Low does not make these two environment meshes lightweight.

**Remediation direction:** create reduced headset visual meshes, batch/spatially partition the environment appropriately, and keep separate collision/navigation geometry. Preserve walkable support and openings rather than simplifying the existing protected mesh indiscriminately. Lower texture caps or removing sky alone does not resolve this submitted workload.

## Other published asset inventories

These totals count triangle/mesh placements inside each distinct referenced GLB. They are asset inventories, **not per-frame measurements**, and exclude scene-specific repetition of the same GLB.

| Scene | Referenced GLB triangles | Mesh primitives | Embedded punctual lights |
| --- | ---: | ---: | ---: |
| Music Store | 518,126 | 155 | 17 |
| Barcelona | 8,197,106 | 721 | 0 |
| Catalan Gastronomy | 1,563,636 | 33 | 0 |
| Athens — The Acropolis | 2,290,989 | 111 | 0 |
| Thessaloniki — The White Tower | 1,904,379 | 582 | 0 |
| Catalonia Map | 277,740 | 104 | 0 |
| Dalí — Persistence of Memory | 120,775 | 58 | 0 |
| Scene 6257 | 251,342 | 6 | 0 |

The other scenes share the major headset rendering features. They do not share Music Store's 17 embedded lights, and their inventories are substantially smaller than Barcelona's. Gastronomy also demonstrates that physical materials, reflections and shadows can remain enabled without reproducing Music Store's slowdown.

## Evidence

Machine-local diagnostic artifacts are under:

`C:/Users/tasos/.codex/visualizations/2026/10/23/01a167b1-4bbb-7b72-a0d1-005ceff3b71a/`

- `inline-gpu-7707.json`: Music Store isolation, complete samples and runtime settings.
- `inline-gpu-7623-full-isolation.json`: Barcelona isolation, complete samples and runtime settings.
- `inline-gpu-6801.json`: working Gastronomy control.
- `gpu-asset-comparison.json`: refreshed published GLB inventories and entity classifications.
- `quest-short-test-summary.json` and `quest-short-test-logcat.txt`: the earlier, separately authorized short immersive capture. They are not the measurements used for the inline comparison table.

Some subsequent debugger reconnections failed; no results are inferred from those attempts. No production assets or runtime behavior were changed by this investigation.
