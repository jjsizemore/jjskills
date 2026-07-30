# Plan: jjskills as VCS for user-scope skills

**Version:** v5  
**Date:** 2026-07-28  
**Owner:** jermaine (local machine)  
**Repo:** `$HOME/repos/jjskills` → `https://github.com/jjsizemore/jjskills`  
**Status:** PLAN_CONSENSUS_REACHED (actionable review clean on v5)

## Goal

Make `jjskills` the **git working tree** for the full user-scope Agent Skills install, and bind the live runtime path `~/.agents/skills` to that tree via symlink so every agent that already resolves user skills through `~/.agents/skills` automatically uses versioned content.

## Non-goals

- Not re-authoring or consolidating individual skills in this run.
- Not changing repo-local skill governance in other projects (SyncVia `.agents/skills`, etc.).
- Not migrating Codex/Grok per-skill symlink forests.
- Not building a skill marketplace, curator hub, or publish pipeline beyond a usable git repo + install bind.
- Not deleting third-party/vendor skill packages from the live install.
- Not relicensing third-party skill text (keep any `LICENSE*` files on import).

## Prerequisites (fail before work)

```bash
command -v git >/dev/null
command -v rsync >/dev/null
command -v rg >/dev/null
```

All executable snippets in this plan are **POSIX/`zsh`-safe** (no `mapfile`, no `compgen`). Prefer running under `zsh` or `bash` with the listed tools only. Define **Shared helpers** (H1–H5) in the shell session before T4–T8 / rollback.

## Decisions (locked or defaulted)

| Decision | Choice | Reason |
| --- | --- | --- |
| Runtime bind | `~/.agents/skills` → `~/repos/jjskills` (symlink) | User grill choice |
| Layout | Skill dirs at repo root | Matches live install shape |
| Import scope | All packages (live count) + `references/` + category hubs | User grill choice |
| Visibility | Stay public | Default after declined re-ask |
| Path scrub | No real home paths (`/Users/<alnum…>`) in git-tracked content; plan prose uses `/Users/<user>` placeholders only | Public repo; scan-driven |
| Local path files | `BACKUP_PATH.txt` / `PRE_SYMLINK_PATH.txt` store **`$HOME`-relative** paths only; **gitignored** | Review v4 path leak |
| Secret allowlist | `progress.md`: `ALLOW secret:` + one `SECRET_SCAN_ALLOW_GLOB=` per path | Replay without eval of free-form CMD |
| README ownership | US-001 complete; later stories proof/push only | Review v1 |
| Discovery | One resolvable Codex + one Grok `SKILL.md` | Both clients used |
| Backup retention | Keep bak + pre-symlink ≥7 days after green T8 | Safety over disk |
| Progress log | `.agents/plans/progress.md` only; **no absolute home-directory paths** | Single durable path |
| **Re-entry matrix** | See below | Review v3 questions |

### Re-entry matrix (single policy)

| State of `~/.agents/skills` | T2 backup | T3 import | T4 scrub | T5 commit | T6 bind |
| --- | --- | --- | --- | --- | --- |
| Real directory (first run) | Required | Required | Required | Required | Required |
| Symlink → `$HOME/repos/jjskills` (correct) | Skip backup; record ALREADY_BOUND; **ensure `SRC_COUNT.txt`** (recompute if missing) | Import N/A (tree is the repo) | Re-run if content dirty | Commit if dirty; branch create-or-checkout | Validate only |
| Symlink → **other** target | **Abort** with message; do not `cp -a` the symlink; operator must restore a real dir from an old bak or fix manually | — | — | — | — |
| Missing path | Abort | — | — | — | — |

**Wrong-target symlink:** abort only (no auto-replace). Operator restores a real directory, then restart from T2.

**Re-import (real dir still present, repo already has skills):** allowed; use inventory + optional `rsync --delete` only for package/hub names listed from source (never delete `.git`, scaffold, `.agents`). Prefer first-run clean import; document if re-import used.

**Branch re-entry:** T5 uses create-or-checkout of `setup/user-skills-vcs` (never fails solely because the branch already exists).

## Current state (facts)

- Repo: `README.md` on `main` (`3526869`); untracked `.headroom/`, `.serena/`, `.tokensave/`.
- Live: real `~/.agents/skills` (~8.2M), not a git repo; ~139 `SKILL.md` at maxdepth 2.
- `~/.claude/skills` → `~/.agents/skills`; Codex/Grok per-skill links into that tree.

