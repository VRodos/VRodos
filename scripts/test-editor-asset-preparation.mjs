import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import * as THREE from 'three';

const root = resolve(import.meta.dirname, '..');
const timers = [];
const elements = new Map();
class Element {
    constructor() {
        this.children = [];
        this.style = {};
        this.dataset = {};
        this.listeners = {};
        this.classList = { add() {}, remove() {}, toggle() {} };
    }
    set id(value) { this._id = value; elements.set(value, this); }
    get id() { return this._id; }
    appendChild(child) { this.children.push(child); child.parent = this; return child; }
    prepend(...children) { this.children.unshift(...children); }
    replaceChildren() { this.children = []; }
    setAttribute() {}
    addEventListener(name, listener) { this.listeners[name] = listener; }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this); elements.delete(this.id); }
}
const actions = new Element();
actions.id = 'editorPreviewLoadActions';
const scene = new THREE.Scene();
scene.name = 'vrodosScene';
const records = {};
let selected = null;
let selections = 0;
let loadCalls = 0;
let nextMetadata;
let resolveDownload;
let rejectDownload;
const context = {
    THREE, URL, URLSearchParams, performance,
    console: { log() {}, info() {}, warn() {}, error() {} },
    document: { baseURI: 'http://localhost/', getElementById: (id) => elements.get(id) || null, createElement: () => new Element(), dispatchEvent() {} },
    CustomEvent: class {},
    location: { href: 'http://localhost/editor' },
    addEventListener() {},
    setTimeout(callback) { const timer = { callback }; timers.push(timer); return timer; },
    clearTimeout(timer) { timer.cancelled = true; },
    fetch: async () => { if (nextMetadata instanceof Error) throw nextMetadata; return { ok: true, text: async () => JSON.stringify(nextMetadata) }; },
    vrodos_data: { scene_mutation_nonce: 'nonce' },
    VRODOS: {
        data: { pluginPath: '/plugin', scene_data: { objects: records } },
        config: { SCENE_SETTINGS_SCHEMA: {} },
        exporter: {}, importer: {}, editorScene: {}, loader: {}, ui: {}, api: {},
        editor: {
            requestRender() {},
            envir: { scene, renderer: {}, animationMixers: [], selectableMeshes: new Set() },
            selection: { get: () => selected, clear() { selected = null; }, select(object) { selected = object; selections++; } }
        },
        utils: {
            getAjaxUrl: () => '/ajax',
            loaderDisplayText: (value) => String(value || ''),
            displayText: (value) => String(value || ''),
            normalizeDisplayTextFields: (value) => value,
            isDisplayTextField: () => false,
            normalizeSceneAssetCategory: (value) => value,
            isAssessmentResource: () => false,
            isEditorInternalObject: (object) => object.vrodos_internal_helper === true,
            resolveSceneAssetCategory: (resource) => resource.category_slug,
            sceneSafeVector: (value) => value,
            sceneSafeScale: (value) => value,
            normalizeCompiledCollisionEnabled: (value) => value !== false,
            sceneGetObjectRecord: (name) => records[name],
            sceneSetObjectRecord(name, record) { records[name] = record; },
            sceneFindObjectRecord(_uuid, object) { return records[object.name] ? { key: object.name, value: records[object.name] } : null; },
            sceneDeleteObjectRecord(record) { if (record) delete records[record.key]; },
            applyTRSToObject(object, trs) {
                object.position.fromArray(trs.translation || [0, 0, 0]);
                object.rotation.set(...(trs.rotation || [0, 0, 0]));
                object.scale.fromArray(trs.scale || [1, 1, 1]);
            }
        }
    }
};
context.window = context;
vm.createContext(context);
for (const path of [
    'assets/js/editor/core/vrodos_editor_core_utils.js',
    'assets/js/editor/scene/vrodos_scene_registry.js',
    'assets/js/editor/scene/vrodos_scene_object_factory.js',
    'assets/js/editor/loaders/vrodos_loader_object_factories.js',
    'assets/js/editor/loaders/vrodos_loader_glb_asset_cache.js',
    'assets/js/editor/scene/vrodos_scene_disposal.js',
    'assets/js/runtime/master/vrodos_model_origin.js',
    'assets/js/editor/loaders/vrodos_loader_glb_assets.js',
    'assets/js/editor/loaders/vrodos_loader_scene_lifecycle.js',
    'assets/js/editor/scene/vrodos_scene_persistence.js',
    'assets/js/editor/scene/vrodos_scene_object_actions.js',
    'assets/js/editor/scene/vrodos_undo_engine.js'
]) vm.runInContext(readFileSync(resolve(root, path), 'utf8'), context, { filename: path });

