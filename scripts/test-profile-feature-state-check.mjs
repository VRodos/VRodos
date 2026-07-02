import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmpDir = path.join(os.tmpdir(), `vrodos-profile-feature-state-${process.pid}`);

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function runCheck(args) {
    return spawnSync(process.execPath, ["scripts/check-profile-feature-state.mjs", ...args], {
        cwd: root,
        encoding: "utf8",
        shell: false
    });
}

function fixtureCapture(overrides = {}) {
    const state = {
        presentation: {
            mode: "inline",
            immersiveXr: false
        },
        vrProfile: {
            profile: "desktop",
            headset: false,
            pmndrsComposer: false
        },
        postProcessing: {
            requested: false,
            allowed: false,
            owner: "direct"
        },
        renderer: {
            renderQuality: "high",
            aaQuality: "balanced",
            vrRenderBudget: {
                profile: "desktop",
                framebufferScale: 1,
                foveation: 0.5
            }
        },
        shadows: {
            effectiveQuality: "high"
        },
        navigation: {
            navigationMode: "walkable",
            collisionActive: true,
            navMeshTargets: 2
        },
        spatialUi: {
            bundleLoaded: false,
            activePanel: false
        }
    };

    return Object.assign({
        url: "http://wp.local:5832/Master_Client_fixture.html",
        scene: {
            sceneLoaded: true,
            runtimeFeatureState: state
        },
        console: [],
        networkFailures: [],
        exceptions: []
    }, overrides);
}

await mkdir(tmpDir, { recursive: true });

try {
    const validPath = path.join(tmpDir, "valid-profile.json");
    await writeFile(validPath, `${JSON.stringify(fixtureCapture(), null, 2)}\n`, "utf8");

    const validResult = runCheck([
        "--input", validPath,
        "--expect-presentation", "inline",
        "--expect-profile", "desktop",
        "--expect-postfx-owner", "direct",
        "--expect-postfx-requested", "false",
        "--expect-postfx-allowed", "false",
        "--expect-navigation-mode", "walkable",
        "--expect-spatial-ui", "not-loaded",
        "--expect-vr-budget", "present",
        "--expect-collision-active", "true",
        "--min-navmesh-targets", "1",
        "--max-console-errors", "0",
        "--max-network-failures", "0",
        "--max-exceptions", "0"
    ]);
    assert(validResult.status === 0, `valid profile should pass: ${validResult.stderr || validResult.stdout}`);

    const directStatePath = path.join(tmpDir, "direct-state.json");
    await writeFile(directStatePath, `${JSON.stringify(fixtureCapture().scene.runtimeFeatureState, null, 2)}\n`, "utf8");
    const directStateResult = runCheck(["--input", directStatePath, "--expect-profile", "desktop"]);
    assert(directStateResult.status === 0, `direct state should pass: ${directStateResult.stderr || directStateResult.stdout}`);

    const missingPath = path.join(tmpDir, "missing-feature-state.json");
    await writeFile(missingPath, `${JSON.stringify({ scene: {} }, null, 2)}\n`, "utf8");
    const missingResult = runCheck(["--input", missingPath]);
    assert(missingResult.status !== 0, "missing runtimeFeatureState should fail");
    assert(missingResult.stderr.includes("Missing scene.runtimeFeatureState"), "missing state failure should be specific");

    const mismatchResult = runCheck(["--input", validPath, "--expect-profile", "headset"]);
    assert(mismatchResult.status !== 0, "profile mismatch should fail");
    assert(mismatchResult.stderr.includes("vrProfile.profile"), "profile mismatch failure should name the field");

    const consoleErrorPath = path.join(tmpDir, "console-error-profile.json");
    await writeFile(
        consoleErrorPath,
        `${JSON.stringify(fixtureCapture({ console: [{ type: "error", text: "boom" }] }), null, 2)}\n`,
        "utf8"
    );
    const consoleErrorResult = runCheck(["--input", consoleErrorPath, "--max-console-errors", "0"]);
    assert(consoleErrorResult.status !== 0, "console error threshold should fail");
    assert(consoleErrorResult.stderr.includes("console error/assert count"), "console failure should name the threshold");

    console.log("Profile feature-state check harness passed.");
} finally {
    await rm(tmpDir, { recursive: true, force: true });
}
