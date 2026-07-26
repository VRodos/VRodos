import { readFile } from 'node:fs/promises';
import { fromPluginRoot } from './paths.mjs';
import {
  getLockedPackageVersion,
  packageJson,
  requiredRuntimePackages
} from './vendor-catalog.mjs';

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

export async function validateRuntimePackageVersions() {
  for (const packageName of requiredRuntimePackages) {
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

    const installedManifestPath = fromPluginRoot(`node_modules/${packageName}/package.json`);
    const installedManifest = JSON.parse(await readFile(installedManifestPath, 'utf8'));
    if (installedManifest.version !== lockedVersion) {
      throw new Error(
        `${packageName} is installed at ${installedManifest.version}, but package-lock.json requires ${lockedVersion}. Reset node_modules with npm ci before building.`
      );
    }
  }
}
