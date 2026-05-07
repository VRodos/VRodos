# VRodos Master Client Performance Implementation

## Summary

This plan preserves the current `high` visual profile and moves performance savings into profiling, diagnostics, shadow participation, and cheaper non-high profiles.

The first profiling pass on `http://wp.local:5832/Master_Client_766.html` showed a GPU/WebGL-bound frame budget in the current high profile:

- `renderQuality=high`, PMNDRS/Takram enabled, DPR about `1.35`, SMAA medium, LUT enabled, lens flare enabled.
- Warm rAF median was about `33.4ms`; p95 was about `50ms`.
- The loaded scene had about `203` visible meshes, `195` geometries, `81` materials, `58` textures, `21` shadow casters, and `178` shadow receivers.
- Two GLB resources dominated transfer size at roughly `61MB` and `35MB`.

## Phase Status

- Complete: repeatable CDP profiling, compile diagnostics, cheaper non-high quality gates, and shadow participation cleanup.
- Complete: debug-only Spector.js support in both the profiler and runtime URL mode.
- Complete: first Spector frame capture on `Master_Client_766.html`.
- Next: reduce model/geometry cost and disable diagnostic FPS meter during performance comparisons.

## Spector.js Debug Phase

Spector.js is used as a frame anatomy tool, not as a production timing source.

- Profiler capture:
  `node scripts/profile-master-client.mjs http://wp.local:5832/Master_Client_766.html --spector --spector-output C:\tmp\vrodos-master-client-spector.json`
- Manual runtime UI:
  `http://wp.local:5832/Master_Client_766.html?vrodos_spector=1`
- Normal compiled runtime URLs do not load Spector.js.
- The profiler runs rAF/trace timing first, then injects Spector.js and captures one WebGL frame so Spector instrumentation does not pollute timing numbers.

First Spector frame result:

- One captured frame: `1827` WebGL commands, `215` draw calls, `113` program switches, `35` framebuffer binds.
- Spector primitive analysis: about `2.61M` triangles in the captured frame.
- `14` draw calls each submit at least `100k` indices.
- No steady-frame texture uploads were captured; the dominant offender is render complexity, not texture upload churn.
- `fpsMeterEnabled=1` adds StatsGL GPU-query commands, so profiling comparisons should run with the FPS meter off unless measuring the meter itself.

## Policy

- `high` must remain visually equivalent to the current look.
- Performance optimizations must not intentionally turn off current high-profile visual features.
- Lower-cost behavior belongs in `standard`, `performance`, or future adaptive modes.
- Expensive scene content should be reported with diagnostics before it is silently altered.

## Implementation Steps

1. Add a repeatable Chrome DevTools Protocol profiler script for compiled client URLs.
2. Keep high-quality DPR, AA, PMNDRS LUT, lens flare, atmosphere, and shadow behavior visually stable.
3. Add a `performance` render-quality option for cheaper runtime behavior.
4. Cap non-high profiles so `standard` avoids high-profile DPR and atmosphere costs, while `performance` can reduce DPR, AA, LUT, lens flare, atmosphere quality, and shadow cost.
5. Change `clear-frustum-culling` so it only disables culling when requested and no longer forces every loaded mesh to cast and receive shadows.
6. Add compiler/runtime diagnostics for large models/images, duplicate expensive asset URLs, and expensive scene composition.
7. Rebuild generated runtime bundles after source changes.
8. Add Spector.js as a debug-only WebGL capture tool for one-frame draw-call, command, framebuffer, texture upload, and shader/program analysis.
9. Next optimization pass should target the large GLBs and high-index draw calls first, then re-profile post-FX/shadow pass cost after geometry is reduced.

## Acceptance Criteria

- `high` still matches the current visual output.
- `standard` and `performance` are allowed to reduce rendering cost.
- Loaded meshes are not made shadow casters/receivers by `clear-frustum-culling` unless explicitly configured.
- Compiled clients expose `window.VRODOS_COMPILE_DIAGNOSTICS` and warn in the console when expensive asset or scene-composition diagnostics are present.
- The profiler can capture rAF p50/p95, renderer info, trace summaries, resource sizes, console errors, and failed network requests.
- The profiler can optionally write a Spector.js capture JSON after timing samples.
- `?vrodos_spector=1` exposes `window.VRODOS_SPECTOR` and opens Spector's UI without affecting normal URLs.
- `node --check`, PHP lint for edited PHP files, and `git diff --check` pass for the edited files.
