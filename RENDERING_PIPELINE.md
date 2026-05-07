# VRodos Rendering Pipeline - Technical Reference

Canonical reference for the compiled A-Frame scene rendering stack on the current package-synchronized A-Frame master + Three r181 runtime. For end-user feature summaries, see `README.md`. For the phased Takram realism roadmap, see `TAKRAM_REALISTIC_LIGHTING_PLAN.md`. For historical WebGLRenderer debugging notes, see `POSTFX_DEBUG_NOTES.md`.

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
| `assets/js/runtime/master/vrodos_spector_debug.js` | Debug-only Spector.js loader for `?vrodos_spector=1` |
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
| `assets/js/runtime/master/vrodos_postprocessing_pmndrs.js` | PMNDRS composer construction, effect ordering, AA, native SSAO, LUT, Takram lens flare, runtime debug overlay |
| `assets/js/runtime/master/lib/vrodos-postprocessing.bundle.js` | Bundled `window.POSTPROCESSING` |
| `assets/js/runtime/master/lib/vrodos-takram-atmosphere.bundle.js` | Bundled `window.VRODOS_TAKRAM_ATMOSPHERE`, including Takram atmosphere and geospatial effects |
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

## 3a. Debug And Profiling Hooks

Use the CDP profiler for repeatable timing and resource captures:

```bash
node scripts/profile-master-client.mjs http://wp.local:5832/Master_Client_766.html --output C:\tmp\vrodos-master-client-after.json
```

Use Spector.js only as debug instrumentation for a single WebGL frame:

```bash
node scripts/profile-master-client.mjs http://wp.local:5832/Master_Client_766.html --disable-fps-meter --spector --spector-output C:\tmp\vrodos-master-client-spector.json
```

For manual captures, append `?vrodos_spector=1` to a compiled client URL. This dynamically loads `https://cdn.jsdelivr.net/npm/spectorjs@0.9.30/dist/spector.bundle.js`, exposes `window.VRODOS_SPECTOR`, and opens Spector's UI. Normal URLs do not load Spector.

Compiled clients also expose `window.VRODOS_COMPILE_DIAGNOSTICS` when generated by the current compiler. Use it to correlate profiler/Spector findings with large assets, duplicate asset URLs, and expensive scene composition.

When comparing frame times, turn the runtime FPS meter off unless the meter itself is under test. The StatsGL path uses GPU queries that show up in Spector captures as query commands and can pollute frame anatomy.

Use the read-only GLB audit after a profiler capture to map compile diagnostics back to local asset metadata:

```bash
node scripts/audit-master-client-assets.mjs --profile C:\tmp\vrodos-master-client-no-fps-spector-run.json --output C:\tmp\vrodos-master-client-asset-audit.json --markdown C:\tmp\vrodos-master-client-asset-audit.md
```

The audit parses GLB headers/JSON without rewriting uploads. It estimates unique source triangles, primitive count, material count, compression extensions, and first-action recommendations. Compression automation should generate cached derivatives at upload or compile time; compiled A-Frame pages should load validated Meshopt/Draco/KTX2 derivatives rather than compressing raw GLBs in the browser during page load.

Use profiler resource overrides for compiled-scene derivative trials before changing compiler substitution rules:

```bash
node scripts/profile-master-client.mjs http://wp.local:5832/Master_Client_766.html --disable-fps-meter --resource-override "/wp-content/uploads/archaeology-joker/models/asphalt_injection8_-_monacoazure_coast.glb=C:\tmp\vrodos-master-client-optimized-assets\01-asphalt-injection8-monacoazure-coast.safe-draco.glb" --output C:\tmp\vrodos-master-client-draco-asphalt-override.json
```

`--resource-override` is repeatable. It uses CDP request interception and is intended for one-off derivative validation; production clients should reference validated cached derivative URLs directly.

Prototype optimized derivatives with glTF Transform:

```bash
npm run assets:optimize:prototype -- --audit C:\tmp\vrodos-master-client-asset-audit.json --output-dir C:\tmp\vrodos-master-client-optimized-assets --profile safe-draco --limit 3
```

Derivative prototype profiles:

