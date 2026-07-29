---
name: rehearsing-desktop-packaged-auto-update
description: 'Rehearse SyncVia desktop auto-update locally with a packaged macOS app, a disposable generic update feed, and log-based verification. Use when testing packaged updater behavior, validating latest-mac.yml metadata, or debugging why a local updater rehearsal is not discovering an available update.'
---

# SyncVia Local Packaged Auto-Update

Use this skill when you need to validate the desktop updater **without** publishing a real GitHub Release.

This is specifically for the SyncVia desktop package under `desktop/` and is optimized for macOS packaged-app rehearsals.

## What this skill verifies

- The packaged app can read updater metadata at runtime.
- A locally hosted `latest-mac.yml` feed is discoverable.
- The app emits `checking-for-update` and `update-available` signals from a packaged build.
- Local testing can be done without touching production GitHub Releases.

## When to use it

- After changing `desktop/src/main/services/autoUpdateService.ts`
- After changing `desktop/electron-builder*.yml`
- After changing `desktop/app-update.yml` or `desktop/dev-app-update.yml`
- When a packaged app says it is up to date unexpectedly
- When you want a fast pre-release updater rehearsal on macOS

## Preconditions

1. You have a packaged macOS app available from:
   - `pnpm --dir ~/repos/syncvia/desktop pack:mac:arm64:fast`
2. You have real update artifacts available from:
   - `pnpm --dir ~/repos/syncvia/desktop pack:mac:arm64`
3. `desktop/build/output/latest-mac.yml` and the corresponding ZIP artifact exist.

## Recommended rehearsal strategy

The most reliable local packaged-app test is:

1. Create a **disposable local feed** that advertises a newer version.
2. Clone the packaged `.app` bundle into a temp directory.
3. Patch the cloned app's runtime `Contents/Resources/app-update.yml` to use a local generic provider.
4. Launch the cloned packaged app.
5. Wait for the built-in 10-second automatic update check.
6. Confirm the logs show `Checking for update` followed by `Update available`.

This avoids depending on live GitHub Releases and avoids mutating the real packaged artifact.

## Validated local workflow

### 1) Create a disposable local update feed

Copy the ZIP artifact and write a synthetic `latest-mac.yml` with a higher version than the installed app.

Example feed contents verified in this repo:

- source ZIP: `desktop/build/output/SyncVia.ai-0.1.20-mac-arm64.zip`
- synthetic feed version: `0.1.21`

### 2) Serve the feed locally

Serve the disposable feed directory at:

- `http://127.0.0.1:8080`

### 3) Clone the packaged app and patch its runtime updater config

Patch the cloned app's `Contents/Resources/app-update.yml` to:

```yaml
provider: generic
url: http://127.0.0.1:8080
updaterCacheDirName: syncvia-desktop-updater-local-smoke
```

### 4) Launch the cloned packaged app

Then wait for the automatic update check.

## Expected success signal

For a successful packaged-app discovery rehearsal, the logs should include lines like:

- `Checking for update`
- `Found version 0.1.21`
- `Update available`

Validated local signal observed in this workspace:

- `Checking for update`
- `Found version 0.1.21 (url: SyncVia.ai-0.1.20-mac-arm64.zip, SyncVia.ai-0.1.20-mac-arm64.dmg)`
- `2026-03-25T03:08:47.075Z [INFO] [AutoUpdateService] Update available { version: "0.1.21" }`

## Known caveats

### 1) VS Code chat shell can inject unsupported `NODE_OPTIONS`

In packaged Electron runs, you may see warnings like:

- `Most NODE_OPTIONNs are not supported in packaged apps`

These warnings are noisy but did **not** prevent update detection in the validated rehearsal.

### 2) `SYNCVIA_FORCE_DEV_UPDATE=1` may not be sufficient in every packaged-shell context

The intended design is that `autoUpdater.forceDevUpdateConfig = true` makes the app use `dev-app-update.yml`.

However, in the validated chat-shell rehearsal, the most deterministic approach was still to patch the cloned packaged app's runtime `app-update.yml` directly.

Use the cloned-app approach when the packaged app unexpectedly falls back to GitHub instead of the local generic provider.

### 3) Static updater metadata must stay in sync with `electron-builder.yml`

The source file:

- `desktop/app-update.yml`

must mirror the publish block in:

- `desktop/electron-builder.yml`

This includes fields like:

- `provider`
- `owner`
- `repo`
- `private`
- `releaseType`
- `tagNamePrefix`
- `vPrefixedTagName`

If these drift, packaged local rehearsals can point at the wrong release tag and produce misleading updater failures.

## What this skill does **not** fully prove

- GitHub private-release auth works end-to-end in production
- The download/install button flow in renderer UI was clicked automatically
- Windows or Linux updater behavior

For that, do a follow-up real-release smoke test after the local rehearsal passes.

## Completion criteria

Treat the local updater rehearsal as successful when all of the following are true:

1. The packaged app launches successfully.
2. The local feed is reachable.
3. The app logs `Checking for update`.
4. The app logs `Update available` for the synthetic newer version.
5. No fallback-to-production metadata confusion remains unexplained.

## Follow-up validations

After a successful local rehearsal, run the normal desktop validation stack:

1. `pnpm --dir ~/repos/syncvia/desktop typecheck`
2. `pnpm --dir ~/repos/syncvia/desktop lint`
3. `pnpm --dir ~/repos/syncvia/desktop pack:mac:arm64:fast`
4. `pnpm --dir ~/repos/syncvia/desktop validate:pack`

Then, if needed, do one real GitHub Release smoke test to confirm private-repo auth and published metadata behavior.
