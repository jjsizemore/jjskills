# Portable Remediation Handoff

Use this shared contract for bug, incident, regression, CI-failure, and reliability-finding work. It complements—not replaces—the owning skill’s trigger, workflow, evidence output, and stop condition.

## Portable compatibility

- Keep work scoped to the named capability and use a narrower repository override when one exists.
- Preserve evidence, commands, paths, validation results, and any blocker in the handoff.
- Extend a global skill only with repeatable portable guidance; keep repository commands, architecture, and ownership in a repository-local override.

## Required evidence

- **Failing boundary and proof:** exact failing behavior, reproduction/log/test artifact, affected users or systems, and scope.
- **Root-cause evidence and escape reason:** causal mechanism plus why existing checks or controls did not prevent it. If evidence is incomplete, state the explicit evidence limit; never invent a cause.
- **Regression protection:** a RED check that fails without the fix and GREEN evidence after it, including relevant unhappy paths.
- **Future-debugging signal:** actionable logs, metrics, traces, correlation IDs, artifacts, runbook notes, or clearer errors.
- **Evidence-limited completion claim:** distinguish verified facts, assumptions, and checks not run.

## Recovery and operations

Specify user status/retry/recovery, operator observability/notification, rollout gates, rollback criteria, failure recovery, and owner. `Not applicable — reason` is permitted only for UX, operator notification, rollout, or rollback after proving there is no relevant runtime or operator surface. It is never valid for failing boundary, root-cause evidence/evidence limit, escape reason, regression protection, or future-debugging signal.

## Controller ownership and leaf returns

`debugging-systematically` owns diagnosis-only work. Diagnostic leaves return their failing-boundary proof, reproduction, hypotheses, evidence limits, and next diagnostic step to `debugging-systematically`; they do not claim remediation delivery.

`remediating-root-causes` owns approved remediation, integration, and delivery. Remediation leaves return changed paths, regression proof, validation, rollback/recovery evidence, and remaining delivery blockers to `remediating-root-causes`; it retains integration and delivery ownership. Specialized skills must route to the appropriate controller rather than bypassing either boundary.

## External evaluation consent

No external evaluator, provider, or data egress may be invoked from this handoff without explicit task-scoped consent. The deterministic bundle oracle makes zero external calls; `external-evaluation-gate.mjs` refuses unless passed `--consent external-evaluation` and records that refusal rather than silently falling back to an external service.
