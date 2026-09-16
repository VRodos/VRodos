import assert from 'node:assert/strict';
import { Document, NodeIO } from '@gltf-transform/core';
import { PlaneGeometry } from 'three';
import { simplifyAssetGeometry } from './asset-geometry-policy.mjs';

function fixture(segments = 400) {
    const document = new Document();
    const buffer = document.createBuffer();
    const material = document.createMaterial('surface');
    function primitive(geometry) {
        const result = document.createPrimitive().setMaterial(material);
        for (const [name, semantic] of [['position', 'POSITION'], ['normal', 'NORMAL'], ['uv', 'TEXCOORD_0']]) {
            const attribute = geometry.getAttribute(name);
            result.setAttribute(semantic, document.createAccessor().setType(attribute.itemSize === 2 ? 'VEC2' : 'VEC3').setBuffer(buffer).setArray(attribute.array));
        }
        result.setIndices(document.createAccessor().setType('SCALAR').setBuffer(buffer).setArray(geometry.index.array));
        return result;
    }
    const dense = primitive(new PlaneGeometry(10, 10, segments, segments));
    const small = primitive(new PlaneGeometry(1, 1));
    const mesh = document.createMesh('decoration').addPrimitive(dense).addPrimitive(small);
    const node = document.createNode('placement').setMesh(mesh).setTranslation([2, 3, 4]);
    document.createScene().addChild(node);
    return { document, dense, small, node, material };
}

let previous = Infinity;
for (const profile of ['web-high', 'web-medium', 'web-low']) {
    const { document, dense, small, node, material } = fixture();
    const smallIndices = Array.from(small.getIndices().getArray());
    const report = await simplifyAssetGeometry(document, profile);
    assert.ok(report.after < report.before, `${profile} must simplify dense static geometry`);
    assert.ok(report.after <= previous, 'lower quality must not increase triangles on the same source');
    previous = report.after;
    assert.ok(dense.getIndices().getCount() >= 3000, 'preserve the minimum primitive budget');
    assert.deepEqual(Array.from(small.getIndices().getArray()), smallIndices, 'small parts are untouched');
    assert.deepEqual(node.getTranslation(), [2, 3, 4]);
    assert.equal(dense.getMaterial(), material);
    assert.deepEqual(dense.listSemantics().sort(), ['NORMAL', 'POSITION', 'TEXCOORD_0']);
    const positions = dense.getAttribute('POSITION').getArray();
    for (let i = 0; i < positions.length; i += 3) assert.equal(positions[i + 2], 0, 'planar surface remains planar');
    const io = new NodeIO();
    const reloaded = await io.readBinary(await io.writeBinary(document));
    assert.equal(reloaded.getRoot().listMeshes().length, 1);
}

for (const protection of ['explicit', 'skin', 'morph', 'small']) {
    const { document, dense } = fixture(protection === 'small' ? 2 : 80);
    if (protection === 'skin') document.createSkin();
    if (protection === 'morph') dense.addTarget(document.createPrimitiveTarget());
    const indices = Array.from(dense.getIndices().getArray());
    for (const profile of ['web-high', 'web-medium', 'web-low']) {
        const report = await simplifyAssetGeometry(document, profile, protection === 'explicit');
        assert.equal(report.before, report.after, `${protection} must remain unchanged at ${profile}`);
        assert.deepEqual(Array.from(dense.getIndices().getArray()), indices);
    }
}
console.log('Automatic geometry budgets and preservation tests passed.');
