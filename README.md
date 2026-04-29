# VRodos: WordPress 3D Authoring with Compiled A-Frame Scenes

VRodos turns WordPress into a browser-based 3D scene authoring system with a compiled A-Frame runtime for interactive desktop, VR, and immersive web experiences.

It combines:

- a Three.js-based editor and asset workflow inside WordPress
- a compiled A-Frame runtime for published scenes
- dual compiled-scene rendering paths for different visual goals
- built-in controls for environment, reflections, movement, and post-processing

## What VRodos Supports Today

### Scene authoring

- In-browser 3D scene editor built on the VRodos Three.js vendor stack
- Scene save/load through JSON-based persistence
- Client-side Undo/Redo engine (50-action history) for transformations, additions, deletions, and light properties
- Transform editing, hierarchy management, lighting placement, and scene-level options
- Background authoring for Horizon, solid color, preset environments, and image skies
- Fog and environment settings authored in the editor and carried into compiled output

### Asset workflows

- 3D asset workflows for GLB content
- Image, video, audio, light, and helper asset usage inside scenes
- Taxonomy-driven asset organization inside WordPress
- Dedicated `Walkable Surfaces` helper category for compiled navigation meshes
- Drag/drop placement from the scene-side asset browser

### Compiled A-Frame output

- One-click scene compilation to A-Frame HTML output
- Scene startup loader to reduce visible object pop-in
- Desktop-oriented high-quality rendering path for compiled scenes
- Runtime support for interactive desktop, VR, and immersive-web experiences
- Local/networked collaboration support through the bundled `networked-aframe` server

## Current Compiled Runtime

VRodos currently targets one active compiled-scene runtime pair:

- A-Frame master commit `63600d331e8eca9bec786bf030bc66040625750b`, declared in root `package.json`
- Three.js vendor stack `r181`, derived from the locked root `three` package

That runtime powers:

- PBR materials and modern Three.js lighting behavior
- shadow quality presets
- fog and horizon/sky presentation
- desktop fullscreen and immersive XR visual parity for scene-owned horizon, atmosphere, lighting, fog, exposure, and material state
- HDR environment-map reflections
- scene-probe reflections for authored environments
- compiled walkable-surface collision workflows

The runtime version source of truth is root [`package.json`](package.json) plus [`package-lock.json`](package-lock.json). `npm run build:three` generates [`assets/runtime-version-manifest.json`](assets/runtime-version-manifest.json), and [`includes/class-vrodos-render-runtime-manager.php`](includes/class-vrodos-render-runtime-manager.php) reads that manifest at runtime with conservative fallbacks.

## Compiled Scene Visual Features

Compiled scenes can currently offer:

- PBR materials with HDR reflections and tuned environment intensity
- fog, horizon, solid-color, image-sky, and preset background modes
- desktop high-quality rendering mode
- fullscreen and immersive XR preservation of the authored desktop visual baseline, with targeted fallbacks for XR-unsafe screen-space effects
- shadow presets for performance vs visual quality
- reflection source selection between HDR presets and scene probes
- walkable-surface collisions using helper meshes authored in the editor

## Rendering Paths for Compiled Scenes

VRodos now ships two compiled-scene post-processing engines. The engine is selected per scene through the compile dialog.

Desktop inline mode and desktop fullscreen use the same post-processing pipeline, so entering fullscreen should not change the authored look. Real immersive WebXR sessions keep the scene-owned visual baseline active and use targeted fallbacks for screen-space composer passes that are not XR-safe. In practice, Horizon/Takram sky, helper lights, fog, renderer tone mapping/exposure, env-map state, and material profiles are re-synced on fullscreen, `enter-vr`, `exit-vr`, and resize transitions.

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

For the deep technical breakdown of the legacy custom renderer, see [`RENDERING_PIPELINE.md`](RENDERING_PIPELINE.md). That document is a legacy-pipeline reference, not a full description of the PMNDRS/Takram path.

