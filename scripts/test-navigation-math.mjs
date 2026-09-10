import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";
import * as THREE from "three";

const root = resolve(import.meta.dirname, "..");
const registeredComponents = {};

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function assertNear(actual, expected, message, epsilon = 1e-6) {
    assert(Math.abs(actual - expected) <= epsilon, `${message}: expected ${expected}, got ${actual}`);
}

const sandbox = {
    THREE,
    console,
    window: {
        VRODOSMaster: {
            NAVMESH_DEFAULTS: {
                maxStepHeight: 0.6,
                maxDropHeight: 1,
                maxSlope: 45
            },
            clamp(value, min, max) {
                return Math.min(max, Math.max(min, value));
            }
        },
        VRODOS_NAVMESH_DEFAULTS: null
    },
    document: {},
    performance: {
        now() {
            return 0;
        }
    },
    AFRAME: {
        registerComponent(name, definition) {
            registeredComponents[name] = definition;
        }
    }
};

sandbox.window.window = sandbox.window;
sandbox.window.document = sandbox.document;
sandbox.window.performance = sandbox.performance;

vm.createContext(sandbox);
const navigationSource = readFileSync(resolve(root, "assets/js/runtime/master/components/vrodos_navigation.component.js"), "utf8");
vm.runInContext(
    navigationSource,
    sandbox,
    { filename: "vrodos_navigation.component.js" }
);

const movementDefinition = registeredComponents["custom-movement"];
assert(movementDefinition, "custom-movement component was not registered");

function createGroundHit(x = 0, y = 0, z = 0, behavior = "precise") {
    return {
        point: new THREE.Vector3(x, y, z),
        rawPoint: new THREE.Vector3(x, y, z),
        normal: new THREE.Vector3(0, 1, 0),
        slope: 0,
        behavior
    };
}

function createMovementHarness(options = {}) {
    const nav = Object.create(movementDefinition);
    const forward = options.forward || new THREE.Vector3(0, 0, -1);

    nav.forwardVector = new THREE.Vector3();
    nav.rightVector = new THREE.Vector3();
    nav.upVector = new THREE.Vector3(0, 1, 0);
    nav.immersiveRenderedDirection = new THREE.Vector3();
    nav.immersiveAuthoredDirection = new THREE.Vector3();
    nav.immersiveRenderYaw = options.renderYaw || 0;
    nav.immersiveMovementBasisSource = "none";
    nav.leftThumbInput = { x: 0, y: 0 };
    nav.rightThumbInput = { x: 0, y: 0 };
    nav.leftThumbRawInput = { x: 0, y: 0 };
    nav.rightThumbRawInput = { x: 0, y: 0 };
    nav.thumbR = { id: "oculusRight" };
    nav.thumbL = { id: "oculusLeft" };
    nav.isImmersiveXrPresenting = () => true;
    nav.getImmersivePhysicalForwardDirection = (target) => target.copy(forward).normalize();
    return nav;
}

{
    const nav = createMovementHarness();
    nav.handleThumbstickMove({
        currentTarget: nav.thumbL,
        detail: { x: 0, y: -1 }
    });
    assertNear(nav.leftThumbRawInput.y, -1, "left stick raw Y should preserve A-Frame forward/up sign");
    assertNear(nav.leftThumbInput.y, -1, "left stick normalized Y should preserve A-Frame forward/up sign");

    const movement = nav.getMovementDeltaFromInput(nav.leftThumbInput.x, nav.leftThumbInput.y, 1);
    assertNear(movement.x, 0, "raw Y -1 should not strafe");
    assertNear(movement.z, -1, "raw Y -1 should move forward in authored coordinates");
}

{
    const nav = createMovementHarness();
    nav.handleThumbstickMove({
        currentTarget: nav.thumbL,
        detail: { x: 0, y: 1 }
    });

    const movement = nav.getMovementDeltaFromInput(nav.leftThumbInput.x, nav.leftThumbInput.y, 1);
    assertNear(movement.x, 0, "raw Y 1 should not strafe");
    assertNear(movement.z, 1, "raw Y 1 should move backward in authored coordinates");
}

