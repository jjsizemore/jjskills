---
name: triaging-backend-integration-tests
description: 'Use when diagnosing backend integration tests that involve real databases, transactions, fixtures, service boundaries, or flaky persistence behavior.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: General cross-repo skill; repo-local skills with the same
    name may override it.
---

# Triaging Backend Integration Tests

Use this skill when diagnosing backend integration tests that involve real databases, transactions, fixtures, service boundaries, or flaky persistence behavior.

## Guidance

- Confirm the trigger matches the current task before applying this workflow.
- Keep the work scoped to the named capability and prefer narrower repo-local overrides when present.
- Preserve relevant evidence, commands, paths, and validation results in the final handoff.
- Update this skill with more specific guidance when a repeatable failure mode or workflow detail emerges.
