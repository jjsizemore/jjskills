#!/usr/bin/env node
/**
 * Controller-owned closeout verifier. It never accepts a caller-supplied oracle.
 * It rebinds evidence to the sealed baseline config, current HEAD, delivered
 * diff, and controller-executed project oracle.
 */
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { CLOSEOUT_ORACLE_TIMEOUT_MS } from './closeout-timeouts.mjs';
import { evaluateReleaseAdmission } from './release-admission.mjs';

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined || value.startsWith('--')) {
      fail('closeout verifier arguments are invalid');
    }
    args[key.slice(2)] = value;
    index += 1;
  }
  return args;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    fail(`cannot read closeout verifier input: ${filePath}`);
  }
}

function gitHead(cwd) {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim();
  } catch {
    fail('cannot resolve closeout verifier subject head');
  }
}

function oracleResult(cwd, command) {
  const result = spawnSync(command[0], command.slice(1), {
    cwd,
    encoding: 'utf8',
    timeout: CLOSEOUT_ORACLE_TIMEOUT_MS,
  });
  return {
    command,
    status: result.status,
    signal: result.signal,
    stdout: result.stdout,
  };
}

function pullRequestInfo(cwd, url) {
  const result = spawnSync('gh', ['pr', 'view', url, '--json', 'url,headRefOid,mergedAt,mergeCommit'], {
    cwd,
    encoding: 'utf8',
    timeout: 30_000,
  });
  if (result.status !== 0 || result.signal) {
    fail('closeout verifier cannot query current GitHub PR metadata');
  }
  let payload;
  try {
    payload = JSON.parse(result.stdout);
  } catch {
    fail('closeout verifier received invalid GitHub PR metadata');
  }
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload) ||
    typeof payload.headRefOid !== 'string' ||
    payload.headRefOid.length === 0
  ) {
    fail('closeout verifier received PR metadata without headRefOid');
  }
  return payload;
}


function diffDigest(cwd, baseSha, subjectHead) {
  try {
    const diff = execFileSync('git', ['diff', '--binary', `${baseSha}..${subjectHead}`], {
      cwd,
      encoding: 'buffer',
    });
    return `sha256:${createHash('sha256').update(diff).digest('hex')}`;
  } catch {
    fail('cannot resolve closeout verifier delivered diff');
  }
}
function closeoutConfigDigest(cwd, baseSha) {
  try {
    const config = execFileSync('git', ['show', `${baseSha}:closeout-command.json`], {
      cwd,
      encoding: 'buffer',
    });
    return `sha256:${createHash('sha256').update(config).digest('hex')}`;
  } catch {
    fail('cannot resolve baseline closeout-command.json');
  }
}

const args = parseArgs(process.argv.slice(2));
const required = ['cwd', 'run-id', 'ledger', 'evidence', 'base-sha', 'subject-head', 'diff-digest'];
if (required.some((key) => typeof args[key] !== 'string' || args[key].length === 0)) {
  fail('closeout verifier requires cwd, run identity, ledger, evidence, and SHA bindings');
}

requireCleanTree(args.cwd);
const ledger = readJson(args.ledger);
function requireCleanTree(cwd) {
  const result = spawnSync('git', ['status', '--porcelain', '--untracked-files=all'], {
    cwd,
    encoding: 'utf8',
  });
  if (result.status !== 0) fail('closeout verifier cannot inspect Git worktree');
  if (result.stdout.trim() !== '') fail('closeout verifier requires a clean Git worktree');
}
const evidence = readJson(args.evidence);
const actualConfigSha = closeoutConfigDigest(args.cwd, args['base-sha']);
const actualHead = gitHead(args.cwd);
const actualDigest = diffDigest(args.cwd, args['base-sha'], args['subject-head']);
if (
  ledger.runId !== args['run-id'] ||
  ledger.baseSha !== args['base-sha'] ||
  ledger.closeoutConfigSha !== actualConfigSha ||
  evidence.runId !== args['run-id'] ||
  evidence.status !== 'VERIFIED' ||
  evidence.baseSha !== args['base-sha'] ||
  evidence.subjectHead !== args['subject-head'] ||
  evidence.diffDigest !== args['diff-digest'] ||
  args['subject-head'] !== actualHead ||
  args['diff-digest'] !== actualDigest ||
  !Array.isArray(ledger.userStories) ||
  ledger.userStories.length === 0 ||
  !ledger.userStories.every((story) => story.passes === true)
) {
  fail('closeout verifier rejected unbound or incomplete evidence');
}
const expectedOracle =
  Array.isArray(ledger.closeoutCommand) && ledger.closeoutCommand.length > 0
    ? oracleResult(args.cwd, ledger.closeoutCommand)
    : null;
