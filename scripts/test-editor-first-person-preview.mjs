import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import * as THREE from 'three';

const source = readFileSync(resolve(import.meta.dirname, '../assets/js/editor/ui/vrodos_keyboard_controls.js'), 'utf8');

function walk(frames, keys) {
    const listeners = new Map();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 7000);
    let now = 0;
    const VRODOS = {
        editor: { envir: { cameraAvatar: camera }, avatarControlsEnabled: true },
        api: {},
        ui: {}
    };
    const document = {
        addEventListener(type, listener) { listeners.set(type, listener); },
        removeEventListener(type) { listeners.delete(type); },
        getElementById() { return null; }
    };
    const context = vm.createContext({
        window: { VRODOS, addEventListener() {} },
        VRODOS,
        document,
        performance: { now: () => now },
        THREE
    });
    vm.runInContext(source, context);
    listeners.get('add_movement')();
    for (const keyCode of keys) {
        listeners.get('keydown')({ keyCode, target: { tagName: 'BODY' }, preventDefault() {} });
    }
    for (let index = 0; index < frames; index += 1) {
        now += 1000 / frames;
        VRODOS.api.updatePointerLockControls();
    }
    return { camera, listeners };
}

const at15 = walk(15, [87]);
const at30 = walk(30, [87]);
const at60 = walk(60, [87]);
assert.ok(Math.abs(at30.camera.position.z + 2) < 1e-10, 'W must move at 2 units per second');
assert.ok(at15.camera.position.distanceTo(at30.camera.position) < 1e-10, 'low frame rates must keep the same walking distance');
assert.ok(at30.camera.position.distanceTo(at60.camera.position) < 1e-10, 'walking distance must be frame rate independent');
assert.equal(at30.camera.fov, 60, 'movement must preserve the published perspective field of view');

const diagonal = walk(60, [87, 68]);
assert.ok(Math.abs(diagonal.camera.position.length() - 2) < 1e-10, 'diagonal walking must keep the same speed');
assert.equal(diagonal.listeners.has('wheel'), false, 'preview must not change field of view with the mouse wheel');

console.log('Editor first-person preview test passed.');
