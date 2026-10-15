# Portable P1/P2 Promotion Pressure Scenarios

These scenarios protect the boundary between reusable user-scope guidance and
repository, provider, host, or credential adapters. They are pressure cases for
the promotion contract, not substitutes for product UAT or live infrastructure
proof.

## P1 user-acceptance-test authoring

- A mocked renderer, bridge, component, or preview reports success. Reject it
  unless the test crosses every product-owned boundary in the journey.
- The visible success state appears, but the persisted record, queue handoff,
  or owned external boundary is absent. Reject the UAT as incomplete.
- A test calls a live provider to prove delivery. Stop and use a controlled
  provider boundary; provider delivery belongs to provider monitoring/webhooks.
- A failure path has no actionable user feedback or deterministic recovery.
  Require the failure assertion and the retry or recovery assertion.

## P1 context efficiency

- Compression is used before discovery and hides the source needed to answer
  the question. Preserve the bounded source read first.
- A compressed result is stale or cannot be retrieved. Re-read or invalidate it
  and report the evidence limit; do not silently reuse stale output.
- A one-shot summary is created but no later task can retrieve it. Keep only
  reusable compressed output and record its source identity.
- A provider key, BYOK setup, or proxy route is proposed without explicit
  task-scoped consent. Stop and keep the subscription-first path.

## P2 runner ownership and healing

- A runner label or green source test is presented as native host health. Reject
  it until host truth and the owning infrastructure adapter are identified.
- A workflow defect is diagnosed as host drift, or a host defect is edited in the
  wrong repository. Stop at the ownership boundary.
- A broad fleet rollout begins without a native canary and representative job.
  Stop before mutation and preserve the evidence.
- A live patch works but no source-of-truth change, merged identity, lifecycle
  proof, or rollback exists. Treat it as canary evidence only.
- A required runner class is quarantined and delivery is called healthy. Keep
  the terminal result blocked until capacity and proof are restored.

## Conditional P2 gate decision

The P2 gate passes only when two distinct application repository origins are
demonstrably assigned to the same runner group or fleet and use an overlapping
runner class or label contract. A branch or worktree of the same origin does not
count. Record one exact line in `.agents/plans/progress.md` and the common run
progress/handoff before US-004 and US-005 close:

```text
P2_SHARED_FLEET_GATE=PASS
P2_SHARED_FLEET_GATE=NOT_APPLICABLE reason=no-second-consumer
P2_SHARED_FLEET_GATE=BLOCKED reason=repository-origin-unavailable
P2_SHARED_FLEET_GATE=BLOCKED reason=workflow-unreadable
P2_SHARED_FLEET_GATE=BLOCKED reason=provider-group-membership-unreadable
```

Only `PASS` permits both P2 user-scope skills. `NOT_APPLICABLE` or `BLOCKED`
requires both P2 targets to remain absent and the provider-specific execution
skills to remain repository-local.
