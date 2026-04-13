# Post-Processing Pipeline Analysis & Migration Plan
## (covers: volumetric clouds feasibility + pmndrs/postprocessing migration)

## Context

This document answers two linked questions:

1. Can the Takram volumetric clouds/atmosphere work from [three.js#33292](https://github.com/mrdoob/three.js/pull/33292) be dropped into the VRodos A-Frame compiled-scene runtime "effortlessly"?
2. Since `@takram/three-clouds` peer-depends on [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing) (not Three's built-in `EffectComposer` that VRodos currently uses), the bigger question arises: **is pmndrs/postprocessing better than VRodos' current hand-built pipeline? Should we replace ours with it, leverage it, and unlock Takram for free?**

Initial answer to #1: **no, not effortlessly** — there is a hard architectural mismatch. But the fix for that mismatch (migrating to pmndrs) turns out to be a net win in its own right, and this plan lays that out.

This plan compares the four realistic options (A-Frame defaults, stock Three post-FX, VRodos' current custom pipeline, pmndrs/postprocessing), recommends a route, and sketches the migration in phases.

---

## Status Snapshot (2026-04-13)

| Phase | Status | Notes |
|---|---|---|
| Foundation 0 | In progress | The pinned A-Frame master + Three r181 foundation is now active in live runtime code. Remaining work is subsystem validation, legacy/PMNDRS re-baselining, and Takram/cloud follow-through on top of that base. |
| Phase 0 | Complete | Compatibility smoke test completed with caveats (see §9). |
| Phase 1 | Complete | Bundle/runtime extension completed (see §10). |
| Phase 2 | Complete | PMNDRS runtime module implemented (`vrodos_postprocessing_pmndrs.js`). |
| Phase 3 | Complete | PMNDRS runtime wiring into compiled master shell completed. |
| Phase 4 | Complete | Engine selector + schema/compiler/dialog wiring completed. |
| Phase 5 | Complete | Atmosphere-first Horizon/Takram implementation is in place for PMNDRS Horizon scenes and a stable Takram-default baseline was accepted for further polish (see §12). Volumetric clouds remain a follow-up item on top of this base. |
| Phase 6 | Not started | Legacy hard-delete deferred until stability window is met. |

**What is no longer relevant now**
- `realism-effects` as an SSR/TRAA dependency for this migration (rejected in §10 due Three r173 incompatibility).
- pre-Phase-0 decision questions that were already answered by implementation and subsequent results sections.
- Treating Three r173 as the long-term base.
- Runtime profile / fallback switching for A-Frame and Three. The live source of truth is now `includes/class-vrodos-render-runtime-manager.php`.

---

## 0. Course Correction: Why r181 Comes First Now

After the Horizon/Takram work on top of Three r173, the new conclusion is:

- **A-Frame stable 1.7.1 is still on Three r173.**
- **A-Frame master has moved to Three r181**, and VRodos already carries a commented prototype reference to that direction in `js_libs/aframe_libs/Master_Client_prototype.html`.
- `postprocessing@6.39.0` supports `three >=0.168.0 <0.184.0`, so r181 remains in-range.
- `@takram/three-atmosphere@0.18.0` and `@takram/three-clouds@0.7.4` both support `three >=0.170.0`, so r181 also fits their range cleanly.

This does **not** mean r181 will automatically fix every Horizon artifact. Some of those issues were integration and ownership bugs in VRodos itself. But it does mean r181 is now the better foundation for the next stage because it should reduce compatibility pressure between A-Frame, PMNDRS, and Takram.

### Repo audit findings that justify the foundation phase

The repo historically contained a meaningful amount of r173-specific plumbing:

- `package.json` was pinned to `three: 0.173.0`.
- `scripts/build-three-r173.mjs` emitted `js_libs/threejs173/vrodos-three-r173.bundle.js`.
- `includes/class-vrodos-asset-manager.php` and editor/runtime helpers were hard-wired to `threejs173`.
- The bundle/build naming was explicitly r173-based and needed a controlled rename or compatibility alias during the r181 migration.
- The legacy and PMNDRS runtime modules contain comments and workarounds explicitly framed around the r173/A-Frame-1.7.1 stack, including the load-bearing `isXRRenderTarget` tone-mapping workaround in `vrodos_postprocessing.js`.

### Leftover 147 -> 173 migration findings

The audit did **not** uncover a large pile of obviously-unmigrated pre-r173 APIs still active in the hot rendering paths. The main useful findings were:

- Already modernized:
  - `renderer.outputColorSpace = THREE.SRGBColorSpace`
  - `renderer.toneMapping = THREE.ACESFilmicToneMapping`
  - Pointer-lock access already prefers `controls.object`
- Needs review during r181 migration:
  - `THREE.PCFSoftShadowMap` is still used in the editor/runtime. It remains valid on r181 but is deprecated at 181 -> 182, so it should be revisited while renderer defaults are touched.
  - `THREE.RGBELoader` is still used for HDR environments. The rename to `HDRLoader` happens at 179 -> 180, making this a concrete compatibility checkpoint for r181.
  - The legacy post-FX path still depends on the r173-specific `isXRRenderTarget` tone-mapping hack and must be re-validated carefully on r181.

### New foundation phase before additional Takram work

1. **Foundation 0A — version-neutral plumbing**
   - Remove hardcoded `threejs173` fallback paths from editor/runtime helpers.
   - Centralize vendor bundle base paths so the version switch is not a string-search exercise.
2. **Foundation 0B — pinned r181 spike**
   - This is now the active runtime foundation, not a temporary opt-in spike.
   - Move the local Three dependency and vendor build to r181.
   - Switch compiled clients to a pinned A-Frame master commit that matches that Three version.
   - Keep the smoke harness aligned with the same pinned destination stack so validation tracks the runtime that live code now uses.
   - Remove version-selection sprawl and keep one live source of truth for the active runtime in `includes/class-vrodos-render-runtime-manager.php`.
3. **Foundation 0C — subsystem validation**
   - Editor renderer
   - Asset viewer
   - Legacy post-FX
   - PMNDRS post-FX
   - Takram atmosphere init
   - networked-aframe / aframe-extras / environment-component compatibility
4. **Foundation 0D — resume PMNDRS/Takram roadmap**
   - Continue the Takram-first Horizon/light-source work only after the r181 baseline is proven across editor, asset viewer, legacy post-FX, PMNDRS, and Takram init.

---

## 1. What VRodos Currently Has

Source of truth: `runtime/assets/js/master/vrodos_postprocessing.js` (lines 1–500+).

It is a **sophisticated, hand-rolled post-FX chain** that installs itself by monkey-patching `renderer.render` on the A-Frame WebGLRenderer. Highlights:

- **Fused composite shader** (`VRODOSMaster.createPhotorealPostMaterial`, line 128) — the "photoreal" post material is **compile-time specialized** for exactly the enabled features (SAO/SSR/Bloom/ColorGrading/Vignette). Disabled effects contribute zero texture fetches and zero ALU in the final shader. This is an excellent architecture and gives it a real performance edge.
- **Custom SAO** (half-res, lines 152–184) with **adaptive FPS-based half-rate temporal subsampling** (lines 171–184, 282–315): when 30-frame rolling FPS drops below 30, SAO computes every second frame and the composite reuses the previous frame's `saoTargetA`. Re-enables when FPS recovers above 45. Has a 3-second cooldown to prevent oscillation. This is a genuinely non-trivial runtime feature.
- **Custom SSR** (half-res, lines 251–259, 391–412) — with jitter coupling into TAA.
- **Multi-pass bloom** (half-res, 2D Gaussian separable, lines 138–149, 414–443) — feeds the fused composite.
- **Custom TAA** (full-res, lines 205–249, 317–340, 469–498): Halton(2,3) 16-sample jitter applied directly to `camera.projectionMatrix`, ping-pong history buffers, history clipping in the TAA resolve shader, custom blit-to-screen passthrough that deliberately skips FXAA to avoid compounding temporal softness.
- **FXAA** (full-res, lines 192–203) — used only when TAA is off.
- **MSAA/DepthTexture trade-off** (lines 97–115): automatically disables MSAA when any effect needs the depth texture, because WebGL2 disallows both; picks sample count from quality tier.
- **XR render-target hack** (lines 107–110): sets `isXRRenderTarget=true` + `SRGBColorSpace` on the intermediate target so Three r173 applies ACES tone mapping + sRGB encoding (normally it only does both for the null/screen target). The composite then deliberately skips `linearToSRGB`. This is a load-bearing hack.
- **Total disable in VR**: `shouldUsePostProcessing()` returns false when `renderQuality !== 'high'`, when the scene is in `vr-mode`, or when `renderer.xr.isPresenting`. So **no post-processing runs in WebXR today** — the A-Frame path handles it.

What this means: VRodos' pipeline is better than "generic Three post-processing stitched from the `examples/jsm/postprocessing` folder." It is comparable to what a boutique rendering team would build. But it is all hand-maintained code, and its feature ceiling is limited by what the team can afford to write.

---

## 2. Feature Matrix

| Capability | A-Frame default (no PP) | Stock Three `EffectComposer` | **VRodos current** | **pmndrs/postprocessing** core | pmndrs + `realism-effects` (0beqz) |
|---|---|---|---|---|---|
| Scene render | yes (direct) | yes | yes (intercepted) | yes | yes |
| Effect merging into one fragment shader | n/a | no (one full-screen quad per pass) | yes — hand-rolled (specialized composite) | yes — **automatic** via `EffectPass` | yes — inherits from pmndrs |
| Edge AA | browser MSAA only | `FXAAShader` | FXAA + Halton TAA | **SMAA** (higher quality than FXAA at ~same cost) + built-in FXAA + TAA (v7) | SMAA + **TRAA** (realism-effects, velocity-aware) |
| Ambient occlusion | — | `SAOPass` (slow, full-res) | custom half-res SAO + **adaptive FPS half-rate** | `SSAOEffect`, plus community **`N8AO`** (generally considered state-of-the-art for WebGL) | yes |
| Bloom | — | `UnrealBloomPass` | custom 2-pass separable | `BloomEffect` (mipmap chain, selective luminance) | yes |
| SSR | — | `SSRPass` (buggy, deprecated) | custom half-res | **not in core** | `SSREffect` / `SSGIEffect` (higher quality than anything else in WebGL land) |
| Depth of field | — | `BokehPass` (simple) | — | `DepthOfFieldEffect` (circular bokeh, good quality) | yes |
| Tone mapping | Three's `toneMapping` setting | — | ACES via XR target hack | `ToneMappingEffect` (ACES, Reinhard, Uncharted2, AgX, …) proper | yes |
| Color grading | — | — | exposure/contrast/saturation in composite | LUT-based + brightness/contrast/hue/saturation effects | yes |
| Vignette | — | — | in composite | `VignetteEffect` | yes |
| Outline | — | `OutlinePass` (separate chain) | partial (scene-editor only) | `OutlineEffect` (merges into the EffectPass, so cheap to enable) | yes |
| God rays / light shafts | — | — | — | `GodRaysEffect` | yes |
| Chromatic aberration / noise / glitch | — | — | — | yes | yes |
| WebXR | yes (no PP, works cleanly) | broken | yes — post-FX off in XR, A-Frame path takes over | not yet supported ([pmndrs/postprocessing#677](https://github.com/pmndrs/postprocessing/issues/677), research phase) | broken |
| Three r173 compatibility | yes | yes | yes | yes (current pinned line is 6.39.x) — **validated in Phase 0/1** | historical option only (rejected for current migration) |
| Maintenance burden | none | low | **high — all in-house** | low | medium |
| Required to unlock `@takram/three-clouds` | no | no | no | **yes** | yes |

**Key observations**

- VRodos' single best architectural idea — **fusing all enabled effects into one specialized fragment shader** — is the *exact same thing* pmndrs' `EffectPass` does automatically. Migrating does not lose the optimization; it shifts it from in-house code to a maintained library.
- VRodos beats pmndrs core on **SSR, TAA, and adaptive SAO half-rate** — none of these ship in pmndrs core. For this migration, SSR/TAA remain on the legacy path (see §11).
- pmndrs beats VRodos on **SMAA quality, N8AO quality, DoF, god rays, LUT color grading, outline-as-effect, tone mapping algorithms** — and on the feature *ceiling* generally, because the library is actively maintained by a larger community.
- WebXR is **a non-issue**. VRodos already turns post-FX off in VR. Whichever library is in use on desktop, the VR path is the same plain A-Frame rendering.
- A-Frame's stock environment and stock Three `EffectComposer` are both strictly worse than what VRodos already has and are not serious contenders.

---

## 3. Recommendation

**Migrate to pmndrs/postprocessing as the core desktop post-FX pipeline, while keeping legacy as the SSR/TRAA path.**

Why this wins:

1. **Quality up**. `BloomEffect` + fused `EffectPass` + modern tone-mapping/color stack improves maintainability and visual consistency.
2. **Maintenance down**. ~600 lines of custom `vrodos_postprocessing.js` + several custom shader files (`vrodos_shaders_sao.js`, `vrodos_shaders_ssr.js`, `vrodos_shaders_bloom.js`, `vrodos_shaders_taa.js`, `vrodos_shaders_fxaa.js`, composite material) collapse into a small adapter layer that configures pmndrs effects from the `scene-settings` schema.
3. **Atmosphere/cloud feature path unlocked**. Once pmndrs is the composer, Takram atmosphere and clouds integrate cleanly in the same effect chain.
4. **Same architectural win**. pmndrs' `EffectPass` merges enabled effects into one fragment shader — the exact trick VRodos currently hand-maintains.
5. **Future effects come for free**: chromatic aberration, pixelation, scan-line, glitch, shock-wave, etc., if ever authored in the editor UI.

Acceptable losses / carry-overs:

- **SSR/TRAA** remain legacy-only in this migration line; PMNDRS path explicitly no-ops those flags with a one-time info log.
- **Adaptive AO half-rate** is optional follow-up tuning; correctness comes first in the PMNDRS path.
- **ACES tone mapping**: set `renderer.toneMapping = ACESFilmicToneMapping` and use pmndrs' `ToneMappingEffect` properly instead of the XR render-target hack. Cleaner.
- **MSAA/Depth trade-off**: pmndrs handles the depth-texture/MSAA exclusivity internally; the logic at lines 97–115 can be removed.

---

## 4. Migration Plan (Phased)

### Phase 0 — Compatibility proof-of-concept (half a day)

Before touching any production code, build a throwaway HTML page that loads:

- A-Frame 1.7.1
- The existing `vrodos-three-r173.bundle.js`
- pmndrs `postprocessing` 6.x (current pinned line: 6.39.0)
- A trivial scene with 1 cube

and verifies:

1. `new EffectComposer(renderer)` constructs against Three r173 without console errors.
2. `RenderPass` + `EffectPass(camera, new BloomEffect(), new VignetteEffect(), new ToneMappingEffect({ mode: ACESFilmic }))` renders.
3. `SMAAEffect` initializes (it needs SMAA lookup textures — pmndrs ships them inline).
4. `SSAOEffect` or `N8AOPostPass` initializes with depth-normal pass.
5. `@takram/three-atmosphere` `AerialPerspectiveEffect` initializes (sanity check for the cloud story).

**Go/no-go**: if any of (1)–(4) break on r173, stop and choose between: (a) upgrading Three to a newer r18x as a separate project, or (b) running pmndrs in a second composer alongside the existing VRodos pipeline (dual-composer fallback).

### Phase 1 — Bundle extension

Edit `scripts/build-three-r173.mjs` (`bundleEntrySource` block, lines 18–58):

- `npm install postprocessing n8ao` (pin versions after Phase 0 confirms compatibility).
- Import them and re-export onto globals alongside `window.THREE`:
  ```js
  import * as POSTPROCESSING from 'postprocessing';
  import { N8AOPostPass } from 'n8ao';
  window.POSTPROCESSING = POSTPROCESSING;
  window.N8AOPostPass = N8AOPostPass;
  ```
- Rebuild (`node scripts/build-three-r173.mjs`).
- Record bundle size before/after. Expect a meaningful growth (LUT textures, SMAA textures); if it crosses a threshold the team cares about, split into a lazy secondary bundle loaded only when `postFXEnabled=1`.

### Phase 2 — New runtime module `vrodos_postprocessing_pmndrs.js`

Create `runtime/assets/js/master/vrodos_postprocessing_pmndrs.js` (sibling to the existing file — do not delete the old one yet). Responsibilities:

1. On `scene-settings` `init()`, if `renderQuality === 'high'` and not in VR, build a pmndrs `EffectComposer` on the A-Frame renderer.
2. Add a `RenderPass(scene, camera)` first.
3. Conditionally construct effects from the scene-settings schema (revised after Phase 0/1 — see §9 and §11):
    - `aaQuality` → `FXAAEffect()` (SMAA is broken inside EffectPass on r173 — see §9). Treat `balanced|high|ultra` as a no-op or map to subpixel intensity tweaks if FXAA exposes them.
    - `ambientOcclusionPreset !== 'off'` → pmndrs `SSAOEffect` (n8ao is broken on r173 — see §9). Construct as a normal effect; it merges into the final EffectPass.
    - `postFXSSREnabled === '1'` → **NOT supported in the new pipeline.** Log a one-time `console.info` telling the user this scene needs the legacy pipeline if SSR is required. See §11.
    - `postFXTAAEnabled === '1'` → **NOT supported in the new pipeline.** Same handling as SSR. See §11.
    - `bloomStrength !== 'off'` → `BloomEffect({ intensity, luminanceThreshold })`.
    - `postFXColorEnabled === '1'` → `BrightnessContrastEffect` + `HueSaturationEffect`.
    - `postFXVignetteEnabled === '1'` → `VignetteEffect`.
    - Always → `ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC })`.
4. Stuff every constructed effect into a single `EffectPass(camera, …)` at the end. With SSR/TRAA dropped and n8ao replaced by pmndrs `SSAOEffect`, **everything merges** — no separate passes needed.
5. Install the same `renderer.render` monkey-patch shape as the current code, but delegate to `composer.render(deltaTime)` instead. Keep the `shouldUsePostProcessing()` gate unchanged (VR fallback preserved).
6. Re-implement **adaptive AO half-rate** as a thin wrapper around the SSAOEffect: track the same 30-frame rolling FPS window from the old file (lines 282–315), and when active, toggle `ssaoEffect.blendMode.opacity.value` between full and zero on alternate frames (since the effect is merged into the EffectPass and cannot simply be `enabled=false`). Document this departure from the old half-rate behaviour in the module header.
7. On disable / scene teardown, `composer.dispose()` and null everything — same lifecycle as the current code.
8. **Defensive composer init**: before the first `composer.render()`, call `composer.setSize(w, h)` with `renderer.domElement.clientWidth || renderer.domElement.width || window.innerWidth` (and the height equivalent), guarding against the A-Frame zero-canvas race observed in Phase 0.

### Phase 3 — Wire the new module into the HTML shells AND add the engine selector

- `js_libs/aframe_libs/Master_Client_prototype.html`: load the **new** `vrodos_postprocessing_pmndrs.js` **alongside** (not replacing) the existing `vrodos_postprocessing.js` line (~line 64). Both files self-register as engine candidates; only one wires up at runtime per the `postFXEngine` field on `<a-scene scene-settings="…">`.
- `js_libs/aframe_libs/Simple_Client_prototype.html`: same change for parity.
- The legacy `vrodos_shaders_*.js` helpers stay loaded — they back the legacy engine and remain in use until Phase 6.
- Compile a reference scene with `postFXEngine='pmndrs'` and confirm visually that SSAO + Bloom + Tone mapping + FXAA produce output at least on par with the legacy pipeline. Capture screenshots at identical camera positions for before/after review.
- Compile a second reference scene with `postFXEngine='legacy'` (the default) and confirm zero behavioural change vs. main.

### Phase 4 — Scene-settings schema (engine selector + compiler dialog UI)

The scene-settings schema in `runtime/assets/js/master/components/vrodos_scene_settings.component.js` (schema block at lines 8–48) gains exactly one new field for v1:

```js
postFXEngine: { type: 'string', default: 'legacy' }, // 'legacy' | 'pmndrs'
```

`'legacy'` is the v1 default so that **all existing scenes and all newly-compiled scenes keep behaving exactly as today** until the new pipeline has visible mileage. Flipping the default to `'pmndrs'` happens in a follow-up commit after Phase 3 confirms parity.

The other post-FX fields (`postFXBloomEnabled`, `postFXSSREnabled`, `postFXTAAEnabled`, `ambientOcclusionPreset`, `aaQuality`, `bloomStrength`, `postFXColorEnabled`, `postFXVignetteEnabled`) keep their current meaning. Their interpretation depends on which engine is active:

- **legacy engine** — interpreted exactly as today by `vrodos_postprocessing.js`. Full SSR/TRAA/SAO support.
- **pmndrs engine** — interpreted by `vrodos_postprocessing_pmndrs.js`. `postFXSSREnabled` and `postFXTAAEnabled` are silently no-ops with a one-time `console.info`. Everything else maps onto the merged EffectPass per Phase 2.

**Compiler change** — `includes/class-vrodos-compiler-manager.php` (lines 534–567) gets the new `postFXEngine` key serialized into the `scene-settings` attribute string.

**Compilation dialog UI** — The scene compilation dialog gains one new dropdown labeled "Post-processing engine" with two options: "Legacy (custom SSR/TRAA, no clouds)" and "Pmndrs (modern, supports clouds)". Default selection mirrors the schema default. Clouds-related UI (Phase 5) is disabled when "Legacy" is selected.

**Compatibility guarantee**: scenes compiled before this field existed deserialize with `postFXEngine='legacy'` (the schema default), so **every existing scene out there in the wild continues to work unchanged**.

### Phase 5 — Add the Takram clouds feature on top (the original ask)

Now that pmndrs is the composer, add `@takram/three-atmosphere` + `@takram/three-clouds` to the bundle (step extends Phase 1). Extend the scene-settings schema in `runtime/assets/js/master/components/vrodos_scene_settings.component.js` (schema block at lines 8–48):

```js
aframeCloudsEnabled:      { type: 'string', default: '0' },
aframeCloudsPreset:       { type: 'string', default: 'balanced' }, // subtle|balanced|dramatic
aframeCloudCoverage:      { type: 'string', default: '0.45' },
aframeCloudDensity:       { type: 'string', default: '0.55' },
aframeCloudWindSpeed:     { type: 'string', default: '0.003' },
aframeAtmosphereEnabled:  { type: 'string', default: '1' },
aframeCloudShadowsEnabled:{ type: 'string', default: '0' },
```

Extend the compiler at `includes/class-vrodos-compiler-manager.php` lines 534–567 to serialize those into the `scene-settings` attribute for both master and simple clients.

In `vrodos_postprocessing_pmndrs.js`, when `aframeCloudsEnabled === '1'` and device is desktop and not VR, insert `CloudsEffect` before `AerialPerspectiveEffect` in the EffectPass chain (this is the order the Takram docs require). Gate `cloudShadows` on `renderQuality === 'high'`.

Editor UI (v1 minimal): enable toggle, preset dropdown, wind slider, cloud shadows toggle. Add a collapsible Advanced section for coverage/density only if the editor UI framework supports it cleanly — don't bikeshed it.

### Phase 6 — Delete the old pipeline

Only after Phase 3 has been shipping visibly to users without regressions:

- Delete `runtime/assets/js/master/vrodos_postprocessing.js`.
- Delete `vrodos_shaders_sao.js`, `vrodos_shaders_ssr.js`, `vrodos_shaders_bloom.js`, `vrodos_shaders_taa.js`, `vrodos_shaders_fxaa.js`, and the `VRODOSMaster.createPhotorealPostMaterial` / `createBrightPassMaterial` / `createGaussianBlurMaterial` / `createSAOMaterial` / `createFXAAMaterial` / `createTAAMaterial` / `createSSRMaterial` helpers wherever they live.
- Remove the corresponding `<script>` lines from both HTML prototypes.
- Remove the XR render-target hack workaround (lines 107–110 of the old file) — pmndrs' composer handles tone mapping/encoding natively.

---

## 5. Critical Files

| File | Role |
|---|---|
| `scripts/build-three-r173.mjs` | **Extend** — add postprocessing + realism-effects + n8ao + (Phase 5) Takram imports and re-exports |
| `runtime/assets/js/master/vrodos_postprocessing.js` | **Delete in Phase 6.** Reference while writing the replacement — all behavior must be preserved. Lines 77–259 (enable/resize), 264–500+ (render loop) are the full functional spec. |
| `runtime/assets/js/master/vrodos_postprocessing_pmndrs.js` | **Create.** New composer-based post-FX module. |
| `runtime/assets/js/master/components/vrodos_scene_settings.component.js` | **Edit in Phase 5** — schema lines 8–48 gain the seven cloud fields; `init()` (556–632) stays as the fallback path; the effect-construction block inside the component that calls `VRODOSMaster.SceneSettingsHelpers.enablePostProcessing` gets rewired to the new module. |
| `runtime/assets/js/master/vrodos_shaders_sao.js` et al. | **Delete in Phase 6.** |
| `includes/class-vrodos-compiler-manager.php` | **Edit in Phase 5** — lines 534–567 serialize new cloud metadata keys into `scene-settings`. |
| `js_libs/aframe_libs/Master_Client_prototype.html` | **Edit in Phase 3** — swap the `<script>` tag for the post-FX module; line ~64. |
| `js_libs/aframe_libs/Simple_Client_prototype.html` | Same as above for simple client parity. |
| `runtime/assets/js/master/vrodos_quality_profiles.js` | **Edit in Addendum §12.** PMNDRS horizon path moves to Takram atmosphere-first wiring; legacy horizon path remains unchanged. |
| Volumetric clouds planning | **Merged into this file** — the earlier standalone volumetric-clouds plan is superseded by Phase 5 here plus the Horizon/Takram addendum in §12. |

---

## 6. Risks & Mitigations

1. **pmndrs/postprocessing (6.x line) + Three r173 compatibility drift.** Mitigation: Phase 0 smoke test and pinned versions; if it fails, abort path is either (a) upgrade Three to a newer r18x as a separate project, or (b) run pmndrs in a second composer alongside the existing VRodos pipeline (dual-composer).
2. **Takram atmosphere integration drift against A-Frame scene assumptions.** Mitigation: PMNDRS-only gating, explicit fallback branch, and visual parity checks against legacy Horizon scenes.
3. **Bundle size growth.** Mitigation: measure in Phase 1. If the delta is meaningful, build a second bundle loaded only when `postFXEnabled=1` (the current bootstrap code in the HTML shells already has the hook points for conditional loading).
4. **Visual regression on existing scenes.** Mitigation: before/after screenshot review of a fixed set of sample scenes at Phase 3 gate. Keep the old `vrodos_postprocessing.js` file in place (just stop wiring it up) for rapid rollback during that window. Only delete in Phase 6 once confidence is high.
5. **Adaptive SAO half-rate regression.** The old behavior is a real user-facing perf feature. Mitigation: explicitly port the FPS rolling-average + cooldown logic verbatim in Phase 2 step 6.
6. **WebXR already-working path accidentally broken.** Mitigation: leave `shouldUsePostProcessing()` guard logic byte-identical. Manually test in a Quest browser (or VR-mode emulator) before merging.

---

## 7. Verification

End-to-end gates — each phase has its own go/no-go:

**Phase 0:**
- Standalone HTML loads pmndrs composer against Three r173. `BloomEffect` renders. `SSAOEffect` / `N8AOPostPass` renders. `SMAAEffect` renders. No WebGL errors in console.

**Phase 1:**
- `node scripts/build-three-r173.mjs` completes. `js_libs/threejs173/vrodos-three-r173.bundle.js` exists. `window.POSTPROCESSING` is defined when the bundle is loaded in a browser. Bundle size delta recorded.

**Phase 2–3:**
- Compile a reference scene with the current post-FX settings (`renderQuality=high`, `postFXBloomEnabled=1`, `ambientOcclusionPreset=balanced`, `aaQuality=high`). Load in master client on desktop Chrome. Visual parity or improvement vs. the old pipeline.
- Same scene on Quest 2 or VR-mode emulator. Enters VR cleanly. No post-FX in VR. Exits VR cleanly.
- Same scene in Simple client.
- Flip `postFXEnabled=0`. Verify no composer is constructed and the baseline A-Frame render path is active.
- FPS parity: on a moderately heavy scene (pick one from the existing projects), compare 30-frame-average FPS before/after on the same hardware. Target: >= old pipeline ±5%.
- Trigger adaptive SAO half-rate by dropping renderer pixel ratio to force sub-30 FPS, confirm N8AO toggles every other frame via `console.log` in the adaptive wrapper.

**Phase 5 (clouds):**
- Compile a scene with `aframeCloudsEnabled=1, aframeCloudsPreset=balanced`, load, confirm volumetric clouds render in both master and simple clients on desktop.
- On mobile UA or VR mode, confirm graceful fallback to the A-Frame environment sky (no clouds, no console errors).
- `renderQuality=high` → cloud shadows on. `renderQuality=standard` → clouds rendered but shadows off.
- Load an old scene with no cloud metadata → compiles and renders with defaults unchanged.

**Phase 6:**
- Search the codebase for references to any deleted helper (`createPhotorealPostMaterial`, `createSAOMaterial`, etc.) → zero results.
- Bundle build + browser smoke test still clean.

---

## 8. Archived Questions (resolved)

1. Runtime dependency direction was resolved in implementation: `postprocessing` + `n8ao` are in scope; `realism-effects` was rejected (see §10).
2. Parallel pipelines were adopted with per-scene `postFXEngine` selection and legacy default (see §11).
3. Phase 6 remains intentionally deferred; legacy hard-delete happens only after a stability window and explicit go decision.

---

## 9. Phase 0 Results (2026-04-07) — GO with caveats

Smoke test built via `scripts/build-phase0-smoke.mjs` → `js_libs/threejs173/vrodos-phase0-smoke.bundle.js` (2,146,507 bytes vs production 1,567,597 bytes; **delta ≈ 580 KB** for postprocessing + n8ao). Driven by `phase0-pmndrs-smoke-test.html` against A-Frame 1.7.1 + Three r173.

### Verified working
- ✅ `new EffectComposer(renderer)` constructs against Three r173 — no errors.
- ✅ `RenderPass` + `EffectPass` merging — multiple effects fused into one fragment shader pass.
- ✅ **Production-candidate pipeline** rendered cleanly at **1920×1080 over 10 frames, NO_ERROR**:
  `BloomEffect + BrightnessContrastEffect + HueSaturationEffect + VignetteEffect + ToneMappingEffect(ACES_FILMIC) + FXAAEffect`
- ✅ HalfFloat HDR framebuffer type works.
- ✅ UnsignedByte framebuffer type also works (fallback path available).
- ✅ Dispose / rebuild cycles clean — 3× sequential `composer.dispose()` + reconstruct loops, NO_ERROR.

### Known issues / workarounds
- ❌ **`SMAAEffect` is broken inside `EffectPass` on r173 + A-Frame 1.7.1.** Even with lookup textures (`searchImageDataURL` / `areaImageDataURL`) loaded directly via `new Image()`, SMAA throws `INVALID_OPERATION` when routed through EffectPass. SMAA's internal `edgeDetectionPass` and `weightsPass` render NO_ERROR in isolation, so the issue is the EffectPass texture binding contract on this Three version. **Workaround for Phase 2: use `FXAAEffect` instead.** Revisit SMAA when (or if) we upgrade Three to r18x.
- ❌ **`N8AOPostPass` from `n8ao@1.10.1` throws `INVALID_OPERATION`** on first render against r173. **Workaround for Phase 2: fall back to pmndrs `SSAOEffect`** (constructs cleanly; render path to be confirmed in Phase 2 isolation test). Alternatively, pin a different n8ao version compatible with r173 — investigate during Phase 1.
- ⚠️ **Critical setup gotcha**: `composer.setSize(w, h)` MUST be called with non-zero dimensions before the first `composer.render()`. If A-Frame's canvas reports `width=0` (e.g. when overlays are present, or the scene hasn't laid out yet), the first composer render throws `INVALID_FRAMEBUFFER_OPERATION (0x506)`. Phase 2 must guard for this — ideally hook composer construction off A-Frame's `loaded` event AND call `setSize()` with `renderer.domElement.clientWidth || window.innerWidth` fallback.

### Verdict: **GO**
The architectural win — fused EffectPass for color grading / bloom / tonemap / vignette / AA — is achieved. SMAA and N8AO failures do not block the migration; the fallback choices (FXAA for AA, pmndrs SSAOEffect for AO) are well-understood and within the pmndrs ecosystem. (Historical note: the realism-effects path referenced here was later rejected in §10.)

### Phase 1 entry checklist
1. Decide on AA strategy in Phase 2: FXAA-only for v1, or attempt SMAA workaround (separate `SMAAPass` outside EffectPass) as a stretch.
2. Decide on AO strategy in Phase 2: pmndrs `SSAOEffect` (default), or investigate n8ao version pinning.
3. (Obsolete after §10) Evaluate optional third-party SSR/TRAA path.
4. Phase 2 module must handle the `setSize()` zero-canvas case explicitly.

---

## 10. Phase 1 Results (2026-04-07) — DONE

### Bundle extension
`scripts/build-three-r173.mjs` extended to import `postprocessing` and `n8ao` and re-export them onto `window.POSTPROCESSING` and `window.N8AOPostPass` alongside the existing `window.THREE` / `window.Stats` exports. The build runs cleanly.

### Bundle size delta
| | bytes | MB |
|---|---:|---:|
| Before (Three r173 + examples only) | 1,567,597 | 1.49 |
| After (+ postprocessing 6.39 + n8ao 1.10.1) | 2,371,897 | 2.26 |
| **Delta** | **+804,300** | **+0.77 (+51%)** |

This is a meaningful but not show-stopping growth. The new pipeline is gated on `postFXEnabled` / `renderQuality === 'high'` at runtime, not at load, so we are paying parse cost on all desktop scenes whether they enable the new pipeline or not. **Decision: do NOT split into a lazy secondary bundle for v1.** Re-evaluate after Phase 3 if mobile boot times regress; the bootstrap shells already have hook points for conditional script loading if it becomes necessary.

### Static bundle verification
- `window.POSTPROCESSING` assignment is present in the IIFE.
- `window.N8AOPostPass` assignment is present in the IIFE.
- `EffectComposer`, `SMAAEffect`, `BloomEffect`, `ToneMappingEffect`, `SSAOEffect`, `N8AOPostPass` symbols are all present in the bundle (esbuild minifies class names so a literal `class EffectComposer` regex misses them — symbol presence confirmed via substring search).

### realism-effects: REJECTED
`realism-effects@1.1.2` (last published 2022) declares a peer dep of `three: '>=0.148.0'` but actually imports `WebGLMultipleRenderTargets`, which Three removed in r162. Bundling fails immediately with `No matching export in three.module.js for import "WebGLMultipleRenderTargets"`. The package is effectively pinned to ≤r161 and abandoned. **Removed from `package.json` devDependencies and never bundled.**

### Phase 1 → Phase 2 entry checklist
1. **AA**: `FXAAEffect` only. SMAA workaround (separate `SMAAPass` outside EffectPass) deferred — not worth the complexity for v1.
2. **AO**: pmndrs `SSAOEffect` only. n8ao stays bundled-but-unused for now in case a future Three upgrade unblocks it; remove from bundle in Phase 6 if still broken.
3. **SSR / TRAA**: not supported in the new pipeline. See §11. Old pipeline retains them.
4. **Defensive setSize**: Phase 2 module must guard against zero-width canvas race (see §9).

---

## 11. SSR / TRAA + Pipeline Selection Architectural Decision (2026-04-07)

### Decision
**Two pipelines, mutually exclusive, per-scene selection, zero blending.**

1. The new pmndrs-based pipeline (`vrodos_postprocessing_pmndrs.js`) is a **clean room** — it does not import, call, or share render targets with anything from the legacy file. pmndrs's optimized internal state stays uncontaminated.
2. The legacy pipeline (`vrodos_postprocessing.js`) stays exactly as it is, retaining hand-rolled SSR and Halton-jitter TAA.
3. Scenes pick **one** engine via the new `postFXEngine` scene-settings field (`'legacy' | 'pmndrs'`), exposed as a dropdown in the scene compilation dialog. There is no layering, no "legacy effects on top of pmndrs", no shared composer.
4. **The new pmndrs-based pipeline does NOT implement SSR or TRAA.** Scenes that need those effects pick `postFXEngine='legacy'` and give up access to the new pipeline's features (clouds in Phase 5, fused EffectPass).
5. v1 default is `'legacy'` so existing and newly-compiled scenes keep current behaviour. Default flips to `'pmndrs'` only after Phase 3 ships and parity is confirmed.

### Why
1. **No actively-maintained, r173-compatible drop-in exists.**
   - `pmndrs/postprocessing` 6.x **explicitly removed** SSR and TAA from the library; the maintainers consider both effects out-of-scope (too sensitive to scene topology and renderer state to ship as a generic effect).
   - `realism-effects` (the de facto community SSR/TRAA package) is incompatible with Three r162+ and unmaintained — see §10.
   - Three's stock `SSRPass` in `examples/jsm` is fragile, doesn't slot into the pmndrs `EffectComposer` cleanly, and would require us to maintain a custom `Pass` wrapper.
2. **Wrapping the existing VRodos custom SSR/TAA shaders inside a custom pmndrs `Pass`** would weaken the architectural thesis ("pmndrs is the pipeline") and create a hybrid surface area we then have to debug. Not worth it.
3. **Parallel pipelines were already approved** (user decision, see conversation context). The legacy pipeline stays in the codebase through Phase 6 anyway. SSR/TRAA scenes simply route to it.
4. **The visible quality win** from the new pipeline — fused EffectPass for Bloom + AO + ToneMap + Color + Vignette + AA — is independent of SSR/TRAA. Most scenes that opt into the new pipeline are doing it for clouds (Phase 5) and/or the cleaner color/bloom stack, not for reflections.

### Runtime behaviour
When `vrodos_postprocessing_pmndrs.js` is the active pipeline and a scene has `postFXSSREnabled='1'` or `postFXTAAEnabled='1'`:

- The flag is silently honored as "no-op" (effect not constructed).
- A one-time `console.info('[VRodos] SSR/TRAA requested but not available in pmndrs pipeline — use legacy pipeline if required')` is logged per scene load.
- No scene-settings schema change. The flags keep their meaning on the legacy path.

### Pipeline selection (resolved)
Selection is per-scene via `postFXEngine` (`legacy | pmndrs`) serialized in scene metadata and exposed in the compile dialog. No global auto-fallback logic is used.

### Future re-evaluation
Revisit if any of the following happen:
1. pmndrs/postprocessing reintroduces SSR/TAA (unlikely — they removed them deliberately).
2. A new community SSR/TRAA library targeting Three r170+ emerges and proves stable.
3. We upgrade Three to r18x+ as a separate project, in which case re-test `realism-effects` against whatever the latest version is.

---

## 12. Horizon / Atmosphere Addendum (2026-04-10) — APPROVED

This addendum extends the migration plan so the current PMNDRS horizon regressions are fixed first (gray top cap, missing sun), while keeping the legacy pipeline untouched. It also formalizes the PMNDRS compile-tab controls requested for visual/performance tuning.

### Implementation status (2026-04-10)
- Implemented: PMNDRS Horizon now has a Takram-driven sky path in compiled scenes.
- Implemented: legacy Horizon remains on the A-Frame environment path and was intentionally left behavior-compatible.
- Implemented: PMNDRS compile dialog exposes atmosphere controls plus a `Reset` button that restores the default PMNDRS atmosphere/post-FX values.
- Implemented: PMNDRS Horizon no longer relies on `aframe-environment-component` for visual sky ownership when Takram atmosphere is enabled.
- Implemented: PMNDRS Horizon now keeps a Takram-default sun/sky baseline as the accepted base version, instead of relying on the temporary custom PMNDRS haze-overlay experiments that looked less natural.
- Implemented: PMNDRS sun radius defaults were pulled back toward Takram's native baseline, and the compile dialog keeps fine-grained radius control for later visual tuning.
- Implemented: PMNDRS atmosphere quality now also drives Takram precompute precision so `quality` and `cinematic` reduce visible sunset stepping/banding compared with the lower-cost presets.
- Implemented: PMNDRS Takram Horizon now force-cleans legacy `<a-sun-sky>` runtime remnants, and compiler output skips emitting `<a-sun-sky>` for PMNDRS+Horizon+atmosphere builds to prevent stepped dome artifacts from legacy sky geometry.
- Implemented: local-scene `worldToECEF` bridging was added so Takram can render correctly in VRodos' non-geospatial local world coordinates.
- Accepted baseline: current PMNDRS Horizon visuals are good enough to keep as the base version while sunset banding / realism polish remains a follow-up refinement task rather than a blocker.
- Deferred: Takram volumetric clouds are still pending and should be added on top of this stabilized atmosphere baseline.

### Scope decision
1. **Engine isolation:** PMNDRS-only implementation. Legacy engine remains byte-for-byte behavior-compatible.
2. **Delivery order:** Atmosphere first, clouds later. Build a cloud-ready seam now, but do not enable volumetric clouds in this slice.
3. **UI exposure:** PMNDRS atmosphere controls are visible for **all PMNDRS scenes** in the compile dialog (not only Horizon scenes).
4. **Fallback safety:** if Takram atmosphere construction fails, runtime falls back to the current PMNDRS gradient/sun fallback path without breaking scene render.

### Problem statement this addendum addresses
- The current PMNDRS Horizon workaround can produce:
  - a visible gray cap/disc artifact from `aframe-environment-component` sun mesh behavior under PMNDRS + ACES,
  - missing custom sun due to depth-tested sprite occlusion against large sky geometry.
- Legacy horizon is visually good and must not regress.

### Implementation plan (additive to Phases 4–5)
1. **Bundle/runtime**
   - Extend `scripts/build-three-r173.mjs` to bundle and expose Takram atmosphere classes needed at runtime.
   - Keep local-bundle delivery (no new runtime CDN dependency).

2. **PMNDRS horizon atmosphere path**
   - In `runtime/assets/js/master/vrodos_quality_profiles.js`, replace PMNDRS Horizon sun/sky workaround with a dedicated atmosphere state:
     - create/manage Takram sky material + sun light state under PMNDRS + Horizon gate only,
     - map existing `horizonSkyPreset` values (`natural|clear|crisp`) to atmosphere parameter presets and sun direction,
     - keep legacy horizon branch unchanged.
   - Keep existing PMNDRS fallback sun branch, but harden visibility (`depthTest:false`, `depthWrite:false`, stable render order) for fail-safe correctness.

3. **PMNDRS composer integration (cloud-ready seam)**
   - In `runtime/assets/js/master/vrodos_postprocessing_pmndrs.js`, add `AerialPerspectiveEffect` into the fused `EffectPass`.
   - Lock effect ordering seam for future clouds:
     - future `CloudsEffect` slot (disabled in this slice),
     - then `AerialPerspectiveEffect`,
     - then tonemap/color/vignette/AA.

4. **Compile dialog PMNDRS pro controls**
   - Extend PMNDRS tab UI and JS wiring (`includes/templates/vrodos-edit-3D-scene-CompileDialogue.php`, `js_libs/vrodos_compile_dialogue.js`) with:
     - master toggle + quality preset (`performance|balanced|quality|cinematic|custom`),
     - sun controls (elevation, azimuth, angular radius, distance/intensity-style scale),
     - aerial/atmospheric controls (aerial strength, transmittance, inscatter, ground, ground albedo),
     - scattering controls (Rayleigh, Mie scattering/extinction, Mie anisotropy `g`, absorption),
     - moon toggle.
   - Preset behavior:
     - selecting a quality preset writes all advanced values,
     - editing any advanced knob sets preset to `custom`,
     - reset button restores all PMNDRS defaults (including atmosphere controls).

5. **Data path serialization**
   - Persist new PMNDRS atmosphere fields through:
     - editor scene state bootstrap,
     - scene save/load (`vrodos_ScenePersistence.js`, `vrodos_LoaderMulti.js`),
     - compiler metadata sanitization/serialization (`includes/class-vrodos-compiler-manager.php`),
     - runtime schema (`runtime/assets/js/master/components/vrodos_scene_settings.component.js`).
   - Keep defaults safe and clamped for backward compatibility.

### New PMNDRS atmosphere metadata fields
These fields are PMNDRS-specific and ignored by legacy runtime:

```js
aframePmndrsAtmosphereEnabled
aframePmndrsAtmosphereQuality
aframePmndrsSunElevationDeg
aframePmndrsSunAzimuthDeg
aframePmndrsSunDistance
aframePmndrsSunAngularRadius
aframePmndrsAerialStrength
aframePmndrsAlbedoScale
aframePmndrsTransmittanceEnabled
aframePmndrsInscatterEnabled
aframePmndrsGroundEnabled
aframePmndrsGroundAlbedo
aframePmndrsRayleighScale
aframePmndrsMieScatteringScale
aframePmndrsMieExtinctionScale
aframePmndrsMiePhaseG
aframePmndrsAbsorptionScale
aframePmndrsMoonEnabled
```

### Verification gates for this addendum
1. PMNDRS + Horizon: no gray cap artifact; sun visible in `natural|clear|crisp`.
2. Legacy + Horizon: no visual regression versus current production look.
3. PMNDRS + non-Horizon backgrounds: no regressions from atmosphere controls existing.
4. Compile dialog roundtrip: all PMNDRS atmosphere values save/load/compile consistently.
5. Runtime fallback: if atmosphere init fails, scene still renders with fallback sky path and no crash.
6. VR/mobile guard paths: post-FX gates remain intact and stable.

### Notes on best-practice basis
- Takram atmosphere supports multiple lighting approaches; for VRodos' existing lit/PBR content, light-source-compatible usage is the safe first step.
- Takram clouds documentation requires PMNDRS/postprocessing composer compatibility and ordering (`CloudsEffect` before `AerialPerspectiveEffect`), which this addendum prepares.

### 2026-04-12 convergence decision: can Takram be implemented "by the book" with A-Frame?

Yes, but only with a stricter ownership split than the current hybrid Horizon path.

- **A-Frame remains the host runtime** for ECS, scene graph, entity lifecycle, XR/session handling, input, and compiler-driven scene metadata.
- **Takram owns the Horizon sky frame and lighting model** inside that A-Frame-hosted Three scene.
- **PMNDRS remains the post stack only** for desktop non-XR rendering.

What "by the book" means for VRodos after reviewing the Takram docs and the current implementation history:

1. Use one authoritative Takram state for:
   - `worldToECEFMatrix`
   - anchor position in ECEF
   - sun/moon direction in ECEF
   - visible sky ownership
   - Takram lighting objects
2. Use Takram's light-source path first:
   - `SkyMaterial`
   - `SunDirectionalLight`
   - `SkyLightProbe`
3. Do **not** mix that path with:
   - A-Frame `environment` sky/sun visuals
   - legacy `a-sun-sky`
   - VRodos helper lights
   - fallback visible sun sprites
4. Keep `AerialPerspectiveEffect` **off** for local Horizon scenes in the current stack until the PMNDRS depth/normal path is clean. The white-cap and `glBlitFramebuffer` failures showed that our present Horizon path is not ready for Takram's post-process route.
5. Treat local VRodos Horizon scenes as **non-geospatial authored scenes**. That means:
   - Takram sky/light is still useful,
   - Takram ellipsoid ground is not the right owner for the lower half of the scene,
   - authored VRodos geometry remains the visual ground/world.

### Consolidated implementation phases after the 2026-04-12 review

These phases replace the now-redundant standalone Horizon/Takram planning doc.

1. **Phase 5A — structural cleanup**
   - Centralize PMNDRS Horizon/Takram mode detection.
   - Move Horizon-only Takram state under one runtime state object.
   - Keep rendering behavior intentionally close to the accepted PMNDRS baseline.
2. **Phase 5B — Takram-first light-source path**
   - Replace helper-light ownership with `SunDirectionalLight` + `SkyLightProbe`.
   - Keep `SkyMaterial` as the visible Horizon owner.
   - Keep Takram ground disabled for local Horizon scenes.
3. **Phase 5C — reflection/path consistency**
   - Make scene-probe capture the same Takram sky owner used by the visible scene.
   - Continue excluding legacy environment leftovers.
4. **Phase 5D — clouds follow-up**
   - Add Takram clouds only after the Takram-first light-source baseline is stable.
   - Preserve the documented PMNDRS effect ordering seam.

---

## 13. Runtime Source Of Truth

The active runtime pair is now pinned in one place:

- `includes/class-vrodos-render-runtime-manager.php`

That file defines:

- the A-Frame runtime URL
- the matching Three vendor directory
- the matching Three vendor bundle

VRodos is no longer treating stable and master as interchangeable runtime profiles for this migration. The current goal is to make the latest supported A-Frame/Three pair work as the single active stack.

## 14. Current AA Direction

Current live decision on the pinned A-Frame master + Three r181 stack:

- Disable `FXAAEffect` in the PMNDRS runtime.
- Reason: live Horizon validation showed that PMNDRS FXAA introduces a visible sun halo/ring artifact.
- PMNDRS AA now uses an exclusive mode model that matches the official PMNDRS demo more closely:
  - `none`
  - `smaa`
  - `msaa`
- PMNDRS AA preset is separate from mode:
  - `low`
  - `medium`
  - `high`
  - `ultra`
- Runtime mapping:
  - `smaa` -> `SMAAEffect` only, using the selected PMNDRS preset
- `msaa` -> composer multisampling only, using sample-count tiers derived from the selected PMNDRS preset and clamped to the renderer's supported max
- Current default direction: default new PMNDRS scenes to `none`, and let authors opt into `smaa` or `msaa` explicitly.
- Backward compatibility rule: scenes that were already authored against PMNDRS before explicit PMNDRS AA metadata existed may still derive their initial PMNDRS AA choice from the historical shared `aaQuality` field until they are re-saved.
- PMNDRS `SMAA` and composer `MSAA` are official supported features of `postprocessing`; the risk here is project-specific quality/performance tradeoff on the current VRodos scene/runtime, not lack of PMNDRS support.
- Compile-dialog roundtrip for PMNDRS AA now depends on all of these links being in place:
  - dialog -> `envir.scene`
  - `envir.scene` -> scene JSON metadata
  - scene JSON metadata -> loader hydration back into `envir.scene`
  - dialog sync resolving only real option values (`none|smaa|msaa` and `low|medium|high|ultra`) instead of transient internal fallback values
- Runtime debug helpers added during diagnosis:
  - `?vrodos_debug_pmndrs_aa=1` shows the live PMNDRS AA mode, preset, requested/applied MSAA samples, SMAA presence, and fallback state
  - `?vrodos_debug_nav_perf=1` shows movement/collision timing, raycast count, and navmesh intersection volume
- Current real-scene findings on the marina stress scene:
  - `MSAA high` is genuinely active (`requested 8`, `applied 8`, `fallback none`) but still leaves visible aliasing on thin linework, small distant silhouettes, and strong specular highlights
  - `SMAA high` improves image quality but still leaves visible jaggies on boats, pavement, and fence detail
  - `SMAA ultra` looks materially better, but the frame-rate drop is too severe for this scene
  - Legacy FXAA still produces the best perceived cleanup for this particular scene, even though PMNDRS AA is functioning correctly
- Current practical direction:
  - keep PMNDRS AA controls available
  - keep PMNDRS default AA at `none`
  - do not spend additional migration time chasing PMNDRS-vs-legacy AA parity before resuming the next Takram phase
- Performance diagnosis update:
  - idle PMNDRS AA cost is not the whole slowdown story
  - the movement-triggered FPS dips were confirmed to spike only when ground/navmesh collision sampling runs
  - the first low-risk optimization is now in place: collision raycasts use a flattened list of navmesh mesh targets instead of recursively traversing root hierarchies on every probe
- Historical Phase 0 notes about FXAA as a fallback remain useful only as migration history from the older r173 stack; they are no longer the active AA decision for live PMNDRS scenes.

## 15. Resume Point

When work resumes in a new thread, treat the AA investigation as sufficiently understood for now:

- Horizon artifact root cause: PMNDRS `FXAAEffect`
- PMNDRS AA status: working, but scene-dependent in quality/performance
- Collision-performance status: confirmed movement hot spot; first navmesh-target flattening optimization already applied
- Recommended next roadmap slice: continue the next Takram/PMNDRS integration phase rather than spending more time on AA tuning

## 16. Reference Links

- pmndrs/postprocessing: <https://github.com/pmndrs/postprocessing>
- pmndrs/postprocessing WebXR research issue #677: <https://github.com/pmndrs/postprocessing/issues/677>
- N8AO: <https://github.com/N8python/n8ao>
- @takram/three-atmosphere + @takram/three-clouds: <https://github.com/takram-design-engineering/three-geospatial>
- Takram atmosphere README (lighting modes, limitations): <https://raw.githubusercontent.com/takram-design-engineering/three-geospatial/main/packages/atmosphere/README.md>
- Takram clouds README (composer compatibility + effect ordering): <https://raw.githubusercontent.com/takram-design-engineering/three-geospatial/main/packages/clouds/README.md>
- three.js#33292 (Takram clouds example, merged into r184): <https://github.com/mrdoob/three.js/pull/33292>
