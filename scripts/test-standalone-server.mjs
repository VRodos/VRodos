import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

if (process.platform !== 'win32') {
  console.log('Windows standalone server lifetime check skipped on this platform.');
  process.exit(0);
}

const exporter = await readFile(new URL('../includes/class-vrodos-scene-standalone-exporter.php', import.meta.url), 'utf8');
const script = exporter.match(/private function server_script\(\): string \{\s*return <<<'JS'\r?\n([\s\S]*?)\r?\nJS;/)?.[1];
assert.ok(script, 'The generated standalone server must be available.');
const directory = await mkdtemp(path.join(os.tmpdir(), 'vrodos-server-lifetime-'));
const portProbe = createServer();
await new Promise(resolve => portProbe.listen(0, '127.0.0.1', resolve));
const port = portProbe.address().port;
await new Promise(resolve => portProbe.close(resolve));
let shell;
let serverPid;
let output = '';

async function waitUntil(check, message) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await delay(100);
  }
  assert.fail(message + '\n' + output);
}

function isRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === 'ESRCH') return false;
    throw error;
  }
}

try {
  await writeFile(path.join(directory, 'server.mjs'), script);
  await writeFile(path.join(directory, 'index.html'), 'Standalone lifetime acceptance scene');
  // Do not open a browser during this process-lifetime acceptance check.
  await writeFile(path.join(directory, 'no-browser.cjs'), "require('node:child_process').spawn = () => ({ unref() {} }); require('node:module').syncBuiltinESMExports();");
  const quote = value => "'" + value.replaceAll("'", "''") + "'";
  const command = `$serverProcess = Start-Process -FilePath ${quote(process.execPath)} -ArgumentList @('--require', './no-browser.cjs', 'server.mjs') -WorkingDirectory ${quote(directory)} -WindowStyle Hidden -PassThru; Write-Output ('SERVER_PID=' + $serverProcess.Id); Wait-Process -Id $serverProcess.Id`;
  shell = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
    windowsHide: true,
    env: { ...process.env, VRODOS_STANDALONE_PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  shell.stdout.on('data', chunk => { output += chunk; });
  shell.stderr.on('data', chunk => { output += chunk; });
  await waitUntil(() => {
    serverPid = Number(output.match(/SERVER_PID=(\d+)/)?.[1]);
    return serverPid > 0;
  }, 'PowerShell must start the server.');
  await waitUntil(async () => {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      return response.ok && await response.text() === 'Standalone lifetime acceptance scene';
    } catch { return false; }
  }, 'The scene must be served while PowerShell is open.');
  shell.kill();
  await waitUntil(() => !isRunning(serverPid), 'The server must stop when its PowerShell parent exits.');
  await assert.rejects(fetch(`http://127.0.0.1:${port}/`), 'The closed server must release its port.');
  console.log('Windows standalone server lifetime acceptance check passed.');
} finally {
  if (shell && shell.exitCode === null && !shell.killed) shell.kill();
  if (serverPid && isRunning(serverPid)) process.kill(serverPid);
  await rm(directory, { recursive: true, force: true });
}
