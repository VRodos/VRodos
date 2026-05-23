# VRodos Rendering Pipeline - Technical Reference

Canonical reference for the compiled A-Frame scene rendering stack on the current package-synchronized A-Frame 1.7.1/master-commit + Three r181 runtime. For end-user feature summaries, see `README.md`. For the phased Takram realism roadmap, see `TAKRAM_REALISTIC_LIGHTING_PLAN.md`. For historical WebGLRenderer debugging notes, see `POSTFX_DEBUG_NOTES.md`.

## 1. Runtime Overview

Compiled scenes support two mutually exclusive post-processing engines selected per scene by `scene-settings.postFXEngine`:

- `legacy`: VRodos custom render-target pipeline with SAO, SSR, bloom, color grading, FXAA, and TAA.
- `pmndrs`: PMNDRS `EffectComposer` path using bundled `postprocessing` and optional Takram atmosphere integration.

The compiled `scene-settings` attribute remains the compatibility data contract. Runtime behavior is split into focused A-Frame components registered before `<a-scene>`:

- `vrodos-render-profile`: renderer quality, static/dynamic shadows, adaptive shadow fit, and FPS updates.
- `vrodos-postfx-router`: legacy vs PMNDRS ownership and composer enable/disable routing.
- `vrodos-atmosphere`: Takram sky, sun/moon state, and day-night cycle updates.
- `vrodos-reflections`: HDR environment maps, scene probe capture, and Takram sky PMREM updates.

`scene-settings` still owns schema parsing, compatibility helpers, and existing public methods used by those components.

Presentation mode is part of the rendering contract:

- Inline desktop and desktop fullscreen use the same eligible post-FX path.
- Real immersive WebXR is detected through `renderer.xr.isPresenting`.
- In immersive XR, XR-unsafe screen-space composer passes can fall back to direct stereo rendering while scene-owned visuals remain active: Horizon/Takram sky, scene-owned lights, fog, exposure/tone mapping, environment maps, and material profiles.

## 2. File Organization

### Shared runtime files

| File | Role |
| --- | --- |
| `assets/js/runtime/master/components/vrodos_scene_settings.component.js` | A-Frame schema, lifecycle, settings getters, engine dispatcher |
| `assets/js/runtime/master/components/vrodos_runtime_pipeline.component.js` | Focused A-Frame components/systems for render profile, post-FX routing, atmosphere, and reflections |
| `assets/js/runtime/master/components/vrodos_navigation.component.js` | Compiled-scene walk/fly navigation, walkable-surface ground sampling, static player collision, wall sliding, and nav diagnostics |
| `assets/js/runtime/master/vrodos_master_rendering.js` | HDR loader and shared material/runtime helpers |
| `assets/js/runtime/master/vrodos_runtime_resources.js` | Runtime resource registry for disposing Three resources, postprocessing objects, and event listeners |
| `assets/js/runtime/master/vrodos_spector_debug.js` | Debug-only Spector.js loader for `?vrodos_spector=1` |
| `assets/js/runtime/master/vrodos_scene_probe.js` | HDR and scene-probe environment map support |
| `assets/js/runtime/master/vrodos_quality_profiles.js` | Source for render, shadow, material, background, post-FX, Horizon, and Takram quality profiles |
| `assets/js/runtime/master/lib/vrodos-runtime-core.bundle.js` | Generated compiled-scene core runtime bundle |
| `assets/js/runtime/master/lib/vrodos-runtime-scene-components.bundle.js` | Generated compiled-scene POI/media/assessment component bundle |
| `assets/js/runtime/master/lib/vrodos-runtime-aframe-components.bundle.js` | Generated compiled-scene master A-Frame component bundle |
| `assets/js/runtime/master/lib/vrodos-collision-bvh.bundle.js` | Bundled `three-mesh-bvh` helpers exposed as `window.VRODOS_COLLISION_BVH` for static player/world collision acceleration |
| `assets/runtime-build-manifest.json` | Generated runtime chunk manifest consumed by the compiler script planner |

### Compiler and build files

