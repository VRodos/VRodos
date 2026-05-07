#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginRoot = path.resolve(__dirname, '..');
const defaultTmpDir = process.platform === 'win32' ? 'C:\\tmp' : os.tmpdir();
const defaultAuditPath = path.join(defaultTmpDir, 'vrodos-master-client-asset-audit.json');
const defaultOutputDir = path.join(defaultTmpDir, 'vrodos-master-client-optimized-assets');
const defaultManifestPath = path.join(defaultOutputDir, 'manifest.json');
const defaultMarkdownPath = path.join(defaultOutputDir, 'manifest.md');
const GLB_MAGIC = 'glTF';
const GLB_VERSION = 2;
const GLB_JSON_CHUNK = 0x4e4f534a;
const TRIANGLES_MODE = 4;
const TRIANGLE_STRIP_MODE = 5;
const TRIANGLE_FAN_MODE = 6;

function parseArgs(argv) {
    const options = {
        audit: defaultAuditPath,
        outputDir: defaultOutputDir,
        manifest: '',
        markdown: '',
        profile: 'safe-draco',
        limit: 3,
        include: '',
        gltfTransform: '',
        dryRun: false,
        json: false
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
            case '--audit':
                options.audit = nextValue() || options.audit;
                break;
            case '--output-dir':
                options.outputDir = nextValue() || options.outputDir;
                break;
            case '--manifest':
                options.manifest = nextValue() || '';
                break;
            case '--markdown':
                options.markdown = nextValue() || '';
                break;
            case '--profile':
                options.profile = nextValue() || options.profile;
                break;
            case '--limit':
                options.limit = Math.max(1, Math.floor(nextNumber(options.limit)));
                break;
            case '--include':
                options.include = nextValue() || '';
                break;
            case '--gltf-transform':
                options.gltfTransform = nextValue() || '';
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--json':
                options.json = true;
                break;
            case '--help':
            case '-h':
                printHelp();
                process.exit(0);
                break;
            default:
                if (!arg.startsWith('-')) {
                    options.audit = arg;
                    break;
                }
                throw new Error(`Unknown argument "${arg}".`);
        }
    }

    options.audit = path.resolve(options.audit);
    options.outputDir = path.resolve(options.outputDir);
    options.manifest = path.resolve(options.manifest || path.join(options.outputDir, path.basename(defaultManifestPath)));
    options.markdown = path.resolve(options.markdown || path.join(options.outputDir, path.basename(defaultMarkdownPath)));

    return options;
}

function printHelp() {
    console.log(`Usage:
  node scripts/prototype-optimize-master-client-assets.mjs [options]

Options:
  --audit PATH            Asset audit JSON. Default: ${defaultAuditPath}
  --output-dir PATH       Directory for derivative GLBs and reports. Default: ${defaultOutputDir}
  --manifest PATH         JSON manifest path. Defaults under --output-dir.
  --markdown PATH         Markdown report path. Defaults under --output-dir.
  --profile NAME          One of safe-draco, safe-meshopt. Default: safe-draco.
  --limit N               Number of top GLBs to process. Default: 3.
  --include REGEX         Only process assets whose URL or filename matches.
  --gltf-transform PATH   Optional glTF Transform CLI executable.
  --dry-run               Select assets and write reports without generating derivatives.
  --json                  Print JSON manifest to stdout.
`);
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
    return Number.isFinite(value) ? Math.round(value).toLocaleString('en-US') : 'n/a';
}

function normalizeUrlPath(url) {
    if (!url) {
        return '';
    }

    const withoutHash = String(url).split('#')[0];
    const withoutQuery = withoutHash.split('?')[0];
    try {
        if (/^https?:\/\//i.test(withoutQuery)) {
            return decodeURIComponent(new URL(withoutQuery).pathname);
        }
        return decodeURIComponent(withoutQuery).replaceAll('\\', '/');
    } catch (error) {
        return withoutQuery.replaceAll('\\', '/');
    }
}

function slugify(value) {
    return String(value)
        .replace(/\.[^.]+$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 90) || 'asset';
}