{
    const nav = createMovementHarness();
    nav.handleThumbstickMove({
        currentTarget: nav.thumbL,
        detail: { x: 1, y: 0 }
    });

    const movement = nav.getMovementDeltaFromInput(nav.leftThumbInput.x, nav.leftThumbInput.y, 1);
    assertNear(movement.x, 1, "raw X 1 should strafe right in authored coordinates");
    assertNear(movement.z, 0, "raw X 1 should not move forward/backward");
}

{
    const nav = createMovementHarness({ renderYaw: Math.PI / 2 });
    const movement = nav.getMovementDeltaFromInput(0, -1, 1);
    const length = Math.sqrt((movement.x * movement.x) + (movement.z * movement.z));

    assertNear(length, 1, "yawed immersive movement should preserve movement length");
    assertNear(movement.x, 1, "yawed rendered forward should map back into authored +X");
    assertNear(movement.z, 0, "yawed rendered forward should have no authored Z component");
}

function createVerticalMathHarness() {
    const nav = Object.create(movementDefinition);
    nav.gravity = 12;
    nav.terminalFallSpeed = 18;
    nav.maxVerticalFrameDeltaSeconds = 0.05;
    nav.verticalMotionStep = { deltaY: 0, velocity: 0 };
    nav.verticalVelocity = Math.sqrt(2 * nav.gravity * 0.8);
    return nav;
}

function simulateJump(frameMs) {
    const nav = createVerticalMathHarness();
    let height = 0;
    let peak = 0;
    let elapsed = 0;
    for (let frame = 0; frame < 300; frame++) {
        const step = nav.calculateVerticalMotionStep(frameMs / 1000);
        height += step.deltaY;
        nav.verticalVelocity = step.velocity;
        elapsed += Math.min(frameMs / 1000, nav.maxVerticalFrameDeltaSeconds);
        peak = Math.max(peak, height);
        if (frame > 1 && height <= 0 && nav.verticalVelocity < 0) {
            break;
        }
    }
    return { peak, elapsed };
}

{
    const jump30 = simulateJump(1000 / 30);
    const jump120 = simulateJump(1000 / 120);
    assertNear(jump30.peak, 0.8, "30 Hz jump should reach the configured apex", 0.01);
    assertNear(jump120.peak, 0.8, "120 Hz jump should reach the configured apex", 0.01);
    assertNear(jump30.peak, jump120.peak, "jump apex should be frame-rate independent", 0.01);
    assertNear(jump30.elapsed, jump120.elapsed, "jump duration should be frame-rate independent", 0.04);
}

{
    const nav = createVerticalMathHarness();
    nav.verticalVelocity = -30;
    const step = nav.calculateVerticalMotionStep(1);
    assertNear(step.velocity, -18, "fall speed should clamp to terminal velocity");
    assertNear(step.deltaY, -0.9, "terminal fall integration should use the clamped 50 ms frame delta");
}

function createJumpRequestHarness(overrides = {}) {
    const nav = Object.create(movementDefinition);
    const position = new THREE.Vector3(0, 1.6, 0);
    const settings = {
        navigationMode: "walkable",
        collisionMode: "auto",
        movement_disabled: "0",
        ...overrides.settings
    };
    Object.assign(nav, {
        verticalState: "grounded",
        verticalVelocity: 0,
        jumpHeight: 0.8,
        gravity: 12,
        jumpLaunchVelocity: 0,
        heightOffset: 1.6,
        verticalCollisionSkin: 0.05,
        groundProbeStepTolerance: 0.05,
        hasLastGroundHit: true,
        lastGroundHit: createGroundHit(),
        airborneSupportGround: createGroundHit(),
        lastGroundedPosition: new THREE.Vector3(),
        lastGroundedGroundHit: createGroundHit(),
        hasLastGroundedPosition: false,
        lastVerticalTransitionReason: "init",
        lastVerticalTransitionAt: 0,
        getRuntimeNow: () => 10,
        getSceneSettings: () => settings,
        getNavigationMode: () => settings.navigationMode,
        areCollisionsEnabled: () => overrides.collisionsEnabled !== false,
        getNavigationWorldPosition: () => position,
        findWalkableGroundBelowAt(current, maxY, output) {
            if (overrides.exactSupport === false) return null;
            return this.copyGroundHit(createGroundHit(current.x, 0, current.z), output);
        }
    });
    return nav;
}

