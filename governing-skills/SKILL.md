---
name: governing-skills
description: 'Use when working in the SyncVia repo to create, update, rename, consolidate, delete, or mirror repo-local Agent Skills; not for stale-guidance diagnosis.'
---

# Governing Skills (SyncVia)

This leaf owns checked-in repository Skill placement, registration, replacement
proof, and same-scope discovery mirrors. It does not mutate `~/.agents`.

## Canonical Ownership

<!-- skill-governance: owner=governing-skills; role=leaf; rule=canonical-placement-and-mirrors -->

This leaf MUST fail before mutation when a mirror target is a real file, real
directory, divergent copy, or unknown link.

<!-- /skill-governance -->

- Canonical source: `<repo>/.agents/skills/<name>/`.
- Metadata: `agents/openai.yaml`, `skills-lock.json`, and the local Skill index.
- Renames and deletions use `contracts/skill-governance-replacements.json` with
  reference, mirror, metadata, and index proof before removing a source.

## Replacement Proof

Rename, consolidate, and delete operations record a checked-in replacement
whose proof lists sorted references, mirrors, metadata, and index paths.

## CRUD Workflow

1. Inspect the Skill name, description, body length, direct references, index,
   metadata, replacement map, and configured mirrors.
2. Add or update the canonical directory. Keep names lowercase kebab-case with
   two to five words; describe the activation boundary in third person.
3. For rename, consolidate, or delete, add the replacement proof before removal.
4. Run metadata generation and the narrow mirror command. Preserve conflicts
   for explicit ownership review.

## Validation

```bash
pnpm skills:metadata
pnpm skills:sync-symlinks -- --scope repo --directory-links --skill "<skill-name>"
pnpm skills:check-symlinks -- --scope repo --directory-links --skill "<skill-name>"
node scripts/validate-agent-skills.mjs
```

## Progressive Detail

Read [mirror conflict policy](references/mirror-conflicts.md) only when a
mirror exists, is missing, or prevents a CRUD operation.

## Pressure Coverage

`writing-skills/tests/manifest.json` declares `openai/gpt-5.6-terra` and
`moonshotai/kimi-k2.7` coverage for create/update, rename/consolidate/delete,
and mirror-conflict behavior.
