import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { normalizeRepoIdentity } from './release-admission.mjs';

const SHA = /^[a-f0-9]{40}$/u;
const MAX_GIT_BUFFER_BYTES = 64 * 1024 * 1024;
const MAX_SOURCE_TREE_BYTES = 512 * 1024 * 1024;
const digest = (value) => createHash('sha256').update(value).digest('hex');

function gitEnvironment() {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith('GIT_')) delete env[key];
  return { ...env, GIT_CONFIG_GLOBAL: os.devNull, GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0' };
}

function requireValue(value, message) {
  if (!value) throw new Error(`admission adoption denied: ${message}`);
}

function git(cwd, args, options = {}) {
  return execFileSync('git', ['-c', 'core.hooksPath=/dev/null', ...args], {
    cwd, encoding: 'utf8', timeout: 30_000, maxBuffer: MAX_GIT_BUFFER_BYTES,
    stdio: ['pipe', 'pipe', 'pipe'], env: gitEnvironment(), ...options,
  });
}

function provider(cwd, args) {
  try {
    return JSON.parse(execFileSync('gh', args, {
      cwd, encoding: 'utf8', timeout: 30_000, maxBuffer: 4 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    }));
  } catch {
    throw new Error('admission adoption denied: source PR provider qualification failed');
  }
}

function binding(options) {
  const { cwd, baseSha, subjectHead, endpoint, expectedEnvironment, expectedSurface, configSha, runId } = options;
  requireValue(endpoint === 'staging' && expectedEnvironment === 'staging' &&
    typeof expectedSurface === 'string' && /^[a-z0-9-]+$/u.test(expectedSurface),
  'only an explicitly bound staging target is supported');
  const root = fs.realpathSync(git(cwd, ['rev-parse', '--show-toplevel']).trim());
  requireValue(fs.realpathSync(cwd) === root, 'invoke from the original repository root');
  requireValue(SHA.test(baseSha) && SHA.test(subjectHead) &&
    git(cwd, ['rev-parse', 'HEAD']).trim() === subjectHead, 'original subject changed');
  const repo = normalizeRepoIdentity(git(root, ['remote', 'get-url', 'origin']).trim(), root);
  requireValue(/^remote:github\.com\/[a-z0-9_.-]+\/[a-z0-9_.-]+$/u.test(repo),
    'a GitHub origin is required');
  return { version: 1, repo, worktreePath: root, runId: runId || null, baseSha, subjectHead,
    endpoint, environment: expectedEnvironment, surface: expectedSurface, configSha };
}

function receiptPath(options, identity) {
  const directory = path.join(options.stateRoot, 'admission-adoptions');
  if (fs.existsSync(directory)) {
    requireValue(fs.lstatSync(directory).isDirectory() && !fs.lstatSync(directory).isSymbolicLink(),
      'adoption directory must not be a symlink');
  }
  return path.join(directory, `${digest(JSON.stringify(identity))}.json`);
}

