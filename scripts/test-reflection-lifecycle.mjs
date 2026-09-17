import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parse } from 'espree';
import * as Three from 'three';

const definitions = {}, loads = [], generators = [], warnings = [];
let now = 1000, conversionFailure = false, compileFailure = false;
class HDRLoader {
    load(url, ready, progress, failed) { loads.push({ url, ready, failed }); }
}
class PMREMGenerator {
    constructor() { this.disposals = 0; generators.push(this); }
    compileCubemapShader() {}
    compileEquirectangularShader() { if (compileFailure) throw new Error('compile failed'); }
    fromEquirectangular() {
        if (conversionFailure) throw new Error('conversion failed');
        return new Three.WebGLRenderTarget(16, 16);
    }
    fromCubemap() { return new Three.WebGLRenderTarget(16, 16); }
    dispose() { this.disposals++; }
}
const context = vm.createContext({ THREE: { ...Three, HDRLoader, PMREMGenerator },
    console: { log() {}, info() {}, warn: (...args) => warnings.push(args) },
    performance: { now: () => now }, document: { getElementById: () => null },
    AFRAME: { registerComponent: (name, def) => { definitions[name] = def; }, registerSystem() {} }
});
context.window = context;
context.VRODOSMaster = {};
for (const file of ['vrodos_runtime_resources.js', 'vrodos_light_smoothing.js', 'vrodos_scene_probe.js', 'components/vrodos_runtime_pipeline.component.js']) {
    vm.runInContext(readFileSync(new URL(`../assets/js/runtime/master/${file}`, import.meta.url), 'utf8'), context);
}
function attach(el, settings) {
    const owner = Object.assign(Object.create(definitions['vrodos-reflections']), { el });
    owner.init(); el.components['vrodos-reflections'] = owner;
    context.VRODOSMaster.Reflections.bind(owner, settings);
    return owner;
}
function fixture(source = 'hdr') {
    const scene = new Three.Scene();
    const el = { object3D: scene, renderer: {}, camera: new Three.PerspectiveCamera(), components: {}, querySelectorAll: () => [] };
    const settings = { ...context.VRODOSMaster.SceneSettingsHelpers, el,
        data: { envMapPreset: 'studio', selChoice: '1' }, source, resolution: 128, mode: 'static',
        getEffectiveReflectionSource() { return this.source; },
        getEffectiveEnvMapPreset() { return this.data.envMapPreset; },
        getEnvMapPath() { return `${this.data.envMapPreset}.hdr`; },
        getSceneProbeResolution() { return this.resolution; },
        getSceneProbeUpdateMode() { return this.mode; },
        getPmndrsAtmosphereConfig() { return this.config || { enabled: false }; },
        applyMaterialProfiles() { this.materialUpdates = (this.materialUpdates || 0) + 1; }
    };
    el.components['scene-settings'] = settings;
    return { el, scene, settings, owner: attach(el, settings) };
}
function disposals(resource) {
    let count = 0; resource.addEventListener('dispose', () => count++);
    return () => count;
}
function completeLoad(load = loads.at(-1)) {
    const texture = new Three.Texture(); const count = disposals(texture);
    load.ready(texture); assert.equal(count(), 1, 'loaded input texture is released');
}
const f = fixture();
assert.throws(() => { f.settings._envMapRenderTarget = null; }, TypeError);
f.settings.applyEnvMapProfile();
const firstLoad = loads.at(-1), firstCount = loads.length;
f.settings.applyEnvMapProfile(); assert.equal(loads.length, firstCount, 'pending preset is deduplicated');
completeLoad(firstLoad);
assert.equal(generators.at(-1).disposals, 1);
const hdr = f.owner._envMapRenderTarget, hdrDisposals = disposals(hdr);
assert.equal(f.scene.environment, hdr.texture);
assert.equal(f.settings._envMapRenderTarget, hdr);
f.settings.applyEnvMapProfile(); assert.equal(loads.length, firstCount, 'loaded preset is reused');

// Replacement invalidates old requests; source changes and removal release existing maps.
f.settings.data.envMapPreset = 'day'; f.settings.applyEnvMapProfile();
assert.equal(hdrDisposals(), 1);
const stale = loads.at(-1);
f.settings.data.envMapPreset = 'night'; f.settings.applyEnvMapProfile();
const latest = loads.at(-1);
completeLoad(stale); assert.equal(f.owner._envMapRenderTarget, null);
stale.failed(new Error('old error')); assert.equal(f.settings._hdrEnvMapFailed, false);
completeLoad(latest);
const current = f.owner._envMapRenderTarget, currentDisposals = disposals(current);
f.settings.source = 'none'; f.settings.applyEnvMapProfile();
assert.equal(currentDisposals(), 1); assert.equal(f.scene.environment, null);

