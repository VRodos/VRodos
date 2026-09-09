import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const optimizer = path.join(root, 'scripts', 'prototype-optimize-master-client-assets.mjs');
const source = path.join(root, 'assets', 'models', 'editor', 'cube.glb');
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'vrodos-optimizer-progress-'));

function runOptimizer(outputDir, progressFile, profile, options = {}) {
    const args = [
        optimizer,
        '--source', options.source || source,
        '--source-url', 'https://example.test/cube.glb',
        '--output-dir', outputDir,
        '--output-file', path.join(outputDir, 'cube.optimized.glb'),
        '--manifest', path.join(outputDir, 'manifest.json'),
        '--markdown', path.join(outputDir, 'manifest.md'),
        '--progress-file', progressFile,
        '--profile', profile,
        '--json'
    ];
    if (options.protectGeometry) args.push('--protect-geometry');
    if (options.sourceSha256) args.push('--source-sha256', options.sourceSha256);
    if (options.jobKey) args.push('--job-key', options.jobKey);
    if (options.queuedAt) args.push('--queued-at', options.queuedAt);
    if (options.preparedBaseline) args.push('--prepared-baseline', options.preparedBaseline);
    if (options.preparedAnalysis) args.push('--prepared-analysis', options.preparedAnalysis);
    if (options.writePreparedBaseline) args.push('--write-prepared-baseline');
    return spawnSync(process.execPath, args, {
        cwd: root,
        encoding: 'utf8',
        timeout: 120000
    });
}

