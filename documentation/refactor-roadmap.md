# VRodos cleanup and refactoring roadmap

Status: **partially implemented; authenticated editor baseline validated** (2026-09-11). Preserve current compiler, storage, and connector contracts. Checked items are complete; unchecked items remain in the approved roadmap.

## A. Verification baseline
- [x] Central test catalog and runtime/compiler runner; every test must be catalogued.
- [x] Separate verification from generated builds; scope formatting to authored source.
- [x] Replace affected brittle assertions when refactoring their logic; retain vendor/provenance checks.

## B. Built-in media
- [x] Reproducibly resize speaker and assessment textures to 1024px without changing formats, geometry, materials, or public paths.
- [x] Record sizes and validate appearance.
- [x] Audit dynamic/stored references before deleting unused TV/HDR assets.

## C. Shared helpers
- [x] Consolidate debug/query parsing and required atmosphere contract defaults.
- [x] Consolidate PHP/editor CEFR normalization with parity fixtures.
- [x] Share import temporary-file creation.
- [x] Remove unused editor button compatibility shim and dependencies.

## D. Assessment
- [x] Share question, pair, grid, and text response/grading builders between DOM and spatial renderers.
- [x] Preserve aliases, payloads, ordering, ungraded semantics, and distinct layouts in regression tests.
- [x] Share equivalent DOM overlay mounting.
- [x] Use the required shared overlay for assessment control locking; test repeated open/close and VR look preservation.
- [ ] Validate Greek spatial interaction in browser/headset.

## E. Optimizer
- [x] Extract source metadata, GLB analysis, and dashboard aggregation/sorting classes; route manager domain APIs through a service.
- [x] Move worker/source-change hooks from admin controller to the domain service; orchestration still composes existing traits.
- [x] Separate read-only lookup from explicit normalization/snapshot updates.
- [x] Bulk-load dashboard metadata, preserve global sorting, avoid page-render writes/hashing.
- [x] Preserve immutable jobs, leases, source generations, retries, and profile chaining in regression coverage.
- [x] Evaluate repeated scans; remove the full collection scan from single-row dashboard refreshes.
- [ ] Validate live replacement/deletion/status flows against WordPress.

## F. Import and editor
- [x] Extract staged-session access from import HTTP controller.
- [x] Extract import execution from the HTTP/settings manager.
- [x] Share session validation with ownership checks.
- [x] Separate property panel presentation, category controls, and change application.
- [x] Share primitive-plane material definitions and refresh behavior with undo.
- [x] Consolidate nine numeric transform handlers; capture undo for keyboard-only focus as well as pointer interaction.
- [x] Route cross-object transform undo/redo through the selection service to keep hierarchy, gizmo, and property panel aligned.
- [x] Share light property application between controls and undo; unify preview/commit input handling.
- [x] Route numeric transform synchronization through the transform service, including bounds invalidation without an attached proxy.
- [ ] Finish coordinating all property-change side effects through transform/persistence services.

## G. Runtime ownership
- [x] Extract desktop pixel-budget calculation into a focused module without changing formulas or constants.
- [x] Extract accelerated celestial clock calculations, preserving solar-day wrapping and lunar date progression.
- [x] Extract MoonPhase normalization, illumination, direction, and orientation calculations with behavioral coverage.
- [x] Extract celestial coordinate frames and local/ECEF transforms, preserving WGS84 constants and config-owned caches.
- [x] Extract shared light value/color interpolation, preserving clock selection, pause limits, and component-owned state.
- [x] Extract shadow-map type mapping, sampler compatibility, and render-target disposal without changing refresh policy.
- [x] Extract the shadow subsystem: roles, terrain depth materials, adaptive fitting, refresh scheduling, diagnostics, and presented-light transforms.
- [x] Extract celestial lighting profiles, exposure, indirect fill, sun/moon gates, helper lights, and Takram light synchronization.
- [x] Extract renderer quality, material enhancement traversal, and reflection-intensity updates without behavior changes.
- [x] Extract cloud sun/moon attenuation, shadow factors, smoothing, diagnostics, and star recovery without behavior changes.
- [x] Extract scene-geometry sun occlusion, target caching, raycast sampling, and sun/haze/lens-flare visibility application.
- [ ] Extract remaining sky and cloud rendering modules without behavior changes.
- [ ] Move lifecycle/state ownership to existing focused components.
- [x] Keep scene-settings as configuration/coordination; remove duplicate tick path with explicit component registration checks.
- [x] Deduplicate shared resources within registry teardown.
- [ ] Audit single ownership and disposal of every GPU resource/listener.

## H. Measured performance
- [x] Capture one heavy scene before/after initial runtime changes with FPS meter disabled.
- [ ] Capture empty and assessment/media scenes before loading changes.
- [ ] Evaluate capability-based assessment/atmosphere loading.
- [ ] Profile traversal/diagnostics independently of GPU work; retain only measured improvements.

