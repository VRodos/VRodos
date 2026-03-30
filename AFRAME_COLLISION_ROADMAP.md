---
name: A-Frame Collision Roadmap
description: Follow-up phases after Phase 1 navmesh support for compiled A-Frame scenes in VRodos.
type: project
---

## Current State

**Phase 1 is complete** in compiled A-Frame scenes:
- Hidden `Walkable Surfaces` helpers compile as `.vrodos-navmesh`
- Scene-level `aframeCollisionMode` enables or disables collision-aware movement
- `custom-movement` already supports:
  - ground sampling from navmesh helpers
  - slope filtering
  - step-up traversal
  - drop limits
  - nearest-ground recovery

This roadmap covers the next phases after that foundation.

---

## Phase 2: Collision Authoring + Debug

**Goal:** Make the current walkable-surface system inspectable, safer to author, and easier to validate.

### Deliverables
- Scene-editor highlighting for assets in the `Walkable Surfaces` category
- Compiled-scene debug toggle to reveal hidden `.vrodos-navmesh` helpers
- Compile diagnostics for:
  - collisions enabled but no walkable helper exists
  - player spawn starts off-navmesh
  - walkable helpers exist but are too far from spawn
- Lightweight runtime debug readout for:
  - collisions on/off
  - current ground height
  - current slope
  - step/drop rejection
  - nearest-ground recovery state

### Notes
- This phase does **not** change movement behavior.
- It exists to make Phase 1 trustworthy and debuggable before expanding collision scope.

---

## Phase 3: Blocking Obstacles

**Goal:** Add real horizontal blocking so users cannot walk through walls, barriers, props, or buildings.

### Authoring Model
Use a hybrid workflow:
- **Primary workflow:** dedicated hidden blocker helpers for walls and obstacles
- **Convenience workflow:** optional per-asset `collidable in compiled scene` flag for visible assets

### Deliverables
- New helper asset category for blockers, e.g. `Blocking Obstacles`
- Compiler support for hidden blocker entities, separate from `.vrodos-navmesh`
- New runtime blocker class, e.g. `.vrodos-collider`
- Optional asset-level collidable flag for visible meshes in normal categories
- `custom-movement` horizontal blocker checks before committing movement
- Wall sliding when possible instead of full hard-stop

### Behavior Rules
- `Walkable Surfaces` remain floor-only by default
- Blocker helpers always block movement
- Flagged visible assets also block movement
- Non-flagged decorative assets remain visual only
- `Door` assets default to non-blocking unless explicitly flagged collidable

### Notes
- This is the phase where compiled scenes stop allowing movement through solid scene geometry.

---

## Phase 4: Traversal Tuning

**Goal:** Turn current hardcoded traversal rules into scene-level controls.

### Deliverables
- Scene/build collision tuning for:
  - `Max Step Height`
  - `Max Drop Height`
  - `Max Slope`
- Prefer named presets first:
  - `Relaxed`
  - `Balanced` (default)
  - `Strict`
- Scene metadata hydration into `custom-movement`
- Spawn recovery behavior:
  - relocate to nearest valid walkable point when safe
  - fall back gracefully if no valid point is found
- Better handling around navmesh seams, stairs, ramps, and ledges

### Notes
- This phase keeps the same collision model and improves control, stability, and scene-by-scene tuning.

---

## Phase 5: Runtime Robustness + Special Cases

**Goal:** Make collisions resilient in larger and more complex compiled experiences.

### Deliverables
- Stuck-state detection and safe recovery
- Optional special traversal zones for future advanced cases:
  - door thresholds
  - one-way passages
  - guided path zones
- Desktop vs VR/mobile tuning only if movement paths require it
- Performance guardrails for large scenes:
  - cap expensive collider queries
  - constrain recovery search ranges
  - skip unnecessary work when collisions are off

### Notes
- Keep blocker collisions helper-driven by default for predictable runtime cost.
- This phase is for robustness and special cases, not first-time collision authoring.

---

## Planned Interfaces

### Scene / Compiler Data
- Keep `aframeCollisionMode` as the master on/off switch
- Add a new blocker helper category, e.g. `blocking-obstacle`
- Add an optional asset-level flag such as `collidable in compiled scene`

### Runtime Classes
- `.vrodos-navmesh` for walkable helpers
- `.vrodos-collider` for blocking helpers or flagged blocking meshes

### Traversal Metadata
- `aframeTraversalPreset: "relaxed" | "balanced" | "strict"`

If numeric tuning is needed later, also support:
- `aframeMaxStepHeight`
- `aframeMaxDropHeight`
- `aframeMaxSlope`

---

## Validation Scenes

Each phase should be validated against a small fixed set of compiled test scenes:
- Flat floor with enclosing walls
- Ramps and stairs
- Narrow corridors
- Spawn near edge or off-navmesh
- Mixed scene with:
  - hidden blocker helpers
  - visible flagged collidable props
  - non-collidable decorative meshes

### Expected Results
- Player can move only on valid walkable helpers
- Player cannot pass through blocker helpers
- Flagged visible meshes block movement
- Non-flagged decorations remain visual only
- Doors remain traversable unless intentionally made collidable
- Traversal presets change stair/ramp behavior predictably
- Spawn recovery works safely
- Collision debug tools clearly distinguish walkable vs blocking geometry
- Large scenes do not show major FPS regressions

---

## Recommended Order

Implement in this order:
1. `Phase 2` first, so the current navmesh system becomes observable
2. `Phase 3` next, to add true wall/obstacle collisions
3. `Phase 4` after that, to expose traversal tuning
4. `Phase 5` last, for hardening and special cases

---

## Defaults and Assumptions

- `Walkable Surfaces` remain the foundation and should not be replaced
- Blocking collisions should use a hybrid authoring model:
  - hidden blocker helpers first
  - visible-asset collidable flags second
- `Door` assets default to non-blocking
- `Balanced` should be the default traversal preset once traversal tuning is added
