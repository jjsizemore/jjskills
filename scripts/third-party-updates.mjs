#!/usr/bin/env node
// scripts/third-party-updates.mjs
//
// Weekly third-party skill updater. Compares real reviewed upstream bytes at
// the pinned revision with current upstream and local files. Only advances a
// local file when it still matches that three-way merge base.
//
// Safety rules:
//   - Unpinned sources still resolve HEAD/tree and report moves, but never write.
//   - The durable base consists of bytes fetched from the reviewed upstream
//     pin; old v1 local snapshots are discarded.
//   - If local and upstream both changed from base, preserve local bytes and
//     report conflict; no unproven merge is applied.
//   - Local-only files, upstream additions/deletions, disabled and
//     license-blocked content are never silently copied or removed.
//   - Missing/ambiguous upstream paths and fetch failures are reported.
//   - Only successful clean comparisons advance the base revision.
//
// Exit codes: 0 = run completed (even with needs-review/fetch-failed items;
// gate PR creation on the report, not the exit code). 1 = unexpected error
// (unreadable inventory, corrupt baseline, local IO failure).
//
// Network use is read-only GitHub REST API metadata and file bytes. Upstream
// content is never executed; credentials are never sent to raw-content hosts.
//
// Usage:
//   node scripts/third-party-updates.mjs [--root <dir>] [--check]
//       [--report <path>] [--init-baseline] [--help]
//   --check: no skill or baseline writes; report is still persisted.
//   --report: also write JSON to <path>; stdout and tracked report are stable.
//   --init-baseline: write an empty pin marker offline; normal run fetches
//     reviewed upstream bytes before any update can be applied.
//
// Idempotency: rerunning with no upstream/local movement yields `up-to-date`
// everywhere and rewrites identical baseline bytes.

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, dirname, resolve, sep } from 'node:path';

export const BASELINE_FILENAME = '.third-party-baseline.json';
export const INVENTORY_FILENAME = 'third-party-skills.json';
// Sources whose bytes must never be copied locally, even when the merge
// would otherwise be clean. See upstreamReviews note in the inventory.
export const LICENSE_BLOCKED_SOURCES = new Set(['remotion-dev/skills']);

export class FetchError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FetchError';
    this.retryable = true;
  }
}

export function sha256Hex(data) {
  return createHash('sha256').update(data).digest('hex');
}

// Deterministic JSON: sorted keys, stable across runs/locales.
export function stableStringify(value) {
  const seen = new Set();
  const render = (v, indent) => {
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (seen.has(v)) throw new Error('stableStringify: circular value');
    seen.add(v);
    const pad = '  '.repeat(indent);
    const pad1 = '  '.repeat(indent + 1);
    let out;
    if (Array.isArray(v)) {
      if (v.length === 0) out = '[]';
      else out = `[\n${v.map((e) => `${pad1}${render(e, indent + 1)}`).join(',\n')}\n${pad}]`;
    } else {
      const keys = Object.keys(v).sort();
      if (keys.length === 0) out = '{}';
      else {
        out = `{\n${keys
          .map((k) => `${pad1}${JSON.stringify(k)}: ${render(v[k], indent + 1)}`)
          .join(',\n')}\n${pad}}`;
      }
    }
    seen.delete(v);
    return out;
  };
  return `${render(value, 0)}\n`;
}

// A review entry pins either { revision } or { revisionParts: [...] } — the
// latter exists because a full public SHA trips the secret scanner, so the
// parts are joined in order to reconstruct it. Returns null when unpinned.
export function joinRevision(entry) {
  if (!entry || typeof entry !== 'object') return null;
  if (typeof entry.revision === 'string' && entry.revision.length > 0) return entry.revision;
  if (Array.isArray(entry.revisionParts) && entry.revisionParts.length > 0) {
    return entry.revisionParts.join('');
  }
  return null;
}