f.settings.source = 'hdr'; f.settings.applyEnvMapProfile();
const afterRemoval = loads.at(-1);
delete f.el.components['vrodos-reflections']; f.owner.remove(); f.owner.remove();
assert.equal(f.owner.settings, null); assert.equal(f.settings.reflectionRuntime, null);
const replacement = attach(f.el, f.settings);
f.settings.applyEnvMapProfile(); const replacementLoad = loads.at(-1);
completeLoad(afterRemoval); afterRemoval.failed(new Error('late error'));
assert.equal(replacement._hdrEnvMapFailed, false); assert.equal(replacement._hdrEnvMapLoading, true);
assert.equal(f.scene.environment, null);
completeLoad(replacementLoad);
const replacementTarget = replacement._envMapRenderTarget, replacementDisposals = disposals(replacementTarget);
replacement.remove(); assert.equal(replacementDisposals(), 1); assert.equal(f.scene.environment, null);
replacement.remove(); assert.equal(replacementDisposals(), 1);

// Removing while a replacement loads keeps its late completion from restoring an environment.
const pendingReplacement = fixture(); pendingReplacement.settings.applyEnvMapProfile(); completeLoad();
pendingReplacement.settings.data.envMapPreset = 'replacement'; pendingReplacement.settings.applyEnvMapProfile();
assert.equal(pendingReplacement.scene.environment, null, 'retain the existing loading presentation');
pendingReplacement.owner.remove(); assert.equal(pendingReplacement.scene.environment, null);
completeLoad(); assert.equal(pendingReplacement.scene.environment, null);

// Temporary input/generator cleanup on conversion and shader preparation failure.
for (const failCompile of [false, true]) {
    const broken = fixture(); broken.settings.applyEnvMapProfile();
    conversionFailure = !failCompile; compileFailure = failCompile;
    completeLoad(); conversionFailure = false; compileFailure = false;
    assert.equal(generators.at(-1).disposals, 1);
    assert.equal(broken.owner._envMapRenderTarget, null);
    assert.equal(broken.settings._hdrEnvMapFailed, true);
    assert.match(broken.settings._hdrEnvMapError, /failed/);
    broken.owner.remove();
}
const failed = fixture(); failed.settings.applyEnvMapProfile();
loads.at(-1).failed(new Error('network failure'));
assert.equal(failed.settings._hdrEnvMapLoading, false);
assert.equal(failed.settings._hdrEnvMapError, 'network failure'); failed.owner.remove();

// A disabled component must not allocate, and removing one owner preserves another scene.
const inactive = fixture(); inactive.owner.remove(); delete inactive.el.components['vrodos-reflections'];
const beforeInactive = generators.length;
assert.equal(inactive.settings.ensureSceneProbeResources(), false);
assert.equal(inactive.settings.applyEnvMapProfile(), false);
assert.equal(generators.length, beforeInactive);
const independent = fixture('scene-probe'); independent.settings.ensureSceneProbeResources();
const independentTarget = independent.owner._sceneProbeCubeRenderTarget;
const independentDisposals = disposals(independentTarget);
const probe = fixture('scene-probe'); probe.settings.applyEnvMapProfile();
const cube = probe.owner._sceneProbeCubeRenderTarget, cubeDisposals = disposals(cube);
const camera = probe.owner._sceneProbeCubeCamera, generator = probe.owner._sceneProbePmremGenerator;
probe.settings.ensureSceneProbeResources();
assert.equal(probe.owner._sceneProbeCubeRenderTarget, cube); assert.equal(probe.owner._sceneProbeCubeCamera, camera);
probe.settings.resolution = 256; probe.settings.ensureSceneProbeResources();
assert.equal(cubeDisposals(), 1); assert.equal(camera.parent, null);
assert.equal(probe.owner._sceneProbeCubeRenderTarget.width, 256);
assert.equal(probe.owner._sceneProbePmremGenerator, generator);
assert.equal(independentDisposals(), 0);

