---
name: receiving-code-review
description: 'Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement, not blind implementation'
---

# Release-Sensitive PR Body Markers (SyncVia)

When opening a PR that touches release-sensitive files (`.github/workflows/**`,
`scripts/*release*`, `scripts/*workflow*`, `backend/Dockerfile`, etc.), the CI
gate `Validate release guardrail evidence` checks the PR body for literal
markers.

## Critical: Markers must be plain text, NOT inside bold/italic formatting

The validation script (`scripts/validate-release-sensitive-pr.mjs`) uses
`body.includes('Failure class:')` — a literal substring check.

**WRONG** (fails CI):
```markdown
## Regression Guardrail

- **Failure class**: CI/release — staging backend unable to serve the UI
- **Contract/test**: `scripts/backend-release-workflow-contract.test.mjs`
```

**RIGHT** (passes CI):
```markdown
## Regression Guardrail

Failure class: CI/release — staging backend unable to serve the UI
Contract/test: `scripts/backend-release-workflow-contract.test.mjs`
Command run: `node --test scripts/backend-release-workflow-contract.test.mjs` (25/25 pass)
Release/deploy boundary: backend (staging)
Rollback: Revert this commit and re-release; or set the repo var to `false`
```

## Required markers

```
## Regression Guardrail
Failure class: <description>
Contract/test: <test file or "Docs-only release-sensitive justification:">
Command run: <command that was run locally>
Release/deploy boundary: <which system gets deployed>
Rollback: <concrete revert path>
```

## Docs-only alternative

For release-sensitive diffs that are purely documentation:
```
Docs-only release-sensitive justification: <explanation>
```

## Local validation before push

```bash
node scripts/validate-release-sensitive-pr.mjs \
  --base origin/<base-branch> --head HEAD \
  --pr-body-file /path/to/pr-body.md
```
