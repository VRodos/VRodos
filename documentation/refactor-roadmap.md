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
- [ ] Share equivalent control lifecycle behavior and validate Greek spatial interaction in browser/headset.

## E. Optimizer
- [x] Extract source metadata, GLB analysis, and dashboard aggregation/sorting classes; route manager domain APIs through a service.
- [x] Move worker/source-change hooks from admin controller to the domain service; orchestration still composes existing traits.
- [x] Separate read-only lookup from explicit normalization/snapshot updates.
- [x] Bulk-load dashboard metadata, preserve global sorting, avoid page-render writes/hashing.
- [x] Preserve immutable jobs, leases, source generations, retries, and profile chaining in regression coverage.
- [ ] Evaluate additional request-local scan reuse and validate live replacement/deletion/status flows.

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
- [ ] Extract quality/shadows, celestial lighting, sky, and cloud modules without behavior changes.
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

`scripts/regression-test-catalog.mjs` explicitly owns 50 scripts: 23 runtime and 27 compiler. `scripts/run-tests.mjs` verifies coverage and launches separate processes. Existing npm entrypoints remain; ordinary checks do not rebuild tracked bundles. Formatting excludes vendor/generated files. No framework or dependency was added.

All **50 tests pass** in the writable fixture environment. Browser-source ESLint at the initial cleanup pass: **0 errors, 243 warnings**; subsequent changed editor files pass lint without warnings. Edited/new PHP/JS syntax, runtime syntax, generated manifest/build configuration, and diff whitespace checks pass. Runtime bundles were regenerated explicitly for runtime changes.

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
