import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import { runtimeBuildChunks } from './build/runtime-chunks.mjs';

let lighting;
const elements = new Map();
function element(tag = 'a-entity') {
    const attrs = {};
    return {
        tagName: tag.toUpperCase(), parentNode: null,
        getAttribute: key => attrs[key] ?? null,
        hasAttribute: key => Object.hasOwn(attrs, key),
        setAttribute(key, value) { attrs[key] = value; if (key === 'id') { this.id = value; elements.set(value, this); } },
        classList: { contains: () => false }
    };
}
const context = vm.createContext({
    THREE, console, URLSearchParams, performance: { now: () => 1000 },
    document: { getElementById: id => elements.get(id), createElement: element, querySelector: () => null },
    requestAnimationFrame: () => 1, setTimeout: () => 1
});
context.window = context;
context.location = { search: '' };
context.VRODOSMaster = {};
context.VRODOS_RUNTIME_SETTINGS_CONTRACT = JSON.parse(readFileSync(new URL('../assets/runtime-settings-contract.json', import.meta.url), 'utf8'));
for (const name of ['vrodos_runtime_settings_helpers.js', 'vrodos_celestial_clock.js', 'vrodos_moon_phase.js', 'vrodos_celestial_coordinates.js', 'vrodos_light_smoothing.js', 'vrodos_shadow_maps.js', 'vrodos_shadow_runtime.js', 'vrodos_celestial_lighting.js', 'vrodos_render_quality.js', 'vrodos_cloud_occlusion.js', 'vrodos_sun_occlusion.js', 'vrodos_sun_sprite.js', 'vrodos_quality_profiles.js']) {
    if (name === 'vrodos_quality_profiles.js') {
        const create = context.VRODOSMaster.CelestialLighting.create;
        context.VRODOSMaster.CelestialLighting = { create: args => (lighting = create(args)) };
    }
    vm.runInContext(readFileSync(new URL(`../assets/js/runtime/master/${name}`, import.meta.url), 'utf8'), context);
}
const helpers = context.VRODOSMaster.SceneSettingsHelpers;
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
const config = (overrides = {}) => ({
    enabled: true, preset: 'natural', celestialMode: 'preset-time', celestialTimePreset: 'midday',
    sunElevationDeg: 62, localSunDirection: new THREE.Vector3(0, 1, 0), sunDirection: new THREE.Vector3(0, 1, 0),
    localMoonDirection: new THREE.Vector3(0, -1, 0), moonDirection: new THREE.Vector3(0, -1, 0),
    moonEnabled: true, moonIllumination: 1, starsEnabled: 'auto', useTakramLightSources: true,
    dayNightCycleEnabled: false, ...overrides
});
const night = (overrides = {}) => config({ celestialTimePreset: 'night', sunElevationDeg: -18,
    localSunDirection: new THREE.Vector3(0, -1, 0), sunDirection: new THREE.Vector3(0, -1, 0),
    localMoonDirection: new THREE.Vector3(0, 1, 0), moonDirection: new THREE.Vector3(0, 1, 0), ...overrides });
function fixture(initial = config()) {
    let activeConfig = initial;
    const scene = new THREE.Scene();
    const children = [];
    const el = Object.assign(element('a-scene'), {
        object3D: scene, camera: new THREE.PerspectiveCamera(), renderer: { shadowMap: { type: THREE.PCFShadowMap } },
        querySelectorAll: selector => selector.includes('photoreal') ? children.filter(e => e.hasAttribute('data-vrodos-photoreal-light')) : [],
        appendChild(e) { e.parentNode = this; children.push(e); },
        removeChild(e) { children.splice(children.indexOf(e), 1); elements.delete(e.id); e.parentNode = null; }
    });
    const resources = { ready: true, textures: { transmittanceTexture: {}, irradianceTexture: {} } };
    const self = Object.assign({}, helpers, {
        data: { shadowQuality: 'high', shadowUpdateMode: 'static', pmndrsToneMappingExposure: 1, pmndrsToneMappingExposureAuthored: false, pmndrsLowLightAutoExposureEnabled: true },
        el, _pmndrsTickTimeMs: 0,
        _pmndrsCloudsDiagnostics: { cloudsActive: false },
        getPmndrsAtmosphereConfig: () => activeConfig,
        ensurePmndrsAtmosphereResources: () => resources,
        getContactShadowSettings: () => ({ bias: -0.00016, normalBias: 0.018 }),
        markShadowDirty() { this.dirtyCount = (this.dirtyCount || 0) + 1; },
        markSceneCollectionsDirty() { this.collectionChanges = (this.collectionChanges || 0) + 1; }
    });
    return { self, scene, children, resources, setConfig: c => { activeConfig = c; }, config: () => activeConfig };
}

