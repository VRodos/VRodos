# Rendering Migration Implementation Log

## Goal

Track the staged rendering migration work so each phase is small, reviewable, and reversible.

*Note: This log has been consolidated to provide a clear picture of the current state and next steps for AI agents, replacing the granular Phase 1-17 step-by-step history.*

## Current Architecture & State (Completed Work)

The project has successfully migrated from a legacy Three.js r173 setup to a **pinned A-Frame master + Three.js r181** stack.

Key technical achievements:
- **Version Management:** Root `package.json` and `package-lock.json` are now the absolute source of truth for runtime package versions (Three, PMNDRS, N8AO, Takram).
- **Build Pipeline:** The script `npm run build:three` (via `scripts/build-three-vendor.mjs`) builds the necessary bundles and generates `assets/runtime-version-manifest.json`.
- **Runtime Manager:** The PHP backend uses `includes/class-vrodos-render-runtime-manager.php` to read the manifest and dynamically enqueue the correct runtime assets.
- **Compiled Scene Assets:** Standalone PMNDRS UMD files were removed. Compiled scenes now load `vrodos-postprocessing.bundle.js` and `vrodos-takram-atmosphere.bundle.js`. These bundles are configured to alias `three` to A-Frame's `window.THREE` to avoid instantiating multiple Three.js instances which breaks `Entity.setObject3D`.
- **Anti-Aliasing (AA):** Legacy FXAA was replaced with PMNDRS native SMAA/MSAA. The Scene Settings dialog and backend persistence (JSON) were updated to support PMNDRS-specific AA modes and presets.
- **Takram Atmosphere:** The PMNDRS compile dialog now separates artist-facing atmosphere looks (`sunrise`, `midday`, `sunset`, `night`, `custom`) from Takram resource quality (`performance`, `balanced`, `quality`, `cinematic`). Preset intensity and advanced sun/scattering controls are persisted and serialized into compiled `scene-settings`.
- **Legacy Cleanup:** All `threejs173` directories, scripts, and hardcoded references have been removed. `RGBELoader` was updated to `HDRLoader`.

## Current Focus & Next Steps

1. **Maintain the r181 baseline:** Ensure stability on the current A-Frame master + Three r181 stack before adding new major features.
2. **Takram Atmosphere Regression Coverage:** Keep one Horizon and one non-Horizon PMNDRS scene in manual smoke coverage for atmosphere look presets.
3. **Takram Clouds:** Add volumetric clouds only after the atmosphere baseline remains stable across the target scenes.

## Historical Phases Summary (Phases 1-17)

For historical context, the migration was completed in 17 distinct phases:
- **Phases 1-4:** Consolidated plans, removed hardcoded r173 paths, and prepared for version-neutral vendor management.
- **Phases 5-10:** Upgraded local vendor build to Three r181, migrated A-Frame to a pinned master commit, and cleaned up obsolete r173 assets. Introduced `VRodos_Render_Runtime_Manager`.
- **Phases 11-12:** Updated HDR loader logic and canonical markdown documentation to reflect the new stack.
- **Phases 13-16:** Diagnosed PMNDRS Horizon artifacts, transitioned from FXAA to PMNDRS-native AA (SMAA/MSAA), optimized navigation raycasting, and updated scene settings persistence.
- **Phase 17:** Synchronized runtime packages with `package.json`, generated `runtime-version-manifest.json`, and rebuilt PMNDRS and Takram bundles to correctly alias A-Frame's `THREE`.
- **Takram Atmosphere Rollout:** Upgraded Takram atmosphere packages, rebuilt the runtime bundle, added atmosphere look presets, fixed compiler serialization for the new metadata, and confirmed preset propagation in compiled PMNDRS scenes.