try {
    const sourceSha256 = createHash('sha256').update(await readFile(source)).digest('hex');
    const successDir = path.join(temporaryRoot, 'success');
    const successProgressFile = path.join(successDir, 'progress.json');
    const success = runOptimizer(successDir, successProgressFile, 'web-high');
    assert.equal(success.status, 0, success.stderr || success.stdout || 'web-high optimizer failed');

    const progress = JSON.parse(await readFile(successProgressFile, 'utf8'));
    assert.equal(progress.schemaVersion, 1);
    assert.equal(progress.profile, 'web-high');
    assert.equal(path.resolve(progress.sourcePath), path.resolve(source));
    assert.equal(progress.status, 'ready');
    assert.equal(progress.step, 9);
    assert.equal(progress.totalSteps, 9);
    assert.equal(progress.percent, 100);
    assert.match(progress.message, /ready/i);
    assert.equal((await readdir(successDir)).some((entry) => entry.endsWith('.tmp')), false, 'atomic progress writes must not leave temporary files');

    const familyRoot = path.join(temporaryRoot, 'family');
    const familySource = path.join(familyRoot, 'source.glb');
    await mkdir(familyRoot, { recursive: true });
    await copyFile(source, familySource);
    const preparedBaseline = path.join(familyRoot, 'prepared.glb');
    const preparedAnalysis = path.join(familyRoot, 'prepared.json');
    const queuedAt = new Date(Date.now() - 1000).toISOString();
    const highDir = path.join(familyRoot, 'high');
    const high = runOptimizer(highDir, path.join(highDir, 'progress.json'), 'web-high', {
        sourceSha256,
        source: familySource,
        jobKey: 'high-job',
        queuedAt,
        preparedBaseline,
        preparedAnalysis,
        writePreparedBaseline: true
    });
    assert.equal(high.status, 0, high.stderr || high.stdout || 'family High optimizer failed');
    const highManifest = JSON.parse(await readFile(path.join(highDir, 'manifest.json'), 'utf8'));
    assert.equal(highManifest.assets[0].jobKey, 'high-job');
    assert.equal(highManifest.assets[0].reusedPreparedBaseline, false);
    assert.ok(highManifest.assets[0].stageTimings.some((stage) => stage.stage === 'prepared-baseline'));
    assert.equal(typeof highManifest.assets[0].preparedBaselineReusedSourceBytes, 'boolean', 'baseline source-byte reuse must be reported');
    const familySourceStat = await stat(familySource);
    const preparedBaselineStat = await stat(preparedBaseline);
    assert.equal(preparedBaselineStat.dev, familySourceStat.dev, 'prepared baseline must remain on the source filesystem');
    if (highManifest.assets[0].preparedBaselineReusedSourceBytes) {
        assert.equal(preparedBaselineStat.ino, familySourceStat.ino, 'no-op prepared baselines must be hard linked instead of copied');
    }
    assert.equal(highManifest.assets[0].profileOptions.protectGeometry, true, 'Web High must always preserve geometry');
    assert.equal(highManifest.assets[0].original.geometry.estimatedTriangles, highManifest.assets[0].derivative.geometry.estimatedTriangles, 'Web High must preserve triangle count');
    assert.equal(highManifest.assets[0].original.geometry.vertexCount, highManifest.assets[0].derivative.geometry.vertexCount, 'Web High must preserve vertex count');
    assert.ok(highManifest.assets[0].performance.queueWaitMs >= 900, 'queue wait time must be recorded');
    assert.ok(Number.isFinite(highManifest.assets[0].performance.nodeCpuUtilizationPercent), 'Node CPU utilization must be recorded');
    assert.ok(Number.isFinite(highManifest.assets[0].performance.systemCpuUtilizationPercent), 'system CPU utilization must be recorded');
    assert.ok(highManifest.encoderVersions.sharp && highManifest.encoderVersions.libvips, 'encoder versions must be recorded');
    const preparedMetadata = JSON.parse(await readFile(preparedAnalysis, 'utf8'));
    assert.equal(preparedMetadata.schemaVersion, 2);
    assert.match(preparedMetadata.preparedSha256, /^[a-f0-9]{64}$/, 'prepared baselines must store their own checksum');

    const mediumDir = path.join(familyRoot, 'medium');
    const medium = runOptimizer(mediumDir, path.join(mediumDir, 'progress.json'), 'web-medium', {
        sourceSha256,
        source: familySource,
        jobKey: 'medium-job',
        preparedBaseline,
        preparedAnalysis
    });
    assert.equal(medium.status, 0, medium.stderr || medium.stdout || 'family Medium optimizer failed');
    const mediumManifest = JSON.parse(await readFile(path.join(mediumDir, 'manifest.json'), 'utf8'));
    assert.equal(mediumManifest.assets[0].reusedPreparedBaseline, true, 'Medium must reuse High\'s prepared baseline');
    assert.equal(mediumManifest.assets[0].stageTimings.some((stage) => stage.stage === 'prune' || stage.stage === 'dedup'), false, 'reused family baselines must skip repeated preparation');

    preparedMetadata.preparedSha256 = '0'.repeat(64);
    await writeFile(preparedAnalysis, `${JSON.stringify(preparedMetadata, null, 2)}\n`, 'utf8');
    const lowDir = path.join(familyRoot, 'low-after-invalid-baseline');
    const low = runOptimizer(lowDir, path.join(lowDir, 'progress.json'), 'web-low', {
        sourceSha256,
        source: familySource,
        jobKey: 'low-job',
        preparedBaseline,
        preparedAnalysis,
        protectGeometry: true
    });
    assert.equal(low.status, 0, low.stderr || low.stdout || 'Low fallback optimizer failed');
    const lowManifest = JSON.parse(await readFile(path.join(lowDir, 'manifest.json'), 'utf8'));
    assert.equal(lowManifest.assets[0].reusedPreparedBaseline, false, 'a baseline with an invalid checksum must be rejected');
    assert.ok(lowManifest.assets[0].stageTimings.some((stage) => stage.stage === 'prune'), 'invalid baselines must rebuild from the source');

    const protectedDir = path.join(temporaryRoot, 'protected-preview');
    const protectedProgressFile = path.join(protectedDir, 'progress.json');
    const protectedPreview = runOptimizer(protectedDir, protectedProgressFile, 'editor-preview', { protectGeometry: true });
    assert.equal(protectedPreview.status, 0, protectedPreview.stderr || protectedPreview.stdout || 'protected editor preview optimizer failed');
    const protectedManifest = JSON.parse(await readFile(path.join(protectedDir, 'manifest.json'), 'utf8'));
    assert.equal(protectedManifest.assets[0].profileOptions.protectGeometry, true, 'protected previews must retain the geometry protection flag');
    assert.match(protectedManifest.assets[0].runtimeNotes.join(' '), /simplification was skipped/i, 'protected previews must skip geometry simplification');

    const failureDir = path.join(temporaryRoot, 'failure');
    const failureProgressFile = path.join(failureDir, 'progress.json');
    const failure = runOptimizer(failureDir, failureProgressFile, 'unknown-profile');
    assert.notEqual(failure.status, 0, 'unknown optimizer profiles must fail');
    const failedProgress = JSON.parse(await readFile(failureProgressFile, 'utf8'));
    assert.equal(failedProgress.status, 'failed');
    assert.match(failedProgress.message, /Unknown optimization profile/);

    console.log('Optimizer progress tests passed.');
} finally {
    await rm(temporaryRoot, { recursive: true, force: true });
}
