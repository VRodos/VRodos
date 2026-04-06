# Export-Focused Volumetric Clouds and Atmosphere on A-Frame/Three r173

## Summary

Use the Takram clouds/atmosphere work as the visual and architectural reference, but do not make a full Three.js upgrade the first step and do not depend on the raw upstream example as-is.

Implement a VRodos-owned runtime integration on top of the existing A-Frame 1.7.1 / Three r173 stack:

- Add a new exported scene feature for volumetric clouds + atmosphere in compiled A-Frame scenes.
- Feed it through the existing `scene-settings` metadata pipeline instead of hardcoding generated HTML.
- Reuse the current runtime quality/post-FX system for sizing, fallback, and performance control.
- Leave editor rendering unchanged in v1 except for whatever settings UI is needed to author the feature.

## Key Changes

- Extend scene metadata with a compact cloud contract:
  - `aframeCloudsEnabled`: `0|1`
  - `aframeCloudsPreset`: `subtle|balanced|dramatic`
  - `aframeCloudLayerHeight`: number, default `900`
  - `aframeCloudThickness`: number, default `280`
  - `aframeCloudCoverage`: number `0..1`, default `0.45`
  - `aframeCloudDensity`: number `0..1`, default `0.55`
  - `aframeCloudWindSpeed`: number, default `0.003`
  - `aframeAtmosphereEnabled`: `0|1`
  - `aframeCloudShadowsEnabled`: `0|1`
- Add the same fields to the `scene-settings` schema in `runtime/assets/js/master/components/vrodos_scene_settings.component.js`.
- Update the compiler in `includes/class-vrodos-compiler-manager.php` so both compiled clients receive the new settings through the existing `scene-settings` attribute string.
- Create a VRodos runtime module that ports the needed Takram-style cloud/atmosphere logic into the existing runtime bundle rather than loading new CDN dependencies at scene runtime.
- Hook that module into the current post-FX/render pipeline in `runtime/assets/js/master/vrodos_postprocessing.js` so cloud rendering runs before the existing composite/AA chain.
- Keep the current A-Frame environment sky/fog path as the fallback path. When volumetric mode is unavailable, downgrade automatically to the existing horizon sky + fog behavior.
- Add a minimal scene-authoring UI in the editor for:
  - enable/disable
  - preset
  - wind speed
  - cloud shadows toggle
  - optionally one advanced section for coverage/thickness if the UI already supports advanced render controls cleanly

## Runtime Behavior

- Default behavior:
  - `aframeAtmosphereEnabled=1`
  - `aframeCloudsEnabled=0`
  - preset default is `balanced`
- Capability rules:
  - Desktop, non-VR, `renderQuality=high|standard`: allow volumetric atmosphere and clouds.
  - Mobile, XR-presenting, or low-quality modes: disable volumetric clouds automatically and fall back to current sky/fog.
  - Cloud shadows run only in `renderQuality=high` and only when clouds are active.
- Rendering rules:
  - Atmosphere and clouds are scene-level effects, not per-object entities.
  - They must render identically from the same scene metadata in both master and simple compiled clients, subject to automatic quality fallback.
  - Existing fog remains active and is blended/tuned to match the atmosphere color ramp rather than removed outright.
- Dependency rule:
  - Do not upgrade the plugin to a newer Three.js release as part of v1.
  - Do not add runtime CDN imports for `@takram/*`; vendor or port the required logic into VRodos-controlled runtime code so compiled scenes stay self-contained.

## Test Plan

- Compile a scene with clouds disabled and verify output is visually unchanged from current baseline.
- Compile a scene with `balanced` clouds enabled and verify both master and simple clients render atmosphere + moving clouds on desktop.
- Verify mobile or XR mode downgrades to the existing sky/fog path without console errors.
- Verify `renderQuality=high` enables cloud shadows, while lower quality disables them cleanly.
- Verify toggling clouds off removes all cloud-specific runtime allocations and restores the baseline environment path.
- Verify old scenes with no cloud metadata still compile and load with defaults.

## Assumptions

- The plan is export/runtime first, not editor-preview parity.
- "Implement Takram three clouds and atmosphere" means "use Takram's approach as the source model," not "drop their demo packages directly into VRodos unchanged."
- The current A-Frame 1.7.1 / Three r173 stack remains the engine baseline for this feature.
- If direct Takram code proves incompatible with r173, the implementation still proceeds by porting the required shader/material/pass logic into a VRodos-owned adaptation layer rather than forcing a version upgrade.