{
    const nav = createJumpRequestHarness();
    assert(nav.requestJump("keyboard"), "grounded walkable movement should accept jump input");
    assert(nav.verticalState === "airborne", "accepted jump should enter the airborne state");
    assertNear(nav.verticalVelocity, Math.sqrt(2 * 12 * 0.8), "accepted jump should apply the configured impulse");
    assert(!nav.requestJump("keyboard"), "airborne movement should reject a double jump");
}

{
    assert(!createJumpRequestHarness({ settings: { movement_disabled: "1" } }).requestJump("keyboard"), "disabled movement should reject jump input");
    assert(!createJumpRequestHarness({ settings: { navigationMode: "fly" } }).requestJump("keyboard"), "fly mode should reject jump input");
    assert(!createJumpRequestHarness({ collisionsEnabled: false }).requestJump("keyboard"), "missing walkable collision should reject jump input");
    assert(!createJumpRequestHarness({ exactSupport: false }).requestJump("keyboard"), "rough offset support without exact ground should not start an unlandable jump");
    assert(movementDefinition.isJumpKeyEvent({ code: "Space" }), "Space should map to jump");
    assert(movementDefinition.shouldIgnoreKeyboardEvent({ target: { tagName: "BUTTON" } }), "Space activation on a DOM button should not also jump");
    assert(navigationSource.includes("this.jumpButtonEvents = ['abuttondown', 'xbuttondown']"), "controller A/X events should map to jump");
    assert(!navigationSource.includes("requestAutoTerrainRecovery"), "manual rough-terrain recovery should be removed");
    assert(!navigationSource.includes("findNearestGroundAt"), "nearest-ground recovery teleport search should be removed");
}

function createGroundResolutionHarness(sampleY, supportedY = null) {
    const nav = Object.create(movementDefinition);
    Object.assign(nav, {
        stepDelta: new THREE.Vector3(),
        stepPosition: new THREE.Vector3(),
        bestGroundHit: createGroundHit(),
        sampledGroundHit: createGroundHit(),
        airborneSupportGround: createGroundHit(),
        resolvedMovementStep: { position: new THREE.Vector3(), ground: createGroundHit(), airborne: false },
        groundSnapDistance: 0.35,
        groundProbeStepTolerance: 0.05,
        autoGroundHeightDeadband: 0.06,
        data: { maxDropHeight: 1 },
        sampleGroundAt(position, referenceY, output) {
            if (sampleY === null) return null;
            const hit = createGroundHit(position.x, sampleY, position.z);
            return this.copyGroundHit(hit, output);
        },
        canUseAutoGroundMissGrace: () => false,
        findWalkableGroundBelowAt(position, maxY, output) {
            if (supportedY === null || supportedY > maxY) return null;
            return this.copyGroundHit(createGroundHit(position.x, supportedY, position.z), output);
        },
        stabilizeImmersiveFirstMovementGround() {},
        getMaxStepHeightForGround: () => 0.6
    });
    return nav;
}

{
    const currentPosition = new THREE.Vector3(0, 1.6, 0);
    const currentGround = createGroundHit(0, 0, 0);
    const normalStair = createGroundResolutionHarness(-0.2);
    const stairStep = normalStair.resolveMovementAgainstGround(currentPosition, 0.2, 0, currentGround, normalStair.resolvedMovementStep);
    assert(stairStep && !stairStep.airborne, "normal descending stairs should stay grounded");
    assertNear(stairStep.ground.point.y, -0.2, "normal descending stairs should snap to the next tread");

    const tallDrop = createGroundResolutionHarness(-0.6, -0.6);
    const fallingStep = tallDrop.resolveMovementAgainstGround(currentPosition, 0.2, 0, currentGround, tallDrop.resolvedMovementStep);
    assert(fallingStep && fallingStep.airborne, "a supported tall drop should transition to falling");

    const offsetOnlyDrop = createGroundResolutionHarness(-0.6, null);
    assert(!offsetOnlyDrop.resolveMovementAgainstGround(currentPosition, 0.2, 0, currentGround, offsetOnlyDrop.resolvedMovementStep), "a rough offset sample without exact landing support should not start falling");

    const unsupported = createGroundResolutionHarness(null, null);
    assert(!unsupported.resolveMovementAgainstGround(currentPosition, 0.2, 0, currentGround, unsupported.resolvedMovementStep), "movement into an unsupported void should be rejected");
}

