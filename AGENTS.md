# VRodos Plugin: Technical Architecture & Refactoring Guide

This document describes the current VRodos plugin structure after the asset-layout refactor and should be treated as the local source of truth when making follow-up cleanup changes.

---

## 1. Project Overview

**VRodos** is a WordPress plugin for authoring and compiling interactive 3D scenes inside WordPress.

It provides:

- a browser-based Three.js scene editor for projects, scenes, and assets
- a compiled A-Frame runtime for published desktop/VR experiences
- WordPress CPT and AJAX integration for persistence and asset management
- a collaborative Node/WebRTC runtime server for networked A-Frame sessions

### Core functionality

- 3D scene editing with transforms, hierarchy, lights, backgrounds, fog, and helper objects
- Asset management for GLB, image, video, audio, and runtime helper media
- Scene compilation to A-Frame HTML output under `runtime/build/`
- Runtime support for post-processing, atmosphere, navigation, and scene-probe reflections
- Optional collaborative/runtime serving through `services/networked-aframe/`

---

## 2. Current Architecture

### Plugin structure

```text
VRodos/
  VRodos.php                       Main plugin bootstrap
  includes/                        PHP managers, models, AJAX classes
    ajax/                          AJAX handlers
    class-vrodos-path-manager.php  Central path/url helper
  templates/
    pages/                         WordPress page templates
    runtime/aframe/                A-Frame compile prototypes
  assets/
    js/
      editor/                      Editor and asset-viewer scripts
      editor/ajax/                 AJAX client scripts
      runtime/                     Runtime JS loaded by compiled scenes
      runtime/components/          A-Frame runtime components
      runtime/master/              Compiled-scene runtime helpers
    css/                           Admin, editor, frontend, and runtime CSS
    images/                        UI, HDR, screenshots, textures, runtime images
    models/                        Built-in editor/runtime/director GLB models
    vendor/                        Vendored browser bundles such as Three r181
    scenes/                        Built-in scene JSON
    runtime-version-manifest.json  Generated runtime package/version manifest
  runtime/
    build/                         Generated compiled HTML output only
  services/
    networked-aframe/              Node/WebRTC collaborative runtime server
  scripts/                         Build and maintenance scripts
```

### Architectural rules

- `assets/` is the single public/static asset root.
- `includes/` is PHP-only.
- `templates/runtime/aframe/` contains source HTML prototypes, not generated output.
- `runtime/build/` is generated output and should not be treated as source.
- `services/networked-aframe/` contains the Node server source.
- `VRodos_Path_Manager` is the preferred place for plugin-relative paths and URLs.

### Manager class pattern

VRodos continues to use a manager-class architecture where each domain is isolated behind a dedicated class.

Important managers:

- `VRodos_Asset_Manager`: registers and enqueues scripts/styles
- `VRodos_Post_Type_Manager`: registers CPTs/taxonomies
- `VRodos_Game_CPT_Manager`: game/project meta boxes and save logic
- `VRodos_Scene_CPT_Manager`: scene editor data preparation and scene admin logic
- `VRodos_Asset_CPT_Manager`: asset editor/admin logic
- `VRodos_AJAX_Handler`: aggregates AJAX endpoints
- `VRodos_Upload_Manager`: upload/media handling
- `VRodos_Core_Manager`: shared helpers and dashboard utilities
- `VRodos_Default_Scene_Manager`: default scene content
- `VRodos_Default_Data_Manager`: default data/bootstrap content
- `VRodos_Compiler_Manager`: compiled A-Frame scene generation
- `VRodos_Render_Runtime_Manager`: active runtime/version configuration
- `VRodos_Path_Manager`: path/url indirection for the refactored layout

---

## 3. Editor and Runtime

### Editor stack

The scene editor is built around a vendored **Three.js r181** bundle and a set of editor-side modules under `assets/js/editor/`.

Key editor modules:

- `vrodos_EditorInitializer.js`
- `vrodos_LoaderMulti.js`
- `vrodos_ScenePersistence.js`
- `vrodos_AssetViewer_3D_kernel.js`
- `vrodos_3d_editor_buttons_drags.js`
- `vrodos_rayCasters.js`
- `vrodos_LightsPawn_Loader.js`
- `vrodos_addRemoveOne.js`
- `vrodos_3d_editor_environmentals.js`

