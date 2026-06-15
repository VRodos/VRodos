# VR Headset Runtime Handoff

Date: 2026-06-15

This is the short continuation note for the VR Headset runtime parity effort. The detailed plan is in `COMPILED_SCENE_PLATFORM_AUDIT_AND_VR_PARITY_PLAN.md`; the renderer details are in `RENDERING_PIPELINE.md`.

## Goal

Keep the Desktop compiled-scene pipeline intact while enabling as much Desktop functionality as possible in the VR headset runtime, one validated step at a time.

## Current Accepted State

- Compile UI exposes `Runtime Target`: `Desktop` or `VR Headset`.
- `Desktop` maps to internal `desktop` and keeps authored Desktop settings active.
- `VR Headset` maps to internal `baseline`.
- `baseline` is accepted on Quest 2.
- Accepted VR Headset features: A-Frame scene host, A-Frame horizon/environment, authored GLB/media rendering, controller input, thumbstick navigation, walkable navigation, static collision/BVH, static shadows, native renderer antialiasing, and readable midday lighting.
- Minor far-edge shimmer is acceptable and should be treated as solved unless it regresses.
- VR Headset baseline compiles without PMNDRS/Takram chunks even if the Desktop-authored scene uses PMNDRS/Takram.

## Known Blocked Paths

- PMNDRS composer/cloud ownership caused tiled stereo/compositor instability on Quest 2.
- Legacy post-FX/FXAA caused black-screen/tiled-framebuffer artifacts in immersive XR.
- Do not promote legacy FXAA, TAA, SAO/SSAO, SSR, bloom, lens flare, Takram clouds, or PMNDRS composer effects into VR Headset without a new XR-safe implementation and headset validation.

## Current Safe Test URL Pattern

Use ADB reverse and load through Quest Browser:

```powershell
$adb = 'C:\Program Files\Meta Quest Developer Hub\resources\bin\adb.exe'
$url = 'http://localhost:5832/wp-content/plugins/VRodos/runtime/build/Master_Client_8606.html?vrodos_debug_runtime_features=1'
& $adb reverse tcp:5832 tcp:5832
& $adb shell "am start -a android.intent.action.VIEW -d '$url' -p com.oculus.browser"
```

Do not test headset WebXR through `wp.local`; use `localhost:5832` through ADB reverse.

## VR Headset Parity Checklist

Track every stage here before promoting it. Keep `Status` as `Pending`, `In Progress`, `Blocked`, or `Accepted`.

| Stage | Status | Test URL | Expected Diagnostics | Headset Result | Next Action |
| --- | --- | --- | --- | --- | --- |
| Accepted baseline freeze | Accepted | `http://localhost:5832/wp-content/plugins/VRodos/runtime/build/Master_Client_8606.html?vrodos_debug_runtime_features=1` | `vrProfile.profile=baseline`, `takram.horizonOwner=aframe-environment`, `postProcessing.owner=vr-baseline-disabled`, `reflections.effectiveSource=none`, navigation/collision active | Quest 2 accepted; minor far-edge shimmer is not a blocker | Retest only after runtime changes touching renderer, navigation, collision, controller input, scene loading, or ray interaction |
| Fixture inventory | In Progress | See current test pages below | Only intentionally built pages are tracked | `Master_Client_8606.html` is the only known current page | Add more rows only after intentionally compiling representative scenes |
| Scene-owned lighting/material parity | In Progress | `Master_Client_8606.html?vrodos_vr_profile=safe&vrodos_debug_runtime_features=1` | `vrProfile.profile=safe`, no composer, no Takram visible sky, no clouds, no scene probe, no reflections, stable shadows/materials | Not yet validated on headset | User validates in browser/Quest, or agent launches the URL on the headset when explicitly asked |
| Takram-derived lighting only | Pending | Fixture URLs with the future lighting-only flag/profile | A-Frame horizon remains visible; Takram-derived light diagnostics active; no composer/clouds/reflections | Not yet validated on headset | Implement only after scene-owned lighting/material parity is accepted |
| Takram visible sky without clouds | Pending | Fixture URLs with the future sky-only flag/profile | Takram sky visible; no PMNDRS composer effects, clouds, scene probes, or WebXR layers | Not yet validated on headset | Implement only after Takram-derived lighting is accepted |
| Reflections | Pending | Future HDR/env-map fixture URL | HDR/env-map first; scene probe remains disabled unless separately flagged | Not yet validated on headset | Defer until Takram sky is accepted |
| Composer/effects/clouds/WebXR layers/AR/MR | Pending | Lab-only future URLs | Explicit lab flags only | Not yet validated on headset | Defer until every lower stage is accepted |

## Current Test Pages

Do not treat arbitrary files already present in `runtime/build/` as validation fixtures. Add rows here only for pages intentionally built for this VR parity pass.

| Page | Role | Current Notes |
| --- | --- | --- |
| `Master_Client_8606.html` | Current built test page and accepted VR Headset baseline | Test through `http://localhost:5832/wp-content/plugins/VRodos/runtime/build/Master_Client_8606.html` on Quest via ADB reverse, or through the matching IP URL when needed |

## Local Automated Smoke Results

- 2026-06-15 local Chrome/CDP baseline smoke passed for `Master_Client_8606.html?vrodos_debug_runtime_features=1`: effective profile `baseline`, scene-owned profile active, post-processing owner `direct`, A-Frame environment horizon, reflections `none`, high/static shadows, no network failures, no exceptions.
- 2026-06-15 local Chrome/CDP `safe` smoke passed for `Master_Client_8606.html?vrodos_vr_profile=safe&vrodos_debug_runtime_features=1`: effective profile `safe`, scene-owned profile active, post-processing owner `direct`, A-Frame environment horizon, reflections `none`, high/static shadows, no network failures, no exceptions.
- These local smoke results are not headset acceptance. Quest/browser-panel and immersive VR validation remain pending.

## Verification Checklist

- Rebuild runtime bundles after runtime JS changes: `node scripts\build-runtime-master-bundles.mjs`.
- Recompile generated scenes before headset testing.
- Run `node --check` for edited JS.
- Run PHP syntax checks for edited PHP.
- Run `git diff --check`.
- Validate in Quest Browser tab mode and immersive VR.
