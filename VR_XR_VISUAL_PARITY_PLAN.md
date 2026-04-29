# VR/XR Visual Parity Fix

## Problem Summary

Clicking the compiled scene VR/fullscreen button can make the HORIZON sky/sea line vanish or darken compared with normal desktop mode. The intended behavior is visual parity: what is visible in desktop inline mode should remain visible in desktop fullscreen and in immersive VR/XR, with targeted fallbacks only for XR-unsafe effects.

## Suspected Root Cause

The runtime treats A-Frame `vr-mode` as a single state. `enter-vr` calls `syncPostProcessingState()`, and `shouldUsePostProcessing()` currently disables the post-processing pipeline whenever `a-scene` is in `vr-mode`. That conflates desktop fullscreen/A-Frame presentation with real WebXR headset presentation and can switch the scene from the authored desktop pipeline to direct renderer output.

## Implementation Phases

1. Mode Detection
   - Add helpers for inline desktop, desktop fullscreen/A-Frame fullscreen, and real immersive WebXR.
2. Post-FX Gating
   - Keep the desktop pipeline active for desktop fullscreen.
   - Use feature-specific XR decisions instead of dropping the entire visual stack.
3. Horizon/Atmosphere Preservation
   - Keep HORIZON/Takram sky, helper lights, tone mapping, exposure, color space, fog, and env-map settings synced across `enter-vr`, `exit-vr`, fullscreen, and resize.
   - Add one-time fallback warnings for XR-unsafe effects.
4. Verification
   - Inspect source paths, run available checks, and avoid modifying generated `runtime/build/` HTML.

## Completed Phase Log

- Phase 1 complete: added runtime presentation-mode helpers in `assets/js/runtime/master/components/vrodos_scene_settings.component.js` to distinguish `inline`, `desktop-fullscreen`, and `immersive-xr`. `isVrPresentationActive()` now maps to real immersive XR presentation instead of any A-Frame `vr-mode` state.
- Phase 2 complete: changed post-FX gating so desktop fullscreen/A-Frame `vr-mode` keeps the desktop post-processing pipeline. Real immersive WebXR now disables screen-space composers through an explicit direct-stereo fallback warning instead of silently dropping the pipeline.
- Phase 3 complete: added `syncPresentationVisualState()` and wired it to fullscreen changes plus `enter-vr`/`exit-vr`. Presentation transitions now re-apply render quality, HORIZON/background profile, env maps, post-FX state, and PMNDRS horizon sun positioning immediately and again after the canvas/session resize settles.
- Phase 4 complete: ran local lint verification and confirmed no generated `runtime/build/` HTML was modified.

## Test Results

- `npm run lint` was blocked by the local PowerShell execution policy for `npm.ps1`.
- `npm.cmd run lint` passed.
- `git diff -- runtime/build` returned no changes.
- Source changes are limited to `assets/js/runtime/master/components/vrodos_scene_settings.component.js` plus this tracker file.
