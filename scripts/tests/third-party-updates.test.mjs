// Offline tests for scripts/third-party-updates.mjs. No network, no real fs:
// an in-memory adapter stands in for both. Uses node:test + node:assert only
// (no new dev dependencies in a repo with no package.json).
// Run: node --test scripts/tests/third-party-updates.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  runUpdate,
  candidateLocalPaths,
  matchUpstreamEntry,
  joinRevision,
  stableStringify,
  LICENSE_BLOCKED_SOURCES,
  FetchError,
} from '../third-party-updates.mjs';

const sha = (s) => createHash('sha256').update(s).digest('hex');
const enc = (s) => new TextEncoder().encode(s);
const dec = (b) => new TextDecoder().decode(b);

// Minimal inventory builder: one source, controlled skills.
function inventoryFor(src, skills, pin) {
  const sources = { [src]: Object.fromEntries(skills.map((s) => [s.name, { paths: [s.invPath] }])) };
  return { sources, upstreamReviews: { reviewedAt: '2026-11-15', [src]: { revision: pin } } };
}

// In-memory adapters. `files`: rel -> string. `upstream`: { head, tree, blobs }.
function memAdapters({ files = {}, head, tree = null, blobs = {}, failHead = null, failTree = false, failFiles = new Set() }) {
  const store = new Map(Object.entries(files));
  const upstreamTree = tree ?? [...new Set([...store.keys(), ...Object.keys(blobs)])].filter((p) => !p.endsWith('/.disabled'));
  const written = [];
  return {
    written,
    adapters: {
      exists: async (rel) => store.has(rel),
      listFiles: async (rel) => [...store.keys()].filter((p) => p.startsWith(`${rel}/`)).sort(),
      read: async (rel) => {
        if (!store.has(rel)) throw new Error(`ENOENT ${rel}`);
        return enc(store.get(rel));
      },
      write: async (rel, bytes) => {
        written.push(rel);
        store.set(rel, dec(bytes));
      },
      getHead: async (src) => {
        if (failHead) throw new FetchError(failHead);
        return head;
      },
      getTree: async () => {
        if (failTree) throw new FetchError('tree boom');
        return upstreamTree;
      },
      getFile: async (src, rev, path) => {
        if (failFiles.has(path)) throw new FetchError(`fetch boom ${path}`);
        if (!(path in blobs)) throw new FetchError(`missing blob ${path}`);
        return enc(blobs[path]);
      },
    },
  };
}

const FIX = 'a'.repeat(40);
const MOVED = 'b'.repeat(40);

test('stableStringify is deterministic regardless of key order', () => {
  const a = stableStringify({ z: 1, a: { d: 4, c: 3 } });
  const b = stableStringify({ a: { c: 3, d: 4 }, z: 1 });
  assert.equal(a, b);
});

test('joinRevision handles revision and revisionParts', () => {
  assert.equal(joinRevision({ revision: FIX }), FIX);
  assert.equal(joinRevision({ revisionParts: ['ab', 'cd'] }), 'abcd');
  assert.equal(joinRevision({}), null);
  assert.equal(joinRevision(null), null);
});

test('report bytes are deterministic across run timestamps', async () => {
  const inventory = { sources: { 'org/new': { beta: { paths: ['beta/SKILL.md'] } } }, upstreamReviews: {} };
  const { adapters } = memAdapters({ files: {}, head: FIX });
  const a = await runUpdate({ inventory, baseline: null, adapters, now: () => 'first' });
  const b = await runUpdate({ inventory, baseline: null, adapters, now: () => 'later' });
  assert.equal(stableStringify(a.report), stableStringify(b.report));
});

test('candidateLocalPaths strips one historical skills/ prefix', () => {
  assert.deepEqual(candidateLocalPaths('skills/ponytail/SKILL.md'), ['skills/ponytail/SKILL.md', 'ponytail/SKILL.md']);
  assert.deepEqual(candidateLocalPaths('ponytail/SKILL.md'), ['ponytail/SKILL.md']);
  assert.deepEqual(candidateLocalPaths('skills/engineering/ask-matt/SKILL.md'), [
    'skills/engineering/ask-matt/SKILL.md',
    'engineering/ask-matt/SKILL.md',
    'ask-matt/SKILL.md',
  ]);
});

