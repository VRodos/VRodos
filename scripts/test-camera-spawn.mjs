import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as THREE from 'three';

const root = resolve(import.meta.dirname, '..');
const definitions = {};
const noop = () => {};
const events = { addEventListener: noop, removeEventListener: noop };
const sandbox = {
    THREE, console, performance: { now: () => 0 }, document: { ...events },
    window: { ...events, VRODOSMaster: { clamp: THREE.MathUtils.clamp } },
    AFRAME: { THREE, registerComponent: (name, definition) => { definitions[name] = definition; } }
};
vm.createContext(sandbox);
for (const file of ['components/vrodos_camera_start.component.js', 'master/components/vrodos_navigation.component.js']) {
    vm.runInContext(readFileSync(resolve(root, 'assets/js/runtime', file), 'utf8'), sandbox, { filename: file });
}

// Execute the locked A-Frame implementation that used to erase the authored rotation.
const aframe = readFileSync(resolve(root, 'assets/vendor/aframe/aframe-master.min.js'), 'utf8');
const orientationBody = aframe.match(/updateOrientation:function\(\)\{([\s\S]*?)\},updateMagicWindowOrientation:/)?.[1];
assert(orientationBody, 'locked A-Frame look-controls orientation implementation is available');
const updateOrientation = vm.runInContext('(function(){' + orientationBody + '})', sandbox);
assert.deepEqual(Array.from(definitions['vrodos-camera-start'].dependencies), ['look-controls']);

function near(actual, expected, label) { assert(Math.abs(actual - expected) < 1e-6, label + ': ' + actual + ' != ' + expected); }
function vectorNear(actual, expected, label) { for (const axis of ['x', 'y', 'z']) near(actual[axis], expected[axis], label + ' ' + axis); }
const start = new THREE.Vector3(0, 2.7669967459107, -12.87772082322);

function fixture({ disabled = 'true', mode = 'fly', standard = false, yaw = 180, pitch = 25 } = {}) {
    const sceneObject = new THREE.Group();
    const rig = new THREE.Group();
    const cameraGroup = new THREE.Group();
    const camera = new THREE.PerspectiveCamera();
    const world = { ...events, id: 'vrodos-authored-world', components: {}, object3D: new THREE.Group() };
    sceneObject.add(rig, world.object3D);
    rig.add(cameraGroup);
    cameraGroup.add(camera);
    (standard ? rig : cameraGroup).position.copy(start);
    const settings = { cam_position: start.toArray().join(' '), cam_rotation_y: String(yaw), cam_rotation_x: String(pitch),
        movement_disabled: disabled, navigationMode: mode, collisionMode: 'off' };
    const scene = { ...events, object3D: sceneObject, components: {}, camera,
        renderer: { xr: { isPresenting: false } }, is: () => false,
        getAttribute: () => settings, querySelector: () => world, querySelectorAll: () => [] };
    const cameraEl = { ...events, object3D: cameraGroup, components: { camera: { camera } }, sceneEl: scene };
    const player = { ...events, object3D: rig, components: {}, sceneEl: scene };
    const lookHost = standard ? player : cameraEl;
    const look = { el: lookHost, pitchObject: new THREE.Group(), yawObject: new THREE.Group(),
        magicWindowDeltaEuler: new THREE.Euler(), updateMagicWindowOrientation: noop };
    lookHost.components['look-controls'] = look;
    definitions['vrodos-camera-start'].init.call({ el: lookHost, data: { yaw, pitch } });
    sandbox.document.querySelector = (selector) => selector === '#cameraA' ? cameraEl : null;
    const nav = Object.create(definitions['custom-movement']);
    nav.el = player;
    definitions['custom-movement'].init.call(nav);
    Object.assign(nav, {
        data: { thumbstickDeadzone: 0.08 }, hasAuthoredNavigationMode: () => true,
        areCollisionsEnabled: () => false, beginImmersiveSmoothnessFrame: () => null,
        getActiveImmersiveSmoothnessFrame: () => null, finishImmersiveSmoothnessFrame: noop,
        updateWASDControlsState: noop, applyRightThumbstickTurn: noop, updateVerticalMotion: noop,
        requestShadowMapRefresh: noop, beginImmersiveEntryPoseSettle: noop
    });
    return { nav, rig, cameraGroup, camera, look, scene, settings, world };
}

// Both compiler rig layouts must retain yaw and pitch through the first and subsequent look updates.
for (const standard of [false, true]) {
    for (const yaw of [0, 45, 180, 404.68688831432]) {
        for (const pitch of [-30, 0, 25]) {
            const f = fixture({ standard, yaw, pitch });
            const expected = new THREE.PerspectiveCamera();
            expected.rotation.set(THREE.MathUtils.degToRad(pitch), THREE.MathUtils.degToRad(yaw), 0, 'YXZ');
            for (let frame = 0; frame < 3; frame++) updateOrientation.call(f.look);
            vectorNear(f.camera.getWorldDirection(new THREE.Vector3()), expected.getWorldDirection(new THREE.Vector3()), 'Director viewing direction');
            vectorNear(f.camera.getWorldPosition(new THREE.Vector3()), start, 'orientation preserves position');
            f.look.yawObject.rotation.y += 0.1;
            updateOrientation.call(f.look);
            near(f.look.el.object3D.rotation.y, THREE.MathUtils.degToRad(yaw) + 0.1, 'subsequent mouse look remains active');
        }
    }
}

