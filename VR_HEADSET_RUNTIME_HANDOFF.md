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

## Next Todo

1. Preserve the accepted VR Headset baseline exactly.
2. Treat navigation/collision as accepted, not future work.
3. Start the next stage with scene-owned lighting/material parity:
   - compare object readability across representative scenes;
   - confirm static shadows and material profiles remain stable;
   - keep post-FX/composer paths disabled.
4. If lighting/material parity is stable, test Takram-derived lighting only while keeping the A-Frame horizon visible.
5. If that passes, test Takram visible sky without clouds.
6. Defer reflections, scene probes, PMNDRS composer, and clouds until lower stages are accepted.

## Verification Checklist

- Rebuild runtime bundles after runtime JS changes: `node scripts\build-runtime-master-bundles.mjs`.
- Recompile generated scenes before headset testing.
- Run `node --check` for edited JS.
- Run PHP syntax checks for edited PHP.
- Run `git diff --check`.
- Validate in Quest Browser tab mode and immersive VR.