### Compiled runtime

Compiled scenes are generated from the prototypes in `templates/runtime/aframe/` and written to `runtime/build/`.

Runtime JS lives under:

- `assets/js/runtime/`
- `assets/js/runtime/components/`
- `assets/js/runtime/master/`

The active compiled runtime currently targets:

- A-Frame master runtime metadata declared in root `package.json`
- Three.js vendor stack `r181`, derived from the locked root `three` package

Root `package.json` plus `package-lock.json` are the version source of truth. `npm run build:three` generates `assets/runtime-version-manifest.json`, and `VRodos_Render_Runtime_Manager` reads that manifest for the active runtime pairing and vendor bundle selection.

---

## 4. Technology Stack

- Backend: PHP 8.3+, WordPress 6.8+
- Database: MySQL 8.0+ or MariaDB 10.6+
- Frontend: Vanilla JavaScript
- Editor rendering: generated Three vendor bundle, currently `r181`
- Compiled runtime: A-Frame metadata from root `package.json`
- Runtime post-processing: legacy custom path plus PMNDRS path bundled through `assets/js/runtime/master/lib/vrodos-postprocessing.bundle.js`
- Atmosphere runtime: generated Takram bundle with PMNDRS compile-dialog look presets; Takram clouds are not shipped yet
- Collaborative server: Node.js + EasyRTC/WebRTC

---

## 5. Development Workflow

### Local setup

1. Install WordPress locally.
2. Place the plugin in `wp-content/plugins/VRodos/`.
3. Activate the plugin.
4. Use non-plain permalinks.
5. Install and run the collaborative/runtime server if needed:

```bash
cd wp-content/plugins/VRodos/services/networked-aframe
npm install
cd server
node easyrtc-server.js
```

The local runtime server is typically used on port `5832`.

### Build outputs

- Three vendor build targets `assets/vendor/<three-dir>/`, currently `assets/vendor/three-r181/`
- Runtime master library outputs target `assets/js/runtime/master/lib/`
- Runtime version manifest targets `assets/runtime-version-manifest.json`
- CSS outputs target `assets/css/`

Run `npm run build` after changing runtime package versions. Do not manually copy standalone PMNDRS bundles; `postprocessing` is exported from `assets/js/runtime/master/lib/vrodos-postprocessing.bundle.js`.

---

## 6. Refactor Guidance

### Path/layout rules

- Prefer `VRodos_Path_Manager` over hardcoded `plugin_dir_url`, `plugin_dir_path`, or literal asset folders.
- Keep WordPress script/style handles stable even when URLs change.
- Keep compatibility globals available during migration:
  - `vrodos_data.pluginPath`
  - `window.vrodos_three_vendor_base`
  - `window.vrodos_three_decoder_path`
  - `vrodos_data.paths.*`

### Cleanup rules

- Do not treat `runtime/build/` HTML as source.

### Cleanup status

- `js_libs/` and the mirrored `includes/templates/` tree should not be reintroduced.
- Top-level `css/` and `images/` should not be reintroduced now that `assets/css/` and `assets/images/` are canonical.
- The compiler now expects only the canonical placeholder scheme used by `templates/runtime/aframe/`.

---

## 7. Common Issues

### Scene editor not loading

- Verify `VRodos_Asset_Manager` enqueues the expected scripts.
- Confirm the active Three vendor bundle exists under `assets/vendor/three-r181/`.
- Confirm `assets/runtime-version-manifest.json` matches the current package lock after package updates.
- Check the browser console for JS errors.

### Compiled scene missing assets

- Recompile the scene after changing compiler/runtime asset paths.
- Confirm the Node server serves `assets/`, `/js`, `/css`, `/img`, `/media`, and `/dist` as expected.
- Check compiled HTML for stale compatibility paths.

### Collaborative editing/runtime problems

- Ensure the server is running from `services/networked-aframe/`.
- Verify `server/keys.json`.
- Check CORS, firewall, and port issues.

---

## 8. Summary

VRodos now uses a clearer split between PHP code, source templates, public assets, generated runtime output, and Node services. Future work should prefer path-helper-driven changes, preserve compatibility where needed, and keep cleanup/removal work separate from behavioral fixes.
