#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_PORT = 9222;
const DEFAULT_DURATION_MS = 30000;
const DEFAULT_INTERVAL_MS = 500;
const DEFAULT_TARGET_URL = 'Master_Client_';
const DEFAULT_TIMEOUT_MS = 10000;

function printUsage() {
    console.log(`Usage: node scripts/capture-quest-immersive-diagnostics.mjs [options]

Samples Quest Browser DevTools diagnostics from the active compiled VRodos scene.

Options:
  --port N                         Local DevTools forwarding port. Default: ${DEFAULT_PORT}.
  --duration-ms N                  Capture duration. Default: ${DEFAULT_DURATION_MS}.
  --interval-ms N                  Sampling interval. Default: ${DEFAULT_INTERVAL_MS}.
  --target-url TEXT                Match a page target URL/title. Default: ${DEFAULT_TARGET_URL}.
  --output PATH                    Output JSON path. Default: C:\\tmp\\vrodos-quest-immersive-smoothness-*.json on Windows.
  --adb-path PATH                  adb executable path. Defaults to PATH or Meta Quest Developer Hub adb.
  --serial SERIAL                  adb device serial.
  --skip-adb-forward               Assume tcp:PORT is already forwarded to Quest Browser DevTools.
  --include-frames-each-sample     Include the full bounded frame ring in every sample, not only the final sample.
  --list-targets                   Print available DevTools targets and exit.
  --help                           Show this help.

Before capture, load the scene with ?vrodos_debug_immersive_smoothness=1 and enter immersive VR.`);
}

function parseArgs(argv) {
    const options = {
        port: DEFAULT_PORT,
        durationMs: DEFAULT_DURATION_MS,
        intervalMs: DEFAULT_INTERVAL_MS,
        targetUrl: DEFAULT_TARGET_URL,
        output: '',
        adbPath: '',
        serial: '',
        skipAdbForward: false,
        includeFramesEachSample: false,
        listTargets: false,
        timeoutMs: DEFAULT_TIMEOUT_MS
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        const next = () => {
            index += 1;
            if (index >= argv.length) {
                throw new Error(`Missing value for ${arg}`);
            }
            return argv[index];
        };

        switch (arg) {
            case '--port':
                options.port = Number(next());
                break;
            case '--duration-ms':
                options.durationMs = Number(next());
                break;
            case '--interval-ms':
                options.intervalMs = Number(next());
                break;
            case '--target-url':
                options.targetUrl = next();
                break;
            case '--output':
                options.output = next();
                break;
            case '--adb-path':
                options.adbPath = next();
                break;
            case '--serial':
                options.serial = next();
                break;
            case '--skip-adb-forward':
                options.skipAdbForward = true;
                break;
            case '--include-frames-each-sample':
                options.includeFramesEachSample = true;
                break;
            case '--list-targets':
                options.listTargets = true;
                break;
            case '--timeout-ms':
                options.timeoutMs = Number(next());
                break;
            case '--help':
            case '-h':
                printUsage();
                process.exit(0);
                break;
            default:
                throw new Error(`Unknown option: ${arg}`);
        }
    }

    if (!Number.isFinite(options.port) || options.port <= 0) {
        throw new Error('Expected --port to be a positive number.');
    }
    if (!Number.isFinite(options.durationMs) || options.durationMs <= 0) {
        throw new Error('Expected --duration-ms to be a positive number.');
    }
    if (!Number.isFinite(options.intervalMs) || options.intervalMs <= 0) {
        throw new Error('Expected --interval-ms to be a positive number.');
    }

    return options;
}

function getDefaultOutputPath() {
    const outputDir = process.platform === 'win32' ? 'C:\\tmp' : os.tmpdir();
    return path.join(outputDir, `vrodos-quest-immersive-smoothness-${Date.now()}.json`);
}

function resolveAdbPath(explicitPath) {
    if (explicitPath) {
        return explicitPath;
    }

    const candidates = [
        process.env.ADB,
        process.env.ANDROID_HOME ? path.join(process.env.ANDROID_HOME, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb') : '',
        process.env.ANDROID_SDK_ROOT ? path.join(process.env.ANDROID_SDK_ROOT, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb') : '',
        process.platform === 'win32' ? 'C:\\Program Files\\Meta Quest Developer Hub\\resources\\bin\\adb.exe' : '',
        process.platform === 'win32' ? 'adb.exe' : 'adb'
    ].filter(Boolean);

    for (const candidate of candidates) {
        if (candidate.includes(path.sep) || candidate.includes('\\')) {
            if (existsSync(candidate)) {
                return candidate;
            }
            continue;
        }

        return candidate;
    }

    return process.platform === 'win32' ? 'adb.exe' : 'adb';
}

function runAdbForward(options) {
    if (options.skipAdbForward) {
        return {
            skipped: true,
            command: '',
            stdout: '',
            stderr: ''
        };
    }

    const adb = resolveAdbPath(options.adbPath);
    const args = [];
    if (options.serial) {
        args.push('-s', options.serial);
    }
    args.push('forward', `tcp:${options.port}`, 'localabstract:chrome_devtools_remote');

    const result = spawnSync(adb, args, { encoding: 'utf8' });
    if (result.error) {
        throw new Error(`Failed to run adb: ${result.error.message}`);
    }
    if (result.status !== 0) {
        throw new Error(`adb forward failed with exit code ${result.status}: ${result.stderr || result.stdout || ''}`);
    }

    return {
        skipped: false,
        command: `${adb} ${args.join(' ')}`,
        stdout: result.stdout || '',
        stderr: result.stderr || ''
    };
}

async function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, timeoutMs) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    } finally {
        clearTimeout(timeout);
    }
}

