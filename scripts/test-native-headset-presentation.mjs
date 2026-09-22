import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import { Effect, EffectPass } from 'postprocessing';
import { parse } from 'espree';

const source = readFileSync(new URL('../assets/js/runtime/master/vrodos_postprocessing_pmndrs.js', import.meta.url), 'utf8');
// Composer teardown owns attached effects exactly once; partial builds still release unattached effects.
const disposalCounts = new Map();
class OwnedEffect extends Effect {
    constructor(name) { super(name, 'void mainImage(const in vec4 c, const in vec2 uv, out vec4 o) { o = c; }'); }
    dispose() { disposalCounts.set(this, (disposalCounts.get(this) || 0) + 1); super.dispose(); }
}
const lifecycle = vm.createContext({
    console, disposeRuntimeResource: resource => resource?.dispose(),
    clearPmndrsCloudLightingMaskSelection() {}, syncPmndrsCloudDependentEffects() {},
    restoreAllPmndrsHorizonFoliageMaterials() {}, updatePmndrsAADebugOverlay() {}
});
const lifecycleNames = new Set(['disposePmndrsCloudLightingMaskResources', 'disposePmndrsNativeSsaoResources', 'disposePmndrsCloudEffect', 'disposePmndrsComposerResources']);
const ast = parse(source, { ecmaVersion: 'latest', range: true });
function loadDisposalFunctions(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionDeclaration' && lifecycleNames.has(node.id.name)) {
        vm.runInContext(source.slice(...node.range), lifecycle);
    }
    for (const [key, value] of Object.entries(node)) {
        if (key === 'range') continue;
        if (Array.isArray(value)) value.forEach(loadDisposalFunctions);
        else if (value && typeof value === 'object') loadDisposalFunctions(value);
    }
}
loadDisposalFunctions(ast);
for (const attached of [true, false]) {
    const ssao = new OwnedEffect('ssao'), clouds = new OwnedEffect('clouds'), moon = new OwnedEffect('moon');
    const effectPass = new EffectPass(new THREE.PerspectiveCamera(), ssao, clouds, moon);
    const normal = { dispose() { disposalCounts.set(this, (disposalCounts.get(this) || 0) + 1); } };
    const mask = { dispose() { disposalCounts.set(this, (disposalCounts.get(this) || 0) + 1); } };
    let listenerRemovals = 0;
    clouds.events = { removeEventListener() { listenerRemovals++; } };
    const host = {
        pmndrsNativeSsaoEffect: ssao, pmndrsNativeNormalPass: normal, pmndrsCloudsEffect: clouds,
        pmndrsCloudLightingMaskPass: mask, pmndrsMoonCloudShaftsEffect: moon,
        _pmndrsCloudsEffectChangeHandler() {},
        pmndrsComposer: attached ? { passes: [normal, mask, effectPass], dispose() { this.passes.forEach(pass => pass.dispose()); } } : null
    };
    lifecycle.disposePmndrsComposerResources(host);
    lifecycle.disposePmndrsComposerResources(host);
    for (const resource of [ssao, clouds, moon, normal, mask]) assert.equal(disposalCounts.get(resource), 1);
    assert.equal(listenerRemovals, 1);
    assert.equal(host.pmndrsComposer, null);
    if (!attached) { effectPass.effects = []; effectPass.dispose(); }
}
const start = source.indexOf('    function shouldUsePmndrsNativeHeadset(');
// A pass can be constructed without reaching composer.addPass; its effects still have one owner.
{
    const bloom = new OwnedEffect('bloom'), tone = new OwnedEffect('tone'), orphan = new OwnedEffect('orphan');
    const pass = new EffectPass(new THREE.PerspectiveCamera(), bloom, tone);
    const partial = { pmndrsEffectPass: pass, pmndrsBloomEffect: bloom,
        pmndrsComposer: { passes: [], dispose() {} } };
    lifecycle.disposePmndrsComposerResources(partial, [bloom, tone, orphan]);
    lifecycle.disposePmndrsComposerResources(partial);
    for (const effect of [bloom, tone, orphan]) assert.equal(disposalCounts.get(effect), 1);
}
const end = source.indexOf('    function isPmndrsXrStereoComposerRequested(', start);
const context = vm.createContext({
    THREE,
    isPmndrsDirectVrPresentationActive: s => s.xr,
    getPmndrsToneMappingMode: s => s.toneMapping,
    isPmndrsXrStereoComposerLabEnabled: () => context.forceComposer,
    isPmndrsXrStereoSmaaLabEnabled: () => context.forceSmaa,
    readPmndrsNumber: () => 1
});
vm.runInContext(source.slice(start, end), context);
const eligible = { xr: true, toneMapping: 'aces-filmic', canUseVrHeadsetStereoPmndrsComposer: () => true };
assert.equal(context.shouldUsePmndrsNativeHeadset(eligible), true);
for (const change of [{ xr: false }, { toneMapping: 'agx' }, { canUseVrHeadsetStereoPmndrsComposer: () => false }]) {
    assert.equal(context.shouldUsePmndrsNativeHeadset({ ...eligible, ...change }), false);
}
context.forceComposer = true;
assert.equal(context.shouldUsePmndrsNativeHeadset(eligible), false);
context.forceComposer = false;
context.forceSmaa = true;
assert.equal(context.shouldUsePmndrsNativeHeadset(eligible), false);
context.forceSmaa = false;

