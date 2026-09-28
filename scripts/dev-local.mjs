import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const wrangler = resolve('node_modules/.bin/wrangler');
const ng = resolve('node_modules/.bin/ng');
const config = ['--config', 'wrangler.local.jsonc'];
const localDb = ['--local', '--persist-to', '.wrangler/local'];
const env = {
  ...process.env,
  WRANGLER_LOG_PATH: resolve('.wrangler/logs'),
};
mkdirSync(env.WRANGLER_LOG_PATH, { recursive: true });

function start(command, args) {
  return spawn(command, args, { stdio: 'inherit', env });
}

function waitForExit(child) {
  return new Promise((resolveExit, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolveExit({ code, signal }));
  });
}

async function run(command, args) {
  const result = await waitForExit(start(command, args));
  if (result.code !== 0) process.exit(result.code || 1);
}

await run(wrangler, ['d1', 'migrations', 'apply', 'angular-ledger-local', ...config, ...localDb]);
await run(wrangler, ['d1', 'execute', 'angular-ledger-local', ...config, ...localDb,
  '--file', 'scripts/local-seed.sql']);

const api = start(wrangler, ['dev', ...config, ...localDb, '--ip', '127.0.0.1', '--port', '8787',
  '--var', 'LOCAL_DEV_SUBJECT:local-dev-subject',
  '--var', 'LOCAL_DEV_ORIGIN:http://127.0.0.1:4200']);
const web = start(ng, ['serve', '--host', '127.0.0.1', '--port', '4200',
  '--proxy-config', 'proxy.local.json']);

const apiExit = waitForExit(api);
const webExit = waitForExit(web);
let stopping = false;
let interrupted = false;
function stop() {
  if (stopping) return;
  stopping = true;
  api.kill('SIGTERM');
  web.kill('SIGTERM');
}
process.on('SIGINT', () => { interrupted = true; stop(); });
process.on('SIGTERM', () => { interrupted = true; stop(); });

const first = await Promise.race([apiExit, webExit]);
stop();
await Promise.allSettled([apiExit, webExit]);
if (!interrupted) process.exitCode = first.code || 1;
