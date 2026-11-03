# Repo Pull Request Rules

Use these rules when opening or updating a PR in any repo.

## Issue Detection

Search for explicit issue IDs in this order:

1. Current branch name.
2. User prompt or task description.
3. Commit messages.
4. Existing PR title or body.
5. Nearby repo context only when it is explicit and already in use.

Accept only issue formats that already appear in branch names, docs, prompt text, or history, for example `ABC-123`, `PROJ-9`, or `#123` when it is clearly an issue reference. Normalize case only when the repo convention makes that safe. Never invent an issue ID. If none is found, write:

```text
No related issue found.
```

## Base Branch and Title

- Resolve the intended PR target before base-sensitive validation or first push:
  honor the explicit assignment, otherwise the existing PR's base, then the
  repository's publication policy. Use the remote default only when the target is
  otherwise unspecified and repository policy permits it. Retain one binding of
  target remote/ref and resolved commit for the diff, changed checks and PR;
  refresh affected proof when that target or relevant inputs change.
- A tracking upstream can name the feature branch; it does not establish the PR base.
  A missing upstream never establishes `dev` or the remote default as the target.
  Scope the repository's supported comparison override to the relevant checks
  and push invocation (for example, `CI_CHECK_CHANGED_BASE` where implemented).
  Check the selected paths against the intended diff before recovering resources
  for an unexpectedly broad test selection. Correct base selection preserves
  required relevant tests, failure propagation, hooks and signing; it is not test
  deferral and does not change the source baseline.
- Create the PR with an explicit resolved base and preserve it for split-out PRs;
  do not let the CLI's default branch replace that binding.
- If the repo has PR title or branch conventions, follow them.
- Otherwise use a concise title such as `type: concise summary` and add an issue suffix only when the repo convention or the user expects it.

## Required PR Body

Use the repo's PR template if present.

If there is no template, use this fallback structure:

```markdown
## Summary

Explain what changed, why it changed, and what reviewers should expect.

## Changes

- List concrete changes from the actual diff.

## Related Issues

No related issue found.

## Testing

- List exact commands or checks run.

## Screenshots / Output

Not applicable.

## Risks & Notes

- Mention migrations, breaking changes, compatibility, rollout risk, assumptions, or the lack thereof.
```

## Agent/Model Provenance

Every agent-created or materially agent-updated PR body should include
provenance unless the repo template has an equivalent field:

```markdown
## Agent

- Agent: {agent-name}
- Model: {model-name}
- Head SHA: {head-sha}
- Source: {implementation|review-fix|ci-fix|closeout}
```

For PR reviews, review-thread replies, and PR status comments, include the same
agent/model pair plus the PR number and relevant comment/check/commit IDs in the
comment body. This makes later agent/model performance audits possible without
scraping chat transcripts.

## Related Issue Wording

Use the repo's issue-linking keywords when known. Otherwise:

- Use `Closes`, `Fixes`, or `Resolves` only when the PR fully completes the issue.
- Use `Addresses` for partial completion.
- Use `Related to` for related work that does not complete the issue.
- Put each issue on its own line when multiple issues are involved.

## Accuracy Checklist

Before writing the PR, inspect the actual diff and commits. Check:

- Added, modified, and deleted files.
- Public API changes.
- Database migrations or schema changes.
- Dependency changes.
- Environment variable changes.
- Tests added, updated, removed, or run.
- User-facing behavior changes.
- Documentation updates.
- Whether screenshots or sample output are relevant.

Do not claim measured performance, security, or test outcomes unless the evidence exists.
