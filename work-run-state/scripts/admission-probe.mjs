// Keep the synchronous controller API while supervising the probe asynchronously.
import { spawn } from 'node:child_process';

const [deadline, controller, command, ...args] = process.argv.slice(2);
const timeoutMs = Number(deadline);
const controllerPid = Number(controller);
if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 ||
    !Number.isSafeInteger(controllerPid) || controllerPid <= 0 ||
    process.ppid !== controllerPid || !command) process.exit(1);

const MAX_OUTPUT_BYTES = 1024 * 1024;
let child;
const output = { stdout: [], stderr: [] };
const sizes = { stdout: 0, stderr: 0 };
let error = null;
let interrupted = false;

function stopOwned() {
  if (!child?.pid) return;
  try {
    if (process.platform === 'win32') child.kill('SIGKILL');
    else process.kill(-child.pid, 'SIGKILL');
  } catch (failure) {
    if (failure.code !== 'ESRCH') error ||= failure.code || 'PROBE_CLEANUP_FAILED';
  }
}
function cancel() {
  interrupted = true;
  error ||= 'ECANCELED';
  stopOwned();
}
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, cancel);
child = spawn(command, args, {
  detached: process.platform !== 'win32',
  stdio: ['ignore', 'pipe', 'pipe'],
});
for (const stream of ['stdout', 'stderr']) {
  child[stream].on('data', (chunk) => {
    sizes[stream] += chunk.length;
    if (sizes[stream] > MAX_OUTPUT_BYTES) {
      error ||= 'ENOBUFS';
      stopOwned();
    } else output[stream].push(chunk);
  });
}
child.on('error', (failure) => { error ||= failure.code || 'PROBE_SPAWN_FAILED'; });
const timer = setTimeout(() => {
  error ||= 'ETIMEDOUT';
  stopOwned();
}, timeoutMs);
// A direct controller kill need not reach this process's terminal group.
const parentWatch = setInterval(() => {
  try { process.kill(controllerPid, 0); }
  catch (failure) { if (failure.code === 'ESRCH') cancel(); }
}, 100);
child.on('close', (status, signal) => {
  clearTimeout(timer);
  clearInterval(parentWatch);
  stopOwned();
  const result = {
    status, signal, error: error ? { code: error } : null,
    stdout: Buffer.concat(output.stdout).toString('utf8'),
    stderr: Buffer.concat(output.stderr).toString('utf8'),
  };
  if (interrupted) process.exitCode = 1;
  process.stdout.write(JSON.stringify(result));
});
