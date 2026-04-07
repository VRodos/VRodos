# Post-Processing Pipeline Analysis & Migration Plan
## (covers: volumetric clouds feasibility + pmndrs/postprocessing migration)

## Context

This document answers two linked questions:

1. Can the Takram volumetric clouds/atmosphere work from [three.js#33292](https://github.com/mrdoob/three.js/pull/33292) be dropped into the VRodos A-Frame compiled-scene runtime "effortlessly"?
2. Since `@takram/three-clouds` peer-depends on [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing) (not Three's built-in `EffectComposer` that VRodos currently uses), the bigger question arises: **is pmndrs/postprocessing better than VRodos' current hand-built pipeline? Should we replace ours with it, leverage it, and unlock Takram for free?**

Initial answer to #1: **no, not effortlessly** — there is a hard architectural mismatch. But the fix for that mismatch (migrating to pmndrs) turns out to be a net win in its own right, and this plan lays that out.

This plan compares the four realistic options (A-Frame defaults, stock Three post-FX, VRodos' current custom pipeline, pmndrs/postprocessing), recommends a route, and sketches the migration in phases.

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
| Three r173 compatibility | yes | yes | yes | yes (v7 tracks latest Three; ≥ r167 is safe per Takram peer range) — **needs one smoke test** | `realism-effects` has historically lagged Three updates; pin carefully |
| Maintenance burden | none | low | **high — all in-house** | low | medium |
| Required to unlock `@takram/three-clouds` | no | no | no | **yes** | yes |

**Key observations**

- VRodos' single best architectural idea — **fusing all enabled effects into one specialized fragment shader** — is the *exact same thing* pmndrs' `EffectPass` does automatically. Migrating does not lose the optimization; it shifts it from in-house code to a maintained library.
- VRodos beats pmndrs core on **SSR, TAA, and adaptive SAO half-rate** — none of these ship in pmndrs core. SSR and TAA live in `realism-effects` (0beqz). Adaptive SAO half-rate doesn't exist anywhere; it would need to be re-implemented against `N8AOPass` via a custom frame-skip wrapper.
- pmndrs beats VRodos on **SMAA quality, N8AO quality, DoF, god rays, LUT color grading, outline-as-effect, tone mapping algorithms** — and on the feature *ceiling* generally, because the library is actively maintained by a larger community.
- WebXR is **a non-issue**. VRodos already turns post-FX off in VR. Whichever library is in use on desktop, the VR path is the same plain A-Frame rendering.
- A-Frame's stock environment and stock Three `EffectComposer` are both strictly worse than what VRodos already has and are not serious contenders.

---

## 3. Recommendation

**Migrate to pmndrs/postprocessing as the core desktop post-FX pipeline, using `realism-effects` for SSR/TRAA.**

Why this wins:

1. **Quality up**. SMAA > FXAA. N8AO >= VRodos' custom SAO (subjective, but strongly held community consensus). `BloomEffect` with a mipmap chain is better than 2-pass Gaussian. LUT color grading is a real win for authored looks. DoF and god rays become available at essentially zero cost-to-add.
2. **Maintenance down**. ~600 lines of custom `vrodos_postprocessing.js` + several custom shader files (`vrodos_shaders_sao.js`, `vrodos_shaders_ssr.js`, `vrodos_shaders_bloom.js`, `vrodos_shaders_taa.js`, `vrodos_shaders_fxaa.js`, composite material) collapse into a small adapter layer that configures pmndrs effects from the `scene-settings` schema.
3. **Cloud feature unlocked for free**. Once pmndrs is the composer, `@takram/three-atmosphere` and `@takram/three-clouds` (from three.js#33292) plug in as two more effects in the same chain. No dual-composer hack.
4. **Same architectural win**. pmndrs' `EffectPass` merges enabled effects into one fragment shader — the exact trick VRodos currently hand-maintains.
5. **Future effects come for free**: chromatic aberration, pixelation, scan-line, glitch, shock-wave, etc., if ever authored in the editor UI.

Acceptable losses / carry-overs:

- **Adaptive SAO half-rate** (FPS-reactive subsampling) — re-implement as a small wrapper that skips `n8aoPass.render()` on odd frames when rolling FPS < 30. The existing FPS rolling-average code in `vrodos_postprocessing.js` lines 282–315 ports over verbatim.
- **TAA tuning**: switch to `realism-effects` `TRAAEffect` (or pmndrs' built-in TAA in v7 if it's stable on r173 — to be verified during the proof-of-concept). Keep the user-facing `postFXTAAEnabled` flag so compiled scenes are unchanged.
- **ACES tone mapping**: set `renderer.toneMapping = ACESFilmicToneMapping` and use pmndrs' `ToneMappingEffect` properly instead of the XR render-target hack. Cleaner.
- **MSAA/Depth trade-off**: pmndrs handles the depth-texture/MSAA exclusivity internally; the logic at lines 97–115 can be removed.

---

## 4. Migration Plan (Phased)

### Phase 0 — Compatibility proof-of-concept (half a day)

Before touching any production code, build a throwaway HTML page that loads:

- A-Frame 1.7.1
- The existing `vrodos-three-r173.bundle.js`
- pmndrs `postprocessing` v7 (from a local `npm install postprocessing`)
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

- `npm install postprocessing realism-effects n8ao` (pin versions after Phase 0 confirms compatibility).
- Import them and re-export onto globals alongside `window.THREE`:
  ```js
  import * as POSTPROCESSING from 'postprocessing';
  import * as REALISM from 'realism-effects';
  import { N8AOPostPass } from 'n8ao';
  window.POSTPROCESSING = POSTPROCESSING;
  window.REALISM = REALISM;
  window.N8AOPostPass = N8AOPostPass;
  ```
- Rebuild (`node scripts/build-three-r173.mjs`).
- Record bundle size before/after. Expect a meaningful growth (LUT textures, SMAA textures); if it crosses a threshold the team cares about, split into a lazy secondary bundle loaded only when `postFXEnabled=1`.

### Phase 2 — New runtime module `vrodos_postprocessing_pmndrs.js`

Create `runtime/assets/js/master/vrodos_postprocessing_pmndrs.js` (sibling to the existing file — do not delete the old one yet). Responsibilities:

1. On `scene-settings` `init()`, if `renderQuality === 'high'` and not in VR, build a pmndrs `EffectComposer` on the A-Frame renderer.
2. Add a `RenderPass(scene, camera)` first.
3. Conditionally construct effects from the scene-settings schema:
   - `aaQuality` → `SMAAEffect({ preset: … })` (map `balanced|high|ultra` onto `SMAAPreset.MEDIUM|HIGH|ULTRA`).
   - `ambientOcclusionPreset !== 'off'` → `N8AOPostPass` (separate pass, added before the final EffectPass).
   - `postFXSSREnabled === '1'` → `realism-effects` `SSREffect`.
   - `postFXTAAEnabled === '1'` → `realism-effects` `TRAAEffect` (or pmndrs TAA if v7 exposes it stably on r173).
   - `bloomStrength !== 'off'` → `BloomEffect({ intensity, luminanceThreshold })`.
   - `postFXColorEnabled === '1'` → `BrightnessContrastEffect` + `HueSaturationEffect`.
   - `postFXVignetteEnabled === '1'` → `VignetteEffect`.
   - Always → `ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC })`.
4. Stuff all "merge-friendly" effects (i.e. everything except `N8AOPostPass`, SMAA, SSR, TRAA which are separate `Pass`es by design) into a single `EffectPass(camera, …)` at the end.
5. Install the same `renderer.render` monkey-patch shape as the current code, but delegate to `composer.render(deltaTime)` instead. Keep the `shouldUsePostProcessing()` gate unchanged (VR fallback preserved).
6. Re-implement **adaptive SAO half-rate** as a thin wrapper around the N8AOPass: track the same 30-frame rolling FPS window from the old file (lines 282–315), and when active, call `n8aoPass.enabled = (frameCounter & 1) === 0` to skip every other frame.
7. On disable / scene teardown, `composer.dispose()` and null everything — same lifecycle as the current code.

### Phase 3 — Wire the new module into the HTML shells

- `js_libs/aframe_libs/Master_Client_prototype.html`: replace the `<script src="js/master/vrodos_postprocessing.js">` line (around line 64 in the current file) with the new module. Keep the existing shader helper files (`vrodos_shaders_*.js`) loaded **only until Phase 6** — they're harmless but unused.
- `js_libs/aframe_libs/Simple_Client_prototype.html`: same change for parity.
- Run a compiled scene with clouds/atmosphere features flagged **off**, and confirm visually that SMAA + N8AO + Bloom + Tone mapping produce output that is at least as good as the old pipeline. Capture screenshots at identical camera positions for before/after review.

### Phase 4 — Scene-settings schema (no new cloud fields yet)

No schema changes required in Phase 4. Existing fields (`postFXBloomEnabled`, `postFXSSREnabled`, `postFXTAAEnabled`, etc.) keep their current meaning. The mapping from those strings to pmndrs effect construction lives entirely inside `vrodos_postprocessing_pmndrs.js`.

This is important: **compiled scenes out there in the wild continue to work unchanged** — they still write the same `scene-settings` attribute, only the runtime interpretation of those fields changes.

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
| `runtime/assets/js/master/vrodos_quality_profiles.js` | **No changes.** `applyHorizonSkyPreset` at lines 178–210 remains the fallback path when clouds/atmosphere are off or on mobile/XR. |
| `VOLUMETRIC_CLOUDS_IMPLEMENTATION_PLAN.md` | **Update after Phase 5** — its current assumption of "port shader logic ourselves" is superseded by "use Takram packages via pmndrs composer." |

---

## 6. Risks & Mitigations

1. **pmndrs/postprocessing v7 + Three r173 compatibility.** Mitigation: Phase 0 smoke test. If it fails, the abort path is either (a) upgrade Three to a newer r18x as a separate project, or (b) run pmndrs in a second composer alongside the existing VRodos pipeline (dual-composer).
2. **`realism-effects` quality and Three-version drift.** Mitigation: pin the exact version in `package.json`; write a small fallback so that if SSR or TRAA construction throws, the composer builds without them and logs a warning, rather than crashing the scene.
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

## 8. Open Questions (answer before starting Phase 0)

1. Are we OK taking on three new runtime deps (`postprocessing`, `realism-effects`, `n8ao`) plus the two Takram packages in Phase 5? All are MIT/similar-permissive.
2. During the parallel-pipelines window (Phases 3–6), do we ship with a runtime feature flag so the old pipeline can be forced on for rollback, or do we switch all-in at Phase 3 gate? (The former is safer, the latter is cleaner.)
3. Phase 6 cleanup is listed as a hard delete. Are you comfortable with that, or do you want the old files retained as `.deprecated.js` for one release cycle?

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
The architectural win — fused EffectPass for color grading / bloom / tonemap / vignette / AA — is achieved. SMAA and N8AO failures do not block the migration; the fallback choices (FXAA for AA, pmndrs SSAOEffect for AO) are well-understood and within the pmndrs ecosystem. Realism-effects SSR/TRAA remains unverified (deferred to Phase 1/2).

### Phase 1 entry checklist
1. Decide on AA strategy in Phase 2: FXAA-only for v1, or attempt SMAA workaround (separate `SMAAPass` outside EffectPass) as a stretch.
2. Decide on AO strategy in Phase 2: pmndrs `SSAOEffect` (default), or investigate n8ao version pinning.
3. Smoke-test `realism-effects` SSR/TRAA construction in Phase 1 bundle before committing in Phase 2.
4. Phase 2 module must handle the `setSize()` zero-canvas case explicitly.

---

## 10. Reference Links

- pmndrs/postprocessing: <https://github.com/pmndrs/postprocessing>
- pmndrs/postprocessing WebXR research issue #677: <https://github.com/pmndrs/postprocessing/issues/677>
- realism-effects (0beqz, SSR/SSGI/TRAA): <https://github.com/0beqz/realism-effects>
- N8AO: <https://github.com/N8python/n8ao>
- @takram/three-atmosphere + @takram/three-clouds: <https://github.com/takram-design-engineering/three-geospatial>
- three.js#33292 (Takram clouds example, merged into r184): <https://github.com/mrdoob/three.js/pull/33292>
