import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';

const elements = new Map(), components = {};
function entity() {
    const meshes = {};
    return Object.assign(new EventTarget(), {
        object3D: new THREE.Group(), style: {}, parentNode: null,
        setAttribute(key, value) { if (key === 'id') { this.id = value; elements.set(value, this); } },
        getObject3D: key => meshes[key],
        setObject3D(key, value) { meshes[key] = value; this.object3D.add(value); },
        removeObject3D(key) { this.object3D.remove(meshes[key]); delete meshes[key]; },
        appendChild(child) { child.parentNode = this; this.object3D.add(child.object3D); },
        removeChild(child) { child.object3D.removeFromParent(); child.parentNode = null; elements.delete(child.id); }
    });
}
const context = vm.createContext({ THREE, URLSearchParams, console,
    AFRAME: { registerComponent: (name, def) => { components[name] = def; }, registerSystem() {} },
    document: { getElementById: id => elements.get(id), createElement: tag => {
        if (tag !== 'canvas') return entity();
        return { getContext: () => ({ createRadialGradient: () => ({ addColorStop() {} }), clearRect() {}, fillRect() {},
            getImageData: () => ({ data: new Uint8ClampedArray(4) }), putImageData() {} }) };
    } }
});
context.window = context; context.location = { search: '' }; context.VRODOSMaster = {};
for (const name of ['vrodos_runtime_resources.js', 'vrodos_sun_sprite.js', 'vrodos_gradient_sky.js', 'vrodos_atmosphere_visuals.js', 'components/vrodos_runtime_pipeline.component.js']) {
    vm.runInContext(readFileSync(new URL('../assets/js/runtime/master/' + name, import.meta.url), 'utf8'), context);
}
const master = context.VRODOSMaster;
const scene = entity(); scene.camera = new THREE.PerspectiveCamera(); scene.camera.position.set(2, 3, 4);
const self = { el: scene };
let owner = Object.assign(Object.create(components['vrodos-atmosphere']), { el: scene }); owner.init();
let api;
api = master.AtmosphereVisuals.create({ lighting: {}, cloud: {}, shadow: { applyPmndrsSunOcclusion: () => 1 }, host: {
    ...master.SunSprite, ...master.GradientSky,
    bindAtmosphereVisualOwner: settings => owner.bindSettings(settings, api.removePmndrsAtmosphereSky, api.disposePmndrsAtmosphereAuxiliaryVisuals),
    clamp01: n => Math.max(0, Math.min(1, n)),
    parseLightPositionVector: v => v.clone().normalize(), getImmersivePresentedSunDirection: (_settings, v) => v
} });
const disposals = new Map();
function watch(resource) { resource.addEventListener('dispose', () => disposals.set(resource, (disposals.get(resource) || 0) + 1)); return resource; }
const other = new THREE.Sprite(new THREE.SpriteMaterial()); watch(other.geometry); watch(other.material);
function show() { api.ensurePmndrsHorizonSun(self, new THREE.Vector3(0, 1, 0), 'natural', { atmosphere: true, forceAtmosphereSprite: true }); }
show();
assert.equal(owner.settings, self, 'sprite-only presentation must bind its lifecycle owner');
assert.equal(owner.state, null, 'auxiliary visuals do not require precomputed atmosphere state');
const texture = watch(self._pmndrsSunTexture), hazeTexture = watch(self._pmndrsSunHazeTexture);
const sun = elements.get('vrodos-pmndrs-sun').getObject3D('mesh');
const haze = elements.get('vrodos-pmndrs-sun-haze').getObject3D('mesh');
watch(sun.material); watch(haze.material);
assert.equal(sun.geometry, other.geometry);
assert.equal(sun.material.map, texture); assert.equal(haze.material.map, hazeTexture);
show(); assert.equal(elements.get('vrodos-pmndrs-sun').getObject3D('mesh'), sun);
api.clearPmndrsHorizonSun(self); api.clearPmndrsHorizonSun(self);
assert.equal(disposals.get(sun.material), 1); assert.equal(disposals.get(haze.material), 1);
assert.equal(sun.parent, null); assert.equal(haze.parent, null);
assert.equal(disposals.get(texture), undefined, 'active toggles retain cached textures');
assert.equal(disposals.get(other.geometry), undefined, 'shared sprite geometry is never disposed');
show();
const secondSun = elements.get('vrodos-pmndrs-sun').getObject3D('mesh'); watch(secondSun.material);
const secondHaze = elements.get('vrodos-pmndrs-sun-haze').getObject3D('mesh'); watch(secondHaze.material);
assert.equal(secondSun.material.map, texture); assert.equal(secondHaze.material.map, hazeTexture);
const gradient = master.GradientSky.ensureVrTakramLightsOnlyGradientSky(self, 'clear'); watch(gradient.geometry); watch(gradient.material);
const overlay = entity(); overlay.setAttribute('id', 'vrodos-pmndrs-cloud-sun-disk-overlay'); scene.appendChild(overlay);
owner.remove(); owner.remove();
for (const resource of [texture, hazeTexture, secondSun.material, secondHaze.material, gradient.material, gradient.geometry]) assert.equal(disposals.get(resource), 1);
assert.equal(self._pmndrsSunTexture, null); assert.equal(self._pmndrsSunHazeTexture, null);
assert.equal(self._vrTakramLightsOnlyGradientSky, null);
assert.equal(scene.object3D.children.length, 0); assert.equal(elements.size, 0);
assert.equal(disposals.get(other.geometry), undefined); assert.equal(disposals.get(other.material), undefined);
api.disposePmndrsAtmosphereAuxiliaryVisuals(self);
assert.equal(disposals.get(texture), 1);
owner = Object.assign(Object.create(components['vrodos-atmosphere']), { el: scene }); owner.init();
show();
assert.notEqual(self._pmndrsSunTexture, texture); assert.notEqual(self._pmndrsSunHazeTexture, hazeTexture);
assert.equal(elements.get('vrodos-pmndrs-sun').getObject3D('mesh').geometry, other.geometry);
owner.remove(); assert.equal(elements.size, 0);
assert.equal(disposals.get(other.geometry), undefined);
console.log('Atmosphere auxiliary cleanup: material disposal, cached texture reuse/release, shared geometry, gradient and overlay teardown passed.');
