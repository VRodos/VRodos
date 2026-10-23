import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';

function element(tagName = 'DIV') {
    const attributes = new Map(), listeners = new Map();
    return {
        tagName, children: [], dataset: {}, components: {}, isConnected: true, hidden: false,
        object3D: new THREE.Group(),
        getAttribute: name => attributes.get(name),
        setAttribute: (name, value) => attributes.set(name, value),
        setObject3D(_name, mesh) { this.object3D.add(mesh); },
        removeObject3D() { this.object3D.clear(); },
        addEventListener(type, callback) {
            if (!listeners.has(type)) listeners.set(type, new Set());
            listeners.get(type).add(callback);
        },
        removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
        emit(type, detail = {}, target = this) {
            const event = { detail, target, stopPropagation() { this.stopped = true; } };
            for (const callback of [...(listeners.get(type) || [])]) callback(event);
            return event;
        },
        closest() { return this.tagName === 'BUTTON' ? this : null; },
        append(...children) { children.forEach(child => { child.remove(); child.parentNode = this; this.children.push(child); }); },
        replaceChildren(...children) { this.children.forEach(child => { child.parentNode = null; }); this.children = []; this.append(...children); },
        remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(child => child !== this); this.parentNode = null; },
        listenerCount: () => [...listeners.values()].reduce((sum, set) => sum + set.size, 0)
    };
}

