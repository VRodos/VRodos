# VRodos Three.js r173 Source Migration Plan

## Summary
This document replaces the earlier migration direction.

Goal:
- upgrade VRodos source code from the vendored `js_libs/threejs147/*` stack to a locally generated Three.js r173 browser bundle
- keep generated compiled A-Frame output files untouched
- keep the scene editor free of A-Frame
- simplify the codebase to a clean, production-supported `GLB` 3D asset workflow
- remove dormant `FBX`, `OBJ`, `MTL`, and `PDB` code paths instead of carrying them into the r173 migration

Chosen defaults:
- delivery model: build-time Node toolchain, committed generated browser assets, no committed `node_modules`
- scope: all source code except generated compiled A-Frame output files under `runtime/build/`
- supported 3D upload format in this migration: `GLB` only
- glTF-family stance: keep the architecture glTF-oriented, but postpone real `.gltf` multi-file upload support to a later phase

## Implementation Status
Completed in source:
- local vendor build added with `three@0.173.0`, `esbuild`, and `scripts/build-three-r173.mjs`
- generated vendor assets committed under `js_libs/threejs173/`
- editor and asset-editor enqueues switched from `threejs147/*` to the single r173 bundle
- active 3D asset workflow reduced to `GLB` only
- asset editor preview kernel reduced to `GLB` and `DRACO` only
- legacy non-GLB assets now surface as unsupported instead of using removed loaders
- active editor and runtime source updated to r173 color-space APIs and current `PointerLockControls.object`
- `TransformControls` scene integration updated for the newer helper API
- old vendored `js_libs/threejs147/` removed from the repo

Still intentionally pending:
- broader end-to-end smoke testing of editor, compiler, and compiled runtime scenes
- optional future `.gltf` multi-file upload support, which is out of scope for this migration

## Build and Packaging Model
### Build approach
- Add `three@0.173.0` and `esbuild` as root devDependencies.
- Add a root build script that generates a browser-ready vendor bundle from npm packages and writes it into `js_libs/threejs173/`.
- Keep WordPress loading classic local scripts, not module scripts and not CDN URLs.

### Files produced by the build
Generate and commit these local assets:
- `js_libs/threejs173/vrodos-three-r173.bundle.js`
- `js_libs/threejs173/draco/` decoder assets copied from the npm package
- `js_libs/threejs173/fonts/helvetiker_bold.typeface.json`

Do not commit:
- `node_modules/`
- temporary bundler caches
- generated compiled A-Frame HTML output

### Root tooling changes
Update root `package.json` to include:
- `three@0.173.0`
- `esbuild`
- scripts:
  - `build:three`
  - `build:vendor`
  - `build` should call `build:three` before any broader frontend build if a full build is desired

Add a root Node build script, for example:
- `scripts/build-three-r173.mjs`

That script must:
- import `three`
- import only the addons VRodos still actively uses
- attach them onto the same global `THREE` object
- expose `window.THREE`
- expose `window.Stats`
- write one IIFE bundle for WordPress enqueue
- copy Draco decoders and the font JSON into `js_libs/threejs173/`

### Bundle contents
The generated bundle must attach these onto the same `window.THREE` instance:
- `OrbitControls`
- `TransformControls`
- `PointerLockControls`
- `GLTFLoader`
- `DRACOLoader`
- `RGBELoader`
- `CSS2DRenderer`
- `CSS2DObject`
- `EffectComposer`
- `RenderPass`
- `ShaderPass`
- `OutlinePass`
- `FXAAShader`
- `FontLoader`
- `TextGeometry`

It must also expose:
- `window.Stats`

Do not include:
- `FBXLoader`
- `OBJLoader`
- `MTLLoader`
- `OBJLoader2`
- `DDSLoader`
- `KTXLoader`
- `TrackballControls` unless implementation finds a real active dependency
- A-Frame
- CDN-based dependencies

## Source Changes
### 1. Replace the old enqueue model
Update `includes/class-vrodos-asset-manager.php`:
- remove all `vrodos_load147_*` script registrations for unused legacy Three loader files
- register one vendor handle for `js_libs/threejs173/vrodos-three-r173.bundle.js`
- keep existing VRodos editor and app script handles after that vendor handle
- keep runtime and A-Frame prototype loading unchanged

