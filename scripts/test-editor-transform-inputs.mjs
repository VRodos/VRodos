import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parse } from 'espree';
import * as THREE from 'three';
const { Object3D } = THREE;

// Execute actual input functions with controller/DOM boundaries replaced by small fakes.
const source = readFileSync(new URL('../assets/js/editor/ui/vrodos_property_controls.js', import.meta.url), 'utf8');
const names = new Set(['controllerDatGuiOnChange', '_addDragScrub', 'commitUndoTransformFromInput', 'syncLiveGuiTransformChange']);
const functions = parse(source, { ecmaVersion: 'latest' }).body
    .filter(node => node.type === 'FunctionDeclaration' && names.has(node.id.name));
assert.equal(functions.length, names.size);
let target = new Object3D();
let saves = 0;
let liveSyncs = 0;
let invalidations = 0;
let lightSyncs = 0;
const commands = [];
const controllers = Array.from({ length: 9 }, () => ({
    $input: {}, onChange(callback) { this.change = callback; }, onFinishChange(callback) { this.finish = callback; }
}));
const context = vm.createContext({
    THREE,
    _isDragScrubbing: false, dg_controller: controllers, gui_controls_funs: {},
    getSelectedTransformObject: () => target,
    syncAttachedProxyToObject() {},
    setEventListenerKeyPressControllerConstrained() {},
    VRODOS: { editor: { envir: { scene: { keepScaleAspectRatio: false } }, animate() {},
        requestRender() { liveSyncs++; },
        sceneRegistry: { invalidateBounds() { invalidations++; } },
        undoManager: { isExecuting: false, add(command) { commands.push(command); } },
        TransformCommand: class { constructor(object, before, after) { Object.assign(this, { object, before, after }); } }
    }, utils: { syncEditorLightArtifacts() { lightSyncs++; } }, api: { triggerAutoSave() { saves++; } } }
});
context.window = context;
vm.runInContext(readFileSync(new URL('../assets/js/editor/scene/vrodos_scene_transforms.js', import.meta.url), 'utf8'), context);
for (const node of functions) vm.runInContext(source.slice(node.start, node.end), context);
context.controllerDatGuiOnChange();
controllers[0].change(9);
assert.equal(target.position.x, 0, 'Keyboard changes wait for commit.');
controllers[0].finish('2.5');
assert.equal(target.position.x, 2.5);
controllers[4].finish(180);
assert.equal(target.rotation.y, Math.PI);
controllers[8].finish(3);
assert.deepEqual(target.scale.toArray(), [1, 1, 3]);
context.VRODOS.editor.envir.scene.keepScaleAspectRatio = true;
controllers[6].finish(2);
assert.deepEqual(target.scale.toArray(), [2, 2, 2]);
context._isDragScrubbing = true;
controllers[2].change(7);
assert.equal(target.position.z, 7);
assert.equal(liveSyncs, 5);
assert.equal(invalidations, 5, 'Every edit must invalidate cached bounds, even without an attached proxy.');
assert.equal(lightSyncs, 5, 'Every edit must synchronize light artifacts once.');
assert.equal(saves, 4, 'Scrubbing must not save on each intermediate value.');
target = null;
controllers[0].finish(3);
controllers[8].change(3);
assert.equal(saves, 4, 'Absent selections must not schedule a save.');

target = new Object3D();
const events = {};
const input = { style: {}, dataset: {}, addEventListener(type, fn) { events[type] = fn; } };
context._addDragScrub({ $input: input, property: 'dg_t1' });
events.focus(); // Keyboard Tab focus has no pointerdown.
target.position.x = 5;
events.blur();
assert.equal(commands.length, 1, 'Keyboard-only focus must capture undo.');
assert.equal(commands[0].before.pos.x, 0);
assert.equal(commands[0].after.pos.x, 5);
assert.equal(input._oldTRS, undefined);
assert.equal(context.vrodosGuiKeyboardEditing, 0);
// A click/focus followed by a drag must work for all transform groups.
for (const [index, property, amount] of [[0, 'dg_t1', 0.4], [3, 'dg_r1', 0.4], [6, 'dg_s1', 0.2]]) {
    target = new Object3D();
    context.VRODOS.editor.envir.scene.keepScaleAspectRatio = false;
    context._isDragScrubbing = false;
    const handlers = {};
    let value = index === 6 ? 1 : 0;
    const field = { style: {}, dataset: {},
        addEventListener(type, callback) { handlers[type] = callback; },
        focus() { handlers.focus(); }, select() {},
        blur() { handlers.blur(); }, setPointerCapture() {}, releasePointerCapture() {}
    };
    context._addDragScrub({ $input: field, property, getValue: () => value,
        setValue(next) { value = next; controllers[index].change(next); }
    });
    field.focus();
    const beforeCommands = commands.length;
    const beforeSaves = saves;
    handlers.pointerdown({ button: 0, clientX: 100, pointerId: 1, preventDefault() {} });
    handlers.pointermove({ clientX: 140 });
    assert.equal(saves, beforeSaves, 'A scrub must not save intermediate values.');
    handlers.pointerup({ pointerId: 1 });
    const actual = index === 0 ? target.position.x : index === 3 ? target.rotation.x * 180 / Math.PI : target.scale.x - 1;
    assert(Math.abs(actual - amount) < 1e-9, `${property}: focused input must scrub the object.`);
    assert.equal(commands.length, beforeCommands + 1, 'A scrub must capture one undo command.');
    assert.equal(saves, beforeSaves + 1, 'A scrub must save once on release.');
    assert.equal(context.vrodosGuiKeyboardEditing, 0);
    assert.equal(context._isDragScrubbing, false);
}
console.log('Editor transform input tests passed.');