if (expectedOracle === null || expectedOracle.status !== 0 || expectedOracle.signal) {
  fail('closeout verifier project oracle failed');
}
const ENDPOINTS = new Set(['pr', 'merge', 'staging', 'deploy', 'local-only']);
const hasEndpoint = Object.hasOwn(ledger, 'endpoint');
if (hasEndpoint && !ENDPOINTS.has(ledger.endpoint)) {
  fail('closeout verifier rejected unknown immutable endpoint');
}
let mergedSha = null;
if (hasEndpoint && ledger.endpoint !== 'local-only') {
  if (typeof evidence.prUrl !== 'string' || !/^https?:\/\//u.test(evidence.prUrl)) {
    fail('closeout verifier requires a PR URL for this delivery target');
  }
  const pr = pullRequestInfo(args.cwd, evidence.prUrl);
  if (pr.headRefOid !== args['subject-head']) {
    fail('closeout verifier requires the queried PR head SHA to match the subject head');
  }
  if (ledger.endpoint !== 'pr') {
    if (typeof pr.mergedAt !== 'string' || !pr.mergedAt ||
        !/^[a-f0-9]{40,64}$/u.test(pr.mergeCommit?.oid || '')) {
      fail('closeout verifier requires actual merge evidence for this delivery target');
    }
    mergedSha = pr.mergeCommit.oid;
  }
}
if (hasEndpoint && ['staging', 'deploy'].includes(ledger.endpoint)) {
  let proof;
  try {
    proof = JSON.parse(expectedOracle.stdout).deliveryProof;
  } catch {
    fail('closeout verifier project oracle did not return independent delivery proof');
  }
  const environment = ledger.endpoint === 'staging' ? 'staging' : 'production';
  if (!proof || proof.endpoint !== ledger.endpoint ||
      proof.subjectHead !== args['subject-head'] || proof.environment !== environment ||
      proof.runtimeSha !== mergedSha || proof.checksPassed !== true ||
      typeof proof.expectedRuntimeVersion !== 'string' || !proof.expectedRuntimeVersion ||
      proof.runtimeVersion !== proof.expectedRuntimeVersion ||
      !/^[a-f0-9]{40,64}$/u.test(proof.expectedArtifactSha || '') ||
      proof.artifactSha !== proof.expectedArtifactSha) {
    fail('closeout verifier project oracle delivery observations do not bind the authorized target');
  }
  const safeguardsEvidence = proof.releaseSafeguards;
  if (!safeguardsEvidence) {
    fail('closeout verifier requires verified release safeguards admission in project oracle delivery observations');
  }
  const admission = evaluateReleaseAdmission({
    cwd: args.cwd,
    evidence: safeguardsEvidence,
    endpoint: ledger.endpoint,
    subjectHead: args['subject-head'],
    action: 'release-closeout',
  });
  if (!admission.admitted) {
    fail(`closeout verifier release safeguards admission failed: ${admission.reason}`);
  }
}
if (
  !evidence.oracle ||
  JSON.stringify(evidence.oracle.command) !== JSON.stringify(expectedOracle.command) ||
  evidence.oracle.status !== expectedOracle.status ||
  evidence.oracle.signal !== expectedOracle.signal
) {
  fail('closeout verifier rejected missing or stale project oracle evidence');
}


process.stdout.write(
  `${JSON.stringify({
    status: 'pass',
    runId: args['run-id'],
    baseSha: args['base-sha'],
    subjectHead: args['subject-head'],
    diffDigest: args['diff-digest'],
    verifier: 'closeout-verify.mjs',
  })}\n`,
);
