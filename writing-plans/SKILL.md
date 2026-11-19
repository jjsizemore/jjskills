---
name: writing-plans
description: 'Use when the portable completion contract requires a written plan for multi-step or risky work; routine work executes directly.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable planning workflow; repository-local overrides may add local mechanics.
---

# Writing Plans

The [portable contract](../references/autonomous-completion-contract.md#plan-first-rule-canonical)
is canonical:

Execute directly when facts and authority are sufficient. Require a written plan and review-to-consensus only for multi-step or risky work: multi-surface, cross-boundary, release-sensitive, a concrete review trigger present, or genuine unknowns a plan must resolve.

This skill applies only when that rule requires a plan, or the user explicitly
requests planning. Otherwise route directly to execution under existing authority.

## Contract

- Confirm the trigger and explore repository facts before asking questions.
- Use `grill-me` for material unknowns that repository evidence cannot resolve;
  do not re-grill when the existing plan/spec is sufficient.
- Follow the canonical [Why/Rationale and ADR rule](../references/why-rationale-and-adr.md).
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
