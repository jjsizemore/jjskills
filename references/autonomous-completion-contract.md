# Portable Autonomous Completion Contract

Provider-neutral authority, proof, recovery, and completion boundary for repository work.
Repository adapters may add commands and evidence, not weaken these fail-closed rules.

## Task class and authority

Classify task class, risk, project/environment, data/resources/privileges, ownership,
restrictions, and delivery target at intake. Assignment authorizes necessary actions
inside those boundaries, not collateral effects, unrelated privileges, or prohibited actions.
A filename, credential, or deletion keyword is not a gate. Preserve sealed endpoints
and local-only restrictions; new defaults never retarget existing runs or this repair.
Future end-to-end delivery defaults to B: reviewed green merge plus applicable staging.
Production C requires explicit selection at assignment, authorizing necessary in-scope
steps without routine second approval. Record the immutable target once; explicit
PR, merge, or local-only targets win. If staging is genuinely inapplicable, finish the
highest applicable authorized endpoint and record why; never invent staging, deploy
unrelated hosts, or claim production from source/merge proof. Scale proof to actual risk/target.
Choose one existing execution system/owner and independent reviewer; add only genuinely
independent lanes within resource limits, not coordinator-to-clerk-to-coder chains.
Reuse consolidated source/ownership/dirty-state/gate preflight until a specific invalidator.
Freeze sufficient baseline and postchecks before editing; setup failure is not RED proof.
Expand checks only for concrete risk or failed criteria. Sufficient facts/authority mean
execute directly: no routine second plan, approval, or owner transfer; no gate bypass.

Actions are `AUTONOMOUS`, `APPROVAL_REQUIRED`, or `PROHIBITED`:

- **AUTONOMOUS**: necessary assigned inspection, disjoint delegation, owned edits,
  checks/recovery and delivery within recorded ownership/access/impact/endpoint boundaries.
  Assigned disposable CI fixture/cache replacement, named inactive runner busy-free
  replacement, scoped CI credential creation through authorized access, or named obsolete
  dataset deletion are task-implied; never expose secrets. Registration repair does not
  authorize customer-account deletion or wider organization privileges.
- **APPROVAL_REQUIRED**: crossing project/environment, data/resource/privilege or delivery
  boundaries; unavailable/unauthorized access; mandatory human presence; material
  product/legal decisions; unresolved material security, collateral data-loss or release
  risk. Ask for exact missing decision/access, not blanket approval for credentials or
  irreversibility. Preserve specific prohibitions and intentional local safeguards.
- **PROHIBITED**: hiding failures, weakening/deleting tests to pass, bypassing architecture,
  security or quality gates, exposing secrets, or continuing/polling/retrying/waking/queueing/
  delegating/repeating unchanged blocker requests for human-gated actions or dependents
  without fresh decisive clearance. Independent authorized lanes may continue.

Unlisted actions follow assignment necessity and current impact evidence; material
scope/authority uncertainty needs exact resolution. `PROHIBITED` takes precedence.

## Proof and terminal states

Use smallest sufficient change-risk/acceptance proof. Mechanical work needs deterministic
checks, not mandatory review; behavior work needs targeted regression, affected checks,
changed-path smoke and one fresh capable independent review. High-impact work adds checks
for identified material risk, not every suite. Authority/CI-lifecycle guidance is not low
risk merely because Markdown/configuration. Record guidance, diagnostics, user/operator
status, recovery/rollback and ownership; use `Not applicable — reason` for absent boundaries.
Review binds current immutable source/diff and fresh proof, with equivalent context and
capability; equivalent providers may substitute, missing review cannot. Mechanical checks
may supply the independent deterministic oracle. Lower proof tiers cannot replace higher.

| Task class | Applicable boundary evidence (scaled by change risk) |
| --- | --- |
| Documentation/skill-only | Contract/Markdown checks; behavior/authority guidance adds real pressure/smoke and one independent review |
| Product change | Targeted behavior regression, affected checks, changed-path smoke and one independent review |
| Release-sensitive | Above plus identified release guardrails and expected artifact/SHA evidence |
| Deployment/promotion | Authorized target's merge/artifact/deployment/runtime/version/UAT chain only |
| Runner/fleet repair | Named lifecycle/canary and target-scope evidence under the selected supported procedure |

