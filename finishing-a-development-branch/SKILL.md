---
name: finishing-a-development-branch
description: 'Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup'
---

# Finishing A Development Branch

Use this skill when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup

## Guidance

- Confirm the trigger matches the current task before applying this workflow.
- **Mandatory Why Rationale**: Ensure the PR description and commit messages include a section explaining **why** the change was made before creating the PR or finalizing the branch.
- **Architectural Decision Records (ADRs)**: If the work involved architectural choices and trade-offs, confirm an ADR is documented in `docs/architecture/adr/`.
- Keep the work scoped to the named capability and prefer narrower repo-local overrides when present.
- Preserve relevant evidence, commands, paths, and validation results in the final handoff.
- Update this skill with more specific guidance when a repeatable failure mode or workflow detail emerges.
