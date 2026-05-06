# VRodos Rendering Pipeline - Technical Reference

Canonical reference for the compiled A-Frame scene rendering stack on the current package-synchronized A-Frame master + Three r181 runtime. For end-user feature summaries, see `README.md`. For historical WebGLRenderer debugging notes, see `POSTFX_DEBUG_NOTES.md`.

## 1. Runtime Overview

Compiled scenes support two mutually exclusive post-processing engines selected per scene by `scene-settings.postFXEngine`:

- `legacy`: VRodos custom render-target pipeline with SAO, SSR, bloom, color grading, FXAA, and TAA.
- `pmndrs`: PMNDRS `EffectComposer` path using bundled `postprocessing` and optional Takram atmosphere integration.

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
| `assets/js/runtime/master/vrodos_quality_profiles.js` | Source for render, shadow, material, background, post-FX, Horizon, and Takram quality profiles |
| `assets/js/runtime/master/lib/vrodos-runtime-core.bundle.js` | Generated compiled-scene core runtime bundle |
| `assets/js/runtime/master/lib/vrodos-runtime-scene-components.bundle.js` | Generated compiled-scene POI/media/assessment component bundle |
| `assets/js/runtime/master/lib/vrodos-runtime-aframe-components.bundle.js` | Generated compiled-scene master A-Frame component bundle |
| `assets/runtime-build-manifest.json` | Generated runtime chunk manifest consumed by the compiler script planner |

### Legacy custom pipeline files

| File | Role |
| --- | --- |
| `assets/js/runtime/master/vrodos_postprocessing.js` | Legacy render-loop hijack, render targets, resource lifecycle, pass execution |
| `assets/js/runtime/master/lib/vrodos-runtime-legacy-postfx.bundle.js` | Generated compiled-scene legacy post-FX bundle |
| `assets/js/runtime/master/vrodos_shaders_bloom.js` | Bright-pass and Gaussian blur shader factories |
| `assets/js/runtime/master/vrodos_shaders_sao.js` | SAO and bilateral blur shader factories |
| `assets/js/runtime/master/vrodos_shaders_fxaa.js` | FXAA shader factory |
| `assets/js/runtime/master/vrodos_shaders_taa.js` | TAA resolve shader factory |
| `assets/js/runtime/master/vrodos_shaders_ssr.js` | SSR shader factory |
| `assets/js/runtime/master/vrodos_shaders_composite.js` | Legacy composite shader factory |

### PMNDRS pipeline files

| File | Role |
| --- | --- |
| `assets/js/runtime/master/vrodos_postprocessing_pmndrs.js` | PMNDRS composer construction, effect ordering, AA, native SSAO, LUT, runtime debug overlay |
| `assets/js/runtime/master/lib/vrodos-postprocessing.bundle.js` | Bundled `window.POSTPROCESSING` |
| `assets/js/runtime/master/lib/vrodos-takram-atmosphere.bundle.js` | Bundled `window.VRODOS_TAKRAM_ATMOSPHERE` |
| `assets/js/runtime/master/lib/vrodos-runtime-pmndrs-postfx.bundle.js` | Generated compiled-scene PMNDRS post-FX adapter bundle |

## 3. Load Order

`templates/runtime/aframe/Master_Client_prototype.html` contains one `VRODOS_RUNTIME_SCRIPTS_PLACEHOLDER`. The compiler fills it from `assets/runtime-build-manifest.json` according to scene metadata. Rendering-relevant runtime chunks resolve in this order, omitting external networking/UI libraries:

```text
AFRAME_RUNTIME_URL_PLACEHOLDER
lib/vrodos-runtime-scene-components.bundle.js
lib/vrodos-runtime-core.bundle.js
optional FPS meter inline module
optional lib/vrodos-runtime-legacy-postfx.bundle.js
optional lib/vrodos-postprocessing.bundle.js
optional lib/vrodos-takram-atmosphere.bundle.js
optional lib/vrodos-runtime-pmndrs-postfx.bundle.js
lib/vrodos-runtime-aframe-components.bundle.js
```

The optional runtime bundle set is selected by `VRodos_Compiler_Runtime_Script_Planner`, not by hardcoded template script tags. PMNDRS and Takram bundles are generated from root `package.json` and `package-lock.json`. They must use A-Frame's `window.THREE`; compiled scenes must not load a second Three instance.

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
  -> optional NormalPass for native SSAO
  -> fused EffectPass:
       SSAOEffect
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

When AO is active, PMNDRS disables composer MSAA and recommends SMAA because the AO paths are not stable with hardware multisampling.

PMNDRS AO backends:

- Default: `POSTPROCESSING.NormalPass` plus `POSTPROCESSING.SSAOEffect`, with `SSAOEffect` merged into the fused `EffectPass`.
- The PMNDRS debug overlay reports `ao: native-ssao` or `ao: off`.

Native SSAO presets are tuned around the upstream PMNDRS SSAO demo, with `strong` matching the current tested high-quality screenshot values:

- Shared defaults: `distanceThreshold: 0.02`, `distanceFalloff: 0.0025`, `rangeThreshold: 0.0003`, `rangeFalloff: 0.0001`, `luminanceInfluence: 0.7`, `minRadiusScale: 0.33`, `depthAwareUpsamplingThreshold: 0.997`, `bias: 0.025`, `fade: 0.01`.
- `soft`: `resolutionScale: 0.5`, `samples: 9`, `rings: 7`, `radius: 0.1`, `intensity: 1.33`.
- `balanced`: `resolutionScale: 0.75`, `samples: 20`, `rings: 7`, `radius: 0.072`, `intensity: 1.67`.
- `strong`: `resolutionScale: 1.0`, `samples: 32`, `rings: 7`, `radius: 0.045`, `intensity: 2.01`.

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

## 7. PMNDRS/Takram Celestial Controls

Takram celestial controls are author-facing artistic presets, not geospatial solar simulation.

Scene settings:

- `pmndrsCelestialMode`: `manual` or `preset-time`
- `pmndrsCelestialTimePreset`: `sunrise`, `midday`, `golden-hour`, `sunset`, or `night`
- Existing manual controls remain valid: `pmndrsSunElevationDeg`, `pmndrsSunAzimuthDeg`, and `pmndrsMoonEnabled`

Runtime behavior:

- `manual` preserves the existing sun elevation/azimuth slider behavior.
- `preset-time` resolves the selected time preset through the existing Takram atmosphere look defaults before building local and ECEF sun/moon directions.
- The night preset turns the moon path on through `pmndrsMoonEnabled` unless the author explicitly overrides it in the compile dialog.
- Horizon PMNDRS night uses dim cool helper moonlight instead of daytime Horizon helper-light intensities; if the moon path is disabled, helper lights fall back to near black.
- HDR/scene-probe env-map intensity is scaled down at night without changing authored material roughness or metalness.
- Horizon `AerialPerspectiveEffect` remains gated behind `?vrodos_debug_enable_pmndrs_horizon_aerial=1`.

This phase does not add stars, `SkyLightProbe`, `SunDirectionalLight`, `LightingMaskPass`, geospatial latitude/longitude UI, or volumetric clouds.

## 8. Legacy Effect Notes

### TAA

Legacy TAA uses a 16-sample Halton jitter sequence, same-UV history sampling, Catmull-Rom history reconstruction, and neighborhood clipping. FXAA is skipped when TAA is active.

### SSR

Legacy SSR is half-resolution screen-space ray marching using the shared depth texture from the main render target. PMNDRS does not currently support SSR; scenes that require SSR should stay on `legacy`.

### SAO

Legacy SAO is half-resolution, depth-only ambient occlusion with bilateral blur and optional adaptive half-rate updates under low FPS.

## 9. HDR Environment Maps and Scene Probe

HDR environment presets are loaded through the runtime HDR loader and processed through `PMREMGenerator` for `scene.environment` and PBR material `envMap`.

Current presets:

- `studio`
- `quarry`
- `venice`

Scene probe capture is an alternate environment source when render quality and presentation mode allow it.

## 10. Version Source of Truth

- Root `package.json` and `package-lock.json` define runtime package intent.
- `npm run build:three` generates `assets/runtime-version-manifest.json`.
- `npm run build:runtime` generates the compiled-scene runtime bundles and the browser settings-contract script from `assets/runtime-settings-contract.json`.
- `VRodos_Render_Runtime_Manager` reads the generated manifest for A-Frame, Three, PMNDRS, and Takram metadata.
- The current live vendor bundle is Three.js r181.

## 11. Future Ideas

These are backlog items, not current implementation requirements:

- Depth of field after an author-facing focus workflow is selected.
- Continue validating native `POSTPROCESSING.SSAOEffect` across broader Horizon and non-Horizon scenes.
- Outline/selective bloom, god rays, tilt shift, pixelation, glitch, and shock wave.
- Takram stars, geospatial date/time solar simulation, `SkyLightProbe`, `SunDirectionalLight`, and geospatial helpers.
- Volumetric clouds after the PMNDRS/Takram baseline remains stable.

## References

- `RENDERING_NEXT_STEPS.md` - live rendering phase tracker.
- `RENDERING_MIGRATION_IMPLEMENTATION_LOG.md` - staged migration history.
- `POSTFX_DEBUG_NOTES.md` - color-encoding and WebGLRenderer debugging history.
