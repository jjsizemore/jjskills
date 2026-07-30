---
name: receiving-code-review
description: 'Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or not blind implementation'
---

# Post-Fix Review Iteration

After pushing review fixes to a PR, automated reviewers may post new inline
comments on the updated diff. These are NOT visible via `gh pr checks` or
`gh pr view` summary.

## Checklist

```bash
# 1. Fetch ALL inline comments (not just the first page)
gh api repos/{owner}/{repo}/pulls/{number}/comments | python3 -c "
import json, sys
from datetime import datetime, timezone
comments = json.load(sys.stdin)
# Filter to comments AFTER your fix push time
cutoff = datetime(2026, 6, 24, 18, 0, 0, tzinfo=timezone.utc)
new = [c for c in comments if datetime.fromisoformat(c['created_at'].replace('Z', '+00:00')) > cutoff]
for c in new:
    print(f'{c[\"user\"][\"login\"]} ({c[\"created_at\"]}) | {c[\"path\"]}:{c.get(\"line\", \"?\")}')
    print(f'  {c[\"body\"][:200]}')
if not new:
    print('No new comments since fix push.')
"

# 2. Check the overall review state
gh api repos/{owner}/{repo}/pulls/{number}/reviews | python3 -c "
import json, sys
reviews = json.load(sys.stdin)
for r in reviews:
    print(f'{r[\"user\"][\"login\"]} | {r[\"state\"]} | {r.get(\"submitted_at\", \"?\")}')
"
```

## Key Signals

- `chatgpt-codex-connector[bot]` is an automated reviewer that posts inline
  comments on each new push. Its comments are non-blocking (`COMMENTED` state)
  but may surface new P1/P2 issues on the updated diff.
- Inline comments have `isMinified: false` when active. If `isMinified: true`,
  the comment was resolved or the line was outdated.
- A green `gh pr checks` only means CI passed — it does NOT mean the review
  is approved or that no new inline comments exist.
