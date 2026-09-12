import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import * as THREE from 'three';

const root = resolve(import.meta.dirname, '..');

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Model origin test failed: ${message}`);
  }
}

function nearlyEqual(actual, expected, tolerance = 0.000001) {
  return Math.abs(actual - expected) <= tolerance;
}

const context = { THREE };
context.window = context;
vm.runInNewContext(
  readFileSync(resolve(root, 'assets/js/runtime/master/vrodos_model_origin.js'), 'utf8'),
  context,
  { filename: 'vrodos_model_origin.js' }
);

const origin = context.VRODOSModelOrigin;
assert(origin.MODE_BOUNDS_CENTER === 'bounds-center', 'the bounds-center mode must be public');

const content = new THREE.Group();
content.position.set(8, -3, 12);
const nested = new THREE.Group();
nested.position.set(2, 5, -4);
nested.add(new THREE.Mesh(new THREE.BoxGeometry(2, 4, 6), new THREE.MeshBasicMaterial()));
content.add(nested);

const centered = origin.createOffsetRoot(content, 'bounds-center');
assert(centered.applied && centered.root !== content, 'marked content must receive an offset wrapper');
assert(nearlyEqual(centered.center.x, 10), 'the nested X center must be calculated');
assert(nearlyEqual(centered.center.y, 2), 'the nested Y center must be calculated');
assert(nearlyEqual(centered.center.z, 8), 'the nested Z center must be calculated');
assert(content.position.equals(new THREE.Vector3(8, -3, 12)), 'the imported content transform must remain unchanged');

const finalBounds = new THREE.Box3().setFromObject(centered.root);
const finalCenter = finalBounds.getCenter(new THREE.Vector3());
assert(finalCenter.length() <= 0.000001, 'the wrapped model bounds must be centered at 0,0,0');

const asymmetricGeometry = new THREE.BufferGeometry();
asymmetricGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
  0, 0, 0,
  2, 0, 0,
  0, 1, 0
], 3));
const asymmetricMesh = new THREE.Mesh(asymmetricGeometry, new THREE.MeshBasicMaterial());
asymmetricMesh.rotation.z = Math.PI / 4;
const exactCentered = origin.createOffsetRoot(asymmetricMesh, 'bounds-center');
assert(nearlyEqual(exactCentered.center.x, Math.SQRT1_2 / 2), 'the X center must use precise transformed geometry bounds');
assert(nearlyEqual(exactCentered.center.y, Math.SQRT1_2), 'the Y center must use precise transformed geometry bounds');
const exactFinalCenter = new THREE.Box3().setFromObject(exactCentered.root, true).getCenter(new THREE.Vector3());
assert(exactFinalCenter.length() <= 0.000001, 'asymmetric transformed geometry must be centered exactly');

const offsetBeforeRepeat = centered.root.position.clone();
const repeated = origin.createOffsetRoot(centered.root, 'bounds-center');
assert(repeated.applied && repeated.alreadyApplied, 'repeated application must be idempotent');
assert(repeated.root === centered.root && repeated.root.position.equals(offsetBeforeRepeat), 'idempotence must not add or move wrappers');

const legacy = new THREE.Group();
legacy.position.set(9, 8, 7);
const legacyResult = origin.createOffsetRoot(legacy, '');
assert(!legacyResult.applied && legacyResult.root === legacy && !legacy.parent, 'unmarked legacy content must remain untouched');

const empty = new THREE.Group();
const emptyParent = new THREE.Group();
emptyParent.add(empty);
const emptyResult = origin.createOffsetRoot(empty, 'bounds-center');
assert(!emptyResult.applied && emptyResult.root === empty && empty.parent === emptyParent, 'empty marked content must remain unchanged and attached');

const registeredComponents = {};
context.AFRAME = {
  THREE,
  registerComponent(name, definition) {
    registeredComponents[name] = definition;
  }
};
vm.runInNewContext(
  readFileSync(resolve(root, 'assets/js/runtime/master/components/vrodos_scene_loader.component.js'), 'utf8'),
  context,
  { filename: 'vrodos_scene_loader.component.js' }
);

const runtimeModel = new THREE.Group();
const runtimeMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial());
runtimeMesh.position.set(-6, 4, 9);
runtimeModel.add(runtimeMesh);
const runtimeEntityRoot = new THREE.Group();
runtimeEntityRoot.add(runtimeModel);
const listeners = new Map();
const runtimeElement = {
  getAttribute() { return null; },
  id: 'centered-runtime-model',
  object3D: runtimeEntityRoot,
  object3DMap: { mesh: runtimeModel },
  addEventListener(name, callback) {
    listeners.set(name, callback);
  },
  removeEventListener(name) {
    listeners.delete(name);
  },
  getObject3D(name) {
    return this.object3DMap[name] || null;
  },
  removeObject3D(name) {
    const object = this.object3DMap[name];
    if (object) this.object3D.remove(object);
    delete this.object3DMap[name];
  },
  setObject3D(name, object) {
    this.object3DMap[name] = object;
    this.object3D.add(object);
  },
  emit() {}
};
const runtimeComponent = {
  ...registeredComponents['vrodos-model-origin'],
  el: runtimeElement,
  data: 'bounds-center'
};
runtimeComponent.init();
runtimeComponent.update();
const runtimeOffset = runtimeElement.getObject3D('mesh');
assert(runtimeOffset !== runtimeModel && runtimeOffset.userData.vrodosModelOriginWrapper === true, 'the runtime component must wrap loaded marked GLBs');
const runtimeCenter = new THREE.Box3().setFromObject(runtimeOffset).getCenter(new THREE.Vector3());
assert(runtimeCenter.length() <= 0.000001, 'the runtime component must reproduce editor bounds centering');
runtimeComponent.applyOrigin();
assert(runtimeElement.getObject3D('mesh') === runtimeOffset, 'repeated runtime model events must not nest origin wrappers');
runtimeComponent.remove();
assert(!listeners.has('model-loaded'), 'the runtime component must clean up its model listener');

console.log('Model origin tests passed.');
