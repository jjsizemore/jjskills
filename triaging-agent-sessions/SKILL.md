---
name: triaging-agent-sessions
description: 'Use to triage an agent session, pane, worktree, or Herdr project for close/remove decisions. Assess Work/Session/Worktree/Herdr rows with evidence; assess by default and mutate only explicitly authorized targets.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable session/worktree/project triage; repository overrides add local session-tool commands.
---

# Triaging Agent Sessions

Decide whether an agent session's work is done and whether its session,
worktree, and Herdr project can close. **Assess by default; execute only
the specific cleanup actions the user authorizes.**

## Inputs

- **Target:** session ID or name, pane, worktree path, or PR. Blank means
  the current session only if it is identifiable unambiguously; otherwise
  list plausible matches and stop.
- **Mode:** assess (default). Cleanup runs only for authorized targets.
- **Scope:** original task, expected stopping point, anything to retain.

## Resolve the target (read-only)

Inspect on the host that owns the session: session ID, host, working
directory, repo, worktree, branch or detached HEAD, PR or issue if
applicable, Herdr project and thread if present. Ambiguous target →
list plausible matches, mutate nothing.

Use the installed session tool's help to verify what close, archive,
remove, and sweep affect before recommending or running them.

## Four verdicts

1. **Work — is it done?** Read the original request, later steering, and
   latest handoff. Verify the requested stopping point against actual
   outputs, tests, PR and CI status, or deployment/UAT when required.
   Match evidence to the relevant commit or artifact. Check live agents,
   child jobs, and watchers. A quiet pane or a "done" message alone
   proves little. Verdict: **Done** | **Handed off** | **In progress** |
   **Waiting** (external event + who owns follow-up) | **Blocked**
   (specific unblock) | **Superseded** (link to successor) | **Unknown**
   (missing evidence). Name remaining obligations and owners. An open PR
   satisfies a request to open a PR.
2. **Session — can it close?** Check ongoing work, follow-up the session
   owns, and context needed to resume. Verdict: **Keep** | **Archive** |
   **Close** | **Unknown**, per what the installed tool supports. If a
   successor owns the remaining work, verify the handoff or state what
   still needs handing off.
3. **Worktree — can it go?** Check whether it is primary,
   persistent/reusable, locked, shared, or in use by any session or
   process. Treat SyncVia's `syncvia-agent-N` pool as reusable. Inspect
   staged, unstaged, untracked, and meaningful ignored files, submodules
   if present, stashes if relevant, and whether the exact HEAD and
   required files are recoverable. For a squash or rebase merge, verify
   the merged PR covers the worktree's changes and account for later
   local changes. Verdict: **Keep** | **Reuse** | **Remove** | **Prune
   stale metadata** | **Unknown**. Absent path → verify host/volume
   availability and actual retirement before pruning. Branch deletion is
   a separate action.
4. **Herdr project — can it go?** Inspect coordinator, sibling threads,
   worktrees, open follow-up, routines, watchers, shared notes. Verify
   which resources each available action affects. Verdict: **Keep** |
   **Close workspace** | **Archive** | **Sweep specific items** (list
   exact targets) | **Remove project** | **N/A** | **Unknown**. If a
   sweep would include an unverifiable item, recommend a narrower action.

## Authorized cleanup only

Record resume details for any handoff first. Recheck live usage and Git
state immediately before each change, then run the supported action on
the exact target and verify the result. On state change or failed
removal, report the reason and the next safe step. If closing the
current pane would interrupt verification, use a separate control
session or leave that step for the operator.

## Leaves

- Worktree removal evidence: `reclaiming-development-space`
- Handoff/resume record: `resuming-work`
- PR/merge proof and persistent worktrees: `closing-repo-work`,
  `managing-persistent-worktree-prs`

## Output

One Markdown table: rows **Work**, **Session**, **Worktree**, **Herdr
project**; columns **Target**, **Verdict**, **Evidence**, **Next action /
owner**. Concrete IDs, paths, links. State which actions were performed
and verified, if any.
