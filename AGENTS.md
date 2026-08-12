# AGENTS.md — jjskills

This repository root **is** the user-scope Agent Skills tree.

## Layout

- `references/` holds shared handoff, remediation, and completion-contract material.
- `references/autonomous-completion-contract.md` is the provider-neutral
  completion boundary; adapters may add proof but may not weaken its fail-closed
  authority, evidence, recovery, ownership, or terminal-state rules.

## Runtime bind

Live installs should resolve user skills via:

```text
~/.agents/skills -> ~/repos/jjskills
```

The target is incomplete unless
`references/autonomous-completion-contract.md` exists. Provider adapters may
add proof, but may not weaken that contract. A temporary alternate checkout is
valid only when the installer explicitly binds it with `JJ_SKILLS_ROOT`.

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
