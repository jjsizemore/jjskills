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

## External Agent Delegation

1. **Capability & independence**: When delegating review, debugging, or checks to an external CLI agent, select an available capable route. For antagonistic review, use a model distinct from the implementation author.
2. **Provider neutrality**: Dispatch via available CLI routes (`opencode run`, local harness CLI). Do not block on an unavailable route when an equivalent capable provider is allowed.
3. **Native boundaries**: Bounded handoffs transfer exact task, inputs, and criteria; they never transfer gated actuation, leases, or bypass signer/safety gates.
4. **Provenance**: Run non-interactively, save output to an artifact, and record tool, model, invocation ID, checked SHA, and findings. Reviews bind the exact head inspected.
