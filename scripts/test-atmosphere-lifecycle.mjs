import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parse } from 'espree';
import * as THREE from 'three';

const definitions = {}, pending = [], generators = [], warnings = [];
const frames = new Map(), timers = new Map();
let frameId = 0, timerId = 0;
let failType = null, synchronousFailure = false, disposeFailure = false;
const context = vm.createContext({ THREE, console: { warn: (...args) => warnings.push(args) },
    AFRAME: { registerComponent: (name, def) => { definitions[name] = def; }, registerSystem() {} },
    requestAnimationFrame: callback => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout: (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; },
    clearTimeout: id => timers.delete(id)
});
context.window = context;
context.VRODOS_TAKRAM_ATMOSPHERE = { PrecomputedTexturesGenerator: class {
    constructor(renderer, options) {
        if (options.type === failType) throw new Error('constructor failed');
        this.options = options; this.textures = { irradianceTexture: new THREE.Texture() }; this.disposals = 0;
        generators.push(this);
    }
    update() {
        if (synchronousFailure) { synchronousFailure = false; throw new Error('synchronous update failed'); }
        return new Promise((resolve, reject) => pending.push({ resolve, reject }));
    }
    dispose() { this.disposals++; this.textures.irradianceTexture.dispose(); if (disposeFailure) throw new Error('dispose failed'); }
} };
vm.runInContext(readFileSync(new URL('../assets/js/runtime/master/components/vrodos_runtime_pipeline.component.js', import.meta.url), 'utf8'), context);
const definition = definitions['vrodos-atmosphere'];
function fixture() {
    const listeners = new Map();
    const el = { object3D: new THREE.Scene(), renderer: {}, components: {},
        addEventListener(type, callback, capture = false) {
            if (!listeners.has(type)) listeners.set(type, []);
            listeners.get(type).push({ callback, capture });
        },
        removeEventListener(type, callback, capture = false) {
            listeners.set(type, (listeners.get(type) || []).filter(item => item.callback !== callback || item.capture !== capture));
        },
        dispatch(type, { target = this, detail = {}, bubbles = false } = {}) {
            for (const { callback, capture } of [...(listeners.get(type) || [])]) {
                if (target === this || bubbles || capture) callback({ type, target, detail });
            }
        }
    };
    const owner = Object.assign(Object.create(definition), { el }); owner.init();
    const settings = { el };
    el.components['scene-settings'] = settings; el.components['vrodos-atmosphere'] = owner;
    let visualDisposals = 0;
    const removeVisuals = current => {
        assert.equal(current._pmndrsAtmosphereState, owner.state, 'compatibility state remains readable during cleanup');
        visualDisposals++;
    };
    owner.bindSettings(settings, removeVisuals, () => {});
    return { owner, settings, el, visualDisposals: () => visualDisposals,
        activeListeners: () => [...listeners.values()].reduce((count, items) => count + items.length, 0) };
}
const profile = (signature = 'balanced:float:higher:combined') => ({ signature, quality: 'balanced', type: THREE.FloatType,
    useFloat: true, combinedScattering: true, higherOrderScattering: true });
