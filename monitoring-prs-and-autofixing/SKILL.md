---
name: monitoring-prs-and-autofixing
description: 'Use when a pull request needs follow-through on hosted checks, review comments, mergeability, or verified fix pushes after creation or update.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable cross-repository workflow; repository-local overrides may add local mechanics.
---

# Monitoring PRs and Autofixing

Use when a pull request needs follow-through on hosted checks, review comments, mergeability, or verified fix pushes after creation or update.

## Portable Compatibility

- Confirm the trigger matches, then use the repository's supported remediation handoff for portability boundaries and handoff evidence. This entrypoint owns trigger, routing, evidence, and stop decisions.
- Apply the [portable completion contract](../references/autonomous-completion-contract.md)
  for evidence invalidators, one-watcher waits, recovery and terminal semantics.

## Refinement Loop

1. **Observe live PR state**: Fetch base/head, latest head SHA, mergeability, required checks, and open review threads. Use `gh pr view <PR> --json baseRefName,headRefName,headRefOid,mergeable,mergeStateStatus,reviewDecision,statusCheckRollup`. Fetch inline threads via `gh api repos/{owner}/{repo}/pulls/{number}/comments`.
2. **Handle blockers**:
   - **Conflicts**: Resolve semantically against the target base; validate locally before pushing.
   - **Review feedback**: Use `receiving-code-review` to evaluate inline threads with technical rigor; push follow-up commits without force-pushing so reviewers can diff.
   - **Failing checks**: Reproduce locally, diagnose root cause, fix, and validate locally before pushing.
   - **Pending checks**: Record `WAITING_CI` with the exact run/head, register one watcher under the completion contract, and work independent lanes. Do not poll continuously.
3. **Independent review**: For behavior or release-sensitive changes, obtain one capable independent review bound to the current head SHA and caller closure. Do not mandate redundant passes or specific providers.
4. **Rebind on new head**: After any fix or merge, re-observe affected hosted results on the new head SHA. Unchanged source proof remains valid.

## Exit Criteria

Stop only when all are verified on the current PR head SHA:
- All required hosted checks pass (none pending or red).
- Actionable review threads and requested changes are resolved.
- The PR is mergeable against its target base.
- Applicable independent review evidence is recorded for the current head.

## Escalation

Apply the canonical completion contract's bounded internal diagnosis and recovery before escalation. Report only genuine human gates, missing permissions, or exhausted dependencies with exact boundary, last successful state, and recovery owner.
