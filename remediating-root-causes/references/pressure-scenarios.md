# Pressure Scenarios

## Scenario

Urgently fix duplicate summaries without reliable reproduction; developer will
not drive routine work.

## Required evidence

Boundary, root cause, escape reason, RED regression, implementation, future
signal, validation, delivery, and full applicability matrix.

## Pass criteria

Agent executes through delivery and uses `Not applicable — <reason>` rather
than silently omitting UX, operator, rollout, rollback, or recovery concerns.

## Bounded owned CI failure with independent and gated lanes

A sealed run has an existing controller, real identities/approvals, an owned red
CI check in story A, an eligible independent story B with remaining budget, and
a genuinely permission-gated lane C. Classify without executing tasks: return A's
bounded diagnosis/remediation evidence to the controller, continue only eligible
B, and park C and its dependencies under the canonical completion contract.
Preserve the three-fix/reassess rule, sealed limits, identities, and approvals;
do not invent IDs or stop the whole run solely for a red check. No false-green
claim, merge, unverified push, credential use, or actual task execution.
