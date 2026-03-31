---
name: Photorealism Roadmap (Phase 3+)
description: Future rendering improvements for compiled A-Frame scenes — HDR env maps, multi-pass bloom, SSAO, FXAA, pixel ratio cap. Phase 1-2 completed 2026-03-30.
type: project
---

## Completed (2026-03-30)

**Phase 1 — Bug fixes** in `runtime/assets/js/vrodos_master_components.js`:
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

---

## Phase 3: Biggest Quality Wins (TODO)

### 3.1 HDR Environment Maps at Runtime — HIGHEST IMPACT
**Why:** The editor loads HDR env maps (`images/hdr/Stonewall_Ref.hdr`) but compiled runtime scenes load NONE. Without `scene.environment`, PBR materials have nothing to reflect — metallic/reflective surfaces appear flat black.
**How to apply:** Load HDR via `RGBELoader` + `PMREMGenerator` in the `scene-settings` component init. The plugin ships 4 HDR files in `images/hdr/` — offer as presets. Set `scene.environment` on the Three.js scene. This alone will transform PBR rendering.
**Files:** `runtime/assets/js/vrodos_master_components.js` (init), reference pattern in `js_libs/vrodos_3d_editor_environmentals.js` lines 100-109.

### 3.2 Multi-Pass Bloom — Replace Single-Pixel Bloom
**Why:** Current bloom samples only 8 immediate neighbor texels (1px radius). At 1080p+, this is invisible. Real bloom needs multi-pass Gaussian blur with progressive downsampling.
**How to apply:** Render bright-pass to half-res target, ping-pong Gaussian blur at progressively lower resolutions (4-5 passes), composite back at full res. Matches the UnrealBloomPass approach. Alternatively, leverage A-Frame 1.7.0's experimental post-processing if it exposes bloom.
**Files:** `runtime/assets/js/vrodos_master_components.js` lines 558-575 (current bloom), lines 986-1091 (post-processing pipeline).

### 3.3 Widen envMapIntensity Range
**Why:** Current range is 0.88x-1.10x (22% total), barely perceptible. Once HDR env maps are loaded (3.1), wider range becomes meaningful.
**How to apply:** Change range to 0.5x-2.0x in `vrodosEnhanceMeshMaterial()`.
**Files:** `runtime/assets/js/vrodos_master_components.js` lines 338-354.

### 3.4 Cap Pixel Ratio Supersampling
**Why:** Current max is 2.2x pixel ratio = rendering at ~4.8x the pixels. At 4K this is 8448x4752 — extremely GPU heavy. MSAA on the render target is more efficient and already implemented.
**How to apply:** Cap at 1.5x, rely on MSAA (`samples` property, line 1004-1006) for remaining AA quality.
**Files:** `runtime/assets/js/vrodos_master_components.js` lines 1108-1116.

---

## Phase 4: Advanced (Future)

### 4.1 SSAO Post-Processing Pass
**Why:** Current "AO" only boosts baked AO map intensity. Real SSAO adds darkening in crevices dynamically for all geometry.
**How to apply:** Add depth buffer pass + noise-based occlusion kernel as a post-processing pass. Check if A-Frame 1.7.0's `effects` system supports SAO/GTAO.

### 4.2 ~~Replace Edge AA with FXAA~~ ✅ DONE
Replaced basic 4-neighbor luma edge AA with NVIDIA FXAA 3.11 as a separate post-processing pass.

### 4.3 Evaluate A-Frame 1.7.0 Built-in Effects System
**Why:** A-Frame 1.7.0 added experimental post-processing support (works in VR too). Could replace the custom render hijack approach entirely.
**How to apply:** Investigate the `effects` component and whether it can handle bloom, FXAA, color grading natively.

### 4.4 Screen-Space Reflections (SSR)
For reflective floors, glass, polished surfaces.

### 4.5 Temporal Anti-Aliasing (TAA)
Better than MSAA for thin geometry and specular aliasing.

---

## Key Version Info
- A-Frame 1.7.1 bundles **Three.js r173** (NOT r147)
- Local `js_libs/threejs147/` is editor-only, NOT used in compiled scenes
- `physicallyCorrectLights` is always on in r173 — no flag needed
- A-Frame 1.7.0 has experimental post-processing + WebGPU support
