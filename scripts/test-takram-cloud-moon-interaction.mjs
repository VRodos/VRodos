#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { runtimeBuildChunks } from './build/runtime-chunks.mjs';

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};
const clamp01 = (value) => Math.max(0, Math.min(1, value));
const smoothstep = (start, end, value) => {
  const t = clamp01((value - start) / (end - start));
  return t * t * (3 - (2 * t));
};
let now = 1000;
let debugDisabled = false;
const logs = [];
const context = vm.createContext({ VRODOSMaster: {}, performance: { now: () => now } });
vm.runInContext(read('assets/js/runtime/master/vrodos_light_smoothing.js'), context);
vm.runInContext(read('assets/js/runtime/master/vrodos_cloud_occlusion.js'), context);
const cloud = context.VRODOSMaster.CloudOcclusion.create({
  clamp01, smoothstepNumber: smoothstep, lerpNumber: (a, b, t) => a + ((b - a) * t),
  hasPmndrsDebugFlag: () => debugDisabled,
  logPmndrsCloudSunOcclusionDiagnostic: (_self, diagnostics) => logs.push(diagnostics),
  getPmndrsSunDirectLightVisibility: config => config?.sunVisibility ?? 1,
  getPmndrsMoonDirectLightVisibility: config => config?.moonVisibility ?? 1
});
const fixture = (overrides = {}) => ({ _pmndrsCloudsDiagnostics: {
  cloudsActive: true, authoredCoverage: 1, cloudSunDiskOcclusion: 1, cloudMoonDiskOcclusion: 1, ...overrides
} });
const nightConfig = (overrides = {}) => ({ moonEnabled: true, moonIllumination: 1,
  sunElevationDeg: -18, localMoonDirection: { y: 1 }, ...overrides });
const moonFactors = ({ coverage, diskOcclusion, visibility = 1, illumination = 1, night = 1 }) => {
  const state = cloud.getPmndrsCloudMoonOcclusionState(
    fixture({ authoredCoverage: coverage, cloudMoonDiskOcclusion: diskOcclusion }),
    nightConfig({ moonVisibility: visibility, moonIllumination: illumination, sunElevationDeg: night ? -18 : 10 }), 0
  );
  return { strength: state.cloudMoonOcclusionStrength, direct: state.cloudMoonDirectFactor,
    indirect: state.cloudMoonIndirectFactor, reflection: state.cloudMoonReflectionFactor,
    shadowIntensity: state.cloudMoonShadowIntensityFactor, shadowRadius: state.cloudMoonShadowRadiusScale,
    discVisibility: state.cloudMoonDiscVisibility };
};

const clear = moonFactors({ coverage: 0, diskOcclusion: 0 });
assert(clear.strength === 0, 'Clear sky must not attenuate moonlight');
assert(clear.direct === 1 && clear.indirect === 1 && clear.reflection === 1, 'Clear sky factors must remain neutral');
assert(clear.discVisibility === 1, 'Clear sky must preserve the moon disc');

const partial = moonFactors({ coverage: 0.5, diskOcclusion: 0.5 });
assert(partial.strength > 0 && partial.strength < 1, 'Partial cover must produce partial moon occlusion');
assert(partial.direct < 1 && partial.direct > 0.12, 'Partial cover must dim but not extinguish moonlight');
assert(partial.shadowRadius > 1 && partial.shadowIntensity < 1, 'Partial cover must soften moon shadows');

const opaque = moonFactors({ coverage: 1, diskOcclusion: 1 });
assert(opaque.strength === 1, 'Opaque cover must reach full moon occlusion strength');
assert(Math.abs(opaque.direct - 0.12) < 1e-12, 'Opaque cover must clamp moon direct light to the intended minimum');
assert(Math.abs(opaque.discVisibility - 0.035) < 1e-12, 'Opaque cover must strongly attenuate the moon disc');
assert(opaque.reflection < partial.reflection, 'Opaque cover must dim reflections more than partial cover');

assert(moonFactors({ coverage: 1, diskOcclusion: 1, illumination: 0 }).strength === 0, 'New moon must disable cloud/moon interaction');
assert(moonFactors({ coverage: 1, diskOcclusion: 1, visibility: 0 }).strength === 0, 'Below-horizon moon must disable cloud/moon interaction');
assert(moonFactors({ coverage: 1, diskOcclusion: 1, night: 0 }).strength === 0, 'Daytime must disable cloud/moon interaction');

