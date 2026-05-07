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
- Next: visually compare compressed derivatives in the compiled scene, then design admin-panel optimization controls.

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

## Policy

- `high` must remain visually equivalent to the current look.
- Performance optimizations must not intentionally turn off current high-profile visual features.
- Lower-cost behavior belongs in `standard`, `performance`, or future adaptive modes.
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
14. Next optimization pass should regenerate the target scene, load prototype derivatives, and then prototype admin-side derivative storage plus compile-time selection.

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
- `?vrodos_spector=1` exposes `window.VRODOS_SPECTOR` and opens Spector's UI without affecting normal URLs.
- `node --check`, PHP lint for edited PHP files, and `git diff --check` pass for the edited files.