### 2. Make the 3D asset model explicitly GLB-only
Keep `vrodos_asset3d_glb` as the only active supported 3D model attachment in source code.

Remove active support for:
- `vrodos_asset3d_fbx`
- `vrodos_asset3d_obj`
- `vrodos_asset3d_mtl`
- `vrodos_asset3d_pdb`

Update `includes/class-vrodos-core-manager.php`:
- remove non-GLB MIME allowances that are only there for dormant 3D workflows
- simplify model resolution helpers so they no longer branch across OBJ, FBX, PDB, and GLB
- keep `glb_path` and `path` as the canonical fields returned to the editor and compiler

The implementation must treat:
- `vrodos_asset3d_glb` as the single runtime/editor/compile model source
- `glb_path` as the single scene-loadable path
- `path` as an alias of the same GLB path for backward compatibility in scene persistence

### 3. Remove dormant non-GLB upload and preview code
Update the frontend asset editor so it remains a strict GLB upload workflow:
- keep `.glb` upload input
- keep GLB size validation
- remove dormant hidden inputs and file-reading branches for `fbx`, `obj`, `mtl`, `pdb`, and texture sidecars

Update `includes/templates/vrodos-asset-editor-template.php`:
- keep GLB-specific upload UI
- remove any leftover DOM fields or initialization that imply non-GLB 3D support
- keep current language aligned to GLB upload

Update `js_libs/vrodos_asset_editor_scripts.js`:
- keep local GLB preview handling
- remove generic file-reader branches for `FBX`, `OBJ`, `MTL`, `PDB`, and their sidecar textures
- keep upload validation logic scoped to GLB only

Update `js_libs/vrodos_AssetViewer_3D_kernel.js`:
- keep GLB preview and DRACO support
- remove `OBJLoader2` preview logic
- remove FBX preview logic
- remove saved-asset OBJ and FBX loader branches
- simplify constructor parameters and internal state so the preview kernel is GLB-only

### 4. Keep the editor, scene persistence, and compiler GLB-centric
Update the editor stack to stay GLB-based end to end:
- keep asset catalog data centered on `glb_path`
- keep `VRodos_LoaderMulti` GLB-based
- remove leftover unsupported-format branches and legacy comments from the loader path
- keep scene persistence compatible with current `fnPath`, `path`, and `glb_path` assumptions
- keep compiler output GLB-based through `gltf-model`

No runtime widening is allowed in this migration:
- no runtime `FBX` support
- no runtime `OBJ/MTL` support
- no compile-time branching on 3D file type

### 5. Core Three.js r173 API migration
Apply these compatibility changes across editor, asset preview, and runtime source:
- `renderer.outputEncoding = THREE.sRGBEncoding` -> `renderer.outputColorSpace = THREE.SRGBColorSpace`
- move texture color handling to `texture.colorSpace = THREE.SRGBColorSpace` where appropriate
- keep `renderer.toneMapping = THREE.ACESFilmicToneMapping`
- `PointerLockControls.getObject()` -> `PointerLockControls.object`
- replace any live `THREE.Geometry` usage with `THREE.BufferGeometry().setFromPoints(...)`
- make `Raycaster.intersectObjects(..., false)` explicit where top-level-only behavior is required

### 6. Runtime source updates
Update runtime source under `runtime/assets/js/` but do not touch generated compiled output under `runtime/build/`.

Apply only source-level compatibility updates:
- move runtime texture color-space logic to r173 APIs
- preserve current runtime rendering behavior
- preserve the current `gltf-model`-based compiled scene contract

Do not change:
- generated compiled HTML files
- compiled scene export format
- runtime scene template contracts

### 7. Legacy non-GLB asset handling
The migration does not continue supporting old non-GLB assets as active formats.

Add lightweight detection where useful so legacy non-GLB assets are surfaced clearly:
- mark them as unsupported in the asset editor or asset list if the UI encounters them
- do not attempt preview through removed loaders
- do not attempt scene placement through removed loaders
- do not auto-convert them in this migration

This compatibility layer is messaging-only. It is not continued functional support.

