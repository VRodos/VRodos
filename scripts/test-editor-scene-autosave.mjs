import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const requests = [];
const timers = [];
let authored = { position: [0, 0, 0], scale: [1, 1, 1] };
const classes = new Set();
const saveButton = {
    innerHTML: 'Save Scene',
    classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name) },
    // The toolbar ignores clicks while the save control is disabled.
    click() { if (!classes.has('LinkDisabled')) context.VRODOS.api.saveChanges({ force: true }); }
};
const input = { value: '' };
const elements = {
    'save-scene-button': saveButton,
    compileGameBtn: { disabled: false },
    vrodos_scene_json_input: input,
    sceneTitleInput: { value: 'Terrain scene' }
};
const context = vm.createContext({
    URLSearchParams, console,
    setTimeout(callback) { timers.push(callback); },
    document: { getElementById: (id) => elements[id] },
    fetch(_url, options) {
        return new Promise((resolve) => requests.push({
            scene: JSON.parse(options.body.get('scene_json')),
            complete: () => resolve({ ok: true, text: async () => '{"success":true}' })
        }));
    },
    vrodos_data: { scene_mutation_nonce: 'test-nonce' },
    VRODOS: {
        api: {}, ui: {}, config: { sceneId: 6534 },
        editor: { envir: { isSceneLoading: false, scene: { dispatchEvent() {} } } },
        utils: { getAjaxUrl: () => '/ajax' }
    }
});
context.window = context;
vm.runInContext(readFileSync(new URL('../assets/js/editor/ajax/vrodos_save_scene_ajax.js', import.meta.url), 'utf8'), context);
const api = context.VRODOS.api;
api.writeCurrentSceneJsonToInput = () => { input.value = JSON.stringify(authored); return input.value; };
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };

api.triggerAutoSave();
assert.equal(requests.length, 1, 'the initial edit starts a save');
const saves = api.whenSceneSaveSettles();
authored = { position: [-30, 70, 0], scale: [20, 20, 20] };
api.triggerAutoSave();
assert.equal(requests.length, 1, 'edits during a save wait for the active request');
requests[0].complete();
await flush();
assert.equal(requests.length, 2, 'edits during a save must queue another request despite the disabled button');
assert.deepEqual(requests[1].scene, authored, 'the queued request contains the latest position and scale');
requests[1].complete();
await saves;

assert.ok(classes.has('LinkDisabled'), 'the saved notice still disables the button for two seconds');
authored.position = [-31, 70, 0];
api.triggerAutoSave();
assert.equal(requests.length, 3, 'edits during the saved notice must start a new save');
assert.deepEqual(requests[2].scene, authored);
requests[2].complete();
await api.whenSceneSaveSettles();

// Canvas transform commits must use the same queue as property-panel edits.
authored.position = [-32, 70, 0];
api.saveSceneEventHandler({ type: 'modificationPendingSave' });
api.saveSceneEventHandler({ type: 'mouseup' });
assert.equal(requests.length, 4, 'canvas edits bypass the disabled toolbar control too');
assert.deepEqual(requests[3].scene, authored);
requests[3].complete();
await api.whenSceneSaveSettles();
assert.equal(api.isSceneSavePending, false);
assert.equal(api.isSceneSaveQueued, false);
console.log('Editor scene autosave queue tests passed.');
