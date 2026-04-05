---
name: Photorealism Roadmap (Phase 3+)
description: Future rendering improvements for compiled A-Frame scenes — HDR env maps, multi-pass bloom, SSAO, FXAA, pixel ratio cap. Phase 1-2 completed 2026-03-30.
type: project
---

## Completed (2026-03-30)

**Phase 1 — Bug fixes** in `runtime/assets/js/master/vrodos_master_rendering.js` + `runtime/assets/js/master/components/vrodos_scene_settings.component.js`:
- Removed `physicallyCorrectLights` dead code (Three.js r173 always-on)
- Removed `outputEncoding` fallback (removed in r152)
- Fixed shadow ternary bug (medium now uses `PCFShadowMap`, was identical to high)
- Fixed double tone mapping in post shader (`acesFilm()` + `linearToSRGB()` removed — renderer already applies these)
- Wired vignette to `postFXVignetteEnabled` (was hardcoded to 0)

**Phase 2 — UI accuracy** in `vrodos-edit-3D-scene-CompileDialogue.php`:
- "Ambient Occlusion" renamed to "AO Map Boost" (only tweaks baked AO map intensity, not screen-space AO)
- "Contact Shadows" renamed to "Shadow Precision" (only adjusts shadow bias, not real contact shadows)

**Phase 3 — Biggest quality wins** (completed 2026-03-31):
- 3.1 HDR environment maps at runtime (RGBELoader + PMREMGenerator pipeline, 3 HDR presets)
- 3.2 Multi-pass bloom (bright-pass + separable 9-tap Gaussian blur, half-res ping-pong)
- 3.3 Widened envMapIntensity range (0.5x–2.0x)
- 3.4 Capped pixel ratio supersampling (max 1.5x)
- Fix: Added `linearToSRGB()` to composite shader (post-processing was outputting linear to screen)
- Fix: Removed double `toneMappingExposure` application in composite

**Phase 4.2 — FXAA** (completed 2026-03-31):
- Replaced basic 4-neighbor luma edge AA with NVIDIA FXAA 3.11 as separate post-processing pass
- FXAA runs after composite (sRGB space), conditionally enabled via `postFXEdgeAAEnabled`
- Edge detection with diagonal handling, 5-sample edge walking

**Phase 4.1 — SSAO (SAO)** (completed 2026-04-01):
- Depth-only Scalable Ambient Occlusion adapted from Three.js r173 SAOShader
- Normals reconstructed from depth via `dFdx`/`dFdy` (no normal pre-pass needed)
- Depth-aware bilateral blur (9-tap Gaussian with depth cutoff) prevents AO bleeding across edges
- 3 quality presets: soft (8 samples), balanced (16), strong (24) — uses existing `ambientOcclusionPreset`
- Runs at half resolution for performance; stacks with existing baked AO map intensity boost
- DepthTexture attached to main render target when SAO active (disables MSAA; FXAA compensates)
- Pipeline: Scene→SAO(3 passes)→Bloom(3 passes)→Composite(AO*scene+bloom+grading+sRGB)→FXAA

**Phase 4.3 — A-Frame Effects** (resolved 2026-04-01):
- A-Frame 1.7.1 has NO built-in post-processing/effects system. Custom render hijack is the only approach.

**Phase 4.6 — Post-FX Color Washout Fix** (completed 2026-04-05):
- Fixed washed-out colors when post-FX enabled vs disabled (pale sky, foggy sun halo)
- Root cause: Three.js r173 skips tone mapping + sRGB encoding when rendering to `WebGLRenderTarget` (only applies them for direct-to-screen or XR targets). The composite shader's `linearToSRGB()` couldn't fix both sky (already display-range) and PBR assets (tiny linear values) uniformly.
- Fix: Set `postProcessingTarget.isXRRenderTarget = true` + `texture.colorSpace = SRGBColorSpace` — forces Three.js to apply ACESFilmic tone mapping + sRGB encoding to the RT, matching the direct-render path exactly. Removed `linearToSRGB` from composite shader since RT is now fully encoded.
- Files: `runtime/assets/js/master/components/vrodos_scene_settings.component.js` (RT flags), `runtime/assets/js/master/vrodos_master_rendering.js` (composite shader cleanup)

**Phase 4.4 — Screen-Space Reflections (SSR)** (completed 2026-04-05):
- Half-resolution ray marching with depth buffer, binary refinement, Fresnel, edge/distance fade
- 3 strength presets (subtle/balanced/strong) in compile dialogue
- Integrates into composite via alpha-masked blend; TAA denoises via temporal jitter

