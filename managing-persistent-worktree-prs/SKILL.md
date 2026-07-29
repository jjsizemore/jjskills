---
name: managing-persistent-worktree-prs
description: >
  Use when opening a PR from a persistent worktree (~/repos/worktrees/<repo>-agent-<N>).
  Renames branch to descriptive with -agent-N suffix, opens PR, then after merge resets
  the persistent branch back to the default branch and cleans up old branches.
triggers:
  - opening a PR from a persistent worktree
  - "worktree PR"
  - "persistent worktree"
---

# Managing Persistent Worktree PRs

Use when the current working directory is a persistent worktree at `~/repos/worktrees/<repo>-agent-<N>`.

Persistent worktrees are long-lived isolated environments. Their default branch (`<repo>-agent-N`) must
stay in sync with the main dev branch between tasks. Work branches are ephemeral and live on top of them.

---

## Phase 1 — Pre-PR: Rename to Descriptive Branch

Before creating a PR, rename the current branch to describe the work, preserving the `-agent-N` suffix.

```bash
# 1. Detect the agent slot number from the worktree path or current branch
WORKTREE_DIR=$(basename "$PWD")                 # e.g. syncvia-agent-9
AGENT_SUFFIX=$(echo "$WORKTREE_DIR" | grep -oE '\-agent\-[0-9]+$')  # e.g. -agent-9

# 2. Detect the repo name from git remote
REPO_NAME=$(git remote get-url origin 2>/dev/null | sed 's/.*\///' | sed 's/\.git//')

# 3. Confirm the current branch is still the persistent default (e.g. syncvia-agent-9)
CURRENT_BRANCH=$(git branch --show-current)
PERSISTENT_BRANCH="${REPO_NAME}${AGENT_SUFFIX}"   # e.g. syncvia-agent-9

# 4. Choose a descriptive branch name for the work, append the agent suffix
#    Convention: <scope>/<short-description>-agent-N  (e.g. fix/auth-token-expiry-agent-9)
#    OR for simple tasks: <short-description>-agent-N  (e.g. fix-login-redirect-agent-9)
NEW_BRANCH="<descriptive-name>${AGENT_SUFFIX}"

# 5. Rename current branch and push
git branch -m "$CURRENT_BRANCH" "$NEW_BRANCH"
git push origin -u "$NEW_BRANCH"
# Delete old remote tracking branch if it existed
git push origin --delete "$CURRENT_BRANCH" 2>/dev/null || true
```

**Branch naming rules:**
- Must end in `-agent-N` (the slot number from the worktree path)
- Should describe the work: `fix/sv-123-token-expiry-agent-9`, `feat/export-csv-agent-9`
- Keep the prefix conventional where possible (`fix/`, `feat/`, `chore/`, `refactor/`)

---

## Phase 2 — Open PR

Create the PR from the renamed branch. Target branch is typically `dev`.

```bash
gh pr create \
  --base dev \
  --head "$NEW_BRANCH" \
  --title "<descriptive title>" \
  --body "$(cat <<'EOF'
## Summary
...

## Test plan
...
EOF
)"
```

Invoke the `creating-rich-prs` or `closing-repo-work` skill for full PR body guidance.

---

## Phase 3 — Post-Merge: Reset Persistent Worktree

After the PR is merged, reset the persistent branch back to the default branch so the worktree is clean
for the next task.

```bash
# 1. Detect names (same as Phase 1)
WORKTREE_DIR=$(basename "$PWD")
AGENT_SUFFIX=$(echo "$WORKTREE_DIR" | grep -oE '\-agent\-[0-9]+$')
REPO_NAME=$(git remote get-url origin 2>/dev/null | sed 's/.*\///' | sed 's/\.git//')
PERSISTENT_BRANCH="${REPO_NAME}${AGENT_SUFFIX}"   # e.g. syncvia-agent-9
WORK_BRANCH=$(git branch --show-current)           # e.g. fix/auth-agent-9
DEFAULT_BRANCH=dev                                  # adjust if repo uses main

# 2. Fetch latest
git fetch origin

# 3. Create/reset the persistent branch to match the default branch
git checkout -B "$PERSISTENT_BRANCH" "origin/$DEFAULT_BRANCH"

# 4. Force-push to update the remote persistent branch
git push origin "$PERSISTENT_BRANCH" --force-with-lease

# 5. Delete the work branch locally and remotely
git branch -D "$WORK_BRANCH" 2>/dev/null || true
git push origin --delete "$WORK_BRANCH" 2>/dev/null || true

echo "Worktree reset. $PERSISTENT_BRANCH now at origin/$DEFAULT_BRANCH."
```

---

## Quick Reference

| State | Current branch | Action |
|-------|---------------|--------|
| Starting work | `<repo>-agent-N` | Rename to `<desc>-agent-N` before first push |
| Opening PR | `<desc>-agent-N` | PR targets `dev` |
| After merge | `<desc>-agent-N` | Reset `<repo>-agent-N` → `origin/dev`, delete work branch |

---

## Invariants

- The persistent branch (`<repo>-agent-N`) always tracks `origin/dev` between tasks.
- Work branches always end in `-agent-N` for worktree identification.
- No persistent branch should accumulate unmerged commits.
- If multiple PRs are open from the same worktree, finish one before starting the next (or use a different agent slot).
