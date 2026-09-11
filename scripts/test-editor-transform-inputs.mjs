import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parse } from 'espree';
import { Object3D } from 'three';

// Execute actual input functions with controller/DOM boundaries replaced by small fakes.
const source = readFileSync(new URL('../assets/js/editor/ui/vrodos_property_controls.js', import.meta.url), 'utf8');
const names = new Set(['controllerDatGuiOnChange', '_addDragScrub', 'commitUndoTransformFromInput']);
const functions = parse(source, { ecmaVersion: 'latest' }).body
    .filter(node => node.type === 'FunctionDeclaration' && names.has(node.id.name));
assert.equal(functions.length, names.size);
let target = new Object3D();
let saves = 0;
let liveSyncs = 0;
const commands = [];
const controllers = Array.from({ length: 9 }, () => ({
    $input: {}, onChange(callback) { this.change = callback; }, onFinishChange(callback) { this.finish = callback; }
}));
const context = vm.createContext({
    _isDragScrubbing: false, dg_controller: controllers, gui_controls_funs: {},
    getSelectedTransformObject: () => target,
    syncLiveGuiTransformChange: () => liveSyncs++, syncAttachedProxyToObject() {},
    setEventListenerKeyPressControllerConstrained() {},
    VRODOS: { editor: { envir: { scene: { keepScaleAspectRatio: false } }, animate() {},
        undoManager: { isExecuting: false, add(command) { commands.push(command); } },
        TransformCommand: class { constructor(object, before, after) { Object.assign(this, { object, before, after }); } }
    }, api: { triggerAutoSave() { saves++; } } }
});
context.window = context;
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
assert.equal(liveSyncs, 1);
assert.equal(saves, 4, 'Scrubbing must not save on each intermediate value.');
target = null;
controllers[0].finish(3);
controllers[8].change(3);

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
console.log('Editor transform input tests passed.');
