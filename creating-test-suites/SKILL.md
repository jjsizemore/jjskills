---
name: creating-test-suites
description: 'Use when building or extending behavior-focused tests for missing coverage, regression protection, contracts, quality gates, or incidents.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable behavior-focused testing workflow; repository-local overrides may add local mechanics.
---

# Creating Test Suites

Use when building or extending behavior-focused tests for missing coverage,
regression protection, contracts, quality gates, or incidents.

## Contract

- Build coverage for the named capability; retries, longer sleeps, weaker
  assertions, quarantine, and blind snapshot acceptance are not fixes.
- Route an unproven failure cause to `debugging-systematically`; route an
  approved repair to `remediating-root-causes`.

## Workflow

- Reproduce the failing boundary when available; record root-cause evidence or
  an explicit evidence limit, escape reason, affected contract, RED test,
  GREEN proof, and future-debugging signal.
- Exercise meaningful unhappy paths and use the narrowest relevant suite before
  broad checks.
- Do not invent a root cause: stop and request diagnosis when evidence cannot
  establish one.

## Stop condition

Stop only when the regression would fail without the change and verification is
fresh; otherwise report the evidence gap without claiming coverage.

## Deliverable

Report test paths, exact commands/results, RED/GREEN evidence, failure-path
coverage, future-debugging signal, evidence limits, and recovery/rollback or
`Not applicable — reason`.
