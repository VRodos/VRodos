# VRodos Rendering Pipeline — Technical Reference

> Canonical reference for the compiled A-Frame scene's post-processing pipeline, shader architecture, and runtime quality system. For end-user feature summaries, see `README.md`. For historical debugging notes and WebGLRenderer quirks, see `POSTFX_DEBUG_NOTES.md`.

---

## 1. Pipeline Overview

The compiled runtime uses a custom `renderer.render` hijack to insert a multi-pass post-processing pipeline between A-Frame's scene render and the final screen output. The component responsible is `scene-settings` at `runtime/assets/js/master/components/vrodos_scene_settings.component.js`, and the helpers live alongside it.

### Full pipeline (all effects active)

```
Scene (jittered when TAA on)
  → postProcessingTarget               (ACES + sRGB applied by Three.js via isXRRenderTarget trick)
      → SAO               (half-res, 3 passes: raw AO → H blur → V blur)   [optional, adaptive rate]
      → SSR               (half-res, 1 pass: ray march + binary refine)    [optional]
      → Bloom             (half-res, 3 passes: bright-pass → H blur → V blur) [optional]
      → Composite         (AO × scene + SSR + bloom + grading + vignette)  [specialized per-scene via #define]
  → TAA                   (full-res ping-pong, Catmull-Rom history + YCoCg variance clip) [optional]
  → Final blit            (passthrough to screen if TAA, FXAA if !TAA && FXAA, direct if neither)
```

Every stage except the scene render and composite is **conditional** — disabled stages consume zero GPU, zero VRAM, and zero shader compile cost.

---

## 2. File Organization

### Shader factories (one effect per file)

| File | Exports on `VRODOSMaster` |
|------|---------------------------|
| `runtime/assets/js/master/vrodos_shaders_bloom.js` | `createBrightPassMaterial`, `createGaussianBlurMaterial` |
| `runtime/assets/js/master/vrodos_shaders_sao.js` | `createSAOMaterial`, `createSAOBlurMaterial` |
| `runtime/assets/js/master/vrodos_shaders_fxaa.js` | `createFXAAMaterial` |
| `runtime/assets/js/master/vrodos_shaders_taa.js` | `createTAAMaterial` |
| `runtime/assets/js/master/vrodos_shaders_ssr.js` | `createSSRMaterial` |
| `runtime/assets/js/master/vrodos_shaders_composite.js` | `createPhotorealPostMaterial(features)` |

Each shader file is an IIFE that registers its factory on `window.VRODOSMaster`. They have zero inter-dependencies.

### Component helpers (`VRODOSMaster.SceneSettingsHelpers` namespace)

| File | Contents |
|------|----------|
| `runtime/assets/js/master/vrodos_postprocessing.js` | `enablePostProcessing`, `disablePostProcessing`, `updatePostProcessingSize`, `syncPostProcessingState` — owns the render loop patch, RT creation/disposal, and all post-FX state |
| `runtime/assets/js/master/vrodos_scene_probe.js` | 15 scene-probe / HDR env-map functions |
| `runtime/assets/js/master/vrodos_quality_profiles.js` | 9 quality-profile functions (render, shadow, material, background, post-FX, horizon sky, helper lights) |

Helper functions are defined on `VRODOSMaster.SceneSettingsHelpers` and the component's methods are simple property-reference delegates:

```javascript
// In the component:
enablePostProcessing: VRODOSMaster.SceneSettingsHelpers.enablePostProcessing,
```

`this` binding is preserved because the methods are still invoked as `component.enablePostProcessing()`.

### Remaining core

| File | Role |
|------|------|
| `runtime/assets/js/master/vrodos_master_rendering.js` | `RGBELoader` (embedded, single copy), material enhancement, navmesh utilities, basic utility exports |
| `runtime/assets/js/master/components/vrodos_scene_settings.component.js` | Schema, init/remove/tick lifecycle, FPS meter, value getters, delegate assignments |

### Load order (`js_libs/aframe_libs/Master_Client_prototype.html`)

```
vrodos_master_shared.js                 (VRODOSMaster namespace)
vrodos_master_bootstrap.js              (bootstrap)
vrodos_master_rendering.js              (RGBELoader + material utils)
vrodos_shaders_*.js                     (6 shader files — register factories)
vrodos_postprocessing.js                (register SceneSettingsHelpers)
vrodos_scene_probe.js                   (register SceneSettingsHelpers)
vrodos_quality_profiles.js              (register SceneSettingsHelpers)
components/vrodos_scene_settings.component.js   (consumes all of the above)
```

---

## 3. The `isXRRenderTarget` Color-Encoding Trick

