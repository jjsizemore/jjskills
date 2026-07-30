---
name: triaging-backend-integration-tests
description: Diagnose and fix SyncVia backend integration test failures using real containerized Postgres patterns, fixture discipline, and root-cause validation. Use when integration tests fail, are flaky, or need new coverage.
---

# SyncVia Integration Test Triage

Use this skill when working in `backend/__tests__/**` or when failures involve repositories, services, or tRPC integration flows.

## Triage Workflow

1. Reproduce the failure with the narrowest relevant test scope.
2. Classify failure type: data setup, permission context, schema mismatch, async race, assertion mismatch, or production bug.
3. Confirm whether the issue is in test setup vs production code.
4. Apply minimal fix with clear rationale.
5. Re-run focused tests, then full `pnpm test:integration`.

## Infrastructure Rules

- Use the real containerized Postgres integration setup.
- Reuse shared fixtures/helpers before creating new ones.
- Mock only true external dependencies (for example OpenAI), not core service/repository logic.
- Keep test data deterministic and isolated.

## Quality Bar

- New tests must validate intended behavior, not implementation trivia.
- Prefer assertions on observable outcomes and persisted state.
- If a bug is found in production code, fix production code and adjust tests accordingly.

## Deliverable Format

When reporting results, include:

- Root cause summary
- Files changed
- Validation commands run
- Remaining risks or blockers
