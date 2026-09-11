import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import { runtimeBuildChunks } from './build/runtime-chunks.mjs';

const calls = [];
const smoothing = [];
const context = vm.createContext({
    window: { devicePixelRatio: 2 }, THREE,
    VRODOSMaster: {
        LightSmoothing: { value: (...args) => { smoothing.push(args); return args[2]; } },
        RenderPixelBudget: { apply: (_self, _renderer, ratio) => ratio }
    },
    vrodosEnhanceMeshMaterial: (material, overrides, options) => calls.push({ material, overrides, options }),
    vrodosGetExplicitMaterialOverrides: () => ({ roughness: 0.25 })
});
vm.runInContext(readFileSync(new URL('../assets/js/runtime/master/vrodos_render_quality.js', import.meta.url), 'utf8'), context);
let smoothingMs = 100;
let sunFactor = 0.8;
let moonFactor = 0.6;
const helpers = context.VRODOSMaster.RenderQuality.create({
    shadow: {
        isHiddenNavmeshMaterial: material => material.userData?.hidden === true,
        getEntityShadowRole: () => 'receiver',
        isFlatMediaShadowEntity: entity => entity.media === true,
        getObjectShadowRole: () => 'receiver',
        isWorldLightingParticipantMesh: () => true,
        objectEntityChainHas: (node, predicate) => Boolean(node.el && predicate(node.el))
    },
    lighting: {
        getPmndrsExposureValue: () => 1.4,
        getPmndrsRuntimeLightingSmoothingMs: () => smoothingMs,
        getPmndrsNightReflectionIntensityScale: () => 0.5
    },
    host: {
        getThreeToneMappingForPmndrsMode: () => THREE.NeutralToneMapping,
        normalizeReflectionOcclusionMode: value => value || 'balanced',
        getPmndrsCloudSunOcclusionState: () => ({ cloudReflectionFactor: sunFactor }),
        getPmndrsCloudMoonOcclusionState: () => ({ cloudMoonReflectionFactor: moonFactor })
    }
});
const scene = new THREE.Scene();
scene.environment = new THREE.Texture();
const ratios = [];
const dirty = [];
const renderer = {
    setPixelRatio: ratio => ratios.push(ratio), sortObjects: false,
    toneMappingExposure: 1, toneMapping: THREE.NoToneMapping, outputColorSpace: '',
    capabilities: { getMaxAnisotropy: () => 16 }
};
const self = {
    ...helpers, data: { renderQuality: 'high', shadowQuality: 'high', postFXEngine: 'legacy' },
    el: { renderer, object3D: scene, getAttribute: () => ({ sortTransparentObjects: 'true' }) },
    getAAQualityPixelRatioTarget: () => 1.5, shouldUseEdgeAAOversample: () => false,
    getAmbientOcclusionPreset: () => 'balanced', getEffectiveReflectionSource: () => 'hdr',
    getPmndrsAtmosphereConfig: () => ({}), getCachedSceneQuery: () => [],
    markShadowDirty: reason => dirty.push(reason)
};
self.applyRenderQualityProfile();
assert.deepEqual(ratios, [2]);
assert.equal(renderer.toneMappingExposure, 1.06);
assert.equal(renderer.toneMapping, THREE.ACESFilmicToneMapping);
assert.equal(renderer.outputColorSpace, THREE.SRGBColorSpace);
assert.equal(renderer.sortObjects, true);
self.data.postFXEngine = 'pmndrs';
self.shouldUsePostProcessing = () => true;
self.applyRenderQualityProfile();
assert.equal(renderer.toneMapping, THREE.NoToneMapping);
assert.equal(renderer.toneMappingExposure, 1.4);
assert.equal(smoothing.at(-1)[1], 'takramToneMappingExposure');
self.shouldUsePostProcessing = () => false;
self.isImmersiveXrActive = () => true;
self.applyRenderQualityProfile();
assert.equal(ratios.length, 2, 'immersive XR must not set renderer pixel ratio');
assert.equal(renderer.toneMapping, THREE.NeutralToneMapping);
self.isImmersiveXrActive = () => false;
self.data.renderQuality = 'performance';
self.getRenderQualityLevel = () => 'performance';
self.applyRenderQualityProfile();
assert.equal(ratios.at(-1), 0.9);
self.shouldUseEdgeAAOversample = () => true;
self.getEdgeAAStrengthFactor = () => 0.5;
self.applyRenderQualityProfile();
assert.equal(ratios.at(-1), 1.5);
helpers.applyRenderQualityProfile.call({ el: {} });