function createVerticalRayHarness() {
    const nav = Object.create(movementDefinition);
    const doubleSide = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), doubleSide);
    floor.rotation.x = -Math.PI / 2;
    floor.userData.vrodosCollisionRole = "navmesh";
    floor.userData.vrodosWalkBehavior = "precise";
    const step = new THREE.Mesh(new THREE.BoxGeometry(2, 0.75, 2), doubleSide);
    step.position.set(2, 0.375, 0);
    step.userData.vrodosCollisionRole = "navmesh";
    step.userData.vrodosWalkBehavior = "precise";
    const solid = new THREE.Mesh(new THREE.BoxGeometry(2, 0.75, 2), doubleSide);
    solid.position.set(-2, 0.375, 0);
    solid.userData.vrodosCollisionRole = "solid";
    const steepWalkable = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), doubleSide);
    steepWalkable.rotation.x = -Math.PI / 6;
    steepWalkable.position.set(4, 0.5, 0);
    steepWalkable.userData.vrodosCollisionRole = "navmesh";
    steepWalkable.userData.vrodosWalkBehavior = "precise";
    [floor, step, solid, steepWalkable].forEach((mesh) => mesh.updateMatrixWorld(true));
    const bounds = new THREE.Box3();
    [floor, step, solid, steepWalkable].forEach((mesh) => bounds.union(new THREE.Box3().setFromObject(mesh)));
    Object.assign(nav, {
        data: { maxSlope: 45 },
        heightOffset: 1.6,
        verticalCollisionSkin: 0.05,
        groundProbeStepTolerance: 0.05,
        verticalSupportRaycaster: new THREE.Raycaster(),
        verticalRayOrigin: new THREE.Vector3(),
        verticalRenderedRayOrigin: new THREE.Vector3(),
        verticalRenderedRayDirection: new THREE.Vector3(),
        verticalHitNormal: new THREE.Vector3(),
        verticalAuthoredHitPoint: new THREE.Vector3(),
        raycastDirection: new THREE.Vector3(0, -1, 0),
        upVector: new THREE.Vector3(0, 1, 0),
        collisionWorldBounds: bounds,
        navMeshBounds: bounds.clone(),
        blockerCollisionTargets: [floor, step, solid, steepWalkable],
        navMeshCollisionTargets: [floor, step, steepWalkable],
        lastVerticalSupportStatus: "none",
        lastVerticalSupportBlockedGroundY: null,
        refreshNavMeshRoots() {},
        refreshCollisionWorld() {},
        isImmersiveXrPresenting: () => false
    });
    return nav;
}

{
    const nav = createVerticalRayHarness();
    const stepGround = nav.findWalkableGroundBelowAt(new THREE.Vector3(2, 1.6, 0), 1, createGroundHit());
    assert(stepGround, "a walkable step top should be a valid landing surface");
    assertNear(stepGround.point.y, 0.75, "walkable step landing height should match its top surface");
    assert(!nav.findWalkableGroundBelowAt(new THREE.Vector3(-2, 1.6, 0), 1, createGroundHit()), "an ordinary solid collider should not become landing ground");
    assert(nav.lastVerticalSupportStatus === "blocked-solid", "solid collider rejection should be diagnosed");
    assert(!nav.findWalkableGroundBelowAt(new THREE.Vector3(4, 1.6, 0), 1, createGroundHit()), "a walkable surface above the slope limit should not become landing ground");
    assert(!nav.findWalkableGroundBelowAt(new THREE.Vector3(20, 1.6, 0), 1, createGroundHit()), "a position outside the navmesh should have no landing support");
}

