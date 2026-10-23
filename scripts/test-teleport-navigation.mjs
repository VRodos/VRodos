import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import * as THREE from 'three';
import * as BVH from 'three-mesh-bvh';

const root = resolve(import.meta.dirname, '..');
const definitions = {};
const noop = () => {};
const events = { addEventListener: noop, removeEventListener: noop, emit: noop };
const timers = new Map();
let timerId = 0;
const context = {
    THREE, console, performance: { now: () => 0 }, document: { ...events },
    window: { ...events, setTimeout: callback => { timers.set(++timerId, callback); return timerId; },
        clearTimeout: id => timers.delete(id), VRODOSMaster: { clamp: THREE.MathUtils.clamp }, VRODOS_COLLISION_BVH: BVH },
    AFRAME: { registerComponent: (name, definition) => { definitions[name] = definition; } }
};
vm.createContext(context);
for (const file of ['vrodos_runtime_resources.js', 'vrodos_teleport.js', 'components/vrodos_navigation.component.js',
    'components/vrodos_teleport_point.component.js']) {
    vm.runInContext(readFileSync(resolve(root, 'assets/js/runtime/master', file), 'utf8'), context, { filename: file });
}
const Teleport = context.window.VRODOSTeleport;
const point = (x, y, z) => new THREE.Vector3(x, y, z);
const near = (actual, expected, message) => assert(actual.distanceTo(expected) < 1e-6, message);

for (const end of [point(10, 1.6, 0), point(10, 9, 0), point(10, -6, 0)]) {
    const start = point(0, 1.6, 0);
    const travel = Teleport.createTravel(start, end);
    near(Teleport.sampleTravel(travel, 0), start, 'arc starts exactly at the current view');
    near(Teleport.sampleTravel(travel, 1), end, 'arc ends exactly at the destination');
    assert(travel.curve.v1.y > Math.max(start.y, end.y), 'arc rises and then descends across different elevations');
    assert(Teleport.sampleTravel(travel, 0.1).x < 1, 'initial motion eases in');
    assert(10 - Teleport.sampleTravel(travel, 0.9).x < 1, 'final motion eases out');
}
assert.equal(Teleport.createTravel(point(0, 0, 0), point(12, 0, 0)).duration, 1800);
assert.equal(Teleport.createTravel(point(0, 0, 0), point(100, 0, 0)).duration, 2500);
assert.equal(Teleport.createTravel(point(0, 0, 0), point(0, 0, 0)).duration, 800);
assert.equal(Teleport.createTravel(point(0, 0, 0), point(1, 0, 0)).curve.v1.y, 1.5);
assert.equal(Teleport.createTravel(point(0, 0, 0), point(100, 0, 0)).curve.v1.y, 4);
assert.equal(Teleport.sampleTravel(Teleport.createTravel(point(0, 0, 0), point(10, 0, 0)), 0.25).x, 1.5625);

function fixture({ standard = false, mode = 'walk', collisions = false, disabled = true } = {}) {
    const sceneObject = new THREE.Group();
    const rig = new THREE.Group();
    const cameraGroup = new THREE.Group();
    const camera = new THREE.PerspectiveCamera();
    const world = { ...events, id: 'vrodos-authored-world', object3D: new THREE.Group(), components: {} };
    sceneObject.add(rig, world.object3D);
    rig.add(cameraGroup);
    cameraGroup.add(camera);
    const controllers = [-1, 1].map(side => {
        const controller = new THREE.Group();
        controller.position.set(side * 0.3, 1.2, -0.4);
        controller.rotation.set(0.1, side * 0.2, 0.3);
        rig.add(controller);
        return controller;
    });
    (standard ? rig : cameraGroup).position.set(0, 1.6, 0);
    cameraGroup.rotation.y = 0.4;
    const settings = { cam_position: '0 1.6 0', cam_rotation_y: '0', navigationMode: mode,
        collisionMode: collisions ? 'auto' : 'off', movement_disabled: disabled };
    const meshes = [];
    let viewerPose = null;
    const scene = { ...events, object3D: sceneObject, components: {}, camera, is: () => false,
        getAttribute: () => settings, querySelector: () => world,
        querySelectorAll: selector => meshes.filter(mesh => mesh.classList.contains(selector.slice(1))),
        renderer: { xr: { isPresenting: false, getFrame: () => ({ getViewerPose: () => viewerPose }),
            getReferenceSpace: () => events } } };
    const cameraEl = { ...events, components: { camera: { camera } }, object3D: cameraGroup, sceneEl: scene };
    const player = { ...events, object3D: rig, sceneEl: scene, components: {}, setAttribute: noop };
    context.document.querySelector = selector => selector === '#cameraA' ? cameraEl : null;
    const nav = Object.create(definitions['custom-movement']);
    nav.el = player;
    nav.init();
    nav.data = { movementSpeed: 2, turnSpeed: 45, thumbstickDeadzone: 0.08, maxStepHeight: 0.6, maxDropHeight: 1, maxSlope: 45 };
    Object.assign(nav, { hasAuthoredNavigationMode: () => true, requestShadowMapRefresh: noop,
        beginImmersiveSmoothnessFrame: () => null, getActiveImmersiveSmoothnessFrame: () => null,
        finishImmersiveSmoothnessFrame: noop, beginImmersiveEntryPoseSettle: noop });
    player.components['custom-movement'] = nav;
    function addMesh(geometry, position, navmesh = false) {
        const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
        mesh.position.copy(position);
        world.object3D.add(mesh);
        meshes.push({ object3D: mesh, getObject3D: () => mesh, getAttribute: () => null,
            classList: { contains: name => name === 'vrodos-collider' || (navmesh && name === 'vrodos-navmesh') } });
        nav.markNavMeshDirty();
        nav.markCollisionWorldDirty();
        return mesh;
    }
    function enterVr() {
        scene.renderer.xr.isPresenting = true;
        const physical = point(0.2, 1.6, 0.1);
        cameraGroup.position.copy(physical);
        viewerPose = { transform: { position: physical } };
        nav.getImmersivePhysicalAnchorPosition = target => target.copy(physical);
        nav.getImmersivePhysicalForwardDirection = target => target.set(0, 0, -1);
        nav.handleEnterVr();
        assert(nav.resetImmersiveWorldLocomotion());
        return physical;
    }
    return { nav, rig, cameraGroup, scene, settings, camera, world, player, controllers, addMesh, enterVr };
}

