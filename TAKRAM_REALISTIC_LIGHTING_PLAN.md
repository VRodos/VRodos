# Takram-Realistic A-Frame Lighting Plan

## Purpose

This is the handoff plan for making compiled VRodos scenes look closer to the Takram vanilla atmosphere demo while preserving the A-Frame XR runtime.

The important finding is architectural: Takram's vanilla `post-process` atmosphere story is not just a tone-mapping preset. It renders scene geometry as albedo/unlit material and lets `AerialPerspectiveEffect` apply sun and sky lighting in post-process. VRodos currently renders authored A-Frame/GLB PBR content with Takram light-source lighting plus a PBR indirect bridge, so it cannot fully match the vanilla demo through exposure and fill-light tuning alone.

## Current State

Current runtime behavior is owned by [`RENDERING_PIPELINE.md`](RENDERING_PIPELINE.md). This file only tracks the realism roadmap and the architectural findings that should guide future Takram work.

Summary of the active baseline:

- Compiled scenes use the A-Frame/Three runtime declared in root package metadata; PMNDRS and Takram share A-Frame's existing `window.THREE`.
- Horizon/Takram scenes use Takram `SkyMaterial` for sky/sun ownership and Takram `SunDirectionalLight` / `SkyLightProbe` with a VRodos PBR indirect bridge for authored GLB materials.
- The shipped path is PMNDRS/Takram light-source PBR. Helper-light comparison mode is not exposed because it caused confusing non-product behavior during day-night validation.
- Takram procedural ground is disabled in local Horizon scenes; authored walkable-surface/navmesh GLBs remain the real scene ground.
- Low-light presets are calibrated as a PBR/light-source fix, not a renderer rewrite: night adds a cool VRodos-managed moon `DirectionalLight`, dawn/night use stronger Takram sky/PBR fill support, and default low-light exposure is raised only when tone-mapping exposure is not authored.
- Takram stars are a sky realism layer only. `stars.bin` is shipped locally from `assets/vendor/takram-atmosphere/stars.bin`; stars must not be treated as scene lights.

## Findings To Preserve

- Takram's vanilla demo `lighting: post-process` mode uses unlit materials for scene geometry. In the Basic story, terrain and foreground geometry switch to `MeshBasicMaterial` in post-process mode.
- Takram's vanilla post-process mode does not use scene `SunLight` / `SkyLight` objects. It uses `AerialPerspectiveEffect` with `sunLight` and `skyLight` enabled.
- Takram's light-source mode is different: it uses `SunDirectionalLight` and `SkyLightProbe` with normal materials, but it approximates atmospheric radiance at one point.
- Because that approximation can under-light authored GLB shadow sides compared with real-world sky bounce, VRodos uses a small PBR indirect bridge rather than trying to turn Takram ground into the authored scene ground.
- Moonlit night readability requires an explicit scene light in the current PBR path. Takram's sky moon and stars are visual atmosphere layers; they do not provide practical GLB scene illumination.
- Mixing PBR helper or physical lights with post-process `sunLight` / `skyLight` can double-light the scene or wash out colors.
- Takram lens flare is tied to the Takram Horizon sun. Its `LensFlareEffect` is a convolution effect and must stay in its own `EffectPass`.
- Takram `DitheringEffect` can add visible grain to texture-heavy compiled A-Frame scenes. Keep it out of the default path unless it is reintroduced as a measured opt-in.
- A-Frame classic script builds already own their Three instance. Loading latest Three beside classic A-Frame risks duplicate `THREE` instances, broken materials, mismatched render targets, and PMNDRS/Takram incompatibilities.
- The near-term Three upgrade route is A-Frame's planned r184 work, tracked at `aframevr/aframe#5818`, so VRodos should follow the shared A-Frame runtime upgrade instead of maintaining a separate r184 fork/import-map track.
- WebGPU stays experimental after the r184 upgrade. PMNDRS `EffectComposer`, GLSL/onBeforeCompile material hooks, Takram integration, and XR behavior still require separate validation before WebGPU can be a production performance fix.
- SSGI is not the first realism fix. It may help with near-field bounce/contact realism later, but it does not replace the Takram atmosphere lighting model.

## Phased Roadmap

### Phase 0 - Baseline Lock

Goal: keep the current stabilized runtime reproducible before adding a new lighting mode.

Status: landed for the current PBR/light-source path.

Deliverables:

- Keep one Horizon light-source path for compiled desktop scenes.
- Keep diagnostics reporting owner, reflection source, time preset, sun direction, light intensities, reflection scale, sun radius, A-Frame default-light state, LUT readiness, exposure, tone mapping, lens flare, correct altitude, and light source.
- Keep PMNDRS composer disabled during immersive XR.

Acceptance:

- Midday, early-morning, and golden-hour scenes keep readable shadow-side objects without returning to flat global illumination.
- Takram precompute startup keeps `SunDirectionalLight` / `SkyLightProbe` objects active while the hemisphere/ambient PBR bridge keeps the scene readable until irradiance textures are ready.
- `reflection=none` produces no material env-map reflections.
- Lens flare on/off no longer breaks the composer.

### Phase 1 - Explicit Horizon Lighting Mode

Goal: replace debug-only lighting ownership with an author-visible runtime setting.

Keep scene lighting ownership as a single shipped path:

- PMNDRS/Takram light-source PBR uses Takram `SunDirectionalLight` plus `SkyLightProbe`, with VRodos PBR indirect fill.
- A future desktop-only Takram vanilla prototype can be implemented behind a separate renderer experiment, not as a compile-dialog option in the current PBR path.