## Target end state

```text
~/repos/jjskills/          # git root
  README.md .gitignore AGENTS.md
  <skill>/…  references/  <hub>/…
  .agents/plans/           # plan + progress tracked; *_PATH.txt local only

~/.agents/skills -> ~/repos/jjskills
~/.claude/skills -> ~/.agents/skills
```

## Shared helpers

### H1 — `rg_no_matches` (fail closed)

```bash
rg_no_matches() {
  rg "$@"
  ec=$?
  if [ "$ec" -eq 0 ]; then
    echo "FAIL: unexpected matches" >&2
    return 1
  fi
  if [ "$ec" -ne 1 ]; then
    echo "FAIL: rg error exit=$ec" >&2
    return "$ec"
  fi
  return 0
}
```

### H2 — junk not tracked (local or remote name list)

```bash
assert_no_junk_paths() {
  # $1 = file listing one path per line (git ls-files or ls-tree output)
  rg_no_matches -n 'curator_backups|\.hub/|__pycache__|\.pyc$|\.env$' "$1"
}
```

### H3 — tracked SKILL.md count

```bash
tracked_skill_count() {
  git ls-files | rg '(^|/)SKILL\.md$' | wc -l | tr -d ' '
}
```

### H4 — resolve `$HOME`-relative local path file (fail closed)

```bash
resolve_home_rel_path() {
  # $1 = path to file containing one relative path under $HOME (no absolute, no ..)
  rel=$(cat "$1")
  case "$rel" in
    ""|*..*|/*)
      echo "FAIL: invalid path file $1 (need single \$HOME-relative line)" >&2
      return 1
      ;;
  esac
  # single line only
  printf '%s' "$rel" | rg -q '[[:space:]]' && {
    echo "FAIL: path file must be one token without whitespace: $1" >&2
    return 1
  }
  printf '%s\n' "$HOME/$rel"
}
```

### H5 — secret scan (canonical; T4 + T8)

```bash
secret_scan() {
  # Uses $repo; reads zero or more SECRET_SCAN_ALLOW_GLOB= lines from progress.md
  # Each value is a single rg --glob pattern (e.g. '!some/path/**')
  repo="${repo:-$HOME/repos/jjskills}"
  set --
  if [ -f "$repo/.agents/plans/progress.md" ]; then
    while IFS= read -r line || [ -n "$line" ]; do
      case "$line" in
        SECRET_SCAN_ALLOW_GLOB=*)
          g=${line#SECRET_SCAN_ALLOW_GLOB=}
          set -- "$@" --glob "$g"
          ;;
      esac
    done < "$repo/.agents/plans/progress.md"
  fi
  rg_no_matches -n --hidden \
    -e 'BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY' \
    -e 'AKIA[0-9A-Z]{16}' \
    -e 'ghp_[A-Za-z0-9]{20,}' \
    -e 'xox[baprs]-[A-Za-z0-9-]{10,}' \
    "$repo" \
    --glob '!.git/**' \
    --glob '!.agents/plans/**' \
    --glob '!.tokensave/**' \
    --glob '!.serena/**' \
    --glob '!.headroom/**' \
    --glob '!.omc/**' \
    "$@"
}
```

## Implementation tasks

### T0 — Plans directory

```bash
repo="$HOME/repos/jjskills"
mkdir -p "$repo/.agents/plans"
: >> "$repo/.agents/plans/progress.md"
```

### T1 — Scaffold

**Files:** `.gitignore`, `README.md` (complete), `AGENTS.md`.

`.gitignore` contents:

```gitignore
.tokensave/
.serena/
.headroom/
.omc/
.DS_Store
.hub/
.curator_backups/
.curator_state
.bundled_manifest
.global-skill-*
.usage.json
.usage.json.lock
__pycache__/
*.py[cod]
*$py.class
.env
.env.*
*.pem
*.key
.secrets/
# Local-only recovery paths (never publish absolute machine paths)
.agents/plans/BACKUP_PATH.txt
.agents/plans/PRE_SYMLINK_PATH.txt
```

`README.md` must include: purpose, layout, bind, day-2 (never `git add -A`), exclusions, fail-closed rollback, backup retention, pointer to `.agents/plans/progress.md` for secret allowlist, note that `*_PATH.txt` are local-only.

