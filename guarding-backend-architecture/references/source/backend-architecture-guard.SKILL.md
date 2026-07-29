---
name: guarding-backend-architecture
description: Enforce SyncVia backend N-tier architecture, ServiceFactory usage, repository boundaries, schema-first typing, and permission-context correctness. Use when implementing or reviewing backend routers, services, repositories, and database interactions.
---

# SyncVia Backend Architecture Guard

Use this skill for backend changes in `backend/src/**` where architectural drift is a risk.

## Hard Rules

- Keep strict flow: Router -> Service (ServiceFactory) -> Repository -> Database.
- Routers never access repositories/database directly.
- Services never access database directly; use repositories.
- Never introduce `DatabaseAccess` shortcuts.
- Reuse schema/types from `backend/src/database/schema/**` and `backend/src/types/**`.

## Permission Context Rules

- For user-scoped operations, pass user-specific permission contexts.
- Do not use system context for user operations.
- If system context is required, include `// SYSTEM CONTEXT INTENTIONAL` with rationale.

## tRPC + Validation Rules

- Reuse existing routers when possible; do not invent duplicate endpoints.
- Align inputs/outputs with schema-derived validators.
- Preserve strict type safety (no `any`, no type suppression comments).

## Review Checklist

Before finalizing backend changes, verify:

1. Layer boundaries are respected.
2. ServiceFactory pattern is used correctly.
3. Permission contexts match operation scope.
4. Logging and error handling are present.
5. Tests cover changed behavior with real repository/service execution paths.
