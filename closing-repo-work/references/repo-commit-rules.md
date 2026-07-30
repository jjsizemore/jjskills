# Repo Commit Rules

Use these rules with `$committing-semantically` when closing out work in any Git repo.

## Required Checks

1. Inspect repo commit rules and `commitlint.config.*` before writing the message.
2. Inspect the current branch and staged diff.
3. Detect explicit issue IDs from the branch, prompt, staged context, recent commits, or PR context using the repo's existing issue pattern.
4. Never invent issue IDs, ticket relationships, or required trailers.
5. Validate the exact message with commitlint or the repo's commit checker when possible.
6. Stage explicit paths only.

## Message Shape

If the repo already defines commit format, follow that first.

Otherwise use this shape for non-trivial commits:

```text
<type>(<scope>): <short description>

### Changes

- Describe only staged changes.

### Reason

- Explain why the change was needed.

### Impact

- Describe behavior, compatibility, migrations, environment variables, and risk.

### Testing

- List checks actually run, or say why checks were not run.
```

Use a minimal message only for small obvious commits:

```text
<type>(<scope>): <short description>
```

Add issue footers only when evidence supports them. For agent-made commits, add
agent/model footers by default unless repo rules forbid unknown trailers:

```text
Agent: {agent-name}
Model: {model-name}
```

If trailers are not allowed, preserve the same provenance in the PR body or
closeout report.

## Types and Scopes

Prefer repo commitlint rules. If none are configured, use standard conventional types:
`feat`, `fix`, `refactor`, `perf`, `chore`, `docs`, `test`, `build`, `ci`, `style`, `revert`.

Use a meaningful lowercase scope such as `auth`, `api`, `db`, `ui`, `ci`, `docs`, or `tests`. Do not use the issue ID as the scope unless repo rules explicitly allow it.

## Issue Footers

Use the repo's issue-linking keywords when known. Otherwise:

- Use `Closes`, `Fixes`, or `Resolves` only when the commit fully completes the issue.
- Use `Addresses` when the commit partially handles the issue.
- Use `Refs:` or `Related to` when the commit is related but not complete.
- Omit the issue footer when no explicit issue was found.

## Accuracy Rules

- Base the message only on staged changes.
- Do not describe tests that were not run.
- Do not describe planned future work as completed.
- Split unrelated changes into separate commits when possible.
- Include `BREAKING CHANGE:` for breaking changes when the repo's commit format supports it.