`AGENTS.md`: repo root is the user skill tree.

**Validate:**

```bash
cd "$repo"
set -e
# each probe must be ignored (multi-path check-ignore can mask failures)
for p in .tokensave/ .hub/ .curator_backups/ __pycache__/ .env \
  .agents/plans/BACKUP_PATH.txt .agents/plans/PRE_SYMLINK_PATH.txt
do
  git check-ignore -v "$p" || {
    echo "FAIL: not ignored: $p" >&2
    exit 1
  }
done
```

### T2 — Backup (real directory only)

```bash
set -e
agents="$HOME/.agents/skills"
repo="$HOME/repos/jjskills"
mkdir -p "$repo/.agents/plans"

if [ ! -e "$agents" ]; then
  echo "FAIL: ~/.agents/skills missing" >&2
  exit 1
fi

ensure_src_count() {
  if [ ! -f "$repo/.agents/plans/SRC_COUNT.txt" ]; then
    n=$(find "$repo" -maxdepth 2 -name SKILL.md | wc -l | tr -d ' ')
    printf '%s\n' "$n" > "$repo/.agents/plans/SRC_COUNT.txt"
    echo "SRC_COUNT recomputed=$n" | tee -a "$repo/.agents/plans/progress.md"
  fi
}

if [ -L "$agents" ]; then
  target=$(readlink "$agents")
  if [ "$target" = "$repo" ]; then
    echo "ALREADY_BOUND correct" | tee -a "$repo/.agents/plans/progress.md"
    ensure_src_count
    exit 0
  fi
  echo "FAIL: ~/.agents/skills symlink to unexpected target: $target" >&2
  echo "Restore a real directory, then restart from T2. No auto-replace." >&2
  exit 1
fi

ts=$(date -u +%Y%m%dT%H%M%SZ)
# $HOME-relative only (never write expanded home paths into notes)
rel_backup=".agents/skills.bak-${ts}"
backup="$HOME/$rel_backup"
cp -a "$agents" "$backup"
printf '%s\n' "$rel_backup" > "$repo/.agents/plans/BACKUP_PATH.txt"
size=$(du -sh "$backup" | awk '{print $1}')
echo "BACKUP name=$rel_backup size=$size" | tee -a "$repo/.agents/plans/progress.md"
test -f "$backup/executing-work/SKILL.md"
```

### T3 — Import full trees

Skip if already correctly bound (working tree **is** the install).

```bash
set -e
src="$HOME/.agents/skills"
repo="$HOME/repos/jjskills"
test -d "$src" && test ! -L "$src"

src_count=$(find "$src" -maxdepth 2 -name SKILL.md | wc -l | tr -d ' ')
printf '%s\n' "$src_count" > "$repo/.agents/plans/SRC_COUNT.txt"

rsync -a \
  --exclude='.*' \
  --exclude='__pycache__' \
  --exclude='*.py[cod]' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='*.pem' \
  --exclude='README.md' \
  --exclude='AGENTS.md' \
  --exclude='.gitignore' \
  "$src/" "$repo/"

# First-run: no --delete. Re-import (optional): only after listing source
# top-level package/hub names and deleting dest dirs not in that list
# (never delete .git, .agents, scaffold files). Record re-import in progress.md.

# Inventory: fail on unexpected top-level entries
cd "$repo"
for entry in *; do
  [ -e "$entry" ] || continue
  if [ -d "$entry" ]; then
    if [ "$entry" = "references" ]; then continue; fi
    if [ -f "$entry/SKILL.md" ] || [ -f "$entry/DESCRIPTION.md" ]; then continue; fi
    echo "FAIL: unexpected top-level dir: $entry" >&2
    exit 1
  fi
  case "$entry" in
    README.md|AGENTS.md|LICENSE|LICENSE.md|LICENSE.txt) continue ;;
    *) echo "FAIL: unexpected top-level file: $entry" >&2; exit 1 ;;
  esac
done

test ! -e "$repo/.hub"
test ! -e "$repo/.curator_backups"
test -z "$(find "$repo" -type d -name __pycache__ -print -quit)"

dst_count=$(find "$repo" -maxdepth 2 -name SKILL.md | wc -l | tr -d ' ')
test "$src_count" -eq "$dst_count"

test -f "$repo/executing-work/SKILL.md"
test -f "$repo/references/remediation-handoff.md"
test -f "$repo/productivity/DESCRIPTION.md" || test -f "$repo/mlops/DESCRIPTION.md"
diff -rq "$src/executing-work" "$repo/executing-work"
test -f "$repo/README.md" && test -f "$repo/.gitignore"
```

