# Takram Cloud Occlusion Plan

Status date: 2026-07-08.

## Summary

VRodos uses Takram's documented light-source lighting path for compiled desktop Horizon PBR scenes: `SunDirectionalLight`, `SkyLightProbe`, standard Three materials, and VRodos fill lights. Takram clouds remain a PMNDRS/Takram atmospheric post-process feature. The current cloud occlusion layer bridges those two paths by dimming existing scene lighting from cloud diagnostics and, for Horizon desktop scenes, from a sampled cloud-opacity value at the visible sun disk.

This is not a projected cloud-shadow map. It does not raymarch from every surface point to the sun and it does not enable Takram post-process `sunLight` / `skyLight` relighting for PBR materials. That deeper Takram route remains a separate experimental `takram-albedo` / mixed-lighting path.

## Findings

- Takram atmosphere docs separate post-process lighting from light-source lighting. Light-source lighting is compatible with built-in Three materials and uses `SunDirectionalLight` plus `SkyLightProbe`.
- Takram docs warn not to enable `AerialPerspectiveEffect.sunLight` or `skyLight` while also using `SunDirectionalLight` and `SkyLightProbe`, unless a proper lighting mask is used.
- Takram's mixed route exists conceptually through `LightingMaskPass`: albedo pixels can be relit by `AerialPerspectiveEffect`, while already-lit PBR pixels must be masked out.
- Takram clouds expose atmospheric overlay, shadow, and shadow-length outputs for composition with `AerialPerspectiveEffect`.
- Takram clouds are a PMNDRS/postprocessing effect. They are primarily intended to render cloud buffers and composite through `AerialPerspectiveEffect`, not to mutate already-rendered scene lights automatically.
- Takram clouds also expose a documented `lightShafts` option for volumetric sun/cloud visuals. VRodos now reserves that cost for high and ultra desktop profiles.
- Local Takram package checked: `@takram/three-clouds@0.7.6`.
- Source references: `node_modules/@takram/three-clouds/src/qualityPresets.ts` defaults `haze: true`; `node_modules/@takram/three-clouds/src/CloudsEffect.ts` exposes `get/set haze`; `node_modules/@takram/three-clouds/src/shaders/clouds.frag` ramps haze with `remapClamped(coverage, 0.2, 0.4)`.
- Takram `CloudsEffect` exposes `haze`; Takram's default quality preset enables it. In the cloud shader, the haze modulation ramps over coverage `0.2..0.4`, so it is fully active well before authored dense-overcast values like `0.7`.
- VRodos Horizon scenes already render sky and haze through Takram `SkyMaterial` plus constrained `AerialPerspectiveEffect`. Leaving the cloud haze path enabled there double-composites a screen-space haze/overlay that can read as a uniform rectangle rather than distinct cloud volume.
- Takram documents coverage as `0..1`, but shader inspection shows the default layers saturate visually near `1 - coverageFilterWidth` (`~0.4`) because zero-weather texels begin receiving density. VRodos therefore keeps authored coverage as `0..1` but maps dense Horizon values before assigning `CloudsEffect.coverage`.
- Follow-up finding from 0.70, 0.37, and 0.22 visual QA: after haze is disabled, the remaining high-coverage slab comes from Takram's density modulation, not from cloud haze/shadow. Takram documents `coverageFilterWidth = 0.6` as the default filter width; in the shader this means authored dense values cannot be passed directly as the shader coverage control for Horizon's default local profile.
- Follow-up finding from symmetric-shape QA: Takram's shader tiles the local weather texture with cube-sphere UVs, and the source contains a `TODO` to tile/fix seams. Raising `localWeatherRepeat` far beyond the documented default exposed those cube/weather cells in local Horizon scenes, so VRodos keeps the documented default repeat value.
- Follow-up finding from daytime day/night QA: direct `SkyMaterial.shadowLength` routing can expose Takram's delayed screen-space shadow-length texture as a faint rectangular footprint on the already-rendered Horizon sky. VRodos now keeps this sky-material route disabled by default in Horizon and leaves it behind `?vrodos_debug_enable_pmndrs_cloud_sky_shadow_length=1` for comparison.
- Follow-up finding from below-horizon day/night QA: `CloudsEffect.atmosphereShadow` must be routed together with a valid `atmosphereShadowLength`. Keeping the shadow buffer routed while clearing shadow length can leave stale screen-space cloud-shadow structure in the AerialPerspective path.
- Follow-up finding from FPS QA: Takram cloud temporal upscaling is required for the desktop performance target. Disabling it forces full-resolution cloud raymarching and tanks FPS, so VRodos keeps it enabled by default and exposes full-resolution clouds only through `?vrodos_debug_disable_pmndrs_cloud_temporal_upscale=1` for visual comparison.
- Follow-up finding from midday 0.70 QA: Takram's documented Clouds + AerialPerspective route keeps `CloudsEffect.skipRendering` true. CloudsEffect still renders its internal cloud buffers, but final cloud color is routed through `atmosphereOverlay` into AerialPerspectiveEffect. Clearing `skipRendering` while also routing the overlay double-composites clouds and can amplify screen-space artifacts.
- Follow-up finding from 0.33 vs 0.70 QA: the sparse case stays clean because Horizon keeps Takram light shafts off below the coverage threshold. The high-coverage case exposed large screen-space shaft/shadow footprints, so Horizon now keeps cloud light shafts and aerial cloud shadow/shadow-length routing debug-only while preserving the visible cloud overlay and global cloud-sun occlusion scalar.
- Follow-up finding from dark-frame QA: Horizon cloud scenes force `AerialPerspectiveEffect` on for cloud overlay composition. If Takram clouds stay in direct color-composite mode before that route is ready, below-horizon/night frames can receive an almost black cloud buffer over the scene. Horizon now disables direct cloud compositing whenever the aerial compositor is expected; if the compositor is not ready, clouds fail closed instead of darkening the view.
- Follow-up finding from Takram's `clouds/Clouds -- Vanilla` and `Clouds -- Basic` Storybook references: the reference composes `CloudsEffect` with `Atmosphere`, `SunDirectionalLight`, `SkyLight`, a normal pass, and tone mapping inside the PMNDRS/Takram effect chain. The sun does not stay as a hard independent disk over cloud color; when cloud crosses it, it reads as a cloud-integrated veiled glow and can disappear in dense cloud. In the Basic demo, `accuratePhaseFunction=true`, `accurateSunSkyLight=true`, `multiScatteringOctaves=8`, temporal upscale remains enabled, and cloud shadow max far is `100000`. VRodos should tune the desktop bridge toward that diffuse occlusion behavior, not toward a crisp billboard disk.
- PMNDRS `EffectComposer` applies fullscreen passes after the scene render, so it cannot directly change the directional light or shadow-map intensity that already lit PBR meshes.
- Therefore, in the current `lit-pbr` path, cloud-driven lighting changes must be fed back into VRodos-managed light sources before the next render. Sampling the previous cloud buffer around the projected sun disk is a supported bridge for desktop Horizon scenes, not a replacement for true Takram post-process albedo lighting.
- True local moving cloud shadows would require a projected shadow layer, sun-view depth, or extra GPU work. That is intentionally deferred.