for (const standard of [false, true]) {
    for (const mode of ['walk', 'walkable', 'fly']) {
        const f = fixture({ standard, mode });
        const orientation = f.cameraGroup.quaternion.clone();
        const wasdEnabled = true;
        f.player.components['wasd-controls'] = { data: { enabled: true }, pause: noop, play: noop,
            velocity: point(5, 0, 0), keys: { KeyW: true } };
        const source = { isConnected: true };
        assert(f.nav.teleportToPoint(point(12, 3, -4), source), 'movement-disabled scenes can teleport');
        assert.equal(f.player.components['wasd-controls'].data.enabled, false, 'WASD is suspended');
        assert.equal(f.nav.teleportToPoint(point(15, 0, 0), source), false, 'repeated clicks do not interrupt travel');
        f.nav.leftThumbInput.y = -1;
        f.nav.rightThumbInput.x = 1;
        const duration = f.nav.teleportTravel.duration;
        f.nav.tick(0, duration / 2);
        assert(f.nav.getNavigationWorldPosition().y > 4.6, 'mid-travel view follows the upward arc');
        f.nav.tick(duration, duration / 2);
        near(f.nav.getNavigationWorldPosition(), point(12, 4.6, -4), 'arrival preserves eye height');
        assert(f.cameraGroup.quaternion.equals(orientation), 'travel preserves viewing direction');
        assert.equal(f.player.components['wasd-controls'].data.enabled, wasdEnabled, 'WASD ownership is restored');
        f.nav.tick(duration + 16, 16);
        near(f.nav.getNavigationWorldPosition(), point(12, 4.6, -4), 'movement lock retains the arrival');
    }
}

for (const interruption of ['pause', 'source-removal', 'XR-entry', 'XR-exit', 'remove']) {
    const f = fixture();
    if (interruption === 'XR-exit') f.enterVr();
    const start = f.nav.getNavigationWorldPosition().clone();
    const source = { isConnected: true };
    assert(f.nav.teleportToPoint(point(8, 0, 0), source));
    f.nav.tickTeleport(f.nav.teleportTravel.duration / 2);
    if (interruption === 'pause') f.nav.pause();
    if (interruption === 'remove') f.nav.remove();
    if (interruption === 'source-removal') { source.isConnected = false; f.nav.tickTeleport(16); }
    if (interruption === 'XR-entry') { f.scene.renderer.xr.isPresenting = true; f.nav.handleEnterVr(); }
    if (interruption === 'XR-exit') { f.scene.renderer.xr.isPresenting = false; f.nav.handleExitVr(); }
    assert.equal(f.nav.teleportTravel, null, 'interrupted travel stops');
    near(f.nav.lastResolvedPosition, start, 'interruption restores the starting navigation position');
}

const xr = fixture();
const physical = xr.enterVr();
physical.x += 0.4; // Room-scale movement since session entry.
xr.cameraGroup.position.copy(physical);
const headPosition = xr.cameraGroup.position.clone();
const headOrientation = xr.cameraGroup.quaternion.clone();
const rigPosition = xr.rig.position.clone();
const controllerPoses = xr.controllers.map(controller => ({
    position: controller.position.clone(), orientation: controller.quaternion.clone()
}));
assert(xr.nav.teleportToPoint(point(8, 0, 2), { isConnected: true }));
xr.nav.tickTeleport(xr.nav.teleportTravel.duration);
const authoredHead = xr.nav.renderedToAuthoredPosition(physical, new THREE.Vector3());
near(authoredHead, point(8, 1.6, 2), 'room-scale offset is accounted for at arrival');
near(xr.cameraGroup.position, headPosition, 'XR tracked head position stays untouched');
assert(xr.cameraGroup.quaternion.equals(headOrientation), 'XR tracked head orientation stays untouched');
near(xr.rig.position, rigPosition, 'XR tracking rig remains untouched');
xr.controllers.forEach((controller, index) => {
    near(controller.position, controllerPoses[index].position, 'controller tracking position stays untouched');
    assert(controller.quaternion.equals(controllerPoses[index].orientation), 'controller tracking orientation stays untouched');
});
const virtualArrival = xr.nav.immersiveVirtualNavPosition.clone();
xr.scene.renderer.xr.isPresenting = false;
xr.cameraGroup.position.set(0, 1.6, 0); // A-Frame restores the desktop camera on exit.
xr.nav.handleExitVr();
near(xr.nav.getNavigationWorldPosition(), virtualArrival, 'XR exit keeps the completed virtual travel destination');
xr.nav.tick(16, 16);
xr.enterVr();
near(xr.nav.immersiveVirtualNavPosition, virtualArrival, 'XR re-entry retains the completed travel destination');