test('matchUpstreamEntry: none / single / exact-beats-suffix / ambiguous', () => {
  assert.equal(matchUpstreamEntry([], 'a/SKILL.md', 'skills/a/SKILL.md').kind, 'none');
  const single = matchUpstreamEntry(['x/a/SKILL.md'], 'a/SKILL.md', 'skills/a/SKILL.md');
  assert.equal(single.kind, 'single');
  const exact = matchUpstreamEntry(['skills/a/SKILL.md', 'other/skills/a/SKILL.md'], 'a/SKILL.md', 'skills/a/SKILL.md');
  assert.deepEqual(exact, { kind: 'single', path: 'skills/a/SKILL.md' });
  const amb = matchUpstreamEntry(['x/a/SKILL.md', 'y/a/SKILL.md'], 'a/SKILL.md', 'nope.md');
  assert.equal(amb.kind, 'ambiguous');
  assert.deepEqual(amb.paths, ['x/a/SKILL.md', 'y/a/SKILL.md']);
});

test('clean merge updates bytes, baseline, and report SHA (retry-safe)', async () => {
  const inv = inventoryFor('org/repo', [{ name: 'alpha', invPath: 'skills/alpha/SKILL.md' }], FIX);
  const base = { version: 2, updatedAt: 't', sources: { 'org/repo': { pinnedRevision: FIX, upstreamRevision: null, files: { 'alpha/SKILL.md': sha('old') } } } };
  const { written, adapters } = memAdapters({
    files: { 'alpha/SKILL.md': 'old' },
    head: MOVED,
    tree: ['alpha/SKILL.md'],
    blobs: { 'alpha/SKILL.md': 'new' },
  });
  const { report, baseline } = await runUpdate({ inventory: inv, baseline: base, adapters, now: () => '2026-11-15T00:00:00.000Z' });
  assert.equal(report.sources['org/repo'].skills.alpha.status, 'updated');
  assert.equal(report.sources['org/repo'].skills.alpha.sha, sha('new'));
  assert.equal(report.sources['org/repo'].skills.alpha.upstreamRevision, MOVED);
  assert.deepEqual(written, ['alpha/SKILL.md']);
  assert.equal(baseline.sources['org/repo'].files['alpha/SKILL.md'], sha('new'));

  // Rerun against new baseline: idempotent, byte-identical upstream is clean.
  const again = memAdapters({
    files: { 'alpha/SKILL.md': 'new' },
    head: MOVED,
    tree: ['alpha/SKILL.md'],
    blobs: { 'alpha/SKILL.md': 'new' },
  });
  // Simulate the caller persisting the returned baseline (baseline stays pinned
  // at the reviewed revision until a human reviews the new upstream HEAD).
  const { report: r2 } = await runUpdate({ inventory: inv, baseline, adapters: again.adapters, now: () => '2026-11-15T00:01:00.000Z' });
  assert.equal(r2.sources['org/repo'].skills.alpha.status, 'up-to-date');
  assert.equal(r2.writes.length, 0);
});

test('upstream moved but content identical: baseline advances, no write', async () => {
  const inv = inventoryFor('org/repo', [{ name: 'alpha', invPath: 'skills/alpha/SKILL.md' }], FIX);
  const base = { version: 2, updatedAt: 't', sources: { 'org/repo': { pinnedRevision: FIX, upstreamRevision: null, files: { 'alpha/SKILL.md': sha('same') } } } };
  const { written, adapters } = memAdapters({
    files: { 'alpha/SKILL.md': 'same' },
    head: MOVED,
    tree: ['alpha/SKILL.md'],
    blobs: { 'alpha/SKILL.md': 'same' },
  });
  const { report } = await runUpdate({ inventory: inv, baseline: base, adapters });
  assert.equal(report.sources['org/repo'].skills.alpha.status, 'up-to-date');
  assert.deepEqual(written, []);
});

test('locally modified + upstream moved => conflict, bytes preserved', async () => {
  const inv = inventoryFor('org/repo', [{ name: 'alpha', invPath: 'skills/alpha/SKILL.md' }], FIX);
  const base = { version: 2, updatedAt: 't', sources: { 'org/repo': { pinnedRevision: FIX, upstreamRevision: null, files: { 'alpha/SKILL.md': sha('old') } } } };
  const { written, adapters } = memAdapters({
    files: { 'alpha/SKILL.md': 'customized' },
    head: MOVED,
    tree: ['alpha/SKILL.md'],
    blobs: { 'alpha/SKILL.md': 'new' },
  });
  const { report } = await runUpdate({ inventory: inv, baseline: base, adapters });
  assert.equal(report.sources['org/repo'].status, 'needs-review');
  assert.equal(report.sources['org/repo'].skills.alpha.status, 'conflict');
  assert.deepEqual(written, []);
});

