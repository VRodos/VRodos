#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const phaseAngles = {
  full: 0,
  'waxing-gibbous': -45,
  'first-quarter': -90,
  'waxing-crescent': -135,
  new: 180,
  'waning-crescent': 135,
  'last-quarter': 90,
  'waning-gibbous': 45
};
const illumination = (angleDeg) => (1 + Math.cos(angleDeg * Math.PI / 180)) * 0.5;
const expectedIllumination = {
  full: 1,
  'waxing-gibbous': (2 + Math.SQRT2) / 4,
  'first-quarter': 0.5,
  'waxing-crescent': (2 - Math.SQRT2) / 4,
  new: 0,
  'waning-crescent': (2 - Math.SQRT2) / 4,
  'last-quarter': 0.5,
  'waning-gibbous': (2 + Math.SQRT2) / 4
};

for (const [phase, angle] of Object.entries(phaseAngles)) {
  assert(Math.abs(illumination(angle) - expectedIllumination[phase]) < 1e-12, `${phase} illumination is incorrect`);
}

const cinematicMoonRadius = 0.015708;
const starOcclusionFeather = 0.002094;
const starOcclusionCosine = Math.cos(cinematicMoonRadius + starOcclusionFeather);
assert(Math.abs(cinematicMoonRadius * 2 * 180 / Math.PI - 1.8) < 0.001, 'Cinematic moon diameter is not 1.8 degrees');
assert(1 > starOcclusionCosine, 'A star centered on the moon must be occluded');
assert(
  Math.cos(cinematicMoonRadius + starOcclusionFeather * 2) < starOcclusionCosine,
  'A star beyond the moon edge feather must remain visible'
);
assert(illumination(0) * 0.045 > illumination(90) * 0.045, 'Full-moon halo must exceed quarter-moon halo');
assert(illumination(180) * 0.045 === 0, 'New-moon halo must be disabled');

const contract = JSON.parse(read('assets/runtime-settings-contract.json'));
const phaseContract = contract.sceneSettings.pmndrsMoonPhase;
assert(phaseContract.metadataKey === 'aframePmndrsMoonPhase', 'Moon phase metadata key is incorrect');
assert(phaseContract.wireKey === 'pmndrsMoonPhase', 'Moon phase wire key is incorrect');
assert(phaseContract.default === 'auto', 'Invalid or missing phase must normalize to auto');
assert(phaseContract.allowed.length === 9, 'Moon phase contract must contain auto plus eight named phases');
for (const phase of ['auto', ...Object.keys(phaseAngles)]) {
  assert(phaseContract.allowed.includes(phase), `Moon phase contract is missing ${phase}`);
}

const runtimeSource = read('assets/js/runtime/master/vrodos_quality_profiles.js');
for (const forbidden of [
  'createPmndrsMoonTexture',
  "new THREE.Sprite(state.moonMaterial)",
  "state.moonMesh.name = 'vrodosPmndrsAtmosphereMoon'"
]) {
  assert(!runtimeSource.includes(forbidden), `Old sprite moon path remains: ${forbidden}`);
}
for (const required of [
  'PMNDRS_MOON_ANGULAR_RADIUS = 0.015708',
  'PMNDRS_MOON_ANGULAR_DIAMETER_DEG = 1.8',
  'PMNDRS_MOON_RADIANCE_SCALE = Math.pow',
  'PMNDRS_MOON_VISIBILITY_BOOST = 8.0',
  'PMNDRS_MOON_HALO_RADIUS_SCALE = 3.2',
  'PMNDRS_MOON_HALO_STRENGTH = 0.045',
  'PMNDRS_MOON_STAR_OCCLUSION_FEATHER_RAD = 0.002094',
  'PMNDRS_NIGHT_MOON_LIGHT_INTENSITY = 0.34',
  "PMNDRS_NIGHT_MOON_LIGHT_COLOR = '#c4d2ff'",
  'material.lunarRadianceScale = PMNDRS_MOON_RADIANCE_SCALE',
  "material.defines.VRODOS_CINEMATIC_MOON_HALO = '1'",
  'syncPmndrsTakramStarMoonOcclusion(state.starsMaterial, config, state)',
  'installPmndrsFallbackStarMoonOcclusion(state.starsFallbackMaterial)',
  'const fallbackVisible = state.starsMesh',
  '[VRodos] Moon state:',
  "normalizePmndrsMoonPhase(this.data.pmndrsMoonPhase)",
  'applyPmndrsMoonPhaseConfig(config',
  "astronomicalAuto ? 'astronomical' : 'author-controlled-night'",
  'config.moonDirection = buildPmndrsMoonDirection(config.sunDirection)',
  'illuminatedMoonVisibility',
  "vrodos_debug_disable_textured_moon",
  'moonTextureFailed',
  'native-smooth'
]) {
  assert(runtimeSource.includes(required), `Missing textured moon runtime hook: ${required}`);
}

