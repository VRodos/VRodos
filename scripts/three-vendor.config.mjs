import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const packageLockJson = JSON.parse(readFileSync(path.join(rootDir, 'package-lock.json'), 'utf8'));

export const THREE_VENDOR_BUILD_ENTRY_FILE = '.tmp-build-three-vendor-entry.mjs';
export const THREE_SMOKE_BUNDLE_FILE = 'vrodos-phase0-smoke.bundle.js';
export const RUNTIME_MANIFEST_FILE = 'runtime-version-manifest.json';

export function getLockedPackageVersion(packageName) {
  const packageEntry = packageLockJson.packages?.[`node_modules/${packageName}`];
  if (!packageEntry?.version) {
    throw new Error(`Missing locked version for ${packageName}. Run npm install first.`);
  }

  return packageEntry.version;
}

export function getPackageRuntimeConfig() {
  return packageJson.vrodos?.runtime ?? {};
}

export function getThreeRuntimeConfig() {
  const version = getLockedPackageVersion('three');
  const versionParts = version.split('.');
  const revision = versionParts[0] === '0' ? versionParts[1] : versionParts[0];

  if (!revision || !/^\d+$/.test(revision)) {
    throw new Error(`Unable to derive Three revision from version ${version}.`);
  }

  const vendorDir = `three-r${revision}`;

  return {
    version,
    revision,
    vendorDir,
    bundleFile: `vrodos-three-r${revision}.bundle.js`,
  };
}

export const THREE_VENDOR_VERSION = getThreeRuntimeConfig().version;
export const THREE_VENDOR_DIR = getThreeRuntimeConfig().vendorDir;
export const THREE_VENDOR_BUNDLE_FILE = getThreeRuntimeConfig().bundleFile;