function parseGlbJson(buffer, filePath) {
    if (buffer.length < 20 || buffer.toString('utf8', 0, 4) !== GLB_MAGIC) {
        throw new Error(`${filePath} is not a GLB file.`);
    }

    const version = buffer.readUInt32LE(4);
    if (version !== GLB_VERSION) {
        throw new Error(`${filePath} is GLB version ${version}; only GLB v2 is supported.`);
    }

    const declaredLength = buffer.readUInt32LE(8);
    let offset = 12;
    while (offset + 8 <= buffer.length && offset < declaredLength) {
        const chunkLength = buffer.readUInt32LE(offset);
        const chunkType = buffer.readUInt32LE(offset + 4);
        const chunkStart = offset + 8;
        const chunkEnd = chunkStart + chunkLength;
        if (chunkEnd > buffer.length) {
            throw new Error(`${filePath} has a malformed GLB chunk.`);
        }
        if (chunkType === GLB_JSON_CHUNK) {
            return JSON.parse(buffer.toString('utf8', chunkStart, chunkEnd).trim());
        }
        offset = chunkEnd;
    }

    throw new Error(`${filePath} does not contain a JSON chunk.`);
}

function primitiveSubmittedCount(gltf, primitive) {
    const accessors = Array.isArray(gltf.accessors) ? gltf.accessors : [];
    if (primitive.indices !== undefined && primitive.indices !== null && accessors[primitive.indices]) {
        return accessors[primitive.indices].count || 0;
    }

    const positionIndex = primitive.attributes && primitive.attributes.POSITION;
    if (positionIndex !== undefined && positionIndex !== null && accessors[positionIndex]) {
        return accessors[positionIndex].count || 0;
    }

    return 0;
}

function primitiveVertexCount(gltf, primitive) {
    const accessors = Array.isArray(gltf.accessors) ? gltf.accessors : [];
    const positionIndex = primitive.attributes && primitive.attributes.POSITION;
    if (positionIndex !== undefined && positionIndex !== null && accessors[positionIndex]) {
        return accessors[positionIndex].count || 0;
    }
    return 0;
}

function estimatePrimitiveTriangles(mode, submittedCount) {
    if (!Number.isFinite(submittedCount) || submittedCount <= 0) {
        return 0;
    }
    if (mode === TRIANGLES_MODE) {
        return Math.floor(submittedCount / 3);
    }
    if (mode === TRIANGLE_STRIP_MODE || mode === TRIANGLE_FAN_MODE) {
        return Math.max(0, submittedCount - 2);
    }
    return 0;
}

function extensionSet(gltf) {
    const names = new Set();
    for (const key of ['extensionsUsed', 'extensionsRequired']) {
        const values = Array.isArray(gltf[key]) ? gltf[key] : [];
        values.forEach((value) => names.add(value));
    }

    const meshes = Array.isArray(gltf.meshes) ? gltf.meshes : [];
    meshes.forEach((mesh) => {
        (mesh.primitives || []).forEach((primitive) => {
            Object.keys(primitive.extensions || {}).forEach((name) => names.add(name));
        });
    });

    return names;
}

function analyzeGltf(gltf) {
    const meshes = Array.isArray(gltf.meshes) ? gltf.meshes : [];
    const nodes = Array.isArray(gltf.nodes) ? gltf.nodes : [];
    const materials = Array.isArray(gltf.materials) ? gltf.materials : [];
    const textures = Array.isArray(gltf.textures) ? gltf.textures : [];
    const images = Array.isArray(gltf.images) ? gltf.images : [];
    const animations = Array.isArray(gltf.animations) ? gltf.animations : [];
    const extensions = extensionSet(gltf);
    const usedMaterials = new Set();
    let primitiveCount = 0;
    let vertexCount = 0;
    let submittedVertexCount = 0;
    let estimatedTriangles = 0;

    meshes.forEach((mesh) => {
        (mesh.primitives || []).forEach((primitive) => {
            primitiveCount += 1;
            const mode = primitive.mode === undefined ? TRIANGLES_MODE : primitive.mode;
            if (primitive.material !== undefined && primitive.material !== null) {
                usedMaterials.add(primitive.material);
            }
            const submitted = primitiveSubmittedCount(gltf, primitive);
            submittedVertexCount += submitted;
            vertexCount += primitiveVertexCount(gltf, primitive);
            estimatedTriangles += estimatePrimitiveTriangles(mode, submitted);
        });
    });

    return {
        generator: gltf.asset && gltf.asset.generator ? gltf.asset.generator : '',
        counts: {
            nodes: nodes.length,
            meshes: meshes.length,
            primitives: primitiveCount,
            materials: materials.length,
            usedMaterials: usedMaterials.size,
            textures: textures.length,
            images: images.length,
            animations: animations.length
        },
        geometry: {
            estimatedTriangles,
            vertexCount,
            submittedVertexCount
        },
        extensions: {
            used: Array.from(extensions).sort(),
            hasMeshopt: extensions.has('EXT_meshopt_compression'),
            hasDraco: extensions.has('KHR_draco_mesh_compression'),
            hasKtx2: extensions.has('KHR_texture_basisu')
        }
    };
}

