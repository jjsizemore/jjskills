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

## Persistent response defaults

Apply these defaults in every session and repository:

- **i-have-adhd:** lead with the next action; number multi-step work; suppress
  tangents; use concrete estimates; show completed progress; end with one
  concrete next action. Keep active until the user says `stop adhd mode` or
  `normal mode`.
- **ponytail:** on coding, debugging, design, and review tasks, use full
  intensity: question whether the work needs to exist, reuse existing code,
  prefer stdlib/native features, delete before adding, avoid speculative
  abstractions, and make the smallest correct change. Keep active until the
  user says `stop ponytail` or `normal mode`.

These are persistent defaults, not replacements for the full installed skills.
