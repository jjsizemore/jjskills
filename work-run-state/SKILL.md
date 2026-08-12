---
name: work-run-state
description: >-
  Use when initializing, reading, updating, or canceling a durable multi-story
  work run under .agents/runs/ (ledger, progress, handoff, sealed iteration
  budget). Not for implementing code.
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable run-state leaf for execute/resume loops.
---

# Work Run State

## Role

Leaf skill for **disk truth** of a multi-story execution run. Controllers
(`executing-work`, `resuming-work`, `canceling-work-run`) own policy; this skill
owns paths, schema, and CLI mutations.

## Layout (shared authority)

```text
<git-common-dir>/agent-runs/ACTIVE
<git-common-dir>/agent-runs/<run-id>/
  ledger.json                       # stories + sealed maxIterations
  progress.md                       # append-only log + Codebase Patterns
  handoff.md                        # cold-start brief for next process
  evidence/                         # optional logs and closeout artifacts
```

Set `AGENT_RUNS_ROOT` to an absolute path only for an explicit isolated test or
validated adapter. Do not use `~/.agents/runs/` or `.agents/runs/` as primary
state. Do not use `.current-work` for story boards.

## Sealed budget

At init:

```text
maxIterations = min(30, max(10, storyCount * 2 + riskBonus))
```

`riskBonus` is 0–4 from story tags (`release`, `security`, …) and large boards.
Human may pass `--max-iterations=N` **only at init**. After `budgetSealedAt` is
set, **raising max is forbidden** (CLI rejects `set-max`). Outer `work-run-loop.sh`
must snapshot max into a shell variable and not re-trust agent-edited JSON for
the loop bound.

## CLI

```bash
node ~/.agents/skills/work-run-state/scripts/work-run.mjs <command> ...
```

| Command | Purpose |
| --- | --- |
| `init` | Create run, seal budget, set ACTIVE |
| `pick` | Highest-priority incomplete non-blocked story |
| `mark-pass` / `mark-blocked` | Update story |
| `bump-iteration` | Increment counter; fail if at sealed max |
| `status` | Counts + completion only after verified closeout |
| `append` | Append to progress.md |
| `cancel` | Clear ACTIVE; keep history |
| `complete` | All pass + bound evidence + controller verifier → clear ACTIVE |
| `set-max` | Always rejected after seal |

`complete --closeout-evidence PATH` never trusts a caller-supplied oracle. The
CLI invokes the fixed `closeout-verify.mjs` controller, which rechecks ledger,
base/head/diff bindings and runs the checked-in contract suite. A matching JSON
artifact alone cannot complete a run.

## Model tier

Status/pick/ledger I/O: **low** tier when delegating. Never use **high** for pure status.

## Tests

```bash
node --test ~/.agents/skills/work-run-state/tests/work-run.test.mjs
```

## Handoffs

- Controllers: `executing-work`, `resuming-work`
- Single story body: `implementing-story`
- Clear pointer: `canceling-work-run`

## Stop

Stop and report if ACTIVE missing, ledger corrupt, or budget exhausted.
