import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import { runtimeBuildChunks } from './build/runtime-chunks.mjs';

let now = 1000;
const sun = { object3D: new THREE.Object3D() };
const haze = { object3D: new THREE.Object3D() };
const context = vm.createContext({ THREE, VRODOSMaster: {}, performance: { now: () => now },
    document: { getElementById: id => ({ 'vrodos-pmndrs-sun': sun, 'vrodos-pmndrs-sun-haze': haze })[id], querySelector: () => null } });
for (const name of ['vrodos_shadow_maps.js', 'vrodos_shadow_runtime.js', 'vrodos_sun_occlusion.js']) {
    vm.runInContext(readFileSync(new URL(`../assets/js/runtime/master/${name}`, import.meta.url), 'utf8'), context);
}
const shadow = context.VRODOSMaster.ShadowRuntime.create({ hasPmndrsDebugFlag: () => false });
const { apply } = context.VRODOSMaster.SunOcclusion.create({ shadow,
    setPmndrsSkyMaterialNativeSun: (self, visible) => { self._pmndrsAtmosphereState.skyMaterial.sun = visible; } });
const direction = new THREE.Vector3(0, 0, 1);
const geometry = new THREE.PlaneGeometry(4, 4);
const materials = [];
const mesh = (options = {}) => {
    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, ...options });
    materials.push(material);
    const node = new THREE.Mesh(geometry, material);
    node.position.z = 5;
    return node;
};
const entity = attrs => ({ hasAttribute: key => Object.hasOwn(attrs, key), getAttribute: key => attrs[key] ?? null });
function fixture(node) {
    const scene = new THREE.Scene();
    if (node) scene.add(node);
    scene.updateMatrixWorld(true);
    return { el: { object3D: scene, camera: new THREE.PerspectiveCamera() },
        _pmndrsAtmosphereState: { skyMaterial: { sun: true } }, pmndrsLensFlareEffect: { intensity: 0.8 },
        _pmndrsLensFlareCloudFactor: 0.25 };
}
const blocked = fixture(mesh());
assert.equal(apply(blocked, direction, 100), 0, 'Real triangle raycast blocks the sun');
assert.equal(blocked._pmndrsAtmosphereState.skyMaterial.sun, false);
assert.equal(sun.object3D.visible, false);
assert.equal(haze.object3D.visible, false);
assert.equal(blocked.pmndrsLensFlareEffect.intensity, 0);
assert.equal(blocked.pmndrsLensFlareEffect._vrodosBaseIntensity, 0.8);
assert.equal(blocked._pmndrsSunOcclusionRaycaster.near, 0.1);
assert.equal(blocked._pmndrsSunOcclusionRaycaster.far, 100);
assert.equal(blocked._pmndrsSunOcclusionRaycaster.firstHitOnly, true);
assert.equal(blocked._pmndrsSunOcclusionOrigin.z, 0.5);
const targets = blocked._pmndrsSunOcclusionTargets;
const raycaster = blocked._pmndrsSunOcclusionRaycaster;
blocked.el.object3D.children[0].position.x = 20;
blocked.el.object3D.updateMatrixWorld(true);
now += 299;
assert.equal(apply(blocked, direction, 100), 0, 'Occlusion result is reused before 300ms');
now += 1;
assert.equal(apply(blocked, direction, 100), 1, 'World bounds are re-evaluated at 300ms');
assert.equal(blocked._pmndrsSunOcclusionTargets, targets, 'Target list remains cached');
assert.equal(blocked._pmndrsSunOcclusionRaycaster, raycaster, 'Raycaster is reused');
assert.equal(blocked.pmndrsLensFlareEffect.intensity, 0.2, 'Cloud factor multiplies the original flare intensity');
assert.equal(sun.object3D.visible, true);
assert.equal(haze.object3D.visible, true);
blocked._pmndrsCloudSunDiskSpriteActive = true;
assert.equal(apply(blocked, direction, 100), 1);
assert.equal(blocked._pmndrsAtmosphereState.skyMaterial.sun, false, 'Sprite ownership keeps native sun hidden');
blocked._pmndrsCloudSunDiskSpriteActive = false;
blocked._pmndrsCloudSunDiskTakramPhaseNativeHidden = true;
apply(blocked, direction, 100);
assert.equal(blocked._pmndrsAtmosphereState.skyMaterial.sun, false, 'Cloud phase ownership keeps native sun hidden');
blocked._pmndrsCloudSunDiskTakramPhaseNativeHidden = false;
apply(blocked, direction, 100);
assert.equal(blocked._pmndrsAtmosphereState.skyMaterial.sun, true);