**The single most important architectural detail.** In Three.js r173, rendering to a `WebGLRenderTarget` *skips* tone mapping and output color-space encoding — both are only applied on direct-to-screen or XR-target renders. This means a naive composite pipeline reads raw linear un-tone-mapped values from its render target, producing a washed-out, low-contrast image that's hard to correct in shader space.

**The fix** (`vrodos_postprocessing.js` → `enablePostProcessing`):

```javascript
this.postProcessingTarget = new THREE.WebGLRenderTarget(width, height, targetOptions);
this.postProcessingTarget.isXRRenderTarget = true;
this.postProcessingTarget.texture.colorSpace = THREE.SRGBColorSpace;
```

Setting `isXRRenderTarget = true` routes the RT through Three.js's XR code path, which applies **both** ACESFilmic tone mapping **and** sRGB encoding during the scene render. The resulting RT contains display-ready values, so the composite shader does zero color-space work.

Full diagnostic history in `POSTFX_DEBUG_NOTES.md`.

### MSAA trade-off

Attaching a `DepthTexture` (needed for SAO, SSR, TAA depth reads) **disables MSAA** on the RT — Three.js has a WebGL2 limitation where depth attachments and multisampled color attachments cannot coexist on the same FBO. Resolution: FXAA compensates in post, and TAA provides higher-quality AA when enabled.

---

## 4. Composite Shader Specialization

The composite shader (`vrodos_shaders_composite.js`) is compiled with **per-scene feature flags** via `#define` specialization. Because post-FX settings are static per session (no A-Frame `update` hook on `scene-settings`), this compile-time specialization is both safe and optimal.

### API

```javascript
VRODOSMaster.createPhotorealPostMaterial({
    sao: true,
    ssr: false,
    bloom: true,
    colorGrading: true,
    vignette: true
});
```

### Defines emitted

- `VRODOS_USE_SAO` — compile in the `tSAO` sampler, the AO-multiply path
- `VRODOS_USE_SSR` — compile in `tSSR` + `ssrStrength` + Fresnel blend
- `VRODOS_USE_BLOOM` — compile in `tBloom` + `bloomStrength` + additive blend
- `VRODOS_USE_COLOR_GRADING` — compile in `saturation` + `contrast` + `applySaturation()`
- `VRODOS_USE_VIGNETTE` — compile in `vignetteStrength` + distance/smoothstep math

Disabled effects have **zero cost**: zero texture fetch, zero uniform slot, zero ALU. Uniforms are only declared (in the shader) and created (in the JS uniforms object) for active features.

### Runtime

`enablePostProcessing` computes `this._compositeFeatures` once and Pass 5 reads from it to decide which uniforms to touch:

```javascript
if (compFeatures.bloom) compUniforms.bloomStrength.value = bloomValue;
if (compFeatures.colorGrading) { compUniforms.saturation.value = ...; ... }
```

Each compiled scene gets its own WebGL program matching its feature set — a small one-time compile cost at first render, amortized over the session.

---

## 5. Lazy Pass Instantiation

Since post-FX settings are static per session, disabled effects never allocate resources at all.

| Effect | Gate | Savings when off (1080p) |
|--------|------|--------------------------|
| **Bloom** | `getBloomStrengthValue() > 0` | 2 × half-res RT (~4 MB) + 3 material compiles |
| **SAO** | `getSAOParams() !== null` | 2 × half-res RT (~4 MB) + 2 material compiles |
| **SSR** | `isPostFXOptionEnabled('postFXSSREnabled')` | 1 × half-res RT (~2 MB) + 1 material compile |
| **TAA** | `isPostFXOptionEnabled('postFXTAAEnabled')` | 2 × full-res RT (~16 MB) + 1 material compile |
| **FXAA material** | `fxaaEnabled && !taaEnabled` | 1 material compile |
| **FXAA/TAA shared buffer** | `fxaaEnabled \|\| taaEnabled` | 1 × full-res RT (~8 MB) |

`fxaaTarget` + `fxaaScene`/`fxaaQuad` are shared between FXAA and TAA: FXAA uses them as its final blit pass; TAA uses them as its temp composite buffer and final `taaBlitMaterial` passthrough. `fxaaMaterial` itself is only created when FXAA is the final pass (skipped entirely when TAA is on — see §6).

All runtime branches guard on resource existence (`useFXAA = ... && this.fxaaTarget && this.fxaaMaterial`), and `updatePostProcessingSize` has null-guards on every target/material. Adding a new optional pass requires gating in `enablePostProcessing`, a runtime existence check, and a null-guard in the resize handler.

---

## 6. Temporal Anti-Aliasing (TAA)

