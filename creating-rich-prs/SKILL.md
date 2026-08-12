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
3. **Split-Out PRs (related-but-distinct work)**: When a branch bundles multiple concerns (e.g., skill content + skill symlink registrations, or infra + docs), open a separate PR for the splittable slice rather than lumping it into a larger bundle.
   - **Typical pattern**: A branch adds new domain skills (SKILL.md files + validation logic) **and** also adds repo-mirror compat symlinks (`.claude/skills/<name>` → `../../.agents/skills/<name>`, same for `.codex/skills/` and `.github/skills/`). The symlink registration is a focused infrastructure change that deserves its own PR — it has a narrow scope, distinct review concerns, and can be reviewed independently from the skill content.
   - **Why**: Bundling symlinks into a content PR obscures the infra change, makes it harder to revert just the sync links if something breaks, and prevents the PR description from explaining the symlink strategy clearly.
   - **How**: Before opening the main PR, branch off from the base, `git checkout --` only the symlink files (`git diff <base>...HEAD --diff-filter=A --name-only -- .claude/skills .codex/skills .github/skills`), apply them, write a focused title like `chore(skills): register repo mirror symlinks for new skills`, and `gh pr create` with that narrow scope. Then rebase the main PR to exclude those files.
4. **Review with User**: Present the drafted title and description to the user for any final tweaks or confirmation.
4. **Execute**: Once approved, use the terminal to run `gh pr create --title "<title>" --body "<body>"` (or use the web prompt `gh pr create --web` if the user prefers editing in the browser).
## Handoff: Share the created PR link with the user and verify any follow-up checks.

## References

- [Skill Symlink Registration](references/skill-symlink-registration.md) — SyncVia's `.claude/skills/`, `.codex/skills/`, `.github/skills/` mirror pattern and why to split symlink PRs from skill-content PRs.
