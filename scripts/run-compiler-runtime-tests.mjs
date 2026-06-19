import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");

function candidatePhpBinaries() {
    const candidates = [
        process.env.PHP_BINARY,
        process.env.PHP,
        "php"
    ].filter(Boolean);

    if (process.env.APPDATA) {
        candidates.push(join(
            process.env.APPDATA,
            "Local",
            "lightning-services",
            "php-8.3.29+1",
            "bin",
            "win64",
            "php.exe"
        ));
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
    "scripts/test-compiler-runtime-dom-transformer.php"
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
