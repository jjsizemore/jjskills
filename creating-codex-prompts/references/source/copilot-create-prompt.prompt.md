---
agent: governing-prompts-syncvia
description: 'Generate or refactor GitHub Copilot prompts so they are explicit, customer-value focused, and closeout-ready without losing important domain detail'
argument-hint: 'Describe the prompt to create or improve, or paste an existing prompt that needs a structural cleanup'
---

# GitHub Copilot Prompt Generator

This guide helps you create optimized GitHub Copilot prompts. It encodes best practices from official GitHub Copilot documentation and provides a structured framework for generating high-quality prompts that produce better code suggestions, analyses, and interactions. Use Context7 when current platform documentation matters.

For any prompt that drives code or test changes, explicitly require that the resulting work be correct for the real use case, checked against the latest relevant official docs when external behavior matters, fully validated, free of hygiene regressions, and iterated until those conditions are satisfied.

**Completion-first rule:** when generating or revising implementation, bug-fix, migration, audit, or remediation prompts, default the prompt toward **finishing the described work to a real completion point**, not merely reducing the problem size or making partial progress. If the work must remain partial for a valid reason, the prompt should say so explicitly, define the stopping boundary, and require a truthful blocker/exemption ledger. Otherwise, the generated prompt should instruct the agent to keep going until the feasible scope is actually complete and validated.

**Customer-value rule:** when multiple possible directions exist, bias the generated prompt toward the **smallest meaningful outcome that creates clear user or product value** and can be finished quickly, efficiently, and correctly. Avoid prompts that create planning churn, vague “improve things” work, or oversized backlog buckets.

When a user asks to create a new prompt or revise an existing one, always produce the result as a file operation in `.github/prompts/` (create or update the appropriate `*.prompt.md` file) rather than only returning inline prompt text.

If the prompt being created is for a **trackable implementation, bug fix, audit, or remediation task**, the prompt-generation workflow must:

1. **create or confirm a complementary Linear issue immediately** by following `.github/prompts/creating-managing-linear-issues.prompt.md`, unless a clearly corresponding issue already exists,
2. treat `.github/prompts/creating-managing-linear-issues.prompt.md` as the **canonical issue-creation sub-workflow** rather than inventing ad-hoc Linear steps inline,
3. keep the prompt and the Linear issue **complementary rather than substitutive**,
4. record or reference that Linear issue in the generated prompt when practical, and
5. ensure the generated prompt instructs the executing agent to **update the corresponding Linear issue with the current development state** (progress, validation status, blockers, and next steps) and to create one only as a fallback if no issue exists yet.

For tracked prompts, this workflow is **not complete** until the issue has actually been created or confirmed in the same run and the generated prompt contains the real issue identifier/URL (or explicitly documents the confirmed existing issue in a dedicated **Tracking & Delivery Coordination** section).

Whenever the prompt describes **user-visible, desktop, release-sensitive, or otherwise feature-complete work**, the generated prompt should also include an explicit **post-implementation UAT / signoff handoff**. Name the exact next validation prompt when the correct flow is obvious, or route through `.github/prompts/feature-uat-routing.prompt.md` when the correct UAT sequence depends on the touched surface.

When the prompt is about preventing desktop regressions (or codifying a real desktop incident into automated protection), default to `.github/prompts/add-guarding-desktop-uat-regressions.prompt.md` as the concrete follow-up prompt and keep the resulting work aligned with `.agents/skills/guarding-desktop-uat-regressions-syncvia/SKILL.md`.

## Linear MCP Reliability Checklist (Required for tracked prompts)

When prompt generation needs to create or confirm a Linear issue, follow `.agents/skills/managing-managing-linear-projects-mcp/SKILL.md` as the authoritative workflow.

At minimum:

