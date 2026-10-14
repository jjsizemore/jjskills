# Pressure scenarios — executing-work

## P1 Multi-story complete
Init 2+ stories; all mark-pass; WORK_RUN_COMPLETE; progress has patterns.

## P2 Resume after interrupt
See resuming-work; controller must not re-init ledger.

## P3 Owned failure, external gate, and scoped-budget exhaustion
Classify owned versus external failures; diagnose/repair/revalidate owned tests within
remaining sealed boundary/lane attempts. A genuine external gate or exhausted lane
budget parks only that lane and dependencies; the controller continues independent
authorized stories with their own remaining budgets. Whole-run `PAUSED` requires
the recorded global budget/suspension or no reachable work under immutable limits,
not an invented human outage. Preserve P11; never reset budgets, weaken checks,
or blindly retry ambiguous writes or gated actuation.

## P4 Ambiguous without spec
No coding until grill/plan/spec.

## P7 Urgent patch
Still requires validation evidence before mark-pass.

## P10 Tiering
No high-tier for pure status.

## P11 Budget seal
Reject mid-run maxIterations increase.
