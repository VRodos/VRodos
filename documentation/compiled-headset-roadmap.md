# VRodos Compiled Headset Roadmap

Status date: 2026-07-02.

This is the current coordination doc for standalone VR-headset compiled scenes, meaning Quest-class browsers that open the compiled client and render on the headset hardware. PC-rendered VR is a separate path and remains parked in `PC_RENDERED_VR_PLAN.md`.

## Scope

This roadmap is for the public `headset` runtime profile selected through the compile dialog's `Runtime Target: VR Headset` option.

Keep these baseline decisions intact:

- WebXR/A-Frame owns HMD pose, controller pose, controller raycasters, the XR session, and the stereo render loop.
- VRodos owns virtual navigation only by moving/rotating `#vrodos-authored-world` in immersive XR.
- `#player` stays an unpositioned tracking rig, and authored camera placement stays on `#cameraA`.
- Freshly recompile representative scenes before headset validation; do not add compatibility fallbacks for old generated layouts.
- PMNDRS/legacy composer ownership, Takram clouds, scene probes, Takram sky PMREM capture, native WebXR layers, old movement HUDs, and old movement emitter scaffolding stay disabled by default.
- Legacy hidden profile names such as `baseline`, `safe`, `takram-lights`, `takram-sky`, `hdr-reflections`, `balanced`, and `max` are compatibility inputs only and normalize to `headset`.

## Separation Rationale

- Standalone headset scenes have their own constraints: native WebXR session timing, Quest Browser compositor behavior, controller ray readiness, HMD tracking, and headset frame budget.
- Past Quest testing accepted scene-owned visuals, walkable collision/BVH, controller locomotion, capped shadows, and selected Takram/HDR behavior, but rejected PMNDRS/legacy composer ownership in immersive XR by default.
- Desktop cleanup should not change headset policy. Headset fallbacks and hidden profile cleanup need Quest-class validation, so they remain in this roadmap instead of the desktop cleanup pass.
- Freshly recompiled representative scenes are the validation target. Old generated layouts should not drive new headset fallback code unless a release explicitly needs that compatibility.

## Accepted Baseline

- A-Frame scene host and current WebXR entry.
- Authored GLBs, media, POIs, fog, material profiles, and scene-owned lighting.
- HMD tracking without camera freeze.
- Controller input and raycaster-driven scene selection.
- Thumbstick movement, yaw, walkable navigation, and static collision/BVH.
- Native renderer antialiasing.
- Hard headset shadow caps: directional `1024`, point/spot `512`.
- Authored Takram visible sky/light sources where the current policy allows them.
- HDR environment-map reflections where the current policy allows them.
- Minor far-edge shimmer is accepted unless it regresses.

## Latest Headset Validation

2026-06-30 manual Immerse VR-only headset pass:

- Accepted: HMD/controller tracking, controller rays, thumbstick movement, yaw, walkable collision, CEFR spatial UI interaction, headset shadow behavior, and controller-driven modal interaction were reported working well.
- Accepted after runtime cleanup: exiting immersive mode back to the headset browser page restored page/A-Frame interaction instead of leaving the compiled client non-interactable.
- Accepted after runtime cleanup: stored CEFR participant/session state can be continued or cleared through the startup session prompt.
- Accepted after recompiling with the latest runtime: image/text POI spatial panels open through `window.VRODOSSpatialUI` and reveal the image with the dialog shell, with no image-only flash.
- Accepted after recompiling with the latest runtime: plain VR video trigger clicks directly toggle play/pause without opening a dialog.
- Accepted after recompiling with the latest runtime: assessment panels open, remain readable, accept answers, submit, and close.
- Accepted after recompiling with the latest runtime: normal scene `.raycastable` targets show endpoint-dot feedback when no modal is open.
- Quest Browser version recorded from ADB: `146.3.0.52.52.997435173` (`versionCode=569800627`, `lastUpdateTime=2026-06-23 19:40:28`).

