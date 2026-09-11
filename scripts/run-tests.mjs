import { fileURLToPath } from 'node:url';
import { testGroups } from './regression-test-catalog.mjs';
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


export function runTests(group = 'all', checkOnly = false) {
    const names = group === 'all' ? Object.keys(testGroups) : [group];
    if (names.some((name) => !Object.hasOwn(testGroups, name))) {
        throw new Error('Unknown test group: ' + group);
    }
    const catalogued = Object.values(testGroups).flat();
    const discovered = readdirSync(join(root, 'scripts'))
        .filter((name) => /^test-.*\.(mjs|php)$/.test(name))
        .map((name) => 'scripts/' + name);
    if (new Set(catalogued).size !== catalogued.length ||
        discovered.some((file) => !catalogued.includes(file)) ||
        catalogued.some((file) => !discovered.includes(file))) {
        throw new Error('Test catalog must list every scripts/test-* test exactly once.');
    }
    if (checkOnly) {
        console.log('Test catalog verified (' + catalogued.length + ' tests).');
        return;
    }
    const selected = names.flatMap((name) => testGroups[name]);
    const php = selected.some((file) => file.endsWith('.php'))
        ? candidatePhpBinaries().find(canRunPhp) : null;
    if (selected.some((file) => file.endsWith('.php')) && !php) {
        throw new Error('Could not find PHP. Set PHP or PHP_BINARY.');
    }
    for (const file of selected) {
        const result = spawnSync(file.endsWith('.php') ? php : process.execPath, [resolve(root, file)], {
            cwd: root, stdio: 'inherit', shell: false
        });
        if (result.error) throw result.error;
        if (result.status !== 0) throw new Error(file + ' failed (exit ' + result.status + ').');
    }
    console.log('Passed ' + selected.length + ' tests (' + group + ').');
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const args = process.argv.slice(2);
    const groupIndex = args.indexOf('--group');
    if (args.some((arg, index) => arg !== '--group' && arg !== '--check-catalog' && !(groupIndex !== -1 && index === groupIndex + 1)) ||
        (groupIndex !== -1 && (!args[groupIndex + 1] || args[groupIndex + 1].startsWith('--')))) {
        throw new Error('Usage: node scripts/run-tests.mjs [--group runtime|compiler|all] [--check-catalog]');
    }
    runTests(groupIndex === -1 ? 'all' : args[groupIndex + 1], args.includes('--check-catalog'));
}