{
    const nav = createVerticalRayHarness();
    const edgeSupport = new THREE.Mesh(
        new THREE.PlaneGeometry(0.2, 0.2),
        new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
    );
    edgeSupport.rotation.x = -Math.PI / 2;
    edgeSupport.position.x = 0.32;
    edgeSupport.userData.vrodosCollisionRole = "navmesh";
    edgeSupport.userData.vrodosWalkBehavior = "auto";
    edgeSupport.updateMatrixWorld(true);
    nav.blockerCollisionTargets = [edgeSupport];
    nav.navMeshCollisionTargets = [edgeSupport];
    nav.collisionWorldBounds.setFromObject(edgeSupport);
    nav.navMeshBounds.copy(nav.collisionWorldBounds);
    nav.verticalCapsuleOffsets = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.32, 0),
        new THREE.Vector2(-0.32, 0),
        new THREE.Vector2(0, 0.32),
        new THREE.Vector2(0, -0.32)
    ];
    const footprintGround = nav.findWalkableGroundBelowAt(new THREE.Vector3(0, 1.6, 0), 0.05, createGroundHit());
    assert(footprintGround, "landing support should survive a center-ray hole when the capsule footprint still overlaps walkable geometry");
    assertNear(footprintGround.rawPoint.x, 0.32, "footprint landing should retain the actual supporting hit point");
}

{
    const { nav, position } = createVerticalControllerHarness();
    assert(nav.requestJump("keyboard"), "support-loss fixture should start from a valid grounded jump");
    position.y = 2;
    nav.lastResolvedPosition.copy(position);
    nav.verticalVelocity = -2;
    nav.findWalkableGroundBelowAt = function () {
        this.lastVerticalSupportStatus = "none";
        return null;
    };
    nav.updateVerticalMotion(1000 / 60, nav.getSceneSettings(), true);
    assert(nav.verticalState === "grounded", "lost airborne support should fail closed to the last grounded state");
    assertNear(position.y, 1.6, "lost airborne support should restore the last grounded position instead of falling forever");
    assert(nav.lastVerticalTransitionReason === "airborne-support-lost", "support-loss recovery should be diagnosed");
}

{
    const nav = Object.create(movementDefinition);
    const ceiling = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.2, 2),
        new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
    );
    ceiling.position.set(0, 2, 0);
    ceiling.updateMatrixWorld(true);
    Object.assign(nav, {
        blockerCapsuleHeight: 1.65,
        blockerCapsuleRadius: 0.32,
        verticalCollisionSkin: 0.05,
        blockerCollisionTargets: [ceiling],
        verticalCapsuleOffsets: [
            new THREE.Vector2(0, 0),
            new THREE.Vector2(0.32, 0),
            new THREE.Vector2(-0.32, 0),
            new THREE.Vector2(0, 0.32),
            new THREE.Vector2(0, -0.32)
        ],
        verticalRayOrigin: new THREE.Vector3(),
        verticalRenderedRayOrigin: new THREE.Vector3(),
        verticalRenderedRayDirection: new THREE.Vector3(),
        verticalRayDirection: new THREE.Vector3(0, 1, 0),
        verticalBlockerRaycaster: new THREE.Raycaster(),
        refreshCollisionWorld() {},
        isImmersiveXrPresenting: () => false
    });
    assertNear(nav.getUpwardVerticalClearance(new THREE.Vector3(0, 1.6, 0), 0, 0.8), 0.2, "head sweep should stop below a ceiling", 0.001);
}

