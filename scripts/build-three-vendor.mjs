import { mkdir, rm, writeFile, cp, access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import {
  RUNTIME_MANIFEST_FILE,
  THREE_VENDOR_BUILD_ENTRY_FILE,
  getLockedPackageVersion,
  getPackageRuntimeConfig,
  getThreeRuntimeConfig
} from './three-vendor.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
const threeRuntimeConfig = getThreeRuntimeConfig();
const outputDir = path.join(rootDir, 'assets', 'vendor', threeRuntimeConfig.vendorDir);
const bundlePath = path.join(outputDir, threeRuntimeConfig.bundleFile);
const dracoSourceDir = path.join(rootDir, 'node_modules', 'three', 'examples', 'jsm', 'libs', 'draco');
const dracoOutputDir = path.join(outputDir, 'draco');
const basisSourceDir = path.join(rootDir, 'node_modules', 'three', 'examples', 'jsm', 'libs', 'basis');
const basisOutputDir = path.join(outputDir, 'basis');
const meshoptSourcePath = path.join(rootDir, 'node_modules', 'meshoptimizer', 'meshopt_decoder.cjs');
const meshoptOutputDir = path.join(outputDir, 'meshopt');
const meshoptOutputPath = path.join(meshoptOutputDir, 'meshopt_decoder.js');
const meshoptCompatOutputPath = path.join(meshoptOutputDir, 'meshopt_decoder.module.js');
const fontSourcePath = path.join(rootDir, 'node_modules', 'three', 'examples', 'fonts', 'helvetiker_bold.typeface.json');
const fontOutputDir = path.join(outputDir, 'fonts');
const fontOutputPath = path.join(fontOutputDir, 'helvetiker_bold.typeface.json');
const tempEntryPath = path.join(rootDir, 'scripts', THREE_VENDOR_BUILD_ENTRY_FILE);
const runtimeVendorDir = path.join(rootDir, 'assets', 'js', 'runtime', 'master', 'lib');
const threeAddonsRuntimeBundlePath = path.join(runtimeVendorDir, 'vrodos-three-addons.bundle.js');
const threeAddonsRuntimeEntryPath = path.join(rootDir, 'scripts', '.tmp-build-three-addons-runtime-entry.mjs');
const postprocessingRuntimeBundlePath = path.join(runtimeVendorDir, 'vrodos-postprocessing.bundle.js');
const postprocessingRuntimeEntryPath = path.join(rootDir, 'scripts', '.tmp-build-postprocessing-runtime-entry.mjs');
const takramBundlePath = path.join(runtimeVendorDir, 'vrodos-takram-atmosphere.bundle.js');
const takramEntryPath = path.join(rootDir, 'scripts', '.tmp-build-takram-atmosphere-entry.mjs');
const takramAssetsSourceDir = path.join(rootDir, 'node_modules', '@takram', 'three-atmosphere', 'assets');
const takramStarsSourcePath = path.join(takramAssetsSourceDir, 'stars.bin');
const takramAssetsOutputDir = path.join(rootDir, 'assets', 'vendor', 'takram-atmosphere');
const takramStarsOutputPath = path.join(takramAssetsOutputDir, 'stars.bin');
const takramCloudsBundlePath = path.join(runtimeVendorDir, 'vrodos-takram-clouds.bundle.js');
const takramCloudsEntryPath = path.join(rootDir, 'scripts', '.tmp-build-takram-clouds-entry.mjs');
const takramAtmosphereShimPath = path.join(rootDir, 'scripts', '.tmp-takram-atmosphere-global-shim.mjs');
const takramGeospatialShimPath = path.join(rootDir, 'scripts', '.tmp-takram-geospatial-clouds-shim.mjs');
const takramCloudsAssetsSourceDir = path.join(rootDir, 'node_modules', '@takram', 'three-clouds', 'assets');
const takramCloudsAssetsOutputDir = path.join(rootDir, 'assets', 'vendor', 'takram-clouds');
const takramCloudAssetFiles = [
  'local_weather.png',
  'shape.bin',
  'shape_detail.bin',
  'turbulence.png',
];
const takramStbnOutputPath = path.join(takramCloudsAssetsOutputDir, 'stbn.bin');
const collisionBvhBundlePath = path.join(runtimeVendorDir, 'vrodos-collision-bvh.bundle.js');
const collisionBvhEntryPath = path.join(rootDir, 'scripts', '.tmp-build-collision-bvh-entry.mjs');
const threeShimPath = path.join(rootDir, 'scripts', '.tmp-three-global-shim.mjs');
const postprocessingShimPath = path.join(rootDir, 'scripts', '.tmp-postprocessing-global-shim.mjs');
const manifestPath = path.join(rootDir, 'assets', RUNTIME_MANIFEST_FILE);
const runtimeConfig = getPackageRuntimeConfig();
const aframeConfig = runtimeConfig.aframe ?? {};

const requiredPackages = [
  'three',
  'postprocessing',
  '@takram/three-atmosphere',
  '@takram/three-geospatial-effects',
  '@takram/three-clouds',
  'three-mesh-bvh',
];

const bundleEntrySource = `
import * as THREEBase from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

// pmndrs/postprocessing pipeline (Phase 1 of POSTPROCESSING_MIGRATION_PLAN.md).
// Bundled alongside the legacy three/examples postprocessing helpers above so
// the new pmndrs runtime module can be enabled without a second bundle load.
//
// NOTE: realism-effects is intentionally NOT bundled. Its latest release
// (1.1.2, last published 2022) imports the removed-in-r162 symbol
// WebGLMultipleRenderTargets from three, which makes it hard-incompatible with
// our current baseline. pmndrs/postprocessing 6.x has also dropped SSR and
// TAA from its core, so the new pipeline simply does not provide SSR/TRAA;
// scenes that need those stay on the legacy vrodos_postprocessing.js path.
// See POSTPROCESSING_MIGRATION_PLAN.md sections 9 and 11 for details.
import * as POSTPROCESSING from 'postprocessing';

const THREE = window.THREE && typeof window.THREE === 'object' ? window.THREE : {};

Object.assign(THREE, { ...THREEBase }, {
  OrbitControls,
  TransformControls,
  PointerLockControls,
  GLTFLoader,
  DRACOLoader,
  HDRLoader,
  KTX2Loader,
  MeshoptDecoder,
  // Compatibility alias for older VRodos editor/runtime code paths.
  RGBELoader: HDRLoader,
  CSS2DRenderer,
  CSS2DObject,
  EffectComposer,
  RenderPass,
  ShaderPass,
  OutlinePass,
  FXAAShader,
  FontLoader,
  TextGeometry,
});

window.THREE = THREE;
window.Stats = Stats;
window.POSTPROCESSING = POSTPROCESSING;
`;

async function ensurePathExists(targetPath, label) {
  try {
    await access(targetPath);
  } catch {
    throw new Error(`${label} is missing at ${targetPath}. Run npm install first.`);
  }
}

function getDeclaredDependency(packageName) {
  return packageJson.dependencies?.[packageName] ?? packageJson.devDependencies?.[packageName] ?? null;
}

function parseSemver(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) {
    throw new Error(`Unsupported semver value: ${version}`);
  }

  return match.slice(1).map((part) => Number(part));
}

