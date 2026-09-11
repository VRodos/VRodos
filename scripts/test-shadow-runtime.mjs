import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import { runtimeBuildChunks } from './build/runtime-chunks.mjs';

let now = 1000;
let nextTimer = 1;
let navigation = null;
let cycle = false;
const flags = new Set();
const timers = new Map();
const frames = new Map();
const sceneSettings = { data: { flatMediaShadowCasting: '1' } };
const context = vm.createContext({
    VRODOSMaster: {}, THREE, performance: { now: () => now },
    document: { querySelector: () => ({ components: { 'scene-settings': sceneSettings } }) },
    setTimeout: (fn, delay) => { const id = nextTimer++; timers.set(id, { fn, delay }); return id; },
    clearTimeout: id => timers.delete(id),
    requestAnimationFrame: fn => { const id = nextTimer++; frames.set(id, fn); return id; }
});
context.window = context;
for (const name of ['vrodos_shadow_maps.js', 'vrodos_shadow_runtime.js']) {
    vm.runInContext(readFileSync(new URL(`../assets/js/runtime/master/${name}`, import.meta.url), 'utf8'), context);
}
const dependencies = {
    readPmndrsDebugNumber: (key, query, fallback) => fallback,
    hasPmndrsDebugFlag: key => flags.has(key),
    isPmndrsDayNightCycleEnabled: () => cycle,
    getRuntimeNowMs: () => now,
    getImmersiveNavigationForPresentedTransforms: () => navigation
};
const runtime = context.VRODOSMaster.ShadowRuntime.create(dependencies);
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
const entity = (attributes = {}, id = '') => ({
    id, tagName: 'A-ENTITY', classList: { contains: () => false },
    hasAttribute: key => Object.hasOwn(attributes, key),
    getAttribute: key => attributes[key] ?? null
});
function fixture() {
    const scene = new THREE.Scene();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 20), new THREE.MeshStandardMaterial());
    mesh.el = entity({ 'data-vrodos-shadow-role': 'caster-receiver' });
    const light = new THREE.DirectionalLight();
    light.position.set(20, 40, 20);
    light.userData.vrodosPmndrsTakramLightSource = true;
    const camera = new THREE.PerspectiveCamera();
    scene.add(mesh, light, light.target, camera);
    const tracked = [];
    const component = Object.assign({
        data: { shadowQuality: 'high', shadowUpdateMode: 'static', rootShadowType: 'pcf', contactShadowPreset: 'strong' },
        el: {
            object3D: scene, camera,
            renderer: { shadowMap: { type: THREE.PCFShadowMap, enabled: true } },
            querySelectorAll: () => [], getAttribute: () => ({}), hasAttribute: () => false, setAttribute() {}
        },
        runtimeResources: { track: resource => tracked.push(resource) },
        getContactShadowSettings: () => ({ bias: -0.001, normalBias: 0.005 }),
        getPresentationMode: () => 'desktop-fullscreen',
        isImmersiveXrActive: () => false
    }, runtime.helpers);
    return { component, scene, mesh, light, camera, tracked };
}

// Role precedence: hidden ancestors win; navmesh intent and flat-media policy stay live.
const roles = fixture();
const parent = new THREE.Group();
parent.el = entity({ 'data-vrodos-overlay-ui': '' });
parent.add(roles.mesh);
assert.equal(runtime.getObjectShadowRole(roles.mesh), 'none');
assert.equal(runtime.isWorldLightingParticipantMesh(roles.mesh), false);
parent.remove(roles.mesh);
assert.equal(runtime.getEntityShadowRole(entity({ 'data-vrodos-navmesh': '', 'data-vrodos-shadow-role': 'caster-receiver' })), 'receiver');
assert.equal(runtime.getEntityShadowRole(entity({ 'data-vrodos-navmesh': '', 'data-vrodos-shadow-role-authored': 'true', 'data-vrodos-shadow-role': 'caster-receiver' })), 'caster-receiver');
roles.mesh.el = entity({}, 'video-display_7');
assert.equal(runtime.getObjectShadowRole(roles.mesh), 'caster-receiver');
sceneSettings.data.flatMediaShadowCasting = '0';
assert.equal(runtime.getObjectShadowRole(roles.mesh), 'receiver');
flags.add('castFlatMediaShadows');
assert.equal(runtime.getObjectShadowRole(roles.mesh), 'caster-receiver');
flags.clear(); sceneSettings.data.flatMediaShadowCasting = '1';
assert.equal(runtime.isShadowEligibleMaterial({ transparent: true, opacity: 0.5 }), false);
assert.equal(runtime.isShadowEligibleMaterial({ transparent: true, opacity: 0.5, alphaTest: 0.1 }), true);
assert.equal(runtime.isHiddenNavmeshMaterial([{ userData: { vrodosHiddenNavmeshMaterial: true } }]), true);

