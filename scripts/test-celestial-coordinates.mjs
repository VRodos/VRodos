import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import { runtimeBuildChunks } from './build/runtime-chunks.mjs';

const context = vm.createContext({ VRODOSMaster: {}, THREE });
context.window = context;
for (const name of ['vrodos_runtime_settings_helpers.js', 'vrodos_celestial_coordinates.js']) {
    vm.runInContext(readFileSync(new URL(`../assets/js/runtime/master/${name}`, import.meta.url), 'utf8'), context);
}
const coordinates = context.VRODOSMaster.CelestialCoordinates;
const near = (actual, expected, epsilon = 1e-9) => assert.ok(Math.abs(actual - expected) < epsilon, `${actual} != ${expected}`);
const vector = (actual, expected, epsilon) => near(actual.distanceTo(expected), 0, epsilon);
const configFor = (lat, lon, height = 0) => ({ geospatialEnabled: true, geospatialLatitudeDeg: lat, geospatialLongitudeDeg: lon, geospatialAltitudeMeters: height });
assert.ok(Object.isFrozen(coordinates));

// Preserve parseFloat, fallback, and boundary semantics of the shared clamp.
const clamp = context.VRODOSMaster.RuntimeSettings.clampNumber;
for (const [input, expected] of [['12px', 12], ['bad', 4], [undefined, 4], [-Infinity, -20], [Infinity, 20], ['2.125', 2.125]]) {
    assert.equal(clamp(input, -20, 20, 4), expected);
}

// Known equatorial/polar anchors and right-handed east/up/south bases.
vector(coordinates.buildFrame(0, 0, 0).position, new THREE.Vector3(6378137, 0, 0));
vector(coordinates.buildFrame(0, 90, 100).position, new THREE.Vector3(0, 6378237, 0));
vector(coordinates.buildFrame(90, 0, 0).position, new THREE.Vector3(0, 0, 6356752.3142451793));
for (const [lat, lon, height] of [[0, 0, 0], [40.64, 22.94, 120], [90, 180, 20000], [-90, -180, -500]]) {
    const frame = coordinates.buildFrame(lat, lon, height);
    for (const axis of [frame.east, frame.up, frame.south]) near(axis.length(), 1);
    near(frame.east.dot(frame.up), 0);
    near(frame.up.dot(frame.south), 0);
    vector(new THREE.Vector3().crossVectors(frame.east, frame.up), frame.south);
    near(frame.matrix.determinant(), 1);
    vector(new THREE.Vector3().applyMatrix4(frame.matrix), frame.position);
    vector(frame.north.clone().negate(), frame.south);
    const direction = new THREE.Vector3(2, -3, 4).normalize();
    vector(coordinates.toLocal(coordinates.toEcef(direction, frame), frame), direction);
    const config = configFor(lat, lon, height);
    vector(coordinates.sunDirectionToEcef(direction, config), coordinates.toEcef(direction, frame));
    const target = { worldToECEFMatrix: new THREE.Matrix4() };
    assert.equal(coordinates.applyWorldMatrix(target, config), target.worldToECEFMatrix);
    assert.deepEqual(target.worldToECEFMatrix.elements, frame.matrix.elements);
}
const bounded = coordinates.buildFrame(100, -200, Infinity);
near(bounded.latitudeDeg, 90);
near(bounded.longitudeDeg, -180);
assert.equal(bounded.altitudeMeters, 20000);
const invalid = coordinates.buildFrame('invalid', undefined, NaN);
vector(invalid.position, new THREE.Vector3(6378137, 0, 0));
assert.equal(coordinates.buildFrame(0, 0, -1000).altitudeMeters, -500);

// Caches remain config-owned and stable until the caller replaces the config.
const cached = configFor(45, 60);
const frame = coordinates.getFrame(cached);
assert.equal(coordinates.getFrame(cached), frame);
assert.equal(coordinates.resolveFrame(cached), frame);
cached.geospatialLatitudeDeg = 10;
assert.equal(coordinates.resolveFrame(cached), frame);
assert.notEqual(coordinates.getFrame(configFor(45, 60)), frame);
const authored = {};
assert.equal(coordinates.getFrame(authored), null);
const fixed = coordinates.resolveFrame(authored);
assert.equal(coordinates.resolveFrame(authored), fixed);
vector(fixed.position, new THREE.Vector3(0, 6378137, 0));
const local = new THREE.Vector3(1, 2, 3).normalize();
vector(coordinates.sunDirectionToEcef(local, authored), new THREE.Vector3(-1, 2, -3).normalize());
vector(local, new THREE.Vector3(1, 2, 3).normalize());

// Authored azimuth uses -Z as north, +X as east, and +Y as up.
for (const [elevation, azimuth, expected] of [[0, 0, [0, 0, -1]], [0, 90, [1, 0, 0]], [90, 0, [0, 1, 0]], [-90, 0, [0, -1, 0]], [0, 180, [0, 0, 1]]]) {
    vector(coordinates.localSunDirection(elevation, azimuth), new THREE.Vector3(...expected));
}
for (const [elevation, azimuth] of [[32, -120], [-15, 42], [0, 0]]) {
    const config = { localSunDirection: coordinates.localSunDirection(elevation, azimuth) };
    coordinates.applyLocalAngles(config);
    near(config.sunElevationDeg, elevation);
    near(config.sunAzimuthDeg, azimuth);
}
const overflow = { localSunDirection: new THREE.Vector3(0, 1.001, 0) };
coordinates.applyLocalAngles(overflow);
near(overflow.sunElevationDeg, 90);

// Existing missing-input behavior is deliberately asymmetric for conversions.
assert.equal(coordinates.getFrame(null), null);
assert.equal(coordinates.resolveFrame(null), null);
vector(coordinates.toLocal(null, null), new THREE.Vector3(0, 1, 0));
vector(coordinates.toLocal(local, null), local);
assert.notEqual(coordinates.toLocal(local, null), local);
vector(coordinates.toEcef(local, null), new THREE.Vector3(0, 1, 0));
vector(coordinates.sunDirectionToEcef(null, null), new THREE.Vector3(0, 1, 0));
coordinates.applyLocalAngles(null);
const empty = {};
coordinates.applyLocalAngles(empty);
assert.deepEqual(empty, {});
assert.equal(coordinates.applyWorldMatrix(null, authored), null);
assert.equal(coordinates.applyWorldMatrix({}, authored), null);
assert.equal(coordinates.applyWorldMatrix({ worldToECEFMatrix: {} }, authored), null);
const defaultTarget = { worldToECEFMatrix: new THREE.Matrix4() };
coordinates.applyWorldMatrix(defaultTarget, null);
vector(new THREE.Vector3().applyMatrix4(defaultTarget.worldToECEFMatrix), new THREE.Vector3(0, 6378137, 0));
vector(local.clone().transformDirection(defaultTarget.worldToECEFMatrix), coordinates.sunDirectionToEcef(local, null));

const core = runtimeBuildChunks.find(chunk => chunk.id === 'core-runtime');
const index = name => core.sourceFiles.indexOf(`assets/js/runtime/master/${name}`);
assert.ok(index('vrodos_runtime_settings_helpers.js') >= 0);
assert.ok(index('vrodos_celestial_coordinates.js') > index('vrodos_runtime_settings_helpers.js'));
assert.ok(index('vrodos_quality_profiles.js') > index('vrodos_celestial_coordinates.js'));
console.log('Celestial coordinate frames, direction transforms, and cache behavior passed.');
