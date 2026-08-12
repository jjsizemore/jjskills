---
name: writing-plans
description: 'Use when you have requirements or diagnosis evidence for a multi-step remediation task and need an executable implementation plan before touching code.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable planning workflow; repository-local overrides may add local mechanics.
---

# Writing Plans

Use when requirements or diagnosis evidence describe a multi-step task that
needs an executable implementation plan before code changes.

## Contract

- Confirm the trigger and explore repository facts before asking questions.
- Use `grill-me` for material unknowns that repository evidence cannot resolve;
  do not re-grill when the existing plan/spec is sufficient.
- Every plan includes an explicit **Why / Rationale**.
- When an architectural decision has real alternatives and tradeoffs, require
  an ADR under the repository's established architecture-ADR path.
- Consume diagnosis evidence; route missing diagnosis to
  `debugging-systematically` and approved execution to
  `remediating-root-causes`.

## Workflow

- Map failing boundary, root-cause evidence, escape reason, affected scope,
  regression guard, future-debugging signal, implementation tasks, validation,
  recovery, rollout, rollback, and ownership into ordered steps.
- Ensure each acceptance criterion maps to a task and proof.
- Keep `Not applicable — reason` limited to fields allowed by the shared
  handoff.

## Stop condition

Stop rather than invent a cause or call a task list remediation-ready when it
omits causal proof, regression protection, recovery, or material decisions.

## Deliverable

Deliver a dependency-ordered plan with file/surface scope, evidence links,
validation commands, decision points, rollout/rollback, and named owner.

## Execution stories appendix

When feeding a multi-story work-run, append:

```markdown
## Execution stories

| id | title | priority | acceptanceCriteria (one per line in notes) |
| --- | --- | --- | --- |
| US-001 | … | 1 | … |

### US-001
- [ ] criterion A
- [ ] criterion B
```

`work-run-state` may seed its ledger from this section. If omitted, init may
fall back to one story wrapping the plan.
