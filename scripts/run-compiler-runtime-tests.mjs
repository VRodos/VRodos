import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");

function versionedPhpBinaries(directory, executablePath) {
    if (!directory || !existsSync(directory)) {
        return [];
    }

    return readdirSync(directory, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(directory, entry.name, ...executablePath))
        .filter(existsSync)
        .sort((left, right) => right.localeCompare(left, undefined, { numeric: true }));
}

function candidatePhpBinaries() {
    const candidates = [
        process.env.PHP_BINARY,
        process.env.PHP,
        "php"
    ].filter(Boolean);

    if (process.env.APPDATA) {
        candidates.push(...versionedPhpBinaries(join(
            process.env.APPDATA,
            "Local",
            "lightning-services"
        ), ["bin", "win64", "php.exe"]));
    }

    if (process.platform === "win32") {
        const systemDrive = process.env.SystemDrive || "C:";
        const wampRoots = [
            process.env.WAMP_HOME,
            process.env.WAMP64_HOME,
            `${systemDrive}\\wamp64`,
            `${systemDrive}\\wamp`
        ].filter(Boolean);

        wampRoots.forEach((wampRoot) => {
            candidates.push(...versionedPhpBinaries(
                join(wampRoot, "bin", "php"),
                ["php.exe"]
            ));
        });
    }

    return candidates;
}

function canRunPhp(candidate) {
    if (candidate !== "php" && !existsSync(candidate)) {
        return false;
    }
    const result = spawnSync(candidate, ["-v"], {
        cwd: root,
        encoding: "utf8",
        shell: false,
        stdio: "ignore"
    });
    return result.status === 0;
}

const php = candidatePhpBinaries().find(canRunPhp);
if (!php) {
    console.error("Could not find PHP. Set PHP or PHP_BINARY to run compiler runtime tests.");
    process.exit(1);
}

[
    "scripts/test-compiler-runtime-script-planner.php",
    "scripts/test-compiler-runtime-dom-transformer.php",
    "scripts/test-compiler-plan-foundations.php",
    "scripts/test-legacy-metadata-migration.php"
].forEach((testFile) => {
    const result = spawnSync(php, [resolve(root, testFile)], {
        cwd: root,
        stdio: "inherit",
        shell: false
    });
    if (result.status !== 0) {
        process.exit(result.status || 1);
    }
});

const securityResult = spawnSync(process.execPath, [resolve(root, "scripts/test-compiler-security-contract.mjs")], {
    cwd: root,
    stdio: "inherit",
    shell: false
});
if (securityResult.status !== 0) {
    process.exit(securityResult.status || 1);
}