## Validation
- [x] Complete test suite, JS/PHP syntax, lint, build-config, generated outputs, diff checks.
- [ ] Assessment parity; import retry/failure; optimizer replacement/deletion; read-only dashboard.
- [x] Authenticated editor selection, numeric properties, undo/redo, save/reload, and Custom desktop build polling.
- [x] Validate scene-gizmo translation and undo in the authenticated editor.
- [ ] Complete remaining category-specific interaction checks.
- [x] Recompile and visually smoke-test Custom single-player desktop scene 13775.
- [ ] Recompile Custom/Adaptive, single-player/networked, desktop/headset scenes.
- [ ] Browser and real Quest checks: XR entry/exit, Greek text, controllers, lighting/shadows/reflections, disposal.

## Baseline (2026-09-11)
Build-config passed; lint 0 errors/245 warnings; 19 runtime tests passed. PHP planner/DOM passed; transaction fixture creation was blocked by read-only temporary directory access. No browser or headset timings measured.

## Boundaries
VRodos changes only. No framework or dependency upgrade. Preserve published/AJAX contracts, migration safeguards, settings globals, rendering constants, navigation math, and vendor patches. Do not remove media based only on literal-reference searches. No commits or pushes by the agent.

## Implementation log
### Verification and implementation

`scripts/regression-test-catalog.mjs` explicitly owns 53 scripts: 25 runtime and 28 compiler. `scripts/run-tests.mjs` verifies coverage and launches separate processes. Existing npm entrypoints remain; ordinary checks do not rebuild tracked bundles. Formatting excludes vendor/generated files. No framework or dependency was added.

All **53 tests pass** in the writable fixture environment. Browser-source ESLint at the initial cleanup pass: **0 errors, 243 warnings**; subsequent changed editor files pass lint without warnings. Edited/new PHP/JS syntax, runtime syntax, generated manifest/build configuration, and diff whitespace checks pass. Runtime bundles were regenerated explicitly for runtime changes.

Shared helpers cover live debug/query flags, required atmosphere contracts, PHP/editor CEFR normalization, and ZIP/Blender temporary files. Removed the unused editor button shim and its dependencies. Seven assessment builders and grading are shared across DOM/spatial renderers; existing 15-case assessment harness passes. Added fixtures cover CEFR, Greek question responses, debug flag changes, and duplicate resource disposal.

Optimizer domain callers now use `VRodos_Asset_Optimization_Service`. Independent classes own source snapshots, GLB analysis, and dashboard aggregation/sorting. `inspect_source_glb` is read-only; `prepare_source_glb` explicitly normalizes and refreshes identity at existing processing boundaries. Dashboard scans, row inspection, and metabox inspection use the read-only path. Metadata is primed in batches of 200. Tests verify no scan writes, missing/stale source identity, global priority tie-breaking, title sorting, and pagination. Existing stat/hash cache and immutable queue behavior remain.

Staged-session reads are centralized, including ownership checks shared by inspect/prepare/status/consume. Tests cover missing/invalid manifests, owner mismatch, invalid project, and revoked edit permission. Property presentation/category scripts have ordered enqueue dependencies; common changes stay in the original controller. Primitive-plane refresh behavior is shared with undo. Import execution now has its own service; broader change-side-effect consolidation remains unfinished.

### Media results

| Asset | Before bytes | After bytes |
|---|---:|---:|
| `assets/models/runtime/speaker.glb` | 36,186,752 | 11,787,684 |
| `assets/models/runtime/assessment.glb` | 16,723,120 | 4,806,512 |
| `assets/models/editor/tv.glb` | 200,672 | Removed |
| `assets/models/editor/tv_rotated.glb` | 219,064 | Removed |
| `assets/models/editor/tv_flat_scaled_rotated.glb` | 30,943,596 | Removed |
| `assets/images/hdr/Stonewall_Ref.hdr` | 27,150,890 | Removed |

Total media reduction: **94,829,898 bytes / 90.44 MiB**.

Run `node scripts/optimize-builtin-media.mjs` for a dry run; `--write` explicitly applies resizing using the existing Sharp dependency. Formats/alpha are preserved and no decoder requirement is added. Independent comparison with Git originals verified all four non-image buffer views in each model are byte-identical. Scene/material/accessor JSON is unchanged except buffer layout and JSON normalization of signed zero. Browser comparison with identical cameras/lighting showed consistent appearance at normal viewing size; no close-up pixel-equality claim is made.

The read-only database audit found no references to the small TVs or HDR in posts, postmeta, or options. The flat TV had 52 references, all historical `revision:video:glb_path` fields. Current video loading creates procedural geometry and ignores that field. Plugin/connector and dynamic-path inspection found no live consumer. No database content/revision was deleted.

### Performance evidence

The existing profiler captured published scene 13775 before/after rebuilding the runtime, with FPS meter disabled: RTX 2060, 1280×720 viewport, DPR 1, renderer pixel ratio 1.25, 120 frames, 1.5-second requested trace.

