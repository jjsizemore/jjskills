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

## Review-Response Workflow

1. **Fetch inline comments**: Use `gh api repos/{owner}/{repo}/pulls/{number}/comments` — `pr checks` / `pr view` alone do not surface inline threads.
2. **Evaluate with technical rigor**: Verify suggestions against codebase facts, tests, and invariants before implementing. Do not agree performatively with incorrect feedback.
3. **Follow-up commits**: Push fixes as focused commits on the same branch rather than force-pushing, preserving reviewer diffability.
4. **Local revalidation**: Run affected tests and lint locally before pushing.
5. **Verify resolution**: Re-fetch comments on the updated head to confirm no new blocking comments appeared before requesting re-review or merging.