const { VRODOS } = context;
VRODOS.loader.getEditorTextureAnisotropy = () => 1;
VRODOS.loader.applyTextureAnisotropy = () => {};
VRODOS.api.triggerAutoSave = () => {};
VRODOS.ui.selectNewSceneObject = (object) => VRODOS.editor.selection.select(object);
VRODOS.editor.undoManager = new VRODOS.editor.UndoManager();
const loader = {
    load(_url, onLoad, _progress, onError) {
        loadCalls++;
        resolveDownload = () => onLoad({ scene: new THREE.Group().add(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial())), animations: [] });
        rejectDownload = () => onError(new Error('Download failed'));
    }
};
VRODOS.loader.createGltfLoader = () => loader;
function asset(id, status = 'pending') {
    return {
        asset_id: id, asset_name: 'Oak Tree', category_name: 'decoration', category_slug: 'decoration',
        editorMetadataHydrated: true, glb_path: `/source-${id}.glb`,
        trs: { translation: [1, 2, 3], rotation: [0, 0, 0], scale: [1, 1, 1] },
        editorLoad: { status, canonicalUrl: `/source-${id}.glb`, loadUrl: '', canRetry: status === 'failed', canRetryLoad: true, readiness: { status: status === 'pending' ? 'queued' : status, label: status === 'pending' ? 'Queued' : 'Preparation failed' } }
    };
}
function ready(id) {
    return { editorLoad: { status: 'ready', loadUrl: `/preview-${id}.glb`, canonicalUrl: `/source-${id}.glb`, loadVariant: 'editor-preview', canRetryLoad: true, readiness: { status: 'ready', label: 'Ready to add' } } };
}
async function flush() { for (let i = 0; i < 15; i++) await Promise.resolve(); }
function nextPoll() {
    let timer;
    do { timer = timers.shift(); } while (timer && timer.cancelled);
    assert.ok(timer, 'a current preparation poll must exist');
    return timer.callback();
}