const washedStars = 0.65;
const starRuntime = fixture();
cloud.getPmndrsCloudMoonOcclusionState(starRuntime, nightConfig(), 0);
const recoveredStars = cloud.getPmndrsCloudMoonStarRecovery(starRuntime, nightConfig(), washedStars);
assert(recoveredStars > washedStars && recoveredStars <= 1, 'Dense moon cover must restore some globally suppressed stars');

const postprocessing = read('assets/js/runtime/master/vrodos_postprocessing_pmndrs.js');
const quality = read('assets/js/runtime/master/vrodos_quality_profiles.js') + read('assets/js/runtime/master/vrodos_atmosphere_visuals.js') + read('assets/js/runtime/master/vrodos_celestial_lighting.js') + read('assets/js/runtime/master/vrodos_cloud_occlusion.js');
const component = read('assets/js/runtime/master/components/vrodos_scene_settings.component.js');
const vendorPatch = read('scripts/build/vendor-patches.mjs');

for (const token of [
  'samplePmndrsCloudCelestialDiskOcclusion',
  'PMNDRS_CLOUD_CELESTIAL_DISK_SAMPLE_MAX_AGE_MS',
  'age <= PMNDRS_CLOUD_CELESTIAL_DISK_SAMPLE_MAX_AGE_MS',
  "samplePmndrsCloudCelestialDiskOcclusion(self, renderer, camera, atmosphereConfig, 'moon')",
  'VRODOSMoonCloudShaftsEffect',
  'PMNDRS_MOON_CLOUD_SHAFTS_FRAGMENT_SHADER',
  "quality === 'high' || quality === 'ultra'",
  "readPmndrsBool(self, 'pmndrsCloudsLightShaftsEnabled')",
  "typeof self.isMobileDevice === 'function' && self.isMobileDevice()",
  'vrodos_debug_disable_pmndrs_cloud_moon_interaction',
  'cloudMoonShaftsSkippedReason',
  "celestial === 'moon' ? 'cloudMoonDisk' : 'cloudSunDisk'"
]) {
  assert(postprocessing.includes(token), `Missing lunar cloud postprocessing hook: ${token}`);
}
assert(
  (postprocessing.match(/new VTC\.CloudsEffect/g) || []).length === 1,
  'Lunar shafts must reuse the existing cloud buffer without a second cloud raymarch'
);

for (const token of [
  'computePmndrsCloudMoonOcclusionFactors',
  'getPmndrsCloudMoonStarRecovery',
  'cloudMoonReflectionFactor',
  'cloudMoonDiscVisibility',
  'cloudCelestialShadowOwner',
  'const moonOwnsShadow = helperConfig.useMoonDirection',
  'sunLight.castShadow = shadowEnabled && useSunKey',
  'moonLight.castShadow = shadowEnabled && moonOwnsShadow',
  'uniforms.vrodosMoonCloudVisibility.value'
]) {
  assert(quality.includes(token), `Missing lunar cloud lighting hook: ${token}`);
}
assert(
  quality.includes('material.lunarRadianceScale = PMNDRS_MOON_RADIANCE_SCALE * cloudVisibility'),
  'Moon disc radiance must attenuate through Takram\'s existing material uniform'
);
assert(
  quality.indexOf('sunLight.castShadow = shadowEnabled && useSunKey') < quality.indexOf('moonLight.castShadow = shadowEnabled && moonOwnsShadow'),
  'Sun and moon shadow ownership gates must remain explicit and ordered'
);

for (const token of [
  'uniform float vrodosMoonCloudVisibility;',
  'vrodosMoonIllumination * vrodosMoonCloudVisibility',
  'vrodosMoonCloudVisibility *',
  'vrodosMoonCloudVisibility: new d(1)'
]) {
  assert(vendorPatch.includes(token), `Missing deterministic moon shader cloud patch: ${token}`);
}

for (const token of [
  'cloudMoonOcclusionStrength',
  'cloudMoonDiskOcclusion',
  'cloudMoonStarRecoveryFactor',
  'cloudMoonShaftsActive',
  'cloudCelestialShadowOwner'
]) {
  assert(component.includes(token), `Runtime feature state is missing ${token}`);
}



const near = (actual, expected, label) => assert(Math.abs(actual - expected) < 0.00006, `${label}: ${actual} != ${expected}`);
const sun = cloud.computePmndrsCloudSunOcclusionFactors({ authoredCoverage: 1, diskOcclusion: 1, sunElevationFactor: 1 });
for (const [key, value] of Object.entries({ targetStrength: 1, directFactor: 0.18, skyFactor: 0.56,
  fillFactor: 0.66, ambientFactor: 0.78, reflectionFactor: 0.68, shadowIntensityFactor: 0.7,
  shadowRadiusScale: 1.85, skySunDiskVisibility: 0.025 })) near(sun[key], value, key);
