# VRodos: WordPress 3D Authoring with Compiled A-Frame Scenes

VRodos turns WordPress into a browser-based 3D scene authoring system with a compiled A-Frame runtime for interactive desktop, VR, and immersive web experiences.

It combines:

- a Three.js-based editor and asset workflow inside WordPress
- a compiled A-Frame runtime for published scenes
- dual compiled-scene rendering paths for different visual goals
- built-in controls for environment, reflections, movement, and post-processing

## Documentation Map

Keep current behavior in one place where possible:

- [`documentation/vrodos-compiled-scene-framework-integration.md`](documentation/vrodos-compiled-scene-framework-integration.md): compiled-scene framework boundaries, shared Three.js ownership, lazy runtime chunks, and immersive PMNDRS UIKit Horizon dialog ownership.
- [`RENDERING_PIPELINE.md`](RENDERING_PIPELINE.md): canonical compiled runtime rendering, PMNDRS/Takram, day-night lighting, shadows, emissive/readability handling, diagnostics, and future render-track notes.
- [`VR_HEADSET_RUNTIME_HANDOFF.md`](VR_HEADSET_RUNTIME_HANDOFF.md): current standalone headset runtime policy and validation checklist.
- [`PC_RENDERED_VR_PLAN.md`](PC_RENDERED_VR_PLAN.md): future PC-rendered VR parent profile plan, parked until hardware/runtime validation.
- [`VR_IMMERSIVE_PERFORMANCE_CLEANUP_PLAN.md`](VR_IMMERSIVE_PERFORMANCE_CLEANUP_PLAN.md): active cleanup checklist for headset runtime performance work.
- Historical rendering/performance notes live under [`documentation/archive/rendering-history/`](documentation/archive/rendering-history/).

## What VRodos Supports Today

### Scene authoring

- In-browser 3D scene editor built on the VRodos Three.js vendor stack
- Scene save/load through JSON-based persistence
- Client-side Undo/Redo engine (50-action history) for transformations, additions, deletions, and light properties
- Transform editing, hierarchy management, lighting placement, and scene-level options
- Background authoring for Horizon, solid color, preset environments, and image skies
- Fog and environment settings authored in the editor and carried into compiled output

### Asset workflows

- On-the-fly 3D asset conversion: Built-in server-side Blender CLI pipeline that automatically converts uploaded 3D files of various formats (such as OBJ, FBX, etc.) into highly optimized Web-ready `.glb` format during upload
- 3D asset workflows for GLB content
- Image, video, audio, light, and helper asset usage inside scenes
- Taxonomy-driven asset organization inside WordPress
- Dedicated `Walkable Surfaces` helper category for compiled navigation meshes
- Optional `Collision Proxy` helper category for hidden/inexpensive compiled-scene blockers
- Drag/drop placement from the scene-side asset browser

## Scene Editor Architecture

The scene editor is implemented as classic WordPress-enqueued scripts under [`assets/js/editor/`](assets/js/editor/). It is intentionally modular internally while preserving legacy script handles and globals used by templates, AJAX localization, and older inline integrations.

Current editor subsystems:

- `core/`: namespace bootstrap, shared helpers, diagnostics, and startup coordination
- `scene/`: registry, selection, transforms, undo, bounds, disposal, and scene persistence
- `render/`: Three.js scene/camera/renderer lifecycle, direct render loop, performance profile, and editor helpers
- `loaders/`: scene-load lifecycle plus GLB, generated asset, light, pawn, and director camera loading
- `ui/`: toolbar, panels, hierarchy, asset browser, scene list, screenshot, compile dialog, keyboard, and pointer-lock controls
- `ajax/`: editor persistence, compile, upload, delete, and project/asset AJAX entry points

Compatibility surfaces remain part of the contract during this staged architecture: `window.VRODOS`, `VRODOS.editor.envir`, editor registry/factory/selection/transform facades, `VRODOS.api.saveChanges`, scene loading/autosave APIs, `VRODOS.ui.*` template hooks, `vrodos_data.*`, and the current Three vendor globals.

Important ownership rules:

