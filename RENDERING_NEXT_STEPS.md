# PMNDRS/Takram Compiled Rendering Next Steps

This tracker is the live source for the compiled-scene PMNDRS/Takram rendering plan, implementation status, and verification notes. Update it at the end of every execution phase.

## Current Shipped State

- Compiled scenes target the A-Frame runtime declared in root `package.json` and the generated Three r181 vendor/runtime manifest.
- Compiled scenes support two mutually exclusive post-FX engines through `scene-settings.postFXEngine`: `legacy` and `pmndrs`.
- The legacy engine remains the SSR/TAA/custom AO path.
- The PMNDRS engine uses `window.POSTPROCESSING` from `assets/js/runtime/master/lib/vrodos-postprocessing.bundle.js`.
- The PMNDRS engine uses A-Frame's existing `window.THREE`; it must not load a second Three instance.
- Takram atmosphere uses `window.VRODOS_TAKRAM_ATMOSPHERE` from `assets/js/runtime/master/lib/vrodos-takram-atmosphere.bundle.js`.
- PMNDRS currently supports composer rendering, native `SSAOEffect` ambient occlusion, SMAA/MSAA, bloom, tone mapping, color/contrast grading, built-in LUT looks, vignette, noise, chromatic aberration, Takram atmosphere/celestial controls, and Takram sky ownership for Horizon scenes.

## Active Priorities

1. Keep the r181 PMNDRS baseline stable across one Horizon and one non-Horizon smoke scene.
2. Keep native `POSTPROCESSING.SSAOEffect` as the PMNDRS AO backend and continue broader Horizon/non-Horizon validation.
3. Keep `AerialPerspectiveEffect` experimental for Horizon scenes until the previous white-cap and alpha-foliage artifacts are revalidated.
4. Start the next rendering phase with Takram non-cloud geospatial features after celestial preset smoke.
5. Keep volumetric clouds out of scope until atmosphere and PMNDRS regression coverage stays stable.

## Resolved Issues

- Resolved 2026-04-29: PMNDRS AA, bloom, vignette, and tone-map exposure settings were serialized to an unused `vrodos-postprocessing-pmndrs` attribute. The runtime now reads these values from `scene-settings`.
- Resolved 2026-04-29: PMNDRS SSAO was disabled because native `POSTPROCESSING.SSAOEffect` caused depth/normal attachment blit conflicts on the pinned A-Frame/Three runtime.
- Resolved 2026-05-04: Native PMNDRS `SSAOEffect` was retested without visible artifacts and promoted to the PMNDRS AO backend.
- Resolved 2026-05-04: Native PMNDRS `SSAOEffect` presets were retuned around the upstream SSAO demo: low sampling radius, half-resolution AO, demo-style distance/proximity cutoffs, and intensity as the primary visible strength control.
- Resolved 2026-04-29: PMNDRS composer MSAA is disabled automatically when AO is active. Use SMAA when PMNDRS AO is enabled.
- Resolved 2026-04-29: PMNDRS bloom is no longer skipped for Horizon backgrounds.
- Resolved 2026-04-29: Horizon PMNDRS/Takram sky now uses black effective `groundAlbedo` whenever Takram ground is disabled, avoiding the hard albedo band at the horizon.
- Resolved 2026-05-06: Built-in PMNDRS LUT compile options were manually smoke-tested in compiled scenes, including the v1 look controls and strength handling.
- Resolved 2026-05-06: Takram celestial mode v1 added manual/preset-time compile settings, time-of-day presets, compiled `scene-settings` serialization, and runtime preset resolution.
- Resolved 2026-05-06: Horizon PMNDRS `preset-time/night` helper lighting now uses dim moonlight or near-black fallback instead of daytime helper-light intensities.

## Execution Plan

1. Stabilize PMNDRS engine selection and compiled setting serialization. Complete.
2. Re-enable PMNDRS AO through the existing ambient occlusion preset control. Complete via native PMNDRS SSAO.
3. Add low-risk PMNDRS effects as compile-dialog settings. Complete for noise and chromatic aberration.
4. Add built-in PMNDRS LUT color looks. Complete for v1 built-in generated LUTs.
5. Expand Takram non-cloud geospatial features after celestial preset smoke.

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
- Use native `POSTPROCESSING.SSAOEffect` as the PMNDRS-compatible SSAO pass.
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
- Retuned PMNDRS AO presets after Horizon visual review.
- Left the PMNDRS AO stability constraint unchanged: AO still disables composer MSAA.

