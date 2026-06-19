#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_URL = 'http://wp.local:5832/Master_Client_766.html';
const SPECTOR_CDN_URL = 'https://cdn.jsdelivr.net/npm/spectorjs@0.9.30/dist/spector.bundle.js';

function parseArgs(argv) {
    const options = {
        url: DEFAULT_URL,
        warmupMs: 5000,
        frames: 240,
        traceMs: 3000,
        timeoutMs: 45000,
        viewport: { width: 1280, height: 720 },
        dpr: 1,
        headless: true,
        output: '',
        chrome: '',
        userDataDir: '',
        keepProfile: false,
        json: false,
        spector: false,
        spectorOutput: '',
        disableFpsMeter: false,
        navProfile: false,
        navProfileMs: 3000,
        navProfileInput: { x: 0, y: -1 },
        navProfilePitchDeg: null,
        resourceOverrides: []
    };

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        const [flag, inlineValue] = arg.split('=', 2);
        const nextValue = () => {
            if (inlineValue !== undefined) {
                return inlineValue;
            }
            i += 1;
            return argv[i];
        };
        const nextNumber = (fallback) => {
            const value = Number(nextValue());
            return Number.isFinite(value) ? value : fallback;
        };

        switch (flag) {
            case '--url':
                options.url = nextValue() || options.url;
                break;
            case '--warmup-ms':
                options.warmupMs = nextNumber(options.warmupMs);
                break;
            case '--frames':
                options.frames = nextNumber(options.frames);
                break;
            case '--trace-ms':
                options.traceMs = nextNumber(options.traceMs);
                break;
            case '--timeout-ms':
                options.timeoutMs = nextNumber(options.timeoutMs);
                break;
            case '--viewport': {
                const value = nextValue() || '';
                const match = value.match(/^(\d+)x(\d+)$/i);
                if (!match) {
                    throw new Error(`Invalid --viewport value "${value}". Use WIDTHxHEIGHT.`);
                }
                options.viewport = { width: Number(match[1]), height: Number(match[2]) };
                break;
            }
            case '--dpr':
                options.dpr = nextNumber(options.dpr);
                break;
            case '--output':
                options.output = nextValue() || '';
                break;
            case '--chrome':
                options.chrome = nextValue() || '';
                break;
            case '--user-data-dir':
                options.userDataDir = nextValue() || '';
                break;
            case '--headed':
                options.headless = false;
                break;
            case '--headless':
                options.headless = true;
                break;
            case '--keep-profile':
                options.keepProfile = true;
                break;
            case '--json':
                options.json = true;
                break;
            case '--spector':
                options.spector = true;
                break;
            case '--spector-output':
                options.spectorOutput = nextValue() || '';
                break;
            case '--disable-fps-meter':
                options.disableFpsMeter = true;
                break;
            case '--nav-profile':
                options.navProfile = true;
                break;
            case '--nav-profile-ms':
                options.navProfileMs = nextNumber(options.navProfileMs);
                break;
            case '--nav-profile-input': {
                const value = nextValue() || '';
                const match = value.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
                if (!match) {
                    throw new Error(`Invalid --nav-profile-input value "${value}". Use X,Y.`);
                }
                options.navProfileInput = {
                    x: Math.max(-1, Math.min(1, Number(match[1]))),
                    y: Math.max(-1, Math.min(1, Number(match[2])))
                };
                break;
            }
            case '--nav-profile-pitch-deg': {
                const value = Number(nextValue());
                options.navProfilePitchDeg = Number.isFinite(value)
                    ? Math.max(-89, Math.min(89, value))
                    : null;
                break;
            }
            case '--resource-override':
            case '--asset-override':
                options.resourceOverrides.push(parseResourceOverrideSpec(nextValue() || ''));
                break;
            case '--help':
            case '-h':
                printHelp();
                process.exit(0);
                break;
            default:
                if (!arg.startsWith('-')) {
                    options.url = arg;
                    break;
                }
                throw new Error(`Unknown argument "${arg}".`);
        }
    }

    return options;
}

function printHelp() {
    console.log(`Usage:
  node scripts/profile-master-client.mjs [url] [options]

Options:
  --url URL               Compiled client URL. Defaults to ${DEFAULT_URL}
  --output PATH           Write the full JSON capture to PATH.
  --frames N              Number of requestAnimationFrame deltas to sample. Default: 240.
  --warmup-ms N           Warmup time after page load before sampling. Default: 5000.
  --trace-ms N            DevTools trace duration in ms. Default: 3000.
  --viewport WIDTHxHEIGHT Browser viewport. Default: 1280x720.
  --dpr N                 Device scale factor for the browser. Default: 1.
  --chrome PATH           Chrome/Edge executable path.
  --headed                Run Chrome with a visible window.
  --user-data-dir PATH    Reuse a Chrome profile directory.
  --keep-profile          Keep the temporary profile directory.
  --json                  Print full JSON to stdout even when --output is used.
  --spector               Capture one Spector.js WebGL frame after timing samples.
  --spector-output PATH   Write the Spector capture JSON to PATH. Defaults next to --output.
  --disable-fps-meter     Disable the runtime FPS meter before warmup; this does not persist scene data.
  --nav-profile           Simulate movement and collect custom-movement/navmesh raycast timing.
  --nav-profile-ms N      Movement profile duration in ms. Default: 3000.
  --nav-profile-input X,Y Movement input vector during nav profile. Default: 0,-1.
  --nav-profile-pitch-deg Degrees to set desktop look-controls pitch during nav profile.
  --resource-override URL_OR_PATH=FILE
                           Fulfill a matching compiled-client resource request from a local file.
                           Repeatable; useful for GLB derivative trials without editing uploads.
`);
}

function addUrlQueryParam(url, key, value) {
    try {
        const parsed = new URL(url);
        if (!parsed.searchParams.has(key)) {
            parsed.searchParams.set(key, value);
        }
        return parsed.toString();
    } catch (error) {
        const separator = String(url).includes('?') ? '&' : '?';
        return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }
}

function parseResourceOverrideSpec(spec) {
    const separator = spec.indexOf('=');
    if (separator <= 0 || separator === spec.length - 1) {
        throw new Error(`Invalid --resource-override value "${spec}". Use URL_OR_PATH=FILE.`);
    }

    return {
        match: spec.slice(0, separator).trim(),
        filePath: path.resolve(spec.slice(separator + 1).trim())
    };
}

function normalizeRequestPath(value) {
    if (!value) {
        return '';
    }

    const withoutHash = String(value).split('#')[0];
    const withoutQuery = withoutHash.split('?')[0];

    try {
        if (/^https?:\/\//i.test(withoutQuery)) {
            return decodeURIComponent(new URL(withoutQuery).pathname).replaceAll('\\', '/');
        }
    } catch (error) {
        return withoutQuery.replaceAll('\\', '/');
    }

    try {
        return decodeURIComponent(withoutQuery).replaceAll('\\', '/');
    } catch (error) {
        return withoutQuery.replaceAll('\\', '/');
    }
}

function requestMatchesOverride(requestUrl, match) {
    if (!requestUrl || !match) {
        return false;
    }

    if (requestUrl === match) {
        return true;
    }

    const requestPath = normalizeRequestPath(requestUrl);
    const matchPath = normalizeRequestPath(match);
    return Boolean(requestPath && matchPath && requestPath === matchPath);
}

function mimeTypeForPath(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.glb') {
        return 'model/gltf-binary';
    }
    if (ext === '.gltf') {
        return 'model/gltf+json';
    }
    if (ext === '.ktx2') {
        return 'image/ktx2';
    }
    if (ext === '.bin') {
        return 'application/octet-stream';
    }
    return 'application/octet-stream';
}

async function prepareResourceOverrides(overrides) {
    const prepared = [];
    for (let index = 0; index < overrides.length; index += 1) {
        const override = overrides[index];
        const fileStat = await stat(override.filePath);
        if (!fileStat.isFile()) {
            throw new Error(`Resource override target is not a file: ${override.filePath}`);
        }

        prepared.push({
            index,
            match: override.match,
            filePath: override.filePath,
            mimeType: mimeTypeForPath(override.filePath),
            sizeBytes: fileStat.size,
            fulfilledCount: 0,
            bodyPromise: null
        });
    }
    return prepared;
}

async function readOverrideBody(override) {
    if (!override.bodyPromise) {
        override.bodyPromise = readFile(override.filePath).then((buffer) => ({
            byteLength: buffer.byteLength,
            body: buffer.toString('base64')
        }));
    }
    return override.bodyPromise;
}

