# PMNDRS/Takram Compiled Rendering Next Steps

This tracker is the live source for the compiled-scene PMNDRS/Takram rendering plan, implementation status, and verification notes. Update it at the end of every execution phase.

## Current Shipped State

- Compiled scenes target the A-Frame runtime declared in root `package.json` and the generated Three r181 vendor/runtime manifest.
- Compiled scenes support two mutually exclusive post-FX engines through `scene-settings.postFXEngine`: `legacy` and `pmndrs`.
- The legacy engine remains the SSR/TAA/custom AO path.
- The PMNDRS engine uses `window.POSTPROCESSING` and `window.N8AOPostPass` from `assets/js/runtime/master/lib/vrodos-postprocessing.bundle.js`.
- The PMNDRS engine uses A-Frame's existing `window.THREE`; it must not load a second Three instance.
- Takram atmosphere uses `window.VRODOS_TAKRAM_ATMOSPHERE` from `assets/js/runtime/master/lib/vrodos-takram-atmosphere.bundle.js`.
- PMNDRS currently supports composer rendering, N8AO ambient occlusion, SMAA/MSAA, bloom, tone mapping, color/contrast grading, built-in LUT looks, vignette, noise, chromatic aberration, Takram atmosphere controls, and Takram sky ownership for Horizon scenes.

## Active Priorities

1. Keep the r181 PMNDRS baseline stable across one Horizon and one non-Horizon smoke scene.
2. Verify built-in PMNDRS LUT looks in compiled scenes, including `neutral`, `warm-film`, `cool-clarity`, `cinematic-contrast`, and `soft-fade`.
3. Keep PMNDRS AO on bundled `N8AOPostPass`; retry native `POSTPROCESSING.SSAOEffect` only in a separate diagnostic phase.
4. Keep `AerialPerspectiveEffect` experimental for Horizon scenes until the previous white-cap and alpha-foliage artifacts are revalidated.
5. Keep volumetric clouds out of scope for the current rendering phase. Treat clouds as backlog after atmosphere and LUT regression coverage stays stable.

## Resolved Issues

- Resolved 2026-04-29: PMNDRS AA, bloom, vignette, and tone-map exposure settings were serialized to an unused `vrodos-postprocessing-pmndrs` attribute. The runtime now reads these values from `scene-settings`.
- Resolved 2026-04-29: PMNDRS SSAO was disabled because native `POSTPROCESSING.SSAOEffect` caused depth/normal attachment blit conflicts on the pinned A-Frame/Three runtime. PMNDRS now uses bundled `N8AOPostPass`.
- Resolved 2026-04-29: PMNDRS composer MSAA is disabled automatically when AO is active. Use SMAA when PMNDRS AO is enabled.
- Resolved 2026-04-29: PMNDRS bloom is no longer skipped for Horizon backgrounds.
- Resolved 2026-04-29: Horizon PMNDRS/Takram sky now uses black effective `groundAlbedo` whenever Takram ground is disabled, avoiding the hard albedo band at the horizon.

## Execution Plan

1. Stabilize PMNDRS engine selection and compiled setting serialization. Complete.
2. Re-enable PMNDRS AO through the existing ambient occlusion preset control. Complete via N8AO.
3. Add low-risk PMNDRS effects as compile-dialog settings. Complete for noise and chromatic aberration.
4. Add built-in PMNDRS LUT color looks. Complete for v1 built-in generated LUTs.
5. Expand Takram non-cloud atmosphere/geospatial features after regression coverage.

## Execution Log

### 2026-04-29 - Phase 1: PMNDRS engine selection and serialization

Status: complete.

Changes:
- Moved PMNDRS AA, bloom, vignette, and tone-map exposure serialization into compiled `scene-settings`.
- Removed compiler reliance on the unused `vrodos-postprocessing-pmndrs` attribute.

Verification:
- PHP syntax check passed for `includes/class-vrodos-compiler-manager.php`.
- Static search confirmed no runtime component registration or compiler output dependency for `vrodos-postprocessing-pmndrs`.

### 2026-04-29 - Phase 2: PMNDRS SSAO

Status: complete.

Decision:
- Use bundled `window.N8AOPostPass` as the PMNDRS-compatible SSAO pass instead of `POSTPROCESSING.SSAOEffect`.
- Keep PMNDRS AO compatible by forcing composer multisampling to zero when AO is enabled.

Verification:
- Runtime lint passed.
- PHP syntax checks remained clean.
- Static search confirmed stale "SSAO disabled" docs were updated.

### 2026-04-29 - Phase 3: First PMNDRS effect expansion

Status: complete.

Changes:
- Added PMNDRS-only compile controls for noise opacity and chromatic aberration offset.
- Persisted and serialized the new scene metadata and `scene-settings` keys.
- Added runtime construction for bundled `POSTPROCESSING.NoiseEffect` and `POSTPROCESSING.ChromaticAberrationEffect`.
- Fixed Horizon PMNDRS/Takram hard boundary by passing black effective `groundAlbedo` whenever Takram ground is disabled.

Verification:
- `npm.cmd run lint` passed for runtime master JS.
- `node --check` passed for edited editor-side JS files.
- PHP syntax checks passed for compiler and scene CPT manager files.
- `git diff --check` passed.

### 2026-04-30 - Phase 3 baseline reset before next effect

Status: complete.

Changes:
- Retuned PMNDRS AO presets away from raw N8AO defaults after Horizon visual review.
- Left the PMNDRS AO stability constraints unchanged: AO still disables composer MSAA, and N8AO transparency auto-detection remains off by default.

### 2026-05-04 - Phase 4: Built-in PMNDRS LUT looks

Status: implemented; generated HTML and visual smoke checks pending.

Changes:
- Added PMNDRS built-in LUT metadata, compile-dialog controls, compiler serialization, A-Frame schema fields, and PMNDRS runtime construction.
- Built-in looks are generated at runtime from a neutral 16x16x16 `LookupTexture`; no uploaded LUT assets are part of v1.
- The PMNDRS compile dialog now groups engine controls into anti-aliasing, exposure/color, bloom/lens, and Takram atmosphere cards.
- Rendering docs were cleaned up to describe the current legacy and PMNDRS split.

Verification:
- Static JS/PHP checks should be run after implementation.
- Manual smoke remains required for one Horizon PMNDRS scene and one non-Horizon PMNDRS scene.

## Future Backlog

- PMNDRS effects to evaluate after LUT smoke coverage: depth of field, outline/selective bloom, god rays, tilt shift, pixelation, glitch, and shock wave.
- Future PMNDRS AO work: retry native `POSTPROCESSING.SSAOEffect` after isolating the normal/depth buffer path from Horizon/Takram rendering.
- Takram non-cloud features to evaluate: stars, date/time sun and moon direction, `SkyLightProbe`, `SunDirectionalLight`, `LightingMaskPass`, and geodetic/ECEF/ENU helpers.
- Volumetric clouds remain backlog and are explicitly out of scope for the current rendering phase.