const collision = fixture({ mode: 'walkable', collisions: true });
const floorGeometry = new THREE.PlaneGeometry(30, 30);
floorGeometry.rotateX(-Math.PI / 2);

// Exercise production ground synchronization and XR handoffs at different
// authored eye heights and floor elevations, for both generated rig layouts.
for (const standard of [false, true]) {
    for (const authoredHeight of [0.2, 1.6, 2.2, 3]) {
        const f = fixture({ standard, mode: 'walkable', collisions: true });
        const floorY = 3;
        f.addMesh(floorGeometry.clone(), point(0, floorY, 0), true);
        f.nav.setNavigationWorldPosition(point(0, floorY + authoredHeight, 0));
        f.nav.rememberNonImmersiveNavigationPosition(true);
        f.nav.ensureNavigationStatePrimed();
        const desktopHeight = THREE.MathUtils.clamp(authoredHeight, 1.8, 2.8);
        const vrHeight = THREE.MathUtils.clamp(authoredHeight, 0.8, 2.8);
        f.enterVr();
        near(f.nav.immersiveVirtualNavPosition, point(0, floorY + vrHeight, 0), 'immediate VR entry uses the snapped desktop position without another desktop tick');
        f.cameraGroup.position.set(0, 1.6, 0);
        f.scene.renderer.xr.isPresenting = false;
        f.nav.handleExitVr();
        for (let session = 0; session < 3; session++) {
            f.nav.syncHeightOffset();
            f.nav.syncInitialHeightOffset();
            f.nav.rememberNonImmersiveNavigationPosition(true);
            near(f.nav.getNavigationWorldPosition(), point(0, floorY + desktopHeight, 0), 'desktop resampling preserves height on raised ground');
            assert(Math.abs(f.nav.getTrustedDesktopVisionHeightOffset() - vrHeight) < 1e-6, 'desktop lift never overwrites the VR reference');
            f.enterVr();
            near(f.nav.immersiveVirtualNavPosition, point(0, floorY + vrHeight, 0), 'VR entry preserves its prior floor-relative eye height');
            f.cameraGroup.position.set(0, 1.6, 0); // A-Frame restores the inline camera before exit.
            f.scene.renderer.xr.isPresenting = false;
            f.nav.handleExitVr();
            near(f.nav.getNavigationWorldPosition(), point(0, floorY + desktopHeight, 0), 'VR exit restores the desktop minimum without floor or horizontal drift');
        }
    }
}


for (const disabled of [true, 'true', '1']) {
    const f = fixture({ mode: 'walkable', collisions: true, disabled });
    f.addMesh(floorGeometry.clone(), point(0, 0, 0), true);
    f.nav.ensureNavigationStatePrimed();
    f.enterVr();
    f.nav.ensureImmersiveRuntimeHelpers = noop;
    const start = f.nav.getNavigationWorldPosition().clone();
    const head = f.cameraGroup.position.clone();
    const rig = f.rig.position.clone();
    const yaw = f.nav.immersiveRenderYaw;
    f.nav.leftThumbInput.y = -1;
    f.nav.keyboardInput.x = 1;
    f.nav.rightThumbInput.x = 1;
    f.nav.tick(0, 16);
    assert(f.nav.immersiveRenderYaw > yaw, 'movement-disabled scenes retain right-stick turning');
    near(f.nav.getNavigationWorldPosition(), start, 'movement-disabled turning keeps navigation fixed');
    near(f.cameraGroup.position, head, 'turning leaves headset tracking untouched');
    near(f.rig.position, rig, 'turning leaves the tracking rig untouched');
    assert.equal(f.nav.requestJump('controller'), false, 'movement-disabled scenes still reject jumps');
}