async function handleResourceOverrideRequest(cdp, overrides, events, params) {
    const requestUrl = params.request?.url || '';
    const override = overrides.find((candidate) => requestMatchesOverride(requestUrl, candidate.match));

    if (!override) {
        await cdp.send('Fetch.continueRequest', { requestId: params.requestId });
        return;
    }

    const body = await readOverrideBody(override);
    await cdp.send('Fetch.fulfillRequest', {
        requestId: params.requestId,
        responseCode: 200,
        responseHeaders: [
            { name: 'Content-Type', value: override.mimeType },
            { name: 'Content-Length', value: String(body.byteLength) },
            { name: 'Access-Control-Allow-Origin', value: '*' },
            { name: 'Cache-Control', value: 'no-store' },
            { name: 'X-VRodos-Profile-Resource-Override', value: '1' }
        ],
        body: body.body
    });

    override.fulfilledCount += 1;
    events.push({
        match: override.match,
        requestUrl,
        filePath: override.filePath,
        mimeType: override.mimeType,
        sizeBytes: body.byteLength,
        sizeLabel: formatBytes(body.byteLength)
    });
}

async function enableResourceOverrides(cdp, overrides, events) {
    if (!overrides.length) {
        return;
    }

    cdp.on('Fetch.requestPaused', (params) => {
        handleResourceOverrideRequest(cdp, overrides, events, params).catch(async (error) => {
            events.push({
                requestUrl: params.request?.url || '',
                error: error.message || String(error)
            });
            try {
                await cdp.send('Fetch.continueRequest', { requestId: params.requestId });
            } catch (continueError) {
                // The request may already be closed; the captured event above is enough.
            }
        });
    });

    await cdp.send('Fetch.enable', {
        patterns: [
            {
                urlPattern: '*'
            }
        ]
    });
}

function summarizeResourceOverrides(overrides, events) {
    const fulfilledBytes = events.reduce((total, event) => total + (Number(event.sizeBytes) || 0), 0);
    return {
        enabled: overrides.length > 0,
        configured: overrides.map((override) => ({
            match: override.match,
            filePath: override.filePath,
            mimeType: override.mimeType,
            sizeBytes: override.sizeBytes,
            sizeLabel: formatBytes(override.sizeBytes),
            fulfilledCount: override.fulfilledCount
        })),
        fulfilledCount: events.filter((event) => !event.error).length,
        fulfilledBytes,
        fulfilledSizeLabel: formatBytes(fulfilledBytes),
        events
    };
}

function deriveSpectorOutputPath(outputPath) {
    if (!outputPath) {
        return '';
    }

    const parsed = path.parse(path.resolve(outputPath));
    const base = parsed.ext ? parsed.name : parsed.base;
    const ext = parsed.ext || '.json';
    return path.join(parsed.dir, `${base}.spector${ext}`);
}

function resolveSpectorOutputPath(options) {
    if (!options.spector) {
        return '';
    }

    if (options.spectorOutput) {
        return path.resolve(options.spectorOutput);
    }

    if (options.output) {
        return deriveSpectorOutputPath(options.output);
    }

    return path.join(os.tmpdir(), `vrodos-master-client-spector-${Date.now()}.json`);
}

async function loadWebSocketClass() {
    if (typeof WebSocket !== 'undefined') {
        return WebSocket;
    }

    try {
        const wsModule = await import('ws');
        return wsModule.WebSocket || wsModule.default;
    } catch (error) {
        throw new Error('No WebSocket implementation found. Use Node.js with global WebSocket support or install the "ws" package.');
    }
}

class CDPClient {
    constructor(webSocketUrl, WebSocketClass, commandTimeoutMs = 30000) {
        this.nextId = 1;
        this.pending = new Map();
        this.handlers = new Map();
        this.commandTimeoutMs = commandTimeoutMs;
        this.socket = new WebSocketClass(webSocketUrl);
    }

    connect(timeoutMs) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timed out connecting to Chrome DevTools WebSocket.')), timeoutMs);
            this.socket.addEventListener('open', () => {
                clearTimeout(timeout);
                resolve();
            }, { once: true });
            this.socket.addEventListener('message', (event) => {
                this.normalizeMessageData(event.data)
                    .then((messageData) => this.handleMessage(messageData))
                    .catch((error) => {
                        console.warn(`Could not decode Chrome DevTools WebSocket message: ${error.message || error}`);
                    });
            });
            this.socket.addEventListener('error', (event) => {
                clearTimeout(timeout);
                reject(new Error(`Chrome DevTools WebSocket error: ${event.message || event.type || 'unknown error'}`));
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

    on(method, handler) {
        const handlers = this.handlers.get(method) || [];
        handlers.push(handler);
        this.handlers.set(method, handlers);
    }

    waitForEvent(method, timeoutMs) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Timed out waiting for ${method}.`));
            }, timeoutMs);

            const handler = (params) => {
                clearTimeout(timeout);
                const handlers = this.handlers.get(method) || [];
                this.handlers.set(method, handlers.filter((candidate) => candidate !== handler));
                resolve(params);
            };
            this.on(method, handler);
        });
    }

    close() {
        try {
            this.socket.close();
        } catch (error) {
            // Nothing useful to do during cleanup.
        }
    }
}

async function getFreePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(0, '127.0.0.1', () => {
            const address = server.address();
            server.close(() => resolve(address.port));
        });
        server.on('error', reject);
    });
}

function findChrome(explicitPath) {
    if (explicitPath) {
        return explicitPath;
    }

    const candidates = [
        process.env.CHROME_PATH,
        process.env.CHROME_BIN
    ].filter(Boolean);

    if (process.platform === 'win32') {
        candidates.push(
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
            'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
            'chrome.exe',
            'msedge.exe'
        );
    } else if (process.platform === 'darwin') {
        candidates.push(
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
            'google-chrome',
            'chromium',
            'msedge'
        );
    } else {
        candidates.push('google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'msedge');
    }

    return candidates.find((candidate) => candidate.includes(path.sep) ? existsSync(candidate) : true);
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForChildExit(child, timeoutMs) {
    if (child.exitCode !== null || child.signalCode) {
        return Promise.resolve(true);
    }

    return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), timeoutMs);
        child.once('exit', () => {
            clearTimeout(timeout);
            resolve(true);
        });
    });
}

async function removeTemporaryProfile(userDataDir) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
            await rm(userDataDir, { recursive: true, force: true });
            return;
        } catch (error) {
            await delay(250);
        }
    }
}

async function waitForChrome(port, timeoutMs) {
    const startedAt = Date.now();
    let lastError = null;
    while (Date.now() - startedAt < timeoutMs) {
        try {
            const response = await fetchWithTimeout(`http://127.0.0.1:${port}/json/version`, {}, 2000);
            if (response.ok) {
                return response.json();
            }
        } catch (error) {
            lastError = error;
        }
        await delay(150);
    }
    throw new Error(`Timed out waiting for Chrome DevTools endpoint.${lastError ? ` Last error: ${lastError.message}` : ''}`);
}

async function createTarget(port) {
    const url = `http://127.0.0.1:${port}/json/new?${encodeURIComponent('about:blank')}`;
    const response = await fetchWithTimeout(url, { method: 'PUT' }, 5000);
    if (!response.ok) {
        throw new Error(`Could not create Chrome target: HTTP ${response.status}`);
    }
    return response.json();
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal
        });
    } finally {
        clearTimeout(timeout);
    }
}

async function evaluate(cdp, expression, returnByValue = true, timeoutMs = 30000) {
    const result = await cdp.send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue,
        timeout: timeoutMs
    });

    if (result.exceptionDetails) {
        const details = result.exceptionDetails;
        throw new Error(details.text || details.exception?.description || 'Runtime.evaluate failed.');
    }

    return result.result?.value;
}

async function waitForRuntime(cdp, expression, timeoutMs) {
    const startedAt = Date.now();
    let lastValue = null;
    while (Date.now() - startedAt < timeoutMs) {
        try {
            lastValue = await evaluate(cdp, expression, true, 5000);
            if (lastValue) {
                return lastValue;
            }
        } catch (error) {
            lastValue = error.message;
        }
        await delay(250);
    }
    throw new Error(`Timed out waiting for runtime condition: ${expression}. Last value: ${lastValue}`);
}

function metricsToObject(metrics) {
    return Object.fromEntries((metrics || []).map((metric) => [metric.name, metric.value]));
}

function percentile(values, ratio) {
    if (!values.length) {
        return null;
    }
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1));
    return sorted[index];
}

