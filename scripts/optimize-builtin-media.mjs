import assert from 'node:assert/strict';
import { readFile, writeFile, rename, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const files = ['assets/models/runtime/speaker.glb', 'assets/models/runtime/assessment.glb'];
const apply = process.argv.includes('--write');
assert(process.argv.slice(2).every((arg) => arg === '--write'), 'Usage: node scripts/optimize-builtin-media.mjs [--write]');

// Rewrite only image buffer views. All geometry/accessor bytes and scene metadata remain intact.
for (const file of files) {
    const source = await readFile(resolve(root, file));
    assert.equal(source.toString('ascii', 0, 4), 'glTF');
    assert.equal(source.readUInt32LE(4), 2);
    assert.equal(source.readUInt32LE(8), source.length);
    assert.equal(source.readUInt32LE(16), 0x4e4f534a);
    const jsonLength = source.readUInt32LE(12);
    const json = JSON.parse(source.toString('utf8', 20, 20 + jsonLength));
    const binStart = 20 + jsonLength + 8;
    assert.equal(source.readUInt32LE(binStart - 4), 0x004e4942);
    assert.equal(binStart + source.readUInt32LE(binStart - 8), source.length);
    assert.equal(json.buffers.length, 1);
    assert(!json.extensionsUsed?.length, 'Review extension buffer references before optimizing.');
    const replacements = new Map();
    for (const image of json.images || []) {
        assert(['image/png', 'image/jpeg'].includes(image.mimeType));
        const view = json.bufferViews[image.bufferView];
        assert(view && !view.byteStride && !view.target);
        const bytes = source.subarray(binStart + (view.byteOffset || 0), binStart + (view.byteOffset || 0) + view.byteLength);
        const metadata = await sharp(bytes).metadata();
        if (metadata.width <= 1024 && metadata.height <= 1024) continue;
        let pipeline = sharp(bytes).resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true });
        pipeline = image.mimeType === 'image/png' ? pipeline.png({ compressionLevel: 9 }) : pipeline.jpeg({ quality: 90, chromaSubsampling: '4:4:4' });
        const output = await pipeline.toBuffer();
        const after = await sharp(output).metadata();
        assert.equal(after.hasAlpha, metadata.hasAlpha);
        assert(after.width <= 1024 && after.height <= 1024);
        replacements.set(image.bufferView, output);
    }
    if (!replacements.size) {
        console.log(JSON.stringify({ file, bytes: source.length, changed: false }));
        continue;
    }
    const buffers = [];
    let offset = 0;
    for (const [index, view] of json.bufferViews.entries()) {
        assert.equal(view.buffer || 0, 0);
        const bytes = replacements.get(index) || source.subarray(binStart + (view.byteOffset || 0), binStart + (view.byteOffset || 0) + view.byteLength);
        view.byteOffset = offset;
        view.byteLength = bytes.length;
        buffers.push(bytes);
        const padding = (4 - bytes.length % 4) % 4;
        buffers.push(Buffer.alloc(padding));
        offset += bytes.length + padding;
    }
    json.buffers[0].byteLength = offset;
    const rawJson = Buffer.from(JSON.stringify(json));
    const jsonBuffer = Buffer.concat([rawJson, Buffer.alloc((4 - rawJson.length % 4) % 4, 0x20)]);
    const header = Buffer.alloc(20);
    header.write('glTF');
    header.writeUInt32LE(2, 4);
    header.writeUInt32LE(28 + jsonBuffer.length + offset, 8);
    header.writeUInt32LE(jsonBuffer.length, 12);
    header.writeUInt32LE(0x4e4f534a, 16);
    const binHeader = Buffer.alloc(8);
    binHeader.writeUInt32LE(offset);
    binHeader.writeUInt32LE(0x004e4942, 4);
    const output = Buffer.concat([header, jsonBuffer, binHeader, ...buffers]);
    assert(output.length < source.length, 'Optimization must reduce file size.');
    if (apply) {
        const temporary = resolve(root, file + '.tmp');
        let created = false;
        try {
            await writeFile(temporary, output, { flag: 'wx' });
            created = true;
            await rename(temporary, resolve(root, file));
        } finally {
            if (created) await rm(temporary, { force: true });
        }
    }
    console.log(JSON.stringify({ file, beforeBytes: source.length, afterBytes: output.length, imageViewsResized: replacements.size, written: apply }));
}
