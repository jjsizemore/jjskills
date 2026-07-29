---
name: governing-agent-files
description: 'Use when creating or updating agent instructions, prompts, skills, routing files, or AI tool guidance in a repository.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: General cross-repo skill; repo-local skills with the same
    name may override it.
---

# Governing Agent Files

Use this skill when creating or updating agent instructions, prompts, skills, routing files, or AI tool guidance in a repository.

## Guidance

- Confirm the trigger matches the current task before applying this workflow.
- Keep the work scoped to the named capability and prefer narrower repo-local overrides when present.
- Preserve relevant evidence, commands, paths, and validation results in the final handoff.
- Update this skill with more specific guidance when a repeatable failure mode or workflow detail emerges.
