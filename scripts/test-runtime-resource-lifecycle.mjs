import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import { parse } from 'espree';

const definitions = {}, timers = new Map(), canceled = [], warnings = [];
let nextHandle = 0;
class Element {
    constructor() { this.listeners = new Map(); this.object3D = new THREE.Group(); this.components = {}; this.children = []; }
    addEventListener(type, callback) {
        if (!this.listeners.has(type)) this.listeners.set(type, new Set());
        this.listeners.get(type).add(callback);
    }
    removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
    emit(type, event = {}) { for (const fn of [...(this.listeners.get(type) || [])]) fn(event); }
    count() { return [...this.listeners.values()].reduce((n, handlers) => n + handlers.size, 0); }
    getObject3D() { return this.mesh; }
    setObject3D(_name, mesh) { this.mesh = mesh; }
    removeObject3D() { this.mesh = null; }
    querySelector() { return null; }
    querySelectorAll() { return []; }
    getAttribute(name) { return name === 'networked' ? { template: '#avatar-template-expo' } : ''; }
    hasAttribute() { return false; }
}
const document = new Element();
document.getElementById = () => null;
const context = vm.createContext({ THREE, document, console: { warn: (...args) => warnings.push(args), error() {} },
    performance: { now: () => 0 },
    AFRAME: { registerComponent: (name, definition) => { definitions[name] = definition; }, registerGeometry() {},
        utils: { shouldCaptureKeyEvent: () => true } },
    setTimeout: fn => { const handle = nextHandle++; timers.set(handle, fn); return handle; },
    clearTimeout: handle => { canceled.push(handle); timers.delete(handle); }
});
context.window = context;
context.requestAnimationFrame = context.setTimeout;
context.cancelAnimationFrame = context.clearTimeout;
function load(file) { vm.runInContext(readFileSync(new URL(`../assets/js/runtime/${file}`, import.meta.url), 'utf8'), context); }
load('master/vrodos_runtime_resources.js');
const Resources = context.VRODOSMaster.RuntimeResources;
context.VRODOSMaster.createHiddenNavmeshMaterial = () => new THREE.MeshBasicMaterial();
for (const file of ['master/components/vrodos_avatar.component.js', 'master/components/vrodos_misc.component.js',
    'master/components/vrodos_scene_loader.component.js', 'master/components/vrodos_navigation.component.js', 'components/video_component.js']) load(file);

// Canceled callbacks already queued by the browser cannot resurrect a released owner.
const registry = Resources.createRegistry(), target = new Element();
let calls = 0, disposals = 0;
registry.listen(target, 'loaded', () => calls++);
registry.timeout(() => calls++, 100);
registry.frame(() => calls++);
const staleCallbacks = [...timers.values()];
const resource = { dispose() { disposals++; } };
registry.track([resource, resource]); registry.track(resource);
registry.cleanup(() => { throw new Error('one failing cleanup must not prevent the rest'); });
registry.disposeAll(); registry.disposeAll();
staleCallbacks.forEach(callback => callback()); target.emit('loaded');
assert.equal(calls, 0); assert.equal(disposals, 1); assert.equal(target.count(), 0);
assert.equal(timers.size, 0); assert.ok(canceled.includes(0)); assert.equal(warnings.length, 1);
registry.track({ dispose() { disposals++; } });
assert.equal(disposals, 2, 'Late resources are released immediately');

const avatarEl = new Element();
const avatar = Object.assign(Object.create(definitions['player-info']), { el: avatarEl, data: { avatarType: 'blob' } });
avatar.init();
const retry = [...timers.values()][0];
assert.equal(avatarEl.count(), 1); assert.equal(timers.size, 1);
avatar.remove(); retry(); avatarEl.emit('instantiated');
assert.equal(avatarEl.count(), 0); assert.equal(timers.size, 0);

// Loaded/model callbacks and global keyboard handlers belong to their components.
for (const name of ['autoplay-sound', 'entity-movement-emitter', 'clear-frustum-culling']) {
    const el = new Element(), component = Object.assign(Object.create(definitions[name]), { el });
    component.init(); component.remove();
    assert.equal(el.count(), 0, name); assert.equal(document.count(), 0, name);
}

