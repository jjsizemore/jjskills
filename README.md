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

## Bootstrap (new machine)

Restores the **shared skill content** and Claude discovery. Commands assume clone at `~/repos/jjskills` (same as layout above). If you use another path, substitute it everywhere below (or set `REPO` and replace `~/repos/jjskills` with `"$REPO"`).

```bash
git clone https://github.com/jjsizemore/jjskills.git ~/repos/jjskills
# or: git clone <your-fork-or-mirror-url> ~/repos/jjskills

mkdir -p ~/.agents
ln -sfn ~/repos/jjskills ~/.agents/skills
ln -sfn ~/.agents/skills ~/.claude/skills

# Secret-scanning hooks (hk + trufflehog + gitleaks)
brew install hk trufflehog gitleaks   # if needed
(cd ~/repos/jjskills && hk install)
```

### Smoke checks

```bash
test "$(readlink ~/.agents/skills)" = "$HOME/repos/jjskills"
test "$(readlink ~/.claude/skills)" = "$HOME/.agents/skills"
test -f ~/.agents/skills/executing-work/SKILL.md
test -f ~/.claude/skills/executing-work/SKILL.md
```

### What this does *not* restore

- **Codex / Grok skill forests** — those clients use many per-skill symlinks under `~/.codex/skills` and `~/.grok/skills` (plus some client-only packages). They are **not** in this repo. After bootstrap, content is available at `~/.agents/skills`; rebuild each client’s forest separately (link selected package names into that tree) if you use those products.
- **Machine-local recovery files** — `BACKUP_PATH.txt` / `PRE_SYMLINK_PATH.txt` are gitignored; they only matter for same-machine bind rollback after a prior live install.
- **Dotfile tooling** under a live install (`.hub/`, curator state, etc.) — intentionally excluded from VCS.

Migration from an existing real `~/.agents/skills` directory (backup, import, first bind) is documented in [`.agents/plans/user-skills-vcs.md`](.agents/plans/user-skills-vcs.md).

## Git hooks (hk + secret scanning)

This repo uses **[hk](https://hk.jdx.dev)** ([jdx/hk](https://github.com/jdx/hk)) for client-side hooks (`hk.pkl`).

**Guards on `pre-commit` and `pre-push`:**

| Step | Tool | Role |
| --- | --- | --- |
| `gitleaks` | [gitleaks](https://github.com/gitleaks/gitleaks) | Pattern scan of staged files |
| `trufflehog` | [TruffleHog](https://github.com/trufflesecurity/trufflehog) | Scan commit delta vs `HEAD` (fail closed, no live verify required) |
| `detect_private_key` | `hk util detect-private-key` | PEM / OpenSSH private keys |
| `check_merge_conflict` | hk util | Conflict markers |

### One-time setup (each clone / machine)

```bash
brew install hk trufflehog gitleaks   # or equivalent
cd ~/repos/jjskills
hk install                            # wires git hooks for this repo
# optional machine-wide: hk install --global  (no-op in repos without hk.pkl)
```

Verify:

```bash
hk validate
hk check                              # run secret steps without committing
```

Bypass only when intentional: `HK=0 git commit …` or `git commit --no-verify` (discouraged).

## Day-2 workflow

1. Edit skill content in this repo (or via the live symlink path).
2. Review with `git status` / `git diff`.
3. Stage **explicit paths** only — **never `git add -A`**.
4. Commit on a branch; open a PR or merge as usual (hooks block secret-looking content).

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
