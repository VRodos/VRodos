# VRodos Plugin: Agent Guide

This is the canonical root instruction file for AI agents working on VRodos. Keep it current and prefer updating this file over adding tool-specific agent docs.

## Project Overview

VRodos is a WordPress plugin for authoring and compiling interactive 3D scenes inside WordPress.

It provides:

- a browser-based Three.js scene editor for projects, scenes, and assets
- a compiled A-Frame runtime for published desktop/VR experiences
- WordPress CPT and AJAX integration for persistence and asset management
- runtime support for post-processing, Takram atmosphere, navigation, and scene-probe reflections
- optional collaborative/runtime serving through `services/vrodos-network-runtime/`

## Current Architecture

```text
VRodos/
  VRodos.php
  includes/                        PHP managers, models, AJAX classes
  includes/admin/                  Admin page renderers such as the VRodos dashboard
  includes/asset-cpt/              Asset CPT metabox, taxonomy, submission, and shared admin helpers
  includes/asset-optimization/     GLB analysis, derivative, dashboard, and admin optimization helpers
  templates/pages/                 WordPress page templates
  templates/runtime/aframe/        A-Frame compile prototypes
  assets/js/editor/                Scene editor scripts
  assets/js/runtime/master/        Compiled-scene runtime helpers
  assets/js/runtime/master/lib/    Generated runtime bundles
  assets/css/                      Source and generated CSS
  assets/vendor/                   Vendored browser bundles such as Three r184
  runtime/build/                   Generated compiled HTML output only
  services/vrodos-network-runtime/ Node/WebRTC collaborative runtime server
  scripts/                         Build and maintenance scripts
```

Architectural rules:

- `assets/` is the single public/static asset root.
- `includes/` is PHP-only.
- `templates/runtime/aframe/` contains source HTML prototypes, not generated output.
- `runtime/build/` is generated output and should not be treated as source.
- Prefer `VRodos_Path_Manager` over hardcoded plugin paths/URLs.
- Keep compatibility globals available during migration: `vrodos_data.pluginPath`, `window.vrodos_three_vendor_base`, `window.vrodos_three_decoder_path`, and `vrodos_data.paths.*`.

Important managers:

- `VRodos_Asset_Manager`: script/style registration and enqueueing
- `VRodos_Scene_CPT_Manager`: scene editor data preparation
- `VRodos_Compiler_Manager`: compiled A-Frame scene generation
- `VRodos_Compiler_Runtime_Page_Builder`: shared compiled-client assembly path for Master/Simple template loading, DOM setup, scene settings, decoder config, object rendering, diagnostics, and output writing
- `VRodos_Compiler_Runtime_Manifest` / `VRodos_Compiler_Runtime_Script_Planner`: runtime chunk validation, dependency ordering, and lazy compiled-scene script selection
- `VRodos_Render_Runtime_Manager`: active runtime/version configuration
- `VRodos_Asset_CPT_Manager`: thin hook registrar and compatibility facade for asset admin/editor behavior; implementation lives in `includes/asset-cpt/`
- `VRodos_Asset_Optimization_Manager`: thin hook coordinator for read-only GLB benefit analysis, dashboard actionable assets, admin-side GLB derivative generation, derivative metadata, cache cleanup, and opt-in compile selection; implementation lives in `includes/asset-optimization/`
- `VRodos_Admin_Dashboard_Page`: top-level dashboard rendering, including notices, stats, Active Projects, and Actionable Assets tabs
- `VRodos_Path_Manager`: path/url indirection

## Runtime And Rendering

The active compiled runtime targets:

- A-Frame metadata declared in root `package.json`
- Three.js vendor stack `r184`, derived from the locked root `three` package alias `npm:super-three@0.184.0`
- PMNDRS `postprocessing` bundle exported as `window.POSTPROCESSING`
- Takram atmosphere/effects bundle exported as `window.VRODOS_TAKRAM_ATMOSPHERE`

Root `package.json` plus `package-lock.json` are the version source of truth. `npm run build:three` generates `assets/runtime-version-manifest.json`, and `VRodos_Render_Runtime_Manager` reads that manifest.

