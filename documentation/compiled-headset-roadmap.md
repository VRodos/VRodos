# VRodos Compiled Headset Roadmap

Status date: 2026-07-26.

This is the single active policy, validation, and backlog document for both standalone headset rendering and the parked PC-rendered VR profile. Current renderer mechanics belong in `../RENDERING_PIPELINE.md`; immersive dialog ownership belongs in `vrodos-compiled-scene-framework-integration.md`.

## Supported Profiles

- `desktop`: full desktop/browser rendering.
- `headset`: standalone Quest-class rendering, lean by default and expanded only through explicit device-validated work.
- `pc-rendered-vr`: desktop-rendered WebXR through a PCVR/OpenXR runtime. It remains parked until compatible hardware is available.

Legacy names such as `baseline`, `safe`, `takram-lights`, `takram-sky`, `hdr-reflections`, `balanced`, and `max` are compatibility inputs only and normalize to `headset`. Do not add behavior behind those aliases.

## Standalone Headset Policy

- A-Frame/WebXR owns the XR session, HMD and controller poses, controller raycasters, and stereo render loop.
- `#player` remains an unpositioned tracking rig. Authored camera placement remains on `#cameraA`.
- `custom-movement` owns only virtual navigation and moves/rotates `#vrodos-authored-world` in immersive XR.
- Freshly recompile representative scenes. Do not add per-root or old-layout fallbacks for generated clients.
- PMNDRS/Legacy composer ownership, Takram clouds, scene probes, Takram sky PMREM capture, native WebXR layers, old movement HUDs, and old movement emitter scaffolding remain disabled by default.
- New headset realism work belongs only behind `vrHeadsetStereoPostFxEnabled` and must use dynamic Takram sky/time/light state. Do not substitute static headset palettes, A-Frame fallback environments, or fixed lower-hemisphere fills.
- Keep `vrodos-postprocessing.bundle.js` available when headset Takram atmosphere needs the full PMNDRS/Takram vendor classes; disabling composer ownership does not make the vendor library itself invalid.
- Do not restore the retired source-only headset bundle split. It passed static scans but produced a black sky/no-sun regression on device.
- The older no-composer visible-sky path may retain its direct-sky reveal calibration; the stereo PMNDRS opt-in must use native Takram sky output.
- Keep native renderer antialiasing and hard shadow caps: directional `1024`, point/spot `512`.
- Headset walkable collision requires BVH and uses the reduced blocker-ray budget.
- Keep Takram procedural ground disabled for local Horizon scenes; authored terrain owns the ground surface.
- Add headset features back one at a time and validate them on Quest-class hardware before changing public defaults.

## Interaction Contract

- Immersive video trigger clicks toggle playback directly.
- CEFR, assessment, and image/text POI panels use `window.VRODOSSpatialUI`.
- Do not route immersive panels through A-Frame planes/text, DOM overlays, `.vrodos-overlay-hit-target`, or `VRODOSRuntimeOverlay.openVrPanel()`.
- Controller visuals remain tied to the active A-Frame raycasters because those raycasters own scene selection.
- Modal panels clamp the active controller ray to the panel surface and restore it on close.
- Normal `.raycastable` scene targets get endpoint-dot feedback only when no modal is open.
- If spatial UI or controller-ray readiness is unavailable, report diagnostics and fail closed.

## Accepted Device Baseline

Manual Quest pass on 2026-06-30:

- HMD/controller tracking, controller rays, thumbstick movement, yaw, walkable collision, capped shadows, and immersive exit recovery were accepted.
- CEFR session continuation/clearing, CEFR panels, image/text POI panels, assessment read/answer/submit/close, and controller-driven modal interaction were accepted.
- Video triggers directly toggled playback and normal `.raycastable` targets showed endpoint-dot feedback.
- Quest Browser: `146.3.0.52.52.997435173`, `versionCode=569800627`, `lastUpdateTime=2026-06-23 19:40:28`.

Diagnostic smoke pass on 2026-07-02:

- Fresh compiled client reported real immersive XR, the `headset` profile, direct post-FX ownership, inactive PMNDRS composer/clouds, active Takram visible sky, loaded spatial UI, walkable collision, installed BVH, and `#vrodos-authored-world` movement ownership.
- Pixel ratio `1`, foveation `0.5`, framebuffer scale `1`, effective shadow quality `medium`, and Takram sun/moon shadow maps at `1024x1024` matched policy.
- Navigation reported one navmesh and four blockers. Runtime locomotion p95 values remained small: collision refresh `0.1ms`, movement apply `0.3ms`, right-stick turn `0.3ms`, transform apply `0.3ms`.
- A visible half-second movement pause was traced to DevTools polling with `--include-frames-each-sample`, not the locomotion path. Use summary-only captures for smoothness acceptance.

## Active Standalone Validation

