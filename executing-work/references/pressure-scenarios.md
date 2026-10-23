# Pressure scenarios — executing-work

## P1 Multi-story complete
Init 2+ stories; all mark-pass; WORK_RUN_COMPLETE; progress has patterns.

## P2 Resume after interrupt
See resuming-work; controller must not re-init ledger.
In an interactive session with two eligible stories and sufficient remaining
budget, finishing the first continues to the second and then closeout. In an
outer-loop child or explicit one-story assignment, return after one story.
Preserve the existing ledger and authorization in both cases.

## P2a Pending CI without events
Reviewed current head has pending CI and the provider offers reads but no
callbacks. One owner uses bounded sequential polling with backoff, reuses
unchanged review, and proceeds when the required current-head checks pass.
No duplicate watcher, human “continue” prompt, tight loop or mutation retry.

## P2b Clean review with optional note
The first review finds no blocking defect and one optional style note. Record
the deferral rationale and continue delivery without asking the user or running
another review against unchanged work. A confirmed regression still requires
repair and affected validation/review.

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
