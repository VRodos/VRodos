import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parse } from 'espree';

const source = readFileSync(new URL('../assets/js/runtime/components/vrodos_controls_hint.component.js', import.meta.url), 'utf8');
function events(target = {}) {
    const listeners = new Map();
    return Object.assign(target, {
        addEventListener(type, handler) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(handler); },
        removeEventListener(type, handler) { listeners.get(type)?.delete(handler); },
        emit(type) { for (const handler of listeners.get(type) || []) handler(); },
        listenerCount() { return [...listeners.values()].reduce((sum, set) => sum + set.size, 0); }
    });
}
function element(tagName = 'DIV') {
    return events({ tagName, children: [], hidden: false,
        append(...children) { children.forEach(child => { child.remove(); child.parent = this; this.children.push(child); }); },
        replaceChildren() { this.children.forEach(child => { child.parent = null; }); this.children = []; },
        remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); this.parent = null; },
        setAttribute() {}
    });
}
function fixture() {
    let mode = 'inline', definition, load = Promise.resolve(true), collisions = true;
    const timers = new Map();
    let timerId = 0, vrShows = 0, vrVisible = false, modal = false;
    const settings = { movement_disabled: false, navigationMode: 'walkable' };
    const movement = { getNavigationMode: () => settings.navigationMode, areCollisionsEnabled: () => collisions };
    const scene = events({ hasLoaded: true, components: {},
        getAttribute: () => settings,
        querySelector: selector => selector === '[custom-movement]' ? { components: { 'custom-movement': movement } } : null
    });
    const document = events({ body: element('BODY'), head: element('HEAD'), fullscreenElement: null, createElement: tag => element(tag.toUpperCase()) });
    const window = events({
        setTimeout(callback, duration) { assert.equal(duration, 5000); timers.set(++timerId, callback); return timerId; },
        clearTimeout(id) { timers.delete(id); },
        VRODOSRuntimeOverlay: { getPresentationMode: () => mode, ensureSpatialUiRuntime: () => load, recordDiagnostic() {} },
        VRODOSSpatialUI: { prewarm: async () => true,
            showControlsHint(items) { if (modal) return false; vrShows++; vrVisible = true; assert(items.some(item => item.input === 'Point + right trigger (RT)')); return true; },
            hideControlsHint() { vrVisible = false; }
        }
    });
    vm.runInNewContext(source, { AFRAME: { registerComponent(name, value) { assert.equal(name, 'vrodos-controls-hint'); definition = value; } }, window, document });
    const component = Object.assign({ el: scene, events: {} }, definition);
    component.init();
    assert.deepEqual(component.events, {}, 'Hint must not override A-Frame lifecycle event handlers');
    return { component, scene, document, window, settings, timers,
        mode(value) { mode = value; scene.emit(value === 'immersive-xr' ? 'enter-vr' : 'exit-vr'); },
        collisions(value) { collisions = value; },
        delayLoad() { let resolve; load = new Promise(done => { resolve = done; }); return resolve; },
        modal(value) { modal = value; },
        get vrShows() { return vrShows; }, get vrVisible() { return vrVisible; }
    };
}
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const actions = items => Array.from(items, item => item.action);

const desktop = fixture();
assert.equal(desktop.document.body.children.length, 0, 'Inline scenes must not show hints');
desktop.component.setHostFullscreen(true);
assert.equal(desktop.component.desktop.hidden, false);
assert.equal(desktop.timers.size, 1);
assert.deepEqual(actions(desktop.component.getItems(false)), ['Move', 'Look', 'Select', 'Jump']);
desktop.scene.emit('enter-vr');
assert.equal(desktop.timers.size, 1, 'Duplicate presentation events must not restart the hint');
for (const callback of [...desktop.timers.values()]) callback();
assert.equal(desktop.component.desktop.hidden, true);
desktop.component.setHostFullscreen(false);
desktop.component.setHostFullscreen(true);
assert.equal(desktop.component.desktop.hidden, false, 'Re-entry must show the hint again');
assert.equal(desktop.document.body.children.length, 1, 'Re-entry must reuse one overlay');
desktop.component.setHostFullscreen(false);
assert.equal(desktop.timers.size, 0);

const direct = fixture();
direct.document.fullscreenElement = element('A-SCENE');
direct.mode('desktop-fullscreen');
assert.equal(direct.component.desktop.parent, direct.document.fullscreenElement, 'Overlay must be inside the fullscreen host');
direct.mode('inline');
assert.equal(direct.component.desktop.hidden, true);