for (const floorY of [0, 3]) {
    for (const supportDelta of [-0.08, 0, 0.08]) {
        const f = fixture({ mode: 'walkable', collisions: true, disabled: false });
        f.settings.vrRuntimeProfile = 'headset';
        f.addMesh(floorGeometry.clone(), point(0, floorY, 0), true);
        f.nav.setNavigationWorldPosition(point(0, floorY + 1.6, 0));
        f.nav.ensureNavigationStatePrimed();
        f.enterVr();
        f.nav.ensureImmersiveRuntimeHelpers = noop;
        // A walking probe's accepted floor can differ slightly from exact jump support.
        f.nav.setNavigationWorldPosition(point(0, floorY + 1.6 + supportDelta, 0));
        f.nav.lastResolvedPosition.copy(f.nav.immersiveVirtualNavPosition);
        const start = f.nav.getNavigationWorldPosition().clone();
        const head = f.cameraGroup.position.clone();
        const rig = f.rig.position.clone();
        for (let jump = 0; jump < 3; jump++) {
            assert(f.nav.requestJump('controller'), 'nearby exact support accepts the controller jump');
            let frames = 0;
            while (f.nav.isAirborne() && frames++ < 150) f.nav.tick(frames * 1000 / 72, 1000 / 72);
            assert(!f.nav.isAirborne(), 'controller jump completes and lands');
            near(f.nav.getNavigationWorldPosition(), start, 'first and repeated VR jumps preserve standing height');
            near(f.cameraGroup.position, head, 'jump leaves headset tracking untouched');
            near(f.rig.position, rig, 'jump leaves the tracking rig untouched');
        }
    }
}

const stairs = fixture({ mode: 'walkable', collisions: true, disabled: false });
stairs.addMesh(floorGeometry.clone(), point(0, 0, 0), true);
const stepGeometry = new THREE.PlaneGeometry(3, 5);
stepGeometry.rotateX(-Math.PI / 2);
stairs.addMesh(stepGeometry, point(3, 0.4, 0), true);
stairs.nav.ensureNavigationStatePrimed();
assert(stairs.nav.applyConstrainedMovement(3, 0), 'desktop walking accepts a supported stair');
near(stairs.nav.getNavigationWorldPosition(), point(3, 2.2, 0), 'stair ascent retains 1.8m above the step');
stairs.nav.syncHeightOffset();
assert(Math.abs(stairs.nav.getTrustedDesktopVisionHeightOffset() - 1.6) < 1e-6, 'stair synchronization preserves the original VR eye height');

const headset = fixture({ mode: 'walkable', collisions: true });
headset.settings.vrRuntimeProfile = 'headset';
headset.addMesh(floorGeometry.clone(), point(0, 0, 0), true);
headset.nav.ensureNavigationStatePrimed();
near(headset.nav.getNavigationWorldPosition(), point(0, 1.6, 0), 'standalone headset inline viewing keeps its original height');

collision.addMesh(floorGeometry, point(0, 0, 0), true);
collision.addMesh(new THREE.BoxGeometry(0.2, 3, 3), point(3, 1.5, 0));
assert(collision.nav.teleportToPoint(point(8, 0, 0), { isConnected: true }), 'route obstacles are bypassed');
collision.nav.tickTeleport(collision.nav.teleportTravel.duration);
near(collision.nav.getNavigationWorldPosition(), point(8, 1.8, 0), 'walkable arrival uses the desktop standing minimum');
const arrival = collision.nav.getNavigationWorldPosition().clone();
for (const invalid of [point(3, 0, 0), point(2.7, 0, 0), point(16, 0, 0)]) {
    assert.equal(collision.nav.teleportToPoint(invalid), false, 'invalid or blocked landing is rejected');
    near(collision.nav.getNavigationWorldPosition(), arrival, 'rejection does not move the user');
}
collision.addMesh(new THREE.BoxGeometry(2, 0.2, 2), point(10, 1.2, 0));
assert.equal(collision.nav.teleportToPoint(point(10, 0, 0)), false, 'low ceilings reject landing');
assert(collision.nav.teleportToPoint(point(-8, 0, 0)));
collision.nav.tickTeleport(collision.nav.teleportTravel.duration / 2);
collision.addMesh(new THREE.BoxGeometry(2, 3, 2), point(-8, 1.5, 0));
collision.nav.tickTeleport(collision.nav.teleportTravel.duration);
assert.equal(collision.nav.teleportTravel, null, 'a newly blocked landing cancels travel');
near(collision.nav.getNavigationWorldPosition(), arrival, 'a newly blocked landing restores the starting position');

const slope = fixture({ mode: 'walkable', collisions: true });
const steep = slope.addMesh(floorGeometry.clone(), point(0, 0, 0), true);
steep.rotation.z = Math.PI / 3;
assert.equal(slope.nav.teleportToPoint(point(2, Math.sqrt(3) * 2, 0)), false, 'slopes beyond the walking limit reject landing');
const edge = fixture({ mode: 'walkable', collisions: true });
const smallPlatform = new THREE.PlaneGeometry(0.3, 0.3);
smallPlatform.rotateX(-Math.PI / 2);
edge.addMesh(smallPlatform, point(3, 0, 0), true);
assert.equal(edge.nav.teleportToPoint(point(3, 0, 0)), false, 'unsupported player footprint rejects landing');
const snap = fixture({ mode: 'walkable', collisions: true });
snap.addMesh(floorGeometry.clone(), point(0, 0, 0), true);
assert(snap.nav.teleportToPoint(point(3, 0.2, 0)), 'nearby ground within the snap tolerance is accepted');
snap.nav.tickTeleport(snap.nav.teleportTravel.duration);
near(snap.nav.getNavigationWorldPosition(), point(3, 1.8, 0), 'accepted landing snaps to its supported floor');
assert(snap.nav.teleportToPoint(point(7, 25, 0)), 'a raised walking destination projects to ground below');
snap.nav.tickTeleport(snap.nav.teleportTravel.duration);
near(snap.nav.getNavigationWorldPosition(), point(7, 1.8, 0), 'raised marker preserves eye height at its ground projection');

