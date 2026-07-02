#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import process from "node:process";

function printUsage() {
    console.log(`Usage:
  node scripts/check-profile-feature-state.mjs --input PATH [options]

Validates the runtimeFeatureState snapshot written by scripts/profile-master-client.mjs.

Options:
  --input PATH                         Profile JSON path. A bare positional path is also accepted.
  --expect-presentation MODE           Expected presentation.mode, such as inline or immersive-xr.
  --expect-profile PROFILE             Expected vrProfile.profile, such as desktop, headset, or pc-rendered-vr.
  --expect-postfx-owner OWNER          Expected postProcessing.owner, such as direct, pmndrs, or legacy.
  --expect-postfx-requested BOOL       Expected postProcessing.requested.
  --expect-postfx-allowed BOOL         Expected postProcessing.allowed.
  --expect-navigation-mode MODE        Expected navigation.navigationMode.
  --expect-spatial-ui STATE            one of any, loaded, not-loaded, active, inactive.
  --expect-vr-budget STATE             one of any, present, absent.
  --expect-collision-active BOOL       Expected navigation.collisionActive.
  --min-navmesh-targets N              Minimum navigation.navMeshTargets.
  --max-console-errors N               Maximum console error/assert entries. Default: unchecked.
  --max-network-failures N             Maximum network failure entries. Default: unchecked.
  --max-exceptions N                   Maximum uncaught exception entries. Default: unchecked.
  --help                               Show this help.`);
}

function parseArgs(argv) {
    const options = {
        input: "",
        expectPresentation: "",
        expectProfile: "",
        expectPostFxOwner: "",
        expectPostFxRequested: null,
        expectPostFxAllowed: null,
        expectNavigationMode: "",
        expectSpatialUi: "any",
        expectVrBudget: "any",
        expectCollisionActive: null,
        minNavMeshTargets: null,
        maxConsoleErrors: null,
        maxNetworkFailures: null,
        maxExceptions: null
    };

    const takeValue = (args, index, flag) => {
        const value = args[index + 1];
        if (!value || value.startsWith("--")) {
            throw new Error(`Missing value for ${flag}.`);
        }
        return value;
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        switch (arg) {
            case "--input":
                options.input = takeValue(argv, index, arg);
                index += 1;
                break;
            case "--expect-presentation":
                options.expectPresentation = takeValue(argv, index, arg);
                index += 1;
                break;
            case "--expect-profile":
                options.expectProfile = takeValue(argv, index, arg);
                index += 1;
                break;
            case "--expect-postfx-owner":
                options.expectPostFxOwner = takeValue(argv, index, arg);
                index += 1;
                break;
            case "--expect-postfx-requested":
                options.expectPostFxRequested = parseBoolean(takeValue(argv, index, arg), arg);
                index += 1;
                break;
            case "--expect-postfx-allowed":
                options.expectPostFxAllowed = parseBoolean(takeValue(argv, index, arg), arg);
                index += 1;
                break;
            case "--expect-navigation-mode":
                options.expectNavigationMode = takeValue(argv, index, arg);
                index += 1;
                break;
            case "--expect-spatial-ui":
                options.expectSpatialUi = takeValue(argv, index, arg);
                index += 1;
                break;
            case "--expect-vr-budget":
                options.expectVrBudget = takeValue(argv, index, arg);
                index += 1;
                break;
            case "--expect-collision-active":
                options.expectCollisionActive = parseBoolean(takeValue(argv, index, arg), arg);
                index += 1;
                break;
            case "--min-navmesh-targets":
                options.minNavMeshTargets = parseInteger(takeValue(argv, index, arg), arg);
                index += 1;
                break;
            case "--max-console-errors":
                options.maxConsoleErrors = parseInteger(takeValue(argv, index, arg), arg);
                index += 1;
                break;
            case "--max-network-failures":
                options.maxNetworkFailures = parseInteger(takeValue(argv, index, arg), arg);
                index += 1;
                break;
            case "--max-exceptions":
                options.maxExceptions = parseInteger(takeValue(argv, index, arg), arg);
                index += 1;
                break;
            case "--help":
            case "-h":
                printUsage();
                process.exit(0);
                break;
            default:
                if (!arg.startsWith("--") && !options.input) {
                    options.input = arg;
                    break;
                }
                throw new Error(`Unknown option: ${arg}`);
        }
    }

    if (!options.input) {
        throw new Error("Expected --input PATH.");
    }

    validateEnum(options.expectSpatialUi, ["any", "loaded", "not-loaded", "active", "inactive"], "--expect-spatial-ui");
    validateEnum(options.expectVrBudget, ["any", "present", "absent"], "--expect-vr-budget");

    return options;
}

