import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI = fileURLToPath(new URL('../scripts/work-run.mjs', import.meta.url));
const REPO = 'https://github.com/fixture/admission.git';
const PR = 'https://github.com/fixture/admission/pull/7';
const RUN = 'admission-fixture';
const TARGET = ['--endpoint', 'staging', '--environment', 'staging', '--surface', 'backend'];
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

function observation(kind, validated) {
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim();
  fs.appendFileSync(process.env.ADMISSION_TEST_TRACE, JSON.stringify({
    kind, head, remote, cwd: process.cwd(), source: fileURLToPath(import.meta.url),
    expectedHead: process.env.WORK_RUN_EXPECTED_HEAD,
    expectedEnvironment: process.env.WORK_RUN_EXPECTED_ENVIRONMENT,
    expectedSurface: process.env.WORK_RUN_EXPECTED_SURFACE,
    gitIndexOverride: process.env.GIT_INDEX_FILE || null,
    extraArgs: process.argv.slice(2),
  }) + '\n');
  process.stdout.write(JSON.stringify({ releaseSafeguards: {
    repo: 'remote:github.com/fixture/admission',
    surface: process.env.WORK_RUN_EXPECTED_SURFACE || 'backend',
    environment: process.env.WORK_RUN_EXPECTED_ENVIRONMENT || 'staging',
    changeIdentity: process.env.WORK_RUN_EXPECTED_HEAD || head,
    evaluatedAt: new Date().toISOString(),
    staging: {
      validated, isolatedFromProduction: true, blastRadius: 'fixture only',
      probeUrl: 'https://staging.example.invalid/health', promotionCriteria: 'fixture passes',
    },
    detection: {
      owner: 'fixture-oncall', signal: 'fixture failure', trigger: 'nonzero',
      deployedIdentityBound: true,
    },
    rollback: {
      exercised: true, immutableTarget: 'a'.repeat(64), recoveryTarget: '120s',
      recoveryTime: '60s', schemaCompatible: true,
    },
  } }));
}

const PREAMBLE = [
  "import fs from 'node:fs';",
  "import { execFileSync } from 'node:child_process';",
  "import { fileURLToPath } from 'node:url';",
].join('\n') + '\n';

function fakeGh() {
  const fs = require('node:fs');
  const args = process.argv.slice(2);
  fs.appendFileSync(process.env.ADMISSION_TEST_GH_LOG, JSON.stringify(args) + '\n');
  const state = JSON.parse(fs.readFileSync(process.env.ADMISSION_TEST_GH_STATE, 'utf8'));
  if (state.failure) process.exit(1);
  if (args[0] === 'pr' && args[1] === 'view') {
    process.stdout.write(JSON.stringify(state.pr));
  } else if (args[0] === 'pr' && args[1] === 'checks') {
    process.stdout.write(JSON.stringify(state.checks));
  } else {
    process.stderr.write('fixture forbids unexpected provider commands');
    process.exit(2);
  }
}

