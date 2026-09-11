import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const source = readFileSync(resolve(root, 'assets/js/editor/ajax/vrodos_request_compile.js'), 'utf8');
const uiSource = readFileSync(resolve(root, 'assets/js/editor/ui/vrodos_ui_helpers.js'), 'utf8');
const requests = [];
const responses = [];
const servedStatuses = [];
const timers = [];
const progress = [];
const failures = [];
const stalledBuilds = [];
const links = [];
const consoleErrors = [];
let fakeNow = Date.UTC(2026, 8, 6, 11, 0, 0);
let started = 0;
let finished = 0;
let hidden = 0;
let statusMessage = '';
let saveFailures = 0;
let settingsSaveCount = 0;
let fullSceneSaveCount = 0;
let sceneSaveWait = Promise.resolve();
const saveOrder = [];

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
            profile: 'web-low',
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
            profile: 'web-medium',
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
            profile: 'web-high',
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
    api: {
        waitForLatestSceneSave() {
            saveOrder.push('wait-for-scene-save');
            return sceneSaveWait;
        },
        saveSceneSettings() {
            settingsSaveCount += 1;
            saveOrder.push('save-settings');
            return Promise.resolve({ success: true });
        },
        saveChanges() {
            fullSceneSaveCount += 1;
            return Promise.resolve({ success: true });
        }
    },
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
            showBuildStalled(state, message) { stalledBuilds.push({ state: structuredClone(state), message }); },
            showBuildProgress(state) { progress.push(structuredClone(state)); },
            showPrimaryExperienceLink(url) { links.push(url); },
            showSaveFailedMessage() { saveFailures += 1; },
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
    Date: { now: () => fakeNow },
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

assert.match(uiSource, /Running · \$\{percent\}%/, 'running build rows should show compact percentage progress');
assert.match(uiSource, /Queued · \$\{percent\}%/, 'queued build rows should show completed family progress without verbose details');

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
assert.equal(requests[0].params.get('runtimeMode'), 'single-player');
assert.equal(requests[0].params.get('vrRuntimeProfile'), 'desktop');
assert.equal(servedStatuses[0], 202, 'expected background work uses HTTP 202');
assert.equal(progress.at(-1).ready, 1);
assert.equal(progress.at(-1).percent, 48);
assert.equal(progress.at(-1).phase.step, 2);
assert.equal(progress.at(-1).profiles[1].message, 'Resizing textures');
assert.equal(progress.at(-1).profiles[1].step, 6);
assert.equal(timers.length, 1, 'pending work schedules one retry');

VRODOS.editor.envir.scene.aframeRuntimeMode = 'networked';
VRODOS.editor.envir.scene.aframeVrRuntimeProfile = 'headset';
timers.shift()();
await flushPromises();
assert.equal(servedStatuses[1], 200, 'the retry can complete with HTTP 200');
assert.equal(requests[1].params.get('runtimeMode'), 'single-player', 'a retry keeps the runtime mode captured when the build started');
assert.equal(requests[1].params.get('vrRuntimeProfile'), 'desktop', 'a retry keeps the target captured when the build started');
assert.equal(VRODOS.api.isCompileRunning(), false, 'successful compile clears the active build');
assert.equal(finished, 1, 'successful compile releases the build controls');
assert.equal(hidden, 1, 'successful compile hides the progress panel');
assert.equal(links.at(-1), 'http://localhost:8088/build/scene-89.html');
assert.equal(consoleErrors.length, 0, 'normal pending and successful responses do not log errors');
VRODOS.editor.envir.scene.aframeRuntimeMode = 'single-player';
VRODOS.editor.envir.scene.aframeVrRuntimeProfile = 'desktop';

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
assert.match(statusMessage, /Stopped waiting/);
assert.equal(requests.at(-1).action, 'vrodos_cancel_compile_action', 'cancel is persisted on the server');
staleRetry();
await flushPromises();
assert.equal(
    requests.filter((request) => request.action === 'vrodos_compile_action').length,
    compileRequestsBeforeCancel,
    'a canceled retry cannot restart the old build'
);

const cancellationRequestsBeforeStall = requests.filter((request) => request.action === 'vrodos_cancel_compile_action').length;
responses.push(response(202, pendingPayload));
VRODOS.api.compileScene(false, { skipSave: true });
await flushPromises();
assert.equal(VRODOS.api.isCompileRunning(), true, 'a new build starts normally before stall tracking');

