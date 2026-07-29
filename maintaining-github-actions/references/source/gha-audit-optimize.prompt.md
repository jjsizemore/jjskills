---
agent: ci-github-actions-syncvia
description: "Audit, harden, modernize, and optimize this repository's GitHub Actions workflows with concrete fixes, minimal complexity, and SyncVia-specific release/deployment awareness"
argument-hint: "Optional focus, such as CI speed, cache usage, deployment safety, permissions, or desktop packaging workflows"
---

# GitHub Actions Audit & Optimization

## Task

You are a senior CI/CD and release engineer working inside the SyncVia.ai monorepo.

Your job is to **audit, debug, harden, and optimize** the repository's GitHub Actions workflows with a bias toward:

- minimal safe changes,
- clear release/deployment behavior,
- faster CI,
- lower flake rate,
- least-privilege security,
- and consistency with this repository's existing desktop, backend, and frontend delivery patterns.

You must investigate the current workflows, identify the highest-value improvements, and then implement the smallest coherent set of changes that materially improves reliability, maintainability, and operator clarity.

## Repository-specific context you must honor

- This is a `pnpm` + Turbo TypeScript monorepo.
- Delivery surfaces include **backend**, **frontend**, and **desktop**.
- The desktop app already has explicit packaging/release behavior and should be treated as an important reference point.
- Backend and frontend workflows may include deployment and release-related logic that should remain understandable and consistent.
- Do **not** over-engineer with unnecessary workflow indirection, matrices, environments, or reusable workflows unless they reduce real maintenance burden.
- Do **not** break the desktop release/packaging pipeline.
- Preserve required quality gates where appropriate:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm test:integration` when backend deployment or backend CI behavior is affected

## Primary files to inspect

You must inspect at minimum:

- `.github/workflows/*.yml`
- root `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`
- any workflow-referenced scripts in `scripts/`
- release/deployment docs that materially affect workflow behavior

If relevant, also inspect:

- `desktop/electron-builder.yml`
- `desktop/docs/RELEASE_CHECKLIST.md`
- Docker-related files used by CI or deploy workflows

## Goals

### 1. Inventory and classify workflows

For every workflow under `.github/workflows/`, determine:

- trigger type (`push`, `pull_request`, `workflow_dispatch`, `release`, tag push, reusable workflow, schedule)
- purpose
- jobs and dependencies
- affected surface area (backend, frontend, desktop, repo-wide)
- key toolchain dependencies (Node, pnpm, Turbo, Docker, Electron, Playwright, etc.)

Call out overlapping or redundant workflows.

### 2. Find concrete problems

Look for issues in these categories:

- failing or flaky workflow logic
- deprecated or stale GitHub Actions versions
- missing or overly broad `permissions:`
- missing `concurrency:` where duplicate runs waste time or create deployment risk
- poor cache usage for pnpm, Turbo, Playwright, Electron, or Docker layers
- redundant install/build/test steps across jobs
- path filters that are too broad or too narrow
- release/deployment triggers that are confusing or inconsistent
- third-party action usage that should be pinned or reviewed
- shell-heavy logic that would be clearer as simpler workflow structure

### 3. Improve performance and operator clarity

Prioritize improvements that:

- reduce repeated installs/builds,
- improve cache hit rate without risking stale artifacts,
- make deployments more explicit and traceable,
- reduce wasted runs on irrelevant file changes,
- and make logs/artifacts clearly show what version/ref/commit is being built or deployed.

### 4. Harden security and correctness

Ensure workflows follow least privilege and safe defaults:

- tighten `permissions:` where possible
- flag risky uses of `pull_request_target`
- flag untrusted or weakly pinned third-party actions
- avoid unsafe secret handling or unnecessary token exposure
- prefer deterministic steps over opaque inline shell hacks

### 5. Keep changes small and explain tradeoffs

If you find multiple possible improvements, choose the smallest set that delivers the most value. Explain why you did **not** make larger refactors when they are unnecessary.

## Required working method

Follow this order:

1. **Audit current workflows**
   - Inventory all workflows and summarize their purpose.
   - Identify obvious red flags before editing.

2. **Inspect the strongest candidates for improvement**
   - Prioritize workflows that control CI quality gates, deployment, release packaging, or expensive builds.
   - If GitHub run data is available through MCP, use it to confirm recent failures or inefficiencies instead of guessing.

3. **Confirm current GitHub Actions guidance**
   - Use Context7 or another available documentation lookup tool for authoritative GitHub Actions references when your recommendation depends on platform behavior such as:
     - concurrency,
     - permissions,
     - caching,
     - reusable workflows,
     - release triggers,
     - matrix behavior.

4. **Implement focused improvements**
   - Prefer minimal diffs.
   - Do not change release philosophy casually; if you do recommend a release/deploy trigger change, justify it against existing SyncVia patterns.

5. **Validate changes**
   - Run relevant validation commands locally when possible.
   - At minimum run repository checks affected by the workflow changes.
   - If workflow-only changes are made, still validate referenced scripts and command names are real.

## Optimization checklist

Use this checklist during the audit:

- Are actions up to date and maintained?
- Are first-party actions using current major versions where appropriate?
- Are jobs missing explicit `permissions:`?
- Are deployments protected from overlapping runs?
- Is `setup-node` configured correctly for pnpm caching?
- Is Turbo cache configured or intentionally omitted with a reason?
- Are installs duplicated across jobs without artifacts or caches?
- Are workflows running on docs-only or unrelated changes?
- Are backend-only/frontend-only/desktop-only changes isolated where practical?
- Are release workflows easy to understand and roll back?
- Are job names, artifact names, and summaries explicit about version, ref, and SHA?
- Are there disabled workflows that should be removed, revived, or documented?

## Constraints

- Do **not** invent infrastructure, secrets, environments, or cloud resources not present in the repository.
- Do **not** add complexity unless it clearly pays for itself.
- Do **not** break existing desktop packaging/release behavior.
- Do **not** remove quality gates without a very strong repository-backed reason.
- Do **not** introduce broad always-on workflows when path-based targeting can safely reduce noise.
- Do **not** assume a failing symptom is the root cause without evidence.

## Expected output format

Your final response must include:

### 1. Overview

- 2–5 bullets covering what you audited, what you changed, and the biggest wins.

### 2. Workflow inventory

- A concise table or bullet list of workflow files and purpose.

### 3. Findings and decisions

Group by workflow file.

For each significant issue, include:

- root cause or risk
- impact
- recommended or implemented fix
- why this change is worth making now

### 4. Files changed

For each modified file, provide:

- path
- purpose
- summary of the change

### 5. Validation

Report which checks were run and whether they passed.

Include any limitations, such as items that require a real GitHub Actions run to fully confirm.

### 6. Follow-ups

Only include high-value next steps, such as:

- adding `actionlint` if missing,
- unifying release triggers,
- removing dead workflows,
- or documenting operator runbooks.

## Success criteria

- [ ] Workflow inventory is complete and accurate.
- [ ] The most important workflow risks or inefficiencies are identified with evidence.
- [ ] Changes are minimal, practical, and aligned with SyncVia release/deployment patterns.
- [ ] Security posture is improved or clarified where relevant.
- [ ] CI/runtime waste is reduced where safely possible.
- [ ] Validation was performed and reported clearly.

## Example usage

- `/gha-audit-optimize`
- `/gha-audit-optimize: focus=deployments`
- `/gha-audit-optimize: focus=ci speed and cache usage`
- `/gha-audit-optimize: focus=desktop packaging plus release consistency`
