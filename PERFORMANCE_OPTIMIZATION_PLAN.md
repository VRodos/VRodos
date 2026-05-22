# VRodos Master Client Performance Implementation

## Summary

This plan preserves the current `high` visual profile and moves performance savings into profiling, diagnostics, shadow participation, and cheaper non-high profiles.

The first profiling pass on `http://wp.local:5832/Master_Client_766.html` showed a GPU/WebGL-bound frame budget in the current high profile:

- `renderQuality=high`, PMNDRS/Takram enabled, DPR about `1.35`, SMAA medium, LUT enabled, lens flare enabled.
- Warm rAF median was about `33.4ms`; p95 was about `50ms`.
- The loaded scene had about `203` visible meshes, `195` geometries, `81` materials, `58` textures, `21` shadow casters, and `178` shadow receivers.
- Two GLB resources dominated transfer size at roughly `61MB` and `35MB`.

## Phase Status

- Complete: repeatable CDP profiling, compile diagnostics, cheaper non-high quality gates, and shadow participation cleanup.
- Complete: debug-only Spector.js support in both the profiler and runtime URL mode.
- Complete: first Spector frame capture on `Master_Client_766.html`.
- Complete: clean profiler/Spector mode with temporary FPS-meter override.
- Complete: read-only GLB asset audit that correlates compile diagnostics with local GLB metadata.
- Complete: prototype cached optimized GLB derivatives for the top offenders with glTF Transform.
- Complete: decoder asset publishing and compiled-scene decoder config for Draco, Meshopt, and Basis/KTX2.
- Complete: compiled-scene Meshopt decoder smoke fix after discovering A-Frame requires a classic/browser-global decoder script.
- Complete: compiled-scene safe Draco derivative trial for the largest asphalt GLB through profiler resource interception.
- Complete: admin-side safe Draco derivative generation/storage and opt-in compiler selection.
- Complete: initial settings-level batch generation for missing safe Draco derivatives.
- Complete: automatic read-only GLB benefit analysis and recommendation-first Settings > Assets diagnostics table.
- Complete: VRodos dashboard Actionable Assets tab for top GLB optimization work.
- Complete: dashboard-side GLB optimization row actions and GLB-only filtering for dashboard/Settings asset tables.
- Complete: derivative cache cleanup when GLB asset posts are permanently deleted, including project-delete flows that delete their assets.
- Complete: Settings > Assets changed to a GLB diagnostics/reporting surface while per-asset actions live on the dashboard.
- Complete: dashboard Compile Use toggles for ready safe Draco derivatives, with validation before enabling compile substitution.
- Complete: AJAX dashboard refresh/toggle actions for cheap row updates without a full dashboard reload.
- Complete: desktop performance-profile render pixel budgeting and profiler reporting for renderer CSS size, drawing-buffer size, pixel ratio, and estimated render pixels.
- Complete: first admin refactor phase split the asset optimization manager into a thin hook coordinator plus focused files under `includes/asset-optimization/`.
- Complete: second admin refactor phase moved top-level dashboard rendering from `VRodos_Core_Manager` into `includes/admin/class-vrodos-admin-dashboard-page.php` while preserving the existing menu callback wrapper.
- Complete: third admin refactor phase split `VRodos_Asset_CPT_Manager` into a thin hook registrar plus focused files under `includes/asset-cpt/`.
- Next: add texture compression/KTX2 derivative generation for texture-heavy assets, then plan explicit LOD derivative families for distance-based scene cost reduction.

## Spector.js Debug Phase

Spector.js is used as a frame anatomy tool, not as a production timing source.

- Profiler capture:
  `node scripts/profile-master-client.mjs http://wp.local:5832/Master_Client_766.html --spector --spector-output C:\tmp\vrodos-master-client-spector.json`
- Manual runtime UI:
  `http://wp.local:5832/Master_Client_766.html?vrodos_spector=1`
- Normal compiled runtime URLs do not load Spector.js.
- The profiler runs rAF/trace timing first, then injects Spector.js and captures one WebGL frame so Spector instrumentation does not pollute timing numbers.

First Spector frame result:

