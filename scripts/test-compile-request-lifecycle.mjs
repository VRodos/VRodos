import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const source = readFileSync(resolve(root, 'assets/js/editor/ajax/vrodos_request_compile.js'), 'utf8');
const requests = [];
const responses = [];
const servedStatuses = [];
const timers = [];
const progress = [];
const failures = [];
const links = [];
const consoleErrors = [];
let started = 0;
let finished = 0;
let hidden = 0;
let statusMessage = '';

class TestAbortController {
    constructor() {
        this.signal = {};
        this.aborted = false;
    }

    abort() {
        this.aborted = true;
    }
}

function response(status, payload) {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => JSON.stringify(payload)
    };
}

function flushPromises() {
    return new Promise((resolvePromise) => setImmediate(resolvePromise));
}

const pendingPayload = {
    status: 'pending',
    pending: true,
    code: 'vrodos_desktop_profiles_pending',
    message: 'Preparing desktop profile assets (1/3 ready).',
    phase: { key: 'asset-optimization', step: 2, totalSteps: 3, label: 'Preparing desktop assets' },
    ready: 1,
    total: 3,
    percent: 48,
    profiles: [
        {
            assetId: 90,
            assetLabel: 'Ancient Ruined Template',
            profile: 'desktop-low',
            profileLabel: 'Low',
            status: 'ready',
            step: 9,
            totalSteps: 9,
            percent: 100,
            message: 'Ready',
            updatedAt: '2026-09-06T11:15:04.000Z'
        },
        {
            assetId: 90,
            assetLabel: 'Ancient Ruined Template',
            profile: 'desktop-medium',
            profileLabel: 'Medium',
            status: 'running',
            step: 6,
            totalSteps: 9,
            percent: 56,
            message: 'Resizing textures',
            updatedAt: '2026-09-06T11:16:00.000Z'
        },
        {
            assetId: 90,
            assetLabel: 'Ancient Ruined Template',
            profile: 'desktop-high',
            profileLabel: 'High',
            status: 'queued',
            step: 0,
            totalSteps: 5,
            percent: 0,
            message: 'Desktop profile derivative is queued.',
            updatedAt: '2026-09-06T11:14:28.000Z'
        }
    ],
    retryAfterMs: 3000
};

const VRODOS = {
    api: {},
    config: { projectId: '88', sceneId: '89', compileNonce: 'test-nonce', isAdmin: 'front' },
    data: {},
    editor: { envir: { scene: { aframeRuntimeMode: 'single-player', aframeVrRuntimeProfile: 'desktop' } } },
    ui: {
        compileDialogState: {
            finishBuildState() { finished += 1; },
            getElement() { return null; },
            hideBuildProgress() { hidden += 1; },
            setStatusMessage(_icon, message) { statusMessage = message; },
            showBuildFailure(state, message) { failures.push({ state: structuredClone(state), message }); },
            showBuildProgress(state) { progress.push(structuredClone(state)); },
            showPrimaryExperienceLink(url) { links.push(url); },
            showSaveFailedMessage() {},
            showSavePendingMessage() {},
            showStartedState() { started += 1; }
        }
    },
    utils: { getAjaxUrl: () => '/wp-admin/admin-ajax.php' }
};

const windowObject = {
    AbortController: TestAbortController,
    VRODOS,
    crypto: {
        getRandomValues(bytes) {
            bytes.forEach((_value, index) => { bytes[index] = index + 1; });
            return bytes;
        }
    },
    setTimeout(callback) {
        timers.push(callback);
        return timers.length;
    },
    clearTimeout() {}
};

const context = vm.createContext({
    Array,
    Boolean,
    Error,
    Math,
    Number,
    Promise,
    String,
    Uint8Array,
    URLSearchParams,
    VRODOS,
    console: {
        error(...args) { consoleErrors.push(args); },
        log() {},
        warn() {}
    },
    fetch(_url, options) {
        const params = new URLSearchParams(options.body);
        const action = params.get('action');
        requests.push({ action, params, options });
        if (action === 'vrodos_cancel_compile_action') {
            servedStatuses.push(200);
            return Promise.resolve(response(200, { success: true }));
        }
        const next = responses.shift();
        assert(next, 'test did not queue a compile response');
        servedStatuses.push(next.status);
        return Promise.resolve(next);
    },
    structuredClone,
    window: windowObject
});
windowObject.window = windowObject;

