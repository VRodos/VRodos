# Takram Cloud Occlusion Plan

## Summary

VRodos uses Takram's documented light-source lighting path for compiled Horizon PBR scenes: `SunDirectionalLight`, `SkyLightProbe`, standard Three materials, and VRodos fill lights. Takram clouds remain a PMNDRS/Takram atmospheric post-process feature. The v1 cloud occlusion layer bridges those two paths with a CPU-only cloud sun-occlusion scalar that dims the existing scene lights under dense cloud cover.

This is not a projected cloud-shadow map. It does not raymarch from every surface point to the sun, read cloud textures back to the CPU, or enable Takram post-process lighting for PBR materials.

## Findings

- Takram atmosphere docs separate post-process lighting from light-source lighting. Light-source lighting is compatible with built-in Three materials and uses `SunDirectionalLight` plus `SkyLightProbe`.
- Takram docs warn not to enable `AerialPerspectiveEffect.sunLight` or `skyLight` while also using `SunDirectionalLight` and `SkyLightProbe`, unless a proper lighting mask is used.
- Takram clouds expose atmospheric overlay, shadow, and shadow-length outputs for composition with `AerialPerspectiveEffect`.
- Takram clouds also expose a documented `lightShafts` option for volumetric sun/cloud visuals. VRodos now reserves that cost for high and ultra desktop profiles.
- Local Takram package checked: `@takram/three-clouds@0.7.6`.
- Source references: `node_modules/@takram/three-clouds/src/qualityPresets.ts` defaults `haze: true`; `node_modules/@takram/three-clouds/src/CloudsEffect.ts` exposes `get/set haze`; `node_modules/@takram/three-clouds/src/shaders/clouds.frag` ramps haze with `remapClamped(coverage, 0.2, 0.4)`.
- Takram `CloudsEffect` exposes `haze`; Takram's default quality preset enables it. In the cloud shader, the haze modulation ramps over coverage `0.2..0.4`, so it is fully active well before authored dense-overcast values like `0.7`.
- VRodos Horizon scenes already render sky and haze through Takram `SkyMaterial` plus constrained `AerialPerspectiveEffect`. Leaving the cloud haze path enabled there double-composites a screen-space haze/overlay that can read as a uniform rectangle rather than distinct cloud volume.
- Takram documents coverage as `0..1`; there is no documented `0.54` upper bound. The fix is to keep coverage authored/passed through and disable only the Takram cloud haze path in Horizon sky-owner mode.
- Follow-up finding from 0.70, 0.37, and 0.22 visual QA: after haze is disabled, Takram cloud shape should not be fixed by custom layer/weather tuning. Takram documents `coverageFilterWidth = 0.6` as the default filter width and states that values near `0` create sharp density transitions at the weather signal; it also states that `weatherExponent > 1` sharpens the weather gradient. VRodos therefore keeps Takram's default layers and weather controls in the desktop Horizon profile.
- Follow-up finding from symmetric-shape QA: Takram's shader tiles the local weather texture with cube-sphere UVs, and the source contains a `TODO` to tile/fix seams. Raising `localWeatherRepeat` far beyond the documented default exposed those cube/weather cells in local Horizon scenes, so VRodos keeps the documented default repeat value.
- Follow-up finding from daytime day/night QA: direct `SkyMaterial.shadowLength` routing can expose Takram's delayed screen-space shadow-length texture as a faint rectangular footprint on the already-rendered Horizon sky. VRodos now keeps this sky-material route disabled by default in Horizon and leaves it behind `?vrodos_debug_enable_pmndrs_cloud_sky_shadow_length=1` for comparison.
- Follow-up finding from below-horizon day/night QA: `CloudsEffect.atmosphereShadow` must be routed together with a valid `atmosphereShadowLength`. Keeping the shadow buffer routed while clearing shadow length can leave stale screen-space cloud-shadow structure in the AerialPerspective path.
- Follow-up finding from FPS QA: Takram cloud temporal upscaling is required for the desktop performance target. Disabling it forces full-resolution cloud raymarching and tanks FPS, so VRodos keeps it enabled by default and exposes full-resolution clouds only through `?vrodos_debug_disable_pmndrs_cloud_temporal_upscale=1` for visual comparison.
- PMNDRS `EffectComposer` applies fullscreen passes after the scene render, so it cannot directly change the directional light or shadow-map intensity that already lit PBR meshes.
- True local moving cloud shadows would require a projected shadow layer, sun-view depth, or extra GPU work. That is intentionally deferred.

## Implemented V1

