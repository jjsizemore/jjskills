---
name: creating-test-suites
description: 'Use when building or extending behavior-focused tests for missing coverage, regression protection, contracts, quality gates, or incidents.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable cross-repository workflow; repository-local overrides may add local mechanics.
---

# Creating Test Suites

Use when building or extending behavior-focused tests for missing coverage, regression protection, contracts, quality gates, or incidents.

## Portable Compatibility
- Confirm the trigger matches, then use [the shared remediation handoff](../references/remediation-handoff.md) for portability boundaries and handoff evidence. This entrypoint still owns its trigger, routing, evidence, and stop decision.

## Contract
- Build behavior-focused coverage for the named capability; do not treat retries, longer sleeps, weaker assertions, quarantine, or blind snapshot acceptance as a fix.
- Route an unproven failure cause to `debugging-systematically`; route an approved repair to `remediating-root-causes`.

## Workflow
- Reproduce the failing boundary when available; record root-cause evidence (or an explicit evidence limit), escape reason, affected contract, RED test, GREEN proof, and future-debugging signal.
- Exercise meaningful unhappy paths and use the narrowest relevant suite before broad checks.
- Do not invent a root cause: stop and request diagnosis when evidence cannot establish one.

## Stop Condition
- Stop only when the regression would fail without the change and the relevant verification is fresh; otherwise report the evidence gap without claiming coverage.

## Deliverable
- Deliver test paths, commands/results, RED/GREEN evidence, failure-path coverage, future-debugging signal, evidence limit, and recovery/rollback scope or `Not applicable — reason`.

## Preserved Portable Original Clauses

---
name: creating-test-suites
description: 'Use when building or extending behavior-focused tests for missing coverage, regression protection, contracts, quality gates, or incidents.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: General cross-repo skill; repo-local skills with the same
    name may override it.
---

# Creating Test Suites

Use this skill when building or extending behavior-focused tests for missing coverage, regression protection, contracts, quality gates, or incidents.



## Guidance

- Confirm the trigger matches the current task before applying this workflow.
- Keep the work scoped to the named capability and prefer narrower repo-local overrides when present.
- Preserve relevant evidence, commands, paths, and validation results in the final handoff.
- Update this skill with more specific guidance when a repeatable failure mode or workflow detail emerges.

