# Portable Autonomous Completion Contract

This contract is the provider-neutral completion boundary for repository work.
A repository-local adapter may add commands or proof, but may not weaken these
fail-closed rules.

## Task class and authority

Classify the run at intake as documentation/skill-only, product change, release-
sensitive, deployment/promotion, or runner/fleet repair. Record the requested
endpoint (`pr`, `merge`, or `deploy`) before work starts; do not silently add
merge or deployment authority later. A task class may escalate when its
changed boundary requires more proof, never downgrade silently.

Actions are `AUTONOMOUS`, `APPROVAL_REQUIRED`, or `PROHIBITED`:

- **AUTONOMOUS**: inspect, plan, delegate disjoint work, edit owned surfaces,
  add behavior tests, run checks, diagnose failures, make bounded reversible
  fixes, commit, push, open/update a PR, monitor checks/review, and prepare
  rollback or handoff evidence.
- **APPROVAL_REQUIRED**: secrets/private data, production or live third-party
  effects, merge/deploy, billing, permissions, policy, consent, privacy/legal
  commitments, destructive or irreversible mutation, force-push/history
  rewrite, out-of-scope rollback, material ambiguity, or unresolved security,
  data-loss, or release risk.
- **PROHIBITED**: hiding failures, weakening/deleting tests to pass, bypassing
  architecture/security/quality gates, exposing secrets, or continuing,
  queueing, or delegating after a human-gated `BLOCKED`/`PAUSED` state.

Unlisted actions default to `APPROVAL_REQUIRED`; `PROHIBITED` takes precedence.
Novel actions never inherit permission from a similar action.

## Proof and terminal states

Completion requires fresh evidence across every applicable boundary: requested
behavior, regression protection, affected quality gates, current guidance and
cascade references, diagnostics/observability, user/developer/operator status,
rollout/recovery, rollback, ownership, and an independent oracle. Record
`Not applicable — reason` for a boundary that genuinely does not exist.

The terminal controller must not accept a caller-supplied `oracle` claim.
`complete` invokes a fixed controller-owned verifier that rechecks the ledger,
current subject head, immutable base-to-head diff digest, and a checked-in
validation command. A matching JSON artifact or claimed `result: pass` is not
an independent oracle.

Final reports use exactly one terminal state:

- `VERIFIED`: the applicable proof tier passed with an independent oracle.
- `BLOCKED`: an owner, decision, or required evidence is unavailable.
- `PAUSED`: intentional suspension or exhausted bounded recovery budget.

`done`, `MERGE READY`, green CI, and `IN_PROGRESS` are explanatory evidence,
not terminal states. Lower proof tiers cannot substitute for higher ones:

| Task class | Minimum proof | Independent oracle |
| --- | --- | --- |
| Documentation/skill-only | Targeted contract and Markdown validation | Test output or reviewer |
| Product change | Focused behavior tests and PR checks | Reviewer plus passing checks |
| Release-sensitive | PR proof plus release guardrail and artifact/SHA evidence | Hosted check and artifact comparison |
| Deployment/promotion | Merge/artifact/deployment/runtime/version/UAT chain | Hosted workflow and runtime comparison |
| Runner/fleet repair | Native lifecycle canary and fleet-scope evidence | Canary plus operator/runtime evidence |

## Recovery and ownership

For each failed boundary record its stable ID, expected result, decisive
artifact, hypothesis, change, result, owner, rollback disposition, and next
command. Allow one blind rerun and at most three evidence-backed attempts per
boundary; each latter attempt needs a changed hypothesis or implementation and
new decisive evidence. On exhaustion, report `BLOCKED` or `PAUSED`, or execute
only an already-authorized reversible rollback/quarantine.

The controller owns the plan, shared files, lane dispatch, evidence
composition, stop decisions, and terminal report. Specialist leaves edit only
exclusive surfaces and return proof or a blocker; they never declare whole-run
completion. Independent lanes may continue after a leaf failure; dependent
lanes pause. Shared-file work is controller-sequenced.

Every `BLOCKED` or `PAUSED` report includes an `Unblock instructions
(human-gated)` block naming the blocker, accountable owner, exact next action,
expected decisive evidence, and rollback disposition. This is a handoff, not
permission to continue; resume only after explicit authorization or verifiable
external-state change.