function versionSatisfiesDeclaration(version, declaration) {
  if (!declaration) {
    return false;
  }

  const npmAliasMatch = /^npm:(?:@[^/]+\/[^@]+|[^@]+)@(.+)$/.exec(declaration);
  if (npmAliasMatch) {
    return versionSatisfiesDeclaration(version, npmAliasMatch[1]);
  }

  if (declaration.startsWith('^')) {
    const [declaredMajor, declaredMinor, declaredPatch] = parseSemver(declaration.slice(1));
    const [actualMajor, actualMinor, actualPatch] = parseSemver(version);

    if (declaredMajor === 0) {
      return actualMajor === 0 && actualMinor === declaredMinor && actualPatch >= declaredPatch;
    }

    return actualMajor === declaredMajor;
  }

  if (declaration.startsWith('~')) {
    const [declaredMajor, declaredMinor, declaredPatch] = parseSemver(declaration.slice(1));
    const [actualMajor, actualMinor, actualPatch] = parseSemver(version);
    return actualMajor === declaredMajor && actualMinor === declaredMinor && actualPatch >= declaredPatch;
  }

  return declaration === version;
}

function validateRuntimeVersions() {
  for (const packageName of requiredPackages) {
    const declaration = getDeclaredDependency(packageName);
    const lockedVersion = getLockedPackageVersion(packageName);

    if (!declaration) {
      throw new Error(`Missing ${packageName} in root package.json dependencies.`);
    }

    if (!versionSatisfiesDeclaration(lockedVersion, declaration)) {
      throw new Error(
        `${packageName}@${lockedVersion} from package-lock.json does not satisfy package.json declaration ${declaration}.`
      );
    }
  }

  if (!aframeConfig.label || !aframeConfig.source) {
    throw new Error('Missing vrodos.runtime.aframe metadata in package.json.');
  }

  resolveAframeRuntimeUrl();
}