function summarizeFrameDeltas(deltas) {
    const valid = deltas.filter((value) => Number.isFinite(value) && value > 0);
    if (!valid.length) {
        return {
            count: 0,
            minMs: null,
            meanMs: null,
            p50Ms: null,
            p95Ms: null,
            maxMs: null,
            over16_7Ms: 0,
            over33_3Ms: 0
        };
    }

    const sum = valid.reduce((total, value) => total + value, 0);
    return {
        count: valid.length,
        minMs: Math.min(...valid),
        meanMs: sum / valid.length,
        p50Ms: percentile(valid, 0.5),
        p95Ms: percentile(valid, 0.95),
        maxMs: Math.max(...valid),
        over16_7Ms: valid.filter((value) => value > 16.7).length,
        over33_3Ms: valid.filter((value) => value > 33.3).length
    };
}

function summarizeTrace(traceEvents) {
    const byName = new Map();
    const totals = {
        eventCount: traceEvents.length,
        totalDurationMs: 0,
        gpuDurationMs: 0,
        scriptingDurationMs: 0,
        renderingDurationMs: 0,
        paintingDurationMs: 0
    };

    for (const event of traceEvents) {
        if (event.ph !== 'X' || !Number.isFinite(event.dur)) {
            continue;
        }

        const durationMs = event.dur / 1000;
        const name = event.name || 'unknown';
        const categories = event.cat || '';
        totals.totalDurationMs += durationMs;

        if (/gpu|viz/i.test(categories) || /gpu|drawframe|submitcompositorframe/i.test(name)) {
            totals.gpuDurationMs += durationMs;
        }
        if (/FunctionCall|EvaluateScript|v8|TimerFire|FireAnimationFrame/i.test(name) || /v8/i.test(categories)) {
            totals.scriptingDurationMs += durationMs;
        }
        if (/Layout|UpdateLayerTree|CompositeLayers|PrePaint|HitTest/i.test(name)) {
            totals.renderingDurationMs += durationMs;
        }
        if (/Paint|Raster|ImageDecode|Draw LazyPixelRef/i.test(name)) {
            totals.paintingDurationMs += durationMs;
        }

        const entry = byName.get(name) || { name, count: 0, totalMs: 0, maxMs: 0 };
        entry.count += 1;
        entry.totalMs += durationMs;
        entry.maxMs = Math.max(entry.maxMs, durationMs);
        byName.set(name, entry);
    }

    return {
        totals,
        topEvents: [...byName.values()]
            .sort((a, b) => b.totalMs - a.totalMs)
            .slice(0, 30)
    };
}

async function readTraceStream(cdp, streamHandle, timeoutMs) {
    let json = '';
    let eof = false;
    const deadline = Date.now() + timeoutMs;
    const maxTraceBytes = 100 * 1024 * 1024;

    while (!eof) {
        if (Date.now() > deadline) {
            throw new Error('Timed out reading Chrome trace stream.');
        }
        const chunk = await cdp.send('IO.read', { handle: streamHandle, size: 1024 * 1024 });
        json += chunk.data || '';
        if (json.length > maxTraceBytes) {
            throw new Error(`Chrome trace stream exceeded ${maxTraceBytes} bytes.`);
        }
        eof = Boolean(chunk.eof);
    }

    await cdp.send('IO.close', { handle: streamHandle });
    return JSON.parse(json);
}

async function collectTrace(cdp, durationMs, timeoutMs) {
    if (durationMs <= 0) {
        return summarizeTrace([]);
    }

    const completePromise = cdp.waitForEvent('Tracing.tracingComplete', timeoutMs);
    await cdp.send('Tracing.start', {
        categories: [
            'devtools.timeline',
            'disabled-by-default-devtools.timeline',
            'disabled-by-default-devtools.timeline.frame',
            'blink.user_timing',
            'gpu',
            'toplevel',
            'v8'
        ].join(','),
        transferMode: 'ReturnAsStream'
    });
    await delay(durationMs);
    await cdp.send('Tracing.end');
    const complete = await completePromise;
    const trace = await readTraceStream(cdp, complete.stream, timeoutMs);
    return summarizeTrace(trace.traceEvents || []);
}

async function sampleFrames(cdp, frames) {
    return evaluate(cdp, `(() => {
        const frameCount = ${JSON.stringify(frames)};
        return new Promise((resolve) => {
            const deltas = [];
            let lastTime = 0;
            let seen = 0;
            let resolved = false;
            function readRendererPixelInfo(renderer) {
                if (!renderer) {
                    return null;
                }
                const pixelRatio = typeof renderer.getPixelRatio === 'function' ? renderer.getPixelRatio() : null;
                const size = { width: null, height: null };
                if (typeof renderer.getSize === 'function') {
                    const target = {
                        width: 0,
                        height: 0,
                        set(width, height) {
                            this.width = width;
                            this.height = height;
                            return this;
                        },
                        divideScalar(scalar) {
                            this.width /= scalar;
                            this.height /= scalar;
                            return this;
                        }
                    };
                    renderer.getSize(target);
                    size.width = target.width;
                    size.height = target.height;
                }
                const canvas = renderer.domElement || null;
                const cssWidth = size.width || (canvas ? canvas.clientWidth : null) || window.innerWidth || null;
                const cssHeight = size.height || (canvas ? canvas.clientHeight : null) || window.innerHeight || null;
                const drawingBufferWidth = canvas && canvas.width ? canvas.width : (
                    cssWidth && pixelRatio ? Math.round(cssWidth * pixelRatio) : null
                );
                const drawingBufferHeight = canvas && canvas.height ? canvas.height : (
                    cssHeight && pixelRatio ? Math.round(cssHeight * pixelRatio) : null
                );
                return {
                    pixelRatio,
                    cssSize: {
                        width: cssWidth,
                        height: cssHeight
                    },
                    drawingBuffer: {
                        width: drawingBufferWidth,
                        height: drawingBufferHeight,
                        pixels: drawingBufferWidth && drawingBufferHeight ? drawingBufferWidth * drawingBufferHeight : null
                    },
                    estimatedRenderPixels: cssWidth && cssHeight && pixelRatio
                        ? Math.round(cssWidth * cssHeight * pixelRatio * pixelRatio)
                        : null
                };
            }
            function readRendererInfo() {
                const scene = document.querySelector('a-scene');
                const renderer = scene && scene.renderer;
                if (!renderer || !renderer.info) {
                    return null;
                }
                const pixelInfo = readRendererPixelInfo(renderer);
                return {
                    pixelRatio: pixelInfo ? pixelInfo.pixelRatio : null,
                    size: pixelInfo ? pixelInfo.cssSize : { width: null, height: null },
                    cssSize: pixelInfo ? pixelInfo.cssSize : null,
                    drawingBuffer: pixelInfo ? pixelInfo.drawingBuffer : null,
                    estimatedRenderPixels: pixelInfo ? pixelInfo.estimatedRenderPixels : null,
                    memory: Object.assign({}, renderer.info.memory || {}),
                    render: Object.assign({}, renderer.info.render || {}),
                    programs: renderer.info.programs ? renderer.info.programs.length : null
                };
            }
            function tick(now) {
                if (resolved) {
                    return;
                }
                if (lastTime) {
                    deltas.push(now - lastTime);
                }
                lastTime = now;
                seen += 1;
                if (seen <= frameCount) {
                    requestAnimationFrame(tick);
                    return;
                }
                resolved = true;
                clearTimeout(timeout);
                resolve({
                    deltas,
                    rendererInfo: readRendererInfo(),
                    timedOut: false
                });
            }
            const timeout = setTimeout(() => {
                if (resolved) {
                    return;
                }
                resolved = true;
                resolve({
                    deltas,
                    rendererInfo: readRendererInfo(),
                    timedOut: true
                });
            }, Math.max(10000, frameCount * 200));
            requestAnimationFrame(tick);
        });
    })()`, true, Math.max(30000, frames * 200));
}

async function disableRuntimeFpsMeter(cdp) {
    return evaluate(cdp, `(() => {
        const scene = document.querySelector('a-scene');
        const settingsComponent = scene && scene.components && scene.components['scene-settings'];
        const params = new URLSearchParams(window.location.search || '');
        const preinitDisabled = params.get('vrodos_debug_disable_fps_meter') === '1';
        if (!settingsComponent || !settingsComponent.data) {
            return {
                disabled: false,
                reason: 'scene-settings component was not available',
                preinitDisabled
            };
        }

        const before = settingsComponent.data.fpsMeterEnabled;
        settingsComponent.data.fpsMeterEnabled = '0';
        if (typeof settingsComponent.syncFPSMeterState === 'function') {
            settingsComponent.syncFPSMeterState();
        } else if (typeof settingsComponent.disableFPSMeter === 'function') {
            settingsComponent.disableFPSMeter();
        }

        return {
            disabled: true,
            preinitDisabled,
            before,
            after: settingsComponent.data.fpsMeterEnabled,
            statsObjectPresent: Boolean(settingsComponent.fpsStats),
            statsElementPresent: Boolean(document.getElementById('vrodos-stats-meter')),
            requestedAfterOverride: typeof settingsComponent.isFPSMeterRequested === 'function'
                ? settingsComponent.isFPSMeterRequested()
                : null
        };
    })()`);
}