`assets/runtime-build-manifest.json` is the compiled runtime chunk source of truth. It must validate missing script files, undeclared dependencies, duplicate chunk ordering, and feature coverage. Keep PMNDRS, Takram, collision BVH, FPS meter, and networked bundles lazy: do not include PMNDRS unless PMNDRS post-FX is selected, do not include Takram unless PMNDRS atmosphere is enabled, and do not include networked components in single-player output.

VR spatial UI current state:

- `documentation/vrodos-compiled-scene-framework-integration.md` section 4.1 is the current handoff reference for immersive CEFR, assessment, and video interaction UI.
- A-Frame remains the compiled scene host: scene, renderer, XR session, `cameraA`, controllers, navigation, collision, media objects, and render loop.
- Immersive CEFR, assessment, and image/text POI dialogs should use `window.VRODOSSpatialUI`, backed by `@pmndrs/uikit`, `@pmndrs/uikit-horizon`, and `@pmndrs/pointer-events`; VR video trigger clicks should toggle playback directly and must not open a play/pause dialog.
- The spatial UI chunk mounts a PMNDRS/Horizon `THREE.Group` under `a-scene.object3D`; the A-Frame host component only forwards `tick()` and must not create visible UI primitives.
- Do not route immersive CEFR, assessment, or image/text POI dialogs through `VRODOSRuntimeOverlay.openVrPanel()`, A-Frame `a-plane`, A-Frame `a-text`, A-Frame modal buttons, or `.vrodos-overlay-hit-target` raycaster retargeting.
- If `spatial-ui` is unavailable in immersive XR, log diagnostics and fail closed instead of showing a broken A-Frame fallback.
- Desktop and VR assessment runtimes share renderer-key resolution through `window.VRodosImmerseAssessment.resolveAssessmentRendererKey()`; keep question/image quiz/pair/grid/text aliases there so desktop-supported assessments do not regress to the VR unsupported state.
- Greek assessment/CEFR text in spatial UI depends on Noto Sans assets under `assets/vendor/fonts/noto-sans/` and the Zappar MSDF worker/WASM under `assets/vendor/zappar-msdf-generator/`. Do not transliterate Greek or restore A-Frame text primitives to suppress glyph warnings.
- The spatial UI runtime passes the MSDF worker an `application/wasm` data URL for the vendored WASM asset so local servers that omit `.wasm` MIME types do not trigger streaming-compile warnings.
- Spatial UI panel sizing uses physical meters plus calculated `designWidthPx`/`pixelSize`; keep the default immersive panel scale at `1` and tune panel width/height, design pixels, and internal frame spacing instead of globally scaling the group.
- Immersive assessment and image/text POI panels should spawn camera-relative at readable/controller distance with `centerAtEyeLevel: true`, no object `anchorElement`, and only a short initial anchor refresh. CEFR can remain compact/lower through its explicit `topAtEyeLevel` configuration.
- Controller ray visuals use the active A-Frame controller line, but spatial UI trims that line and clamps the active controller raycaster `far` distance to the dialog surface while a panel is active, shows a small hit dot anywhere on the surface, switches to a larger/action color over selectable controls, suppresses scene raycast targets behind the modal, and restores everything on close; do not hide/retarget controller rays or add A-Frame hit planes for PMNDRS panels.
- When no modal is open in immersive XR, normal scene `.raycastable` targets get a ray endpoint dot through `vrodos-scene-ray-feedback`; this is feedback only and must not retarget scene raycasters or replace video/POI/assessment click paths.
- PMNDRS can clear its pointer intersection during a click that closes/rerenders a panel; treat that stale `pointer.up()` intersection error as benign cleanup, not as a failed click or a reason to add fallback hit geometry.
- Desktop and inline assessment, image/text POI, and video dialogs remain DOM-based.
- Recompile generated scenes after runtime changes so spatial UI scripts receive the planner's cache-busting `?ver=` query.

WebXR entry current state:

- Compiled clients hide `XRWebGLBinding` by default before A-Frame initializes so the classic A-Frame/WebGL runtime stays on the `XRWebGLLayer` path. This avoids desktop Immersive Web Emulator failures where a polyfilled layer binding is not a real `XRSession`.
- Only opt into WebXR Layers by setting `window.VRODOS_ENABLE_NATIVE_WEBXR_LAYERS === true` or `window.VRODOS_ENABLE_WEBXR_LAYERS === true` before the prototype shim runs.
- A-Frame Environment is a legacy background/preset provider only; it does not own WebXR session creation, layer selection, or controller input.
- Quest Browser immersive locomotion uses a single-owner tracking model: WebXR/A-Frame owns the HMD and controller tracking poses, while VRodos `custom-movement` owns a virtual navigation position and moves/rotates the generated `#vrodos-authored-world` container in immersive XR. Do not restore immersive locomotion by moving/rotating `#player`, baking the authored camera pose into `#player`, applying `renderer.xr.setPoseTarget(cameraA.object3D)`, offsetting the WebXR reference space, or falling back to per-root transforms for older compiled scenes; older scenes are expected to be recompiled into the newest pipeline.
- In generated `vrexpo_games`, keep `#player` as an unpositioned tracking rig with `custom-movement`, keep authored `cam_position` on `#cameraA`, and keep `#oculusLeft` / `#oculusRight` under `#player`.
- Immersive controller ray visuals must match the active A-Frame controller raycasters because those raycasters own scene selection. Do not add separate display-only WebXR target-ray lines unless selection is also moved to that same ray path; the display-only target-ray experiment showed shifted hits.

Compiled scenes keep `scene-settings` as the compatibility data contract, but focused runtime behavior lives in A-Frame components/systems:

- `vrodos-render-profile`: renderer, shadows, quality, FPS
- `vrodos-postfx-router`: legacy vs PMNDRS composer ownership
- `vrodos-atmosphere`: Takram sky, sun/moon, day-night cycle
- `vrodos-reflections`: HDR env maps, scene probe, Takram sky PMREM

Runtime defaults for PMNDRS/Takram settings come from `assets/runtime-settings-contract.json` through the generated browser contract script. GPU resources and event listeners created by runtime helpers should be tracked through `window.VRODOSMaster.RuntimeResources` and disposed from A-Frame lifecycle cleanup.

Lighting/shadow ownership:

- `RENDERING_PIPELINE.md` is the canonical current reference for PMNDRS/Takram day-night lighting, adaptive directional shadows, terrain self-shadow stabilization, and emissive/readability handling.
- Direct sun and moon scene lights are horizon-gated. Do not reintroduce below-horizon sun/moon key light to fix night readability; tune the indirect bridge instead.
- Large-terrain soft triangle/band artifacts are a shadow precision and terrain self-shadow issue, not an SSAO/refraction issue. Fixes belong in `assets/js/runtime/master/vrodos_quality_profiles.js` and `assets/js/runtime/master/vrodos_master_rendering.js`.
- Do not hardcode Takram shadow bias/normalBias values. Use the existing contact-shadow profile and keep day/night shadow radius changes shared across Takram and VRodos-managed directional lights.
- Emissive material output and flat-media readability boosts are not scene lights. Do not use emissive settings as substitutes for direct sun/moon lighting or the indirect PBR fill profile.

Rendering docs:

- `RENDERING_PIPELINE.md`: current technical render-stack reference
- `documentation/compiled-desktop-roadmap.md`: current compiled desktop/non-VR cleanup goals, active backlog, deferred VR items, and historical-doc index
- `documentation/vrodos-compiled-scene-framework-integration.md`: compiled-scene framework boundaries, runtime ownership, lazy chunks, and immersive PMNDRS/Horizon VR dialog ownership
- `VR_HEADSET_RUNTIME_HANDOFF.md`: current standalone headset runtime policy and validation checklist
- `PC_RENDERED_VR_PLAN.md`: parked PC-rendered VR parent profile plan
- `documentation/archive/rendering-history/PERFORMANCE_OPTIMIZATION_PLAN.md`: profiler, Spector, asset-audit, and derivative-optimization findings
- `documentation/archive/rendering-history/TAKRAM_REALISTIC_LIGHTING_PLAN.md`: phased Takram realism and Three-version roadmap
- `documentation/archive/rendering-history/RENDERING_MIGRATION_IMPLEMENTATION_LOG.md`: consolidated migration history
- `documentation/archive/rendering-history/POSTFX_DEBUG_NOTES.md`: historical color/Horizon debug findings

