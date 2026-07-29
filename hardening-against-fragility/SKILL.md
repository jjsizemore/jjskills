---
name: hardening-against-fragility
description: 'Use when detecting or preventing flaky tests, races, intermittent failures, nondeterministic behavior, timing assumptions, shared-state leaks, or brittle coupling in code, tests, CI, or production.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable concurrency and nondeterminism hardening leaf.
---

# Hardening Against Fragility

## Goal

Remove nondeterminism; do not hide it.

## Workflow

1. Reproduce under realistic concurrency and preserve failing seed, order,
   worker count, timing, resource state, and trace.
2. Replace sleeps and timing guesses with barriers, latches, fake clocks,
   deterministic schedulers, fault injection, or explicit completion signals.
3. Force meaningful interleavings: simultaneous start, reordered completion,
   duplicate delivery, cancellation, retry during commit, and teardown failure.
4. Isolate databases, schemas, queues, ports, files, caches, globals, clocks,
   and random sources per test/worker.
5. Assert cleanup: no pending tasks, timers, subscriptions, transactions,
   clients, locks, containers, or workers.
6. Add structured trace fields: correlation ID, attempt, worker, sequence,
   state version, causal parent, pending work, and replay seed.
7. Fix the violated invariant at its ownership/atomicity boundary.

## Proof

- deterministic forced-interleaving test fails without fix
- randomized stress runs cover varied schedules and concurrency
- full suite passes under realistic resource pressure
- zero retries, longer sleeps, relaxed assertions, serialization, or quarantine
  used as the claimed fix
- observability remains sufficient to replay recurrence

Read `references/pressure-scenarios.md` when changing this skill.