- Load all Linear MCP tools with `tool_search_tool_regex({ pattern: "^mcp_managing-linear_" })` before using any `mcp_managing-linear_*` tool
- Resolve the authenticated user with `mcp_managing-linear_get_user({ query: 'me' })` after tools are loaded
- Prefer the canonical team from that response; current workspace team resolves as **`SyncVia`** / **`SV`**, not `SyncVia.ai`
- Use `mcp_managing-linear_list_issues({ query: '...', team: 'SyncVia' })` to search for duplicates or related issues
- Use `mcp_managing-linear_list_projects`, `mcp_managing-linear_list_cycles`, or `mcp_managing-linear_list_milestones` for ambiguous project / cycle / milestone resolution
- Use `mcp_managing-linear_save_issue` to create/update issues
  - omit `id` to create
  - include `id` to update
- Use `mcp_managing-linear_save_comment` for additive progress notes when available
- Use literal markdown newlines in descriptions/comments
- Search for duplicates before creating a new issue when the work is trackable
- Only call `mcp_managing-linear_list_milestones({ project })` after the project is already resolved
- If a tool call fails, continue with the supported fields/tools instead of blocking the workflow or inventing unsupported calls

Never instruct agents to use stale or nonexistent tool names like `mcp_managing-linear_create_issue`, `mcp_managing-linear_get_authenticated_user`, `mcp_managing-linear_research`, `activate_*()` functions (e.g. `activate_issue_management_tools()`, `activate_entity_retrieval_tools()`, `activate_managing-linear_issue_label_management()`), or `activate_issue_management_tools_2()`. The correct tool loading mechanism is `tool_search_tool_regex`.

## Optimization Rules for Existing Prompts

When improving a prompt that already exists:

- Preserve the prompt's domain-specific instructions, repository context, and specialized guardrails.
- Remove ambiguity, repetition, and outdated phrasing before removing substantive guidance.
- Add structure where needed: clear task, inline context, explicit constraints, expected output format, and success criteria.
- Prefer clarifying weak sections over rewriting the entire prompt.
- If a file already follows the recommended template well, keep it mostly intact and only make targeted improvements.
- Do not replace concrete repository facts with generic filler. Compress duplication, not meaning.
- When the prompt describes trackable implementation work, add or preserve explicit instructions that prompt creation owns initial Linear issue creation/confirmation, while prompt execution owns ongoing updates and only creates an issue as a fallback if none exists.
- Bias implementation prompts toward **closeout-ready execution**: prefer language like “complete”, “finish”, “drive to validated completion”, or “exhaust the feasible scope and document any true blockers,” instead of weaker language like “reduce”, “improve”, or “make progress” unless the user explicitly requested an incremental slice.
- Make prompts **finish-first rather than backlog-expanding**: define the smallest valuable slice, the next action, and the validation bar so an executing agent can move directly toward completion.
- Prefer prompts that increase customer-visible value or remove a real blocker quickly, not prompts that create broad housekeeping work with unclear payoff.
- For feature-development prompts, add or preserve explicit **post-implementation UAT routing** so the correct signoff flow is triggered when the feature is done. Use `.github/prompts/feature-uat-routing.prompt.md` when the appropriate follow-up depends on whether the work is desktop, public auth/legal, backend/API, or packaging/release oriented.
- For desktop incident/remediation prompts, prefer an explicit desktop regression-guard handoff to `.github/prompts/add-guarding-desktop-uat-regressions.prompt.md` so the failure mode becomes a durable Electron UAT guard.

## Core Principles for Effective Copilot Prompts

### Clarity & Specificity

- Be explicit about what you want
- Avoid ambiguous language and vague requests
- Include concrete examples when possible
- Specify the exact format you expect

### Context is King

- Provide relevant background information
- Reference project structure and patterns
- Include technology stack details
- Mention related files or concepts

### Scope & Constraints

- Set clear boundaries for the scope
- Define performance targets or constraints
- Specify formatting requirements
- Mention what NOT to do (avoid common pitfalls)

### Avoid Anti-Patterns

**Don't do this:**

- Ask to "conform to styles in styleguide.md" without also inlining the important rules
- Impose unrealistic character limits (less than 1000 chars, words of no more than 12 characters)
- Use overly informal language that reduces precision
- Assume Copilot will use specific tools/references without explicit instruction
- Add a `tools:` list to prompt frontmatter — this restricts the agent to only those tools and frequently blocks it from using capabilities it needs. Prompts should have full tool access by default; only add `tools:` to **agent** files when there is a concrete reason to restrict scope.