- `ajax/vrodos_save_scene_ajax.js` owns save queueing, save button state, export-before-save, and follow-up saves.
- `scene/vrodos_scene_persistence.js` owns scene import/export helpers and scene-data object records.
- `scene/vrodos_scene_registry.js` is the default source for selectable/editor roots; hot paths should avoid routine full-scene traversals.
- The editor render path is direct WebGL plus cel-outline selection helpers; the old editor `EffectComposer`, `RenderPass`, `FXAA`, and disabled `OutlinePass` paths have been removed.
- The render loop is request-driven and diagnostics expose RAF/timer state, renderer memory, object counts, and related profiling signals.
- UI modules own event binding with idempotent guards; new template inline handlers should be avoided.

### Compiled A-Frame output

- One-click scene compilation to A-Frame HTML output
- Scene startup loader to reduce visible object pop-in
- Desktop-oriented high-quality rendering path for compiled scenes
- Runtime support for interactive desktop, VR, and immersive-web experiences
- Local/networked collaboration support through the bundled VRodos network runtime server

## Current Compiled Runtime

VRodos currently targets one active compiled-scene runtime pair:

- A-Frame master dist commit `adf8f4e02b0499223b2c4fa93165e49b50384564`, declared in root `package.json`
- Three.js vendor stack `r184`, derived from the locked root `three` package alias `npm:super-three@0.184.0`

That runtime powers:

- PBR materials and modern Three.js lighting behavior
- shadow quality presets
- fog and horizon/sky presentation
- desktop fullscreen and immersive XR visual parity for scene-owned horizon, atmosphere, lighting, fog, exposure, and material state
- HDR environment-map reflections
- scene-probe reflections for authored environments
- a global reflections switch for compiled scenes
- shadow-aware direct-sun glint suppression for compiled-scene PBR materials
- PMNDRS/Takram tone mapping, sun lens flare, and atmosphere controls for desktop compiled scenes
- PMNDRS/Takram day-night lighting with horizon-gated direct sun/moon lights and separate indirect sky/fill support
- opt-in Takram volumetric clouds for desktop inline/fullscreen PMNDRS + Takram atmosphere scenes
- compiled walkable-surface and static player/world collision workflows
- static cached desktop shadows where visible compiled geometry casts and receives by default
- PMNDRS UIKit Horizon immersive VR dialogs for CEFR prompts, assessment panels, and image/text POI panels while A-Frame remains the scene/XR host
- direct immersive VR video trigger controls that toggle authored video playback without opening a play/pause dialog
- immersive VR ray endpoint feedback for normal `.raycastable` scene targets, plus modal dialog ray-stop/hit-dot feedback for spatial panels
- Greek-capable spatial UI text rendering through vendored Noto Sans and same-origin MSDF worker assets

The runtime version source of truth is root [`package.json`](package.json) plus [`package-lock.json`](package-lock.json). `npm run build:three` generates [`assets/runtime-version-manifest.json`](assets/runtime-version-manifest.json), and [`includes/class-vrodos-render-runtime-manager.php`](includes/class-vrodos-render-runtime-manager.php) reads that manifest at runtime with conservative fallbacks.

## Compiled Scene Visual Features

Compiled scenes can currently offer:

- PBR materials with HDR reflections and tuned environment intensity
- fog, horizon, solid-color, image-sky, and preset background modes
- desktop high-quality rendering mode
- fullscreen and immersive XR preservation of the authored desktop visual baseline, with targeted fallbacks for XR-unsafe screen-space effects
- shadow presets for performance vs visual quality
- semantic shadow participation: visible world GLBs, media planes, and POI panels cast/receive by default; walkable/navmesh ground receives shadows without self-casting; hidden collision proxies do not render into shadow maps
- large-terrain shadow stabilization through camera-focused directional shadow fitting, terrain depth offset, and terrain soft self-shadow suppression
- reflection source selection between HDR presets and scene probes
- global reflection enable/disable control plus shadow-aware direct-sun reflection occlusion
- PMNDRS selectable tone mapping, exposure, generated LUT looks, Takram correct-altitude, and Takram Horizon lens flare
- opt-in desktop PMNDRS/Takram volumetric clouds with local vendored cloud textures and four Takram quality profiles
- authored emissive materials plus scoped media readability emissive handling; emissive output is not treated as a scene light
- walkable-surface ground collisions plus default static player blocking for compiled scene geometry

## Compiled Scene Navigation And Collisions

Compiled walkable mode uses native VRodos static collisions instead of a full physics engine.

Authoring model:

- Geometry-bearing compiled objects collide with the player by default.
- Each eligible object exposes a `Collides with player` opt-out toggle in the object controls panel.
- Missing collision metadata is treated as disabled during compile; the editor checkbox is the source of truth.
- `Walkable Surfaces` still define valid ground, slope, step, and drop behavior.
- `Collision Proxy` assets are optional hidden blockers for invisible walls, simplified collider geometry, and high-poly scenes where visible art would be too expensive or too detailed as an exact collider.

Compiled runtime model:

- The compiler emits `.vrodos-collider` metadata for enabled player blockers.
- Walkable surfaces are also collider sources, so steep/vertical navmesh faces block horizontal movement.
- Hidden collision proxies remain in the scene graph through `vrodos-collider-helper` but receive hidden materials.
- `custom-movement` owns player motion, ground sampling, blocker tests, and wall-slide fallback.
- The runtime bundles `three-mesh-bvh` as `assets/js/runtime/master/lib/vrodos-collision-bvh.bundle.js` and exposes `window.VRODOS_COLLISION_BVH`.
- Collision uses A-Frame's existing `window.THREE` and does not load a second Three.js copy.

Rapier is intentionally not part of v1 static locomotion. It remains a future option for dynamic physics such as pushable props, thrown objects, joints, or gameplay collision events. Historical collision roadmap notes live in [`documentation/archive/rendering-history/AFRAME_COLLISION_ROADMAP.md`](documentation/archive/rendering-history/AFRAME_COLLISION_ROADMAP.md).

## Compiled Scene Performance Model

High-quality compiled desktop scenes keep the PMNDRS/Takram look while avoiding avoidable per-frame render work:

- `shadowUpdateMode` defaults to `static`, which updates shadow maps on load, delayed reveal, and explicit dirty events instead of every frame.
- `dynamic` shadow updates remain available for authored scenes with moving shadow casters.
- Visible compiled geometry casts and receives shadows by default for realism. Walkable/navmesh ground is receiver-only to avoid large-terrain self-shadow banding; the performance guardrail is cached/static shadow-map updates, not making authored objects shadowless.
- PMNDRS/Takram Horizon scenes use Takram physical `SunDirectionalLight` / `SkyLightProbe` when available, with a separate PBR indirect-light profile and low-cost hemisphere ground/sky fill for A-Frame assets. Direct sun/moon scene lights are disabled below the local horizon threshold. Flat media surfaces get a narrowly scoped readability material treatment.
- Terrain-heavy scenes use a camera-focused directional shadow fit, terrain custom depth offset, and terrain soft self-shadow suppression so mountain-cast shadows remain while shallow slope banding is reduced.
- The PMNDRS AO budget keeps the final color buffer full-resolution while scaling the NormalPass/SSAO workload per AO preset.
- Takram clouds are desktop/inline only in v1. They require PMNDRS post-FX, high render quality, Takram atmosphere, WebGL2/Data3DTexture support, and local cloud assets. The four cloud profiles map to Takram `low`, `medium`, `high`, and `ultra`; temporal upscaling stays enabled, light shafts remain off, and immersive WebXR skips clouds while keeping the rest of the scene visible.
- `?vrodos_debug_shadow_perf=1` shows live shadow cache diagnostics.
- `scripts/profile-master-client.mjs --disable-fps-meter` appends `vrodos_debug_disable_fps_meter=1` so StatsGL does not initialize before profiling.

Draco compression helps transfer size and startup bandwidth. Runtime FPS only improves when the derivative is also simplified or has fewer draw-cost inputs, because decoded Draco geometry still renders as normal triangles. VRodos therefore keeps optimized GLB substitution explicit and per-asset opt-in; future LOD families should be measured with profiler/Spector before becoming default compile behavior.

## Compiled Scene Diagnostics

Append query parameters to a compiled client URL when profiling or comparing rendering paths. Combine flags with `&`, for example:

`Master_Client_8980.html?vrodos_debug_disable_fps_meter=1&vrodos_debug_shadow_perf=1`

Most-used flags:

