import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CLI = fileURLToPath(new URL('../scripts/work-run.mjs', import.meta.url));
const env = { ...process.env, GIT_CONFIG_GLOBAL: os.devNull,
  GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0' };

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'work-run-help-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const runs = path.join(dir, 'runs');
  const marker = path.join(dir, 'probe-ran');
  return { dir, runs, marker, run(args) {
    return spawnSync(process.execPath, [CLI, ...args], { cwd: dir,
      env: { ...env, AGENT_RUNS_ROOT: runs }, encoding: 'utf8', timeout: 3000 });
  } };
}

function probeRepository(f) {
  function git(args) {
    const r = spawnSync('git', ['-c', 'core.hooksPath=/dev/null', ...args],
      { cwd: f.dir, env, encoding: 'utf8', timeout: 3000 });
    assert.equal(r.status, 0, r.stderr);
  }
  git(['init', '-q']);
  fs.writeFileSync(path.join(f.dir, 'oracle.mjs'),
    `import fs from 'node:fs'; fs.appendFileSync(${JSON.stringify(f.marker)}, 'probe\\n'); console.log('{}');\n`);
  fs.writeFileSync(path.join(f.dir, 'closeout-command.json'), JSON.stringify({
    closeoutCommand: [process.execPath, 'oracle.mjs'],
    admissionCommand: [process.execPath, 'oracle.mjs'],
  }));
  git(['add', 'oracle.mjs', 'closeout-command.json']);
  git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
    'commit', '--no-gpg-sign', '--no-verify', '-qm', 'isolated probe fixture']);
}

test('admission --help never executes the configured baseline probe', (t) => {
  const f = fixture(t);
  probeRepository(f);
  const r = f.run(['admission', '--help']);
  assert.equal(fs.existsSync(f.marker), false, 'help executed the baseline project probe');
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.match(r.stdout, /^Usage: work-run\.mjs/);
  assert.equal(fs.existsSync(f.runs), false, 'help created run state');
});

test('ordinary admission still executes its probe and rejects invalid evidence', (t) => {
  const f = fixture(t);
  probeRepository(f);
  const r = f.run(['admission']);
  assert.equal(fs.readFileSync(f.marker, 'utf8'), 'probe\n');
  assert.equal(r.status, 1, r.stderr + r.stdout);
  assert.equal(JSON.parse(r.stdout).admitted, false);
});

test('every dispatch command accepts both help flags without Git or run state', (t) => {
  const f = fixture(t);
  const commands = ['init', 'pick', 'mark-pass', 'mark-blocked', 'bump-iteration',
    'set-max', 'status', 'append', 'cancel', 'complete', 'admission',
    'check-admission', 'adopt-admission', 'revoke-admission'];
  for (const command of commands) {
    for (const flag of ['--help', '-h']) {
      const r = f.run([command, flag]);
      assert.equal(r.status, 0, `${command} ${flag}: ${r.stderr}`);
      assert.match(r.stdout, /^Usage: work-run\.mjs/);
    }
  }
  assert.equal(fs.existsSync(f.runs), false);
});

test('help takes precedence over mutation inputs and preserves retained state', (t) => {
  const f = fixture(t);
  fs.mkdirSync(f.runs);
  fs.writeFileSync(path.join(f.runs, 'ACTIVE'), 'retained-run\n');
  const r = f.run(['cancel', '--run-id', 'retained-run', '--help']);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(fs.readFileSync(path.join(f.runs, 'ACTIVE'), 'utf8'), 'retained-run\n');
  assert.deepEqual(fs.readdirSync(f.runs), ['ACTIVE']);
});

test('top-level help works with both flags and no arguments', (t) => {
  const f = fixture(t);
  for (const args of [[], ['--help'], ['-h']]) {
    const r = f.run(args);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /^Usage: work-run\.mjs/);
  }
});