async function analyzeGlbFile(filePath) {
    const buffer = await readFile(filePath);
    return analyzeGltf(parseGlbJson(buffer, filePath));
}

function scoreAsset(asset) {
    const flags = new Set(asset.flags || []);
    const size = Number(asset.sizeBytes || asset.localSizeBytes) || 0;
    const triangles = asset.gltf?.geometry?.estimatedTriangles || 0;
    let score = size + triangles * 100;
    if (flags.has('very_large_file')) {
        score += 80 * 1024 * 1024;
    }
    if (flags.has('large_file')) {
        score += 30 * 1024 * 1024;
    }
    if (flags.has('many_materials')) {
        score += 20 * 1024 * 1024;
    }
    if (flags.has('many_primitives')) {
        score += 20 * 1024 * 1024;
    }
    if (flags.has('missing_geometry_compression')) {
        score += 10 * 1024 * 1024;
    }
    return score;
}

function selectAssets(audit, options) {
    const includeRegex = options.include ? new RegExp(options.include, 'i') : null;
    return (audit.glbAssets || [])
        .filter((asset) => asset.exists && asset.localPath && !asset.error)
        .filter((asset) => {
            if (!includeRegex) {
                return true;
            }
            return includeRegex.test(asset.url || '') || includeRegex.test(path.basename(asset.localPath || ''));
        })
        .sort((a, b) => scoreAsset(b) - scoreAsset(a))
        .slice(0, options.limit);
}

function resolveGltfTransformRunner(explicitPath) {
    if (explicitPath) {
        return { command: explicitPath, baseArgs: [] };
    }

    const cliPath = path.join(pluginRoot, 'node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js');
    if (!existsSync(cliPath)) {
        throw new Error('Missing @gltf-transform/cli. Run npm install before optimizing assets.');
    }

    return {
        command: process.execPath,
        baseArgs: [cliPath]
    };
}

async function runCommand(runner, args, timeoutMs = 10 * 60 * 1000) {
    const startedAt = Date.now();
    return new Promise((resolve) => {
        const child = spawn(runner.command, [...runner.baseArgs, ...args], {
            cwd: pluginRoot,
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true
        });

        let stdout = '';
        let stderr = '';
        const timeout = setTimeout(() => {
            child.kill();
        }, timeoutMs);

        child.stdout.on('data', (chunk) => {
            stdout += String(chunk);
        });
        child.stderr.on('data', (chunk) => {
            stderr += String(chunk);
        });
        child.on('close', (code, signal) => {
            clearTimeout(timeout);
            resolve({
                args,
                code,
                signal,
                stdout,
                stderr,
                durationMs: Date.now() - startedAt
            });
        });
    });
}

function profileSteps(profile, inputPath, outputPath, workDir) {
    const step1 = path.join(workDir, '01-prune.glb');
    const step2 = path.join(workDir, '02-dedup.glb');

    if (profile === 'safe-draco') {
        return [
            ['prune', inputPath, step1, '--keep-leaves', 'true', '--keep-solid-textures', 'true'],
            ['dedup', step1, step2],
            ['draco', step2, outputPath, '--method', 'edgebreaker']
        ];
    }

    if (profile === 'safe-meshopt') {
        return [
            ['prune', inputPath, step1, '--keep-leaves', 'true', '--keep-solid-textures', 'true'],
            ['dedup', step1, step2],
            ['meshopt', step2, outputPath, '--level', 'medium']
        ];
    }

    throw new Error(`Unknown optimization profile "${profile}".`);
}

async function getFileSize(filePath) {
    const details = await stat(filePath);
    return details.size;
}

