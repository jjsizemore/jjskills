---
name: writing-skills
description: 'Use when creating, editing, testing, or publishing Agent Skills at user or repository scope; use stale-guidance diagnosis first when repairing a proven contradiction.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable skill authoring; repository overrides add local commands and registration.
---

# Writing Skills

Author one canonical skill and expose it through same-scope discovery links.
The [portable completion contract](../references/autonomous-completion-contract.md)
owns authority, evidence reuse, review and delivery.

## Workflow

1. Resolve the assigned scope and applicable repository override. User-scope
   work edits the version-controlled source behind `~/.agents/skills`;
   repository work follows that repository's canonical skill root. Use
   [governing-skills](../governing-skills/SKILL.md) for placement, mirrors,
   rename or deletion. Preserve unrelated edits and real mirror conflicts.
2. For stale instructions, consume the diagnosis from
   [updating-stale-agent-guidance](../updating-stale-agent-guidance/SKILL.md).
   If that controller called this skill, continue its established repair here;
   do not restart diagnosis or route back to the controller.
3. Before a behavioral edit, capture a failing pressure scenario. Mechanical
   placement, metadata and link repairs need a failing deterministic contract.
   Reuse matching existing evidence. Define the relevant unhappy path; the
   [pressure scenarios](references/pressure-scenarios.md) give a minimal case.
4. Write the smallest complete workflow: activation boundary, discoverable
   inputs, ordered actions, decisive evidence, actual stop conditions and
   output. Link existing leaf procedures instead of copying their rules.
   Keep `SKILL.md` focused and under 500 lines; disclose deep references,
   scripts and examples only where needed.
5. Run the regression and affected checks. Validate frontmatter name against
   the directory, resolve changed links, and read the skill through the actual
   provider discovery path. Run only generators and validators present at the
   assigned scope; repository package commands are not user-scope defaults.
6. Publish and adopt through the requested endpoint using
   [closing-repo-work](../closing-repo-work/SKILL.md). Record the exact source,
   proof, preserved conflicts and remaining limitations in the existing record.

Pressure-runner manifests must pin regular source files. Reject symlinks in
any source-path component, including the root and final file; retain realpath
containment and copied-byte hash verification. A deterministic harness proves
plumbing, not model behavior. Claim model-quality coverage only for actual
completed runs with identified subjects and clients.