// Thin pavement overlays must remain the landing floor on arrival. Walking's
// Auto ground policy deliberately prefers the base layer within this distance.
for (const immersive of [false, true]) {
    const pavement = fixture({ mode: 'walkable', collisions: true });
    pavement.addMesh(floorGeometry.clone(), point(0, 0, 0), true);
    pavement.addMesh(floorGeometry.clone(), point(0, 0.0672, 0), true);
    if (immersive) pavement.enterVr();
    const destination = point(4, 0.1, -3);
    assert(pavement.nav.teleportToPoint(destination), 'pavement accepts departure');
    pavement.nav.tickTeleport(pavement.nav.teleportTravel.duration / 2);
    pavement.nav.tickTeleport(pavement.nav.teleportTravel.duration);
    near(pavement.nav.getNavigationWorldPosition(), point(4, 0.0672 + (immersive ? 1.6 : 1.8), -3),
        'arrival keeps the pavement instead of rejecting the lower base-layer landing');
}

const stacked = fixture({ mode: 'walkable', collisions: true });
stacked.addMesh(floorGeometry.clone(), point(0, 0, 0), true);
const upperPlatform = new THREE.PlaneGeometry(10, 10);
upperPlatform.rotateX(-Math.PI / 2);
stacked.addMesh(upperPlatform, point(8, 4, 0), true);
assert(stacked.nav.teleportToPoint(point(8, 10, 0)), 'nearest walkable floor below is selected');
stacked.nav.tickTeleport(stacked.nav.teleportTravel.duration);
near(stacked.nav.getNavigationWorldPosition(), point(8, 5.8, 0), 'upper walkable floor wins over terrain below');
stacked.nav.rememberNonImmersiveNavigationPosition(true);
stacked.enterVr();
near(stacked.nav.immersiveVirtualNavPosition, point(8, 5.6, 0), 'VR entry retains the raised floor with the original eye height');
assert(stacked.nav.teleportToPoint(point(-4, 0, -3)), 'VR can move to a different floor and horizontal position');
stacked.nav.tickTeleport(stacked.nav.teleportTravel.duration);
stacked.cameraGroup.position.set(0, 1.6, 0);
stacked.scene.renderer.xr.isPresenting = false;
stacked.nav.handleExitVr();
near(stacked.nav.getNavigationWorldPosition(), point(-4, 1.8, -3), 'VR exit restores desktop height at the latest floor and position');

const unsupportedStart = fixture({ mode: 'walkable', collisions: true });
unsupportedStart.addMesh(upperPlatform.clone(), point(8, 0, 0), true);
assert(unsupportedStart.nav.teleportToPoint(point(8, 0, 0)), 'a supported destination accepts a start without ground');
unsupportedStart.nav.tickTeleport(unsupportedStart.nav.teleportTravel.duration);
near(unsupportedStart.nav.getNavigationWorldPosition(), point(8, 1.8, 0), 'the desktop minimum also applies without a sampled starting floor');
assert.equal(unsupportedStart.nav.getTrustedDesktopVisionHeightOffset(), 1.6, 'first supported arrival retains the previous default VR height');

const fly = fixture({ mode: 'fly', collisions: true });
fly.addMesh(floorGeometry.clone(), point(0, 0, 0), true);
assert(fly.nav.teleportToPoint(point(4, 12, 0)), 'flying destinations can stay in the air');
fly.nav.tickTeleport(fly.nav.teleportTravel.duration);
near(fly.nav.getNavigationWorldPosition(), point(4, 13.6, 0), 'Fly preserves authored elevation above available terrain');

const walking = fixture({ mode: 'walk', collisions: false });
walking.addMesh(floorGeometry.clone(), point(0, -4, 0), true);
walking.nav.setNavigationWorldPosition(point(0, -2.4, 0));
assert(walking.nav.teleportToPoint(point(4, 5, 0)), 'walking without collision still projects onto scene ground');
walking.nav.tickTeleport(walking.nav.teleportTravel.duration);
near(walking.nav.getNavigationWorldPosition(), point(4, -2.4, 0), 'ground projection does not depend on collision being enabled');

const hiddenGround = fixture({ mode: 'walkable', collisions: true });
hiddenGround.addMesh(floorGeometry.clone(), point(0, 0, 0), true).visible = false;
assert(hiddenGround.nav.teleportToPoint(point(4, 10, 0)), 'runtime ground projection includes hidden navigation geometry');
hiddenGround.nav.tickTeleport(hiddenGround.nav.teleportTravel.duration);
near(hiddenGround.nav.getNavigationWorldPosition(), point(4, 1.8, 0), 'hidden collider ground supports a safe landing');

