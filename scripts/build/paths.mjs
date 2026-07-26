import path from 'node:path';
import { fileURLToPath } from 'node:url';

const buildDir = path.dirname(fileURLToPath(import.meta.url));

export const pluginRoot = path.resolve(buildDir, '..', '..');
export const runtimeLibraryRoot = 'assets/js/runtime/master/lib';
export const runtimeLibraryDir = fromPluginRoot(runtimeLibraryRoot);

export function fromPluginRoot(relativePath) {
  return path.join(pluginRoot, ...String(relativePath).split('/'));
}

export function toPluginRelative(filePath) {
  return path.relative(pluginRoot, filePath).replaceAll(path.sep, '/');
}

export function toPosixPath(filePath) {
  return String(filePath).replaceAll(path.sep, '/');
}