### T4 — Path scrub + secret scan

Require H1 + H5 loaded. Path scrub covers the skill tree + plans. Pattern matches real macOS homes (Users directory + alnum username) but not plan placeholders (`/Users/<user>`) or the character-class form of the regex itself. Explicit globs match `.gitignore` tooling dirs (rg also respects `.gitignore` once T1 wrote it).

```bash
set -e
repo="$HOME/repos/jjskills"

# Path scrub: real home dirs only (macOS Users or Linux home + alnum username)
PATH_SCRUB_RE='/Users/[A-Za-z0-9._-]+|/home/[A-Za-z0-9._-]+'
rg_no_matches -n "$PATH_SCRUB_RE" "$repo" \
  --glob '!.git/**' \
  --glob '!.tokensave/**' \
  --glob '!.serena/**' \
  --glob '!.headroom/**' \
  --glob '!.omc/**'

# Secret scan via H5 (same function T8 calls)
# On false positive: reword the file, OR:
#   echo 'ALLOW secret: <repo-relative-path> — <reason>' >> .agents/plans/progress.md
#   echo 'SECRET_SCAN_ALLOW_GLOB=!<repo-relative-path>' >> .agents/plans/progress.md
#   # use rg glob semantics; prefer '!path/to/file' or '!path/to/dir/**'
# then re-run secret_scan until clean.
secret_scan

echo "SECRET_SCAN_OK via H5" | tee -a "$repo/.agents/plans/progress.md"
```

Do **not** record free-form `SECRET_SCAN_CMD=` (eval hazard). Allowlist is data-only (`SECRET_SCAN_ALLOW_GLOB=` lines).

### T5 — Commit full package trees

```bash
set -e
cd "$HOME/repos/jjskills"

if git show-ref --verify --quiet refs/heads/setup/user-skills-vcs; then
  git checkout setup/user-skills-vcs
else
  git checkout -b setup/user-skills-vcs
fi

git add -- .gitignore README.md AGENTS.md
# scaffold commit may be empty on re-entry if already committed — allow skip
if ! git diff --cached --quiet; then
  git commit -m "chore: scaffold user skills VCS repo"
fi

# allowlist dirs only
: > /tmp/jjskills-allow-dirs.txt
for dir in *; do
  [ -d "$dir" ] || continue
  if [ "$dir" = "references" ] || [ -f "$dir/SKILL.md" ] || [ -f "$dir/DESCRIPTION.md" ]; then
    echo "$dir" >> /tmp/jjskills-allow-dirs.txt
    git add -- "$dir"
  fi
done

# plan / progress / count only (never *_PATH.txt — gitignored)
[ -f .agents/plans/user-skills-vcs.md ] && git add -- .agents/plans/user-skills-vcs.md
[ -f .agents/plans/progress.md ] && git add -- .agents/plans/progress.md
[ -f .agents/plans/SRC_COUNT.txt ] && git add -- .agents/plans/SRC_COUNT.txt

# refuse if path files staged somehow
if git diff --cached --name-only | rg -q 'BACKUP_PATH|PRE_SYMLINK_PATH'; then
  echo "FAIL: local path files must not be staged" >&2
  exit 1
fi

git status --porcelain -- $(cat /tmp/jjskills-allow-dirs.txt) | tee /tmp/jjskills-porcelain.txt
test ! -s /tmp/jjskills-porcelain.txt

# canaries
git ls-files | rg -q 'executing-work/SKILL.md'
git ls-files | rg -q 'references/remediation-handoff.md'
git ls-files | rg -q 'DESCRIPTION.md'
git ls-files | rg -q 'work-run-state/scripts/work-run.mjs' \
  || git ls-files | rg -q 'governing-skills/scripts/'

if find . -maxdepth 2 -name 'LICENSE*' | head -1 | grep -q .; then
  git ls-files | rg -q 'LICENSE'
fi

# count gate vs import
test -f .agents/plans/SRC_COUNT.txt
src_count=$(cat .agents/plans/SRC_COUNT.txt)
tracked=$(tracked_skill_count)
test "$tracked" -eq "$src_count"

git ls-files > /tmp/jjskills-ls-files.txt
assert_no_junk_paths /tmp/jjskills-ls-files.txt

# no real absolute home paths in staged content (public)
PATH_SCRUB_RE='/Users/[A-Za-z0-9._-]+|/home/[A-Za-z0-9._-]+'
git diff --cached > /tmp/jjskills-cached.diff
if [ -s /tmp/jjskills-cached.diff ]; then
  rg_no_matches -n "$PATH_SCRUB_RE" /tmp/jjskills-cached.diff
fi

if ! git diff --cached --quiet; then
  git commit -m "chore: import user-scope agent skills tree"
fi
```

