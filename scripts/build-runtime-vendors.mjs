import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { syncAframeRuntimeArtifact } from './build/aframe-artifact.mjs';
import { buildBrowserBundle } from './build/esbuild-helpers.mjs';
import { validateRuntimePackageVersions } from './build/package-provenance.mjs';
import {
  fromPluginRoot,
  runtimeLibraryDir,
  toPluginRelative,
  toPosixPath
} from './build/paths.mjs';
import { assertReadable } from './build/runtime-manifest-validator.mjs';
import {
  browserVendorAssets,
  createRuntimeVersionManifest,
  decoderAssets,
  packageModulePath,
  requiredStaticAssets,
  runtimeVersionManifestPath,
  takramAssetCopies,
  threeRuntimeConfig,
  vendorArtifacts
} from './build/vendor-catalog.mjs';
import {
  createTakramAtmosphereMoonShaderPatchPlugin,
  createTakramCloudsShaderPatchPlugin,
  createThreeClassicLoaderUrlPatchPlugin,
  rewriteTakramCloudBundleAssetDefaults
} from './build/vendor-patches.mjs';

const entry = (name) => fromPluginRoot(`scripts/build/entries/${name}.mjs`);
const artifactPath = (artifactId) => fromPluginRoot(vendorArtifacts[artifactId].bundlePath);
const threeOutputDir = fromPluginRoot(`assets/vendor/${threeRuntimeConfig.vendorDir}`);

async function copyDeclaredAsset(asset) {
  const sourcePath = fromPluginRoot(asset.source);
  const destinationPath = fromPluginRoot(asset.destination);
  await assertReadable(sourcePath, asset.label);
  await mkdir(asset.recursive ? destinationPath : path.dirname(destinationPath), { recursive: true });
  await cp(sourcePath, destinationPath, {
    recursive: Boolean(asset.recursive),
    force: true
  });
}

async function copySupportAssets() {
  for (const asset of requiredStaticAssets) {
    await assertReadable(fromPluginRoot(asset.path), asset.label);
  }
  for (const asset of [...decoderAssets, ...takramAssetCopies]) {
    await copyDeclaredAsset(asset);
  }
}

async function copyBrowserVendorAssets() {
  for (const asset of browserVendorAssets) {
    const sourcePath = packageModulePath(asset.packageName, asset.source);
    const destinationPath = fromPluginRoot(asset.destination);
    await assertReadable(sourcePath, `${asset.packageName} browser asset`);
    await mkdir(path.dirname(destinationPath), { recursive: true });
    await cp(sourcePath, destinationPath, { force: true });
  }
}

async function buildThreeBundle() {
  await rm(threeOutputDir, { recursive: true, force: true });
  await mkdir(threeOutputDir, { recursive: true });
  await buildBrowserBundle({
    entryPoint: entry('three-vendor'),
    outfile: artifactPath('three'),
    plugins: [createThreeClassicLoaderUrlPatchPlugin()]
  });
}

async function buildThreeAddonsBundle() {
  await buildBrowserBundle({
    entryPoint: entry('three-addons'),
    outfile: artifactPath('threeAddons'),
    virtualModules: {
      three: {
        globalExpression: 'window.THREE || (window.AFRAME && window.AFRAME.THREE) || {}'
      }
    }
  });
}

async function buildPostprocessingBundle() {
  await buildBrowserBundle({
    entryPoint: entry('postprocessing'),
    outfile: artifactPath('postprocessing'),
    virtualModules: {
      three: {
        globalExpression: 'window.THREE || {}'
      }
    }
  });
}

async function buildTakramAtmosphereBundle() {
  await buildBrowserBundle({
    entryPoint: entry('takram-atmosphere'),
    outfile: artifactPath('takramAtmosphere'),
    plugins: [createTakramAtmosphereMoonShaderPatchPlugin()],
    virtualModules: {
      three: {
        globalExpression: 'window.THREE || {}'
      },
      postprocessing: {
        globalExpression: 'window.POSTPROCESSING || {}'
      }
    }
  });
}

function takramGeospatialVirtualSource() {
  const publicEntry = toPosixPath(fileURLToPath(import.meta.resolve('@takram/three-geospatial')));
  return `export {
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
} from ${JSON.stringify(publicEntry)};
`;
}

async function buildTakramCloudsBundle() {
  const bundlePath = artifactPath('takramClouds');
  await buildBrowserBundle({
    entryPoint: entry('takram-clouds'),
    outfile: bundlePath,
    loader: {
      '.frag': 'text',
      '.vert': 'text',
      '.glsl': 'text'
    },
    plugins: [createTakramCloudsShaderPatchPlugin()],
    virtualModules: {
      three: {
        globalExpression: 'window.THREE || {}'
      },
      postprocessing: {
        globalExpression: 'window.POSTPROCESSING || {}'
      },
      '@takram/three-atmosphere': {
        globalExpression: 'window.VRODOS_TAKRAM_ATMOSPHERE || {}'
      },
      '@takram/three-geospatial': {
        source: takramGeospatialVirtualSource()
      }
    }
  });
  await rewriteTakramCloudBundleAssetDefaults(bundlePath);
}

async function buildCollisionBvhBundle() {
  await buildBrowserBundle({
    entryPoint: entry('collision-bvh'),
    outfile: artifactPath('collisionBvh'),
    virtualModules: {
      three: {
        globalExpression: 'window.THREE || {}'
      }
    }
  });
}

async function buildStatsGlBundle() {
  const outputPath = artifactPath('statsGl');
  await rm(path.dirname(outputPath), { recursive: true, force: true });
  await mkdir(path.dirname(outputPath), { recursive: true });
  await buildBrowserBundle({
    entryPoint: entry('stats-gl'),
    outfile: outputPath,
    format: 'esm',
    target: ['es2020']
  });
}

async function writeRuntimeVersionManifest(aframeArtifact) {
  const manifest = createRuntimeVersionManifest(aframeArtifact);
  await writeFile(runtimeVersionManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

async function main() {
  await validateRuntimePackageVersions();
  const aframeArtifact = await syncAframeRuntimeArtifact();

  await mkdir(runtimeLibraryDir, { recursive: true });
  await buildThreeBundle();
  await buildThreeAddonsBundle();
  await buildPostprocessingBundle();
  await buildTakramAtmosphereBundle();
  await buildTakramCloudsBundle();
  await buildCollisionBvhBundle();
  await copySupportAssets();
  await buildStatsGlBundle();
  await copyBrowserVendorAssets();
  await writeRuntimeVersionManifest(aframeArtifact);

  for (const artifactId of [
    'three',
    'threeAddons',
    'postprocessing',
    'takramAtmosphere',
    'takramClouds',
    'collisionBvh',
    'statsGl'
  ]) {
    console.log(`Built ${toPluginRelative(artifactPath(artifactId))}`);
  }
  console.log(`Verified ${vendorArtifacts.aframe.bundlePath} (${aframeArtifact.sha256})`);
  console.log(`Wrote ${toPluginRelative(runtimeVersionManifestPath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