const changedFloor = fixture({ mode: 'walkable', collisions: true });
const movingFloor = changedFloor.addMesh(floorGeometry.clone(), point(0, 0, 0), true);
assert(changedFloor.nav.teleportToPoint(point(4, 5, 0)));
movingFloor.position.y = -5;
movingFloor.updateMatrixWorld(true);
changedFloor.nav.tickTeleport(changedFloor.nav.teleportTravel.duration);
near(changedFloor.nav.getNavigationWorldPosition(), point(0, 1.8, 0), 'arrival cannot resnap far below a disappeared landing');

const groundedXr = fixture({ mode: 'walkable', collisions: true });
groundedXr.addMesh(floorGeometry.clone(), point(0, 0, 0), true);
groundedXr.enterVr();
const trackedCameraPosition = groundedXr.cameraGroup.position.clone();
const trackedControllerPositions = groundedXr.controllers.map(controller => controller.position.clone());
assert(groundedXr.nav.teleportToPoint(point(6, 20, -3)), 'immersive walking also projects raised destinations');
near(groundedXr.nav.teleportTravel.landing.floor, point(6, 0, -3), 'immersive landing uses authored ground coordinates');
groundedXr.nav.tickTeleport(groundedXr.nav.teleportTravel.duration);
near(groundedXr.cameraGroup.position, trackedCameraPosition, 'ground projection preserves the tracked headset pose');
groundedXr.controllers.forEach((controller, index) => near(controller.position, trackedControllerPositions[index], 'ground projection preserves controller tracking'));

const loading = fixture();
loading.scene.components['vrodos-scene-loader'] = { isReady: false };
assert.equal(loading.nav.teleportToPoint(point(3, 0, 0)), false);
loading.scene.components['vrodos-scene-loader'].isReady = true;
context.window.VRODOSRuntimeOverlay = { interactionLocked: true };
assert.equal(loading.nav.teleportToPoint(point(3, 0, 0)), false, 'modal interactions block teleporting');
context.window.VRODOSRuntimeOverlay = null;

// The destination panel pauses navigation without freezing tracked camera/controller poses.
for (const immersive of [false, true]) {
    const paused = fixture({ disabled: false });
    if (immersive) paused.enterVr();
    paused.nav.ensureNavigationStatePrimed();
    const start = paused.nav.getNavigationWorldPosition().clone();
    const cameraPosition = paused.cameraGroup.position.clone();
    const yaw = paused.nav.immersiveRenderYaw;
    paused.nav.keyboardInput.x = 1;
    Object.assign(paused.nav.leftThumbInput, { x: 1, y: 1 });
    Object.assign(paused.nav.rightThumbInput, { x: 1, y: 1 });
    paused.nav.pause();
    paused.nav.tick(0, 100);
    near(paused.nav.getNavigationWorldPosition(), start, 'paused menu ignores ordinary movement');
    near(paused.cameraGroup.position, cameraPosition, 'paused menu leaves the camera pose untouched');
    assert.equal(paused.nav.immersiveRenderYaw, yaw, 'paused menu ignores thumbstick turning');
    assert.equal(paused.nav.requestJump('controller'), false, 'jump cannot interrupt destination selection');
    let resetCalls = 0;
    paused.nav.resetImmersiveHeight = () => { resetCalls++; };
    paused.nav.handleHeightResetButtonDown({});
    assert.equal(resetCalls, 0, 'height reset cannot interrupt destination selection');
    paused.nav.play();
    assert(paused.nav.teleportToPoint(point(6, 0, -2), { isConnected: true }), 'closing the menu permits teleporting');
}