### T6 — Symlink bind

Brief discovery blip between `mv` and `ln`.

```bash
set -e
repo="$HOME/repos/jjskills"
agents="$HOME/.agents/skills"
mkdir -p "$repo/.agents/plans"

if [ -L "$agents" ]; then
  if [ "$(readlink "$agents")" = "$repo" ]; then
    echo "ALREADY_BOUND validate-only" | tee -a "$repo/.agents/plans/progress.md"
  else
    echo "FAIL: unexpected symlink target $(readlink "$agents")" >&2
    exit 1
  fi
else
  test -d "$agents"
  test -f "$repo/executing-work/SKILL.md"
  ts=$(date -u +%Y%m%dT%H%M%SZ)
  rel_pre=".agents/skills.pre-symlink-${ts}"
  pre="$HOME/$rel_pre"
  mv "$agents" "$pre"
  if ! ln -sfn "$repo" "$agents"; then
    mv "$pre" "$agents"
    echo "FAIL: symlink; restored pre-symlink tree" >&2
    exit 1
  fi
  printf '%s\n' "$rel_pre" > "$repo/.agents/plans/PRE_SYMLINK_PATH.txt"
  echo "PRE_SYMLINK name=$rel_pre" | tee -a "$repo/.agents/plans/progress.md"
fi

test "$(readlink "$agents")" = "$repo"
test -f "$agents/executing-work/SKILL.md"
test -f "$HOME/.claude/skills/executing-work/SKILL.md"

# Codex sample (resolvable file only) — log repo-relative client label, not expanded paths
codex_sample=""
for p in \
  "$HOME/.codex/skills/planning-work/SKILL.md" \
  "$HOME/.codex/skills/executing-work/SKILL.md"
do
  if [ -f "$p" ]; then codex_sample=$p; break; fi
done
if [ -z "$codex_sample" ]; then
  codex_sample=$(find "$HOME/.codex/skills" -maxdepth 2 -name SKILL.md 2>/dev/null | head -1)
fi
test -n "$codex_sample" && test -f "$codex_sample"
# strip $HOME for progress (public-safe)
codex_rel=${codex_sample#"$HOME"/}
echo "codex_ok=$codex_rel" | tee -a "$repo/.agents/plans/progress.md"

# Grok sample
grok_sample=""
for p in \
  "$HOME/.grok/skills/cmux/SKILL.md" \
  "$HOME/.grok/skills/check-work/SKILL.md"
do
  if [ -f "$p" ]; then grok_sample=$p; break; fi
done
if [ -z "$grok_sample" ]; then
  grok_sample=$(find "$HOME/.grok/skills" -maxdepth 2 -name SKILL.md 2>/dev/null | head -1)
fi
test -n "$grok_sample" && test -f "$grok_sample"
grok_rel=${grok_sample#"$HOME"/}
echo "grok_ok=$grok_rel" | tee -a "$repo/.agents/plans/progress.md"
```

### T7 — Day-2 proof (no rewrites)

```bash
set -e
cd "$HOME/repos/jjskills"
git ls-files executing-work/SKILL.md | grep -q .
git status -sb
# progress.md may have new bind lines — commit if dirty before T8
if [ -n "$(git status --porcelain -- .agents/plans/progress.md)" ]; then
  git add -- .agents/plans/progress.md
  git commit -m "chore: record bind validation in progress"
fi
```

Doc fixes → commit before T8.

### T8 — Push / PR + remote proof

Require H1, H2/assert_no_junk_paths, H5 loaded.

