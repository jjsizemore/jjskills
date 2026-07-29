---
applyTo: '**'
---

# SyncVia.ai Project Instructions Index

This directory contains path-specific instructions for GitHub Copilot to enforce architectural patterns and best practices across the SyncVia.ai codebase.

## Instructions by Layer

### Backend

| File                                   | Applies To                                                      | Description                                   |
| -------------------------------------- | --------------------------------------------------------------- | --------------------------------------------- |
| `backend-schema.instructions.md`       | `backend/src/database/schema/**/*.ts`                           | Database schema definitions (source of truth) |
| `backend-service.instructions.md`      | `backend/src/services/**/*.ts`                                  | Service layer with factory pattern            |
| `backend-repositories.instructions.md` | `backend/src/database/access/repositories/**/*.ts`              | Repository layer for data access              |
| `backend-trpc-routers.instructions.md` | `backend/src/trpc/routers/**/*.ts`                              | tRPC API endpoints                            |
| `backend-tests.instructions.md`        | `backend/__tests__/**/*.test.ts`                                | Integration tests                             |
| `audit-logging.instructions.md`        | `backend/src/services/**/*.ts,backend/src/trpc/routers/**/*.ts` | Audit logging for state-changing operations   |

### Frontend

| File                                             | Applies To                                                                                                                                                                    | Description                                          |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `meeting-data-uniformity.instructions.md`        | `frontend/src/**/*.{ts,tsx},desktop/src/main/**/*.ts,desktop/src/renderer/**/*.{ts,tsx},backend/src/trpc/routers/meetings/**/*.ts,backend/src/services/core/meetings/**/*.ts` | Cross-client meeting data contract consistency       |
| `frontend-components.instructions.md`            | `frontend/src/components/**/*.tsx`                                                                                                                                            | React components (including WCAG styling rules)      |
| `frontend-mobile-responsiveness.instructions.md` | `frontend/src/pages/**/*.tsx, frontend/src/components/**/*.tsx, frontend/src/routes/**/*.tsx, frontend/src/App.css, frontend/src/index.css`                                   | Mobile-browser responsive layout and viewport safety |
| `frontend-navigation.instructions.md`            | `frontend/src/**/*.tsx`                                                                                                                                                       | Navigation patterns (Link vs useNavigate)            |
| `frontend-services.instructions.md`              | `frontend/src/services/**/*.ts`                                                                                                                                               | Frontend API clients                                 |
| `frontend-trpc-tanstack.instructions.md`         | `frontend/src/**/*.{ts,tsx}`                                                                                                                                                  | tRPC + TanStack Query integration                    |

### Shared UI Package

