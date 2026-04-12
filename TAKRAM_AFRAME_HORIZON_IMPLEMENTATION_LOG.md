# Takram A-Frame Horizon Implementation Log

## Goal

Track the staged implementation of the Takram-first Horizon path so each phase is small, reviewable, and reversible.

## Phase 1

### Status

- Complete

### Intent

- Save the decision-complete plan in the repo.
- Start implementation with a low-risk architectural step: centralize the current Takram Horizon mode decisions so later phases can replace lighting and sky ownership without spreading logic across multiple branches.
- Align the new work with existing pipeline plans before deeper rendering changes land.

### Planned Code Changes

- Add one helper that identifies the local PMNDRS + Takram Horizon mode.
- Add one helper that applies the current Horizon-local Takram constraints to atmosphere config.
- Route Horizon config generation through those helpers.
- Leave legacy rendering behavior untouched.

### Alignment Notes

- `POSTPROCESSING_MIGRATION_PLAN.md`
  - Keep using the per-scene PMNDRS vs legacy engine split.
  - Keep Horizon on the `SkyMaterial` path, not `AerialPerspectiveEffect`, until the depth-blit issue is solved.
- `POSTFX_DEBUG_NOTES.md`
  - Do not bypass or replace the current PMNDRS tonemapping/encoding path during Takram refactors.
- Earlier volumetric-clouds planning
  - Keep atmosphere/cloud work scene-level and driven by `scene-settings`, not by hardcoded scene HTML.

### Applied Changes

- Added this running implementation journal.
- Centralized the current local Horizon Takram constraints behind dedicated helpers in `runtime/assets/js/master/vrodos_quality_profiles.js`.
- Merged the decision-level Takram Horizon plan into `POSTPROCESSING_MIGRATION_PLAN.md` so the migration plan is once again the single canonical planning file.

### Validation

- `eslint` on the touched JS files after the phase is applied.
- Result: pass on `runtime/assets/js/master/vrodos_quality_profiles.js`.

### Notes

- This phase is intentionally structural. It is not expected to fix the visual artifact yet.

## Phase 2

### Status

- Complete

### Intent

- Make the Horizon-specific Takram runtime state explicit enough that later lighting ownership changes can land behind a single object instead of more scattered booleans and ad hoc fields.
- Keep the current visuals stable while improving the internal seam for the Takram-first light-source migration.

### Planned Code Changes

- Expand the Horizon state object so it carries ownership intent, not just vectors/matrices.
- Add explicit flags for whether the current local Horizon path is using Takram ground, Takram sun disk, and Takram light sources.
- Keep the active path in the current "prep" state until the later lighting swap actually happens.

### Alignment Notes

- `POSTPROCESSING_MIGRATION_PLAN.md`
  - Align with consolidated Phase 5A/5B staging under §12.
- `POSTFX_DEBUG_NOTES.md`
  - No changes to tonemapping/encoding assumptions.
- PMNDRS/Takram best-practice review
  - Prepare for one authoritative Takram-owned state without claiming the full lighting model is already switched over.

### Applied Changes

- Added a richer PMNDRS Horizon/Takram state container in `runtime/assets/js/master/vrodos_quality_profiles.js`.
- Recorded explicit ownership-intent flags in that state so later phases can swap light ownership without rewiring all call sites.

### Validation

- `eslint` on the touched JS files after the phase is applied.
- Result: pass on `runtime/assets/js/master/vrodos_quality_profiles.js`.

## Next Phase

- Start the actual Takram-first light-source migration by introducing Takram-owned lighting objects behind the new state container.
- Keep the visible Horizon owner on `SkyMaterial` and continue leaving legacy rendering untouched.