// Floor surfaces and the selector activation API use the authored origin, never the hit point.
const markerNavigation = fixture();
markerNavigation.scene.querySelector = selector => selector === '[custom-movement]' ? markerNavigation.player : markerNavigation.world;
const markerListeners = new Map();
const markerElement = {
    isConnected: true, object3D: new THREE.Group(), sceneEl: markerNavigation.scene, components: {},
    setObject3D(_name, object) { this.object3D.add(object); },
    removeObject3D() { this.object3D.clear(); },
    addEventListener(type, callback) { markerListeners.set(type, callback); },
    removeEventListener(type) { markerListeners.delete(type); },
    getAttribute: name => name === 'data-vrodos-teleport-order' ? '1' : 'Temple'
};
markerElement.object3D.position.set(3, 2, -4);
markerElement.object3D.rotation.y = 0.4;
markerElement.object3D.scale.set(1.5, 1.2, 1.5);
markerNavigation.world.object3D.add(markerElement.object3D);
const markerComponent = Object.assign(Object.create(definitions['vrodos-teleport-point']), { el: markerElement });
markerElement.components['vrodos-teleport-point'] = markerComponent;
markerComponent.init();
const [ring, center, shadow] = markerComponent.marker.children;
assert.equal(markerComponent.marker.children.length, 3, 'floor ring, clickable centre and ground shadow remain');
assert.equal(ring.geometry.parameters.outerRadius * 2, 1.5, 'floor circle is 1.5 metres across');
const raycaster = new THREE.Raycaster();
for (const [mesh, localTarget, direction] of [
    [ring, point(0.66, 0, 0), point(0, -1, 0)],
    [center, point(0.25, 0, 0), point(0, -1, 0)]
]) {
    markerElement.object3D.updateWorldMatrix(true, true);
    const target = mesh.localToWorld(localTarget);
    raycaster.set(target.clone().addScaledVector(direction, -4), direction);
    const hit = raycaster.intersectObject(markerElement.object3D, true)[0];
    assert(hit && hit.object === mesh, 'ring and centre are both clickable surfaces');
    markerListeners.get('click')({ detail: { intersection: hit } });
    assert(markerNavigation.nav.teleportTravel, 'clicking a marker surface starts travel');
    markerNavigation.nav.tickTeleport(markerNavigation.nav.teleportTravel.duration);
    near(markerNavigation.nav.getNavigationWorldPosition(), point(3, 3.6, -4), 'all surfaces use the floor origin despite appearance transforms');
    markerNavigation.nav.setNavigationWorldPosition(point(0, 1.6, 0));
    markerNavigation.nav.lastResolvedPosition.set(0, 1.6, 0);
}
assert(markerComponent.activate(), 'menu activation starts the same curved travel');
assert.equal(markerNavigation.nav.teleportTravel.source, markerElement, 'the marker owns menu-triggered travel');
assert.equal(markerComponent.activate(), false, 'menu repeats cannot interrupt travel');
markerNavigation.nav.tickTeleport(markerNavigation.nav.teleportTravel.duration);
near(markerNavigation.nav.getNavigationWorldPosition(), point(3, 3.6, -4), 'menu uses the same transformed landing origin');
markerNavigation.nav.setNavigationWorldPosition(point(0, 1.6, 0));
markerNavigation.nav.lastResolvedPosition.set(0, 1.6, 0);
function assertMarkerColors(accent, centerColor) {
    markerComponent.marker.traverse(mesh => {
        if (mesh.isMesh) {
            const expected = mesh.userData.teleportColorRole === 'shadow' ? '0f172a'
                : mesh.userData.teleportColorRole === 'center' ? centerColor : accent;
            assert.equal(mesh.material.color.getHexString(), expected);
        }
    });
}
markerElement.object3D.updateWorldMatrix(true, true);
const shadowTarget = shadow.localToWorld(point(0.82, 0, 0));
raycaster.set(shadowTarget.clone().add(point(0, 4, 0)), point(0, -1, 0));
assert.equal(raycaster.intersectObject(markerElement.object3D, true).length, 0, 'shadow cannot activate or select a teleport destination');

markerNavigation.nav.setNavigationWorldPosition(point(3, 3.6, -4));
markerComponent.updateOccupancy();
assert(markerComponent.occupied, 'standing over a scaled teleport circle detects occupancy');
assert(center.material.transparent && !center.material.depthWrite, 'occupied circle lets the floor show through');
assert(center.material.opacity < 0.1 && shadow.material.opacity < 0.1, 'circle and shadow fade together');
markerNavigation.nav.setNavigationWorldPosition(point(6, 3.6, -4));
markerComponent.updateOccupancy();
assert(!markerComponent.occupied, 'leaving the circle clears occupancy');
assert.equal(center.material.opacity, 1, 'leaving restores the original circle opacity');
assert.equal(center.material.depthWrite, true, 'leaving restores circle depth writes');
assert.equal(shadow.material.opacity, 0.42, 'leaving restores the original shadow opacity');
const occupiedPose = markerNavigation.enterVr();
markerComponent.center.getWorldPosition(occupiedPose);
occupiedPose.y += 1.6;
markerComponent.updateOccupancy();
assert(markerComponent.occupied, 'XR occupancy follows the physical headset over the rendered circle');
occupiedPose.x += 4;
markerComponent.updateOccupancy();
assert(!markerComponent.occupied, 'room-scale movement off the circle restores opacity');
markerNavigation.scene.renderer.xr.isPresenting = false;
markerNavigation.nav.handleExitVr();
markerNavigation.nav.setNavigationWorldPosition(point(0, 1.6, 0));
markerNavigation.nav.lastResolvedPosition.set(0, 1.6, 0);

markerListeners.get('mouseenter')();
assertMarkerColors('5eead4', '14b8a6');
markerComponent.showRejection();
assertMarkerColors('ef4444', '991b1b');
timers.get(timerId)();
assertMarkerColors('5eead4', '14b8a6');
markerListeners.get('mouseleave')();
assertMarkerColors('14b8a6', '0f766e');
markerListeners.get('click')({ detail: {} });
markerComponent.remove();
assert.equal(markerNavigation.nav.teleportTravel, null, 'removing a marker cancels travel from the component');
near(markerNavigation.nav.getNavigationWorldPosition(), point(0, 1.6, 0), 'marker removal restores the starting position');

