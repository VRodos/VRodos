import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const persistenceSource = readFileSync(resolve(root, 'assets/js/editor/scene/vrodos_scene_persistence.js'), 'utf8');
const saveSource = readFileSync(resolve(root, 'assets/js/editor/ajax/vrodos_save_scene_ajax.js'), 'utf8');
const compileSource = readFileSync(resolve(root, 'assets/js/editor/ajax/vrodos_request_compile.js'), 'utf8');
const compileUiSource = readFileSync(resolve(root, 'assets/js/editor/ui/vrodos_compile_dialog_ui.js'), 'utf8');
const ajaxSource = readFileSync(resolve(root, 'includes/ajax/class-vrodos-scene-ajax.php'), 'utf8');

const requests = [];
const scene = {
    aframeVrRuntimeProfile: 'desktop',
    fogCategory: 1,
    aframePostFXVignetteEnabled: true,
    desktopPerformanceProfiles: {
        schemaVersion: 2,
        activeTab: 'custom',
        buildMode: 'custom',
        profiles: {}
    },
    background: { getHexString: () => '102030' }
};
Object.defineProperty(scene, 'children', {
    get() {
        throw new Error('metadata export must not traverse scene objects');
    }
});

const VRODOS = {
    api: {},
    config: {
        isAdmin: 'front',
        sceneId: '1099',
        SCENE_SETTINGS_SCHEMA: {
            ClearColor: { type: 'string', default: '#000000', envirKey: 'ClearColor' },
            fogtype: { type: 'string', default: 'none', envirKey: 'fogtype' },
            aframeVrRuntimeProfile: { type: 'string', default: 'desktop', envirKey: 'aframeVrRuntimeProfile' },
            aframePostFXVignetteEnabled: { type: 'boolean', default: false, envirKey: 'aframePostFXVignetteEnabled' },
            desktopPerformanceProfiles: { type: 'object', default: null, envirKey: 'desktopPerformanceProfiles' }
        }
    },
    data: {},
    editor: { envir: { scene, isSceneLoading: false } },
    exporter: {},
    importer: {},
    ui: {},
    utils: {
        assetFnPathFromPath: () => '',
        displayText: (value) => value,
        isSceneLightCategory: () => false,
        normalizeCompiledCollisionEnabled: (value) => value,
        normalizeDisplayTextFields: (value) => value,
        safeVector: (value) => value
    }
};
const windowObject = {
    VRODOS,
    vrodos_data: { scene_mutation_nonce: 'nonce' }
};
const context = vm.createContext({
    Error,
    JSON,
    Object,
    Promise,
    Set,
    URLSearchParams,
    VRODOS,
    alert() {},
    console,
    document: { getElementById: () => null },
    fetch(url, options) {
        requests.push({ url, options, params: new URLSearchParams(options.body) });
        return Promise.resolve({
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ success: true, data: { scene_id: 1099, object_count: 19 } })
        });
    },
    setTimeout,
    window: windowObject
});
windowObject.window = windowObject;
VRODOS.utils.getAjaxUrl = () => '/wp-admin/admin-ajax.php';

vm.runInContext(persistenceSource, context, { filename: 'vrodos_scene_persistence.js' });
const exportedMetadata = JSON.parse(VRODOS.api.exportCurrentSceneMetadata());
assert.equal(exportedMetadata.aframeVrRuntimeProfile, 'desktop');
assert.equal(exportedMetadata.fogtype, 'linear');
assert.equal(exportedMetadata.ClearColor, '#102030');
assert.equal(exportedMetadata.objects, undefined, 'settings metadata contains no scene object payload or object count');
assert.equal(exportedMetadata.urlBaseType, undefined, 'settings metadata contains no URL-base data');

vm.runInContext(saveSource, context, { filename: 'vrodos_save_scene_ajax.js' });
await VRODOS.api.saveSceneSettings();
assert.equal(requests.length, 1, 'one settings save issues exactly one request');
assert.equal(requests[0].params.get('action'), 'vrodos_save_scene_settings_action');
assert.equal(requests[0].params.get('scene_id'), '1099');
assert.equal(requests[0].params.has('scene_json'), false, 'settings saves never send full scene JSON');
assert.equal(requests[0].params.has('scene_title'), false, 'settings saves do not mutate the scene title');
assert.equal(requests[0].params.has('retained_surface_texture_ids'), false, 'settings saves do not run object-owned texture cleanup');
assert.equal(Object.hasOwn(JSON.parse(requests[0].params.get('scene_metadata')), 'objects'), false);

assert.doesNotMatch(compileSource, /saveChanges\s*\(\s*\{\s*force:\s*true\s*\}\s*\)/, 'build preflight must not force a full-scene save');
assert.doesNotMatch(compileUiSource, /saveChanges\s*\(\s*\{\s*force:\s*true\s*\}\s*\)/, 'Save build settings must not force a full-scene save');
assert.match(compileSource, /waitForLatestSceneSave\(\)[\s\S]*saveSceneSettings\(\)/, 'build preflight waits before saving metadata');
assert.match(compileUiSource, /waitForLatestSave[\s\S]*saveSceneSettings\(\)/, 'the explicit settings action waits before saving metadata');

const settingsHandlerStart = ajaxSource.indexOf('public function save_scene_settings_action_callback');
const nextHandlerStart = ajaxSource.indexOf('public function upload_surface_texture_action_callback', settingsHandlerStart);
const settingsHandler = ajaxSource.slice(settingsHandlerStart, nextHandlerStart);
assert.ok(settingsHandlerStart >= 0 && nextHandlerStart > settingsHandlerStart, 'the settings AJAX handler is registered');
assert.match(ajaxSource, /add_action\(\s*'wp_ajax_vrodos_save_scene_settings_action'/, 'the authenticated settings action is registered');
assert.match(settingsHandler, /check_ajax_referer\(\s*'vrodos_scene_mutation'/, 'the settings endpoint requires the scene mutation nonce');
assert.match(settingsHandler, /current_user_can\(\s*'edit_post'/, 'the settings endpoint requires scene edit permission');
assert.match(settingsHandler, /VRodos_Scene_Settings_Merger::merge_json/, 'the settings endpoint merges into canonical scene JSON');
assert.doesNotMatch(settingsHandler, /Vrodos_Scene_Model/, 'the settings endpoint must not normalize or rebuild scene objects');

console.log('Scene settings save client and authorization contract tests passed.');
