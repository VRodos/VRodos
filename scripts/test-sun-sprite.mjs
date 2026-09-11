import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import { runtimeBuildChunks } from './build/runtime-chunks.mjs';

const source = readFileSync(new URL('../assets/js/runtime/master/vrodos_sun_sprite.js', import.meta.url), 'utf8');
const canvases = [];
let contextAvailable = true;
let randomValue = 0;
const context = vm.createContext({ THREE, VRODOSMaster: {}, Math: Object.assign(Object.create(Math), { random: () => randomValue }), document: {
    createElement(tag) {
        assert.equal(tag, 'canvas');
        const stops = [];
        const pixels = new Uint8ClampedArray([1, 2, 3, 0, 4, 5, 6, 5, 7, 8, 9, 250, 10, 11, 12, 100]);
        const calls = [];
        const gradient = { addColorStop: (...args) => stops.push(args) };
        const ctx = {
            createRadialGradient: (...args) => { calls.push(['gradient', ...args]); return gradient; },
            clearRect: (...args) => calls.push(['clear', ...args]),
            fillRect: (...args) => { assert.equal(ctx.fillStyle, gradient); calls.push(['fill', ...args]); },
            getImageData: () => ({ data: pixels }),
            putImageData: image => assert.equal(image.data, pixels)
        };
        const canvas = { getContext: type => { assert.equal(type, '2d'); return contextAvailable ? ctx : null; }, stops, pixels, calls };
        canvases.push(canvas);
        return canvas;
    }
} });
vm.runInContext(source, context);
const api = context.VRODOSMaster.SunSprite;
const state = {};
for (const [name, key, size, expectedStops] of [
    ['createPmndrsSunTexture', '_pmndrsSunTexture', 256, [[0, 'rgba(255,253,246,1)'], [0.46, 'rgba(255,245,226,0.98)'], [0.74, 'rgba(255,232,192,0.84)'], [0.9, 'rgba(255,214,168,0.16)'], [1, 'rgba(0,0,0,0)']]],
    ['createPmndrsSunHazeTexture', '_pmndrsSunHazeTexture', 512, [[0, 'rgba(255,220,170,0.42)'], [0.24, 'rgba(255,206,156,0.3)'], [0.48, 'rgba(255,188,136,0.16)'], [0.72, 'rgba(255,170,122,0.06)'], [1, 'rgba(0,0,0,0)']]]
]) {
    assert.equal(api[name](null), null);
    const texture = api[name](state);
    assert.ok(texture instanceof THREE.CanvasTexture);
    assert.equal(state[key], texture);
    assert.equal(texture.image.width, size);
    assert.equal(texture.image.height, size);
    assert.deepEqual(texture.image.stops, expectedStops);
    assert.deepEqual(texture.image.calls, [['gradient', size / 2, size / 2, 0, size / 2, size / 2, size / 2], ['clear', 0, 0, size, size], ['fill', 0, 0, size, size]]);
    assert.equal(texture.generateMipmaps, false);
    assert.equal(texture.minFilter, THREE.LinearFilter);
    assert.equal(texture.magFilter, THREE.LinearFilter);
    const count = canvases.length;
    const version = texture.version;
    assert.equal(api[name](state), texture);
    assert.equal(canvases.length, count, 'cached textures must not allocate canvases');
    assert.equal(texture.version, version, 'cache reads must not trigger uploads');
    const other = api[name]({});
    assert.notEqual(other, texture, 'scene instances retain independent caches');
    contextAvailable = false;
    const failed = {};
    assert.equal(api[name](failed), null);
    assert.equal(failed[key], undefined);
    contextAvailable = true;
    assert.ok(api[name](failed), 'failed canvas creation may be retried');
}
assert.deepEqual(Array.from(state._pmndrsSunHazeTexture.image.pixels), [1, 2, 3, 0, 4, 5, 6, 0, 7, 8, 9, 240, 10, 11, 12, 90]);
randomValue = 1;
const positive = api.createPmndrsSunHazeTexture({});
assert.deepEqual(Array.from(positive.image.pixels), [1, 2, 3, 0, 4, 5, 6, 15, 7, 8, 9, 255, 10, 11, 12, 110]);
const noDocument = vm.createContext({ THREE, VRODOSMaster: {} });
vm.runInContext(source, noDocument);
for (const name of ['createPmndrsSunTexture', 'createPmndrsSunHazeTexture']) {
    assert.equal(noDocument.VRODOSMaster.SunSprite[name]({}), undefined);
    assert.equal(noDocument.VRODOSMaster.SunSprite[name](state), api[name](state));
}
for (const [preset, distance, scale, color, intensity, hazeScale, hazeIntensity, flatScale, flatColor] of [
    ['clear', 5400, 42, '#fff6d8', 4.6, 190, 1.3, 95, '#fff3c7'],
    ['crisp', 5300, 46, '#fff2cc', 4.9, 210, 1.45, 108, '#fff0bc'],
    ['natural', 5200, 50, '#ffefc9', 5.2, 230, 1.6, 120, '#ffedb2']
]) {
    assert.deepEqual({ ...api.getPmndrsHorizonSunConfig(preset, 'atmosphere') }, { distance, scale, color, intensity, hazeScale, hazeIntensity });
    assert.deepEqual({ ...api.getPmndrsHorizonSunConfig(preset, 'other') }, { distance, scale: flatScale, color: flatColor, intensity: 4, hazeScale: 0, hazeIntensity: 0 });
}
assert.deepEqual(api.getPmndrsHorizonSunConfig('unknown'), api.getPmndrsHorizonSunConfig('natural'));
assert.notEqual(api.getPmndrsHorizonSunConfig('clear'), api.getPmndrsHorizonSunConfig('clear'));
const core = runtimeBuildChunks.find(chunk => chunk.id === 'core-runtime');
const index = core.sourceFiles.indexOf('assets/js/runtime/master/vrodos_sun_sprite.js');
assert.ok(index >= 0 && index < core.sourceFiles.indexOf('assets/js/runtime/master/vrodos_quality_profiles.js'));
console.log('Sun sprite texture and preset tests passed.');

