---
name: guarding-backend-architecture
description: 'Use when changing backend routers, services, repositories, schemas, permissions, persistence, or cross-layer contracts.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: General cross-repo skill; repo-local skills with the same
    name may override it.
---

# Guarding Backend Architecture

Use this skill when changing backend routers, services, repositories, schemas, permissions, persistence, or cross-layer contracts.

## Guidance

- Confirm the trigger matches the current task before applying this workflow.
- **Why / Rationale**: Every backend architecture change MUST explain why it was made.
- **ADR completeness**: When an architectural decision is made and alternatives or tradeoffs are evaluated, an ADR MUST record decision, alternatives considered, tradeoffs, and rationale; routine/non-architectural changes do not require an ADR.
- Keep the work scoped to the named capability and prefer narrower repo-local overrides when present.
- Preserve relevant evidence, commands, paths, and validation results in the final handoff.
- Update this skill with more specific guidance when a repeatable failure mode or workflow detail emerges.
