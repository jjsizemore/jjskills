---
name: maintaining-github-actions
description: 'Use when auditing, debugging, optimizing, or contract-testing GitHub Actions workflows, runners, caches, permissions, or release jobs.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: General cross-repo skill; repo-local skills with the same
    name may override it.
---

# Maintaining Github Actions

Use this skill when auditing, debugging, optimizing, or contract-testing GitHub Actions workflows, runners, caches, permissions, or release jobs.

## Guidance

- Confirm the trigger matches the current task before applying this workflow.
- Keep the work scoped to the named capability and prefer narrower repo-local overrides when present.
- Preserve relevant evidence, commands, paths, and validation results in the final handoff.
- Update this skill with more specific guidance when a repeatable failure mode or workflow detail emerges.

## Env Var Propagation to Deployed Backend

When a feature flag is gated in the backend env schema but the CI release
workflow never writes it into the deployed `.env` file, the flag silently
defaults to `false` in production/staging. See
`references/env-var-propagation.md` for the full debugging recipe and the
env-var → heredoc → contract-test pattern.
