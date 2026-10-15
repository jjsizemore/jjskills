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

## Contract

- Whenever a PR is created or updated, any merge conflicts or red CI MUST be resolved with `remediating-root-causes` and/or `monitoring-prs-and-autofixing` before the agent can consider its work done.
- Monitor a pull request through hosted checks, review feedback, mergeability, and verified follow-up without assuming a provider-specific command or repository layout.
- Preserve causal evidence and route unclear failures to `debugging-systematically`; route confirmed repairs to `remediating-root-causes` before any fix is pushed.
## Workflow

- Observe current PR head/base, required checks, review threads and mergeability
  once at intake or a decisive event. Classify pending separately from failure.
- Repair only actionable failures: diagnose with `debugging-systematically`,
  then use `remediating-root-causes`; preserve boundary and regression evidence.
- Re-observe affected hosted results after a changed head/base, review/check
  event or repaired conflict—not after every unrelated action.

## Stop Condition

- Finish only when the latest head is mergeable with all required checks green, actionable review threads resolved, and required independent review evidence recorded. Otherwise apply the canonical completion contract's available bounded internal diagnosis/recovery before reporting a genuine permission/external/required-human gate or exhausted dependency; park only affected work.

## Deliverable

- Deliver a latest-head monitoring handoff containing PR state, checks, review-thread outcomes, diagnosis and remediation evidence, validation commands, mergeability, remaining risks, and the owner/action for any blocker.

## Guidance

- Continue owned diagnosis/repair for actionable failures. For pending external
  checks/review, register one watcher under the contract and continue independent work.
- Park only genuinely gated/exhausted dependencies; preserve latest-head proof criteria.
- Preserve relevant evidence, commands, paths, validation results, latest head SHA, and recovery ownership in the handoff.

## Event-driven decisions

| Observed state | Action |
| --- | --- |
| Actionable failed check, valid requested change or conflict | Preserve boundary; diagnose, repair, validate and push/respond. Observe the changed head's required results through the one watcher. |
| Required CI/review still pending | Record WAITING_CI or the exact external review wait, run/head, watcher/owner and decisive event. Reuse unchanged source review; no new triage, duplicate watcher or repeated status request. |
| Current head green, actionable threads resolved, mergeable, required review valid | Return the source-ready handoff; proceed only to the recorded authorized endpoint. |

A new head/base invalidates the affected hosted binding, not automatically all
unchanged local/source proof. Resume on a decisive event rather than unconditional
polling; the contract bounds any final short checkpoint.

## Step 1: Check PR State

Fetch both review-level and inline feedback using the repository's supported provider/API. A summary view alone is not evidence that inline feedback is resolved. Record each failing check, URL, conclusion, open thread, and merge-conflict state.

## Step 2: CI Failure Diagnosis

Reproduce each failing check locally before pushing. Identify the exact failing boundary, check environment differences, diagnose the root cause, make the smallest repair, and rerun equivalent validation. A green rerun is not causal proof.

## Step 3: Review Comment Triage

Use the repository's comment-triage workflow. Implement valid comments, explain invalid comments, and request clarification when a comment changes scope or behavior.

## Step 4: Pushing Fixes

Push only after local validation passes. Stage changed files explicitly, use the repository's semantic commit convention, and preserve the failure boundary and regression proof in the commit/PR evidence.

## Step 5: Post Status Comment

Post a concise status only for a decisive change: PR/head, check/thread outcome,
verified fix/response and exact next action. Retain an unchanged waiting record
without reposting it.

## Step 6: Merge Conflict Resolution

Fetch the target base, resolve conflicts semantically, rerun targeted validation, and push only after the latest head is verified. Escalate ambiguous behavior changes rather than guessing.

## Exit Criteria

- All required hosted checks pass on the latest head.
- No actionable review threads remain.
- The PR is mergeable against its target base.
- Any independent review requirement is separately evidenced rather than inferred from CI.

## Escalation

Apply the canonical completion contract's available bounded internal diagnosis/recovery to discrepancies, conflicts, and owned failures before escalation. Report only a genuine permission/external/required-human gate or exhausted dependency with its exact boundary, last successful state, and recovery owner; preserve independent authorized work and all latest-head proof criteria.
