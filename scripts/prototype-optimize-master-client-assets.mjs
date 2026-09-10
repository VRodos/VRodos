#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { link, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRDracoMeshCompression } from '@gltf-transform/extensions';
import { dedup, draco, meshopt, prune, simplify, textureCompress, weld } from '@gltf-transform/functions';
import { Mode, toktx } from '@gltf-transform/cli';
import draco3d from 'draco3dgltf';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';

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
const execFileAsync = promisify(execFile);

function parseArgs(argv) {
    const options = {
        audit: defaultAuditPath,
        outputDir: defaultOutputDir,
        manifest: '',
        markdown: '',
        source: '',
        sourceUrl: '',
        outputFile: '',
        progressFile: '',
        sourceSha256: '',
        jobKey: '',
        queuedAt: '',
        preparedBaseline: '',
        preparedAnalysis: '',
        writePreparedBaseline: false,
        profile: 'safe-draco',
        limit: 3,
        include: '',
        protectGeometry: false,
        textureMaxSize: 0,
        uastcZstdLevel: 9,
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
            case '--source':
                options.source = nextValue() || '';
                break;
            case '--source-url':
                options.sourceUrl = nextValue() || '';
                break;
            case '--output-file':
                options.outputFile = nextValue() || '';
                break;
            case '--progress-file':
                options.progressFile = nextValue() || '';
                break;
            case '--source-sha256':
                options.sourceSha256 = String(nextValue() || '').toLowerCase();
                break;
            case '--job-key':
                options.jobKey = String(nextValue() || '');
                break;
            case '--queued-at':
                options.queuedAt = String(nextValue() || '');
                break;
            case '--prepared-baseline':
                options.preparedBaseline = nextValue() || '';
                break;
            case '--prepared-analysis':
                options.preparedAnalysis = nextValue() || '';
                break;
            case '--write-prepared-baseline':
                options.writePreparedBaseline = true;
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
            case '--protect-geometry':
                options.protectGeometry = true;
                break;
            case '--texture-max-size':
                options.textureMaxSize = Math.max(0, Math.floor(nextNumber(0)));
                break;
            case '--uastc-zstd-level':
                options.uastcZstdLevel = Math.max(1, Math.min(22, Math.floor(nextNumber(9))));
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
    options.source = options.source ? path.resolve(options.source) : '';
    options.outputFile = options.outputFile ? path.resolve(options.outputFile) : '';
    options.progressFile = options.progressFile ? path.resolve(options.progressFile) : '';
    options.preparedBaseline = options.preparedBaseline ? path.resolve(options.preparedBaseline) : '';
    options.preparedAnalysis = options.preparedAnalysis ? path.resolve(options.preparedAnalysis) : '';

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
  --source PATH           Optimize one local GLB instead of selecting assets from an audit.
  --source-url URL        Source URL metadata to record with --source.
  --output-file PATH      Exact derivative GLB path for --source mode.
  --progress-file PATH    Optional private JSON file for atomic optimizer progress updates.
  --source-sha256 HASH    Expected source content hash supplied by the owning queue.
  --job-key KEY           Immutable queue identity recorded in progress and reports.
  --queued-at ISO_TIME     Queue timestamp used to record worker waiting time.
  --prepared-baseline P   Reuse a source-hash-scoped prune/dedup GLB when available.
  --prepared-analysis P   Analysis metadata paired with --prepared-baseline.
  --write-prepared-baseline  Persist the common stage for following family profiles.
  --profile NAME          safe-draco, safe-meshopt, editor-preview, web-high, web-medium, or web-low.
  --protect-geometry      Skip weld/simplify for collision or navigation geometry.
  --texture-max-size N    Override the web profile texture cap in pixels.
  --uastc-zstd-level N    Benchmark override for UASTC Zstd; production defaults to 9.
  --limit N               Number of top GLBs to process. Default: 3.
  --include REGEX         Only process assets whose URL or filename matches.
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

function parseGlb(buffer, filePath) {
    if (buffer.length < 20 || buffer.toString('utf8', 0, 4) !== GLB_MAGIC) {
        throw new Error(`${filePath} is not a GLB file.`);
    }

    const version = buffer.readUInt32LE(4);
    if (version !== GLB_VERSION) {
        throw new Error(`${filePath} is GLB version ${version}; only GLB v2 is supported.`);
    }

    const declaredLength = buffer.readUInt32LE(8);
    let offset = 12;
    let gltf = null;
    let binary = null;
    while (offset + 8 <= buffer.length && offset < declaredLength) {
        const chunkLength = buffer.readUInt32LE(offset);
        const chunkType = buffer.readUInt32LE(offset + 4);
        const chunkStart = offset + 8;
        const chunkEnd = chunkStart + chunkLength;
        if (chunkEnd > buffer.length) {
            throw new Error(`${filePath} has a malformed GLB chunk.`);
        }
        if (chunkType === GLB_JSON_CHUNK) {
            gltf = JSON.parse(buffer.toString('utf8', chunkStart, chunkEnd).trim());
        } else if (chunkType === 0x004e4942) {
            binary = buffer.subarray(chunkStart, chunkEnd);
        }
        offset = chunkEnd;
    }
    if (!gltf) throw new Error(`${filePath} does not contain a JSON chunk.`);
    return { gltf, binary };
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
    const skins = Array.isArray(gltf.skins) ? gltf.skins : [];
    const extensions = extensionSet(gltf);
    const usedMaterials = new Set();
    let primitiveCount = 0;
    let vertexCount = 0;
    let submittedVertexCount = 0;
    let estimatedTriangles = 0;
    let morphTargetPrimitiveCount = 0;

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
            if (Array.isArray(primitive.targets) && primitive.targets.length) morphTargetPrimitiveCount += 1;
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
        protectedGeometry: {
            hasSkins: skins.length > 0,
            hasMorphTargets: morphTargetPrimitiveCount > 0,
            morphTargetPrimitiveCount
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
    return analyzeGlbBuffer(buffer, filePath);
}

async function analyzeGlbBuffer(buffer, filePath) {
    const parsed = parseGlb(buffer, filePath);
    const analysis = analyzeGltf(parsed.gltf);
    analysis.textureMemory = await estimateTextureMemory(parsed.gltf, parsed.binary);
    return analysis;
}

async function estimateTextureMemory(gltf, binary) {
    const images = Array.isArray(gltf.images) ? gltf.images : [];
    const bufferViews = Array.isArray(gltf.bufferViews) ? gltf.bufferViews : [];
    let estimatedBytes = 0;
    let accountedImages = 0;
    let maxWidth = 0;
    let maxHeight = 0;
    for (const image of images) {
        const view = Number.isInteger(image.bufferView) ? bufferViews[image.bufferView] : null;
        if (!view || !binary) continue;
        const start = Number(view.byteOffset || 0);
        const bytes = binary.subarray(start, start + Number(view.byteLength || 0));
        let width = 0;
        let height = 0;
        let gpuBytesPerPixel = 4;
        if (image.mimeType === 'image/ktx2' && bytes.length >= 44) {
            width = bytes.readUInt32LE(20);
            height = bytes.readUInt32LE(24);
            gpuBytesPerPixel = 1;
        } else {
            try {
                const metadata = await sharp(bytes).metadata();
                width = Number(metadata.width || 0);
                height = Number(metadata.height || 0);
            } catch (error) {
                continue;
            }
        }
        if (width > 0 && height > 0) {
            estimatedBytes += Math.ceil(width * height * gpuBytesPerPixel * 4 / 3);
            accountedImages += 1;
            maxWidth = Math.max(maxWidth, width);
            maxHeight = Math.max(maxHeight, height);
        }
    }
    return {
        estimatedMipmappedBytes: estimatedBytes,
        estimatedMipmappedMiB: Number((estimatedBytes / (1024 * 1024)).toFixed(2)),
        accountedImages,
        unaccountedImages: Math.max(0, images.length - accountedImages),
        maxWidth,
        maxHeight
    };
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
    if (options.source) {
        if (!existsSync(options.source)) {
            throw new Error(`Source GLB does not exist: ${options.source}`);
        }

        return [{
            url: options.sourceUrl || options.source,
            localPath: options.source,
            context: 'single-source',
            flags: [],
            exists: true
        }];
    }

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

let optimizerIOPromise = null;

function createOptimizerIO() {
    if (!optimizerIOPromise) {
        optimizerIOPromise = Promise.all([
            draco3d.createDecoderModule(),
            draco3d.createEncoderModule(),
            MeshoptDecoder.ready,
            MeshoptEncoder.ready,
            MeshoptSimplifier.ready
        ]).then(([dracoDecoder, dracoEncoder]) => new NodeIO()
            .registerExtensions(ALL_EXTENSIONS)
            .registerDependencies({
                'draco3d.decoder': dracoDecoder,
                'draco3d.encoder': dracoEncoder,
                'meshopt.decoder': MeshoptDecoder,
                'meshopt.encoder': MeshoptEncoder
            }));
    }
    return optimizerIOPromise;
}

async function atomicWriteFile(targetPath, data) {
    const temporaryPath = `${targetPath}.${process.pid}.tmp`;
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(temporaryPath, data);
    await atomicReplaceTemporary(temporaryPath, targetPath);
}

async function atomicReplaceTemporary(temporaryPath, targetPath) {
    try {
        await rename(temporaryPath, targetPath);
    } catch (error) {
        if (process.platform !== 'win32') throw error;
        await rm(targetPath, { force: true });
        await rename(temporaryPath, targetPath);
    }
}

async function atomicLinkOrWrite(sourcePath, targetPath, fallbackData) {
    const temporaryPath = `${targetPath}.${process.pid}.tmp`;
    await mkdir(path.dirname(targetPath), { recursive: true });
    await rm(temporaryPath, { force: true });
    try {
        await link(sourcePath, temporaryPath);
        await atomicReplaceTemporary(temporaryPath, targetPath);
    } catch (error) {
        await rm(temporaryPath, { force: true });
        await atomicWriteFile(targetPath, fallbackData);
    }
}

function sourceDigest(buffer) {
    return createHash('sha256').update(buffer).digest('hex');
}

function isWebProfile(profile) {
    return profile === 'web-low' || profile === 'web-medium' || profile === 'web-high';
}

function webProfileTextureCap(profile, override) {
    return override || (profile === 'web-low' ? 1024 : (profile === 'web-medium' ? 2048 : 4096));
}

function selectKtxJobs(analysis) {
    const textureMemory = analysis?.textureMemory || {};
    const maxDimension = Math.max(Number(textureMemory.maxWidth || 0), Number(textureMemory.maxHeight || 0));
    const estimatedBytes = Number(textureMemory.estimatedMipmappedBytes || 0);
    if (maxDimension > 4096 || estimatedBytes > 512 * 1024 * 1024) {
        return 1;
    }
    const available = typeof os.availableParallelism === 'function' ? os.availableParallelism() : (os.cpus().length || 1);
    const imageCount = Math.max(1, Number(analysis?.counts?.images || 1));
    const estimatedWorkingSetPerJob = Math.max(256 * 1024 * 1024, Math.ceil(estimatedBytes / imageCount) * 3);
    const memoryBound = Math.max(1, Math.floor(os.freemem() / estimatedWorkingSetPerJob));
    return Math.max(1, Math.min(4, available, memoryBound));
}

function systemCpuSnapshot() {
    return os.cpus().reduce((snapshot, cpu) => {
        const times = cpu.times || {};
        const total = Object.values(times).reduce((sum, value) => sum + Number(value || 0), 0);
        snapshot.idle += Number(times.idle || 0);
        snapshot.total += total;
        return snapshot;
    }, { idle: 0, total: 0 });
}

function systemCpuUtilization(start, end) {
    const total = end.total - start.total;
    const idle = end.idle - start.idle;
    return total > 0 ? Number(((total - idle) * 100 / total).toFixed(1)) : 0;
}

function documentResourceCounts(document) {
    const root = document.getRoot();
    return {
        accessors: root.listAccessors().length,
        animations: root.listAnimations().length,
        buffers: root.listBuffers().length,
        cameras: root.listCameras().length,
        materials: root.listMaterials().length,
        meshes: root.listMeshes().length,
        nodes: root.listNodes().length,
        scenes: root.listScenes().length,
        skins: root.listSkins().length,
        textures: root.listTextures().length
    };
}

function standardTextureCoordinateSnapshot(document) {
    const coordinates = new Map();
    for (const material of document.getRoot().listMaterials()) {
        for (const info of [
            material.getBaseColorTextureInfo(),
            material.getMetallicRoughnessTextureInfo(),
            material.getNormalTextureInfo(),
            material.getOcclusionTextureInfo(),
            material.getEmissiveTextureInfo()
        ]) {
            if (info) coordinates.set(info, info.getTexCoord());
        }
    }
    return coordinates;
}

function preparationMutationsAreNoops(events, textureCoordinates) {
    return events.every((event) => event.type === 'node:change' &&
        event.attribute === 'texCoord' &&
        textureCoordinates.has(event.target) &&
        textureCoordinates.get(event.target) === event.target.getTexCoord());
}

function configureDracoWithoutWeld(document) {
    if (document.hasExtension('KHR_mesh_primitive_restart')) {
        throw new Error('draco: Missing support for KHR_mesh_primitive_restart.');
    }
    let indexedPrimitiveCount = 0;
    for (const mesh of document.getRoot().listMeshes()) {
        for (const primitive of mesh.listPrimitives()) {
            if (primitive.getIndices() || primitive.getMode() !== TRIANGLES_MODE) continue;
            const position = primitive.getAttribute('POSITION');
            const vertexCount = position?.getCount() || 0;
            if (vertexCount <= 0) continue;
            const indices = vertexCount <= 65536 ? new Uint16Array(vertexCount) : new Uint32Array(vertexCount);
            for (let index = 0; index < vertexCount; index += 1) indices[index] = index;
            primitive.setIndices(document.createAccessor()
                .setType('SCALAR')
                .setArray(indices)
                .setBuffer(position.getBuffer()));
            indexedPrimitiveCount += 1;
        }
    }
    document
        .createExtension(KHRDracoMeshCompression)
        .setRequired(true)
        .setEncoderOptions({
            method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,
            encodeSpeed: 5,
            decodeSpeed: 5,
            quantizationBits: {
                POSITION: 14,
                NORMAL: 10,
                COLOR: 8,
                TEX_COORD: 12,
                GENERIC: 12
            },
            quantizationVolume: 'mesh'
        });
    return indexedPrimitiveCount;
}

async function normalizeUnsupportedTextures(document) {
    let converted = 0;
    for (const texture of document.getRoot().listTextures()) {
        const mimeType = texture.getMimeType();
        if (mimeType === 'image/png' || mimeType === 'image/jpeg' || mimeType === 'image/ktx2') continue;
        const image = texture.getImage();
        if (!image) continue;
        texture.setImage(await sharp(image, { limitInputPixels: false }).png().toBuffer());
        texture.setMimeType('image/png');
        if (texture.getURI()) texture.setURI(`${path.parse(texture.getURI()).name}.png`);
        converted += 1;
    }
    return converted;
}

const DATA_TEXTURE_SLOTS = /(?:normalTexture|occlusionTexture|metallicRoughnessTexture|clearcoatTexture|clearcoatRoughnessTexture|clearcoatNormalTexture|transmissionTexture|thicknessTexture|specularTexture|iridescenceTexture|iridescenceThicknessTexture|anisotropyTexture)/;
const COLOR_TEXTURE_SLOTS = /(?:baseColorTexture|emissiveTexture|sheenColorTexture|specularColorTexture)/;

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

function progressStepLabel(command) {
    const labels = {
        prune: 'Removing unused data',
        dedup: 'Deduplicating data',
        weld: 'Welding geometry',
        simplify: 'Simplifying geometry',
        png: 'Converting source textures',
        resize: 'Resizing textures',
        uastc: 'Compressing material textures (UASTC)',
        etc1s: 'Compressing color textures (ETC1S)',
        draco: 'Compressing geometry (Draco)',
        meshopt: 'Compressing geometry (Meshopt)'
    };
    return labels[command] || `Running ${command}`;
}

async function writeOptimizerProgress(options, sourcePath, progress) {
    if (!options.progressFile) {
        return;
    }

    const payload = {
        schemaVersion: 1,
        sourcePath,
        profile: options.profile,
        jobKey: options.jobKey || '',
        status: progress.status || 'running',
        step: Math.max(0, Number(progress.step) || 0),
        totalSteps: Math.max(0, Number(progress.totalSteps) || 0),
        percent: Math.max(0, Math.min(100, Number(progress.percent) || 0)),
        message: String(progress.message || 'Preparing optimizer'),
        updatedAt: new Date().toISOString()
    };
    const tempPath = `${options.progressFile}.${process.pid}.tmp`;
    await mkdir(path.dirname(options.progressFile), { recursive: true });
    await writeFile(tempPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    try {
        await rename(tempPath, options.progressFile);
    } catch (error) {
        if (process.platform !== 'win32') {
            throw error;
        }
        await rm(options.progressFile, { force: true });
        await rename(tempPath, options.progressFile);
    }
}

async function optimizeAsset(asset, index, options) {
    const workerStartedAt = Date.now();
    const systemCpuStartedAt = systemCpuSnapshot();
    const sourcePath = path.resolve(asset.localPath);
    const fileName = path.basename(normalizeUrlPath(asset.url || sourcePath));
    const slug = `${String(index + 1).padStart(2, '0')}-${slugify(fileName)}`;
    const derivativePath = options.outputFile || path.join(options.outputDir, `${slug}.${options.profile}.glb`);
    const sourceSizeBytes = asset.localSizeBytes || asset.sizeBytes || await getFileSize(sourcePath);
    let progressStep = 1;
    let progressTotalSteps = 0;
    let progressPercent = 0;
    await writeOptimizerProgress(options, sourcePath, {
        status: 'running',
        step: progressStep,
        totalSteps: progressTotalSteps,
        percent: progressPercent,
        message: 'Analyzing source asset'
    });

    if (!['safe-draco', 'safe-meshopt', 'editor-preview', 'web-high', 'web-medium', 'web-low'].includes(options.profile)) {
        const message = `Unknown optimization profile "${options.profile}".`;
        await writeOptimizerProgress(options, sourcePath, { status: 'failed', step: 1, totalSteps: 1, percent: 0, message });
        throw new Error(message);
    }

    const io = await createOptimizerIO();
    let sourceBuffer = null;
    let inputBuffer = null;
    let original = asset.gltf || null;
    let sourceSha256 = options.sourceSha256;
    let reusedPreparedBaseline = false;

    if ((isWebProfile(options.profile) || options.profile === 'editor-preview') && options.preparedBaseline && options.preparedAnalysis && existsSync(options.preparedBaseline) && existsSync(options.preparedAnalysis)) {
        try {
            const prepared = JSON.parse(await readFile(options.preparedAnalysis, 'utf8'));
            if (prepared.schemaVersion === 2 && prepared.sourceSha256 && (!sourceSha256 || prepared.sourceSha256 === sourceSha256)) {
                const candidateBuffer = await readFile(options.preparedBaseline);
                if (prepared.preparedSha256 && sourceDigest(candidateBuffer) === prepared.preparedSha256) {
                    inputBuffer = candidateBuffer;
                    original = prepared.original;
                    sourceSha256 = prepared.sourceSha256;
                    reusedPreparedBaseline = true;
                }
            }
        } catch (error) {
            inputBuffer = null;
            original = asset.gltf || null;
        }
    }

    if (!inputBuffer) {
        sourceBuffer = await readFile(sourcePath);
        const actualSourceSha256 = sourceDigest(sourceBuffer);
        if (sourceSha256 && sourceSha256 !== actualSourceSha256) {
            throw new Error('Source GLB changed after this optimization job was queued.');
        }
        sourceSha256 = actualSourceSha256;
        inputBuffer = sourceBuffer;
        original = original || await analyzeGlbBuffer(sourceBuffer, sourcePath);
    }

    const document = await io.readBinary(new Uint8Array(inputBuffer));
    const initialResourceCounts = documentResourceCounts(document);
    const initialTextureCoordinates = standardTextureCoordinateSnapshot(document);
    const preparationMutations = [];
    let stopTrackingPreparation = () => {};
    if (options.writePreparedBaseline && !reusedPreparedBaseline) {
        const graph = document.getGraph();
        const trackPreparationMutation = (event) => { preparationMutations.push(event); };
        for (const eventName of ['node:create', 'node:change', 'node:dispose']) {
            graph.addEventListener(eventName, trackPreparationMutation);
        }
        stopTrackingPreparation = () => {
            for (const eventName of ['node:create', 'node:change', 'node:dispose']) {
                graph.removeEventListener(eventName, trackPreparationMutation);
            }
        };
    }
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
        original,
        derivative: null,
        commands: [],
        stageTimings: [],
        sourceSha256,
        jobKey: options.jobKey || '',
        reusedPreparedBaseline,
        status: options.dryRun ? 'dry-run' : 'pending',
        error: null,
        runtimeSubstitutionReady: false,
        runtimeNotes: []
    };

    const sourceAnalysis = record.original;
    const protectedByContent = Boolean(sourceAnalysis?.protectedGeometry?.hasSkins || sourceAnalysis?.protectedGeometry?.hasMorphTargets);
    const protectGeometry = Boolean(options.protectGeometry || protectedByContent || options.profile === 'web-high');
    record.profileOptions = {
        protectGeometry,
        protectedByContent,
        textureMaxSize: isWebProfile(options.profile) ? webProfileTextureCap(options.profile, options.textureMaxSize) : null,
        ktxJobs: isWebProfile(options.profile) ? selectKtxJobs(original) : 0,
        uastcLevel: isWebProfile(options.profile) ? 2 : null,
        uastcZstdLevel: isWebProfile(options.profile) ? options.uastcZstdLevel : null,
        etc1sQuality: options.profile === 'web-low' ? 96 : (isWebProfile(options.profile) ? 128 : null)
    };

    if (options.profile === 'safe-meshopt') {
        record.runtimeNotes.push('Requires EXT_meshopt_compression decoder wiring before compile-time substitution.');
    }
    if (options.profile === 'safe-draco') {
        record.runtimeNotes.push('Requires compiled runtime/A-Frame GLTFLoader Draco decoder wiring verification before compile-time substitution.');
    }
    if (options.profile === 'editor-preview') {
        record.runtimeNotes.push('Editor-only preview derivative. Do not enable for compiled-scene substitution.');
        record.runtimeNotes.push(protectGeometry
            ? 'Geometry simplification was skipped to protect collision/navigation, skinning, or morph targets; textures are resized without Draco compression.'
            : 'Uses geometry simplification and texture resize without Draco compression to avoid editor decode stalls.');
    }
    if (options.profile.startsWith('web-')) {
        record.runtimeNotes.push('Compiled web runtime derivative; source upload is untouched.');
        if (protectGeometry) record.runtimeNotes.push('Geometry simplification was skipped to protect collision/navigation, skinning, or morph targets.');
    } else {
        record.runtimeNotes.push('Derivative is for prototype review only; source upload is untouched.');
    }

    if (options.dryRun) {
        await writeOptimizerProgress(options, sourcePath, {
            status: 'ready',
            step: 1,
            totalSteps: 1,
            percent: 100,
            message: 'Dry run complete'
        });
        return record;
    }

    await mkdir(path.dirname(derivativePath), { recursive: true });
    sharp.simd(true);
    sharp.concurrency(Math.max(1, Math.min(4, typeof os.availableParallelism === 'function' ? os.availableParallelism() : (os.cpus().length || 1))));

    const operations = [];
    if (!reusedPreparedBaseline) {
        operations.push({
            id: 'prune',
            label: 'Removing unused data',
            run: () => document.transform(prune({ keepLeaves: true, keepSolidTextures: true }))
        });
        operations.push({
            id: 'dedup',
            label: 'Deduplicating data',
            run: () => document.transform(dedup())
        });
        if (options.writePreparedBaseline && options.preparedBaseline && options.preparedAnalysis) {
            operations.push({
                id: 'prepared-baseline',
                label: 'Saving reusable preparation stage',
                run: async () => {
                    const preparedResourceCounts = documentResourceCounts(document);
                    stopTrackingPreparation();
                    const reusedSourceBytes = Boolean(sourceBuffer &&
                        preparationMutationsAreNoops(preparationMutations, initialTextureCoordinates));
                    const preparedBinary = reusedSourceBytes ? sourceBuffer : Buffer.from(await io.writeBinary(document));
                    if (reusedSourceBytes) {
                        await atomicLinkOrWrite(sourcePath, options.preparedBaseline, preparedBinary);
                    } else {
                        await atomicWriteFile(options.preparedBaseline, preparedBinary);
                    }
                    await atomicWriteFile(options.preparedAnalysis, `${JSON.stringify({
                        schemaVersion: 2,
                        sourcePath,
                        sourceSha256,
                        preparedSha256: sourceDigest(preparedBinary),
                        original,
                        reusedSourceBytes,
                        preparationMutationCount: preparationMutations.length,
                        initialResourceCounts,
                        resourceCounts: preparedResourceCounts,
                        createdAt: new Date().toISOString()
                    }, null, 2)}\n`);
                    record.preparedBaselineReusedSourceBytes = reusedSourceBytes;
                }
            });
        }
    }

    if ((options.profile === 'editor-preview' || options.profile === 'web-low' || options.profile === 'web-medium') && !protectGeometry) {
        const ratio = options.profile === 'editor-preview' ? 0.35 : (options.profile === 'web-low' ? 0.5 : 0.8);
        const error = options.profile === 'web-medium' ? 0.005 : 0.01;
        operations.push({ id: 'weld', label: 'Welding visual geometry', run: () => document.transform(weld()) });
        operations.push({
            id: 'simplify',
            label: 'Simplifying visual geometry',
            run: () => document.transform(simplify({ simplifier: MeshoptSimplifier, ratio, error, lockBorder: true }))
        });
    }

    if (options.profile === 'editor-preview') {
        operations.push({
            id: 'resize',
            label: 'Resizing preview textures',
            run: () => document.transform(textureCompress({ encoder: sharp, resize: [1024, 1024], limitInputPixels: false }))
        });
    }

    if (isWebProfile(options.profile)) {
        const textureMaxSize = record.profileOptions.textureMaxSize;
        const jobs = record.profileOptions.ktxJobs;
        operations.push({ id: 'normalize-textures', label: 'Normalizing source textures', run: () => normalizeUnsupportedTextures(document) });
        operations.push({
            id: 'uastc',
            label: 'Compressing material textures (UASTC)',
            run: () => document.transform(toktx({
                encoder: sharp,
                resize: [textureMaxSize, textureMaxSize],
                mode: Mode.UASTC,
                slots: DATA_TEXTURE_SLOTS,
                level: 2,
                zstd: record.profileOptions.uastcZstdLevel,
                jobs,
                limitInputPixels: false
            }))
        });
        operations.push({
            id: 'etc1s',
            label: 'Compressing color textures (ETC1S)',
            run: async () => {
                await document.transform(toktx({
                    encoder: sharp,
                    resize: [textureMaxSize, textureMaxSize],
                    mode: Mode.ETC1S,
                    slots: COLOR_TEXTURE_SLOTS,
                    quality: options.profile === 'web-low' ? 96 : 128,
                    jobs,
                    limitInputPixels: false
                }));
                if (document.getRoot().listTextures().some((texture) => texture.getMimeType() !== 'image/ktx2')) {
                    await document.transform(toktx({
                        encoder: sharp,
                        resize: [textureMaxSize, textureMaxSize],
                        mode: Mode.UASTC,
                        level: 2,
                        zstd: record.profileOptions.uastcZstdLevel,
                        jobs,
                        limitInputPixels: false
                    }));
                }
            }
        });
    }

    const canPreserveSourceDraco = Boolean(sourceAnalysis?.extensions?.hasDraco && protectGeometry);
    record.profileOptions.preservedSourceDraco = canPreserveSourceDraco;
    if (options.profile === 'safe-meshopt') {
        operations.push({ id: 'meshopt', label: 'Compressing geometry (Meshopt)', run: () => document.transform(meshopt({ encoder: MeshoptEncoder, level: 'medium' })) });
    } else if (options.profile !== 'editor-preview' && protectGeometry && !canPreserveSourceDraco) {
        operations.push({
            id: 'draco',
            label: 'Compressing geometry (Draco)',
            run: () => {
                record.profileOptions.identityIndexedPrimitives = configureDracoWithoutWeld(document);
            }
        });
    } else if (options.profile !== 'editor-preview' && !canPreserveSourceDraco) {
        operations.push({ id: 'draco', label: 'Compressing geometry (Draco)', run: () => document.transform(draco({ method: 'edgebreaker' })) });
    } else if (canPreserveSourceDraco) {
        record.runtimeNotes.push('The source Draco extension is retained without an extra weld pass because protected geometry is unchanged.');
    }

    let derivativeBuffer = null;
    operations.push({
        id: 'serialize',
        label: 'Writing optimized asset',
        run: async () => {
            derivativeBuffer = Buffer.from(await io.writeBinary(document));
            await atomicWriteFile(derivativePath, derivativeBuffer);
        }
    });

    try {
        const totalSteps = operations.length + 2;
        progressTotalSteps = totalSteps;
        progressPercent = Math.round(100 / totalSteps);
        await writeOptimizerProgress(options, sourcePath, {
            status: 'running',
            step: progressStep,
            totalSteps,
            percent: progressPercent,
            message: 'Source analysis complete'
        });
        for (let stepIndex = 0; stepIndex < operations.length; stepIndex += 1) {
            const operation = operations[stepIndex];
            const step = stepIndex + 2;
            progressStep = step;
            progressPercent = Math.round(((step - 1) / totalSteps) * 100);
            await writeOptimizerProgress(options, sourcePath, {
                status: 'running',
                step,
                totalSteps,
                percent: progressPercent,
                message: operation.label
            });
            const stageStartedAt = Date.now();
            const cpuStartedAt = process.cpuUsage();
            await operation.run();
            const cpu = process.cpuUsage(cpuStartedAt);
            const timing = {
                stage: operation.id,
                durationMs: Date.now() - stageStartedAt,
                cpuUserMs: Math.round(cpu.user / 1000),
                cpuSystemMs: Math.round(cpu.system / 1000),
                maxRssBytes: process.resourceUsage().maxRSS * 1024
            };
            record.stageTimings.push(timing);
            record.commands.push(timing);
        }

        progressStep = totalSteps;
        progressPercent = Math.round(((totalSteps - 1) / totalSteps) * 100);
        await writeOptimizerProgress(options, sourcePath, {
            status: 'running',
            step: totalSteps,
            totalSteps,
            percent: progressPercent,
            message: 'Validating optimized asset'
        });
        if (!derivativeBuffer) throw new Error('Optimizer did not serialize a derivative GLB.');
        const parsedDerivative = parseGlb(derivativeBuffer, derivativePath);
        record.derivativeSizeBytes = derivativeBuffer.byteLength;
        record.derivativeSizeLabel = formatBytes(record.derivativeSizeBytes);
        const delta = reduction(sourceSizeBytes, record.derivativeSizeBytes);
        record.reductionBytes = delta.bytes;
        record.reductionPercent = delta.percent;
        record.derivative = analyzeGltf(parsedDerivative.gltf);
        record.derivative.textureMemory = await estimateTextureMemory(parsedDerivative.gltf, parsedDerivative.binary);
        const hasSourceTextures = Number(record.original?.counts?.images || 0) > 0;
        const uncompressedTextures = document.getRoot().listTextures().filter((texture) => texture.getMimeType() !== 'image/ktx2').length;
        record.runtimeSubstitutionReady = record.derivative.extensions.hasDraco &&
            (!isWebProfile(options.profile) || !hasSourceTextures || (record.derivative.extensions.hasKtx2 && uncompressedTextures === 0));
        record.performance = {
            totalDurationMs: record.stageTimings.reduce((total, stage) => total + stage.durationMs, 0),
            maxRssBytes: process.resourceUsage().maxRSS * 1024,
            cpuUserMs: record.stageTimings.reduce((total, stage) => total + stage.cpuUserMs, 0),
            cpuSystemMs: record.stageTimings.reduce((total, stage) => total + stage.cpuSystemMs, 0),
            queueWaitMs: options.queuedAt && Number.isFinite(Date.parse(options.queuedAt))
                ? Math.max(0, workerStartedAt - Date.parse(options.queuedAt))
                : null,
            ktxJobs: record.profileOptions.ktxJobs,
            sharpSimd: sharp.simd(),
            sharpConcurrency: sharp.concurrency(),
            encoderVersions: options.encoderVersions
        };
        const totalCpuMs = record.performance.cpuUserMs + record.performance.cpuSystemMs;
        record.performance.nodeCpuUtilizationPercent = record.performance.totalDurationMs > 0
            ? Number((totalCpuMs * 100 / record.performance.totalDurationMs).toFixed(1))
            : 0;
        record.performance.systemCpuUtilizationPercent = systemCpuUtilization(systemCpuStartedAt, systemCpuSnapshot());
        record.status = 'done';
        await writeOptimizerProgress(options, sourcePath, {
            status: 'ready',
            step: totalSteps,
            totalSteps,
            percent: 100,
            message: 'Web derivative is ready'
        });

        return record;
    } catch (error) {
        record.status = 'error';
        record.error = error && error.message ? error.message : String(error);
        await writeOptimizerProgress(options, sourcePath, {
            status: 'failed',
            step: progressStep,
            totalSteps: progressTotalSteps,
            percent: progressPercent,
            message: record.error
        });
        return record;
    }
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

async function getToolVersion() {
    const packagePath = path.join(pluginRoot, 'node_modules', '@gltf-transform', 'cli', 'package.json');
    const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
    return String(packageJson.version || '');
}

async function getEncoderVersions(gltfTransformVersion) {
    let ktxSoftware = 'unavailable';
    try {
        const result = await execFileAsync('ktx', ['--version'], { windowsHide: true, timeout: 10000 });
        ktxSoftware = String(result.stdout || result.stderr || '').trim().split(/\r?\n/, 1)[0] || 'available';
    } catch (error) {
        ktxSoftware = 'unavailable';
    }
    return {
        gltfTransform: gltfTransformVersion,
        sharp: String(sharp.versions?.sharp || ''),
        libvips: String(sharp.versions?.vips || ''),
        ktxSoftware
    };
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
    const audit = options.source ? { glbAssets: [] } : JSON.parse(await readFile(options.audit, 'utf8'));
    const selectedAssets = selectAssets(audit, options);
    const toolVersion = await getToolVersion();
    options.encoderVersions = await getEncoderVersions(toolVersion);
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
            command: 'programmatic NodeIO pipeline',
            baseArgs: [],
            version: toolVersion
        },
        encoderVersions: options.encoderVersions,
        selection: {
            limit: options.limit,
            include: options.include || null,
            selectedCount: selectedAssets.length
        },
        assets: []
    };

    for (let index = 0; index < selectedAssets.length; index += 1) {
        manifest.assets.push(await optimizeAsset(selectedAssets[index], index, options));
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
