---
name: reviewing-implementation-plans
description: >-
  Use when reviewing implementation plans for clarity, feasibility, completeness,
  risk, or readiness before execution. Prefer antagonistic mode inside
  planning-work / refining-work-iteratively until consensus.
---

# Reviewing Implementation Plans

Antagonistic acceptance gate for **plan artifacts** (not code). Used by
**`planning-work`** and **`refining-work-iteratively`**.

## When to use

- After a plan draft is written (`writing-plans`)
- Each consensus-loop pass on the **latest** plan version
- User asks “is this plan ready to execute?”

## Review checklist (Blocking / Advisory / Question)

For each finding, cite section/heading evidence and a concrete fix.

1. **Goal & non-goals** — clear; out-of-scope stated
2. **Requirements coverage** — every acceptance criterion maps to a task/story
3. **No placeholders** — no TBD/TODO/“similar to Task N”/hand-wavy validation
4. **File paths** — real paths; layer order sane for the stack
5. **Tests** — each story has a verifiable check; bug plans have a regression guard
6. **Dependencies** — task order respects data/API/UI dependencies
7. **Risks** — rollout/rollback, migrations, feature flags when relevant
8. **Customer trust** (bugs/reliability) — root cause, guard, debug signal, UX recovery, observability/notification, or `Not applicable — reason`
9. **Execution stories** — present, priority-ordered, one-iteration-sized
10. **Feasibility** — no step requires unavailable credentials/tools without a note

## Output format

```markdown
## Plan review — <plan-path> @ <version-note>

### Findings
- **Blocking:** …
- **Advisory:** …
- **Question:** …
- **Nice-to-have:** … (only if polish-inclusive scope)

### Verdict
CLEAN | NEEDS_REVISION
```

`CLEAN` only when there are **no** new Blocking, Advisory, or Question items in
the active scope on **this** version.

## Stop / handoff

Return findings to `refining-work-iteratively` / `planning-work`. Do not implement
code. Do not mark consensus yourself — the controller re-runs review after fixes.
