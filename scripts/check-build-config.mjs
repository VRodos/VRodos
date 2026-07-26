import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { inspectLocalAframeArtifact } from './build/aframe-artifact.mjs';
import { validateRuntimePackageVersions } from './build/package-provenance.mjs';
import {
  createRuntimeBuildManifest,
  runtimeBuildManifestPath
} from './build/runtime-chunks.mjs';
import { fromPluginRoot } from './build/paths.mjs';
import { assertReadable, validateRuntimeBuildManifest } from './build/runtime-manifest-validator.mjs';
import {
  browserVendorAssets,
  createRuntimeVersionManifest,
  decoderAssets,
  packageJson,
  requiredStaticAssets,
  runtimeVersionManifestPath,
  takramAssetCopies,
  vendorArtifacts
} from './build/vendor-catalog.mjs';

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function runtimeVersionArtifactPaths(manifest) {
  return [
    manifest.aframe.bundlePath,
    manifest.three.bundlePath,
    manifest.threeAddons.bundlePath,
    manifest.postprocessing.bundlePath,
    manifest.takram.bundlePath,
    manifest.takram.cloudsBundlePath,
    manifest.collisionBvh.bundlePath,
    manifest.three.decoders.dracoDecoderPath,
    manifest.three.decoders.basisTranscoderPath,
    manifest.three.decoders.meshoptDecoderPath,
    ...Object.values(manifest.takram.assets),
    ...Object.values(manifest.browserLibraries.files)
  ];
}

async function assertNoTemporaryBuildFiles() {
  const scriptEntries = await readdir(fromPluginRoot('scripts'), { withFileTypes: true });
  const temporaryFiles = scriptEntries
    .filter((entry) => entry.isFile() && /^\.?(?:tmp|vrodos-.*-shim)/i.test(entry.name))
    .map((entry) => entry.name);
  assert.deepEqual(temporaryFiles, [], `Temporary build files remain: ${temporaryFiles.join(', ')}`);
}

async function main() {
  assert.equal(
    packageJson.scripts?.['build:vendor'],
    'node ./scripts/build-runtime-vendors.mjs',
    'build:vendor must invoke the canonical runtime vendor builder'
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(packageJson.scripts || {}, 'build:three'),
    false,
    'build:three must not remain as a compatibility alias'
  );

  await validateRuntimePackageVersions();

  const aframeArtifact = await inspectLocalAframeArtifact();
  const expectedVersionManifest = createRuntimeVersionManifest(aframeArtifact);
  const actualVersionManifest = await readJson(runtimeVersionManifestPath);
  assert.deepEqual(
    actualVersionManifest,
    expectedVersionManifest,
    'assets/runtime-version-manifest.json has drifted from the vendor catalog'
  );

  for (const relativePath of runtimeVersionArtifactPaths(actualVersionManifest)) {
    await assertReadable(
      fromPluginRoot(relativePath),
      `Runtime version artifact ${relativePath}`
    );
  }

  for (const artifact of [
    ...decoderAssets,
    ...takramAssetCopies,
    ...browserVendorAssets
  ]) {
    await assertReadable(
      fromPluginRoot(artifact.destination),
      `Declared vendor output ${artifact.destination}`
    );
  }
  for (const asset of requiredStaticAssets) {
    await assertReadable(fromPluginRoot(asset.path), asset.label);
  }
  await assertReadable(
    fromPluginRoot(vendorArtifacts.statsGl.bundlePath),
    'Stats GL runtime artifact'
  );

  const expectedBuildManifest = createRuntimeBuildManifest();
  const actualBuildManifest = await readJson(fromPluginRoot(runtimeBuildManifestPath));
  assert.deepEqual(
    actualBuildManifest,
    expectedBuildManifest,
    'assets/runtime-build-manifest.json has drifted from the runtime chunk catalog'
  );
  await validateRuntimeBuildManifest(actualBuildManifest);
  await assertNoTemporaryBuildFiles();

  console.log('Build configuration and generated manifest checks passed.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