- `safe-draco`: prune, dedupe, and Draco geometry compression. It preserves source uploads and does not resize textures or simplify geometry.
- `safe-meshopt`: prune, dedupe, and Meshopt geometry compression. It is for comparison until a regenerated compiled client is visually checked with Meshopt decoder wiring.

Current loader caveat: compressed derivatives must not be substituted into compiled pages until the generated client's root `gltf-model` config is present and visual parity is checked with the relevant decoder.

Future admin-panel optimization should be derivative-based: keep the original uploaded asset, generate one or more cached optimized variants, store metadata about size/profile/validation, and let scene compilation choose a validated derivative by render profile.

### Admin Derivative Storage

`VRodos_Asset_Optimization_Manager` provides the first admin-side derivative workflow for `vrodos_asset3d`:

- The asset edit screen has a `GLB Optimization` metabox.
- Settings > Assets shows library-level GLB analysis and safe Draco derivative status.
- `Generate safe Draco derivative` runs the same glTF Transform `prune -> dedup -> draco` flow used by the prototype script.
- New or updated `vrodos_asset3d_glb` metadata triggers read-only GLB benefit analysis and stores `_vrodos_asset3d_glb_analysis`.
- `Generate recommended safe Draco derivatives` batch-generates only analysis-recommended local GLB derivatives in bounded admin requests and stops automatic continuation on failures.
- Derivatives are stored in uploads under `vrodos-optimized-assets/asset-{asset_id}/`.
- Metadata lives in `_vrodos_asset3d_glb_derivatives`.
- Compilation uses a derivative only when the asset's `Use active derivative in compiled scenes` checkbox is enabled.
- If the derivative file is missing or the stored source URL no longer matches the current GLB URL, compilation falls back to the original GLB.

`VRodos_Compiler_AFrame_Entity_Renderer` is the URL selection point. It keeps scene JSON untouched, resolves the active derivative during compilation by `asset_id`, and adds a compile diagnostic note when a derivative is used.

LOD should follow the same derivative contract: generated alternatives are stored beside the source asset, compile-time scene output chooses them only after explicit opt-in, and runtime switching should be validated with Spector/CDP because LOD targets submitted geometry and repeated pass cost rather than transfer size alone.

### Compressed Asset Decoder Paths

The compiler now writes A-Frame decoder paths onto the root scene:

```html
<a-scene gltf-model="dracoDecoderPath: /wp-content/plugins/VRodos/assets/vendor/three-r181/draco/gltf/; basisTranscoderPath: /wp-content/plugins/VRodos/assets/vendor/three-r181/basis/; meshoptDecoderPath: /wp-content/plugins/VRodos/assets/vendor/three-r181/meshopt/meshopt_decoder.js;">
```

Decoder files are copied by `npm run build:three` and recorded in `assets/runtime-version-manifest.json` under `three.decoders`.
Use the browser-global Meshopt decoder file, `meshopt_decoder.js`, in generated clients. A-Frame loads `meshoptDecoderPath` as a classic script, so the ESM `meshopt_decoder.module.js` form is not valid there. The vendor build also refreshes `meshopt_decoder.module.js` with the same browser-global payload as a compatibility copy for already-generated clients.

A short smoke profile on `Master_Client_766.html` confirmed the generated root scene attribute points at `meshopt_decoder.js` and no longer throws the previous Meshopt `Unexpected token 'export'` / `MeshoptDecoder.ready` errors. For future captures, inspect `scene.gltfModel` in `scripts/profile-master-client.mjs` output to confirm the root scene attribute and decoder globals.

The first compiled-scene safe Draco trial substituted only `asphalt_injection8_-_monacoazure_coast.glb` through `--resource-override`. It reduced transfer/encoded/decoded resource bytes by about `11.2MB`, kept object/material/texture counts unchanged, and produced no loader exceptions. This validates the compressed-geometry loader path, but it does not reduce draw calls or material switches by itself.

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
  -> optional NormalPass for native SSAO
  -> optional standalone LensFlareEffect pass
  -> fused EffectPass:
       optional Takram AerialPerspectiveEffect for non-Horizon or Horizon aerial-haze path
       SSAOEffect
       BloomEffect
       selectable ToneMappingEffect
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

Takram LensFlareEffect is intentionally not merged into the fused `EffectPass`. It is a convolution effect, so it runs as its own pass when `pmndrsLensFlareEnabled` is true and the Horizon Takram sun is active.

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