| Measure | Before | After |
|---|---:|---:|
| rAF median | 18.0 ms | 18.0 ms |
| rAF p95 | 197.4 ms | 210.1 ms |
| rAF mean | 71.34 ms | 78.10 ms |
| Meshes / geometries / materials / textures | 332 / 312 / 4 / 7 | Same |
| Resources / transfer | 36 / 51.4 MB | Same |
| Exceptions / failed requests | 0 / 0 | 0 / 0 |
| Console warnings/errors | 7 | 7 |

These short, variable captures do **not** establish a performance gain or a stable regression estimate. No speculative capability-loading change was retained. The sun-occluder list already refreshes on a 2.5-second cache.

### Authenticated editor follow-up (2026-09-11)

Login succeeded on `http://160.40.52.199/wp_vrodos/`. A fresh editor instance loaded the extracted panel/category scripts. Checked model selection, numeric translation, cross-object undo, plane width undo/redo, autosave, and reload. Temporary model-position and plane-width changes were restored exactly. Custom single-player desktop compilation completed all three steps and the published scene rendered its model, textured plane, and atmosphere.

Cross-object undo exposed inconsistent ownership: numeric controls could switch to the command target while the property panel still described the previously selected object. Transform undo/redo now calls the existing selection service, preserving transform mode and synchronizing panel, hierarchy, and gizmo. The browser reproduction and a regression test pass. Keyboard-only focus now captures the initial transform for undo; nine repeated axis handlers share one implementation. Tests cover live-versus-committed changes, rotation conversion, uniform scaling, absent targets, and keyboard-only undo capture.

Optimizer source activation/deletion and worker callbacks now bind the domain service. The lifecycle fixture exercises the extracted domain hook trait. All 26 compiler tests pass. No credentials changed and no server was started.

Remaining work: broader property-side-effect coordination, remaining editor categories, and the staged runtime ownership/performance work below. The login blocker is resolved.

Focused runtime components still delegate into scene-settings state: **the ownership migration is not complete**. No rendering constants, shadow policy, navigation math, library versions, or vendor patches changed. No Custom/Adaptive/networked/headset recompilation matrix or real Quest acceptance is claimed. Validate XR entry/exit, controllers, Greek text, lighting, shadows/reflections, and repeated mount/removal before completing those checkboxes.

No development server was started. No commit or push was performed. Keep media changes distinguishable from behavior refactors during review.

### Import execution extraction (2026-09-11)

`VRodos_Asset_Import_Execution` now owns staged inspection/preparation, conversion, activation, job scheduling, retry, status, and cleanup. The manager retains WordPress hooks, settings, HTTP authentication and responses, with its existing public methods forwarding to the service. All 29 moved method bodies and all manager public signatures were mechanically compared with the previous revision and preserved.

The new HTTP retry fixture verifies success/error envelopes, queue deduplication, expired-source failure, cleanup metadata, and rejection without mutation for unauthorized users. All 49 regression scripts pass (27 compiler, 22 runtime), plus PHP syntax, catalog coverage, build configuration, and diff checks. This package did not run a live Blender conversion or change generated runtime bundles.

### Editor property application follow-up (2026-09-11)

Light property controls and property undo/redo now use `applyEditorLightProperty` for assignment, color, target linking, and helper/shadow synchronization. Numeric, color, and shadow-radius controls share one preview/commit lifecycle. Shared simple property inputs use one undo/save path, including POI/chat fields. Live previews do not save; unchanged commits do not create duplicate undo entries. Focused edits retain their object identity so a stale event cannot modify another selection. The controls declare their required undo-engine enqueue dependency.

The behavioral fixture executes authored input code, the actual undo engine, and light helpers with Three objects. It covers numeric preview/commit, repeated commits, radius and color undo, target replacement undo/redo, stale selection, absent targets, and non-light inputs. All 50 regression scripts pass (23 runtime, 27 compiler); changed browser files pass ESLint and syntax checks, PHP registration passes syntax, and build configuration and diff checks pass. No generated runtime build was needed. Live browser/category acceptance remains outstanding for this package. No server was started and no commit or push was performed.

### Transform coordination and browser checks (2026-09-11)

`transforms.finishObjectChange` coordinates matrix updates, bounds invalidation, light-helper synchronization, proxy synchronization, render requests, and commit-only autosaving. Both the transform service GUI entrypoint and numeric panel edits use it. Edits without a selected object no longer schedule unnecessary saves. The transform input test now executes the actual service with Three objects and verifies bounds/light updates for every preview/commit, including objects without an attached proxy. All 50 regressions, changed JS lint, build configuration, and diff checks pass.

Authenticated Chrome at `http://160.40.52.199/wp_vrodos/`, 1536 x 799 viewport: scene 13775 loaded and rendered; numeric X translation 0 to 2, undo/redo, saving and reload were verified. A canvas gizmo drag changed X to approximately 9.03; undo restored zero. The original plane position [0,0,0] was restored and saved. Console capture after reconnecting contained no errors/warnings; screenshot showed the restored zero position and rendered scene. Browser automation temporarily lost its connection; checks resumed in a fresh tab. Used the available CUA/Playwright browser API with the existing Chrome login. No server was started and no commit/push was performed. Remaining category-specific, broader property coordination, and headset checks are still open.