- One captured frame: `1827` WebGL commands, `215` draw calls, `113` program switches, `35` framebuffer binds.
- Spector primitive analysis: about `2.61M` triangles in the captured frame.
- `14` draw calls each submit at least `100k` indices.
- No steady-frame texture uploads were captured; the dominant offender is render complexity, not texture upload churn.
- `fpsMeterEnabled=1` adds StatsGL GPU-query commands, so profiling comparisons should run with the FPS meter off unless measuring the meter itself.

Clean comparison command:

```bash
node scripts/profile-master-client.mjs http://wp.local:5832/Master_Client_766.html --disable-fps-meter --spector --output C:\tmp\vrodos-master-client-no-fps-spector-run.json --spector-output C:\tmp\vrodos-master-client-no-fps-spector.json
```

Desktop DPR/pixel-budget profiling:

```bash
node scripts/profile-master-client.mjs http://wp.local:5832/Master_Client_766.html --disable-fps-meter --viewport 3840x2160 --dpr 2 --output C:\tmp\vrodos-master-client-4k-dpr2.json
node scripts/profile-master-client.mjs "http://wp.local:5832/Master_Client_766.html?vrodos_dpr_pixel_budget=1650000" --disable-fps-meter --viewport 3840x2160 --dpr 2 --output C:\tmp\vrodos-master-client-4k-dpr2-budget.json
```

The runtime keeps `high` visually stable by default. The desktop pixel budget is applied automatically only to the `performance` render-quality profile and is skipped during immersive WebXR. The `vrodos_dpr_pixel_budget` query parameter is a profiling/debug override for desktop captures, useful when comparing high-quality fullscreen cost without changing scene metadata.

Clean Spector result with the FPS meter disabled:

- The profiler temporarily changed `scene-settings.fpsMeterEnabled` from `1` to `0` without persisting scene data.
- WebGL command count dropped from `1827` to `1667`; the StatsGL `getQueryParameter` noise disappeared.
- Real frame anatomy stayed high: `215` draw calls, `113` program switches, `35` framebuffer binds.
- Spector primitive analysis still reported about `2.61M` submitted triangles in one captured frame.

## Asset Audit Phase

The asset audit is read-only and does not rewrite uploads:

```bash
node scripts/audit-master-client-assets.mjs --profile C:\tmp\vrodos-master-client-no-fps-spector-run.json --output C:\tmp\vrodos-master-client-asset-audit.json --markdown C:\tmp\vrodos-master-client-asset-audit.md
```

Current findings:

- Audited `7` GLBs from compile diagnostics.
- Estimated unique GLB geometry is about `433,489` triangles across `105.8MB` of GLB source/transfer size.
- Spector submitted triangles are much higher (`2.61M`) because geometry is redrawn through shadow, reflection, and post-processing/framebuffer passes.
- `asphalt_injection8_-_monacoazure_coast.glb`: `58.2MB`, about `198,768` triangles, `160` primitives, `37` used materials, no Meshopt/Draco/KTX2 compression.
- `rockPatch_dC.glb`: `33.5MB`, about `6,718` triangles, one primitive/material, no Meshopt/Draco/KTX2 compression. Its size points more toward texture payload than geometry.
- `aeschylus.glb`: `2.9MB`, about `107,895` triangles, no KTX2 texture compression.

Automation verdict:

- Do not compress raw GLBs in the browser during page load.
- Three.js/A-Frame should decode already-compressed Meshopt/Draco/KTX2 assets at runtime.
- The optimization target is cached derivative generation at upload time or compile time, then compiled pages reference the validated derivative.
- Safe first derivatives are prune, dedupe, and geometry compression. Visual-changing steps such as decimation, texture resizing, material merging, and LOD selection need thresholds plus visual checks, especially for `high`.

## Cached Derivative Prototype Phase

glTF Transform is pinned as a dev dependency and used only for offline/prototype derivatives in this phase. The source uploads are untouched.

Commands:

```bash
npm run assets:optimize:prototype -- --audit C:\tmp\vrodos-master-client-asset-audit.json --output-dir C:\tmp\vrodos-master-client-optimized-assets --profile safe-draco --limit 3
npm run assets:optimize:prototype -- --audit C:\tmp\vrodos-master-client-asset-audit.json --output-dir C:\tmp\vrodos-master-client-optimized-assets-meshopt --profile safe-meshopt --limit 3
```

Results:

