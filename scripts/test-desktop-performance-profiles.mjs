import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');

function assertEqual(actual, expected, label) {
    if (actual !== expected) {
        throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

function storage(initial = {}) {
    const values = new Map(Object.entries(initial));
    return {
        getItem(key) { return values.has(key) ? values.get(key) : null; },
        setItem(key, value) { values.set(key, String(value)); },
        removeItem(key) { values.delete(key); }
    };
}

function harness() {
    const writes = [];
    const window = {
        location: { search: '' },
        localStorage: storage(),
        sessionStorage: storage(),
        navigator: { platform: 'Win32' }
    };
    const document = {
        write(value) { writes.push(String(value)); },
        createElement() { throw new Error('Tests replace the hardware probe before selection.'); }
    };
    window.window = window;
    window.document = document;
    const context = { window, document, navigator: window.navigator, URLSearchParams, console, performance };
    context.globalThis = context;
    vm.createContext(context);
    vm.runInContext(
        readFileSync(resolve(root, 'assets/js/runtime/master/vrodos_hardware_capabilities.js'), 'utf8'),
        context,
        { filename: 'vrodos_hardware_capabilities.js' }
    );
    return { window, writes, capabilities: window.VRODOSHardwareCapabilities };
}

function manifest(overrides = {}) {
    return Object.assign({
        schemaVersion: 2,
        buildMode: 'adaptive',
        queryParameter: 'vrodos_quality',
        storageKey: 'vrodos.desktopQualityOverride.v1',
        sessionDowngradeKey: 'vrodos.desktopQualityDowngrade.v1',
        profiles: { low: {}, medium: {}, high: {} },
        loaders: { low: 'LOW', medium: 'MEDIUM', high: 'HIGH' },
        selection: {
            lowFrameMs: 18,
            highFrameMs: 8,
            lowDeviceMemoryGiB: 4,
            highDeviceMemoryGiB: 8,
            highHardwareConcurrency: 8,
            minimumTextureSize: 8192
        }
    }, overrides);
}

const fixture = harness();
const capable = {
    webgl2: true,
    majorPerformanceCaveat: false,
    softwareRendering: false,
    adapterClass: 'discrete-likely',
    deviceMemoryGiB: 8,
    hardwareConcurrency: 12,
    maxTextureSize: 16384,
    medianFrameMs: 6
};
fixture.capabilities.probe = () => capable;

fixture.window.location.search = '?vrodos_quality=medium';
let decision = fixture.capabilities.selectProfile(manifest());
assertEqual(decision.profile, 'medium', 'query override profile');
assertEqual(decision.source, 'query', 'query override source');

fixture.window.location.search = '';
fixture.window.localStorage.setItem('vrodos.desktopQualityOverride.v1', 'low');
decision = fixture.capabilities.selectProfile(manifest());
assertEqual(decision.profile, 'low', 'saved override profile');
assertEqual(decision.source, 'saved-override', 'saved override source');

fixture.window.location.search = '?vrodos_quality=auto';
decision = fixture.capabilities.selectProfile(manifest());
assertEqual(decision.profile, 'high', 'query auto bypasses saved override');
assertEqual(decision.source, 'query', 'query auto source');

fixture.window.location.search = '';
fixture.window.localStorage.removeItem('vrodos.desktopQualityOverride.v1');
decision = fixture.capabilities.selectProfile(manifest());
assertEqual(decision.profile, 'high', 'capable hardware profile');

fixture.capabilities.probe = () => Object.assign({}, capable, { adapterClass: 'integrated-likely', medianFrameMs: 10 });
decision = fixture.capabilities.selectProfile(manifest());
assertEqual(decision.profile, 'medium', 'balanced hardware profile');

fixture.capabilities.probe = () => Object.assign({}, capable, { adapterClass: 'unknown' });
decision = fixture.capabilities.selectProfile(manifest());
assertEqual(decision.profile, 'low', 'unknown hardware conservative profile');

fixture.capabilities.probe = () => capable;
fixture.window.sessionStorage.setItem('vrodos.desktopQualityDowngrade.v1', 'medium');
decision = fixture.capabilities.selectProfile(manifest());
assertEqual(decision.profile, 'medium', 'session downgrade ceiling');
assertEqual(decision.reason, 'session-downgrade', 'session downgrade reason');

fixture.window.sessionStorage.removeItem('vrodos.desktopQualityDowngrade.v1');
fixture.window.location.search = '?vrodos_quality=high';
fixture.capabilities.bootstrap(manifest({ profiles: { low: {}, medium: {}, high: { presetState: 'modified' } } }));
assertEqual(fixture.writes.at(-1), 'HIGH', 'adaptive bootstrap writes only the selected loader');
assertEqual(fixture.window.VRODOS_ACTIVE_DESKTOP_PROFILE.presetState, 'modified', 'modified tier state reaches runtime');

let customRejected = false;
try {
    fixture.capabilities.selectProfile({ schemaVersion: 2, buildMode: 'custom', profiles: { custom: {} } });
} catch (error) {
    customRejected = true;
}
assertEqual(customRejected, true, 'Custom-only builds never invoke hardware selection');

function editorHarness() {
    const runtimeContract = JSON.parse(readFileSync(resolve(root, 'assets/runtime-settings-contract.json'), 'utf8'));
    const profileContract = JSON.parse(readFileSync(resolve(root, 'assets/desktop-performance-profiles.json'), 'utf8'));
    const scene = { aframeRenderQuality: 'high', aframeShadowQuality: 'high', aframePmndrsCloudsStyle: 'storm' };
    const window = {
        VRODOS: { editor: { envir: { scene } }, ui: {} },
        VRODOS_RUNTIME_SETTINGS_CONTRACT: runtimeContract,
        VRODOS_DESKTOP_PERFORMANCE_PROFILE_CONTRACT: profileContract,
        addEventListener() {},
        setTimeout(callback) { callback(); }
    };
    window.window = window;
    const document = { getElementById() { return null; } };
    const context = { window, document, VRODOS: window.VRODOS, console };
    context.globalThis = context;
    vm.createContext(context);
    vm.runInContext(
        readFileSync(resolve(root, 'assets/js/editor/ui/compile/vrodos_compile_ui_profiles.js'), 'utf8'),
        context,
        { filename: 'vrodos_compile_ui_profiles.js' }
    );
    return { scene, api: window.VRODOS.ui.desktopPerformanceProfiles._test };
}

const editor = editorHarness();
const migratedAdaptive = editor.api.migrateState({ schemaVersion: 1, autoSelect: true, activeProfile: 'medium', profiles: {} });
assertEqual(migratedAdaptive.schemaVersion, 2, 'editor migrates profiles to schema v2');
assertEqual(migratedAdaptive.buildMode, 'adaptive', 'editor preserves adaptive v1 builds');
assertEqual(migratedAdaptive.activeTab, 'medium', 'editor preserves the selected adaptive tier tab');

const migratedFixed = editor.api.migrateState({
    schemaVersion: 1,
    autoSelect: false,
    activeProfile: 'low',
    profiles: { low: { settings: { renderQuality: 'performance', shadowQuality: 'off' } } }
});
assertEqual(migratedFixed.buildMode, 'custom', 'editor migrates fixed v1 builds to Custom only');
assertEqual(migratedFixed.activeTab, 'custom', 'fixed migration opens the Custom tab');
assertEqual(editor.scene.aframeRenderQuality, 'performance', 'fixed migration copies selected tier quality into Custom');
assertEqual(Object.prototype.hasOwnProperty.call(migratedFixed, 'autoSelect'), false, 'schema v2 does not retain autoSelect');

const lowStored = editor.api.tierSettings('low', { pmndrsCloudsEnabled: true, pmndrsCloudsQuality: 'low', shadowQuality: 'high' });
assertEqual(lowStored.pmndrsCloudsEnabled, true, 'Low stores its editable cloud override');
assertEqual(Object.prototype.hasOwnProperty.call(lowStored, 'shadowQuality'), false, 'Low does not store fixed shadow controls');
assertEqual(editor.api.allowedValues('medium', 'pmndrsCloudsQuality').join(','), 'low,medium', 'Medium cloud choices are bounded');
assertEqual(editor.api.allowedValues('medium', 'pmndrsAAMode').join(','), 'none,smaa', 'Medium AA is limited to Off or SMAA');
assertEqual(editor.api.allowedValues('medium', 'pmndrsAAPreset').join(','), 'low,medium', 'Medium SMAA quality is limited to Low or Medium');

console.log('Desktop performance profile selection tests passed.');
