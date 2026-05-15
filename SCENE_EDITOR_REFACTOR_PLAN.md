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
- 2026-05-14: Phase 26 director ground-guide target refresh scoped to registry roots.
- 2026-05-14: Phase 27 scene-load light-helper update traversal removal implemented.
- 2026-05-14: Sun DirectionalLight target/helper synchronization fix implemented.
- Verification: Sun DirectionalLight JS syntax checks passed; PHP syntax check skipped because no PHP files changed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-14: Sun shadow-camera helper synchronization fix implemented.
- Verification: Sun shadow-camera helper JS syntax checks passed; PHP syntax check skipped because no PHP files changed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-14: Phase 28 director internal-helper cleanup traversal removal implemented.
- Verification: Phase 28 JS syntax check passed; PHP syntax check skipped because no PHP files changed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-14: Phase 29 hierarchy/player-focus scene-root traversal fallback removal implemented.
- Verification: Phase 29 JS syntax checks passed; PHP syntax check skipped because no PHP files changed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-14: Phase 30 registry rebuild and scene-root traversal fallback removal implemented.
- Verification: Phase 30 JS syntax checks passed; PHP syntax check skipped because no PHP files changed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-14: Phase 31 scene bounds calculation consolidation implemented.
- Verification: Phase 31 JS syntax checks passed; PHP syntax check skipped because no PHP files changed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-14: Spot-light properties hierarchy lookup fix implemented.
- Verification: Spot-light properties JS syntax check passed; PHP syntax check skipped because no PHP files changed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-14: SpotLight target/helper linkage fix implemented.
- Verification: SpotLight target/helper JS syntax checks passed; PHP syntax check skipped because no PHP files changed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-14: Phase 32 editor light-helper factory consolidation implemented.
- Verification: Phase 32 JS syntax checks passed; PHP syntax check skipped because no PHP files changed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-14: Phase 33 editor light visual and target factory consolidation implemented.
- Verification: Phase 33 JS syntax checks passed; PHP syntax check skipped because no PHP files changed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-14: Phase 34 editor light shadow-helper and undo-associate restoration implemented.
- Verification: Phase 34 JS syntax checks passed; PHP syntax check skipped because no PHP files changed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-14: Phase 35 editor light artifact removal consolidation implemented.
- Verification: Phase 35 JS syntax checks passed; PHP syntax check skipped because no PHP files changed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-14: Phase 36 editor light artifact module extraction implemented.
- Verification: Phase 36 JS syntax checks passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-14: Phase 37 undo visibility restoration helper consolidation implemented.
- Verification: Phase 37 JS syntax checks passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-14: Phase 38 transform helper preparation ownership implemented.
- Verification: Phase 38 JS syntax checks passed; PHP syntax check skipped because no PHP files changed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-14: Phase 39 cel-outline selection ownership implemented.
- Verification: Phase 39 JS syntax checks passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 40 loader object preparation extraction implemented.
- Verification: Phase 40 JS syntax checks passed; PHP syntax check skipped because no PHP files changed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 41 scene settings sync extraction implemented.
- Verification: Phase 41 JS syntax checks passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 42 generated asset loader extraction implemented.
- Verification: Phase 42 JS syntax checks passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 43 GLB asset loader extraction implemented.
- Verification: Phase 43 JS syntax checks passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 44 director camera loader extraction implemented.
- Verification: Phase 44 JS syntax checks passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 45 loader resource metadata extraction implemented.
- Verification: Phase 45 JS syntax checks passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 46 light/pawn loader folder migration implemented.
- Verification: Phase 46 JS syntax check passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 47 light and pawn loader split implemented.
- Verification: Phase 47 JS syntax checks passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 48 light/pawn metadata sync consolidation implemented.
- Verification: Phase 48 JS syntax checks passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 49 scene loader lifecycle extraction implemented.
- Verification: Phase 49 JS syntax checks passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 50 loader coordinator folder migration implemented.
- Verification: Phase 50 JS syntax check passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 51 editor performance profile extraction implemented.
- Verification: Phase 51 JS syntax checks passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 52 editor renderer lifecycle extraction implemented.
- Verification: Phase 52 JS syntax checks passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 53 editor camera extraction implemented.
- Verification: Phase 53 JS syntax checks passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 54 editor director helper extraction implemented.
- Verification: Phase 54 JS syntax checks passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 55 editor scene environment extraction implemented.
- Verification: Phase 55 JS syntax checks passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 56 editor environment bootstrap extraction implemented.
- Verification: Phase 56 JS syntax checks passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 57 scene editor enqueue grouping implemented.
- Verification: Phase 57 edited no JS files; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 58 environment compatibility shim folder migration implemented.
- Verification: Phase 58 JS syntax check passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 59 editor button compatibility shim folder migration implemented.
- Verification: Phase 59 JS syntax check passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 60 editor services compatibility shim folder migration implemented.
- Verification: Phase 60 JS syntax check passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 61 undo engine scene folder migration implemented.
- Verification: Phase 61 JS syntax check passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 62 scene persistence folder migration implemented.
- Verification: Phase 62 JS syntax check passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 63 scene bounds helper folder migration implemented.
- Verification: Phase 63 JS syntax check passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 64 keyboard controls UI folder migration implemented.
- Verification: Phase 64 JS syntax check passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 65 pointer-lock controls UI folder migration implemented.
- Verification: Phase 65 JS syntax check passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 66 scene settings schema folder migration implemented.
- Verification: Phase 66 JS syntax check passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 67 batch scene editor file organization implemented.
- Verification: Phase 67 JS syntax checks passed; `includes/class-vrodos-asset-manager.php` PHP syntax check passed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 68 scene raycasting cleanup implemented.
- Verification: Phase 68 JS syntax check passed; PHP syntax check skipped because no PHP files changed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.
- 2026-05-15: Phase 69 property controls cleanup implemented.
- Verification: Phase 69 JS syntax check passed; PHP syntax check skipped because no PHP files changed; `git diff --check` passed; `npm.cmd run lint` passed with existing warnings only.

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

