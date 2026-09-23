import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import * as THREE from 'three';

const root = resolve(import.meta.dirname, '..');
const components = new Map();
const context = {
    AFRAME: {
        THREE,
        registerComponent(name, definition) { components.set(name, definition); }
    }
};
context.window = context;
for (const file of [
    'assets/js/runtime/master/vrodos_runtime_resources.js',
    'assets/js/runtime/master/vrodos_model_origin.js',
    'assets/js/runtime/master/components/vrodos_glb_animation.component.js'
]) {
    vm.runInNewContext(readFileSync(resolve(root, file), 'utf8'), context, { filename: file });
}

const firstClip = new THREE.AnimationClip('idle', 1, [
    new THREE.NumberKeyframeTrack('.position[x]', [0, 1], [0, 10])
]);
const secondClip = new THREE.AnimationClip('wave', 1, [
    new THREE.NumberKeyframeTrack('.position[y]', [0, 1], [0, 10])
]);

function model(clips = [firstClip, secondClip]) {
    const result = new THREE.Group();
    result.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()));
    result.animations = clips;
    return result;
}

function entity(initialModel = null) {
    const listeners = new Map();
    const el = {
        components: { 'gltf-model': { model: initialModel } },
        addEventListener(type, callback) {
            if (!listeners.has(type)) listeners.set(type, new Set());
            listeners.get(type).add(callback);
        },
        removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
        emit(type, detail = {}) {
            for (const callback of listeners.get(type) || []) callback({ type, target: el, detail });
        },
        listeners
    };
    const component = { ...components.get('vrodos-glb-animation'), el };
    component.init();
    return { el, component };
}

const centeredModel = model();
const centered = context.VRODOSModelOrigin.createOffsetRoot(centeredModel, 'bounds-center');
assert.equal(centered.applied, true);
assert.notEqual(centered.root, centeredModel);
const first = entity(centeredModel);
assert.equal(first.component.mixer.getRoot(), centeredModel, 'the mixer must target the loaded model inside its origin wrapper');
first.component.tick(0, 250);
assert.ok(Math.abs(centeredModel.position.x - 2.5) < 0.000001, 'the first embedded clip moves the bounds-centered model');
assert.equal(centeredModel.position.y, 0, 'the second clip must not play');
first.component.tick(0, 1000);
assert.ok(Math.abs(centeredModel.position.x - 2.5) < 0.000001, 'the selected clip loops indefinitely');

const secondModel = model();
const second = entity();
assert.equal(second.component.mixer, null, 'lazy placements start without a mixer');
second.el.components['gltf-model'].model = secondModel;
second.el.emit('model-loaded', { model: secondModel });
second.component.tick(0, 500);
assert.ok(Math.abs(secondModel.position.x - 5) < 0.000001, 'the lazy placement starts after its model loads');
assert.ok(Math.abs(centeredModel.position.x - 2.5) < 0.000001, 'placements keep independent mixer clocks');
const mixer = second.component.mixer;
second.el.emit('model-loaded', { model: secondModel });
assert.equal(second.component.mixer, mixer, 'duplicate load events must not restart a model');

const replacement = model();
second.el.components['gltf-model'].model = replacement;
second.el.emit('model-loaded', { model: replacement });
assert.equal(mixer.existingAction(firstClip, secondModel), null, 'replacing a model releases its old mixer bindings');
const stoppedPosition = secondModel.position.x;
second.component.tick(0, 100);
assert.ok(replacement.position.x > 0, 'the replacement model animates');
assert.equal(secondModel.position.x, stoppedPosition, 'the replaced model stops');

second.el.components['gltf-model'].model = null;
second.component.tick(0, 100);
assert.equal(second.component.mixer, null, 'source changes stop detached models while loading');
second.el.components['gltf-model'].model = replacement;
second.el.emit('model-loaded', { model: replacement });
second.el.emit('model-error');
assert.equal(second.component.mixer, null, 'model errors release the active mixer');

const staticModel = model([]);
const staticPlacement = entity(staticModel);
assert.equal(staticPlacement.component.mixer, null, 'models without clips stay idle');

first.component.remove();
second.component.remove();
staticPlacement.component.remove();
assert.equal(first.component.mixer, null, 'component removal releases its mixer');
assert.equal(first.el.listeners.get('model-loaded').size, 0, 'component removal releases model listeners');
assert.equal(second.el.listeners.get('model-error').size, 0, 'component removal releases error listeners');

console.log('Compiled GLB animation tests passed.');
