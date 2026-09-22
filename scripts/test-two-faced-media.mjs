import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';

const geometries = {};
const components = {};
class Element {
    constructor() {
        this.attributes = {};
        this.listeners = new Map();
        this.classes = new Set();
        this.classList = {
            add: (name) => this.classes.add(name),
            toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name)
        };
    }
    setAttribute(name, value) { this.attributes[name] = value; }
    getAttribute(name) { return this.attributes[name] || ''; }
    removeAttribute(name) { delete this.attributes[name]; }
    addEventListener(name, fn) {
        if (!this.listeners.has(name)) this.listeners.set(name, new Set());
        this.listeners.get(name).add(fn);
    }
    removeEventListener(name, fn) { this.listeners.get(name)?.delete(fn); }
    emit(name, event = {}) { this.listeners.get(name)?.forEach((fn) => fn(event)); }
    getObject3D() { return null; }
}
const display = new Element();
display.setAttribute('data-vrodos-video-src', '/sample.mp4');
display.setAttribute('data-vrodos-video-poster', '#poster');
const hints = [new Element(), new Element()];
const scene = new Element();
const poster = { getAttribute: () => '/poster.png' };
const elements = {
    '#video-display_sample': display,
    '#video-playhint_sample': hints[0],
    '#video-playhint-back_sample': hints[1],
    '#aframe-scene-container': scene,
    '#poster': poster,
    'a-scene': scene
};
let now = 1000;
const context = vm.createContext({
    THREE,
    AFRAME: {
        registerGeometry: (name, definition) => { geometries[name] = definition; },
        registerComponent: (name, definition) => { components[name] = definition; }
    },
    document: {
        querySelector: (selector) => elements[selector] || null,
        getElementById: () => null
    },
    window: { requestAnimationFrame: () => 1, cancelAnimationFrame() {} },
    console,
    performance: { now: () => now },
    requestAnimationFrame: (fn) => fn()
});
vm.runInContext(readFileSync(new URL('../assets/js/runtime/master/vrodos_runtime_resources.js', import.meta.url), 'utf8'), context);
vm.runInContext(readFileSync(new URL('../assets/js/runtime/components/video_component.js', import.meta.url), 'utf8'), context);

const geometryOwner = {};
geometries['vrodos-two-sided-plane'].init.call(geometryOwner, { width: 4, height: 3 });
const material = new THREE.MeshBasicMaterial({ side: THREE.FrontSide });
const mesh = new THREE.Mesh(geometryOwner.geometry, material);
mesh.updateMatrixWorld();
function hit(x, z) {
    return new THREE.Raycaster(new THREE.Vector3(x, 0.1, z), new THREE.Vector3(0, 0, -Math.sign(z)))
        .intersectObject(mesh)[0];
}
for (const z of [5, -5]) {
    const left = hit(z > 0 ? -1 : 1, z);
    const right = hit(z > 0 ? 1 : -1, z);
    assert(left && right, 'Both outward-facing surfaces must be raycastable.');
    assert(Math.abs(left.uv.x - 0.25) < 1e-6, 'The left side must sample the left of the image from either face.');
    assert(Math.abs(right.uv.x - 0.75) < 1e-6, 'The right side must sample the right of the image from either face.');
    assert.equal(Math.sign(left.face.normal.z), Math.sign(z));
}
mesh.rotation.set(0.2, 0.7, 0);
mesh.scale.set(1.7, 0.8, 1);
mesh.updateMatrixWorld();
for (const side of [1, -1]) {
    const point = mesh.localToWorld(new THREE.Vector3(side === 1 ? -1 : 1, 0.1, 0));
    const normal = new THREE.Vector3(0, 0, side).transformDirection(mesh.matrixWorld);
    const result = new THREE.Raycaster(point.clone().addScaledVector(normal, 5), normal.clone().negate()).intersectObject(mesh)[0];
    assert(result && Math.abs(result.uv.x - 0.25) < 1e-6, 'Rotation and scale must preserve readable UVs.');
}