function reduction(sourceBytes, derivativeBytes) {
    if (!sourceBytes || !derivativeBytes) {
        return {
            bytes: 0,
            percent: 0
        };
    }
    return {
        bytes: sourceBytes - derivativeBytes,
        percent: ((sourceBytes - derivativeBytes) / sourceBytes) * 100
    };
}

async function optimizeAsset(asset, index, options, runner) {
    const sourcePath = path.resolve(asset.localPath);
    const fileName = path.basename(normalizeUrlPath(asset.url || sourcePath));
    const slug = `${String(index + 1).padStart(2, '0')}-${slugify(fileName)}`;
    const derivativePath = path.join(options.outputDir, `${slug}.${options.profile}.glb`);
    const workDir = path.join(options.outputDir, '.work', `${slug}-${Date.now()}`);
    const sourceSizeBytes = asset.localSizeBytes || asset.sizeBytes || await getFileSize(sourcePath);
    const record = {
        sourceUrl: asset.url,
        sourcePath,
        context: asset.context || '',
        profile: options.profile,
        derivativePath,
        sourceSizeBytes,
        sourceSizeLabel: formatBytes(sourceSizeBytes),
        derivativeSizeBytes: null,
        derivativeSizeLabel: null,
        reductionBytes: null,
        reductionPercent: null,
        original: asset.gltf || await analyzeGlbFile(sourcePath),
        derivative: null,
        commands: [],
        status: options.dryRun ? 'dry-run' : 'pending',
        error: null,
        runtimeSubstitutionReady: false,
        runtimeNotes: []
    };

    if (options.profile === 'safe-meshopt') {
        record.runtimeNotes.push('Requires EXT_meshopt_compression decoder wiring before compile-time substitution.');
    }
    if (options.profile === 'safe-draco') {
        record.runtimeNotes.push('Requires compiled runtime/A-Frame GLTFLoader Draco decoder wiring verification before compile-time substitution.');
    }
    record.runtimeNotes.push('Derivative is for prototype review only; source upload is untouched.');

    if (options.dryRun) {
        return record;
    }

    await mkdir(workDir, { recursive: true });
    const steps = profileSteps(options.profile, sourcePath, derivativePath, workDir);
    for (const args of steps) {
        const command = await runCommand(runner, args);
        record.commands.push(command);
        if (command.code !== 0) {
            record.status = 'error';
            record.error = `${args[0]} failed with exit code ${command.code}${command.signal ? ` (${command.signal})` : ''}`;
            return record;
        }
    }

    record.derivativeSizeBytes = await getFileSize(derivativePath);
    record.derivativeSizeLabel = formatBytes(record.derivativeSizeBytes);
    const delta = reduction(sourceSizeBytes, record.derivativeSizeBytes);
    record.reductionBytes = delta.bytes;
    record.reductionPercent = delta.percent;
    record.derivative = await analyzeGlbFile(derivativePath);
    record.status = 'done';

    return record;
}

function markdownEscape(value) {
    return String(value === undefined || value === null ? '' : value).replaceAll('|', '\\|').replace(/\s+/g, ' ').trim();
}

function markdownTable(headers, rows) {
    const header = `| ${headers.map(markdownEscape).join(' | ')} |`;
    const divider = `| ${headers.map(() => '---').join(' | ')} |`;
    const body = rows.map((row) => `| ${row.map(markdownEscape).join(' | ')} |`);
    return [header, divider, ...body].join('\n');
}

