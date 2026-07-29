# SyncVia.ai — Autonomous Execution Protocol

This document is the **tool-agnostic entrypoint** for any agentic system (GitHub Copilot, Cursor, Claude Code, OpenAI Codex, Google Gemini, or any other AI coding assistant) to execute work in this repository autonomously and in parallel with other agents.

Read this file before taking any non-trivial action in the codebase.

---

## What "executing work" means here

Executing a unit of work means driving it through five phases — planning, prompt generation, implementation, validation, and commit/closeout — without manual handoffs between phases. The output is a committed branch, an open PR targeting `dev`, and a Linear issue correctly linked to branch/PR signals so status automation can run.

The detailed implementation specification lives in:

- **Prompt brief**: `.github/prompts/executing-work.prompt.md` — the canonical task description
- **Playbook**: `.agents/skills/executing-work-syncvia/SKILL.md` — phase-by-phase operational guidance

Both are plain Markdown and can be read by any agent regardless of platform.

---

## Five-Phase Pipeline

### Phase 1 — Intake & Planning

1. Parse the input (free-form description, Linear issue ID `SV-NNN`, or existing prompt file path).
2. Read `AGENTS.md` for authoritative architecture rules and current priorities.
3. Read the relevant area `AGENTS.md` (`backend/`, `desktop/`, `frontend/`).
4. Run `pnpm current-work:sync`, then check `.current-work/queue.md` for active work that may conflict with the files you plan to touch.
5. Produce a phased implementation plan with: goal, files to modify, acceptance criteria, and validation steps.

**Exit gate**: plan exists and is conflict-free per the canonical `.current-work` ledger.

### Phase 2 — Prompt Optimization

1. If no execution prompt exists yet, generate one following the template in `.github/prompts/copilot-create-prompt.prompt.md`.
2. Create or confirm a companion Linear issue using the workflow in `.github/prompts/creating-managing-linear-issues.prompt.md`.
3. The prompt and issue must be detailed enough for an agentic coder to complete the work without further clarification.

**Exit gate**: execution prompt on disk + Linear issue confirmed.

### Phase 3 — Implementation

