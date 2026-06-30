# VRodos Compiled Headset Roadmap

Status date: 2026-06-30.

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

## Active Headset TODOs

### Interaction Parity

- Validate plain VR video trigger clicks toggle playback directly without opening a play/pause dialog.
- Validate CEFR prompts open through `window.VRODOSSpatialUI`.
- Validate assessment panels open through `window.VRODOSSpatialUI`, stay readable at camera-relative eye height, accept answers, submit, and close.
- Validate image/text POI panels open through `window.VRODOSSpatialUI`.
- Confirm modal panels lock locomotion while open, clamp the active controller ray to the panel surface, show hit-dot feedback, and restore ray state on close.
- Confirm normal scene `.raycastable` targets show endpoint-dot feedback when no modal is open.
- If spatial UI is unavailable in immersive XR, log diagnostics and fail closed; do not restore A-Frame plane/text or DOM overlay fallbacks.
- Retest HMD tracking, controller rays, locomotion, yaw, walkable collision, and video/POI/CEFR/assessment interactions after each spatial-panel change.

### Movement, Collision, And Smoothness

- Preserve the accepted single-owner tracking model: WebXR/A-Frame tracks the user; VRodos transforms only `#vrodos-authored-world`.
- Keep yaw-only authored-world rotation from clearing authored-space ground caches.
- Use `vrodos_debug_immersive_smoothness=1` plus `scripts/capture-quest-immersive-diagnostics.mjs` before changing locomotion or render policy.
- Watch frame time, shadow dirty count, transformed root count, collision target count, blocker ray count, and shadow map sizes.
- Treat walkable collision and controller thumbstick movement as accepted baseline features unless a future change touches navigation/collision.
- If networked headset scenes matter for a release, validate them separately on headset hardware; current support is conditional on scene/runtime/network behavior.

### Shadows And Scene-Owned Visuals

- Keep headset shadow maps capped at directional `1024` and point/spot `512`.
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
