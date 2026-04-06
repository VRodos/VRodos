# VRodos: 3D Scene Authoring and A-Frame Publishing for WordPress

VRodos turns WordPress into a browser-based 3D scene authoring system with a compiled A-Frame output for interactive desktop, VR, and immersive web experiences.

It combines a Three.js scene editor, custom WordPress content types, asset management, and an A-Frame runtime so creators can build, save, organize, and publish scenes from inside WordPress.

## What VRodos Supports Today

### Scene authoring

- In-browser 3D scene editor built on Three.js
- Per-scene organization through custom post types for projects, scenes, and assets
- Hierarchy viewer, transform editing, lighting placement, camera controls, and scene options
- Scene save/load, undo/redo reload paths, and JSON-based scene persistence
- Background authoring for:
  - Horizon
  - Horizon sky preset tuning
  - Solid color
  - Presets
  - Image sky
- Fog controls and scene-level environment settings

### Asset workflows

- 3D asset upload and editing for GLB, OBJ, and FBX workflows
- Image, video, audio, light, and helper asset usage inside scenes
- Asset categories and taxonomy-driven organization
- Dedicated `Walkable Surfaces` category for compiled navigation meshes
- Scene-side asset browser and drag/drop placement
- Asset editor integration from both standalone pages and inside scene workflows

### Compiled A-Frame output

- One-click scene compilation to A-Frame HTML output
- Scene startup loader to reduce visible object pop-in during initial load
- Compile dialog controls for compiled-output quality settings (see "Post-processing pipeline" below for details)
- Scene editor remains the source of truth for:
  - Background style
  - Horizon sky preset
  - Preset selection
  - Preset ground toggle
- Fog-off scenes compile without inherited fallback fog
- Improved double-sided image output using a two-plane compile strategy to avoid back-face overlap artifacts

### Navigation and interaction

- Compiled movement with desktop and VR-friendly controls
- Category-driven walkable surface collisions for compiled A-Frame scenes
- Automatic walkable-surface detection when `Walkable Surfaces` assets exist in a scene
- Scene-level collision override through `aframeCollisionMode`
- Auto step-up traversal across walkable ramps and stairs
- POI, image, video, and raycast-driven interactions in compiled scenes

### Runtime quality and visual features

- A-Frame 1.7.1 + Three.js r173 runtime with full PBR material support
- Desktop-oriented `High` quality rendering path with quality-aware renderer tuning
- Shadow quality presets (off / medium PCFShadowMap / high PCFSoftShadowMap)
- HDR environment maps (RGBELoader + PMREMGenerator) with 3 presets for realistic PBR reflections
- PBR material enhancement: envMapIntensity range (0.5x–2.0x), physically correct lights

#### Post-processing pipeline

When post-FX is enabled, a lazily-instantiated multi-pass cinematic pipeline runs. Only passes for effects actually enabled in the compile dialog are allocated — disabled effects consume zero VRAM and zero ALU.

1. **Scene render** — ACESFilmic tone mapping + sRGB encoding applied to render target via Three.js `isXRRenderTarget` trick
2. **SAO (Scalable Ambient Obscurance)** — depth-only screen-space AO with bilateral blur, 3 quality presets (soft/balanced/strong), half resolution. Adaptive temporal subsampling: when average FPS drops below 30, SAO computes every other frame and reuses the previous result, restoring full rate when FPS recovers above 45 (3-second hysteresis)
3. **SSR (Screen-Space Reflections)** — ray marching with binary refinement, Fresnel-based strength, edge/distance fade, 3 strength presets, half resolution
4. **Bloom** — bright-pass + separable 9-tap Gaussian blur at half resolution
5. **Composite** — `#define`-specialized shader that combines only the enabled features (AO × scene + SSR + bloom + color grading + vignette + exposure); disabled paths are compiled out entirely
6. **TAA (Temporal Anti-Aliasing)** — Halton(2,3) sub-pixel jitter with 5-tap Catmull-Rom history sampling and YCoCg variance-clipped temporal accumulation. Catmull-Rom resampling preserves high-frequency texture detail across repeated accumulations, preventing the "JPG mush" that bilinear history sampling compounds
7. **FXAA** — NVIDIA FXAA 3.11 as final cleanup pass. Automatically skipped when TAA is on (TAA already resolves aliasing and FXAA would blur its output)

