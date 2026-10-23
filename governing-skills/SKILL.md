---
name: governing-skills
description: 'Use when checking or changing Agent Skill placement, registration, canonical ownership, names, or discovery mirrors at user or repository scope; diagnose stale claims separately.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable canonical placement and mirror governance; repository overrides add local registration.
---

# Governing Skills

This leaf owns placement and discovery. Use
[writing-skills](../writing-skills/SKILL.md) for authoring and behavioral proof;
retain the calling controller's established diagnosis and assignment.

## Workflow

1. Resolve the assigned scope, source root, dirty paths, references and provider
   discovery surfaces. The [skills baseline](references/agent-skills-baseline.md)
   owns package requirements, canonical roots and same-scope link policy.
   A canonical root may itself link to its version-controlled source; compare
   resolved roots, not literal directory spelling.
2. Classify each consumer as canonical source, same-scope link, generated
   metadata, intentional repository override, real copy or unknown conflict.
   Preserve real directories, divergent copies, cross-scope links and unknown
   ownership. A link does not authorize overwriting its target.
3. Change the canonical source once. For rename, consolidation or deletion,
   account for references, metadata, indexes and discovery links before
   removing the old source. Use repository replacement maps and generators
   where present; do not invent repository files or commands at user scope.
4. Reconcile only the assigned same-scope mirrors. Dedicated empty scanner
   roots may use one directory link; mixed roots need per-skill links. Plugin
   caches remain provider-owned. The
   [mirror pressure scenario](references/pressure-scenarios.md) covers conflicts.
5. Validate metadata and affected links, then read the skill through the
   provider's discovery path. Run existing repository checks where applicable.
   Report exact changes, preserved conflicts and proof through the calling
   controller; do not create a second coordination record.

## Portable audit

Run this existing read-only audit for each affected skill:

```bash
python3 ~/.agents/skills/governing-skills/scripts/audit_skill_governance.py \
  --skill <skill-name> --agent-dir .codex/skills --strict
```

Select the actual provider mirror with `--agent-dir`; add `--repo <repo-root>`
for repository scope. `--fix-missing-symlinks` is an explicit mutation option:
use it only for assigned missing links after conflict inspection. It never
replaces an existing path. The audit cannot prove model behavior or delivery.
