# Codex Repository Environment Patterns

## Codex Local Environment Source of Truth

Current Codex docs describe local environments as configured through the Codex app settings pane, with a generated file stored under `.codex` that can be checked into the repository. Treat that file as generated output: prepare setup scripts and action definitions for the UI, ask the user to apply them there, and then review the generated file if needed. Do not hand-edit `.codex/environments/environment.toml` unless official Codex docs or tooling document a supported non-UI write path.

## Setup Script Shape

Use setup scripts for idempotent worktree bootstrap. A strong default shape is:

```bash
set -euo pipefail

# Trust repo-local tool config only when present.
[ -f "$PWD/mise.toml" ] && mise trust "$PWD/mise.toml"
[ -f "$PWD/.mise.toml" ] && mise trust "$PWD/.mise.toml"

# Enable package-manager shims when relevant.
command -v corepack >/dev/null 2>&1 && corepack enable || true

# Install dependencies using the repo package manager.
pnpm install --frozen-lockfile

# Install generated/runtime prerequisites only when required by the repo.
# Examples: pnpm prisma generate, pnpm playwright install, pnpm exec playwright install
```

Avoid automatic setup steps that start long-running servers, reset databases, delete local files, run full test suites, or require production/staging secrets.

## Worktree Env Sync Pattern

For repos with ignored local env files, sync only non-production env files from the main worktree into new worktrees:

```bash
MAIN_WORKTREE="$(git worktree list --porcelain | awk '/^worktree /{print $2; exit}')"

for dir in "" backend frontend desktop; do
  src="${MAIN_WORKTREE}${dir:+/$dir}"
  dst="$PWD${dir:+/$dir}"
  [ -d "$src" ] && [ -d "$dst" ] || continue

  for f in "$src"/.env*; do
    [ -f "$f" ] || continue
    name="$(basename "$f")"
    case "$name" in
      .env.production|.env.production.local|.env.staging|.env.staging.local|\
      .env.release.local|.env.release.*|.env.docker|\
      *.production|*.production.*|*.staging|*.staging.*|\
      template.env|.env.example|*.bak|*_[0-9]*[0-9].bak)
        continue
        ;;
    esac
    [ -d "$dst/$name" ] && rm -rf "$dst/$name"
    [ -f "$dst/$name" ] && cmp -s "$f" "$dst/$name" && continue
    cp "$f" "$dst/$name"
  done
done
```

Trim the directory list to match the repo. Do not copy production, staging, release-signing, Docker-only, template, example, or backup files.

## Action Menu Patterns

Prefer small, named actions over one overloaded command:

| Action | Script |
| --- | --- |
| Dev | `pnpm dev` |
| Dev: backend | `pnpm dev:backend` |
| Dev: frontend | `pnpm dev:frontend` |
| Services: up | `pnpm db:up` or `docker compose up -d` |
| Services: down | `pnpm down` or `docker compose down` |
| Typecheck | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Test | `pnpm test` |
| E2E | `pnpm test:e2e` |
| Quality: fast | repo-specific fast quality script |
| Hooks: pre-commit | `pnpm exec lefthook run pre-commit` |
| Cleanup: local dev state | stop services and clear tool caches only |

Keep destructive actions explicit, for example `Cleanup: reset test database`, not just `Cleanup`.

## Project-Scoped Codex Config Checklist

Consider `.codex/config.toml` only when the repo benefits from checked-in Codex behavior:

- project-specific instructions file routing or doc fallback names
- sandbox writable roots for generated artifacts
- network policy for local dev server testing
- MCP servers required for repo workflows
- hooks for repo-specific startup/stop checks
- tool/app approval defaults for GitHub, Linear, Vercel, Sentry, or docs tools

Do not duplicate `AGENTS.md` in Codex config. Use config to route behavior; keep repo instructions in normal project docs.
