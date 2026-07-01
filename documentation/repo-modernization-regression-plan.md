# VRodos Modernization And Regression Plan

Date: 2026-06-30
Status: In progress

This document tracks the v1 strategy for making VRodos easier to change without repeatedly rediscovering regressions through manual headset testing.

The goal is not to add process for its own sake. The goal is to make the current A-Frame compiled runtime safer and simpler before considering a larger React Three Fiber or alternate runtime migration.

## Why This Exists

Small feature work currently crosses too many runtime boundaries:

- WordPress scene metadata and compiler defaults.
- `scene-settings` serialization and runtime normalization.
- Runtime chunk selection through `assets/runtime-build-manifest.json`.
- A-Frame scene, camera, controller, navigation, and WebXR ownership.
- PMNDRS/Takram rendering behavior.
- Spatial UI, media, assessment, and CEFR interaction paths.
- Quest Browser behavior that is hard to reproduce on desktop.

This makes the headset the first reliable regression detector. That is too late. The v1 plan moves common failures into repeatable local checks and then uses those checks as a safety net while extracting small, testable policy modules from the largest runtime files.

## Current Diagnosis

The repo already has useful foundations:

- Runtime settings source of truth: `assets/runtime-settings-contract.json`.
- Runtime chunk source of truth: `assets/runtime-build-manifest.json`.
- Focused runtime docs: `RENDERING_PIPELINE.md`, `documentation/compiled-headset-roadmap.md`, `documentation/vrodos-compiled-scene-framework-integration.md`, and `VR_HEADSET_RUNTIME_HANDOFF.md`.
- Existing regression scripts: `npm run test:runtime` and `npm run test:compiler`.
- Profiling and diagnostics scripts: `scripts/profile-master-client.mjs` and `scripts/capture-quest-immersive-diagnostics.mjs`.

The pain points are:

- Test coverage is narrow and mostly catches previously isolated bugs.
- The important profile matrix is not covered by compiler/runtime fixtures.
- Large runtime files mix policy decisions, runtime application, compatibility behavior, diagnostics, and headset exceptions.
- Generated runtime bundles can drift from source changes unless every runtime change follows a consistent build/check path.
- Manual Quest testing is still required, but it should validate final behavior rather than discover basic policy regressions.

## V1 Strategy

Keep the current compiled A-Frame runtime as the supported production path.

Do not migrate to React Three Fiber in v1. R3F may be evaluated later as a separate runtime spike, but it should not be introduced into the current compiled runtime until the existing contracts are protected by tests.

V1 has three practical goals:

1. Add a single repeatable runtime check command.
2. Add fixtures that freeze accepted compiler and runtime policy behavior.
3. Extract small pure policy modules only where the code is actively changing.

The implementation rule is:

> Every risky runtime change must either fit an existing tested policy module, or extract one small policy module first.

## Progress Tracker

| Area | Status | Owner | Notes |
| --- | --- | --- | --- |
| Aggregate runtime check command | Done | Codex | Added `npm run check:runtime` and `npm run check:syntax`. The aggregate gate runs lint, syntax checks, runtime tests, compiler tests, runtime build, and whitespace checks. |
| Compiler fixture matrix | In progress | Codex | First pass added headset no-postFX, headset Takram without composer, headset stereo PMNDRS post-FX, and headset stereo PMNDRS with Takram assertions. |
| Runtime feature-state smoke checks | In progress | Codex | Added local smoke coverage for desktop PMNDRS, headset no-postFX, headset stereo PMNDRS, headset Takram without composer, headset shadow cap, and spatial UI diagnostics. Browser/CDP fixture capture remains next. |
| Quest diagnostic smoke path | Not started | Codex + tester | Formalize when to run `scripts/capture-quest-immersive-diagnostics.mjs` and what values must be recorded. |
| First runtime policy extraction | Not started | Codex | Start with high-risk headset render/post-FX policy, then shadow budget and atmosphere policy if needed. |
| Change-location guide | In progress | Codex | Added initial scripts inventory. Still needs file-level guidance for compiler settings, runtime policy, spatial UI, headset rendering, navigation, and generated bundles. |
| R3F feasibility spike | Deferred | Codex + tester | Revisit only after v1 guardrails exist. Must be isolated from the current A-Frame runtime. |

## V1 Definition Of Done

V1 is complete when the following are true:

- A single command exists for normal runtime validation.
- The command is documented and safe to run before headset testing.
- Compiler fixtures assert the expected script chunks, profile flags, and key scene attributes for the major supported modes.
- Browser/runtime smoke checks assert `window.VRODOS_RUNTIME_FEATURE_STATE` for the important profile owners and budgets.
- Quest validation has a written checklist that records browser version, runtime date, feature-state diagnostics, and manual acceptance notes.
- At least one high-risk runtime policy has been extracted from a large compatibility file into a small tested policy module.
- New headset rendering experiments are behind explicit opt-in flags until accepted on Quest-class hardware.

## Initial Check Command Target

The v1 aggregate command should be equivalent to:

```powershell
npm run lint
npm run check:syntax
npm run test:runtime
npm run test:compiler
npm run build:runtime
git diff --check
```

Targeted `node --check` and PHP syntax checks should be added for edited files where practical. The command should avoid CSS builds unless CSS source changed.

