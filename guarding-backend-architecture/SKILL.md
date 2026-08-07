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

- Confirm the trigger matches the current task before applying this workflow.
- **Architectural Decision Records (ADRs)**: Any architectural change to backend routers, services, repositories, schemas, persistence models, or cross-layer contracts MUST document the decision, trade-offs, and alternatives considered in an ADR under `docs/architecture/adr/`.
- **Why / Rationale**: Every change, PR, and commit MUST include a clear explanation of **why** the backend architecture modification was made.
- Keep the work scoped to the named capability and prefer narrower repo-local overrides when present.
- Preserve relevant evidence, commands, paths, and validation results in the final handoff.
- Update this skill with more specific guidance when a repeatable failure mode or workflow detail emerges.
