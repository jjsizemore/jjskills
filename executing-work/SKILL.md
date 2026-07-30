---
name: executing-work
description: >-
  Use when taking repository work from a prompt, issue, plan, or spec through
  multi-story implementation and closeout using a durable .agents/runs ledger.
  Prefer resuming-work for interrupted runs; remediating-root-causes for a single
  diagnosed defect without a story board.
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable execute controller; repos may thin-override gates.
---

# Executing Work

## Role

**Controller** for green-path delivery. Composes leaves; does not restate TDD,
commit, or PR procedures.

## When to use

- User wants end-to-end execution from a plan/spec/issue
- Multi-story work that must survive interrupt/resume

## When not to use

| Situation | Use instead |
| --- | --- |
| Interrupted active run | `resuming-work` |
| Single diagnosed bug fix | `remediating-root-causes` |
| Planning only | `writing-plans` / `creating-implementation-specs` / `grill-me` |
| Stop active run | `canceling-work-run` |

## Required sub-skills

- `work-run-state` — ledger I/O
- `implementing-story` — one story body
- `verifying-before-completion` — evidence before claims
- `closing-repo-work` — commit/push/PR when board green
- `remediating-root-causes` — only on story failure path
- `grill-me` — **only if** plan/spec missing decisions after explore
- `writing-plans` or `creating-implementation-specs` — if no artifact yet

## Modes

| Mode | When | Behavior |
| --- | --- | --- |
| **In-session** | Interactive, small boards | Loop stories in this chat until done or blocked |
| **Outer-loop body** | Spawned by `work-run-loop.sh` | Exactly **one** story then exit |
| **Unattended multi-story** | Overnight / large | Human runs `work-run-loop.sh` after `init` |

Detect outer-loop via env `WORK_RUN_OUTER_LOOP=1` or user saying “one story only”.

## Workflow

### 1. Intake

1. Explore codebase for facts before asking.
2. If no current plan/spec and ambiguity remains → `grill-me` then plan/spec skill.
3. If plan/spec exists and is sufficient → **do not** re-grill.

### 2. Init run (`work-run-state`)

1. Derive run-id (issue key if any, else slug).
2. Build stories from plan/spec “Execution stories” appendix, or one story wrapping the whole plan.
3. `work-run.mjs init ...` (seals budget). Do not raise max later.

### 3. Loop

While incomplete stories and iteration &lt; sealed max:

1. `pick` next story.
2. `implementing-story` (mid tier implement; low tier explore).
3. On block → stop controller; report.
4. Append patterns to progress.md.
5. If outer-loop mode → exit after one story.

### 4. Closeout (board green only)

1. `verifying-before-completion` for final gates.
2. Multi-story or release-sensitive → **high** tier review once.
3. `closing-repo-work` (or repo override).
4. `work-run.mjs complete` → expect `WORK_RUN_COMPLETE run-id=...`.

## Model tiers (D5)

| Work | Tier |
| --- | --- |
| Status, pick, locate | low |
| Implement story | mid |
| Final / architecture / security review | high |

## Repo overrides

If a repo-local `executing-work` exists, prefer it for gates (Linear, worktrees,
pnpm). Overrides must **not** reintroduce `.current-work` as a story ledger.

## Stop conditions

- All stories pass + closeout done
- Story blocked after remediation
- Sealed budget exhausted
- Missing human decision after grill

## Pressure scenarios

See `references/pressure-scenarios.md`.
