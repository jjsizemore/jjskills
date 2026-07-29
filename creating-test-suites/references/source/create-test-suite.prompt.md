---
agent: test-specialist-syncvia
description: 'Build or extend a complete, well-modularized test suite for a file, service, or feature area. Automatically discovers the highest-value uncovered surface when no target is given. Finishes by creating a companion instruction rule that enforces test maintenance whenever the covered surface changes.'
argument-hint: 'Optional: path, service name, or feature area to test (e.g. "contentVersionRepository", "desktop/src/renderer/views/PostMeetingView.tsx"). Leave blank to auto-discover highest-value gap.'
---

# Create Test Suite

You are a senior SyncVia.ai engineer writing a complete, production-quality test suite. Work methodically through the four phases below. Deliver code that is correct for the real use case, checked against the latest relevant official docs when runtime semantics matter, and iterated until tests are green, no hygiene regressions remain, and the instruction rule is in place.

## Task

Produce a complete, passing test suite for the surface identified in the argument (or discovered by priority analysis), then create a companion `.instructions.md` rule that enforces keeping that test suite current whenever the covered source files change. Finish by refactoring the resulting test files into the minimum number of focused modules that stay readable and independently runnable.

**Target surface** (provided by user, or discovered in Phase 0):
`${input:target:file path, service name, feature area, or leave blank to auto-discover}`

---

## Phase 0 — Auto-Discover (skip if target provided)

If no target was given, identify the single highest-value uncovered or under-covered surface by weighing:

1. **Customer impact** — Does a failure here break a critical user flow? (Meeting sessions, post-meeting review, audio capture, feedback submission, authentication.)
2. **Usage frequency** — Is this code exercised on every user action or only rarely?
3. **Observed brittleness** — Has this surface caused production bugs, CI red builds, or test flakes recently? Check commit history and recent CI failures.
4. **Coverage gap size** — Are there zero tests, or is coverage superficial compared to the surface's complexity?
5. **Architecture criticality** — Are there untested repositories, service methods, or tRPC procedures through which data flows unchecked?

Scan these locations in order and pick the single best candidate:

```
backend/src/services/            — service layer (highest business logic density)
backend/src/database/access/repositories/  — repository layer (persistence contracts)
backend/src/trpc/routers/        — tRPC routers (API surface contracts)
desktop/src/renderer/views/      — desktop primary UX surfaces
desktop/src/main/                — Electron main-process IPC and lifecycle
frontend/src/                    — secondary web surfaces (review, onboarding, signup)
packages/ui/src/                 — shared UI primitives
```

Output a brief justification (≤3 sentences) before proceeding.

---

## Phase 1 — Understand the Surface

Before writing a single test:

1. **Read the source file(s)** completely. Note every exported function, method, class, hook, or component.
2. **Trace all dependencies** — which services, repositories, or child components does it call?
3. **Check the schema** (`backend/src/database/schema/`) for relevant entity types. Never duplicate them.
4. **Identify existing tests** — search `backend/__tests__/`, `desktop/src/**/*.test.*`, and `frontend/src/**/*.test.*` for any current coverage. Catalogue what is already tested vs. what is missing.
5. **Identify mocking boundaries** — determine which dependencies are real vs. which must be mocked (OpenAI, platform APIs). Prefer real implementations; mock only at true external boundaries.
6. **Read the latest official docs** when framework, library, or runtime behavior (Vitest, Drizzle, Electron IPC, React Testing Library, tRPC) is not obvious from the code.

---

## Phase 2 — Build Complete Coverage

### Test taxonomy

For each entry point or exported unit, write tests across all applicable tiers:

| Tier            | When to use                                                     | File suffix            |
| --------------- | --------------------------------------------------------------- | ---------------------- |
| **Unit**        | Pure logic, no I/O, all dependencies injectable                 | `.unit.test.ts`        |
| **Integration** | Service + repository + real DB; external APIs mocked            | `.integration.test.ts` |
| **Component**   | React/renderer UI snapshot + interaction (RTL or Playwright)    | `.test.tsx`            |
| **Benchmark**   | Latency-sensitive paths must assert against performance budgets | `.benchmark.test.ts`   |

