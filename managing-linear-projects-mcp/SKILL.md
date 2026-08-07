---
name: managing-linear-projects-mcp
description: 'Use when managing Linear issues, projects, comments, statuses, or planning metadata through available MCP tools.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: General cross-repo skill; repo-local skills with the same
    name may override it.
---

# Managing Linear Projects Mcp

Use this skill when managing Linear issues, projects, comments, statuses, or planning metadata through available MCP tools.

## Guidance

- Confirm the trigger matches the current task before applying this workflow.
- **Mandatory issue rationale**: For every Linear issue created or updated through MCP, apply the `creating-linear-issues` contract and include a clear Why / Rationale explaining why the work is needed.
- **ADR boundary**: When an architectural decision is made and alternatives or tradeoffs are evaluated, apply the `creating-linear-issues` ADR requirement and require an ADR containing decision, alternatives considered, tradeoffs, and rationale. Routine/non-architectural changes do not require an ADR.
- Keep the work scoped to the named capability and prefer narrower repo-local overrides when present.
- Preserve relevant evidence, commands, paths, and validation results in the final handoff.
- Update this skill with more specific guidance when a repeatable failure mode or workflow detail emerges.
