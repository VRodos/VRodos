import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import * as bvh from 'three-mesh-bvh';

let definition;
vm.runInNewContext(readFileSync(new URL('../assets/js/runtime/master/components/vrodos_selection_bvh.system.js', import.meta.url), 'utf8'), {
    AFRAME: { registerSystem(name, value) { definition = value; } },
    window: { VRODOS_COLLISION_BVH: bvh },
    console
});
const owner = Object.assign(Object.create(definition), {
    geometries: new Map(), meshes: new Map(), el: { removeEventListener() {} }
});
const geometry = new THREE.TorusGeometry(2, 0.45, 32, 96);
const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
const mesh = new THREE.Mesh(geometry, material);
mesh.position.set(3, 1, -2);
mesh.rotation.set(0.2, 0.4, 0.1);
mesh.scale.set(1, 1.5, 0.8);
mesh.updateMatrixWorld(true);
const originalIndex = geometry.index.array.slice();
const sample = (localX) => {
    const origin = mesh.localToWorld(new THREE.Vector3(localX, 0, 5));
    const end = mesh.localToWorld(new THREE.Vector3(localX, 0, 0));
    return new THREE.Raycaster(origin, end.sub(origin).normalize()).intersectObject(mesh);
};
const surfaceBefore = sample(2);
const holeBefore = sample(0);
assert.ok(surfaceBefore.length > 0);
assert.equal(holeBefore.length, 0);
owner.prepareMesh(mesh);
assert.ok(geometry.boundsTree, 'Detailed static selection geometry receives a BVH');
assert.deepEqual(geometry.index.array, originalIndex, 'Selection acceleration must not reorder geometry');
const surfaceAfter = sample(2);
assert.equal(surfaceAfter.length, surfaceBefore.length);
surfaceAfter.forEach((hit, index) => {
    assert.equal(hit.faceIndex, surfaceBefore[index].faceIndex);
    assert.ok(Math.abs(hit.distance - surfaceBefore[index].distance) < 1e-8);
    assert.ok(hit.uv.distanceTo(surfaceBefore[index].uv) < 1e-8);
});
assert.equal(sample(0).length, 0, 'Empty space inside a model must remain unselectable');

const sharedMesh = new THREE.Mesh(geometry, material);
owner.prepareMesh(sharedMesh);
assert.equal(owner.geometries.size, 1, 'Shared static geometry builds only one tree');
const existingGeometry = geometry.clone();
bvh.computeBoundsTree.call(existingGeometry, { indirect: true });
const existingTree = existingGeometry.boundsTree;
owner.prepareMesh(new THREE.Mesh(existingGeometry, material));

const skinned = new THREE.SkinnedMesh(geometry.clone(), material);
const morphed = new THREE.Mesh(geometry.clone(), material);
morphed.geometry.morphAttributes.position = [morphed.geometry.attributes.position.clone()];
owner.prepareMesh(skinned);
owner.prepareMesh(morphed);
assert.ok(!skinned.geometry.boundsTree, 'Never build a static tree for skinning');
assert.ok(!morphed.geometry.boundsTree, 'Never build a static tree for morph targets');
assert.ok(!owner.meshes.has(skinned) && !owner.meshes.has(morphed));

const laterRaycast = () => {};
sharedMesh.raycast = laterRaycast;
owner.remove();
assert.equal(geometry.boundsTree, null, 'Release owned trees');
assert.equal(existingGeometry.boundsTree, existingTree, 'Do not release another owner’s tree');
assert.equal(mesh.raycast, THREE.Mesh.prototype.raycast);
assert.equal(sharedMesh.raycast, laterRaycast, 'Do not overwrite a newer raycast owner');
console.log('Selection BVH precise-hit and ownership fixtures passed.');