// Reproduce scene 1128: movement disabled before the first tick, with a nonzero camera and zero rig.
for (const standard of [false, true]) {
    for (const mode of ['fly', 'walk', 'walkable']) {
        for (const disabled of [true, 'true', '1', false, '0']) {
            const f = fixture({ standard, mode, disabled });
            for (let frame = 0; frame < 3; frame++) {
                f.nav.tick(frame * 16, 16);
                vectorNear(f.camera.getWorldPosition(new THREE.Vector3()), start, 'first/idle ticks preserve authored position');
            }
            assert(f.nav.positionPrimed, 'navigation initializes with movement locked');
            const moved = start.clone().add(new THREE.Vector3(4, 1, -3));
            f.nav.setNavigationWorldPosition(moved);
            f.nav.lastResolvedPosition.copy(moved);
            f.settings.movement_disabled = 'true';
            f.nav.tick(64, 16);
            vectorNear(f.camera.getWorldPosition(new THREE.Vector3()), moved, 'locking after navigation preserves current pose');
            f.rig.position.x += 2; // Simulate a separate movement control while navigation is locked.
            f.nav.tick(80, 16);
            vectorNear(f.camera.getWorldPosition(new THREE.Vector3()), moved, 'movement lock restores initialized current pose');
        }
    }
}

// Immediate XR entry must ignore a camera which already contains the physical headset pose.
for (const cachedDesktop of [false, true]) {
    const f = fixture();
    const desired = cachedDesktop ? start.clone().add(new THREE.Vector3(3, 0, 2)) : start;
    const desiredYaw = cachedDesktop ? 0.7 : Math.PI;
    if (cachedDesktop) {
        f.nav.setNavigationWorldPosition(desired);
        f.look.yawObject.rotation.y = desiredYaw;
        updateOrientation.call(f.look);
        f.nav.tick(0, 16);
    }
    f.scene.renderer.xr.isPresenting = true;
    const physicalPosition = new THREE.Vector3(0.3, 1.7, -0.2);
    const physicalForward = new THREE.Vector3(-0.4, 0, -1).normalize();
    f.cameraGroup.position.copy(physicalPosition);
    f.nav.getImmersivePhysicalAnchorPosition = (target) => target.copy(physicalPosition);
    f.nav.getImmersivePhysicalForwardDirection = (target) => target.copy(physicalForward);
    f.nav.resetImmersiveWorldLocomotion();
    vectorNear(f.nav.immersiveVirtualNavPosition, desired, 'XR entry retains authored/current navigation position');
    vectorNear(f.nav.lastResolvedPosition, desired, 'XR movement lock starts from initialized virtual position');
    vectorNear(f.rig.position, new THREE.Vector3(), 'XR rig remains an unpositioned tracking rig');
    vectorNear(f.cameraGroup.position, physicalPosition, 'XR tracking pose remains untouched');
    vectorNear(f.nav.authoredToRenderedPosition(desired, new THREE.Vector3()), physicalPosition, 'authored start maps to the physical anchor');
    const desiredForward = new THREE.Vector3(-Math.sin(desiredYaw), 0, -Math.cos(desiredYaw));
    vectorNear(f.nav.authoredToRenderedDirection(desiredForward, new THREE.Vector3()), physicalForward, 'XR world heading aligns with authored/current view');
    assert.equal(f.nav.immersiveInitialYawSource, cachedDesktop ? 'desktop-view' : 'director-camera');
    physicalPosition.x += 0.5;
    f.nav.applyImmersiveRenderTransform();
    near(f.nav.immersiveLiveAnchorDelta.x, 0.5, 'physical head movement remains independent of virtual locomotion');
    vectorNear(f.nav.immersiveVirtualNavPosition, desired, 'head tracking does not reset virtual spawn');
    // Use the production exit finalizer after A-Frame restores its desktop camera pose.
    const exitPosition = desired.clone().add(new THREE.Vector3(2, 0.5, -1));
    f.nav.setNavigationWorldPosition(exitPosition);
    f.nav.restoreImmersiveWorldBaseTransforms();
    f.scene.renderer.xr.isPresenting = false;
    f.nav.immersiveWasPresenting = false;
    f.cameraGroup.position.copy(start);
    f.nav.pendingImmersiveExitNavigationPosition = exitPosition.clone();
    assert(f.nav.finalizeImmersiveExitNavigationHandoff('spawn-regression').applied, 'XR exit applies the current virtual position');
    vectorNear(f.camera.getWorldPosition(new THREE.Vector3()), exitPosition, 'XR exit retains the navigated pose');
    f.look.yawObject.rotation.y = desiredYaw;
    updateOrientation.call(f.look);
    f.nav.tick(16, 16);
    f.scene.renderer.xr.isPresenting = true;
    f.cameraGroup.position.copy(physicalPosition);
    f.nav.resetImmersiveWorldLocomotion();
    vectorNear(f.nav.immersiveVirtualNavPosition, exitPosition, 'XR re-entry retains the exit position instead of resetting to Director spawn');
    vectorNear(f.nav.authoredToRenderedDirection(desiredForward, new THREE.Vector3()), physicalForward, 'XR re-entry retains the current heading');
}
console.log('Director camera spawn tests passed');
