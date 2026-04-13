# Rendering Migration Implementation Log

## Goal

Track the staged rendering migration work so each phase is small, reviewable, and reversible.

This log is append-oriented. Older phase entries remain for historical context even when later phases supersede their temporary migration scaffolding.

The current top-level order is:

1. Foundation migration toward pinned A-Frame master + Three r181
2. Re-baseline legacy and PMNDRS on that stack
3. Resume Takram-first Horizon/light-source work
4. Add clouds only after the new baseline is stable

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

- Added a richer PMNDRS Horizon/Takram runtime state container in `runtime/assets/js/master/vrodos_quality_profiles.js`.
- Recorded explicit ownership-intent flags so later Takram light-source swaps can land behind one state object.

### Validation

- `eslint` on `runtime/assets/js/master/vrodos_quality_profiles.js`
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
- Switched the active vendor config, asset-manager bundle path, and editor/runtime fallback defaults from `threejs173` to `threejs181`.

### Validation

- Rebuild the vendor bundle on r181.
- Fix the first round of build-time compatibility issues that surface.
- Result:
  - `three@0.181.0` installed successfully
  - `node scripts/build-three-vendor.mjs` passed and emitted `js_libs/threejs181/vrodos-three-r181.bundle.js`
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
  - `runtime/assets/js/master/vrodos_postprocessing.js`
  - `runtime/assets/js/master/vrodos_postprocessing_pmndrs.js`
  - `runtime/assets/js/master/vrodos_quality_profiles.js`

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
- Updated `runtime/assets/js/master/vrodos_scene_probe.js` to prefer `THREE.HDRLoader` and fall back to `THREE.RGBELoader`.

### Validation

- `eslint` passed on:
  - `runtime/assets/js/master/vrodos_master_rendering.js`
  - `runtime/assets/js/master/vrodos_scene_probe.js`

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