async function captureNavigationProfile(cdp, durationMs, input, pitchDeg = null) {
    const safeDuration = Math.max(250, Math.min(60000, Number(durationMs) || 3000));
    const safeInput = {
        x: Math.max(-1, Math.min(1, Number(input?.x) || 0)),
        y: Math.max(-1, Math.min(1, Number(input?.y) || 0))
    };
    const safePitchDeg = Number.isFinite(Number(pitchDeg))
        ? Math.max(-89, Math.min(89, Number(pitchDeg)))
        : null;

    return evaluate(cdp, `(() => {
        const durationMs = ${JSON.stringify(safeDuration)};
        const input = ${JSON.stringify(safeInput)};
        const pitchDeg = ${JSON.stringify(safePitchDeg)};
        const movementEl = document.querySelector('[custom-movement]');
        const component = movementEl && movementEl.components && movementEl.components['custom-movement'];
        if (!component) {
            return {
                enabled: false,
                reason: 'custom-movement component was not available'
            };
        }

        if (!component.navPerfDebug && typeof component.createNavPerfDebugState === 'function') {
            window.VRODOS_DEBUG = window.VRODOS_DEBUG || {};
            window.VRODOS_DEBUG.navPerf = true;
            component.navPerfDebug = component.createNavPerfDebugState();
        }

        const startSnapshot = typeof component.getNavPerfDebugSnapshot === 'function'
            ? component.getNavPerfDebugSnapshot()
            : null;
        const previousKeyboard = {
            x: component.keyboardInput ? component.keyboardInput.x : 0,
            y: component.keyboardInput ? component.keyboardInput.y : 0
        };
        const previousThumb = {
            x: component.thumbInput ? component.thumbInput.x : 0,
            y: component.thumbInput ? component.thumbInput.y : 0
        };
        const lookControls = typeof component.getLookControlsComponent === 'function'
            ? component.getLookControlsComponent()
            : (document.querySelector('[look-controls]')?.components?.['look-controls'] || null);
        const previousPitch = lookControls && lookControls.pitchObject && lookControls.pitchObject.rotation
            ? lookControls.pitchObject.rotation.x
            : null;

        if (component.keyboardInput) {
            component.keyboardInput.x = input.x;
            component.keyboardInput.y = input.y;
        }
        if (component.thumbInput) {
            component.thumbInput.x = 0;
            component.thumbInput.y = 0;
        }
        if (lookControls && lookControls.pitchObject && lookControls.pitchObject.rotation && pitchDeg !== null) {
            lookControls.pitchObject.rotation.x = (Math.PI / 180) * pitchDeg;
            if (typeof lookControls.updateOrientation === 'function') {
                lookControls.updateOrientation();
            }
        }

        function restoreInput() {
            if (component.keyboardInput) {
                component.keyboardInput.x = previousKeyboard.x;
                component.keyboardInput.y = previousKeyboard.y;
            }
            if (component.thumbInput) {
                component.thumbInput.x = previousThumb.x;
                component.thumbInput.y = previousThumb.y;
            }
            if (lookControls && lookControls.pitchObject && lookControls.pitchObject.rotation && previousPitch !== null) {
                lookControls.pitchObject.rotation.x = previousPitch;
                if (typeof lookControls.updateOrientation === 'function') {
                    lookControls.updateOrientation();
                }
            }
        }

        function nextFrame() {
            return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        }

        return new Promise((resolve) => {
            window.setTimeout(async () => {
                restoreInput();
                await nextFrame();
                const endSnapshot = typeof component.getNavPerfDebugSnapshot === 'function'
                    ? component.getNavPerfDebugSnapshot()
                    : null;
                resolve({
                    enabled: Boolean(endSnapshot && endSnapshot.enabled),
                    durationMs,
                    input,
                    start: startSnapshot,
                    end: endSnapshot,
                    movementDelta: startSnapshot && endSnapshot && startSnapshot.position && endSnapshot.position ? {
                        x: endSnapshot.position.x - startSnapshot.position.x,
                        y: endSnapshot.position.y - startSnapshot.position.y,
                        z: endSnapshot.position.z - startSnapshot.position.z
                    } : null
                });
            }, durationMs);
        });
    })()`, true, Math.max(10000, safeDuration + 10000));
}

