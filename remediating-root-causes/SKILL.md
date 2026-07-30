---
name: remediating-root-causes
description: 'Use when executing an end-to-end durable fix for a bug, incident, CI or test failure, regression, reliability risk, or unexpected behavior after root-cause diagnosis.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable remediation controller; repositories may add local delivery gates.
---

# Remediating Root Causes

## Role

This is the end-to-end execution controller. First use
`debugging-systematically`. Then implement, protect, validate, and deliver the
smallest fix tied to the proven broken boundary.

## Proof Bundle

Completion requires:

- reproduction or retained proof artifact
- failing boundary, root-cause evidence, and escape reason
- regression protection that fails without the fix
- implementation tied to the broken contract
- future-debugging signal at the earliest useful boundary
- risk-scaled validation and delivery evidence
- explicit decisions for user experience, operator observability and
  notification, rollout, rollback, and failure recovery

## Execution Loop

1. Confirm diagnosis; return to `debugging-systematically` if evidence proves
   only a symptom.
2. Write the narrowest deterministic regression test or contract and observe
   RED.
3. Implement one root-cause fix. Preserve public behavior unless change is
   explicitly required.
4. Add the smallest durable log, metric, trace, correlation ID, artifact, error
   surface, or runbook signal that shortens future diagnosis.
5. Validate focused behavior first, then shared contracts and repository gates.
6. Inspect the diff and complete required commit, push, PR, deploy, or handoff.

## Specialist Routing

Reuse a leaf before expanding this controller:

- test classification and durable repair: `fixing-durable-test-failures`
- races, flakiness, timing, shared state: `hardening-against-fragility`
- first introducing commit: `debugging-with-git-bisect`
- Sentry events, traces, cohorts, releases: `investigating-sentry-observability`
- GitHub Actions event/condition emulation: `testing-github-actions-locally`

The controller owns integration, applicability decisions, validation, and final
delivery after each leaf returns evidence.

Reject retries, sleeps, larger pools/timeouts, skipped assertions, broad
catching, serialization, or feature disabling unless evidence shows that
behavior is the real product contract and it has explicit failure tests.

## Applicability Matrix

Record every concern. Use `Not applicable — <specific reason>` when evidence
shows no action is needed; omission is not a decision.

- User experience: status, recovery, retry, data preservation, and copy.
- Operator observability: logs, metrics, traces, dashboards, artifacts, and
  healthy/degraded signals.
- Operator notification: alert, support/on-call action, or issue update.
- Rollout: compatibility, staged deployment, feature flag, and go/no-go proof.
- Rollback: revert/disable path, trigger, owner, and post-rollback verification.
- Failure recovery: retry, replay, cleanup, compensation, and idempotency.

If three fixes fail or each exposes a new failure class, stop patching and
reassess diagnosis and architecture.

Final handoff includes proof bundle, applicability matrix, validation commands,
delivery evidence, and remaining risk.

## Relation to multi-story runs

- **Green multi-story delivery** → `executing-work` + `.agents/runs` ledger (not this skill as the outer controller).
- **Single story failure inside a run** → invoke this skill once from `implementing-story`; if still failing, `work-run-state` `mark-blocked` and stop the run.
- Do not raise sealed `maxIterations` to “keep remediating.”

Read `references/pressure-scenarios.md` when changing this skill.
