import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import { MeshoptDecoder } from 'meshoptimizer';
import { pathToFileURL } from 'node:url';

export async function readSourceBounds(path) {
    await MeshoptDecoder.ready;
    const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
        'draco3d.decoder': await draco3d.createDecoderModule(),
        'meshopt.decoder': MeshoptDecoder
    });
    const document = await io.read(path);
    const scene = document.getRoot().getDefaultScene() || document.getRoot().listScenes()[0];
    if (!scene) throw new Error('Source GLB has no scene.');
    const { min, max } = getBounds(scene);
    if (![...min, ...max].every(Number.isFinite) || min.some((v, i) => v > max[i])) {
        throw new Error('Source GLB has empty or invalid bounds.');
    }
    return { min, max, center: min.map((v, i) => (v + max[i]) / 2) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    readSourceBounds(process.argv[2]).then(result => process.stdout.write(JSON.stringify(result))).catch(error => {
        process.stderr.write(error.message);
        process.exitCode = 1;
    });
}
