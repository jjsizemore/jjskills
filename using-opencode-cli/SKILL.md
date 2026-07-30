---
name: using-opencode-cli
description: 'Use when invoking the opencode CLI (`opencode run`) as an external coding agent for antagonistic cross-model review, debugging, implementation checks, or parallel investigation.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: General cross-repo CLI skill; repo-local skills with the
    same name may override it. Peer of `using-claude-cli-agent`, `using-codex-cli-agent`,
    and `using-antigravity-agy-cli`.
---

# Using opencode CLI

Use this skill when invoking the **opencode CLI** as a separate coding agent for
review, debugging, implementation checks, or parallel investigation.

opencode is provider-agnostic: one CLI can run models from many providers
(`opencode-go/*`, `openai/*`, `anthropic/*`, local, etc.). This makes it
especially useful for **antagonistic cross-model review**, where the reviewer
must be independent from the agent that produced the work — pick a different
provider/model, not just a different CLI.

## Guidance

- Confirm the trigger matches the current task before applying this workflow.
- Keep the work scoped to the named capability and prefer narrower repo-local
  overrides when present.
- Preserve relevant evidence, commands, paths, and validation results in the
  final handoff (session ID, model, head SHA, exit code).
- Update this skill with more specific guidance when a repeatable failure mode
  or workflow detail emerges.

## Prerequisites

```bash
opencode --version          # confirm installed
opencode auth list          # confirm at least one provider credential present
opencode models             # list available provider/model IDs
```

If `opencode auth list` is empty, run `opencode auth login` and pick a provider
(or export the provider API key in the environment / `.env`). Models are listed
in `provider/model` form (e.g. `openai/gpt-5.5-pro`, `opencode-go/glm-5.2`).

## Core Invocation: Non-Interactive `run`

`opencode run` is the scripting/automation entrypoint. It executes a prompt and
exits — no TUI. This is the shape to use when opencode is the **external**
reviewer/debugger dispatched by another agent.

```bash
opencode run --dir /path/to/repo "Review the diff at HEAD for correctness bugs."
```

Key flags (confirmed via `opencode run --help`):

| Flag | Purpose |
| --- | --- |
| `-m, --model provider/model` | Pick the model. **Use a different provider/model than the work's author for antagonistic review.** |
| `--agent <name>` | Use a built-in (`build`, `plan`, `general`, `explore`, `scout`) or custom agent. `plan` is read-only. |
| `-f, --file <path>` | Attach file(s) (diff, spec, log) to the message. Repeatable. |
| `--format json` | Emit raw JSON events instead of formatted text — parse for provenance/structured capture. |
| `--dir <path>` | Working directory. opencode reads that repo's `AGENTS.md` and skills. |
| `-c, --continue` / `-s, --session <id>` / `--fork` | Continue or fork a prior session (multi-turn review). |
| `--attach http://host:port` | Attach to a running `opencode serve` to skip MCP cold-boot per run. |
| `--variant high\|max\|minimal` | Provider-specific reasoning effort. |
| `--thinking` | Surface thinking blocks in output. |
| `--title <text>` | Title the session (defaults to truncated prompt). |
| `--print-logs --log-level DEBUG` | Debug invocation failures. |
| `--pure` | Run without external plugins (isolate behavior). |

## Antagonistic Cross-Model Review

This is the primary reason to reach for opencode over a single-provider CLI.
The reviewer's independence comes from a **different model**, so choose
deliberately:

```bash
# Orchestrator produced work with opencode-go/glm-5.2.
# Dispatch an independent reviewer on a different provider:
opencode run --dir "$REPO" -m openai/gpt-5.5-pro --agent plan \
  --format json \
  "You are a hostile merge gate. Review HEAD vs its base for correctness bugs, \
missing regression guards, stale docs, and architecture violations. \
Classify each finding Blocking / Advisory / Question / No issue. \
Base SHA: $BASE_SHA  Head SHA: $HEAD_SHA." \
  > /tmp/opencode-review.json
```

Selection rules:

- Match a **different provider** from the work's author when possible
  (`openai/*` vs `opencode-go/*`), not just a different model on the same
  provider.
- Prefer the provider with the most remaining usage budget when multiple are
  available (see `opencode stats`).
- For read-only review, use `--agent plan` (file edits and bash default to
  `ask`) or a custom read-only agent. See the permissions section below.
- Pass base/head SHAs, changed surfaces, validation already run, and known
  rejected/deferred feedback in the prompt so the reviewer does not restate
  resolved items.