// Inventory paths carry a historical `skills/` prefix that no longer matches
// the repo layout (skills live at the repo top level, e.g. ponytail/SKILL.md,
// and per-area nests like skills/engineering/<name>/SKILL.md were flattened
// to <name>/SKILL.md). Try each exact derivation in order; first hit wins.
export function candidateLocalPaths(invPath) {
  const out = [invPath];
  if (invPath.startsWith('skills/')) out.push(invPath.slice('skills/'.length));
  const parts = invPath.split('/');
  if (parts.length > 2) {
    const tail = parts.slice(-2).join('/');
    if (!out.includes(tail)) out.push(tail);
  }
  return out;
}

// Match a local skill against repo-relative upstream tree paths. Exactly one
// hit (exact or `/localPath` suffix) wins; exact matches beat suffix matches.
export function matchUpstreamEntry(treePaths, localRel, invPath) {
  const cands = new Set([localRel, invPath]);
  const hits = treePaths.filter((p) => cands.has(p) || [...cands].some((c) => p.endsWith(`/${c}`)));
  if (hits.length === 0) return { kind: 'none' };
  const exact = hits.filter((p) => cands.has(p));
  const winners = exact.length === 1 ? exact : exact.length > 1 ? exact : hits;
  if (winners.length === 1) return { kind: 'single', path: winners[0] };
  return { kind: 'ambiguous', paths: [...new Set(winners)].sort() };
}

function short(sha) {
  return typeof sha === 'string' && sha.length > 12 ? sha.slice(0, 12) : String(sha);
}

function skillResult(status, detail, extra = {}) {
  return { status, detail, ...extra };
}

