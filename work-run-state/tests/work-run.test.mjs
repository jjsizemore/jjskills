/**
 * Deterministic contracts for work-run.mjs (RED/GREEN).
 * Run: node --test ~/.agents/skills/work-run-state/tests/work-run.test.mjs
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  CLOSEOUT_ORACLE_TIMEOUT_MS,
  CLOSEOUT_VERIFIER_TIMEOUT_MS,
} from '../scripts/closeout-timeouts.mjs';
import { resolveExpectedRepo } from '../scripts/release-admission.mjs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(__dirname, '..', 'scripts', 'work-run.mjs');
const LOOP = path.join(__dirname, '..', 'scripts', 'work-run-loop.sh');

function run(args, cwd, env = {}, options = {}) {
  const normalized =
    args[0] === 'init'
      ? [
          ...args,
          ...(!args.includes('--endpoint') && options.defaultEndpoint !== false
            ? ['--endpoint', 'local-only']
            : []),
          '--source-spec',
          'fixture-spec',
          '--tracking-provider',
          'local',
          '--tracking-issue-id',
          'not_applicable',
          '--tracking-key',
          'fixture-key',
          '--tracking-url',
          'not_applicable',
        ]
      : args;
  const commandEnv = {
    ...process.env,
    AGENT_RUNS_ROOT: runsRoot(cwd),
    ...env,
  };
  if (env.FAKE_GH_MODE) {
    const fakeBin = path.join(runsRoot(cwd), 'test-bin');
    fs.mkdirSync(fakeBin, { recursive: true });
    const fakeGh = path.join(fakeBin, 'gh');
    fs.writeFileSync(fakeGh, `#!/usr/bin/env node
const { execFileSync } = require('node:child_process');
if (process.argv[2] !== 'pr' || process.argv[3] !== 'view') process.exit(2);
const mode = process.env.FAKE_GH_MODE;
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const merged = mode === 'merged' || mode === 'wrong-merge';
process.stdout.write(JSON.stringify({
  url: 'https://github.com/fixture/repo/pull/1',
  headRefOid: mode === 'stale-head' ? '0'.repeat(40) : head,
  mergedAt: merged ? '2026-10-14T00:00:00Z' : null,
  mergeCommit: merged ? { oid: mode === 'wrong-merge' ? '1'.repeat(40) : head } : null,
}));
`);
    fs.chmodSync(fakeGh, 0o755);
    commandEnv.PATH = `${fakeBin}:${commandEnv.PATH || ''}`;
  }
  return spawnSync(process.execPath, [CLI, ...normalized], {
    cwd,
    encoding: 'utf8',
    timeout: 5_000,
    env: commandEnv,
  });
}

function runsRoot(cwd) {
  return path.join(path.dirname(cwd), `${path.basename(cwd)}-agent-runs`);
}

function makeRepo(oracleFails = false) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'work-run-'));
  assert.equal(spawnSync('git', ['init', '-q'], { cwd: dir }).status, 0);
  assert.equal(
    spawnSync('git', ['config', 'user.email', 'test@example.invalid'], { cwd: dir }).status,
    0,
  );
  assert.equal(
    spawnSync('git', ['config', 'user.name', 'Work Run Test'], { cwd: dir }).status,
    0,
  );
  assert.equal(
    spawnSync('git', ['config', 'commit.gpgsign', 'false'], { cwd: dir }).status,
    0,
  );
  fs.writeFileSync(
    path.join(dir, 'oracle.test.mjs'),
    oracleFails
      ? 'process.exit(1);\n'
      : "import test from 'node:test';\ntest('oracle fixture', () => {});\n",
  );
  fs.writeFileSync(
    path.join(dir, 'closeout-command.json'),
    JSON.stringify({ closeoutCommand: [process.execPath, 'oracle.test.mjs'] }),
  );
  assert.equal(
    spawnSync('git', ['add', 'oracle.test.mjs', 'closeout-command.json'], { cwd: dir }).status,
    0,
  );
  const commit = spawnSync('git', ['commit', '--no-gpg-sign', '--no-verify', '-q', '-m', 'fixture'], {
    cwd: dir,
    encoding: 'utf8',
  });
  assert.equal(commit.status, 0, commit.stderr);
  return dir;
}
function closeoutEvidence(cwd, overrides = {}, runId = 'pick-run') {
  const ledger = readJson(path.join(runsRoot(cwd), runId, 'ledger.json'));
  const baseSha = ledger.baseSha;
  const subjectHead = spawnSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).stdout.trim();
  const evidence = {
    runId,
    status: 'VERIFIED',
    baseSha,
    subjectHead,
    diffDigest: `sha256:${createHash('sha256')
      .update(spawnSync('git', ['diff', '--binary', `${baseSha}..${subjectHead}`], {
        cwd,
        encoding: 'buffer',
      }).stdout)
      .digest('hex')}`,
    oracle: { command: ledger.closeoutCommand, status: 0, signal: null },
    ...(ledger.endpoint && ledger.endpoint !== 'local-only'
      ? { prUrl: 'https://github.com/fixture/repo/pull/1' }
      : {}),
    ...overrides,
  };
  const p = path.join(runsRoot(cwd), runId, 'evidence', 'closeout.json');
  fs.writeFileSync(p, JSON.stringify(evidence));
  return p;
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

describe('work-run budget', () => {
  it('computes maxIterations = min(30, max(10, storyCount*2 + riskBonus))', () => {
    // 3 stories, no risk => max(10, 6) = 10
    assert.equal(computeBudget(3, 0), 10);
    // 8 stories => max(10, 16) = 16
    assert.equal(computeBudget(8, 0), 16);
    // 8 stories + risk 4 => 20
    assert.equal(computeBudget(8, 4), 20);
    // huge => ceiling 30
    assert.equal(computeBudget(100, 4), 30);
  });
});

// Import computeBudget by running CLI formula tests via init output
import { computeMaxIterations as computeBudget } from '../scripts/work-run.mjs';

describe('work-run init', () => {
  let repo;
  beforeEach(() => {
    repo = makeRepo();
  });
  afterEach(() => {
    fs.rmSync(repo, { recursive: true, force: true });
    fs.rmSync(runsRoot(repo), { recursive: true, force: true });
  });

  it('creates run dir, ACTIVE, sealed budget, progress, handoff', () => {
    const stories = JSON.stringify([
      {
        id: 'US-001',
        title: 'A',
        description: 'd',
        acceptanceCriteria: ['c1'],
        priority: 1,
        passes: false,
      },
      {
        id: 'US-002',
        title: 'B',
        description: 'd',
        acceptanceCriteria: ['c2'],
        priority: 2,
        passes: false,
      },
    ]);
    const storiesPath = path.join(repo, 'stories.json');
    fs.writeFileSync(storiesPath, stories);

    const r = run(
      [
        'init',
        '--run-id',
        'demo-run',
        '--project',
        'demo',
        '--branch',
        'feature/demo',
        '--description',
        'Demo work',
        '--stories-file',
        storiesPath,
      ],
      repo,
    );
    assert.equal(r.status, 0, r.stderr + r.stdout);

    const active = fs.readFileSync(path.join(runsRoot(repo), 'ACTIVE'), 'utf8').trim();
    assert.equal(active, 'demo-run');

    const ledger = readJson(path.join(runsRoot(repo), 'demo-run/ledger.json'));
    assert.equal(ledger.version, 1);
    assert.equal(ledger.userStories.length, 2);
    assert.equal(ledger.maxIterations, 10); // 2 stories * 2 = 4 -> floor 10
    assert.ok(ledger.budgetSealedAt);
    assert.equal(ledger.iteration, 0);
    assert.equal(ledger.status, 'active');
    assert.equal(ledger.endpoint, 'local-only');

    assert.ok(fs.existsSync(path.join(runsRoot(repo), 'demo-run/progress.md')));
    assert.ok(fs.existsSync(path.join(runsRoot(repo), 'demo-run/handoff.md')));
  });
  it('requires an explicit known endpoint and leaves legacy schema records optional', () => {
    const storiesPath = path.join(repo, 'endpoint-stories.json');
    fs.writeFileSync(storiesPath, JSON.stringify([
      { id: 'A', title: 'A', acceptanceCriteria: ['A'], passes: false },
    ]));
    const args = [
      'init', '--run-id', 'endpoint-required', '--project', 'fixture',
      '--branch', 'fixture', '--description', 'endpoint is explicit',
      '--stories-file', storiesPath,
    ];
    const missing = run(args, repo, {}, { defaultEndpoint: false });
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /--endpoint/);
    const unknown = run([...args, '--endpoint', 'preview'], repo);
    assert.notEqual(unknown.status, 0);
    assert.match(unknown.stderr, /unknown --endpoint/);
    const schema = readJson(path.join(__dirname, '..', 'assets', 'ledger.schema.json'));
    assert.ok(!schema.required.includes('endpoint'));
    assert.deepEqual(schema.properties.endpoint.enum, ['pr', 'merge', 'staging', 'deploy', 'local-only']);
  });

  it('rejects second init for same run-id without --force', () => {
    const storiesPath = path.join(repo, 'stories.json');
    fs.writeFileSync(
      storiesPath,
      JSON.stringify([
        {
          id: 'US-001',
          title: 'A',
          description: 'd',
          acceptanceCriteria: ['c'],
          priority: 1,
          passes: false,
        },
      ]),
    );
    const args = [
      'init',
      '--run-id',
      'x',
      '--project',
      'p',
      '--branch',
      'b',
      '--description',
      'd',
      '--stories-file',
      storiesPath,
    ];
    assert.equal(run(args, repo).status, 0);
    const r2 = run(args, repo);
    assert.notEqual(r2.status, 0);
  });
  it('rejects force-overwrite of an active run', () => {
    const storiesPath = path.join(os.tmpdir(), `${path.basename(repo)}-force-stories.json`);
    fs.writeFileSync(
      storiesPath,
      JSON.stringify([{ id: 'US-001', title: 'A', acceptanceCriteria: ['c'], passes: false }]),
    );
    const args = [
      'init',
      '--run-id',
      'active-run',
      '--project',
      'p',
      '--branch',
      'b',
      '--description',
      'd',
      '--stories-file',
      storiesPath,
    ];
    assert.equal(run(args, repo).status, 0);
    const forced = run([...args, '--force'], repo);
    assert.notEqual(forced.status, 0);
    assert.match(forced.stderr + forced.stdout, /cannot overwrite active/i);
  });
  it('rejects caller safeguards-evidence override at init', () => {
    const storiesPath = path.join(repo, 'stories.json');
    fs.writeFileSync(storiesPath, JSON.stringify([{ id: 'US-001', title: 'A', acceptanceCriteria: ['c'], passes: false }]));
    const forgedPath = path.join(repo, 'forged.json');
    fs.writeFileSync(forgedPath, JSON.stringify({ status: 'admitted' }));
    const r = run([
      'init', '--run-id', 'no-override', '--project', 'p', '--branch', 'b',
      '--description', 'd', '--stories-file', storiesPath, '--endpoint', 'staging',
      '--safeguards-evidence', forgedPath,
    ], repo);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /caller safeguards evidence override is rejected/i);
  });
});

describe('work-run pick / mark-pass / seal', () => {
  let repo;
  beforeEach(() => {
    repo = makeRepo();
    const storiesPath = path.join(os.tmpdir(), `${path.basename(repo)}-stories.json`);
    fs.writeFileSync(
      storiesPath,
      JSON.stringify([
        {
          id: 'US-002',
          title: 'Second',
          description: 'd',
          acceptanceCriteria: ['c'],
          priority: 2,
          passes: false,
        },
        {
          id: 'US-001',
          title: 'First',
          description: 'd',
          acceptanceCriteria: ['c'],
          priority: 1,
          passes: false,
        },
      ]),
    );
    const r = run(
      [
        'init',
        '--run-id',
        'pick-run',
        '--project',
        'p',
        '--branch',
        'b',
        '--description',
        'd',
        '--stories-file',
        storiesPath,
      ],
      repo,
    );
    assert.equal(r.status, 0, r.stderr);
  });
  afterEach(() => {
    fs.rmSync(repo, { recursive: true, force: true });
    fs.rmSync(runsRoot(repo), { recursive: true, force: true });
  });

  it('picks highest priority incomplete story', () => {
    const r = run(['pick'], repo);
    assert.equal(r.status, 0, r.stderr);
    const picked = JSON.parse(r.stdout);
    assert.equal(picked.id, 'US-001');
  });

  it('mark-pass then pick next', () => {
    assert.equal(run(['mark-pass', '--story', 'US-001', '--note', 'done'], repo).status, 0);
    const r = run(['pick'], repo);
    const picked = JSON.parse(r.stdout);
    assert.equal(picked.id, 'US-002');
  });

  it('rejects raising maxIterations after seal', () => {
    const r = run(['set-max', '--max-iterations', '99'], repo);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr + r.stdout, /seal|sealed|forbidden|cannot/i);
    const ledger = readJson(path.join(runsRoot(repo), 'pick-run/ledger.json'));
    assert.notEqual(ledger.maxIterations, 99);
  });

  it('bump-iteration refuses past sealed max', () => {
    const ledgerPath = path.join(runsRoot(repo), 'pick-run/ledger.json');
    const ledger = readJson(ledgerPath);
    ledger.maxIterations = 1;
    ledger.iteration = 1;
    fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2));
    const r = run(['bump-iteration'], repo);
    assert.notEqual(r.status, 0);
  });

  it('status reports remaining incomplete', () => {
    const r = run(['status'], repo);
    assert.equal(r.status, 0);
    const s = JSON.parse(r.stdout);
    assert.equal(s.runId, 'pick-run');
    assert.equal(s.incomplete, 2);
    assert.equal(s.complete, 0);
  });

  it('keeps closeout deadlines above slow project-oracle runtimes', () => {
    assert.ok(CLOSEOUT_ORACLE_TIMEOUT_MS >= 360_000);
    assert.ok(CLOSEOUT_VERIFIER_TIMEOUT_MS >= CLOSEOUT_ORACLE_TIMEOUT_MS + 60_000);
  });

  it(
    'requires bound verified closeout before emitting WORK_RUN_COMPLETE',
    () => {
    run(['mark-pass', '--story', 'US-001'], repo);
    run(['mark-pass', '--story', 'US-002'], repo);
    const blocked = run(['complete'], repo);
    assert.notEqual(blocked.status, 0);
    assert.match(blocked.stderr + blocked.stdout, /closeout|verified/i);
    assert.doesNotMatch(blocked.stdout, /WORK_RUN_COMPLETE/);

    const forged = closeoutEvidence(repo, { runId: 'other-run' });
    const rejected = run(['complete', '--closeout-evidence', forged], repo);
    assert.notEqual(rejected.status, 0);
    assert.match(rejected.stderr + rejected.stdout, /unbound|incomplete|verified/i);

    const valid = closeoutEvidence(repo);
    const r = run(['complete', '--closeout-evidence', valid], repo);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /WORK_RUN_COMPLETE/);
    const ledger = readJson(path.join(runsRoot(repo), 'pick-run/ledger.json'));
    assert.equal(ledger.closeoutOracle.status, 'pass');
    assert.equal(ledger.closeoutOracle.verifier, 'closeout-verify.mjs');
  });
  it(
    'rejects a failing project oracle despite matching metadata',
    () => {
    const failingRepo = makeRepo(true);
    const storiesPath = path.join(os.tmpdir(), `${path.basename(failingRepo)}-stories.json`);
    fs.writeFileSync(
      storiesPath,
      JSON.stringify([
        { id: 'US-001', title: 'A', acceptanceCriteria: ['c'], passes: false },
        { id: 'US-002', title: 'B', acceptanceCriteria: ['c'], passes: false },
      ]),
    );
    const init = run(
      [
        'init',
        '--run-id',
        'pick-run',
        '--project',
        'p',
        '--branch',
        'b',
        '--description',
        'd',
        '--stories-file',
        storiesPath,
      ],
      failingRepo,
    );
    assert.equal(init.status, 0, init.stderr);
    run(['mark-pass', '--story', 'US-001'], failingRepo);
    run(['mark-pass', '--story', 'US-002'], failingRepo);
    const rejected = run(
      ['complete', '--closeout-evidence', closeoutEvidence(failingRepo)],
      failingRepo,
    );
    assert.notEqual(rejected.status, 0);
    assert.match(rejected.stderr + rejected.stdout, /project oracle/i);
    fs.rmSync(failingRepo, { recursive: true, force: true });
    fs.rmSync(runsRoot(failingRepo), { recursive: true, force: true });
  });
  it(
    'rejects closeout when the worktree is dirty',
    () => {
    run(['mark-pass', '--story', 'US-001'], repo);
    run(['mark-pass', '--story', 'US-002'], repo);
    fs.writeFileSync(path.join(repo, 'dirty.txt'), 'uncommitted');
    const rejected = run(
      ['complete', '--closeout-evidence', closeoutEvidence(repo)],
      repo,
    );
    assert.notEqual(rejected.status, 0);
    assert.match(rejected.stderr + rejected.stdout, /clean Git worktree/i);
  });

  it('cancel clears ACTIVE and preserves ledger', () => {
    assert.equal(run(['cancel'], repo).status, 0);
    assert.ok(!fs.existsSync(path.join(runsRoot(repo), 'ACTIVE')));
    assert.ok(fs.existsSync(path.join(runsRoot(repo), 'pick-run/ledger.json')));
    const ledger = readJson(path.join(runsRoot(repo), 'pick-run/ledger.json'));
    assert.equal(ledger.status, 'cancelled');
  });

  it('mark-blocked sets blockedReason and status', () => {
    assert.equal(
      run(['mark-blocked', '--story', 'US-001', '--reason', 'tests red after remediation'], repo)
        .status,
      0,
    );
    const ledger = readJson(path.join(runsRoot(repo), 'pick-run/ledger.json'));
    const story = ledger.userStories.find((s) => s.id === 'US-001');
    assert.equal(story.blockedReason, 'tests red after remediation');
    assert.equal(ledger.status, 'active');
  });
});

describe('accepted autonomy global enforcement', () => {
  let repo;
  let storiesPath;
  beforeEach(() => {
    repo = makeRepo();
    storiesPath = path.join(repo, 'accepted-stories.json');
    fs.writeFileSync(storiesPath, JSON.stringify([
      { id: 'A', title: 'A', acceptanceCriteria: ['A'], priority: 1, passes: false },
      { id: 'B', title: 'B', acceptanceCriteria: ['B'], priority: 3, passes: false },
      { id: 'C', title: 'C', acceptanceCriteria: ['C'], priority: 2, passes: false, tags: ['serial-after:A'] },
    ]));
  });
  afterEach(() => {
    fs.rmSync(repo, { recursive: true, force: true });
    fs.rmSync(runsRoot(repo), { recursive: true, force: true });
  });
  const init = (endpoint, runId = 'accepted-global') => run([
    'init', '--run-id', runId, '--project', 'fixture',
    '--branch', 'fixture', '--description', 'accepted global boundaries',
    '--stories-file', storiesPath, '--endpoint', endpoint, '--max-iterations', '8',
  ], repo);
  const commitStories = () => {
    assert.equal(spawnSync('git', ['add', 'accepted-stories.json'], { cwd: repo }).status, 0);
    assert.equal(spawnSync('git', [
      '-c', 'core.hooksPath=/dev/null', 'commit', '--no-gpg-sign', '-q', '-m', 'fixture stories',
    ], { cwd: repo }).status, 0);
  };

  it('accepts assigned staging and local-only product targets without a PR-only restriction', () => {
    assert.equal(init('staging').status, 0);
    const ledgerPath = path.join(runsRoot(repo), 'accepted-global', 'ledger.json');
    const before = fs.readFileSync(ledgerPath);
    assert.equal(readJson(ledgerPath).endpoint, 'staging');
    assert.notEqual(run(['set-max', '--max-iterations', '20'], repo).status, 0);
    assert.deepEqual(fs.readFileSync(ledgerPath), before);
    assert.equal(run(['cancel'], repo).status, 0);
    const local = run([
      'init', '--run-id', 'accepted-local', '--project', 'fixture', '--branch', 'fixture',
      '--description', 'explicit local-only product assignment',
      '--stories-file', storiesPath, '--endpoint', 'local-only',
    ], repo);
    assert.equal(local.status, 0, local.stderr);
  });

  it('parks only the failed story and its dependency, then the actual loop schedules B', () => {
    assert.equal(init('pr').status, 0);
    assert.equal(run(['mark-blocked', '--story', 'A', '--reason', 'physical-presence'], repo).status, 0);
    assert.equal(readJson(path.join(runsRoot(repo), 'accepted-global', 'ledger.json')).status, 'active');
    assert.equal(JSON.parse(run(['pick'], repo).stdout).id, 'B');
    const loop = spawnSync('bash', [path.join(__dirname, '..', 'scripts', 'work-run-loop.sh'), '--run-id', 'accepted-global', '--dry-run', '--max-iterations', '1'], {
      cwd: repo, encoding: 'utf8',
      env: { ...process.env, AGENT_RUNS_ROOT: runsRoot(repo) },
    });
    assert.match(loop.stdout, /\[dry-run\] would spawn/);
    assert.equal(run(['mark-pass', '--story', 'B'], repo).status, 0);
    assert.equal(JSON.parse(run(['pick'], repo).stdout).story, null);
    assert.equal(JSON.parse(run(['status'], repo).stdout).completion, undefined);
  });

  it('requires the current GitHub PR head for PR completion', () => {
    commitStories();
    assert.equal(init('pr').status, 0);
    for (const story of ['A', 'B', 'C']) assert.equal(run(['mark-pass', '--story', story], repo).status, 0);
    const args = ['complete', '--closeout-evidence', closeoutEvidence(repo, {}, 'accepted-global')];
    const stale = run(args, repo, { FAKE_GH_MODE: 'stale-head' });
    assert.notEqual(stale.status, 0);
    assert.match(stale.stderr + stale.stdout, /PR head SHA/i);
    const current = run(args, repo, { FAKE_GH_MODE: 'open' });
    assert.equal(current.status, 0, current.stderr + current.stdout);
  });

  it('requires merge metadata for merge completion without requiring live proof', () => {
    commitStories();
    assert.equal(init('merge').status, 0);
    for (const story of ['A', 'B', 'C']) assert.equal(run(['mark-pass', '--story', story], repo).status, 0);
    const args = ['complete', '--closeout-evidence', closeoutEvidence(repo, {}, 'accepted-global')];
    const unmerged = run(args, repo, { FAKE_GH_MODE: 'open' });
    assert.notEqual(unmerged.status, 0);
    assert.match(unmerged.stderr + unmerged.stdout, /actual merge evidence/i);
    const merged = run(args, repo, { FAKE_GH_MODE: 'merged' });
    assert.equal(merged.status, 0, merged.stderr + merged.stdout);
  });

  it('completes local-only and legacy ledgers without PR metadata', () => {
    commitStories();
    assert.equal(init('local-only').status, 0);
    for (const story of ['A', 'B', 'C']) assert.equal(run(['mark-pass', '--story', story], repo).status, 0);
    assert.equal(
      run(['complete', '--closeout-evidence', closeoutEvidence(repo, {}, 'accepted-global')], repo).status,
      0,
    );

    assert.equal(init('local-only', 'accepted-legacy').status, 0);
    for (const story of ['A', 'B', 'C']) assert.equal(run(['mark-pass', '--story', story], repo).status, 0);
    const ledgerPath = path.join(runsRoot(repo), 'accepted-legacy', 'ledger.json');
    const ledger = readJson(ledgerPath);
    delete ledger.endpoint;
    fs.writeFileSync(ledgerPath, JSON.stringify(ledger));
    const evidence = closeoutEvidence(repo, {}, 'accepted-legacy');
    const completed = run(['complete', '--closeout-evidence', evidence], repo);
    assert.equal(completed.status, 0, completed.stderr + completed.stdout);
  });

  it('cannot verify staging from a PR and a bare passing project check', () => {
    commitStories();
    assert.equal(init('staging').status, 0);
    const ledgerPath = path.join(runsRoot(repo), 'accepted-global', 'ledger.json');
    for (const story of ['A', 'B', 'C']) assert.equal(run(['mark-pass', '--story', story], repo).status, 0);
    const result = run([
      'complete', '--closeout-evidence', closeoutEvidence(repo, {}, 'accepted-global'),
    ], repo, { FAKE_GH_MODE: 'merged' });
    assert.notEqual(result.status, 0);
    assert.equal(readJson(ledgerPath).status, 'active');
  });
  it('verifies staging only from actual merge metadata and fresh fixed-probe observations', () => {
    const observationPath = path.join(runsRoot(repo), 'runtime-observation.json');
    fs.mkdirSync(runsRoot(repo), { recursive: true });
    fs.writeFileSync(path.join(repo, 'delivery-probe.mjs'), `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const observation = JSON.parse(fs.readFileSync(${JSON.stringify(observationPath)}, 'utf8'));
const subjectHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
process.stdout.write(JSON.stringify({ deliveryProof: { ...observation, subjectHead } }));
`);
    fs.writeFileSync(path.join(repo, 'closeout-command.json'),
      JSON.stringify({ closeoutCommand: [process.execPath, 'delivery-probe.mjs'] }));
    assert.equal(spawnSync('git', ['add', 'accepted-stories.json', 'delivery-probe.mjs', 'closeout-command.json'], { cwd: repo }).status, 0);
    assert.equal(spawnSync('git', [
      '-c', 'core.hooksPath=/dev/null', 'commit', '--no-gpg-sign', '-q', '-m', 'fixed delivery probe',
    ], { cwd: repo }).status, 0);
    const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).stdout.trim();
    const expected = {
      endpoint: 'staging', environment: 'staging', runtimeSha: head,
      checksPassed: true, expectedRuntimeVersion: 'fixture-v1', runtimeVersion: 'fixture-v1',
      expectedArtifactSha: 'a'.repeat(64), artifactSha: 'a'.repeat(64),
      releaseSafeguards: {
        repo: resolveExpectedRepo(repo),
        surface: 'staging-service',
        environment: 'staging',
        changeIdentity: head,
        evaluatedAt: new Date().toISOString(),
        staging: {
          validated: true,
          isolatedFromProduction: true,
          blastRadius: 'internal-staging',
          probeUrl: 'https://staging.internal/health',
          promotionCriteria: 'error_rate < 0.001 for 10m',
        },
        detection: {
          owner: 'oncall-team',
          signal: 'p99_latency_ms > 500',
          trigger: 'error_rate > 0.01',
          deployedIdentityBound: true,
        },
        rollback: {
          exercised: true,
          immutableTarget: 'a'.repeat(64),
          recoveryTarget: '120s',
          schemaCompatible: true,
        },
      },
    };
    const writeObservation = (overrides = {}) =>
      fs.writeFileSync(observationPath, JSON.stringify({ ...expected, ...overrides }));
    writeObservation();
    assert.equal(init('staging').status, 0);
    for (const story of ['A', 'B', 'C']) assert.equal(run(['mark-pass', '--story', story], repo).status, 0);
    const evidence = closeoutEvidence(repo, {}, 'accepted-global');
    const wrongMerge = run(
      ['complete', '--closeout-evidence', evidence],
      repo,
      { FAKE_GH_MODE: 'wrong-merge' },
    );
    assert.notEqual(wrongMerge.status, 0);
    assert.doesNotMatch(wrongMerge.stdout, /WORK_RUN_COMPLETE/);
    writeObservation({ environment: 'production' });
    const wrongEnvironment = run(
      ['complete', '--closeout-evidence', evidence],
      repo,
      { FAKE_GH_MODE: 'merged' },
    );
    assert.notEqual(wrongEnvironment.status, 0);
    writeObservation();
    const result = run(
      ['complete', '--closeout-evidence', evidence],
      repo,
      { FAKE_GH_MODE: 'merged' },
    );
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.equal(readJson(path.join(runsRoot(repo), 'accepted-global', 'ledger.json')).status, 'completed');

    writeObservation({
      endpoint: 'deploy',
      environment: 'production',
      releaseSafeguards: {
        ...expected.releaseSafeguards,
        surface: 'deploy-service',
        environment: 'production',
        staging: {
          ...expected.releaseSafeguards.staging,
          blastRadius: 'canary-10pct',
        },
      },
    });
    assert.equal(init('deploy', 'accepted-deploy').status, 0);
    for (const story of ['A', 'B', 'C']) assert.equal(run(['mark-pass', '--story', story], repo).status, 0);
    const deployEvidence = closeoutEvidence(repo, {}, 'accepted-deploy');
    const deploy = run(
      ['complete', '--closeout-evidence', deployEvidence],
      repo,
      { FAKE_GH_MODE: 'merged' },
    );
    assert.equal(deploy.status, 0, deploy.stderr + deploy.stdout);
  });

  it('rejects closeout when oracle lacks releaseSafeguards even if caller supplies forged evidence', () => {
    const observationPath = path.join(runsRoot(repo), 'runtime-observation.json');
    fs.mkdirSync(runsRoot(repo), { recursive: true });
    fs.writeFileSync(path.join(repo, 'delivery-probe.mjs'), `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const observation = JSON.parse(fs.readFileSync(${JSON.stringify(observationPath)}, 'utf8'));
const subjectHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
process.stdout.write(JSON.stringify({ deliveryProof: { ...observation, subjectHead } }));
`);
    fs.writeFileSync(path.join(repo, 'closeout-command.json'),
      JSON.stringify({ closeoutCommand: [process.execPath, 'delivery-probe.mjs'] }));
    assert.equal(spawnSync('git', ['add', 'accepted-stories.json', 'delivery-probe.mjs', 'closeout-command.json'], { cwd: repo }).status, 0);
    assert.equal(spawnSync('git', [
      '-c', 'core.hooksPath=/dev/null', 'commit', '--no-gpg-sign', '-q', '-m', 'probe lacking safeguards',
    ], { cwd: repo }).status, 0);
    const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).stdout.trim();
    const probeObservation = {
      endpoint: 'staging', environment: 'staging', runtimeSha: head,
      checksPassed: true, expectedRuntimeVersion: 'fixture-v1', runtimeVersion: 'fixture-v1',
      expectedArtifactSha: 'a'.repeat(64), artifactSha: 'a'.repeat(64),
    };
    fs.writeFileSync(observationPath, JSON.stringify(probeObservation));
    assert.equal(init('staging', 'staging-missing-safeguards').status, 0);
    for (const story of ['A', 'B', 'C']) assert.equal(run(['mark-pass', '--story', story], repo).status, 0);
    const forgedSafeguards = {
      repo: resolveExpectedRepo(repo),
      surface: 'staging-service',
      environment: 'staging',
      changeIdentity: head,
      evaluatedAt: new Date().toISOString(),
      staging: { validated: true, isolatedFromProduction: true, blastRadius: 'internal-staging', probeUrl: 'https://staging.internal/health', promotionCriteria: 'ok' },
      detection: { owner: 'team', signal: 'err > 0', trigger: 'alert', deployedIdentityBound: true },
      rollback: { exercised: true, immutableTarget: 'a'.repeat(64), recoveryTarget: '120s', schemaCompatible: true },
    };
    const evidencePath = closeoutEvidence(repo, { releaseSafeguards: forgedSafeguards }, 'staging-missing-safeguards');
    const result = run(['complete', '--closeout-evidence', evidencePath], repo, { FAKE_GH_MODE: 'merged' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /requires verified release safeguards admission in project oracle delivery observations/i);
  });
});

describe('release safeguards admission enforcement', () => {
  let repo;
  beforeEach(() => {
    repo = makeRepo();
  });
  afterEach(() => {
    fs.rmSync(repo, { recursive: true, force: true });
    fs.rmSync(runsRoot(repo), { recursive: true, force: true });
  });

  const validSafeguards = (cwd) => {
    const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).stdout.trim();
    return {
      repo: resolveExpectedRepo(cwd),
      surface: 'backend-api',
      environment: 'staging',
      changeIdentity: head,
      evaluatedAt: new Date().toISOString(),
      staging: {
        validated: true,
        isolatedFromProduction: true,
        blastRadius: 'internal-staging',
        probeUrl: 'https://staging.internal/probe',
        promotionCriteria: 'error_rate < 0.001 for 10m',
      },
      detection: {
        owner: 'core-team',
        signal: 'http_error_rate_5xx > 0.01',
        trigger: 'threshold_exceeded',
        deployedIdentityBound: true,
      },
      rollback: {
        exercised: true,
        immutableTarget: 'a'.repeat(64),
        recoveryTarget: '120s',
        schemaCompatible: true,
      },
    };
  };

  const commitProbe = (safeguardsPayload) => {
    fs.writeFileSync(
      path.join(repo, 'admission-probe.mjs'),
      `import { execFileSync } from 'node:child_process';
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const payload = ${JSON.stringify(safeguardsPayload)};
if (!payload.changeIdentity || payload.changeIdentity !== 'stale-head') {
  payload.changeIdentity = head;
}
process.stdout.write(JSON.stringify({ releaseSafeguards: payload }));
`,
    );
    fs.writeFileSync(
      path.join(repo, 'closeout-command.json'),
      JSON.stringify({ closeoutCommand: [process.execPath, 'admission-probe.mjs'] }),
    );
    spawnSync('git', ['add', 'admission-probe.mjs', 'closeout-command.json'], { cwd: repo });
    spawnSync('git', ['-c', 'core.hooksPath=/dev/null', 'commit', '--no-gpg-sign', '-q', '-m', 'set admission probe'], { cwd: repo });
  };

  it('rejects caller probe-command or subject-head overrides', () => {
    const probeOverride = run(['admission', '--probe-command', 'echo 1'], repo);
    assert.notEqual(probeOverride.status, 0);
    assert.match(probeOverride.stderr + probeOverride.stdout, /caller probe command override is rejected/i);

    const headOverride = run(['admission', '--subject-head', 'a'.repeat(40)], repo);
    assert.notEqual(headOverride.status, 0);
    assert.match(headOverride.stderr + headOverride.stdout, /caller subject-head override is rejected/i);
  });

  it('rejects forged caller JSON assertions when unconfirmed by controller probe', () => {
    const forged = validSafeguards(repo);
    commitProbe(forged);
    const evPath = path.join(repo, 'forged-caller-assertions.json');
    fs.writeFileSync(evPath, JSON.stringify({ ...forged, repo: 'local:/nonexistent/other-repo' }));
    const res = run(['admission', '--evidence', evPath, '--endpoint', 'staging'], repo);
    assert.notEqual(res.status, 0);
    assert.match(res.stdout + res.stderr, /repo binding mismatch/i);
  });

  it('admits release safeguards from a real controller-executed baseline probe drill', () => {
    const safeguards = validSafeguards(repo);
    commitProbe(safeguards);

    const res = run(['admission', '--endpoint', 'staging'], repo);
    assert.equal(res.status, 0, res.stderr + res.stdout);
    const out = JSON.parse(res.stdout);
    assert.equal(out.status, 'admitted');
  });

  it('rejects unbounded staging blast radius or missing promotion criteria', () => {
    const ev1 = validSafeguards(repo);
    ev1.staging.blastRadius = 'unbounded';
    commitProbe(ev1);
    const res1 = run(['admission', '--endpoint', 'staging'], repo);
    assert.notEqual(res1.status, 0);
    assert.match(res1.stdout + res1.stderr, /bounded blast radius/i);

    const ev2 = validSafeguards(repo);
    delete ev2.staging.promotionCriteria;
    commitProbe(ev2);
    const res2 = run(['admission', '--endpoint', 'staging'], repo);
    assert.notEqual(res2.status, 0);
    assert.match(res2.stdout + res2.stderr, /promotion criteria/i);
  });

  it('rejects mutable rollback targets and unmeasured recovery targets', () => {
    const ev1 = validSafeguards(repo);
    ev1.rollback.immutableTarget = 'latest';
    commitProbe(ev1);
    const res1 = run(['admission', '--endpoint', 'staging'], repo);
    assert.notEqual(res1.status, 0);
    assert.match(res1.stdout + res1.stderr, /immutable artifact/i);

    const ev2 = validSafeguards(repo);
    ev2.rollback.recoveryTarget = 'fast';
    commitProbe(ev2);
    const res2 = run(['admission', '--endpoint', 'staging'], repo);
    assert.notEqual(res2.status, 0);
    assert.match(res2.stdout + res2.stderr, /measured recovery time/i);
  });
  it('rejects deployment endpoint attempting not_applicable', () => {
    const ev = {
      repo: resolveExpectedRepo(repo),
      surface: 'backend-api',
      environment: 'staging',
      changeIdentity: spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).stdout.trim(),
      evaluatedAt: new Date().toISOString(),
      status: 'not_applicable',
      notApplicableReason: 'attempted bypass on staging endpoint',
    };
    const p = path.join(repo, 'na-deploy.json');
    fs.writeFileSync(p, JSON.stringify(ev));
    const res = run(['admission', '--evidence', p, '--endpoint', 'staging'], repo);
    assert.notEqual(res.status, 0);
    assert.match(res.stdout + res.stderr, /release targets cannot claim not_applicable/i);
  });

  it('rejects wrong repository host or owner even when repository basename matches', () => {
    spawnSync('git', ['remote', 'add', 'origin', 'https://github.com/fixture/repo.git'], { cwd: repo });
    const wrongOwner = validSafeguards(repo);
    wrongOwner.repo = 'github.com/attacker/repo';
    commitProbe(wrongOwner);
    const resOwner = run(['admission', '--endpoint', 'staging'], repo);
    assert.notEqual(resOwner.status, 0);
    assert.match(resOwner.stdout + resOwner.stderr, /repo binding mismatch/i);

    const wrongHost = validSafeguards(repo);
    wrongHost.repo = 'gitlab.com/fixture/repo';
    commitProbe(wrongHost);
    const resHost = run(['admission', '--endpoint', 'staging'], repo);
    assert.notEqual(resHost.status, 0);
    assert.match(resHost.stdout + resHost.stderr, /repo binding mismatch/i);
  });

  it('rejects wrong environment, stale changeIdentity, or expired timestamp', () => {
    const evWrongEnv = validSafeguards(repo);
    evWrongEnv.environment = 'production';
    commitProbe(evWrongEnv);
    const resEnv = run(['admission', '--endpoint', 'staging'], repo);
    assert.notEqual(resEnv.status, 0);
    assert.match(resEnv.stdout + resEnv.stderr, /environment mismatch/i);

    const evStale = validSafeguards(repo);
    evStale.changeIdentity = 'stale-head';
    commitProbe(evStale);
    const resStale = run(['admission', '--endpoint', 'staging'], repo);
    assert.notEqual(resStale.status, 0);
    assert.match(resStale.stdout + resStale.stderr, /changeIdentity mismatch/i);

    const evExpired = validSafeguards(repo);
    evExpired.evaluatedAt = new Date(Date.now() - 7200000).toISOString();
    commitProbe(evExpired);
    const resExpired = run(['admission', '--endpoint', 'staging'], repo);
    assert.notEqual(resExpired.status, 0);
    assert.match(resExpired.stdout + resExpired.stderr, /freshness evidence expired/i);
  });

  it('rejects candidate closeout-command.json replacement from authorizing dispatch', () => {
    const storiesFile = path.join(repo, 'staged-stories.json');
    fs.writeFileSync(storiesFile, JSON.stringify([
      { id: 'US-001', title: 'Prod Release Action', acceptanceCriteria: ['ok'], priority: 1, passes: false, tags: ['release'] },
    ]));
    assert.equal(run(['init', '--run-id', 'tamper-run', '--project', 'fixture', '--branch', 'fixture', '--description', 'tamper test', '--stories-file', storiesFile, '--endpoint', 'staging'], repo).status, 0);

    const fakeSafeguards = validSafeguards(repo);
    fs.writeFileSync(path.join(repo, 'fake-probe.mjs'), `process.stdout.write(JSON.stringify({ releaseSafeguards: ${JSON.stringify(fakeSafeguards)} }));`);
    fs.writeFileSync(path.join(repo, 'closeout-command.json'), JSON.stringify({ closeoutCommand: [process.execPath, 'fake-probe.mjs'] }));
    spawnSync('git', ['add', 'fake-probe.mjs', 'closeout-command.json'], { cwd: repo });
    spawnSync('git', ['-c', 'core.hooksPath=/dev/null', 'commit', '--no-gpg-sign', '-q', '-m', 'tamper closeout command'], { cwd: repo });

    const pick = JSON.parse(run(['pick', '--run-id', 'tamper-run'], repo).stdout);
    assert.equal(pick.story, null);

    const bump = run(['bump-iteration', '--run-id', 'tamper-run', '--story', 'US-001'], repo);
    assert.notEqual(bump.status, 0);
    assert.match(bump.stderr, /selected story is gated, dependent, cancelled, or globally suspended/i);
  });

  it('denies bump-iteration and child launch on dependent release story when safeguards change after initial admission', () => {
    const validState = validSafeguards(repo);
    commitProbe(validState);

    const storiesFile = path.join(repo, 'staged-stories.json');
    fs.writeFileSync(storiesFile, JSON.stringify([
      { id: 'US-001', title: 'Prerequisite Fix', acceptanceCriteria: ['ok'], priority: 1, passes: false, classification: 'prerequisite' },
      { id: 'US-002', title: 'Prod Release Action', acceptanceCriteria: ['ok'], priority: 2, passes: false, tags: ['release'], surface: 'backend-api' },
    ]));
    assert.equal(run(['init', '--run-id', 'preaction-run', '--project', 'fixture', '--branch', 'fixture', '--description', 'preaction test', '--stories-file', storiesFile, '--endpoint', 'staging'], repo).status, 0);

    const pick1 = JSON.parse(run(['pick', '--run-id', 'preaction-run'], repo).stdout);
    assert.equal(pick1.id, 'US-001');
    assert.equal(run(['mark-pass', '--run-id', 'preaction-run', '--story', 'US-001'], repo).status, 0);

    // Tamper probe state: change baseline probe to output invalid/stale safeguards
    fs.writeFileSync(
      path.join(repo, 'admission-probe.mjs'),
      `process.stdout.write(JSON.stringify({ releaseSafeguards: { ...${JSON.stringify(validState)}, changeIdentity: 'stale-head' } }));`,
    );
    spawnSync('git', ['add', 'admission-probe.mjs'], { cwd: repo });
    spawnSync('git', ['-c', 'core.hooksPath=/dev/null', 'commit', '--no-gpg-sign', '-q', '-m', 'stale probe output'], { cwd: repo });

    const pick2 = JSON.parse(run(['pick', '--run-id', 'preaction-run'], repo).stdout);
    assert.equal(pick2.story, null);

    const bump = run(['bump-iteration', '--run-id', 'preaction-run', '--story', 'US-002'], repo);
    assert.notEqual(bump.status, 0);
    assert.match(bump.stderr, /selected story is gated, dependent, cancelled, or globally suspended/i);
  });

  it('denies bump-iteration on release story when probe observations bind a different surface', () => {
    const validState = validSafeguards(repo);
    validState.surface = 'worker-service';
    commitProbe(validState);

    const storiesFile = path.join(repo, 'surface-stories.json');
    fs.writeFileSync(storiesFile, JSON.stringify([
      { id: 'US-001', title: 'Backend Release', acceptanceCriteria: ['ok'], priority: 1, passes: false, tags: ['release'], surface: 'backend-api' },
    ]));
    assert.equal(run(['init', '--run-id', 'wrong-surface-run', '--project', 'fixture', '--branch', 'fixture', '--description', 'surface test', '--stories-file', storiesFile, '--endpoint', 'staging'], repo).status, 0);

    const pick = JSON.parse(run(['pick', '--run-id', 'wrong-surface-run'], repo).stdout);
    assert.equal(pick.story, null);

    const bump = run(['bump-iteration', '--run-id', 'wrong-surface-run', '--story', 'US-001'], repo);
    assert.notEqual(bump.status, 0);
    assert.match(bump.stderr, /selected story is gated, dependent, cancelled, or globally suspended/i);
  });

  it('proves an unclassified release-capable story cannot launch a child while a scoped prerequisite can', () => {
    // Repository without passing release admission probe
    const storiesFile = path.join(repo, 'unclassified-stories.json');
    fs.writeFileSync(storiesFile, JSON.stringify([
      { id: 'US-001', title: 'Scoped Prerequisite Tooling', acceptanceCriteria: ['ok'], priority: 1, passes: false, tags: ['prerequisite'] },
      { id: 'US-002', title: 'Untagged Deployment Story', acceptanceCriteria: ['ok'], priority: 2, passes: false },
    ]));
    assert.equal(run(['init', '--run-id', 'fail-closed-run', '--project', 'fixture', '--branch', 'fixture', '--description', 'fail-closed test', '--stories-file', storiesFile, '--endpoint', 'staging'], repo).status, 0);

    // 1. Explicitly scoped prerequisite is eligible and picked
    const pick1 = JSON.parse(run(['pick', '--run-id', 'fail-closed-run'], repo).stdout);
    assert.equal(pick1.id, 'US-001');

    // Loop would spawn child for US-001
    const loop1 = spawnSync('bash', [LOOP, '--run-id', 'fail-closed-run', '--dry-run', '--max-iterations', '1'], {
      cwd: repo, encoding: 'utf8',
      env: { ...process.env, AGENT_RUNS_ROOT: runsRoot(repo) },
    });
    assert.match(loop1.stdout, /\[dry-run\] would spawn/);

    // Complete prerequisite
    assert.equal(run(['mark-pass', '--run-id', 'fail-closed-run', '--story', 'US-001'], repo).status, 0);

    // 2. Untagged US-002 on staging endpoint is fail-closed: cannot be picked!
    const pick2 = JSON.parse(run(['pick', '--run-id', 'fail-closed-run'], repo).stdout);
    assert.equal(pick2.story, null);

    // bump-iteration refuses
    const bump = run(['bump-iteration', '--run-id', 'fail-closed-run', '--story', 'US-002'], repo);
    assert.notEqual(bump.status, 0);
    assert.match(bump.stderr, /selected story is gated, dependent, cancelled, or globally suspended/i);

    // Loop refuses to launch child and halts
    const loop2 = spawnSync('bash', [LOOP, '--run-id', 'fail-closed-run', '--dry-run', '--max-iterations', '1'], {
      cwd: repo, encoding: 'utf8',
      env: { ...process.env, AGENT_RUNS_ROOT: runsRoot(repo) },
    });
    assert.match(loop2.stderr, /Stopping: status=active reason=no-reachable-story/);
    assert.doesNotMatch(loop2.stdout, /\[dry-run\] would spawn/);
  });

  it('treats explicit release-action classification as release-dependent on pr endpoints', () => {
    const storiesFile = path.join(repo, 'classification-stories.json');
    fs.writeFileSync(storiesFile, JSON.stringify([
      { id: 'US-001', title: 'Release Action Without Tag', acceptanceCriteria: ['ok'], priority: 1, passes: false, classification: 'release-action', surface: 'backend-api' },
    ]));
    assert.equal(run(['init', '--run-id', 'classification-run', '--project', 'fixture', '--branch', 'fixture', '--description', 'classification test', '--stories-file', storiesFile, '--endpoint', 'pr'], repo).status, 0);
    const pick = JSON.parse(run(['pick', '--run-id', 'classification-run'], repo).stdout);
    assert.equal(pick.story, null);
    const bump = run(['bump-iteration', '--run-id', 'classification-run', '--story', 'US-001'], repo);
    assert.notEqual(bump.status, 0);
    assert.match(bump.stderr, /selected story is gated, dependent, cancelled, or globally suspended/i);
  });

  it('fails closed on contradictory prerequisite and release tags', () => {
    const storiesFile = path.join(repo, 'contradictory-stories.json');
    fs.writeFileSync(storiesFile, JSON.stringify([
      { id: 'US-001', title: 'Contradictory Story', acceptanceCriteria: ['ok'], priority: 1, passes: false, tags: ['prerequisite', 'deploy'], surface: 'backend-api' },
    ]));
    assert.equal(run(['init', '--run-id', 'contradictory-run', '--project', 'fixture', '--branch', 'fixture', '--description', 'contradictory test', '--stories-file', storiesFile, '--endpoint', 'pr'], repo).status, 0);
    const pick = JSON.parse(run(['pick', '--run-id', 'contradictory-run'], repo).stdout);
    assert.equal(pick.story, null);
  });

  it('rejects --require-admitted without explicit endpoint and surface bindings', () => {
    const res = run(['admission', '--require-admitted'], repo);
    assert.notEqual(res.status, 0);
    assert.match(res.stderr + res.stdout, /requires explicit --endpoint and --surface/i);
  });

  it('rejects high-impact surface attempting not_applicable via file extension', () => {
    const ev = {
      repo: resolveExpectedRepo(repo),
      surface: 'installer-and-authority-guidance',
      environment: 'local',
      changeIdentity: spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).stdout.trim(),
      evaluatedAt: new Date().toISOString(),
      status: 'not_applicable',
      notApplicableReason: 'low risk markdown docs and scripts',
    };
    const p = path.join(repo, 'high-impact-na.json');
    fs.writeFileSync(p, JSON.stringify(ev));
    const res = run(['admission', '--evidence', p, '--endpoint', 'local-only'], repo);
    assert.notEqual(res.status, 0);
    assert.match(res.stdout + res.stderr, /high-impact surfaces.*cannot bypass release safeguards/i);
  });

  it('admits justified not_applicable on local-only non-high-impact work', () => {
    const ev = {
      repo: resolveExpectedRepo(repo),
      surface: 'local-test-fixture',
      environment: 'local',
      changeIdentity: spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).stdout.trim(),
      evaluatedAt: new Date().toISOString(),
      status: 'not_applicable',
      notApplicableReason: 'local test fixture with no runtime release surface',
    };
    const p = path.join(repo, 'justified-na.json');
    fs.writeFileSync(p, JSON.stringify(ev));
    const res = run(['admission', '--evidence', p, '--endpoint', 'local-only'], repo);
    assert.equal(res.status, 0, res.stderr + res.stdout);
    const out = JSON.parse(res.stdout);
    assert.equal(out.status, 'not_applicable');
  });

  it('rejects not_applicable when --require-admitted is passed for release actuation', () => {
    const ev = {
      repo: resolveExpectedRepo(repo),
      surface: 'local-test-fixture',
      environment: 'local',
      changeIdentity: spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).stdout.trim(),
      evaluatedAt: new Date().toISOString(),
      status: 'not_applicable',
      notApplicableReason: 'local test fixture with no runtime release surface',
    };
    const p = path.join(repo, 'justified-na.json');
    fs.writeFileSync(p, JSON.stringify(ev));

    const resNormal = run(['admission', '--evidence', p, '--endpoint', 'local-only'], repo);
    assert.equal(resNormal.status, 0);
    assert.equal(JSON.parse(resNormal.stdout).status, 'not_applicable');

    const resRelease = run(['admission', '--evidence', p, '--endpoint', 'local-only', '--surface', 'local-test-fixture', '--require-admitted'], repo);
    assert.notEqual(resRelease.status, 0);
    assert.match(resRelease.stdout + resRelease.stderr, /release.*actuation cannot use not_applicable|requires status: admitted/i);
  });
});
it('records an in-flight checkpoint before child release and preserves child outcomes and sealed budget', async () => {
  const scenarios = [
    { name: 'success', exitCode: 0, markPass: true, expectedExit: 0 },
    { name: 'error', exitCode: 23, markPass: false, expectedExit: 1 },
    { name: 'concurrent', exitCode: 0, markPass: false, expectedExit: 1, concurrentUpdate: true },
  ];

  for (const scenario of scenarios) {
    const repo = makeRepo();
    const runId = `checkpoint-${scenario.name}`;
    const root = runsRoot(repo);
    const agentBin = path.join(root, 'test-bin');
    const started = path.join(root, `${scenario.name}.started`);
    const release = path.join(root, `${scenario.name}.release`);
    const clockAdvanced = path.join(root, `${scenario.name}.clock-advanced`);
    const storiesPath = path.join(root, 'single-story.json');
    const evidencePath = path.join(root, runId, 'evidence', 'closeout.json');
    const progressPath = path.join(root, runId, 'progress.md');
    const agentPath = path.join(agentBin, 'claude');
    const clockShim = path.join(root, 'test-clock.sh');
    fs.mkdirSync(agentBin, { recursive: true });
    fs.writeFileSync(storiesPath, JSON.stringify([
      { id: 'ONE', title: 'one', acceptanceCriteria: ['one'], priority: 1, passes: false },
    ]));
    const init = run([
      'init', '--run-id', runId, '--project', 'fixture', '--branch', 'fixture',
      '--description', 'in-flight checkpoint contract',
      '--stories-file', storiesPath, '--max-iterations', '8',
    ], repo);
    assert.equal(init.status, 0, init.stderr);
    closeoutEvidence(repo, {}, runId);
    fs.writeFileSync(agentPath, `#!/usr/bin/env node
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
(async () => {
  fs.writeFileSync(process.env.WORK_RUN_TEST_STARTED, String(process.pid));
  while (!fs.existsSync(process.env.WORK_RUN_TEST_RELEASE)) {
    if (process.env.WORK_RUN_TEST_LEDGER_UPDATE &&
        fs.existsSync(process.env.WORK_RUN_TEST_LEDGER_UPDATE) &&
        !fs.existsSync(process.env.WORK_RUN_TEST_LEDGER_UPDATED)) {
      const mark = spawnSync(process.execPath, [
        process.env.WORK_RUN_TEST_CLI, 'mark-pass',
        '--run-id', process.env.WORK_RUN_TEST_RUN_ID,
        '--story', process.env.WORK_RUN_STORY_ID,
      ], { cwd: process.cwd(), encoding: 'utf8', env: process.env });
      if (mark.status !== 0) {
        process.stderr.write(mark.stderr || mark.stdout);
        process.exit(mark.status || 1);
      }
      fs.writeFileSync(process.env.WORK_RUN_TEST_LEDGER_UPDATED, 'done');
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  if (process.env.WORK_RUN_TEST_MARK_PASS === '1') {
    const mark = spawnSync(process.execPath, [
      process.env.WORK_RUN_TEST_CLI, 'mark-pass',
      '--run-id', process.env.WORK_RUN_TEST_RUN_ID,
      '--story', process.env.WORK_RUN_STORY_ID,
    ], { cwd: process.cwd(), encoding: 'utf8', env: process.env });
    if (mark.status !== 0) {
      process.stderr.write(mark.stderr || mark.stdout);
      process.exit(mark.status || 1);
    }
    const complete = spawnSync(process.execPath, [
      process.env.WORK_RUN_TEST_CLI, 'complete',
      '--run-id', process.env.WORK_RUN_TEST_RUN_ID,
      '--closeout-evidence', process.env.WORK_RUN_TEST_EVIDENCE,
    ], { cwd: process.cwd(), encoding: 'utf8', env: process.env });
    if (complete.status !== 0) {
      process.stderr.write(complete.stderr || complete.stdout);
      process.exit(complete.status || 1);
    }
  }
  process.exit(Number(process.env.WORK_RUN_TEST_EXIT_CODE));
})();
`);
    fs.chmodSync(agentPath, 0o755);
    fs.writeFileSync(clockShim, `sleep() {
  if [[ -n "\${WORK_RUN_TEST_CLOCK_ADVANCE:-}" && ! -e "$WORK_RUN_TEST_CLOCK_ADVANCE" ]]; then
    : > "$WORK_RUN_TEST_CLOCK_ADVANCE"
    SECONDS=$((SECONDS + 1800))
    return 0
  fi
  command sleep 0.01
}
`);
    const loop = spawn('bash', [LOOP, '--run-id', runId, '--max-iterations', '1'], {
      cwd: repo,
      detached: true,
      env: {
        ...process.env,
        AGENT_RUNS_ROOT: root,
        GIT_CONFIG_GLOBAL: '/dev/null',
        PATH: `${agentBin}${path.delimiter}${process.env.PATH || ''}`,
        BASH_ENV: clockShim,
        WORK_RUN_AGENT: 'claude',
        WORK_RUN_TEST_STARTED: started,
        WORK_RUN_TEST_RELEASE: release,
        WORK_RUN_TEST_CLOCK_ADVANCE: clockAdvanced,
        WORK_RUN_TEST_EXIT_CODE: String(scenario.exitCode),
        WORK_RUN_TEST_MARK_PASS: scenario.markPass ? '1' : '0',
        WORK_RUN_TEST_CLI: CLI,
        WORK_RUN_TEST_RUN_ID: runId,
        WORK_RUN_TEST_EVIDENCE: evidencePath,
        ...(scenario.concurrentUpdate ? {
          WORK_RUN_TEST_LEDGER_UPDATE: path.join(root, `${scenario.name}.ledger-update`),
          WORK_RUN_TEST_LEDGER_UPDATED: path.join(root, `${scenario.name}.ledger-updated`),
        } : {}),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    loop.stdout.setEncoding('utf8').on('data', (chunk) => { stdout += chunk; });
    loop.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk; });
    let closed = false;
    const close = new Promise((resolve) => {
      loop.once('close', (code, signal) => {
        closed = true;
        resolve({ code, signal });
      });
    });

    try {
      const waitFor = async (predicate, message) => {
        const deadline = Date.now() + 5_000;
        while (Date.now() < deadline) {
          if (predicate()) return;
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        throw new Error(message);
      };
      await waitFor(() => fs.existsSync(started), 'child did not start');
      await waitFor(
        () => fs.existsSync(progressPath) &&
          fs.readFileSync(progressPath, 'utf8').includes('WORK_RUN_PROGRESS_CHECKPOINT'),
        'durable checkpoint was not written while the child was running',
      );

      assert.equal(closed, false);
      assert.equal(fs.existsSync(release), false);
      const progress = fs.readFileSync(progressPath, 'utf8');
      const checkpoint = progress.slice(progress.lastIndexOf('WORK_RUN_PROGRESS_CHECKPOINT'));
      assert.match(checkpoint, new RegExp(`run-id=${runId}`));
      assert.match(checkpoint, /story-id=ONE/);
      assert.match(checkpoint, /agent=claude/);
      assert.match(checkpoint, /child-id=.+/);
      assert.match(checkpoint, /timestamp=[^ ]+/);
      assert.match(checkpoint, /elapsed-seconds=\d+/);
      assert.match(checkpoint, /causal-evidence=unknown:no-stable-causal-receipt/);
      assert.match(checkpoint, /resource-usage=unknown/);
      assert.match(checkpoint, /remaining-sealed-iterations=7/);
      assert.match(checkpoint, /remaining-process-iterations=0/);
      assert.match(checkpoint, /strategy=continue-current-child/);
      assert.doesNotMatch(checkpoint, /WORK_RUN_PAUSED/);
      const ledger = readJson(path.join(root, runId, 'ledger.json'));
      assert.equal(ledger.iteration, 1);
      assert.equal(ledger.maxIterations, 8);
      assert.equal(ledger.status, 'active');
      if (scenario.concurrentUpdate) {
        const updateRequest = path.join(root, `${scenario.name}.ledger-update`);
        const updated = path.join(root, `${scenario.name}.ledger-updated`);
        fs.writeFileSync(updateRequest, 'mark story pass while child is live\n');
        await waitFor(() => fs.existsSync(updated), 'child ledger update did not complete');
        const updatedLedger = readJson(path.join(root, runId, 'ledger.json'));
        assert.equal(updatedLedger.userStories[0].passes, true);
        assert.equal(updatedLedger.maxIterations, 8);
        assert.equal(updatedLedger.iteration, 1);
        fs.rmSync(clockAdvanced);
        await waitFor(
          () => (fs.readFileSync(progressPath, 'utf8').match(/WORK_RUN_PROGRESS_CHECKPOINT/g) || []).length >= 2,
          'second checkpoint did not preserve a child ledger update',
        );
        assert.equal(readJson(path.join(root, runId, 'ledger.json')).userStories[0].passes, true);
      }

      fs.writeFileSync(release, 'release\n');
      const result = await close;
      assert.equal(result.code, scenario.expectedExit, stderr + stdout);
      if (scenario.markPass) {
        assert.match(stdout, new RegExp(`WORK_RUN_COMPLETE run-id=${runId}`));
      } else if (scenario.concurrentUpdate) {
        assert.match(stderr, /WORK_RUN_PAUSED .*closeout-evidence-required/);
      } else {
        assert.match(stderr, /Agent exit 23/);
      }
      const finalLedger = readJson(path.join(root, runId, 'ledger.json'));
      assert.equal(finalLedger.maxIterations, 8);
      assert.equal(finalLedger.iteration, 1);
    } finally {
      if (!fs.existsSync(release)) fs.writeFileSync(release, 'release\n');
      if (!closed) {
        const finished = await Promise.race([
          close.then(() => true),
          new Promise((resolve) => setTimeout(() => resolve(false), 5_000)),
        ]);
        if (!finished) {
          try { process.kill(-loop.pid, 'SIGTERM'); } catch {}
          await close;
        }
      }
      fs.rmSync(repo, { recursive: true, force: true });
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});
it('preserves owned-child SIGINT/SIGQUIT handling and stops only the monitor', async () => {
  const repo = makeRepo();
  const root = runsRoot(repo);
  const agentBin = path.join(root, 'signal-bin');
  const agentPath = path.join(agentBin, 'claude');
  const clockShim = path.join(root, 'signal-clock.sh');
  fs.mkdirSync(agentBin, { recursive: true });
  fs.writeFileSync(agentPath, `#!/usr/bin/env bash
printf '%s\\n' "$$" > "$WORK_RUN_TEST_STARTED"
exec /bin/sleep 60
`);
  fs.chmodSync(agentPath, 0o755);
  fs.writeFileSync(clockShim, `sleep() {
  if [[ -n "\${WORK_RUN_TEST_CLOCK_ADVANCE:-}" && ! -e "$WORK_RUN_TEST_CLOCK_ADVANCE" ]]; then
    : > "$WORK_RUN_TEST_CLOCK_ADVANCE"
    SECONDS=$((SECONDS + 1800))
    return 0
  fi
  command sleep 0.01
}
`);
  const sentinel = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
    stdio: 'ignore',
  });
  const waitFor = async (predicate, message) => {
    const deadline = Date.now() + 5_000;
    while (Date.now() < deadline) {
      if (predicate()) return;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw new Error(message);
  };

  try {
    for (const signal of ['SIGINT', 'SIGQUIT']) {
      const runId = `checkpoint-${signal.toLowerCase()}`;
      const started = path.join(root, `${signal}.started`);
      const clockAdvanced = path.join(root, `${signal}.clock-advanced`);
      const progressPath = path.join(root, runId, 'progress.md');
      const storiesPath = path.join(root, `${signal}.json`);
      fs.writeFileSync(storiesPath, JSON.stringify([
        { id: 'ONE', title: 'one', acceptanceCriteria: ['one'], priority: 1, passes: false },
      ]));
      assert.equal(run([
        'init', '--run-id', runId, '--project', 'fixture', '--branch', 'fixture',
        '--description', 'owned-child signal contract',
        '--stories-file', storiesPath, '--max-iterations', '8',
      ], repo).status, 0);

      const loop = spawn('bash', [LOOP, '--run-id', runId, '--max-iterations', '1'], {
        cwd: repo,
        detached: true,
        env: {
          ...process.env,
          AGENT_RUNS_ROOT: root,
          GIT_CONFIG_GLOBAL: '/dev/null',
          PATH: `${agentBin}${path.delimiter}${process.env.PATH || ''}`,
          BASH_ENV: clockShim,
          WORK_RUN_AGENT: 'claude',
          WORK_RUN_TEST_STARTED: started,
          WORK_RUN_TEST_CLOCK_ADVANCE: clockAdvanced,
        },
        stdio: ['ignore', 'ignore', 'ignore'],
      });
      let closed = false;
      const close = new Promise((resolve) => {
        loop.once('close', (code, signalName) => {
          closed = true;
          resolve({ code, signal: signalName });
        });
      });

      try {
        await waitFor(() => fs.existsSync(started), 'agent did not start');
        await waitFor(
          () => fs.existsSync(progressPath) &&
            fs.readFileSync(progressPath, 'utf8').includes('WORK_RUN_PROGRESS_CHECKPOINT'),
          'monitor did not persist a checkpoint before interruption',
        );
        const childPid = Number(fs.readFileSync(started, 'utf8'));
        process.kill(-loop.pid, signal);
        const result = await Promise.race([
          close,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`loop did not stop after ${signal}`)), 5_000),
          ),
        ]);
        assert.equal(result.code, signal === 'SIGINT' ? 130 : 131);
        await waitFor(() => {
          const state = spawnSync('ps', ['-o', 'stat=', '-p', String(childPid)], {
            encoding: 'utf8',
          }).stdout.trim();
          return !state || state.startsWith('Z');
        }, `owned agent ${childPid} remained live after ${signal}`);
        assert.doesNotThrow(() => process.kill(sentinel.pid, 0));
        const progressAfterExit = fs.readFileSync(progressPath, 'utf8');
        const ledgerAfterExit = fs.readFileSync(path.join(root, runId, 'ledger.json'), 'utf8');
        await new Promise((resolve) => setTimeout(resolve, 50));
        assert.equal(fs.readFileSync(progressPath, 'utf8'), progressAfterExit);
        assert.equal(fs.readFileSync(path.join(root, runId, 'ledger.json'), 'utf8'), ledgerAfterExit);
        const ledger = readJson(path.join(root, runId, 'ledger.json'));
        assert.equal(ledger.maxIterations, 8);
        assert.equal(ledger.iteration, 1);
      } finally {
        if (!closed) {
          try { process.kill(-loop.pid, 'SIGTERM'); } catch {}
          await close;
        }
      }
    }
  } finally {
    sentinel.kill('SIGTERM');
    await new Promise((resolve) => sentinel.once('close', resolve));
    fs.rmSync(repo, { recursive: true, force: true });
    fs.rmSync(root, { recursive: true, force: true });
  }
});