```bash
set -e
cd "$HOME/repos/jjskills"
repo="$HOME/repos/jjskills"

# Mechanical secret replay (same H5 as T4; allowlist globs from progress.md)
secret_scan

# Path scrub again (includes plans) before push
PATH_SCRUB_RE='/Users/[A-Za-z0-9._-]+|/home/[A-Za-z0-9._-]+'
rg_no_matches -n "$PATH_SCRUB_RE" "$repo" \
  --glob '!.git/**' \
  --glob '!.tokensave/**' \
  --glob '!.serena/**' \
  --glob '!.headroom/**' \
  --glob '!.omc/**'

git push -u origin setup/user-skills-vcs
git fetch origin
git ls-tree -r --name-only "origin/setup/user-skills-vcs" > /tmp/jjskills-remote-files.txt
rg -q 'executing-work/SKILL.md' /tmp/jjskills-remote-files.txt
rg -q 'DESCRIPTION.md' /tmp/jjskills-remote-files.txt
src_count=$(cat .agents/plans/SRC_COUNT.txt)
remote_skills=$(rg '(^|/)SKILL\.md$' /tmp/jjskills-remote-files.txt | wc -l | tr -d ' ')
test "$remote_skills" -eq "$src_count"
assert_no_junk_paths /tmp/jjskills-remote-files.txt
# path files must not be on remote
rg_no_matches -n 'BACKUP_PATH|PRE_SYMLINK_PATH' /tmp/jjskills-remote-files.txt

# Operator: gh pr create …  OR  merge to main and push
echo "T8_GREEN $(date -u +%Y%m%dT%H%M%SZ) retain backups >=7d" | tee -a .agents/plans/progress.md
```

## Rollout / rollback

### Order

Prerequisites → T0 → T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8.

### Rollback bind (fail closed)

```bash
set -e
agents="$HOME/.agents/skills"
repo="$HOME/repos/jjskills"
pre=$(resolve_home_rel_path "$repo/.agents/plans/PRE_SYMLINK_PATH.txt")
test -L "$agents"
test -d "$pre" && test ! -L "$pre"
test -f "$pre/executing-work/SKILL.md"
rm -f "$agents"
mv "$pre" "$agents"
test -d "$agents" && test -f "$agents/executing-work/SKILL.md"
```

### Rollback content (once bound)

1. **Preferred:** fix-forward commits on the branch.
2. **Restore pre-bind tree:** run **Rollback bind** first so `~/.agents/skills` is a real directory again.
3. **Only then** reset/recreate import in the repo:

```bash
set -e
repo="$HOME/repos/jjskills"
backup=$(resolve_home_rel_path "$repo/.agents/plans/BACKUP_PATH.txt")
test -d "$repo/.git"
test -d "$backup" && test ! -L "$backup"
# restore skill trees from backup without touching .git / scaffold
rsync -a \
  --exclude='.*' \
  --exclude='README.md' \
  --exclude='AGENTS.md' \
  --exclude='.gitignore' \
  "$backup/" "$repo/"
test -d "$repo/.git"
test -f "$repo/executing-work/SKILL.md"
```

Do **not** improvise `rm -rf` of the repo root. Optional follow-up: remove package dirs present in repo but absent from backup (only after explicit inventory); first-run plans prefer not automating mass delete.

## Risks

| Risk | Mitigation |
| --- | --- |
| Hollow commits | Directory `git add` + porcelain + tracked count == src_count |
| `rg` fail-open | Prerequisites + `rg_no_matches` |
| Post-bind dirty tree | Gitignore; no `git add -A` |
| Public secrets/paths | Fail-closed scans; path scrub includes plans; `*_PATH.txt` gitignored; H5 allowlist data-only |
| Vendor redistrib | Accepted; keep LICENSE* |
| Wrong re-entry | Matrix; abort on wrong symlink; SRC_COUNT ensure; branch create-or-checkout |
| Discovery blip | Documented; restore on `ln` failure |
| Scaffold clobber | rsync excludes |

## Validation matrix

| Check | Proof |
| --- | --- |
| Deps | git, rsync, rg |
| Counts | src == dst == tracked == remote |
| Full trees | porcelain clean; work-run-state or governing-skills scripts canary |
| Bind | readlink **equals** repo |
| Clients | Claude + Codex + Grok `test -f`; progress logs `$HOME`-relative only |
| Scans | path (incl. plans) + `secret_scan` H5; T8 calls same H5 |
| Remote | `git ls-tree origin/...`; no junk; no `*_PATH` |
| Rollback | H4 resolve + PRE checks before `rm` |

