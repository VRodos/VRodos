import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import { runtimeBuildChunks } from './build/runtime-chunks.mjs';

const source = readFileSync(new URL('../assets/js/runtime/master/vrodos_light_smoothing.js', import.meta.url), 'utf8');
let now = 100;
const context = vm.createContext({ VRODOSMaster: {}, THREE, performance: { now: () => now }, Date: { now: () => now } });
vm.runInContext(source, context);
const smoothing = context.VRODOSMaster.LightSmoothing;
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);
const colorNear = (actual, expected) => ['r', 'g', 'b'].forEach(channel => near(actual[channel], expected[channel]));
const blend = (from, to, delta, duration = 1000) => from + (to - from) * (1 - Math.exp(-delta / duration));
assert.ok(Object.isFrozen(smoothing));

// First use starts at the supplied live value; otherwise it starts at the target.
const state = { _pmndrsTickTimeMs: 0 };
assert.equal(smoothing.value(state, 'sun', 10, 1000, 2), 2);
assert.equal(smoothing.value(state, 'moon', 5, 1000), 5);
state._pmndrsTickTimeMs = 100;
near(smoothing.value(state, 'sun', 10, 1000, 999), blend(2, 10, 100));
// Repeated samples within a tick must not advance the light again.
const previous = state._pmndrsRuntimeLightSmoothValues.sun;
assert.equal(smoothing.value(state, 'sun', 20, 1000), previous);
state._pmndrsTickTimeMs = 200;
near(smoothing.value(state, 'sun', 20, 1000), blend(previous, 20, 100));
assert.equal(state._pmndrsRuntimeLightSmoothValues.moon, 5);
assert.equal(smoothing.value({ _pmndrsTickTimeMs: 200 }, 'sun', 10, 1000, 3), 3);

// Long pauses cap interpolation at 250ms; backwards clocks do not advance it.
const paused = { _pmndrsTickTimeMs: 0 };
smoothing.value(paused, 'light', 1, 1000, 0);
paused._pmndrsTickTimeMs = 10000;
near(smoothing.value(paused, 'light', 1, 1000), blend(0, 1, 250));
const beforeBackwards = paused._pmndrsRuntimeLightSmoothValues.light;
paused._pmndrsTickTimeMs = 5;
assert.equal(smoothing.value(paused, 'light', 1, 1000), beforeBackwards);
paused._pmndrsTickTimeMs = 105;
near(smoothing.value(paused, 'light', 1, 1000), blend(beforeBackwards, 1, 100));

// Disabled smoothing snaps immediately and still records timing for re-enabling.
for (const duration of [0, -1, undefined]) assert.equal(smoothing.value(paused, 'light', 4, duration), 4);
paused._pmndrsTickTimeMs += 100;
near(smoothing.value(paused, 'light', 8, 1000), blend(4, 8, 100));
const times = { ...paused._pmndrsRuntimeLightSmoothTimes };
const values = { ...paused._pmndrsRuntimeLightSmoothValues };
for (const invalid of [NaN, Infinity, -Infinity]) assert.equal(smoothing.value(paused, 'light', invalid, 1000), 0);
assert.deepEqual({ ...paused._pmndrsRuntimeLightSmoothTimes }, times);
assert.deepEqual({ ...paused._pmndrsRuntimeLightSmoothValues }, values);
for (const invalidCurrent of [NaN, Infinity, undefined]) assert.equal(smoothing.value({}, 'light', 7, 1000, invalidCurrent), 7);

// Clock priority remains tick -> performance -> Date, including source changes.
const clockState = { _pmndrsTickTimeMs: 20 };
smoothing.value(clockState, 'light', 1, 1000, 0);
assert.equal(clockState._pmndrsRuntimeLightSmoothTimes.light, 20);
clockState._pmndrsTickTimeMs = NaN;
near(smoothing.value(clockState, 'light', 1, 1000), blend(0, 1, 80));
assert.equal(clockState._pmndrsRuntimeLightSmoothTimes.light, now);
context.performance = undefined;
now = 200;
const beforeDate = clockState._pmndrsRuntimeLightSmoothValues.light;
near(smoothing.value(clockState, 'light', 1, 1000), blend(beforeDate, 1, 100));
context.performance = {};
now = 300;
smoothing.value(clockState, 'light', 1, 1000);
assert.equal(clockState._pmndrsRuntimeLightSmoothTimes.light, 300);

// Colors clone initial live values, interpolate in Three's color space, and
// keep a separate time channel from intensity even when they share a key.
const light = { _pmndrsTickTimeMs: 0 };
const original = new THREE.Color('#204080');
const target = new THREE.Color('#ff8040');
const initial = smoothing.color(light, 'sun', target, 1000, original);
assert.notEqual(initial, original);
colorNear(initial, original);
smoothing.value(light, 'sun', 1, 1000, 0);
light._pmndrsTickTimeMs = 100;
near(smoothing.value(light, 'sun', 1, 1000), blend(0, 1, 100));
const interpolated = smoothing.color(light, 'sun', target, 1000);
assert.equal(interpolated, initial);
colorNear(interpolated, original.clone().lerp(target, 1 - Math.exp(-0.1)));
colorNear(original, new THREE.Color('#204080'));
colorNear(target, new THREE.Color('#ff8040'));
const snapshot = interpolated.clone();
colorNear(smoothing.color(light, 'sun', '#ffffff', 1000), snapshot);
const snapped = smoothing.color(light, 'sun', target, 0);
assert.notEqual(snapped, interpolated);
colorNear(snapped, target);
colorNear(smoothing.color({}, 'sun', null, 1000), new THREE.Color('#ffffff'));
colorNear(smoothing.color({}, 'sun', target, 1000, {}), target);

// Existing component reset semantics work without module-owned state.
light._pmndrsRuntimeLightSmoothTimes = {};
light._pmndrsRuntimeLightSmoothValues = {};
light._pmndrsRuntimeLightSmoothColors = {};
assert.equal(smoothing.value(light, 'sun', 10, 1000, 3), 3);
colorNear(smoothing.color(light, 'sun', target, 1000, original), original);

const core = runtimeBuildChunks.find(chunk => chunk.id === 'core-runtime');
const index = core.sourceFiles.indexOf('assets/js/runtime/master/vrodos_light_smoothing.js');
assert.ok(index >= 0 && index < core.sourceFiles.indexOf('assets/js/runtime/master/vrodos_quality_profiles.js'));
console.log('Light smoothing timing, values, colors, channel isolation, and reset behavior passed.');
