---
name: operating-local-releases
description: 'Run SyncVia backend droplet deploys and desktop release publishing locally when CircleCI or GitHub Actions runner minutes are unavailable. Use for backend-v* and desktop-v* releases, production environment-variable checks, local release-train replacement, and verifying that the production Download App page resolves the latest desktop release.'
argument-hint: 'Describe the target ref, which surfaces to ship (backend, desktop, optional frontend), and whether you need macOS-only or full cross-platform packaging.'
---

# SyncVia Local Release Operator

Use this skill when you need to ship the SyncVia backend and/or desktop app from your local machine instead of relying on hosted CI.

This skill packages the repo's current release workflow into a local operator flow that:

- runs the same release-oriented validation locally,
- deploys the backend to the production droplet using production secrets and vars,
- publishes the desktop macOS release locally to `jjsizemore/syncvia-releases`, and
- verifies that the production frontend can resolve the newest desktop release.

## When to Use

- CircleCI is out of minutes and you need a local release path.
- GitHub Actions release workflows are unavailable, disabled on the branch, or too expensive to use for the current release.
- You need the latest backend version running on the production droplet.
- You need the latest desktop build downloadable from the production Download App page.
- You need a local replacement for the backend and desktop release lanes without accidentally using development env vars.

## Source of Truth

Treat these files as the canonical release references for this workflow:

- `.github/workflows/backend-release.yml.disabled`
- `.github/workflows/frontend-vercel-deploy.yml.disabled`
- `desktop/scripts/release-mac-local.sh`
- `docs/guides/release-workflows.md`
- `docs/guides/release-operator-runbook.md`
- `backend/src/trpc/routers/releases/index.ts`
- `frontend/src/pages/AppDownloadPage.tsx`

## What This Skill Decides

1. **Backend only?** Run the backend lane.
2. **Desktop only?** Run the desktop lane.
3. **Backend + desktop together?** Run both lanes from the same ref after one local validation pass.
4. **Need the frontend website redeployed too?** Only do that when the frontend code changed or the production site itself is stale. A new desktop release alone is usually enough for the Download App page because the page reads release metadata via `trpc.releases.getLatestDesktopRelease` from the backend.
5. **Need Windows/Linux installers?** On macOS, local publishing is reliable for macOS artifacts only. Windows/Linux packaging still needs native runners or a separate CI-assisted path.

## Guardrails

- Never reuse `.env.development` values for production deploys.
- Never ship a `backend-v*` or `desktop-v*` tag that does not match the corresponding `package.json` version.
- Never reuse an existing `backend-v*` or `desktop-v*` tag when it already points to a different commit than the target ref; either ship the tagged commit or bump the version and cut a new tag.
- Never declare the release done until the backend health endpoint passes and the production download page exposes the expected desktop version.
- Treat missing production secrets as a blocker, not as a reason to fall back to development defaults.

## Procedure

### 1. Resolve release scope and versions

- Decide whether the release includes `backend`, `desktop`, or both.
- Read the versions from `backend/package.json` and `desktop/package.json`.
- Derive canonical tags:
  - `backend-v{backend/package.json version}`
  - `desktop-v{desktop/package.json version}`
- Verify those canonical tags are either absent or already resolve to the same target commit; if a canonical tag already points elsewhere, stop and choose between shipping that tagged commit or bumping the version.
- Confirm the target git ref is the exact commit you want to ship.

### 2. Load production-only configuration

Load production secrets from your secure local source (for example: 1Password, exported shell env, or a secure untracked production env file).

Default repo-local source of truth: the package-local `.env.production` files.

- backend deploy lane: `backend/.env.production`
- desktop runtime values: `desktop/.env.production`
- optional frontend Vercel promotion: `frontend/.env.production`

The desktop local publisher intentionally reads `desktop/.env.release.local` for private code-signing / notarization credentials — that is the explicit exception to the `.env.production` default.

Example:

```bash
source ./scripts/source-release-production-env.sh backend desktop
```