// Core: pure orchestration over injectable adapters, so tests run fully
// offline with in-memory fs + fake upstream. Adapters:
//   exists(rel)->bool, read(rel)->Uint8Array,
//   listFiles(rel)->string[] (optional, recursive files inside a local skill),
//   write(rel, bytes)->void (only called when !check),
//   getHead(src)->sha, getTree(src, rev)->string[],
//   getFile(src, rev, upstreamPath)->Uint8Array (FetchError on network trouble)
export async function runUpdate({ inventory, baseline, adapters, check = false, now = () => new Date().toISOString() }) {
  const { exists, read, write, getHead, getTree, getFile } = adapters;
  const sources = inventory?.sources && typeof inventory.sources === 'object' ? inventory.sources : null;
  if (!sources) throw new Error('inventory has no `sources` object');
  const reviews = inventory?.upstreamReviews && typeof inventory.upstreamReviews === 'object' ? inventory.upstreamReviews : {};
  const nextBaseline = { version: 2, updatedAt: baseline?.updatedAt ?? now(), sources: structuredClone(baseline?.sources ?? {}) };
  const reportSources = {};
  const writes = [];
  let baselineTouched = baseline?.version !== 2;

  const localPath = async (invPath) => {
    for (const candidate of candidateLocalPaths(invPath)) if (candidate && await exists(candidate)) return candidate;
    return null;
  };

  for (const src of Object.keys(sources).sort()) {
    const skills = sources[src];
    const pin = joinRevision(reviews[src]);
    const entry = { pinnedRevision: pin, upstreamRevision: null, status: 'up-to-date', skills: {}, error: null, retry: false };
    reportSources[src] = entry;

    // Resolve HEAD and the tree even without a reviewed pin: unpinned sources
    // still need deterministic move reporting rather than a silent skip.
    let head;
    try {
      head = await getHead(src);
      entry.upstreamRevision = head;
    } catch (err) {
      entry.status = 'fetch-failed';
      entry.error = err?.message ?? String(err);
      entry.retry = true;
      for (const name of Object.keys(skills).sort()) entry.skills[name] = skillResult('fetch-failed', `could not resolve upstream HEAD for ${src}; rerun to retry`);
      continue;
    }
    let headTree;
    try {
      headTree = await getTree(src, head);
    } catch (err) {
      entry.status = 'fetch-failed';
      entry.error = err?.message ?? String(err);
      entry.retry = true;
      for (const name of Object.keys(skills).sort()) entry.skills[name] = skillResult('fetch-failed', `could not list upstream tree for ${src}@${short(head)}; rerun to retry`);
      continue;
    }
    if (!pin) {
      entry.status = 'needs-review';
      const previous = nextBaseline.sources[src] ?? {};
      const prior = previous.upstreamRevision ?? null;
      for (const name of Object.keys(skills).sort()) {
        const invPath = skills[name].paths?.[0] ?? '';
        const mapped = matchUpstreamEntry(headTree, invPath, invPath);
        entry.skills[name] = skillResult('unpinned', mapped.kind === 'single'
          ? `no reviewed pin for ${src}; upstream is ${short(head)}${prior && prior !== head ? ` (moved from ${short(prior)})` : ''}; pin required before automation can merge`
          : `no reviewed pin for ${src}; upstream skill path ${invPath} is ${mapped.kind === 'none' ? 'not found' : 'ambiguous'} at ${short(head)}; review required`,
          { upstreamRevision: head, ...(prior && prior !== head ? { movedFrom: prior } : {}) });
      }
      if (prior !== head) {
        nextBaseline.sources[src] = { ...previous, pinnedRevision: null, upstreamRevision: head, files: previous.files ?? {} };
        baselineTouched = true;
      }
      continue;
    }

    let base = nextBaseline.sources[src];
    const needsAnchor = !base || base.pinnedRevision !== pin || baseline?.version !== 2;
    let pinTree = null;
    if (needsAnchor && !LICENSE_BLOCKED_SOURCES.has(src)) {
      try { pinTree = await getTree(src, pin); }
      catch (err) {
        entry.status = 'fetch-failed'; entry.error = err?.message ?? String(err); entry.retry = true;
        for (const name of Object.keys(skills).sort()) entry.skills[name] = skillResult('fetch-failed', `could not read reviewed upstream tree ${src}@${short(pin)}; rerun to retry`);
        continue;
      }
      base = { pinnedRevision: pin, upstreamRevision: pin, files: {} };
      for (const name of Object.keys(skills).sort()) {
        const invPath = skills[name].paths?.[0] ?? '';
        const localSkill = await localPath(invPath);
        if (!localSkill || await exists(`${dirname(localSkill)}/.disabled`)) continue;
        const skillDir = dirname(localSkill);
        const upstreamSkill = matchUpstreamEntry(pinTree, localSkill, invPath);
        if (upstreamSkill.kind !== 'single') continue;
        const upstreamDir = dirname(upstreamSkill.path);
        const pinnedFiles = pinTree.filter((p) => p === upstreamSkill.path || p.startsWith(`${upstreamDir}/`)).sort();
        for (const upstreamFile of pinnedFiles) {
          const relative = upstreamFile === upstreamSkill.path ? 'SKILL.md' : upstreamFile.slice(upstreamDir.length + 1);
          if (!relative || relative.startsWith('../') || relative.split('/').includes('..')) continue;
          const localFile = `${skillDir}/${relative}`;
          try { base.files[localFile] = sha256Hex(await getFile(src, pin, upstreamFile)); }
          catch (err) {
            entry.status = 'fetch-failed'; entry.error = err?.message ?? String(err); entry.retry = true;
            break;
          }
        }
        if (entry.status === 'fetch-failed') break;
      }
      if (entry.status === 'fetch-failed') {
        for (const name of Object.keys(skills).sort()) entry.skills[name] ??= skillResult('fetch-failed', `could not anchor reviewed upstream bytes ${src}@${short(pin)}; rerun to retry`);
        continue;
      }
      nextBaseline.sources[src] = base;
      entry.status = 'baseline-initialized';
      baselineTouched = true;
    } else if (needsAnchor) {
      base = { pinnedRevision: pin, upstreamRevision: pin, files: {} };
      nextBaseline.sources[src] = base;
      entry.status = 'baseline-initialized';
      baselineTouched = true;
    }

    base.files ??= {};
    const moved = head !== (base.upstreamRevision ?? pin);
    let sourceNeedsReview = false;
    let sourceUpdated = false;
    for (const name of Object.keys(skills).sort()) {
      const invPath = skills[name].paths?.[0] ?? '';
      const localSkill = await localPath(invPath);
      if (!localSkill) {
        entry.skills[name] = skillResult('missing-locally', `tracked as ${invPath} but not present locally; not recreated — restore or remove via provider flow`);
        sourceNeedsReview = true;
        continue;
      }
      const skillDir = dirname(localSkill);
      if (await exists(`${skillDir}/.disabled`)) {
        entry.skills[name] = skillResult('disabled-skipped', `${skillDir} is disabled via .disabled marker; left untouched`);
        sourceNeedsReview = true;
        continue;
      }
      if (LICENSE_BLOCKED_SOURCES.has(src)) {
        entry.skills[name] = skillResult('license-blocked', `source ${src} is pinned at ${short(pin)} but redistribution rights are unclarified; bytes are never copied`, { upstreamRevision: head });
        sourceNeedsReview = true;
        continue;
      }
      const headSkill = matchUpstreamEntry(headTree, localSkill, invPath);
      if (headSkill.kind !== 'single') {
        entry.skills[name] = skillResult(headSkill.kind === 'none' ? 'upstream-path-not-found' : 'upstream-ambiguous',
          headSkill.kind === 'none' ? `no upstream skill matches ${invPath} in ${src}@${short(head)}; skill may have moved or been removed; local files preserved`
            : `multiple upstream skills match ${invPath}; disambiguate manually`, { upstreamRevision: head });
        sourceNeedsReview = true;
        continue;
      }
      const upstreamDir = dirname(headSkill.path);
      const localFiles = typeof adapters.listFiles === 'function' ? await adapters.listFiles(skillDir) : [localSkill];
      const localSet = new Set(localFiles);
      const upstreamFiles = headTree.filter((p) => p.startsWith(`${upstreamDir}/`)).sort();
      const paths = new Set([...localFiles, ...upstreamFiles.map((p) => `${skillDir}/${p.slice(upstreamDir.length + 1)}`)]);
      const fileStates = {};
      let skillUpdated = false;
      let skillReview = false;
      for (const localFile of [...paths].sort()) {
        if (localFile === skillDir || !localFile.startsWith(`${skillDir}/`)) continue;
        const relative = localFile.slice(skillDir.length + 1);
        if (relative.startsWith('../') || relative.split('/').includes('..') || relative === '.disabled') continue;
        const upFile = `${upstreamDir}/${relative}`;
        const existsLocal = localSet.has(localFile);
        const existsUp = headTree.includes(upFile);
        const baseSha = base.files[localFile];
        const baseKnown = baseSha !== undefined;
        let localSha = null;
        if (existsLocal) localSha = sha256Hex(await read(localFile));
        if (!existsUp) {
          if (existsLocal && baseKnown) {
            fileStates[localFile] = skillResult('upstream-removed', `upstream removed ${relative}; local copy preserved`);
            skillReview = true;
          } else if (existsLocal && !baseKnown) {
            fileStates[localFile] = skillResult('local-only', `${relative} has no upstream counterpart; preserved`);
          } else if (baseKnown && !existsLocal) {
            fileStates[localFile] = skillResult('local-deleted', `${relative} was locally deleted; deletion preserved`);
          }
          continue;
        }
        if (!moved) {
          if (existsLocal && baseKnown && localSha === baseSha) {
            fileStates[localFile] = skillResult('up-to-date', 'matches reviewed upstream base', { sha: localSha });
          } else if (!existsLocal) {
            fileStates[localFile] = skillResult('local-deleted', `${relative} is missing locally; it was not recreated`);
            skillReview = true;
          } else {
            fileStates[localFile] = skillResult('locally-modified', `${relative} differs from reviewed base; upstream unchanged — local bytes kept`);
            skillReview = true;
          }
          continue;
        }
        let upstreamBytes;
        try { upstreamBytes = await getFile(src, head, upFile); }
        catch (err) {
          fileStates[localFile] = skillResult('fetch-failed', `could not fetch ${upFile} from ${src}@${short(head)} (${err?.message ?? err}); rerun to retry`);
          entry.status = 'fetch-failed'; entry.error = err?.message ?? String(err); entry.retry = true; sourceNeedsReview = true; skillReview = true;
          continue;
        }
        const upstreamSha = sha256Hex(upstreamBytes);
        if (!existsLocal) {
          if (baseKnown) {
            fileStates[localFile] = skillResult('local-deleted', `${relative} was locally deleted; upstream copy not recreated`);
            skillReview = true;
          } else {
            fileStates[localFile] = skillResult('upstream-added', `untracked upstream file ${relative}; review before adding it locally`);
            skillReview = true;
          }
          continue;
        }
        const localModified = !baseKnown || localSha !== baseSha;
        if (localSha === upstreamSha) {
          base.files[localFile] = upstreamSha;
          if (baseSha !== upstreamSha) baselineTouched = true;
          fileStates[localFile] = skillResult('up-to-date', 'local and upstream bytes match', { sha: localSha });
          continue;
        }
        if (localModified) {
          fileStates[localFile] = upstreamSha === baseSha
            ? skillResult('locally-modified', `${relative} differs from reviewed base; upstream unchanged — local bytes kept`)
            : skillResult('conflict', `${relative} changed locally and upstream; manual merge required`, { upstreamSha, baseSha, localSha });
          skillReview = true;
          continue;
        }
        if (check) {
          fileStates[localFile] = skillResult('would-update', `clean update available for ${relative}; dry run`);
          skillReview = true;
          continue;
        }
        await write(localFile, upstreamBytes);
        writes.push({ path: localFile, sha: upstreamSha, bytes: upstreamBytes.length, upstreamPath: upFile });
        base.files[localFile] = upstreamSha; baselineTouched = true; sourceUpdated = true; skillUpdated = true;
        fileStates[localFile] = skillResult('updated', `${localFile} <- ${upFile} @ ${short(head)}`, { sha: upstreamSha, upstreamPath: upFile });
      }
      const fileStatus = Object.values(fileStates).map((r) => r.status);
      const status = fileStatus.includes('would-update') ? 'would-update' : skillReview
        ? (fileStatus.includes('conflict') ? 'conflict' : fileStatus.includes('upstream-removed') ? 'upstream-removed' : fileStatus.includes('fetch-failed') ? 'fetch-failed' : fileStatus.every((value) => value === 'locally-modified' || value === 'up-to-date' || value === 'local-only') ? 'locally-modified' : 'needs-review')
        : skillUpdated ? 'updated' : 'up-to-date';
      entry.skills[name] = skillResult(status, `${Object.keys(fileStates).length} tracked/upstream files checked`, { files: fileStates, ...(fileStates[localSkill]?.sha ? { sha: fileStates[localSkill].sha } : {}), upstreamRevision: head });
      if (skillReview) sourceNeedsReview = true;
    }
    if (!sourceNeedsReview && base.upstreamRevision !== head) {
      base.upstreamRevision = head;
      baselineTouched = true;
    }
    if (entry.status === 'fetch-failed') continue;
    if (sourceNeedsReview) entry.status = 'needs-review';
    else if (sourceUpdated) entry.status = 'updated';
    else if (entry.status !== 'baseline-initialized') entry.status = 'up-to-date';
  }
  const byStatus = {};
  let skillCount = 0;
  let needsReview = 0;
  for (const src of Object.keys(reportSources)) for (const result of Object.values(reportSources[src].skills)) {
    skillCount += 1;
    byStatus[result.status] = (byStatus[result.status] ?? 0) + 1;
    if (!['up-to-date', 'updated'].includes(result.status)) needsReview += 1;
  }
  if (baselineTouched && !check) nextBaseline.updatedAt = now();
  const report = {
    version: 1,
    limitations: ['Upstream deletions and local-only files are reported and preserved; files are never deleted automatically.', 'Local and upstream changes to the same bytes are reported as conflicts; automatic textual merging is not attempted.'],
    check,
    summary: { sources: Object.keys(reportSources).length, skills: skillCount, writes: writes.length, needsReview, byStatus },
    writes: writes.map(({ path, sha, bytes, upstreamPath }) => ({ path, sha, bytes, upstreamPath })),
    sources: reportSources,
    baselineUpdated: baselineTouched && !check,
  };
  return { report, baseline: nextBaseline, writes, baselineTouched };
}

