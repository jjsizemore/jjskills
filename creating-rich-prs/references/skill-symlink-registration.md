# Skill Symlink Registration (SyncVia Pattern)

## Context

SyncVia uses a centralized skill hub at `.agents/skills/` with tool-specific compatibility symlinks in:
- `.claude/skills/<name>` → `../../.agents/skills/<name>`
- `.codex/skills/<name>` → `../../.agents/skills/<name>`
- `.github/skills/<name>` → `../../.agents/skills/<name>`

When adding new skills or renaming existing ones, the symlink registration is a separate infrastructure concern from the skill content itself.

## Why Split

- **Narrow review**: Symlink registration is mechanical; reviewers just need to verify the target exists and the link is correct.
- **Independent revertability**: If a skill rename causes discovery issues, reverting just the symlink PR doesn't touch the content.
- **Clear intent**: A PR titled "register repo mirror symlinks" tells reviewers exactly what to expect.

## How to Identify a Symlink-Only Diff

From a branch with bundled skill + symlink changes:

```bash
# Find newly added symlink files
git diff <base>...HEAD --diff-filter=A --name-only -- \
  .claude/skills .codex/skills .github/skills
```

Then open these as a separate PR before the main skill-content PR.

## Sync Script

`scripts/sync-agent-skill-symlinks.mjs` manages these symlinks and enforces scoping rules:
- Repo-level links validate against repo `.agents/skills`
- Home-level links validate against `~/.agents/skills`
- The `--scope repo` flag restricts checks to repo-local mirrors

## Common Pitfall

Bundling symlink creation into a skill-content PR (e.g., adding `.claude/skills/<name>` alongside a 30-line SKILL.md + validation script diff) buries the infra change. Always check `git diff --diff-filter=A` for new entries in `.claude/skills/`, `.codex/skills/`, `.github/skills/` and split them out.
