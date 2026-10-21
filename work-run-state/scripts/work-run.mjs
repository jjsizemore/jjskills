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
import { CLOSEOUT_VERIFIER_TIMEOUT_MS } from './closeout-timeouts.mjs';
import { evaluateReleaseAdmission } from './release-admission.mjs';

const FLOOR = 10;
const HARD_CEILING = 30;
const ENDPOINTS = new Set(['pr', 'merge', 'staging', 'deploy', 'local-only']);

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
    { cwd, encoding: 'utf8', timeout: CLOSEOUT_VERIFIER_TIMEOUT_MS },
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

export function resolveTargetSurface(story, ledger) {
  if (story?.surface && typeof story.surface === 'string' && story.surface.trim()) {
    return story.surface.trim().toLowerCase();
  }
  const tags = story?.tags || [];
  const surfaceTag = tags.find((t) => String(t).toLowerCase().startsWith('surface:'));
  if (surfaceTag) {
    return surfaceTag.slice(8).trim().toLowerCase();
  }
  if (ledger?.surface && typeof ledger.surface === 'string' && ledger.surface.trim()) {
    return ledger.surface.trim().toLowerCase();
  }
  return null;
}

export function isStoryReleaseDependent(story, ledger) {
  if (!story) return false;
  const tags = (story.tags || []).map((t) => String(t).toLowerCase());
  return tags.some((t) =>
    ['release', 'deploy', 'production', 'reduced-gates', 'staging', 'release-action'].includes(t)
  );
}

export function isStoryEligible(story, ledger, cwd = process.cwd()) {
  if (story.passes || story.blockedReason) return false;
  const tags = story.tags || [];
  const serialAfterOk = tags.every((tag) => {
    if (!tag.startsWith('serial-after:')) return true;
    return ledger.userStories.some((candidate) => candidate.id === tag.slice(13) && candidate.passes);
  });
  if (!serialAfterOk) return false;

  if (isStoryReleaseDependent(story, ledger)) {
    const curHead = currentHead(cwd);
    const expectedSurface = resolveTargetSurface(story, ledger);
    if (!expectedSurface) return false;
    const adm = executeBaselineSafeguardsProbe({
      cwd,
      baseSha: ledger.baseSha,
      subjectHead: curHead,
      endpoint: ledger.endpoint,
      expectedSurface,
      action: 'release-pick',
      timeoutMs: 10_000,
    });
    if (!adm.admitted || adm.status === 'not_applicable') return false;
  }
  return true;
}

function pickNext(ledger, cwd = process.cwd()) {
  if (['completed', 'cancelled', 'paused'].includes(ledger.status)) return null;
  const open = (ledger.userStories || []).filter((story) => isStoryEligible(story, ledger, cwd));
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
    throw new Error('missing repository closeout-command.json at run base');
  }
  let config;
  try {
    config = JSON.parse(raw.toString('utf8'));
  } catch {
    throw new Error('repository closeout-command.json at run base is invalid JSON');
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
    throw new Error('closeout-command.json closeoutCommand must be a project-owned test command');
  }
  return {
    command,
    configSha: `sha256:${createHash('sha256').update(raw).digest('hex')}`,
  };
}

export function executeBaselineSafeguardsProbe({
  cwd,
  baseSha,
  subjectHead,
  endpoint,
  expectedEnvironment,
  expectedSurface,
  action = 'release-admission',
  timeoutMs = 30_000,
}) {
  const curHead = subjectHead || currentHead(cwd);
  const oracleBase = baseSha || curHead;
  let oracleConfig;
  try {
    oracleConfig = parseOracleConfig(cwd, oracleBase);
  } catch (err) {
    return {
      admitted: false,
      status: 'denied',
      reason: `release safeguards admission denied: cannot resolve baseline project probe at ${oracleBase}: ${err.message}`,
      missing: ['baseline project probe command'],
    };
  }

  const probeRun = spawnSync(oracleConfig.command[0], oracleConfig.command.slice(1), {
    cwd,
    encoding: 'utf8',
    timeout: timeoutMs,
  });

  if (probeRun.status !== 0 || probeRun.signal) {
    return {
      admitted: false,
      status: 'denied',
      reason: `release safeguards admission denied: project probe execution failed with exit code ${probeRun.status}`,
      missing: ['passing project probe execution'],
    };
  }

  let observedPayload;
  try {
    observedPayload = JSON.parse(probeRun.stdout);
  } catch {
    return {
      admitted: false,
      status: 'denied',
      reason: 'release safeguards admission denied: project probe did not output valid JSON observations',
      missing: ['valid JSON output from project probe'],
    };
  }

  const observedSafeguards =
    observedPayload.releaseSafeguards ||
    observedPayload.deliveryProof?.releaseSafeguards ||
    observedPayload;

  return evaluateReleaseAdmission({
    cwd,
    evidence: observedSafeguards,
    endpoint,
    expectedEnvironment,
    expectedSurface,
    subjectHead: curHead,
    action,
  });
}

