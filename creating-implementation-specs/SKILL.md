---
name: creating-implementation-specs
description: 'Use when transforming a discovered issue, bug, regression, architecture gap, operational deficiency, technical debt, CI failure, security finding, or UX problem into a handoff-ready remediation spec.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable cross-repository workflow; repository-local overrides may add local mechanics.
---

# Creating Implementation Specs

Use when creating an implementation-ready remediation specification for a bug, incident, regression, CI failure, reliability finding, or production issue.

## Guidance

- Confirm the trigger matches the current task before applying this workflow.
- **REQUIRED SUB-SKILL:** Use `grill-me` to interview the user about omitted details before creating the spec.
- Preserve relevant evidence, commands, paths, and validation results in the final handoff.
- Keep project-specific lifecycle and archive mechanics in the repository-local override.

## Portable Compatibility

- Confirm the trigger matches, then use the shared remediation handoff for portability boundaries and handoff evidence. This entrypoint owns trigger, routing, evidence, and stop decisions.

## Contract

- Consume established diagnosis evidence; do not invent a root cause. Route missing diagnosis to `debugging-systematically` and implementation ownership to `remediating-root-causes`.
- **Mandatory Why / Rationale**: Every implementation spec MUST explain why the change is needed and the problem it addresses.
- **ADR requirement**: When an architectural decision is made and alternatives or tradeoffs are evaluated, require an ADR under `docs/architecture/adr/` recording decision, alternatives considered, tradeoffs, and rationale. Routine/non-architectural changes do not require an ADR.

## Workflow

- Specify the failing boundary, proof artifact, impact, root cause, escape reason, regression test that fails without the fix, and future-debugging signal.
- Specify UX status/retry/recovery, operator observability/notification, rollout gates, rollback criteria, failure recovery, owners, and evidence limits.
- Permit `Not applicable — reason` only for UX, operator notification, rollout, or rollback after proving no relevant surface exists.

## Stop Condition

- Stop when causal evidence, owner, regression protection, or recovery criteria are missing; reject a patch-and-unit-test-only brief.

## Deliverable

- Deliver an implementation-ready, evidence-linked remediation specification with acceptance, rollout/rollback, and explicit unknowns.

## Execution stories appendix (for `executing-work`)

When the spec will be executed as a multi-story run, append story-shaped units that map
acceptance criteria to `US-00N` rows (same shape as `writing-plans`). Example:

```markdown
## Execution stories

### US-001 — Regression guard for <boundary>
- [ ] Failing test exists and fails without the fix
- [ ] Fix makes the test pass
- [ ] Future-debugging signal present at <boundary>
```

Then hand off to `remediating-root-causes` and/or `executing-work` with
`work-run-state` init using those stories.
