---
name: creating-rich-prs
description: 'Use when you want an agent to analyze the current branch and automatically create a high-quality, rich pull request.'
---

# Creating Rich PRs

Use this skill to generate and submit a rich, context-aware pull request for the current local branch using the GitHub CLI (`gh`).

## Guidance

1. **Analyze the Work**: Run `git log` and `git diff` against the base branch to understand the scope and intent of the changes.
2. **Draft the Description**: Structure the PR body with MANDATORY clear sections:
   - **Overview**: A high-level summary of what the PR accomplishes.
   - **Why / Rationale (MANDATORY)**: Explicit explanation of **why** the change was made, the underlying problem being solved, and technical or business motivation. Never submit a PR without a "Why / Rationale" section.
   - **Architectural Decision Record (ADR)**: If an architectural decision was made (changing component boundaries, persistence models, state management, protocols, or trade-offs between alternatives), reference the documented ADR under `docs/architecture/adr/ADR-XXX-<name>.md`. Verify that the ADR contains all four mandatory fields: (1) **decision**, (2) **alternatives considered**, (3) **tradeoffs**, and (4) **rationale**.
   - **Validation/Test Plan**: How the changes were verified locally and how reviewers can test them.
3. **Scope & Splitting**: Keep PRs focused. If unrelated concerns are bundled, split them into separate PRs when independent review benefits; do not force splits for coherent single-assignment deliveries.
4. **Execute**: Create the PR with `gh pr create --title "<title>" --body "<body>"`. Confirm with the user only when material uncertainty remains.
## Handoff: Share the created PR link with the user and verify any follow-up checks.

## References

- [Skill Symlink Registration](references/skill-symlink-registration.md) — SyncVia's `.claude/skills/`, `.codex/skills/`, `.github/skills/` mirror pattern and why to split symlink PRs from skill-content PRs.
