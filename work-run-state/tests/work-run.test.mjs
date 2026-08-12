/**
 * Deterministic contracts for work-run.mjs (RED/GREEN).
 * Run: node --test ~/.agents/skills/work-run-state/tests/work-run.test.mjs
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(__dirname, '..', 'scripts', 'work-run.mjs');

function run(args, cwd, env = {}) {
  const normalized =
    args[0] === 'init'
      ? [
          ...args,
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
  const r = spawnSync(process.execPath, [CLI, ...normalized], {
    cwd,
    encoding: 'utf8',
    timeout: 5_000,
    env: {
      ...process.env,
      AGENT_RUNS_ROOT: path.join(path.dirname(cwd), `${path.basename(cwd)}-agent-runs`),
      ...env,
    },
  });
  return r;
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
function closeoutEvidence(cwd, overrides = {}) {
  const ledger = readJson(path.join(runsRoot(cwd), 'pick-run/ledger.json'));
  const baseSha = ledger.baseSha;
  const subjectHead = spawnSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).stdout.trim();
  const evidence = {
    runId: 'pick-run',
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
    ...overrides,
  };
  const p = path.join(runsRoot(cwd), 'pick-run', 'evidence', 'closeout.json');
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

    assert.ok(fs.existsSync(path.join(runsRoot(repo), 'demo-run/progress.md')));
    assert.ok(fs.existsSync(path.join(runsRoot(repo), 'demo-run/handoff.md')));
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

  it(
    'requires bound verified closeout before emitting WORK_RUN_COMPLETE',
    () => {
    run(['mark-pass', '--story', 'US-001'], repo);
    run(['mark-pass', '--story', 'US-002'], repo);
    const blocked = run(['complete'], repo);
    assert.notEqual(blocked.status, 0);
    assert.match(blocked.stderr + blocked.stdout, /closeout|verified/i);

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
    assert.equal(ledger.status, 'blocked');
  });
});