async function captureSceneSnapshot(cdp) {
    return evaluate(cdp, `(() => {
        const scene = document.querySelector('a-scene');
        const settingsComponent = scene && scene.components && scene.components['scene-settings'];
        const settings = settingsComponent ? Object.assign({}, settingsComponent.data) : null;
        const object3D = scene && scene.object3D;
        const renderer = scene && scene.renderer;
        const geometries = new Set();
        const materials = new Set();
        const textures = new Set();
        const lights = [];
        const counts = {
            objects: 0,
            meshes: 0,
            visibleMeshes: 0,
            shadowCasters: 0,
            shadowReceivers: 0,
            frustumCulledFalse: 0,
            lights: 0
        };

        function readRendererPixelInfo() {
            if (!renderer) {
                return null;
            }
            const pixelRatio = typeof renderer.getPixelRatio === 'function' ? renderer.getPixelRatio() : null;
            const size = { width: null, height: null };
            if (typeof renderer.getSize === 'function') {
                const target = {
                    width: 0,
                    height: 0,
                    set(width, height) {
                        this.width = width;
                        this.height = height;
                        return this;
                    },
                    divideScalar(scalar) {
                        this.width /= scalar;
                        this.height /= scalar;
                        return this;
                    }
                };
                renderer.getSize(target);
                size.width = target.width;
                size.height = target.height;
            }
            const canvas = renderer.domElement || null;
            const cssWidth = size.width || (canvas ? canvas.clientWidth : null) || window.innerWidth || null;
            const cssHeight = size.height || (canvas ? canvas.clientHeight : null) || window.innerHeight || null;
            const drawingBufferWidth = canvas && canvas.width ? canvas.width : (
                cssWidth && pixelRatio ? Math.round(cssWidth * pixelRatio) : null
            );
            const drawingBufferHeight = canvas && canvas.height ? canvas.height : (
                cssHeight && pixelRatio ? Math.round(cssHeight * pixelRatio) : null
            );
            return {
                pixelRatio,
                cssSize: {
                    width: cssWidth,
                    height: cssHeight
                },
                drawingBuffer: {
                    width: drawingBufferWidth,
                    height: drawingBufferHeight,
                    pixels: drawingBufferWidth && drawingBufferHeight ? drawingBufferWidth * drawingBufferHeight : null
                },
                estimatedRenderPixels: cssWidth && cssHeight && pixelRatio
                    ? Math.round(cssWidth * cssHeight * pixelRatio * pixelRatio)
                    : null
            };
        }

        function addMaterial(material) {
            if (!material) {
                return;
            }
            if (Array.isArray(material)) {
                material.forEach(addMaterial);
                return;
            }
            materials.add(material.uuid || material.id || materials.size);
            Object.keys(material).forEach((key) => {
                const value = material[key];
                if (value && value.isTexture) {
                    textures.add(value.uuid || value.id || textures.size);
                }
            });
        }

        function threeConstantName(value, names) {
            const three = window.THREE || (window.AFRAME && window.AFRAME.THREE);
            if (!three || typeof value === 'undefined' || value === null) {
                return null;
            }
            for (const name of names) {
                if (three[name] === value) {
                    return name;
                }
            }
            return null;
        }

        if (object3D) {
            object3D.traverse((node) => {
                counts.objects += 1;
                if (node.isLight) {
                    counts.lights += 1;
                    const light = {
                        name: node.name || '',
                        type: node.type || '',
                        visible: node.visible !== false,
                        intensity: typeof node.intensity === 'number' ? node.intensity : null,
                        color: node.color && typeof node.color.getHexString === 'function' ? \`#\${node.color.getHexString()}\` : null,
                        groundColor: node.groundColor && typeof node.groundColor.getHexString === 'function' ? \`#\${node.groundColor.getHexString()}\` : null,
                        castShadow: Boolean(node.castShadow),
                        vrodosTakram: Boolean(node.userData && node.userData.vrodosPmndrsTakramLightSource)
                    };
                    if (node.isLightProbe && node.sh && Array.isArray(node.sh.coefficients)) {
                        light.shCoefficientLengths = node.sh.coefficients.map((coefficient) => (
                            coefficient && typeof coefficient.length === 'function'
                                ? Number(coefficient.length().toFixed(6))
                                : null
                        ));
                    }
                    lights.push(light);
                }
                if (!node.isMesh) {
                    return;
                }
                counts.meshes += 1;
                if (node.visible) {
                    counts.visibleMeshes += 1;
                }
                if (node.castShadow) {
                    counts.shadowCasters += 1;
                }
                if (node.receiveShadow) {
                    counts.shadowReceivers += 1;
                }
                if (node.frustumCulled === false) {
                    counts.frustumCulledFalse += 1;
                }
                if (node.geometry) {
                    geometries.add(node.geometry.uuid || node.geometry.id || geometries.size);
                }
                addMaterial(node.material);
            });
        }

        const rendererPixelInfo = readRendererPixelInfo();

        return {
            location: window.location.href,
            userAgent: navigator.userAgent,
            devicePixelRatio: window.devicePixelRatio,
            sceneLoaded: Boolean(scene && scene.hasLoaded),
            settings,
            effectiveQuality: settingsComponent ? {
                renderQuality: typeof settingsComponent.getRenderQualityLevel === 'function' ? settingsComponent.getRenderQualityLevel() : settingsComponent.data.renderQuality,
                shadowQuality: typeof settingsComponent.getEffectiveShadowQuality === 'function' ? settingsComponent.getEffectiveShadowQuality() : settingsComponent.data.shadowQuality,
                atmosphereQuality: typeof settingsComponent.getPmndrsAtmosphereQuality === 'function' ? settingsComponent.getPmndrsAtmosphereQuality() : settingsComponent.data.pmndrsAtmosphereQuality,
                pmndrsAA: typeof settingsComponent.getPmndrsAAMode === 'function' ? settingsComponent.getPmndrsAAMode() : settingsComponent.data.pmndrsAAMode,
                pmndrsAAPreset: typeof settingsComponent.getPmndrsAAPreset === 'function' ? settingsComponent.getPmndrsAAPreset() : settingsComponent.data.pmndrsAAPreset,
                ambientOcclusionPreset: typeof settingsComponent.getAmbientOcclusionPreset === 'function' ? settingsComponent.getAmbientOcclusionPreset() : settingsComponent.data.ambientOcclusionPreset,
                pmndrsLutEnabled: typeof settingsComponent.isPmndrsLutEnabled === 'function' ? settingsComponent.isPmndrsLutEnabled() : settingsComponent.data.pmndrsLutEnabled,
                pmndrsLensFlareEnabled: typeof settingsComponent.isPmndrsLensFlareEnabled === 'function' ? settingsComponent.isPmndrsLensFlareEnabled() : settingsComponent.data.pmndrsLensFlareEnabled,
                postProcessingRequested: typeof settingsComponent.hasPostProcessingPipelineRequest === 'function' ? settingsComponent.hasPostProcessingPipelineRequest() : null,
                postProcessingActive: Boolean(settingsComponent.postProcessingActive || settingsComponent.pmndrsActive),
                shouldUsePostProcessing: typeof settingsComponent.shouldUsePostProcessing === 'function' ? settingsComponent.shouldUsePostProcessing() : null,
                shadowUpdateMode: typeof settingsComponent.getShadowUpdateMode === 'function' ? settingsComponent.getShadowUpdateMode() : settingsComponent.data.shadowUpdateMode,
                shadowDiagnostics: typeof settingsComponent.getShadowDiagnosticState === 'function' ? settingsComponent.getShadowDiagnosticState() : null,
                pmndrsNativeSsaoBudget: settingsComponent._pmndrsNativeSsaoBudget || null,
                fpsMeter: {
                    requested: typeof settingsComponent.isFPSMeterRequested === 'function' ? settingsComponent.isFPSMeterRequested() : null,
                    enabledSetting: settingsComponent.data.fpsMeterEnabled,
                    statsObjectPresent: Boolean(settingsComponent.fpsStats),
                    statsElementPresent: Boolean(document.getElementById('vrodos-stats-meter')),
                    preinitDisabled: new URLSearchParams(window.location.search || '').get('vrodos_debug_disable_fps_meter') === '1'
                }
            } : null,
            renderer: renderer ? {
                sceneAttribute: scene ? scene.getAttribute('renderer') : null,
                shadowSceneAttribute: scene ? scene.getAttribute('shadow') : null,
                pixelRatio: rendererPixelInfo ? rendererPixelInfo.pixelRatio : null,
                cssSize: rendererPixelInfo ? rendererPixelInfo.cssSize : null,
                drawingBuffer: rendererPixelInfo ? rendererPixelInfo.drawingBuffer : null,
                estimatedRenderPixels: rendererPixelInfo ? rendererPixelInfo.estimatedRenderPixels : null,
                pixelBudget: settingsComponent && settingsComponent._vrodosRenderPixelBudget
                    ? Object.assign({}, settingsComponent._vrodosRenderPixelBudget)
                    : null,
                sortObjects: typeof renderer.sortObjects !== 'undefined' ? renderer.sortObjects : null,
                shadowMapEnabled: Boolean(renderer.shadowMap && renderer.shadowMap.enabled),
                shadowMapAutoUpdate: renderer.shadowMap ? renderer.shadowMap.autoUpdate : null,
                shadowMapNeedsUpdate: renderer.shadowMap ? renderer.shadowMap.needsUpdate : null,
                shadowMapType: renderer.shadowMap ? renderer.shadowMap.type : null,
                shadowMapTypeName: renderer.shadowMap ? threeConstantName(renderer.shadowMap.type, [
                    'BasicShadowMap',
                    'PCFShadowMap',
                    'PCFSoftShadowMap',
                    'VSMShadowMap'
                ]) : null,
                contextAttributes: renderer.getContext && renderer.getContext() && renderer.getContext().getContextAttributes
                    ? renderer.getContext().getContextAttributes()
                    : null,
                logarithmicDepthBuffer: Boolean(renderer.capabilities && renderer.capabilities.logarithmicDepthBuffer),
                outputColorSpace: renderer.outputColorSpace || null,
                toneMapping: typeof renderer.toneMapping !== 'undefined' ? renderer.toneMapping : null,
                toneMappingName: threeConstantName(renderer.toneMapping, [
                    'NoToneMapping',
                    'LinearToneMapping',
                    'ReinhardToneMapping',
                    'CineonToneMapping',
                    'ACESFilmicToneMapping',
                    'AgXToneMapping',
                    'NeutralToneMapping'
                ]),
                toneMappingExposure: typeof renderer.toneMappingExposure !== 'undefined' ? renderer.toneMappingExposure : null,
                info: renderer.info ? {
                    memory: Object.assign({}, renderer.info.memory || {}),
                    render: Object.assign({}, renderer.info.render || {}),
                    programs: renderer.info.programs ? renderer.info.programs.length : null
                } : null
            } : null,
            objectCounts: Object.assign(counts, {
                geometries: geometries.size,
                materials: materials.size,
                textures: textures.size
            }),
            lighting: lights,
            domCounts: {
                gltfModelElements: document.querySelectorAll('[gltf-model]').length,
                lazyGltfElements: document.querySelectorAll('[data-vrodos-lazy-gltf-src]').length,
                lazyGltfQueued: document.querySelectorAll('[data-vrodos-lazy-state="queued"]').length,
                lazyGltfLoading: document.querySelectorAll('[data-vrodos-lazy-state="loading"]').length,
                lazyGltfLoaded: document.querySelectorAll('[data-vrodos-lazy-state="loaded"]').length,
                lazyGltfErrors: document.querySelectorAll('[data-vrodos-lazy-state="error"]').length,
                assetItems: document.querySelectorAll('a-assets > a-asset-item').length,
                images: document.querySelectorAll('img, a-image').length,
                videos: document.querySelectorAll('video, a-video').length,
                clearFrustumElements: document.querySelectorAll('[clear-frustum-culling]').length,
                raycastableElements: document.querySelectorAll('.raycastable').length
            },
            gltfModel: scene ? {
                sceneAttribute: scene.getAttribute('gltf-model'),
                systemData: scene.systems && scene.systems['gltf-model'] && scene.systems['gltf-model'].data
                    ? Object.assign({}, scene.systems['gltf-model'].data)
                    : null,
                decoderGlobals: {
                    draco: window.vrodos_three_draco_decoder_path || window.vrodos_three_decoder_path || null,
                    basis: window.vrodos_three_basis_transcoder_path || null,
                    meshopt: window.vrodos_three_meshopt_decoder_path || null
                }
            } : null,
            debug: {
                spectorGlobalAvailable: Boolean(window.SPECTOR && window.SPECTOR.Spector),
                vrodosSpectorAvailable: Boolean(window.VRODOS_SPECTOR),
                spectorDebugScriptLoaded: Boolean(document.querySelector('script[data-vrodos-spector-debug="true"]')),
                spectorProfilerScriptLoaded: Boolean(document.querySelector('script[data-vrodos-spector-profiler="true"]'))
            },
            runtimeFeatureState: window.VRODOS_RUNTIME_FEATURE_STATE || window.__vrodosRuntimeFeatureState || null,
            compileDiagnostics: window.VRODOS_COMPILE_DIAGNOSTICS || null
        };
    })()`);
}