### Numeric drag regression and popup behavior (2026-09-11)

A browser reproduction exposed mixed cached editor scripts: new property controls called finishObjectChange while the cached transform service lacked it. Added filemtime versions for controls, transforms, undo, and light helpers. Focused inputs now finish keyboard editing before a new scrub begins. Regression tests cover focused translation/rotation/scale scrubs and one undo/save per gesture. Transform undo/redo selects without opening the properties panel.

Browser verification: translation increased by 0.40, rotation by 0.40 degrees, and scale by 0.20 for 40-pixel drags. Undo and redo both kept a closed panel hidden. Relevant runtime suite (23 scripts), changed-file lint, PHP syntax, build configuration, and diff checks passed. Earlier full-suite count remains 50.

Undo/redo popup preference: keep a closed panel closed; explicitly synchronize GUI and property content when restoring selection so an open panel displays the restored values. Regression assertions cover both flags.

### Targeted optimizer row refresh (2026-09-11)

Single-row dashboard refresh previously scanned every GLB and merged buckets only to obtain the requested asset title. It now reads that title directly and retains its existing per-asset source/analysis/derivative reads. Full-list global sorting and pagination are unchanged. No new cache, invalidation layer, or persistent storage was added.

A row assembly fixture rejects collection scans and verifies 20 repeated requests each read only the requested asset, preserving payload keys and reacting to renamed titles, stale analysis, replaced sources, and missing sources. Real temporary-file source fixtures also verify repeated read-only inspection, content-generation advancement, same-content attachment replacement, and deleted files. Existing lifecycle tests cover cancellation and derivative cleanup. These are isolated regressions, not live WordPress replacement/deletion acceptance.

### Shared assessment interaction lifecycle (2026-09-11)

Removed the assessment-specific control pause/play and cursor-reset fallback. Assessment now delegates to the shared overlay that loads earlier in the same scene-components bundle. A regression asserts this required source order and exercises authored lifecycle code: repeated lock/unlock is idempotent, custom movement uses pause/play, desktop movement/look is locked, cursor cleanup runs on release, and the VR preserve-look option leaves HMD look controls untouched. Existing shared behavior was preserved; this package does not add nested-modal ownership or change control restoration policy.

All 52 regression scripts pass (24 runtime, 28 compiler), with build configuration and diff checks passing. Changed-source ESLint has zero errors and one existing chained-assignment warning. Runtime bundles were explicitly rebuilt using the direct Node build entrypoint; only the scene-components bundle changed. Greek spatial/browser/headset acceptance and published-scene recompilation remain outstanding. No server was started and no commit/push was performed.

### First rendering module extraction (2026-09-11)

Moved desktop render pixel-budget parsing, CSS-size resolution, and budget calculation into `vrodos_render_pixel_budget.js`. Quality profiles call `VRODOSMaster.RenderPixelBudget.apply`; the core build catalog loads the module first. The three moved function bodies were compared against the prior Git revision and are identical. No rendering constants, shadow policy, navigation, or library versions changed.

New behavioral fixtures cover uncapped Custom rendering, active-profile and query precedence, invalid overrides, performance defaults, ratio limits, immersive XR exclusion, renderer-size fallback, backing-canvas scaling, and viewport fallback. All 53 regression scripts pass (25 runtime, 28 compiler), plus build configuration and diff checks. Runtime artifacts were rebuilt explicitly. Lint has zero errors; the quality helper retains its existing nine warnings. This is an initial boundary extraction; quality/shadows, celestial lighting, sky/cloud ownership, and browser/headset acceptance remain open. No server was started or commit/push performed.

### Celestial clock extraction (2026-09-11)

Moved accelerated day/night clock selection and date progression into `vrodos_celestial_clock.js`, loaded before quality profiles in the core bundle. Date parsing remains at the caller, and state remains on the existing component. Timing formulas and constants are unchanged, including the 15-second minimum, solar-day wrapping, and continuous lunar date progression. This does not complete celestial lighting or lifecycle ownership migration.

Behavior tests execute the extracted module and cover multiple cycles, duration/date resets, backwards clocks, tick/performance source changes, invalid ticks, minimum duration, and independent component state. Replaced the corresponding formula-text assertions in the Moon regression with these tests; retained Moon integration and vendor safeguards. The shadow fixture now loads the required clock module.

All 54 regression scripts pass (26 runtime, 28 compiler). JS syntax, build configuration, and diff checks pass; changed browser source lint has zero errors and the quality helper's nine existing warnings. Explicitly regenerated the core bundle and manifest. Published-scene recompilation and browser/headset acceptance remain outstanding. No server was started and no commit/push was performed.


### Moon phase module extraction (2026-09-11)

