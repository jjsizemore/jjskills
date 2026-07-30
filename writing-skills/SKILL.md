---
name: writing-skills
description: 'Use when working in the SyncVia repo to create, edit, test, validate, register, symlink, or publish repo-local Agent Skills with behavioral pressure tests and deterministic contracts.'
---

# Writing Skills (SyncVia)

Use the user-global `writing-skills` workflow for portable authoring rules. This
override adds SyncVia placement, metadata, mirror, and validation contracts.

## Iron Law

Behavioral skill changes require a failing pressure scenario before editing.
Mechanical placement, metadata, and symlink changes require a failing
deterministic contract. Keep scenario definitions and concise RED/GREEN
evidence; raw transcripts may stay temporary.

Pressure-runner manifests must pin regular source files. Reject a symlink in
the manifest root or in any source-path component through the final file, then
also retain realpath containment and copied-byte hash verification.

## Repo-local Skill CRUD Adapter

<!-- skill-governance: owner=writing-skills; role=controller; rule=repo-skill-crud -->

The controller MUST select exactly one CRUD leaf and must not duplicate a leaf's
placement, mirror, stale-guidance, or context-migration procedure.

<!-- /skill-governance -->

| Requested change                                                  | Leaf capability                  |
| ----------------------------------------------------------------- | -------------------------------- |
| Create, update, rename, consolidate, delete, metadata, or mirrors | `$governing-skills`              |
| Proven stale Skill, prompt, instruction, or routing guidance      | `$updating-stale-agent-guidance` |
| Canonical `.agents` source or agent-context migration             | `$migrating-agent-context`       |

## SyncVia Authoring Workflow

1. Inventory canonical source, references, metadata, index, and configured
   mirrors. Keep user-global `~/.agents` read-only in this repository story.
2. Add a failing deterministic contract or pressure scenario before changing
   behavioral guidance. Use the narrowest selected leaf for the repair.
3. Regenerate metadata, then run the selected leaf's validation. A real mirror
   conflict or unproven stale claim stops the operation rather than inviting a
   fallback.
4. Record RED/GREEN evidence and report only the changed canonical paths.

## Shared Validation

```bash
pnpm skills:metadata
pnpm skills:sync-symlinks -- --scope repo --directory-links --skill "<skill-name>"
pnpm skills:check-symlinks -- --scope repo --directory-links --skill "<skill-name>"
pnpm skills:validate
```

## Quality Contract

A high-quality skill must state:

- precise activation boundary and near-miss exclusions
- required inputs and evidence the agent should discover itself
- ordered workflow with decision points
- concrete output/proof bundle and stop condition
- edge, unhappy, permission, timeout, concurrency, and recovery behavior where
  relevant
- reusable leaf skills before new duplicated procedures
- explicit applicability decisions instead of silent omissions
- validation commands and honest blocker reporting

Move deep examples into `references/`, fragile reusable logic into `scripts/`,
and templates/assets into their matching directories. Keep `SKILL.md` under 500
lines and focused on default execution.

## Registration

Repo skill frontmatter `name` must match its lowercase kebab-case directory.
Descriptions must mention the SyncVia repo/repository/checkout activation
boundary. Update `.agents/skills/README.md`, `skills-lock.json`, and
`agents/openai.yaml` through existing generators.

## Pressure Scenarios

Read `references/pressure-scenarios.md` before changing this skill's behavior.
The checked-in CRUD manifest declares `openai/gpt-5.6-terra` and
`moonshotai/kimi-k2.7` coverage. Deterministic harnesses validate scenario
plumbing only; model-quality evidence requires an explicitly approved client.
