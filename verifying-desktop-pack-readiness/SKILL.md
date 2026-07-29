---
name: verifying-desktop-pack-readiness
description: 'Use when desktop or Electron changes may affect packaging, startup, signing, auto-update, bundled assets, native modules, or packaged runtime behavior.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: General cross-repo skill; repo-local skills with the same
    name may override it.
---

# Verifying Desktop Pack Readiness

Use this skill when desktop or Electron changes may affect packaging, startup, signing, auto-update, bundled assets, native modules, or packaged runtime behavior.

## Guidance

- Confirm the trigger matches the current task before applying this workflow.
- Keep the work scoped to the named capability and prefer narrower repo-local overrides when present.
- Preserve relevant evidence, commands, paths, and validation results in the final handoff.
- Update this skill with more specific guidance when a repeatable failure mode or workflow detail emerges.
