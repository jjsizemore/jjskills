---
name: verifying-before-completion
description: 'Use when collecting risk-scaled boundary and role evidence before completion claims or an applicable delivery action.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable cross-repository workflow; repository-local overrides may add local mechanics.
---

# Verifying Before Completion

Collect the affected boundary and role evidence needed by the current task or
delivery owner. Reuse valid evidence; an unchanged administrative milestone does
not require another verification pass.

If the current repository has a repo-local `verifying-before-completion` skill,
use that narrower override for repository-specific commands and standards.
Apply the shared [portable autonomous completion contract](../references/autonomous-completion-contract.md);
the local skill owns only its trigger, routing, evidence collection, and stop
decision.

## Contract

- Make completion claims only from currently valid source/input-bound evidence
  under the portable contract's invalidators; retained receipts may qualify.
  Role-based UAT is not replaced by a broad test command.
- Route unproven causal claims to `debugging-systematically` and requested
  repairs to `remediating-root-causes`.
- If a PR is created or updated, resolve red checks and merge conflicts through
  the repository's monitoring/remediation workflow before completion.
- Apply the portable contract's action/resource/effect boundary before release
  or reduced-gate actuation. Source work establishing prerequisites remains
  eligible within its authority; non-release scope needs an explicit applicability
  reason. High-impact surfaces retain their affected checks and review.
- Apply the portable contract for review: mechanical work needs deterministic
  checks; behavior work needs one capable independent review. Advisory findings
  are nonblocking; review convergence is bound to three rounds for an unchanged
  strategy.

## Workflow

1. **Inventory** — reuse the consolidated scope/dirty/owner preflight until a
   specific invalidator changes an affected fact.
2. **Select risk proof** — mechanical: deterministic checks, no mandatory review;
   behavior: targeted regression, affected checks, changed-path smoke and one
   currently valid independent review; high-impact: add identified material-risk checks.
   Authority/CI-lifecycle text is not mechanical just because it is Markdown.
3. **Execute** — exercise the actual changed boundary and applicable roles.
   Do not add every repository suite or unrelated runtime/host UAT by default.
4. **Challenge the result** — try to break the changed workflow; verify visible
   recovery/status feedback, actionable diagnostics, and aligned downstream
   docs, metadata, and generated artifacts.
5. **Report** — record exact commands, flows, artifacts, outcomes, evidence
   limits, untested edges, owner, and recovery/rollback or `Not applicable —
   reason`.

## Stop condition

Withhold completion for unexercised paths, invalid/missing required proof or failed
checks. Apply the portable contract's recovery, dependency/watcher and terminal
rules; this leaf returns role evidence or its exact scoped blocker, not whole-run
completion or permission for gated retries.

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

## Leaf handoff

Return the affected boundaries, exact source/input bindings, commands/results,
applicable role outcomes, remaining proof and its owner. A pending check under an
existing watcher is a dependency, not a failed verification or a reason to start
another watcher.

The existing task/delivery owner applies the recorded endpoint and
[closing-repo-work](../closing-repo-work/SKILL.md) when delivery is in scope.
This leaf does not restart commit/push/PR/deployment, create a run or ledger,
request another approval, or declare whole-run completion. For explicit local-only
work, return the requested local proof without introducing publication steps.
