---
name: fixing-durable-test-failures
description: 'Use when a deterministic or intermittent test fails and the repair must distinguish product, test, fixture, environment, isolation, or obsolete-contract causes without hiding the failure.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable test-failure remediation leaf.
---

# Fixing Durable Test Failures

Use `debugging-systematically` for diagnosis and `remediating-root-causes` for
delivery.

## Classify Before Editing

- Product bug: supported behavior broke; fix production and add regression.
- Test bug: assertion observes internals or wrong contract; assert public
  behavior.
- Fixture bug: data, mock, factory, setup, or snapshot violates invariants;
  repair fixture source.
- Environment bug: clock, locale, timezone, randomness, order, filesystem,
  dependency, service, or process state leaks; control the dependency.
- Isolation bug: state, transactions, workers, ports, files, queues, or caches
  are shared; isolate and prove cleanup.
- Obsolete contract: approved behavior changed; update tests and contract docs
  together.

## Workflow

1. Reproduce with the narrowest command in a clean process.
2. Capture first differing assertion, stack, inputs, order, seed, concurrency,
   and relevant state.
3. Compare behavior before and after the suspected change.
4. Prove classification with a deterministic regression that fails before fix.
5. Apply the smallest repair without retry, sleep inflation, assertion
   weakening, quarantine, or silent snapshot acceptance.
6. Add useful diagnostic context when the original failure was opaque.
7. Run isolated, neighbor-order, containing-suite, stress/concurrency, and
   repository checks appropriate to the cause.

Durability proof requires root cause and escape reason, RED/GREEN regression,
no leaked state, repeated execution under the failure-inducing conditions, and
honest evidence limits. Record user/operator/rollout/rollback concerns as
`Not applicable — <reason>` when this test-only change has no runtime surface.

Read `references/pressure-scenarios.md` when changing this skill.
