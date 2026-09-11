import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as Three from 'three';

const context = vm.createContext({ window: {}, THREE: { ...Three, HDRLoader: class {} } });
vm.runInContext(readFileSync(new URL('../assets/js/runtime/master/vrodos_master_rendering.js', import.meta.url), 'utf8'), context);
const apply = context.window.VRODOSMaster.applyTextureQuality;
const quality = { renderQuality: 'high', maxAnisotropy: 16 };
for (const count of [1, 3]) {
    const mipmaps = Array.from({ length: count }, (_, i) => ({ data: new Uint8Array(16), width: 4 >> i, height: 4 >> i }));
    const texture = new Three.CompressedTexture(mipmaps, 4, 4, Three.RGBA_S3TC_DXT5_Format);
    texture.generateMipmaps = true;
    apply(texture, quality, true);
    assert.equal(texture.generateMipmaps, false, 'compressed mip chains must never use glGenerateMipmap');
    assert.equal(texture.minFilter, count > 1 ? Three.LinearMipmapLinearFilter : Three.LinearFilter);
    assert.equal(texture.mipmaps, mipmaps, 'embedded mip data must remain intact');
    assert.equal(texture.colorSpace, Three.SRGBColorSpace);
    assert.equal(texture.anisotropy, 16);
    apply(texture, quality, false);
    assert.equal(texture.generateMipmaps, false, 'repeated material refresh must preserve compressed texture policy');
}
const image = new Three.Texture();
apply(image, quality, true);
assert.equal(image.generateMipmaps, true);
assert.equal(image.minFilter, Three.LinearMipmapLinearFilter);
const normal = new Three.Texture();
apply(normal, quality, false);
assert.equal(normal.colorSpace, Three.NoColorSpace);
const video = new Three.Texture();
video.isVideoTexture = true;
video.generateMipmaps = false;
video.minFilter = Three.LinearFilter;
apply(video, quality, true);
assert.equal(video.generateMipmaps, false);
assert.equal(video.minFilter, Three.LinearFilter);
console.log('Texture quality tests passed.');
