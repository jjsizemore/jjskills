---
name: planning-release-rollout-rollback
description: 'Use when planning or executing production rollouts, staged releases, preflight checks, verification signals, or rollback runbooks.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: General cross-repo skill; repo-local skills with the same
    name may override it.
---

# Planning Release Rollout Rollback

Use this skill when planning or executing production rollouts, staged releases, preflight checks, verification signals, or rollback runbooks.

## Guidance

- Confirm the trigger matches the current task before applying this workflow.
- Keep the work scoped to the named capability and prefer narrower repo-local overrides when present.
- Preserve relevant evidence, commands, paths, and validation results in the final handoff.
- Update this skill with more specific guidance when a repeatable failure mode or workflow detail emerges.
- Apply the [portable autonomous completion contract](../references/autonomous-completion-contract.md)
  for release safeguards admission: bounded staging with promotion criteria,
  actionable regression detection with an accountable owner, and fast rollback
  to an immutable target with verified state/schema compatibility are mandatory
  prerequisites before reducing release gates or executing changes justified by
  reversibility.
- Rollback procedures must specify known-good immutable artifact/config targets
  (not bare git revert, latest, or branch head) and explicit measured recovery time.

## Release Admission Preflight

Before executing deployment, promotion, or reduced-gate release actions:
1. Execute the canonical release safeguards admission command with `--require-admitted`:
   ```bash
   node ~/.agents/skills/work-run-state/scripts/work-run.mjs admission --endpoint <endpoint> --surface <surface> --environment <environment> --require-admitted
   ```
2. Only `status: "admitted"` (verifying all three safeguards) authorizes release actuation.
   `not_applicable` cannot authorize release or reduced-gate actuation. If admission fails,
   is denied, or exits non-zero, release actuation is strictly PROHIBITED. Retain stronger
   gates and report the exact missing prerequisites.
