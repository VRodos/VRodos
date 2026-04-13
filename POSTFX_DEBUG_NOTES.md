# Post FX Washout Debug Notes

## Context

Historical note:
- This document records the investigation that originally happened on the older r173-based runtime.
- The current live stack is pinned to A-Frame master + Three r181.
- The notes remain useful because the legacy post-FX path still carries the same `isXRRenderTarget` workaround, but they should be treated as debugging history until fully re-validated on r181.

- Runtime page tested: `http://wp.local:5832/Master_Client_766.html`
- Main runtime files: `runtime/assets/js/master/vrodos_master_rendering.js` (shaders) + `runtime/assets/js/master/components/vrodos_scene_settings.component.js` (render loop)
- Scene confirmed by user:
  - `postFXEnabled: 1`
  - `postFXBloomEnabled: 0`
  - `postFXColorEnabled: 0`
  - `postFXVignetteEnabled: 0`
  - `postFXEdgeAAEnabled: 1`
  - `ambientOcclusionPreset: balanced`
- `post off` looked normal (deep blue sky, natural sun glow).
- `post on` looked washed out (pale/cold sky, foggy halo around sun).

---

## Root Cause (Confirmed 2026-04-05)

**Observed on Three.js r173: rendering to a `WebGLRenderTarget` skipped tone mapping and output encoding.**

Source: `node_modules/three/src/renderers/webgl/WebGLPrograms.js` line 202:
```javascript
outputColorSpace: ( currentRenderTarget === null )
    ? renderer.outputColorSpace
    : ( currentRenderTarget.isXRRenderTarget === true
        ? currentRenderTarget.texture.colorSpace
        : LinearSRGBColorSpace ),
```

And `node_modules/three/src/renderers/WebGLRenderer.js` lines 1806-1814:
```javascript
if ( material.toneMapped ) {
    if ( _currentRenderTarget === null || _currentRenderTarget.isXRRenderTarget === true ) {
        toneMapping = _this.toneMapping;
    }
}
```

This means:
- **Direct-to-screen render**: ACESFilmic tone mapping applied + linear→sRGB applied → correct colors
- **Render to WebGLRenderTarget**: NO tone mapping, NO encoding → RT stores raw **linear** values

Our post-processing pipeline always renders the scene to `postProcessingTarget` (a `WebGLRenderTarget`) before compositing. So the composite shader receives **linear, un-tone-mapped** input.

