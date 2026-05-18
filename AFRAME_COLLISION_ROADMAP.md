---
name: A-Frame Collision Roadmap
description: Roadmap and architecture for player collisions in compiled A-Frame scenes in VRodos.
type: project
---

# A-Frame Collision Roadmap

## Current State

Ground collision is already implemented for compiled A-Frame scenes:

- `Walkable Surfaces` compile as `.vrodos-navmesh` entities.
- Scene-level `aframeCollisionMode` / `aframeNavigationMode` controls collision-aware walk mode.
- `custom-movement` supports ground sampling, slope filtering, step-up traversal, drop limits, and nearest-ground recovery.
- Compiled scenes now also support static player blockers for default-collidable scene geometry.

This roadmap documents the next collision architecture: default player blocking for all geometry-bearing compiled objects, with per-object opt-out and optional hidden collision proxies for performance and authoring control.

---

## Implemented Architecture

The current implementation ships the v1 native static collision path:

- Editor object loading defaults `compiledCollisionEnabled` to `true`.
- The object controls panel shows `Collides with player` for geometry-bearing assets and stores `compiledCollisionEnabled`.
- The optional `Collision Proxy` asset category is available with a `brick-wall` icon; the legacy/internal `blocking-obstacles` slug is also treated as a hidden collider if present.
- The compiler emits `.vrodos-collider` on enabled geometry-bearing compiled objects.
- Objects with `compiledCollisionEnabled: false` compile without player collision markers.
- Walkable surfaces compile as both `.vrodos-navmesh` and `.vrodos-collider`, so upward faces still sample ground while steep faces can block horizontal movement.
- Collision proxies compile with `vrodos-collider-helper`, stay present in the scene graph, and receive hidden collision materials instead of visible rendering materials.
- `custom-movement` builds a static collision world from `.vrodos-collider` entities after model load / attach / detach events.
- The runtime bundles `three-mesh-bvh` as `vrodos-collision-bvh.bundle.js` and exposes it as `window.VRODOS_COLLISION_BVH`.
- Runtime blocker raycasts use BVH acceleration when available and fall back to standard Three.js raycasts if a BVH cannot be built.
- Horizontal player movement performs a multi-height capsule sweep against blocker geometry and falls back to axis sliding when the full movement vector is blocked.
- The nav performance overlay/report now includes blocker target counts in addition to existing navmesh raycast timing and intersection totals.

Remaining hardening work is tracked in later roadmap phases: spawn clearance, collision triangle-count diagnostics, traversal presets, tighter corner handling, and browser smoke tests on representative compiled scenes.

---

## Core Decisions

- All geometry-bearing compiled scene objects should collide with the player by default.
- Authors get a simple per-object toggle: `Collides with player`.
- The object toggle defaults to enabled and only needs to be changed when an object should be passable.
- Optional hidden collision proxy assets remain supported for invisible walls, simplified blockers, and high-poly scenes where visible art should not be used as the exact collider.
- The user-facing proxy category should be named `Collision Proxy`; `Blocking Obstacles` can remain as an internal or compatibility slug if needed.
- V1 should use a native VRodos static collision implementation built on Three.js geometry and `three-mesh-bvh`, not `aframe-rapier-physics`.
- Rapier remains a future option for dynamic rigid bodies, pushable objects, thrown objects, joints, or collision-event gameplay.

---

## Architecture

### Editor Metadata Flow

- Scene object persistence adds a boolean-like field such as `compiledCollisionEnabled`.
- Default value is `true` for geometry-bearing scene objects.
- Existing scenes without this field are treated as collidable during compile.
- The editor property panel shows one control: `Collides with player`.
- Toggling the control off stores `compiledCollisionEnabled: false` on the object.
- `Walkable Surfaces` keep their existing walking behavior setting (`precise` / `auto`) and also participate in blocking through steep-face extraction.
- `Collision Proxy` objects are normal placed scene objects with collision enabled, but compile as hidden collision-only geometry.

### Compiler Output

The compiler marks collision sources without changing visual rendering:

