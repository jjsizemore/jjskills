---
name: resuming-work
description: >-
  Use when interrupted multi-story repository work must continue from the
  canonical `<git-common-dir>/agent-runs` ledger, handoff, and progress (cold
  start). Not for brand-new work (executing-work) or single-defect remediation without a run.
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable resume controller; assumes empty chat.
---

# Resuming Work — front door

**User API:** invoke **resuming-work**. Prefer repo-local override when present.
Recover durable state from disk and Git; retain explicit user instructions and
authorization already present in the current session. A cold start must recover
those constraints from the handoff instead of inventing new approval checkpoints.

## When to use

- Session died mid-run / user says continue or resume
- Outer unattended loop cold start

## When not to use

| Situation | Use instead |
| --- | --- |
| No run / new goal | `executing-work` (or `planning-work`) |
| Cancel | `canceling-work-run` |
| Single bug, no ledger | `remediating-root-causes` |

## Workflow

1. Resolve the exact run from `<git-common-dir>/agent-runs/ACTIVE`, then an explicit run-id. If no `ACTIVE` run exists, route to `executing-work`; never scan newest incomplete artifacts.
2. Read `handoff.md`, `ledger.json`, progress patterns
3. Reconcile git branch / worktree; fix base drift before implementing
4. Stop for cancelled/completed runs or the canonical whole-run `PAUSED` conditions.
   Reconcile recoverable blockers from authoritative native/durable state; preserve
   existing IDs, approvals, limits, and genuine gates. A per-lane/boundary budget
   exhaustion parks only that lane; pick independent authorized stories with their
   own remaining budgets. Without decisive clearance, do not retry gated
   actuation or repeat requests to a person. Observe pending machine work through
   the portable contract's single-watcher policy.
5. Match the execution mode already in use. With `WORK_RUN_OUTER_LOOP=1`, an
   active outer-loop controller, or an explicit one-story assignment, implement
   at most one picked story and return to that controller. In an ordinary
   interactive session, continue picking and implementing eligible stories until
   the requested endpoint is verified or the canonical whole-run stop condition
   applies. Do not ask for another “continue” after each story.
6. Update the existing handoff at meaningful progress/blocker transitions and
   before exit; complete the existing run through its closeout verifier when all
   stories pass. Do not initialize a replacement run.

## Do not

- Call `init` over a good ledger; raise `maxIterations`; use `.current-work`
- Advertise work-run CLI as the user-facing API

## Leaves

`work-run-state`, `implementing-story`, optional `planning-work` / remediation.
