#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginRoot = path.resolve(__dirname, '..');
const defaultWordPressRoot = path.resolve(pluginRoot, '..', '..', '..');
const defaultTmpDir = process.platform === 'win32' ? 'C:\\tmp' : os.tmpdir();
const defaultProfilePath = path.join(defaultTmpDir, 'vrodos-master-client-after-spector-run.json');
const defaultOutputPath = path.join(defaultTmpDir, 'vrodos-master-client-asset-audit.json');
const defaultMarkdownPath = path.join(defaultTmpDir, 'vrodos-master-client-asset-audit.md');

const GLB_MAGIC = 'glTF';
const GLB_VERSION = 2;
const GLB_JSON_CHUNK = 0x4e4f534a;
const TRIANGLES_MODE = 4;
const TRIANGLE_STRIP_MODE = 5;
const TRIANGLE_FAN_MODE = 6;

function parseArgs(argv) {
    const options = {
        profile: defaultProfilePath,
        output: defaultOutputPath,
        markdown: defaultMarkdownPath,
        wordpressRoot: defaultWordPressRoot,
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

        switch (flag) {
            case '--profile':
                options.profile = nextValue() || options.profile;
                break;
            case '--output':
                options.output = nextValue() || options.output;
                break;
            case '--markdown':
                options.markdown = nextValue() || options.markdown;
                break;
            case '--wordpress-root':
                options.wordpressRoot = nextValue() || options.wordpressRoot;
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
                    options.profile = arg;
                    break;
                }
                throw new Error(`Unknown argument "${arg}".`);
        }
    }

    return {
        ...options,
        profile: path.resolve(options.profile),
        output: path.resolve(options.output),
        markdown: path.resolve(options.markdown),
        wordpressRoot: path.resolve(options.wordpressRoot)
    };
}