- Retest HMD/controller tracking, locomotion, yaw, collision, video, POI, CEFR, assessment, modal ray clamp/restore, endpoint feedback, and immersive exit after relevant runtime changes.
- Keep yaw-only authored-world rotation from clearing authored-space ground caches.
- Investigate the remaining caveat where immersive right-stick yaw can make directional shadows appear player-relative. Treat it as shadow/light fitting, not a reason to change locomotion ownership.
- Validate the stereo PMNDRS opt-in on device: native Takram sky must follow time of day, reflections must come from Takram sky PMREM, and the default no-composer baseline must remain unchanged.
- Validate networked headset scenes separately when a release depends on them.
- Record device, browser/runtime version, compiled client, date, diagnostics, and manual acceptance for every headset pass.

## Device Validation Workflow

Use a freshly compiled representative Master scene. Do not treat existing `runtime/build/` HTML as a current fixture.

Preflight:

1. Run `npm run check:runtime`.
2. Recompile the scene so runtime script URLs receive current cache-busting versions.
3. Serve the client through a Quest-reachable LAN URL or `localhost:5832` via ADB reverse. Do not use `wp.local` for headset WebXR.
4. Load with `vrodos_debug_runtime_features=1&vrodos_debug_immersive_smoothness=1` and enter immersive VR.

ADB reverse example:

```powershell
$adb = 'C:\Program Files\Meta Quest Developer Hub\resources\bin\adb.exe'
$url = 'http://localhost:5832/wp-content/plugins/VRodos/runtime/build/Master_Client_RECOMPILED.html?vrodos_debug_runtime_features=1&vrodos_debug_immersive_smoothness=1'
& $adb reverse tcp:5832 tcp:5832
& $adb shell "am start -a android.intent.action.VIEW -d '$url' -p com.oculus.browser"
```

Capture:

```powershell
node scripts\capture-quest-immersive-diagnostics.mjs --list-targets
node scripts\capture-quest-immersive-diagnostics.mjs --duration-ms 30000 --target-url Master_Client_RECOMPILED.html --output C:\tmp\vrodos-quest-immersive-diagnostics.json
```

Start with summary-only captures. Use `--include-frames-each-sample` only for short forensic captures because repeatedly serializing the frame ring can create visible stalls.

Required checks:

- `presentation.mode=immersive-xr`, expected profile, post-FX owner, and render budget.
- Directional and point/spot shadow caps.
- `#vrodos-authored-world` as the only immersive navigation transform owner.
- Collision target and blocker counts.
- Spatial UI bundle/panel state and controller ray clamp/restore.
- Frame time, shadow dirty count, transformed root count, and repeated log noise.
- Manual interaction and comfort acceptance.

## Parked PC-Rendered VR

The target is a desktop browser rendering stereo frames while a headset supplies display, tracking, and controller input through Meta Quest Link/Air Link, SteamVR/OpenXR, Steam Link, Virtual Desktop, or a native PCVR runtime.

Current blocker: the available desktop PC is not compatible with Meta Quest Link/Air Link. Do not implement profile-specific fixes until a known-good PCVR/OpenXR session can be run. Desktop mirroring, Remote Desktop, HDMI capture, and Quest HDMI Link do not validate WebXR tracking or input.

Required setup:

- VR-ready PC and compatible GPU/USB or Wi-Fi path.
- Quest or native PCVR headset with a working PCVR/OpenXR runtime.
- Desktop Chrome or Edge with immersive WebXR support.
- Localhost or HTTPS serving for a freshly compiled scene.

Validate before changing VRodos:

1. Confirm a known-good native VR or WebXR sample enters immersive mode.
2. Confirm `navigator.xr.isSessionSupported('immersive-vr')`.
3. Enter a freshly compiled VRodos scene from the desktop browser.
4. Verify HMD position/rotation and both controller poses without double-applied transforms.
5. Verify A-Frame ray alignment, select/squeeze, gamepad axes, and thumbstick locomotion.
6. Verify video, POI, CEFR, assessment, endpoint feedback, and authored-world movement ownership.
7. Measure frame pacing and streaming latency.

Only after a real failure is reproduced should VRodos add small diagnostics or controller-profile handling. Keep the standalone Quest path unchanged and never add a display-only ray that diverges from the active selection ray.

PC-rendered VR is validated only when headset/controller poses, selection, locomotion, modal interactions, media, and performance all work in a real PCVR runtime without regressing standalone Quest. Record headset, GPU, browser, PCVR runtime, and validation date.

## Deferred Headset Experiments

- PMNDRS composer ownership outside the explicit stereo opt-in.
- Legacy post-FX in immersive XR.
- Existing screen-space FXAA/TAA/AO/SSR/bloom/color/vignette/noise/chromatic/lens-flare paths in immersive XR.
- Takram volumetric clouds.
- Scene probes and Takram sky PMREM outside the explicit stereo path.
- Native WebXR layers, AR, and MR.

If PMNDRS XR work resumes, validate in order: explicit opt-in, no-effect composer, one cheap effect at a time, automatic direct-stereo fallback, and only then any public enablement.

## References

- `../RENDERING_PIPELINE.md`: renderer, post-FX, lighting, shadows, collision, reflections, and diagnostics.
- `vrodos-compiled-scene-framework-integration.md`: A-Frame/WebXR ownership and immersive spatial UI.
- `compiled-desktop-roadmap.md`: desktop-only acceptance and research.
- `archive/rendering-history/README.md`: historical evidence, not active policy.