Block the release if you do **not** have the production values required by the relevant lane.

Use the command and env matrix in [local-command-map.md](./references/local-command-map.md).

### 3. Run local release validation

Use the repo's local release-check commands as the CI replacement:

- backend lane: `pnpm ci:check:release:backend`
- desktop lane: `pnpm ci:check:release:desktop`

If the release follows code changes rather than pure operator redeploy work, also run the full required quality gates before shipping:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:integration` (only when integration suites were not already covered by `pnpm test` in this session)
- `pnpm exec lefthook run pre-commit`

### 4. Run the backend release lane locally

Mirror `.github/workflows/backend-release.yml.disabled` locally:

1. Install backend dependencies exactly as the workflow expects.
2. Build and push the production Docker image with the explicit `backend-v*` tag and the `sha-*` tag.
3. Add the `latest` tag only when releasing to production.
4. Run production Drizzle migrations against the production `DATABASE_URL`.
5. Render the droplet `.env` from production secrets and vars only.
6. Copy `backend/.env.defaults`, the rendered production env file, `docker-compose.yml`, and the backend release manifest to `/opt/syncvia` on the droplet.
7. SSH to the droplet, pull the exact image tag, run `docker compose up -d`, and wait for `/health` to pass.
8. Verify the backend at the production URL, not just via localhost on the droplet.

### 5. Run the desktop release lane locally

Use `desktop/scripts/release-mac-local.sh` via the package scripts:

- `pnpm --dir ~/repos/syncvia/desktop release:mac:local`
- `pnpm --dir ~/repos/syncvia/desktop release:mac:local:arm64`
- `pnpm --dir ~/repos/syncvia/desktop release:desktop:hybrid`

The desktop local publisher already:

1. validates builder config and desktop checks,
2. generates `.env.runtime` from public production runtime values,
3. packages and publishes the macOS release,
4. validates packaged artifacts and updater files, and
5. standardizes GitHub Release metadata in `jjsizemore/syncvia-releases`.

Use the hybrid option only when you still want GitHub Actions to package Windows/Linux from the same `desktop-v*` release tag.

### 6. Confirm the desktop build is downloadable on the production frontend

The production Download App page usually does **not** need a frontend redeploy for a new desktop version. Verify in this order:

1. Confirm the desktop GitHub Release exists in `jjsizemore/syncvia-releases`.
2. Confirm the backend production env points `RELEASES_REPO` at `jjsizemore/syncvia-releases` (the backend default already does this unless intentionally overridden).
3. Confirm the production backend can resolve the latest `desktop-v*` release.
4. Open the production Download App page and verify the newest version label and download links.

Only run a frontend Vercel production deploy when frontend code changed or the production web app itself is behind.

### 7. Optional frontend production promotion

When needed, mirror `.github/workflows/frontend-vercel-deploy.yml.disabled` locally:

1. check out the exact frontend release ref,
2. run `vercel pull --environment=production`,
3. deploy with `vercel deploy --prod`, and
4. verify the production deployment URL.

This is optional for the backend + desktop outcome unless the frontend code changed.

### 8. Finish with release verification

A successful local release means all of the following are true:

- the backend health endpoint passes on the production URL,
- the droplet is running the expected backend image tag,
- the desktop GitHub Release contains the expected macOS assets and `latest-mac.yml`,
- the production Download App page exposes the new desktop version, and
- production env vars were used for every deployed surface.

## Rollback Rules

- **Backend rollback:** redeploy the previous `backend-v*` image/tag using the same droplet flow.
- **Desktop rollback:** re-promote or re-distribute the previous `desktop-v*` GitHub Release.
- **Frontend rollback:** if you deployed frontend hosting, re-run the prior frontend tag against Vercel production.

## Completion Criteria

Do not call the release complete until you can state:

- which git ref shipped,
- which release tags were used,
- which production env source was used,
- which backend URL passed verification, and
- which desktop release tag is now visible on the production Download App page.
