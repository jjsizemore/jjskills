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

Apply the shared [portable autonomous completion contract](../references/autonomous-completion-contract.md) for evidence invalidators, review requirements, and terminal rules. Repo-local overrides add local commands and standards.

## Core Rules

- Make completion claims only from currently valid source/input-bound evidence.
- Scale proof to change risk: mechanical changes need deterministic checks; behavior changes need targeted regression, affected checks, changed-path smoke, and one capable independent review.
- Route unproven causal claims to `debugging-systematically` and confirmed repairs to `remediating-root-causes`.
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

## Completion Bar

Claim completion only when:
1. The diff matches assigned scope without collateral changes.
2. Focused regression coverage exists for behavior changes.
3. Affected roles pass verification (or are documented `Not applicable — reason`).
4. All required validation passes and binds the current head diff.
5. For PR/merge/deploy endpoints, the required hosted/artifact proof is recorded per the completion contract.

Withhold completion for unexercised paths or failed checks; report exact blocker and owner.