function qualifySource(options, identity, sourcePr) {
  const repository = identity.repo.slice('remote:github.com/'.length);
  const match = /^https:\/\/github\.com\/([^/]+\/[^/]+)\/pull\/([1-9][0-9]*)$/u.exec(sourcePr || '');
  requireValue(match && match[1].toLowerCase() === repository, 'source PR must belong to the original origin');
  const fields = 'url,state,isDraft,headRefOid,headRepository,headRepositoryOwner,baseRefName,mergedAt,mergeCommit,statusCheckRollup,reviewDecision';
  const readPull = () => provider(options.cwd, ['pr', 'view', sourcePr, '--json', fields]);
  const pull = readPull();
  const sameRepo = (repo, owner) => `${owner?.login}/${repo?.name}`.toLowerCase() === repository;
  requireValue(pull.url?.toLowerCase() === sourcePr.toLowerCase() && pull.state === 'MERGED' &&
    pull.isDraft === false && pull.baseRefName === 'staging' && pull.mergedAt &&
    sameRepo(pull.headRepository, pull.headRepositoryOwner) &&
    SHA.test(pull.headRefOid || '') && SHA.test(pull.mergeCommit?.oid || '') &&
    !['CHANGES_REQUESTED', 'REVIEW_REQUIRED'].includes(pull.reviewDecision), 'source PR must be a reviewed staging control merge');
  const checks = provider(options.cwd, ['pr', 'checks', sourcePr, '--required', '--json', 'name,state,bucket,link']);
  requireValue(Array.isArray(checks) && checks.length > 0 && checks.every((check) => check.bucket === 'pass'),
    'current source PR required checks must pass');
  requireValue(Array.isArray(pull.statusCheckRollup) && checks.every((check) => {
    const observations = pull.statusCheckRollup.filter((item) => (item.name || item.context) === check.name);
    return observations.length > 0 && observations.every((item) =>
      (!item.headSha || item.headSha === pull.headRefOid) &&
      (item.state === 'SUCCESS' || (item.status === 'COMPLETED' &&
        ['SUCCESS', 'NEUTRAL', 'SKIPPED'].includes(item.conclusion))));
  }), 'required check observations contradict the current source head');
  const finalPull = readPull();
  requireValue(finalPull.headRefOid === pull.headRefOid && finalPull.mergeCommit?.oid === pull.mergeCommit.oid &&
    finalPull.state === 'MERGED' && !['CHANGES_REQUESTED', 'REVIEW_REQUIRED'].includes(finalPull.reviewDecision),
    'source PR changed during qualification');
  const sourceSha = pull.mergeCommit.oid;
  requireValue(git(options.cwd, ['rev-parse', '--verify', `${sourceSha}^{commit}`]).trim() === sourceSha,
    'fetch the exact merged tooling commit before adoption');
  const originalConfig = git(options.cwd, ['show', `${identity.baseSha}:closeout-command.json`], { encoding: 'buffer' });
  const sourceConfig = git(options.cwd, ['show', `${sourceSha}:closeout-command.json`], { encoding: 'buffer' });
  requireValue(originalConfig.equals(sourceConfig) && `sha256:${digest(originalConfig)}` === identity.configSha,
    'source must preserve the sealed admission, final command and rollback policy');
  const sourceTree = git(options.cwd, ['rev-parse', `${sourceSha}^{tree}`]).trim();
  requireValue(SHA.test(sourceTree), 'invalid source dependency tree');
  return { sourcePr, sourceHead: pull.headRefOid, sourceSha, sourceTree };
}

export function adoptAdmissionSource(options) {
  const identity = binding(options);
  const source = qualifySource(options, identity, options.sourcePr);
  const receipt = { ...identity, ...source };
  const destination = receiptPath(options, identity);
  requireValue(!fs.existsSync(`${destination}.${source.sourceSha}.revoked`), 'this source adoption was withdrawn');
  fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
  const bytes = `${JSON.stringify(receipt, null, 2)}\n`;
  try {
    fs.writeFileSync(destination, bytes, { flag: 'wx', mode: 0o600 });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    requireValue(fs.lstatSync(destination).isFile() && !fs.lstatSync(destination).isSymbolicLink() &&
      fs.readFileSync(destination, 'utf8') === bytes, 'an incompatible adoption already exists; preserve it for recovery');
  }
  return { ok: true, receipt: destination, ...receipt };
}

export function revokeAdmissionSource(options) {
  const identity = binding(options);
  const receiptFile = receiptPath(options, identity);
  const stat = fs.lstatSync(receiptFile);
  requireValue(stat.isFile() && !stat.isSymbolicLink(), 'receipt must be a regular file');
  const bytes = fs.readFileSync(receiptFile);
  const receipt = JSON.parse(bytes);
  for (const [key, value] of Object.entries(identity)) {
    requireValue(receipt[key] === value, `receipt ${key} mismatch`);
  }
  requireValue(SHA.test(receipt.sourceSha || ''), 'invalid adopted source');
  const preserved = `${receiptFile}.${receipt.sourceSha}.revoked`;
  try { fs.linkSync(receiptFile, preserved); } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    requireValue(fs.lstatSync(preserved).isFile() && !fs.lstatSync(preserved).isSymbolicLink() &&
      fs.readFileSync(preserved).equals(bytes), 'conflicting withdrawal evidence must be preserved');
  }
  requireValue(fs.readFileSync(receiptFile).equals(bytes), 'receipt changed during revocation');
  fs.unlinkSync(receiptFile);
  return { ok: true, revoked: preserved, subjectHead: identity.subjectHead };
}

