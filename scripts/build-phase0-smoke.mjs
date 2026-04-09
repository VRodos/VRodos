// PHASE 0 SMOKE-TEST BUILD — throwaway.
// Produces a self-contained IIFE bundle combining the subset of Three r173
// that the current runtime uses PLUS pmndrs/postprocessing + n8ao, all
// exported onto window globals. Loaded by phase0-pmndrs-smoke-test.html to
// verify that pmndrs/postprocessing 6.x constructs and renders cleanly
// against Three r173 inside an A-Frame 1.7.1 page.
//
// Delete this script (and the bundle it produces) once Phase 0 is signed off.
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'js_libs', 'threejs173');
const bundlePath = path.join(outputDir, 'vrodos-phase0-smoke.bundle.js');
const tempEntryPath = path.join(rootDir, 'scripts', '.tmp-phase0-smoke-entry.mjs');

const bundleEntrySource = `
import * as THREEBase from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as POSTPROCESSING from 'postprocessing';
import { N8AOPostPass } from 'n8ao';

const THREE = window.THREE && typeof window.THREE === 'object' ? window.THREE : {};
Object.assign(THREE, { ...THREEBase }, { OrbitControls });
window.THREE = THREE;
window.POSTPROCESSING = POSTPROCESSING;
window.N8AOPostPass = N8AOPostPass;
`;

async function main() {
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
      legalComments: 'none',
    });
  } finally {
    await rm(tempEntryPath, { force: true });
  }
  console.log(`Built ${path.relative(rootDir, bundlePath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
