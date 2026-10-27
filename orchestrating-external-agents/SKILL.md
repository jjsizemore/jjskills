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

- Select review capability and independence under the
  [portable completion contract](../references/autonomous-completion-contract.md).
  A different CLI, model or provider is a tool choice, not an extra review gate.
- Prefer the provider with the most remaining usage budget when multiple are
  available. Do not block on a depleted provider when another CLI can run.
- Run external agents non-interactively, capture output to a file, and record
  provenance (agent, model, session/invocation ID, head SHA, findings).
- Retain sufficient source review under the contract's evidence bindings;
  required hosted checks and approvals still cover the actual PR head.
- If required review capability is unavailable, block only its dependent action
  and report the exact missing coverage.
