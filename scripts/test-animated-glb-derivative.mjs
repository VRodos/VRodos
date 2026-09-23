import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { Document, NodeIO } from '@gltf-transform/core';

const run = promisify(execFile);
const directory = await mkdtemp(join(tmpdir(), 'vrodos-animated-derivative-'));

function glbJson(binary) {
    assert.equal(binary.toString('ascii', 0, 4), 'glTF');
    const jsonLength = binary.readUInt32LE(12);
    return JSON.parse(binary.toString('utf8', 20, 20 + jsonLength));
}

try {
    const document = new Document();
    const buffer = document.createBuffer();
    const positions = document.createAccessor('positions').setType('VEC3').setBuffer(buffer)
        .setArray(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]));
    const primitive = document.createPrimitive().setAttribute('POSITION', positions);
    const node = document.createNode('character').setMesh(document.createMesh().addPrimitive(primitive));
    document.createScene().addChild(node);
    const times = document.createAccessor('times').setType('SCALAR').setBuffer(buffer)
        .setArray(new Float32Array([0, 1]));
    const translations = document.createAccessor('translations').setType('VEC3').setBuffer(buffer)
        .setArray(new Float32Array([0, 0, 0, 0, 1, 0]));
    const sampler = document.createAnimationSampler().setInput(times).setOutput(translations);
    document.createAnimation('idle')
        .addSampler(sampler)
        .addChannel(document.createAnimationChannel().setTargetNode(node).setTargetPath('translation').setSampler(sampler));

    const source = join(directory, 'animated-source.glb');
    const derivative = join(directory, 'animated-web-high.glb');
    await new NodeIO().write(source, document);
    try {
        await run(process.execPath, [
            join(import.meta.dirname, 'prototype-optimize-master-client-assets.mjs'),
            '--source', source,
            '--output-dir', directory,
            '--output-file', derivative,
            '--profile', 'web-high'
        ]);
    } catch (error) {
        const report = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'));
        throw new Error(`Web derivative generation failed: ${report.assets[0].error}`, { cause: error });
    }

    const sourceGltf = glbJson(await readFile(source));
    const derivativeGltf = glbJson(await readFile(derivative));
    const report = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'));
    assert.equal(report.assets[0].runtimeSubstitutionReady, true, 'compiler can select the animated Web derivative');
    assert.equal(sourceGltf.animations.length, 1);
    assert.equal(derivativeGltf.animations.length, 1, 'compiled Web derivative keeps the source clip');
    assert.equal(derivativeGltf.animations[0].name, 'idle');
    assert.equal(derivativeGltf.animations[0].channels.length, 1, 'compiled Web derivative keeps the animation channel');
    assert.equal(derivativeGltf.animations[0].channels[0].target.path, 'translation');
    assert.equal(derivativeGltf.animations[0].samplers.length, 1);
} finally {
    await rm(directory, { recursive: true, force: true });
}

console.log('Animated GLB Web derivative test passed.');
