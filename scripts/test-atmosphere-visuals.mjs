import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as Three from 'three';
import { runtimeBuildChunks } from './build/runtime-chunks.mjs';

const textureLoads = [], fileLoads = [], warnings = [], scheduled = [];
class TextureLoader { load(url, ready, progress, failed) { textureLoads.push({ url, ready, failed }); } }
class FileLoader {
    setResponseType(type) { assert.equal(type, 'arraybuffer'); }
    load(url, ready, progress, failed) { fileLoads.push({ url, ready, failed }); }
}
class SkyMaterial extends Three.ShaderMaterial {
    constructor(options) {
        super(); Object.assign(this, options);
        this.shadowLength = null;
        this.uniforms = {
            vrodosMoonLightDirection: { value: new Three.Vector3() },
            vrodosMoonFixedToECEFMatrix: { value: new Three.Matrix4() },
            vrodosMoonColorTexture: { value: null },
            vrodosMoonIllumination: { value: 0 },
            vrodosMoonHaloRadiusScale: { value: 0 },
            vrodosMoonHaloStrength: { value: 0 },
            vrodosMoonCloudVisibility: { value: 1 }
        };
    }
    setChanged() { this.changes = (this.changes || 0) + 1; }
}
class StarsMaterial extends Three.ShaderMaterial {
    constructor(options) {
        super(); Object.assign(this, options);
        this.uniforms = { vrodosMoonOcclusionDirection: { value: new Three.Vector3() }, vrodosMoonOcclusionCosine: { value: 1 } };
    }
}
const context = vm.createContext({ THREE: { ...Three, TextureLoader, FileLoader }, URLSearchParams,
    console: { warn: (...args) => warnings.push(args), info() {} },
    document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] }, setTimeout: (callback, delay) => { scheduled.push({ callback, delay }); return 1; }, requestAnimationFrame: callback => { scheduled.push({ callback, delay: 'frame' }); return 1; } });
