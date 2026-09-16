import assert from 'node:assert/strict';
import { Document, NodeIO } from '@gltf-transform/core';
import { KHRMaterialsAnisotropy } from '@gltf-transform/extensions';
import { prepareAssetMaterials } from './prepare-asset-materials.mjs';

const doc = new Document();
const buffer = doc.createBuffer();
const attr = (type, values) => doc.createAccessor().setType(type).setArray(new Float32Array(values)).setBuffer(buffer);
const positions = attr('VEC3', [0, 0, 0, 1, 0, 0, 0, 1, 0]);
const normals = attr('VEC3', [0, 0, 1, 0, 0, 1, 0, 0, 1]);
const tangents = attr('VEC4', [1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1]);
const uv = attr('VEC2', [0, 0, 1, 0, 0, 1]);
const aniso = doc.createExtension(KHRMaterialsAnisotropy).createAnisotropy().setAnisotropyStrength(1);
const material = doc.createMaterial('brushed metal').setMetallicFactor(0.45).setRoughnessFactor(0.345)
    .setExtension('KHR_materials_anisotropy', aniso);
const primitive = () => doc.createPrimitive().setAttribute('POSITION', positions)
    .setAttribute('NORMAL', normals).setMaterial(material);
const valid = primitive().setAttribute('TANGENT', tangents);
const derivedFrame = primitive().setAttribute('TEXCOORD_0', uv);
const missingFrame = primitive();
const missingFrame2 = primitive();
const mesh = doc.createMesh('gallery').addPrimitive(valid).addPrimitive(derivedFrame)
    .addPrimitive(missingFrame).addPrimitive(missingFrame2);
doc.createScene().addChild(doc.createNode().setMesh(mesh));

const repairs = await prepareAssetMaterials(doc);
assert.equal(repairs.length, 2, 'only primitives without a tangent frame need repair');
assert.equal(valid.getMaterial(), material, 'shared valid material must retain anisotropy');
assert.equal(derivedFrame.getAttribute('TEXCOORD_0'), uv, 'untextured anisotropy needs its implicit tangent-frame UVs');
assert.equal(valid.getAttribute('TANGENT'), tangents, 'untextured anisotropy tangents must survive pruning');
assert.equal(missingFrame.getMaterial(), missingFrame2.getMaterial(), 'reuse one repaired material per original');
assert.equal(missingFrame.getMaterial().getExtension('KHR_materials_anisotropy'), null);
assert.equal(missingFrame.getMaterial().getMetallicFactor(), 0.45);
assert.equal(missingFrame.getMaterial().getRoughnessFactor(), 0.345);

const io = new NodeIO().registerExtensions([KHRMaterialsAnisotropy]);
const reloaded = await io.readBinary(await io.writeBinary(doc));
const primitives = reloaded.getRoot().listMeshes()[0].listPrimitives();
assert.ok(primitives[0].getAttribute('TANGENT'), 'published GLB must retain authored tangent data');
assert.ok(primitives[1].getAttribute('TEXCOORD_0'), 'published GLB must retain derived tangent inputs');
assert.equal(primitives[2].getMaterial().getExtension('KHR_materials_anisotropy'), null);
assert.deepEqual(await prepareAssetMaterials(reloaded), [], 'prepared baselines must not repeat material repairs');

// The rebuilt gallery had TEXCOORD_0, but almost every triangle's UVs lay on
// a line. Test values, not only attribute presence, including indexed geometry.
const collapsedUv = attr('VEC2', [0, 0, 0.5, 0.5, 1, 1]);
const cases = [
    ['collapsed UV triangle', primitive().setAttribute('TEXCOORD_0', collapsedUv), false],
    ['indexed collapsed UV triangle', primitive().setAttribute('TEXCOORD_0', collapsedUv)
        .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint16Array([0, 1, 2])).setBuffer(buffer)), false],
    ['non-finite UV', primitive().setAttribute('TEXCOORD_0', attr('VEC2', [0, 0, 1, 0, NaN, 1])), false],
    ['zero tangent', primitive().setAttribute('TANGENT', attr('VEC4', [0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1])), false],
    ['parallel normal and tangent', primitive().setAttribute('TANGENT', attr('VEC4', [0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1])), false],
    ['tiny valid UV triangle', primitive().setAttribute('TEXCOORD_0', attr('VEC2', [0, 0, 1e-9, 0, 0, 1e-9])), true],
    ['authored tangents with unused collapsed UVs', primitive().setAttribute('TANGENT', tangents).setAttribute('TEXCOORD_0', collapsedUv), true],
];
for (const [, candidate] of cases) mesh.addPrimitive(candidate);
await prepareAssetMaterials(doc);
for (const [name, candidate, supported] of cases) {
    assert.equal(Boolean(candidate.getMaterial().getExtension('KHR_materials_anisotropy')), supported, name);
}

const ordinary = new Document();
const ordinaryBuffer = ordinary.createBuffer();
const unusedUv = ordinary.createAccessor().setType('VEC2').setArray(new Float32Array([0, 0])).setBuffer(ordinaryBuffer);
const plain = ordinary.createPrimitive().setAttribute('TEXCOORD_0', unusedUv).setMaterial(ordinary.createMaterial());
ordinary.createScene().addChild(ordinary.createNode().setMesh(ordinary.createMesh().addPrimitive(plain)));
await prepareAssetMaterials(ordinary);
assert.equal(plain.getAttribute('TEXCOORD_0'), null, 'ordinary assets retain existing unused-attribute pruning');
console.log('Asset material preparation regression tests passed.');