## Strategy Roadmap

### Phase 1: Desktop `lit-pbr` Cloud-Sun Bridge

Keep the current production path: A-Frame renders PBR scene content, Takram owns sky/cloud post-processing, and VRodos owns the scene lights. Desktop Horizon clouds drive:

- global cloud coverage dimming as the fallback overcast signal;
- sampled sun-disk cloud opacity as the local "cloud crossed the sun" signal;
- `SunDirectionalLight`, `SkyLightProbe`, hemisphere fill, ambient bounce, reflection intensity, direct sun shadow opacity/softness, and Takram lens flare intensity;
- runtime diagnostics for every factor so QA can see whether the bridge is active.

Limitations:

- The sun-disk sample reads Takram's cloud render target from the previous frame and is smoothed, so it can lag by a frame and by the configured light-smoothing window.
- It is view-dependent: it answers "is the visible sun disk covered by rendered cloud opacity from this camera?", not "is every point in the world in a cloud shadow?".
- It keeps direct sun shadows active, but lowers their contrast through reduced direct light and softens them through a cloud-driven shadow-radius scale. It does not project the visible cloud shape onto terrain or GLBs.
- High and ultra desktop cloud quality let Takram's accurate phase-function path own the visible sun/cloud integration. Low/medium profiles and debug-disabled accurate phase can still use the older VRodos sprite fallback when the sampled projected disk is covered.
- It is desktop-only in this phase. Immersive XR/headset clouds stay disabled by policy.