All effects are individually toggleable from the compile dialog. For the full technical breakdown of every pass, shader, and design trade-off, see [`RENDERING_PIPELINE.md`](RENDERING_PIPELINE.md).

#### Compile dialog controls

- Render quality: Standard / High
- Shadow quality: Off / Medium / High
- Anti-aliasing: Off / Balanced / High / Ultra
- Post-processing master toggle
- SAO ambient occlusion: Off / Soft / Balanced / Strong
- SSR reflection strength: Off / Subtle / Balanced / Strong
- TAA temporal anti-aliasing toggle
- Bloom strength: Off / Subtle / Moderate / Strong
- Color grading, exposure, contrast, vignette presets
- FXAA edge smoothing strength
- FPS meter toggle for performance monitoring

### Collaboration and publishing

- Networked multi-user runtime through the bundled `networked-aframe` server
- WebRTC/easyRTC-based collaboration support
- Build outputs served through the local/runtime web server

## Technology Stack

- WordPress 6.x
- PHP 8.3+
- Vanilla JavaScript
- Three.js r173 in the editor stack (migrated from r147)
- A-Frame 1.7.1 (bundles Three.js r173) in the compiled runtime
- Node.js server for networked/collaborative features

## Core WordPress Model

VRodos uses custom post types and taxonomies for its content model:

- `vrodos_game`: projects
- `vrodos_scene`: scenes
- `vrodos_asset3d`: assets

The plugin follows a manager-class architecture, with responsibilities split across dedicated managers for assets, scenes, AJAX, upload handling, compilation, defaults, roles, menus, settings, and pages.

## Typical Workflow

1. Create a project.
2. Create one or more scenes.
3. Upload or edit assets.
4. Add assets to the scene editor and configure transforms, lights, and background.
5. Optionally add helper assets in the `Walkable Surfaces` category for compiled navigation.
6. Open the compile dialog and choose compiled-output quality settings.
7. Build the project to generate compiled A-Frame output.

## Local Development

### WordPress

- Install WordPress locally.
- Place the plugin in `wp-content/plugins/VRodos/`.
- Activate the plugin from the WordPress admin.
- Use a non-plain permalink structure.

### Collaborative/runtime server

The bundled server lives in:

`runtime/networked-aframe/`

Install and run it with:

```bash
cd wp-content/plugins/VRodos/runtime/networked-aframe/
npm install
cd server/
node easyrtc-server.js
```

By default, the local runtime server is commonly used on port `5832`.

## Upload Limits

Large GLB uploads depend on both PHP limits and web server limits.

If large assets fail to upload, check:

- PHP `upload_max_filesize`
- PHP `post_max_size`
- Apache or Local WP request/body size limits
- WordPress/media-related server limits

For Local WP environments, Apache limits can still block uploads even when PHP limits look large enough.

## Troubleshooting

### Scene editor does not load correctly

- Verify plugin scripts are enqueued.
- Check the browser console for JavaScript errors.
- Confirm Three.js and editor assets are present in the plugin directory.

### Compiled scene looks flat or low quality

- Rebuild after changing compile dialog quality settings.
- Use `High` render quality for desktop-oriented scenes.
- Enable post-processing and set SAO to Balanced or Strong for depth.
- Enable SSR (Balanced) for reflective surfaces — requires PBR materials with metalness/roughness.
- Review authored GLB material quality, textures, and lighting setup.

### Walkable surfaces do not behave as expected

- Ensure the helper asset belongs to the `Walkable Surfaces` category.
- Rebuild the scene after changing walkable geometry.
- Use simpler helper meshes for navigation when the visible GLB is noisy or anomalous.

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
