# Rendering Migration Implementation Log

## Goal

Track the staged rendering migration work so each phase is small, reviewable, and reversible.

This log is append-oriented. Older phase entries remain for historical context even when later phases supersede their temporary migration scaffolding.

The current top-level order is:

1. Keep runtime package versions synchronized through root `package.json`, `package-lock.json`, and `assets/runtime-version-manifest.json`
2. Maintain the current A-Frame master + Three r181 baseline
3. Re-baseline legacy and PMNDRS behavior on that stack as needed
4. Resume Takram-first Horizon/light-source work
5. Add clouds only after the new baseline is stable

## Phase 1

### Status

- Complete

### Intent

- Consolidate overlapping rendering plans into one canonical plan file.
- Preserve a lightweight implementation journal for phase-by-phase work.

### Applied Changes

- Merged the standalone Takram Horizon planning into `POSTPROCESSING_MIGRATION_PLAN.md`.
- Removed redundant standalone rendering-plan markdown files that were no longer the source of truth.

### Validation

- Manual reference sweep after doc consolidation.
- Result: canonical plan is `POSTPROCESSING_MIGRATION_PLAN.md`.

## Phase 2

### Status

- Complete

### Intent

- Keep the Takram Horizon work structurally isolated while remaining on the r173 base.

### Applied Changes

- Added a richer PMNDRS Horizon/Takram runtime state container in `assets/js/runtime/master/vrodos_quality_profiles.js`.
- Recorded explicit ownership-intent flags so later Takram light-source swaps can land behind one state object.

### Validation

- `eslint` on `assets/js/runtime/master/vrodos_quality_profiles.js`
- Result: pass

## Phase 3

### Status

- Complete

### Intent

- Start the new r181 foundation work with a safe, no-behavior-change cleanup.
- Remove the worst hardcoded `threejs173` fallback paths from editor/runtime helpers so later version switches do not require string-hunting across the codebase.

### Applied Changes

- Introduced a version-neutral vendor-base global in the asset-manager inline bootstrap.
- Routed editor font and asset-viewer Draco fallback paths through that version-neutral base instead of hardcoded `threejs173` literals.
- Updated the canonical migration plan with the new Foundation 0 phase based on the Three migration guide and repo audit.

### Validation

- `eslint` on touched JS files after the phase is applied.
- Result: pass on `js_libs/vrodos_3d_editor_environmentals.js` and `js_libs/vrodos_AssetViewer_3D_kernel.js`

## Next Phase

- Upgrade the local Three vendor build from r173 to r181 on a dedicated migration slice.
- Keep A-Frame pinned to stable in production code until the r181 spike is ready for a controlled switch.

## Phase 5

### Status

- Complete

### Intent

- Flip the active local Three vendor build from r173 to r181 while keeping the compiled A-Frame clients on stable for the moment.
- Use the rebuild result to identify the first concrete compatibility breaks.

### Applied Changes

- Installed `three@0.181.0`.
- Switched the active vendor config, asset-manager bundle path, and editor/runtime fallback defaults from `threejs173` to the refactored `assets/vendor/three-r181` target.

### Validation

- Rebuild the vendor bundle on r181.
- Fix the first round of build-time compatibility issues that surface.
- Result:
  - `three@0.181.0` installed successfully
  - `node scripts/build-three-vendor.mjs` passed and emitted `assets/vendor/three-r181/vrodos-three-r181.bundle.js`
  - no first-pass build-time compatibility break blocked the vendor rebuild

## Phase 6

### Status

- Complete

### Intent

- Add a controlled compiled-client switch for the pinned A-Frame master spike without changing the default production runtime yet.
- Keep the A-Frame source decision centralized enough that the compiled shells no longer hardcode the stable CDN URL.

### Applied Changes

- Replaced the hardcoded A-Frame script URL in both compiled-client prototypes with `AFRAME_RUNTIME_URL_PLACEHOLDER`.
- Added compiler-manager helpers that choose between the stable and pinned master A-Frame URLs.
- Defaulted the compiler to the stable A-Frame URL, while exposing a safe migration switch via:
  - `VRODOS_USE_AFRAME_MASTER_SPIKE`
  - `vrodos_use_aframe_master_spike`
  - `vrodos_compiled_aframe_runtime_url`

### Validation

- PHP syntax check on `includes/class-vrodos-compiler-manager.php`
- Manual prototype/compiler sweep to confirm both Master and Simple compiled clients now share the same runtime URL decision path.

## Phase 7