function resolveAframeRuntimeUrl() {
  if (aframeConfig.url) {
    return aframeConfig.url;
  }

  if (aframeConfig.source === 'cdn-master' && aframeConfig.commit) {
    return `https://cdn.jsdelivr.net/gh/aframevr/aframe@${aframeConfig.commit}/dist/aframe-master.min.js`;
  }

  if (aframeConfig.source === 'cdn-release' && aframeConfig.version) {
    return `https://aframe.io/releases/${aframeConfig.version}/aframe.min.js`;
  }

  throw new Error('Unable to resolve A-Frame runtime URL from vrodos.runtime.aframe metadata.');
}

async function copySupportAssets() {
  await ensurePathExists(dracoSourceDir, 'Draco decoder assets');
  await ensurePathExists(basisSourceDir, 'Basis/KTX2 transcoder assets');
  await ensurePathExists(meshoptSourcePath, 'Meshopt decoder asset');
  await ensurePathExists(fontSourcePath, 'Helvetiker font asset');
  await ensurePathExists(takramStarsSourcePath, 'Takram stars data asset');
  for (const assetFile of takramCloudAssetFiles) {
    await ensurePathExists(path.join(takramCloudsAssetsSourceDir, assetFile), `Takram cloud ${assetFile} asset`);
  }

  await mkdir(dracoOutputDir, { recursive: true });
  await mkdir(basisOutputDir, { recursive: true });
  await mkdir(meshoptOutputDir, { recursive: true });
  await mkdir(fontOutputDir, { recursive: true });
  await mkdir(takramAssetsOutputDir, { recursive: true });
  await mkdir(takramCloudsAssetsOutputDir, { recursive: true });
  await ensurePathExists(takramStbnOutputPath, 'Takram cloud STBN data asset');
  await cp(dracoSourceDir, dracoOutputDir, { recursive: true, force: true });
  await cp(basisSourceDir, basisOutputDir, { recursive: true, force: true });
  await cp(meshoptSourcePath, meshoptOutputPath, { force: true });
  await cp(meshoptSourcePath, meshoptCompatOutputPath, { force: true });
  await cp(fontSourcePath, fontOutputPath, { force: true });
  await cp(takramStarsSourcePath, takramStarsOutputPath, { force: true });
  for (const assetFile of takramCloudAssetFiles) {
    await cp(
      path.join(takramCloudsAssetsSourceDir, assetFile),
      path.join(takramCloudsAssetsOutputDir, assetFile),
      { force: true }
    );
  }
}

function createAliasPlugin(aliases) {
  return {
    name: 'vrodos-alias-plugin',
    setup(buildContext) {
      Object.entries(aliases).forEach(([filterValue, replacementPath]) => {
        buildContext.onResolve({ filter: new RegExp(`^${filterValue.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`) }, () => ({
          path: replacementPath
        }));
      });
    }
  };
}

function createGlobalShimSource(globalExpression, exportNames) {
  const safeNames = exportNames.filter((name) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name));
  const exportLines = safeNames
    .map((name) => `export const ${name} = moduleValue[${JSON.stringify(name)}];`)
    .join('\n');

  return `const moduleValue = ${globalExpression};\nexport default moduleValue;\n${exportLines}\n`;
}

