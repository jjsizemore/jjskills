---
name: using-opencode-cli
description: 'Use when invoking the opencode CLI (`opencode run`) as an external coding agent for antagonistic cross-model review, debugging, implementation checks, or parallel investigation.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: General cross-repo CLI skill; repo-local skills with the
    same name may override it.
---

# Using opencode CLI

Use this skill when invoking the **opencode CLI** as a separate coding agent for
review, debugging, implementation checks, or parallel investigation.

opencode supports models from many providers and local routes. Reviewer
independence comes from a capable reviewer distinct from the author and
an independent read of the immutable subject; provider or model diversity
may help but is not required.

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
```

Use an already configured, authorized route. If invocation fails because access
is unavailable, report that exact boundary; do not enumerate provider quotas,
change credentials, or expose secrets to select another route.

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
| `-m, --model provider/model` | Optionally select a model; provider/model choice does not establish review independence. |
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

## Independent Review

When a capable independent reviewer is needed, pass the actual base/head and
complete relevant caller context. Provider/model diversity is optional; do not
add a second review or probe routes unless evidence shows the current reviewer
lacks required capability or independence.

```bash
opencode run --dir "$REPO" --agent plan \
  --format json \
  "Review HEAD vs its base for correctness bugs, missing regression guards, \
stale docs, and architecture violations. Classify findings Blocking/Advisory/Question/No issue. \
Base SHA: $BASE_SHA  Head SHA: $HEAD_SHA." \
  > /tmp/opencode-review.json
```

- For read-only review, use `--agent plan` or a custom read-only agent.
- Pass base/head SHAs, changed surfaces, validation already run, and known
  rejected/deferred feedback so review binds to the intended subject.
- A review counts only when the reviewer independently reads the actual
  immutable subject and relevant context. Refresh for changed source/context
  or material findings, not commit-only metadata.

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
   opencode run --dir "$REPO" --agent review \
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
orchestrator. Independence comes from a distinct, capable reviewer reading
the subject, not provider/model or context isolation.

## Throughput: `serve` + `attach`

Starting MCP servers on every `run` is expensive. For repeated dispatches, start
one headless server and attach each run to it:

```bash
opencode serve --port 4096 --hostname 127.0.0.1 &   # once
opencode run --attach http://127.0.0.1:4096 "..."
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

When another skill (e.g. `orchestrating-external-agents`, `monitoring-prs-and-autofixing`, or a repo `requesting-code-review` override) needs an independent reviewer, opencode provides a flexible route. Use any already-authorized capable reviewer; provider diversity is optional.

## Red Flags

- Running `opencode run` without `--dangerously-skip-permissions` while the
  selected agent has `ask` permissions — the run hangs waiting for a prompt no
  one can answer.
- Using `--dangerously-skip-permissions` with `--agent build` (all tools
  allowed) on a repo you do not want modified.
- Counting the author's own self-review as independent. The reviewer must be
  distinct and inspect the actual subject; a different provider/model alone
  does not establish independence.
- Reuse source review when the immutable source and relevant context are unchanged; required hosted checks and approvals still bind to the current PR head/base.
- Letting the reviewer restate already-fixed or already-rejected items because
  the prompt omitted prior resolution state.
- Dispatching without `--dir` when repo context matters, or assuming context
  isolation when the reviewer actually inherits the repo's `AGENTS.md`.
