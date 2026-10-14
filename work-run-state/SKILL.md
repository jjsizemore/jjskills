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

Record the actual resource allowance at intake and seal `maxIterations`.
Preserve active runs' existing caps; never raise/reset their budget or start a
replacement run to evade exhaustion. Existing allocator defaults may supply an
initial recorded cap when appropriate; they are not a new universal retry stop.
Use canonical causal-progress recovery with an internal 30-minute checkpoint.
While the child runs, the loop appends a durable `progress.md` checkpoint with
run/story identity, timestamp/elapsed time, the latest structured causal receipt
or explicit unknown, resource usage or unknown, and remaining sealed allowance.
The checkpoint continues the child; it never pauses work or changes the budget.

Record the canonical delivery target: future B is reviewed green merge plus
applicable staging, explicit C is production, and explicit PR/merge/local-only
targets and existing sealed targets remain unchanged.

## CLI

```bash
node ~/.agents/skills/work-run-state/scripts/work-run.mjs <command> ...
```

| Command | Purpose |
| --- | --- |
| `init` | Create run, seal budget, set ACTIVE |
| `pick` | Highest-priority eligible story; blocked stories and unmet `serial-after:<id>` dependencies are excluded |
| `mark-pass` / `mark-blocked` | Update story |
| `bump-iteration` | Increment counter; fail if at sealed max |
| `status` | Counts + completion only after verified closeout |
| `append` | Append to progress.md |
| `cancel` | Clear ACTIVE; keep history |
| `complete` | All pass + bound evidence + controller verifier → clear ACTIVE |
| `set-max` | Always rejected after seal |

New `init` calls require `--endpoint pr|merge|staging|deploy|local-only`. The
endpoint is immutable for that run. The ledger schema keeps it optional so
historical ledgers without an endpoint remain readable and follow their
existing verifier path without migration or a default.

`complete --closeout-evidence PATH` never trusts a caller-supplied oracle. The
CLI invokes the fixed `closeout-verify.mjs` controller, which rechecks ledger,
base/head/diff bindings and runs the checked-in project oracle. `WORK_RUN_COMPLETE`
is emitted only after that verifier passes.

The fixed verifier queries GitHub and requires the PR's current head to equal
the subject head for `pr`. `merge` also requires actual `mergedAt` and
`mergeCommit` metadata, but does not claim live deployment. `staging` and
`deploy` require that merge metadata plus the checked-in project oracle's fresh
JSON `deliveryProof`: endpoint, subjectHead, environment, runtimeSha,
checksPassed, expectedRuntimeVersion/runtimeVersion and
expectedArtifactSha/artifactSha. The oracle must obtain independent
runtime/artifact observations, not echo caller claims. `local-only` requires no
PR or deployment proof.

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

Recover missing ACTIVE/metadata from authoritative durable state before escalation.
Park only gated/exhausted dependencies; independent authorized work continues.
Only the controller applies canonical whole-run terminal conditions.

## Completion verifier

The terminal controller must not accept a caller-supplied `oracle` claim.
`complete` invokes a fixed controller-owned verifier that rechecks the ledger,
current subject head, immutable base-to-head diff digest, and a checked-in
validation command. A matching JSON artifact or claimed `result: pass` is not
an independent oracle.