| File                                 | Applies To                                                                                    | Description                                                                                                                                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ui-package.instructions.md`         | `packages/ui/src/**/*.{ts,tsx}`                                                               | Shared UI primitives (token usage, accessibility, WCAG styling)                                                                                                                                              |
| `ui-component-reuse.instructions.md` | `frontend/src/**/*.{ts,tsx},desktop/src/renderer/**/*.{ts,tsx},packages/ui/src/**/*.{ts,tsx}` | **UI/UX Feature Delivery Gate + Component Reuse Hierarchy** — mandatory completeness gate (complete flows, action feedback, empty/error states) and component lookup order (`@syncvia/ui` → shadcn → custom) |

### Desktop (Electron)

| File                                            | Applies To                                                                                                                                            | Description                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `desktop-client-security.instructions.md`       | `desktop/src/**/*.{ts,tsx},desktop/scripts/**/*.{sh,cjs,mjs},desktop/electron-builder*.yml,desktop/app-update.yml,desktop/template.env,desktop/.env*` | Zero-secret / low-IP boundary for shipped desktop code and env files  |
| `desktop-electron-main-process.instructions.md` | `desktop/src/main/**/*.ts`                                                                                                                            | Electron main process (CRITICAL: no TLA pattern)                      |
| `desktop-renderer.instructions.md`              | `desktop/src/renderer/**/*.{ts,tsx}`                                                                                                                  | Desktop renderer UI (IPC boundaries, tRPC usage, WCAG styling)        |
| `desktop-pack-verification.instructions.md`     | `desktop/**/*.{ts,tsx,json,yml}`                                                                                                                      | Pack verification (REQUIRED: validate packed .app after every change) |

### Configuration

| File                                 | Applies To                                                                     | Description                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `css-styling.instructions.md`        | `frontend/src/**/*.css,desktop/src/renderer/**/*.css,packages/ui/src/**/*.css` | CSS styling (tokens, WCAG contrast, destructive color safety) |
| `typescript-config.instructions.md`  | `**/tsconfig*.json`                                                            | TypeScript configuration                                      |
| `docker-config.instructions.md`      | `**/docker-compose*.yml`                                                       | Docker Compose setup                                          |
| `github-workflows.instructions.md`   | `.github/workflows/**/*.yml`                                                   | CI/CD workflows                                               |
| `environment-config.instructions.md` | `**/.env*,**/template.env`                                                     | Environment variables                                         |
| `package-config.instructions.md`     | `**/package.json`                                                              | Package configuration                                         |

### Documentation

| File                                         | Applies To     | Description                                                                        |
| -------------------------------------------- | -------------- | ---------------------------------------------------------------------------------- |
| `codebase-freshness.instructions.md`         | `**`           | Codebase freshness cascade gate — trigger→target map for structural changes        |
| `parallel-work-coordination.instructions.md` | `**`           | Mandatory shared-ledger coordination for parallel agent execution                  |
| `git-branching-strategy.instructions.md`     | `**`           | Branch-or-not decision tree, naming convention, protected branch enforcement       |
| `documentation.instructions.md`              | `docs/**/*.md` | Documentation authoring standards (status indicators, structure, cross-references) |

## How Instructions Work

GitHub Copilot automatically applies the relevant instructions based on the file you're editing. The `applyTo` glob pattern at the top of each instruction file determines when that instruction is active.

## Core Principles

All instructions enforce these core architectural principles:

### **CRITICAL: Code Quality (Zero Tolerance)**

**Before submitting ANY changes:**

1. ✅ **Run `pnpm lint`** - ZERO new linting errors (existing errors are tracked)
2. ✅ **Run `pnpm typecheck`** - ZERO new type errors
3. ✅ **Run `pnpm test`** - 100% test pass rate (no new failures)
4. ✅ **Run `pnpm test:integration` only when needed** - Required if backend integration suites were not already executed by `pnpm test` in the same session
5. ✅ **Run and pass the local Lefthook pre-commit checks** - The repo's pre-commit hook suite is part of required quality enforcement once hooks are initialized via `pnpm setup`
6. ✅ **Verify the delivered code is correct for the real use case** - Fix intended behavior, not just a narrow symptom
7. ✅ **Check the latest relevant official docs when external behavior matters** - Keep framework/library/tool usage current
8. ✅ **Iterate until validation and hygiene checks are satisfied** - Do not stop at a partial fix
9. ❌ **NEVER add `eslint-disable` comments** - Fix the issue properly
10. ❌ **NEVER use `@ts-ignore` or `@ts-expect-error`** - Fix type errors with correct types
11. ❌ **NEVER use `any` type** - Use proper types or `unknown` with type guards
12. ❌ **NEVER use `as unknown as` double-casts in production code** - This is a type-safety escape hatch. Refactor with proper narrowing, typed helpers, overloads, or explicit interfaces.
    - ✅ **Exception**: test files may use double-casts sparingly when mocking unconstructible framework/runtime types.
13. ❌ **NEVER use `console.*`** - Use structured logger from `backend/src/utils/logger.ts`
14. ❌ **NEVER skip error handling** - All async operations need try/catch or .catch()
15. ❌ **NEVER commit failing tests** - Fix or properly skip with justification
16. ❌ **NEVER introduce codebase hygiene regressions** - Preserve readability, maintainability, naming, and DRY structure
17. ✅ **ALWAYS follow clean-code and industry-standard best practices** - Prefer clear, maintainable implementations over shortcuts

### **CRITICAL: Universal Definition of Done (All Future Development)**

Copilot and all specialized agents must enforce the following completion gate for every task before declaring work done:

1. ✅ **Pass all configured Lefthook checks** (pre-commit and any applicable pre-push hooks)
2. ✅ **Include/update regression-guarding automated tests** for the changed behavior
   - Regression tests must assert expected behavior/contracts and outcomes, not merely internal implementation details.
3. ✅ **Pass all tests associated with the changed area** (targeted tests and any required suite-level checks)

If any requirement above is unmet, the task is **not done** and must be reported as blocked or incomplete with a concrete reason.

### **CRITICAL: N-Tier Architecture**

**The entire backend follows strict N-tier separation:**

```
API Layer (tRPC Routers)
    → Service Layer (ServiceFactory)
        → Repository Layer (BaseRepository)
            → Database Layer (PostgreSQL)
