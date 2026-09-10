#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const pluginRoot = path.resolve(path.dirname(scriptPath), '..');

function numericVersionParts(version) {
    return String(version || '')
        .replace(/^v/i, '')
        .split(/[.+-]/, 3)
        .map((part) => Number.parseInt(part, 10) || 0);
}

export function versionAtLeast(actual, required) {
    const left = numericVersionParts(actual);
    const right = numericVersionParts(required);
    const length = Math.max(left.length, right.length);
    for (let index = 0; index < length; index += 1) {
        const difference = (left[index] || 0) - (right[index] || 0);
        if (difference !== 0) return difference > 0;
    }
    return true;
}

export function parseKtxVersion(output) {
    const match = String(output || '').match(/(?:v|version\s*)?(\d+\.\d+(?:\.\d+)?)/i);
    return match ? match[1] : '';
}

export function evaluateRuntime(input) {
    const errors = [];
    if (!versionAtLeast(input.node.version, input.node.minimum)) {
        errors.push(`Node.js ${input.node.minimum} or newer is required; found ${input.node.version || 'unknown'}.`);
    }

    for (const dependency of input.dependencies) {
        if (dependency.error) {
            errors.push(`${dependency.name} could not be loaded: ${dependency.error}`);
        } else if (!dependency.actual) {
            errors.push(`${dependency.name} is not installed.`);
        } else if (dependency.expected && dependency.actual !== dependency.expected) {
            errors.push(`${dependency.name} ${dependency.expected} is required; found ${dependency.actual}.`);
        }
    }

    if (input.ktx.error) {
        errors.push(`KTX-Software is unavailable: ${input.ktx.error}`);
    } else if (!input.ktx.version) {
        errors.push('Could not determine the KTX-Software version from toktx.');
    } else if (!versionAtLeast(input.ktx.version, input.ktx.minimum)) {
        errors.push(`KTX-Software ${input.ktx.minimum} or newer is required; found ${input.ktx.version}.`);
    }

    if (input.optimizer?.error) {
        errors.push(`Optimizer script validation failed: ${input.optimizer.error}`);
    }

    return {
        ok: errors.length === 0,
        node: input.node,
        dependencies: input.dependencies,
        ktx: input.ktx,
        sharp: input.sharp,
        optimizer: input.optimizer || { script: '', error: '' },
        errors
    };
}

async function readJson(filePath) {
    return JSON.parse(await readFile(filePath, 'utf8'));
}

async function inspectDependency(name, expected) {
    const packagePath = path.join(pluginRoot, 'node_modules', ...name.split('/'), 'package.json');
    let actual = '';
    let error = '';
    try {
        actual = String((await readJson(packagePath)).version || '');
        await import(name);
    } catch (caught) {
        error = caught instanceof Error ? caught.message : String(caught);
    }
    return { name, expected: String(expected || ''), actual, error };
}

export async function runPreflight() {
    const packageJson = await readJson(path.join(pluginRoot, 'package.json'));
    const packageLock = await readJson(path.join(pluginRoot, 'package-lock.json'));
    const dependencyNames = [
        '@gltf-transform/cli',
        '@gltf-transform/core',
        '@gltf-transform/extensions',
        '@gltf-transform/functions',
        'draco3dgltf',
        'meshoptimizer',
        'sharp'
    ];
    const dependencies = await Promise.all(
        dependencyNames.map((name) => inspectDependency(name, packageLock.packages?.[`node_modules/${name}`]?.version))
    );

    const optimizerScript = path.join(pluginRoot, 'scripts', 'prototype-optimize-master-client-assets.mjs');
    let optimizerError = '';
    try {
        await execFileAsync(process.execPath, ['--check', optimizerScript], { windowsHide: true, timeout: 10000 });
    } catch (caught) {
        optimizerError = caught instanceof Error ? caught.message : String(caught);
    }

    let sharp = { version: '', libvipsVersion: '' };
    try {
        const sharpModule = await import('sharp');
        const sharpRuntime = sharpModule.default;
        sharp = {
            version: String(sharpRuntime.versions?.sharp || ''),
            libvipsVersion: String(sharpRuntime.versions?.vips || '')
        };
    } catch {
        // The dependency error above remains the canonical failure.
    }

    let ktxOutput = '';
    let ktxError = '';
    try {
        const result = await execFileAsync('toktx', ['--version'], {
            windowsHide: true,
            timeout: 10000
        });
        ktxOutput = String(result.stdout || result.stderr || '').trim();
    } catch (caught) {
        ktxError = caught instanceof Error ? caught.message : String(caught);
    }

    const requiredNode = String(packageJson.engines?.node || '>=22.13.0').replace(/^[^0-9]*/, '');
    return evaluateRuntime({
        node: {
            version: process.versions.node,
            minimum: requiredNode,
            executable: process.execPath
        },
        dependencies,
        ktx: {
            version: parseKtxVersion(ktxOutput),
            minimum: '4.3.0',
            executable: 'toktx',
            output: ktxOutput,
            error: ktxError
        },
        sharp,
        optimizer: { script: optimizerScript, error: optimizerError }
    });
}

function humanOutput(report) {
    const lines = [
        `Node.js ${report.node.version}: ${report.node.executable}`,
        ...report.dependencies.map((dependency) => `${dependency.name} ${dependency.actual || 'unavailable'}`),
        `Sharp ${report.sharp.version || 'unavailable'} / libvips ${report.sharp.libvipsVersion || 'unavailable'}`,
        `KTX-Software ${report.ktx.version || 'unavailable'}: ${report.ktx.executable}`,
        `Optimizer script: ${report.optimizer.script || 'unavailable'}`
    ];
    if (report.errors.length) lines.push(...report.errors.map((error) => `ERROR: ${error}`));
    return lines.join('\n');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === scriptPath;
if (isMain) {
    try {
        const report = await runPreflight();
        process.stdout.write(`${process.argv.includes('--json') ? JSON.stringify(report) : humanOutput(report)}\n`);
        if (!report.ok) process.exitCode = 1;
    } catch (caught) {
        const message = caught instanceof Error ? caught.message : String(caught);
        const report = { ok: false, errors: [message] };
        process.stdout.write(`${process.argv.includes('--json') ? JSON.stringify(report) : `ERROR: ${message}`}\n`);
        process.exitCode = 1;
    }
}
