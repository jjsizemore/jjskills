import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { CLOSEOUT_ORACLE_TIMEOUT_MS } from '../scripts/closeout-timeouts.mjs';

const CLI = fileURLToPath(new URL('../scripts/work-run.mjs', import.meta.url));
const TARGET = ['--endpoint', 'staging', '--surface', 'backend-api', '--environment', 'staging'];
const VIRTUAL_CONSUMER_MS = 94_585;
function stopped(pid) {
  const result = spawnSync('ps', ['-o', 'stat=', '-p', String(pid)], { encoding: 'utf8' });
  assert.ifError(result.error);
  const state = result.stdout.trim();
  return !state || state.startsWith('Z');
}

const OBSERVATION = `
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const payload = { releaseSafeguards: {
  repo: 'local:' + fs.realpathSync(process.cwd()).toLowerCase(),
  surface: 'backend-api', environment: 'staging', changeIdentity: head,
  evaluatedAt: new Date().toISOString(),
  staging: { validated: true, isolatedFromProduction: true, blastRadius: 'internal-staging',
    probeUrl: 'https://staging.invalid/probe', promotionCriteria: 'fixture check passes' },
  detection: { owner: 'fixture-oncall', signal: 'fixture-failure', trigger: 'any failure',
    deployedIdentityBound: true },
  rollback: { exercised: true, immutableTarget: 'a'.repeat(64), recoveryTarget: '120s',
    recoveryTime: '1s', schemaCompatible: true },
} };
`;

function fixture(body = 'process.stdout.write(JSON.stringify(payload));') {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'admission-timeout-')));
  const repo = path.join(root, 'subject');
  fs.mkdirSync(repo);
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith('GIT_')) delete env[key];
  Object.assign(env, { GIT_CONFIG_GLOBAL: os.devNull, GIT_CONFIG_NOSYSTEM: '1',
    AGENT_RUNS_ROOT: path.join(root, 'runs'), DEADLINE_TEST_ROOT: root });
  const git = (...args) => {
    const result = spawnSync('git', args, { cwd: repo, env, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  git('init', '-q', '-b', 'fixture');
  git('config', 'user.name', 'Admission Deadline Fixture');
  git('config', 'user.email', 'fixture@example.invalid');
  fs.writeFileSync(path.join(repo, 'probe.mjs'),
    "import fs from 'node:fs';\nimport { execFileSync, spawn } from 'node:child_process';\n" + OBSERVATION + body);
  fs.writeFileSync(path.join(repo, 'stories.json'), JSON.stringify([{ id: 'RELEASE', title: 'fixture release',
    acceptanceCriteria: ['fixture only'], classification: 'release-action', surface: 'backend-api' }]));
  fs.writeFileSync(path.join(repo, 'closeout-command.json'), JSON.stringify({
    closeoutCommand: [process.execPath, 'probe.mjs'], admissionCommand: [process.execPath, 'probe.mjs'],
    rollbackPolicy: { owner: 'fixture-oncall', procedure: 'fixture rollback drill', recoveryTarget: '120s' },
  }));
  git('add', '--', 'probe.mjs', 'stories.json', 'closeout-command.json');
  git('-c', `core.hooksPath=${os.devNull}`, '-c', 'commit.gpgsign=false', 'commit', '-qm', 'sealed fixture');
  const call = (args, duration = 0) => spawnSync(process.execPath,
    ['--require', path.join(root, 'deadline.cjs'), CLI, ...args], {
      cwd: repo, env: { ...env, DEADLINE_TEST_DURATION: String(duration) },
      encoding: 'utf8', timeout: 5_000, killSignal: 'SIGKILL',
    });
  fs.writeFileSync(path.join(root, 'deadline.cjs'), `
const cp = require('node:child_process');
const fs = require('node:fs');
const original = cp.spawnSync;
cp.spawnSync = function(command, args, options) {
  if (args?.includes('probe.mjs')) {
    const timeout = args[0].endsWith('admission-probe.mjs') ? Number(args[1]) : options.timeout;
    fs.appendFileSync(process.env.DEADLINE_TEST_ROOT + '/deadlines.jsonl', JSON.stringify({ timeout }) + '\\n');
    if (timeout < Number(process.env.DEADLINE_TEST_DURATION)) {
      return { pid: 0, status: null, signal: 'SIGTERM', stdout: '', stderr: '',
        error: Object.assign(new Error('fixture consumer exceeded deadline'), { code: 'ETIMEDOUT' }) };
    }
  }
  return original.apply(this, arguments);
};
require('node:module').syncBuiltinESMExports();
`);
  const initArgs = ['init', '--run-id', 'fixture', '--project', 'fixture', '--branch', 'fixture',
    '--description', 'bounded admission fixture', '--stories-file', path.join(repo, 'stories.json'),
    '--source-spec', 'fixture', '--tracking-provider', 'local', '--tracking-issue-id', 'not_applicable',
    '--tracking-key', 'fixture', '--tracking-url', 'not_applicable', ...TARGET];
  const ledger = () => JSON.parse(fs.readFileSync(path.join(root, 'runs', 'fixture', 'ledger.json'), 'utf8'));
  const runner = (timeoutMs) => {
    const file = path.join(root, 'run-probe.mjs');
    fs.writeFileSync(file, `import { executeBaselineSafeguardsProbe } from ${JSON.stringify(new URL('../scripts/work-run.mjs', import.meta.url).href)};
const result = executeBaselineSafeguardsProbe({ cwd: process.cwd(), endpoint: 'staging',
  expectedSurface: 'backend-api', timeoutMs: ${JSON.stringify(timeoutMs)} });
process.stdout.write(JSON.stringify(result));`);
    return file;
  };
  const direct = (timeoutMs) => {
    return spawnSync(process.execPath, [runner(timeoutMs)], { cwd: repo, env, encoding: 'utf8',
      detached: process.platform !== 'win32', timeout: 3_000, killSignal: 'SIGKILL' });
  };
  return { root, repo, env, call, initArgs, ledger, direct, runner,
    close: () => fs.rmSync(root, { recursive: true, force: true }) };
}

for (const action of ['admission', 'init', 'pick', 'bump-iteration']) {
  test(`${action} admits a valid probe with a simulated 94.585-second cost under the shared deadline`, () => {
    const f = fixture();
    try {
      if (action !== 'init') {
        const initialized = f.call(f.initArgs);
        assert.equal(initialized.status, 0, initialized.stderr);
      }
      const trace = path.join(f.root, 'deadlines.jsonl');
      fs.writeFileSync(trace, '');
      const args = action === 'init' ? f.initArgs : action === 'admission'
        ? ['admission', ...TARGET, '--require-admitted'] : [action, '--story', 'RELEASE'];
      const result = f.call(args, VIRTUAL_CONSUMER_MS);
      assert.equal(result.status, 0, result.stderr + result.stdout);
      const output = JSON.parse(result.stdout);
      if (action === 'init') assert.equal(f.ledger().releaseSafeguards.status, 'admitted');
      else if (action === 'pick') assert.equal(output.id, 'RELEASE');
      else if (action === 'admission') assert.equal(output.status, 'admitted');
      else assert.equal(f.ledger().iteration, 1);
      const deadlines = fs.readFileSync(trace, 'utf8').trim().split('\n').map(JSON.parse);
      // init probes once: handoff/status no longer probe (pure reads); bump still probes at pick + actuation.
      assert.equal(deadlines.length, action === 'bump-iteration' ? 2 : 1);
    } finally { f.close(); }
  });
}

test('a delayed valid probe within its internal deadline still admits', () => {
  const f = fixture('setTimeout(() => process.stdout.write(JSON.stringify(payload)), 50);');
  try {
    const result = f.direct(500);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).status, 'admitted');
  } finally { f.close(); }
});