const shared = new THREE.MeshStandardMaterial();
const other = new THREE.MeshStandardMaterial();
const hidden = new THREE.MeshStandardMaterial();
hidden.userData.hidden = true;
const geometry = new THREE.BoxGeometry();
const root = new THREE.Group();
root.add(new THREE.Mesh(geometry, [shared, hidden]), new THREE.Mesh(geometry, shared));
const media = { media: true, getObject3D: () => root };
scene.add(root, new THREE.Mesh(geometry, [shared, other]));
self.getCachedSceneQuery = () => [media, null, { getObject3D: () => null }];
self._vrodosReflectionEnvironmentIntensityScale = 0.9;
self.applyMaterialProfiles();
assert.equal(calls.length, 2, 'shared materials are enhanced once and hidden navmesh materials skipped');
assert.equal(calls[0].material, shared);
assert.equal(calls[0].overrides.roughness, 0.25, 'explicit entity overrides win over scene traversal');
assert.equal(calls[0].overrides.vrodosReadableMedia, true);
assert.equal(calls[0].overrides.vrodosShadowReceiver, true);
assert.equal(calls[1].overrides.vrodosReadableMedia, undefined);
assert.equal(calls[0].options.maxAnisotropy, 16);
assert.equal(calls[0].options.shadowAwareReflections, true);
assert.equal(calls[0].options.environmentMap, scene.environment);
assert.equal(calls[0].options.reflectionIntensityScale, 0.9, 'refresh retains live smoothing state');
assert.deepEqual(Array.from(self._vrodosReflectionIntensityMaterials), [shared, other]);
assert.deepEqual(dirty, ['material-profile']);
smoothingMs = 0;
self.isVrPresentationActive = () => true;
self.applyMaterialProfiles();
assert.equal(calls.at(-1).options.shadowAwareReflections, false);
assert.equal(calls.at(-1).options.reflectionIntensityScale, 0.3);
self.isVrPresentationActive = () => false;
self.data.reflectionOcclusionMode = 'off';
self.applyMaterialProfiles();
assert.equal(calls.at(-1).options.shadowAwareReflections, false);

context.window.vrodosGetTargetEnvMapIntensity = (_material, options) => options.reflectionIntensityScale * 2;
self.updateReflectionEnvironmentIntensity(123);
assert.equal(scene.environmentIntensity, 0.3, 'stronger cloud attenuation combines with night scale');
assert.equal(shared.envMapIntensity, 0.6);
assert.equal(other.envMapIntensity, 0.6);
assert.equal(self._vrodosReflectionEnvironmentLastUpdateMs, 123);
assert.equal(smoothing.at(-1)[1], 'reflectionEnvironmentIntensity:hdr');
sunFactor = 0.2;
moonFactor = 0.9;
for (const source of ['scene-probe', 'takram-sky']) {
    self.updateReflectionEnvironmentIntensity(124, source);
    assert.equal(scene.environmentIntensity, 0.1);
    assert.equal(smoothing.at(-1)[1], `reflectionEnvironmentIntensity:${source}`);
}
const count = smoothing.length;
self.updateReflectionEnvironmentIntensity(125, 'none');
scene.environment = null;
self.updateReflectionEnvironmentIntensity(126, 'hdr');
assert.equal(smoothing.length, count, 'inactive reflection sources leave state untouched');
assert.equal(self._vrodosReflectionEnvironmentLastUpdateMs, 124);
geometry.dispose();
for (const material of [shared, other, hidden]) material.dispose();

const core = runtimeBuildChunks.find(chunk => chunk.id === 'core-runtime');
const index = core.sourceFiles.indexOf('assets/js/runtime/master/vrodos_render_quality.js');
assert.ok(index >= 0 && index < core.sourceFiles.indexOf('assets/js/runtime/master/vrodos_quality_profiles.js'));
console.log('Render quality, material traversal, and reflection intensity tests passed.');