| File | Role |
| --- | --- |
| `includes/class-vrodos-compiler-runtime-page-builder.php` | Shared Master/Simple page assembly: template load, DOM setup, scene settings, decoder config, object rendering, diagnostics, and output writing |
| `includes/class-vrodos-compiler-runtime-manifest.php` | Runtime chunk manifest validation and dependency resolution |
| `includes/class-vrodos-compiler-runtime-script-planner.php` | Scene metadata to lazy runtime script selection |
| `scripts/build-runtime-master-bundles.mjs` | Builds runtime bundles, generated settings-contract script, and `assets/runtime-build-manifest.json` |
| `assets/runtime-settings-contract.json` | Source of truth for compiled `scene-settings` defaults and related runtime presets |

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
optional lib/vrodos-collision-bvh.bundle.js
optional lib/vrodos-runtime-legacy-postfx.bundle.js
optional lib/vrodos-postprocessing.bundle.js
optional lib/vrodos-takram-atmosphere.bundle.js
optional lib/vrodos-runtime-pmndrs-postfx.bundle.js
lib/vrodos-runtime-aframe-components.bundle.js
```

The optional runtime bundle set is selected by `VRodos_Compiler_Runtime_Script_Planner`, not by hardcoded template script tags. PMNDRS, Takram, and collision BVH bundles are generated from root `package.json` and `package-lock.json`. They must use A-Frame's `window.THREE`; compiled scenes must not load a second Three instance.

`assets/runtime-build-manifest.json` is the compiled-client chunk source of truth. The build and PHP manifest loader validate:

- missing script files
- script chunks without `src`
- undeclared dependency ids
- duplicate order conflicts
- missing feature coverage declarations

Lazy-loading expectations:

- PMNDRS vendor and PMNDRS runtime load only when PMNDRS post-FX is selected.
- Takram loads only when PMNDRS atmosphere is enabled.
- Networked components are pruned from single-player output.
- The FPS meter remains an optional inline module.

`VRodos_Compiler_Runtime_Page_Builder` owns the common generated-page path for Master and Simple clients. Master/Simple differences should stay as small strategies around player/network UI, not as duplicated template/DOM/rendering code.

### Runtime lifecycle and disposal

The compiled runtime does not add a second `requestAnimationFrame` render loop. Continuous work stays inside A-Frame component `tick()` handlers or the existing A-Frame render path. The post-FX router controls which engine owns post-processing, while the PMNDRS and legacy helpers continue to integrate with A-Frame's renderer instead of running an independent loop.

Runtime helpers should use `window.VRODOSMaster.RuntimeResources` for resources that need explicit cleanup:

- geometries, materials, textures, and render targets
- PMNDRS composers, passes, and effects
- PMREM targets and scene-probe/HDR environment targets
- event listeners registered by runtime helpers

Removing an object from the scene is not cleanup; obsolete GPU resources still need `dispose()` through the owning lifecycle path.

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

The profiler records renderer CSS size, drawing-buffer size, effective pixel ratio, estimated render pixels, and any runtime pixel-budget decision. To compare fullscreen/high-DPR cost, use an explicit viewport and device scale factor:

```bash
node scripts/profile-master-client.mjs http://wp.local:5832/Master_Client_766.html --disable-fps-meter --viewport 3840x2160 --dpr 2 --output C:\tmp\vrodos-master-client-4k-dpr2.json
```

Compiled desktop runtime applies a render-pixel budget automatically only to the `performance` render-quality profile. `high` keeps the current visual DPR behavior by default, while `?vrodos_dpr_pixel_budget=1650000` can force a desktop profiling override. Immersive WebXR is excluded from this budget path.

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
- Settings > Assets shows library-level GLB analysis and safe Draco derivative status for GLB-referenced assets only as a diagnostics/reporting view.
- `Generate safe Draco derivative` runs the same glTF Transform `prune -> dedup -> draco` flow used by the prototype script.
- New or updated `vrodos_asset3d_glb` metadata triggers read-only GLB benefit analysis and stores `_vrodos_asset3d_glb_analysis`.
- The top-level VRodos dashboard has an `Actionable Assets` tab for the highest-priority GLB optimization items, single-asset refresh/generate derivative actions, and a Compile Use toggle for ready derivatives.
- Dashboard analysis refresh and Compile Use toggles use `admin-ajax.php` and update the affected row in place. Safe Draco generation still uses the signed admin action path because it writes derivative files.
- Derivatives are stored in uploads under `vrodos-optimized-assets/asset-{asset_id}/`.
- Metadata lives in `_vrodos_asset3d_glb_derivatives`.
- Permanent deletion of a `vrodos_asset3d` post removes its derivative cache directory and optimization metadata. Project deletion paths that delete associated assets inherit this cleanup.
- Compilation uses a derivative only when the asset's `Use active derivative in compiled scenes` checkbox or dashboard Compile Use toggle is enabled.
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

### Static Navigation And Collision Runtime

Compiled walkable mode uses a native static player/world collision layer owned by `custom-movement`, not a general rigid-body physics engine.

Authoring and compile contract:

- Geometry-bearing compiled objects are player-collidable by default.
- The editor stores a per-object `compiledCollisionEnabled` flag through the `Collides with player` checkbox.
- Objects with missing collision metadata are treated as collidable during compile for backward compatibility.
- The compiler emits `.vrodos-collider` plus `data-vrodos-collision-*` metadata for enabled geometry sources.
- `Walkable Surfaces` compile as both `.vrodos-navmesh` and `.vrodos-collider`: upward faces feed ground sampling, while steep/vertical faces can block horizontal movement.
- `Collision Proxy` and legacy/internal `blocking-obstacles` assets compile as hidden collision-only geometry through `vrodos-collider-helper`.

Runtime behavior:

- `custom-movement` rebuilds static collision targets when relevant models load, attach, detach, or become dirty.
- `three-mesh-bvh` is bundled into `vrodos-collision-bvh.bundle.js` and exposed as `window.VRODOS_COLLISION_BVH`.
- The runtime patches Three mesh raycasts with BVH acceleration when available; if BVH construction fails for a mesh, collision continues with standard Three.js raycasts.
- Ground movement still uses the existing downward navmesh sampling, slope filtering, max-step, max-drop, and recovery logic.
- Walkable surfaces with `data-vrodos-walk-behavior="auto"` add rough-terrain support probes around the player footprint only after the direct ground sample fails or detects a small pit. These probes can bridge photogrammetry holes and prefer nearby stable upper support over scan pits, but only when surrounding hits are valid walkable ground.
- Horizontal movement performs multi-height capsule sweep raycasts against blocker meshes before committing a candidate position.
- When a blocker is hit, movement tries axis sliding and rejects the movement if sliding would leave valid walkable ground or hit another blocker.
- For validated `auto` terrain steps/recovery, low riser-height steep hits from the walkable mesh itself can be treated as scan detail so stair risers and pit lips do not snag the capsule. Body/head-height walkable-mesh wall hits and explicit solid/collision-proxy blockers still block.
- Manual auto-terrain recovery is available from Space or the mapped controller recovery buttons. It first tries recent stable auto ground, then nearby supported auto ground, and rejects candidates that exceed recovery lift/drop limits, lack footprint support, or hit solid/proxy blocker geometry. The wider nearby search is event-only and stops at the first radius with a valid candidate.
- Fly mode remains non-colliding in v1.

Collision is CPU-side Three.js geometry work. It is independent of the post-processing engine, Takram atmosphere, scene probes, shadow profiles, and material overrides. PMNDRS/Takram settings can change the rendered scene, but they do not change which mesh geometry participates in player blocking.

Performance notes:

- BVH construction has an upfront load-time and memory cost.
- Per-frame collision cost is paid only while movement is being resolved.
- Default-collidable high-poly art is the main risk; use `Collision Proxy` assets for cheaper blocker geometry around complex models.
- The nav performance overlay (`?vrodos_debug_nav_perf=1`) reports navmesh target count, blocker target count, raycast count, intersection count, and timing.
- Remaining diagnostics planned in `AFRAME_COLLISION_ROADMAP.md` include collider triangle counts, BVH build time, spawn clearance checks, blocked/slid state, and richer proxy visualization.

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

## 5. Static Shadows And Shadow Roles

Compiled desktop scenes default to cached static shadow updates through the `scene-settings.shadowUpdateMode` field:

- `static`: render shadow maps on load/reveal and explicit dirty events, then keep `renderer.shadowMap.autoUpdate = false` for steady frames.
- `dynamic`: keep per-frame shadow-map updates for authored scenes that genuinely need moving shadow casters.

Runtime dirty events call `markShadowDirty(reason)` and are flushed through a debounced `flushShadowUpdate()` path. Current dirty sources include model load, delayed scene reveal, resize, material profile changes, photoreal/Takram helper light changes, and forced adaptive shadow refits. `?vrodos_debug_shadow_perf=1` shows shadow mode, update count, dirty reason, caster/receiver counts, and shadow-light counts.

The compiler emits semantic shadow roles so runtime profiles can exclude non-visual helpers while keeping visible authored content realistic:

- GLB world/solid geometry: `data-vrodos-shadow-role="caster-receiver"` by default.
- Walkable/navmesh geometry: `receiver` plus `data-vrodos-shadow-receiver-only`, so large ground surfaces receive shadows without self-shadow banding.
- Image planes, video planes, audio markers, 3D text/POI panels, and POI trigger buttons: `caster-receiver` by default.
- Collision proxies and hidden blockers: `none`.

Receiver-only shadows are an explicit optimization path for surfaces that should not self-cast. Legacy compiled non-navmesh entities that still carry `data-vrodos-shadow-role="receiver"` are upgraded to caster/receivers at runtime unless they also carry `data-vrodos-shadow-receiver-only`.

Point and spot lights only cast shadows when authored to do so. VRodos-managed photoreal/Takram directional lights may still cast shadows because they are the intentional scene-lighting source.

### Directional shadow precision

Directional sun/helper lights use an adaptive orthographic shadow-camera fit rather than one scene-wide shadow frustum. The fit is camera-focused for large terrain:

- High shadow quality builds focused terrain bounds about `180` world units around the camera.
- Medium shadow quality builds focused terrain bounds about `120` world units around the camera.
- Large walkable/terrain meshes that contain the camera are intersected with that local box before being unioned into the light fit.
- Whole-scene bounds are a fallback only when a camera-focused fit cannot be built.

This keeps shadow-map texels concentrated near the player and avoids low-angle day/night terrain banding caused by fitting the directional light to an entire large GLB.

Day/night cycle shadows keep runtime-forced `pcf` filtering. The current PMNDRS/Takram shadow softness defaults are:

- High shadow quality: directional `shadow.radius = 2.4`.
- Medium shadow quality: directional `shadow.radius = 1.8`.
- Debug override: `?vrodos_debug_day_night_shadow_radius=VALUE`, clamped to `0..6`.

Takram sun shadows and VRodos-managed directional helper shadows use the same contact-shadow profile. Bias remains negative, `normalBias` remains small, and the old hardcoded positive Takram bias values must not be reintroduced.

### Terrain self-shadow stabilization

Large authored terrain can legitimately need to cast shadows from steep peaks while broad walkable slopes must avoid low-angle self-shadow acne. VRodos handles that with a terrain material role plus terrain-specific shadow-map writes:

- `data-vrodos-material-role="terrain-matte"` or walkable/navmesh terrain candidates resolve to the `terrain-matte` role unless the material has strong authored glossy/PBR intent.
- `terrain-matte` materials are forced to `FrontSide`, `metalness = 0`, roughness at least `0.94`, env-map intensity capped at `0.08`, and normal-map scale reduced to `0.22` by default.
- Terrain shadow casting side is `FrontSide`; using backside/null shadow casting caused incorrect peak lighting in high-altitude terrain.
- Self-shadowing terrain receives a custom `MeshDepthMaterial` with polygon offset. Defaults are factor `4`, units `8`.
- The terrain material shader lifts only near-depth directional self-shadow samples. Real mountain-cast hard shadows remain intact, while soft triangle/band patterns from shallow terrain self-shadow are suppressed.

Terrain shadow debug flags:

- `vrodos_debug_disable_terrain_normal_map=1`
- `vrodos_debug_terrain_normal_scale=VALUE`
- `vrodos_debug_disable_terrain_shadow_depth_offset=1`
- `vrodos_debug_terrain_shadow_depth_offset_factor=VALUE`
- `vrodos_debug_terrain_shadow_depth_offset_units=VALUE`
- `vrodos_debug_disable_terrain_soft_shadow_lift=1`
- `vrodos_debug_terrain_soft_shadow_lift_strength=VALUE`
- `vrodos_debug_terrain_soft_shadow_target=VALUE`
- `vrodos_debug_terrain_soft_shadow_gap_start=VALUE`
- `vrodos_debug_terrain_soft_shadow_gap_end=VALUE`

## 6. PMNDRS Pipeline

The PMNDRS engine uses `POSTPROCESSING.EffectComposer` and builds a scene-specific composer lazily on the first valid render frame.

Current PMNDRS ordering:

```text
RenderPass
  -> optional NormalPass for native SSAO
  -> optional standalone Takram sun LensFlareEffect pass
  -> primary EffectPass:
       optional Takram AerialPerspectiveEffect for non-Horizon or Horizon aerial-haze path
       SSAOEffect
       BloomEffect
       selectable ToneMappingEffect
       BrightnessContrastEffect
       HueSaturationEffect
       LUT3DEffect
       VignetteEffect
       NoiseEffect
  -> optional standalone ChromaticAberrationEffect pass
  -> optional standalone SMAAEffect pass
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