- Cloud sun occlusion is enabled only when Takram cloud diagnostics report active clouds and valid effective coverage.
- The scalar uses effective cloud coverage and local sun direct-light visibility, so it works with dynamic day/night and disables itself at night.
- Direct sun light is dimmed most, sky probe less, hemisphere fill lightly, and ambient floor is unchanged. The current desktop calibration reaches about `0.48x` direct sun, `0.72x` sky probe, and `0.82x` fill at dense daytime overcast.
- The scalar is smoothed through the existing runtime light smoothing path to avoid day-night flicker.
- Diagnostics are published through PMNDRS cloud diagnostics, startup/runtime horizon logs, and runtime feature state.
- Takram `CloudsEffect.lightShafts` is enabled for high and ultra profiles and remains disabled for low and medium profiles.
- Authored cloud coverage remains `0..1` and is passed through to `CloudsEffect.coverage`; `effectiveCoverage` is retained as a diagnostic alias for future profile work.
- Takram `CloudsEffect.haze` is disabled in Horizon sky-owner mode because `SkyMaterial` and `AerialPerspectiveEffect` already own sky haze/transmittance there.
- Takram cloud layers stay on Takram defaults in the desktop Horizon profile. VRodos no longer applies a custom CloudLayer profile by default because the haze and shadow-routing issues are separate from cloud volume shape.
- Takram cloud temporal upscaling stays enabled by default; full-resolution cloud raymarching is debug-only because it is too expensive for the desktop target.
- Takram cloud light shafts remain available for high and ultra profiles, but VRodos skips them below coverage `0.35` to avoid making sparse low-coverage weather-mask cells read as hard crepuscular geometry.
- Horizon cloud shadow-length feeds `AerialPerspectiveEffect` only when the sun-shadow route is valid; the paired cloud `shadow` buffer is cleared at the same time. Direct `SkyMaterial.shadowLength` routing is disabled by default to avoid visible screen-space buffer footprints in the sky.
- The compile dialog treats Aerial Haze as the effective AerialPerspective composition pass: active clouds check and lock that control because the pass is required for cloud overlay/shadow routing, while preserving the authored toggle value for scenes without clouds.
- Cloud light shafts and sky `shadowLength` routing are horizon-aware: below-horizon/night scenes keep cloud overlays active but clear sun-shadow-length routing to avoid flat rectangular sky darkening.

## Progress

- [x] Docs reviewed: Takram atmosphere/clouds and PMNDRS pass ordering.
- [x] V1 approach selected: global light-source occlusion scalar.
- [x] Runtime source implemented.
- [x] Debug overlay/runtime diagnostics added.
- [x] Runtime documentation updated.
- [x] Runtime bundles rebuilt.
- [x] Static checks completed.
- [ ] Visual QA completed in a compiled desktop scene.

## Diagnostics

Expected diagnostic fields:

- `cloudSunOcclusionEnabled`
- `cloudSunOcclusionStrength`
- `cloudSunOcclusionReason`
- `cloudSunCoverageStrength`
- `cloudSunOcclusionTargetStrength`
- `cloudSunDirectFactor`
- `cloudSkyFactor`
- `cloudFillFactor`
- `cloudSunElevationFactor`
- `lightShafts`
- `lightShaftsSkippedReason`
- `temporalUpscale`
- `temporalUpscaleSkippedReason`
- `layerProfile`
- `haze`
- `hazeDisabledReason`
- `aerialShadowRouted`
- `aerialShadowReason`
- `skyShadowLengthReason`

## QA Notes

- Static verification completed with `node --check`, direct ESLint, runtime bundle rebuild, generated bundle syntax checks, and `git diff --check`.
- Visual QA has not been run in this environment; recompile a desktop PMNDRS Horizon scene before testing so cache-busted runtime chunks are used.
- Clouds disabled should match the previous lighting path.
- Coverage `0.35`, `0.75`, `0.9`, and `1.0` should progressively dim direct scene lighting without making terrain or GLBs unreadable.
- Coverage `0.22` should remain sparse and natural, without hard polygon/weather-cell islands around the sun.
- Coverage `0.7+` should report matching authored/effective coverage, `layerProfile=takram-default`, and `haze=false` with `hazeDisabledReason=horizon-sky-owner` in Horizon scenes; it must not render as a hard rectangle in the sky.
- Below-horizon day/night frames should report `aerialShadowRouted=false` with `aerialShadowReason=sun-below-horizon-or-unavailable`.
- Normal desktop scenes should report `temporalUpscale=true`; the debug override should report `temporalUpscale=false` with `temporalUpscaleSkippedReason=debug-disabled`.
- Daytime Horizon scenes should report `skyShadowLengthRouted=false` with `skyShadowLengthReason=horizon-sky-shadowlength-disabled` unless the debug comparison flag is enabled.
- Dynamic day/night should not flicker at sunrise or sunset.
- Night scenes should keep moon/night readability unchanged and should report `cloudSunOcclusionReason=sun-below-horizon`.
- Dense clouds should make lens flare, sun disk attenuation, and scene-light intensity move in the same visual direction.
- A screenshot with a cloud visually crossing the sun disk is a local occlusion case. V1 improves global overcast dimming and Takram light shafts, but does not yet project that exact cloud shape onto terrain lighting.

## Deferred

Projected moving terrain cloud shadows are deferred. They need a separate design because they would add GPU cost and require either sun-view scene depth, a terrain/screen projection layer, or material/shader integration.