Do not load a newer Three.js beside the current classic A-Frame runtime. Future Three upgrades belong in a separate A-Frame module/import-map runtime spike where A-Frame, VRodos, loaders, PMNDRS, Takram, and addons resolve to one shared `THREE`.

## Styling And Templates

Tailwind and DaisyUI both use the `tw-` prefix.

- Use `tw-btn`, `tw-modal`, `tw-checkbox`, `tw-flex`, etc.
- Do not use the old `d-` prefix.
- Do not use `peer-checked:tw-*` variants for important state styling in WordPress templates; use explicit sibling CSS when needed.
- Put `data-theme="emerald"` on `<html>` only.
- Every rendered page body must include `vrodos-manager-wrapper`; Tailwind uses `important: '.vrodos-manager-wrapper'`.
- Do not manually run CSS builds unless the task is explicitly about building CSS. Development normally relies on `npm run watch:css`.

Template rules:

- Page templates output full HTML documents.
- Use `wp_head()` in `<head>` and `wp_footer()` before `</body>`.
- Do not call `wp_enqueue_style()` or `wp_enqueue_script()` inside templates.
- Add scripts/styles through `VRodos_Asset_Manager`.
- Do not add inline `<script src="...">` tags for libraries; register/enqueue them.

## Scene Editor Rules

- Selection fires on `mouseup`, not `mousedown`.
- `_CLICK_THRESHOLD = 5px` distinguishes click vs drag.
- No object should be auto-selected on scene load.
- `envir.camera` is not used; use `envir.orbitControls.object` for the camera.
- Use the cel-shaded back-face hull highlight helpers instead of `OutlinePass`.
- Use `lil-gui`, not `dat.gui`.
- Add null guards when accessing `transform_controls.object`.

Category icons:

- JS source of truth: `assets/js/editor/vrodos_icons.js`
- PHP mirror: `vrodos_get_asset_category_icon()`
- Do not create new category-icon maps elsewhere.

Lucide icons:

- Use `<i data-lucide="icon-name">`.
- Call `lucide.createIcons()` after dynamic DOM insertion.

## Build And Verification

Runtime package updates:

1. Update root `package.json` and `package-lock.json`.
2. Run `npm run build:three`.
3. Run `npm run build:runtime`.
4. Commit generated runtime outputs that changed intentionally.

Networked-Aframe runtime updates:

1. Update `patches/networked-aframe/config.json`.
2. Update the matching patch file under `patches/networked-aframe/`.
3. Run `npm run build:naf`.
4. Commit the regenerated `assets/vendor/networked-aframe/dist/` files when behavior changes intentionally.

Keep new VRodos multiplayer features outside patched NAF by default. Prefer first-party A-Frame components, `window.NAF` data-channel APIs, or a custom `NAF.adapters.register()` transport adapter; patch NAF only for compatibility fixes that cannot live at those boundaries.

For spatial UI runtime package changes, also commit `assets/js/runtime/master/lib/vrodos-runtime-spatial-ui.bundle.js`, keep `assets/runtime-build-manifest.json` declaring the `spatial-ui` chunk correctly, and deploy the spatial font/worker assets when text rendering changes.

Common checks:

- `npm run lint`
- `node --check` for edited JS files
- PHP syntax checks for edited PHP files
- `git diff --check`

If the local Windows `npm` shim is broken but runtime source changed, use `node .\scripts\build-runtime-master-bundles.mjs` as the direct runtime bundle build and mention that fallback in the handoff.

Performance tooling:

- Use `scripts/profile-master-client.mjs` for compiled-client CDP captures.
- Use `--disable-fps-meter` for timing comparisons unless testing the FPS meter itself.
- Use `--spector` only after rAF/trace sampling for one-frame WebGL anatomy.
- Use profiler `--resource-override URL_OR_PATH=FILE` for compiled-scene derivative trials without editing uploads or generated HTML. Treat it as a validation tool, not production substitution.
- Use `scripts/audit-master-client-assets.mjs` to correlate compile diagnostics with local GLB metadata.
- Use `scripts/prototype-optimize-master-client-assets.mjs` for derivative prototypes and admin/backend single-source optimization. In audit mode it writes reports/GLBs under the requested output directory. In admin single-source mode, `VRodos_Asset_Optimization_Manager` writes derivatives under `wp-content/uploads/vrodos-optimized-assets/asset-{asset_id}/`. Settings > Assets is a GLB-referenced diagnostics/reporting view and must not list non-GLB media as optimization work.
- `VRodos_Asset_Optimization_Manager` stores read-only GLB benefit analysis in `_vrodos_asset3d_glb_analysis` when `vrodos_asset3d_glb` changes. Analysis should remain cheap and non-generative; derivative files are created only by explicit admin actions.
- The top-level VRodos dashboard has an `Actionable Assets` tab for top GLB optimization items. Dashboard row actions are the primary single-asset operational surface for refreshing analysis and generating safe Draco derivatives, but must not auto-enable compile substitution. Analysis refresh and Compile Use toggles are AJAX row updates; safe Draco generation remains a signed admin action until a queued/progress flow exists. The dashboard Compile Use toggle is the explicit per-asset control for enabling/disabling derivative substitution and must validate a ready derivative before enabling.
- Cached derivative files are owned by the asset post. Permanent `vrodos_asset3d` deletion must remove `wp-content/uploads/vrodos-optimized-assets/asset-{asset_id}/` and optimization metadata; project deletion should get this by deleting associated asset posts.
- `npm run build:three` copies Draco, Basis/KTX2, and Meshopt decoder assets into `assets/vendor/three-r184/` and records them in `assets/runtime-version-manifest.json`.
- Compiled scenes receive root `gltf-model` decoder paths from `VRodos_Compiler_Manager`; regenerate compiled HTML before testing compressed derivatives.
- Use `meshopt_decoder.js` for A-Frame `meshoptDecoderPath`. A-Frame loads this path as a classic script, so do not point compiled scenes at the ESM `meshopt_decoder.module.js`; the vendor build no longer publishes a `.module.js` compatibility copy for older generated clients.
- Do not enable compile substitution for Draco, Meshopt, or KTX2 derivatives until the relevant A-Frame/Three decoder path is present in the generated client and visual parity is checked. Substitution must remain per-asset opt-in.
- Treat future LOD as an explicit derivative family (`lod0`, `lod1`, `lod2`) with opt-in compile/runtime selection, not as a silent downgrade of uploaded source assets.

Do not manually copy standalone PMNDRS bundles. `postprocessing` is exported from `assets/js/runtime/master/lib/vrodos-postprocessing.bundle.js`.

## Local Development

Local setup:

1. Install WordPress locally.
2. Place the plugin in `wp-content/plugins/VRodos/`.
3. Activate the plugin.
4. Use non-plain permalinks.

Collaborative/runtime server:

```bash
cd wp-content/plugins/VRodos/services/vrodos-network-runtime
npm install
npm start
```

The local runtime server is typically used on port `5832`.

## Security And WordPress Standards

- Use `absint()` for WordPress IDs.
- Use `sanitize_text_field()` for strings.
- Do not log or print secrets.
- Protect `.env` and `services/vrodos-network-runtime/server/keys.json`.

## Cleanup Rules

- Do not treat `runtime/build/` HTML as source.
- Do not reintroduce `js_libs/` or the mirrored `includes/templates/` tree.
- Do not reintroduce top-level `css/` or `images/`; `assets/css/` and `assets/images/` are canonical.
- Keep cleanup/removal work separate from behavioral fixes when possible.