## Fixture Matrix Target

The first fixture pass should cover behavior, not screenshots:

| Fixture | Must Assert |
| --- | --- |
| Desktop PMNDRS/Takram | PMNDRS post-FX chunk, Takram atmosphere chunk, desktop profile policy, expected pipeline components. |
| Desktop legacy/no-postFX | No PMNDRS/Takram chunks unless explicitly required, legacy policy remains isolated. |
| Headset no-postFX | No PMNDRS composer ownership, stable A-Frame/WebXR ownership, headset shadow caps, no accidental scene-probe/cloud enablement. |
| Headset stereo PMNDRS post-FX | Explicit opt-in flag, stereo post-FX chunks, no fallback into default headset no-postFX behavior. |
| Spatial UI | CEFR, assessment, and image/text POI request spatial UI; plain video does not request a dialog path. |
| Video direct play | Immersive video trigger keeps direct play/pause and does not open spatial or legacy dialogs. |
| Navigation/collision | Walkable mode selects BVH collision and headset movement ownership stays on `#vrodos-authored-world`. |
| Single-player/networked | Networked chunks and attributes are removed from single-player output and retained only for networked runtime. |

## Scripts Inventory

The `scripts/` folder should stay, but it needs clear ownership. Current scripts fall into these buckets:

| Bucket | Scripts | Keep Why |
| --- | --- | --- |
| Runtime build source of truth | `build-runtime-master-bundles.mjs` | Builds generated runtime bundles, the generated settings-contract browser script, spatial UI worker assets, and `assets/runtime-build-manifest.json`. |
| Vendor build source of truth | `build-three-vendor.mjs`, `three-vendor.config.mjs`, `build-networked-aframe-vendor.mjs` | Generates the locked Three/A-Frame-adjacent vendor outputs and patched Networked-Aframe vendor files. |
| Regression tests | `run-compiler-runtime-tests.mjs`, `test-compiler-runtime-script-planner.php`, `test-compiler-runtime-dom-transformer.php`, `test-navigation-math.mjs`, `test-assessment-runtime.mjs`, `test-xr-exit-handoff.mjs` | These are the current automated regression baseline and should be extended before risky runtime changes. |
| Validation checks | `check-runtime-syntax.mjs` | Fast syntax coverage for classic runtime/editor/script files that are not generated bundles. |
| Browser profiling and diagnostics | `profile-master-client.mjs`, `capture-quest-immersive-diagnostics.mjs`, `start-vr-adb.ps1` | Captures desktop/CDP profiling, Quest Browser runtime diagnostics, and ADB setup for headset validation. |
| Asset optimization tooling | `audit-master-client-assets.mjs`, `prototype-optimize-master-client-assets.mjs` | Supports GLB audit, derivative experiments, and admin/backend asset-optimization decisions. |
| Size and smoke utilities | `report-css-size.mjs`, `build-phase0-smoke.mjs` | `report-css-size.mjs` is a small CSS reporting helper. `build-phase0-smoke.mjs` appears to be a rare Three/vendor migration smoke utility and should be documented before any cleanup decision. |

Cleanup rule: do not delete scripts just because they are not daily-use. First classify them, make sure any retained rare script has a one-line purpose, and only then remove scripts that are obsolete and unreferenced by package commands, docs, or current diagnostics.

## Policy Extraction Target

Policy modules should be small and pure where possible. They should accept normalized inputs and return decisions. A-Frame components should apply those decisions.

Candidate modules:

- Headset render/post-FX policy.
- Shadow budget policy.
- Atmosphere/Takram enablement policy.
- Spatial UI feature loading policy.
- Navigation/collision profile policy.

Do not refactor large files just for aesthetics. Extract only when a behavior is risky, actively changing, or needed by the fixture matrix.

## React Three Fiber Position

React Three Fiber is not rejected, but it is deferred.

R3F should be evaluated only as a separate v2 runtime spike after v1 guardrails exist. The spike must prove:

- One shared Three runtime, not a second conflicting Three instance.
- One WebXR session owner.
- Equal or better Quest stability.
- Clean compiler integration.
- Working movement, controller rays, spatial UI, video, assessment, atmosphere, and shadows on a representative scene.
- A smaller regression surface than the current A-Frame runtime.

Without those proofs, R3F risks becoming the same spaghetti in a different framework.

## Update Rules

- Keep this document current as implementation progresses.
- Change tracker statuses when work starts or completes.
- Add accepted behavior only after it has passed the relevant local checks and, for headset-specific behavior, Quest validation.
- Keep historical detail in existing roadmap/archive docs; this file should remain the active implementation tracker.

## Implementation Log

### 2026-06-30

- Added `npm run check:syntax` for non-generated runtime/editor/script syntax checks.
- Added `npm run check:runtime` as the aggregate local validation gate.
- Extended compiler runtime script-planner fixtures with headset PMNDRS policy assertions.
- Added `scripts/test-runtime-feature-state.mjs` and wired it into `npm run test:runtime`.
- Added runtime feature-state assertions for desktop PMNDRS, headset no-postFX, headset stereo PMNDRS, headset Takram without composer, headset shadow cap, and spatial UI bundle diagnostics.
- Verified syntax checks, runtime tests, compiler tests, and runtime bundle build locally.
