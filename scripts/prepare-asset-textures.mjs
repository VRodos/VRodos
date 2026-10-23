import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';

const run = promisify(execFile);

/** Reopen oversized KTX2 images so the normal Web encoder can enforce its cap. */
export async function prepareOversizedKtx2Textures(document, textureMaxSize) {
    const oversized = document.getRoot().listTextures().filter((texture) => {
        const size = texture.getSize();
        return texture.getMimeType() === 'image/ktx2' && size && Math.max(...size) > textureMaxSize;
    });
    if (!oversized.length) return [];

    const directory = await mkdtemp(path.join(tmpdir(), 'vrodos-ktx-resize-'));
    const resized = [];
    try {
        for (const [index, texture] of oversized.entries()) {
            const size = texture.getSize();
            const input = path.join(directory, `${index}.ktx2`);
            const output = path.join(directory, `${index}.png`);
            await writeFile(input, texture.getImage());
            // Basis ETC1S/UASTC must be transcoded before Sharp can resize it.
            await run('ktx', ['extract', '--transcode', 'rgba8', '--level', '0', input, output]);
            const image = await sharp(await readFile(output), { limitInputPixels: false })
                .resize({ width: textureMaxSize, height: textureMaxSize, fit: 'inside', withoutEnlargement: true })
                .png().toBuffer();
            texture.setImage(image).setMimeType('image/png');
            if (texture.getURI()) texture.setURI(`${path.parse(texture.getURI()).name}.png`);
            resized.push({ texture: texture.getName(), sourceSize: size, size: texture.getSize() });
        }
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
    return resized;
}