**Do this instead:**

- Embed the critical style guidelines directly in the prompt
- If a repository file is important, mention the exact file path and summarize the relevant rule inline
- Specify reasonable constraints aligned with actual needs
- Use clear, professional language
- Explicitly state which tools/frameworks to use

## Recommended Prompt Template

Use this structure when creating a new Copilot prompt:

```markdown
---
agent: 'agent' # ask | agent | plan | custom-agent-name
description: '[One sentence describing what this prompt does]'
argument-hint: '[Optional hint shown in chat input when the user types the slash command]'
model: '[Optional model override, e.g. GPT-5 (copilot)]'
---

# [Descriptive Prompt Title]

## Task

[Clear, specific description of the task. Answer: WHO, WHAT, WHERE, WHY, HOW]

## Context & Background

[Relevant technical context, project structure, or domain knowledge that Copilot needs]

### Technology Stack

- [Language/Framework 1]
- [Language/Framework 2]
- [Key Libraries/Tools]

### Project Patterns

- [Key architectural pattern or convention]
- [Naming convention]
- [Code organization principle]

## Requirements

### Tracking & Delivery Coordination

- Determine whether the prompt describes work that should be tracked in Linear.
- If yes, create or confirm the **complementary Linear issue immediately** during prompt generation by following `.github/prompts/creating-managing-linear-issues.prompt.md`, unless a matching issue already exists.
- Instruct the resulting prompt to reference that existing Linear issue when practical and to update it with the **current state of development** during execution, including progress, blockers, validation status, and next steps.
- Instruct the resulting prompt to create the complementary Linear issue only as a fallback if prompt generation did not create or confirm one.
- Make clear that the Linear issue complements the prompt’s rich execution context; it does not replace the prompt.
- For remaining planned work, require a concise **Done / Remaining / Next / Validate** or equivalent execution-ready state so the next pass can finish quickly and correctly.
- Bias the prompt toward the smallest customer-visible or unblocker slice that is worth finishing now, rather than generic backlog grooming.
- Determine whether the finished work needs a **post-implementation UAT or signoff step** and name that handoff explicitly in the prompt. If the correct validation path depends on the surface or release context, route through `.github/prompts/feature-uat-routing.prompt.md`.

### Must Have

- Requirement 1
- Requirement 2
- Requirement 3
- Correctness requirements for the real use case, not just the visible symptom
- A latest-docs check when framework, library, or tooling behavior matters
- Explicit validation gates and an instruction to iterate until they pass
- A no-hygiene-regressions requirement covering lint, types, tests, duplication, and banned patterns
- Best-practice / clean-code expectations appropriate to the stack
- **A completion-oriented execution requirement**: unless the user explicitly asks for a partial slice, the prompt should tell the agent to finish the described feasible scope to a real completion point rather than merely chip away at it
- **A customer-value / finish-up requirement**: the prompt should name the smallest meaningful outcome, explain why it matters, and make the fastest correct path to done obvious
- For trackable work: a requirement to create or confirm a companion Linear issue during prompt generation, then keep it updated during execution

### Nice to Have

- Optional enhancement 1
- Optional enhancement 2

### Constraints

- Don't do X because [reason]
- Performance target: [metric]
- Avoid using deprecated [thing]

## Expected Output Format

[Describe exactly what you expect back - code structure, file format, etc.]

## Example

### Input

[Show an example of what you provide]

### Expected Output

[Show the exact format/structure you want back]

## Success Criteria

- Criterion 1
- Criterion 2
- Criterion 3
- Delivered code/tests are correct for the intended use case
- Latest relevant official docs were checked when needed
- Required tests and validation checks pass
- No regressions in codebase hygiene were introduced
- The result follows clean-code and industry-standard best practices
- When the work should be tracked, a complementary Linear issue is created or confirmed during prompt generation and reflects the current development state
```