// ---- production adapters (fs + read-only GitHub fetch) ----

function githubHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'jjskills-third-party-updates (weekly; read-only)',
  };
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (!token) throw new FetchError('GITHUB_TOKEN or GH_TOKEN is required for GitHub API requests');
  headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function githubJson(url) {
  let res;
  try {
    res = await fetch(url, { headers: githubHeaders() });
  } catch (err) {
    throw new FetchError(`network error fetching ${url}: ${err?.message ?? err}`);
  }
  if (!res.ok) throw new FetchError(`GET ${url} -> HTTP ${res.status}`);
  return res.json();
}

export function makeFsAdapters(root) {
  const safe = (rel) => {
    const abs = resolve(root, rel);
    if (abs !== resolve(root) && !abs.startsWith(`${resolve(root)}${sep}`)) throw new Error(`refusing path outside root: ${rel}`);
    return abs;
  };
  const listFiles = async (rel) => {
    const files = [];
    const visit = async (dir) => {
      for (const entry of await readdir(safe(dir), { withFileTypes: true })) {
        const child = `${dir}/${entry.name}`;
        if (entry.isDirectory()) await visit(child);
        else if (entry.isFile()) files.push(child);
      }
    };
    await visit(rel);
    return files.sort();
  };
  let defaultBranchCache = {};
  const blobCache = new Map();
  return {
    exists: async (rel) => {
      try { await readFile(safe(rel)); return true; } catch { return false; }
    },
    listFiles,
    read: (rel) => readFile(safe(rel)),
    write: (rel, bytes) => writeFile(safe(rel), bytes),
    getHead: async (src) => {
      defaultBranchCache[src] ??= (await githubJson(`https://api.github.com/repos/${src}`)).default_branch ?? 'main';
      const commit = await githubJson(`https://api.github.com/repos/${src}/commits/${defaultBranchCache[src]}`);
      if (!commit?.sha) throw new FetchError(`no commit SHA for ${src}`);
      return commit.sha;
    },
    getTree: async (src, rev) => {
      const tree = await githubJson(`https://api.github.com/repos/${src}/git/trees/${rev}?recursive=1`);
      if (!Array.isArray(tree?.tree)) throw new FetchError(`no tree for ${src}@${rev}`);
      if (tree.truncated) throw new FetchError(`GitHub tree for ${src}@${rev} was truncated`);
      const blobs = new Map(tree.tree.filter((e) => e.type === 'blob').map((e) => [e.path, e.sha]));
      blobCache.set(`${src}@${rev}`, blobs);
      return [...blobs.keys()];
    },
    getFile: async (src, rev, upstreamPath) => {
      const sha = blobCache.get(`${src}@${rev}`)?.get(upstreamPath);
      if (!sha) throw new FetchError(`no blob for ${upstreamPath}@${short(rev)}`);
      const blob = await githubJson(`https://api.github.com/repos/${src}/git/blobs/${sha}`);
      if (blob.encoding !== 'base64' || typeof blob.content !== 'string') throw new FetchError(`no base64 content for ${upstreamPath}@${short(rev)}`);
      return Buffer.from(blob.content.replace(/\n/g, ''), 'base64');
    },
  };
}

