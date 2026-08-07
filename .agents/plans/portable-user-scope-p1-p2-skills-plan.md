# Plan: Promote portable P1/P2 skills into user scope

**Version:** v3
**Date:** 2026-08-03
**Owner:** jermaine / Codex
**Status:** CONSENSUS REACHED
**Repository:** jjskills user-scope Agent Skills tree
**Source evidence:** read-only SyncVia source checkout `.agents/skills/` tree

## Goal

Promote the reusable parts of the SyncVia-only P1/P2 skills into the user
scope while keeping repository, provider, host, and credential mechanics behind
explicit adapters:

- **P1:** add portable user-acceptance-test authoring and agent-context
  efficiency guidance;
- **P2:** extract portable self-hosted-runner ownership and fleet-healing
  contracts only after a shared-fleet consumer gate proves the reusable
  boundary.

The result must compose with the existing user-scope lifecycle spine and must
not make the global tree silently SyncVia-specific.

## Non-goals

- Do not copy SyncVia paths, `syncvia-ci`, `ssh mini`, runner names, labels,
  `pnpm` commands, package names, or product selectors into user scope.
- Do not promote the SyncVia tutorial-sequence implementation or Stripe
  Directory/Projects workflows in this plan.
- Do not mutate hosts, runner fleets, external providers, credentials, or the
  live canonical bind during planning or contract validation.
- Do not create a second orchestration, UAT, or CI framework.
- Do not duplicate `verifying-before-completion`,
  `guarding-desktop-uat-regressions`, `maintaining-github-actions`, or
  `developing-with-tests`; compose with them and define the missing boundary.

## Current evidence

The SyncVia tree has nine skills absent from the user tree:

| Candidate | Current evidence | Initial disposition |
| --- | --- | --- |
| `adding-user-acceptance-tests` | 141-line workflow covering real user journeys, boundary matrices, persisted effects, failure/recovery, and external-provider limits. | Promote a provider-neutral core. |
| `using-headroom-context-efficiency` | 88-line workflow covering RTK, context compression, CodeGraph/tokensave, audit-reads, and explicit BYOK consent. | Promote with activation wording generalized to user scope. |
| `ci-runner-ownership` | Owns the `syncvia`/`syncvia-ci` repository boundary and host-proof rules. | Extract portable ownership contract only if the shared-fleet consumer gate passes; keep adapter mechanics local. |
| `healing-github-actions-runner-fleets` | Defines native canary, four-layer proof, staged rollout, quarantine, and rollback, but contains SyncVia host/repository mechanics. | Extract portable execution contract only if the shared-fleet consumer gate passes. |
| `creating-tutorial-sequences` | Tied to SyncVia Electron files, `ViewTutorial`, and product-specific selectors. | Keep repo-local. |
| `stripe-best-practices` | Stripe API/integration guidance with a SyncVia activation boundary. | Conditional future provider skill; not this plan. |
| `upgrade-stripe` | Stripe API/SDK version guidance with provider-version drift. | Conditional future provider skill; not this plan. |
| `stripe-directory` | Stripe Directory search and optional paid-service workflow. | Keep repo-local/account-bound. |
| `stripe-projects` | Stripe CLI Projects provisioning and generated credential state. | Keep repo-local/account-bound. |

Existing user-scope skills already cover the adjacent layers: role-based
completion proof, desktop UAT hardening, test development, GitHub Actions gate
work, release closeout, and portable delivery authority. P1/P2 must add only
the missing reusable contracts.

## Immutable planning handoff

```text
runId: portable-user-scope-p1-p2-20260803
trackingProvider: local
trackingIssueId: not_applicable
trackingKey: portable-user-scope-p1-p2
trackingUrl: not_applicable
gitBranchName: am/autonomous-delivery
sourceSpec: .agents/plans/portable-user-scope-p1-p2-skills-plan.md
orderedStoryIds: US-001, US-002, US-003, US-004, US-005, US-006
```

`trackingProvider=local` and the `not_applicable` tracker fields are explicit:
the current user-scope tree has no tracker adapter for this skill-tree change.
The tuple is immutable after execution binds it. A future adapter may supply a
real tracker identity before branch work, but may not infer one from the branch.

## Portable versus adapter boundary