function createVerticalControllerHarness() {
    const nav = Object.create(movementDefinition);
    const position = new THREE.Vector3(0, 1.6, 0);
    Object.assign(nav, {
        data: { maxSlope: 45 },
        verticalState: "grounded",
        verticalVelocity: 0,
        jumpHeight: 0.8,
        gravity: 12,
        terminalFallSpeed: 18,
        airControl: 0.65,
        groundSnapDistance: 0.35,
        verticalCollisionSkin: 0.05,
        groundProbeStepTolerance: 0.05,
        maxVerticalFrameDeltaSeconds: 0.05,
        jumpLaunchVelocity: Math.sqrt(2 * 12 * 0.8),
        heightOffset: 1.6,
        lastResolvedPosition: position.clone(),
        targetWorldPosition: new THREE.Vector3(),
        airborneTargetPosition: new THREE.Vector3(),
        airborneSupportGround: createGroundHit(),
        airborneLandingGround: createGroundHit(),
        lastGroundHit: createGroundHit(),
        hasLastGroundHit: true,
        lastGroundedPosition: position.clone(),
        lastGroundedGroundHit: createGroundHit(),
        hasLastGroundedPosition: true,
        verticalMotionStep: { deltaY: 0, velocity: 0 },
        lastVerticalTransitionReason: "init",
        lastVerticalTransitionAt: 0,
        lastLandingGroundY: null,
        getRuntimeNow: () => 10,
        getSceneSettings: () => ({ navigationMode: "walkable", collisionMode: "auto", movement_disabled: "0" }),
        getNavigationMode: () => "walkable",
        areCollisionsEnabled: () => true,
        getNavigationWorldPosition: () => position,
        setNavigationWorldPosition(target) {
            position.copy(target);
            return true;
        },
        getUpwardVerticalClearance: (current, footY, distance) => distance,
        findWalkableGroundBelowAt(current, maxY, output) {
            this.lastVerticalSupportStatus = "walkable";
            if (maxY < 0) return null;
            return this.copyGroundHit(createGroundHit(current.x, 0, current.z), output);
        },
        notifyDesktopNavigationShadowRefresh() {}
    });
    return { nav, position };
}

{
    const { nav, position } = createVerticalControllerHarness();
    assert(nav.requestJump("keyboard"), "vertical controller fixture should start a jump");
    nav.updateVerticalMotion(0, nav.getSceneSettings(), true);
    assert(nav.isAirborne(), "a zero-delta frame immediately after jump input should not trigger landing");
    let peakFootY = 0;
    for (let frame = 0; frame < 120 && nav.isAirborne(); frame++) {
        nav.updateVerticalMotion(1000 / 60, nav.getSceneSettings(), true);
        peakFootY = Math.max(peakFootY, position.y - nav.heightOffset);
    }
    assertNear(peakFootY, 0.8, "integrated controller jump should reach the configured apex", 0.01);
    assert(nav.verticalState === "grounded", "descending jump should land and return to grounded state");
    assertNear(position.y, 1.6, "landing should restore eye height above walkable ground");
    assertNear(nav.lastLandingGroundY, 0, "landing diagnostics should record ground height");
}

{
    const nav = Object.create(movementDefinition);
    const currentPosition = new THREE.Vector3(0, 2, 0);
    Object.assign(nav, {
        constrainedCurrentPosition: new THREE.Vector3(),
        airborneTargetPosition: new THREE.Vector3(),
        airborneSlidePositionX: new THREE.Vector3(),
        airborneSlidePositionZ: new THREE.Vector3(),
        airborneSupportGround: createGroundHit(),
        heightOffset: 1.6,
        getNavigationWorldPosition: () => currentPosition,
        findWalkableGroundBelowAt: () => null,
        setNavigationWorldPosition: () => {
            throw new Error("unsupported airborne movement must not update navigation position");
        }
    });
    assert(!nav.applyAirborneMovement(0.1, 0.1), "airborne movement without landing support should be blocked");
}