test('invalid internal deadlines deny before starting a probe', () => {
  const f = fixture("fs.writeFileSync(process.env.DEADLINE_TEST_ROOT + '/started', 'started'); process.stdout.write(JSON.stringify(payload));");
  try {
    for (const timeout of [0, -1, 0.5, null, '500', CLOSEOUT_ORACLE_TIMEOUT_MS + 1]) {
      const result = f.direct(timeout);
      assert.equal(result.status, 0, result.stderr);
      const output = JSON.parse(result.stdout);
      assert.equal(output.admitted, false, JSON.stringify(timeout));
      assert.match(output.reason, /deadline|timeout/i);
      assert.equal(fs.existsSync(path.join(f.root, 'started')), false);
    }
  } finally { f.close(); }
});

test('a nonzero probe exit remains an application failure instead of a timeout', () => {
  const f = fixture('process.stdout.write(JSON.stringify(payload)); process.exit(7);');
  try {
    const result = f.direct(500);
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.admitted, false);
    assert.match(output.reason, /execution failed with exit code 7/);
    assert.equal(output.probeFailure.exitCode, 7);
    assert.equal(output.probeFailure.signal, null);
    assert.equal(output.probeFailure.error, null);
  } finally { f.close(); }
});

test('probe stdout beyond the existing one-MiB limit denies with buffer failure evidence', () => {
  const f = fixture("process.stdout.write('x'.repeat(1024 * 1024 + 1));");
  try {
    const result = f.direct(1_500);
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.admitted, false);
    assert.match(output.reason, /infrastructure failure.*ENOBUFS/);
    assert.equal(output.probeFailure.error, 'ENOBUFS');
  } finally { f.close(); }
});

test('valid JSON with bounded binary stderr survives the escaped guardian frame', () => {
  const f = fixture('process.stderr.write(Buffer.alloc(512 * 1024)); process.stdout.write(JSON.stringify(payload));');
  try {
    const result = f.direct(1_500);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).status, 'admitted');
  } finally { f.close(); }
});

