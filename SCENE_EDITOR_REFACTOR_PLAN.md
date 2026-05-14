# Scene Editor Staged Modular Refactor Plan

## Status

- 2026-05-14: Phase 1 staged modular refactor implemented.
- 2026-05-14: Phase 2 loader factory extraction implemented.
- 2026-05-14: Phase 3 render environment helper extraction implemented.
- Verification: JS syntax checks passed; PHP syntax check for `includes/class-vrodos-asset-manager.php` passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.

## Goals

- Reduce duplicate logic across save, loader, scene serialization, URL/path helpers, and transform utilities.
- Split large editor files into smaller subsystem modules without breaking existing WordPress script handles.
- Preserve `window.VRODOS`, `vrodos_data.*`, `window.vrodos_three_vendor_base`, `window.vrodos_three_decoder_path`, and `vrodos_data.paths.*`.
- Improve editor performance through measurable render-loop, selection, loading, disposal, and DOM event improvements.

## Target Layout

```text
assets/js/editor/
  core/       namespace-adjacent helpers, constants, event bus, diagnostics
  scene/      scene registry, object factory, selection, transform controls, undo, serialization
  render/     environment creation, cameras, resize, context lifecycle, render loop
  loaders/    GLB/image/text/assessment/light/pawn loaders and load concurrency
  ui/         toolbar actions, panels, hierarchy, compile dialog, background/fog controls
  ajax/       AJAX handlers with save ownership in vrodos_save_scene_ajax.js
```

## Phase 1

- Done: Add staged folder structure through real modules that can be registered by `VRodos_Asset_Manager`.
- Done: Centralize URL/path, safe number/vector/scale, object naming, and clamp helpers in `core/vrodos_editor_core_utils.js`.
- Done: Add editor diagnostics snapshots in `core/vrodos_editor_diagnostics.js`.
- Done: Move GPU disposal ownership to `scene/vrodos_scene_disposal.js`.
- Done: Move render-loop ownership to `render/vrodos_editor_render_loop.js`.
- Done: Make `ajax/vrodos_save_scene_ajax.js` the sole owner of `VRODOS.api.saveChanges`.
- Done: Route `VRODOS.ui.loadButtonActions()` through `ui/vrodos_scene_editor_ui_controller.js` with an idempotent binding guard.
- Done: Add `VRODOS.editorApp.start()` as the editor startup facade while keeping existing startup behavior.

## Later Phases

- In progress: Split `vrodos_LoaderMulti.js` into loader modules for GLB, image, text, assessment, and resource metadata.
- Done: Move assessment/text object factory helpers and loader task concurrency to `loaders/vrodos_loader_object_factories.js`.
- In progress: Split `vrodos_3d_editor_environmentals.js` into render app, cameras, context lifecycle, resize, performance profile, and director helpers.
- Done: Move environment constants, performance defaults, pointer-lock helper, director helper predicates, and environment URL resolution to `render/vrodos_editor_environment_helpers.js`.
- Move transform controls, selection, scene registry, and object factory out of `vrodos_editor_services.js` into `scene/` modules.
- Move toolbar/panel/floating-panel code out of `vrodos_3d_editor_buttons_drags.js` into focused UI modules.
- Reduce fallback `scene.traverse()` usage in selection and hot interaction paths by relying on `sceneRegistry`.

## Test Plan

- `node --check` for every edited JavaScript file.
- `npm run lint`.
- PHP syntax check for edited PHP files.
- `git diff --check`.
- Manual editor smoke test: scene load, no auto-selection, click-vs-drag selection, transform controls, undo/redo, save/autosave, add/delete object, 2D/3D switch, first-person/avatar controls, compile settings persistence, scene JSON reload.