**Phase 4.5 — Temporal Anti-Aliasing (TAA)** (completed 2026-04-05):
- Halton(2,3) sub-pixel jitter (16 samples, ±0.5px) + YCoCg variance-clipped temporal accumulation
- No depth reprojection (caused ghosting) — simple same-UV blend with aggressive neighborhood clipping (1.5σ)
- Adaptive blend: 95% history when stable, 50% when clipped (motion/disocclusion)
- Ping-pong full-res targets; supplements FXAA; shares DepthTexture with SAO/SSR
- SSR uses TAA jitter for temporal denoising of ray-marched reflections

---

## Phase 4: Advanced

### 4.1 ~~SSAO Post-Processing Pass~~ ✅ DONE
Depth-only SAO with `dFdx`/`dFdy` normal reconstruction, depth-aware bilateral blur, 3 presets.

### 4.2 ~~Replace Edge AA with FXAA~~ ✅ DONE
Replaced basic 4-neighbor luma edge AA with NVIDIA FXAA 3.11 as a separate post-processing pass.

### 4.3 ~~Evaluate A-Frame Built-in Effects System~~ ✅ RESOLVED
A-Frame 1.7.1 has no built-in post-processing system. Custom render hijack is the only viable approach.

### 4.4 ~~Screen-Space Reflections (SSR)~~ ✅ DONE (2026-04-05)
- Screen-space ray marching using depth buffer at half resolution for performance
- Normals reconstructed from depth via `dFdx`/`dFdy` (no separate normal pass needed)
- Binary refinement (5 steps) for sub-pixel accuracy on ray hits
- Fresnel-based reflection strength (stronger at glancing angles)
- Screen-edge fade + distance fade to prevent artifacts at viewport boundaries
- 3 strength presets: subtle (0.3), balanced (0.6), strong (0.9)
- Integrates into composite shader via alpha-masked blend (rgb=reflected color, a=hit mask)
- TAA naturally denoises SSR output via temporal jitter parameter
- Pipeline: Scene→SAO→SSR(half-res)→Bloom→Composite(AO*scene+SSR+bloom+grading)→TAA→FXAA
- Files: `runtime/assets/js/master/vrodos_master_rendering.js` (shader), `vrodos_scene_settings.component.js` (render loop)

### 4.5 ~~Temporal Anti-Aliasing (TAA)~~ ✅ DONE (2026-04-05)
- Halton(2,3) sub-pixel jitter sequence (16 samples, ±0.5px) applied to `camera.projectionMatrix` per frame
- Simple variance-clipped temporal accumulation — **no depth reprojection** (reprojection caused persistent ghost/duplicate artifacts; removed in favor of same-UV blend)
- Neighborhood clipping in YCoCg color space (3×3 statistics, 1.5σ AABB) — wide enough to preserve thin geometry
- Adaptive blend: `mix(0.95, 0.5, clamp(clipDist * 4.0, 0.0, 1.0))` — 95% history when stable, 50% replacement when history diverges from current neighborhood
- Ping-pong render targets at full resolution (taaTargetA/B swap each frame)
- SSR pass receives `jitter = frameIndex/16` for temporal denoising via TAA accumulation
- Requires DepthTexture (shared with SAO/SSR; disables MSAA, FXAA compensates)
- Supplements FXAA as final cleanup pass
- Files: `runtime/assets/js/master/vrodos_master_rendering.js` (shader), `vrodos_scene_settings.component.js` (jitter + render loop)

---

## Current Full Pipeline (2026-04-05)

```
Scene → postProcessingTarget (ACES+sRGB via isXRRenderTarget)
  → SAO (3 passes, half-res: raw AO → H blur → V blur)
  → SSR (1 pass, half-res: ray march + binary refine + Fresnel)
  → Bloom (3 passes, half-res: bright-pass → H blur → V blur)
  → Composite (AO × scene + SSR blend + bloom + grading + vignette)
  → TAA (variance-clipped temporal blend, full-res ping-pong)
  → FXAA → screen
```

Total passes: up to 11 (when all effects active). Each can be individually toggled.

---

## Phase 5: Performance & Refactoring (TODO)

- Split `vrodos_master_rendering.js` (~48KB) into per-effect shader modules
- Split `vrodos_scene_settings.component.js` (~63KB) into render loop + setup + quality profiles
- Lazy pass instantiation (only create RT + material when effect is enabled)
- Adaptive quality for SAO/SSR based on FPS feedback
- Reduced texture sampling in composite when effects are disabled

---

## Key Version Info
- A-Frame 1.7.1 bundles **Three.js r173**
- `physicallyCorrectLights` is always on in r173 — no flag needed
- A-Frame 1.7.0 has experimental post-processing + WebGPU support
