---
name: verifying-before-completion
description: 'Use after creating changes and before final responses, commits, pushes, PRs, or success claims to run role-based UAT and evidence-backed verification.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable cross-repository workflow; repository-local overrides may add local mechanics.
---

# Verifying Before Completion

Use after creating changes and before final responses, commits, pushes, PRs, or success claims to run role-based UAT and evidence-backed verification.

## Portable Compatibility
- Confirm the trigger matches, then use [the shared remediation handoff](../references/remediation-handoff.md) for portability boundaries and handoff evidence. This entrypoint still owns its trigger, routing, evidence, and stop decision.

## Contract
- Make no completion claim without fresh evidence from this session; role-based UAT is not replaced by a broad test command.
- Route unproven causal claims to `debugging-systematically` and requested repairs to `remediating-root-causes`.

## Workflow
- Inventory intended changes and affected user, developer, operator, and maintainer workflows.
- Exercise the reported failing boundary, meaningful unhappy path, regression guard, and relevant diagnostics; record root-cause evidence or evidence limit, escape reason, and future-debugging signal.
- Run narrow-to-broad validation appropriate to the touched surface and identify any untested boundary.

## Stop Condition
- Stop rather than claim completion when the reported path was not exercised, a required check is unavailable, or evidence is stale.

## Deliverable
- Deliver changed paths, role/UAT flows, exact commands/results, regression and diagnostic evidence, remaining gaps, and recovery/rollback scope or `Not applicable — reason`.

## Preserved Portable Original Clauses

---
name: verifying-before-completion
description: "Use after creating changes and before final responses, commits, pushes, PRs, or success claims to run role-based UAT and evidence-backed verification."
metadata:
  governing-skills-placement: user
  governing-skills-reason: Cross-repo self-UAT and evidence-before-claims gate; repo-local
    skills with the same name may override it.
---

# Verifying Before Completion

Use this skill after creating, editing, deleting, generating, staging, or
committing any artifact, and before final responses, success claims, commits,
pushes, PRs, releases, or handoffs.

If the current repo has a repo-local `verifying-before-completion` skill, use
that narrower override for repo-specific commands and standards.



## Non-Negotiable Standard

No completion claim is valid without fresh verification evidence from this
session. UAT means acting as the affected person or system, not only running a
test command.

Always answer these before saying the work is done:

1. What changed?
2. Who or what is affected?
3. What would a real user, developer, operator, or downstream system do next?
4. What proof shows that workflow succeeds and its meaningful failures are
   handled?



## Role Selection

Select every role touched by the change:

- **End user**: product UI, onboarding, settings, exports, billing, account,
  accessibility, loading, empty, error, retry, and recovery states.
- **Developer**: APIs, CLIs, SDKs, docs, examples, generated metadata,
  configuration, migrations, test helpers, install/setup, and local workflows.
- **Operator**: CI, deployment, release, observability, alerts, logs, runbooks,
  migrations, rollback, data retention, and incident response.
- **Maintainer/reviewer**: code readability, architecture boundaries,
  contracts, generated artifacts, and repository hygiene.

If multiple roles apply, validate all of them. Do not collapse user-facing UAT
into developer-only tests.



## Workflow

1. **Inventory the change**
   - Inspect the current status and diff.
   - If the worktree is already clean because changes were committed, inspect
     the just-created commit or branch range instead of treating the inventory
     as empty.
   - List intended behavior, affected files, acceptance criteria, and user or
     developer workflows that should now be possible.
   - Identify pre-existing dirty files so they are not staged or validated as
     your own work.

2. **Build a UAT plan**
   - Choose the narrowest automated regression that proves the changed contract.
   - Choose realistic role-based UAT steps: browser/app interaction, CLI
     invocation, API request, package install, generated artifact check, or
     operator runbook/check.
   - Include meaningful unhappy paths: invalid input, missing permissions,
     empty state, network/upstream failure, retry/timeout, persistence failure,
     stale config, unsupported platform, or concurrency where relevant.

3. **Execute narrow to broad**
   - Run the targeted regression or contract check first.
   - Perform role-based UAT as the affected user/developer/operator.
   - Run broader lint, typecheck, tests, build, hooks, or release checks when
     the touched surface warrants them.
   - Re-run any failed check after fixing the root cause.

4. **Challenge the result**
   - Try to break the changed workflow in at least one realistic way.
   - Verify visible feedback for users and actionable diagnostics for
     developers/operators when failure is possible.
   - Verify docs, examples, metadata, generated files, and downstream references
     are still aligned.

5. **Close with evidence**
   - Record exact commands, UAT flows, artifacts, screenshots/log paths when
     useful, and outcomes.
   - State any untested edge cases, why they were not tested, and the next
     concrete command or owner.
   - If required UAT cannot run, report the work as incomplete or blocked rather
     than done.



## Completion Bar

You may claim completion only when:

- The diff matches the requested scope.
- Relevant regression protection exists or the reason it cannot be automated is
  explicit.
- User/developer/operator UAT for every affected role passed or is explicitly
  blocked.
- Required validation commands passed in this session.
- Remaining risks and untested edge cases are named plainly.