### Phase 2: Validation And Authoring Polish

- Validate compiled desktop Horizon scenes with day-night cycle active, cloud coverage `0.22`, `0.35`, `0.70`, and `0.90`, and the sun moving behind visible cloud masses.
- Tune the bridge only after confirming diagnostics change: `cloudSunDiskOcclusion`, `cloudSunDiskStrength`, light factors, `cloudSunShadowIntensityFactor`, and `cloudSunShadowRadiusScale`.
- Add an author-facing control only after visual QA proves a stable range. Until then, keep the bridge automatic and diagnostic-driven.

### Phase 3: Experimental `takram-albedo` / Mixed Lighting

Keep this out of the production `lit-pbr` path until it is a deliberate mode. It would entail:

- a new render mode or material partition where selected scene content is rendered as albedo, likely with `MeshBasicMaterial`-style output;
- `AerialPerspectiveEffect.sunLight` and `skyLight` enabled only for albedo pixels;
- `LightingMaskPass` or equivalent masking so already-lit PBR objects are not double-lit;
- clear behavior for media planes, emissive/readability boosts, transparent materials, SSAO, bloom, reflections, and shadows;
- scene/compiler metadata to decide which objects participate in albedo relighting and which remain standard PBR;
- separate desktop QA scenes before any VR/headset consideration.

This is feasible, but it is a new pipeline mode, not a value tweak inside the current PBR bridge.

## Implemented Desktop Bridge