### Status

- Complete

### Intent

- Move the dedicated PMNDRS smoke harness onto the same pinned A-Frame master target as the r181 migration plan.
- Keep production defaults untouched while making the validation page reflect the actual migration destination.

### Applied Changes

- Updated `phase0-pmndrs-smoke-test.html` to load the pinned A-Frame master commit (`96cc74fa7a4640f394a78985a637a788daf56186`) instead of the stable 1.7.1 CDN build.

### Validation

- Manual source sweep confirmed the remaining source-level hardcoded A-Frame runtime is now intentional:
  - compiler-managed stable/master URLs in `class-vrodos-compiler-manager.php`
  - the dedicated smoke harness pinned to the master spike target
- Existing `runtime/build/*.html` hits are treated as generated artifacts from earlier compiles, not source-of-truth templates.

## Phase 8

### Status

- Complete

### Intent

- Replace the scattered render-library switches with one runtime profile entry point that both compiled clients and plugin runtime code can read.
- Make the user-facing switch a single profile value instead of a chain of constants and implicit defaults.

### Applied Changes

- Added `includes/class-vrodos-render-runtime-manager.php` as the new source of truth for runtime-library selection.
- Introduced the single profile switch `VRODOS_RENDER_RUNTIME_PROFILE`, with `stable` and `master-r181` profiles.
- Moved A-Frame runtime URL selection into that manager and made `class-vrodos-compiler-manager.php` consume it.
- Moved active Three vendor directory/bundle selection into that manager and made `class-vrodos-asset-manager.php` consume it.
- Exposed the chosen runtime config to JS through `window.vrodos_render_runtime`.
- Kept the older `VRODOS_USE_AFRAME_MASTER_SPIKE` / filter hooks working as compatibility shims during the migration.

### Validation

- PHP syntax checks on the new runtime manager, the asset manager, and the compiler manager.
- Manual source sweep confirmed the live source-of-truth URLs now come from the runtime manager instead of duplicated hardcoded template values.

## Phase 9

### Status

- Complete

### Intent

- Remove the migration-time runtime switching logic and keep one explicit active library stack.
- Make it obvious where to change the pinned A-Frame URL and matching Three bundle in the future.

### Applied Changes

- Simplified `includes/class-vrodos-render-runtime-manager.php` into a plain pinned runtime config file.
- Removed the stable/master profile logic, compatibility shims, and filter-based fallback paths from that manager.
- Removed the unused `vrodos_three_r173_bundle` alias from `includes/class-vrodos-asset-manager.php`.

### Validation

- PHP syntax checks on:
  - `includes/class-vrodos-render-runtime-manager.php`
  - `includes/class-vrodos-asset-manager.php`
  - `includes/class-vrodos-compiler-manager.php`
- Source sweep confirmed the live runtime pair now comes from one source file.

## Phase 10

### Status

- Complete

### Intent

- Remove the obsolete Three r173 assets and wrapper files now that the pinned r181 stack is proven to compile and run.
- Update current-facing code comments and readme text so the repo stops describing the old runtime as active.

### Applied Changes

- Deleted `js_libs/threejs173/`.
- Deleted `scripts/build-three-r173.mjs`.
- Updated current-facing stack references in:
  - `README.md`
  - `scripts/build-phase0-smoke.mjs`
  - `phase0-pmndrs-smoke-test.html`
  - `assets/js/runtime/master/vrodos_postprocessing.js`
  - `assets/js/runtime/master/vrodos_postprocessing_pmndrs.js`
  - `assets/js/runtime/master/vrodos_quality_profiles.js`

### Validation

- Source sweep confirmed the live tree no longer contains:
  - `js_libs/threejs173`
  - `scripts/build-three-r173.mjs`
- Remaining `r173` mentions are now historical documentation/debug notes rather than active runtime files.

## Phase 11

### Status

- Complete

### Intent

- Align the runtime HDR-loading path with the newer `HDRLoader` naming used on the pinned r181 stack.
- Avoid keeping editor and runtime on different HDR loader conventions.

### Applied Changes

- Exposed the custom runtime HDR loader as both:
  - `THREE.HDRLoader`
  - `THREE.RGBELoader`
- Updated `assets/js/runtime/master/vrodos_scene_probe.js` to prefer `THREE.HDRLoader` and fall back to `THREE.RGBELoader`.

### Validation

- `eslint` passed on:
  - `assets/js/runtime/master/vrodos_master_rendering.js`
  - `assets/js/runtime/master/vrodos_scene_probe.js`

