---
name: updating-stale-agent-guidance
description: 'Use when agent instructions, skills, prompts, rules, routing, or tool guidance may be stale, contradictory, broken, or out of sync with a repository or its current tooling; do not use for creating new guidance from scratch or for ordinary product documentation freshness.'
---

# Updating Stale Agent Guidance

Repair agentic guidance from current repository evidence. The goal is one
trustworthy source of truth, discoverable through the tools that need it, with
no silent loss of local work or compatibility behavior.

## Use this skill when

- an agent follows an instruction that no longer matches the code, scripts,
  workflow, product direction, or current tool behavior;
- a rule, prompt, skill, routing entry, or bootstrap file names a moved,
  renamed, missing, or unsupported path or command;
- two guidance surfaces disagree and the canonical owner must be identified;
- a repository has copied or broken agent guidance that should be centralized;
- an agent reports a repeatable failure caused by stale instructions.

## Do not use this skill when

- the task is only to create a new skill or edit an existing skill's behavior;
  route to `writing-skills`;
- the task is to inventory, centralize, deduplicate, move, or mirror skills
  without a confirmed stale-guidance defect; route to `governing-skills`;
- the task is to create or revise a repository agent file without a stale
  trigger; route to the repository's agent-file governance skill;
- the task is ordinary product documentation freshness unrelated to agentic
  execution; follow the repository's documentation-freshness workflow;
- the only evidence is a vague feeling that guidance “looks old.” First find
  a current-state contradiction or report that no stale defect was proven.

## Required evidence

Discover these before asking the developer for facts that the repository can
provide:

1. Repository root, current branch/worktree, dirty paths, and active-work or
   coordination state when the repository defines them.
2. Applicable root and nearest-path instructions, including bootstrap files,
   governance docs, local skills, prompts, routing indexes, and generated
   metadata rules.
3. The current source of truth for the disputed behavior: implementation,
   package scripts, configuration, workflow, official tool documentation, or
   a fresh command result. Prefer current executable/config evidence over prose.
4. Every affected guidance surface and its relationship to the source:
   canonical file, generated file, compatibility mirror, symlink, copy, or
   independent local override.
5. A concrete stale symptom, contradiction, broken path, failed command, or
   minimal reproduction. Record why existing checks did not catch it.

If evidence is incomplete, separate confirmed facts from hypotheses. Do not
edit guidance merely to make two uncertain claims agree.

## Workflow

### 1. Establish the boundary

State the stale claim in one sentence and identify the affected agent/user,
repository, path, or command. Read local instructions before editing. Detect
whether the work is global, repository-local, or both; never assume a global
repair should overwrite a repository override.

For a tool, SDK, framework, API, or CLI behavior that matters to the repair,
consult current official documentation using the repository's required docs
workflow before treating recall as evidence.

### 2. Inventory the guidance graph

Build a small map from the stale surface to its canonical owner and consumers.
Inspect real paths, symlink targets, frontmatter names, generated indexes, and
references to old names or commands. Classify each related artifact as:

- canonical source;
- generated or derived artifact;
- same-scope discovery mirror;
- repository override;
- independent guidance that needs separate review;
- missing, broken, cross-scope, divergent, or unknown.

Use `governing-skills` for cross-tree skill inventory and mirror decisions. Use
`governing-agent-files` for repository agent-file routing and inventory. Do not
reimplement their placement or conflict rules here.

### 3. Prove the defect and define the smallest repair

Reproduce the failure when feasible: run the named command, resolve the named
path, follow the routing entry, or use a disposable prompt against the stale
guidance. Capture the decisive omission or wrong behavior.

Define a regression scenario that fails with the stale guidance and passes with
the repair. Include the relevant pressure case: ambiguity, urgency or a
shortcut, missing evidence, conflicting local guidance, permission failure,
timeout, concurrent edits, or recovery after a failed update. For mechanical
placement/link changes, define a deterministic contract instead.

Choose the narrowest durable fix:

- edit the canonical source when downstream surfaces are generated or linked;
- update each genuinely independent consumer only when its local contract
  differs;