const components = {};
context.AFRAME = { registerComponent: (name, definition) => { components[name] = definition; }, registerSystem() {} };
vm.runInContext(readFileSync(new URL('../assets/js/runtime/master/components/vrodos_runtime_pipeline.component.js', import.meta.url), 'utf8'), context);
const visualScheduler = Object.create(components['vrodos-atmosphere']); visualScheduler.init();
context.window = context;
context.location = { search: '' };
context.VRODOSMaster = {};
context.VRODOS_TAKRAM_ATMOSPHERE = { SkyMaterial };
for (const name of ['vrodos_light_smoothing.js', 'vrodos_atmosphere_visuals.js']) {
    vm.runInContext(readFileSync(new URL(`../assets/js/runtime/master/${name}`, import.meta.url), 'utf8'), context);
}
let now = 1000;
const flags = new Set();
const api = context.VRODOSMaster.AtmosphereVisuals.create({
    lighting: { PMNDRS_STARS_NIGHT_INTENSITY: 6, getPmndrsStarsIntensity: c => c.starsIntensity,
        getPmndrsSunDirectLightVisibility: () => 1, getPmndrsRuntimeLightingSmoothingMs: () => 0, getPmndrsRuntimeIndirectLightingSmoothingMs: () => 0 },
    cloud: { roundPmndrsCloudSunOcclusionDiagnostic: x => x, getPmndrsCloudSunOcclusionState: () => ({}),
        getPmndrsCloudMoonOcclusionState: () => ({ cloudMoonDiscVisibility: 0.5 }), PMNDRS_CLOUD_SUN_OCCLUSION_STATIC_SMOOTH_MS: 0 },
    shadow: { vectorToRoundedArray: v => v?.toArray(), applyPmndrsSunOcclusion: () => 1 },
    host: { scheduleAtmosphereVisualRefresh: (_self, callback) => visualScheduler.scheduleVisualRefresh(callback), smoothPmndrsRuntimeLightValue: context.VRODOSMaster.LightSmoothing.value,
        clamp01: x => Math.max(0, Math.min(1, x)), getPmndrsResolvedGeospatialFrame: () => null,
        hasPmndrsDebugFlag: name => flags.has(name), readPmndrsDebugNumber: (_a, _b, fallback) => fallback,
        readPmndrsAtmosphereBool: (_s, _key, fallback) => fallback, getRuntimeNowMs: () => now,
        normalizePmndrsColor: (value, fallback) => value || fallback, getPmndrsEffectiveGroundAlbedo: () => '#888888', shouldUseVrTakramVisibleSky: s => !!s.vr,
        shouldUseVrTakramDirectSkyCalibration: s => !!s.direct, shouldUsePmndrsTakramHorizonPath: () => true,
        getPresentedPmndrsAtmosphereConfig: (_s, c) => c }
});
function fixture(overrides = {}) {
    const config = { enabled: true, takramSunEnabled: true, moonEnabled: true, starsIntensity: 6,
        moonIllumination: 0.5, moonLightDirection: new Three.Vector3(1, 0, 0), moonFixedToECEFMatrix: new Three.Matrix4(),
        moonDirection: new Three.Vector3(0, 1, 0), localMoonDirection: new Three.Vector3(0, 1, 0),
        sunDirection: new Three.Vector3(0, -1, 0), inertialToECEFMatrix: new Three.Matrix4(), ...overrides };
    const state = { textures: { irradianceTexture: new Three.Texture() }, ready: true };
    const self = { _pmndrsAtmosphereState: state, el: { object3D: new Three.Scene(), renderer: { xr: { isPresenting: false } } },
        getPmndrsAtmosphereConfig: () => config, ensurePmndrsAtmosphereResources: () => state,
        applyPmndrsAtmosphereConfigToTarget: (m, c) => { m.sun = c.takramSunEnabled; m.moon = c.moonEnabled; },
        publishRuntimeFeatureState: event => { self.lastEvent = event; } };
    return { self, state, config, ensure: () => api.ensurePmndrsAtmosphereSky(self, config) };
}
// Small binary star catalogue: bright red +X and faint green +Y.
const stars = new ArrayBuffer(20);
new Int16Array(stars)[0] = 32767; new Int16Array(stars)[6] = 32767;
new Uint8Array(stars).set([0, 255, 0, 0], 6); new Uint8Array(stars).set([255, 0, 255, 0], 16);
const f = fixture();
assert.equal(f.ensure(), true);
const mesh = f.state.skyMesh, material = f.state.skyMaterial;
assert.equal(mesh.parent, f.self.el.object3D);
assert.equal(mesh.renderOrder, -1000);
assert.equal(mesh.frustumCulled, false);
assert.equal(material.irradianceTexture, f.state.textures.irradianceTexture);
assert.equal(textureLoads.length, 1); assert.equal(fileLoads.length, 1);
f.ensure();
assert.equal(f.state.skyMesh, mesh); assert.equal(f.state.skyMaterial, material);
assert.equal(textureLoads.length, 1); assert.equal(fileLoads.length, 1, 'in-flight catalogue loads are deduplicated');
const moon = new Three.Texture(); textureLoads[0].ready(moon);
assert.equal(f.state.moonTexture, moon);
assert.equal(moon.colorSpace, Three.SRGBColorSpace);
assert.equal(moon.wrapS, Three.RepeatWrapping);
assert.equal(moon.minFilter, Three.LinearMipmapLinearFilter);
assert.equal(material.uniforms.vrodosMoonColorTexture.value, moon);
assert.equal(material.defines.VRODOS_TEXTURED_MOON, '1');
assert.equal(material.defines.VRODOS_CINEMATIC_MOON_HALO, '1');
assert.equal(material.defines.VRODOS_PROJECTED_MOON_DISC, '1');
assert.equal(material.moonAngularRadius, 0.015708);
assert.equal(material.uniforms.vrodosMoonCloudVisibility.value, 0.5);
assert.equal(material.uniforms.vrodosMoonHaloStrength.value, 0.012);
assert.equal(f.self.lastEvent, 'moon-texture-ready');
fileLoads[0].ready(stars);
await f.state.starsDataPromise;
await Promise.resolve();
const fallback = f.state.starsFallbackMesh;
assert.ok(fallback instanceof Three.Points);
assert.deepEqual(Array.from(fallback.geometry.attributes.position.array), [1, 0, 0, 0, 1, 0]);
assert.equal(fallback.geometry.attributes.color.array[0], 1);
assert.ok(Math.abs(fallback.geometry.attributes.color.array[4] - 0.144) < 1e-6);
assert.ok(Math.abs(fallback.material.opacity - 0.92) < 1e-12);
const camera = new Three.PerspectiveCamera(); camera.far = 4000; camera.position.set(2, 3, 4);
fallback.onBeforeRender(null, null, camera);
assert.equal(fallback.scale.x, 2880); assert.ok(fallback.position.equals(camera.position));
const shader = { uniforms: {}, vertexShader: '#include <begin_vertex>', fragmentShader: 'void main() {}' };
fallback.material.onBeforeCompile(shader, {});
assert.ok(shader.fragmentShader.includes('discard;'));
assert.ok(shader.uniforms.vrodosMoonOcclusionCosine.value < 1);
assert.ok(shader.uniforms.vrodosMoonOcclusionDirection.value.equals(f.config.localMoonDirection));
api.hidePmndrsAtmosphereSky(f.self);
assert.equal(mesh.visible, false); assert.equal(fallback.visible, false);
assert.equal(api.showPmndrsAtmosphereSkyForSceneProbe(f.self, f.config), true);
assert.equal(api.showPmndrsAtmosphereSkyForSceneProbe(f.self, f.config), false);
f.config.starsIntensity = 0; f.ensure(); assert.equal(fallback.visible, false);
f.config.starsIntensity = 6;
context.VRODOS_TAKRAM_ATMOSPHERE.StarsGeometry = class extends Three.BufferGeometry {};
context.VRODOS_TAKRAM_ATMOSPHERE.StarsMaterial = StarsMaterial;
f.ensure();
assert.ok(f.state.starsMesh instanceof Three.Points);
assert.equal(f.state.starsMesh.visible, true); assert.equal(fallback.visible, false);
assert.ok(f.state.starsMaterial.uniforms.vrodosMoonOcclusionDirection.value.equals(f.config.moonDirection));
f.state.starsMesh.removeFromParent(); f.ensure(); assert.equal(f.state.starsMesh.parent, f.self.el.object3D);
flags.add('disableTexturedMoon'); f.ensure();
assert.equal(material.defines.VRODOS_TEXTURED_MOON, undefined);
assert.equal(material.uniforms.vrodosMoonColorTexture.value, null);
flags.clear(); f.ensure(); assert.equal(material.uniforms.vrodosMoonColorTexture.value, moon);
// Native SUN toggles support both upstream Map and plain-object defines without repeated invalidation.
for (const defines of [{}, new Map()]) {
    material.defines = defines; api.setPmndrsSkyMaterialNativeSun(f.self, true);
    const version = material.version; api.setPmndrsSkyMaterialNativeSun(f.self, true); assert.equal(material.version, version);
    api.setPmndrsSkyMaterialNativeSun(f.self, false); assert.equal(material.sun, false);
    assert.equal(defines instanceof Map ? defines.has('SUN') : Object.hasOwn(defines, 'SUN'), false);
}
// Accurate cloud phase ownership keeps the native disk muted until the release threshold.
f.self._pmndrsCloudsDiagnostics = { cloudsActive: true, accuratePhaseFunction: true };
for (const [visibility, hidden] of [[0.1, true], [0.2, true], [0.3, false]]) {
    api.syncPmndrsSkySunDiskCloudAttenuation(f.self, f.config, { cloudSkySunDiskVisibility: visibility }, 0);
    assert.equal(f.self._pmndrsCloudSunDiskTakramPhaseNativeHidden, hidden);
    assert.equal(material.sun, !hidden);
}
api.syncPmndrsSkySunDiskCloudAttenuation(f.self, f.config, { cloudSkySunDiskVisibility: 1 }, 0);
assert.equal(f.self._pmndrsCloudSunDiskTakramPhaseActive, false);
f.self.vr = true; assert.equal(api.isVrTakramVisibleSkyReadyForHandoff(f.self), true);
f.state.ready = false; assert.equal(api.isVrTakramVisibleSkyReadyForHandoff(f.self), false); f.state.ready = true;
f.self.direct = true; material.userData.vrodosVrTakramSkyDirectShaderPatched = true;
assert.equal(api.isVrTakramVisibleSkyReadyForHandoff(f.self), false);
now += 10000; assert.equal(api.isVrTakramVisibleSkyReadyForHandoff(f.self), true);
material.userData.vrodosVrTakramSkyDirectPatchFailed = true; assert.equal(api.isVrTakramVisibleSkyReadyForHandoff(f.self), false);
// Cleanup disposes each owned visual once and invalidates outstanding Moon callbacks.
const owned = [moon, material, mesh.geometry, fallback.geometry, fallback.material, f.state.starsGeometry, f.state.starsMaterial];
const disposed = new Map(); owned.forEach(resource => resource.addEventListener('dispose', () => disposed.set(resource, (disposed.get(resource) || 0) + 1)));
api.removePmndrsAtmosphereSky(f.self); api.removePmndrsAtmosphereSky(f.self);
owned.forEach(resource => assert.equal(disposed.get(resource), 1));
assert.equal(f.self.el.object3D.children.length, 0);
const stale = fixture({ starsIntensity: 0 }); stale.ensure();
const pending = textureLoads.at(-1); api.removePmndrsAtmosphereSky(stale.self);
const staleTexture = new Three.Texture(); let staleDisposals = 0; staleTexture.addEventListener('dispose', () => staleDisposals++);
pending.ready(staleTexture); assert.equal(staleDisposals, 1); assert.equal(stale.state.moonTexture, null);
const failed = fixture({ starsIntensity: 0 }); failed.ensure(); const failedLoad = textureLoads.at(-1);
failedLoad.failed(new Error('fixture failure')); const count = textureLoads.length; failed.ensure();
assert.equal(textureLoads.length, count); assert.equal(failed.state.moonTextureFailed, true);
assert.equal(failed.self.lastEvent, 'moon-texture-failed'); assert.equal(warnings.length, 1);
api.removePmndrsAtmosphereSky(failed.self);
// Execute the direct-sky shader hook and its failure diagnostics without a GPU.
const direct = fixture({ starsIntensity: 0, moonEnabled: false }); direct.self.vr = true; direct.self.direct = true;
direct.ensure();
const directMaterial = direct.state.skyMaterial;
const hook = directMaterial.onBeforeCompile; direct.ensure(); assert.equal(directMaterial.onBeforeCompile, hook);
const directShader = { uniforms: {}, fragmentShader: 'uniform vec3 groundAlbedo;\nvoid main() {\n  outputColor.a = 1.0;\n}' };
hook(directShader, {});
assert.equal(direct.state.vrTakramSkyDirectShaderPatched, true);
assert.equal(directShader.uniforms.vrodosSkyExposure.value, 24);
assert.ok(directMaterial.customProgramCacheKey().includes('lower-haze-v1'));
assert.ok(directShader.fragmentShader.includes('vrodos-direct-sky-calibration'));
hook({ uniforms: {}, fragmentShader: 'void main() {}' }, {});
assert.equal(direct.state.vrTakramSkyDirectPatchFailed, true);
assert.equal(api.isVrTakramVisibleSkyReadyForHandoff(direct.self), false);
api.removePmndrsAtmosphereSky(direct.self);
// A star catalogue completing after replacement must not attach to the old scene state.
const replaced = fixture({ moonEnabled: false }); replaced.ensure();
const replacedLoad = fileLoads.at(-1); replaced.self._pmndrsAtmosphereState = {};
replacedLoad.ready(stars); await replaced.state.starsDataPromise; await Promise.resolve();
assert.equal(replaced.state.starsMesh, undefined);
assert.equal(replaced.state.starsFallbackMesh, undefined);
replaced.self._pmndrsAtmosphereState = replaced.state; api.removePmndrsAtmosphereSky(replaced.self);
// Legacy handoff suppresses old visuals while retaining authored content and new sky/stars.
const legacyScene = new Three.Scene();
const legacy = new Three.Object3D(); legacy.name = 'environmentSky';
const authored = new Three.Object3D(); authored.name = 'model';
const newSky = new Three.Object3D(); newSky.name = 'sky'; newSky.userData.vrodosPmndrsAtmosphereSky = true;
const newStars = new Three.Object3D(); newStars.name = 'atmosphere'; newStars.userData.vrodosPmndrsAtmosphereStars = true;
legacyScene.add(legacy, authored, newSky, newStars);
api.schedulePmndrsHorizonEnvironmentCleanup({ el: { object3D: legacyScene } });
assert.equal(legacy.visible, false); assert.equal(legacy.userData.vrodosPmndrsLegacySuppressed, true);
assert.equal(authored.visible, true); assert.equal(newSky.visible, true); assert.equal(newStars.visible, true);
assert.deepEqual(scheduled.map(x => x.delay), ['frame', 50, 200]);
for (const task of scheduled) { legacy.visible = true; task.callback(); assert.equal(legacy.visible, false); }
const core = runtimeBuildChunks.find(chunk => chunk.id === 'core-runtime');
assert.ok(core.sourceFiles.indexOf('assets/js/runtime/master/vrodos_atmosphere_visuals.js') < core.sourceFiles.indexOf('assets/js/runtime/master/vrodos_quality_profiles.js'));
console.log('Atmosphere visuals: sky reuse, star loading/rendering, Moon lifecycle, cloud disk ownership, and reveal gates passed.');
