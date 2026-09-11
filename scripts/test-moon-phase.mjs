import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import { runtimeBuildChunks } from './build/runtime-chunks.mjs';

const context = vm.createContext({ VRODOSMaster: {}, THREE });
context.window = context;
context.VRODOS_RUNTIME_SETTINGS_CONTRACT = JSON.parse(readFileSync(new URL('../assets/runtime-settings-contract.json', import.meta.url), 'utf8'));
for (const file of ['vrodos_runtime_settings_helpers.js', 'vrodos_moon_phase.js']) {
    vm.runInContext(readFileSync(new URL(`../assets/js/runtime/master/${file}`, import.meta.url), 'utf8'), context);
}
const phase = context.VRODOSMaster.MoonPhase;
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
const vector = (actual, expected) => near(actual.distanceTo(expected), 0);
const makeConfig = (overrides = {}) => ({
    celestialMode: 'manual', moonPhase: 'auto',
    sunDirection: new THREE.Vector3(1, 0, 0),
    localSunDirection: new THREE.Vector3(0, -1, 0),
    moonDirection: new THREE.Vector3(0, 0, 1),
    ...overrides
});

assert.equal(phase.normalize('invalid'), 'auto');
assert.equal(phase.normalize(undefined), 'auto');
assert.ok(Object.isFrozen(phase));
const expectedPhases = [
    ['full', 0, 1], ['waxing-gibbous', -45, 0.8535533905932737],
    ['first-quarter', -90, 0.5], ['waxing-crescent', -135, 0.1464466094067262],
    ['new', 180, 0], ['waning-crescent', 135, 0.1464466094067262],
    ['last-quarter', 90, 0.5], ['waning-gibbous', 45, 0.8535533905932737]
];
for (const [name, angle, illumination] of expectedPhases) {
    const config = makeConfig({ moonPhase: name });
    assert.equal(phase.applyConfig(config), config);
    assert.equal(phase.normalize(name), name);
    assert.equal(phase.anglesDeg[name], angle);
    assert.equal(config.moonPhaseAngleDeg, angle);
    near(config.moonIllumination, illumination);
    near(phase.illuminationFromAngle(angle), illumination);
    assert.equal(config.effectiveMoonPhase, name);
    assert.equal(config.moonPositionMode, 'author-controlled-night');
    vector(config.moonDirection, new THREE.Vector3(-1, 0, 0));
    vector(config.localMoonDirection, new THREE.Vector3(0, 1, 0));
    near(config.moonLightDirection.length(), 1);
    if (angle !== 0 && angle !== 180) assert.equal(Math.sign(config.moonLightDirection.z), Math.sign(angle));
    vector(config.sunDirection, new THREE.Vector3(1, 0, 0));
}
const automatic = phase.applyConfig(makeConfig());
assert.equal(automatic.effectiveMoonPhase, 'full');
near(automatic.moonIllumination, 1);

// Astronomical phases retain the ephemeris position, even with an authored phase.
for (const name of ['auto', 'new', 'first-quarter']) {
    const config = makeConfig({ celestialMode: 'datetime', astronomicalMoonPosition: true, moonPhase: name });
    const originalMoon = config.moonDirection;
    phase.applyConfig(config);
    assert.equal(config.moonDirection, originalMoon);
    vector(config.moonDirection, new THREE.Vector3(0, 0, 1));
    assert.equal(config.moonPositionMode, name === 'auto' ? 'astronomical-auto-phase' : 'astronomical-fixed-phase');
    near(config.moonIllumination, name === 'new' ? 0 : 0.5);
    if (name === 'auto') vector(config.moonLightDirection, new THREE.Vector3(-1, 0, 0));
}

// The stable orientation stays orthonormal at either pole.
for (const y of [-1, 1]) {
    const config = phase.applyConfig(makeConfig({ sunDirection: new THREE.Vector3(0, y, 0) }));
    const [center, east, north] = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    config.moonFixedToECEFMatrix.extractBasis(center, east, north);
    vector(center, config.moonDirection);
    for (const axis of [center, east, north]) near(axis.length(), 1);
    near(center.dot(north), 0);
    near(east.dot(north), 0);
    near(config.moonFixedToECEFMatrix.determinant(), 1);
}

const date = new Date('2026-09-11T18:00:00Z');
const moonDate = new Date('2026-09-13T18:00:00Z');
const earthRotation = new THREE.Matrix4().makeRotationY(0.7);
const lunarRotation = new THREE.Matrix4().makeRotationX(0.3);
let receivedDate;
const vta = { getMoonFixedToECIRotationMatrix: (value, target) => {
    receivedDate = value;
    return target.copy(lunarRotation);
} };
const config = makeConfig({ celestialMode: 'datetime', astronomicalMoonPosition: true,
    effectiveDate: date, moonEffectiveDate: moonDate,
    inertialToECEFMatrix: new THREE.Matrix4(), moonInertialToECEFMatrix: earthRotation });
phase.applyConfig(config, vta);
assert.equal(receivedDate, moonDate, 'Orientation must use the advancing lunar date.');
assert.equal(config.moonOrientationMode, 'moon-fixed-date-time');
assert.deepEqual(config.moonFixedToECEFMatrix.elements, earthRotation.clone().multiply(lunarRotation).elements);
delete config.moonEffectiveDate;
delete config.moonInertialToECEFMatrix;
phase.applyConfig(config, vta);
assert.equal(receivedDate, date);
assert.deepEqual(config.moonFixedToECEFMatrix.elements, lunarRotation.elements);
phase.applyConfig(config);
assert.equal(config.moonOrientationMode, 'stable-north-up');

const core = runtimeBuildChunks.find(chunk => chunk.output === 'vrodos-runtime-core.bundle.js');
const moonIndex = core.sourceFiles.indexOf('assets/js/runtime/master/vrodos_moon_phase.js');
assert.ok(moonIndex >= 0);
assert.ok(core.sourceFiles.indexOf('assets/js/runtime/master/vrodos_runtime_settings_helpers.js') < moonIndex);
assert.ok(moonIndex < core.sourceFiles.indexOf('assets/js/runtime/master/vrodos_quality_profiles.js'));
console.log('Moon phase and orientation behavior passed.');