fakeNow += 2 * 60 * 1000;
responses.push(response(202, pendingPayload));
timers.shift()();
await flushPromises();
assert.match(statusMessage, /taking longer than usual/i, 'two minutes without progress shows a slow-build warning');
assert.equal(VRODOS.api.isCompileRunning(), true, 'the slow-build warning does not stop healthy background work');

const progressedPayload = structuredClone(pendingPayload);
progressedPayload.percent = 62;
progressedPayload.profiles[1].step = 7;
progressedPayload.profiles[1].percent = 67;
progressedPayload.profiles[1].message = 'Writing optimized GLB';
fakeNow += 14 * 60 * 1000;
responses.push(response(202, progressedPayload));
timers.shift()();
await flushPromises();
assert.equal(VRODOS.api.isCompileRunning(), true, 'meaningful per-profile progress resets the stall timer');
assert.doesNotMatch(statusMessage, /taking longer than usual/i, 'progress clears the slow-build warning');

fakeNow += 14 * 60 * 1000;
responses.push(response(202, progressedPayload));
timers.shift()();
await flushPromises();
assert.equal(VRODOS.api.isCompileRunning(), true, 'the client keeps polling before the no-progress deadline');
assert.match(statusMessage, /taking longer than usual/i, 'the warning returns when progress stops again');

fakeNow += 60 * 1000;
responses.push(response(202, progressedPayload));
timers.shift()();
await flushPromises();
assert.equal(VRODOS.api.isCompileRunning(), false, 'fifteen minutes without meaningful progress stops client polling');
assert.equal(stalledBuilds.length, 1, 'the stalled build gets a dedicated actionable UI state');
assert.match(stalledBuilds[0].message, /Retry the build/);
assert.equal(
    requests.filter((request) => request.action === 'vrodos_cancel_compile_action').length,
    cancellationRequestsBeforeStall,
    'auto-failing a stalled build must not cancel shared derivative work'
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
                profile: 'web-medium',
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

let releasePendingSceneSave;
sceneSaveWait = new Promise((resolvePromise) => {
    releasePendingSceneSave = resolvePromise;
});
const compileRequestsBeforeSettingsSave = requests.filter((request) => request.action === 'vrodos_compile_action').length;
responses.push(response(200, { CurrentSceneMasterClient: 'http://localhost:8088/build/scene-89-settings.html' }));
VRODOS.editor.envir.scene.aframeRuntimeMode = 'networked';
VRODOS.editor.envir.scene.aframeVrRuntimeProfile = 'headset';
VRODOS.api.compileScene(false);
await flushPromises();
assert.equal(settingsSaveCount, 0, 'build preflight waits for an already-running full scene save');
assert.equal(
    requests.filter((request) => request.action === 'vrodos_compile_action').length,
    compileRequestsBeforeSettingsSave,
    'compilation cannot start while the full scene save is pending'
);

VRODOS.editor.envir.scene.aframeRuntimeMode = 'single-player';
VRODOS.editor.envir.scene.aframeVrRuntimeProfile = 'desktop';
releasePendingSceneSave();
await flushPromises();
await flushPromises();
assert.equal(settingsSaveCount, 1, 'build preflight performs exactly one metadata-only settings save');
assert.deepEqual(saveOrder.slice(-2), ['wait-for-scene-save', 'save-settings']);
assert.equal(fullSceneSaveCount, 0, 'build preflight never invokes the full-scene save path');
assert.equal(
    requests.filter((request) => request.action === 'vrodos_compile_action').length,
    compileRequestsBeforeSettingsSave + 1,
    'compilation starts only after the metadata save succeeds'
);
const savedSettingsCompileRequest = requests.filter((request) => request.action === 'vrodos_compile_action').at(-1);
assert.equal(savedSettingsCompileRequest.params.get('runtimeMode'), 'networked', 'the build keeps the mode selected before its asynchronous save');
assert.equal(savedSettingsCompileRequest.params.get('vrRuntimeProfile'), 'headset', 'the build keeps the unsaved target selected before its asynchronous save');

const compileRequestsBeforeSaveFailure = requests.filter((request) => request.action === 'vrodos_compile_action').length;
sceneSaveWait = Promise.resolve();
VRODOS.api.saveSceneSettings = () => {
    settingsSaveCount += 1;
    return Promise.reject(new Error('settings save rejected'));
};
VRODOS.api.compileScene(false);
await flushPromises();
await flushPromises();
assert.equal(
    requests.filter((request) => request.action === 'vrodos_compile_action').length,
    compileRequestsBeforeSaveFailure,
    'a failed metadata save blocks compilation'
);
assert.equal(saveFailures, 1, 'a failed metadata save displays the save failure state');

console.log('Compile request lifecycle tests passed.');
