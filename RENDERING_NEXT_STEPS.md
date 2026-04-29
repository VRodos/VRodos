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
- Resolved 2026-04-29: PMNDRS SSAO was disabled because the earlier `SSAOEffect` path caused depth attachment blit conflicts on the pinned A-Frame/Three runtime. PMNDRS now uses bundled `N8AOPostPass`.
- Resolved 2026-04-29: PMNDRS composer MSAA is disabled automatically when AO is active, because the bundled N8AO path is not stable with hardware multisampling. Use SMAA when PMNDRS AO is enabled.
- Resolved 2026-04-29: PMNDRS bloom is no longer skipped for Horizon backgrounds; the old sky-halo warning and branch were removed.
- Horizon `AerialPerspectiveEffect` remains experimental because of previous white-cap and alpha-foliage artifacts.
- SSR and TAA are not available in the PMNDRS engine; scenes needing them should stay on `legacy`.

## Future Backlog

- PMNDRS effects to evaluate after the first Phase 3 pass: depth of field, LUT/color grading extension, outline/selective bloom, god rays, tilt shift, pixelation, glitch, and shock wave.
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
- Rebalanced N8AO presets for runtime cost: `soft` uses Performance quality, `balanced` uses Low quality, and `strong` uses Medium quality.
- Disabled N8AO transparency auto-detection by default to avoid the extra transparent-scene render path in compiled scenes.
- Restored PMNDRS bloom on Horizon backgrounds and removed the old warning branch.
- Follow-up correction: PMNDRS Horizon bloom is restored to the generic bloom profile; the reported hard horizon boundary also appears with bloom off, so bloom is not treated as the cause.

### 2026-04-29 - Phase 3: First PMNDRS effect expansion

Status: in progress; first low-risk effects implemented.

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

Verification:
- `npm.cmd run lint` passed for runtime master JS.
- `node --check` passed for edited editor-side JS files.
- PHP syntax checks passed for `includes/class-vrodos-compiler-manager.php` and `includes/class-vrodos-scene-cpt-manager.php`.
- `git diff --check` passed.
- Static search confirmed the new PMNDRS effect keys are present in UI, editor sync, metadata schema, compiler serialization, runtime schema, and PMNDRS runtime construction.
- Generated HTML inspection remains pending until a compiled scene is available.
