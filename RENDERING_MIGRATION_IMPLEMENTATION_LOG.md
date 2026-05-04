# Rendering Migration Implementation Log

## Goal

Track the staged rendering migration work so each phase stays small, reviewable, and reversible.

This log is consolidated for current and future agents. It replaces the older granular Phase 1-17 history with the current architecture, recent landed work, and next verification targets.

## Current Architecture and State

The project has migrated from a legacy Three.js r173 setup to a pinned A-Frame master + Three.js r181 stack.

Completed work:

- Root `package.json` and `package-lock.json` are the source of truth for runtime package versions.
- `npm run build:three` builds the Three vendor bundle, PMNDRS/N8AO bundle, Takram atmosphere bundle, and `assets/runtime-version-manifest.json`.
- `includes/class-vrodos-render-runtime-manager.php` reads the manifest and resolves runtime assets.
- Compiled scenes load `vrodos-postprocessing.bundle.js` and `vrodos-takram-atmosphere.bundle.js`.
- PMNDRS and Takram bundles alias `three` to A-Frame's `window.THREE` to avoid multiple Three instances.
- PMNDRS supports SMAA/MSAA, N8AO ambient occlusion, bloom, tone mapping, basic color/contrast grading, built-in LUT looks, vignette, noise, chromatic aberration, and Takram atmosphere.
- Legacy rendering remains available for SSR and TAA.
- Obsolete `threejs173` directories, scripts, and hardcoded references have been removed.
- `RGBELoader` usage has been updated to `HDRLoader`.

## Current Focus and Next Steps

1. Maintain the r181 baseline before adding larger effects.
2. Keep one Horizon PMNDRS scene and one non-Horizon PMNDRS scene in manual smoke coverage.
3. Verify PMNDRS built-in LUT looks in compiled scenes.
4. Keep `N8AOPostPass` as the stable PMNDRS AO path.
5. Defer native `SSAOEffect` retry to a separate diagnostic task.
6. Defer depth of field until the author-facing focus workflow is decided.
7. Keep Takram volumetric clouds in backlog and out of scope for the current phase.

## Recent Landed Work

### VR/XR visual parity

- Added presentation-mode detection to separate inline desktop, desktop fullscreen/A-Frame fullscreen, and real immersive WebXR.
- Desktop fullscreen now preserves the same post-FX eligibility as inline desktop.
- Real immersive WebXR uses a direct stereo fallback for unsupported screen-space composer passes while keeping scene-owned visuals active.
- Presentation transitions re-sync visual state on fullscreen changes, `enter-vr`, `exit-vr`, and delayed resize settling.

### PMNDRS Horizon helper lighting exposure

- Exposed PMNDRS Horizon helper-light intensity controls in the compile dialog.
- Added persisted scene metadata and compiled `scene-settings` fields for Horizon key/fill light intensities.
- Replaced hardcoded PMNDRS Horizon helper-light intensities with scene-configured values while keeping preset-driven colors.
- Expanded Horizon diagnostics to include helper-light intensity and sun-scale data.

### PMNDRS low-risk effects

- Added PMNDRS-only controls for noise and chromatic aberration.
- Persisted and serialized the new scene metadata.
- Added runtime construction through PMNDRS `NoiseEffect` and `ChromaticAberrationEffect`.

### PMNDRS built-in LUT looks

- Added v1 built-in generated LUT looks without uploaded LUT asset support.
- Added metadata and compiled `scene-settings` keys:
  - `aframePmndrsLutEnabled` / `pmndrsLutEnabled`
  - `aframePmndrsLutLook` / `pmndrsLutLook`
  - `aframePmndrsLutStrength` / `pmndrsLutStrength`
- Added built-in looks:
  - `neutral`
  - `warm-film`
  - `cool-clarity`
  - `cinematic-contrast`
  - `soft-fade`
- Regrouped PMNDRS compile-dialog controls into anti-aliasing, exposure/color, bloom/lens, and Takram atmosphere cards.

## Historical Phases Summary

- Phases 1-4: Consolidated plans, removed hardcoded r173 paths, and prepared version-neutral vendor management.
- Phases 5-10: Upgraded local vendor build to Three r181, migrated A-Frame to a pinned master commit, removed obsolete r173 assets, and introduced `VRodos_Render_Runtime_Manager`.
- Phases 11-12: Updated HDR loader logic and canonical markdown documentation.
- Phases 13-16: Diagnosed PMNDRS Horizon artifacts, moved from FXAA to PMNDRS-native AA, optimized navigation raycasting, and updated scene-settings persistence.
- Phase 17: Synchronized runtime packages with `package.json`, generated `runtime-version-manifest.json`, and rebuilt PMNDRS/Takram bundles to alias A-Frame's `THREE`.
- Takram atmosphere rollout: upgraded Takram packages, rebuilt the runtime bundle, added atmosphere look presets, fixed compiler serialization, and confirmed preset propagation in compiled PMNDRS scenes.

## Verification Targets

Static checks:

- `node --check` for edited editor and runtime JS files.
- PHP syntax checks for edited PHP files.
- `git diff --check`.
- `npm.cmd run lint` for runtime master JS when available.

Manual smoke:

- PMNDRS scene with LUT off.
- PMNDRS scene with each built-in LUT look at strength `1.0`.
- PMNDRS scene with LUT strength `0.0`.
- Horizon PMNDRS scene with Takram atmosphere plus LUT.
- Non-Horizon PMNDRS scene with LUT, AO, bloom, SMAA/MSAA fallback, noise, and chromatic aberration.
