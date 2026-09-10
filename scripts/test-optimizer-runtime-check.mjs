import assert from 'node:assert/strict';
import { evaluateRuntime, parseKtxVersion, versionAtLeast } from './check-optimizer-runtime.mjs';

const ready = {
    node: { version: '22.13.0', minimum: '22.13.0', executable: 'node' },
    dependencies: [
        { name: '@gltf-transform/cli', expected: '4.5.0', actual: '4.5.0', error: '' },
        { name: 'sharp', expected: '0.35.4', actual: '0.35.4', error: '' }
    ],
    ktx: { version: '4.4.2', minimum: '4.3.0', executable: 'toktx', output: 'toktx v4.4.2', error: '' },
    sharp: { version: '0.35.4', libvipsVersion: '8.17.2' },
    optimizer: { script: 'optimizer.mjs', error: '' }
};

assert.equal(versionAtLeast('22.13.0', '22.13.0'), true);
assert.equal(versionAtLeast('23.0.0', '22.13.0'), true);
assert.equal(versionAtLeast('22.12.9', '22.13.0'), false);
assert.equal(parseKtxVersion('toktx v4.4.2'), '4.4.2');
assert.equal(evaluateRuntime(ready).ok, true);

const oldNode = evaluateRuntime({ ...ready, node: { ...ready.node, version: '20.18.0' } });
assert.equal(oldNode.ok, false);
assert.match(oldNode.errors.join('\n'), /Node\.js 22\.13\.0 or newer/);

const missingModule = evaluateRuntime({
    ...ready,
    dependencies: [{ name: 'sharp', expected: '0.35.4', actual: '', error: 'module not found' }]
});
assert.equal(missingModule.ok, false);
assert.match(missingModule.errors.join('\n'), /sharp could not be loaded/);

const missingKtx = evaluateRuntime({ ...ready, ktx: { ...ready.ktx, version: '', error: 'ENOENT' } });
assert.equal(missingKtx.ok, false);
assert.match(missingKtx.errors.join('\n'), /KTX-Software is unavailable/);

const oldKtx = evaluateRuntime({ ...ready, ktx: { ...ready.ktx, version: '4.2.0' } });
assert.equal(oldKtx.ok, false);
assert.match(oldKtx.errors.join('\n'), /KTX-Software 4\.3\.0 or newer/);

const invalidOptimizer = evaluateRuntime({ ...ready, optimizer: { script: 'optimizer.mjs', error: 'syntax error' } });
assert.equal(invalidOptimizer.ok, false);
assert.match(invalidOptimizer.errors.join('\n'), /Optimizer script validation failed/);

console.log('Optimizer runtime health tests passed.');
