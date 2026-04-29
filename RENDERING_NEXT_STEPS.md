# PMNDRS/Takram Compiled Rendering Next Steps

This tracker is the live source for the compiled-scene PMNDRS/Takram rendering plan, implementation status, and verification notes. Update it at the end of every execution phase.

## Current Shipped State

- Compiled scenes target the A-Frame runtime declared in root `package.json` and the generated Three r181 vendor/runtime manifest.
- Compiled scenes support two mutually exclusive post-FX engines through `scene-settings.postFXEngine`: `legacy` and `pmndrs`.
- The legacy engine remains the SSR/TAA/custom AO path.
- The PMNDRS engine uses `window.POSTPROCESSING` from `assets/js/runtime/master/lib/vrodos-postprocessing.bundle.js`.
- The PMNDRS engine uses A-Frame's existing `window.THREE`; it must not load a second Three instance.
- Takram atmosphere uses `window.VRODOS_TAKRAM_ATMOSPHERE` from `assets/js/runtime/master/lib/vrodos-takram-atmosphere.bundle.js`.
- PMNDRS currently supports composer rendering, N8AO ambient occlusion, SMAA/MSAA, bloom, tone mapping, color/contrast grading, vignette, noise, chromatic aberration, Takram atmosphere controls, and Takram sky ownership for Horizon scenes.

## Uncovered Issues

- Resolved 2026-04-29: PMNDRS AA, bloom, vignette, and tone-map exposure settings were being serialized to an unused `vrodos-postprocessing-pmndrs` attribute. The runtime reads these values from `scene-settings`.
- Resolved 2026-04-29: PMNDRS SSAO was disabled because the earlier `POSTPROCESSING.SSAOEffect` path caused depth/normal attachment blit conflicts on the pinned A-Frame/Three runtime, most visibly while testing the Horizon/Takram path. PMNDRS now uses bundled `N8AOPostPass` as the stable AO implementation.
- Resolved 2026-04-29: PMNDRS composer MSAA is disabled automatically when AO is active, because the bundled N8AO path is not stable with hardware multisampling. Use SMAA when PMNDRS AO is enabled.
- Resolved 2026-04-29: PMNDRS bloom is no longer skipped for Horizon backgrounds; the old sky-halo warning and branch were removed.
- Resolved 2026-04-29: Horizon PMNDRS/Takram sky still passed a non-black `groundAlbedo` after forcing `groundEnabled=false`, which could enable Takram's ground-albedo shader branch and draw a hard albedo band at the horizon. Ground-disabled Takram sky now uses black effective ground albedo.
- Horizon `AerialPerspectiveEffect` remains experimental because of previous white-cap and alpha-foliage artifacts.
- SSR and TAA are not available in the PMNDRS engine; scenes needing them should stay on `legacy`.

## Future Backlog

- PMNDRS effects to evaluate after the first Phase 3 pass: LUT/color grading extension, depth of field, outline/selective bloom, god rays, tilt shift, pixelation, glitch, and shock wave.
- Future PMNDRS AO work: retry native `POSTPROCESSING.SSAOEffect` after isolating the normal/depth buffer path from Horizon/Takram rendering and confirming it no longer triggers the A-Frame depth-blit conflict.
- Takram non-cloud features to evaluate: stars, date/time sun and moon direction, `SkyLightProbe`, `SunDirectionalLight`, `LightingMaskPass`, and geodetic/ECEF/ENU helpers.
- Volumetric clouds remain explicitly out of scope for this plan.

## Execution Plan

1. Stabilize PMNDRS engine selection and compiled setting serialization.
2. Re-enable PMNDRS SSAO through the existing ambient occlusion preset control.
3. Add the next low-risk PMNDRS effects as normal compile-dialog settings.
4. Expand Takram non-cloud atmosphere/geospatial features.

## Execution Log

### 2026-04-29 - Phase 1: PMNDRS engine selection and serialization

Status: complete.

Changes:
- Move PMNDRS AA, bloom, vignette, and tone-map exposure serialization into compiled `scene-settings`.
- Remove compiler reliance on the unused `vrodos-postprocessing-pmndrs` attribute.

Verification:
- PHP syntax check passed for `includes/class-vrodos-compiler-manager.php`.
- Static search confirmed there is no runtime component registration or compiler output dependency for `vrodos-postprocessing-pmndrs`.
- Static search confirmed PMNDRS tweak values are serialized into `scene-settings`.

### 2026-04-29 - Phase 2: PMNDRS SSAO

Status: complete.

