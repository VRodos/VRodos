# Rendering History Summary

This file preserves the useful subject matter from the old rendering-history notes. It is history and debugging context, not the active TODO source of truth.

Current docs:

- `../../../RENDERING_PIPELINE.md`: canonical compiled rendering, post-FX, shadows, collision, reflection, and diagnostics reference.
- `../../compiled-desktop-roadmap.md`: current compiled desktop/non-VR cleanup goals and backlog.
- `../../compiled-headset-roadmap.md`: current standalone VR-headset baseline, active TODOs, and deferred experiments.
- `../../../VR_HEADSET_RUNTIME_HANDOFF.md`: current standalone headset policy and validation commands.
- `../../../PC_RENDERED_VR_PLAN.md`: parked PC-rendered VR plan.

## Consolidation Rationale

- The old files mixed shipped behavior, debug history, discarded experiments, and future TODOs. Keeping them as separate current-looking docs made it too easy to follow stale instructions.
- The active docs now split by responsibility: rendering reference, desktop roadmap, headset roadmap, headset handoff, and parked PCVR plan.
- This summary keeps the useful evidence from the old notes: accepted/rejected render paths, profiling lessons, asset-derivative constraints, collision decisions, shadow/reflection caveats, and Quest/headset findings.
- Removed files were historical source notes, not runtime source code. Their subject matter is preserved below, while active implementation details remain in the current docs listed above.
- Future work should move only the still-actionable item into the relevant active roadmap, then keep any old context here as evidence.

## Preserved Findings

### Post-FX And Color

- The legacy post-FX path originally had washout/color-space issues around render-target encoding. The retained runtime workaround is the `isXRRenderTarget`/sRGB target behavior in the legacy pipeline; current details live in `../../../RENDERING_PIPELINE.md`.
- The legacy pipeline remains valuable for desktop SSR, TAA, SAO, bloom, color grading, vignette, and FXAA, but Quest testing rejected legacy renderer overrides in immersive XR because they produced black-screen/tiled framebuffer artifacts.
- PMNDRS became the desktop composer path for AA, native SSAO, bloom, tone mapping, LUTs, color, vignette/noise/chromatic effects, and Takram atmospheric composition. PMNDRS still does not replace legacy SSR/TAA.

### Takram And Realism

- The accepted current desktop Horizon path is Takram light-source lighting for A-Frame/PBR content, not the Takram vanilla `post-process-albedo` model.
- The future Takram-vanilla target remains an explicit desktop-only `post-process-albedo` prototype. Do not fake that look by only raising helper fill, exposure, or bloom.
- Takram visible sky should keep Takram procedural ground disabled for local Horizon scenes so authored terrain/navmesh remains the actual ground.
- Takram cloud work shipped as opt-in desktop PMNDRS/Takram clouds with local assets and quality profiles. Cloud light shafts remain research-only until measured on representative scenes.
- Geospatial date/time solar simulation, `LightingMaskPass`, and related geospatial helper ideas remain research, not current implementation.

### Performance And Assets

- Profiling history established this workflow: use CDP/profile captures first, then Spector only for one-frame WebGL anatomy.
- Draco derivatives reduce transfer/startup size but do not automatically reduce draw calls, material switches, triangle cost after decode, or runtime FPS.
- The first safe Draco trial validated loader/decoder wiring by substituting a single derivative through profiler resource overrides without changing uploads or compiled HTML.
- A-Frame loads `meshoptDecoderPath` as a classic script. Generated clients must use `meshopt_decoder.js`, not the ESM `meshopt_decoder.module.js`.
- Active asset backlog moved to `../../compiled-desktop-roadmap.md`: KTX2/Basis texture derivatives first, then explicit opt-in LOD derivative families.
- Admin derivative storage uses cached files under uploads, metadata on the asset post, and explicit compile-use toggles. Missing/stale derivatives must fall back to the original GLB.

### Collision And Navigation

- The accepted v1 collision path is native static Three.js collision with `three-mesh-bvh`, not Rapier.
- The scene editor's `compiledCollisionEnabled` value is the source of truth; missing or false metadata compiles without player collision markers.
- `Walkable Surfaces` compile as both navmesh and collision sources. Hidden `Collision Proxy` assets compile as collision-only geometry through `vrodos-collider-helper`.
- Remaining hardening moved to `../../compiled-desktop-roadmap.md`: spawn-clearance diagnostics, collision triangle-count/BVH timing diagnostics, traversal presets, tighter corner behavior, and representative smoke scenes.

### Shadows, Terrain, And Reflections

- Cached/static shadows are the performance guardrail for desktop scenes; visible world geometry can cast/receive while walkable/navmesh ground is receiver-only by default.
- Large terrain stabilization uses camera-focused directional shadow fitting, terrain depth offset, and terrain soft self-shadow suppression.
- A future steep-face shadow proxy may be useful for terrain/navmesh surfaces, but it must be profiled before becoming default behavior.
- Shadow-aware reflection/glint suppression is a material shader hook, separate from SSR. It is disabled in immersive XR until headset-specific measurements justify revisiting it.

### VR Platform History

- Quest-class headset runtime accepted the A-Frame scene host, HMD/controller tracking, thumbstick locomotion, walkable collision/BVH, capped shadows, native renderer AA, scene-owned Takram visible sky/lights, and HDR env-map reflections.
- Quest testing rejected PMNDRS composer/cloud ownership and legacy post-FX composer ownership in immersive XR by default because both caused stereo/compositor instability.
- Public headset work is now the single `headset` profile. Old names such as `baseline`, `safe`, `takram-lights`, `takram-sky`, `hdr-reflections`, `balanced`, and `max` are compatibility inputs/lab history, not active public profiles.
- Active headset work moved to `../../compiled-headset-roadmap.md`: spatial UI interaction parity, controller ray/hit-dot behavior, movement/yaw smoothness diagnostics, headset shadow caps, and the archived right-stick shadow-yaw caveat.

## Removed Source Notes

The long historical files that fed this summary were consolidated to avoid parallel TODO lists:

- `TAKRAM_REALISTIC_LIGHTING_PLAN.md`
- `RENDERING_MIGRATION_IMPLEMENTATION_LOG.md`
- `POSTFX_DEBUG_NOTES.md`
- `PERFORMANCE_OPTIMIZATION_PLAN.md`
- `AFRAME_COLLISION_ROADMAP.md`
- `COMPILED_SCENE_PLATFORM_AUDIT_AND_VR_PARITY_PLAN.md`
