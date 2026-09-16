import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';

const source = readFileSync(new URL('../assets/js/runtime/master/vrodos_postprocessing_pmndrs.js', import.meta.url), 'utf8');
const start = source.indexOf('    function shouldUsePmndrsNativeHeadset(');
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