const bundle = read('assets/js/runtime/master/lib/vrodos-takram-atmosphere.bundle.js');
for (const marker of [
  'VRODOS_TEXTURED_MOON_SHADER_PATCH',
  'VRODOS_TEXTURED_MOON',
  'vrodosMoonLightDirection',
  'vrodosMoonFixedToECEFMatrix',
  'vrodosMoonColorTexture',
  'VRODOS_MOON_COLOR_GAIN',
  'VRODOS_MOON_COLOR_SATURATION',
  'moonLuminance',
  'orenNayarDiffuse(moonLightDirection',
  'VRODOS_CINEMATIC_MOON_HALO_SHADER_PATCH',
  '#ifdef VRODOS_CINEMATIC_MOON_HALO',
  '#endif // VRODOS_CINEMATIC_MOON_HALO',
  'vrodosMoonIllumination',
  'vrodosMoonHaloRadiusScale',
  'vrodosMoonHaloStrength',
  'VRODOS_MOON_STAR_OCCLUSION_SHADER_PATCH',
  'vrodosMoonOcclusionDirection',
  'vrodosMoonOcclusionCosine'
]) {
  assert(bundle.includes(marker), `Generated Takram bundle is missing ${marker}`);
}

const manifest = JSON.parse(read('assets/runtime-version-manifest.json'));
const moonPath = manifest.takram.assets.moonColorPath;
assert(moonPath === 'assets/vendor/nasa-moon/lroc_color_poles_1k.jpg', 'Runtime manifest moon path is incorrect');
const moonAbsolutePath = resolve(root, moonPath);
assert(existsSync(moonAbsolutePath), 'NASA moon color asset is missing');
assert(statSync(moonAbsolutePath).size > 100000, 'NASA moon color asset is unexpectedly small');
assert(read('assets/vendor/nasa-moon/README.md').includes('NASA\'s Scientific Visualization Studio'), 'NASA attribution is missing');

const runtimeManager = read('includes/class-vrodos-render-runtime-manager.php');
assert(runtimeManager.includes("'takram_moon_color_url'"), 'Runtime manager does not expose the moon URL');
assert(runtimeManager.includes("'moonColorPath'"), 'Runtime manager does not validate the moon manifest path');
assert(read('includes/class-vrodos-compiler-scene-settings.php').includes("'pmndrsMoonPhase'"), 'Compiler does not serialize moon phase');

const compileTemplate = read('templates/pages/vrodos-edit-3D-scene-CompileDialogue.php');
const compileDialogue = read('assets/js/editor/ui/compile/vrodos_compile_dialogue.js');
const compileAtmosphere = read('assets/js/editor/ui/compile/vrodos_compile_ui_atmosphere.js');
assert(compileTemplate.includes('id="compilePmndrsMoonPhaseSelect"'), 'Compile UI moon phase select is missing');
assert(compileDialogue.includes("controls.pmndrsMoonPhase.addEventListener('change'"), 'Compile UI moon phase listener is missing');
assert(compileAtmosphere.includes('controls.pmndrsMoonPhase.disabled = !isEnabled ||'), 'Moon phase select does not follow atmosphere/moon enabled state');
assert(compileAtmosphere.includes('scene.aframePmndrsMoonPhase = normalizeMoonPhase'), 'Compile UI does not persist normalized moon phase metadata');

console.log('Takram textured moon tests passed.');