Acceptance:

- Existing scenes use the PBR light-source path on compiled desktop Horizon.
- Diagnostics show `lightSource=takram` unless the internal safety fallback is active.

### Phase 2 - Post-Process Albedo Prototype

Goal: build the first Takram-vanilla-style desktop mode without affecting XR.

Behavior:

- Enable `AerialPerspectiveEffect` with `sunLight`, `skyLight`, `transmittance`, and `inscatter`.
- Keep tone mapping after atmospheric lighting.
- Keep Takram lens flare as a separate pass.
- Temporarily render eligible opaque world meshes as cached albedo/unlit materials during PMNDRS composer rendering.
- Exclude UI, video, image panels, media planes, markers, avatars, and known transparent problem meshes.
- Keep transparent foliage bypassed or excluded until a dedicated mask/overlay strategy is validated.

Acceptance:

- Desktop midday and sunset look closer to Takram vanilla than the shipped PBR approximation.
- No double-lighting from A-Frame default lights, Takram physical lights, or any prototype albedo pass.
- XR still bypasses the composer and uses a stable fallback.

### Phase 3 - Visual Calibration

Goal: tune realism against representative VRodos scenes after the correct lighting model exists.

Tasks:

- Compare current PBR light-source behavior against any future desktop-only albedo prototype at exposure `1`, `5`, and `10`.
- Validate AgX, Reinhard, Cineon, ACES Filmic, and Linear tone mapping.
- Test midday, sunset, night, and dark/interior scenes.
- Re-evaluate SSAO strength, material env-map intensity, and PBR indirect values only after any post-process albedo prototype is working.
- Re-evaluate the PBR indirect profile only against representative scenes and profiler captures, not as a substitute for the future albedo lighting mode.
- Keep DitheringEffect off unless it is opt-in and verified not to add objectionable grain.

Acceptance:

- Midday is not washed out.
- Sunset retains correct contrast without losing all readable shadow detail.
- Dark scenes remain plausible without global flat fill.
- Texture grain is not introduced by the default PMNDRS path.

### Phase 4 - A-Frame r184 / WebGPU Spike

Goal: determine whether compiled scenes can move from the current Three r181 baseline to A-Frame's planned Three r184 runtime without breaking A-Frame XR.

Approach:

- Keep production on `classic-aframe-r181`.
- Track A-Frame's r184 upgrade work, especially `aframevr/aframe#5818`.
- Prefer the official A-Frame r184 upgrade path before any VRodos-specific runtime fork.
- Require exactly one shared Three instance for A-Frame, VRodos, loaders, PMNDRS, Takram, and addons.
- Test WebGPU only as an opt-in experimental renderer after r184 is stable.

Acceptance:

- A-Frame core, `aframe-extras`, networked-aframe, VRodos components, loaders, PMNDRS composer, and Takram atmosphere all bind to the same `THREE`.
- No duplicate Three globals or class-instance mismatches.
- Classic r181 remains available as the production fallback.
- WebGPU validation records which post-processing, material hook, Takram, and XR paths are compatible or need replacements.

### Phase 5 - SSGI Research Spike

Goal: evaluate screen-space global illumination only after the Takram lighting model is correct.

Candidate paths:

- Revalidate `realism-effects` against the active Three baseline.
- Evaluate newer Three SSGI/TSL options only inside the module-runtime spike.

Constraints:

- Desktop-only at first.
- Off in immersive XR.
- Must account for depth, normal, roughness, transparency, sky/fog, and custom material limitations.
- Must not be used to hide incorrect atmosphere/light ownership.

Acceptance:

- SSGI improves near-field bounce/contact realism in a controlled scene.
- It does not wash out midday, brighten night globally, or conflict with Takram atmosphere.

### Phase 6 - Clouds And Geospatial Expansion

Goal: add heavier Takram features only after the baseline lighting model is stable.

Candidates:

- Stars.
- Full geospatial date/time solar simulation.
- `LightingMaskPass` for mixed lighting.
- Volumetric clouds.

Acceptance:

- Each feature has its own visual smoke scene and does not regress the Horizon lighting modes.

## Verification Matrix

Run static checks after implementation phases:

- `npm run build:three`
- `npm run build:runtime`
- `npm run lint -- --quiet`
- JS syntax checks for edited sources and generated bundles
- PHP syntax checks for edited compiler/manager files
- `git diff --check`

Run visual checks at `http://wp.local:5832/Master_Client_766.html`:

- Midday exposure `1`, `5`, `10`.
- Sunset exposure `1`, `5`, `10`.
- Early-morning and golden-hour with Takram light-source default.
- Night with HDR/scene-probe reflection on and off.
- Lens flare on/off.
- Reflection source `none`.
- Enter and exit immersive XR with PMNDRS enabled.

## References

- Takram atmosphere docs: https://github.com/takram-design-engineering/three-geospatial/blob/main/packages/atmosphere/README.md
- Takram Basic story source: https://github.com/takram-design-engineering/three-geospatial/blob/main/storybook/src/atmosphere/Atmosphere-Basic.tsx
- A-Frame module/import-map FAQ: https://aframe.io/docs/1.7.0/introduction/faq.html
- Three.js SSGI discussion: https://discourse.threejs.org/t/ssgi-screen-space-global-illumination/85190
- `realism-effects`: https://github.com/0beqz/realism-effects