for (const name of ['static-mask-me', 'vrodos-navmesh-helper', 'vrodos-collider-helper']) {
    const el = new Element(), source = new THREE.MeshStandardMaterial(), replacement = new THREE.MeshBasicMaterial();
    const mesh = el.mesh = new THREE.Mesh(new THREE.BoxGeometry(), source);
    const component = Object.assign(Object.create(definitions[name]), { el });
    let sourceDisposals = 0, ownedDisposals = 0;
    source.addEventListener('dispose', () => sourceDisposals++);
    component.init();
    const owned = mesh.material;
    owned.addEventListener('dispose', () => ownedDisposals++);
    el.emit('model-loaded'); assert.equal(mesh.material, owned, 'Repeated model events reuse the owned material');
    component.remove(); component.remove();
    assert.equal(mesh.material, source); assert.equal(ownedDisposals, 1); assert.equal(sourceDisposals, 0);
    component.init(); mesh.material = replacement; component.remove();
    assert.equal(mesh.material, replacement, 'Removal must preserve a newer material owner');
    mesh.geometry.dispose(); source.dispose(); replacement.dispose();
}

const iconEl = new Element();
const icon = Object.assign(Object.create(definitions['vrodos-3d-play-icon']), { el: iconEl });
icon.init();
let iconDisposals = 0;
[icon.mesh.geometry, ...icon.mesh.material].forEach(resource => resource.addEventListener('dispose', () => iconDisposals++));
icon.remove(); icon.remove();
assert.equal(iconDisposals, 3); assert.equal(iconEl.mesh, null);

// Removing the loader before delayed reveal must not reveal entities or launch lazy work.
const loaderEl = new Element();
const loader = Object.assign(Object.create(definitions['vrodos-scene-loader']), {
    el: loaderEl, data: { minimumVisibleMs: 350 }, isRuntimeReadyForReveal: () => true
});
loader.init(); loader.loadedAssets = true;
loader.maybeRevealScene(); loader.maybeRevealScene();
assert.equal(timers.size, 1, 'Only one reveal may be pending');
const reveal = [...timers.values()][0];
const assets = loader.assetsEl = new Element();
assets.addEventListener('loaded', loader.boundHandleAssetReady);
assets.addEventListener('timeout', loader.boundHandleAssetReady);
loader.remove(); reveal();
assert.equal(loader.isReady, false); assert.equal(assets.count(), 0); assert.equal(loaderEl.count(), 0); assert.equal(timers.size, 0);

// Execute the actual cloud loader coordinator with pending real textures.
const cloudSource = readFileSync(new URL('../assets/js/runtime/master/vrodos_postprocessing_pmndrs.js', import.meta.url), 'utf8');
const cloudAst = parse(cloudSource, { ecmaVersion: 'latest', range: true });
const cloudFunctions = cloudAst.body.find(node => node.type === 'ExpressionStatement').expression.callee.body.body;
for (const name of ['ensurePmndrsCloudTextures', 'disposePmndrsCloudTextureState']) {
    const fn = cloudFunctions.find(node => node.type === 'FunctionDeclaration' && node.id.name === name);
    vm.runInContext(cloudSource.slice(...fn.range), context);
}
const pending = [], textures = [];
let updates = 0;
function textureLoad(_url, done, fail) {
    const texture = new THREE.Texture(); textures.push(texture); pending.push({ done: () => done(texture), fail }); return texture;
}
Object.assign(context, { getPmndrsCloudsBundle: () => ({}), resolvePmndrsCloudAssetUrls: () => ({}),
    pmndrsCloudAssetSignature: () => 'test', hasCompletePmndrsCloudAssetUrls: () => true,
    loadPmndrsCloudTexture2D: textureLoad, loadPmndrsCloudTexture3D: (url, _size, done, fail) => textureLoad(url, done, fail),
    loadPmndrsCloudStbnTexture: textureLoad, updatePmndrsCloudDiagnostics: () => updates++,
    markPmndrsCloudsSkipped: () => updates++, disposeRuntimeResource: Resources.dispose });
const settings = {};
context.ensurePmndrsCloudTextures(settings);
let textureDisposals = 0;
textures.forEach(texture => texture.addEventListener('dispose', () => textureDisposals++));
context.disposePmndrsCloudTextureState(settings);
const replacementState = settings._pmndrsCloudTextureState = { signature: 'replacement' };
updates = 0;
pending.forEach(request => { request.done(); request.fail(new Error('late')); });
assert.equal(updates, 0); assert.equal(textureDisposals, 5); assert.equal(settings._pmndrsCloudTextureState, replacementState);

// Retained legacy composer wrappers must delegate after disposal without replacing newer render owners.
load('master/vrodos_postprocessing.js');
context.VRODOSMaster.createPhotorealPostMaterial = () => new THREE.ShaderMaterial();
let draws = 0;
const renderer = { render() { draws++; } };
const legacy = Object.assign({}, context.VRODOSMaster.SceneSettingsHelpers, {
    el: { renderer, object3D: new THREE.Scene() }, getSAOParams: () => null,
    isPostFXOptionEnabled: () => false, getAAQualitySampleCount: () => 0,
    getBloomStrengthValue: () => 0, shouldUsePostProcessing: () => false
});
legacy.enablePostProcessing();
const retiredRender = renderer.render;
let legacyDisposals = 0;
[legacy.postProcessingTarget, legacy.postProcessingMaterial, legacy.postProcessingQuad.geometry]
    .forEach(resource => resource.addEventListener('dispose', () => legacyDisposals++));