## Agent File Template

Use this structure when creating a new custom agent (`.github/agents/your-agent.md`):

```markdown
---
name: descriptive-kebab-case-name
description: >
  Use when: [primary trigger condition or task type].
  Delegates to [related-agent] for [out-of-scope concern].
argument-hint: 'Brief hint about what user input improves results'
tools:
  - codebase # include for code-aware search and file reading
  - editFiles # include if the agent writes/modifies files
  - fetch # include if the agent consults external docs
  - runCommand # include if the agent runs build/test commands
model: 'Claude Sonnet 4.6 (copilot)' # optional: override the model
# handoffs:        # optional: guided transitions to the next agent
#   - label: 'Hand off to Implementation'
#     agent: implementation-agent
#     prompt: 'Now implement the plan above.'
#     send: false
---

# [Agent Display Name]

**Agent ID**: `agent-name`
**Version**: 1.0.0
**Optimized for**: [tech stack, domain capabilities]
**Last Updated**: [date]

---

## Agent Purpose

[2–3 sentences: what the agent does, when to use it, when NOT to use it]

---

## In Scope

- `path/to/relevant/code/` — [description]

## Out of Scope

| Domain   | Delegate to  |
| -------- | ------------ |
| [domain] | `agent-name` |

---

## Core Rules

- ✅ [affirmative rule]
- ❌ NEVER [prohibitive rule]

For implementation-focused or test-focused agents, include rules that require: use-case correctness, latest-doc checks when relevant, passing validation, passing local Lefthook pre-commit checks when applicable, zero hygiene regressions, clean-code standards, and iteration until all validation criteria are satisfied.

---

## Validation Expectations

- Run `pnpm typecheck` — zero new type errors
- Run `pnpm lint` — zero new violations
- Run `pnpm test` — zero new failures
- The agent must iterate until: the implementation is correct for the real use case, the latest relevant docs have been checked when needed, all required validation passes, local Lefthook pre-commit checks pass when applicable, and no hygiene regressions remain

---

## Version History

- **v1.0.0** ([date]): Initial agent configuration
```

### Agent Frontmatter Reference

| Field            | Required | Description                                                       |
| ---------------- | -------- | ----------------------------------------------------------------- |
| `name`           | No       | Kebab-case agent name (defaults to filename)                      |
| `description`    | No       | Shown in agents dropdown; start with "Use when:" for scannability |
| `argument-hint`  | No       | Hint text shown in chat input field                               |
| `tools`          | No       | Restrict available tools — fewer = more focused agent             |
| `agents`         | No       | Allowed subagents (`*` = all, `[]` = none)                        |
| `model`          | No       | AI model override, e.g. `GPT-5 (copilot)`                         |
| `user-invocable` | No       | `false` hides from picker but allows subagent invocation          |
| `handoffs`       | No       | Guided transitions to next agents in a sequential workflow        |

> **Tip**: Type `/create-agent` in chat to generate an agent file from a description using AI.

---

## Prompt Creation Workflow

### Step 0: Persist the Prompt as a File (Required)

- Always save newly created prompts as `*.prompt.md` files in `.github/prompts/`.
- If improving an existing prompt, update that file in place.
- In your final response, include the exact file path created/updated and a brief summary of changes.
- Only provide prompt text without file creation when the user explicitly requests text-only output.

### Step 0.5: Determine Whether the Prompt Needs a Complementary Linear Issue

- Ask whether the prompt describes a one-off implementation, bug fix, audit, migration, remediation, or tracked delivery task.
- If yes, create or confirm the complementary Linear issue during prompt generation by following `.github/prompts/creating-managing-linear-issues.prompt.md`, unless one already exists.
- If the user explicitly references `#file:creating-managing-linear-issues.prompt.md`, treat that as the required workflow to run for the tracking portion instead of merely restating the rule.
- For SyncVia, first resolve `me` and the canonical team before issue creation instead of hard-coding `SyncVia.ai`.
- Reference that issue in the generated prompt when practical.
- Require the generated prompt to update the corresponding Linear issue with current execution state as work progresses.
- Require the generated prompt to create a complementary Linear issue only as a fallback if prompt generation did not create or confirm one.
- Do **not** defer tracked issue creation/confirmation to a later pass; do it during the same prompt-generation run and include the actual issue ID/URL in the resulting prompt file.
- If the prompt is purely reusable guidance or utility infrastructure, do **not** force Linear issue creation.

