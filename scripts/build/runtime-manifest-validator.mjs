import { access } from 'node:fs/promises';
import path from 'node:path';
import { fromPluginRoot, toPluginRelative } from './paths.mjs';

export async function assertReadable(filePath, label) {
  try {
    await access(filePath);
  } catch {
    throw new Error(`${label} is missing: ${toPluginRelative(filePath)}`);
  }
}

function assertSafeBasename(filePath, label) {
  const normalized = String(filePath).trim().replaceAll('\\', '/');
  if (!normalized || path.posix.basename(normalized) !== normalized || normalized.includes('..')) {
    throw new Error(`Runtime manifest has invalid ${label}: ${normalized}`);
  }
}

function assertSafeRelativePath(filePath, label) {
  const normalized = String(filePath).trim().replaceAll('\\', '/');
  if (
    !normalized ||
    normalized.startsWith('/') ||
    /^[a-z][a-z0-9+.-]*:/i.test(normalized) ||
    /%[0-9a-f]{2}/i.test(normalized) ||
    normalized.includes('?') ||
    normalized.includes('#') ||
    /[\x00-\x1f\x7f]/.test(normalized) ||
    normalized.split('/').includes('..')
  ) {
    throw new Error(`Runtime manifest has invalid ${label}: ${normalized}`);
  }
}

function validateDependencyGraph(chunks) {
  const state = new Map();

  function visit(chunkId, dependencyPath) {
    if (state.get(chunkId) === 2) {
      return;
    }
    if (state.get(chunkId) === 1) {
      throw new Error(
        `Runtime chunk dependency cycle: ${[...dependencyPath, chunkId].join(' -> ')}`
      );
    }

    state.set(chunkId, 1);
    const nextPath = [...dependencyPath, chunkId];
    for (const dependencyId of chunks[chunkId].dependencies || []) {
      visit(dependencyId, nextPath);
    }
    state.set(chunkId, 2);
  }

  for (const chunkId of Object.keys(chunks)) {
    visit(chunkId, []);
  }
}

function validateDependencyOrder(chunks) {
  for (const [chunkId, chunk] of Object.entries(chunks)) {
    for (const dependencyId of chunk.dependencies || []) {
      if (Number(chunks[dependencyId].order) >= Number(chunk.order)) {
        throw new Error(
          `Runtime chunk dependency order is invalid: ${chunkId} -> ${dependencyId}`
        );
      }
    }
  }
}

export async function validateRuntimeBuildManifest(manifest, { validateFiles = true } = {}) {
  if (Number(manifest?.schemaVersion) !== 2) {
    throw new Error('Unsupported runtime build manifest schema.');
  }

  assertSafeRelativePath(manifest.runtimeRoot, 'runtimeRoot');

  if (!manifest.chunks || typeof manifest.chunks !== 'object' || Array.isArray(manifest.chunks)) {
    throw new Error('Runtime build manifest has no chunks.');
  }

  const ids = new Set(Object.keys(manifest.chunks));
  const orders = new Map();
  const activations = new Map();

  for (const [chunkId, chunk] of Object.entries(manifest.chunks)) {
    if (!chunk || typeof chunk !== 'object' || Array.isArray(chunk)) {
      throw new Error(`Runtime chunk entry is invalid: ${chunkId}`);
    }
    if (chunk.id !== chunkId) {
      throw new Error(`Runtime chunk id mismatch: ${chunkId}`);
    }
    if (!chunk.type || !Number.isFinite(Number(chunk.order))) {
      throw new Error(`Runtime chunk is missing type/order: ${chunkId}`);
    }
    if (!Array.isArray(chunk.features) || chunk.features.length === 0) {
      throw new Error(`Runtime chunk has no feature coverage declaration: ${chunkId}`);
    }
    if (chunk.dependencies != null && !Array.isArray(chunk.dependencies)) {
      throw new Error(`Runtime chunk dependencies are invalid: ${chunkId}`);
    }
    if (chunk.sourceFiles != null && !Array.isArray(chunk.sourceFiles)) {
      throw new Error(`Runtime chunk source files are invalid: ${chunkId}`);
    }
    if (orders.has(Number(chunk.order))) {
      throw new Error(
        `Runtime chunks share order ${chunk.order}: ${orders.get(Number(chunk.order))}, ${chunkId}`
      );
    }
    orders.set(Number(chunk.order), chunkId);

    if (chunk.activationCapabilities != null && !Array.isArray(chunk.activationCapabilities)) {
      throw new Error(`Runtime chunk activation capabilities are invalid: ${chunkId}`);
    }
    for (const capabilityValue of chunk.activationCapabilities || []) {
      const capability = String(capabilityValue).trim();
      if (!capability) {
        throw new Error(`Runtime chunk has an empty activation capability: ${chunkId}`);
      }
      if (activations.has(capability)) {
        throw new Error(
          `Runtime activation capability is declared by multiple chunks: ${capability}`
        );
      }
      activations.set(capability, chunkId);
    }

    for (const dependencyId of chunk.dependencies || []) {
      if (!ids.has(dependencyId)) {
        throw new Error(
          `Runtime chunk has an undeclared dependency: ${chunkId} -> ${dependencyId}`
        );
      }
    }

    for (const sourceFile of chunk.sourceFiles || []) {
      assertSafeRelativePath(sourceFile, `source file for ${chunkId}`);
      if (validateFiles) {
        await assertReadable(
          fromPluginRoot(sourceFile),
          `Runtime chunk source file for ${chunkId}`
        );
      }
    }

    if (chunk.type === 'script') {
      if (!chunk.src || !chunk.file) {
        throw new Error(`Runtime script chunk is missing src/file: ${chunkId}`);
      }
      assertSafeRelativePath(chunk.src, `chunk source for ${chunkId}`);
      assertSafeBasename(chunk.file, `chunk file for ${chunkId}`);
      if (validateFiles) {
        await assertReadable(
          fromPluginRoot(`${manifest.runtimeRoot}/${chunk.file}`),
          `Runtime manifest file for ${chunkId}`
        );
      }
    } else if (chunk.type === 'inline-module') {
      const placeholder = 'VRODOS_PLUGIN_URL_PLACEHOLDER';
      const moduleImport = String(chunk.moduleImport || '');
      const relativeImport = moduleImport.startsWith(placeholder)
        ? moduleImport.slice(placeholder.length)
        : moduleImport;
      assertSafeRelativePath(relativeImport, `module import for ${chunkId}`);
      if (validateFiles) {
        await assertReadable(
          fromPluginRoot(relativeImport),
          `Runtime inline module for ${chunkId}`
        );
      }
    } else {
      throw new Error(`Runtime chunk has unsupported type ${chunk.type}: ${chunkId}`);
    }
  }

  validateDependencyGraph(manifest.chunks);
  validateDependencyOrder(manifest.chunks);
}