Moved phase normalization, illumination, anti-sun direction, and lunar orientation into `vrodos_moon_phase.js`. The existing `VRODOSMaster.MoonPhase` API retains its properties and now exposes direction and configuration application. Quality profiles use the module, loaded after settings helpers and before quality profiles. All seven moved function bodies were mechanically compared with the prior Git revision and are unchanged. No lighting constants, astronomical position policy, shaders, resource ownership, or vendor patches changed.

New tests execute the module with the settings contract and real Three vectors/matrices. They cover all eight named phases, manual auto/full behavior, preservation of astronomical positions for authored phases, automatic illumination, stable polar orientation, and lunar date/matrix precedence. Replaced the corresponding source-marker assertions with behavioral coverage while retaining Moon integration and vendor-patch checks.

All 55 regression scripts pass (27 runtime, 28 compiler), along with JS syntax, build configuration, and diff checks. Changed browser source lint has zero errors and nine existing quality-helper warnings. The core bundle and runtime manifest were explicitly rebuilt. Celestial lighting, sky/cloud extraction, component state ownership, published-scene recompilation, and browser/Quest acceptance remain open. No server was started and no commit/push was performed.

### Celestial coordinate frame extraction (2026-09-11)

Moved local sun direction, WGS84 frame construction, local/ECEF conversion, direction angles, and world-to-ECEF matrix application into `vrodos_celestial_coordinates.js`. The core build catalog loads the required module before quality profiles. The numeric clamp now lives in the existing runtime settings helpers so both callers share its exact parsing and boundary behavior. All nine moved coordinate function bodies and the clamp were mechanically compared against the prior Git revision and are unchanged. Config-owned frame caching, the authored-world axis mapping, rendering constants, and navigation math are preserved.

Behavioral tests use real Three vectors/matrices and cover equatorial and polar anchors, orthonormal bases, round-trip direction conversion, coordinate bounds, independent config caches, authored azimuth/elevation, missing-input behavior, and matrix application. The shadow fixture loads the required module. All 56 regression scripts pass (28 runtime, 28 compiler), with runtime syntax, catalog coverage, build configuration, and diff checks passing. Full browser-source lint has zero errors and 242 warnings; the new module and shared helper have no warnings, while quality profiles retain nine existing warnings. Runtime artifacts were explicitly rebuilt with the direct Node entrypoint; only the core bundle and runtime manifest changed.

This is a coordinate-math boundary extraction, not completion of celestial lighting, sky/cloud modules, or component lifecycle ownership. Published-scene recompilation and browser/Quest rendering acceptance remain outstanding. No server was started and no commit or push was performed.

### Light smoothing extraction (2026-09-11)

Moved clock selection, smoothing alpha, numeric interpolation, and color interpolation into `vrodos_light_smoothing.js`, loaded before quality profiles in the core chunk. Quality profiles call the required `VRODOSMaster.LightSmoothing` API. All four moved function bodies match the previous Git revision exactly. Direct/indirect and cloud smoothing durations remain at their existing policy call sites. State and reset ownership stay on the existing scene component; no lighting constants, navigation math, or resource ownership changed.

The new regression executes authored code with real Three colors. It covers first samples, live-value initialization, repeated ticks, target changes, independent channels/components, long pauses, backwards clocks, disabled/re-enabled smoothing, invalid numeric targets, clock fallback/source changes, color cloning/interpolation, and the existing component reset contract. The shadow fixture loads the required module. All 57 regression scripts pass (29 runtime, 28 compiler), along with catalog coverage, runtime/generated-core syntax, build configuration, and diff checks. Changed-source lint has zero errors; quality profiles retain nine existing warnings and the new module has none. Runtime artifacts were rebuilt explicitly with the direct Node entrypoint; only the core bundle and manifest changed.

Broader celestial lighting/sky/cloud extraction, lifecycle ownership, published-scene recompilation, and browser/Quest acceptance remain outstanding. No server was started and no commit or push was performed.

### Shadow map compatibility and disposal extraction (2026-09-11)

Moved shadow-map type normalization, Three/A-Frame mapping, diagnostic names, sampler compatibility, and target disposal into `vrodos_shadow_maps.js`. Quality profiles bind the required `VRODOSMaster.ShadowMaps` API, loaded earlier in the core bundle. All six moved function bodies were mechanically compared against the previous Git revision and are unchanged. Scene traversal, forced refresh, material invalidation, diagnostic counters, and shadow tuning stay at their existing call sites.

New behavioral coverage uses real Three render targets/depth textures to verify disposal events, ordering, reference clearing, and repeated cleanup. It also covers Basic/PCF sampler compatibility, type normalization, missing inputs/constants, optional disposal methods, and the existing early return when only a secondary map pass remains. This extraction deliberately preserves that behavior; it does not claim a completed resource-ownership audit. The existing integration fixture loads the required module and continues checking scene-level shadow refresh.