function cmdInit(cwd, args) {
  const runId = args['run-id'];
  if (!runId) die('init requires --run-id');
  const required = [
    'project',
    'branch',
    'description',
    'stories-file',
    'endpoint',
    'source-spec',
    'tracking-provider',
    'tracking-issue-id',
    'tracking-key',
    'tracking-url',
  ];
  const missing = required.filter((key) => !args[key]);
  if (missing.length > 0) die(`init requires ${missing.map((key) => `--${key}`).join(' ')}`);
  if (!ENDPOINTS.has(args.endpoint)) die(`init rejects unknown --endpoint: ${args.endpoint}`);
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
  let oracleConfig;
  try {
    oracleConfig = parseOracleConfig(cwd, baseSha);
  } catch (err) {
    die(err.message);
  }

  let maxIterations;
  if (args['max-iterations']) {
    maxIterations = Number(args['max-iterations']);
    if (!Number.isFinite(maxIterations) || maxIterations < 1) die('invalid --max-iterations');
  } else {
    maxIterations = computeMaxIterations(stories.length, riskBonusFromStories(stories));
  }
  const now = new Date().toISOString();
  if (args['safeguards-evidence']) {
    die('forbidden: caller safeguards evidence override is rejected; safeguards resolve from baseline project oracle');
  }
  let releaseSafeguards = null;
  if (['staging', 'deploy'].includes(args.endpoint)) {
    try {
      const probeRun = spawnSync(oracleConfig.command[0], oracleConfig.command.slice(1), {
        cwd,
        encoding: 'utf8',
        timeout: 30_000,
      });
      if (probeRun.status === 0 && !probeRun.signal) {
        const payload = JSON.parse(probeRun.stdout);
        const obs = payload.releaseSafeguards || payload.deliveryProof?.releaseSafeguards;
        if (obs) {
          const adm = evaluateReleaseAdmission({
            cwd,
            evidence: obs,
            endpoint: args.endpoint,
            subjectHead: baseSha,
            action: 'init-admission',
          });
          releaseSafeguards = {
            status: adm.status,
            reason: adm.reason,
            evaluatedAt: now,
          };
        }
      }
    } catch {
      // probe did not run or output safeguards
    }
    if (!releaseSafeguards) {
      releaseSafeguards = {
        status: 'unverified',
        reason: 'safeguards evidence required from project oracle before dependent release execution or closeout',
        evaluatedAt: now,
      };
    }
  }
  const ledger = {
    version: 1,
    runId,
    project: args.project,
    branchName: args.branch,
    description: args.description,
    sourceSpec: args['source-spec'],
    surface: args.surface ? String(args.surface).trim() : null,
    endpoint: args.endpoint,
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
    releaseSafeguards,
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
  const next = pickNext(data, cwd);
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
  data.status = pickNext(data) ? 'active' : 'blocked';
  writeLedger(lp, data);
  appendProgress(cwd, runId, `## mark-blocked ${storyId}\n- ${args.reason}\n`);
  writeHandoff(runDir(cwd, runId), defaultHandoff(data, runId));
  process.stdout.write(JSON.stringify({ ok: true, storyId, status: data.status }) + '\n');
}

function cmdSetMax(cwd, args) {
  const runId = resolveRunId(cwd, args);
  if (!runId) die('no ACTIVE run');
  const { data } = readLedger(cwd, runId);
  if (data.budgetSealedAt) {
    die(
      `forbidden: budget sealed at ${data.budgetSealedAt} (maxIterations=${data.maxIterations}). ` +
        `Agents cannot raise/reset sealed maxIterations or reinitialize to evade exhaustion.`,
    );
  }
  die('forbidden: set-max is disabled after init seal');
}

function cmdBumpIteration(cwd, args) {
  const runId = resolveRunId(cwd, args);
  if (!runId) die('no ACTIVE run');
  const { path: lp, data } = readLedger(cwd, runId);
  const next = pickNext(data, cwd);
  if (!next || (args.story && args.story !== next.id)) {
    die('selected story is gated, dependent, cancelled, or globally suspended');
  }

  if (isStoryReleaseDependent(next, data)) {
    const curHead = currentHead(cwd);
    const expectedSurface = resolveTargetSurface(next, data);
    if (!expectedSurface) {
      die('release-dependent action rejected: target release surface must be specified in story or ledger metadata');
    }
    const adm = executeBaselineSafeguardsProbe({
      cwd,
      baseSha: data.baseSha,
      subjectHead: curHead,
      endpoint: data.endpoint,
      expectedSurface,
      action: 'release-deployment',
      timeoutMs: 30_000,
    });
    if (!adm.admitted || adm.status === 'not_applicable') {
      die(`release-dependent action rejected: ${adm.reason || 'release action cannot use not_applicable'}`);
    }
    data.releaseSafeguards = {
      status: adm.status,
      reason: adm.reason,
      evaluatedAt: new Date().toISOString(),
      evaluatedHead: curHead,
      surface: expectedSurface,
    };
  }

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
    endpoint: data.endpoint || null,
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
function cmdAdmission(cwd, args) {
  if (args['probe-command']) {
    die('forbidden: caller probe command override is rejected; probe must resolve from baseline configuration');
  }
  if (args['subject-head']) {
    die('forbidden: caller subject-head override is rejected; subject head resolves from repository HEAD');
  }
  const subjectHead = currentHead(cwd);
  const endpoint = args.endpoint || null;
  const expectedEnvironment = args.environment || null;
  const expectedSurface = args.surface || null;
  const requireAdmitted =
    Boolean(args['require-admitted'] || args['require-admission']) ||
    ['release-actuation', 'release-deployment', 'reduced-gates'].includes(args.action);

  let callerEvidence = null;
  if (args.evidence) {
    try {
      callerEvidence = JSON.parse(fs.readFileSync(args.evidence, 'utf8'));
    } catch {
      die(`cannot read admission evidence: ${args.evidence}`);
    }
  }

  // Handle scoped not_applicable if declared
  if (callerEvidence?.status === 'not_applicable') {
    if (requireAdmitted) {
      const res = {
        admitted: false,
        status: 'denied',
        reason: 'release safeguards admission denied: release or reduced-gate actuation requires status: admitted with all three safeguards; not_applicable cannot authorize release actions',
        missing: ['release safeguards (release actuation cannot use not_applicable)'],
      };
      if (args.enforce || args.strict) die(res.reason);
      process.stdout.write(JSON.stringify(res, null, 2) + '\n');
      process.exit(1);
    }
    const naResult = evaluateReleaseAdmission({
      cwd,
      evidence: callerEvidence,
      endpoint,
      expectedEnvironment,
      expectedSurface,
      subjectHead,
      action: args.action || 'release-admission',
    });
    if (!naResult.admitted) {
      if (args.enforce || args.strict) die(naResult.reason);
      process.stdout.write(JSON.stringify(naResult, null, 2) + '\n');
      process.exit(1);
    }
    process.stdout.write(JSON.stringify(naResult, null, 2) + '\n');
    return;
  }
  const curHead = currentHead(cwd);
  let baseSha = null;
  const runId = resolveRunId(cwd, args);
  if (runId) {
    try {
      const { data } = readLedger(cwd, runId);
      baseSha = data.baseSha;
    } catch {}
  }
  if (!baseSha) {
    baseSha = curHead;
  }

  const result = executeBaselineSafeguardsProbe({
    cwd,
    baseSha,
    subjectHead: curHead,
    endpoint,
    expectedEnvironment,
    expectedSurface,
    action: args.action || 'release-admission',
  });

  if (callerEvidence && result.admitted) {
    const callerResult = evaluateReleaseAdmission({
      cwd,
      evidence: callerEvidence,
      endpoint,
      expectedEnvironment,
      expectedSurface,
      subjectHead: curHead,
      action: args.action || 'release-admission',
    });
    if (!callerResult.admitted) {
      if (args.enforce || args.strict) die(callerResult.reason);
      process.stdout.write(JSON.stringify(callerResult, null, 2) + '\n');
      process.exit(1);
    }
  }

  if (!result.admitted || (requireAdmitted && result.status !== 'admitted')) {
    const reason = result.reason || 'release actuation requires status: admitted with all three safeguards';
    if (args.enforce || args.strict) {
      die(reason);
    }
    process.stdout.write(JSON.stringify({ ...result, admitted: false, status: 'denied', reason }, null, 2) + '\n');
    process.exit(1);
  }
  if (runId) {
    try {
      const { path: lp, data } = readLedger(cwd, runId);
      data.releaseSafeguards = {
        status: result.status,
        reason: result.reason,
        evaluatedAt: new Date().toISOString(),
      };
      writeLedger(lp, data);
    } catch {
      // ignore if not a work-run root
    }
  }
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === '-h' || argv[0] === '--help') {
    process.stdout.write(`Usage: work-run.mjs <command> [options]

Commands:
  init --run-id ID --project P --branch B --description D --stories-file F
       --endpoint pr|merge|staging|deploy|local-only --source-spec S
       --tracking-provider P --tracking-issue-id I --tracking-key K --tracking-url U
       [--max-iterations N] [--force]
  pick [--run-id ID]
  mark-pass --story ID [--note TEXT]
  mark-blocked --story ID --reason TEXT
  bump-iteration
  set-max --max-iterations N   (always rejected after seal)
  status
  append --text TEXT
  admission --evidence PATH [--endpoint E] [--subject-head S] [--environment ENV] [--surface SURF]
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
    case 'admission':
    case 'check-admission':
      return cmdAdmission(cwd, args);
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
