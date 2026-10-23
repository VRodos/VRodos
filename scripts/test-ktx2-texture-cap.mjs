import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { Mode, toktx } from '@gltf-transform/cli';
import sharp from 'sharp';
import draco3d from 'draco3dgltf';
import { prepareOversizedKtx2Textures } from './prepare-asset-textures.mjs';

const run = promisify(execFile);
const directory = await mkdtemp(join(tmpdir(), 'vrodos-texture-cap-test-'));
try {
    const document = new Document();
    const scene = document.createScene('fixture');
    const buffer = document.createBuffer();
    const positions = document.createAccessor().setType('VEC3').setBuffer(buffer)
        .setArray(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]));
    const uv = document.createAccessor().setType('VEC2').setBuffer(buffer)
        .setArray(new Float32Array([0, 0, 1, 0, 0, 1]));
    for (const [name, width, height] of [['oversized', 2048, 1024], ['normal', 2048, 1024], ['within-cap', 256, 128]]) {
        const image = await sharp({ create: { width, height, channels: 4, background: { r: 40, g: 130, b: 210, alpha: 0.5 } } }).png().toBuffer();
        const texture = document.createTexture(name).setImage(image).setMimeType('image/png');
        const material = document.createMaterial(name);
        if (name === 'normal') material.setNormalTexture(texture);
        else material.setBaseColorTexture(texture).setAlphaMode('BLEND');
        const primitive = document.createPrimitive().setAttribute('POSITION', positions).setAttribute('TEXCOORD_0', uv).setMaterial(material);
        scene.addChild(document.createNode().setMesh(document.createMesh().addPrimitive(primitive)));
    }
    await document.transform(toktx({ encoder: sharp, mode: Mode.UASTC, slots: /normalTexture/, jobs: 1 }));
    await document.transform(toktx({ encoder: sharp, mode: Mode.ETC1S, slots: /baseColorTexture/, jobs: 1 }));
    const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
        'draco3d.decoder': await draco3d.createDecoderModule()
    });
    const source = join(directory, 'compressed-source.glb');
    await io.write(source, document);
    const originalImages = new Map(document.getRoot().listTextures().map(t => [t.getName(), Buffer.from(t.getImage())]));

    // High already fits the source: do not transcode or degrade desktop images.
    assert.deepEqual(await prepareOversizedKtx2Textures(document, 4096), []);
    for (const texture of document.getRoot().listTextures()) assert.deepEqual(Buffer.from(texture.getImage()), originalImages.get(texture.getName()));

    const resized = await io.read(source);
    await prepareOversizedKtx2Textures(resized, 1024);
    for (const texture of resized.getRoot().listTextures().filter(t => t.getName() !== 'within-cap')) {
        const { data } = await sharp(texture.getImage()).raw().toBuffer({ resolveWithObject: true });
        if (texture.getName() !== 'normal') {
            assert.ok(Math.abs(data[3] - 128) <= 2, 'KTX2 extraction preserves transparency');
        }
        for (const [index, value] of [40, 130, 210].entries()) {
            assert.ok(Math.abs(data[index] - value) <= 8, 'color and linear normal data are not gamma converted');
        }
    }

    for (const [profile, cap] of [['web-low', 1024], ['web-medium', 2048], ['web-high', 4096]]) {
        const output = join(directory, profile);
        try {
            await run(process.execPath, [join(import.meta.dirname, 'prototype-optimize-master-client-assets.mjs'),
                '--source', source, '--output-dir', output, '--profile', profile, '--protect-geometry']);
        } catch (error) {
            const report = JSON.parse(await readFile(join(output, 'manifest.json'), 'utf8'));
            throw new Error(`${profile}: ${report.assets[0].error}`, { cause: error });
        }
        const report = JSON.parse(await readFile(join(output, 'manifest.json'), 'utf8'));
        const result = await io.read(report.assets[0].derivativePath);
        for (const texture of result.getRoot().listTextures()) {
            assert.equal(texture.getMimeType(), 'image/ktx2', 'published textures remain compressed');
            assert.ok(Math.max(...texture.getSize()) <= cap, `${profile} enforces its cap for precompressed input`);
            if (texture.getName() === 'within-cap' || profile !== 'web-low') {
                assert.deepEqual(Buffer.from(texture.getImage()), originalImages.get(texture.getName()), 'in-budget KTX2 bytes remain unchanged');
            } else {
                assert.deepEqual(texture.getSize(), [1024, 512], 'headset resize preserves aspect ratio');
            }
        }
        assert.equal(report.assets[0].runtimeSubstitutionReady, true);
    }
} finally {
    await rm(directory, { recursive: true, force: true });
}
console.log('Precompressed KTX2 texture cap tests passed.');