function renderMarkdown(manifest) {
    const lines = [];
    lines.push('# VRodos Optimized Asset Derivative Prototype');
    lines.push('');
    lines.push(`- Generated: ${manifest.generatedAt}`);
    lines.push(`- Audit: \`${manifest.auditPath}\``);
    lines.push(`- Output directory: \`${manifest.outputDir}\``);
    lines.push(`- Profile: \`${manifest.profile}\``);
    lines.push(`- glTF Transform: \`${manifest.gltfTransform.version || manifest.gltfTransform.command}\``);
    lines.push('');
    lines.push('## Results');
    lines.push('');
    lines.push(markdownTable(
        ['Asset', 'Status', 'Source', 'Derivative', 'Reduction', 'Source tris', 'Derivative tris', 'Extensions'],
        manifest.assets.map((asset) => {
            const derivativeExtensions = asset.derivative?.extensions
                ? [
                    asset.derivative.extensions.hasDraco ? 'draco' : '',
                    asset.derivative.extensions.hasMeshopt ? 'meshopt' : '',
                    asset.derivative.extensions.hasKtx2 ? 'ktx2' : ''
                ].filter(Boolean).join(', ') || 'none'
                : 'n/a';
            const reductionLabel = Number.isFinite(asset.reductionPercent)
                ? `${formatBytes(asset.reductionBytes)} (${asset.reductionPercent.toFixed(1)}%)`
                : 'n/a';
            return [
                path.basename(asset.sourcePath),
                asset.status,
                asset.sourceSizeLabel,
                asset.derivativeSizeLabel || 'n/a',
                reductionLabel,
                formatNumber(asset.original?.geometry?.estimatedTriangles),
                formatNumber(asset.derivative?.geometry?.estimatedTriangles),
                derivativeExtensions
            ];
        })
    ));
    lines.push('');
    lines.push('## Runtime Notes');
    lines.push('');
    lines.push('- These files are prototype derivatives, not active runtime assets.');
    lines.push('- Do not substitute them into compiled pages until loader support and visual comparison are complete.');
    lines.push('- The admin-panel optimization feature should keep the original upload, store derivative metadata, and let scene compilation choose a validated derivative by profile.');
    lines.push('');
    lines.push('## Derivative Paths');
    lines.push('');
    manifest.assets.forEach((asset, index) => {
        lines.push(`${index + 1}. \`${asset.derivativePath}\``);
    });

    return `${lines.join('\n')}\n`;
}

async function getToolVersion(runner) {
    const result = await runCommand(runner, ['--version'], 30000);
    const text = `${result.stdout}\n${result.stderr}`.trim();
    return text || '';
}

function printSummary(manifest) {
    console.log(`VRodos asset derivative prototype: ${manifest.profile}`);
    manifest.assets.forEach((asset, index) => {
        const reductionLabel = Number.isFinite(asset.reductionPercent)
            ? `${formatBytes(asset.reductionBytes)} (${asset.reductionPercent.toFixed(1)}%)`
            : 'n/a';
        console.log(`${index + 1}. ${path.basename(asset.sourcePath)}: ${asset.status}, ${asset.sourceSizeLabel} -> ${asset.derivativeSizeLabel || 'n/a'}, saved ${reductionLabel}`);
    });
    console.log(`Manifest written to ${manifest.manifestPath}`);
    console.log(`Markdown written to ${manifest.markdownPath}`);
}

async function run() {
    const options = parseArgs(process.argv.slice(2));
    const audit = JSON.parse(await readFile(options.audit, 'utf8'));
    const selectedAssets = selectAssets(audit, options);
    const runner = resolveGltfTransformRunner(options.gltfTransform);
    const toolVersion = options.dryRun ? '' : await getToolVersion(runner);
    await mkdir(options.outputDir, { recursive: true });

    const manifest = {
        generatedAt: new Date().toISOString(),
        auditPath: options.audit,
        outputDir: options.outputDir,
        manifestPath: options.manifest,
        markdownPath: options.markdown,
        profile: options.profile,
        dryRun: options.dryRun,
        gltfTransform: {
            command: runner.command,
            baseArgs: runner.baseArgs,
            version: toolVersion
        },
        selection: {
            limit: options.limit,
            include: options.include || null,
            selectedCount: selectedAssets.length
        },
        assets: []
    };

    for (let index = 0; index < selectedAssets.length; index += 1) {
        manifest.assets.push(await optimizeAsset(selectedAssets[index], index, options, runner));
    }

    await mkdir(path.dirname(options.manifest), { recursive: true });
    await writeFile(options.manifest, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    await mkdir(path.dirname(options.markdown), { recursive: true });
    await writeFile(options.markdown, renderMarkdown(manifest), 'utf8');

    if (options.json) {
        console.log(JSON.stringify(manifest, null, 2));
    } else {
        printSummary(manifest);
    }

    const failed = manifest.assets.filter((asset) => asset.status === 'error');
    if (failed.length) {
        process.exitCode = 1;
    }
}

run().catch((error) => {
    console.error(error.stack || error.message || String(error));
    process.exit(1);
});