function parseBoolean(value, flag) {
    const normalized = String(value).toLowerCase();
    if (["1", "true", "yes"].includes(normalized)) {
        return true;
    }
    if (["0", "false", "no"].includes(normalized)) {
        return false;
    }
    throw new Error(`Expected ${flag} to be true or false.`);
}

function parseInteger(value, flag) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error(`Expected ${flag} to be a non-negative integer.`);
    }
    return parsed;
}

function validateEnum(value, allowed, flag) {
    if (!allowed.includes(value)) {
        throw new Error(`Expected ${flag} to be one of: ${allowed.join(", ")}.`);
    }
}

function assert(condition, message, failures) {
    if (!condition) {
        failures.push(message);
    }
}

function getRuntimeFeatureState(capture) {
    if (!capture || typeof capture !== "object") {
        return null;
    }
    if (capture.scene && capture.scene.runtimeFeatureState) {
        return capture.scene.runtimeFeatureState;
    }
    if (capture.runtimeFeatureState) {
        return capture.runtimeFeatureState;
    }
    if (capture.presentation && capture.vrProfile && capture.postProcessing) {
        return capture;
    }
    return null;
}

function hasObject(value) {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function boolValue(value) {
    return typeof value === "boolean" ? value : null;
}

function checkExpectedValue(actual, expected, label, failures) {
    if (expected === "" || expected === null) {
        return;
    }
    assert(actual === expected, `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.`, failures);
}

function checkBooleanValue(actual, expected, label, failures) {
    if (expected === null) {
        return;
    }
    assert(actual === expected, `${label}: expected ${String(expected)}, got ${String(actual)}.`, failures);
}

function countConsoleErrors(capture) {
    if (!Array.isArray(capture.console)) {
        return 0;
    }
    return capture.console.filter((entry) => entry && (entry.type === "error" || entry.type === "assert")).length;
}

function validateCapture(capture, options) {
    const failures = [];
    const state = getRuntimeFeatureState(capture);

    assert(hasObject(state), "Missing scene.runtimeFeatureState in profile capture.", failures);
    if (!hasObject(state)) {
        return { failures, state: null };
    }

    assert(hasObject(state.presentation), "runtimeFeatureState.presentation is missing.", failures);
    assert(hasObject(state.vrProfile), "runtimeFeatureState.vrProfile is missing.", failures);
    assert(hasObject(state.postProcessing), "runtimeFeatureState.postProcessing is missing.", failures);
    assert(hasObject(state.renderer), "runtimeFeatureState.renderer is missing.", failures);
    assert(hasObject(state.shadows), "runtimeFeatureState.shadows is missing.", failures);
    assert(hasObject(state.navigation), "runtimeFeatureState.navigation is missing.", failures);
    assert(hasObject(state.spatialUi), "runtimeFeatureState.spatialUi is missing.", failures);

    if (hasObject(state.presentation)) {
        assert(typeof state.presentation.mode === "string" && state.presentation.mode.length > 0, "presentation.mode should be a non-empty string.", failures);
        checkExpectedValue(state.presentation.mode, options.expectPresentation, "presentation.mode", failures);
    }

    if (hasObject(state.vrProfile)) {
        assert(typeof state.vrProfile.profile === "string" && state.vrProfile.profile.length > 0, "vrProfile.profile should be a non-empty string.", failures);
        checkExpectedValue(state.vrProfile.profile, options.expectProfile, "vrProfile.profile", failures);
    }

    if (hasObject(state.postProcessing)) {
        assert(typeof state.postProcessing.owner === "string" && state.postProcessing.owner.length > 0, "postProcessing.owner should be a non-empty string.", failures);
        assert(boolValue(state.postProcessing.requested) !== null, "postProcessing.requested should be boolean.", failures);
        assert(boolValue(state.postProcessing.allowed) !== null, "postProcessing.allowed should be boolean.", failures);
        checkExpectedValue(state.postProcessing.owner, options.expectPostFxOwner, "postProcessing.owner", failures);
        checkBooleanValue(state.postProcessing.requested, options.expectPostFxRequested, "postProcessing.requested", failures);
        checkBooleanValue(state.postProcessing.allowed, options.expectPostFxAllowed, "postProcessing.allowed", failures);
    }

    if (hasObject(state.renderer)) {
        assert(typeof state.renderer.renderQuality === "string" && state.renderer.renderQuality.length > 0, "renderer.renderQuality should be a non-empty string.", failures);
        const hasBudget = hasObject(state.renderer.vrRenderBudget);
        if (options.expectVrBudget === "present") {
            assert(hasBudget, "renderer.vrRenderBudget should be present.", failures);
        } else if (options.expectVrBudget === "absent") {
            assert(!hasBudget, "renderer.vrRenderBudget should be absent.", failures);
        }
    }

    if (hasObject(state.shadows)) {
        assert(typeof state.shadows.effectiveQuality === "string" && state.shadows.effectiveQuality.length > 0, "shadows.effectiveQuality should be a non-empty string.", failures);
    }

    if (hasObject(state.navigation)) {
        assert(typeof state.navigation.navigationMode === "string" && state.navigation.navigationMode.length > 0, "navigation.navigationMode should be a non-empty string.", failures);
        checkExpectedValue(state.navigation.navigationMode, options.expectNavigationMode, "navigation.navigationMode", failures);
        checkBooleanValue(state.navigation.collisionActive, options.expectCollisionActive, "navigation.collisionActive", failures);
        if (options.minNavMeshTargets !== null) {
            assert(
                typeof state.navigation.navMeshTargets === "number" && state.navigation.navMeshTargets >= options.minNavMeshTargets,
                `navigation.navMeshTargets: expected at least ${options.minNavMeshTargets}, got ${JSON.stringify(state.navigation.navMeshTargets)}.`,
                failures
            );
        }
    }

    if (hasObject(state.spatialUi)) {
        assert(boolValue(state.spatialUi.bundleLoaded) !== null, "spatialUi.bundleLoaded should be boolean.", failures);
        assert(boolValue(state.spatialUi.activePanel) !== null, "spatialUi.activePanel should be boolean.", failures);
        if (options.expectSpatialUi === "loaded") {
            assert(state.spatialUi.bundleLoaded === true, "spatialUi.bundleLoaded should be true.", failures);
        } else if (options.expectSpatialUi === "not-loaded") {
            assert(state.spatialUi.bundleLoaded === false, "spatialUi.bundleLoaded should be false.", failures);
        } else if (options.expectSpatialUi === "active") {
            assert(state.spatialUi.activePanel === true, "spatialUi.activePanel should be true.", failures);
        } else if (options.expectSpatialUi === "inactive") {
            assert(state.spatialUi.activePanel === false, "spatialUi.activePanel should be false.", failures);
        }
    }

    if (options.maxConsoleErrors !== null) {
        const consoleErrors = countConsoleErrors(capture);
        assert(consoleErrors <= options.maxConsoleErrors, `console error/assert count ${consoleErrors} exceeds ${options.maxConsoleErrors}.`, failures);
    }

    if (options.maxNetworkFailures !== null) {
        const networkFailures = Array.isArray(capture.networkFailures) ? capture.networkFailures.length : 0;
        assert(networkFailures <= options.maxNetworkFailures, `network failure count ${networkFailures} exceeds ${options.maxNetworkFailures}.`, failures);
    }

    if (options.maxExceptions !== null) {
        const exceptions = Array.isArray(capture.exceptions) ? capture.exceptions.length : 0;
        assert(exceptions <= options.maxExceptions, `exception count ${exceptions} exceeds ${options.maxExceptions}.`, failures);
    }

    return { failures, state };
}

function printSummary(capture, state) {
    const url = capture.url || capture.requestedUrl || "direct-state";
    const presentation = state.presentation || {};
    const profile = state.vrProfile || {};
    const postFx = state.postProcessing || {};
    const navigation = state.navigation || {};
    const spatialUi = state.spatialUi || {};

    console.log(`VRodos feature-state check: ${url}`);
    console.log(`Presentation: ${presentation.mode || "n/a"}; profile: ${profile.profile || "n/a"}; post-FX owner: ${postFx.owner || "n/a"}`);
    console.log(`Navigation: ${navigation.navigationMode || "n/a"}; navMeshTargets: ${navigation.navMeshTargets ?? "n/a"}; spatial UI loaded: ${String(Boolean(spatialUi.bundleLoaded))}`);
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    const raw = await readFile(options.input, "utf8");
    const capture = JSON.parse(raw);
    const { failures, state } = validateCapture(capture, options);

    if (failures.length > 0) {
        console.error("VRodos feature-state check failed:");
        failures.forEach((failure) => console.error(`- ${failure}`));
        process.exit(1);
    }

    printSummary(capture, state);
    console.log("Browser feature-state profile check passed.");
}

main().catch((error) => {
    console.error(error && error.message ? error.message : String(error));
    process.exit(1);
});
