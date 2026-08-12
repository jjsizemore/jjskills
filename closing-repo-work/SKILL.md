---
name: closing-repo-work
description: 'Use when sequencing repository-changing work from local evidence through the requested handoff, review, merge, deployment, and applicable post-change proof.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable lifecycle controller; repository-local adapters supply provider commands and gates.
---

# Repository Closeout Controller

## Scope

Use for repository-changing delivery: product code, tests, docs, skills,
prompts, CI, hooks, metadata, or self-healing changes. Read-only
investigation, planning-only work, and explicitly requested local-only work do
not enter this lifecycle.

The shared [portable autonomous completion contract](../references/autonomous-completion-contract.md)
defines authority, proof tiers, recovery, ownership, and terminal states.
Repository adapters add commands and provider facts; they may not weaken its
fail-closed boundaries.

## Controller interface

The controller accepts the repository intent, acceptance/todo coverage,
immutable intended diff, task class, requested endpoint, current phase, and
applicability result. It composes phase-bound evidence and returns exactly one
terminal report: `VERIFIED`, `BLOCKED`, or `PAUSED`. It does not replace leaf
ownership or invent evidence.

Record the requested endpoint (`pr`, `merge`, or `deploy`) at run start. Do not
add authority mid-run. Missing, stale, contradictory, or unavailable required
evidence blocks progression.

## Closeout sequence

1. **Pre-change** — confirm scope, task class, authority, acceptance criteria,
   and any immutable identity or handoff required by the repository adapter.
2. **Pre-commit** — require focused intended paths, regression/contract proof,
   and exact command output bound to the current head.
3. **Pre-push** — inspect staged paths, focused commits, clean intended diff,
   and passing applicable local gates before publishing.
4. **Review/hosted** — bind the carrier SHA, PR URL, latest reviewed head,
   required checks, review threads, and mergeability. Requested merge,
   green-CI, or a healthy unversioned endpoint is not proof.
5. **Post-change** — when merge or deployment is in scope, bind actual merge
   SHA to artifact/release SHA, deployment result, runtime/version equality,
   authenticated smoke/UAT, tracking closure, and cleanup evidence.
6. **Terminal** — run only after all applicable proof is present and an
   independent oracle confirms it.

## Leaf handoffs

| Capability | Owning leaf | Controller action |
| --- | --- | --- |
| RED/GREEN regression proof | `developing-with-tests` | Require phase-bound result |
| Role-based UAT | `verifying-before-completion` | Require applicable artifacts |
| Review/mergeability | `completing-branch-pr` | Require latest-head result |
| Hosted checks/review monitoring | `monitoring-prs-and-autofixing` | Require green checks and resolved threads |
| Deployment/runtime proof | `closing-deployment-pipelines` | Require artifact and runtime evidence |
| Owned failure repair | `debugging-systematically` then `remediating-root-causes` | Require diagnosis, repair, and revalidation |

Leaves return proof or a blocker; they do not declare whole-run completion.
Independent lanes may continue after a leaf failure, dependent lanes pause,
and shared-file work remains controller-sequenced.

## Blockers and output

Stop for approval-required or prohibited actions, unavailable providers, stale
evidence, failed gates, unresolved ambiguity, or exhausted bounded recovery.
Every `BLOCKED` or `PAUSED` report includes the failing boundary, owner,
rollback disposition, next command, and a clearly labeled
`Unblock instructions (human-gated)` block. The block is a handoff, never
permission to continue or delegate.

Report current phase, task class, endpoint, immutable identity/diff bindings,
applicable proof/oracle records, leaf handoffs, exact commands/results, and
recovery/rollback scope or `Not applicable — reason`.
