---
name: using-git-worktrees
description: 'Use when starting feature work that needs isolation from current workspace or before executing implementation plans - ensures an isolated workspace exists via native tools or git worktree fallback'
---

# Using Git Worktrees

Use this skill before isolated implementation work. The canonical location for
every user-managed linked worktree is:

```text
~/repos/worktrees/<repository-name>-<flattened-branch-name>
```

Use the repository directory name as `<repository-name>` and replace `/` with
`-` only in the worktree directory name. Keep the Git branch name unchanged.

## Required workflow

1. Confirm the branch name from the repository's issue tracker when available;
   otherwise use its documented ad-hoc branch convention.
2. Check `git worktree list`, the repository's coordination ledger, and dirty
   state before creating or moving a worktree.
3. Create the canonical parent directory and add from the explicit base branch:

   ```bash
   REPO_NAME="$(basename \"$(git rev-parse --show-toplevel)\")"
   BRANCH="feature/example"
   WORKTREE="$HOME/repos/worktrees/${REPO_NAME}-${BRANCH//\//-}"
   mkdir -p "$HOME/repos/worktrees"
   git worktree add "$WORKTREE" -b "$BRANCH" <explicit-base>
   ```

4. Run the repository's environment-sync/bootstrap step and baseline validation
   before implementation.
5. Store the absolute worktree path in any coordination ledger and use
   `git -C "$WORKTREE"` for Git operations.

## Moving an active worktree

Use `git worktree move <old> <new>` rather than filesystem moves. Preserve dirty
files, update the coordination ledger immediately, and verify the moved path
with `git worktree list` plus `git -C <new> status --short`. Never move a
worktree that another active process owns without that process's coordination.

## Repository exceptions

Repository-local placement rules may differ only when they explicitly document
why the global location is incompatible. In the absence of that documented
exception, this canonical location overrides older sibling or nested-worktree
examples.
