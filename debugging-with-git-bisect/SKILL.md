---
name: debugging-with-git-bisect
description: 'Use when a known-good and known-bad revision plus a deterministic command can identify the first commit that introduced a regression.'
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable git history diagnosis leaf.
---

# Debugging With Git Bisect

## Safety

Use an isolated detached worktree. Do not mutate a dirty working tree. Verify
the good revision exits 0 and the bad revision exits nonzero before bisecting.

## Workflow

```bash
git bisect start
git bisect bad <bad-revision>
git bisect good <good-revision>
git bisect run <deterministic-wrapper>
```

Wrapper exit contract:

- `0`: bug absent
- `1` through `124`: bug present
- `125`: commit cannot be tested

Do not classify unrelated build, dependency, environment, or harness failures
as bad. Repair the harness or skip only genuinely untestable commits. If skips
leave multiple candidates, report ambiguity instead of inventing one culprit.

Before cleanup, save `git bisect log` and culprit diff. Verify independently:
parent/known-good passes, culprit fails, and the changed boundary causally
explains the observed behavior. For merge commits, test each relevant parent.

Always run `git bisect reset` and remove the isolated worktree. Deliver first
bad SHA, subject, proof commands/results, causal diff explanation, skipped
commits, ambiguity, and saved bisect log.

Read `references/pressure-scenarios.md` when changing this skill.
