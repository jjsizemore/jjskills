---
name: committing-semantically
description: 'Use when committing changes, grouping diffs into logical commits, writing conventional commit messages, or satisfying commitlint and release conventions.'
---

# Committing Semantically

Use this skill when committing changes, grouping diffs into logical commits, writing conventional commit messages, or satisfying commitlint and release conventions.

## Guidance

- **Mandatory "Why / Rationale"**: Every commit message MUST include a body section explaining why the change was made.
- **Architectural Decision Records**: When an architectural decision is made and alternatives or tradeoffs are evaluated, reference an ADR under `docs/architecture/adr/` containing decision, alternatives considered, tradeoffs, and rationale. Routine/non-architectural changes do not require an ADR.
- Keep the work scoped to the named capability and prefer narrower repo-local overrides when present.
- Preserve relevant evidence, commands, paths, and validation results in the final handoff.
- Update this skill with more specific guidance when a repeatable failure mode or workflow detail emerges.