2026-07-02 Quest diagnostic smoke pass:

- Scene/client: `runtime/build/Master_Client_8606.html`.
- URL flags: `vrodos_debug_runtime_features=1&vrodos_debug_immersive_smoothness=1`.
- Quest Browser version recorded from ADB: `146.3.0.52.52.997435173` (`versionCode=569800627`, `lastUpdateTime=2026-06-23 19:40:28`).
- Feature state confirmed real immersive XR: `presentation.mode=immersive-xr`, `xrPresenting=true`, headset profile active, `postProcessing.owner=direct`, `postProcessing.allowed=false`, PMNDRS composer disabled, Takram visible sky active, clouds inactive, and spatial UI bundle loaded with no active panel.
- Renderer and shadow policy matched the headset budget: pixel ratio `1`, foveation `0.5` applied, framebuffer scale `1`, effective shadow quality `medium`, and Takram sun/moon directional shadow maps at `1024x1024`.
- Navigation/collision state matched the accepted single-owner model: `mode=walkable`, collision active, BVH bundle loaded and installed, `navMeshTargets=1`, `blockerTargets=4`, `#vrodos-authored-world` present, and immersive collision roots covered.
- Movement/yaw diagnostic buckets were captured: idle `65`, move `382`, yaw `194`, move+yaw `259` frames in the final 900-frame ring.
- Runtime-side locomotion timings were small even during movement: `collisionRefreshMs p95=0.1`, `movementApplyMs p95=0.3`, `rightStickTurnMs p95=0.3`, and `transformApplyMs p95=0.3`.
- The visible half-second movement pause during capture was measurement overhead. The forensic capture used `--include-frames-each-sample` with 500ms polling and produced `200-230ms` frame gaps at the same cadence. After the capture stopped, thumbstick movement was reported correct again.
- Do not treat that forensic capture as headset frame-pacing acceptance. Use lighter captures without per-sample frame dumps for future smoothness acceptance.

## Active Headset TODOs

### Interaction Parity

- Plain VR video trigger direct play/pause was accepted on headset on 2026-06-30; retest after video interaction changes.
- CEFR prompts opening through `window.VRODOSSpatialUI` were accepted on headset on 2026-06-30; retest after CEFR/spatial UI changes.
- Assessment panels opening, readability, answer, submit, and close were accepted on headset on 2026-06-30; retest after assessment/spatial UI changes.
- Image/text POI panels opening through `window.VRODOSSpatialUI` and deferred first reveal were accepted on headset on 2026-06-30; retest after POI/spatial UI changes.
- Modal panel controller interaction was accepted on headset on 2026-06-30; keep validating locomotion lock, controller ray clamp, hit-dot feedback, and ray restore after spatial-panel changes.
- Normal scene `.raycastable` endpoint-dot feedback with no modal open was accepted on headset on 2026-06-30; retest after controller ray/feedback changes.
- If spatial UI is unavailable in immersive XR, log diagnostics and fail closed; do not restore A-Frame plane/text or DOM overlay fallbacks.
- Retest HMD tracking, controller rays, locomotion, yaw, walkable collision, and video/POI/CEFR/assessment interactions after each spatial-panel change.

### Movement, Collision, And Smoothness

- Preserve the accepted single-owner tracking model: WebXR/A-Frame tracks the user; VRodos transforms only `#vrodos-authored-world`.
- Keep yaw-only authored-world rotation from clearing authored-space ground caches.
- Use `vrodos_debug_immersive_smoothness=1` plus `scripts/capture-quest-immersive-diagnostics.mjs` before changing locomotion or render policy.
- For smoothness acceptance, avoid `--include-frames-each-sample` during live movement because DevTools serialization can create visible periodic stalls. Reserve per-frame dumps for short forensic captures after reproducing a problem with lighter sampling.
- Watch frame time, shadow dirty count, transformed root count, collision target count, blocker ray count, and shadow map sizes.
- Walkable collision and controller thumbstick movement were accepted again on headset on 2026-06-30; treat them as accepted baseline features unless a future change touches navigation/collision.
- If networked headset scenes matter for a release, validate them separately on headset hardware; current support is conditional on scene/runtime/network behavior.

