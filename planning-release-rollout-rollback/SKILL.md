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
- Apply [release safeguard applicability and admission](../references/autonomous-completion-contract.md#release-safeguard-prerequisites)
  to the action's actual effect and resource before actuation; retain the selected
  target-native procedure and its required guards.
- Rollback procedures must specify known-good immutable artifact/config targets
  (not bare git revert, latest, or branch head) and explicit measured recovery time.

## Release Admission Preflight

For actions covered by the canonical release safeguard boundary, complete this preflight before actuation.
1. Execute the canonical release safeguards admission command with `--require-admitted`:
   ```bash
   node ~/.agents/skills/work-run-state/scripts/work-run.mjs admission --endpoint <endpoint> --surface <surface> --environment <environment> --require-admitted
   ```
2. Only `status: "admitted"` (verifying all three safeguards) authorizes release actuation.
   `not_applicable` cannot authorize release or reduced-gate actuation. If admission fails,
   is denied, or exits non-zero, release actuation is strictly PROHIBITED. Retain stronger
   gates and report the exact missing prerequisites.