records.tree = asset(11);
records.tree.vrodosAssetOriginMode = 'bounds-center';
records.tree.vrodosCollisionBounds = { min: [2, 0, 4], max: [6, 8, 10], center: [4, 4, 7] };
const manager = new THREE.LoadingManager();
manager.onLoad = () => VRODOS.ui.finalizeSceneObjectAdd(VRODOS.editor.sceneRegistry.get('tree'), { alreadyRegistered: true });
const tree = await VRODOS.loader.loadGlbAsset(manager, loader, 'tree', records.tree, records);
assert.equal(loadCalls, 0, 'preparation must not automatically download the source');
assert.equal(selections, 1, 'adding a placeholder finalizes the placement once');
assert.equal(tree.children[0].geometry.parameters.width, 4, 'placeholder uses source dimensions');
assert.equal(tree.children[0].position.length(), 0, 'centered assets retain their origin');
assert.match(actions.children[0].children[1].textContent, /replaced automatically/);
const progressWrapper = new Element();
progressWrapper.id = 'progressWrapper';
VRODOS.api.hideSceneLoadingProgress();
assert.equal(progressWrapper.style.visibility, 'hidden', 'pending preparation must not retain a loading indicator');
assert.equal(actions.children.length, 1, 'hiding the loading indicator preserves the independent preparation message');
tree.position.set(8, 9, 10);
tree.rotation.set(0.1, 0.2, 0.3);
tree.scale.set(2, 3, 4);
tree.locked = true;
const id = tree.uuid;
let disposals = 0;
tree.children.forEach((child) => { child.geometry.addEventListener('dispose', () => disposals++); child.material.addEventListener('dispose', () => disposals++); });
const exporter = new VRODOS.exporter.SceneExporter();
assert.equal(exporter.shouldExportNode(tree), true, 'pending asset roots are saved normally');
assert.equal(exporter.shouldExportNode(tree.children[0]), false, 'temporary geometry is excluded from scene exports');
const saved = exporter.processObject(tree);
assert.equal(saved.asset_id, 11);
assert.deepEqual(Array.from(saved.position), [8, 9, 10]);
assert.equal(saved.editor_preview_status, undefined);
assert.equal(saved.vrodosEditorPlaceholder, undefined);
assert.equal(saved.glb_path, undefined, 'asset-owned source URLs are resolved from the asset on reload');
nextMetadata = ready(11);
const poll = nextPoll();
await flush();
resolveDownload();
await poll;
assert.equal(VRODOS.editor.sceneRegistry.get('tree'), tree, 'replacement preserves the root object');
assert.equal(tree.uuid, id);
assert.equal(selected, tree);
assert.equal(selections, 1, 'automatic replacement must not select or finalize again');
assert.deepEqual(tree.position.toArray(), [8, 9, 10]);
assert.deepEqual(tree.scale.toArray(), [2, 3, 4]);
assert.equal(tree.rotation.y, 0.2);
assert.equal(tree.locked, true);
assert.equal(tree.userData.vrodosEditorPlaceholder, undefined);
assert.equal(disposals, 4, 'replacement releases the temporary geometries and materials');
assert.equal(actions.children.length, 0);

records.deleted = asset(12);
const deleted = await VRODOS.loader.loadGlbAsset(null, loader, 'deleted', records.deleted, records);
nextMetadata = ready(12);
const latePoll = nextPoll();
await flush();
VRODOS.api.deleteAssetFromScene(deleted.uuid);
resolveDownload();
await latePoll;
assert.ok(!VRODOS.editor.sceneRegistry.get('deleted'), 'a late download cannot restore a deleted placement');
assert.equal(actions.children.length, 0);
VRODOS.editor.undoManager.undo();
await flush();
resolveDownload();
await flush();
assert.equal(VRODOS.editor.sceneRegistry.get('deleted'), deleted, 'delete undo restores the same root and resumes its load');
assert.equal(deleted.userData.vrodosEditorPlaceholder, undefined);
VRODOS.editor.undoManager.redo();
assert.ok(!VRODOS.editor.sceneRegistry.get('deleted'));

records.quickUndo = asset(16);
const quickUndo = await VRODOS.loader.loadGlbAsset(null, loader, 'quickUndo', records.quickUndo, records);
nextMetadata = ready(16);
const overlappingPoll = nextPoll();
await flush();
VRODOS.api.deleteAssetFromScene(quickUndo.uuid);
VRODOS.editor.undoManager.undo();
await flush();
resolveDownload();
await overlappingPoll;
await flush();
assert.equal(VRODOS.editor.sceneRegistry.get('quickUndo'), quickUndo, 'delete/undo during the same download retains a single current placement');
assert.equal(quickUndo.children.length, 1, 'the obsolete download must not add a second model after undo');
assert.equal(quickUndo.userData.vrodosEditorPlaceholder, undefined);

