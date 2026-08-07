---
name: writing-plans
description: 'Use when you have requirements or diagnosis evidence for a multi-step remediation task and need an executable implementation plan before touching code.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable cross-repository workflow; repository-local overrides may add local mechanics.
---

# Writing Plans

Use when you have requirements or diagnosis evidence for a multi-step remediation task and need an executable implementation plan before touching code.

## Portable Compatibility
- Confirm the trigger matches, then use [the shared remediation handoff](../references/remediation-handoff.md) for portability boundaries and handoff evidence. This entrypoint still owns its trigger, routing, evidence, and stop decision.

## Contract
- Confirm the trigger and request clarification for material unknowns; preserve portable planning behavior and prefer narrower repository overrides.
- **Mandatory "Why / Rationale" Section**: All plans MUST include a dedicated section explaining **why** the proposed changes are being made.
- **Architectural Decision Records (ADRs)**: If the plan involves architectural decisions where alternatives/tradeoffs were evaluated, the plan MUST require an ADR to be written and checked in under `docs/architecture/adr/ADR-XXX-<name>.md` (or repo-standard ADR directory). Routine/non-architectural changes do not require an ADR, but still require the "Why" rationale.
- Consume diagnosis evidence; route missing diagnosis to `debugging-systematically` and execution to `remediating-root-causes`.

## Workflow
- Map the motivation ("Why"), failing boundary, root-cause evidence, escape reason, affected scope, ADR path (if architectural), regression guard, future-debugging signal, implementation tasks, validation, recovery, rollout, rollback, and ownership into ordered steps.
- Ensure each acceptance criterion maps to a task and proof; keep `Not applicable — reason` limited to fields allowed by the shared handoff.
## Stop Condition
- Stop rather than invent a cause or call a generic task list remediation-ready when it omits causal proof, regression protection, or recovery.

## Deliverable
- Deliver a dependency-ordered plan with file/surface scope, evidence links, validation commands, decision points, rollout/rollback, and named owner.

## Execution stories appendix (for `executing-work`)

When the plan will feed a multi-story work-run, append:

```markdown
## Execution stories

| id | title | priority | acceptanceCriteria (one per line in notes) |
| --- | --- | --- | --- |
| US-001 | … | 1 | … |

### US-001
- [ ] criterion A
- [ ] criterion B
```

`work-run-state` init may seed `ledger.json` from this section. If omitted, init falls back
to a single story wrapping the whole plan.

## Preserved Portable Original Clauses

---
name: writing-plans
description: 'Use when you have a spec or requirements for a multi-step task, before touching code'
---

# Writing Plans

Use this skill when you have a spec or requirements for a multi-step task, before touching code



## Guidance

- Confirm the trigger matches the current task before applying this workflow.
- **REQUIRED SUB-SKILL:** Use the `grill-me` skill to interview the user about anything they didn't think of or mention, and get on the same page about the details of the plan, before writing the implementation plan.
- Keep the work scoped to the named capability and prefer narrower repo-local overrides when present.
- Preserve relevant evidence, commands, paths, and validation results in the final handoff.
- Update this skill with more specific guidance when a repeatable failure mode or workflow detail emerges.