async function writeGlobalShim(moduleName, globalExpression, outputPath) {
  const importedModule = await import(moduleName);
  const exportNames = Object.keys(importedModule).filter((name) => name !== 'default');
  const source = createGlobalShimSource(globalExpression, exportNames);
  await writeFile(outputPath, source, 'utf8');
}

async function buildBundle() {
  await mkdir(outputDir, { recursive: true });
  await writeFile(tempEntryPath, bundleEntrySource, 'utf8');

  try {
    await build({
      entryPoints: [tempEntryPath],
      bundle: true,
      format: 'iife',
      platform: 'browser',
      target: ['es2019'],
      outfile: bundlePath,
      legalComments: 'none'
    });
  } finally {
    await rm(tempEntryPath, { force: true });
  }
}

async function buildThreeAddonsRuntimeBundle() {
  await mkdir(runtimeVendorDir, { recursive: true });
  await writeGlobalShim('three', 'window.THREE || (window.AFRAME && window.AFRAME.THREE) || {}', threeShimPath);

  const entrySource = `
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

const THREE = window.THREE || (window.AFRAME && window.AFRAME.THREE) || {};
THREE.HDRLoader = HDRLoader;
THREE.RGBELoader = RGBELoader || HDRLoader;
window.THREE = THREE;
window.VRODOS_THREE_ADDONS = {
  HDRLoader,
  RGBELoader: THREE.RGBELoader
};
`;

  await writeFile(threeAddonsRuntimeEntryPath, entrySource, 'utf8');

  try {
    await build({
      entryPoints: [threeAddonsRuntimeEntryPath],
      bundle: true,
      format: 'iife',
      platform: 'browser',
      target: ['es2019'],
      outfile: threeAddonsRuntimeBundlePath,
      legalComments: 'none',
      plugins: [
        createAliasPlugin({
          three: threeShimPath
        })
      ]
    });
  } finally {
    await rm(threeAddonsRuntimeEntryPath, { force: true });
    await rm(threeShimPath, { force: true });
  }
}

async function buildPostprocessingRuntimeBundle() {
  await mkdir(runtimeVendorDir, { recursive: true });
  await writeGlobalShim('three', 'window.THREE || {}', threeShimPath);

const entrySource = `
import * as POSTPROCESSING from 'postprocessing';

window.POSTPROCESSING = POSTPROCESSING;
`;

  await writeFile(postprocessingRuntimeEntryPath, entrySource, 'utf8');

  try {
    await build({
      entryPoints: [postprocessingRuntimeEntryPath],
      bundle: true,
      format: 'iife',
      platform: 'browser',
      target: ['es2019'],
      outfile: postprocessingRuntimeBundlePath,
      legalComments: 'none',
      plugins: [
        createAliasPlugin({
          three: threeShimPath
        })
      ]
    });
  } finally {
    await rm(postprocessingRuntimeEntryPath, { force: true });
    await rm(threeShimPath, { force: true });
  }
}

async function buildTakramAtmosphereBundle() {
  await mkdir(runtimeVendorDir, { recursive: true });
  await writeGlobalShim('three', 'window.THREE || {}', threeShimPath);
  await writeGlobalShim('postprocessing', 'window.POSTPROCESSING || {}', postprocessingShimPath);

  const entrySource = `
import * as VRODOSTakramAtmosphere from '@takram/three-atmosphere';
import * as VRODOSTakramEffects from '@takram/three-geospatial-effects';
window.VRODOS_TAKRAM_ATMOSPHERE = Object.assign({}, VRODOSTakramAtmosphere, VRODOSTakramEffects);
window.VRODOS_TAKRAM_EFFECTS = VRODOSTakramEffects;
`;

  await writeFile(takramEntryPath, entrySource, 'utf8');

  try {
    await build({
      entryPoints: [takramEntryPath],
      bundle: true,
      format: 'iife',
      platform: 'browser',
      target: ['es2019'],
      outfile: takramBundlePath,
      legalComments: 'none',
      plugins: [
        createAliasPlugin({
          three: threeShimPath,
          postprocessing: postprocessingShimPath
        })
      ]
    });
  } finally {
    await rm(takramEntryPath, { force: true });
    await rm(threeShimPath, { force: true });
    await rm(postprocessingShimPath, { force: true });
  }
}