### Step 1: Define the Core Request

Ask yourself:

- What exact problem am I solving?
- What is the input and expected output?
- Is this a code generation, analysis, refactoring, or explanation task?

### Step 2: Add Essential Context

- Include the technology stack (languages, frameworks, libraries)
- Reference project structure (but inline, don't reference external files)
- Mention relevant code patterns or conventions
- Specify team/organizational standards
- Use `${input:variableName:placeholder}` syntax to accept runtime user inputs (e.g., component name, target path)

### Step 3: Set Clear Constraints

- Performance targets (latency, memory, throughput)
- Code quality standards (linting, testing, documentation)
- Naming conventions and style guides (inline these!)
- Scope limitations ("only modify X, don't touch Y")
- Completion boundary: specify whether the prompt should fully complete the feasible scope or intentionally stop at a named partial milestone
- For implementation or test prompts, add explicit requirements for use-case correctness, current-doc verification where relevant, no hygiene regressions, and iteration until validation passes

### Step 4: Provide Examples

- Show a concrete before/after example
- Include sample input and expected output
- Demonstrate edge cases if relevant
- Show the exact code style you want

### Step 5: Validate & Iterate

- Ask Copilot using your prompt
- Evaluate the output quality
- Refine unclear instructions
- Add missing context based on Copilot's responses
- Re-test and document improvements
- Ensure the prompt forces the agent to continue iterating until tests pass, the solution is correct for the real use case, and clean-code / hygiene standards still hold
- If the prompt is for tracked work, ensure prompt generation creates or confirms the complementary Linear issue up front and the resulting prompt keeps it synchronized with execution progress and validation state

## Common Prompt Patterns

### Code Review Pattern

```markdown
Provide your judgement as a PR Reviewer, both for functional and non-functional aspects.

Evaluate:

- Correctness of logic
- Performance implications
- Security vulnerabilities
- Code style compliance with [specific conventions]
- Test coverage adequacy
- Documentation completeness

Format your response as:

1. Overall Assessment (one paragraph)
2. Critical Issues (if any)
3. Minor Improvements
4. Positive Observations
```

### Analysis Pattern

```markdown
Analyze [code/concept/file] and explain:

1. **Purpose**: What does this do and why?
2. **Design Decisions**: Key architectural choices and tradeoffs
3. **Dependencies**: What does it depend on?
4. **Performance Characteristics**: Latency, memory, throughput
5. **Testing**: How should this be tested?
6. **Improvements**: Potential enhancements or issues

Use clear, structured language. Provide code examples where helpful.
```

### Multi-Step Task Pattern

```markdown
Complete this multi-step task in order:

**Step 1: Analyze**
[Describe what to analyze and how]

**Step 2: Design**
[Describe design approach and constraints]

**Step 3: Implement**
[Specific implementation requirements and patterns]

**Step 4: Validate**
[What success looks like and how to verify]

Provide output for each step clearly marked.
```

## Real-World Examples

### Example 1: Service Factory Implementation

````markdown
---
agent: 'agent'
description: 'Generate a factory pattern implementation for service instantiation'
---

# Service Factory Implementation

Generate a TypeScript ServiceFactory class that:

**Requirements:**

- Implements singleton pattern for service instances
- Enforces private constructors on all services
- Provides typed getter methods (e.g., `getJWTService()`)
- Automatically injects dependencies via constructor parameters
- Throws descriptive errors for missing dependencies

**Stack:**

- TypeScript 5.9+ (strict mode)
- Node.js 24+
- Services: JWT, Vector Search, Database Access, OAuth providers

**Code Style:**

- Use dependency injection pattern
- Type all public methods with explicit return types
- Add JSDoc comments to all public methods
- Use snake_case for private methods, camelCase for public
- Log service instantiation with logger.info()

**Example getter:**

```typescript
public static getJWTService(): JWTService {
  if (!this.jwtService) {
    this.jwtService = new JWTService(/* deps */);
  }
  return this.jwtService;
}
```
````

**Validation:**

- All services lazy-load on first access
- Repeated calls return same instance
- Type system prevents direct instantiation

````

### Example 2: Test Setup Prompt

```markdown
---
agent: 'agent'
description: 'Create comprehensive test fixtures for integration testing'
---

# Integration Test Fixtures

Generate test helper utilities that:

**Requirements:**

* Initialize real PostgreSQL database for each test
* Mock external APIs (OpenAI) at module level
* Provide factory functions for test data creation
* Clean up resources automatically after each test
* Track test execution time against performance budgets

**Stack:**

* Vitest 4 with `vitest.config.ts`
* PostgreSQL 18 via Docker
* Drizzle ORM for migrations
* OpenAI API (must be mocked)

**Integration Points:**

* Global setup hook (globalSetupIntegration.ts)
* Database initialization utility
* Mock response builder for OpenAI

**Performance Targets:**

* Test database setup: <5s per test
* Mock API responses: <100ms per call
* Full test suite: <60s for 50 tests

**Success Criteria:**

* Tests pass consistently in CI/CD
* No data leakage between tests
* Mock API calls are indistinguishable from tests
* Clear error messages on test failures
````

## Effectiveness Tips

### 0. Add Tracking Instructions When the Work Should Be Managed

```markdown
## Tracking Requirements

- Determine whether this task should be tracked in Linear.
- If a corresponding Linear issue does not already exist, create one during prompt generation by following `.github/prompts/creating-managing-linear-issues.prompt.md`.
- Keep the prompt as the rich execution brief and the Linear issue as the delivery-tracking record.
- Reference the existing Linear issue in the generated prompt when practical.
- During execution, update the existing Linear issue and create one only as a fallback if prompt generation did not create or confirm one.
- Update the corresponding Linear issue with current development status, blockers, validation results, and next steps before finishing major milestones.
```

### 1. Be Specific About Error Handling

```markdown
When [error condition occurs], should Copilot:

- Throw error with message: [specific format]
- Log at level: [INFO|WARN|ERROR]
- Return graceful default: [what default]
```

### 2. Provide Negative Examples

```markdown
DON'T do this:

[Show bad code]

Reason: [Explain why it's wrong]

DO this instead:

[Show good code]
```

### 3. Test Your Prompts

```markdown
Validation Steps:

1. Run with `[test command]`
2. Check output against `[expected file]`
3. Verify performance with `[measurement tool]`
4. Ensure type safety passes `pnpm typecheck`
5. Confirm the output enforces use-case correctness, latest-doc checks where relevant, passing tests, no hygiene regressions, and iterative completion
```

## SyncVia.ai Project Context

For the SyncVia.ai project, always include:

**Stack:**

- Backend: Node.js + TypeScript 5.9 (strict), Express, tRPC, Drizzle ORM, PostgreSQL + pgvector
- Frontend: React 19 + TypeScript, Vite, TanStack Query, shadcn/ui
- Real-time: Socket.IO (4000) + Native WebSocket (4001)
- AI/ML: OpenAI GPT-5-nano, LangChain, vector embeddings

**Architectural Constraints:**

- Single source of truth: Database schema (Drizzle) at `backend/src/database/schema/`
- Type sources: Never duplicate - import from schema or `backend/src/types/`
- Services: Use `ServiceFactory` pattern, never instantiate directly
- Repositories: All DB access through repositories, never `DatabaseAccess` directly
- tRPC: Use standardized patterns per `frontend/AGENTS.md` and `/.github/instructions/frontend-trpc-tanstack.instructions.md`

**Performance Budgets (Hard Constraints):**

- Vector similarity search: <100ms
- Real-time question generation: <2s end-to-end
- Feedback submission: <2s
- Post-meeting summarization: <5s

**Key Files:**

- Schema types: `backend/src/database/schema/index.ts`
- Service factory: `backend/src/services/core/serviceFactory.ts`
- tRPC routers: `backend/src/trpc/routers/`
- Logger: `backend/src/utils/logger.ts` (never use console.\*)

## Repository Structure

Copilot customization files live in `.github/` and serve distinct purposes:

| Directory               | File type           | Purpose                                                                         |
| ----------------------- | ------------------- | ------------------------------------------------------------------------------- |
| `.github/prompts/`      | `*.prompt.md`       | Slash commands — invoked manually in chat (`/create-agent`, `/fix-tests`, etc.) |
| `.github/instructions/` | `*.instructions.md` | Always-on rules applied automatically by `applyTo` pattern                      |
| `.github/agents/`       | `*.md`              | Custom agent personas with tool restrictions, model preferences, and handoffs   |

**File placement**:

```
.github/
├── prompts/       ← *.prompt.md  (slash commands: /fix-tests, /create-agent, etc.)
├── instructions/  ← *.instructions.md  (always-on; requires applyTo frontmatter glob)
└── agents/        ← *.md  (custom personas: mvp-delivery-syncvia, backend-core-syncvia, …)
```

Instruction files require an `applyTo` frontmatter glob:

```markdown
---
applyTo: 'backend/src/services/**/*.ts'
---

[Always-on instructions applied to matching files]
```

## Quality Checklist

Before using a prompt, verify:

- **Clear Purpose**: One sentence describes what the prompt does
- **Invocation Metadata**: `description` and `argument-hint` help the user run the prompt correctly
- **Complete Context**: Enough information to understand the problem
- **Specific Requirements**: What must be included (must-haves)
- **Constraints Defined**: What to avoid and why
- **Examples Provided**: Before/after or input/output examples
- **Format Specified**: Exactly what the output should look like
- **Performance Targets**: Any timing or resource constraints
- **Edge Cases**: How to handle error conditions
- **Validation Criteria**: How to know if the output is correct
- **Tracking Behavior**: For trackable work, prompt generation explicitly creates or confirms a complementary Linear issue up front and the generated prompt requires state updates during execution, using issue creation only as a fallback if none exists
- **Customer Value Signal**: The prompt makes clear why the work matters to users, beta readiness, or a real delivery bottleneck
- **Finish-First Bias**: The prompt identifies the next highest-value slice and makes the path to done obvious
- **Use-Case Correctness**: The prompt says to verify the real intended behavior, not just a local symptom
- **Docs Freshness**: The prompt says to check the latest relevant official docs when external behavior matters
- **Iterative Completion**: The prompt says to keep going until validation and hygiene criteria are satisfied
- **Pre-Commit Enforcement**: The prompt treats local Lefthook pre-commit checks as part of the validation bar when the repo uses them
- **Clean-Code Standards**: The prompt explicitly preserves readability, maintainability, naming quality, and DRY structure
- **Preserves Valuable Context**: Repository-specific nuance survives the cleanup
- **No Vague External References**: Important standards/styles are embedded or summarized, not delegated to a hand-wavy "see file X"
- **Prompt File Persistence**: The prompt was actually created/updated as a `*.prompt.md` file under `.github/prompts/` unless the user explicitly requested text-only output
- **Linear Complementarity**: For trackable work, prompt generation establishes the Linear issue early and the prompt keeps it synchronized without treating the issue as a replacement for prompt context

## Continuous Improvement

1. **Iterate & share**: Refine prompts based on output quality; document what works for the team.
2. **Test**: Run generated code through the test suite before accepting results.
3. **Update**: Refresh prompts when codebase patterns, framework behavior, or project direction changes.

---

**Last Updated**: March 2026
**Based On**: GitHub Copilot Official Documentation (code.visualstudio.com/docs/copilot/customization); use Context7 for fresh retrieval
**For**: SyncVia.ai AI Meeting Assistant Project
