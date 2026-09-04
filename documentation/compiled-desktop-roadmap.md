# VRodos Compiled Desktop Roadmap

Status date: 2026-09-04.

This is the single active backlog for compiled desktop inline and fullscreen scenes. Current rendering behavior belongs in `../RENDERING_PIPELINE.md`; framework and lifecycle ownership belongs in `vrodos-compiled-scene-framework-integration.md`; completed investigations belong in `archive/rendering-history/README.md`.

## Scope And Baseline

- Preserve both supported desktop post-FX engines: Legacy for SSR/TAA/custom SAO and PMNDRS for modern AA/AO, finishing effects, and Takram atmosphere.
- Preserve the package/manifest-driven A-Frame 1.8.0 master artifact and shared Three r185 runtime. A later A-Frame/Three upgrade is a separate migration.
- Preserve single-player and networked Master/Simple compile targets, A-Frame Environment for non-Takram scenes, static BVH collision, and explicit per-asset derivative selection.
- Treat new scenes as freshly compiled into the current project publication. Legacy `runtime/build/` HTML and published upload artifacts are not source or compatibility targets.
- Keep immersive WebXR and standalone headset policy out of desktop rendering changes unless the headset roadmap explicitly makes them shared work.

## Active Desktop Acceptance

### Adaptive Performance Profiles

Desktop compilation now has four editor tabs: Custom, Low, Medium, and High. Custom is the canonical authored scene and exact fixed-build profile. Low/Medium/High contain only bounded performance controls from schema v2 of `assets/desktop-performance-profiles.json`; editing one changes its badge from `Default` to `Modified`. High retains the authored feature set and is the adaptive visual ceiling. Artistic values such as time, color, exposure/look, cloud coverage/style/wind, transforms, materials, movement, and interactions remain shared and never affect tier badge state.

The compile dialog exposes an explicit build-mode decision:

- Adaptive Low/Medium/High prepares and publishes all three immutable profile derivatives. A lightweight pre-A-Frame capability probe chooses one profile, and only that profile's runtime chunks and GLBs are requested.
- Custom only prepares, publishes, and loads `desktop-custom` with original textures and geometry plus safe Draco. It does not include the hardware probe, adaptive query override, recommendation, or automatic downgrade path.

Low uses 1024px-class KTX2 textures, a 96 MiB scene target, 50% geometry, Low clouds without shafts when High enables clouds, and the Performance render policy. Medium uses 2048px-class KTX2 textures, a 192 MiB target, 80% geometry, Off/SMAA Low/Medium controls, Low/Medium clouds without shafts, and the Standard render policy. High preserves authored textures and geometry with safe Draco compression. Collision/navigation assets plus skinned or morph-target GLBs are never simplified.

Remaining acceptance:

- [ ] Profile Corinth Low/Medium/High publications on representative low-, mid-, and high-end desktop hardware.
- [ ] Confirm forced profile loads never request unselected GLBs or optional chunks in production browser traces.
- [ ] Confirm collision/navigation parity and visual hierarchy for every derivative family before deployment.

### Cloud Light Shafts And Weather

The author-facing `pmndrsCloudsLightShaftsEnabled` control is implemented and defaults on. It requests Takram's cloud-aware shaft path without changing cloud quality. High/Ultra desktop daytime scenes can make the request effective; Low/Medium, immersive XR, below-horizon sun, unavailable resources, or an unchecked control must produce an explicit skip reason.

The remaining acceptance work is a freshly compiled desktop PMNDRS Horizon scene:

- [ ] High and Ultra daytime clouds show shafts when Light Shafts is checked.
- [ ] Unchecking Light Shafts removes only shafts; clouds, haze, cloud/sun occlusion, reflections, and lens-flare attenuation remain visually unchanged.
- [ ] Low and Medium report `profile-disabled` without changing the selected cloud quality.
- [ ] Below-horizon/night scenes report `sun-below-horizon` and retain no stale shaft buffer.
- [ ] The unchecked control reports `lightShaftsRequested=false`, `lightShafts=false`, and `lightShaftsSkippedReason=author-disabled`.
- [ ] SSAO off and on both retain correct shared `NormalPass` ownership.
- [ ] Horizon local-weather UV diagnostics report `cloudWeatherUvMode=local-tangent` and `cloudWeatherUvPatchApplied=true`, without cube-sphere seam blocks.
- [ ] Coverage remains visibly monotonic across styles, including representative values `0.27`, `0.5`, and `0.7+`.
- [ ] The regrouped build dialog remains usable at wide and narrow widths.

The contract, compiler serialization, runtime gates, diagnostics, generated bundles, and automated/static acceptance checks are complete. Do not mark this visual checklist complete from static tests or desktop WebXR emulator evidence.

### General Rendering

- Keep representative Horizon and non-Horizon PMNDRS browser smoke scenes.
- Continue validating native PMNDRS SSAO across broader authored scenes.
- Validate the cloud/sun lighting bridge through a full day-night cycle: direct/indirect light factors, reflections, shadow contrast/softness, native sun visibility, and lens flare must move in the same direction as sampled cloud coverage.
- Keep `cloudSkySunDiskMode=takram-phase` as the High/Ultra target. The VRodos sun sprite is a Low/Medium or debug fallback, not the target desktop look.

## Performance And Asset Backlog

- Validate the implemented KTX2/Basis desktop profile derivatives across the representative production asset set.
- After profile derivatives are stable, define explicit opt-in runtime LOD families such as `lod0`, `lod1`, and `lod2` only if measured scenes still need them.
- Keep derivative substitution explicit and per asset. Never silently downgrade uploaded source assets.
- Use profiler/Spector captures and visual parity checks before promoting a derivative family into compile selection.

## Collision Backlog

- Add spawn-clearance diagnostics for compiled walkable scenes.
- Add collision triangle-count and BVH build-time diagnostics.
- Add traversal presets: `Relaxed`, `Balanced`, and `Strict`.
- Tighten sticky corner behavior without regressing blocker rejection or rough-terrain recovery.
- Keep representative browser smoke scenes for walkable surfaces, collision proxies, rough terrain, and high-poly art with explicit proxy blockers.

## Research Only

- PMNDRS `GodRaysEffect`. It is not cloud-aware by default because Takram clouds live in post-process buffers rather than ordinary scene depth; do not treat it as a replacement for Takram cloud light shafts.
- Projected moving cloud shadows on terrain or meshes.
- Desktop-only Takram `post-process-albedo` / mixed-lighting mode.
- Steep-face terrain shadow proxies.
- Native Takram `SkyMaterial` shader patching.
- Geospatial date/time solar simulation and broader geospatial helpers.
- WebGPU and future A-Frame/Three upgrades as isolated runtime migrations.

## Deferred XR Work

Standalone headset and parked PC-rendered VR work live in `compiled-headset-roadmap.md`. Takram clouds remain disabled in the public standalone headset profile until stereo PMNDRS ownership is proven safe on device.

## Documentation Ownership

- `../README.md`: product overview, workflow, setup, and documentation map.
- `../RENDERING_PIPELINE.md`: current rendering, lighting, cloud, shadow, collision, reflection, diagnostics, and profiling behavior.
- `compiler-architecture.md`: compiler request, settings, plan, artifact, and security boundaries.
- `vrodos-compiled-scene-framework-integration.md`: A-Frame/Three ownership, lazy chunks, XR lifecycle, and spatial UI.
- `compiled-headset-roadmap.md`: standalone headset policy, device validation, and parked PCVR work.
- `runtime-library-audit.md`: test-enforced locked library inventory and provenance.
- `archive/rendering-history/README.md`: historical evidence only; never a competing active TODO list.