{
    const nav = Object.create(movementDefinition);
    const currentPosition = new THREE.Vector3(0, 2, 0);
    Object.assign(nav, {
        constrainedCurrentPosition: new THREE.Vector3(),
        airborneTargetPosition: new THREE.Vector3(),
        airborneSlidePositionX: new THREE.Vector3(),
        airborneSlidePositionZ: new THREE.Vector3(),
        heightOffset: 1.6,
        lastResolvedPosition: currentPosition.clone(),
        getNavigationWorldPosition: () => currentPosition,
        resolveAirborneHorizontalCandidate(from, candidate) {
            const movedX = Math.abs(candidate.x - from.x) > 0.00001;
            const movedZ = Math.abs(candidate.z - from.z) > 0.00001;
            return movedX && !movedZ;
        },
        setNavigationWorldPosition(target) {
            currentPosition.copy(target);
            return true;
        },
        notifyDesktopNavigationShadowRefresh() {}
    });
    assert(nav.applyAirborneMovement(0.1, 0.1), "an airborne diagonal wall hit should retain an open slide axis");
    assertNear(currentPosition.x, 0.1, "airborne wall sliding should preserve the unblocked horizontal axis");
    assertNear(currentPosition.z, 0, "airborne wall sliding should reject movement into the wall");

    nav.resolveAirborneHorizontalCandidate = () => false;
    assert(!nav.applyAirborneMovement(0.1, 0.1), "a fully blocked airborne wall move should be rejected");
    assertNear(currentPosition.x, 0.1, "a rejected airborne wall move should preserve the last position");
    assertNear(currentPosition.z, 0, "a rejected airborne wall move should not penetrate the wall");
}

{
    let verticalQueries = 0;
    const nav = Object.create(movementDefinition);
    Object.assign(nav, {
        verticalState: "grounded",
        getNavigationMode: () => "walkable",
        findWalkableGroundBelowAt: () => {
            verticalQueries++;
            return null;
        }
    });
    assert(!nav.updateVerticalMotion(1000 / 60, {}, true), "idle grounded movement should not run vertical simulation");
    assert(verticalQueries === 0, "idle grounded movement should not add landing raycasts");
}

{
    const safePosition = new THREE.Vector3(3, 1.6, 4);
    const safeGround = createGroundHit(3, 0, 4);
    const nav = Object.create(movementDefinition);
    Object.assign(nav, {
        verticalState: "airborne",
        verticalVelocity: 2,
        lastVerticalTransitionReason: "jump:keyboard",
        lastVerticalTransitionAt: 0,
        lastGroundedPosition: safePosition.clone(),
        lastGroundedGroundHit: safeGround,
        hasLastGroundedPosition: true,
        lastNonImmersiveNavigationPosition: new THREE.Vector3(),
        hasLastNonImmersiveNavigationPosition: false,
        lastResolvedPosition: new THREE.Vector3(),
        lastGroundHit: createGroundHit(),
        hasLastGroundHit: false,
        getRuntimeNow: () => 20
    });
    nav.prepareVerticalMotionForEnterVr();
    assert(nav.verticalState === "grounded", "XR entry should cancel airborne motion");
    assertNear(nav.lastNonImmersiveNavigationPosition.y, safePosition.y, "XR entry should hand off the last safe grounded height");
    assertNear(nav.verticalVelocity, 0, "XR entry should clear vertical velocity");

    nav.verticalState = "airborne";
    nav.verticalVelocity = -3;
    nav.immersiveVirtualNavPosition = new THREE.Vector3(9, 9, 9);
    nav.isImmersiveXrPresenting = () => false;
    nav.settleVerticalMotionForExitVr();
    assert(nav.verticalState === "grounded", "XR exit should cancel airborne motion");
    assertNear(nav.immersiveVirtualNavPosition.y, safePosition.y, "XR exit should restore the last safe grounded height");
    assertNear(nav.verticalVelocity, 0, "XR exit should clear vertical velocity");
}

{
    const nav = Object.create(movementDefinition);
    let transformCalls = 0;
    Object.assign(nav, {
        immersiveWasPresenting: true,
        immersiveVirtualNavPosition: new THREE.Vector3(1, 1.6, 2),
        immersiveWorldDelta: new THREE.Vector3(),
        isImmersiveXrPresenting: () => true,
        applyImmersiveRenderTransform: () => {
            transformCalls++;
            return true;
        }
    });
    assert(nav.setNavigationWorldPosition(new THREE.Vector3(1, 2.1, 2)), "immersive vertical movement should update authored navigation");
    assertNear(nav.immersiveVirtualNavPosition.y, 2.1, "immersive jump should change virtual authored height");
    assert(transformCalls === 1, "immersive jump should transform the authored world exactly once per update");
}

console.log("navigation math tests passed");