test('v1 local snapshot is discarded; reviewed upstream bytes define the base', async () => {
  const inv = inventoryFor('org/repo', [{ name: 'alpha', invPath: 'skills/alpha/SKILL.md' }], FIX);
  const legacy = { version: 1, sources: { 'org/repo': { pinnedRevision: FIX, files: { 'alpha/SKILL.md': sha('custom') } } } };
  const { written, adapters } = memAdapters({
    files: { 'alpha/SKILL.md': 'custom' },
    head: MOVED,
    tree: ['alpha/SKILL.md'],
    blobs: { 'alpha/SKILL.md': 'upstream-new' },
  });
  const getFile = adapters.getFile;
  const pinnedCalls = [];
  const safeAdapters = {
    ...adapters,
    getFile: async (src, rev, path) => {
      if (rev === FIX) {
        pinnedCalls.push(path);
        return enc('upstream-base');
      }
      return getFile(src, rev, path);
    },
  };
  const { report } = await runUpdate({ inventory: inv, baseline: legacy, adapters: safeAdapters });
  assert.deepEqual(pinnedCalls, ['alpha/SKILL.md']);
  assert.equal(report.sources['org/repo'].skills.alpha.status, 'conflict');
  assert.deepEqual(written, []);
});

test('locally modified + upstream unmoved => locally-modified, kept', async () => {
  const inv = inventoryFor('org/repo', [{ name: 'alpha', invPath: 'skills/alpha/SKILL.md' }], FIX);
  const base = { version: 2, updatedAt: 't', sources: { 'org/repo': { pinnedRevision: FIX, upstreamRevision: null, files: { 'alpha/SKILL.md': sha('old') } } } };
  const { adapters } = memAdapters({ files: { 'alpha/SKILL.md': 'customized' }, head: FIX });
  const { report } = await runUpdate({ inventory: inv, baseline: base, adapters });
  assert.equal(report.sources['org/repo'].skills.alpha.status, 'locally-modified');
});

test('missing skill is reported, never recreated', async () => {
  const inv = inventoryFor('org/repo', [{ name: 'ghost', invPath: 'skills/ghost/SKILL.md' }], FIX);
  const base = { version: 2, updatedAt: 't', sources: { 'org/repo': { pinnedRevision: FIX, upstreamRevision: null, files: {} } } };
  const { written, adapters } = memAdapters({ files: {}, head: FIX });
  const { report } = await runUpdate({ inventory: inv, baseline: base, adapters });
  assert.equal(report.sources['org/repo'].skills.ghost.status, 'missing-locally');
  assert.deepEqual(written, []);
});

test('disabled skill is skipped even on a clean merge', async () => {
  const inv = inventoryFor('org/repo', [{ name: 'alpha', invPath: 'skills/alpha/SKILL.md' }], FIX);
  const base = { version: 2, updatedAt: 't', sources: { 'org/repo': { pinnedRevision: FIX, upstreamRevision: null, files: { 'alpha/SKILL.md': sha('old') } } } };
  const { written, adapters } = memAdapters({
    files: { 'alpha/SKILL.md': 'old', 'alpha/.disabled': '' },
    head: MOVED,
    tree: ['alpha/SKILL.md'],
    blobs: { 'alpha/SKILL.md': 'new' },
  });
  const { report } = await runUpdate({ inventory: inv, baseline: base, adapters });
  assert.equal(report.sources['org/repo'].skills.alpha.status, 'disabled-skipped');
  assert.deepEqual(written, []);
});

test('remotion source is license-blocked, bytes never copied', async () => {
  assert.ok(LICENSE_BLOCKED_SOURCES.has('remotion-dev/skills'));
  const src = 'remotion-dev/skills';
  const inv = inventoryFor(src, [{ name: 'remotion-best-practices', invPath: 'skills/remotion-best-practices/SKILL.md' }], FIX);
  const base = { version: 2, updatedAt: 't', sources: { [src]: { pinnedRevision: FIX, upstreamRevision: null, files: { 'remotion-best-practices/SKILL.md': sha('old') } } } };
  const { written, adapters } = memAdapters({
    files: { 'remotion-best-practices/SKILL.md': 'old' },
    head: MOVED,
    tree: ['remotion-best-practices/SKILL.md'],
    blobs: { 'remotion-best-practices/SKILL.md': 'new' },
  });
  const { report } = await runUpdate({ inventory: inv, baseline: base, adapters });
  assert.equal(report.sources[src].skills['remotion-best-practices'].status, 'license-blocked');
  assert.deepEqual(written, []);
});

