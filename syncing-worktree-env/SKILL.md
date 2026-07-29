---
name: syncing-worktree-env
description: 'Use when a newly created or refreshed git worktree needs local environment files, dependency state, or tool trust restored safely.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: General cross-repo skill; repo-local skills with the same
    name may override it.
---

# Syncing Worktree Env

Use this skill when a newly created or refreshed git worktree needs local environment files, dependency state, or tool trust restored safely.

## Guidance

- Confirm the trigger matches the current task before applying this workflow.
- Keep the work scoped to the named capability and prefer narrower repo-local overrides when present.
- Preserve relevant evidence, commands, paths, and validation results in the final handoff.
- Update this skill with more specific guidance when a repeatable failure mode or workflow detail emerges.
