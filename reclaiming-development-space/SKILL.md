---
name: reclaiming-development-space
description: 'Use when reclaiming local disk space from development worktrees, dependencies, build artifacts, installers, or coding-agent caches, especially when the user requires a verified amount of available space.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable development storage cleanup with host-specific inspection and removal tools.
---

# Reclaiming Development Space

Carry cleanup through the user's available-space goal. The
[portable completion contract](../references/autonomous-completion-contract.md)
owns authority, recovery, human gates and completion.

## Bind the request and measure

1. Recover the current goal, existing approvals, exact exclusions, ownership
   constraints and any worktree interaction cutoff from the conversation and
   existing cleanup receipts. Reuse approvals that cover the proposed effect.
   Resolve only missing, outcome-changing scope or consent.
2. Verify the current directory, resolved write roots, host and target volume.
   Measure actual space available to the user with a native OS tool. On POSIX,
   a native interpreter can use `s = os.statvfs(path)` followed by
   `s.f_bavail * s.f_frsize`.
   Record the interpreter or command and byte value. Resolve disagreements
   between sandbox, guest and host readings before relying on them.
3. Use the user's units and threshold. A 50 GB goal means 50,000,000,000 bytes
   when decimal GB was requested. Retain before/after readings from the same
   volume and counter. Allocated sizes, logical sizes, APFS clone sharing,
   sparse files and purgeable estimates can differ from physical recovery.

## Discover candidates

Start with existing inventories and the largest likely disposable cohorts.
Refresh evidence invalidated by new development. Prefer bounded scans and
small summaries over recursive dumps of the entire home directory.

- Enumerate registered worktrees from each repository with
  `git worktree list --porcelain`. Also inspect agent/tool configuration and
  historical roots for unregistered or nested trees. Common discovery hints
  include `~/repos/worktrees`, `.claude`, `.codex`, `.omx`, `.omo`, `.omc`,
  `.grok`, `.omp` and `.herdr`. Resolve symlinks and deduplicate identities.
- Inspect dependency directories and package stores, compiler/build caches,
  generated artifacts, installers, disk images and tool-managed downloads.
  Include relevant platform SDK, simulator and container inventories.
- Measure candidate logical and allocated bytes separately. Account for
  hardlinks where practical and qualify estimates affected by shared blocks.
  Record permission failures and incomplete coverage.
- Treat source, configuration, credentials, databases, AI conversations,
  TokenSave counters/history, models, native leases, deployed products and
  rollback artifacts according to their actual contents and use.

Independent audit lanes may inspect disjoint roots. Keep one deletion owner.
Respect OS access controls and existing network/privacy boundaries during
provenance checks. Inspect local package metadata before considering lookups
that would transmit private package names or local contents.

## Select exact authorized targets

For each candidate, record its absolute path, resolved identity, type,
allocated estimate, provenance, usage evidence, applicable approval and
restoration cost in the existing cleanup record. A category approval can cover
many targets. Materialize the exact list before removal and reuse that consent.
Choose identity and preservation checks proportional to the effect.

- **Dependencies and caches** — establish generated/downloaded provenance and
  check actual processes, mapped/open files, package writers and tool references.
  A live TypeScript server can hold a dependency tree. A separately qualified
  unused binary subtree may be removable within the same approval when its
  scripts, plugins, declarations and other users stay outside that target.
  Investigate task labels and idle shells using actual usage/custody evidence.
- **Build products and installers** — check process, mount, updater, deployment
  and rollback use. A hidden `*_updated.app` can be the only installed app.
  Establish what it is and reuse any approval covering whole-app removal and
  private/manual contents. Ask for that exact effect if consent is missing.
- **Worktrees** — preserve main/canonical checkouts. For an approved interaction
  cutoff, establish the latest credible Git, content and agent/owner activity
  against that cutoff. Git status and age alone leave ignored, private,
  unpublished, nested and recovery state unaccounted for. Preserve that work
  and required Git/admin custody. Check current processes, open files and native
  leases before selecting a secondary tree for native Git removal.
- **Opaque state** — preserve AI history, counters and databases unless their
  deletion is explicitly covered. Large or regenerable-looking filenames do
  not establish disposable contents. Whole-directory consent may cover manual
  contents when the user explicitly accepted that effect. Retain other holds.

Hold only affected targets when activity, custody, provenance, identity or
authority remains unresolved. Continue independent authorized candidates.
Before requesting new consent, finish the work already covered and present
the exact additional target, loss, recovery cost and remaining capacity gap.

## Remove and reconcile

1. Freeze the selected target list and sufficient identity evidence before
   mutation. Immediately recheck resolved paths, usage, owners/leases and the
   operation's required preservation facts. Use native package/component or Git
   removal tools where applicable. Scope filesystem deletion to exact roots
   with symlink-safe handling. Keep sources, unrelated Git state and other
   paths outside the authorized effect.
2. Apply bounded batches and write results after each one. If a helper performs
   destructive operations, bind its inputs and prevent accidental replay.
   Avoid broad prune/cleanup commands whose effects exceed the selected list.
3. Check target absence or native uninstall state and the specific preservation
   facts the operation could affect. Measure native available bytes again.
   Concurrent development and swap can consume recovered space during the pass.
4. Reconcile partial or uncertain outcomes from actual state and receipts before
   another mutation. An applied manifest is a receipt. Regenerated directories,
   changed inodes, and hardlink/ctime changes after store removal require fresh
   evidence for the remaining current targets. Derive a new bounded manifest
   under existing consent when its scope still applies.

Optional lossless native compression can help when a validated local tool
already exists. Require its demonstrated preservation of logical bytes,
required metadata/security and database companions, with concurrency checks
and recoverable failure handling. Preserve database values and counters.
Measure a small physical result first, since clone sharing can reverse savings.
Validate any necessary new compression tooling against these invariants before
applying it to real targets.

## Reach the capacity goal

After each useful batch, compare current native available bytes with the goal.
Continue qualified work while a shortfall remains. Finish cleanup when the
measured target is reached.

When swap accounts for a material remaining gap, complete authorized file
cleanup and establish whether the user can save work and restart. Preserve
swap files and active processes. Restart availability expresses readiness for
a user action. An automatic reboot or process termination requires authority
covering that effect. After the user reports a restart, measure native capacity
and swap again before marking the goal achieved.

If remaining candidates require missing consent/access or a human action,
report the exact measured shortfall and one concrete next action. Keep the
capacity goal pending until the required measurement passes.

Finish with available bytes/GB, measured net change, exact removal receipts,
material holds/coverage gaps, restoration costs and any remaining action.
Distinguish completed removal from physical recovery and observed unmet
capacity from model-behavior test evidence.

For regressions, use the [pressure scenarios](references/pressure-scenarios.md).
