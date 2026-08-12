# AGENTS.md — jjskills

This repository root **is** the user-scope Agent Skills tree.

## Layout

- Each top-level package directory is a skill (`SKILL.md`) or category hub (`DESCRIPTION.md`).
- `references/` holds shared handoff and remediation material.
- `.agents/plans/` holds the setup plan, progress log, and (local-only) recovery path files.

## Runtime bind

Live installs should resolve user skills via:

```text
~/.agents/skills -> ~/repos/jjskills
```

`~/.claude/skills` typically points at `~/.agents/skills`. Codex/Grok may use per-skill links into that tree.

## Day-2 rules

- Never `git add -A` (tooling dirs and local path files must stay out of history).
- Add packages by explicit path or allowlisted directory loops.
- Keep absolute home-directory paths out of tracked content.
- Secret false-positives: reword, or record `ALLOW secret:` + `SECRET_SCAN_ALLOW_GLOB=` in `.agents/plans/progress.md`.

## Local-only files (gitignored)

- `.agents/plans/BACKUP_PATH.txt`
- `.agents/plans/PRE_SYMLINK_PATH.txt`

These store `$HOME`-relative recovery paths for bind/content rollback. Do not force-add them.
