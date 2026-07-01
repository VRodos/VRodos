import { spawnSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const roots = [
    'scripts',
    'assets/js/editor',
    'assets/js/runtime'
];
const excludedSegments = [
    'assets/js/runtime/master/lib'
];

function toPosix(value) {
    return value.split(path.sep).join('/');
}

function isExcluded(filePath) {
    const relative = toPosix(path.relative(root, filePath));
    return excludedSegments.some((segment) => relative.startsWith(segment));
}

async function collectFiles(directory, files = []) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
        const filePath = path.join(directory, entry.name);
        if (isExcluded(filePath)) {
            continue;
        }
        if (entry.isDirectory()) {
            await collectFiles(filePath, files);
            continue;
        }
        if (entry.isFile() && /\.(?:js|mjs)$/u.test(entry.name)) {
            files.push(filePath);
        }
    }
    return files;
}

async function isClassicScript(filePath) {
    if (filePath.endsWith('.mjs')) {
        return true;
    }
    const source = await readFile(filePath, 'utf8');
    return !/^\s*(?:import|export)\s/mu.test(source);
}

const files = [];
for (const relativeRoot of roots) {
    await collectFiles(path.join(root, relativeRoot), files);
}

let checked = 0;
let skippedEsm = 0;
const failures = [];

for (const filePath of files.sort()) {
    if (!(await isClassicScript(filePath))) {
        skippedEsm += 1;
        continue;
    }

    const result = spawnSync(process.execPath, ['--check', filePath], {
        cwd: root,
        encoding: 'utf8',
        shell: false
    });

    checked += 1;
    if (result.status !== 0) {
        failures.push({
            file: path.relative(root, filePath),
            output: `${result.stdout || ''}${result.stderr || ''}`.trim()
        });
    }
}

if (failures.length > 0) {
    failures.forEach((failure) => {
        console.error(`Syntax check failed: ${failure.file}`);
        if (failure.output) {
            console.error(failure.output);
        }
    });
    process.exit(1);
}

console.log(`Runtime syntax check passed (${checked} checked, ${skippedEsm} ESM files covered by lint/build).`);
