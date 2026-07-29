---
name: addressing-pr-comments
description: 'Use when addressing pull request review comments, requested changes, or threaded GitHub feedback with local verification and follow-up commits.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable cross-repository workflow; repository-local overrides may add local mechanics.
---

# Addressing Pr Comments

Use when addressing pull request review comments, requested changes, or threaded GitHub feedback with local verification and follow-up commits.

## Portable Compatibility
- Confirm the trigger matches, then use [the shared remediation handoff](../references/remediation-handoff.md) for portability boundaries and handoff evidence. This entrypoint still owns its trigger, routing, evidence, and stop decision.

## Contract
- Retrieve inline review threads as well as review-level feedback; do not rely solely on a summary PR view.
- Verify the current-head claim before changing code; route unproven causes to `debugging-systematically` and repairs to `remediating-root-causes`.

## Workflow
- Capture the thread identifier, current head, reported failing boundary, causal evidence or evidence limit, escape reason, regression proof, and future-debugging signal.
- Classify each comment as valid, invalid with technical evidence, or needing clarification; reply with the evidence rather than silently dismissing it.
- Revalidate the changed path on the latest head after a repair.

## Stop Condition
- Stop when a comment conflicts with the approved behavior or lacks enough evidence to safely resolve; preserve the exact question or blocker.

## Deliverable
- Deliver thread links/IDs, latest-head SHA, response or resolution, commands/results, causal evidence, and recovery/rollback scope or `Not applicable — reason`.

## Preserved Portable Original Clauses

---
name: addressing-pr-comments
description: 'Use when addressing pull request review comments, requested changes, or threaded GitHub feedback with local verification and follow-up commits.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: General cross-repo skill; repo-local skills with the same
    name may override it.
---

# Addressing Pr Comments

Use this skill when addressing pull request review comments, requested changes, or threaded GitHub feedback with local verification and follow-up commits.



## Guidance

- Confirm the trigger matches the current task before applying this workflow.
- Keep the work scoped to the named capability and prefer narrower repo-local overrides when present.
- Preserve relevant evidence, commands, paths, and validation results in the final handoff.
- Do not rely solely on `gh pr view` or `gh pr checks` to determine if a PR has unresolved feedback, as they do not expose inline review threads.
- Always use `gh api /repos/{owner}/{repo}/pulls/{pr_number}/comments` or `gh api graphql` to fetch inline review threads and ensure no unresolved comments are missed.
- Update this skill with more specific guidance when a repeatable failure mode or workflow detail emerges.

