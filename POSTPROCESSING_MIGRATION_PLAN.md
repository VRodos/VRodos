# Post-FX Migration Roadmap

Current-state roadmap for VRodos compiled-scene rendering. This file is no longer a full migration diary. It records the live runtime stack, the active architectural decisions, the current limitations, and the follow-up work that still matters.

For the end-user plugin overview, see [README.md](README.md). For the legacy custom pipeline internals, see [RENDERING_PIPELINE.md](RENDERING_PIPELINE.md).

## Status Snapshot

- Active compiled runtime: A-Frame metadata declared in root `package.json`
- Active Three vendor stack: `r181`, derived from the locked root `three` package
- Active post-FX model: dual-engine, per-scene selection
- Engine selector: `postFXEngine` with `legacy` and `pmndrs`
- Takram status: atmosphere integration is live with visual look presets
- Presentation parity status: desktop fullscreen preserves the desktop post-FX pipeline; immersive WebXR preserves scene-owned horizon/atmosphere/lighting state with targeted direct-stereo fallbacks for unsafe screen-space passes
- Cloud status: volumetric clouds are not shipped yet

## Current Runtime Model

VRodos now ships one active A-Frame + Three runtime pair and two desktop post-processing engines that can be selected per compiled scene.

### Runtime source of truth

The runtime package intent is pinned in:

- root `package.json`
- root `package-lock.json`

The build writes:

- `assets/runtime-version-manifest.json`
- `assets/vendor/<three-dir>/<three-bundle>`
- `assets/js/runtime/master/lib/vrodos-takram-atmosphere.bundle.js`

`VRodos_Render_Runtime_Manager` reads the generated manifest and exposes the same runtime config keys to PHP and editor globals.

### Engine model

- `legacy` is the original custom VRodos pipeline
- `pmndrs` is the composer-based pipeline built on `pmndrs/postprocessing`
- PMNDRS and N8AO globals are exported by `assets/js/runtime/master/lib/vrodos-postprocessing.bundle.js`; there is no separate `postprocessing.min.js` runtime file
- scenes select one engine through `postFXEngine`
- the two engines are intentionally isolated and do not share render targets or passes

## What Each Engine Owns Today

### Legacy engine

The legacy engine remains the feature-complete path for the original VRodos post-FX stack.

It currently provides:

- custom SAO
- custom SSR
- bloom
- color grading
- vignette
- FXAA
- optional TAA

Use `legacy` when a scene depends on:

- SSR
- TAA
- the older AO path
- the exact visual behavior of the custom VRodos pipeline

For the detailed pass-by-pass breakdown of the legacy renderer, see [RENDERING_PIPELINE.md](RENDERING_PIPELINE.md).

### PMNDRS engine

The PMNDRS engine is the current composer-based alternative for compiled desktop scenes.

It currently provides:

- `EffectComposer` / `EffectPass`-based rendering
- PMNDRS AA modes: `none`, `smaa`, `msaa`
- ambient occlusion through the shared AO presets, implemented with bundled `N8AOPostPass`
- bloom controls
- tone-mapping exposure control
- vignette controls
- noise and chromatic aberration controls
- Takram atmosphere look presets and advanced controls
- Takram sky ownership for the PMNDRS Horizon path

The PMNDRS engine does **not** provide these features in VRodos today:

- SSR
- TAA

## Current Architectural Decisions

These decisions are still active and should be treated as the source of truth.

### 1. Per-scene engine selection

- `postFXEngine` is the selector
- `legacy` and `pmndrs` are mutually exclusive
- there is no blending or hybrid post-FX chain between them

### 2. Legacy remains the SSR/TAA path

- scenes that require SSR stay on `legacy`
- scenes that require TAA stay on `legacy`
- PMNDRS keeps a narrower feature surface until a future replacement is proven

### 3. PMNDRS is a clean-room path

- no shared composer state with the legacy engine
- no shared render targets with the legacy engine
- PMNDRS-specific behavior lives in `assets/js/runtime/master/vrodos_postprocessing_pmndrs.js`

### 4. Presentation modes are intentionally separated

- inline desktop and desktop fullscreen use the same post-FX eligibility rules
- immersive WebXR is detected through `renderer.xr.isPresenting`, not generic A-Frame `vr-mode`
- immersive WebXR keeps scene-owned visuals active: Horizon/Takram sky, helper lights, fog, tone mapping/exposure, env-map state, and material profiles
- XR-unsafe screen-space composers are skipped through a direct stereo fallback with a one-time console warning, instead of disabling the whole visual stack silently

