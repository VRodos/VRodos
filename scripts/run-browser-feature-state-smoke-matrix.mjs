#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultCases = [
    "desktop-pmndrs-walkable",
    "desktop-no-postfx-walkable",
    "desktop-spatial-ui",
    "headset-walkable-spatial"
];

const caseDefinitions = {
    "desktop-pmndrs-walkable": {
        description: "desktop PMNDRS/Takram walkable scene without spatial UI",
        match: (client) => client.profile === "desktop" &&
            client.postFXEnabled === "1" &&
            client.postFXEngine === "pmndrs" &&
            client.pmndrsAtmosphereEnabled === "true" &&
            client.navigationMode === "walkable" &&
            !client.spatialUi,
        expectations: {
            profile: "desktop",
            postFxOwner: "pmndrs",
            postFxRequested: "true",
            postFxAllowed: "true",
            navigationMode: "walkable",
            spatialUi: "not-loaded",
            vrBudget: "present",
            collisionActive: "true",
            minNavMeshTargets: "1"
        }
    },
    "desktop-no-postfx-walkable": {
        description: "desktop no-postFX walkable scene without spatial UI",
        match: (client) => client.profile === "desktop" &&
            client.postFXEnabled === "0" &&
            client.navigationMode === "walkable" &&
            !client.spatialUi,
        expectations: {
            profile: "desktop",
            postFxOwner: "direct",
            postFxRequested: "false",
            postFxAllowed: "false",
            navigationMode: "walkable",
            spatialUi: "not-loaded",
            vrBudget: "present",
            collisionActive: "true",
            minNavMeshTargets: "1"
        }
    },
    "desktop-spatial-ui": {
        description: "desktop scene that requests the spatial UI bundle",
        match: (client) => client.profile === "desktop" &&
            client.spatialUi &&
            client.navigationMode === "walkable",
        expectations: {
            profile: "desktop",
            navigationMode: "walkable",
            spatialUi: "loaded",
            vrBudget: "present",
            collisionActive: "true",
            minNavMeshTargets: "1"
        }
    },
    "headset-walkable-spatial": {
        description: "headset-profile walkable scene that requests spatial UI",
        match: (client) => client.profile === "headset" &&
            client.spatialUi &&
            client.navigationMode === "walkable",
        expectations: {
            profile: "headset",
            postFxOwner: "direct",
            postFxRequested: "false",
            postFxAllowed: "false",
            navigationMode: "walkable",
            spatialUi: "loaded",
            vrBudget: "present",
            collisionActive: "true",
            minNavMeshTargets: "1"
        }
    },
    "headset-fly-spatial": {
        description: "headset-profile fly/no-collision scene that requests spatial UI",
        match: (client) => client.profile === "headset" &&
            client.spatialUi &&
            client.navigationMode === "fly",
        expectations: {
            profile: "headset",
            postFxOwner: "direct",
            postFxRequested: "false",
            postFxAllowed: "false",
            navigationMode: "fly",
            spatialUi: "loaded",
            vrBudget: "present",
            collisionActive: "false"
        }
    }
};

function printUsage() {
    console.log(`Usage:
  node scripts/run-browser-feature-state-smoke-matrix.mjs [options]

Auto-discovers generated Master clients in runtime/build and runs browser feature-state smoke checks
for a small representative matrix.

Options:
  --cases LIST        Comma-separated case ids. Default: ${defaultCases.join(",")}
  --list-cases        Print available case ids.
  --frames N          rAF frames passed to each smoke. Default: 60.
  --warmup-ms N       Warmup passed to each smoke. Default: 3000.
  --trace-ms N        Trace duration passed to each smoke. Default: 0.
  --timeout-ms N      Timeout passed to each smoke. Default: 45000.
  --port N            Static server port. Default: 5833.
  --help              Show this help.`);
}