// Capture executes actual exclusion/restoration and exposes the composer guard.
const star = new Three.Object3D(); star.userData.vrodosPmndrsAtmosphereStars = true; probe.scene.add(star);
let captures = 0, failCapture = false;
probe.owner._sceneProbeCubeCamera.update = () => {
    captures++; assert.equal(probe.settings.sceneProbeCapturing, true);
    assert.equal(star.visible, false); assert.equal(probe.scene.environment, null);
    if (failCapture) throw new Error('capture failed');
};
assert.equal(probe.settings.captureSceneProbe(2000), true);
assert.equal(star.visible, true); assert.equal(probe.settings.sceneProbeCapturing, false);
const pmrem = probe.owner._sceneProbePmremTarget, pmremDisposals = disposals(pmrem);
failCapture = true; assert.equal(probe.settings.captureSceneProbe(2100), false); failCapture = false;
assert.equal(probe.scene.environment, pmrem.texture); assert.equal(star.visible, true);
assert.equal(probe.settings.sceneProbeCapturing, false); assert.equal(pmremDisposals(), 0);
probe.owner.tick(10000); assert.equal(captures, 2, 'static capture does not repeat without dirty state');
now = 10000; probe.settings.requestSceneProbeRefresh(true);
probe.owner.tick(10349); assert.equal(captures, 2);
probe.owner.tick(10350); assert.equal(captures, 3, '350ms model settle');
probe.settings.requestSceneProbeRefresh(false);
probe.owner.tick(10849); assert.equal(captures, 3);
probe.owner.tick(10850); assert.equal(captures, 4, '500ms capture cooldown');
probe.settings.mode = 'slow-dynamic';
probe.el.camera.position.x = 6; probe.owner.tick(16000); assert.equal(captures, 4, '6m is not greater than 6m');
probe.el.camera.position.x = 6.01; probe.owner.tick(16000); assert.equal(captures, 5);
now = 16001; probe.settings.requestSceneProbeRefresh(true);
probe.owner.tick(20999); assert.equal(captures, 5);
probe.owner.tick(21000); assert.equal(captures, 6, '5s slow-dynamic cooldown');
now = 26000; probe.settings.requestSceneProbeRefresh(true);
probe.owner.tick(26749); assert.equal(captures, 6);
probe.owner.tick(26750); assert.equal(captures, 7, '750ms slow-dynamic settle');
probe.el.camera.rotation.y = Three.MathUtils.degToRad(46);
probe.owner.tick(31750); assert.equal(captures, 8, 'yaw change triggers slow-dynamic capture');
assert.equal(pmremDisposals(), 1);
const probeCamera = probe.owner._sceneProbeCubeCamera;
probe.owner.remove(); assert.equal(probeCamera.parent, null); assert.equal(generator.disposals, 1);
assert.equal(probe.scene.environment, null); assert.equal(independentDisposals(), 0);
independent.owner.remove(); assert.equal(independentDisposals(), 1);

// Takram uses one global PMREM, retries readiness at 500ms, and only updates intensity thereafter.
const sky = fixture('takram-sky'); let skyCaptures = 0, hidden = 0, targetScale = 0.8;
context.VRODOS_TAKRAM_ATMOSPHERE = {};
sky.settings.config = { enabled: true, dayNightCycleEnabled: false };
sky.settings.showPmndrsAtmosphereSkyForSceneProbe = () => true;
sky.settings.hidePmndrsAtmosphereSky = () => hidden++;
sky.settings.getPmndrsReflectionIntensityScale = () => targetScale;
sky.settings._pmndrsAtmosphereState = { ready: false };
sky.settings.applyEnvMapProfile();
sky.owner._sceneProbeCubeCamera.update = () => { skyCaptures++; assert.equal(sky.settings.sceneProbeCapturing, true); };
sky.owner.tick(1000); assert.equal(skyCaptures, 0); assert.equal(hidden, 1);
sky.settings._pmndrsAtmosphereState = { ready: true, skyMesh: {}, skyMaterial: {}, textures: {
    irradianceTexture: {}, scatteringTexture: {}, transmittanceTexture: {}
} };
sky.owner.tick(1499); assert.equal(skyCaptures, 0);
sky.owner.tick(1500); assert.equal(skyCaptures, 1);
const skyTarget = sky.owner._takramSkyPmremTarget, skyDisposals = disposals(skyTarget);
assert.equal(sky.scene.environment, skyTarget.texture);
assert.equal(sky.scene.environmentIntensity, 0.8);
targetScale = 0.2;
sky.owner.tick(1600);
assert.ok(Math.abs(sky.scene.environmentIntensity - (0.8 + (0.2 - 0.8) * (1 - Math.exp(-100 / 900)))) < 1e-12);
sky.settings.config.dayNightCycleEnabled = true;
const previousScale = sky.scene.environmentIntensity;
sky.owner.tick(1700);
assert.ok(Math.abs(sky.scene.environmentIntensity - (previousScale + (0.2 - previousScale) * (1 - Math.exp(-100 / 420)))) < 1e-12);
sky.settings.requestTakramSkyEnvironmentRefresh(); sky.owner.tick(100000);
assert.equal(skyCaptures, 1, 'day/night and dirty requests do not periodically recapture the global sky');
sky.settings.source = 'scene-probe'; sky.settings.applyEnvMapProfile(); assert.equal(skyDisposals(), 1);
sky.owner.remove();