## Customer trust / reliability

- **Root cause:** skills only on disk; empty placeholder repo.
- **Regression guard:** count gates, full-tree staging, scans, multi-client proofs, staged-path refuse for `*_PATH`.
- **Debug:** `readlink`; local `*_PATH.txt` (`$HOME`-relative); `progress.md`.
- **Recovery:** fail-closed rollback; ≥7d backups after green.
- **Observability:** N/A — local tooling.
- **Rollout/rollback:** above.

## Execution stories

| id | title | priority | tags |
| --- | --- | --- | --- |
| US-001 | Scaffold + plans dir + progress.md | 1 | |
| US-002 | Backup + import (re-entry matrix) | 2 | |
| US-003 | Scrub + secret scan + full-tree commits | 3 | |
| US-004 | Symlink bind + multi-client validation | 4 | release |
| US-005 | Push/PR + remote count proof | 5 | release |

### US-001

- [ ] Prerequisites ok
- [ ] `.agents/plans/progress.md` exists
- [ ] `.gitignore` + complete README + AGENTS.md (gitignore includes `*_PATH.txt`)
- [ ] Per-path `git check-ignore -v` succeeds (incl. path files)

### US-002

- [ ] Re-entry matrix applied (backup or ALREADY_BOUND+SRC_COUNT or abort wrong symlink)
- [ ] If import ran: src_count == dst_count; inventory pass; no hub/pyc; hub canary; scaffold intact
- [ ] `BACKUP_PATH.txt` is `$HOME`-relative + local-only; `SRC_COUNT.txt` written when backup/import or recompute ran

### US-003

- [ ] Path scrub clean (including plans) for real `/Users/<name>` paths
- [ ] `secret_scan` clean; allowlist via `SECRET_SCAN_ALLOW_GLOB=` if needed
- [ ] Branch create-or-checkout `setup/user-skills-vcs`; directory-loop adds
- [ ] Porcelain clean for allowlisted dirs; `*_PATH` never staged
- [ ] tracked SKILL.md count == SRC_COUNT
- [ ] Canaries: remediation-handoff, DESCRIPTION.md, nested script path

### US-004

- [ ] Bind or validate-only per matrix
- [ ] `PRE_SYMLINK_PATH.txt` `$HOME`-relative if swap performed
- [ ] readlink equals repo; Claude + Codex + Grok samples; progress without absolute homes

### US-005

- [ ] `secret_scan` (H5) + path scrub before push
- [ ] origin branch; PR or merge
- [ ] remote SKILL.md count == SRC_COUNT; no junk; no path files on remote
- [ ] T8_GREEN + 7-day retention note in progress.md

## Review history

- **v1–v3:** see prior NEEDS_REVISION findings (scrub, secrets, hollow add, rg fail-open, bind atomicity, re-entry, shell portability, rollback safety, …).
- **v4:** portable shell; fail-closed rollback; full re-entry matrix; progress.md path; mkdir -p; T8 scan replay (comment-only); tracked/remote count gates; real nested canary; content rollback procedure; wrong-target abort.
- **v5 (review v4 fixes):** `*_PATH.txt` `$HOME`-relative + gitignored + never staged; progress logs without absolute homes; path scrub includes plans using `/Users/[A-Za-z0-9._-]+` (avoids self-match on plan placeholders); scans exclude tooling dirs; mechanical H5 `secret_scan` shared by T4/T8 (allowlist globs, no eval CMD); SRC_COUNT ensure on ALREADY_BOUND; branch create-or-checkout; per-path `check-ignore`; remote junk pattern aligned with H2 (incl. `.env$`); refuse remote path files; H4 resolve for rollback.
- **v5 re-review (refining loop):** actionable scope CLEAN — zero new Blocking/Advisory/Question. Nice-to-have deferred: post-push `T8_GREEN` line may remain local-only until a follow-up commit; content-rollback optional orphan-dir cleanup left manual.

## Stop / handoff to execute

`PLAN_CONSENSUS_REACHED path=.agents/plans/user-skills-vcs.md stories=5`

Run **`executing-work`** with this plan path and seed stories US-001…US-005.
