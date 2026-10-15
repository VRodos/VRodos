import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';

let invalidations = 0;
const warnings = [];
const envir = { isSceneLoading: true };
const context = vm.createContext({
    THREE,
    console: { warn: (...args) => warnings.push(args) },
    VRODOS: {
        data: {},
        editor: { envir, sceneRegistry: { invalidateBounds() { invalidations++; } } },
        loader: {},
        ui: {},
        utils: {}
    }
});
context.window = context;
const source = readFileSync(new URL('../assets/js/editor/loaders/vrodos_loader_glb_assets.js', import.meta.url), 'utf8');
vm.runInContext(source, context);

function placement(width, height, depth, scale) {
    const root = new THREE.Group();
    root.add(new THREE.Mesh(new THREE.BoxGeometry(width, height, depth)));
    root.scale.setScalar(scale);
    return root;
}

const mountain = placement(592843, 327992, 371936, -0.016);
const mountainRecord = { asset_id: 5553, trs: { scale: [-0.016, -0.016, -0.016] } };
assert.equal(context.VRODOS.loader.fitOversizedGlbPlacement(mountain, mountainRecord), true);
const fittedSize = new THREE.Box3().setFromObject(mountain).getSize(new THREE.Vector3());
assert.ok(Math.abs(fittedSize.x - 25) < 0.0001, 'a kilometer-scale import should fit within 25 scene units');
assert.ok(mountain.scale.x > 0 && mountain.scale.y > 0 && mountain.scale.z > 0, 'three negative axes should become a positive uniform scale');
assert.deepEqual(mountainRecord.trs.scale, mountain.scale.toArray(), 'the saved placement should use the fitted scale');
assert.equal(invalidations, 1);
assert.equal(warnings.length, 1);

const ordinary = placement(20, 10, 15, 1);
const ordinaryRecord = { trs: { scale: [1, 1, 1] } };
assert.equal(context.VRODOS.loader.fitOversizedGlbPlacement(ordinary, ordinaryRecord), false);
assert.deepEqual(ordinary.scale.toArray(), [1, 1, 1], 'ordinary assets keep their authored scale');
assert.deepEqual(ordinaryRecord.trs.scale, [1, 1, 1], 'ordinary placement records stay unchanged');

// Reopening a saved, deliberately enlarged terrain must never fit it again.
const authored = placement(123.2, 16.3, 86.34, 4.058442);
authored.position.set(-30, 70.35950369675757, 0);
authored.rotation.set(0.1, 0.2, 0.3);
const savedRecord = {
    asset_id: 6279,
    trs: {
        translation: authored.position.toArray(),
        rotation: [authored.rotation.x, authored.rotation.y, authored.rotation.z],
        scale: authored.scale.toArray()
    }
};
context.VRODOS.editor.sceneRegistry.get = () => null;
context.VRODOS.editor.objectFactory = { addSceneObject() {} };
context.VRODOS.loader.setObjectProperties = (object, _name, resources) => {
    const trs = resources.terrain.trs;
    object.position.fromArray(trs.translation);
    object.rotation.set(...trs.rotation);
    object.scale.fromArray(trs.scale);
    return object;
};
context.VRODOS.loader.applyTextureAnisotropy = () => {};
context.VRODOS.loader.getEditorTextureAnisotropy = () => 1;
const restored = context.vrodosLoaderAddGlbSceneObject(
    { scene: placement(123.2, 16.3, 86.34, 1) }, 'terrain', { terrain: savedRecord },
    { canonicalUrl: '/terrain.glb', loadUrl: '/terrain.glb' }
);
assert.deepEqual(restored.scale.toArray(), authored.scale.toArray(), 'reopening preserves an authored terrain larger than 250 units');
assert.deepEqual(restored.position.toArray(), authored.position.toArray(), 'reopening preserves the authored terrain position');
assert.deepEqual([restored.rotation.x, restored.rotation.y, restored.rotation.z], savedRecord.trs.rotation);
assert.deepEqual(savedRecord.trs.scale, authored.scale.toArray(), 'loading never rewrites the saved scale');
console.log('Editor oversized GLB tests passed.');