// Reflection smoothing uses independent owner state but the existing scene clock and formulas.
const smooth = fixture(); smooth.settings._pmndrsTickTimeMs = 1000;
assert.equal(smooth.owner.smoothEnvironmentIntensity(1, 900, 'hdr'), 1);
smooth.settings._pmndrsTickTimeMs = 1100;
assert.ok(Math.abs(smooth.owner.smoothEnvironmentIntensity(0, 900, 'hdr') - Math.exp(-100 / 900)) < 1e-12);
assert.equal(smooth.settings._pmndrsRuntimeLightSmoothValues, undefined);
const external = new Three.Texture(); smooth.scene.environment = external;
smooth.owner.remove(); assert.equal(smooth.scene.environment, external, 'do not clear another owner environment');

const fixedHdr = fixture();
const fixedTextures = [new Three.Texture(), new Three.Texture()];
fixedHdr.scene.environment = fixedTextures[0];
fixedHdr.settings.isVrRuntimeHeadsetProfile = () => true;
fixedHdr.settings.isPmndrsDayNightCycleActive = () => false;
fixedHdr.settings._vrodosReflectionIntensityMaterials = [];
let fixedIntensityUpdates = 0;
fixedHdr.settings.updateReflectionEnvironmentIntensity = () => { fixedIntensityUpdates++; };
fixedHdr.owner.tick(1000); fixedHdr.owner.tick(1100);
assert.equal(fixedIntensityUpdates, 1, 'fixed headset HDR intensity is applied once');
fixedHdr.settings._vrodosReflectionIntensityMaterials = [];
fixedHdr.owner.tick(1200);
assert.equal(fixedIntensityUpdates, 2, 'newly profiled materials receive intensity');
fixedHdr.scene.environment = fixedTextures[1];
fixedHdr.owner.tick(1300);
assert.equal(fixedIntensityUpdates, 3, 'a replacement HDR environment refreshes intensity');
fixedHdr.settings.data = { ...fixedHdr.settings.data };
fixedHdr.owner.tick(1400);
assert.equal(fixedIntensityUpdates, 4, 'scene settings changes refresh fixed intensity');
fixedHdr.settings._pmndrsCloudsDiagnostics = { cloudsActive: true };
fixedHdr.owner.tick(1500); fixedHdr.owner.tick(1600);
assert.equal(fixedIntensityUpdates, 6, 'active clouds retain per-frame intensity updates');
fixedHdr.settings._pmndrsCloudsDiagnostics.cloudsActive = false;
fixedHdr.owner.tick(1700); fixedHdr.owner.tick(1800);
assert.equal(fixedIntensityUpdates, 7, 'static updates resume after clouds stop');
fixedHdr.owner.remove();
fixedTextures.forEach(texture => texture.dispose());

// Exercise the authored settings teardown, including the component-map removal order.
const settingsSource = readFileSync(new URL('../assets/js/runtime/master/components/vrodos_scene_settings.component.js', import.meta.url), 'utf8');
const ast = parse(settingsSource, { ecmaVersion: 'latest', range: true });
const registration = ast.body.find(node => node.type === 'ExpressionStatement' && node.expression.type === 'CallExpression' && node.expression.callee.property?.name === 'registerComponent');
const removeNode = registration.expression.arguments[1].properties.find(property => property.key.name === 'remove').value;
const removeSettings = vm.runInContext(`(${settingsSource.slice(...removeNode.range)})`, context);
const teardown = fixture(); teardown.settings.applyEnvMapProfile(); const teardownLoad = loads.at(-1);
const order = [];
context.window.removeEventListener = () => {}; context.document.removeEventListener = () => {};
teardown.el.removeEventListener = () => {};
teardown.el.removeAttribute = name => {
    order.push(name);
    if (name === 'vrodos-reflections') { delete teardown.el.components[name]; teardown.owner.remove(); }
};
for (const name of ['clearXrExitRestoreTimers', 'clearXrExitSessionAttachTimers', 'detachXrExitSessionEndListener', 'disableFPSMeter', 'removePhotorealHelperLights', 'disposeHardwareDiagnostics']) teardown.settings[name] = () => {};
teardown.settings.disablePostProcessing = () => order.push('legacy');
teardown.settings.disablePmndrsPostProcessing = () => order.push('pmndrs');
removeSettings.call(teardown.settings);
assert.deepEqual(order, ['legacy', 'pmndrs', 'vrodos-atmosphere', 'vrodos-reflections', 'vrodos-render-profile']);
completeLoad(teardownLoad); assert.equal(teardown.scene.environment, null);
assert.equal(teardown.owner.settings, null);
console.log('Reflection ownership, HDR races, probe timing, Takram policy, smoothing and teardown tests passed.');
