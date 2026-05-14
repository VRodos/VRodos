# Scene Editor Staged Modular Refactor Plan

## Status

- 2026-05-14: Phase 1 staged modular refactor implemented.
- 2026-05-14: Phase 2 loader factory extraction implemented.
- 2026-05-14: Phase 3 render environment helper extraction implemented.
- 2026-05-14: Phase 4 scene registry extraction implemented.
- 2026-05-14: Phase 5 transform controls extraction implemented.
- 2026-05-14: Phase 6 selection extraction implemented.
- 2026-05-14: Phase 7 object factory extraction implemented.
- 2026-05-14: Phase 8 floating panel UI extraction implemented.
- 2026-05-14: Phase 9 shared UI helper extraction implemented.
- 2026-05-14: Phase 10 scene snapshot UI extraction implemented.
- 2026-05-14: Phase 11 autosave handler ownership moved to the scene save AJAX module.
- 2026-05-14: Phase 12 scene canvas drop UI extraction implemented.
- 2026-05-14: Phase 13 scene list UI extraction implemented.
- 2026-05-14: Phase 14 scene snapshot control binding extraction implemented.
- 2026-05-14: Phase 15 Immerse scene info floating panel binding extraction implemented.
- 2026-05-14: Phase 16 editor shell UI extraction implemented.
- 2026-05-14: Phase 17 editor toolbar UI extraction implemented.
- 2026-05-14: Phase 18 compile dialog UI binding extraction implemented.
- 2026-05-14: Phase 19 scene canvas event binding extraction implemented.
- 2026-05-14: Phase 20 scene editor UI controller orchestration implemented.
- 2026-05-14: Phase 21 raycast selectable cache fallback hardening implemented.
- 2026-05-14: Phase 22 light/helper visibility traversal reduction implemented.
- 2026-05-14: Phase 23 performance-profile editable object count traversal removal implemented.
- 2026-05-14: Phase 24 cel-outline cleanup traversal removal implemented.
- 2026-05-14: Phase 25 duplicate raycaster cel-outline helper removal implemented.
- Verification: Phase 25 JS syntax checks passed; PHP syntax check skipped because no PHP files changed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.

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
- In progress: Move transform controls, selection, scene registry, and object factory out of `vrodos_editor_services.js` into `scene/` modules.
- Done: Move scene registry, scene/envir lookup helpers, selectable-root cache ownership, and bounds cache to `scene/vrodos_scene_registry.js`.
- Done: Move transform controls, gizmo proxy state, drag-state snapshots, transform mode/visibility/size, GUI transforms, and undo commit hooks to `scene/vrodos_scene_transforms.js`.
- Done: Move selection state, object-control panel opening, transform-toolbar state, light pointer handlers, hierarchy focus, cel outline hooks, and selection clearing to `scene/vrodos_scene_selection.js`.
- Done: Move object add/remove orchestration, duplicate registration guard, hierarchy/frame/autosave hooks, and loaded-object count updates to `scene/vrodos_scene_object_factory.js`; keep `vrodos_editor_services.js` as a compatibility shim.
- In progress: Move toolbar/panel/floating-panel code out of `vrodos_3d_editor_buttons_drags.js` into focused UI modules.
- Done: Move floating panel clamp/show/hide/drag/resize helpers to `ui/vrodos_floating_panels.js`.
- Done: Move Lucide icon swapping, focus-without-scroll, clipboard fallback helpers, and temporary button feedback to `ui/vrodos_ui_helpers.js`.
- Done: Move scene JSON refresh, screenshot state, screenshot preview, current scene thumbnail updates, and offscreen screenshot capture to `ui/vrodos_scene_snapshot_ui.js`.
- Done: Move `saveSceneEventHandler`, `commitPendingSceneSave`, and `triggerAutoSave` into `ajax/vrodos_save_scene_ajax.js` so scene save and autosave behavior share one owner.
- Done: Move canvas drop handlers and upper-toolbar light/pawn drag payload creation to `ui/vrodos_scene_canvas_drop_ui.js`.
- Done: Move scene drawer toggle, scene reorder persistence, and delete scene dialog wiring to `ui/vrodos_scene_list_ui.js`.
- Done: Move screenshot button/manual image selection and scene JSON view/copy dialog bindings to `ui/vrodos_scene_snapshot_ui.js`.
- Done: Move imported/Immerse scene information floating-panel toggle, resize/close setup, and copy binding to `ui/vrodos_floating_panels.js`.
- Done: Move hierarchy/file panel collapse controls, clear-vision UI toggle, and light/helper visibility toggling to `ui/vrodos_editor_shell_ui.js`.
- Done: Move save/undo/redo, pause, auto-rotate, first-person preview, transform mode/axis, 2D/3D, and object-properties panel helpers to `ui/vrodos_editor_toolbar_ui.js`.
- Done: Move compile/options dialog open, proceed, cancel, close, status reset, and save-before-compile bindings to `ui/vrodos_compile_dialog_ui.js`.
- Done: Move scene canvas drop/dragover binding, mouse selection/focus/context handlers, autosave event binding, property panel context-menu suppression, and light/pawn dragstart wiring to `ui/vrodos_scene_canvas_events_ui.js`.
- Done: Make `ui/vrodos_scene_editor_ui_controller.js` the direct UI subsystem orchestrator and reduce `vrodos_3d_editor_buttons_drags.js` to a compatibility alias.
- Done: Remove routine full-scene traversal fallback from raycast selection by using non-rebuilding `sceneRegistry` and selectable cache reads in hot paths.
- Done: Replace Clear Vision light/helper visibility traversal with cache-backed target collection from `sceneRegistry` and direct scene helper children.
- Done: Replace performance-profile editable object count traversal with selectable cache and non-rebuilding `sceneRegistry` reads.
- Done: Replace global cel-outline cleanup traversal with the tracked `envir.celOutlineMeshes` cache.
- Done: Remove duplicate raycaster cel-outline helpers and route selection indicators through the shared outline helper surface.
- Continue reducing remaining `scene.traverse()` fallbacks where focused modules can own explicit caches.

## Test Plan

- `node --check` for every edited JavaScript file.
- `npm run lint`.
- PHP syntax check for edited PHP files.
- `git diff --check`.
- Manual editor smoke test: scene load, no auto-selection, click-vs-drag selection, transform controls, undo/redo, save/autosave, add/delete object, 2D/3D switch, first-person/avatar controls, compile settings persistence, scene JSON reload.