All 58 regression scripts pass (30 runtime, 28 compiler), plus catalog coverage, runtime/generated-core syntax, build configuration, and diff checks. Changed-source lint has zero errors, with nine existing quality-helper warnings and none in the new module. Explicit rebuilding through the direct Node entrypoint changed only the generated core bundle and runtime manifest. Broader shadow/lifecycle ownership, published-scene recompilation, and browser/Quest validation remain outstanding. No server was started and no commit or push was performed.

### Shadow subsystem extraction (2026-09-11)

Moved 67 functions and component methods (roughly 1,500 lines) out of quality profiles into `vrodos_shadow_runtime.js`. The module now owns shadow-role classification, terrain self-shadow depth material application, contact-shadow stabilization, adaptive bounds/frustum fitting, static/dynamic refresh policy, dirty-update coalescing, navigation throttle/settle timers, shader/resource compatibility refresh, diagnostics, and presented-light transforms. The existing component methods remain on `VRODOSMaster.SceneSettingsHelpers`; quality profiles assembles them from the required shadow module. Five explicit host callbacks provide debug settings, day/night state, time, and immersive navigation. Existing component state, resource tracking, and teardown ownership are unchanged.

AST comparison against the previous Git revision verified all 67 moved function/method bodies, all retained function bodies, and the moved constants/bindings are identical apart from source positions. No rendering constants, navigation math, public component method signatures, dependency versions, or vendor patches changed. The core catalog loads the shadow module before quality profiles; the runtime core bundle and manifest were regenerated explicitly through the direct Node build entrypoint.

The new subsystem regression uses real Three geometry, lights, cameras, and depth materials. It covers hidden/ancestor/navmesh/media role precedence, material participation, terrain depth-material reuse/tracking/restoration, strong-contact bias stabilization, frustum containment, desktop/headset map-size policy, coalesced dirty flushes, program-refresh deduplication, static/dynamic policy, navigation throttle/distance/settle/cancellation, and immersive presented-transform revisions/container ownership. Existing integration fixtures still exercise the assembled quality helper. All 59 regression scripts pass (31 runtime, 28 compiler); runtime syntax, generated-core syntax, catalog coverage, build configuration, and diff checks pass. Changed-source lint has zero errors and the same nine quality-helper warnings; the shadow module has none.

The roadmap now separates the completed shadow extraction from remaining render/material quality, celestial lighting, sky, and cloud work. Component lifecycle/state migration and the full resource audit are still unfinished. Published-scene recompilation and live browser/Quest visual acceptance were not performed in this package. No server was started and no commit or push was performed.

### Celestial lighting subsystem extraction (2026-09-11)

Moved 52 functions/component methods and 14 constant declarations (roughly 1,600 lines of lighting logic) into `vrodos_celestial_lighting.js`. The module owns calibrated celestial anchors/interpolation, direct sun/moon visibility, night reflections/stars, indirect sky/PBR/ambient fill policy, exposure selection, A-Frame helper/default-light handling, Takram light creation/reuse/removal, readiness refresh, and presented light synchronization. Quality profiles creates the required module with the existing shadow interface and explicit host callbacks for sky/cloud integration and settings. Public component methods remain installed on `VRODOSMaster.SceneSettingsHelpers`; existing scene-component state and lifecycle ownership are preserved.

AST comparison against the previous Git revision verified every moved function/method, the 14 moved constant declarations, and all retained function bodies are identical apart from source positions. The core build catalog loads celestial lighting before quality profiles; runtime artifacts were explicitly rebuilt with the direct Node entrypoint. Only the core bundle and runtime manifest changed among generated artifacts.

The new regression loads the actual assembled quality, shadow, coordinate, settings, and smoothing modules with real Three scene objects. It tests horizon thresholds, static exposure anchors, authored exposure/cycle precedence, cached profile identity, moon-dependent reflections/stars, smoothing durations, sun/moon shadow ownership, light reuse/reattachment, cloud attenuation and first-sample timing, neutral direct lighting below the horizon, retained indirect fill, removal, missing-texture failure, and the existing DOM helper path. Takram-specific light classes are test doubles; this is not a GPU shader or visual test. Moved Moon formula markers were replaced with behavioral assertions; vendor/shader provenance safeguards follow both source modules.

All 60 regression scripts pass (32 runtime, 28 compiler), together with runtime/generated-core syntax, build configuration, and diff checks. Changed-source lint has zero errors and the same nine quality-helper warnings; the new module has none. No rendering constants, navigation math, dependency versions, or vendor patches changed. Remaining work includes sky/cloud and render/material extraction, component lifecycle migration, and resource ownership auditing. Published-scene recompilation and browser/Quest visual acceptance were not performed. No server was started and no commit or push was performed.

### Collision-safe derivative queue fix (2026-09-11)

Production diagnosis reproduced the standalone headset build waiting at 4/10 assets and 99% while the category-based Web derivative family was already complete. A decoration asset with scene collision enabled requires a different immutable geometry-protected variant. Compiler preflight previously kept waiting on the completed family instead of scheduling that variant.

