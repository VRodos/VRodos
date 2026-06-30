# VRodos Compiled Desktop Roadmap

Status date: 2026-06-30.

This is the current coordination doc for compiled desktop and non-VR scene work. It consolidates active TODOs from the rendering, performance, collision, and framework notes without deleting the historical records under `documentation/archive/rendering-history/`.

## Scope

This roadmap is for desktop inline/fullscreen compiled scenes. Standalone headset behavior, immersive WebXR parity, and PC-rendered VR are intentionally deferred to their own pass.

Keep active features intact during cleanup:

- Legacy post-FX engine and controls.
- PMNDRS/Takram desktop rendering, atmosphere, lighting, lens flare, and clouds.
- Networked Master Client and Simple Client paths.
- A-Frame Environment support for non-Takram scenes.
- Headset/VR profile behavior, including legacy hidden profile normalization.
- Shared generic camera/layout fallbacks unless a focused runtime audit proves they are dead.

Assume new scenes are recompiled into the current pipeline. Already-generated HTML does not need old compatibility shims during this cleanup phase.

## Current Runtime Baseline

- A-Frame master dist commit `adf8f4e02b0499223b2c4fa93165e49b50384564`, declared in root `package.json`.
- Three.js vendor stack `r184`, derived from the locked `three: npm:super-three@0.184.0` root package alias.
- PMNDRS `postprocessing` `6.39.1`, exported as `window.POSTPROCESSING`.
- PMNDRS spatial UI packages: `@pmndrs/uikit` `1.0.74`, `@pmndrs/uikit-horizon` `1.0.74`, `@pmndrs/uikit-lucide` `1.0.74`, and `@pmndrs/pointer-events` `6.6.30`.
- Takram atmosphere `0.19.1`, geospatial effects `0.6.4`, and clouds `0.7.6`.
- `three-mesh-bvh` `0.9.10` for static compiled-scene collision acceleration.

Root `package.json`, `package-lock.json`, `assets/runtime-version-manifest.json`, and `assets/runtime-build-manifest.json` remain the generated/runtime source of truth.

## Code Cleanup Goals

Active cleanup:

- Keep only `assets/vendor/three-r184/meshopt/meshopt_decoder.js` for A-Frame `meshoptDecoderPath`; the old `meshopt_decoder.module.js` generated-client compatibility copy is no longer produced.
- Support only the current `collision-proxy` category slug for hidden compiled blockers; the legacy `blocking-obstacles` alias is no longer normalized by the editor/compiler for new scenes.

Deferred cleanup:

- VR/headset hidden profile names and policy normalization belong in a later VR-specific cleanup pass.
- Generic camera/layout fallbacks in shared runtime components should remain until a focused audit proves they cannot be reached by active Master/Simple clients.
- Asset CPT traits can be converted into concrete services after the current admin UI behavior is verified.
- Admin/dashboard enqueue ownership can be revisited if those scripts keep growing.

## Desktop Rendering Backlog

- Maintain the current A-Frame master plus Three r184 baseline until an explicit shared-runtime upgrade spike is opened.
- Keep smoke coverage for Horizon and non-Horizon PMNDRS scenes.
- Continue validating native PMNDRS SSAO across broader authored scenes.
- Prototype a desktop-only Takram `post-process-albedo` mode later; do not mix that experiment into the current Takram light-source path.
- Keep immersive XR composer/cloud bypass policy out of this desktop pass.

## Performance And Asset Backlog

- Add KTX2/Basis texture derivative generation for texture-heavy GLBs.
- After texture derivatives are stable, define explicit LOD derivative families such as `lod0`, `lod1`, and `lod2`.
- Keep derivative substitution explicit and per-asset opt-in. Do not silently downgrade uploaded source assets.
- Use profiler/Spector captures and visual parity checks before promoting new derivative families into compile selection.

## Collision Backlog

- Add spawn-clearance diagnostics for compiled walkable scenes.
- Add collision triangle-count and BVH build timing diagnostics.
- Add traversal presets: `Relaxed`, `Balanced`, and `Strict`.
- Tighten corner behavior where axis sliding and blocker rejection still feel sticky.
- Keep representative browser smoke scenes for walkable surfaces, hidden collision proxies, rough terrain recovery, and high-poly art with explicit proxy blockers.

## Research Only

- Steep-face shadow proxy for terrain shadows.
- Cloud light-shafts controls after measured visual and performance validation.
- Geospatial date/time solar simulation, `LightingMaskPass`, and related geospatial helper experiments.

## Deferred VR And PCVR Items

- Standalone headset policy and validation checklist live in `VR_HEADSET_RUNTIME_HANDOFF.md`.
- PC-rendered VR parent profile planning lives in `PC_RENDERED_VR_PLAN.md`.
- Immersive XR/headset Takram clouds remain deferred until PMNDRS stereo composer behavior is proven safe.
- Headset hidden profile cleanup should be done only when working on the VR runtime path.

## Historical Doc Index

Use these files as historical evidence and detailed implementation notes, not as a competing active TODO list:

- `documentation/archive/rendering-history/TAKRAM_REALISTIC_LIGHTING_PLAN.md`: phased Takram realism and Three-version planning history.
- `documentation/archive/rendering-history/RENDERING_MIGRATION_IMPLEMENTATION_LOG.md`: staged rendering migration implementation log.
- `documentation/archive/rendering-history/POSTFX_DEBUG_NOTES.md`: color, Horizon, and post-FX debug findings.
- `documentation/archive/rendering-history/PERFORMANCE_OPTIMIZATION_PLAN.md`: profiler, Spector, asset audit, and derivative optimization findings.
- `documentation/archive/rendering-history/AFRAME_COLLISION_ROADMAP.md`: static collision implementation history and later hardening ideas.
- `documentation/archive/rendering-history/COMPILED_SCENE_PLATFORM_AUDIT_AND_VR_PARITY_PLAN.md`: broader desktop/VR audit history and VR parity notes.

Current technical references:

- `README.md`: project overview and high-level current compiled runtime.
- `AGENTS.md`: agent handoff rules and build/verification expectations.
- `RENDERING_PIPELINE.md`: canonical current rendering and collision technical reference.
- `documentation/vrodos-compiled-scene-framework-integration.md`: framework boundaries, runtime ownership, lazy chunk selection, and spatial UI integration.