async function captureResources(cdp) {
    return evaluate(cdp, `(() => {
        const resources = performance.getEntriesByType('resource').map((entry) => ({
            name: entry.name,
            initiatorType: entry.initiatorType,
            duration: entry.duration,
            transferSize: entry.transferSize || 0,
            encodedBodySize: entry.encodedBodySize || 0,
            decodedBodySize: entry.decodedBodySize || 0
        }));
        const byType = {};
        for (const resource of resources) {
            const type = resource.initiatorType || 'unknown';
            byType[type] = byType[type] || { count: 0, transferSize: 0, encodedBodySize: 0, decodedBodySize: 0 };
            byType[type].count += 1;
            byType[type].transferSize += resource.transferSize;
            byType[type].encodedBodySize += resource.encodedBodySize;
            byType[type].decodedBodySize += resource.decodedBodySize;
        }
        return {
            totals: {
                count: resources.length,
                transferSize: resources.reduce((total, item) => total + item.transferSize, 0),
                encodedBodySize: resources.reduce((total, item) => total + item.encodedBodySize, 0),
                decodedBodySize: resources.reduce((total, item) => total + item.decodedBodySize, 0)
            },
            byType,
            largest: resources
                .slice()
                .sort((a, b) => Math.max(b.transferSize, b.encodedBodySize, b.decodedBodySize) - Math.max(a.transferSize, a.encodedBodySize, a.decodedBodySize))
                .slice(0, 30)
        };
    })()`);
}

function summarizeSpectorCapture(capture) {
    if (!capture || typeof capture !== 'object') {
        return null;
    }

    const commands = Array.isArray(capture.commands) ? capture.commands : [];
    const primitiveAnalysis = Array.isArray(capture.analyses)
        ? capture.analyses.find((analysis) => analysis && analysis.analyserName === 'Primitives')
        : null;
    const commandCounts = {};
    for (const command of commands) {
        const name = command && (command.name || command.commandName || command.functionName || command.method);
        if (!name) {
            continue;
        }
        commandCounts[name] = (commandCounts[name] || 0) + 1;
    }

    const drawCallNames = new Set([
        'drawArrays',
        'drawArraysInstanced',
        'drawElements',
        'drawElementsInstanced'
    ]);
    const textureUploadNames = new Set([
        'texImage2D',
        'texImage3D',
        'texSubImage2D',
        'texSubImage3D',
        'compressedTexImage2D',
        'compressedTexImage3D',
        'compressedTexSubImage2D',
        'compressedTexSubImage3D'
    ]);

    const drawCalls = Object.entries(commandCounts)
        .filter(([name]) => drawCallNames.has(name))
        .reduce((total, [, count]) => total + count, 0);
    const textureUploads = Object.entries(commandCounts)
        .filter(([name]) => textureUploadNames.has(name))
        .reduce((total, [, count]) => total + count, 0);
    const programSwitches = commandCounts.useProgram || 0;
    const framebufferBinds = commandCounts.bindFramebuffer || 0;

    return {
        commandCount: commands.length,
        drawCalls,
        programSwitches,
        framebufferBinds,
        textureUploads,
        primitives: primitiveAnalysis ? {
            total: primitiveAnalysis.total || 0,
            triangles: primitiveAnalysis.triangles || 0,
            triangleStrip: primitiveAnalysis.triangleStrip || 0,
            triangleFan: primitiveAnalysis.triangleFan || 0,
            lines: primitiveAnalysis.lines || 0,
            points: primitiveAnalysis.points || 0
        } : null,
        topCommands: Object.entries(commandCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20),
        captureCanvas: capture.canvas || capture.captureCanvas || null,
        startTime: capture.startTime || null,
        endTime: capture.endTime || null
    };
}

async function captureSpectorFrame(cdp, timeoutMs) {
    const captureTimeoutMs = Math.max(10000, timeoutMs);
    const startExpression = `(() => {
        const spectorUrl = ${JSON.stringify(SPECTOR_CDN_URL)};
        const timeoutMs = ${JSON.stringify(captureTimeoutMs)};
        window.__VRODOS_PROFILE_SPECTOR_CAPTURE = {
            status: 'loading',
            loadedFrom: spectorUrl,
            canvas: null,
            summary: null,
            captureStringLength: 0,
            error: null
        };

        function loadSpector() {
            if (window.SPECTOR && window.SPECTOR.Spector) {
                return Promise.resolve();
            }

            return new Promise((resolve, reject) => {
                const existing = document.querySelector('script[data-vrodos-spector-profiler="true"]');
                if (existing) {
                    existing.addEventListener('load', () => resolve(), { once: true });
                    existing.addEventListener('error', () => reject(new Error('Spector.js script failed to load.')), { once: true });
                    return;
                }

                const script = document.createElement('script');
                script.src = spectorUrl;
                script.async = true;
                script.crossOrigin = 'anonymous';
                script.dataset.vrodosSpectorProfiler = 'true';
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Spector.js script failed to load.'));
                (document.head || document.documentElement).appendChild(script);
            });
        }

        function nextFrame() {
            return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        }

        function getCanvas() {
            return document.querySelector('a-scene canvas') || document.querySelector('canvas');
        }

        function summarizeCapture(capture) {
            const commands = Array.isArray(capture && capture.commands) ? capture.commands : [];
            const primitiveAnalysis = Array.isArray(capture && capture.analyses)
                ? capture.analyses.find((analysis) => analysis && analysis.analyserName === 'Primitives')
                : null;
            const counts = {};
            commands.forEach((command) => {
                const name = command && (command.name || command.commandName || command.functionName || command.method);
                if (name) {
                    counts[name] = (counts[name] || 0) + 1;
                }
            });
            const countWhere = (names) => names.reduce((total, name) => total + (counts[name] || 0), 0);
            return {
                commandCount: commands.length,
                drawCalls: countWhere(['drawArrays', 'drawArraysInstanced', 'drawElements', 'drawElementsInstanced']),
                programSwitches: counts.useProgram || 0,
                framebufferBinds: counts.bindFramebuffer || 0,
                textureUploads: countWhere(['texImage2D', 'texImage3D', 'texSubImage2D', 'texSubImage3D', 'compressedTexImage2D', 'compressedTexImage3D', 'compressedTexSubImage2D', 'compressedTexSubImage3D']),
                primitives: primitiveAnalysis ? {
                    total: primitiveAnalysis.total || 0,
                    triangles: primitiveAnalysis.triangles || 0,
                    triangleStrip: primitiveAnalysis.triangleStrip || 0,
                    triangleFan: primitiveAnalysis.triangleFan || 0,
                    lines: primitiveAnalysis.lines || 0,
                    points: primitiveAnalysis.points || 0
                } : null,
                topCommands: Object.entries(counts)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 20)
            };
        }

        loadSpector().then(() => {
            const canvas = getCanvas();
            if (!canvas) {
                window.__VRODOS_PROFILE_SPECTOR_CAPTURE.status = 'error';
                window.__VRODOS_PROFILE_SPECTOR_CAPTURE.error = 'No A-Frame/WebGL canvas found for Spector capture.';
                return;
            }

            const spector = new window.SPECTOR.Spector();
            window.VRODOS_PROFILE_SPECTOR = spector;
            window.__VRODOS_PROFILE_SPECTOR_CAPTURE.status = 'capturing';
            window.__VRODOS_PROFILE_SPECTOR_CAPTURE.canvas = {
                width: canvas.width,
                height: canvas.height,
                clientWidth: canvas.clientWidth,
                clientHeight: canvas.clientHeight
            };
            let done = false;
            const timer = setTimeout(() => {
                if (done) {
                    return;
                }
                done = true;
                window.__VRODOS_PROFILE_SPECTOR_CAPTURE.status = 'error';
                window.__VRODOS_PROFILE_SPECTOR_CAPTURE.error = 'Timed out waiting for Spector capture.';
            }, timeoutMs);

            spector.onCapture.add((capture) => {
                if (done) {
                    return;
                }
                done = true;
                clearTimeout(timer);
                try {
                    const captureString = JSON.stringify(capture);
                    window.__VRODOS_PROFILE_SPECTOR_CAPTURE.summary = summarizeCapture(capture);
                    window.__VRODOS_PROFILE_SPECTOR_CAPTURE.captureString = captureString;
                    window.__VRODOS_PROFILE_SPECTOR_CAPTURE.captureStringLength = captureString.length;
                    window.__VRODOS_PROFILE_SPECTOR_CAPTURE.status = 'done';
                } catch (error) {
                    window.__VRODOS_PROFILE_SPECTOR_CAPTURE.status = 'error';
                    window.__VRODOS_PROFILE_SPECTOR_CAPTURE.error = error && error.message ? error.message : String(error);
                }
            });

            try {
                spector.captureCanvas(canvas);
                nextFrame();
            } catch (error) {
                clearTimeout(timer);
                done = true;
                window.__VRODOS_PROFILE_SPECTOR_CAPTURE.status = 'error';
                window.__VRODOS_PROFILE_SPECTOR_CAPTURE.error = error && error.message ? error.message : String(error);
            }
        }).catch((error) => {
            window.__VRODOS_PROFILE_SPECTOR_CAPTURE.status = 'error';
            window.__VRODOS_PROFILE_SPECTOR_CAPTURE.error = error && error.message ? error.message : String(error);
        });

        return {
            started: true,
            loadedFrom: spectorUrl
        };
    })()`;

    await evaluate(cdp, startExpression, true, 5000);

    const startedAt = Date.now();
    let state = null;
    while (Date.now() - startedAt < captureTimeoutMs) {
        state = await evaluate(cdp, `(() => {
            const state = window.__VRODOS_PROFILE_SPECTOR_CAPTURE || null;
            if (!state) {
                return null;
            }
            return {
                status: state.status,
                loadedFrom: state.loadedFrom,
                canvas: state.canvas,
                summary: state.summary,
                captureStringLength: state.captureStringLength || 0,
                error: state.error
            };
        })()`, true, 10000);

        if (state && (state.status === 'done' || state.status === 'error')) {
            break;
        }
        await delay(500);
    }

    if (!state || state.status !== 'done') {
        throw new Error(state && state.error ? state.error : 'Timed out waiting for Spector capture.');
    }

    const chunkSize = 512 * 1024;
    let captureString = '';
    for (let offset = 0; offset < state.captureStringLength; offset += chunkSize) {
        const chunk = await evaluate(cdp, `(() => {
            const state = window.__VRODOS_PROFILE_SPECTOR_CAPTURE || {};
            const value = state.captureString || '';
            return value.slice(${JSON.stringify(offset)}, ${JSON.stringify(offset + chunkSize)});
        })()`, true, 10000);
        captureString += chunk || '';
    }

    const parsedCapture = captureString ? JSON.parse(captureString) : null;

    return {
        loadedFrom: state.loadedFrom || SPECTOR_CDN_URL,
        canvas: state.canvas || null,
        summary: state.summary || summarizeSpectorCapture(parsedCapture),
        capture: parsedCapture,
        captureString
    };
}

