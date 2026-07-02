# VRodos Modernization And Regression Plan

Date: 2026-06-30
Status: In progress
Last updated: 2026-07-02

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
| Compiler fixture matrix | Done for v1 local fixtures | Codex | Script-planner and DOM-transformer fixtures now cover headset no-postFX, Takram without composer, stereo PMNDRS opt-in, spatial UI vs video direct playback, collision BVH inclusion/removal, and single-player network pruning. |
| Runtime feature-state smoke checks | Done for v1 local/browser matrix | Codex | Added local smoke coverage for desktop PMNDRS, headset no-postFX, headset stereo PMNDRS, headset Takram without composer, headset shadow cap, and spatial UI diagnostics. Added `smoke:browser-feature-state`, `smoke:browser-feature-state:matrix`, and `check:browser-feature-state`; the default four-case generated-client browser matrix passed. |
| Quest diagnostic smoke path | Checklist added | Codex + tester | Added the repeatable capture path and required recorded values below. Next headset pass should attach one capture summary to the headset roadmap. |
| First runtime policy extraction | Done | Codex | Extracted high-risk runtime profile and headset post-FX policy into `assets/js/runtime/master/vrodos_runtime_profile_policy.js`. |
| Render/shadow budget policy extraction | Done | Codex | Extracted render quality normalization, headset shadow caps, AA targets, contact-shadow presets, and VR budget override selection into `assets/js/runtime/master/vrodos_runtime_render_policy.js`. |
| Change-location guide | Done for v1 | Codex | Added scripts inventory plus file-level guidance for compiler settings, lazy chunks, runtime policy, rendering/shadows, spatial UI, navigation/collision, networking, generated bundles, and package/vendor updates. |
| R3F feasibility spike | Deferred | Codex + tester | Revisit only after v1 guardrails exist. Must be isolated from the current A-Frame runtime. |

## Resume State After Shadow Interruption

The worktree was clean when this plan was resumed on 2026-07-02. The latest visible commits were:

- `2f8a4d3b` - fixed the PCF shadow warnings from runtime helper lights.
- `d949467d` - extracted render budget policy.
- `54057258` - extracted runtime profile policy guardrails.
- `71352e5b` - added regression guardrails for headset render policy.

The shadow issue that interrupted the modernization pass is no longer blocking this plan. The next modernization work should continue from the remaining guardrail tasks, not reopen the shadow fix unless a new regression appears.

Immediate next work:

- Run one Quest diagnostic smoke capture after the next headset validation and paste the recorded summary into `documentation/compiled-headset-roadmap.md`.
- Add more generated-client browser matrix cases only when a new representative compiled scene exists, such as headset stereo PMNDRS or networked runtime.
- Only extract another runtime policy module when the next risky change needs it; likely candidates are atmosphere/Takram enablement, spatial UI feature loading, or navigation/collision policy.

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

## Browser/CDP Smoke Target

The local VM smoke tests assert pure policy and `window.VRODOS_RUNTIME_FEATURE_STATE` assembly, but they do not prove the generated browser client publishes the same state after A-Frame boots.

Before treating the runtime smoke row as complete, add a browser capture pass for one freshly compiled representative Master client:

```powershell
npm run smoke:browser-feature-state -- --client Master_Client_RECOMPILED.html --expect-presentation inline --expect-profile desktop --expect-postfx-requested true --expect-postfx-allowed true --expect-navigation-mode walkable
```

For targeted captures against an already running local server, the equivalent lower-level flow is:

```powershell
node scripts\profile-master-client.mjs http://wp.local:5832/Master_Client_RECOMPILED.html --disable-fps-meter --frames 120 --warmup-ms 3000 --trace-ms 0 --output C:\tmp\vrodos-browser-feature-state.json
npm run check:browser-feature-state -- --input C:\tmp\vrodos-browser-feature-state.json --expect-presentation inline --expect-profile desktop --expect-navigation-mode walkable
```

The capture should assert or manually record:

- `runtimeFeatureState.presentation.mode` is `inline` for desktop/browser capture.
- `runtimeFeatureState.vrProfile.profile` matches the compiled target.
- `runtimeFeatureState.postProcessing.owner`, `requested`, and `allowed` match the selected profile.
- `runtimeFeatureState.renderer.vrRenderBudget` is present for headset/VR profiles and absent or inactive for desktop.
- `runtimeFeatureState.shadows.effectiveQuality` and shadow caps match policy.
- `runtimeFeatureState.navigation` reports the expected navigation mode and collision target counts for walkable fixtures.
- `runtimeFeatureState.spatialUi.bundleLoaded` is true only when assessment, CEFR, or image/text POI content requests spatial UI.

This does not replace Quest validation. It closes the gap between pure unit smoke and a generated browser page. Use stricter `check:browser-feature-state` expectations, such as `--expect-postfx-owner`, `--expect-spatial-ui`, `--min-navmesh-targets`, `--max-console-errors`, `--max-network-failures`, and `--max-exceptions`, when the selected fixture supports them.

First captured browser pass:

- 2026-07-02: `npm run smoke:browser-feature-state` passed against `runtime/build/Master_Client_8747.html` through the temporary static server.
- Validated `presentation.mode=inline`, `vrProfile.profile=desktop`, `postProcessing.owner=pmndrs`, `navigation.navigationMode=walkable`, `navigation.collisionActive=true`, `navigation.navMeshTargets=7`, `spatialUi.bundleLoaded=false`, `networkFailures=0`, `exceptions=0`, and console error/assert count `0`.
- One console warning was present: `[VRodos] Compile performance diagnostics Object`. This is expected diagnostic noise, not a runtime failure.

Default matrix pass:

- 2026-07-02: `npm run smoke:browser-feature-state:matrix -- --frames 45 --warmup-ms 2500 --trace-ms 0 --timeout-ms 45000` passed four generated-client cases.
- `desktop-pmndrs-walkable`: `Master_Client_8747.html`, PMNDRS owner, walkable navigation, 7 navmesh targets, spatial UI not loaded.
- `desktop-no-postfx-walkable`: `Master_Client_8713.html`, direct owner, no post-FX request, walkable navigation, 14 navmesh targets, spatial UI not loaded.
- `desktop-spatial-ui`: `Master_Client_8606.html`, spatial UI bundle loaded, walkable navigation, 1 navmesh target.
- `headset-walkable-spatial`: `Master_Client_8980.html`, headset profile, direct owner, spatial UI bundle loaded, walkable navigation, 1 navmesh target.
- All four captures had `presentation.mode=inline`, `networkFailures=0`, `exceptions=0`, and console error/assert count `0`. Console warnings were only diagnostic warnings.

## Quest Diagnostic Smoke Path

Run this path before and after changes that touch headset locomotion, navigation/collision, controller rays, spatial UI pointer behavior, headset render budget, shadows, PMNDRS/Takram policy, or WebXR enter/exit behavior. Also run it after any change that claims to fix a headset-only rendering or interaction regression.

Preflight:

1. Run `npm run check:runtime` locally, or at least the targeted runtime/compiler tests when the full gate is too expensive.
2. Rebuild runtime bundles if runtime source changed.
3. Recompile a representative Master client so generated script tags receive the planner cache-busting query.
4. Use a direct Quest-reachable URL. Prefer `localhost:5832` through ADB reverse, not `wp.local`.
5. Load the scene with `vrodos_debug_runtime_features=1` and `vrodos_debug_immersive_smoothness=1`, then enter immersive VR before capture.

Capture:

```powershell
node scripts\capture-quest-immersive-diagnostics.mjs --list-targets
node scripts\capture-quest-immersive-diagnostics.mjs --duration-ms 30000 --target-url Master_Client_RECOMPILED.html --output C:\tmp\vrodos-quest-immersive-diagnostics.json
```

Record these values in the relevant roadmap or handoff note:

- Date, Git commit, compiled client filename, scene/project name, and runtime bundle rebuild date.
- Quest Browser version, versionCode, and lastUpdateTime from ADB.
- URL query flags used for the pass.
- `runtimeFeatureState.presentation.mode`, `vrProfile.profile`, `vrProfile.headset`, `vrProfile.pmndrsComposer`, and `postProcessing.owner`.
- Takram/cloud/reflection diagnostics relevant to the tested scene.
- `renderer.vrRenderBudget`, framebuffer scale, foveation, and applied antialiasing budget.
- Shadow diagnostics, especially directional and point/spot caps.
- Navigation/collision diagnostics: navigation mode, transformed authored-world root count, collision target count, blocker ray count, and whether `#vrodos-authored-world` remains the movement owner.
- Spatial UI diagnostics: bundle loaded, active panel state, controller ray clamp/restore behavior, and any fail-closed reason.
- Smoothness samples: frame time distribution, shadow dirty count, repeated diagnostic/log noise, and any visible hitch during yaw plus movement.
- Manual acceptance notes for HMD tracking, controller tracking, controller rays, thumbstick movement, yaw, walkable collision, video direct play/pause, POI, CEFR, assessment, scene ray feedback, and immersive exit recovery.

Do not mark headset behavior accepted from desktop WebXR emulator evidence alone.

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

## Change-Location Guide

Use this map before editing runtime behavior. It should keep changes near the owner that already exists instead of spreading compatibility branches through generated templates.

| Change type | Start here | Required checks |
| --- | --- | --- |
| Compile settings, `scene-settings`, renderer/shadow root attributes | `includes/class-vrodos-compiler-scene-settings.php`, `includes/class-vrodos-compiler-runtime-feature-flags.php`, `assets/runtime-settings-contract.json` | `npm run test:compiler`, `npm run test:runtime`, PHP syntax for edited PHP |
| Runtime chunk selection and lazy bundle dependencies | `includes/class-vrodos-compiler-runtime-script-planner.php`, `includes/class-vrodos-compiler-runtime-manifest.php`, `assets/runtime-build-manifest.json`, `scripts/build-runtime-master-bundles.mjs` | `npm run test:compiler`, `npm run build:runtime`, `git diff --check` |
| Generated client assembly, single-player/network pruning, template placeholders | `includes/class-vrodos-compiler-runtime-page-builder.php`, `includes/class-vrodos-compiler-runtime-dom-transformer.php`, `templates/runtime/aframe/` | `npm run test:compiler`, PHP syntax for edited PHP |
| Runtime profile, headset composer gates, HDR fallback, profile defaults | `assets/js/runtime/master/vrodos_runtime_profile_policy.js`, then apply through `assets/js/runtime/master/components/vrodos_scene_settings.component.js` | `npm run test:runtime`, `node --check` for edited JS, Quest validation for headset behavior |
| Render quality, AA, shadow caps, contact-shadow presets, VR budget overrides | `assets/js/runtime/master/vrodos_runtime_render_policy.js`, `assets/js/runtime/master/vrodos_quality_profiles.js`, `assets/js/runtime/master/vrodos_master_rendering.js`, `RENDERING_PIPELINE.md` | `npm run test:runtime`, `scripts/capture-quest-immersive-diagnostics.mjs` for headset changes |
| PMNDRS/Takram runtime behavior | `assets/js/runtime/master/vrodos_postprocessing_pmndrs.js`, `assets/js/runtime/master/vrodos_takram_*.js`, `assets/js/runtime/master/components/vrodos_scene_settings.component.js` | `npm run test:runtime`, `npm run build:runtime`, browser/CDP smoke, Quest validation for headset-visible behavior |
| Spatial UI panels, CEFR, assessment, image/text POI, controller pointer behavior | `assets/js/runtime/spatial-ui/vrodos_spatial_ui.js`, `assets/js/runtime/assessment/`, `assets/js/runtime/components/`, `documentation/vrodos-compiled-scene-framework-integration.md` | `npm run test:runtime`, `npm run build:runtime`, Quest validation for immersive panels |
| Video direct play/pause behavior | `assets/js/runtime/components/video_component.js` and related compile metadata only if needed | `npm run test:runtime`, compiler script-planner fixture for no spatial UI, Quest retest if immersive behavior changes |
| Navigation, walkable collision, authored-world movement ownership | `assets/js/runtime/master/components/vrodos_navigation.component.js`, `includes/class-vrodos-compiler-aframe-entity-renderer.php`, `assets/js/runtime/master/lib/vrodos-collision-bvh.bundle.js` source path through the runtime build | `npm run test:runtime`, `node scripts\profile-master-client.mjs URL --nav-profile`, Quest diagnostics for headset movement |
| Single-player/networked runtime behavior | `includes/class-vrodos-compiler-manager.php`, `includes/class-vrodos-compiler-runtime-dom-transformer.php`, `assets/js/runtime/master/networked/` | `npm run test:compiler`, networked manual smoke when release-relevant |
| Runtime generated bundles | Edit source under `assets/js/runtime/`, then run `npm run build:runtime`; generated files live under `assets/js/runtime/master/lib/` | Commit generated bundle changes only when intentional |
| Three/A-Frame/vendor package updates | Root `package.json`, `package-lock.json`, `scripts/build-three-vendor.mjs`, `scripts/three-vendor.config.mjs` | `npm run build:three`, `npm run build:runtime`, targeted browser/headset validation |