function printHelp() {
    console.log(`Usage:
  node scripts/audit-master-client-assets.mjs [--profile PATH] [options]

Options:
  --profile PATH          Profiler JSON with scene.compileDiagnostics. Default: ${defaultProfilePath}
  --output PATH           Write audit JSON. Default: ${defaultOutputPath}
  --markdown PATH         Write audit Markdown. Default: ${defaultMarkdownPath}
  --wordpress-root PATH   WordPress public root. Default: ${defaultWordPressRoot}
  --json                  Print audit JSON to stdout.
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
    } catch (error) {
        return withoutQuery.replaceAll('\\', '/');
    }

    try {
        return decodeURIComponent(withoutQuery).replaceAll('\\', '/');
    } catch (error) {
        return withoutQuery.replaceAll('\\', '/');
    }
}

function resolveLocalPath(url, wordpressRoot) {
    const urlPath = normalizeUrlPath(url);
    if (!urlPath) {
        return null;
    }

    if (/^[a-z]:\//i.test(urlPath) || urlPath.startsWith('//')) {
        return path.resolve(urlPath);
    }

    if (urlPath.startsWith('/wp-content/')) {
        return path.join(wordpressRoot, urlPath.slice(1));
    }

    if (urlPath.startsWith('wp-content/')) {
        return path.join(wordpressRoot, urlPath);
    }

    if (urlPath.startsWith('../../assets/')) {
        return path.resolve(pluginRoot, urlPath.replace(/^\.\.\/\.\.\//, ''));
    }

    return path.resolve(wordpressRoot, urlPath.replace(/^\//, ''));
}

function isGlbAsset(asset) {
    const urlPath = normalizeUrlPath(asset.url).toLowerCase();
    const type = String(asset.type || '').toLowerCase();
    return urlPath.endsWith('.glb') || type.includes('gltf');
}

function countBy(items, getter) {
    const counts = new Map();
    for (const item of items) {
        const key = getter(item);
        if (!key) {
            continue;
        }
        counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
}

function contextFromWarnings(warnings, url) {
    const warning = warnings.find((item) => item.includes(url) && item.includes(' in '));
    if (!warning) {
        return '';
    }
    const match = warning.match(/ in ([^:]+:[^:]+): /);
    return match ? match[1] : '';
}

function contextForAsset(asset, warnings) {
    if (Array.isArray(asset.contexts) && asset.contexts.length) {
        return asset.contexts.filter(Boolean).join(', ');
    }
    if (asset.context) {
        return String(asset.context);
    }
    return contextFromWarnings(warnings, asset.url);
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
            const jsonText = buffer.toString('utf8', chunkStart, chunkEnd).trim();
            return JSON.parse(jsonText);
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
    const buffers = Array.isArray(gltf.buffers) ? gltf.buffers : [];
    const extensions = extensionSet(gltf);
    const usedMaterials = new Set();
    const modeCounts = {};
    let primitiveCount = 0;
    let indexedPrimitiveCount = 0;
    let vertexCount = 0;
    let submittedVertexCount = 0;
    let estimatedTriangles = 0;
    let maxPrimitiveSubmittedCount = 0;
    let maxPrimitiveTriangles = 0;

    meshes.forEach((mesh) => {
        (mesh.primitives || []).forEach((primitive) => {
            primitiveCount += 1;
            const mode = primitive.mode === undefined ? TRIANGLES_MODE : primitive.mode;
            modeCounts[mode] = (modeCounts[mode] || 0) + 1;
            if (primitive.indices !== undefined && primitive.indices !== null) {
                indexedPrimitiveCount += 1;
            }
            if (primitive.material !== undefined && primitive.material !== null) {
                usedMaterials.add(primitive.material);
            }

            const submitted = primitiveSubmittedCount(gltf, primitive);
            const vertices = primitiveVertexCount(gltf, primitive);
            const triangles = estimatePrimitiveTriangles(mode, submitted);
            submittedVertexCount += submitted;
            vertexCount += vertices;
            estimatedTriangles += triangles;
            maxPrimitiveSubmittedCount = Math.max(maxPrimitiveSubmittedCount, submitted);
            maxPrimitiveTriangles = Math.max(maxPrimitiveTriangles, triangles);
        });
    });

    const bufferBytes = buffers.reduce((total, buffer) => total + (Number(buffer.byteLength) || 0), 0);
    const hasMeshopt = extensions.has('EXT_meshopt_compression');
    const hasDraco = extensions.has('KHR_draco_mesh_compression');
    const hasKtx2 = extensions.has('KHR_texture_basisu');

    return {
        assetVersion: gltf.asset && gltf.asset.version ? gltf.asset.version : '',
        generator: gltf.asset && gltf.asset.generator ? gltf.asset.generator : '',
        counts: {
            nodes: nodes.length,
            meshes: meshes.length,
            primitives: primitiveCount,
            indexedPrimitives: indexedPrimitiveCount,
            materials: materials.length,
            usedMaterials: usedMaterials.size,
            textures: textures.length,
            images: images.length,
            animations: animations.length
        },
        geometry: {
            estimatedTriangles,
            vertexCount,
            submittedVertexCount,
            maxPrimitiveSubmittedCount,
            maxPrimitiveTriangles,
            modeCounts
        },
        buffers: {
            declaredByteLength: bufferBytes
        },
        extensions: {
            used: Array.from(extensions).sort(),
            hasMeshopt,
            hasDraco,
            hasKtx2,
            hasGeometryCompression: hasMeshopt || hasDraco,
            hasTextureCompression: hasKtx2
        }
    };
}

function flagsForGlb(asset, analysis, duplicateCount) {
    const flags = [];
    const sizeBytes = Number(asset.sizeBytes) || 0;
    const triangles = analysis.geometry.estimatedTriangles;
    const materials = analysis.counts.usedMaterials || analysis.counts.materials;

    if (sizeBytes >= 50 * 1024 * 1024) {
        flags.push('very_large_file');
    } else if (sizeBytes >= 20 * 1024 * 1024) {
        flags.push('large_file');
    }
    if (triangles >= 1000000) {
        flags.push('very_high_triangles');
    } else if (triangles >= 500000) {
        flags.push('high_triangles');
    }
    if (analysis.counts.primitives >= 100) {
        flags.push('many_primitives');
    }
    if (materials >= 20) {
        flags.push('many_materials');
    }
    if (duplicateCount > 1) {
        flags.push('duplicate_url');
    }
    if (sizeBytes >= 5 * 1024 * 1024 && !analysis.extensions.hasGeometryCompression) {
        flags.push('missing_geometry_compression');
    }
    if (analysis.counts.images > 0 && !analysis.extensions.hasTextureCompression) {
        flags.push('missing_texture_compression');
    }

    return flags;
}

function recommendationsFor(record) {
    const flags = new Set(record.flags || []);
    const recommendations = [];

    if (flags.has('very_high_triangles') || flags.has('high_triangles')) {
        recommendations.push('Create an optimized derivative with simplification/LOD candidates, then visually compare before enabling it for high.');
    }
    if (flags.has('missing_geometry_compression')) {
        recommendations.push('Test a cached Meshopt or Draco derivative; Three/A-Frame should decode it at load time instead of compressing in the browser.');
    }
    if (flags.has('many_materials')) {
        recommendations.push('Audit material reuse or atlasing; many unique materials increase program switches and draw-call pressure.');
    }
    if (flags.has('missing_texture_compression')) {
        recommendations.push('Evaluate KTX2/Basis texture variants for delivery and GPU memory, especially for lower profiles.');
    }
    if (flags.has('duplicate_url')) {
        recommendations.push('Confirm whether duplicate references can be instanced or deduped in the compiled scene.');
    }
    if (!recommendations.length) {
        recommendations.push('Keep as a lower-priority asset after the large/high-triangle offenders are handled.');
    }

    return recommendations;
}

async function auditGlbAsset(asset, wordpressRoot, duplicateCount, warnings) {
    const localPath = resolveLocalPath(asset.url, wordpressRoot);
    const context = contextForAsset(asset, warnings);
    const result = {
        type: asset.type || 'gltf',
        url: asset.url,
        context,
        localPath,
        duplicateCount,
        sizeBytes: Number(asset.sizeBytes) || null,
        sizeLabel: asset.sizeLabel || null,
        loadPhase: asset.loadPhase || '',
        loadPriority: Number.isFinite(Number(asset.loadPriority)) ? Number(asset.loadPriority) : null,
        loadReason: asset.loadReason || '',
        exists: false,
        error: null,
        gltf: null,
        flags: [],
        recommendations: []
    };

    try {
        if (!localPath || !existsSync(localPath)) {
            result.error = 'Local file was not found.';
            return result;
        }
        result.exists = true;
        const localStat = await stat(localPath);
        result.localSizeBytes = localStat.size;
        const buffer = await readFile(localPath);
        const gltf = parseGlbJson(buffer, localPath);
        result.gltf = analyzeGltf(gltf);
        result.flags = flagsForGlb(
            { ...asset, sizeBytes: result.sizeBytes || result.localSizeBytes },
            result.gltf,
            duplicateCount
        );
        result.recommendations = recommendationsFor(result);
    } catch (error) {
        result.error = error && error.message ? error.message : String(error);
    }

    return result;
}

function auditNonGlbAsset(asset, duplicateCount, warnings) {
    const sizeBytes = Number(asset.sizeBytes) || 0;
    const flags = [];
    if (sizeBytes >= 2 * 1024 * 1024) {
        flags.push('large_media_file');
    }
    if (duplicateCount > 1) {
        flags.push('duplicate_url');
    }

    return {
        type: asset.type || '',
        url: asset.url,
        context: contextForAsset(asset, warnings),
        duplicateCount,
        sizeBytes: sizeBytes || null,
        sizeLabel: asset.sizeLabel || null,
        loadPhase: asset.loadPhase || '',
        loadPriority: Number.isFinite(Number(asset.loadPriority)) ? Number(asset.loadPriority) : null,
        loadReason: asset.loadReason || '',
        flags,
        recommendations: flags.includes('large_media_file')
            ? ['Audit resolution/codec; HTTP compression alone will not reduce GPU texture/video decode cost.']
            : []
    };
}

function summarizeAudit(profile, glbAssets, mediaAssets) {
    const totalGlbBytes = glbAssets.reduce((total, asset) => total + (asset.sizeBytes || asset.localSizeBytes || 0), 0);
    const totalTriangles = glbAssets.reduce((total, asset) => total + (asset.gltf?.geometry?.estimatedTriangles || 0), 0);
    const highRiskAssets = glbAssets.filter((asset) => asset.flags.length > 0);
    const spector = profile.spector && profile.spector.summary ? profile.spector.summary : null;

    return {
        profileUrl: profile.url || '',
        profileCapturedAt: profile.capturedAt || '',
        scene: profile.scene ? {
            effectiveQuality: profile.scene.effectiveQuality || null,
            objectCounts: profile.scene.objectCounts || null,
            domCounts: profile.scene.domCounts || null
        } : null,
        spector,
        assets: {
            glbCount: glbAssets.length,
            mediaCount: mediaAssets.length,
            totalGlbBytes,
            totalGlbSizeLabel: formatBytes(totalGlbBytes),
            estimatedGlbTriangles: totalTriangles,
            highRiskGlbCount: highRiskAssets.length
        }
    };
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

function glbSortScore(asset) {
    const triangles = asset.gltf?.geometry?.estimatedTriangles || 0;
    const size = asset.sizeBytes || asset.localSizeBytes || 0;
    return triangles * 100 + size;
}

function renderMarkdown(audit) {
    const lines = [];
    const summary = audit.summary;
    const topGlbs = audit.glbAssets
        .slice()
        .sort((a, b) => glbSortScore(b) - glbSortScore(a));
    const largeMedia = audit.mediaAssets
        .filter((asset) => asset.flags.length)
        .sort((a, b) => (b.sizeBytes || 0) - (a.sizeBytes || 0));

    lines.push('# VRodos Master Client Asset Audit');
    lines.push('');
    lines.push(`- Profile: \`${audit.profilePath}\``);
    lines.push(`- URL: ${summary.profileUrl || 'n/a'}`);
    lines.push(`- Captured: ${summary.profileCapturedAt || 'n/a'}`);
    lines.push(`- GLB assets audited: ${summary.assets.glbCount}`);
    lines.push(`- Estimated GLB triangles: ${formatNumber(summary.assets.estimatedGlbTriangles)}`);
    lines.push(`- GLB transfer/source size: ${summary.assets.totalGlbSizeLabel}`);
    if (summary.spector) {
        lines.push(`- Spector frame: ${formatNumber(summary.spector.drawCalls)} draw calls, ${formatNumber(summary.spector.programSwitches)} program switches, ${formatNumber(summary.spector.commandCount)} commands`);
        if (summary.spector.primitives && Number.isFinite(summary.spector.primitives.triangles)) {
            lines.push(`- Spector submitted triangles: ${formatNumber(summary.spector.primitives.triangles)}`);
        }
    }
    lines.push('');
    lines.push('## Verdict');
    lines.push('');
    lines.push('The right automation target is cached derivative generation at upload or compile time, not browser-side compression during page load. Three.js/A-Frame should decode already-compressed GLB/KTX2 assets at runtime; the optimizer should run once, store the result, and have the compiled page reference the optimized derivative after validation.');
    lines.push('');
    lines.push('## Top GLB Candidates');
    lines.push('');

    if (topGlbs.length) {
        lines.push(markdownTable(
            ['Asset', 'Context', 'Load', 'Size', 'Triangles', 'Prims', 'Materials', 'Compression', 'Flags'],
            topGlbs.map((asset) => {
                const fileName = path.basename(normalizeUrlPath(asset.url));
                const gltf = asset.gltf || {};
                const compression = gltf.extensions
                    ? [
                        gltf.extensions.hasMeshopt ? 'meshopt' : '',
                        gltf.extensions.hasDraco ? 'draco' : '',
                        gltf.extensions.hasKtx2 ? 'ktx2' : ''
                    ].filter(Boolean).join(', ') || 'none'
                    : 'n/a';
                return [
                    fileName,
                    asset.context || '',
                    asset.loadPhase || '',
                    asset.sizeLabel || formatBytes(asset.sizeBytes || asset.localSizeBytes || 0),
                    formatNumber(gltf.geometry?.estimatedTriangles),
                    formatNumber(gltf.counts?.primitives),
                    formatNumber(gltf.counts?.usedMaterials || gltf.counts?.materials),
                    compression,
                    asset.flags.join(', ')
                ];
            })
        ));
    } else {
        lines.push('No GLB assets were found in compile diagnostics.');
    }

    lines.push('');
    lines.push('## First Actions');
    lines.push('');
    topGlbs.slice(0, 3).forEach((asset, index) => {
        const fileName = path.basename(normalizeUrlPath(asset.url));
        lines.push(`${index + 1}. ${fileName}: ${asset.recommendations.join(' ')}`);
    });
    if (!topGlbs.length) {
        lines.push('1. Capture a profile with compile diagnostics before selecting asset actions.');
    }

    if (largeMedia.length) {
        lines.push('');
        lines.push('## Large Non-GLB Media');
        lines.push('');
        lines.push(markdownTable(
            ['Asset', 'Type', 'Size', 'Flags'],
            largeMedia.map((asset) => [
                path.basename(normalizeUrlPath(asset.url)),
                asset.type,
                asset.sizeLabel || formatBytes(asset.sizeBytes || 0),
                asset.flags.join(', ')
            ])
        ));
    }

    lines.push('');
    lines.push('## Notes');
    lines.push('');
    lines.push('- This audit is read-only and does not rewrite uploads.');
    lines.push('- HTTP gzip/Brotli can reduce transfer size, but it does not reduce GPU memory, triangles, draw calls, or material/program switches.');
    lines.push('- Lossless-ish derivative steps are prune, dedupe, and mesh compression. Visual-changing steps such as decimation, texture resize, material merge, and LOD selection need explicit thresholds and visual checks.');

    return `${lines.join('\n')}\n`;
}

