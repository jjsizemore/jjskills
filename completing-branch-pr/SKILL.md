---
name: completing-branch-pr
description: 'Use when verifying, fixing, and finalizing a development branch or pull request before merge or handoff.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: General cross-repo skill; repo-local skills with the same
    name may override it.
---

# Completing Branch Pr

Use this skill when verifying, fixing, and finalizing a development branch or pull request before merge or handoff.

- Confirm the trigger matches the current task before applying this workflow.
- **PR & Commit Rationale Check**: Verify that the PR description and commit messages contain a clear "Why / Rationale" section explaining the technical/business motivation for the changes.
- **ADR Check**: If an architectural decision was made & options/tradeoffs were evaluated, verify that an ADR is present under `docs/architecture/adr/` containing all four required fields: decision, alternatives considered, tradeoffs, and rationale.
- Preserve relevant evidence, commands, paths, and validation results in the final handoff.
- Update this skill with more specific guidance when a repeatable failure mode or workflow detail emerges.
