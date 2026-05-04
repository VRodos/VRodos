# VRodos Rendering Pipeline - Technical Reference

Canonical reference for the compiled A-Frame scene rendering stack on the current package-synchronized A-Frame master + Three r181 runtime. For end-user feature summaries, see `README.md`. For historical WebGLRenderer debugging notes, see `POSTFX_DEBUG_NOTES.md`.

## 1. Runtime Overview

Compiled scenes support two mutually exclusive post-processing engines selected per scene by `scene-settings.postFXEngine`:

- `legacy`: VRodos custom render-target pipeline with SAO, SSR, bloom, color grading, FXAA, and TAA.
- `pmndrs`: PMNDRS `EffectComposer` path using bundled `postprocessing`, bundled `n8ao`, and optional Takram atmosphere integration.

Both engines are driven by the `scene-settings` component at `assets/js/runtime/master/components/vrodos_scene_settings.component.js`.

Presentation mode is part of the rendering contract:

- Inline desktop and desktop fullscreen use the same eligible post-FX path.
- Real immersive WebXR is detected through `renderer.xr.isPresenting`.
- In immersive XR, XR-unsafe screen-space composer passes can fall back to direct stereo rendering while scene-owned visuals remain active: Horizon/Takram sky, helper lights, fog, exposure/tone mapping, environment maps, and material profiles.

## 2. File Organization

### Shared runtime files

| File | Role |
| --- | --- |
| `assets/js/runtime/master/components/vrodos_scene_settings.component.js` | A-Frame schema, lifecycle, settings getters, engine dispatcher |
| `assets/js/runtime/master/vrodos_master_rendering.js` | HDR loader and shared material/runtime helpers |
| `assets/js/runtime/master/vrodos_scene_probe.js` | HDR and scene-probe environment map support |
| `assets/js/runtime/master/vrodos_quality_profiles.js` | Render, shadow, material, background, post-FX, Horizon, and Takram quality profiles |

### Legacy custom pipeline files

| File | Role |
| --- | --- |
| `assets/js/runtime/master/vrodos_postprocessing.js` | Legacy render-loop hijack, render targets, resource lifecycle, pass execution |
| `assets/js/runtime/master/vrodos_shaders_bloom.js` | Bright-pass and Gaussian blur shader factories |
| `assets/js/runtime/master/vrodos_shaders_sao.js` | SAO and bilateral blur shader factories |
| `assets/js/runtime/master/vrodos_shaders_fxaa.js` | FXAA shader factory |
| `assets/js/runtime/master/vrodos_shaders_taa.js` | TAA resolve shader factory |
| `assets/js/runtime/master/vrodos_shaders_ssr.js` | SSR shader factory |
| `assets/js/runtime/master/vrodos_shaders_composite.js` | Legacy composite shader factory |

### PMNDRS pipeline files

| File | Role |
| --- | --- |
| `assets/js/runtime/master/vrodos_postprocessing_pmndrs.js` | PMNDRS composer construction, effect ordering, AA, N8AO, LUT, runtime debug overlay |
| `assets/js/runtime/master/lib/vrodos-postprocessing.bundle.js` | Bundled `window.POSTPROCESSING` and `window.N8AOPostPass` |
| `assets/js/runtime/master/lib/vrodos-takram-atmosphere.bundle.js` | Bundled `window.VRODOS_TAKRAM_ATMOSPHERE` |

## 3. Load Order

`templates/runtime/aframe/Master_Client_prototype.html` loads runtime scripts in this order:

```text
vrodos_master_shared.js
vrodos_master_bootstrap.js
vrodos_master_rendering.js
vrodos_shaders_*.js
vrodos_postprocessing.js
vrodos_postprocessing_pmndrs.js
lib/vrodos-postprocessing.bundle.js
lib/vrodos-takram-atmosphere.bundle.js
vrodos_scene_probe.js
vrodos_quality_profiles.js
components/vrodos_scene_settings.component.js
```

The PMNDRS and Takram bundles are generated from root `package.json` and `package-lock.json`. They must use A-Frame's `window.THREE`; compiled scenes must not load a second Three instance.

## 4. Legacy Pipeline

The legacy engine uses a custom `renderer.render` override to render into VRodos-owned targets before the final screen output.

Full legacy path when all effects are active:

```text
Scene render
  -> postProcessingTarget
  -> SAO, optional half-res
  -> SSR, optional half-res
  -> Bloom, optional half-res
  -> Composite shader
  -> TAA, optional full-res ping-pong
  -> Final blit, FXAA if enabled and TAA is off
```

