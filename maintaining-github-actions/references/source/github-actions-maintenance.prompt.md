---
agent: ci-github-actions-syncvia
description: "Analyze, debug, modernize, and optimize SyncVia's GitHub Actions workflows with minimal-risk fixes and explicit operator guidance"
argument-hint: "Optional focus, such as a workflow filename, flaky job, release path, or CI performance concern"
---

# GitHub Actions Maintenance

Use this prompt to audit, debug, and modernize the repository's GitHub Actions workflows without erasing valuable release-process context. Favor small, evidence-backed changes over large speculative refactors.

## Task

Investigate the current workflow set, identify the highest-value improvements, and propose or implement the smallest coherent set of changes that improves reliability, security, performance, and operator clarity.

## Repository-specific context

- This is a PNPM + Turborepo monorepo with backend, frontend, and desktop release surfaces.
- Release and deployment behavior matters as much as CI correctness; do not simplify away important packaging or release safeguards.
- Prefer exact workflow, job, and step references over vague recommendations.

## Context you should gather

1. Discover all workflows and their purpose:
   - Enumerate files under `.github/workflows/`.
   - For each file, summarize:
     - Triggers (`on:`)
     - Jobs and their responsibilities
     - Key dependencies (Node, pnpm, Turborepo, Docker, etc.)
2. Identify pain points and risks:
   - Recent failing runs, flaky jobs, or long-running steps.
   - Deprecated or pinned-too-old actions (for example `@v1`, `@v2`).
   - Misconfigured or missing permissions, secrets, or environment variables.
3. Understand project characteristics:
   - Language and ecosystem (Node/TypeScript, monorepo vs single package).
   - Build and test commands.
   - Packaging and deployment targets (Docker, registries, cloud providers, etc.).

Ask clarifying questions if any of this information is missing or ambiguous.

## What to do

When this prompt is run, follow this sequence:

1. **Inventory & quick assessment**
   - List all workflow files and give a one-line purpose guess for each.
   - Highlight obvious red flags:
     - Deprecated actions or versions.
     - Missing `permissions:` blocks for least-privilege.
     - Uncached installs or redundant build steps.
     - Use of `ubuntu-latest` quirks that may need pinning.

2. **Debug & fix issues**
   - For a specific failing or flaky workflow (if the user names it, prioritize that one):
     - Explain what the workflow is trying to do.
     - Inspect triggers, conditionals (`if:`), and matrix configurations.
     - Diagnose likely failure causes based on:
       - Step ordering.
       - Missing `needs:`.
       - Incorrect paths, cache keys, or environment variables.
       - Misuse of `secrets.*` or `github.*` context.
     - Propose a small, focused patch that:
       - Fixes the root cause.
       - Preserves existing behavior unless the user explicitly approves a change.
     - Show the **patch as a diff** (unified diff) and the resulting full job snippet if helpful.

3. **Update & modernize**
   - Suggest version bumps to maintained marketplace actions (for example `actions/checkout@v4`, `actions/cache@v4`, `actions/setup-node@v4`), and note any breaking changes to consider.
   - Replace anti-patterns such as:
     - Shell scripting large logic blocks inline instead of using composite or reusable workflows.
     - Repeated steps across jobs that could be refactored.
   - If appropriate, propose:
     - Reusable workflows (`.github/workflows/reusable-*.yml`) for shared CI patterns.
     - Job matrices for OS/Node versions instead of copy-pasted jobs.

4. **Optimize performance & cost**
   - Add or improve caching strategies:
     - Use `actions/cache` or ecosystem-specific cache helpers for pnpm, npm, Turborepo, etc.
     - Choose cache keys that balance hit rate and correctness.
   - Remove redundant work:
     - Avoid re-running installs or builds when artifacts or caches are available.
     - Skip expensive jobs when changes are limited (for example `paths` / `paths-ignore` or per-path conditions).
   - Recommend environment and concurrency improvements:
     - Use `concurrency:` to prevent overlapping runs for the same branch.
     - Prefer appropriate runners and matrix scope rather than over-broad combinations.

