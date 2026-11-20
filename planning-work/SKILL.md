---
name: planning-work
description: >-
  Route work under the portable contract's plan-first rule: execute routine work
  directly; plan and review to consensus only for multi-step or risky work.
  Front door for the Ralph planning stage. Prefer repo-local planning-work when present.
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable planning controller; repos may override.
---

# Planning Work — front door

**User API:** invoke **planning-work** only. Leaves are internal.

## Plan-first routing

The [portable contract](../references/autonomous-completion-contract.md#plan-first-rule-canonical)
is canonical:

Execute directly when facts and authority are sufficient. Require a written plan and review-to-consensus only for multi-step or risky work: multi-surface, cross-boundary, release-sensitive, a concrete review trigger present, or genuine unknowns a plan must resolve.

For routine work, route directly to execution within existing authority; skip the
planning workflow below. Planning-only requests remain planning-only.

## Workflow (when a plan is required)

1. **Explore** repo facts before questions.
2. **`grill-me`** only for true unknowns (one Q at a time).
3. Design/spec when missing (repo brainstorming/spec skills if present).
4. **`writing-plans`** → durable plan + **Execution stories**.
5. **`refining-work-iteratively`** with **`reviewing-implementation-plans`**
   (and remediation plan review when applicable), using the
   [portable completion contract](../references/autonomous-completion-contract.md)
   for review scope, capability, evidence reuse and convergence.
6. Report the plan path, execution stories and review disposition; continue through
   **`executing-work`** under existing execution authority, without a new approval.
   If authority is planning-only, return the plan without implementation.

## Consensus

Sufficient independent review supports the current plan under the contract's
evidence bindings. Retain matching proof; a status phrase is not execution
authority or a separate approval gate.

## Do not

- Implement product code in the planning workflow; route routine work directly to execution
- Reuse review after a material change invalidates its coverage
- Expose work-run CLI as the user-facing API

Prefer the repository override when the repo defines
`.agents/skills/planning-work/SKILL.md`.
