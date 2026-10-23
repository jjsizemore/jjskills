---
name: closing-repo-work
description: 'Use when sequencing repository-changing work from local evidence through the requested handoff, review, merge, deployment, and applicable post-change proof.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable lifecycle controller; repository-local adapters supply provider commands and gates.
---

# Repository Closeout Controller

## Scope

Use for repository-changing delivery: product code, tests, docs, skills,
prompts, CI, hooks, metadata, or self-healing changes. Read-only
investigation, planning-only work, and explicitly requested local-only work do
not enter this lifecycle.

The shared [portable autonomous completion contract](../references/autonomous-completion-contract.md)
defines authority, proof tiers, recovery, ownership, and terminal states.
Repository adapters add commands and provider facts; they may not weaken its
fail-closed boundaries.

## Controller interface

The controller accepts the repository intent, acceptance/todo coverage,
immutable intended diff, task class, requested endpoint, current phase, and
applicability result. It composes phase-bound evidence and returns exactly one
terminal report: `VERIFIED`, `BLOCKED`, or `PAUSED`. It does not replace leaf
ownership or invent evidence.

Bind the recorded endpoint and applicable authority delta under the portable
contract; this controller does not infer scope expansion. Its evidence bindings
permit retained proof with recorded source/input equivalence, not session-only
freshness. Hosted results and required approvals remain current-head/base-bound.

## Closeout sequence

1. **Pre-change** — confirm scope, task class, authority, acceptance criteria,
   any immutable identity or handoff required by the repository adapter, and
   release safeguards admission prerequisites for release-sensitive or reduced-gate work.
2. **Pre-commit** — require focused intended paths, regression/contract proof,
   and exact command output bound to the executed candidate inputs.
3. **Pre-push** — inspect staged paths, focused commits, clean intended diff,
   and passing applicable local gates before publishing. If the push itself
   directly triggers deployment/promotion or actuates reduced release gates,
   require verified release safeguards admission under the portable contract
   before publishing; pushing prerequisite implementation, tests, or fixes
   to establish safeguards remains permitted under existing review/check gates.
   Local-only or documentation work requires justified scoped not_applicable;
   high-impact surfaces (installers, authority guidance, auto-update, migrations,
   CI) cannot bypass safeguards via file-extension claims.
4. **Commit & push** — commit with semantic message including `Agent:` and `Model:` trailers. Push to the remote branch. If the user authorized local-only work, record the exception in the work-run ledger; otherwise push is mandatory and BLOCKS terminal state.
5. **PR & screenshots** — for product/UI delivery, bind the feature-trunk PR's current head and attach Gitshot proof for affected UI/UX. A merged PR is evidenced by its recorded post-push/current-head review, not by requiring it to remain open.
6. **Review/hosted** — bind the carrier SHA, PR URL, latest reviewed head,
   required checks, review threads, and mergeability. One capable independent
   review satisfies review requirements for behavior/high-impact work; advisory,
   style, and pre-existing unrelated findings are nonblocking under the canonical
   contract. Requested merge, green-CI, or a healthy unversioned endpoint is not proof.
7. **Post-change** — when merge or deployment is in scope, require verified
   release safeguards admission immediately before actual promotion, deployment,
   or reduced-gate actuation; bind actual merge SHA to artifact/release SHA,
   deployment result, runtime/version equality, authenticated smoke/UAT, tracking
   closure, and cleanup evidence.
8. **Pre-yield frontier check** — before yielding or a terminal report, account
   for every remaining authorized frontier (see below). Progress reports stay
   allowed while work continues.
9. **Terminal** — run only after all applicable proof is present, the pre-yield
   frontier check is complete, and an independent oracle confirms it. A `VERIFIED`
   terminal state requires committed+pushed code plus applicable post-push
   evidence; after merge, the PR is closed and is not required to remain open.

## Pre-yield frontier check

A gated publication does not gate the session. Do not yield until every remaining
authorized frontier (lane, ticket, review, dependent action) is completed or
concretely gated. For each, record:

- next causal action it can take now;
- retained owner/scope, without taking over another owner's protected scope;
- sufficient existing evidence, including an authoritative receipt that arrived
  despite an unanswered owner;
- concrete blocker, named by exact gate and owner, or `none`;
- bounded recovery attempted/result, with the decisive resume input if gated.

Execute a reachable action through its retained owner and consume the result;
dispatch, an unanswered prompt or a status request is not recovery or completion.
A scoped `BLOCKED`/`PAUSED` covers only its gated frontier and dependents and does
not end independent work. Gated publication, preserved ownership, leases, signer,
security, human-presence and sealed-budget limits stay in force; this check grants
no scope, retry or actuation.

