# Remediation Categories (A-G)

Use this reference for primary root-cause assignment and corrective action.

## Category table

| Category | Name | Detection signals | Correct fix |
| --- | --- | --- | --- |
| A | Buggy implementation | Production behavior violates intended contract, wrong logic/types/error handling, architectural rule break | Fix production code. Keep assertions strong. |
| B | Stale test | Assertion conflicts with intentionally changed and correct behavior | Update only stale assertions; preserve test intent. |
| C | Bad setup/teardown | State leakage across tests, missing reset hooks, lifecycle ordering issues | Repair lifecycle hooks and isolation flow. |
| D | Wrong mock/fixture | Mock shape/data is outdated or contradicts schema/contract; inline mock duplicates shared helpers | Update/consolidate fixtures/mocks with canonical helpers. |
| E | Type/schema drift | Schema/type evolution not reflected in tests | Import canonical schema/types and remove duplicated stale interfaces. |
| F | Missing dependency wiring | Service getter/repository export/enum registration missing after feature additions | Register missing wiring in factory/index exports without breaking layering. |
| G | Environment/config | Missing env vars, container/setup issues, DB/bootstrap misconfiguration | Fix environment/setup and document prerequisite checks. |

## Dependency-ordered fix strategy

1. Resolve `G` and `C` first (harness and lifecycle health).
2. Resolve `F` next (wiring and registration gaps).
3. Resolve `A` next (runtime correctness).
4. Resolve `B`, `D`, `E` last (assertion/mocks/types alignment).

## Must-have constraints

- Never suppress failures using `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `.skip()`, or weakened assertions.
- Never use `any` as a workaround.
- Never mask errors with silent catch blocks.
- Preserve currently passing tests.
- Avoid breaking public API/schema contracts unless explicitly unavoidable and documented.

## Validation checklist

After fixes, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
```

Report each result plus unresolved blockers.

## Per-failure note template

```text
### Failure #N - <test file> > <test name>
Error: <one-line summary>
Category: <A-G> - <category name>
Root Cause: <1-3 sentence explanation>
Fix Applied:
- <file changed>: <what changed and why>
Verification: <passing evidence and regression check>
Docs Check: <official source + conclusion, when relevant>
```
