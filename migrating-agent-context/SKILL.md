---
name: migrating-agent-context
description: 'Use when working in the SyncVia repo to migrate repository agent context, canonical Skill sources, or instruction routing; not for ordinary product implementation.'
---

# Migrating Agent Context (SyncVia)

This leaf moves or consolidates repository agent context while preserving one
checked-in canonical source and explicit discovery relationships.

## Migration Boundary

<!-- skill-governance: owner=migrating-agent-context; role=leaf; rule=canonical-context-migration -->

This leaf MUST preserve a canonical `.agents` source and explicit same-scope
discovery mirror boundaries throughout a context migration.

<!-- /skill-governance -->

## Migration Workflow

1. Inventory canonical source, consumers, generated artifacts, mirrors, and
   local overrides before moving files.
2. Choose the narrowest canonical destination. Keep portability in global
   guidance and SyncVia-specific mechanics in this repository.
3. Update only true consumers. Delegate metadata, index, and mirror handling to
   `$governing-skills`; delegate a proven wording defect to
   `$updating-stale-agent-guidance`.
4. Validate discovery from the affected agent surface and search for stale
   routing references before declaring the migration complete.

## Progressive Detail

Read [migration inventory](references/migration-inventory.md) when consumers
span bootstraps, generated indexes, or compatibility mirrors.

## Pressure Coverage

`writing-skills/tests/manifest.json` declares `openai/gpt-5.6-terra` and
`moonshotai/kimi-k2.7` coverage for context-aware stale-guidance repair.