Native SSAO presets are budgeted so the final color buffer stays full-resolution while the AO normal/depth work scales with the AO preset:

- Shared defaults: `distanceThreshold: 0.02`, `distanceFalloff: 0.0025`, `rangeThreshold: 0.0003`, `rangeFalloff: 0.0001`, `luminanceInfluence: 0.7`, `minRadiusScale: 0.33`, `depthAwareUpsamplingThreshold: 0.997`, `bias: 0.025`, `fade: 0.01`.
- `soft`: `resolutionScale: 0.5`, `samples: 8`, `rings: 5`, `radius: 0.06`, `intensity: 1.33`.
- `balanced`: `resolutionScale: 0.5`, `samples: 12`, `rings: 5`, `radius: 0.06`, `intensity: 1.67`.
- `strong`: `resolutionScale: 0.75`, `samples: 20`, `rings: 7`, `radius: 0.06`, `intensity: 2.01`.

Takram LensFlareEffect is intentionally not merged into the primary `EffectPass`. It is a convolution effect, so it runs as its own pass when `pmndrsLensFlareEnabled` is true and the Horizon Takram sun is active. Chromatic aberration also runs as a late standalone convolution pass after Takram/tone/color processing, and SMAA runs as the final standalone pass when enabled.

Composer lifecycle:

- `RenderPass` stays first.
- Compatible fullscreen effects are merged into the fewest practical `EffectPass` instances; convolution effects stay isolated when PMNDRS cannot merge them safely.
- Resize flows through the PMNDRS composer/update helpers instead of direct target mutation.
- Composer, passes, effects, lookup textures, and render targets are disposed through their own lifecycle and the shared runtime resource helper.

## 7. PMNDRS Built-In LUT Looks

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

## 8. PMNDRS/Takram Atmosphere and Horizon Lighting

Takram controls are author-facing artistic presets today, not full geospatial solar simulation. Horizon scenes use Takram `SkyMaterial` for the sky and sun disk. A-Frame default lights are disabled for Takram Horizon scenes.

Scene settings:

- `pmndrsToneMappingMode`: `agx`, `reinhard`, `cineon`, `aces-filmic`, or `linear`
- `pmndrsToneMappingExposure`: `0.1` to `5.0`, in `0.1` increments
- `pmndrsLensFlareEnabled`
- `pmndrsCorrectAltitudeEnabled`
- `pmndrsCelestialMode`: `manual` or `preset-time`
- `pmndrsCelestialTimePreset`: `sunrise`, `midday`, `golden-hour`, `sunset`, or `night`
- Existing manual controls remain valid: `pmndrsSunElevationDeg`, `pmndrsSunAzimuthDeg`, and `pmndrsMoonEnabled`

