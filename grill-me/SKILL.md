---
name: grill-me
description: Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
---

# Grill Me

Interview the user relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one.

## Execution Sequence (MANDATORY)

### Phase 1: Explore (BEFORE asking anything)
1. **Read the code** — If the user references a file, function, or feature, read it first. Use Read, Bash grep, or file search to gather facts.
2. **Check git history** — `git log --oneline -20` on relevant files to understand recent decisions.
3. **Inspect configuration** — Schema files, environment configs, dependency versions, test patterns.
4. **Map existing patterns** — What architecture, naming, or structure already exists in this area?
5. **Identify what can't be answered** — Only after step 1–4, list what genuinely requires user intent/decision.

### Phase 2: Interview (one question at a time)
1. **Start with the root decision** — What is the foundational choice that unlocks all others?
2. **For EACH question**:
   - State your recommended answer (based on code patterns, architecture, existing constraints)
   - Show the evidence (point to specific code, config, or git history that informed your recommendation)
   - Ask the user to accept, adjust, or override
   - Wait for their answer before asking the next question
3. **Walk the decision tree branch-by-branch** — Each answer determines what to ask next. Don't ask a sibling question until the parent is resolved.

### Phase 3: Confirm (before implementation)
- Summarize all agreed decisions and their evidence
- Ask for final confirmation
- Do NOT start implementation until explicitly confirmed

## What Breaks Agent Compliance

These failures mean the skill is not being followed. If you see them, restart with this skill and enforce Phase 1 explicitly:

- **Asking before exploring**: Agent asks "what database should we use?" without reading the schema or checking the stack definition. **FIX:** Read code first.
- **Asking what code answers**: Agent asks "what's your naming convention?" when the codebase already uses `camelCase` everywhere. **FIX:** Grep the codebase before asking.
- **Wall of questions**: Agent asks 5+ questions in one response instead of one at a time. **FIX:** Ask one, wait for answer, then ask the next.
- **No recommendation**: Agent says "should we use X or Y?" without stating which one fits the codebase better. **FIX:** Always recommend first, let user override.
- **Asking without evidence**: Agent asks "what's your goal?" without referencing the user's stated goal, the Linear ticket, or the code comment that explains intent. **FIX:** Quote or link the evidence.
- **Random order**: Agent asks about implementation details before the foundational choice is made. **FIX:** Start with root decision, walk branches depth-first.
- **Starting code/work before confirmation**: Agent writes code or runs git commands before the user has confirmed the plan. **FIX:** Stop at end of Phase 3.
