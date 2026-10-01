import assert from 'node:assert/strict';
import { Document, NodeIO } from '@gltf-transform/core';
import { EXTMeshGPUInstancing } from '@gltf-transform/extensions';
import { PlaneGeometry, SphereGeometry } from 'three';
import { simplifyAssetGeometry } from './asset-geometry-policy.mjs';

function fixture(segments = 400, geometry = new PlaneGeometry(10, 10, segments, segments)) {
    const document = new Document();
    const buffer = document.createBuffer();
    const material = document.createMaterial('surface');
    function primitive(geometry) {
        const result = document.createPrimitive().setMaterial(material);
        for (const [name, semantic] of [['position', 'POSITION'], ['normal', 'NORMAL'], ['uv', 'TEXCOORD_0']]) {
            const attribute = geometry.getAttribute(name);
            result.setAttribute(semantic, document.createAccessor().setType(attribute.itemSize === 2 ? 'VEC2' : 'VEC3').setBuffer(buffer).setArray(attribute.array));
        }
        if (geometry.index) result.setIndices(document.createAccessor().setType('SCALAR').setBuffer(buffer).setArray(geometry.index.array));
        return result;
    }
    const dense = primitive(geometry);
    const small = primitive(new PlaneGeometry(1, 1));
    const mesh = document.createMesh('decoration').addPrimitive(dense).addPrimitive(small);
    const node = document.createNode('placement').setMesh(mesh).setTranslation([2, 3, 4]);
    document.createScene().addChild(node);
    return { document, dense, small, node, material };
}

for (const profile of ['web-high', 'web-medium', 'web-low', 'editor-preview']) {
    const geometry = new SphereGeometry(10, 400, 400).toNonIndexed();
    geometry.computeVertexNormals();
    const { document, dense } = fixture(400, geometry);
    const report = await simplifyAssetGeometry(document, profile);
    assert.ok(report.after <= report.target + 10, `${profile} must decimate a faceted scan within its geometry budget`);
    assert.equal(report.rebuiltFlatNormalPrimitives, 1, 'rebuild the scan normals after simplifying across face boundaries');
    const indices = dense.getIndices().getArray();
    const normals = dense.getAttribute('NORMAL').getArray();
    for (let i = 0; i < indices.length; i += 3) {
        for (let axis = 0; axis < 3; axis++) {
            assert.equal(normals[indices[i] * 3 + axis], normals[indices[i + 1] * 3 + axis], 'retain flat shading');
            assert.equal(normals[indices[i] * 3 + axis], normals[indices[i + 2] * 3 + axis], 'retain flat shading');
        }
    }
    assert.deepEqual(dense.listSemantics().sort(), ['NORMAL', 'POSITION', 'TEXCOORD_0'], 'retain texture coordinates and normals');
}

for (const variant of ['smooth', 'tangent', 'custom-normal', 'protected']) {
    const geometry = new SphereGeometry(10, 240, 240);
    if (variant !== 'smooth') {
        const flat = geometry.toNonIndexed();
        flat.computeVertexNormals();
        geometry.copy(flat);
    }
    const { document, dense } = fixture(400, geometry);
    if (variant === 'tangent') dense.setAttribute('TANGENT', document.createAccessor().setType('VEC4').setBuffer(document.getRoot().listBuffers()[0]).setArray(new Float32Array(dense.getAttribute('POSITION').getCount() * 4)));
    if (variant === 'custom-normal') {
        const normals = dense.getAttribute('NORMAL').getArray();
        for (let i = 0; i < normals.length; i++) normals[i] *= -1;
    }
    const report = await simplifyAssetGeometry(document, 'web-medium', variant === 'protected');
    assert.equal(report.rebuiltFlatNormalPrimitives, 0, `${variant} must retain its authored normal/tangent inputs`);
    if (variant === 'protected') assert.equal(report.after, report.before);
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
// A mesh under the unique-geometry budget can exceed it when placed repeatedly.
for (const variant of ['ordinary', 'gpu', 'shared-primitive', 'protected']) {
    const protectedGeometry = variant === 'protected';
    const { document, node } = fixture(100);
    const scene = document.getRoot().listScenes()[0];
    if (variant === 'gpu') {
        const instancing = document.createExtension(EXTMeshGPUInstancing);
        const translations = document.createAccessor().setType('VEC3').setBuffer(document.getRoot().listBuffers()[0]).setArray(new Float32Array(55 * 3));
        node.setExtension('EXT_mesh_gpu_instancing', instancing.createInstancedMesh().setAttribute('TRANSLATION', translations));
    } else {
        const mesh = variant === 'shared-primitive' ? document.createMesh() : node.getMesh();
        if (variant === 'shared-primitive') for (const primitive of node.getMesh().listPrimitives()) mesh.addPrimitive(primitive);
        for (let i = 1; i < 55; i++) scene.addChild(document.createNode().setMesh(mesh));
    }
    const report = await simplifyAssetGeometry(document, 'web-high', protectedGeometry);
    assert.ok(report.before < report.target, 'fixture is below budget when counted once');
    assert.equal(report.placedBefore, report.before * 55);
    assert.equal(report.placedAfter, report.after * 55);
    if (protectedGeometry) {
        assert.equal(report.skipped, 'protected');
        assert.equal(report.placedAfter, report.placedBefore, 'navigation protection still wins over the budget');
    } else {
        assert.ok(report.placedAfter < report.placedBefore / 2, 'repeated mesh placements must drive simplification');
        assert.equal(report.targetReached, report.placedAfter <= report.target, 'target status must describe placed triangles');
    }
}
console.log('Automatic geometry budgets and preservation tests passed.');