const neutral = cloud.computePmndrsCloudSunOcclusionFactors({ authoredCoverage: NaN, diskOcclusion: Infinity, sunElevationFactor: 1 });
assert(neutral.targetStrength === 0 && neutral.directFactor === 1, 'Invalid sun samples remain neutral');
const covered = cloud.computePmndrsCloudSunOcclusionFactors({ authoredCoverage: 1, diskOcclusion: 0, sunElevationFactor: 1 });
assert(covered.targetStrength === 1 && covered.skySunDiskVisibility === 1, 'Coverage attenuates light without hiding an uncovered sun disk');
const lowSun = cloud.computePmndrsCloudSunOcclusionFactors({ authoredCoverage: 1, diskOcclusion: 1, sunElevationFactor: 0.5 });
assert(lowSun.targetStrength === 0.5, 'Sun horizon visibility scales attenuation');
near(cloud.getPmndrsCloudSunShadowRadiusScale({ cloudSunOcclusionStrength: 1 }), 1.85, 'Sun radius');
near(cloud.getPmndrsCloudSunShadowIntensityFactor({ cloudSunOcclusionStrength: 1 }), 0.7, 'Sun intensity');
assert(cloud.getPmndrsCloudSunShadowIntensityFactor({ cloudSunShadowIntensityFactor: 3 }) === 1, 'Explicit shadow factor is clamped');
assert(cloud.roundPmndrsCloudSunOcclusionDiagnostic(NaN) === null, 'Invalid diagnostic values use null');

const runtime = fixture({ sentinel: 'preserved' });
const sharedDiagnostics = runtime._pmndrsCloudsDiagnostics;
const sunState = cloud.getPmndrsCloudSunOcclusionState(runtime, {}, 0, 0);
assert(sunState === sharedDiagnostics && runtime.pmndrsCloudsDiagnostics === sharedDiagnostics &&
  runtime._pmndrsCloudSunOcclusionState === sharedDiagnostics, 'Sun diagnostics retain shared object identity');
cloud.getPmndrsCloudMoonOcclusionState(runtime, nightConfig(), 0);
assert(runtime._pmndrsCloudMoonOcclusionState === sharedDiagnostics && sharedDiagnostics.sentinel === 'preserved', 'Moon diagnostics preserve unrelated fields and shared identity');
assert(logs.includes(sharedDiagnostics), 'Sun diagnostics still reach the host logger');
near(sharedDiagnostics.cloudSunOcclusionStrength, 1, 'First sun sample initializes at target');
near(sharedDiagnostics.cloudMoonOcclusionStrength, 1, 'First moon sample initializes at target');

for (const [self, config, reason] of [
  [null, {}, 'no-runtime'], [fixture({ cloudsActive: false }), {}, 'clouds-inactive'],
  [fixture({ authoredCoverage: NaN }), {}, 'invalid-coverage'], [fixture(), { sunVisibility: 0 }, 'sun-below-horizon']
]) {
  const state = cloud.getPmndrsCloudSunOcclusionState(self, config, 0, 0);
  assert((self ? state.cloudSunOcclusionReason : state.reason) === reason, reason);
  assert((self ? state.cloudSunDirectFactor : state.directFactor) === 1, 'Inactive sun attenuation is neutral');
}
for (const [self, config, reason] of [
  [null, nightConfig(), 'no-runtime'], [fixture(), null, 'no-config'],
  [fixture({ cloudsActive: false }), nightConfig(), 'clouds-inactive'],
  [fixture(), nightConfig({ moonEnabled: false }), 'moon-disabled'],
  [fixture({ authoredCoverage: NaN }), nightConfig(), 'invalid-coverage'],
  [fixture(), nightConfig({ moonVisibility: 0 }), 'moon-below-horizon'],
  [fixture(), nightConfig({ moonIllumination: 0 }), 'moon-unilluminated'],
  [fixture(), nightConfig({ sunElevationDeg: 0 }), 'not-night']
]) {
  const state = cloud.getPmndrsCloudMoonOcclusionState(self, config, 0);
  assert((self ? state.cloudMoonOcclusionReason : state.reason) === reason, reason);
  assert((self ? state.cloudMoonDirectFactor : state.directFactor) === 1, 'Inactive moon attenuation is neutral');
}
debugDisabled = true;
cloud.getPmndrsCloudMoonOcclusionState(runtime, nightConfig(), 0);
assert(sharedDiagnostics.cloudMoonOcclusionReason === 'debug-disabled', 'Debug flag disables Moon interaction');
assert(runtime._pmndrsRuntimeLightSmoothValues.takramCloudMoonOcclusionStrength === 0, 'Disabled Moon interaction clears smoothing value');
debugDisabled = false;
sharedDiagnostics.cloudsActive = false;
cloud.getPmndrsCloudSunOcclusionState(runtime, {}, 0, 0);
assert(runtime._pmndrsRuntimeLightSmoothValues.takramCloudSunOcclusionStrength === 0, 'Disabled sun interaction clears smoothing value');
assert(cloud.getPmndrsCloudMoonStarRecovery(runtime, nightConfig(), 0.65) === 0.65, 'Inactive Moon attenuation leaves star intensity unchanged');
assert(sharedDiagnostics.cloudMoonStarRecoveryFactor === 0, 'Star diagnostics reset when inactive');

