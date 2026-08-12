#!/usr/bin/env node
/**
 * Portable work-run ledger CLI.
 * State root: <git-common-dir>/agent-runs/ or explicit AGENT_RUNS_ROOT.
 *
 * Budget is sealed at init; agents cannot raise maxIterations afterward.
 * Completion additionally requires evidence accepted by the controller-owned
 * closeout verifier; caller-supplied oracle claims are ignored.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const FLOOR = 10;
const HARD_CEILING = 30;

export function computeMaxIterations(storyCount, riskBonus = 0) {
  const n = Number(storyCount) || 0;
  const bonus = Math.max(0, Math.min(4, Number(riskBonus) || 0));
  return Math.min(HARD_CEILING, Math.max(FLOOR, n * 2 + bonus));
}

function die(msg, code = 1) {
  process.stderr.write(String(msg).endsWith('\n') ? msg : `${msg}\n`);
  process.exit(code);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

function runsRoot(cwd) {
  if (process.env.AGENT_RUNS_ROOT) {
    if (!path.isAbsolute(process.env.AGENT_RUNS_ROOT)) die('AGENT_RUNS_ROOT must be absolute');
    return process.env.AGENT_RUNS_ROOT;
  }
  try {
    const commonDir = execFileSync('git', ['rev-parse', '--git-common-dir'], {
      cwd,
      encoding: 'utf8',
    }).trim();
    if (!commonDir) throw new Error('empty git common dir');
    return path.resolve(cwd, commonDir, 'agent-runs');
  } catch {
    die('cannot resolve shared run root; set absolute AGENT_RUNS_ROOT or run inside a Git worktree');
  }
}

function currentHead(cwd) {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim();
  } catch {
    die('cannot resolve current Git HEAD for closeout evidence');
  }
}

function deliveryDiffDigest(cwd, baseSha, subjectHead) {
  try {
    const diff = execFileSync('git', ['diff', '--binary', `${baseSha}..${subjectHead}`], {
      cwd,
      encoding: 'buffer',
    });
    return `sha256:${createHash('sha256').update(diff).digest('hex')}`;
  } catch {
    die('cannot resolve delivered Git diff for closeout evidence');
  }
}

function runControllerVerifier(cwd, runId, ledgerPath, evidencePath, baseSha, subjectHead, diffDigest) {
  const verifierPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'closeout-verify.mjs');
  const result = spawnSync(
    process.execPath,
    [
      verifierPath,
      '--cwd',
      cwd,
      '--run-id',
      runId,
      '--ledger',
      ledgerPath,
      '--evidence',
      evidencePath,
      '--base-sha',
      baseSha,
      '--subject-head',
      subjectHead,
      '--diff-digest',
      diffDigest,
    ],
    { cwd, encoding: 'utf8', timeout: 120_000 },
  );
  if (result.status !== 0 || result.signal) {
    const detail = result.stderr.trim();
    die(
      detail
        ? `cannot complete: controller closeout verifier rejected the evidence (${detail})`
        : 'cannot complete: controller closeout verifier rejected the evidence',
    );
  }
  try {
    const oracle = JSON.parse(result.stdout);
    if (oracle.status !== 'pass' || oracle.runId !== runId) {
      die('cannot complete: controller closeout verifier returned invalid proof');
    }
    return oracle;
  } catch {
    die('cannot complete: controller closeout verifier returned invalid proof');
  }
}

function activePath(cwd) {
  return path.join(runsRoot(cwd), 'ACTIVE');
}

function runDir(cwd, runId) {
  return path.join(runsRoot(cwd), runId);
}

function readActive(cwd) {
  const p = activePath(cwd);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8').trim() || null;
}

function resolveRunId(cwd, args) {
  return args['run-id'] || readActive(cwd) || null;
}

function readLedger(cwd, runId) {
  const p = path.join(runDir(cwd, runId), 'ledger.json');
  if (!fs.existsSync(p)) die(`ledger not found: ${p}`);
  return { path: p, data: JSON.parse(fs.readFileSync(p, 'utf8')) };
}

function writeLedger(ledgerPath, data) {
  fs.writeFileSync(ledgerPath, `${JSON.stringify(data, null, 2)}\n`);
}

function ensureProgress(dir) {
  const p = path.join(dir, 'progress.md');
  if (!fs.existsSync(p)) {
    fs.writeFileSync(
      p,
      `# Work Run Progress\n\n## Codebase Patterns\n\n(none yet)\n\n---\n`,
    );
  }
  return p;
}

function writeHandoff(dir, body) {
  fs.writeFileSync(path.join(dir, 'handoff.md'), body.endsWith('\n') ? body : `${body}\n`);
}

function defaultHandoff(ledger, runId) {
  const next = pickNext(ledger);
  return [
    `# Handoff — ${runId}`,
    '',
    `- status: ${ledger.status || 'active'}`,
    `- iteration: ${ledger.iteration} / ${ledger.maxIterations} (sealed ${ledger.budgetSealedAt})`,
    `- branch: ${ledger.branchName}`,
    `- next story: ${next ? `${next.id} ${next.title}` : '(none — board complete or blocked)'}`,
    '',
    '## Instructions for cold start',
    '',
    '1. Read this file, ledger.json, and the Codebase Patterns section of progress.md.',
    '2. Load skill `resuming-work` then `implementing-story` for the next incomplete story only.',
    '3. Do not raise maxIterations. Do not re-implement stories with passes: true.',
    '4. Append learnings to progress.md; rewrite this handoff before ending the iteration.',
    '',
  ].join('\n');
}

function pickNext(ledger) {
  const open = (ledger.userStories || []).filter((s) => !s.passes && !s.blockedReason);
  open.sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
  return open[0] || null;
}

function riskBonusFromStories(stories) {
  let bonus = 0;
  const tags = new Set();
  for (const s of stories) {
    for (const t of s.tags || []) tags.add(String(t).toLowerCase());
  }
  if ([...tags].some((t) => /release|security|auth|prod|migration/.test(t))) bonus += 2;
  if (stories.length >= 8) bonus += 2;
  return Math.min(4, bonus);
}

function parseOracleConfig(cwd, baseSha) {
  let raw;
  try {
    raw = execFileSync('git', ['show', `${baseSha}:closeout-command.json`], {
      cwd,
      encoding: 'buffer',
    });
  } catch {
    die('missing repository closeout-command.json at run base');
  }
  let config;
  try {
    config = JSON.parse(raw.toString('utf8'));
  } catch {
    die('repository closeout-command.json at run base is invalid JSON');
  }
  const command = config.closeoutCommand;
  const executable = Array.isArray(command) ? path.basename(command[0] || '') : '';
  if (
    !Array.isArray(command) ||
    command.length === 0 ||
    command.some((part) => typeof part !== 'string' || part.length === 0) ||
    !new Set(['node', 'pnpm', 'npm', 'yarn', 'bun', 'python', 'python3']).has(executable) ||
    (executable === 'node' && command.some((part) => ['-e', '--eval', '-p', '--print'].includes(part)))
  ) {
    die('closeout-command.json closeoutCommand must be a project-owned test command');
  }
  return {
    command,
    configSha: `sha256:${createHash('sha256').update(raw).digest('hex')}`,
  };
}

function cmdInit(cwd, args) {
  const runId = args['run-id'];
  if (!runId) die('init requires --run-id');
  const required = [
    'project',
    'branch',
    'description',
    'stories-file',
    'source-spec',
    'tracking-provider',
    'tracking-issue-id',
    'tracking-key',
    'tracking-url',
  ];
  const missing = required.filter((key) => !args[key]);
  if (missing.length > 0) die(`init requires ${missing.map((key) => `--${key}`).join(' ')}`);
  const dir = runDir(cwd, runId);
  const existingLedgerPath = path.join(dir, 'ledger.json');
  if (fs.existsSync(existingLedgerPath)) {
    const existing = JSON.parse(fs.readFileSync(existingLedgerPath, 'utf8'));
    if (existing.status === 'active' || existing.status === 'blocked') {
      die(`cannot overwrite ${existing.status} run: ${runId}`);
    }
    if (!args.force) die(`run already exists: ${runId} (pass --force to overwrite)`);
  }

  const raw = JSON.parse(fs.readFileSync(args['stories-file'], 'utf8'));
  const stories = Array.isArray(raw) ? raw : raw.userStories;
  if (!Array.isArray(stories) || stories.length === 0) die('stories-file must contain a non-empty array');

  for (const s of stories) {
    if (!s.id || !s.title || !Array.isArray(s.acceptanceCriteria) || s.acceptanceCriteria.length < 1) {
      die(`invalid story (need id, title, acceptanceCriteria[]): ${JSON.stringify(s)}`);
    }
    if (s.passes === undefined) s.passes = false;
    if (s.priority === undefined) s.priority = 1;
    if (s.description === undefined) s.description = '';
    if (s.notes === undefined) s.notes = '';
    if (s.blockedReason === undefined) s.blockedReason = null;
  }
  const orderedStoryIds = stories.map((story) => story.id);
  if (new Set(orderedStoryIds).size !== orderedStoryIds.length) {
    die('stories-file contains duplicate story IDs');
  }
  const baseSha = currentHead(cwd);
  const oracleConfig = parseOracleConfig(cwd, baseSha);

  let maxIterations;
  if (args['max-iterations']) {
    maxIterations = Number(args['max-iterations']);
    if (!Number.isFinite(maxIterations) || maxIterations < 1) die('invalid --max-iterations');
  } else {
    maxIterations = computeMaxIterations(stories.length, riskBonusFromStories(stories));
  }

  const now = new Date().toISOString();
  const ledger = {
    version: 1,
    runId,
    project: args.project,
    branchName: args.branch,
    description: args.description,
    sourceSpec: args['source-spec'],
    trackingProvider: args['tracking-provider'],
    trackingIssueId: args['tracking-issue-id'],
    trackingKey: args['tracking-key'],
    trackingUrl: args['tracking-url'],
    closeoutCommand: oracleConfig.command,
    closeoutConfigSha: oracleConfig.configSha,
    orderedStoryIds,
    baseSha,
    maxIterations,
    budgetSealedAt: now,
    iteration: 0,
    status: 'active',
    closeoutStatus: null,
    userStories: stories,
  };

  fs.mkdirSync(path.join(dir, 'evidence'), { recursive: true });
  writeLedger(path.join(dir, 'ledger.json'), ledger);
  ensureProgress(dir);
  writeHandoff(dir, defaultHandoff(ledger, runId));
  fs.mkdirSync(runsRoot(cwd), { recursive: true });
  fs.writeFileSync(activePath(cwd), `${runId}\n`);

  process.stdout.write(
    JSON.stringify({ ok: true, runId, maxIterations, budgetSealedAt: now, storyCount: stories.length }, null, 2) +
      '\n',
  );
}

function cmdPick(cwd, args) {
  const runId = resolveRunId(cwd, args);
  if (!runId) die('no ACTIVE run; pass --run-id or init first');
  const { data } = readLedger(cwd, runId);
  const next = pickNext(data);
  if (!next) {
    process.stdout.write(JSON.stringify({ ok: true, done: true, story: null }) + '\n');
    return;
  }
  process.stdout.write(JSON.stringify(next, null, 2) + '\n');
}

function cmdMarkPass(cwd, args) {
  const runId = resolveRunId(cwd, args);
  if (!runId) die('no ACTIVE run');
  const storyId = args.story;
  if (!storyId) die('mark-pass requires --story');
  const { path: lp, data } = readLedger(cwd, runId);
  const story = data.userStories.find((s) => s.id === storyId);
  if (!story) die(`unknown story: ${storyId}`);
  story.passes = true;
  story.blockedReason = null;
  if (args.note) story.notes = String(args.note);
  // Passing stories do not complete the run; closeout verification does.
  writeLedger(lp, data);
  appendProgress(cwd, runId, `## mark-pass ${storyId}\n- ${args.note || 'passed'}\n`);
  writeHandoff(runDir(cwd, runId), defaultHandoff(data, runId));
  process.stdout.write(JSON.stringify({ ok: true, storyId, status: data.status }) + '\n');
}

function cmdMarkBlocked(cwd, args) {
  const runId = resolveRunId(cwd, args);
  if (!runId) die('no ACTIVE run');
  const storyId = args.story;
  if (!storyId) die('mark-blocked requires --story');
  if (!args.reason) die('mark-blocked requires --reason');
  const { path: lp, data } = readLedger(cwd, runId);
  const story = data.userStories.find((s) => s.id === storyId);
  if (!story) die(`unknown story: ${storyId}`);
  story.blockedReason = String(args.reason);
  data.status = 'blocked';
  writeLedger(lp, data);
  appendProgress(cwd, runId, `## mark-blocked ${storyId}\n- ${args.reason}\n`);
  writeHandoff(runDir(cwd, runId), defaultHandoff(data, runId));
  process.stdout.write(JSON.stringify({ ok: true, storyId, status: 'blocked' }) + '\n');
}

function cmdSetMax(cwd, args) {
  const runId = resolveRunId(cwd, args);
  if (!runId) die('no ACTIVE run');
  const { data } = readLedger(cwd, runId);
  if (data.budgetSealedAt) {
    die(
      `forbidden: budget sealed at ${data.budgetSealedAt} (maxIterations=${data.maxIterations}). ` +
        `Agents cannot raise maxIterations mid-run. Start a new run or re-init with human --max-iterations.`,
    );
  }
  die('forbidden: set-max is disabled after init seal');
}

function cmdBumpIteration(cwd, args) {
  const runId = resolveRunId(cwd, args);
  if (!runId) die('no ACTIVE run');
  const { path: lp, data } = readLedger(cwd, runId);
  if (data.iteration >= data.maxIterations) {
    die(
      `iteration budget exhausted: ${data.iteration}/${data.maxIterations} (sealed ${data.budgetSealedAt})`,
    );
  }
  data.iteration += 1;
  writeLedger(lp, data);
  process.stdout.write(
    JSON.stringify({ ok: true, iteration: data.iteration, maxIterations: data.maxIterations }) + '\n',
  );
}

function cmdStatus(cwd, args) {
  const runId = resolveRunId(cwd, args);
  if (!runId) die('no ACTIVE run');
  const { data } = readLedger(cwd, runId);
  const stories = data.userStories || [];
  const complete = stories.filter((s) => s.passes).length;
  const blocked = stories.filter((s) => s.blockedReason).length;
  const incomplete = stories.filter((s) => !s.passes).length;
  const allPass = stories.length > 0 && stories.every((s) => s.passes);
  const out = {
    runId,
    status: data.status,
    closeoutStatus: data.closeoutStatus || null,
    iteration: data.iteration,
    maxIterations: data.maxIterations,
    budgetSealedAt: data.budgetSealedAt,
    complete,
    incomplete,
    blocked,
    allPass,
    next: pickNext(data),
  };
  if (allPass && data.closeoutStatus === 'VERIFIED') {
    out.completion = `WORK_RUN_COMPLETE run-id=${runId}`;
  }
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
}

function appendProgress(cwd, runId, block) {
  const p = ensureProgress(runDir(cwd, runId));
  const stamp = new Date().toISOString();
  fs.appendFileSync(p, `\n## ${stamp}\n${block}\n---\n`);
}

function cmdAppend(cwd, args) {
  const runId = resolveRunId(cwd, args);
  if (!runId) die('no ACTIVE run');
  const text = args.text || args.note;
  if (!text) die('append requires --text');
  appendProgress(cwd, runId, text);
  process.stdout.write(JSON.stringify({ ok: true }) + '\n');
}

function cmdCancel(cwd, args) {
  const runId = resolveRunId(cwd, args);
  if (!runId) die('no ACTIVE run');
  const { path: lp, data } = readLedger(cwd, runId);
  if (data.status === 'active') data.status = 'cancelled';
  writeLedger(lp, data);
  const ap = activePath(cwd);
  if (fs.existsSync(ap)) {
    const cur = fs.readFileSync(ap, 'utf8').trim();
    if (cur === runId) fs.unlinkSync(ap);
  }
  appendProgress(cwd, runId, '## cancel\n- ACTIVE cleared; ledger preserved\n');
  process.stdout.write(JSON.stringify({ ok: true, runId, status: data.status }) + '\n');
}

function cmdComplete(cwd, args) {
  const runId = resolveRunId(cwd, args);
  if (!runId) die('no ACTIVE run');
  const { path: lp, data } = readLedger(cwd, runId);
  if (!(data.userStories || []).every((s) => s.passes)) {
    die('cannot complete: incomplete stories remain');
  }
  const evidencePath = args['closeout-evidence'];
  if (!evidencePath) die('cannot complete: --closeout-evidence is required');
  let evidence;
  try {
    evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  } catch {
    die('cannot complete: closeout evidence is not valid JSON');
  }
  const subjectHead = currentHead(cwd);
  const diffDigest = deliveryDiffDigest(cwd, data.baseSha, subjectHead);
  if (
    !evidence ||
    evidence.runId !== runId ||
    evidence.status !== 'VERIFIED' ||
    evidence.baseSha !== data.baseSha ||
    evidence.subjectHead !== subjectHead ||
    evidence.diffDigest !== diffDigest
  ) {
    die('cannot complete: closeout evidence is unbound or incomplete');
  }
  const verifiedOracle = runControllerVerifier(
    cwd,
    runId,
    lp,
    evidencePath,
    data.baseSha,
    subjectHead,
    diffDigest,
  );
  data.status = 'completed';
  data.closeoutStatus = 'VERIFIED';
  data.closeoutOracle = verifiedOracle;
  writeLedger(lp, data);
  const ap = activePath(cwd);
  if (fs.existsSync(ap) && fs.readFileSync(ap, 'utf8').trim() === runId) fs.unlinkSync(ap);
  const line = `WORK_RUN_COMPLETE run-id=${runId}`;
  process.stdout.write(JSON.stringify({ ok: true, completion: line }) + '\n');
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === '-h' || argv[0] === '--help') {
    process.stdout.write(`Usage: work-run.mjs <command> [options]

Commands:
  init --run-id ID --project P --branch B --description D --stories-file F
       --source-spec S --tracking-provider P --tracking-issue-id I
       --tracking-key K --tracking-url U [--max-iterations N] [--force]
  pick [--run-id ID]
  mark-pass --story ID [--note TEXT]
  mark-blocked --story ID --reason TEXT
  bump-iteration
  set-max --max-iterations N   (always rejected after seal)
  status
  append --text TEXT
  complete --closeout-evidence PATH

State: <git-common-dir>/agent-runs/ (or AGENT_RUNS_ROOT)
`);
    process.exit(0);
  }

  const cmd = argv[0];
  const args = parseArgs(argv.slice(1));
  const cwd = process.cwd();

  switch (cmd) {
    case 'init':
      return cmdInit(cwd, args);
    case 'pick':
      return cmdPick(cwd, args);
    case 'mark-pass':
      return cmdMarkPass(cwd, args);
    case 'mark-blocked':
      return cmdMarkBlocked(cwd, args);
    case 'bump-iteration':
      return cmdBumpIteration(cwd, args);
    case 'set-max':
      return cmdSetMax(cwd, args);
    case 'status':
      return cmdStatus(cwd, args);
    case 'append':
      return cmdAppend(cwd, args);
    case 'cancel':
      return cmdCancel(cwd, args);
    case 'complete':
      return cmdComplete(cwd, args);
    default:
      die(`unknown command: ${cmd}`);
  }
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  main();
}