records.failed = asset(13);
const failed = await VRODOS.loader.loadGlbAsset(null, loader, 'failed', records.failed, records);
nextMetadata = ready(13);
const failingPoll = nextPoll();
await flush();
rejectDownload();
await failingPoll;
assert.equal(failed.userData.vrodosEditorReadiness.status, 'failed');
assert.equal(failed.children[0].material.color.getHex(), 0xef4444);
const retry = actions.children[0].children.find((child) => child.children.some((control) => control.textContent === 'Retry'));
assert.ok(retry, 'download failures offer authorized retry');

VRODOS.loader.cancelPendingEditorGlbLoads();
records.offline = asset(14);
const offline = await VRODOS.loader.loadGlbAsset(null, loader, 'offline', records.offline, records);
assert.equal(offline.children[0].geometry.parameters.width, 1, 'assets without cached bounds get a one-meter cube');
nextMetadata = new Error('Offline');
await nextPoll();
assert.equal(offline.userData.vrodosEditorPlaceholder, true);
assert.match(actions.children[0].children[1].textContent, /Connection interrupted/);
VRODOS.loader.cancelPendingEditorGlbLoads();
assert.equal(VRODOS.loader.pendingEditorGlbLoads.size, 0);
assert.equal(actions.children.length, 0);

records.reloaded = asset(15);
const beforeReload = await VRODOS.loader.loadGlbAsset(null, loader, 'reloaded', records.reloaded, records);
nextMetadata = ready(15);
const reloadingPoll = nextPoll();
await flush();
VRODOS.api.clearSceneForReload();
resolveDownload();
await reloadingPoll;
assert.ok(!VRODOS.editor.sceneRegistry.get('reloaded'), 'scene teardown invalidates an in-flight load');
assert.equal(beforeReload.parent, null);
assert.equal(VRODOS.loader.pendingEditorGlbLoads.size, 0);

records.restored = asset(saved.asset_id);
records.restored.trs = { translation: Array.from(saved.position), rotation: Array.from(saved.rotation), scale: Array.from(saved.scale) };
records.restored.locked = saved.locked;
records.restored.vrodosCollisionBounds = { min: [2, 0, 4], max: [6, 8, 10], center: [4, 4, 7] };
const restored = await VRODOS.loader.loadGlbAsset(null, loader, 'restored', records.restored, records);
assert.equal(restored.userData.vrodosEditorPlaceholder, true, 'reopening a saved pending placement recreates its temporary box');
assert.deepEqual(restored.position.toArray(), [8, 9, 10]);
assert.deepEqual(restored.scale.toArray(), [2, 3, 4]);
assert.equal(restored.locked, true);
assert.deepEqual(restored.children[0].position.toArray(), [4, 4, 7], 'authored origins keep the source-bound center offset');

records.small = asset(18, 'ready');
records.small.editorLoad.loadUrl = records.small.editorLoad.canonicalUrl;
records.small.editorLoad.loadVariant = 'source';
const beforeDirectLoadSelections = selections;
const directLoad = VRODOS.loader.loadGlbAsset(null, loader, 'small', records.small, records);
await flush();
resolveDownload();
const small = await directLoad;
assert.equal(small.userData.vrodosEditorPlaceholder, undefined, 'small assets still load directly');
assert.equal(selections, beforeDirectLoadSelections, 'scene loading never auto-selects pending or ready assets');
VRODOS.api.clearSceneForReload();
const addNotice = new Element();
addNotice.id = 'result_download';
const missingModel = VRODOS.api.addAssetToCanvas('invalid-import', '', 'POI - Link', {
    asset_id: 3655, category_slug: 'poi-link', glb_id: ''
}, [0, 0, 0]);
assert.equal(missingModel, null, 'an imported asset without a GLB cannot be placed');
assert.equal(records['invalid-import'], undefined, 'the invalid placement must not enter scene data');
assert.match(addNotice.textContent, /no prepared 3D model/, 'the editor must explain why the asset was rejected');
assert.equal(progressWrapper.style.visibility, 'hidden', 'an invalid model must not leave the editor loading overlay visible');
console.log('Editor asset preparation lifecycle tests passed.');
