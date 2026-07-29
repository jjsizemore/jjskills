---
name: canceling-work-run
description: >-
  Use when stopping an active multi-story work run: clear .agents/runs/ACTIVE,
  mark run cancelled or completed, preserve ledger and progress. Not for
  deleting branches or git history.
metadata:
  governing-skills-placement: user
  governing-skills-reason: Inverse of execute/resume active pointer.
---

# Canceling Work Run — front door

**User API:** invoke **canceling-work-run**. Prefer repo-local override when present.

## Workflow

1. Resolve run-id from `.agents/runs/ACTIVE` or argument.
2. Cancel via work-run leaf CLI (repo: `node scripts/work-run/work-run.mjs cancel`).
   Use `complete` only when all stories already pass.
3. Confirm ACTIVE is gone; history remains under `.agents/runs/<run-id>/`.
4. Tell user to start fresh with **`planning-work`** / **`executing-work`** (new run-id).

## Do not

- Delete progress/ledger history
- Raise sealed maxIterations “to finish later”
- Confuse with deleting a git branch