## 7. PMNDRS/Takram Atmosphere and Horizon Lighting

Takram controls are author-facing artistic presets today, not full geospatial solar simulation. Horizon scenes use Takram `SkyMaterial` for the sky and sun disk. A-Frame default lights are disabled for Takram Horizon scenes.

Scene settings:

- `pmndrsToneMappingMode`: `agx`, `reinhard`, `cineon`, `aces-filmic`, or `linear`
- `pmndrsToneMappingExposure`: `1.0` to `20.0`
- `pmndrsLensFlareEnabled`
- `pmndrsCorrectAltitudeEnabled`
- `pmndrsCelestialMode`: `manual` or `preset-time`
- `pmndrsCelestialTimePreset`: `sunrise`, `midday`, `golden-hour`, `sunset`, or `night`
- Existing manual controls remain valid: `pmndrsSunElevationDeg`, `pmndrsSunAzimuthDeg`, and `pmndrsMoonEnabled`

Runtime behavior:

- `manual` preserves the existing sun elevation/azimuth slider behavior.
- `preset-time` resolves the selected time preset through the existing Takram atmosphere look defaults before building local and ECEF sun/moon directions.
- The night preset turns the moon path on through `pmndrsMoonEnabled` unless the author explicitly overrides it in the compile dialog.
- Horizon PMNDRS night uses dim cool helper moonlight instead of daytime Horizon helper-light intensities; if the moon path is disabled, helper lights fall back to near black.
- HDR/scene-probe env-map intensity is scaled down at night without changing authored material roughness or metalness.
- Horizon uses stable helper lights by default for A-Frame/PBR material-authored scenes.
- Takram physical `SunDirectionalLight` and `SkyLightProbe` remain available for validation behind `?vrodos_debug_takram_physical_lights=1`.
- Horizon `AerialPerspectiveEffect` is constrained to haze/transmittance in the current PBR path so it does not re-light the scene as albedo.
- The future Takram-vanilla target is an explicit `post-process-albedo` lighting mode, documented in `TAKRAM_REALISTIC_LIGHTING_PLAN.md`.

This phase does not add stars, author-facing geospatial latitude/longitude UI, `LightingMaskPass`, SSGI, or volumetric clouds.

## 8. Shadow-Aware Lighting And Reflections

Compiled scenes run a lighting-participation pass from `vrodos_quality_profiles.js` and material shader hooks from `vrodos_master_rendering.js`.

Scene settings:

- `reflectionsEnabled`: global reflections switch. When off, runtime environment reflections and direct material specular/glint contribution are suppressed.
- `reflectionProfile`: intensity shaping for enabled reflections: `soft`, `balanced`, or `enhanced`.
- `reflectionSource`: `hdr` or `scene-probe`; the effective source becomes `none` when no HDR preset/probe is active or global reflections are disabled.
- `sceneProbeUpdateMode`: scene-probe capture cadence. `static` captures after load/settle and does not refresh from player movement; `slow-dynamic` allows rare refreshes after substantial movement or yaw changes.
- `sceneProbeResolution`: scene-probe cubemap size: `64`, `128`, or `256`. Default is `128`.
- `reflectionOcclusionMode`: `auto`, `off`, or `strong`; controls shadow-based direct-sun glint/specular attenuation.

Lighting participation:

- Visible compiled world meshes cast and receive shadows by default when `shadowQuality` is not `off`.
- Image assets, video display planes, POI link objects, POI image/text trigger objects, and visible POI image/text panel surfaces participate like decoration meshes.
- Hidden navmesh helper materials, camera-attached UI, skies, avatars, helper lights, and debug objects are excluded.
- Walkable/navmesh world surfaces are receiver-only to avoid low-angle ground self-shadow banding.
- Directional sun/helper lights receive an adaptive orthographic shadow-camera fit around nearby world bounds and the current camera region.

Reflection/glint handling:

- Standard, Physical, and Phong materials get a runtime shader hook when shadow-aware reflections or global reflection suppression is active.
- Direct specular, indirect specular, clearcoat, sheen, and bright glint output are multiplied by a shadow-aware specular factor.
- This is separate from SSR. In PMNDRS scenes, a bright road glint with `reflection=none` is direct sun/specular energy, so the shader hook is what suppresses it under a blocker.
- In immersive XR the custom shadow-aware reflection attenuation is disabled and the runtime keeps the safer scene-owned fallback behavior.