| Asset | safe-draco | safe-meshopt | Notes |
| --- | ---: | ---: | --- |
| `asphalt_injection8_-_monacoazure_coast.glb` | `58.2MB -> 46.8MB` (`19.7%`) | `58.2MB -> 49.5MB` (`14.9%`) | Geometry compression helps, but `160` primitives and `37` used materials remain a draw-call/program-switch concern. |
| `rockPatch_dC.glb` | `33.5MB -> 33.4MB` (`0.4%`) | `33.5MB -> 33.4MB` (`0.3%`) | Geometry is only about `6,718` triangles; the cost is likely texture payload, so a texture-compression/resizing phase is needed. |
| `aeschylus.glb` | `2.9MB -> 2.2MB` (`25.9%`) | `2.9MB -> 2.2MB` (`24.5%`) | Geometry compression is useful and topology stayed stable. |

Validation notes:

- glTF validator reported no errors for the checked derivative outputs.
- Draco/Meshopt extension support warnings are expected unless the validator has extension-specific validation enabled.
- `rockPatch_dC.glb` reported a tangent-space warning after compression; inspect normal-map/tangent behavior during visual QA.

Runtime/admin-panel decision:

- The admin panel can expose an "Optimize 3D file" action after the derivative contract is proven.
- The action should keep the original upload, write derivatives plus metadata, show size/quality status, and let compilation choose a validated derivative by render profile.
- Automatic substitution is still blocked until the compiled A-Frame loader path is verified for Draco and/or Meshopt decoder wiring.

## Compressed Loader Support Phase

A-Frame's `gltf-model` component supports Draco, Meshopt, and Basis/KTX2 decoder paths on the root `<a-scene>` via `dracoDecoderPath`, `meshoptDecoderPath`, and `basisTranscoderPath`.

Implemented support:

- `npm run build:three` now copies decoder assets into the Three vendor directory:
  - `assets/vendor/three-r181/draco/gltf/`
  - `assets/vendor/three-r181/basis/`
  - `assets/vendor/three-r181/meshopt/meshopt_decoder.js`
- `assets/runtime-version-manifest.json` records those decoder paths under `three.decoders`.
- `VRodos_Asset_Manager` exposes decoder URL globals for editor/runtime consumers:
  - `window.vrodos_three_draco_decoder_path`
  - `window.vrodos_three_basis_transcoder_path`
  - `window.vrodos_three_meshopt_decoder_path`
- `VRodos_Compiler_Manager` stamps both master and simple compiled clients with root scene decoder config:

```html
<a-scene gltf-model="dracoDecoderPath: /wp-content/plugins/VRodos/assets/vendor/three-r181/draco/gltf/; basisTranscoderPath: /wp-content/plugins/VRodos/assets/vendor/three-r181/basis/; meshoptDecoderPath: /wp-content/plugins/VRodos/assets/vendor/three-r181/meshopt/meshopt_decoder.js;">
```

Verification:

- Local server returned `200` for Draco WASM, Basis WASM, and Meshopt decoder JS.
- A compiled-scene smoke test exposed that A-Frame loads `meshoptDecoderPath` as a classic script. The first implementation published Three's ESM `meshopt_decoder.module.js`, which threw `Unexpected token 'export'` and then broke A-Frame's `MeshoptDecoder.ready` access. The vendor build now publishes the browser-global Meshopt decoder at `meshopt_decoder.js` and refreshes `meshopt_decoder.module.js` as a compatibility copy for already-compiled clients.
- Smoke profile after the fix:
  `node scripts/profile-master-client.mjs http://wp.local:5832/Master_Client_766.html --frames 60 --warmup-ms 1000 --trace-ms 0 --timeout-ms 30000 --output C:\tmp\vrodos-master-client-smoke.json`
- The smoke profile recorded root scene `meshoptDecoderPath: /wp-content/plugins/VRodos/assets/vendor/three-r181/meshopt/meshopt_decoder.js`, `exceptions: []`, and no `Unexpected token 'export'` / `MeshoptDecoder.ready` console errors.
- The remaining console warning in that smoke profile is the expected `[VRodos] Compile performance diagnostics` warning. Captured `net::ERR_ABORTED` fetch failures did not include thrown page exceptions and should be reviewed only if they appear during a longer manual session.
- The profiler now records root scene `gltf-model` attributes and decoder globals in `scene.gltfModel` for future captures.

Remaining gate:

- Swap one safe derivative at a time, starting with the Draco asphalt derivative.
- Verify load success, console/network health, and visual parity before any automatic substitution or admin action is enabled.

## Compiled Derivative Trial Phase

The profiler can now substitute local derivative files into a compiled client without modifying uploads or generated HTML:

```bash
node scripts/profile-master-client.mjs http://wp.local:5832/Master_Client_766.html --disable-fps-meter --resource-override "/wp-content/uploads/archaeology-joker/models/asphalt_injection8_-_monacoazure_coast.glb=C:\tmp\vrodos-master-client-optimized-assets\01-asphalt-injection8-monacoazure-coast.safe-draco.glb" --output C:\tmp\vrodos-master-client-draco-asphalt-override.json
```

This uses Chrome DevTools request interception to fulfill the original compiled-scene request from a local derivative. It is a test/profiling tool only; production compiled pages should reference validated cached derivatives directly.

Measured result for the first compiled-scene trial:

- Baseline no-FPS-meter smoke profile: `116,853,487` transfer bytes, `119,032,466` encoded bytes, `120,199,180` decoded bytes.
- Safe Draco asphalt override: `105,100,299` transfer bytes, `107,279,278` encoded bytes, `108,445,992` decoded bytes.
- Net reduction: `11,753,188` bytes, about `11.2MB`, matching the asphalt derivative size change.
- The override fulfilled one request for `asphalt_injection8_-_monacoazure_coast.glb` from `01-asphalt-injection8-monacoazure-coast.safe-draco.glb`.
- Runtime health stayed clean: `exceptions: []`, no Meshopt/Draco loader errors, and only the expected compile diagnostics warning.
- Scene composition stayed identical in the smoke capture: `203` meshes, `195` geometries, `81` materials, `58` textures, `18` shadow casters, and `178` shadow receivers.

Verdict:

- Safe Draco is compatible in the compiled scene and is useful for network/download reduction.
- It is not a steady-frame performance fix for this asphalt asset because it preserves the same primitives, materials, textures, and scene object counts.
- The largest remaining runtime cost is still frame anatomy: many draw calls/material switches and repeated rendering through shadows/post-processing, not just GLB transfer size.
- Texture-heavy assets like `rockPatch_dC.glb` need a texture-compression/resizing phase; geometry compression barely changes their size.

## Admin Derivative Storage Phase

Implemented the first production-facing derivative contract:

- `VRodos_Asset_Optimization_Manager` adds a `GLB Optimization` side metabox on `vrodos_asset3d` admin edit screens.
- VRodos Settings now has an `Assets` tab for library-level optimization status.
- The metabox can generate a `safe-draco` derivative for local uploaded GLBs.
- The `Assets` tab analyzes GLBs first and ranks likely-benefit assets for diagnostics/reporting.
- Batch generation processes a bounded number of assets per request and resumes automatically until the queue is empty, unless an asset fails.
- Derivatives are written under WordPress uploads:
  `wp-content/uploads/vrodos-optimized-assets/asset-{asset_id}/`
- Source uploads are kept unchanged.
- Derivative metadata is stored on the asset in `_vrodos_asset3d_glb_derivatives`.
- Compiled scenes only use derivatives when the asset has `Use active derivative in compiled scenes` enabled.
- `VRodos_Compiler_AFrame_Entity_Renderer` resolves GLB URLs through the derivative manager during compilation and records a compile diagnostic note when a derivative is used.

Automatic benefit analysis:

- When `vrodos_asset3d_glb` is added or updated, VRodos reads the GLB JSON chunk and stores `_vrodos_asset3d_glb_analysis`.
- The analysis records source fingerprint, size, counts, estimated triangles, primitive/material/image counts, compression extensions, estimated geometry/image payload, recommendation booleans, reasons, and suggested action.
- Settings > Assets is now a GLB diagnostics/reporting view; per-asset refresh and derivative generation happen from the dashboard Actionable Assets rows.
- Low-benefit, already compressed, unsupported, texture-heavy, and LOD-candidate assets are shown separately.

Dashboard workflow:

- The top-level VRodos dashboard keeps the existing Active Projects table as a tab.
- A second `Actionable Assets` tab shows the top recommended GLB optimization items.
- Row-level dashboard actions can refresh one asset's analysis or generate one safe Draco derivative from the overview screen.
- Safe Draco generation appears on rows where the current derivative optimization type is actionable; future KTX2/LOD rows remain visible as recommendations until those generators exist.
- The `Compile Use` column is a toggle for ready safe Draco derivatives. Enabling validates the derivative before setting `compileEnabled`; disabling returns compilation to the original GLB.
- Analysis refresh and Compile Use toggles update the dashboard row asynchronously through `admin-ajax.php`.
- Safe Draco generation remains a signed admin action because it writes files and can take longer; it should move to a queued/progress AJAX flow before becoming fully async.
- Dashboard and Settings asset optimization tables filter to GLB-referenced assets only, so non-GLB media does not appear as unsupported optimization work.
- Dashboard refresh/generate actions redirect back to the `Actionable Assets` tab and do not enable compile substitution. Only the explicit Compile Use toggle changes compile substitution.
- Derivative files are cached artifacts owned by the asset post. Permanent asset deletion removes `wp-content/uploads/vrodos-optimized-assets/asset-{asset_id}/` plus derivative/analysis metadata.
- Project-delete flows that delete associated asset posts inherit the same derivative cleanup; this covers Immerse project assets when they are removed through VRodos project deletion.

## Admin Refactor Phase

The first cleanup pass extracted asset optimization code without changing public behavior:

- `includes/class-vrodos-asset-optimization-manager.php` is now a thin hook coordinator and compatibility facade.
- The implementation moved to `includes/asset-optimization/`:
  - admin actions/metabox handlers
  - Settings > Assets rendering and batch/report helpers
  - dashboard Actionable Assets row rendering and AJAX row refresh support
  - GLB-only asset scanning
  - GLB source analysis and recommendation scoring
  - safe Draco derivative generation, compile-use validation, and derivative cache cleanup
- Compatibility wrappers remain on `VRodos_Asset_Optimization_Manager` for compiler/dashboard callers:
  - `resolve_compiled_glb_asset()`
  - `dashboard_actionable_assets()`
  - `render_dashboard_actionable_assets_table()`
- Hook names, AJAX/admin-post action names, metadata keys, derivative cache paths, and opt-in compile substitution semantics are unchanged.

Dashboard extraction:

- `VRodos_Core_Manager::vrodos_plugin_main_page()` remains the stable menu callback and now delegates to `VRodos_Admin_Dashboard_Page::render()`.
- `VRodos_Admin_Dashboard_Page` owns dashboard CSS, notices, stats, Active Projects markup, and Actionable Assets tab composition.
- Dashboard asset rows still delegate to `VRodos_Asset_Optimization_Manager::render_dashboard_actionable_assets_table( 10 )`.

Asset CPT extraction:

- `VRodos_Asset_CPT_Manager` remains the class instantiated by `VRodos.php`.
- Hook names and callback method names remain available on `VRodos_Asset_CPT_Manager`; each wrapper delegates to `VRodos_Asset_CPT_Admin_Controller`.
- The frontend template contract `VRodos_Asset_CPT_Manager::prepare_asset_editor_template_data()` remains available and delegates to the extracted controller.
- Frontend create/update compatibility wrappers remain available:
  - `create_asset_frontend()`
  - `update_asset_frontend()`
  - `update_asset_meta()`
- Extracted implementation files:
  - `includes/asset-cpt/trait-vrodos-asset-cpt-metabox-admin.php`
  - `includes/asset-cpt/trait-vrodos-asset-cpt-taxonomy-admin.php`
  - `includes/asset-cpt/trait-vrodos-asset-cpt-submission.php`
  - `includes/asset-cpt/trait-vrodos-asset-cpt-shared.php`
- Asset metabox/taxonomy nonce actions are pinned to the old manager basename to avoid changing save semantics.

Remaining admin cleanup:

- Consider moving the extracted Asset CPT traits into concrete service classes once behavior has been verified in the WordPress UI.
- Consider a later enqueue cleanup pass if admin/dashboard script ownership keeps growing.

The existing glTF Transform prototype script now supports single-source mode for admin/backend use:

```bash
node scripts/prototype-optimize-master-client-assets.mjs --source D:\Development\WordPress\app\public\wp-content\uploads\archaeology-joker\models\aeschylus.glb --source-url /wp-content/uploads/archaeology-joker/models/aeschylus.glb --output-dir C:\tmp\vrodos-single-asset-optimize-test --output-file C:\tmp\vrodos-single-asset-optimize-test\aeschylus.safe-draco.glb --manifest C:\tmp\vrodos-single-asset-optimize-test\manifest.json --markdown C:\tmp\vrodos-single-asset-optimize-test\manifest.md --profile safe-draco --json
```

Validation result:

- Single-source optimizer mode generated `aeschylus.safe-draco.glb`.
- Size changed from `2.9MB` to `2.2MB`, saving `795,408` bytes (`25.9%`).
- The derivative reported `KHR_draco_mesh_compression`.
- PHP syntax checks passed for the new optimization manager, compiler entity renderer, and plugin bootstrap.

Operational policy:

- Generate does not automatically enable compile substitution.
- Batch generate does not automatically enable compile substitution.
- Analysis does not generate files and does not enable compile substitution.
- Deleting an asset deletes its cached derivative directory and optimization metadata.
- Compile substitution is per-asset opt-in after visual parity is checked.
- The resolver validates that the derivative file still exists and that its recorded source URL matches the current source URL before substituting it.
- If validation fails, compilation silently falls back to the original GLB.

## LOD Direction

LOD can reduce the render-side cost that Draco alone does not touch. It should be treated as an explicit derivative family rather than an automatic source-asset downgrade:

- `lod0`: current/high source or validated optimized equivalent.
- `lod1`/`lod2`: simplified derivatives generated and stored beside compression derivatives.
- Compilation can emit distance-based switching only when an asset has validated LOD derivatives and the scene opts into them.
- LOD should be measured with Spector/CDP because it targets triangles, draw calls, and shadow-pass duplication, not just transfer size.

Do not add automatic LOD substitution until visual thresholds, distance bands, shadow behavior, and collision/interaction expectations are defined.

## Compiled Shadow And AO Refactor

`Master_Client_8980` showed that player collision/nav was not the FPS bottleneck. The high-cost steady-state work was repeated shadow-map rendering plus PMNDRS SSAO/NormalPass work.

Current implementation direction:

- Compiled desktop scenes default `shadowUpdateMode` to `static`.
- Runtime `markShadowDirty(reason)` and `flushShadowUpdate()` update shadow maps on load/reveal and scene-light/material/visibility changes, then keep `renderer.shadowMap.autoUpdate = false`.
- The compiler emits `data-vrodos-shadow-role` so visible GLB world geometry, media planes, and POI panels cast/receive by default, walkable/navmesh ground receives without self-casting, and hidden collision proxies render into neither the main frame nor shadow maps.
- Point/spot lights no longer become shadow casters just because shadows are globally enabled; they must be authored that way.
- Directional sun/helper shadow maps use camera-focused adaptive bounds for large terrain instead of fitting the entire GLB. High quality focuses about `180` world units around the camera; medium focuses about `120`.
- PMNDRS/Takram day-night shadows keep PCF filtering, use shared contact-shadow bias/normalBias settings, and apply a small directional shadow radius for edge softness.
- Large terrain that must self-cast uses `terrain-matte` material stabilization, a terrain custom depth-material polygon offset, and a targeted shader lift for near-depth self-shadow samples. This was the fix for the visible soft triangle/band pattern; it was not an SSAO cost or quality issue.
- PMNDRS AO keeps final color full-resolution but uses cheaper NormalPass/SSAO budgets for `soft` and `balanced`.
- The profiler appends `vrodos_debug_disable_fps_meter=1` when `--disable-fps-meter` is used, preventing StatsGL from initializing before it can wrap the renderer.
- `?vrodos_debug_shadow_perf=1` exposes static-shadow diagnostics in the compiled scene.

Simplified Draco derivatives can help after this pass, but only if the derivative actually reduces render triangles/material cost. Draco compression by itself reduces transfer/decode size and does not reduce per-frame triangle submission after decode.

Research TODO: `steep-face shadow proxy`. Keep default navmeshes receiver-only for broad compatibility, but the runtime now has a safe path for explicitly self-casting terrain. Later, evaluate generating a shadow-only proxy from steep navmesh faces so mountains/walls can block direct light and shadow-aware reflections without making broad flat ground cast onto itself.

## Policy