const fallback = fixture({ authoredCoverage: undefined, effectiveCoverage: 1 });
cloud.getPmndrsCloudSunOcclusionState(fallback, {}, 0, 0);
cloud.getPmndrsCloudMoonOcclusionState(fallback, nightConfig(), 0);
assert(fallback._pmndrsCloudsDiagnostics.cloudSunOcclusionStrength === 1 &&
  fallback._pmndrsCloudsDiagnostics.cloudMoonOcclusionStrength === 1, 'Missing authored coverage uses effective coverage');
const authored = fixture({ authoredCoverage: 0, effectiveCoverage: 1, cloudSunDiskOcclusion: 0, cloudMoonDiskOcclusion: 0 });
cloud.getPmndrsCloudSunOcclusionState(authored, {}, 0, 0);
cloud.getPmndrsCloudMoonOcclusionState(authored, nightConfig(), 0);
assert(authored._pmndrsCloudsDiagnostics.cloudSunOcclusionStrength === 0 &&
  authored._pmndrsCloudsDiagnostics.cloudMoonOcclusionStrength === 0, 'Authored coverage takes precedence');

// Exercise actual smoothing at each policy duration, including independent component state.
for (const [cycle, direct, indirect, duration] of [[false, 3000, 4000, 900], [true, 0, 0, 1800], [true, 2500, 3000, 3000]]) {
  const self = fixture({ authoredCoverage: 0, cloudSunDiskOcclusion: 0 });
  const config = { dayNightCycleEnabled: cycle };
  cloud.getPmndrsCloudSunOcclusionState(self, config, direct, indirect);
  self._pmndrsCloudsDiagnostics.authoredCoverage = 1;
  now += 100;
  cloud.getPmndrsCloudSunOcclusionState(self, config, direct, indirect);
  near(self._pmndrsCloudsDiagnostics.cloudSunOcclusionStrength, 1 - Math.exp(-100 / duration), 'Sun smoothing duration');
}
for (const duration of [420, 2000]) {
  const self = fixture({ authoredCoverage: 0, cloudMoonDiskOcclusion: 0 });
  cloud.getPmndrsCloudMoonOcclusionState(self, nightConfig(), duration === 420 ? 0 : duration);
  self._pmndrsCloudsDiagnostics.authoredCoverage = 1;
  now += 100;
  cloud.getPmndrsCloudMoonOcclusionState(self, nightConfig(), duration === 420 ? 0 : duration);
  near(self._pmndrsCloudsDiagnostics.cloudMoonOcclusionStrength, 1 - Math.exp(-100 / duration), 'Moon smoothing duration');
}
assert(starRuntime._pmndrsCloudsDiagnostics.cloudMoonOcclusionStrength === 1, 'Other component smoothing state stays independent');
near(recoveredStars, 0.93, 'Opaque moon cover star recovery');
assert(cloud.getPmndrsCloudMoonStarRecovery(starRuntime, nightConfig(), 0) === 0, 'Disabled stars remain disabled');
const core = runtimeBuildChunks.find(chunk => chunk.id === 'core-runtime');
const cloudIndex = core.sourceFiles.indexOf('assets/js/runtime/master/vrodos_cloud_occlusion.js');
assert(cloudIndex >= 0 && cloudIndex < core.sourceFiles.indexOf('assets/js/runtime/master/vrodos_quality_profiles.js'), 'Cloud module must load before quality profiles');
console.log('Takram cloud/moon interaction tests passed.');
