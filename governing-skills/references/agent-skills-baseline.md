# Agent Skills Baseline

Use this reference when checking exact requirements or explaining why a skill should be reorganized.

## Spec Requirements

- A skill is a directory containing `SKILL.md`.
- `SKILL.md` starts with YAML frontmatter between `---` delimiters, followed by Markdown instructions.
- Required frontmatter fields: `name`, `description`.
- `name` is 1-64 characters, lowercase letters, numbers, and hyphens only, with no leading, trailing, or consecutive hyphens.
- `name` must match the parent directory name.
- `description` is non-empty, under 1024 characters, and should describe what the skill does and when to use it.
- Optional bundled resources belong under focused directories such as `scripts/`, `references/`, and `assets/`.
- Keep `SKILL.md` concise. Move detailed material into directly linked resource files.
- Reference files from `SKILL.md` with relative paths from the skill root.

## Placement Convention

The Agent Skills specification defines package contents, not a mandatory install path. The current client implementation guidance recommends scanning both client-native skill directories and `.agents/skills` at user and project scopes. It calls `.agents/skills` the cross-client sharing convention and notes `.claude/skills` compatibility scanning.

Practical policy for this environment:

- Canonical user skills: `~/.agents/skills/<skill-name>/`
- Canonical repo skills: `<repo>/.agents/skills/<skill-name>/`
- Agent-specific user compatibility links: `~/.claude/skills/<skill-name> -> ~/.agents/skills/<skill-name>`
- Agent-specific repo compatibility links: `<repo>/.claude/skills/<skill-name> -> <repo>/.agents/skills/<skill-name>`

Use other client-specific directories the same way: only as scanner compatibility surfaces unless that client has a hard requirement to own the source.
Compatibility links must stay within their level. A user-level mirror must not
point directly at a repo `.agents/skills` tree; use a user-level wrapper skill
when a cross-repo alias is required.

## Ownership Triage

- Fix user-owned and repo-owned `.agents/skills` issues directly.
- Treat `.codex/plugins/cache/**` as plugin-managed. Do not patch those files in
  place during ordinary governance work; report invalid names, directory
  mismatches, or oversized `SKILL.md` files as upstream/plugin findings.
- Treat duplicate names across user and plugin roots as an override question,
  not an automatic deletion request. Prefer runtime catalog evidence before
  removing local skills.
- For intentional user-level compatibility aliases that mention a specific repo,
  add:

```yaml
metadata:
  governing-skills-placement: user
  governing-skills-reason: "Compatibility alias for a repo skill across multiple worktrees."
```

## Official Sources

- https://github.com/agentskills/agentskills
- https://agentskills.io/specification
- https://agentskills.io/skill-creation/best-practices
- https://agentskills.io/skill-creation/using-scripts
- https://agentskills.io/skill-creation/optimizing-descriptions
- https://agentskills.io/client-implementation/adding-skills-support