## Phase 4

### Status

- Complete

### Intent

- Move the build pipeline itself onto version-neutral naming so the upcoming r181 switch is mostly a config change instead of a file-by-file script rename.

### Applied Changes

- Added `scripts/three-vendor.config.mjs` as the central source for active Three vendor metadata and A-Frame source URLs.
- Introduced `scripts/build-three-vendor.mjs` as the new canonical vendor build entry.
- Kept `scripts/build-three-r173.mjs` as a compatibility wrapper so existing references do not break mid-migration.
- Updated the npm build script to use the neutral build entry.
- Added a neutral WordPress script handle `vrodos_three_vendor_bundle` while preserving the old `vrodos_three_r173_bundle` registration for compatibility.
- Pointed the PMNDRS runtime comment and smoke-build script at the new neutral build/config entry points.

### Validation

- Rebuild the active vendor bundle with the new neutral build script.
- Lint the touched JS files and syntax-check the touched PHP file.
- Result:
  - `node scripts/build-three-vendor.mjs` passed
  - `eslint` passed on the touched JS files
  - PHP syntax check passed on `includes/class-vrodos-asset-manager.php`

## Phase 12

### Status

- Complete

### Intent

- Clean up the canonical markdown docs so they describe the current pinned A-Frame master + Three r181 stack instead of the transitional migration state.
- Preserve historical r173 notes only where they still matter for debugging or renderer-behavior context.

### Applied Changes

- Updated `RENDERING_PIPELINE.md` to:
  - describe the current pinned runtime in the opening summary
  - clarify that the `isXRRenderTarget` section begins from historical r173 investigation but still documents a live legacy compatibility path
  - switch HDR environment-map wording from `RGBELoader` to `HDRLoader` with compatibility alias context
  - add a current-runtime note in the version section for the pinned A-Frame master commit and Three r181 bundle
- Updated `POSTPROCESSING_MIGRATION_PLAN.md` to:
  - mark Foundation 0 as an active pinned runtime base rather than a hypothetical migration question
  - retire runtime-profile/fallback language in favor of one live source of truth: `includes/class-vrodos-render-runtime-manager.php`
  - reframe the remaining foundation work around subsystem validation on the live r181 stack

### Validation

- Source sweep confirmed the remaining `r173` mentions in top-level markdown are now either:
  - explicit historical/debug context, or
  - implementation-log history that documents the migration path itself

## Phase 13

### Status

- Complete

### Intent

- Capture the PMNDRS Horizon artifact diagnosis so the team does not regress back to FXAA while the migration is still in flight.
- Align the live PMNDRS runtime with the current AA direction on the pinned r181 stack.

### Applied Changes

- Confirmed through narrow runtime toggles that the Horizon halo artifact survives without the visible PMNDRS sun sprite, but disappears when PMNDRS `FXAAEffect` is disabled.
- Updated `assets/js/runtime/master/vrodos_postprocessing_pmndrs.js` so the PMNDRS runtime no longer adds `FXAAEffect`.
- Updated PMNDRS runtime comments/logging to record the current direction: keep FXAA disabled and investigate `SMAAEffect` plus PMNDRS/MSAA behavior instead.
- Added a current-runtime AA decision note to `POSTPROCESSING_MIGRATION_PLAN.md`.

### Validation

- `eslint` passed on:
  - `assets/js/runtime/master/vrodos_postprocessing_pmndrs.js`
- Manual runtime diagnosis result:
  - `?vrodos_debug_disable_pmndrs_sun=1` did **not** remove the artifact
  - `?vrodos_debug_disable_pmndrs_fxaa=1` **did** remove the artifact

## Phase 14

### Status

- Complete

### Intent

- Replace the removed PMNDRS FXAA path with a PMNDRS-native anti-aliasing model on the pinned r181 stack.
- Keep the compile/runtime behavior aligned so PMNDRS AA is driven by the shared `aaQuality` selector rather than hidden legacy FXAA controls.

### Applied Changes

- Updated `assets/js/runtime/master/vrodos_postprocessing_pmndrs.js` so PMNDRS anti-aliasing now uses:
  - composer multisampling from `aaQuality`
  - `SMAAEffect` from the same `aaQuality` tier
