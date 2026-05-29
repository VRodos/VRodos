import { copyFile, mkdir, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const patchDir = path.join(rootDir, 'patches', 'networked-aframe');
const configPath = path.join(patchDir, 'config.json');
const vendorDistDir = path.join(rootDir, 'assets', 'vendor', 'networked-aframe', 'dist');

const args = new Set(process.argv.slice(2));
const keepWorkdir = args.has('--keep-workdir');
const skipInstall = args.has('--skip-install');
const patchOnly = args.has('--patch-only');

function commandName(command) {
  return process.platform === 'win32' && command === 'npm' ? 'npm.cmd' : command;
}

function spawnSpec(command, commandArgs) {
  if (process.platform === 'win32' && command === 'npm') {
    return {
      command: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', commandName(command), ...commandArgs]
    };
  }

  return {
    command: commandName(command),
    args: commandArgs
  };
}

function run(command, commandArgs, cwd) {
  return new Promise((resolve, reject) => {
    const spec = spawnSpec(command, commandArgs);
    const child = spawn(spec.command, spec.args, {
      cwd,
      stdio: 'inherit',
      shell: false
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${commandArgs.join(' ')} failed with exit code ${code}`));
    });
  });
}

async function main() {
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  const version = process.env.VRODOS_NAF_VERSION || config.version;
  const patchFile = path.resolve(patchDir, config.patch || `${version}-vrodos.patch`);

  if (!version) {
    throw new Error('patches/networked-aframe/config.json is missing "version".');
  }
  if (!existsSync(patchFile)) {
    throw new Error(`NAF patch file does not exist: ${patchFile}`);
  }

  const workRoot = path.join(os.tmpdir(), `vrodos-networked-aframe-${version}-${Date.now()}`);
  const packageRoot = path.join(workRoot, 'package');

  await mkdir(workRoot, { recursive: true });

  try {
    await run('npm', ['pack', `networked-aframe@${version}`, '--pack-destination', workRoot], rootDir);
    const tarball = path.join(workRoot, `networked-aframe-${version}.tgz`);
    await run('tar', ['-xf', tarball, '-C', workRoot], rootDir);

    await run('git', ['init'], packageRoot);
    await run('git', ['add', '.'], packageRoot);
    await run('git', ['apply', '--3way', '--whitespace=nowarn', patchFile], packageRoot);

    if (patchOnly) {
      console.log(`[VRodos] Networked-Aframe ${version} patch applied successfully.`);
      return;
    }

    if (!skipInstall) {
      await run('npm', ['install', '--no-audit', '--no-fund'], packageRoot);
    }

    await run('npm', ['run', 'dist'], packageRoot);
    await mkdir(vendorDistDir, { recursive: true });
    await copyFile(path.join(packageRoot, 'dist', 'networked-aframe.js'), path.join(vendorDistDir, 'networked-aframe.js'));
    await copyFile(path.join(packageRoot, 'dist', 'networked-aframe.min.js'), path.join(vendorDistDir, 'networked-aframe.min.js'));

    console.log(`[VRodos] Networked-Aframe ${version} patched and copied to ${vendorDistDir}`);
  } finally {
    if (keepWorkdir) {
      console.log(`[VRodos] Kept temporary NAF workdir: ${workRoot}`);
    } else {
      await rm(workRoot, { recursive: true, force: true });
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
