import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parse } from 'espree';
import { StatsCore } from '../node_modules/stats-gl/dist/core.js';

const definitions = {}, meters = [], warnings = [], calls = [];
let failure = '', debugDisabled = false;
const body = {
    children: new Set(),
    appendChild(node) { this.children.add(node); node.parentNode = this; },
    removeChild(node) { this.children.delete(node); node.parentNode = null; }
};
class Stats extends StatsCore {
    constructor(options) {
        super(options); this.options = options; this.disposals = 0; this.updates = 0;
        this.dom = { style: {}, remove() { if (this.parentNode) this.parentNode.removeChild(this); } };
        meters.push(this);
        if (failure === 'constructor') throw new Error('constructor');
    }
    init(renderer) {
        // Real locked stats-gl renderer patch, profiling, and disposal behavior.
        const result = super.init(renderer);
        if (failure === 'init') throw new Error('init');
        if (failure === 'async') return Promise.reject(new Error('async'));
        if (failure === 'no-dom') this.dom = null;
        return result;
    }
    showPanel(panel) { this.panel = panel; if (failure === 'panel') throw new Error('panel'); }
    update() { this.updates++; calls.push('stats'); }
    dispose() {
        this.disposals++; assert.equal(this.dom?.parentNode || null, null, 'detach before disposal');
        super.dispose();
        if (failure === 'dispose') throw new Error('dispose');
    }
}
const context = vm.createContext({ console: { warn: (...args) => warnings.push(args) }, Stats,
    document: { body, createElement: () => ({ style: {} }), getElementById: () => null, removeEventListener() {} },
    vrodosRuntimeDebugFlag: () => debugDisabled,
    AFRAME: { registerComponent: (name, def) => { definitions[name] = def; }, registerSystem() {} }
});
context.window = context; context.removeEventListener = () => {};
for (const file of ['vrodos_runtime_resources.js', 'components/vrodos_runtime_pipeline.component.js']) {
    vm.runInContext(readFileSync(new URL(`../assets/js/runtime/master/${file}`, import.meta.url), 'utf8'), context);
}
const source = readFileSync(new URL('../assets/js/runtime/master/components/vrodos_scene_settings.component.js', import.meta.url), 'utf8');
const ast = parse(source, { ecmaVersion: 'latest', range: true });
const registration = ast.body.find(n => n.expression?.callee?.property?.name === 'registerComponent');
const methods = {};
for (const property of registration.expression.arguments[1].properties) {
    if (['queueShadowFlush','queueQualityRefresh','isFPSMeterRequested','shouldShowFPSMeter','getRenderProfileOwner','queueFPSMeterEnable','enableFPSMeter','disableFPSMeter','syncFPSMeterState','remove'].includes(property.key.name)) {
        methods[property.key.name] = vm.runInContext(`(${source.slice(...property.value.range)})`, context);
    }
}
function attach(f) {
    const owner = Object.assign(Object.create(definitions['vrodos-render-profile']), { el: f.el });
    owner.init(); f.el.components['vrodos-render-profile'] = owner; f.owner = owner; return owner;
}
function fixture(enabled = '1') {
    const renderer = { isWebGLRenderer: true, getContext: () => ({}),
        render(scene, camera) { assert.equal(this, renderer); calls.push(['render',scene,camera]); } };
    const el = { renderer, components: {}, removeEventListener() {} };
    const settings = { ...methods, el, data: { fpsMeterEnabled: enabled },
        updateHardwarePerformanceDiagnostics: () => calls.push('diagnostics'),
        publishRuntimeFeatureState: () => calls.push('features'),
        updateAdaptiveShadowFit: () => calls.push('shadows') };
    el.components['scene-settings'] = settings;
    const f = { el, settings, original: renderer.render }; attach(f);
    el.removeAttribute = name => { const owner = el.components[name]; delete el.components[name]; owner?.remove(); };
    return f;
}
function pending() {
    delete context.Stats;
    let resolve, reject; context.VRODOS_STATS_READY = new Promise((a,b) => { resolve=a; reject=b; });
    return { resolve, reject };
}
async function flush() { await Promise.resolve(); await Promise.resolve(); }
const f = fixture(); f.settings.syncFPSMeterState(); const first = meters.at(-1);
assert.equal(first.options.minimal, true); assert.equal(first.panel, 0);
assert.equal(first.dom.id, 'vrodos-stats-meter'); assert.equal(first.dom.style.top, '16px');
assert.equal(first.dom.style.opacity, '0.92'); assert.equal(body.children.size, 1);
assert.equal(f.settings.fpsStats, first); assert.throws(() => { f.settings.fpsStats = null; }, TypeError);
f.settings.syncFPSMeterState(); assert.equal(meters.at(-1), first);
calls.length=0; f.owner.tick(100,16); assert.deepEqual(calls, ['diagnostics','features','stats','shadows']);
f.el.renderer.render('scene','camera'); assert.equal(first.renderCount,1);
// A composer can retain the meter's render function when installing its own wrapper.
const retained = f.el.renderer.render;
const composer = function (...args) { return retained.apply(this,args); };
f.el.renderer.render = composer;
f.settings.data.fpsMeterEnabled='0'; f.settings.syncFPSMeterState();
assert.equal(first.disposals,1); assert.equal(body.children.size,0); assert.equal(f.el.renderer.render,composer);
f.el.renderer.render('again','camera'); assert.equal(first.renderCount,1,'disposed meter no longer profiles');
assert.deepEqual(calls.at(-1), ['render','again','camera']);
f.settings.disableFPSMeter(); assert.equal(first.disposals,1);
f.el.renderer.render=f.original; f.settings.data.fpsMeterEnabled='1'; f.settings.enableFPSMeter();
const second=meters.at(-1); f.el.removeAttribute('vrodos-render-profile'); f.owner.remove();
assert.equal(second.disposals,1); assert.equal(f.el.renderer.render,f.original);
assert.equal(f.settings.renderProfileRuntime,null); assert.equal(f.owner.settings,null);
assert.equal(f.settings.fpsStats,null); const count=meters.length;
f.settings.enableFPSMeter(); assert.equal(meters.length,count,'facade does not recreate absent owner');
attach(f); f.settings.enableFPSMeter(); assert.notEqual(meters.at(-1),second); f.owner.remove();
// Independent scenes, debug policy, and no owner allocation for disabled settings.
const a=fixture('0'), b=fixture(); a.settings.syncFPSMeterState(); assert.equal(a.owner.fpsStats,null);
b.settings.syncFPSMeterState(); debugDisabled=true; b.settings.syncFPSMeterState(); assert.equal(b.owner.fpsStats,null); debugDisabled=false;
// Deferred loading must not resurrect removed owners or supersede a newer request.
let ready=pending(); const lazy=fixture(); lazy.settings.syncFPSMeterState(); lazy.settings.syncFPSMeterState();
assert.equal(lazy.settings.fpsStatsPending,true); const old=lazy.owner;
lazy.el.removeAttribute('vrodos-render-profile'); attach(lazy); lazy.settings.syncFPSMeterState();
context.Stats=Stats; ready.resolve(); await flush();
assert.equal(old.fpsStats,null); assert.ok(lazy.owner.fpsStats); lazy.owner.remove();
ready=pending(); const canceled=fixture(); canceled.settings.queueFPSMeterEnable(); canceled.settings.disableFPSMeter();
context.Stats=Stats; ready.resolve(); await flush(); assert.equal(canceled.owner.fpsStats,null);
ready=pending(); canceled.settings.queueFPSMeterEnable(); ready.reject(new Error('load')); await flush();
assert.equal(canceled.settings.fpsStatsPending,false); context.Stats=Stats;
// Initialization and disposal failures release partial resources and render wrappers.
for (failure of ['init','async','no-dom','panel','dispose']) {
    const failed=fixture(); failed.settings.enableFPSMeter(); await flush();
    if (failure==='dispose') failed.owner.remove();
    assert.equal(failed.owner.fpsStats,null,failure); assert.equal(failed.el.renderer.render,failed.original,failure);
    assert.equal(meters.at(-1).disposals,1,failure); assert.equal(body.children.size,0,failure);
}
failure='';
// Execute actual scene-settings teardown to enforce composer shutdown before meter disposal.
const teardown=fixture(); teardown.settings.enableFPSMeter(); const final=meters.at(-1); const order=[];
const teardownOverlay = teardown.owner.ensureShadowPerfDebugOverlay();
for (const name of ['clearXrExitRestoreTimers','clearXrExitSessionAttachTimers','detachXrExitSessionEndListener','removePhotorealHelperLights','disposeHardwareDiagnostics']) teardown.settings[name]=()=>{};
teardown.settings.disablePostProcessing=()=>order.push('legacy');
teardown.settings.disablePmndrsPostProcessing=()=>order.push('pmndrs');
const remove=teardown.el.removeAttribute;
teardown.el.removeAttribute=name=>{ order.push(name); remove(name); };
teardown.settings.remove();
assert.deepEqual(order,['legacy','pmndrs','vrodos-atmosphere','vrodos-reflections','vrodos-render-profile']);
assert.equal(final.disposals,1); assert.equal(teardown.owner.settings,null);
assert.equal(teardownOverlay.parentNode, null);
assert.equal(teardown.owner._vrodosShadowPerfOverlay, null);
// Execute the quality-refresh facade with controlled timers, including a valid zero handle.
const timers = new Map(), canceledTimers = [];
let nextTimer = 0;
context.setTimeout = (callback, delay) => {
    assert.equal(delay, 50, 'preserve model/material refresh delay');
    const id = nextTimer++; timers.set(id, callback); return id;
};
context.clearTimeout = id => { canceledTimers.push(id); timers.delete(id); };
function runTimer(id) { const callback = timers.get(id); timers.delete(id); callback(); }
function qualityFixture() {
    const f = fixture('0'); f.events = [];
    f.settings.applyQualityProfiles = () => f.events.push('quality');
    f.settings.requestSceneProbeRefresh = settle => f.events.push(['probe', settle]);
    return f;
}
const quality = qualityFixture();
quality.settings.queueQualityRefresh(false);
assert.equal(quality.owner.queuedQualityRefreshId, 0);
quality.settings.queueQualityRefresh(false);
assert.equal(timers.size, 1, 'coalesce even when the timer handle is zero');
runTimer(0);
assert.deepEqual(quality.events, ['quality', ['probe', false]]);
assert.equal(quality.owner.queuedQualityRefreshId, null);
assert.equal(quality.owner.pendingQualityRefreshWaitForSettle, false);
for (const requests of [[false, true, false], [false, undefined], [true, false]]) {
    quality.events.length = 0;
    for (const settle of requests) quality.settings.queueQualityRefresh(settle);
    assert.equal(timers.size, 1);
    runTimer(quality.owner.queuedQualityRefreshId);
    assert.deepEqual(quality.events, ['quality', ['probe', true]], 'settle requests win within a batch');
}
// Independent scenes and reentrant requests keep distinct batches.
const independent = qualityFixture();
quality.settings.applyQualityProfiles = () => {
    quality.events.push('quality'); quality.settings.queueQualityRefresh(false);
};
quality.settings.queueQualityRefresh(true); independent.settings.queueQualityRefresh(false);
const initialBatch = quality.owner.queuedQualityRefreshId;
runTimer(initialBatch);
assert.notEqual(quality.owner.queuedQualityRefreshId, initialBatch);
assert.equal(quality.owner.pendingQualityRefreshWaitForSettle, false);
runTimer(independent.owner.queuedQualityRefreshId);
assert.deepEqual(independent.events, ['quality', ['probe', false]]);
// Removal invalidates callbacks already delivered to the event loop, even after reattachment.
const oldQualityOwner = quality.owner;
const queuedId = oldQualityOwner.queuedQualityRefreshId;
const stale = timers.get(queuedId);
quality.el.removeAttribute('vrodos-render-profile'); oldQualityOwner.remove();
assert.ok(canceledTimers.includes(queuedId));
assert.equal(oldQualityOwner.settings, null);
assert.equal(oldQualityOwner.pendingQualityRefreshWaitForSettle, false);
quality.settings.queueQualityRefresh(); oldQualityOwner.queueQualityRefresh();
assert.equal(timers.size, 0, 'removed owner is not recreated by refresh requests');
attach(quality); quality.events.length = 0;
quality.settings.applyQualityProfiles = () => quality.events.push('quality');
quality.settings.queueQualityRefresh(false); stale();
assert.deepEqual(quality.events, []);
runTimer(quality.owner.queuedQualityRefreshId);
assert.deepEqual(quality.events, ['quality', ['probe', false]]);
// Removing during quality application must not call through a released settings reference.
quality.settings.applyQualityProfiles = () => quality.el.removeAttribute('vrodos-render-profile');
quality.events.length = 0; quality.settings.queueQualityRefresh();
runTimer(quality.owner.queuedQualityRefreshId); assert.deepEqual(quality.events, []);
// Authored scene-settings teardown cancels its owner's pending refresh.
const scheduledTeardown = qualityFixture();
for (const name of ['clearXrExitRestoreTimers','clearXrExitSessionAttachTimers','detachXrExitSessionEndListener','removePhotorealHelperLights','disposeHardwareDiagnostics','disablePostProcessing','disablePmndrsPostProcessing']) scheduledTeardown.settings[name] = () => {};
const shadowFrames = new Map();
context.requestAnimationFrame = callback => { shadowFrames.set(0, callback); return 0; };
context.cancelAnimationFrame = id => shadowFrames.delete(id);
scheduledTeardown.settings.flushShadowUpdate = () => scheduledTeardown.events.push('shadow');
scheduledTeardown.settings.queueShadowFlush();
const shadowTeardownCallback = shadowFrames.get(0);
scheduledTeardown.settings.queueQualityRefresh();
scheduledTeardown.owner.scheduleNavigationShadowRefreshSettle(() => scheduledTeardown.events.push('settle'), 50);
const settleTeardownCallback = timers.get(scheduledTeardown.owner.navigationShadowSettleTimer);
const teardownCallback = timers.get(scheduledTeardown.owner.queuedQualityRefreshId);
scheduledTeardown.settings.remove(); teardownCallback(); shadowTeardownCallback(); settleTeardownCallback();
assert.equal(scheduledTeardown.owner.navigationShadowSettleTimer, null);
assert.equal(shadowFrames.size, 0);
assert.equal(scheduledTeardown.owner.shadowFlushHandle, null);
assert.equal(timers.size, 0); assert.deepEqual(scheduledTeardown.events, []);
console.log('Render-profile FPS and quality-refresh lifecycle, coalescing, cancellation, and teardown tests passed.');
