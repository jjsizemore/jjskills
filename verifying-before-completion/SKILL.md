---
name: verifying-before-completion
description: 'Use after creating changes and before final responses, commits, pushes, PRs, or success claims to run role-based UAT and evidence-backed verification.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable cross-repository workflow; repository-local overrides may add local mechanics.
---

# Verifying Before Completion

Use after creating, editing, deleting, generating, staging, or committing an
artifact, and before final responses, success claims, commits, pushes, PRs,
releases, or handoffs.

If the current repository has a repo-local `verifying-before-completion` skill,
use that narrower override for repository-specific commands and standards.
Apply the shared [portable autonomous completion contract](../references/autonomous-completion-contract.md);
the local skill owns only its trigger, routing, evidence collection, and stop
decision.

## Contract

- Make no completion claim without fresh evidence from this session; role-based
  UAT is not replaced by a broad test command.
- Route unproven causal claims to `debugging-systematically` and requested
  repairs to `remediating-root-causes`.
- If a PR is created or updated, resolve red checks and merge conflicts through
  the repository's monitoring/remediation workflow before completion.

## Workflow

1. **Inventory** — inspect status and diff (or the just-created commit/branch
   range when already committed), acceptance criteria, affected roles, and
   pre-existing dirty files.
2. **Plan UAT** — choose the narrowest regression proof, realistic role-based
   flow, and one meaningful unhappy path for each affected boundary.
3. **Execute narrow to broad** — run targeted checks first, perform user,
   developer, operator, and maintainer UAT as applicable, then broader gates.
4. **Challenge the result** — try to break the changed workflow; verify visible
   recovery/status feedback, actionable diagnostics, and aligned downstream
   docs, metadata, and generated artifacts.
5. **Report** — record exact commands, flows, artifacts, outcomes, evidence
   limits, untested edges, owner, and recovery/rollback or `Not applicable —
   reason`.

## Stop condition

Stop rather than claim completion when the reported path was not exercised, a
required check is unavailable, evidence is stale, or a required role is
blocked. Report `BLOCKED` or `PAUSED` with the contract's human-gated unblock
instructions; never continue or delegate the unblock in the same session.

## Role selection

Select every affected role:

- **End user** — product interaction, loading/empty/error/retry/recovery,
  accessibility, exports, billing, or account flows.
- **Developer** — APIs, CLIs, SDKs, docs, examples, configuration, migrations,
  test helpers, install/setup, and local workflows.
- **Operator** — CI, deployment, release, observability, alerts, runbooks,
  migrations, rollback, retention, and incident response.
- **Maintainer/reviewer** — readability, architecture boundaries, contracts,
  generated artifacts, and repository hygiene.

## Completion bar

Claim completion only when the diff matches scope, regression protection exists
or its absence is explicit, every affected role passed or is explicitly
blocked, required validation passed in this session, and remaining risks are
named plainly.
