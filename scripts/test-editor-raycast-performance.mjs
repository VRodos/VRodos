import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import * as bvh from 'three-mesh-bvh';

const VRODOS = { editor: {}, loader: {} };
const context = vm.createContext({
    window: { VRODOS, VRODOS_COLLISION_BVH: bvh, VRODOSGlbLighting: { normalize() {} } },
    VRODOS, THREE, console
});
vm.runInContext(readFileSync(new URL('../assets/js/editor/loaders/vrodos_loader_glb_asset_cache.js', import.meta.url), 'utf8'), context);
const cache = VRODOS.loader.glbAssetCache;
const scene = new THREE.Group();
const geometry = new THREE.TorusGeometry(2, 0.45, 32, 96);
const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
const mesh = new THREE.Mesh(geometry, material);
mesh.name = 'static';
mesh.position.set(3, 1, -2);
mesh.rotation.set(0.2, 0.4, 0.1);
mesh.scale.set(1, 1.5, 0.8);
scene.add(mesh);
const skinned = new THREE.SkinnedMesh(geometry.clone(), material);
skinned.name = 'skin';
const morphed = new THREE.Mesh(geometry.clone(), material);
morphed.name = 'morph';
morphed.geometry.morphAttributes.position = [morphed.geometry.attributes.position.clone()];
const instanced = new THREE.InstancedMesh(geometry.clone(), material, 1);
instanced.name = 'instances';
const small = new THREE.Mesh(new THREE.BoxGeometry(), material);
small.name = 'small';
scene.add(skinned, morphed, instanced, small);
await cache.load('test.glb', () => ({ scene }));
const originalIndices = geometry.index.array.slice();
const sample = (target, localX, firstHitOnly = false) => {
    target.updateWorldMatrix(true, false);
    const origin = target.localToWorld(new THREE.Vector3(localX, 0, 5));
    const end = target.localToWorld(new THREE.Vector3(localX, 0, 0));
    const ray = new THREE.Raycaster(origin, end.sub(origin).normalize());
    ray.firstHitOnly = firstHitOnly;
    return ray.intersectObject(target);
};
const before = sample(mesh, 2);
assert.ok(before.length > 1, 'Fixture must cross multiple surfaces');
const first = cache.instantiate('test.glb').scene;
const accelerated = first.getObjectByName('static');
assert.equal(accelerated.raycast, bvh.acceleratedRaycast);
assert.ok(geometry.boundsTree);
assert.deepEqual(geometry.index.array, originalIndices, 'BVH must preserve authored face and material order');
const after = sample(accelerated, 2);
assert.equal(after.length, before.length, 'Picking retains every hit for selection cycling');
after.forEach((hit, index) => {
    assert.equal(hit.faceIndex, before[index].faceIndex);
    assert.ok(Math.abs(hit.distance - before[index].distance) < 1e-8);
    assert.ok(hit.uv.distanceTo(before[index].uv) < 1e-8);
});
assert.equal(sample(accelerated, 0).length, 0, 'Holes remain unselectable');
const nearest = sample(accelerated, 2, true);
assert.equal(nearest.length, 1, 'Ground probes request only the nearest hit per mesh');
assert.ok(Math.abs(nearest[0].distance - before[0].distance) < 1e-8);
const tree = geometry.boundsTree;
const second = cache.instantiate('test.glb').scene.getObjectByName('static');
assert.equal(second.geometry.boundsTree, tree, 'Placements reuse one tree');
assert.equal(second.raycast, bvh.acceleratedRaycast, 'Cloned meshes receive accelerated raycasts');
for (const name of ['skin', 'morph', 'instances', 'small']) {
    assert.ok(!first.getObjectByName(name).geometry.boundsTree, `${name} must not receive a static tree`);
}
const externalGeometry = geometry.clone();
bvh.computeBoundsTree.call(externalGeometry, { indirect: true });
const externalTree = externalGeometry.boundsTree;
await cache.load('external.glb', () => ({ scene: new THREE.Mesh(externalGeometry, material) }));
cache.instantiate('external.glb');
cache.clear();
assert.equal(geometry.boundsTree, null, 'Cache disposal releases owned trees');
assert.equal(externalGeometry.boundsTree, externalTree, 'Cache must not release a tree owned elsewhere');
assert.equal(cache.snapshot().entries, 0);
console.log('Editor BVH precise picking, ground probe, shared geometry, deformation and disposal tests passed.');