const scene = new THREE.Scene();
const basic = new THREE.MeshBasicMaterial({ toneMapped: false });
const authored = new THREE.MeshBasicMaterial({ toneMapped: true });
scene.add(new THREE.Mesh(new THREE.BoxGeometry(), basic), new THREE.Mesh(new THREE.BoxGeometry(), authored));
const material = new THREE.RawShaderMaterial();
const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
const stars = new THREE.Points(new THREE.BufferGeometry(), new THREE.RawShaderMaterial());
stars.renderOrder = -999;
sky.renderOrder = -1000;
scene.add(sky);
const listeners = new Map();
const renderer = { toneMapping: THREE.NoToneMapping, toneMappingExposure: 0.7 };
let draws = 0;
const self = {
    el: { object3D: scene, addEventListener: (n, f) => listeners.set(n, f), removeEventListener: n => listeners.delete(n) },
    _pmndrsAtmosphereState: { skyMesh: sky, starsMesh: stars },
    getPmndrsToneMappingExposure: () => 1.4,
    pmndrsOriginalRender() {
        draws++;
        assert.equal(renderer.toneMapping, THREE.ACESFilmicToneMapping);
        assert.equal(renderer.toneMappingExposure, 1.4);
        assert.equal(sky.renderOrder, 10000);
        assert.equal(basic.toneMapped, true);
        assert.equal(stars.renderOrder, 10001, 'Opaque stars must render after the sky');
        const shader = { uniforms: {}, fragmentShader: 'void main() {\n  outputColor.a = 1.0;\n#include <mrt_output>\n}' };
        material.onBeforeCompile(shader, renderer);
        assert.equal(shader.uniforms.vrodosNativeHeadsetOutput.value, 1);
        assert.equal(shader.uniforms.toneMappingExposure.value, 1.4);
        assert.match(shader.fragmentShader, /sRGBTransferOETF\(vec4\(ACESFilmicToneMapping/);
    }
};
const presentation = context.createNativeHeadsetPresentation(self, renderer);
presentation.sync(true);
presentation.render(scene, new THREE.PerspectiveCamera());
assert.equal(draws, 1, 'One direct scene render, without a composer draw');
assert.equal(self.pmndrsNativeHeadsetDiagnostics.skyOutputPatched, true);
assert.equal(material.userData.vrodosNativeHeadsetOutput.enabled.value, 0, 'Probe/composer output must stay linear');
assert.equal(renderer.toneMapping, THREE.NoToneMapping);
assert.equal(renderer.toneMappingExposure, 0.7);
assert.equal(sky.renderOrder, -1000);
assert.equal(stars.renderOrder, -999);
assert.equal(stars.material.userData.vrodosNativeHeadsetOutput.enabled.value, 0);
const late = new THREE.MeshBasicMaterial({ toneMapped: false });
scene.add(new THREE.Mesh(new THREE.BoxGeometry(), late));
listeners.get('model-loaded')();
presentation.sync(true);
assert.equal(late.toneMapped, true, 'Late GLB materials receive the same output policy');
self.pmndrsOriginalRender = () => { throw new Error('draw failed'); };
assert.throws(() => presentation.render(scene, {}), /draw failed/);
assert.equal(material.userData.vrodosNativeHeadsetOutput.enabled.value, 0);
assert.equal(renderer.toneMapping, THREE.NoToneMapping);
assert.equal(sky.renderOrder, -1000);
presentation.sync(false);
assert.equal(basic.toneMapped, false);
assert.equal(late.toneMapped, false);
assert.equal(authored.toneMapped, true, 'Do not overwrite authored tone-mapping opt-ins');
presentation.sync(true);
presentation.dispose();
assert.equal(basic.toneMapped, false);
assert.equal(listeners.size, 0);
assert.equal(self.pmndrsNativeHeadsetDiagnostics.active, false);
console.log('Native headset presentation acceptance checks passed.');
