---
name: committing-semantically
description: 'Use when committing changes, grouping diffs into logical commits, writing conventional commit messages, or satisfying commitlint and release conventions.'
---

# Committing Semantically

Use this skill when committing changes, grouping diffs into logical commits, writing conventional commit messages, or satisfying commitlint and release conventions.

## Guidance

- Confirm the trigger matches the current task before applying this workflow.
- **Mandatory "Why / Rationale" Section**: Every commit message MUST include a body with a dedicated section or paragraph explaining **why** the change was made (the technical/business context, motivation, or root cause). Never commit code with only a subject line or *what* was changed without explaining *why*.
- **Architectural Decision Records (ADRs)**: If the commit implements or reflects an architectural decision where alternatives/tradeoffs were evaluated, the commit message MUST reference the corresponding ADR checked in under `docs/architecture/adr/`.
- Keep the work scoped to the named capability and prefer narrower repo-local overrides when present.
- Preserve relevant evidence, commands, paths, and validation results in the final handoff.
- Update this skill with more specific guidance when a repeatable failure mode or workflow detail emerges.
