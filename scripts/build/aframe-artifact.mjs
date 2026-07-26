import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fromPluginRoot } from './paths.mjs';
import {
  getPackageRuntimeConfig,
  runtimeVersionManifestPath,
  vendorArtifacts
} from './vendor-catalog.mjs';

const aframeConfig = getPackageRuntimeConfig().aframe ?? {};
const aframeBundlePath = fromPluginRoot(vendorArtifacts.aframe.bundlePath);

export function resolveAframeRuntimeUrl() {
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

export function inspectAframeRuntimeArtifact(source) {
  const version = String(aframeConfig.version || '');
  const requestsHighPerformance = /powerPreference\s*:\s*["']high-performance["']/.test(source);
  const artifactCommitMatch = /A-Frame Version:[^)]*Commit #([0-9a-f]{8,40})/i.exec(source);

  return {
    versionMatches: !version || source.includes(version),
    requestsHighPerformance,
    artifactCommit: artifactCommitMatch ? artifactCommitMatch[1] : ''
  };
}

function validateAframeRuntimeArtifact(source, label) {
  const inspection = inspectAframeRuntimeArtifact(source);
  const failures = [];

  if (!inspection.versionMatches) failures.push(`declared version ${aframeConfig.version}`);
  if (!inspection.requestsHighPerformance) failures.push('powerPreference: "high-performance"');

  if (failures.length) {
    throw new Error(`${label} does not contain ${failures.join(', ')}.`);
  }

  return inspection;
}

export function runtimeAframeMetadata() {
  if (!aframeConfig.label || !aframeConfig.source) {
    throw new Error('Missing vrodos.runtime.aframe metadata in package.json.');
  }

  return {
    label: aframeConfig.label,
    source: aframeConfig.source,
    version: aframeConfig.version ?? '',
    commit: aframeConfig.commit ?? '',
    sourceCommit: aframeConfig.commit ?? '',
    url: resolveAframeRuntimeUrl()
  };
}

export async function inspectLocalAframeArtifact() {
  const source = await readFile(aframeBundlePath, 'utf8');
  const inspection = validateAframeRuntimeArtifact(source, 'Local A-Frame runtime');

  return {
    metadata: runtimeAframeMetadata(),
    source,
    sha256: createHash('sha256').update(source, 'utf8').digest('hex'),
    artifactCommit: inspection.artifactCommit
  };
}

export async function syncAframeRuntimeArtifact() {
  const metadata = runtimeAframeMetadata();
  let source = '';
  let needsDownload = true;

  try {
    source = await readFile(aframeBundlePath, 'utf8');
    const inspection = inspectAframeRuntimeArtifact(source);
    const localSha256 = createHash('sha256').update(source, 'utf8').digest('hex');
    let previousAframe = {};
    try {
      const previousManifest = JSON.parse(await readFile(runtimeVersionManifestPath, 'utf8'));
      previousAframe = previousManifest.aframe || {};
    } catch {
      previousAframe = {};
    }
    const sourceCommit = previousAframe.sourceCommit || previousAframe.commit || '';
    const provenanceMatches = sourceCommit === metadata.sourceCommit &&
      previousAframe.url === metadata.url &&
      previousAframe.bundlePath === vendorArtifacts.aframe.bundlePath &&
      previousAframe.sha256 === localSha256;
    needsDownload = !inspection.versionMatches || !inspection.requestsHighPerformance || !provenanceMatches;
  } catch {
    needsDownload = true;
  }

  if (needsDownload) {
    const response = await fetch(metadata.url, { redirect: 'follow' });
    if (!response.ok) {
      throw new Error(
        `Unable to download pinned A-Frame runtime (${response.status} ${response.statusText}) from ${metadata.url}.`
      );
    }

    source = await response.text();
    validateAframeRuntimeArtifact(source, 'Downloaded A-Frame runtime');
    await mkdir(path.dirname(aframeBundlePath), { recursive: true });
    await writeFile(aframeBundlePath, source, 'utf8');
  } else {
    validateAframeRuntimeArtifact(source, 'Local A-Frame runtime');
  }

  const inspection = validateAframeRuntimeArtifact(source, 'Local A-Frame runtime');
  return {
    metadata,
    source,
    sha256: createHash('sha256').update(source, 'utf8').digest('hex'),
    artifactCommit: inspection.artifactCommit
  };
}