// Terrain depth material is tracked once and restores the authored material when disabled.
const terrain = fixture();
terrain.mesh.el = entity({ 'data-vrodos-material-role': 'terrain-matte', 'data-vrodos-shadow-role': 'caster-receiver' });
terrain.component.el.querySelectorAll = () => [terrain.mesh.el];
const authoredDepth = new THREE.MeshDepthMaterial();
terrain.mesh.customDepthMaterial = authoredDepth;
terrain.component.applyShadowQualityProfile();
const depth = terrain.mesh.customDepthMaterial;
assert.notEqual(depth, authoredDepth);
assert.equal(depth.polygonOffsetFactor, 4);
assert.equal(depth.polygonOffsetUnits, 8);
assert.equal(terrain.tracked.length, 1);
near(terrain.light.shadow.bias, -0.00012);
near(terrain.light.shadow.normalBias, 0.032);
terrain.component.applyShadowQualityProfile();
assert.equal(terrain.mesh.customDepthMaterial, depth);
assert.equal(terrain.tracked.length, 1);
flags.add('disableTerrainShadowDepthOffset');
terrain.component.applyShadowQualityProfile();
assert.equal(terrain.mesh.customDepthMaterial, authoredDepth);
flags.clear();
terrain.component.applyShadowQualityProfile();
assert.equal(terrain.mesh.customDepthMaterial, depth);
terrain.component.data.shadowQuality = 'off';
terrain.component.applyShadowQualityProfile();
assert.equal(terrain.mesh.customDepthMaterial, authoredDepth);
assert.equal(terrain.mesh.castShadow, false);
assert.equal(terrain.light.castShadow, false);
assert.equal(terrain.component.el.renderer.shadowMap.autoUpdate, false);

// Fit real shadow cameras and confirm geometry corners remain inside their frustum.
frames.clear();
const fit = fixture();
fit.component.applyShadowQualityProfile();
assert.equal(fit.light.userData.vrodosAdaptiveShadowFitted, true);
const bounds = new THREE.Box3().setFromObject(fit.mesh);
for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
    const point = new THREE.Vector3(x, y, z).applyMatrix4(fit.light.shadow.camera.matrixWorldInverse);
    const camera = fit.light.shadow.camera;
    assert.ok(point.x >= camera.left && point.x <= camera.right);
    assert.ok(point.y >= camera.bottom && point.y <= camera.top);
    assert.ok(-point.z >= camera.near && -point.z <= camera.far);
}
near(runtime.getDirectionalShadowDistanceForScene(fit.component, 1), 28);
assert.equal(fit.light.shadow.mapSize.x, 2048);
assert.equal(fit.component.isStaticShadowMode(), true);
cycle = true;
assert.equal(fit.component.isStaticShadowMode(), false);
cycle = false;

// Headset caps shrink existing oversized maps while desktop retains authored resolution.
const headset = fixture();
headset.component.data.shadowQuality = 'medium';
headset.light.shadow.mapSize.set(4096, 4096);
headset.component.applyShadowQualityProfile();
assert.equal(headset.light.shadow.mapSize.x, 4096);
let disposed = 0;
headset.light.shadow.map = { depthTexture: { compareFunction: THREE.LessEqualCompare }, dispose() { disposed++; } };
headset.component.isVrRuntimeHeadsetProfile = () => true;
headset.component.applyShadowQualityProfile();
assert.equal(headset.light.shadow.mapSize.x, 1024);
assert.equal(disposed, 1);
assert.equal(headset.light.shadow.map, null);
assert.equal(headset.mesh.receiveShadow, true);