test('unpinned source checks upstream and reports movement without writes', async () => {
  const inv = { sources: { 'org/new': { beta: { paths: ['beta/SKILL.md'] } } }, upstreamReviews: {} };
  let headCalls = 0;
  const { written, adapters } = memAdapters({
    files: { 'beta/SKILL.md': 'x' }, head: MOVED, tree: ['beta/SKILL.md'], blobs: { 'beta/SKILL.md': 'upstream' },
  });
  const guarded = { ...adapters, getHead: async () => { headCalls += 1; return MOVED; } };
  const { report } = await runUpdate({ inventory: inv, baseline: { version: 2, sources: { 'org/new': { upstreamRevision: FIX } } }, adapters: guarded });
  assert.equal(report.sources['org/new'].skills.beta.status, 'unpinned');
  assert.equal(report.sources['org/new'].skills.beta.movedFrom, FIX);
  assert.equal(headCalls, 1);
  assert.deepEqual(written, []);
});

test('fetch failures surface as fetch-failed with retry, exit stays 0', async () => {
  const inv = inventoryFor('org/flaky', [{ name: 'alpha', invPath: 'skills/alpha/SKILL.md' }], FIX);
  const base = { version: 2, updatedAt: 't', sources: { 'org/flaky': { pinnedRevision: FIX, upstreamRevision: null, files: { 'alpha/SKILL.md': sha('old') } } } };
  const { adapters } = memAdapters({ files: { 'alpha/SKILL.md': 'old' }, head: FIX, failHead: 'DNS boom' });
  const { report } = await runUpdate({ inventory: inv, baseline: base, adapters });
  assert.equal(report.sources['org/flaky'].status, 'fetch-failed');
  assert.equal(report.sources['org/flaky'].retry, true);
  assert.equal(report.sources['org/flaky'].skills.alpha.status, 'fetch-failed');
});

test('per-file fetch failure marks skill retryable and leaves other skills intact', async () => {
  const inv = inventoryFor('org/repo', [
    { name: 'alpha', invPath: 'skills/alpha/SKILL.md' },
    { name: 'beta', invPath: 'skills/beta/SKILL.md' },
  ], FIX);
  const base = { version: 2, updatedAt: 't', sources: { 'org/repo': { pinnedRevision: FIX, upstreamRevision: null, files: { 'alpha/SKILL.md': sha('a'), 'beta/SKILL.md': sha('b') } } } };
  const { written, adapters } = memAdapters({
    files: { 'alpha/SKILL.md': 'a', 'beta/SKILL.md': 'b' },
    head: MOVED,
    tree: ['alpha/SKILL.md', 'beta/SKILL.md'],
    blobs: { 'beta/SKILL.md': 'b2' },
    failFiles: new Set(['alpha/SKILL.md']),
  });
  const { report } = await runUpdate({ inventory: inv, baseline: base, adapters });
  assert.equal(report.sources['org/repo'].skills.alpha.status, 'fetch-failed');
  assert.equal(report.sources['org/repo'].skills.beta.status, 'updated');
  assert.deepEqual(written, ['beta/SKILL.md']);
});

test('ambiguous and missing upstream paths are surfaced, not written', async () => {
  const inv = inventoryFor('org/repo', [
    { name: 'alpha', invPath: 'skills/alpha/SKILL.md' },
    { name: 'beta', invPath: 'skills/beta/SKILL.md' },
  ], FIX);
  const base = { version: 2, updatedAt: 't', sources: { 'org/repo': { pinnedRevision: FIX, upstreamRevision: null, files: { 'alpha/SKILL.md': sha('a'), 'beta/SKILL.md': sha('b') } } } };
  const { written, adapters } = memAdapters({
    files: { 'alpha/SKILL.md': 'a', 'beta/SKILL.md': 'b' },
    head: MOVED,
    tree: ['x/alpha/SKILL.md', 'y/alpha/SKILL.md'],
    blobs: {},
  });
  const { report } = await runUpdate({ inventory: inv, baseline: base, adapters });
  assert.equal(report.sources['org/repo'].skills.alpha.status, 'upstream-ambiguous');
  assert.equal(report.sources['org/repo'].skills.beta.status, 'upstream-path-not-found');
  assert.deepEqual(written, []);
});

