# VR Headset Runtime Handoff

Date: 2026-06-23

For the current standalone VR-headset TODO list and deferred experiment backlog, see `documentation/compiled-headset-roadmap.md`.

This is the current continuation note for standalone headset runtime work. Historical staged headset rendering experiments have been retired as supported runtime profiles; older generated scenes should be recompiled into the current pipeline.

## Supported Parent Profiles

- `desktop`: full desktop/browser rendering.
- `headset`: standalone headset rendering, lean by default now and expandable only through explicit validated feature work.
- `pc-rendered-vr`: PCVR/WebXR path from `PC_RENDERED_VR_PLAN.md`, parked until real PCVR hardware/runtime validation.

Legacy profile names such as `baseline`, `safe`, `takram-lights`, `takram-sky`, `hdr-reflections`, `balanced`, and `max` are compatibility inputs only. Runtime/editor/compiler normalization maps them to `headset`; do not add new behavior behind those aliases.

## Current Headset Policy

- Keep WebXR/A-Frame as the owner of HMD and controller tracking.
- Keep `#player` as an unpositioned tracking rig.
- Keep authored camera placement on `#cameraA`.
- Move and rotate the generated `#vrodos-authored-world` container for immersive locomotion.
- Do not restore per-root transform fallbacks for old compiled scenes.
- Keep PMNDRS/legacy composer ownership, clouds, scene probes, Takram sky PMREM capture, and WebXR layers disabled by default.
- Keep native renderer antialiasing, hard headset shadow caps, authored Takram atmosphere/light/visible sky where currently allowed, and authored HDR env-map reflections where policy allows them.
- Keep `vrodos-postprocessing.bundle.js` available when headset Takram atmosphere needs the full PMNDRS/Takram vendor path; do not treat the vendor library itself as forbidden in standalone VR.
- Do not route standalone headset Takram through the retired source-only headset bundle split. That split passed static scans but produced a black sky/no sun regression on device.
- Headset visible Takram sky follows desktop local-Horizon ground policy: keep Takram `SkyMaterial` ground disabled and let authored terrain provide the ground surface. Do not use non-black Takram ground albedo to fill the lower hemisphere.
- Headset direct-stereo visible sky may cool only the no-ground below-horizon rays to match the desktop Horizon haze; this is a sky shader calibration, not Takram ground or a separate A-Frame environment.
- Future standalone headset features must be added back one at a time with Quest/headset validation and updates to this handoff plus `RENDERING_PIPELINE.md` when rendering ownership changes.

## Completed Cleanup Decisions

- Supported parent profiles are limited to `desktop`, `headset`, and `pc-rendered-vr`; old hidden profile names are compatibility inputs only and normalize to `headset`.
- Recompiled scenes are required for new pipeline behavior. Do not add fallbacks for old generated scene layouts.
- Standalone headset keeps hard defaults now: no implicit PMNDRS composer, clouds, scene probe, native WebXR layers, old movement HUD, or old movement emitter scaffolding.
- `#vrodos-authored-world` is mandatory for immersive locomotion. WebXR/A-Frame owns tracking; VRodos moves/rotates only the authored world container.
- Headset shadow maps are capped at directional `1024` and point/spot `512`, with adaptive fitting restricted to targeted dirty events.
- The editor collision toggle is the compiled collision source of truth. Missing or false compiled collision metadata means no compiled collision.
- Headset walkable collision requires BVH and uses the reduced blocker-ray budget.

## Interaction Contract

- Video trigger clicks toggle playback directly in immersive VR.
- CEFR, assessment, and image/text POI panels use `window.VRODOSSpatialUI`.
- Do not route immersive panels through A-Frame planes/text, DOM overlays, or `.vrodos-overlay-hit-target` fallback geometry.
- Controller rays remain the active A-Frame raycaster visuals because that path owns scene selection.
- Modal panels clamp the active controller ray to the panel surface and restore ray state on close.
- Normal scene `.raycastable` targets get endpoint-dot feedback when no modal is open.

## Validation

Use a freshly recompiled representative scene for headset validation. Do not treat arbitrary files already present in `runtime/build/` as current fixtures.

Required checks:

- HMD/controller tracking remains WebXR/A-Frame-owned.
- VRodos only moves/rotates `#vrodos-authored-world`.
- Movement, yaw, collision, video clicks, POI, CEFR, assessment, and scene ray feedback still work.
- Headset shadow maps obey directional `1024` and point/spot `512` caps.
- No repeated movement-frame DOM root diagnostics.
- Collision target count and blocker ray count match the selected profile budget.

ADB reverse test pattern:

```powershell
$adb = 'C:\Program Files\Meta Quest Developer Hub\resources\bin\adb.exe'
$url = 'http://localhost:5832/wp-content/plugins/VRodos/runtime/build/Master_Client_RECOMPILED.html?vrodos_debug_runtime_features=1'
& $adb reverse tcp:5832 tcp:5832
& $adb shell "am start -a android.intent.action.VIEW -d '$url' -p com.oculus.browser"
```

Do not test headset WebXR through `wp.local`; use `localhost:5832` through ADB reverse or a directly reachable LAN URL.

## Diagnostics

For headset movement/yaw smoothness, load the scene with `vrodos_debug_immersive_smoothness=1`, enter immersive VR, then sample Quest Browser DevTools:

```powershell
node scripts\capture-quest-immersive-diagnostics.mjs --duration-ms 30000 --target-url Master_Client_RECOMPILED.html
```

The runtime publishes `window.__vrodosImmersiveSmoothnessDiagnostics` while the flag is active. Use frame time, shadow dirty count, transformed root count, collision target count, blocker ray count, and shadow map sizes before changing locomotion or render policy.
