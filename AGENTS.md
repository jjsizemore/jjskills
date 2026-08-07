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

## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues; use the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default five canonical triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repo: read root `CONTEXT.md` and relevant ADRs under `docs/adr/`. See `docs/agents/domain.md`.