// Dirty updates coalesce; a flush invalidates programs once per map type.
frames.clear(); fit.component._vrodosShadowFlushHandle = null;
fit.component.markShadowDirty('first'); fit.component.markShadowDirty('second');
assert.equal(frames.size, 1);
const flush = [...frames.values()][0]; frames.clear(); flush();
assert.equal(fit.component._vrodosShadowLastUpdateReason, 'second');
assert.equal(fit.component._vrodosShadowDirty, false);
assert.equal(fit.component._vrodosShadowFlushHandle, null);
const programCount = fit.component._vrodosShadowProgramRefreshes;
fit.component.flushShadowUpdate();
assert.equal(fit.component._vrodosShadowProgramRefreshes, programCount);
assert.equal(fit.component.el.renderer.shadowMap.autoUpdate, false);

// Static desktop navigation: throttle, distance threshold, forced settle, cancellation.
assert.equal(fit.component.requestNavigationShadowRefresh('move', { settleMs: 200 }), true);
assert.equal(timers.size, 1);
assert.equal(fit.component.requestNavigationShadowRefresh('move'), false);
assert.equal(fit.component._vrodosNavigationShadowRefreshLastSkippedReason, 'throttled');
now += 100;
assert.equal(fit.component.requestNavigationShadowRefresh('move'), false);
assert.equal(fit.component._vrodosNavigationShadowRefreshLastSkippedReason, 'distance');
fit.camera.position.x = 1; fit.camera.updateMatrixWorld(true);
assert.equal(fit.component.requestNavigationShadowRefresh('move', { settleMs: 200 }), true);
assert.equal(timers.size, 1);
const [timerId, timer] = [...timers.entries()][0]; timers.delete(timerId); timer.fn();
assert.equal(fit.component._vrodosNavigationShadowRefreshLastReason, 'move-settle');
assert.equal(fit.component._vrodosNavigationShadowRefreshSettleTimer, null);
fit.component.requestNavigationShadowRefresh('move', { force: true, settleMs: 200 });
fit.component.clearNavigationShadowRefreshSettleTimer();
assert.equal(timers.size, 0);
fit.component.isImmersiveXrActive = () => true;
assert.equal(fit.component.requestNavigationShadowRefresh('move', { force: true }), false);
assert.equal(fit.component._vrodosNavigationShadowRefreshLastSkippedReason, 'immersive-xr');
fit.component.isImmersiveXrActive = () => false;
fit.component.data.shadowUpdateMode = 'dynamic';
assert.equal(fit.component.requestNavigationShadowRefresh('move'), false);
assert.equal(fit.component._vrodosNavigationShadowRefreshLastSkippedReason, 'dynamic-shadow-mode');

// Presented transforms run once per navigation revision; authored-world children stay owned by their container.
const presented = fixture();
const originalPosition = presented.light.position.clone();
const offset = new THREE.Vector3(10, 0, -4);
navigation = {
    immersiveRootTransformCount: 1,
    immersiveNavigationStrategy: 'authored-world-container',
    isObjectInsideImmersiveAuthoredWorld: () => false,
    authoredToRenderedPosition: (from, to) => to.copy(from).add(offset),
    renderedToAuthoredPosition: (from, to) => to.copy(from).sub(offset)
};
assert.equal(presented.component.syncPresentedShadowLightTransforms(), true);
assert.deepEqual(presented.light.position.toArray(), originalPosition.clone().add(offset).toArray());
assert.equal(presented.component.syncPresentedShadowLightTransforms(), false);
navigation.immersiveRootTransformCount++;
offset.x = 20;
assert.equal(presented.component.syncPresentedShadowLightTransforms(), true);
assert.deepEqual(presented.light.position.toArray(), originalPosition.clone().add(offset).toArray());
navigation.isObjectInsideImmersiveAuthoredWorld = () => true;
navigation.immersiveRootTransformCount++;
assert.equal(presented.component.syncPresentedShadowLightTransforms(), false);
navigation = null;
assert.equal(presented.component.syncPresentedShadowLightTransforms(), false);

const core = runtimeBuildChunks.find(chunk => chunk.id === 'core-runtime');
const index = name => core.sourceFiles.indexOf(`assets/js/runtime/master/${name}`);
assert.ok(index('vrodos_shadow_maps.js') >= 0);
assert.ok(index('vrodos_shadow_runtime.js') > index('vrodos_shadow_maps.js'));
assert.ok(index('vrodos_quality_profiles.js') > index('vrodos_shadow_runtime.js'));
console.log('Shadow subsystem roles, terrain resources, fitting, scheduling, and XR transforms passed.');