Performance budgets (assert in benchmarks):

| Operation                  | Budget   |
| -------------------------- | -------- |
| Vector similarity search   | < 100 ms |
| Question generation (e2e)  | < 2 s    |
| Context assembly           | < 100 ms |
| Feedback submission        | < 2 s    |
| Post-meeting summarization | < 5 s    |

### Coverage requirements

Every test suite must cover at minimum:

- **Happy path** — normal inputs produce expected outputs/side effects
- **Boundary conditions** — empty inputs, zero counts, maximum lengths
- **Error paths** — service throws, database constraint violations, external API failures
- **Permission enforcement** — user-scoped operations reject missing or wrong `PermissionContext`
- **Concurrent/idempotent behavior** — duplicate calls, retries, and re-entrancy where applicable
- **Schema contract** — persisted data shape matches Drizzle schema types exactly

### Backend integration test rules

```typescript
// ✅ CORRECT pattern
import { setupTestDatabase } from '@/test/testDatabaseUtils'; // real DB
import { mockOpenAIChat } from '@/test/mockOpenAIResponses'; // external boundary
import { createTestUser, createTestMeeting } from '@/__tests__/fixtures/database';
import { withIsolation } from '@/__tests__/fixtures/isolation';

vi.mock('openai'); // module-level — never inline

describe('MyService — integration', () => {
  const db = setupTestDatabase();

  it(
    'persists and retrieves entity',
    withIsolation(async () => {
      const user = await createTestUser(db);
      const meeting = await createTestMeeting(db, user.id);
      const svc = ServiceFactory.getMyService();

      const result = await svc.doWork(
        meeting.id,
        PermissionContextFactory.createUserContext(user.id, 'do_work', 'entity')
      );

      expect(result).toMatchObject({
        /* expected contract */
      });
      // Verify persistence directly via repository, not service re-read
    })
  );
});
```

```typescript
// ❌ NEVER — mock ServiceFactory or repositories in integration tests
vi.mock('@/services/core/serviceFactory');
vi.mock('@/database/access/repositories/meetingRepository');
```

### Frontend / desktop component test rules

- Use React Testing Library for renderer components.
- Use `userEvent` over `fireEvent` for simulated interactions.
- Assert visible output and ARIA roles — not implementation internals.
- Stub tRPC hooks at the query-options level, not the HTTP layer.
- For desktop tests requiring IPC, mock `window.syncvia.*` at the module boundary.

### Fixture discipline

Always prefer centralized fixtures over inline data:

| Need                  | Use                                                      |
| --------------------- | -------------------------------------------------------- |
| Test user/org/team    | `backend/__tests__/fixtures/database.ts`                 |
| Auth context          | `backend/__tests__/fixtures/auth.ts`                     |
| Transaction isolation | `backend/__tests__/fixtures/transaction.ts`              |
| Suite-level isolation | `backend/__tests__/fixtures/isolation.ts`                |
| OpenAI mock responses | `backend/__tests__/helpers/utils/mockOpenAIResponses.ts` |
| DB instance           | `backend/__tests__/helpers/utils/testDatabaseUtils.ts`   |

If a required fixture does not exist, create it **in the centralized location**, not inline in the test file.

### File naming

```
✅ myService.integration.test.ts
✅ MyComponent.test.tsx
✅ vectorSearch.benchmark.test.ts
❌ my-service.test.ts         (kebab-case)
❌ MyService_Test.ts          (PascalCase + underscore)
```

---

## Phase 3 — Validate

Run the full validation suite and iterate until all checks are green:

```bash
pnpm typecheck      # zero new type errors
pnpm lint           # zero new lint violations
pnpm test           # all unit tests pass
pnpm test:integration  # all integration tests pass
```

**Do not stop iterating until:**

