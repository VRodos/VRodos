import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const optimizer = readFileSync(resolve(root, 'scripts/prototype-optimize-master-client-assets.mjs'), 'utf8');
const profiles = JSON.parse(readFileSync(resolve(root, 'assets/desktop-performance-profiles.json'), 'utf8'));
const pipeline = readFileSync(resolve(root, 'includes/asset-optimization/trait-vrodos-asset-optimization-desktop-profiles.php'), 'utf8');
const compiler = readFileSync(resolve(root, 'includes/class-vrodos-compiler-manager.php'), 'utf8');
const publisher = readFileSync(resolve(root, 'includes/class-vrodos-compiler-resource-publisher.php'), 'utf8');

assert.equal(profiles.custom.assetProfile, 'web-high');
assert.equal(profiles.custom.textureMaxSize, 4096);
assert.equal(profiles.profiles.medium.assetProfile, 'web-medium');
assert.equal(profiles.profiles.medium.textureMaxSize, 2048);
assert.equal(profiles.profiles.low.assetProfile, 'web-low');
assert.equal(profiles.profiles.low.textureMaxSize, 1024);
assert.match(optimizer, /profile === 'web-low'.*profile === 'web-medium'.*profile === 'web-high'/s);
assert.match(optimizer, /if \(!high && !profileOptions\.protectGeometry\)/, 'Web High and protected assets must bypass weld/simplify');
assert.match(optimizer, /\['uastc'.*normalTexture.*metallicRoughnessTexture/s, 'data textures must use UASTC');
assert.match(optimizer, /\['etc1s'.*baseColorTexture.*emissiveTexture/s, 'color textures must use ETC1S');
assert.match(optimizer, /\['draco'.*edgebreaker/s, 'all web recipes must finish with Draco');
assert.match(pipeline, /20 \* 1024 \* 1024/);
assert.match(pipeline, /8 \* 1024 \* 1024/);
assert.match(pipeline, /LARGE_SOURCE_PUBLISH_GATE_BYTES = 104857600/);
assert.match(pipeline, /'headset' === \$runtime_profile \? 'web-low' : 'web-high'/);
assert.match(compiler, /'status'\s*=> 202/);
assert.match(publisher, /ensure_source_fallback_allowed/);
assert.match(publisher, /source_bytes > self::LARGE_SOURCE_PUBLISH_GATE_BYTES/);

console.log('Web asset optimization policy tests passed.');