| Surface | Portable user-scope contract | Adapter-owned inputs |
| --- | --- | --- |
| UAT authoring | User role, journey, boundary matrix, success/failure/recovery proof, persistence or handoff evidence, no false external guarantee. | Browser/Electron launcher, auth fixture, transaction fixture, selectors, package commands, external-provider spy, environment URLs. |
| Context efficiency | RTK-first reads, bounded compression, reusable-output retrieval, read-audit, subscription-first routing, explicit consent before BYOK/proxy. | Available binaries, MCP/tool names, client config locations, repository token budgets, approved external evaluators. |
| Runner ownership | Separate workflow ownership from host/fleet ownership; labels are routing, not health proof; native host truth and explicit owner required. | Hosting provider, infrastructure repository, host access path, runner groups/labels, OS/architecture classes, diagnostic commands, credentials. |
| Runner healing | Root-cause classification, one blind retry, bounded attempts, native canary, source proof, lifecycle proof, real-job proof, staged rollout, rollback. | Runner image/source identifiers, canary command, rollout/quarantine action, representative job, host monitor, rollback command, fleet inventory. |

Portable skills may return `not_applicable — no relevant surface` only after
the adapter proves the surface is absent. Missing host access, credentials,
provider facts, or required proof remains a blocker.

## P2 shared-fleet consumer gate

The gate applies to both P2 runner skills. It must pass before either P2 skill
is added to user scope. A second checkout, branch, or worktree of the same
repository is not a second consumer, and matching labels alone do not prove a
shared fleet.

Run a read-only evidence pass against distinct application repository origins:

1. Bind the task-scoped variable `RUNNER_GATE_CHECKOUT` to each candidate
   checkout in turn. Run `rtk proxy git -C "$RUNNER_GATE_CHECKOUT" remote
   get-url origin` and deduplicate by normalized repository origin. Exclude
   worktrees and the runner-infrastructure repository.
2. For each remaining origin, run `rtk proxy git -C "$RUNNER_GATE_CHECKOUT"
   ls-files '.github/workflows/*.yml' '.github/workflows/*.yaml'`, then inspect
   the tracked workflow directory with `rtk proxy rg -n
   'runs-on:|runner-group|runner group|self-hosted'
   "$RUNNER_GATE_CHECKOUT/.github/workflows"`. Record the workflow path and
   runner class/label set.
3. If group-to-repository membership is not provable from checked-in source,
   use the read-only GitHub adapter with task-scoped variables:
   `RUNNER_GATE_ORG` for the organization and `RUNNER_GATE_GROUP_ID` for the
   group. Run `rtk gh api --paginate
   "orgs/${RUNNER_GATE_ORG}/actions/runner-groups?per_page=100"` and
   `rtk gh api --paginate
   "orgs/${RUNNER_GATE_ORG}/actions/runner-groups/${RUNNER_GATE_GROUP_ID}/repositories?per_page=100"`.
   Do not print tokens or unredacted environment output.

The gate is `PASS` only when at least two distinct application repository
origins are demonstrably assigned to the same provider runner group/fleet and
use an overlapping runner class or label contract. Record the normalized
origins, workflow paths, group/fleet identity, runner class, evidence commands,
and observation date. If only one consumer is found, record exactly
`P2_SHARED_FLEET_GATE=NOT_APPLICABLE reason=no-second-consumer` in the plan
handoff/progress record and keep both P2 skills repository-local. If the
required repository or provider evidence cannot be read, record
`P2_SHARED_FLEET_GATE=BLOCKED` with one of
`reason=repository-origin-unavailable`, `reason=workflow-unreadable`, or
`reason=provider-group-membership-unreadable`; do not downgrade a
missing-evidence blocker to `not_applicable`.

The current broad workflow search is not gate evidence because it mixes
worktrees and does not establish distinct repository identity or shared group
membership.

## Contract-test RED/GREEN protocol

The contract harness must test the actual portable target paths and the
explicit P2 gate decision, not merely parse metadata. After adding the shared
pressure reference and harness but before adding promoted skills, run:

```bash
rtk node --test governing-skills/tests/portable-user-scope-promotion-contract.test.mjs
```

RED is a nonzero result naming each missing P1 target and the missing P2 target
or missing explicit P2 gate decision; a syntax error or an unreadable fixture
does not count. After the smallest skill/metadata changes, rerun the same
command for GREEN. GREEN requires both P1 targets to satisfy the portable
assertions and either both P2 targets to satisfy them when
`P2_SHARED_FLEET_GATE=PASS`, or both P2 targets to remain absent with the exact
`NOT_APPLICABLE`/`BLOCKED` decision recorded. This prevents conditional P2
scope from becoming a silent omission.

## Implementation order

1. Write deterministic RED pressure cases for the four candidate boundaries
   and define the explicit conditional P2 outcome.