const cache = fixture();
apply(cache, direction, 100);
const cachedAt = now;
cache.el.object3D.add(mesh());
cache.el.object3D.updateMatrixWorld(true);
now = cachedAt + 2199;
assert.equal(apply(cache, direction, 100), 1, 'New blockers wait for target cache refresh');
now = cachedAt + 2500;
assert.equal(apply(cache, direction, 100), 0, 'Target cache refreshes at 2500ms');
assert.equal(cache._pmndrsSunOcclusionTargets.length, 1);
assert.notEqual(cache._pmndrsSunOcclusionRaycaster, blocked._pmndrsSunOcclusionRaycaster, 'Components keep independent state');

for (const change of [
    node => { node.visible = false; },
    node => { node.userData.vrodosPmndrsAtmosphereSky = true; },
    node => { node.userData.vrodosPmndrsTakramLightSource = true; },
    node => { node.material.visible = false; },
    node => { node.material.transparent = true; node.material.opacity = 0.5; },
    node => { node.material.userData.vrodosHiddenNavmeshMaterial = true; },
    ...['data-vrodos-pmndrs-sun', 'data-vrodos-overlay-ui', 'data-vrodos-collision-hidden', 'vrodos-collider-helper'].map(attr => node => {
        node.el = entity({ [attr]: '' });
    })
]) {
    const node = mesh(); change(node);
    const self = fixture(node);
    assert.equal(apply(self, direction, 100), 1, 'Excluded geometry cannot block the sun');
    assert.equal(self._pmndrsSunOcclusionTargets.length, 0);
}
for (const parentChange of [parent => { parent.visible = false; }, parent => { parent.el = entity({ 'data-vrodos-overlay-ui': '' }); }]) {
    const parent = new THREE.Group(); parent.add(mesh()); parentChange(parent);
    assert.equal(apply(fixture(parent), direction, 100), 1, 'Ancestor exclusions are honored');
}
assert.equal(apply(fixture(mesh({ transparent: true, opacity: 0.5, alphaTest: 0.1 })), direction, 100), 0, 'Alpha-tested material stays eligible');
const nonIndexed = mesh(); nonIndexed.geometry = geometry.toNonIndexed();
const indexedRuntime = fixture(nonIndexed);
assert.equal(apply(indexedRuntime, direction, 100), 0);
assert.equal(indexedRuntime._pmndrsSunOcclusionTargets[0].triangleCount, 2);

// Use a raycast double only to verify the dense-geometry/BVH eligibility boundary.
const dense = mesh(); dense.geometry = new THREE.PlaneGeometry(4, 4, 200, 200);
let preciseCalls = 0;
dense.raycast = (_raycaster, hits) => { preciseCalls++; hits.push({ distance: 4 }); };
const denseRuntime = fixture(dense);
assert.equal(apply(denseRuntime, direction, 100), 1, 'Dense geometry without a BVH is skipped');
assert.equal(denseRuntime._pmndrsSunOcclusionTargets[0].triangleCount, 80000);
assert.equal(preciseCalls, 0);
dense.geometry.boundsTree = {};
now += 2500;
assert.equal(apply(denseRuntime, direction, 100), 0, 'BVH-marked geometry enables precise raycasts');
assert.equal(preciseCalls, 1);

for (const [distance, expected] of [[10.34, 0], [10.36, 1], [20, 1]]) {
    const node = mesh(); node.position.z = distance;
    assert.equal(apply(fixture(node), direction, 10), expected, 'Hits beyond 98.5% of far are ignored');
}
for (const [input, expected] of [[1, 10], [Infinity, 5200], [30000, 20000], ['120', 120]]) {
    const self = fixture(); apply(self, direction, input);
    assert.equal(self._pmndrsSunOcclusionRaycaster.far, expected);
}
const translated = fixture(mesh());
translated.el.camera.position.x = 10;
translated.el.camera.updateMatrixWorld(true);
assert.equal(apply(translated, direction, 100), 1, 'Ray originates at the camera world position');
assert.equal(apply(null, direction, 100), 1);
assert.equal(apply(fixture(mesh()), new THREE.Vector3(), 100), 1, 'Invalid direction remains unoccluded');
const missingCamera = fixture(mesh()); missingCamera.el.camera = null;
assert.equal(apply(missingCamera, direction, 100), 1);
const zeroFlare = fixture(); zeroFlare.pmndrsLensFlareEffect.intensity = 0;
apply(zeroFlare, direction, 100);
assert.equal(zeroFlare.pmndrsLensFlareEffect._vrodosBaseIntensity, 0.005, 'Existing zero-intensity default is preserved');
geometry.dispose(); nonIndexed.geometry.dispose(); dense.geometry.dispose();
materials.forEach(material => material.dispose());
const core = runtimeBuildChunks.find(chunk => chunk.id === 'core-runtime');
const index = core.sourceFiles.indexOf('assets/js/runtime/master/vrodos_sun_occlusion.js');
assert.ok(index >= 0 && index < core.sourceFiles.indexOf('assets/js/runtime/master/vrodos_quality_profiles.js'));
console.log('Scene sun occlusion, cache timing, blocker selection, and visibility handoff passed.');
