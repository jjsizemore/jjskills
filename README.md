# jjskills

Git working tree for the **user-scope Agent Skills** install. The live runtime path `~/.agents/skills` is a symlink to this repository so every client that already resolves skills through `~/.agents/skills` uses versioned content.

## Purpose

- Version the full user skill tree (packages, `references/`, category hubs).
- Make installs recoverable (backup + pre-symlink trees, fail-closed rollback).
- Keep day-2 edits reviewable without re-copying trees by hand.

## Layout

```text
~/repos/jjskills/          # git root = skill tree
  README.md .gitignore AGENTS.md
  <skill>/…                # package with SKILL.md
  references/              # shared docs
  <hub>/…                  # category hub with DESCRIPTION.md
  .agents/plans/           # plan + progress (tracked); *_PATH.txt local only
```

## Runtime bind

```text
~/.agents/skills -> ~/repos/jjskills
~/.claude/skills -> ~/.agents/skills
```

Codex/Grok may keep per-skill symlink forests pointing into `~/.agents/skills`.

## Day-2 workflow

1. Edit skill content in this repo (or via the live symlink path).
2. Review with `git status` / `git diff`.
3. Stage **explicit paths** only — **never `git add -A`**.
4. Commit on a branch; open a PR or merge as usual.

### Exclusions (see `.gitignore`)

Tooling and install junk must stay untracked, including:

- `.tokensave/`, `.serena/`, `.headroom/`, `.omc/`
- `.hub/`, `.curator_backups/`, curator state, usage journals
- `__pycache__/`, `.env*`, keys/secrets

### Local-only recovery paths (gitignored)

| File | Role |
| --- | --- |
| `.agents/plans/BACKUP_PATH.txt` | `$HOME`-relative path to full pre-import backup |
| `.agents/plans/PRE_SYMLINK_PATH.txt` | `$HOME`-relative path to tree moved aside at bind |

Do **not** force-add these files. Absolute machine paths must not appear in tracked content.

Secret-scan allowlist (false positives only) lives in `.agents/plans/progress.md` as:

```text
ALLOW secret: <repo-relative-path> — <reason>
SECRET_SCAN_ALLOW_GLOB=!<repo-relative-path>
```

## Fail-closed rollback

### Bind rollback

1. Read `PRE_SYMLINK_PATH.txt` as a `$HOME`-relative path.
2. Confirm `~/.agents/skills` is a symlink and the pre-symlink tree is a real directory with expected canaries.
3. `rm` the symlink and `mv` the pre-symlink tree back.

### Content rollback

1. Prefer fix-forward commits.
2. Otherwise run bind rollback first, then restore skill trees from the backup path with `rsync` that does not touch `.git` or scaffold files.
3. Do not `rm -rf` the repo root.

## Backup retention

Keep `~/.agents/skills.bak-*` and `~/.agents/skills.pre-symlink-*` for **≥7 days** after a green remote proof (`T8_GREEN` in progress).

## Setup plan

Full task sequence and validation gates: [`.agents/plans/user-skills-vcs.md`](.agents/plans/user-skills-vcs.md).