const newerRender = () => retiredRender({}, {});
renderer.render = newerRender;
legacy.disablePostProcessing(); legacy.disablePostProcessing(); renderer.render({}, {});
assert.equal(renderer.render, newerRender); assert.equal(draws, 1); assert.equal(legacyDisposals, 3);
legacy.enablePostProcessing(); retiredRender({}, {}); legacy.disablePostProcessing();
assert.equal(draws, 2, 'An old wrapper must not intercept the replacement composer');

// Scene controller dots own their geometry/material and must detach on controller/host removal.
const overlaySource = readFileSync(new URL('../assets/js/runtime/vrodos_runtime_overlay.js', import.meta.url), 'utf8');
const overlayAst = parse(overlaySource, { ecmaVersion: 'latest', range: true });
const overlayFunctions = overlayAst.body[0].expression.callee.body.body;
Object.assign(context, { getThreeRuntime: () => THREE, queryScene: () => ({ object3D: markerScene }),
    SCENE_RAY_HIT_DOT_RADIUS: 0.035, SCENE_RAY_HIT_DOT_COLOR: 0xffc857, SCENE_RAY_HIT_DOT_RENDER_ORDER: 100,
    sceneRayFeedbackOwners: new Set() });
for (const name of ['ensureSceneRayHitMarker', 'hideInactiveSceneRayHitMarkers']) {
    const fn = overlayFunctions.find(node => node.type === 'FunctionDeclaration' && node.id.name === name);
    vm.runInContext(overlaySource.slice(...fn.range), context);
}
const markerScene = new THREE.Scene(), controller = {};
const marker = context.ensureSceneRayHitMarker(controller);
let markerDisposals = 0;
[marker.geometry, marker.material].forEach(resource => resource.addEventListener('dispose', () => markerDisposals++));
context.hideInactiveSceneRayHitMarkers(new Set()); context.hideInactiveSceneRayHitMarkers(new Set());
assert.equal(markerDisposals, 2); assert.equal(markerScene.children.length, 0);
assert.equal(controller.__vrodosSceneRayHitMarker, undefined); assert.equal(context.sceneRayFeedbackOwners.size, 0);

// Recording owns both capture streams and releases tracks on stop, startup failure and late acquisition.
const bootstrap = readFileSync(new URL('../assets/js/runtime/master/vrodos_master_bootstrap.js', import.meta.url), 'utf8');
const bootstrapFunctions = parse(bootstrap, { ecmaVersion: 'latest', range: true }).body[0].expression.callee.body.body;
Object.assign(context, { captureStreams: new Set(), activeRecorder: null, pageHidden: false });
context.VRODOSMaster.getElement = () => null;
for (const name of ['releaseCapture', 'ownCapture', 'startRecording', 'stopRecording']) {
    const fn = bootstrapFunctions.find(node => node.type === 'FunctionDeclaration' && node.id.name === name);
    vm.runInContext(bootstrap.slice(...fn.range), context);
}
function stream() {
    const track = { readyState: 'live', stops: 0, stop() { this.stops++; this.readyState = 'ended'; } };
    return { track, getTracks: () => [track] };
}
context.MediaRecorder = class {
    constructor() { this.state = 'inactive'; }
    start() { this.state = 'recording'; }
    stop() { this.state = 'inactive'; this.onstop?.(); }
};
const displayCapture = stream(), recorderCapture = stream();
context.ownCapture(displayCapture);
const recording = context.startRecording(recorderCapture);
context.stopRecording(displayCapture);
await recording;
assert.equal(displayCapture.track.stops, 1); assert.equal(recorderCapture.track.stops, 1);
assert.equal(context.captureStreams.size, 0); assert.equal(context.activeRecorder, null);
const failedCapture = stream();
context.MediaRecorder = class { constructor() { throw new Error('unsupported'); } };
await assert.rejects(context.startRecording(failedCapture), /unsupported/);
assert.equal(failedCapture.track.stops, 1); assert.equal(context.captureStreams.size, 0);
context.pageHidden = true;
const lateCapture = stream();
assert.throws(() => context.ownCapture(lateCapture), /closed/);
assert.equal(lateCapture.track.stops, 1);
console.log('Runtime resource removal, stale callbacks, material restoration, loader and cloud ownership passed.');
