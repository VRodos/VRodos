# VRodos PC-Rendered VR Plan

Date: 2026-06-23

## Goal

Investigate and later support a workflow where a desktop PC renders a compiled VRodos Three.js/A-Frame scene, while a VR headset displays the immersive output and the headset controllers interact with the scene.

This is different from the current primary test path:

- Current path: Quest Browser opens the compiled scene and the Quest 2 hardware renders everything.
- Target path: desktop PC browser/runtime renders the scene, while the headset provides display, head tracking, and controller input through a PCVR/WebXR/OpenXR path.

## Current Blocker

The available desktop PC is not compatible with Meta Quest Link or Air Link, so this work is parked until compatible PCVR hardware/runtime is available.

Do not spend implementation time on this until we can run a real PCVR session. Desktop mirroring alone is not enough to validate this because it does not prove that WebXR receives headset pose, controller rays, select events, squeeze events, and gamepad axes.

## Required Runtime Shape

The viable architecture is:

1. A VR-ready desktop PC runs a PCVR runtime.
2. The headset connects to that PC through one of:
   - Meta Quest Link
   - Meta Air Link
   - SteamVR / Steam Link
   - Virtual Desktop
   - A native PCVR headset/runtime
3. A desktop browser with WebXR support opens the compiled VRodos scene.
4. The browser starts an `immersive-vr` WebXR session.
5. The PC renders stereo frames.
6. The headset and controllers feed tracking and input back to the WebXR session.

Non-goals:

- Do not treat HDMI capture, Windows remote desktop, Quest HDMI Link, or normal desktop streaming as equivalent to PCVR WebXR.
- Do not build a custom video-streaming transport for VRodos unless PCVR WebXR proves impossible for the actual target hardware.
- Do not change the current Quest Browser standalone path just to support this experiment.

## Why VRodos Should Be Compatible

VRodos compiled clients are already built around A-Frame, Three.js, and WebXR. That is the correct technical foundation for this path.

Expected reusable pieces:

- A-Frame scene/session ownership
- Existing `#player`, `#cameraA`, `#oculusLeft`, and `#oculusRight` controller rig structure
- Controller raycaster-driven scene interactions
- VR video trigger behavior
- Spatial UI panels mounted under `a-scene.object3D`
- Existing compiled-runtime lazy chunk planner

Expected risk areas:

- Controller profile differences between Quest Browser and PCVR runtime.
- Desktop browser WebXR support and runtime selection.
- Locomotion assumptions that were tuned for Quest Browser.
- Controller ray visual alignment versus the active A-Frame raycaster.
- Spatial UI pointer routing in a desktop PCVR browser.
- Performance differences caused by desktop GPU, browser, OpenXR runtime, and streaming latency.

## Hardware And Software Needed Later

Minimum setup to test:

- VR-ready desktop PC with compatible GPU and USB/Wi-Fi setup.
- Meta Quest 2/3/3S or a native PCVR headset.
- Installed and working PCVR runtime:
  - Meta Quest Link/Air Link runtime, or
  - SteamVR/OpenXR runtime, or
  - Virtual Desktop/Steam Link path that exposes the headset to the desktop XR runtime.
- Desktop Chrome or Edge with WebXR support.
- Local VRodos WordPress site serving compiled clients over localhost or HTTPS.

Helpful diagnostic pages/tools:

- A minimal WebXR sample page to confirm the browser can enter `immersive-vr`.
- Browser console access.
- VRodos compiled-client diagnostics.
- `scripts/profile-master-client.mjs` for desktop browser captures after basic functionality works.

## First Validation Checklist

Use this checklist before changing VRodos code.

1. Confirm PCVR runtime works with any known-good native VR or WebXR sample.
2. Open desktop Chrome/Edge and verify:
   - `navigator.xr` exists.
   - `navigator.xr.isSessionSupported('immersive-vr')` resolves to `true`.
3. Serve a compiled VRodos `Master_Client_*.html` from localhost or HTTPS.
4. Enter immersive VR from the desktop browser.
5. Verify headset pose:
   - Head rotation updates correctly.
   - Head position updates correctly.
   - The generated world does not drift or double-apply camera transforms.
6. Verify controller basics:
   - Left and right controllers are detected.
   - Active A-Frame raycasters align with visible controller rays.
   - Trigger/select events reach `.raycastable` scene objects.
   - Grip/squeeze and thumbstick axes are available if locomotion uses them.
7. Verify VRodos interactions:
   - Video trigger click toggles playback directly.
   - Image/text POIs open the correct immersive spatial UI panel.
   - CEFR UI opens and closes.
   - Assessment UI opens, answers can be selected, and submit/close works.
   - Scene ray endpoint feedback appears only when no modal is open.
8. Verify locomotion:
   - Thumbstick movement works.
   - Rotation works.
   - WebXR tracking remains owned by the headset/runtime.
   - VRodos only moves/rotates `#vrodos-authored-world` in immersive XR.
9. Verify performance:
   - Frame pacing is stable.
   - Streaming latency is acceptable.
   - PMNDRS/Takram paths do not break desktop PCVR entry.

## VRodos Work If Issues Appear

Only after the validation checklist identifies real failures:

1. Add a small runtime diagnostic that reports:
   - user agent
   - `navigator.xr` availability
   - active XR session mode
   - input source profiles
   - input source handedness
   - target ray mode
   - gamepad axes/buttons count
2. Audit generated controller entities:
   - Prefer A-Frame/WebXR generic controller behavior where possible.
   - Keep Meta Quest Browser compatibility.
   - Do not add display-only controller rays that diverge from the active selection ray.
3. Audit locomotion:
   - Keep WebXR/A-Frame as the sole owner of headset/controller tracking.
   - Keep VRodos `custom-movement` as the owner of virtual navigation.
   - Do not move/rotate `#player` to fix PCVR unless a separate design review proves it is necessary.
4. Audit spatial UI pointer handling:
   - Preserve PMNDRS/Horizon panel ownership.
   - Do not add A-Frame hit planes or `VRODOSRuntimeOverlay.openVrPanel()` fallbacks for immersive spatial UI.
   - Treat benign stale PMNDRS pointer cleanup errors as cleanup noise, not failed clicks.
5. Add a PCVR compatibility note to the compiled-scene documentation after a real test pass.

## Definition Of Done

PC-rendered VR support can be considered validated when:

- A compiled VRodos scene enters immersive VR from desktop Chrome/Edge through a PCVR runtime.
- Headset pose, controller pose, controller rays, clicks, thumbstick locomotion, and modal interactions work.
- Video, POI, CEFR, and assessment interactions match Quest Browser behavior.
- No changes regress the standalone Quest Browser path.
- A short compatibility note documents the tested headset, desktop GPU, browser, PCVR runtime, and date.

## References

- MDN WebXR input sources: https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API/Inputs
- A-Frame `laser-controls`: https://aframe.io/docs/1.7.0/components/laser-controls.html
- Khronos OpenXR overview: https://www.khronos.org/openxr/