### Shadows And Scene-Owned Visuals

- Keep headset shadow maps capped at directional `1024` and point/spot `512`; visible headset shadow behavior was accepted on 2026-06-30, but diagnostic cap values should still be checked when touching shadow policy.
- Keep adaptive shadow fitting restricted to targeted dirty events.
- Audit the archived open caveat: immersive right-stick authored-world yaw can make object shadows appear player-relative/rotating. Investigate this as a directional shadow/light fitting problem under immersive presentation yaw without changing the accepted locomotion/collision baseline.
- Keep headset visible Takram sky on the desktop local-Horizon ground policy: Takram `SkyMaterial` ground disabled, authored terrain provides the ground.
- Keep no-ground below-horizon sky cooling as a sky shader calibration only; do not use Takram ground albedo or A-Frame environment as a lower-hemisphere fill.
- Revisit reflection/glint attenuation only after headset-specific visual and performance measurements.

### Diagnostics And Validation Fixtures

- Use a freshly recompiled representative Master scene for headset validation.
- Keep `window.VRODOS_RUNTIME_FEATURE_STATE` useful for active profile, render budget, post-FX owner, Takram/cloud skip state, reflections, shadow diagnostics, navigation/collision state, camera-rig diagnostics, and spatial UI state.
- Confirm diagnostics distinguish browser-panel mode from real immersive XR.
- Keep logs quiet by default; avoid repeated per-frame DOM root diagnostics.
- Record the Quest/browser/runtime/date when a headset behavior is accepted or rejected.

## Deferred Headset Experiments

These remain out of the public `headset` profile until a dedicated Quest/headset validation pass proves them safe:

- PMNDRS composer ownership in immersive XR.
- Legacy post-FX composer ownership in immersive XR.
- FXAA, TAA, SAO/SSAO, SSR, bloom, color post-FX, vignette, noise, chromatic aberration, and lens flare through the existing screen-space composer paths.
- Takram volumetric clouds.
- Scene probes.
- Takram sky PMREM reflection capture.
- Native WebXR layers.
- AR and MR behavior.

If PMNDRS XR composer work resumes, validate in this order:

1. Explicit opt-in flag only.
2. No-effect composer path.
3. One cheap effect at a time, starting with color-only effects.
4. Automatic fallback to direct stereo when unsupported, too slow, or visually broken.
5. No global/public enablement until Quest-class headset evidence is acceptable.

## Non-Goals For This Pass

- Do not change desktop compiled-scene behavior.
- Do not work on PC-rendered VR without the hardware/runtime listed in `PC_RENDERED_VR_PLAN.md`.
- Do not solve headset shimmer with legacy FXAA/TAA; Quest testing showed that path corrupts immersive XR.
- Do not reintroduce retired source-only headset bundle splits.
- Do not add per-root transform fallbacks for older compiled scenes.

## Current References

- `VR_HEADSET_RUNTIME_HANDOFF.md`: policy, completed cleanup decisions, validation commands, and diagnostics.
- `RENDERING_PIPELINE.md`: current renderer, post-FX, shadow, collision, reflection, and diagnostic technical reference.
- `documentation/vrodos-compiled-scene-framework-integration.md`: framework ownership and immersive spatial UI contract.
- `PC_RENDERED_VR_PLAN.md`: parked PC-rendered VR plan.

## Historical References

Historical platform-audit, profile-ladder, post-FX/color, and Takram realism findings are consolidated in `documentation/archive/rendering-history/README.md`. Use that file as evidence and implementation history, not as a competing active TODO list.