Runtime behavior:

- `manual` preserves the existing sun elevation/azimuth slider behavior.
- `preset-time` resolves the selected time preset through the existing Takram atmosphere look defaults before building local and ECEF sun/moon directions.
- The night preset turns the moon path on through `pmndrsMoonEnabled` unless the author explicitly overrides it in the compile dialog.
- Horizon PMNDRS night uses Takram physical light sources when available, with dim cool moonlight instead of daytime Horizon key-light intensity.
- Direct sun and moon scene lights are gated by local celestial elevation. The sun fades in only above the horizon, and the moon fades in only after it is visibly above the horizon; when either body is below that threshold, its scene light intensity and shadow casting are zero. The sky, stars, indirect fill, and environment behavior can still contribute separately.
- HDR/scene-probe env-map intensity is scaled down at night without changing authored material roughness or metalness.
- Horizon uses one PMNDRS/Takram light-source path for local PBR scenes. Because Takram's documented light-source mode approximates sky irradiance at one point and the VRodos local-Horizon path disables Takram ground rendering, VRodos applies a separate sun-elevation-based PBR indirect profile: `SkyLightProbe` plus a low-cost hemisphere sky/ground fill and a small ambient floor. This preserves directional sun/shadow contrast while keeping shadow-side GLB surfaces readable.
- Direct celestial lighting stays separate from the indirect bridge: Takram `SunDirectionalLight` owns sun key light, and the VRodos moon directional light owns night shape when visible. Dynamic day-night underside readability is tuned only through indirect diffuse lighting: `SkyLightProbe`, `HemisphereLight`, tiny `AmbientLight`, and ground bounce color follow a continuous sun-elevation curve with slower smoothing than direct celestial lights so the fill does not step during the cycle.
- The old helper-light debug mode is not exposed as a runtime option. If Takram light-source classes are unavailable, the runtime can use an internal safety fallback only to avoid a black scene.
- Horizon `AerialPerspectiveEffect` is constrained to haze/transmittance in the current PBR path so it does not re-light the scene as albedo.
- The future Takram-vanilla target is an explicit `post-process-albedo` lighting mode, documented in `TAKRAM_REALISTIC_LIGHTING_PLAN.md`.