const fullscreenHost = fixture();
const nativeRequest = () => 'canvas';
fullscreenHost.scene.canvas = Object.create({ requestFullscreen: nativeRequest });
fullscreenHost.scene.requestFullscreen = options => options.navigationUI;
fullscreenHost.scene.emit('loaded');
assert.equal(fullscreenHost.scene.canvas.requestFullscreen({ navigationUI: 'hide' }), 'hide', 'A-Frame fullscreen requests must target the container');
fullscreenHost.component.remove();
assert.equal(fullscreenHost.scene.canvas.requestFullscreen, nativeRequest, 'Restore the canvas method on teardown');

const loading = fixture();
loading.scene.components['vrodos-scene-loader'] = { isReady: false };
loading.component.setHostFullscreen(true);
assert.equal(loading.document.body.children.length, 0);
loading.scene.components['vrodos-scene-loader'].isReady = true;
loading.scene.emit('vrodos-scene-loader-ready');
assert.equal(loading.component.desktop.hidden, false, 'Wait for scene readiness before showing controls');

const vr = fixture();
const resolveLoad = vr.delayLoad();
vr.mode('immersive-xr');
assert.equal(vr.timers.size, 0, 'Timer must start only once the VR hint is visible');
vr.mode('inline');
resolveLoad(true);
await flush();
assert.equal(vr.vrShows, 0, 'Late load must not show a hint after exit');
vr.mode('immersive-xr');
await flush();
assert.equal(vr.vrShows, 1);
assert.equal(vr.timers.size, 1);
assert.deepEqual(Array.from(vr.component.getItems(true), item => item.input), ['Left stick', 'Right stick', 'Point + right trigger (RT)', 'A / X', 'B / Y']);
assert.deepEqual(Array.from(vr.component.getItems(true), item => item.icon?.name), ['left-stick', 'right-stick', 'right-trigger', 'jump-buttons', 'reset-buttons']);
assert.deepEqual(Array.from(vr.component.getItems(false), item => item.icon?.name), [undefined, 'mouse-drag', 'mouse-click', undefined]);
assert(!actions(vr.component.getItems(true)).includes('Look'), 'Headset look is implicit in VR');
for (const item of [...vr.component.getItems(true), ...vr.component.getItems(false)].filter(item => item.icon)) {
    assert.match(item.icon.content, /<svg[^>]+viewBox="0 0 64 64"/);
    assert.match(item.icon.content, /<path/, 'Icons must contain filled geometry for the spatial SVG renderer');
    assert(!item.icon.content.includes('<text'), 'Physical button markings must also render as vector geometry');
}
vr.mode('inline');
assert.equal(vr.vrVisible, false);
assert.equal(vr.timers.size, 0);
vr.modal(true);
vr.mode('immersive-xr');
await flush();
assert.equal(vr.timers.size, 0, 'An active dialog must prevent the hint');

vr.settings.movement_disabled = 'true';
assert.deepEqual(actions(vr.component.getItems(true)), ['Select', 'Reset height']);
assert.deepEqual(Array.from(vr.component.getItems(true), item => item.icon?.name), ['right-trigger', 'reset-buttons']);
vr.settings.movement_disabled = false;
vr.settings.navigationMode = 'fly';
assert(!actions(vr.component.getItems(false)).includes('Jump'));
vr.settings.navigationMode = 'walkable';
vr.collisions(false);
assert(!actions(vr.component.getItems(false)).includes('Jump'));

const prewarming = fixture();
let finishPrewarm;
prewarming.window.VRODOSSpatialUI.prewarm = () => new Promise(resolve => { finishPrewarm = resolve; });
prewarming.mode('immersive-xr');
await flush();
prewarming.mode('inline');
finishPrewarm(true);
await flush();
assert.equal(prewarming.vrShows, 0, 'Late font readiness must not reopen the hint');

const keyboardOnly = fixture();
keyboardOnly.scene.querySelector = selector => selector === '[wasd-controls]' ? { components: { 'wasd-controls': { data: { enabled: true } } } } : null;
assert.deepEqual(actions(keyboardOnly.component.getItems(false)), ['Move', 'Look', 'Select'], 'Simple clients must show their WASD controls');

const removed = fixture();
const resolveRemoved = removed.delayLoad();
removed.mode('immersive-xr');
removed.component.remove();
resolveRemoved(true);
await flush();
assert.equal(removed.vrShows, 0);
assert.equal(removed.scene.listenerCount() + removed.document.listenerCount() + removed.window.listenerCount(), 0);
desktop.component.remove();
assert.equal(desktop.document.body.children.length + desktop.document.head.children.length, 0);

