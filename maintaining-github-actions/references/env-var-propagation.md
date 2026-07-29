---
name: maintaining-github-actions
description: 'Use when auditing, debugging, optimizing, or contract-testing GitHub Actions workflows, runners, caches, permissions, or release jobs.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: General cross-repo skill; repo-local skills with the same
    name may override it.
---

# Env Var Propagation to Deployed Backend

When a feature flag is gated in the backend env schema but the CI release
workflow never writes it into the deployed `.env` file, the flag silently
defaults to `false` in production/staging.

## Pattern: env var → heredoc → droplet

For workflows that build a `.env.production` heredoc and scp it to a deploy
droplet:

1. Add `FLAG_NAME: ${{ vars.FLAG_NAME }}` to the step's `env:` block (so it's
   available as a shell variable in the heredoc).
2. Add `FLAG_NAME=${FLAG_NAME}` inside the heredoc.
3. Add a contract test in `scripts/backend-release-workflow-contract.test.mjs`
   that asserts the var appears in the heredoc section.

## Hard-coded flag anti-pattern (local release script)

`scripts/release-backend-local.sh` maintains an `override_keys` array: it
removes the key from the source env copy, then appends a fixed value. When a
flag is added to this array and hard-coded to `true`:

- Operators cannot disable it via the source env file or shell variable.
- The flag is silently enabled in every local release, even when the canonical
  env intentionally keeps it disabled.

**Fix**: If the flag value should flow from the source env, do NOT add it to
`override_keys` and do NOT append a hardcoded value. If a default is needed,
use `FLAG_NAME=${FLAG_NAME:-default}` to allow explicit operator override.

## Paired flags

When adding a feature flag, check for sibling flags in
`backend/src/config/env.schema.ts`. Common pairs:
- `ENABLE_INVITE_SIGNUP_TRACKING` (recording) + `ENABLE_INVITE_SIGNUP_TRACKING_ADMIN` (admin UI)

Both flags must be wired through the workflow, heredoc, and contract tests
together. If the admin UI calls endpoints that depend on signup recording,
enabling only the admin flag results in silent failures.

## Debugging checklist

- Confirm the env var is set in GitHub repo **Variables** (Settings → Secrets
  and variables → Actions → Variables), not Secrets.
- Confirm the workflow was re-triggered AFTER the code change landed — the
  var won't be present in prior runs.
- Run the contract test locally: `node --test scripts/backend-release-workflow-contract.test.mjs`
