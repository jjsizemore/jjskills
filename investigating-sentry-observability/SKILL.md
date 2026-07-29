---
name: investigating-sentry-observability
description: 'Use when investigating a Sentry issue, event, trace, release regression, deploy correlation, affected-user cohort, or observability gap and root cause must be evidence-backed.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable Sentry investigation leaf; repositories may add tool wiring.
---

# Investigating Sentry Observability

## Workflow

1. Confirm project, environment, release, first/last seen, frequency, and
   regression state. Compare affected release with known-good release.
2. Group by exception, message, stack fingerprint, transaction, endpoint,
   platform, and release; inspect first, latest, and representative events.
3. Follow associated traces to the first abnormal span. Compare failed and
   successful traces for the same operation.
4. Reconstruct causal breadcrumbs, flags, retries, network calls, state
   transitions, and deploy/config/migration timing.
5. Measure affected users, sessions, tenants, devices, regions, account states,
   and input cohorts against unaffected cohorts.
6. Treat suspect commits as leads. Verify Git, deploy metadata, flags, config,
   schema, and dependency changes.
7. State exact failing boundary, trigger, intermittency condition, introducing
   change, escape reason, and evidence linking them.

Protect privacy: use IDs and sanitized fields; do not copy secrets, tokens,
transcript content, or unnecessary personal data.

If telemetry proves only where error surfaced, report that boundary, ranked
hypotheses, confidence, and next observation needed. Verify locally against the
affected release with sanitized inputs; add regression proof before any fix.

Deliver issue/event/trace IDs, affected scope, release/commit evidence,
reproduction status, root cause or evidence limit, and observability gaps.

Read `references/pressure-scenarios.md` when changing this skill.