- Added safe fallbacks so composer construction retries without MSAA if multisampled init fails.
- Updated `assets/js/runtime/master/components/vrodos_scene_settings.component.js` so PMNDRS AA alone is enough to keep post-processing active when no other PMNDRS effects are enabled.
- Updated `js_libs/vrodos_compile_dialogue.js` so the PMNDRS engine hint now explains that the shared Anti-Aliasing selector drives SMAA/MSAA.
- Recorded the live AA mapping in `POSTPROCESSING_MIGRATION_PLAN.md`.

### Validation

- `eslint` passed on:
  - `assets/js/runtime/master/vrodos_postprocessing_pmndrs.js`
  - `assets/js/runtime/master/components/vrodos_scene_settings.component.js`
  - `js_libs/vrodos_compile_dialogue.js`

## Phase 15

### Status

- Complete

### Intent

- Refine the temporary PMNDRS AA implementation so it follows the official PMNDRS demo model more closely.
- Expose PMNDRS-only anti-aliasing controls directly in the compile dialog instead of overloading the shared legacy AA selector.

### Applied Changes

- Reworked `assets/js/runtime/master/vrodos_postprocessing_pmndrs.js` to use exclusive PMNDRS AA modes:
  - `none`
  - `smaa`
  - `msaa`
- Added PMNDRS AA preset handling (`low|medium|high|ultra`) and mapped it to:
  - `SMAAEffect` presets for `smaa`
  - composer multisampling sample counts for `msaa`
- Added `pmndrsAAMode` and `pmndrsAAPreset` to the `scene-settings` schema and compiler serialization path.
- Updated the compile dialog to:
  - hide the shared legacy AA dropdown when PMNDRS is active
  - show PMNDRS-specific AA method and preset dropdowns
  - default new PMNDRS scenes to `none` for anti-aliasing, while keeping the preset selector ready for explicit `smaa` or `msaa` opt-in
  - preserve compatibility for older scenes by deriving PMNDRS defaults from the historical shared `aaQuality` field when explicit PMNDRS AA metadata is absent
- Tightened scene-settings logic so legacy FXAA flags no longer accidentally keep PMNDRS post-FX active when PMNDRS AA mode is `none`.

### Validation

- `eslint` passed on:
  - `assets/js/runtime/master/vrodos_postprocessing_pmndrs.js`
  - `assets/js/runtime/master/components/vrodos_scene_settings.component.js`
  - `js_libs/vrodos_compile_dialogue.js`
- PHP syntax check passed on:
  - `includes/class-vrodos-compiler-manager.php`

## Phase 16

### Status

- Complete

### Intent

- Close the PMNDRS AA investigation loop on the pinned r181 stack.
- Fix PMNDRS AA persistence/hydration gaps in the compile-dialog roundtrip.
- Verify whether movement-time FPS drops come from PMNDRS AA itself or from shared navmesh collision work.

### Applied Changes

- Added a PMNDRS AA debug overlay in `assets/js/runtime/master/vrodos_postprocessing_pmndrs.js` behind:
  - `?vrodos_debug_pmndrs_aa=1`
- The overlay reports:
  - selected PMNDRS AA mode/preset
  - requested/applied composer multisample count
  - `WebGL2` / `maxSamples` capability
  - whether `SMAAEffect` is present
  - whether the PMNDRS composer/effect pass is live
  - whether any MSAA fallback occurred
- Fixed PMNDRS AA scene-json persistence in `js_libs/vrodos_ScenePersistence.js` by:
  - exporting `aframePmndrsAAMode`
  - exporting `aframePmndrsAAPreset`
  - importing both fields back into `SceneSettings`
- Fixed PMNDRS AA loader hydration in `js_libs/vrodos_LoaderMulti.js` by restoring:
  - `aframePmndrsAAMode`
  - `aframePmndrsAAPreset`
- Fixed compile-dialog refresh rendering in `js_libs/vrodos_compile_dialogue.js` so the PMNDRS AA selects no longer receive the non-option internal fallback value `'inherit'`, which previously caused blank dropdowns after refresh/load.
- Added a navigation-performance overlay in `assets/js/runtime/master/components/vrodos_navigation.component.js` behind:
  - `?vrodos_debug_nav_perf=1`
- The navigation overlay reports:
  - per-frame / averaged nav tick time
  - constrained-movement time
  - ground-sample time
  - raycast time
  - raycast count
  - intersection count
- Applied the first low-risk collision optimization in `assets/js/runtime/master/components/vrodos_navigation.component.js`:
  - build a flattened `navMeshCollisionTargets` mesh list during navmesh refresh
  - raycast against that flat list with `recursive=false` instead of recursively traversing each navmesh root on every probe

### Validation

