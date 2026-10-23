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
normal.anisotropy = 16;
apply(normal, { ...quality, headsetProfile: true }, false);
assert.equal(normal.anisotropy, 8, 'headset profile caps existing 16x filtering at 8x');
const headsetColor = new Three.Texture();
apply(headsetColor, { ...quality, headsetProfile: true }, true);
assert.equal(headsetColor.anisotropy, 8, 'headset color textures use the same 8x cap');
const video = new Three.Texture();
video.isVideoTexture = true;
video.generateMipmaps = false;
video.minFilter = Three.LinearFilter;
apply(video, quality, true);
assert.equal(video.generateMipmaps, false);
assert.equal(video.minFilter, Three.LinearFilter);
for (const texture of [image, normal, headsetColor, video]) {
    const options = texture === normal || texture === headsetColor ? { ...quality, headsetProfile: true } : quality;
    const version = texture.version;
    apply(texture, options, texture !== normal);
    apply(texture, options, texture !== normal);
    assert.equal(texture.version, version, 'unchanged texture policy must not schedule another upload');
}
const oldVersion = image.version;
apply(image, { ...quality, headsetProfile: true, maxAnisotropy: 4 }, true);
assert.equal(image.version, oldVersion + 1, 'changed sampler policy schedules one upload');
const shared = new Three.Texture();
const refresh = { ...quality, textureQualityApplied: new WeakMap() };
apply(shared, refresh, false);
apply(shared, refresh, true);
const sharedVersion = shared.version;
apply(shared, refresh, true);
apply(shared, refresh, false);
assert.equal(shared.colorSpace, Three.SRGBColorSpace, 'shared color use upgrades an earlier data-texture visit');
assert.equal(shared.version, sharedVersion, 'shared slots are processed once after their effective color policy is known');
const material = new Three.MeshStandardMaterial();
context.vrodosEnhanceMeshMaterial(material, {}, quality);
const materialVersion = material.version;
context.vrodosEnhanceMeshMaterial(material, {}, quality);
assert.equal(material.version, materialVersion, 'unchanged material refresh preserves its compiled program');
context.vrodosEnhanceMeshMaterial(material, { roughness: 0.4, color: '#ff0000' }, quality);
assert.equal(material.version, materialVersion, 'value changes do not invalidate the shader');
context.vrodosEnhanceMeshMaterial(material, {}, { ...quality, renderQuality: 'low' });
assert.ok(material.version > materialVersion, 'dithering changes invalidate the shader');
const videoRefresh = { renderQuality: 'low', textureQualityApplied: new WeakMap() };
for (const videoMaterial of [new Three.MeshStandardMaterial({ map: video }), new Three.MeshStandardMaterial({ map: video })]) {
    const version = videoMaterial.version;
    context.vrodosEnhanceMeshMaterial(videoMaterial, {}, videoRefresh);
    assert.equal(videoMaterial.version, version + 1, 'each material using a shared sRGB video refreshes its decode define');
    context.vrodosEnhanceMeshMaterial(videoMaterial, {}, videoRefresh);
    assert.equal(videoMaterial.version, version + 1, 'unchanged video decoding preserves the program');
}
const videoVersion = video.version;
video.needsUpdate = true;
apply(video, videoRefresh, true);
assert.equal(video.version, videoVersion + 1, 'video frame updates remain owned by the video texture');
for (const strength of [0, 0.35, 1]) {
    const aoMap = new Three.Texture(); aoMap.channel = 1;
    const authored = new Three.MeshStandardMaterial({ aoMap, aoMapIntensity: strength });
    for (const renderQuality of ['high', 'standard', 'performance', 'high']) {
        for (const ambientOcclusionPreset of ['off', 'soft', 'balanced', 'strong']) {
            context.vrodosEnhanceMeshMaterial(authored, {}, { ...quality, renderQuality, ambientOcclusionPreset, headsetProfile: true });
            assert.equal(authored.aoMapIntensity, strength, 'quality changes must preserve authored baked AO, including zero');
            assert.equal(aoMap.channel, 1, 'baked AO keeps its authored UV channel');
            assert.equal(aoMap.colorSpace, Three.NoColorSpace, 'baked AO is linear data');
        }
    }
}
// Standalone glass must leave Three's transmissive queue, while desktop/PCVR
// retain the original refraction and repeated refreshes do not compound alpha.
for (const transmission of [0.2, 1]) {
    const glass = new Three.MeshPhysicalMaterial({
        transmission, thickness: 0.4, opacity: transmission === 1 ? 1 : 0.8,
        transparent: transmission !== 1, side: Three.DoubleSide,
        color: '#aaccff', roughness: 0.15, map: new Three.Texture()
    });
    context.vrodosEnhanceMeshMaterial(glass, {}, quality);
    const source = {
        transmission: glass.transmission, thickness: glass.thickness, opacity: glass.opacity,
        transparent: glass.transparent, depthWrite: glass.depthWrite,
        forceSinglePass: glass.forceSinglePass, alphaTest: glass.alphaTest
    };
    const map = glass.map, color = glass.color.clone();
    const desktopVersion = glass.version;
    context.vrodosEnhanceMeshMaterial(glass, {}, quality);
    assert.equal(glass.version, desktopVersion, 'desktop glass is unchanged');
    const headset = { ...quality, headsetProfile: true };
    context.vrodosEnhanceMeshMaterial(glass, {}, headset);
    assert.equal(glass.transmission, 0, 'standalone glass must not require transmission captures');
    assert.equal(glass.thickness, 0);
    assert.equal(glass.transparent, true);
    assert.equal(glass.depthWrite, false, 'transparent glass must not occlude objects behind it');
    assert.equal(glass.forceSinglePass, true, 'double-sided glass must not add a back-face draw');
    assert.ok(glass.opacity > 0 && glass.opacity < 1, 'fully transmissive glass stays visibly translucent');
    assert.equal(glass.map, map);
    assert.ok(glass.color.equals(color), 'headset approximation preserves authored tint');
    const alpha = glass.opacity, version = glass.version;
    context.vrodosEnhanceMeshMaterial(glass, {}, headset);
    assert.equal(glass.opacity, alpha, 'shared/revisited glass keeps a stable alpha');
    assert.equal(glass.version, version, 'stable headset glass does not invalidate shaders');
    context.vrodosEnhanceMeshMaterial(glass, {}, { ...quality, headsetProfile: false });
    for (const [key, value] of Object.entries(source)) assert.equal(glass[key], value, `desktop/PCVR restores ${key}`);
    const restoredVersion = glass.version;
    context.vrodosEnhanceMeshMaterial(glass, {}, quality);
    assert.equal(glass.version, restoredVersion, 'restored desktop glass stays stable');
}
const opaquePhysical = new Three.MeshPhysicalMaterial({ transmission: 0, opacity: 1 });
context.vrodosEnhanceMeshMaterial(opaquePhysical, {}, { ...quality, headsetProfile: true });
assert.equal(opaquePhysical.transparent, false, 'opaque PBR materials remain opaque on headset');
assert.equal(opaquePhysical.opacity, 1);
console.log('Texture quality tests passed.');
for (const strength of [0.5, 1, 4]) {
    const baked = new Three.MeshStandardMaterial({ emissive: 0xffffff, emissiveIntensity: strength });
    baked.emissiveMap = new Three.Texture();
    context.vrodosEnhanceMeshMaterial(baked, { vrodosBakedLighting: true, vrodosShadowReceiver: true }, { ...quality, headsetProfile: true });
    assert.equal(baked.emissiveIntensity, strength, 'prepared lighting must not be dimmed by the shadow-receiver policy');
    context.vrodosEnhanceMeshMaterial(baked, { vrodosBakedLighting: true }, { ...quality, headsetProfile: true });
    assert.equal(baked.emissiveIntensity, strength, 'quality refresh must preserve baked HDR intensity');
}