5. **Harden security & reliability**
   - Add or refine `permissions:` at workflow/job level to follow least-privilege.
   - Review use of `GITHUB_TOKEN` and any personal access tokens; ensure they are pulled from `secrets.*`.
   - Highlight risky patterns:
     - `pull_request_target` misuse.
     - Blind `curl | bash`.
     - Unpinned third-party Actions from untrusted publishers.
   - Suggest safer alternatives and show concrete YAML changes.

6. **Produce a concise, actionable plan**
   - Summarize your findings and proposed improvements in bullets, grouped as:
     - “Critical fixes”
     - “High-impact optimizations”
     - “Nice-to-have refactors”
   - For each item, include:
     - The workflow file and job/step name.
     - A short rationale.
     - A short code snippet or diff of the proposed change.

## Output format

Always respond in this structure:

1. **Overview**
   - 2–4 bullet summary of what you did and what you found.

2. **Issues and recommendations**
   - Grouped by workflow file.
   - For each issue:
     - A heading: `### [workflow-file].yml – [short description]`
     - A brief explanation of:
       - Root cause.
       - Impact (breakage, flakiness, performance, security).
     - A suggested fix with YAML snippet or unified diff.

3. **Optimized sample workflow (when applicable)**
   - If you propose a substantial refactor, show a full, updated workflow file that can replace the existing one.
   - Ensure it is valid YAML, properly indented, and ready to paste.

4. **Checklist**
   - A bullet list of concrete actions the user should take in order (for example “Update secrets X and Y”, “Enable required status checks for job Z”).

## Success criteria

- Recommendations are tied to specific workflow evidence.
- Critical release or packaging behavior is preserved unless a change is explicitly justified.
- The output makes it easy for a maintainer to apply the changes without a second clarification pass.

Keep explanations concise and highly technical, assuming the reader is an experienced engineer comfortable with GitHub Actions, monorepos, pnpm, Turborepo, and containerized deployments.

## How to use this prompt

- Place this file at `.github/prompts/maintaining-github-actions.prompt.md`.
- In Copilot Chat, run it with:
  - `/maintaining-github-actions`
  - Optionally followed by details, for example: - `/maintaining-github-actions: focus=ci.yml failing-on-main`---
    name: maintaining-github-actions
    description: Analyze, debug, modernize, and optimize SyncVia's GitHub Actions workflows with minimal-risk fixes and explicit operator guidance.
    argument-hint: 'Optional focus, such as a workflow filename, flaky job, release path, or CI performance concern'
    agent: ci-github-actions-syncvia
  - vscode
  - execute
  - read
  - edit
  - search
  - web
  - upstash/context7/\*
  - agent
  - github/\*
  - todo

---

# GitHub Actions Maintenance

Use this prompt to audit, debug, and modernize the repository's GitHub Actions workflows without erasing valuable release-process context. Favor small, evidence-backed changes over large speculative refactors.

## Task

# GitHub Actions Maintenance

Use this prompt to audit, debug, and modernize the repository's GitHub Actions workflows without erasing valuable release-process context. Favor small, evidence-backed changes over large speculative refactors.

## Task

Investigate the current workflow set, identify the highest-value improvements, and propose or implement the smallest coherent set of changes that improves reliability, security, performance, and operator clarity.

## Repository-specific context

- This is a PNPM + Turborepo monorepo with backend, frontend, and desktop release surfaces.
- Release and deployment behavior matters as much as CI correctness; do not simplify away important packaging or release safeguards.
- Prefer exact workflow, job, and step references over vague recommendations.

## Context you should gather

1. Discover all workflows and their purpose:
   - Enumerate files under `.github/workflows/`.
   - For each file, summarize:
     - Triggers (`on:`)
     - Jobs and their responsibilities
     - Key dependencies (Node, pnpm, Turborepo, Docker, etc.)
