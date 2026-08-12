# Agent Workflow Coordination Context

This context defines the shared language used by skills that coordinate planning, execution, handoff, and verification. It covers cross-skill workflow concepts, not individual skill internals or runtime/install behavior.

## Work lifecycle

**Run**:
A durable container and recovery boundary that can contain multiple stories.
_Avoid_: story when referring to the container.

**Story**:
An independently verifiable change within a run, with acceptance criteria, validation, and a pass or blocked outcome.
_Avoid_: task when referring to the durable lifecycle object.

**Task**:
An informal or nested checklist item used to organize work inside a story; it is not the shared durable lifecycle object.
_Avoid_: story when referring only to a checklist item.
## States and continuity

**Run state**:
The operational state of a run: `planned`, `active`, `blocked`, `completed`, or `cancelled`.

**Story state**:
The work state of a story: `pending`, `in_progress`, `passed`, or `blocked`.

**Handoff**:
The state-transfer record another agent needs to continue work, including relevant paths, commands, validation, and blockers.

**Evidence**:
The proof bundle supporting claims about what was observed, changed, or validated.

## Parallel work

**Parallel work**:
Concurrent work on independent stories using isolated mutable workspaces and uniquely owned branches, followed by controlled integration and validation. Workspace isolation prevents accidental checkout and staging interference; it does not prevent incompatible design decisions, shared-resource collisions, or semantic conflicts.

_Avoid_: “safe because Git merged cleanly”.

## Scope

**Capability**:
The bounded user-visible or operator-visible outcome that a skill or workflow owns.
_Avoid_: skill package, implementation area.

## Governance

**Canonical term**:
The root-context term that governs cross-skill language; a skill may add narrower vocabulary only when explicitly scoped and without redefining it.
_Avoid_: local redefinition.

**Story completion**:
A story is complete only when its acceptance criteria are satisfied, scoped validation has run, evidence is recorded, and handoff/progress state is updated for recovery.
_Avoid_: agent declaration.

**Avoided alias**:
A misleading synonym listed under `_Avoid_` so maintainers and agents can replace it with the canonical term.
_Avoid_: interchangeable synonym.

## Boundary

**Workflow coordination**:
The shared domain of cross-skill planning, execution, recovery, verification, handoff, and parallel coordination.
_Avoid_: runtime/install, catalog/discovery, or specialist business domain.

## Blockers and conflicts

**Blocked story**:
A story that cannot currently satisfy its acceptance criteria; it does not block the run unless no other story can safely progress or the blocker affects a global prerequisite.

**Glossary conflict**:
A disagreement between a shared root term and a skill-local term, resolved through review and root-context correction; a narrower term survives only with an explicit scope qualifier.

**Cancellation**:
An explicit operator or maintainer decision that stops new story work while preserving existing evidence and handoff state; it is distinct from a temporary blocker.

**Story dependency**:
An explicit prerequisite relationship that prevents a dependent story from entering `in_progress` until its prerequisite passes.

**Validation failure**:
Evidence that a story is not passed; the story remains `in_progress` while the assigned agent can remediate it and becomes `blocked` only when an external decision, resource, or prerequisite is required.

**Run completion**:
A run is `completed` only when every non-cancelled story is `passed`; unresolved blocked stories keep the run blocked.

**Acceptance contract**:
The agreed criteria that define a story’s outcome; any change must be recorded and followed by revalidation of affected criteria.

**Reproducible evidence**:
Evidence that identifies what was checked, where, how, and with what result, so another agent can assess or repeat the claim.

## Authority and truth

**Agent**:
The actor that executes stories and records evidence.

**Operator**:
The actor that makes run-level cancellation and blocker decisions.

**Maintainer**:
The actor that governs root terminology and resolves cross-skill glossary conflicts.

**Context authority**:
`CONTEXT.md` is authoritative for shared definitions; the run ledger is authoritative for live run and story state. Handoffs and evidence support recovery and proof but do not silently override either source.

**Integrated result**:
The combined output of parallel work after review and revalidation of affected acceptance contracts with reproducible evidence.

**Third-party skill**:
An upstream-owned skill whose content remains attached to its external update pipeline; this repository does not edit or locally redefine it.
_Avoid_: vendored skill.
