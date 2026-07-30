# Monorepo Staging Release Discovery

## Problem

In monorepos with independently-versioned packages (e.g., `backend/`, `desktop/`), staging releases use tags like `backend-v0.16.0-staging.5` and `desktop-v0.19.0-staging.5`. The agent must determine the correct commit range for release notes.

## Workflow

### Step 1: Identify the latest tags

```bash
git tag --sort=-creatordate | head -20
```

Look for `<package>-<version>-<release-type>.<iteration>` patterns.

### Step 2: Determine scope type

Ask the user (or infer from context) which scope they want:

| Scope | Base reference | Use case |
|-------|---------------|----------|
| Full staging since prod | `<package>-<X.Y.Z>` (last prod tag) | "What's new in staging overall?" |
| Latest iteration only | `<package>-<X.Y.Y-staging.N-1>` (previous staging tag) | "What changed since last staging push?" |

### Step 3: Dump and categorize commits

```bash
# Full body dump for batch review
git log <base>..<head> --format="%B---COMMIT---" --no-merges

# Quick summary
git log <base>..<head> --oneline --no-merges

# Count
git log <base>..<head> --oneline --no-merges | wc -l
```

### Step 4: Filter by prefix

Common prefixes and their treatment:

| Prefix | Typical user impact | Include? |
|--------|-------------------|----------|
| `feat(desktop):` / `feat(backend):` | High | Review body — yes if user-visible |
| `fix(desktop):` / `fix(backend):` | Medium-High | Review body — yes if user-visible |
| `chore(release):` | Low | Almost never (CI/tag-only) |
| `fix(release):` | Low | Sometimes (env wiring may affect feature availability) |
| `ci:` | None | No |
| `refactor:` | None | No |
| `test:` | None | No |
| `chore:` | None | No |

### Step 5: Extract detail for user-facing commits

```bash
git show <sha> --format="%B" --no-patch
```

## Pitfalls

- **env var wiring in `fix(release):`** — May appear internal but can unblock user-facing features (e.g., enabling a beta UI). Read the full body; if it references a feature flag that gates user-visible behavior, include it.
- **Stacked PRs** — The same feature may appear as multiple commits (initial PR + fix PR). Deduplicate in notes — describe the final user-visible capability once.
- **Desktop + backend coupling** — Some features span both packages (e.g., microphone gain boost in desktop + backend audio pipeline). Group under the primary user-facing package.