// A fresh full source tree binds imported helpers too; the original checkout and final oracle stay intact.
export function admissionRuntime(options) {
  let identity;
  try { identity = binding(options); } catch { return null; }
  const receiptFile = receiptPath(options, identity);
  if (!fs.existsSync(receiptFile)) return null;
  const stat = fs.lstatSync(receiptFile);
  requireValue(stat.isFile() && !stat.isSymbolicLink(), 'receipt must be a regular file');
  const receipt = JSON.parse(fs.readFileSync(receiptFile, 'utf8'));
  requireValue(SHA.test(receipt.sourceSha || '') && !fs.existsSync(`${receiptFile}.${receipt.sourceSha}.revoked`),
    'this source adoption was withdrawn');
  for (const [key, value] of Object.entries(identity)) {
    requireValue(receipt[key] === value, `receipt ${key} mismatch`);
  }
  const source = qualifySource(options, identity, receipt.sourcePr);
  for (const [key, value] of Object.entries(source)) {
    requireValue(receipt[key] === value, `receipt ${key} mismatch`);
  }
  const directory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'admission-runtime-')));
  fs.chmodSync(directory, 0o700);
  const cleanup = () => fs.rmSync(directory, { recursive: true, force: true });
  try {
    const entries = git(options.cwd, ['ls-tree', '-rz', '--long', '--full-tree', source.sourceSha]).split('\0').filter(Boolean)
      .map((entry) => {
        const match = /^(100644|100755|120000|160000) (blob|commit) ([a-f0-9]{40}) +([0-9]+|-)\t(.+)$/us.exec(entry);
        requireValue(match, 'unsupported tooling tree entry');
        const [, mode, type, oid, sizeText, file] = match;
        requireValue(!path.isAbsolute(file) && file.split('/').every((part) =>
          part && part !== '.' && part !== '..' && part.toLowerCase() !== '.git'), 'unsafe tooling tree path');
        const size = Number(sizeText);
        const outputBytes = size + Buffer.byteLength(`${oid} blob ${size}\n`) + 1;
        if (mode === '100644' || mode === '100755') {
          requireValue(type === 'blob' && Number.isSafeInteger(size) && size >= 0 &&
            outputBytes <= MAX_GIT_BUFFER_BYTES, 'tooling source blob exceeds the 64 MiB batch limit');
        }
        return { mode, oid, file, size, outputBytes };
      }).filter((entry) => entry.mode === '100644' || entry.mode === '100755');
    requireValue(entries.reduce((total, entry) => total + entry.size, 0) <= MAX_SOURCE_TREE_BYTES,
      'tooling source tree exceeds the 512 MiB limit');
    // Raw blobs preserve reviewed bytes; each framed batch fits the existing Git buffer cap.
    for (let start = 0; start < entries.length;) {
      let end = start;
      let outputBytes = 0;
      while (end < entries.length && outputBytes + entries[end].outputBytes <= MAX_GIT_BUFFER_BYTES) {
        outputBytes += entries[end].outputBytes;
        end += 1;
      }
      const batch = entries.slice(start, end);
      const blobs = git(options.cwd, ['cat-file', '--batch'], {
        input: Buffer.from(batch.map((entry) => entry.oid).join('\n') + '\n'), encoding: 'buffer',
      });
      let offset = 0;
      for (const entry of batch) {
        const endOfHeader = blobs.indexOf(10, offset);
        const size = entry.size;
        requireValue(endOfHeader >= offset &&
          blobs.subarray(offset, endOfHeader).toString('utf8') === `${entry.oid} blob ${size}` &&
          endOfHeader + size + 1 < blobs.length && blobs[endOfHeader + size + 1] === 10,
        'invalid tooling source blob');
        const bytes = blobs.subarray(endOfHeader + 1, endOfHeader + size + 1);
        requireValue(createHash('sha1').update(`blob ${size}\0`).update(bytes).digest('hex') === entry.oid,
          'tooling source blob identity mismatch');
        const file = path.join(directory, entry.file);
        fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
        fs.writeFileSync(file, bytes, { flag: 'wx', mode: entry.mode === '100755' ? 0o700 : 0o600 });
        offset = endOfHeader + size + 2;
      }
      requireValue(offset === blobs.length, 'unexpected tooling source data');
      start = end;
    }
    git(directory, ['init', '--template=', '-q']);
    const objectDirectory = git(options.cwd, ['rev-parse', '--path-format=absolute', '--git-path', 'objects']).trim();
    fs.writeFileSync(path.join(directory, '.git', 'objects', 'info', 'alternates'), `${objectDirectory}\n`);
    git(directory, ['update-ref', '--no-deref', 'HEAD', identity.subjectHead]);
    git(directory, ['remote', 'add', 'origin', `https://github.com/${identity.repo.slice('remote:github.com/'.length)}.git`]);
    git(directory, ['read-tree', source.sourceSha]);
    requireValue(git(directory, ['rev-parse', 'HEAD']).trim() === identity.subjectHead,
      'tooling runtime changed the original subject');
    return { cwd: directory, env: gitEnvironment(), source, cleanup };
  } catch (error) {
    cleanup();
    throw error;
  }
}
