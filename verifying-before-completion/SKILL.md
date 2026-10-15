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

- Make completion claims only from currently valid source/input-bound evidence
  under the portable contract's invalidators; retained receipts may qualify.
  Role-based UAT is not replaced by a broad test command.
- Route unproven causal claims to `debugging-systematically` and requested
  repairs to `remediating-root-causes`.
- If a PR is created or updated, resolve red checks and merge conflicts through
  the repository's monitoring/remediation workflow before completion.

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

## Completion bar

Claim completion only when ALL of the following are satisfied:

- The diff matches scope, regression protection exists or its absence is explicit, every affected role passed or is explicitly blocked, required validation remains valid under the portable contract's evidence bindings, and remaining risks are named plainly.
- Product code changes are **committed** with semantic message and `Agent:`/`Model:` trailers.
- Changes are **pushed** to the remote branch (or a `local-only` exception is recorded in the work-run ledger with user authorization).
- For product/UI changes, current post-push PR evidence must bind the authorized endpoint; after merge the closed PR and recorded current-head review satisfy this boundary. Attach Gitshot screenshots for affected UI/UX surfaces.
- Docs-only, skill-only, and CI-only changes do not require a PR or screenshots for `VERIFIED`.

If any item is unmet, withhold `VERIFIED` and continue reachable authorized work.
Use `BLOCKED`/`PAUSED` only under the canonical contract's scoped terminal conditions.
