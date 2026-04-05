# Post FX Washout Debug Notes

## Context

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

**Three.js r173 skips tone mapping AND output encoding when rendering to a `WebGLRenderTarget`.**

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
- The pipeline order: Scene→RT (ACES+sRGB) → SAO(3 passes) → SSR(half-res) → Bloom(3 passes) → Composite(AO*scene+SSR+bloom+grading) → TAA(temporal resolve) → FXAA → screen.
- Features requiring DepthTexture (SAO, TAA, SSR) disable MSAA — FXAA compensates.

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
