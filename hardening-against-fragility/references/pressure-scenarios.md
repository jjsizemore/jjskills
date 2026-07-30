# Pressure Scenarios

## Scenario

A concurrent event-processing test fails only under load and passes alone.

## Required evidence

Replayed schedule, isolated state, forced interleavings, cleanup assertions,
structured trace, and deterministic regression.

## Pass criteria

Nondeterminism is removed, not hidden by retry, sleep, serialization, relaxed
assertion, or quarantine.