- Cloud sun occlusion is enabled only when Takram cloud diagnostics report active clouds and valid authored coverage.
- The scalar uses authored cloud coverage, sampled visible sun-disk opacity, and local sun direct-light visibility, so it works with dynamic day/night and disables itself at night.
- The sun-disk sampler reads Takram's cloud render target around the projected sun disk in desktop Horizon scenes. If readback is unavailable, the bridge fails closed to coverage-only behavior and reports the sample reason.
- Direct sun light is dimmed most, sky probe less, hemisphere fill and ambient bounce less, and reflections are attenuated to avoid bright specular response under overcast conditions. Dense daytime sun-disk occlusion can reach about `0.18x` direct sun, `0.56x` sky probe, `0.66x` fill, `0.78x` ambient, and `0.68x` reflections.
- Direct sun shadows keep casting when the sampled sun disk is cloud-covered, but their contrast drops with direct sun intensity, their `shadow.intensity` is lowered, and their radius increases with cloud occlusion strength. This avoids hard on/off shadow transitions while still making dense overcast shadows lighter and softer.
- Visible desktop sun-disk attenuation now prefers Takram's accurate cloud phase path for high and ultra cloud quality. Those profiles apply `accuratePhaseFunction=true`, `accurateSunSkyLight=true`, `multiScatteringOctaves=8`, `shadow.farScale=1`, and `shadow.maxFar=100000`, then keep the native Takram sky sun behind the cloud/AerialPerspective composition (`cloudSkySunDiskMode=takram-phase`). This matches the Takram Basic demo more closely than a billboard disk.
- The previous safe sprite bridge remains as a fallback for low/medium cloud quality, debug-disabled accurate phase, or future compatibility cases. In that fallback, when the desktop Horizon cloud sampler reports that the projected sun disk is covered, VRodos disables the native Takram disk through the public material `sun` flag and renders the existing VRodos sun sprite at the presented sun direction. Clear-sun frames keep the native Takram disk even if clouds exist elsewhere in the sky.
- The scalar is smoothed through the existing runtime light smoothing path to avoid day-night flicker.
- Diagnostics are published through PMNDRS cloud diagnostics, startup/runtime horizon logs, and runtime feature state.
- Takram `CloudsEffect.lightShafts` is enabled for high and ultra profiles and remains disabled for low and medium profiles.
- The only cloud controls exposed to authors remain enable, quality, and coverage. Tone mapping, location, and local date/time stay existing author controls. The deeper Takram cloud parameters above are profile-owned diagnostics for now, not raw UI sliders.
- Authored cloud coverage remains `0..1`; Horizon maps it into a Takram shader coverage value that preserves `0..0.35` and smoothly compresses dense authored values into roughly `0.35..0.395`. Diagnostics report `authoredCoverage` and `effectiveCoverage`.
- Takram `CloudsEffect.haze` is disabled in Horizon sky-owner mode because `SkyMaterial` and `AerialPerspectiveEffect` already own sky haze/transmittance there.
- Takram cloud layers stay on Takram defaults in the desktop Horizon profile. VRodos no longer applies a custom CloudLayer profile by default because the haze and shadow-routing issues are separate from cloud volume shape.
- Takram cloud temporal upscaling stays enabled by default; full-resolution cloud raymarching is debug-only because it is too expensive for the desktop target.
- Takram cloud light shafts remain available for high and ultra profiles outside Horizon, but Horizon keeps them behind `?vrodos_debug_enable_pmndrs_cloud_light_shafts=1` because high-coverage local scenes exposed large screen-space shaft footprints.
- Horizon routes only the cloud `atmosphereOverlay` into `AerialPerspectiveEffect` by default. Cloud `atmosphereShadow` / `atmosphereShadowLength` routing is available behind `?vrodos_debug_enable_pmndrs_cloud_aerial_shadow=1`; direct `SkyMaterial.shadowLength` routing remains behind `?vrodos_debug_enable_pmndrs_cloud_sky_shadow_length=1`.
- The compile dialog treats Aerial Haze as the effective AerialPerspective composition pass: active clouds check and lock that control because the pass is required for cloud overlay/shadow routing, while preserving the authored toggle value for scenes without clouds.
- Cloud light shafts and shadow-length routing are horizon-aware: default Horizon scenes keep cloud overlays active but clear sun-shadow-length routing to avoid flat rectangular sky darkening.
- Takram `CloudsEffect.skipRendering` stays true in the routed AerialPerspective path and is only cleared if VRodos has no AerialPerspectiveEffect to receive the cloud overlay.

## Progress

- [x] Docs reviewed: Takram atmosphere/clouds and PMNDRS pass ordering.
- [x] Current approach selected: keep `lit-pbr` production path, add desktop sun-disk bridge, defer `takram-albedo` / mixed lighting.
- [x] Runtime source implemented for sampled desktop sun-disk occlusion.
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
- `cloudAmbientFactor`
- `cloudReflectionFactor`
- `cloudSunShadowIntensityFactor`
- `cloudSunShadowRadiusScale`
- `multiScatteringOctaves`
- `accurateSunSkyLight`
- `accuratePhaseFunction`
- `accuratePhaseFunctionSkippedReason`
- `shadowFarScale`
- `shadowMaxFar`
- `cloudSkySunDiskVisibility`
- `cloudSkySunDiskTargetVisibility`
- `cloudSkySunDiskSpriteOpacity`
- `cloudSkySunDiskScreenOpacity`
- `cloudSkySunDiskMode`
- `cloudSunDiskOcclusion`
- `cloudSunDiskStrength`
- `cloudSunDiskUvX`
- `cloudSunDiskUvY`
- `cloudSunDiskSampleReason`
- `cloudSunDiskSampleAgeMs`
- `cloudSunDiskSampleCount`
- `cloudSunElevationFactor`
- `lightShafts`
- `lightShaftsSkippedReason`
- `temporalUpscale`
- `temporalUpscaleSkippedReason`
- `layerProfile`
- `haze`
- `hazeDisabledReason`
- `directCompositeEnabled`
- `aerialOverlayRouted`
- `aerialShadowRouted`
- `aerialShadowReason`
- `skyShadowLengthReason`