async function rewriteTakramCloudBundleAssetDefaults() {
  const source = await readFile(takramCloudsBundlePath, 'utf8');
  const rewritten = source
    .replace(
      /`https:\/\/media\.githubusercontent\.com\/media\/takram-design-engineering\/three-geospatial\/\$\{[^}]+\}\/packages\/core\/assets\/stbn\.bin`/g,
      "'assets/vendor/takram-clouds/stbn.bin'"
    )
    .replace(
      /`https:\/\/media\.githubusercontent\.com\/media\/takram-design-engineering\/three-geospatial\/\$\{[^}]+\}\/packages\/clouds\/assets\/local_weather\.png`/g,
      "'assets/vendor/takram-clouds/local_weather.png'"
    )
    .replace(
      /`https:\/\/media\.githubusercontent\.com\/media\/takram-design-engineering\/three-geospatial\/\$\{[^}]+\}\/packages\/clouds\/assets\/shape\.bin`/g,
      "'assets/vendor/takram-clouds/shape.bin'"
    )
    .replace(
      /`https:\/\/media\.githubusercontent\.com\/media\/takram-design-engineering\/three-geospatial\/\$\{[^}]+\}\/packages\/clouds\/assets\/shape_detail\.bin`/g,
      "'assets/vendor/takram-clouds/shape_detail.bin'"
    )
    .replace(
      /`https:\/\/media\.githubusercontent\.com\/media\/takram-design-engineering\/three-geospatial\/\$\{[^}]+\}\/packages\/clouds\/assets\/turbulence\.png`/g,
      "'assets/vendor/takram-clouds/turbulence.png'"
    );

  if (rewritten !== source) {
    await writeFile(takramCloudsBundlePath, rewritten, 'utf8');
  }
}

