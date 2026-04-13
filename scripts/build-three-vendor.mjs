import { mkdir, rm, writeFile, cp, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import {
  THREE_VENDOR_DIR,
  THREE_VENDOR_BUNDLE_FILE,
  THREE_VENDOR_BUILD_ENTRY_FILE
} from './three-vendor.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'js_libs', THREE_VENDOR_DIR);
const bundlePath = path.join(outputDir, THREE_VENDOR_BUNDLE_FILE);
const dracoSourceDir = path.join(rootDir, 'node_modules', 'three', 'examples', 'jsm', 'libs', 'draco');
const dracoOutputDir = path.join(outputDir, 'draco');
const fontSourcePath = path.join(rootDir, 'node_modules', 'three', 'examples', 'fonts', 'helvetiker_bold.typeface.json');
const fontOutputDir = path.join(outputDir, 'fonts');
const fontOutputPath = path.join(fontOutputDir, 'helvetiker_bold.typeface.json');
const tempEntryPath = path.join(rootDir, 'scripts', THREE_VENDOR_BUILD_ENTRY_FILE);
const runtimeVendorDir = path.join(rootDir, 'runtime', 'assets', 'js', 'master', 'lib');
const takramBundlePath = path.join(runtimeVendorDir, 'vrodos-takram-atmosphere.bundle.js');
const takramEntryPath = path.join(rootDir, 'scripts', '.tmp-build-takram-atmosphere-entry.mjs');
const threeShimPath = path.join(rootDir, 'scripts', '.tmp-three-global-shim.mjs');
const postprocessingShimPath = path.join(rootDir, 'scripts', '.tmp-postprocessing-global-shim.mjs');

const bundleEntrySource = `
import * as THREEBase from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
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
import { N8AOPostPass } from 'n8ao';

const THREE = window.THREE && typeof window.THREE === 'object' ? window.THREE : {};

Object.assign(THREE, { ...THREEBase }, {
  OrbitControls,
  TransformControls,
  PointerLockControls,
  GLTFLoader,
  DRACOLoader,
  HDRLoader,
  // Temporary compatibility alias during the r181 migration window.
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
window.N8AOPostPass = N8AOPostPass;
`;

async function ensurePathExists(targetPath, label) {
  try {
    await access(targetPath);
  } catch {
    throw new Error(`${label} is missing at ${targetPath}. Run npm install first.`);
  }
}

async function copySupportAssets() {
  await ensurePathExists(dracoSourceDir, 'Draco decoder assets');
  await ensurePathExists(fontSourcePath, 'Helvetiker font asset');

  await mkdir(dracoOutputDir, { recursive: true });
  await mkdir(fontOutputDir, { recursive: true });
  await cp(dracoSourceDir, dracoOutputDir, { recursive: true, force: true });
  await cp(fontSourcePath, fontOutputPath, { force: true });
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

async function buildTakramAtmosphereBundle() {
  await mkdir(runtimeVendorDir, { recursive: true });
  await writeGlobalShim('three', 'window.THREE || {}', threeShimPath);
  await writeGlobalShim('postprocessing', 'window.POSTPROCESSING || {}', postprocessingShimPath);

  const entrySource = `
import * as VRODOSTakramAtmosphere from '@takram/three-atmosphere';
window.VRODOS_TAKRAM_ATMOSPHERE = VRODOSTakramAtmosphere;
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

async function main() {
  await buildBundle();
  await buildTakramAtmosphereBundle();
  await copySupportAssets();
  console.log(`Built ${path.relative(rootDir, bundlePath)}`);
  console.log(`Built ${path.relative(rootDir, takramBundlePath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
