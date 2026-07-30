---
name: implementing-story
description: >-
  Use when implementing exactly one user story from an active .agents/runs
  ledger (acceptance criteria, tests, mark-pass or mark-blocked). Not for
  multi-story scheduling or PR closeout.
metadata:
  governing-skills-placement: user
  governing-skills-reason: Single-story leaf for Ralph-style execute loops.
---

# Implementing Story

## Role

Implement **one** ledger story end-to-end, then stop. Do not pick the next story.

## When to use

- `executing-work` or `resuming-work` selected a story via `work-run-state` `pick`
- Outer `work-run-loop` iteration body

## When not to use

- Multi-story planning → `writing-plans` / `creating-implementation-specs`
- Full pipeline closeout → `closing-repo-work`
- Diagnosed production defect without a story → `remediating-root-causes` (then optionally add a story)

## Workflow

1. **Load context (low tier OK):** `work-run-state` status + handoff.md + Codebase Patterns in progress.md + the story’s acceptance criteria.
2. **Restate criteria** as a checklist in the response (or progress append).
3. **Implement (mid tier):**
   - Feature/fix: `developing-with-tests` (RED-GREEN-REFACTOR)
   - Proven defect story: `remediating-root-causes` once
4. **Validate** the narrowest relevant checks for this story. Show command output.
5. **On validation failure:** classify (product | owned harness/CI | external |
   ambiguous) → `debugging-systematically` → for owned classes
   `remediating-root-causes`. Prefer repo-local `executing-work` Validation
   Failure Policy. Do **not** mark-blocked after a single failed patch.
6. **Outcome:**
   - Success → `work-run.mjs mark-pass --story ID --note '…'` + append progress learnings / patterns
   - Block only after external-block criteria (policy §7) → `mark-blocked --reason '…'`
7. **Rewrite handoff.md** for the next cold start (what changed, what’s next, traps).
8. **Stop.** Do not start another story in this skill invocation.

## Model tiers

| Step | Tier |
| --- | --- |
| Read ledger / explore | low |
| Implement + focused tests | mid |
| Adversarial review if story is release-sensitive/security | high |

Do not implement on low tier.

## Completion for this leaf

- Story `passes: true` with evidence, or `blockedReason` set
- progress.md and handoff.md updated
- No claim that the whole run is complete unless `status` says allPass

## Pressure scenarios

See `references/pressure-scenarios.md`.
