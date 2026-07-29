---
name: running-quality-gates
description: 'Use when selecting, running, or triaging validation gates such as lint, typecheck, tests, builds, hooks, smoke checks, or release readiness checks.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: General cross-repo skill; repo-local skills with the same
    name may override it.
---

# Running Quality Gates

Use this skill when selecting, running, or triaging validation gates such as lint, typecheck, tests, builds, hooks, smoke checks, or release readiness checks.

## Guidance

- Confirm the trigger matches the current task before applying this workflow.
- Keep the work scoped to the named capability and prefer narrower repo-local overrides when present.
- Preserve relevant evidence, commands, paths, and validation results in the final handoff.
- Update this skill with more specific guidance when a repeatable failure mode or workflow detail emerges.
