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

## Contract

- Monitor a pull request through hosted checks, review feedback, mergeability, and verified follow-up without assuming a provider-specific command or repository layout.
- Preserve causal evidence and route unclear failures to `debugging-systematically`; route confirmed repairs to `remediating-root-causes` before any fix is pushed.

## Workflow

- Check the current PR state, classify each failing check or review thread, reproduce failures locally, and preserve the exact failing boundary.
- Use `debugging-systematically` for diagnosis, then use `remediating-root-causes` for the smallest durable fix and regression protection; validate the latest head before responding or pushing.
- Re-check hosted results, review threads, merge conflicts, and independent review evidence after every action, recording commands, paths, SHAs, and remaining blockers.

## Stop Condition

- Stop only when the latest head is mergeable with all required checks green, actionable review threads resolved, and required independent review evidence recorded; otherwise stop at a concrete permission, external-service, conflict, failing-check, or human-decision blocker with its last observed state.

## Deliverable

- Deliver a latest-head monitoring handoff containing PR state, checks, review-thread outcomes, diagnosis and remediation evidence, validation commands, mergeability, remaining risks, and the owner/action for any blocker.

## Guidance

- Continue monitoring until the PR is clean and mergeable: required hosted checks have completed successfully, requested changes are addressed, and the platform reports the PR as mergeable.
- Stop at a concrete permission, external-service, failing-check, conflict, or required-human-review blocker; preserve the exact blocker and last observed state.
- Preserve relevant evidence, commands, paths, validation results, latest head SHA, and recovery ownership in the handoff.

## The Loop

```
REPEAT until PR is mergeable:
  1. CHECK    — get current hosted checks and open review threads
  2. TRIAGE   — classify failures and comments
  3. DIAGNOSE — reproduce failures locally; do not push guesses
  4. FIX      — make the smallest repair and validate locally
  5. RESPOND  — push a verified fix or reply to the thread
  6. REPORT   — record latest-head evidence and remaining blockers
```

Stop when all required checks are green, actionable threads are resolved, and mergeability is confirmed.

## Step 1: Check PR State

Fetch both review-level and inline feedback using the repository's supported provider/API. A summary view alone is not evidence that inline feedback is resolved. Record each failing check, URL, conclusion, open thread, and merge-conflict state.

## Step 2: CI Failure Diagnosis

Reproduce each failing check locally before pushing. Identify the exact failing boundary, check environment differences, diagnose the root cause, make the smallest repair, and rerun equivalent validation. A green rerun is not causal proof.

## Step 3: Review Comment Triage

Use the repository's comment-triage workflow. Implement valid comments, explain invalid comments, and request clarification when a comment changes scope or behavior.

## Step 4: Pushing Fixes

Push only after local validation passes. Stage changed files explicitly, use the repository's semantic commit convention, and preserve the failure boundary and regression proof in the commit/PR evidence.

## Step 5: Post Status Comment

After an action, post a concise status with the PR number, latest head SHA, checks, threads, fix or response, and remaining blocker or mergeability evidence.

## Step 6: Merge Conflict Resolution

Fetch the target base, resolve conflicts semantically, rerun targeted validation, and push only after the latest head is verified. Escalate ambiguous behavior changes rather than guessing.

## Exit Criteria

- All required hosted checks pass on the latest head.
- No actionable review threads remain.
- The PR is mergeable against its target base.
- Any independent review requirement is separately evidenced rather than inferred from CI.

## Escalation

Stop at an unexplained local/hosted discrepancy, scope conflict, unresolved external dependency, permission boundary, or required human decision. Report the exact blocker, last successful state, and recovery owner.
