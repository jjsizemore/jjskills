---
name: addressing-pr-comments
description: 'Use when addressing pull request review comments, requested changes, or threaded feedback with local verification and follow-up commits.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable review-response workflow; repository-local overrides may add provider mechanics.
---

# Addressing PR Comments

Use when addressing review comments, requested changes, or threaded feedback.

## Contract

- Retrieve inline threads as well as review-level feedback; a summary PR view
  is not sufficient.
- Verify the current-head claim before changing code. Route unproven causes to
  `debugging-systematically` and repairs to `remediating-root-causes`.

## Workflow

- Capture thread ID, current head, reported boundary, causal evidence or
  evidence limit, escape reason, regression proof, and future-debugging signal.
- Classify each comment as valid, invalid with technical evidence, or needing
  clarification; reply with evidence rather than silently dismissing it.
- Revalidate the changed path on the latest head after every repair.
- Keep scope to the named capability and prefer narrower repository overrides.

## Stop condition

Stop when a comment conflicts with approved behavior or lacks evidence to
safely resolve it. Preserve the exact question or blocker; do not merge,
weaken a test, or delegate an unresolved response.

## Deliverable

Report thread links/IDs, latest-head SHA, response/resolution, exact
commands/results, causal evidence, and recovery/rollback or
`Not applicable — reason`.