- `high` must remain visually equivalent to the current look.
- Performance optimizations must not intentionally turn off current high-profile visual features.
- Lower-cost behavior belongs in `standard`, `performance`, or future adaptive modes.
- Desktop DPR pixel budgeting applies automatically to `performance`, is skipped in immersive WebXR, and can be forced for profiling with `?vrodos_dpr_pixel_budget=PIXELS`.
- Expensive scene content should be reported with diagnostics before it is silently altered.

## Implementation Steps

1. Add a repeatable Chrome DevTools Protocol profiler script for compiled client URLs.
2. Keep high-quality DPR, AA, PMNDRS LUT, lens flare, atmosphere, and shadow behavior visually stable.
3. Add a `performance` render-quality option for cheaper runtime behavior.
4. Cap non-high profiles so `standard` avoids high-profile DPR and atmosphere costs, while `performance` can reduce DPR, AA, LUT, lens flare, atmosphere quality, and shadow cost.
5. Change `clear-frustum-culling` so it only disables culling when requested and no longer forces every loaded mesh to cast and receive shadows.
6. Add compiler/runtime diagnostics for large models/images, duplicate expensive asset URLs, and expensive scene composition.
7. Rebuild generated runtime bundles after source changes.
8. Add Spector.js as a debug-only WebGL capture tool for one-frame draw-call, command, framebuffer, texture upload, and shader/program analysis.
9. Add a profiler `--disable-fps-meter` switch so StatsGL does not pollute comparison captures.
10. Add a read-only GLB asset audit script that estimates local GLB triangles, primitives, materials, compression extensions, and first-action recommendations.
11. Add a glTF Transform derivative prototype script with `safe-draco` and `safe-meshopt` profiles.
12. Publish Draco, Basis/KTX2, and Meshopt decoder assets through the Three vendor build.
13. Stamp compiled A-Frame scenes with root `gltf-model` decoder paths.
14. Add profiler resource interception to test compiled-scene derivative substitutions without editing uploads or generated HTML.
15. Add admin-side derivative storage plus opt-in compile-time selection.
16. Add a settings-level batch button for generating missing safe Draco derivatives.
17. Add automatic GLB benefit analysis and recommendation-first derivative targeting.
18. Add a dashboard Actionable Assets tab for top optimization items.
19. Next optimization pass should add texture compression for texture-heavy GLBs and visual QA tooling for opted-in derivatives.
20. Plan LOD derivative families for distance-based render-cost reduction after compression and QA paths are stable.

## Acceptance Criteria

- `high` still matches the current visual output.
- `standard` and `performance` are allowed to reduce rendering cost.
- Loaded meshes are not made shadow casters/receivers by `clear-frustum-culling` unless explicitly configured.
- Compiled clients expose `window.VRODOS_COMPILE_DIAGNOSTICS` and warn in the console when expensive asset or scene-composition diagnostics are present.
- The profiler can capture rAF p50/p95, renderer info, trace summaries, resource sizes, console errors, and failed network requests.
- The profiler can temporarily disable the runtime FPS meter before warmup without persisting scene data.
- The profiler can optionally write a Spector.js capture JSON after timing samples.
- The asset audit can write JSON/Markdown reports from a profiler capture without modifying uploaded assets.
- The derivative prototype can generate JSON/Markdown reports and cached GLB derivatives without modifying uploaded assets.
- Compiled scenes include decoder paths for Draco, Basis/KTX2, and Meshopt compressed assets after regeneration.
- The profiler can trial a local derivative through `--resource-override URL_OR_PATH=FILE` and record fulfilled override details.
- Asset admins can generate a safe Draco derivative for a local uploaded GLB without replacing the original upload.
- Site admins can refresh saved GLB analysis and generate recommended safe Draco derivatives from dashboard Actionable Assets rows without replacing originals or enabling compile substitution.
- Site admins can see top actionable GLB assets from the dashboard and run single-asset refresh/generate derivative actions without enabling compile substitution.
- Dashboard and Settings optimization tables show only GLB-referenced assets.
- The compiler can use an optimized derivative only when the asset metadata explicitly enables it.
- `?vrodos_spector=1` exposes `window.VRODOS_SPECTOR` and opens Spector's UI without affecting normal URLs.
- `node --check`, PHP lint for edited PHP files, and `git diff --check` pass for the edited files.
