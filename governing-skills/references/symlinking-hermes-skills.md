# Symlinking ~/.hermes/skills to ~/.agents/skills

This reference covers the actual migration path used when the Hermes agent
skills directory needs to mirror the canonical `.agents/skills` tree.

## Problem

Bundled skills installed by the agent ship under `~/.hermes/skills/` (with a
`.hub/` metadata directory for curator state). Project-specific and
user-created canonical skills live under `~/.agents/skills/`. To avoid
duplication, `~/.hermes/skills` should be a symlink to the canonical tree.

## Pitfall: `ln -s` creates INSIDE an existing directory

If `~/.hermes/skills` is still a real directory (not yet removed), running:

```bash
ln -s ~/.agents/skills ~/.hermes/skills
```

creates the symlink **at** `~/.hermes/skills/skills` (inside the
existing directory) rather than replacing the directory entry itself.

### Fix

Remove the directory first, then create the symlink:

```python
import os, shutil
path = '~/.hermes/skills'
shutil.rmtree(path)
os.symlink('~/.agents/skills', path)
```

Using Python avoids shell-level `rm -rf` guard blocks on some setups. Verify
afterward with `readlink <path>` and `ls <path>/ | wc -l`.

## Metadata Migration

The bundled `~/.hermes/skills/.hub/` directory contains:
- `audit.log`, `lock.json`, `taps.json` (curator state)
- `index-cache/`, `quarantine/` (skill discovery)

After replacing with a symlink to `~/.agents/skills`, copy `.hub/` into the
canonical target:

```bash
cp -a ~/.hermes/skills_bundled_backup/.hub ~/.agents/skills/.hub
```

Also copy manifest files: `.bundled_manifest`, `.curator_state`, `.usage.json`,
`.usage.json.lock`.

Note: a previous `cp -a .hub ~/.agents/skills/.hub` while the symlink was
broken created a nested `.hub/.hub` structure. Clean up with
`rm -rf ~/.agents/skills/.hub/.hub`.

## Validation

- `readlink ~/.hermes/skills` → `~/.agents/skills`
- `ls ~/.hermes/skills/<some-skill>/SKILL.md` → file exists
- Skill count matches `ls ~/.agents/skills/ | grep -v "^\." | wc -l`
