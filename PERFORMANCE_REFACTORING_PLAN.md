# Performance Optimization & Runtime File Refactoring Plan

## Context

The compiled A-Frame scene runtime has grown significantly after implementing SAO, SSR, TAA, bloom, FXAA, HDR environment maps, and scene probes. The two main files are now very large:

- `vrodos_scene_settings.component.js` — **81KB, ~1,799 lines** (render loop, post-FX setup/teardown, quality profiles, probe management, FPS meter, environment maps)
- `vrodos_master_rendering.js` — **52KB, ~1,370 lines** (8 shader materials, RGBELoader, material enhancement, navmesh utilities)

This makes the codebase hard to navigate and maintain. Goals:
1. Split these large files into smaller, focused modules
2. Performance optimizations for the rendering pipeline

## Constraints

- **No ES modules / bundler** — the runtime uses plain `<script>` tags loaded in order via `Master_Client_prototype.html`. All files attach to `window.VRODOSMaster` or register A-Frame components.
- **Load order matters** — `vrodos_master_rendering.js` (shader factories) must load before `vrodos_scene_settings.component.js` (consumes them).
- **A-Frame component registration** — `scene-settings` must remain a single `AFRAME.registerComponent()` call, but helper code can be extracted to separate files loaded before it.

---

## Part 1: File Refactoring

### 1A. Split `vrodos_master_rendering.js` into shader modules

Current file has 8 distinct shader factory functions + RGBELoader + utilities. Split into:

| New File | Contents | Lines Moved |
|----------|----------|-------------|
| `vrodos_shaders_bloom.js` | `vrodosCreateBrightPassMaterial()` + `vrodosCreateGaussianBlurMaterial()` | ~70 lines |
| `vrodos_shaders_sao.js` | `vrodosCreateSAOMaterial()` + `vrodosCreateSAOBlurMaterial()` | ~180 lines |
| `vrodos_shaders_fxaa.js` | `vrodosCreateFXAAMaterial()` | ~100 lines |
| `vrodos_shaders_taa.js` | `vrodosCreateTAAMaterial()` | ~80 lines |
| `vrodos_shaders_ssr.js` | `vrodosCreateSSRMaterial()` | ~180 lines |
| `vrodos_shaders_composite.js` | `vrodosCreatePhotorealPostMaterial()` | ~70 lines |
| `vrodos_master_rendering.js` (remains) | RGBELoader, `vrodosEnhanceMeshMaterial()`, utility functions, `VRODOSMaster` exports | ~490 lines |

Each shader file:
- Wraps in IIFE `(function() { ... })();`
- Accesses `window.VRODOSMaster` to register its factory function
- Has zero dependencies on other shader files

**Load order in `Master_Client_prototype.html`:**
```
vrodos_master_shared.js          (VRODOSMaster namespace)
vrodos_master_bootstrap.js       (bootstrap)
vrodos_master_rendering.js       (RGBELoader + material utils + registers base exports)
vrodos_shaders_bloom.js          (bloom factories → VRODOSMaster)
vrodos_shaders_sao.js            (SAO factories → VRODOSMaster)
vrodos_shaders_fxaa.js           (FXAA factory → VRODOSMaster)
vrodos_shaders_taa.js            (TAA factory → VRODOSMaster)
vrodos_shaders_ssr.js            (SSR factory → VRODOSMaster)
vrodos_shaders_composite.js      (composite factory → VRODOSMaster)
vrodos_scene_settings.component.js
...
```

### 1B. Split `vrodos_scene_settings.component.js` into helper modules

Extract large, self-contained helper sections into files loaded BEFORE the component registration:

| New File | Contents | Lines Moved |
|----------|----------|-------------|
| `vrodos_postprocessing.js` | `enablePostProcessing()`, `disablePostProcessing()`, `updatePostProcessingSize()`, `syncPostProcessingState()` — the render loop patch + RT creation + disposal | ~450 lines |
| `vrodos_scene_probe.js` | All probe/environment functions: `captureSceneProbe()`, `ensureSceneProbeResources()`, `disposeSceneProbe()`, `applyEnvMapProfile()`, `clearHdrEnvironmentMap()`, etc. | ~330 lines |
| `vrodos_quality_profiles.js` | `applyRenderQualityProfile()`, `applyShadowQualityProfile()`, `applyMaterialProfiles()`, `applyBackgroundQualityProfile()`, `applyPostFXProfile()`, `applyQualityProfiles()`, helper light functions | ~280 lines |
| `vrodos_scene_settings.component.js` (remains) | Schema, init/remove/tick lifecycle, FPS meter, flag helpers, value getters | ~740 lines |

**Pattern for extraction:** Each helper file defines functions on a `VRODOSMaster.SceneSettingsHelpers` namespace. The component's methods delegate to them, passing `this` (the component instance) as context:

```javascript
// vrodos_postprocessing.js
(function() {
    var helpers = VRODOSMaster.SceneSettingsHelpers = VRODOSMaster.SceneSettingsHelpers || {};

    helpers.enablePostProcessing = function(component) {
        // ... extracted logic, using component.data, component.el, etc.
    };
    helpers.disablePostProcessing = function(component) { ... };
})();

// In vrodos_scene_settings.component.js (remains):
enablePostProcessing: function() {
    VRODOSMaster.SceneSettingsHelpers.enablePostProcessing(this);
},
```

### 1C. Remove duplicate RGBELoader

A standalone `runtime/assets/js/RGBELoader.js` (12K) exists alongside the embedded copy in `vrodos_master_rendering.js` (lines 17–458). Keep only the embedded one (it's the one actually loaded).

### 1D. Update `Master_Client_prototype.html`

Add `<script>` tags for the new files in correct order. Also update the compiler (`class-vrodos-compiler-manager.php`) to include the new files in compiled output.

---

## Part 2: Performance Optimizations

### 2A. Lazy pass instantiation

Currently `enablePostProcessing()` creates ALL render targets and materials (SAO, SSR, TAA, bloom, FXAA, composite) regardless of which effects are enabled. Change to:

- Only create RT + material + quad for effects that are actually enabled
- Composite shader: use `#define` flags or branch-free uniforms to skip disabled effect sampling
- On settings change: dispose unused passes, create newly enabled ones

**Impact:** Scenes with only FXAA+SAO skip allocating bloom (2 half-res RTs), SSR (1 half-res RT), TAA (2 full-res RTs) — saves significant VRAM.

### 2B. Adaptive SAO quality

Add FPS-based quality scaling:
- Track frame time rolling average (last 30 frames)
- If average FPS drops below 30: reduce SAO kernel samples (e.g., balanced 16 → 8)
- If FPS recovers above 45: restore original quality
- Hysteresis to prevent oscillation (e.g., 3-second cooldown)

### 2C. SSR half-res optimization (already done)

SSR already runs at half resolution. No further change needed.

### 2D. Composite shader: skip disabled texture reads

Currently the composite always samples `tSAO`, `tBloom`, `tSSR` even when those effects are off (they read black/white textures). Add uniform flags:

```glsl
uniform bool uSAOEnabled;
uniform bool uBloomEnabled;
uniform bool uSSREnabled;

// In fragment:
float ao = uSAOEnabled ? texture2D(tSAO, vUv).r : 1.0;
vec4 bloom = uBloomEnabled ? texture2D(tBloom, vUv) : vec4(0.0);
vec4 ssr = uSSREnabled ? texture2D(tSSR, vUv) : vec4(0.0);
```

This avoids 1–3 texture fetches per pixel when effects are off. Minor GPU savings but free to implement.

### 2E. Render target reuse (deferred)

When both SAO and bloom are active, they each use half-res targets. These could share targets since SAO completes before bloom starts. However, this adds complexity and risk — **defer unless VRAM is a concern**.

---

## Files to Modify

### New files to create:
- `runtime/assets/js/master/vrodos_shaders_bloom.js`
- `runtime/assets/js/master/vrodos_shaders_sao.js`
- `runtime/assets/js/master/vrodos_shaders_fxaa.js`
- `runtime/assets/js/master/vrodos_shaders_taa.js`
- `runtime/assets/js/master/vrodos_shaders_ssr.js`
- `runtime/assets/js/master/vrodos_shaders_composite.js`
- `runtime/assets/js/master/vrodos_postprocessing.js`
- `runtime/assets/js/master/vrodos_scene_probe.js`
- `runtime/assets/js/master/vrodos_quality_profiles.js`

### Files to modify:
- `runtime/assets/js/master/vrodos_master_rendering.js` — remove extracted shader functions
- `runtime/assets/js/master/components/vrodos_scene_settings.component.js` — delegate to helper modules
- `js_libs/aframe_libs/Master_Client_prototype.html` — add new script tags
- `includes/class-vrodos-compiler-manager.php` — add new files to compiled output

### Files to delete:
- `runtime/assets/js/RGBELoader.js` (duplicate)

---

## Implementation Order

1. ~~**Shader extraction** (1A) — lowest risk, purely moving code between files~~ ✅ DONE (2026-04-05)
2. ~~**Update HTML template + compiler** (1D, shader portion)~~ ✅ DONE (2026-04-05)
3. ~~**Delete duplicate RGBELoader** (1C)~~ ✅ DONE (2026-04-05)
4. ~~**Helper extraction** (1B) — post-processing, scene probe, quality profiles~~ ✅ DONE (2026-04-06)
5. ~~**Update HTML template** (1D, helper portion) — wire up helper scripts~~ ✅ DONE (2026-04-06)
6. ~~**Test compiled scene** — verify no regressions (full pipeline)~~ ✅ DONE (2026-04-06, user-confirmed)
7. ~~**Lazy pass instantiation** (2A)~~ ✅ DONE (2026-04-06)
8. **Composite skip-sampling** (2D) — small, safe optimization
9. **Adaptive SAO quality** (2B) — optional, can defer

### Phase 1A Results (2026-04-05)
- `vrodos_master_rendering.js`: 1,370 lines → 675 lines (51% reduction)
- Created 6 new shader files: bloom (76 lines), sao (162 lines), fxaa (100 lines), taa (84 lines), ssr (170 lines), composite (66 lines)
- `Master_Client_prototype.html` updated with 6 new `<script>` tags
- Deleted duplicate `runtime/assets/js/RGBELoader.js`
- Fix-up: rewrote 6 bare-global shader factory calls in the component to use the `VRODOSMaster.*` namespace (user-confirmed working)

### Phase 1B Results (2026-04-06)
- `vrodos_scene_settings.component.js`: 1,799 lines → **694 lines** (61% reduction)
- Created 3 new helper files using the `VRODOSMaster.SceneSettingsHelpers` IIFE pattern:
  - `vrodos_postprocessing.js` — 535 lines (render loop patch, RT creation/disposal, `enablePostProcessing`, `disablePostProcessing`, `updatePostProcessingSize`, `syncPostProcessingState`)
  - `vrodos_scene_probe.js` — 333 lines (15 probe/env-map functions incl. `captureSceneProbe`, `ensureSceneProbeResources`, `applyEnvMapProfile`, `clearHdrEnvironmentMap`)
  - `vrodos_quality_profiles.js` — 291 lines (9 profile functions: render/shadow/material/background/postFX/horizon-sky/helper-light/overall `applyQualityProfiles`)
- Component methods delegate via direct property references (`method: VRODOSMaster.SceneSettingsHelpers.method`) — `this` binding preserved because methods are invoked as `component.method()`
- `Master_Client_prototype.html` updated with 3 new `<script>` tags inserted after the shader block, before the component script
- No compiler (`class-vrodos-compiler-manager.php`) edit needed — it relies on directory copy, not per-file enumeration

### TAA Quality Fixes (2026-04-06)
User reported "JPG-like" degradation when TAA was enabled, becoming noticeable even at mid-range distance. Root causes and fixes:
- **Catmull-Rom history sampling** (5-tap Jimenez) replaces bilinear in `vrodos_shaders_taa.js`. Bilinear sampling of the history buffer at sub-pixel jittered UVs compounded softening on every accumulation frame — this was the dominant source of detail loss. Catmull-Rom preserves high-frequency texture detail through repeated resamples.
- Variance clipping tightened: **1.5σ → 1.0σ** (rejects stale blurry history more aggressively)
- History blend weight lowered: **0.95 → 0.88** (flushes accumulation faster)
- Halton jitter magnitude reduced: **±0.5 px → ±0.375 px** (less sub-pixel drift per frame)
- **Skip final FXAA blit when TAA is on.** New `taaBlitMaterial` (trivial passthrough ShaderMaterial) copies TAA output directly to screen. Previously FXAA was applied on top of TAA — its edge detector was treating fine texture micro-contrast as aliasing and blurring it, compounding TAA's own softening into the "JPG" look. TAA already provides anti-aliasing.

### Phase 2A Results (2026-04-06) — Lazy Pass Instantiation
Post-FX settings are static per session (no A-Frame `update` hook), so disabled passes can be omitted entirely without needing runtime rebuild.

- **Bloom**: resources (2 half-res RTs + bright-pass + blur materials + scene) now gated on `getBloomStrengthValue() > 0`. Scenes with bloom strength "off" skip ~2 half-res RTs entirely.
- **FXAA**:
  - `fxaaTarget` + `fxaaScene`/`fxaaQuad` created only when FXAA OR TAA is enabled (they're reused as the TAA temp composite buffer and final TAA→screen blit scene)
  - `fxaaMaterial` created only when FXAA is actually the final pass (FXAA disabled entirely when TAA is on, so no material needed)
- Runtime guards in the render loop already handled missing resources (`useFXAA = ... && this.fxaaTarget && this.fxaaMaterial`; bloom path already checked `if (bloomValue > 0 && this.bloomTargetA && this.bloomTargetB)`). `updatePostProcessingSize` also already had null-guards on every target/material.

**VRAM savings at 1920×1080:**
- Bloom off → saves ~2 × (960×540×4) ≈ 4.0 MB
- FXAA+TAA off → saves ~1 × (1920×1080×4) ≈ 8.3 MB
- Both off → ~12 MB saved plus 4 shader material compiles

## Verification

1. Compile a test scene with ALL effects on (SAO balanced, SSR balanced, TAA on, bloom moderate, FXAA on, color grading on, vignette on)
2. Verify visual output matches pre-refactor exactly (screenshot comparison)
3. Compile with effects off — verify clean render matches
4. Toggle individual effects on/off in compile dialog — verify each works independently
5. Check browser console for any missing function/undefined errors
6. Verify FPS is same or better than pre-refactor
7. Check compiled HTML output includes all new script files
