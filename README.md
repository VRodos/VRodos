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
- Compile dialog controls for compiled-output quality settings:
  - Render Quality: `Standard` or `High`
  - Shadow Quality: `Off`, `Medium`, or `High`
  - Post-Processing toggle
- Scene editor remains the source of truth for:
  - Background style
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

- A-Frame scene settings passed from editor/compile metadata into runtime
- Desktop-oriented `High` quality rendering path
- Shadow quality presets applied at runtime
- Photorealism groundwork with:
  - quality-aware renderer tuning
  - improved environment lighting behavior
  - PBR-friendly material enhancement for compiled GLBs
  - restrained post-FX path for high-quality builds

### Collaboration and publishing

- Networked multi-user runtime through the bundled `networked-aframe` server
- WebRTC/easyRTC-based collaboration support
- Build outputs served through the local/runtime web server

## Technology Stack

- WordPress 6.x
- PHP 8.3+
- Vanilla JavaScript
- Three.js r147 in the editor stack
- A-Frame 1.7.x in the compiled runtime
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