Disabled legacy effects do not allocate their render targets or compile their shader materials.

The legacy path still uses the `isXRRenderTarget` color-encoding workaround on its main post target so Three applies tone mapping and output color-space conversion when rendering to the target:

```javascript
this.postProcessingTarget = new THREE.WebGLRenderTarget(width, height, targetOptions);
this.postProcessingTarget.isXRRenderTarget = true;
this.postProcessingTarget.texture.colorSpace = THREE.SRGBColorSpace;
```

This compatibility behavior is retained for the pinned r181 stack.

## 5. PMNDRS Pipeline

The PMNDRS engine uses `POSTPROCESSING.EffectComposer` and builds a scene-specific composer lazily on the first valid render frame.

Current PMNDRS ordering:

```text
RenderPass
  -> optional Takram AerialPerspectiveEffect for non-Horizon or debug Horizon aerial path
  -> optional N8AOPostPass standalone pass
  -> fused EffectPass:
       BloomEffect
       ToneMappingEffect
       BrightnessContrastEffect
       HueSaturationEffect
       LUT3DEffect
       VignetteEffect
       NoiseEffect
       ChromaticAberrationEffect
       SMAAEffect
  -> screen
```

Composer multisampling is used only when:

- PMNDRS AA mode is `msaa`.
- WebGL2 multisampling is available.
- AO is off.
- Debug flags have not disabled MSAA.

When AO is active, PMNDRS disables composer MSAA and recommends SMAA because the bundled N8AO path is not stable with hardware multisampling.

## 6. PMNDRS Built-In LUT Looks

PMNDRS LUT v1 uses generated built-in 3D lookup textures. It does not load uploaded `.cube` or `.3dl` assets.

Scene settings:

- `pmndrsLutEnabled`
- `pmndrsLutLook`
- `pmndrsLutStrength`

Supported looks:

- `neutral`
- `warm-film`
- `cool-clarity`
- `cinematic-contrast`
- `soft-fade`

Runtime behavior:

- `LookupTexture.createNeutral(16)` creates the base 16x16x16 LUT.
- VRodos applies deterministic RGB transforms for each look.
- `LUT3DEffect` is inserted after tone mapping and basic color/contrast grading, before vignette, noise, and chromatic aberration.
- Strength is applied through the effect blend opacity.
- LUT failure logs once and falls back to the rest of the PMNDRS pipeline.

## 7. Legacy Effect Notes

### TAA

Legacy TAA uses a 16-sample Halton jitter sequence, same-UV history sampling, Catmull-Rom history reconstruction, and neighborhood clipping. FXAA is skipped when TAA is active.

### SSR

Legacy SSR is half-resolution screen-space ray marching using the shared depth texture from the main render target. PMNDRS does not currently support SSR; scenes that require SSR should stay on `legacy`.

### SAO

Legacy SAO is half-resolution, depth-only ambient occlusion with bilateral blur and optional adaptive half-rate updates under low FPS.

## 8. HDR Environment Maps and Scene Probe

HDR environment presets are loaded through the runtime HDR loader and processed through `PMREMGenerator` for `scene.environment` and PBR material `envMap`.

Current presets:

- `studio`
- `quarry`
- `venice`

Scene probe capture is an alternate environment source when render quality and presentation mode allow it.

## 9. Version Source of Truth

- Root `package.json` and `package-lock.json` define runtime package intent.
- `npm run build:three` generates `assets/runtime-version-manifest.json`.
- `VRodos_Render_Runtime_Manager` reads the generated manifest for A-Frame, Three, PMNDRS, N8AO, and Takram metadata.
- The current live vendor bundle is Three.js r181.

## 10. Future Ideas

These are backlog items, not current implementation requirements:

- Depth of field after an author-facing focus workflow is selected.
- Native `POSTPROCESSING.SSAOEffect` retry after isolating the depth/normal attachment conflict.
- Outline/selective bloom, god rays, tilt shift, pixelation, glitch, and shock wave.
- Takram stars, date/time sun and moon direction, `SkyLightProbe`, `SunDirectionalLight`, and geospatial helpers.
- Volumetric clouds after the PMNDRS/Takram baseline remains stable.

## References

- `RENDERING_NEXT_STEPS.md` - live rendering phase tracker.
- `RENDERING_MIGRATION_IMPLEMENTATION_LOG.md` - staged migration history.
- `POSTFX_DEBUG_NOTES.md` - color-encoding and WebGLRenderer debugging history.