This phase does not add stars, author-facing geospatial latitude/longitude UI, `LightingMaskPass`, or volumetric clouds.

## 9. Shadow-Aware Lighting And Reflections

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
- Image assets, video display planes, POI link objects, POI image/text trigger objects, and visible POI image/text panel surfaces participate like decoration meshes for shadow casting. Only actual flat image/video display surfaces get the media readability material treatment; POI trigger GLBs stay on normal scene lighting.
- Hidden navmesh helper materials, camera-attached UI, skies, avatars, helper lights, and debug objects are excluded.
- Walkable/navmesh world surfaces receive shadows but do not cast by default, preventing large shallow terrain self-shadow banding. Visible architecture, media, POIs, and props still cast by default.
- Directional Takram/helper sun lights receive an adaptive orthographic shadow-camera fit around nearby world bounds and the current camera region.

Research TODO: `steep-face shadow proxy`. The current runtime can stabilize authored terrain that is allowed to self-cast, but compiler-generated terrain splitting may still be useful later. The likely approach is to generate a shadow-only proxy from steep navmesh faces while keeping shallow walkable ground receiver-only. This should be profiled separately before becoming default behavior.

Reflection/glint handling:

- Standard, Physical, and Phong materials get a runtime shader hook when shadow-aware reflections or global reflection suppression is active.
- Direct specular, indirect specular, clearcoat, sheen, and bright glint output are multiplied by a shadow-aware specular factor.
- This is separate from SSR. In PMNDRS scenes, a bright road glint with `reflection=none` is direct sun/specular energy, so the shader hook is what suppresses it under a blocker.
- `terrain-matte` skips the reflection-shadow shader patch because its own matte material caps and terrain soft-shadow patch are the safer stabilization path for large ground meshes.
- In immersive XR the custom shadow-aware reflection attenuation is disabled and the runtime keeps the safer scene-owned fallback behavior.