function formatMs(value) {
    return value === null || value === undefined ? 'n/a' : `${value.toFixed(2)}ms`;
}

function formatBytes(value) {
    if (!Number.isFinite(value) || value <= 0) {
        return '0 B';
    }
    const units = ['B', 'KB', 'MB', 'GB'];
    let unit = 0;
    let size = value;
    while (size >= 1024 && unit < units.length - 1) {
        size /= 1024;
        unit += 1;
    }
    return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function formatNumber(value) {
    return Number.isFinite(value) ? value.toFixed(2) : 'n/a';
}

function printSummary(result) {
    const raf = result.frameSample.summary;
    const scene = result.scene;
    const resources = result.resources.totals;
    console.log(`VRodos profile: ${result.url}`);
    console.log(`Viewport: ${result.viewport.width}x${result.viewport.height} @ dpr ${result.dpr}`);
    console.log(`rAF: p50 ${formatMs(raf.p50Ms)}, p95 ${formatMs(raf.p95Ms)}, mean ${formatMs(raf.meanMs)}, max ${formatMs(raf.maxMs)}, frames ${raf.count}`);
    if (scene && scene.objectCounts) {
        console.log(`Scene: ${scene.objectCounts.visibleMeshes}/${scene.objectCounts.meshes} visible meshes, ${scene.objectCounts.geometries} geometries, ${scene.objectCounts.materials} materials, ${scene.objectCounts.textures} textures`);
        if (scene.renderer && scene.renderer.cssSize) {
            const css = scene.renderer.cssSize;
            const buffer = scene.renderer.drawingBuffer || {};
            const estimatedPixels = scene.renderer.estimatedRenderPixels;
            const estimatedLabel = Number.isFinite(estimatedPixels) ? estimatedPixels.toLocaleString('en-US') : 'n/a';
            const budget = scene.renderer.pixelBudget;
            const budgetLabel = budget && budget.pixelBudget ? `${budget.pixelBudget.toLocaleString('en-US')} px (${budget.source}, applied ${budget.applied ? 'yes' : 'no'})` : 'none';
            const toneMapping = scene.renderer.toneMappingName || scene.renderer.toneMapping || 'n/a';
            const exposure = typeof scene.renderer.toneMappingExposure === 'number' ? scene.renderer.toneMappingExposure : 'n/a';
            console.log(`Renderer: css ${css.width}x${css.height}, pixelRatio ${scene.renderer.pixelRatio}, buffer ${buffer.width || 'n/a'}x${buffer.height || 'n/a'}, estimated ${estimatedLabel} pixels, budget ${budgetLabel}, sortObjects ${scene.renderer.sortObjects}, toneMapping ${toneMapping}, exposure ${exposure}`);
        }
        const shadowType = scene.renderer ? (scene.renderer.shadowMapTypeName || scene.renderer.shadowMapType || 'n/a') : 'n/a';
        console.log(`Shadows: ${scene.objectCounts.shadowCasters} casters, ${scene.objectCounts.shadowReceivers} receivers, renderer shadow map ${scene.renderer ? scene.renderer.shadowMapEnabled : 'n/a'}, type ${shadowType}`);
    }
    console.log(`Resources: ${resources.count} entries, transfer ${formatBytes(resources.transferSize)}, encoded ${formatBytes(resources.encodedBodySize)}, decoded ${formatBytes(resources.decodedBodySize)}`);
    if (result.runtimeOverrides?.resourceOverrides?.enabled) {
        const overrides = result.runtimeOverrides.resourceOverrides;
        console.log(`Resource overrides: ${overrides.fulfilledCount} fulfilled, ${overrides.fulfilledSizeLabel} served from local derivatives`);
    }
    if (result.trace && result.trace.totals) {
        console.log(`Trace: total ${formatMs(result.trace.totals.totalDurationMs)}, GPU ${formatMs(result.trace.totals.gpuDurationMs)}, scripting ${formatMs(result.trace.totals.scriptingDurationMs)}`);
    }
    if (result.navigationProfile && result.navigationProfile.enabled && result.navigationProfile.end) {
        const nav = result.navigationProfile.end;
        const avg = nav.averages || {};
        const totals = nav.totals || {};
        console.log(`Navigation: ${nav.collisionTargets} collision meshes, ${nav.frames} profiled frames, movement delta ${formatNumber(result.navigationProfile.movementDelta?.x)} ${formatNumber(result.navigationProfile.movementDelta?.y)} ${formatNumber(result.navigationProfile.movementDelta?.z)}`);
        console.log(`Navigation timing: tick ${formatMs(avg.tickMs)}, constrained ${formatMs(avg.constrainedMs)}, raycast ${formatMs(avg.raycastMs)}, raycasts/frame ${formatNumber(avg.raycasts)}, intersections/frame ${formatNumber(avg.intersections)}, total raycasts ${totals.raycasts || 0}`);
    } else if (result.navigationProfile && result.navigationProfile.reason) {
        console.log(`Navigation: skipped (${result.navigationProfile.reason})`);
    }
    if (result.spector && result.spector.enabled) {
        const summary = result.spector.summary || {};
        if (result.spector.error) {
            console.log(`Spector: capture failed (${result.spector.error.message || result.spector.error})`);
        } else {
            console.log(`Spector: ${summary.commandCount || 0} commands, ${summary.drawCalls || 0} draw calls, ${summary.programSwitches || 0} program switches, ${summary.framebufferBinds || 0} framebuffer binds`);
        }
        if (summary.primitives && Number.isFinite(summary.primitives.triangles)) {
            console.log(`Spector primitives: ${summary.primitives.triangles.toLocaleString('en-US')} submitted triangles`);
        }
        if (result.spector.output) {
            console.log(`Spector capture written to ${result.spector.output}`);
        }
    }
    console.log(`Console warnings/errors: ${result.console.length}; network failures: ${result.networkFailures.length}; exceptions: ${result.exceptions.length}`);
}

async function run() {
    const options = parseArgs(process.argv.slice(2));
    let targetUrl = options.url;
    if (options.navProfile) {
        targetUrl = addUrlQueryParam(targetUrl, 'vrodos_debug_nav_perf', '1');
    }
    if (options.disableFpsMeter) {
        targetUrl = addUrlQueryParam(targetUrl, 'vrodos_debug_disable_fps_meter', '1');
    }
    const resourceOverrides = await prepareResourceOverrides(options.resourceOverrides);
    const WebSocketClass = await loadWebSocketClass();
    const port = await getFreePort();
    const userDataDir = options.userDataDir || path.join(os.tmpdir(), `vrodos-profile-${Date.now()}-${process.pid}`);
    const autoProfileDir = !options.userDataDir;
    await mkdir(userDataDir, { recursive: true });

    const chromePath = findChrome(options.chrome);
    const chromeArgs = [
        `--remote-debugging-port=${port}`,
        '--remote-allow-origins=*',
        `--user-data-dir=${userDataDir}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-popup-blocking',
        '--autoplay-policy=no-user-gesture-required',
        '--ignore-certificate-errors',
        `--window-size=${options.viewport.width},${options.viewport.height}`,
        `--force-device-scale-factor=${options.dpr}`,
        'about:blank'
    ];

    if (options.headless) {
        chromeArgs.unshift('--headless=new');
    }

    const chrome = spawn(chromePath, chromeArgs, {
        stdio: ['ignore', 'ignore', 'pipe']
    });

    const chromeErrors = [];
    chrome.stderr.on('data', (data) => {
        chromeErrors.push(String(data));
        if (chromeErrors.length > 30) {
            chromeErrors.shift();
        }
    });

    let cdp = null;
    try {
        await waitForChrome(port, options.timeoutMs);
        const target = await createTarget(port);
        cdp = new CDPClient(target.webSocketDebuggerUrl, WebSocketClass, options.timeoutMs);
        await cdp.connect(options.timeoutMs);

        const consoleMessages = [];
        const networkFailures = [];
        const exceptions = [];
        const resourceOverrideEvents = [];

        cdp.on('Runtime.consoleAPICalled', (params) => {
            if (!['warning', 'error', 'assert'].includes(params.type)) {
                return;
            }
            consoleMessages.push({
                type: params.type,
                text: (params.args || []).map((arg) => arg.value || arg.description || '').join(' '),
                url: params.stackTrace?.callFrames?.[0]?.url || ''
            });
        });
        cdp.on('Runtime.exceptionThrown', (params) => {
            exceptions.push({
                text: params.exceptionDetails?.text || '',
                description: params.exceptionDetails?.exception?.description || '',
                url: params.exceptionDetails?.url || '',
                lineNumber: params.exceptionDetails?.lineNumber || 0,
                columnNumber: params.exceptionDetails?.columnNumber || 0
            });
        });
        cdp.on('Network.loadingFailed', (params) => {
            networkFailures.push({
                requestId: params.requestId,
                errorText: params.errorText,
                canceled: params.canceled,
                type: params.type
            });
        });

        await cdp.send('Page.enable');
        await cdp.send('Runtime.enable');
        await cdp.send('Network.enable');
        await enableResourceOverrides(cdp, resourceOverrides, resourceOverrideEvents);
        await cdp.send('Performance.enable');
        await cdp.send('Log.enable');
        await cdp.send('Page.bringToFront');
        await cdp.send('Emulation.setDeviceMetricsOverride', {
            width: options.viewport.width,
            height: options.viewport.height,
            deviceScaleFactor: options.dpr,
            mobile: false
        });

        const loadPromise = cdp.waitForEvent('Page.loadEventFired', options.timeoutMs);
        await cdp.send('Page.navigate', { url: targetUrl });
        await loadPromise;

        await waitForRuntime(cdp, `Boolean(document.querySelector('a-scene'))`, options.timeoutMs);
        await waitForRuntime(cdp, `(() => {
            const scene = document.querySelector('a-scene');
            return Boolean(scene && scene.renderer && scene.object3D);
        })()`, options.timeoutMs);

        if (options.disableFpsMeter) {
            try {
                await waitForRuntime(cdp, `(() => {
                    const scene = document.querySelector('a-scene');
                    return Boolean(scene && scene.components && scene.components['scene-settings']);
                })()`, Math.min(options.timeoutMs, 15000));
            } catch (error) {
                // The override result below will report the missing component.
            }
        }

        const runtimeOverrides = {
            fpsMeter: options.disableFpsMeter ? await disableRuntimeFpsMeter(cdp) : { disabled: false }
        };

        if (options.warmupMs > 0) {
            await delay(options.warmupMs);
        }

        const beforeMetrics = metricsToObject((await cdp.send('Performance.getMetrics')).metrics);
        const sceneBefore = await captureSceneSnapshot(cdp);
        const tracePromise = collectTrace(cdp, options.traceMs, options.timeoutMs);
        const frameSample = await sampleFrames(cdp, options.frames);
        const trace = await tracePromise;
        const navigationProfile = options.navProfile
            ? await captureNavigationProfile(cdp, options.navProfileMs, options.navProfileInput, options.navProfilePitchDeg)
            : null;
        const afterMetrics = metricsToObject((await cdp.send('Performance.getMetrics')).metrics);
        const scene = await captureSceneSnapshot(cdp);
        const resources = await captureResources(cdp);
        runtimeOverrides.resourceOverrides = summarizeResourceOverrides(resourceOverrides, resourceOverrideEvents);
        let spector = {
            enabled: false
        };

        if (options.spector) {
            const spectorOutputPath = resolveSpectorOutputPath(options);
            try {
                const spectorCapture = await captureSpectorFrame(cdp, options.timeoutMs);
                await mkdir(path.dirname(path.resolve(spectorOutputPath)), { recursive: true });
                await writeFile(spectorOutputPath, `${spectorCapture.captureString || JSON.stringify(spectorCapture.capture, null, 2)}\n`, 'utf8');
                spector = {
                    enabled: true,
                    loadedFrom: spectorCapture.loadedFrom,
                    output: path.resolve(spectorOutputPath),
                    canvas: spectorCapture.canvas,
                    summary: spectorCapture.summary
                };
            } catch (error) {
                spector = {
                    enabled: true,
                    output: '',
                    error: {
                        message: error && error.message ? error.message : String(error),
                        stack: error && error.stack ? error.stack : ''
                    }
                };
            }
        }

        const result = {
            capturedAt: new Date().toISOString(),
            url: targetUrl,
            requestedUrl: options.url,
            chrome: {
                executable: chromePath,
                headless: options.headless,
                errors: chromeErrors
            },
            viewport: options.viewport,
            dpr: options.dpr,
            warmupMs: options.warmupMs,
            requestedFrames: options.frames,
            traceMs: options.traceMs,
            runtimeOverrides,
            sceneBefore,
            scene,
            frameSample: {
                summary: summarizeFrameDeltas(frameSample.deltas || []),
                deltas: frameSample.deltas || [],
                rendererInfo: frameSample.rendererInfo || null
            },
            trace,
            navigationProfile,
            resources,
            spector,
            performanceMetrics: {
                before: beforeMetrics,
                after: afterMetrics,
                delta: Object.fromEntries(
                    Object.keys(afterMetrics).map((key) => [key, afterMetrics[key] - (beforeMetrics[key] || 0)])
                )
            },
            console: consoleMessages,
            networkFailures,
            exceptions
        };

        if (options.output) {
            await mkdir(path.dirname(path.resolve(options.output)), { recursive: true });
            await writeFile(options.output, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
        }

        if (options.json || !options.output) {
            console.log(JSON.stringify(result, null, 2));
        } else {
            printSummary(result);
            console.log(`Full capture written to ${path.resolve(options.output)}`);
        }
    } finally {
        if (cdp) {
            try {
                await cdp.send('Browser.close');
            } catch (error) {
                cdp.close();
                chrome.kill();
            }
        } else {
            chrome.kill();
        }

        const exited = await waitForChildExit(chrome, 5000);
        if (!exited) {
            chrome.kill();
            await waitForChildExit(chrome, 3000);
        }

        if (autoProfileDir && !options.keepProfile && userDataDir.startsWith(os.tmpdir())) {
            await removeTemporaryProfile(userDataDir);
        }
    }
}

run().catch((error) => {
    console.error(error.stack || error.message || String(error));
    process.exit(1);
});