function fixture() {
    let mode = 'inline', nextHandle = 0, blocked = false;
    const definitions = {}, timers = new Map(), frames = new Map(), calls = [], panels = [];
    const document = Object.assign(element(), { body: element('BODY'), head: element('HEAD'),
        createElement: tag => element(tag.toUpperCase()) });
    const scene = Object.assign(element('A-SCENE'), { hasLoaded: true });
    const controllers = [element(), element()];
    const markerElements = [];
    const window = Object.assign(element(), {
        setTimeout: callback => { timers.set(++nextHandle, callback); return nextHandle; },
        clearTimeout: id => timers.delete(id),
        requestAnimationFrame: callback => { frames.set(++nextHandle, callback); return nextHandle; },
        cancelAnimationFrame: id => frames.delete(id),
        VRODOSRuntimeOverlay: { getPresentationMode: () => mode,
            ensureSpatialUiRuntime: async () => true, recordDiagnostic() {}, interactionLocked: false }
    });
    const movement = { canStartTeleport: () => !movement.teleportTravel && !movement.teleportPaused &&
        !window.VRODOSRuntimeOverlay.interactionLocked && scene.components['vrodos-scene-loader'].isReady,
    renderedToAuthoredPosition() {},
    teleportToPoint(position, source) {
        calls.push({ position: position.clone(), source });
        if (blocked) return false;
        movement.teleportTravel = { source };
        return true;
    }, cancelTeleport() { movement.teleportTravel = null; } };
    scene.components['vrodos-scene-loader'] = { isReady: true };
    scene.querySelector = () => ({ components: { 'custom-movement': movement } });
    scene.querySelectorAll = selector => selector === '[vrodos-teleport-point]' ? markerElements
        : (selector === '#oculusRight' ? controllers.slice(1) : controllers).filter(el => el.isConnected);
    window.VRODOSSpatialUI = { prewarm: async () => true, openPanel(config) {
        window.VRODOSRuntimeOverlay.interactionLocked = true;
        movement.teleportPaused = true;
        const panel = { config, entries: [], rows: [], root: { setProperties() {} }, footer: {}, content: {}, frame(options) { this.entries = []; this.rows = []; this.frameOptions = options; },
            row(parent, options) { const row = { parent, ...options }; this.rows.push(row); return row; },
            column(parent, options) { return { parent, ...options }; },
            button(parent, options) { const button = { parent, ...options }; this.entries.push(button); options.renderContent?.(button); return button; },
            text() {}, updateButton(button, options) { Object.assign(button, options); },
            close() {
                window.VRODOSRuntimeOverlay.interactionLocked = false;
                movement.teleportPaused = false;
                config.cleanup();
            }
        };
        panels.push(panel);
        config.render(panel);
        return panel;
    } };
    const context = vm.createContext({ window, document, THREE, console,
        AFRAME: { THREE, registerComponent: (name, definition) => { definitions[name] = definition; } } });
    for (const file of ['vrodos_runtime_resources.js', 'vrodos_teleport.js',
        'components/vrodos_teleport_point.component.js', 'components/vrodos_teleport_destinations.component.js']) {
        vm.runInContext(readFileSync(new URL(`../assets/js/runtime/master/${file}`, import.meta.url), 'utf8'), context);
    }
    const selector = Object.assign(Object.create(definitions['vrodos-teleport-destinations']), { el: scene });
    scene.components['vrodos-teleport-destinations'] = selector;
    selector.init();
    function addPoint(order, label = `Destination ${order}`) {
        const el = element('A-ENTITY');
        el.sceneEl = scene;
        el.setAttribute('data-vrodos-teleport-order', String(order));
        el.setAttribute('data-vrodos-teleport-label', label);
        el.object3D.position.set(order * 3, order, -order);
        const point = Object.assign(Object.create(definitions['vrodos-teleport-point']), { el });
        el.components['vrodos-teleport-point'] = point;
        markerElements.push(el);
        point.init();
        return point;
    }
    return { scene, document, window, selector, movement, controllers, calls, timers, frames, panels, addPoint,
        block: value => { blocked = value; }, mode: value => { mode = value; selector.syncPresentation(); } };
}
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
for (const count of [1, 2, 3, 4, 5, 6]) {
    const grid = fixture();
    for (let order = 1; order <= count; order++) grid.addPoint(order);
    grid.mode('immersive-xr');
    await grid.selector.togglePanel();
    const panel = grid.selector.panel;
    const tiles = [...grid.selector.spatialButtons.values()];
    assert.equal(tiles.length, count, 'every destination up to six is visible without paging');
    assert(!panel.entries.some(entry => ['Next', 'Previous'].includes(entry.label)));
    assert.equal(panel.frameOptions.scrollContent, false, 'the grid never needs a scrollbar');
    assert.equal(panel.rows.filter(row => row.height === 160).length, Math.ceil(count / 2));
    const pixelSize = panel.config.width / panel.config.designWidthPx;
    assert(tiles.every(tile => tile.height * pixelSize >= 0.21), 'tiles stay large in physical metres');
    assert(panel.entries.find(entry => entry.label === 'Close').height * pixelSize >= 0.14);
    assert.equal(tiles.at(-1).width, count % 2 ? '100%' : 368, 'an odd final tile fills its row');
    if (count > 1) assert.equal(tiles[0].parent, tiles[1].parent, 'destinations share a two-column row');
    panel.entries.find(entry => entry.label === 'Close').onClick();
    assert.equal(grid.selector.panel, null);
    assert.equal(grid.window.VRODOSRuntimeOverlay.interactionLocked, false, 'Close releases the modal lock');
    grid.selector.remove();
}
const f = fixture();
assert.equal(f.selector.desktop, undefined, 'no destinations produce no selector');
const temple = f.addPoint(2, 'Temple & gallery');
f.addPoint(1, 'Entrance');
assert.deepEqual(Array.from(f.selector.buttons, button => button.textContent), ['1', '2'], 'load completion order cannot change numbering');
assert.equal(f.selector.buttons[1].getAttribute('aria-label'), 'Teleport to 2. Temple & gallery');
f.selector.desktop.emit('focusin', {}, f.selector.buttons[1]);
assert.equal(f.selector.tooltip.textContent, 'Temple & gallery', 'keyboard focus exposes only the authored name');
assert(temple.pillar.visible, 'focusing a menu destination previews its location in the scene');
f.selector.desktop.emit('mouseover', {}, f.selector.buttons[0]);
assert.equal(temple.pillar.visible, false, 'hovering a different entry clears the prior pillar');
assert.equal(f.selector.tooltip.textContent, 'Entrance');
f.selector.desktop.emit('mouseleave');
assert(temple.pillar.visible, 'keyboard focus keeps its preview after pointer exit');
f.selector.desktop.emit('focusout');
assert.equal(temple.pillar.visible, false, 'leaving pointer and keyboard focus clears the preview');
// A menu never uses scene ray intersections: even an invisible destination resolves its authored origin.
temple.el.object3D.visible = false;
const click = f.selector.desktop.emit('click', {}, f.selector.buttons[1]);
assert(click.stopped, 'selector clicks cannot reach scene objects');
assert.deepEqual(f.calls[0].position.toArray(), [6, 2, -2]);
assert.equal(f.calls[0].source, temple.el, 'closing UI cannot remove the travel source');
f.selector.desktop.emit('click', {}, f.selector.buttons[0]);
assert.equal(f.calls.length, 1, 'repeat requests are ignored while travelling');
f.selector.tick();
assert(f.selector.buttons.every(button => button.disabled));
f.movement.teleportTravel = null;
f.scene.components['vrodos-scene-loader'].isReady = false;
f.mode('immersive-xr');
await f.selector.togglePanel();
assert.equal(f.panels.length, 0, 'loading blocks VR menu opening');
f.scene.components['vrodos-scene-loader'].isReady = true;
f.window.VRODOSRuntimeOverlay.interactionLocked = true;
await f.selector.togglePanel();
assert.equal(f.panels.length, 0, 'another modal is never replaced');
f.window.VRODOSRuntimeOverlay.interactionLocked = false;
for (let order = 3; order <= 8; order++) f.addPoint(order);
f.controllers[0].emit('thumbstickdown');
await flush();
assert.equal(f.selector.panel, null, 'the left thumbstick does not open destinations');
for (const controller of f.controllers.slice(1)) {
    controller.emit('thumbstickdown');
    await flush();
    assert(f.selector.panel, 'the right thumbstick opens destinations');
    controller.emit('thumbstickdown');
    assert.equal(f.selector.panel, null, 'the same shortcut closes destinations');
}
await f.selector.togglePanel();
const panel = f.selector.panel;
assert.equal(panel.config.anchorRefreshFrames, 0, 'the menu stays stationary after initial placement');
assert.equal(panel.config.distance, 2);
assert.equal(f.selector.spatialButtons.size, 6);
panel.entries.find(entry => entry.label === 'Next').onClick();
assert.deepEqual([...f.selector.spatialButtons.values()].map(entry => entry.label), ['7. Destination 7', '8. Destination 8']);
const seventh = f.selector.orderedPoints[6];
panel.entries.find(entry => entry.label.startsWith('7.')).onHoverChange(true);
assert(seventh.pillar.visible, 'controller panel hover previews a destination despite its own modal lock');
panel.entries.find(entry => entry.label.startsWith('7.')).onHoverChange(false);
assert.equal(seventh.pillar.visible, false, 'controller hover exit removes the preview');
f.block(true);
panel.entries.find(entry => entry.label.startsWith('7.')).onClick();
assert.equal(f.selector.panel, null, 'release modal lock before landing validation');
assert.equal(f.movement.teleportTravel, null, 'rejection leaves the user stationary');
assert.equal(f.calls.at(-1).source, f.selector.rejectedPoint.el);
for (const [id, callback] of [...f.frames]) { f.frames.delete(id); callback(); }
await flush();
assert(f.selector.panel, 'invalid landing restores the destination panel');
assert.equal(f.selector.panel.entries.find(entry => entry.label.startsWith('7.')).variant, 'negative');
for (const [id, callback] of [...f.timers]) { f.timers.delete(id); callback(); }
assert.equal(f.selector.panel.entries.find(entry => entry.label.startsWith('7.')).variant, 'secondary');
f.block(false);
f.selector.panel.entries.find(entry => entry.label.startsWith('8.')).onClick();
assert(f.movement.teleportTravel, 'valid selection starts after restoring navigation from its modal pause');
assert.equal(f.selector.panel, null);
const source = f.movement.teleportTravel.source;
source.components['vrodos-teleport-point'].remove();
assert.equal(f.movement.teleportTravel, null, 'removal cancels menu-triggered travel');
assert(!f.selector.points.has(source.components['vrodos-teleport-point']));
f.mode('inline');
assert.equal(f.selector.desktop.hidden, false, 'desktop selector returns on XR exit');
f.document.fullscreenElement = element('A-SCENE');
f.selector.syncPresentation();
assert.equal(f.selector.desktop.parentNode, f.document.fullscreenElement);
// Async UI loading may not resurrect an interface after XR exit or teardown.
let resolveLoad;
f.window.VRODOSRuntimeOverlay.ensureSpatialUiRuntime = () => new Promise(resolve => { resolveLoad = resolve; });
f.mode('immersive-xr');
const pending = f.selector.togglePanel();
f.mode('inline');
resolveLoad(true);
await pending;
assert.equal(f.selector.panel, null);
f.selector.remove();
assert.equal(f.controllers[0].listenerCount(), 0);
assert.equal(f.controllers[1].listenerCount(), 0);
assert.equal(f.frames.size, 0);
assert.equal(f.timers.size, 0);
console.log('Teleport destination selection acceptance tests passed.');