- `vrodos_debug_disable_fps_meter=1`: prevents StatsGL/FPS meter initialization before it can wrap `renderer.render`; use for timing captures.
- `vrodos_debug_shadow_perf=1`: shows shadow mode, `autoUpdate`, dirty reason, shadow update count, caster/receiver counts, and shadow-light counts.
- `vrodos_debug_day_night_shadow_radius=VALUE`: adjusts PMNDRS/Takram directional day-night shadow softness.
- `vrodos_debug_disable_terrain_soft_shadow_lift=1`: isolates terrain soft-shadow lift from the rest of the shadow pipeline.
- `vrodos_debug_pmndrs_horizon_verbose=1`: logs verbose PMNDRS/Takram horizon diagnostics.
- `vrodos_spector=1`: enables the runtime Spector capture hook when the Spector debug helper is present. Prefer `scripts/profile-master-client.mjs --spector` for repeatable captures.

The complete current flag list lives in [`RENDERING_PIPELINE.md`](RENDERING_PIPELINE.md). Historical performance capture workflow notes live in [`documentation/archive/rendering-history/PERFORMANCE_OPTIMIZATION_PLAN.md`](documentation/archive/rendering-history/PERFORMANCE_OPTIMIZATION_PLAN.md).

## Rendering Paths for Compiled Scenes

VRodos now ships two compiled-scene post-processing engines. The engine is selected per scene through the compile dialog.

Desktop inline mode and desktop fullscreen use the same post-processing pipeline, so entering fullscreen should not change the authored look. Real immersive WebXR sessions keep the scene-owned visual baseline active and use targeted fallbacks for screen-space composer passes that are not XR-safe. In practice, Horizon/Takram sky, scene-owned lights, fog, renderer tone mapping/exposure, env-map state, and material profiles are re-synced on fullscreen, `enter-vr`, `exit-vr`, and resize transitions.

### Legacy engine

The `Legacy` engine is the original custom VRodos post-FX path and still covers the broadest effect set.

It currently supports:

- custom SAO
- custom SSR
- bloom
- color grading
- vignette
- FXAA
- optional TAA

Choose the legacy engine when a scene depends on:

- SSR
- TAA
- the existing custom AO/reflection look

For the deep technical breakdown of the compiled rendering stack, including the legacy custom renderer and PMNDRS/Takram path, see [`RENDERING_PIPELINE.md`](RENDERING_PIPELINE.md).

### PMNDRS engine

The `Pmndrs` engine is the newer composer-based path for compiled desktop scenes.

It currently supports:

- `EffectComposer` / `EffectPass`-based rendering
- anti-aliasing modes: `none`, `smaa`, `msaa`
- ambient occlusion through the shared AO presets
- bloom controls
- selectable tone mapping: AgX, Reinhard, Cineon, ACES Filmic, Linear
- tone-map exposure range `0.1..5.0` in `0.1` increments
- generated built-in LUT looks
- vignette controls
- PMNDRS noise and chromatic aberration controls
- Takram atmosphere/celestial presets and advanced controls
- Takram correct-altitude control
- Takram Horizon sky, sun disk, and sun lens flare ownership
- Takram volumetric clouds for desktop inline/fullscreen PMNDRS scenes

Important current limitations:

- SSR is not available on the PMNDRS path
- TAA is not available on the PMNDRS path
- composer MSAA is disabled when PMNDRS ambient occlusion is active; use SMAA for AO scenes
- immersive WebXR skips PMNDRS/Takram clouds in v1 because the PMNDRS composer is bypassed while `renderer.xr.isPresenting`
- the current Horizon PMNDRS path uses Takram light-source lighting for A-Frame/PBR content; it is not yet the Takram vanilla `post-process-albedo` lighting model

For current-state PMNDRS/Takram decisions, see [`RENDERING_PIPELINE.md`](RENDERING_PIPELINE.md). Historical phased Takram notes live in [`documentation/archive/rendering-history/TAKRAM_REALISTIC_LIGHTING_PLAN.md`](documentation/archive/rendering-history/TAKRAM_REALISTIC_LIGHTING_PLAN.md).

## Takram Support

Takram support in VRodos currently means desktop PMNDRS atmosphere, sky, lighting, lens flare, stars, and opt-in volumetric clouds. Immersive XR keeps the scene-owned Takram sky/lighting baseline but skips PMNDRS cloud composition in v1.

### Shipped now