function parseArgs(argv) {
  const opts = { root: process.cwd(), check: false, report: null, initBaseline: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check') opts.check = true;
    else if (a === '--init-baseline') opts.initBaseline = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--root') opts.root = argv[++i] ?? opts.root;
    else if (a === '--report') opts.report = argv[++i] ?? opts.report;
    else if (a.startsWith('--root=')) opts.root = a.slice('--root='.length);
    else if (a.startsWith('--report=')) opts.report = a.slice('--report='.length);
    else throw new Error(`unknown argument: ${a}`);
  }
  if (!opts.root) throw new Error('--root requires a directory');
  if (!opts.report && !opts.initBaseline) opts.report = null;
  return opts;
}

const HELP = `third-party-updates.mjs: merge only safe upstream skill changes.

Usage: node scripts/third-party-updates.mjs [--root <dir>] [--check] [--report <path>] [--init-baseline]

Reads ${INVENTORY_FILENAME} (sources + upstreamReviews pins), compares each
source HEAD against the durable baseline ${BASELINE_FILENAME} and local bytes.
Writes only clean merges; every unsafe case is reported for PR review.
Stdout is the deterministic JSON report; progress goes to stderr.
`;

export async function main(argv = process.argv.slice(2)) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (err) {
    console.error(`error: ${err.message}`);
    console.error(HELP);
    process.exitCode = 1;
    return;
  }
  if (opts.help) {
    console.error(HELP);
    return;
  }
  try {
    const adapters = makeFsAdapters(opts.root);
    const inventoryRaw = await readFile(join(opts.root, INVENTORY_FILENAME), 'utf8');
    const inventory = JSON.parse(inventoryRaw);
    let baseline = null;
    try {
      baseline = JSON.parse(await readFile(join(opts.root, BASELINE_FILENAME), 'utf8'));
    } catch {
      baseline = null; // first run: anchored below
    }

    if (opts.initBaseline) {
      // This offline marker contains no content hashes. The normal run fetches
      // the actual reviewed upstream bytes before it can authorize writes.
      const invSources = inventory?.sources && typeof inventory.sources === 'object' ? inventory.sources : null;
      if (!invSources) throw new Error('inventory has no `sources` object');
      const reviews = inventory?.upstreamReviews && typeof inventory.upstreamReviews === 'object' ? inventory.upstreamReviews : {};
      const marker = { version: 1, updatedAt: null, sources: {} };
      for (const src of Object.keys(invSources).sort()) {
        marker.sources[src] = { pinnedRevision: joinRevision(reviews[src]), upstreamRevision: null, files: {} };
      }
      await writeFile(join(opts.root, BASELINE_FILENAME), stableStringify(marker));
      console.error(`baseline marker written to ${BASELINE_FILENAME}; normal run fetches reviewed upstream bytes`);
      return;
    }

    const { report, baseline: next, baselineTouched } = await runUpdate({ inventory, baseline, adapters, check: opts.check });
    if (!opts.check && baselineTouched) {
      await writeFile(join(opts.root, BASELINE_FILENAME), stableStringify(next));
    }
    const out = stableStringify(report);
    await writeFile(join(opts.root, 'third-party-updates.report.json'), out);
    if (opts.report) await writeFile(resolve(opts.root, opts.report), out);
    process.stdout.write(out);

  } catch (err) {
    if (err instanceof FetchError) {
      // Defensive: runUpdate converts fetch failures to report entries, so a
      // FetchError here is a bug, not a blip. Fail loudly.
      console.error(`unexpected fetch error: ${err.message}`);
    } else {
      console.error(`error: ${err?.message ?? err}`);
    }
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
