---
name: testing-github-actions-locally
description: 'Use when debugging GitHub Actions event filters, job conditions, reusable workflows, runner differences, secrets, or workflow behavior locally before hosted verification.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable GitHub Actions local-debugging leaf.
---

# Testing GitHub Actions Locally

## Evidence Order

Hosted event and expression behavior is authoritative. Local emulation is
diagnostic and regression support.

1. Compare one failing hosted run with one working run at exact SHAs.
2. Record event name/action, ref, ref_name, base_ref, head_ref, draft/fork
   state, changed paths, permissions, runner, and job/step skip reason.
3. Build sanitized fixtures from real webhook payloads for push, PR, draft,
   fork, synchronize, and reusable-workflow cases.
4. Evaluate workflow trigger, path/branch filters, job `if`, step `if`, and
   `needs.*.result` separately.
5. Parenthesize mixed boolean expressions and use event-aware branch fields.
6. Pass decision-critical values into reusable workflows as typed inputs;
   map secrets separately.
7. Test secret-present and secret-absent paths without production credentials.

Do not switch to `pull_request_target` merely to obtain secrets. Document local
limits: approvals, OIDC, protected environments, branch protection,
merge-queue behavior, hosted identity, and some expression/path-filter logic.

Add fixture-based predicate/structure contract tests that fail without the
condition fix. Then push and verify fresh hosted runs for every intended event
case on the commit containing the fix.

Read `references/pressure-scenarios.md` when changing this skill.
