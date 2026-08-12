#!/usr/bin/env node
/**
 * Controller-owned closeout verifier. It never accepts a caller-supplied oracle.
 * It rebinds evidence to the sealed baseline config, current HEAD, delivered
 * diff, and controller-executed project oracle.
 */
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';

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
    timeout: 120_000,
  });
  return {
    command,
    status: result.status,
    signal: result.signal,
  };
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
