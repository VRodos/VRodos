import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const source = readFileSync(resolve(root, 'assets/js/editor/vrodos_asset_editor_scripts.js'), 'utf8');
const listeners = new Map();
const fileInput = {
    files: [{ name: 'building.glb', size: 20 * 1024 * 1024, slice: (start, end) => ({ size: end - start }) }],
    value: 'building.glb'
};
const tokenInput = { value: '' };
const cancelButton = { hidden: true, disabled: true, classList: { toggle() {} } };
const label = { textContent: 'building.glb' };
const elements = {
    fileUploadInput: fileInput,
    assetImportUploadToken: tokenInput,
    assetUploadCancelBtn: cancelButton,
    fileUploadInputLabel: label
};
let sentChunks = 0;
let cancelledRequest = false;
let cleanupBody = '';

class FakeXHR {
    constructor() {
        this.handlers = new Map();
        this.upload = { addEventListener: (name, handler) => this.handlers.set(`upload:${name}`, handler) };
    }
    open() {}
    addEventListener(name, handler) { this.handlers.set(name, handler); }
    send() { sentChunks += 1; }
    abort() {
        cancelledRequest = true;
        this.handlers.get('abort')();
    }
}

class FakeFormData {
    append() {}
}

const VRODOS = { utils: { getAjaxUrl: () => '/admin-ajax.php' } };
const window = {
    VRODOS,
    XMLHttpRequest: FakeXHR,
    vrodosAssetEditorProjectId: 9,
    fetch: async (_url, options) => {
        cleanupBody = options.body;
        return { ok: true, json: async () => ({ success: true }) };
    },
    clearInterval() {}
};
const document = {
    getElementById: (id) => elements[id] || null,
    addEventListener: (name, handler) => listeners.set(name, handler)
};
const context = vm.createContext({ window, document, VRODOS, FormData: FakeFormData, URLSearchParams });
vm.runInContext(source, context, { filename: 'vrodos_asset_editor_scripts.js' });

const form = { querySelector: () => ({ value: 'valid-nonce' }) };
const upload = window.vrodos_upload_selected_model_in_chunks(form, { inspectZip: false });
assert.equal(sentChunks, 1, 'upload must start with one chunk');
assert.equal(cancelButton.hidden, false, 'Cancel must be available while the chunk transfers');
await vm.runInContext('vrodos_cancel_model_upload()', context);
assert.equal(await upload, false, 'cancelled upload must not continue to asset save');
assert.equal(sentChunks, 1, 'cancellation must prevent later chunks');
assert.equal(cancelledRequest, true, 'cancellation must abort the active request');
assert.equal(fileInput.value, '', 'cancelled model selection must reset');
assert.equal(tokenInput.value, '', 'cancelled upload must not leave a reusable token');
assert.equal(new URLSearchParams(cleanupBody).get('action'), 'vrodos_cancel_model_upload');
assert.equal(cancelButton.hidden, true, 'Cancel must hide after cancellation');

console.log('Asset upload cancellation test passed.');
