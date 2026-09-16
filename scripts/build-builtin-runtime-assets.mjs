import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// Reuse the production encoder; keep the editable built-in source unchanged.
const root = path.resolve(import.meta.dirname, '..');
const temporary = await mkdtemp(path.join(os.tmpdir(), 'vrodos-builtin-'));
try {
    const result = spawnSync(process.execPath, [
        path.join(root, 'scripts/prototype-optimize-master-client-assets.mjs'),
        '--source', path.join(root, 'assets/models/runtime/assessment.glb'),
        '--profile', 'web-high', '--protect-geometry', '--texture-max-size', '1024',
        '--output-dir', temporary,
        '--output-file', path.join(root, 'assets/models/runtime/assessment-web.glb')
    ], { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error('Built-in assessment optimization failed.');
} finally {
    await rm(temporary, { recursive: true, force: true });
}