test('--check mode reports would-update and performs no writes', async () => {
  const inv = inventoryFor('org/repo', [{ name: 'alpha', invPath: 'skills/alpha/SKILL.md' }], FIX);
  const base = { version: 2, updatedAt: 't', sources: { 'org/repo': { pinnedRevision: FIX, upstreamRevision: null, files: { 'alpha/SKILL.md': sha('old') } } } };
  const { written, adapters } = memAdapters({
    files: { 'alpha/SKILL.md': 'old' },
    head: MOVED,
    tree: ['alpha/SKILL.md'],
    blobs: { 'alpha/SKILL.md': 'new' },
  });
  const { report } = await runUpdate({ inventory: inv, baseline: base, adapters, check: true });
  assert.equal(report.check, true);
  assert.equal(report.sources['org/repo'].skills.alpha.status, 'would-update');
  assert.deepEqual(written, []);
  assert.equal(report.baselineUpdated, false);
});

test('report carries updated SHA per change for PR review', async () => {
  const inv = inventoryFor('org/repo', [{ name: 'alpha', invPath: 'skills/alpha/SKILL.md' }], FIX);
  const base = { version: 2, updatedAt: 't', sources: { 'org/repo': { pinnedRevision: FIX, upstreamRevision: null, files: { 'alpha/SKILL.md': sha('old') } } } };
  const { adapters } = memAdapters({
    files: { 'alpha/SKILL.md': 'old' },
    head: MOVED,
    tree: ['alpha/SKILL.md'],
    blobs: { 'alpha/SKILL.md': 'new-content' },
  });
  const { report } = await runUpdate({ inventory: inv, baseline: base, adapters });
  assert.equal(report.writes.length, 1);
  assert.equal(report.writes[0].sha, sha('new-content'));
  assert.equal(report.writes[0].path, 'alpha/SKILL.md');
  assert.equal(report.sources['org/repo'].upstreamRevision, MOVED);
});
test('updates bundled files while preserving custom files and reporting upstream additions', async () => {
  const inv = inventoryFor('org/repo', [{ name: 'alpha', invPath: 'skills/alpha/SKILL.md' }], FIX);
  const base = {
    version: 2, updatedAt: 't',
    sources: { 'org/repo': { pinnedRevision: FIX, upstreamRevision: null, files: {
      'alpha/SKILL.md': sha('old skill'),
      'alpha/references/guide.md': sha('old guide'),
    } } },
  };
  const { written, adapters } = memAdapters({
    files: {
      'alpha/SKILL.md': 'old skill',
      'alpha/references/guide.md': 'old guide',
      'alpha/custom.md': 'custom',
    },
    head: MOVED,
    tree: ['alpha/SKILL.md', 'alpha/references/guide.md', 'alpha/references/new.md'],
    blobs: {
      'alpha/SKILL.md': 'new skill',
      'alpha/references/guide.md': 'new guide',
      'alpha/references/new.md': 'new upstream file',
    },
  });
  const { report } = await runUpdate({ inventory: inv, baseline: base, adapters });
  const result = report.sources['org/repo'].skills.alpha;
  assert.equal(result.files['alpha/SKILL.md'].status, 'updated');
  assert.equal(result.files['alpha/references/guide.md'].status, 'updated');
  assert.equal(result.files['alpha/references/new.md'].status, 'upstream-added');
  assert.equal(result.files['alpha/custom.md'].status, 'local-only');
  assert.deepEqual(written, ['alpha/SKILL.md', 'alpha/references/guide.md']);
});

test('reports missing bundled files even when upstream has not moved', async () => {
  const inventory = inventoryFor('org/repo', [{ name: 'alpha', invPath: 'skills/alpha/SKILL.md' }], FIX);
  const baseline = { version: 2, sources: { 'org/repo': { pinnedRevision: FIX, upstreamRevision: FIX, files: {
    'alpha/SKILL.md': sha('skill'),
    'alpha/references/guide.md': sha('guide'),
  } } } };
  const { adapters, written } = memAdapters({
    files: { 'alpha/SKILL.md': 'skill' },
    head: FIX,
    tree: ['alpha/SKILL.md', 'alpha/references/guide.md'],
  });
  const { report } = await runUpdate({ inventory, baseline, adapters });
  assert.equal(report.sources['org/repo'].skills.alpha.files['alpha/references/guide.md'].status, 'local-deleted');
  assert.notEqual(report.sources['org/repo'].skills.alpha.status, 'up-to-date');
  assert.deepEqual(written, []);
});