- `.vrodos-navmesh` remains the class for walkable ground helpers.
- `.vrodos-collider` marks geometry that can block the player horizontally.
- Every geometry-bearing object with collision enabled receives collision metadata, for example:
  - `data-vrodos-collider="true"`
  - `data-vrodos-collision-source="gltf|image-plane|video-plane|text-panel|audio-marker|poi-button|assessment-model"`
  - `data-vrodos-collision-role="solid|navmesh"`
  - `data-vrodos-collision-category`
  - `data-vrodos-collision-object`
- object UUID/category metadata for diagnostics.
- Objects with `compiledCollisionEnabled: false` compile without `.vrodos-collider`.
- `Collision Proxy` objects compile hidden but remain available to the collision system.
- Compile diagnostics should warn when collision-enabled scenes have no walkable surface, no usable collider geometry, a spawn point inside/too near blockers, or very high collision triangle counts.

### Runtime Static Collision World

The runtime builds collision data after relevant `model-loaded` events:

- Ground data is built from `.vrodos-navmesh` walkable/upward faces.
- Blocking data is built from:
  - enabled visible scene objects
  - steep or vertical faces from `.vrodos-navmesh`
  - hidden `Collision Proxy` objects
- `three-mesh-bvh` accelerates static mesh queries.
- Collision data is rebuilt only when relevant models load, attach, detach, or become dirty.
- Collider helpers must not add rendered draw calls unless debug visualization is explicitly enabled.
- The current runtime uses BVH-accelerated raycasts rather than a full physics world; Rapier is still reserved for later dynamic physics.

### Player Capsule And Movement

`custom-movement` remains the owner of player movement:

- The player is represented by a capsule with configurable radius and height.
- Ground sampling keeps the existing step/drop/slope behavior.
- Horizontal movement tests the candidate capsule against the blocker BVH before committing movement.
- If the capsule hits a blocker, movement resolves with wall sliding where possible.
- If sliding would leave valid walkable ground or violate step/drop/slope limits, movement is rejected.
- Spawn recovery should account for both valid ground and blocker clearance.
- Fly mode remains non-colliding for v1 unless a later phase explicitly adds fly collision.

### PMNDRS And Takram Compatibility

- Collision runs on CPU-side Three.js geometry and does not depend on the render pipeline.
- PMNDRS post-processing, Takram atmosphere, scene probes, shadows, and material overrides should not affect collision behavior.
- Collision helpers should use the same pinned Three.js r181 runtime stack and must not load another Three.js copy.
- Generated collision/vendor bundles should follow the existing runtime manifest and build process.

### Performance Guardrails

Default-collidable objects should not automatically tank performance if the runtime uses static BVH queries:

- BVH construction has an upfront load-time and memory cost.
- Per-frame collision cost should stay bounded because queries run only while the player moves.
- High-poly assets are the main risk; compile/runtime diagnostics should report collider triangle counts and recommend proxy colliders.
- Internal collision mode can choose exact mesh or cheaper bounds/proxy strategy while keeping the editor UI simple.
- Runtime debug currently reports navmesh target count, blocker target count, raycast count, intersection count, and timing. Future diagnostics should add collision triangle count, BVH build time, blocked/slid state, current ground height, slope, step/drop rejection, and recovery state.

---

## Why Not Rapier For V1

`aframe-rapier-physics` could technically run in an A-Frame 1.7.1 scene, but it is not the best foundation for this phase:

- It is a full physics system, while the immediate need is static player-vs-world blocking.
- It still requires custom character-controller work for VRodos step/drop/slope rules, wall sliding, spawn recovery, and integration with `custom-movement`.
- Its default module path loads Rapier asynchronously from a CDN unless locally overridden.
- The repository is small and GPL-3.0 licensed, which adds adoption and maintenance considerations.

Rapier is better reserved for a future dynamic-physics phase involving pushable props, thrown objects, joints, or physics gameplay events.

---

## Implementation Roadmap

### Phase 2: Collision Authoring And Debug

Goal: make existing walkable ground collision observable and prepare editor/compiler metadata.