async function buildTakramCloudsBundle() {
  await mkdir(runtimeVendorDir, { recursive: true });
  await writeGlobalShim('three', 'window.THREE || {}', threeShimPath);
  await writeGlobalShim('postprocessing', 'window.POSTPROCESSING || {}', postprocessingShimPath);
  await writeGlobalShim('@takram/three-atmosphere', 'window.VRODOS_TAKRAM_ATMOSPHERE || {}', takramAtmosphereShimPath);
  await writeFile(takramGeospatialShimPath, `
export {
  Geodetic,
  define,
  defineExpression,
  defineFloat,
  defineInt,
  definePropertyShorthand,
  defineUniformShorthand,
  lerp,
  reinterpretType,
  resolveIncludes,
  unrollLoops
} from '../node_modules/@takram/three-geospatial/build/index.js';
export const UniformMap = Map;
`, 'utf8');

  const entrySource = `
import {
  C as CLOUD_SHAPE_TEXTURE_SIZE,
  a as CLOUD_SHAPE_DETAIL_TEXTURE_SIZE,
  b as CloudLayer,
  c as CloudLayers,
  d as CloudsEffect
} from '../node_modules/@takram/three-clouds/build/shared.js';
import {
  ByteType,
  FileLoader,
  FloatType,
  HalfFloatType,
  IntType,
  LinearFilter,
  Loader,
  RGBAFormat,
  ShortType,
  UnsignedByteType,
  UnsignedIntType,
  UnsignedShortType
} from 'three';

function parseUint8Array(buffer) {
  return new Uint8Array(buffer);
}

function getTextureDataType(array) {
  if (array instanceof Int8Array) return ByteType;
  if (array instanceof Uint8Array || array instanceof Uint8ClampedArray) return UnsignedByteType;
  if (array instanceof Int16Array) return ShortType;
  if (array instanceof Uint16Array) return UnsignedShortType;
  if (array instanceof Int32Array) return IntType;
  if (array instanceof Uint32Array) return UnsignedIntType;
  if (array instanceof Float32Array || array instanceof Float64Array) return FloatType;
  if (typeof Float16Array !== 'undefined' && array instanceof Float16Array) return HalfFloatType;
  return UnsignedByteType;
}

class DataTextureLoader extends Loader {
  constructor(textureClass, parser, options = {}, manager) {
    super(manager);
    this.textureClass = textureClass;
    this.parser = parser;
    this.options = {
      format: RGBAFormat,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      ...options
    };
  }

  load(url, onLoad, onProgress, onError) {
    const texture = new this.textureClass();
    const loader = new FileLoader(this.manager);
    loader.setRequestHeader(this.requestHeader);
    loader.setPath(this.path);
    loader.setWithCredentials(this.withCredentials);
    loader.setResponseType('arraybuffer');
    loader.load(url, (buffer) => {
      const array = this.parser(buffer);
      texture.image.data = array;
      const { width, height, depth, ...options } = this.options;
      if (width != null) texture.image.width = width;
      if (height != null) texture.image.height = height;
      if (texture.image && 'depth' in texture.image && depth != null) {
        texture.image.depth = depth;
      }
      texture.type = getTextureDataType(array);
      Object.assign(texture, options);
      texture.needsUpdate = true;
      if (typeof onLoad === 'function') onLoad(texture);
    }, onProgress, onError);
    return texture;
  }
}

window.VRODOS_TAKRAM_CLOUDS = {
  CloudsEffect,
  CloudLayer,
  CloudLayers,
  CLOUD_SHAPE_TEXTURE_SIZE,
  CLOUD_SHAPE_DETAIL_TEXTURE_SIZE,
  DataTextureLoader,
  parseUint8Array,
  STBN_TEXTURE_WIDTH: 128,
  STBN_TEXTURE_HEIGHT: 128,
  STBN_TEXTURE_DEPTH: 64
};
`;

  await writeFile(takramCloudsEntryPath, entrySource, 'utf8');

  try {
    await build({
      entryPoints: [takramCloudsEntryPath],
      bundle: true,
      format: 'iife',
      platform: 'browser',
      target: ['es2019'],
      outfile: takramCloudsBundlePath,
      legalComments: 'none',
      loader: {
        '.frag': 'text',
        '.vert': 'text',
        '.glsl': 'text'
      },
      plugins: [
        createAliasPlugin({
          three: threeShimPath,
          postprocessing: postprocessingShimPath,
          '@takram/three-atmosphere': takramAtmosphereShimPath,
          '@takram/three-geospatial': takramGeospatialShimPath
        })
      ]
    });
    await rewriteTakramCloudBundleAssetDefaults();
  } finally {
    await rm(takramCloudsEntryPath, { force: true });
    await rm(threeShimPath, { force: true });
    await rm(postprocessingShimPath, { force: true });
    await rm(takramAtmosphereShimPath, { force: true });
    await rm(takramGeospatialShimPath, { force: true });
  }
}

async function buildCollisionBvhBundle() {
  await mkdir(runtimeVendorDir, { recursive: true });
  await writeGlobalShim('three', 'window.THREE || {}', threeShimPath);

  const entrySource = `
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';

window.VRODOS_COLLISION_BVH = {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree
};
`;

  await writeFile(collisionBvhEntryPath, entrySource, 'utf8');

  try {
    await build({
      entryPoints: [collisionBvhEntryPath],
      bundle: true,
      format: 'iife',
      platform: 'browser',
      target: ['es2019'],
      outfile: collisionBvhBundlePath,
      legalComments: 'none',
      plugins: [
        createAliasPlugin({
          three: threeShimPath
        })
      ]
    });
  } finally {
    await rm(collisionBvhEntryPath, { force: true });
    await rm(threeShimPath, { force: true });
  }
}

