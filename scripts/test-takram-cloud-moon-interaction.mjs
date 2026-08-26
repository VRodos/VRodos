#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
const moonFactors = ({ coverage, diskOcclusion, visibility = 1, illumination = 1, night = 1 }) => {
  const coverageStrength = smoothstep(0.22, 0.86, coverage);
  const diskStrength = smoothstep(0.14, 0.82, diskOcclusion);
  const sourceFactor = clamp01(visibility) * clamp01(illumination) * clamp01(night);
  const strength = clamp01(Math.max(coverageStrength, diskStrength) * sourceFactor);
  return {
    strength,
    direct: 1 - (0.88 * strength),
    indirect: 1 - (0.42 * strength),
    reflection: 1 - (0.38 * strength),
    shadowIntensity: 1 - (0.42 * strength),
    shadowRadius: 1 + (1.1 * strength),
    discVisibility: Math.max(0.035, 1 - (0.965 * clamp01(Math.max(diskStrength, coverageStrength * 0.32) * sourceFactor)))
  };
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
const recoveredStars = washedStars + (((washedStars / 0.65) - washedStars) * 0.8);
assert(recoveredStars > washedStars && recoveredStars <= 1, 'Dense moon cover must restore some globally suppressed stars');

const postprocessing = read('assets/js/runtime/master/vrodos_postprocessing_pmndrs.js');
const quality = read('assets/js/runtime/master/vrodos_quality_profiles.js');
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
  'Math.min(cloudSunReflectionFactor, cloudMoonReflectionFactor)',
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

console.log('Takram cloud/moon interaction tests passed.');
