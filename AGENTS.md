# VRodos Plugin: Agent Guide

This is the canonical root instruction file for AI agents working on VRodos. Keep it current and prefer updating this file over adding tool-specific agent docs.

## Project Overview

VRodos is a WordPress plugin for authoring and compiling interactive 3D scenes inside WordPress.

It provides:

- a browser-based Three.js scene editor for projects, scenes, and assets
- a compiled A-Frame runtime for published desktop/VR experiences
- WordPress CPT and AJAX integration for persistence and asset management
- runtime support for post-processing, Takram atmosphere, navigation, and scene-probe reflections
- optional collaborative/runtime serving through `services/networked-aframe/`

## Current Architecture

```text
VRodos/
  VRodos.php
  includes/                        PHP managers, models, AJAX classes
  templates/pages/                 WordPress page templates
  templates/runtime/aframe/        A-Frame compile prototypes
  assets/js/editor/                Scene editor scripts
  assets/js/runtime/master/        Compiled-scene runtime helpers
  assets/js/runtime/master/lib/    Generated runtime bundles
  assets/css/                      Source and generated CSS
  assets/vendor/                   Vendored browser bundles such as Three r181
  runtime/build/                   Generated compiled HTML output only
  services/networked-aframe/       Node/WebRTC collaborative runtime server
  scripts/                         Build and maintenance scripts
```

Architectural rules:

- `assets/` is the single public/static asset root.
- `includes/` is PHP-only.
- `templates/runtime/aframe/` contains source HTML prototypes, not generated output.
- `runtime/build/` is generated output and should not be treated as source.
- Prefer `VRodos_Path_Manager` over hardcoded plugin paths/URLs.
- Keep compatibility globals available during migration: `vrodos_data.pluginPath`, `window.vrodos_three_vendor_base`, `window.vrodos_three_decoder_path`, and `vrodos_data.paths.*`.

Important managers:

- `VRodos_Asset_Manager`: script/style registration and enqueueing
- `VRodos_Scene_CPT_Manager`: scene editor data preparation
- `VRodos_Compiler_Manager`: compiled A-Frame scene generation
- `VRodos_Render_Runtime_Manager`: active runtime/version configuration
- `VRodos_Path_Manager`: path/url indirection

## Runtime And Rendering

The active compiled runtime targets:

- A-Frame metadata declared in root `package.json`
- Three.js vendor stack `r181`, derived from the locked root `three` package
- PMNDRS `postprocessing` bundle exported as `window.POSTPROCESSING`
- Takram atmosphere/effects bundle exported as `window.VRODOS_TAKRAM_ATMOSPHERE`

Root `package.json` plus `package-lock.json` are the version source of truth. `npm run build:three` generates `assets/runtime-version-manifest.json`, and `VRodos_Render_Runtime_Manager` reads that manifest.

Rendering docs:

- `RENDERING_PIPELINE.md`: current technical render-stack reference
- `TAKRAM_REALISTIC_LIGHTING_PLAN.md`: phased Takram realism, Three-version, and SSGI roadmap
- `RENDERING_MIGRATION_IMPLEMENTATION_LOG.md`: consolidated migration history
- `POSTFX_DEBUG_NOTES.md`: historical color/Horizon debug findings

Do not load a newer Three.js beside the current classic A-Frame runtime. Future Three upgrades belong in a separate A-Frame module/import-map runtime spike where A-Frame, VRodos, loaders, PMNDRS, Takram, and addons resolve to one shared `THREE`.

## Styling And Templates

Tailwind and DaisyUI both use the `tw-` prefix.

- Use `tw-btn`, `tw-modal`, `tw-checkbox`, `tw-flex`, etc.
- Do not use the old `d-` prefix.
- Do not use `peer-checked:tw-*` variants for important state styling in WordPress templates; use explicit sibling CSS when needed.
- Put `data-theme="emerald"` on `<html>` only.
- Every rendered page body must include `vrodos-manager-wrapper`; Tailwind uses `important: '.vrodos-manager-wrapper'`.
- Do not manually run CSS builds unless the task is explicitly about building CSS. Development normally relies on `npm run watch:css`.

Template rules:

- Page templates output full HTML documents.
- Use `wp_head()` in `<head>` and `wp_footer()` before `</body>`.
- Do not call `wp_enqueue_style()` or `wp_enqueue_script()` inside templates.
- Add scripts/styles through `VRodos_Asset_Manager`.
- Do not add inline `<script src="...">` tags for libraries; register/enqueue them.

## Scene Editor Rules

- Selection fires on `mouseup`, not `mousedown`.
- `_CLICK_THRESHOLD = 5px` distinguishes click vs drag.
- No object should be auto-selected on scene load.
- `envir.camera` is not used; use `envir.orbitControls.object` for the camera.
- Use the cel-shaded back-face hull highlight helpers instead of `OutlinePass`.
- Use `lil-gui`, not `dat.gui`.
- Add null guards when accessing `transform_controls.object`.

Category icons:

- JS source of truth: `assets/js/editor/vrodos_icons.js`
- PHP mirror: `vrodos_get_asset_category_icon()`
- Do not create new category-icon maps elsewhere.

Lucide icons:

- Use `<i data-lucide="icon-name">`.
- Call `lucide.createIcons()` after dynamic DOM insertion.

## Build And Verification

Runtime package updates:

1. Update root `package.json` and `package-lock.json`.
2. Run `npm run build:three`.
3. Run `npm run build:runtime`.
4. Commit generated runtime outputs that changed intentionally.

Common checks:

- `npm run lint`
- `node --check` for edited JS files
- PHP syntax checks for edited PHP files
- `git diff --check`

Do not manually copy standalone PMNDRS bundles. `postprocessing` is exported from `assets/js/runtime/master/lib/vrodos-postprocessing.bundle.js`.

## Local Development

Local setup:

1. Install WordPress locally.
2. Place the plugin in `wp-content/plugins/VRodos/`.
3. Activate the plugin.
4. Use non-plain permalinks.

Collaborative/runtime server:

```bash
cd wp-content/plugins/VRodos/services/networked-aframe
npm install
cd server
node easyrtc-server.js
```

The local runtime server is typically used on port `5832`.

## Security And WordPress Standards

- Use `absint()` for WordPress IDs.
- Use `sanitize_text_field()` for strings.
- Do not log or print secrets.
- Protect `.env` and `services/networked-aframe/server/keys.json`.

## Cleanup Rules

- Do not treat `runtime/build/` HTML as source.
- Do not reintroduce `js_libs/` or the mirrored `includes/templates/` tree.
- Do not reintroduce top-level `css/` or `images/`; `assets/css/` and `assets/images/` are canonical.
- Keep cleanup/removal work separate from behavioral fixes when possible.