- All tests in the new suite pass
- No previously-passing tests regress
- `pnpm typecheck` and `pnpm lint` produce zero new errors
- Delivered tests assert the **real contracts**, not implementation internals or mock call counts
- Local Lefthook pre-commit checks pass (when hooks are initialized via `pnpm setup`)

---

## Phase 4 — Create Companion Instruction Rule

Once the suite is green, create (or update) a `.instructions.md` file that enforces test maintenance for this surface. Place it in `.github/instructions/`.

**File naming**: `<surface-domain>-tests.instructions.md` (e.g., `content-version-service-tests.instructions.md`). If a general domain file already exists (e.g., `backend-tests.instructions.md`), **add a targeted section to it** rather than creating a new file.

The frontmatter `applyTo` must match the **source files** whose changes should trigger the test-maintenance requirement, not the test files themselves.

### Instruction template

````markdown
---
applyTo: '<glob matching source files covered by this test suite>'
---

## Test Maintenance: <Surface Name>

When modifying files matching this path, you **must** keep the companion test suite current:

**Test files**: `<test file paths or glob>`

### Required coverage

Any change to the covered source must be accompanied by an update to the test suite that:

- ✅ Adds or updates tests for every new or changed public method/handler/component
- ✅ Keeps all existing tests passing (no regressions)
- ✅ Asserts real behavior (persisted state, API contract, user-visible output) — not implementation internals
- ✅ Uses centralized fixtures from `backend/__tests__/fixtures/` and helpers from `backend/__tests__/helpers/utils/`
- ❌ NEVER adds `eslint-disable`, `@ts-ignore`, or `any` to make tests compile
- ❌ NEVER weakens an assertion to make a test pass — fix the implementation or the test intent

### Validation gate

Before committing changes to covered source files, confirm:

```bash
pnpm test                # unit suite green
pnpm test:integration    # integration suite green
pnpm typecheck           # zero new type errors
pnpm lint                # zero new violations
```
````

```

---

## Phase 5 — Modularize

If any test file covers **more than one logical unit** (e.g., a repository and a service in the same file), split it. The goal is one concern per file so an agent can load, reason about, and edit the entire file without juggling multiple mental models. Apply these rules:

### Split criteria

| Condition | Action |
|-----------|--------|
| File tests more than one distinct class/function/component | Split into per-unit files under a subdirectory |
| Mixed tiers in one file (unit + integration) | Separate into `.unit.test.ts` and `.integration.test.ts` |
| Multiple unrelated `describe` blocks | One file per `describe` root |
| Shared setup duplicated across files | Extract into a fixture file in `__tests__/fixtures/` |

### Resulting structure example

```

backend/**tests**/integration/services/contentVersion/
contentVersionService.create.integration.test.ts
contentVersionService.approve.integration.test.ts
contentVersionService.list.integration.test.ts
fixtures/contentVersionFixtures.ts ← shared setup for this subdirectory

````

After every split, re-run validation to confirm no test is lost:

```bash
pnpm test && pnpm test:integration
````

---

## Success Criteria

- ✅ Target surface identified with justification (or provided by user)
- ✅ Every exported function/method/component has at least one test covering its contract
- ✅ Error paths, boundary conditions, and permission enforcement are covered
- ✅ All tests assert real behavior against persisted state or visible output — not mock call counts
- ✅ Only external API boundaries (OpenAI, platform SDKs) are mocked; service/repository logic is exercised for real
- ✅ All existing tests continue to pass — zero regressions
- ✅ `pnpm typecheck` and `pnpm lint` produce zero new errors or violations
- ✅ Local Lefthook pre-commit checks pass when applicable
- ✅ Latest relevant official docs were checked when framework or runtime behavior mattered
- ✅ No codebase hygiene regressions (no duplication, naming drift, readability degradation, or banned patterns)
- ✅ A companion `.instructions.md` rule is in place in `.github/instructions/`
- ✅ Each test file covers exactly one logical unit — no mixed-concern or mixed-tier files
- ✅ Shared fixtures factored into centralized helpers, not duplicated across files
