import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import * as THREE from 'three';
import { Document, NodeIO } from '@gltf-transform/core';
import { readSourceBounds } from './asset-source-bounds.mjs';

const directory = await mkdtemp(join(tmpdir(), 'vrodos-box-'));
try {
    const document = new Document();
    const buffer = document.createBuffer();
    const positions = document.createAccessor().setType('VEC3').setBuffer(buffer)
        .setArray(new Float32Array([-1, -2, -3, 1, 2, 3, 0, 0, 0]));
    const primitive = document.createPrimitive().setAttribute('POSITION', positions);
    const node = document.createNode().setMesh(document.createMesh().addPrimitive(primitive))
        .setTranslation([10, 5, -3]).setScale([2, 3, 4]);
    document.createScene().addChild(node);
    const path = join(directory, 'source.glb');
    await new NodeIO().write(path, document);
    const bounds = await readSourceBounds(path);
    assert.deepEqual(bounds, { min: [8, -1, -15], max: [12, 11, 9], center: [10, 5, -3] });
} finally {
    await rm(directory, { recursive: true, force: true });
}

const components = {};
const context = vm.createContext({ THREE, console, window: {}, AFRAME: { registerComponent: (name, value) => { components[name] = value; } } });
vm.runInContext(await readFile(new URL('../assets/js/runtime/master/vrodos_runtime_resources.js', import.meta.url), 'utf8'), context);
vm.runInContext(await readFile(new URL('../assets/js/runtime/master/components/vrodos_navigation.component.js', import.meta.url), 'utf8'), context);
const world = new THREE.Group();
const placement = new THREE.Group();
world.add(placement);
placement.position.set(13, 4, -9);
placement.rotation.set(0.3, 0.7, -0.2);
placement.scale.set(2, 0.5, 3);
const visual = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshBasicMaterial());
placement.add(visual);
const colliderRoot = new THREE.Group();
placement.add(colliderRoot);
let dirty = 0;
const movement = { bvhTargets: new Set(), markCollisionWorldDirty() { dirty++; } };
const element = {
    object3D: colliderRoot,
    sceneEl: { querySelector: () => ({ components: { 'custom-movement': movement } }) },
    setObject3D(name, mesh) { this.mesh = mesh; colliderRoot.add(mesh); },
    removeObject3D() { colliderRoot.remove(this.mesh); this.mesh = null; },
    getObject3D() { return this.mesh; }
};
const component = Object.assign({ el: element, data: { center: { x: 1, y: 2, z: 3 }, size: { x: 2, y: 4, z: 6 } } }, components['vrodos-box-collider']);
component.update();
assert.equal(component.box.visible, false);
assert.equal(component.box.geometry.index.count / 3, 12);
const collisionRoot = components['custom-movement'].getColliderRootObject(element);
assert.equal(collisionRoot, component.box);
assert.notEqual(collisionRoot, visual);
for (const xr of [false, true]) {
    world.position.set(xr ? -8 : 0, 0, xr ? 5 : 0);
    world.rotation.y = xr ? -1.2 : 0;
    world.updateMatrixWorld(true);
    const localSurface = new THREE.Vector3(2, 2, 3);
    const expectedSurface = placement.localToWorld(localSurface.clone());
    const origin = placement.localToWorld(new THREE.Vector3(5, 2, 3));
    const direction = expectedSurface.clone().sub(origin).normalize();
    const hits = new THREE.Raycaster(origin, direction).intersectObject(collisionRoot, true);
    assert(hits.length > 0, 'desktop and authored-world rays hit invisible box');
    assert(hits[0].point.distanceTo(expectedSurface) < 1e-5, 'rotated nonuniformly scaled face aligns');
}
let disposedGeometry = 0;
let disposedMaterial = 0;
component.box.geometry.addEventListener('dispose', () => disposedGeometry++);
component.box.material.addEventListener('dispose', () => disposedMaterial++);
component.remove();
assert.equal(disposedGeometry, 1);
assert.equal(disposedMaterial, 1);
assert.equal(colliderRoot.children.length, 0);
assert(dirty >= 2);
component.remove();
assert.equal(disposedGeometry, 1);
console.log('Decoration source bounds, transformed collision registration and lifecycle tests passed.');
