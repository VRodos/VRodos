import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "assets/js/editor/ajax/vrodos_request_compile.js"), "utf8");
const requests = [];
const timers = [];
const progress = [];
let started = 0;
let finished = 0;
let hidden = 0;
let statusMessage = "";

class TestAbortController {
    constructor() {
        this.signal = {};
        this.aborted = false;
    }

    abort() {
        this.aborted = true;
    }
}

const statusElement = { textContent: "" };
const VRODOS = {
    api: {},
    config: { projectId: "85", sceneId: "86", compileNonce: "test-nonce", isAdmin: "front" },
    data: {},
    editor: { envir: { scene: { aframeRuntimeMode: "single-player", aframeVrRuntimeProfile: "desktop" } } },
    ui: {
        compileDialogState: {
            finishBuildState() { finished += 1; },
            getElement() { return null; },
            hideBuildProgress() { hidden += 1; },
            setStatusMessage(_icon, message) { statusMessage = message; },
            showBuildProgress(ready, total, message) { progress.push({ ready, total, message }); },
            showPrimaryExperienceLink() {},
            showSaveFailedMessage() {},
            showSavePendingMessage() {},
            showStartedState() { started += 1; }
        }
    },
    utils: { getAjaxUrl: () => "/wp-admin/admin-ajax.php" }
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
    console: { log() {}, warn() {} },
    document: { getElementById: () => statusElement },
    fetch(_url, options) {
        const params = new URLSearchParams(options.body);
        const action = params.get("action");
        requests.push({ action, params, options });
        if (action === "vrodos_cancel_compile_action") {
            return Promise.resolve({ ok: true, status: 200, text: async () => JSON.stringify({ success: true }) });
        }
        return Promise.resolve({
            ok: false,
            status: 409,
            text: async () => JSON.stringify({
                success: false,
                data: { message: "Preparing desktop profile assets (2/6 ready).", pending: true, ready: 2, total: 6, retryAfterMs: 3000 }
            })
        });
    },
    window: windowObject
});
windowObject.window = windowObject;

vm.runInContext(source, context, { filename: "vrodos_request_compile.js" });
VRODOS.api.compileScene(false, { skipSave: true });
await new Promise((resolvePromise) => setImmediate(resolvePromise));

assert.equal(VRODOS.api.isCompileRunning(), true, "compile remains active while derivative work is pending");
assert.equal(started, 1, "the build UI enters its running state once");
assert.equal(requests[0].action, "vrodos_compile_action", "the first request starts the build");
assert.match(requests[0].params.get("buildId"), /^[a-f0-9]{32}$/);
assert.deepEqual(progress.at(-1), { ready: 2, total: 6, message: "Preparing desktop profile assets (2/6 ready)." });
assert.equal(timers.length, 1, "pending work schedules one retry");

assert.equal(VRODOS.api.restoreCompileUi(), true, "an active build can restore the dialog state");
assert.equal(started, 2, "restoring the dialog reapplies the running controls");

await VRODOS.api.cancelCompile();
assert.equal(VRODOS.api.isCompileRunning(), false, "cancel clears the active build");
assert.equal(finished, 1, "cancel releases the build controls");
assert.equal(hidden, 1, "cancel hides the progress panel");
assert.match(statusMessage, /Build canceled/);
assert.equal(requests[1].action, "vrodos_cancel_compile_action", "cancel is persisted on the server");
assert.equal(requests[1].params.get("buildId"), requests[0].params.get("buildId"));

timers[0]();
await new Promise((resolvePromise) => setImmediate(resolvePromise));
assert.equal(requests.filter((request) => request.action === "vrodos_compile_action").length, 1, "a canceled retry cannot restart the old build");

console.log("Compile request lifecycle tests passed.");