test('a timed-out inherited pipe denies admission even when the probe itself exited zero',
  { skip: process.platform === 'win32' }, () => {
    const f = fixture(`
const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000);'], { stdio: 'inherit' });
fs.writeFileSync(process.env.DEADLINE_TEST_ROOT + '/child.pid', String(child.pid));
child.unref();
process.stdout.write(JSON.stringify(payload));
`);
    let runnerPid;
    let childPid;
    try {
      const result = f.direct(500);
      runnerPid = result.pid;
      const childFile = path.join(f.root, 'child.pid');
      if (fs.existsSync(childFile)) childPid = Number(fs.readFileSync(childFile, 'utf8'));
      assert.equal(result.status, 0, result.stderr);
      const output = JSON.parse(result.stdout);
      assert.equal(output.admitted, false, 'a zero parent exit cannot mask a timed-out inherited pipe');
      assert.equal(output.probeFailure.error, 'ETIMEDOUT');
      assert.ok(childPid, 'the pipe-holding child must have started');
      assert.ok(stopped(childPid), `pipe-holding child ${childPid} remains live`);
    } finally {
      for (const pid of [runnerPid, childPid].filter(Boolean)) {
        try { process.kill(-pid, 'SIGKILL'); } catch {}
        try { process.kill(pid, 'SIGKILL'); } catch {}
      }
      f.close();
    }
  });

test('controller termination stops its probe group without touching an unrelated process',
  { skip: process.platform === 'win32' }, async () => {
    const f = fixture(`
fs.writeFileSync(process.env.DEADLINE_TEST_ROOT + '/probe.pid', String(process.pid));
process.on('SIGTERM', () => {});
const child = spawn(process.execPath, ['-e', "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000);"],
  { stdio: ['ignore', 'inherit', 'inherit'] });
fs.writeFileSync(process.env.DEADLINE_TEST_ROOT + '/child.pid', String(child.pid));
setInterval(() => {}, 1000);
`);
    const sentinel = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
    const controller = spawn(process.execPath, [f.runner(2_000)], {
      cwd: f.repo, env: f.env, detached: true, stdio: 'ignore',
    });
    let closed = false;
    controller.once('close', () => { closed = true; });
    const recorded = () => ['probe.pid', 'child.pid'].filter((file) => fs.existsSync(path.join(f.root, file)))
      .map((file) => Number(fs.readFileSync(path.join(f.root, file), 'utf8')));
    const waitFor = async (predicate, message) => {
      const end = Date.now() + 1_500;
      while (Date.now() < end) {
        if (predicate()) return;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      assert.fail(message);
    };
    try {
      await waitFor(() => recorded().length === 2, 'owned probe and child did not start');
      controller.kill('SIGTERM');
      await waitFor(() => closed, 'controller ignored termination while waiting for its probe');
      await waitFor(() => recorded().every(stopped), 'owned probe group survived controller termination');
      assert.doesNotThrow(() => process.kill(sentinel.pid, 0));
    } finally {
      for (const pid of [controller.pid, ...recorded()]) {
        try { process.kill(-pid, 'SIGKILL'); } catch {}
        try { process.kill(pid, 'SIGKILL'); } catch {}
      }
      sentinel.kill('SIGKILL');
      f.close();
    }
  });

test('timeout denies valid stdout and stops its TERM-ignoring process group without touching a sentinel',
  { skip: process.platform === 'win32' }, () => {
    const f = fixture(`
fs.writeFileSync(process.env.DEADLINE_TEST_ROOT + '/probe.pid', String(process.pid));
process.on('SIGTERM', () => {});
const child = spawn(process.execPath, ['-e', "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000);"],
  { stdio: ['ignore', 'inherit', 'inherit'] });
fs.writeFileSync(process.env.DEADLINE_TEST_ROOT + '/child.pid', String(child.pid));
process.stdout.write(JSON.stringify(payload));
setInterval(() => {}, 1000);
`);
    const sentinel = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
    let runnerPid;
    const recorded = () => ['probe.pid', 'child.pid'].filter((file) => fs.existsSync(path.join(f.root, file)))
      .map((file) => Number(fs.readFileSync(path.join(f.root, file), 'utf8')));
    try {
      const result = f.direct(500);
      runnerPid = result.pid;
      assert.equal(result.status, 0, 'controller must return denial before the independent test watchdog: ' + result.stderr);
      const output = JSON.parse(result.stdout);
      assert.equal(output.admitted, false);
      assert.match(output.reason, /infrastructure failure.*ETIMEDOUT/);
      assert.equal(output.probeFailure.error, 'ETIMEDOUT');
      assert.equal(output.probeFailure.signal, 'SIGKILL');
      assert.equal(output.probeFailure.timeoutMs, 500);
      assert.ok(output.probeFailure.elapsedMs >= 500 && output.probeFailure.elapsedMs < 2_500);
      assert.equal(recorded().length, 2, 'both owned processes must have started');
      for (const pid of recorded()) {
        assert.ok(stopped(pid), `owned probe process ${pid} remains live`);
      }
      assert.doesNotThrow(() => process.kill(sentinel.pid, 0));
    } finally {
      for (const pid of [runnerPid, ...recorded()].filter(Boolean)) {
        try { process.kill(-pid, 'SIGKILL'); } catch {}
        try { process.kill(pid, 'SIGKILL'); } catch {}
      }
      sentinel.kill('SIGKILL');
      f.close();
    }
  });