Emissive/readability handling:

- Authored `material.emissive` and `material.emissiveIntensity` values are serialized by the compiler and reapplied by runtime material enhancement.
- Emissive maps are texture-quality managed like base color maps.
- High-quality PBR materials with an emissive map get a small readability floor of `emissiveIntensity >= 1.05` unless an authored override is present.
- Flat readable media surfaces map the visible texture into `emissiveMap`, set white emissive color, and keep `emissiveIntensity >= 0.8` so image/video content remains legible under changing day/night light.
- Shadow-receiver terrain/material overrides cap emissive intensity to `0.08` so terrain does not glow and fake away real shadow contrast.
- Emissive material output is not a scene light. It does not illuminate neighboring GLBs, does not cast shadows, and should not be used as a substitute for the Takram sun/moon/direct/indirect lighting pipeline.

Diagnostics:

- Compiled PMNDRS Horizon scenes emit one default startup state line with the active engine, owner, reflection source, reflection occlusion mode, shadow quality, celestial preset, sun direction, exposure, tone mapping, lens flare, and light source.
- Use `?vrodos_debug_pmndrs_horizon=1` for repeated debug-level diagnostic lines when the diagnostic signature changes.
- Use `?vrodos_debug_pmndrs_horizon_verbose=1` for info-level diagnostic lines.
- Expanded diagnostic fields include `shadowCasters`, `shadowReceivers`, `shadowReceiverOnly`, `dirShadowLights`, `fittedDirLights`, and `shadowFit`.

Debug query flags:

- `vrodos_debug_disable_fps_meter=1`: prevents StatsGL/FPS meter initialization before it can wrap `renderer.render`; use for timing captures.
- `vrodos_debug_shadow_perf=1`: shows static-shadow mode, `autoUpdate`, dirty reason, shadow update count, caster/receiver counts, and shadow-light counts.
- `vrodos_debug_dynamic_shadows=1`: forces dynamic shadow-map updates for comparison against cached static shadows.
- `vrodos_debug_disable_shadows=1`: disables shadows to isolate total shadow cost.
- `vrodos_debug_day_night_shadow_radius=VALUE`: overrides directional day/night PCF shadow softness for sun/helper lights.
- `vrodos_debug_disable_terrain_shadow_depth_offset=1`: disables terrain custom depth-material polygon offset.
- `vrodos_debug_terrain_shadow_depth_offset_factor=VALUE`: overrides terrain depth polygon offset factor.
- `vrodos_debug_terrain_shadow_depth_offset_units=VALUE`: overrides terrain depth polygon offset units.
- `vrodos_debug_disable_terrain_soft_shadow_lift=1`: disables the terrain shader lift that suppresses shallow self-shadow bands.
- `vrodos_debug_terrain_soft_shadow_lift_strength=VALUE`: scales terrain soft-shadow lift strength.
- `vrodos_debug_terrain_soft_shadow_target=VALUE`: adjusts the target visibility for lifted terrain self-shadow samples.
- `vrodos_debug_terrain_soft_shadow_gap_start=VALUE`: adjusts the near-depth terrain self-shadow mask start.
- `vrodos_debug_terrain_soft_shadow_gap_end=VALUE`: adjusts the near-depth terrain self-shadow mask end.
- `vrodos_debug_nav_perf=1`: shows navigation/collision target counts and tick timing.
- `vrodos_debug_pmndrs_horizon=1`: logs PMNDRS/Takram horizon diagnostics when the diagnostic signature changes.
- `vrodos_debug_pmndrs_horizon_verbose=1`: logs verbose PMNDRS/Takram horizon diagnostics.
- `vrodos_debug_enable_pmndrs_horizon_aerial=1`: enables the experimental Horizon aerial perspective path for visual checks.
- `vrodos_debug_disable_pmndrs_sun=1`: hides the Takram sky sun disk for sun/flare isolation.
- `vrodos_debug_disable_pmndrs_composer=1`: bypasses the PMNDRS composer.
- `vrodos_debug_disable_pmndrs_ao=1`: disables PMNDRS AO.
- `vrodos_debug_disable_pmndrs_aa=1`: disables PMNDRS AA selection.
- `vrodos_debug_disable_pmndrs_smaa=1`: disables SMAA specifically.
- `vrodos_debug_disable_pmndrs_msaa=1`: disables MSAA specifically.
- `vrodos_debug_pmndrs_aa=1`: shows the PMNDRS AA debug overlay.
- `vrodos_debug_disable_pmndrs_lens_flare=1`: disables Takram/PMNDRS lens flare.
- `vrodos_debug_cast_flat_media_shadows=1`: forces flat media shadow casting for older scenes or scene settings where it was disabled. New compiled scenes cast flat media shadows by default.
- `vrodos_spector=1`: enables the runtime Spector capture hook when the Spector debug helper is present. Prefer `scripts/profile-master-client.mjs --spector` for repeatable captures.