Do not edit `runtime/build/` HTML as source. Recompile generated scenes after runtime changes instead.

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

### 2026-07-01

- Extracted runtime profile normalization, capability gates, headset PMNDRS composer policy, HDR fallback selection, and render-profile defaults from `scene-settings` into `vrodos_runtime_profile_policy.js`.
- Wired the policy module into the core runtime bundle before A-Frame components load.
- Added direct policy assertions to `scripts/test-runtime-feature-state.mjs` so legacy headset profile aliases and PC-rendered VR defaults are covered locally.
- Extracted render quality, effective shadow quality, AA sample/scale, contact-shadow, and VR budget override policy from `scene-settings` into `vrodos_runtime_render_policy.js`.
- Added direct render-policy assertions for headset shadow caps, AA samples, contact-shadow presets, and framebuffer-scale override clamping.

### 2026-07-02

- Resumed the modernization plan after the separate PCF shadow-warning fix landed.
- Reconciled the progress tracker with the committed compiler script-planner and DOM-transformer fixtures.
- Added the browser/CDP feature-state smoke target that remains open for the next generated-client capture.
- Added a Quest diagnostic smoke path with required runtime feature-state, smoothness, browser-version, and manual acceptance fields.
- Added the v1 change-location guide for compiler settings, lazy chunks, runtime policy, rendering/shadows, spatial UI, video, navigation/collision, networking, generated bundles, and package/vendor updates.
- Added `scripts/check-profile-feature-state.mjs`, `npm run check:browser-feature-state`, and a runtime harness test so browser/CDP captures can fail the same core `runtimeFeatureState` fields checked in the plan.
- Added `scripts/run-browser-feature-state-smoke.mjs` and `npm run smoke:browser-feature-state` to start a temporary static server, run the CDP profile capture, validate the resulting feature-state JSON, and shut the server down.
- Ran the first browser/CDP smoke against `Master_Client_8747.html`; stricter validation passed for desktop PMNDRS ownership, walkable navigation, active collision, 7 navmesh targets, no spatial UI bundle, no network failures, no exceptions, and no console errors/asserts.
- Added `scripts/run-browser-feature-state-smoke-matrix.mjs` and `npm run smoke:browser-feature-state:matrix` to auto-discover generated clients for desktop PMNDRS/walkable, desktop no-postFX/walkable, desktop spatial UI, and headset-profile spatial UI browser smoke cases.
- Ran the default four-case browser/CDP matrix successfully; all cases published the expected `runtimeFeatureState` shape with no network failures, no exceptions, and no console errors/asserts.
