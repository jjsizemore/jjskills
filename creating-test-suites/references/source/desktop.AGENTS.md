# Desktop (Electron) — AI Agent Context

This file provides package-specific rules for the `@syncvia/desktop` Electron app.

**See also:** Root [AGENTS.md](../AGENTS.md) for project-wide context.

---

## Documentation Freshness

- Treat this file and the desktop-relevant files under `../.github/` as living guidance.
- Whenever desktop architecture, packaging/runtime workflows, UX ownership, or your current change make this guidance stale, update the relevant section(s) in the same work.
- Keep package-specific instructions aligned with root `AGENTS.md` plus the applicable `.github/instructions/`, `.github/agents/`, `.github/prompts/`, and related desktop-focused guidance.
- Do not leave stale desktop paths, guardrails, platform notes, or status claims behind when you have enough context to fix them.

---

## Overview

The desktop app is the **primary UX surface** for SyncVia.ai. It provides platform-independent audio capture (system audio + microphone) directly via OS-level APIs, with no dependency on Zoom RTMS, Teams bots, or Google Meet integrations. This means it works with any meeting platform the user runs.

**Stack**: Electron 40, TypeScript, electron-vite, React renderer.

### Platform Integration Strategy

Direct real-time integrations with Zoom, Teams, or Google Meet are **not part of the product roadmap**. The OS-level audio capture model is the canonical input path. The medium-term extent of meeting platform API usage is **calendar integration** — allowing users to connect their calendar so they can pre-associate scheduled meetings with teams, projects, and orgs and input context ahead of time.

### Current State

- ✅ Phase 1 shell complete (window lifecycle, tray/menu, typed IPC bridge, renderer scaffold)
- 🚧 Phase 2 in progress: audio capture (system + mic), real-time transcription, backend connection

---

## CRITICAL: Top-Level Await in Main Process

**Top-level `await` in Electron's ESM main process causes silent hangs** where `app.whenReady()` never resolves. The process starts, the Dock icon bounces, but no window is created and no errors are logged.

```typescript
// ❌ BROKEN — causes silent hang with ESM + electron-vite
await app.whenReady();
createMainWindow();

// ✅ CORRECT — always resolves
app
  .whenReady()
  .then(() => {
    createMainWindow();
  })
  .catch(console.error);
```

**Root cause**: ES Modules load asynchronously in Node.js. When combined with Electron's initialization sequence, top-level `await` creates a deadlock between the module system and the ready event.

**Applies to**: All files in `src/main/`. Never use top-level `await` with any Electron API in the main process.

---

## Main Process Rules (`src/main/`)

- ❌ NEVER use top-level `await` with Electron APIs — use `.then().catch()` or async IIFE.
- ❌ NEVER import renderer code into the main process.
- ✅ Use file-based logging (`writeFileSync` to `/tmp/`) when debugging startup hangs where console output is invisible.
- ✅ Register event listeners (`app.on(...)`) at the top level — they're safe.
- ✅ Keep privileged operations (file I/O, system APIs, secrets) in main process with explicit IPC boundaries.

---

## Renderer Rules (`src/renderer/`)

The renderer is a **client UI** — treat it like the web frontend with additional IPC capabilities.

### Security & Boundaries

- ✅ Use the typed `window.syncvia` IPC bridge for privileged Electron operations.
- ❌ Do NOT import Node/Electron main-process modules into the renderer.
- ❌ Do NOT store secrets (API keys, tokens) in the renderer. Keep in backend or main process.
- ❌ Do NOT access the database from the desktop app — all data flows through backend tRPC APIs.

### Data Access

- ✅ Use backend tRPC APIs following standardized patterns:
  - Queries: `useQuery(trpc.*.queryOptions(...))`
  - Mutations: `useMutation({ ...trpc.*.mutationOptions(), onSuccess: ... })`
- ❌ Never manually construct query keys.

### State & UX

- ✅ Keep global UI state in renderer contexts under `src/renderer/contexts/`.
- ✅ Prefer small, focused components under `src/renderer/components/`.
- ✅ Design desktop-first workflows: fast context switching, clear empty/error states.

### Logging

- ❌ Never use `console.*`.
- ✅ Use the structured logger and telemetry helpers.
- ✅ Handle async failures explicitly with user-friendly error surfaces.

---

## Audio Capture Rules

- Audio capture via `getDisplayMedia()` must be triggered by a **user gesture**.
- Never capture or store video — discard video tracks immediately.
- System audio + microphone capture; no platform-specific dependencies.

---

## Key Paths

| Path                      | Purpose                                          |
| ------------------------- | ------------------------------------------------ |
| `src/main/index.ts`       | Main process entry point                         |
| `src/main/`               | Main process modules (IPC, tray, menu, window)   |
| `src/preload/`            | Preload scripts (IPC bridge)                     |
| `src/renderer/`           | React UI (primary UX surface)                    |
| `src/shared/`             | Types/constants shared between main and renderer |
| `src/utils/`              | Utility modules                                  |
| `electron.vite.config.ts` | Build configuration                              |
