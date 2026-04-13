# Rendering Migration Implementation Log

## Goal

Track the staged rendering migration work so each phase is small, reviewable, and reversible.

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