function printSummary(audit) {
    const summary = audit.summary;
    console.log(`VRodos asset audit: ${summary.profileUrl || audit.profilePath}`);
    console.log(`GLBs: ${summary.assets.glbCount}, estimated triangles: ${formatNumber(summary.assets.estimatedGlbTriangles)}, GLB size: ${summary.assets.totalGlbSizeLabel}`);
    const top = audit.glbAssets.slice().sort((a, b) => glbSortScore(b) - glbSortScore(a)).slice(0, 5);
    top.forEach((asset, index) => {
        const gltf = asset.gltf || {};
        console.log(`${index + 1}. ${path.basename(normalizeUrlPath(asset.url))}: ${asset.sizeLabel || formatBytes(asset.sizeBytes || asset.localSizeBytes || 0)}, ${formatNumber(gltf.geometry?.estimatedTriangles)} tris, flags: ${asset.flags.join(', ') || 'none'}`);
    });
    console.log(`JSON written to ${audit.outputPath}`);
    console.log(`Markdown written to ${audit.markdownPath}`);
}

async function run() {
    const options = parseArgs(process.argv.slice(2));
    const profile = JSON.parse(await readFile(options.profile, 'utf8'));
    const diagnostics = profile.scene?.compileDiagnostics || profile.sceneBefore?.compileDiagnostics || {};
    const assets = Array.isArray(diagnostics.assets) ? diagnostics.assets : [];
    const warnings = Array.isArray(diagnostics.warnings) ? diagnostics.warnings : [];
    const urlCounts = countBy(assets, (asset) => asset.url);
    const glbSourceAssets = assets.filter(isGlbAsset);
    const mediaSourceAssets = assets.filter((asset) => !isGlbAsset(asset));

    const glbAssets = [];
    for (const asset of glbSourceAssets) {
        glbAssets.push(await auditGlbAsset(asset, options.wordpressRoot, urlCounts.get(asset.url) || 1, warnings));
    }

    const mediaAssets = mediaSourceAssets.map((asset) => auditNonGlbAsset(asset, urlCounts.get(asset.url) || 1, warnings));
    const audit = {
        generatedAt: new Date().toISOString(),
        profilePath: options.profile,
        outputPath: options.output,
        markdownPath: options.markdown,
        wordpressRoot: options.wordpressRoot,
        summary: summarizeAudit(profile, glbAssets, mediaAssets),
        glbAssets,
        mediaAssets
    };

    await mkdir(path.dirname(options.output), { recursive: true });
    await writeFile(options.output, `${JSON.stringify(audit, null, 2)}\n`, 'utf8');
    await mkdir(path.dirname(options.markdown), { recursive: true });
    await writeFile(options.markdown, renderMarkdown(audit), 'utf8');

    if (options.json) {
        console.log(JSON.stringify(audit, null, 2));
    } else {
        printSummary(audit);
    }
}

run().catch((error) => {
    console.error(error.stack || error.message || String(error));
    process.exit(1);
});