const f = fixture();
assert.equal(f.settings._pmndrsAtmosphereState, null);
assert.throws(() => { f.settings._pmndrsAtmosphereState = {}; }, TypeError);
const state = f.owner.ensureResources(profile()); const firstGenerator = state.generator;
assert.equal(f.settings._pmndrsAtmosphereState, state);
assert.equal(f.owner.ensureResources(profile()), state);
assert.equal(generators.length, 1);
assert.equal(state.precision, 'float'); assert.equal(state.ready, false);
pending[0].resolve(); await state.promise;
assert.equal(state.ready, true); assert.equal(state.failed, false);
assert.equal(state.textures, firstGenerator.textures);
// Replace a pending generation and keep late results/errors from affecting either state.
const second = f.owner.ensureResources(profile('second')); const secondGenerator = second.generator;
assert.equal(firstGenerator.disposals, 1); assert.equal(f.visualDisposals(), 1);
const secondPending = pending.at(-1);
const third = f.owner.ensureResources(profile('third'));
assert.equal(secondGenerator.disposals, 1);
secondPending.reject(new Error('stale rejection')); await second.promise;
assert.equal(second.failed, false); assert.equal(third.failed, false); assert.equal(warnings.length, 0);
const thirdPending = pending.at(-1); const thirdGenerator = third.generator;
// Frame and timer IDs deliberately overlap; all three callbacks must be tracked and canceled.
let calls = 0; f.owner.scheduleVisualRefresh(() => calls++);
assert.equal(calls, 1); assert.equal(f.owner.visualRefreshes.size, 3);
assert.deepEqual([...timers.values()].map(item => item.delay), [50, 200]);
const staleCallbacks = [...frames.values(), ...[...timers.values()].map(item => item.callback)];
f.owner.disposeResources();
assert.equal(frames.size, 0); assert.equal(timers.size, 0);
staleCallbacks.forEach(callback => callback()); assert.equal(calls, 1);
thirdPending.resolve(); assert.equal(await third.promise, null); assert.equal(third.ready, false);
assert.equal(thirdGenerator.disposals, 1); assert.equal(f.settings._pmndrsAtmosphereState, null);
f.owner.disposeResources(); assert.equal(thirdGenerator.disposals, 1);
// Normal callbacks retire their handles; removing a component cancels outstanding callbacks.
f.owner.scheduleVisualRefresh(() => calls++);
for (const [id, callback] of [...frames]) { frames.delete(id); callback(); }
for (const [id, item] of [...timers]) { timers.delete(id); item.callback(); }
assert.equal(f.owner.visualRefreshes.size, 0); assert.equal(calls, 5);
const fourth = f.owner.ensureResources(profile()); const fourthGenerator = fourth.generator;
const fourthPending = pending.at(-1); f.owner.scheduleVisualRefresh(() => calls++);
delete f.el.components['vrodos-atmosphere']; f.owner.remove();
assert.equal(f.settings._pmndrsAtmosphereState, null, 'cleanup works after A-Frame drops the component map entry');
assert.equal(fourthGenerator.disposals, 1); assert.equal(f.owner.ensureResources(profile()), null);
f.owner.scheduleVisualRefresh(() => calls++); assert.equal(calls, 6);
fourthPending.resolve(); await fourth.promise; assert.equal(fourth.ready, false);
f.owner.remove(); assert.equal(fourthGenerator.disposals, 1);
// A fresh component can own the same scene-settings facade after removal.
const replacement = Object.assign(Object.create(definition), { el: f.el }); replacement.init();
f.el.components['vrodos-atmosphere'] = replacement;
replacement.bindSettings(f.settings, () => {}, () => {});
assert.equal(f.settings.atmosphereRuntime, replacement);
const restored = replacement.ensureResources(profile());
assert.equal(f.settings._pmndrsAtmosphereState, restored); replacement.remove();
// Float failure retains the existing half-float fallback policy and signature.
failType = THREE.FloatType;
const fallback = fixture(); const half = fallback.owner.ensureResources(profile());
assert.equal(half.precision, 'half-fallback'); assert.equal(half.profileSignature, 'balanced:half:higher:combined');
assert.equal(half.generator.options.type, THREE.HalfFloatType);
assert.equal(half.generator.options.higherOrderScattering, true);
pending.at(-1).resolve(); await half.promise; assert.equal(half.ready, true); fallback.owner.remove(); failType = null;
// A generator allocated before a synchronous update error must be disposed before retry.
synchronousFailure = true;
const sync = fixture(); const before = generators.length; const retry = sync.owner.ensureResources(profile());
assert.equal(generators[before].disposals, 1); assert.equal(retry.precision, 'half-fallback'); sync.owner.remove();
// Current asynchronous failures remain diagnostic failures, without retrying every read.
const failed = fixture(); const broken = failed.owner.ensureResources(profile());
pending.at(-1).reject(new Error('current rejection')); await broken.promise;
assert.equal(broken.failed, true); assert.equal(failed.owner.ensureResources(profile()), broken); failed.owner.remove();
const fatal = fixture(); failType = THREE.HalfFloatType;
const unavailable = fatal.owner.ensureResources({ ...profile(), type: THREE.HalfFloatType, useFloat: false });
assert.equal(unavailable.failed, true); assert.equal(unavailable.generator, null); fatal.owner.remove(); failType = null;
// Disposal errors cannot retain ownership or cause repeated disposal.
const throws = fixture(); const throwing = throws.owner.ensureResources(profile()); const throwingGenerator = throwing.generator;
disposeFailure = true; throws.owner.remove(); throws.owner.remove(); disposeFailure = false;
assert.equal(throwingGenerator.disposals, 1); assert.equal(throws.settings._pmndrsAtmosphereState, null);
assert.ok(warnings.length >= 3);
// Exercise the real quality-profile facade against the registered component.
context.VRODOSMaster = {};
context.URLSearchParams = URLSearchParams;
context.location = { search: '' };
context.document = { getElementById: () => null };
context.VRODOS_RUNTIME_SETTINGS_CONTRACT = JSON.parse(readFileSync(new URL('../assets/runtime-settings-contract.json', import.meta.url), 'utf8'));
for (const name of ['vrodos_runtime_resources.js', 'vrodos_runtime_settings_helpers.js', 'vrodos_celestial_clock.js', 'vrodos_moon_phase.js', 'vrodos_celestial_coordinates.js', 'vrodos_light_smoothing.js', 'vrodos_shadow_maps.js', 'vrodos_shadow_runtime.js', 'vrodos_celestial_lighting.js', 'vrodos_render_quality.js', 'vrodos_cloud_occlusion.js', 'vrodos_sun_occlusion.js', 'vrodos_sun_sprite.js', 'vrodos_gradient_sky.js', 'vrodos_atmosphere_visuals.js', 'vrodos_quality_profiles.js']) {
    vm.runInContext(readFileSync(new URL('../assets/js/runtime/master/' + name, import.meta.url), 'utf8'), context);
}
const helpers = context.VRODOSMaster.SceneSettingsHelpers;
// Use the real legacy-sky classification and removal against the owner's dirty policy.
const visuals = context.VRODOSMaster.AtmosphereVisuals.create({ lighting: {}, cloud: {}, shadow: {}, host: {} });
const cleanup = fixture();
let queries = 0, traversals = 0;
const legacyElements = [];
cleanup.el.querySelectorAll = () => { queries++; return [...legacyElements]; };
const traverse = cleanup.el.object3D.traverse.bind(cleanup.el.object3D);
cleanup.el.object3D.traverse = callback => { traversals++; traverse(callback); };
const authored = new THREE.Object3D(); authored.name = 'authored-building';
const sky = new THREE.Object3D(); sky.name = 'default-sky'; sky.userData.vrodosPmndrsAtmosphereSky = true;
const stars = new THREE.Object3D(); stars.name = 'default-sky'; stars.userData.vrodosPmndrsAtmosphereStars = true;
cleanup.el.object3D.add(authored, sky, stars);
function addLegacySky() {
    const object = new THREE.Object3D(); object.el = { tagName: 'a-sun-sky' };
    cleanup.el.object3D.add(object);
    const element = { parentNode: { removeChild(child) { legacyElements.splice(legacyElements.indexOf(child), 1); } } };
    legacyElements.push(element);
    return object;
}
const cleanFrame = () => cleanup.owner.cleanupLegacySky(visuals.removeLegacySunSkyEntitiesForPmndrs);
const initialLegacy = addLegacySky();
cleanFrame();
assert.equal(initialLegacy.visible, false); assert.equal(legacyElements.length, 0);
for (let frame = 0; frame < 120; frame++) cleanFrame();
assert.equal(queries, 1, 'unchanged XR frames must not scan the DOM');
assert.equal(traversals, 1, 'unchanged XR frames must not traverse the scene');
assert.ok(authored.visible && sky.visible && stars.visible, 'cleanup preserves authored objects and PMNDRS sky/stars');
const lateLegacy = addLegacySky();
cleanup.el.dispatch('object3dset', { target: lateLegacy.el });
cleanFrame();
assert.equal(lateLegacy.visible, false, 'capture observes non-bubbling late object additions');
assert.equal(queries, 2); assert.equal(traversals, 2);
for (const type of ['componentchanged', 'componentinitialized']) {
    for (const name of ['environment', 'scene-settings']) {
        initialLegacy.visible = true;
        cleanup.el.dispatch(type, { detail: { name } });
        cleanFrame();
        assert.equal(initialLegacy.visible, false, `${name} ${type} must reapply legacy suppression`);
    }
}
assert.equal(queries, 6);
cleanup.el.dispatch('componentchanged', { target: authored, detail: { name: 'environment' } });
cleanup.el.dispatch('componentchanged', { detail: { name: 'position' } });
cleanup.el.dispatch('componentinitialized', { target: authored, detail: { name: 'environment' } });
cleanup.el.dispatch('componentinitialized', { detail: { name: 'position' } });
cleanFrame(); assert.equal(queries, 6, 'unrelated component changes must not reintroduce per-frame scans');
cleanup.owner.invalidateLegacySkyCleanup();
assert.throws(() => cleanup.owner.cleanupLegacySky(() => { throw new Error('cleanup interrupted'); }), /cleanup interrupted/);
cleanFrame(); assert.equal(queries, 7, 'interrupted cleanup remains eligible for retry');
cleanup.owner.invalidateLegacySkyCleanup();
cleanup.owner.cleanupLegacySky(settings => {
    visuals.removeLegacySunSkyEntitiesForPmndrs(settings);
    cleanup.el.dispatch('object3dset', { target: authored });
});
cleanFrame(); assert.equal(queries, 9, 'mutations during cleanup remain dirty for the next frame');
const reboundSettings = { el: cleanup.el };
cleanup.owner.bindSettings(reboundSettings, () => {}, () => {});
cleanFrame(); assert.equal(queries, 10, 'a replacement settings facade receives initial cleanup');
const invalidate = cleanup.owner.invalidateLegacySkyCleanup.bind(cleanup.owner);
let invalidationsAfterRemoval = 0;
cleanup.owner.invalidateLegacySkyCleanup = () => { invalidationsAfterRemoval++; invalidate(); };
cleanup.owner.remove();
assert.equal(cleanup.activeListeners(), 0, 'removed atmosphere owners release their scene event subscriptions');
cleanup.el.dispatch('object3dset', { target: authored });
cleanup.el.dispatch('componentchanged', { detail: { name: 'environment' } });
cleanup.el.dispatch('componentinitialized', { detail: { name: 'environment' } });
cleanFrame();
assert.equal(invalidationsAfterRemoval, 0, 'removed owners detach invalidation listeners');
assert.equal(queries, 10, 'removed owners never scan or suppress newly added visuals');
const integrated = fixture(); integrated.settings.data = { pmndrsAtmosphereQuality: 'performance' };
// Bind through the facade rather than the fixture's cleanup double.
integrated.owner.settings = null;
const owned = helpers.ensurePmndrsAtmosphereResources.call(integrated.settings);
assert.equal(owned, integrated.owner.state);
assert.equal(integrated.settings._pmndrsAtmosphereState, owned);
assert.equal(owned.precision, 'half');
helpers.disposePmndrsAtmosphere.call(integrated.settings);
assert.equal(integrated.owner.state, null);
assert.equal(integrated.settings._pmndrsAtmosphereState, null);
integrated.owner.remove();
assert.equal(helpers.ensurePmndrsAtmosphereResources.call(integrated.settings), null);
const ticked = fixture(); const ticks = [];
ticked.settings.updatePmndrsHorizonSun = () => ticks.push('sun');
ticked.settings.updatePmndrsDayNightCycleFrame = time => ticks.push(time);
ticked.owner.tick(250); assert.deepEqual(ticks, ['sun', 250]); assert.equal(ticked.settings._pmndrsTickTimeMs, 250);
ticked.owner.remove();
// Execute the authored scene-settings teardown to verify removal reaches the owner.
const sceneSource = readFileSync(new URL('../assets/js/runtime/master/components/vrodos_scene_settings.component.js', import.meta.url), 'utf8');
const sceneAst = parse(sceneSource, { ecmaVersion: 2022 });
const registration = sceneAst.body.find(node => node.type === 'ExpressionStatement' && node.expression.type === 'CallExpression' && node.expression.arguments[0]?.value === 'scene-settings');
const removeNode = registration.expression.arguments[1].properties.find(property => property.key.name === 'remove').value;
const removal = vm.runInContext('(' + sceneSource.slice(removeNode.start, removeNode.end) + ')', context);
context.removeEventListener = () => {};
context.document = { removeEventListener() {}, getElementById: () => null };
context.vrodosDisposeRuntimeResource = () => {};
const teardown = fixture(); const teardownState = teardown.owner.ensureResources(profile()); const teardownGenerator = teardownState.generator;
const sequence = [];
teardown.el.removeEventListener = () => {};
teardown.el.removeAttribute = name => { assert.equal(name, 'vrodos-atmosphere'); sequence.push('atmosphere'); teardown.owner.remove(); };
for (const name of ['clearXrExitRestoreTimers', 'clearXrExitSessionAttachTimers', 'detachXrExitSessionEndListener', 'disposeSceneProbe', 'disableFPSMeter', 'removePhotorealHelperLights', 'disposeHardwareDiagnostics']) teardown.settings[name] = () => {};
teardown.settings.disablePostProcessing = () => sequence.push('legacy');
teardown.settings.disablePmndrsPostProcessing = () => sequence.push('pmndrs');
removal.call(teardown.settings);
assert.deepEqual(sequence, ['legacy', 'pmndrs', 'atmosphere']);
assert.equal(teardownGenerator.disposals, 1); assert.equal(teardown.owner.settings, null);
console.log('Atmosphere component ownership, legacy-sky invalidation, replacement, async guards, precision fallback, scheduler cancellation, and teardown passed.');
