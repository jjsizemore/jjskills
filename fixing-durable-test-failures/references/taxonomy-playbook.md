# Test Failure Taxonomy Playbook

Use this reference as the secondary classification axis to separate harness instability from true runtime defects.

## Categories

| Taxonomy class | What it means | Evidence requirements | Recommended next action |
| --- | --- | --- | --- |
| harness-lifecycle | Failure is primarily in test harness lifecycle, environment, setup/teardown, or infra readiness | Lifecycle logs, setup output, env/container readiness checks, reproducibility across reruns | Stabilize harness/config before touching product logic |
| service-boundary | Failure occurs at boundaries between router/service/repository/contracts/fixtures | Contract mismatch evidence, schema/type mismatch trace, boundary call chain | Repair boundary contract and shared fixtures/types |
| domain-logic | Deterministic runtime behavior violates product rules despite valid harness | Deterministic repro with correct setup and state | Fix production logic and keep tests strong |
| flaky/unknown | Non-deterministic or insufficient evidence for firm category | Rerun matrix, timing/ordering data, failure variance report | Isolate flake triggers, add diagnostics, delay behavior changes until confidence improves |

## Detection heuristics

- Treat lifecycle exceptions during global setup/teardown, DB startup/shutdown, or missing env as `harness-lifecycle` first.
- Treat serialization/validation/interface mismatches between layers as `service-boundary`.
- Treat repeated deterministic assertion failures with stable setup as `domain-logic`.
- Treat low-repro or contradictory evidence as `flaky/unknown`.

## Evidence and confidence policy

For each failure, capture:
- failing command and seed/context
- first stable stack frame in repo code
- reproducibility status (always/sometimes/rare)
- confidence score `0.00-1.00`

Guidance:
- `>=0.85`: safe to implement fix directly.
- `0.70-0.84`: implement with targeted regression coverage.
- `<0.70`: gather more evidence before editing logic.

## Command-level triage workflow

```bash
# 1) Reproduce the failure batch
pnpm test
pnpm test:integration

# 2) Narrow to failing file/suite
pnpm vitest <path-or-pattern>

# 3) Re-run to assess determinism
pnpm vitest <path-or-pattern> --runInBand
pnpm vitest <path-or-pattern> --repeat 3
```

Adapt commands to repo test tooling while preserving the same evidence goals.

## Example classification report format

```text
Failure batch summary
- Total failures: <N>
- harness-lifecycle: <n>
- service-boundary: <n>
- domain-logic: <n>
- flaky/unknown: <n>

Detailed classification
1) <file> > <test>
   Class: harness-lifecycle
   Primary category: G - Environment/config
   Confidence: 0.93
   Evidence: <key evidence>
   Next action: <action>
```

## Integration point recommendations

Integrate the taxonomy at one or more of:
- PR failure triage comments
- CI failure runbooks/checklists
- test specialist handoff summaries
- migration-status reports where harness instability and runtime defects must stay distinct

Goal: reduce false attribution of runtime bugs when failures are actually harness-related.