async function writeRuntimeManifest() {
  const postprocessingVersion = getLockedPackageVersion('postprocessing');
  const takramAtmosphereVersion = getLockedPackageVersion('@takram/three-atmosphere');
  const takramCloudsVersion = getLockedPackageVersion('@takram/three-clouds');
  const takramEffectsVersion = getLockedPackageVersion('@takram/three-geospatial-effects');
  const collisionBvhVersion = getLockedPackageVersion('three-mesh-bvh');

  const manifest = {
    schemaVersion: 1,
    generatedBy: 'scripts/build-three-vendor.mjs',
    aframe: {
      label: aframeConfig.label,
      source: aframeConfig.source,
      version: aframeConfig.version ?? '',
      commit: aframeConfig.commit ?? '',
      url: resolveAframeRuntimeUrl(),
    },
    three: {
      version: threeRuntimeConfig.version,
      revision: threeRuntimeConfig.revision,
      vendorDir: threeRuntimeConfig.vendorDir,
      bundleFile: threeRuntimeConfig.bundleFile,
      bundlePath: `assets/vendor/${threeRuntimeConfig.vendorDir}/${threeRuntimeConfig.bundleFile}`,
      decoders: {
        dracoDecoderPath: `assets/vendor/${threeRuntimeConfig.vendorDir}/draco/gltf/`,
        basisTranscoderPath: `assets/vendor/${threeRuntimeConfig.vendorDir}/basis/`,
        meshoptDecoderPath: `assets/vendor/${threeRuntimeConfig.vendorDir}/meshopt/meshopt_decoder.js`,
      },
    },
    threeAddons: {
      global: 'VRODOS_THREE_ADDONS',
      bundleFile: path.basename(threeAddonsRuntimeBundlePath),
      bundlePath: 'assets/js/runtime/master/lib/vrodos-three-addons.bundle.js',
    },
    postprocessing: {
      version: postprocessingVersion,
      global: 'POSTPROCESSING',
      bundleFile: path.basename(postprocessingRuntimeBundlePath),
      bundlePath: 'assets/js/runtime/master/lib/vrodos-postprocessing.bundle.js',
    },
    takram: {
      atmosphereVersion: takramAtmosphereVersion,
      cloudsVersion: takramCloudsVersion,
      effectsVersion: takramEffectsVersion,
      global: 'VRODOS_TAKRAM_ATMOSPHERE',
      bundleFile: path.basename(takramBundlePath),
      bundlePath: 'assets/js/runtime/master/lib/vrodos-takram-atmosphere.bundle.js',
      cloudsGlobal: 'VRODOS_TAKRAM_CLOUDS',
      cloudsBundleFile: path.basename(takramCloudsBundlePath),
      cloudsBundlePath: 'assets/js/runtime/master/lib/vrodos-takram-clouds.bundle.js',
      starsDataPath: 'assets/vendor/takram-atmosphere/stars.bin',
      assets: {
        starsDataPath: 'assets/vendor/takram-atmosphere/stars.bin',
        cloudsBasePath: 'assets/vendor/takram-clouds/',
        cloudsLocalWeatherPath: 'assets/vendor/takram-clouds/local_weather.png',
        cloudsShapePath: 'assets/vendor/takram-clouds/shape.bin',
        cloudsShapeDetailPath: 'assets/vendor/takram-clouds/shape_detail.bin',
        cloudsTurbulencePath: 'assets/vendor/takram-clouds/turbulence.png',
        cloudsStbnPath: 'assets/vendor/takram-clouds/stbn.bin',
      },
    },
    collisionBvh: {
      version: collisionBvhVersion,
      global: 'VRODOS_COLLISION_BVH',
      bundleFile: path.basename(collisionBvhBundlePath),
      bundlePath: 'assets/js/runtime/master/lib/vrodos-collision-bvh.bundle.js',
    },
  };

  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

async function main() {
  validateRuntimeVersions();
  await buildBundle();
  await buildThreeAddonsRuntimeBundle();
  await buildPostprocessingRuntimeBundle();
  await buildTakramAtmosphereBundle();
  await buildTakramCloudsBundle();
  await buildCollisionBvhBundle();
  await copySupportAssets();
  await writeRuntimeManifest();
  console.log(`Built ${path.relative(rootDir, bundlePath)}`);
  console.log(`Built ${path.relative(rootDir, threeAddonsRuntimeBundlePath)}`);
  console.log(`Built ${path.relative(rootDir, postprocessingRuntimeBundlePath)}`);
  console.log(`Built ${path.relative(rootDir, takramBundlePath)}`);
  console.log(`Built ${path.relative(rootDir, takramCloudsBundlePath)}`);
  console.log(`Built ${path.relative(rootDir, collisionBvhBundlePath)}`);
  console.log(`Wrote ${path.relative(rootDir, manifestPath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
