import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
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
        '--source', source,
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
    return spawnSync(process.execPath, args, {
        cwd: root,
        encoding: 'utf8',
        timeout: 120000
    });
}

try {
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