Preflight now preserves initial family ordering, then joins or queues the exact scene-requested variant through `ensure_derivative()`. Existing matching jobs use their own progress and queue recovery on subsequent polls. Geometry protection, texture caps, runtime rendering, and source assets are unchanged. This is a behavioral fix separate from the rendering extractions.

Regression coverage checks both geometry-policy mismatch directions, real pending-job progress, build priority, repeated-poll deduplication, and readiness after the required variant completes. The new regression fails against the previous implementation. All 28 compiler regression scripts, PHP syntax, build configuration, and diff checks pass. No runtime bundles need regeneration. Production deployment and a successful rebuild of project 1098 remain outstanding; deploy the PHP fix, retry the headset build, and let the existing scheduler generate the missing variants. No commit or push performed.

### Private admin image thumbnail fix (2026-09-11)

WordPress image downsizing was replacing the private-media endpoint basename with an image thumbnail filename, producing `/wp-admin/...-300x300.png` requests and 404s in the asset edit page. Storage now handles `image_downsize` for private image attachments: named and dimension-array requests select the existing metadata size and return its authenticated delivery URL, constrained dimensions, and intermediate-size flag. Full-size and unavailable-size requests retain WordPress's original-image behavior. Public attachments and private non-image files keep their existing handling. Authorization and private-media serving remain unchanged.

Added storage regression coverage for named sizes, dimension arrays, full/missing sizes, missing metadata, public attachments, and private GLBs. All 28 compiler regression scripts, PHP syntax, build configuration, and diff checks pass. No generated runtime outputs are affected. Production asset-page reload validation remains outstanding after deployment. This addresses the image 404, not the separate browser Permissions-Policy/TinyMCE warnings. No commit or push performed.

### Production build verification and compressed texture mipmaps (2026-09-11)

