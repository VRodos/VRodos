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
- [`documentation/compiled-desktop-roadmap.md`](documentation/compiled-desktop-roadmap.md): current compiled desktop/non-VR cleanup goals, active backlog, deferred VR items, and historical-doc index.
- [`documentation/compiled-headset-roadmap.md`](documentation/compiled-headset-roadmap.md): current standalone VR-headset baseline, active headset TODOs, deferred experiments, and validation focus.
- [`RENDERING_PIPELINE.md`](RENDERING_PIPELINE.md): canonical compiled runtime rendering, PMNDRS/Takram, day-night lighting, shadows, emissive/readability handling, diagnostics, and future render-track notes.
- [`VR_HEADSET_RUNTIME_HANDOFF.md`](VR_HEADSET_RUNTIME_HANDOFF.md): current standalone headset runtime policy, completed cleanup decisions, and validation checklist.
- [`PC_RENDERED_VR_PLAN.md`](PC_RENDERED_VR_PLAN.md): future PC-rendered VR parent profile plan, parked until hardware/runtime validation.
- Historical rendering/performance findings are summarized in [`documentation/archive/rendering-history/README.md`](documentation/archive/rendering-history/README.md).

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

## Compiled Runtime Summary

Runtime versions are sourced from root [`package.json`](package.json), [`package-lock.json`](package-lock.json), and generated manifests. `npm run build:three` writes [`assets/runtime-version-manifest.json`](assets/runtime-version-manifest.json), and [`includes/class-vrodos-render-runtime-manager.php`](includes/class-vrodos-render-runtime-manager.php) reads that manifest at runtime.

Current compiled scenes are A-Frame-hosted clients with one shared Three.js substrate. The runtime can load these feature families as scene metadata requires:

- desktop post-FX through either `Legacy` or `Pmndrs`;
- Takram atmosphere, day-night lighting, lens flare, stars, and desktop-only volumetric clouds;
- HDR environment maps, optional scene probes, and reflection controls;
- cached/static shadows with terrain stabilization;
- static walkable/player collision through `three-mesh-bvh`;
- immersive PMNDRS/Horizon spatial UI for CEFR, assessment, and image/text POI panels;
- direct immersive video trigger playback without a play/pause dialog;
- networked/collaborative components when the scene selects the networked runtime.

Detailed rendering, collision, performance, diagnostics, and compile-control behavior lives in [`RENDERING_PIPELINE.md`](RENDERING_PIPELINE.md). Active desktop/non-VR work is tracked in [`documentation/compiled-desktop-roadmap.md`](documentation/compiled-desktop-roadmap.md). Standalone headset work is tracked in [`documentation/compiled-headset-roadmap.md`](documentation/compiled-headset-roadmap.md) and [`VR_HEADSET_RUNTIME_HANDOFF.md`](VR_HEADSET_RUNTIME_HANDOFF.md).

## Compiled Runtime Rules

- Desktop inline and desktop fullscreen share the authored post-FX look.
- Real immersive WebXR keeps scene-owned visuals but bypasses XR-unsafe screen-space composer passes unless a headset-specific experiment proves safe.
- `Legacy` remains the custom SAO/SSR/bloom/color/vignette/FXAA/TAA path.
- `Pmndrs` is the composer path for desktop AA, AO, bloom, tone mapping, LUTs, color, vignette/noise/chromatic controls, and Takram atmospheric composition.
- PMNDRS does not provide SSR or TAA; use the legacy engine when a scene depends on those.
- Takram clouds are desktop/inline only in the current public runtime.
- Compiled walkable mode uses native static collisions, not Rapier. Geometry-bearing compiled objects can collide with the player, `Walkable Surfaces` define ground/traversal, and `Collision Proxy` assets provide hidden blockers.
- Draco/Meshopt/KTX2 derivative substitution must stay explicit and per asset; decoded compressed geometry still renders as normal triangles, so transfer savings are not automatically FPS savings.

## Compiled Diagnostics

Use query flags for profiling and isolation. Common flags:

- `vrodos_debug_disable_fps_meter=1`
- `vrodos_debug_shadow_perf=1`
- `vrodos_debug_day_night_shadow_radius=VALUE`
- `vrodos_debug_disable_terrain_soft_shadow_lift=1`
- `vrodos_debug_pmndrs_horizon_verbose=1`
- `vrodos_spector=1`

The complete current flag list and profiler workflow live in [`RENDERING_PIPELINE.md`](RENDERING_PIPELINE.md).

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
- For Takram realism work, follow [`RENDERING_PIPELINE.md`](RENDERING_PIPELINE.md); historical findings are summarized in [`documentation/archive/rendering-history/README.md`](documentation/archive/rendering-history/README.md).

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
