# VRodos VR Runtime Fluff Cleanup Plan

Date: 2026-06-23

## Summary

The immediate goal is to remove stale fallbacks, hidden experiment profiles, and unnecessary per-frame work from compiled standalone VR. This does not cancel future headset rendering parity work. Desktop-grade headset features should return later as explicit, isolated integrations with Quest/headset validation.

Supported parent profiles:

- `desktop`: full desktop/browser rendering.
- `headset`: standalone headset rendering; lean by default now, expandable later through validated feature gates.
- `pc-rendered-vr`: PCVR/WebXR path from `PC_RENDERED_VR_PLAN.md`, parked until real PCVR hardware/runtime validation.

## Phase Checklist

- [x] Phase 0: Root plan and Markdown cleanup
  - [x] Add this root checklist.
  - [x] Keep root docs focused on current references.
  - [x] Move historical root docs to `documentation/archive/rendering-history/`.
  - [x] Update links after the move.
- [x] Phase 1: Runtime profile cleanup
  - [x] Replace runtime profile enum/normalization with `desktop`, `headset`, and `pc-rendered-vr`.
  - [x] Normalize old hidden profile metadata to `headset`.
  - [x] Remove normal runtime support for hidden profile branches.
  - [x] Keep future headset features documented as explicit integration work.
- [x] Phase 2: Movement and controller cleanup
  - [x] Treat `#vrodos-authored-world` as mandatory for compiled scenes.
  - [x] Cache or debug-gate immersive root/collision diagnostics.
  - [x] Make controller ray visual setup state-driven.
  - [x] Apply controller/overlay shadow suppression on readiness/model/panel events.
  - [x] Stop compiling old HUD/avatar movement scaffolding into single-player headset scenes.
- [x] Phase 3: Shadows, sun, and lighting budget
  - [x] Cap standalone headset directional shadows at `1024`.
  - [x] Cap standalone headset point/spot shadows at `512`.
  - [x] Allow desktop and `pc-rendered-vr` to keep higher budgets.
  - [x] Reduce headset adaptive shadow fitting to targeted events.
  - [x] Remove headset `a-sun-sky` legacy output.
- [x] Phase 4: Collision cleanup
  - [x] Make the editor collision toggle the compiled source of truth.
  - [x] Treat missing or false `compiledCollisionEnabled` as no compiled collision.
  - [x] Remove `blocking-obstacles` as a runtime category.
  - [x] Add a smaller headset collision ray budget.
  - [x] Require BVH for headset walkable scenes.
- [x] Phase 5: Runtime component and chunk pruning
  - [x] Make compiled runtime components target-aware.
  - [x] Avoid attaching post-FX, scene-probe, cloud, or heavy reflection tick paths when the profile forbids them.
  - [x] Keep lazy chunk planning strict.
  - [x] Keep spatial UI behavior unchanged.

## Findings Log

- `show-position` and `entity-movement-emitter` are legacy single-player runtime scaffolding and should not be attached to lean headset output.
- Immersive world root diagnostics can be reached from movement/yaw transform paths and should not run as a normal per-frame DOM scan.
- Standalone headset currently can inherit desktop-scale shadow maps; this pass caps those maps independently of authored desktop quality.
- Hidden VR profiles were useful for staged validation, but they should not remain product/runtime branches now that older scenes are expected to be recompiled.
- Compile UI now exposes the three parent targets: `Desktop`, `VR Headset Full`, and `VR Headset - PC Rendered`.
- Old hidden profile metadata is still accepted only as input compatibility and normalizes to `headset`.
- Headset collision now uses fewer blocker rays than desktop and fails closed without BVH instead of silently falling back to slower raw mesh raycasts.
- Editor/export now writes explicit `compiledCollisionEnabled` booleans; missing values compile as non-colliding.
- Runtime component attachment is profile-aware so standalone headset does not attach the post-FX router and only keeps atmosphere/reflection components when the allowed authored settings can use them.
- Recompiled headset scene `8980` still inherited `aframeFPSMeterEnabled` and pulled the remote `stats-gl` module into normal runtime output; standalone `headset` now suppresses the compiled FPS meter while `desktop` and `pc-rendered-vr` keep the author toggle.
- `aframe-extras` survived in single-player headset output without generated components using it; lean headset compiles now remove it. `aframe-environment-component` is also removed for Takram/solid/custom/ocean headset backgrounds, but preserved when a legacy A-Frame preset background still needs it.

## Completed Implementation Pass

- 2026-06-23: Implemented profile cleanup, compile target UI, movement/controller throttling, headset shadow caps, collision source-of-truth cleanup, runtime component pruning, and root documentation archive cleanup.
- 2026-06-23: Historical root docs moved to `documentation/archive/rendering-history/`; root Markdown now keeps current references only.
- 2026-06-23: Fixed headset dynamic-shadow yaw regression by restoring same-frame presented shadow-light transform sync while keeping adaptive shadow fitting event-driven.
- 2026-06-23: Started runtime inclusion audit; suppressed inherited FPS meter chunk/settings for standalone headset output.
- 2026-06-23: Pruned unused prototype CDN scripts from lean single-player headset output while preserving legacy environment backgrounds.
- 2026-06-23: Device/headset validation remains pending after runtime rebuild and representative scene recompiles.

## Verification Notes

- [x] `node --check` passed for edited JS source files.
- [x] PHP syntax checks passed for edited PHP/template files.
- [x] `assets/runtime-settings-contract.json` parsed successfully.
- [x] `npm.cmd run build:runtime` completed successfully.
- [x] `node --check` passed for rebuilt runtime bundles touched by this pass.
- [x] `git diff --check` passed.
- [x] Runtime script planner fixture covers FPS meter suppression for standalone headset.
- [x] Runtime DOM transformer fixture covers lean headset CDN script pruning and legacy environment preservation.
- [x] `node .\scripts\run-compiler-runtime-tests.mjs` passed after runtime inclusion audit changes.
- [ ] Recompile representative `desktop`, `headset`, and `pc-rendered-vr` scenes.
- [ ] Validate Quest/headset movement, yaw, collision, direct video clicks, POI, CEFR, assessment, scene ray feedback, headset shadow caps, and absence of repeated movement-frame root diagnostics.