Reproduced the production headset build for project 1098 after the queue fix deployment: the dialog reached Build Successful, Step 3 of 3. No further queue change was needed. The older published desktop page had `selChoice=1` (Color, #eeeeee) despite atmosphere/clouds being enabled; switching only the browser runtime to Horizon restored the blue sky. The user chose to change the saved background themselves, and the subsequently opened published page reported headset/Horizon.

Separately, material quality enhancement was setting `generateMipmaps=true` on KTX2 compressed textures. Three.js requires embedded mip chains for compressed data. The helper now disables generation for compressed textures, uses embedded mip filtering when multiple levels exist, and selects linear filtering for a single level. Ordinary image generation and video handling are preserved. Regenerated the core bundle explicitly with the direct Node build entrypoint; no other generated artifacts changed.

The new regression uses real Three textures and covers embedded mip preservation, single-level filtering, repeated refresh, color-space/anisotropy behavior, ordinary images, and videos. All 33 runtime scripts, runtime syntax and build configuration pass; changed-source lint has zero errors and nine existing warnings. Diff checks pass. A browser-only correction of 15 compressed textures in the published headset/Horizon page yielded zero invalid-generation flags and a subsequent WebGL NO_ERROR sample with no context loss. This is not a deployed-code or physical Quest acceptance test; deploy the updated core bundle and recompile for the planner cache-busting URL. The production page was not modified on disk by this browser test. No commit or push performed.


### Render and material quality extraction (2026-09-11)

Moved the three renderer-quality, material-profile, and reflection-intensity component methods (roughly 275 lines) into `vrodos_render_quality.js`. Quality profiles assembles the required `VRODOSMaster.RenderQuality` module with explicit shadow, celestial-lighting, and sky/cloud host interfaces. The public methods remain on `SceneSettingsHelpers`; component state, material tracking, shadow invalidation, and lifecycle ownership remain unchanged. The low-level texture/material utilities and compressed-texture mipmap fix remain in `vrodos_master_rendering.js`.

AST comparison against HEAD verified all three moved methods and all 175 retained functions/methods are identical apart from source positions. Behavioral coverage uses real Three scenes/materials with renderer and host test doubles to exercise desktop quality and oversampling, XR pixel-ratio preservation, composer/direct tone mapping, shared-material deduplication, hidden navmesh exclusion, explicit media overrides, shadow-aware reflection policy, retained smoothing state, and both sun- and moon-dominant reflection attenuation. The corresponding moved formula-text assertion was replaced with behavioral coverage; existing lighting/shadow integration fixtures load the required module.

All 62 regression scripts pass (34 runtime, 28 compiler). Runtime and generated-core syntax, build configuration, catalog coverage, and diff checks pass. Full browser-source lint has zero errors and 242 existing warnings; the new module has no warnings. Runtime artifacts were explicitly rebuilt using the direct Node entrypoint; only the core bundle and runtime manifest changed among generated outputs.

No rendering constants, navigation math, library versions, vendor patches, or texture filtering policies changed. Sky/cloud extraction, component lifecycle migration, and resource-ownership auditing remain open. Published scenes were not recompiled, and browser/physical Quest visual acceptance was not performed. No server was started and no commit or push was performed.


### Cloud light occlusion extraction (2026-09-11)

Moved 11 functions and 24 constants (roughly 400 lines) into `vrodos_cloud_occlusion.js`. The required `VRODOSMaster.CloudOcclusion` module owns sun/moon coverage and disk attenuation, shadow factors, smoothing policy, shared diagnostics, and Moon-related star recovery. Quality profiles supplies explicit math, debug, logging, and celestial visibility callbacks; visibility callbacks resolve after celestial-lighting assembly. Existing public helpers, diagnostic object identity, component smoothing state, and reset ownership are preserved. Cloud rendering, disk sampling, sky composition, and lifecycle ownership remain at their existing boundaries.

AST comparison against HEAD verified all 11 moved functions and all 164 retained functions/methods are unchanged apart from source positions. All 24 moved constant declarations match. The cloud/Moon regression now executes the authored module with the real light-smoothing module instead of copied Moon attenuation/star-recovery formulas. Coverage includes clear/partial/opaque samples, authored/effective coverage precedence, neutral and disabled states, horizon/illumination gates, diagnostic identity and logging, first samples, static/day-night smoothing durations, independent component state, shadow factors, and star recovery. Existing assembled lighting/shadow fixtures load the required module and pass; shader/vendor provenance checks remain intact.

All 62 regression scripts pass (34 runtime, 28 compiler), together with runtime/generated-core syntax, catalog coverage, build configuration, and diff checks. Full browser-source lint has zero errors and 242 existing warnings; the new module has no warnings and quality profiles retains nine. Runtime artifacts were explicitly rebuilt through the direct Node entrypoint; only the core bundle and runtime manifest changed among generated outputs.

This completes the cloud-light occlusion boundary, not the remaining sky/cloud rendering extraction or resource/lifecycle migration. Rendering constants, navigation math, dependencies, and vendor patches are unchanged. Published scenes were not recompiled; browser and physical Quest visual acceptance remain outstanding. No server was started and no commit or push was performed.


### Scene sun occlusion extraction (2026-09-11)

Moved five functions (roughly 175 lines) into `vrodos_sun_occlusion.js`. The required `VRODOSMaster.SunOcclusion` module owns scene blocker selection, target caching, triangle-count eligibility, raycast sampling, and application to native sun, sprite/haze visibility, and lens flare. Quality profiles supplies the existing shadow classification interface and native-sun setter. All call sites, component-owned caches, and cleanup ownership remain unchanged.

AST comparison against HEAD verified all five moved functions and all 159 retained functions/methods are unchanged apart from source positions. The 2500ms target cache, 300ms result cache, 60000-triangle eligibility limit, ray origin/near/far rules, and cloud ownership gates are preserved. Behavioral tests execute real Three scenes, geometry, cameras, raycasts, and the actual shadow helpers. They cover blockers and exclusions, hidden ancestors, alpha-tested materials, indexed/non-indexed geometry, cache refresh and object movement, camera position, distance limits, independent state, cloud disk ownership, and restoration of base flare intensity. A raycast double tests dense-geometry/BVH eligibility; it does not claim validation of the BVH implementation. Existing lighting/shadow integration fixtures load the required module.

All 63 regression scripts pass (35 runtime, 28 compiler), plus runtime/generated-core syntax, build configuration, catalog coverage, and diff checks. Full browser-source lint has zero errors and 242 existing warnings; the new module has none and quality profiles retains nine. Runtime artifacts were rebuilt explicitly using the direct Node entrypoint; only the core bundle and runtime manifest changed among generated artifacts.

Rendering constants, navigation math, dependencies, and vendor patches are unchanged. Remaining sky/cloud rendering extraction, component lifecycle migration, and resource auditing are still open. Published scenes were not recompiled, and browser/physical Quest visual acceptance was not performed. No server was started and no commit or push was performed.


### Desktop walking direction fix (2026-09-11)

The published virtual-production project 9406 / scene 9407 was running walkable navigation. Its runtime used the A-Frame camera entity Group's +Z direction for desktop walking while the actual Three camera looked along -Z. W therefore moved backward and S forward. Desktop walking now uses the actual camera through the existing camera resolver, renamed `getNavigationCameraObject` for its shared walking/flying use. Removed the desktop-only right-vector negation so A/D remain correct with the camera basis. Immersive movement transforms, collision handling, and flight calculations are unchanged.

The new regression fails against the previous implementation and passes with the fix. It uses real nested Three Groups and a PerspectiveCamera, exercising keyboard/arrow input across four yaw angles and three pitch angles, forward/backward/strafe direction, and pitch-independent walking speed. All 63 runtime/compiler scripts pass, along with runtime/generated-bundle syntax, build configuration, and diff checks. Changed-source lint has zero errors and five existing warnings. Explicit runtime rebuilding changed only the A-Frame components bundle.

Deploy the updated source/bundle and recompile the published scene for a fresh cache-busting URL; the live server has not been patched by this task. Browser/physical Quest acceptance of the deployed fix remains outstanding. No development server was started and no commit or push was performed.
