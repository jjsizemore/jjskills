---
name: refining-prs-iteratively
description: Use when an existing pull request must be refined until latest-head reviews, mergeability, checks, and review threads are clean.
---

# Refining PRs Iteratively

Use this as the PR refinement outer loop: monitor live state, route blockers to
narrower skills, request antagonistic latest-head review, and stop only when the
current head is proven clean.

## Required Sub-Skills

- **REQUIRED:** `receiving-code-review` for comments, unresolved threads,
  Copilot suggestions, or human feedback.
- **REQUIRED:** `resolving-pr-merge-conflicts` for conflicts, non-mergeable
  state, or base/head drift.
- **REQUIRED:** `requesting-code-review` for each fresh antagonistic latest-head
  review.
- Prefer narrower repo-local overrides, but keep this skill as loop controller
  unless the repo-local skill explicitly replaces it.

## Loop

1. Refresh live GitHub state: base/head, head SHA, mergeability, review
   decision, unresolved threads/comments, checks, drift, and local status.
   Minimum CLI surface: `gh pr view <PR> --json baseRefName,headRefName,headRefOid,mergeable,mergeStateStatus,reviewDecision,statusCheckRollup,latestReviews,reviews,comments`.
   Use `gh pr checks <PR> --watch` as the normal pending-check monitor. Use
   GitHub API/GraphQL or repo tooling for unresolved review-thread state; do not
   infer it from `latestReviews` alone.
2. Route blockers:
   - Conflict, non-mergeable state, or stale base:
     `resolving-pr-merge-conflicts`.
   - Review, unresolved thread, Copilot suggestion, or human comment:
     `receiving-code-review`.
   - Failed check: reproduce the first concrete failure locally, fix, validate.
   - Pending check: watch with the repo's normal monitor; if it cannot reach a
     conclusion, report a pending blocker. Pending is not clean.
3. After any fix, response, conflict resolution, or push, restart on the new
   head SHA.
4. When no live blockers remain, run `requesting-code-review` for antagonistic
   latest-head review. If it finds issues, restart.

## Stop Condition

Stop only when all are true on the current PR head SHA:

- PR is mergeable and not blocked by conflicts.
- No unresolved actionable threads or latest-head comments remain.
- Required checks pass; none are pending.
- At least two independent latest-head antagonistic review passes found no
  blocking or advisory issues, unless the user accepts a documented reviewer
  availability limitation.
- Rejected review items have PR-visible technical responses with provenance.
- Final handoff records PR number, head SHA, reviews, checks, merge state,
  commits pushed, and validation commands.

## Definitions

- **Independent reviewer/provider:** distinct source, such as human, GitHub
  Copilot, `code-review-syncvia`, or an external CLI agent
  (`using-opencode-cli`, `using-claude-cli-agent`, `using-codex-cli-agent`,
  `using-antigravity-agy-cli`). Independence comes from a different model, not
  just a different CLI. Same reviewer or same model rerun twice does not count.
- **Actionable feedback:** requests or implies code, test, docs, behavior,
  release, security, or architecture change, or needs technical rejection.
- **Provenance:** agent, model, PR number, comment/review ID when available,
  current head SHA, and resolving commit SHA.
- **Validation:** narrowest relevant test first, then repo closeout gates. In
  SyncVia code-changing passes, satisfy applicable `pnpm typecheck`,
  `pnpm lint`, `pnpm test`, and `pnpm exec lefthook run pre-commit`.
- **Unreproducible failed check:** document exact check, local command, blocker,
  and evidence. Do not call clean until resolved or user-accepted.
- **Unavailable second reviewer:** if no second independent review source exists
  and the user does not accept that limitation, report a blocker. Do not call
  clean.

## Antagonistic Review Prompt

Ask reviewers to treat the latest head as a merge gate and look for reasons not
to merge: correctness bugs, architecture violations, missing tests, stale docs,
release/CI risk, drift, unresolved feedback, and unhappy paths. Classify
findings as Blocking, Advisory, or No issue.

Provide PR number, base SHA, head SHA, changed surfaces, validation already run,
and known rejected/deferred feedback. For GitHub PRs, follow
`requesting-code-review` and post required review output to the PR; for inline
feedback, follow `receiving-code-review` and reply in-thread.

## Red Flags

- Stopping after one feedback batch without re-fetching live state.
- Treating old clean reviews as valid after a new push.
- Calling clean while checks are pending or mergeability is unknown.
- Requesting review before resolving known conflicts or failed checks.
- Counting the same reviewer twice as independent coverage.
