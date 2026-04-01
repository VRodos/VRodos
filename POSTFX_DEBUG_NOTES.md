# Post FX Washout Debug Notes

## Context

- Runtime page tested: `http://wp.local:5832/Master_Client_766.html`
- Main runtime file under investigation: `runtime/assets/js/vrodos_master_components.js`
- Scene confirmed by user:
  - `postFXEnabled: 1`
  - `postFXBloomEnabled: 0`
  - `postFXColorEnabled: 0`
  - `postFXVignetteEnabled: 0`
  - `postFXEdgeAAEnabled: 1`
  - `ambientOcclusionPreset: balanced`
- `post off` looked normal.
- `post on` looked washed out.

## Important Findings

1. Vignette was not the cause.
   - User explicitly noted vignette was not selected.
   - The washout still happened with stripped-down fullscreen passes.

2. The environment background was not `scene.background`.
   - User could still see the horizon/background mesh when `scene.background` and `scene.fog` were disabled.
   - This strongly suggests `aframe-environment-component` geometry such as `horizonbg`, not renderer clear/background state.

3. A pure fullscreen passthrough from the render target went dark.
   - That suggested the offscreen target was not in the same final output state as direct screen rendering.

4. The only version that produced correct colors used a workaround:
   - render scene to offscreen target
   - render scene normally to screen a second time
   - copy the framebuffer
   - run fullscreen post passes on that copied screen image
   - make fullscreen materials opaque with `THREE.NoBlending`
   - clear the screen before the final fullscreen draw

5. That workaround fixed color parity, but it hurt performance.
   - It effectively rendered the whole scene twice per frame.
   - With AO and FXAA enabled, this added several fullscreen passes on top.
   - User reported FPS dipping into the 30s.

6. A single-render performance-oriented variant restored FPS, but brought the washed-out look back.
   - Conclusion: there is still an unresolved mismatch between direct-to-screen output and the offscreen post path.

## What Was Tried

- Manual `linearToSRGB()` variants
- Manual ACES + sRGB in the composite shader
- Three.js shader chunks for tone mapping / output conversion
- `LinearSRGBColorSpace` / `SRGBColorSpace` target experiments
- temporary `renderer.outputColorSpace` swapping
- `HalfFloatType` render target
- alpha forcing / opaque fullscreen output
- XR-like render target flags
- disabling `scene.background` / `scene.fog`
- framebuffer-copy workaround
- single-render optimization attempt

## Practical Takeaways

- The framebuffer-copy workaround was the only known-good color fix during this session.
- It should be treated as a diagnostic workaround, not a final architecture.
- If performance is the priority, avoid waking the full post chain unless there is a strong visual reason.
- The next agent should inspect the exact color-management behavior of A-Frame 1.7.1 + Three r173 when rendering to `WebGLRenderTarget`, and compare it against the direct screen path.

## Requested End State

User asked to:

- avoid hacky fixes
- keep a written handoff for the next agent
- revert the runtime post-processing file back to the original washed-out baseline for now
