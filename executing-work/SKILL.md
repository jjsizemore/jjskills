---
name: executing-work
description: >-
  Use when taking repository work from a prompt, issue, plan, or spec through
  multi-story implementation and closeout using a durable shared run ledger.
  Prefer resuming-work for interrupted runs; remediating-root-causes handles a
  single diagnosed defect without a story board.
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable execute controller; repos may thin-override gates.
---

# Executing Work

Apply the shared [portable autonomous completion contract](../references/autonomous-completion-contract.md).
The controller owns identity, story order, evidence composition, stop
decisions, and the terminal report; leaves return proof or blockers.

## Role

**Controller** for green-path delivery. Composes leaves; does not restate TDD,
commit, or PR procedures.

## When to use

- User wants end-to-end execution from a plan/spec/issue
- Multi-story work that must survive interrupt/resume

## When not to use

| Situation | Use instead |
| --- | --- |
| Interrupted active run | `resuming-work` |
| Single diagnosed bug fix | `remediating-root-causes` |
| Planning only | `writing-plans` / `creating-implementation-specs` / `grill-me` |
| Stop active run | `canceling-work-run` |

## Required sub-skills

- `work-run-state` — ledger I/O
- `implementing-story` — one story body
- `verifying-before-completion` — evidence before claims
- `closing-repo-work` — commit/push/PR when board green
- `remediating-root-causes` — only on story failure path
- `grill-me` — **only if** plan/spec missing decisions after explore
- `writing-plans` or `creating-implementation-specs` — only when consolidated preflight/current plan is insufficient to resolve material decisions or scope

## Modes

| Mode | When | Behavior |
| --- | --- | --- |
| **In-session** | Interactive, small boards | Loop stories in this chat until done or blocked |
| **Outer-loop body** | Spawned by `work-run-loop.sh` | Exactly **one** story then exit |
| **Unattended multi-story** | Overnight / large | Controller runs the existing loop within current authority, ownership/resource limits, and sealed budgets; park only genuinely gated work. |

Detect outer-loop via env `WORK_RUN_OUTER_LOOP=1` or user saying “one story only”.

## Workflow

### 1. Intake

1. Explore codebase for facts before asking.
2. If no current plan/spec and ambiguity remains → `grill-me` then plan/spec skill.
3. If plan/spec exists and is sufficient → **do not** re-grill.

### 2. Init run (`<git-common-dir>/agent-runs`)

1. Initialize only from a sufficient authorized request, consolidated preflight,
   or current plan/spec and durable bindings: real `runId`, tracking identity
   (or explicit `not_applicable` reason), source basis, branch/worktree identity,
   and exact ordered story IDs. Recover metadata from actual native/durable state;
   never invent an ID. Hold only for genuinely missing material scope or authority.
2. Form stories from an existing plan appendix or sufficient preflight scope;
   use one story when sufficient. A whole-plan artifact is not required.
3. `work-run-state` init seals the budget. Do not raise the maximum later.

### 3. Loop

While incomplete stories and iteration &lt; sealed max:

1. `pick` next story.
2. `implementing-story` (mid tier implement; low tier explore).
3. On failure → apply the canonical recovery rules within remaining sealed attempts;
   park only genuinely gated/dependent stories and continue independent authorized stories.
4. Append patterns to progress.md.
5. If outer-loop mode → exit after one story.

### 4. Closeout (board green only)

1. `verifying-before-completion` for final role-based gates.
2. Behavior/high-impact changes receive one fresh capable independent review
   bound to the current delta/proof; equivalent providers may substitute.
   Mechanical changes use deterministic checks without mandatory review.
3. `closing-repo-work` composes local, hosted, runtime, and UAT proof where
   applicable.
4. Complete the ledger only after the closeout controller returns `VERIFIED`;
   `WORK_RUN_COMPLETE` is evidence text, not a terminal claim.

## Model tiers (D5)

| Work | Tier |
| --- | --- |
| Status, pick, locate | low |
| Implement story | mid |
| Final / architecture / security review | high |

## Repo overrides

If a repo-local `executing-work` exists, prefer it for gates (Linear, worktrees,
pnpm). Overrides must **not** reintroduce `.current-work` as a story ledger.

## Stop conditions

- All stories pass and closeout returns `VERIFIED`
- Every remaining story genuinely depends on an exact external-human gate after permitted recovery
- Recorded global budget/suspension requires `PAUSED`, or immutable limits leave no reachable authorized work
- Per-story/boundary exhaustion parks that lane only; continue independent stories with their own remaining sealed budgets

## Pressure scenarios

See `references/pressure-scenarios.md`.