// Horizon gating and exact transition boundaries for both celestial lights.
for (const [y, expected] of [[-1, 0], [0, 0], [0.04, 0.5], [0.08, 1], [1, 1]]) {
    near(lighting.getPmndrsSunDirectLightVisibility(config({ localSunDirection: new THREE.Vector3(0, y, 0) })), expected);
}
for (const [y, expected] of [[-1, 0], [0.02, 0], [0.09, 0.5], [0.16, 1]]) {
    near(lighting.getPmndrsMoonDirectLightVisibility(night({ localMoonDirection: new THREE.Vector3(0, y, 0) })), expected);
}
assert.equal(lighting.getPmndrsMoonDirectLightVisibility(night({ moonEnabled: false })), 0);
assert.equal(lighting.getPmndrsSunDirectLightVisibility(null), 0);

// Static presets, authored exposure, automatic cycles, and config-owned cache identity.
const profileFixture = fixture();
near(profileFixture.self.getPmndrsToneMappingExposure(), 1.25);
const cached = profileFixture.config()._calibratedCelestialLightingProfile;
profileFixture.self.getPmndrsToneMappingExposure();
assert.equal(profileFixture.config()._calibratedCelestialLightingProfile, cached);
for (const [preset, elevation, expected] of [['dawn', -5, 2.35], ['sunrise', 2, 2.05], ['golden-hour', 6, 1.75], ['sunset', 3, 1.82], ['early-morning', 22, 1.35], ['night', -18, 3.15]]) {
    profileFixture.setConfig(config({ celestialTimePreset: preset, sunElevationDeg: elevation }));
    near(profileFixture.self.getPmndrsToneMappingExposure(), expected);
}
profileFixture.self.data.pmndrsToneMappingExposureAuthored = true;
near(profileFixture.self.getPmndrsToneMappingExposure(), 1);
profileFixture.setConfig(night({ dayNightCycleEnabled: true }));
near(profileFixture.self.getPmndrsToneMappingExposure(), 3.15);
profileFixture.self.data.pmndrsLowLightAutoExposureEnabled = false;
near(profileFixture.self.getPmndrsToneMappingExposure(), 1);
profileFixture.self.data.pmndrsToneMappingExposure = 50;
near(profileFixture.self.getPmndrsToneMappingExposure(), 5);
const fullMoon = night();
const noMoon = night({ moonEnabled: false });
assert.ok(helpers.getPmndrsReflectionIntensityScale.call({}, fullMoon, 'hdr') > helpers.getPmndrsReflectionIntensityScale.call({}, noMoon, 'hdr'));
assert.equal(helpers.getPmndrsReflectionIntensityScale.call({}, fullMoon, 'none'), 0);
assert.ok(lighting.getPmndrsStarsIntensity(noMoon) > lighting.getPmndrsStarsIntensity(fullMoon));
assert.equal(lighting.getPmndrsStarsIntensity(night({ starsEnabled: 'off' })), 0);
assert.equal(lighting.getPmndrsStarsIntensity(config()), 0);
assert.equal(lighting.getPmndrsRuntimeLightingSmoothingMs({ dayNightCycleEnabled: true }), 1200);
assert.equal(lighting.getPmndrsRuntimeIndirectLightingSmoothingMs({ dayNightCycleEnabled: true, dayNightCycleDurationMinutes: 1 }), 4800);
assert.equal(lighting.getPmndrsRuntimeIndirectLightingSmoothingMs({ dayNightCycleEnabled: true, dayNightCycleDurationMinutes: 0 }), 2800);
assert.equal(lighting.getPmndrsRuntimeIndirectLightingSmoothingMs({ dayNightCycleEnabled: true, dayNightCycleDurationMinutes: 100 }), 9000);