### 2026-05-04 - Phase 4: Built-in PMNDRS LUT looks

Status: complete after manual compiled-scene smoke.

Changes:
- Added PMNDRS built-in LUT metadata, compile-dialog controls, compiler serialization, A-Frame schema fields, and PMNDRS runtime construction.
- Built-in looks are generated at runtime from a neutral 16x16x16 `LookupTexture`; no uploaded LUT assets are part of v1.
- The PMNDRS compile dialog now groups engine controls into anti-aliasing, exposure/color, bloom/lens, and Takram atmosphere cards.
- Rendering docs were cleaned up to describe the current legacy and PMNDRS split.

Verification:
- Static JS checks passed with existing warnings.
- Manual compile-options smoke confirmed built-in LUT controls work in compiled scenes, including generated HTML serialization through `scene-settings`.
- Automated browser smoke was intentionally skipped because the LUT coverage was manually verified.

### 2026-05-04 - Diagnostic: native PMNDRS SSAOEffect retry

Status: promoted after visual smoke.

Changes:
- Promoted native PMNDRS SSAO to the default AO backend using `POSTPROCESSING.NormalPass` and `POSTPROCESSING.SSAOEffect`.
- Removed the previous alternate AO fallback.
- The composer signature and PMNDRS debug overlay now report native SSAO directly.
- Retuned native SSAO presets to follow the upstream demo shape while scaling to the requested screenshot ceiling: `soft` uses the upstream demo defaults, `strong` uses full resolution, `32` samples, radius `0.045`, and intensity `2.01`, and `balanced` sits between them.

Verification:
- Visual smoke reported no visible native SSAO artifacts.
- Static checks should be run after promotion.

### 2026-05-06 - Phase 5: Takram celestial controls v1

Status: implemented; manual compiled-scene smoke pending.

Changes:
- Added PMNDRS/Takram celestial mode compile controls: `manual` and `preset-time`.
- Added time presets: `sunrise`, `midday`, `golden-hour`, `sunset`, and `night`.
- Persisted metadata keys `aframePmndrsCelestialMode` and `aframePmndrsCelestialTimePreset`.
- Serialized compiled `scene-settings` keys `pmndrsCelestialMode` and `pmndrsCelestialTimePreset`.
- Runtime `preset-time` now resolves the selected preset through the existing Takram atmosphere direction helpers while `manual` preserves the current slider path.
- Night preset moon behavior remains tied to `pmndrsMoonEnabled`, so the compile dialog can override it without promoting stars, probes, geospatial UI, or clouds.

Verification:
- `node --check` passed for edited editor/runtime JS.
- PHP syntax checks passed for edited compiler and scene CPT files.
- `npm.cmd run lint` passed with existing warnings.
- Manual compiled-scene smoke remains the next verification step.

### 2026-05-06 - Fix: Horizon PMNDRS night helper lighting

Status: implemented; visual smoke pending.

Changes:
- `preset-time/night` now caps Horizon PMNDRS helper lights to dim cool moonlight when the moon path is enabled.
- If the moon path is disabled, Horizon PMNDRS helper lights fall back to near black.
- Night helper key direction follows the local moon vector instead of the sun vector.
- HDR/scene-probe env-map intensity is scaled down at night without changing authored material roughness or metalness.
- Horizon diagnostics now report helper direction and night reflection scale.

Verification:
- `node --check` passed for edited runtime JS.
- `npm.cmd run lint` passed with existing warnings.
- `git diff --check` passed.
- Manual smoke should confirm the black sky remains, scene readability is dim, and the road no longer gets a bright daytime specular streak.

## Future Backlog

- PMNDRS effects to evaluate after the Takram non-cloud phase: depth of field, outline/selective bloom, god rays, tilt shift, pixelation, glitch, and shock wave.
- Future PMNDRS AO work: continue validating native `POSTPROCESSING.SSAOEffect` on new Horizon/non-Horizon scenes.
- Next Takram non-cloud features to evaluate: geospatial date/time solar simulation, stars, `SkyLightProbe`, `SunDirectionalLight`, `LightingMaskPass`, and geodetic/ECEF/ENU helpers.
- Volumetric clouds remain backlog and are explicitly out of scope for the current rendering phase.