- Takram atmosphere resources bundled with the runtime
- PMNDRS compile-dialog controls for visual atmosphere looks, celestial presets, Takram resource quality, preset intensity, and advanced tuning
- Takram-driven sky and real sun-disk ownership on the PMNDRS Horizon path
- Takram Horizon sun LensFlareEffect
- Takram correct-altitude toggle
- Takram stars from local `assets/vendor/takram-atmosphere/stars.bin`
- Takram volumetric clouds from local `assets/vendor/takram-clouds/` assets
- four cloud performance profiles: `low`, `medium`, `high`, and `ultra`
- atmospheric tuning for sun position, scattering, ground, and aerial-strength behavior
- Takram physical light ownership for PMNDRS/Takram Horizon scenes, with an internal safety fallback only if Takram light-source classes are unavailable
- local Horizon keeps Takram procedural ground disabled so authored walkable-surface/navmesh geometry remains the actual scene ground

### Not shipped yet

- desktop Takram-vanilla `post-process-albedo` lighting mode
- immersive XR/headset Takram clouds
- author-facing cloud light-shafts controls

## Compile Dialog Controls

The compile dialog exposes both shared controls and engine-specific controls.

### Shared controls

- render quality
- shadow quality
- global reflections toggle
- reflection profile and reflection source
- post-FX master toggle
- ambient occlusion preset authoring surface
- bloom toggle / preset
- color grading toggle with exposure and contrast presets
- vignette toggle
- fog and background configuration authored from the scene
- FPS meter toggle

### Legacy-only controls

- SSR strength
- TAA toggle
- legacy edge smoothing / FXAA tuning
- the currently active AO implementation behind the shared AO presets

### PMNDRS-only controls

- AA mode: `none`, `smaa`, `msaa`
- AA preset: `low`, `medium`, `high`, `ultra`
- bloom multiplier
- bloom threshold
- tone mapping mode
- tone-map exposure
- lens flare toggle
- vignette darkness
- Takram atmosphere toggle
- atmosphere look: `sunrise`, `midday`, `sunset`, `night`, `custom`
- celestial mode: `manual` or `preset-time`
- celestial time preset: `sunrise`, `midday`, `golden-hour`, `sunset`, `night`
- Takram quality: `performance`, `balanced`, `quality`, `cinematic`
- Takram clouds toggle
- cloud quality: `low`, `medium`, `high`, `ultra`
- cloud coverage: `0..1`
- correct-altitude toggle
- preset intensity
- advanced atmosphere controls for:
  - sun elevation and azimuth
  - sun radius and distance
  - aerial strength and albedo scale
  - transmittance, inscatter, and ground toggles
  - Rayleigh, Mie, absorption, and moon settings

## Core WordPress Model

VRodos uses custom post types and taxonomies for its content model:

- `vrodos_game`: projects
- `vrodos_scene`: scenes
- `vrodos_asset3d`: assets

The plugin follows a manager-class architecture, with dedicated managers for assets, scenes, AJAX, uploads, compilation, defaults, roles, menus, settings, and pages.

## Typical Workflow

1. Create a project.
2. Create one or more scenes.
3. Upload or edit assets.
4. Add assets to the scene editor and configure transforms, lights, background, and movement helpers.
5. Add helper meshes to the `Walkable Surfaces` category if the compiled scene needs guided ground traversal.
6. Leave default object collision enabled, or turn off `Collides with player` for pass-through visuals.
7. Add `Collision Proxy` assets when a scene needs hidden walls or cheaper blockers than the visible art.
8. Open the compile dialog and choose the rendering engine and quality settings.
9. Build the project to generate compiled A-Frame output.

## Technology Stack

- WordPress 6.x
- PHP 8.3+
- Vanilla JavaScript
- Three.js vendor stack from root `three`
- Pinned A-Frame runtime metadata from root `package.json`
- `pmndrs/postprocessing` bundled into the compiled-scene postprocessing runtime bundle
- Takram atmosphere runtime bundle built from root `@takram/*` package versions
- Takram clouds runtime bundle and local cloud assets for opt-in desktop PMNDRS scenes
- `three-mesh-bvh` bundled into the compiled-scene static collision runtime
- `@pmndrs/uikit`, `@pmndrs/uikit-horizon`, and `@pmndrs/pointer-events` bundled into the compiled-scene spatial UI runtime for CEFR, assessment, and image/text POI immersive panels
- Noto Sans plus Zappar MSDF worker/WASM assets vendored for Greek spatial UI glyph coverage
- Node.js server for networked and collaborative features

## Local Development

### WordPress

- Install WordPress locally.
- Place the plugin in `wp-content/plugins/VRodos/`.
- Activate the plugin from the WordPress admin.
- Use a non-plain permalink structure.