1. Create or update a canonical `.current-work` ledger entry **before writing any code** (see [Parallel Safety](#parallel-safety) below).
2. Create a git worktree for isolated execution — load and follow **`.agents/skills/using-git-worktrees-syncvia/SKILL.md`** then **`.agents/skills/syncing-worktree-env-syncvia/SKILL.md`** (see [Git Branching](#git-branching)). Running `syncing-worktree-env-syncvia` is mandatory for every new worktree.
3. Load and follow **`.agents/skills/developing-with-tests-syncvia/SKILL.md`** before writing any new feature or bug-fix code (RED-GREEN-REFACTOR).
4. If the plan has 2+ independent tasks and subagents are available, load **`.agents/skills/dispatching-parallel-agents-syncvia/SKILL.md`** and dispatch one subagent per task. If tasks are sequential, load **`.agents/skills/developing-with-subagents-syncvia/SKILL.md`** instead. If subagents are unavailable, load **`.agents/skills/executing-plans-syncvia/SKILL.md`** and proceed inline.
5. If any test or validation fails during implementation, load **`.agents/skills/debugging-systematically-syncvia/SKILL.md`** and diagnose the root cause before patching.
6. Run incremental validation after each logical change.

**Exit gate**: all plan acceptance criteria met, no new lint/type/test errors introduced.

### Phase 4 — Validation & UAT

Run the full validation suite:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm exec lefthook run pre-commit
```

Zero new errors, warnings, or test failures are required. If validation fails, fix the root cause and re-run — never suppress errors.

**Exit gate**: all four commands exit cleanly.

### Phase 5 — Commit & Closeout

1. Commit with conventional commit messages including `Agent:` and `Model:` footer trailers.
2. Trust the worktree mise config: `mise trust <worktree-path>/mise.toml`
3. Set env vars to prevent pre-push hook telemetry hangs: `export SEMGREP_SEND_METRICS=off SEMGREP_METRICS=off`
4. Push the branch to origin by default after validation and commit. Do not push if the user explicitly requested local-only work, validation is failing, secrets are implicated, or the push would require force-pushing / rewriting published history / destructive remote changes.
5. Open a PR: `gh pr create --base dev` with summary, `Closes SV-NNN`, agent/model identity, and validation results.
6. Verify the Linear issue is linked to the PR/commit; if auto-linking failed, manually repair the link and re-verify.
7. Remove or close the canonical `.current-work` ledger entry.
8. Delete one-off prompts (`_oneoff` suffix) created during Phase 2.

**Exit gate**: PR open, Linear issue linkage verified (automation-ready), ledger entry removed or closed.

---

## Parallel Safety

Multiple agents may run concurrently in this repo. These rules prevent conflicting edits:

### Before starting

1. Run `pnpm current-work:sync` and read `.current-work/queue.md`.
2. If any file you plan to modify appears in another active entry's `touchedSurfaces` list — **stop and report the conflict**. Do not silently proceed.
3. Create or update one canonical ledger entry with `pnpm current-work:claim` **before writing any code**.

### While working

- Only modify files in your ledger entry's `touchedSurfaces` list. Update the entry first if you discover you need additional files.
- **Never use `git add .`, `git add -A`, or `git add <directory>/`**. Always stage files individually: `git add path/to/specific/file.ts`.
- **Never run `git stash`** — it discards ALL modified files in the working tree, including other agents' uncommitted work.
- **Never run `git checkout -- <file>` or `git restore <file>`** on files you did not modify.
- If validation (`pnpm typecheck`, `pnpm lint`, `pnpm test`) fails on files outside your ledger entry, note them as pre-existing and continue if your own changes pass.

### When committing

- Verify staged files with `git diff --cached --name-only` — must be a subset of your ledger entry's `touchedSurfaces`.
- Never commit files outside your ledger entry without updating the entry first.

---

## Git Branching

### Protected branches

`main` and `dev` are **protected** — never commit product code directly to them.

**Product code changes** include any modification to `backend/src/`, `desktop/src/`, `frontend/src/`, `packages/`, database schema, or migrations. These always require a feature/fix branch.

**Infrastructure-only changes** (agent files, prompt files, instructions, docs, CI config, `.current-work/`) may be committed directly to the current branch.

### Creating a branch

```bash
# Always branch from dev explicitly (never from implicit HEAD)
git checkout -b feature/SV-NNN-short-description dev
```

Run the **Pre-Branch Safety Check** first:

1. `git diff --name-only HEAD` returns only files in your plan.
2. No other canonical ledger entry has `status: active`.

### Worktrees (mandatory for parallel product code work)

For parallel product code work, use `git worktree` to get a fully isolated working directory:

```bash
GIT_BRANCH_NAME="feature/sv-NNN-short-description"   # use Linear's gitBranchName exactly
WORKTREE_PATH="../syncvia-${GIT_BRANCH_NAME//\//-}"   # sibling of repo root, slashes flattened

git worktree add "${WORKTREE_PATH}" -b "${GIT_BRANCH_NAME}" dev
```

- Worktrees live as **siblings of the repo root** (e.g. `../syncvia-feature-sv-343-my-work`), not inside the repo.
- Use `git -C "${WORKTREE_PATH}"` for all git operations from any directory.
- Record `worktreePath` (absolute path) and `branch` in your canonical `.current-work` ledger entry.

### Branch naming

| Type                   | Example                                     |
| ---------------------- | ------------------------------------------- |
| Feature (Linear issue) | `feature/sv-333-session-lifecycle-watchdog` |
| Fix (Linear issue)     | `fix/sv-284-aec-echo-gating`                |
| Ad hoc (no issue)      | `feature/backend-vector-cache`              |

Use the exact `gitBranchName` field from Linear when a Linear issue exists.

### Commit messages

Every agent-made commit must follow conventional commits and include agent identity trailers:

```
feat(backend): add audio diagnostics endpoint

Refs: SV-339
Agent: your-agent-name
Model: your-model-name
```

---

## `.current-work` Directory

The `.current-work/` directory renders a **shared coordination ledger** for active implementation work. The source of truth is a single JSON ledger in the Git common directory, so every worktree reads and writes the same active-work state.

### Key files

| Path / command                              | Purpose                                                                    |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| `pnpm current-work:ledger:path`             | Prints the canonical shared ledger path for this checkout or worktree.      |
| `.current-work/queue.md`                    | Local auto-generated overview of all active and proposed lanes. Read first. |
| `pnpm current-work:claim`                   | Creates, updates, or removes one canonical ledger entry.                    |
| `.current-work/templates/claim-template.md` | Example `current-work:claim` command and ledger entry shape.                |
| `.current-work/claims/`                     | Legacy import-only compatibility directory. Do not create new claims.       |

### Ledger entry lifecycle

```
proposed → active → ready-for-validation → done (→ archived)
                 ↘ blocked
                 ↘ handoff-needed
```

A ledger entry must be `active` while you are implementing. Transition it to `ready-for-validation` when code is done and you are running the validation suite. Set it to `done` or remove it after the PR is open and the Linear issue is closed.

### Sync command

After editing the canonical ledger:

```bash
pnpm current-work:sync
```

This regenerates `queue.md` from the shared ledger. If no ledger exists yet, sync can import legacy local claim files once; after the ledger exists, local claim files are ignored for queue generation.

---

## Linear Issue Tracking

All trackable implementation, bug-fix, and remediation work must be tied to a Linear issue in the `SyncVia` team.

- **Search before creating**: use your Linear MCP tools to check for existing issues before creating a new one.
- **Update as you go**: post phase-transition status comments so other agents and humans know the current state.
- **Closeout via linking automation**: include `Closes SV-NNN` in PR title/body (or equivalent linking path), verify the PR/commit is attached to the Linear issue, and manually repair linking if automatic linking fails.

If you don't have Linear MCP tool access, record the issue state in the `.current-work` ledger entry's `validationSummary` and ask the user to update Linear manually.

---

## Tool Access by Agent Platform

The workflow described in this file works across platforms. Platform-specific wiring:

| Capability                         | GitHub Copilot                  | Cursor                | Claude Code           | Codex / other         |
| ---------------------------------- | ------------------------------- | --------------------- | --------------------- | --------------------- |
| Read `.github/agents/*.md`         | Native via `agent:` frontmatter | Read as Markdown      | Read as Markdown      | Read as Markdown      |
| Read `.github/prompts/*.prompt.md` | Native via slash commands       | Read as Markdown      | Read as Markdown      | Read as Markdown      |
| Read `.agents/skills/*/SKILL.md`   | Native skill loading            | Read as Markdown      | Read as Markdown      | Read as Markdown      |
| `.current-work/` coordination      | Shared JSON ledger + Markdown queue | Shared JSON ledger + Markdown queue | Shared JSON ledger + Markdown queue | Shared JSON ledger + Markdown queue |
| Linear MCP tools                   | Via `tool_search`               | Via MCP server config | Via MCP server config | Via MCP server config |
| `gh` CLI for PRs                   | Via terminal                    | Via terminal          | Via terminal          | Via terminal          |

For any platform, the files in `.github/agents/`, `.github/prompts/`, and `.agents/skills/` are **plain Markdown** that can be read directly. Copilot-specific frontmatter fields (e.g. `agent:`, `argument-hint:`, `handoffs:`) are metadata — ignore them if your platform doesn't support them and focus on the Markdown body.

### OpenAI Codex usage

Codex does not need a copied `.codex` version of this infrastructure. Its native entrypoint is `AGENTS.md`; from there it should read and reuse the same `.github` files as every other agentic tool.

When operating in Codex:

1. Use `.github/agents/README.md` and `.github/agents/task-router-syncvia.md` for specialist selection.
2. Use `.agents/skills/README.md` and the relevant `.agents/skills/*/SKILL.md` file for repo-local workflow mechanics.
3. Use `.github/prompts/*.prompt.md` as task briefs when the user references a prompt path or when the selected workflow points to one.
4. Use `.github/instructions/path-specific.instructions.md` as the path-to-rules index before editing files.
5. Interpret agent "handoffs" as instruction routing by default: read the target specialist file and apply it inline. Only launch Codex sub-agents when the user explicitly asks for sub-agents, delegation, or parallel agent work.
6. Keep updates non-destructive: if Codex discovers stale agent/prompt/skill routing, update the shared `.github` indexes and `AGENTS.md` bridge instead of creating divergent Codex-only copies.

---

## Quick Start for Non-Copilot Agents

To execute a unit of work autonomously:

1. **Read this file** (done).
2. **Read `AGENTS.md`** — architectural rules, current priorities, and non-negotiables.
3. **Run `pnpm current-work:sync` and read `.current-work/queue.md`** — check what's already active.
4. **Read `.agents/skills/executing-work-syncvia/SKILL.md`** — the operational playbook.
5. **Read `.github/prompts/executing-work.prompt.md`** — the canonical task brief (ignore the YAML frontmatter).
6. **Follow the five phases** above, creating a canonical `.current-work` ledger entry before writing any code.

If you have Linear MCP access, also read `.agents/skills/managing-managing-linear-projects-mcp/SKILL.md` for the authoritative tool surface.

---

## Completion Definition

Work is **done** when all of the following are true:

- [ ] All acceptance criteria in the plan are met
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `lefthook run pre-commit` pass with zero new errors
- [ ] Changes are committed with conventional messages including `Agent:` and `Model:` trailers
- [ ] A git worktree was used for product code changes
- [ ] A PR is open targeting `dev` with summary, `Closes SV-NNN`, agent/model identity, and validation results
- [ ] Linear issue ↔ PR/commit linking is verified (manual link fallback used if auto-linking failed)
- [ ] The `.current-work` ledger entry is removed or marked `done`
- [ ] One-off prompts (`_oneoff` suffix) are deleted
- [ ] Worktree cleanup is scheduled after merge confirmation

Work is **blocked** when a phase gate fails after two retry attempts. Report the exact blocker, the last successful phase, and what would unblock it — do not silently proceed past a failure.
