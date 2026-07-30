---
name: debugging-systematically
description: 'Use when diagnosing a bug, test failure, incident, regression, or unexpected behavior and the user wants the failing boundary and root cause established before any fix.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable diagnosis workflow; repositories may provide narrower boundary maps.
---

# Debugging Systematically

## Contract

This skill is diagnosis-only. Gather evidence, isolate the first failing
boundary, identify root cause and escape reason, then stop. Do not implement a
fix unless the user also requested remediation; in that case hand execution to
`remediating-root-causes` after diagnosis completes.

## Required Evidence

- expected versus actual behavior and affected scope
- exact command, input, SHA/version, environment, timestamps, and artifacts
- smallest reliable reproduction or strongest retained production proof
- one failing case compared with one known-good case
- first boundary where expected state diverges
- root cause, contributing conditions, confidence, and ruled-out hypotheses
- escape reason: why the issue escaped tests, validation, monitoring, or review
- evidence limits and next observation needed if root cause remains unproven

## Workflow

1. Preserve current state and read applicable instructions.
2. Reproduce narrowly. For intermittent failures preserve seed, order,
   concurrency, clock, network, and resource state.
3. Trace one unit of work through adjacent boundaries. Record identifiers,
   state transitions, durations, retries, queueing, permissions, and errors.
4. Form one falsifiable hypothesis and run the smallest non-mutating check.
5. Repeat until evidence identifies the earliest divergence. Do not infer a
   deeper cause than telemetry supports.
6. Determine why existing safeguards missed the failure.
7. Define regression protection and future-debugging signal for the eventual
   fix without implementing them in diagnosis-only mode.

Use the narrowest specialist when applicable:

- `fixing-durable-test-failures`
- `hardening-against-fragility`
- `debugging-with-git-bisect`
- `investigating-sentry-observability`
- `testing-github-actions-locally`

## Stop Condition

Stop when the failing boundary, root cause, escape reason, and evidence are
established, or when a named evidence gap blocks deeper isolation after safe
checks are exhausted.

Deliver a compact diagnosis with reproduction, boundary, cause, escape reason,
proof, ruled-out hypotheses, evidence limits, proposed regression guard, and
future-debugging signal. Route fix requests to `remediating-root-causes`.

Read `references/pressure-scenarios.md` when changing this skill.