function parseArgs(argv) {
    const options = {
        cases: defaultCases,
        listCases: false,
        frames: 60,
        warmupMs: 3000,
        traceMs: 0,
        timeoutMs: 45000,
        port: 5833
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
            case "--cases":
                options.cases = next(index, arg).split(",").map((entry) => entry.trim()).filter(Boolean);
                index += 1;
                break;
            case "--list-cases":
                options.listCases = true;
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
            case "--port":
                options.port = nextNumber(index, arg);
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

    for (const caseId of options.cases) {
        if (!caseDefinitions[caseId]) {
            throw new Error(`Unknown matrix case: ${caseId}. Use --list-cases.`);
        }
    }

    return options;
}

function sceneSetting(settings, key) {
    const match = settings.match(new RegExp(`${key}:\\s*([^;]+)`));
    return match ? match[1].trim() : "";
}

async function discoverClients() {
    const buildDir = path.join(pluginRoot, "runtime", "build");
    const entries = await readdir(buildDir);
    const clients = [];

    for (const entry of entries) {
        if (!/^Master_Client_.+\.html$/i.test(entry)) {
            continue;
        }

        const file = path.join(buildDir, entry);
        const [html, info] = await Promise.all([
            readFile(file, "utf8"),
            stat(file)
        ]);
        const settingsMatch = html.match(/scene-settings="([^"]*)"/);
        const settings = settingsMatch ? settingsMatch[1] : "";
        clients.push({
            file: entry,
            mtimeMs: info.mtimeMs,
            profile: sceneSetting(settings, "vrRuntimeProfile") || "desktop",
            postFXEnabled: sceneSetting(settings, "postFXEnabled"),
            postFXEngine: sceneSetting(settings, "postFXEngine"),
            pmndrsAtmosphereEnabled: sceneSetting(settings, "pmndrsAtmosphereEnabled"),
            navigationMode: sceneSetting(settings, "navigationMode"),
            collisionMode: sceneSetting(settings, "collisionMode"),
            spatialUi: html.includes("vrodos-runtime-spatial-ui.bundle.js")
        });
    }

    clients.sort((left, right) => right.mtimeMs - left.mtimeMs);
    return clients;
}

function selectClient(clients, definition) {
    return clients.find((client) => definition.match(client));
}

function expectationArgs(expectations) {
    const args = [
        "--expect-presentation", "inline",
        "--max-console-errors", "0",
        "--max-network-failures", "0",
        "--max-exceptions", "0"
    ];
    const map = [
        ["profile", "--expect-profile"],
        ["postFxOwner", "--expect-postfx-owner"],
        ["postFxRequested", "--expect-postfx-requested"],
        ["postFxAllowed", "--expect-postfx-allowed"],
        ["navigationMode", "--expect-navigation-mode"],
        ["spatialUi", "--expect-spatial-ui"],
        ["vrBudget", "--expect-vr-budget"],
        ["collisionActive", "--expect-collision-active"],
        ["minNavMeshTargets", "--min-navmesh-targets"]
    ];

    for (const [key, flag] of map) {
        if (expectations[key] !== undefined && expectations[key] !== "") {
            args.push(flag, String(expectations[key]));
        }
    }

    return args;
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

async function main() {
    const options = parseArgs(process.argv.slice(2));

    if (options.listCases) {
        Object.entries(caseDefinitions).forEach(([caseId, definition]) => {
            console.log(`${caseId}\t${definition.description}`);
        });
        return;
    }

    const clients = await discoverClients();
    const selected = options.cases.map((caseId) => {
        const definition = caseDefinitions[caseId];
        const client = selectClient(clients, definition);
        if (!client) {
            throw new Error(`No generated Master client matched matrix case ${caseId}: ${definition.description}`);
        }
        return { caseId, definition, client };
    });

    for (const entry of selected) {
        console.log(`\n[${entry.caseId}] ${entry.definition.description}: ${entry.client.file}`);
        await runCommand(process.execPath, [
            "scripts/run-browser-feature-state-smoke.mjs",
            "--client", entry.client.file,
            "--frames", String(options.frames),
            "--warmup-ms", String(options.warmupMs),
            "--trace-ms", String(options.traceMs),
            "--timeout-ms", String(options.timeoutMs),
            "--port", String(options.port),
            ...expectationArgs(entry.definition.expectations)
        ], entry.caseId);
    }

    console.log(`Browser feature-state smoke matrix passed ${selected.length} case(s).`);
}

main().catch((error) => {
    console.error(error && error.message ? error.message : String(error));
    process.exit(1);
});
