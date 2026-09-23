import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const window = {};
runInNewContext(readFileSync(new URL('../assets/js/runtime/master/vrodos_glb_lighting.js', import.meta.url), 'utf8'), { window });

function model(lights) {
    return { traverse(callback) { lights.forEach(callback); } };
}

function light(intensity, type = 'point') {
    return { intensity, isPointLight: type === 'point', isSpotLight: type === 'spot', isDirectionalLight: type === 'directional', userData: {} };
}

// The ASTRA music store's brightest embedded light is about 182; keep that authored rig intact.
const storeLights = Array.from({ length: 16 }, () => light(45));
storeLights.push(light(182.3));
assert.equal(window.VRODOSGlbLighting.normalize(model(storeLights)), null);
assert.equal(storeLights[16].intensity, 182.3);

// The ASTRA museum has 36 embedded lights, including 5,163–9,240 intensity spots.
const museumLights = [
    ...Array.from({ length: 24 }, () => light(5163.38, 'spot')),
    ...Array.from({ length: 4 }, () => light(9239.74, 'spot')),
    ...Array.from({ length: 4 }, () => light(5978.66)),
    ...Array.from({ length: 3 }, () => light(8696.23)),
    light(683, 'directional')
];
const museum = model(museumLights);
const result = window.VRODOSGlbLighting.normalize(museum);
assert.equal(result.count, 36);
assert.ok(museumLights.reduce((sum, entry) => sum + entry.intensity, 0) <= 1200);
assert.ok(Math.max(...museumLights.filter((entry) => !entry.isDirectionalLight).map((entry) => entry.intensity)) <= 200);
assert.ok(museumLights[35].intensity <= 2.5);
const adjusted = museumLights.map((entry) => entry.intensity);
assert.equal(window.VRODOSGlbLighting.normalize(museum), null);
assert.deepEqual(museumLights.map((entry) => entry.intensity), adjusted);

const compiledComponents = readFileSync(new URL('../assets/js/runtime/master/lib/vrodos-runtime-aframe-components.bundle.js', import.meta.url), 'utf8');
assert.ok(compiledComponents.includes('initVrodosGlbLighting'));
assert.ok(compiledComponents.indexOf('initVrodosGlbLighting') < compiledComponents.indexOf('vrodos-scene-loader'));

console.log('GLB embedded lighting policy passed.');
