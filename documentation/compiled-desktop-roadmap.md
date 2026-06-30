# VRodos Compiled Desktop Roadmap

Status date: 2026-06-30.

This is the current coordination doc for compiled desktop and non-VR scene work. It consolidates active TODOs from the rendering, performance, collision, and framework notes while preserving historical findings under `documentation/archive/rendering-history/README.md`.

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

The runtime baseline is package/manifest driven:

- A-Frame metadata and package intent live in root `package.json`.
- Locked package versions live in root `package-lock.json`.
- Generated A-Frame, Three, PMNDRS, Takram, decoder, and BVH metadata lives in `assets/runtime-version-manifest.json`.
- Generated compiled-client chunk order, dependency, and lazy-feature coverage lives in `assets/runtime-build-manifest.json`.

The current public vendor baseline remains Three r184 with A-Frame's shared `window.THREE` substrate. Do not hardcode patch-level package versions in this roadmap; use the root package files and generated manifests as source of truth.

## Code Cleanup Goals

Active cleanup:

- Keep only `assets/vendor/three-r184/meshopt/meshopt_decoder.js` for A-Frame `meshoptDecoderPath`; the old `meshopt_decoder.module.js` generated-client compatibility copy is no longer produced.
- Support only the current `collision-proxy` category slug for hidden compiled blockers; the legacy `blocking-obstacles` alias is no longer normalized by the editor/compiler for new scenes.

Why this is code cleanup, not feature cleanup:

- New compiled scenes are regenerated from the current compiler, so old generated-client compatibility shims increase build and documentation surface without supporting an active authoring feature.
- A-Frame expects `meshoptDecoderPath` to resolve to the browser-global decoder file, so keeping the ESM `.module.js` copy beside it was only an old-output compatibility path.
- `collision-proxy` is the current authored helper category for hidden blockers. Keeping the older `blocking-obstacles` alias would preserve a stale content name in new compiler/editor behavior, while the actual collision feature remains unchanged.
- Runtime features with active owners stay intact: legacy post-FX, PMNDRS/Takram desktop rendering, networked clients, A-Frame Environment presets, current compiler output, and headset behavior.
- Desktop cleanup stops at shared fallback code unless a later focused audit proves a path is unreachable by active Master/Simple clients.
- Package versions are referenced through root package files and generated manifests because hardcoded patch numbers drift quickly during dependency updates.

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

- Standalone headset policy and validation checklist live in `VR_HEADSET_RUNTIME_HANDOFF.md`; the current headset TODO list lives in `documentation/compiled-headset-roadmap.md`.
- PC-rendered VR parent profile planning lives in `PC_RENDERED_VR_PLAN.md`.
- Immersive XR/headset Takram clouds remain deferred until PMNDRS stereo composer behavior is proven safe.
- Headset hidden profile cleanup should be done only when working on the VR runtime path.

## Historical Doc Index

Historical rendering, performance, Takram, collision, and VR-platform findings are consolidated in `documentation/archive/rendering-history/README.md`. Treat that file as evidence and implementation history, not as a competing active TODO list.

Current technical references:

- `README.md`: project overview and high-level current compiled runtime.
- `AGENTS.md`: agent handoff rules and build/verification expectations.
- `RENDERING_PIPELINE.md`: canonical current rendering and collision technical reference.
- `documentation/vrodos-compiled-scene-framework-integration.md`: framework boundaries, runtime ownership, lazy chunk selection, and spatial UI integration.