// Editor projection shares the same ray and marker placement rules as runtime.
const editor = { editor: {}, editorRender: {}, utils: {} };
context.window.VRODOS = context.VRODOS = editor;
for (const file of ['vrodos_editor_environment_helpers.js', 'vrodos_editor_director_helpers.js']) {
    vm.runInContext(readFileSync(resolve(root, 'assets/js/editor/render', file), 'utf8'), context);
}
const editorMethods = {};
editor.editorRender.installDirectorHelperMethods(editorMethods);
const editorScene = new THREE.Scene();
editorScene.aframeNavigationMode = 'walkable';
const editorFloor = new THREE.Mesh(floorGeometry.clone(), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
editorFloor.category_slug = 'primitive-plane';
editorFloor.position.y = -4;
const editorPoint = Teleport.createMarker();
editorPoint.category_slug = 'teleport-point';
editorPoint.position.set(5, 7, -2);
editorPoint.rotation.y = 0.5;
editorPoint.scale.set(1.5, 1.2, 1.5);
editorScene.add(editorFloor, editorPoint);
const editorEnvironment = Object.assign(Object.create(editorMethods), { scene: editorScene });
editorEnvironment.updateTeleportGroundGuides();
editorPoint.updateWorldMatrix(true, true);
near(editorPoint.children[0].getWorldPosition(point(0, 0, 0)), point(5, -4 + 0.025 * 1.2, -2), 'editor ring sits at its projected landing with authored scale');
near(editorPoint.children[2].getWorldPosition(point(0, 0, 0)), point(5, -4 + 0.01 * 1.2, -2), 'editor shadow and floor circle share the ground projection');
near(editorPoint.position, point(5, 7, -2), 'projection preserves authored height for later Fly use');
editorScene.aframeNavigationMode = 'fly';
editorEnvironment.updateTeleportGroundGuides();
editorPoint.updateWorldMatrix(true, true);
near(editorPoint.children[0].getWorldPosition(point(0, 0, 0)), point(5, 7 + 0.025 * 1.2, -2), 'switching to Fly restores the authored air destination');

const lateGround = fixture({ mode: 'walk', collisions: false });
lateGround.scene.hasLoaded = true;
lateGround.scene.querySelector = selector => selector === '[custom-movement]' ? lateGround.player : lateGround.world;
const lateElement = { ...events, object3D: new THREE.Group(), sceneEl: lateGround.scene, components: {},
    setObject3D(_name, mesh) { this.object3D.add(mesh); }, removeObject3D() { this.object3D.clear(); },
    getAttribute: name => name === 'data-vrodos-teleport-order' ? '1' : 'Raised destination', isConnected: true };
lateElement.object3D.position.set(3, 7, 0);
lateGround.world.object3D.add(lateElement.object3D);
const lateMarker = Object.assign(Object.create(definitions['vrodos-teleport-point']), { el: lateElement });
lateElement.components['vrodos-teleport-point'] = lateMarker;
lateMarker.init();
lateMarker.tick(0);
lateGround.addMesh(floorGeometry.clone(), point(0, 0, 0), true);
lateMarker.tick(250);
lateElement.object3D.updateWorldMatrix(true, true);
near(lateMarker.marker.children[0].getWorldPosition(point(0, 0, 0)), point(3, 0.025, 0), 'ground arriving after the marker is projected instead of caching a missing surface');
lateMarker.setMenuHovered(true);
assert(lateMarker.pillar.visible);
near(lateMarker.pillar.getWorldPosition(point(0, 0, 0)), point(3, 0.025, 0), 'pillar ends at the ground-projected circle');
const pillarRay = new THREE.Raycaster(point(3, 5, 5), point(0, 0, -1));
assert.equal(pillarRay.intersectObject(lateMarker.pillar).length, 0, 'preview cannot intercept scene selection');
assert.equal(lateMarker.pillar.material.depthTest, false, 'destination preview remains discoverable behind buildings');
assert.equal(lateMarker.pillar.castShadow, false);
assert(lateMarker.activate());
lateMarker.updateHoverPillar();
assert.equal(lateMarker.pillar.visible, false, 'travel hides its destination preview');
lateGround.nav.tickTeleport(lateGround.nav.teleportTravel.duration);
near(lateGround.nav.getNavigationWorldPosition(), point(3, 1.6, 0), 'projected floor click uses the same landing as its visible circle');
lateGround.settings.navigationMode = 'fly';
lateMarker.tick(500);
lateElement.object3D.updateWorldMatrix(true, true);
near(lateMarker.marker.children[0].getWorldPosition(point(0, 0, 0)), point(3, 7.025, 0), 'runtime mode change restores the authored visual height');
near(lateMarker.pillar.getWorldPosition(point(0, 0, 0)), point(3, 7.025, 0), 'air destination preview follows authored Fly elevation');
lateMarker.pause();
assert.equal(lateMarker.pillar.visible, false, 'component pause clears the hover preview');
assert(lateMarker.activate());
lateGround.nav.tickTeleport(lateGround.nav.teleportTravel.duration);
near(lateGround.nav.getNavigationWorldPosition(), point(3, 8.6, 0), 'the same marker becomes an air destination in Fly');
lateMarker.remove();
assert.equal(lateMarker.pillar.parent, null, 'marker removal releases the scene-owned preview');

console.log('Teleport navigation acceptance tests passed.');
