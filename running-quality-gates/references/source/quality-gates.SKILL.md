---
name: running-quality-gates
description: Run and triage SyncVia required validation gates (lint, typecheck, unit tests, integration tests, and Lefthook) before considering a change complete. Use this for any code change, bug fix, or refactor that needs production-ready verification.
---

# SyncVia Quality Gates

Use this skill when a task involves code changes and you need to validate release readiness with the repository's required quality checks.

## Required Validation Order

Run checks in this order to fail fast and reduce debugging time:

1. Targeted tests relevant to changed code (if available)
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test`
5. `pnpm test:integration`
6. Lefthook pre-commit checks (after `pnpm setup` has initialized hooks)

## Triage Rules

- Never claim success if any gate fails.
- Report failures with: command, failing file/test, root cause hypothesis, and next action.
- Fix root causes over symptoms; avoid suppressions (`eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `any`).
- Re-run the failed gate after each fix, then re-run the full sequence.

## Completion Criteria

A task is considered complete only when:

- No new lint/type/test failures are introduced.
- Relevant test coverage is updated for changed behavior.
- All required gates are green locally (or clearly documented as blocked with reason).