2. Identify pain points and risks:
   - Recent failing runs, flaky jobs, or long-running steps.
   - Deprecated or pinned-too-old actions (for example `@v1`, `@v2`).
   - Misconfigured or missing permissions, secrets, or environment variables.
3. Understand project characteristics:
   - Language and ecosystem (Node/TypeScript, monorepo vs single package).
   - Build and test commands.
   - Packaging and deployment targets (Docker, registries, cloud providers, etc.).

Ask clarifying questions if any of this information is missing or ambiguous.

## What to do

When this prompt is run, follow this sequence:

1. **Inventory & quick assessment**
   - List all workflow files and give a one-line purpose guess for each.
   - Highlight obvious red flags:
     - Deprecated actions or versions.
     - Missing `permissions:` blocks for least-privilege.
     - Uncached installs or redundant build steps.
     - Use of `ubuntu-latest` quirks that may need pinning.

2. **Debug & fix issues**
   - For a specific failing or flaky workflow (if the user names it, prioritize that one):
     - Explain what the workflow is trying to do.
     - Inspect triggers, conditionals (`if:`), and matrix configurations.
     - Diagnose likely failure causes based on:
       - Step ordering.
       - Missing `needs:`.
       - Incorrect paths, cache keys, or environment variables.
       - Misuse of `secrets.*` or `github.*` context.
     - Propose a small, focused patch that:
       - Fixes the root cause.
       - Preserves existing behavior unless the user explicitly approves a change.
     - Show the **patch as a diff** (unified diff) and the resulting full job snippet if helpful.

3. **Update & modernize**
   - Suggest version bumps to maintained marketplace actions (for example `actions/checkout@v4`, `actions/cache@v4`, `actions/setup-node@v4`), and note any breaking changes to consider.
   - Replace anti-patterns such as:
     - Shell scripting large logic blocks inline instead of using composite or reusable workflows.
     - Repeated steps across jobs that could be refactored.
   - If appropriate, propose:
     - Reusable workflows (`.github/workflows/reusable-*.yml`) for shared CI patterns.
     - Job matrices for OS/Node versions instead of copy-pasted jobs.

4. **Optimize performance & cost**
   - Add or improve caching strategies:
     - Use `actions/cache` or ecosystem-specific cache helpers for pnpm, npm, Turborepo, etc.
     - Choose cache keys that balance hit rate and correctness.
   - Remove redundant work:
     - Avoid re-running installs or builds when artifacts or caches are available.
     - Skip expensive jobs when changes are limited (for example `paths` / `paths-ignore` or per-path conditions).
   - Recommend environment and concurrency improvements:
     - Use `concurrency:` to prevent overlapping runs for the same branch.
     - Prefer appropriate runners and matrix scope rather than over-broad combinations.

5. **Harden security & reliability**
   - Add or refine `permissions:` at workflow/job level to follow least-privilege.
   - Review use of `GITHUB_TOKEN` and any personal access tokens; ensure they are pulled from `secrets.*`.
   - Highlight risky patterns:
     - `pull_request_target` misuse.
     - Blind `curl | bash`.
     - Unpinned third-party Actions from untrusted publishers.
   - Suggest safer alternatives and show concrete YAML changes.

6. **Produce a concise, actionable plan**
   - Summarize your findings and proposed improvements in bullets, grouped as:
     - “Critical fixes”
     - “High-impact optimizations”
     - “Nice-to-have refactors”
   - For each item, include:
     - The workflow file and job/step name.
     - A short rationale.
     - A short code snippet or diff of the proposed change.

## Output format

Always respond in this structure:

1. **Overview**
   - 2–4 bullet summary of what you did and what you found.

2. **Issues and recommendations**
   - Grouped by workflow file.
   - For each issue:
     - A heading: `### [workflow-file].yml – [short description]`
     - A brief explanation of:
       - Root cause.
       - Impact (breakage, flakiness, performance, security).
     - A suggested fix with YAML snippet or unified diff.

3. **Optimized sample workflow (when applicable)**
   - If you propose a substantial refactor, show a full, updated workflow file that can replace the existing one.
   - Ensure it is valid YAML, properly indented, and ready to paste.