### PMNDRS engine

The `Pmndrs` engine is the newer composer-based path for compiled desktop scenes.

It currently supports:

- `EffectComposer` / `EffectPass`-based rendering
- anti-aliasing modes: `none`, `smaa`, `msaa`
- ambient occlusion through the shared AO presets
- bloom controls
- tone-map exposure control
- vignette controls
- PMNDRS noise and chromatic aberration controls
- Takram atmosphere look presets and advanced controls
- Takram sky ownership for the PMNDRS Horizon path

Important current limitations:

- SSR is not available on the PMNDRS path
- TAA is not available on the PMNDRS path
- composer MSAA is disabled when PMNDRS ambient occlusion is active; use SMAA for AO scenes

For current-state PMNDRS/Takram decisions and follow-up work, see [`POSTPROCESSING_MIGRATION_PLAN.md`](POSTPROCESSING_MIGRATION_PLAN.md).

## Takram Support

Takram support in VRodos currently means atmosphere and sky integration, not clouds.

### Shipped now

- Takram atmosphere resources bundled with the runtime
- PMNDRS compile-dialog controls for visual atmosphere looks, Takram resource quality, preset intensity, and advanced tuning
- Takram-driven sky ownership on the PMNDRS Horizon path
- atmospheric tuning for sun position, scattering, ground, and aerial-strength behavior

### Not shipped yet

- Takram volumetric clouds

## Compile Dialog Controls

The compile dialog exposes both shared controls and engine-specific controls.

### Shared controls

- render quality
- shadow quality
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
- tone-map exposure
- vignette darkness
- Takram atmosphere toggle
- atmosphere look: `sunrise`, `midday`, `sunset`, `night`, `custom`
- Takram quality: `performance`, `balanced`, `quality`, `cinematic`
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
5. Add helper meshes to the `Walkable Surfaces` category if the compiled scene needs guided collisions.
6. Open the compile dialog and choose the rendering engine and quality settings.
7. Build the project to generate compiled A-Frame output.

## Technology Stack

- WordPress 6.x
- PHP 8.3+
- Vanilla JavaScript
- Three.js vendor stack from root `three`
- Pinned A-Frame runtime metadata from root `package.json`
- `pmndrs/postprocessing` and `n8ao` bundled into the compiled-scene postprocessing runtime bundle
- Takram atmosphere runtime bundle built from root `@takram/*` package versions
- Node.js server for networked and collaborative features

## Local Development

### WordPress

- Install WordPress locally.
- Place the plugin in `wp-content/plugins/VRodos/`.
- Activate the plugin from the WordPress admin.
- Use a non-plain permalink structure.

### Collaborative/runtime server

The bundled server lives in:

`services/networked-aframe/`

Install and run it with:

```bash
cd wp-content/plugins/VRodos/services/networked-aframe/
npm install
cd server/
node easyrtc-server.js
```

The local runtime server is commonly used on port `5832`.

### Updating Runtime Packages

Runtime package versions are intentionally synchronized through the root npm manifest and lockfile.

1. Update root `package.json`:
   - `devDependencies.three`
   - `devDependencies.postprocessing`
   - `devDependencies.n8ao`
   - `dependencies.@takram/three-atmosphere`
   - `dependencies.@takram/three-clouds`
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
   - `assets/css/vrodos_modern_compiled.css` when the full build changes CSS

Do not manually copy `postprocessing.min.js` into the runtime. PMNDRS globals are exported by `assets/js/runtime/master/lib/vrodos-postprocessing.bundle.js` as `window.POSTPROCESSING` and `window.N8AOPostPass`, using A-Frame's existing `window.THREE`.

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

### Walkable surfaces do not behave as expected

- Ensure the helper asset belongs to the `Walkable Surfaces` category.
- Rebuild the scene after changing walkable geometry.
- Prefer simpler helper meshes when the visible GLB is noisy or irregular.

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
