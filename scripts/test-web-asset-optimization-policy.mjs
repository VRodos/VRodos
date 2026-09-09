import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const optimizer = readFileSync(resolve(root, 'scripts/prototype-optimize-master-client-assets.mjs'), 'utf8');
const profiles = JSON.parse(readFileSync(resolve(root, 'assets/desktop-performance-profiles.json'), 'utf8'));
const pipeline = readFileSync(resolve(root, 'includes/asset-optimization/trait-vrodos-asset-optimization-desktop-profiles.php'), 'utf8');
const derivativeService = readFileSync(resolve(root, 'includes/asset-optimization/trait-vrodos-asset-optimization-derivatives.php'), 'utf8');
const compiler = readFileSync(resolve(root, 'includes/class-vrodos-compiler-manager.php'), 'utf8');
const publisher = readFileSync(resolve(root, 'includes/class-vrodos-compiler-resource-publisher.php'), 'utf8');

assert.equal(profiles.custom.assetProfile, 'web-high');
assert.equal(profiles.custom.textureMaxSize, 4096);
assert.equal(profiles.profiles.medium.assetProfile, 'web-medium');
assert.equal(profiles.profiles.medium.textureMaxSize, 2048);
assert.equal(profiles.profiles.low.assetProfile, 'web-low');
assert.equal(profiles.profiles.low.textureMaxSize, 1024);
assert.match(optimizer, /new NodeIO\(\)/, 'optimizer must use one programmatic glTF document pipeline');
assert.doesNotMatch(optimizer, /function profileSteps/, 'optimizer must not create a full intermediate GLB per transform');
assert.match(optimizer, /atomicLinkOrWrite\(sourcePath, options\.preparedBaseline/, 'no-op prepared baselines must avoid a second source-size copy');
assert.match(optimizer, /preparedSha256: sourceDigest\(preparedBinary\)/, 'prepared baselines must be checksummed independently');
assert.match(optimizer, /options\.profile === 'web-low'.*options\.profile === 'web-medium'/s);
assert.match(optimizer, /options\.profile === 'editor-preview' \|\| options\.profile === 'web-low' \|\| options\.profile === 'web-medium'\) && !protectGeometry/, 'Web High and protected assets must bypass visual simplification');
assert.match(optimizer, /DATA_TEXTURE_SLOTS.*normalTexture.*metallicRoughnessTexture/s, 'data textures must use UASTC');
assert.match(optimizer, /COLOR_TEXTURE_SLOTS.*baseColorTexture.*emissiveTexture/s, 'color textures must use ETC1S');
assert.match(optimizer, /draco\(\{ method: 'edgebreaker' \}\)/, 'all compiled web recipes must finish with Draco');
assert.match(optimizer, /configureDracoWithoutWeld/, 'protected geometry must configure Draco without a weld transform');
assert.match(optimizer, /selectKtxJobs/, 'KTX concurrency must be memory-aware');
assert.match(optimizer, /uastcZstdLevel: isWebProfile\(options\.profile\) \? options\.uastcZstdLevel/, 'the measured UASTC Zstd level must be recorded');
assert.match(optimizer, /uastcZstdLevel: 9/, 'the fastest benchmark level satisfying the shipping-size gate must remain the production default');
assert.match(pipeline, /20 \* 1024 \* 1024/);
assert.match(pipeline, /8 \* 1024 \* 1024/);
assert.match(pipeline, /LARGE_SOURCE_PUBLISH_GATE_BYTES = 104857600/);
assert.match(pipeline, /desktop_profile_job_key/);
for (const identityField of ['sourceSha256', 'recipe', 'textureMaxSize', 'protectGeometry', 'pipelineVersion']) {
    assert.ok(pipeline.includes(identityField), `immutable jobs must include ${identityField}`);
}
assert.match(pipeline, /continue_web_family/, 'automatic profiles must continue High, Medium, then Low');
assert.match(derivativeService, /'preparedBaseline', 'preparedAnalysis'/, 'obsolete worker results must remove reusable staging data');
assert.match(derivativeService, /vrodos_optimizer_identity_mismatch/, 'PHP must reject worker manifests from a different immutable job');
assert.match(pipeline, /'headset' === \$runtime_profile \? 'web-low' : 'web-high'/);
assert.match(compiler, /'status'\s*=> 202/);
assert.match(publisher, /ensure_source_fallback_allowed/);
assert.match(publisher, /source_bytes > self::LARGE_SOURCE_PUBLISH_GATE_BYTES/);

console.log('Web asset optimization policy tests passed.');
