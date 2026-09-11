import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import { runtimeBuildChunks } from './build/runtime-chunks.mjs';

const source = readFileSync(new URL('../assets/js/runtime/master/vrodos_shadow_maps.js', import.meta.url), 'utf8');
const context = vm.createContext({ VRODOSMaster: {}, THREE });
vm.runInContext(source, context);
const maps = context.VRODOSMaster.ShadowMaps;
assert.ok(Object.isFrozen(maps));
for (const [input, normalized, type] of [['basic', 'basic', THREE.BasicShadowMap], ['BASIC', 'basic', THREE.BasicShadowMap], ['PCF', 'pcf', THREE.PCFShadowMap], ['vsm', 'pcf', THREE.PCFShadowMap], [null, 'pcf', THREE.PCFShadowMap], [' basic ', 'pcf', THREE.PCFShadowMap]]) {
    assert.equal(maps.normalizeType(input), normalized);
    assert.equal(maps.componentType(input), normalized);
    assert.equal(maps.threeType(input), type);
}
assert.equal(maps.normalizeType('invalid', 'basic'), 'basic');
assert.equal(maps.normalizeType('PCF', 'basic'), 'pcf');
assert.equal(maps.typeName(THREE.BasicShadowMap), 'BasicShadowMap');
assert.equal(maps.typeName(THREE.PCFShadowMap), 'PCFShadowMap');
assert.equal(maps.typeName(99), 'ShadowMap(99)');
assert.equal(maps.typeName(null), 'unknown');
assert.equal(maps.typeName('custom'), 'custom');

// Compatibility depends on the comparison sampler, not just depth allocation.
for (const [depthTexture, pcf, basic] of [[null, false, true], [{}, false, true], [{ compareFunction: 0 }, false, true], [{ compareFunction: THREE.LessEqualCompare }, true, false]]) {
    const shadow = { map: { depthTexture } };
    assert.equal(maps.isCompatible(shadow, THREE.PCFShadowMap), pcf);
    assert.equal(maps.isCompatible(shadow, THREE.BasicShadowMap), basic);
    assert.equal(maps.isCompatible(shadow, THREE.VSMShadowMap), true);
}
for (const shadow of [null, {}, { map: null }]) assert.equal(maps.isCompatible(shadow, THREE.PCFShadowMap), true);

// Real Three resources prove dispose events and mutation order for both passes.
const events = [];
const resource = name => {
    const target = new THREE.WebGLRenderTarget(16, 16);
    target.depthTexture = new THREE.DepthTexture(16, 16);
    target.depthTexture.addEventListener('dispose', () => events.push(name + ':depth'));
    target.addEventListener('dispose', () => events.push(name + ':target'));
    return target;
};
const shadow = { map: resource('map'), mapPass: resource('pass'), needsUpdate: false };
assert.equal(maps.dispose(shadow), true);
assert.deepEqual(events, ['map:depth', 'map:target', 'pass:depth', 'pass:target']);
assert.equal(shadow.map, null);
assert.equal(shadow.mapPass, null);
assert.equal(shadow.needsUpdate, true);
assert.equal(maps.dispose(shadow), false);
assert.equal(events.length, 4);

// Preserve existing early-return behavior for a pass without a primary map.
const orphanPass = resource('orphan');
const noMap = { map: null, mapPass: orphanPass, needsUpdate: false };
assert.equal(maps.dispose(noMap), false);
assert.equal(noMap.mapPass, orphanPass);
assert.equal(noMap.needsUpdate, false);
assert.equal(events.length, 4);
assert.equal(maps.dispose(null), false);
assert.equal(maps.dispose({}), false);
// Optional disposal methods are tolerated without retaining target references.
const minimal = { map: { depthTexture: {} }, mapPass: {} };
assert.equal(maps.dispose(minimal), true);
assert.deepEqual(minimal, { map: null, mapPass: null, needsUpdate: true });
const primaryOnly = { map: resource('primary') };
assert.equal(maps.dispose(primaryOnly), true);
assert.deepEqual(events.slice(-2), ['primary:depth', 'primary:target']);

// Preserve existing behavior in contexts lacking a Three constant or namespace.
context.THREE = { PCFShadowMap: THREE.PCFShadowMap };
assert.equal(maps.threeType('basic'), THREE.PCFShadowMap);
assert.equal(maps.isCompatible({ map: {} }, THREE.BasicShadowMap), true);
context.THREE = undefined;
assert.equal(maps.typeName(0), 'ShadowMap(0)');
assert.equal(maps.isCompatible({ map: {} }, THREE.PCFShadowMap), true);

const core = runtimeBuildChunks.find(chunk => chunk.id === 'core-runtime');
const index = core.sourceFiles.indexOf('assets/js/runtime/master/vrodos_shadow_maps.js');
assert.ok(index >= 0 && index < core.sourceFiles.indexOf('assets/js/runtime/master/vrodos_quality_profiles.js'));
console.log('Shadow map types, sampler compatibility, disposal order, and repeat cleanup passed.');
