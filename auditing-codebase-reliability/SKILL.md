---
name: auditing-codebase-reliability
description: 'Use when auditing a codebase for latent bugs, reliability risks, performance bottlenecks, resource leaks, or release-readiness gaps.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable cross-repository workflow; repository-local overrides may add local mechanics.
---

# Auditing Codebase Reliability

Use when auditing a codebase for latent bugs, reliability risks, performance bottlenecks, resource leaks, or release-readiness gaps.

## Portable Compatibility
- Confirm the trigger matches, then use [the shared remediation handoff](../references/remediation-handoff.md) for portability boundaries and handoff evidence. This entrypoint still owns its trigger, routing, evidence, and stop decision.

## Contract
- Produce evidence-backed, ranked findings instead of plausible speculation.
- Route an unproven cause to `debugging-systematically`; route a requested repair to `remediating-root-causes`.

## Workflow
- Establish the failing boundary or evidence limit, impact, root-cause evidence, escape reason, affected scope, regression protection, and future-debugging signal.
- Separate confirmed findings from hypotheses, and state the smallest reproducer or observation needed to promote a hypothesis.
- Use the shared remediation handoff for every actionable bug, incident, regression, or finding.

## Stop Condition
- Stop at named evidence gaps; do not represent a hypothesis or a green rerun as a confirmed reliability fix.

## Deliverable
- Deliver ranked findings with provenance, affected scope, causal confidence, recovery/rollback guidance, owner, and UX/operator notification or `Not applicable — reason`.

## Preserved Portable Original Clauses

---
name: auditing-codebase-reliability
description: 'Use when auditing a codebase for latent bugs, reliability risks, performance bottlenecks, resource leaks, or release-readiness gaps.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: General cross-repo skill; repo-local skills with the same
    name may override it.
---

# Auditing Codebase Reliability

Use this skill when auditing a codebase for latent bugs, reliability risks, performance bottlenecks, resource leaks, or release-readiness gaps.



## Guidance

- Confirm the trigger matches the current task before applying this workflow.
- Keep the work scoped to the named capability and prefer narrower repo-local overrides when present.
- Preserve relevant evidence, commands, paths, and validation results in the final handoff.
- Update this skill with more specific guidance when a repeatable failure mode or workflow detail emerges.