2. Promote and adapt the P1 UAT skill.
3. Promote and adapt the P1 context-efficiency skill.
4. Run and record the P2 shared-fleet consumer gate.
5. If the gate passes, promote the P2 runner-ownership and runner-healing
   contracts; otherwise record both as repository-local/not applicable.
6. Register, validate, audit the canonical bind, and produce the final
   handoff.

## Execution stories

| id | title | priority | acceptance criteria |
| --- | --- | ---: | --- |
| US-001 | Define portable P1/P2 promotion contract and RED pressure cases | 1 | The four candidate boundaries, adapter inputs, exclusions, ownership, pressure cases, and conditional P2 gate outcome are explicit; SyncVia-only mechanics are classified rather than copied. |
| US-002 | Promote portable user-acceptance-test authoring | 1 | The skill proves real user-owned boundaries, success/failure/recovery and persisted/handoff effects; it composes with existing UAT/test/completion skills; mocked previews and live provider calls are rejected as proof. |
| US-003 | Promote portable context-efficiency guidance | 1 | The skill activates for context/tool-output pressure across repositories; RTK-first, bounded compression, stale-output handling, and explicit no-BYOK/proxy consent are clear; it does not duplicate repository AGENTS instructions. |
| US-004 | Extract portable CI runner ownership | 2 | After the shared-fleet gate, workflow/repository versus runner-infrastructure ownership, native host truth, label limitations, pre-read evidence, approval boundaries, and handoff to an infrastructure adapter are provider-neutral and tested; a failed gate records an explicit repository-local/not-applicable outcome. |
| US-005 | Extract portable runner-fleet healing | 2 | After the shared-fleet gate, failure classification, bounded recovery, native canary, four-layer proof, staged rollout, quarantine, rollback, and terminal evidence are portable; SyncVia host/repository commands remain adapter-only; a failed gate records an explicit repository-local/not-applicable outcome. |
| US-006 | Validate user-scope registration and closeout | 2 | Per-skill metadata, pressure/contract tests, governance checks, canonical-bind audit, scope hygiene, rollback path, and exact final handoff all pass; no unrelated files or live host state change. |

### US-001 — promotion contract and RED cases

- [ ] Add a shared pressure reference at
  `references/portable-user-scope-p1-p2-pressure-scenarios.md` covering:
  mocked-preview-as-UAT, missing persisted side effect, unauthorized live
  provider call, compression replacing discovery, stale compressed output,
  unapproved BYOK/proxy, labels-as-runner-health, wrong-repository runner edit,
  and broad rollout without native canary.
- [ ] Add the deterministic contract harness at
  `governing-skills/tests/portable-user-scope-promotion-contract.test.mjs`.
- [ ] Run the harness before promotion and capture a nonzero RED naming the
  missing target paths; after promotion or the explicit conditional P2 outcome,
  rerun it for GREEN using the protocol above.
- [ ] Record rejected promotion candidates and the P2 shared-fleet gate in the
  plan progress/handoff rather than silently omitting them.

### US-002 — portable UAT authoring

- [ ] Add `adding-user-acceptance-tests/SKILL.md` with provider-neutral
  activation, role/journey/boundary matrix, real-boundary test-tier choice,
  RED/GREEN evidence, failure/recovery assertions, external-provider boundary,
  and stop conditions.
- [ ] Add `adding-user-acceptance-tests/agents/openai.yaml` and link the shared
  pressure reference from the skill.
- [ ] Preserve composition with `developing-with-tests`,
  `guarding-desktop-uat-regressions`, and `verifying-before-completion`; do not
  copy SyncVia launcher names, package paths, or selectors.
- [ ] Add a contract assertion that a mocked renderer/bridge, isolated
  component test, or successful provider request alone cannot satisfy UAT.

### US-003 — portable context efficiency

- [ ] Add `using-headroom-context-efficiency/SKILL.md` with user-scope
  activation, RTK-first command guidance, bounded reusable compression,
  retrieval/audit behavior, and stale-output handling.
- [ ] Add `using-headroom-context-efficiency/agents/openai.yaml` and link the
  shared pressure reference.
- [ ] Keep subscription-first behavior and require explicit consent before any
  BYOK/proxy/provider-key setup; do not imply Headroom is required for normal
  work.
- [ ] Add a contract assertion for no compression-as-discovery-substitute and no
  one-shot compression that will not be reused.

### US-004 — portable runner ownership