## QA Notes

- Static verification completed with `node --check`, direct ESLint, runtime bundle rebuild, generated bundle syntax checks, and `git diff --check`.
- Visual QA has not been run in this environment; recompile a desktop PMNDRS Horizon scene before testing so cache-busted runtime chunks are used.
- Clouds disabled should match the previous lighting path.
- Coverage `0.35`, `0.75`, `0.9`, and `1.0` should progressively dim direct scene lighting without making terrain or GLBs unreadable.
- Coverage `0.22` should remain sparse and natural, without hard polygon/weather-cell islands around the sun.
- Coverage `0.7+` should report authored/effective coverage split, for example authored around `0.70` and effective around `0.38`, plus `layerProfile=takram-default` and `haze=false` with `hazeDisabledReason=horizon-sky-owner` in Horizon scenes; it must not render as a hard rectangle in the sky.
- Midday coverage `0.7` should render visible clouds after the generated scene is recompiled. In Horizon, diagnostics should report `direct-composite-off`, `aerial-overlay-on`, `shafts-skip-horizon-light-shafts-disabled`, and `aerial-shadow-horizon-aerial-shadow-disabled`.
- Below-horizon day/night frames should report `aerialShadowRouted=false` with `aerialShadowReason=sun-below-horizon-or-unavailable`.
- Normal desktop scenes should report `temporalUpscale=true`; the debug override should report `temporalUpscale=false` with `temporalUpscaleSkippedReason=debug-disabled`.
- Daytime Horizon scenes should report `skyShadowLengthRouted=false` with `skyShadowLengthReason=horizon-sky-shadowlength-disabled` unless the debug comparison flag is enabled.
- Dynamic day/night should not flicker at sunrise or sunset.
- Night scenes should keep moon/night readability unchanged and should report `cloudSunOcclusionReason=sun-below-horizon`.
- Dense clouds should make lens flare, visible sun disk attenuation, scene-light intensity, reflections, direct sun shadow opacity, and direct sun shadow softness move in the same visual direction.
- A screenshot with a cloud visually crossing the sun disk is the target local occlusion case for the desktop bridge. High/ultra quality should report `cloudSunDiskSampleReason=sampled`, `accuratePhaseFunction=true`, `cloudSkySunDiskMode=takram-phase`, rising `cloudSunDiskOcclusion`, lower `cloudSkySunDiskVisibility`, no sprite/screen overlay, lower direct/sky/fill/ambient/reflection factors, lower `cloudSunShadowIntensityFactor`, and higher `cloudSunShadowRadiusScale` when the disk is heavily covered. Low/medium or debug-disabled accurate phase can report `cloudSkySunDiskMode=sprite` instead. If clouds are present but not crossing the projected sun disk, `cloudSkySunDiskMode` should remain `native`.
- The bridge still does not project the exact cloud silhouette onto terrain lighting. If a cloud covers only part of the sun disk, the scene-level light response should be plausible and smooth, not a per-surface cloud-shadow match.

## Deferred

Projected moving terrain cloud shadows are deferred. They need a separate design because they would add GPU cost and require either sun-view scene depth, a terrain/screen projection layer, or material/shader integration.

The `takram-albedo` / mixed-lighting mode is also deferred from this production fix. It is feasible through Takram's documented post-process lighting and masking concepts, but it must be introduced as a separate desktop experimental mode with its own material partition, masks, composer order, and QA matrix.

PMNDRS `GodRaysEffect` / screen-space god rays are deferred to a separate implementation. They are not cloud-aware by default in the current path because Takram clouds are a post-process cloud buffer, not scene geometry in the normal depth buffer; Takram `CloudsEffect.lightShafts` remains the cloud-aware ray candidate.

True native Takram `SkyMaterial` shader patching remains deferred. A runtime shader-patch attempt could black out the sky and drop frame rate in compiled Horizon scenes, so production high/ultra uses Takram cloud phase scattering, and the sprite bridge remains only a fallback path.