- A review pass only counts for the exact head it inspected. After any push,
  re-run on the new head.

## Permissions In Non-Interactive Mode

`opencode run` cannot answer interactive `ask` prompts — an `ask` permission
will **block/hang** the run. Two safe recipes:

1. **Read-only review (preferred for antagonistic review):** define a custom
   read-only agent and pair it with `--dangerously-skip-permissions`. The flag
   only auto-approves `ask` items; **`deny` stays denied**, so edits/bash remain
   impossible even though other `ask` tools auto-approve.

   `~/.config/opencode/agents/review.md`:
   ```markdown
   ---
   description: Read-only antagonistic code reviewer
   mode: subagent
   permission:
     edit: deny
     bash:
       "*": deny
       "git diff*": allow
       "git log*": allow
       "git show*": allow
       "rg *": allow
     webfetch: deny
   ---
   Review only. Never edit files. Classify findings Blocking/Advisory/Question/No issue.
   ```
   ```bash
   opencode run --dir "$REPO" -m openai/gpt-5.5-pro --agent review \
     --dangerously-skip-permissions --format json "..." > /tmp/review.json
   ```

2. **Implementation/debugging that needs write or bash:** pre-configure the
   needed permissions to `allow` in `opencode.json` / a custom agent, then pass
   `--dangerously-skip-permissions` so remaining `ask` items auto-approve. Never
   use `--dangerously-skip-permissions` with a full-tool agent on work you do
   not want changed — scope the agent's permissions first.

`--dangerously-skip-permissions` is safe only when the things you do not want
(run edits, arbitrary bash) are explicitly `deny` in the selected agent's
permissions. Otherwise it auto-approves everything not denied.

## Repo Awareness

When `--dir` points at a git repo, opencode automatically reads that repo's
`AGENTS.md` and discovers skills from `.opencode/skills/`, `.claude/skills/`,
and `.agents/skills/` (project + global). A dispatched reviewer therefore
inherits the repo's architecture rules and can load repo skills — useful for
context-enriched review, but remember it shares repo context with the
orchestrator. Independence comes from the model, not from context isolation.

## Throughput: `serve` + `attach`

Starting MCP servers on every `run` is expensive. For repeated dispatches, start
one headless server and attach each run to it:

```bash
opencode serve --port 4096 --hostname 127.0.0.1 &   # once
opencode run --attach http://127.0.0.1:4096 -m openai/gpt-5.5-pro "..."
```

`opencode serve` and `opencode web` both expose the attach surface. Set
`OPENCODE_SERVER_PASSWORD` for basic auth on shared hosts.

## PR Review Shortcut

`opencode pr <number>` fetches and checks out a PR branch, then starts opencode
in that repo — convenient for ad-hoc PR review. For scripted antagonistic review
of a specific SHA range, prefer `opencode run --dir` with explicit base/head
SHAs in the prompt.

## Provenance Capture

Record enough to audit the review later:

```bash
opencode session list --format json        # find the review session ID
opencode export <sessionID> --sanitize     # export transcript (redact secrets)
```

Minimum provenance for a review handoff: opencode CLI version, session ID,
`provider/model` used, `--agent` used, repo + head SHA reviewed, classification
of findings, and the resolving commit SHA when applicable.

## Dispatch As An External Agent

When another skill (e.g. `orchestrating-external-agents`,
`refining-prs-iteratively`, `refining-work-iteratively`, or a repo
`requesting-code-review` override) needs an independent reviewer, opencode is
one option alongside `using-claude-cli-agent`, `using-codex-cli-agent`, and
`using-antigravity-agy-cli`. Prefer opencode when you need a **specific
independent model** that the other CLIs do not expose, or when you want one CLI
that can fan out across several providers.

## Red Flags

- Running `opencode run` without `--dangerously-skip-permissions` while the
  selected agent has `ask` permissions — the run hangs waiting for a prompt no
  one can answer.
- Using `--dangerously-skip-permissions` with `--agent build` (all tools
  allowed) on a repo you do not want modified.
- Counting an `opencode-go/glm-5.2` review of `opencode-go/glm-5.2` work as
  independent. Same model is not independent; switch provider/model.
- Reusing a clean review after a new push. Re-run on the latest head.
- Letting the reviewer restate already-fixed or already-rejected items because
  the prompt omitted prior resolution state.
- Dispatching without `--dir` when repo context matters, or assuming context
  isolation when the reviewer actually inherits the repo's `AGENTS.md`.
