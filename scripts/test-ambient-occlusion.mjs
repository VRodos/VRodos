import assert from 'node:assert/strict';
import * as THREE from 'three';
import { NormalPass } from 'postprocessing';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parse } from 'espree';
import { VRodosGtaoPass, gtaoOptionsForPreset } from '../assets/js/runtime/master/vrodos_gtao_pass.js';

for (const preset of ['soft', 'balanced', 'strong']) {
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 7000);
    const normal = new NormalPass(scene, camera);
    const pass = new VRodosGtaoPass(scene, camera, normal, preset);
    const depth = normal.renderTarget.depthTexture;
    assert.equal(depth.type, THREE.FloatType);
    assert.equal(pass.gtao.depthTexture, depth, 'AO uses matching geometry depth, not resolved beauty depth');
    assert.equal(pass.gtao.normalTexture, normal.texture);
    assert.equal(pass.gtao._renderGBuffer, false, 'reuse the shared geometry pass instead of drawing another prepass');
    for (const [width, height] of [[1920,1080], [2560,1440], [1,1]]) {
        normal.setSize(width, height); pass.setSize(width, height);
        assert.equal(normal.renderTarget.width, width, 'geometry depth and normals remain full resolution');
        assert.equal(pass.gtao.gtaoRenderTarget.width, Math.max(1, Math.round(width * gtaoOptionsForPreset(preset).resolutionScale)));
        assert.equal(pass.gtao.depthTexture, depth, 'resize preserves the owned geometry depth attachment');
    }
    const nextCamera = new THREE.PerspectiveCamera(75, 1, 0.2, 200);
    pass.mainCamera = nextCamera;
    assert.equal(pass.gtao.camera, nextCamera);
    assert.equal(normal.renderPass.camera, nextCamera, 'geometry and AO must follow the same camera');
    assert.equal(pass.fullscreenMaterial.uniforms.cameraFar.value, 200);
    const oldTarget = {}, input = { texture: new THREE.Texture() }, output = {};
    const targets = [], draws = [];
    const renderer = { getRenderTarget: () => oldTarget, setRenderTarget: t => targets.push(t), render: (...args) => draws.push(args) };
    pass.gtao.render = () => {};
    pass.render(renderer, input, output);
    assert.deepEqual(targets, [output, oldTarget]);
    assert.equal(draws.length, 1);
    assert.equal(pass.fullscreenMaterial.uniforms.inputBuffer.value, input.texture);
    pass.gtao.render = () => { throw new Error('render failure'); };
    assert.throws(() => pass.render(renderer, input, output), /render failure/);
    assert.equal(targets.at(-1), oldTarget, 'restore the render target after a failed AO draw');
    let depthDisposals = 0, normalDisposals = 0, materialDisposals = 0, targetDisposals = 0;
    normal.renderTarget.addEventListener('dispose', () => targetDisposals++);
    depth.addEventListener('dispose', () => depthDisposals++);
    normal.texture.addEventListener('dispose', () => normalDisposals++);
    pass.fullscreenMaterial.addEventListener('dispose', () => materialDisposals++);
    pass.dispose(); pass.dispose();
    assert.equal(materialDisposals, 1, 'AO cleanup is idempotent');
    assert.equal(depthDisposals, 0, 'AO must not dispose its borrowed depth');
    assert.equal(normalDisposals, 0, 'AO must not dispose cloud-shared normals');
    normal.dispose();
    assert.equal(targetDisposals, 1, 'the shared normal target releases its GPU attachments through the renderer');
}

// Stereo feasibility requires independent geometry/AO targets for each eye.
// This is a resource/camera test, not real-device WebXR acceptance.
{
    const scene = new THREE.Scene();
    const stereo = new THREE.StereoCamera();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.updateMatrixWorld(); stereo.update(camera);
    const leftNormals = new NormalPass(scene, stereo.cameraL), rightNormals = new NormalPass(scene, stereo.cameraR);
    const left = new VRodosGtaoPass(scene, stereo.cameraL, leftNormals, 'soft');
    const right = new VRodosGtaoPass(scene, stereo.cameraR, rightNormals, 'soft');
    leftNormals.setSize(1440, 1584); left.setSize(1440, 1584);
    rightNormals.setSize(1456, 1600); right.setSize(1456, 1600);
    assert.notEqual(left.gtao.depthTexture, right.gtao.depthTexture);
    assert.notEqual(left.gtao.gtaoMap, right.gtao.gtaoMap);
    assert.equal(left.mainCamera, stereo.cameraL); assert.equal(right.mainCamera, stereo.cameraR);
    assert.equal(left.gtao.gtaoRenderTarget.width, 720);
    assert.equal(right.gtao.gtaoRenderTarget.width, 728);
    let sharedGeometryDisposals = 0;
    const sharedGeometry = left.gtao._fsQuad._mesh.geometry;
    sharedGeometry.addEventListener('dispose', () => sharedGeometryDisposals++);
    left.dispose(); right.dispose(); leftNormals.dispose(); rightNormals.dispose();
    assert.equal(sharedGeometryDisposals, 0, 'one eye must not dispose shared fullscreen geometry');
}

// Run the actual AA selection helpers: enabling any AO preset must retain MSAA.
const source = readFileSync(new URL('../assets/js/runtime/master/vrodos_postprocessing_pmndrs.js', import.meta.url), 'utf8');
const names = new Set(['hasPmndrsDebugFlag', 'getPmndrsAAMode', 'getPmndrsAAPreset', 'isPmndrsAAEnabled', 'isPmndrsAmbientOcclusionEnabled', 'getPmndrsRequestedMultisampling', 'getPmndrsSmaaPreset']);
const context = vm.createContext({ window: { VRODOSMaster: { RuntimeSettings: { debugFlag: () => false } } } });
function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionDeclaration' && names.has(node.id.name)) vm.runInContext(source.slice(...node.range), context);
    for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(visit); else if (value && typeof value === 'object') visit(value);
}
visit(parse(source, { ecmaVersion: 'latest', range: true }));
for (const ao of ['off', 'soft', 'balanced', 'strong']) {
    const self = { data: { postFXEngine: 'pmndrs' }, getPmndrsAAMode: () => 'msaa', getPmndrsAAPreset: () => 'ultra', getAmbientOcclusionPreset: () => ao };
    assert.equal(context.getPmndrsRequestedMultisampling(self, { capabilities: { isWebGL2: true, maxSamples: 8 } }), 8);
    assert.equal(context.getPmndrsSmaaPreset(self, { SMAAPreset: {} }), null, 'MSAA must not silently enable SMAA');
}
console.log('Ambient occlusion resource, resizing, camera, and MSAA regression tests passed.');