Decision:
- Use bundled `window.N8AOPostPass` as the PMNDRS-compatible SSAO pass instead of `POSTPROCESSING.SSAOEffect`.
- Reason: native PMNDRS `SSAOEffect` was the preferred first attempt, but it conflicted with the pinned A-Frame/Three depth/normal attachment path during Horizon/Takram testing; `N8AOPostPass` avoided that failure while still running inside the PMNDRS composer.
- Use the existing `ambientOcclusionPreset` values as the toggle surface: `off`, `soft`, `balanced`, `strong`.
- Keep PMNDRS AO compatible by forcing composer multisampling to zero when AO is enabled; SMAA remains the recommended AA mode for PMNDRS AO scenes.

Changes:
- Add N8AO preset mapping for PMNDRS AO.
- Insert `N8AOPostPass` after PMNDRS `RenderPass` and before the fused `EffectPass`.
- Report the `ao-disables-msaa` fallback reason in the PMNDRS debug overlay when a scene requests MSAA and AO together.
- Keep legacy AO unchanged.

Verification:
- `npm.cmd run lint` passed for runtime master JS.
- PHP syntax check remained clean after compiler serialization changes.
- Static search confirmed stale "SSAO disabled" docs were updated.

Follow-up changes:
- Tuned N8AO away from raw defaults after visual review: raw world-space radius 5 and intensity 5+ created unnatural "spider leg" dark streaks on thin Horizon geometry. Current presets use smaller world-space radii and lower intensity while staying full-resolution.
- Disabled N8AO transparency auto-detection by default to avoid the extra transparent-scene render path in compiled scenes.
- Restored PMNDRS bloom on Horizon backgrounds and removed the old warning branch.
- Follow-up correction: PMNDRS Horizon bloom is restored to the generic bloom profile; the reported hard horizon boundary also appears with bloom off, so bloom is not treated as the cause.

### 2026-04-29 - Phase 3: First PMNDRS effect expansion

Status: complete for the first low-risk effects; ready for the next PMNDRS effect phase.

Decision:
- Ship low-risk PMNDRS effects first as compile-dialog settings: noise and chromatic aberration.
- Keep LUT/color grading extension and depth of field queued because they need asset/control design beyond a simple toggle and slider.

Changes:
- Add PMNDRS-only compile controls for noise opacity and chromatic aberration offset.
- Persist new scene metadata keys: `aframePmndrsNoiseEnabled`, `aframePmndrsNoiseOpacity`, `aframePmndrsChromaticAberrationEnabled`, and `aframePmndrsChromaticAberrationOffset`.
- Serialize new compiled `scene-settings` keys: `pmndrsNoiseEnabled`, `pmndrsNoiseOpacity`, `pmndrsChromaticAberrationEnabled`, and `pmndrsChromaticAberrationOffset`.
- Add runtime construction for bundled `POSTPROCESSING.NoiseEffect` and `POSTPROCESSING.ChromaticAberrationEffect` inside the PMNDRS composer path only.
- Fix compile-dialog contrast preset normalization so the existing `soft`, `balanced`, and `punchy` values survive scene sync.
- Known issue: chromatic aberration can darken/warp the Takram/Horizon sky boundary. It remains user-controlled instead of runtime-disabled so authors can choose whether to use it.
- Fix Horizon PMNDRS/Takram hard boundary by passing black effective `groundAlbedo` whenever Takram ground is disabled, while preserving authored ground albedo for ground-enabled atmosphere scenes.

Verification:
- `npm.cmd run lint` passed for runtime master JS.
- `node --check` passed for edited editor-side JS files.
- PHP syntax checks passed for `includes/class-vrodos-compiler-manager.php` and `includes/class-vrodos-scene-cpt-manager.php`.
- `git diff --check` passed.

Next phase:
- Add the PMNDRS color-grading extension first if it can reuse the existing color/contrast compile-dialog surface.
- Add depth of field only after deciding the author-facing focus-distance workflow and confirming it behaves well in Horizon and non-Horizon scenes.
- Keep chromatic aberration user-controlled; do not auto-disable it for Horizon scenes.

### 2026-04-30 - Phase 3 baseline reset before next effect

Status: complete.

Changes:
- Retuned PMNDRS AO presets away from raw N8AO defaults after Horizon visual review: `soft` = Low/radius 0.9/falloff 0.55/intensity 1.1, `balanced` = Medium/radius 1.6/falloff 0.62/intensity 1.75, `strong` = High/radius 2.8/falloff 0.72/intensity 2.6. All remain full-resolution with two denoise iterations.
- Left the PMNDRS AO stability constraints unchanged: AO still disables composer MSAA, and N8AO transparency auto-detection remains off by default.
- Updated the migration plan and implementation log so the next phase starts from the restored AO baseline.

Verification:
- `node --check assets/js/runtime/master/vrodos_postprocessing_pmndrs.js` passed.
- `npm.cmd run lint` passed for runtime master JS.
- `git diff --check` passed.
- Static search confirmed the new PMNDRS effect keys are present in UI, editor sync, metadata schema, compiler serialization, runtime schema, and PMNDRS runtime construction.
- Generated HTML inspection remains pending until a compiled scene is available.