- Add the `Collides with player` property control and persist `compiledCollisionEnabled`. **Implemented.**
- Default missing collision metadata to enabled during compile. **Implemented.**
- Add or preserve the optional `Collision Proxy` helper category. **Implemented.**
- Add compile diagnostics for missing walkable surfaces, spawn off-navmesh, spawn near blockers, and high collider complexity.
- Extend runtime debug overlays to distinguish walkable ground, blocker geometry, visible-object colliders, and collision proxies. **Partially implemented: blocker target counts are visible.**

### Phase 3: Default Object Blocking

Goal: prevent the player from walking through scene geometry.

- Emit `.vrodos-collider` metadata for all collision-enabled geometry-bearing compiled objects. **Implemented.**
- Build a static blocker BVH from visible collidable objects and hidden proxies. **Implemented.**
- Extract steep/vertical faces from `.vrodos-navmesh` into blocker data so navmesh walls block movement. **Implemented.**
- Add capsule-vs-blocker checks to `custom-movement`. **Implemented with multi-height capsule sweep raycasts.**
- Resolve collisions with wall sliding when possible and hard-stop when sliding is invalid. **Implemented with axis slide fallback.**
- Keep non-collidable objects passable when authors toggle `Collides with player` off. **Implemented.**

### Phase 4: Traversal Tuning

Goal: expose scene-level traversal behavior without changing the collision model.

- Add named traversal presets first: `Relaxed`, `Balanced`, and `Strict`.
- Keep `Balanced` as the default.
- Later numeric settings may include:
  - `aframeMaxStepHeight`
  - `aframeMaxDropHeight`
  - `aframeMaxSlope`
  - player capsule radius/height.
- Improve edge behavior around stairs, ramps, ledges, seams, and tight corners.

### Phase 5: Robustness And Future Physics

Goal: harden large compiled scenes and leave room for dynamic behavior.

- Add stuck-state detection and safe recovery.
- Cap expensive recovery searches and collision queries.
- Add special traversal zones only when needed, such as door thresholds, one-way passages, or guided path zones.
- Evaluate Rapier only for dynamic objects or physics interactions, not basic static locomotion.

---

## Planned Interfaces

### Scene Object Metadata

- `compiledCollisionEnabled: boolean`
- Missing value defaults to `true` for geometry-bearing objects.

### Runtime Classes And Attributes

- `.vrodos-navmesh` for walkable surfaces.
- `.vrodos-collider` for player-blocking geometry.
- `data-vrodos-collider`
- `data-vrodos-collision-source`
- `data-vrodos-collision-role`
- `data-vrodos-collision-category`
- `data-vrodos-collision-object`
- `data-vrodos-walk-behavior`

### Scene Traversal Metadata

- `aframeTraversalPreset: "relaxed" | "balanced" | "strict"`

Optional later numeric controls:

- `aframeMaxStepHeight`
- `aframeMaxDropHeight`
- `aframeMaxSlope`
- `aframePlayerCapsuleRadius`
- `aframePlayerCapsuleHeight`

---

## Validation Scenes

Each phase should be validated against compiled scenes containing:

- Flat floor with enclosing walls.
- Navmesh GLB with vertical wall geometry.
- Ramps and stairs.
- Narrow corridors and tight corners.
- Spawn near an edge, off-navmesh, and near blockers.
- Many default-collidable visible props.
- Objects explicitly toggled non-collidable.
- Hidden collision proxy blockers.
- PMNDRS and Takram enabled.

Expected results:

- Player can move only on valid walkable ground.
- Player cannot pass through default-collidable scene objects.
- Player cannot pass through steep/vertical navmesh faces.
- Player can pass through objects toggled non-collidable.
- Hidden collision proxies block movement without rendering.
- Wall sliding works in corridors and around corners.
- Traversal presets change stair/ramp behavior predictably.
- Debug tools clearly separate walkable, blocker, visible-object, and proxy collision geometry.
- Large scenes remain performant or emit actionable diagnostics when collider complexity is too high.

---

## Verification

Documentation-only updates should run:

- `git diff --check`

Implementation phases should additionally run:

- `node --check` for edited runtime JavaScript files.
- PHP syntax checks for edited PHP files.
- `npm run build:runtime` after runtime component changes.
- `npm run build:three` only when collision/vendor bundle generation changes.
- Compiled-scene smoke tests with the profiler and nav performance overlay.
