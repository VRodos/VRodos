import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { Group, Mesh, BoxGeometry, MeshStandardMaterial, Texture } from 'three';
let definition;
vm.runInNewContext(readFileSync(new URL('../assets/js/runtime/master/components/vrodos_shared_model_textures.component.js', import.meta.url), 'utf8'), {
    AFRAME: { registerComponent: (_name, value) => { definition = value; } }
});
const scene = {};
function placement(src = '/assessment.glb') {
    const root = new Group();
    const texture = new Texture({ width: 16, height: 16 });
    const material = new MeshStandardMaterial({ map: texture });
    root.add(new Mesh(new BoxGeometry(), material));
    const listeners = new Map();
    const component = Object.assign(Object.create(definition), { el: {
        sceneEl: scene, getObject3D: () => root, getAttribute: () => src,
        addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener: key => listeners.delete(key)
    } });
    component.init();
    return { component, texture, material, listeners };
}
const placements = Array.from({ length: 4 }, () => placement());
assert.equal(new Set(placements.map(p => p.texture.source)).size, 1, 'four immutable props share image source');
assert.equal(new Set(placements.map(p => p.texture)).size, 4, 'placement texture state remains independent');
placements[0].texture.repeat.set(3, 2);
placements[0].material.color.set(0xff0000);
assert.equal(placements[1].texture.repeat.x, 1);
assert.notEqual(placements[0].material.color.getHex(), placements[1].material.color.getHex());
const shared = placements[0].texture.source;
placements[0].component.remove();
assert.equal(placements[0].listeners.size, 0);
const joined = placement();
assert.equal(joined.texture.source, shared, 'removing one owner must not evict active sources');
const different = placement('/different.glb');
assert.notEqual(different.texture.source, shared, 'different GLBs never share by material name');
placements.slice(1).forEach(p => p.component.remove());
joined.component.remove();
const fresh = placement();
assert.notEqual(fresh.texture.source, shared, 'last owner releases cache references');
fresh.component.remove();
different.component.remove();
console.log('Shared model texture ownership and independent placement tests passed.');
