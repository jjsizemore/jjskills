---
name: auditing-codebase-reliability
description: 'Use when auditing a codebase for latent bugs, reliability risks, performance bottlenecks, resource leaks, or release-readiness gaps.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable evidence-backed audit workflow; repository-local overrides may add local mechanics.
---

# Auditing Codebase Reliability

Use when auditing a codebase for latent bugs, reliability risks, performance
bottlenecks, resource leaks, or release-readiness gaps.

## Contract

- Produce evidence-backed, ranked findings instead of plausible speculation.
- Route an unproven cause to `debugging-systematically`; route an approved
  repair to `remediating-root-causes`.

## Workflow

- Establish the failing boundary or evidence limit, impact, root-cause evidence,
  escape reason, affected scope, regression protection, and future-debugging
  signal.
- Separate confirmed findings from hypotheses; state the smallest reproducer or
  observation needed to promote a hypothesis.
- Preserve commands, paths, artifacts, and validation results. Use the shared
  remediation handoff for actionable bugs, incidents, regressions, or findings.

## Stop condition

Stop at named evidence gaps; do not represent a hypothesis or green rerun as a
confirmed reliability fix.

## Deliverable

Deliver ranked findings with provenance, affected scope, causal confidence,
owner, recovery/rollback guidance, and UX/operator notification or
`Not applicable — reason`.
