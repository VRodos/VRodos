#!/usr/bin/env node

import { spawn } from "node:child_process";
import http from "node:http";
import { readFile, readdir, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultPublicRoot = path.resolve(pluginRoot, "../../..");

const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".wasm": "application/wasm",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".glb": "model/gltf-binary",
    ".gltf": "model/gltf+json",
    ".bin": "application/octet-stream",
    ".hdr": "application/octet-stream",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf"
};

function printUsage() {
    console.log(`Usage:
  node scripts/run-browser-feature-state-smoke.mjs [options]

Starts a temporary local static server for the WordPress public root, profiles a compiled Master client,
then validates the profile JSON with scripts/check-profile-feature-state.mjs.

Options:
  --client NAME                    Runtime build HTML filename. Defaults to newest Master_Client_*.html.
  --public-root PATH               WordPress public root. Default: ${defaultPublicRoot}
  --host HOST                      Static server host. Default: 127.0.0.1.
  --port N                         Static server port. Default: 5833.
  --output PATH                    Profile JSON output. Default: OS temp directory.
  --frames N                       rAF frames to sample. Default: 120.
  --warmup-ms N                    Warmup before sampling. Default: 3000.
  --trace-ms N                     Trace duration. Default: 0.
  --timeout-ms N                   Profile timeout. Default: 45000.
  --expect-presentation MODE       Validator expectation. Default: inline.
  --expect-profile PROFILE         Validator expectation.
  --expect-postfx-owner OWNER      Validator expectation.
  --expect-postfx-requested BOOL   Validator expectation.
  --expect-postfx-allowed BOOL     Validator expectation.
  --expect-navigation-mode MODE    Validator expectation.
  --expect-spatial-ui STATE        Validator expectation: any, loaded, not-loaded, active, inactive.
  --expect-vr-budget STATE         Validator expectation: any, present, absent.
  --expect-collision-active BOOL   Validator expectation.
  --min-navmesh-targets N          Validator expectation.
  --max-console-errors N           Validator threshold.
  --max-network-failures N         Validator threshold.
  --max-exceptions N               Validator threshold. Default: 0.
  --help                           Show this help.`);
}

function parseArgs(argv) {
    const options = {
        client: "",
        publicRoot: defaultPublicRoot,
        host: "127.0.0.1",
        port: 5833,
        output: "",
        frames: 120,
        warmupMs: 3000,
        traceMs: 0,
        timeoutMs: 45000,
        validator: {
            expectPresentation: "inline",
            expectProfile: "",
            expectPostFxOwner: "",
            expectPostFxRequested: "",
            expectPostFxAllowed: "",
            expectNavigationMode: "",
            expectSpatialUi: "",
            expectVrBudget: "",
            expectCollisionActive: "",
            minNavMeshTargets: "",
            maxConsoleErrors: "",
            maxNetworkFailures: "",
            maxExceptions: "0"
        }
    };

    const next = (index, flag) => {
        const value = argv[index + 1];
        if (!value || value.startsWith("--")) {
            throw new Error(`Missing value for ${flag}.`);
        }
        return value;
    };

    const nextNumber = (index, flag) => {
        const value = Number(next(index, flag));
        if (!Number.isFinite(value) || value < 0) {
            throw new Error(`Expected ${flag} to be a non-negative number.`);
        }
        return value;
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        switch (arg) {
            case "--client":
                options.client = next(index, arg);
                index += 1;
                break;
            case "--public-root":
                options.publicRoot = path.resolve(next(index, arg));
                index += 1;
                break;
            case "--host":
                options.host = next(index, arg);
                index += 1;
                break;
            case "--port":
                options.port = nextNumber(index, arg);
                index += 1;
                break;
            case "--output":
                options.output = path.resolve(next(index, arg));
                index += 1;
                break;
            case "--frames":
                options.frames = nextNumber(index, arg);
                index += 1;
                break;
            case "--warmup-ms":
                options.warmupMs = nextNumber(index, arg);
                index += 1;
                break;
            case "--trace-ms":
                options.traceMs = nextNumber(index, arg);
                index += 1;
                break;
            case "--timeout-ms":
                options.timeoutMs = nextNumber(index, arg);
                index += 1;
                break;
            case "--expect-presentation":
                options.validator.expectPresentation = next(index, arg);
                index += 1;
                break;
            case "--expect-profile":
                options.validator.expectProfile = next(index, arg);
                index += 1;
                break;
            case "--expect-postfx-owner":
                options.validator.expectPostFxOwner = next(index, arg);
                index += 1;
                break;
            case "--expect-postfx-requested":
                options.validator.expectPostFxRequested = next(index, arg);
                index += 1;
                break;
            case "--expect-postfx-allowed":
                options.validator.expectPostFxAllowed = next(index, arg);
                index += 1;
                break;
            case "--expect-navigation-mode":
                options.validator.expectNavigationMode = next(index, arg);
                index += 1;
                break;
            case "--expect-spatial-ui":
                options.validator.expectSpatialUi = next(index, arg);
                index += 1;
                break;
            case "--expect-vr-budget":
                options.validator.expectVrBudget = next(index, arg);
                index += 1;
                break;
            case "--expect-collision-active":
                options.validator.expectCollisionActive = next(index, arg);
                index += 1;
                break;
            case "--min-navmesh-targets":
                options.validator.minNavMeshTargets = String(nextNumber(index, arg));
                index += 1;
                break;
            case "--max-console-errors":
                options.validator.maxConsoleErrors = String(nextNumber(index, arg));
                index += 1;
                break;
            case "--max-network-failures":
                options.validator.maxNetworkFailures = String(nextNumber(index, arg));
                index += 1;
                break;
            case "--max-exceptions":
                options.validator.maxExceptions = String(nextNumber(index, arg));
                index += 1;
                break;
            case "--help":
            case "-h":
                printUsage();
                process.exit(0);
                break;
            default:
                throw new Error(`Unknown option: ${arg}`);
        }
    }

    return options;
}