4. **Checklist**
   - A bullet list of concrete actions the user should take in order (for example “Update secrets X and Y”, “Enable required status checks for job Z”).

## Success criteria

- Recommendations are tied to specific workflow evidence.
- Critical release or packaging behavior is preserved unless a change is explicitly justified.
- The output makes it easy for a maintainer to apply the changes without a second clarification pass.

Keep explanations concise and highly technical, assuming the reader is an experienced engineer comfortable with GitHub Actions, monorepos, pnpm, Turborepo, and containerized deployments.

## How to use this prompt

- Place this file at `.github/prompts/maintaining-github-actions.prompt.md`.
- In Copilot Chat, run it with:
  - `/maintaining-github-actions`
  - Optionally followed by details, for example:
    - `/maintaining-github-actions: focus=ci.yml failing-on-main`

Investigate the current workflow set, identify the highest-value improvements, and propose or implement the smallest coherent set of changes that improves reliability, security, performance, and operator clarity.

## Repository-specific context

- This is a PNPM + Turborepo monorepo with backend, frontend, and desktop release surfaces.
- Release and deployment behavior matters as much as CI correctness; do not simplify away important packaging or release safeguards.
- Prefer exact workflow, job, and step references over vague recommendations.

## Context you should gather

1. Discover all workflows and their purpose:
   - Enumerate files under `.github/workflows/`.
   - For each file, summarize:
     - Triggers (`on:`)
     - Jobs and their responsibilities
     - Key dependencies (Node, pnpm, Turborepo, Docker, etc.)
2. Identify pain points and risks:
   - Recent failing runs, flaky jobs, or long-running steps.
   - Deprecated or pinned-too-old actions (for example `@v1`, `@v2`).
   - Misconfigured or missing permissions, secrets, or environment variables.
3. Understand project characteristics:
   - Language and ecosystem (Node/TypeScript, monorepo vs single package).
   - Build and test commands.
   - Packaging and deployment targets (Docker, registries, cloud providers, etc.).

Ask clarifying questions if any of this information is missing or ambiguous.

## What to do

When this prompt is run, follow this sequence:

1. **Inventory & quick assessment**
   - List all workflow files and give a one-line purpose guess for each.
   - Highlight obvious red flags:
     - Deprecated actions or versions.
     - Missing `permissions:` blocks for least-privilege.
     - Uncached installs or redundant build steps.
     - Use of `ubuntu-latest` quirks that may need pinning.

2. **Debug & fix issues**
   - For a specific failing or flaky workflow (if the user names it, prioritize that one):
     - Explain what the workflow is trying to do.
     - Inspect triggers, conditionals (`if:`), and matrix configurations.
     - Diagnose likely failure causes based on:
       - Step ordering.
       - Missing `needs:`.
       - Incorrect paths, cache keys, or environment variables.
       - Misuse of `secrets.*` or `github.*` context.
     - Propose a small, focused patch that:
       - Fixes the root cause.
       - Preserves existing behavior unless the user explicitly approves a change.
     - Show the **patch as a diff** (unified diff) and the resulting full job snippet if helpful.

3. **Update & modernize**
   - Suggest version bumps to maintained marketplace actions (for example `actions/checkout@v4`, `actions/cache@v4`, `actions/setup-node@v4`), and note any breaking changes to consider.
   - Replace anti-patterns such as:
     - Shell scripting large logic blocks inline instead of using composite or reusable workflows.
     - Repeated steps across jobs that could be refactored.
   - If appropriate, propose:
     - Reusable workflows (`.github/workflows/reusable-*.yml`) for shared CI patterns.
     - Job matrices for OS/Node versions instead of copy-pasted jobs.

