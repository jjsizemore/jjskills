---
name: planning-work
  Use to plan multi-step work end-to-end: explore, resolve open decisions, draft a
  durable plan with execution stories, and review for feasibility. Front door for
  the planning stage. Prefer repo-local planning-work when present. Not for implementation.
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable planning controller; repos may override.
---

# Planning Work — front door

**User API:** invoke **planning-work** only. Leaves are internal.

## Workflow

1. **Explore** repo facts before questions.
2. **`grill-me`** only for true unknowns (one Q at a time).
3. Design/spec when missing (repo brainstorming/spec skills if present).
4. **`writing-plans`** → durable plan + **Execution stories**.
5. **Review** with **`reviewing-implementation-plans`** until blocking findings are resolved.
6. Hand off to execution.

## Do not

- Implement product code in this skill
- Skip re-review after plan edits
- Expose work-run CLI as the user-facing API

Prefer the repository override when the repo defines
`.agents/skills/planning-work/SKILL.md`.
