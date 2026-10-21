---
name: closing-deployment-pipelines
description: 'Use when recent Git changes need to be pushed, released, monitored, or unblocked through CI/CD, E2E, smoke, deployment, or production verification, including when failures may be pre-existing but block the requested pipeline.'
---

# Closing Deployment Pipelines

Use this skill when recent Git changes need to be pushed, released, monitored, or unblocked through CI/CD, E2E, smoke, deployment, or production verification, including when failures may be pre-existing but block the requested pipeline.

## Guidance

- Confirm the trigger matches the current task before applying this workflow.
- Keep the work scoped to the named capability and prefer narrower repo-local overrides when present.
- Preserve relevant evidence, commands, paths, and validation results in the final handoff.
- Update this skill with more specific guidance when a repeatable failure mode or workflow detail emerges.
- Apply the [portable autonomous completion contract](../references/autonomous-completion-contract.md)
  for release safeguards admission: pipelines actuating releases require verified
  release safeguards admission (bounded staging with promotion criteria, actionable
  detection, and exercised fast rollback to an immutable target) before deployment.

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