async function waitForDevToolsEndpoint(port, timeoutMs) {
    const startedAt = Date.now();
    let lastError = null;

    while (Date.now() - startedAt < timeoutMs) {
        try {
            await fetchJson(`http://127.0.0.1:${port}/json/version`, 2000);
            return;
        } catch (error) {
            lastError = error;
        }
        await delay(200);
    }

    throw new Error(`Timed out waiting for Quest Browser DevTools on port ${port}.${lastError ? ` Last error: ${lastError.message}` : ''}`);
}

async function listTargets(port, timeoutMs) {
    const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`, timeoutMs);
    return Array.isArray(targets) ? targets : [];
}

function selectTarget(targets, targetUrl) {
    const pageTargets = targets.filter((target) => target && target.type === 'page' && target.webSocketDebuggerUrl);
    const matcher = String(targetUrl || '').toLowerCase();
    const matchingTarget = matcher
        ? pageTargets.find((target) => (
            String(target.url || '').toLowerCase().includes(matcher) ||
            String(target.title || '').toLowerCase().includes(matcher)
        ))
        : null;

    if (matchingTarget) {
        return matchingTarget;
    }

    return pageTargets.find((target) => String(target.url || '').includes('/runtime/build/')) ||
        pageTargets.find((target) => String(target.url || '').includes('Master_Client_')) ||
        pageTargets[0] ||
        null;
}

async function loadWebSocketClass() {
    if (typeof WebSocket !== 'undefined') {
        return WebSocket;
    }

    try {
        const wsModule = await import('ws');
        return wsModule.WebSocket || wsModule.default;
    } catch (error) {
        throw new Error('No WebSocket implementation found. Use Node.js 22+ or install the "ws" package.');
    }
}

class CDPClient {
    constructor(webSocketUrl, WebSocketClass, commandTimeoutMs) {
        this.nextId = 1;
        this.pending = new Map();
        this.handlers = new Map();
        this.commandTimeoutMs = commandTimeoutMs;
        this.socket = new WebSocketClass(webSocketUrl);
    }

    connect(timeoutMs) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timed out connecting to DevTools WebSocket.')), timeoutMs);
            this.socket.addEventListener('open', () => {
                clearTimeout(timeout);
                resolve();
            }, { once: true });
            this.socket.addEventListener('message', (event) => {
                this.normalizeMessageData(event.data)
                    .then((messageData) => this.handleMessage(messageData))
                    .catch((error) => console.warn(`Could not decode DevTools message: ${error.message || error}`));
            });
            this.socket.addEventListener('error', (event) => {
                clearTimeout(timeout);
                reject(new Error(`DevTools WebSocket error: ${event.message || event.type || 'unknown error'}`));
            }, { once: true });
        });
    }

    async normalizeMessageData(data) {
        if (typeof data === 'string') {
            return data;
        }
        if (data && typeof data.text === 'function') {
            return data.text();
        }
        if (data instanceof ArrayBuffer) {
            return Buffer.from(data).toString('utf8');
        }
        if (ArrayBuffer.isView(data)) {
            return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('utf8');
        }
        return String(data);
    }

    handleMessage(data) {
        const message = JSON.parse(String(data));
        if (message.id && this.pending.has(message.id)) {
            const { resolve, reject } = this.pending.get(message.id);
            this.pending.delete(message.id);
            if (message.error) {
                reject(new Error(`${message.error.message || 'CDP command failed'} (${message.error.code || 'unknown'})`));
            } else {
                resolve(message.result || {});
            }
            return;
        }

        if (!message.method) {
            return;
        }

        const handlers = this.handlers.get(message.method) || [];
        handlers.forEach((handler) => handler(message.params || {}));
    }

    send(method, params = {}) {
        const id = this.nextId;
        this.nextId += 1;

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                if (!this.pending.has(id)) {
                    return;
                }
                this.pending.delete(id);
                reject(new Error(`Timed out waiting for CDP command ${method}.`));
            }, this.commandTimeoutMs);

            this.pending.set(id, {
                resolve: (value) => {
                    clearTimeout(timeout);
                    resolve(value);
                },
                reject: (error) => {
                    clearTimeout(timeout);
                    reject(error);
                }
            });
            this.socket.send(JSON.stringify({ id, method, params }));
        });
    }

    close() {
        try {
            this.socket.close();
        } catch (error) {
            // Cleanup only.
        }
    }
}

async function evaluate(cdp, expression, timeoutMs) {
    const result = await cdp.send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
        timeout: timeoutMs
    });

    if (result.exceptionDetails) {
        const details = result.exceptionDetails;
        throw new Error(details.text || details.exception?.description || 'Runtime.evaluate failed.');
    }

    return result.result ? result.result.value : null;
}

async function captureSample(cdp, includeFrames, timeoutMs) {
    const expression = `(() => {
        const scene = document.querySelector('a-scene');
        const movementEl = document.querySelector('[custom-movement]');
        const movement = movementEl && movementEl.components ? movementEl.components['custom-movement'] : null;
        let smoothness = window.__vrodosImmersiveSmoothnessDiagnostics || null;
        if (movement && typeof movement.getImmersiveSmoothnessDiagnostics === 'function') {
            smoothness = movement.getImmersiveSmoothnessDiagnostics({ includeFrames: ${includeFrames ? 'true' : 'false'} });
        }
        const renderer = scene && scene.renderer ? scene.renderer : null;
        const xr = renderer && renderer.xr ? renderer.xr : null;
        return {
            capturedAt: new Date().toISOString(),
            href: window.location.href,
            title: document.title,
            scenePresent: Boolean(scene),
            xrPresenting: Boolean(xr && xr.isPresenting),
            sceneVrMode: Boolean(scene && scene.is && scene.is('vr-mode')),
            runtimeFeatureState: window.__vrodosRuntimeFeatureState || window.VRODOS_RUNTIME_FEATURE_STATE || null,
            immersiveSmoothness: smoothness,
            storedRuntimeErrors: Array.isArray(window.__vrodosStoredRuntimeErrors) ? window.__vrodosStoredRuntimeErrors.slice(-20) : []
        };
    })()`;

    return evaluate(cdp, expression, timeoutMs);
}

function summarizeCapture(samples) {
    const validSamples = samples.filter((sample) => sample && sample.value);
    const latest = validSamples.length ? validSamples[validSamples.length - 1].value : null;
    const smoothness = latest && latest.immersiveSmoothness ? latest.immersiveSmoothness : null;
    const summary = smoothness && smoothness.summary ? smoothness.summary : null;

    return {
        sampleCount: samples.length,
        validSampleCount: validSamples.length,
        latestHref: latest ? latest.href : '',
        latestXrPresenting: latest ? latest.xrPresenting : false,
        latestFrameCount: smoothness && typeof smoothness.frameCount === 'number' ? smoothness.frameCount : 0,
        latestSummary: summary
    };
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    options.output = options.output || getDefaultOutputPath();

    const adbForward = runAdbForward(options);
    await waitForDevToolsEndpoint(options.port, options.timeoutMs);

    const targets = await listTargets(options.port, options.timeoutMs);
    if (options.listTargets) {
        console.log(JSON.stringify(targets, null, 2));
        return;
    }

    const target = selectTarget(targets, options.targetUrl);
    if (!target) {
        throw new Error(`No Quest Browser page target found. Available targets: ${JSON.stringify(targets.map((entry) => ({
            id: entry.id,
            type: entry.type,
            title: entry.title,
            url: entry.url
        })), null, 2)}`);
    }

    const WebSocketClass = await loadWebSocketClass();
    const cdp = new CDPClient(target.webSocketDebuggerUrl, WebSocketClass, options.timeoutMs);
    const samples = [];
    const startedAt = Date.now();

    try {
        await cdp.connect(options.timeoutMs);
        await cdp.send('Runtime.enable');
        await cdp.send('Page.enable');

        while (Date.now() - startedAt < options.durationMs) {
            const sampleStartedAt = Date.now();
            try {
                const value = await captureSample(cdp, options.includeFramesEachSample, options.timeoutMs);
                samples.push({
                    index: samples.length,
                    sampledAt: new Date().toISOString(),
                    elapsedMs: Date.now() - startedAt,
                    value
                });
            } catch (error) {
                samples.push({
                    index: samples.length,
                    sampledAt: new Date().toISOString(),
                    elapsedMs: Date.now() - startedAt,
                    error: error.message || String(error)
                });
            }

            const remainingDelay = options.intervalMs - (Date.now() - sampleStartedAt);
            if (remainingDelay > 0) {
                await delay(remainingDelay);
            }
        }

        try {
            const value = await captureSample(cdp, true, options.timeoutMs);
            samples.push({
                index: samples.length,
                sampledAt: new Date().toISOString(),
                elapsedMs: Date.now() - startedAt,
                final: true,
                value
            });
        } catch (error) {
            samples.push({
                index: samples.length,
                sampledAt: new Date().toISOString(),
                elapsedMs: Date.now() - startedAt,
                final: true,
                error: error.message || String(error)
            });
        }
    } finally {
        cdp.close();
    }

    const output = {
        capturedAt: new Date().toISOString(),
        options,
        adbForward,
        target: {
            id: target.id,
            type: target.type,
            title: target.title,
            url: target.url
        },
        summary: summarizeCapture(samples),
        samples
    };

    await mkdir(path.dirname(options.output), { recursive: true });
    await writeFile(options.output, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
    console.log(`Wrote ${samples.length} samples to ${options.output}`);
    console.log(JSON.stringify(output.summary, null, 2));
}

main().catch((error) => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
});