The `ShaderMaterial` composite also does NOT receive automatic output encoding from Three.js (the `linearToOutputTexel` function is injected into the prefix but never called, since `ShaderMaterial` shaders don't include `#include <colorspace_fragment>`).

---

## What Was Tried (Previous Session — All Incorrect Diagnosis)

Previous session assumed double sRGB encoding was the cause. That was wrong.

- Manual `linearToSRGB()` variants → not the root issue
- Manual ACES + sRGB in composite shader → partially right direction but lacked correct understanding
- `LinearSRGBColorSpace` / `SRGBColorSpace` target experiments → misdiagnosed
- temporary `renderer.outputColorSpace` swapping → wrong approach
- `HalfFloatType` render target → unrelated
- alpha forcing / opaque fullscreen output → unrelated
- XR-like render target flags → unrelated
- disabling `scene.background` / `scene.fog` → unrelated
- framebuffer-copy workaround → this DID work because rendering scene twice made one pass go direct-to-screen (which has correct TM+encoding)
- single-render optimization attempt → broke because RT path lacks TM+encoding

## First Fix Attempt (Wrong — 2026-04-05)

Removed `linearToSRGB()` from composite shader based on incorrect theory that RT stored sRGB data (double encoding). Colors remained washed out because the actual problem was missing tone mapping, and now encoding was also missing.

---

## Correct Fix Applied (2026-04-05)

### Composite shader (`vrodosCreatePhotorealPostMaterial`) now:

1. Reads **linear, un-tone-mapped** values from `postProcessingTarget`
2. Applies AO multiply and bloom add (in linear space)
3. Applies user exposure control (in linear space)
4. Applies **ACESFilmic tone mapping** with `outputExposure` (= `renderer.toneMappingExposure`) — replicates what Three.js does on the direct path
5. Applies saturation/contrast grading (in tone-mapped space)
6. Applies vignette
7. Applies **linearToSRGB** — replicates `outputColorSpace = SRGBColorSpace` on the direct path
8. Outputs to `fxaaTarget` or screen

### `outputExposure` uniform now wired to `renderer.toneMappingExposure`:
```javascript
this.postProcessingMaterial.uniforms.outputExposure.value =
    (renderer && renderer.toneMappingExposure) ? renderer.toneMappingExposure : 1.0;
```

### ACES implementation matches Three.js r173:
Uses the same `RRTAndODTFit` + input/output AP1 matrices + `exposure / 0.6` pre-scaling as Three.js `ACESFilmicToneMapping`.

---

## Sun Halo / Fog Circles

The circular glow around the sun seen with post FX on was **not an SAO artifact** (the SAO shader already has `rawDepth >= 0.9999` and `centerDepth > maxDistance` early-outs). It was the missing tone mapping causing the bright sun region to blow out and create a large diffuse wash, giving the impression of a foggy halo. Should resolve with the tone mapping fix.

---

## Architecture Notes for Future Agents

- `THREE.ShaderMaterial` does NOT auto-call `linearToOutputTexel` — it's defined in the prefix but never invoked unless the shader includes `#include <colorspace_fragment>`. Do not assume automatic encoding.
- Tone mapping is controlled per-pass by what `_currentRenderTarget` is at draw time (compiled into the program cache). Changing render target changes the compiled program.
- `postProcessingTarget.isXRRenderTarget = true` + `texture.colorSpace = SRGBColorSpace` forces Three.js to apply ACES + sRGB encoding to the RT, matching the direct-to-screen path. The composite needs NO extra encoding.
- Features requiring DepthTexture (SAO, TAA, SSR) disable MSAA — FXAA compensates.

### Full Pipeline Order (as of 2026-04-05)

```
Scene → postProcessingTarget (ACES+sRGB via isXRRenderTarget trick)
  ↓
SAO (3 passes, half-res):
  Pass 1: Depth → raw AO (saoTargetA)
  Pass 2: Horizontal bilateral blur (saoTargetA → saoTargetB)
  Pass 3: Vertical bilateral blur (saoTargetB → saoTargetA)
  ↓
SSR (1 pass, half-res):
  Ray march depth buffer, binary refine, Fresnel + edge fade → ssrTarget
  ↓
Bloom (3 passes, half-res):
  Pass A: Bright-pass threshold → bloomTargetA
  Pass B: Horizontal Gaussian blur → bloomTargetB
  Pass C: Vertical Gaussian blur → bloomTargetA
  ↓
Composite (full-res):
  AO multiply × scene + SSR blend + bloom add + color grading + vignette + exposure
  → fxaaTarget (if TAA active) or fxaaTarget/screen (if no TAA)
  ↓
TAA (full-res, ping-pong):
  Read composite from fxaaTarget + history from taaHistoryTarget
  YCoCg variance clipping (1.5σ), adaptive blend (95% stable / 50% clipped)
  Write resolved → taaCurrentTarget, then swap current↔history
  ↓
FXAA:
  Final pass → screen (reads TAA output or composite directly)
```

### TAA Implementation Details

The TAA shader is a simple variance-clipped temporal accumulation — **no depth reprojection**. This was chosen after depth-based reprojection caused persistent ghosting artifacts:

1. **Jitter**: Halton(2,3) sequence, 16 samples, ±0.5 pixel offset applied to `camera.projectionMatrix.elements[8,9]` before scene render, restored after
2. **Color space**: 3×3 neighborhood statistics computed in YCoCg (decorrelated, better clipping)
3. **Variance clipping**: `mu ± 1.5σ` AABB clamp on history sample — wide enough to preserve thin geometry
4. **Adaptive blend**: `mix(0.95, 0.5, clamp(clipDist * 4.0, 0.0, 1.0))` — high temporal stability when history matches neighborhood, aggressive replacement when it doesn't
5. **Ping-pong**: Two full-res targets (taaTargetA/B) swap each frame; resolved output serves as next frame's history
6. **SSR denoising**: SSR pass receives `jitter = frameIndex/16` uniform; TAA naturally accumulates the jittered SSR samples

### SSR Implementation Details

- Half-resolution screen-space ray marching (48 max steps, 0.3 step size)
- 5-step binary refinement for sub-pixel hit accuracy
- Normals reconstructed from depth via `dFdx`/`dFdy` (no normal pre-pass)
- Fresnel-based reflection strength (Schlick approximation, F0=0.04)
- Edge fade (screen border) + distance fade (ray travel length)
- 3 strength presets: subtle (0.3), balanced (0.6), strong (0.9)
- Blended into composite shader: `color = mix(color, ssr.rgb, ssr.a * ssrStrength)`

## Critical Architecture Discovery (2026-04-05)

`vrodos_master_components.js` is **NOT loaded** by compiled scenes. The actual runtime files are:

| File | Role |
|------|------|
| `runtime/assets/js/master/vrodos_master_rendering.js` | Shader factory functions (composite, SAO, FXAA, bloom) |
| `runtime/assets/js/master/components/vrodos_scene_settings.component.js` | A-Frame component — render loop, per-frame uniform updates |

`vrodos_master_components.js` appears to be a legacy monolith no longer used in production. All shader and render-loop changes must target the `master/` directory files.

The HTML template at `js_libs/aframe_libs/Master_Client_prototype.html` confirms the load order.

## ACES Attempt (2026-04-05) — Also Wrong

Adding ACESFilmic + linearToSRGB to the composite made the sky near-white. This means the RT does NOT contain raw linear values. The sky (from `aframe-environment-component@1.5.0` CDN) outputs values that when processed through ACES with `toneMappingExposure / 0.6` pre-scale are massively over-exposed.

Likely cause: Three.js compiles scene material programs during the first A-Frame render to screen (before our `renderer.render` hook is installed). These cached programs include ACESFilmic + sRGB encoding. When our hook then redirects scene rendering to the RT, the SAME CACHED PROGRAMS run — meaning the RT already stores **tone-mapped + sRGB-encoded** values. Applying ACES again doubles the processing → near-white.

## Diagnostic Test (2026-04-05) — Results

No-encoding test confirmed: sky was correct rich blue (RT already has display-ready sky values), but PBR assets were black (tiny linear values need gamma lifting). This ruled out the "RT already fully encoded" theory for PBR content — the RT has mixed content types.

Restoring `linearToSRGB` made PBR assets visible but sky still washed out (second round of sRGB on already-display-range sky values).

## Final Fix Applied (2026-04-05) — Force Three.js to Encode Consistently

The correct approach: force Three.js to apply ACESFilmic + sRGB encoding to the RT itself, making it behave exactly like the direct-to-screen path.

### In `vrodos_scene_settings.component.js` (after `postProcessingTarget` creation):
```javascript
this.postProcessingTarget.isXRRenderTarget = true;
this.postProcessingTarget.texture.colorSpace = THREE.SRGBColorSpace;
```

This exploits Three.js r173 source behavior:
- `WebGLPrograms.js` line 202: when `isXRRenderTarget === true`, uses `currentRenderTarget.texture.colorSpace` → `SRGBColorSpace` → injects sRGB encoding into all scene material shaders compiled for this target
- `WebGLRenderer.js` lines 1806-1814: when `isXRRenderTarget === true`, applies `renderer.toneMapping` (ACESFilmic) → all scene materials tone-map correctly

### In `vrodos_master_rendering.js` composite shader:
- Removed `linearToSRGB` function and call — RT is now fully ACES+sRGB encoded by Three.js
- Pipeline: read RT (already correct) → AO multiply → bloom add → grading → vignette → exposure → clamp → output directly

## Cleanup Done (2026-04-05)

- Deleted `runtime/assets/js/vrodos_master_components.js` — legacy monolith, not loaded by any compiled scene
- Deleted `runtime/assets/js/vrodos_master_logic.js` — unreferenced, superseded by master/ structure
- Updated all file references in MD docs to point to correct master/ files

---

## Horizon PMNDRS Aerial Foliage Regression (2026-04-13)

While re-validating the experimental Horizon PMNDRS Takram aerial path on the newer runtime stack, the sun and general sky composition were restored successfully, but billboard-style foliage remained visibly semi-transparent against the sky.

### Scope / Trigger

- Experimental path only: `?vrodos_debug_enable_pmndrs_horizon_aerial=1`
- Stable/base Horizon path still looks better for production scenes right now
- Main files involved:
  - `runtime/assets/js/master/vrodos_postprocessing_pmndrs.js`
  - `runtime/assets/js/master/vrodos_quality_profiles.js`
  - `runtime/assets/js/master/lib/vrodos-takram-atmosphere.bundle.js`

### What Works

- `AerialPerspectiveEffect` can now be enabled again for Horizon without the earlier composer crash
- Visible sun helper was restored for the experimental Horizon aerial path
- The temporary Horizon aerial-strength brightness test/clamp was reverted
- Foliage mesh discovery is finding the intended scene objects instead of returning zero matches

### Persistent Symptom

- Palm fronds / foliage still appear ghosted or semi-transparent against the bright sky
- This remains true even after overlay bypass, Takram-side threshold changes, and runtime material normalization attempts
- The base Horizon path still looks better because it avoids this regression

### Diagnostic Evidence

The foliage overlay selection refresh reached 6 meshes, and the material dump showed billboard-style `MeshBasicMaterial` foliage, including explicitly blended materials:

```text
MeshBasicMaterial,transparent=1,opacity=1.00,alphaTest=0.000,map=1,alphaMap=0
MeshBasicMaterial,transparent=1,opacity=1.00,alphaTest=0.000,map=1,alphaMap=0
MeshBasicMaterial,transparent=0,opacity=1.00,alphaTest=0.010,map=1,alphaMap=0
MeshBasicMaterial,transparent=0,opacity=1.00,alphaTest=0.010,map=1,alphaMap=0
MeshBasicMaterial,transparent=1,opacity=0.50,alphaTest=0.000,map=1,alphaMap=0
MeshBasicMaterial,transparent=1,opacity=0.50,alphaTest=0.000,map=1,alphaMap=0
```

Important takeaway: at least part of the visible foliage is authored as alpha-blended textured planes, and two of the selected materials are literally `opacity=0.50`.

### Experiments Already Tried

1. Re-enabled the experimental Horizon aerial path behind `?vrodos_debug_enable_pmndrs_horizon_aerial=1`
2. Restored visible sun handling while Takram aerial owns the sky
3. Added a Horizon foliage overlay selection pass and wired it into Takram overlay compositing
4. Expanded foliage matching so palms/leaves/fronds/bushes/foliage materials are actually found
5. Added expected depth-texture plumbing for the custom pass so the composer could build again
6. Forced overlay output toward opaque cutout behavior
7. Changed the overlay RT sampling to nearest filtering
8. Relaxed Takram overlay early-return from exact `overlay.a == 1.0` to thresholded bypass and forced opaque output on that branch
9. Tried runtime foliage material normalization:
   - `transparent = false`
   - `opacity = 1`
   - raised `alphaTest`
   - enabled `depthWrite`
   - disabled alpha-hash / alpha-to-coverage / premultiplied alpha
10. Replaced selected foliage materials with dedicated cutout clones for the main scene render instead of mutating shared originals in place

### Result

None of the above changed the visible regression in a meaningful way. The foliage still reads as semi-transparent in the experimental Horizon aerial mode.

### Current Conclusion

This no longer looks like a simple mesh-selection or material-flag problem. The remaining evidence suggests the artifact is fundamentally tied to how the Takram Horizon `AerialPerspectiveEffect` path composes these billboard/alpha foliage assets in this scene.

### Recommended Next Step

If this is revisited, the next materially different approach should be architectural rather than another small threshold tweak:

- render tagged Horizon foliage in a dedicated foreground/final pass after the aerial composition, fully bypassing Takram's atmospheric blend for those meshes

Tradeoffs to keep in mind:

- depth/occlusion ordering will need careful handling
- this should remain Horizon-only and experimental at first
- until that exists, the base Horizon path should remain the safer default