## 10. Legacy Effect Notes

### TAA

Legacy TAA uses a 16-sample Halton jitter sequence, same-UV history sampling, Catmull-Rom history reconstruction, and neighborhood clipping. FXAA is skipped when TAA is active.

### SSR

Legacy SSR is half-resolution screen-space ray marching using the shared depth texture from the main render target. PMNDRS does not currently support SSR; scenes that require SSR should stay on `legacy`.

### SAO

Legacy SAO is half-resolution, depth-only ambient occlusion with bilateral blur and optional adaptive half-rate updates under low FPS.

## 11. HDR Environment Maps and Scene Probe

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

## 12. Version Source of Truth

- Root `package.json` and `package-lock.json` define runtime package intent.
- `npm run build:three` generates `assets/runtime-version-manifest.json`.
- `npm run build:runtime` generates the compiled-scene runtime bundles, the browser settings-contract script from `assets/runtime-settings-contract.json`, and validates/writes `assets/runtime-build-manifest.json`.
- `assets/runtime-build-manifest.json` defines compiled runtime chunks, dependency order, lazy feature coverage, and generated script URLs consumed by `VRodos_Compiler_Runtime_Script_Planner`.
- `VRodos_Render_Runtime_Manager` reads the generated manifest for A-Frame, Three, PMNDRS, Takram, and collision BVH metadata.
- The current live vendor bundle is Three.js r181.
- The classic compiled A-Frame runtime must not load a second Three instance. The preferred near-term upgrade path is A-Frame's planned Three r184 runtime work (`aframevr/aframe#5818`) rather than a VRodos-only Three fork.
- WebGPU remains an experimental renderer mode after r184, with separate validation for PMNDRS post-processing, GLSL/onBeforeCompile material hooks, Takram integration, and XR behavior.

## 13. Future Ideas

These are backlog items, not current implementation requirements:

- Desktop-only Takram-vanilla `post-process-albedo` mode.
- Continue validating native `POSTPROCESSING.SSAOEffect` across broader Horizon and non-Horizon scenes.
- Track A-Frame r184 and run a WebGPU compatibility spike after the shared runtime upgrade is available.
- Takram stars, geospatial date/time solar simulation, `LightingMaskPass`, and geospatial helpers.
- Volumetric clouds after the PMNDRS/Takram lighting baseline remains stable.

## References

- `TAKRAM_REALISTIC_LIGHTING_PLAN.md` - phased Takram realism and Three-version roadmap.
- `RENDERING_MIGRATION_IMPLEMENTATION_LOG.md` - staged migration history.
- `POSTFX_DEBUG_NOTES.md` - color-encoding and WebGLRenderer debugging history.
