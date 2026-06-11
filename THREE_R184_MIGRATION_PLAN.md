# VRodos Three r184 / A-Frame r184 Migration Plan

## Summary

- Migrate VRodos from Three r181 to Three r184 across the editor, admin asset viewer, build scripts, runtime manifests, compiled A-Frame scenes, PMNDRS postprocessing/spatial UI, Takram atmosphere, collision BVH, and current docs.
- Use the A-Frame master CDN dist at commit `adf8f4e02b0499223b2c4fa93165e49b50384564`, reached from the README CDN commit `c7d8ab02e56e9e3862482493d41dd3fb9e6febf3`.
- Mirror A-Frame's Three substrate by using `three: npm:super-three@0.184.0`, so editor/vendor builds and compiled scenes resolve against the same r184 family.
- Keep the one-THREE rule: compiled scenes continue using A-Frame's `AFRAME.THREE`/`window.THREE` path and do not load a second independent Three build.

Sources checked:

- A-Frame README CDN commit: https://github.com/aframevr/aframe/commit/c7d8ab02e56e9e3862482493d41dd3fb9e6febf3
- A-Frame super-three 0.184.0 fix: https://github.com/aframevr/aframe/commit/bfe050827a0ba0944cd114803bcbc57d29d96a56
- Three migration guide r181 to r184: https://github.com/mrdoob/three.js/wiki/Migration-Guide
- Three r184 release: https://github.com/mrdoob/three.js/releases/tag/r184

## Key Changes

- Update `package.json` and `package-lock.json`: set `three` to `npm:super-three@0.184.0`, add `meshoptimizer@^1.1.1`, update A-Frame master metadata, and keep PMNDRS/Takram/postprocessing/BVH versions unless validation requires a patch bump.
- Update build tooling: support npm alias declarations, generate `assets/vendor/three-r184/`, regenerate runtime manifests and bundles, and add a generated `three-addons-vendor` runtime chunk for official r184 addon loaders.
- Update editor/admin frontend behavior: use `THREE.Timer` when available, map stored `pcfsoft` shadow intent to `PCFShadowMap`, remove r181 fallbacks, and configure GLTF loaders for Draco, KTX2/Basis, and Meshopt.
- Update compiled runtime: point decoder paths at `three-r184`, load official r184 HDR/RGBE addon support before core runtime code, preserve compatibility globals, and keep the WebXR Layers opt-in shim.
- Update current docs to r184 and mark older notes as historical where needed.

## Public Interfaces

- `vrodos.runtime.aframe` metadata changes to the new A-Frame master CDN commit and URL.
- `assets/runtime-version-manifest.json` changes from `three-r181` / `vrodos-three-r181.bundle.js` to `three-r184` / `vrodos-three-r184.bundle.js`.
- Existing JS globals remain stable; only their manifest values and URLs change.
- Existing scene settings remain backward-compatible: `pcfsoft` may remain in stored scene data, but runtime rendering maps it to r184-safe `PCFShadowMap`.
- `assets/runtime-build-manifest.json` adds the generated `three-addons-vendor` chunk.

## Test Plan

- Build/static: `npm.cmd ls three postprocessing @takram/three-atmosphere @takram/three-clouds @takram/three-geospatial-effects @pmndrs/uikit @pmndrs/pointer-events three-mesh-bvh meshoptimizer`, `npm.cmd run build:three`, `npm.cmd run build:runtime`, `npm.cmd run lint`, `node --check` edited JS, PHP syntax checks for edited PHP, and `git diff --check`.
- Editor/admin: verify `THREE.REVISION === "184"`, no auto-selection on load, orbit/transform/selection/drag behavior, GLB/HDR loading, asset viewer animation, and Draco/Meshopt/KTX2 previews.
- Compiled scenes: recompile representative Master/Simple scenes, confirm A-Frame master plus Three r184, no second Three instance, decoder paths under `assets/vendor/three-r184/`, and video/audio/assessment/CEFR/POI/navigation/collision/networked flows.
- Rendering/XR: compare default/high shadows, legacy postFX, PMNDRS postFX, Takram sky/day-night, HDR reflections, scene probes, desktop Immersive Web Emulator, and Quest Browser controller/spatial UI behavior.
- Performance: use `node scripts/profile-master-client.mjs ... --disable-fps-meter`; use Spector only if profiler or visual QA shows a GPU/rendering anomaly.

## Assumptions

- The migration follows A-Frame's `super-three@0.184.0` choice, not upstream `three@0.184.0`.
- The active runtime remains classic A-Frame/WebGL; no WebGPU or import-map runtime spike is included.
- PMNDRS, Takram, `postprocessing`, and `three-mesh-bvh` are considered compatible with r184 based on peer ranges and only change if validation fails.
- WebXR Layers remain disabled by default through the existing shim.
- Runtime derivative substitution remains explicit per asset; this migration does not silently enable Draco, Meshopt, KTX2, or LOD substitutions.