4. **Optimize performance & cost**
   - Add or improve caching strategies:
     - Use `actions/cache` or ecosystem-specific cache helpers for pnpm, npm, Turborepo, etc.
     - Choose cache keys that balance hit rate and correctness.
   - Remove redundant work:
     - Avoid re-running installs or builds when artifacts or caches are available.
     - Skip expensive jobs when changes are limited (for example `paths` / `paths-ignore` or per-path conditions).
   - Recommend environment and concurrency improvements:
     - Use `concurrency:` to prevent overlapping runs for the same branch.
     - Prefer appropriate runners and matrix scope rather than over-broad combinations.

5. **Harden security & reliability**
   - Add or refine `permissions:` at workflow/job level to follow least-privilege.
   - Review use of `GITHUB_TOKEN` and any personal access tokens; ensure they are pulled from `secrets.*`.
   - Highlight risky patterns:
     - `pull_request_target` misuse.
     - Blind `curl | bash`.
     - Unpinned third-party Actions from untrusted publishers.
   - Suggest safer alternatives and show concrete YAML changes.

6. **Produce a concise, actionable plan**
   - Summarize your findings and proposed improvements in bullets, grouped as:
     - “Critical fixes”
     - “High-impact optimizations”
     - “Nice-to-have refactors”
   - For each item, include:
     - The workflow file and job/step name.
     - A short rationale.
     - A short code snippet or diff of the proposed change.

## Output format

Always respond in this structure:

1. **Overview**
   - 2–4 bullet summary of what you did and what you found.

2. **Issues and recommendations**
   - Grouped by workflow file.
   - For each issue:
     - A heading: `### [workflow-file].yml – [short description]`
     - A brief explanation of:
       - Root cause.
       - Impact (breakage, flakiness, performance, security).
     - A suggested fix with YAML snippet or unified diff.

3. **Optimized sample workflow (when applicable)**
   - If you propose a substantial refactor, show a full, updated workflow file that can replace the existing one.
   - Ensure it is valid YAML, properly indented, and ready to paste.

4. **Checklist**
   - A bullet list of concrete actions the user should take in order (for example “Update secrets X and Y”, “Enable required status checks for job Z”).

## Success criteria

- Recommendations are tied to specific workflow evidence.
- Critical release or packaging behavior is preserved unless a change is explicitly justified.
- The output makes it easy for a maintainer to apply the changes without a second clarification pass.

Keep explanations concise and highly technical, assuming the reader is an experienced engineer comfortable with GitHub Actions, monorepos, pnpm, Turborepo, and containerized deployments.

## How to use this prompt

- Place this file at `.github/prompts/maintaining-github-actions.prompt.md`.
- In Copilot Chat, run it with:
  - `/maintaining-github-actions`
  - Optionally followed by details, for example:
    - `/maintaining-github-actions: focus=ci.yml failing-on-main`

      # GitHub Actions Maintenance

      Use this prompt to audit, debug, and modernize the repository's GitHub Actions workflows without erasing valuable release-process context. Favor small, evidence-backed changes over large speculative refactors.

      ## Task

      Investigate the current workflow set, identify the highest-value improvements, and propose or implement the smallest coherent set of changes that improves reliability, security, performance, and operator clarity.

      ## Repository-specific context

      - This is a PNPM + Turborepo monorepo with backend, frontend, and desktop release surfaces.
      - Release and deployment behavior matters as much as CI correctness; do not simplify away important packaging or release safeguards.
      - Prefer exact workflow, job, and step references over vague recommendations.

      ## Context you should gather

      1. Discover all workflows and their purpose:
      - Enumerate files under `.github/workflows/`.
      - For each file, summarize:
        - Triggers (`on:`)
        - Jobs and their responsibilities
        - Key dependencies (Node, pnpm, Turborepo, Docker, etc.).
      2. Identify pain points and risks:
      - Recent failing runs, flaky jobs, or long-running steps.
      - Deprecated or pinned-too-old actions (for example `@v1`, `@v2`).
      - Misconfigured or missing permissions, secrets, or environment variables.
      3. Understand project characteristics:
      - Language and ecosystem (Node/TypeScript, monorepo vs single package).
      - Build and test commands.
      - Packaging and deployment targets (Docker, registries, cloud providers, etc.).

      Ask clarifying questions if any of this information is missing or ambiguous.

    - Diagnose likely failure causes based on:
      - Step ordering.
      - Missing `needs:`.
      - Incorrect paths, cache keys, or environment variables.
      - Misuse of `secrets.*` or `github.*` context.
    - Propose a small, focused patch that:
      - Fixes the root cause.
      - Preserves existing behavior unless the user explicitly approves a change.
    - Show the **patch as a diff** (unified diff) and the resulting full job snippet if helpful.

