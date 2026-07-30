---
name: verifying-desktop-pack-readiness
description: Validate Electron desktop packaging readiness for SyncVia across build, artifact checks, and packed app verification. Use for desktop changes that can affect packaging, startup, updater behavior, or runtime wiring.
---

# SyncVia Desktop Pack Readiness

Use this skill for changes under `desktop/**` and related config that may impact packaged app behavior.

## Validation Focus

- Packaging config integrity (`electron-builder`, scripts, env wiring)
- Main/renderer process boundaries and IPC contract correctness
- Startup flow correctness in packaged mode
- Artifacts produced and structurally valid for target platform

## Required Checks

1. Build desktop app successfully.
2. Package desktop app for the target platform.
3. Verify the packed app launches and core workflow paths work.
4. Confirm no dev-only assumptions leak into packaged runtime.

## Safety Rules

- Follow desktop main-process constraints (no risky top-level await patterns).
- Keep privileged operations in main process; renderer uses typed bridge only.
- Capture any platform-specific caveats (especially macOS) in output notes.

## Completion Criteria

A desktop change is complete only when packaging and packed-app verification pass, not just dev-mode execution.
