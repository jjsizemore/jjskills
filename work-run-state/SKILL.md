---
name: work-run-state
description: >-
  Use when initializing, reading, updating, or canceling a durable multi-story
  work run under `<git-common-dir>/agent-runs` (ledger, progress, handoff,
  sealed iteration budget). Not for implementing code.
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

`AGENT_RUNS_ROOT` is permitted only as an explicit absolute isolated-test or
validated-adapter root. Controllers resolve `<git-common-dir>/agent-runs` and
must not accept a caller or worker ambient override.

## Sealed budget

Record the actual resource allowance at intake and seal `maxIterations`.
Preserve active runs' existing caps; never raise/reset their budget or start a
replacement run to evade exhaustion. Existing allocator defaults may supply an
initial recorded cap when appropriate; they are not a new universal retry stop.
Use canonical causal-progress recovery with an internal 30-minute liveness
checkpoint while the child runs. This is a durable run/story checkpoint, not
per-tool bookkeeping: append the latest structured causal receipt or explicit
unknown, resource usage or unknown, timestamp/elapsed time, and remaining sealed
allowance. It continues the child and never pauses work or changes the budget.
The separate bounded external-wait checkpoint in the portable contract applies
only when eligible work is exhausted; it does not replace or reset this liveness
interval. The loop snapshots the sealed maximum once and cannot unseal it.

Record the canonical delivery target: future B is reviewed green merge plus
applicable staging, explicit C is production, and explicit PR/merge/local-only
targets and existing sealed targets remain unchanged.

## CLI

```bash
node ~/.agents/skills/work-run-state/scripts/work-run.mjs <command> ...
```

The CLI resolves installed directory/file symlinks before its entrypoint check;
invoking through `~/.agents/skills` executes the same admission gates as the source path.

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
| `admission` | Evaluate baseline-bound project probe against release safeguards prerequisites |
| `set-max` | Always rejected after seal |

New `init` calls require `--endpoint pr|merge|staging|deploy|local-only`. The
endpoint is immutable for that run. The ledger schema keeps it optional so
historical ledgers without an endpoint remain readable and follow their
existing verifier path without migration or a default.

`complete --closeout-evidence PATH` never trusts a caller-supplied oracle. The
CLI invokes the fixed `closeout-verify.mjs` controller, which rechecks ledger,
base/head/diff bindings and runs the checked-in project oracle. `WORK_RUN_COMPLETE`
is emitted only after that verifier passes.

The project oracle has a 10-minute deadline; its controller has 11 minutes,
leaving one minute for evidence checks after a slow oracle.

The fixed verifier queries GitHub and requires the PR's current head to equal
the subject head for `pr`. `merge` also requires actual `mergedAt` and
`mergeCommit` metadata, but does not claim live deployment. `staging` and
`deploy` require that merge metadata plus the checked-in project oracle's fresh
JSON `deliveryProof`: endpoint, subjectHead, environment, runtimeSha,
checksPassed, expectedRuntimeVersion/runtimeVersion and
expectedArtifactSha/artifactSha. The oracle must obtain independent
runtime/artifact observations, not echo caller claims. `staging` and `deploy`
additionally require verified `releaseSafeguards` observations from the project
oracle (bounded staging with promotion criteria, actionable regression detection,
and exercised fast rollback to an immutable target). Dependent release stories
are gated at `pick` and `bump-iteration` before child launch until admission passes.
`local-only` requires no PR or deployment proof.

The trusted baseline `closeout-command.json` may declare a separate
`admissionCommand: ["node", "scripts/release-safeguards.mjs"]` (or a direct
Python script). Admission executes that project-owned script for fresh JSON
`releaseSafeguards` observations; ordinary closeout still executes
`closeoutCommand`. Existing configurations without `admissionCommand` retain
their closeout-command fallback. This separates a test suite from the bounded
safety probe; it does not supply or waive staging, detection, or exercised
rollback evidence, and caller command overrides remain rejected. The dedicated script
must be a regular, non-symlink repository file whose bytes match the sealed baseline.
Admission uses an implicit shared `ACTIVE` only in its recorded worktree (the recorded
branch for legacy runs); other work uses its own HEAD and leaves that run untouched.
Pass `--run-id` explicitly
to use a selected run's sealed baseline, including from a detached checkout.
Admission (including run initialization) supplies controller-owned
`WORK_RUN_EXPECTED_HEAD`, `WORK_RUN_EXPECTED_ENVIRONMENT`, and
`WORK_RUN_EXPECTED_SURFACE`, replacing ambient values; observed evidence must still
pass the independent binding and safeguard checks.

The trusted baseline `closeout-command.json` declares
`rollbackPolicy: { owner, procedure, recoveryTarget: "120s" }`, using the repo's
actual procedure-owned RTO, not a universal limit. Oracle observations include
separate `rollback.recoveryTarget` (must match that RTO) and
`rollback.recoveryTime` (actual measured duration, positive/finite and at most
the RTO). Both use explicit units such as `ms`, `s`, `minutes`, or `h`.
`rollback.immutableTarget` must be a full 40/64-character commit/content SHA,
`sha256:<64 hex>`, or `<artifact/config>@sha256:<64 hex>`. A version tag, branch,
goal-only duration, or structured assertion without an exercised probe is not
rollback readiness.

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