// Stub only upstream Takram-specific members; all scene objects and host policy are real.
class Sun extends THREE.DirectionalLight {
    constructor() { super(); this.sunDirection = new THREE.Vector3(); this.worldToECEFMatrix = new THREE.Matrix4(); }
    update() { this.updates = (this.updates || 0) + 1; }
}
class Sky extends THREE.LightProbe {
    constructor() { super(); this.worldToECEFMatrix = new THREE.Matrix4(); }
    update() { this.updates = (this.updates || 0) + 1; }
}
context.VRODOS_TAKRAM_ATMOSPHERE = { SunDirectionalLight: Sun, SkyLightProbe: Sky };
const live = fixture();
const apply = () => lighting.ensurePmndrsTakramHorizonLights(live.self, live.config(), 'natural', { fallback: false });
assert.equal(apply(), true);
const lights = live.self._pmndrsTakramLightSources;
assert.equal(lighting.getPmndrsTakramLightSourceCount(live.self), 5);
assert.equal(live.scene.children.length, 7);
near(lights.sunLight.intensity, 1);
assert.equal(lights.sunLight.castShadow, true);
assert.equal(lights.moonLight.castShadow, false);
assert.equal(lights.sunLight.transmittanceTexture, live.resources.textures.transmittanceTexture);
assert.equal(apply(), true);
assert.equal(live.self._pmndrsTakramLightSources, lights);
assert.equal(live.scene.children.length, 7);
live.scene.remove(lights.skyLight); apply();
assert.equal(lights.skyLight.parent, live.scene);
live.setConfig(night()); apply();
near(lights.sunLight.intensity, 0);
near(lights.moonLight.intensity, 0.08);
assert.equal(lights.sunLight.castShadow, false);
assert.equal(lights.moonLight.castShadow, true);
near(lights.moonLight.position.length(), 28);
near(lights.moonLight.position.y, 28);
assert.equal(lights.moonLight.color.getHexString(), 'b9c6df');
assert.equal(live.self._pmndrsCloudsDiagnostics.cloudCelestialShadowOwner, 'moon');
assert.ok(lights.fillLight.intensity > 0);
const clearMoon = lights.moonLight.intensity;
live.self._pmndrsCloudsDiagnostics = { cloudsActive: true, authoredCoverage: 1, cloudMoonDiskOcclusion: 1 };
live.setConfig(night()); live.self._pmndrsTickTimeMs += 1000; apply();
// The existing cloud smoother initializes on the first sample and advances on the next tick.
live.self._pmndrsTickTimeMs += 250; apply();
assert.ok(lights.moonLight.intensity < clearMoon);
assert.ok(lights.moonLight.shadow.radius > 2.4);
live.setConfig(night({ moonEnabled: false })); apply();
near(lights.moonLight.intensity, 0);
near(lights.sunLight.intensity, 0);
assert.equal(lights.moonLight.castShadow, false);
assert.ok(lights.fillLight.intensity > 0);
live.self.removePhotorealHelperLights();
assert.equal(live.self._pmndrsTakramLightSources, null);
assert.equal(live.scene.children.length, 0);
live.self.removePhotorealHelperLights();

// Required-texture failure and existing DOM helper path are preserved.
const fallback = fixture();
fallback.resources.ready = false;
assert.equal(lighting.ensurePmndrsTakramHorizonLights(fallback.self, fallback.config(), 'natural', { fallback: false }), false);
assert.equal(fallback.children.length, 0);
context.VRODOS_TAKRAM_ATMOSPHERE = undefined;
assert.equal(lighting.ensurePmndrsTakramHorizonLights(fallback.self, fallback.config(), 'natural'), false);
assert.ok(fallback.children.length > 0);
const childCount = fallback.children.length;
lighting.ensurePmndrsTakramHorizonLights(fallback.self, fallback.config(), 'natural');
assert.equal(fallback.children.length, childCount);
fallback.self.removePhotorealHelperLights();
assert.equal(fallback.children.length, 0);

const core = runtimeBuildChunks.find(chunk => chunk.id === 'core-runtime');
const index = name => core.sourceFiles.indexOf(`assets/js/runtime/master/${name}`);
assert.ok(index('vrodos_celestial_lighting.js') > index('vrodos_shadow_runtime.js'));
assert.ok(index('vrodos_quality_profiles.js') > index('vrodos_celestial_lighting.js'));
console.log('Celestial lighting profiles, horizon gates, light reuse, cloud interaction, and cleanup passed.');