TAA is a temporal accumulator with **no depth reprojection** — history is sampled at the same UV and clipped to the current frame's 3×3 neighborhood. Depth reprojection caused persistent ghost/duplicate artifacts in early experiments; the simpler same-UV approach combined with aggressive neighborhood clipping preserves thin geometry and avoids ghosts at the cost of slightly less temporal stability.

### Key design decisions

| Parameter | Value | Why |
|-----------|-------|-----|
| Jitter sequence | Halton(2, 3), 16 samples | Low-discrepancy, well-distributed sub-pixel sampling |
| Jitter magnitude | **±0.375 px** | Lowered from ±0.5 — less sub-pixel drift per frame = less accumulated softening |
| History sampling | **5-tap Catmull-Rom (Jimenez)** | Bilinear sampling of the history buffer at jittered UVs compounds softening on every frame; Catmull-Rom preserves high-frequency texture detail through arbitrary resample counts |
| Neighborhood clipping | YCoCg, 3×3, **1.0 σ** AABB | Tighter than the common 1.5 σ — rejects stale blurry history more aggressively |
| Adaptive blend | `mix(0.88, 0.5, clamp(clipDist * 4.0, 0.0, 1.0))` | 88% history weight when stable (down from 95% — flushes accumulation faster), drops to 50% when clipping fires |
| Final output | **Direct passthrough** (`taaBlitMaterial`) to screen | FXAA is **skipped** when TAA is on — FXAA's edge detector treats fine texture micro-contrast as aliasing and compounds TAA's softening into visible "JPG-like" detail loss. TAA already provides anti-aliasing. |

### Quality note

The Catmull-Rom history sample is the single most impactful TAA quality fix. Without it, bilinear sampling at sub-pixel-jittered UVs adds a tiny amount of blur *every frame* to the accumulated history buffer, which compounds visibly within seconds of accumulation. 5-tap Catmull-Rom preserves the high-frequency signal through repeated resamples at ~2× the cost of a single bilinear fetch.

### Files

- `runtime/assets/js/master/vrodos_shaders_taa.js` — shader factory, Catmull-Rom sampler, variance clipping
- `runtime/assets/js/master/vrodos_postprocessing.js` — jitter application, ping-pong, `taaBlitMaterial` passthrough

---

## 7. Screen-Space Reflections (SSR)

Half-resolution screen-space ray marching. Uses the shared `DepthTexture` from the main RT.

- 48 max steps, step size 0.3
- 5-step binary refinement for sub-pixel hit accuracy
- Normals reconstructed from depth via `dFdx`/`dFdy` (no normal pre-pass needed)
- Fresnel strength via Schlick (F0 = 0.04)
- Screen-edge fade + distance fade to avoid viewport-boundary artifacts
- 3 strength presets: `subtle` (0.3), `balanced` (0.6), `strong` (0.9)
- Composite blend: `color = mix(color, ssr.rgb, ssr.a * ssrStrength)` (alpha is hit mask)
- When TAA is active, SSR receives `jitter = (frameIndex % 16) / 16` — temporal variation that TAA accumulates into clean reflections

---

## 8. Scalable Ambient Occlusion (SAO) + Adaptive Rate

Depth-only SAO adapted from Three.js r173 SAOShader, running at half resolution. Normals are reconstructed from depth via `dFdx`/`dFdy` — no separate normal pre-pass.

### Quality presets

| Preset | Samples | Rings | Intensity | Kernel radius |
|--------|---------|-------|-----------|---------------|
| `soft` | 8 | 3 | 0.25 | 10 |
| `balanced` | 16 | 4 | 0.35 | 14 |
| `strong` | 24 | 5 | 0.5 | 18 |

`NUM_SAMPLES` and `NUM_RINGS` are `#define` constants on the SAO material, set once at creation from `getSAOParams()`. Intensity, kernel radius, bias, and max distance are uniforms.

### Bilateral blur

9-tap Gaussian with depth cutoff (depth-aware bilateral) prevents AO bleeding across geometry edges.

### Adaptive rate (temporal subsampling)

When the scene is GPU-bound, SAO is computed at **half the framerate** (every 2nd frame). The composite still samples `saoTargetA`, which retains the last computed result — SAO is low-frequency so the visual delta is imperceptible, but it cuts SAO GPU cost by 50%.

**State machine:**
- 30-frame rolling FPS average (ring buffer, must fill before any decisions are made)
- Enter half-rate: avg FPS < 30
- Exit half-rate: avg FPS > 45
- **3-second cooldown** between state transitions (prevents oscillation)
- Per-frame deltas > 1 s are discarded (ignores tab-pause outliers)