- regenerate indexes/metadata using the repository's existing generator;
- preserve real files, divergent copies, dirty user changes, and unknown
  ownership for explicit review;
- add a local override only when the repository intentionally differs from the
  portable rule and that boundary is documented.

Do not silently rewrite copied guidance, generated output, lockfiles, or
another agent's changes. Do not broaden the repair into a general cleanup.

### 4. Apply the repair through existing leaf workflows

Use the relevant existing skill rather than duplicating its procedure:

- `writing-skills` for skill content, metadata, scenarios, or publication;
- `governing-skills` for canonical placement, deduplication, and mirrors;
- `governing-agent-files` for repository agent files and routing indexes;
- `governing-prompts` for prompt ownership and prompt routing;
- `migrating-agent-context` for broader AGENTS/bootstrap/context migrations;
- `verifying-before-completion` for the final evidence gate;
- the repository's root-cause/remediation workflow when stale guidance caused
  a user, production, CI, security, or reliability incident.

Keep the controller responsible for evidence, scope, integration, and the
final proof bundle; let each leaf skill own its specialized mechanics.

### 5. Validate as an agent and as an operator

Run the smallest checks that prove the changed claim, then the applicable
repository gates. At minimum:

- parse frontmatter and verify name/path alignment for changed skills;
- resolve every changed link and verify same-scope containment;
- search for stale names, paths, commands, and contradictory copies;
- run existing metadata, routing, documentation, or agent validators;
- read the changed artifact in the same way the affected agent discovers it;
- run the regression scenario and its meaningful unhappy path;
- inspect the final diff and ensure only intentional paths changed.

If a repository has no validator, perform deterministic shell checks and state
that no repository-specific validator exists. Do not claim a behavioral repair
from static inspection alone when a runnable reproduction is available.

### User-run test handoff contract

Whenever the next validation step requires the user or another operator to run
a test manually, the user-facing request MUST include a literal, ready-to-use
block labeled `Paste this` or `Do this`, every time. Include the destination
and actor/account, the exact message or UI action, the expected result, and the
identifier or screenshot the operator should report back. For a matrix, give a
separate block for each case or one numbered block with unambiguous boundaries;
never ask the operator to “test” or “tell me when done” without the payload.

If the case is a click, upload, DM, thread, or other action without a single
message to paste, provide the exact UI action plus any literal text and
filename required. Use placeholders only when the missing value is itself the
explicit blocker. Do not put credentials, tokens, or other secrets in a
pasteable block.

### 6. Stop at a real boundary

Stop and report when:

- the canonical owner is ambiguous and choosing would risk deleting or
  overriding intentional local policy;
- a real file, divergent copy, cross-scope link, or concurrent edit conflicts
  with the proposed repair;
- required permissions, credentials, network access, or external tool docs are
  unavailable;
- the stale condition cannot be reproduced and current evidence does not prove
  which wording is correct.

In each case, leave unrelated work untouched and report the exact blocker,
evidence collected, safe partial result, and next action needed. A blocked
repair is not permission to invent a workaround or silently mark guidance
current.

## Required proof bundle

The final handoff must include:

- stale claim, affected scope, and root-cause evidence;
- canonical source and affected consumers/mirrors, including preserved
  conflicts;
- files changed and why each was necessary;
- regression scenario or deterministic contract, with RED/GREEN or before/after
  evidence;
- exact validation commands and outcomes;
- explicit `Not applicable — <reason>` entries for UX, operator notification,
  rollout, rollback, or external-doc checks that do not apply;
- remaining stale risks, blocked checks, and the precise next step.
- for every requested user-run test, the corresponding `Paste this` or `Do
  this` block and the evidence the operator must return;

For incident or release-sensitive guidance, also include user recovery/status,
operator notification/observability, rollout go/no-go, and rollback criteria.

## Completion criteria

The task is complete only when the stale defect is evidenced, the canonical
repair is applied, all required consumers are reconciled, regression protection
passes, and the proof bundle is independently verifiable. If only analysis was
authorized, stop after the evidence-backed repair recommendation and do not
edit files.