## Leaf handoffs
Load a capability leaf only when the current procedure actually needs it; do not
load every specialist merely because repository delivery is in scope. Reuse a
capable review already bound to the same immutable source and relevant context.

| Capability | Owning leaf | Controller action |
| --- | --- | --- |
| RED/GREEN regression proof | `developing-with-tests` | Require phase-bound result |
| Role-based UAT | `verifying-before-completion` | Require applicable artifacts |
| Review/mergeability | `completing-branch-pr` | Require latest-head result |
| Hosted checks/review monitoring | `monitoring-prs-and-autofixing` | Require green checks and resolved threads |
| Deployment/runtime proof | `closing-deployment-pipelines` | Require artifact and runtime evidence |
| Owned failure repair | `debugging-systematically` then `remediating-root-causes` | Require diagnosis, repair, and revalidation |

Leaves return proof or a blocker; they do not declare whole-run completion.
Independent lanes may continue after a leaf failure, dependent lanes pause,
and shared-file work remains controller-sequenced.

## Blockers and output

Apply the portable contract's evidence invalidators, bounded recovery, dependency/
watcher ownership and scoped terminal/report rules. This controller composes leaf
proof; it neither clears live gates nor duplicates unchanged reviews/checkpoints.

Report current phase, task class, endpoint, immutable identity/diff bindings,
applicable proof/oracle records, leaf handoffs, exact commands/results, and
recovery/rollback scope or `Not applicable — reason`.

## Delivery conventions

- Use the provider's PR author, branch and commit identities as public provenance.
  Keep local worktree paths in local records. Repair a conflicting repository
  template or validator through its existing review/check flow for that metadata
  operation; do not retransmit metadata rejected by native privacy review.
- Include `Why / Rationale` and `Change Explanation` in the PR body. Write
  2–4 sentences directly explaining what changed, why, and the key behavior or
  trade-off to retain; do not route this through a teaching skill.
- Use a conventional commit message with `Agent:` and `Model:` trailers.
- Attach UI/UX screenshots with `npx gitshot <image> | gh pr comment <n> --body-file -`.
- Write an ADR under `docs/architecture/adr/` only for an architectural decision
  with evaluated alternatives, trade-offs, and rationale.
- Use the tracker already attached to the assignment. Search Linear only when
  the user or repository workflow uses it for this task; do not introduce a
  tracker, ledger or issue-creation prerequisite for ordinary ad-hoc work.
  If no applicable tracker exists, note that in the existing handoff. Missing
  optional tracker access is not an approval gate; never fabricate IDs or URLs.
- For release-sensitive work, record the release tag and SHA, downstream
  workflow conclusion, and matching runtime/version, or `Not applicable — <reason>`.
- After deployment, verify `/health` returns 200 with the expected service/version
  and inspect matching deployed bundle assets; an unversioned status is insufficient.
- Worktree removal is filesystem cleanup, not operational closeout.
- In `~/repos/worktrees/<repo>-agent-<N>`, load `managing-persistent-worktree-prs`
  before opening a PR.
- For HTPC, follow its repository `AGENTS.md` for paths, stack order, labels,
  health checks, and rollback.

The recorded endpoint's delivery criteria are:

- `VERIFIED`: the applicable proof tier passed with an independent oracle **AND** all of:
  - Product code changes are **committed** with semantic message and `Agent:`/`Model:` trailers.
  - Changes are **pushed** to the remote branch, or a `local-only` exception is recorded in the work-run ledger with user authorization.
  - For product/UI changes (feat/fix/refactor/perf touching frontend, desktop, or packages/ui), an **open PR** existed targeting `dev` (or the repo's feature trunk) and its body reflected the current head at push time.
  - **Gitshot screenshots** were attached to the PR for every UI/UX diff. Upload and comment via `npx gitshot <image> | gh pr comment <n> --body-file -`.
  - Docs-only, skill-only, or CI-only changes do not require a PR or screenshots for `VERIFIED`.
  - After merge, the PR is closed; terminal verification uses the recorded post-push PR evidence and does not require an open PR.
  - If any applicable item above is unmet, withhold `VERIFIED` and continue
    reachable authorized work. Use `BLOCKED`/`PAUSED` only under the scoped
    terminal conditions below.

For the scoped terminal conditions referenced above, see [Portable Autonomous Completion Contract](../references/autonomous-completion-contract.md).
