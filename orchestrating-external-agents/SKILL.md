---
name: orchestrating-external-agents
description: 'Use when delegating work to a separate CLI coding agent or model for review, debugging, implementation checks, or parallel investigation.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: General cross-repo skill; repo-local skills with the same
    name may override it.
---

# Orchestrating External Agents

Use this skill when delegating work to a separate CLI coding agent or model for review, debugging, implementation checks, or parallel investigation.

## Guidance

- Confirm the trigger matches the current task before applying this workflow.
- Keep the work scoped to the named capability and prefer narrower repo-local overrides when present.
- Preserve relevant evidence, commands, paths, and validation results in the final handoff.
- Update this skill with more specific guidance when a repeatable failure mode or workflow detail emerges.

## External CLI Agent Options

Dispatch to one of the peer CLI-agent skills. Each wraps a different coding agent:

- `using-opencode-cli` — opencode CLI (`opencode run`). Provider-agnostic: one
  CLI runs many providers (`opencode-go/*`, `openai/*`, `anthropic/*`, local).
  Best when you need a **specific independent model** the other CLIs do not
  expose, or one CLI that fans out across providers. Use `-m provider/model` to
  pick the reviewer model and `--agent plan` (or a custom read-only agent) for
  review.
- `using-claude-cli-agent` — Claude Code CLI.
- `using-codex-cli-agent` — OpenAI Codex CLI.
- `using-antigravity-agy-cli` — Google Antigravity `agy` CLI.

## Choosing

- For **antagonistic review**, independence comes from a different model, not
  just a different CLI. Pick a provider/model distinct from the one that
  produced the work. opencode is the natural choice when the orchestrator's
  model is available on opencode's same provider — switch to a different
  provider via `-m` (e.g. `openai/gpt-5.5-pro` to review `opencode-go/glm-5.2`
  work).
- Prefer the provider with the most remaining usage budget when multiple are
  available. Do not block on a depleted provider when another CLI can run.
- Run external agents non-interactively, capture output to a file, and record
  provenance (agent, model, session/invocation ID, head SHA, findings).
- A review pass only counts for the exact head it inspected; re-dispatch after
  any push.
- When no second independent reviewer source exists and the user does not accept
  that limitation, report a blocker — do not call clean.