### Collaborative/runtime server

The bundled server lives in:

`services/vrodos-network-runtime/`

Install and run it with:

```bash
cd wp-content/plugins/VRodos/services/vrodos-network-runtime/
npm install
npm start
```

The local runtime server is commonly used on port `5832`.

### Updating Runtime Packages

Runtime package versions are intentionally synchronized through the root npm manifest and lockfile.

1. Update root `package.json`:
   - `devDependencies.three`
   - `devDependencies.postprocessing`
   - `dependencies.@takram/three-atmosphere`
   - `dependencies.@takram/three-clouds`
   - `dependencies.@takram/three-geospatial-effects`
   - `vrodos.runtime.aframe.commit` for A-Frame master builds, or `vrodos.runtime.aframe.version` when using a release build
2. Run:

```bash
npm install
npm run build
```

3. Commit the updated lockfile and generated runtime outputs:
   - `package-lock.json`
   - `assets/runtime-version-manifest.json`
   - `assets/vendor/<three-dir>/<three-bundle>`
   - `assets/js/runtime/master/lib/vrodos-postprocessing.bundle.js`
   - `assets/js/runtime/master/lib/vrodos-takram-atmosphere.bundle.js`
   - `assets/js/runtime/master/lib/vrodos-takram-clouds.bundle.js`
   - `assets/vendor/takram-clouds/`
   - `assets/js/runtime/master/lib/vrodos-collision-bvh.bundle.js`
   - `assets/css/vrodos_modern_compiled.css` when the full build changes CSS

Do not manually copy `postprocessing.min.js` into the runtime. PMNDRS globals are exported by `assets/js/runtime/master/lib/vrodos-postprocessing.bundle.js` as `window.POSTPROCESSING`, using A-Frame's existing `window.THREE`.

Do not load a newer Three.js beside the current classic A-Frame runtime. Future Three upgrades should be tested through a separate A-Frame module/import-map runtime track so A-Frame, VRodos, PMNDRS, Takram, loaders, and addons all share one Three instance.

## Upload Limits

Large GLB uploads depend on both PHP limits and web server limits.

If large assets fail to upload, check:

- PHP `upload_max_filesize`
- PHP `post_max_size`
- Apache or Local WP request/body size limits
- WordPress/media-related server limits

## Troubleshooting

### Scene editor does not load correctly

- Verify plugin scripts are enqueued.
- Check the browser console for JavaScript errors.
- Confirm the Three.js/editor assets are present in the plugin directory.

### Compiled scene looks flat or low quality

- Rebuild after changing compile-dialog quality settings.
- Use `High` render quality for desktop-oriented scenes.
- Choose the engine that matches the scene's needs:
  - `Legacy` for SSR/TAA/custom AO needs
  - `Pmndrs` for composer-based AA and Takram atmosphere controls
- Review authored materials, textures, lighting, and reflection settings.
- For Takram realism work, follow [`RENDERING_PIPELINE.md`](RENDERING_PIPELINE.md); historical phased notes live in [`documentation/archive/rendering-history/TAKRAM_REALISTIC_LIGHTING_PLAN.md`](documentation/archive/rendering-history/TAKRAM_REALISTIC_LIGHTING_PLAN.md).

### Walkable surfaces do not behave as expected

- Ensure the helper asset belongs to the `Walkable Surfaces` category.
- Rebuild the scene after changing walkable geometry.
- Prefer simpler helper meshes when the visible GLB is noisy or irregular.

### Player walks through objects or walls

- Rebuild the compiled scene after changing object collision settings.
- Verify the object has `Collides with player` enabled in the scene editor.
- Use `Collision Proxy` assets for invisible walls, thin blockers, or cheaper colliders around complex visible art.
- If a navmesh includes wall geometry, confirm the wall faces are steep enough to be treated as blockers instead of walkable ground.
- Use `node scripts/profile-master-client.mjs URL --nav-profile` to inspect navmesh and blocker target counts while simulating movement.

### Large uploads fail

- Check both PHP and Apache or Local WP limits.
- Review server logs when a request fails before WordPress finishes handling the upload.

## Credits

- Anastasios Papazoglou Chalikias
- Elias Kouslis
- Dimitrios Ververidis

Website: [https://vrodos.iti.gr](https://vrodos.iti.gr)

## License

See `LICENSE`.
