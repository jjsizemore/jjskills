---
name: writing-hooks
description: 'Use when creating, editing, testing, validating, symlinking, or publishing agent-runtime hooks for Codex, Claude, Antigravity, Gemini, Copilot, Cursor, or similar coding agents.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: General cross-agent hook authoring guide; repo-specific hook commands belong in repo-local overrides.
---

# Writing Hooks

Use this skill when creating, editing, testing, validating, symlinking, or publishing agent-runtime hooks for Codex, Claude, Antigravity, Gemini, Copilot, Cursor, or similar coding agents.

## Goal

Agent hooks should tighten the feedback loop at the moment an agent can still act: before unsafe tool use, immediately after tool output, before commit/push/PR closeout, and at session stop. A good hook gives the agent a precise failure boundary, the smallest next command, and a clear unblock path.

## Canonical Placement

- Put user-level hook source in `~/.agents/hooks/<hook-name>/`.
- Put repo-specific hook source in `<repo>/.agents/hooks/<hook-name>/`.
- Treat runtime directories such as `~/.codex/hooks`, Claude settings hook commands, Antigravity/Gemini knowledge or command surfaces, Cursor, Copilot, Goose, Roo, and similar directories as adapters or symlink targets.
- Do not fork the same hook logic across agent runtimes. Keep one canonical implementation and add thin runtime adapters.
- Do not cross user and repo scopes by default. User-level hooks may symlink into user-level tool directories; repo-level hooks may symlink into repo-local tool directories. Cross-scope links require an explicit reason in the hook docs.

## Hook Anatomy

Each hook should include:

- `HOOK.md` or `README.md`: purpose, trigger events, target agents, blocking/advisory behavior, expected payload, outputs, timeout, and rollback/removal path.
- `bin/` or `scripts/`: the executable hook logic.
- `adapters/`: runtime-specific config snippets or wrappers for Codex, Claude, Antigravity, Gemini, Copilot, Cursor, etc.
- `fixtures/`: representative payloads for every supported event/runtime.
- `tests/`: fast tests for the hook's decision logic, payload parsing, failure copy, and symlink assumptions.

## Authoring Workflow

1. Identify the agent-output failure you are trying to prevent.
   - Example: skipped validation, unsafe `--no-verify`, stale branch context, missing regression tests, malformed PR body, unclassified errors.
2. Choose the earliest hook boundary that can catch it without noise.
   - Pre-tool hooks block high-confidence unsafe commands.
   - Post-tool hooks summarize failures and suggest the next exact command.
   - Stop/session-end hooks verify closeout duties such as commit, push, PR, or ledger cleanup.
   - Session-start hooks hydrate context, record baseline state, and surface repo-specific prerequisites.
3. Verify the current runtime schema before writing adapters.
   - Codex commonly reads hooks from `~/.codex/config.toml` and can execute scripts under `~/.codex/hooks`.
   - Claude commonly reads hooks from `~/.claude/settings.json`.
   - Antigravity/Gemini surfaces vary; inspect the local config and official/runtime docs before assuming hook support.
4. Write one canonical implementation with a stable stdin/stdout/exit-code contract.
5. Add adapters or symlinks from each runtime surface back to the canonical implementation.
6. Test the hook with realistic payload fixtures and the exact commands the agent runtime will execute.
7. Document how to disable, bypass for emergencies, and repair stale symlinks.

## Quality Bar

- Hooks must be deterministic, fast, and quiet when there is no action to take.
- Blocking hooks must have low false-positive risk and must tell the agent exactly how to recover.
- Advisory hooks should not fail the session. They should emit concise, actionable feedback.
- Error output must include the failing boundary, evidence, and next command. Avoid generic "validation failed" copy.
- Never read secrets into logs. Redact tokens, credentials, URLs with credentials, and private env values.
- Avoid network calls unless the hook's purpose explicitly requires live remote state.
- Use timeouts. Slow hooks train agents and users to disable hooks.
- Make platform assumptions explicit: shell, path layout, executable name, file permissions, and supported OS.

## Testing

Before publishing a hook:

- Run the hook directly with sample payloads for success, advisory failure, blocking failure, missing fields, malformed JSON, non-git directories, dirty worktrees, and unsupported runtimes.
- Validate symlinks resolve to the canonical implementation.
- Run language checks: `python3 -m py_compile`, `node --test`, `shellcheck`, or the equivalent for the hook language.
- If the hook wraps repo validation, run the exact wrapped command and include a fixture for command failure output.
- Confirm the hook behaves safely when invoked from a different repo, a detached worktree, and a directory outside git.

## Symlink Checklist

- [ ] Canonical implementation exists under `~/.agents/hooks` or `<repo>/.agents/hooks`.
- [ ] Runtime adapter path is a symlink or tiny wrapper, not a copy of the logic.
- [ ] The symlink is relative when both source and target are under the same home or repo tree.
- [ ] Existing non-symlink files are not overwritten without an explicit migration plan.
- [ ] A check command verifies every symlink target exists.
- [ ] Final handoff names the canonical path, adapter paths, validation commands, and any runtime restart needed.

## Red Flags

Stop and revise the hook design if you notice:

- The hook only reports a problem after the agent can no longer fix it.
- The hook duplicates long logic across Codex, Claude, Antigravity, or other runtimes.
- The hook blocks on a noisy heuristic instead of a stable failure signal.
- The hook says what is wrong but not what command or file fixes it.
- The hook depends on undocumented local state without documenting and testing that dependency.
- The hook makes agents wait on remote services for ordinary local closeout.