vm.runInContext(source, context, { filename: 'vrodos_request_compile.js' });

responses.push(
    response(202, pendingPayload),
    response(200, { CurrentSceneMasterClient: 'http://localhost:8088/build/scene-89.html' })
);
VRODOS.api.compileScene(false, { skipSave: true });
await flushPromises();

assert.equal(VRODOS.api.isCompileRunning(), true, 'compile remains active while derivative work is pending');
assert.equal(started, 1, 'the build UI enters its running state once');
assert.equal(requests[0].action, 'vrodos_compile_action', 'the first request starts the build');
assert.match(requests[0].params.get('buildId'), /^[a-f0-9]{32}$/);
assert.equal(servedStatuses[0], 202, 'expected background work uses HTTP 202');
assert.equal(progress.at(-1).ready, 1);
assert.equal(progress.at(-1).percent, 48);
assert.equal(progress.at(-1).phase.step, 2);
assert.equal(progress.at(-1).profiles[1].message, 'Resizing textures');
assert.equal(progress.at(-1).profiles[1].step, 6);
assert.equal(timers.length, 1, 'pending work schedules one retry');

timers.shift()();
await flushPromises();
assert.equal(servedStatuses[1], 200, 'the retry can complete with HTTP 200');
assert.equal(VRODOS.api.isCompileRunning(), false, 'successful compile clears the active build');
assert.equal(finished, 1, 'successful compile releases the build controls');
assert.equal(hidden, 1, 'successful compile hides the progress panel');
assert.equal(links.at(-1), 'http://localhost:8088/build/scene-89.html');
assert.equal(consoleErrors.length, 0, 'normal pending and successful responses do not log errors');

responses.push(response(202, pendingPayload));
VRODOS.api.compileScene(false, { skipSave: true });
await flushPromises();
assert.equal(VRODOS.api.restoreCompileUi(), true, 'an active build can restore its detailed progress');
assert.equal(started, 3, 'restoring the dialog reapplies the running controls');
const compileRequestsBeforeCancel = requests.filter((request) => request.action === 'vrodos_compile_action').length;
const staleRetry = timers.shift();
await VRODOS.api.cancelCompile();
assert.equal(VRODOS.api.isCompileRunning(), false, 'cancel clears the active build');
assert.equal(hidden, 2, 'cancel hides the progress panel');
assert.match(statusMessage, /Build canceled/);
assert.equal(requests.at(-1).action, 'vrodos_cancel_compile_action', 'cancel is persisted on the server');
staleRetry();
await flushPromises();
assert.equal(
    requests.filter((request) => request.action === 'vrodos_compile_action').length,
    compileRequestsBeforeCancel,
    'a canceled retry cannot restart the old build'
);

responses.push(response(500, {
    success: false,
    data: {
        code: 'vrodos_desktop_profiles_failed',
        message: 'KTX-Software is unavailable.',
        ready: 1,
        total: 3,
        percent: 34,
        profiles: [
            {
                assetId: 90,
                assetLabel: 'Ancient Ruined Template',
                profile: 'desktop-medium',
                profileLabel: 'Medium',
                status: 'failed',
                step: 6,
                totalSteps: 9,
                percent: 56,
                message: 'KTX-Software is unavailable.'
            }
        ]
    }
}));
VRODOS.api.compileScene(false, { skipSave: true });
await flushPromises();
assert.equal(VRODOS.api.isCompileRunning(), false, 'a genuine failure clears the active build');
assert.equal(failures.length, 1, 'a genuine failure remains visible in the progress UI');
assert.equal(failures[0].state.profiles[0].status, 'failed');
assert.match(failures[0].message, /KTX-Software/);
assert.equal(consoleErrors.length, 1, 'only a genuine failure is logged as an error');

console.log('Compile request lifecycle tests passed.');
