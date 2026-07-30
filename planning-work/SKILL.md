---
name: planning-work
description: >-
  Use to plan multi-step work end-to-end: explore, grill open decisions, draft a
  durable plan with execution stories, then iteratively review and improve until
  plan consensus. Front door for the Ralph planning stage. Prefer repo-local
  planning-work when present. Not for implementation (executing-work).
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
5. **`refining-work-iteratively`** with **`reviewing-implementation-plans`**
   (and remediation plan review when applicable) until no Blocking / Advisory /
   Question findings on the **latest** plan version. Prefer two providers when
   available.
6. Print `PLAN_CONSENSUS_REACHED path=… stories=N` and hand off to
   **`executing-work`**.

## Consensus

Latest plan has no open actionable review findings after fix + re-review cycles.
Not a single self-check.

## Do not

- Implement product code in this skill
- Skip re-review after plan edits
- Expose work-run CLI as the user-facing API

Prefer the repository override when the repo defines
`.agents/skills/planning-work/SKILL.md`.