State is allocated once in `enablePostProcessing` inside the SAO block and zero-cost for SAO-off scenes. All state is primitive types (no allocations in the hot path).

Implementation: `vrodos_postprocessing.js`, gate block just before the SAO passes.

---

## 9. Bloom

Standard multi-pass half-resolution bloom.

```
postProcessingTarget → bright-pass → bloomTargetA
                    → H Gaussian blur (1×9 tap)  → bloomTargetB
                    → V Gaussian blur (1×9 tap)  → bloomTargetA
                    → composite (additive via bloomStrength)
```

Presets: `off` (0.0), `soft` (0.15), `medium` (0.35). The composite shader's `VRODOS_USE_BLOOM` define controls whether any of this even compiles in.

---

## 10. Render Loop Branch Structure

The final-output branch in the `renderer.render` override has three cases:

```
if (useTAA) {
    composite → fxaaTarget
    TAA resolve (fxaaTarget + taaHistoryTarget → taaCurrentTarget)
    taaBlitMaterial passthrough (taaCurrentTarget → screen)
    swap ping-pong
} else if (useFXAA) {
    composite → fxaaTarget
    FXAA (fxaaTarget → screen)
} else {
    composite → screen
}
```

`fxaaTarget` and `fxaaScene`/`fxaaQuad` are shared between the two `else` branches (FXAA uses them as the final pass; TAA uses them as a temp composite buffer and blit scene).

---

## 11. HDR Environment Maps

RGBELoader (embedded in `vrodos_master_rendering.js`) loads `.hdr` files, which are then processed through `PMREMGenerator` to produce a mip-mapped prefiltered radiance map usable as `scene.environment` and on PBR materials' `envMap`.

- 3 presets: studio (`spot1Lux.hdr`), quarry (`quarry_01_1k.hdr`), venice (`venice_sunset_1k.hdr`)
- `envMapIntensity` widened to 0.5×–2.0× range
- Scene-probe dynamic capture is an alternative source — see `vrodos_scene_probe.js`

---

## 12. Adding a New Post-FX Effect (Checklist)

1. Create `runtime/assets/js/master/vrodos_shaders_<effect>.js`, IIFE-wrapping a `createXMaterial()` factory and registering on `VRODOSMaster`.
2. Add a `<script>` tag to `js_libs/aframe_libs/Master_Client_prototype.html` in the shader block.
3. Add conditional resource creation in `vrodos_postprocessing.js` → `enablePostProcessing`, gated on the appropriate component setting.
4. Add resize handling in `updatePostProcessingSize` with null guards.
5. Add disposal in `disablePostProcessing` with null guards.
6. Add a runtime guard in the render loop (`if (this.xMaterial && this.xTargetA && ...)`).
7. If the effect feeds the composite, add a `VRODOS_USE_X` define and gated sampler/uniform in `vrodos_shaders_composite.js`, and pass it in the `features` object from `enablePostProcessing`.
8. Wire a compile-dialog control if it should be user-toggleable.
9. Add documentation here.

---

## 13. Key Version Info

- A-Frame **1.7.1** bundles **Three.js r173**
- `physicallyCorrectLights` is always on in r173 — no flag needed
- `outputEncoding` was removed in r152 — use `outputColorSpace`
- `ShaderMaterial` does **not** auto-invoke `linearToOutputTexel` — the colorspace_fragment chunk must be explicitly included or the RT must carry its own encoding (which we do via the `isXRRenderTarget` trick)

---

## 14. Future Ideas (Not Implemented)

These are speculative improvements — open to reconsideration but not currently needed:

- **Light unsharp-mask sharpening after TAA** (strength ~0.25) — could be added if any residual softness is reported
- **SSR half-res depth-aware upsampling** instead of bilinear composite read
- **Volumetric clouds / atmospheric scattering** (see `VOLUMETRIC_CLOUDS_IMPLEMENTATION_PLAN.md`)
- **Contact shadows** as a proper screen-space pass (currently only the shadow-bias preset)
- **FXAA tier 2** (higher-quality variant) as an option for non-TAA scenes
- **Render-target pooling** — share half-res RTs between SAO and bloom since they're sequential, saving ~4 MB when both are on

---

## References

- `POSTFX_DEBUG_NOTES.md` — deep debugging history for color-encoding issues, WebGLRenderer source quotes, failed approaches
- `README.md` — user-facing feature summary and compile dialog controls
- Jimenez, *Dynamic Temporal Antialiasing and Upsampling in Call of Duty* (SIGGRAPH 2016)
- Karis, *High-Quality Temporal Supersampling* (SIGGRAPH 2014)
- NVIDIA FXAA 3.11 white paper
- Three.js r173 `SAOShader` (adapted for depth-only input)
