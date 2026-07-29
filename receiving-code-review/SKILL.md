---
name: receiving-code-review
description: 'Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or blind implementation'
---

# Receiving Code Review

Use this skill when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or blind implementation

## Guidance

- Confirm the trigger matches the current task before applying this workflow.
- Keep the work scoped to the named capability and prefer narrower repo-local overrides when present.
- Preserve relevant evidence, commands, paths, and validation results in the final handoff.
- Do not rely solely on `gh pr view` or `gh pr checks` to determine if a PR has unresolved feedback, as they do not expose inline review threads.
- Always use `gh api /repos/{owner}/{repo}/pulls/{number}/comments` to fetch inline review threads and ensure no unresolved comments are missed. Pipe through `python3 -c` to parse JSON.
- Update this skill with more specific guidance when a repeatable failure mode or workflow detail emerges.
- See `references/post-fix-review-iteration.md` for the post-fix review loop (how to confirm no new inline comments after pushing fixes).
- See `references/release-sensitive-pr-markers.md` for the PR body marker format required by CI.

## Review-Response Workflow (SyncVia conventions)

When receiving review feedback on a release-sensitive PR (modifying workflows, scripts, or CI):

1. **Fetch inline comments**: `gh api repos/{owner}/{repo}/pulls/{number}/comments` — `pr checks` / `pr view` do not surface inline threads.
2. **Categorize by severity**: P1 = must fix (correctness, operator control), P2 = should fix (completeness, paired concerns).
3. **For env-var wiring changes**: When a review points out that a feature flag was added without its paired recording/tracking flag, check `backend/src/config/env.schema.ts` for siblings (`ENABLE_INVITE_SIGNUP_TRACKING` always accompanies `ENABLE_INVITE_SIGNUP_TRACKING_ADMIN`).
4. **Push fixes as a follow-up commit** on the same branch — do not amend or force-push, so reviewers can diff the response.
5. **Re-run affected contract tests** locally before push: `node --test scripts/backend-release-workflow-contract.test.mjs`.
6. **After pushing fixes, re-fetch inline comments**: Automated reviewers (e.g. chatgpt-codex-connector[bot]) may post new P1/P2 comments on the updated diff. `gh pr checks` showing green does NOT mean the review is resolved — you must explicitly fetch comments again and filter by timestamp to confirm no new issues surfaced.
7. **Auto-merge trigger**: If the task calls for automerge on clean review, after pushing fixes, use `gh pr edit --add-label "ready-for-review"` and notify in chat. Do not auto-merge until at least one reviewer approves and no new inline comments remain.