```

**NEVER skip layers. NEVER access repositories from routers. ALWAYS respect the flow.**

### **CRITICAL: File Naming Consistency**

All newly created or renamed files must follow consistent naming patterns:

1. **TypeScript source files default to camelCase** - Use `featureService.ts`, `meetingRouter.ts`, `useMeetingState.ts`
2. **React component files use PascalCase** - Use `QuestionRating.tsx`, `SummaryCard.tsx`
3. **Test files follow test naming patterns** - Use `<featureName>.<testType>.test.ts` (for example, `contextAssemblyService.integration.test.ts`)
4. **Config and documentation files use kebab-case or established standard names** - Use `docker-compose.yml`, `copilot-instructions.md`, `README.md`
5. **Avoid mixed or ad-hoc naming** - Do not introduce new snake_case, ALL_CAPS, or inconsistent variants unless required by external tooling conventions

When modifying an existing directory, align with the local dominant naming pattern to avoid churn and preserve consistency.

### **CRITICAL: Turbo Cache — Use Root-Level Convenience Scripts**

The root `package.json` wraps standard validation tasks through Turbo (`pnpm typecheck` → `turbo typecheck`, `pnpm lint` → `turbo lint`, `pnpm test` → `turbo test`). Turbo caches task results by input hash, so unchanged packages are skipped instantly on subsequent runs.

1. ✅ **ALWAYS use root-level `pnpm` scripts** for validation: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`
2. ❌ **NEVER use `pnpm --filter <pkg> typecheck/lint/test`** in agent instructions, prompts, or validation checklists — this bypasses Turbo's cross-package cache
3. ❌ **NEVER use raw `turbo run ...` locally** — use the `pnpm` wrapper scripts so the invocation is consistent between local runs and CI
4. ✅ **`pnpm --filter` is acceptable** for package-specific scripts that have no Turbo task equivalent (e.g., `pnpm --filter @syncvia/desktop pack:mac:arm64:fast`, `pnpm --filter @syncvia/backend dev`)

### **Other Principles**

1. **Schema-First Development** - Database schema is the single source of truth
2. **ServiceFactory Pattern** - All services accessed via factory, never instantiated directly
3. **Repository Layer** - All database operations through repositories (accessed via services)
4. **Type Safety** - Strict TypeScript, no type duplication
5. **Real Database Tests** - Integration tests use containerized Postgres
6. **Performance Budgets** - Vector search <100ms, question generation <2s
7. **Structured Logging** - Use logger from utils, never console.\*
8. **Circuit Breakers** - Wrap external API calls with fallbacks

### **Default Execution Planning Standards (REQUIRED)**

When asked to create implementation plans, projects, or task breakdowns (Linear, GitHub, docs, or PR planning), apply the following by default:

1. **Full Lifecycle Coverage** - Include discovery, implementation, validation, CI/quality gates, rollout, and post-launch follow-up tasks.
2. **Explicit Dependencies** - Add dependency links (`blockedBy`/`blocks` or equivalent) so task sequencing is machine-actionable.
3. **Parallel Starter Lanes** - Create agent-ready starter tickets for at least three parallel lanes (e.g., core implementation, quality/filters, validation/benchmarking). Include a CI/Release lane when applicable.
4. **Agent-Ready Detail** - Every task must include goal, scope, deliverables, and acceptance criteria (checklist format).
5. **Measurable Exit Criteria** - Define quantifiable success thresholds for quality and latency, plus clear go/no-go conditions for rollout.
6. **Rollback Preparedness** - Include release checklist and rollback runbook tasks before rollout tasks can start.

These planning standards are mandatory unless the user explicitly asks for a lightweight/partial plan.

## Testing Instructions

To verify instructions are working:

1. Open a file matching the `applyTo` pattern
2. Ask Copilot: "What guidelines should I follow for this file?"
3. Verify Copilot mentions the relevant instruction rules

---

**Last Updated**: April 1, 2026  
**Version**: 1.3.1  
**Maintained By**: SyncVia.ai Development Team
