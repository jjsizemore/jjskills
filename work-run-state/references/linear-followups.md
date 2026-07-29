# Linear follow-ups (file when API available)

SyncVia Linear drafts for portable spine program. Create as issues; paste IDs into the plan.

## Epic: Remove `.current-work` coordination ledger

**Title:** Remove `.current-work`; use worktrees + `.agents/runs/` only

**Why:** Parallel same-worktree coordination is obsolete; dual ledgers fight the new execute/resume spine.

**Acceptance:**
- Inventory complete (scripts, skills, EXECUTION.md, agents, lefthook, cursor rules)
- No required gate calls `pnpm current-work:*` from executing-work/resuming-work
- Scripts/tests removed or archived; AGENTS.md migration note
- Regression: parallel work documented as worktree-per-lane only

**Touchpoints (inventory seed):**
- scripts/current-work-state-machine.mjs (+ tests)
- package.json current-work scripts
- EXECUTION.md, AGENTS.md, lefthook.yml
- .cursor/rules/002-syncvia-current-work.mdc
- .agents/agents/work-executor-syncvia.md
- .github/prompts/execute-work*.prompt.md, current-work-agent-coordination-system.prompt.md
- .agents/instructions/parallel-work-coordination.instructions.md

## Optional later

- User-global run index (discovery only)
- Optional Stop-hook plugins (non-required)
- Slim fat skills (completing-branch-pr, etc.)
