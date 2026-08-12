---
name: closing-repo-work
description: 'Use when working in the SyncVia repo to sequence repository-changing delivery closeout from pre-commit evidence through merge and applicable post-merge proof; not for planning-only or leaf-only work.'
---

# Repository Closeout Controller (SyncVia)

## Scope

Use this controller for repository-changing delivery: product code, tests, docs,
Skills, prompts, CI, hooks, metadata, or self-healing changes. Read-only
investigation, planning-only work, and explicitly requested local-only work do
not enter this lifecycle.

## Controller Interface

`closing-repo-work` is the sole sequencing controller. It accepts the repository
intent, acceptance/todo coverage, immutable intended diff, current phase, and
applicability result; it produces phase-bound evidence or a `VERIFIED`,
`BLOCKED`, or `PAUSED` terminal report. It does not replace leaf ownership or
invent evidence.

<!-- skill-governance: owner=closing-repo-work; role=controller; rule=phase-aware-repository-closeout -->

This controller MUST stop phase progression when the checked-in evidence
validator rejects required identity, proof, or classifier bindings.

<!-- /skill-governance -->

Use `scripts/closeout-evidence-validator.mjs` with the checked-in
`contracts/closeout-evidence.schema.json` and applicability result. Preserve
the immutable `baseSha`, `subjectHeadSha`, and normalized diff digest through
every phase.

## Pre-commit evidence

Require `pre_commit` evidence for the current head: intent, acceptance/todo
coverage, focused intended diff, and applicable replayable TDD or contract
evidence. The evidence records its command output and immutable checkpoint
binding; it never derives expected behavior from production logic.

## Pre-push evidence

Require `pre_push` evidence for the current head: focused commits, a clean
intended diff, and passing local gates. Inspect the exact staged and intended
paths before any publish action so unrelated work cannot enter the delivery.

## Post-push and post-PR evidence

Require the carrier SHA, local-gate evidence, and tracked artifact after push.
After PR creation, bind the PR URL, base SHA, and latest head SHA to that same
immutable delivery record. Missing artifact, stale head, or ambiguous evidence
selection remains blocked.

## Pre-merge evidence

Whenever a PR is created or updated, any merge conflicts or red CI MUST be
resolved with `remediating-root-causes` and/or `monitoring-prs-and-autofixing`
before the agent can consider its work done. Hand off review and mergeability
evaluation to `completing-branch-pr`, then post-PR CI and thread monitoring to
`monitoring-prs-and-autofixing`. Require latest-head remote CI, configured review,
zero unresolved threads, mergeability, and closed or not-needed remediation
before scheduling automerge. A requested merge is not merge evidence.

## Post-merge evidence

Require an actual merge SHA from GitHub. Hand deployment/runtime proof to
`closing-deployment-pipelines` and role-based verification to
`verifying-before-completion`. When applicable, bind the deployed SHA/runtime
version and smoke/manual UAT artifacts to the actual merge SHA. A gate may be
`not_applicable` only with the independent classifier's bound reason and digest.

## Terminal evidence

Run the terminal phase only after actual merge and all applicable pre- and
post-merge evidence are present. `WORK_RUN_COMPLETE`, `MERGE READY`, and similar
markers remain nonterminal until the terminal validator passes.

Missing, stale, pending, or failed required evidence blocks the phase and terminal completion.

## Leaf Handoffs

| Capability                     | Owning leaf                                               | Controller action                                     |
| ------------------------------ | --------------------------------------------------------- | ----------------------------------------------------- |
| Replayable RED/GREEN evidence  | `developing-with-tests`                                   | Require its phase-bound result.                       |
| Role-based UAT and local proof | `verifying-before-completion`                             | Require applicable validation artifacts.              |
| Review and mergeability        | `completing-branch-pr`                                    | Require latest-head review and mergeability evidence. |
| Hosted PR monitoring           | `monitoring-prs-and-autofixing`                           | Require green CI and resolved threads.                |
| Deployment and runtime proof   | `closing-deployment-pipelines`                            | Require expected SHA, runtime, and release artifacts. |
| Owned failure repair           | `debugging-systematically` then `remediating-root-causes` | Require diagnosis, repair, and revalidation.          |

Do not duplicate a leaf's procedure, mutate `~/.agents`, or treat pending
hosted checks, inaccessible providers, requested automerge, or a healthy
unversioned endpoint as completion.

## Output

Report the current phase, immutable SHA/diff bindings, applicable evidence,
leaf handoffs, failing boundary or external owner when blocked, and rollback or
recovery route. Terminal reports use only `VERIFIED`, `BLOCKED`, or `PAUSED`.