Diagnostics:

- Compiled PMNDRS Horizon scenes emit one default startup state line with the active engine, owner, reflection source, reflection occlusion mode, shadow quality, celestial preset, sun direction, exposure, tone mapping, lens flare, and light source.
- Use `?vrodos_debug_pmndrs_horizon=1` for repeated debug-level diagnostic lines when the diagnostic signature changes.
- Use `?vrodos_debug_pmndrs_horizon_verbose=1` for info-level diagnostic lines.
- Expanded diagnostic fields include `shadowCasters`, `shadowReceivers`, `shadowReceiverOnly`, `dirShadowLights`, `fittedDirLights`, and `shadowFit`.

## 9. Legacy Effect Notes

### TAA

Legacy TAA uses a 16-sample Halton jitter sequence, same-UV history sampling, Catmull-Rom history reconstruction, and neighborhood clipping. FXAA is skipped when TAA is active.

### SSR

Legacy SSR is half-resolution screen-space ray marching using the shared depth texture from the main render target. PMNDRS does not currently support SSR; scenes that require SSR should stay on `legacy`.

### SAO

Legacy SAO is half-resolution, depth-only ambient occlusion with bilateral blur and optional adaptive half-rate updates under low FPS.

## 10. HDR Environment Maps and Scene Probe

HDR environment presets are loaded through the runtime HDR loader and processed through `PMREMGenerator` for `scene.environment` and PBR material `envMap`.

Current presets:

- `studio`
- `quarry`
- `venice`

Scene probe capture is an alternate environment source when render quality and presentation mode allow it. It is disabled on mobile and immersive VR, and it still requires high render quality.

Scene-probe capture is intentionally smooth-first by default:

- `sceneProbeUpdateMode=static` captures once after scene/model settle and then keeps that PMREM environment stable during camera/player movement.
- `sceneProbeUpdateMode=slow-dynamic` refreshes only after a larger anchor movement threshold, a larger yaw threshold, and a multi-second cooldown.
- `sceneProbeResolution=128` is the default cubemap size. `64` is available for heavier scenes, and `256` is available for sharper reflections on stronger machines.

If `reflectionsEnabled` is off, `getEffectiveReflectionSource()` returns `none`, scene environment maps are cleared, material `envMapIntensity` becomes zero, and direct specular/glint output is suppressed by the material shader hook.

## 11. Version Source of Truth

- Root `package.json` and `package-lock.json` define runtime package intent.
- `npm run build:three` generates `assets/runtime-version-manifest.json`.
- `npm run build:runtime` generates the compiled-scene runtime bundles and the browser settings-contract script from `assets/runtime-settings-contract.json`.
- `VRodos_Render_Runtime_Manager` reads the generated manifest for A-Frame, Three, PMNDRS, and Takram metadata.
- The current live vendor bundle is Three.js r181.
- The classic compiled A-Frame runtime must not load a second Three instance. Any attempt to test a newer Three version belongs in a separate A-Frame module/import-map runtime spike.

## 12. Future Ideas

These are backlog items, not current implementation requirements:

- Explicit `pmndrsHorizonLightingMode` with `helper`, `light-source`, and `post-process-albedo`.
- Desktop-only Takram-vanilla `post-process-albedo` mode.
- Continue validating native `POSTPROCESSING.SSAOEffect` across broader Horizon and non-Horizon scenes.
- A-Frame module/import-map runtime spike for future Three upgrades.
- SSGI desktop research after Takram lighting ownership is correct.
- Takram stars, geospatial date/time solar simulation, `LightingMaskPass`, and geospatial helpers.
- Volumetric clouds after the PMNDRS/Takram lighting baseline remains stable.

## References

- `TAKRAM_REALISTIC_LIGHTING_PLAN.md` - phased Takram realism and Three/SSGI roadmap.
- `RENDERING_MIGRATION_IMPLEMENTATION_LOG.md` - staged migration history.
- `POSTFX_DEBUG_NOTES.md` - color-encoding and WebGLRenderer debugging history.