// Exercise the dedicated spatial hint with a minimal uikit host: no modal/input/lock APIs exist.
const spatialSource = readFileSync(new URL('../assets/js/runtime/spatial-ui/vrodos_spatial_ui.js', import.meta.url), 'utf8');
const ast = parse(spatialSource, { sourceType: 'module', ecmaVersion: 'latest', range: true });
const functions = new Map();
function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionDeclaration') functions.set(node.id.name, spatialSource.slice(...node.range));
    for (const [key, value] of Object.entries(node)) {
        if (key !== 'range') (Array.isArray(value) ? value : [value]).forEach(walk);
    }
}
walk(ast);
class Ui {
    constructor(props) { this.props = props; this.children = []; }
    add(child) { this.children.push(child); }
    setProperties(props) { Object.assign(this.props, props); }
    update() {}
}
let disposed = 0;
const context = vm.createContext({ controlsHint: null, activePanel: null, PANEL_RENDER_ORDER: 100000,
    configureRenderer() {}, getScene() {}, getThreeRuntime: () => ({ MeshBasicMaterial: Ui }), isAvailable: () => true, getPresentationMode: () => 'immersive-xr', ensureAFrameHostComponent() {},
    createPanelState(config) { assert.equal(config.pointerEvents, 'none'); return { config, root: new Ui({ backgroundColor: config.background, borderColor: config.borderColor, borderWidth: config.borderWidth }), group: {} }; },
    createPanelApi: () => ({ column(parent, props) { const child = new Ui(props); parent.add(child); return child; }, text(parent, props) { parent.add(new Ui(props)); } }),
    append(parent, child) { parent.add(child); return child; }, Svg: Ui,
    normalizeRadiusProps: props => props, fontProps: () => ({}),
    disposeComponentTree() { disposed++; }, disposeObject3D() {}, recordDiagnostic() {}
});
vm.runInContext(functions.get('baseContainerProps') + '\n' + functions.get('hideControlsHint') + '\n' + functions.get('showControlsHint'), context);
assert.equal(context.showControlsHint(desktop.component.getItems(true)), true);
assert.equal(context.controlsHint.root.children.length, 5);
assert.equal(context.controlsHint.root.props.justifyContent, 'center');
assert.match(context.controlsHint.root.props.backgroundColor, /^rgba\(.+,0\.64\)$/);
assert.match(context.controlsHint.root.props.borderColor, /^rgba\(.+,0\.22\)$/);
assert.equal(context.controlsHint.root.props.borderWidth, 1, 'Use one shared rectangle around the controls');
for (const [index, column] of context.controlsHint.root.children.entries()) {
    const item = desktop.component.getItems(true)[index];
    assert.equal(column.props.backgroundColor, undefined, 'Individual controls must not have pill backgrounds');
    assert.equal(column.children.length, 2, 'Each control contains one icon and its action caption');
    assert.equal(column.children[0].props.content, item.icon.content);
    assert.equal(column.children[0].props.pointerEvents, 'none');
    assert.equal(column.children[1].props.text, item.action);
}
context.hideControlsHint();
assert.equal(disposed, 1);
context.activePanel = {};
assert.equal(context.showControlsHint([]), false);
assert.match(functions.get('openPanel'), /hideControlsHint\(\)/, 'Opening a dialog must dismiss the hint');
const renderer = { sortObjects: false, setTransparentSort(sort) { this.sort = sort; } };
const sort = () => 0;
const rendererContext = vm.createContext({ reversePainterSortStable: sort });
vm.runInContext(functions.get('configureRenderer'), rendererContext);
rendererContext.configureRenderer({ renderer });
assert.equal(renderer.sortObjects, true, 'A-Frame must enable sorting so the background cannot cover glyphs');
assert.equal(renderer.sort, sort);
assert.equal(renderer.localClippingEnabled, true);

const overlaySource = readFileSync(new URL('../assets/js/runtime/vrodos_runtime_overlay.js', import.meta.url), 'utf8');
const loaderStart = overlaySource.indexOf('    function spatialUiBundleScriptUrl() {');
const loaderEnd = overlaySource.indexOf('    function waitForSpatialUiRuntime', loaderStart);
const loaderContext = vm.createContext({ URL,
    SPATIAL_UI_BUNDLE_FILE: 'vrodos-runtime-spatial-ui.bundle.js',
    document: { scripts: [{ src: 'https://scene.test/js/master/lib/vrodos-runtime-scene-components.bundle.js?ver=123-456', getAttribute: () => '' }] },
    window: { location: { href: 'https://scene.test/index.html' } }
});
vm.runInContext(overlaySource.slice(loaderStart, loaderEnd), loaderContext);
assert.equal(loaderContext.spatialUiBundleScriptUrl(), 'https://scene.test/js/master/lib/vrodos-runtime-spatial-ui.bundle.js?ver=123-456', 'Lazy spatial UI must retain the compiled runtime cache version');

console.log('Fullscreen and VR controls hint lifecycle checks passed.');