async function latestMasterClient() {
    const buildDir = path.join(pluginRoot, "runtime", "build");
    const entries = await readdir(buildDir);
    const candidates = [];
    for (const entry of entries) {
        if (!/^Master_Client_.+\.html$/i.test(entry)) {
            continue;
        }
        const info = await stat(path.join(buildDir, entry));
        candidates.push({ entry, mtimeMs: info.mtimeMs });
    }

    if (candidates.length === 0) {
        throw new Error("No Master_Client_*.html files found under runtime/build.");
    }

    candidates.sort((left, right) => right.mtimeMs - left.mtimeMs);
    return candidates[0].entry;
}

function send(res, status, body, headers = {}) {
    res.writeHead(status, headers);
    res.end(body);
}

function createStaticServer(publicRoot, defaultPath) {
    const root = path.resolve(publicRoot);
    return http.createServer(async (req, res) => {
        try {
            const url = new URL(req.url || "/", "http://127.0.0.1");
            let pathname = decodeURIComponent(url.pathname);
            if (pathname === "/") {
                pathname = defaultPath;
            }

            const file = path.resolve(root, `.${pathname}`);
            if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
                send(res, 403, "forbidden");
                return;
            }

            const data = await readFile(file);
            send(res, 200, data, {
                "content-type": mimeTypes[path.extname(file).toLowerCase()] || "application/octet-stream",
                "cache-control": "no-store"
            });
        } catch (_error) {
            send(res, 404, "not found");
        }
    });
}

function listen(server, host, port) {
    return new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, host, () => {
            server.off("error", reject);
            resolve();
        });
    });
}

function closeServer(server) {
    return new Promise((resolve) => {
        server.close(() => resolve());
    });
}

function runCommand(command, args, label) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd: pluginRoot,
            stdio: "inherit",
            shell: false
        });

        child.on("error", reject);
        child.on("exit", (code, signal) => {
            if (code === 0) {
                resolve();
                return;
            }
            reject(new Error(`${label} failed with ${signal ? `signal ${signal}` : `exit code ${code}`}.`));
        });
    });
}

function validatorArgs(options) {
    const args = ["scripts/check-profile-feature-state.mjs", "--input", options.output];
    const validators = options.validator;
    const map = [
        ["expectPresentation", "--expect-presentation"],
        ["expectProfile", "--expect-profile"],
        ["expectPostFxOwner", "--expect-postfx-owner"],
        ["expectPostFxRequested", "--expect-postfx-requested"],
        ["expectPostFxAllowed", "--expect-postfx-allowed"],
        ["expectNavigationMode", "--expect-navigation-mode"],
        ["expectSpatialUi", "--expect-spatial-ui"],
        ["expectVrBudget", "--expect-vr-budget"],
        ["expectCollisionActive", "--expect-collision-active"],
        ["minNavMeshTargets", "--min-navmesh-targets"],
        ["maxConsoleErrors", "--max-console-errors"],
        ["maxNetworkFailures", "--max-network-failures"],
        ["maxExceptions", "--max-exceptions"]
    ];

    for (const [key, flag] of map) {
        if (validators[key] !== "") {
            args.push(flag, String(validators[key]));
        }
    }

    return args;
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    const client = options.client || await latestMasterClient();
    const clientPath = `/wp-content/plugins/VRodos/runtime/build/${client}`;
    const url = `http://${options.host}:${options.port}${clientPath}`;
    options.output = options.output || path.join(os.tmpdir(), `vrodos-browser-feature-state-${client.replace(/[^A-Za-z0-9_-]/g, "-")}-${Date.now()}.json`);

    const server = createStaticServer(options.publicRoot, clientPath);
    await listen(server, options.host, options.port);
    console.log(`Serving ${options.publicRoot} at http://${options.host}:${options.port}/`);

    try {
        await runCommand(process.execPath, [
            "scripts/profile-master-client.mjs",
            url,
            "--disable-fps-meter",
            "--frames", String(options.frames),
            "--warmup-ms", String(options.warmupMs),
            "--trace-ms", String(options.traceMs),
            "--timeout-ms", String(options.timeoutMs),
            "--output", options.output
        ], "profile-master-client");

        await runCommand(process.execPath, validatorArgs(options), "check-profile-feature-state");
        console.log(`Browser feature-state smoke capture written to ${options.output}`);
    } finally {
        await closeServer(server);
    }
}

main().catch((error) => {
    console.error(error && error.message ? error.message : String(error));
    process.exit(1);
});