### 8. Cleanup
After parity is confirmed:
- remove `js_libs/threejs147/`
- remove obsolete `vrodos_load147_*` handles for deleted loaders
- remove dead non-GLB branches from active JS and PHP source
- keep any runtime source compatibility helpers that are still valid under r173

## Public Interfaces and Compatibility
### No user-facing API changes
Do not change:
- WordPress routes
- shortcode behavior
- compile flow
- stored scene JSON schema
- runtime scene HTML template contracts
- custom post type data model outside removal of dormant non-GLB handling

### Internal interface changes
Internal asset paths change:
- from `js_libs/threejs147/*`
- to `js_libs/threejs173/*`

Internal bundling changes:
- many individual Three vendor files are replaced by one generated local vendor bundle plus copied support assets

Internal 3D format policy changes:
- active source code supports `GLB` only
- dormant `FBX`, `OBJ`, `MTL`, and `PDB` branches are removed from production code paths

### Single-Three invariant
The implementation must guarantee a single Three instance per page in editor and preview contexts. This is required so these patterns remain valid:
- `instanceof THREE.Mesh`
- addon constructors attached to `THREE`
- scene traversal checks against `THREE` classes

## Test Plan
### Editor smoke tests
- Open existing scene in editor
- Open empty or new scene in editor
- confirm no fatal console errors
- confirm no duplicate Three instance issues
- confirm canvas renders immediately

### Editor interaction tests
- select regular mesh
- select light objects
- select pawn
- select assessment placeholder
- click empty canvas to deselect
- switch translate, rotate, and scale
- verify transform gizmo behavior
- verify hierarchy highlight sync

### Camera and movement tests
- orbit controls pan, zoom, and rotate
- switch 2D and 3D mode
- pointer-lock avatar movement
- third-person camera view
- compass update behavior
- confirm replacing `getObject()` with `.object` preserves movement logic

### GLB asset workflow tests
- upload GLB in the asset editor
- preview GLB locally before save
- save and reopen the asset
- place the GLB asset into a scene
- save and reload the scene
- compile the scene
- verify the compiled A-Frame output still renders through `gltf-model`

### Cleanup verification
- no `FBXLoader`, `OBJLoader`, `MTLLoader`, or `OBJLoader2` imports remain in the new bundle
- no frontend upload controls remain for non-GLB 3D files
- no active source references remain to dormant 3D file types in upload and preview flows

### Legacy asset handling tests
- open a legacy non-GLB asset if one exists
- verify the system surfaces it as unsupported rather than silently half-loading or crashing

### Runtime source regression tests
- run an existing compiled scene produced after migration
- verify runtime rendering matches current behavior
- verify color handling and PBR materials are not darker or double-converted

## Risks and Required Mitigations
- Risk: dormant non-GLB code is still referenced indirectly from templates or enqueues
  - Mitigation: remove legacy loader handles and repo-scan for all dormant format references before final cleanup

- Risk: multiple Three instances break class checks and addons
  - Mitigation: one generated global bundle only, no extra raw addon files

- Risk: color-management regressions
  - Mitigation: migrate all live source to `outputColorSpace` and `colorSpace`, then verify with HDR and PBR scenes

- Risk: legacy assets stop appearing without explanation
  - Mitigation: add explicit unsupported messaging instead of preserving dead partial loaders

- Risk: generated output accidentally modified
  - Mitigation: explicitly exclude `runtime/build/` from implementation scope

## Assumptions
- `runtime/build/` is generated output and must remain untouched in this effort
- using Node at build time is acceptable for contributors
- committing generated local browser assets is acceptable for plugin distribution
- no CDN runtime dependency is allowed for Three
- A-Frame is not added to editor pages
- the migration intentionally prefers deleting dead non-GLB code over preserving dormant features
- real `.gltf` multi-file upload support is a future separate phase, not part of this migration

## Acceptance Criteria
The migration is complete when:
- `threejs147` is gone from active source and enqueue paths
- editor and asset preview run on the generated `threejs173` local bundle
- runtime source is r173-compatible where it touches Three APIs
- active source code supports only `GLB` as the production 3D asset format
- dormant `FBX`, `OBJ`, `MTL`, and `PDB` production code paths are removed
- generated compiled A-Frame output files are left unchanged
- no user-visible regression exists in editor, GLB preview, save/load, or compile workflows