## Takram Status

Takram support in VRodos means atmosphere and sky integration today, not clouds.

### Live now

- Takram atmosphere resources are bundled locally
- PMNDRS scenes expose separate Takram atmosphere look and quality controls in the compile dialog
- PMNDRS Horizon helper-light intensities are scene-configurable through the compile dialog
- atmosphere looks: `sunrise`, `midday`, `sunset`, `night`, `custom`
- Takram resource quality: `performance`, `balanced`, `quality`, `cinematic`
- preset intensity and advanced sun/scattering controls are persisted into compiled `scene-settings`
- PMNDRS Horizon scenes use Takram sky ownership
- non-Horizon PMNDRS scenes can use `AerialPerspectiveEffect` when the runtime path is valid

### Not live yet

- Takram volumetric clouds

## Current Limitations

These are intentional or known current-state limitations, not future tense placeholders.

### Immersive XR limitations

- Screen-space post-FX composer passes are not forced in real immersive WebXR sessions.
- The fallback priority is visual continuity for scene-owned content and stereo correctness, not exact replication of every desktop-only screen-space pass.
- Desktop fullscreen is not treated as immersive XR and should retain the same post-FX path as inline desktop rendering.

### PMNDRS limitations

- PMNDRS does not provide SSR in VRodos today
- PMNDRS does not provide TAA in VRodos today
- PMNDRS ambient occlusion uses `N8AOPostPass` instead of `POSTPROCESSING.SSAOEffect` to avoid the previous depth-attachment blit conflict
- PMNDRS composer MSAA is disabled when ambient occlusion is active; use SMAA for PMNDRS AO scenes
- PMNDRS `AerialPerspectiveEffect` is skipped for Horizon backgrounds on the current runtime because that path still triggers depth-blit errors and visual artifacts

### Takram limitations

- atmosphere is the shipped Takram feature
- clouds are still deferred
- Horizon relies on Takram sky ownership first; atmosphere look presets are supported, while the full cloud path is still follow-up work

## Open Follow-Ups

Only live follow-up work belongs here.

### 1. Tune PMNDRS ambient occlusion

Goal:

- refine the N8AO preset mapping after visual testing across representative scenes

Current direction:

- keep the existing shared AO preset UI as the toggle surface
- adjust N8AO radius, falloff, intensity, and quality settings only after smoke testing
- avoid returning to `POSTPROCESSING.SSAOEffect` unless its depth path is proven stable on the pinned runtime

### 2. Revisit Horizon `AerialPerspectiveEffect`

Goal:

- determine whether Horizon can safely use the post-process aerial path on the current runtime

Current blocker:

- the Horizon path still shows the current depth-blit / white-cap class of failure when `AerialPerspectiveEffect` is used there

### 3. Add volumetric clouds

Goal:

- layer Takram clouds on top of the stabilized atmosphere baseline

Constraint:

- clouds should land only after the atmosphere baseline and PMNDRS ordering seam are stable

### 4. Re-evaluate the default engine only after parity goals are explicit

Current state:

- the scene schema still defaults to `legacy`
- the PMNDRS/Takram atmosphere default look is `midday`

Future flip to `pmndrs` should happen only if the team intentionally decides that the current PMNDRS trade-offs are acceptable for new scenes.

## Recommended Usage Right Now

- Choose `legacy` for scenes that need SSR, TAA, or the established custom AO/reflection look.
- Choose `pmndrs` for scenes that benefit from the newer composer path, PMNDRS AA modes, and Takram atmosphere looks.
- Treat Takram as an atmosphere/sky feature today, not a shipped cloud feature.

## Historical Notes

The long migration narrative that used to live in this file has been intentionally collapsed. The following points remain useful as short historical context:

- VRodos evaluated the older `r173` path during the earlier migration phase, but the active runtime target is now `r181`.
- `realism-effects` was explored historically for SSR/TRAA-style work but is not part of the live VRodos migration path.
- The old phase-by-phase go/no-go notes and bundle experiments are archived in git history and summarized in `RENDERING_MIGRATION_IMPLEMENTATION_LOG.md`.

If future work needs the detailed implementation diary, refer to `RENDERING_MIGRATION_IMPLEMENTATION_LOG.md` and git history instead of rebuilding that log here.