- Done: Split `vrodos_LoaderMulti.js` into loader modules for GLB, image, text, assessment, and resource metadata.
- Done: Move assessment/text object factory helpers and loader task concurrency to `loaders/vrodos_loader_object_factories.js`.
- Done: Split `vrodos_3d_editor_environmentals.js` into render app, cameras, context lifecycle, resize, performance profile, and director helpers.
- Done: Move environment constants, performance defaults, pointer-lock helper, director helper predicates, and environment URL resolution to `render/vrodos_editor_environment_helpers.js`.
- Done: Move transform controls, selection, scene registry, and object factory out of `vrodos_editor_services.js` into `scene/` modules.
- Done: Move scene registry, scene/envir lookup helpers, selectable-root cache ownership, and bounds cache to `scene/vrodos_scene_registry.js`.
- Done: Move transform controls, gizmo proxy state, drag-state snapshots, transform mode/visibility/size, GUI transforms, and undo commit hooks to `scene/vrodos_scene_transforms.js`.
- Done: Move selection state, object-control panel opening, transform-toolbar state, light pointer handlers, hierarchy focus, cel outline hooks, and selection clearing to `scene/vrodos_scene_selection.js`.
- Done: Move object add/remove orchestration, duplicate registration guard, hierarchy/frame/autosave hooks, and loaded-object count updates to `scene/vrodos_scene_object_factory.js`; keep `vrodos_editor_services` as a compatibility handle.
- Done: Move the remaining editor services compatibility shim under `scene/vrodos_editor_services_compat.js` while preserving the `vrodos_editor_services` WordPress handle and editor service globals.
- Done: Move toolbar/panel/floating-panel code out of `vrodos_3d_editor_buttons_drags.js` into focused UI modules.
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
- Done: Move keyboard shortcut and first-person movement controls under `ui/vrodos_keyboard_controls.js` while preserving the `vrodos_keyButtons` WordPress handle and `VRODOS.api.updatePointerLockControls` / `resetAvatarMovement` globals.
- Done: Move pointer-lock and first-person preview toggling under `ui/vrodos_pointer_lock_controls.js` while preserving the `vrodos_movePointerLocker` WordPress handle and pointer-lock API globals.
- Done: Make `ui/vrodos_scene_editor_ui_controller.js` the direct UI subsystem orchestrator and reduce `vrodos_3d_editor_buttons_drags.js` to a compatibility alias.
- Done: Remove routine full-scene traversal fallback from raycast selection by using non-rebuilding `sceneRegistry` and selectable cache reads in hot paths.
- Done: Replace Clear Vision light/helper visibility traversal with cache-backed target collection from `sceneRegistry` and direct scene helper children.
- Done: Replace performance-profile editable object count traversal with selectable cache and non-rebuilding `sceneRegistry` reads.
- Done: Replace global cel-outline cleanup traversal with the tracked `envir.celOutlineMeshes` cache.
- Done: Remove duplicate raycaster cel-outline helpers and route selection indicators through the shared outline helper surface.
- Done: Scope director ground-guide mesh target refresh to registered scene roots instead of traversing the whole scene.
- Done: Replace scene-load light-helper update traversal with direct scene-level helper updates.
- Done: Align custom sun lights with Three.js `DirectionalLight` target semantics by using the visible target object as `light.target` and synchronizing helpers during transform updates.
- Done: Force editor Sun shadow-camera matrices and `CameraHelper` geometry to refresh after Sun/target transforms and shadow property edits.
- Done: Track director visual/proxy helpers explicitly and clear them without a full `scene.traverse()` scan.
- Done: Add non-rebuilding scene-root reads and use them for hierarchy refresh and scene-load player focus instead of `traverseFallback`.
- Done: Rebuild `sceneRegistry` from direct scene roots and director helper references instead of full-scene traversal.
- Done: Remove the unused `traverseFallback` branch from `getEditorSceneRoots`; the remaining editor `scene.traverse()` is scene serialization.
- Done: Route legacy scene bounds helpers through the `sceneRegistry` `Box3` cache and remove throwaway `BoxHelper` bounds construction.
- Done: Make the spot-light target dropdown use cached scene roots and guard DOM fallback lookups against non-element hierarchy nodes.
- Done: Link SpotLight to its visible target object and add a `SpotLightHelper` cone so spot lights and targets read as one connected editor control.
- Done: Centralize editor light-helper creation and metadata tagging for add, load, and undo restore paths.
- Done: Centralize editor light visual spheres and light-target object construction for add and load paths.
- Done: Centralize Sun shadow-helper creation and restore missing light targets/shadow helpers during light delete undo.
- Done: Centralize editor light helper/target/shadow-helper removal and disposal for delete flows.
- Done: Move editor light artifact helpers out of `vrodos_namespace.js` into `scene/vrodos_scene_light_artifacts.js` with explicit WordPress script dependencies.
- Done: Centralize undo object-tree visibility restoration in `scene/vrodos_scene_disposal.js` and make the undo engine depend on the lifecycle helper module.
- Done: Move transform-control helper preparation into `scene/vrodos_scene_transforms.js` and cache prepared helper nodes so visibility refreshes do not re-traverse the helper subtree.
- Done: Move cel-shaded selection outline ownership into `scene/vrodos_scene_selection.js` and track per-object outline meshes so object-level outline removal does not re-traverse after creation.
- Done: Move loaded-object property application, director camera preparation, GLB texture anisotropy, and video-thumbnail material assignment out of `vrodos_LoaderMulti.js` into `loaders/vrodos_loader_object_factories.js`.
- Done: Move scene-setting UI/envir synchronization out of `vrodos_LoaderMulti.js` into `scene/vrodos_scene_settings_sync.js` with explicit enqueue dependencies.
- Done: Move assessment, text-panel, and flat-image scene-object loading out of `vrodos_LoaderMulti.js` into `loaders/vrodos_loader_generated_assets.js`.
- Done: Move GLB metadata fetch, URL resolution, GLTF load callbacks, animation startup, texture preparation, and scene registration out of `vrodos_LoaderMulti.js` into `loaders/vrodos_loader_glb_assets.js`.
- Done: Move editor director/avatar camera GLB loading and helper installation out of `vrodos_LoaderMulti.js` into `loaders/vrodos_loader_director_camera.js`.
- Done: Move loader resource metadata handling, dense-scene load profile selection, nested `SceneSettings` sync, `cameraCoords` restore, and light/pawn filtering out of `vrodos_LoaderMulti.js` into `loaders/vrodos_loader_resource_metadata.js`.
- Done: Move the light/pawn loader implementation under `loaders/vrodos_loader_lights_pawn.js` while preserving the existing `vrodos_LightsPawn_Loader` WordPress script handle.
- Done: Split light creation and pawn GLB loading into `loaders/vrodos_loader_light_assets.js` and `loaders/vrodos_loader_pawn_assets.js`, with shared TRS/registration helpers in `loaders/vrodos_loader_scene_asset_helpers.js` and `vrodos_loader_lights_pawn.js` kept as a compatibility coordinator.
- Done: Remove duplicate metadata/fog/clear-color syncing from the light/pawn compatibility coordinator and route it through `loaders/vrodos_loader_resource_metadata.js` and `scene/vrodos_scene_settings_sync.js`.
- Done: Move scene load preparation, resource splitting, reload cleanup, loader orchestration, and scene-load finalization out of `vrodos_EditorInitializer.js` into `loaders/vrodos_loader_scene_lifecycle.js`.
- Done: Move the remaining `VRODOS.loader.LoaderMulti` coordinator implementation under `loaders/vrodos_loader_multi.js` while preserving the existing `vrodos_LoaderMulti` WordPress script handle.
- Done: Move editor performance profile calculation, pixel-ratio cap application, texture anisotropy cap selection, and render-loop quality fields out of `vrodos_3d_editor_environmentals.js` into `render/vrodos_editor_performance_profile.js`.
- Done: Move renderer configuration, WebGL context lifecycle, label renderer setup, resize handling, composer camera sync, and direct frame rendering out of `vrodos_3d_editor_environmentals.js` into `render/vrodos_editor_renderer_lifecycle.js`.
- Done: Move orbit/avatar/third-person camera setup, active camera selection, compass heading updates, and scene-fit camera framing out of `vrodos_3d_editor_environmentals.js` into `render/vrodos_editor_cameras.js`.
- Done: Move Director visual/proxy helper tracking, first-person rig synchronization, authored Director transform helpers, and Director ground-guide raycast/update logic out of `vrodos_3d_editor_environmentals.js` into `render/vrodos_editor_director_helpers.js`.
- Done: Move editor scene creation, HDR environment texture loading, and grid/axis helper setup out of `vrodos_3d_editor_environmentals.js` into `render/vrodos_editor_scene_environment.js`.
- Done: Move editor environment state initialization, metrics setup, renderer construction, renderer attachment, and constructor orchestration out of `vrodos_3d_editor_environmentals.js` into `render/vrodos_editor_environment_bootstrap.js`.
- Done: Group scene editor WordPress script enqueues in `VRodos_Asset_Manager` behind an ordered handle helper while preserving existing handles, dependency registrations, and vendor inline globals.
- Done: Move the remaining environment compatibility shim under `render/vrodos_editor_environmentals.js` while preserving the `vrodos_3d_editor_environmentals` WordPress handle and `VRODOS.editor.Environmentals` public surface.
- Done: Move the remaining editor button/drag compatibility shim under `ui/vrodos_editor_buttons_drags_compat.js` while preserving the `vrodos_3d_editor_buttons_drags` WordPress handle.
- Done: Move the remaining editor services compatibility shim under `scene/vrodos_editor_services_compat.js` while preserving the `vrodos_editor_services` WordPress handle and editor service globals.
- Done: Move the undo/redo command engine under `scene/vrodos_undo_engine.js` while preserving the `vrodos_UndoEngine` WordPress handle and editor command globals.
- Done: Move scene export/import persistence under `scene/vrodos_scene_persistence.js` while preserving the `vrodos_ScenePersistence` WordPress handle and `VRODOS.exporter` / importer globals.
- Done: Move scene/object bounds helpers under `scene/vrodos_scene_bounds.js` while preserving the `vrodos_BordersFinder` WordPress handle and legacy `VRODOS.utils` bounds functions.
- Done: Move the scene settings schema under `scene/vrodos_scene_settings_schema.js` while preserving the `vrodos_scene_settings_schema` WordPress handle and `VRODOS.config.SCENE_SETTINGS_SCHEMA` contract.
- Done: Batch-move remaining scene-editor root modules behind stable handles: scene object actions, raycast selection, property controls, hierarchy, asset browser, CEFR badges, compile dialog suite, editor initializer, and legacy helper scripts.
- Done: Clean up scene raycasting internals by modernizing reusable raycaster state, adding explicit switch defaults, and removing unused local debug/popup helpers without changing selection behavior.
- Done: Clean up property controls internals by adding explicit popup-routing switch defaults, replacing a prototype-sensitive GUI controller loop, and removing unused DOM event parameters.
- Done: Batch low-risk lint cleanup across editor AJAX, legacy helpers, undo, compile UI, hierarchy, CEFR badges, asset browser, scene object actions, and scene persistence modules without changing scene editor behavior.
- Done: Clear the remaining editor-side lint warnings by making asset-editor template globals explicit, removing a dead local color helper/constant, and dropping unused event parameters in project/asset editor scripts.
- Continue reducing remaining non-serialization subtree traversals where focused modules can own explicit caches.

## Test Plan

- `node --check` for every edited JavaScript file.
- `npm run lint`.
- PHP syntax check for edited PHP files.
- `git diff --check`.
- Manual editor smoke test: scene load, no auto-selection, click-vs-drag selection, transform controls, undo/redo, save/autosave, add/delete object, 2D/3D switch, first-person/avatar controls, compile settings persistence, scene JSON reload.
