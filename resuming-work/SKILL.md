---
name: resuming-work
description: >-
  Use when interrupted multi-story repository work must continue from
  .agents/runs ledger, handoff, and progress (cold start). Not for brand-new
  work (executing-work) or single-defect remediation without a run.
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable resume controller; assumes empty chat.
---

# Resuming Work — front door

**User API:** invoke **resuming-work**. Prefer repo-local override when present.
Assume **no prior chat memory**. Disk + git only.

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

1. Resolve run: `.agents/runs/ACTIVE`, else run-id / issue id, else newest incomplete
2. Read `handoff.md`, `ledger.json`, progress patterns
3. Reconcile git branch / worktree; fix base drift before implementing
4. Stop if blocked / cancelled / completed / budget exhausted
5. **One story only:** `implementing-story` for pick result
6. Rewrite handoff before exit

## Do not

- Call `init` over a good ledger; raise `maxIterations`; use `.current-work`
- Advertise work-run CLI as the user-facing API

## Leaves

`work-run-state`, `implementing-story`, optional `planning-work` / remediation.