3. **Update & modernize**
   - Suggest version bumps to maintained marketplace actions (for example `actions/checkout@v4`, `actions/cache@v4`, `actions/setup-node@v4`), and note any breaking changes to consider.
   - Replace anti-patterns such as:
     - Shell scripting large logic blocks inline instead of using composite or reusable workflows.
     - Repeated steps across jobs that could be refactored.
   - If appropriate, propose:
     - Reusable workflows (`.github/workflows/reusable-*.yml`) for shared CI patterns.
     - Job matrices for OS/Node versions instead of copy-pasted jobs.

4. **Optimize performance & cost**
   - Add or improve caching strategies:
     - Use `actions/cache` or ecosystem-specific cache helpers for pnpm, npm, Turborepo, etc.
     - Choose cache keys that balance hit rate and correctness.
   - Remove redundant work:
     - Avoid re-running installs or builds when artifacts or caches are available.
     - Skip expensive jobs when changes are limited (for example `paths` / `paths-ignore` or per-path conditions).
   - Recommend environment and concurrency improvements:
     - Use `concurrency:` to prevent overlapping runs for the same branch.
     - Prefer appropriate runners and matrix scope rather than over-broad combinations.

5. **Harden security & reliability**
   - Add or refine `permissions:` at workflow/job level to follow least-privilege.
   - Review use of `GITHUB_TOKEN` and any personal access tokens; ensure they are pulled from `secrets.*`.
   - Highlight risky patterns:
     - `pull_request_target` misuse.
     - Blind `curl | bash`.
     - Unpinned third-party Actions from untrusted publishers.
   - Suggest safer alternatives and show concrete YAML changes.

6. **Produce a concise, actionable plan**
   - Summarize your findings and proposed improvements in bullets, grouped as:
     - “Critical fixes”
     - “High-impact optimizations”
     - “Nice-to-have refactors”
   - For each item, include:
     - The workflow file and job/step name.
     - A short rationale.
     - A short code snippet or diff of the proposed change.

---

## Output format

Always respond in this structure:

1. **Overview**
   - 2–4 bullet summary of what you did and what you found.

2. **Issues and recommendations**
   - Grouped by workflow file.
   - For each issue:
     - A heading: `### [workflow-file].yml – [short description]`
     - A brief explanation of:
       - Root cause.
       - Impact (breakage, flakiness, performance, security).
     - A suggested fix with YAML snippet or unified diff.

3. **Optimized sample workflow (when applicable)**
   - If you propose a substantial refactor, show a full, updated workflow file that can replace the existing one.
   - Ensure it is valid YAML, properly indented, and ready to paste.

4. **Checklist**
   - A bullet list of concrete actions the user should take in order (for example “Update secrets X and Y”, “Enable required status checks for job Z”).

## Success criteria

- Recommendations are tied to specific workflow evidence.
- Critical release or packaging behavior is preserved unless a change is explicitly justified.
- The output makes it easy for a maintainer to apply the changes without a second clarification pass.

Keep explanations concise and highly technical, assuming the reader is an experienced engineer comfortable with GitHub Actions, monorepos, pnpm, Turborepo, and containerized deployments.

---

## How to use this prompt

- Place this file at `.github/prompts/maintaining-github-actions.prompt.md`.
- In Copilot Chat, run it with:
  - `/maintaining-github-actions`
  - Optionally followed by details, for example:
    - `/maintaining-github-actions: focus=ci.yml failing-on-main`