- `eslint` passed on:
  - `assets/js/runtime/master/vrodos_postprocessing_pmndrs.js`
  - `assets/js/runtime/master/components/vrodos_navigation.component.js`
  - `js_libs/vrodos_ScenePersistence.js`
  - `js_libs/vrodos_LoaderMulti.js`
  - `js_libs/vrodos_compile_dialogue.js`
- Manual runtime diagnosis established:
  - `MSAA high` was genuinely active in the compiled scene (`requested 8`, `applied 8`, `fallback none`)
  - `SMAA/MSAA` were functioning, but scene quality/performance remained a tradeoff rather than a wiring failure
  - the compile dialog now saves, reloads, and re-renders PMNDRS AA values correctly
  - nav/collision perf counters stayed near zero while standing still and jumped only while moving, confirming that movement-time FPS drops were being amplified by navmesh collision work
  - flattening navmesh collision targets improved movement performance enough to be accepted as a meaningful first optimization

### Findings

- PMNDRS `SMAA` and composer `MSAA` are officially supported features; the problem here is not PMNDRS feature maturity.
- On the current marina stress scene:
  - `MSAA high` still leaves visible aliasing on thin linework, micro-geometry, and specular edges
  - `SMAA high` still leaves visible jaggies on boats, pavement, and fence detail
  - `SMAA ultra` produces materially better cleanup but drops performance too far for this scene
- Legacy FXAA still gives the best perceived cleanup on this particular scene, even though PMNDRS AA is functioning correctly.
- The movement-related FPS dips are not explained by PMNDRS AA alone; shared collision/raycast cost is a confirmed contributing factor.
- Recommended follow-up direction: leave PMNDRS AA available, keep `none` as the PMNDRS default, and resume the next Takram/PMNDRS integration phase in a fresh thread.

## Phase 17

### Status

- Complete

### Intent

- Make root `package.json` and `package-lock.json` the source of truth for compiled-runtime package versions.
- Remove the stale standalone PMNDRS UMD file from the compiled scene load path.
- Generate a manifest that PHP can use for A-Frame, Three, PMNDRS, N8AO, and Takram runtime metadata.

### Applied Changes

- Added `vrodos.runtime.aframe` metadata to root `package.json`.
- Updated `scripts/three-vendor.config.mjs` so Three vendor directory and bundle names are derived from the locked root `three` package.
- Updated `scripts/build-three-vendor.mjs` to validate locked runtime package versions, rebuild the Three vendor bundle, rebuild the compiled-scene postprocessing bundle, rebuild the Takram atmosphere bundle, and write `assets/runtime-version-manifest.json`.
- Updated `includes/class-vrodos-render-runtime-manager.php` to read the generated manifest while preserving conservative fallback values.
- Removed the compiled-scene `postprocessing.min.js` script tag from `templates/runtime/aframe/Master_Client_prototype.html`.
- Removed `assets/js/runtime/master/lib/postprocessing.min.js`; PMNDRS globals now come from `assets/js/runtime/master/lib/vrodos-postprocessing.bundle.js`.
- Updated current Markdown docs to describe the package-synchronized runtime build mechanism and package update workflow.

### Validation

- `npm.cmd run build` passed.
- `npm.cmd run build:three` passed after final script cleanup.
- PHP syntax checks passed on:
  - `includes/class-vrodos-render-runtime-manager.php`
  - `includes/class-vrodos-asset-manager.php`
  - `includes/class-vrodos-compiler-manager.php`
- Confirmed `assets/runtime-version-manifest.json` reports:
  - Three `0.181.0`
  - PMNDRS postprocessing `6.39.1`
  - N8AO `1.10.1`
  - Takram atmosphere `0.18.0`
  - Takram clouds `0.7.4`
- Confirmed the generated compiled-scene postprocessing bundle exports:
  - `window.POSTPROCESSING`
  - `window.N8AOPostPass`
- Confirmed no source prototype references `postprocessing.min.js`.

### Follow-up Correction

- The first Phase 17 implementation briefly loaded the full editor Three vendor bundle in compiled scenes, which caused a second Three instance beside A-Frame's own Three and broke `Entity.setObject3D`.
- Corrected the compiled-scene path by generating `assets/js/runtime/master/lib/vrodos-postprocessing.bundle.js`, which aliases `three` to A-Frame's existing `window.THREE`.
- Compiled scenes now load A-Frame first, then `vrodos-postprocessing.bundle.js`, then `vrodos-takram-atmosphere.bundle.js`.
