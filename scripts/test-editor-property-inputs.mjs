import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parse } from 'espree';
import * as THREE from 'three';

const scene = new THREE.Scene();
const light = new THREE.SpotLight();
light.name = 'test-lamp';
light.category_name = 'lightLamp';
scene.add(light);
let selected = light;
let saves = 0;
const inputs = new Map();
for (const id of ['lampPower', 'lampRadius', 'ambientColor', 'spotTargetObject', 'poi_chat_title']) {
    const handlers = {};
    inputs.set(id, { value: '', addEventListener(type, callback) { handlers[type] = callback; },
        fire(type, value) { if (value !== undefined) this.value = value; handlers[type]?.call(this); } });
}
const context = vm.createContext({ THREE, console,
    document: { readyState: 'loading', addEventListener() {}, getElementById: id => inputs.get(id) || null },
    vrodosPersistentPropertyListenersBound: false,
    getSelectedPropertyTarget: () => selected,
    getEditorSceneObjectByName: name => scene.getObjectByName(name),
    VRODOS: { editor: { envir: { scene }, requestRender() {}, animate() {},
        sceneRegistry: { get: id => scene.getObjectByProperty('uuid', id) } },
    utils: {}, ui: {}, loader: { refreshPrimitivePlaneProperty() {} },
    api: { saveChanges() { saves++; }, triggerAutoSave() { saves++; } } }
});
context.window = context;
const read = path => readFileSync(new URL(`../assets/js/editor/${path}`, import.meta.url), 'utf8');
vm.runInContext(read('scene/vrodos_scene_light_artifacts.js'), context);
vm.runInContext(read('scene/vrodos_undo_engine.js'), context);
const source = read('ui/vrodos_property_controls.js');
const names = new Set(['initPersistentPropertyListeners', '_getEditorInput', '_bindEditorInputChange',
    '_bindTrackedEditorInputChange', '_getLightShadowRadius', '_getFirstChildMaterialColorHex',
    '_getObjectColorHex', 'sanitizeInputValue']);
for (const node of parse(source, { ecmaVersion: 'latest' }).body) {
    if (node.type === 'FunctionDeclaration' && names.has(node.id.name)) {
        vm.runInContext(source.slice(node.start, node.end), context);
    }
}
context.initPersistentPropertyListeners();
const power = inputs.get('lampPower');
const initialPower = light.power;
power.fire('focus');
power.fire('input', '25');
power.fire('input', '50');
assert.equal(light.power, 50);
assert.equal(saves, 0, 'Live previews must not save.');
power.fire('change');
assert.equal(saves, 1);
const manager = context.VRODOS.editor.undoManager;
assert.equal(manager.undoStack.length, 1);
manager.undo();
assert.equal(light.power, initialPower);
manager.redo();
assert.equal(light.power, 50);
power.fire('change');
assert.equal(saves, 3, 'Repeated unchanged commit must not save or capture undo.');
const radius = inputs.get('lampRadius');
const originalRadius = light.shadow.radius;
radius.fire('focus');
radius.fire('input', '4');
radius.fire('change');
assert.equal(light.shadow.radius, 4);
manager.undo();
assert.equal(light.shadow.radius, originalRadius, 'Undo must restore the actual shadow object.');
manager.redo();
assert.equal(light.shadow.radius, 4);
const color = inputs.get('ambientColor');
color.fire('focus');
color.fire('input', '#ff0000');
color.fire('change');
assert.equal(light.color.getHexString(), 'ff0000');
manager.undo();
assert.equal(light.color.getHexString(), 'ffffff');
const originalTarget = light.target;
const newTarget = new THREE.Object3D();
newTarget.name = 'new-target';
scene.add(newTarget);
inputs.get('spotTargetObject').fire('change', newTarget.name);
assert.equal(light.target, newTarget);
manager.undo();
assert.equal(light.target, originalTarget, 'Undo must restore light targeting through the shared linker.');
manager.redo();
assert.equal(light.target, newTarget);
const other = new THREE.Object3D();
scene.add(other);
power.fire('focus');
selected = other;
power.fire('change', '999');
assert.equal(other.power, undefined, 'A stale focused input must not edit a different selection.');
inputs.get('poi_chat_title').fire('change', 'Discussion');
assert.equal(other.poi_chat_title, 'Discussion', 'Shared non-light property inputs must remain usable.');
selected = null;
power.fire('focus');
power.fire('change', '1');
console.log('Editor property preview, commit, and undo tests passed.');