- [ ] Run the P2 shared-fleet consumer gate before copying either runner skill;
  if it does not pass, record the exact `NOT_APPLICABLE` or `BLOCKED` decision
  and stop both P2 promotions.
- [ ] Add `ci-runner-ownership/SKILL.md` and
  `ci-runner-ownership/agents/openai.yaml` with generic repository/workflow
  versus infrastructure ownership and adapter handoff.
- [ ] Preserve the fail-closed rules: labels are routing only, source tests do
  not prove host health, and inconclusive workflow/host evidence stops before
  host mutation.
- [ ] Replace `syncvia-ci`, `ssh mini`, concrete runner names, and local paths
  with named adapter inputs and explicit `Not applicable — no host boundary`
  decisions where appropriate.
- [ ] Add a contract assertion for wrong-repository edits, labels-as-proof, and
  workflow-vs-host misclassification.

### US-005 — portable runner healing

- [ ] Add `healing-github-actions-runner-fleets/SKILL.md` and its metadata only
  if the shared-fleet consumer gate identifies a reusable cross-repository
  boundary; otherwise record the explicit gate outcome and retain both SyncVia
  runner skills locally.
- [ ] Retain the GitHub Actions name because GitHub Actions is this skill's
  provider activation boundary; make the body provider-neutral below that
  boundary and remove the SyncVia repository/host trigger.
- [ ] Define the portable four-layer proof: source regression, native runtime
  smoke, lifecycle canary, and representative hosted job; bind each to source,
  image, runner class, and job identity.
- [ ] Define one-canary-first, 25–50% wave, remainder, quarantine, rollback,
  terminal `VERIFIED`/`BLOCKED`/`PAUSED`, and bounded retry behavior.
- [ ] Keep host commands, fleet names, infrastructure repository names, and
  rollout credentials in the adapter; add contract assertions for broad rollout
  without canary and live-patch-only completion.

### US-006 — registration and closeout

- [ ] Add per-skill metadata only through the existing user-scope convention;
  no repository-only `pnpm` generator or mirror command is assumed.
- [ ] Run `rtk node --test governing-skills/tests/portable-user-scope-promotion-contract.test.mjs`.
- [ ] Run `rtk python3 governing-skills/scripts/audit_skill_governance_test.py`
  and `rtk python3 governing-skills/scripts/audit_skill_governance.py --strict`,
  reporting known classified warnings separately from errors.
- [ ] Verify `rtk realpath ~/.agents/skills` and each promoted canonical skill
  path after the user-skill bind is current; if the P2 gate fails, verify both
  P2 paths remain absent. Do not present worktree-only output as installed
  user-scope proof.
- [ ] Run `rtk git diff --check`, `rtk git status --short`, and a changed-path
  audit;
  confirm no SyncVia worktree, host, credential, generated, or local-only path
  changed.
- [ ] Report exact commands/results, rejected or not-applicable candidates,
  remaining risks, rollback/revert paths, and the next execution owner.

## Validation and evidence

The source-of-truth checks are the deterministic contract test, governance test,
strict audit, canonical-bind audit, and diff/status hygiene above. A live
deployment, hosted product UAT, runner rollout, and authenticated provider test
are `Not applicable — this is a user-scope skill-tree change`; host-side proof
must not be fabricated. The P2 gate result is also required evidence before
either runner skill is promoted.

## Rollout, rollback, and ownership

- The planning controller owns consensus and the immutable handoff.
- The execution controller owns story order, registration, validation, and the
  final closeout claim.
- The user-scope skill owner owns canonical content and metadata; repository
  adapters own provider commands, host access, and local overrides.
- Roll back by reverting the focused skill/reference/metadata changes in reverse
  story order. Do not delete or overwrite canonical binds, hosts, credentials,
  or SyncVia local skills.
- If the P2 consumer gate fails, stop P2 promotion and preserve its exact
  evidence as a deferred adapter-only outcome.

## Review history

- **v1 — NEEDS_REVISION:** The source evidence used an absolute machine path;
  the P2 consumer gate and RED/GREEN protocol were not executable enough for a
  conditional promotion.
- **v2 — CLEAN:** Removed the machine path, added the read-only distinct-origin
  and runner-group evidence gate, defined PASS/NOT_APPLICABLE/BLOCKED records,
  and made conditional contract-test outcomes explicit.
- **v3 — CLEAN:** Final default actionable review found no Blocking, Advisory,
  or Question findings. Nice-to-have polish is intentionally out of scope.

Consensus is reached for the latest version. Execution may begin only through
`executing-work`; the P2 gate remains a required execution-time decision.