These rows do not create unrelated deployment, UX, host, or release work.

- `VERIFIED`: all requested endpoints satisfy applicable proof with an independent oracle.
- `BLOCKED`: every remaining unverified requested item genuinely depends on an exact
  external-human gate after permitted bounded recovery.
- `PAUSED`: recorded global budget/suspension requires whole-run pause, or immutable limits
  leave no authorized work reachable. Exhausted lane/boundary budgets park only that lane;
  independent lanes continue within their own remaining allowances. Never reset budgets or invent outages.
`VERIFIED` also requires the delivery proof the recorded endpoint demands (see `closing-repo-work`, `work-run-state`).

Only the controller emits one whole-run terminal state; workers return proof/blockers.
Continue to the recorded endpoint: plans, delegation, local tests, PR/merge, phase/thread
status, one failing test, `done`, `MERGE READY`, green CI or `IN_PROGRESS` are not terminal
proof when more is required. Unmet proof withholds `VERIFIED`, not reachable authorized work.

## Recovery and ownership

Record each failed boundary's stable ID, expected result, decisive artifact, hypothesis,
change/result, owner, rollback and next command. Preserve sealed limits, identities,
approvals, endpoints, freezes and original gates; never reset/raise sealed budgets, invent
identity/endpoint or duplicate active implementation. New authorized initialization or
recovery-rebinding uses actual native/durable IDs. Use existing resource caps/remaining
budgets, not a universal retry stop. Continue causal progress while authority/resources
permit; change strategy on stalls or park exhaustion. No blind ambiguous-write/gated retry;
changed hypotheses need decisive proof. Exhaustion allows only authorized reversible rollback/quarantine.
- Recover safely through existing authorized paths before classifying human gates; inspect
  native state/receipts, preserve user work/current owners, repair owned checks without
  weakening them, and never duplicate an uncertain possibly-written attempt.
Human intervention requires exact unavailable access/permission or mandatory presence,
an unassigned impact/authority boundary, genuine unresolved material product/legal choice,
or proven unavailable external dependency after bounded recovery. Assigned irreversible
work is not keyword-gated; specific prohibitions, collateral safety, lifecycle `Unknown`
and active-job safeguards remain binding. Reconcile disagreements with current authoritative
proof; unresolved material authority/security/privacy/product/legal/release disputes fail
closed only on disputed actions/dependents. Reviewers cannot authorize prohibitions;
verify immutable `SHA`/`diff` bindings. One signer refusal, `UNKNOWN` metadata or unanswered
owner is not a system outage; never bypass designated signer/original gate. Lifecycle
`Unknown`/active markers forbid dependent actuation; external failure needs fresh proof.
Controller owns plan/shared files/dispatch/evidence/stop/terminal decisions. Leaves edit
exclusive surfaces and return proof/blockers; shared work is controller-sequenced. Park
only gated/exhausted actions/dependents; independent lanes retain their own budgets/ownership.

Every terminal `BLOCKED` or `PAUSED` report identifies the exact boundary, why it
cannot proceed, accountable owner, attempted recovery/evidence, one exact next action,
expected decisive proof, rollback disposition, and precise human unblock where
required.
Include `Unblock instructions (human-gated)` for exact human input/action, including
exhausted-budget decisions without reset. An ACK requires exact authoritative evidence
bound to its mission/reply, not delivery/status/reconnect/inference; never invent delivery or ACK.
Handoff grants no gated actuation. Resume only after fresh decisive clearance of original
gate, or explicit authorization for one already-permitted bounded action with preconditions.
Elapsed time, repeated `continue`, reconnects, stale status or unrelated progress cannot clear
it. Do not repeat/poll/retry/wake/queue/delegate unchanged gates; independent lanes remain eligible.