let creations = 0;
const video = new Element();
video.paused = true;
video.play = () => { video.paused = false; video.emit('play'); return Promise.resolve(); };
video.pause = () => { video.paused = true; video.emit('pause'); };
const control = Object.assign({}, components['video-controls'], {
    data: { id: 'sample' },
    ensureVideoElement() { creations++; return video; },
    shouldUseFlatVideoMaterial() { return false; },
    checkAutoplay() {},
    tuneVideoTexture() {},
    requestSceneLightingRefresh() {},
    updateDesktopFullscreenInlineGuard() {},
    stopDesktopFullscreenInlineGuard() {},
    shouldUseInlinePlayback() { return true; },
    primeVideoForPlayback() { this.videoPrimed = true; this.applyWorldVideoMaterial(); }
});
control.init();
assert.equal(creations, 1, 'There must be one video element per two-faced display.');
assert.match(display.getAttribute('material'), /src: #poster/);
assert.match(display.getAttribute('material'), /side: front/);
for (const hint of hints) assert.equal(hint.listeners.get('click').size, 1);

let stopped = 0;
hints[0].emit('click', { stopPropagation() { stopped++; } });
assert.equal(video.paused, false);
assert.match(display.getAttribute('material'), /src: #video_sample/);
for (const hint of hints) {
    assert.equal(hint.getAttribute('visible'), 'false');
    assert(!hint.classes.has('raycastable'));
}
now += 400;
display.emit('click', {});
assert.equal(video.paused, true);
for (const hint of hints) assert.equal(hint.getAttribute('visible'), 'true');
now += 400;
hints[1].emit('click', { stopPropagation() { stopped++; } });
assert.equal(video.paused, false, 'The rear hint must operate the same video.');
video.paused = true;
video.emit('ended');
for (const hint of hints) assert.equal(hint.getAttribute('visible'), 'true');
assert.equal(stopped, 2, 'Hint clicks must stop propagation to avoid a second toggle.');
control.useFlatMediaMaterial = true;
control.applyWorldVideoMaterial();
assert.match(display.getAttribute('material'), /shader: flat; side: front/);
let videoFrameCallback, frameCanceled = false, lateBindings = 0;
video.readyState = 3; video.videoWidth = 320;
video.requestVideoFrameCallback = callback => { videoFrameCallback = callback; return 0; };
video.cancelVideoFrameCallback = handle => { assert.equal(handle, 0); frameCanceled = true; };
control.bindInlineVideoTexture = () => lateBindings++;
control.activateInlineVideoTexture();
control.remove();
videoFrameCallback();
assert.equal(frameCanceled, true);
assert.equal(lateBindings, 0, 'A delivered video-frame callback must not bind textures after removal');
assert.equal([...video.listeners.values()].reduce((count, listeners) => count + listeners.size, 0), 0);
assert.equal(video.paused, true);
for (const hint of hints) assert.equal(hint.listeners.get('click').size, 0);
assert.equal(display.listeners.get('click').size, 0);
geometryOwner.geometry.dispose();
material.dispose();
// Use real Three geometry for editor slabs; canvas drawing is independent of face orientation.
const canvasContext = new Proxy({
    measureText: (text) => ({ width: text.length * 12 })
}, { get: (target, key) => key in target ? target[key] : () => {} });
const editorContext = vm.createContext({
    THREE,
    window: {},
    document: { createElement: () => ({ getContext: () => canvasContext }) },
    VRODOS: {
        loader: {}, ui: {},
        utils: {
            loaderDisplayText: (text) => text,
            displayText: (text) => text,
            normalizeDisplayTextFields: (resource) => resource,
            normalizeAssessmentLevels: (levels) => levels,
            resolvedAssessmentLevels: (levels) => levels.split(',')
        }
    }
});
vm.runInContext(readFileSync(new URL('../assets/js/editor/loaders/vrodos_loader_object_factories.js', import.meta.url), 'utf8'), editorContext);
const editorLoader = editorContext.VRODOS.loader;
const textPanel = editorLoader.createTextPanelObject('text', { text_content: 'Readable text\nSecond line' });
const textPlanes = textPanel.children.filter((child) => child.name.startsWith('text_text_'));
assert.equal(textPlanes.length, 2);
assert.equal(textPlanes[0].material, textPlanes[1].material);
assert.equal(textPlanes[0].material.side, THREE.FrontSide);
assert.equal(textPlanes[0].position.z, -textPlanes[1].position.z);
assert.equal(textPanel.children.filter((child) => child.isLineSegments).length, 2);
textPanel.position.set(3, 4, 5);
textPanel.scale.set(2, 2, 2);
const textPanelUuid = textPanel.uuid;
const previousTextTexture = textPlanes[0].material.map;
let textTextureDisposals = 0;
previousTextTexture.addEventListener('dispose', () => { textTextureDisposals++; });
editorLoader.updateTextPanelObject(textPanel, { text_content: 'Updated Ελληνικά\nSecond line', text_format: 'manual' });
assert.equal(textPanel.uuid, textPanelUuid, 'Editing text preserves placement identity.');
assert.deepEqual(textPanel.position.toArray(), [3, 4, 5]);
assert.deepEqual(textPanel.scale.toArray(), [2, 2, 2]);
assert.equal(textPanel.text_content, 'Updated Ελληνικά\nSecond line');
assert.notEqual(textPlanes[0].material.map, previousTextTexture);
assert.equal(textPlanes[0].material.map, textPlanes[1].material.map, 'Both sides show the updated text.');
assert.equal(textTextureDisposals, 1, 'The shared old texture is released once.');
textPanel.position.set(0, 0, 0);
textPanel.scale.set(1, 1, 1);
const assessment = editorLoader.createAssessmentObject('quiz', {
    assessment_type: 'Question', assessment_levels: 'A1,B2', assessment_supported: 'true'
});
const info = assessment.getObjectByName('assessment_info_plate');
assert.equal(info.children.length, 2, 'Assessment information must have a readable face on each side.');
assert.equal(info.children[0].material, info.children[1].material);
const dot = assessment.getObjectByName('quiz_status');
const rearDot = assessment.getObjectByName('quiz_status_back');
assert.equal(dot.geometry, rearDot.geometry);
assert.equal(dot.material, rearDot.material);
assert.equal(dot.position.x, -rearDot.position.x);
assert.equal(dot.position.z, -rearDot.position.z);
for (const root of [textPanel, assessment]) {
    root.updateMatrixWorld(true);
    for (const side of [1, -1]) {
        const intersections = new THREE.Raycaster(new THREE.Vector3(side === 1 ? -0.1 : 0.1, 0.1, side * 3), new THREE.Vector3(0, 0, -side)).intersectObject(root);
        const hitFace = intersections.find((entry) => entry.object.name.includes(root === textPanel ? 'text_text_' : 'assessment_info_plate_'));
        assert(hitFace && hitFace.uv.x < 0.5, 'Editor slabs must display the left of their content on the left from either face.');
        assert(intersections.indexOf(hitFace) < intersections.findIndex((entry) => entry.object.name.endsWith(root === textPanel ? '_panel' : '_card')), 'Slab content must be in front of its opaque backing from either side.');
    }
}
const resources = new Set();
for (const root of [textPanel, assessment]) root.traverse((node) => {
    if (node.geometry) resources.add(node.geometry);
    if (node.material) {
        resources.add(node.material);
        if (node.material.map) resources.add(node.material.map);
    }
});
resources.forEach((resource) => resource.dispose());
console.log('Two-faced media geometry, editor slab, and playback tests passed.');