function fixture(variant = '') {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'admission-adoption-')));
  const f = {
    root, repo: path.join(root, 'subject'), stateRoot: path.join(root, 'runs'),
    temporary: path.join(root, 'tmp'), bin: path.join(root, 'bin'),
    traceFile: path.join(root, 'trace.jsonl'), ghLog: path.join(root, 'gh.jsonl'),
    ghState: path.join(root, 'gh-state.json'),
  };
  for (const dir of [f.repo, f.stateRoot, f.temporary, f.bin]) fs.mkdirSync(dir);
  const env = { ...process.env };
  for (const key of [
    'GIT_DIR', 'GIT_COMMON_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_CONFIG',
    'GIT_CONFIG_COUNT', 'GIT_CONFIG_PARAMETERS', 'GIT_OBJECT_DIRECTORY',
    'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_NAMESPACE',
  ]) delete env[key];
  f.env = {
    ...env, GIT_CONFIG_GLOBAL: os.devNull, GIT_CONFIG_NOSYSTEM: '1',
    GIT_TERMINAL_PROMPT: '0', TMPDIR: f.temporary,
    AGENT_RUNS_ROOT: f.stateRoot, ADMISSION_TEST_TRACE: f.traceFile,
    ADMISSION_TEST_GH_LOG: f.ghLog, ADMISSION_TEST_GH_STATE: f.ghState,
    PATH: f.bin + path.delimiter + (env.PATH || ''),
  };
  f.git = (...args) => {
    const result = spawnSync('git', args, { cwd: f.repo, env: f.env, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    return result.stdout.trim();
  };
  f.commit = (message) => {
    const files = ['probe.mjs', 'final.mjs', 'stories.json', 'closeout-command.json',
      'helpers/evidence.mjs', 'application.txt', '.gitattributes'].filter((file) => fs.existsSync(path.join(f.repo, file)));
    f.git('add', '--', ...files);
    f.git('-c', 'core.hooksPath=' + os.devNull, '-c', 'commit.gpgsign=false', 'commit', '-qm', message);
    return f.git('rev-parse', 'HEAD');
  };
  f.call = (args, overrides = {}) => spawnSync(process.execPath, [CLI, ...args], {
    cwd: f.repo, env: { ...f.env, ...overrides }, encoding: 'utf8', timeout: 15_000,
  });
  f.events = () => fs.existsSync(f.traceFile)
    ? fs.readFileSync(f.traceFile, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : [];
  f.clearTrace = () => fs.writeFileSync(f.traceFile, '');
  f.writeProvider = () => fs.writeFileSync(f.ghState, JSON.stringify(f.provider));
  f.receipts = () => {
    const dir = path.join(f.stateRoot, 'admission-adoptions');
    return fs.existsSync(dir) ? fs.readdirSync(dir).filter((name) => name.endsWith('.json'))
      .map((name) => path.join(dir, name)) : [];
  };
  f.adopt = (extra = []) => f.call(['adopt-admission', '--source-pr', PR, ...TARGET, '--run-id', RUN, ...extra]);
  f.admission = (extra = [], overrides = {}) => f.call([
    'admission', ...TARGET, '--run-id', RUN, '--require-admitted', ...extra,
  ], overrides);

  f.git('init', '-q', '-b', 'subject');
  f.git('config', 'user.name', 'Admission Fixture');
  f.git('config', 'user.email', 'fixture@example.invalid');
  f.git('remote', 'add', 'origin', REPO);
  fs.writeFileSync(path.join(f.repo, 'probe.mjs'), PREAMBLE + observation.toString() + "\nobservation('original-probe', false);\n");
  fs.writeFileSync(path.join(f.repo, 'final.mjs'), PREAMBLE + observation.toString() + "\nobservation('original-final', false);\nprocess.exit(1);\n");
  fs.writeFileSync(path.join(f.repo, 'stories.json'), JSON.stringify([
    { id: 'ONLY', title: 'fixture', acceptanceCriteria: ['fixture only'] },
  ]));
  fs.writeFileSync(path.join(f.repo, 'closeout-command.json'), JSON.stringify({
    closeoutCommand: [process.execPath, 'final.mjs'],
    admissionCommand: [process.execPath, 'probe.mjs'],
    rollbackPolicy: { owner: 'fixture-oncall', procedure: 'fixture rollback drill', recoveryTarget: '120s' },
  }));
  f.subject = f.commit('sealed subject R');
  f.git('checkout', '-qb', 'reviewed-source');
  fs.mkdirSync(path.join(f.repo, 'helpers'));
  const helper = PREAMBLE + 'export ' + observation.toString() + '\n';
  if (variant === 'symlink') {
    const outside = path.join(f.root, 'outside-helper.mjs');
    fs.writeFileSync(outside, helper);
    fs.symlinkSync(outside, path.join(f.repo, 'helpers', 'evidence.mjs'));
  } else if (variant !== 'missing-helper') {
    fs.writeFileSync(path.join(f.repo, 'helpers', 'evidence.mjs'), helper);
  }
  if (variant === 'export-subst') {
    fs.writeFileSync(path.join(f.repo, '.gitattributes'), 'helpers/evidence.mjs export-subst\n');
    fs.appendFileSync(path.join(f.repo, 'helpers', 'evidence.mjs'),
      "const marker = '$Format:%H$';\nif (marker !== '$' + 'Format:%H$') throw new Error('source bytes transformed');\n");
  }
  fs.writeFileSync(path.join(f.repo, 'probe.mjs'),
    "import { observation } from './helpers/evidence.mjs';\nobservation('source-helper', true);\n");
  fs.writeFileSync(path.join(f.repo, 'final.mjs'), PREAMBLE + observation.toString() + "\nobservation('source-final', true);\n");
  if (variant === 'config') {
    const p = path.join(f.repo, 'closeout-command.json');
    const config = JSON.parse(fs.readFileSync(p, 'utf8'));
    config.rollbackPolicy.recoveryTarget = '240s';
    fs.writeFileSync(p, JSON.stringify(config));
  }
  f.sourceHead = f.commit('reviewed source with imported admission helper');
  f.git('checkout', '-qb', 'staging', f.subject);
  f.git('-c', 'core.hooksPath=' + os.devNull, '-c', 'commit.gpgsign=false',
    'merge', '--no-ff', '-qm', 'merged reviewed source', 'reviewed-source');
  f.source = f.git('rev-parse', 'HEAD');
  f.git('update-ref', 'refs/remotes/origin/staging', f.source);
  f.git('checkout', '-q', 'subject');

  f.provider = {
    pr: {
      url: PR, state: 'MERGED', isDraft: false, headRefOid: f.sourceHead,
      headRepository: { name: 'admission', nameWithOwner: 'fixture/admission' },
      headRepositoryOwner: { login: 'fixture' }, baseRefName: 'staging',
      mergedAt: '2026-10-30T00:00:00Z', mergeCommit: { oid: f.source },
      statusCheckRollup: [{
        __typename: 'CheckRun', name: 'Validation Gate', headSha: f.sourceHead,
        status: 'COMPLETED', conclusion: 'SUCCESS',
      }],
      reviewDecision: 'APPROVED',
    },
    checks: [{ name: 'Validation Gate', state: 'SUCCESS', bucket: 'pass', link: PR + '/checks' }],
  };
  f.writeProvider();
  fs.writeFileSync(path.join(f.bin, 'gh'), '#!' + process.execPath + '\n(' + fakeGh.toString() + ')();\n', { mode: 0o755 });
  const init = f.call([
    'init', '--run-id', RUN, '--project', 'fixture', '--branch', 'subject',
    '--description', 'isolated admission adoption fixture', '--stories-file', 'stories.json',
    '--endpoint', 'staging', '--surface', 'backend', '--max-iterations', '3',
    '--source-spec', 'fixture-only', '--tracking-provider', 'local',
    '--tracking-issue-id', 'not_applicable', '--tracking-key', 'fixture',
    '--tracking-url', 'not_applicable',
  ]);
  assert.equal(init.status, 0, init.stderr || init.stdout);
  f.ledger = path.join(f.stateRoot, RUN, 'ledger.json');
  f.clearTrace();
  return f;
}

function snapshot(f) {
  return {
    ledger: fs.readFileSync(f.ledger), active: fs.readFileSync(path.join(f.stateRoot, 'ACTIVE')),
    head: f.git('rev-parse', 'HEAD'), index: fs.readFileSync(path.join(f.repo, '.git', 'index')),
    refs: f.git('for-each-ref', '--format=%(refname) %(objectname)'),
    worktrees: f.git('worktree', 'list', '--porcelain'),
    config: fs.readFileSync(path.join(f.repo, 'closeout-command.json')),
    probe: fs.readFileSync(path.join(f.repo, 'probe.mjs')),
    final: fs.readFileSync(path.join(f.repo, 'final.mjs')),
  };
}

function denied(result) {
  assert.notEqual(result.status, 0, result.stdout + result.stderr);
}

function admissionCacheOnly(before, after, expectedStatus) {
  assert.deepEqual({ ...after, ledger: before.ledger }, before);
  const original = JSON.parse(before.ledger.toString());
  const observed = JSON.parse(after.ledger.toString());
  assert.deepEqual({ ...observed, releaseSafeguards: original.releaseSafeguards }, original);
  assert.equal(observed.releaseSafeguards.status, expectedStatus);
}

describe('guarded admission-only source adoption', () => {
  let f;
  beforeEach(() => { f = fixture(); });
  afterEach(() => { if (f) fs.rmSync(f.root, { recursive: true, force: true }); });

  it('admits R through the reviewed whole source closure, preserving the sealed final oracle and ledger', () => {
    const initial = snapshot(f);
    denied(f.admission());
    assert.equal(f.events().at(-1).kind, 'original-probe');
    const before = snapshot(f);
    admissionCacheOnly(initial, before, 'denied');
    f.provider.pr.statusCheckRollup.push({
      __typename: 'CheckRun', name: 'Unrelated optional check', headSha: f.sourceHead,
      status: 'COMPLETED', conclusion: 'FAILURE',
    });
    f.writeProvider();
    f.clearTrace();
    const adopted = f.adopt();
    assert.equal(adopted.status, 0, adopted.stderr || adopted.stdout);
    assert.equal(f.receipts().length, 1);
    assert.deepEqual(snapshot(f), before, 'adoption must not rewrite the original run');
    const receipt = f.receipts()[0];
    const receiptBytes = fs.readFileSync(receipt);
    const stat = fs.statSync(receipt, { bigint: true });
    assert.equal(f.adopt().status, 0);
    assert.deepEqual(fs.readFileSync(receipt), receiptBytes);
    assert.equal(fs.statSync(receipt, { bigint: true }).ino, stat.ino);
    assert.equal(fs.statSync(receipt, { bigint: true }).mtimeNs, stat.mtimeNs);
    assert.deepEqual(snapshot(f), before, 'idempotent adoption must not rewrite the original run');
    f.clearTrace();
    const admitted = f.admission([], {
      WORK_RUN_EXPECTED_HEAD: '0'.repeat(40),
      WORK_RUN_EXPECTED_ENVIRONMENT: 'production', WORK_RUN_EXPECTED_SURFACE: 'wrong',
    });
    assert.equal(admitted.status, 0, admitted.stderr || admitted.stdout);
    assert.equal(JSON.parse(admitted.stdout).status, 'admitted');
    const event = f.events().find((item) => item.kind === 'source-helper');
    assert.ok(event, 'the imported source helper must actually execute');
    assert.equal(event.head, f.subject);
    assert.equal(event.expectedHead, f.subject);
    assert.equal(event.expectedEnvironment, 'staging');
    assert.equal(event.expectedSurface, 'backend');
    assert.equal(event.remote, REPO);
    assert.notEqual(event.cwd, f.repo);
    assert.ok(event.cwd.startsWith(f.temporary + path.sep), event.cwd);
    assert.ok(event.source.startsWith(event.cwd + path.sep));
    assert.deepEqual(event.extraArgs, []);
    assert.equal(f.events().some((item) => item.kind === 'original-probe'), false);
    admissionCacheOnly(before, snapshot(f), 'admitted');

    assert.equal(f.call(['mark-pass', '--run-id', RUN, '--story', 'ONLY']).status, 0);
    const ledger = JSON.parse(fs.readFileSync(f.ledger, 'utf8'));
    const evidence = path.join(f.root, 'closeout-evidence.json');
    fs.writeFileSync(evidence, JSON.stringify({
      runId: RUN, status: 'VERIFIED', baseSha: ledger.baseSha, subjectHead: f.subject,
      diffDigest: 'sha256:' + sha(Buffer.alloc(0)),
      oracle: { command: ledger.closeoutCommand, status: 0, signal: null }, prUrl: PR,
    }));
    f.clearTrace();
    denied(f.call(['complete', '--run-id', RUN, '--closeout-evidence', evidence]));
    assert.equal(f.events().at(-1).kind, 'original-final');
    assert.equal(f.events().some((item) => item.kind === 'source-final'), false);
    assert.equal(JSON.parse(fs.readFileSync(f.ledger, 'utf8')).closeoutStatus, null);
  });

  for (const [name, change] of [
    ['unmerged source', (p) => { p.state = 'OPEN'; p.mergedAt = null; p.mergeCommit = null; }],
    ['wrong source repository', (p) => { p.headRepositoryOwner.login = 'other'; }],
    ['wrong protected base', (p) => { p.baseRefName = 'main'; }],
    ['changes requested', (p) => { p.reviewDecision = 'CHANGES_REQUESTED'; }],
    ['review still required', (p) => { p.reviewDecision = 'REVIEW_REQUIRED'; }],
    ['failed rollup', (p) => { p.statusCheckRollup[0].conclusion = 'FAILURE'; }],
    ['stale check head', (p) => { p.statusCheckRollup[0].headSha = '0'.repeat(40); }],
  ]) {
    it('rejects ' + name + ' without changing the original run', () => {
      const before = snapshot(f);
      change(f.provider.pr);
      f.writeProvider();
      denied(f.adopt());
      assert.equal(f.receipts().length, 0);
      assert.deepEqual(snapshot(f), before);
    });
  }

  for (const checks of [[], [{ name: 'Validation Gate', state: 'FAILURE', bucket: 'fail' }]]) {
    it('rejects missing or failed required checks: ' + JSON.stringify(checks), () => {
      const before = snapshot(f);
      f.provider.checks = checks;
      f.writeProvider();
      denied(f.adopt());
      assert.equal(f.receipts().length, 0);
      assert.deepEqual(snapshot(f), before);
    });
  }

  it('rejects a source URL outside the original origin', () => {
    const before = snapshot(f);
    denied(f.call(['adopt-admission', '--source-pr', 'https://github.com/other/admission/pull/7',
      ...TARGET, '--run-id', RUN]));
    assert.equal(f.receipts().length, 0);
    assert.deepEqual(snapshot(f), before);
  });

  it('rejects source changes to the sealed configuration', () => {
    fs.rmSync(f.root, { recursive: true, force: true });
    f = fixture('config');
    const before = snapshot(f);
    denied(f.adopt());
    assert.equal(f.receipts().length, 0);
    assert.deepEqual(snapshot(f), before);
  });

  for (const variant of ['missing-helper', 'symlink']) {
    it('does not admit an incomplete or escaping source closure: ' + variant, () => {
      fs.rmSync(f.root, { recursive: true, force: true });
      f = fixture(variant);
      const before = snapshot(f);
      const adopted = f.adopt();
      f.clearTrace();
      if (adopted.status === 0) denied(f.admission());
      assert.equal(f.events().some((item) => item.kind === 'source-helper'), false);
      assert.deepEqual(snapshot(f), before);
    });
  }

  for (const bad of ['malformed', 'wrong binding', 'wrong source']) {
    it('denies a selected ' + bad + ' receipt without falling back', () => {
      assert.equal(f.adopt().status, 0);
      const receipt = f.receipts()[0];
      const value = JSON.parse(fs.readFileSync(receipt, 'utf8'));
      if (bad === 'wrong binding') value.subjectHead = '0'.repeat(40);
      if (bad === 'wrong source') value.sourceSha = '0'.repeat(40);
      fs.writeFileSync(receipt, bad === 'malformed' ? '{not-json\n' : JSON.stringify(value));
      const before = snapshot(f);
      f.clearTrace();
      denied(f.admission());
      assert.deepEqual(f.events(), []);
      assert.deepEqual(snapshot(f), before);
    });
  }

  it('denies provider failure on receipt use without falling back', () => {
    assert.equal(f.adopt().status, 0);
    f.provider.failure = true;
    f.writeProvider();
    f.clearTrace();
    const before = snapshot(f);
    denied(f.admission());
    assert.deepEqual(f.events(), []);
    assert.deepEqual(snapshot(f), before);
  });

  it('does not reuse an adoption for a different subject or target', () => {
    assert.equal(f.adopt().status, 0);
    f.clearTrace();
    denied(f.admission(['--surface', 'frontend']));
    assert.equal(f.events().some((item) => item.kind === 'source-helper'), false);
    fs.writeFileSync(path.join(f.repo, 'application.txt'), 'different subject\n');
    f.commit('subject advances');
    f.clearTrace();
    denied(f.admission());
    assert.equal(f.events().some((item) => item.kind === 'source-helper'), false);
  });

  it('isolates snapshot Git and probe overrides from the original alternate index', () => {
    const before = snapshot(f);
    const alternate = path.join(f.root, 'original-alternate-index');
    fs.copyFileSync(path.join(f.repo, '.git', 'index'), alternate);
    const bytes = fs.readFileSync(alternate);
    assert.equal(f.adopt().status, 0);
    const result = f.admission([], { GIT_INDEX_FILE: alternate });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.deepEqual(fs.readFileSync(alternate), bytes);
    admissionCacheOnly(before, snapshot(f), 'admitted');
    assert.equal(f.events().find((event) => event.kind === 'source-helper').gitIndexOverride, null);
  });

  it('rejects a foreign provider origin injected through inherited Git URL rewriting', () => {
    const foreign = 'https://github.com/foreign/admission/pull/7';
    f.provider.pr.url = foreign;
    f.provider.pr.headRepositoryOwner.login = 'foreign';
    f.provider.pr.headRepository.nameWithOwner = 'foreign/admission';
    f.writeProvider();
    const before = snapshot(f);
    const result = f.call(['adopt-admission', '--source-pr', foreign, ...TARGET, '--run-id', RUN], {
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'url.https://github.com/foreign/.insteadOf',
      GIT_CONFIG_VALUE_0: 'https://github.com/fixture/',
    });
    denied(result);
    assert.equal(f.receipts().length, 0);
    assert.deepEqual(snapshot(f), before);
  });

  it('executes exact committed helper bytes without archive attribute substitution', () => {
    fs.rmSync(f.root, { recursive: true, force: true });
    f = fixture('export-subst');
    assert.equal(f.adopt().status, 0);
    const result = f.admission();
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(f.events().some((event) => event.kind === 'source-helper'), true);
  });

  it('fails closed on interrupted withdrawal and supports finishing the same revocation', () => {
    assert.equal(f.adopt().status, 0);
    const receipt = f.receipts()[0];
    const withdrawn = `${receipt}.${f.source}.revoked`;
    fs.linkSync(receipt, withdrawn);
    f.clearTrace();
    denied(f.admission());
    assert.equal(f.events().some((event) => event.kind === 'source-helper'), false);
    const result = f.call(['revoke-admission', ...TARGET, '--run-id', RUN]);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(fs.existsSync(receipt), false);
    assert.equal(fs.existsSync(withdrawn), true);
  });

  it('revokes through the supported command and preserves the withdrawn receipt', () => {
    assert.equal(f.adopt().status, 0);
    const receipt = f.receipts()[0];
    const original = fs.readFileSync(receipt);
    const before = snapshot(f);
    const revoked = f.call(['revoke-admission', ...TARGET, '--run-id', RUN]);
    assert.equal(revoked.status, 0, revoked.stderr || revoked.stdout);
    assert.equal(fs.existsSync(receipt), false);
    const dir = path.dirname(receipt);
    const retained = fs.readdirSync(dir).filter((name) => name.includes('.revoked'));
    assert.equal(retained.length, 1);
    assert.deepEqual(fs.readFileSync(path.join(dir, retained[0])), original);
    f.clearTrace();
    denied(f.admission());
    assert.equal(f.events().some((item) => item.kind === 'source-helper'), false);
    denied(f.adopt());
    assert.deepEqual(snapshot(f), before);
  });
});
