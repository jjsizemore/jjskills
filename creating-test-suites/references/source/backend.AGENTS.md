# Backend — AI Agent Context

This file provides package-specific rules for the `@syncvia/backend` package.

**See also:** Root [AGENTS.md](../AGENTS.md) for project-wide context.

---

## Documentation Freshness

- Treat this file and the backend-relevant files under `../.github/` as living guidance.
- Whenever backend architecture, workflows, status notes, or your current change make this guidance stale, update the relevant section(s) in the same work.
- Keep package-specific instructions aligned with root `AGENTS.md` plus the applicable `.github/instructions/`, `.github/agents/`, `.github/prompts/`, and related backend-focused guidance.
- Do not leave stale backend paths, patterns, or current-state claims behind when you have enough context to fix them.
- Backend release-driving commits must include a releasable Conventional Commit type (`fix`, `feat`, `perf`, or breaking change) and touch a file under `backend/`; release-please manifest routing is path-based, so scope text alone is not enough.

---

## N-Tier Architecture (NEVER VIOLATE)

```
API Layer (tRPC Routers)
    → Service Layer (ServiceFactory)
        → Repository Layer (BaseRepository)
            → PostgreSQL (Drizzle ORM + pgvector)
```

- ❌ Routers NEVER access repositories or db directly — delegate to services.
- ❌ Services NEVER access db directly — use repositories.
- ✅ Repositories are instantiated privately by services; ServiceFactory has NO repository getters.

---

## Service Architecture

### ServiceFactory Pattern

```typescript
// ✅ CORRECT
const service = ServiceFactory.getIntelligentQuestionService();

// ❌ WRONG
const service = new IntelligentQuestionService();
```

- Services have **private constructors** and `createInstance()` helpers.
- Dependencies (repositories) are injected in constructor; call ServiceFactory getters in routers.

### Permission Contexts

- Always pass user-scoped `permissionContext` for user-facing operations.
- If system context is needed, add inline comment `// SYSTEM CONTEXT INTENTIONAL`.
- Use `PermissionContextFactory.createUserContext(userId, action, resource)` when creating contexts outside tRPC middleware.

---

## Schema-First Development

- Schema lives in `src/database/schema/`.
- Import types from schema; **never duplicate interfaces**.
- Use Drizzle-Zod validators for all tRPC inputs/outputs.

```typescript
// ✅ CORRECT
import type { Meeting, User } from '@/database/schema';
import { meetings } from '@/database/schema';
type MeetingInput = typeof meetings.$inferInsert;

// ❌ WRONG – duplicate
interface MeetingInput {
  /* ... */
}
```

---

## tRPC Routers

- Extend existing routers in `src/trpc/routers/`; don't invent new endpoints without checking first.
- Use `permissionProcedure` for auto-permission-context creation.
- Validate with Drizzle-Zod; never use raw `any` types.

```typescript
export const doSomething = permissionProcedure
  .input(someZodSchema)
  .mutation(async ({ ctx, input }) => {
    const svc = ServiceFactory.getSomeService();
    return svc.doSomething(input, ctx.permissionContext);
  });
```

---

## Repository Layer

- Repositories extend `BaseRepository`; use `executeWithLogging()` for metrics.
- All queries use Drizzle ORM; never raw SQL unless necessary and audited.
- Repositories live in `src/database/access/repositories/`.

---

## Testing

- **Integration tests** run against real containerized Postgres (Docker auto-started by `globalSetupIntegration.ts`).
- **Transaction fixture is the default for new DB-touching integration tests**:
  - Import from `@tests/fixtures/transaction.js`
  - Use `test('...', async ({ tx }) => { ... })`
  - Seed through `tx` (`seedCompleteTestUser(tx)`, `seedTestMeeting(tx, ...)`) and prefer tx-scoped repository assertions
- **Pattern A (preferred/default)**: keep setup, service calls, and assertions inside the transaction fixture scope.
- **Pattern B (exception-only)**: use `@tests/fixtures/isolation.js` only when the test must validate behavior outside the transaction boundary (for example, committed-state visibility across separate DB contexts). Add a short inline comment explaining why Pattern B is required.
- `setupTestDatabase()` from `__tests__/helpers/utils/testDatabaseUtils.ts` is a compatibility helper for specific cases, **not** the default strategy for new integration tests.
- `initializeTestDatabaseAccess()` and `cleanupTestDatabaseAccess()` are removed from active helpers; do not reference or recreate them.
- Mock **external APIs** (OpenAI, platform SDKs) at module level — never mock ServiceFactory.
- Use centralized fixtures: `__tests__/fixtures/`, `__tests__/helpers/utils/`.
- Preserve behavior-focused assertions (contracts/outcomes), not private implementation details.

```bash
pnpm test              # Unit tests
pnpm test:integration  # Run only when integration coverage has NOT already been executed by `pnpm test` in this session
```

If `pnpm test` already executed the relevant backend integration suites in the current session, do not rerun `pnpm test:integration` just for duplication.

---

## Logging

- Use structured logger from `src/utils/logger.ts`.
- Never use `console.*`.
- Include correlation IDs for traceability.

---

## Performance Budgets

| Operation                | Budget           |
| ------------------------ | ---------------- |
| Vector similarity search | <100ms           |
| Question generation      | <2s (end-to-end) |
| Context assembly         | <100ms           |
| Summarization            | <5s              |

---

## Key Paths

- `src/database/schema/` — Source of truth for types
- `src/services/core/serviceFactory.ts` — Service resolution
- `src/trpc/routers/` — API endpoints
- `src/services/ai/` — AI services
- `src/services/core/meetings/realTimeDataPipelineOrchestrator.ts` — Real-time pipeline
- `__tests__/` — Test suites
