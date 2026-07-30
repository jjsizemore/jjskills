#!/usr/bin/env node
/**
 * Portable work-run ledger CLI.
 * Repo-local state: <cwd>/.agents/runs/<run-id>/
 *
 * Budget is sealed at init; agents cannot raise maxIterations afterward.
 */
import fs from 'node:fs';
import path from 'node:path';
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
  return path.join(cwd, '.agents', 'runs');
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

function cmdInit(cwd, args) {
  const runId = args['run-id'];
  if (!runId) die('init requires --run-id');
  if (!args.project || !args.branch || !args.description) {
    die('init requires --project --branch --description');
  }
  if (!args['stories-file']) die('init requires --stories-file <json array or {userStories}>');

  const dir = runDir(cwd, runId);
  if (fs.existsSync(path.join(dir, 'ledger.json')) && !args.force) {
    die(`run already exists: ${runId} (pass --force to overwrite)`);
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
    project: args.project,
    branchName: args.branch,
    description: args.description,
    sourceSpec: args['source-spec'] || null,
    maxIterations,
    budgetSealedAt: now,
    iteration: 0,
    status: 'active',
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
  if (data.userStories.every((s) => s.passes)) data.status = 'completed';
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
    iteration: data.iteration,
    maxIterations: data.maxIterations,
    budgetSealedAt: data.budgetSealedAt,
    complete,
    incomplete,
    blocked,
    allPass,
    next: pickNext(data),
  };
  if (allPass) out.completion = `WORK_RUN_COMPLETE run-id=${runId}`;
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
  data.status = 'completed';
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
       [--max-iterations N] [--source-spec PATH] [--force]
  pick [--run-id ID]
  mark-pass --story ID [--note TEXT]
  mark-blocked --story ID --reason TEXT
  bump-iteration
  set-max --max-iterations N   (always rejected after seal)
  status
  append --text TEXT
  cancel
  complete

State: <cwd>/.agents/runs/
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
